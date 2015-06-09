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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#moikrug";
const core = {
    counterServiceID: 48,
    counterXpathExpr: "number(/s/c/moikrug/@v)",
    get authManager() {
        return this.API.Passport;
    },
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
    },
    buildWidget: function (WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function (WIID, item, context) {
        item.removeAttribute("yb-native-widget-name");
        item.removeAttribute("yb-native-widget-wiid");
    },
    dayuseStatProvider: {
        isAuthorized: function () {
            return core.authManager.isAuthorized();
        },
        hasSavedLogins: function () {
            return core.authManager.hasSavedLogins();
        }
    },
    onButtonClick: function (event, widget) {
        if (this.authManager.isAuthorized()) {
            this.gotoHome(event);
            return;
        }
        this.authManager.openAuthDialog({ retpath: this._getURL() });
    },
    refreshData: function (event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoHome: function (event) {
        this.navigate(this._getURL(), event);
    },
    handleMenuCommand: function (event) {
        let originalTarget = event.originalTarget;
        this.navigate(originalTarget.getAttribute("navURL"), event);
    },
    navigate: function (pageURL, origEvent) {
        this.API.Controls.navigateBrowser({
            url: pageURL,
            eventInfo: origEvent
        });
    },
    _getURL: function () {
        return "http://moikrug.ru/threads/?from=bar";
    },
    _MODULES: {
        utils: "utils.jsm",
        counters: "counters.jsm"
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
