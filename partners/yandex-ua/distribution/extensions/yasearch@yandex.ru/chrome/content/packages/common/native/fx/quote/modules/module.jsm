"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const resources = { browser: { styles: ["/native/fx/quote/styles/quotes.css"] } };
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#quote";
const core = {
    init: function quotesWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
    },
    finalize: function quotesWidget_finalize() {
        delete this._api;
        delete this._logger;
    },
    buildWidget: function quotesWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function quotesWidget_destroyWidget(WIID, item, context) {
        try {
            if ("wdgtxDestructor" in item) {
                item.wdgtxDestructor();
            }
            delete item.module;
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    get api() {
        return this._api;
    },
    get xmlSerializer() {
        delete this.xmlSerializer;
        return this.xmlSerializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].getService(Ci.nsIDOMSerializer);
    },
    get clipboardHelper() {
        delete this.clipboardHelper;
        return this.clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    },
    componentPackagePath: "/native/fx/quote/",
    get componentPath() {
        delete this.componentPath;
        return this.componentPath = this._api.Package.resolvePath(this.componentPackagePath);
    },
    get stringBundle() {
        delete this.stringBundle;
        return this.stringBundle = this._api.Localization.createStringBundle(this.componentPackagePath + "strings.properties");
    },
    get isTrk() {
        delete this.isTrk;
        return this.isTrk = this.stringBundle.get("is_turkey") == "true";
    },
    get exportURL() {
        return this.stringBundle.get("export.url");
    },
    getExportURL: function quotesWidget_getExportURL(aWIID) {
        if (!aWIID) {
            throw new Error("aWIID is not specified");
        }
        let url = this.exportURL;
        if (this.isTrk) {
            let regionID = this.api.Settings.getValue("region-id", aWIID);
            url += "?region=" + regionID;
            let lang = this.stringBundle.get("wgt.quotes.lang.id");
            url += "&lang=" + lang;
        } else {
            let quotesID = String(this.api.Settings.getValue("quote-id", aWIID));
            url += quotesID === "0" ? "" : "?id=" + quotesID;
        }
        return url;
    }
};
