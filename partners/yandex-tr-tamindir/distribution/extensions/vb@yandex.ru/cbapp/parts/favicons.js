"use strict";
const EXPORTED_SYMBOLS = ["favicons"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const FAVICON_URL = "http://favicon.yandex.net/favicon/";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "FAVICON_SRV", "@mozilla.org/browser/favicon-service;1", "nsIFaviconService");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "@mozilla.org/browser/livemark-service;2", "mozIAsyncLivemarks" in Ci ? "mozIAsyncLivemarks" : "nsILivemarkService");
const favicons = {
    init: function Favicons_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        XPCOMUtils.defineLazyModuleGetter(GLOBAL, "DataURI", "resource://" + application.name + "-mod/DataURI.jsm");
        this._application = application;
        this._logger = application.getLogger("Favicons");
    },
    finalize: function Favicons_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    requestFaviconForURL: function Favicons_requestFaviconForURL(uri, callback) {
        if (typeof uri === "string") {
            try {
                uri = Services.io.newURI(uri, null, null);
            } catch (e) {
            }
        }
        if (!(uri && uri.asciiHost)) {
            return callback(null);
        }
        let self = this;
        FAVICON_SRV.getFaviconDataForPage(uri, function Favicons_requestFaviconForURL_onDataGot(aURI, aDataLen, aData, aMimeType) {
            let faviconData;
            if (aURI) {
                faviconData = !aURI.schemeIs("chrome") && aDataLen > 0 ? new DataURI({
                    contentType: aMimeType,
                    base64: true
                }, aData).toString() : aURI.spec;
            } else {
                faviconData = /\.yandex\-team\.ru$/.test(uri.asciiHost) ? "http://" + uri.asciiHost + "/favicon.ico" : self.getYandexNetFaviconURL(uri);
            }
            self._application.colors.requestImageDominantColor(faviconData, function (err, color) {
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
    EMPTY_ICON: "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5cc" + "llPAAAAD9JREFUeNpiZGBgYAdiASBmZiAN/AXiD4xAQpwMzXBDQAZIMVAARg0YNWAYGUBJZvoHMoADmp2ZyMjOHwEC" + "DADJLweHaL6l7AAAAABJRU5ErkJggg==",
    _application: null,
    _logger: null
};
