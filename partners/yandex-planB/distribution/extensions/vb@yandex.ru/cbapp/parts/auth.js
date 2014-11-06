"use strict";
const EXPORTED_SYMBOLS = ["auth"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu,
    manager: Cm
} = Components;
const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
Cu.import("resource://gre/modules/Services.jsm");
const AVATARS_URL = "https://yapic.yandex.ru/get/%a/islands-middle";
let misc;
let USER_STATES = {
    UNAUTHORIZED: 0,
    AUTHORIZED: 1,
    DEFAULT: 2
};
const auth = {
    get application() {
        return this._application;
    },
    get frontendState() {
        return this._createFrontendStateObject();
    },
    init: function auth_init(app) {
        this._application = app;
        misc = app.core.Lib.misc;
        this._authManager.addListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    finalize: function auth_finalize() {
        this._application = null;
        this._initialized = false;
    },
    sendCurrentState: function auth_sendCurrentState() {
        if (this.application.fastdial) {
            this.application.fastdial.sendRequest("auth", this.frontendState);
        }
    },
    getURLFromBranding: function auth_getURLFromBranding(key) {
        let authElement = this._brandingXMLDoc.querySelector("auth");
        return authElement.getAttribute(key);
    },
    login: function auth_login(aUserId) {
        if (aUserId) {
            let user = this._authManager.getUser(aUserId);
            if (user) {
                let defaultUser = this._authManager.getTopUser();
                if (user === defaultUser) {
                    this._openInitialPageForUser(defaultUser);
                    return;
                }
                this._switchedUserInfo = user.uid;
            }
        }
        return this._authManager.switchUser(aUserId);
    },
    logout: function auth_logout() {
        return this._authManager.initLogoutProcess(this._authManager.getTopUser());
    },
    _switchedUserInfo: null,
    get _brandingXMLDoc() {
        delete this._brandingXMLDoc;
        return this._brandingXMLDoc = this.application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
    },
    get _authManager() {
        return this.application.authAdapter.authManager;
    },
    _createFrontendStateObject: function auth__createFrontendStateObject() {
        let result = { users: [] };
        if (!this._authManager.authorized) {
            return result;
        }
        let defaultUser = this._authManager.getTopUser();
        let users = this._authManager.allUsers.reduce(function (retObj, aUser) {
            let isDefault = aUser === defaultUser;
            let state = USER_STATES.UNAUTHORIZED;
            if (aUser.authorized) {
                state = isDefault ? USER_STATES.DEFAULT : USER_STATES.AUTHORIZED;
            }
            let res = {
                id: aUser.uid,
                login: aUser.login,
                state: state,
                displayName: aUser.displayName,
                fullName: aUser.fullName,
                avatarURL: AVATARS_URL.replace("%a", aUser.uid)
            };
            if (isDefault) {
                retObj.splice(0, 0, res);
            } else {
                retObj.push(res);
            }
            return retObj;
        }, []);
        result.users = users;
        return result;
    },
    _openInitialPageForUser: function auth__openInitialPageForAccount(aUser) {
        let url = "https://mail." + this._authManager.authdefs.DOMAINS.MAIN_DOMAIN;
        if (aUser.isSocial) {
            url = "http://" + this._authManager.authdefs.DOMAINS.MAIN_DOMAIN;
        }
        misc.navigateBrowser({
            url: url,
            target: "current tab"
        });
    },
    observe: function auth_observe(subject, topic, data) {
        switch (topic) {
        case this._authManager.EVENTS.AUTH_STATE_CHANGED:
            if (this._switchedUserInfo) {
                let defaultUser = data.defaultUser;
                if (this._switchedUserInfo === (defaultUser && defaultUser.uid)) {
                    this._openInitialPageForUser(defaultUser);
                }
                this._switchedUserInfo = null;
            }
            this.sendCurrentState();
            break;
        default:
            return;
        }
    }
};
