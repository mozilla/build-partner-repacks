"use strict";
const EXPORTED_SYMBOLS = ["screenshotsGrabber"];
const GLOBAL = this;
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const SCREEN_DIMENSIONS = [
        1200,
        600
    ];
const CANVAS_DIMENSIONS = [
        300,
        150
    ];
const HIDDEN_XUL_ADDRESS = "chrome://yandex-vb/content/overlay/hiddenwindow.xul";
const HTML_NS = "http://www.w3.org/1999/xhtml";
const screenshotsGrabber = {
        init: function ScreenshotsGrabber_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("ScreenshotsGrabber");
        },
        finalize: function ScreenshotsGrabber_finalize(doCleanup, callback) {
            this._application = null;
            this._logger = null;
        },
        newInstance: function ScreenshotsGrabber_newInstance(aListener) {
            return new ScreenshotGrabber(aListener);
        }
    };
function getPixelsDominantColor() {
    var colors = screenshotsGrabber._application.colors;
    return colors.getPixelsDominantColor.apply(colors, arguments);
}
function ScreenshotGrabber(aListener) {
    if (!(aListener && "onScreenshotCreated" in aListener))
        throw new Error("ScreenshotGrabber needs onScreenshotCreated for listener");
    this._listener = aListener;
    this._progressListener = new SShotProgressListener(this);
    this._canvasQueue = new YaCanvasQueue(this);
    this.__frameLoaderId = "yaScreenShotGrabberFrame-" + Date.now();
    this.__frameLoader = null;
    this.smoothEnabled = sysutils.platformInfo.os.name !== "mac";
    this.SIZE = {
        SCREEN: {
            WIDTH: SCREEN_DIMENSIONS[0],
            HEIGHT: SCREEN_DIMENSIONS[1]
        },
        CANVAS: {
            WIDTH: CANVAS_DIMENSIONS[0],
            HEIGHT: CANVAS_DIMENSIONS[1]
        }
    };
}
ScreenshotGrabber.prototype = {
    CANVAS_CAPTURE_TIMEOUT: 30000,
    isURLInQueue: function ScreenshotGrabber_isURLInQueue(aURL) {
        return this._canvasQueue.isURLInQueue(aURL);
    },
    getScreenshot: function ScreenshotGrabber_getScreenshot(aURL) {
        return this._canvasQueue.add(aURL);
    },
    notifyUILoaded: function ScreenshotGrabber_notifyUILoaded() {
        this._canvasQueue.checkNeedProccess();
    },
    destroy: function ScreenshotGrabber_destroy() {
        this._canvasQueue.destroy();
        this._canvasQueue = null;
        this._framesArray.forEach(function (aFrame) {
            this._setFrameEventListeners(aFrame, false);
            aFrame.parentNode.removeChild(aFrame);
        }, this);
        if (this.__frameLoader) {
            try {
                this.__frameLoader.removeEventListener("pageshow", this, false);
                this.__frameLoader.parentNode.removeChild(this.__frameLoader);
            } catch (e) {
            }
        }
        this.__frameLoader = null;
        this._progressListener = null;
        this._listener = null;
    },
    _setFrameEventListeners: function ScreenshotGrabber__setFrameEventListeners(aFrame, aSet) {
        var fn = (aSet ? "add" : "remove") + "ProgressListener";
        try {
            let webProgress = aFrame.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);
            webProgress[fn](this._progressListener, Ci.nsIWebProgress.NOTIFY_STATE_NETWORK);
        } catch (e) {
        }
    },
    _getCanvasForURL: function ScreenshotGrabber__getCanvasForURL(aURL) {
        var doc = this._frameLoader.contentDocument;
        var iframe = doc.createElement("iframe");
        iframe.setAttribute("type", "content");
        iframe.setAttribute("yaSSURL", aURL);
        iframe.setAttribute("style", "width: {W}px !important; height: {H}px !important;                  max-width: {W}px !important; max-height: {H}px !important;                  min-width: {W}px !important; min-height: {H}px !important;                  overflow: hidden !important;".replace(/\{W\}/g, this.SIZE.SCREEN.WIDTH).replace(/\{H\}/g, this.SIZE.SCREEN.HEIGHT));
        doc.lastChild.appendChild(iframe);
        var webNav = iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
        webNav.stop(Ci.nsIWebNavigation.STOP_ALL);
        this._setFrameEventListeners(iframe, true);
        iframe.docShell.allowPlugins = false;
        try {
            webNav.sessionHistory = Cc["@mozilla.org/browser/shistory;1"].createInstance(Ci.nsISHistory);
            webNav.loadURI(aURL, Ci.nsIWebNavigation.LOAD_FLAGS_IS_LINK, null, null, null);
        } catch (e) {
            this.waitCompleteAndRequestFrameCanvasData(iframe, 404);
        }
    },
    _onFinishForURL: function ScreenshotGrabber__onFinishForURL(aPageData) {
        this._canvasQueue._getCanvasCallback(aPageData);
        this._listener.onScreenshotCreated(aPageData);
    },
    get isGrabberFrameReady() {
        return Boolean(this._frameLoader && this._frameLoader.contentDocument);
    },
    get _hiddenWindow() {
        var hiddenWindow;
        try {
            hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
        } catch (e) {
            Cu.reportError(e);
        }
        if (!hiddenWindow)
            return null;
        delete this._hiddenWindow;
        this.__defineGetter__("_hiddenWindow", function () hiddenWindow);
        return this._hiddenWindow;
    },
    get _frameLoader() {
        var hiddenWindow = this._hiddenWindow;
        if (hiddenWindow && !this.__frameLoader) {
            this.__frameLoader = hiddenWindow.document.createElement("iframe");
            this.__frameLoader.addEventListener("pageshow", this, false);
            this.__frameLoader.setAttribute("id", this.__frameLoaderId);
            this.__frameLoader.setAttribute("src", HIDDEN_XUL_ADDRESS);
            let appendTimerStart = Date.now();
            let appendTimer = new sysutils.Timer(function () {
                    try {
                        hiddenWindow.document.documentElement.appendChild(this.__frameLoader);
                        appendTimer.cancel();
                    } catch (e) {
                    }
                }.bind(this), 300, true, 100);
        }
        return null;
    },
    get _framesArray() {
        return this._frameLoader && this._frameLoader.contentDocument ? Array.slice(this._frameLoader.contentDocument.getElementsByTagName("iframe")) : [];
    },
    _getFrameForDocument: function ScreenshotGrabber__getFrameForDocument(aTarget) {
        return this._framesArray.filter(function (aFrame) aFrame.contentDocument === aTarget)[0];
    },
    _isRequestSuccess: function ScreenshotGrabber__isRequestSuccess(aHttpStatus) {
        return !!(aHttpStatus >= 200 && aHttpStatus <= 299 || aHttpStatus === 304);
    },
    handleEvent: function ScreenshotGrabber_handleEvent(aEvent) {
        if (!aEvent.isTrusted)
            return;
        switch (aEvent.type) {
        case "pageshow":
            if (this.__frameLoader && aEvent.target == this.__frameLoader.contentDocument) {
                this.__frameLoader.removeEventListener("pageshow", this, false);
                delete this._frameLoader;
                let frameLoader = this.__frameLoader;
                this.__defineGetter__("_frameLoader", function () frameLoader);
                this._canvasQueue.checkNeedProccess();
            }
            break;
        default:
            break;
        }
    },
    _onPageLoad: function ScreenshotGrabber__onPageLoad(aTargetFrame, aHttpStatus) {
        var url = aTargetFrame.getAttribute("yaSSURL");
        var result = {
                url: url,
                httpStatus: aHttpStatus,
                checkTime: Date.now()
            };
        var doc = aTargetFrame.contentDocument;
        result.title = this._safeUnicode(doc.title);
        result.urlReal = this._safeUnicode(doc.location.href);
        result.faviconUrl = this._safeUnicode(this._getDocumentFaviconURL(doc));
        screenshotsGrabber._application.cloudSource.getManifestFromDocument(doc, doc.location.href);
        new sysutils.Timer(function () {
            this.requestFrameImageData(aTargetFrame, function (streamData, color) {
                result.img = streamData;
                result.color = color;
                aTargetFrame.parentNode.removeChild(aTargetFrame);
                this._onFinishForURL(result);
            }.bind(this));
        }.bind(this), 2000);
    },
    _safeUnicode: function ScreenshotGrabber__safeUnicode(aString) {
        return /[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/.test(aString) ? aString.replace(/[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "") : aString;
    },
    waitCompleteAndRequestFrameCanvasData: function ScreenshotGrabber_waitCompleteAndRequestFrameCanvasData(frame, httpStatus, callback) {
        if (httpStatus !== null) {
            this._setFrameEventListeners(frame, false);
        }
        var pageLoadCall = function pageLoadCall() {
                if (httpStatus) {
                    this._onPageLoad(frame, httpStatus);
                } else {
                    this.requestFrameImageData(frame, callback);
                }
            }.bind(this);
        var checker = new sysutils.Timer(function () {
                var doc = frame.contentDocument;
                if (!doc)
                    return;
                if (doc.readyState !== "complete")
                    return;
                checker.cancel();
                forcer.cancel();
                pageLoadCall();
            }, 1000, true);
        var forcer = new sysutils.Timer(function () {
                try {
                    checker.cancel();
                    pageLoadCall();
                } catch (e) {
                    Cu.reportError(e);
                }
            }, this.CANVAS_CAPTURE_TIMEOUT);
    },
    requestFrameImageData: function ScreenshotGrabber_requestFrameImageData(aFrame, callback) {
        var win = aFrame.contentWindow;
        if (!win)
            return;
        var canvas = aFrame.ownerDocument.createElementNS(HTML_NS, "canvas");
        var sbWidth = {};
        var sbHeight = {};
        try {
            win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils).getScrollbarSize(false, sbWidth, sbHeight);
        } catch (e) {
            sbWidth.value = sbHeight.value = 0;
        }
        var winWidth = win.innerWidth - sbWidth.value;
        var winHeight = win.innerHeight - sbHeight.value;
        canvas.mozImageSmoothingEnabled = true;
        canvas.width = this.SIZE.CANVAS.WIDTH;
        canvas.height = this.SIZE.CANVAS.HEIGHT;
        var scale = Math.min(Math.max(canvas.width / winWidth, canvas.height / winHeight), 1);
        var scaledWidth = winWidth * scale;
        var scaledHeight = winHeight * scale;
        if (scaledHeight > canvas.height)
            winHeight -= Math.floor(Math.abs(scaledHeight - canvas.height) * scale);
        if (scaledWidth > canvas.width)
            winWidth -= Math.floor(Math.abs(scaledWidth - canvas.width) * scale);
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.scale(scale, scale);
        ctx.drawWindow(win, 0, 0, winWidth, winHeight, "rgb(255,255,255)", ctx.DRAWWINDOW_DO_NOT_FLUSH);
        ctx.restore();
        if (this.smoothEnabled)
            this._smoothCanvas(canvas);
        var imgPixels = ctx.getImageData(0, 0, this.SIZE.CANVAS.WIDTH, this.SIZE.CANVAS.HEIGHT);
        var color = getPixelsDominantColor(imgPixels, {
                startX: 0,
                startY: 0,
                preventSkipColors: false
            });
        var asyncStreamCallback = {
                onInputStreamReady: function (streamData) {
                    callback(streamData, color);
                },
                QueryInterface: XPCOMUtils.generateQI([
                    Ci.nsISupports,
                    Ci.nsIInputStreamCallback
                ])
            };
        Services.tm.currentThread.dispatch(function () {
            canvas.mozFetchAsStream(asyncStreamCallback);
        }.bind(this), Ci.nsIThread.DISPATCH_NORMAL);
    },
    _smoothCanvas: function ScreenshotGrabber__smoothCanvas(aCanvas) {
        var w = aCanvas.width;
        var h = aCanvas.height;
        var tmpCanvas = aCanvas.ownerDocument.createElementNS(HTML_NS, "canvas");
        var ctx = aCanvas.getContext("2d");
        var tmpCtx = tmpCanvas.getContext("2d");
        let (i = 0) {
            for (; i < 1; i++) {
                let _w = Math.round(w - i);
                let _h = Math.round(h - i);
                tmpCanvas.width = _w;
                tmpCanvas.height = _h;
                tmpCtx.drawImage(aCanvas, 0, 0, _w, _h);
                ctx.drawImage(tmpCanvas, 0, 0, w, h);
            }
        }
    },
    _getDocumentFaviconURL: function ScreenshotGrabber__getDocumentFaviconURL(aDocument) {
        var url = Array.slice(aDocument.getElementsByTagName("link")).filter(function (aLinkElement) {
                return !!(/icon/.test(aLinkElement.rel) && /^https?:\/\//.test(aLinkElement.href));
            })[0];
        if (url)
            url = url.href;
        return url || null;
    }
};
function YaCanvasQueue(aGrabber) {
    this._grabber = aGrabber;
    this._elements = [];
    this._activeElementsMaxLength = 2;
}
YaCanvasQueue.prototype = {
    destroy: function YaCanvasQueue_destroy() {
        this.clear();
        this._grabber = null;
    },
    get size() {
        return this._elements.length;
    },
    get isEmpty() {
        return !this.size;
    },
    isURLInQueue: function YaCanvasQueue_isURLInQueue(aURL) {
        return this._elements.some(function (elm) aURL === elm.url);
    },
    clear: function YaCanvasQueue_clear() {
        this._elements.length = 0;
    },
    add: function YaCanvasQueue_add(aURL) {
        if (this.isURLInQueue(aURL))
            return false;
        this._elements.push({
            url: aURL,
            active: false
        });
        this.checkNeedProccess();
        return true;
    },
    remove: function YaCanvasQueue_remove(aURL) {
        this._elements = this._elements.filter(function (el) el.url !== aURL);
        this.checkNeedProccess();
    },
    get nextElement() {
        return this._elements.filter(function (el) el.active === false)[0];
    },
    get activeElementsLength() {
        return this._elements.filter(function (el) el.active === true).length;
    },
    checkNeedProccess: function YaCanvasQueue_checkNeedProccess() {
        if (this.isEmpty || !this._grabber.isGrabberFrameReady)
            return false;
        var element;
        while (this.activeElementsLength < this._activeElementsMaxLength && (element = this.nextElement)) {
            element.active = true;
            this._grabber._getCanvasForURL(element.url);
        }
        return true;
    },
    _getCanvasCallback: function YaCanvasQueue__getCanvasCallback(aPageData) {
        this.remove(aPageData.url);
    }
};
function SShotProgressListener(screenshotGrabber) {
    this.screenshotGrabber = screenshotGrabber;
}
SShotProgressListener.prototype = {
    _getRequestStatus: function SShotProgressListener__getRequestStatus(aFrame) {
        var webNavigation = aFrame.webNavigation;
        var httpStatus = 404;
        var channel = webNavigation && "currentDocumentChannel" in webNavigation ? webNavigation.currentDocumentChannel : null;
        if (channel) {
            try {
                channel = channel.QueryInterface(Ci.nsIHttpChannel);
                httpStatus = channel.responseStatus;
            } catch (e) {
                if (channel.URI && channel.contentType == "application/xhtml+xml" && channel.URI.scheme == "file") {
                    httpStatus = 200;
                }
            }
        }
        return httpStatus;
    },
    onStateChange: function SShotProgressListener_onStateChange(aWebProgress, aRequest, aStateFlags, aStatus) {
        if (aStateFlags & Ci.nsIWebProgressListener.STATE_IS_WINDOW && aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK && aStateFlags & Ci.nsIWebProgressListener.STATE_STOP) {
            aWebProgress.QueryInterface(Ci.nsIWebNavigation);
            if (!aWebProgress.document)
                return;
            let targetFrame = this.screenshotGrabber._getFrameForDocument(aWebProgress.document);
            if (!targetFrame)
                return;
            let httpStatus = this._getRequestStatus(targetFrame);
            let cacheListener = {
                    onCacheEntryAvailable: function SShotCacheListener_onCacheEntryAvailable(entry) {
                        entry.doom();
                        entry.close();
                    }
                };
            let url = targetFrame.getAttribute("yaSSURL");
            if (this._diskCacheStorage) {
                this._diskCacheStorage.asyncDoomURI(Services.io.newURI(url, null, null), "", null);
            } else {
                this._httpCacheSession.asyncOpenCacheEntry(url, Ci.nsICache.ACCESS_WRITE, cacheListener);
            }
            this.screenshotGrabber.waitCompleteAndRequestFrameCanvasData(targetFrame, httpStatus);
        }
    },
    onProgressChange: function SShotProgressListener_onProgressChange() {
        return 0;
    },
    onLocationChange: function SShotProgressListener_onLocationChange() {
        return 0;
    },
    onStatusChange: function SShotProgressListener_onStatusChange() {
        return 0;
    },
    onSecurityChange: function SShotProgressListener_onSecurityChange() {
        return 0;
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
            if (Services.cache2) {
                let {LoadContextInfo: LoadContextInfo} = Cu.import("resource://gre/modules/LoadContextInfo.jsm", null);
                this.__diskCacheStorage = Services.cache2.diskCacheStorage(LoadContextInfo.default, false);
            } else {
                this.__diskCacheStorage = false;
            }
        }
        return this.__diskCacheStorage;
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsISupportsWeakReference,
        Ci.nsIWebProgressListener
    ])
};
