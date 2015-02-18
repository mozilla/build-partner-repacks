EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[API]: " + str);
    }
    function logr(str) {
        app.logr("[API]: " + str);
    }
    var API_URL = "http://assist.rambler.ru/script/biff.cgi?mode=if&project=mail";
    var cookieMgr = null;
    return {
        userData: null,
        updating: null,
        _callbacks: null,
        init: function (callbacks) {
            this._callbacks = callbacks;
            cookieMgr = app.importModule("cookie");
            cookieMgr.init(function (login) {
                log("!!!!!!! cookieMgr.init " + login);
                if (login) {
                    if (!this.userData || this.userData.mail != cookieMgr.getEMail()) {
                        this.update();
                    }
                } else {
                    if (this.userData || this.updating) {
                        this.update();
                    }
                }
            }, this);
        },
        _extractData: function (xml, callback) {
            if (!this.userData) {
                this._callbacks.onLogin();
            }
            this.userData = {
                mail: cookieMgr.getEMail(),
                count: parseInt(common.xml.getValue(xml, "project[name=\"mail\"]") || "0", 10)
            };
            this._callbacks.onUpdate();
        },
        isAuth: function () {
            return cookieMgr && cookieMgr.isAuth() || false;
        },
        saveCurrentTime: function () {
            if (this.userData) {
                log("saveCurrentTime");
                this._stor.save(this.userData.mail || "default", new Date().valueOf());
            }
        },
        update: function () {
            if (!cookieMgr.isAuth()) {
                if (this.updating) {
                    this.updating.abort();
                    this.updating = null;
                }
                this.userData = null;
                common.async.nextTick(function () {
                    this.onLogout();
                    this.onUpdate();
                }, this._callbacks);
                return;
            }
            if (this.updating) {
                return;
            }
            logr("update data");
            this.updating = common.http.GET({
                url: API_URL,
                background: true,
                preventAuth: true,
                params: { _rand: new Date().valueOf() },
                responseType: "xml",
                scope: this,
                end: function () {
                    this.updating = null;
                },
                callback: this._extractData,
                errback: function (status, text, xhr) {
                    if (status == 401 || status == 500) {
                        this.userData = null;
                        this._callbacks.onLogout();
                    } else {
                        if (cookieMgr.isAuth()) {
                            this.userData = this.userData || {};
                            this.userData.count = 0;
                            this.userData.error = true;
                        } else {
                            this.userData = null;
                            if (text != "abort") {
                                this._callbacks.onLogout();
                            }
                        }
                    }
                    this._callbacks.onUpdateError(status);
                }
            });
        }
    };
};
