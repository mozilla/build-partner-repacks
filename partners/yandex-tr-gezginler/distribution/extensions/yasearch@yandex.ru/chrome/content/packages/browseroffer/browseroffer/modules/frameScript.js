(function () {
    "use strict";
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    Cu.import("resource://gre/modules/Services.jsm");
    const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:browseroffer:event";
    const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:browseroffer:preferences";
    let browseroffer = {
        init: function () {
            addMessageListener(PREFERENCES_MESSAGE_NAME, this);
            let states = sendSyncMessage(PREFERENCES_MESSAGE_NAME, { type: "get-suggest-states" })[0];
            if (states) {
                this._onStateChanged(states);
            }
        },
        handleEvent: function (aEvent) {
            let target = aEvent.originalTarget;
            switch (aEvent.type) {
            case "PluginBindingAttached":
                this._onPluginBindingAttached(aEvent);
                break;
            default:
                return;
            }
        },
        _active: {
            flash: false,
            turbo: false
        },
        _sendAsyncMessage: function (aMessage, aData) {
            let data = { type: aMessage };
            if (aData) {
                Object.keys(aData).forEach(function (aKey) {
                    data[aKey] = aData[aKey];
                });
            }
            sendAsyncMessage(EVENT_MESSAGE_NAME, data);
        },
        _onPluginBindingAttached: function (aEvent) {
            let plugin = aEvent.target;
            if (!(plugin instanceof Ci.nsIObjectLoadingContent && plugin.pluginFallbackType === Ci.nsIObjectLoadingContent.PLUGIN_UNSUPPORTED)) {
                return;
            }
            if (plugin.actualType !== "application/x-shockwave-flash") {
                return;
            }
            let baseDomain;
            try {
                baseDomain = Services.eTLD.getBaseDomain(Services.io.newURI(content.document.documentURI, null, null));
            } catch (e) {
                return;
            }
            if ([
                    "ya.ru",
                    "kinopoisk.ru",
                    "auto.ru",
                    "yadi.sk"
                ].indexOf(baseDomain) > -1) {
                return;
            }
            if (/^yandex\./i.test(baseDomain)) {
                return;
            }
            this._sendAsyncMessage("flash");
        },
        _onStateChanged: function (aStates) {
            Object.keys(aStates).forEach(aServiceName => this._handleService(aServiceName, aStates[aServiceName]));
        },
        _handleService: function (aServiceName, aFlag) {
            if (typeof aFlag !== "undefined") {
                if (aFlag) {
                    this._enable(aServiceName);
                } else {
                    this._disable(aServiceName);
                }
            }
        },
        _enable: function (aServiceName) {
            let callback;
            switch (aServiceName) {
            case "flash":
                callback = () => addEventListener("PluginBindingAttached", this, true, true);
                break;
            case "turbo":
                callback = () => {
                    this._turboMonitor = {
                        init: function () {
                            let webProgress = docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);
                            webProgress.addProgressListener(this, webProgress.NOTIFY_LOCATION);
                        },
                        finalize: function () {
                            let webProgress = docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress);
                            webProgress.removeProgressListener(this);
                        },
                        onLocationChange: function (aProgress, aRequest, aURI, aFlag) {
                            if (aFlag & Ci.nsIWebProgressListener.LOCATION_CHANGE_ERROR_PAGE) {
                                this._previousLocation = null;
                                this._shownFlag = false;
                                return;
                            }
                            let sameDocumentLocationChange = aFlag & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT;
                            let newLocationURL = aURI.spec;
                            let [
                                url,
                                hash
                            ] = newLocationURL.split("#");
                            let prevURL = this._previousLocation;
                            this._previousLocation = url;
                            if (this._isWhiteListedURL(aURI)) {
                                if (!(sameDocumentLocationChange && this._shownFlag)) {
                                    this._sendShowMessage();
                                    this._shownFlag = true;
                                }
                                return;
                            }
                            if (sameDocumentLocationChange && this._shownFlag) {
                                this._sendHideMessage();
                            }
                            this._shownFlag = false;
                        },
                        _shownFlag: false,
                        _previousLocation: null,
                        get _whiteListRegexp() {
                            if (!this.__whiteListRegexp) {
                                this.__whiteListRegexp = /https?:\/\/[^\/]*(?:vk\.com|fishki\.net)\/video/i;
                            }
                            return this.__whiteListRegexp;
                        },
                        _getURIBaseDomain: function (aURI) {
                            try {
                                return Services.eTLD.getBaseDomain(aURI);
                            } catch (e) {
                                return null;
                            }
                        },
                        _sendShowMessage: function () {
                            browseroffer._sendAsyncMessage("turbo", { flag: true });
                        },
                        _sendHideMessage: function () {
                            browseroffer._sendAsyncMessage("turbo", { flag: false });
                        },
                        _shouldMonitorContentForURI: function (aURI) {
                            if (this._isInternalURL(aURI)) {
                                return false;
                            }
                            return !this._isBlackListedURL(aURI);
                        },
                        _isBlackListedURL: function (aURI) {
                            let baseDomain = this._getURIBaseDomain(aURI);
                            if (!baseDomain) {
                                return false;
                            }
                            if ([
                                    "kinopoisk.ru",
                                    "ya.ru"
                                ].indexOf(baseDomain) > -1) {
                                return true;
                            }
                            if (/^yandex\./i.test(baseDomain)) {
                                return true;
                            }
                            return false;
                        },
                        _isWhiteListedURL: function (aURI) {
                            let baseDomain = this._getURIBaseDomain(aURI);
                            if (!baseDomain) {
                                return false;
                            }
                            baseDomain = baseDomain.toLowerCase();
                            if ([
                                    "rutube.ru",
                                    "kinostok.tv",
                                    "kinogo.net"
                                ].indexOf(baseDomain) > -1) {
                                return true;
                            }
                            if (baseDomain.indexOf("youtube.") === 0) {
                                return true;
                            }
                            if (this._whiteListRegexp.test(aURI.spec)) {
                                return true;
                            }
                            return false;
                        },
                        _isInternalURL: function (aURI) {
                            return /^(chrome|about|yafd|bar)$/i.test(aURI.scheme);
                        },
                        QueryInterface: XPCOMUtils.generateQI([
                            "nsIWebProgressListener",
                            "nsISupportsWeakReference"
                        ])
                    };
                    this._turboMonitor.init();
                };
                break;
            default:
                return;
            }
            this._enableService(aServiceName, callback);
        },
        _disable: function (aServiceName) {
            let callback;
            switch (aServiceName) {
            case "flash":
                callback = () => removeEventListener("PluginBindingAttached", this, true, true);
                break;
            case "turbo":
                callback = () => {
                    if (this._turboMonitor && typeof this._turboMonitor.finalize === "function") {
                        this._turboMonitor.finalize();
                        this._turboMonitor = null;
                    }
                };
                break;
            default:
                return;
            }
            this._disableService(aServiceName, callback);
        },
        _enableService: function (aServiceName, aEnableFunction) {
            if (this._active[aServiceName]) {
                return;
            }
            try {
                aEnableFunction();
            } catch (e) {
            }
            this._active[aServiceName] = true;
        },
        _disableService: function (aServiceName, aDisableFunction) {
            if (!this._active[aServiceName]) {
                return;
            }
            try {
                aDisableFunction();
            } catch (e) {
            }
            this._active[aServiceName] = false;
        },
        receiveMessage: function (aMessage) {
            switch (aMessage.data.type) {
            case "change":
                this._onStateChanged(aMessage.data.states);
                break;
            default:
                break;
            }
        }
    };
    browseroffer.init();
}());
