(function () {
    "use strict";
    let {
        classes: Cc,
        interfaces: Ci
    } = Components;
    const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    function SlicePanelController() {
        this._barCore = Cc["@yandex.ru/custombarcore;" + CB_APP_NAME].getService().wrappedJSObject;
        this._application = this._barCore.application;
        this._logger = this._application.getLogger("SlicePanel");
        window.addEventListener("load", this, false);
        if (this._application.preferences.get("slices.window.enabled", false)) {
            this._setupForTesting();
        }
    }
    SlicePanelController.prototype = {
        showSlice: function SlicePanelController_showSlice(slice, anchorElement) {
            this.hide();
            this._fitSize({
                width: 0,
                height: 0
            });
            let anchorWinWidth = anchorElement.ownerDocument.defaultView.innerWidth;
            let ab = anchorElement.getBoundingClientRect();
            let openAt = ab.left >= anchorWinWidth - ab.right ? "after_end" : "after_start";
            this._slicePanel.setAttribute("noautohide", slice.noautohide);
            this._slicePanel.setAttribute("yaPos", openAt);
            this._barCore.Lib.async.nextTick(function () {
                this._loadSlice(slice);
                this._fitSize(slice);
                this._slicePanel.openPopup(anchorElement, openAt);
                this._slicePanel.onOpenPopup(slice.url);
            }.bind(this));
        },
        hide: function SlicePanelController_hide() {
            if (this._slicePanel && "hidePopup" in this._slicePanel) {
                this._slicePanel.hidePopup();
            }
        },
        sizeTo: function SlicePanelController_sizeTo(width, height) {
            this._slicePanel.sizeTo(width, height);
        },
        onHide: function SlicePanelController_onHide() {
            let prevSlice = this._unloadSlice();
            if (prevSlice) {
                prevSlice.onHidden();
            }
            let panel = this._slicePanel;
            panel.setAttribute("width", "");
            panel.setAttribute("height", "");
        },
        handleEvent: function SlicePanelController_handleEvent(event) {
            switch (event.type) {
            case "load":
                event.currentTarget.removeEventListener("load", this, false);
                this._slicePanel.setAttribute("yaOSName", this._barCore.Lib.sysutils.platformInfo.os.name);
                this._slicePanel.openPopup();
                this._slicePanel.hidePopup();
                break;
            }
        },
        fillInTooltip: function SlicePanelController_fillInTooltip(tipElement) {
            let retVal = false;
            if (!tipElement || !tipElement.ownerDocument || tipElement.ownerDocument.compareDocumentPosition(tipElement) & document.DOCUMENT_POSITION_DISCONNECTED) {
                return retVal;
            }
            const XLinkNS = "http://www.w3.org/1999/xlink";
            const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
            let titleText = null;
            let XLinkTitleText = null;
            let SVGTitleText = null;
            let lookingForSVGTitle = true;
            let direction = tipElement.ownerDocument.dir;
            if ((tipElement instanceof HTMLInputElement || tipElement instanceof HTMLTextAreaElement || tipElement instanceof HTMLSelectElement || tipElement instanceof HTMLButtonElement) && !tipElement.hasAttribute("title") && (!tipElement.form || !tipElement.form.noValidate)) {
                titleText = tipElement.validationMessage;
            }
            while (!titleText && !XLinkTitleText && !SVGTitleText && tipElement) {
                if (tipElement.nodeType == Node.ELEMENT_NODE && tipElement.namespaceURI != XULNS) {
                    titleText = tipElement.getAttribute("title");
                    if ((tipElement instanceof HTMLAnchorElement || tipElement instanceof HTMLAreaElement || tipElement instanceof HTMLLinkElement || tipElement instanceof SVGAElement) && tipElement.href) {
                        XLinkTitleText = tipElement.getAttributeNS(XLinkNS, "title");
                    }
                    if (lookingForSVGTitle && (!(tipElement instanceof SVGElement) || tipElement.parentNode.nodeType == Node.DOCUMENT_NODE)) {
                        lookingForSVGTitle = false;
                    }
                    let defView = tipElement.ownerDocument.defaultView;
                    if (!defView) {
                        return retVal;
                    }
                    direction = defView.getComputedStyle(tipElement, "").getPropertyValue("direction");
                }
                tipElement = tipElement.parentNode;
            }
            let tipNode = document.getElementById(CB_APP_NAME + "-slice-tooltip");
            tipNode.style.direction = direction;
            [
                titleText,
                XLinkTitleText,
                SVGTitleText
            ].forEach(function (t) {
                if (t && /\S/.test(t)) {
                    t = t.replace(/\r\n?/g, "\n");
                    tipNode.setAttribute("label", t);
                    retVal = true;
                }
            });
            return retVal;
        },
        _currentSlice: null,
        get _slicePanel() {
            return document.getElementById(CB_APP_NAME + "-slice-panel");
        },
        get _browser() {
            return document.getElementById(CB_APP_NAME + "-slice-browser");
        },
        _loadSlice: function SlicePanelController__loadSlice(slice) {
            if (this._currentSlice === slice) {
                return;
            }
            this._unloadSlice();
            slice.browser.swapDocShells(this._browser);
            this._currentSlice = slice;
        },
        _unloadSlice: function SlicePanelController__unloadSlice() {
            if (!this._currentSlice) {
                return null;
            }
            let prevSlice = this._currentSlice;
            this._currentSlice = null;
            prevSlice.browser.swapDocShells(this._browser);
            return prevSlice;
        },
        _fitSize: function SlicePanelController__fitSize(slice) {
            if (!(slice.width === -1 || slice.height === -1)) {
                this._slicePanel.sizeTo(slice.width, slice.height);
            }
        },
        _setupForTesting: function SlicePanelController__setupForTesting() {
            this.__defineGetter__("_slicePanel", function _slicePanel() {
                let that = this;
                let slicePanel_methodStub = function slicePanel_methodStub() {
                };
                return {
                    setAttribute: slicePanel_methodStub,
                    openPopup: slicePanel_methodStub,
                    onOpenPopup: slicePanel_methodStub,
                    sizeTo: function slicePanel_sizeTo(width, height) {
                        if (that._dialogForTestingPurposes) {
                            that._dialogForTestingPurposes.resizeTo(width, height);
                        }
                    },
                    hidePopup: function slicePanel_hidePopup() {
                        return that.onHide();
                    }
                };
            });
            this._dialogForTestingPurposes = null;
            this.__defineGetter__("_browser", function _browser() {
                if (!this._dialogForTestingPurposes) {
                    const popupChromeURL = "chrome://" + this._application.name + "/content/overlay/slice-panel-test.xul";
                    let winFeatures = "chrome,resizable,centerscreen,width=1,height=1";
                    let loaded = false;
                    let args = {
                        slicePanelCtrl: this,
                        callback: function () {
                            return loaded = true;
                        }
                    };
                    args.wrappedJSObject = args;
                    this._dialogForTestingPurposes = window.openDialog(popupChromeURL, null, winFeatures, args);
                    this._application.core.Lib.sysutils.sleep(5000, function () {
                        return !loaded;
                    });
                }
                return this._dialogForTestingPurposes.document.getElementById(CB_APP_NAME + "-slice-browser");
            });
            let originalUnloadSlice = this._unloadSlice;
            this._unloadSlice = function _unloadSlice() {
                let res = originalUnloadSlice.apply(this, null);
                if (this._dialogForTestingPurposes) {
                    this._dialogForTestingPurposes.close();
                    this._dialogForTestingPurposes = null;
                }
                return res;
            };
        }
    };
    window[CB_APP_NAME + "SlicePanelCtrl"] = new SlicePanelController();
}());
