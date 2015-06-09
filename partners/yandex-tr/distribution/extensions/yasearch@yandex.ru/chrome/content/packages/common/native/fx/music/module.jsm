"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const resources = { browser: { styles: ["/native/fx/bindings.css"] } };
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#music";
const core = {
    get authManager() {
        return this.API.Passport;
    },
    get API() {
        return this._api;
    },
    get slice() {
        return this._slice || this._createSlice();
    },
    get isPlaying() {
        return this._isPlaying;
    },
    get isFlashEnabled() {
        const versionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
        const ph = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
        let enabled = ph.getPluginTags({}).some(function (p) {
            if (p.name !== "Shockwave Flash" || p.disabled) {
                return false;
            }
            let version = (p.version || p.description.replace(p.name, "")).replace(/,/g, ".");
            return versionComparator.compare(version, "11") >= 0;
        });
        if (enabled) {
            delete this.isFlashEnabled;
            this.isFlashEnabled = true;
        }
        return enabled;
    },
    init: function (api) {
        this._api = api;
        this._loadModules();
        this.authManager.addListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    finalize: function () {
        this.authManager.removeListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
        this._api = null;
    },
    buildWidget: function (WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function (WIID, item, context) {
    },
    onNoMoreInstProjections: function (WIID) {
        this._destroySlice();
    },
    dayuseStatProvider: {
        isAuthorized: function () {
            return core.authManager.isAuthorized();
        }
    },
    play: function () {
        this._notifySlice({ message: "play" });
    },
    pause: function () {
        this._notifySlice({ message: "stop" });
    },
    showSlice: function (buttonElement) {
        if (!this.isFlashEnabled) {
            this._api.Controls.createSlice({
                url: this._api.Package.resolvePath("/native/fx/music/slice/noflash/music-noflash.html"),
                disposable: true
            }).show(buttonElement);
            return;
        }
        buttonElement.checked = true;
        this.slice.show(buttonElement, function onHide() {
            buttonElement.checked = false;
            this.API.Controls.getAllWidgetItems().forEach(function (item) {
                item.refreshPlayingState(true);
            });
        }.bind(this));
    },
    _api: null,
    _slice: null,
    _noFlashSlice: null,
    _isPlaying: false,
    _createSlice: function () {
        if (!this._slice) {
            this._slice = this._api.Controls.createSlice({
                url: "http://yastatic.net/elements/slice/music.html",
                messageHandler: this._messageHandler.bind(this)
            });
        }
        return this._slice;
    },
    _destroySlice: function () {
        if (!this._slice) {
            return;
        }
        this._slice.destroy();
        this._slice = null;
    },
    _getCurrentAccountData: function () {
        let defaultAccount = this.authManager.defaultAccount;
        let data = {
            userName: defaultAccount && defaultAccount.displayName || "",
            sessionId: this._getSessionIdCookie()
        };
        this._exposeObjectProps(data);
        return data;
    },
    _getSessionIdCookie: function () {
        let sessionId = null;
        try {
            sessionId = this.API.Network.findCookieValue("https://" + this.authManager.authdefs.DOMAINS.MAIN_DOMAIN + "/", "Session_id", true, false, false);
        } catch (e) {
            this.API.logger.debug("Couldn't get Session_id cookie.");
        }
        return sessionId;
    },
    _notifySlice: function (data) {
        if (!this._slice) {
            return;
        }
        this._exposeObjectProps(data);
        this._slice.notify(data);
    },
    _exposeObjectProps: function (aObj) {
        if (!("__exposedProps__" in aObj)) {
            aObj.__exposedProps__ = {};
            Object.keys(aObj).forEach(key => aObj.__exposedProps__[key] = "r");
        }
    },
    _onAuthStateChanged: function () {
        let isAuthorized = this.authManager.isAuthorized();
        this.API.logger.debug("[Music.Widget] " + this.authManager.EVENTS.AUTH_STATE_CHANGED + "; isAuthorized:" + isAuthorized);
        let msg = {
            message: "user.logout",
            data: null
        };
        if (isAuthorized) {
            msg.message = "user.login";
            msg.data = this._getCurrentAccountData();
            this.API.logger.debug("[Music.Widget] isAuth " + msg.data.userName + "; sessionId:" + msg.data.sessionId);
        }
        this._notifySlice(msg);
    },
    _messageHandler: function (messageData) {
        switch (messageData.message) {
        case "ready": {
                let data = this.authManager.isAuthorized() ? this._getCurrentAccountData() : {};
                this._notifySlice({
                    message: "init",
                    data: data
                });
                break;
            }
        case "set.play.state": {
                this._isPlaying = messageData.data.isPlaying === true;
                this.API.Controls.getAllWidgetItems().forEach(function (item) {
                    item.refreshPlayingState(false);
                });
                break;
            }
        case "stop": {
                this._isPlaying = false;
                this.API.Controls.getAllWidgetItems().forEach(function (item) {
                    item.stop();
                });
                break;
            }
        case "auth.dialog": {
                this.slice.hide();
                this.authManager.openAuthDialog({ retpath: "http://music." + this.authManager.authdefs.DOMAINS.MAIN_DOMAIN });
                break;
            }
        case "auth.logout": {
                this.slice.hide();
                this.authManager.logoutAccount(this.authManager.defaultAccount);
                break;
            }
        }
    },
    observe: function (aSubject, aType, aData) {
        if (!this._slice) {
            return;
        }
        switch (aType) {
        case this.authManager.EVENTS.AUTH_STATE_CHANGED:
            this._onAuthStateChanged();
            break;
        default:
            break;
        }
    },
    _MODULES: {
        dlgman: "dlgman.jsm",
        utils: "utils.jsm"
    },
    _loadModules: function () {
        let shAPI = this._api.shareableAPI;
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this._api.Package.resolvePath("/native/fx/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function") {
                module.init(shAPI);
            }
        }
    }
};
