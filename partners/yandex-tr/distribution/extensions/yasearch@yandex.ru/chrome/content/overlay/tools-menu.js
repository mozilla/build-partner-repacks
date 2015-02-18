(function () {
    "use strict";
    const APP_NAME = CB_APP_NAME;
    let menuOverlay = {
        init: function menuOverlay_init() {
            this._overlayController = window[APP_NAME + "OverlayController"];
            this._logger = this._overlayController._logger;
            let menuPopupId = APP_NAME + "-settings";
            this._menuPopup = document.getElementById(menuPopupId);
            let settingsItemId = APP_NAME + "-settings";
            this._callbacks[settingsItemId] = this.showSettings;
            this._bindEvents();
        },
        uninit: function menuOverlay_uninit() {
            this._unbindEvents();
            this._callbacks = Object.create(null);
            this._menuPopup = null;
            this._logger = null;
            this._overlayController = null;
        },
        handleEvent: function menuOverlay_handleEvents(event) {
            switch (event.type) {
            case "command":
                let node = event.target;
                let id = node.getAttribute("id");
                let callback = this._callbacks[id];
                if (callback) {
                    callback.call(this);
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
        showSettings: function menuOverlay_showSettings() {
            this._overlayController.application.openSettingsDialog(null, undefined, "widgets");
        },
        _bindEvents: function menuOverlay_bindEvents() {
            this._menuPopup.addEventListener("command", this, false);
        },
        _unbindEvents: function menuOverlay_unbindEvents() {
            this._menuPopup.removeEventListener("command", this, false);
        },
        _callbacks: Object.create(null),
        _overlayController: null,
        _logger: null,
        _menuPopup: null
    };
    window.addEventListener("load", menuOverlay, false);
}());
