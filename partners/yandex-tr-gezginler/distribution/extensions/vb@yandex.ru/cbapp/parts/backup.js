"use strict";
const EXPORTED_SYMBOLS = ["backup"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const DB_FILENAME = "fastdial.sqlite";
const PREF_LASTDUMP_NAME = "backup.lastTime";
const INTERVAL_SEC = 86400;
const FILES_MAX_NUMBER = 10;
const SYNC_THROTTLE_TIMEOUT_MS = 10000;
const SYNC_THROTTLE_PROCESS_FINISH = "ftabs-backup-sync-finish";
const backup = {
    init: function Backup_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Backup");
        patterns.NotificationSource.objectMixIn(this);
        this._initDatabase();
        let now = Math.round(Date.now() / 1000);
        let lastBackupTimeSec = this._application.preferences.get(PREF_LASTDUMP_NAME, 0);
        if (!lastBackupTimeSec) {
            this._application.preferences.set(PREF_LASTDUMP_NAME, now);
            lastBackupTimeSec = now;
        }
        let diffSec = Math.abs(now - lastBackupTimeSec);
        let timeoutMs = Math.max(INTERVAL_SEC - diffSec, 0) * 1000;
        new sysutils.Timer(this._dumpCurrentData.bind(this), timeoutMs, INTERVAL_SEC * 1000);
    },
    finalize: function Backup_finalize(doCleanup, callback) {
        if (this._throttleTimer && this._throttleTimer.isRunning) {
            this.addListener(SYNC_THROTTLE_PROCESS_FINISH, this);
            this._finalizeDoCleanup = doCleanup;
            this._finalizeCallback = callback;
            this._throttleTimer.notify();
            return true;
        }
        let dbClosedCallback = function Backup_finalize_dbClosedCallback() {
            this._finalizeDoCleanup = null;
            this._finalizeCallback = null;
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
    get list() {
        let dirEntries = this._backupsDir.directoryEntries;
        let files = [];
        while (dirEntries.hasMoreElements()) {
            let file = dirEntries.getNext().QueryInterface(Ci.nsIFile);
            files.push(file);
        }
        return files.sort((a, b) => b.lastModifiedTime - a.lastModifiedTime).map(function (file) {
            return {
                date: file.lastModifiedTime,
                name: file.leafName
            };
        });
    },
    restore: function Backup_restore(fileName) {
        let backupFile = this._backupsDir;
        backupFile.append(fileName);
        if (!backupFile.exists() || !backupFile.isFile() || !backupFile.isReadable())
            throw new Error("No such backup file: " + fileName);
        let json = fileutils.jsonFromFile(backupFile);
        let thumbs = {};
        let newThumbs = {};
        this._dbTables.forEach(function (tableName) {
            this._database.execQuery("DELETE FROM " + tableName, {});
        }, this);
        this._dbTables.forEach(function (tableName) {
            json[tableName].forEach(function (row) {
                let query = "INSERT INTO " + tableName + " (" + Object.keys(row).join(", ") + ") " + "VALUES (" + Object.keys(row).map(field => ":" + field).join(", ") + ")";
                this._database.execQuery(query, row);
                if (tableName === "thumbs") {
                    thumbs[row.rowid] = row;
                } else if (tableName === "thumbs_shown") {
                    let dbStructure = {
                        url: thumbs[row.thumb_id].url,
                        title: thumbs[row.thumb_id].title,
                        backgroundColor: thumbs[row.thumb_id].backgroundColor,
                        favicon: thumbs[row.thumb_id].favicon,
                        insertTimestamp: thumbs[row.thumb_id].insertTimestamp,
                        rowid: row.thumb_id,
                        syncId: row.syncId,
                        syncInstance: row.syncInstance,
                        syncTimestamp: row.syncTimestamp
                    };
                    newThumbs[row.position] = this._application.internalStructure.convertDbRow(dbStructure, row.fixed);
                }
            }, this);
        }, this);
        this._application.thumbs.resetPickupTimer();
        this._application.internalStructure.clear();
        this._application.internalStructure.setItem(newThumbs);
        this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
            this._application.thumbs.getMissingData(thumbData);
        }, this);
    },
    syncThumbs: function Backup_syncThumbs() {
        if (this._throttleTimer)
            this._throttleTimer.cancel();
        this._throttleTimer = new sysutils.Timer(this._dumpThumbs.bind(this), SYNC_THROTTLE_TIMEOUT_MS);
    },
    observe: function Backup_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case SYNC_THROTTLE_PROCESS_FINISH:
            this.removeAllListeners();
            this.finalize(this._finalizeDoCleanup, this._finalizeCallback);
            break;
        }
    },
    _initDatabase: function Backup__initDatabase() {
        let dbFile = this._application.core.rootDir;
        dbFile.append(DB_FILENAME);
        this._database = new Database(dbFile);
    },
    _dumpThumbs: function Backup__dumpThumbs() {
        let self = this;
        let thumbsTasks = {};
        let replaceShownTasks = [];
        let thumbsRowIds;
        let dumpStartTime = Date.now();
        self._logger.debug("[start] Backup__dumpThumbs");
        this._application.internalStructure.iterate(null, function (thumbData, index) {
            if (thumbData.source) {
                thumbsTasks[thumbData.source] = function (callback) {
                    let columns = [
                        "rowid",
                        "title",
                        "screenshotColor",
                        "statParam",
                        "backgroundColor",
                        "favicon"
                    ];
                    self._database.executeQueryAsync({
                        query: "SELECT " + columns.join(", ") + " FROM thumbs WHERE url = :url",
                        columns: columns,
                        parameters: { url: thumbData.source },
                        callback: function (rowsData, storageError) {
                            if (storageError) {
                                callback(storageError);
                                return;
                            }
                            if (rowsData.length) {
                                let rowData = rowsData[0];
                                let rowId = rowData.rowid;
                                let needsUpdate = [
                                    "title",
                                    "screenshotColor",
                                    "statParam"
                                ].some(function (field) {
                                    return thumbData.thumb[field] !== rowData[field];
                                });
                                needsUpdate = needsUpdate || (!thumbData.favicon || thumbData.favicon.color !== rowData.backgroundColor) || (!thumbData.favicon || thumbData.favicon.url !== rowData.favicon) || (!thumbData.screenshot || thumbData.screenshot.color !== rowData.screenshotColor);
                                if (!needsUpdate) {
                                    callback(null, rowId);
                                    return;
                                }
                                self._database.executeQueryAsync({
                                    query: "UPDATE thumbs SET title = :title, backgroundColor = :backgroundColor, favicon = :favicon, " + "screenshotColor = :screenshotColor, statParam = :statParam " + "WHERE url = :url",
                                    parameters: {
                                        url: thumbData.source,
                                        title: thumbData.thumb.title || null,
                                        backgroundColor: thumbData.favicon && thumbData.favicon.color || null,
                                        favicon: thumbData.favicon && thumbData.favicon.url || null,
                                        screenshotColor: thumbData.screenshot && thumbData.screenshot.color || null,
                                        statParam: thumbData.thumb.statParam || null
                                    },
                                    callback: function (rowsData, storageError) {
                                        callback(storageError, rowId);
                                    }
                                });
                            } else {
                                self._database.executeQueryAsync({
                                    query: "INSERT INTO thumbs (url, title, backgroundImage, backgroundColor, favicon, insertTimestamp, screenshotColor, statParam) " + "VALUES (:url, :title, '', :backgroundColor, :favicon, :ts, :screenshotColor, :statParam)",
                                    parameters: {
                                        url: thumbData.source,
                                        title: thumbData.thumb.title || null,
                                        backgroundColor: thumbData.favicon && thumbData.favicon.color || null,
                                        favicon: thumbData.favicon && thumbData.favicon.url || null,
                                        ts: Math.round(Date.now() / 1000),
                                        screenshotColor: thumbData.screenshot && thumbData.screenshot.color || null,
                                        statParam: thumbData.thumb.statParam || null
                                    },
                                    callback: function (rowsData, storageError) {
                                        if (storageError) {
                                            callback(storageError);
                                            return;
                                        }
                                        self._database.executeQueryAsync({
                                            query: "SELECT rowid FROM thumbs WHERE url = :url",
                                            columns: ["rowid"],
                                            parameters: { url: thumbData.source },
                                            callback: function (rowsData, storageError) {
                                                if (!storageError) {
                                                    self._logger.debug("Thumb (URL: " + thumbData.source + ") was inserted into DB with rowid: " + rowsData[0].rowid);
                                                }
                                                callback(storageError, rowsData[0].rowid);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                };
            }
            replaceShownTasks.push(function (callback) {
                self._database.executeQueryAsync({
                    query: "INSERT OR REPLACE INTO thumbs_shown (thumb_id, position, fixed, syncId, syncInstance, syncTimestamp) " + "VALUES(:id, :index, :pinned, :syncId, :syncInstance, :syncTimestamp)",
                    parameters: {
                        id: thumbData.source ? thumbsRowIds[thumbData.source] : 0,
                        index: index,
                        pinned: Number(thumbData.pinned),
                        syncId: thumbData.sync && thumbData.sync.id || null,
                        syncInstance: thumbData.sync && thumbData.sync.instance || null,
                        syncTimestamp: thumbData.sync && thumbData.sync.timestamp || null
                    },
                    callback: function (rowsData, storageError) {
                        callback(storageError);
                    }
                });
            });
        }, this);
        async.parallel(thumbsTasks, function (storageError, thumbs) {
            if (storageError) {
                let errorMsg = strutils.formatString("Get thumbs rowid error: %1 (code %2)", [
                    storageError.message,
                    storageError.result
                ]);
                self._logger.error(errorMsg);
                return;
            }
            thumbsRowIds = thumbs;
            self._database.executeQueryAsync({
                query: "SELECT MAX(rowid) AS rowid FROM thumbs_shown",
                columns: ["rowid"],
                callback: function (rowsData, storageError) {
                    if (storageError) {
                        throw new Error(strutils.formatString("Get max thumbs_shown rowid error: %1 (code %2)", [
                            storageError.message,
                            storageError.result
                        ]));
                    }
                    if (rowsData.length) {
                        replaceShownTasks.push(function (callback) {
                            self._database.executeQueryAsync({
                                query: "DELETE FROM thumbs_shown WHERE rowid <= :maxint",
                                parameters: { maxint: rowsData[0].rowid },
                                callback: function (rowsData, storageError) {
                                    callback(storageError);
                                }
                            });
                        });
                    }
                    async.parallel(replaceShownTasks, function (storageError) {
                        if (storageError) {
                            let errorMsg = strutils.formatString("Replace shown error: %1 (code %2)", [
                                storageError.message,
                                storageError.result
                            ]);
                            self._logger.error(errorMsg);
                            return;
                        }
                        self._logger.trace("Thumbs structure synced");
                        self._throttleTimer = null;
                        self._notifyListeners(SYNC_THROTTLE_PROCESS_FINISH);
                        self._logger.debug("[finish] Backup__dumpThumbs (" + (Date.now() - dumpStartTime) + " msec.)");
                    });
                }
            });
        });
    },
    _dumpCurrentData: function Backup__dumpCurrentData() {
        let self = this;
        let tasks = {};
        this._dbTables.forEach(function (tableName) {
            tasks[tableName] = function (callback) {
                self._database.execQueryAsync("SELECT rowid, * FROM " + tableName + " ORDER BY rowid", {}, function (rowsData, storageError) {
                    callback(storageError, rowsData);
                });
            };
        });
        async.parallel(tasks, function Backup__initDatabase_onParallelReady(storageError, results) {
            if (storageError)
                throw new Error(strutils.formatString("Dump error: %1 (code %2)", [
                    storageError.message,
                    storageError.result
                ]));
            let file = self._backupsDir;
            file.append(Date.now() + ".json");
            fileutils.jsonToFile(results, file);
            let now = Math.round(Date.now() / 1000);
            self._application.preferences.set(PREF_LASTDUMP_NAME, now);
            self._cleanOldFiles();
        });
    },
    _cleanOldFiles: function Backup__cleanOldFiles() {
        this.list.slice(FILES_MAX_NUMBER).forEach(function (fileData) {
            let file = this._backupsDir;
            file.append(fileData.name);
            fileutils.removeFileSafe(file);
        }, this);
    },
    get _backupsDir() {
        let dir = this._application.core.rootDir;
        dir.append("backups");
        if (!dir.exists()) {
            dir.create(Ci.nsIFile.DIRECTORY_TYPE, fileutils.PERMS_DIRECTORY);
        }
        return dir;
    },
    _application: null,
    _logger: null,
    _database: null,
    _dbTables: [
        "blacklist",
        "thumbs",
        "thumbs_shown",
        "cloud_data",
        "unsafe_domains"
    ],
    _throttleTimer: null,
    _finalizeDoCleanup: null,
    _finalizeCallback: null
};
