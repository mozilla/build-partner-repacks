"use strict";
let EXPORTED_SYMBOLS = ["PinnedEngine"];
let {Engine} = require("engines");
let {SyncComponent} = require("component");
let {Utils} = require("utils");
let {Auth} = require("auth");
let {STORAGE_QUERIES} = require("./modules/sql");
let {PinnedModel} = require("./modules/model");
function PinnedEngine() {
    Engine.call(this, "Pinned", STORAGE_QUERIES);
}
PinnedEngine.prototype = {
    __proto__: Engine.prototype,
    init: function PinnedEngine_init() {
        this._logger.debug("init");
        this._pendingEntries = Object.create(null);
        this._deletedEntries = Object.create(null);
        this._model = new PinnedModel();
        this._componentNotify = Utils.throttle(this._componentNotify.bind(this), 2000);
        this.set = Utils.throttle(this.set.bind(this), 500);
        this.emit("init");
        this.update(function () {
            this._firstSync();
        }.bind(this));
    },
    finalize: function PinnedEngine_finalize() {
        this._logger.debug("finalize");
        this._pendingEntries = null;
        this._deletedEntries = null;
        this._model = null;
        this.emit("finalize");
    },
    setListData: function PinnedEngine_setListData(list, token) {
        if (!list) {
            return;
        }
        let needNotify = false;
        list = list.filter(function (data) {
            let storageEntry = this._storage.findEntry({ id_string: data.id_string });
            if (storageEntry && storageEntry.version >= data.version) {
                return false;
            }
            if (this._isExternalMod(data)) {
                this._logger.debug("isExternalMod " + JSON.stringify(data) + " | " + JSON.stringify(this._pendingEntries));
                needNotify = true;
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
        if (needNotify) {
            this._logger.debug("notify " + this.name);
            this._componentNotify();
        }
        if (!this._hasSomePendings && this._needRecalculate) {
            this.recalculateAndSync();
        }
    },
    setData: function PinnedEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = this._model.get(data);
        if (!entry) {
            return;
        }
        this._storage.updateEntry(entry);
        if (entry.deleted) {
            this._deletedEntries[entry.key] = entry.version;
        }
        this._removeFromPending(entry.key);
    },
    get: function PinnedEngine_get() {
        let data = {};
        this._storage.getAllEntries().forEach(function ({key, value, folder}) {
            if (key && !folder) {
                data[key] = value;
            }
        });
        return data;
    },
    set: function PinnedEngine_set(snapshot, dontCheckOnDelete) {
        if (this._hasSomePendings) {
            this._needRecalculate = true;
            return;
        }
        this._unprocessedSnapshot = null;
        if (!this._storage.rootId) {
            this._unprocessedSnapshot = snapshot;
            return null;
        }
        let [
            toAdd,
            toDelete
        ] = this._subtract(snapshot, Boolean(dontCheckOnDelete));
        if (!toAdd.length && !toDelete.length) {
            return true;
        }
        try {
            this.record.insert({
                add: toAdd,
                remove: toDelete
            });
            this._addToPending(toAdd);
            this._addToPending(toDelete);
        } catch (ex) {
            this._logger.error("Can not insert records in database.");
            this._logger.debug(ex);
            return false;
        }
        this.sync();
        return true;
    },
    recalculateAndSync: function PinnedEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        this.emit("init", "finish");
        this._needRecalculate = false;
        this._pendingEntries = Object.create(null);
    },
    _firstSync: function PinnedEngine__firstSync() {
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
    },
    _subtract: function PinnedEngine__subtract(data, dontCheckOnDelete) {
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
            if (storageEntry) {
                if (storageEntry.value === value) {
                    continue;
                }
                let entry = {
                    id_string: storageEntry.id_string,
                    parent_id_string: rootId,
                    version: storageEntry.version || 0,
                    key: key,
                    value: value
                };
                toAdd.push(entry);
            } else {
                let entry = {
                    id_string: Utils.generateUUIDString(),
                    parent_id_string: rootId,
                    version: 0,
                    key: key,
                    value: value
                };
                toAdd.push(entry);
            }
        }
        let toDelete = [];
        if (!dontCheckOnDelete) {
            for (let [
                        key,
                        value
                    ] in Iterator(storageData)) {
                if (!(key in data)) {
                    toDelete.push(value);
                }
            }
        }
        return [
            toAdd,
            toDelete
        ];
    },
    _entryIsPending: function PinnedEngine__entryIsPending(key) {
        if (!key) {
            return false;
        }
        return Boolean(this._pendingEntries[key]);
    },
    _addToPending: function PinnedEngine__addToPending(data) {
        if (!data || !data.length) {
            return;
        }
        for (let i = 0, length = data.length; i < length; i++) {
            let key = data[i].key;
            if (this._pendingEntries[key]) {
                this._pendingEntries[key]++;
            } else {
                this._pendingEntries[key] = 1;
            }
        }
    },
    _removeFromPending: function PinnedEngine__removeFromPending(key) {
        if (!key) {
            return;
        }
        if (this._pendingEntries[key]) {
            this._pendingEntries[key]--;
        }
    },
    _componentNotify: function PinnedEngine__componentNotify() {
        SyncComponent.notify(this.name, "data", this.get());
    },
    _isExternalMod: function PinnedEngine__isExternalMod(entry) {
        if (!entry) {
            return false;
        }
        if (entry.folder) {
            return false;
        }
        if (entry.deleted && this._deletedEntries[entry.key] >= entry.version) {
            return false;
        }
        return !this._pendingEntries[entry.key];
    },
    get _hasSomePendings() {
        for (let [
                    key,
                    value
                ] in Iterator(this._pendingEntries)) {
            if (value) {
                return true;
            }
        }
        return false;
    },
    _unprocessedSnapshot: null,
    _pendingEntries: null,
    _deletedEntries: null,
    _needRecalculate: false,
    _PROTO_ID: 195560
};
