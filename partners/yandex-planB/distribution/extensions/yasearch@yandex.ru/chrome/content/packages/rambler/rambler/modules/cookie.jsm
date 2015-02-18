EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = ".rambler.ru";
    var AUTH_COOKIE = "rsid";
    var L_COOKIE = "rlogin";
    var D_COOKIE = "rdomain";
    var inited = null;
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    function testCookie(subject) {
        if (!subject) {
            return false;
        }
        var c = subject.QueryInterface(Components.interfaces.nsICookie2);
        var host = c.host, name = String(c.name);
        return host == HOST && (name == AUTH_COOKIE || name == L_COOKIE || name == D_COOKIE);
    }
    var observer = function (topic, data, subject) {
        var mycookie = false;
        switch (data) {
        case "cleared":
        case "batch-deleted":
        case "reload":
            mycookie = true;
            break;
        case "deleted":
            mycookie = testCookie(subject);
            break;
        case "changed":
        case "added":
            mycookie = testCookie(subject);
            break;
        default:
            return;
        }
        if (mycookie) {
            this._callback.call(this._ctx, this.isAuth());
        }
    };
    var r = {
        init: function (callback, ctx) {
            if (inited) {
                return;
            }
            this._ctx = ctx;
            this._callback = callback;
            inited = common.observerService.addObserver("cookie-changed", observer, this);
        },
        finalize: function () {
            if (inited) {
                common.observerService.removeObserver(inited);
                inited = null;
            }
            this._ctx = null;
            this._callback = null;
        },
        removeCookies: function () {
            common.http.deleteCookie(HOST, AUTH_COOKIE);
        },
        getEMail: function () {
            var login = common.http.getCookie(HOST, L_COOKIE);
            if (!login) {
                return "";
            }
            var domain = common.http.getCookie(HOST, D_COOKIE);
            return domain ? login + "@" + domain : "";
        },
        isAuth: function () {
            return common.http.getCookie(HOST, AUTH_COOKIE) && this.getEMail();
        },
        _callback: null
    };
    return r;
};
