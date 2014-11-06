"use strict";
const EXPORTED_SYMBOLS = ["thumbs"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const DAILY_IDLE_EVENT = "idle-daily";
const OLDEST_THUMB_TIME_SECONDS = 86400 * 30;
const MAX_HISTORY_RESULTS = 100;
const MAX_PICKUP_LENGTH = 49 + 24 + 3;
const REFRESH_INTERVAL = 86400;
const BRANDING_PAGES_BOOST = 5;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "UUID_SVC", "@mozilla.org/uuid-generator;1", "nsIUUIDGenerator");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const thumbs = {
    init: function Thumbs_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Thumbs");
        Services.obs.addObserver(this, DAILY_IDLE_EVENT, false);
        this._initDatabase();
        let appInfo = this._application.addonManager.info;
        if (appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated", false) === false)
            this._application.preferences.set("ftabs.emptyLastThumb", true);
        let now = Math.round(Date.now() / 1000);
        let lastPickupTime = this._application.preferences.get("ftabs.lastPickupTime", 0);
        let pickupDateDiff = Math.abs(now - lastPickupTime);
        if (appInfo.isFreshAddonInstall) {
            this.pickupThumbs({ withForceThumbs: true });
            return;
        }
        const DATADIR_CRASH_PREF = "ftabs.dataDirCrash";
        if (this._application.preferences.get(DATADIR_CRASH_PREF, false)) {
            this._application.preferences.reset(DATADIR_CRASH_PREF);
            this.pickupThumbs({ withForceThumbs: true });
            return;
        }
        this._fetchThumbs(function fetchThumbsOnInitCallback() {
            if (pickupDateDiff > this._pickupInterval) {
                if (this.scheduledPickup()) {
                    return;
                }
            }
            this._pickupTimer = new sysutils.Timer(this.scheduledPickup.bind(this), Math.max(this._pickupInterval - pickupDateDiff, 0) * 1000);
            Services.obs.notifyObservers(this, this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT, null);
            if (this._isRefreshNeeded) {
                this._refreshThumbsData();
            } else {
                this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                    this.getMissingData(thumbData);
                }, this);
                let lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime", 0);
                let lastRefreshDiff = Math.abs(now - lastRefreshTime);
                this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), Math.max(REFRESH_INTERVAL - lastRefreshDiff, 0) * 1000);
            }
            this.getScreenshotsAndLogos();
        }.bind(this));
    },
    finalize: function Thumbs_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, DAILY_IDLE_EVENT);
        if (this._pickupTimer) {
            this._pickupTimer.cancel();
            this._pickupTimer = null;
        }
        let dbClosedCallback = function Thumbs_finalize_dbClosedCallback() {
            this.structure = null;
            this._database = null;
            this._application = null;
            this._logger = null;
            callback();
        }.bind(this);
        if (this._database) {
            this._database.close(dbClosedCallback);
            return true;
        }
        dbClosedCallback();
    },
    observe: function Thumbs_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case DAILY_IDLE_EVENT:
            this._database.execQueryAsync("DELETE FROM thumbs WHERE insertTimestamp < :oldestTime " + "AND rowid NOT IN (SELECT thumb_id FROM thumbs_shown)", { oldestTime: Math.round(Date.now() / 1000) - OLDEST_THUMB_TIME_SECONDS });
            break;
        }
    },
    swap: function Thumbs_swap(oldIndex, newIndex) {
        if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0)
            return;
        let pos1ThumbData = this._application.internalStructure.getItem(oldIndex);
        let pos2ThumbData = this._application.internalStructure.getItem(newIndex);
        this._logger.trace("Swap thumbs #" + oldIndex + " and #" + newIndex);
        try {
            this._logger.trace("Old index data: " + JSON.stringify(pos1ThumbData));
        } catch (ex) {
            this._logger.trace("Old index data: {nsIURI}");
        }
        try {
            this._logger.trace("New index data: " + JSON.stringify(pos2ThumbData));
        } catch (ex) {
            this._logger.trace("New index data: {nsIURI}");
        }
        if (!pos1ThumbData)
            return;
        let currentThumbsNum = this._application.layout.getThumbsNum();
        if (newIndex === currentThumbsNum - 1) {
            this._application.preferences.set("ftabs.emptyLastThumb", false);
        }
        this._application.internalStructure.removeItem(oldIndex);
        this._application.internalStructure.removeItem(newIndex);
        pos1ThumbData.pinned = true;
        pos1ThumbData.thumb = pos1ThumbData.thumb || {};
        pos1ThumbData.thumb.statParam = "userthumb";
        pos1ThumbData.sync = pos1ThumbData.sync || {};
        pos1ThumbData.sync.id = this._application.sync.generateId();
        pos1ThumbData.sync.instance = this._application.name;
        pos1ThumbData.sync.timestamp = Math.round(Date.now() / 1000);
        this._application.internalStructure.overwriteItem(newIndex, pos1ThumbData);
        if (pos2ThumbData) {
            pos2ThumbData.thumb = pos2ThumbData.thumb || {};
            pos2ThumbData.thumb.statParam = "userthumb";
            pos2ThumbData.sync = pos2ThumbData.sync || {};
            pos2ThumbData.sync.id = this._application.sync.generateId();
            pos2ThumbData.sync.instance = this._application.name;
            pos2ThumbData.sync.timestamp = Math.round(Date.now() / 1000);
            this._application.internalStructure.overwriteItem(oldIndex, pos2ThumbData);
        }
        let evtData = {};
        evtData[newIndex] = this._application.frontendHelper.getDataForIndex(newIndex);
        evtData[oldIndex] = this._application.frontendHelper.getDataForIndex(oldIndex);
        this._application.fastdial.sendRequest("thumbChanged", evtData);
        this._application.syncPinned.save();
    },
    remove: function Thumbs_remove(aIndex) {
        let thumbData = this._application.internalStructure.getItem(aIndex);
        if (aIndex < 0 || !thumbData)
            return;
        this._logger.trace("Remove thumb #" + aIndex);
        this._application.usageHistory.logAction("delete", { index: aIndex });
        this._application.internalStructure.removeItem(aIndex);
        let isStandardURL = false;
        try {
            thumbData.location.QueryInterface(Ci.nsIURL);
            isStandardURL = true;
        } catch (ex) {
        }
        if (isStandardURL) {
            let hasSameDomain = false;
            let thumbHost = thumbData.location.asciiHost.replace(/^www\./, "");
            let source = thumbData.source;
            let hasSameURL = false;
            this._application.internalStructure.iterate({
                nonempty: true,
                visible: true
            }, function (thumbData, thumbIndex) {
                if (aIndex === thumbIndex)
                    return;
                if (thumbHost === thumbData.location.asciiHost) {
                    hasSameDomain = true;
                }
                if (source === thumbData.source) {
                    hasSameURL = true;
                }
            });
            if (!hasSameDomain) {
                this._application.blacklist.upsertDomain(thumbHost);
            }
            if (!hasSameURL) {
                this._application.screenshots.createScreenshotInstance(thumbData.source).remove();
            }
        }
        this._application.syncPinned.save();
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        let currentThumbsNum = this._application.layout.getThumbsNum();
        if (emptyLastThumb) {
            currentThumbsNum -= 1;
        }
        this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
    },
    save: function Thumbs_save(index, data) {
        let currentThumbsNum = this._application.layout.getThumbsNum();
        let originalURL = data.url;
        let uri;
        if (index < 0 || sysutils.isEmptyObject(data))
            return;
        data.title = data.title.trim() || "";
        try {
            uri = netutils.newURI(data.url);
        } catch (ex) {
            if (!/(ht|f)tps?:\/\//.test(data.url))
                data.url = "http://" + data.url;
            try {
                uri = netutils.newURI(data.url);
            } catch (ex) {
                this._logger.warn("Saved URL is not valid: " + originalURL);
            }
        }
        if (!uri) {
            let evtData = {};
            evtData[index] = this._application.frontendHelper.getDataForIndex(index);
            this._application.fastdial.sendRequest("thumbChanged", evtData);
            return;
        }
        try {
            uri = uri.QueryInterface(Ci.nsIURL);
        } catch (err) {
        }
        if (this._application.isYandexURL(uri.spec)) {
            let parsedQuery = netutils.querystring.parse(uri.query || "");
            delete parsedQuery.nugt;
            uri.query = netutils.querystring.stringify(parsedQuery);
        }
        data.url = uri.spec;
        this._logger.trace("Save thumb #" + index + " (" + JSON.stringify(data) + ")");
        let currentThumbData = this._application.internalStructure.getItem(index);
        (currentThumbData || {}).pinned = true;
        if (currentThumbData && currentThumbData.source && currentThumbData.thumb && currentThumbData.source === data.url && currentThumbData.thumb.title !== data.title) {
            currentThumbData.thumb.title = data.title;
            currentThumbData.thumb.statParam = "userthumb";
            this._application.internalStructure.overwriteItem(index, currentThumbData);
            let evtData = {};
            evtData[index] = this._application.frontendHelper.getDataForIndex(index);
            this._application.fastdial.sendRequest("thumbChanged", evtData);
            return;
        }
        this._application.internalStructure.iterate({
            pinned: true,
            nonempty: true
        }, function (thumbData, index) {
            if (!thumbData.source || thumbData.source !== data.url || index < currentThumbsNum)
                return;
            this._application.internalStructure.removeItem(index);
            this._compactUnpinned(index);
        }, this);
        if (index === currentThumbsNum - 1) {
            this._application.preferences.set("ftabs.emptyLastThumb", false);
        }
        if (!currentThumbData) {
            this._application.usageHistory.logAction("add", {
                url: data.url,
                index: index,
                title: data.title || ""
            });
        }
        let host = this._application.fastdial.getDecodedUrlHost(data.url);
        if (host) {
            this._application.blacklist.deleteDomain(host);
        }
        let dbRecord = {
            url: data.url,
            title: data.title || null,
            syncId: this._application.sync.generateId(),
            syncInternalId: this._application.sync.generateId(),
            syncInstance: this._application.name,
            syncTimestamp: Math.round(Date.now() / 1000),
            statParam: "userthumb"
        };
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
            if (thumbData.source === data.url) {
                dbRecord.favicon = dbRecord.favicon || (thumbData.favicon || {}).url;
                dbRecord.backgroundColor = dbRecord.backgroundColor || (thumbData.favicon || {}).color || null;
            }
        });
        let internalThumbData = this._application.internalStructure.convertDbRow(dbRecord, true);
        this._application.internalStructure.overwriteItem(index, internalThumbData);
        let evtData = {};
        evtData[index] = this._application.frontendHelper.getDataForIndex(index);
        if (!evtData[index].favicon)
            evtData[index].favicon = this._application.favicons.getYandexNetFaviconURL(uri);
        this._application.fastdial.sendRequest("thumbChanged", evtData);
        this._application.syncPinned.save();
        this._application.cloudSource.fetchThumbLogo(internalThumbData.location, { force: true });
        this.getScreenshotsAndLogos();
    },
    updateCurrentSet: function Thumbs_updateCurrentSet(removePositions, saveData) {
        this._logger.trace("Update current set with data: " + JSON.stringify([
            removePositions,
            saveData
        ]));
        let currentThumbsNum = this._application.layout.getThumbsNum();
        let requestData = {};
        removePositions.forEach(function (pos) {
            this._application.internalStructure.removeItem(pos);
            requestData[pos] = {};
        }, this);
        Object.keys(saveData).forEach(function (index) {
            if (index == currentThumbsNum - 1) {
                this._application.preferences.set("ftabs.emptyLastThumb", false);
            }
            let dbRecord = {
                url: saveData[index].url,
                title: saveData[index].title.trim() || null,
                syncId: saveData[index].id,
                syncInternalId: saveData[index].internalId,
                syncInstance: saveData[index].instance,
                syncTimestamp: saveData[index].timestamp,
                statParam: "userthumb"
            };
            let internalThumbData = this._application.internalStructure.convertDbRow(dbRecord, true);
            this._application.internalStructure.overwriteItem(index, internalThumbData);
            requestData[index] = this._application.frontendHelper.getDataForIndex(index);
            this.getMissingData(internalThumbData, {
                force: true,
                syncOnly: true
            });
        }, this);
        this._application.fastdial.sendRequest("thumbChanged", requestData);
    },
    changePinnedState: function Thumbs_changePinnedState(index, isPinned) {
        let current = this._application.internalStructure.getItem(index);
        let structureNeedsChanges = true;
        let syncId, syncInstance, syncTimestamp, syncInternalId;
        let needSync;
        let logMessage = strutils.formatString("%1 thumb #%2", [
            isPinned ? "Pin" : "Unpin",
            index
        ]);
        this._logger.trace(logMessage);
        if (isPinned && current && current.source) {
            syncId = this._application.sync.generateId();
            syncInstance = this._application.name;
            syncTimestamp = Math.round(Date.now() / 1000);
            syncInternalId = this._application.sync.generateId();
        } else {
            syncId = syncInstance = syncTimestamp = syncInternalId = null;
        }
        let lastThumbIndex = this._application.layout.getThumbsNum() - 1;
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        let knowsAboutLastThumb = index === lastThumbIndex;
        if (knowsAboutLastThumb) {
            this._application.preferences.set("ftabs.emptyLastThumb", false);
        }
        if (isPinned) {
            needSync = current && current.source;
        } else {
            needSync = current && current.source && current.pinned;
        }
        if (knowsAboutLastThumb && emptyLastThumb) {
            this._application.internalStructure.removeItem(lastThumbIndex);
            structureNeedsChanges = false;
        }
        if (current && !current.source && !isPinned) {
            this._application.internalStructure.removeItem(index);
            structureNeedsChanges = false;
        }
        if (structureNeedsChanges) {
            current = current || {};
            current.pinned = isPinned;
            current.thumb.statParam = "userthumb";
            if (current.source) {
                current.sync.id = syncId;
                current.sync.internalId = syncInternalId;
                current.sync.timestamp = syncTimestamp;
                current.sync.instance = syncInstance;
            }
            this._application.internalStructure.setItem(index, current);
        }
        let requestData = {};
        requestData[index] = this._application.frontendHelper.getDataForIndex(index);
        this._application.fastdial.sendRequest("thumbChanged", requestData);
        if (needSync) {
            this._application.syncPinned.save();
        }
    },
    scheduledPickup: function Thumbs_scheduledPickup() {
        this.resetPickupTimer();
        let holesExist = false;
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        let currentThumbsNum = this._application.layout.getThumbsNum();
        if (emptyLastThumb)
            currentThumbsNum--;
        for (let i = 0; i < currentThumbsNum; i++) {
            if (!this._application.internalStructure.getItem(i)) {
                holesExist = true;
                break;
            }
        }
        let now = Math.round(Date.now() / 1000);
        let lastPickupTime = this._application.preferences.get("ftabs.lastPickupTime", 0);
        let timeHasCome = Math.abs(now - lastPickupTime) >= REFRESH_INTERVAL;
        if (holesExist || timeHasCome) {
            this.pickupThumbs();
            return true;
        }
        return false;
    },
    pickupThumbs: function Thumbs_pickupThumbs(options) {
        let self = this;
        options = options || {};
        options.withForceThumbs = options.withForceThumbs || false;
        options.num = options.num || 1;
        if (options.num > 3) {
            this._application.frontendHelper.mute = false;
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
            return;
        }
        this._logger.debug("Pickup session started...");
        if (this._pickupTimer)
            this._pickupTimer.cancel();
        let now = Math.round(Date.now() / 1000);
        this._application.preferences.set("ftabs.lastPickupTime", now);
        async.parallel({
            blacklist: function Thumbs_pickupThumbs_blacklist(callback) {
                self._application.blacklist.getAll(callback);
            },
            topHistory: function Thumbs_pickupThumbs_topHistory(callback) {
                callback(null, self._application.syncTopHistory.requestData());
            },
            unsafe: function Thumbs_pickupThumbs_unsafe(callback) {
                self._application.safebrowsing.listUnsafeDomains(callback);
            }
        }, function Thumbs_pickupThumbs_onDataReceived(err, results) {
            if (err)
                throw new Error(err);
            results.pinned = {};
            self._application.internalStructure.iterate({ pinned: true }, function (thumbData, index) {
                let newThumb = results.pinned[index] = {
                    url: thumbData.source,
                    title: null,
                    backgroundColor: null,
                    favicon: null,
                    screenshot: null,
                    position: index,
                    fixed: 1,
                    statParam: null
                };
                if (thumbData.thumb) {
                    newThumb.title = thumbData.thumb.title || null;
                    newThumb.screenshot = thumbData.thumb.screenshot || null;
                    newThumb.statParam = thumbData.thumb.statParam || null;
                }
                if (thumbData.favicon) {
                    newThumb.backgroundColor = (thumbData.favicon || {}).color;
                }
                if (thumbData.background) {
                    newThumb.backgroundColor = (thumbData.background || {}).color;
                }
                [
                    "id",
                    "instance",
                    "timestamp",
                    "internalId"
                ].forEach(function (syncField) {
                    if (thumbData.sync && thumbData.sync[syncField]) {
                        let fieldName = "sync" + syncField[0].toUpperCase() + syncField.substr(1);
                        newThumb[fieldName] = thumbData.sync[syncField];
                    }
                });
            });
            results.branded = self.getBrandedThumbs(results.pinned, false);
            self._logger.trace("Start data: " + JSON.stringify(results));
            let blockedDomains = Array.concat(results.unsafe, results.blacklist.domains);
            let existingPinnedThumbs = results.pinned;
            let {
                local: historyEntries,
                tophistory: topHistoryEntries
            } = self._getMergedHistoryQueue(results.topHistory, results.unsafe, results.branded);
            self._logger.trace("Merged history entries: " + JSON.stringify(historyEntries));
            let fixedThumbs = options.withForceThumbs ? self._getForceAndPinnedThumbs(existingPinnedThumbs) : existingPinnedThumbs;
            let pinnedDomains = [];
            for (let [
                        ,
                        thumbData
                    ] in Iterator(fixedThumbs)) {
                if (thumbData.url) {
                    let host = self._application.fastdial.getDecodedUrlHost(thumbData.url);
                    if (host) {
                        pinnedDomains.push(host);
                    }
                }
            }
            results.branded.sort((pageA, pageB) => pageB.boost - pageA.boost);
            let free = Math.max(MAX_PICKUP_LENGTH - Object.keys(fixedThumbs).length, 0);
            let allBlockedDomains = blockedDomains.concat(pinnedDomains);
            allBlockedDomains.forEach(function (blockedDomain) {
                allBlockedDomains = allBlockedDomains.concat(this._application.getHostAliases(blockedDomain));
            }, self);
            let mostVisitedList = self._getMostVisitedQueue(allBlockedDomains, results.blacklist.regexps, results.branded, historyEntries, free);
            let prevMostVisitedList = self._getPrevMostVisited();
            prevMostVisitedList.forEach(function (prevEntry) {
                let foundInCurrentList = false;
                let host = self._application.fastdial.getDecodedUrlHost(prevEntry.url);
                mostVisitedList.forEach(function (entry) {
                    if (entry.url === prevEntry.url) {
                        foundInCurrentList = true;
                        entry.visits = Math.max(entry.visits || 0, prevEntry.visits);
                        return;
                    }
                    let entryHost = self._application.fastdial.getDecodedUrlHost(entry.url);
                    if (host === entryHost) {
                        foundInCurrentList = true;
                    } else {
                        self._application.getHostAliases(entryHost).some(function (alias) {
                            if (alias === host) {
                                foundInCurrentList = true;
                                return true;
                            }
                            return false;
                        });
                    }
                });
                if (foundInCurrentList) {
                    return;
                }
                let foundInPinned = Object.keys(fixedThumbs).some(function (thumbIndex) {
                    let fixedThumb = fixedThumbs[thumbIndex];
                    return fixedThumb.url === prevEntry.url;
                });
                if (foundInPinned) {
                    return;
                }
                let foundInUnsafe = host && results.unsafe.indexOf(host) !== -1 || false;
                if (foundInUnsafe) {
                    return;
                }
                mostVisitedList.push(prevEntry);
            });
            self._saveMostVisited(mostVisitedList);
            topHistoryEntries = topHistoryEntries.filter(function (entry) {
                let host = self._application.fastdial.getDecodedUrlHost(entry.url);
                return !host || results.unsafe.indexOf(host) === -1;
            });
            let appInfo = self._application.addonManager.info;
            if (appInfo.isFreshAddonInstall && self._application.preferences.get("yabar.migrated", false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion)) {
                self._logger.debug("Blocked domains are: " + JSON.stringify(blockedDomains, null, "	"));
                self._logger.debug("Pinned thumbs are: " + JSON.stringify(existingPinnedThumbs, null, "	"));
                self._logger.debug("Pinned domains are: " + JSON.stringify(pinnedDomains, null, "	"));
                self._logger.debug("Pinned thumbs w/ BP-forced are: " + JSON.stringify(fixedThumbs, null, "	"));
                self._logger.debug("Most visited queue thumbs are: " + JSON.stringify(mostVisitedList, null, "	"));
            }
            let currentThumbsNum = self._application.layout.getThumbsNum();
            let emptyLastThumb = self._application.preferences.get("ftabs.emptyLastThumb", false);
            if (emptyLastThumb) {
                currentThumbsNum--;
            }
            let unpinnedCount = currentThumbsNum - Object.keys(fixedThumbs).length;
            let newThumbs = {};
            for (let i = 0; Object.keys(fixedThumbs).length > 0; i++) {
                if (!fixedThumbs[i])
                    continue;
                let thumbData = fixedThumbs[i];
                delete fixedThumbs[i];
                newThumbs[i] = self._application.internalStructure.convertDbRow(thumbData, thumbData.fixed);
            }
            let sql = "SELECT thumbs.url, shown.position                 FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id";
            let rowsData = [];
            try {
                rowsData = self._database.execQuery(sql);
            } catch (err) {
            }
            let urlToPosition = rowsData.reduce(function (obj, item) {
                if (item.position < currentThumbsNum && item.url)
                    obj[item.url] = item.position;
                return obj;
            }, {});
            mostVisitedList.sort(function (a, b) {
                let aVisits = a.visits || 0;
                let bVisits = b.visits || 0;
                return bVisits - aVisits;
            });
            if (mostVisitedList.length > 1) {
                let isShuffled = true;
                while (isShuffled) {
                    isShuffled = false;
                    for (let i = 1; i < mostVisitedList.length; i++) {
                        let currentItem = mostVisitedList[i];
                        let prevItem = mostVisitedList[i - 1];
                        let currentItemPosition = urlToPosition[currentItem.url];
                        let prevItemPosition = urlToPosition[prevItem.url];
                        if (typeof currentItemPosition === "number" && prevItem.visits === currentItem.visits) {
                            if (typeof prevItemPosition !== "number") {
                                [
                                    mostVisitedList[i - 1],
                                    mostVisitedList[i]
                                ] = [
                                    currentItem,
                                    prevItem
                                ];
                                isShuffled = true;
                                break;
                            }
                        }
                    }
                }
                for (let i = 0; i < mostVisitedList.length; i++) {
                    mostVisitedList[i].index = i;
                }
                isShuffled = true;
                while (isShuffled) {
                    isShuffled = false;
                    for (let i = 1; i < mostVisitedList.length; i++) {
                        let currentItem = mostVisitedList[i];
                        let prevItem = mostVisitedList[i - 1];
                        let currentItemPosition = urlToPosition[currentItem.url];
                        let prevItemPosition = urlToPosition[prevItem.url];
                        if (typeof currentItemPosition === "number" && prevItem.visits === currentItem.visits) {
                            if (typeof prevItemPosition === "number" && prevItem.index < currentItem.index) {
                                [
                                    mostVisitedList[i - 1],
                                    mostVisitedList[i]
                                ] = [
                                    currentItem,
                                    prevItem
                                ];
                                isShuffled = true;
                                break;
                            }
                        }
                    }
                }
            }
            mostVisitedList = mostVisitedList.map(function (thumbData, i) {
                let converted = self._application.internalStructure.convertDbRow(thumbData);
                converted.position = urlToPosition[thumbData.url];
                return converted;
            });
            let visibleMostVisitedList = mostVisitedList.slice(0, unpinnedCount);
            let invisibleMostVisitedList = mostVisitedList.slice(unpinnedCount, mostVisitedList.length);
            let freePositions = [];
            invisibleMostVisitedList.forEach(function (thumbData) {
                if (typeof thumbData.position === "number") {
                    freePositions.push(thumbData.position);
                    delete thumbData.position;
                }
            });
            let withFixPosition = [];
            let visibleWithoutPosition = [];
            visibleMostVisitedList.forEach(function (thumbData) {
                if (freePositions.length && typeof thumbData.position !== "number") {
                    thumbData.position = freePositions.shift();
                }
                if (typeof thumbData.position === "number") {
                    withFixPosition.push(thumbData);
                } else {
                    visibleWithoutPosition.push(thumbData);
                }
            });
            invisibleMostVisitedList = visibleWithoutPosition.concat(invisibleMostVisitedList);
            withFixPosition.forEach(function (thumbData) {
                if (!newThumbs[thumbData.position]) {
                    newThumbs[thumbData.position] = thumbData;
                } else {
                    invisibleMostVisitedList.unshift(thumbData);
                }
            });
            let i = 0;
            while (invisibleMostVisitedList.length) {
                newThumbs[i] = newThumbs[i] || invisibleMostVisitedList.shift();
                i++;
            }
            let urlsToMissingData = {};
            self._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                let thumb = thumbData.thumb;
                urlsToMissingData[thumbData.source] = {
                    favicon: thumb ? thumb.favicon : null,
                    statParam: thumb ? thumb.statParam : null
                };
            });
            for (let [
                        index,
                        thumbData
                    ] in Iterator(newThumbs)) {
                let urlToMissingData = urlsToMissingData[thumbData.source];
                if (urlToMissingData) {
                    thumbData.thumb = thumbData.thumb || {};
                    thumbData.thumb.favicon = urlToMissingData.favicon;
                    thumbData.thumb.statParam = urlToMissingData.statParam;
                }
            }
            self._application.internalStructure.clear();
            self._application.internalStructure.setItem(newThumbs);
            Services.obs.notifyObservers(this, self._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT, null);
            self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
            self.resetPickupTimer();
            if (self._isRefreshNeeded) {
                self._refreshThumbsData();
            } else {
                self._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                    self.getMissingData(thumbData, { force: options.withForceThumbs });
                });
            }
            self._application.safebrowsing.checkUnpinnedDomains(options.num, topHistoryEntries);
            self.getScreenshotsAndLogos();
            let existingScreenshotNames = Object.create(null);
            self._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                existingScreenshotNames[this._application.screenshots.createScreenshotInstance(thumbData.source).name] = true;
            }, self);
            let entries = self._application.screenshots.shotsDir.directoryEntries;
            while (entries.hasMoreElements()) {
                let file = entries.getNext().QueryInterface(Ci.nsIFile);
                if (file.isFile() && !existingScreenshotNames[file.leafName])
                    fileutils.removeFileSafe(file);
            }
        });
    },
    _getPrevMostVisited: function Thumbs__getPrevMostVisited() {
        let pickupCacheFile = this._pickupCacheFile;
        try {
            return fileutils.jsonFromFile(pickupCacheFile).mostVisited;
        } catch (err) {
            return [];
        }
    },
    _saveMostVisited: function Thumbs__saveMostVisited(mostVisited) {
        let pickupCacheFile = this._pickupCacheFile;
        fileutils.jsonToFile({ mostVisited: mostVisited }, pickupCacheFile);
    },
    get _pickupCacheFile() {
        let shotsDir = this._application.core.rootDir;
        shotsDir.append("pickup_cache.json");
        return shotsDir;
    },
    getBrandedThumbs: function Thumbs_getBrandedThumbs(ignoredThumbs, onlyWithForceThumbs) {
        let domains = {};
        for (let [
                    ,
                    thumb
                ] in Iterator(ignoredThumbs)) {
            let host = this._application.fastdial.getDecodedUrlHost(thumb.url);
            if (host) {
                domains[host] = 1;
            }
        }
        let branded = [];
        let query = onlyWithForceThumbs ? "pages > page[force='true']" : "pages > page";
        Array.forEach(this._application.fastdial.brandingXMLDoc.querySelectorAll(query), function (page) {
            let boost = page.getAttribute("boost");
            let index = parseInt(page.getAttribute("index"), 10) - 1;
            boost = boost === null ? BRANDING_PAGES_BOOST : parseInt(boost, 10);
            let url = this._application.fastdial.expandBrandingURL(page.getAttribute("url"));
            let host = this._application.fastdial.getDecodedUrlHost(url);
            if (!domains[host]) {
                branded.push({
                    url: url,
                    title: page.getAttribute("custom_title"),
                    fixed: Number(onlyWithForceThumbs),
                    preferedIndex: index,
                    boost: boost,
                    statParam: "defthumb"
                });
            }
        }, this);
        return branded;
    },
    resetPickupTimer: function Thumbs_resetPickupTimer() {
        if (this._pickupTimer)
            this._pickupTimer.cancel();
        this._pickupTimer = new sysutils.Timer(function () {
            this.scheduledPickup();
        }.bind(this), this._pickupInterval * 1000);
    },
    fastPickup: function Thumbs_fastPickup(unpinned) {
        let blockedDomains = [];
        this._application.internalStructure.iterate({
            nonempty: true,
            pinned: true
        }, function (thumbData, index) {
            try {
                let domain = thumbData.location.asciiHost.replace(/^www\./, "");
                blockedDomains.push(domain);
                this._application.getHostAliases(domain).forEach(function (alias) {
                    blockedDomains.push(alias);
                });
            } catch (ex) {
            }
        }, this);
        this._logger.trace("Blocked domains during fast pickup: " + JSON.stringify(blockedDomains));
        let emptyPositionIndex = 0;
        let setRecords = {};
        let structureNeedsChanges = false;
        let dropPositions = [];
        let unpinnedList = [];
        for (let [
                    index,
                    thumbData
                ] in Iterator(unpinned)) {
            try {
                let domain = thumbData.location.asciiHost.replace(/^www\./, "");
                if (blockedDomains.indexOf(domain) !== -1) {
                    structureNeedsChanges = true;
                    dropPositions.push(index);
                    continue;
                }
            } catch (ex) {
            }
            unpinnedList.push({
                index: index,
                thumbData: thumbData
            });
        }
        unpinnedList.sort(function (a, b) {
            let aVisits = a.thumbData.thumb.visits || 0;
            let bVisits = b.thumbData.thumb.visits || 0;
            return bVisits - aVisits;
        });
        this._logger.trace("Unpinned list: " + JSON.stringify(unpinnedList));
        unpinnedList.forEach(function (unpinnedItem) {
            while (true) {
                let positionThumb = this._application.internalStructure.getItem(emptyPositionIndex);
                if (!positionThumb || !positionThumb.pinned)
                    break;
                emptyPositionIndex += 1;
            }
            setRecords[emptyPositionIndex] = unpinnedItem.thumbData;
            if (emptyPositionIndex != unpinnedItem.index) {
                dropPositions.push(unpinnedItem.index);
                structureNeedsChanges = true;
            }
            emptyPositionIndex += 1;
        }, this);
        this._logger.trace("Need to drop records from structure: " + structureNeedsChanges);
        if (!structureNeedsChanges)
            return;
        this._application.internalStructure.iterate(null, function (thumbData, index) {
            if (thumbData.source && thumbData.pinned)
                return;
            if (dropPositions.indexOf(index) !== -1) {
                this._application.internalStructure.removeItem(index);
            }
        }, this);
        this._logger.trace("Set records: " + JSON.stringify(setRecords));
        this._application.internalStructure.overwriteItem(setRecords);
        this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
        this.getScreenshotsAndLogos();
    },
    getMissingData: function Thumbs_getMissingData(thumbData, options) {
        if (!thumbData.source)
            return;
        try {
            this._logger.trace("Get missing: " + JSON.stringify(thumbData));
        } catch (ex) {
            this._logger.trace("Get missing: {nsIURI} " + thumbData.location.spec);
        }
        let self = this;
        let stopValues = [
            undefined,
            null
        ];
        let backgroundImageMissing = !Boolean(thumbData.background);
        let thumbDataMerged = thumbData;
        let cachedHistoryData;
        options = options || {};
        if (stopValues.indexOf(thumbData.thumb.title) !== -1) {
            this._application.fastdial.requestTitleForURL(thumbData.source, function (err, title) {
                if (err)
                    return;
                let dataStructure = {};
                self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                    if (thumbData.source !== data.source)
                        return;
                    data.thumb.title = title;
                    dataStructure[index] = data;
                });
                self._application.internalStructure.setItem(dataStructure);
                self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                if (self._application.fastdial.cachedHistoryThumbs[thumbData.source]) {
                    self._application.fastdial.cachedHistoryThumbs[thumbData.source].thumb.title = title;
                    cachedHistoryData = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                    self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(cachedHistoryData));
                }
            });
        }
        if (!thumbData.favicon || !thumbData.favicon.url || options.force) {
            this._application.favicons.requestFaviconForURL(thumbData.location, function (faviconURL, dominantColor) {
                if (!faviconURL)
                    return;
                let dataStructure = {};
                self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                    if (thumbData.source !== data.source)
                        return;
                    data.favicon = {
                        url: faviconURL,
                        color: dominantColor
                    };
                    dataStructure[index] = data;
                });
                self._application.internalStructure.setItem(dataStructure);
                self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                let historyThumb = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                let faviconData = {
                    url: faviconURL,
                    color: dominantColor
                };
                if (historyThumb) {
                    historyThumb.favicon = faviconData;
                    self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(historyThumb));
                }
            });
        } else if (thumbData.favicon && !thumbData.favicon.color && (!thumbData.background || !thumbData.background.url)) {
            this._application.colors.requestImageDominantColor(thumbData.favicon.url, function (err, dominantColor) {
                if (err || dominantColor === null)
                    return;
                let dataStructure = {};
                self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                    if (thumbData.source !== data.source)
                        return;
                    data.favicon.color = dominantColor;
                    dataStructure[index] = data;
                });
                self._application.internalStructure.setItem(dataStructure);
                self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                if (self._application.fastdial.cachedHistoryThumbs[thumbData.source]) {
                    self._application.fastdial.cachedHistoryThumbs[thumbData.source].favicon.color = dominantColor;
                    cachedHistoryData = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                    self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(cachedHistoryData));
                }
            });
        }
        this._application.cloudSource.fetchThumbLogo(thumbData.location, { force: options.force && !options.syncOnly });
    },
    getScreenshotsAndLogos: function Thumbs_getScreenshotsAndLogos(thumbData) {
        this._application.internalStructure.iterate({
            nonempty: true,
            visible: true
        }, function (thumbData) {
            let screenshot = this._application.screenshots.createScreenshotInstance(thumbData.source);
            if (!screenshot.fileAvailable) {
                screenshot.shot();
            }
            this._application.cloudSource.fetchThumbLogo(thumbData.location);
        }.bind(this));
    },
    onContextmenu: function Thumbs_onContextmenu(thumbIndex) {
        this._hoveredThumbIndex = thumbIndex;
    },
    get hoveredThumbIndex() {
        let index = this._hoveredThumbIndex;
        if (typeof this._hoveredThumbIndex === "undefined")
            this._hoveredThumbIndex = -1;
        return this._hoveredThumbIndex;
    },
    get numberOfFilled() {
        let total = 0;
        this._application.internalStructure.iterate({
            visible: true,
            nonempty: true
        }, function () {
            total += 1;
        });
        if (this._application.preferences.get("ftabs.emptyLastThumb", false))
            total -= 1;
        return total;
    },
    get pinnedPositions() {
        let thumbsNumX = this._application.layout.layoutX;
        let thumbsNumY = this._application.layout.layoutY;
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        let currentThumbsNum = this._application.layout.getThumbsNum();
        let output = [];
        let lastThumbProcessed = false;
        this._application.internalStructure.iterate({ visible: true }, function (thumbData, index) {
            if (index === currentThumbsNum - 1) {
                lastThumbProcessed = true;
                if (emptyLastThumb) {
                    thumbData = { pinned: true };
                }
            }
            if (!thumbData || !thumbData.pinned)
                return;
            let yPosition = Math.floor(parseInt(index, 10) / thumbsNumX);
            let xPosition = parseInt(index, 10) - yPosition * thumbsNumX;
            output.push(yPosition + "." + xPosition);
        });
        if (!lastThumbProcessed && emptyLastThumb) {
            let lastThumbIndex = currentThumbsNum - 1;
            let yPosition = Math.floor(lastThumbIndex / thumbsNumX);
            let xPosition = lastThumbIndex - yPosition * thumbsNumX;
            output.push(yPosition + "." + xPosition);
        }
        return output;
    },
    get _pickupInterval() {
        let prefValue = this._application.preferences.get("ftabs.pickupInterval", 3600);
        return Math.max(parseInt(prefValue, 10), 0);
    },
    get _isRefreshNeeded() {
        let now = Math.round(Date.now() / 1000);
        let lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime", 0);
        let lastRefreshDiff = Math.abs(now - lastRefreshTime);
        return !lastRefreshTime || lastRefreshDiff > REFRESH_INTERVAL;
    },
    _refreshThumbsData: function Thumbs__refreshThumbsData() {
        this._logger.debug("Start updating thumbs' data...");
        let now = Math.round(Date.now() / 1000);
        let lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime", now);
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
            this.getMissingData(thumbData, { force: true });
        }, this);
        this._application.preferences.set("ftabs.lastRefreshThumbsTime", now);
        this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), REFRESH_INTERVAL * 1000);
        this.getScreenshotsAndLogos();
    },
    _getMergedHistoryQueue: function Thumbs__getMergedHistoryQueue(topHistoryData, unsafeDomains, branded) {
        let mergedTopHistory = [];
        let queueDomains = Object.create(null);
        let historyEntries = branded.map(function (entry) {
            return this._application.sync.prepareUrlForServer(entry.url);
        }, this);
        let topHistoryHash = {};
        topHistoryData.forEach(function (elem) {
            topHistoryHash[elem.url] = elem.id;
        });
        let query = PlacesUtils.history.getNewQuery();
        let options = PlacesUtils.history.getNewQueryOptions();
        query.minVisits = 3;
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        let result = PlacesUtils.history.executeQuery(query, options);
        let resultRoot = result.root;
        resultRoot.containerOpen = true;
        let placesCounter = 0;
        let topHistoryCounter = 0;
        while (mergedTopHistory.length < MAX_HISTORY_RESULTS) {
            let historyNode = placesCounter < resultRoot.childCount ? resultRoot.getChild(placesCounter) : null;
            let topHistoryElem = topHistoryCounter < topHistoryData.length ? topHistoryData[topHistoryCounter] : null;
            if (!historyNode && !topHistoryElem)
                break;
            if (!topHistoryElem || historyNode && historyNode.accessCount >= topHistoryElem.visits) {
                placesCounter += 1;
                if (!historyNode.title)
                    continue;
                if (!/^(https?|ftp):\/\//.test(historyNode.uri))
                    continue;
                if (/(social\.yandex\.|\Woauth\d?|\/login\.php|logout)/i.test(historyNode.uri))
                    continue;
                historyEntries.push(historyNode.uri);
                let host = this._application.fastdial.getDecodedUrlHost(historyNode.uri);
                if (host && (queueDomains[host] || unsafeDomains.indexOf(host) !== -1))
                    continue;
                mergedTopHistory.push({
                    id: topHistoryHash[historyNode.uri] || null,
                    url: historyNode.uri,
                    title: historyNode.title,
                    visits: historyNode.accessCount,
                    isLocal: true
                });
                if (host) {
                    queueDomains[host] = 1;
                }
            } else {
                topHistoryCounter += 1;
                let host = this._application.fastdial.getDecodedUrlHost(topHistoryElem.url);
                if (host && (queueDomains[host] || unsafeDomains.indexOf(host) !== -1))
                    continue;
                mergedTopHistory.push(topHistoryElem);
                if (host) {
                    queueDomains[host] = 1;
                }
            }
        }
        let mergedLocalHistory = mergedTopHistory.map(function (entry) {
            entry = sysutils.copyObj(entry);
            entry.statParam = "autothumb";
            if (entry.isLocal)
                return entry;
            entry.url = this._application.syncTopHistory.saveLocalClidState(entry.url, historyEntries);
            return entry;
        }, this);
        resultRoot.containerOpen = false;
        return {
            local: mergedLocalHistory,
            tophistory: mergedTopHistory
        };
    },
    _fetchThumbs: function Thumbs__fetchThumbs(callback) {
        let sql = "SELECT thumbs.url, thumbs.title, thumbs.backgroundColor, thumbs.screenshotColor, thumbs.favicon, thumbs.statParam, shown.*             FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id             ORDER BY shown.position";
        this._database.execQueryAsync(sql, {}, function (rowsData, storageError) {
            if (storageError)
                throw new Error(strutils.formatString("Fetch thumbs error: %1 (code %2)", [
                    storageError.message,
                    storageError.result
                ]));
            rowsData.forEach(function (thumbData) {
                let internalThumbData = this._application.internalStructure.convertDbRow(thumbData, thumbData.fixed);
                this._application.internalStructure.setItem(thumbData.position, internalThumbData);
                if (internalThumbData.background && internalThumbData.background.url && !internalThumbData.background.color) {
                    this._application.cloudSource.fetchThumbLogo(internalThumbData.location);
                }
            }, this);
            this._application.frontendHelper.mute = false;
            callback && callback();
        }.bind(this));
    },
    _getForceAndPinnedThumbs: function Thumbs__getForceAndPinnedThumbs(existingPinnedThumbs) {
        let output = {};
        let emptyPositions = [];
        for (let i = 0; i < MAX_PICKUP_LENGTH; i++) {
            if (existingPinnedThumbs[i]) {
                output[i] = existingPinnedThumbs[i];
            } else {
                emptyPositions.push(i);
            }
        }
        this.getBrandedThumbs(existingPinnedThumbs, true).forEach(function (brandedThumb) {
            let pageDomain = this._application.fastdial.getDecodedUrlHost(brandedThumb.url);
            if (output[brandedThumb.preferedIndex] === undefined) {
                output[brandedThumb.preferedIndex] = brandedThumb;
            } else {
                if (emptyPositions.length) {
                    let index = emptyPositions.shift();
                    output[index] = brandedThumb;
                }
            }
        }, this);
        return output;
    },
    _getMostVisitedQueue: function Thumbs__getMostVisitedQueue(blocked, regexps, branded, historyEntries, free) {
        let output = [];
        let queueDomains = Object.create(null);
        while (branded.length || historyEntries.length || output.length < free) {
            let brandedPage = branded.length ? branded[0] : null;
            let historyPage = historyEntries.length ? historyEntries[0] : null;
            if (!historyPage && !brandedPage)
                break;
            let page = !historyPage || brandedPage && brandedPage.boost > historyPage.visits ? branded.shift() : historyEntries.shift();
            let domain = this._application.fastdial.getDecodedUrlHost(page.url);
            if (!domain || queueDomains[domain] || blocked.indexOf(domain) !== -1)
                continue;
            let isDeniedByRegexp = regexps.some(function (regexpString) {
                let regex = new RegExp(regexpString);
                return regex.test(page.url);
            });
            if (isDeniedByRegexp)
                continue;
            queueDomains[domain] = 1;
            this._application.getHostAliases(domain).forEach(function (alias) {
                queueDomains[alias] = 1;
            });
            page.fixed = 0;
            page.visits = page.visits || page.boost;
            output.push(page);
        }
        return output;
    },
    _initDatabase: function Thumbs__initDatabase() {
        let dbFile = this._application.core.rootDir;
        dbFile.append(DB_FILENAME);
        this._database = new Database(dbFile);
    },
    _compactUnpinned: function Thumbs__compactUnpinned(gapIndex) {
        let evtData = {};
        let index = gapIndex;
        let compactedNum = 0;
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData, thumbIndex) {
            if (thumbIndex <= gapIndex || thumbData.pinned)
                return;
            this._application.internalStructure.overwriteItem(index, thumbData);
            evtData[index] = this._application.frontendHelper.getDataForIndex(index);
            this._application.internalStructure.removeItem(thumbIndex);
            evtData[thumbIndex] = {};
            index = thumbIndex;
            compactedNum += 1;
        }, this);
        this._application.fastdial.sendRequest("thumbChanged", evtData);
        return compactedNum;
    },
    _application: null,
    _logger: null,
    _database: null,
    _pickupTimer: null,
    _refreshThumbsTimer: null
};
