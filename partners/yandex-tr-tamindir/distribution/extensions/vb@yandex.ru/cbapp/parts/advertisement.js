"use strict";
let EXPORTED_SYMBOLS = ["advertisement"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const PREF_HEADER_LASTMODIFIED = "advertisement.lastModified";
const WEB_CONFIG_FILE_URL = "https://download.cdn.yandex.net/bar/vb/ad.json";
const STATES = {
    NOT_SHOWN: 0,
    READY_TO_SHOW: 1,
    ACTIVE: 2
};
function isDocFile(fileName) {
    return new RegExp(".(epub|fb2|pdf|doc|docx|ppt|pptx|rtf)$").test(fileName);
}
Cu.import("resource://gre/modules/Services.jsm");
const advertisement = {
    init: function advertisement_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = this._application.getLogger("Advertisement");
        let preferences = this._application.preferences;
        let conditions = this.conditions = Object.create(null);
        let self = this;
        [
            "yandexBrowserLastLaunch",
            "yandexBrowserVersion",
            "yandexBrowserInstalled",
            "yandexBrowserIsDefault",
            "downloadedDocFiles",
            "newBackgrounds"
        ].forEach(function (condition) {
            Object.defineProperty(conditions, condition, {
                get: function () {
                    return preferences.get("advertisement.conditions." + condition, 0);
                },
                set: function (val) {
                    if (val !== null && val !== undefined)
                        preferences.set("advertisement.conditions." + condition, val);
                    else
                        self._logger.debug("Undefined condition " + condition);
                },
                enumerable: true,
                configurable: true
            });
        });
        let ads = this._ads = Object.create(null);
        [
            "newbackground",
            "setbackground",
            "vbadbbdoc",
            "vbadbbnewver",
            "vbadbbnewverrun"
        ].forEach(function (adId) {
            Object.defineProperty(ads, adId, {
                get: function () {
                    let prefBranch = "advertisement.ads." + adId;
                    return {
                        lastShown: parseInt(preferences.get(prefBranch + ".lastShown"), 10) || 0,
                        refuseCount: preferences.get(prefBranch + ".refuseCount") || 0,
                        showCount: preferences.get(prefBranch + ".showCount") || 0,
                        showState: preferences.get(prefBranch + ".showState") || STATES.NOT_SHOWN,
                        id: adId
                    };
                },
                set: function (stats) {
                    stats.lastShown = stats.lastShown.toString();
                    let prefBranch = "advertisement.ads." + adId;
                    [
                        "lastShown",
                        "refuseCount",
                        "showCount",
                        "showState"
                    ].forEach(function (pref) {
                        let prefName = prefBranch + "." + pref;
                        preferences.set(prefName, stats[pref]);
                    });
                },
                enumerable: true,
                configurable: true
            });
        });
        if (!conditions.downloadedDocFiles) {
            Services.obs.addObserver(downloadsHelper, "final-ui-startup", false);
            this._downloadsObserversAdded = true;
        }
        Services.obs.addObserver(this, this._application.core.eventTopics.BACKGROUNDS_SYNCED, false);
        let alarms = this._application.alarms;
        alarms.restoreOrCreate("advertisementConfigNeedUpdate", {
            timeout: 60 * 24,
            isInterval: true,
            triggerIfCreated: true,
            condition: () => self.enabled,
            handler: this.getConfigFromWeb,
            ctx: this
        });
        alarms.restoreOrCreate("checkAdJSON", {
            timeout: 60,
            isInterval: true,
            condition: () => !Boolean(self.config),
            handler: this.getConfigFromWeb,
            ctx: this
        });
        alarms.restoreOrCreate("checkAdsConditions", {
            timeout: 30,
            isInterval: true,
            triggerIfCreated: true,
            condition: function () {
                return self.enabled && Boolean(self.config) && !Boolean(self.readyToShowAd) && !self._isSilentPeriod();
            },
            handler: this.checkAdsConditions,
            ctx: this
        });
        if (this.activeAd) {
            this._startAd();
        }
    },
    finalize: function advertisement_finalize() {
        let alarms = this._application.alarms;
        if (alarms.exists("refuseAd")) {
            alarms.reset("refuseAd");
            this._refuseActiveAd();
        }
        Services.obs.removeObserver(this, this._application.core.eventTopics.BACKGROUNDS_SYNCED, false);
        if (this._downloadsObserversAdded) {
            try {
                let {Downloads} = Cu.import("resource://gre/modules/Downloads.jsm");
                if (!("getList" in Downloads))
                    throw new Error("Old 'Downloads' module");
                Downloads.getList(Downloads.PUBLIC).then(list => list.removeView(downloadsHelper));
            } catch (ex1) {
                try {
                    const DownloadManager = Cc["@mozilla.org/download-manager;1"].getService(Ci.nsIDownloadManager);
                    DownloadManager.removeListener(downloadsHelper);
                } catch (ex2) {
                    this._logger.error(ex1 + "\n" + ex2);
                }
            }
        }
        this._application = null;
        this._logger = null;
        this.conditions = null;
        this._ads = null;
    },
    get enabled() {
        return this._application.preferences.get("advertisement.enabled", true);
    },
    set enabled(newVal) {
        let oldVal = this.enabled;
        this._application.preferences.set("advertisement.enabled", newVal);
        if (oldVal !== newVal)
            this.sendCurrentState();
    },
    get yandexBrowserInfo() {
        return this._application.integration.yandexBrowser;
    },
    get activeAdRefused() {
        return this._application.preferences.get("advertisement.activeAdRefused", false);
    },
    set activeAdRefused(newVal) {
        let oldVal = this.activeAdRefused;
        this._application.preferences.set("advertisement.activeAdRefused", newVal);
        if (oldVal !== newVal) {
            this.sendCurrentState();
        }
    },
    get activeAd() {
        let adId = Object.keys(this._ads).filter(function (adId) {
            return this._ads[adId].showState === STATES.ACTIVE;
        }, this)[0];
        if (!adId)
            return null;
        return this._ads[adId];
    },
    set activeAd(adId) {
        if (adId === null) {
            let currentActive = this.activeAd;
            currentActive.showState = STATES.NOT_SHOWN;
            this._ads[currentActive.id] = currentActive;
            this._application.alarms.reset("stopActiveAd");
            this.sendCurrentState();
            this.activeAdRefused = false;
            return;
        }
        if (this.activeAd)
            throw new Error("already have active ad " + this.activeAd.id);
        if (adId === "vbadbbdoc") {
            this._logger.trace("Reseting condition downloadedDocFiles");
            this.conditions.downloadedDocFiles = false;
        }
        this._logger.debug("Starting ad " + adId);
        this._application.alarms.reset("stopActiveAd");
        let ad = this._ads[adId];
        ad.showCount = (parseInt(ad.showCount, 10) || 0) + 1;
        ad.showState = STATES.ACTIVE;
        ad.lastShown = Date.now();
        this._ads[adId] = ad;
        this._startAd();
        this.activeAdRefused = false;
        this.sendCurrentState();
        let yandexBrowserInstalled = this.conditions.yandexBrowserInstalled;
        let param;
        if (adId === "vbadbbdoc") {
            if (yandexBrowserInstalled) {
                param = "adbbrun";
            } else {
                param = "adbbinstall";
            }
        } else if (adId === "vbadbbnewver") {
            param = "adbbrun";
        } else if (adId === "vbadbbnewverrun") {
            param = "adbbinstall";
        } else if (adId === "newbackground" || adId === "setbackground") {
            param = "show";
        }
        if (param)
            this.sendClickerRequest(param);
    },
    get readyToShowAd() {
        let adId = Object.keys(this._ads).filter(function (adId) {
            return this._ads[adId].showState === STATES.READY_TO_SHOW;
        }, this)[0];
        if (!adId)
            return null;
        let ad = this._ads[adId];
        return ad;
    },
    set readyToShowAd(adId) {
        if (this.activeAd)
            throw new Error("already have active ad");
        if (this.readyToShowAd)
            throw new Error("already have ready to show ad");
        let ad = this._ads[adId];
        ad.showState = STATES.READY_TO_SHOW;
        this._ads[adId] = ad;
    },
    checkAdsConditions: function advertisement_checkAdsConditions(firstCheck = false, forceCheck = false) {
        if (this._application.alarms.exists("delayCheckAdsCondition") && !forceCheck)
            return;
        this._application.alarms.create("delayCheckAdsCondition", {
            timeout: firstCheck ? 1 : 0,
            handler: function checkConditions() {
                this._logger.debug("Saving new ads conditions");
                let yandexBrowserInfo = this.yandexBrowserInfo;
                let conditions = this.conditions;
                conditions.yandexBrowserInstalled = yandexBrowserInfo.isInstalled;
                conditions.yandexBrowserLastLaunch = yandexBrowserInfo.lastLaunch.toString();
                conditions.yandexBrowserVersion = yandexBrowserInfo.version;
                conditions.yandexBrowserIsDefault = yandexBrowserInfo.isDefaultBrowser;
                conditions.newBackgrounds = JSON.stringify(this._application.backgroundImages.newBackgrounds);
                this._updateState();
            },
            ctx: this
        });
    },
    _startAd: function advertisement__startAd() {
        this._updateState();
        this._application.alarms.restoreOrCreate("stopActiveAd", {
            timeout: 60 * 24,
            handler: function advertisement__onStopActiveAd() {
                let adId = this.activeAd.id;
                this._logger.debug("Ad " + adId + " ended");
                if (!this.activeAdRefused) {
                    let yandexBrowserInstalled = this.conditions.yandexBrowserInstalled;
                    let param;
                    switch (adId) {
                    case "vbadbbdoc":
                        if (yandexBrowserInstalled) {
                            param = "runtime";
                        } else {
                            param = "installtime";
                        }
                        break;
                    case "vbadbbnewver":
                        param = "runtime";
                        break;
                    case "vbadbbnewverrun":
                        param = "installtime";
                        break;
                    case "newbackground":
                    case "setbackground":
                        param = "timeoutclose";
                        break;
                    }
                    if (param)
                        this.sendClickerRequest(param);
                }
                this.activeAd = null;
            }.bind(this)
        });
    },
    _updateState: function advertisement__updateState() {
        let config = this.config;
        if (!config)
            return;
        this._application.commonAdvertisement.setConfig({
            brandId: this._application.branding.brandID,
            locale: this._application.locale.language,
            cloudData: config
        });
        if (!(this.activeAd || this.readyToShowAd || this._isSilentPeriod())) {
            let states = this._getStateForCommonApi();
            let newId = this._application.commonAdvertisement.calcShownBlockId(states);
            if (newId)
                this.readyToShowAd = newId;
        }
    },
    refuse: function advertisement_refuse(timeout) {
        if (!this.activeAd)
            throw new Error("There's no ad to refuse");
        let alarms = this._application.alarms;
        if (timeout) {
            if (!alarms.exists("refuseAd")) {
                alarms.restoreOrCreate("refuseAd", {
                    timeout: timeout / 60000,
                    handler: this._refuseActiveAd,
                    ctx: this
                });
            }
        } else {
            alarms.reset("refuseAd");
            this._refuseActiveAd();
        }
    },
    _refuseActiveAd: function advertisement__refuseActiveAd() {
        let currentActive = this.activeAd;
        currentActive.refuseCount = (parseInt(currentActive.refuseCount, 10) || 0) + 1;
        this._ads[currentActive.id] = currentActive;
        this.activeAdRefused = true;
        let selected;
        let backgroundImages = this._application.backgroundImages;
        if (currentActive.id === "setbackground") {
            selected = backgroundImages.promoCloudSkins.map(skin => skin.id).indexOf(backgroundImages.currentSelected.id) !== -1;
        } else if (currentActive.id === "newbackground") {
            selected = backgroundImages.newBackgrounds.map(skin => skin.id).indexOf(backgroundImages.currentSelected.id) !== -1;
        } else {
            return;
        }
        if (selected) {
            this.sendClickerRequest("backchanged", currentActive.id);
        }
    },
    getLocalizedString: function advertisement_getLocalizedString(str) {
        return this._application.commonAdvertisement.getLocalizedString(this.activeAd.id, str);
    },
    getLocalizedURL: function advertisement_getLocalizedURL(str) {
        return this._application.commonAdvertisement.getLocalizedURL(this.activeAd.id, str);
    },
    sendBarnavigRequest: function advertisement_sendBarnavigRequest() {
        if (this.activeAd)
            this._application.barnavig.sendRequest({ addbb: this.activeAd.id });
    },
    _isSilentPeriod: function advertisement__isSilentPeriod() {
        if (!this.config)
            return true;
        let states = this._getStateForCommonApi();
        return this._application.commonAdvertisement.isSilentPeriod(states);
    },
    _getStateForCommonApi: function advertisement__getStateForCommonApi() {
        let states = { blocks: {} };
        Object.keys(this._ads).forEach(function (adId) {
            let satisfies = false;
            let conditions;
            let isWindows = sysutils.platformInfo.os.name === "windows";
            this._logger.trace("Checking conditions of ad " + adId);
            switch (adId) {
            case "vbadbbdoc":
                conditions = [
                    {
                        name: "downloadedDocFiles",
                        val: this.conditions.downloadedDocFiles
                    },
                    {
                        name: "windows",
                        val: isWindows
                    }
                ];
                break;
            case "vbadbbnewver":
                conditions = [
                    {
                        name: "windows",
                        val: isWindows
                    },
                    {
                        name: "yandexBrowserInstalled",
                        val: this.conditions.yandexBrowserInstalled
                    },
                    {
                        name: "yandexBrowserIsNotDefault",
                        val: this.conditions.yandexBrowserIsDefault === false
                    },
                    {
                        name: "lastLaunchMoreThanTwoWeeks",
                        val: Math.abs(Date.now() - parseInt(this.conditions.yandexBrowserLastLaunch, 10)) > 14 * 24 * 60 * 60 * 1000
                    },
                    {
                        name: "yandexBrowserVersionDetected",
                        val: this.conditions.yandexBrowserVersion
                    },
                    {
                        name: "yandexBrowserOutdated",
                        val: this._application.commonUtils.compareVersions(this.config.ads.vbadbbnewver.additional["new-version"], this.conditions.yandexBrowserVersion) === 1
                    }
                ];
                break;
            case "vbadbbnewverrun":
                conditions = [
                    {
                        name: "windows",
                        val: isWindows
                    },
                    {
                        name: "yandexBrowserNotInstalled",
                        val: !this.conditions.yandexBrowserInstalled
                    },
                    {
                        name: "vbadbbnewverWasNotShown",
                        val: this._ads.vbadbbnewver.showCount === 0
                    }
                ];
                break;
            case "newbackground":
                let newBackgrounds = [];
                try {
                    newBackgrounds = JSON.parse(this.conditions.newBackgrounds);
                } catch (err) {
                }
                conditions = [{
                        name: "enoughNewBackgrounds",
                        val: newBackgrounds.length > 0
                    }];
                break;
            case "setbackground":
                conditions = [{
                        name: "setbackgroundIsAlwaysSatisfies",
                        val: true
                    }];
                break;
            default:
                return;
            }
            satisfies = conditions.every(function (condition) {
                this._logger.trace("Condition " + condition.name + " is " + condition.val);
                return Boolean(condition.val);
            }, this);
            if (satisfies) {
                this._logger.debug("Ad " + adId + " satisfies all conditions");
                states.blocks[adId] = this._ads[adId];
            }
        }, this);
        return states;
    },
    get config() {
        let json;
        try {
            json = fileutils.jsonFromFile(this.configFile);
        } catch (err) {
        }
        return json || null;
    },
    set config(response) {
        response.downloadDate = Date.now();
        fileutils.jsonToFile(response, this.configFile);
        this._updateState();
    },
    sendClickerRequest: function advertisement_sendClickerRequest(param, id) {
        if (!this.enabled) {
            return;
        }
        this._application.statistics.logClickStatistics({
            cid: 72582,
            path: "fx." + (id || this.activeAd.id) + "." + param
        });
    },
    getConfigFromWeb: function advertisement_getConfig() {
        if (this._requestingConfig)
            return;
        this._requestingConfig = true;
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.QueryInterface(Ci.nsIDOMEventTarget);
        request.open("GET", WEB_CONFIG_FILE_URL, true);
        request.responseType = "json";
        let timer = new sysutils.Timer(request.abort.bind(request), 10000);
        let configFile = this.configFile;
        let configFileExists = configFile.exists() && configFile.isFile() && configFile.isReadable();
        let lastModified = this._application.preferences.get(PREF_HEADER_LASTMODIFIED);
        if (lastModified && configFileExists) {
            request.setRequestHeader("If-Modified-Since", lastModified);
        }
        request.addEventListener("load", function () {
            this._requestingConfig = false;
            timer.cancel();
            if (request.status === 304) {
                this._logger.debug("JSON file on server has not yet changed, status = 304");
                return;
            }
            if (!request.response) {
                this._logger.error("JSON file on server is not valid");
                return;
            }
            let lastModified = request.getResponseHeader("last-modified");
            if (lastModified) {
                this._application.preferences.set(PREF_HEADER_LASTMODIFIED, lastModified);
            }
            this.config = request.response;
        }.bind(this));
        let errorListener = function BackgroundImages_sync_errorListener(evt) {
            this._requestingConfig = false;
            this._logger.debug(evt.type);
        }.bind(this);
        request.addEventListener("abort", errorListener, false);
        request.addEventListener("error", errorListener, false);
        request.send();
    },
    get frontendState() {
        let activeAd = this.activeAd;
        if (!this.enabled || !activeAd || this.activeAdRefused) {
            return { id: "" };
        }
        let data = {};
        switch (activeAd.id) {
        case "vbadbbdoc":
            data.yandexBrowserInstalled = this.conditions.yandexBrowserInstalled;
            break;
        case "newbackground":
            try {
                data.newBackgrounds = JSON.parse(this.conditions.newBackgrounds);
            } catch (err) {
                return { id: "" };
            }
            break;
        case "setbackground":
            let promoCloudSkins = this._application.backgroundImages.promoCloudSkins;
            if (promoCloudSkins.length === 0) {
                return { id: "" };
            }
            data.backgrounds = promoCloudSkins;
            break;
        }
        return {
            id: activeAd.id,
            data: data
        };
    },
    handleVBPageShow: function advertisement_handleVBPageShow(windowListenerData) {
        if (this.activeAd) {
            return;
        }
        let ad = this.readyToShowAd;
        if (ad)
            this.activeAd = ad.id;
    },
    get configFile() {
        let file = this._application.core.rootDir;
        file.append("ad.json");
        return file;
    },
    sendCurrentState: function advertisement_sendCurrentState() {
        if (this._application.fastdial)
            this._application.fastdial.sendRequest("advertisement", this.frontendState);
    },
    observe: function advertisement_observe(subject, topic, data) {
        switch (topic) {
        case this._application.core.eventTopics.BACKGROUNDS_SYNCED:
            this.checkAdsConditions(false, true);
            break;
        }
    },
    _downloadsObserversAdded: null,
    _requestingConfig: false,
    _updateStateAllowed: false
};
const downloadsHelper = {
    observe: function advertisement_downloadsHelper_observe(subject, topic, data) {
        switch (topic) {
        case "final-ui-startup":
            Services.obs.removeObserver(this, "final-ui-startup", false);
            try {
                let {Downloads} = Cu.import("resource://gre/modules/Downloads.jsm");
                if (!("getList" in Downloads))
                    throw new Error("Old 'Downloads' module");
                let that = this;
                Downloads.getList(Downloads.PUBLIC).then(list => list.addView(that));
            } catch (ex1) {
                try {
                    let downloadManager = Cc["@mozilla.org/download-manager;1"].getService(Ci.nsIDownloadManager);
                    downloadManager.addListener(this);
                } catch (ex2) {
                    advertisement._logger.error(ex1 + "\n" + ex2);
                }
            }
            break;
        }
    },
    onDownloadAdded: function advertisement_downloadsHelper_onDownloadAdded(download) {
        if (isDocFile(download.source.url)) {
            download.whenSucceeded().then(function () {
                advertisement.conditions.downloadedDocFiles = true;
            });
        }
    },
    onDownloadStateChange: function advertisement_downloadsHelper_onDownloadStateChange(state, download) {
        let downloadManager = Ci.nsIDownloadManager;
        switch (state) {
        case downloadManager.DOWNLOAD_BLOCKED_POLICY:
        case downloadManager.DOWNLOAD_FAILED:
        case downloadManager.DOWNLOAD_CANCELED:
        case downloadManager.DOWNLOAD_BLOCKED_PARENTAL:
        case downloadManager.DOWNLOAD_DIRTY:
        case downloadManager.DOWNLOAD_FINISHED:
            if (isDocFile(download.source.spec)) {
                advertisement.conditions.downloadedDocFiles = true;
            }
            break;
        }
    },
    onLocationChange: function () {
    },
    onProgressChange: function () {
    },
    onSecurityChange: function () {
    },
    onStateChange: function () {
    },
    onStatusChange: function () {
    }
};
