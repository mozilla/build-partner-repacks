"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
let module = function (app, common) {
    app._elementsProvider = null;
    app._showWidgetSuggestSetting = null;
    app._widgetSuggestHistorySettingName = "widgetSuggest.history";
    app._widgetSuggestHistory = Object.create(null);
    app.config = {
        pagesToCheck: [
            {
                domain: ["vk.com"],
                widgetID: "http://bar-widgets.yandex.ru/packages/approved/91/manifest.xml#profile",
                name: "vk"
            },
            {
                domain: [
                    "odnoklassniki.ru",
                    "ok.ru"
                ],
                cookie: [
                    "JSESSIONID",
                    "AUTHCODE"
                ],
                widgetID: "http://bar-widgets.yandex.ru/packages/approved/140/manifest.xml#odnoklassniki",
                name: "ok"
            },
            {
                domain: ["facebook.com"],
                cookie: ["c_user"],
                widgetID: "http://bar-widgets.yandex.ru/packages/approved/115/manifest.xml#facebook",
                name: "fb"
            }
        ],
        browserLinks: {
            install: "http://browser.yandex.ru/desktop/?head=security&from=link_element_neyb_safe_|&banerid=0456000000#safe",
            launch: "http://browser.yandex.ru/desktop/?head=security&from=link_element_yabr-installed_safe_|&banerid=0456000000#safe",
            noflash: "http://browser.yandex.ru/desktop/?head=flash&from=link_element_neyb_no-flash_|&banerid=0456510000"
        },
        branding: {
            tb: {
                pagesToCheck: [{
                        domain: ["facebook.com"],
                        cookie: ["c_user"],
                        widgetID: "http://bar-widgets.yandex.ru/packages/approved/131/manifest.xml#facebook",
                        name: "fb"
                    }],
                browserLinks: {
                    install: "http://browser.yandex.com.tr/desktop/?head=security&from=link_element_neyb_safe_|&banerid=0456000000#safe",
                    launch: "http://browser.yandex.com.tr/desktop/?head=security&from=link_element_yabr-installed_safe_|&banerid=0456000000#safe",
                    noflash: "http://browser.yandex.com.tr/desktop/?head=flash&from=link_element_neyb_no-flash_|&banerid=0456510000"
                }
            },
            ua: {
                browserLinks: {
                    install: "http://browser.yandex.ua/desktop/?head=security&from=link_element_neyb_safe_|&banerid=0456000000#safe",
                    launch: "http://browser.yandex.ua/desktop/?head=security&from=link_element_yabr-installed_safe_|&banerid=0456000000#safe",
                    noflash: "http://browser.yandex.ua/desktop/?head=flash&from=link_element_neyb_no-flash_|&banerid=0456510000"
                }
            }
        }
    };
    app.Settings = {
        getMainTemplate: function browseroffer_Settings_getMainTemplate(aWidgetUnitName, aWidgetInstanceID) {
            if ([
                    "mac",
                    "windows"
                ].indexOf(app.api.Environment.os.name) === -1) {
                return null;
            }
            return common.utils.readFile("content/settings.xml");
        }
    };
    app.init = function browseroffer_init(common, resources) {
        resources.browser.urlBarItems = { button: 10050 };
        resources.browser.styles.push("/browseroffer/content/styles/browser.css");
        this.ETLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
        this._initElementsProvider();
        this._initWidgetSuggestHistory();
        let widgetsIds = this.config.pagesToCheck.reduce(function (aIds, socObj) {
            aIds.push(socObj.widgetID);
            return aIds;
        }, []);
        let widgetsInfo = this._checkWidgetsAreActive(widgetsIds);
        for (let widgetID in widgetsInfo) {
            if (widgetsInfo[widgetID]) {
                this.markWidgetAdded(widgetID);
            }
        }
    };
    app.finalize = function browseroffer_finalize() {
        this._finalizeElementsProvider();
        this._finalizeWidgetSuggestHistory();
    };
    app.onSettingChange = function browseroffer_onSettingChange(aSettingName, aValue) {
        switch (aSettingName) {
        case "showContextWidgetSuggest":
            this._showWidgetSuggestSetting = aValue;
            break;
        default:
            break;
        }
    };
    app.shouldAmendContextMenu = function browseroffer_shouldAmendContextMenu() {
        return this.api.Settings.getValue("showContextMenuLink");
    };
    app.shouldMonitorFlash = function browseroffer_shouldMonitorFlash() {
        if ([
                "mac",
                "windows"
            ].indexOf(this.api.Environment.os.name) === -1) {
            return false;
        }
        let pluginHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
        let installed = pluginHost.getPluginTags().some(function (p) {
            return p.name === "Shockwave Flash";
        });
        return !installed;
    };
    app.shouldPerformSuggest = function browseroffer_shouldPerformSuggest() {
        if (this._showWidgetSuggestSetting === null) {
            this._showWidgetSuggestSetting = this.api.Settings.getValue("showContextWidgetSuggest");
        }
        return this._showWidgetSuggestSetting;
    };
    app.checkBrowserConditions = function browseroffer_checkBrowserConditions() {
        return this.api.Integration.yandexBrowser.isDefault === false;
    };
    app.checkNoFlashConditions = function browseroffer_checkNoFlashConditions() {
        if (this.api.Integration.yandexBrowser.isDefault === true) {
            return false;
        }
        let eclipseTime = 7 * 24 * 60 * 60 * 1000;
        let lastActionTime = this.api.Settings.getValue("noflash.userActionTime");
        if (Math.abs(Date.now() - lastActionTime) < eclipseTime) {
            return false;
        }
        return true;
    };
    app.checkWidgetSuggestConditions = function browseroffer_checkWidgetSuggestConditions(aHost) {
        let emptyResult = [];
        for (let i = 0; i < this.config.pagesToCheck.length; i++) {
            let pageObj = this.config.pagesToCheck[i];
            if (pageObj.domain.indexOf(aHost) === -1) {
                continue;
            }
            let suggestHistory = this._widgetSuggestHistory[pageObj.widgetID];
            if (suggestHistory.existed || suggestHistory.counter >= 3) {
                return emptyResult;
            }
            let widgetIsActive = this._checkWidgetIsActive(pageObj.widgetID);
            if (widgetIsActive) {
                suggestHistory.existed = true;
                return emptyResult;
            }
            if (widgetIsActive === false) {
                if (this._userSocialAuthorized(pageObj.name)) {
                    if (suggestHistory.shownAt) {
                        if (suggestHistory.shownAt < 0) {
                            let eclipseTime = 60 * 60 * 1000;
                            let shownAtTime = -suggestHistory.shownAt;
                            if (Math.abs(Date.now() - shownAtTime) > eclipseTime) {
                                this.pauseWidgetSuggestion(pageObj.widgetID, shownAtTime + eclipseTime);
                            }
                        }
                        if (suggestHistory.shownAt > 0) {
                            let eclipseTime = 7 * 24 * 60 * 60 * 1000;
                            let shownAtTime = suggestHistory.shownAt;
                            if (Math.abs(Date.now() - shownAtTime) > eclipseTime) {
                                this._playWidgetSuggestion(pageObj.widgetID);
                            } else {
                                return emptyResult;
                            }
                        }
                    } else {
                        this._playWidgetSuggestion(pageObj.widgetID);
                    }
                    return [
                        pageObj.name,
                        pageObj.widgetID
                    ];
                }
            }
            break;
        }
        return emptyResult;
    };
    app.markWidgetAdded = function browseroffer_markWidgetAdded(aWidgetID) {
        let suggestHistory = this._widgetSuggestHistory[aWidgetID];
        if (!suggestHistory) {
            throw new Error("Unknown social page widget added: " + aWidgetID);
        }
        suggestHistory.existed = true;
    };
    app.pauseWidgetSuggestion = function browseroffer_pauseWidgetSuggestion(aWidgetID, aSinceTime) {
        let suggestHistory = this._widgetSuggestHistory[aWidgetID];
        let timestamp = aSinceTime || Date.now();
        if (!suggestHistory) {
            throw new Error("Unknown social page for suggest: " + aWidgetID);
        }
        if (!suggestHistory.counter) {
            suggestHistory.counter = 0;
        }
        suggestHistory.counter++;
        suggestHistory.shownAt = timestamp;
    };
    app._playWidgetSuggestion = function browseroffer_playWidgetSuggestion(aWidgetID) {
        let suggestHistory = this._widgetSuggestHistory[aWidgetID];
        if (!suggestHistory) {
            throw new Error("Unknown social page for suggest: " + aWidgetID);
        }
        suggestHistory.shownAt = -Date.now();
    };
    app._userSocialAuthorized = function browseroffer__userSocialAuthorized(aSocialName) {
        let socialObj = this.config.pagesToCheck.filter(function (aObj) {
            return aObj.name === aSocialName;
        })[0];
        if (!socialObj) {
            throw new Error("Unknown social page for checking authorization: " + aSocialName);
        }
        if (socialObj.name === "vk") {
            let regexp = /^remixsid/i;
            return socialObj.domain.some(function (aDomain) {
                let cookies = this.api.Network.getCookiesFromHost(aDomain);
                return cookies.some(function (aCookie) {
                    return regexp.test(aCookie.name);
                });
            }, this);
        }
        return socialObj.domain.some(function (aDomain) {
            return socialObj.cookie.some(function (aCookieName) {
                return this.api.Network.findCookies("http://" + aDomain, aCookieName, true, true, false).length;
            }, this);
        }, this);
    };
    app._checkWidgetsAreActive = function browseroffer__checkWidgetsActive(aWidgetIds) {
        return this.api.Overlay.checkWidgetsInCurrentSet(aWidgetIds);
    };
    app._checkWidgetIsActive = function browseroffer__checkWidgetIsActive(aWidgetID) {
        let widgetsInfo = this.api.Overlay.checkWidgetsInCurrentSet(aWidgetID);
        return widgetsInfo[aWidgetID];
    };
    app.sendStatistic = function browseroffer_sendStatistic(aPart, aAction) {
        function validateAction(aValidActions, aSpecifiedAction) {
            let action = aSpecifiedAction || aAction;
            if (aValidActions.indexOf(action) === -1) {
                throw new Error("Wrong statistics action '" + action + "' for " + aPart);
            }
        }
        switch (aPart) {
        case "safebrowsing":
            validateAction([
                "addbbinstall",
                "addbbrun",
                "install",
                "run"
            ]);
            common.statistics.log({
                cid: 72308,
                path: "fx." + aAction
            });
            if (aAction === "run") {
                this.api.Statistics.BarNavig.sendRequest({ addbb: "sbbb" });
            }
            break;
        case "contextMenu":
            validateAction([
                "addbbrun",
                "showonlink",
                "run"
            ]);
            common.statistics.log({
                cid: 72551,
                path: "fx.cmenu." + aAction
            });
            break;
        case "noFlash":
            validateAction([
                "addbbrun",
                "run",
                "runclose",
                "addbbinstall",
                "install",
                "installclose"
            ]);
            common.statistics.log({
                cid: 72551,
                path: "fx.noflash." + aAction
            });
            break;
        case "wdgtSuggest":
            validateAction([
                "show",
                "close",
                "ignore",
                "agree"
            ], aAction.split(".")[1]);
            common.statistics.log({
                cid: 72582,
                path: "fx." + aAction
            });
            break;
        default:
            return;
        }
    };
    app._initWidgetSuggestHistory = function browseroffer__initWidgetSuggestHistory() {
        function isObject(aObj) {
            return typeof aObj === "object" && !Array.isArray(aObj);
        }
        let prefFullName = this.api.Settings.getComponentBranchPath() + this._widgetSuggestHistorySettingName;
        let prefsModule = this.api.Settings.PrefsModule;
        let wsHistory;
        try {
            wsHistory = JSON.parse(prefsModule.get(prefFullName));
        } catch (e) {
        }
        if (!isObject(wsHistory)) {
            wsHistory = this._widgetSuggestHistory;
        }
        this.config.pagesToCheck.forEach(function (aSiteObj) {
            if (!isObject(wsHistory[aSiteObj.widgetID])) {
                wsHistory[aSiteObj.widgetID] = Object.create(null);
            }
        });
        this._widgetSuggestHistory = wsHistory;
    };
    app._finalizeWidgetSuggestHistory = function browseroffer__finalizeWidgetSuggestHistory() {
        let prefFullName = this.api.Settings.getComponentBranchPath() + this._widgetSuggestHistorySettingName;
        let prefsModule = this.api.Settings.PrefsModule;
        let prefValueStr = "";
        try {
            prefValueStr = JSON.stringify(this._widgetSuggestHistory);
        } catch (e) {
        }
        return prefsModule.set(prefFullName, prefValueStr);
    };
    app._initElementsProvider = function browseroffer__initElementsProvider() {
        const ACTION_PREF_PREFIX = "safebrowsing.yandexBrowser.date.action.";
        let platform = this.api.Environment.os.name;
        let brandID = this.api.Environment.branding.brandID;
        function getPref(strPrefName, defaultValue) {
            let prefFullName = app.api.Settings.getComponentBranchPath() + ACTION_PREF_PREFIX + strPrefName;
            let prefsModule = app.api.Settings.PrefsModule;
            return prefsModule.get(prefFullName, defaultValue);
        }
        function setPref(strPrefName, strPrefValue) {
            let prefFullName = app.api.Settings.getComponentBranchPath() + ACTION_PREF_PREFIX + strPrefName;
            let prefsModule = app.api.Settings.PrefsModule;
            return prefsModule.set(prefFullName, strPrefValue);
        }
        this._elementsProvider = {
            getListenerForPage: function browseroffer_elementsProvider_getListenerForPage({url}) {
                if (url.indexOf("about:blocked?") !== 0) {
                    return null;
                }
                let partName = "safebrowsing";
                return {
                    onPageMessage: function browseroffer_elementsProvider_onPageMessage(name, data) {
                        switch (name) {
                        case "browseroffer":
                            if (data.command == "sendStat") {
                                app.sendStatistic(partName, data.value);
                            }
                            break;
                        default:
                            return;
                        }
                    },
                    onQueryObject: function browseroffer_elementsProvider_onQueryObject(name) {
                        if (name !== "yandexBrowserIntegration") {
                            return;
                        }
                        return {
                            get offerType() {
                                let flags = {
                                    showNothing: 0,
                                    showNotInstalled: 1,
                                    showInstalled: 2
                                };
                                if ([
                                        "mac",
                                        "windows"
                                    ].indexOf(platform) === -1) {
                                    return flags.showNothing;
                                }
                                if (brandID !== "yandex") {
                                    return flags.showNothing;
                                }
                                let eclipseTime = 21 * 24 * 60 * 60 * 1000;
                                let lastActionTime = Math.max(getPref("installed", null), getPref("notInstalled", null));
                                if (Math.abs(Date.now() - lastActionTime) < eclipseTime) {
                                    return flags.showNothing;
                                }
                                let isDefault = app.api.Integration.yandexBrowser.isDefault;
                                if (isDefault === false) {
                                    return flags.showInstalled;
                                }
                                if (!isDefault) {
                                    return flags.showNotInstalled;
                                }
                                return flags.showNothing;
                            },
                            performBrowser: function browseroffer_elementsProvider_performBrowser() {
                                if (app.api.Integration.yandexBrowser.isInstalled) {
                                    setPref("installed", Date.now().toString());
                                    app.sendStatistic(partName, "run");
                                    app.api.Integration.yandexBrowser.openBrowser(app.config.browserLinks.launch);
                                } else {
                                    setPref("notInstalled", Date.now().toString());
                                    app.sendStatistic(partName, "install");
                                    app.api.Controls.navigateBrowser({
                                        url: app.config.browserLinks.install,
                                        target: "new tab"
                                    });
                                }
                            }
                        };
                    }
                };
            }
        };
        this.api.ElementsPlatform.addObjectProvider(this._elementsProvider);
    };
    app._finalizeElementsProvider = function browseroffer__finalizeElementsProvider() {
        if (this._elementsProvider) {
            this.api.ElementsPlatform.removeObjectProvider(this._elementsProvider);
            this._elementsProvider = null;
        }
    };
};
