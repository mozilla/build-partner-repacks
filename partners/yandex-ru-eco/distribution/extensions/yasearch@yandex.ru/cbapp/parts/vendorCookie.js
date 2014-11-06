"use strict";
const EXPORTED_SYMBOLS = ["vendorCookie"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const vendorCookie = {
    init: function VendorCookie_init(application) {
        this._application = application;
        this._logger = application.getLogger("VendorCookie");
        this._setCookies();
    },
    finalize: function VendorCookie_finalize(aDoCleanup) {
        this._application = null;
    },
    _setCookies: function VendorCookie__setCookies() {
        if (!this._vendorCookiesFile) {
            return;
        }
        let cookiesXML = this._getVendorCookiesXML();
        this._application.core.Lib.fileutils.removeFileSafe(this._vendorCookiesFile);
        if (this._vendorCookiesFile) {
            return;
        }
        if (!cookiesXML) {
            return;
        }
        let cookieNodes = this._application.core.Lib.xmlutils.queryXMLDoc("/cookies/domain/set/cookie", cookiesXML);
        if (!(cookieNodes && cookieNodes.length)) {
            return;
        }
        let timeNowSec = Math.ceil(Date.now() / 1000);
        const MAX_EXPIRY = Math.pow(2, 62);
        cookieNodes.forEach(function (cookie) {
            let domain = cookie.parentNode.parentNode.getAttribute("id");
            if (!domain) {
                return;
            }
            let cookieName = cookie.getAttribute("id");
            if (!cookieName) {
                return;
            }
            let maxAge = parseInt(cookie.getAttribute("max-age"), 10) || 0;
            if (maxAge < 0) {
                return;
            }
            if (cookie.getAttribute("override") !== "yes") {
                for (let existCookie of this._application.core.Lib.netutils.getCookiesFromHost(domain)) {
                    if (existCookie.name !== cookieName) {
                        continue;
                    }
                    if (!existCookie.expires && !maxAge || existCookie.expires && maxAge && timeNowSec < existCookie.expires) {
                        return;
                    }
                }
            }
            let expiry = maxAge ? timeNowSec + maxAge : MAX_EXPIRY;
            Services.cookies.add(domain, cookie.getAttribute("path") || "/", cookieName, cookie.textContent, false, cookie.getAttribute("http-only") === "yes", false, expiry);
        }, this);
    },
    get _vendorCookiesFile() {
        let file = this._application.core.extensionPathFile;
        "defaults/vendor/cookies.xml".split("/").forEach(p => file.append(p));
        return file && file.exists() ? file : null;
    },
    _getVendorCookiesXML: function VendorCookie__getVendorCookiesXML() {
        try {
            return this._application.core.Lib.fileutils.xmlDocFromFile(this._vendorCookiesFile);
        } catch (e) {
        }
        return null;
    }
};
