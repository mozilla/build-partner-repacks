"use strict";
const EXPORTED_SYMBOLS = ["thumbsSuggest"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/PlacesUtils.jsm");
const MAX_SUGGESTED_NUM = 40;
const THUMBS_PER_PAGE = 10;
const thumbsSuggest = {
    init: function thumbsSuggest_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("thumbsSuggest");
    },
    finalize: function thumbsSuggest_finalize() {
        this._logger = null;
        this._application = null;
    },
    requestThumbData: function thumbsSuggest_requestThumbData(url) {
        let cacheData = this._historyThumbs[url];
        if (!cacheData) {
            cacheData = this._application.internalStructure.convertDbRow({ url: url }, false);
            this._historyThumbs[url] = cacheData;
        }
        if (!this._requestedThumbData[url]) {
            this._application.thumbs.getMissingData(cacheData);
            this._requestedThumbData[url] = true;
        }
        this._application.fastdial.sendRequest("historyThumbChanged", this._application.frontendHelper.getDataForThumb(cacheData));
    },
    requestTopSites: function thumbsSuggest_requestTopSites(offset, callback) {
        async.parallel({
            blacklist: callback => this._application.blacklist.getAll(callback),
            pickup: callback => this._requestPickupCache(callback),
            brandedThumbs: callback => this._requestBrandedThumbs(callback),
            bookmarks: callback => this._application.bookmarks.requestList(MAX_SUGGESTED_NUM * 2, list => callback(null, list))
        }, (err, {blacklist, brandedThumbs, pickup, bookmarks}) => {
            if (err)
                throw err;
            let {pinned, unpinned} = pickup;
            blacklist.excludeDomains = pickup.domains;
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
            callback(popuplarSites.map(this._getCachedThumbData, this));
        });
    },
    _requestBrandedThumbs: function thumbsSuggest__requestBrandedThumbs(callback) {
        callback(null, this._application.thumbs.getBrandedThumbs({}).map(thumb => {
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
            tabs: callback => this._requestOpenedTabs(callback)
        }, (err, results) => {
            if (err)
                throw err;
            results.blacklist.excludeDomains = results.topSites.domains;
            let lastVisited = Array.concat(results.tabs, results.lastVisited).reduce(this._generateReduceFn(results.blacklist), []);
            lastVisited = this._sliceResultByOffset(offset, lastVisited);
            callback(lastVisited.map(this._getCachedThumbData, this));
        });
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
    _getCachedThumbData: function thumbsSuggest__getCachedThumbData(url) {
        let cacheData = this._historyThumbs[url] || this._application.internalStructure.convertDbRow({ url: url });
        this._application.thumbs.getMissingData(cacheData);
        return this._application.frontendHelper.getDataForThumb(cacheData);
    },
    _generateReduceFn: function thumbsSuggest__generateReduceFn(blacklist) {
        return (result, page) => {
            let pageHost = this._application.fastdial.getDecodedUrlHost(page.url);
            if (pageHost && (blacklist.domains.indexOf(pageHost) !== -1 || blacklist.excludeDomains[pageHost]))
                return result;
            let isDeniedByRegexp = blacklist.regexps.some(function (regexpString) {
                let regex = new RegExp(regexpString);
                return regex.test(page.url);
            });
            if (isDeniedByRegexp)
                return result;
            if (pageHost) {
                blacklist.excludeDomains[pageHost] = 1;
                this._application.getHostAliases(pageHost).forEach(alias => blacklist.excludeDomains[alias] = 1);
            }
            if (!this._historyThumbs[page.url]) {
                this._historyThumbs[page.url] = this._application.internalStructure.convertDbRow(page, false);
            } else {
                sysutils.copyProperties(page, this._historyThumbs[page.url].thumb);
            }
            if (result.length < MAX_SUGGESTED_NUM) {
                result.push(page.url);
            }
            return result;
        };
    },
    get _historyThumbs() {
        return this._application.fastdial._historyThumbs;
    },
    _requestOpenedTabs: function thumbsSuggest__requestOpenedTabs(callback) {
        let urls = [];
        misc.getBrowserWindows().forEach(function (chromeWin) {
            let tabBrowser = chromeWin.gBrowser;
            let tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
            if (!Array.isArray(tabs))
                return;
            tabs.forEach(function (tab) {
                try {
                    let browser = tabBrowser.getBrowserForTab(tab);
                    let currentURI = browser.currentURI.spec;
                    if (/^(chrome|about|yafd|bar):/.test(currentURI))
                        return;
                    urls.push({
                        url: currentURI,
                        title: browser.contentTitle
                    });
                } catch (e) {
                }
            });
        });
        callback(null, urls);
    },
    _requestPickupCache: function thumbsSuggest__requestPickupCache(callback) {
        let output = {
            unpinned: [],
            pinned: [],
            domains: {}
        };
        let maxThumbIndex = this._application.layout.getThumbsNum();
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        if (emptyLastThumb) {
            maxThumbIndex--;
        }
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData, i) {
            if (i < maxThumbIndex) {
                let host;
                try {
                    host = thumbData.location.asciiHost.replace(/^www\./, "");
                } catch (ex) {
                    return;
                }
                output.domains[host] = 1;
                this._application.getHostAliases(host).forEach(function (alias) {
                    output.domains[alias] = 1;
                });
            } else {
                let pushData = {
                    url: thumbData.source,
                    visits: (thumbData.thumb || {}).visits || 0
                };
                if (thumbData.thumb.title)
                    pushData.title = thumbData.thumb.title;
                if (thumbData.pinned) {
                    output.pinned.push(pushData);
                } else {
                    output.unpinned.push(pushData);
                }
            }
        }, this);
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
            if (!node.title)
                continue;
            if (!/^(https?|ftp):\/\//.test(node.uri))
                continue;
            urls.push({
                url: node.uri,
                title: node.title,
                favicon: node.icon
            });
        }
        result.root.containerOpen = false;
        callback(null, urls);
    },
    _requestedThumbData: Object.create(null),
    _application: null,
    _logger: null
};
