EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[AuthObserver]: " + str);
    }
    var INTERVAL = 700;
    var LOGIN_URL_REGEX = /^https?:\/\/((www|m)\.)?facebook\.com\/login\.php/i;
    var started = null;
    var timer = null;
    var timerFunc = function () {
        r._callback(true);
        timer = null;
    };
    function testLogin(url, method) {
        return method == "POST" && LOGIN_URL_REGEX.test(url);
    }
    var observer = function (topic, data, subject) {
        subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        let url = subject.URI.spec;
        if (testLogin(url, subject.requestMethod)) {
            log("LOGIN_URL_REGEX.test(url) " + url);
            if (timer) {
                timer.cancel();
                timer = null;
            }
            timer = common.timers.setTimeout(timerFunc, INTERVAL);
        }
    };
    var r = {
        _callback: function () {
        },
        init: function (callback) {
            this._callback = callback;
        },
        start: function () {
            if (!started) {
                started = common.observerService.addObserver("http-on-examine-response", observer, this);
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
            this._callback = null;
        }
    };
    return r;
};
