(function () {
    function logr(str) {
    }
    function log(str) {
    }
    function makeParamMP(n, v) {
        return "Content-Disposition: form-data; name=\"" + n + "\"\r\n\r\n" + v;
    }
    function makeParam(n, v) {
        return n + "=" + encodeURIComponent(v);
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
    function ajax(obj) {
        var txt = null, xhr = obj.xhr || Twitter.platform.createRequest();
        obj.method = (obj.method || "GET").toUpperCase();
        var bdr = obj.multipart ? "-----8a7gadg1ahSDCV" + new Date().valueOf() : null;
        if (obj.params) {
            if (typeof obj.params == "object") {
                obj.params = makeParamStr(obj.params, bdr ? "--" + bdr : null);
            }
            if (obj.method == "GET") {
                obj.url += "?" + obj.params;
            } else {
                txt = obj.params;
            }
        }
        log("(" + obj.method + "): url = " + obj.url + (txt ? ",  text = " + txt : ""));
        var sync = !obj.callback;
        xhr.open(obj.method, obj.url, !sync);
        if (obj.overrideMimeType) {
            xhr.overrideMimeType(obj.overrideMimeType);
        }
        if (obj.background) {
            try {
                xhr.mozBackgroundRequest = true;
            } catch (exc) {
            }
        }
        var htheaders = obj.headers || {};
        if (!htheaders["Content-Type"]) {
            var contentType = obj.contentType;
            if (!contentType && obj.method == "POST") {
                contentType = bdr ? "multipart/form-data; boundary=" + bdr : "application/x-www-form-urlencoded";
            }
            if (contentType) {
                htheaders["Content-Type"] = contentType;
            }
        }
        for (var htheader in htheaders) {
            if (htheaders.hasOwnProperty(htheader)) {
                xhr.setRequestHeader(htheader, htheaders[htheader]);
            }
        }
        var responseType = obj.responseType;
        function getResponse(xhr) {
            if (responseType == "xml") {
                var xml = xhr.responseXML;
                if (xml) {
                    return xml;
                }
            }
            var data = xhr.responseText;
            if (responseType == "json") {
                data = JSON.parse(data);
            }
            return data;
        }
        var timer = null, aborted = false;
        var scope = obj.scope || obj;
        if (!sync) {
            xhr.onreadystatechange = function () {
                if (xhr && xhr.readyState == 4) {
                    var xhr2 = xhr;
                    xhr = null;
                    if (timer) {
                        timer.cancel();
                        timer = null;
                    }
                    if (aborted) {
                        logr("(ajax): " + aborted);
                        if (obj.errback) {
                            obj.errback.call(scope, 0, aborted);
                        }
                        xhr2 = null;
                        return;
                    }
                    var st = xhr2.status, stt = "";
                    if (st >= 200 && st < 400) {
                        var response = "";
                        try {
                            response = getResponse(xhr2);
                        } catch (exc) {
                            logr("(ajax): parse error!!");
                            if (obj.errback) {
                                obj.errback.call(scope, 0, "parse error");
                            }
                            xhr2 = null;
                            return;
                        }
                        log("(ajax): response = " + response);
                        obj.callback.call(scope, response, xhr2, st);
                    } else {
                        try {
                            stt = xhr2.statusText;
                        } catch (exc1) {
                            stt = "error";
                        }
                        logr("(ajax): error=" + st + "   descr: " + stt);
                        if (obj.errback) {
                            obj.errback.call(scope, st, stt);
                        }
                    }
                    xhr2 = null;
                }
            };
        }
        xhr.send(txt);
        if (sync) {
            try {
                return getResponse(xhr);
            } catch (exc2) {
                logr("(ajax sync): parse error");
                return null;
            }
        } else {
            if (obj.timeout) {
                timer = setTimeout(function () {
                    if (timer && !aborted) {
                        aborted = "timeout";
                        xhr.abort();
                    }
                }, obj.timeout);
            }
            return {
                xhr: xhr,
                abort: function (msg) {
                    if (xhr && !aborted) {
                        aborted = msg || "abort";
                        xhr.abort();
                    }
                }
            };
        }
    }
    Twitter.http = {
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
        }
    };
}());
