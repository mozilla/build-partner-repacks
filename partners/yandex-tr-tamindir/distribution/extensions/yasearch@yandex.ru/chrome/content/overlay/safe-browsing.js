(function () {
    "use strict";
    let safeBrowsing = {
        init: function safeBrowsing_init() {
            gBrowser.addEventListener("click", this, false);
            gBrowser.addEventListener("DOMContentLoaded", this, false);
        },
        uninit: function safeBrowsing_uninit() {
            gBrowser.removeEventListener("click", this, false);
            gBrowser.removeEventListener("DOMContentLoaded", this, false);
        },
        handleEvent: function safeBrowsing_handleEvent(event) {
            switch (event.type) {
            case "DOMContentLoaded":
                this._handleBrowserEvent(event);
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
            case "click":
                if (event.button !== 2) {
                    this._handleBrowserEvent(event);
                }
                break;
            }
        },
        _handleBrowserEvent: function safeBrowsing__handleBrowserEvent(event) {
            let actionType;
            let ownerDoc;
            let originalTarget = event.originalTarget;
            if (event.type === "DOMContentLoaded") {
                actionType = "show";
                ownerDoc = originalTarget;
            } else {
                ownerDoc = originalTarget.ownerDocument;
            }
            if (!ownerDoc || ownerDoc.documentURI.indexOf("about:blocked") !== 0) {
                return;
            }
            if (!this._isYandexSBPrefEnabled()) {
                return;
            }
            if (!actionType) {
                let elementId = originalTarget.getAttribute("id");
                switch (elementId) {
                case "getMeOutButton":
                    actionType = "agree";
                    break;
                case "reportButton":
                    actionType = "info";
                    break;
                case "ignoreWarningButton":
                    actionType = "ignor";
                    break;
                }
            }
            if (!actionType) {
                return;
            }
            this._logAction(actionType);
        },
        _logAction: function safeBrowsing__logAction(actionType) {
            this._application.statistics.logClickStatistics({
                cid: 72308,
                path: "fx." + actionType
            });
        },
        _isYandexSBPrefEnabled: function safeBrowsing__isYandexSBPrefEnabled() {
            let reportURL = "";
            try {
                reportURL = Services.prefs.getCharPref("browser.safebrowsing.malware.reportURL");
            } catch (e) {
            }
            return /^https?:\/\/yandex\.[^/]+\/infected/.test(reportURL);
        },
        get _application() {
            return Cc["@yandex.ru/custombarcore;" + CB_APP_NAME].getService().wrappedJSObject.application;
        }
    };
    window.addEventListener("load", safeBrowsing, false);
}());
