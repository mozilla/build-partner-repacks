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
var slicesRegistry = Object.create(null);
function Slice({
    url: url,
    disposable: disposable,
    windowProperties: windowProperties,
    injectedProperties: injectedProperties,
    system: system,
    noautohide: noautohide
}) {
    this._id = UUIDGenerator.generateUUID().toString();
    slices._logger.debug("Creating slice: " + [
        this._id,
        url
    ]);
    slicesRegistry[this._id] = this;
    try {
        this._browserId = slices._application.name + "-cb-slices-browser-" + this._id;
        this._windowProperties = windowProperties || {};
        this.injectedProperties = injectedProperties || {};
        this._disposable = !!disposable;
        this._noautohide = !!noautohide;
        this._browser = slices._hiddenSlicesDocument.getElementById(this._browserId) || this._createXULBrowser();
        this.url = url;
        this._w = this._windowProperties.width || -1;
        this._h = this._windowProperties.height || -1;
    } catch (e) {
        delete slicesRegistry[this._id];
        slices._logger.error(e);
        slices._logger.debug(e.stack);
    }
}
Slice.prototype = {
    get id() this._id,
    get url() this._url,
    set url(newURL) {
        if (this._url === newURL)
            return;
        this._url = newURL;
        if (this._browser.getAttribute("src") !== newURL) {
            this._browser.setAttribute("src", newURL);
        }
    },
    get browser() this._browser,
    get openPanelCtrl() this._panelCtrl,
    get isOpen() !!this._panelCtrl,
    get noautohide() this._noautohide,
    get width() this._w,
    get height() this._h,
    show: function Slice_show(anchorElement, onHide) {
        if (!(anchorElement instanceof Ci.nsIDOMElement))
            throw new TypeError("Anchor nsIDOMElement required");
        if (onHide && typeof onHide != "function")
            throw new TypeError("Second argument must be a function if defined");
        var sliceCtrl = anchorElement.ownerDocument.defaultView[slices._application.name + "SlicePanelCtrl"];
        try {
            sliceCtrl.showSlice(this, anchorElement);
            this._panelCtrl = sliceCtrl;
            this._onHide = onHide;
        } catch (e) {
            slices._logger.error(e);
            slices._logger.debug(e.stack);
        }
    },
    hide: function Slice_hide() {
        if (this._panelCtrl)
            this._panelCtrl.hide();
    },
    sizeTo: function Slice_sizeTo(w, h) {
        this._w = w;
        this._h = h;
        if (this._panelCtrl && "sizeTo" in this._panelCtrl)
            this._panelCtrl.sizeTo(w, h);
    },
    destroy: function Slice_destroy() {
        slices._logger.debug("Destroying slice: " + [
            this._id,
            this.url
        ]);
        try {
            this.hide();
            let browser = this.browser;
            this._browser = null;
            if (browser && browser.parentNode)
                browser.parentNode.removeChild(browser);
        } finally {
            delete slicesRegistry[this._id];
        }
    },
    onHidden: function Slice_onHidden() {
        this._panelCtrl = null;
        try {
            if (this._onHide)
                this._onHide();
        } catch (e) {
            this._logger.error("onHide callback failed. " + e);
            this._logger.debug(e.stack);
        }
        if (this._disposable) {
            let timer = new sysutils.Timer(this.destroy.bind(this), 250);
        }
    },
    _createXULBrowser: function Slice__createXULBrowser() {
        var hiddenDoc = slices._hiddenSlicesDocument;
        var browser = hiddenDoc.createElement("browser");
        browser.setAttribute("id", this._browserId);
        browser.setAttribute("type", "content");
        browser.setAttribute("disablehistory", "true");
        hiddenDoc.documentElement.appendChild(browser);
        return browser;
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
            if (!win)
                return;
            var wndNameMatch = this._wndNamePattern.exec(win.name);
            if (!wndNameMatch)
                return;
            var sliceID = wndNameMatch[1];
            var slice = slicesRegistry[sliceID];
            if (!slice) {
                this._logger.warn("Slice not found: " + sliceID);
                return;
            }
            if (!win.wrappedJSObject)
                win = new XPCNativeWrapper(win);
            win = win.wrappedJSObject;
            for (let [
                        propName,
                        propVal
                    ] in Iterator(slice.injectedProperties))
                win[propName] = propVal;
            win.close = function win_close() {
                var panel = slice.openPanelCtrl;
                if (panel)
                    panel.hide();
            };
            win.resizeWindowTo = function win_resizeWindowTo(w, h) {
                slice.sizeTo(w, h);
            };
        },
        get _hiddenSlicesDocument() {
            var appName = this._application.name;
            return misc.hiddenWindows.getFrame(appName + "-cb-slices-frame", "chrome://" + appName + "/content/overlay/hiddenwindow.xul").contentDocument.defaultView.document;
        }
    };