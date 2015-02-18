"use strict";
const EXPORTED_SYMBOLS = ["authAdapter"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu,
    manager: Cm
} = Components;
const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const TRIGGER_URL = "http://element.yandex.ru/retpath=passport/";
let pwdMgr;
let api;
let authdefs;
let utils;
const authAdapter = {
    get authManager() {
        return authManager;
    },
    get authdefs() {
        return authManager.authdefs;
    },
    init: function authAdapter_init(aApi) {
        if (this._initialized) {
            return;
        }
        this._api = api = aApi;
        authdefs = importScript("authdefs", "common-auth/authdefs.jsm");
        utils = importScript("utils", "common-auth/utils.jsm");
        loadScript("common-auth/auth-manager.js");
        authManager.init(api);
        Services.obs.addObserver(this, "http-on-modify-request", false);
        this._initialized = true;
    },
    _onModifyRequest: function authAdapter__onModifyRequest(aChannel) {
        try {
            aChannel.QueryInterface(Ci.nsIHttpChannel);
        } catch (e) {
            return;
        }
        if (aChannel.URI.spec.indexOf(TRIGGER_URL) !== 0) {
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
        }
        let DOMWindow = utils.getDOMWindowForChannel(aChannel);
        let browser = utils.getBrowserForDOMWindow(DOMWindow);
        let chromeWindow = utils.getChromeWindowForDOMWindow(DOMWindow);
        if (chromeWindow) {
            let gBrowser = chromeWindow.getBrowser();
            let browser = gBrowser.getBrowserForDocument(DOMWindow.document) || null;
            if (browser) {
                for (let i = 0; i < gBrowser.tabs.length; i++) {
                    let tab = gBrowser.tabs[i];
                    if (tab.linkedBrowser == browser) {
                        gBrowser.removeTab(tab);
                        break;
                    }
                }
            }
        }
        let status = interestingParams.status;
        if (status && !(status == "ok" || status == "action-not-required")) {
            let url = this.authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport";
            if (status == "other" && interestingParams.errorURL) {
                url = interestingParams.errorURL;
            }
            api.Controls.navigateBrowser({
                unsafeURL: url,
                target: "new tab"
            });
            return;
        }
        if (interestingParams.wasLogout) {
            api.Controls.navigateBrowser({
                url: "http://" + this.authManager.authdefs.DOMAINS.MAIN_DOMAIN,
                target: "new tab"
            });
            return;
        }
        if (interestingParams.targetId) {
            let target = chromeWindow.document.getElementById(interestingParams.targetId);
            if (target) {
                if ("onAuthCommand" in target) {
                    target.onAuthCommand(interestingParams.action);
                }
            }
        }
    },
    observe: function authAdapter_observe(subject, topic, data) {
        if (topic == "http-on-modify-request") {
            this._onModifyRequest(subject);
        }
    }
};
function loadScript(modulePath) {
    SCRIPT_LOADER.loadSubScript(api.Package.resolvePath("/native/fx/modules/" + modulePath));
}
function importScript(moduleName, modulePath, argsArray) {
    let scope = {};
    Cu.import(api.Package.resolvePath("/native/fx/modules/" + modulePath), scope);
    let module = scope[moduleName];
    if (!module) {
        throw new Error("No module '" + moduleName + "' in " + modulePath);
    }
    if (typeof module.init == "function") {
        argsArray = argsArray || [];
        argsArray.unshift(api.shareableAPI);
        module.init.apply(module, argsArray);
    }
    return module;
}
function _openAuthDialog(dialogParams = {}) {
    let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/auth";
    let data = { retpath: "http://" + authManager.authdefs.DOMAINS.MAIN_DOMAIN };
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
    api.Controls.navigateBrowser({
        url: url + "?" + params.join("&"),
        target: "new tab"
    });
}
function _openLogoutDialog() {
    let yuidCookieValue = this.getYUIDValue() || "";
    let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=logout";
    let data = {
        retpath: authManager.authdefs.DOMAINS.MAIN_DOMAIN,
        yu: yuidCookieValue
    };
    let params = [];
    for (let [
                key,
                val
            ] in Iterator(data)) {
        params.push(key + "=" + encodeURIComponent(val));
    }
    api.Controls.navigateBrowser({
        url: url + "&" + params.join("&"),
        target: "new tab"
    });
}
function sendAuthStatistics(action, counter) {
}
