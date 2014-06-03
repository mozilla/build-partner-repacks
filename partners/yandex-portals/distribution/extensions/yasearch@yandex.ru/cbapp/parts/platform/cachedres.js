"use strict";
BarPlatform.CachedResources = {
    __proto__: new patterns.NotificationSource(),
    init: function Cached_init() {
        this._resources = {};
        this._downloaders = {};
        this._logger = BarPlatform._getLogger("NetResources");
        this._logger.level = Log4Moz.Level.Config;
        var cacheFile = barApp.directories.appRootDir;
        cacheFile.append("netcache.sqlite");
        this._cache = new Database.DatedValues(cacheFile);
    },
    finalize: function Cached_finalize(doCleanup, callback) {
        this.removeAllListeners();
        misc.mapValsToArray(this._resources).forEach(function (resource) {
            try {
                resource._finalize();
            } catch (e) {
                this._logger.error("Error finalizing resource. " + strutils.formatError(e));
            }
        }, this);
        misc.mapValsToArray(this._downloaders).forEach(function (downloader) {
            try {
                downloader._finalize();
            } catch (e) {
                this._logger.error("Error finalizing downloader. " + strutils.formatError(e));
            }
        }, this);
        this._resources = null;
        this._downloaders = null;
        if (this._cache) {
            let storageFile = this._cache.storageFile;
            this._cache.close(function () {
                if (doCleanup) {
                    fileutils.removeFileSafe(storageFile);
                }
                callback();
            });
            return true;
        }
        callback();
        return false;
    },
    getResource: function Cached_getResource(resDescr) {
        if (!(resDescr instanceof ResDescriptor))
            throw new CustomErrors.EArgType("resDescr", "ResDescriptor", resDescr);
        var resHash = resDescr.hash;
        this._logger.debug("Looking for resource with hash \"" + resHash + "\"");
        var resource = this._resources[resHash];
        if (!resource) {
            this._logger.debug("Creating new resource");
            try {
                resource = new CachedResource(resDescr);
            } catch (e) {
                this._logger.error("Could not create CachedResource. " + strutils.formatError(e));
                throw e;
            }
            this._resources[resHash] = resource;
        }
        return resource;
    },
    requestFinished: function Cached_requestFinished(requestID) {
        requestID = parseInt(requestID, 10);
        return !!requestID && requestID < this._requestID && !(requestID in this._activeRequests);
    },
    _activeRequests: {},
    _resources: null,
    _downloaders: null,
    _logger: null,
    _requestID: 1,
    _getDownloader: function Cached__getDownloader(resDescr) {
        if (!(resDescr instanceof BarPlatform.CachedResources.ResDescriptor))
            throw new CustomErrors.EArgType("resDescr", "ResDescriptor", resDescr);
        var dlHash = this._dlHash(resDescr);
        var downloader = this._downloaders[dlHash];
        if (!downloader) {
            downloader = new ResourceDownloader(resDescr);
            this._downloaders[dlHash] = downloader;
        }
        return downloader;
    },
    _getNewRequestID: function Cached__getNewRequestID() {
        var requestID = this._requestID++;
        this._activeRequests[requestID] = 1;
        return requestID;
    },
    _dlHash: function Cached__dlHash(resDescr) {
        return [
            resDescr.url,
            resDescr.method,
            resDescr.isPrivate
        ].join("#");
    },
    _onDownloadFinished: function Cached__onDownloadFinished(requestID) {
        delete this._activeRequests[requestID];
        this._notifyListeners(requestID);
    }
};
const ResDescriptor = BarPlatform.CachedResources.ResDescriptor = function ResDescriptor({
        url: url,
        method: method,
        updateInterval: updateInterval,
        expireInterval: expireInterval,
        validStatusRange: validStatusRange,
        validXpath: validXpath,
        cacheKeys: cacheKeys,
        isPrivate: isPrivate
    }) {
        this._uri = netutils.newURI(url);
        this._url = url;
        if (method !== undefined) {
            sysutils.ensureValueTypeIs(method, "string");
            this._method = method;
        } else {
            this._method = "GET";
        }
        sysutils.ensureValueTypeIs(updateInterval, "number");
        if (updateInterval < 0)
            throw new RangeError("Invalid update interval: " + updateInterval);
        this._updateInterval = updateInterval || Number.POSITIVE_INFINITY;
        if (expireInterval !== undefined) {
            sysutils.ensureValueTypeIs(expireInterval, "number");
            if (expireInterval < 0)
                throw new RangeError("Invalid expiration time: " + expireInterval);
            this._expirationInterval = expireInterval;
        } else {
            this._expirationInterval = 0;
        }
        if (validStatusRange) {
            if (sysutils.isNumber(validStatusRange.start) && sysutils.isNumber(validStatusRange.end) && validStatusRange.start >= 100 && validStatusRange.end <= 599 && validStatusRange.start <= validStatusRange.end) {
                this._statusMin = validStatusRange.start;
                this._statusMax = validStatusRange.end;
            } else
                throw new TypeError("Invalid status range parameter: " + sysutils.dump(validStatusRange));
        } else {
            this._statusMin = 100;
            this._statusMax = 399;
        }
        if (validXpath) {
            sysutils.ensureValueTypeIs(validXpath, "string");
            this._checkXpathExpr = validXpath;
        }
        if (cacheKeys) {
            this._cacheKeys = sysutils.copyObj(cacheKeys);
        }
        if (isPrivate !== undefined) {
            sysutils.ensureValueTypeIs(isPrivate, "boolean");
            this._isPrivate = isPrivate;
        } else {
            this._isPrivate = true;
        }
    };
