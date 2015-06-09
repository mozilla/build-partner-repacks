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
    get API() {
        return this._api;
    },
    init: function (api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function () {
        delete this.utils;
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function (WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function (WIID, item, context) {
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
        isAuthorized: function () {
            return core.API.Passport.isAuthorized();
        },
        hasSavedLogins: function () {
            return core.API.Passport.hasSavedLogins();
        }
    },
    onButtonClick: function (event, widget) {
        if (this.API.Passport.isAuthorized()) {
            this.gotoFavAuth(event);
            return;
        }
        this.API.Passport.openAuthDialog({ retpath: this._getFotkiURL() });
    },
    refreshData: function (event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoFavAuth: function (event) {
        this._navToFotkiPage("favorites", event, true);
    },
    gotoMyPhotos: function (event) {
        this._navToFotkiPage("", event, true);
    },
    gotoComments: function (event) {
        this._navToFotkiPage("comments", event, true);
    },
    gotoUploadPhotos: function (event) {
        this._navToFotkiPage("upload", event);
    },
    __stringBundle: null,
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this._api.Localization.createStringBundle("/native/fx/fotki.properties"));
    },
    _getFotkiURL: function () {
        return this.utils.tryCreateFixupURI(this._stringBundle.get("FotkiHost")).spec;
    },
    _navToFotkiPage: function (page, origEvent, isConditional) {
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
        utils: "utils.jsm",
        counters: "counters.jsm"
    },
    _loadModules: function () {
        let shAPI = this.API.shareableAPI;
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this.API.Package.resolvePath("/native/fx/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function") {
                module.init(shAPI);
            }
        }
    }
};
