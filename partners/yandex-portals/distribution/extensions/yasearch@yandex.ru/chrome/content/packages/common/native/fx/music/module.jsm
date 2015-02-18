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
        return this.authAdapter.authManager;
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
    init: function MusicWidget_init(api) {
        this._api = api;
        this._loadModules();
        this.authManager.addListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    finalize: function MusicWidget_finalize() {
        this._api = null;
        this.authManager.removeListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    buildWidget: function MusicWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function MusicWidget_destroyWidget(WIID, item, context) {
    },
    onNoMoreInstProjections: function MusicWidget_onNoMoreInstProjections(WIID) {
        this._destroySlice();
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return core.authManager.authorized;
        }
    },
    observe: function MusicWidget_observe(aSubject, aType, aData) {
        if (!this._slice) {
            return;
        }
        switch (aType) {
        case this.authManager.EVENTS.AUTH_STATE_CHANGED:
            this._api.logger.debug("[Music.Widget] " + this.authManager.EVENTS.AUTH_STATE_CHANGED + " isAuth " + this.authManager.authorized);
            let isAuth = this.authManager.authorized;
            let message = isAuth ? "user.login" : "user.logout";
            let data = {
                message: message,
                data: null
            };
            if (isAuth) {
                this._api.logger.debug("[Music.Widget] isAuth " + this.authManager.getTopUser().displayName + " sessionId " + this.authManager.getYandexCookie("Session_id", false));
                data.data = this._getCurrentUserData();
            }
            this._notifySlice(data);
            break;
        default:
            break;
        }
    },
    play: function MusicWidget_play() {
        this._notifySlice({ message: "play" });
    },
    pause: function MusicWidget_pause() {
        this._notifySlice({ message: "stop" });
    },
    showSlice: function MusicWidget_showSlice(buttonElement) {
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
    _createSlice: function MusicWidget__createSlice() {
        if (!this._slice) {
            this._slice = this._api.Controls.createSlice({
                url: "http://yastatic.net/elements/slice/music.html",
                messageHandler: this._messageHandler.bind(this)
            });
        }
        return this._slice;
    },
    _getCurrentUserData: function MusicWidget__getCurrentUserData() {
        let defaultUser = this.authManager.getTopUser();
        return {
            userName: defaultUser && defaultUser.displayName || "",
            sessionId: this.authManager.getYandexCookie("Session_id", false),
            __exposedProps__: {
                userName: "r",
                sessionId: "r"
            }
        };
    },
    _destroySlice: function MusicWidget__destroySlice() {
        if (!this._slice) {
            return;
        }
        this._slice.destroy();
        this._slice = null;
    },
    _notifySlice: function MusicWidget__notifySlice(data) {
        if (!this._slice) {
            return;
        }
        if (!("__exposedProps__" in data)) {
            data.__exposedProps__ = {};
            Object.keys(data).forEach(key => data.__exposedProps__[key] = "r");
        }
        this._slice.notify(data);
    },
    _messageHandler: function MusicWidget__messageHandler(messageData) {
        switch (messageData.message) {
        case "ready": {
                let data = this.authManager.authorized ? this._getCurrentUserData() : {};
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
                let defaultUser = this.authManager.getTopUser();
                if (defaultUser) {
                    this.authManager.initLogoutProcess(defaultUser);
                }
                break;
            }
        }
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
    _MODULES: {
        dlgman: "dlgman.jsm",
        utils: "common-auth/utils.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function MusicWidget__loadModules() {
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
    },
    _api: null,
    _slice: null,
    _noFlashSlice: null,
    _isPlaying: false
};
