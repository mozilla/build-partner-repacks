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
const THUMB_STYLE = {
        LOGOS_AND_TITLES: 1,
        LOGOS_AND_SHOTS: 2,
        SHOTS: 3
    };
const SCREENSHOTS_UPDATE_TIME = 86400;
const SCREENSHOTS_BASEPATH = "resource://vb-profile-data/shots/";
var screenshotsUniqIds = Object.create(null);
var screenshotsCache = Object.create(null);
function Screenshot(url) {
    var name = misc.CryptoHash.getFromString(url, "SHA1") + ".png";
    this.name = name;
    this.file = screenshots.shotsDir;
    this.file.append(name);
    this._url = SCREENSHOTS_BASEPATH + name;
    this.sourceUrl = url;
    this.uri = {};
    try {
        this.uri = Services.io.newURI(this.sourceUrl, null, null);
    } catch (e) {
    }
    ;
}
Screenshot.prototype = {
    get url() {
        if (!screenshotsUniqIds[this.sourceUrl])
            screenshotsUniqIds[this.sourceUrl] = 1;
        return this._url + "?uniqid=" + screenshotsUniqIds[this.sourceUrl];
    },
    get fontColor() {
        var cache = screenshotsCache[this.sourceUrl] || {};
        cache.fontColor = cache.fontColor || screenshots._application.colors.getFontColorByBackgroundColor(this.color);
        screenshotsCache[this.sourceUrl] = cache;
        return cache.fontColor;
    },
    get color() {
        return (screenshotsCache[this.sourceUrl] || {}).color || null;
    },
    set color(val) {
        if (!val)
            return;
        if (!screenshotsCache[this.sourceUrl])
            screenshotsCache[this.sourceUrl] = {};
        screenshotsCache[this.sourceUrl].color = val;
        screenshotsCache[this.sourceUrl].fontColor = screenshots._application.colors.getFontColorByBackgroundColor(val);
    },
    get fileAvailable() {
        return this.file.exists() && this.file.isFile() && this.file.isReadable();
    },
    get nonZeroFileAvailable() {
        return this.fileAvailable && this.file.fileSize > 0;
    },
    shot: function Screenshot_shot() {
        this.file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
        var url = this.sourceUrl;
        try {
            this.uri.QueryInterface(Ci.nsIURL);
        } catch (err) {
            return;
        }
        if (screenshots._application.isYandexURL(this.uri.spec)) {
            let parsedQuery = netutils.querystring.parse(this.uri.query || "");
            parsedQuery.nugt = "vbff-" + screenshots._application.addonManager.addonVersion;
            this.uri.query = netutils.querystring.stringify(parsedQuery);
            url = this.uri.spec;
        }
        screenshots.grabber.getScreenshot(url);
    },
    getDataForThumb: function Screenshot_getDataForThumb() {
        return {
            url: this.url,
            color: this.color,
            fontColor: this.fontColor
        };
    },
    remove: function Screenshot_remove() {
        fileutils.removeFileSafe(this.file);
    }
};
const screenshots = {
        init: function Screenshots_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("Screenshots");
        },
        finalize: function Screenshots_finalize() {
            if (this._grabber) {
                this._grabber.destroy();
                this._grabber = null;
            }
        },
        handlePageShow: function Screenshots_handlePageShow(windowListenerData) {
            var {originalURL: originalURL} = (windowListenerData.docShellProps || {}).currentDocumentChannel || {};
            var shownURL = windowListenerData.url;
            if (!originalURL || originalURL === "about:blank" || originalURL === shownURL)
                originalURL = null;
            var existURLs = Object.create(null);
            this._application.internalStructure.iterate({ nonempty: true }, function (thumbData, index) {
                if (thumbData.source === originalURL)
                    existURLs[originalURL] = true;
                if (thumbData.source === shownURL)
                    existURLs[shownURL] = true;
            });
            Object.keys(existURLs).forEach(function (thumbURL) {
                var screenshot = this.createScreenshotInstance(thumbURL);
                var result = { url: thumbURL };
                this.grabber.waitCompleteAndRequestFrameCanvasData(windowListenerData.tab, function (streamData, color) {
                    result.img = streamData;
                    result.color = color;
                    this.onScreenshotCreated(result);
                }.bind(this));
            }, this);
        },
        _grabber: null,
        get grabber() {
            if (!this._grabber)
                this._grabber = this._application.screenshotsGrabber.newInstance(this);
            return this._grabber;
        },
        createScreenshotInstance: function () {
            var cache = Object.create(null);
            return function Screenshots_createScreenshotsInstance(url) {
                cache[url] = cache[url] || new Screenshot(url);
                return cache[url];
            };
        }(),
        saveStream: function Screenshots_saveStream(streamData, file) {
            fileutils.writeStreamToFile(streamData, file);
            screenshots._logger.trace("file saved " + file.leafName);
        },
        onScreenshotCreated: function Screenshots_onSShotCreated(aData) {
            if (!aData.img)
                return;
            var isYandexURL = this._application.isYandexURL(aData.url);
            var uri;
            try {
                uri = Services.io.newURI(aData.url, null, null);
                uri.QueryInterface(Ci.nsIURL);
                let parsedQuery = netutils.querystring.parse(uri.query || "");
                delete parsedQuery.nugt;
                uri.query = netutils.querystring.stringify(parsedQuery);
            } catch (err) {
                return;
            }
            var urlWithoutNugtParam = uri.spec;
            var dataStructure = {};
            var toBeSaved = [];
            if (screenshotsUniqIds[aData.url])
                screenshotsUniqIds[aData.url]++;
            this._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                if (urlWithoutNugtParam !== aData.url && isYandexURL && urlWithoutNugtParam === data.source) {
                    toBeSaved.push({
                        url: urlWithoutNugtParam,
                        index: index,
                        thumbData: data
                    });
                }
                if (aData.url === data.source) {
                    toBeSaved.push({
                        url: aData.url,
                        index: index,
                        thumbData: data
                    });
                }
            });
            if (toBeSaved.length === 0)
                return;
            var screenshotData = toBeSaved.shift();
            var screenshot = this.createScreenshotInstance(screenshotData.url);
            screenshot.color = aData.color;
            screenshotData.thumbData.screenshot = screenshot.getDataForThumb();
            dataStructure[screenshotData.index] = screenshotData.thumbData;
            this.saveStream(aData.img, screenshot.file);
            toBeSaved.forEach(function (almostSaved) {
                var nugtScreenshot = this.createScreenshotInstance(almostSaved.url);
                var nugtThumbData = almostSaved.thumbData;
                if (screenshot.nonZeroFileAvailable && screenshot.name !== nugtScreenshot.name) {
                    screenshot.file.copyTo(nugtScreenshot.parent, nugtScreenshot.name);
                }
                nugtScreenshot.color = aData.color;
                nugtThumbData.screenshot = screenshot.getDataForThumb();
                dataStructure[almostSaved.index] = nugtThumbData;
            }.bind(this));
            var historyThumb = this._application.fastdial.cachedHistoryThumbs[screenshotData.url];
            if (historyThumb && this.useScreenshot(historyThumb)) {
                historyThumb.screenshot = screenshot.getDataForThumb();
                this._application.fastdial.sendRequest("historyThumbChanged", this._application.frontendHelper.getDataForThumb(historyThumb));
            }
            this._application.internalStructure.setItem(dataStructure);
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
        },
        useScreenshot: function Screenshots_useScreenshot(thumbData) {
            switch (this._application.preferences.get("ftabs.thumbStyle", 1)) {
            case THUMB_STYLE.SHOTS:
                return true;
            case THUMB_STYLE.LOGOS_AND_SHOTS:
                if (!thumbData.cloud || !thumbData.cloud.backgroundImage)
                    return true;
            case THUMB_STYLE.LOGOS_AND_TITLES:
            default:
                return false;
            }
        },
        get shotsDir() {
            var shotsDir = this._application.core.rootDir;
            shotsDir.append("shots");
            fileutils.forceDirectories(shotsDir);
            return shotsDir;
        }
    };
