EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[OAuth]: " + str);
    }
    function logr(str) {
        app.logr("[OAuth]: " + str);
    }
    var OAUTH_CONNECT_URL = "https://connect.mail.ru/oauth/authorize";
    var OAUTH_TOKEN_UPDATE_URL = "https://appsmail.ru/oauth/token";
    var OAUTH_CALLBACK_URL = "http://connect.mail.ru/oauth/success.html";
    var LOGOUT_URL = "http://auth.mail.ru/cgi-bin/logout";
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
            authObserver.init(function (login, email) {
                if (login) {
                    log("authObserver try call th.login(); this._tryAuthEmail=" + th._tryAuthEmail + ", email=" + email);
                    if (email && email == th._tryAuthEmail) {
                        log("email && (email == th._tryAuthEmail)");
                        return;
                    }
                    th._tryAuthEmail = email || th._tryAuthEmail;
                    if (th._authByDlgTime + 2500 < new Date().valueOf()) {
                        log("th.login();");
                        th._authByDlgTime = 0;
                        if (cookieMgr.isAuth()) {
                            th.login();
                        }
                    } else {
                        log("handled dialog login request");
                    }
                } else {
                    log("authObserver call th.logout(true);");
                    th.logout(true);
                }
            });
            if (cookieMgr.isAuth()) {
                log("init: try login by cookie");
                this.login();
            }
            this._tryAuthEmail = null;
        },
        finalize: function () {
            this._callbacks = null;
        },
        setEMail: function (email) {
            log("set email " + email);
            this._tryAuthEmail = email || null;
        },
        _createAccessUrl: function () {
            return OAUTH_CONNECT_URL + "?" + common.utils.obj2UrlParams({
                client_id: this._appCredentials.client_id,
                response_type: "token",
                redirect_uri: OAUTH_CALLBACK_URL
            });
        },
        _openDialog: function () {
            if (!microbrowserWindow) {
                microbrowserWindow = microbrowser.open({
                    features: "centerscreen, width=443, height=400, resizable",
                    url: this._createAccessUrl(),
                    errorUrl: "content/net-error.html",
                    adapter: app.entities,
                    title: app.entities.get("mailru.widget.name"),
                    scope: this,
                    timeout: 15,
                    onclose: function () {
                        log("dialog close");
                        microbrowserWindow = null;
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
        login: function (dialog) {
            if (dialog) {
                this._openDialog();
                return;
            }
            if (loginRequest) {
                return;
            }
            loginRequest = common.http.GET({
                url: this._createAccessUrl(),
                background: true,
                scope: this,
                end: function () {
                    loginRequest = null;
                },
                callback: function (data, xhr) {
                    this._handleAuth(xhr.channel.URI.spec, false);
                },
                errback: function (st, text, xhr) {
                    this._tryAuthEmail = null;
                    if (this.credentials) {
                        this.credentials = null;
                        this._callbacks.onLogout();
                    }
                }
            });
        },
        _handleAuth: function (url, byDialog) {
            log("login response, url=" + url);
            if (!/^https?:\/\/connect\.mail\.ru\/oauth\/success\.html?/i.test(url)) {
                this.logout(true);
                return false;
            }
            url = url.replace("?", "#");
            var credentialsText = url.split("#")[1];
            credentials = common.utils.urlParams2Obj(credentialsText);
            app.logObj(credentials, "OAuth credentials");
            if ("undefined" != typeof credentials.error) {
                credentials = null;
            }
            if (loginRequest) {
                loginRequest.abort();
                loginRequest = null;
            }
            if (microbrowserWindow) {
                microbrowserWindow.close();
                microbrowserWindow = null;
            }
            if (credentials) {
                this._authByDlgTime = byDialog ? new Date().valueOf() : 0;
                this._setCredentials(credentials);
                this._callbacks.onLogin(true);
                return true;
            } else {
                if (this.credentials) {
                    this.logout(true);
                }
            }
            return true;
        },
        _setCredentials: function (credentials) {
            this.credentials = credentials;
            this.credentials.expiration_time = new Date().valueOf() + Number(credentials.expires_in + "000");
        },
        updateToken: function () {
            var url = OAUTH_TOKEN_UPDATE_URL + "?" + common.utils.obj2UrlParams({
                client_id: this._appCredentials.client_id,
                grant_type: "refresh_token",
                refresh_token: this.credentials.refresh_token,
                client_secret: this._appCredentials.secret_key
            });
            loginRequest = common.http.POST({
                url: url,
                background: true,
                responseType: "json",
                scope: this,
                end: function () {
                    loginRequest = null;
                },
                callback: function (data, xhr) {
                    this._setCredentials(data);
                    this._callbacks.onLogin(false);
                },
                errback: function (st) {
                    app.log("error update token: " + st);
                    this.login();
                }
            });
        },
        testCredentials: function () {
            if (!this.credentials) {
                this._callbacks.onLogout();
                return;
            }
            if (this.updating()) {
                return;
            }
            if (this._expired()) {
                logr("Credentials expired, update token");
                this.updateToken();
            } else {
                common.async.nextTick(this._callbacks.onLogin, this._callbacks, false);
            }
        },
        logout: function (noReq) {
            if (!this.credentials) {
                return;
            }
            log("this._tryAuthEmail = null;");
            this._tryAuthEmail = null;
            this._authByDlgTime = 0;
            if (this.updating()) {
                loginRequest.abort();
                loginRequest = null;
            }
            this.credentials = null;
            if (!noReq) {
                cookieMgr.removeCookies();
            }
            this._callbacks.onLogout();
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
