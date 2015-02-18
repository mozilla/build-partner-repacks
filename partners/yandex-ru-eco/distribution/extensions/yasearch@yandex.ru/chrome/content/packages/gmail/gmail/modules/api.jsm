EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[API]: " + str);
    }
    function logr(str) {
        app.logr("[API]: " + str);
    }
    var API_URL = "https://mail.google.com/mail/feed/atom/";
    var cookieMgr = null;
    return {
        userData: null,
        updating: null,
        _callbacks: null,
        _stor: null,
        init: function (callbacks) {
            this._callbacks = callbacks;
            this._stor = common.storage("last.json");
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
        isAuth: function () {
            return cookieMgr && cookieMgr.isAuth() || false;
        },
        _extractData: function (xml, callback) {
            if (!this.userData) {
                this._callbacks.onLogin();
            }
            var mail = /[a-z0-9._-]+@[a-z0-9.-]{4,}/i.exec(common.xml.getValue(xml, "feed>title"));
            this.userData = {
                mail: mail ? mail[0] : "",
                count: parseInt(common.xml.getValue(xml, "feed>fullcount") || "0")
            };
            var curr = new Date().valueOf();
            if (this.userData.count && app.notif.enabled) {
                var last = this._stor[this.userData.mail || "default"] || 0;
                if (last) {
                    last = Math.max(last, curr - 24 * 60 * 60 * 1000);
                    var letters = xml.querySelectorAll("feed>entry");
                    this.userData.notifyData = { mail: [] };
                    for (var i = 0; i < letters.length; ++i) {
                        var date = new Date(common.xml.getValue(letters[i], "issued")).valueOf();
                        if (date <= last) {
                            break;
                        }
                        this.userData.notifyData.mail.unshift({
                            date: date,
                            link: common.xml.getAttr(letters[i], "link", "href"),
                            title: common.xml.getValue(letters[i], "title"),
                            summary: common.xml.getValue(letters[i], "summary"),
                            author: {
                                name: common.xml.getValue(letters[i], "author>name"),
                                email: common.xml.getValue(letters[i], "author>email")
                            }
                        });
                    }
                }
            }
            this._stor.save(this.userData.mail || "default", curr);
            this._callbacks.onUpdate();
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
                    if (status == 401) {
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
