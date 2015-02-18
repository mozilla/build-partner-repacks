"use strict";
const EXPORTED_SYMBOLS = ["communicator"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
let communicator = {
    init: function Communicator_init(api) {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this._api = api;
        this._components = Object.create(null);
    },
    finalize: function Communicator_finalize() {
        this._components = null;
    },
    enableComponent: function Communicator_enableComponent(wdgt) {
        if (!("WIDGET_ID" in wdgt)) {
            throw new Error("Component is not compatible with Communicator");
        }
        if (!this._getComponentEnabled(wdgt.WIDGET_ID)) {
            this._setComponentEnabled(wdgt.WIDGET_ID, wdgt);
        }
        return true;
    },
    disableComponent: function Communicator_disableComponent(wdgtID) {
        if (this._components[wdgtID]) {
            delete this._components[wdgtID];
        }
    },
    _getComponentEnabled: function Communicator_getComponentEnabled(wdgtID) {
        return this._components[wdgtID] || null;
    },
    _setComponentEnabled: function Communicator_getComponentEnabled(wdgtID, wdgt) {
        this._components[wdgtID] = wdgt;
    },
    communicate: function Communicator_communicate(wdgtID, topic, data) {
        let defer = this._api.Promise.defer();
        if (!this._getComponentEnabled(wdgtID)) {
            defer.resolve(false);
            return defer.promise;
        }
        switch (wdgtID) {
        case "ru.yandex.bar.mistype-corrector":
            if (topic == "could-perform") {
                let typo = this._getComponentEnabled("http://bar.yandex.ru/packages/yandexbar#typosquatting");
                if (!typo)
                    break;
                typo.isTabBad(data.tab, function (value) {
                    defer.resolve(!value);
                });
                return defer.promise;
            }
            break;
        case "http://bar.yandex.ru/packages/yandexbar#typosquatting":
            if (topic == "good-redirect") {
                let mc = this._getComponentEnabled("ru.yandex.bar.mistype-corrector");
                if (mc) {
                    mc.clearCheck(data.tab);
                }
            }
            break;
        }
        defer.resolve(true);
        return defer.promise;
    },
    _components: null,
    _initialized: null
};
