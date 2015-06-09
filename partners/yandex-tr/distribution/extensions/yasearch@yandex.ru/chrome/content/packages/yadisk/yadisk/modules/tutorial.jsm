"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource:///modules/UITour.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const TUTORIAL_SETTING_NAME = "tutorials";
const TUTORIAL_TYPES = {
    SHOW_IMAGE_BUTTON: "show-image-button",
    SAVE: "save"
};
let module = function (app, common) {
    function logger(msg) {
        yadiskTutorial.app.log(msg);
    }
    let yadiskTutorial = {
        get TUTORIAL_TYPES() {
            return TUTORIAL_TYPES;
        },
        get app() {
            return this._app;
        },
        init: function (aApplication) {
            this._app = aApplication;
            XPCOMUtils.defineLazyGetter(this, "_callbackPrefix", function () {
                return this.app.api.Environment.barPlatform.name + "-yadisk-tutorial";
            });
            XPCOMUtils.defineLazyGetter(this, "_browserVersion", function () {
                return this.app.api.Environment.browser.version;
            });
            this._initSettingValues();
            if (this._browserVersion.isGreaterThan("35.*")) {
                this.app.api.Browser.messageManager.addMessageListener({
                    messageName: "yasearch:UITour:SendPageCallback",
                    listener: this
                });
            } else {
                Services.wm.addListener(this);
                this._documentsListenerAddedTo = new WeakMap();
            }
        },
        finalize: function () {
            this._saveSettingsValues();
        },
        shouldShow: function (aType) {
            if (this.app.api.Environment.browser.version.isLessThan("28.*")) {
                return false;
            }
            switch (aType) {
            case this.TUTORIAL_TYPES.SHOW_IMAGE_BUTTON:
                return !this._tutorialSetting.showImageButton;
                break;
            case this.TUTORIAL_TYPES.SAVE:
                return !this._tutorialSetting.save;
                break;
            default:
                throw new Error("Unknown tutorial type.");
            }
        },
        showInfo: function (window, target, tutorialData) {
            let UITourArguments = this._createShowInfoBaseArgumentsForUITour(window);
            let {title, text, icon, buttons, options} = tutorialData;
            UITourArguments.push(target, title, text, icon, buttons, options);
            this._ensureIsListeningInOlderBrowsers(window.document);
            UITour.showInfo.apply(UITour, UITourArguments);
        },
        showHighlight: function (window, target, effect) {
            let UITourArguments = this._createShowHighlightBaseArgumentsForUITour(window);
            UITourArguments.push(target, effect);
            UITour.showHighlight.apply(UITour, UITourArguments);
        },
        hideInfo: function (window) {
            UITour.hideInfo(window);
        },
        hideHighlight: function (window) {
            UITour.hideHighlight(window);
        },
        onCloseWindow: function (window) {
            try {
                window = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow || Ci.nsIDOMWindowInternal);
            } catch (e) {
                this.log(e);
                return;
            }
            if (this._documentsListenerAddedTo && this._documentsListenerAddedTo.has(window.document)) {
                window.document.removeEventListener("mozUITourResponse", this);
            }
        },
        _documentsListenerAddedTo: null,
        _tutorialSetting: null,
        _createShowHighlightBaseArgumentsForUITour: function (window) {
            let result = [];
            if (this._browserVersion.isGreaterThan("34.*")) {
                result.push(window);
            }
            return result;
        },
        _ensureIsListeningInOlderBrowsers: function (document) {
            if (this._documentsListenerAddedTo) {
                if (!this._documentsListenerAddedTo.has(document)) {
                    document.addEventListener("mozUITourResponse", this);
                    this._documentsListenerAddedTo.set(document, true);
                }
            }
        },
        _createShowInfoBaseArgumentsForUITour: function (window) {
            let result = [];
            if (this._browserVersion.isGreaterThan("35.*")) {
                result.push(window, window.getBrowser().mCurrentBrowser.messageManager);
            } else if (this._browserVersion.isGreaterThan("34.*")) {
                result.push(window, window.document);
            } else {
                result.push(window.document);
            }
            return result;
        },
        _initSettingValues: function () {
            this._tutorialSetting = this._getTutorialSetting();
        },
        _getTutorialSetting: function () {
            let settingValue = this._getTutorialSettingFromPrefs();
            if (!this.app.isObject(settingValue)) {
                settingValue = Object.create(null);
            }
            return settingValue;
        },
        _saveSettingsValues: function () {
            try {
                this._saveTutorialSettingToPrefs(JSON.stringify(this._tutorialSetting));
            } catch (e) {
                this.app.log("Saving tutorial setting failed. Msg:" + e.message);
            }
        },
        _getTutorialSettingFromPrefs: function () {
            try {
                return JSON.parse(this.app.getPref(TUTORIAL_SETTING_NAME, undefined));
            } catch (e) {
                this.app.log("Get tutorial setting failed. msg:" + e.message);
            }
            return null;
        },
        _saveTutorialSettingToPrefs: function (aData) {
            try {
                this.app.setPref(TUTORIAL_SETTING_NAME, aData);
            } catch (e) {
                this.app.log("Saving tutorial setting failed. msg:" + e.message);
            }
        },
        _tutorialResponseHandler: function (callbackId, data) {
            let [
                callbackPrefix,
                part,
                action
            ] = (callbackId || "").split(":");
            if (callbackPrefix !== this._callbackPrefix) {
                return;
            }
            if ([
                    "show-button-callback",
                    "save-button-callback"
                ].indexOf(part) < 0) {
                this.app.log("Unknown tutorial slice:" + part);
                return;
            }
            let settingKey = part === "show-button-callback" ? "showImageButton" : "save";
            let statPrefix = "fx." + app.config.statName + "." + this.app.packageVersion + ".pass";
            if (part === "show-button-callback") {
                statPrefix += ".instruction";
            } else {
                statPrefix += ".instructionslice";
            }
            if ([
                    "target",
                    "confirm",
                    "more-info",
                    "settings",
                    "close"
                ].indexOf(action) < 0) {
                this.app.log("Unknown tutorial slice action:" + action);
                return;
            }
            if (action !== "target") {
                this._tutorialSetting[settingKey] = true;
            }
            switch (action) {
            case "target":
                if (data.type === "click") {
                    this._tutorialSetting[settingKey] = true;
                }
                common.observerService.notify("tutorial");
                break;
            case "confirm":
                common.statistics.logWidget(statPrefix + ".ok");
                break;
            case "more-info":
                common.statistics.logWidget(statPrefix + ".help");
                this.app.api.Controls.navigateBrowser({
                    unsafeURL: this.app.tutorialURL,
                    target: "new tab"
                });
                break;
            case "settings":
                common.statistics.logWidget(statPrefix + ".set");
                this.app.api.Controls.openSettingsDialog(null, this.app.WIID);
                break;
            case "close":
                common.statistics.logWidget(statPrefix + ".close");
                break;
            default:
                return;
            }
        },
        handleEvent: function (event) {
            if (event.type === "mozUITourResponse") {
                if (typeof event.detail === "object") {
                    this._tutorialResponseHandler(event.detail.callbackID, event.detail.data);
                }
            }
        },
        receiveMessage: function (aMessage) {
            let {name, data} = aMessage;
            if (name === "yasearch:UITour:SendPageCallback") {
                this._tutorialResponseHandler(data.callbackID, data.data);
            }
        }
    };
    return yadiskTutorial;
};
