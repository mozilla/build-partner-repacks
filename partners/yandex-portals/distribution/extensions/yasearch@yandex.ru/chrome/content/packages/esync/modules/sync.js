"use strict";
let EXPORTED_SYMBOLS = ["Sync"];
let {Service} = require("service");
let {Observers} = require("observers");
let {Auth, LOGIN_STATES} = require("auth");
this.__defineGetter__("Protobuf", function () {
    delete this.Protobuf;
    this.Protobuf = require("protobuf").Protobuf;
    return this.Protobuf;
});
let MAX_SQL_ITEMS = 512;
let Sync = {
    init: function Sync_init() {
        this._API = require("api").API;
        this.database.execQuerySpinningly(this._queries.FLUSH_ALL_RECORDS);
        Observers.add("ybar:esync:auth:changed", this);
    },
    finalize: function Sync_finalize() {
        this._API.stopAllRequests();
        this._API = null;
        Observers.remove("ybar:esync:auth:changed", this);
        this._closeDatabase();
    },
    observe: function Sync_observe(topic, subject, data) {
        switch (topic) {
        case "yabar:esync:auth:changed":
            this._closeDatabase();
            break;
        }
    },
    commit: function Sync_commit() {
        let result = this.database.execQuerySpinningly(this._queries.SELECT_UNPROCESSED_RECORDS);
        if (!result.length) {
            return;
        }
        let processQueryOnLIst = function processQueryOnLIst(list, queryType) {
            for (let i = 0, length = Math.ceil(list.length / MAX_SQL_ITEMS); i < length; i++) {
                let listPart = list.slice(i * MAX_SQL_ITEMS, (i + 1) * MAX_SQL_ITEMS);
                this.database.execQuerySpinningly(this._queries[queryType](listPart), listPart);
            }
        }.bind(this, result.map(function (row) {
            return row.id;
        }));
        processQueryOnLIst("SET_PROCESSING");
        let commit = Protobuf.getCommitMessage(result);
        if (!commit) {
            processQueryOnLIst("SET_UNPROCESSING");
            return;
        }
        this._API.command(commit, function (xhr) {
            let sendedData = result.map(function (row) {
                let data = JSON.parse(row.data);
                data.engine = row.engine;
                data.deleted = Boolean(row.on_delete);
                return data;
            });
            let protobufMessage = this._getIncomingProtobufMessage(xhr.response);
            if (!protobufMessage) {
                let engines = this.database.execQuerySpinningly(this._queries.LIST_PROCESSING_ENGINES).map(function (row) {
                    return row.engine;
                });
                this._triggerUpdateAndResync(engines);
                processQueryOnLIst("FLUSH_RECORDS");
                return;
            }
            require("scheduler").Scheduler.cleanupPlansData();
            if (this._processCommitIncoming(protobufMessage, sendedData)) {
                let engines = this.database.execQuerySpinningly(this._queries.LIST_PROCESSING_ENGINES).map(function (row) {
                    return row.engine;
                });
                this._triggerUpdateAndResync(engines);
            }
            processQueryOnLIst("FLUSH_RECORDS");
        }.bind(this), function (err, xhr) {
            this._logger.debug("Commit error: " + err);
            if (this._processHTTPError(err, xhr.status)) {
                let engines = this.database.execQuerySpinningly(this._queries.LIST_PROCESSING_ENGINES).map(function (row) {
                    return row.engine;
                });
                this._triggerUpdateAndResync(engines);
                processQueryOnLIst("FLUSH_RECORDS");
                return;
            }
            processQueryOnLIst("SET_UNPROCESSING");
            require("scheduler").Scheduler.cleanupPlansData();
        }.bind(this));
    },
    update: function Sync_update(engineNames, opts) {
        function notifyEngines(state) {
            if (!Service.enabled) {
                return;
            }
            engineNames.forEach(function (engineName) {
                let engine = this.get(engineName);
                if (engine) {
                    engine.emit("update", state);
                }
            }, Service.engineManager);
        }
        let commit = Protobuf.getUpdatesMessage(engineNames, opts);
        this._API.command(commit, function (xhr) {
            let protobufMessage = this._getIncomingProtobufMessage(xhr.response);
            if (!protobufMessage) {
                notifyEngines("error");
                require("scheduler").Scheduler.plan("update", engineNames, opts);
                return;
            }
            require("scheduler").Scheduler.cleanupPlansData();
            this._processUpdateIncoming(protobufMessage);
        }.bind(this), function (err, xhr) {
            this._logger.debug("Update error: " + err);
            notifyEngines("error");
            if (this._processHTTPError(err, xhr.status)) {
                require("scheduler").Scheduler.plan("update", engineNames, opts);
            } else {
                require("scheduler").Scheduler.cleanupPlansData();
            }
        }.bind(this));
    },
    drop: function Sync_drop() {
        this._API.drop(this._onDrop.bind(this));
    },
    cleanClient: function Service_cleanClient(engines) {
        let registeredEngineNames = Service.engineManager.registeredEngines;
        this._removeDatabase();
        let settings = NativeAPI.Settings;
        registeredEngineNames.forEach(function (engineName) {
            settings.setValue("engine." + engineName + ".token", "");
        });
        settings.setValue("xmpp.token", "");
        settings.setValue("store.birthday", "");
    },
    triggerUpdateAndResync: function Sync_triggerUpdateAndResync() {
        let result = this.database.execQuerySpinningly(this._queries.SELECT_UNPROCESSED_RECORDS);
        let processQueryOnLIst = function processQueryOnLIst(list, queryType) {
            for (let i = 0, length = Math.ceil(list.length / MAX_SQL_ITEMS); i < length; i++) {
                let listPart = list.slice(i * MAX_SQL_ITEMS, (i + 1) * MAX_SQL_ITEMS);
                this.database.execQuerySpinningly(this._queries[queryType](listPart), listPart);
            }
        }.bind(this, result.map(function (row) {
            return row.id;
        }));
        processQueryOnLIst("FLUSH_RECORDS");
        let engines = Service.engineManager.startedEngines;
        this._triggerUpdateAndResync(engines);
    },
    _onDrop: function Sync__onDrop() {
        if (!Service.enabled) {
            return;
        }
        this._logger.debug("Drop");
        Auth.logout();
        this.cleanClient();
    },
    _processCommitIncoming: function Sync__processCommitIncoming(protobufMessage, sendedData) {
        if (!protobufMessage) {
            return false;
        }
        let commit = protobufMessage.commit;
        let entries = commit && commit.EntryResponse;
        if (!entries) {
            return false;
        }
        let entriesByEngine = {};
        let needResync = false;
        const RESPONSE_TYPES = Protobuf.sync_pb.CommitResponse.ResponseType;
        Array.forEach(entries, function (entry, index) {
            if (entry.response_type !== RESPONSE_TYPES.SUCCESS) {
                if (entry.response_type === RESPONSE_TYPES.CONFLICT && sendedData[index] && sendedData[index].deleted) {
                    this._logger.debug("Conflict. Remove already deleted entry.");
                } else {
                    needResync = true;
                    return;
                }
            }
            let {engineName, data} = Protobuf.parseProtobufEntry(entry, sendedData[index]);
            this._logger.debug("_processCommitIncoming for '", engineName, "'\n", JSON.stringify(data, null, "	").replace(/("(?:username|password)_value":\s*")[^"]+(",?)/g, "$1*****$2"));
            if (!engineName || !data) {
                return;
            }
            data.originator_cache_guid = Auth.token.guid;
            entriesByEngine[engineName] = entriesByEngine[engineName] || [];
            entriesByEngine[engineName].push(data);
        }, this);
        const engineManager = Service.engineManager;
        Object.keys(entriesByEngine).forEach(function (engineName) {
            NativeAPI.Async.nextTick(function () {
                let engine = engineManager.get(engineName);
                let entries = entriesByEngine[engineName];
                if (engine) {
                    engine.setListData(entries);
                }
            });
        });
        return needResync;
    },
    _processUpdateIncoming: function Sync__processUpdateIncoming(protobufMessage) {
        if (!protobufMessage) {
            return false;
        }
        if (protobufMessage.store_birthday) {
            Auth.storeBirthday = protobufMessage.store_birthday;
        }
        let updates = protobufMessage.get_updates;
        if (!updates) {
            return false;
        }
        let entriesByEngine = {};
        let entries = updates.entries;
        let guid = Auth.token.guid;
        Array.forEach(entries, function (entry) {
            if (!entry) {
                return;
            }
            let {engineName, data} = Protobuf.parseProtobufEntry(entry);
            if (!engineName || !data) {
                return;
            }
            entriesByEngine[engineName] = entriesByEngine[engineName] || [];
            entriesByEngine[engineName].push(data);
        }, this);
        const engineManager = Service.engineManager;
        let progressMarkerByEngine = {};
        if (updates.new_progress_marker) {
            Array.forEach(updates.new_progress_marker, function (marker) {
                let engineName = Protobuf.getEngineNameById(marker.data_type_id);
                if (!engineName) {
                    return;
                }
                progressMarkerByEngine[engineName] = marker.token.join("");
                if (!entriesByEngine[engineName]) {
                    entriesByEngine[engineName] = [];
                }
            }, this);
        }
        Object.keys(entriesByEngine).forEach(function (engineName) {
            NativeAPI.Async.nextTick(function () {
                let engine = engineManager.get(engineName);
                let entries = entriesByEngine[engineName];
                let token = progressMarkerByEngine[engineName];
                if (engine) {
                    engine.setListData(entries, token);
                    engine.emit("update", "finish");
                }
            });
        });
        return true;
    },
    _getIncomingProtobufMessage: function Sync__getIncomingProtobufMessage(serverResponse) {
        let protobufMessage;
        try {
            protobufMessage = Protobuf.parseBlob(serverResponse);
        } catch (e) {
            this._logger.error("Error parse commit response");
            this._logger.debug(e);
            return null;
        }
        this._logger.debug("_incomingProtobufMessage: ", protobufMessage);
        let error = protobufMessage.error;
        let code = error && error.error_type || protobufMessage.error_code;
        let action = error && error.action || null;
        if (this._processProtobufError(code, action)) {
            return null;
        }
        return protobufMessage;
    },
    _processHTTPError: function Sync_processError(error, status) {
        if (status === 401) {
            if (Auth.authorized) {
                Auth.logout();
                Auth.state = LOGIN_STATES.EXPIRED;
                return false;
            }
        }
        if (error) {
            return true;
        }
        return false;
    },
    _processProtobufError: function Sync__processProtobofError(code, currentAction) {
        this._logger.debug("Error response: type: ", code, ", action: ", currentAction);
        let type = Protobuf.sync_pb.SyncEnums.ErrorType;
        switch (code) {
        case type.SUCCESS:
            break;
        case type.NOT_MY_BIRTHDAY:
            break;
        case type.THROTTLED:
            break;
        case type.CLEAR_PENDING:
            break;
        case type.TRANSIENT_ERROR:
            return true;
        case type.ACCESS_DENIED:
        case type.USER_NOT_ACTIVATED:
        case type.AUTH_EXPIRED:
        case type.AUTH_INVALID:
        case type.MIGRATION_DONE:
        case type.UNKNOWN:
            break;
        default:
            break;
        }
        let action = Protobuf.sync_pb.SyncEnums.Action;
        switch (currentAction) {
        case action.UPGRADE_CLIENT:
        case action.ENABLE_SYNC_ON_ACCOUNT:
        case action.STOP_AND_RESTART_SYNC:
            break;
        case action.CLEAR_USER_DATA_AND_RESYNC:
            this._clearDataAndResync();
            return true;
        case action.DISABLE_SYNC_ON_CLIENT:
            this._onDrop();
            return true;
        case action.UNKNOWN_ACTION:
        default:
            break;
        }
        return false;
    },
    _clearDataAndResync: function Sync__clearDataAndResync() {
        Auth.storeBirthday = "";
        let engineManager = Service.engineManager;
        let settings = NativeAPI.Settings;
        let registeredEngines = engineManager.registeredEngines;
        engineManager.finalize();
        registeredEngines.forEach(function (engineName) {
            settings.setValue("engine." + engineName + ".token", "");
            this.database.execQuerySpinningly("DROP TABLE IF EXISTS " + engineName + ";");
        }, this);
        settings.setValue("xmpp.token", "");
        engineManager.init();
    },
    _triggerUpdateAndResync: function Sync__triggerUpdateAndResync(engineNames) {
        this._logger.debug("Trigger update and resync: " + engineNames.join());
        let engineManager = Service.engineManager;
        engineNames.forEach(function (engineName) {
            let engine = engineManager.get(engineName);
            if (!engine) {
                return;
            }
            engine.update(function () {
                engine.recalculateAndSync();
            });
        });
    },
    get database() {
        if (!this._db) {
            let syncDBFile = NativeAPI.Files.getPackageStorage(true);
            syncDBFile.append(this.dbName);
            this._db = NativeAPI.Database.createInstance(syncDBFile, this._queries.INIT_RECORD_TABLE);
            this._db.execQuerySpinningly("SELECT * FROM sqlite_master WHERE type = 'trigger';").forEach(function (trigger) {
                this._db.execQuerySpinningly("DROP TRIGGER IF EXISTS " + trigger.name + ";");
            }, this);
        }
        return this._db;
    },
    get dbName() {
        let username = Auth.token.username;
        if (!username) {
            return null;
        }
        return encodeURIComponent(username) + ".sync.sqlite";
    },
    get _logger() {
        delete this._logger;
        return this._logger = NativeAPI.logger.getLogger("Sync");
    },
    _protobuf: null,
    _API: null,
    _db: null,
    _closeDatabase: function Sync__closeDatabase() {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    },
    _removeDatabase: function Sync__removeDatabase() {
        let file = this.database.storageFile;
        this.database.close(function () {
            file.remove(false);
        });
        this._db = null;
    },
    _queries: {
        INIT_RECORD_TABLE: [
            "CREATE TABLE IF NOT EXISTS record ( ",
            "id INTEGER PRIMARY KEY, ",
            "engine TEXT, ",
            "data TEXT, ",
            "on_delete BOOLEAN, ",
            "processing BOOLEAN ",
            ");"
        ].join(""),
        SET_PROCESSING: function SET_PROCESSING(list) {
            return "UPDATE record SET processing = 1 WHERE id IN ( " + list.map(function () {
                return "?";
            }).join(", ") + ");";
        },
        SET_UNPROCESSING: function SET_UNPROCESSING(list) {
            return "UPDATE record SET processing = 0 WHERE id IN ( " + list.map(function () {
                return "?";
            }).join(", ") + ");";
        },
        SET_ALL_AS_UNPROCESSING: "UPDATE record SET processing = 0 WHERE processing = 1;",
        SELECT_UNPROCESSED_RECORDS: "SELECT * FROM record WHERE processing = 0;",
        FLUSH_RECORDS: function FLUSH_RECORDS(list) {
            return "DELETE FROM record WHERE id IN ( " + list.map(function () {
                return "?";
            }).join(", ") + ");";
        },
        FLUSH_ALL_RECORDS: "DELETE FROM record;",
        LIST_PROCESSING_ENGINES: "SELECT DISTINCT engine from record where processing = 1;"
    }
};
