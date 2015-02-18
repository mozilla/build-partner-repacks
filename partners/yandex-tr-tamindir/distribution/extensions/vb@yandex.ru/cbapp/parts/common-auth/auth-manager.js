"use strict";
const STATE_START = Ci.nsIWebProgressListener.STATE_START;
const STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;
const STATE_IS_NETWORK = Ci.nsIWebProgressListener.STATE_IS_NETWORK;
const COOKIE_SESSION_ID = "Session_id";
const COOKIE_YUID = "yandexuid";
const authManager = {
    EVENTS: { AUTH_STATE_CHANGED: "auth-state-changed" },
    get authorized() {
        return Boolean(this.users.length);
    },
    get users() {
        return this._users;
    },
    get allUsers() {
        let savedUsers = [];
        let savedAccounts = this.pwdmng.savedAccounts;
        for (let [
                    ,
                    savedAccount
                ] in Iterator(savedAccounts)) {
            if (!this.getUser(savedAccount.uid)) {
                savedUsers.push(this._createUser(savedAccount));
            }
        }
        savedUsers.sort(function (a, b) {
            return b.authStateChangedTimestamp - a.authStateChangedTimestamp;
        });
        return this.users.concat(savedUsers);
    },
    get pwdmng() {
        return pwdMgr;
    },
    get api() {
        return this._api;
    },
    get authdefs() {
        if (!this._authdefs) {
            let passportConfig = this.passportConfig;
            if (!passportConfig.mainDomain) {
                return authdefs;
            }
            this._authdefs = Object.create(authdefs);
            this._authdefs.DOMAINS.MAIN_DOMAIN = passportConfig.mainDomain;
            this._authdefs.LINKS.PASS_ROOT_URL = passportConfig.rootPassportURL;
            this._authdefs.LINKS.AUTH_PASSPORT_URL = passportConfig.authPassportURL;
        }
        return this._authdefs;
    },
    get passportConfig() {
        if (!this.__passportConfig) {
            let passDoc;
            try {
                passDoc = this._branding.getXMLDocument("/passport/passport.xml");
            } catch (e) {
                this._debug("Couldn't find file passport.xml in branding.");
            }
            if (passDoc) {
                this._passportConfig = this._createPassportConfig(passDoc);
            }
            if (!this.__passportConfig) {
                this.__passportConfig = this._getEmptyPassConfig();
            }
        }
        return this.__passportConfig;
    },
    init: function authManager_init(api) {
        if (this._initialized) {
            return;
        }
        this._api = api;
        this._users = [];
        this._sessionCookies = [];
        utils.NotificationSource.objectMixIn(this.__proto__);
        if (!pwdMgr) {
            pwdMgr = importScript("pwdmng", "common-auth/pwdmng.jsm");
        }
        Services.obs.addObserver(this, "quit-application-granted", false);
        this._initialized = true;
    },
    getYUIDValue: function authManager_getYUIDValue() {
        return this.getYandexCookie(COOKIE_YUID, false);
    },
    getYandexCookie: function authManager_getYandexCookie(aCookieName, aCheckExpired, aCookiePath) {
        return this._findCookieValue(aCookieName, aCheckExpired, aCookiePath, false);
    },
    getUser: function authManager_getUser(aStrUserInfo) {
        if (!aStrUserInfo) {
            return;
        }
        let lowered = aStrUserInfo.toLowerCase();
        for (let [
                    ,
                    user
                ] in Iterator(this.users)) {
            if (user.uid === aStrUserInfo || user.login && user.login === lowered) {
                return user;
            }
        }
        return null;
    },
    getTopUser: function authManager_getTopUser() {
        let users = this.users;
        if (users.length) {
            return users[users.length - 1];
        }
        return null;
    },
    isLoginHasAuth: function authManager_isLoginHasAuth(aStrUserInfo) {
        return Boolean(this.getUser(aStrUserInfo));
    },
    switchUser: function authManager_switchUser(aStrUserInfo) {
        let user = this.getUser(aStrUserInfo);
        if (!user) {
            let login = "";
            if (aStrUserInfo) {
                this.allUsers.some(function (aUser) {
                    if (aUser.authorized) {
                        return;
                    }
                    if (aUser.uid == aStrUserInfo || aUser.login == aStrUserInfo) {
                        login = aUser.login;
                        return true;
                    }
                });
            }
            this.openAuthDialog({ login: login });
            return;
        }
        let defaultUser = this.getTopUser();
        if (user === defaultUser) {
            return false;
        }
        let params = {
            action: "change_default",
            uid: user.uid,
            yu: this.getYUIDValue() || "",
            retpath: TRIGGER_URL
        };
        this._sendEmbeddedAuthRequest(params);
        return true;
    },
    initLogoutProcess: function authManager_initLogoutProcess(aUser) {
        if (this.users.length == 1) {
            this.initLogoutAll();
            return;
        }
        let user;
        if (typeof aUser === "string") {
            user = this.getUser(aUser);
        } else {
            user = aUser;
        }
        if (!user) {
            return false;
        }
        let params = {
            action: "logout",
            uid: user.uid,
            retpath: TRIGGER_URL + "?logout=true"
        };
        this._sendEmbeddedAuthRequest(params);
        return true;
    },
    initLogoutAll: function authManager_initLogoutAll() {
        this._openLogoutDialog();
    },
    openAuthDialog: function authManager_openAuthDialog(dialogParams) {
        _openAuthDialog.call(this, dialogParams);
    },
    setPref: function authManager_setPref(strPrefName, strPrefValue) {
        let prefFullName = this.api.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    getPref: function authManager_getPref(strPrefName, defaultValue) {
        let prefFullName = this.api.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    _initialized: false,
    _active: false,
    _api: null,
    _authdefs: null,
    _storedState: null,
    __passportConfig: null,
    _accountsFromServerRequest: null,
    _retryGetAccountsFromServerTimer: null,
    _authSavedStatePrefName: "auth.prev.state",
    _getAccountsErrorCounter: 0,
    get _branding() {
        return this.api.Environment.branding;
    },
    get _passportConfig() {
        throw new Error("Only setter available");
    },
    set _passportConfig(config) {
        if (typeof config != "object" || !(config.mainDomain && config.authPassportURL && config.rootPassportURL)) {
            throw new TypeError("Invalig passport config object");
        }
        this.__passportConfig = config;
    },
    _createPassportConfig: function authManager__createPassportConfig(configDocument) {
        let config = this._getEmptyPassConfig();
        let passportElement = configDocument.querySelector("Passport");
        if (!passportElement) {
            return config;
        }
        let passHost = passportElement.querySelector("AccountsHostName");
        if (passHost) {
            config.rootPassportURL = "https://" + passHost.textContent;
        }
        let passportHost = passportElement.querySelector("PassportHostName");
        if (passportHost) {
            config.authPassportURL = "https://" + passportHost.textContent;
        }
        let uri = utils.tryCreateFixupURI(config.authPassportURL);
        if (uri) {
            config.mainDomain = Services.eTLD.getBaseDomain(uri);
        }
        return config;
    },
    _getEmptyPassConfig: function authManager__getEmptyPassConfig() {
        return {
            rootPassportURL: undefined,
            authPassportURL: undefined,
            mainDomain: undefined
        };
    },
    _findCookieValue: function authManager__findCookieValue(strCookieName, bCheckExpired, strCookiePath, bStrictMatch) {
        let mainYandexDomain = this.authdefs.DOMAINS.MAIN_DOMAIN;
        if (!mainYandexDomain) {
            return;
        }
        if (!strCookiePath) {
            strCookiePath = "/";
        }
        return this.api.Network.findCookieValue("https://" + mainYandexDomain + strCookiePath, strCookieName, true, bCheckExpired, bStrictMatch);
    },
    _listenerAdded: function authManager__listenerAdded(topic, listener) {
        this._watchAuth();
    },
    _listenerRemoved: function authManager_listenerRemoved(topic, listener) {
        if (!this._hasListeners) {
            this._stopWatching();
        }
    },
    _watchAuth: function authManager__watchAuth() {
        if (this._active) {
            return;
        }
        try {
            this._trySetSessionFromCookies();
        } finally {
            this._active = true;
        }
    },
    _stopWatching: function authManager__stopWatching() {
        if (!this._active) {
            return;
        }
        try {
            this._removeAllSessionCookies();
        } finally {
            this._active = false;
        }
    },
    _trySetSessionFromCookies: function authManager__trySetSessionFromCookies(checkCookiesExpiration) {
        this._followRequiredCookies();
    },
    _followRequiredCookies: function authManager__followRequiredCookies() {
        let yandexURI = Services.io.newURI("https://" + this.authdefs.DOMAINS.MAIN_DOMAIN + "/", null, null);
        let sessionCookie = new this.api.Network.Cookie(COOKIE_SESSION_ID, yandexURI, true);
        this._addSessionCookie(sessionCookie);
        if (sessionCookie.value) {
            this._setSession(sessionCookie);
        }
    },
    _getSessionCookie: function authManager__getSessionCookie() {
        return this._sessionCookies[0];
    },
    _addSessionCookie: function authManager__addSessionCookie(aCookie) {
        if (!aCookie) {
            return;
        }
        for (let [
                    ,
                    item
                ] in Iterator(this._sessionCookies)) {
            if (item.name === aCookie.name && item.uri.path === aCookie.uri.path) {
                return;
            }
        }
        aCookie.addListener(aCookie.EVENTS.COOKIE_VALUE_CHANGED, this);
        this._sessionCookies.push(aCookie);
    },
    _removeSessionCookie: function authManager__removeSessionCookie(aCookie) {
        if (!aCookie) {
            return;
        }
        let index = this._sessionCookies.indexOf(aCookie);
        if (index > -1) {
            aCookie.removeAllListeners();
            this._sessionCookies.splice(index, 1);
        }
    },
    _removeAllSessionCookies: function authManager__removeAllSessionCookies() {
        for (let [
                    ,
                    item
                ] in Iterator(this._sessionCookies)) {
            this._removeSessionCookie(item);
        }
    },
    _createUser: function authManager__createUser(aDescriptor) {
        return new _User(aDescriptor);
    },
    _addUser: function authManager__addUser(aUser) {
        if (!aUser) {
            return;
        }
        if (!this.getUser(aUser.uid)) {
            aUser.authorized = true;
            this.users.push(aUser);
            return true;
        }
        return false;
    },
    _removeUser: function authManager__removeUser(aUser) {
        if (!aUser) {
            return;
        }
        aUser.authorized = false;
        let index = this.users.indexOf(aUser);
        if (index > -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    },
    _clearUsers: function authManager__clearUsers() {
        for (let [
                    ,
                    user
                ] in Iterator(this.users)) {
            user.authorized = false;
        }
        this.users.length = 0;
    },
    _openLogoutDialog: function authManager__openLogoutDialog() {
        _openLogoutDialog.call(this);
    },
    _sendEmbeddedAuthRequest: function authManager__sendEmbeddedAuthRequest(aParams) {
        let url = this.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=embeddedauth";
        if (!aParams.yu) {
            aParams.yu = this.getYUIDValue() || "";
        }
        if (!aParams.retpath) {
            aParams.retpath = TRIGGER_URL;
        }
        let data = [];
        for (let [
                    key,
                    val
                ] in Iterator(aParams)) {
            data.push(key + "=" + encodeURIComponent(val));
        }
        let stringStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        stringStream.data = data.join("&");
        let postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
        postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
        postData.addContentLength = true;
        postData.setData(stringStream);
        let chromeWindow = utils.mostRecentBrowserWindow;
        let gBrowser = chromeWindow.getBrowser();
        let authTab = gBrowser.loadOneTab(url, null, null, postData, true);
        gBrowser.hideTab(authTab);
        let progressListener = {
            progressTimer: null,
            api: this.api,
            QueryInterface: XPCOMUtils.generateQI([
                "nsIWebProgressListener",
                "nsISupportsWeakReference"
            ]),
            setProgressTimer: function () {
                this.progressTimer = this.api.SysUtils.Timer(function () {
                    revealTab();
                }, 500);
            },
            cancelProgressTimer: function () {
                if (this.progressTimer) {
                    this.progressTimer.cancel();
                    this.progressTimer = null;
                }
            },
            onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
                if (!(aStateFlags & STATE_IS_NETWORK)) {
                    return;
                }
                if (aStateFlags & STATE_STOP) {
                    this.setProgressTimer();
                }
                if (aStateFlags & STATE_START) {
                    this.cancelProgressTimer();
                }
            }
        };
        let webProgress = authTab.linkedBrowser.webProgress;
        let tabHandler = function authManager__sendEmbeddedAuthRequest_tabHandler(aEvent) {
            gBrowser.tabContainer.removeEventListener("TabClose", tabHandler, false);
            webProgress.removeProgressListener(progressListener);
            cancelRevealTimer();
            progressListener.cancelProgressTimer();
        };
        gBrowser.tabContainer.addEventListener("TabClose", tabHandler, false);
        webProgress.addProgressListener(progressListener, webProgress.NOTIFY_STATE_ALL);
        let tabRevealTimer = this.api.SysUtils.Timer(revealTab, 3000);
        function cancelRevealTimer() {
            if (tabRevealTimer) {
                tabRevealTimer.cancel();
                tabRevealTimer = null;
            }
        }
        function revealTab() {
            cancelRevealTimer();
            gBrowser.showTab(authTab);
            gBrowser.selectedTab = authTab;
        }
    },
    _setSession: function authManager__setSession(sessionCookie) {
        this._getAccountsFromServer();
    },
    _getAccountsFromServer: function authManager__getAccountsFromServer() {
        this._cancelRetryGetAccountsFromServer();
        let yuidCookieValue = this.getYUIDValue() || "";
        let url = this.authdefs.LINKS.PASS_ROOT_URL + "/accounts/?yu=" + encodeURIComponent(yuidCookieValue);
        let reqConfig = {
            background: true,
            bypassCache: true,
            callbackFunc: this._accountsHandler.bind(this)
        };
        this._accountsFromServerRequest = utils.sendRequest(url, reqConfig);
    },
    _accountsHandler: function authManager__accountsHandler(aReq) {
        let request = aReq.target;
        if (utils.isReqError(aReq)) {
            this._retryGetAccountsFromServer();
            this._authAnnihilation();
            return;
        }
        this._getAccountsErrorCounter = 0;
        let accountsJSON;
        try {
            accountsJSON = JSON.parse(request.responseText);
        } catch (e) {
            this._debug("Couldn't parse server response. " + (request.responseText || "").substr(0, 256));
        }
        if (!(accountsJSON && accountsJSON.accounts && accountsJSON.accounts.length)) {
            this._authAnnihilation();
            return;
        }
        this._clearUsers();
        let accountsDescriptors = this.pwdmng.parseAccountsFromServer(accountsJSON.accounts);
        let defaultUser;
        accountsDescriptors.forEach(function (aDescriptor) {
            let user = this._createUser(aDescriptor);
            if (user.uid == accountsJSON.default_uid) {
                defaultUser = user;
            } else {
                this._addUser(user);
            }
        }, this);
        if (defaultUser) {
            this._addUser(defaultUser);
        }
        this.pwdmng.saveAccounts(accountsDescriptors);
        this._onStateChanged();
    },
    _retryGetAccountsFromServer: function authManager__retryGetAccountsFromServer() {
        this._cancelRetryGetAccountsFromServer();
        let delay = 5 * Math.pow(2, this._getAccountsErrorCounter++);
        let reqTimer = this.api.SysUtils.Timer(this._getAccountsFromServer.bind(this), delay * 1000);
        this._retryGetAccountsFromServerTimer = reqTimer;
    },
    _cancelRetryGetAccountsFromServer: function authManager__stopRetryGetAccountsFromServer() {
        if (this._retryGetAccountsFromServerTimer) {
            this._retryGetAccountsFromServerTimer.cancel();
            this._retryGetAccountsFromServerTimer = null;
        }
    },
    _authAnnihilation: function authManager__authAnnihilation() {
        this._clearUsers();
        this._detectAccountChanges();
        this._onStateChanged();
    },
    _detectAccountChanges: function authManager__detectAccountChanges() {
        let prevStateAccounts = this._getState();
        let loginCounter = 0;
        let logoutCounter = 0;
        let defaultUser = this.getTopUser();
        let changedAccounts = [];
        let bothStatesAccounts = [];
        let currentAccountsIds = [];
        let currentAccounts = this.users.map(function (aUser) {
            currentAccountsIds.push(aUser.uid);
            return {
                id: aUser.uid,
                isDefault: aUser === defaultUser
            };
        });
        prevStateAccounts.forEach(function (aPrevAccount) {
            let changed = false;
            let currentStateAccount;
            currentAccounts.some(function (aCurrentAccount) {
                if (aPrevAccount.id === aCurrentAccount.id) {
                    currentStateAccount = aCurrentAccount;
                    return true;
                }
            });
            if (!currentStateAccount) {
                changed = true;
                logoutCounter++;
            } else {
                if (aPrevAccount.isDefault && aPrevAccount.id != defaultUser.uid) {
                    changed = true;
                }
                if (!aPrevAccount.isDefault && aPrevAccount.id == defaultUser.uid) {
                    changed = true;
                }
                bothStatesAccounts.push(currentStateAccount);
            }
            if (changed) {
                changedAccounts.push(aPrevAccount.id);
            }
        });
        loginCounter = currentAccounts.filter(function (aCurrentAccount) {
            return bothStatesAccounts.indexOf(aCurrentAccount) < 0;
        }).length;
        if (changedAccounts.length) {
            let accountsDescriptors = this.pwdmng.getAccountsById(changedAccounts);
            accountsDescriptors.forEach(function (aDescriptor) {
                aDescriptor.authStateTimestamp = Date.now();
            });
            this.pwdmng.saveAccounts(accountsDescriptors);
        }
        let currentStateAccounts = this.pwdmng.getAccountsById(currentAccountsIds);
        currentStateAccounts.forEach(function (aCurrentStateAccount) {
            if (!aCurrentStateAccount) {
                return;
            }
            let user = this.getUser(aCurrentStateAccount.uid);
            if (!user) {
                return;
            }
            user.update({ authStateChangedTimestamp: aCurrentStateAccount.authStateTimestamp });
        }, this);
        this.users.sort(function (a, b) {
            let at = a.authStateChangedTimestamp;
            let bt = b.authStateChangedTimestamp;
            if (at && bt) {
                return bt - at;
            }
            if (at && !bt) {
                return 1;
            } else if (!at && bt) {
                return -1;
            } else {
                return 0;
            }
        });
        let index = this.users.indexOf(defaultUser);
        if (index > -1) {
            this.users.splice(index, 1);
            let rt = this._addUser(defaultUser);
        }
        if (loginCounter) {
            sendAuthStatistics("login", loginCounter);
        }
        if (logoutCounter) {
            sendAuthStatistics("logout", logoutCounter);
        }
        this._storeState(currentAccounts);
    },
    _getState: function authManager__getState() {
        if (!this._storedState) {
            let storedState = [];
            try {
                storedState = JSON.parse(this.getPref(this._authSavedStatePrefName, undefined));
            } catch (e) {
            }
            this._storedState = storedState;
        }
        return this._storedState;
    },
    _storeState: function authManager__storeState(aStateObj) {
        if (!aStateObj) {
            return;
        }
        this._storedState = aStateObj;
        this.setPref(this._authSavedStatePrefName, JSON.stringify(this._storedState));
    },
    _onStateChanged: function authManager__onStateChanged() {
        this._detectAccountChanges();
        this._notifyListeners(this.EVENTS.AUTH_STATE_CHANGED, {
            users: this.users,
            hasAuth: Boolean(this.users.length),
            defaultUser: this.getTopUser()
        });
    },
    observe: function authManager_observe(subject, topic, data) {
        if (this._sessionCookies.indexOf(subject) > -1) {
            this._setSession(subject);
        }
        if (topic == "quit-application-granted") {
            try {
                User._db.close();
            } catch (e) {
            }
        }
    },
    _debug: function authManager__debug(message) {
        if (this._api) {
            this._api.logger.debug(message);
        } else {
            Cu.reportError("yAuth can't log message through native API!\n" + message);
        }
    }
};
function _User(aDescriptor) {
    if (!aDescriptor.uid) {
        throw new Error("User descriptor doesn't contain uid. " + JSON.stringify(aDescriptor).substr(0, 256));
    }
    this._uid = aDescriptor.uid;
    this._login = aDescriptor.login;
    this._displayName = aDescriptor.displayName;
    this._social = false;
    let [
        name,
        domain
    ] = this._login.split("@");
    if (!domain || /^(yandex|narod|ya)(\.com)?\.[a-z]{2,3}$/i.test(domain)) {
        domain = authManager.authdefs.DOMAINS.MAIN_DOMAIN;
    }
    this._domain = domain.toLowerCase();
    this._fullName = name + "@" + this._domain;
    if (!this._login) {
        this._social = true;
        this._fullName = this._displayName;
    }
    this.__socialDescriptor = aDescriptor.social;
    this.__authStateChanged = aDescriptor.authStateTimestamp || null;
    this._authorized = false;
}
_User.prototype = {
    get authorized() {
        return this._authorized;
    },
    set authorized(val) {
        let authorized = Boolean(val);
        if (authorized && !this.prevAuthTimeStamp) {
            this._prevAuthTimeStamp = Date.now();
        }
        this._authorized = authorized;
    },
    get uid() {
        return this._uid;
    },
    get isSocial() {
        return this._social;
    },
    get login() {
        return this._login;
    },
    get fullName() {
        return this._fullName;
    },
    get displayName() {
        return this._displayName;
    },
    set displayName(aStr) {
        this._displayName = aStr;
    },
    get domain() {
        return this._domain;
    },
    get socialDescriptor() {
        return this.__socialDescriptor;
    },
    set socialDescriptor(aDescriptor) {
        this.__socialDescriptor = aDescriptor || {};
    },
    get socialAuthProvider() {
        return this.__socialDescriptor.provider;
    },
    get socialAuthProfileId() {
        return this.__socialDescriptor.profileId;
    },
    get authStateChangedTimestamp() {
        return this.__authStateChanged;
    },
    set authStateChangedTimestamp(val) {
        this.__authStateChanged = val;
    },
    update: function User_update(data) {
        for (let prop in data) {
            this["_" + prop] = data[prop];
        }
    },
    toString: function User_toString() {
        return this.login || this.uid;
    }
};
