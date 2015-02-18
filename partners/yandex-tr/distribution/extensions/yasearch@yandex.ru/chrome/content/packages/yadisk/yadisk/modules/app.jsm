"use strict";
const EXPORTED_SYMBOLS = ["module"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
let module = function (app, common) {
    let yauthMgr = null;
    app.config = {
        useClickStatistics: false,
        statName: "yadisk",
        uniqueWidget: true,
        navigateUrl: {},
        serviceURL: "https://disk.yandex.ru/auth?referer=elements",
        branding: {
            ua: { serviceURL: "https://disk.yandex.ua/auth?referer=elements" },
            tb: { serviceURL: "https://disk.yandex.com.tr/auth?referer=elements" }
        }
    };
    app.uiCommands = {
        auth: function yadisk_uiCommands_auth(command, eventData) {
            common.statistics.logWidget("fx." + app.config.statName + ".button");
            this.api.Controls.navigateBrowser({
                unsafeURL: this.config.serviceURL,
                eventInfo: eventData.event
            });
        },
        openSlice: function yadisk_uiCommands_openSlice(command, aEventData) {
            common.observerService.notify("display");
            if (this._slice) {
                this._slice.show(aEventData.widget, function () {
                    this._downloader.resetCompleteStatus();
                }.bind(this));
            }
        }
    };
    app.sliceCommands = {
        "yadisk:slice:init": function yadisk_sliceCommands_init(aMessage, aData, aCallback) {
            this._notifySliceAboutUser();
            this._downloader.restoreAccountDownloads();
        },
        "yadisk:slice:get-uploads": function yadisk_sliceCommands_get_uploads(aMessage, aData, aCallback) {
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
        "yadisk:slice:upload-info": function yadisk_sliceCommands_upload_info(aMessage, aData, aCallback) {
            this._downloader.downloadMedia(aData);
        }
    };
    app.init = function yadisk_init() {
        this._downloader = this.importModule("downloader");
        this._downloader.init({
            api: this.api,
            log: this.log.bind(this),
            isAuth: this.isAuth.bind(this),
            getCurrentAccountId: this._getCurrentAccountId.bind(this),
            notifySlices: this._notifySlices.bind(this),
            onState: this._onTransferState.bind(this),
            getPref: this.getPref.bind(this),
            setPref: this.setPref.bind(this)
        });
        yauthMgr = app.commonModule("yauth");
        let yauthTimer = null;
        yauthMgr.init(function yadisk_yauthMgr_init_callback(login) {
            if (yauthTimer) {
                yauthTimer.cancel();
                yauthTimer = null;
            }
            if (login && !yauthMgr.userLogin) {
                yauthTimer = common.timers.setTimeout(yauthMgr_init.bind(this, login), 50);
                return;
            }
            this._notifySliceAboutUser();
            common.observerService.notify("display");
            if (login) {
                this.onLogin(login);
            } else {
                this.onLogout();
            }
        }, this);
        this._createSlice();
    };
    Object.defineProperty(app, "dataImageRegexp", {
        enumberable: true,
        get: function () {
            return this._downloader && this._downloader.dataImageRegexp;
        }
    });
    app.finalize = function yadisk_finalize() {
        this.clipboardHelper = null;
        this._downloader = null;
        this._destroySlice();
        yauthMgr = null;
    };
    app.onLogin = function yadisk_onLogin(aLogin) {
        this._downloader.restoreAccountDownloads(this._getCurrentAccountId());
        common.observerService.notify("suggest", true);
    };
    app.onLogout = function yadisk_onLogout() {
        common.observerService.notify("suggest");
    };
    app.isAuth = function yadisk_isAuth() {
        return yauthMgr.isAuth();
    };
    app.getSlice = function yadisk_getSlice() {
        return this._slice || null;
    }, app.getPref = function yadisk_getPref(strPrefName, defaultValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    };
    app.setPref = function yadisk_setPref(strPrefName, strPrefValue) {
        let prefFullName = this.api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this.api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    };
    app.shouldSuggest = function yadisk_shouldSuggest() {
        return this.isAuth();
    };
    app.tryDownloadMedia = function yadisk_tryDownloadMedia(aURL, aMeta) {
        this._downloader.tryDownloadMedia(aURL, aMeta);
    };
    app.isSliceOpen = function yadisk_isSliceOpen() {
        return this._slice && this._slice.isOpen;
    };
    app._getSliceURL = function yadisk__getSliceURL() {
        return "content/slice/index.html";
    };
    app._createSlice = function yadisk__createSlice(aWIID) {
        if (this._slice) {
            return;
        }
        this._slice = common.ui.createSlice({ url: this._getSliceURL() }, this);
    };
    app._destroySlice = function yadisk__destroySlice(aWIID) {
        if (this._slice) {
            this._slice.destroy();
            this._slice = null;
        }
    };
    app._getCurrentAccountId = function yadisk__getCurrentAccountId() {
        return yauthMgr.userLogin;
    };
    app._notifySliceAboutUser = function yadisk__notifySliceAboutUser() {
        this._notifySlices({
            message: "yadisk:user",
            data: { uid: this._getCurrentAccountId() || "" }
        });
    };
    app._notifySlices = function yadisk__notifySlices(aData) {
        if (!this._slice) {
            return;
        }
        this._slice.notify(aData);
    };
    app._onTransferState = function yadisk__onTransferState(aState) {
        common.observerService.notify("display", aState);
    };
    app.onSettingChange = function yadisk_onSettingChange(key, value, instanceId) {
    };
};
