"use strict";
var EXPORTED_SYMBOLS = ["module"];
var instance = null;
function module(proxy) {
    var LoginForm = function () {
        if (!instance) {
            instance = this;
        }
        this.loginPage = "/res/pages/login.html";
        this.loginPageUrl = proxy.api.Package.resolvePath(this.loginPage);
        this.lastLoginWindow = null;
        this.loginWindowType = "hotmail:auth";
        this.closeOnDeactivate = false;
        return instance;
    };
    LoginForm.prototype = {
        show: function (callback, login) {
            var callbackFinal = false;
            var _this = this;
            function executeCallback() {
                if (!callbackFinal) {
                    var args = arguments;
                    var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
                    timer.initWithCallback(function () {
                        callback.apply({}, args);
                    }, 0, timer.TYPE_ONE_SHOT);
                }
            }
            function executeCallbackFinal() {
                executeCallback.apply(this, arguments);
                callbackFinal = true;
            }
            var WM = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
            var WW = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
            var browserWindow = WM.getMostRecentWindow("navigator:browser");
            if (this.lastLoginWindow && !this.lastLoginWindow.closed) {
                this.lastLoginWindow.focus();
                return;
            }
            var form = this.lastLoginWindow = WW.openWindow(null, this.loginPageUrl, this.loginWindowType, "dialog,centerscreen", null);
            form.addEventListener("load", function (event) {
                if (login) {
                    form.fillLoginField && form.fillLoginField(login);
                }
            }, false, true);
            form.addEventListener("close", function (event) {
                executeCallbackFinal("ERROR_ABORTED");
            }, false);
            form.addEventListener("deactivate", function (event) {
                if (_this.closeOnDeactivate) {
                    executeCallbackFinal("ERROR_ABORTED");
                    event.target.close();
                }
            }, false);
            form.addEventListener("-x-hotmail-auth", function (event) {
                executeCallback("AUTH_DATA", event.originalTarget.eventData);
            }, false, true);
            form.addEventListener("-x-hotmail-cancel", function (event) {
                executeCallback("ERROR_CANCEL");
            }, false, true);
            this.lastLoginWindow = form;
            return form;
        },
        showDTDErrorMessage: function (key) {
            if (this.lastLoginWindow && this.lastLoginWindow.showDTDErrorMessage && !this.lastLoginWindow.closed) {
                this.lastLoginWindow.showDTDErrorMessage(key);
            }
        },
        hide: function () {
            this.lastLoginWindow && this.lastLoginWindow.close && this.lastLoginWindow.close();
        }
    };
    return LoginForm;
}
