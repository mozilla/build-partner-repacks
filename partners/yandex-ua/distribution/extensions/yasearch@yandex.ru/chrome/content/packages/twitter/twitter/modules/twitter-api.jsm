var EXPORTED_SYMBOLS = ["module"];
function module(application, common) {
    var log = function (str, method) {
        application.log("twitter-api: " + str, method);
    };
    var logObj = function (obj, prefix) {
        application.logObj(obj, "twitter-api: " + (prefix || ""));
    };
    var twitterUrl = {
        requestToken: "https://api.twitter.com/oauth/request_token",
        auth: "https://api.twitter.com/oauth/authorize",
        accessToken: "https://api.twitter.com/oauth/access_token"
    };
    var compareCallbacks = function (alien, own) {
        var url1 = alien.replace(/^https?:\/\/(www\.)?/, "");
        var url2 = own.replace(/^https?:\/\/(www\.)?/, "");
        return url1.indexOf(url2) == 0;
    };
    var authBrowserWindow = null;
    var TwitterAPIConstructor = function (observer) {
        this.type = "twitter";
        this.active = false;
        this.microbrowser = application.commonModule("microbrowser");
        this.OAuth = application.commonModule("oauth");
        this.credentials = {};
        this.observer = observer;
        this.cookieMgr = application.importModule("cookie");
        var me = this;
        this.cookieMgr.init(function () {
            me.disconnect();
        });
    };
    TwitterAPIConstructor.prototype = {
        constructor: TwitterAPIConstructor,
        displayName: "twitter account",
        setSavedCredentials: function (savedAccountData) {
            if (savedAccountData) {
                log("savedAccountData!!!");
                if (!this.cookieMgr.isAuth()) {
                    return false;
                }
                this.type = savedAccountData.type;
                this.credentials = savedAccountData.credentials;
                this.displayName = savedAccountData.displayName;
                this.active = savedAccountData.active;
                this.observer.onLogin();
                this.cookieMgr.start();
            }
            return true;
        },
        _getAuthorizationHeader: function (method, url, postParams) {
            var t = url.split("?");
            var baseUrl = t[0];
            var urlParams = t[1];
            var paramsObj;
            var oAuthParams = {
                oauth_consumer_key: application.config.appCredential.consumer_key,
                oauth_nonce: common.strUtils.getRandomString(8),
                oauth_signature_method: "HMAC-SHA1",
                oauth_timestamp: String(Math.round(new Date().valueOf() / 1000)),
                oauth_version: "1.0"
            };
            if ("oauth_verifier" in this.credentials) {
                oAuthParams.oauth_verifier = this.credentials.oauth_verifier;
            }
            if ("oauth_token" in this.credentials) {
                oAuthParams.oauth_token = this.credentials.oauth_token;
            }
            if (method.toUpperCase() === "GET") {
                paramsObj = application.utils.mix(common.utils.urlParams2Obj(urlParams), oAuthParams);
            } else {
                paramsObj = application.utils.mix(common.utils.urlParams2Obj(urlParams), postParams, oAuthParams);
            }
            var base = [
                method,
                baseUrl,
                common.utils.obj2UrlParams(paramsObj)
            ].map(common.utils.encodeURIComponent).join("&");
            var key = [
                application.config.appCredential.consumer_secret,
                this.credentials.oauth_token_secret || ""
            ].join("&");
            oAuthParams.oauth_signature = this.OAuth.SignRaw(key, base);
            return [
                "OAuth",
                application.utils.obj2HeaderParams(oAuthParams)
            ].join(" ");
        },
        sendSignedRequest: function (method, url, readystateListener, postDataObject, endReadyState) {
            var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
            if (method.toLowerCase() == "get" && postDataObject) {
                var additionalGetParams = common.utils.obj2UrlParams(postDataObject);
                var delimiter = "&";
                if (url.indexOf("?") === -1) {
                    delimiter = "?";
                }
                url = [
                    url,
                    additionalGetParams
                ].join(delimiter);
            }
            var headers = {
                "Accept": null,
                "Accept-Charset": null,
                "Accept-Language": null,
                "Content-Type": "application/x-www-form-urlencoded; encoding=UTF-8",
                "Authorization": this._getAuthorizationHeader(method, url, postDataObject)
            };
            log("signed request: " + method + " " + url);
            request.open(method, url);
            for (var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    request.setRequestHeader(i, headers[i]);
                }
            }
            request.onreadystatechange = function (event) {
                var target = event.target;
                if (target.readyState >= (endReadyState || 4)) {
                    readystateListener.apply(this, arguments);
                }
            };
            request.send(method.toLowerCase() != "get" && postDataObject ? common.utils.obj2UrlParams(postDataObject) : null);
            return {
                abort: function () {
                    log("abort signed request");
                    request.abort();
                }
            };
        },
        _resetAuth: function () {
            if (!this.active) {
                return;
            }
            this.active = false;
            this.credentials = {};
            delete this.displayName;
            this.observer.onLogout();
            this.cookieMgr.stop();
            if (this._req) {
                this._req.abort();
                this._req = null;
            }
        },
        _getRequestToken: function (callback) {
            log("getRequestToken");
            var me = this;
            var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
            var readyState1Listener = function (event) {
                me._req = null;
                var target = event.target;
                timer.cancel();
                var responseText = target.responseText;
                var status = target.status, statusText = target.statusText;
                log("getRequestToken success, status=" + status);
                if (responseText && status >= 200 && status < 400) {
                    var response = common.utils.urlParams2Obj(responseText);
                    if ("oauth_token" in response && "oauth_token_secret" in response) {
                        me.credentials.oauth_token = response.oauth_token;
                        me.credentials.oauth_token_secret = response.oauth_token_secret;
                        log("getRequestToken success, response.oauth_token=" + response.oauth_token);
                        callback.call(me);
                        return;
                    } else {
                        log("getRequestToken result: bad response");
                        callback.call(me, "SERVER_ERROR", status, "Error");
                    }
                } else {
                    callback.call(me, "SERVER_ERROR", status, statusText);
                }
            };
            var asyncWatcher = this.sendSignedRequest("GET", twitterUrl.requestToken, readyState1Listener, { oauth_callback: application.config.appCredential.callback_url });
            timer.initWithCallback(function () {
                log("timer abort!");
                asyncWatcher.abort();
                callback.call(me, "TIMEOUT");
            }, 9500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
            return asyncWatcher;
        },
        _authorizeUserExtract: function (url) {
            if (compareCallbacks(url, application.config.appCredential.callback_url)) {
                try {
                    var t = url.split("?");
                    var domain = t[0], paramsStr = t[1];
                    var params = common.utils.urlParams2Obj(paramsStr);
                    return params;
                } catch (e) {
                    return {};
                }
            }
        },
        _getAccessToken: function (callback) {
            var me = this;
            var asyncWatcher = me.sendSignedRequest("GET", twitterUrl.accessToken, function (event) {
                me._req = null;
                var target = event.target;
                var responseText = target.responseText;
                var status = target.status, statusText = target.statusText;
                if (responseText && status >= 200 && status < 400) {
                    var response = common.utils.urlParams2Obj(responseText);
                    me.credentials.uid = response.user_id;
                    me.credentials.oauth_token = response.oauth_token;
                    me.credentials.oauth_token_secret = response.oauth_token_secret;
                    me.credentials.screen_name = response.screen_name;
                    me.active = true;
                    me.displayName = response.screen_name;
                    callback.call(me, null, response);
                } else {
                    callback.call(me, "ERROR");
                }
            });
            return asyncWatcher;
        },
        connect: function () {
            if (authBrowserWindow) {
                authBrowserWindow.focus();
                return;
            }
            this._resetAuth();
            var callback = function (err) {
                if (err) {
                    this.credentials = {};
                    application.destroySlice();
                    this.observer.onLoginError(err);
                    this.cookieMgr.stop();
                } else {
                    this.observer.onLogin();
                    this.cookieMgr.start();
                }
            };
            log("*start auth*");
            var authorize = false;
            var adapter = {
                ents: application.entities,
                step: 0
            };
            authBrowserWindow = this.microbrowser.open({
                features: "centerscreen,width=600,height=720,resizable",
                url: "throbber",
                title: application.entities.text("twitter.auth.ie"),
                adapter: adapter,
                scope: this,
                handleBlanks: true,
                errorUrl: "content/net-error.html",
                timeout: 15,
                onclose: function () {
                    if (!authorize) {
                        callback.call(this, "CANCELLED");
                    }
                    authBrowserWindow = null;
                },
                onlocationchange: function (aWebProgress, aRequest, aLocation) {
                    log("onlocationchange " + aLocation.spec);
                    var data = this._authorizeUserExtract(aLocation.spec);
                    if (data) {
                        log("_authorizeUserExtract " + data.oauth_verifier);
                        if (data.oauth_token && data.oauth_verifier) {
                            authorize = true;
                            this.credentials.oauth_token = data.oauth_token;
                            this.credentials.oauth_verifier = data.oauth_verifier;
                            log("getAccessToken");
                            this._req = this._getAccessToken(callback);
                        }
                        authBrowserWindow.close();
                        authBrowserWindow = null;
                    }
                },
                onready: function (doc) {
                    var cans = doc.getElementById("cancel");
                    if (cans) {
                        cans.onclick = function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            authBrowserWindow.close();
                            return false;
                        };
                    }
                }
            });
            this._req = this._getRequestToken(function (err, st, stt) {
                if (authBrowserWindow) {
                    if (err) {
                        log("*end auth: error*");
                        authBrowserWindow.showError(st, stt);
                    } else {
                        var tokenObj = { oauth_token: this.credentials.oauth_token };
                        log("load dialog");
                        adapter.step = 1;
                        authBrowserWindow.loadURL(twitterUrl.auth + "/?" + common.utils.obj2UrlParams(tokenObj));
                    }
                }
            });
        },
        reconnect: function () {
            log("reconnect");
            return this.connect();
        },
        disconnect: function () {
            this._resetAuth();
            if (this.cookieMgr.isAuth()) {
                this.cookieMgr.removeCookies();
            }
        }
    };
    return TwitterAPIConstructor;
}
