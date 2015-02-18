"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const MINIMUM_DELAY_MS = 5000;
    const MAX_UPDATE_ERROR_MS = 3600000;
    let timers = Object.create(null);
    let yauthMgr = null;
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        statName: "metrika",
        navigateUrl: {
            home: "https://metrika.yandex.ru/",
            auth: "http://passport.yandex.ru/passport?mode=auth&retpath=http%3A%2F%2Fmetrika.yandex.ru",
            add: "https://metrika.yandex.ru/add/"
        }
    };
    app.init = function metrika_init() {
        this.module = this.importModule("api");
        this.module.init({
            api: this.api,
            onUpdate: this.onUpdate.bind(this)
        });
        let yauthTimer = null;
        yauthMgr = app.commonModule("yauth");
        yauthMgr.init(function yauthMgr_init(login) {
            if (yauthTimer) {
                yauthTimer.cancel();
                yauthTimer = null;
            }
            if (login && !yauthMgr.userLogin) {
                yauthTimer = common.timers.setTimeout(yauthMgr_init.bind(this, login), 50);
                return;
            }
            if (login) {
                this.onLogin();
            }
            this.updateData();
        }, this);
        if (this.isAuth()) {
            this.module.configure("user", yauthMgr.userLogin);
        }
    };
    app.finalize = function metrika_finalize() {
        this._cancelUpdateTimer();
        yauthMgr = null;
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://passport.yandex.ru" }) || common.loginManager.hasSavedLogins({ formSubmitURL: "https://passport.yandex.ua" }) || common.loginManager.hasSavedLogins({ formSubmitURL: "https://passport.yandex.com.tr" });
        }
    };
    app.instancePrototype = {
        init: function metrika_instancePrototype_init() {
            app.updateData(this.WIID);
        }
    };
    app.uiCommands = {
        update: function metrika_uiCommands_update(command, eventInfo) {
            this.updateData(this.WIID, true);
        },
        go: function metrika_uiCommands_go(command, eventInfo) {
            let cid = eventInfo.param;
            let url = "https://metrika.yandex.ru/stat/?counter_id=" + cid;
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        }
    };
    app.onSettingChange = function metrika_onSettingChange(key, value, instanceId) {
        switch (key) {
        case "update-interval":
            let updateInterval = this.module.getUpdateInterval(this.WIID, true) * 1000;
            let lastUpdate = this.module.getLastUpdateTime(this.WIID);
            let delay = updateInterval - (Date.now() - lastUpdate);
            delay = Math.max(delay, MINIMUM_DELAY_MS);
            this.cleanData(this.WIID);
            this._setUpdateTimer(this.WIID, delay);
            break;
        }
    };
    app._cancelUpdateTimer = function metrika_cancelTimer(aWIID) {
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
    app._setUpdateTimer = function metrika__setUpdateTimer(aWIID, aDelay) {
        this._cancelUpdateTimer(aWIID);
        if (typeof aDelay == "undefined") {
            aDelay = MINIMUM_DELAY_MS;
        }
        timers[aWIID] = new this.api.SysUtils.Timer(this.updateData.bind(this, aWIID, false, true), aDelay);
    };
    app.updateData = function metrika_updateData(aWIID, manual, force) {
        this._cancelUpdateTimer(aWIID);
        if (!this.isAuth()) {
            this.onLogout();
            this.onUpdate();
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
    app.isAuth = function metrika_isAuth() {
        return yauthMgr.isAuth();
    };
    app.getUserData = function metrika_getUserData(aWIID, aAction) {
        return this.module.getUserData(aWIID, aAction);
    };
    app.cleanData = function metrika_cleanData(aWIID) {
        this.module.cleanData(aWIID);
    };
    app.onLogin = function metrika_onLogin() {
        this.module.configure("user", yauthMgr.userLogin);
    };
    app.onLogout = function metrika_onLogout() {
        this.cleanData();
    };
    app.onUpdate = function metrika_onUpdate(aWIID) {
        let notificationObject = aWIID ? JSON.stringify({ wiid: aWIID }) : null;
        common.observerService.notify("throbber", notificationObject);
        common.observerService.notify("display", notificationObject);
    };
};
