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
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    init: function MoneyWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function MoneyWidget_finalize() {
        delete this.utils;
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function MoneyWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function MoneyWidget_destroyWidget(WIID, item, context) {
        item.removeAttribute("yb-native-widget-name");
        item.removeAttribute("yb-native-widget-wiid");
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return core.authManager.authorized;
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return core.authManager.pwdmng.hasSavedAccounts;
        }
    },
    onButtonClick: function MoneyWidget_onButtonClick(event, widget) {
        if (this.authManager.authorized) {
            this.gotoHome(event);
        } else {
            let dialogParams = { retpath: this._getMoneyURL() };
            this.authManager.openAuthDialog(dialogParams);
        }
    },
    refreshData: function MoneyWidget_refreshData(event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoHome: function MoneyWidget_gotoHome(event) {
        this._navToMoneyPage("", event);
    },
    gotoShop: function MoneyWidget_gotoShop(event) {
        this._navToMoneyPage("shops.xml", event);
    },
    gotoPrepay: function MoneyWidget_gotoPrepay(event) {
        this._navToMoneyPage("prepaid.xml", event);
    },
    __stringBundle: null,
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this._api.Localization.createStringBundle("/native/fx/money.properties"));
    },
    _getMoneyURL: function MoneyWidget__getMoneyURL() {
        return this.utils.tryCreateFixupURI(this._stringBundle.get("MoneyHost")).spec;
    },
    _navToMoneyPage: function MoneyWidget__navToMoneyPage(page, origEvent) {
        let moneyURL = this._getMoneyURL() + (page ? "/" + page : "");
        this.API.Controls.navigateBrowser({
            url: moneyURL,
            eventInfo: origEvent
        });
    },
    _MODULES: {
        utils: "common-auth/utils.jsm",
        counters: "counters.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function MoneyWidget__loadModules() {
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
