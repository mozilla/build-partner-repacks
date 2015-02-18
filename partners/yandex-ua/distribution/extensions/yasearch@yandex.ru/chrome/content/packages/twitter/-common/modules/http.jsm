EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HTTPRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"];
    function logr(str) {
        common.logr("[-common.http]: " + str);
    }
    function log(str) {
        common.log("[-common.http]: " + str);
    }
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    var emptyFunc = function () {
    };
    function AuthPromptOverride() {
    }
    AuthPromptOverride.prototype = {
        getAuthPrompt: function AuthPromptOverride_getAuthPrompt(reason, iid) {
            return {
                promptAuth: function AuthPromptOverride_AP_promptAuth() {
                    return false;
                }
            };
        },
        getInterface: function AuthPromptOverride_getInterface(iid) {
            return this.QueryInterface(iid);
        },
        QueryInterface: function AuthPromptOverride_QueryInterface(iid) {
            if (iid.equals(Ci.nsIAuthPromptProvider) || iid.equals(Ci.nsIInterfaceRequestor)) {
                return this;
            }
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    };
    function makeParamMP(n, v) {
        return "Content-Disposition: form-data; name=\"" + n + "\"\r\n\r\n" + v;
    }
    function makeParam(n, v) {
        return n + "=" + common.utils.encodeURIComponent(v);
    }
    function makeParamStr(params, mp) {
        if (!params) {
            return "";
        }
        if (typeof params == "string") {
            return params;
        }
        var a1 = [], fnp = mp ? makeParamMP : makeParam;
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                var ps = params[i];
                if (ps && ps.join && ps.sort && ps.push && ps.length) {
                    for (var j = 0; j < ps.length; ++j) {
                        a1.push(fnp(i, ps[j]));
                    }
                } else {
                    a1.push(fnp(i, ps));
                }
            }
        }
        return !mp ? a1.join("&") : mp + "\r\n" + a1.join("\r\n" + mp + "\r\n") + "\r\n" + mp + "--\r\n";
    }
    function openRequest(obj) {
        var sync = obj.sync;
        var txt = null, xhr = obj.xhr || HTTPRequest.createInstance(Components.interfaces.nsIXMLHttpRequest);
        obj.method = (obj.method || "GET").toUpperCase();
        var bdr = obj.multipart ? "-----8a7gadg1ahSDCV" + new Date().valueOf() : null;
        var url = obj.url;
        var params = obj.params;
        if (params) {
            if (typeof params == "object") {
                params = makeParamStr(params, bdr ? "--" + bdr : null);
            }
            if (obj.method == "GET" && params) {
                url += (url.indexOf("?") < 0 ? "?" : "&") + params;
            } else {
                txt = params;
            }
        }
        log("(" + obj.method + "): url = " + url + (txt ? ",  text = " + txt : ""));
        xhr.open(obj.method, url, !sync);
        if (obj.overrideMimeType) {
            xhr.overrideMimeType(obj.overrideMimeType);
        }
        if (obj.background) {
            try {
                xhr.mozBackgroundRequest = true;
            } catch (exc) {
            }
        }
        var httpHeaders = common.utils.copy(obj.headers);
        if (!httpHeaders["Content-Type"]) {
            var contentType = obj.contentType;
            if (!contentType && obj.method == "POST") {
                contentType = bdr ? "multipart/form-data; boundary=" + bdr : "application/x-www-form-urlencoded";
            }
            if (contentType) {
                httpHeaders["Content-Type"] = contentType;
            }
        }
        if (obj.preventAuth !== false) {
            xhr.channel.notificationCallbacks = new AuthPromptOverride();
        }
        for (var httpHeader in httpHeaders) {
            if (httpHeaders.hasOwnProperty(httpHeader)) {
                xhr.setRequestHeader(httpHeader, httpHeaders[httpHeader]);
            }
        }
        if (obj.anonymous) {
            xhr.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_ANONYMOUS;
        }
        return {
            xhr: xhr,
            sync: sync,
            text: txt
        };
    }
    function ajax(obj, retryInfo) {
        retryInfo = retryInfo || {};
        var xhrData = openRequest(obj);
        var onend = obj.end || emptyFunc;
        var callback = obj.callback || emptyFunc;
        var errback = obj.errback || emptyFunc;
        var scope = obj.scope || obj;
        var responseType = obj.responseType;
        var getTimeDiff = obj.getTimeDiff;
        function getResponse(req) {
            if (responseType == "xml") {
                var xml = req.responseXML;
                if (xml) {
                    return xml;
                }
            }
            var data = req.responseText;
            if (responseType == "json") {
                data = JSON.parse(data);
            }
            if (responseType == "xml") {
                data = common.utils.str2xml(data);
            }
            return data;
        }
        var startRequestTime = Date.now();
        if (!xhrData.sync) {
            xhrData.xhr.onreadystatechange = function () {
                if (retryInfo.xhr && retryInfo.xhr.readyState == 4) {
                    var endRequestTime = Date.now();
                    var xhr2 = retryInfo.xhr;
                    retryInfo.xhr = null;
                    onend.call(scope, xhr2);
                    if (retryInfo.timer) {
                        retryInfo.timer.cancel();
                        retryInfo.timer = null;
                    }
                    var errbackret = null;
                    obj.attempt = (obj.attempt || 0) + 1;
                    if (retryInfo.aborted) {
                        logr("(ajax): " + retryInfo.aborted);
                        errbackret = errback.call(scope, 0, retryInfo.aborted, xhr2, obj);
                        if (retryInfo.aborted != "timeout") {
                            errbackret = null;
                        }
                    } else {
                        var st = xhr2.status, stt = "error";
                        if (st >= 200 && st < 400) {
                            var response = "", parsed = false;
                            try {
                                response = getResponse(xhr2);
                                parsed = true;
                            } catch (exc) {
                                logr("(ajax): parse error!!");
                                errbackret = errback.call(scope, 0, "parse error", xhr2, obj);
                            }
                            if (parsed) {
                                var timeDiff = null;
                                if (getTimeDiff) {
                                    var serverTime = new Date(xhr2.getResponseHeader("Date")).valueOf();
                                    timeDiff = serverTime ? Math.round((startRequestTime + endRequestTime) / 2) - serverTime : null;
                                }
                                callback.call(scope, response, xhr2, st, timeDiff);
                            }
                        } else {
                            try {
                                stt = xhr2.statusText;
                            } catch (exc1) {
                            }
                            logr("(ajax): error=" + st + "   descr: " + stt);
                            errbackret = errback.call(scope, st, stt, xhr2, obj);
                        }
                    }
                    xhr2 = null;
                    if (errbackret == "retry") {
                        retryInfo.aborted = null;
                        ajax(obj, retryInfo);
                    }
                }
            };
        }
        xhrData.xhr.send(xhrData.text);
        if (xhrData.sync) {
            try {
                return getResponse(xhrData.xhr);
            } catch (exc2) {
                logr("(ajax sync): parse error");
                return null;
            }
        } else {
            retryInfo.xhr = xhrData.xhr;
            if (obj.timeout) {
                retryInfo.timer = common.timers.setTimeout(function () {
                    if (retryInfo.xhr && retryInfo.timer && !retryInfo.aborted) {
                        retryInfo.aborted = "timeout";
                        retryInfo.xhr.abort();
                    }
                }, obj.timeout);
            }
            return {
                abort: function (msg) {
                    if (retryInfo.xhr && !retryInfo.aborted) {
                        retryInfo.aborted = msg || "abort";
                        retryInfo.xhr.abort();
                    }
                }
            };
        }
    }
    var cmps = {
        empty: function () {
            return true;
        },
        value: function (val, myVal) {
            return val == myVal;
        },
        regex: function (val, myRx) {
            return myRx.test(val);
        }
    };
    function getCmp(val) {
        if (val === null || val === void 0) {
            return cmps.empty;
        }
        if (common.utils.isRegExp(val)) {
            return cmps.regex;
        }
        return typeof val == "function" ? val : cmps.value;
    }
    var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager2);
    var Http = {
        makeParamStr: makeParamStr,
        POST: function (o) {
            o.method = "POST";
            return ajax(o);
        },
        GET: function (o) {
            o.method = "GET";
            return ajax(o);
        },
        HEAD: function (o) {
            o.method = "HEAD";
            return ajax(o);
        },
        getCookie: function (host, name, val, path) {
            var e = typeof host == "string" ? cookieMgr.getCookiesFromHost(host) : cookieMgr.enumerator;
            var cmpHost = getCmp(host), cmpName = getCmp(name), cmpVal = getCmp(val), cmpPath = getCmp(path);
            while (e.hasMoreElements()) {
                var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie);
                var cval = String(cookie.value || "");
                if (cmpHost(String(cookie.host), host) && cmpName(String(cookie.name), name) && cmpVal(cval, val) && cmpPath(String(cookie.path), path)) {
                    return cval;
                }
            }
            return "";
        },
        setCookie: function (obj) {
            common.logObj(obj, "setCookie: ");
            var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager2);
            cookieMgr.add(obj.host, obj.path || "/", obj.name || "", obj.value || "", !!obj.secure, !!obj.http, obj.expire === null || obj.expire === void 0, obj.expire);
        },
        deleteCookie: function (host, name, path) {
            var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager2);
            cookieMgr.add(host, "/", name, "0", false, true, false, -1000);
        },
        isGoodStatus: function (status) {
            return status >= 200 && status < 400;
        }
    };
    return Http;
};
