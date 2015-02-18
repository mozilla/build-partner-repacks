"use strict";
const EXPORTED_SYMBOLS = ["ProvidersManager"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const VERSION = "1.0";
let SuggestDataService = {
    SERVICE_NAME: "yaOmniBoxSuggestDataService",
    getVersion: function SuggestDataService_getVerion() {
        return VERSION;
    },
    registerDataProvider: function SuggestDataService_registerDataProvider(aProvider) {
        return ProvidersManager.registerDataProvider(aProvider);
    },
    handleResponse: function SuggestDataService_handleResponse(aTopic, aData, aProvider) {
        if (aTopic == "start-collecting") {
            ProvidersManager.onSearchResult(aProvider, aData);
        }
    },
    removeDataProvider: function SuggestDataService_removeDataProvider(aProvider) {
        ProvidersManager.removeDataProvider(aProvider);
    }
};
var ProvidersManager = {
    init: function ProvidersManager_init(core) {
        this.core = core;
        core.api.Services.registerService(SuggestDataService.SERVICE_NAME, SuggestDataService);
        this._clearProvidersQueue();
        this._loadDataProviders();
    },
    finalize: function ProvidersManager_finalize() {
        this.stopSearch();
        this._unloadDataProviders();
        this._dataProviders = Object.create(null);
        this.api.Services.unregisterService(SuggestDataService.SERVICE_NAME);
        this.core = null;
    },
    get api() {
        return this.core.api;
    },
    BATCH_RESULTS_WAIT_TIME: 1000,
    PROVIDERS_NAME: [
        "places",
        "suggests",
        "formHistory"
    ],
    get PROVIDERS_LENGTH() {
        delete this.PROVIDERS_LENGTH;
        return this.PROVIDERS_LENGTH = this.PROVIDERS_NAME.length;
    },
    startSearch: function ProvidersManager_startSearch(aSearchStrings, aListener) {
        this.stopSearch();
        this._searchListener = aListener;
        this._searchStartTime = Date.now();
        this.api.Services.notifyServiceUsers(SuggestDataService.SERVICE_NAME, "start-collecting", aSearchStrings);
    },
    stopSearch: function ProvidersManager_stopSearch() {
        this.api.Services.notifyServiceUsers(SuggestDataService.SERVICE_NAME, "stop-collecting");
        this._searchListener = null;
        this._searchString = null;
        this._searchStartTime = null;
        this._clearProvidersQueue();
        this._setOnSearchResultTimer(null);
    },
    _clearProvidersQueue: function ProvidersManager__clearProvidersQueue() {
        this._results = {};
        this._stats = {};
        this._searchResult = {};
    },
    onSearchResult: function ProvidersManager_onSearchResult(aDataProvider, aResult) {
        let providerName = aDataProvider.PROVIDER_NAME;
        this._stats[providerName] = aResult.stat;
        this._searchResult[providerName] = aResult.searchResult;
        this._results[providerName] = aResult.suggestions;
        let timeout = 0;
        if (Object.keys(this._results).length !== this.PROVIDERS_LENGTH) {
            let searchTime = Math.abs(Date.now() - this._searchStartTime);
            timeout = Math.max(0, this.BATCH_RESULTS_WAIT_TIME - searchTime);
        }
        this._setOnSearchResultTimer(timeout);
    },
    _onSearchResultTimer: null,
    _setOnSearchResultTimer: function ProvidersManager__setOnSearchResultTimer(timeout) {
        if (this._onSearchResultTimer) {
            this._onSearchResultTimer.cancel();
            this._onSearchResultTimer = null;
        }
        if (typeof timeout !== "number") {
            return;
        }
        this._onSearchResultTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._onSearchResultTimer.initWithCallback(function () {
            if (!this._searchListener) {
                return;
            }
            this._searchListener._onSearchResult([
                this._results,
                this._stats,
                this._searchResult
            ], true);
        }.bind(this), timeout, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    registerDataProvider: function ProvidersManager_registerDataProvider(aProvider) {
        if (this._dataProviders[aProvider.PROVIDER_NAME]) {
            return false;
        }
        this._dataProviders[aProvider.PROVIDER_NAME] = aProvider;
        return true;
    },
    removeDataProvider: function ProvidersManager_removeDataProvider(aProvider) {
        if (this._dataProviders[aProvider.PROVIDER_NAME]) {
            delete this._dataProviders[aProvider.PROVIDER_NAME];
        }
    },
    _loadDataProviders: function ProvidersManager__loadDataProviders() {
        for (let [
                    name,
                    provider
                ] in Iterator(this._providers)) {
            provider.init(this.core);
        }
    },
    _unloadDataProviders: function ProvidersManager__unloadDataProviders() {
        for (let [
                    name,
                    provider
                ] in Iterator(this._providers)) {
            provider.finalize(this.core);
        }
    },
    get _providers() {
        let providers = Object.create(null);
        let providersPath = this.api.Package.resolvePath("/native/providers/");
        this.PROVIDERS_NAME.forEach(function (aProviderName) {
            providers[aProviderName] = Cu.import(providersPath + aProviderName + ".js", {}).DataProvider;
        });
        return providers;
    },
    _dataProviders: Object.create(null)
};
