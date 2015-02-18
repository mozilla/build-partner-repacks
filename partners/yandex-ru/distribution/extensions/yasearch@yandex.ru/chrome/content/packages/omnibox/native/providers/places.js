"use strict";
const EXPORTED_SYMBOLS = ["DataProvider"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const {RESULT_SUCCESS, RESULT_NOMATCH} = Ci.nsIAutoCompleteResult;
const {MATCH_ANYWHERE, MATCH_BOUNDARY_ANYWHERE} = Ci.mozIPlacesAutoComplete;
const SEARCH_BEHAVIOR = Ci.mozIPlacesAutoComplete.BEHAVIOR_RESTRICT ? Ci.mozIPlacesAutoComplete.BEHAVIOR_HISTORY | Ci.mozIPlacesAutoComplete.BEHAVIOR_BOOKMARK | Ci.mozIPlacesAutoComplete.BEHAVIOR_TITLE | Ci.mozIPlacesAutoComplete.BEHAVIOR_URL | Ci.mozIPlacesAutoComplete.BEHAVIOR_TYPED : 0;
const FIRST_PACKET_TIMEOUT = 500;
const PACKET_TIMEOUT = 300;
const RESULTS_LIMIT_NUMBER = 50;
const RESULTS_LIMIT_TIME = 1000 * 60 * 60 * 24 * 90;
let placesWrapper = {
    finalize: function placesWrapper_finalize() {
        this.stopSearch();
        if (this.__databaseWrapper) {
            this.__databaseWrapper.close();
            delete this.__databaseWrapper;
        }
    },
    search: function placesWrapper_search(searchString, listener) {
        this.stopSearch();
        this._searchString = searchString;
        this._listener = listener;
        this._results = [];
        this._queryDatabase(MATCH_BOUNDARY_ANYWHERE);
    },
    stopSearch: function placesWrapper_stopSearch(notifyListener) {
        if (this._pendingQuery) {
            this._pendingQuery.cancel();
            delete this._pendingQuery;
        }
        if (notifyListener) {
            this._notifyListener();
        }
        this._listener = null;
        this._searchString = null;
        this._results = null;
    },
    _queryDatabase: function placesWrapper__queryDatabase(matchBehavior) {
        this._pendingQuery = this._databaseWrapper.executeQueryAsync({
            query: this._SQL_QUERY,
            columns: [
                "id",
                "url",
                "title",
                "bookmarked",
                "bookmark_title"
            ],
            parameters: {
                searchString: this._searchString,
                matchBehavior: matchBehavior,
                lastVisitDate: (Date.now() - RESULTS_LIMIT_TIME) * 1000
            },
            callback: this._queryDatabaseCallback.bind(this, matchBehavior)
        });
    },
    _queryDatabaseCallback: function placesWrapper__queryDatabaseCallback(matchBehavior, results) {
        if (this._searchString === null) {
            return;
        }
        this._results = this._results.concat(results.map(function (r) {
            let type = "favicon";
            if (r.tags) {
                type = "keyword";
            } else if (r.bookmarked) {
                type = "bookmark";
            }
            return {
                url: r.url,
                title: r.bookmark_title || r.title || "",
                type: type
            };
        }));
        this._notifyListener();
    },
    _notifyListener: function placesWrapper__notifyListener() {
        this._listener.onSearchResult({
            searchString: this._searchString,
            results: this._results
        });
    },
    _searchString: null,
    _listener: null,
    _results: null,
    _pendingQuery: null,
    __databaseWrapper: null,
    get _databaseWrapper() {
        if (!this.__databaseWrapper) {
            let PlacesUtils = Cu.import("resource://gre/modules/PlacesUtils.jsm", {}).PlacesUtils;
            let dbConnection = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
            this.__databaseWrapper = DataProvider.api.Database.createInstance();
            this.__databaseWrapper.connection = dbConnection.clone(true);
            let dbWriteInstance = DataProvider.api.Database.createInstance();
            dbWriteInstance.connection = dbConnection.clone(false);
            dbWriteInstance.executeQueryAsync({ query: this._SQL_QUERY_INDEX });
            dbWriteInstance.close();
        }
        return this.__databaseWrapper;
    },
    _SQL_QUERY: "SELECT h.id, h.url, h.title, " + "EXISTS(SELECT 1 FROM moz_bookmarks WHERE fk = h.id) AS bookmarked, " + "( " + "SELECT title FROM moz_bookmarks WHERE fk = h.id AND title NOTNULL " + "ORDER BY lastModified DESC LIMIT 1 " + ") AS bookmark_title " + "FROM moz_places h " + "WHERE h.frecency <> 0 " + "AND h.url NOT NULL " + "AND (" + "bookmarked " + "OR (h.last_visit_date >= :lastVisitDate)" + ") " + "AND AUTOCOMPLETE_MATCH(:searchString, h.url, " + "IFNULL(bookmark_title, h.title), NULL, " + "h.visit_count, h.typed, " + "bookmarked, NULL, " + ":matchBehavior, " + SEARCH_BEHAVIOR + ") " + "ORDER BY h.frecency DESC " + "LIMIT " + RESULTS_LIMIT_NUMBER,
    _SQL_QUERY_INDEX: "CREATE INDEX IF NOT EXISTS moz_places_yandex_omnibox " + "ON moz_places (frecency, last_visit_date, url, title, visit_count, typed)"
};
var DataProvider = {
    PROVIDER_NAME: "offline-places-suggest",
    DATA_SERVICE: "yaOmniBoxSuggestDataService",
    _waitingTimer: null,
    _searchNextStringTimer: null,
    _searchingStrings: null,
    _debugSearchStartTime: null,
    _statData: { time: 0 },
    init: function PlacesDataProvider_init(core) {
        this.api = core.api;
        Cu.import(this.api.Package.resolvePath("/native/urlengine.js"), this).URLEngine.init(this.api);
        XPCOMUtils.defineLazyGetter(this, "_BookmarksService", function () {
            return Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
        });
        this._providerService = this.api.Services.obtainService(this.api.componentID, this.DATA_SERVICE, this);
        if (!this._providerService) {
            return;
        }
        if (!this._providerService.registerDataProvider(this)) {
            return;
        }
    },
    finalize: function PlacesDataProvider_finalize() {
        this._stopSearch();
        placesWrapper.finalize();
    },
    observeServiceEvent: function PlacesDataProvider_observeServiceEvent(aProviderID, aServiceName, aTopic, aData) {
        if (this.DATA_SERVICE != aServiceName || this.api.componentID != aProviderID) {
            return;
        }
        switch (aTopic) {
        case "start-collecting":
            this._startSearch(aData);
            break;
        case "stop-collecting":
            this._stopSearch();
            break;
        }
    },
    _startSearch: function PlacesDataProvider_startSearch(aSearchStrings) {
        this._stopSearch();
        this._originalSearchStrings = [].concat(aSearchStrings);
        this._searchingStrings = [].concat(this._originalSearchStrings);
        this._suggestions = [];
        this._searchResult = RESULT_NOMATCH;
        this._debugSearchStartTime = Date.now();
        this._timing = Object.create(null);
        this._searchNextString();
    },
    _searchNextString: function PlacesDataProvider__searchNextString() {
        placesWrapper.stopSearch();
        this._setLongSearchTimer(false);
        let isFirstSearch = this._originalSearchStrings.length - this._searchingStrings.length === 1;
        if (isFirstSearch && this._suggestions.length >= 5 || !this._searchingStrings.length) {
            this.api.logger.trace("History (places) search time: " + (Date.now() - this._debugSearchStartTime) + " ms.");
            this._statData.time = Date.now() - this._timing[this._originalSearchStrings[0]];
            this._finishSearch(true);
            return;
        }
        let searchString = this._searchingStrings.shift();
        this._timing[searchString] = Date.now();
        this._setLongSearchTimer(isFirstSearch ? FIRST_PACKET_TIMEOUT : PACKET_TIMEOUT);
        this._searchNextStringTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._searchNextStringTimer.initWithCallback(placesWrapper.search.bind(placesWrapper, searchString, this), 0, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    _stopSearch: function PlacesDataProvider_stopSearch() {
        delete this._timing;
        this._finishSearch(false);
        placesWrapper.stopSearch();
    },
    _finishSearch: function PlacesDataProvider__finishSearch(aNotify) {
        [
            "_searchNextStringTimer",
            "_stopLongSearchTimer"
        ].forEach(function (timerName) {
            let timer = this[timerName] || null;
            if (timer) {
                timer.cancel();
                delete this[timerName];
            }
        }, this);
        if (aNotify) {
            this._notifyResults();
        }
        delete this._originalSearchStrings;
        delete this._searchingStrings;
        delete this._suggestions;
    },
    _notifyResults: function PlacesDataProvider__notifyResults() {
        this._providerService.handleResponse("start-collecting", {
            originalSearchStrings: this._originalSearchStrings,
            suggestions: this._suggestions,
            stat: this._statData,
            searchResult: RESULT_SUCCESS
        }, this);
    },
    _setLongSearchTimer: function PlacesDataProvider__stopLongSearchTimer(timeout) {
        if (this._stopLongSearchTimer) {
            this._stopLongSearchTimer.cancel();
            this._stopLongSearchTimer = null;
        }
        if (typeof timeout != "number") {
            return;
        }
        this._stopLongSearchTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._stopLongSearchTimer.initWithCallback(function () {
            placesWrapper.stopSearch(true);
        }, timeout, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    _getStyleForBookmark: function PlacesDataProvider__getStyleForBookmark(url, originalSearchString) {
        try {
            let uri = this.URLEngine.getURIFromString(url);
            let keyword = this._BookmarksService.getKeywordForURI(uri);
            return keyword.indexOf(originalSearchString) === 0 ? "keyword" : "bookmark";
        } catch (e) {
        }
        return "bookmark";
    },
    _processSearchResult: function PlacesDataProvider__processSearchResult(searchResult) {
        let originalSearchString = searchResult.searchString;
        let originalSearchStringLowerCase = originalSearchString.toLowerCase();
        let urlsHash = Object.create(null);
        this._suggestions.forEach(function (s) {
            urlsHash[s.value] = true;
        });
        let titles = [];
        let styles = [];
        let images = [];
        let suggestions = [];
        searchResult.results.forEach(function (result) {
            let title = result.title;
            if (title === "404") {
                return;
            }
            let url = this.URLEngine.validateURL(result.url, originalSearchString);
            if (/(clck\.yandex\.ru|yandex\.ru\/clck)\/(js)?redir|yabs\.yandex\.ru|an\.yandex\.ru\/count/i.test(url)) {
                return;
            }
            if (/^[a-z.]*yandex(\.com)?\.[a-z]+\//i.test(url)) {
                url = url.replace(/[?&](clid|ncrnd)=[^&#]+/g, "").replace(/\/$/, "");
            }
            if (url in urlsHash) {
                let style = result.type;
                switch (style) {
                case "bookmark":
                    style = this._getStyleForBookmark(url, originalSearchString);
                case "keyword":
                    suggestions[urlsHash[url]].style += " " + style;
                    break;
                default:
                    break;
                }
                return;
            }
            let titleLowered = title.toLowerCase();
            let noQueryURLLowered = url.split(/[?#]/)[0].toLowerCase();
            let dropResult = Boolean(originalSearchStringLowerCase) && !originalSearchStringLowerCase.split(/\s+/).filter(Boolean).some(function (s) {
                return titleLowered.indexOf(s) !== -1 || noQueryURLLowered.indexOf(s) !== -1;
            });
            if (dropResult) {
                return;
            }
            let style = result.type;
            if (style == "keyword") {
                let spaceIndex = originalSearchString.indexOf(" ");
                if (spaceIndex != -1) {
                    title += originalSearchString.substr(spaceIndex, originalSearchString.length);
                }
            } else if (style == "bookmark") {
                style = this._getStyleForBookmark(url, originalSearchString);
            }
            let urlText = url;
            let searchTextFromURL = this.URLEngine.extractSearchParam(url);
            if (searchTextFromURL) {
                if (searchTextFromURL.toLowerCase().indexOf(originalSearchStringLowerCase) == -1) {
                    return;
                }
                urlText = searchTextFromURL;
                title = "";
                style = "yaOfflineSearchHistory";
            }
            titles.push(title);
            styles.push(style);
            images.push("");
            urlsHash[url] = suggestions.length;
            let httpSchemeRE = /^(https?:\/\/)/;
            if (!searchTextFromURL && !httpSchemeRE.test(url) && httpSchemeRE.test(result.url)) {
                url = RegExp.$1 + url;
            }
            let suggestion = {
                value: urlText,
                comment: title,
                image: result.image,
                style: style,
                action: searchTextFromURL ? null : {
                    type: "openurl",
                    value: url
                }
            };
            suggestions.push(suggestion);
        }, this);
        this._suggestions = this._suggestions.concat(suggestions);
    },
    onSearchResult: function PlacesDataProvider_onSearchResult(searchResult) {
        if (!this._suggestions) {
            this._finishSearch(false);
            return;
        }
        this._processSearchResult(searchResult);
        this._searchNextString();
    }
};
