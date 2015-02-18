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
const resources = {
    browser: {
        styles: ["/native/fx/textonly/textonly.css"],
        urlBarItems: { button: 10000 }
    }
};
const core = {
    api: null,
    init: function TextOnly_init(api) {
        this.api = api;
    },
    finalize: function TextOnly_finalize() {
        delete this.utils;
    },
    initURLBarItem: function TextOnly_initURLBarItem(itemElement, itemClass) {
        return new URLBarItem(itemElement, itemClass, this);
    },
    get utils() {
        let {utils} = Cu.import(this.api.Package.resolvePath("/native/fx/modules/common-auth/utils.jsm"));
        delete this.utils;
        return this.utils = utils;
    }
};
function URLBarItem(itemElement, itemClass, module) {
    itemElement.module = module;
    itemElement.setAttribute("yb-native-widget-name", "http://bar.yandex.ru/packages/yandexbar#textonly");
}
URLBarItem.prototype = {
    finalize: function TextOnlyUBItem_finalize() {
    }
};
