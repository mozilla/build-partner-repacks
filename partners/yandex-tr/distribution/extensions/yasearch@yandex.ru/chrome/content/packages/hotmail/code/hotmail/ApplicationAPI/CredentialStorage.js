"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var HotmailCredentialStorage = function () {
        var HOTMAIL_HOSTNAME = "https://login.live.com", HOTMAIL_SUBMIT_URL = "https://login.live.com/login.srf", HOTMAIL_HTTP_REALM = null, HOTMAIL_LOGIN_FIELD = "login", HOTMAIL_PASSWORD_FIELD = "passwd";
        var initHotmailLoginInfo = function (username, password) {
            var loginInfo = Components.classes["@mozilla.org/login-manager/loginInfo;1"].createInstance(Components.interfaces.nsILoginInfo);
            loginInfo.init(HOTMAIL_HOSTNAME, HOTMAIL_SUBMIT_URL, HOTMAIL_HTTP_REALM, username, password, HOTMAIL_LOGIN_FIELD, HOTMAIL_PASSWORD_FIELD);
            return loginInfo;
        };
        this.setInfo = function (username, password) {
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var stored = false;
            var loginInfo = initHotmailLoginInfo(username, password);
            var currentLoginInfo = this.getInfo(username);
            if (currentLoginInfo === false) {
                return false;
            }
            try {
                if (currentLoginInfo) {
                    proxy.logger.trace("Login already presents. Modifying");
                    loginManager.modifyLogin(currentLoginInfo, loginInfo);
                } else {
                    proxy.logger.trace("Add login");
                    loginManager.addLogin(loginInfo);
                }
                stored = true;
            } catch (e) {
                proxy.logger.warn(e);
            }
            return stored;
        };
        this.cleanInfo = function (username, password) {
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var loginInfo = initHotmailLoginInfo(username, password);
            var cleared = false;
            try {
                loginManager.removeLogin(loginInfo);
                cleared = true;
            } catch (e) {
                proxy.logger.warn(e);
            }
            return cleared;
        };
        this.getInfo = function (login) {
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var logins;
            var accessGranted = false;
            try {
                logins = loginManager.findLogins({}, HOTMAIL_HOSTNAME, HOTMAIL_SUBMIT_URL, HOTMAIL_HTTP_REALM);
                accessGranted = true;
            } catch (e) {
                proxy.logger.warn(e);
            }
            if (accessGranted) {
                if (logins && logins.length > 0) {
                    var foundLogin = null;
                    logins.forEach(function (x) {
                        if (x.username == login)
                            foundLogin = x;
                    });
                    return foundLogin;
                } else {
                    return null;
                }
            } else {
                return false;
            }
        };
    };
    return HotmailCredentialStorage;
}
