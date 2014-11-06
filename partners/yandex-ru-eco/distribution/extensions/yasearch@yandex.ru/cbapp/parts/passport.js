"use strict";
const EXPORTED_SYMBOLS = ["passport"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const passport = {
    init: function passport_init(aApplication) {
        this._application = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._logger = aApplication.getLogger("Passport");
        this._alertedHostsContainer = new sysutils.DataContainer({ expirationTime: 24 * 60 * 60 * 1000 });
        Services.obs.addObserver(this, "http-on-examine-response", false);
    },
    finalize: function passport_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, "http-on-examine-response");
        this._alertedHostsContainer.finalize();
        this._alertedHostsContainer = null;
    },
    observe: function passport_observe(subject, topic, data) {
        if (topic !== "http-on-examine-response") {
            return;
        }
        if (!this._application.statistics.alwaysSendUsageStat) {
            return;
        }
        let channel = subject;
        let host;
        try {
            channel.QueryInterface(Ci.nsIHttpChannel);
            host = channel.URI.host;
        } catch (e) {
        }
        if (!host) {
            return;
        }
        if (this._alertedHostsContainer.has(host)) {
            return;
        }
        if (!this._isYandexHost(host)) {
            return;
        }
        let setCookieString = "";
        try {
            setCookieString = channel.getResponseHeader("Set-Cookie");
        } catch (e) {
        }
        if (!setCookieString || !/(Session_id|sessionid2)=\s*[^;\s]+\s*/.test(setCookieString)) {
            return;
        }
        let cookiesHash = Object.create(null);
        setCookieString.split(/[\r\n]+/).forEach(function (cookie) {
            if (/^Session_id=\s*[^;\s]+\s*/.test(cookie)) {
                cookiesHash.Session_id = [];
                if (!/;\s*HttpOnly\s*(;|$)/i.test(cookie)) {
                    cookiesHash.Session_id.push("httpOnly");
                }
            } else if (/^sessionid2=\s*[^;\s]+\s*/.test(cookie)) {
                cookiesHash.sessionid2 = [];
                if (!/;\s*HttpOnly\s*(;|$)/i.test(cookie)) {
                    cookiesHash.sessionid2.push("httpOnly");
                }
                if (!/;\s*Secure\s*(;|$)/i.test(cookie)) {
                    cookiesHash.sessionid2.push("secure");
                }
            }
        });
        if ("sessionid2" in cookiesHash && channel.URI.scheme !== "https") {
            cookiesHash.sessionid2.push("unexpected");
        }
        if (/(^|\.)yandex\.net$/i.test(host)) {
            Object.keys(cookiesHash).forEach(function (key) {
                cookiesHash[key].push("unexpected");
            });
        }
        Object.keys(cookiesHash).forEach(function (key) {
            if (!cookiesHash[key].length) {
                delete cookiesHash[key];
            }
        });
        if (!Object.keys(cookiesHash).length) {
            return;
        }
        this._alertedHostsContainer.set(host, true);
        let spec = channel.URI.spec.split(/[#?]/)[0].replace(/(https?:\/\/)[^@\/]+@/, "$1");
        let statURL = "http://clck.yandex.ru/counter/dtype=wrcookies/" + "data=" + encodeURIComponent(JSON.stringify(cookiesHash)) + "/*" + spec;
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.open("GET", statURL, true);
        request.send(null);
    },
    _isYandexHost: function passport__isYandexHost(host) {
        return host && /(^|\.)(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|moikrug|kinopoisk|yandex\-team)\.ru)$/i.test(host);
    },
    _alertedHostsContainer: null
};
