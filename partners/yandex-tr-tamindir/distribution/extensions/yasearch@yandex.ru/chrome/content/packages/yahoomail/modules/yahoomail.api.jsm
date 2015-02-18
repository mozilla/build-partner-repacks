var EXPORTED_SYMBOLS = ["module"];
var module = function (application) {
    var YahooMailAPI = function () {
    };
    YahooMailAPI.prototype = new function () {
        var $ = this;
        var accessTokenUpdater = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        var requestTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        var oAuth = null;
        const CREDENTIALS = [
            {
                key: "dj0yJmk9ejM4WVc0TVJvT1pKJmQ9WVdrOWRUSnJVMk5sTjJVbWNHbzlNVEl3TnpRMU1qWTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD1hYQ--",
                secret: "a2e8e1e415afe6c293250e7b647917de68767ecc"
            },
            {
                key: "dj0yJmk9NHhmNW9PcFJLcFNVJmQ9WVdrOVMwb3lNVFptTkdrbWNHbzlOalF3TmpZNU5qSS0mcz1jb25zdW1lcnNlY3JldCZ4PWY0",
                secret: "53a341bdfbfd6aaedc8b18717a137c4d62c44c7b"
            }
        ];
        const CALLBACK_URL = "http://desktop.yandex.ru/microbtw";
        const API_URL = {
            REALM: "yahooapis.com",
            GET_REQUEST_TOKEN: "https://api.login.yahoo.com/oauth/v2/get_request_token",
            REQUEST_AUTH: "https://api.login.yahoo.com/oauth/v2/request_auth",
            GET_ACCESS_TOKEN: "https://api.login.yahoo.com/oauth/v2/get_token",
            QUERY_ROOT: "http://query.yahooapis.com/v1/yql?"
        };
        const QUERY = {
            LETTERS_COUNT: "select * from ymail.messages where numMid='0' and numInfo='0'",
            USER_PROFILE: "select * from social.profile where guid=me"
        };
        var externalData = null;
        function getCleanExternalData() {
            var template = {
                accessTokenKey: "",
                accessTokenSecret: "",
                expire_timestamp: 0,
                session_handle: "",
                yahoo_guid: "",
                authorizationUrlWithToken: "",
                requestTokenExpirationTime: 0
            };
            var saveValuesOf = [
                "authorizationUrlWithToken",
                "requestTokenExpirationTime"
            ];
            if (externalData !== null) {
                for (var i = 0, len = saveValuesOf.length; i < len; ++i) {
                    var name = saveValuesOf[i];
                    var value = externalData[name];
                    template[name] = value;
                }
            }
            return template;
        }
        this.init = function (options) {
            var authAs = 0;
            if (!application.isYa) {
                authAs = 1;
            }
            var credentials = CREDENTIALS[authAs];
            let key = credentials["key"];
            let secret = credentials["secret"];
            var settings = {
                realm: API_URL.REALM,
                consumerKey: key,
                consumerSecret: secret,
                requestTokenUrl: API_URL.GET_REQUEST_TOKEN,
                authorizationUrl: API_URL.REQUEST_AUTH,
                accessTokenUrl: API_URL.GET_ACCESS_TOKEN,
                callbackUrl: CALLBACK_URL
            };
            if (typeof options !== "undefined") {
                application.utils.extend(settings, options);
            }
            oAuth = new application.OAuth(settings);
            externalData = getCleanExternalData();
            application.utils.extend(externalData, options);
        };
        this.fixTimestamp = function (correction) {
            oAuth.timestampCorrection = correction;
        };
        this.login = function (externalCallbacks) {
            var callbacks = getCallbacks(externalCallbacks);
            if (authURLIsValid()) {
                application.log("Using existing request token.");
                var params = application.utils.urlQuery2object(externalData.authorizationUrlWithToken.split("?")[1]);
                oAuth.setAccessToken([
                    params["oauth_token"],
                    params["oauth_token_secret"]
                ]);
                callbacks.success(externalData.authorizationUrlWithToken);
                return;
            }
            oAuth.fetchRequestToken(function (url) {
                callbacks.success(url);
            }, function (responseObject) {
                application.log("fetchRequestToken failed.");
                callbacks.failure(responseObject);
                handleOAuthRequestError(responseObject);
            });
        };
        this.getStatistics = function (externalCallbacks) {
            application.log("YAPI: getStatistics called");
            var callbacks = getCallbacks(externalCallbacks);
            if (!$.isAuthorized()) {
                callbacks.always();
                application.log("YAPI: getStatistics canceled. User is not authorized.");
                return;
            }
            var success = function (data) {
                application.log("Yahoo API: getStatistics success.");
                callbacks.always();
                application.log("text:\n" + data.text);
                application.log("status:\n" + data.status);
                var response = JSON.parse(data.text);
                var inboxFolderData = response.query.results.result.folder;
                callbacks.success({
                    unread: inboxFolderData.unread,
                    total: inboxFolderData.total
                });
            };
            var failure = function (responseObject) {
                application.log("Yahoo API: getStatistics failed.");
                callbacks.always();
                handleOAuthRequestError(responseObject);
                callbacks.failure(responseObject);
            };
            queryRequest(QUERY.LETTERS_COUNT, success, failure);
        };
        this.getUserData = function (externalCallbacks) {
            if (!$.isAuthorized()) {
                return;
            }
            var callbacks = getCallbacks(externalCallbacks);
            var success = function (data) {
                application.log("Yahoo API: getUserData success.");
                var response = JSON.parse(data.text);
                application.log(JSON.stringify(response));
                var profile = response.query.results.profile;
                var mailAddress;
                var emails = profile.emails;
                if ("function" == typeof emails.pop) {
                    let primaryIndex;
                    for (let i = 0, len = emails.length; i < len; i++) {
                        let mailbox = emails[i].handle;
                        if (/@(ymail|yahoo|rocketmail)\.com/i.test(mailbox)) {
                            mailAddress = mailbox;
                            break;
                        }
                        if (true === mailbox.primary) {
                            primaryIndex = i;
                        }
                    }
                    if ("undefined" == typeof mailAddress && "undefined" != typeof primaryIndex) {
                        let primaryMailbox = emails[primaryIndex];
                        mailAddress = primaryMailbox.handle;
                    }
                } else {
                    mailAddress = emails.handle;
                }
                callbacks.success({ address: mailAddress });
                callbacks.always();
            };
            var failure = function (responseObject) {
                application.log("Yahoo API: getUserData failed.");
                handleOAuthRequestError(responseObject);
                callbacks.failure();
                callbacks.always();
            };
            queryRequest(QUERY.USER_PROFILE, success, failure);
        };
        this.isAuthorized = function () {
            var accessToken = oAuth.getAccessToken();
            if ("" !== accessToken[0] && "" !== accessToken[1]) {
                application.log("YAPI: user is authorized");
                return true;
            }
            application.log("YAPI: user is not authorized");
            return false;
        };
        this.getProgressListener = function (externalCallbacks) {
            var callbacks = getCallbacks(externalCallbacks);
            return new OAuthLocationListener({
                success: function (verifier) {
                    application.log("OAuth verifier: " + verifier);
                    oAuth.setVerifier(verifier);
                    externalData.authorizationUrlWithToken = "";
                    $.updateAccessToken({ success: callbacks.success });
                    callbacks.always();
                },
                failure: function () {
                    application.log("OAuth callback failure");
                    callbacks.failure();
                    callbacks.always();
                }
            });
        };
        this.logout = function () {
            oAuth.setAccessToken([
                "",
                ""
            ]);
            oAuth.clearAdditionalHeaderParams();
            externalData = getCleanExternalData();
        };
        this.dump = function () {
            return externalData;
        };
        function getRequestToken(externalCallbacks) {
            application.log("Init: get new request token.");
            let callbacks = getCallbacks(externalCallbacks);
            oAuth.fetchRequestToken(function (url) {
                var params = application.utils.urlQuery2object(url.split("?")[1]);
                externalData.authorizationUrlWithToken = url;
                externalData.requestTokenExpirationTime = application.utils.getCurrentTimestamp() + Number(params["oauth_expires_in"]);
                callbacks.success(url);
                callbacks.always();
            }, function (responseObject) {
                application.log("Init: fetchRequestToken failed.");
                handleOAuthRequestError(responseObject);
                callbacks.failure(responseObject);
                callbacks.always();
            });
        }
        function authURLIsValid() {
            var urlExists = "" !== externalData.authorizationUrlWithToken;
            var requestTokenExpired = externalData.requestTokenExpirationTime < application.utils.getCurrentTimestamp();
            return urlExists && !requestTokenExpired;
        }
        function queryRequest(query, success, failure) {
            application.log("queryRequest " + query);
            var callbacks = getCallbacks({
                success: success,
                failure: failure
            });
            if (accessTokenIsExpired()) {
                $.updateAccessToken({
                    success: function () {
                        queryRequest(query, success, failure);
                    },
                    failure: function (response) {
                        callbacks.failure(response);
                    }
                });
                return;
            }
            var connectionTimeout = 10;
            setRequestTimer(connectionTimeout, callbacks.failure);
            oAuth.request({
                url: API_URL.QUERY_ROOT,
                method: "POST",
                data: {
                    format: "json",
                    q: query
                },
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                success: function (data) {
                    cancelRequestTimer();
                    if (data.status === 0) {
                        callbacks.failure(data);
                    } else {
                        callbacks.success(data);
                    }
                },
                failure: function (responseObject) {
                    cancelRequestTimer();
                    callbacks.failure(responseObject);
                }
            });
        }
        function setRequestTimer(delayInSeconds, callback) {
            requestTimer.initWithCallback({
                notify: function () {
                    callback();
                }
            }, delayInSeconds * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
        }
        function cancelRequestTimer() {
            requestTimer.cancel();
        }
        function handleAccessTokenUpdate(data) {
            application.log("New access token received.\n" + JSON.stringify(data));
            var accountData = application.utils.urlQuery2object(data.text);
            application.log("accountData is\n" + JSON.stringify(accountData));
            var token = decodeURIComponent(accountData["oauth_token"]);
            var tokenSecret = accountData["oauth_token_secret"];
            oAuth.setAccessToken([
                token,
                tokenSecret
            ]);
            var tokenExpiresIn = Number(accountData["oauth_expires_in"]);
            scheduleAccessTokenUpdate(tokenExpiresIn - 100);
            externalData.accessTokenKey = token;
            externalData.accessTokenSecret = tokenSecret;
            externalData.session_handle = accountData["oauth_session_handle"];
            externalData.yahoo_guid = accountData["xoauth_yahoo_guid"];
            externalData.expire_timestamp = application.utils.getCurrentTimestamp() + tokenExpiresIn;
        }
        function accessTokenIsExpired() {
            var expireTimestamp = externalData.expire_timestamp;
            var currentTimestamp = application.utils.getCurrentTimestamp();
            var additionalGap = 100;
            var isExpired = !!(currentTimestamp - expireTimestamp - additionalGap > 0);
            return isExpired;
        }
        this.updateAccessToken = function (externalCallbacks) {
            application.log("updateAccessToken called");
            var callbacks = getCallbacks(externalCallbacks);
            var sessionHandle = externalData.session_handle;
            if ("" !== sessionHandle) {
                oAuth.setAdditionalHeaderParams({ "oauth_session_handle": sessionHandle });
            }
            var handleFailure = function (response) {
                application.log("fetchAccessToken failed.");
                callbacks.failure(response);
                handleOAuthRequestError(response);
            };
            var currentToken = oAuth.getAccessToken();
            oAuth.fetchAccessToken(function (response) {
                var responseIsInvalid = 0 === response.status || "undefined" == typeof response.text || "" === response.text;
                if (responseIsInvalid) {
                    oAuth.setAccessToken(currentToken);
                    handleFailure(response);
                    return;
                }
                handleAccessTokenUpdate(response);
                callbacks.success(response);
            }, handleFailure);
        };
        function scheduleAccessTokenUpdate(interval) {
            application.log("Access token update scheduled after " + interval + " seconds interval.");
            accessTokenUpdater.initWithCallback({
                notify: function () {
                    $.updateAccessToken();
                }
            }, interval * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
        }
        function handleOAuthRequestError(responseObject) {
            application.log("OAuth request error:");
            if ("object" !== typeof responseObject) {
                application.log("Unknown error.");
                return;
            }
            application.log("HTTP status: " + responseObject.status);
            try {
                var response = JSON.parse(responseObject.text);
                application.log("Error description:\n" + response.error.description);
            } catch (e) {
                application.log(responseObject.text);
            }
            application.log("OAuth request headers:\n" + JSON.stringify(responseObject.requestHeaders));
            application.log("OAuth response headers:\n" + JSON.stringify(responseObject.responseHeaders));
        }
        var OAuthLocationListener = application.utils.createLocationListener(function (callbacks, aWebProgress, aRequest, aLocation) {
            var spec = aLocation.spec;
            application.log("oauthLocationListener: " + spec);
            try {
                var url = aLocation.QueryInterface(Components.interfaces.nsIURL);
            } catch (e) {
                return;
            }
            if (-1 == spec.indexOf(CALLBACK_URL)) {
                return;
            }
            var params = application.utils.urlQuery2object(url.query);
            if ("oauth_verifier" in params) {
                return callbacks.success(params["oauth_verifier"]);
            } else {
                application.log("oauthLocationListener: oauth_verifier is absent in callback url");
                return callbacks.failure();
            }
        });
        function getCallbacks(callbacks) {
            var completeCallbacks = callbacks || {};
            var doNothing = function () {
            };
            [
                "success",
                "failure",
                "always"
            ].forEach(function (item, i) {
                if (!completeCallbacks.hasOwnProperty(item) || "function" !== typeof completeCallbacks[item]) {
                    completeCallbacks[item] = doNothing;
                }
            });
            return completeCallbacks;
        }
        function saveApiData(data) {
            if ("undefined" == typeof application.settings.accountData) {
                application.settings.accountData = {};
            }
            application.settings.accountData.apiData = data;
            application.SaveStorage();
        }
    }();
    return YahooMailAPI;
};