ResDescriptor.prototype = {
    constructor: BarPlatform.CachedResources.ResDescriptor,
    get uri() this._uri,
    get url() this._url,
    get method() this._method,
    get isPrivate() this._isPrivate,
    get updateInterval() this._updateInterval,
    get expirationInterval() this._expirationInterval,
    get xpathExpression() this._checkXpathExpr,
    get statusRange() {
        return {
            start: this._statusMin,
            end: this._statusMax
        };
    },
    get cacheKeysStr() {
        if (this._spHash)
            return this._spHash;
        var resultParts = [];
        for (let key in this._cacheKeys) {
            resultParts.push(key + ":" + this._cacheKeys[key]);
        }
        return this._spHash = resultParts.join("#");
    },
    get hash() {
        return this._hash || (this._hash = [
            this._url,
            this._method,
            this._updateInterval,
            this._expirationInterval,
            this._statusMin,
            this._statusMax,
            this._checkXpathExpr,
            this._isPrivate,
            this.cacheKeysStr
        ].join("#"));
    },
    equalsTo: function ReqData_equalsTo(other) {
        if (!sysutils.valueTypeIs(other, this.constructor))
            return false;
        return this._fields.every(function (field) {
            return this[field] == other[field];
        }, this);
    },
    _spHash: undefined,
    _hash: undefined,
    _uri: null,
    _url: undefined,
    _method: "GET",
    _updateInterval: 0,
    _expirationInterval: 0,
    _statusMin: 0,
    _statusMax: 0,
    _checkXpathExpr: undefined,
    _cacheKeys: undefined,
    _isPrivate: false,
    _fields: [
        "_url",
        "_method",
        "_updateInterval",
        "_expirationInterval",
        "_statusMin",
        "_statusMax",
        "_checkXpathExpr",
        "cacheKeysStr",
        "_isPrivate"
    ]
};
function CachedResource(resDescr) {
    sysutils.ensureValueTypeIs(resDescr, ResDescriptor);
    patterns.NotificationSource.apply(this);
    var resFileName = decodeURIComponent(resDescr.uri.path.split("/").slice(-1)) || "[NOFILE]";
    this._logger = BarPlatform._getLogger("NetRes." + resFileName + "." + ++CachedResource._instCounter);
    this._resDescr = resDescr;
    this._storageKey = this._makeStorageKey(resDescr);
    this._dataExpTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._responseData = {};
    this._reqFlags = {};
    this._queryCache();
    if (this._downloader.responseData.status != -1) {
        this._updateFromDownloader();
    }
}
;
CachedResource._instCounter = 0;
CachedResource.prototype = {
    __proto__: patterns.NotificationSource.prototype,
    constructor: CachedResource,
    get descriptor() this._resDescr,
    get dataIsReady() !this._noData,
    get contentAsText() {
        return this._responseData.bodyText || undefined;
    },
    get contentAsXML() {
        return this.contentAsText && fileutils.xmlDocFromStream(strutils.utf8Converter.convertToInputStream(this.contentAsText), null, null, null, "utf-8") || undefined;
    },
    get contentAsJSON() {
        return this.contentAsText && JSON.parse(this.contentAsText) || undefined;
    },
    get headers() this._responseData.headers || undefined,
    get statusCode() this._responseData.status || undefined,
    update: function CachedResource_update(bypassBrowserCache, invalidateCache) {
        var requestId = this._downloader.update(bypassBrowserCache);
        if (invalidateCache)
            this._reqFlags[requestId] = this._REQ_FLAG_INVALIDATE_CACHE;
        return requestId;
    },
    _finalize: function CachedResource_finalize() {
        if (!this._resDescr)
            return;
        this._logger.debug("Finalizing");
        delete BarPlatform.CachedResources._resources[this.descriptor.hash];
        this._tryCancelCacheQuery();
        if (this._dataExpTimer) {
            this._dataExpTimer.cancel();
            this._dataExpTimer = null;
        }
        if (this._extraUpdTimer) {
            this._extraUpdTimer.cancel();
            this._extraUpdTimer = null;
        }
        this._downloader.removeListener("finished", this);
        this._responseData = null;
        this._resDescr = null;
        this._logger = null;
        this.removeAllListeners();
    },
    observe: function CachedResource_observe(subject, topic, data) {
        if (subject == null)
            this._logger.debug("CachedResource.observe(): HTTP-status: " + this.statusCode);
        if (subject != this._downloader || topic != "finished") {
            return;
        }
        var requestId = data;
        try {
            if (this._updateFromDownloader()) {
                try {
                    this._resetExpiryTimer();
                    if (this._resDescr.expirationInterval == 0)
                        return;
                    this._logger.debug("Storing to cache: " + this._storageKey);
                    BarPlatform.CachedResources._cache.store(this._storageKey, this._responseData);
                } finally {
                    this._onChanged("updated");
                }
            } else if ((this._reqFlags[requestId] || 0) & this._REQ_FLAG_INVALIDATE_CACHE) {
                try {
                    BarPlatform.CachedResources._cache.eraseRecord(this._storageKey);
                } finally {
                    this._responseData = {};
                    this._currDataTime = undefined;
                    this._onChanged("invalidated");
                }
            }
        } catch (e) {
            this._logger.error("CachedResource.onDownloaderFinished failed. " + strutils.formatError(e));
            this._logger.debug(e.stack);
        } finally {
            delete this._reqFlags[requestId];
        }
    },
    notify: function CachedResource_notify(timer) {
        if (timer === this._extraUpdTimer) {
            this.update();
        } else {
            this._dataExpTimer.cancel();
            this._responseData = {};
            this._currDataTime = undefined;
            this._onChanged("expired");
        }
    },
    _consts: {
        ERR_LOAD_CACHE: "Couldn't load cached response",
        ERR_UNKNOWN_DATA_TYPE: "Unknown data type requested",
        ERR_NOTIFYING: "Could not notify resource subscriber",
        MSG_REQUESTING: "No valid data in the cache. Initiating network request..."
    },
    _logger: null,
    _dataExpTimer: null,
    _extraUpdTimer: null,
    _resDescr: null,
    _storageKey: undefined,
    _responseData: null,
    _subscribed: false,
    _currDataTime: undefined,
    _reqFlags: undefined,
    _pendingCacheQuery: null,
    _REQ_FLAG_INVALIDATE_CACHE: 1,
    get _downloader() BarPlatform.CachedResources._getDownloader(this._resDescr),
    _queryCache: function CachedResource__queryCache() {
        this._pendingCacheQuery = BarPlatform.CachedResources._cache.startSearch(this._storageKey, this._resDescr.expirationInterval, this._onCacheResults.bind(this));
        this._logger.debug(strutils.formatString("Started search '%1' not older than %2s", [
            this._storageKey,
            this._resDescr.expirationInterval
        ]));
    },
    _onCacheResults: function CachedResource__onCacheResults(cachedDataStr, cacheTimestamp, storageError) {
        if (!this._resDescr)
            return;
        var cacheIsValid = false;
        try {
            if (storageError)
                this._logger.error(this._consts.ERR_LOAD_CACHE + ". " + storageError.message);
            if (!cachedDataStr)
                return;
            let responseData = JSON.parse(cachedDataStr);
            if (this._validate(responseData.status, responseData.bodyText)) {
                cacheIsValid = true;
                this._responseData = responseData;
                this._currDataTime = cacheTimestamp;
                this._onChanged("loaded");
            }
        } catch (e) {
            this._logger.error(this._consts.ERR_LOAD_CACHE + ". " + strutils.formatError(e));
        } finally {
            this._pendingCacheQuery = null;
            this._afterCacheChecked(cacheIsValid);
        }
    },
    _tryCancelCacheQuery: function CachedResource__tryCancelCacheQuery() {
        if (this._pendingCacheQuery) {
            try {
                this._pendingCacheQuery.cancel();
                this._pendingCacheQuery = null;
            } catch (e) {
                this._logger.error("Could not cancel pending query. " + e);
            }
        }
    },
    _afterCacheChecked: function CachedResource__afterCacheChecked(cacheIsValid) {
        this._logger.debug(strutils.formatString("Async search finished. '%1' %2found", [
            this._storageKey,
            cacheIsValid ? "" : "NOT "
        ]));
        if (!cacheIsValid && this._hasListeners) {
            this._logger.debug(this._consts.MSG_REQUESTING);
            let requestId = this._downloader.update();
            this._reqFlags[requestId] = this._REQ_FLAG_INVALIDATE_CACHE;
            return;
        }
        if (this._currDataTime !== undefined) {
            let dataExpirationInterval = this._resDescr.expirationInterval * 1000 - Math.abs(this._currDataTime * 1000 - Date.now());
            dataExpirationInterval = Math.max(dataExpirationInterval, 0);
            this._dataExpTimer.initWithCallback(this, dataExpirationInterval, this._dataExpTimer.TYPE_ONE_SHOT);
            let extraUpdateInterval = this._resDescr.updateInterval * 1000 - Math.abs(this._currDataTime * 1000 - Date.now());
            extraUpdateInterval = Math.max(extraUpdateInterval, 0);
            this._logger.debug("Set extra request timer to " + extraUpdateInterval / 1000 + "s");
            this._extraUpdTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            this._extraUpdTimer.initWithCallback(this, extraUpdateInterval, this._extraUpdTimer.TYPE_ONE_SHOT);
        }
    },
    _listenerAdded: function CachedResource__listenerAdded(topic, listener) {
        if (this._subscribed)
            return;
        this._downloader.addListener("finished", this);
        this._subscribed = true;
        if (!this._pendingCacheQuery && this._noData) {
            this._logger.debug(this._consts.MSG_REQUESTING);
            this._downloader.update();
        }
    },
    _listenerRemoved: function CachedResource__listenerRemoved(topic, listener) {
        if (!this._hasListeners)
            this._finalize();
    },
    _updateFromDownloader: function CachedResource__updateFromDownloader() {
        var responseData = this._downloader.responseData;
        if (!this._validate(responseData.status, responseData.bodyText))
            return false;
        this._tryCancelCacheQuery();
        this._responseData = {
            status: responseData.status,
            headers: responseData.headers,
            bodyText: responseData.bodyText
        };
        this._currDataTime = parseInt(Date.now() / 1000, 10);
        return true;
    },
    _onChanged: function CachedResource__onChanged(changeTopic) {
        this._notifyListeners(changeTopic);
        this._notifyListeners("changed");
    },
    _validate: function CachedResource__validate(status, bodyText) {
        var minStatus = this._resDescr.statusRange.start;
        var maxStatus = this._resDescr.statusRange.end;
        var statusIsValid = minStatus <= status && status <= maxStatus;
        var structIsValid = true;
        if (this._resDescr.xpathExpression) {
            try {
                let contentDoc = fileutils.xmlDocFromStream(strutils.utf8Converter.convertToInputStream(bodyText));
                let queryResult = xmlutils.queryXMLDoc(this._resDescr.xpathExpression, contentDoc);
                if (Array.isArray(queryResult) && !queryResult.length || !queryResult)
                    throw new Error("Empty validation query result");
            } catch (e) {
                this._logger.debug("Content validation failed. " + strutils.formatError(e));
                structIsValid = false;
            }
        }
        this._logger.trace(strutils.formatString("Status is %1 (valid is %2..%3); structure is %4", [
            status,
            minStatus,
            maxStatus,
            structIsValid ? "OK" : "BAD"
        ]));
        return statusIsValid && structIsValid;
    },
    _resetExpiryTimer: function CachedResource__resetExpiryTimer() {
        this._dataExpTimer.cancel();
        if (this._resDescr.expirationInterval)
            this._dataExpTimer.initWithCallback(this, this._resDescr.expirationInterval * 1000, this._dataExpTimer.TYPE_ONE_SHOT);
    },
    _makeStorageKey: function CachedResource__makeStorageKey(resDescr) {
        return [
            resDescr.url,
            resDescr.method,
            resDescr.isPrivate,
            resDescr.statusRange.start,
            resDescr.statusRange.end,
            resDescr.cacheKeysStr
        ].join("#");
    },
    get _noData() {
        return sysutils.isEmptyObject(this._responseData);
    }
};
function ResourceDownloader(resDescr) {
    patterns.NotificationSource.apply(this);
    sysutils.ensureValueTypeIs(resDescr, BarPlatform.CachedResources.ResDescriptor);
    this._resDescr = resDescr;
    this._responseData = {
        status: -1,
        bodyText: "",
        headers: null
    };
    this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    var resFileName = decodeURIComponent(resDescr.uri.path.split("/").slice(-1)) || "[NOFILE]";
    this._logger = BarPlatform._getLogger("NetDlr." + resFileName + "." + ++ResourceDownloader._instCounter);
    this._logger.debug("Downloader created for " + this._resDescr.url);
}
;
ResourceDownloader._instCounter = 0;
ResourceDownloader.prototype = {
    __proto__: patterns.NotificationSource.prototype,
    constructor: ResourceDownloader,
    update: function ResDownloader_update(bypassCache) {
        var requestId = this._sendRequest(!!bypassCache);
        this._timer.cancel();
        if (!!bypassCache) {
            this._errorsCounter = 0;
        }
        return requestId;
    },
    get responseData() {
        return this._responseData;
    },
    _finalize: function ResDownloader_finalize() {
        if (!this._resDescr)
            return;
        this._logger.debug("Finalizing " + this._resDescr.url);
        delete BarPlatform.CachedResources._downloaders[BarPlatform.CachedResources._dlHash(this._resDescr)];
        this._timer.cancel();
        this._resDescr = null;
        this.removeAllListeners();
    },
    notify: function ResDownloader_notify() {
        try {
            this._sendRequest();
        } catch (e) {
            this._resetReqTimer(this._currentInterval);
            this._logger.error("Failed sending request. " + strutils.formatError(e));
        }
    },
    _consts: { MSG_STATUS_REPORT: "Listeners changed (%1 total). New interval for '%2' is %3s" },
    _currRequestID: undefined,
    _currentInterval: Number.POSITIVE_INFINITY,
    _resDescr: null,
    _responseData: null,
    _timer: null,
    _logger: null,
    _errorsCounter: 0,
    _listenerAdded: function ResDownloader__listenerAdded(topic, listener) {
        var addedInterval = listener.descriptor.updateInterval;
        if (addedInterval < this._currentInterval)
            this._currentInterval = addedInterval;
        if (this._getListeners("finished").length == 1) {
            if (this._currentInterval != Number.POSITIVE_INFINITY)
                this._resetReqTimer(this._currentInterval);
        }
        this._logger.debug(strutils.formatString(this._consts.MSG_STATUS_REPORT, [
            this._getListeners("finished").length,
            this._resDescr.url,
            this._currentInterval
        ]));
    },
    _listenerRemoved: function ResDownloader__listenerRemoved(topic, listener) {
        this._updateInterval();
        this._logger.debug(strutils.formatString(this._consts.MSG_STATUS_REPORT, [
            this._getListeners("finished").length,
            this._resDescr.url,
            this._currentInterval
        ]));
        if (!this._hasListeners)
            this._finalize();
    },
    _resetReqTimer: function ResDownloader__resetReqTimer(newInterval) {
        this._timer.cancel();
        if (newInterval && newInterval != Number.POSITIVE_INFINITY) {
            this._timer.initWithCallback(this, newInterval * 1000, this._timer.TYPE_ONE_SHOT);
        }
    },
    _updateInterval: function ResDownloader__updateInterval() {
        var minInterval = Number.POSITIVE_INFINITY;
        this._getListeners("finished").forEach(function (netRes) {
            var resInterval = netRes.descriptor.updateInterval;
            if (resInterval < minInterval)
                minInterval = resInterval;
        });
        this._resetReqTimer(minInterval);
        this._currentInterval = minInterval;
    },
    _sendRequest: function ResDownloader__sendRequest(bypassCache) {
        var requestId = BarPlatform.CachedResources._getNewRequestID();
        this._logger.debug(strutils.formatString("Request #%1: %2 %3 from %4", [
            requestId,
            this._resDescr.method,
            this._resDescr.isPrivate ? "private" : "public",
            this._resDescr.url
        ]));
        var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.open(this._resDescr.method, this._resDescr.url, true);
        if (!this._resDescr.isPrivate) {
            request.channel.loadFlags |= Ci.nsIRequest.LOAD_ANONYMOUS;
        }
        if (bypassCache) {
            request.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
        }
        var target = request.QueryInterface(Ci.nsIDOMEventTarget);
        var requestHandler = this._handleResponse.bind(this, requestId);
        target.addEventListener("load", requestHandler, false);
        target.addEventListener("error", requestHandler, false);
        request.send(null);
        return requestId;
    },
    _handleResponse: function ResDownloader__handleResponse(requestId, reqEvent) {
        if (!this._resDescr)
            return;
        try {
            let request = reqEvent.target;
            this._logger.debug("Handling response #" + requestId + " for " + this._resDescr.url);
            this._responseData.status = request.status;
            this._responseData.bodyText = request.responseText;
            let headers = Object.create(null);
            try {
                request.channel.QueryInterface(Ci.nsIHttpChannel);
                request.channel.visitResponseHeaders({ visitHeader: function ResDownloader_visitHeader(name, value) headers[name] = value });
            } catch (ex) {
            }
            this._responseData.headers = headers;
            this._notifyListeners("finished", requestId);
        } catch (e) {
            this._logger.error("Error in ResourceDownloader::_handleResponse. " + strutils.formatError(e));
        } finally {
            let responseError = this._responseData.status < this._resDescr.statusRange.start || this._responseData.status > this._resDescr.statusRange.end || this._responseData.bodyText == null;
            if (responseError) {
                this._logger.debug("_handleResponse: ERROR;  HTTP-status: " + this._responseData.status);
            }
            let newInterval = this._currentInterval;
            if (responseError) {
                newInterval = 15 * Math.pow(2, this._errorsCounter++);
                if (newInterval > 3600) {
                    newInterval = 3600;
                }
            } else {
                this._errorsCounter = 0;
            }
            this._resetReqTimer(newInterval);
            BarPlatform.CachedResources._onDownloadFinished(requestId);
        }
    }
};
