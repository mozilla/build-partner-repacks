"use strict";
let EXPORTED_SYMBOLS = [
    "EngineManager",
    "Engine"
];
let {Utils} = require("utils");
let {Observers} = require("observers");
let {EngineRecord} = require("record");
let ENGINE_VERSION = 1.2;
function EngineManager() {
    this._logger = NativeAPI.logger.getLogger("EngineManager");
    this._engines = {};
    let exculedEngines = [];
    let done = false;
    try {
        let AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm", {}).AddonManager;
        AddonManager.getAddonByID("vb@yandex.ru", function (aAddon) {
            if (!aAddon || !aAddon.isActive) {
                exculedEngines = [
                    "Pinned",
                    "Tophistory"
                ];
            }
            done = true;
        });
    } catch (e) {
        done = true;
    }
    let thread = Services.tm.currentThread;
    while (!done) {
        thread.processNextEvent(false);
    }
    this._registeredEngines = (NativeAPI.Settings.getValue("registeredEngines") || "").split(",").filter(function (name) {
        return name && /^[a-z]+$/i.test(name) && exculedEngines.indexOf(name) === -1;
    });
}
EngineManager.prototype = {
    init: function EngineManager_init() {
        this.enabledEngines.forEach(function (engineName) {
            this.register(engineName);
        }, this);
    },
    finalize: function EngineManager_finalize() {
        for (let name in this._engines) {
            this._engines[name].finalize();
            delete this._engines[name];
        }
    },
    get: function EngineManager_get(name) {
        if (Array.isArray(name)) {
            let engines = [];
            name.forEach(function (name) {
                let engine = this.get(name);
                if (engine) {
                    engines.push(engine);
                }
            }, this);
            return engines;
        }
        let engine = this._engines[name];
        if (!engine) {
            this._logger.debug("Could not get engine: " + name);
            this._logger.trace("Engines are: " + JSON.stringify(Object.keys(this._engines)));
        }
        return engine;
    },
    getAll: function EngineManager_getAll() {
        let engines = [];
        for (let [
                    ,
                    engine
                ] in Iterator(this._engines)) {
            engines.push(engine);
        }
        return engines;
    },
    get registeredEngines() {
        return this._registeredEngines;
    },
    get enabledEngines() {
        return this._registeredEngines.filter(function (engineName) {
            let enginePref = "engine." + engineName + ".enabled";
            return NativeAPI.Settings.getValue(enginePref);
        });
    },
    get startedEngines() {
        return this.enabledEngines.filter(function (engineName) {
            let engine = this.get(engineName);
            return engine && engine.started;
        }, this);
    },
    register: function EngineManager_register(engineName) {
        if (Array.isArray(engineName)) {
            return engineName.map(this.register, this);
        }
        try {
            let engineObjectName = engineName + "Engine";
            let engineObject = require("engines/" + engineName.toLowerCase() + "/engine")[engineObjectName];
            if (!engineObject) {
                throw new Error("Could not find exported engine instance: " + engineObjectName);
            }
            if (engineName in this._engines) {
                this._logger.debug("Engine '" + engineName + "' is already registered!");
            } else {
                let engine = new engineObject();
                this._engines[engineName] = engine;
                engine.init();
                let enginePref = "engine." + engineName + ".enabled";
                NativeAPI.Settings.setValue(enginePref, true);
            }
        } catch (e) {
            this._logger.error("Could not initialize engine '" + engineName + "'.");
            this._logger.debug(e instanceof Ci.mozIStorageError ? "DB error: (" + e.result + ") " + e.message : e);
        }
    },
    unregister: function EngineManager_unregister(engineName) {
        if (Array.isArray(engineName)) {
            return engineName.map(this.unregister, this);
        }
        engineName = engineName instanceof Engine ? engineName.name : engineName;
        try {
            if (!engineName) {
                throw new Error("No property 'name' of engine '" + engineName + "'.");
            }
            if (!(engineName in this._engines)) {
                this._logger.debug("Engine '" + engineName + "' was not registered!");
            } else {
                let engineObject = this._engines[engineName];
                Engine.prototype.finalize.call(engineObject);
                delete this._engines[engineName];
                let enginePref = "engine." + engineName + ".enabled";
                NativeAPI.Settings.setValue(enginePref, false);
            }
        } catch (e) {
            this._logger.error("Could not finalize engine '" + engineName + "'.");
            this._logger.debug(e instanceof Ci.mozIStorageError ? "DB error: (" + e.result + ") " + e.message : e);
        }
    }
};
function Engine(name, storageQueries) {
    if (!name) {
        throw new Error("Empty engine name.");
    }
    this.name = name;
    Engine.prototype.init.call(this, storageQueries);
}
Engine.prototype = {
    init: function Engine_init(storageQueries) {
        this._ignoredKeys = Object.create(null);
        this._promises = Object.create(null);
        this._logger = NativeAPI.logger.getLogger("Engine." + this.name);
        this._emitPrefix = "ybar:esync:engine:" + this.name + ":";
        this._notify = Utils.notify(this._emitPrefix);
        this.setListData = Utils.makeFIFO(this.setListData);
        if (storageQueries) {
            this._storage = new EngineStorage(this, storageQueries);
        }
        this._queue = new EngineQueue(this);
        this._record = new EngineRecord(this);
        if (typeof this._migrate === "function") {
            this._migrate();
        }
        this.version = ENGINE_VERSION;
        this._enabled = true;
        this._started = false;
    },
    finalize: function Engine_finalize() {
        if (this._onSetListDataTimer) {
            this._onSetListDataTimer.cancel();
            this._onSetListDataTimer = null;
        }
        this.finalize();
        this._storage.finalize();
        this._queue.finalize();
        this._record.finalize();
        this._storage = null;
        this._queue = null;
        this._record = null;
        this._logger = null;
        this._enabled = false;
        this._started = false;
    },
    setData: function Engine_setData(data) {
        throw new Error("Engine should implement setData method.");
    },
    recalculateAndSync: function Engine_recalculateAndSync() {
        throw new Error("Engine should implement recalculateAndSync method.");
    },
    firstSync: function Engine_firstSync() {
        this._started = true;
    },
    setListData: function Engine_setListData(list, token, timeThreshold, sleep) {
        this._logger.debug("setListData ", list.length);
        if (!list.length) {
            return;
        }
        let working = true;
        let tasks = [];
        let that = this;
        timeThreshold = timeThreshold || 2000;
        sleep = sleep || 1000;
        let time;
        list.forEach(function (data) {
            tasks.push(function (callback) {
                if (!that.enabled) {
                    callback(new Error("Engine is not enabled"));
                    return;
                }
                if (timeThreshold && sleep) {
                    let timeDiff = Date.now() - time;
                    if (timeDiff >= timeThreshold) {
                        that._logger.debug("setListData working more than " + timeThreshold + "ms: " + timeDiff + "ms.");
                        that._logger.debug("Sleep on " + sleep + "ms.");
                        that._onSetListDataTimer = new NativeAPI.SysUtils.Timer(function () {
                            time = Date.now();
                            task();
                        }, sleep);
                        return;
                    }
                }
                task();
                function task() {
                    Services.tm.currentThread.dispatch(function () {
                        try {
                            if (!that.enabled) {
                                throw new Error("Engine is not enabled");
                            }
                            let setDataTime = Date.now();
                            that.setData(data);
                            that._logger.trace(Date.now() - setDataTime + "ms.");
                            callback();
                        } catch (err) {
                            if (!that.enabled) {
                                err = new Error("Engine is not enabled");
                            } else {
                                that._logger.debug("Error in setData: " + err);
                            }
                            callback(err);
                        }
                    }, Ci.nsIThread.DISPATCH_NORMAL);
                }
            });
        });
        time = Date.now();
        NativeAPI.Async.series(tasks, function (err) {
            working = false;
            if (err) {
                that._logger.error("Error " + err);
            } else if (token) {
                that.token = token;
            }
        });
        while (working) {
            Services.tm.currentThread.processNextEvent(true);
        }
    },
    flushStorage: function Engine_dropStorage() {
        this._storage.flush();
    },
    update: function Engine_update(callback, opts) {
        let defer = new NativeAPI.Promise.defer();
        defer.promise.then(function () {
            if (typeof callback === "function") {
                callback();
            }
        });
        this._addPromise("update", defer);
        this.emit("update", "start", opts);
    },
    emit: function Engine_emit(topic, state, data) {
        if (!state) {
            state = "start";
        }
        let message = this._emitPrefix + topic + ":" + state;
        this._logger.debug("Event: ", message);
        if (state === "finish") {
            let promise = this._getPromise(topic);
            if (promise) {
                promise.resolve(data);
            }
        }
        Observers.notify(message, data);
    },
    sync: function Engine_sync() {
        if (!("_sync" in this && typeof this._sync == "function")) {
            throw new Error("Engine does not implement _sync method.");
        }
        this._notify("sync", this.name, this._sync);
    },
    get record() {
        return this._record;
    },
    get PROTO_ID() {
        if (!this._PROTO_ID) {
            throw new Error("Engine should implement _PROTO_ID property.");
        }
        return this._PROTO_ID;
    },
    get token() {
        let tokenPref = "engine." + this.name + ".token";
        let tokenObj = JSON.parse(NativeAPI.Settings.getValue(tokenPref) || "{}");
        let username = require("auth").Auth.token.username;
        if (!username) {
            this._logger.debug("Trying to get engine token without username");
            return null;
        }
        return tokenObj[username] || 0;
    },
    set token(val) {
        let tokenPref = "engine." + this.name + ".token";
        let tokenObj = JSON.parse(NativeAPI.Settings.getValue(tokenPref) || "{}");
        let username = require("auth").Auth.token.username;
        if (!username) {
            this._logger.debug("Trying to set engine token without username");
            return null;
        }
        tokenObj[username] = val;
        NativeAPI.Settings.setValue(tokenPref, JSON.stringify(tokenObj));
    },
    get version() {
        return parseFloat(NativeAPI.Settings.getValue("engine." + this.name + ".version") || 0);
    },
    set version(val) {
        if (this.version !== val) {
            NativeAPI.Settings.setValue("engine." + this.name + ".version", String(val));
        }
    },
    get database() {
        let database = require("sync").Sync.database;
        this.__defineGetter__("database", function () {
            return database;
        });
        return this.database;
    },
    ignoreKey: function Engine_ignoreKey(key) {
        this._logger.debug("ignoreKey:", key);
        let val = this._ignoredKeys[key];
        this._ignoredKeys[key] = val ? ++val : 1;
    },
    unignoreKey: function Engine_unignoreKey(key) {
        this._logger.debug("unignoreKey:", key);
        let val = this._ignoredKeys[key];
        this._ignoredKeys[key] = val ? --val : 0;
    },
    isIgnoredKey: function Engine_isIgnoredKey(key) {
        return Boolean(this._ignoredKeys[key]);
    },
    _addPromise: function Engine__addPromise(topic, defer) {
        if (topic in this._promises) {
            this._removePromise(topic);
        }
        this._promises[topic] = defer;
    },
    _removePromise: function Engine__removePromise(topic) {
        delete this._promises[topic];
    },
    _getPromise: function Engine__getPromise(topic) {
        return this._promises[topic] || null;
    },
    ignoreAll: false,
    get lastSyncServer() {
        return NativeAPI.Settings.getValue(this.name + ".lastSyncServer");
    },
    set lastSyncServer(value) {
        NativeAPI.Settings.setValue(this.name + ".lastSyncServer", value);
    },
    resetLastSyncServer: function SyncEngine_resetLastSyncServer() {
        this._logger.debug("Resetting " + this.name + " last sync time");
        this.lastSyncServer = 0;
        this.lastSyncLocal = 0;
    },
    get lastSyncLocal() {
        return NativeAPI.Settings.getValue(this.name + ".lastSyncLocal");
    },
    set lastSyncLocal(value) {
        NativeAPI.Settings.setValue(this.name + ".lastSyncLocal", value);
    },
    _syncStartup: function Engine__syncStartup() {
        this._modified = {};
    },
    _processIncoming: function Engine__processIncoming(newItems) {
    },
    _uploadOutgoing: function Engine__uploadOutgoing() {
    },
    _syncFinish: function Engine__syncFinish() {
    },
    _syncCleanup: function Engine__syncCleanup() {
        if (!this._modified) {
            return;
        }
        this._modified = {};
    },
    _sync: function Engine__sync() {
        try {
            this._syncStartup();
            Observers.notify("ybar:esync:engine:sync:status", "process-incoming");
            this._processIncoming();
            Observers.notify("ybar:esync:engine:sync:status", "upload-outgoing");
            this._uploadOutgoing();
            this._syncFinish();
        } finally {
            this._syncCleanup();
        }
    },
    _resetClient: function Engine__resetClient() {
        this.resetLastSyncServer();
    },
    resetClient: function Engine_resetClient() {
        if (!this._resetClient) {
            throw new Error("Engine does not implement _resetClient method");
        }
        this._notify("reset-client", this.name, this._resetClient);
    },
    _wipeClient: function Engine__wipeClient() {
        this.resetClient();
        this._logger.debug("Deleting all local data");
    },
    wipeClient: function Engine_wipeClient() {
        this._notify("wipe-client", this.name, this._wipeClient);
    },
    get enabled() {
        return this._enabled;
    },
    get started() {
        return this._started;
    },
    _enabled: null,
    _started: null,
    _onSetListDataTimer: null
};
function EngineStorage(engine, queries) {
    this._engine = engine;
    this._queries = queries;
    this._logger = NativeAPI.logger.getLogger("EngineStorage." + engine.name);
    this.init();
}
EngineStorage.prototype = {
    init: function EngineStorage_init() {
        this.database;
    },
    finalize: function EngineStorage_finalize() {
        this._engine = null;
        this._queries = null;
        this._logger = null;
    },
    updateEntry: function EngineStorage_updateEntry(queryParams) {
        if (!queryParams) {
            throw new Error("No 'queryParams' given");
        }
        if (queryParams.deleted) {
            if (!("id_string" in queryParams)) {
                throw new Error("Bad 'queryParams' object: no 'id_string'.");
            }
            this.removeEntries({ id_string: queryParams.id_string });
            return;
        }
        delete queryParams.deleted;
        this.database.execQuerySpinningly(this._queries.INSERT_DATA, queryParams);
    },
    findEntries: function EngineStorage_findEntries(queryParams) {
        let sql;
        if (!queryParams) {
            sql = "SELECT * FROM " + this._engine.name + ";";
        } else {
            sql = "SELECT * FROM " + this._engine.name + " WHERE " + [key + " = :" + key for (key in queryParams)].join(" AND ") + ";";
        }
        this._logger.trace(sql);
        return this.database.execQuerySpinningly(sql, queryParams);
    },
    findEntry: function EngineStorage_findEntry(queryParams) {
        return this.findEntries(queryParams)[0];
    },
    removeEntries: function EngineStorage_removeEntries(queryParams) {
        if (!queryParams) {
            throw new Error("No 'queryParams' given");
        }
        let sql = "DELETE FROM " + this._engine.name + " WHERE " + [key + " = :" + key for (key in queryParams)].join(" AND ") + ";";
        this._logger.trace(sql);
        return this.database.execQuerySpinningly(sql, queryParams);
    },
    getAllEntries: function EngineStorage_getAllEntries() {
        let sql = this._queries.SELECT || "SELECT * FROM " + this._engine.name + ";";
        return this.database.execQuerySpinningly(sql);
    },
    flush: function EngineStorage_flush() {
        let sql = "DELETE FROM " + this._engine.name;
        return this.database.execQuerySpinningly(sql);
    },
    get database() {
        let database = require("sync").Sync.database;
        database.execQuerySpinningly(this._queries.INIT_ENGINE_TABLE);
        this.__defineGetter__("database", function () {
            return database;
        });
        return this.database;
    },
    get rootId() {
        let root = this.findEntry({
            parent_id_string: "0",
            folder: 1
        });
        if (!root) {
            return null;
        }
        let rootId = root.id_string;
        this.__defineGetter__("rootId", function () {
            return rootId;
        });
        return this.rootId;
    }
};
function EngineQueue(engine) {
    this._engine = engine;
    this.init();
}
EngineQueue.prototype = {
    init: function EngineQueue_init() {
        this._data = Object.create(null);
        this._logger = NativeAPI.logger.getLogger("EngineQueue." + this._engine.name);
    },
    finalize: function EngineQueue_finalize() {
        this._data = null;
        this._logger = null;
    },
    write: function EngineQueue_write(action, data, key) {
        if (!data) {
            return;
        }
        let actionData = this._data[action];
        if (!actionData) {
            actionData = this._data[action] = Object.create(null);
        }
        if (Array.isArray(data)) {
            let dataKey = key || this._key;
            for (let i = 0, length = data.length; i < length; i++) {
                let value = data[i];
                let key = value[dataKey];
                if (!key) {
                    this._logger.error("There is no such key " + dataKey + " in data " + JSON.stringify(data));
                    continue;
                }
                actionData[key] = value;
                if (action === "remove") {
                    this._cleanOnRemoveAction(value[key]);
                }
                this._logger.debug("Insert to queue " + key + " with action " + action);
            }
        } else {
            for (let [
                        key,
                        value
                    ] in Iterator(data)) {
                actionData[key] = value;
                if (action === "remove") {
                    this._cleanOnRemoveAction(value[key]);
                }
                this._logger.debug("Insert to queue " + key + " with action " + action);
            }
        }
    },
    remove: function EngineQueue_remove(list) {
        if (!list || !list.length) {
            return;
        }
        let actionLists = Object.keys(this._data);
        list.forEach(function (key) {
            actionLists.forEach(function (action) {
                delete this._data[action][key];
            }, this);
        }, this);
    },
    read: function EngineQueue_read() {
        let data = Object.create(null);
        Object.keys(this._data).forEach(function (action) {
            let currentActionData = this._data[action];
            let newActionData = data[action] = Object.create(null);
            for (let [
                        key,
                        value
                    ] in Iterator(currentActionData)) {
                newActionData[key] = value;
                delete currentActionData[key];
            }
        }, this);
        return data;
    },
    set key(val) {
        this._key = val;
    },
    get key() {
        this._key;
    },
    _cleanOnRemoveAction: function EngineQueue__cleanOnRemoveAction(key) {
        if (!key) {
            return;
        }
        let actionLists = Object.keys(this._data);
        let removeIndex = actionList.indexOf("remove");
        if (removeIndex !== -1) {
            actionList.splice(removeIndex, 1);
        }
        actionList.forEach(function (action) {
            delete this._data[action][key];
            this._logger.debug("Deleted on " + action + " key " + key);
        }, this);
    },
    _data: null,
    _key: "key"
};
