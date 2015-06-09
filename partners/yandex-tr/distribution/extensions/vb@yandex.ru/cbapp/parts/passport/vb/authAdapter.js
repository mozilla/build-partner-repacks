"use strict";
const EXPORTED_SYMBOLS = ["authAdapter"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
let misc;
let utils;
const authAdapter = {
    get TRIGGER_URL() {
        return "http://element.yandex.ru/vb/retpath=passport/";
    },
    init: function (aApplication) {
        if (this._initialized) {
            return;
        }
        misc = aApplication.core.Lib.misc;
        utils = aApplication.core.Lib.utils;
        this._application = aApplication;
        Services.obs.addObserver(this, "http-on-modify-request", false);
        this._initMessageManagement();
        this._initialized = true;
    },
    finalize: function () {
        Services.obs.removeObserver(this, "http-on-modify-request", false);
        this._finalizeMessageManagement();
        this._initialized = false;
    },
    openAuthDialog: function (dialogParams = {}) {
        let authManager = this._application.passport.authManager;
        let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/auth";
        let data = { retpath: this.TRIGGER_URL + "?stay=true" };
        if (dialogParams.login) {
            data.login = dialogParams.login;
        }
        if (dialogParams.retpath) {
            data.retpath = dialogParams.retpath;
        }
        let params = [];
        for (let [
                    key,
                    val
                ] in Iterator(data)) {
            params.push(key + "=" + encodeURIComponent(val));
        }
        misc.navigateBrowser({
            url: url + "?" + params.join("&"),
            target: "current tab"
        });
    },
    openLogoutDialog: function () {
        let authManager = this._application.passport.authManager;
        let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=logout";
        let yuidCookieValue = authManager.getYUIDValue() || "";
        let data = {
            retpath: this.TRIGGER_URL + "?stay=true&logout=all",
            yu: yuidCookieValue
        };
        let params = [];
        for (let [
                    key,
                    val
                ] in Iterator(data)) {
            params.push(key + "=" + encodeURIComponent(val));
        }
        misc.navigateBrowser({
            url: url + "&" + params.join("&"),
            target: "current tab"
        });
    },
    sendAuthStatistics: function (action, counter) {
        counter = counter || 1;
        let statKey = "";
        switch (action) {
        case "login":
            statKey = "auth.done.total";
            break;
        case "logout":
            statKey = "auth.exit.total";
            break;
        default:
            return;
        }
        for (let i = 0; i < counter; i++) {
            this._application.fastdial.sendClickerRequest(statKey);
        }
    },
    _onModifyRequest: function (aChannel) {
        try {
            aChannel.QueryInterface(Ci.nsIHttpChannel);
        } catch (e) {
            return;
        }
        if (aChannel.URI.spec.indexOf(this.TRIGGER_URL) !== 0) {
            return;
        }
        aChannel.cancel(Cr.NS_BINDING_ABORTED);
        let url = aChannel.URI;
        try {
            url.QueryInterface(Ci.nsIURL);
        } catch (e) {
        }
        let interestingParams = {};
        let params = url.query && url.query.split("&") || [];
        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            let [
                key,
                value
            ] = param.split("=");
            value = decodeURIComponent(value);
            if (key === "status") {
                interestingParams.status = value;
            }
            if (key === "url") {
                interestingParams.errorURL = value;
            }
            if (key == "stay" && value == "true") {
                interestingParams.stay = true;
            }
            if (key == "logout" && value == "all") {
                interestingParams.wasLogoutAll = true;
            }
        }
        let status = interestingParams.status;
        let errorDetected = false;
        if (status && !(status === "ok" || status === "action-not-required")) {
            let authManager = this._application.passport.authManager;
            let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport";
            if (status === "other" && interestingParams.errorURL) {
                url = interestingParams.errorURL;
            }
            misc.navigateBrowser({
                unsafeURL: url,
                target: "new tab"
            });
            errorDetected = true;
            return;
        }
        if (!interestingParams.stay || errorDetected) {
            this._globalMM.broadcastAsyncMessage(this._application.name + "@yandex.ru:authManager:whoIsAuthTab");
            return;
        }
        if (!interestingParams.wasLogoutAll) {
            this._application.fastdial.sendClickerRequest("auth.done.vb");
        }
        misc.navigateBrowser({
            url: "yafd:tabs",
            target: "current tab"
        });
    },
    _initMessageManagement: function () {
        this._globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        this._globalMM.addMessageListener(this._application.name + "@yandex.ru:authManager:authTab", this);
    },
    _finalizeMessageManagement: function () {
        this._globalMM.removeMessageListener(this._application.name + "@yandex.ru:authManager:authTab", this);
    },
    _getTabForBrowser: function (aBrowser) {
        let gBrowser = aBrowser.ownerDocument.defaultView.getBrowser();
        for (let i = 0; i < gBrowser.tabs.length; i++) {
            let tab = gBrowser.tabs[i];
            if (tab.linkedBrowser === aBrowser) {
                return tab;
            }
        }
        return null;
    },
    receiveMessage: function (aMessage) {
        let {
            name,
            data,
            target: browser,
            objects
        } = aMessage;
        let tab = this._getTabForBrowser(browser);
        if (!tab) {
            return;
        }
        browser.ownerDocument.defaultView.getBrowser().removeTab(tab);
    },
    observe: function (subject, topic, data) {
        if (topic == "http-on-modify-request") {
            this._onModifyRequest(subject);
        }
    }
};
