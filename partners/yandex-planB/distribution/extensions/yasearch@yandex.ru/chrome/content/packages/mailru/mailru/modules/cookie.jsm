EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = ".mail.ru";
    var AUTH_COOKIE = "Mpop";
    var inited = null;
    function log(str) {
        common.log("[CookieObserver]: " + str);
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
            logout = true;
            break;
        case "deleted":
            deletedCookie = subject.QueryInterface(nsICookie2);
            if (deletedCookie && deletedCookie.host == HOST && deletedCookie.name == AUTH_COOKIE) {
                logout = true;
            }
            break;
        case "changed":
            break;
        default:
            return;
        }
        if (logout && !this.isAuth()) {
            this.onlogout();
        }
    };
    var r = {
        init: function (onlogout) {
            if (inited) {
                return;
            }
            this.onlogout = onlogout;
            inited = common.observerService.addObserver("cookie-changed", observer, this);
        },
        finalize: function () {
            if (inited) {
                common.observerService.removeObserver(inited);
                inited = null;
            }
        },
        removeCookies: function () {
            common.http.deleteCookie(HOST, AUTH_COOKIE);
        },
        isAuth: function () {
            return !!common.http.getCookie(HOST, AUTH_COOKIE);
        },
        onlogout: null
    };
    return r;
};
