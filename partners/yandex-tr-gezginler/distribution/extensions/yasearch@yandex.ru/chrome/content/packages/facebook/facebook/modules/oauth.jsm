EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[OAuth]: " + str);
    }
    function logr(str) {
        app.logr("[OAuth]: " + str);
    }
    var OAuthPermissions = [
        "",
        "manage_notifications",
        "offline_access",
        "read_insights",
        "read_mailbox",
        "read_requests",
        "read_stream",
        "user_activities",
        "user_status"
    ].join(",");
    var OAuthURI = "https://www.facebook.com/dialog/oauth";
    var OAuthRedirectURI = "https://www.facebook.com/connect/login_success.html";
    var OAuthWindowFeatures = "centerscreen,resizable,width=650,height=450";
    var compareCallbacks = function (alien, own) {
        alien = alien.replace(/^https?:\/\/(www\.)?/, "");
        own = own.replace(/^https?:\/\/(www\.)?/, "");
        return alien.indexOf(own) == 0;
    };
    var loginRequest = null;
    var microbrowser = null;
    var cookieMgr = null;
    var authObserver = null;
    var microbrowserWindow = null;
    var dlgType = null;
    var th = {
        credentials: null,
        _callbacks: null,
        _authByDlgTime: 0,
        init: function (cbacks) {
            this._callbacks = cbacks;
            microbrowser = app.commonModule("microbrowser");
            cookieMgr = app.importModule("cookie");
            authObserver = app.importModule("authObserver");
            cookieMgr.init(function () {
                log("cookieMgr call th.logout(true);");
                th.logout(true);
            });
            authObserver.init(function (login) {
                if (login && th._authByDlgTime + 2500 < new Date().valueOf()) {
                    log("authObserver call th.login();");
                    th._authByDlgTime = 0;
                    if (cookieMgr.isAuth()) {
                        th.login();
                    }
                } else {
                    log("handled dialog login request");
                }
            });
            authObserver.start();
            if (cookieMgr.isAuth()) {
                log("init: try login by cookie");
                this.login();
            }
        },
        finalize: function () {
            this._callbacks = null;
            this._abortReq();
        },
        _abortReq: function () {
            if (loginRequest) {
                loginRequest.abort();
                loginRequest = null;
            }
        },
        _abortDialog: function () {
            if (microbrowserWindow) {
                microbrowserWindow.close();
            }
        },
        _createAccessUrl: function () {
            return OAuthURI + "?" + common.utils.obj2UrlParams({
                "client_id": app.config.credentials.client_id,
                "redirect_uri": OAuthRedirectURI,
                "response_type": "token",
                "display": "popup",
                "scope": OAuthPermissions
            });
        },
        _openDialog: function () {
            if (!microbrowserWindow) {
                dlgType = "login";
                microbrowserWindow = microbrowser.open({
                    features: OAuthWindowFeatures,
                    url: this._createAccessUrl(),
                    errorUrl: "content/net-error.html",
                    adapter: {
                        ents: app.entities,
                        type: dlgType
                    },
                    title: app.entities.get("facebook.widget.name"),
                    scope: this,
                    handleBlanks: true,
                    timeout: 15,
                    onclose: function () {
                        log("dialog close");
                        microbrowserWindow = null;
                        dlgType = null;
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
        _loginByCookie: function (force) {
            if (force) {
                this._abortReq();
            }
            if (!loginRequest) {
                loginRequest = common.http.GET({
                    url: this._createAccessUrl(),
                    background: true,
                    scope: this,
                    end: function () {
                        loginRequest = null;
                    },
                    callback: function (data, xhr) {
                        if (!this._handleAuth(xhr.channel.URI.spec, false)) {
                            this.logout(true);
                        }
                    },
                    errback: function (status, text, xhr) {
                        if (this.credentials) {
                            this.credentials = null;
                            this._callbacks.onLogout();
                        }
                    }
                });
            }
        },
        _handleAuth: function (url, byDialog) {
            log(url);
            var param = microbrowser.testUrl(url, OAuthRedirectURI, true);
            if (!param) {
                return false;
            }
            this._abortReq();
            app.logObj(param);
            if ("error_code" in param.qs || "error" in param.qs) {
                if (byDialog && microbrowserWindow) {
                    microbrowserWindow.showError();
                }
                this.logout(true);
                return false;
            }
            if (dlgType && dlgType != "login" && microbrowserWindow) {
                log("microbrowserWindow.loadURL " + microbrowserWindow.lastURL());
                microbrowserWindow.loadURL(microbrowserWindow.lastURL(), true);
            }
            if (dlgType == "login") {
                this._abortDialog();
            }
            this._authByDlgTime = byDialog ? new Date().valueOf() : 0;
            this._setCredentials(param.hash);
            cookieMgr.start();
            authObserver.stop();
            this._callbacks.onLogin();
            return true;
        },
        _setCredentials: function (credentials) {
            this.credentials = credentials;
            this.credentials._user_id = cookieMgr.getUserId();
            this.credentials.expiration_time = new Date().valueOf() + Number(credentials.expires_in + "000");
        },
        login: function (dialog) {
            if (dialog) {
                this._openDialog();
            } else {
                this._loginByCookie();
            }
        },
        testCredentials: function (force) {
            if (!this.credentials) {
                this._callbacks.onLogout();
                return;
            }
            if (loginRequest) {
                return;
            }
            if (this._expired()) {
                this._loginByCookie();
            } else {
                common.async.nextTick(this._callbacks.onLogin, this._callbacks, force);
            }
        },
        logout: function (noReq) {
            if (!this.credentials) {
                return;
            }
            cookieMgr.stop();
            authObserver.start();
            this._abortReq();
            this.credentials = null;
            if (!noReq) {
                cookieMgr.removeCookies();
            }
            this._callbacks.onLogout();
        },
        _expired: function () {
            return this.credentials && new Date().valueOf() >= this.credentials.expiration_time - 20000;
        },
        _getSharePageUrl: function (shared_url) {
            var params = { app_id: app.config.credentials.client_id };
            if (shared_url && /^https?|^s?ftp/.test(shared_url)) {
                params.u = shared_url;
            }
            return app.config.FBdomain.www + "sharer/sharer.php?" + common.utils.obj2UrlParams(params);
        },
        _getPostPageUrl: function (shared_url) {
            var params = {
                display: "popup",
                app_id: app.config.credentials.client_id,
                redirect_uri: app.config.credentials.redirect_uri
            };
            if (shared_url && /^https?|^s?ftp/.test(shared_url)) {
                params.link = shared_url;
            }
            return app.config.FBdomain.www + "dialog/feed?" + common.utils.obj2UrlParams(params);
        },
        showSharePage: function (currentUrl) {
            if (!/^(https?|s?ftp):\/\/\S+/.test(currentUrl)) {
                return;
            }
            if (!microbrowserWindow) {
                log("showSharePage for " + currentUrl);
                var url = this._getSharePageUrl(currentUrl);
                dlgType = "share";
                microbrowserWindow = microbrowser.open({
                    features: OAuthWindowFeatures,
                    url: url,
                    errorUrl: "content/net-error.html",
                    adapter: {
                        ents: app.entities,
                        type: dlgType
                    },
                    title: app.entities.get("share.tooltip"),
                    scope: this,
                    handleBlanks: true,
                    timeout: 15,
                    onclose: function () {
                        log("dialog close");
                        microbrowserWindow = null;
                        dlgType = null;
                    },
                    onlocationchange: function (aWebProgress, aRequest, aLocation) {
                        log("onlocationchange " + aLocation.spec);
                    }
                });
            } else {
                microbrowserWindow.focus();
            }
        },
        showPostPage: function () {
            if (!microbrowserWindow) {
                log("showPostPage");
                var url = this._getPostPageUrl();
                dlgType = "post";
                microbrowserWindow = microbrowser.open({
                    features: OAuthWindowFeatures,
                    url: url,
                    errorUrl: "content/net-error.html",
                    adapter: {
                        ents: app.entities,
                        type: dlgType
                    },
                    title: app.entities.get("menu.setstatus"),
                    scope: this,
                    handleBlanks: true,
                    timeout: 15,
                    onclose: function () {
                        log("dialog close");
                        microbrowserWindow = null;
                        dlgType = null;
                    },
                    onlocationchange: function (aWebProgress, aRequest, aLocation) {
                        log("onlocationchange " + aLocation.spec);
                        if (microbrowserWindow && microbrowser.testUrl(aLocation.spec, app.config.credentials.redirect_uri)) {
                            microbrowserWindow.close();
                        }
                    }
                });
            } else {
                microbrowserWindow.focus();
            }
        }
    };
    return th;
};
