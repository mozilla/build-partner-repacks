"use strict";
var EXPORTED_SYMBOLS = ["module"];
var instance = null;
function module(proxy) {
    var CredentialStorage = proxy.module("hotmail.ApplicationAPI.CredentialStorage");
    var HotmailLoginForm = proxy.module("hotmail.ui.LoginForm");
    var Settings = proxy.module("sklib.Settings");
    var pop3 = proxy.module("mail.pop3");
    var POP3Client = pop3.Client;
    var UpdateTimer = proxy.module("sklib.UpdateTimer");
    var HotmailApplicationAPI = function (application) {
        if (!instance) {
            instance = this;
        }
        var _this = this;
        this.application = application;
        this.credentials = new CredentialStorage();
        this.pop3Client = new POP3Client(["ssl"], "pop3.live.com", 995);
        this.updateTimer = new UpdateTimer();
        this.updateTimer.ontimer = function (callbacks) {
            _this.getUnreadCountAsync(function (result, count) {
                switch (result) {
                case "ERR_USER":
                case "ERR_PASS":
                    _this.application.ondeauth();
                    callbacks.success();
                    break;
                case "OK":
                    proxy.logger.debug("onunreadcount(count), count=" + count);
                    _this.application.onunreadcount(count);
                    callbacks.success();
                    break;
                case "ERR_TIMEOUT":
                    _this.application.onunreadcount();
                    callbacks.error();
                    break;
                }
            }, _this.application.credentials.login, _this.application.credentials.password);
        };
        var settings = new Settings();
        this.updateTimer.setUpdateIntervalAsMinutes(settings.getValue("update-interval"));
        return instance;
    };
    HotmailApplicationAPI.NavigationURL = {
        read: "http://mail.live.com/default.aspx?rru=getmsg",
        compose: "http://mail.live.com/default.aspx?rru=compose",
        addressbook: "http://mail.live.com/default.aspx?rru=contacts"
    };
    HotmailApplicationAPI.prototype = {
        getUnreadCountAsync: function (callback, user, password) {
            var client = this.pop3Client;
            var commands = [];
            var _this = this;
            var timeoutTriggered = false;
            var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
            timer.initWithCallback(function () {
                proxy.logger.warn("getUnreadCountAsync timeout");
                callback("ERR_TIMEOUT");
                client.abort();
            }, 5000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
            var initCommand = new pop3.Commands.Init();
            initCommand.onresponse = function (data) {
                timer.cancel();
            };
            var userCommand = new pop3.Commands.User(user);
            userCommand.onresponse = function (data) {
                proxy.logger.trace(data);
                if (!this.isStatusOk()) {
                    callback("ERR_USER");
                    client.abort();
                }
            };
            var passCommand = new pop3.Commands.Pass(password);
            passCommand.onresponse = function (data) {
                proxy.logger.trace(data);
                if (!this.isStatusOk()) {
                    callback("ERR_PASS");
                    client.abort();
                } else {
                    proxy.logger.debug("passCommand.onresponse, data=" + data);
                    callback("OK");
                }
            };
            var uidlCommand = new pop3.Commands.Uidl();
            uidlCommand.onresponse = function (data) {
                proxy.logger.debug("uidlCommand.onresponse, data=" + data);
                if (this.isStatusOk()) {
                    proxy.logger.debug("uidlCommand.onresponse, data=" + data);
                    _this.application.onuidl(data);
                } else {
                    proxy.logger.debug("uidlCommand.onresponse ERROR");
                    callback("ERR_UIDL");
                    client.abort();
                }
            };
            commands.push(initCommand);
            commands.push(userCommand);
            commands.push(passCommand);
            commands.push(uidlCommand);
            commands.push(new pop3.Commands.Quit());
            client.executeCommands(commands);
            var watcher = {
                abort: function () {
                    client.abort();
                }
            };
            return watcher;
        },
        cmd_update: function () {
            this.updateTimer.update();
        },
        cmd_options: function (id) {
            proxy.api.Controls.openSettingsDialog(null, id);
        },
        cmd_navigate: function (page) {
            if (HotmailApplicationAPI.NavigationURL.hasOwnProperty(page)) {
                var url = HotmailApplicationAPI.NavigationURL[page];
                proxy.api.Controls.navigateBrowser({
                    url: url,
                    target: "new tab"
                });
            }
            if (page == "read") {
                this.application.messageList.setAllRead();
                this.application.onreaded();
            }
        },
        cmd_login: function () {
            var _this = this;
            var loginForm = new HotmailLoginForm();
            var watcher = null;
            var loginCallback = function (event, loginData) {
                switch (event) {
                case "AUTH_DATA":
                    proxy.logger.trace("AUTH_DATA");
                    watcher = _this.getUnreadCountAsync(function (result, count) {
                        proxy.logger.trace([
                            "RESULT",
                            result,
                            count
                        ]);
                        switch (result) {
                        case "OK":
                        case "ERR_UIDL":
                            loginForm.hide();
                            _this.application.onauth(loginData);
                            break;
                        case "ERR_USER":
                        case "ERR_PASS":
                            loginForm.showDTDErrorMessage("hotmail.loginform.error.auth");
                            break;
                        case "ERR_TIMEOUT":
                            loginForm.showDTDErrorMessage("hotmail.loginform.error.server");
                            break;
                        }
                    }, loginData.login, loginData.password);
                    break;
                case "ERROR_ABORTED":
                case "ERROR_CANCEL":
                    watcher && watcher.abort();
                    break;
                }
            };
            var lastUsedLogin = this.application.appStorage.getValue("lastlogin");
            loginForm.show(loginCallback, lastUsedLogin);
        },
        cmd_logout: function () {
            this.updateTimer.stop();
            this.application.ondeauth(true);
        }
    };
    return HotmailApplicationAPI;
}
