"use strict";
const EXPORTED_SYMBOLS = ["screenshots"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PageThumbs", "resource://gre/modules/PageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PageThumbsStorage", "resource://gre/modules/PageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "BackgroundPageThumbs", "resource://gre/modules/BackgroundPageThumbs.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");
const THUMB_STYLE = {
    LOGOS_AND_TITLES: 1,
    LOGOS_AND_SHOTS: 2,
    SHOTS: 3
};
let screenshotsUniqIds = Object.create(null);
let screenshotsCache;
function Screenshot(url) {
    this._sourceURL = url;
}
Screenshot.prototype = {
    get url() {
        if (!this._checkedMissing) {
            this._checkedMissing = true;
            this.captureIfMissing({ skipLastFailedCheck: false });
        }
        this._cache.lastUsage = Date.now();
        screenshots.saveData();
        return PageThumbs.getThumbnailURL(this._sourceURL) + "&uniqid=" + this._screenshotUniqId;
    },
    get sourceURL() {
        return this._sourceURL;
    },
    get captureURL() {
        delete this.captureURL;
        let captureURL = this._sourceURL;
        if (screenshots._application.isYandexURL(this._sourceURL)) {
            let uri = Services.io.newURI(this._sourceURL, null, null);
            uri.QueryInterface(Ci.nsIURL);
            let parsedQuery = netutils.querystring.parse(uri.query || "");
            parsedQuery.nugt = "vbff-" + screenshots._application.addonManager.addonVersion;
            uri.query = netutils.querystring.stringify(parsedQuery);
            captureURL = uri.spec;
        }
        this.__defineGetter__("captureURL", () => captureURL);
        return this.captureURL;
    },
    captureIfMissing: function ({skipLastFailedCheck}) {
        if (skipLastFailedCheck) {
            this._cache.lastFailedCapture = 0;
        }
        if (this.captureURL !== this._sourceURL) {
            PageThumbsStorage.fileExistsForURL(this._sourceURL).then(exists => {
                if (exists) {
                    PageThumbsStorage.copy(this._sourceURL, this.captureURL);
                }
            });
        }
        let provideData = () => {
            this._screenshotUniqId++;
            if (this.captureURL !== this._sourceURL) {
                if (this._cache.lastFailedCapture) {
                    PageThumbsStorage.remove(this._sourceURL);
                } else {
                    PageThumbsStorage.copy(this.captureURL, this._sourceURL);
                }
                new sysutils.Timer(() => {
                    this._screenshotUniqId++;
                    screenshots._screenshotsProvider.provideData("screenshot", this.captureURL, this);
                }, 400);
            }
            screenshots._screenshotsProvider.provideData("screenshot", this._sourceURL, this);
        };
        let captureOptions = {
            onDone: url => {
                PageThumbsStorage.fileExistsForURL(this.captureURL).then(exists => {
                    this._cache.lastFailedCapture = exists ? 0 : Date.now();
                    screenshots.saveData();
                    provideData();
                });
            }
        };
        const EXPIRED_TIME = 7 * 24 * 60 * 60 * 1000;
        let notFailed = Math.abs((this._cache.lastFailedCapture || 0) - Date.now()) > EXPIRED_TIME;
        if (notFailed) {
            new sysutils.Timer(() => {
                BackgroundPageThumbs.captureIfMissing(this.captureURL, captureOptions);
            }, 1000);
        } else {
            provideData();
        }
    },
    get fontColor() {
        let cache = this._cache;
        cache.fontColor = cache.fontColor || screenshots._application.colors.getFontColorByBackgroundColor(this.color);
        return cache.fontColor;
    },
    get color() {
        return this._cache.color || null;
    },
    set color(val) {
        if (!val) {
            return;
        }
        let cache = this._cache;
        cache.color = val;
        cache.fontColor = screenshots._application.colors.getFontColorByBackgroundColor(val);
        screenshots.saveData();
    },
    getDataForThumb: function Screenshot_getDataForThumb() {
        return {
            url: this.url,
            color: this.color,
            fontColor: this.fontColor
        };
    },
    remove: function Screenshot_remove() {
        PageThumbsStorage.remove(this._sourceURL);
        delete screenshotsCache[this._sourceURL];
        screenshots.saveData();
    },
    toJSON: function Screenshot_toJSON() {
        return this.toString();
    },
    toString: function Screenshot_toJSON() {
        return "[Screenshot for " + this._sourceURL + "]";
    },
    canBeUsedWithThumb: function Screenshot_canBeUsed(thumbData) {
        if (!/^https?:/.test(thumbData.url)) {
            return false;
        }
        switch (screenshots._application.preferences.get("ftabs.thumbStyle", THUMB_STYLE.LOGOS_AND_TITLES)) {
        case THUMB_STYLE.SHOTS:
            return true;
        case THUMB_STYLE.LOGOS_AND_SHOTS:
            if (!thumbData.backgroundImage && !thumbData.background) {
                return true;
            }
            break;
        case THUMB_STYLE.LOGOS_AND_TITLES:
        default:
            return false;
        }
        return false;
    },
    onClearHistory: function () {
        this._checkedMissing = false;
    },
    _checkedMissing: false,
    get _screenshotUniqId() {
        if (!screenshotsUniqIds[this._sourceURL]) {
            screenshotsUniqIds[this._sourceURL] = 1;
        }
        return screenshotsUniqIds[this._sourceURL];
    },
    set _screenshotUniqId(val) {
        screenshotsUniqIds[this._sourceURL] = val;
    },
    get _cache() {
        return screenshotsCache[this._sourceURL] || (screenshotsCache[this._sourceURL] = {});
    }
};
const screenshots = {
    init: function Screenshots_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Screenshots");
        this._screenshotsProvider = application.dataproviders.getProvider("screenshots");
        this._screenshotsProvider.addListener("request", this._onDataProviderRequest);
        this._titlesProvider = application.dataproviders.getProvider("titles");
        this.loadData();
        this._delayInitTimer = new sysutils.Timer(() => {
            PageThumbs.addExpirationFilter(this);
            PlacesUtils.history.addObserver(historyObserver, false);
        }, 5000);
    },
    finalize: function Screenshots_finalize() {
        if (this._delayInitTimer.isRunning) {
            this._delayInitTimer.cancel();
        } else {
            PlacesUtils.history.removeObserver(historyObserver);
        }
        PageThumbs.removeExpirationFilter(this);
        this._screenshotsProvider.removeListener("request", this._onDataProviderRequest);
        this._screenshotsProvider = null;
        this._titlesProvider = null;
        screenshotsCache = null;
    },
    loadData: function Screenshots_loadData(urlToColors) {
        screenshotsCache = urlToColors || {};
    },
    saveData: function Screenshots_saveData(save, options = {}) {
        save(screenshotsCache, options);
    },
    getTitleFromDocument: function Screenshots_getTitleFromDocument(document, url) {
        let title = "";
        if ("title" in document) {
            title = document.title;
        } else if ("querySelector" in document) {
            title = document.querySelector("html > head > title");
            title = title && title.textContent;
        } else {
            this._logger.error("Unknown 'document' object, no 'title' and 'querySelector'");
            return;
        }
        title = this._safeUnicode(title);
        if (!title) {
            return;
        }
        this._titlesProvider.provideData("title", { url: url }, title);
        return title;
    },
    _onDataProviderRequest: function Screenshots__onDataProviderRequest(name, target) {
        screenshots.createScreenshotInstance(target.spec);
    },
    handlePageShow: function Screenshots_handlePageShow(windowListenerData) {
        let document = windowListenerData.tab.contentDocument;
        if (!document) {
            return;
        }
        let {originalURL} = (windowListenerData.docShellProps || {}).currentDocumentChannel || {};
        let shownURL = windowListenerData.url;
        if (!originalURL || originalURL === "about:blank" || originalURL === shownURL) {
            originalURL = null;
        }
        let existURLs = Object.create(null);
        this._application.internalStructure.iterate(function (thumbData, index) {
            if (thumbData.url === originalURL) {
                existURLs[originalURL] = true;
            }
            if (thumbData.url === shownURL) {
                existURLs[shownURL] = true;
            }
        });
        let urls = Object.keys(existURLs);
        if (!urls.length) {
            return;
        }
        let faviconURL = this._application.favicons.getDocumentFaviconURL(document);
        urls.forEach(pageURL => {
            this.getTitleFromDocument(document, pageURL);
            this._application.thumbsLogos.getManifestFromDocument(document, pageURL);
            this._application.favicons.onPageShow({
                url: pageURL,
                urlReal: shownURL,
                faviconURL: faviconURL
            });
        });
        let captureAndStore = () => {
            PageThumbs.captureAndStore(windowListenerData.tab, screenshotCaptured => {
                if (screenshotCaptured) {
                    for (let pageURL of urls) {
                        let thumbURL = PageThumbs.getThumbnailURL(pageURL);
                        this._application.colors.requestImageDominantColor(thumbURL, (err, color) => {
                            let screenshot = this.createScreenshotInstance(pageURL);
                            screenshot.captureIfMissing({ skipLastFailedCheck: true });
                            screenshot.color = color;
                        });
                    }
                }
            });
        };
        if ("shouldStoreThumbnail" in PageThumbs) {
            PageThumbs.shouldStoreThumbnail(windowListenerData.tab, doStore => {
                if (doStore) {
                    captureAndStore();
                }
            });
        } else {
            captureAndStore();
        }
    },
    createScreenshotInstance: function Screenshots_createScreenshotInstanceMaker() {
        let cache = Object.create(null);
        return function Screenshots_createScreenshotsInstance(url) {
            if (!cache[url]) {
                cache[url] = new Screenshot(url);
                screenshots._screenshotsProvider.provideData("screenshot", url, cache[url]);
            }
            return cache[url];
        };
    }(),
    filterForThumbnailExpiration: function (callback) {
        let dontExpireURLs = this._screenshotsProvider.getAll("screenshot").map(screenshot => screenshot.sourceURL);
        callback(dontExpireURLs);
    },
    _safeUnicode: function Screenshots__safeUnicode(str) {
        return /[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/.test(str) ? str.replace(/[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "") : str;
    },
    _delayInitTimer: null
};
const historyObserver = {
    onDeleteURI: function (uri) {
        new sysutils.Timer(() => {
            let screenshot = screenshots._screenshotsProvider.get("screenshot", { url: uri.spec });
            if (screenshot) {
                screenshot.onClearHistory();
            }
        }, 200);
    },
    onClearHistory: function () {
        new sysutils.Timer(() => {
            screenshots._screenshotsProvider.getAll("screenshot").forEach(screenshot => screenshot.onClearHistory());
        }, 200);
    },
    onTitleChanged: function () {
    },
    onBeginUpdateBatch: function () {
    },
    onEndUpdateBatch: function () {
    },
    onVisit: function () {
    },
    onPageChanged: function () {
    },
    onDeleteVisits: function () {
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavHistoryObserver])
};
