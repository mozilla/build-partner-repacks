"use strict";
let EXPORTED_SYMBOLS = ["DeviceinfoEngine"];
let {Engine} = require("engines");
let {Observers} = require("observers");
let {Utils} = require("utils");
let {STORAGE_QUERIES} = require("./modules/sql");
function DeviceinfoEngine() {
    Engine.call(this, "Deviceinfo", STORAGE_QUERIES);
}
DeviceinfoEngine.prototype = {
    __proto__: Engine.prototype,
    init: function DeviceinfoEngine_init() {
        this._logger.debug("init");
        this.update(this._firstSync.bind(this));
    },
    finalize: function DeviceinfoEngine_finalize() {
        this._logger.debug("finalize");
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsINavHistoryObserver,
        Ci.nsISupportsWeakReference
    ]),
    _firstSync: function DeviceinfoEngine__firstSync() {
        this._logger.debug("First sync");
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
    },
    setData: function DeviceinfoEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            ctime: data.ctime || 0,
            mtime: data.mtime || 0,
            cache_guid: data.cache_guid || "",
            client_name: data.client_name || "",
            device_type: data.device_type || null,
            sync_user_agent: data.sync_user_agent || "",
            chrome_version: data.chrome_version || "",
            deleted: data.deleted,
            folder: data.folder
        };
        this._logger.debug("setData (entry): " + JSON.stringify(entry, null, "	"));
        let existsEntry = this._storage.findEntry({ id_string: data.id_string });
        if (existsEntry && existsEntry.version === entry.version) {
            return;
        }
        if (data.folder) {
            this._storage.updateEntry(entry);
            return;
        }
        if (data.deleted) {
            this._storage.removeEntries({ id_string: data.id_string });
        } else {
            this._storage.updateEntry(entry);
        }
    },
    recalculateAndSync: function DeviceinfoEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        let rootId = this._storage.rootId;
        if (!rootId) {
            this._logger.debug("Can not find rootId");
            return;
        }
        let cache_guid = require("auth").Auth.token.guid;
        if (!cache_guid) {
            this._logger.debug("Can not get guid.");
            return;
        }
        let entry = this._storage.findEntry({ cache_guid: cache_guid });
        if (!entry) {
            this._logger.debug("Create new device info.");
            entry = {
                parent_id_string: rootId,
                version: 0,
                ctime: Date.now(),
                deleted: false,
                folder: false
            };
        }
        let entryForCompare = JSON.stringify(entry);
        entry.cache_guid = cache_guid;
        entry.client_name = Cc["@mozilla.org/network/dns-service;1"].getService(Ci.nsIDNSService).myHostName;
        entry.sync_user_agent = "element_fx";
        entry.chrome_version = NativeAPI.Environment.addon.version;
        if (entryForCompare === JSON.stringify(entry)) {
            return;
        }
        entry.mtime = Date.now();
        this.record.insert({ add: [entry] });
        this.sync();
    },
    _PROTO_ID: 154522
};
