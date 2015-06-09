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
const resources = {};
const core = {
    init: function ESync_init(api, opts) {
        this._api = api;
    },
    finalize: function ESync_finalize(opts) {
        this._api = null;
    },
    Settings: {
        getMainTemplate: function ESync_getMainTemplate() {
            return core._api.Package.getFileInputChannel("/content/settings/main.xml").contentStream;
        }
    },
    _api: null
};
