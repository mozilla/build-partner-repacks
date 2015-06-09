"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const MINIMUM_DELAY_MS = 5000;
    const MAX_UPDATE_ERROR_MS = 3600000;
    let timers = Object.create(null);
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
            return app.isAuth();
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
            app.cleanData(this.WIID);
        },
        onSettingChange: function (key, value, instanceId) {
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
        update: function (command, eventInfo) {
            this.updateData(eventInfo.widget.WIID, true);
        },
        camp: function (command, eventInfo) {
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
        pay: function (command, eventInfo) {
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
        auth: function (command, eventInfo) {
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
    app.cleanData = function (aWIID) {
        this.module.cleanData(aWIID);
    };
    app.onUpdate = function (aWIID) {
        let notificationObject = aWIID ? JSON.stringify({ wiid: aWIID }) : null;
        common.observerService.notify("throbber", notificationObject);
        common.observerService.notify("display", notificationObject);
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
    app._cleanData = function (aWIID) {
        this.module.cleanData(aWIID);
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
