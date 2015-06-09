"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyGetter(this, "browserCustomizableUI", function () {
    try {
        return Cu.import("resource:///modules/CustomizableUI.jsm", {}).CustomizableUI;
    } catch (e) {
    }
    return null;
});
const resources = {
    browser: {
        styles: ["/native/browser.css"],
        urlBarItems: { button: 9000 }
    }
};
const WIDGET_ID = "http://bar.yandex.ru/packages/yandexbar#omnibox";
const DEFAULT_QUERY_CHARSET = "ISO-8859-1";
const NATIVE_SEARCH_CONTAINER_ID = "search-container";
const core = {
    api: null,
    init: function OmniBox_init(api) {
        this.api = api;
        let delayedInit = this._delayedInit.bind(this);
        this._completelyReady = false;
        this._searchService = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);
        if ("init" in this._searchService) {
            this._searchService.init({
                onInitComplete: function Omnibox_SearchServiceInit_onInitComplete() {
                    delayedInit();
                }
            });
        } else {
            delayedInit();
        }
    },
    _delayedInit: function Omnibox__delayedInit() {
        if (this._completelyReady !== false) {
            return;
        }
        Services.obs.addObserver(this, "browser-search-engine-modified", false);
        Cu.import(this.api.Package.resolvePath("/native/searchController.js"), this).OmniBox.init(this);
        userChromeCSS.enable();
        if (!this.api.Settings.PrefsModule.has("yaomnibox.places.alt")) {
            this.api.Settings.PrefsModule.set("yaomnibox.places.alt", true);
        }
        if (!this.api.Settings.PrefsModule.has("yaomnibox.places.trans")) {
            this.api.Settings.PrefsModule.set("yaomnibox.places.trans", true);
        }
        let tmp = this.searchTutorInstallTime;
        this._completelyReady = true;
        this._delayedInitQueue.forEach(function Omnibox_onDelayedInit_forEach(callback) {
            try {
                callback();
            } catch (e) {
                Cu.reportError(e);
            }
        });
        this._delayedInitQueue.length = 0;
    },
    finalize: function OmniBox_finalize() {
        if (this._completelyReady) {
            Services.obs.removeObserver(this, "browser-search-engine-modified");
            this._saveEnginesData();
            userChromeCSS.disable();
            this.OmniBox.finalize();
        }
        this._restoreBrowserSearchContainer();
        this._completelyReady = null;
        this._delayedInitQueue.length = 0;
        this.api = null;
        this.__permanentSearchEngine = null;
        this._visibleEnginesCached = null;
        this._searchService = null;
        this._currentEngineIsBranded = null;
        this._searchTutorClickedInfo = null;
    },
    _removeBrowserSearchContainer: function Omnibox__removeBrowserSearchContainer() {
        if (this.api.Settings.getValue("nativeqs.removed") !== false) {
            return;
        }
        if (browserCustomizableUI) {
            let placement = browserCustomizableUI.getPlacementOfWidget(NATIVE_SEARCH_CONTAINER_ID);
            if (placement && placement.area === browserCustomizableUI.AREA_NAVBAR) {
                browserCustomizableUI.removeWidgetFromArea(NATIVE_SEARCH_CONTAINER_ID);
            }
            this.api.Settings.setValue("nativeqs.removed", true);
            return;
        }
        let wndEnum = Services.wm.getEnumerator("navigator:browser");
        while (wndEnum.hasMoreElements()) {
            let browserWindow = wndEnum.getNext();
            try {
                let doc = browserWindow.document;
                let nativeSearchElement = doc.querySelector("#nav-bar > #" + NATIVE_SEARCH_CONTAINER_ID);
                if (nativeSearchElement) {
                    let toolbar = nativeSearchElement.parentNode;
                    let searchContainerElement = toolbar.removeChild(nativeSearchElement);
                    let toolbox = doc.getElementById("navigator-toolbox");
                    let palette = toolbox && toolbox.palette;
                    if (palette && !palette.getElementsByAttribute("id", NATIVE_SEARCH_CONTAINER_ID).length) {
                        palette.appendChild(searchContainerElement);
                    }
                    toolbar.setAttribute("currentset", toolbar.currentSet);
                    doc.persist(toolbar.id, "currentset");
                }
            } catch (e) {
            }
            this.api.Settings.setValue("nativeqs.removed", true);
        }
    },
    _restoreBrowserSearchContainer: function Omnibox__restoreBrowserSearchContainer() {
        if (this.api.Settings.getValue("nativeqs.removed") !== true) {
            return;
        }
        let wndEnum = Services.wm.getEnumerator("navigator:browser");
        if (!wndEnum.hasMoreElements()) {
            return;
        }
        if (browserCustomizableUI) {
            let placement = browserCustomizableUI.getPlacementOfWidget(NATIVE_SEARCH_CONTAINER_ID);
            if (!placement) {
                browserCustomizableUI.addWidgetToArea(NATIVE_SEARCH_CONTAINER_ID, browserCustomizableUI.AREA_NAVBAR, undefined);
            }
            this.api.Settings.setValue("nativeqs.removed", false);
            return;
        }
        while (wndEnum.hasMoreElements()) {
            let browserWindow = wndEnum.getNext();
            try {
                let doc = browserWindow.document;
                let nativeSearchElement = doc.getElementById(NATIVE_SEARCH_CONTAINER_ID);
                if (!nativeSearchElement) {
                    let toolbar = doc.getElementById("nav-bar");
                    toolbar.insertItem(NATIVE_SEARCH_CONTAINER_ID);
                    toolbar.setAttribute("currentset", toolbar.currentSet);
                    doc.persist(toolbar.id, "currentset");
                }
            } catch (e) {
            }
            this.api.Settings.setValue("nativeqs.removed", false);
        }
    },
    initURLBarItem: function OmniBox_initURLBarItem(itemElement, itemClass) {
        this._removeBrowserSearchContainer();
        this._showWelcomePageOnStart();
        return new OmniBoxUBItem(itemElement, itemClass, this);
    },
    onDelayedInit: function Omnibox_onDelayedInit(callback) {
        if (this._completelyReady) {
            callback();
        } else {
            this._delayedInitQueue.push(callback);
        }
    },
    get WIDGET_ID() {
        return WIDGET_ID;
    },
    getStaticPref: function OmniBox_getStaticPref(aName, aDefaultValue) {
        return this.api.Settings.PrefsModule.get(this.api.Settings.getStaticBranchPath() + aName, aDefaultValue);
    },
    setStaticPref: function OmniBox_setStaticPref(aName, aValue) {
        this.api.Settings.PrefsModule.set(this.api.Settings.getStaticBranchPath() + aName, aValue);
    },
    addToFormHistory: function Omnibox_addToFormHistory(name, value) {
        if (this._formHistory) {
            this._formHistory.update({
                op: "add",
                fieldname: name,
                value: value
            });
        } else {
            let formHistoryService = Cc["@mozilla.org/satchel/form-history;1"].getService(Ci.nsIFormHistory2);
            formHistoryService.addEntry(name, value);
        }
    },
    showTutorWithText: function Omnibox_showTutorWithText(text) {
        let topBrowser = Services.wm.getMostRecentWindow("navigator:browser");
        if (!topBrowser) {
            return;
        }
        let omniboxXULItem = topBrowser.document.getElementsByAttribute("yb-native-widget-name", WIDGET_ID)[0];
        if (omniboxXULItem && typeof omniboxXULItem.showTutorWithText === "function") {
            omniboxXULItem.showTutorWithText(text);
        }
    },
    get currentEngineName() {
        this.__defineGetter__("currentEngineName", function currentEngineName() {
            let storeBranch = this.api.Settings.getComponentBranchPath();
            let searchNamePref = storeBranch + "searchName";
            let searchName = this.api.Settings.PrefsModule.get(searchNamePref, null);
            if (!(searchName && typeof searchName === "string")) {
                let currentBrowserEngine = this._searchService.currentEngine;
                searchName = currentBrowserEngine && currentBrowserEngine.name || this.brandingData.searchName;
                this.api.Settings.PrefsModule.overwrite(searchNamePref, searchName);
            }
            let engine = searchName && this._getVisibleEngineByName(searchName);
            let engineName = engine && engine.name;
            if (!engineName) {
                engineName = this.brandingData.searchName;
            }
            if (engineName !== searchName) {
                this.api.Settings.PrefsModule.overwrite(searchNamePref, engineName);
            }
            return engineName;
        }.bind(this));
        this._checkBrandedClidImport();
        return this.currentEngineName;
    },
    set currentEngineName(aEngineName) {
        let storeBranch = this.api.Settings.getComponentBranchPath();
        let searchNamePref = storeBranch + "searchName";
        this.api.Settings.PrefsModule.set(searchNamePref, aEngineName);
        this._currentEngineIsBranded = null;
    },
    get currentEngineIsBranded() {
        if (this._currentEngineIsBranded === null) {
            this._currentEngineIsBranded = this._isBrandedEngine(this.currentEngineName);
        }
        return this._currentEngineIsBranded;
    },
    get brandedWeekSearchIsOverflowed() {
        if (!("_brandedWeekSearchIsOverflowed" in this)) {
            let timeNowInSecs = Date.now() / 1000;
            let usedTime = Math.abs(timeNowInSecs - this.searchTutorInstallTime);
            let secsInWeek = 60 * 60 * 24 * 7;
            if (usedTime < secsInWeek) {
                this._brandedWeekSearchIsOverflowed = null;
                let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                timer.initWithCallback({
                    notify: function () {
                        delete this._brandedWeekSearchIsOverflowed;
                    }.bind(this)
                }, 1000 * (secsInWeek - usedTime + 10000), timer.TYPE_ONE_SHOT);
            } else {
                this._brandedWeekSearchIsOverflowed = this._calculateBrandedWeekSearchOverflow();
            }
        }
        return this._brandedWeekSearchIsOverflowed;
    },
    _calculateBrandedWeekSearchOverflow: function Omnibox__calculateBrandedWeekSearchOverflow() {
        let brandedClid = this._brandedClid;
        if (!brandedClid || brandedClid === "null") {
            return false;
        }
        brandedClid = "clid=" + brandedClid;
        const MAX_VISITS = 3;
        const HIST_DAYS_CHECKED = 7;
        let historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
        let histQuery = historyService.getNewQuery();
        try {
            let url = this._getEngineSubmissionURL(this._permanentSearchEngine, true);
            histQuery.uri = Services.io.newURI(url, null, null);
        } catch (e) {
            Cu.reportError(e);
            return false;
        }
        histQuery.uriIsPrefix = true;
        histQuery.beginTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.beginTime = -HIST_DAYS_CHECKED * 24 * 60 * 60 * 1000000;
        histQuery.endTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.endTime = 0;
        let queryOptions = historyService.getNewQueryOptions();
        queryOptions.queryType = queryOptions.QUERY_TYPE_HISTORY;
        queryOptions.resultType = queryOptions.RESULTS_AS_URI;
        queryOptions.includeHidden = false;
        let queryResult = historyService.executeQuery(histQuery, queryOptions);
        let resultRoot = queryResult.root;
        resultRoot.containerOpen = true;
        let totalVisits = 0;
        try {
            for (let i = 0; i < resultRoot.childCount && totalVisits < MAX_VISITS; i++) {
                let node = resultRoot.getChild(i);
                if (node.uri.indexOf(brandedClid) != -1) {
                    totalVisits++;
                }
            }
        } catch (e) {
            Cu.reportError(e);
        } finally {
            resultRoot.containerOpen = false;
        }
        return totalVisits === MAX_VISITS;
    },
    get searchTutorInstallTime() {
        let installTime = this.getStaticPref("tutor.installTime", 0);
        if (installTime === 0) {
            installTime = parseInt(Date.now() / 1000, 10);
            if (this.getStaticPref("firststart", null)) {
                installTime -= 60 * 60 * 24 * 7 * 2;
            }
            this.setStaticPref("tutor.installTime", installTime);
        }
        return installTime;
    },
    get searchTutorClickedInfo() {
        if (this._searchTutorClickedInfo === null) {
            let clickedInfo = {};
            try {
                clickedInfo = JSON.parse(this.getStaticPref("tutor.clickedInfo", "{}"));
            } catch (e) {
            }
            let saveInfo = function saveInfo() {
                this.setStaticPref("tutor.clickedInfo", JSON.stringify(clickedInfo));
            }.bind(this);
            this._searchTutorClickedInfo = {
                put: function searchTutorClickedInfo_put(aExampleId) {
                    if (clickedInfo[aExampleId]) {
                        return;
                    }
                    clickedInfo[aExampleId] = 1;
                    saveInfo();
                },
                getFirstUnclikedIndex: function searchTutorClickedInfo_getFirstUnclikedIndex(aExampleIds) {
                    let res = 0;
                    aExampleIds.some(function (id, index) {
                        return clickedInfo[id] ? false : (res = index, true);
                    });
                    return res;
                }
            };
        }
        return this._searchTutorClickedInfo;
    },
    restoreDefaultEngine: function OmniBox_restoreDefaultEngine() {
        let visibleEngines = this.getVisibleEngines();
        let defaultEngineName = visibleEngines[0] && visibleEngines[0].name;
        if (!defaultEngineName) {
            throw new Error("Can not get default engine name.");
        }
        this.currentEngineName = defaultEngineName;
    },
    acceptCurrentEngineAsDefault: function OmniBox_acceptCurrentEngineAsDefault() {
        this.acceptedDefaultEngineName = this.currentEngineName;
    },
    get acceptedDefaultEngineName() {
        let storeBranch = this.api.Settings.getComponentBranchPath();
        let searchNamePref = storeBranch + "acceptedDefaultSearchName";
        return this.api.Settings.PrefsModule.get(searchNamePref, "");
    },
    set acceptedDefaultEngineName(aEngineName) {
        let storeBranch = this.api.Settings.getComponentBranchPath();
        let searchNamePref = storeBranch + "acceptedDefaultSearchName";
        this.api.Settings.PrefsModule.set(searchNamePref, aEngineName);
    },
    saveSearchEngineChoice: function OmniBox_saveSearchEngineChoice(aNewEngineName) {
        if (!aNewEngineName) {
            return;
        }
        let currentEngineName = this.currentEngineName;
        if (currentEngineName == aNewEngineName) {
            return;
        }
        this.currentEngineName = aNewEngineName;
        this.acceptedDefaultEngineName = "";
        Services.obs.notifyObservers({ name: aNewEngineName }, "yandex-omnibox-search-modified", false);
    },
    get canShowTutorial() {
        delete this.canShowTutorial;
        return this.canShowTutorial = this.api.Environment.branding.brandID == "yandex" && this.api.Environment.addon.locale == "ru";
    },
    logClickStatistics: function OmniBox_logClickStatistics(paramString) {
        if (!("logClickStatistics" in this.api.Statistics)) {
            return;
        }
        if (!this.api.Statistics.alwaysSendUsageStat) {
            return;
        }
        let version = this.api.Package.info.version.replace(/\./g, "-");
        this.api.Statistics.logClickStatistics({
            cid: 72474,
            path: [
                "fx",
                version,
                paramString
            ].join(".")
        });
    },
    _brandingData: null,
    get brandingData() {
        if (this._brandingData === null) {
            let uri = Services.io.newURI(this.api.Package.resolvePath("/config.xml"), null, null);
            let channel = Services.io.newChannelFromURI(uri);
            let stream = channel.open();
            let xmlDoc = this.api.XMLUtils.xmlDocFromStream(stream, uri, uri, false);
            let omniboxElement = xmlDoc.querySelector("Omnibox");
            let templateValues = {};
            let brandedClid = this._brandedClid;
            if (brandedClid !== "null") {
                templateValues.clid6 = brandedClid;
            }
            let branding = this.api.Environment.branding;
            let getTextContent = function _getTextContent(aQuerySelector) {
                let element = omniboxElement.querySelector(aQuerySelector);
                return branding.expandBrandTemplatesEscape(element.textContent, templateValues);
            };
            let brandingData = {
                suggestionsURL: getTextContent("Suggestions > Url"),
                searchURL: getTextContent("Search > Url"),
                searchSite: getTextContent("Search > Site"),
                searchLabel: getTextContent("Search > Label"),
                searchName: getTextContent("Search > Name"),
                searchNavigate: getTextContent("Search > Navigate")
            };
            this._brandingData = brandingData;
        }
        return this._brandingData;
    },
    get _formHistory() {
        delete this._formHistory;
        let scope = {};
        try {
            Cu.import("resource://gre/modules/FormHistory.jsm", scope);
        } catch (ex) {
        }
        return this._formHistory = scope.FormHistory;
    },
    get _textToSubURIService() {
        delete this._textToSubURIService;
        return this._textToSubURIService = Cc["@mozilla.org/intl/texttosuburi;1"].getService(Ci.nsITextToSubURI);
    },
    _convertQueryForURI: function SearchWidget__convertQueryForURI(aData, aQueryCharset) {
        let data = "";
        try {
            data = this._textToSubURIService.ConvertAndEscape(aQueryCharset, aData);
        } catch (ex) {
            data = this._textToSubURIService.ConvertAndEscape(DEFAULT_QUERY_CHARSET, aData);
        }
        return data;
    },
    _readSearchesDataForHost: function OmniBox__readSearchesDataForHost(submissionHost) {
        let host = this.OmniBox.URLEngine.getURIParam(this.brandingData.searchURL, "host");
        if (host) {
            host = host.replace(/^www\./, "");
        }
        if (host === submissionHost) {
            return [
                this.brandingData.searchURL,
                this.brandingData.suggestionsURL
            ];
        }
        return [];
    },
    _checkEngineDatas: function SearchWidget_checkEngineDatas(engine, terms, type) {
        let engineSubmission = engine.getSubmission(terms, "text/html", "keyword");
        let submissionHost = engineSubmission.uri.host.replace(/^www\./, "");
        let [
            searchURL,
            suggestionsURL
        ] = this._readSearchesDataForHost(submissionHost);
        if (!(searchURL && suggestionsURL)) {
            let resultSubmission = engine.getSubmission(terms, type, "keyword");
            return resultSubmission ? resultSubmission.uri.spec : "";
        }
        terms = this._convertQueryForURI(terms, "UTF-8");
        if (type == "application/x-suggestions+json") {
            return this.api.Environment.branding.expandBrandTemplates(suggestionsURL, { searchTerms: terms });
        }
        return searchURL + terms;
    },
    _getEngineURLFor: function SearchWidget__getEngineURLFor(engineId, terms, type) {
        if (!engineId) {
            let parts = terms.split(" ");
            if (parts.length && type !== "application/x-suggestions+json") {
                let engineByAlias = this._searchService.getEngineByAlias(parts.shift());
                if (engineByAlias) {
                    return this._checkEngineDatas(engineByAlias, parts.join(" "), type);
                }
            }
        }
        let engine = this._getVisibleEngineByName(engineId || this.currentEngineName);
        return this._checkEngineDatas(engine, terms, type);
    },
    makeSearchURLForString: function SearchWidget_makeSearchURLForString(aSearchTerms) {
        return this.makeEngineSearchURLForString(null, aSearchTerms);
    },
    makeSuggestURLForString: function SearchWidget_makeSuggestURLForString(aSearchTerms) {
        return this.makeEngineSuggestURLForString(null, aSearchTerms);
    },
    makeEngineSearchURLForString: function SearchWidget_makeEngineSearchURLForString(aEngineId, aSearchTerms) {
        return this._getEngineURLFor(aEngineId, aSearchTerms, null);
    },
    makeEngineSuggestURLForString: function SearchWidget_makeEngineSuggestURLForString(aEngineId, aSearchTerms) {
        return this._getEngineURLFor(aEngineId, aSearchTerms, "application/x-suggestions+json");
    },
    __enginesData: null,
    get _enginesData() {
        if (this.__enginesData === null) {
            this.__enginesData = {};
            let enginesDatafile = this.api.Files.getPackageStorage(true);
            enginesDatafile.append("engines.json");
            try {
                this.__enginesData = JSON.parse(this.api.Files.readTextFile(enginesDatafile));
            } catch (e) {
            }
            const MSECS_IN_DAY = 60 * 60 * 24 * 1000;
            const TIME_NOW = Date.now();
            for (let [
                        engineName,
                        engineData
                    ] in Iterator(this._enginesData)) {
                if (Math.abs(engineData.lastUsedTime - TIME_NOW) > 10 * MSECS_IN_DAY) {
                    delete this._enginesData[engineName];
                }
            }
            this.getVisibleEngines().forEach(function (engine) {
                let searchURL = this._getEngineSubmissionURL(engine, true);
                if (!searchURL) {
                    return;
                }
                let visits = this._getBrowserHistoryVisitsForURL(searchURL);
                (this.__enginesData[engine.name] || (this.__enginesData[engine.name] = {})).mounthVisits = visits;
            }, this);
            let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            timer.initWithCallback({
                notify: function () {
                    return this._saveEnginesData();
                }.bind(this)
            }, 24 * 60 * 60 * 1000, Ci.nsITimer.TYPE_ONE_SHOT);
        }
        return this.__enginesData;
    },
    set _enginesData(aValue) {
        this.__enginesData = aValue;
    },
    recordEngineUsage: function SearchWidget_recordEngineUsage(engineName) {
        if (!engineName) {
            throw new Error("No engine name given.");
        }
        (this._enginesData[engineName] || (this._enginesData[engineName] = {})).lastUsedTime = Date.now();
    },
    _saveEnginesData: function SearchWidget__saveCurrentEnginesData() {
        let enginesDatafile = this.api.Files.getPackageStorage(true);
        enginesDatafile.append("engines.json");
        try {
            this.api.Files.writeTextFile(enginesDatafile, JSON.stringify(this._enginesData));
        } catch (e) {
        }
        this._enginesData = null;
    },
    _getBrowserHistoryVisitsForURL: function SearchWidget__getBrowserHistoryVisitsForURL(aURL) {
        const HIST_DAYS_CHECKED = 30;
        let historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
        let histQuery = historyService.getNewQuery();
        try {
            histQuery.uri = Services.io.newURI(aURL, null, null);
        } catch (e) {
            return 0;
        }
        histQuery.uriIsPrefix = true;
        histQuery.beginTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.beginTime = -HIST_DAYS_CHECKED * 24 * 60 * 60 * 1000000;
        histQuery.endTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.endTime = 0;
        let queryOptions = historyService.getNewQueryOptions();
        queryOptions.queryType = queryOptions.QUERY_TYPE_HISTORY;
        queryOptions.resultType = queryOptions.RESULTS_AS_URI;
        queryOptions.includeHidden = true;
        let queryResult = historyService.executeQuery(histQuery, queryOptions);
        let resultRoot = queryResult.root;
        resultRoot.containerOpen = true;
        let totalVisits = 0;
        try {
            totalVisits = resultRoot.accessCount;
        } catch (e) {
            Cu.reportError(e);
        } finally {
            resultRoot.containerOpen = false;
        }
        return totalVisits;
    },
    getVisibleEnginesSorted: function SearchWidget_getVisibleEnginesSorted() {
        return this.getVisibleEngines().map(function (engine) {
            return {
                engine: engine,
                usageData: this._enginesData[engine.name] || {}
            };
        }, this);
    },
    getVisibleEngines: function SearchWidget_getVisibleEngines() {
        return this._visibleEnginesCached || (this._visibleEnginesCached = this._getVisibleEngines());
    },
    _getVisibleEngines: function SearchWidget__getVisibleEngines() {
        let _tryGetHost = function _tryGetHost(aURL) {
            const URI_FIXUP = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
            try {
                let uri = URI_FIXUP.createFixupURI(aURL, URI_FIXUP.FIXUP_FLAG_NONE);
                let host = uri.host.toLowerCase().replace(/^www\./, "");
                let publicSuffix = Services.eTLD.getPublicSuffix(uri);
                return host.substr(0, host.length - publicSuffix.length - 1);
            } catch (e) {
            }
            return null;
        }.bind(this);
        let brandingHost = _tryGetHost(this.brandingData.searchURL);
        let engines = this._searchService.getVisibleEngines({}).filter(function (engine) {
            let engineHost = _tryGetHost(engine.searchForm);
            if (engineHost === brandingHost) {
                return false;
            }
            return true;
        });
        let wikipediaWeight = 20;
        let googleWeight = 10;
        let weightsByHosts = Object.create(null);
        let _getEngineWeight = function _getEngineWeight(aEngine) {
            let res = 0;
            let host = _tryGetHost(aEngine.searchForm);
            if (/^\w{2,3}\.wikipedia$/.test(host)) {
                res = weightsByHosts[host] || (weightsByHosts[host] = wikipediaWeight);
                wikipediaWeight = 0;
            } else if (/^google$/.test(host)) {
                res = weightsByHosts[host] || (weightsByHosts[host] = googleWeight);
                googleWeight = 0;
            }
            return res;
        };
        engines = engines.sort(function (a, b) {
            return _getEngineWeight(b) - _getEngineWeight(a);
        });
        engines.unshift(this._permanentSearchEngine);
        return engines;
    },
    _getVisibleEngineByName: function SearchWidget__getEngineByName(name) {
        let engines = this.getVisibleEngines();
        return engines.filter(function (e) {
            return e.name === name;
        })[0] || engines[0] || null;
    },
    get _permanentSearchEngine() {
        if (!this.__permanentSearchEngine) {
            let branding = this.api.Environment.branding;
            let brandingData = this.brandingData;
            let ioService = Services.io;
            this.__permanentSearchEngine = {
                hidden: false,
                name: brandingData.searchName,
                searchForm: brandingData.searchURL,
                getSubmission: function SearchWidget_permanentEngine_getSubmission(data, responseType) {
                    let uri = null;
                    let submissionURL = responseType === "application/x-suggestions+json" ? brandingData.suggestionsURL : brandingData.searchURL;
                    try {
                        let url = branding.expandBrandTemplates(submissionURL, { searchTerms: data });
                        uri = ioService.newURI(url, null, null);
                    } catch (e) {
                    }
                    if (!uri) {
                        return null;
                    }
                    return {
                        uri: uri,
                        postData: null
                    };
                }
            };
        }
        return this.__permanentSearchEngine;
    },
    observe: function SearchWidget_observe(aSubject, aTopic, aData) {
        if (aTopic === "browser-search-engine-modified") {
            this._visibleEnginesCached = null;
        }
    },
    _getEngineSubmissionURL: function OmniBox__getEngineSubmissionURL(aEngine, aWithoutQuery) {
        let engineSubmission = aEngine.getSubmission("NevermindQueryString", "text/html", "keyword");
        let url = engineSubmission && engineSubmission.uri.spec || aEngine.searchForm || null;
        if (url && aWithoutQuery) {
            url = url.split(/(#|\?|NevermindQueryString)/)[0];
        }
        return url;
    },
    _getClidFromEngine: function Omnibox__getClidFromEngine(aEngine) {
        let searchURL = this._getEngineSubmissionURL(aEngine) || "";
        let match = searchURL.match(/[?&]clid=([^&]+)/);
        return match && match[1] || "";
    },
    _checkBrandedClidImport: function OmniBox__checkBrandedClidImport() {
        let currentBrowserEngine = this._searchService.currentEngine;
        let currentBrowserEngineName = currentBrowserEngine && currentBrowserEngine.name || "";
        if (this.getStaticPref("clid", null) === null) {
            this._importBrandedClid();
        } else if (currentBrowserEngineName !== this.getStaticPref("enginename", "") && this._isBrandedEngine(currentBrowserEngineName) && !this._isBrandedEngine(this.currentEngineName)) {
            this._importBrandedClid();
            this.currentEngineName = currentBrowserEngineName;
            this.acceptCurrentEngineAsDefault();
        }
        this.setStaticPref("enginename", currentBrowserEngineName);
    },
    _importBrandedClid: function OmniBox__importBrandedClid() {
        let clid = "null";
        let currentBrowserEngine = this._searchService.currentEngine;
        if (currentBrowserEngine && this._isBrandedEngine(currentBrowserEngine)) {
            clid = this._getClidFromEngine(currentBrowserEngine);
            if (clid) {
                this.api.logger.debug("Import branded clid from current browser engine: '" + clid + "'");
            } else {
                clid = this._getClidFromEngine(this._permanentSearchEngine);
                this.api.logger.debug("Import branded clid from permanent search engine: '" + clid + "'");
            }
            this._brandingData = null;
        }
        if (this._isFirstStart) {
            delete this._brandedClid;
            this._brandedClid = clid;
        } else {
            this.setStaticPref("clid", clid);
        }
    },
    get _brandedClid() {
        return this.getStaticPref("clid", "null");
    },
    get _brandedEngineNames() {
        const converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = "UTF-8";
        delete this._brandedEngineNames;
        return this._brandedEngineNames = [
            converter.ConvertToUnicode("Яндекс"),
            "Yandex"
        ];
    },
    _isBrandedEngine: function OmniBox__isBrandedEngine(aEngine) {
        let engineName = aEngine && typeof aEngine == "object" ? aEngine.name : aEngine;
        return engineName && this._brandedEngineNames.indexOf(engineName) !== -1;
    },
    getSearchLabel: function SearchWidget_getSearchLabel(terms) {
        let parts = terms.split(" ");
        let searchURL = "";
        let engineName = null;
        if (parts.length > 1) {
            let engine = this._searchService.getEngineByAlias(parts.shift());
            if (engine) {
                searchURL = engine.getSubmission("", "text/html", "keyword");
                engineName = engine.name;
            }
        }
        if (!searchURL) {
            searchURL = this.makeSearchURLForString("");
        }
        if (searchURL && this.brandingData.searchURL.indexOf(searchURL) === 0) {
            return this.brandingData.searchLabel;
        }
        if (engineName) {
            return engineName;
        }
        let searchName = this.currentEngineName;
        let engine = this._getVisibleEngineByName(this.currentEngineName);
        return !engine || searchName === this.brandingData.searchName ? this.brandingData.searchLabel : searchName;
    },
    getWelcomePageURL: function OmniBox_getWelcomePageURL() {
        return this.api.Package.resolvePath("welcome/ff.html");
    },
    _showWelcomePageOnStart: function OmniBox__showWelcomePageOnStart() {
        this._showWelcomePageOnStart = function () {
        };
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback({
            notify: function () {
                this._openWelcomePage();
            }.bind(this)
        }, 0, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    _openWelcomePage: function OmniBox__openWelcomePage() {
        if (!this._isFirstStart) {
            return;
        }
        if (this._isEmbedded()) {
            return;
        }
        this.api.Controls.navigateBrowser({
            url: this.getWelcomePageURL(),
            target: "new tab"
        });
    },
    get _isFirstStart() {
        let firstStart = !this.getStaticPref("firststart", null);
        if (firstStart) {
            this.setStaticPref("firststart", true);
        }
        delete this._isFirstStart;
        return this._isFirstStart = firstStart;
    },
    _isEmbedded: function OmniBox__isEmbedded() {
        try {
            return Boolean(this.api.Package.getFileInputChannel("/embedded"));
        } catch (e) {
        }
        return false;
    },
    _completelyReady: null,
    _delayedInitQueue: [],
    _searchService: null,
    __permanentSearchEngine: null,
    _visibleEnginesCached: null,
    _currentEngineIsBranded: null,
    _searchTutorClickedInfo: null
};
function OmniBoxUBItem(itemElement, itemClass, module) {
    this.itemElement = itemElement;
    itemElement.module = module;
    itemElement.setAttribute("yb-native-widget-name", WIDGET_ID);
}
OmniBoxUBItem.prototype = {
    itemElement: null,
    finalize: function OmniBoxUBItem_finalize() {
        this.itemElement.wdgtxDestructor();
        this.itemElement.module = null;
        this.itemElement = null;
    }
};
const userChromeCSS = {
    enable: function userChromeCSS_enable() {
        this._switch(true);
    },
    disable: function userChromeCSS_disable() {
        this._switch(false);
    },
    get _api() {
        return core.api;
    },
    _getUserChromeURI: function userChromeCSS__getUserChromeURI() {
        let chromeCSSFile = this._api.Files.getWidgetStorage(true);
        chromeCSSFile.append("userChrome.css");
        if (chromeCSSFile.exists()) {
            return Services.io.newFileURI(chromeCSSFile);
        }
        let fontsDir = Services.dirsvc.get("Fnts", Ci.nsIFile);
        if (!(fontsDir.exists() && fontsDir.isDirectory())) {
            return;
        }
        let arialFile = fontsDir.clone();
        arialFile.append("arial.ttf");
        if (!(arialFile.exists() && arialFile.isFile())) {
            return;
        }
        let arialbdFile = fontsDir.clone();
        arialbdFile.append("arialbd.ttf");
        if (!(arialbdFile.exists() && arialbdFile.isFile())) {
            return;
        }
        let arialFileSpec = Services.io.newFileURI(arialFile).spec;
        let arialbdFileSpec = Services.io.newFileURI(arialbdFile).spec;
        let fChannel = this._api.Package.getFileInputChannel("/native/userChrome.css");
        let fContent = this._api.StrUtils.readStringFromStream(fChannel.contentStream).replace(/%arial\-path%/g, arialFileSpec).replace(/%arialbd\-path%/g, arialbdFileSpec);
        this._api.Files.writeTextFile(chromeCSSFile, fContent);
        return Services.io.newFileURI(chromeCSSFile);
    },
    _switch: function userChromeCSS__switch(aEnable) {
        if (this._api.Environment.os.name != "windows") {
            return;
        }
        let userChromeCSSFileURI;
        try {
            userChromeCSSFileURI = this._getUserChromeURI();
        } catch (e) {
        }
        if (!userChromeCSSFileURI) {
            return;
        }
        const SS_SERVICE = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        const USER_SHEET = SS_SERVICE.USER_SHEET;
        if (aEnable) {
            if (!SS_SERVICE.sheetRegistered(userChromeCSSFileURI, USER_SHEET)) {
                try {
                    SS_SERVICE.loadAndRegisterSheet(userChromeCSSFileURI, USER_SHEET);
                } catch (e) {
                    this._api.logger.error("Can not register " + userChromeCSSFileURI.spec);
                    this._api.logger.debug(e);
                }
            }
        } else {
            if (SS_SERVICE.sheetRegistered(userChromeCSSFileURI, SS_SERVICE.USER_SHEET)) {
                try {
                    SS_SERVICE.unregisterSheet(userChromeCSSFileURI, USER_SHEET);
                } catch (e) {
                    this._api.logger.error("Can not unregister " + userChromeCSSFileURI.spec);
                    this._api.logger.debug(e);
                }
            }
        }
    }
};
