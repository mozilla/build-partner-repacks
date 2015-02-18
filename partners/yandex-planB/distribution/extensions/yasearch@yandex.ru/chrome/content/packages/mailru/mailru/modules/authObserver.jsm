EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[AuthObserver]: " + str);
    }
    var LOGOUT_URL_REGEX = /^https?:\/\/([0-9a-z_-]+\.)?mail\.ru\/(cgi-bin\/logout|logout\.p?html)/i;
    var LOGIN_URL_REGEX = /^https?:\/\/(auth\.mail\.ru\/cgi-bin\/auth|love\.mail\.ru\/ajax\/login\.phtml\?.*Login)/i;
    var FALSE_LOGIN_URL_REGEX = /^https?:\/\/auth\.mail\.ru\/cgi-bin\/auth.*[?&]Login=([^&#]+(%40|@)[^&#]+)/i;
    var LOGIN_INTERVAL_MS = 400;
    var timer = null;
    var email = null;
    var timerFunc = function () {
        moduleObj._callback(true, email);
        timer = null;
    };
    var observer = function (topic, data, subject) {
        subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        if (!common.http.isGoodStatus(subject.responseStatus)) {
            return;
        }
        var url = subject.URI.spec;
        if (LOGOUT_URL_REGEX.test(url)) {
            log("LOGOUT_URL_REGEX matched " + url);
            if (timer) {
                timer.cancel();
                timer = null;
            }
            moduleObj._callback(false);
        } else {
            if (!timer && LOGIN_URL_REGEX.test(url)) {
                log("LOGIN_URL_REGEX matched " + url);
                email = null;
                var setAuthCookie = false;
                var respCookies = "";
                try {
                    respCookies = subject.getResponseHeader("Set-Cookie");
                } catch (exc) {
                }
                if (/(^|\r|\n|\s|;)Mpop=([^;]+)/.test(respCookies)) {
                    setAuthCookie = true;
                    var authValue = RegExp.$2;
                    if (/([^:]+@[^:]+)/.test(authValue)) {
                        email = RegExp.$1;
                    }
                }
                if (!setAuthCookie) {
                    log("no Mpop cookie!!!");
                    return;
                }
                if (FALSE_LOGIN_URL_REGEX.test(url)) {
                    email = decodeURIComponent(RegExp.$1);
                }
                timer = common.timers.setTimeout(timerFunc, LOGIN_INTERVAL_MS);
            }
        }
    };
    var moduleObj = {
        _callback: function () {
        },
        _observer: null,
        init: function (callback) {
            this._callback = callback;
            this.start();
        },
        start: function () {
            if (!this._observer) {
                this._observer = common.observerService.addObserver("http-on-examine-response", observer, this);
            }
        },
        finalize: function () {
            if (this._observer) {
                common.observerService.removeObserver(this._observer);
                this._observer = null;
            }
        }
    };
    return moduleObj;
};
