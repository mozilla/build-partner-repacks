'use strict';
const EXPORTED_SYMBOLS = ['Preferences'];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
const MAX_INT = Math.pow(2, 31) - 1;
const MIN_INT = -MAX_INT;
function Preferences(args) {
    if (isObject(args)) {
        if (args.branch)
            this._prefBranch = args.branch;
        if (args.site)
            this._site = args.site;
    } else if (args)
        this._prefBranch = args;
}
Preferences.prototype = {
    get: function (prefName, defaultValue) {
        if (Array.isArray(prefName))
            return prefName.map(function (v) this.get(v, defaultValue), this);
        if (this._site)
            return this._siteGet(prefName, defaultValue);
        else
            return this._get(prefName, defaultValue);
    },
    _get: function (prefName, defaultValue) {
        switch (this._prefSvc.getPrefType(prefName)) {
        case Ci.nsIPrefBranch.PREF_STRING:
            return this._prefSvc.getComplexValue(prefName, Ci.nsISupportsString).data;
        case Ci.nsIPrefBranch.PREF_INT:
            return this._prefSvc.getIntPref(prefName);
        case Ci.nsIPrefBranch.PREF_BOOL:
            return this._prefSvc.getBoolPref(prefName);
        case Ci.nsIPrefBranch.PREF_INVALID:
            return defaultValue;
        default:
            throw 'Error getting pref ' + prefName + '; its value\'s type is ' + this._prefSvc.getPrefType(prefName) + ', which I don\'t know ' + 'how to handle.';
        }
    },
    _siteGet: function (prefName, defaultValue) {
        var value = this._contentPrefSvc.getPref(this._site, this._prefBranch + prefName);
        return typeof value != 'undefined' ? value : defaultValue;
    },
    set: function (prefName, prefValue) {
        if (isObject(prefName)) {
            for (let [
                        name,
                        value
                    ] in Iterator(prefName))
                this.set(name, value);
            return;
        }
        if (this._site)
            this._siteSet(prefName, prefValue);
        else
            this._set(prefName, prefValue);
    },
    overwrite: function (prefName, prefValue) {
        if (isObject(prefName)) {
            for (let [
                        name,
                        value
                    ] in Iterator(prefName))
                this.overwrite(name, value);
            return;
        }
        if (this._site)
            this._siteSet(prefName, prefValue);
        else
            this._set(prefName, prefValue, true);
    },
    _set: function (prefName, prefValue, overwrite) {
        var prefType;
        if (typeof prefValue != 'undefined' && prefValue != null)
            prefType = prefValue.constructor.name;
        var prefSvc = this._prefSvc;
        var storedValueType = prefSvc.getPrefType(prefName);
        switch (prefType) {
        case 'String': {
                let string = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
                string.data = prefValue;
                if (overwrite && storedValueType != prefSvc.PREF_STRING)
                    this._reset(prefName);
                this._prefSvc.setComplexValue(prefName, Ci.nsISupportsString, string);
            }
            break;
        case 'Number':
            if (prefValue > MAX_INT || prefValue < MIN_INT)
                throw 'you cannot set the ' + prefName + ' pref to the number ' + prefValue + ', as number pref values must be in the signed ' + '32-bit integer range -(2^31-1) to 2^31-1.  To store numbers ' + 'outside that range, store them as strings.';
            if (overwrite && storedValueType != prefSvc.PREF_INT)
                this._reset(prefName);
            this._prefSvc.setIntPref(prefName, prefValue);
            if (prefValue % 1 != 0)
                Cu.reportError('Warning: setting the ' + prefName + ' pref to the ' + 'non-integer number ' + prefValue + ' converted it ' + 'to the integer number ' + this.get(prefName) + '; to retain fractional precision, store non-integer ' + 'numbers as strings.');
            break;
        case 'Boolean':
            if (overwrite && storedValueType != prefSvc.PREF_BOOL)
                this._reset(prefName);
            this._prefSvc.setBoolPref(prefName, prefValue);
            break;
        default:
            throw 'can\'t set pref ' + prefName + ' to value \'' + prefValue + '\'; it isn\'t a String, Number, or Boolean';
        }
    },
    _siteSet: function (prefName, prefValue) {
        this._contentPrefSvc.setPref(this._site, this._prefBranch + prefName, prefValue);
    },
    has: function (prefName) {
        if (Array.isArray(prefName))
            return prefName.map(this.has, this);
        if (this._site)
            return this._siteHas(prefName);
        else
            return this._has(prefName);
    },
    _has: function (prefName) {
        return this._prefSvc.getPrefType(prefName) != Ci.nsIPrefBranch.PREF_INVALID;
    },
    _siteHas: function (prefName) {
        return this._contentPrefSvc.hasPref(this._site, this._prefBranch + prefName);
    },
    isSet: function (prefName) {
        if (Array.isArray(prefName))
            return prefName.map(this.isSet, this);
        return this.has(prefName) && this._prefSvc.prefHasUserValue(prefName);
    },
    modified: function (prefName) {
        return this.isSet(prefName);
    },
    reset: function (prefName) {
        if (Array.isArray(prefName)) {
            prefName.map(function (v) this.reset(v), this);
            return;
        }
        if (this._site)
            this._siteReset(prefName);
        else
            this._reset(prefName);
    },
    _reset: function (prefName) {
        try {
            this._prefSvc.clearUserPref(prefName);
        } catch (ex) {
            if (ex.result != Cr.NS_ERROR_UNEXPECTED)
                throw ex;
        }
    },
    _siteReset: function (prefName) {
        return this._contentPrefSvc.removePref(this._site, this._prefBranch + prefName);
    },
    lock: function (prefName) {
        if (Array.isArray(prefName))
            prefName.map(this.lock, this);
        this._prefSvc.lockPref(prefName);
    },
    unlock: function (prefName) {
        if (Array.isArray(prefName))
            prefName.map(this.unlock, this);
        this._prefSvc.unlockPref(prefName);
    },
    locked: function (prefName) {
        if (Array.isArray(prefName))
            return prefName.map(this.locked, this);
        return this._prefSvc.prefIsLocked(prefName);
    },
    observe: function (prefName, callback, thisObject) {
        var fullPrefName = this._prefBranch + (prefName || '');
        var observer = new PrefObserver(fullPrefName, callback, thisObject);
        Preferences._prefSvc.addObserver(fullPrefName, observer, true);
        observers.push(observer);
        return observer;
    },
    ignore: function (prefName, callback, thisObject) {
        var fullPrefName = this._prefBranch + (prefName || '');
        var [observer] = observers.filter(function (v) v.prefName == fullPrefName && v.callback == callback && v.thisObject == thisObject);
        if (observer) {
            Preferences._prefSvc.removeObserver(fullPrefName, observer);
            observers.splice(observers.indexOf(observer), 1);
        }
    },
    resetBranch: function (prefBranch) {
        try {
            this._prefSvc.resetBranch(prefBranch);
        } catch (ex) {
            if (ex.result == Cr.NS_ERROR_NOT_IMPLEMENTED)
                this.reset(this._prefSvc.getChildList(prefBranch, []));
            else
                throw ex;
        }
    },
    _prefBranch: '',
    site: function (site) {
        if (!(site instanceof Ci.nsIURI))
            site = this._ioSvc.newURI('http://' + site, null, null);
        return new Preferences({
            branch: this._prefBranch,
            site: site
        });
    },
    get _prefSvc() {
        var prefSvc = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch(this._prefBranch).QueryInterface(Ci.nsIPrefBranch2);
        this.__defineGetter__('_prefSvc', function () prefSvc);
        return this._prefSvc;
    },
    get _ioSvc() {
        var ioSvc = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        this.__defineGetter__('_ioSvc', function () ioSvc);
        return this._ioSvc;
    },
    get _contentPrefSvc() {
        var contentPrefSvc = Cc['@mozilla.org/content-pref/service;1'].getService(Ci.nsIContentPrefService);
        this.__defineGetter__('_contentPrefSvc', function () contentPrefSvc);
        return this._contentPrefSvc;
    }
};
Preferences.__proto__ = Preferences.prototype;
var observers = [];
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
    observe: function (subject, topic, data) {
        if (data != this.prefName)
            return;
        if (typeof this.callback == 'function') {
            let prefValue = Preferences.get(this.prefName);
            if (this.thisObject)
                this.callback.call(this.thisObject, prefValue);
            else
                this.callback(prefValue);
        } else
            this.callback.observe(subject, topic, data);
    }
};
function isObject(val) {
    return typeof val != 'undefined' && val != null && typeof val == 'object' && val.constructor.name == 'Object';
}
Preferences.prototype.observe2 = function (prefName, callback, thisObject) {
    var fullPrefName = this._prefBranch + (prefName || '');
    var observer = new PrefObserver2(fullPrefName, callback, thisObject);
    Preferences._prefSvc.addObserver(fullPrefName, observer, true);
    observers2.push(observer);
    return observer;
};
Preferences.prototype.ignore2 = function (prefName, callback, thisObject) {
    var fullPrefName = this._prefBranch + (prefName || '');
    var [observer] = observers2.filter(function (v) v.prefName == fullPrefName && v.callback == callback && v.thisObject == thisObject);
    if (observer) {
        Preferences._prefSvc.removeObserver(fullPrefName, observer);
        observers2.splice(observers2.indexOf(observer), 1);
    }
};
var observers2 = [];
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
    observe: function (subject, topic, data) {
        if (this.prefName.indexOf(data) == 0)
            return;
        if (typeof this.callback == 'function') {
            let prefValue = Preferences.get(this.prefName);
            if (this.thisObject)
                this.callback.call(this.thisObject, prefValue);
            else
                this.callback(prefValue);
        } else
            this.callback.observe(subject, topic, data);
    }
};
Preferences.prototype.loadFromString = function Preferences_loadFromString(prefsString) {
    if (!prefsString)
        return null;
    var result = true;
    const prefService = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService);
    const prefDefaultBranch = prefService.getDefaultBranch(null);
    function pref(aPrefName, aPrefValue) {
        if (!(aPrefName && typeof aPrefName == 'string'))
            return;
        switch (typeof aPrefValue) {
        case 'boolean':
            prefDefaultBranch.setBoolPref(aPrefName, aPrefValue);
            break;
        case 'number':
            prefDefaultBranch.setIntPref(aPrefName, aPrefValue);
            break;
        case 'string':
            prefDefaultBranch.setCharPref(aPrefName, aPrefValue);
            break;
        }
    }
    function user_pref(aPrefName, aPrefValue) {
        if (!(aPrefName && typeof aPrefName == 'string'))
            return;
        switch (typeof aPrefValue) {
        case 'boolean':
        case 'number':
        case 'string':
            Preferences.set(aPrefName, aPrefValue);
            break;
        }
    }
    function evalFromString(match, fnName, prefName, prefValue) {
        try {
            if (/["']/.test(prefValue)) {
                prefValue = '"' + prefValue.replace(/"/g, '\\"') + '"';
                prefValue = JSON.parse(prefValue).replace(/^["']|["']$/g, '');
            } else {
                prefValue = JSON.parse(prefValue);
            }
            switch (fnName) {
            case 'pref':
                pref(prefName, prefValue);
                break;
            case 'user_pref':
                user_pref(prefName, prefValue);
                break;
            default:
                throw new Error('Unknown pref function name ("' + fnName + '")');
                break;
            }
        } catch (e) {
            Cu.reportError(e);
            result = false;
        }
    }
    prefsString.replace(/((?:user_)?pref)\s*\(\s*['"](.+)['"],\s*(.+)\s*\);\s*$/gm, evalFromString);
    return result;
};
Preferences.prototype.loadFromFile = function Preferences_loadFromFile(prefsFile) {
    if (!(prefsFile instanceof Ci.nsIFile))
        throw new TypeError('nsIFile required');
    if (!prefsFile.exists())
        return null;
    var data = null;
    var is = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
    try {
        is.init(prefsFile, 1, 0, is.CLOSE_ON_EOF);
        let streamSize = is.available();
        let convStream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
        convStream.init(is, 'UTF-8', streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
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
    return this.loadFromString(data || '');
};
