var EXPORTED_SYMBOLS = ["module"];
var module = function (application) {
    var WM = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    var WW = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    var settingsAPI = application.api.Settings;
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    var YahooMail = function () {
    };
    YahooMail.prototype = new function () {
        var mailAPI = null;
        var $ = this;
        var microBrowserPath = application.api.Package.resolvePath("/content/microbrowser/microbrowser.xul");
        var authWindow = null;
        var widgetInstanceId = "";
        this._mailboxUpdater = null;
        this.url = {
            main: "http://mail.yahoo.com",
            compose: "http://compose.mail.yahoo.com",
            read: "http://mail.yahoo.com",
            contacts: "http://address.mail.yahoo.com"
        };
        var widgetState = {
            authorized: false,
            online: true,
            totalLetters: 0,
            newLetters: 0,
            mailAddress: ""
        };
        this.__defineSetter__("state", function (state) {
            application.log("Widget state update:\n" + JSON.stringify(state));
            var stateWasChanged = false;
            for (var i in state) {
                var newValue = state[i];
                if (widgetState.hasOwnProperty(i) && widgetState[i] !== newValue) {
                    widgetState[i] = newValue;
                    stateWasChanged = true;
                }
            }
            if (stateWasChanged) {
                application.notify("state-changed");
            }
            application.notify("state-updated");
        });
        this.__defineGetter__("state", function () {
            return widgetState;
        });
        this.init = function (_mailAPI) {
            application.log("Yahoo! mail init.");
            var state = loadWidgetState();
            $.state = state;
            mailAPI = _mailAPI;
            mailAPI.init(loadAPIState());
            if (!state.mailAddress) {
                updateUserEmailAddress();
            }
            $.updateMailboxStatistics();
            observerService.addObserver({
                observe: function () {
                    if ("" === widgetInstanceId) {
                        widgetInstanceId = application.WIID;
                        var updateInterval = settingsAPI.getValue("update-interval", widgetInstanceId);
                        scheduleMailStatisticsUpdate(updateInterval);
                        settingsAPI.observeChanges({
                            onSettingChange: function (name, value) {
                                if ("update-interval" === name) {
                                    scheduleMailStatisticsUpdate(value);
                                }
                            }
                        }, widgetInstanceId);
                    }
                }
            }, "widget-instance-created", false);
            observerService.addObserver(authWindowCloseListener, "auth-window-closed", false);
            application.log("Yahoo! mail init end.");
        };
        this.destroy = function () {
            saveState();
            $._mailboxUpdater && $._mailboxUpdater.cancel();
            settingsAPI.ignoreChanges(widgetInstanceId);
        };
        this.login = function () {
            if (null !== authWindow && false === authWindow.closed) {
                authWindow.focus();
                return;
            }
            mailAPI.login({
                success: function (url) {
                    openAuthorizationPage(url);
                },
                failure: function (response) {
                    application.log("Login failed.\n" + JSON.stringify(response));
                    handleAPIError(response, function () {
                        $.login();
                    });
                }
            });
        };
        this.logout = function () {
            $.state = {
                authorized: false,
                totalLetters: 0,
                newLetters: 0,
                mailAddress: ""
            };
            application.ClearStorage();
            mailAPI.logout();
            $._mailboxUpdater && $._mailboxUpdater.cancel();
        };
        this.updateMailboxStatistics = function () {
            application.log("updateMailboxStatistics called");
            if (statisticsIsAlreadyRequested) {
                application.log("updateMailboxStatistics request is already sent.");
                return;
            }
            statisticsIsAlreadyRequested = true;
            mailAPI.getStatistics({
                success: function (data) {
                    statisticsIsAlreadyRequested = false;
                    $.state = {
                        authorized: true,
                        online: true,
                        newLetters: data.unread,
                        totalLetters: data.total
                    };
                },
                failure: function (response) {
                    statisticsIsAlreadyRequested = false;
                    handleAPIError(response, function () {
                        $.updateMailboxStatistics();
                    });
                },
                always: function () {
                    statisticsIsAlreadyRequested = false;
                }
            });
        };
        this.updateEmailTest = function () {
            updateUserEmailAddress();
        };
        this.isAuth = function () {
            return widgetState.authorized;
        };
        var statisticsIsAlreadyRequested = false;
        var authWindowCloseListener = {
            observe: function (sub, topic, data) {
                if ("auth-window-closed" === topic) {
                    mailAPI.logout();
                }
            }
        };
        function scheduleMailStatisticsUpdate(period) {
            application.log("Mailbox statistics will be updated every " + period + " minute(s).");
            $._mailboxUpdater = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
            $._mailboxUpdater.initWithCallback({
                notify: function () {
                    application.log("Run scheduled update.");
                    $.updateMailboxStatistics();
                }
            }, period * 1000 * 60, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
        }
        function openAuthorizationPage(url) {
            application.log("Authorization page url: " + url);
            var name = "yahoomail-auth";
            var features = "centerscreen,location=yes,status=yes,innerWidth=500,innerHeight=600,resizable=yes";
            var arguments = {
                url: url,
                progressListener: mailAPI.getProgressListener({
                    success: function () {
                        $.state = {
                            authorized: true,
                            online: true
                        };
                        $.updateMailboxStatistics();
                        updateUserEmailAddress();
                    },
                    failure: function () {
                    },
                    always: function () {
                        authWindow.close();
                    }
                }),
                notifyMask: Components.interfaces.nsIWebProgress.NOTIFY_LOCATION
            };
            var topBrowserWindow = WM.getMostRecentWindow("navigator:browser");
            authWindow = topBrowserWindow.openDialog(microBrowserPath, name, features, arguments);
            authWindow.application = application;
        }
        function saveState() {
            if ("undefined" == typeof application.settings.accountData) {
                application.settings.accountData = {};
            }
            application.settings.accountData.userData = $.state;
            application.settings.accountData.apiData = mailAPI.dump();
            application.SaveStorage();
        }
        function updateUserEmailAddress() {
            application.log("updateUserEmailAddress called");
            mailAPI.getUserData({
                success: function (data) {
                    $.state = {
                        online: true,
                        mailAddress: data.address
                    };
                },
                failure: function () {
                    $.state = { online: false };
                }
            });
        }
        function loadWidgetState() {
            var state = loadSavedState();
            if (null !== state && "undefined" !== typeof state.userData) {
                return state.userData;
            }
            return {};
        }
        function loadAPIState() {
            var state = loadSavedState();
            if (null !== state && "undefined" !== typeof state.apiData) {
                return state.apiData;
            }
            return {};
        }
        var loadSavedState = function () {
            var savedState = null;
            return function () {
                if (null === savedState) {
                    savedState = application.loadAccountData();
                }
                return savedState;
            };
        }();
        function handleAPIError(response, callback) {
            if ("object" == typeof response) {
                if (isFixableTimestampError(response)) {
                    mailAPI.fixTimestamp(getTimestampCorrection(response));
                    callback();
                    return;
                } else if (isNotFixableTimestampError(response)) {
                    application.log("Trying to fix directly not fixable timestamp error.");
                    mailAPI.updateAccessToken({
                        success: function () {
                            callback();
                        },
                        failure: function (response) {
                            handleAPIError(response, callback);
                        }
                    });
                    return;
                } else {
                    application.log("Unknown API error.\n" + response.text);
                }
            }
            $.state = { online: false };
        }
        function isNotFixableTimestampError(responseObject) {
            let response = responseObject.text;
            if (responseObject.status == 401 && response.indexOf("OST_OAUTH_TIMESTAMP_REFUSED_ERROR") !== -1) {
                application.log("Not fixable timestamp error detected");
                return true;
            }
            return false;
        }
        function isFixableTimestampError(responseObject) {
            let response = responseObject.text;
            if (responseObject.status == 401 && response.indexOf("timestamp_refused") !== -1) {
                application.log("Fixable timestamp error detected");
                return true;
            }
            return false;
        }
        function getTimestampCorrection(responseObject) {
            let response = responseObject.text;
            let responseData = application.utils.urlQuery2object(response);
            let validTimestampsInterval = responseData["oauth_acceptable_timestamps"];
            let validTimestampsBorders = validTimestampsInterval.split("-");
            let validTimestamp = Math.round((Number(validTimestampsBorders[1]) + Number(validTimestampsBorders[0])) / 2);
            let shift = validTimestamp - application.utils.getCurrentTimestamp();
            application.log("shift: " + shift);
            return shift;
        }
    }();
    return YahooMail;
};
