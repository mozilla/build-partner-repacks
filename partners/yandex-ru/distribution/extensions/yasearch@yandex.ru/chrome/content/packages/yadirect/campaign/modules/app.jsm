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
        uniqueWidget: false,
        statName: "campaign",
        navigateUrl: {
            home: "http://direct.yandex.ru",
            camp: "http://direct.yandex.ru/registered/main.pl",
            sincdebt: "http://balance.yandex.ru/invoices.xml?service_cc=PPC&ref_service_id=7"
        }
    };
    app.init = function campaign_init() {
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
    app.finalize = function campaign_finalize() {
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
        init: function campaign_instancePrototype_init() {
            app.updateData(this.WIID);
        },
        finalize: function campaign_instansePrototype_finalize() {
            app.cleanData(this.WIID);
        },
        onSettingChange: function campaign_onSettingChange(key, value, instanceId) {
            switch (key) {
            case "campaign":
                app.updateData(this.WIID, true);
                break;
            case "update-interval":
                let updateInterval = app.module.getUpdateInterval(this.WIID, true) * 1000;
                let lastUpdate = app.module.getLastUpdateTime(this.WIID);
                let delay = updateInterval - (Date.now() - lastUpdate);
                delay = Math.max(delay, MINIMUM_DELAY_MS);
                app.cleanData(this.WIID);
                app._setUpdateTimer(this.WIID, delay);
                break;
            }
        }
    };
    app.uiCommands = {
        update: function campaign_uiCommands_update(command, eventInfo) {
            this.updateData(eventInfo.widget.WIID, true);
        },
        camp: function campaign_uiCommands_camp(command, eventInfo) {
            let url = "http://direct.yandex.ru/registered/main.pl";
            let cid = parseInt(this.api.Settings.getValue("campaign", eventInfo.widget.WIID), 10);
            cid = cid ? cid : this.directInfo && this.directInfo.campNumber || null;
            if (cid) {
                url += "?cmd=showCamp&cid=" + cid;
            }
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        },
        pay: function campaign_uiCommands_pay(command, eventInfo) {
            let url = "http://direct.yandex.ru/registered/main.pl";
            let cid = parseInt(this.api.Settings.getValue("campaign", eventInfo.widget.WIID), 10);
            cid = cid ? cid : this.directInfo && this.directInfo.campNumber || null;
            if (cid) {
                url += "?cmd=pay&cid=" + cid;
            }
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        },
        auth: function campaign_uiCommands_auth(command, eventInfo) {
            let url = "http://passport.yandex.ru/passport?mode=auth&retpath=http%3A%2F%2Fdirect.yandex.ru%2Fregistered%2Fmain.pl";
            let cid = parseInt(this.api.Settings.getValue("campaign", eventInfo.widget.WIID), 10);
            cid = cid ? cid : this.directInfo && this.directInfo.campNumber || null;
            if (cid) {
                url += "%3Fcmd=showCamp%26cid=" + cid;
            }
            this.api.Controls.navigateBrowser({
                unsafeURL: url,
                eventInfo: eventInfo.event
            });
        }
    };
    app._cancelUpdateTimer = function campaign_cancelTimer(aWIID) {
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
    app._setUpdateTimer = function campaign__setUpdateTimer(aWIID, aDelay) {
        this._cancelUpdateTimer(aWIID);
        if (typeof aDelay == "undefined") {
            aDelay = MINIMUM_DELAY_MS;
        }
        timers[aWIID] = new this.api.SysUtils.Timer(this.updateData.bind(this, aWIID, false, true), aDelay);
    };
    app.updateData = function campaign_updateData(aWIID, manual, force) {
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
    app.isAuth = function campaign_isAuth() {
        return yauthMgr.isAuth();
    };
    app.getUserData = function campaign_getUserData(aWIID, aAction) {
        return this.module.getUserData(aWIID, aAction);
    };
    app.cleanData = function campaign_cleanData(aWIID) {
        this.module.cleanData(aWIID);
    };
    app.onLogin = function campaign_onLogin() {
        this.module.configure("user", yauthMgr.userLogin);
    };
    app.onLogout = function campaign_onLogout() {
        this.cleanData();
    };
    app.onUpdate = function campaign_onUpdate(aWIID) {
        let notificationObject = aWIID ? JSON.stringify({ wiid: aWIID }) : null;
        common.observerService.notify("throbber", notificationObject);
        common.observerService.notify("display", notificationObject);
    };
};
