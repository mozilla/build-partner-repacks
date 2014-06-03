"use strict";
EXPORTED_SYMBOLS.push("netutils");
const netutils = {
        ioService: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
        cookieService: Cc["@mozilla.org/cookieService;1"].getService().QueryInterface(Ci.nsICookieService),
        cookieManager: Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2),
        newURI: function netutils_newURI(spec, origCharset, baseURI) {
            return this.ioService.newURI(spec, origCharset || null, baseURI || null);
        },
        resolveRelativeURL: function netutils_resolveRelativeURL(spec, baseURI) {
            return this.ioService.newURI(spec, null, baseURI).spec;
        },
        findCookieValue: function netutils_findCookieValue(URLorURI, cookieName, incHttpOnly, checkExpired, strictMatch) {
            var [cookie] = this.findCookies.apply(this, arguments);
            return cookie ? decodeURIComponent(cookie.value) : undefined;
        },
        findCookies: function netutils_findCookies(URLorURI, cookieName, incHttpOnly, checkExpired, strictMatch) {
            function cookieFilter(cookie) {
                if (cookie.name !== cookieName || cookie.isHttpOnly && !incHttpOnly || !netutils.cookieMatchesURI(cookie, cookieURI, strictMatch))
                    return false;
                var timeNow = parseInt(Date.now() / 1000, 10);
                return !checkExpired || (cookie.expires == 0 || timeNow < cookie.expires);
            }
            var cookieURI = URLorURI instanceof Ci.nsIURI ? URLorURI : this.newURI(URLorURI, null, null);
            var result = [cookie for (cookie in this.getCookiesFromHost(cookieURI.host)) if (cookieFilter(cookie))];
            result.sort(this.cmpCookiesByPriority);
            return result;
        },
        getCookiesFromHost: function netutils_getCookiesFromHost(aHost) {
            function cookiesGenerator(aEnum) {
                const nsICookie2 = Ci.nsICookie2;
                while (aEnum.hasMoreElements()) {
                    yield aEnum.getNext().QueryInterface(nsICookie2);
                }
            }
            return cookiesGenerator(this.cookieManager.getCookiesFromHost(aHost));
        },
        cookieMatchesURI: function netutils_cookieMatchesURL(cookie, uri, strictMatch) {
            function domainMatch(hostName, cookie) {
                if (cookie.rawHost == hostName)
                    return true;
                if (strictMatch)
                    return false;
                return cookie.isDomain && strutils.stringEndsWith("." + hostName, cookie.host);
            }
            function pathMatch(path, cookie) {
                var cookiePath = cookie.path;
                if (cookiePath == path)
                    return true;
                if (strictMatch)
                    return false;
                var pathPrefix = path.substr(0, cookiePath.length);
                return pathPrefix == cookiePath && (cookiePath.substr(-1) == "/" || path[cookiePath.length] == "/");
            }
            return domainMatch(uri.host, cookie) && pathMatch(uri.path, cookie);
        },
        cmpCookiesByPriority: function netutils_cmpCookiesByPriority(cookie1, cookie2) {
            var hostDiff = cookie2.rawHost.length - cookie1.rawHost.length;
            if (hostDiff != 0)
                return hostDiff;
            return cookie2.path.length - cookie1.path.length;
        }
    };
