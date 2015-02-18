"use strict";
var EXPORTED_SYMBOLS = ["module"];
var instances = [];
function module(proxy) {
    var HotmailApplicationAPI = proxy.module("hotmail.ApplicationAPI");
    var ApplicationUI = proxy.module("hotmail.ApplicationUI");
    var Storage = proxy.module("sklib.Storage");
    var utils = proxy.module("sklib.utils");
    var Settings = proxy.module("sklib.Settings");
    var pop3 = proxy.module("mail.pop3");
    proxy.onmoduleunload = function () {
        for (var i = 0, l = instances.length; i < l; ++i) {
            try {
                instances[i].onunload();
            } catch (e) {
            }
        }
    };
    var Application = function (environment) {
        instances.push(this);
        this.notifyTopic = "hotmail-" + utils.getRandomString(8);
        this.ui = new ApplicationUI(this);
        this.api = new HotmailApplicationAPI(this);
        this.appStorage = new Storage("userdata");
        this.displayData = {};
        this.settings = this.initSettings();
        this.messageList = null;
        this.credentials = {};
        var mailbox = this.appStorage.getValue("mailbox");
        if (mailbox) {
            this.initUserData(mailbox);
            this.setDisplayData("mailbox", mailbox);
            if (this.passwordStored) {
                this.setDisplayData("auth", "AUTH_UNKNOWN");
                this.api.updateTimer.start(true);
            } else {
                this.setDisplayData("auth", "AUTH_NONE");
            }
        } else {
            this.setDisplayData("auth", "AUTH_NONE");
        }
    };
    Application.prototype = {
        constructor: Application,
        initSettings: function () {
            var _this = this;
            var settings = new Settings();
            settings.addHandler("SettingsChanged", function (topic, key, value) {
                _this.onsettingschanged(key, value);
            });
            return settings;
        },
        initUserData: function (mailbox) {
            var userStorage = this.userStorage = new Storage(mailbox);
            var passwordStored = userStorage.getValue("passwordStored");
            if (passwordStored) {
                var loginInfo = this.api.credentials.getInfo(mailbox);
                if (loginInfo && loginInfo.password) {
                    this.credentials.login = loginInfo.username;
                    this.credentials.password = loginInfo.password;
                    this.passwordStored = true;
                } else {
                    userStorage.setValue("passwordStored", false);
                    this.passwordStored = false;
                }
            }
            var messages = userStorage.getValue("messages");
            if (!messages) {
                messages = [];
                this.firstRun = true;
            } else {
                this.firstRun = false;
            }
            this.messageList = pop3.MessageList.cast(messages);
            proxy.logger.trace([
                "this.messageList",
                this.messageList
            ]);
            proxy.logger.trace(this.messageList.getMessagesArray());
        },
        setDisplayData: function () {
            switch (arguments.length) {
            case 1:
                this.displayData = arguments[0];
                break;
            case 2:
                this.displayData[arguments[0]] = arguments[1];
                break;
            }
            this.ui.updateView();
        },
        onsettingschanged: function (key, value) {
            switch (key) {
            case "update-interval":
                this.api.updateTimer.setUpdateIntervalAsMinutes(value);
                break;
            case "show-button-name":
                this.ui.updateView();
                break;
            }
        },
        onauth: function (data) {
            this.appStorage.setValue("mailbox", data.login);
            this.appStorage.setValue("lastlogin", data.login);
            this.initUserData(data.login);
            this.userStorage.setValue("mailbox", data.login);
            this.setDisplayData("auth", "AUTH_UNKNOWN");
            this.setDisplayData("mailbox", data.login);
            if (data.store) {
                this.api.credentials.setInfo(data.login, data.password);
                this.userStorage.setValue("passwordStored", true);
            } else {
                this.userStorage.setValue("passwordStored", false);
            }
            this.credentials.login = data.login;
            this.credentials.password = data.password;
            this.api.updateTimer._lastUpdatedTimestamp = +new Date();
            this.api.updateTimer.start();
        },
        ondeauth: function (force) {
            this.setDisplayData("auth", "AUTH_NONE");
            this.setDisplayData("mailbox", "");
            this.appStorage.cleanValue("mailbox");
            var storeLastLogin = Boolean(this.settings.getValue("store-last-login-after-logout"));
            if (force && !storeLastLogin) {
                this.appStorage.cleanValue("lastlogin");
            }
        },
        onreaded: function () {
            var currentList = this.messageList;
            this.userStorage.setValue("messages", currentList.getMessagesArray());
            this.onunreadcount(currentList.getUnreadCount());
        },
        onuidl: function (data) {
            var currentList = this.messageList;
            var newList = pop3.MessageList.createFromUIDLResponse(data);
            currentList.update(newList);
            if (this.firstRun) {
                this.firstRun = false;
                currentList.setAllRead();
            }
            this.userStorage.setValue("messages", currentList.getMessagesArray());
            this.onunreadcount(currentList.getUnreadCount());
        },
        onunreadcount: function (count) {
            if (typeof count !== "undefined") {
                this.setDisplayData("auth", "AUTH_OK");
                this.setDisplayData("unreadCount", count);
            } else {
                this.setDisplayData("auth", "AUTH_UNKNOWN");
                this.setDisplayData("unreadCount", 0);
            }
        },
        onunload: function () {
        },
        isAuth: function () {
            return !!this.appStorage.getValue("mailbox");
        }
    };
    return Application;
}
