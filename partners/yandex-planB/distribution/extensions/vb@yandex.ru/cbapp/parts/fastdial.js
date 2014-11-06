"use strict";
const EXPORTED_SYMBOLS = ["fastdial"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
[
    [
        "SESSION_STORE_SVC",
        "@mozilla.org/browser/sessionstore;1",
        "nsISessionStore"
    ],
    [
        "DOWNLOAD_MANAGER_SVC",
        "@mozilla.org/download-manager-ui;1",
        "nsIDownloadManagerUI"
    ],
    [
        "UUID_SVC",
        "@mozilla.org/uuid-generator;1",
        "nsIUUIDGenerator"
    ]
].forEach(function ([
    name,
    contract,
    intf
]) {
    return XPCOMUtils.defineLazyServiceGetter(GLOBAL, name, contract, intf);
});
const FILE_PROTOCOL_HANDLER = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
const OUTER_WINDOW_DESTROY_EVENT = "outer-window-destroyed";
const XUL_WINDOW_DESTROY_EVENT = "xul-window-destroyed";
const CLEAR_HISTORY_THUMBS_INTERVAL = 3600;
const RECENTLY_CLOSED_TABS = 15;
const BAR_EXTENSION_ID = "yasearch@yandex.ru";
const NATIVE_RESTORETAB_PREFIX = "current-tab-";
const NATIVE_RESTOREWIN_PREFIX = "current-win-";
const fastdial = {
    init: function Fastdial_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Fastdial");
        let dataProvider = this._barnavigDataProvider.init(this._application);
        this._application.barnavig.addDataProvider(dataProvider);
        Services.obs.addObserver(this, OUTER_WINDOW_DESTROY_EVENT, false);
        Services.obs.addObserver(this, XUL_WINDOW_DESTROY_EVENT, false);
        Services.obs.addObserver(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT, false);
        this._clearHistoryThumbsTimer = new sysutils.Timer(function () {
            this._historyThumbs = {};
        }.bind(this), CLEAR_HISTORY_THUMBS_INTERVAL * 1000, true);
    },
    finalize: function Fastdial_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, OUTER_WINDOW_DESTROY_EVENT);
        Services.obs.removeObserver(this, XUL_WINDOW_DESTROY_EVENT);
        Services.obs.removeObserver(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT);
        if (this._clearHistoryThumbsTimer)
            this._clearHistoryThumbsTimer.cancel();
        this._barnavigDataProvider.finalize();
        this._application.barnavig.removeDataProvider(this._barnavigDataProvider);
        this._registeredListeners = null;
        this._historyThumbs = null;
        this._application = null;
        this._logger = null;
    },
    observe: function Fastdial_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case OUTER_WINDOW_DESTROY_EVENT:
            let outerWindowId = aSubject.QueryInterface(Ci.nsISupportsPRUint64).data;
            delete this._registeredListeners[outerWindowId];
            break;
        case XUL_WINDOW_DESTROY_EVENT:
            this.sendRequest("closedTabsListChanged", { empty: this._recentlyClosedTabs.length === 0 });
            break;
        case this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT:
            aData = JSON.parse(aData);
            for (let [
                        url,
                        historyThumbData
                    ] in Iterator(this._historyThumbs)) {
                let historyThumbHost = this.getDecodedUrlHost(url);
                if (!historyThumbHost || historyThumbHost !== aData.domain)
                    continue;
                historyThumbData.background = historyThumbData.background || {};
                sysutils.copyProperties(aData, historyThumbData.background);
                this.sendRequest("historyThumbChanged", this._application.frontendHelper.getDataForThumb(historyThumbData));
            }
            break;
        case "status":
            break;
        }
    },
    setListenersForWindow: function Fastdial_setListenersForWindow(outerWindowId, command, callback) {
        if (arguments.length === 1) {
            this._registeredListeners[outerWindowId] = {};
            return;
        }
        this._registeredListeners[outerWindowId] = this._registeredListeners[outerWindowId] || {};
        let listeners = this._registeredListeners[outerWindowId];
        if (!listeners[command])
            return listeners[command] = [callback];
        if (listeners[command].indexOf(callback) === -1) {
            listeners[command].push(callback);
        }
    },
    removeListenersForWindow: function Fastdial_removeListenersForWindow(outerWindowId, command, callback) {
        let listeners = this._registeredListeners[outerWindowId];
        if (!listeners || !listeners[command])
            return;
        if (callback === undefined) {
            delete listeners[command];
        } else {
            let index = listeners[command].indexOf(callback);
            if (index !== -1) {
                listeners[command].splice(index, 1);
            }
        }
    },
    hasListenerForWindow: function Fastdial_hasListenerForWindow(outerWindowId, command, callback) {
        let listeners = this._registeredListeners[outerWindowId];
        return listeners[command] && listeners[command].indexOf(callback) !== -1;
    },
    sendRequest: function Fastdial_sendRequest(command, data) {
        this._logger.trace("SendRequest [" + command + "]: every window: " + JSON.stringify(data));
        for (let outerWindowId in this._registeredListeners) {
            this.sendRequestToTab(outerWindowId, command, data, false);
        }
    },
    sendRequestToTab: function Fastdial_sendRequestToTab(outerWindowId, command, data, needsTraceLog) {
        let listeners = this._registeredListeners[outerWindowId];
        if (!listeners || !listeners[command])
            return;
        if (needsTraceLog !== false) {
            this._logger.trace("SendRequest [" + command + "]: outer_window_id " + outerWindowId + ": " + JSON.stringify(data));
        }
        listeners[command].forEach(function (callback) {
            if (!(outerWindowId in this._registeredListeners))
                return;
            data = sysutils.copyObj(data, true);
            try {
                callback(data);
            } catch (ex) {
                this._logger.error("Frontend callback execution failed: " + ex.message);
            }
        }, this);
    },
    openExternalWindow: function Fastdial_openExternalWindow(externalWindowName, window) {
        if ([
                "downloads",
                "bookmarks",
                "history"
            ].indexOf(externalWindowName) === -1)
            throw new Error("Wrong window type selected");
        if (externalWindowName === "downloads") {
            DOWNLOAD_MANAGER_SVC.show(window);
            return;
        }
        let leftPaneRoot;
        if (externalWindowName === "bookmarks")
            leftPaneRoot = "AllBookmarks";
        else if (externalWindowName === "history")
            leftPaneRoot = "History";
        let organizer = misc.getTopWindowOfType("Places:Organizer");
        if (!organizer) {
            let topWindow = misc.getTopBrowserWindow();
            topWindow.openDialog("chrome://browser/content/places/places.xul", "", "chrome,toolbar=yes,dialog=no,resizable", leftPaneRoot);
        } else {
            organizer.PlacesOrganizer.selectLeftPaneQuery(leftPaneRoot);
            organizer.focus();
        }
    },
    requestInit: function Fastdial_requestInit(outerWindowId, ignoreBookmarks) {
        let self = this;
        let backboneXY = this._application.layout.getThumbsNumXY();
        let maxThumbIndex = backboneXY[0] * backboneXY[1];
        let showBookmarks = this._application.preferences.get("ftabs.showBookmarks");
        let requestData = {
            debug: this._application.preferences.get("ftabs.debug", false),
            x: backboneXY[0],
            y: backboneXY[1],
            showBookmarks: showBookmarks,
            background: this._application.backgroundImages.currentSelected,
            thumbs: this._application.frontendHelper.fullStructure,
            hasClosedTabs: this._recentlyClosedTabs.length > 0,
            hasApps: false,
            sync: this._application.sync.state,
            auth: this._application.auth.frontendState,
            advertisement: this._application.advertisement.frontendState
        };
        let brandingLogo = this.brandingXMLDoc.querySelector("logo");
        let brandingSearch = this.brandingXMLDoc.querySelector("search");
        let brandingSearchURL = brandingSearch.getAttribute("url");
        let searchURL = this._application.branding.expandBrandTemplates(brandingSearchURL);
        let imgFile = this._application.branding.brandPackage.findFile("fastdial/" + brandingLogo.getAttribute("img_clear")) || "";
        if (imgFile)
            imgFile = FILE_PROTOCOL_HANDLER.getURLSpecFromFile(imgFile);
        requestData.branding = {
            logo: {
                url: this.expandBrandingURL(brandingLogo.getAttribute("url")),
                img: imgFile,
                alt: brandingLogo.getAttribute("alt"),
                title: brandingLogo.getAttribute("title")
            },
            search: {
                url: searchURL,
                placeholder: brandingSearch.getAttribute("placeholder"),
                example: this._application.searchExample.current,
                navigateTitle: brandingSearch.getAttribute("navigate_title") || ""
            }
        };
        let onSearchStatusReady = function Fastdial_requestInit_onSearchStatusReady(searchStatus) {
            requestData.searchStatus = searchStatus;
            if (outerWindowId !== undefined) {
                this.sendRequestToTab(outerWindowId, "init", requestData);
            } else {
                this.sendRequest("init", requestData);
            }
            if (showBookmarks && !ignoreBookmarks) {
                this._application.bookmarks.requestBranch("", function (bookmarks) {
                    if (outerWindowId !== undefined) {
                        self.sendRequestToTab(outerWindowId, "bookmarksStateChanged", bookmarks);
                    } else {
                        self.sendRequest("bookmarksStateChanged", bookmarks);
                    }
                });
            }
            if (outerWindowId !== undefined && !this._outerWindowIdList[outerWindowId]) {
                this._outerWindowIdList[outerWindowId] = true;
                if (this._logTabShowFlag) {
                    this._application.usageHistory.logAction("show");
                    this._tabsShownCounter++;
                }
                this._logTabShowFlag = true;
            }
        }.bind(this);
        let searchStatusInternal = this._application.preferences.get("ftabs.searchStatus") === 1 ? false : true;
        let searchStudyOmni = this._application.preferences.get("ftabs.searchStudyOmnibox");
        if (searchStatusInternal) {
            onSearchStatusReady(2);
            return;
        }
        if (!searchStudyOmni) {
            onSearchStatusReady(1);
            return;
        }
        AddonManager.gre_AddonManager.getAddonByID(BAR_EXTENSION_ID, function (addonData) {
            let isBarInstalled = addonData !== null && addonData.installDate && addonData.isActive;
            onSearchStatusReady(isBarInstalled ? 3 : 1);
        });
    },
    requestSettings: function Fastdial_requestSettings(callback) {
        let productInfo = this._application.branding.productInfo;
        let possibleLayouts = this._application.layout.getPossibleLayouts();
        callback({
            bgImages: this._application.backgroundImages.list,
            showBookmarks: this._application.preferences.get("ftabs.showBookmarks"),
            sendStat: this._application.preferences.get("stat.usage.send", false),
            isHomePage: Preferences.get("browser.startup.homepage").split("|").indexOf(this._application.protocolSupport.url) !== -1,
            showSearchForm: [
                0,
                2
            ].indexOf(this._application.preferences.get("ftabs.searchStatus")) !== -1,
            showAdvertisement: this._application.advertisement.enabled,
            selectedBgImage: this._application.backgroundImages.currentSelected.id,
            layouts: possibleLayouts.layouts,
            currentLayout: possibleLayouts.current,
            licenseURL: productInfo.LicenseURL.fx,
            copyright: productInfo.Copyright.fx,
            rev: this._application.addonManager.addonVersion,
            build: this._application.core.CONFIG.BUILD.REVISION,
            softURL: String(productInfo.SoftURL || "") || null,
            buildDate: Math.round(new Date(this._application.core.CONFIG.BUILD.DATE).getTime() / 1000),
            sync: this._application.sync.state,
            thumbStyle: this._application.preferences.get("ftabs.thumbStyle", 1)
        });
    },
    getLocalizedString: function Fastdial_getLocalizedString(key) {
        let node = this.i18nXMLDoc.querySelector("key[name='" + key + "']");
        if (node === null) {
            throw new Error("Unknown i18n key: " + key);
        }
        return this.expandBrandingURL(node.getAttribute("value"));
    },
    applySettings: function Fastdial_applySettings(layout, showBookmarks, showSearchForm, showAdvertisement, thumbStyle) {
        let self = this;
        let oldThumbsNum = this._application.layout.getThumbsNum();
        let layoutXY = this._application.layout.getThumbsXYOfThumbsNum(layout);
        let oldShowBookmarks = this._application.preferences.get("ftabs.showBookmarks");
        let ignoreBookmarks;
        if (!oldShowBookmarks && showBookmarks) {
            ignoreBookmarks = false;
        } else {
            ignoreBookmarks = true;
        }
        this._application.advertisement.enabled = showAdvertisement;
        this._application.preferences.set("ftabs.showBookmarks", showBookmarks);
        this._application.preferences.set("ftabs.searchStatus", showSearchForm ? 0 : 1);
        this._application.preferences.set("ftabs.thumbStyle", thumbStyle);
        this._application.layout.layoutX = layoutXY[0];
        this._application.layout.layoutY = layoutXY[1];
        this.requestInit(undefined, ignoreBookmarks);
        this._application.thumbs.getScreenshotsAndLogos();
    },
    requestRecentlyClosedTabs: function Fastdial_requestRecentlyClosedTabs(callback) {
        let self = this;
        let tasks = [];
        this._recentlyClosedTabs.forEach(function (tabData) {
            tasks.push(function (callback) {
                if (tabData.favicon || tabData.isWindow) {
                    delete tabData.url;
                    callback(null, tabData);
                    return;
                }
                let uri = netutils.newURI(tabData.url);
                self._application.favicons.requestFaviconForURL(uri, function (faviconData, dominantColor) {
                    tabData.favicon = faviconData || "";
                    delete tabData.url;
                    callback(null, tabData);
                });
            });
        });
        async.parallel(tasks, function (err, results) {
            callback(results);
        });
    },
    restoreTab: function Fastdial_restoreTab(id) {
        if (id.indexOf(NATIVE_RESTORETAB_PREFIX) === 0) {
            id = parseInt(id.replace(NATIVE_RESTORETAB_PREFIX, ""), 10);
            let topWindow = misc.getTopBrowserWindow();
            SESSION_STORE_SVC.undoCloseTab(topWindow, id);
        } else if (id.indexOf(NATIVE_RESTOREWIN_PREFIX) === 0) {
            id = parseInt(id.replace(NATIVE_RESTOREWIN_PREFIX, ""), 10);
            SESSION_STORE_SVC.undoCloseWindow(id);
        } else {
            throw new Error("Unknown tab id: " + id);
        }
        this.sendRequest("closedTabsListChanged", { empty: this._recentlyClosedTabs.length === 0 });
    },
    onTabClose: function Fastdial_onTabClose() {
        this.sendRequest("closedTabsListChanged", { empty: this._recentlyClosedTabs.length === 0 });
    },
    thumbOpened: function Fastdial_thumbOpened(outerWindowId, url, index, navigateCode) {
        async.nextTick(function Fastdial_thumbOpened_openSpeculativeConnect() {
            this.openSpeculativeConnect(url);
        }, this);
        if (this._application.barnavig.alwaysSendUsageStat === false)
            return;
        this._barnavigDataProvider.addURLData(url, { vtbNum: index + 1 });
    },
    openSpeculativeConnect: function Fastdial_openSpeculativeConnect(url) {
        if (!("nsISpeculativeConnect" in Ci))
            return;
        let uri;
        try {
            uri = netutils.newURI(url);
        } catch (e) {
        }
        if (!uri)
            return;
        Services.io.QueryInterface(Ci.nsISpeculativeConnect).speculativeConnect(uri, null, null);
    },
    onShortcutPressed: function Fastdial_onShortcutPressed(thumbIndex) {
        let thumbData = this._application.internalStructure.getItem(thumbIndex);
        if (thumbData && thumbData.source) {
            misc.navigateBrowser({
                url: thumbData.source,
                target: "current tab"
            });
            this.sendClickerRequest("thumb.click." + (thumbIndex + 1) + "." + thumbData.thumb.statParam);
        }
    },
    navigateUrlWithReferer: function Fastdial_navigateUrlWithReferer(url, navigateCode) {
        let brandingLogoURL = this.brandingXMLDoc.querySelector("logo").getAttribute("url");
        brandingLogoURL = this._application.branding.expandBrandTemplates(brandingLogoURL);
        let target = {
            1: "current tab",
            2: "new window",
            3: "new tab"
        }[navigateCode];
        misc.navigateBrowser({
            url: url,
            target: target,
            referrer: brandingLogoURL
        });
    },
    setAsHomePage: function Fastdial_setAsHomePage() {
        let currentHomePages = Preferences.get("browser.startup.homepage").split("|");
        if (currentHomePages.length > 1) {
            currentHomePages.unshift(this._application.protocolSupport.url);
            Preferences.set("browser.startup.homepage", currentHomePages.join("|"));
        } else {
            Preferences.set("browser.startup.homepage", this._application.protocolSupport.url);
        }
    },
    onHiddenTabAction: function Fastdial_onHiddenTabAction(action) {
        switch (action) {
        case "hide":
            this._logTabShowFlag = false;
            break;
        case "show":
            this._application.usageHistory.logAction("show");
            this._tabsShownCounter++;
            Services.obs.notifyObservers(this, this._application.core.eventTopics.APP_TAB_SHOWN, this._tabsShownCounter);
            break;
        }
    },
    getDecodedUrlHost: function Fastdial_getDecodedUrlHost(url) {
        let decodedURL = this._decodeURL(url);
        let uri;
        try {
            uri = netutils.newURI(decodedURL);
        } catch (ex) {
        }
        return uri ? uri.asciiHost.replace(/^www\./, "") : null;
    },
    getDecodedLocation: function Fastdial_getDecodedLocation(url) {
        let decodedURL = this._decodeURL(url);
        let uriObj;
        try {
            uriObj = netutils.newURI(decodedURL);
            try {
                uriObj.QueryInterface(Ci.nsIURL);
            } catch (ex) {
            }
        } catch (ex) {
        }
        return {
            source: url,
            location: uriObj || null
        };
    },
    get cachedHistoryThumbs() {
        return this._historyThumbs;
    },
    get brandingXMLDoc() {
        delete this.brandingXMLDoc;
        return this.brandingXMLDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
    },
    get brandingClckrDoc() {
        delete this.brandingClckrDoc;
        return this.brandingClckrDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/clckr.xml");
    },
    get i18nXMLDoc() {
        delete this.i18nXMLDoc;
        let stream = this._application.addonFS.getStream("$content/fastdial/i18n.xml");
        return this.i18nXMLDoc = fileutils.xmlDocFromStream(stream);
    },
    get _sessionStoreFileData() {
        let tabsData = [];
        let sessionstoreData;
        let sessionFile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        sessionFile.append("sessionstore.js");
        if (!sessionFile.exists() || !sessionFile.isFile() || !sessionFile.isReadable())
            return tabsData;
        try {
            sessionstoreData = fileutils.jsonFromFile(sessionFile);
        } catch (e) {
            this._logger.warn(e.message);
            return tabsData;
        }
        return tabsData;
        return tabsData;
    },
    get _recentlyClosedTabs() {
        const SKIP_URLS = [
            "about:blank",
            "about:newtab",
            this._application.protocolSupport.url
        ];
        const EXTENSION_NAME = this._application.branding.productInfo.ProductName1.nom;
        let windows = [];
        let windowsData;
        try {
            windowsData = JSON.parse(SESSION_STORE_SVC.getClosedWindowData());
        } catch (ex) {
        }
        (windowsData || []).forEach(function Fastdial___recentlyClosedTabs_parseWindowsData(windowData, index) {
            if (windows.length >= RECENTLY_CLOSED_TABS)
                return;
            let domains = [];
            windowData.tabs.forEach(function (tabData) {
                if (!Array.isArray(tabData.entries) || !tabData.entries.length)
                    return;
                let hasValuableTabs = tabData.entries.some(function Fastdial___recentlyClosedTabs_parseWindowsData_hasValuableTabs(tabEntry) {
                    return SKIP_URLS.indexOf(tabEntry.url) === -1;
                });
                if (!hasValuableTabs)
                    return;
                let lastTabEntry = tabData.entries.pop();
                if (lastTabEntry.url === this._application.protocolSupport.url) {
                    domains.push(EXTENSION_NAME);
                } else {
                    try {
                        let uri = netutils.newURI(lastTabEntry.url);
                        domains.push(uri.host.replace(/^www\./, ""));
                    } catch (ex) {
                        domains.push(lastTabEntry.url);
                    }
                }
            }, this);
            if (!domains.length)
                return;
            windows.push({
                id: NATIVE_RESTOREWIN_PREFIX + index,
                title: "",
                favicon: "",
                isWindow: true,
                domains: domains
            });
        }, this);
        let tabs = [];
        let tabsData;
        try {
            let topWindow = misc.getTopBrowserWindow();
            if (topWindow) {
                tabsData = JSON.parse(SESSION_STORE_SVC.getClosedTabData(topWindow));
            }
        } catch (ex) {
        }
        (tabsData || []).forEach(function Fastdial___recentlyClosedTabs_parseTabsData(tabData, index) {
            if (tabs.length >= RECENTLY_CLOSED_TABS)
                return;
            if (!tabData.state || !Array.isArray(tabData.state.entries) || !tabData.state.entries.length)
                return;
            let hasValuableEntries = tabData.state.entries.some(function Fastdial___recentlyClosedTabs_parseWindowsData_hasValuableTabs(entry) {
                return SKIP_URLS.indexOf(entry.url) === -1;
            });
            if (!hasValuableEntries)
                return;
            let lastTabEntry = tabData.state.entries.pop();
            tabs.push({
                id: NATIVE_RESTORETAB_PREFIX + index,
                title: lastTabEntry.title || lastTabEntry.url,
                favicon: lastTabEntry.image,
                url: lastTabEntry.url,
                isWindow: false
            });
        }, this);
        let output = windows.splice(0, 5);
        for (let i = 0, len = tabs.length; i < len; i++) {
            output.splice(i, 0, tabs[i]);
            if (output.length >= RECENTLY_CLOSED_TABS) {
                break;
            }
        }
        if (output.length < RECENTLY_CLOSED_TABS && windows.length) {
            output = output.concat(windows);
            output.length = Math.min(RECENTLY_CLOSED_TABS, output.length);
        }
        return output;
    },
    _barnavigDataProvider: {
        init: function Fastdial_BNDP_init() {
            this._dataContainer = new sysutils.DataContainer({ expirationTime: 1 * 60 * 60 * 1000 });
            return this;
        },
        finalize: function Fastdial_BNDP_finalize() {
            this._dataContainer.finalize();
            this._dataContainer = null;
            return this;
        },
        addURLData: function Fastdial_BNDP_addURLData(aURL, aThumbData) {
            if (typeof aURL == "string" && typeof aThumbData == "object")
                this._dataContainer.set(aURL, aThumbData);
        },
        onWindowLocationChange: function Fastdial_BNDP_onWindowLocationChange() {
        },
        onPageLoad: function Fastdial_BNDP_onPageLoad(aParams) {
            let url = aParams.barNavigParams.oldurl || aParams.url;
            let thumbData = url && this._dataContainer.get(url);
            if (thumbData) {
                this._dataContainer.remove(url);
                aParams.barNavigParams.vtbNum = thumbData.vtbNum;
                return this;
            }
            return false;
        },
        onBarNavigResponse: function Fastdial_BNDP_onBarNavigResponse() {
        },
        _dataContainer: null
    },
    requestTitleForURL: function Fastdial_requestTitleForURL(url, callback) {
        let self = this;
        let seriesTasks = {};
        let locationObj = this.getDecodedLocation(url);
        let titleFound;
        if (!locationObj.location)
            return callback("URL is not valid: " + url);
        seriesTasks.history = function Fastdial_requestTitleForURL_historySeriesTask(callback) {
            try {
                PlacesUtils.asyncHistory.getPlacesInfo(locationObj.location, {
                    handleResult: function handleResult(aPlaceInfo) {
                        titleFound = aPlaceInfo.title;
                        if (titleFound)
                            return callback("stop");
                        callback();
                    },
                    handleError: function handleError(aResultCode, aPlaceInfo) {
                        if (aResultCode !== Cr.NS_ERROR_NOT_AVAILABLE)
                            self._logger.error("Error in asyncHistory.getPlacesInfo (" + JSON.stringify(locationObj.location) + "): " + aResultCode);
                        callback();
                    }
                });
            } catch (ex) {
                titleFound = PlacesUtils.history.getPageTitle(locationObj.location);
                if (titleFound)
                    return callback("stop");
                callback();
            }
        };
        seriesTasks.request = function Fastdial_requestTitleForURL_requestSeriesTask(callback) {
            let isStandardURL = true;
            try {
                locationObj.location.QueryInterface(Ci.nsIURL);
            } catch (ex) {
                isStandardURL = false;
            }
            if (!isStandardURL || !locationObj.location.host)
                return callback("Not a valid nsIURL: " + url);
            if (self._application.isYandexHost(locationObj.location.host)) {
                try {
                    locationObj.location.QueryInterface(Ci.nsIURL);
                    let parsedQuery = netutils.querystring.parse(locationObj.location.query);
                    parsedQuery.nugt = "vbff-" + self._application.addonManager.addonVersion;
                    locationObj.location.query = netutils.querystring.stringify(parsedQuery);
                } catch (ex) {
                    self._logger.error("URI is not URL: " + url);
                }
            }
            let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.mozBackgroundRequest = true;
            xhr.QueryInterface(Ci.nsIDOMEventTarget);
            xhr.open("GET", locationObj.location.spec, true);
            let timer = new sysutils.Timer(function () {
                xhr.abort();
            }, 25000);
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.addEventListener("load", function () {
                timer.cancel();
                let responseText = (xhr.responseText || "").replace(/<\/head>[\s\S]*/i, "</head><body/></html>").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
                let title = "";
                let domParser = xmlutils.getDOMParser();
                let xmlDocument, charset;
                try {
                    xmlDocument = domParser.parseFromString(responseText, "text/html");
                } catch (e) {
                }
                let contentTypeHeader = xhr.getResponseHeader("Content-Type");
                let charsetHeader = contentTypeHeader && contentTypeHeader.match(/charset=(.+)$/);
                let charsetTagHTML5 = xmlDocument && xmlDocument.querySelector("meta[charset]");
                let charsetHttpEquivTag = xmlDocument && xmlDocument.querySelector("meta[http-equiv='Content-Type'][content]");
                if (charsetHeader) {
                    charset = charsetHeader[1];
                } else if (xmlDocument) {
                    if (charsetHttpEquivTag) {
                        charset = charsetHttpEquivTag.getAttribute("content").match(/charset=(.+)$/);
                        charset = charset && charset[1];
                    } else if (charsetTagHTML5) {
                        charset = charsetTagHTML5.getAttribute("charset");
                    }
                }
                charset = (charset || "UTF-8").replace(/[^a-z\d-]/gi, "");
                let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
                try {
                    converter.charset = charset;
                    responseText = converter.ConvertToUnicode(responseText);
                    xmlDocument = domParser.parseFromString(responseText, "text/html");
                } catch (e) {
                }
                let titleNode = xmlDocument && xmlDocument.querySelector("head > title");
                if (titleNode) {
                    title = titleNode.textContent;
                } else {
                    let titleMatches = responseText.match(/<title>(.*?)<\/title>/im);
                    title = titleMatches ? titleMatches[1] : "";
                }
                title = title.substr(0, 1000) || url;
                callback(null, title);
            }, false);
            let errorHandler = function (e) {
                callback(e.type);
            };
            xhr.addEventListener("error", errorHandler, false);
            xhr.addEventListener("abort", errorHandler, false);
            xhr.send();
        };
        async.series(seriesTasks, function Fastdial_requestTitleForURL_onSeriesTasksRun(err, results) {
            if (titleFound)
                return callback(null, titleFound);
            if (results && results.request)
                return callback(null, results.request);
            callback(err);
        });
    },
    expandBrandingURL: function Fastdial_expandBrandingURL(url) {
        return this._application.branding.expandBrandTemplates(url, { vbID: this._application.core.CONFIG.APP.TYPE });
    },
    sendClickerRequest: function Fastdial_sendClickerRequest(param) {
        this._application.statistics.logClickStatistics({
            cid: 72480,
            path: param
        });
    },
    _decodeURL: function Fastdial__decodeURL(url) {
        let outputURL;
        try {
            let uri = netutils.newURI(url);
            if (uri.host === "clck.yandex.ru") {
                let clickrMatches = uri.path.match(/.+?\*(.+)/);
                if (clickrMatches) {
                    let regexFromOld = new RegExp("\\?from=vb-fx$");
                    let regexFromNew = new RegExp("\\?from=" + this._application.core.CONFIG.APP.TYPE + "$");
                    clickrMatches[1] = clickrMatches[1].replace(/[?&]clid=[^&]+/, "").replace(regexFromOld, "").replace(regexFromNew, "");
                    outputURL = clickrMatches[1];
                } else {
                    let clckrItem = this.brandingClckrDoc.querySelector("item[url='" + url + "']");
                    outputURL = clckrItem ? "http://" + clckrItem.getAttribute("domain") : url;
                }
            } else {
                outputURL = url;
            }
        } catch (ex) {
            outputURL = url;
        }
        return outputURL;
    },
    _application: null,
    _logger: null,
    _applyingThumbsSettings: false,
    _applyThumbsSettingsQueue: [],
    _registeredListeners: {},
    _historyThumbs: {},
    _pickupGUID: null,
    _clearHistoryThumbsTimer: null,
    _outerWindowIdList: {},
    _logTabShowFlag: true,
    _tabsShownCounter: 0
};
