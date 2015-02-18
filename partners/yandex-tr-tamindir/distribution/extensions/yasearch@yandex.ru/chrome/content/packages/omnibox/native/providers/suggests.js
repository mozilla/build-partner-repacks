"use strict";
const EXPORTED_SYMBOLS = ["DataProvider"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PrivateBrowsingUtils", "resource://gre/modules/PrivateBrowsingUtils.jsm");
const HTTP_OK = 200;
let DataProvider = {
    SUGGEST_TIMEOUT: 500,
    PROVIDER_NAME: "online-yandex-suggest",
    DATA_SERVICE: "yaOmniBoxSuggestDataService",
    _statData: {
        exprt: 0,
        r: 0,
        time: 0
    },
    init: function SuggestDataProvider_init(core) {
        this._suggestsURL = core.brandingData.suggestionsURL;
        this._core = core;
        this.api = core.api;
        this._searchService = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);
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
    finalize: function SuggestDataProvider_finalize(core) {
    },
    observeServiceEvent: function SuggestDataProvider_observeServiceEvent(aProviderID, aServiceName, aTopic, aData) {
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
    _startSearch: function SuggestDataProvider__startSearch(aSearchStrings) {
        this._originalSearchString = aSearchStrings[0];
        this._suggestions = [];
        let trimmedSearchString = (aSearchStrings[0] || "").trim();
        this._trimmedSearchString = trimmedSearchString;
        this._stopSearch();
        if (!trimmedSearchString) {
            this._finishSearch(true);
            return;
        }
        this.suggestURL = this._core.makeSuggestURLForString(trimmedSearchString);
        if (!this.suggestURL) {
            this._finishSearch(true);
            return;
        }
        let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        req.open("GET", this.suggestURL, true);
        if (PrivateBrowsingUtils && req.channel instanceof Ci.nsIPrivateBrowsingChannel) {
            let topBrowserWindow = Services.wm.getMostRecentWindow("navigator:browser");
            if (topBrowserWindow) {
                req.channel.setPrivate(PrivateBrowsingUtils.isWindowPrivate(topBrowserWindow));
            }
        }
        req.channel.notificationCallbacks = new SearchSuggestLoadListener();
        let that = this;
        this._requestTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._requestTimer.initWithCallback(function () {
            that._finishSearch(true);
        }, this.SUGGEST_TIMEOUT, Ci.nsITimer.TYPE_ONE_SHOT);
        function onReadyStateChange() {
            that._onReadyStateChange(trimmedSearchString);
        }
        req.onreadystatechange = onReadyStateChange;
        req.send(this.SUGGEST_POSTDATA);
        this._time = new Date();
        this._request = req;
    },
    _stopSearch: function SuggestDataProvider_stopSearch() {
        this._finishSearch(false);
    },
    _finishSearch: function SuggestDataProvider__finishSearch(aNotify) {
        if (aNotify) {
            this._notifyResults(false);
        }
        if (!this._request) {
            return;
        }
        if (this._requestTimer) {
            this._requestTimer.cancel();
            this._requestTimer = null;
        }
        delete this._request;
        delete this._originalSearchString;
        delete this._suggestions;
    },
    _notifyResults: function SuggestDataProvider__notifyResults() {
        this._providerService.handleResponse("start-collecting", {
            originalSearchStrings: [this._originalSearchString],
            suggestions: this._suggestions,
            stat: this._statData,
            searchResult: Ci.nsIAutoCompleteResult.RESULT_SUCCESS
        }, this);
    },
    _onReadyStateChange: function SuggestDataProvider__onReadyStateChange(aSearchString) {
        if (aSearchString !== this._trimmedSearchString) {
            return;
        }
        if (!this._request || this._request.readyState != 4) {
            return;
        }
        this._handleResponse();
        this._finishSearch(true);
    },
    _parseResponse: function SuggestDataProvider__parseResponse(responseText) {
        let suggestionResults = [];
        let navigationSuggest = [];
        let comments = [];
        let infoObject = Object.create(null);
        let responseObject;
        try {
            responseObject = JSON.parse(responseText);
        } catch (e) {
        }
        if (!Array.isArray(responseObject)) {
            responseObject = [];
        }
        if (Array.isArray(responseObject[1])) {
            suggestionResults = responseObject[1];
        }
        if (Array.isArray(responseObject[2])) {
            comments = responseObject[2];
        }
        if (responseObject[4] && typeof responseObject[4] == "object") {
            infoObject = responseObject[4];
        }
        let suggestTypes = [];
        if (Array.isArray(infoObject["google:suggesttype"])) {
            suggestTypes = infoObject["google:suggesttype"];
        }
        let typesWeight = {
            weather: 6,
            traffic: 5,
            market: 4,
            lingvo: 3,
            maps: 2,
            units_converter: 1
        };
        let answers = new Array(suggestionResults.length);
        if (Array.isArray(infoObject["yandex:answer"])) {
            infoObject["yandex:answer"].forEach(function (answer) {
                if (!(answer && typeof answer == "object" && typeof answer.answer == "object" && answer.type in typesWeight && answer.position)) {
                    return;
                }
                let position = parseInt(answer.position, 10) - 1;
                if (position < 0 || position > suggestionResults.length) {
                    return;
                }
                let a = answers[position] || null;
                if (!a || typesWeight[a.type] < typesWeight[answer.type]) {
                    answers[position] = answer;
                }
            });
        }
        let suggestions = [];
        suggestionResults.forEach(function (res, index) {
            let textComment = comments[index];
            if (typeof textComment !== "string") {
                textComment = "";
            }
            let answerData = answers[index];
            if (typeof answerData !== "object") {
                answerData = null;
            }
            let isWizardAnswer = Boolean(answerData);
            let url = answerData && answerData.answer.url || this._getNavigationSuggestURL(res);
            url = url && this.URLEngine.validateURL(url);
            let showingText;
            let showingURL = url;
            if (answerData) {
                if (showingURL) {
                    showingURL = this.URLEngine.getURIParam(showingURL, "host") || showingURL;
                }
                let image;
                switch (answerData.type) {
                case "units_converter":
                    showingText = suggestionResults[index];
                    break;
                case "weather": {
                        if (answerData.answer.image) {
                            let url = "http://i.yastatic.net/weather/i/icons/22x22/" + answerData.answer.image + ".png";
                            image = "<img data-type='weather' src='" + url + "'/>";
                        }
                        break;
                    }
                case "traffic": {
                        if ([
                                "green",
                                "red",
                                "yellow"
                            ].indexOf(answerData.answer.semaphore) != -1) {
                            let url = this.api.Package.resolvePath("/icons/traffic/" + answerData.answer.semaphore + ".png");
                            image = "<img data-type='traffic' src='" + url + "'/>";
                        }
                        break;
                    }
                }
                textComment = [
                    answerData.answer.title,
                    image,
                    answerData.answer.text
                ].filter(function (el) {
                    return Boolean(el);
                }).join(" ") || textComment;
            }
            let style = "yaSearchSuggest";
            if (!showingText && showingURL) {
                if (index === 0 && suggestTypes[0] == "NAVIGATION") {
                    style = "yaSuperNavigationSuggest";
                } else {
                    style = "yaNavigationSuggest";
                }
            }
            if (showingText) {
                style = "yaOfflineSearchHistory";
            }
            if (isWizardAnswer) {
                style += " yaSuggestWizard";
            }
            let suggest = {
                value: showingText || showingURL || res,
                comment: textComment,
                image: "",
                style: style
            };
            if (url) {
                suggest.action = {
                    type: "openurl",
                    value: url
                };
            }
            suggestions.push(suggest);
        }, this);
        return suggestions;
    },
    _handleResponse: function SuggestDataProvider__handleResponse() {
        if (!this._request) {
            return;
        }
        let status;
        try {
            status = this._request.status;
        } catch (e) {
        }
        if (status != HTTP_OK) {
            return;
        }
        let responseText = this._request.responseText;
        if (!responseText) {
            return;
        }
        this._statData.time = new Date() - this._time;
        this._suggestions = this._parseResponse(responseText);
    },
    _getNavigationSuggestURL: function SuggestDataProvider__getNavigationSuggestURL(aString) {
        let [
            type,
            url
        ] = this.URLEngine.getInputType(aString, true);
        if (type == "url" && /^(https?|ftp):\/\//.test(url) && url.split("/")[2].indexOf(".") > 0) {
            return url;
        }
        return null;
    }
};
function SearchSuggestLoadListener() {
}
SearchSuggestLoadListener.prototype = {
    notifyCertProblem: function SSLL_certProblem() {
        return true;
    },
    notifySSLError: function SSLL_SSLError() {
        return true;
    },
    getInterface: function SSLL_getInterface(iid) {
        return this.QueryInterface(iid);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIBadCertListener2,
        Ci.nsISSLErrorListener,
        Ci.nsIInterfaceRequestor
    ])
};
