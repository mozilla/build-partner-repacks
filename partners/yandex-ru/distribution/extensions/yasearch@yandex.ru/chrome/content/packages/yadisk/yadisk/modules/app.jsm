"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:yadisk:preferences";
let module = function (app, common) {
    app.config = {
        useClickStatistics: false,
        statName: "yadisk",
        uniqueWidget: true,
        navigateUrl: {},
        serviceURL: "https://disk.yandex.ru/auth?referer=elements",
        tutorialURL: "http://help.yandex.ru/disk/features/extension.xml",
        branding: {
            ua: {
                serviceURL: "https://disk.yandex.ua/auth?referer=elements",
                tutorialURL: "http://help.yandex.ua/disk/features/extension.xml"
            },
            tb: {
                serviceURL: "https://disk.yandex.com.tr/auth?referer=elements",
                tutorialURL: "http://yardim.yandex.com.tr/disk/features/extension.xml"
            }
        }
    };
    app.uiCommands = {
        auth: function (command, eventData) {
            common.statistics.logWidget("fx." + app.config.statName + ".act.button");
            this.api.Controls.navigateBrowser({
                unsafeURL: this.config.serviceURL,
                eventInfo: eventData.event
            });
        },
        openSlice: function (command, aEventData) {
            if (aEventData.isMiddleBtn) {
                this.api.Controls.navigateBrowser({
                    unsafeURL: this.config.serviceURL,
                    eventInfo: aEventData.event
                });
                return;
            }
            common.observerService.notify("display");
            if (this._slice) {
                this._slice.show(aEventData.widget, function () {
                    this._downloader.resetCompleteStatus();
                }.bind(this));
            }
        }
    };
    app.sliceCommands = {
        "yadisk:slice:init": function (aMessage, aData, aCallback) {
            this._sliceInitialized = true;
            this._notifySliceAboutUser();
            this._downloader.restoreAccountDownloads();
        },
        "yadisk:slice:get-uploads": function (aMessage, aData, aCallback) {
            this._downloader.notifySliceAboutAllTransfers();
        },
        "yadisk:slice:upload-retry": function (aMessage, aData, aCallback) {
            this._downloader.retryTransfer(aData);
        },
        "yadisk:slice:upload-cancel": function (aMessage, aData, aCallback) {
            this._downloader.cancelTransfer(aData);
        },
        "yadisk:slice:copy": function (aMessage, aData, aCallback) {
            if (!this.clipboardHelper) {
                this.clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
            }
            let status = "";
            try {
                this.clipboardHelper.copyString(aData || "");
            } catch (e) {
                status = e.message;
            }
            aCallback(status);
        },
        "yadisk:slice:file-upload": function (aMessage, aData, aCallback) {
            this._uploadLocalFiles();
        },
        "yadisk:slice:file-name": function (aMessage, aData, aCallback) {
            this._downloader.setTransferFileName(aData);
        },
        "yadisk:slice:upload-info": function (aMessage, aData, aCallback) {
            this._downloader.downloadMedia(aData);
        },
        "yadisk:slice:zaberun:start": function (aMessage, aData, aCallback) {
            this._downloader.onRemoteDownloadingStarted(aData);
        },
        "yadisk:slice:zaberun:success": function (aMessage, aData, aCallback) {
            this._downloader.onRemoteDownloadingCompleted(aData);
        },
        "yadisk:slice:zaberun:failed": function (aMessage, aData, aCallback) {
            this._downloader.onRemoteDownloadingFailed(aData);
        }
    };
    app.Settings = {
        getMainTemplate: function CoreSettings_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            return common.utils.readFile("content/settings.xml").replace("{component}", app.componentName);
        }
    };
    Object.defineProperty(app, "dataImageRegexp", {
        enumberable: true,
        get: function () {
            return this._downloader && this._downloader.dataImageRegexp;
        }
    });
    Object.defineProperty(app, "TUTORIAL_TYPES", {
        enumberable: true,
        get: function () {
            return this._tutorial && this._tutorial.TUTORIAL_TYPES;
        }
    });
    app.init = function () {
        XPCOMUtils.defineLazyGetter(this, "packageVersion", function () {
            let version = "0";
            if (this.api.Package.info && this.api.Package.info.version) {
                version = this.api.Package.info.version;
            }
            return version.replace(/\./g, "-");
        });
        this._initModules();
        this._sliceInitialized = false;
        this._authManager = this.api.Passport;
        this._authManager.addListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
        this.api.Browser.messageManager.addMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this.api.Browser.messageManager.loadFrameScript({ url: this.api.Package.resolvePath("/yadisk/modules/frameScript.js") });
    };
    app._initModules = function () {
        XPCOMUtils.defineLazyGetter(this, "_downloader", function () {
            let downloader = this.importModule("downloader");
            downloader.init({
                api: this.api,
                log: this.log.bind(this),
                isAuth: this.isAuth.bind(this),
                getCurrentAccountId: this._getCurrentAccountId.bind(this),
                notifySlices: this._notifySlices.bind(this),
                onState: this._onTransferState.bind(this),
                onTransferComplete: this._onTransferComplete.bind(this),
                getPref: this.getPref.bind(this),
                setPref: this.setPref.bind(this)
            });
            return downloader;
        });
        XPCOMUtils.defineLazyGetter(this, "_tutorial", function () {
            let tutorial = this.importModule("tutorial");
            tutorial.init({
                api: this.api,
                log: this.log.bind(this),
                tutorialURL: this.config.tutorialURL,
                get WIID() app.WIID,
                get packageVersion() app.packageVersion,
                isObject: isObject,
                getPref: this.getPref.bind(this),
                setPref: this.setPref.bind(this)
            });
            return tutorial;
        });
    };
    app.instancePrototype = {
        init: function () {
            app._createSlice();
        }
    };
    app.finalize = function () {
        this._authManager.removeListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
        this.api.Browser.messageManager.removeMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this.api.Browser.messageManager.removeDelayedFrameScript({ url: this.api.Package.resolvePath("/yadisk/modules/frameScript.js") });
        this.clipboardHelper = null;
        this._destroySlice();
    };
    app.dayuseStatProvider = {
        isAuthorized: function () {
            return app._authManager.isAuthorized();
        },
        hasSavedLogins: function () {
            return app._authManager.hasSavedLogins();
        }
    };
    app.onSettingChange = function (aSettingName, aValue, aInstanceId) {
        switch (aSettingName) {
        case "showPopupSuggest":
            this._showPopupSuggestSetting = aValue;
            common.observerService.notify("suggest", JSON.stringify({ popupButton: aValue }));
            break;
        case "showSaveDocumentSuggest":
            this._showSaveDocumentSetting = aValue;
            common.observerService.notify("suggest", JSON.stringify({ document: true }));
            break;
        default:
            return;
        }
        this._notifyFrameScriptSuggestChange();
    };
    app.isAuth = function () {
        return this._authManager.isAuthorized();
    };
    app.getSlice = function () {
        return this._slice || null;
    }, app.getPref = function (strPrefName, defaultValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    };
    app.setPref = function (strPrefName, strPrefValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    };
    app.canShowNotifications = function () {
        return common.ui.canShowNotifications();
    };
    app.shouldPopupButtonSuggest = function () {
        if (this._showPopupSuggestSetting === null) {
            this._showPopupSuggestSetting = this.api.Settings.getValue("showPopupSuggest");
        }
        return this.isAuth() && this._showPopupSuggestSetting;
    };
    app.shouldContextMenuSuggest = function () {
        return this.isAuth();
    };
    app.shouldDocumentSuggest = function () {
        if (this._showSaveDocumentSetting === null) {
            this._showSaveDocumentSetting = this.api.Settings.getValue("showSaveDocumentSuggest");
        }
        return this.isAuth() && this._showSaveDocumentSetting;
    };
    app.shouldTutorialShow = function (aTutorialType) {
        try {
            return this._tutorial.shouldShow(aTutorialType);
        } catch (e) {
            this.log("Unsupported tutorial type: " + aTutorialType);
            return false;
        }
    };
    app.showInfo = function (window, target, tutorialData) {
        return this._tutorial.showInfo(window, target, tutorialData);
    };
    app.showHighlight = function (window, target, effect) {
        return this._tutorial.showHighlight(window, target, effect);
    };
    app.hideInfo = function (window) {
        return this._tutorial.hideInfo(window);
    };
    app.hideHighlight = function (window) {
        return this._tutorial.hideHighlight(window);
    };
    app.tryDownloadMedia = function (aURL, aMeta) {
        return this._downloader.tryDownloadMedia(aURL, aMeta);
    };
    app.isSliceOpen = function () {
        return this._slice && this._slice.isOpen;
    };
    app._showPopupSuggestSetting = null;
    app._showSaveDocumentSetting = null;
    app._getCurrentAccountId = function () {
        let defaultAccount = this._authManager.defaultAccount;
        return defaultAccount && defaultAccount.uid || "";
    };
    app._getSliceURL = function () {
        return "content/slice/index.html";
    };
    app._createSlice = function (aWIID) {
        if (!this._slice) {
            this._slice = common.ui.createSlice({ url: this._getSliceURL() }, this);
        }
    };
    app._destroySlice = function (aWIID) {
        if (this._slice) {
            try {
                this._slice.destroy();
                this._slice = null;
            } catch (e) {
                this.log(e);
            }
        }
    };
    app._getSuggestStates = function () {
        return {
            popup: this.shouldPopupButtonSuggest(),
            document: this.shouldDocumentSuggest()
        };
    };
    app._uploadLocalFiles = function () {
        let window = Services.wm.getMostRecentWindow("navigator:browser");
        let filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        filePicker.init(window, "Select a File", Ci.nsIFilePicker.modeOpenMultiple);
        let fpHandler = {
            done: function (aResult) {
                if (aResult !== filePicker.returnOK) {
                    return;
                }
                common.statistics.logWidget("fx." + app.config.statName + ".act.slice.uploadbutton.done");
                let filesEnum = filePicker.files;
                while (filesEnum.hasMoreElements()) {
                    let file = filesEnum.getNext().QueryInterface(Ci.nsIFile);
                    app.tryDownloadMedia(file, {});
                }
            }
        };
        filePicker.open(fpHandler);
    };
    app._notifyFrameScriptSuggestChange = function () {
        this.api.Browser.messageManager.broadcastAsyncMessage({
            messageName: PREFERENCES_MESSAGE_NAME,
            obj: {
                type: "change",
                states: this._getSuggestStates()
            }
        });
    };
    app._notifySliceAboutUser = function () {
        this._notifySlices({
            message: "yadisk:user",
            data: { uid: this._getCurrentAccountId() || "" }
        });
    };
    app._notifySlices = function (aData) {
        if (!this._slice) {
            return;
        }
        this._slice.notify(aData);
    };
    app._onTransferState = function (aState) {
        common.observerService.notify("display", aState);
    };
    app._onTransferComplete = function (aStatus) {
        if (aStatus !== "success") {
            return;
        }
        if (!this.shouldTutorialShow(this.TUTORIAL_TYPES.SAVE)) {
            return;
        }
        if (this.isSliceOpen()) {
            return;
        }
        common.observerService.notify("tutorial", this.TUTORIAL_TYPES.SAVE);
    };
    app._onLogin = function (aDefaultAccountUid) {
        if (this._sliceInitialized) {
            this._downloader.restoreAccountDownloads(aDefaultAccountUid);
        }
    };
    app._onLogout = function () {
    };
    app._onAuthStateChanged = function (aData) {
        if (this._sliceInitialized) {
            this._notifySliceAboutUser();
        }
        this._notifyFrameScriptSuggestChange();
        common.observerService.notify("display");
        if (!aData.accounts.length) {
            this._onLogout();
            return;
        }
        this._onLogin(aData.defaultAccount.uid);
    };
    app.observe = function (aSubject, aTopic, aData) {
        if (aTopic === this._authManager.EVENTS.AUTH_STATE_CHANGED) {
            this._onAuthStateChanged(aData);
        }
    };
    app.receiveMessage = function (message) {
        let {
            name,
            data,
            target: tab,
            objects
        } = message;
        if (data.type !== "getSuggestStates") {
            return;
        }
        return this._getSuggestStates();
    };
    function isObject(aObj) {
        return aObj && typeof aObj === "object" && !Array.isArray(aObj);
    }
};
