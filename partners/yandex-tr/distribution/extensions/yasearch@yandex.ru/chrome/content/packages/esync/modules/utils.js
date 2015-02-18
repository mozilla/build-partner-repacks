"use strict";
let EXPORTED_SYMBOLS = ["Utils"];
Cu.import("resource://gre/modules/Services.jsm");
let {Observers} = require("observers");
[
    [
        "UUID_GENERATOR",
        "@mozilla.org/uuid-generator;1",
        "nsIUUIDGenerator"
    ],
    [
        "URI_FIXUP",
        "@mozilla.org/docshell/urifixup;1",
        "nsIURIFixup"
    ]
].forEach(function ([
    name,
    contract,
    iface
]) {
    XPCOMUtils.defineLazyServiceGetter(this, name, contract, iface);
}, this);
let Utils = {
    sendRequest: function Utils_sendRequest(aURL, aDetails) {
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        if ("background" in aDetails) {
            request.mozBackgroundRequest = aDetails.background;
        }
        let method = aDetails.method || "GET";
        request.open(method, aURL, true);
        if (aDetails.bypassCache) {
            request.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
        }
        if (aDetails.anonymous) {
            request.channel.loadFlags |= Ci.nsIRequest.LOAD_ANONYMOUS;
        }
        if (aDetails.referrer) {
            request.setRequestHeader("Referrer", aDetails.referrer);
        }
        if (aDetails.timeout) {
            request.timeout = aDetails.timeout;
        }
        if (aDetails.data) {
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            request.setRequestHeader("Connection", "close");
        }
        if (aDetails.responseType) {
            request.responseType = aDetails.responseType;
        }
        if (aDetails.headers) {
            for (let [
                        headerName,
                        headerValue
                    ] in Iterator(aDetails.headers)) {
                request.setRequestHeader(headerName, headerValue);
            }
        }
        if (aDetails.callback) {
            let target = request.QueryInterface(Ci.nsIDOMEventTarget);
            target.addEventListener("load", aDetails.callback, false);
            target.addEventListener("error", aDetails.callback, false);
            target.addEventListener("timeout", aDetails.callback, false);
        }
        if (aDetails.data instanceof Uint8Array) {
            aDetails.data = aDetails.data.buffer;
        }
        request.send(aDetails.data || null);
        return request;
    },
    notify: function Utils_notify(prefix) {
        return function NotifyMaker(name, data, func) {
            let thisArg = this;
            let notify = function notify(state, subject) {
                let message = prefix + name + ":" + state;
                NativeAPI.logger.trace("Event: " + message);
                Observers.notify(message, subject, data);
            };
            return function WrappedNotify() {
                try {
                    notify("start", null);
                    let ret = func && func.call(thisArg);
                    notify("finish", ret);
                    return ret;
                } catch (ex) {
                    notify("error", ex);
                    throw ex;
                }
            }();
        };
    },
    namedTimer: function Utils_namedTimer(callback, wait, thisObj, name) {
        if (!thisObj || !name) {
            throw new Error("You must provide both an object and a property name for the timer!");
        }
        if (name in thisObj && thisObj[name] instanceof Ci.nsITimer) {
            thisObj[name].delay = wait;
            return;
        }
        let timer = Object.create(Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer));
        timer.clear = function timerClear() {
            thisObj[name] = null;
            timer.cancel();
        };
        timer.initWithCallback({
            notify: function notify() {
                timer.clear();
                callback.call(thisObj, timer);
            }
        }, wait, timer.TYPE_ONE_SHOT);
        return thisObj[name] = timer;
    },
    nextTick: function Utils_nextTick(callback, thisObj) {
        if (thisObj) {
            callback = callback.bind(thisObj);
        }
        Services.tm.currentThread.dispatch(callback, Ci.nsIThread.DISPATCH_NORMAL);
    },
    databaseWrapper: function Utils_databaseWrapper(dbConnection) {
        let dbWrapper = NativeAPI.Database.createInstance();
        dbWrapper.connection = dbConnection;
        return dbWrapper;
    },
    promiseQuery: function Database_promiseQuery(query, parameters) {
        let defer = NativeAPI.promise.defer();
        try {
            this.execQueryAsync(query, parameters, function Database_execQuerySpinningly_onCompletion(res, err) {
                if (err) {
                    defer.reject(err);
                    return;
                }
                defer.resolve(res);
            });
        } catch (ex) {
            defer.reject(ex);
        }
        return defer;
    },
    generateUUIDString: function Utils_generateUUIDString() {
        return UUID_GENERATOR.generateUUID().toString().substr(1, 8);
    },
    throttle: function Utils_throttle(callback, threshhold, delayed) {
        if (typeof threshhold !== "number" || threshhold <= 0) {
            throw new RangeError("Threshhold must be a positive number");
        }
        let last = 0;
        let deferTimer;
        let throttle = function throttle() {
            let now = Date.now();
            let args = arguments;
            let _callback = function _callback() {
                last = now;
                callback.apply(null, args);
            };
            throttle.cancel();
            if (!last && delayed) {
                last = now;
            }
            let diff = Math.max(0, threshhold - Math.abs(now - last));
            if (diff) {
                deferTimer = new NativeAPI.SysUtils.Timer(_callback, diff);
            } else {
                _callback();
            }
        };
        throttle.cancel = function throttle_cancel() {
            if (!deferTimer) {
                return;
            }
            deferTimer.cancel();
            deferTimer = null;
        };
        return throttle;
    },
    escapeTag: function Utils_escapeTag(str) {
        return str.split("").map(function (ch) {
            if (ch.charCodeAt(0) > 127 || ch.charCodeAt(0) <= 32) {
                return encodeURIComponent(ch);
            }
            ;
            return ch.replace(/["#%:<>\?\[\\\]^`{|} ]/, function (c) {
                return encodeURIComponent(c);
            });
        }).join("");
    },
    makeFIFO: function Utils_makeFIFO(func) {
        let stream = {
            input: [],
            processing: false,
            read: function () {
                stream.processing = true;
                while (stream.input.length) {
                    let args = stream.input.shift();
                    func.apply(this, args);
                }
                stream.processing = false;
            }
        };
        return function decoratedFuncWithFIFOBuffer() {
            let args = Array.prototype.slice.call(arguments);
            stream.input.push(args);
            if (!stream.processing) {
                stream.read.call(this);
            }
        };
    },
    url2ascii: function Utils_url2ascii(url) {
        try {
            let uri = URI_FIXUP.createFixupURI(url, URI_FIXUP.FIXUP_FLAG_NONE);
            return uri.asciiSpec;
        } catch (e) {
        }
        return url;
    },
    ascii2url: function Utils_ascii2url(asciiSpec) {
        try {
            let uri = URI_FIXUP.createFixupURI(asciiSpec, URI_FIXUP.FIXUP_FLAG_NONE);
            return uri.spec;
        } catch (e) {
        }
        return asciiSpec;
    }
};
