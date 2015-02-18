EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var started = null;
    var rxSid = /^remixsid\d*$/;
    function log(str) {
        common.log("[CookieObserver]: " + str);
    }
    var cookMap = {
        ".login.vk.com #### l": true,
        ".login.vk.com #### p": true
    };
    function testCookie(cookie) {
        if (!cookie) {
            return false;
        }
        var host = cookie.host, name = String(cookie.name);
        return cookMap[host + " #### " + name] || host == ".vk.com" && rxSid.test(name);
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
            this.onlogout();
        }
    };
    var r = {
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
        },
        isAuth: function () {
            var ret = common.http.getCookie(".vk.com", rxSid, /.{7}/) || common.http.getCookie(".login.vk.com", "l") && common.http.getCookie(".login.vk.com", "p");
            log("isAuth = " + ret);
            return ret;
        },
        onlogout: null
    };
    return r;
};
