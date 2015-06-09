"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:browseroffer:preferences";
let module = function (app, common) {
    app.config = {
        socialPagesInfo: [
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
            }
        ],
        browserLinks: {
            install: "http://browser.yandex.ru/desktop/?head=security&from=link_element_neyb_safe_|&banerid=0456000000#safe",
            launch: "http://browser.yandex.ru/desktop/?head=security&from=link_element_yabr-installed_safe_|&banerid=0456000000#safe",
            noflash: "http://browser.yandex.ru/desktop/?head=flash&from=link_element_neyb_no-flash_|&banerid=0456510000",
            turbo: "http://browser.yandex.ru/?from=strip_element_neyb_green_&banerid=0156640000#turbo",
            turboBrowser: "http://browser.yandex.ru/?from=strip_element_yabr-installed_green_&banerid=0156650000#turbo"
        },
        branding: {
            tb: {
                socialPagesInfo: [],
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
        getMainTemplate: function (aWidgetUnitName, aWidgetInstanceID) {
            if ([
                    "mac",
                    "windows"
                ].indexOf(app.api.Environment.os.name) === -1) {
                return null;
            }
            return common.utils.readFile("content/settings.xml");
        }
    };
    app.init = function (common, resources) {
        resources.browser.urlBarItems = { button: 10050 };
        resources.browser.styles.push("/browseroffer/content/styles/browser.css");
        this._initSettingsValues();
        this._initModules();
        this.api.Browser.messageManager.addMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this.api.Browser.messageManager.loadFrameScript({ url: this.api.Package.resolvePath("/browseroffer/modules/frameScript.js") });
    };
    app.finalize = function () {
        this.api.Browser.messageManager.removeMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this.api.Browser.messageManager.removeDelayedFrameScript({ url: this.api.Package.resolvePath("/browseroffer/modules/frameScript.js") });
        this._social = null;
    };
    app.onSettingChange = function (aSettingName, aSettingNewValue) {
        let message = Object.create(null);
        switch (aSettingName) {
        case "showContextWidgetSuggest":
            this._showContextSuggests = aSettingNewValue;
            message.contextSuggest = aSettingNewValue;
            break;
        case "showContextMenuLink":
            this._showContextMenuLink = aSettingNewValue;
            message.contextMenu = aSettingNewValue;
            break;
        default:
            return;
        }
        common.observerService.notify("suggest", JSON.stringify(message));
    };
    app.getURIBaseDomain = function (aURI) {
        try {
            return Services.eTLD.getBaseDomain(aURI);
        } catch (e) {
            return null;
        }
    };
    app.getMostRecentBrowserWindow = function () {
        return Services.wm.getMostRecentWindow("navigator:browser");
    };
    app.getPref = function (strPrefName, defaultValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    };
    app.setPref = function (strPrefName, strPrefValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    };
    app.shouldSocialPageWidgetSuggest = function () {
        return this._social.shouldMonitor() && this._showContextSuggests;
    };
    app.shouldContextMenuSuggest = function () {
        return this._showContextMenuLink;
    };
    app.shouldMakeFlashSuggest = function () {
        return this._flash.shouldSuggest();
    };
    app.shouldMakeTurboSuggest = function () {
        return this._turbo.shouldSuggest();
    };
    app.shouldMakeContenxtMenuSuggest = function () {
        return this.api.Integration.yandexBrowser.isDefault === false;
    };
    app.findSocialWidgetForHost = function (aHost) {
        return this._social.findSocialWidgetForHost(aHost);
    };
    app.handleFlashSuggestAction = function (aAction) {
        this._flash.handleUserAction(aAction);
    };
    app.handleSocialSuggestAction = function (aAction, aData) {
        this._social.handleUserAction(aAction, aData);
    };
    app.handleTurboSuggestAction = function (aAction, aData) {
        this._turbo.handleUserAction(aAction, aData);
    };
    app.sendStatistics = function (aPart, aAction) {
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
        case "context-menu":
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
        case "flash-suggest":
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
        case "social-suggest":
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
        case "turbo-suggest":
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
                path: "fx.turvideo." + aAction
            });
            break;
        default:
            throw new Error("Wrong statistics part: " + aPart);
        }
    };
    app._showContextSuggests = null;
    app._showContextMenuLink = null;
    app._initSettingsValues = function () {
        this._showContextSuggests = this.api.Settings.getValue("showContextWidgetSuggest");
        this._showContextMenuLink = this.api.Settings.getValue("showContextMenuLink");
    };
    app._initModules = function () {
        this._social = this.importModule("social");
        this._social.init({
            api: this.api,
            log: this.log.bind(this),
            getPref: this.getPref.bind(this),
            setPref: this.setPref.bind(this),
            socialPagesInfo: this.config.socialPagesInfo
        });
        this._flash = this.importModule("flash");
        this._flash.init({
            api: this.api,
            log: this.log.bind(this),
            getPref: this.getPref.bind(this),
            setPref: this.setPref.bind(this),
            onMonitorStateChanged: this._onModuleStateChanged.bind(this)
        });
        this._safebrowsing = this.importModule("safebrowsing");
        this._safebrowsing.init({
            api: this.api,
            log: this.log.bind(this),
            getPref: this.getPref.bind(this),
            setPref: this.setPref.bind(this),
            sendStatistics: this.sendStatistics.bind(this),
            browserLinks: this.config.browserLinks
        });
        this._turbo = this.importModule("turbo");
        this._turbo.init({
            api: this.api,
            log: this.log.bind(this),
            getPref: this.getPref.bind(this),
            setPref: this.setPref.bind(this),
            onMonitorStateChanged: this._onModuleStateChanged.bind(this)
        });
    };
    app._getSuggestStates = function (aModuleName) {
        let result = {};
        let modulesArray = aModuleName ? [aModuleName] : [
            "flash",
            "turbo"
        ];
        modulesArray.forEach(aModuleName => {
            result[aModuleName] = this["_" + aModuleName].shouldMonitor();
        });
        return result;
    };
    app._notifyFrameScriptSuggestChange = function (aModuleName) {
        this.api.Browser.messageManager.broadcastAsyncMessage({
            messageName: PREFERENCES_MESSAGE_NAME,
            obj: {
                type: "change",
                states: this._getSuggestStates(aModuleName)
            }
        });
    };
    app._notifyFrameScript = function (aData) {
        this.api.Browser.messageManager.broadcastAsyncMessage({
            messageName: PREFERENCES_MESSAGE_NAME,
            obj: aData
        });
    };
    app._onModuleStateChanged = function (aModuleName) {
        this._notifyFrameScriptSuggestChange(aModuleName);
    };
    app.receiveMessage = function (message) {
        let {
            name,
            data,
            target: tab,
            objects
        } = message;
        if (data.type !== "get-suggest-states") {
            return;
        }
        return this._getSuggestStates();
    };
};
