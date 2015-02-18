"use strict";
const EXPORTED_SYMBOLS = ["DataProvider"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const {RESULT_SUCCESS, RESULT_NOMATCH_ONGOING, RESULT_SUCCESS_ONGOING} = Ci.nsIAutoCompleteResult;
let DataProvider = {
    SEARCH_PARAM: null,
    PROVIDER_NAME: "offline-form-history-suggest",
    DATA_SERVICE: "yaOmniBoxSuggestDataService",
    get _formHistory() {
        delete this._formHistory;
        this._formHistory = Cc["@mozilla.org/autocomplete/search;1?name=form-history"].createInstance(Ci.nsIAutoCompleteSearch);
        return this._formHistory;
    },
    init: function FormHistoryDataProvider_init(core) {
        this.api = core.api;
        this.SEARCH_PARAM = this.api.Autocomplete.commonHistoryCategory;
        Cu.import(this.api.Package.resolvePath("/native/urlengine.js"), this);
        this.URLEngine.init(this.api);
        this._providerService = this.api.Services.obtainService(this.api.componentID, this.DATA_SERVICE, this);
        if (!this._providerService) {
            return;
        }
        if (!this._providerService.registerDataProvider(this)) {
            return;
        }
    },
    finalize: function FormHistoryDataProvider_finalize(core) {
    },
    observeServiceEvent: function FormHistoryDataProvider_observeServiceEvent(aProviderID, aServiceName, aTopic, aData) {
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
    _startSearch: function FormHistoryDataProvider_startSearch(aSearchStrings) {
        this._originalSearchStrings = aSearchStrings;
        this._searchingStrings = aSearchStrings.map(function (s) {
            return s.trim();
        }).filter(Boolean);
        this._suggestions = [];
        let searchProvidersEnabled = this.api.Settings.PrefsModule.get("browser.search.suggest.enabled", false);
        if (!searchProvidersEnabled) {
            this._finishSearch(true);
            return;
        }
        this._debugSearchStartTime = Date.now();
        this._searchNextString();
    },
    _searchNextString: function FormHistoryDataProvider__searchNextString() {
        if (!this._searchingStrings.length) {
            this.api.logger.trace("History (form) search time: " + (Date.now() - this._debugSearchStartTime) + " ms.");
            this._finishSearch(true);
            return;
        }
        let searchString = this._searchingStrings.shift();
        this._searchNextStringTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._searchNextStringTimer.initWithCallback({
            notify: function () {
                this._formHistory.startSearch(searchString, this.SEARCH_PARAM, null, this);
            }.bind(this)
        }, 10, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    _stopSearch: function FormHistoryDataProvider__stopSearch() {
        this._formHistory.stopSearch();
        this._finishSearch(false);
    },
    _finishSearch: function FormHistoryDataProvider__finishSearch(aNotify) {
        if (this._searchNextStringTimer) {
            this._searchNextStringTimer.cancel();
            delete this._searchNextStringTimer;
        }
        if (aNotify) {
            this._notifyResults();
        }
        delete this._originalSearchStrings;
        delete this._searchingStrings;
        delete this._suggestions;
    },
    _notifyResults: function FormHistoryDataProvider__notifyResults() {
        this._providerService.handleResponse("start-collecting", {
            originalSearchStrings: this._originalSearchStrings,
            suggestions: this._suggestions,
            searchResult: RESULT_SUCCESS
        }, this);
    },
    onSearchResult: function FormHistoryDataProvider_onSearchResult(aAutoCompleteSearch, aAutoCompleteResult) {
        if (typeof this._suggestions == "undefined") {
            return;
        }
        if (aAutoCompleteResult.searchResult == RESULT_NOMATCH_ONGOING || aAutoCompleteResult.searchResult == RESULT_SUCCESS_ONGOING) {
            return;
        }
        let originalSearchString = aAutoCompleteResult.searchString;
        let suggestions = [];
        let i = -1;
        while (++i < aAutoCompleteResult.matchCount) {
            let value = aAutoCompleteResult.getValueAt(i);
            let index = value.indexOf(originalSearchString);
            if (index === -1) {
                continue;
            }
            if (index === 0 || value[index - 1] === " ") {
                let url = this._getNavigationSuggestURL(value);
                suggestions.push({
                    value: url ? this.URLEngine.validateURL(value) : value,
                    comment: aAutoCompleteResult.getCommentAt(i),
                    image: null,
                    style: url ? "yaNavigationSuggest" : "yaOfflineSearchHistory"
                });
            }
        }
        this._suggestions = this._suggestions.concat(suggestions);
        this._searchNextString();
    },
    onUpdateSearchResult: function FormHistoryDataProvider_onUpdateSearchResult(aAutoCompleteSearch, aAutoCompleteResult) {
    },
    _getNavigationSuggestURL: function FormHistoryDataProvider__getNavigationSuggestURL(aString) {
        let [
            type,
            url
        ] = this.URLEngine.getInputType(aString, true);
        if (type == "url" && /^(https?|ftp):\/\//.test(url)) {
            return url;
        }
        return null;
    }
};