netutils.querystring = {
    stringify: function netutils_querystring_stringify(obj, sep, eq) {
        sep = sep || "&";
        eq = eq || "=";
        var parts = [];
        for (let [
                    key,
                    value
                ] in Iterator(obj)) {
            if (Array.isArray(value)) {
                value = value.map(function (val) {
                    val = val || "";
                    return key + eq + val;
                });
                parts.push.apply(parts, value);
            } else {
                value = value || "";
                parts.push(key + eq + value);
            }
        }
        return parts.join(sep);
    },
    parse: function netutils_querystring_parse(str, sep, eq) {
        sep = sep || "&";
        eq = eq || "=";
        var parts = str.split(sep);
        var output = {};
        if (!str.length)
            return output;
        let (i = 0) {
            for (; i < parts.length; i++) {
                let splitted = parts[i].split(eq);
                let key = splitted.shift();
                let value = splitted.filter(function (val) val && val.length > 0).join(eq);
                if (!output[key]) {
                    output[key] = value;
                } else if (Array.isArray(output[key])) {
                    output[key].push(value);
                } else {
                    output[key] = [
                        output[key],
                        value
                    ];
                }
            }
        }
        return output;
    }
};
netutils.DownloadTask = function DownloadTask(urlString, output, channelProperties, bypassCache, httpHeaders) {
    try {
        this._originalURI = netutils.ioService.newURI(urlString, null, null);
    } catch (e) {
        throw this._error = new Error(e.message + " " + urlString);
    }
    if (output !== undefined) {
        if (output instanceof Ci.nsIFile)
            this._outputFile = output;
        else if (output instanceof Ci.nsIOutputStream)
            this._outputStream = output;
        else
            throw this._error = new CustomErrors.EArgType("output", "nsIFile | nsIOutputStream", output);
    }
    if (httpHeaders !== undefined && !sysutils.isObject(httpHeaders))
        throw this._error = new CustomErrors.EArgType("httpHeaders", "Object", httpHeaders);
    this._channelProps = channelProperties;
    this._bypassCache = !!bypassCache;
    this._httpHeaders = httpHeaders;
};
netutils.DownloadTask.prototype = {
    __proto__: patterns.AsyncTask.prototype,
    constructor: netutils.DownloadTask,
    start: function DownloadTask_start(owner) {
        try {
            patterns.AsyncTask.prototype.start.apply(this, arguments);
            this._startAsyncDownload();
        } catch (e) {
            this._error = e;
            throw e;
        }
    },
    abort: function DownloadTask_abort(reason) {
        this._request.cancel(Components.results.NS_BINDING_ABORTED);
        patterns.AsyncTask.prototype.abort.apply(this, arguments);
    },
    get originalURI() {
        return this._originalURI;
    },
    get finalURI() {
        return this._channel.URI;
    },
    get percentDone() {
        if (!this._total)
            return NaN;
        return this._progress == this._total ? 100 : Math.floor(100 * (this._progress / this._total));
    },
    get statusCode() {
        return this._statusCode;
    },
    get outputFile() {
        return this._outputFile;
    },
    getContentInputStream: function DownloadTask_getContentInputStream() {
        return this._outputFile ? fileutils.openFile(this._outputFile) : this._openBuffer();
    },
    get httpStatus() {
        var httpChannel = this._channel.QueryInterface(Ci.nsIHttpChannel);
        return httpChannel.responseStatus;
    },
    findHttpResponseHeader: function DonwloadTask_findHttpResponseHeader(headerName) {
        var httpChannel = this._channel.QueryInterface(Ci.nsIHttpChannel);
        try {
            return httpChannel.getResponseHeader(headerName);
        } catch (e) {
        }
        return undefined;
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIStreamListener,
        Ci.nsIRequestObserver,
        Ci.nsIChannelEventSink,
        Ci.nsIProgressEventSink,
        Ci.nsIHttpEventSink
    ]),
    onDataAvailable: function DownloadTask_onDataAvailable(request, context, inputStream, offset, count) {
        this._binInputStream.setInputStream(inputStream);
        var receivedData = this._binInputStream.readBytes(count);
        if (this._outputStream)
            this._outputStream.write(receivedData, count);
        else
            this._contentBuffer += receivedData;
        this._step(count);
    },
    onStartRequest: function DownloadTask_onStartRequest(request, context) {
        if (request.status != Cr.NS_OK) {
            this._statusCode = request.status;
            return;
        }
        this._setNewChannel(request.QueryInterface(Ci.nsIChannel));
        this._request = request;
        this._binInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        if (!this._outputStream)
            this._contentBuffer = "";
    },
    onStopRequest: function DownloadTask_onStopRequest(request, context, statusCode) {
        try {
            if (statusCode === Cr.NS_OK)
                this._total = this._progress;
            this._statusCode = statusCode;
            if (this._total && this._binInputStream)
                this._binInputStream.close();
            if (this._outputStream)
                this._outputStream.close();
        } catch (e) {
            this._error = e;
        } finally {
            this._finish();
        }
    },
    onChannelRedirect: function DownloadTask_onChannelRedirect(oldChannel, newChannel, flags) {
        this._setNewChannel(newChannel);
    },
    asyncOnChannelRedirect: function DownloadTask_asyncOnChannelRedirect(oldChan, newChan, flags, redirectCallback) {
    },
    onProgress: function DownloadTask_onProgress(aRequest, aContext, aProgress, aProgressMax) {
    },
    onStatus: function DownloadTask_onStatus(aRequest, aContext, aStatus, aStatusArg) {
    },
    onRedirect: function DownloadTask_onRedirect(aOldChannel, aNewChannel) {
    },
    _binInputStream: null,
    _outputStream: null,
    _outputFile: null,
    _contentBuffer: undefined,
    _bypassCache: false,
    _httpHeaders: null,
    _channel: null,
    _request: null,
    _total: 0,
    _statusCode: undefined,
    _openBuffer: function DownloadTask__openBuffer() {
        if (this._contentBuffer === undefined)
            throw new Error("No internal buffer");
        return fileutils.openBuffer(this._contentBuffer);
    },
    _startAsyncDownload: function DownloadTask__startAsyncDownload() {
        if (!this._outputStream && this._outputFile) {
            this._outputStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            let modeFlags = fileutils.MODE_WRONLY | fileutils.MODE_CREATE | fileutils.MODE_TRUNCATE;
            this._outputStream.init(this._outputFile, modeFlags, fileutils.PERMS_FILE, 0);
        }
        this._channel = netutils.ioService.newChannelFromURI(this._originalURI);
        if (this._channelProps)
            this._writeProps(this._channelProps, this._channel);
        if (this._bypassCache)
            this._channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
        if (this._httpHeaders)
            this._addHttpHeaders(this._httpHeaders, this._channel);
        this._channel.asyncOpen(this, null);
    },
    _setNewChannel: function DownloadTask__setNewChannel(newChannel) {
        this._channel = newChannel;
        this._total = newChannel.contentLength;
    },
    _writeProps: function DownloadTask__writeProps(propsMap, toChannel) {
        var propBag = toChannel.QueryInterface(Ci.nsIWritablePropertyBag2);
        for (let [
                    propName,
                    propValue
                ] in Iterator(propsMap)) {
            if (typeof propValue == "boolean")
                propBag.setPropertyAsBool(propName, propValue);
            else if (sysutils.isNumber(propValue))
                propBag.setPropertyAsInt64(propName, propValue);
            else if (typeof propValue == "string")
                propBag.setPropertyAsAUTF8String(propName, propValue);
            else
                throw new TypeError("Can't add property of type " + typeof propValue);
        }
    },
    _addHttpHeaders: function DownloadTask__addHttpHeaders(headersMap, toChannel) {
        var httpChannel = toChannel.QueryInterface(Ci.nsIHttpChannel);
        for (let [
                    headerName,
                    headerValue
                ] in Iterator(headersMap))
            httpChannel.setRequestHeader(headerName, headerValue, true);
    }
};
netutils.Cookie = function Cookie(cookieName, cookieURI, httpCookies, exactURIMatch, expired) {
    if (!(cookieURI instanceof Ci.nsIURI))
        throw new TypeError("Second argument must be nsIURI");
    this._cookieName = "" + cookieName;
    this._uri = cookieURI.clone();
    this._httpCookies = !!httpCookies;
    this._exactURIMatch = !!exactURIMatch;
    patterns.NotificationSource.apply(this);
};
netutils.Cookie.prototype = {
    __proto__: patterns.NotificationSource.prototype,
    get name() {
        return this._cookieName;
    },
    set name(newName) {
        if (this._cookieName == newName)
            return;
        this._cookieName = "" + newName;
        this._update();
    },
    get uri() {
        return this._uri.clone();
    },
    set uri(newURI) {
        if (!(newURI instanceof Ci.nsIURI))
            throw new TypeError("New value must be nsIURI");
        if (this._uri.equals(newURI))
            return;
        this._uri = newURI;
        this._update();
    },
    get includeHttpOnly() {
        return this._httpCookies;
    },
    set includeHttpOnly(newValue) {
        if (this._httpCookies == newValue)
            return;
        this._httpCookies = !!newValue;
        this._update();
    },
    get exactURIMatch() {
        return this._exactURIMatch;
    },
    set exactURIMatch(newValue) {
        if (this._exactURIMatch == newValue)
            return;
        this._exactURIMatch = !!newValue;
        this._update();
    },
    get value() {
        if (!this._cookie || !this._observing)
            this._cookie = this._findBestCookie();
        return this._lastValue = this._getCurrentCookieValue();
    },
    EVENTS: { COOKIE_VALUE_CHANGED: "cookie-value-changed" },
    constructor: netutils.Cookie,
    toString: function Cookie_toString() {
        return strutils.formatString("[%1 \"%2\" @ %3 (%4, %5)]", [
            this.constructor.name,
            this._cookieName,
            this._uri.spec,
            this._httpCookies ? "http" : "all",
            this._exactURIMatch ? "exactly" : "best"
        ]);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    observe: function Cookie_observe(subject, topic, data) {
        if (!this._hasListeners || topic != "cookie-changed")
            return;
        const nsICookie2 = Ci.nsICookie2;
        switch (data) {
        case "cleared":
            this._cookie = null;
            break;
        case "batch-deleted":
        case "reload":
            this._cookie = this._findBestCookie();
            break;
        case "deleted": {
                if (!this._cookie)
                    return;
                let deletedCookie = subject.QueryInterface(nsICookie2);
                if (deletedCookie.host == this._cookie.host && deletedCookie.path == this._cookie.path)
                    this._cookie = this._findBestCookie();
                break;
            }
        case "added": {
                let addedCookie = subject.QueryInterface(nsICookie2);
                if (!this._cookieMatches(addedCookie))
                    return;
                if (!this._cookie || netutils.cmpCookiesByPriority(this._cookie, addedCookie) > 0)
                    this._cookie = addedCookie;
                break;
            }
        case "changed": {
                let changedCookie = subject.QueryInterface(nsICookie2);
                if (!this._cookie) {
                    if (this._cookieMatches(changedCookie))
                        this._cookie = changedCookie;
                } else {
                    if (changedCookie.name == this._cookie.name && changedCookie.host == this._cookie.host && changedCookie.path == this._cookie.path) {
                        this._cookie = this._httpCookies || !changedCookie.isHttpOnly ? changedCookie : this._findBestCookie();
                    } else if (this._cookieMatches(changedCookie) && netutils.cmpCookiesByPriority(this._cookie, changedCookie) > 0) {
                        this._cookie = changedCookie;
                    }
                }
                break;
            }
        default:
            return;
        }
        var newValue = this._getCurrentCookieValue();
        if (this._lastValue != newValue) {
            this._notifyListeners(this.EVENTS.COOKIE_VALUE_CHANGED, this._lastValue = newValue);
        }
    },
    _observerService: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
    _observing: false,
    _uri: null,
    _cookieName: undefined,
    _httpCookies: undefined,
    _cookie: null,
    _lastValue: undefined,
    _listenerAdded: function Cookie__listenerAdded(topic, listener) {
        if (!this._observing) {
            this._observerService.addObserver(this, "cookie-changed", false);
            this._observing = true;
            if (this._cookie)
                this._cookie = this._findBestCookie();
        }
    },
    _listenerRemoved: function Cookie__listenerRemoved(topic, listener) {
        if (!this._hasListeners && this._observing) {
            this._observerService.removeObserver(this, "cookie-changed");
            this._observing = false;
        }
    },
    _update: function Cookie__update() {
        if (!this._hasListeners)
            return;
        this._cookie = this._findBestCookie();
        var currValue = this._getCurrentCookieValue();
        if (this._lastValue != currValue) {
            this._notifyListeners(this.EVENTS.COOKIE_VALUE_CHANGED, this._lastValue = currValue);
        }
    },
    _findBestCookie: function Cookie__findBestCookie() {
        var [bestCookie] = netutils.findCookies(this._uri, this._cookieName, this._httpCookies, true, this._exactURIMatch);
        return bestCookie || null;
    },
    _getCurrentCookieValue: function Cookie__getCurrentCookieValue() {
        return this._cookie ? decodeURIComponent(this._cookie.value) : undefined;
    },
    _cookieMatches: function Cookie__cookieMatches(cookie) {
        return (this._httpCookies || !cookie.isHttpOnly) && cookie.name == this._cookieName && netutils.cookieMatchesURI(cookie, this._uri, this._exactURIMatch);
    }
};
