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
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    init: function MoikrugWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function MoikrugWidget_finalize() {
        delete this.utils;
        delete this._api;
        delete this._logger;
    },
    buildWidget: function MoikrugWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function MoikrugWidget_destroyWidget(WIID, item, context) {
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
    onButtonClick: function MoikrugWidget_onButtonClick(event, widget) {
        if (this.authManager.authorized) {
            this.gotoHome(event);
        } else {
            let dialogParams = { retpath: this._getURL() };
            this.authManager.openAuthDialog(dialogParams);
        }
    },
    refreshData: function MoikrugWidget_refreshData(event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoHome: function MoikrugWidget_gotoHome(event) {
        this.navigate(this._getURL(), event);
    },
    handleMenuCommand: function MoikrugWidget_handleMenuCommand(event) {
        let originalTarget = event.originalTarget;
        this.navigate(originalTarget.getAttribute("navURL"), event);
    },
    navigate: function MoikrugWidget_navigate(pageURL, origEvent) {
        this.API.Controls.navigateBrowser({
            url: pageURL,
            eventInfo: origEvent
        });
    },
    _getURL: function MoikrugWidget__getURL() {
        return "http://moikrug.ru/threads/?from=bar";
    },
    _MODULES: {
        utils: "common-auth/utils.jsm",
        counters: "counters.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function MoikrugWidget__loadModules() {
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
