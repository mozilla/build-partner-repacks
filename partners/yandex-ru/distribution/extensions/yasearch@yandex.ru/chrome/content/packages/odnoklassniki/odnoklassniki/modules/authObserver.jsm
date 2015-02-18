EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[AuthObserver]: " + str);
    }
    var INTERVAL = 1100;
    var started = null;
    var timer = null;
    var timerFunc = function () {
        r._callback(true);
        timer = null;
    };
    var LOGIN_URL_REGEX = /^https?:\/\/(www\.)?(odnoklassniki|ok)\.ru\/(https|dk\?.+OAuth2Login)/;
    var LOGIN_URL_REGEX_M = /^https?:\/\/m\.(odnoklassniki|ok)\.ru\/dk/;
    var reloginTime = 0;
    function reloginTimeCallback() {
        if (reloginTime && timer && new Date().valueOf() > reloginTime) {
            reloginTime = 0;
            if (timer) {
                timer.cancel();
                timer = null;
            }
            timerFunc();
        }
    }
    function testWWW(url, stat, ch) {
        return LOGIN_URL_REGEX.test(url) && ch.requestMethod == "POST" && stat > 199 && stat < 400;
    }
    function testM(url, stat, ch) {
        if (LOGIN_URL_REGEX_M.test(url) && ch.requestMethod == "POST") {
            return /AUTHCODE/.test(ch.getResponseHeader("Set-Cookie"));
        }
        return false;
    }
    var observer = function (topic, data, subject) {
        subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        var url = subject.URI.spec;
        var stat = subject.responseStatus;
        if (testWWW(url, stat, subject) || testM(url, stat, subject)) {
            log("LOGIN_URL_REGEX.test(url) stat=" + stat + ", url=" + url);
            if (timer) {
                timer.cancel();
                timer = null;
            }
            timer = common.timers.setTimeout(timerFunc, INTERVAL);
            reloginTime = new Date().valueOf() + INTERVAL + 200;
        } else {
            reloginTimeCallback();
        }
    };
    var r = {
        _callback: function () {
        },
        init: function (callback) {
            this._callback = callback;
            this.start();
        },
        start: function () {
            if (!started) {
                started = common.observerService.addObserver("http-on-examine-response", observer, this);
            }
        },
        finalize: function () {
            if (started) {
                common.observerService.removeObserver(started);
                started = null;
            }
            this._callback = null;
        }
    };
    return r;
};
