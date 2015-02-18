"use strict";
const EXPORTED_SYMBOLS = ["autoinstaller"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const HIST_DAYS_CHECKED = 30;
const autoinstaller = {
    init: function AutoInstaller_init(application) {
        this._application = application;
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL, {
            sysutils: 1,
            strutils: 1,
            xmlutils: 1,
            netutils: 1,
            misc: 1
        });
        this._logger = application.getLogger("AutoInstaller");
    },
    ACTIVATED_IDS_PREF_NAME: "autoinstall.activated",
    get activatedComponentIds() {
        let activatedIds = this._application.preferences.get(this.ACTIVATED_IDS_PREF_NAME, null);
        try {
            activatedIds = activatedIds && JSON.parse(activatedIds);
        } catch (e) {
        }
        return activatedIds && Array.isArray(activatedIds) ? activatedIds : null;
    },
    set activatedComponentIds(val) {
        if (!Array.isArray(val)) {
            throw new TypeError("Value must be an Array.");
        }
        this._application.preferences.set(this.ACTIVATED_IDS_PREF_NAME, JSON.stringify(val));
    },
    _autoActivatedComponentIds: [],
    get autoActivatedComponentIds() {
        throw new Error("Setter only available");
    },
    set autoActivatedComponentIds(val) {
        this._autoActivatedComponentIds = val;
    },
    get currentLimits() {
        let limits = {
            __proto__: null,
            total: Number.POSITIVE_INFINITY,
            groups: { __proto__: null }
        };
        let left = {};
        let top = {};
        let width = {};
        let height = {};
        let primaryScreen = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager).primaryScreen;
        primaryScreen.GetAvailRect(left, top, width, height);
        let availWidth = width.value;
        let resolutionElements = xmlutils.queryXMLDoc("/autoinstall/resolutions/resolution", this.configDocument);
        for (let [
                    ,
                    resolutionElement
                ] in Iterator(resolutionElements)) {
            let hResFrom = parseInt(resolutionElement.getAttribute("h-from"), 10);
            let hResTo = parseInt(resolutionElement.getAttribute("h-to"), 10);
            let resolutionFits = hResFrom <= availWidth && availWidth <= hResTo;
            if (!resolutionFits) {
                continue;
            }
            let resCompLimit = parseInt(resolutionElement.getAttribute("limit"), 10);
            if (!isNaN(resCompLimit) && resCompLimit >= 0) {
                limits.total = resCompLimit;
            }
            let groupElements = xmlutils.queryXMLDoc("./groups/group", resolutionElement);
            for (let [
                        ,
                        groupElement
                    ] in Iterator(groupElements)) {
                let groupID = groupElement.getAttribute("id");
                if (!groupID) {
                    this._logger.warn("Autoinstall group has no ID");
                    continue;
                }
                let groupLimitAttr = groupElement.getAttribute("limit");
                let groupLimit = groupLimitAttr ? parseInt(groupLimitAttr, 10) : Number.POSITIVE_INFINITY;
                limits.groups[groupID] = groupLimit;
            }
            break;
        }
        return limits;
    },
    get configDocument() {
        if (!this._configDoc) {
            this._configDoc = this._application.branding.brandPackage.getXMLDocument("/toolbar/autoinst.xml");
        }
        return this._configDoc;
    },
    genHistoryRelevantEntries: function AutoInstaller_genHistoryRelevantEntries(defaultPreset) {
        let installListDoc;
        try {
            installListDoc = this.configDocument;
        } catch (e) {
            this._logger.warn("Activation rules are not available. " + strutils.formatError(e));
            return;
        }
        let currentLimits = this.currentLimits;
        this._logger.debug("Total component limit is " + currentLimits.total);
        if (currentLimits.total < 1) {
            return;
        }
        let groupLimits = currentLimits.groups;
        let numOfEnabledComponents = 0;
        let defPresetCompIDs = defaultPreset.componentIDs;
        let compListElement = xmlutils.queryXMLDoc("/autoinstall/components", installListDoc)[0];
        if (!compListElement) {
            this._logger.warn("No component list! Giving up.");
            return;
        }
        let compElements = xmlutils.queryXMLDoc("./component", compListElement);
        if (this._application.addonManager.info.isFreshAddonInstall) {
            new sysutils.Timer(function () {
                let version = xmlutils.queryXMLDoc("number(./autoinstall/@version)", installListDoc);
                this._sendStatistic(defPresetCompIDs, version, compElements);
            }.bind(this), 15000);
        }
        for (let [
                    ,
                    compElement
                ] in Iterator(compElements)) {
            let compGroupID = compElement.getAttribute("group-id");
            if (!(compGroupID in groupLimits)) {
                this._logger.warn("Component group-id was not found: " + compGroupID);
                continue;
            }
            if (groupLimits[compGroupID] < 1) {
                continue;
            }
            let compID = compElement.getAttribute("id");
            let presetCompEntry = defPresetCompIDs[compID];
            if (!presetCompEntry) {
                this._logger.warn("Component with id '" + compID + "' was not found in default preset. Skipping this element.");
                continue;
            }
            if (presetCompEntry.enabled !== presetCompEntry.ENABLED_AUTO) {
                this._logger.warn("Component with id '" + compID + "' is not meant to be autoinstalled. Skipping this element.");
                continue;
            }
            try {
                let enableComponent = this._checkBrowserHistoryFor(compElement);
                if (enableComponent) {
                    numOfEnabledComponents++;
                    groupLimits[compGroupID]--;
                    yield presetCompEntry;
                }
                if (numOfEnabledComponents >= currentLimits.total) {
                    this._logger.debug("Components limit reached: " + numOfEnabledComponents);
                    break;
                }
            } catch (e) {
                this._logger.error("An error occured for component '" + compID + "': " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
    },
    _checkBrowserHistoryFor: function Autoinstaller__checkBrowserHistoryFor(rulesElement) {
        let cookieElements = xmlutils.queryXMLDoc("./cookies/cookie", rulesElement);
        for (let [
                    ,
                    cookieElement
                ] in Iterator(cookieElements)) {
            let url = cookieElement.getAttribute("url");
            let cookieName = cookieElement.getAttribute("name");
            if (!url || !cookieElements) {
                this._logger.warn("Cookie element url or name missing. Skipping it.");
                continue;
            }
            if (netutils.findCookies(url, cookieName, true).length) {
                return true;
            }
        }
        let historyElements = xmlutils.queryXMLDoc("./history/url", rulesElement);
        if (historyElements.length < 1) {
            if (cookieElements.length < 1) {
                return true;
            }
            return false;
        }
        let historyConditions = [];
        for (let [
                    ,
                    historyElement
                ] in Iterator(historyElements)) {
            let histDomain = historyElement.getAttribute("domain");
            historyConditions.push({
                domain: historyElement.getAttribute("domain"),
                path: historyElement.getAttribute("path")
            });
        }
        let minVisits = xmlutils.queryXMLDoc("number(./history/@min-visits)", rulesElement);
        let totalVisits = this.getBrowserHistoryVisitsFor(historyConditions, minVisits);
        return totalVisits >= minVisits;
    },
    getBrowserHistoryVisitsFor: function Autoinstaller_getBrowserHistoryVisitsFor(historyConditions, minVisits) {
        if (typeof minVisits == "undefined") {
            minVisits = Number.POSITIVE_INFINITY;
        }
        let historyService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
        let queryOptions = historyService.getNewQueryOptions();
        queryOptions.queryType = queryOptions.QUERY_TYPE_HISTORY;
        queryOptions.resultType = queryOptions.RESULTS_AS_URI;
        queryOptions.sortingMode = queryOptions.SORT_BY_DATE_DESCENDING;
        let histQuery = historyService.getNewQuery();
        histQuery.beginTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.beginTime = -HIST_DAYS_CHECKED * 24 * 60 * 60 * 1000000;
        histQuery.endTimeReference = histQuery.TIME_RELATIVE_NOW;
        histQuery.endTime = 0;
        histQuery.domainIsHost = false;
        let totalVisits = 0;
        for (let i = 0, len = historyConditions.length; i < len; i++) {
            let historyCondition = historyConditions[i];
            let histDomain = historyCondition.domain;
            let histPath = historyCondition.path;
            let subdomainsOnly = histDomain[0] == ".";
            if (subdomainsOnly) {
                histDomain = histDomain.substring(1);
            }
            if (subdomainsOnly || histPath) {
                queryOptions.maxResults = -1;
            } else {
                queryOptions.maxResults = 0;
            }
            if (!histDomain) {
                this._logger.warn("History url domain is missing. Skipping it.");
                continue;
            }
            histQuery.domain = histDomain;
            let queryResult = historyService.executeQuery(histQuery, queryOptions);
            let resultRoot = queryResult.root;
            resultRoot.containerOpen = true;
            try {
                if (subdomainsOnly || histPath) {
                    let subdomainsAccessCount = 0;
                    for (let i = 0, len = resultRoot.childCount; i < len; i++) {
                        let resultNode = resultRoot.getChild(i);
                        let resultURI = netutils.newURI(resultNode.uri);
                        if (subdomainsOnly && resultURI.host === histDomain) {
                            continue;
                        }
                        if (histPath && resultURI.path.indexOf(histPath) !== 0) {
                            continue;
                        }
                        subdomainsAccessCount += resultNode.accessCount;
                        totalVisits += resultNode.accessCount;
                        if (totalVisits >= minVisits) {
                            break;
                        }
                    }
                    this._logger.debug((subdomainsOnly ? "Subdomains of" : "Domain") + "\"" + histDomain + "\" " + (histPath ? " and path \"" + histPath + "\" " : "") + "were accesed at least " + subdomainsAccessCount + " times");
                } else {
                    totalVisits += resultRoot.accessCount;
                    this._logger.debug("Domain \"" + histDomain + "\" was accesed at least " + resultRoot.accessCount + " times");
                }
            } finally {
                resultRoot.containerOpen = false;
            }
            if (totalVisits >= minVisits) {
                break;
            }
        }
        return totalVisits;
    },
    _sendStatistic: function Autoinstaller__sendStatistic(defaultPreset, version, compElements) {
        this._sendStatistic = function () {
        };
        if (!this._application.statistics.alwaysSendUsageStat) {
            return;
        }
        this._sendAutoinstallStatistic(defaultPreset, version, compElements);
        this._sendHistoryStatistic();
    },
    _sendAutoinstallStatistic: function Autoinstaller__sendAutoinstallStatistic(defPresetCompIDs, version, compElements) {
        if (!version) {
            this._logger.warn("No version in autoinstall config.");
            return;
        }
        let autoinstData = Object.create(null);
        for (let [
                    ,
                    compElement
                ] in Iterator(compElements)) {
            let compID = compElement.getAttribute("id");
            let statisticsID = compElement.getAttribute("statistics-id");
            if (!statisticsID) {
                continue;
            }
            let presetCompEntry = defPresetCompIDs[compID];
            if (!presetCompEntry) {
                continue;
            }
            try {
                let enableComponent = this._checkBrowserHistoryFor(compElement);
                if (enableComponent) {
                    autoinstData[presetCompEntry.componentID] = statisticsID;
                }
            } catch (e) {
                this._logger.error("An error occured for component '" + compID + "': " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
        let componentsTotal = [];
        for (let [
                    compID,
                    statisticsID
                ] in Iterator(autoinstData)) {
            componentsTotal.push(statisticsID);
        }
        let componentsUsed = this._autoActivatedComponentIds.map(componentID => autoinstData[componentID]);
        this._logger.debug("Autoinstall statistic\n" + "	Used components: " + (componentsUsed.join(", ") || "none") + "\n" + "	Total components: " + (componentsTotal.join(", ") || "none"));
        this._application.statistics.logClickStatistics({
            cid: 72510,
            path: [
                "fx.autoselect",
                version,
                this._application.branding.brandID,
                componentsUsed.join("-") || "none",
                componentsTotal.join("-") || "none"
            ].join(".")
        });
    },
    _sendHistoryStatistic: function AutoInstaller__sendHistoryStatistic() {
        function ceil(number, step) {
            return Math.ceil(number / step) * step;
        }
        let PlacesUtils = Cu.import("resource://gre/modules/PlacesUtils.jsm", {}).PlacesUtils;
        let dbConnection = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
        let databaseWrapper = new this._application.core.Lib.Database();
        databaseWrapper.connection = dbConnection.clone(true);
        let historyVisits = databaseWrapper.execSimpleQuery("SELECT COUNT(id) FROM moz_historyvisits") || 0;
        let daysWithHistory = databaseWrapper.execSimpleQuery("SELECT COUNT(id) " + "   FROM (" + "       SELECT id FROM moz_historyvisits" + "       GROUP BY date(visit_date / 1000000, 'unixepoch')" + "   )") || 0;
        let minVisitDate = databaseWrapper.execSimpleQuery("SELECT MIN(visit_date) FROM moz_historyvisits");
        databaseWrapper.close();
        let daysTotal = 0;
        if (minVisitDate) {
            const ONE_DAY_IN_MSEC = 1000 * 60 * 60 * 24;
            daysTotal = Math.max(0, Date.now() - minVisitDate / 1000);
            daysTotal = parseInt(daysTotal / ONE_DAY_IN_MSEC, 10);
        }
        this._logger.debug("History statistic (raw): " + "daysTotal: " + daysTotal + " (minVisitDate: " + minVisitDate + "); " + "daysWithHistory: " + daysWithHistory + "; " + "historyVisits: " + historyVisits);
        if (daysTotal >= 361) {
            daysTotal = 361;
        } else if (daysTotal > 60) {
            daysTotal = ceil(daysTotal, 20);
        } else {
            daysTotal = ceil(daysTotal, 10) || 10;
        }
        if (daysWithHistory > 361) {
            daysWithHistory = ceil(daysWithHistory, 20);
        } else if (daysWithHistory > 60) {
            daysWithHistory = ceil(daysWithHistory, 10);
        } else {
            daysWithHistory = ceil(daysWithHistory, 5) || 5;
        }
        if (historyVisits > 1000) {
            historyVisits = ceil(historyVisits, 200);
        } else {
            historyVisits = ceil(historyVisits, 100) || 100;
        }
        this._logger.debug("History statistic (rounded): " + "D: " + daysTotal + "; " + "Dh: " + daysWithHistory + "; " + "H: " + historyVisits);
        this._application.statistics.logClickStatistics({
            cid: 72510,
            path: [
                "fx.browseruse",
                daysTotal,
                daysWithHistory,
                historyVisits
            ].join(".")
        });
    }
};
