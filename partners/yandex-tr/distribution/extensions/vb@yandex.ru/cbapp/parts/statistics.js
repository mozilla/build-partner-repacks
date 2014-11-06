"use strict";
const EXPORTED_SYMBOLS = ["statistics"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const statistics = {
    init: function statistics_init(aApplication) {
        this._application = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._logger = aApplication.getLogger("Statistics");
        this._loadSubscripts();
    },
    finalize: function statistics_finalize(doCleanup, callback) {
        this._finalizeSubscripts();
        this._logger = null;
        this._application = null;
    },
    get alwaysSendUsageStat() {
        return this._application.preferences.get("stat.usage.send", null);
    },
    logClickStatistics: function statistics_logClickStatistics({dtype, pid, cid, path}) {
        if (!this.alwaysSendUsageStat)
            return;
        if (typeof dtype === "undefined")
            dtype = "stred";
        if (typeof pid === "undefined")
            pid = 12;
        if (typeof dtype === "string") {
            if (!dtype)
                throw new RangeError("dtype is empty string");
        } else {
            throw new TypeError("Invalid dtype type ('" + typeof dtype + "')");
        }
        if (typeof pid === "number") {
            if (pid < 0)
                throw new RangeError("Invalid pid value (" + pid + ")");
        } else {
            throw new TypeError("Wrong pid type ('" + typeof pid + "'). Number required.");
        }
        if (typeof cid === "number") {
            if (cid <= 0)
                throw new RangeError("Invalid cid value (" + cid + ")");
        } else {
            throw new TypeError("Wrong cid type ('" + typeof cid + "'). Number required.");
        }
        let url = "http://clck.yandex.ru/click" + "/dtype=" + encodeURIComponent(dtype) + "/pid=" + pid + "/cid=" + cid + "/path=" + encodeURIComponent(path);
        let extraString = "";
        let processedKeys = [
            "dtype",
            "pid",
            "cid",
            "path"
        ];
        for (let [
                    key,
                    value
                ] in Iterator(arguments[0])) {
            if (processedKeys.indexOf(key) !== -1)
                continue;
            if (key === "*") {
                extraString = value;
                continue;
            }
            url += "/" + key + "=" + encodeURIComponent(value);
        }
        url += "/*" + extraString;
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.open("GET", url, true);
        request.send(null);
    },
    _loadSubscripts: function statistics__loadSubscripts() {
        const statisticsDirPath = this._application.partsURL + "statistics/";
        this._subscripts = Object.create(null);
        this._subscriptsNames.forEach(function (subscriptName) {
            Cu.import(statisticsDirPath + subscriptName, this._subscripts);
            subscriptName = subscriptName.replace(/\.js$/, "");
            let subscript = this._subscripts[subscriptName];
            if (!subscript)
                throw new Error("Subscript " + subscriptName + " not loaded!");
            this[subscriptName] = subscript;
            if (typeof subscript.init === "function")
                subscript.init(this._application);
        }, this);
    },
    _finalizeSubscripts: function statistics__finalizeSubscripts() {
        this._subscriptsNames.reverse().forEach(function (subscriptName) {
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
    get _subscriptsNames() {
        let subscriptNames = [];
        let statisticsScriptsDir = this._application.core.extensionPathFile;
        "cbapp/parts/statistics".split("/").forEach(s => statisticsScriptsDir.append(s));
        if (statisticsScriptsDir.exists() && statisticsScriptsDir.isDirectory()) {
            let entries = statisticsScriptsDir.directoryEntries;
            while (entries.hasMoreElements()) {
                let entry = entries.getNext().QueryInterface(Ci.nsIFile);
                if (!entry.isFile())
                    continue;
                if (/.+\.js$/.test(entry.leafName))
                    subscriptNames.push(entry.leafName);
            }
        }
        delete this._subscriptsNames;
        return this._subscriptsNames = subscriptNames;
    },
    _application: null,
    _logger: null,
    _subscripts: null
};
