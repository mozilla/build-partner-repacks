"use strict";
const EXPORTED_SYMBOLS = ["slices"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const UUIDGenerator = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);
const HIDDEN_WND_URLS = {
    "resource://gre-resources/hiddenWindow.html": 1,
    "chrome://browser/content/hiddenWindow.xul": 1
};
let slicesRegistry = Object.create(null);
function Slice({url, disposable, windowProperties, injectedProperties, system, noautohide}) {
    this._id = UUIDGenerator.generateUUID().toString();
    this._logger.debug("Creating slice: " + [
        this._id,
        url
    ]);
    slicesRegistry[this._id] = this;
    try {
        this._browserId = slices._application.name + "-cb-slices-browser-" + this._id;
        this._windowProperties = windowProperties || {};
        this.injectedProperties = injectedProperties || {};
        this._disposable = Boolean(disposable);
        this._noautohide = Boolean(noautohide);
        this._w = this._windowProperties.width || -1;
        this._h = this._windowProperties.height || -1;
        this._createXULBrowser().then(browser => {
            this._browser = browser;
            if (!this._url) {
                this.url = url;
            }
        });
    } catch (e) {
        delete slicesRegistry[this._id];
        this._logger.error(e);
        this._logger.debug(e.stack);
    }
}
Slice.prototype = {
    get id() {
        return this._id;
    },
    get url() {
        return this._url;
    },
    set url(newURL) {
        if (this._url === newURL) {
            return;
        }
        this._url = newURL;
        if (this._browser && this._browser.getAttribute("src") !== newURL) {
            this._browser.setAttribute("src", newURL);
        }
    },
    get _logger() {
        return slices._logger;
    },
    get browser() {
        return this._browser;
    },
    get openPanelCtrl() {
        return this._panelCtrl;
    },
    get isOpen() {
        return Boolean(this._panelCtrl);
    },
    get noautohide() {
        return this._noautohide;
    },
    get width() {
        return this._w;
    },
    get height() {
        return this._h;
    },
    show: function Slice_show(anchorElement, onHide) {
        if (!(anchorElement instanceof Ci.nsIDOMElement)) {
            throw new TypeError("Anchor nsIDOMElement required");
        }
        if (onHide && typeof onHide != "function") {
            throw new TypeError("Second argument must be a function if defined");
        }
        let sliceCtrl = anchorElement.ownerDocument.defaultView[slices._application.name + "SlicePanelCtrl"];
        try {
            sliceCtrl.showSlice(this, anchorElement);
            this._panelCtrl = sliceCtrl;
            this._onHide = onHide;
        } catch (e) {
            this._logger.error(e);
            this._logger.debug(e.stack);
        }
    },
    hide: function Slice_hide() {
        if (this._panelCtrl) {
            this._panelCtrl.hide();
        }
    },
    sizeTo: function Slice_sizeTo(w, h) {
        this._w = w;
        this._h = h;
        if (this._panelCtrl && "sizeTo" in this._panelCtrl) {
            this._panelCtrl.sizeTo(w, h);
        }
    },
    destroy: function Slice_destroy() {
        this._logger.debug("Destroying slice: " + [
            this._id,
            this.url
        ]);
        try {
            this.hide();
            let browser = this.browser;
            this._browser = null;
            if (browser && browser.parentNode) {
                browser.parentNode.removeChild(browser);
            }
        } finally {
            delete slicesRegistry[this._id];
        }
    },
    browserReadyPromise: function () {
        return this._createXULBrowser();
    },
    onHidden: function Slice_onHidden() {
        this._panelCtrl = null;
        try {
            if (this._onHide) {
                this._onHide();
            }
        } catch (e) {
            this._logger.error("onHide callback failed. " + e);
            this._logger.debug(e.stack);
        }
        if (this._disposable) {
            let timer = new sysutils.Timer(this.destroy.bind(this), 250);
        }
    },
    _createXULBrowser: function Slice__createXULBrowser() {
        let deferred = promise.defer();
        slices.getHiddenSlicesDocumentPromise().then(frame => {
            let hiddenSlicesDocument = frame.contentDocument.defaultView.document;
            let existsBrowser = hiddenSlicesDocument.getElementById(this._browserId);
            if (existsBrowser) {
                deferred.resolve(existsBrowser);
            } else {
                const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
                let browser = hiddenSlicesDocument.createElementNS(XUL_NS, "browser");
                browser.setAttribute("id", this._browserId);
                browser.setAttribute("type", "content");
                browser.setAttribute("disablehistory", "true");
                hiddenSlicesDocument.documentElement.appendChild(browser);
                deferred.resolve(browser);
            }
        }, error => {
            deferred.reject(error);
        });
        return deferred.promise;
    }
};
const slices = {
    Slice: Slice,
    init: function Slices_init(aApplication) {
        this._application = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._logger = aApplication.getLogger("Slices");
        this._wndNamePattern = new RegExp("^" + aApplication.name + "-cb-slices-browser-(.+)");
        Services.obs.addObserver(this, this._consts.GLOBAL_CONTENT_DOC_CREATED, false);
        Services.obs.addObserver(this, this._consts.GLOBAL_CHROME_DOC_CREATED, false);
    },
    finalize: function Slices_finalize() {
        Services.obs.removeObserver(this, this._consts.GLOBAL_CONTENT_DOC_CREATED, false);
        Services.obs.removeObserver(this, this._consts.GLOBAL_CHROME_DOC_CREATED, false);
        for (let [
                    ,
                    slice
                ] in Iterator(slicesRegistry)) {
            try {
                slice.destroy();
            } catch (e) {
                this._logger.error("Could not destroy slice. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
        this._application = null;
    },
    create: function Slices_create(aSliceData) {
        return new Slice(aSliceData);
    },
    findSliceByID: function Slices_findSliceByID(sliceID) {
        return slicesRegistry[sliceID] || null;
    },
    getHiddenSlicesDocumentPromise: function () {
        let appName = this._application.name;
        return misc.hiddenWindows.getFramePromise(appName + "-cb-slices-frame", "chrome://" + appName + "/content/overlay/hiddenwindow.xul");
    },
    observe: function Slices_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case this._consts.GLOBAL_CHROME_DOC_CREATED:
        case this._consts.GLOBAL_CONTENT_DOC_CREATED:
            aSubject.QueryInterface(Ci.nsIDOMWindow);
            this._setupInnerBrowser(aSubject);
            break;
        }
    },
    _consts: {
        GLOBAL_CONTENT_DOC_CREATED: "content-document-global-created",
        GLOBAL_CHROME_DOC_CREATED: "chrome-document-global-created"
    },
    _setupInnerBrowser: function Slices__setupInnerBrowser(win) {
        if (!win) {
            return;
        }
        let wndNameMatch = this._wndNamePattern.exec(win.name);
        if (!wndNameMatch) {
            return;
        }
        let sliceID = wndNameMatch[1];
        let slice = slicesRegistry[sliceID];
        if (!slice) {
            this._logger.warn("Slice not found: " + sliceID);
            return;
        }
        if (!win.wrappedJSObject) {
            win = new XPCNativeWrapper(win);
        }
        win = win.wrappedJSObject;
        let exposeProps = obj => obj;
        if ("skipCOWCallableChecks" in Cu) {
            Cu.skipCOWCallableChecks();
            exposeProps = function (obj) {
                if (!(obj && typeof obj === "object")) {
                    return obj;
                }
                if (!("__exposedProps__" in obj)) {
                    let exposedProps = {};
                    Object.keys(obj).forEach(key => exposedProps[key] = "r");
                    obj.__exposedProps__ = exposedProps;
                }
                let exportedObj = Object.create(obj);
                Object.keys(obj.__exposedProps__).forEach(function (key) {
                    exportedObj.__defineGetter__(key, function () {
                        return exposeProps(obj[key]);
                    });
                });
                return exportedObj;
            };
        }
        for (let [
                    propName,
                    propVal
                ] in Iterator(slice.injectedProperties)) {
            win[propName] = exposeProps(propVal);
        }
        win.close = function win_close() {
            let panel = slice.openPanelCtrl;
            if (panel) {
                panel.hide();
            }
        };
        win.resizeWindowTo = function win_resizeWindowTo(w, h) {
            slice.sizeTo(w, h);
        };
    }
};
