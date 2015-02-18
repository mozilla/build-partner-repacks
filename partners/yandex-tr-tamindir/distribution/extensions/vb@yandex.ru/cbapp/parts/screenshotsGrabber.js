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
        this._messageManagersMap = new WeakMap();
    },
    finalize: function ScreenshotsGrabber_finalize(doCleanup, callback) {
        this._messageManagersMap = null;
        this._application = null;
        this._logger = null;
    },
    newInstance: function ScreenshotsGrabber_newInstance(aListener) {
        return new ScreenshotGrabber(aListener);
    },
    getWindowMessageManager: function ScreenshotsGrabber_getWindowMessageManager(window) {
        if (!this._messageManagersMap.has(window)) {
            let scriptURI = Services.io.newURI(__URI__, null, null);
            let scriptURL = scriptURI.resolve("./contentScripts/screenshotsGrabber.js");
            let messageManager = window.frameLoader.messageManager;
            messageManager.loadFrameScript(scriptURL, false);
            this._messageManagersMap.set(window, messageManager);
        }
        return this._messageManagersMap.get(window);
    },
    _messageManagersMap: null
};
function getPixelsDominantColor() {
    let colors = screenshotsGrabber._application.colors;
    return colors.getPixelsDominantColor.apply(colors, arguments);
}
function ScreenshotGrabber(aListener) {
    if (!(aListener && "onScreenshotCreated" in aListener)) {
        throw new Error("ScreenshotGrabber needs onScreenshotCreated for listener");
    }
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
        let fn = (aSet ? "add" : "remove") + "ProgressListener";
        try {
            let webProgress = aFrame.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);
            webProgress[fn](this._progressListener, Ci.nsIWebProgress.NOTIFY_STATE_NETWORK);
        } catch (e) {
        }
    },
    _getCanvasForURL: function ScreenshotGrabber__getCanvasForURL(aURL) {
        let doc = this._frameLoader.contentDocument;
        let iframe = doc.createElement("iframe");
        iframe.setAttribute("type", "content");
        iframe.setAttribute("yaSSURL", aURL);
        iframe.setAttribute("style", ("width: {W}px !important; height: {H}px !important; " + "max-width: {W}px !important; max-height: {H}px !important; " + "min-width: {W}px !important; min-height: {H}px !important; " + "overflow: hidden !important;").replace(/\{W\}/g, this.SIZE.SCREEN.WIDTH).replace(/\{H\}/g, this.SIZE.SCREEN.HEIGHT));
        doc.lastChild.appendChild(iframe);
        let webNav = iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
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
        let hiddenWindow;
        try {
            hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
        } catch (e) {
            Cu.reportError(e);
        }
        if (!hiddenWindow) {
            return null;
        }
        delete this._hiddenWindow;
        this.__defineGetter__("_hiddenWindow", () => hiddenWindow);
        return this._hiddenWindow;
    },
    get _frameLoader() {
        let hiddenWindow = this._hiddenWindow;
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
        return this._framesArray.filter(aFrame => aFrame.contentDocument === aTarget)[0];
    },
    _isRequestSuccess: function ScreenshotGrabber__isRequestSuccess(aHttpStatus) {
        return aHttpStatus >= 200 && aHttpStatus <= 299 || aHttpStatus === 304;
    },
    handleEvent: function ScreenshotGrabber_handleEvent(aEvent) {
        if (!aEvent.isTrusted) {
            return;
        }
        switch (aEvent.type) {
        case "pageshow":
            if (this.__frameLoader && aEvent.target == this.__frameLoader.contentDocument) {
                this.__frameLoader.removeEventListener("pageshow", this, false);
                delete this._frameLoader;
                let frameLoader = this.__frameLoader;
                this.__defineGetter__("_frameLoader", () => frameLoader);
                this._canvasQueue.checkNeedProccess();
            }
            break;
        default:
            break;
        }
    },
    _onPageLoad: function ScreenshotGrabber__onPageLoad(aTargetFrame, aHttpStatus) {
        let url = aTargetFrame.getAttribute("yaSSURL");
        let result = {
            url: url,
            httpStatus: aHttpStatus,
            checkTime: Date.now()
        };
        let doc = aTargetFrame.contentDocument;
        result.title = this._safeUnicode(doc.title);
        result.urlReal = this._safeUnicode(doc.location.href);
        result.faviconUrl = this._safeUnicode(this.getDocumentFaviconURL(doc));
        screenshotsGrabber._application.cloudSource.getManifestFromDocument(doc, doc.location.href);
        new sysutils.Timer(function () {
            this.requestFrameImageData(aTargetFrame, function (imgDataURL, color) {
                result.imgDataURL = imgDataURL;
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
        let pageLoadCall = function pageLoadCall() {
            if (httpStatus) {
                this._onPageLoad(frame, httpStatus);
            } else {
                this.requestFrameImageData(frame, callback);
            }
        }.bind(this);
        let checker = new sysutils.Timer(function () {
            let doc = frame.contentDocument;
            if (!doc) {
                return;
            }
            if (doc.readyState !== "complete") {
                return;
            }
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
        let screenId = [
            Date.now(),
            Math.random()
        ].join(":");
        const MESSAGE_NAME_PREFIX = "vb@yandex.ru:screenshotsGrabber:";
        let messageManager = screenshotsGrabber.getWindowMessageManager(aFrame);
        let messageListener = function messageListener({data}) {
            if (data.screenId !== screenId) {
                return;
            }
            messageManager.removeMessageListener(MESSAGE_NAME_PREFIX + "didCapture", messageListener);
            let color = getPixelsDominantColor(data.imgPixels, {
                startX: 0,
                startY: 0,
                preventSkipColors: false
            });
            callback(data.imgDataURL, color);
        };
        messageManager.addMessageListener(MESSAGE_NAME_PREFIX + "didCapture", messageListener);
        messageManager.sendAsyncMessage(MESSAGE_NAME_PREFIX + "capture", {
            screenId: screenId,
            canvasSize: {
                width: this.SIZE.CANVAS.WIDTH,
                height: this.SIZE.CANVAS.HEIGHT
            },
            smoothEnabled: this.smoothEnabled
        });
    },
    getDocumentFaviconURL: function ScreenshotGrabber__getDocumentFaviconURL(aDocument) {
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
        let links = Array.slice(aDocument.querySelectorAll("link[rel=icon]")).filter(function (element) {
            return /^https?:\/\//.test(element.href);
        });
        links.sort(function (a, b) {
            return getSize(a) - getSize(b);
        });
        return links.length ? links[0].href : null;
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
        return this._elements.some(elm => aURL === elm.url);
    },
    clear: function YaCanvasQueue_clear() {
        this._elements.length = 0;
    },
    add: function YaCanvasQueue_add(aURL) {
        if (this.isURLInQueue(aURL)) {
            return false;
        }
        this._elements.push({
            url: aURL,
            active: false
        });
        this.checkNeedProccess();
        return true;
    },
    remove: function YaCanvasQueue_remove(aURL) {
        this._elements = this._elements.filter(el => el.url !== aURL);
        this.checkNeedProccess();
    },
    get nextElement() {
        return this._elements.filter(el => el.active === false)[0];
    },
    get activeElementsLength() {
        return this._elements.filter(el => el.active === true).length;
    },
    checkNeedProccess: function YaCanvasQueue_checkNeedProccess() {
        if (this.isEmpty || !this._grabber.isGrabberFrameReady) {
            return false;
        }
        let element;
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
        let webNavigation = aFrame.webNavigation;
        let httpStatus = 404;
        let channel = webNavigation && "currentDocumentChannel" in webNavigation ? webNavigation.currentDocumentChannel : null;
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
            if (!aWebProgress.document) {
                return;
            }
            let targetFrame = this.screenshotGrabber._getFrameForDocument(aWebProgress.document);
            if (!targetFrame) {
                return;
            }
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
                let {LoadContextInfo} = Cu.import("resource://gre/modules/LoadContextInfo.jsm", null);
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
