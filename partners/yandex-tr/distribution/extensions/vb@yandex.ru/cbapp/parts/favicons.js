"use strict";
const EXPORTED_SYMBOLS = ["favicons"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const FAVICON_URL = "https://favicon.yandex.net/favicon/";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "FAVICON_SRV", "@mozilla.org/browser/favicon-service;1", "nsIFaviconService");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "@mozilla.org/browser/livemark-service;2", "mozIAsyncLivemarks" in Ci ? "mozIAsyncLivemarks" : "nsILivemarkService");
const favicons = {
    init: function Favicons_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        XPCOMUtils.defineLazyModuleGetter(GLOBAL, "DataURI", "resource://" + application.name + "-mod/DataURI.jsm");
        this._application = application;
        this._logger = application.getLogger("Favicons");
        this._dataProvider = application.dataproviders.getProvider("favicons");
        this._dataProvider.addListener("request", (name, target, data) => {
            this.requestFaviconForURL(target.clone(), (url, color) => {
                if (!url) {
                    return;
                }
                this._dataProvider.provideData("favicon", { host: target.host }, {
                    url: url,
                    color: color
                });
            });
        });
    },
    finalize: function Favicons_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    requestFaviconForURL: function Favicons_requestFaviconForURL(uri, callback) {
        let host;
        if (typeof uri === "string") {
            try {
                uri = Services.io.newURI(uri, null, null);
            } catch (e) {
            }
        }
        try {
            host = uri.host;
        } catch (e) {
        }
        if (!(uri && host)) {
            callback(null);
            return;
        }
        if (uri.isInternalURL) {
            callback(null);
            return;
        }
        FAVICON_SRV.getFaviconDataForPage(uri, (aURI, aDataLen, aData, aMimeType) => {
            if (!this._application) {
                return;
            }
            let faviconData;
            if (aURI) {
                faviconData = !aURI.schemeIs("chrome") && aDataLen > 0 ? new DataURI({
                    contentType: aMimeType,
                    base64: true
                }, aData).toString() : aURI.spec;
            } else {
                faviconData = /\.yandex\-team\.ru$/.test(uri.asciiHost) ? "http://" + uri.asciiHost + "/favicon.ico" : this.getYandexNetFaviconURL(uri);
            }
            this._application.colors.requestImageDominantColor(faviconData, function (err, color) {
                if (err) {
                    callback();
                    return;
                }
                callback(faviconData, color);
            });
        });
    },
    getYandexNetFaviconURL: function Favicons_getYandexNetFaviconURL(uri) {
        return FAVICON_URL + uri.asciiHost;
    },
    getDocumentFaviconURL: function Favicons_getDocumentFaviconURL(document) {
        function getSize(element) {
            let targetSize = 16;
            let targetString = targetSize + "x" + targetSize;
            let attr = (element.getAttribute("sizes") || targetString).toLowerCase();
            if (!/x/.test(attr)) {
                attr = targetString;
            }
            let sizes = attr.split(" ");
            let foundSize = 0;
            let maxSize = 0;
            while (!foundSize && sizes.length) {
                let size = parseInt(sizes.pop().split("x")[0], 10);
                if (size > 0) {
                    if (size === targetSize) {
                        foundSize = targetSize;
                    }
                    if (maxSize < size) {
                        maxSize = size;
                    }
                }
            }
            if (maxSize < targetSize) {
                foundSize = targetSize;
            }
            return foundSize ? foundSize : maxSize;
        }
        let links = Array.slice(document.querySelectorAll("link[rel=icon]")).filter(function (element) {
            return /^https?:\/\//.test(element.href);
        });
        links.sort(function (a, b) {
            return getSize(a) - getSize(b);
        });
        return links.length ? links[0].href : null;
    },
    onPageShow: function (data) {
        let host = this._application.fastdial.getDecodedUrlHost(data.url, false);
        let onFaviconReady = (faviconURL, color) => {
            if (!this._dataProvider) {
                return;
            }
            if (faviconURL && color) {
                this._dataProvider.provideData("favicon", { host: host }, {
                    url: faviconURL,
                    color: color
                });
            }
        };
        if (data.faviconURL) {
            this._application.colors.requestImageDominantColor(data.faviconURL, function (err, color) {
                onFaviconReady(data.faviconURL, color);
            });
        } else {
            this.requestFaviconForURL(data.urlReal, onFaviconReady);
        }
    },
    EMPTY_ICON: "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5cc" + "llPAAAAD9JREFUeNpiZGBgYAdiASBmZiAN/AXiD4xAQpwMzXBDQAZIMVAARg0YNWAYGUBJZvoHMoADmp2ZyMjOHwEC" + "DADJLweHaL6l7AAAAABJRU5ErkJggg==",
    _application: null,
    _logger: null
};
