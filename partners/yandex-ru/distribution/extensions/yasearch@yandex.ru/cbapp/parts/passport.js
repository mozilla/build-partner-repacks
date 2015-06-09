"use strict";
const EXPORTED_SYMBOLS = ["passport"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const passport = {
    init: function (aApplication) {
        this._application = aApplication;
        this._logger = aApplication.getLogger("Passport");
        this._loadSubscripts();
    },
    finalize: function (doCleanup, callback) {
        this._finalizeSubscripts();
    },
    get authManager() {
        delete this.authManager;
        let path = "resource://" + this._application.name + "-app/parts/passport/common-auth/auth-manager.js";
        let authManager = Cu.import(path, {}).authManager;
        authManager.init(this._application);
        return this.authManager = authManager;
    },
    _subscripts: null,
    _subscriptsNames: null,
    _loadSubscripts: function () {
        let isVB = this._application.core.CONFIG.APP.TYPE === "vbff";
        let path = "passport/" + (isVB ? "vb" : "elements") + "/";
        this._loadSubscriptsFromDir(path);
    },
    _finalizeSubscripts: function () {
        this._subscriptsNames.reverse().forEach(function (subscriptName) {
            subscriptName = subscriptName.replace(/\.js$/, "");
            let subscript = this._subscripts[subscriptName];
            if (subscript && typeof subscript.finalize == "function") {
                this._logger.debug("Finalizing " + subscriptName + " subscript");
                subscript.finalize();
            }
            delete this._subscripts[subscriptName];
            delete this[subscriptName];
        }, this);
        this._subscripts = null;
    },
    _loadSubscriptsFromDir: function (aPath) {
        this._subscripts = Object.create(null);
        let subscriptsPath = this._application.partsURL + aPath;
        this._subscriptsNames = this._getSubscriptsNames("cbapp/parts/" + aPath);
        this._subscriptsNames.forEach(function (subscriptFileName) {
            let subscriptName = subscriptFileName.replace(/\.js$/, "");
            Cu.import(subscriptsPath + subscriptFileName, this._subscripts);
            let module = this._subscripts[subscriptName];
            if (!module) {
                throw new Error("Subscript " + subscriptName + " not loaded!");
            }
            this[subscriptName] = module;
            if (typeof module.init === "function") {
                module.init(this._application);
            }
        }, this);
    },
    _getSubscriptsNames: function (aPath) {
        let subscriptNames = [];
        let subscriptsDir = this._application.addonFS.getEntry(aPath);
        if (subscriptsDir.exists()) {
            let scripts = subscriptsDir.directoryEntries;
            while (scripts.hasMoreElements()) {
                let script = scripts.getNext();
                if (script.isFile() && /.+\.js$/.test(script.leafName)) {
                    subscriptNames.push(script.leafName);
                }
            }
        }
        return subscriptNames;
    }
};
