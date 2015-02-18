EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[AuthObserver]: " + str);
    }
    var INTERVAL = 1300;
    var started = null;
    var timer = null;
    var timerFunc = function () {
        r._callback(true);
        timer = null;
    };
    var LOGIN_URL_REGEX = /^https?:\/\/login\.vk\.com\/\?.*act=login/i;
    var LOGIN_URL_REGEX2 = /^https?:\/\/vk\.com\/login.php\?.*act=slogin.*hash/i;
    var LOGOUT_URL_REGEX = /https?:\/\/(m\.)?vk\.com\/login(\.php)?\?.*(op|act)=logout/i;
    function testLogin(url, method) {
        return method == "POST" && LOGIN_URL_REGEX.test(url) || method == "GET" && LOGIN_URL_REGEX2.test(url);
    }
    var observer = function (topic, data, subject) {
        subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        let url = subject.URI.spec;
        if (LOGOUT_URL_REGEX.test(url)) {
            log("LOGOUT_URL_REGEX.test(url) " + url);
            if (timer) {
                timer.cancel();
                timer = null;
            }
            this._callback(false);
        } else {
            if (!timer && testLogin(url, subject.requestMethod)) {
                log("LOGIN_URL_REGEX.test(url) " + url);
                timer = common.timers.setTimeout(timerFunc, INTERVAL);
            }
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
