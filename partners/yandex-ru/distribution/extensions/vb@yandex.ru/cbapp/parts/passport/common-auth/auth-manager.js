"use strict";
const EXPORTED_SYMBOLS = ["authManager"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const GLOBAL = this;
const STATE_START = Ci.nsIWebProgressListener.STATE_START;
const STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;
const STATE_IS_NETWORK = Ci.nsIWebProgressListener.STATE_IS_NETWORK;
const COOKIE_SESSION_ID = "Session_id";
const COOKIE_YUID = "yandexuid";
const AUTH_SETTING_NAME_ROOT = "auth.";
const authManager = {
    EVENTS: { AUTH_STATE_CHANGED: "auth-state-changed" },
    get authorized() {
        return Boolean(this.accounts.length);
    },
    get accounts() {
        return this._accounts;
    },
    get allAccounts() {
        let notAuthorizedAccounts = [];
        let savedAccounts = this._pwdmng.savedAccounts;
        for (let [
                    ,
                    savedAccount
                ] in Iterator(savedAccounts)) {
            if (!this.getAuthorizedAccount(savedAccount.uid)) {
                notAuthorizedAccounts.push(this._createAccount(savedAccount));
            }
        }
        notAuthorizedAccounts.sort(function (a, b) {
            return b.authStateChangedTimestamp - a.authStateChangedTimestamp;
        });
        return this.accounts.concat(notAuthorizedAccounts);
    },
    get app() {
        return this._application;
    },
    get authdefs() {
        if (!this.__authdefs) {
            let passportConfig = this.passportConfig;
            if (!passportConfig.mainDomain) {
                return this._authdefs;
            }
            this.__authdefs = Object.create(this._authdefs);
            this.__authdefs.DOMAINS.MAIN_DOMAIN = passportConfig.mainDomain;
            let defaultRetPath = passportConfig.defaultRetPath;
            if (!defaultRetPath) {
                defaultRetPath = "http://" + passportConfig.mainDomain;
            }
            this.__authdefs.DOMAINS.DEFAULT_RETPATH = defaultRetPath;
            this.__authdefs.LINKS.PASS_ROOT_URL = passportConfig.rootPassportURL;
            this.__authdefs.LINKS.AUTH_PASSPORT_URL = passportConfig.authPassportURL;
        }
        return this.__authdefs;
    },
    get passportConfig() {
        if (!this.__passportConfig) {
            let passDoc;
            try {
                passDoc = this._branding.brandPackage.getXMLDocument("/passport/passport.xml");
            } catch (e) {
                this._debug("Couldn't find file passport.xml in branding.");
            }
            if (passDoc) {
                try {
                    this._passportConfig = this._createPassportConfig(passDoc);
                } catch (e) {
                    this._debug(e.message + e.stack);
                }
            }
            if (!this.__passportConfig) {
                this.__passportConfig = this._getEmptyPassConfig();
            }
        }
        return this.__passportConfig;
    },
    init: function (aApplication) {
        if (this._initialized) {
            return;
        }
        this._application = aApplication;
        this._logger = aApplication.getLogger("authManager");
        this._accounts = [];
        this._sessionCookies = [];
        aApplication.core.Lib.patterns.NotificationSource.objectMixIn(Object.getPrototypeOf(this));
        this._loadModules();
        this._initialized = true;
    },
    hasSavedAccounts: function () {
        return this._pwdmng.hasSavedAccounts;
    },
    hasSavedLogins: function () {
        let propertyBag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag);
        propertyBag.setProperty("formSubmitURL", this.authdefs.LINKS.AUTH_PASSPORT_URL);
        let logins = Services.logins.searchLogins({}, propertyBag);
        logins = logins.filter(login => Boolean(login.formSubmitURL));
        return Boolean(logins.length);
    },
    getYUIDValue: function () {
        return this.getYandexCookie(COOKIE_YUID, false);
    },
    getYandexCookie: function (aCookieName, aCheckExpired, aCookiePath) {
        return this._findCookieValue(aCookieName, aCheckExpired, aCookiePath, false);
    },
    getAuthorizedAccount: function (aAccountLoginOrUid) {
        if (!aAccountLoginOrUid) {
            throw new Error("Argument is empty.");
        }
        return this._getAccount(this.accounts, aAccountLoginOrUid);
    },
    getAccount: function (aAccountLoginOrUid) {
        if (!aAccountLoginOrUid) {
            throw new Error("Argument is empty.");
        }
        return this._getAccount(this.allAccounts, aAccountLoginOrUid);
    },
    getDefaultAccount: function () {
        if (this.authorized) {
            return this.accounts[this.accounts.length - 1];
        }
        return null;
    },
    isAccountAuthorized: function (aAccountLoginOrUid) {
        return Boolean(this.getAuthorizedAccount(aAccountLoginOrUid));
    },
    switchAccount: function (aAccountLoginOrUid) {
        let account;
        try {
            account = this.getAccount(aAccountLoginOrUid);
        } catch (e) {
        }
        if (account && account.authorized) {
            return this._switchDefaultAccount(account);
        }
        let login = "";
        if (account) {
            login = account.login;
        }
        this.openAuthDialog({ login: login });
    },
    initLogoutProcess: function (aAccount, aParams) {
        let account;
        if (typeof aAccount === "string") {
            account = this.getAuthorizedAccount(aAccount);
        } else {
            account = aAccount;
        }
        if (!(account && account.authorized)) {
            return false;
        }
        let extraParams = this._createQueryParamsArray(aParams);
        let params = {
            action: "logout",
            uid: account.uid,
            retpath: this.app.passport.authAdapter.TRIGGER_URL + "?logout=true" + (extraParams.length ? "&" + extraParams.join("&") : "")
        };
        this._sendEmbeddedAuthRequest(params);
        return true;
    },
    initLogoutAll: function () {
        this._openLogoutDialog();
    },
    openAuthDialog: function (dialogParams) {
        this.app.passport.authAdapter.openAuthDialog(dialogParams);
    },
    setPref: function (strPrefName, strPrefValue) {
        let prefFullName = AUTH_SETTING_NAME_ROOT + strPrefName;
        let prefsModule = this.app.preferences;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    getPref: function (strPrefName, defaultValue) {
        let prefFullName = AUTH_SETTING_NAME_ROOT + strPrefName;
        let prefsModule = this.app.preferences;
        return prefsModule.get(prefFullName, defaultValue);
    },
    _initialized: false,
    _active: false,
    _accounts: null,
    _sessionCookies: null,
    _authdefs: null,
    __authdefs: null,
    _storedState: null,
    __passportConfig: null,
    _accountsFromServerRequest: null,
    _retryGetAccountsFromServerTimer: null,
    _authSavedStatePrefName: "auth.prev.state",
    _getAccountsErrorCounter: 0,
    get _coreLib() {
        return this.app.core.Lib;
    },
    get _branding() {
        return this.app.branding;
    },
    get _passportConfig() {
        throw new Error("Only setter available");
    },
    set _passportConfig(config) {
        if (typeof config != "object" || !(config.mainDomain && config.authPassportURL && config.rootPassportURL)) {
            throw new TypeError("Invalid passport config object");
        }
        this.__passportConfig = config;
    },
    _createPassportConfig: function (configDocument) {
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
        let defaultRetPath = passportElement.querySelector("DefaultRetPath");
        if (defaultRetPath) {
            config.defaultRetPath = defaultRetPath.textContent;
        }
        let uri = this._coreLib.netutils.tryCreateFixupURI(config.authPassportURL);
        if (uri) {
            config.mainDomain = Services.eTLD.getBaseDomain(uri);
        }
        return config;
    },
    _getEmptyPassConfig: function () {
        return {
            rootPassportURL: undefined,
            authPassportURL: undefined,
            mainDomain: undefined
        };
    },
    _findCookieValue: function (strCookieName, bCheckExpired, strCookiePath, bStrictMatch) {
        let mainYandexDomain = this.authdefs.DOMAINS.MAIN_DOMAIN;
        if (!mainYandexDomain) {
            return;
        }
        if (!strCookiePath) {
            strCookiePath = "/";
        }
        return this._coreLib.netutils.findCookieValue("https://" + mainYandexDomain + strCookiePath, strCookieName, true, bCheckExpired, bStrictMatch);
    },
    _listenerAdded: function (topic, listener) {
        this._watchAuth();
    },
    _listenerRemoved: function (topic, listener) {
        if (!this._hasListeners) {
            this._stopWatching();
        }
    },
    _watchAuth: function () {
        if (this._active) {
            return;
        }
        try {
            this._trySetSessionFromCookies();
        } finally {
            this._active = true;
        }
    },
    _stopWatching: function () {
        if (!this._active) {
            return;
        }
        try {
            this._removeAllSessionCookies();
        } finally {
            this._active = false;
        }
    },
    _trySetSessionFromCookies: function (checkCookiesExpiration) {
        this._followRequiredCookies();
    },
    _followRequiredCookies: function () {
        let yandexURI = Services.io.newURI("https://" + this.authdefs.DOMAINS.MAIN_DOMAIN + "/", null, null);
        let sessionCookie = new this._coreLib.netutils.Cookie(COOKIE_SESSION_ID, yandexURI, true);
        this._addSessionCookie(sessionCookie);
        if (sessionCookie.value) {
            this._setSession(sessionCookie);
        }
    },
    _getSessionCookie: function () {
        return this._sessionCookies[0];
    },
    _addSessionCookie: function (aCookie) {
        if (!aCookie) {
            throw new Error("No session cookie is passed.");
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
    _removeSessionCookie: function (aCookie) {
        if (!aCookie) {
            throw new Error("No session cookie is passed.");
        }
        let index = this._sessionCookies.indexOf(aCookie);
        if (index > -1) {
            aCookie.removeAllListeners();
            this._sessionCookies.splice(index, 1);
        }
    },
    _removeAllSessionCookies: function () {
        for (let [
                    ,
                    item
                ] in Iterator(this._sessionCookies)) {
            this._removeSessionCookie(item);
        }
    },
    _getAccount: function (aAccountsArray, aAccountLoginOrUid) {
        let lowered = aAccountLoginOrUid.toLowerCase();
        for (let [
                    ,
                    account
                ] in Iterator(aAccountsArray)) {
            if (account.uid === aAccountLoginOrUid || account.login === lowered) {
                return account;
            }
        }
        return null;
    },
    _createAccount: function (aDescriptor) {
        return new Account(aDescriptor);
    },
    _addAccount: function (aAccount) {
        if (!aAccount) {
            throw new Error("No account.");
        }
        if (!this.getAuthorizedAccount(aAccount.uid)) {
            aAccount.authorized = true;
            this.accounts.push(aAccount);
            return true;
        }
        return false;
    },
    _removeAccount: function (aAccount) {
        if (!aAccount) {
            throw new Error("No account.");
        }
        aAccount.authorized = false;
        let index = this.accounts.indexOf(aAccount);
        if (index > -1) {
            this.accounts.splice(index, 1);
            return true;
        }
        return false;
    },
    _clearAccounts: function () {
        for (let [
                    ,
                    account
                ] in Iterator(this.accounts)) {
            account.authorized = false;
        }
        this.accounts.length = 0;
    },
    _switchDefaultAccount: function (aAccount) {
        let defaultAccount = this.getDefaultAccount();
        if (aAccount === defaultAccount) {
            return false;
        }
        let params = {
            action: "change_default",
            uid: aAccount.uid
        };
        this._debug("Switching default account to: " + aAccount.uid);
        this._sendEmbeddedAuthRequest(params);
        return true;
    },
    _openLogoutDialog: function () {
        this.app.passport.authAdapter.openLogoutDialog();
    },
    _sendEmbeddedAuthRequest: function (aParams) {
        let url = this.authdefs.LINKS.AUTH_PASSPORT_URL + "/passport?mode=embeddedauth";
        if (!aParams.yu) {
            aParams.yu = this.getYUIDValue() || "";
        }
        if (!aParams.retpath) {
            aParams.retpath = this.app.passport.authAdapter.TRIGGER_URL;
        }
        this._createEmbeddedAuthRequestTab(url, aParams);
    },
    _createEmbeddedAuthRequestTab: function (aURL, aParams) {
        let chromeWindow = this._coreLib.misc.mostRecentBrowserWindow;
        let gBrowser = chromeWindow.getBrowser();
        let postParams = this._createQueryParamsArray(aParams);
        let {tab: authTab} = this._coreLib.misc.navigateBrowser({
            url: aURL,
            target: "new tab",
            postData: postParams.join("&"),
            sourceWindow: chromeWindow,
            loadInBackground: true
        });
        gBrowser.hideTab(authTab);
        let FRAME_SCRIPT = function messageListener__FRAME_SCRIPT(aAppName) {
            addMessageListener(aAppName + "@yandex.ru:authManager:whoIsAuthTab", function (msg) {
                sendAsyncMessage(aAppName + "@yandex.ru:authManager:authTab");
            });
        };
        let scriptURL = "data:application/javascript;charset=utf-8," + encodeURIComponent("(" + FRAME_SCRIPT.toSource() + ")('" + this.app.name + "')");
        let messanger = authTab.linkedBrowser.messageManager;
        messanger.loadFrameScript(scriptURL, true);
        this._monitorEmbeddedAuthTabProgress(authTab);
    },
    _createQueryParamsArray: function (aParams = {}) {
        let params = [];
        for (let [
                    key,
                    val
                ] in Iterator(aParams)) {
            params.push(key + "=" + encodeURIComponent(val));
        }
        return params;
    },
    _monitorEmbeddedAuthTabProgress: function (aTab) {
        let progressListener = {
            progressTimer: null,
            QueryInterface: XPCOMUtils.generateQI([
                "nsIWebProgressListener",
                "nsISupportsWeakReference"
            ]),
            setProgressTimer: function () {
                this.progressTimer = new authManager._coreLib.sysutils.Timer(function () {
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
        let webProgress = aTab.linkedBrowser.webProgress;
        let tabHandler = function (aEvent) {
            aTab.control.removeEventListener("TabClose", tabHandler, false);
            webProgress.removeProgressListener(progressListener);
            cancelRevealTimer();
            progressListener.cancelProgressTimer();
        };
        aTab.control.addEventListener("TabClose", tabHandler, false);
        webProgress.addProgressListener(progressListener, webProgress.NOTIFY_STATE_ALL);
        let tabRevealTimer = new this._coreLib.sysutils.Timer(revealTab, 3000);
        function cancelRevealTimer() {
            if (tabRevealTimer) {
                tabRevealTimer.cancel();
                tabRevealTimer = null;
            }
        }
        function revealTab() {
            cancelRevealTimer();
            let chromeWindow = aTab.ownerGlobal;
            let gBrowser = chromeWindow.getBrowser();
            gBrowser.showTab(aTab);
            gBrowser.selectedTab = aTab;
        }
    },
    _setSession: function (sessionCookie) {
        this._debug("sessionId changed: " + sessionCookie.value);
        this._getAccountsFromServer();
    },
    _getAccountsFromServer: function () {
        this._cancelRetryGetAccountsFromServer();
        let yuidCookieValue = this.getYUIDValue() || "";
        let url = this.authdefs.LINKS.PASS_ROOT_URL + "/accounts/?yu=" + encodeURIComponent(yuidCookieValue);
        let reqConfig = {
            background: true,
            bypassCache: true,
            callbackFunc: this._accountsHandler.bind(this)
        };
        this._accountsFromServerRequest = this._coreLib.netutils.sendRequest(url, reqConfig);
    },
    _accountsHandler: function (aReq) {
        let request = aReq.target;
        if (this._coreLib.netutils.isReqError(aReq)) {
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
        this._clearAccounts();
        let accountsDescriptors = this._pwdmng.parseAccountsFromServer(accountsJSON.accounts);
        let defaultAccount;
        accountsDescriptors.forEach(function (aDescriptor) {
            let account = this._createAccount(aDescriptor);
            if (account.uid == accountsJSON.default_uid) {
                defaultAccount = account;
            } else {
                this._addAccount(account);
            }
        }, this);
        if (defaultAccount) {
            this._addAccount(defaultAccount);
        }
        this._pwdmng.saveAccounts(accountsDescriptors);
        this._onStateChanged();
    },
    _retryGetAccountsFromServer: function () {
        this._cancelRetryGetAccountsFromServer();
        let delay = 5 * Math.pow(2, this._getAccountsErrorCounter++);
        this._retryGetAccountsFromServerTimer = new this._coreLib.sysutils.Timer(this._getAccountsFromServer.bind(this), delay * 1000);
    },
    _cancelRetryGetAccountsFromServer: function () {
        if (this._retryGetAccountsFromServerTimer) {
            this._retryGetAccountsFromServerTimer.cancel();
            this._retryGetAccountsFromServerTimer = null;
        }
    },
    _authAnnihilation: function () {
        this._clearAccounts();
        this._onStateChanged();
    },
    _detectAccountChanges: function () {
        let prevStateAccounts = this._getState();
        let loginCounter = 0;
        let logoutCounter = 0;
        let defaultAccount = this.getDefaultAccount();
        let bothStatesAccounts = [];
        let currentAccountsIds = [];
        let changedAccountsIds = [];
        let currentAccounts = this.accounts.map(function (aAccount) {
            currentAccountsIds.push(aAccount.uid);
            return {
                id: aAccount.uid,
                isDefault: aAccount === defaultAccount
            };
        });
        prevStateAccounts.forEach(function (aPrevAccount) {
            let changed = false;
            let currentStateAccount;
            let index = currentAccountsIds.indexOf(aPrevAccount.id);
            if (index > -1) {
                currentStateAccount = currentAccounts[index];
            }
            if (!currentStateAccount) {
                changed = true;
                logoutCounter++;
            } else {
                if (aPrevAccount.isDefault && aPrevAccount.id != defaultAccount.uid) {
                    changed = true;
                }
                if (!aPrevAccount.isDefault && aPrevAccount.id == defaultAccount.uid) {
                    changed = true;
                }
                bothStatesAccounts.push(currentStateAccount);
            }
            if (changed) {
                changedAccountsIds.push(aPrevAccount.id);
            }
        });
        loginCounter = currentAccounts.filter(function (aCurrentAccount) {
            return bothStatesAccounts.indexOf(aCurrentAccount) < 0;
        }).length;
        if (changedAccountsIds.length) {
            let accountsDescriptors = this._pwdmng.getAccountsById(changedAccountsIds);
            accountsDescriptors.forEach(function (aDescriptor) {
                aDescriptor.authStateTimestamp = Date.now();
            });
            this._pwdmng.saveAccounts(accountsDescriptors);
        }
        let currentStateAccounts = this._pwdmng.getAccountsById(currentAccountsIds);
        currentStateAccounts.forEach(function (aCurrentStateAccount) {
            let account = this.getAuthorizedAccount(aCurrentStateAccount.uid);
            if (!account) {
                return;
            }
            account.authStateChangedTimestamp = aCurrentStateAccount.authStateTimestamp;
        }, this);
        this.accounts.sort(function (a, b) {
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
        let index = this.accounts.indexOf(defaultAccount);
        if (index > -1) {
            this.accounts.splice(index, 1);
            this._addAccount(defaultAccount);
        }
        if (loginCounter) {
            this.app.passport.authAdapter.sendAuthStatistics("login", loginCounter);
        }
        if (logoutCounter) {
            this.app.passport.authAdapter.sendAuthStatistics("logout", logoutCounter);
        }
        this._storeState(currentAccounts);
    },
    _getState: function () {
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
    _storeState: function (aStateObj) {
        if (!aStateObj) {
            return;
        }
        this._storedState = aStateObj;
        this.setPref(this._authSavedStatePrefName, JSON.stringify(this._storedState));
    },
    _onStateChanged: function () {
        this._detectAccountChanges();
        this._notifyListeners(this.EVENTS.AUTH_STATE_CHANGED, {
            accounts: this.accounts,
            hasAuth: Boolean(this.accounts.length),
            defaultAccount: this.getDefaultAccount()
        });
    },
    observe: function (subject, topic, data) {
        if (this._sessionCookies.indexOf(subject) > -1) {
            this._setSession(subject);
        }
    },
    _MODULES: {
        authdefs: "authdefs.jsm",
        pwdmng: "pwdmng.jsm"
    },
    _loadModules: function () {
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            let scope = Object.create(null);
            XPCOMUtils.importRelative(GLOBAL, moduleFileName, scope);
            let module = scope[moduleName] || GLOBAL[moduleName];
            if (typeof module.init == "function") {
                module.init(this.app);
            }
            delete GLOBAL[moduleName];
            this["_" + moduleName] = module;
        }
    },
    _debug: function (message) {
        if (this._logger) {
            this._logger.debug(message);
        } else {
            Cu.reportError("authManager._logger is undefined!\n" + message);
        }
    }
};
function Account(aDescriptor) {
    if (!aDescriptor.uid) {
        throw new Error("Account descriptor doesn't contain uid. " + JSON.stringify(aDescriptor).substr(0, 256));
    }
    this._uid = aDescriptor.uid;
    this._login = aDescriptor.login;
    this._displayName = aDescriptor.displayName;
    this._isSocial = !this._login;
    this._social = aDescriptor.social;
    this._authStateChanged = aDescriptor.authStateTimestamp || null;
    this._authorized = false;
}
Account.prototype = {
    constructor: Account,
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
    get login() {
        return this._login;
    },
    get displayName() {
        return this._displayName;
    },
    set displayName(val) {
        this._displayName = val;
    },
    get fullName() {
        return this.login || this.displayName;
    },
    get isSocial() {
        return this._isSocial;
    },
    get socialDescriptor() {
        return this._social;
    },
    set socialDescriptor(val) {
        this._social = val || Object.create(null);
    },
    get socialAuthProvider() {
        return this._social.provider;
    },
    get socialAuthProfileId() {
        return this._social.profileId;
    },
    get authStateChangedTimestamp() {
        return this._authStateChanged;
    },
    set authStateChangedTimestamp(val) {
        this._authStateChanged = val;
    },
    toString: function () {
        return this.login || this.uid;
    }
};
