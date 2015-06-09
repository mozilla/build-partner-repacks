"use strict";
const EXPORTED_SYMBOLS = ["dlgman"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
var utils;
const dlgman = {
    init: function yDlgMan_init(api) {
        if (this._initialized) {
            return;
        }
        this._api = api;
        Cu.import(this._api.Package.resolvePath("/native/fx/modules/utils.jsm"));
        this._welcome = this._getModule("welcome", "/native/fx/modules/welcome.jsm");
        utils.NotificationSource.objectMixIn(this);
        this._initialized = true;
    },
    EVENTS: { ON_DIALOG_CLOSE: "dlgman-dialog-close" },
    _subscribeToClose: function yDlgMan__subscribeToClose(dialog, callback) {
        let me = this;
        dialog.addEventListener("load", function loadEventListener(aLoadEvent) {
            aLoadEvent.currentTarget.removeEventListener("load", loadEventListener, false);
            aLoadEvent.currentTarget.addEventListener("unload", function unloadEventListener(aUnloadEvent) {
                aUnloadEvent.currentTarget.removeEventListener("unload", unloadEventListener, false);
                if (callback) {
                    callback();
                }
                me._notifyListeners(me.EVENTS.ON_DIALOG_CLOSE, dialog.name);
            }, false);
        }, false);
    },
    _openWindow: function yDlgMan__openWindow(parameters, needToRefresh) {
        let window;
        if ("name" in parameters && parameters.name) {
            window = Services.ww.getWindowByName(parameters.name, utils.mostRecentBrowserWindow);
            if (window) {
                if (needToRefresh) {
                    window.yaWinArguments = parameters.arguments || {};
                    if (typeof window.onload == "function") {
                        window.onload();
                    }
                }
                window.focus();
                return window;
            }
        }
        let parent;
        let features = parameters.features || "";
        if (features.indexOf("__popup__") != -1) {
            let featuresHash = Object.create(null);
            features.replace(/(^|,)__popup__($|,)/, "").split(",").forEach(function (aFeatureString) {
                if (aFeatureString) {
                    let [
                        name,
                        value
                    ] = aFeatureString.split("=");
                    if (name) {
                        featuresHash[name] = value;
                    }
                }
            });
            let addFeature = function (aFeatureString) {
                let [
                    name,
                    value
                ] = aFeatureString.split("=");
                if (!(name in featuresHash)) {
                    featuresHash[name] = value;
                }
            };
            addFeature("chrome");
            addFeature("dependent=yes");
            if (this._api.Environment.os.name != "windows") {
                addFeature("popup=yes");
            }
            let featuresMod = [];
            for (let [
                        name,
                        value
                    ] in Iterator(featuresHash)) {
                featuresMod.push(name + (value ? "=" + value : ""));
            }
            features = featuresMod.join(",");
            if (!("parent" in parameters)) {
                parent = utils.mostRecentBrowserWindow;
            }
        }
        parent = parent || parameters.parent || null;
        window = Services.ww.openWindow(parent, parameters.url, parameters.name || "_blank", features, null);
        window.yaWinArguments = parameters.arguments || {};
        return window;
    },
    _getModule: function yDlgMan__getModule(moduleName, modulePath) {
        let mScope = {};
        Cu.import(this._api.Package.resolvePath(modulePath), mScope);
        let module = mScope[moduleName];
        if (!module) {
            throw new Error("No module '" + moduleName + "' in " + modulePath);
        }
        if (typeof module.init == "function") {
            module.init(this._api);
        }
        return module;
    }
};
