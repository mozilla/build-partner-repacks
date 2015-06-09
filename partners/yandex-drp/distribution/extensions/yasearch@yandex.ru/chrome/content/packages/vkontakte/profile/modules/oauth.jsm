EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[OAuth]: " + str);
    }
    function logObj(obj, str) {
        app.logObj(obj, "[OAuth]: " + str);
    }
    var AUTH_URL_ROOT = "https://oauth.vk.com/authorize";
    var REDIRECT_URL = "https://oauth.vk.com/blank.html";
    var LOGOUT_URL = "http://oauth.vk.com/oauth/logout";
    var LOGOUT_URL2 = "http://vk.com/login.php?op=logout";
    var PERMISSIONS = "audio,friends,messages,notes,video,notifications";
    var oauthWindowFeatures = "chrome,resizable,centerscreen,width=620,height=400";
    var loginRequest = null;
    var microbrowser = null;
    var cookieMgr = null;
    var authObserver = null;
    var microbrowserWindow = null;
    var loginTime = 0;
    var th = {
        credentials: null,
        _dialog: null,
        _appCredentials: null,
        _callbacks: null,
        init: function (cbacks, appcred) {
            this._appCredentials = appcred;
            this._callbacks = cbacks;
            microbrowser = app.commonModule("microbrowser");
            authObserver = app.importModule("authObserver");
            cookieMgr = app.importModule("cookie");
            cookieMgr.init(function () {
                th.logout(true);
            });
            authObserver.init(function (login) {
                if (login) {
                    if (new Date().valueOf() - loginTime > 2500) {
                        log("authObserver call th.login();");
                        th.login();
                    } else {
                        log("detect dialog login request");
                    }
                } else {
                    log("authObserver call th.logout(true);");
                    th.logout(true);
                }
            });
            this._loginByCookie();
        },
        finalize: function () {
            this._callbacks = null;
        },
        _getAuthURL: function () {
            return AUTH_URL_ROOT + "?" + common.utils.obj2UrlParams({
                client_id: this._appCredentials.client_id,
                scope: PERMISSIONS,
                redirect_uri: REDIRECT_URL,
                display: "popup",
                v: app.config.apiVersion,
                response_type: "token"
            });
        },
        _isRedirectUrl: function (url) {
            return url.indexOf(REDIRECT_URL) == 0;
        },
        _handleAuth: function (url, dlg) {
            log("login response, url=" + url);
            if (this._isRedirectUrl(url)) {
                if (dlg) {
                    loginTime = new Date().valueOf();
                }
                if (microbrowserWindow) {
                    microbrowserWindow.close();
                    microbrowserWindow = null;
                }
                var params = common.utils.urlParams2Obj(url.substr(url.indexOf("#") + 1), true);
                logObj(params, "Response params");
                if ("undefined" !== typeof params.error) {
                    app.logr("[OAuth] ERROR: Authorization error has occurred.");
                    app.logr("[OAuth] ERROR: Error reason: " + params.error_reason);
                    app.logr("[OAuth] ERROR: Error description: " + params.error_description.replace(/%20/g, " "));
                    return false;
                }
                this.credentials = {
                    user_id: params.user_id,
                    access_token: String(params.access_token),
                    expiration_time: new Date().valueOf() + Number(params.expires_in + "000")
                };
                log("cookieMgr.start();");
                cookieMgr.start();
                this._callbacks.onLogin();
                return true;
            } else {
                return false;
            }
        },
        _loginByCookie: function () {
            if (loginRequest) {
                return;
            }
            log("try login by cookie");
            loginRequest = common.http.GET({
                url: this._getAuthURL(),
                scope: this,
                end: function (xhr) {
                    loginRequest = null;
                    if (!this._handleAuth(xhr.channel.URI.spec)) {
                        this.logout(true);
                    }
                }
            });
        },
        _loginByDialog: function () {
            if (!microbrowserWindow) {
                microbrowserWindow = microbrowser.open({
                    features: oauthWindowFeatures,
                    testHeight: true,
                    url: this._getAuthURL(),
                    errorUrl: "content/net-error.html",
                    title: app.entities.get("vk.name"),
                    adapter: app.entities,
                    scope: this,
                    handleBlanks: true,
                    onclose: function () {
                        log("[dialog]: close");
                        microbrowserWindow = null;
                    },
                    onlocationchange: function (aWebProgress, aRequest, aLocation) {
                        log("[dialog]: onlocationchange " + aLocation.spec);
                        this._handleAuth(aLocation.spec, true);
                    }
                });
            } else {
                microbrowserWindow.focus();
            }
        },
        login: function (dialog) {
            if (dialog) {
                this._loginByDialog();
            } else {
                this._loginByCookie();
            }
        },
        testCredentials: function (callback, scope) {
            if (this._expired()) {
                this._loginByCookie();
            } else {
                callback.call(scope);
            }
        },
        logout: function (noReq) {
            if (!this.credentials) {
                return;
            }
            cookieMgr.stop();
            if (this.updating()) {
                loginRequest.abort();
                loginRequest = null;
            }
            loginTime = 0;
            this.credentials = null;
            if (!noReq) {
                this._logoutWeb();
            }
            this._callbacks.onLogout();
        },
        _logoutWeb: function () {
            common.http.GET({
                url: "http://vk.com",
                callback: function (data) {
                    var m = /https?:\/\/(login\.|www\.)?vk\.com[^"'>]+act=logout[^"'>\s]+/i.exec(data);
                    if (m) {
                        log("_logoutWeb: url=" + m[0]);
                        common.http.GET({
                            url: m[0],
                            background: true,
                            callback: function (data) {
                                log("_logoutWeb: ok");
                            }
                        });
                    }
                }
            });
        },
        updating: function () {
            return !!loginRequest;
        },
        _expired: function () {
            return this.credentials && new Date().valueOf() >= this.credentials.expiration_time - 10000;
        }
    };
    return th;
};
