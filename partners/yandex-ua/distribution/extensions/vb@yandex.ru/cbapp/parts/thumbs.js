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
            Services.obs.addObserver(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT, false);
            this._initDatabase();
            var appInfo = this._application.addonManager.info;
            if (appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated", false) === false)
                this._application.preferences.set("ftabs.emptyLastThumb", true);
            var now = Math.round(Date.now() / 1000);
            var lastPickupTime = this._application.preferences.get("ftabs.lastPickupTime", 0);
            var pickupDateDiff = Math.abs(now - lastPickupTime);
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
                if (appInfo.addonUpgraded)
                    return this.pickupThumbs({ withForceThumbs: true });
                if (pickupDateDiff > this._pickupInterval)
                    return this.pickupThumbs({ withForceThumbs: false });
                this._pickupTimer = new sysutils.Timer(this.pickupThumbs.bind(this), Math.max(this._pickupInterval - pickupDateDiff, 0) * 1000);
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
                this.getMissingScreenshots();
            }.bind(this));
        },
        finalize: function Thumbs_finalize(doCleanup, callback) {
            Services.obs.removeObserver(this, DAILY_IDLE_EVENT);
            var dbClosedCallback = function Thumbs_finalize_dbClosedCallback() {
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
            var pos1ThumbData = this._application.internalStructure.getItem(oldIndex);
            var pos2ThumbData = this._application.internalStructure.getItem(newIndex);
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
            var currentThumbsNum = this._application.layout.getThumbsNum();
            if (newIndex === currentThumbsNum - 1) {
                this._application.preferences.set("ftabs.emptyLastThumb", false);
            }
            this._application.internalStructure.removeItem(oldIndex);
            this._application.internalStructure.removeItem(newIndex);
            pos1ThumbData.pinned = true;
            pos1ThumbData.sync = pos1ThumbData.sync || {};
            pos1ThumbData.sync.id = this._application.sync.generateId();
            pos1ThumbData.sync.instance = this._application.name;
            pos1ThumbData.sync.timestamp = Math.round(Date.now() / 1000);
            this._application.internalStructure.overwriteItem(newIndex, pos1ThumbData);
            if (pos2ThumbData) {
                pos2ThumbData.sync = pos2ThumbData.sync || {};
                pos2ThumbData.sync.id = this._application.sync.generateId();
                pos2ThumbData.sync.instance = this._application.name;
                pos2ThumbData.sync.timestamp = Math.round(Date.now() / 1000);
                this._application.internalStructure.overwriteItem(oldIndex, pos2ThumbData);
            }
            var evtData = {};
            evtData[newIndex] = this._application.frontendHelper.getDataForIndex(newIndex);
            evtData[oldIndex] = this._application.frontendHelper.getDataForIndex(oldIndex);
            this._application.fastdial.sendRequest("thumbChanged", evtData);
            this._application.syncPinned.save();
        },
        remove: function Thumbs_remove(aIndex) {
            var thumbData = this._application.internalStructure.getItem(aIndex);
            if (aIndex < 0 || !thumbData)
                return;
            this._logger.trace("Remove thumb #" + aIndex);
            this._application.usageHistory.logAction("delete", { index: aIndex });
            this._application.internalStructure.removeItem(aIndex);
            var isStandardURL = false;
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
            var holesExist = false;
            var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
            var currentThumbsNum = this._application.layout.getThumbsNum();
            if (emptyLastThumb) {
                currentThumbsNum -= 1;
            }
            let (i = 0) {
                for (; i < currentThumbsNum; i++) {
                    if (!this._application.internalStructure.getItem(i)) {
                        holesExist = true;
                        break;
                    }
                }
            }
            if (holesExist) {
                this.pickupThumbs();
            }
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
        },
        save: function Thumbs_save(index, data) {
            var currentThumbsNum = this._application.layout.getThumbsNum();
            var originalURL = data.url;
            var uri;
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
            var currentThumbData = this._application.internalStructure.getItem(index);
            (currentThumbData || {}).pinned = true;
            if (currentThumbData && currentThumbData.source && currentThumbData.thumb && currentThumbData.source === data.url && currentThumbData.thumb.title !== data.title) {
                currentThumbData.thumb.title = data.title;
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
            var host = this._application.fastdial.getDecodedUrlHost(data.url);
            if (host) {
                this._application.blacklist.deleteDomain(host);
            }
            var dbRecord = {
                    url: data.url,
                    title: data.title || null,
                    syncId: this._application.sync.generateId(),
                    syncInternalId: this._application.sync.generateId(),
                    syncInstance: this._application.name,
                    syncTimestamp: Math.round(Date.now() / 1000)
                };
            this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                if (thumbData.source === data.url) {
                    dbRecord.favicon = dbRecord.favicon || thumbData.thumb.favicon;
                    dbRecord.backgroundColor = dbRecord.backgroundColor || thumbData.thumb.backgroundColor;
                }
            });
            var internalThumbData = this._application.internalStructure.convertDbRow(dbRecord, true);
            this._application.internalStructure.overwriteItem(index, internalThumbData);
            var evtData = {};
            evtData[index] = this._application.frontendHelper.getDataForIndex(index);
            this._application.fastdial.sendRequest("thumbChanged", evtData);
            this._application.syncPinned.save();
            this.getMissingData(internalThumbData, { force: true });
            this.getMissingScreenshots();
        },
        updateCurrentSet: function Thumbs_updateCurrentSet(removePositions, saveData) {
            this._logger.trace("Update current set with data: " + JSON.stringify([
                removePositions,
                saveData
            ]));
            var currentThumbsNum = this._application.layout.getThumbsNum();
            var requestData = {};
            removePositions.forEach(function (pos) {
                this._application.internalStructure.removeItem(pos);
                requestData[pos] = {};
            }, this);
            Object.keys(saveData).forEach(function (index) {
                if (index == currentThumbsNum - 1) {
                    this._application.preferences.set("ftabs.emptyLastThumb", false);
                }
                var dbRecord = {
                        url: saveData[index].url,
                        title: saveData[index].title.trim() || null,
                        syncId: saveData[index].id,
                        syncInternalId: saveData[index].internalId,
                        syncInstance: saveData[index].instance,
                        syncTimestamp: saveData[index].timestamp
                    };
                var internalThumbData = this._application.internalStructure.convertDbRow(dbRecord, true);
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
            var current = this._application.internalStructure.getItem(index);
            var structureNeedsChanges = true;
            var syncId, syncInstance, syncTimestamp, syncInternalId;
            var needSync;
            var logMessage = strutils.formatString("%1 thumb #%2", [
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
            var lastThumbIndex = this._application.layout.getThumbsNum() - 1;
            var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
            var knowsAboutLastThumb = index === lastThumbIndex;
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
                if (current.source) {
                    current.sync.id = syncId;
                    current.sync.internalId = syncInternalId;
                    current.sync.timestamp = syncTimestamp;
                    current.sync.instance = syncInstance;
                }
                this._application.internalStructure.setItem(index, current);
            }
            var requestData = {};
            requestData[index] = this._application.frontendHelper.getDataForIndex(index);
            this._application.fastdial.sendRequest("thumbChanged", requestData);
            if (needSync) {
                this._application.syncPinned.save();
            }
        },
        pickupThumbs: function Thumbs_pickupThumbs(options) {
            var self = this;
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
            var now = Math.round(Date.now() / 1000);
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
                    results.pinned[index] = {
                        url: thumbData.source,
                        title: thumbData.thumb ? thumbData.thumb.title : null,
                        backgroundColor: thumbData.thumb ? thumbData.thumb.backgroundColor : null,
                        favicon: thumbData.thumb ? thumbData.thumb.favicon : null,
                        screenshot: thumbData.screenshot ? thumbData.screenshot : null,
                        position: index,
                        fixed: 1
                    };
                    [
                        "id",
                        "instance",
                        "timestamp",
                        "internalId"
                    ].forEach(function (syncField) {
                        if (thumbData.sync && thumbData.sync[syncField]) {
                            let fieldName = "sync" + syncField[0].toUpperCase() + syncField.substr(1);
                            results.pinned[index][fieldName] = thumbData.sync[syncField];
                        }
                    });
                });
                results.branded = [];
                Array.forEach(self._application.fastdial.brandingXMLDoc.querySelectorAll("pages > page"), function (page) {
                    var boost = page.getAttribute("boost");
                    boost = boost === null ? BRANDING_PAGES_BOOST : parseInt(boost, 10);
                    results.branded.push({
                        url: self._application.fastdial.expandBrandingURL(page.getAttribute("url")),
                        title: page.getAttribute("custom_title"),
                        fixed: 0,
                        boost: boost
                    });
                });
                self._logger.trace("Start data: " + JSON.stringify(results));
                var blockedDomains = Array.concat(results.unsafe, results.blacklist.domains);
                var existingPinnedThumbs = results.pinned;
                var currentThumbsNum = self._application.layout.getThumbsNum();
                var {
                        local: historyEntries,
                        tophistory: topHistoryEntries
                    } = self._getMergedHistoryQueue(results.topHistory, results.unsafe, results.branded);
                self._logger.trace("Merged history entries: " + JSON.stringify(historyEntries));
                var fixedThumbs = options.withForceThumbs ? self._getForceAndPinnedThumbs(self._application.fastdial.brandingXMLDoc, existingPinnedThumbs) : existingPinnedThumbs;
                var pinnedDomains = [];
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
                results.branded.sort(function (pageA, pageB) pageB.boost - pageA.boost);
                var free = Math.max(MAX_PICKUP_LENGTH - Object.keys(fixedThumbs).length, 0);
                var allBlockedDomains = blockedDomains.concat(pinnedDomains);
                var mostVisitedList = self._getMostVisitedQueue(allBlockedDomains, results.blacklist.regexps, results.branded, historyEntries, free);
                topHistoryEntries = topHistoryEntries.filter(function (entry) {
                    var host = self._application.fastdial.getDecodedUrlHost(entry.url);
                    return !host || results.unsafe.indexOf(host) === -1;
                });
                var appInfo = self._application.addonManager.info;
                if (appInfo.isFreshAddonInstall && self._application.preferences.get("yabar.migrated", false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion)) {
                    self._logger.debug("Blocked domains are: " + JSON.stringify(blockedDomains, null, "	"));
                    self._logger.debug("Pinned thumbs are: " + JSON.stringify(existingPinnedThumbs, null, "	"));
                    self._logger.debug("Pinned domains are: " + JSON.stringify(pinnedDomains, null, "	"));
                    self._logger.debug("Pinned thumbs w/ BP-forced are: " + JSON.stringify(fixedThumbs, null, "	"));
                    self._logger.debug("Most visited queue thumbs are: " + JSON.stringify(mostVisitedList, null, "	"));
                }
                var newThumbs = {};
                let (i = 0) {
                    for (;; i++) {
                        if (!Object.keys(fixedThumbs).length && !mostVisitedList.length)
                            break;
                        let thumbData;
                        if (fixedThumbs[i]) {
                            thumbData = fixedThumbs[i];
                            delete fixedThumbs[i];
                        } else {
                            thumbData = mostVisitedList.length ? mostVisitedList.shift() : null;
                        }
                        if (!thumbData)
                            continue;
                        newThumbs[i] = self._application.internalStructure.convertDbRow(thumbData, thumbData.fixed);
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
                self.getMissingScreenshots();
                var existingScreenshotNames = Object.create(null);
                self._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                    existingScreenshotNames[this._application.screenshots.createScreenshotInstance(thumbData.source).name] = true;
                }, self);
                var entries = self._application.screenshots.shotsDir.directoryEntries;
                while (entries.hasMoreElements()) {
                    let file = entries.getNext().QueryInterface(Ci.nsIFile);
                    if (file.isFile() && !existingScreenshotNames[file.leafName])
                        fileutils.removeFileSafe(file);
                }
            });
        },
        resetPickupTimer: function Thumbs_resetPickupTimer() {
            if (this._pickupTimer)
                this._pickupTimer.cancel();
            this._pickupTimer = new sysutils.Timer(function () {
                this.pickupThumbs();
            }.bind(this), this._pickupInterval * 1000);
        },
        fastPickup: function Thumbs_fastPickup(unpinned) {
            var blockedDomains = [];
            this._application.internalStructure.iterate({
                nonempty: true,
                pinned: true
            }, function (thumbData, index) {
                try {
                    let domain = thumbData.location.asciiHost.replace(/^www\./, "");
                    blockedDomains.push(domain);
                } catch (ex) {
                }
            }, this);
            this._logger.trace("Blocked domains during fast pickup: " + JSON.stringify(blockedDomains));
            var emptyPositionIndex = 0;
            var setRecords = {};
            var structureNeedsChanges = false;
            var dropPositions = [];
            var unpinnedList = [];
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
                var aVisits = a.thumbData.thumb.visits || 0;
                var bVisits = b.thumbData.thumb.visits || 0;
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
            this.getMissingScreenshots();
        },
        getMissingData: function Thumbs_getMissingData(thumbData, options) {
            if (!thumbData.source)
                return;
            try {
                this._logger.trace("Get missing: " + JSON.stringify(thumbData));
            } catch (ex) {
                this._logger.trace("Get missing: {nsIURI} " + thumbData.location.spec);
            }
            var self = this;
            var stopValues = [
                    undefined,
                    null
                ];
            var backgroundImageMissing = stopValues.indexOf(thumbData.cloud.backgroundImage) !== -1;
            var screenshotMissing = stopValues.indexOf(thumbData.screenshot) !== -1;
            var thumbDataMerged = thumbData;
            var cachedHistoryData;
            options = options || {};
            if (stopValues.indexOf(thumbData.thumb.title) !== -1) {
                this._application.fastdial.requestTitleForURL(thumbData.source, function (err, title) {
                    if (err)
                        return;
                    var dataStructure = {};
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
            if (stopValues.indexOf(thumbData.thumb.favicon) !== -1 || options.force) {
                this._application.favicons.requestFaviconForURL(thumbData.location, function (faviconData, dominantColor) {
                    if (!faviconData)
                        return;
                    var dataStructure = {};
                    self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                        if (thumbData.source !== data.source)
                            return;
                        data.thumb.favicon = faviconData;
                        data.thumb.backgroundColor = dominantColor;
                        dataStructure[index] = data;
                    });
                    self._application.internalStructure.setItem(dataStructure);
                    self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                    if (self._application.fastdial.cachedHistoryThumbs[thumbData.source]) {
                        self._application.fastdial.cachedHistoryThumbs[thumbData.source].thumb.favicon = faviconData;
                        self._application.fastdial.cachedHistoryThumbs[thumbData.source].thumb.backgroundColor = dominantColor;
                        cachedHistoryData = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                        self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(cachedHistoryData));
                    }
                });
            } else if (stopValues.indexOf(thumbData.thumb.favicon) === -1 && stopValues.indexOf(thumbData.thumb.backgroundColor) !== -1) {
                this._application.colors.requestImageDominantColor(thumbData.thumb.favicon, function (err, dominantColor) {
                    if (err || dominantColor === null)
                        return;
                    var dataStructure = {};
                    self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                        if (thumbData.source !== data.source)
                            return;
                        data.thumb.backgroundColor = dominantColor;
                        dataStructure[index] = data;
                    });
                    self._application.internalStructure.setItem(dataStructure);
                    self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                    if (self._application.fastdial.cachedHistoryThumbs[thumbData.source]) {
                        self._application.fastdial.cachedHistoryThumbs[thumbData.source].thumb.backgroundColor = dominantColor;
                        cachedHistoryData = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                        self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(cachedHistoryData));
                    }
                });
            }
            if (backgroundImageMissing || options.force) {
                let host = self._application.fastdial.getDecodedUrlHost(thumbData.source);
                if (host) {
                    this._application.cloudSource.requestExistingTile(host, function Thumbs_getMissingData_onTileDataReady(err, cloudData) {
                        if (err)
                            throw new Error(err);
                        if (!cloudData || options.force && !options.syncOnly) {
                            self._application.cloudSource.fetchTileFromWeb(thumbData.location, options.force || options.historyOnly);
                            return;
                        }
                        if (!cloudData)
                            return;
                        var dataStructure = {};
                        self._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                            if (thumbData.source !== data.source)
                                return;
                            data.cloud.backgroundImage = cloudData.backgroundImage;
                            data.cloud.backgroundColor = cloudData.backgroundColor;
                            dataStructure[index] = data;
                        });
                        self._application.internalStructure.setItem(dataStructure);
                        self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                        if (self._application.fastdial.cachedHistoryThumbs[thumbData.source]) {
                            self._application.fastdial.cachedHistoryThumbs[thumbData.source].cloud.backgroundImage = cloudData.backgroundImage;
                            self._application.fastdial.cachedHistoryThumbs[thumbData.source].cloud.backgroundColor = cloudData.backgroundColor;
                            cachedHistoryData = self._application.fastdial.cachedHistoryThumbs[thumbData.source];
                            self._application.fastdial.sendRequest("historyThumbChanged", self._application.frontendHelper.getDataForThumb(cachedHistoryData));
                        }
                    });
                }
            }
        },
        getMissingScreenshots: function Thumbs_getMissingScreenshots(thumbData) {
            this._application.internalStructure.iterate({
                nonempty: true,
                visible: true
            }, function (thumbData) {
                var screenshot = this._application.screenshots.createScreenshotInstance(thumbData.source);
                if (!screenshot.fileAvailable()) {
                    screenshot.shot();
                }
            }.bind(this));
        },
        get numberOfFilled() {
            var total = 0;
            this._application.internalStructure.iterate({
                visible: true,
                nonempty: true
            }, function () {
                total += 1;
            });
            return total;
        },
        get pinnedPositions() {
            var thumbsNumX = this._application.layout.layoutX;
            var thumbsNumY = this._application.layout.layoutY;
            var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
            var currentThumbsNum = this._application.layout.getThumbsNum();
            var output = [];
            var lastThumbProcessed = false;
            this._application.internalStructure.iterate({ visible: true }, function (thumbData, index) {
                if (index === currentThumbsNum - 1) {
                    lastThumbProcessed = true;
                    if (emptyLastThumb) {
                        thumbData = { pinned: true };
                    }
                }
                if (!thumbData || !thumbData.pinned)
                    return;
                var yPosition = Math.floor(parseInt(index, 10) / thumbsNumX);
                var xPosition = parseInt(index, 10) - yPosition * thumbsNumX;
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
            var prefValue = this._application.preferences.get("ftabs.pickupInterval", 3600);
            return Math.max(parseInt(prefValue, 10), 0);
        },
        get _isRefreshNeeded() {
            var now = Math.round(Date.now() / 1000);
            var lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime", 0);
            var lastRefreshDiff = Math.abs(now - lastRefreshTime);
            return !lastRefreshTime || lastRefreshDiff > REFRESH_INTERVAL;
        },
        _refreshThumbsData: function Thumbs__refreshThumbsData() {
            this._logger.debug("Start updating thumbs' data...");
            var now = Math.round(Date.now() / 1000);
            var lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime", now);
            var lastRefreshBgTime = this._application.preferences.get("ftabs.lastRefreshBackgroundsTime");
            var updateBackgroundImage = !lastRefreshBgTime || Date.now() - REFRESH_INTERVAL * 7 * 1000 > lastRefreshBgTime * 1000;
            this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
                this.getMissingData(thumbData, { force: updateBackgroundImage });
            }, this);
            this._application.preferences.set("ftabs.lastRefreshThumbsTime", now);
            this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), REFRESH_INTERVAL * 1000);
            if (updateBackgroundImage) {
                this._application.preferences.set("ftabs.lastRefreshBackgroundsTime", now);
            }
            this.getMissingScreenshots();
        },
        _getMergedHistoryQueue: function Thumbs__getMergedHistoryQueue(topHistoryData, unsafeDomains, branded) {
            var mergedTopHistory = [];
            var queueDomains = Object.create(null);
            var historyEntries = branded.map(function (entry) {
                    return this._application.sync.prepareUrlForServer(entry.url);
                }, this);
            var topHistoryHash = {};
            topHistoryData.forEach(function (elem) {
                topHistoryHash[elem.url] = elem.id;
            });
            var query = PlacesUtils.history.getNewQuery();
            var options = PlacesUtils.history.getNewQueryOptions();
            query.minVisits = 3;
            options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
            var result = PlacesUtils.history.executeQuery(query, options);
            var resultRoot = result.root;
            resultRoot.containerOpen = true;
            var placesCounter = 0;
            var topHistoryCounter = 0;
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
            var mergedLocalHistory = mergedTopHistory.map(function (entry) {
                    entry = sysutils.copyObj(entry);
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
            var sql = "SELECT thumbs.url, thumbs.title, thumbs.backgroundColor, thumbs.screenshotColor, thumbs.favicon, shown.*             FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id             ORDER BY shown.position";
            this._database.execQueryAsync(sql, {}, function (rowsData, storageError) {
                if (storageError)
                    throw new Error(strutils.formatString("Fetch thumbs error: %1 (code %2)", [
                        storageError.message,
                        storageError.result
                    ]));
                rowsData.forEach(function (thumbData) {
                    var internalThumbData = this._application.internalStructure.convertDbRow(thumbData, thumbData.fixed);
                    this._application.internalStructure.setItem(thumbData.position, internalThumbData);
                }, this);
                this._application.frontendHelper.mute = false;
                callback && callback();
            }.bind(this));
        },
        _getForceAndPinnedThumbs: function Thumbs__getForceAndPinnedThumbs(xmlDoc, existingPinnedThumbs) {
            var output = {};
            var emptyPositions = [];
            var domains = Object.create(null);
            let (i = 0) {
                for (; i < MAX_PICKUP_LENGTH; i++) {
                    if (existingPinnedThumbs[i]) {
                        output[i] = existingPinnedThumbs[i];
                        if (existingPinnedThumbs[i].url) {
                            let host = this._application.fastdial.getDecodedUrlHost(output[i].url);
                            if (host) {
                                domains[host] = 1;
                            }
                        }
                    } else {
                        emptyPositions.push(i);
                    }
                }
            }
            Array.forEach(xmlDoc.querySelectorAll("pages > page[force='true']"), function (page) {
                var pageURL = this._application.fastdial.expandBrandingURL(page.getAttribute("url"));
                var pageDomain = this._application.fastdial.getDecodedUrlHost(pageURL);
                if (pageDomain && domains[pageDomain])
                    return;
                var index = parseInt(page.getAttribute("index"), 10) - 1;
                var pageTitle = page.getAttribute("custom_title");
                if (output[index] === undefined) {
                    output[index] = {
                        url: pageURL,
                        title: pageTitle,
                        fixed: 1
                    };
                } else {
                    if (emptyPositions.length) {
                        let index = emptyPositions.shift();
                        output[index] = {
                            url: pageURL,
                            title: pageTitle,
                            fixed: 1
                        };
                    }
                }
            }, this);
            return output;
        },
        _getMostVisitedQueue: function Thumbs__getMostVisitedQueue(blocked, regexps, branded, historyEntries, free) {
            var output = [];
            var queueDomains = Object.create(null);
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
                        var regex = new RegExp(regexpString);
                        return regex.test(page.url);
                    });
                if (isDeniedByRegexp)
                    continue;
                queueDomains[domain] = 1;
                page.fixed = 0;
                page.visits = page.visits || page.boost;
                output.push(page);
            }
            return output;
        },
        _initDatabase: function Thumbs__initDatabase() {
            var dbFile = this._application.core.rootDir;
            dbFile.append(DB_FILENAME);
            this._database = new Database(dbFile);
        },
        _compactUnpinned: function Thumbs__compactUnpinned(gapIndex) {
            var evtData = {};
            var index = gapIndex;
            var compactedNum = 0;
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
