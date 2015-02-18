"use strict";
let EXPORTED_SYMBOLS = ["TophistoryEngine"];
let {Engine} = require("engines");
let {SyncComponent} = require("component");
let {Utils} = require("utils");
function TophistoryEngine() {
    Engine.call(this, "Tophistory", STORAGE_QUERIES);
}
TophistoryEngine.prototype = {
    __proto__: Engine.prototype,
    init: function Tophistory_init() {
        this._logger.debug("init");
        this.emit("init");
        this.update(function () {
            this._firstSync();
        }.bind(this));
    },
    finalize: function Tophistory_finalize() {
        this._logger.debug("finalize");
        this.emit("finalize");
    },
    setListData: function Tophistory_setListData(list, token) {
        if (!list) {
            return;
        }
        list = list.filter(function (data) {
            let storageEntry = this._storage.findEntry({ id_string: data.id_string });
            if (storageEntry && storageEntry.version === data.version) {
                return false;
            }
            return true;
        }.bind(this));
        if (!list.length) {
            return;
        }
        Engine.prototype.setListData.call(this, list, token);
        if (this._unprocessedSnapshot) {
            this.set(this._unprocessedSnapshot);
            return;
        }
        SyncComponent.notify(this.name, "data", this.get());
    },
    setData: function Tohistory_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        this._logger.debug("setData:\n", JSON.stringify(data, null, "	"));
        if (!data) {
            return;
        }
        let storageProps = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            key: null,
            value: null,
            deleted: data.deleted,
            folder: 1
        };
        if (!data.folder) {
            storageProps.key = data.key;
            storageProps.value = data.value;
            storageProps.folder = 0;
        }
        this._storage.updateEntry(storageProps);
    },
    recalculateAndSync: function Tophistory_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        this.emit("init", "finish");
    },
    get: function Tophistory_get() {
        let data = {};
        this._storage.getAllEntries().forEach(function ({key, value, folder}) {
            if (key && !folder) {
                data[key] = value;
            }
        });
        return data;
    },
    set: function Tophistory_set(snapshot) {
        this._unprocessedSnapshot = null;
        if (!this._storage.rootId) {
            this._unprocessedSnapshot = snapshot;
            return null;
        }
        let [
            toAdd,
            toDelete
        ] = this._subtract(snapshot);
        if (!toAdd.length && !toDelete.length) {
            return true;
        }
        try {
            this.record.insert({
                add: toAdd,
                remove: toDelete
            });
        } catch (ex) {
            this._logger.error("Can not insert records in database.");
            this._logger.debug(ex);
            return false;
        }
        this.sync();
        return true;
    },
    _firstSync: function Tophistory__firstSync() {
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
    },
    _subtract: function Tophistory__subtract(data) {
        let storageData = {};
        this._storage.getAllEntries().forEach(function (entry) {
            if (entry.key && !entry.folder) {
                storageData[entry.key] = entry;
            }
        });
        let rootId = this._storage.rootId;
        let toAdd = [];
        for (let [
                    key,
                    value
                ] in Iterator(data)) {
            let storageEntry = storageData[key];
            if (!storageEntry || storageEntry.value !== value) {
                toAdd.push({
                    id_string: storageEntry && storageEntry.id_string || Utils.generateUUIDString(),
                    parent_id_string: rootId,
                    version: storageEntry && storageEntry.version || 0,
                    key: key,
                    value: value
                });
            }
        }
        let toDelete = [];
        for (let [
                    key,
                    value
                ] in Iterator(storageData)) {
            if (!(key in data)) {
                toDelete.push(value);
            }
        }
        return [
            toAdd,
            toDelete
        ];
    },
    _unprocessedSnapshot: null,
    _PROTO_ID: 194891
};
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Tophistory ( ",
        "id_string VARCHAR PRIMARY KEY, ",
        "parent_id_string VARCHAR, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "key VARCHAR, ",
        "value TEXT, ",
        "folder INTEGER ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Tophistory ( ",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "key, ",
        "value, ",
        "folder ",
        ") VALUES (",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":key, ",
        ":value, ",
        ":folder ",
        ");"
    ].join("")
};
