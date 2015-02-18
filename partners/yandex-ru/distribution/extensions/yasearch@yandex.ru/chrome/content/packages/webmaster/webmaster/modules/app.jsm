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
        statName: "webmaster",
        navigateUrl: {
            home: "http://webmaster.yandex.ru",
            auth: "http://passport.yandex.ru/passport?retpath=http%3A%2F%2Fwebmaster.yandex.ru",
            spellcheck: "http://webmaster.yandex.ru/spellcheck.xml",
            analys: "http://webmaster.yandex.ru/robots.xml",
            addurl: "http://webmaster.yandex.ru/addurl.xml",
            regsearch: "http://webmaster.yandex.ru/compare_regions.xml",
            contentinfo: "http://content.webmaster.yandex.ru",
            go: "http://webmaster.yandex.ru/site/?host={PARAM}"
        }
    };
    app.init = function webmaster_init() {
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
    app.finalize = function webmaster_finalize() {
        yauthMgr = null;
        this._cancelUpdateTimer();
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
        init: function webmaster_instancePrototype_init() {
            app.updateData(this.WIID);
        }
    };
    app.uiCommands = {
        update: function webmaster_uiCommands_update(command, eventInfo) {
            this.updateData(this.WIID, true);
        }
    };
    app.onSettingChange = function webmaster_onSettingChange(key, value, instanceId) {
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
    app._cancelUpdateTimer = function webmaster_cancelTimer(aWIID) {
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
    app._setUpdateTimer = function webmaster__setUpdateTimer(aWIID, aDelay) {
        this._cancelUpdateTimer(aWIID);
        if (typeof aDelay == "undefined") {
            aDelay = MINIMUM_DELAY_MS;
        }
        timers[aWIID] = new this.api.SysUtils.Timer(this.updateData.bind(this, aWIID, false, true), aDelay);
    };
    app.updateData = function webmaster_updateData(aWIID, manual, force) {
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
    app.isAuth = function webmaster_isAuth() {
        return yauthMgr.isAuth();
    };
    app.getUserData = function webmaster_getUserData(aWIID, aAction) {
        return this.module.getUserData(aWIID, aAction);
    };
    app.cleanData = function webmaster_cleanData(aWIID) {
        this.module.cleanData(aWIID);
    };
    app.onLogin = function webmaster_onLogin() {
        this.module.configure("user", yauthMgr.userLogin);
    };
    app.onLogout = function webmaster_onLogout() {
        this.cleanData();
    };
    app.onUpdate = function webmaster_onUpdate(aWIID) {
        let notificationObject = aWIID ? JSON.stringify({ wiid: aWIID }) : null;
        common.observerService.notify("throbber", notificationObject);
        common.observerService.notify("display", notificationObject);
    };
};
