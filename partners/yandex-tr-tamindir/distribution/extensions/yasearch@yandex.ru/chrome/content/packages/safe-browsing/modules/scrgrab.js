"use strict";
const EXPORTED_SYMBOLS = ["ScrGrabber"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const IO_SERVICE = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
function makeURI(aURLSpec, aCharset) {
    try {
        return IO_SERVICE.newURI(aURLSpec, aCharset, null);
    } catch (e) {
    }
    return null;
}
function safeUnicode(aString) {
    if (!/[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/.test(aString))
        return aString;
    return aString.replace(/[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "");
}
const G_ObserverServiceWrapper = {
    _observerService: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
    addObserver: function G_ObserverServiceWrapper_addObserver(aObject, aTopic) {
        return this._observerService.addObserver(aObject, aTopic, false);
    },
    removeObserver: function G_ObserverServiceWrapper_removeObserver(aObject, aTopic) {
        return this._observerService.removeObserver(aObject, aTopic, false);
    }
};
function G_Timer(aCallback, aDelay, aRepeating, aMaxTimes) {
    this.callback = aCallback;
    this.repeating = !!aRepeating;
    this.maxTimes = typeof aMaxTimes == "number" && aMaxTimes > 0 ? aMaxTimes : null;
    this.timesCounter = 0;
    this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    let type = aRepeating ? this.timer.TYPE_REPEATING_SLACK : this.timer.TYPE_ONE_SHOT;
    G_ObserverServiceWrapper.addObserver(this, "xpcom-shutdown");
    this.timer.initWithCallback(this, aDelay, type);
}
G_Timer.prototype = {
    observe: function G_Timer_observe(aSubject, aTopic, aData) {
        if (aTopic === "xpcom-shutdown")
            this.cancel();
    },
    get isRunning() {
        return !!this.timer;
    },
    cancel: function G_Timer_cancel() {
        if (!this.timer)
            return;
        this.timer.cancel();
        this.timer = null;
        this.callback = null;
        G_ObserverServiceWrapper.removeObserver(this, "xpcom-shutdown");
    },
    notify: function G_Timer_notify(timer) {
        let result = this.callback();
        this.timesCounter++;
        if (!this.repeating || this.maxTimes && this.timesCounter >= this.maxTimes)
            this.cancel();
        return result;
    },
    set delay(val) {
        if (this.timer)
            this.timer.delay = val;
    },
    QueryInterface: function G_Timer_QueryInterface(iid) {
        if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsITimerCallback) || iid.equals(Ci.nsIObserver))
            return this;
        throw Cr.NS_ERROR_NO_INTERFACE;
    }
};
function CanvasQueue(aGrabber) {
    this._grabber = aGrabber;
    this._elements = [];
    this._activeElementsMaxLength = 5;
}
CanvasQueue.prototype = {
    destroy: function CanvasQueue_destroy() {
        this.clear();
        this._grabber = null;
    },
    get size() {
        return this._elements.length;
    },
    get isEmpty() {
        return !this.size;
    },
    isURLInQueue: function CanvasQueue_isURLInQueue(aURL) {
        return this._elements.some(function (elm) {
            return aURL === elm.url;
        });
    },
    clear: function CanvasQueue_clear() {
        this._elements = [];
    },
    push: function CanvasQueue_push(aURL) {
        if (this.isURLInQueue(aURL))
            return false;
        this._elements.push({
            url: aURL,
            active: false
        });
        this.checkNeedProccess();
        return true;
    },
    remove: function CanvasQueue_remove(aURL) {
        this._elements = this._elements.filter(function (el) {
            return el.url !== aURL;
        });
        this.checkNeedProccess();
    },
    get nextElement() {
        return this._elements.filter(function (el) {
            return el.active === false;
        })[0];
    },
    get activeElementsLength() {
        return this._elements.filter(function (el) {
            return el.active === true;
        }).length;
    },
    checkNeedProccess: function CanvasQueue_checkNeedProccess() {
        if (this.isEmpty || !this._grabber.isGrabberFrameReady)
            return false;
        let element;
        while (this.activeElementsLength < this._activeElementsMaxLength && (element = this.nextElement)) {
            element.active = true;
            this._grabber._getCanvasForURL(element.url);
        }
        return true;
    },
    _getCanvasCallback: function CanvasQueue__getCanvasCallback(aPageData) {
        this.remove(aPageData.url);
    }
};
function SShotProgressListener(aSShotGrabber) {
    this.SShotGrabber = aSShotGrabber;
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
        const nsIWebProgressListener = Ci.nsIWebProgressListener;
        if (aStateFlags & nsIWebProgressListener.STATE_IS_WINDOW && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK && aStateFlags & nsIWebProgressListener.STATE_STOP) {
            aWebProgress.QueryInterface(Ci.nsIWebNavigation);
            if (!aWebProgress.document)
                return;
            let targetFrame = this.SShotGrabber._getFrameForDocument(aWebProgress.document);
            if (!targetFrame)
                return;
            let httpStatus = this._getRequestStatus(targetFrame);
            this.SShotGrabber._onPageLoadTimed(targetFrame, httpStatus);
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
    QueryInterface: function SShotProgressListener_QueryInterface(aIID) {
        if (aIID.equals(Ci.nsIWebProgressListener) || aIID.equals(Ci.nsISupportsWeakReference) || aIID.equals(Ci.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    }
};
function ScrGrabber(aAPI, aListener) {
    if (!(aListener && "onSShotCreated" in aListener))
        throw new Error("ScrGrabber need onSShotCreated for listener");
    this.api = aAPI;
    this._listener = aListener;
    this._progressListener = new SShotProgressListener(this);
    this._canvasQueue = new CanvasQueue(this);
    this.__frameLoader = null;
    this.__frameLoaderId = "mcScrGrabberFrame-" + Date.now();
    this._captureTimer = null;
    this.SIZE = {
        SCREEN: {
            WIDTH: 1024,
            HEIGHT: 833
        },
        CANVAS: {
            WIDTH: 800,
            HEIGHT: 651
        }
    };
    this.SMOOTH_ENABLED = this.api.Environment.os.name != "mac";
}
ScrGrabber.prototype = {
    CANVAS_CAPTURE_TIMEOUT: 2000,
    isURLInQueue: function YaSShotGrabber_isURLInQueue(aURL) {
        return this._canvasQueue.isURLInQueue(aURL);
    },
    getCanvasForURL: function YaSShotGrabber_getCanvasForURL(aURL) {
        this._canvasQueue.clear();
        return this._canvasQueue.push(aURL);
    },
    _setFrameEventListeners: function YaSShotGrabber__setFrameEventListeners(aFrame, aSet) {
        let fn = (aSet ? "add" : "remove") + "ProgressListener";
        try {
            let webProgress = aFrame.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);
            webProgress[fn](this._progressListener, Ci.nsIWebProgress.NOTIFY_STATE_NETWORK);
        } catch (e) {
        }
    },
    _getCanvasForURL: function YaSShotGrabber__getCanvasForURL(aURL) {
        let doc = this._frameLoader.contentDocument;
        let iframe = doc.createElement("iframe");
        iframe.setAttribute("type", "content");
        iframe.setAttribute("mcSSURL", aURL);
        iframe.setAttribute("style", "width: {W}px !important; height: {H}px !important;                 max-width: {W}px !important; max-height: {H}px !important;                 min-width: {W}px !important; min-height: {H}px !important;                 overflow: hidden !important;".replace(/\{W\}/g, this.SIZE.SCREEN.WIDTH).replace(/\{H\}/g, this.SIZE.SCREEN.HEIGHT));
        doc.lastChild.appendChild(iframe);
        let webNav = iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
        webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);
        this._setFrameEventListeners(iframe, true);
        try {
            webNav.sessionHistory = Cc["@mozilla.org/browser/shistory;1"].createInstance(Ci.nsISHistory);
            webNav.loadURI(aURL, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        } catch (e) {
            this._onPageLoadTimed(iframe, 404);
        }
    },
    _onFinishForURL: function YaSShotGrabber__onFinishForURL(aPageData, aDestroy) {
        if (aDestroy)
            this._canvasQueue._getCanvasCallback(aPageData);
        this._listener.onSShotCreated(aPageData);
    },
    get _hiddenWindow() {
        let hiddenWindow;
        try {
            hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
        } catch (e) {
            Cu.reportError(e);
        }
        if (!hiddenWindow)
            return null;
        delete this._hiddenWindow;
        this.__defineGetter__("_hiddenWindow", function () {
            return hiddenWindow;
        });
        return this._hiddenWindow;
    },
    destroy: function YaSShotGrabber_destroy() {
        this._canvasQueue.destroy();
        this._canvasQueue = null;
        this._framesArray.forEach(function (aFrame) {
            this._setFrameEventListeners(aFrame, false);
            aFrame.parentNode.removeChild(aFrame);
        }, this);
        if (this.__frameLoader) {
            if ("removeHiddenFrame" in this.api.Browser) {
                this.api.Browser.removeHiddenFrame();
            } else {
                try {
                    this.__frameLoader.parentNode.removeChild(this.__frameLoader);
                } catch (e) {
                }
            }
        }
        if (this._captureTimer) {
            this._captureTimer.cancel();
            this._captureTimer = null;
        }
        this._progressListener = null;
        this._listener = null;
        this.__frameLoader = null;
    },
    get isGrabberFrameReady() !!this._frameLoader,
    get _frameLoader() {
        if (!this.__frameLoader)
            this.__frameLoader = this.api.Browser.getHiddenFrame();
        return this.__frameLoader;
    },
    get _framesArray() {
        return this.__frameLoader && this.__frameLoader.contentDocument ? Array.slice(this.__frameLoader.contentDocument.getElementsByTagName("iframe")) : [];
    },
    _getFrameForDocument: function YaSShotGrabber__getFrameForDocument(aTarget) {
        return this._framesArray.filter(function (aFrame) {
            return aFrame.contentDocument === aTarget;
        })[0];
    },
    _isRequestSuccess: function YaSShotGrabber__isRequestSuccess(aHttpStatus) {
        return !!(aHttpStatus >= 200 && aHttpStatus <= 299 || aHttpStatus === 304);
    },
    _onPageLoadTimed: function YaSShotGrabber__onPageLoadTimed(aTargetFrame, aHttpStatus) {
        if (this._captureTimer) {
            this._captureTimer.cancel();
        }
        this._captureTimer = new G_Timer(function () {
            this._onPageLoad(aTargetFrame, aHttpStatus, false);
            this._setFrameEventListeners(aTargetFrame, false);
        }.bind(this), 2000);
    },
    _onPageLoad: function YaSShotGrabber__onPageLoad(aTargetFrame, aHttpStatus, aDestroy) {
        let result = {
            url: aTargetFrame.getAttribute("mcSSURL"),
            httpStatus: aHttpStatus,
            checkTime: Date.now()
        };
        let status = this._isRequestSuccess(aHttpStatus);
        if (status) {
            let doc = aTargetFrame.contentDocument;
            result.title = safeUnicode(doc.title.toString());
            result.urlReal = safeUnicode(doc.location.toString());
            result.faviconUrl = safeUnicode(this._getDocumentFaviconURL(doc));
            result.img = this._getFrameCanvasData(aTargetFrame);
        }
        if (aDestroy)
            aTargetFrame.parentNode.removeChild(aTargetFrame);
        if (status)
            this._onFinishForURL(result, aDestroy);
    },
    _getFrameCanvasData: function YaSShotGrabber__getFrameCanvasData(aFrame) {
        let canvasOrig = this._frameLoader.contentDocument.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        canvasOrig.width = this.SIZE.SCREEN.WIDTH;
        canvasOrig.height = this.SIZE.SCREEN.HEIGHT;
        let ctxOrig = canvasOrig.getContext("2d");
        let win = aFrame.contentWindow;
        ctxOrig.drawWindow(win, win.pageXOffset, win.pageYOffset, win.pageXOffset + this.SIZE.SCREEN.WIDTH, win.pageYOffset + this.SIZE.SCREEN.HEIGHT, "rgb(255,255,255)");
        if (this.SMOOTH_ENABLED)
            this._smoothCanvas(canvasOrig);
        let canvasResult = this._frameLoader.contentDocument.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        canvasResult.width = this.SIZE.CANVAS.WIDTH;
        canvasResult.height = this.SIZE.CANVAS.HEIGHT;
        let ctxResult = canvasResult.getContext("2d");
        ctxResult.drawImage(canvasOrig, 0, 0, this.SIZE.SCREEN.WIDTH, this.SIZE.SCREEN.HEIGHT, 0, 0, this.SIZE.CANVAS.WIDTH, this.SIZE.CANVAS.HEIGHT);
        return canvasResult.toDataURL("image/png", "");
    },
    _smoothCanvas: function YaSShotGrabber__smoothCanvas(aCanvas) {
        let w = aCanvas.width;
        let h = aCanvas.height;
        let tmpCanvas = aCanvas.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        tmpCanvas.width = w;
        tmpCanvas.height = h;
        let ctx = aCanvas.getContext("2d");
        let tmpCtx = tmpCanvas.getContext("2d");
        let c = 1;
        let j = Math.round(c * 2);
        let dW = Math.round(w * 0.95);
        let dH = Math.round(h * 0.95);
        for (let i = 0; i < j; i++) {
            let _w = Math.max(2, Math.round(dW - 2 * i));
            let _h = Math.max(2, Math.round(dH - 2 * i));
            tmpCtx.clearRect(0, 0, w, h);
            tmpCtx.drawImage(aCanvas, 0, 0, w, h, 0, 0, _w, _h);
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(tmpCanvas, 0, 0, _w, _h, 0, 0, w, h);
        }
    },
    _createFaviconURL: function YaSShotGrabber__createFaviconURL(aURL) {
        let url;
        let uri = makeURI(aURL);
        if (uri && /^https?$/.test(uri.scheme))
            url = uri.prePath + "/favicon.ico";
        return url;
    },
    _getDocumentFaviconURL: function YaSShotGrabber__getDocumentFaviconURL(aDocument) {
        let url = Array.slice(aDocument.getElementsByTagName("link")).filter(function (aLinkElement) {
            return !!(/icon/.test(aLinkElement.rel) && /^https?:\/\//.test(aLinkElement.href));
        })[0];
        if (url)
            url = url.href;
        return url || this._createFaviconURL(aDocument.location) || "";
    }
};
