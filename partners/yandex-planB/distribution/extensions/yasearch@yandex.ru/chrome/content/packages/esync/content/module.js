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
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.importRelative(this, "require.jsm");
const WIDGET_ID = "http://bar.yandex.ru/packages/yandexbar#esync";
const PANEL_ID = "http://bar.yandex.ru/packages/yandexbar#esync-panel";
const resources = {
    browser: {
        styles: ["/content/browser.css"],
        urlBarItems: { button: 13000 }
    }
};
const core = {
    init: function ESync_init(api, opts) {
        this._api = api;
        require.NativeAPI = api;
        startup();
        require("service").Service.init();
    },
    finalize: function ESync_finalize(opts) {
        shutdown(opts);
        this._api = null;
    },
    initURLBarItem: function ESync_initURLBarItem(itemElement, itemClass) {
        itemElement.module = this;
        itemElement.setAttribute("yb-native-widget-name", WIDGET_ID);
        return {
            finalize: function ESync_URLBarItem_finalize() {
                itemElement.removeAttribute("yb-native-widget-name");
                itemElement.module = null;
            }
        };
    },
    Settings: {
        getMainTemplate: function ESync_getMainTemplate() {
            return core.API.Package.getFileInputChannel("/content/settings/main.xml").contentStream;
        }
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return require("auth").Auth.authorized;
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return require("auth").Auth.hasSavedLogins;
        }
    },
    get WIDGET_ID() WIDGET_ID,
    get PANEL_ID() PANEL_ID,
    get API() this._api,
    get require() require,
    _api: null
};
