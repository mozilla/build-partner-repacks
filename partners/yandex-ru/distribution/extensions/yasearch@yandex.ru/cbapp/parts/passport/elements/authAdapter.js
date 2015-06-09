"use strict";
const EXPORTED_SYMBOLS = ["authAdapter"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const authAdapter = {
    get TRIGGER_URL() {
        return "http://element.yandex.ru/retpath=passport/";
    },
    init: function (aApplication) {
        if (this._initialized) {
            return;
        }
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
        let data = { retpath: authManager.authdefs.DOMAINS.DEFAULT_RETPATH };
        if (dialogParams.login) {
            data.login = dialogParams.login;
        }
        if (dialogParams.targetId) {
            data.retpath = data.retpath + "?t=" + encodeURIComponent(dialogParams.targetId);
            if (dialogParams.action) {
                data.retpath += "&a=" + dialogParams.action;
            }
        } else if (dialogParams.retpath) {
            data.retpath = dialogParams.retpath;
        }
        let params = [];
        for (let [
                    key,
                    val
                ] in Iterator(data)) {
            params.push(key + "=" + encodeURIComponent(val));
        }
        this._application.BarPlatform.navigateBrowser({
            url: url + "?" + params.join("&"),
            target: "new tab"
        });
    },
    openLogoutDialog: function () {
        let authManager = this._application.passport.authManager;
        let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=logout";
        let yuidCookieValue = authManager.getYUIDValue() || "";
        let data = {
            retpath: authManager.authdefs.DOMAINS.DEFAULT_RETPATH,
            yu: yuidCookieValue
        };
        let params = [];
        for (let [
                    key,
                    val
                ] in Iterator(data)) {
            params.push(key + "=" + encodeURIComponent(val));
        }
        this._application.BarPlatform.navigateBrowser({
            url: url + "&" + params.join("&"),
            target: "new tab"
        });
    },
    sendAuthStatistics: function (action, counter) {
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
            if (key == "t") {
                interestingParams.targetId = value;
            }
            if (key == "a") {
                interestingParams.action = value;
            }
            if (key == "status") {
                interestingParams.status = value;
            }
            if (key == "url") {
                interestingParams.errorURL = value;
            }
            if (key == "logout" && value == "true") {
                interestingParams.wasLogout = true;
            }
            if (key == "silent" && value == "true") {
                interestingParams.silent = true;
            }
        }
        this._globalMM.broadcastAsyncMessage(this._application.name + "@yandex.ru:authManager:whoIsAuthTab");
        let status = interestingParams.status;
        if (status && !(status == "ok" || status == "action-not-required")) {
            let url = this._application.passport.authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport";
            if (status == "other" && interestingParams.errorURL) {
                url = interestingParams.errorURL;
            }
            this._application.BarPlatform.navigateBrowser({
                unsafeURL: url,
                target: "new tab"
            });
            return;
        }
        if (interestingParams.wasLogout && !interestingParams.silent) {
            this._application.BarPlatform.navigateBrowser({
                url: this._application.passport.authManager.authdefs.DOMAINS.DEFAULT_RETPATH,
                target: "new tab"
            });
            return;
        }
        if (interestingParams.targetId) {
            let chromeWindow = this._application.core.Lib.misc.mostRecentBrowserWindow;
            let target = chromeWindow.document.getElementById(interestingParams.targetId);
            if (target) {
                if ("onAuthCommand" in target) {
                    target.onAuthCommand(interestingParams.action);
                }
            }
        }
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
