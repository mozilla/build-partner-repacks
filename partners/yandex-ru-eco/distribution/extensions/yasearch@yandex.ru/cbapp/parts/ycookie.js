"use strict";
const EXPORTED_SYMBOLS = ["yCookie"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const yCookie = {
    init: function YCookie_init(application) {
        this._application = application;
        this._logger = application.getLogger("YCookie");
        let cookieFieldName = application.core.CONFIG.APP.COOKIE;
        let cookieFieldValue = application.addonManager.addonVersion;
        this.setValue("ys", cookieFieldName, cookieFieldValue);
    },
    finalize: function YCookie_finalize(aDoCleanup) {
        this._application = null;
    },
    TRUSTED_DOMAINS: [
        ".yandex.ru",
        ".yandex.kz",
        ".yandex.ua",
        ".yandex.by",
        ".yandex.net",
        ".yandex.com",
        ".yandex.com.tr",
        ".ya.ru",
        ".moikrug.ru"
    ],
    getAnyValue: function YCookie_getAnyValue(aFieldName) {
        let yCookieValue = this.getYandexCookie("ys", aFieldName);
        if (yCookieValue === null) {
            yCookieValue = this.getYandexCookie("yp", aFieldName);
        }
        return yCookieValue;
    },
    getValue: function YCookie_getValue(aCookieName, aFieldName, aDomain) {
        let yCookieValue = this._getYCookie(aCookieName, aDomain);
        if (yCookieValue) {
            let reg;
            switch (aCookieName) {
            case "ys":
                reg = new RegExp("(?:^|#)" + this._application.core.Lib.strutils.escapeRE(aFieldName) + "\\.([^#]+)");
                break;
            case "yp":
                reg = new RegExp("(?:^|#)(?:\\d+)\\." + this._application.core.Lib.strutils.escapeRE(aFieldName) + "\\.([^#]+)");
                break;
            }
            let match = yCookieValue.match(reg);
            if (match) {
                return decodeURIComponent(match[1]);
            }
        }
        return null;
    },
    setValue: function YCookie_setValue(aCookieName, aFieldName, aFieldValue, aFieldExpire) {
        this._setYCookie(aCookieName, aFieldName, aFieldValue, aFieldExpire);
    },
    _getYCookie: function YCookie__getYCookie(aCookieName, aDomain) {
        let timeNowSec = Math.ceil(Date.now() / 1000);
        let domain = aDomain || ".yandex.ru";
        for (let existCookie of this._application.core.Lib.netutils.getCookiesFromHost(domain)) {
            if (existCookie.name !== aCookieName) {
                continue;
            }
            if (!existCookie.isSession && timeNowSec < existCookie.expiry) {
                continue;
            }
            return existCookie.value;
        }
        return null;
    },
    _setYCookie: function YCookie__setYCookie(aCookieName, aFieldName, aFieldValue, aFieldExpire) {
        for (let domain of this.TRUSTED_DOMAINS) {
            this._setYCookieOnDomain(domain, aCookieName, aFieldName, aFieldValue, aFieldExpire);
        }
    },
    _setYCookieOnDomain: function YCookie__setYCookieOnDomain(aDomain, aCookieName, aFieldName, aFieldValue, aFieldExpire) {
        let yCookieValue = this._getYCookie(aCookieName, aDomain);
        let newCookieValue = this._parseAndSetFieldValue(yCookieValue, aFieldName, aFieldValue, aFieldExpire);
        const MAX_EXPIRY = Math.pow(2, 62);
        if (newCookieValue.length) {
            Services.cookies.add(aDomain, "/", aCookieName, newCookieValue, false, false, true, MAX_EXPIRY);
        } else {
            Services.cookies.remove(aDomain, aCookieName, "/", false);
        }
    },
    _parseAndSetFieldValue: function YCookie__parseAndSetFieldValue(aCookieValue, aFieldName, aFieldValue, aFieldExpire) {
        let ySubCookies = (aCookieValue || "").split("#");
        let found = false;
        for (let i = ySubCookies.length; i--;) {
            if (ySubCookies[i].indexOf(aFieldName + ".") === 0) {
                found = true;
                ySubCookies[i] = aFieldValue === null ? null : aFieldName + "." + aFieldValue;
                break;
            }
        }
        if (!found && aFieldValue) {
            ySubCookies.push(aFieldName + "." + aFieldValue);
        }
        return ySubCookies.filter(Boolean).join("#");
    }
};
