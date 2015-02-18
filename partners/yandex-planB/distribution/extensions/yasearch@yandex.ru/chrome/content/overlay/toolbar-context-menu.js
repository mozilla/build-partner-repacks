(function () {
    "use strict";
    const APP_NAME = CB_APP_NAME;
    let contextMenuOverlay = {
        init: function cxtMenuOverlay_init() {
            this._overlayController = window[APP_NAME + "OverlayController"];
            this._logger = this._overlayController._logger;
            let navToolboxId = "navigator-toolbox";
            let menuItemId = APP_NAME + "-context-menu-settings";
            let menuPopupId = "toolbar-context-menu";
            this._navToolbox = document.getElementById(navToolboxId);
            if (!this._navToolbox) {
                this._logger.error("Could not find toolbar #" + navToolboxId);
                return;
            }
            this._menuItem = document.getElementById(menuItemId);
            if (!this._menuItem) {
                this._logger.error("Could not find menuitem #" + menuItemId);
                return;
            }
            this._menuItemLabel = this._menuItem.getAttribute("label");
            this._menuPopup = document.getElementById(menuPopupId);
            if (!this._menuPopup) {
                this._logger.error("Could not find menupopup #" + menuPopupId);
                return;
            }
            this._bindEvents();
        },
        uninit: function cxtMenuOverlay_uninit() {
            this._unbindEvents();
            this._navToolbox = null;
            this._menuItem = null;
            this._menuItemLabel = null;
            this._menuPopup = null;
            this._overlayController = null;
            this._logger = null;
        },
        show: function cxtMenuOverlay_show() {
            this._menuItem.hidden = false;
        },
        hide: function cxtMenuOverlay_hide() {
            this._menuItem.hidden = true;
            this._menuItem.setAttribute("label", this._menuItemLabel);
            this._menuItem.removeAttribute("data-cb-component-id");
        },
        handleEvent: function cxtMenuOverlay_handleEvent(event) {
            switch (event.type) {
            case "popupshowing":
                if (!this.triggerNode) {
                    return;
                }
                this._generateLabel();
                this.show();
                break;
            case "popuphiding":
                this.hide();
                break;
            case "command":
                let componentId = this._menuItem.getAttribute("data-cb-component-id");
                if (componentId) {
                    this._overlayController.widgetHost.setupWidget(componentId);
                }
                break;
            case "load":
                window.removeEventListener("load", this, false);
                window.addEventListener("unload", this, false);
                this.init();
                break;
            case "unload":
                window.removeEventListener("unload", this, false);
                this.uninit();
                break;
            default:
                break;
            }
        },
        _bindEvents: function cxtMenuOverlay__bindEvents() {
            this._menuItem.addEventListener("command", this, false);
            this._menuPopup.addEventListener("popupshowing", this, false);
            this._menuPopup.addEventListener("popuphiding", this, false);
        },
        _unbindEvents: function cxtMenuOverlay__unbindEvents() {
            if (!this._menuPopup) {
                return;
            }
            this._menuItem.removeEventListener("command", this, false);
            this._menuPopup.removeEventListener("popupshowing", this, false);
            this._menuPopup.removeEventListener("popuphiding", this, false);
        },
        _generateLabel: function cxtMenuOverlay__generateLabel() {
            let triggerNode = this.triggerNode;
            if (!triggerNode) {
                return;
            }
            let componentId = triggerNode.getAttribute("id");
            let protoId = triggerNode.getAttribute("cb-proto-id");
            let widgetLibrary = this._overlayController.application.widgetLibrary;
            let componentInfo = null;
            if (widgetLibrary.isKnownWidget(protoId)) {
                componentInfo = widgetLibrary.getWidgetInfo(protoId);
            } else if (widgetLibrary.isKnownPlugin(protoId)) {
                componentInfo = widgetLibrary.getPluginInfo(protoId);
                componentId = protoId;
            }
            let labelTemplate = "%(label) (%(name))";
            let label = labelTemplate.replace("%(label)", this._menuItemLabel).replace("%(name)", componentInfo && componentInfo.name || "");
            this._menuItem.setAttribute("label", label);
            this._menuItem.setAttribute("data-cb-component-id", componentId);
        },
        get triggerNode() {
            let triggerNode = this._menuPopup.triggerNode;
            let cbApp = triggerNode.getAttribute("cb-app");
            while (cbApp !== APP_NAME && triggerNode && triggerNode.localName != "toolbar") {
                triggerNode = triggerNode.parentNode;
                cbApp = triggerNode.getAttribute("cb-app");
            }
            if (cbApp === APP_NAME && triggerNode.localName != "toolbar") {
                return triggerNode;
            }
            return null;
        },
        _overlayController: null,
        _logger: null,
        _navToolbox: null,
        _menuItem: null,
        _menuItemLabel: null,
        _menuPopup: null
    };
    window.addEventListener("load", contextMenuOverlay, false);
}());
