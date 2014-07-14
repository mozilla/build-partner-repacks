"use strict";
const EXPORTED_SYMBOLS = ["safeBrowsing"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
const safeBrowsing = {
        init: function safeBrowsing_init(aApplication) {
            this._application = aApplication;
            this._logger = this._application.getLogger("SafeBrowsing");
            Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this.CLASS_ID, this.CLASS_DESCRIPTION, "@mozilla.org/network/protocol/about;1?what=blocked", this);
        },
        finalize: function Defender_finalize(aDoCleanup) {
            Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this.CLASS_ID, this);
            this._logger = null;
            this._application = null;
        },
        CLASS_ID: Components.ID("{1f22ce1e-c5a4-11e3-9d3a-10ddb1b80741}"),
        CLASS_DESCRIPTION: "Yandex Elements about:blocked page protocol handler",
        createInstance: function safeBrowsing_createInstance(outer, iid) {
            if (outer !== null)
                throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
        },
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIFactory,
            Ci.nsIAboutModule
        ]),
        getURIFlags: function safeBrowsing_getURIFlags() {
            return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT;
        },
        get _appProtocol() {
            delete this._appProtocol;
            var appConfig = this._application.core.CONFIG.APP;
            return this._appProtocol = appConfig.PROTOCOL || appConfig.NAME;
        },
        newChannel: function safeBrowsing_newChannel(aURI) {
            var url = "chrome://browser/content/blockedSite.xhtml";
            var blockedURL = aURI.spec;
            if (/[&?]e=(malwareBlocked|phishingBlocked)(&|$)/.test(blockedURL)) {
                url = "chrome://" + this._appProtocol + "/content/safebrowsing/index.xhtml";
            }
            var channel = Services.io.newChannel(url, null, null);
            channel.originalURI = aURI;
            return channel;
        }
    };
