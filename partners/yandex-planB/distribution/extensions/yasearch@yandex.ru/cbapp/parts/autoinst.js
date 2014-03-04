'use strict';
const EXPORTED_SYMBOLS = ['autoinstaller'];
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
            this._logger = application.getLogger('AutoInstaller');
        },
        get currentLimits() {
            var limits = {
                    __proto__: null,
                    total: Number.POSITIVE_INFINITY,
                    groups: { __proto__: null }
                };
            var left = {}, top = {}, width = {}, height = {};
            var primaryScreen = Cc['@mozilla.org/gfx/screenmanager;1'].getService(Ci.nsIScreenManager).primaryScreen;
            primaryScreen.GetAvailRect(left, top, width, height);
            var availWidth = width.value;
            var resolutionElements = xmlutils.queryXMLDoc('/autoinstall/resolutions/resolution', this.configDocument);
            for (let [
                        ,
                        resolutionElement
                    ] in Iterator(resolutionElements)) {
                let hResFrom = parseInt(resolutionElement.getAttribute('h-from'), 10);
                let hResTo = parseInt(resolutionElement.getAttribute('h-to'), 10);
                let resolutionFits = hResFrom <= availWidth && availWidth <= hResTo;
                if (!resolutionFits)
                    continue;
                let resCompLimit = parseInt(resolutionElement.getAttribute('limit'), 10);
                if (!isNaN(resCompLimit) && resCompLimit >= 0)
                    limits.total = resCompLimit;
                let groupElements = xmlutils.queryXMLDoc('./groups/group', resolutionElement);
                for (let [
                            ,
                            groupElement
                        ] in Iterator(groupElements)) {
                    let groupID = groupElement.getAttribute('id');
                    if (!groupID) {
                        this._logger.warn('Autoinstall group has no ID');
                        continue;
                    }
                    let groupLimitAttr = groupElement.getAttribute('limit');
                    let groupLimit = groupLimitAttr ? parseInt(groupLimitAttr, 10) : Number.POSITIVE_INFINITY;
                    limits.groups[groupID] = groupLimit;
                }
                break;
            }
            return limits;
        },
        get configDocument() {
            if (!this._configDoc)
                this._configDoc = this._application.branding.brandPackage.getXMLDocument('/toolbar/autoinst.xml');
            return this._configDoc;
        },
        genHistoryRelevantEntries: function AutoInstaller_genHistoryRelevantEntries(defaultPreset) {
            var installListDoc;
            try {
                installListDoc = this.configDocument;
            } catch (e) {
                this._logger.warn('Activation rules are not available. ' + strutils.formatError(e));
                return;
            }
            var currentLimits = this.currentLimits;
            this._logger.debug('Total component limit is ' + currentLimits.total);
            if (currentLimits.total < 1)
                return;
            var groupLimits = currentLimits.groups;
            var numOfEnabledComponents = 0;
            var defPresetCompIDs = defaultPreset.componentIDs;
            var compListElement = xmlutils.queryXMLDoc('/autoinstall/components', installListDoc)[0];
            if (!compListElement) {
                this._logger.warn('No component list! Giving up.');
                return;
            }
            var compElements = xmlutils.queryXMLDoc('./component', compListElement);
            for (let [
                        ,
                        compElement
                    ] in Iterator(compElements)) {
                let compGroupID = compElement.getAttribute('group-id');
                if (!(compGroupID in groupLimits)) {
                    this._logger.warn('Component group-id was not found: ' + compGroupID);
                    continue;
                }
                if (groupLimits[compGroupID] < 1)
                    continue;
                let compID = compElement.getAttribute('id');
                let presetCompEntry = defPresetCompIDs[compID];
                if (!presetCompEntry) {
                    this._logger.warn('Component with id \'' + compID + '\' was not found in default preset. Skipping this element.');
                    continue;
                }
                if (presetCompEntry.enabled !== presetCompEntry.ENABLED_AUTO) {
                    this._logger.warn('Component with id \'' + compID + '\' is not meant to be autoinstalled. Skipping this element.');
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
                        this._logger.debug('Components limit reached: ' + numOfEnabledComponents);
                        break;
                    }
                } catch (e) {
                    this._logger.error('An error occured for component \'' + compID + '\': ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
        },
        _checkBrowserHistoryFor: function Autoinstaller__checkBrowserHistoryFor(rulesElement) {
            var cookieElements = xmlutils.queryXMLDoc('./cookies/cookie', rulesElement);
            for (let [
                        ,
                        cookieElement
                    ] in Iterator(cookieElements)) {
                let url = cookieElement.getAttribute('url');
                let cookieName = cookieElement.getAttribute('name');
                if (!url || !cookieElements) {
                    this._logger.warn('Cookie element url or name missing. Skipping it.');
                    continue;
                }
                if (netutils.findCookies(url, cookieName, true).length)
                    return true;
            }
            var historyElements = xmlutils.queryXMLDoc('./history/url', rulesElement);
            if (historyElements.length < 1) {
                if (cookieElements.length < 1)
                    return true;
                return false;
            }
            var minVisits = xmlutils.queryXMLDoc('number(./history/@min-visits)', rulesElement);
            var totalVisits = this._getBrowserHistoryVisitsFor(historyElements, minVisits);
            return totalVisits >= minVisits;
        },
        _getBrowserHistoryVisitsFor: function Autoinstaller__getBrowserHistoryVisitsFor(historyElements, minVisits) {
            if (typeof minVisits == 'undefined')
                minVisits = Number.POSITIVE_INFINITY;
            var domains = historyElements;
            if (Array.isArray(historyElements)) {
                domains = Object.create(null);
                for (let [
                            ,
                            historyElement
                        ] in Iterator(historyElements)) {
                    let histDomain = historyElement.getAttribute('domain');
                    domains[histDomain] = true;
                }
            }
            var historyService = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService);
            var queryOptions = historyService.getNewQueryOptions();
            queryOptions.queryType = queryOptions.QUERY_TYPE_HISTORY;
            queryOptions.resultType = queryOptions.RESULTS_AS_URI;
            queryOptions.sortingMode = queryOptions.SORT_BY_DATE_DESCENDING;
            var histQuery = historyService.getNewQuery();
            histQuery.beginTimeReference = histQuery.TIME_RELATIVE_NOW;
            histQuery.beginTime = -HIST_DAYS_CHECKED * 24 * 60 * 60 * 1000000;
            histQuery.endTimeReference = histQuery.TIME_RELATIVE_NOW;
            histQuery.endTime = 0;
            histQuery.domainIsHost = false;
            var totalVisits = 0;
            for (let histDomain in domains) {
                let subdomainsOnly = histDomain[0] == '.';
                if (subdomainsOnly) {
                    histDomain = histDomain.substring(1);
                    queryOptions.maxResults = -1;
                } else {
                    queryOptions.maxResults = 0;
                }
                if (!histDomain) {
                    this._logger.warn('History url domain is missing. Skipping it.');
                    continue;
                }
                histQuery.domain = histDomain;
                let queryResult = historyService.executeQuery(histQuery, queryOptions);
                let resultRoot = queryResult.root;
                resultRoot.containerOpen = true;
                try {
                    if (!subdomainsOnly) {
                        totalVisits += resultRoot.accessCount;
                        this._logger.debug('Domain ' + histDomain + ' was accesed at least ' + resultRoot.accessCount + ' times');
                    } else {
                        let subdomainsAccessCount = 0;
                        let (i = 0, len = resultRoot.childCount) {
                            for (; i < len; i++) {
                                let resultNode = resultRoot.getChild(i);
                                let resultURI = netutils.newURI(resultNode.uri);
                                if (resultURI.host == histDomain)
                                    continue;
                                subdomainsAccessCount += resultNode.accessCount;
                                totalVisits += resultNode.accessCount;
                                if (totalVisits >= minVisits)
                                    break;
                            }
                        }
                        this._logger.debug('Subdomains of ' + histDomain + ' were accesed at least ' + subdomainsAccessCount + ' times');
                    }
                } finally {
                    resultRoot.containerOpen = false;
                }
                if (totalVisits >= minVisits)
                    break;
            }
            return totalVisits;
        }
    };
