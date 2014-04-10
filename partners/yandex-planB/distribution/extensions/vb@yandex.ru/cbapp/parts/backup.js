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
const SYNC_THROTTLE_TIMEOUT_MS = 3000;
const SYNC_THROTTLE_PROCESS_FINISH = "ftabs-backup-sync-finish";
const backup = {
        init: function Backup_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("Backup");
            this.__proto__ = new patterns.NotificationSource();
            this._initDatabase();
            var now = Math.round(Date.now() / 1000);
            var lastBackupTimeSec = this._application.preferences.get(PREF_LASTDUMP_NAME, 0);
            if (!lastBackupTimeSec) {
                this._application.preferences.set(PREF_LASTDUMP_NAME, now);
                lastBackupTimeSec = now;
            }
            var diffSec = Math.abs(now - lastBackupTimeSec);
            var timeoutMs = Math.max(INTERVAL_SEC - diffSec, 0) * 1000;
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
            var dbClosedCallback = function Backup_finalize_dbClosedCallback() {
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
            var dirEntries = this._backupsDir.directoryEntries;
            var files = [];
            while (dirEntries.hasMoreElements()) {
                let file = dirEntries.getNext().QueryInterface(Ci.nsIFile);
                files.push(file);
            }
            return files.sort(function (a, b) b.lastModifiedTime - a.lastModifiedTime).map(function (file) {
                return {
                    date: file.lastModifiedTime,
                    name: file.leafName
                };
            });
        },
        restore: function Backup_restore(fileName) {
            var backupFile = this._backupsDir;
            backupFile.append(fileName);
            if (!backupFile.exists() || !backupFile.isFile() || !backupFile.isReadable())
                throw new Error("No such backup file: " + fileName);
            var json = fileutils.jsonFromFile(backupFile);
            var thumbs = {};
            var newThumbs = {};
            this._dbTables.forEach(function (tableName) {
                this._database.execQuery("DELETE FROM " + tableName, {});
            }, this);
            this._dbTables.forEach(function (tableName) {
                json[tableName].forEach(function (row) {
                    this._database.execQuery("INSERT INTO " + tableName + " (" + Object.keys(row).join(", ") + ") VALUES (" + Object.keys(row).map(function (field) ":" + field).join(", ") + ")", row);
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
            var dbFile = this._application.core.rootDir;
            dbFile.append(DB_FILENAME);
            this._database = new Database(dbFile);
        },
        _dumpThumbs: function Backup__dumpThumbs() {
            var self = this;
            var thumbsTasks = {};
            var replaceShownTasks = [];
            var thumbsRowIds;
            this._application.internalStructure.iterate(null, function (thumbData, index) {
                if (thumbData.source) {
                    thumbsTasks[thumbData.source] = function (callback) {
                        self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url", { url: thumbData.source }, function (rowsData, storageError) {
                            if (storageError)
                                return callback(storageError);
                            if (rowsData.length) {
                                let rowId = rowsData[0].rowid;
                                let needsUpdate = [
                                        "title",
                                        "backgroundColor",
                                        "favicon"
                                    ].some(function (field) {
                                        return thumbData.thumb[field] !== rowsData[0][field];
                                    });
                                if (!needsUpdate)
                                    return callback(null, rowId);
                                self._database.execQueryAsync("UPDATE thumbs SET title = :title, backgroundColor = :backgroundColor, favicon = :favicon WHERE url = :url", {
                                    url: thumbData.source,
                                    title: thumbData.thumb.title || null,
                                    backgroundColor: thumbData.thumb.backgroundColor || null,
                                    favicon: thumbData.thumb.favicon || null
                                }, function (rowsData, storageError) {
                                    callback(storageError, rowId);
                                });
                            } else {
                                self._database.execQueryAsync("INSERT INTO thumbs (url, title, backgroundImage, backgroundColor, favicon, insertTimestamp) VALUES (:url, :title, '', :backgroundColor, :favicon, :ts)", {
                                    url: thumbData.source,
                                    title: thumbData.thumb.title || null,
                                    backgroundColor: thumbData.thumb.backgroundColor || null,
                                    favicon: thumbData.thumb.favicon || null,
                                    ts: Math.round(Date.now() / 1000)
                                }, function (rowsData, storageError) {
                                    if (storageError)
                                        return callback(storageError);
                                    self._database.execQueryAsync("SELECT rowid FROM thumbs WHERE url = :url", { url: thumbData.source }, function (rowsData, storageError) {
                                        if (!storageError)
                                            self._logger.debug("Thumb (URL: " + thumbData.source + ") was inserted into DB with rowid: " + rowsData[0].rowid);
                                        callback(storageError, rowsData[0].rowid);
                                    });
                                });
                            }
                        });
                    };
                }
                replaceShownTasks.push(function (callback) {
                    self._database.execQueryAsync("INSERT OR REPLACE INTO thumbs_shown (thumb_id, position, fixed, syncId, syncInstance, syncTimestamp) VALUES(:id, :index, :pinned, :syncId, :syncInstance, :syncTimestamp)", {
                        id: thumbData.source ? thumbsRowIds[thumbData.source] : 0,
                        index: index,
                        pinned: Number(thumbData.pinned),
                        syncId: thumbData.sync && thumbData.sync.id || null,
                        syncInstance: thumbData.sync && thumbData.sync.instance || null,
                        syncTimestamp: thumbData.sync && thumbData.sync.timestamp || null
                    }, function (rowsData, storageError) {
                        callback(storageError);
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
                self._database.execQueryAsync("SELECT MAX(rowid) AS rowid FROM thumbs_shown", {}, function (rowsData, storageError) {
                    if (storageError)
                        throw new Error(strutils.formatString("Get max thums_shown rowid error: %1 (code %2)", [
                            storageError.message,
                            storageError.result
                        ]));
                    if (rowsData.length) {
                        replaceShownTasks.push(function (callback) {
                            self._database.execQueryAsync("DELETE FROM thumbs_shown WHERE rowid <= :maxint", { maxint: rowsData[0].rowid }, function (rowsData, storageError) {
                                callback(storageError);
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
                    });
                });
            });
        },
        _dumpCurrentData: function Backup__dumpCurrentData() {
            var self = this;
            var tasks = {};
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
                var file = self._backupsDir;
                file.append(Date.now() + ".json");
                fileutils.jsonToFile(results, file);
                var now = Math.round(Date.now() / 1000);
                self._application.preferences.set(PREF_LASTDUMP_NAME, now);
                self._cleanOldFiles();
            });
        },
        _cleanOldFiles: function Backup__cleanOldFiles() {
            this.list.slice(FILES_MAX_NUMBER).forEach(function (fileData) {
                var file = this._backupsDir;
                file.append(fileData.name);
                fileutils.removeFileSafe(file);
            }, this);
        },
        get _backupsDir() {
            var dir = this._application.core.rootDir;
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
