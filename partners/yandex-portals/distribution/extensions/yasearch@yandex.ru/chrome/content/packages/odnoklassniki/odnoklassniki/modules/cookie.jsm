EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = ".odnoklassniki.ru";
    var HOST_S = ".ok.ru";
    var AUTH_COOKIE1 = "JSESSIONID";
    var AUTH_COOKIE2 = "AUTHCODE";
    var started = null;
    function testCookie(cook) {
        return cook && (cook.host == HOST || cook.host == HOST_S) && (cook.name == AUTH_COOKIE1 || cook.name == AUTH_COOKIE2);
    }
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    function logObj(obj, prefix) {
        common.logObj(obj, "[CookieObserver]: " + (prefix || ""));
    }
    var observer = function (topic, data, subject) {
        var logout = false;
        var deletedCookie, changedCookie;
        var nsICookie2 = Components.interfaces.nsICookie2;
        switch (data) {
        case "cleared":
            logout = true;
            break;
        case "batch-deleted":
        case "reload":
            logout = true;
            break;
        case "deleted":
            deletedCookie = subject.QueryInterface(nsICookie2);
            if (testCookie(deletedCookie)) {
                logout = true;
            }
            break;
        case "changed":
            changedCookie = subject.QueryInterface(nsICookie2);
            if (testCookie(changedCookie)) {
                logout = true;
            }
            break;
        default:
            return;
        }
        if (logout && !this.isAuth(true)) {
            this.onlogout();
        }
    };
    return {
        init: function (onlogout) {
            this.onlogout = onlogout;
        },
        start: function () {
            if (!started) {
                started = common.observerService.addObserver("cookie-changed", observer, this);
            }
        },
        stop: function () {
            if (started) {
                common.observerService.removeObserver(started);
                started = null;
            }
        },
        finalize: function () {
            this.stop();
            this.onlogout = null;
        },
        removeCookies: function () {
            this.stop();
            common.http.deleteCookie(HOST, AUTH_COOKIE1);
            common.http.deleteCookie(HOST, AUTH_COOKIE2);
            common.http.deleteCookie(HOST_S, AUTH_COOKIE1);
            common.http.deleteCookie(HOST_S, AUTH_COOKIE2);
        },
        _syncAuth: function (a) {
            if (!a || a.auth && a.authS) {
                return;
            }
            log("_syncAuth");
            var data = a.auth || a.authS;
            var targetHost = a.authS ? HOST : HOST_S;
            log("_syncAuth: targetHost = " + targetHost);
            common.http.GET({
                url: "http://" + targetHost.replace(/^./, "") + "/dk",
                params: {
                    "st.cmd": "updateAuthCode",
                    nc: Date.now(),
                    "st.auth": data.aut,
                    "st.js": data.sid
                }
            });
        },
        syncAuth: function () {
            log("syncAuth");
            this.isAuth();
        },
        isAuth: function (notSync) {
            var sid = common.http.getCookie(HOST, AUTH_COOKIE1), sid_s = common.http.getCookie(HOST_S, AUTH_COOKIE1), aut = common.http.getCookie(HOST, AUTH_COOKIE2), aut_s = common.http.getCookie(HOST_S, AUTH_COOKIE2);
            var auth = !!(sid || aut);
            var authS = !!(sid_s || aut_s);
            var ret = (auth || authS) && {
                auth: auth && {
                    sid: sid,
                    aut: aut
                },
                authS: authS && {
                    sid: sid_s,
                    aut: aut_s
                }
            };
            logObj(ret, "isAuth(): ");
            if (!notSync) {
                this._syncAuth(ret);
            }
            return ret;
        },
        onlogout: null
    };
};
