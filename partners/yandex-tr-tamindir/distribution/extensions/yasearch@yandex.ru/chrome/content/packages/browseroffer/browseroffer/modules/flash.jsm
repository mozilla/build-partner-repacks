"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const SUGGEST_SESSION_SETTING_NAME = "no-flash.suggest-session";
const PERIODS = {
    SUGGEST: "suggest",
    SILENCE: "silence"
};
var module = function (app, common) {
    let browserofferFlash = {
        get app() {
            return this._app;
        },
        init: function (application) {
            this._app = application;
            this._initSettingsValues();
            if (!this._checkPrerequisites()) {
                return;
            }
            this._restoreCurrentMode();
        },
        finalize: function () {
            this._saveSettingsValues();
            this._clearActivationTimer();
            this._app = null;
        },
        shouldMonitor: function () {
            if (this._isFlashPluginInstalled()) {
                return false;
            }
            return this._active;
        },
        shouldSuggest: function () {
            if (!this._active) {
                return false;
            }
            if (this.app.api.Integration.yandexBrowser.isDefault === true) {
                return false;
            }
            this._trackCurrentMode();
            return this._active;
        },
        handleUserAction: function (aAction) {
            if ([
                    "close",
                    "more-info",
                    "run"
                ].indexOf(aAction) < 0) {
                log("Irrelevant user action: " + aAction);
                return;
            }
            if (aAction === "run") {
                return;
            }
            if (aAction !== "more-info") {
                if (++this._settings.closedCounter < 3) {
                    return;
                }
            }
            this._switchToSilentMode();
            common.observerService.notify("close-notification", "flash");
            this._trackCurrentMode(true);
        },
        _active: false,
        _settings: Object.create(null),
        _activationTimer: null,
        get _silentPeriod() {
            return 7 * 24 * 3600 * 1000;
        },
        _checkPrerequisites: function () {
            if (this._isSuitableOS() && !this._areSuggestSessionsDepleted()) {
                return true;
            }
            this.shouldMonitor = function () {
                return false;
            };
            return false;
        },
        _initSettingsValues: function () {
            let suggestSession = this._getSuggestSessionFromPrefs();
            if (!isObject(suggestSession)) {
                suggestSession = Object.create(null);
            }
            if (isNaN(suggestSession.closedCounter)) {
                suggestSession.closedCounter = 0;
            }
            if (isNaN(suggestSession.timestamp) || suggestSession.timestamp < 0) {
                suggestSession.timestamp = 0;
            }
            this._settings = suggestSession;
        },
        _saveSettingsValues: function () {
            let suggestSession = {};
            try {
                suggestSession = JSON.stringify(this._settings);
            } catch (e) {
                this.app.log("Suggest session serializing failed. msg:" + e.message);
            }
            this._saveSuggestSessionToPrefs(suggestSession);
        },
        _getSuggestSessionFromPrefs: function () {
            try {
                return JSON.parse(this.app.getPref(SUGGEST_SESSION_SETTING_NAME, undefined));
            } catch (e) {
                this.app.log("Get suggest session from settings failed. msg:" + e.message);
            }
            return null;
        },
        _saveSuggestSessionToPrefs: function (aData) {
            try {
                this.app.setPref(SUGGEST_SESSION_SETTING_NAME, aData);
            } catch (e) {
                this.app.log("Saving suggest session failed. msg:" + e.message);
            }
        },
        _restoreCurrentMode: function () {
            if (this._isSilentPeriod()) {
                if (this._isPeriodExpired(PERIODS.SILENCE)) {
                    this._active = true;
                } else {
                    this._setActivationTimer();
                }
            }
        },
        _isSuggestPeriod: function () {
            return this._active;
        },
        _isSilentPeriod: function () {
            return !this._active;
        },
        _isPeriodExpired: function (aPeriodName) {
            return Date.now() > this._getPeriodExpirationTime(aPeriodName);
        },
        _getPeriodExpirationTime: function (aPeriodName) {
            let eclipsePeriod;
            let periodStartTime;
            switch (aPeriodName) {
            case PERIODS.SILENCE:
                eclipsePeriod = this._silentPeriod;
                periodStartTime = this._getSilentStartTime();
                break;
            default:
                return;
            }
            if (typeof periodStartTime !== "number") {
                return;
            }
            let now = Date.now();
            let delta = Math.abs(now - periodStartTime) - eclipsePeriod;
            return now - delta;
        },
        _switchToSuggestModeIfSilentExpired: function () {
            if (this._isPeriodExpired(PERIODS.SILENCE)) {
                return this._switchToSuggestModeIfAvailable();
            }
            return false;
        },
        _switchToSuggestModeIfAvailable: function () {
            if (this._areSuggestSessionsDepleted()) {
                return false;
            }
            this._switchToSuggestMode();
            return true;
        },
        _switchToSilentMode: function (aSinceTimestamp) {
            this._settings.timestamp = aSinceTimestamp || Date.now();
            this._settings.closedCounter = 0;
            this._active = false;
            log("Pause no flash suggest. SinceTimestamp:" + this._settings.timestamp);
        },
        _switchToSuggestMode: function () {
            this._settings.closedCounter = 0;
            this._active = true;
            log("Start no flash suggest. Timestamp:" + this._settings.timestamp);
        },
        _getSilentStartTime: function () {
            if (!this._isSilentPeriod()) {
                return;
            }
            return this._settings.timestamp;
        },
        _areSuggestSessionsDepleted: function () {
            return false;
        },
        _isSuitableOS: function () {
            return [
                "mac",
                "windows"
            ].indexOf(this.app.api.Environment.os.name) > -1;
        },
        _isFlashPluginInstalled: function () {
            let pluginHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
            return pluginHost.getPluginTags().some(aPlugin => aPlugin.name === "Shockwave Flash");
        },
        _trackCurrentMode: function (aNotifyStateChanged) {
            let stateChanged = false;
            if (this._isSuggestPeriod()) {
                return;
            }
            if (this._switchToSuggestModeIfSilentExpired()) {
                stateChanged = !stateChanged;
            }
            if (!this._active) {
                this._setActivationTimer();
            }
            if (stateChanged || aNotifyStateChanged) {
                this._notifyMonitorStateChanged();
            }
        },
        _setActivationTimer: function () {
            this._clearActivationTimer();
            let delay = this._getPeriodExpirationTime(PERIODS.SILENCE) - Date.now();
            if (delay < 0 || !delay) {
                delay = 0;
            }
            this._activationTimer = this.app.api.SysUtils.Timer(function () {
                if (this._areSuggestSessionsDepleted()) {
                    return;
                }
                this._active = true;
                this._notifyMonitorStateChanged();
            }.bind(this), delay);
        },
        _clearActivationTimer: function () {
            if (this._activationTimer) {
                this._activationTimer.cancel();
                this._activationTimer = null;
            }
        },
        _notifyMonitorStateChanged: function () {
            this.app.onMonitorStateChanged("flash");
        }
    };
    function isObject(aObj) {
        return aObj && typeof aObj === "object" && !Array.isArray(aObj);
    }
    function log(msg) {
        app.log(msg);
    }
    return browserofferFlash;
};
