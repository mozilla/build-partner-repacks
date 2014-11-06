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
const TRIGGER_URL = "http://element.yandex.ru/vb/retpath=passport/";
let api;
let pwdMgr;
let application;
let authdefs;
let utils;
let misc;
const authAdapter = {
    get authManager() {
        return authManager;
    },
    get authdefs() {
        return authdefs;
    },
    init: function authAdapter_init(app) {
        if (this._initialized) {
            return;
        }
        application = app;
        let coreLib = app.core.Lib;
        let brandPackage = app.branding.brandPackage;
        misc = coreLib.misc;
        api = {
            Settings: {
                PrefsModule: application.preferences,
                getPackageBranchPath: function authAdapterAPI_getPackageBranchPath() {
                    return "auth.";
                }
            },
            Environment: {
                branding: {
                    brandPackage: brandPackage,
                    findFile: brandPackage.findFile.bind(brandPackage),
                    getXMLDocument: brandPackage.getXMLDocument.bind(brandPackage)
                }
            },
            Files: {
                getPackageStorage: function authAdapterAPI_getPackageStorage() {
                    return app.directories.appRootDir;
                },
                jsonFromFile: function authAdapterAPI_jsonFromFile(file) {
                    return coreLib.fileutils.jsonFromFile(file);
                },
                jsonToFile: function authAdapterAPI_jsonToFile(json, file, accessRights, modeFlags) {
                    coreLib.fileutils.jsonToFile(json, file, accessRights, modeFlags);
                }
            },
            SysUtils: {
                Timer: function authAdapterAPI_Timer(aCallback, aDelay, aRepeating, aMaxTimes) {
                    return new coreLib.sysutils.Timer(aCallback, aDelay, aRepeating, aMaxTimes);
                }
            },
            Statistics: {
                logClickStatistics: function authAdapterAPI_logClickStatistics(statData) {
                    return application.statistics.logClickStatistics(statData);
                },
                get alwaysSendUsageStat() {
                    return application.statistics.alwaysSendUsageStat;
                }
            },
            Network: coreLib.netutils,
            logger: application.getLogger("auth")
        };
        authdefs = importScript("authdefs", "common-auth/authdefs.jsm");
        utils = importScript("utils", "common-auth/utils.jsm");
        loadScript("common-auth/auth-manager.js");
        authManager.init(api);
        Services.obs.addObserver(this, "http-on-modify-request", false);
        this._initialized = true;
    },
    finalize: function authAdapter_finalize() {
        if (!this._initialized) {
            return;
        }
        misc = null;
        application = null;
        api = null;
        this._initialized = false;
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
            let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport";
            if (status === "other" && interestingParams.errorURL) {
                url = interestingParams.errorURL;
            }
            misc.navigateBrowser({
                unsafeURL: url,
                target: "new tab"
            });
            errorDetected = true;
        }
        if (!interestingParams.stay || errorDetected) {
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
            return;
        }
        if (!interestingParams.wasLogoutAll) {
            application.fastdial.sendClickerRequest("auth.done.vb");
        }
        misc.navigateBrowser({
            url: "yafd:tabs",
            target: "current tab"
        });
    },
    observe: function authAdapter_observe(subject, topic, data) {
        if (topic == "http-on-modify-request") {
            this._onModifyRequest(subject);
        }
    }
};
function loadScript(modulePath) {
    SCRIPT_LOADER.loadSubScript("resource://" + application.name + "-app/parts/" + modulePath);
}
function importScript(moduleName, modulePath, argsArray) {
    let scope = {};
    Cu.import("resource://" + application.name + "-app/parts/" + modulePath, scope);
    let module = scope[moduleName];
    if (!module) {
        throw new Error("No module '" + moduleName + "' in " + modulePath);
    }
    if (typeof module.init === "function") {
        argsArray = argsArray || [];
        argsArray.unshift(api);
        module.init.apply(module, argsArray);
    }
    return module;
}
function User(strUsername) {
    this._name = strUsername.toLowerCase();
}
User.init = function User_init() {
};
User.prototype = {
    get name() {
        return this._name;
    },
    savePref: function User_savePref(strName, value) {
    },
    selectPref: function User_selectPref(strName) {
    },
    selectPrefInt: function User_selectPrefInt(strName) {
    },
    _cleanTable: function User__cleanTable(strTable) {
    },
    _log: function User__log(msg) {
    },
    _db: {
        close: function () {
        }
    }
};
function _openAuthDialog(dialogParams = {}) {
    let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/auth?domik=1";
    let data = { retpath: TRIGGER_URL + "?stay=true" };
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
        url: url + "&" + params.join("&"),
        target: "current tab"
    });
}
function _openLogoutDialog() {
    let yuidCookieValue = this.getYUIDValue() || "";
    let url = authManager.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=logout";
    let data = {
        retpath: TRIGGER_URL + "?stay=true&logout=all",
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
}
function sendAuthStatistics(action, counter) {
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
        application.fastdial.sendClickerRequest(statKey);
    }
}
