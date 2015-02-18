"use strict";
const EXPORTED_SYMBOLS = ["OmniBox"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const OMNIBOX_SEARCH_PROTOCOL_NAME = "yaOmniBox";
const MAX_COMPLETE_RESULTS = 10;
const MAX_GROUP_RESULTS = 5;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
let OmniBox = {
    SEARCH_PROTOCOL_NAME: OMNIBOX_SEARCH_PROTOCOL_NAME,
    init: function OmniBox_init(core) {
        this.core = core;
        this._registerComponent();
        let api = core.api;
        this.MONO_DOMAINS_COUNT = api.Settings.PrefsModule.get("smartbox.behavior.mono_domains_count", 5);
        Cu.import(api.Package.resolvePath("/native/corrector/inputCorrector.js"), this).InputCorrector.init(core);
        Cu.import(api.Package.resolvePath("/native/urlengine.js"), this).URLEngine.init(api);
        Cu.import(api.Package.resolvePath("/native/providersManager.js"), this).ProvidersManager.init(core);
        this.dropTimes();
    },
    finalize: function OmniBox_finalize() {
        this.InputCorrector.finalize();
        this.InputCorrector = null;
        this.ProvidersManager.finalize();
        this.ProvidersManager = null;
        this.URLEngine.finalize();
        this.URLEngine = null;
        this._unregisterComponent();
        this.core = null;
    },
    get api() {
        return this.core.api;
    },
    get _isComponentRegistered() {
        return Components.manager.QueryInterface(Ci.nsIComponentRegistrar).isCIDRegistered(OmniBoxAutoCompleteSearch.classID);
    },
    _registerComponent: function OmniBox__registerComponent() {
        if (this._isComponentRegistered) {
            return;
        }
        let s = OmniBoxAutoCompleteSearch;
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(s.classID, s.classDescription, s.contractID, s);
    },
    _unregisterComponent: function OmniBox__unregisterComponent() {
        if (!this._isComponentRegistered) {
            return;
        }
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(OmniBoxAutoCompleteSearch.classID, OmniBoxAutoCompleteSearch);
    },
    hasCurrentLayout: function OmniBox_hasCurrentLayout(aString) {
        return this.InputCorrector.hasCurrentLayout(aString);
    },
    getSwitchedLayout: function OmniBox_getSwitchedLayout(aString) {
        return this.InputCorrector.getSwitchedLayout(aString);
    },
    dropTimes: function OmniBox_dropTimes() {
        this.onlinetimes = [];
        this.localtimes = [];
    }
};
var OmniBoxAutoCompleteSearch = {
    classDescription: "YaOmnibox Auto-Complete Search Javascript XPCOM Component",
    classID: Components.ID("9c44c220-9dda-11e0-82a2-5f3c55e510b7"),
    contractID: "@mozilla.org/autocomplete/search;1?name=" + OMNIBOX_SEARCH_PROTOCOL_NAME,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch]),
    createInstance: function OmniBoxAutoCompleteSearch_createInstance(aOuter, aIID) {
        return this.QueryInterface(aIID);
    },
    startSearch: function OmniBoxAutoCompleteSearch_startSearch(aSearchString, aSearchParam, aPreviousResult, aListener) {
        this.stopSearch();
        this._previousResult = aPreviousResult;
        if (/^moz-action:/.test(aSearchString)) {
            let [
                ,
                param
            ] = aSearchString.match(/^moz\-action:yaaction\-[^,]+,[^\s]+\s(.*)$/) || aSearchString.match(/^moz\-action:[^,]+,([^,]+),.*$/) || [];
            aSearchString = param || "";
        }
        this._searchString = aSearchString;
        this._searchStringSwitched = "";
        this._searchListener = aListener;
        this._searchStartTime = Date.now();
        let searchingStrings = [aSearchString];
        if (aSearchString.length > 0) {
            let switched = OmniBox.getSwitchedLayout(aSearchString);
            if (switched && aSearchString != switched) {
                searchingStrings.push(switched);
                this._searchStringSwitched = switched;
            }
        }
        this._searchStringLowered = this._searchString.toLowerCase();
        this._searchStringSwitchedLowered = this._searchStringSwitched.toLowerCase();
        this._notifySearchListenerOnSearchStart();
        OmniBox.ProvidersManager.startSearch(searchingStrings, this);
    },
    stopSearch: function OmniBoxAutoCompleteSearch_stopSearch() {
        if (this._searchStartTime) {
            OmniBox.onlinetimes.push("");
            OmniBox.localtimes.push("");
        }
        OmniBox.ProvidersManager.stopSearch();
        this._searchListener = null;
        this._searchString = null;
        this._searchStringSwitched = null;
        this._searchStringLowered = null;
        this._searchStringSwitchedLowered = null;
        this._searchStartTime = null;
    },
    _notifySearchListenerOnSearchStart: function OmniBoxAutoCompleteSearch__notifySearchListenerOnSearchStart() {
        let startNotificationResults = [
            {},
            null,
            {}
        ];
        if (this._previousSearchData && this._previousSearchData.searchString && this._searchString.indexOf(this._previousSearchData.searchString) === 0) {
            startNotificationResults[0] = this._previousSearchData.results;
        }
        this._onSearchResult(startNotificationResults);
    },
    _printArray: function OmniBoxAutoCompleteSearch__printArray(aName, aArray) {
        if (OmniBox.api.logger.level > 20) {
            return;
        }
        let info = aArray.map(function (entry) {
            return [
                entry.value,
                entry.style,
                entry.comment
            ];
        }).join(" === ");
        OmniBox.api.logger.debug("Data in '" + aName + "':\n" + info.join("\n"));
    },
    _uniqueMove: function OmniBoxAutoCompleteSearch__uniqueMove(to, from, count) {
        let itemsCount = Math.min(from.length, isNaN(count) ? Number.POSITIVE_INFINITY : count);
        for (let i = 0; i < itemsCount; i++) {
            let url = from[i].action && from[i].action.value || from[i].value;
            let [unique] = OmniBox.URLEngine.hasURL(to, url);
            if (!unique) {
                to.push(from[i]);
            }
        }
        return [
            to,
            from
        ];
    },
    _simpleRankingResults: function OmniBoxAutoCompleteSearch__simpleRankingResults(aSearchResults) {
        let mode = {};
        let history = [];
        let onlineSuperNavigationSuggestions = [];
        let onlineSearchSuggestions = [];
        let onlineNavigateSuggestions = [];
        let unknown = [];
        aSearchResults.forEach(function (result) {
            let resultsToPush = unknown;
            result.style = result.style.replace(/(^|\s)yaFirstSearchSuggest(\s|$)/, "");
            let styles = [result.style].concat(result.style.split(" "));
            for (let i = 0, len = styles.length; i < len; i++) {
                let style = styles[i];
                switch (style) {
                case "action":
                    if (result.value.indexOf("moz-action:switchtab") === 0) {
                        let topBrowserWindow = Services.wm.getMostRecentWindow("navigator:browser");
                        let browser = topBrowserWindow && topBrowserWindow.gBrowser;
                        let currentURL = browser && browser.currentURI && browser.currentURI.spec;
                        if (currentURL && result.value.indexOf("," + currentURL) != -1) {
                            return;
                        }
                        resultsToPush = history;
                    }
                    break;
                case "yaSuperNavigationSuggest":
                    resultsToPush = onlineSuperNavigationSuggestions;
                    break;
                case "yaOfflineSearchHistory":
                case "yaNavigationSuggest":
                case "yaSearchSuggest":
                    resultsToPush = onlineSearchSuggestions;
                    break;
                case "bookmark":
                case "keyword":
                case "tag":
                case "favicon":
                    resultsToPush = history;
                    break;
                }
                if (resultsToPush !== unknown) {
                    break;
                }
            }
            resultsToPush.push(result);
        }, this);
        [
            onlineSearchSuggestions,
            ,
        ] = this._uniqueMove(onlineNavigateSuggestions, onlineSearchSuggestions, onlineSearchSuggestions.length);
        let allResults = [];
        let navigationGroup = [];
        let searchingGroup = [];
        let matchedArray = history;
        let autocompleteSearchSuggest = false;
        let hasHostMatches = false;
        if (history.length) {
            let host = OmniBox.URLEngine.getURIParam(history[0].value, "host");
            if (host) {
                hasHostMatches = host.indexOf(this._searchString) === 0 || this._searchStringSwitched && host.indexOf(this._searchStringSwitched) === 0;
            }
        }
        autocompleteSearchSuggest = hasHostMatches;
        if (history.length) {
            if (!hasHostMatches && onlineSuperNavigationSuggestions.length) {
                autocompleteSearchSuggest = true;
                let tempArray = [onlineSuperNavigationSuggestions.shift()];
                [
                    tempArray,
                    history
                ] = this._uniqueMove(tempArray, history, history.length);
                history = tempArray;
            }
            mode.current_state = "nav";
            allResults = allResults.concat(history.splice(0, Math.min(MAX_GROUP_RESULTS, history.length)));
            [
                allResults,
                onlineSearchSuggestions
            ] = this._uniqueMove(allResults, onlineSearchSuggestions, Math.min(MAX_GROUP_RESULTS, onlineSearchSuggestions.length));
        } else if (onlineSuperNavigationSuggestions.length) {
            mode.current_state = "nav";
            allResults = allResults.concat(onlineSuperNavigationSuggestions.shift()).concat(history.splice(0, Math.min(4, history.length)));
            [
                allResults,
                onlineSearchSuggestions
            ] = this._uniqueMove(allResults, onlineSearchSuggestions, Math.min(MAX_GROUP_RESULTS, onlineSearchSuggestions.length));
        } else {
            mode.current_state = "search";
            [
                allResults,
                onlineSearchSuggestions
            ] = this._uniqueMove(allResults, onlineSearchSuggestions, Math.min(MAX_GROUP_RESULTS, onlineSearchSuggestions.length));
            allResults = allResults.concat(history.splice(0, Math.min(MAX_GROUP_RESULTS, history.length)));
        }
        if (allResults.length && allResults[0].style.indexOf("keyword") != -1) {
            autocompleteSearchSuggest = false;
        }
        if (!allResults.length && this._searchString.trim() !== "") {
            mode.metric = "not_shown";
            let [type] = OmniBox.URLEngine.getInputType(this._searchString);
            allResults.push({
                value: this._searchString,
                comment: "",
                image: null,
                style: type == "url" ? "yaNavigationSuggest" : "yaSearchSuggest"
            });
        }
        if (allResults.length == 1 && allResults[0].style.indexOf("yaSearchSuggest") != -1) {
            mode.metric = "not_shown";
            let slashed = this._searchString.substr(-1) === "/";
            let [type] = OmniBox.URLEngine.getInputType(this._searchString);
            if (type === "url") {
                allResults.push({
                    value: this._searchString + (slashed ? "" : "/"),
                    comment: "",
                    image: null,
                    style: "yaNavigationSuggest"
                });
            }
            if (slashed && allResults.length == 2) {
                let searchElement = allResults.shift();
                allResults.push(searchElement);
            }
        }
        let [type] = OmniBox.URLEngine.getInputType(this._searchString);
        if (type === "url") {
            allResults.unshift({
                value: this._searchString,
                comment: "",
                image: null,
                style: "yaNavigationSuggest"
            });
        }
        if (allResults.length == 1 && allResults[0].style.indexOf("yaNavigationSuggest") != -1) {
            mode.metric = "not_shown";
            allResults.push({
                value: this._searchString,
                comment: "",
                image: null,
                style: "yaSearchSuggest"
            });
        }
        let navigationStyleRE = /(^|\s)(ya(First)?SearchSuggest|ya(Super)?NavigationSuggest|favicon|bookmark)(\s|$)/;
        let getIndexInHost = function getIndexInHost(aSearchResult) {
            let index = 0;
            if (!navigationStyleRE.test(aSearchResult.style)) {
                return index;
            }
            let url = aSearchResult.action && aSearchResult.action.value || aSearchResult.value;
            if (OmniBox.URLEngine.getInputType(url, true)[0] !== "url") {
                return index;
            }
            let host = OmniBox.URLEngine.getURIParam(url, "host");
            host = host && host.replace(/^www\./, "").replace(/\.[^.]+$/, "").toLowerCase();
            if (!host) {
                return index;
            }
            host = host + ".";
            if (host.indexOf(this._searchStringLowered) === 0) {
                index = 3;
            } else if (host.indexOf(this._searchStringLowered) !== -1) {
                index = 2;
            } else if (host.indexOf(this._searchStringSwitchedLowered) === 0) {
                index = 1;
            }
            if (index && /(^|\s)yaSuperNavigationSuggest(\s|$)/.test(aSearchResult.style)) {
                index += 3;
            }
            return index;
        }.bind(this);
        let unsortedAllResults = [].concat(allResults);
        allResults.sort(function (a, b) {
            let aWeight = getIndexInHost(a);
            let bWeight = getIndexInHost(b);
            if (bWeight !== aWeight) {
                return bWeight - aWeight;
            }
            return unsortedAllResults.indexOf(a) - unsortedAllResults.indexOf(b);
        });
        if (allResults.length && allResults[0].style.indexOf("yaSearchSuggest") != -1) {
            mode.metric = "not_shown";
        }
        let searchInsertIndex = 0;
        let firstResult = allResults[0];
        if (firstResult) {
            let style = firstResult.style;
            if (/(^|\s)yaSuperNavigationSuggest(\s|$)/.test(style)) {
                searchInsertIndex = 1;
            } else if (/(^|\s)favicon(\s|$)/.test(style)) {
                let firstValueLowered = firstResult.value.toLowerCase();
                if (firstValueLowered.indexOf(this._searchStringLowered) === 0 || this._searchStringSwitchedLowered && firstValueLowered.indexOf(this._searchStringSwitchedLowered) === 0) {
                    searchInsertIndex = 1;
                }
            }
        }
        if (this._searchString) {
            allResults.splice(searchInsertIndex, 0, {
                value: this._searchString,
                comment: "",
                image: null,
                style: "yaSearchSuggest"
            });
        }
        if (firstResult && /(^|\s)(yaSuperNavigationSuggest|favicon|bookmark)(\s|$)/.test(firstResult.style)) {
            let urlMatch = firstResult.value.match(/^([-\w]*:\/+)?([^\/]+)(\/.+)?/);
            let [
                _,
                scheme,
                domain,
                path
            ] = urlMatch || [
                undefined,
                undefined,
                undefined,
                undefined
            ];
            let domainLowered = domain && domain.toLowerCase();
            if (!/^moz-action:/.test(firstResult.value) && domainLowered && (domainLowered.indexOf(this._searchStringLowered) === 0 || this._searchStringSwitchedLowered && domainLowered.indexOf(this._searchStringSwitchedLowered) === 0)) {
                let style = "favicon";
                if (/(^|\s)bookmark(\s|$)/.test(firstResult.style)) {
                    let firstValueLowered = firstResult.value.toLowerCase();
                    if (domainLowered === firstValueLowered.replace(/^https?:\/\//, "").replace(/\/$/, "")) {
                        style += " bookmark";
                    }
                }
                allResults.unshift({
                    value: domainLowered,
                    comment: "",
                    image: null,
                    style: style,
                    action: {
                        type: "openurl",
                        value: (scheme || "") + domainLowered
                    }
                });
            }
        }
        if (OmniBox.URLEngine.getInputType(this._searchString)[0] == "url") {
            allResults.unshift({
                value: this._searchString,
                comment: "",
                image: null,
                style: "yaNavigationSuggest"
            });
        }
        allResults = allResults.filter(function (result, index) {
            let isSearch = /(^|\s)(yaOfflineSearchHistory|yaSearchSuggest)(\s|$)/.test(result.style);
            let key = result.value;
            if (!isSearch) {
                key = key.replace(/^(http|ftp)s?:\/\//, "").replace(/#.*/, "").replace(/\/$/, "");
            }
            key += " " + (isSearch ? result.comment : "nav");
            if (key in this) {
                return false;
            }
            this[key] = true;
            return true;
        }, Object.create(null));
        allResults = allResults.slice(0, 10);
        for (let i = 0, len = allResults.length; i < len; i++) {
            let result = allResults[i];
            let isSearch = /(^|\s)(yaOfflineSearchHistory|yaSearchSuggest)(\s|$)/.test(result.style);
            if (isSearch) {
                allResults[i].style += " yaFirstSearchSuggest";
                break;
            }
        }
        autocompleteSearchSuggest = Boolean(allResults.length);
        return [
            allResults,
            autocompleteSearchSuggest,
            mode
        ];
    },
    _prepareStatistic: function OmniBoxAutoCompleteSearch__prepareStatistic(providersStats, currentMode, allResults) {
        let stat = {
            exprt: 0,
            r: 0
        };
        let placesStats = providersStats["offline-places-suggest"];
        if (placesStats) {
            OmniBox.localtimes.push(placesStats.time);
        }
        let onlineStats = providersStats["online-yandex-suggest"];
        if (onlineStats) {
            stat = onlineStats;
            OmniBox.onlinetimes.push(onlineStats.time);
        }
        stat.user_input = this._searchString || "";
        stat.current_state = currentMode.current_state;
        stat.metric = currentMode.metric;
        stat.matches = allResults.map(function (elem) {
            let comment = elem.comment.toLowerCase();
            let value = elem.value.toLowerCase();
            let type;
            let styles = elem.style.split(" ");
            switch (styles[0]) {
            case "yaSearchSuggest":
                type = "s";
                if (styles.length > 0 && styles[1] == "yaFirstSearchSuggest") {
                    type = "q";
                }
                break;
            case "yaSuperNavigationSuggest":
                type = "n";
                break;
            case "yaNavigationSuggest":
                type = "p";
                break;
            case "bookmark":
                type = "b";
                break;
            case "yaOfflineSearchHistory":
                type = "o";
                break;
            case "action":
                type = "t";
                break;
            default:
                type = "h";
                break;
            }
            let indexValue = value.indexOf(this._searchStringLowered);
            let number = indexValue === -1 ? 0 : OmniBox.URLEngine.aroundPillarPoint(value, indexValue) ? 2 : 1;
            let res = type + number;
            if (type != "s" && type != "q") {
                let indexComment = comment.indexOf(this._searchStringLowered);
                let pillar = OmniBox.URLEngine.aroundPillarPoint(comment, indexComment);
                res += "t" + (indexComment === -1 ? 0 : pillar ? 2 : 1);
            }
            return res;
        }, this);
        return stat;
    },
    _onSearchResult: function OmniBoxAutoCompleteSearch__onSearchResult(aSearchResults, aRememberSearchData) {
        let [
            results,
            statistics,
            status
        ] = aSearchResults;
        if (aRememberSearchData) {
            this._previousSearchData = {
                results: results,
                searchString: this._searchString
            };
        }
        let suggestions = [];
        Object.keys(results).forEach(function (key) {
            if (results[key]) {
                suggestions = suggestions.concat(results[key]);
            }
        });
        let [
            allResults,
            autocompleteSearchSuggest,
            currentMode
        ] = this._simpleRankingResults(suggestions);
        OmniBox.currentStat = statistics ? this._prepareStatistic(statistics, currentMode, allResults) : null;
        let statuses = Object.keys(status).map(function (k) {
            return status[k];
        }).filter(Boolean);
        statuses.sort();
        let resultStatus = statuses.length ? statuses[statuses.length - 1] : Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
        allResults.forEach(function (elem) {
            if (elem.action) {
                return;
            }
            let [
                ,
                ,
                type
            ] = elem.style.match(/(^|\s)(keyword|yaNavigationSuggest|yaOfflineSearchHistory|yaSearchSuggest)(\s|$)/) || [
                undefined,
                undefined,
                undefined
            ];
            if (!type) {
                return;
            }
            let url;
            let actionType;
            switch (type) {
            case "keyword":
                actionType = "keyword";
                url = elem.value;
            case "yaNavigationSuggest":
                let [
                    ,
                    _url
                ] = OmniBox.URLEngine.getInputType(elem.value);
                url = _url || elem.value;
                break;
            case "yaOfflineSearchHistory":
            case "yaSearchSuggest":
                actionType = "opensearch";
                url = OmniBox.core.makeSearchURLForString(elem.value);
                break;
            }
            if (!url) {
                return;
            }
            elem.action = {
                type: actionType || "openurl",
                value: url
            };
        }, this);
        this._notifySearchListener(resultStatus, allResults, autocompleteSearchSuggest);
    },
    get OmniBoxSearchAutoCompleteResult() {
        delete this.OmniBoxSearchAutoCompleteResult;
        Cu.import(OmniBox.api.Package.resolvePath("/native/autoComplResTempl.js"), this);
        return this.OmniBoxSearchAutoCompleteResult;
    },
    _notifySearchListener: function OmniBoxAutoCompleteSearch__notifySearchListener(aResultStatus, aResults, autocompleteSearchSuggest) {
        if (!this._searchListener) {
            return;
        }
        if (this._previousResult && this._previousResult.searchString == this._searchString && this._searchString.length > 0) {
            let browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
            if (browserWindow && browserWindow.gURLBar._controlHandled) {
                aResults.unshift({
                    value: "http://" + this._searchString + "/",
                    comment: OmniBox.core.brandingData.searchNavigate,
                    image: "",
                    style: "yaNavigationSuggest"
                });
            }
        }
        let completeDefaultIndex = -1;
        if (aResults.length && autocompleteSearchSuggest && /(^|\s)(yaDefaultComplete|yaNavigationSuggest|bookmark|tag|favicon)($|\s)/.test(aResults[0].style) || aResults.length && /(^|\s)(yaSuperNavigationSuggest)($|\s)/.test(aResults[0].style)) {
            completeDefaultIndex = 0;
        }
        let result = new this.OmniBoxSearchAutoCompleteResult(this._searchString, aResultStatus, aResults, aResults.length, completeDefaultIndex, "");
        let resultFunction = this._searchListener.onUpdateSearchResult || this._searchListener.onSearchResult;
        if (resultFunction) {
            resultFunction(this, result);
        }
    },
    _previousSearchData: null
};
