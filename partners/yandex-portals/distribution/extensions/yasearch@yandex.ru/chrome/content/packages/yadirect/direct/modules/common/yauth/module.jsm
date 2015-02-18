"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var HOST = "." + (common.branding.getBrandId() === "tb" ? common.branding.getDomain() : "yandex.ru");
    var PATH = "/";
    var AUTH_COOKIE = "Session_id";
    var LOGIN_COOKIE = "yandex_login";
    var inited = null;
    var currentUser = null;
    function log(str) {
        common.log("[yauthObserver]: " + str);
    }
    function testCookie(subject) {
        if (!subject) {
            return false;
        }
        var c = subject.QueryInterface(Components.interfaces.nsICookie2);
        return c && c.host == HOST && c.name == AUTH_COOKIE && c.path == PATH;
    }
    var observer = function authMgr_observer(topic, data, subject) {
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
            if (data == "deleted") {
                currentUser = null;
                this._callback.call(this._ctx, false);
                return;
            }
            common.async.nextTick(function () {
                let authed = this.isAuth();
                if (!authed) {
                    currentUser = null;
                } else {
                    let newUser = this.userLogin;
                    if (currentUser == newUser) {
                        return;
                    }
                    currentUser = newUser;
                    if (!currentUser) {
                        return;
                    }
                }
                this._callback.call(this._ctx, authed);
            }.bind(this));
        }
    };
    var r = {
        init: function yauthMgr_init(callback, ctx) {
            if (inited) {
                return;
            }
            this._ctx = ctx;
            this._callback = callback;
            inited = common.observerService.addObserver("cookie-changed", observer, this);
        },
        finalize: function yauthMgr_finalize() {
            if (inited) {
                common.observerService.removeObserver(inited);
                inited = null;
            }
            this._ctx = null;
            this._callback = null;
        },
        get userLogin() {
            return common.http.getCookie(HOST, LOGIN_COOKIE, null, PATH);
        },
        removeCookies: function yauthMgr_removeCookies() {
            common.http.deleteCookie(HOST, AUTH_COOKIE, PATH);
        },
        isAuth: function yauthMgr_isAuth() {
            return !!common.http.getCookie(HOST, AUTH_COOKIE, null, PATH);
        },
        _callback: null
    };
    return r;
};
