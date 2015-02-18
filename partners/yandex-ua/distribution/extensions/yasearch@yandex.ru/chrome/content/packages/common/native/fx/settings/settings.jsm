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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#settings";
const core = {
    init: function SettingsWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
    },
    finalize: function SettingsWidget_finalize() {
        delete this._api;
        delete this._logger;
    },
    buildWidget: function SettingsWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function SettingsWidget_destroyWidget(WIID, item, context) {
        item.removeAttribute("yb-native-widget-name");
        item.removeAttribute("yb-native-widget-wiid");
    },
    get API() {
        return this._api;
    }
};
