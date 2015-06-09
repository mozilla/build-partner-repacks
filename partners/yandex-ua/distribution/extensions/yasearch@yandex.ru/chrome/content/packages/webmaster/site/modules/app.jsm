"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const MINIMUM_DELAY_MS = 5000;
    const MAX_UPDATE_ERROR_MS = 3600000;
    let timers = Object.create(null);
    function metrikaURL(url) {
        function leadingZero(value) {
            return ("0" + value).substr(-2, 2);
        }
        return function (params) {
            let d1 = new Date(Date.now() - 518400 * 1000);
            let d2 = new Date();
            let d1Str = d1.getFullYear() + leadingZero(d1.getMonth() + 1) + leadingZero(d1.getDate());
            let d2Str = d2.getFullYear() + leadingZero(d2.getMonth() + 1) + leadingZero(d2.getDate());
            return url.replace("{date1}", d1Str).replace("{date2}", d2Str).replace("{PARAMS}", params || "");
        };
    }
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: false,
        statName: "site",
        navigateUrl: {
            tcy: "http://webmaster.yandex.ru/site/?host={PARAM}",
            pages: "http://webmaster.yandex.ru/site/indexed-pages.xml?host={PARAM}",
            snippets: "http://webmaster.yandex.ru/site/ext_plugins.xml?host={PARAM}",
            metrika: metrikaURL("http://metrika.yandex.ru/stat/traffic/summary/?goal_id=&reverse=&per_page=500&table_mode=&filter=&date1={date1}&date2={date2}&group=day&{PARAMS}")
        }
    };
    app.init = function () {
        this.module = this.importModule("api");
        this.module.init({
            api: this.api,
            onUpdate: this.onUpdate.bind(this)
        });
        this._authManager = this.api.Passport;
        this._authManager.addListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
        if (this.isAuth()) {
            this.module.configure("user", this._authManager.defaultAccount.uid);
        }
    };
    app.finalize = function () {
        this._cancelUpdateTimer();
        this._authManager.removeListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
    };
    app.dayuseStatProvider = {
        isAuthorized: function () {
            return app._authManager.isAuthorized();
        },
        hasSavedLogins: function () {
            return app._authManager.hasSavedLogins();
        }
    };
    app.instancePrototype = {
        init: function () {
            app.updateData(this.WIID);
        },
        finalize: function () {
            app._cleanData(this.WIID);
        },
        _notifySettingsChanges: function (action, instanceId) {
            common.observerService.notify(action, JSON.stringify({ wiid: instanceId }));
        },
        onSettingChange: function (key, value, instanceId) {
            switch (key) {
            case "show-sitename":
            case "customSitename":
                this._notifySettingsChanges("label", instanceId);
                break;
            case "show-warning":
                this._notifySettingsChanges("tooltipwarns", instanceId);
                break;
            case "selectedSitenameSetting":
                app._cleanData(instanceId);
                app.updateData(instanceId, true);
                break;
            case "updateInterval":
                let updateInterval = app.module.getUpdateInterval(this.WIID, true) * 1000;
                let lastUpdate = app.module.getLastUpdateTime(this.WIID);
                let delay = updateInterval - (Date.now() - lastUpdate);
                delay = Math.max(delay, MINIMUM_DELAY_MS);
                app._cleanData(this.WIID);
                app._setUpdateTimer(this.WIID, delay);
                break;
            }
        }
    };
    app.uiCommands = {
        auth: function (command, eventInfo) {
            let url = "http://passport.yandex.ru/passport?retpath=";
            let wiid = eventInfo.widget && eventInfo.widget.WIID;
            let str = "http://metrika.yandex.ru/";
            if (this.api.Settings.getValue("metrikaSaveId", wiid)) {
                str = "http://metrika.yandex.ru/stat/dashboard/?counter_id=" + this.api.Settings.getValue("metrikaSaveId", wiid);
            } else if (this.api.Settings.getValue("masterSaveId", wiid)) {
                str = "http://webmaster.yandex.ru/site/?host=" + this.api.Settings.getValue("masterSaveId", wiid);
            }
            url += encodeURIComponent(str);
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        },
        update: function (command, eventInfo) {
            let widget = eventInfo.widget;
            widget._setIcon();
            this.updateData(widget.WIID, true);
        },
        go: function (command, eventInfo) {
            let wiid = eventInfo.widget && eventInfo.widget.WIID;
            if (!wiid) {
                return;
            }
            let siteName = this.api.Settings.getValue("selectedSitenameSetting", wiid);
            let data = this.getUserData(wiid);
            let url = "http://metrika.yandex.ru";
            let metrikaSavedId = this.api.Settings.getValue("metrikaSaveId", wiid);
            let masterSavedId = this.api.Settings.getValue("masterSaveId", wiid);
            if (metrikaSavedId) {
                url = "http://metrika.yandex.ru/stat/dashboard/?counter_id=" + metrikaSavedId;
            } else if (masterSavedId) {
                url = "http://webmaster.yandex.ru/site/?host=" + masterSavedId;
            }
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        }
    };
    app.updateData = function (aWIID, manual, force) {
        this._cancelUpdateTimer(aWIID);
        if (!this.isAuth()) {
            this._onLogout();
            return;
        }
        if (manual) {
            force = true;
            common.observerService.notify("throbber", aWIID ? JSON.stringify({
                wiid: aWIID,
                value: true
            }) : null);
        }
        if (!aWIID) {
            let widgets = this.api.Controls.getAllWidgetItems();
            widgets.forEach(function update_updater(item) {
                this.module.update(item.WIID, force);
            }.bind(this));
        } else {
            this.module.update(aWIID, force);
        }
    };
    app.isAuth = function () {
        return this._authManager.isAuthorized();
    };
    app.getUserData = function (aWIID, aAction) {
        return this.module.getUserData(aWIID, aAction);
    };
    app.onUpdate = function (aWIID) {
        let notificationObject = aWIID ? JSON.stringify({ wiid: aWIID }) : null;
        common.observerService.notify("throbber", notificationObject);
        common.observerService.notify("display", notificationObject);
    };
    app._cleanData = function (aWIID) {
        this.module.cleanData(aWIID);
    };
    app._setUpdateTimer = function (aWIID, aDelay) {
        this._cancelUpdateTimer(aWIID);
        if (typeof aDelay == "undefined") {
            aDelay = MINIMUM_DELAY_MS;
        }
        timers[aWIID] = this.api.SysUtils.Timer(this.updateData.bind(this, aWIID, false, true), aDelay);
    };
    app._cancelUpdateTimer = function (aWIID) {
        function cancelTimer(aWIID) {
            let timer = timers[aWIID];
            if (timer) {
                timer.cancel();
                timers[aWIID] = null;
            }
        }
        if (aWIID) {
            cancelTimer(aWIID);
            return;
        }
        for (let wiid in timers) {
            cancelTimer(wiid);
        }
    };
    app._onLogin = function (aDefaultAccountUid) {
        this.module.configure("user", aDefaultAccountUid);
        this.updateData();
    };
    app._onLogout = function () {
        this._cleanData();
        this.onUpdate();
    };
    app._onAuthStateChanged = function (aData) {
        if (!aData.accounts.length) {
            this._onLogout();
            return;
        }
        this._onLogin(aData.defaultAccount.uid);
    };
    app.observe = function (aSubject, aTopic, aData) {
        if (aTopic === this._authManager.EVENTS.AUTH_STATE_CHANGED) {
            this._onAuthStateChanged(aData);
        }
    };
};
