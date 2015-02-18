EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    var HOST = ".facebook.com";
    var started = null;
    function testCookie(cookie) {
        if (!cookie) {
            return false;
        }
        var host = cookie.host, name = String(cookie.name);
        return host == HOST && (name == "xs" || name == "c_user");
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
        getUserId: function () {
            return common.http.getCookie(HOST, "c_user", /\d/);
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
            common.http.deleteCookie(HOST, "c_user");
            common.http.deleteCookie(HOST, "xs");
        },
        isAuth: function () {
            var ret = common.http.getCookie(HOST, "xs", /./) && common.http.getCookie(HOST, "c_user", /\d/);
            log("isAuth = " + ret);
            return ret;
        }
    };
    return r;
};
