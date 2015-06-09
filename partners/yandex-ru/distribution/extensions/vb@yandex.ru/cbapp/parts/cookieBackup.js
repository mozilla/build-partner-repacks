"use strict";
const EXPORTED_SYMBOLS = ["cookieBackup"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const DOMAIN = ".vb.yandex.addons";
const KEY_VALUE_SEPARATOR = ".";
const ITEMS_SEPARATOR = "#";
const THUMB_COOKIE_NAME_PREFIX = "thumb";
const SETTINGS_COOKIE_NAME = "settings";
const MAX_COOKIE_SIZE = 5000;
const MAX_TOTAL_COOKIE_SIZE_PER_DOMAIN = 10000;
const EXPIRE_PERIOD = 3 * 24 * 60 * 60;
const cookieBackup = {
    init: function (application) {
        this._application = application;
        this._logger = application.getLogger("CookieBackup");
    },
    finalize: function (doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    save: function () {
        this.clear();
        let cookies = this._makeThumbCookies();
        cookies[SETTINGS_COOKIE_NAME] = this._getSettingsCookieValue();
        this._saveCookies(cookies);
    },
    restore: function () {
        let cookies = this.getAllCookies();
        if (!cookies.length) {
            this._logger.debug("No cookies, nothing to restore.");
            return false;
        }
        this._logger.debug("Restoring...");
        this._restoreThumbs(cookies);
        this._restoreSettings(cookies);
        return true;
    },
    clear: function () {
        let cookies = this.getAllCookies();
        if (!cookies.length) {
            return;
        }
        for (let cookie of cookies) {
            Services.cookies.remove(cookie.host, cookie.name, cookie.path, false);
        }
        this._logger.debug("Clear");
    },
    testView: function () {
        let message = ["All cookies:"];
        for (let cookie of this.getAllCookies()) {
            message.push([
                cookie.host,
                cookie.name,
                cookie.value
            ]);
        }
        message = message.join("\n");
        this._logger.debug(message);
        return message;
    },
    getAllCookies: function () {
        let timeNow = parseInt(Date.now() / 1000, 10);
        return this._application.core.Lib.netutils.getCookiesFromHost(DOMAIN).filter(cookie => timeNow < cookie.expires);
    },
    _getThumbCookieValue: function (data) {
        return this._makeCookieValue({
            pin: data.pinned ? 1 : 0,
            visits: data.visits,
            type: data.statParam.replace("thumb", ""),
            url: data.url,
            title: data.title
        });
    },
    _makeCookieValue: function (obj) {
        let makeValue = () => {
            return Object.keys(obj).map(key => {
                return key + KEY_VALUE_SEPARATOR + encodeURIComponent(obj[key]);
            }).join(ITEMS_SEPARATOR);
        };
        let value = makeValue();
        if (value.length > MAX_COOKIE_SIZE) {
            obj.title = "";
            value = makeValue();
        }
        return value;
    },
    _getSettingsCookieValue: function () {
        let displayMode;
        switch (this._application.preferences.get("ftabs.thumbStyle")) {
        case 2:
            displayMode = "logos";
            break;
        case 3:
            displayMode = "screenshots";
            break;
        default:
            displayMode = "titles";
            break;
        }
        return this._makeCookieValue({ displayMode: displayMode });
    },
    _makeThumbCookies: function () {
        let cookies = Object.create(null);
        this._application.internalStructure.iterate({}, (item, index) => {
            let cookieName = THUMB_COOKIE_NAME_PREFIX + index;
            cookies[cookieName] = this._getThumbCookieValue(item);
        });
        return cookies;
    },
    _parseCookieValue: function (str) {
        str = str || "";
        let parts = str.split(ITEMS_SEPARATOR);
        let result = Object.create(null);
        parts.forEach(function (part) {
            let firstSeparatorPosition = part.indexOf(KEY_VALUE_SEPARATOR);
            if (firstSeparatorPosition) {
                let key = part.substring(0, firstSeparatorPosition);
                result[key] = decodeURIComponent(part.substring(firstSeparatorPosition + KEY_VALUE_SEPARATOR.length));
            }
        });
        return result;
    },
    _saveCookies: function (cookies) {
        let expiry = Math.round(Date.now() / 1000) + EXPIRE_PERIOD;
        let savedBytesForDomain = 0;
        let domainIndex = 1;
        Object.keys(cookies).forEach(key => {
            let value = cookies[key];
            if (value.length > MAX_COOKIE_SIZE) {
                return;
            }
            savedBytesForDomain += value.length;
            if (savedBytesForDomain > MAX_TOTAL_COOKIE_SIZE_PER_DOMAIN) {
                domainIndex++;
                savedBytesForDomain = value.length;
            }
            Services.cookies.add("backup" + domainIndex + DOMAIN, "/", key, value, false, false, false, expiry);
        });
        this._logger.debug("Saved " + Object.keys(cookies).length + " cookies on " + domainIndex + " domain(s)");
    },
    _restoreThumbs: function (cookies) {
        let thumbCookies = cookies.filter(function (cookie) {
            return cookie.name.indexOf(THUMB_COOKIE_NAME_PREFIX) === 0;
        });
        thumbCookies.sort(function (a, b) {
            let indexA = parseInt(a.name.replace(THUMB_COOKIE_NAME_PREFIX, ""), 10);
            let indexB = parseInt(b.name.replace(THUMB_COOKIE_NAME_PREFIX, ""), 10);
            return indexA - indexB;
        });
        let newStructure = Object.create(null);
        thumbCookies.forEach((cookie, index) => {
            let parsedValue = this._parseCookieValue(cookie.value);
            newStructure[index] = {
                pinned: Boolean(parseInt(parsedValue.pin, 10)),
                pickupInfo: { visits: parseInt(parsedValue.visits, 10) || 0 },
                statParam: (parsedValue.type || "auto") + "thumb",
                url: parsedValue.url || "",
                title: parsedValue.title || "",
                sync: {}
            };
            this._logger.debug("Restored thumb #" + index + ", url: " + parsedValue.url);
        });
        const REGULAR_DIMENSION = this._application.layout.REGULAR_DIMENSION;
        let maxAvailableIncreased = Object.keys(newStructure).length > REGULAR_DIMENSION * REGULAR_DIMENSION;
        this._application.preferences.set("ftabs.maxAvailableIncreased", maxAvailableIncreased);
        this._application.internalStructure.overwriteWithRawStructure(newStructure);
    },
    _restoreSettings: function (cookies) {
        let settingsCookie = cookies.filter(function (cookie) {
            return cookie.name === SETTINGS_COOKIE_NAME;
        })[0];
        if (!settingsCookie) {
            return;
        }
        let displayMode = this._parseCookieValue(settingsCookie.value).displayMode;
        let thumbStyle;
        switch (displayMode) {
        case "screenshots":
            thumbStyle = 3;
            break;
        case "logos":
            thumbStyle = 2;
            break;
        case "titles":
            thumbStyle = 1;
            break;
        }
        if (thumbStyle) {
            this._application.preferences.set("ftabs.thumbStyle", thumbStyle);
            this._logger.debug("Restored setting thumbs style: " + displayMode);
        }
    }
};
