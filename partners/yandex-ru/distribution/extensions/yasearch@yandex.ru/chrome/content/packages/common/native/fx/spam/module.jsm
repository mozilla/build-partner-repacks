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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#spam";
const core = {
    init: function SpamWidget_init(api) {
        this._api = api;
        this._loadModules();
    },
    finalize: function SpamWidget_finalize() {
        delete this.utils;
        delete this._api;
        delete this._logger;
    },
    buildWidget: function SpamWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function SpamWidget_destroyWidget(WIID, item, context) {
        try {
            if (typeof item.spamDestroy == "function") {
                item.spamDestroy();
            }
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    get API() {
        return this._api;
    },
    visitedURLs: {},
    buildReportURL: function SpamWidget_buildReportURL(currURL, prevURL, refURI) {
        let baseURL = "http://bar-compl.yandex.ru/c";
        let referrerURL = refURI && refURI.userPass === "" ? refURI.spec : "";
        let oldURL = prevURL || referrerURL;
        let spamReportURL = baseURL + "?url=" + encodeURIComponent(currURL) + "&login=" + (this.dauth.user ? this.dauth.user.name : "");
        if (referrerURL) {
            spamReportURL += "&referer=" + encodeURIComponent(referrerURL);
        }
        if (oldURL) {
            spamReportURL += "&oldurl=" + encodeURIComponent(oldURL);
        }
        return spamReportURL;
    },
    navToSpamPage: function SpamWidget__navToSpamPage(origEvent) {
        let spamURL = "http://bar.yandex.ru/firefox/faq/#spam";
        this.API.Controls.navigateBrowser({
            url: spamURL,
            target: "new tab",
            eventInfo: origEvent
        });
    },
    get strBundle() {
        let bundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
        let bundle = bundleService.createBundle(this.API.Package.resolvePath("/native/fx/spam.properties"));
        delete this.strBundle;
        this.__defineGetter__("strBundle", function strBundle() {
            return bundle;
        });
        return this.strBundle;
    },
    getPref: function SpamWidget_getPref(strPrefName, defaultValue) {
        let prefFullName = this._api.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this._api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    _MODULES: {
        dauth: "yauth.jsm",
        utils: "utils.jsm"
    },
    _loadModules: function SpamWidget__loadModules() {
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
