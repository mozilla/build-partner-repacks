"use strict";
const EXPORTED_SYMBOLS = ["urlRewrite"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
const ONE_HOUR_IN_SEC = 60 * 60;
const UNIQUE_SESSION_KEY = Date.now();
const urlRewrite = {
        init: function urlRewrite_init(application) {
            this._application = application;
            this._logger = this._application.getLogger("URLRewrite");
            this._resetRequest();
            this._recalculateRewriteRules();
        },
        finalize: function urlRewrite_finalize(aDoCleanup) {
            this._removeRequest();
            this._stopObservingRequests();
            this._rewriteRules = null;
            this.__httpCacheSession = null;
            this.__diskCacheStorage = null;
            this._logger = null;
            this._application = null;
        },
        get REWRITE_RULES_URL() {
            var url = "https://storage.ape.yandex.net/get/elmt/";
            switch (this._application.branding.brandID) {
            case "ua":
                url += "rlistua";
                break;
            case "tb":
                url += "rlisttb";
                break;
            default:
                url += "rlist";
                break;
            }
            delete this.REWRITE_RULES_URL;
            return this.REWRITE_RULES_URL = url;
        },
        _addRequest: function urlRewrite__addRequest() {
            var descrData = {
                    url: this.REWRITE_RULES_URL,
                    method: "GET",
                    updateInterval: this._updateInterval,
                    cacheKeys: { uniqueSessionKey: UNIQUE_SESSION_KEY }
                };
            var cachedResources = this._application.BarPlatform.CachedResources;
            this._cachedResource = cachedResources.getResource(new cachedResources.ResDescriptor(descrData));
            this._cachedResource.addListener("changed", this);
            this._cachedResource.addListener("invalidated", this);
        },
        _removeRequest: function urlRewrite__removeRequest() {
            if (!this._cachedResource)
                return;
            this._cachedResource.removeListener("changed", this);
            this._cachedResource.removeListener("invalidated", this);
            this._cachedResource = null;
        },
        _resetRequest: function urlRewrite__resetRequest() {
            this._removeRequest();
            this._addRequest();
        },
        observe: function urlRewrite_observe(subject, topic, data) {
            switch (topic) {
            case "http-on-modify-request":
                if (!this._rewriteRules)
                    return;
                let channel = subject;
                try {
                    channel.QueryInterface(Ci.nsIHttpChannel);
                    if (!("redirectTo" in channel)) {
                        if (!(channel.loadFlags & Ci.nsIChannel.LOAD_INITIAL_DOCUMENT_URI))
                            return;
                    }
                    let currentSpec = channel.URI.spec;
                    let newSpec;
                    let currentSpecPrefix = currentSpec.replace(/^[a-z]+:\/\//, "");
                    this._rewriteRules.prefixes.some(function ([
                        prefix,
                        replace
                    ]) {
                        if (currentSpecPrefix.indexOf(prefix) !== 0)
                            return false;
                        newSpec = channel.URI.scheme + "://" + currentSpecPrefix.replace(prefix, replace);
                        return true;
                    });
                    if (!newSpec) {
                        this._rewriteRules.urlsRe.some(function ([
                            urlRe,
                            replace
                        ]) {
                            if (!urlRe.test(currentSpec))
                                return false;
                            newSpec = currentSpec.replace(urlRe, replace);
                            return true;
                        });
                    }
                    if (!newSpec)
                        return;
                    let uri = Services.io.newURI(newSpec, null, null);
                    if ("redirectTo" in channel) {
                        channel.redirectTo(uri);
                    } else {
                        let window = this._getDOMWindowForChannel(channel);
                        if (!window)
                            return;
                        window.location = uri.spec;
                        channel.cancel(Cr.NS_BINDING_REDIRECTED);
                    }
                    this._logger.debug("Redirect '" + currentSpec.substring(0, 100) + "' to '" + uri.spec.substring(0, 100) + "'");
                } catch (e) {
                    this._logger.error("Error observing 'http-on-modify-request':\n" + e);
                    this._logger.debug(e.stack);
                }
                break;
            case "changed":
            case "invalidated":
                this._recalculateRewriteRules();
                break;
            default:
                break;
            }
        },
        _getDOMWindowForChannel: function urlRewrite__getDOMWindowForChannel(channel) {
            try {
                return channel.loadGroup.groupObserver.QueryInterface(Ci.nsIWebProgress).DOMWindow;
            } catch (e) {
            }
            return null;
        },
        __httpCacheSession: null,
        get _httpCacheSession() {
            if (!this.__httpCacheSession) {
                this.__httpCacheSession = Services.cache.createSession("HTTP", Ci.nsICache.STORE_ANYWHERE, true);
                this.__httpCacheSession.doomEntriesIfExpired = false;
            }
            return this.__httpCacheSession;
        },
        __diskCacheStorage: null,
        get _diskCacheStorage() {
            if (this.__diskCacheStorage === null) {
                if (Services.cache2 && !this._application.core.Lib.sysutils.platformInfo.browser.version.isLessThan("30.a1")) {
                    let {LoadContextInfo: LoadContextInfo} = Cu.import("resource://gre/modules/LoadContextInfo.jsm", null);
                    this.__diskCacheStorage = Services.cache2.diskCacheStorage(LoadContextInfo.default, false);
                } else {
                    this.__diskCacheStorage = false;
                }
            }
            return this.__diskCacheStorage;
        },
        onCacheEntryAvailable: function urlRewrite_onCacheEntryAvailable(entry, isnew, appcache, status) {
            if (status !== Cr.NS_OK || !entry)
                return;
            const CACHE_EXPIRE_DIFF_IN_SEC = 10;
            try {
                if (entry.lastModified) {
                    let expirationTime = entry.lastModified + (this._updateInterval - CACHE_EXPIRE_DIFF_IN_SEC);
                    entry.setExpirationTime(expirationTime);
                    if ("markValid" in entry)
                        entry.markValid();
                }
            } catch (e) {
            }
        },
        onCacheEntryDoomed: function urlRewrite_onCacheEntryDoomed() {
        },
        onCacheEntryCheck: function urlRewrite_onCacheEntryCheck(entry, appcache) {
            return Ci.nsICacheEntryOpenCallback.ENTRY_WANTED;
        },
        _recalculateRewriteRules: function urlRewrite__recalculateRewriteRules() {
            if (!this._cachedResource)
                return;
            new this._application.core.Lib.sysutils.Timer(function () {
                if (this._diskCacheStorage) {
                    this._diskCacheStorage.asyncOpenURI(Services.io.newURI(this.REWRITE_RULES_URL, null, null), "", Ci.nsICacheStorage.OPEN_READONLY, this);
                } else {
                    this._httpCacheSession.asyncOpenCacheEntry(this.REWRITE_RULES_URL, Ci.nsICache.ACCESS_READ, {
                        onCacheEntryAvailable: function asyncOpenCacheEntry_onCacheEntryAvailable(entry, accessGranted, status) {
                            return urlRewrite.onCacheEntryAvailable(entry, false, false, status);
                        },
                        onCacheEntryDoomed: function asyncOpenCacheEntry_onCacheEntryDoomed() {
                        }
                    }, true);
                }
            }.bind(this), 1000);
            var json;
            try {
                json = this._cachedResource.contentAsJSON;
            } catch (e) {
            }
            if (!json)
                return;
            if ("prefixes" in json && !Array.isArray(json.prefixes))
                return;
            if ("urlsRe" in json && !Array.isArray(json.urlsRe))
                return;
            if ("updateInterval" in json && typeof json.updateInterval !== "number")
                return;
            if (json.updateInterval) {
                const FIVE_MIN_IN_SEC = 5 * 60;
                let updateInterval = parseInt(json.updateInterval, 10);
                if (updateInterval >= FIVE_MIN_IN_SEC && this._updateInterval !== updateInterval) {
                    this._logger.debug("Set new update interval (" + updateInterval + " sec).");
                    this._updateInterval = updateInterval;
                    this._resetRequest();
                }
            }
            var isValidArrayData = function isValidArrayData(element) {
                return Array.isArray(element) && typeof element[0] === "string" && element[0].length && typeof element[1] === "string" && element[1].length;
            };
            this._rewriteRules = Object.create(null);
            this._rewriteRules.prefixes = (json.prefixes || []).filter(function (prefixData) isValidArrayData(prefixData));
            this._rewriteRules.urlsRe = (json.urlsRe || []).map(function (urlData) {
                if (isValidArrayData(urlData)) {
                    try {
                        return [
                            new RegExp(urlData[0]),
                            urlData[1]
                        ];
                    } catch (e) {
                    }
                }
                return null;
            }).filter(function (urlData) !!urlData);
            this._logger.debug("Rules updated.");
            if (this._rewriteRules.prefixes.length || this._rewriteRules.urlsRe.length)
                this._startObservingRequests();
            else
                this._stopObservingRequests();
        },
        _startObservingRequests: function urlRewrite__startObservingRequests() {
            if (this._httpRequestsObserving)
                return;
            this._logger.debug("Starting observe.");
            this._httpRequestsObserving = true;
            Services.obs.addObserver(this, "http-on-modify-request", false);
        },
        _stopObservingRequests: function urlRewrite__stopObservingRequests() {
            if (!this._httpRequestsObserving)
                return;
            this._httpRequestsObserving = false;
            Services.obs.removeObserver(this, "http-on-modify-request");
        },
        _httpRequestsObserving: false,
        _rewriteRules: null,
        _updateInterval: ONE_HOUR_IN_SEC
    };
