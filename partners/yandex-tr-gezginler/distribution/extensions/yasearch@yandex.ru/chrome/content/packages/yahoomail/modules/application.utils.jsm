var EXPORTED_SYMBOLS = ["module"];
var HTTPRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"];
var WM = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
var module = function (application) {
    application.utils = {
        extend: function (target, source) {
            for (var i in source) {
                if (source.hasOwnProperty(i)) {
                    target[i] = this.clone(source[i]);
                }
            }
        },
        clone: function (object) {
            if (!object || "object" !== typeof object) {
                return object;
            }
            var clone = this.isArray(object) ? [] : {};
            var value;
            for (var prop in object) {
                if (object.hasOwnProperty(prop)) {
                    value = object[prop];
                    clone[prop] = this.clone(value);
                }
            }
        },
        isArray: function (object) {
            if ("object" === typeof object && "function" === typeof object.pop) {
                return true;
            }
            return false;
        },
        getCurrentTimestamp: function () {
            return Math.floor(new Date().getTime() / 1000);
        },
        urlQuery2object: function (query) {
            var pairs = query.split("&");
            var object = {};
            for (var i = 0, len = pairs.length; i < len; ++i) {
                var pair = pairs[i].split("=");
                object[pair[0]] = pair[1];
            }
            return object;
        },
        Request: function (url, method, callbacks) {
            try {
                var req = HTTPRequest.createInstance();
                req.onreadystatechange = OnStatus;
                req.open(method, url, true);
            } catch (e) {
                return null;
            }
            function OnStatus() {
                if (this.readyState == 4) {
                    if (this.status >= 200 && this.status < 400) {
                        if (callbacks && callbacks.onLoad) {
                            callbacks.onLoad(this.responseText);
                        }
                    } else {
                        if (callbacks && callbacks.onError) {
                            callbacks.onError(this.responseText);
                        }
                    }
                }
            }
            return req;
        },
        createLocationListener: function (changeListener) {
            var progressListener = function (callbacks) {
                var $ = this, empty = function () {
                    };
                $.QueryInterface = function (aIID) {
                    if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports)) {
                        return this;
                    } else {
                        throw Components.results.NS_NOINTERFACE;
                    }
                };
                $.onLocationChange = function (aWebProgress, aRequest, aLocation) {
                    return changeListener.call(this, callbacks, aWebProgress, aRequest, aLocation);
                };
                $.onProgressChange = empty;
                $.onSecurityChange = empty;
                $.onStateChange = empty;
                $.onStatusChange = empty;
            };
            return progressListener;
        },
        CallbackObject: function (success, error) {
            var $ = this;
            var empty = function () {
            };
            $.success = function () {
                try {
                    return success.apply($, arguments);
                } catch (e) {
                    application.log("callback exception\n" + e.stack);
                    $.error();
                }
            };
            $.error = error || empty;
        },
        statLog: function (type) {
            var url = "http://clck.yandex.ru/click" + "/dtype=stred" + "/pid=12" + "/cid=72359" + "/path=fx.mailyahoo." + type + "/*";
            this.Request(url, "GET").send();
        },
        get gBrowser() {
            return WM.getMostRecentWindow("navigator:browser").gBrowser;
        }
    };
};
