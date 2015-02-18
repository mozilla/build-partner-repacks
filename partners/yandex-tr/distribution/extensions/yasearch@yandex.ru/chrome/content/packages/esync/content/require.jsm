"use strict";
const EXPORTED_SYMBOLS = [
    "require",
    "startup",
    "shutdown",
    "onShutdown"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
let shutdownHandlers = [];
let onShutdown = {
    done: false,
    add: function onShutdown_add(handler) {
        if (shutdownHandlers.indexOf(handler) < 0) {
            shutdownHandlers.push(handler);
        }
    },
    remove: function onShutdown_remove(handler) {
        let index = shutdownHandlers.indexOf(handler);
        if (index !== -1) {
            shutdownHandlers.splice(index, 1);
        }
    }
};
const MODULES_BASE_URI = function () {
    let uri = Services.io.newURI(__URI__, null, null);
    uri = Services.io.newURI(uri.resolve("../modules/"), null, null);
    return uri;
}();
function require(path) {
    let baseURI = /^\.\.?\//.test(path) && (this && "requireBaseURL" in this) ? Services.io.newURI(this.requireBaseURL, null, null) : MODULES_BASE_URI;
    let url = Services.io.newURI(path, null, baseURI).spec + ".js";
    let scopes = require.scopes;
    if (!(url in scopes)) {
        scopes[url] = {
            Cc: Cc,
            Ci: Ci,
            Cr: Cr,
            Cu: Cu,
            XPCOMUtils: XPCOMUtils,
            Services: Services,
            require: require,
            NativeAPI: require.NativeAPI,
            onShutdown: onShutdown,
            exports: Object.create(null),
            requireBaseURL: url
        };
        let requireStartTime = Date.now();
        SCRIPT_LOADER.loadSubScript(url, scopes[url]);
        require.NativeAPI.logger.debug("require \"" + path + "\" in " + (Date.now() - requireStartTime) + "ms");
        (scopes[url].EXPORTED_SYMBOLS || []).forEach(function (name) {
            if (!(name in this.exports)) {
                this.exports[name] = this[name];
            }
        }, scopes[url]);
    }
    return scopes[url].exports;
}
require.scopes = Object.create(null);
require.NativeAPI = null;
function startup() {
    onShutdown.done = false;
}
function shutdown(opts) {
    onShutdown.done = true;
    shutdownHandlers.forEach(function (handler) {
        try {
            handler(opts);
        } catch (e) {
            Cu.reportError(e);
        }
    });
    shutdownHandlers = [];
    for (let [
                ,
                scope
            ] in Iterator(require.scopes)) {
        Object.keys(scope).forEach(function (key) {
            if (scope.__lookupGetter__(key) || scope.__lookupSetter__(key)) {
                delete scope[key];
            }
            scope[key] = null;
        });
    }
    require.scopes = Object.create(null);
    require.NativeAPI = null;
}
