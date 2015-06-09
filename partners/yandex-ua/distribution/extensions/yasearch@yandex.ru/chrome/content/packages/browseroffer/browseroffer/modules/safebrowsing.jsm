"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const USER_ACTION_SETTING_PREFIX = "safebrowsing.yandexBrowser.date.action.";
const USER_ACTION_BROWSER_INSTALLED_SETTING_NAME = "installed";
const USER_ACTION_BROWSER_NOT_INSTALLED_SETTING_NAME = "notInstalled";
var module = function (app, common) {
    let browserofferSB = {
        SUGGEST_TYPE: {
            showNothing: 0,
            showNotInstalled: 1,
            showInstalled: 2
        },
        get app() {
            return this._app;
        },
        init: function (application) {
            this._app = application;
            this._initPlatformProvider();
        },
        finalize: function () {
            this._finalizePlatformProvider();
            this._app = null;
        },
        getListenerForPage: function ({url}) {
            if (url.indexOf("about:blocked?") !== 0) {
                return null;
            }
            return this._createPlatformDataProvider();
        },
        handleUserAction: function () {
            let yaBrowserInstalled = this.app.api.Integration.yandexBrowser.isInstalled;
            this.sendStatistics(yaBrowserInstalled ? "run" : "install");
            this._setPref(yaBrowserInstalled ? USER_ACTION_BROWSER_INSTALLED_SETTING_NAME : USER_ACTION_BROWSER_NOT_INSTALLED_SETTING_NAME, Date.now().toString());
            if (yaBrowserInstalled) {
                this.app.api.Integration.yandexBrowser.openBrowser(this.app.browserLinks.launch);
            } else {
                this.app.api.Controls.navigateBrowser({
                    url: this.app.browserLinks.install,
                    target: "new tab"
                });
            }
        },
        getPreviousUserActionTime: function () {
            return Math.max(this._getPref(USER_ACTION_BROWSER_INSTALLED_SETTING_NAME, null), this._getPref(USER_ACTION_BROWSER_NOT_INSTALLED_SETTING_NAME, null));
        },
        isYandexBrowserDefault: function () {
            return this.app.api.Integration.yandexBrowser.isDefault;
        },
        sendStatistics: function (aAction) {
            this.app.sendStatistics("safebrowsing", aAction);
        },
        _initPlatformProvider: function () {
            if ([
                    "mac",
                    "windows"
                ].indexOf(this.app.api.Environment.os.name) < 0) {
                return;
            }
            if (this.app.api.Environment.branding.brandID !== "yandex") {
                return;
            }
            this.app.api.ElementsPlatform.addObjectProvider(this);
        },
        _finalizePlatformProvider: function () {
            this.app.api.ElementsPlatform.removeObjectProvider(this);
        },
        _createPlatformDataProvider: function () {
            return {
                onPageMessage: function (aMessage, aData) {
                    if (aMessage !== "browseroffer") {
                        return;
                    }
                    if (aData.command === "sendStat") {
                        browserofferSB.sendStatistics(aData.value);
                    }
                },
                onQueryObject: function (aObjName) {
                    if (aObjName !== "yandexBrowserIntegration") {
                        return;
                    }
                    return {
                        get offerType() {
                            let elipsePeriodTime = 21 * 24 * 60 * 60 * 1000;
                            if (Math.abs(Date.now() - browserofferSB.getPreviousUserActionTime()) < elipsePeriodTime) {
                                return browserofferSB.SUGGEST_TYPE.showNothing;
                            }
                            let isDefault = browserofferSB.isYandexBrowserDefault();
                            if (isDefault === false) {
                                return browserofferSB.SUGGEST_TYPE.showInstalled;
                            }
                            if (!isDefault) {
                                return browserofferSB.SUGGEST_TYPE.showNotInstalled;
                            }
                            return browserofferSB.SUGGEST_TYPE.showNothing;
                        },
                        performBrowser: function () {
                            return browserofferSB.handleUserAction();
                        }
                    };
                }
            };
        },
        _getPref: function (aPrefName, aDefaultValue) {
            return this.app.getPref(USER_ACTION_SETTING_PREFIX + aPrefName, aDefaultValue);
        },
        _setPref: function (aPrefName, aStrValue) {
            return this.app.setPref(USER_ACTION_SETTING_PREFIX + aPrefName, aStrValue);
        }
    };
    return browserofferSB;
};
