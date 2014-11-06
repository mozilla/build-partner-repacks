"use strict";
EXPORTED_SYMBOLS.push("sysutils");
const sysutils = {
    get scriptSecurityManager() {
        delete this.scriptSecurityManager;
        return this.scriptSecurityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
    },
    dump: function SysUtils_dump(what, depth) {
        const brackets = {
            object: "{}",
            array: "[]"
        };
        function _dump(what, depth, stack) {
            if (!what) {
                return String(what);
            }
            let currIndent = strutils.repeatString("  ", stack.length);
            stack.push(what);
            let useBr = Array.isArray(what) ? brackets.array : brackets.object;
            let res = useBr[0];
            for (let propName in what) {
                let valStr;
                try {
                    let val = what[propName];
                    if (depth > stack.length && sysutils.isObject(val)) {
                        valStr = _dump(val, depth, stack);
                    } else {
                        if (typeof val == "string") {
                            valStr = [
                                "\"",
                                val,
                                "\""
                            ].join("");
                        } else {
                            valStr = String(val);
                        }
                    }
                } catch (e) {
                    valStr = "/conversion error/";
                }
                res += [
                    "\n",
                    currIndent,
                    "  ",
                    propName,
                    ": ",
                    valStr
                ].join("");
            }
            res += "\n" + currIndent + useBr[1];
            stack.pop();
            return res;
        }
        return _dump(what, depth, []);
    },
    get versionComparator() {
        let comparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
        this.__defineGetter__("versionComparator", function getVersionComparator() {
            return comparator;
        });
        return this.versionComparator;
    },
    get platformInfo() {
        let info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).QueryInterface(Ci.nsIXULRuntime);
        let os = info.OS;
        if (/^win/i.test(os)) {
            os = "windows";
        } else if (/^linux/i.test(os)) {
            os = "linux";
        } else if (/^darwin/i.test(os)) {
            os = "mac";
        }
        let comparator = this.versionComparator;
        let simpleArchitecture = info.XPCOMABI.split("-")[0] || "x86";
        if (simpleArchitecture == "x86_64") {
            simpleArchitecture = "x64";
        }
        let platformInfo = {
            browser: {
                name: "firefox",
                version: {
                    toString: function PBVersion_toString() {
                        return info.version;
                    },
                    isLessThan: function PBVersion_isLessThan(aVersion) {
                        return comparator.compare(this, aVersion) < 0;
                    },
                    isGreaterThan: function PBVersion_isGreaterThan(aVersion) {
                        return comparator.compare(this, aVersion) > 0;
                    },
                    isEqual: function PBVersion_isEqual(aVersion) {
                        return comparator.compare(this, aVersion) == 0;
                    }
                },
                architecture: info.XPCOMABI,
                simpleArchitecture: simpleArchitecture
            },
            os: { name: os }
        };
        this.__defineGetter__("platformInfo", function () {
            return platformInfo;
        });
        return this.platformInfo;
    },
    isEmptyObject: function SysUtils_isEmptyObject(obj) {
        for (let n in obj) {
            return false;
        }
        return true;
    },
    objectsAreEqual: function SysUtils_objectsAreEqual(obj1, obj2) {
        if (typeof obj1 != "object" || typeof obj2 != "object") {
            throw new TypeError("Objects expected");
        }
        if (obj1 === obj2) {
            return true;
        }
        if (Array.isArray(obj1) !== Array.isArray(obj2)) {
            return false;
        }
        let props1 = Object.keys(obj1);
        let props2 = Object.keys(obj2);
        if (props1.length !== props2.length) {
            return false;
        }
        return !props1.some(function compareProps(propName) {
            if (!(propName in obj2)) {
                return true;
            }
            let prop1 = obj1[propName];
            let prop2 = obj2[propName];
            if (typeof prop1 == "object" && typeof prop2 == "object") {
                if (!this.objectsAreEqual(prop1, prop2)) {
                    return true;
                }
            } else {
                if (prop1 !== prop2) {
                    return true;
                }
            }
        }, this);
    },
    freezeObj: function SysUtils_freezeObj_factory() {
        const watcher = function SysUtils_freezeObj_watcher(key, oldValue, newValue) {
            throw new TypeError("Can not modify property [" + key + "]: " + this + " is frozen");
        };
        return function SysUtils_freezeObj(obj) {
            if (obj.Object_freeze_self) {
                obj.Object_freeze_self();
                return;
            }
            let hasOwnProperty = Object.prototype.hasOwnProperty;
            for (let key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    let value = obj[key];
                    if (value && typeof value === "object") {
                        sysutils.freezeObj(value);
                    }
                }
                obj.watch(key, watcher);
            }
            if (Object.seal) {
                Object.seal(obj);
            }
        };
    }(),
    copyObj: function SysUtils_copyObj(src, deep) {
        if (typeof src != "object" || !src) {
            return src;
        }
        if (Array.isArray(src)) {
            return src.map(function (el) {
                return deep ? this.copyObj(el, deep) : el;
            }, this);
        }
        let result = {};
        for (let [
                    name,
                    value
                ] in Iterator(src)) {
            result[name] = deep ? this.copyObj(value, deep) : value;
        }
        return result;
    },
    mergeObj: function SysUtils_mergeObj() {
        let result = {};
        for (let i = 0; i < arguments.length; ++i) {
            let arg = arguments[i];
            this.copyProperties(arg, result);
        }
        return result;
    },
    copyProperties: function SysUtils_copyProperties(from, to, filter) {
        let filterFunc;
        if (filter) {
            filterFunc = typeof filter == "function" ? filter : function SysUtils_copyFilter(propName) {
                return propName in filter;
            };
        }
        let passValues = filterFunc && filterFunc.length > 1;
        let hasOwnProperty = Object.prototype.hasOwnProperty;
        for (let propName in from) {
            if (hasOwnProperty.call(from, propName) && (!filterFunc || filterFunc(propName, passValues ? from[propName] : undefined))) {
                to[propName] = from[propName];
            }
        }
    },
    sleep: function sysutils_sleep(aTimeout, aConditionFunction) {
        let func = typeof aConditionFunction == "function" ? aConditionFunction : function () {
            return true;
        };
        let timeout = 1;
        if (typeof aTimeout == "number" && aTimeout > 0) {
            timeout = aTimeout;
        }
        let t = Date.now();
        let conditionFunc = function () {
            return Date.now() - t < timeout && func();
        };
        let thread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
        while (conditionFunc()) {
            thread.processNextEvent(true);
        }
    },
    promiseSleep: function sysutils_promiseSleep(timeout, condition) {
        timeout = typeof timeout == "number" && timeout > 0 ? timeout : 0;
        let timeStep = Math.max(Math.floor(timeout / 100), 50);
        let timeStart = Date.now();
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        let _promiseSleep = function sysutils__promiseSleep() {
            let defer = promise.defer();
            if (typeof condition !== "function") {
                timer.initWithCallback(defer.resolve, timeout, timer.TYPE_ONE_SHOT);
            } else {
                if (condition() || Date.now() - timeStart >= timeout) {
                    defer.resolve();
                } else {
                    timer.initWithCallback(function () {
                        _promiseSleep(timeout, condition, timeStart).then(defer.resolve);
                    }, timeStep, timer.TYPE_ONE_SHOT);
                }
            }
            return defer.promise;
        };
        return _promiseSleep();
    },
    ensureValueTypeIs: function SysUtils_ensureValueTypeIs(val, typeDescr) {
        if (!this.valueTypeIs(val, typeDescr)) {
            throw new TypeError(strutils.formatString("Value '%1' type is not '%2'", [
                val,
                typeDescr
            ]));
        }
    },
    valueTypeIs: function SysUtils_valueTypeIs(val, typeDescr) {
        if (typeof typeDescr == "string") {
            return this.smartTypeOf(val) == typeDescr;
        }
        if (typeof typeDescr == "function") {
            return val instanceof typeDescr;
        }
        return false;
    },
    smartTypeOf: function SysUtils_smartTypeOf(val) {
        return val === null ? "null" : Array.isArray(val) ? "array" : typeof val;
    },
    isPlainObject: function SysUtils_isPlainObject(val) {
        return Object.getPrototypeOf(Object.getPrototypeOf(val)) === null;
    },
    isObject: function SysUtils_isObject(val) {
        return Boolean(val && Object.prototype.toString.call(val) == "[object Object]");
    },
    isNumber: function SysUtils_isNumber(x) {
        return typeof x == "number" && !isNaN(x);
    },
    cutNumberTo: function SysUtils_cutNumberTo(num, numDigits) {
        let intPart = Math.floor(num);
        let fracPart = num - intPart;
        let pow = Math.pow(10, numDigits);
        let cutFrac = Math.floor(fracPart * pow) / pow;
        return intPart + cutFrac;
    },
    defineLazyGetter: function SysUtils_defineLazyGetter(aObject, aName, aLambda) {
        aObject.__defineGetter__(aName, function SysUtils_lazyGetter() {
            delete aObject[aName];
            let getterValue = aLambda.apply(aObject);
            aObject.__defineGetter__(aName, function SysUtils_lazyGetter() {
                return getterValue;
            });
            return aObject[aName];
        });
    },
    defineLazyServiceGetter: function SysUtils_defineLazyServiceGetter(aObject, aName, aContract, aInterfaceName) {
        this.defineLazyGetter(aObject, aName, function SysUtils_lazyService() {
            return Cc[aContract].getService(Ci[aInterfaceName]);
        });
    },
    WeakObjectProxy: function WeakObjectProxy(object) {
        if (!sysutils.isObject(object)) {
            throw new CustomErrors.EArgType("object", "Object", object);
        }
        let inst = function weakRefInitializer() {
            let __storedObject = object;
            return {
                get isValid() {
                    return __storedObject !== undefined;
                },
                invoke: function WeakObjectProxy_invoke(methodName, methodArguments) {
                    if (!this.isValid) {
                        throw new Error("This weak object is invalid");
                    }
                    let method = __storedObject[methodName];
                    if (typeof method !== "function") {
                        throw new Error(strutils.formatString("No such method (%1)", [methodName]));
                    }
                    let args = Array.slice(arguments, 1);
                    return method.apply(__storedObject, args);
                },
                __noSuchMethod__: function WeakObjectProxy___noSuchMethod__(methodName, methodArguments) {
                    return this.invoke.apply(this, [methodName].concat(methodArguments));
                },
                clear: function WeakObjectProxy_clear() {
                    __storedObject = undefined;
                }
            };
        }();
        return inst;
    },
    _Ci: Components.interfaces,
    _Cc: Components.classes
};
sysutils.Interface = function Interface(name, methods, properties) {
    this._name = name.toString();
    this._properties = {};
    if (methods !== undefined) {
        if (!Array.isArray(methods)) {
            throw new TypeError("Methods must be described by an array of strings");
        }
        methods.forEach(function (methodName) {
            this._properties[methodName] = "function";
        }, this);
    }
    if (properties !== undefined) {
        if (!sysutils.isPlainObject(properties)) {
            throw new TypeError("Properties must be described by a plain map of properties");
        }
        sysutils.copyProperties(properties, this._properties);
    }
};
sysutils.Interface.prototype = {
    constructor: sysutils.Interface,
    get name() {
        return this._name;
    },
    isImplementedBy: function Interface_isImplementedBy(something, errors) {
        const errOut = Array.isArray(errors);
        for (let [
                    propName,
                    propDescr
                ] in Iterator(this._properties)) {
            if (!this._checkProperty(something, propName, propDescr)) {
                if (errOut) {
                    errors.push(propName);
                }
                return false;
            }
        }
        return true;
    },
    checkImplementation: function Interface_checkImplementation(something) {
        let missing = [];
        if (!this.isImplementedBy(something, missing)) {
            throw new CustomErrors.ENoInterface(this._name, missing);
        }
    },
    _name: undefined,
    _properties: null,
    _checkProperty: function Unterface__checkProperty(something, propName, propDescr) {
        if (!(propName in something)) {
            return false;
        }
        if (propDescr === undefined) {
            return true;
        }
        let actualValue = something[propName];
        if (propDescr instanceof this.constructor) {
            return propDescr.isImplementedBy(actualValue);
        } else {
            return sysutils.valueTypeIs(actualValue, propDescr);
        }
    }
};
sysutils.Timer = function Timer(aCallback, aDelay, aRepeating, aMaxTimes) {
    this.callback = aCallback;
    this.repeatingDelay = null;
    if (typeof aRepeating == "number") {
        if (aRepeating > 0) {
            this.repeatingDelay = aRepeating;
        }
    } else if (typeof aRepeating == "boolean") {
        if (aDelay > 0) {
            this.repeatingDelay = aDelay;
        }
    }
    this.timesCounter = 0;
    this.maxTimes = typeof aMaxTimes == "number" && aMaxTimes > 0 ? aMaxTimes : null;
    this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    let type = this.repeatingDelay ? this.timer.TYPE_REPEATING_SLACK : this.timer.TYPE_ONE_SHOT;
    this.timer.initWithCallback(this, aDelay, type);
    this._initTimestamp = Date.now();
    Services.obs.addObserver(this, "wake_notification", false);
};
sysutils.Timer.prototype = {
    get isRunning() {
        return Boolean(this.timer);
    },
    cancel: function Timer_cancel() {
        if (!this.timer) {
            return;
        }
        Services.obs.removeObserver(this, "wake_notification");
        this.timer.cancel();
        this.timer = null;
        this.callback = null;
        this._initTimestamp = null;
    },
    notify: function Timer_notify() {
        let result = this.callback();
        this.timesCounter++;
        this._initTimestamp = Date.now();
        if (this.repeatingDelay) {
            this.delay = this.repeatingDelay;
        }
        if (!this.repeatingDelay || this.maxTimes && this.timesCounter >= this.maxTimes) {
            this.cancel();
        }
        return result;
    },
    set delay(val) {
        if (this.timer) {
            this.timer.delay = val;
        }
    },
    observe: function Timer_observe(aSubject, aTopic, aData) {
        if (aTopic !== "wake_notification") {
            return;
        }
        if (!this.isRunning) {
            return;
        }
        let runTime = Date.now() - this._initTimestamp;
        if (runTime <= 0) {
            return;
        }
        this.delay = Math.max(0, this.timer.delay - runTime);
    },
    _initTimestamp: null,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsITimerCallback,
        Ci.nsIObserver
    ])
};
sysutils.DataContainer = function DataContainer(aContainerProperties) {
    this._dropAllData();
    let expirationTime = aContainerProperties && aContainerProperties.expirationTime;
    this._expirationTime = typeof expirationTime == "number" && expirationTime > 0 ? expirationTime : 24 * 60 * 60 * 1000;
    if (this._expirationTime) {
        let DataContainer_cleanup = function DataContainer_cleanup() {
            this._checkExpiredAll();
        }.bind(this);
        let cleanup = { notify: DataContainer_cleanup };
        let timerPeriod = Math.max(parseInt(this._expirationTime / 2, 10), 10 * 60 * 1000);
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback(cleanup, timerPeriod, Ci.nsITimer.TYPE_REPEATING_SLACK);
        this._cleanupTimer = timer;
    }
    if (aContainerProperties.convertKeyFunctions) {
        this._setConvertKeyFunctions(aContainerProperties.convertKeyFunctions);
    }
};
sysutils.DataContainer.prototype = {
    finalize: function DataContainer_finalize() {
        if (this._cleanupTimer) {
            this._cleanupTimer.cancel();
            this._cleanupTimer = null;
        }
        this._data = null;
        delete this._convertKey;
        delete this._unconvertKey;
    },
    get: function DataContainer_get(aKey) {
        let data = this._checkExpiredByKey(aKey);
        if (data) {
            data.lastAccessTime = Date.now();
            return data.value;
        }
        return null;
    },
    set: function DataContainer_set(aKey, aValue) {
        let key = this._convertKey(aKey);
        return this._data[key] = {
            value: aValue,
            lastAccessTime: Date.now()
        };
    },
    has: function DataContainer_has(aKey) {
        return Boolean(this._checkExpiredByKey(aKey));
    },
    remove: function DataContainer_remove(aKey) {
        let key = this._convertKey(aKey);
        return delete this._data[key];
    },
    clear: function DataContainer_clear() {
        this._dropAllData();
    },
    get keys() {
        this._checkExpiredAll();
        let items = this._data;
        function keysGenerator() {
            for (let k in items) {
                yield this._unconvertKey(k);
            }
        }
        keysGenerator.bind(this);
        return keysGenerator();
    },
    get values() {
        this._checkExpiredAll();
        let items = this._data;
        function valuesGenerator() {
            for (let k in items) {
                yield items[k].value;
            }
        }
        return valuesGenerator();
    },
    toString: function DataContainer_toString() {
        let arr = [];
        for (let [
                    k,
                    v
                ] in this) {
            arr.push(k + ": " + v);
        }
        return "{" + arr.join(", ") + "}";
    },
    __iterator__: function DataContainer___iterator__() {
        this._checkExpiredAll();
        for (let [
                    key,
                    item
                ] in Iterator(this._data)) {
            yield [
                this._unconvertKey(key),
                item.value
            ];
        }
    },
    _checkExpiredByKey: function DataContainer__checkExpiredByKey(aKey) {
        let key = this._convertKey(aKey);
        let item = this._data[key];
        if (!item) {
            return null;
        }
        if (this._expirationTime && Date.now() - item.lastAccessTime >= this._expirationTime) {
            this.remove(aKey);
            return null;
        }
        return item;
    },
    _checkExpiredAll: function DataContainer__checkExpiredAll() {
        if (!this._expirationTime) {
            return;
        }
        let minAccessTime = Date.now() - this._expirationTime;
        for (let [
                    key,
                    item
                ] in Iterator(this._data)) {
            if (item.lastAccessTime < minAccessTime) {
                this.remove(key);
            }
        }
    },
    _convertKey: function DataContainer__convertKey(aKey) {
        return ":" + aKey;
    },
    _unconvertKey: function DataContainer__unconvertKey(aKey) {
        return aKey.substr(1);
    },
    _setConvertKeyFunctions: function DataContainer__setConvertKeyFunctions({
        convert: convert,
        unconvert: unconvert
    }) {
        this._convertKey = convert;
        this._unconvertKey = unconvert;
        this._dropAllData();
    },
    _data: null,
    _cleanupTimer: null,
    _dropAllData: function DataContainer__dropAllData() {
        this._data = Object.create(null);
    }
};
