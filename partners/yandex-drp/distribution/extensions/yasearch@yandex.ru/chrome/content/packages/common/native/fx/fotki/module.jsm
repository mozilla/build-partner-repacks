"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = { browser: { styles: ["/native/fx/bindings.css"] } };
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#fotki";
const core = {
    counterServiceID: 46,
    counterXpathExpr: "number(/s/c/fotki/@v)",
    get authManager() {
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    init: function FotkiWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function FotkiWidget_finalize() {
        delete this.utils;
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function FotkiWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function FotkiWidget_destroyWidget(WIID, item, context) {
        try {
            if (typeof item.fotkiDestroy == "function") {
                item.fotkiDestroy();
            }
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return core.authManager.authorized;
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return core.authManager.pwdmng.hasSavedAccounts;
        }
    },
    onButtonClick: function FotkiWidget_onButtonClick(event, widget) {
        if (this.authManager.authorized) {
            this.gotoFavAuth(event);
        } else {
            let dialogParams = { retpath: this._getFotkiURL() };
            this.authManager.openAuthDialog(dialogParams);
        }
    },
    refreshData: function FotkiWidget_refreshData(event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoFavAuth: function FotkiWidget_gotoFavAuth(event) {
        this._navToFotkiPage("favorites", event, true);
    },
    gotoMyPhotos: function FotkiWidget_gotoMyPhotos(event) {
        this._navToFotkiPage("", event, true);
    },
    gotoComments: function FotkiWidget_gotoComments(event) {
        this._navToFotkiPage("comments", event, true);
    },
    gotoUploadPhotos: function FotkiWidget_gotoUploadPhotos(event) {
        this._navToFotkiPage("upload", event);
    },
    __stringBundle: null,
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this._api.Localization.createStringBundle("/native/fx/fotki.properties"));
    },
    _getFotkiURL: function FotkiWidget__getFotkiURL() {
        return this.utils.tryCreateFixupURI(this._stringBundle.get("FotkiHost")).spec;
    },
    _navToFotkiPage: function FotkiWidget__navToFotkiPage(page, origEvent, isConditional) {
        let fotkiURL = this._getFotkiURL();
        if (isConditional) {
            fotkiURL += "my/" + page;
        } else {
            fotkiURL += page;
        }
        this.API.Controls.navigateBrowser({
            url: fotkiURL,
            eventInfo: origEvent
        });
    },
    _MODULES: {
        utils: "common-auth/utils.jsm",
        counters: "counters.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function FotkiWidget__loadModules() {
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
