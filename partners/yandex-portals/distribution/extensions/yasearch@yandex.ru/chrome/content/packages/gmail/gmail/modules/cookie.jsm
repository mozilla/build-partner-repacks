EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = ".mail.google.com";
    var PATH = "/mail";
    var AUTH_COOKIE = "GX";
    var inited = null;
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    function testCookie(subject) {
        if (!subject) {
            return false;
        }
        var c = subject.QueryInterface(Components.interfaces.nsICookie2);
        return c && c.host == HOST && c.name == AUTH_COOKIE && c.path == PATH;
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
            common.http.deleteCookie(HOST, AUTH_COOKIE, PATH);
        },
        getEMail: function () {
            var c = common.http.getCookie("mail.google.com", "gmailchat");
            var e = /[a-z0-9._-]+@[a-z0-9.-]{4,}/i.exec(c);
            return e ? e[0] : "";
        },
        isAuth: function () {
            return !!common.http.getCookie(HOST, AUTH_COOKIE, null, PATH);
        },
        _callback: null
    };
    return r;
};
