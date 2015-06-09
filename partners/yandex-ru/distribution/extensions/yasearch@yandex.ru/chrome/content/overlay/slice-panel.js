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
            slice.browserReadyPromise().then(() => {
                this._loadSlice(slice);
                this._fitSize(slice);
                this._slicePanel.openPopup(anchorElement, openAt);
                this._slicePanel.onOpenPopup(slice.url);
            }, error => {
                this._logger.error(error);
            });
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
            let titleText = null;
            let direction = tipElement.ownerDocument.dir;
            while (!titleText && tipElement) {
                if (tipElement.nodeType === Node.ELEMENT_NODE) {
                    titleText = tipElement.getAttribute("title");
                }
                tipElement = tipElement.parentNode;
            }
            let tipNode = document.getElementById(CB_APP_NAME + "-slice-tooltip");
            tipNode.style.direction = direction;
            if (titleText) {
                titleText = titleText.replace(/\r\n?/g, "\n");
                tipNode.setAttribute("label", titleText);
                retVal = true;
            }
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
        }
    };
    window[CB_APP_NAME + "SlicePanelCtrl"] = new SlicePanelController();
}());
