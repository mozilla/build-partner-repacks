"use strict";
let EXPORTED_SYMBOLS = [
    "Auth",
    "LOGIN_STATES",
    "CONFIG"
];
let {Utils} = require("utils");
let {Observers} = require("observers");
let LOGIN_STATES = {
    NO_AUTH: 1,
    REQUEST: 2,
    AUTH: 3,
    UNKNOWN_ERROR: 4,
    CREDENTIALS_ERROR: 5,
    CAPTCHA_REQUIRED: 6,
    NETWORK_ERROR: 7,
    EXPIRED: 8
};
let CONFIG = {
    HOST: "yandex.ru",
    HTTP_REALM: "Yandex.Elements.syncronization"
};
XPCOMUtils.defineLazyGetter(this, "WeaveCrypto", function () {
    let WeaveCrypto = Cu.import("resource://gre/modules/services-crypto/WeaveCrypto.js").WeaveCrypto;
    return new WeaveCrypto();
});
[[
        "LOGIN_MANAGER",
        "@mozilla.org/login-manager;1",
        "nsILoginManager"
    ]].forEach(function ([
    name,
    contract,
    iface
]) {
    XPCOMUtils.defineLazyServiceGetter(this, name, contract, iface);
}, this);
let Auth = {
    get _logger() {
        return NativeAPI.logger.getLogger("Auth");
    },
    login: function Auth_login(username, password, captchaKey, captchaAnswer) {
        this._logger.debug("Authenticating user " + username);
        username = username.toLowerCase();
        this.token = "";
        this.state = LOGIN_STATES.REQUEST;
        let url = "https://oauth.yandex.ru/token";
        let clientId = "de4a869062c44789bc82b0d1de89cf17";
        let clientSecret = "553321a95170460c90a41892da993315";
        let data = "grant_type=password" + "&username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret);
        if (captchaKey && captchaAnswer) {
            data += "&x_captcha_key=" + encodeURIComponent(captchaKey) + "&x_captcha_answer=" + encodeURIComponent(captchaAnswer);
        }
        Utils.sendRequest(url, {
            data: data,
            method: "POST",
            anonymous: true,
            callback: this._loginCallback.bind(this, username, password)
        });
    },
    logout: function Auth_logout() {
        this.token = "";
        this.state = LOGIN_STATES.NO_AUTH;
    },
    _loginCallback: function Auth__loginCallback(username, password, requestEvent) {
        let request = requestEvent.target;
        let response = { error: "unknown" };
        let withCaptcha = false;
        if (requestEvent.type == "load") {
            try {
                response = JSON.parse(request.responseText);
            } catch (e) {
                NativeAPI.logger.debug("Can not parse login response.");
            }
        } else {
            response.error = "network";
        }
        let tokenString = "";
        let state = LOGIN_STATES.UNKNOWN_ERROR;
        switch (response.error) {
        case "network":
            state = LOGIN_STATES.NETWORK_ERROR;
            break;
        case "unknown":
            state = LOGIN_STATES.UNKNOWN_ERROR;
            break;
        case "invalid_grant":
            state = LOGIN_STATES.CREDENTIALS_ERROR;
            break;
        case "403":
            state = LOGIN_STATES.CAPTCHA_REQUIRED;
            withCaptcha = true;
            this.captcha = {
                url: response.x_captcha_url,
                key: response.x_captcha_key
            };
            break;
        default:
            tokenString = response.access_token || "";
            if (tokenString) {
                state = LOGIN_STATES.AUTH;
                try {
                    this.setLoginInfo(username, password);
                    this.token = {
                        username: username,
                        value: tokenString
                    };
                } catch (e) {
                    state = LOGIN_STATES.CREDENTIALS_ERROR;
                }
            }
            break;
        }
        if (!withCaptcha) {
            this.captcha = null;
        }
        this.state = state;
    },
    getLoginInfo: function Auth_getLoginInfo() {
        let username = Auth.token.username;
        if (!username) {
            return null;
        }
        return this._getSavedLogins().filter(function (login) {
            return login.username === username;
        })[0] || null;
    },
    setLoginInfo: function Auth_setLoginInfo(username, password) {
        let props = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);
        props.setPropertyAsAUTF8String("hostname", CONFIG.HOST);
        props.setPropertyAsAUTF8String("httpRealm", CONFIG.HTTP_REALM);
        LOGIN_MANAGER.searchLogins({}, props).forEach(function (loginInfo) {
            try {
                LOGIN_MANAGER.removeLogin(loginInfo);
            } catch (e) {
            }
        });
        let loginInfo = Cc["@mozilla.org/login-manager/loginInfo;1"].createInstance(Ci.nsILoginInfo);
        loginInfo.init(CONFIG.HOST, null, CONFIG.HTTP_REALM, username, password, "", "");
        LOGIN_MANAGER.addLogin(loginInfo);
    },
    get hasSavedLogins() {
        return this._getSavedLogins().length > 0;
    },
    get authorized() {
        return this.state === LOGIN_STATES.AUTH;
    },
    get expired() {
        return this.state === LOGIN_STATES.EXPIRED;
    },
    get token() {
        let [
            value,
            guid
        ] = NativeAPI.Settings.getValue("auth.token").split(" ::: ");
        let username = NativeAPI.Settings.getValue("auth.username");
        return {
            username: username || "",
            value: value || "",
            guid: guid || null
        };
    },
    set token(token) {
        let {username, value} = token;
        if (username) {
            username = (username || "").split("@")[0];
            NativeAPI.Settings.setValue("auth.username", username);
        }
        let guid = [];
        if (value) {
            guid = WeaveCrypto.generateRandomBytes(16);
        }
        let tokenString = (value || "") + " ::: " + guid;
        NativeAPI.Settings.setValue("auth.token", tokenString);
    },
    get storeBirthday() {
        return NativeAPI.Settings.getValue("store.birthday");
    },
    set storeBirthday(val) {
        NativeAPI.Settings.setValue("store.birthday", val);
    },
    _captcha: null,
    get captcha() this._captcha,
    set captcha(captcha) {
        this._captcha = captcha;
    },
    _state: LOGIN_STATES.NO_AUTH,
    get state() this._state,
    set state(state) {
        if (state === LOGIN_STATES.AUTH && !this.getLoginInfo()) {
            state = LOGIN_STATES.NO_AUTH;
        }
        if (this._state === state) {
            return;
        }
        let isKnownState = Object.keys(LOGIN_STATES).some(function (key) {
            return LOGIN_STATES[key] === state;
        });
        if (!isKnownState) {
            throw new Error("Wrong state value: " + state);
        }
        this._state = state;
        NativeAPI.Settings.setValue("auth.lastState", state);
        let notifyData = {
            state: state,
            username: this.token.username
        };
        Observers.notify("ybar:esync:auth:changed", notifyData, JSON.stringify(notifyData));
    },
    get neverHasAuthBefore() {
        if (this.state !== LOGIN_STATES.AUTH) {
            return null;
        }
        let firstTime = NativeAPI.Settings.getValue("auth.neverHasAuthBefore");
        if (firstTime) {
            NativeAPI.Settings.setValue("auth.neverHasAuthBefore", false);
        }
        delete this.neverHasAuthBefore;
        this.neverHasAuthBefore = false;
        return firstTime;
    },
    _checkStateOnStart: function Auth__checkStateOnStart() {
        this._state = NativeAPI.Settings.getValue("auth.lastState");
        if (this.token.value && this.getLoginInfo()) {
            this._state = LOGIN_STATES.AUTH;
        } else if (this._state === LOGIN_STATES.AUTH) {
            this._state = LOGIN_STATES.NO_AUTH;
        }
    },
    _getSavedLogins: function Auth__getSavedLogins() {
        let logins;
        try {
            logins = LOGIN_MANAGER.findLogins({}, CONFIG.HOST, null, CONFIG.HTTP_REALM);
        } catch (e) {
        }
        return logins || [];
    }
};
Auth._checkStateOnStart();
