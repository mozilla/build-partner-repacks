"use strict";
const EXPORTED_SYMBOLS = ["thumbsSuggest"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");
const MAX_SUGGESTED_NUM = 40;
const THUMBS_PER_PAGE = 10;
const RESULTS_LIMIT_NUMBER = 100;
const RESULTS_LIMIT_TIME = 1000 * 60 * 60 * 24 * 90;
const SEARCH_BEHAVIOR = Ci.mozIPlacesAutoComplete.BEHAVIOR_RESTRICT ? Ci.mozIPlacesAutoComplete.BEHAVIOR_HISTORY | Ci.mozIPlacesAutoComplete.BEHAVIOR_TITLE | Ci.mozIPlacesAutoComplete.BEHAVIOR_URL | Ci.mozIPlacesAutoComplete.BEHAVIOR_TYPED : 0;
const SOURCE_TYPES = {
    HISTORY: 0,
    BOOKMARKS: 1,
    TABS: 2,
    WEB: 3
};
Object.keys(SOURCE_TYPES).forEach(key => SOURCE_TYPES[SOURCE_TYPES[key]] = key);
const requestedURLs = Object.create(null);
const urlToTitle = Object.create(null);
const thumbsSuggest = {
    init: function thumbsSuggest_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("thumbsSuggest");
        let dataproviders = this._application.dataproviders;
        this.faviconsProvider = dataproviders.getProvider("favicons");
        this.logosProvider = dataproviders.getProvider("logos");
        this.faviconsProvider.addListener("change", this._onDataReceived.bind(this));
        this.logosProvider.addListener("change", this._onDataReceived.bind(this));
    },
    finalize: function thumbsSuggest_finalize() {
        this._logger = null;
        this._application = null;
    },
    requestThumbData: function thumbsSuggest_requestThumbData(url) {
        let host = this._application.fastdial.getDecodedUrlHost(url);
        if (!host) {
            return url;
        }
        if (url in requestedURLs) {
            this._updateThumb(url);
            return url;
        }
        requestedURLs[url] = true;
        this.faviconsProvider.requestData(url);
        this.logosProvider.requestData(url, { requestSource: true });
        return url;
    },
    _updateThumb: function thumbsSuggest__updateThumb(url) {
        if (!(url in requestedURLs)) {
            return;
        }
        let thumb = this.getThumbForUrl(url);
        this._application.fastdial.sendRequest("historyThumbChanged", thumb);
    },
    getThumbForUrl: function thumbsSuggest_getThumbForUrl(url) {
        let uri;
        let host;
        try {
            uri = netutils.newURI(url);
            host = uri.host;
        } catch (err) {
        }
        if (!uri || !host) {
            return { url: url };
        }
        let isIndexPage = true;
        if (this._application.isYandexHost(uri.asciiHost)) {
            try {
                uri.QueryInterface(Ci.nsIURL);
            } catch (err) {
            }
            isIndexPage = !uri.filePath || uri.filePath === "/";
        } else {
            isIndexPage = uri.path === "/";
        }
        let favicon = this.faviconsProvider.get("favicon", { host: uri.host }) || {};
        let thumb = {
            url: url,
            title: urlToTitle[url] || "",
            backgroundColor: favicon.color,
            favicon: favicon.url,
            isIndexPage: isIndexPage,
            fontColor: favicon.color && this._application.colors.getFontColorByBackgroundColor(favicon.color) || null
        };
        let background = this.logosProvider.get("logo", { host: uri.host });
        if (background && background.color && background.logoMain) {
            thumb.fontColor = this._application.colors.getFontColorByBackgroundColor(background.color);
            thumb.backgroundColor = background.color;
            thumb.backgroundImage = isIndexPage ? background.logoMain : background.logoSub;
        }
        return thumb;
    },
    _onDataReceived: function thumbsSuggest__onDataReceived(eventName, target, data) {
        this._updateThumb(target.spec);
    },
    requestTopSites: function thumbsSuggest_requestTopSites(offset, callback) {
        async.parallel({
            blacklist: callback => this._application.blacklist.getAll(callback),
            pickup: callback => this._requestPickupCache(callback),
            brandedThumbs: callback => this._requestBrandedThumbs(callback),
            unsafe: callback => this._application.safebrowsing.listUnsafeDomains(callback),
            bookmarks: callback => this._application.bookmarks.requestList(MAX_SUGGESTED_NUM * 2, list => callback(null, list))
        }, (err, {blacklist, brandedThumbs, pickup, bookmarks, unsafe}) => {
            if (err) {
                throw err;
            }
            let {pinned, unpinned} = pickup;
            blacklist.excludeDomains = pickup.domains;
            unsafe.forEach(host => blacklist.excludeDomains[host] = true);
            bookmarks = bookmarks.map(bookmark => {
                bookmark.visits = 6;
                return bookmark;
            });
            unpinned = unpinned.concat(brandedThumbs);
            unpinned = unpinned.concat(bookmarks);
            unpinned.sort(function (a, b) {
                a.visits = a.visits || 0;
                b.visits = b.visits || 0;
                return b.visits - a.visits;
            });
            let popuplarSites = pinned.concat(unpinned).reduce(this._generateReduceFn(blacklist), []);
            popuplarSites = this._sliceResultByOffset(offset, popuplarSites);
            callback(popuplarSites.map(url => this.getThumbForUrl(url)));
            popuplarSites.forEach(url => this.requestThumbData(url));
        });
    },
    _requestBrandedThumbs: function thumbsSuggest__requestBrandedThumbs(callback) {
        callback(null, this._application.pickup.getBrandedThumbs({}).map(thumb => {
            return {
                visits: thumb.boost || 0,
                url: thumb.url,
                title: thumb.title
            };
        }));
    },
    requestLastVisited: function thumbsSuggest_requestLastVisited(offset, callback) {
        async.parallel({
            topSites: callback => this._requestPickupCache(callback),
            lastVisited: callback => this._requestLastVisited(callback),
            blacklist: callback => this._application.blacklist.getAll(callback),
            tabs: callback => this._requestOpenedTabs().then(tabs => callback(null, tabs))
        }, (err, results) => {
            if (err) {
                throw err;
            }
            results.blacklist.excludeDomains = results.topSites.domains;
            let lastVisited = Array.concat(results.tabs, results.lastVisited).reduce(this._generateReduceFn(results.blacklist), []);
            lastVisited = this._sliceResultByOffset(offset, lastVisited);
            callback(lastVisited.map(url => this.getThumbForUrl(url)));
            lastVisited.forEach(url => this.requestThumbData(url));
        });
    },
    searchLocalHistory: function searchSuggest_searchLocalHistory(searchQuery, callback) {
        let deferred = promise.defer();
        this._pendingQuery = this._databaseWrapper.executeQueryAsync({
            query: this._SQL_QUERY,
            columns: [
                "id",
                "url",
                "title",
                "visit_count",
                "typed"
            ],
            parameters: {
                searchString: searchQuery,
                matchBehavior: Ci.mozIPlacesAutoComplete.MATCH_BOUNDARY_ANYWHERE,
                lastVisitDate: (Date.now() - RESULTS_LIMIT_TIME) * 1000
            },
            callback: function thumbsSuggest__dbCallback(results) {
                deferred.resolve(results.map(result => {
                    let visits = result.visit_count || 0;
                    return {
                        url: result.url,
                        title: result.title || "",
                        visits: visits,
                        typed: Math.ceil(result.typed ? visits / 10 : 0)
                    };
                }));
            }
        });
        return deferred.promise;
    },
    __databaseWrapper: null,
    get _databaseWrapper() {
        if (!this.__databaseWrapper) {
            let dbConnection = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
            this.__databaseWrapper = new Database();
            this.__databaseWrapper.connection = dbConnection.clone(true);
        }
        return this.__databaseWrapper;
    },
    _SQL_QUERY: [
        "SELECT id, url, title, visit_count, typed",
        "FROM moz_places",
        "WHERE frecency <> 0",
        "AND url NOT NULL",
        "AND last_visit_date >= :lastVisitDate",
        "AND AUTOCOMPLETE_MATCH(:searchString, url,",
        "IFNULL(title, NULL), NULL,",
        "visit_count, typed,",
        "NULL, NULL,",
        ":matchBehavior, " + SEARCH_BEHAVIOR + ")",
        "ORDER BY frecency DESC",
        "LIMIT " + RESULTS_LIMIT_NUMBER
    ].join(" "),
    suggestURLs: function thumbsSuggest_suggestURLs(query, callback) {
        let queries = query.split(" ");
        queries = queries.filter(Boolean);
        let increasedIndex = queries.length;
        let typedCount = 1;
        if (queries.length > 1) {
            typedCount = queries.length;
            queries.push(queries.join(" "));
        } else {
            increasedIndex = -1;
        }
        let logger = this._logger;
        let getFinalWeightAndSendResult = (pages, source, queryPart) => {
            let domains = Object.create(null);
            pages = pages.reduce((res, page) => {
                if (!page) {
                    return res;
                }
                page.url = this.ascii2url(page.url);
                let urlWithoutProtocol = page.url.replace(/^https?:\/\//, "").replace(/^ftp:\/\//, "");
                let splittedURL = urlWithoutProtocol.split("/");
                if (splittedURL.length === 1 || splittedURL.length === 2) {
                    if (!splittedURL[1]) {
                        page.weight *= 2;
                    }
                }
                let domain = splittedURL[0];
                page.domain = domain;
                if (domain in domains && page.weight <= domains[domain]) {
                    return res;
                }
                domains[domain] = page.weight;
                let singleQueries = queries.slice();
                let fullQuery = singleQueries.pop();
                let lowerCasedTitle = page.title.toLowerCase();
                if (typedCount > 1) {
                    let ratio = 0;
                    singleQueries.forEach(query => {
                        if (lowerCasedTitle.indexOf(query) !== -1) {
                            ratio++;
                        }
                    });
                    if (ratio) {
                        page.weight *= ratio;
                    }
                    page.weight *= 10;
                    if (lowerCasedTitle.indexOf(fullQuery) !== -1) {
                        page.weight *= 100;
                    }
                } else if (fullQuery.indexOf("/") !== -1 || fullQuery.indexOf(".") !== -1) {
                    if (page.url.indexOf(fullQuery) !== -1) {
                        page.weight *= 100;
                    } else if (lowerCasedTitle.indexOf(fullQuery) !== -1) {
                        page.weight *= 50;
                    }
                } else {
                    let tokens = urlWithoutProtocol.split(".");
                    let path = tokens.pop();
                    if (path) {
                        path = path.split("/");
                        tokens = tokens.concat(path);
                    }
                    tokens = tokens.concat(lowerCasedTitle.replace(/^("|'|«|&quot;)/, "").split(" "));
                    tokens = tokens.filter(Boolean);
                    let tokenWeight = 110;
                    tokens.some(token => {
                        tokenWeight -= 10;
                        if (tokenWeight <= 1) {
                            return true;
                        }
                        if (token.indexOf(fullQuery) === 0) {
                            page.weight *= tokenWeight;
                            return true;
                        }
                        return false;
                    });
                }
                res.push(page);
                return res;
            }, []);
            callback(query, source, pages);
        };
        let webRequests = queries.map((word, index) => {
            return this._requestNavSuggest(word, query).then(response => {
                let pages = this._parseSuggest(response, increasedIndex === index, typedCount);
                getFinalWeightAndSendResult(pages, SOURCE_TYPES.WEB, word);
                return promise.resolve(pages);
            }, Cu.reportError);
        });
        let localHistory = queries.map((query, index) => {
            return this.searchLocalHistory(query).then(pages => {
                return promise.resolve(this._mapHistoryPagesWithInitialWeight(pages, increasedIndex === index, typedCount));
            });
        });
        let openedTabs = this._requestOpenedTabs().then(pages => {
            return promise.resolve(queries.map((query, index) => {
                return this._filterPagesByQuery(pages, query, increasedIndex === index, typedCount);
            }));
        });
        let bookmarks = queries.map((query, index) => {
            return this._application.bookmarks.findBookmarks(query).then(bookmarks => {
                return promise.resolve(this._filterPagesByQuery(bookmarks, query, increasedIndex === index, typedCount));
            }, Cu.reportError);
        });
        let queryStartTime = Date.now();
        let allLocalHistory = promise.all(localHistory);
        allLocalHistory.then(pages => {
            let mergedPages = this._concatResults(pages);
            mergedPages = this._filterPagesByHostname(mergedPages);
            getFinalWeightAndSendResult(mergedPages, SOURCE_TYPES.HISTORY);
        }, Cu.reportError);
        openedTabs.then(tabs => {
            let mergedTabs = this._concatResults(tabs);
            mergedTabs = this._filterPagesByHostname(mergedTabs);
            getFinalWeightAndSendResult(mergedTabs, SOURCE_TYPES.TABS);
        }, Cu.reportError);
        let allBookmarks = promise.all(bookmarks);
        allBookmarks.then(bookmarks => {
            let mergedBookmarks = this._concatResults(bookmarks);
            mergedBookmarks = this._filterPagesByHostname(mergedBookmarks);
            getFinalWeightAndSendResult(mergedBookmarks, SOURCE_TYPES.BOOKMARKS);
        }, Cu.reportError);
        let allWebRequests = promise.all(webRequests);
        allWebRequests.then(() => {
            delete this._queriesToXhrs[query];
        });
    },
    _filterPagesByHostname: function thumbsSuggest__filterPagesByHostname(pages) {
        return pages.filter(page => {
            try {
                if (netutils.newURI(page.url).host) {
                    return true;
                }
            } catch (e) {
            }
            return false;
        });
    },
    _filterPagesByQuery: function thumbsSuggest__filterPagesByQuery(pages, query, increasedWeight, typedCount) {
        return pages.reduce((res, page) => {
            if ((page.title || "").indexOf(query) !== -1 || page.url.indexOf(query) !== -1) {
                res.push({
                    url: page.url,
                    title: page.title,
                    weight: increasedWeight ? typedCount : 1
                });
            }
            return res;
        }, []);
    },
    _concatResults: function thumbsSuggest__concatResults(results) {
        let merged = results.reduce((res, suggest) => {
            res = res.concat(suggest);
            return res;
        }, []);
        return merged;
    },
    _mapHistoryPagesWithInitialWeight: function thumbsSuggest__mapPagesWithWeights(pages, increasedWeight, typedCount) {
        return pages.map(page => {
            page.weight = (increasedWeight ? typedCount : 1) * 2 * page.typed + page.visits;
            return page;
        });
    },
    _parseSuggest: function thumbsSuggest__parseSuggest(response, increasedWeight, typedCount) {
        if (!(response instanceof Object)) {
            return [];
        }
        let suggestedURLs = response[1];
        let suggestedTitles = response[2];
        if (suggestedURLs.length === 0) {
            return [];
        }
        let weight = 0.9;
        return suggestedURLs.reduce((res, url, index) => {
            if (weight < 0.1) {
                weight = 0.1;
            }
            if (!/^[a-zA-Z]+:(\/\/)?\w/.test(url)) {
                url = "http://" + url;
            }
            res.push({
                url: url,
                title: suggestedTitles[index],
                weight: (weight || 0.1) * (increasedWeight ? typedCount : 1)
            });
            weight -= 0.1;
            return res;
        }, []);
    },
    _requestOpenedTabs: function thumbsSuggest__requestOpenedTabs() {
        let deferred = promise.defer();
        let urls = [];
        misc.getBrowserWindows().forEach(function (chromeWin) {
            let tabBrowser = chromeWin.gBrowser;
            let tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
            if (!Array.isArray(tabs)) {
                return;
            }
            tabs.forEach(function (tab) {
                try {
                    let browser = tabBrowser.getBrowserForTab(tab);
                    let currentURI = browser.currentURI.spec;
                    if (/^(chrome|about|yafd|bar):/.test(currentURI)) {
                        return;
                    }
                    urls.push({
                        url: currentURI,
                        title: browser.contentTitle
                    });
                } catch (e) {
                }
            });
        });
        deferred.resolve(urls);
        return deferred.promise;
    },
    _requestNavSuggest: function thumbsSuggest__requestNavSuggest(word, query) {
        let url = this._suggestURL;
        if (!url) {
            return promise.reject("Suggest URL is null");
        }
        url = url.replace("{searchTerms}", encodeURIComponent(word));
        Object.keys(this._queriesToXhrs).forEach(q => {
            if (q !== query) {
                this._queriesToXhrs[q].forEach(xhr => {
                    xhr.abort();
                });
            }
        });
        let deferred = promise.defer();
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.QueryInterface(Ci.nsIDOMEventTarget);
        request.open("GET", url, true);
        request.responseType = "json";
        let logger = this._logger;
        let errorListener = function BackgroundImages_sync_errorListener(e) {
            logger.debug(e.type);
            deferred.reject(e);
        };
        request.addEventListener("abort", errorListener, false);
        request.addEventListener("error", errorListener, false);
        let timer = new sysutils.Timer(request.abort.bind(request), 10000);
        request.addEventListener("load", () => {
            timer.cancel();
            if (!request.response) {
                deferred.reject(new Error("Not valid JSON: " + request.responseText.slice(0, 100)));
                return;
            }
            deferred.resolve(request.response);
        });
        this._queriesToXhrs[query] = this._queriesToXhrs[query] || [];
        this._queriesToXhrs[query].push(request);
        request.send();
        return deferred.promise;
    },
    _queriesToXhrs: Object.create(null),
    get _suggestURL() {
        delete this._suggestURL;
        let xmlDoc = null;
        try {
            xmlDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
        } catch (err) {
        }
        if (!xmlDoc) {
            this._suggestURL = null;
            return this._suggestURL;
        }
        this._suggestURL = null;
        try {
            this._suggestURL = xmlDoc.querySelector("search").getAttribute("suggest_url") || null;
        } catch (err) {
        }
        return this._suggestURL;
    },
    _sliceResultByOffset: function thumbsSuggest__sliceResultByOffset(offset, result) {
        result = result.slice();
        if (offset > 0) {
            result = result.splice(offset, THUMBS_PER_PAGE + 1);
        } else {
            result.length = Math.min(result.length, THUMBS_PER_PAGE + 1);
        }
        return result;
    },
    _generateReduceFn: function thumbsSuggest__generateReduceFn(blacklist) {
        return (result, page) => {
            let pageHost = this._application.fastdial.getDecodedUrlHost(page.url);
            urlToTitle[page.url] = page.title;
            if (pageHost && (blacklist.domains.indexOf(pageHost) !== -1 || blacklist.excludeDomains[pageHost])) {
                return result;
            }
            let isDeniedByRegexp = blacklist.regexps.some(function (regexpString) {
                let regex = new RegExp(regexpString);
                return regex.test(page.url);
            });
            if (isDeniedByRegexp) {
                return result;
            }
            if (pageHost) {
                blacklist.excludeDomains[pageHost] = 1;
                this._application.getHostAliases(pageHost).forEach(alias => blacklist.excludeDomains[alias] = 1);
            }
            if (result.length < MAX_SUGGESTED_NUM) {
                result.push(page.url);
            }
            return result;
        };
    },
    _requestPickupCache: function thumbsSuggest__requestPickupCache(callback) {
        let output = {
            unpinned: [],
            pinned: [],
            domains: {}
        };
        let maxThumbIndex = this._application.internalStructure.length;
        this._application.internalStructure.iterate(thumb => {
            output.domains[thumb.host] = true;
            this._application.getHostAliases(thumb.host).forEach(alias => {
                output.domains[alias] = true;
            });
        });
        let pages = this._application.pickup.getCache();
        pages.forEach(page => {
            if (page.pinned) {
                output.pinned.push(page);
            } else {
                output.unpinned.push(page);
            }
        });
        callback(null, output);
    },
    _requestLastVisited: function thumbsSuggest__requestLastVisited(callback) {
        let urls = [];
        let query = PlacesUtils.history.getNewQuery();
        let options = PlacesUtils.history.getNewQueryOptions();
        query.minVisits = 2;
        options.maxResults = 100;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        let result = PlacesUtils.history.executeQuery(query, options);
        result.root.containerOpen = true;
        for (let i = 0; i < result.root.childCount; i++) {
            let node = result.root.getChild(i);
            if (!node.title) {
                continue;
            }
            if (!/^(https?|ftp):\/\//.test(node.uri)) {
                continue;
            }
            urls.push({
                url: node.uri,
                title: node.title,
                favicon: node.icon
            });
        }
        result.root.containerOpen = false;
        callback(null, urls);
    },
    ascii2url: function Utils_ascii2url(asciiSpec) {
        try {
            let uri = Services.uriFixup.createFixupURI(asciiSpec, Services.uriFixup.FIXUP_FLAG_NONE);
            return uri.spec;
        } catch (e) {
        }
        return asciiSpec;
    },
    _requestedThumbData: Object.create(null),
    _application: null,
    _logger: null
};
