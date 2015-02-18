EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[OAuth]: " + str);
    }
    var requestTokenUrl = "http://api.ok.ru/oauth/token.do";
    var accessTokenUrl = "http://{HOST}.ru/oauth/authorize";
    var redirectUrl = "http://desktop.yandex.ru/microblogsodnoklassniki";
    var HOST = "odnoklassniki";
    var HOST_S = "ok";
    var authParams = {
        scope: "VALUABLE ACCESS;MESSAGING",
        response_type: "code",
        redirect_uri: redirectUrl
    };
    var oauthWindowFeatures = "resizable=no,width=720,height=550,centerscreen,chrome";
    var loginRequest = null;
    var microbrowser = null;
    var cookieMgr = null;
    var authObserver = null;
    var microbrowserWindow = null;
    var th = {
        credentials: null,
        _dialog: null,
        _appCredentials: null,
        _callbacks: null,
        _authByDlgTime: 0,
        init: function (cbacks, appcred) {
            this._appCredentials = appcred;
            this._callbacks = cbacks;
            microbrowser = app.commonModule("microbrowser");
            cookieMgr = app.importModule("cookie");
            authObserver = app.importModule("authObserver");
            cookieMgr.init(function () {
                log("cookieMgr call th.logout(true);");
                th.logout(true);
            });
            authObserver.init(function () {
                if (th._authByDlgTime + 2100 < new Date().valueOf()) {
                    log("authObserver call th.login();");
                    th._authByDlgTime = 0;
                    var isAuth = cookieMgr.isAuth();
                    if (isAuth) {
                        th.login(false, !isAuth.authS ? HOST : HOST_S);
                    }
                } else {
                    log("handled dialog login request");
                }
            });
            if (cookieMgr.isAuth()) {
                this.login();
            }
        },
        finalize: function () {
            this._callbacks = null;
        },
        refreshToken: function (code) {
            var params = {
                grant_type: code ? "authorization_code" : "refresh_token",
                client_id: this._appCredentials.client_id,
                client_secret: this._appCredentials.client_secret
            };
            if (code) {
                params.redirect_uri = redirectUrl;
                params.code = code;
            } else {
                params.refresh_token = this.credentials.refresh_token;
            }
            return common.http.POST({
                url: requestTokenUrl,
                params: params,
                scope: this,
                responseType: "json",
                callback: function (obj) {
                    var ok = false;
                    app.logObj(obj, "refreshToken callback data");
                    if (obj.access_token) {
                        this.credentials = this.credentials || {};
                        this.credentials.access_token = obj.access_token;
                        if (code) {
                            this.credentials.refresh_token = obj.refresh_token;
                        }
                        ok = true;
                    }
                    app.log("refreshToken callback: ok = " + ok);
                    if (ok) {
                        cookieMgr.start();
                        this._callbacks.onLogin();
                    } else {
                        this.logout(true);
                    }
                },
                errback: function () {
                    this.logout(true);
                }
            });
        },
        _handleAuth: function (url, byDialog) {
            log("login response, url=" + url);
            if (url.indexOf(redirectUrl) == 0) {
                var obj = common.utils.urlParams2Obj(url.substr(url.indexOf("?") + 1), true);
                if (obj && obj.code) {
                    this._authByDlgTime = byDialog ? new Date().valueOf() : 0;
                    if (microbrowserWindow) {
                        microbrowserWindow.close();
                        microbrowserWindow = null;
                    }
                    cookieMgr.syncAuth();
                    this.refreshToken(obj.code);
                } else {
                    app.logr("[oauth] ERROR: no token code! url = " + url);
                }
                return true;
            } else {
                return false;
            }
        },
        _createAccessUrl: function (host) {
            return accessTokenUrl.replace("{HOST}", host || HOST_S) + "?" + common.utils.obj2UrlParams(common.utils.copy(authParams, { client_id: this._appCredentials.client_id }));
        },
        _openDialog: function (host) {
            if (!microbrowserWindow) {
                microbrowserWindow = microbrowser.open({
                    features: oauthWindowFeatures,
                    url: this._createAccessUrl(host),
                    errorUrl: "content/net-error.html",
                    adapter: app.entities,
                    title: app.entities.get("widget.name"),
                    scope: this,
                    timeout: 15,
                    onclose: function () {
                        log("dialog close");
                        microbrowserWindow = null;
                        loginRequest = null;
                    },
                    onlocationchange: function (aWebProgress, aRequest, aLocation) {
                        log("onlocationchange " + aLocation.spec);
                        this._handleAuth(aLocation.spec, true);
                    }
                });
            } else {
                microbrowserWindow.focus();
            }
        },
        login: function (dialog, host) {
            if (loginRequest) {
                return;
            }
            if (dialog) {
                this._openDialog(host);
                return;
            }
            loginRequest = common.http.GET({
                url: this._createAccessUrl(host),
                background: true,
                scope: this,
                end: function () {
                    loginRequest = null;
                },
                callback: function (data, xhr) {
                    this._handleAuth(xhr.channel.URI.spec, false);
                },
                errback: function (st, text, xhr) {
                    if (st == 404) {
                        this._handleAuth(xhr.channel.URI.spec, false);
                    } else {
                        this.logout(true);
                    }
                }
            });
        },
        logout: function (noReq) {
            cookieMgr.stop();
            if (!noReq) {
                cookieMgr.removeCookies();
            }
            if (!this.credentials) {
                return;
            }
            this._authByDlgTime = 0;
            if (this.updating()) {
                loginRequest.abort();
                loginRequest = null;
            }
            this.credentials = null;
            this._callbacks.onLogout();
        },
        updating: function () {
            return !!loginRequest;
        }
    };
    return th;
};
