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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#money";
const core = {
    counterServiceID: 45,
    counterXpathExpr: "number(/s/c/money/@v)",
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
        delete this.__stringBundle;
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
        this.authManager.openAuthDialog({ retpath: this._getMoneyURL() });
    },
    refreshData: function (event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoHome: function (event) {
        this._navToMoneyPage("", event);
    },
    gotoShop: function (event) {
        this._navToMoneyPage("shops.xml", event);
    },
    gotoPrepay: function (event) {
        this._navToMoneyPage("prepaid.xml", event);
    },
    __stringBundle: null,
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this._api.Localization.createStringBundle("/native/fx/money.properties"));
    },
    _getMoneyURL: function () {
        return this.utils.tryCreateFixupURI(this._stringBundle.get("MoneyHost")).spec;
    },
    _navToMoneyPage: function (page, origEvent) {
        let moneyURL = this._getMoneyURL() + (page || "");
        this.API.Controls.navigateBrowser({
            url: moneyURL,
            eventInfo: origEvent
        });
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
