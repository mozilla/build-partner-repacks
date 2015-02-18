"use strict";
let EXPORTED_SYMBOLS = ["TypedurlsEngine"];
let {Engine} = require("engines");
let {Observers} = require("observers");
let {Utils} = require("utils");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
let SYNC_DELAY = 10 * 60 * 1000;
let HISTORY_CHANGE_DELAY = 10 * 1000;
let {TRANSITION_TYPED, TRANSITION_REDIRECT_PERMANENT, TRANSITION_REDIRECT_TEMPORARY} = Ci.nsINavHistoryService;
let CHROME_PAGE_TRANSITION_TYPED = 1 | 65536 | 268435456 | 536870912;
let timestampOffset = 11644473600000000;
function timeToTimestamp(prTime) {
    return timestampOffset + prTime;
}
;
function timestampToTime(timestamp) {
    return timestamp - timestampOffset;
}
;
function TypedurlsEngine() {
    Engine.call(this, "Typedurls", STORAGE_QUERIES);
}
TypedurlsEngine.prototype = {
    __proto__: Engine.prototype,
    init: function TypedurlsEngine_init() {
        this._logger.debug("init");
        HistoryWrapper.init(this.database.storageFile.path);
        this._navHistoryObserverTimers = [];
        this._pendingEntries = [];
        this._outputStorage = new outputStorage(this);
        this.update(this._firstSync.bind(this));
    },
    finalize: function TypedurlsEngine_finalize() {
        this._logger.debug("finalize");
        if (this._navHistoryObserverTimers) {
            this._navHistoryObserverTimers.forEach(function (timer) {
                timer.cancel();
            });
            this._navHistoryObserverTimers = null;
        }
        if (this._throttledSync) {
            this._throttledSync.cancel();
            this._throttledSync = null;
        }
        try {
            PlacesUtils.history.removeObserver(this, true);
        } catch (e) {
        }
        this._pendingEntries = null;
        if (this._outputStorage) {
            this._outputStorage.finalize();
            this._outputStorage = null;
        }
        this._stopRecalculateAndSyncTimer();
        HistoryWrapper.finalize();
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsINavHistoryObserver,
        Ci.nsISupportsWeakReference
    ]),
    sync: function TypedurlsEngine_sync() {
        this._stopRecalculateAndSyncTimer();
        return Engine.prototype.sync.apply(this, arguments);
    },
    _firstSync: function TypedurlsEngine__firstSync() {
        this._logger.debug("First sync");
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
        PlacesUtils.history.addObserver(this, true);
    },
    recalculateAndSync: function TypedurlsEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        this._stopRecalculateAndSyncTimer();
        let rootId = this._storage.rootId;
        if (!rootId) {
            this._logger.debug("Can not find rootId");
            return;
        }
        let entriesToAdd = [];
        let entriesToRemove = [];
        HistoryWrapper.getEntriesDiff().forEach(function (row) {
            if (row.id) {
                if (this.isIgnoredOutputKey(this._generateIgnoreKey(row.browser_url))) {
                    return;
                }
                this._logger.debug("New entry:\n" + JSON.stringify(row, null, "	"));
                let visitTime = row.browser_last_visit_date || Date.now() * 1000;
                let lastVisitTime = Math.floor(visitTime / 1000);
                let storageProps = {
                    id_string: Utils.generateUUIDString(),
                    parent_id_string: rootId,
                    version: 0,
                    mtime: lastVisitTime,
                    ctime: lastVisitTime,
                    url: row.browser_url,
                    title: row.browser_title || "",
                    hidden: Boolean(row.browser_hidden),
                    visits: [timeToTimestamp(visitTime)],
                    visit_transitions: [CHROME_PAGE_TRANSITION_TYPED],
                    deleted: false,
                    folder: false,
                    browser_id: row.id
                };
                entriesToAdd.push(storageProps);
            } else {
                this._logger.debug("Old entry:\n" + JSON.stringify(row, null, "	"));
                let entry = this._storage.findEntry({ id_string: row.id_string });
                if (entry) {
                    entriesToRemove.push(entry);
                } else {
                    this._logger.debug("Can not find entry by id_string '" + row.id_string + "'");
                }
            }
        }, this);
        if (entriesToAdd.length || entriesToRemove.length) {
            this.record.insert({
                add: entriesToAdd,
                remove: entriesToRemove
            });
            this._addListToPending(entriesToAdd);
            this.sync();
        }
    },
    _delayedRecalculateAndSync: function TypedurlsEngine__delayedRecalculateAndSync() {
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
        }
        const RECALCULATE_TIMEOUT = 3000;
        this._delayedRecalculateAndSyncTimer = new NativeAPI.SysUtils.Timer(this.recalculateAndSync.bind(this), RECALCULATE_TIMEOUT);
    },
    setListData: function TypedurlsEngine_setListData(list, token) {
        Engine.prototype.setListData.call(this, list, token);
        if (this._outputStorage) {
            this._outputStorage.sync();
        }
    },
    setData: function TypedurlsEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            mtime: data.mtime || 0,
            ctime: data.ctime || 0,
            url: data.url,
            title: data.title || "",
            hidden: Boolean(data.hidden),
            visits: JSON.stringify(data.visits),
            visit_transitions: JSON.stringify(data.visit_transitions),
            deleted: data.deleted,
            folder: data.folder,
            browser_id: data.browser_id || null
        };
        let storageEntry = this._storage.findEntry({ id_string: entry.id_string });
        if (storageEntry && storageEntry.version === entry.version) {
            return;
        }
        this._logger.debug("setData (entry): " + JSON.stringify(entry, null, "	"));
        if (data.folder) {
            this._storage.updateEntry(entry);
            return;
        }
        if (entry.browser_id) {
            this._storage.updateEntry(entry);
            this._removeFromPending(entry.url);
            return;
        }
        let url = data.url;
        let keyToIgnore = this._generateIgnoreKey(url);
        this.ignoreKey(keyToIgnore);
        if (data.deleted) {
            HistoryWrapper.removeEntry(entry);
            this._storage.removeEntries({ id_string: data.id_string });
        } else {
            HistoryWrapper.addEntry(entry);
            let browserEntry = HistoryWrapper.getEntry(entry);
            if (browserEntry) {
                entry.browser_id = browserEntry.placeId;
            } else {
                this._logger.error("Can not add entry in browser form history.");
            }
            this._storage.updateEntry(entry);
        }
        this.unignoreKey(keyToIgnore);
    },
    _delayedRecalculateAndSyncTimer: null,
    _stopRecalculateAndSyncTimer: function TypedurlsEngine__stopRecalculateAndSyncTimer() {
        if (!this._delayedRecalculateAndSyncTimer) {
            return;
        }
        this._delayedRecalculateAndSyncTimer.cancel();
        this._delayedRecalculateAndSyncTimer = null;
    },
    _generateIgnoreKey: function TypedurlsEngine__generateIgnoreKey(uri) {
        return (uri instanceof Ci.nsIURI ? uri.spec : uri) || "empty";
    },
    isIgnoredOutputKey: function TypedurlsEngine_isIgnoredOutputKey(key) {
        if (!/^(ftp|http)s?:\/\//.test(key)) {
            return true;
        }
        return Engine.prototype.isIgnoredKey.call(this, key);
    },
    _PROTO_ID: 40781,
    get throttledSync() {
        if (!this._throttledSync) {
            SYNC_DELAY = NativeAPI.Settings.getValue("engine.Typedurls.syncDelay") * 1000;
            this._throttledSync = Utils.throttle(this.sync.bind(this), SYNC_DELAY);
        }
        return this._throttledSync;
    },
    onBeginUpdateBatch: function TypedurlsEngine_onBeginUpdateBatch() {
        this._logger.debug("onBeginUpdateBatch");
        this.ignoreAll = true;
    },
    onEndUpdateBatch: function TypedurlsEngine_onEndUpdateBatch() {
        this._logger.debug("onEndUpdateBatch");
        this.ignoreAll = false;
        this._delayedRecalculateAndSync();
    },
    onVisit: function TypedurlsEngine_onVisit(uri, visitId, time, sessionId, referringId, transitionType, guid, hidden) {
        if (typeof hidden !== "boolean") {
            hidden = false;
        }
        if (this.ignoreAll || transitionType !== TRANSITION_TYPED) {
            return;
        }
        this._logger.debug("2. onVisit");
        if (this.isIgnoredOutputKey(this._generateIgnoreKey(uri))) {
            return;
        }
        let url = uri instanceof Ci.nsIURI ? uri.spec : uri;
        this._logger.debug("3. onVisit: " + [
            url,
            visitId,
            time,
            sessionId,
            referringId,
            transitionType,
            guid,
            hidden
        ]);
        let lastVisitTimestamp = timeToTimestamp(time);
        let entry = this._storage.findEntry({ url: url });
        let browserEntry = HistoryWrapper.getEntryWithTitle({ url: url });
        if (!browserEntry) {
            this._logger.trace("Can not find browser entry for '" + url + "' on 'onVisit' notification");
            return;
        }
        if (!entry) {
            let rootId = this._storage.rootId;
            if (!rootId) {
                this._logger.debug("Can not find rootId");
                return;
            }
            let lastVisitTime = Math.floor(time / 1000);
            let browser_id = browserEntry.placeId;
            entry = {
                id_string: Utils.generateUUIDString(),
                parent_id_string: rootId,
                version: 0,
                mtime: lastVisitTime,
                ctime: lastVisitTime,
                url: url,
                title: "",
                hidden: Boolean(hidden),
                visits: [lastVisitTimestamp],
                visit_transitions: [CHROME_PAGE_TRANSITION_TYPED],
                deleted: false,
                folder: false,
                browser_id: browser_id
            };
        } else {
            let visits = JSON.parse(entry.visits);
            if (visits.indexOf(lastVisitTimestamp) !== -1) {
                return;
            }
            visits.push(lastVisitTimestamp);
            entry.visits = JSON.stringify(visits);
            let visit_transitions = JSON.parse(entry.visit_transitions);
            visit_transitions.push(CHROME_PAGE_TRANSITION_TYPED);
            entry.visit_transitions = JSON.stringify(visit_transitions);
        }
        entry.title = browserEntry.finalTitle;
        this._logger.debug("this.entryIsPending " + this._entryIsPending(entry.url));
        if (this._entryIsPending(entry.url)) {
            this._outputStorage.insertRecords([entry]);
        } else {
            this.record.insert({ add: [entry] });
            this._addToPending(entry.url);
        }
        this.throttledSync();
    },
    onTitleChanged: function TypedurlsEngine_onTitleChanged(uri, title, guid) {
    },
    onBeforeDeleteURI: function TypedurlsEngine_onBeforeDeleteURI(uri, guid, reason) {
    },
    onDeleteURI: function TypedurlsEngine_onDeleteURI(uri, guid, reason) {
        if (this.ignoreAll) {
            return;
        }
        if (this.isIgnoredOutputKey(this._generateIgnoreKey(uri))) {
            return;
        }
        this._logger.debug("onDeleteURI: " + [
            uri.spec,
            reason
        ]);
        let entry = this._storage.findEntry({ url: uri.spec });
        if (!entry) {
            return;
        }
        this.record.insert({ remove: [entry] });
        this._removeFromPending(entry.url);
        this.throttledSync();
    },
    onClearHistory: function TypedurlsEngine_onClearHistory() {
        if (this.ignoreAll) {
            return;
        }
        this._logger.debug("onClearHistory");
        let entriesToRemove = this._storage.getAllEntries().filter(function (entry) {
            return !entry.folder;
        });
        if (entriesToRemove.length) {
            this.record.insert({ remove: entriesToRemove });
            entriesToRemove.forEach(function (entry) {
                this._removeFromPending(entry.url);
            }, this);
            this.sync();
        }
    },
    onPageChanged: function TypedurlsEngine_onPageChanged() {
    },
    onDeleteVisits: function TypedurlsEngine_onDeleteVisits(uri, visitTime, guid, reason, transitionType) {
        if (this.ignoreAll || transitionType !== TRANSITION_TYPED) {
            return;
        }
        if (this.isIgnoredOutputKey(this._generateIgnoreKey(uri))) {
            return;
        }
        this._logger.debug("onDeleteVisits: " + [
            uri.spec,
            visitTime,
            guid,
            reason,
            transitionType
        ]);
        let entry = this._storage.findEntry({ url: uri.spec });
        if (!entry) {
            return;
        }
        let visit_transitions = JSON.parse(entry.visit_transitions);
        let _visits = [];
        let _visit_transitions = [];
        visitTime = timeToTimestamp(visitTime);
        JSON.parse(entry.visits).forEach(function (time, index) {
            if (time < visitTime) {
                return;
            }
            _visits.push(time);
            _visit_transitions.push(visit_transitions[index]);
        });
        if (_visits.length) {
            entry.visits = JSON.stringify(_visits);
            entry.visit_transitions = JSON.stringify(_visit_transitions);
            if (this._entryIsPending(entry.url)) {
                this._outputStorage.insertRecords([entry]);
            } else {
                this.record.insert({ add: [entry] });
                this._addToPending(entry.url);
            }
        } else {
            this.record.insert({ remove: [entry] });
            this._removeFromPending(entry.url);
        }
        this.throttledSync();
    },
    _entryIsPending: function TypedurlsEngine__entryIsPending(url) {
        return url && this._pendingEntries.indexOf(url) !== -1;
    },
    _addToPending: function TypedurlsEngine__addToPending(url) {
        if (url && !this._entryIsPending(url)) {
            this._pendingEntries.push(url);
        }
    },
    _addListToPending: function TypedurlsEngine__addListToPending(list) {
        if (!list || !list.length) {
            return;
        }
        for (let i = 0, length = list.length; i < length; i++) {
            let entry = list[i];
            this._addToPending(entry.url);
        }
    },
    _removeFromPending: function TypedurlsEngine__removeFromPending(url) {
        if (!url) {
            return;
        }
        let index = this._pendingEntries.indexOf(url);
        if (index !== -1) {
            this._pendingEntries.splice(index, 1);
        }
    },
    _pendingEntries: null,
    _throttledSync: null,
    _navHistoryObserverTimers: null
};
[
    "onVisit",
    "onDeleteURI",
    "onClearHistory",
    "onDeleteVisits"
].forEach(function (methodName) {
    let originalMethod = this[methodName];
    this[methodName] = function () {
        let args = arguments;
        let timer = new NativeAPI.SysUtils.Timer(function () {
            let timerIndex = this._navHistoryObserverTimers.indexOf(timer);
            if (timerIndex !== -1) {
                this._navHistoryObserverTimers.slice(timerIndex, 1);
                originalMethod.apply(this, args);
            }
        }.bind(this), HISTORY_CHANGE_DELAY);
        this._navHistoryObserverTimers.push(timer);
    };
}, TypedurlsEngine.prototype);
let HistoryWrapper = {
    init: function HistoryWrapper_init(dbFilePath) {
        try {
            this._query(this.QUERIES.ATTACH_STORAGE_DB, { path: dbFilePath });
        } catch (e) {
        }
    },
    finalize: function HistoryWrapper_finalize() {
        try {
            this._query(this.QUERIES.DETACH_STORAGE_DB);
        } catch (e) {
        }
    },
    removeEntry: function HistoryWrapper_removeEntry(entry) {
        let uri = Services.io.newURI(entry.url, null, null);
        PlacesUtils.history.removePage(uri);
    },
    addEntry: function HistoryWrapper_addEntry(entry) {
        let uri = Services.io.newURI(entry.url, null, null);
        let visits = typeof entry.visits === "string" ? JSON.parse(entry.visits) : entry.visits;
        let visitTime = visits.pop();
        visitTime = visitTime && timestampToTime(visitTime) || 0;
        let browserEntry = this.getEntry(entry);
        let lastVisit = browserEntry && browserEntry.topVisits && browserEntry.topVisits.pop();
        lastVisit = lastVisit && lastVisit.date || null;
        let title = browserEntry && browserEntry.title || "";
        if (visitTime > lastVisit || !title) {
            title = entry.title || title;
        }
        if (!lastVisit || lastVisit !== visitTime) {
            this._runOperationSync("updatePlaces", {
                uri: uri,
                title: title,
                visits: [{
                        transitionType: TRANSITION_TYPED,
                        visitDate: visitTime
                    }]
            });
        }
        PlacesUtils.history.markPageAsTyped(uri);
    },
    getEntry: function HistoryWrapper_getEntry(entry) {
        let browserEntry;
        try {
            browserEntry = this._runOperationSync("getPlacesInfo", Services.io.newURI(entry.url, null, null));
        } catch (e) {
        }
        if (!browserEntry) {
            return null;
        }
        browserEntry = Object.create(browserEntry);
        let visits = this._query(this.QUERIES.GET_TOP_VISITS, { id: browserEntry.placeId });
        browserEntry.topVisits = visits;
        browserEntry.finalTitle = browserEntry.title || "";
        return browserEntry;
    },
    getEntryWithTitle: function HistoryWrapper_getEntryWithTitle(entry) {
        let browserEntry = this.getEntry(entry);
        if (!browserEntry || browserEntry.finalTitle) {
            return null;
        }
        let destinationVisit = null;
        this._query(this.QUERIES.GET_DESTINATION_VISITS_FOR_PLACE_ID, { id: browserEntry.placeId }).filter(function (entry) {
            return [
                TRANSITION_REDIRECT_PERMANENT,
                TRANSITION_REDIRECT_TEMPORARY
            ].indexOf(entry.visit_type) !== -1;
        }).forEach(function (entry) {
            if (destinationVisit === null || entry.from_visit === destinationVisit.id) {
                destinationVisit = entry;
            }
        });
        if (destinationVisit) {
            let destinationEntry = this._query(this.QUERIES.GET_TITLE_BY_PLACE_ID, { id: destinationVisit.place_id })[0];
            if (destinationEntry) {
                browserEntry.finalTitle = destinationEntry.title;
            }
        }
        return browserEntry;
    },
    getEntriesDiff: function HistoryWrapper_getEntriesDiff() {
        return this._query(this.QUERIES.SELECT_ENTRIES_DIFF) || [];
    },
    get _databaseWrapper() {
        delete this._databaseWrapper;
        let dbConnection = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
        return this._databaseWrapper = Utils.databaseWrapper(dbConnection);
    },
    _query: function HistoryWrapper__query(query, parameters) {
        return this._databaseWrapper.execQuerySpinningly(query, parameters);
    },
    _runOperationSync: function HistoryWrapper__runOperationSync(operationName, placeIdentifier) {
        let working = true;
        let error;
        let result = null;
        let callback = {
            handleResult: function HistoryWrapper_callback_handleResult(placeInfo) {
                working = false;
                result = placeInfo;
            },
            handleError: function HistoryWrapper_callback_handleError(err, placeInfo) {
                working = false;
                error = err;
            },
            handleCompletion: function HistoryWrapper_callback_handleCompletion() {
                working = false;
            }
        };
        try {
            switch (operationName) {
            case "getPlacesInfo": {
                    if (PlacesUtils.asyncHistory && "getPlacesInfo" in PlacesUtils.asyncHistory) {
                        PlacesUtils.asyncHistory.getPlacesInfo(placeIdentifier, callback);
                    } else {
                        let entry = null;
                        let result = this._query(this.QUERIES.SELECT_ENTRY, { url: placeIdentifier.spec })[0];
                        if (result) {
                            entry = {
                                placeId: result.id,
                                guid: result.guid,
                                uri: placeIdentifier,
                                title: result.title,
                                visits: null
                            };
                        }
                        callback.handleResult(entry);
                    }
                    break;
                }
            case "updatePlaces": {
                    if (PlacesUtils.asyncHistory && "updatePlaces" in PlacesUtils.asyncHistory) {
                        PlacesUtils.asyncHistory.updatePlaces(placeIdentifier, callback);
                    } else {
                        let uri = placeIdentifier.uri;
                        placeIdentifier.visits.forEach(function (visit) {
                            PlacesUtils.history.addVisit(uri, visit.visitDate, null, visit.transitionType, false, 0);
                        });
                        callback.handleResult(true);
                    }
                    break;
                }
            default:
                throw new RangeError("Unknown operation '" + operationName + "'");
            }
        } catch (ex) {
            working = false;
            error = ex;
        }
        let thread = Services.tm.currentThread;
        while (working) {
            thread.processNextEvent(false);
        }
        if (error) {
            throw error;
        }
        return result;
    },
    QUERIES: {
        ATTACH_STORAGE_DB: "ATTACH :path AS yaEsyncHistoryStorage;",
        DETACH_STORAGE_DB: "DETACH database yaEsyncHistoryStorage;",
        SELECT_ENTRY: "SELECT id, url, title, hidden, last_visit_date FROM moz_places WHERE url = :url;",
        REMOVE_ENTRY: "DELETE FROM moz_places WHERE url = :url;",
        SELECT_ENTRIES_DIFF: [
            "SELECT m.id AS id, ",
            "m.url AS browser_url, ",
            "m.title AS browser_title, ",
            "m.hidden AS browser_hidden, ",
            "m.last_visit_date AS browser_last_visit_date, ",
            "a.browser_id AS storage_browser_id, ",
            "a.id_string AS id_string, ",
            "a.url AS storage_url ",
            "FROM moz_places AS m ",
            "LEFT OUTER JOIN yaEsyncHistoryStorage.Typedurls AS a ",
            "ON m.id = a.browser_id ",
            "WHERE (a.browser_id IS NULL AND m.typed = 1 AND ",
            "(SELECT COUNT(id) FROM moz_historyvisits WHERE place_id = m.id) > 0) ",
            "GROUP BY id ",
            "UNION ALL ",
            "SELECT m.id AS id, ",
            "m.url AS browser_url, ",
            "m.title AS browser_title, ",
            "m.hidden AS browser_hidden, ",
            "m.last_visit_date AS browser_last_visit_date, ",
            "a.browser_id AS storage_browser_id, ",
            "a.id_string AS id_string, ",
            "a.url AS storage_url ",
            "FROM yaEsyncHistoryStorage.Typedurls AS a ",
            "LEFT OUTER JOIN moz_places AS m ",
            "ON m.id = a.browser_id ",
            "WHERE m.id IS NULL AND a.folder = 0 ",
            "GROUP BY browser_id"
        ].join(""),
        GET_TOP_VISITS: [
            "SELECT visit_type type, visit_date date ",
            "FROM moz_historyvisits ",
            "WHERE place_id = :id ",
            "ORDER BY date DESC LIMIT 10"
        ].join(""),
        GET_DESTINATION_VISITS_FOR_PLACE_ID: [
            "SELECT id, place_id, from_visit, visit_type ",
            "FROM moz_historyvisits ",
            "WHERE id >= (SELECT id FROM moz_historyvisits ",
            "WHERE visit_type ",
            "IN ('" + TRANSITION_REDIRECT_PERMANENT + "', '" + TRANSITION_REDIRECT_TEMPORARY + "') ",
            "AND from_visit = (SELECT id FROM moz_historyvisits ",
            "WHERE place_id = :id AND visit_type = '" + TRANSITION_TYPED + "' ",
            "ORDER BY id DESC LIMIT 1)) ",
            "ORDER BY id ASC LIMIT 10;"
        ].join(""),
        GET_TITLE_BY_PLACE_ID: "SELECT title FROM moz_places WHERE id = :id;"
    }
};
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Typedurls ( ",
        "id_string TEXT PRIMARY KEY, ",
        "parent_id_string TEXT, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "mtime DATETIME, ",
        "ctime DATETIME, ",
        "folder BOOLEAN, ",
        "url TEXT, ",
        "title TEXT, ",
        "hidden BOOLEAN, ",
        "visits TEXT, ",
        "visit_transitions TEXT, ",
        "browser_id INTEGER ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Typedurls (",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "mtime, ",
        "ctime, ",
        "folder, ",
        "url, ",
        "title, ",
        "hidden, ",
        "visits, ",
        "visit_transitions, ",
        "browser_id ",
        ") VALUES ( ",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":mtime, ",
        ":ctime, ",
        ":folder, ",
        ":url, ",
        ":title, ",
        ":hidden, ",
        ":visits, ",
        ":visit_transitions, ",
        ":browser_id ",
        ");"
    ].join("")
};
function outputStorage(engine) {
    this._engine = engine;
    this.init();
}
outputStorage.prototype = {
    init: function outputStorage_init() {
        this._logger = NativeAPI.logger.getLogger("EngineStorage.Typedurls.Output");
        this._toAdd = Object.create(null);
    },
    finalize: function outputStorage_finalize() {
        this._toAdd = null;
    },
    insertRecords: function outputStorage_insertRecords(toAdd) {
        if (!toAdd || !toAdd.length) {
            return;
        }
        for (let i = 0, length = toAdd.length; i < length; i++) {
            let entry = toAdd[i];
            let key = entry.url;
            this._logger.debug("insertRecords add", key, ":", JSON.stringify(entry));
            this._toAdd[key] = entry;
        }
    },
    sync: function outputStorage_sync() {
        this._logger.debug("sync", JSON.stringify(this._toAdd));
        let toAdd = this._toAdd;
        this._toAdd = Object.create(null);
        for (let [
                    key,
                    entry
                ] in Iterator(toAdd)) {
            this._engine.onVisit(entry.url, null, entry.mtime * 1000, null, null, TRANSITION_TYPED, null, entry.hidden);
        }
    },
    _toAdd: null
};
