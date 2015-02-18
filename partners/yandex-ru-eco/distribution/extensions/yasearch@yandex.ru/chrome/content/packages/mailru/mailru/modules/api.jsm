EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[API]: " + str);
    }
    function logr(str) {
        app.logr("[API]: " + str);
    }
    var API_URL = "http://www.appsmail.ru/platform/api";
    function ajax(m, apiMethod, callback, errback) {
        var appcr = m._cred.appCred, keys = m._cred.userCred;
        var params = {
            session_key: keys.access_token,
            method: apiMethod,
            app_id: appcr.client_id,
            secure: 0,
            format: "json"
        };
        var paramsSigBasePart = common.utils.obj2UrlParams(params).replace(/&/g, "");
        var sigBase = params.secure ? [
            paramsSigBasePart,
            appcr.secret_key
        ].join("") : [
            keys.x_mailru_vid,
            paramsSigBasePart,
            appcr.private_key
        ].join("");
        params.sig = common.strUtils.md5(sigBase);
        return common.http.GET({
            url: API_URL,
            background: true,
            scope: m,
            responseType: "json",
            params: params,
            timeout: 5000,
            callback: callback,
            errback: function (st, text, xhr) {
                if (st == 400) {
                    try {
                        var obj = JSON.parse(xhr.responseText);
                        if (obj.error) {
                            text = "code_" + obj.error.error_code;
                        }
                    } catch (exc) {
                    }
                }
                errback.call(this, st, text);
            }
        });
    }
    return {
        userData: { mail: "" },
        updating: false,
        _cred: {},
        _callbacks: null,
        init: function (callbacks) {
            this._callbacks = callbacks;
        },
        setCredentials: function (appCred, userCred) {
            this._cred = {
                appCred: appCred,
                userCred: userCred
            };
        },
        _getUserMail: function (callback) {
            return ajax(this, "users.getInfo", function (data) {
                var link = data[0].link;
                var exRx = /\/\/my\.mail\.ru\/(.*?)\/(.*?)\//;
                var parts = exRx.exec(link);
                if (parts && parts.length == 3) {
                    var domain = parts[1];
                    var user = parts[2];
                    this.userData.mail = user + "@" + domain + ".ru";
                }
                callback.call(this);
            }, callback);
        },
        _getUnreadCount: function (callback, errback) {
            return ajax(this, "mail.getUnreadCount", function (data) {
                log("_getUnreadCount result " + data.count);
                this.userData.count = data.count;
                callback.call(this);
            }, errback);
        },
        clearData: function () {
            this.userData.mail = "";
            this.userData.count = 0;
            this.userData.error = null;
        },
        update: function (all) {
            if (this.updating) {
                return;
            }
            this.updating = true;
            if (all) {
                this.userData.mail = "";
            }
            this.userData.count = 0;
            this.userData.error = null;
            var count = this.userData.mail ? 1 : 2;
            var errData = null;
            logr("update data");
            function callback() {
                if (!--count) {
                    this.updating = false;
                    this.userData.error = errData;
                    this._callbacks.onUpdate(errData);
                }
            }
            function errback(status, text) {
                errData = {
                    status: status,
                    text: text
                };
                callback.call(this);
            }
            if (!this.userData.mail) {
                this._getUserMail(callback);
            }
            this._getUnreadCount(callback, errback);
        }
    };
};
