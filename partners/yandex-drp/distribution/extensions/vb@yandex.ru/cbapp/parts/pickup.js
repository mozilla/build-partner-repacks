"use strict";
const EXPORTED_SYMBOLS = ["pickup"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const MAX_HISTORY_RESULTS = 100;
const BRANDING_PAGES_BOOST = 5;
const DATADIR_CRASH_PREF = "ftabs.dataDirCrash";
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyGetter(this, "pickupWorker", function () {
    let app = pickup._application;
    let pickupWorker = new Worker("resource://" + app.name + "-app/parts/workers/pickup.js");
    pickupWorker.onerror = eventError => pickup._logger.error(eventError.message + " from pickupWorker at line " + eventError.lineno);
    let clckrUrlToHost = Object.create(null);
    let clckrXml = null;
    try {
        clckrXml = app.fastdial.brandingClckrDoc;
    } catch (err) {
    }
    if (clckrXml) {
        Array.forEach(clckrXml.querySelectorAll("item"), item => {
            clckrUrlToHost[item.getAttribute("url")] = item.getAttribute("domain");
        });
    }
    let domainGroups = Object.create(null);
    let domainGroupsXml = null;
    try {
        domainGroupsXml = app.branding.brandPackage.getXMLDocument("fastdial/domaingroups.xml");
    } catch (err) {
    }
    if (domainGroupsXml) {
        Array.forEach(domainGroupsXml.querySelectorAll("domain"), item => {
            let groupName = item.parentNode.getAttribute("name");
            let group = domainGroups[groupName] = domainGroups[groupName] || [];
            group.push(item.textContent);
        });
    }
    pickupWorker.postMessage({
        task: "init",
        fromParam: app.core.CONFIG.APP.TYPE,
        clckrUrlToHost: clckrUrlToHost,
        domainGroups: domainGroups
    });
    return pickupWorker;
});
const pickup = {
    init: function (app) {
        app.core.Lib.sysutils.copyProperties(app.core.Lib, GLOBAL);
        this._application = app;
        this._logger = app.getLogger("Pickup");
        if (app.addonManager.info.isFreshAddonInstall) {
            if (app.cookieBackup.restore()) {
                app.preferences.set("ftabs.initialThumbsCount", app.internalStructure.length);
            } else {
                this.run({
                    force: true,
                    maxThumbsCount: app.layout.getOptimalNumberOfThumbs()
                });
            }
        } else if (app.preferences.get(DATADIR_CRASH_PREF, false)) {
            app.preferences.reset(DATADIR_CRASH_PREF);
            this.run({ force: true });
        }
        app.alarms.restoreOrCreate("scheduledPickup", {
            timeout: 60 * 24,
            isInterval: true,
            triggerIfCreated: false,
            handler: () => {
                new sysutils.Timer(() => this.run(), 7000);
            },
            ctx: this
        });
    },
    finalize: function () {
        this._logger = null;
        this._application = null;
    },
    run: function (options = {}) {
        if (!this._application) {
            return;
        }
        options.force = options.force || false;
        options.num = options.num || 1;
        if (options.num > 3) {
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
            return;
        }
        this._logger.debug("[start] Thumbs_pickupThumbs");
        let pickupStartTime = Date.now();
        let dumpPassedTime = msg => {
            this._logger.debug("[progress] %msg (".replace("%msg", msg) + (Date.now() - pickupStartTime) + " msec.)");
        };
        dumpPassedTime("before async");
        async.parallel({
            blacklist: callback => {
                this._application.blacklist.getAll(callback);
            },
            topHistory: callback => {
                callback(null, this._application.syncTopHistory.requestData());
            },
            unsafe: callback => {
                this._application.safebrowsing.listUnsafeDomains(callback);
            },
            internalStructure: callback => {
                callback(null, this._application.internalStructure.fullStructure);
            },
            branded: callback => {
                callback(null, this.getBrandedThumbs());
            },
            localHistory: callback => {
                callback(null, this._getLocalHistory());
            },
            prevMostVisitedList: callback => {
                callback(null, this._getPrevMostVisited());
            },
            currentThumbsNum: callback => {
                callback(null, this._application.internalStructure.length);
            }
        }, (err, initialData) => {
            if (err) {
                throw err;
            }
            dumpPassedTime("after async");
            this._logger.trace("Initial data: " + JSON.stringify(initialData));
            this.processData(options, initialData).then(results => {
                let {newThumbs, topHistoryEntries} = results;
                let internalStructure = this._application.internalStructure;
                internalStructure.overwriteItems(newThumbs);
                if (options.force) {
                    this._application.preferences.set("ftabs.initialThumbsCount", internalStructure.length);
                }
                this._logger.debug("[finish] Thumbs_pickupThumbs (" + (Date.now() - pickupStartTime) + " msec.)");
                this._application.safebrowsing.checkUnpinnedDomains(options.num, topHistoryEntries);
                Services.obs.notifyObservers(this, this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT, null);
                Services.obs.notifyObservers(this, this._application.core.eventTopics.PICKUP_DONE, JSON.stringify({
                    options: options,
                    topHistoryEntries: topHistoryEntries
                }));
            }, Cu.reportError);
        });
    },
    _getLocalHistory: function () {
        let query = PlacesUtils.history.getNewQuery();
        query.minVisits = 3;
        let options = PlacesUtils.history.getNewQueryOptions();
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        let result = PlacesUtils.history.executeQuery(query, options);
        let resultRoot = result.root;
        resultRoot.containerOpen = true;
        let i = 0;
        let results = [];
        let domains = Object.create(null);
        while (results.length < MAX_HISTORY_RESULTS) {
            let historyNode = i < resultRoot.childCount ? resultRoot.getChild(i) : null;
            i++;
            if (!historyNode) {
                break;
            }
            if (!historyNode.title) {
                continue;
            }
            if (!/^(https?|ftp):\/\//.test(historyNode.uri)) {
                continue;
            }
            if (/(social\.yandex\.|\Woauth\d?|\/login\.php|logout)/i.test(historyNode.uri)) {
                continue;
            }
            let host = this._application.fastdial.getDecodedUrlHost(historyNode.uri);
            if (host in domains) {
                continue;
            }
            domains[host] = true;
            results.push({
                visits: historyNode.accessCount,
                title: historyNode.title,
                url: historyNode.uri,
                id: historyNode.itemId
            });
        }
        resultRoot.containerOpen = false;
        return results;
    },
    processData: function (options, data) {
        let deferred = promise.defer();
        let listener = event => {
            let {task, results} = event.data;
            switch (task) {
            case "pickup":
                pickupWorker.removeEventListener("message", listener, false);
                if (results.messagesToDump) {
                    results.messagesToDump.forEach(msg => this._logger.debug("[worker] " + msg));
                }
                delete results.messagesToDump;
                this._saveMostVisited(results.mostVisited);
                delete results.mostVisited;
                this._saveCache(results.cache);
                delete results.cache;
                results.newThumbs = Object.keys(results.newThumbs).reduce((res, key) => {
                    res[key] = this._application.thumbs.createThumbFromDBRow(results.newThumbs[key]);
                    return res;
                }, {});
                deferred.resolve(results);
                break;
            case "log":
                this._logger.debug("[worker] " + event.data.message);
                break;
            }
        };
        pickupWorker.addEventListener("message", listener, false);
        data.options = options;
        pickupWorker.postMessage({
            task: "pickup",
            data: data
        });
        return deferred.promise;
    },
    _getPrevMostVisited: function () {
        try {
            return fileutils.jsonFromFile(this._pickupCacheFile).mostVisited || [];
        } catch (err) {
        }
        return [];
    },
    _saveMostVisited: function (mostVisited) {
        fileutils.jsonToFile({
            mostVisited: mostVisited,
            cache: this.getCache()
        }, this._pickupCacheFile);
    },
    getCache: function () {
        try {
            return fileutils.jsonFromFile(this._pickupCacheFile).cache || [];
        } catch (err) {
        }
        return [];
    },
    _saveCache: function (cache) {
        fileutils.jsonToFile({
            mostVisited: this._getPrevMostVisited(),
            cache: cache || []
        }, this._pickupCacheFile);
    },
    get _pickupCacheFile() {
        let shotsDir = this._application.core.rootDir;
        shotsDir.append("pickup_cache.json");
        return shotsDir;
    },
    getBrandedThumbs: function () {
        let branded = [];
        let query = "pages > page";
        Array.forEach(this._application.fastdial.brandingXMLDoc.querySelectorAll(query), function (page) {
            let index = parseInt(page.getAttribute("index"), 10) - 1;
            let boost = page.getAttribute("boost");
            boost = boost === null ? BRANDING_PAGES_BOOST : parseInt(boost, 10);
            let url = this._application.fastdial.expandBrandingURL(page.getAttribute("url"));
            let host = this._application.fastdial.getDecodedUrlHost(url);
            branded.push({
                url: url,
                title: page.getAttribute("custom_title"),
                pinned: page.getAttribute("force") === "true",
                force: page.getAttribute("force") === "true",
                preferedIndex: index,
                boost: boost,
                statParam: "defthumb"
            });
        }, this);
        return branded;
    }
};
