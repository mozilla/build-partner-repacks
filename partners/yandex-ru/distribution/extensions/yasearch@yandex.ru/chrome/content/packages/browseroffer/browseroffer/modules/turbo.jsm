"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const SUGGEST_SESSION_SETTING_NAME = "turbo-video.suggest-session";
var module = function (app, common) {
    let browserofferTurbo = {
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
            this._app = null;
        },
        shouldMonitor: function () {
            if (this._areSuggestSessionsDepleted()) {
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
        handleUserAction: function () {
            this._switchToSilentMode();
            common.observerService.notify("close-notification", "turbo");
            this._trackCurrentMode(true);
        },
        _active: false,
        _settings: Object.create(null),
        _activationTimer: null,
        get _silentPeriod() {
            return 7 * 24 * 60 * 60 * 1000;
        },
        get _suggestPeriod() {
            return 60 * 60 * 1000;
        },
        _initSettingsValues: function () {
            let suggestSession = this._getSuggestSessionFromPrefs();
            if (!isObject(suggestSession)) {
                suggestSession = Object.create(null);
            }
            if (isNaN(suggestSession.counter)) {
                suggestSession.counter = 0;
            }
            if (isNaN(suggestSession.timestamp)) {
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
                return null;
            }
        },
        _saveSuggestSessionToPrefs: function (aData) {
            try {
                this.app.setPref(SUGGEST_SESSION_SETTING_NAME, aData);
            } catch (e) {
                this.app.log("Saving suggest session failed. msg:" + e.message);
            }
        },
        _restoreCurrentMode: function () {
            if (this._isSuggestPeriod()) {
                this._active = true;
                this._switchToSilentModeIfSuggestExpired();
            }
            if (this._isSilentPeriod()) {
                if (this._isPeriodExpired("silent")) {
                    this._active = true;
                } else {
                    this._setActivationTimer();
                }
            }
        },
        _setActivationTimer: function () {
            this._clearActivationTimer();
            let delay = this._getPeriodExpirationTime("silent") - Date.now();
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
        _checkPrerequisites: function () {
            if (this._isSuitableBranding() && this._isSuitableOS() && !this._areSuggestSessionsDepleted()) {
                return true;
            }
            this.shouldMonitor = function () {
                return false;
            };
            return false;
        },
        _trackCurrentMode: function (aNotifyStateChanged) {
            let stateChanged = false;
            if (this._isSuggestPeriod()) {
                if (this._switchToSilentModeIfSuggestExpired()) {
                    stateChanged = !stateChanged;
                }
            }
            if (this._isSilentPeriod()) {
                if (this._switchToSuggestModeIfSilentExpired()) {
                    stateChanged = !stateChanged;
                }
            }
            if (!this._active) {
                this._setActivationTimer();
            }
            if (stateChanged || aNotifyStateChanged) {
                this._notifyMonitorStateChanged();
            }
        },
        _switchToSilentModeIfSuggestExpired: function () {
            let expirationTime = this._getPeriodExpirationTime("suggest");
            if (Date.now() > expirationTime) {
                this._switchToSilentMode(expirationTime);
                return true;
            }
            return false;
        },
        _switchToSuggestModeIfSilentExpired: function () {
            if (this._isPeriodExpired("silent")) {
                return this._switchToSuggestModeIfAvailable();
            }
            return false;
        },
        _isPeriodExpired: function (aPeriodName) {
            return Date.now() > this._getPeriodExpirationTime(aPeriodName);
        },
        _getPeriodExpirationTime: function (aPeriodName) {
            let eclipsePeriod;
            let periodStartTime;
            switch (aPeriodName) {
            case "silent":
                eclipsePeriod = this._silentPeriod;
                periodStartTime = this._getSilentStartTime();
                break;
            case "suggest":
                eclipsePeriod = this._suggestPeriod;
                periodStartTime = this._getSuggestStartTime();
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
        _switchToSuggestModeIfAvailable: function () {
            if (this._areSuggestSessionsDepleted()) {
                return false;
            }
            this._switchToSuggestMode();
            return true;
        },
        _switchToSilentMode: function (aSinceTimestamp) {
            this._settings.timestamp = aSinceTimestamp || Date.now();
            this._settings.counter++;
            this._active = false;
            log("Pause turbo video suggest. SinceTimestamp:" + this._settings.timestamp);
        },
        _switchToSuggestMode: function () {
            this._settings.timestamp = -Date.now();
            this._active = true;
            log("Start turbo video suggest. Timestamp:" + this._settings.timestamp);
        },
        _isSuitableBranding: function () {
            return this.app.api.Environment.branding.brandID === "yandex";
        },
        _isSuitableOS: function () {
            return this.app.api.Environment.os.name !== "linux";
        },
        _areSuggestSessionsDepleted: function () {
            return this._getSuggestSessionsNumber() >= 3;
        },
        _isSuggestPeriod: function () {
            return this._settings.timestamp < 0;
        },
        _isSilentPeriod: function () {
            return this._settings.timestamp >= 0;
        },
        _getSilentStartTime: function () {
            if (!this._isSilentPeriod()) {
                return;
            }
            return this._settings.timestamp;
        },
        _getSuggestStartTime: function () {
            if (!this._isSuggestPeriod()) {
                return;
            }
            return -this._settings.timestamp;
        },
        _getSuggestSessionsNumber: function () {
            return this._settings.counter;
        },
        _notifyMonitorStateChanged: function () {
            this.app.onMonitorStateChanged("turbo");
        }
    };
    function isObject(aObj) {
        return aObj && typeof aObj === "object" && !Array.isArray(aObj);
    }
    function log(msg) {
        app.log(msg);
    }
    return browserofferTurbo;
};
