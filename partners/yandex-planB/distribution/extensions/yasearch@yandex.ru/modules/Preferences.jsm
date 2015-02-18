"use strict";
const EXPORTED_SYMBOLS = ["Preferences"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const MAX_INT = Math.pow(2, 31) - 1;
const MIN_INT = -MAX_INT;
let observers = [];
let observers2 = [];
function Preferences(args) {
    if (isObject(args)) {
        if (args.branch) {
            this._prefBranch = args.branch;
        }
        if (args.site) {
            this._site = args.site;
        }
    } else if (args) {
        this._prefBranch = args;
    }
}
Preferences.get = function Preferences_get(prefName, defaultValue) {
    if (Array.isArray(prefName)) {
        return prefName.map(function (v) {
            return this.get(v, defaultValue);
        }, this);
    }
    if (this._site) {
        return this._siteGet(prefName, defaultValue);
    }
    return this._get(prefName, defaultValue);
};
Preferences._get = function Preferences__get(prefName, defaultValue) {
    switch (this._prefs.getPrefType(prefName)) {
    case Ci.nsIPrefBranch.PREF_STRING:
        return this._prefs.getComplexValue(prefName, Ci.nsISupportsString).data;
    case Ci.nsIPrefBranch.PREF_INT:
        return this._prefs.getIntPref(prefName);
    case Ci.nsIPrefBranch.PREF_BOOL:
        return this._prefs.getBoolPref(prefName);
    case Ci.nsIPrefBranch.PREF_INVALID:
        return defaultValue;
    default:
        throw "Error getting pref " + prefName + "; its value's type is " + this._prefs.getPrefType(prefName) + ", which I don't know " + "how to handle.";
    }
};
Preferences._siteGet = function Preferences__siteGet(prefName, defaultValue) {
    let value = Services.contentPrefs.getPref(this._site, this._prefBranch + prefName);
    return typeof value != "undefined" ? value : defaultValue;
};
Preferences.set = function Preferences_set(prefName, prefValue) {
    if (isObject(prefName)) {
        for (let [
                    name,
                    value
                ] in Iterator(prefName)) {
            this.set(name, value);
        }
        return;
    }
    if (this._site) {
        this._siteSet(prefName, prefValue);
    } else {
        this._set(prefName, prefValue);
    }
};
Preferences.overwrite = function Preferences_overwrite(prefName, prefValue) {
    if (isObject(prefName)) {
        for (let [
                    name,
                    value
                ] in Iterator(prefName)) {
            this.overwrite(name, value);
        }
        return;
    }
    if (this._site) {
        this._siteSet(prefName, prefValue);
    } else {
        this._set(prefName, prefValue, true);
    }
};
Preferences._set = function Preferences__set(prefName, prefValue, overwrite) {
    let prefType;
    if (typeof prefValue !== "undefined" && prefValue !== null) {
        prefType = prefValue.constructor.name;
    }
    let storedValueType = this._prefs.getPrefType(prefName);
    switch (prefType) {
    case "String": {
            let string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
            string.data = prefValue;
            if (overwrite && storedValueType != this._prefs.PREF_STRING) {
                this._reset(prefName);
            }
            this._prefs.setComplexValue(prefName, Ci.nsISupportsString, string);
        }
        break;
    case "Number":
        if (prefValue > MAX_INT || prefValue < MIN_INT) {
            throw "you cannot set the " + prefName + " pref to the number " + prefValue + ", as number pref values must be in the signed " + "32-bit integer range -(2^31-1) to 2^31-1.  To store numbers " + "outside that range, store them as strings.";
        }
        if (overwrite && storedValueType != this._prefs.PREF_INT) {
            this._reset(prefName);
        }
        this._prefs.setIntPref(prefName, prefValue);
        if (prefValue % 1 !== 0) {
            Cu.reportError("Warning: setting the " + prefName + " pref to the " + "non-integer number " + prefValue + " converted it " + "to the integer number " + this.get(prefName) + "; to retain fractional precision, store non-integer " + "numbers as strings.");
        }
        break;
    case "Boolean":
        if (overwrite && storedValueType != this._prefs.PREF_BOOL) {
            this._reset(prefName);
        }
        this._prefs.setBoolPref(prefName, prefValue);
        break;
    default:
        throw "can't set pref " + prefName + " to value '" + prefValue + "'; it isn't a String, Number, or Boolean";
    }
};
Preferences._siteSet = function Preferences__siteSet(prefName, prefValue) {
    Services.contentPrefs.setPref(this._site, this._prefBranch + prefName, prefValue);
};
Preferences.has = function Preferences_has(prefName) {
    if (Array.isArray(prefName)) {
        return prefName.map(this.has, this);
    }
    if (this._site) {
        return this._siteHas(prefName);
    }
    return this._has(prefName);
};
Preferences._has = function Preferences__has(prefName) {
    return this._prefs.getPrefType(prefName) != Ci.nsIPrefBranch.PREF_INVALID;
};
Preferences._siteHas = function Preferences__siteHas(prefName) {
    return Services.contentPrefs.hasPref(this._site, this._prefBranch + prefName);
};
Preferences.isSet = function Preferences_isSet(prefName) {
    if (Array.isArray(prefName)) {
        return prefName.map(this.isSet, this);
    }
    return this.has(prefName) && this._prefs.prefHasUserValue(prefName);
};
Preferences.modified = function Preferences_modified(prefName) {
    return this.isSet(prefName);
};
Preferences.reset = function Preferences_reset(prefName) {
    if (Array.isArray(prefName)) {
        prefName.map(function (v) {
            return this.reset(v);
        }, this);
        return;
    }
    if (this._site) {
        this._siteReset(prefName);
    } else {
        this._reset(prefName);
    }
};
Preferences._reset = function Preferences__reset(prefName) {
    try {
        this._prefs.clearUserPref(prefName);
    } catch (ex) {
        if (ex.result != Cr.NS_ERROR_UNEXPECTED) {
            throw ex;
        }
    }
};
Preferences._siteReset = function Preferences__siteReset(prefName) {
    return Services.contentPrefs.removePref(this._site, this._prefBranch + prefName);
};
Preferences.lock = function Preferences_lock(prefName) {
    if (Array.isArray(prefName)) {
        prefName.map(this.lock, this);
    }
    this._prefs.lockPref(prefName);
};
Preferences.unlock = function Preferences_unlock(prefName) {
    if (Array.isArray(prefName)) {
        prefName.map(this.unlock, this);
    }
    this._prefs.unlockPref(prefName);
};
Preferences.locked = function Preferences_locked(prefName) {
    if (Array.isArray(prefName)) {
        return prefName.map(this.locked, this);
    }
    return this._prefs.prefIsLocked(prefName);
};
Preferences.observe = function Preferences_observe(prefName, callback, thisObject) {
    let fullPrefName = this._prefBranch + (prefName || "");
    let observer = new PrefObserver(fullPrefName, callback, thisObject);
    Services.prefs.addObserver(fullPrefName, observer, true);
    observers.push(observer);
    return observer;
};
Preferences.ignore = function Preferences_ignore(prefName, callback, thisObject) {
    let fullPrefName = this._prefBranch + (prefName || "");
    let [observer] = observers.filter(function (v) {
        return v.prefName == fullPrefName && v.callback == callback && v.thisObject == thisObject;
    });
    if (observer) {
        Services.prefs.removeObserver(fullPrefName, observer);
        observers.splice(observers.indexOf(observer), 1);
    }
};
Preferences.resetBranch = function Preferences_resetBranch(prefBranch) {
    try {
        Services.prefs.resetBranch(prefBranch);
    } catch (ex) {
        if (ex.result == Cr.NS_ERROR_NOT_IMPLEMENTED) {
            this.reset(Services.prefs.getChildList(prefBranch, []));
        } else {
            throw ex;
        }
    }
};
Preferences._prefBranch = "";
Preferences.site = function Preferences_site(site) {
    if (!(site instanceof Ci.nsIURI)) {
        site = Services.io.newURI("http://" + site, null, null);
    }
    return new Preferences({
        branch: this._prefBranch,
        site: site
    });
};
Object.defineProperty(Preferences, "_prefs", {
    get: function Preferences__prefs() {
        return Services.prefs.getBranch(this._prefBranch);
    }
});
Preferences.prototype = Preferences;
function PrefObserver(prefName, callback, thisObject) {
    this.prefName = prefName;
    this.callback = callback;
    this.thisObject = thisObject;
}
PrefObserver.prototype = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsISupportsWeakReference
    ]),
    observe: function PrefObserver_observe(subject, topic, data) {
        if (data != this.prefName) {
            return;
        }
        if (typeof this.callback == "function") {
            let prefValue = Preferences.get(this.prefName);
            if (this.thisObject) {
                this.callback.call(this.thisObject, prefValue);
            } else {
                this.callback(prefValue);
            }
        } else {
            this.callback.observe(subject, topic, data);
        }
    }
};
function isObject(val) {
    return typeof val !== "undefined" && val !== null && typeof val === "object" && val.constructor.name === "Object";
}
Preferences.observe2 = function Preferences_observe2(prefName, callback, thisObject) {
    let fullPrefName = this._prefBranch + (prefName || "");
    let observer = new PrefObserver2(fullPrefName, callback, thisObject);
    Services.prefs.addObserver(fullPrefName, observer, true);
    observers2.push(observer);
    return observer;
};
Preferences.ignore2 = function Preferences_ignore2(prefName, callback, thisObject) {
    let fullPrefName = this._prefBranch + (prefName || "");
    let [observer] = observers2.filter(function (v) {
        return v.prefName == fullPrefName && v.callback == callback && v.thisObject == thisObject;
    });
    if (observer) {
        Services.prefs.removeObserver(fullPrefName, observer);
        observers2.splice(observers2.indexOf(observer), 1);
    }
};
function PrefObserver2(prefName, callback, thisObject) {
    this.prefName = prefName;
    this.callback = callback;
    this.thisObject = thisObject;
}
PrefObserver2.prototype = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsISupportsWeakReference
    ]),
    observe: function PrefObserver2_observe(subject, topic, data) {
        if (this.prefName.indexOf(data) === 0) {
            return;
        }
        if (typeof this.callback == "function") {
            let prefValue = Preferences.get(this.prefName);
            if (this.thisObject) {
                this.callback.call(this.thisObject, prefValue);
            } else {
                this.callback(prefValue);
            }
        } else {
            this.callback.observe(subject, topic, data);
        }
    }
};
Preferences.loadFromString = function Preferences_loadFromString(prefsString) {
    if (!prefsString) {
        return null;
    }
    let result = true;
    const prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
    const prefDefaultBranch = prefService.getDefaultBranch(null);
    function pref(aPrefName, aPrefValue) {
        if (!(aPrefName && typeof aPrefName == "string")) {
            return;
        }
        switch (typeof aPrefValue) {
        case "boolean":
            prefDefaultBranch.setBoolPref(aPrefName, aPrefValue);
            break;
        case "number":
            prefDefaultBranch.setIntPref(aPrefName, aPrefValue);
            break;
        case "string":
            prefDefaultBranch.setCharPref(aPrefName, aPrefValue);
            break;
        }
    }
    function user_pref(aPrefName, aPrefValue) {
        if (!(aPrefName && typeof aPrefName == "string")) {
            return;
        }
        switch (typeof aPrefValue) {
        case "boolean":
        case "number":
        case "string":
            Preferences.set(aPrefName, aPrefValue);
            break;
        }
    }
    function evalFromString(match, fnName, prefName, prefValue) {
        try {
            if (/["']/.test(prefValue)) {
                prefValue = "\"" + prefValue.replace(/"/g, "\\\"") + "\"";
                prefValue = JSON.parse(prefValue).replace(/^['"]|["']$/g, "");
            } else {
                prefValue = JSON.parse(prefValue);
            }
            switch (fnName) {
            case "pref":
                pref(prefName, prefValue);
                break;
            case "user_pref":
                user_pref(prefName, prefValue);
                break;
            default:
                throw new Error("Unknown pref function name ('" + fnName + "')");
            }
        } catch (e) {
            Cu.reportError(e);
            result = false;
        }
    }
    prefsString.replace(/((?:user_)?pref)\s*\(\s*['"](.+)['"],\s*(.+)\s*\);\s*$/gm, evalFromString);
    return result;
};
Preferences.loadFromFile = function Preferences_loadFromFile(prefsFile) {
    if (!(prefsFile instanceof Ci.nsIFile)) {
        throw new TypeError("nsIFile required");
    }
    if (!prefsFile.exists()) {
        return null;
    }
    let data = null;
    let is = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
    try {
        const MODE_RDONLY = 1;
        is.init(prefsFile, MODE_RDONLY, 0, is.CLOSE_ON_EOF);
        let streamSize = is.available();
        let convStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
        convStream.init(is, "UTF-8", streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        let outObject = {};
        try {
            convStream.readString(streamSize, outObject);
            data = outObject.value;
        } catch (e) {
            Cu.reportError(e);
            return false;
        } finally {
            convStream.close();
        }
    } catch (e) {
        Cu.reportError(e);
        return false;
    } finally {
        is.close();
    }
    return this.loadFromString(data || "");
};
