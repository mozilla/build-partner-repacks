EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = ".twitter.com";
    var AUTH_COOKIE = "auth_token";
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    var started = null;
    function testCookie(cookie) {
        if (!cookie) {
            return false;
        }
        var host = cookie.host, name = String(cookie.name);
        return host == HOST && name == AUTH_COOKIE;
    }
    var observer = function (topic, data, subject) {
        var logout = false;
        var nsICookie2 = Components.interfaces.nsICookie2;
        switch (data) {
        case "cleared":
            logout = true;
            break;
        case "batch-deleted":
            logout = true;
            break;
        case "deleted":
            logout = testCookie(subject.QueryInterface(nsICookie2));
            break;
        case "changed":
            logout = testCookie(subject.QueryInterface(nsICookie2));
            break;
        default:
            return;
        }
        if (logout && !this.isAuth()) {
            this._onlogout();
        }
    };
    var r = {
        _onlogout: null,
        init: function (onlogout) {
            this._onlogout = onlogout;
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
            this._onlogout = null;
        },
        removeCookies: function () {
            common.http.deleteCookie(HOST, AUTH_COOKIE);
        },
        isAuth: function () {
            var ret = common.http.getCookie(HOST, AUTH_COOKIE);
            log("isAuth = " + ret);
            return ret;
        }
    };
    return r;
};
