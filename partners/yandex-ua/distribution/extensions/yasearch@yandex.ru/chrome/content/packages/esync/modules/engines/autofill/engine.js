"use strict";
let EXPORTED_SYMBOLS = ["AutofillEngine"];
let {Engine} = require("engines");
let {Observers} = require("observers");
let {Utils} = require("utils");
let timestampOffset = 11644473600000000;
function timeToTimestamp(prTime) {
    return timestampOffset + prTime;
}
;
function timestampToTime(timestamp) {
    return timestamp - timestampOffset;
}
;
XPCOMUtils.defineLazyGetter(this, "FormHistoryDeprecatedService", function () {
    return "nsIFormHistory2" in Ci && NativeAPI.Environment.browser.version.isLessThan("24.a1") ? Cc["@mozilla.org/satchel/form-history;1"].getService(Ci.nsIFormHistory2) : null;
});
function AutofillEngine() {
    Engine.call(this, "Autofill", STORAGE_QUERIES);
}
AutofillEngine.prototype = {
    __proto__: Engine.prototype,
    init: function AutofillEngine_init() {
        this._logger.debug("init");
        FormHistoryWrapper.init(this.database.storageFile.path);
        this.update(this._firstSync.bind(this));
    },
    finalize: function AutofillEngine_finalize() {
        this._logger.debug("finalize");
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
            this._delayedRecalculateAndSyncTimer = null;
        }
        Observers.remove("satchel-storage-changed", this);
        FormHistoryWrapper.finalize();
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
    observe: function AutofillEngine_observe(subject, topic, data) {
        switch (topic) {
        case "satchel-storage-changed":
            this._logger.debug("'satchel-storage-changed' notification with data = '" + data + "'");
            switch (data) {
            case "modifyEntry":
            case "addEntry":
            case "removeEntry": {
                    subject = subject.QueryInterface(Ci.nsIArray);
                    let name = subject.queryElementAt(0, Ci.nsISupportsString).toString();
                    let value = subject.queryElementAt(1, Ci.nsISupportsString).toString();
                    this._trackEntry(name, value);
                    break;
                }
            case "removeEntriesForName":
            case "removeEntriesByTimeframe":
            case "removeAllEntries":
                this._delayedRecalculateAndSync();
                break;
            case "formhistory-add":
            case "formhistory-update": {
                    let guid = subject.QueryInterface(Ci.nsISupportsString).toString();
                    let entry = guid && FormHistoryWrapper.getEntryByGUID({ guid: guid });
                    if (entry) {
                        this._trackEntry(entry.fieldname, entry.value);
                    }
                    break;
                }
            case "formhistory-remove":
                this._delayedRecalculateAndSync();
                break;
            }
            break;
        }
    },
    _trackEntry: function AutofillEngine__trackEntry(name, value) {
        if (this.isIgnoredKey(this._generateIgnoreKey(name, value))) {
            return;
        }
        this._logger.debug("Track entry; name = '" + name + "', value = '" + value + "'");
        let entry = this._storage.findEntry({
            name: name,
            value: value
        });
        let browserEntry = FormHistoryWrapper.getEntry({
            name: name,
            value: value
        });
        if (!entry && !browserEntry) {
            return;
        }
        if (!entry) {
            let rootId = this._storage.rootId;
            if (!rootId) {
                return;
            }
            entry = {
                id_string: Utils.generateUUIDString(),
                parent_id_string: rootId,
                version: 0,
                ctime: Date.now(),
                name: name,
                value: value,
                deleted: false,
                folder: false,
                browser_id: null
            };
        }
        if (browserEntry) {
            entry.usage_timestamp = JSON.parse(entry.usage_timestamp || "[]");
            entry.usage_timestamp.push(timeToTimestamp(Date.now() * 1000));
            entry.browser_id = browserEntry.id;
            this.record.insert({ add: [entry] });
        } else {
            this.record.insert({ remove: [entry] });
        }
        this.sync();
    },
    _firstSync: function AutofillEngine__firstSync() {
        this._logger.debug("First sync");
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
        Observers.add("satchel-storage-changed", this);
    },
    recalculateAndSync: function AutofillEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
            this._delayedRecalculateAndSyncTimer = null;
        }
        let entriesToAdd = [];
        let entriesToRemove = [];
        let rootId = this._storage.rootId;
        FormHistoryWrapper.getEntriesDiff().forEach(function (row) {
            this._logger.trace("New entry: '" + [
                row.id,
                row.browser_firstUsed,
                row.browser_name,
                row.id_string,
                row.storage_name
            ].join("', '") + "'");
            if (row.id) {
                let storageProps = {
                    id_string: Utils.generateUUIDString(),
                    parent_id_string: rootId,
                    version: 0,
                    ctime: row.browser_firstUsed || Date.now(),
                    name: row.browser_name,
                    value: row.browser_value,
                    deleted: false,
                    folder: false,
                    usage_timestamp: [timeToTimestamp(row.browser_lastUsed)],
                    browser_id: row.id
                };
                entriesToAdd.push(storageProps);
            } else {
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
            this.sync();
        }
    },
    _delayedRecalculateAndSync: function AutofillEngine__delayedRecalculateAndSync() {
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
        }
        const RECALCULATE_TIMEOUT = 3000;
        this._delayedRecalculateAndSyncTimer = new NativeAPI.SysUtils.Timer(this.recalculateAndSync.bind(this), RECALCULATE_TIMEOUT);
    },
    setData: function AutofillEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            ctime: data.ctime || 0,
            name: data.name,
            value: data.value,
            deleted: data.deleted,
            folder: data.folder,
            usage_timestamp: JSON.stringify(data.usage_timestamp),
            browser_id: data.browser_id || null
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
        if (entry.browser_id) {
            this._storage.updateEntry(entry);
            return;
        }
        let {name, value} = data;
        let keyToIgnore = this._generateIgnoreKey(name, value);
        this.ignoreKey(keyToIgnore);
        if (existsEntry) {
            FormHistoryWrapper.removeEntry({
                name: existsEntry.name,
                value: existsEntry.value
            });
        }
        FormHistoryWrapper.removeEntry({
            name: name,
            value: value
        });
        if (data.deleted) {
            this._storage.removeEntries({ id_string: data.id_string });
        } else {
            FormHistoryWrapper.addEntry({
                name: name,
                value: value
            });
            let browserEntry = FormHistoryWrapper.getEntry({
                name: name,
                value: value
            });
            if (browserEntry) {
                entry.browser_id = browserEntry.id;
            } else {
                this._logger.error("Can not add entry in browser form history.");
            }
            this._storage.updateEntry(entry);
        }
        this.unignoreKey(keyToIgnore);
    },
    setListData: function AutofillEngine_setListData(list, token) {
        let ids = Object.create(null);
        list = list.reverse().filter(function (data) {
            let id = data.id_string;
            if (data.deleted) {
                ids[id] = true;
                return true;
            }
            return !(id in ids);
        }).reverse();
        Engine.prototype.setListData.call(this, list, token);
    },
    _delayedRecalculateAndSyncTimer: null,
    _generateIgnoreKey: function Autofill__generateIgnoreKey(name, value) {
        return name + "	" + value;
    },
    _PROTO_ID: 31729
};
let FormHistoryWrapper = {
    init: function FormHistoryWrapper_init(dbFilePath) {
        try {
            this._query(this.QUERIES.ATTACH_STORAGE_DB, { path: dbFilePath });
        } catch (e) {
        }
    },
    finalize: function FormHistoryWrapper_finalize() {
        try {
            this._query(this.QUERIES.DETACH_STORAGE_DB);
        } catch (e) {
        }
    },
    getEntriesDiff: function FormHistoryWrapper_getEntriesDiff() {
        return this._query(this.QUERIES.SELECT_ENTRIES_DIFF) || [];
    },
    addEntry: function FormHistoryWrapper_addEntry({name, value}) {
        this._formHistoryServiceWrapper.addEntry(name, value);
    },
    removeEntry: function FormHistoryWrapper_removeEntry({name, value}) {
        this._formHistoryServiceWrapper.removeEntry(name, value);
    },
    getEntry: function FormHistoryWrapper_getEntry({name, value}) {
        return this._formHistoryServiceWrapper.getEntry(name, value);
    },
    getEntryByGUID: function FormHistoryWrapper_getEntryByGUID({guid}) {
        return this._formHistoryServiceWrapper.getEntryByGUID(guid);
    },
    entryExists: function FormHistoryWrapper_entryExists({name, value}) {
        return this._formHistoryServiceWrapper.entryExists(name, value);
    },
    get _logger() {
        delete this._logger;
        return this._logger = NativeAPI.logger.getLogger("AutofillEngine.FormHistoryWrapper");
    },
    get _formHistoryServiceWrapper() {
        delete this._formHistoryServiceWrapper;
        if (FormHistoryDeprecatedService) {
            let formHistoryServiceWrapper = {
                addEntry: function formHistoryServiceWrapper_addEntry(name, value) {
                    return FormHistoryDeprecatedService.addEntry(name, value);
                },
                removeEntry: function formHistoryServiceWrapper_removeEntry(name, value) {
                    return FormHistoryDeprecatedService.removeEntry(name, value);
                },
                entryExists: function formHistoryServiceWrapper_entryExists(name, value) {
                    return FormHistoryDeprecatedService.entryExists(name, value);
                },
                getEntry: function formHistoryServiceWrapper_getEntry(name, value) {
                    return this._query(this.QUERIES.SELECT_ENTRY, {
                        name: name,
                        value: value
                    })[0] || null;
                }.bind(this),
                getEntryByGUID: function formHistoryServiceWrapper_getEntryByGUID(guid) {
                    return this._query(this.QUERIES.SELECT_ENTRY_BY_GUID, { guid: guid })[0] || null;
                }.bind(this)
            };
            return this._formHistoryServiceWrapper = formHistoryServiceWrapper;
        }
        let formHistory = Cu.import("resource://gre/modules/FormHistory.jsm", {}).FormHistory;
        let runFormHistoryOperation = function runFormHistoryOperation(operationName, name, value, guid) {
            let working = true;
            let error;
            let result = null;
            let callback = {
                handleResult: function FormHistoryWrapper_callback_handleResult(res) {
                    working = false;
                    result = res;
                },
                handleError: function FormHistoryWrapper_callback_handleError(err) {
                    working = false;
                    error = err;
                },
                handleCompletion: function FormHistoryWrapper_callback_handleCompletion() {
                    working = false;
                }
            };
            try {
                if (operationName === "search") {
                    let params = guid ? { guid: guid } : {
                        fieldname: name,
                        value: value
                    };
                    formHistory.search([
                        "id",
                        "fieldname",
                        "value",
                        "guid"
                    ], params, callback);
                } else {
                    formHistory.update({
                        op: operationName,
                        fieldname: name,
                        value: value
                    }, callback);
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
        };
        let formHistoryServiceWrapper = {
            addEntry: function formHistoryServiceWrapper_addEntry(name, value) {
                return runFormHistoryOperation("add", name, value);
            },
            removeEntry: function formHistoryServiceWrapper_removeEntry(name, value) {
                runFormHistoryOperation("remove", name, value);
            },
            entryExists: function formHistoryServiceWrapper_entryExists(name, value) {
                return Boolean(runFormHistoryOperation("search", name, value));
            },
            getEntry: function formHistoryServiceWrapper_getEntry(name, value) {
                return runFormHistoryOperation("search", name, value);
            },
            getEntryByGUID: function formHistoryServiceWrapper_getEntryByGUID(guid) {
                return runFormHistoryOperation("search", null, null, guid);
            }
        };
        return this._formHistoryServiceWrapper = formHistoryServiceWrapper;
    },
    get _databaseWrapper() {
        delete this._databaseWrapper;
        if (FormHistoryDeprecatedService) {
            try {
                return this._databaseWrapper = Utils.databaseWrapper(FormHistoryDeprecatedService.DBConnection);
            } catch (e) {
                this._logger.debug("Can not reuse form history db connection");
            }
        }
        let formHistoryFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
        formHistoryFile.append("formhistory.sqlite");
        return this._databaseWrapper = NativeAPI.Database.createInstance(formHistoryFile);
    },
    _query: function FormHistoryWrapper__query(query, parameters) {
        return this._databaseWrapper.execQuerySpinningly(query, parameters);
    },
    QUERIES: {
        ATTACH_STORAGE_DB: "ATTACH :path AS yaEsyncAutofillStorage;",
        DETACH_STORAGE_DB: "DETACH database yaEsyncAutofillStorage;",
        SELECT_ENTRY: "SELECT id, fieldname, value FROM moz_formhistory WHERE fieldname = :name AND value = :value;",
        SELECT_ENTRY_BY_GUID: "SELECT id, fieldname, value FROM moz_formhistory WHERE guid = :guid;",
        SELECT_ENTRIES_DIFF: [
            "SELECT m.id AS id, ",
            "m.fieldname AS browser_name, m.value AS browser_value, ",
            "m.firstUsed AS browser_firstUsed, m.lastUsed AS browser_lastUsed, ",
            "a.id_string AS id_string, ",
            "a.name AS storage_name, a.value AS storage_value ",
            "FROM moz_formhistory AS m ",
            "LEFT OUTER JOIN yaEsyncAutofillStorage.Autofill AS a ",
            "ON m.id = a.browser_id ",
            "WHERE a.browser_id IS NULL ",
            "UNION ALL ",
            "SELECT m.id AS id, ",
            "m.fieldname AS browser_name, m.value AS browser_value, ",
            "m.firstUsed AS browser_firstUsed, m.lastUsed AS browser_lastUsed, ",
            "a.id_string AS id_string, ",
            "a.name AS storage_name, a.value AS storage_value ",
            "FROM yaEsyncAutofillStorage.Autofill AS a ",
            "LEFT OUTER JOIN moz_formhistory AS m ",
            "ON m.id = a.browser_id ",
            "WHERE m.id IS NULL AND a.folder = 0;"
        ].join("")
    }
};
let STORAGE_QUERIES = {
    INIT_ENGINE_TABLE: [
        "CREATE TABLE IF NOT EXISTS Autofill ( ",
        "id_string TEXT PRIMARY KEY, ",
        "parent_id_string TEXT, ",
        "originator_cache_guid VARCHAR, ",
        "version INTEGER, ",
        "ctime DATETIME, ",
        "folder BOOLEAN, ",
        "name TEXT, ",
        "value TEXT, ",
        "usage_timestamp TEXT, ",
        "browser_id INTEGER ",
        ");"
    ].join(""),
    INSERT_DATA: [
        "INSERT OR REPLACE INTO Autofill (",
        "id_string, ",
        "parent_id_string, ",
        "originator_cache_guid, ",
        "version, ",
        "ctime, ",
        "folder, ",
        "name, ",
        "value, ",
        "usage_timestamp, ",
        "browser_id ",
        ") VALUES ( ",
        ":id_string, ",
        ":parent_id_string, ",
        ":originator_cache_guid, ",
        ":version, ",
        ":ctime, ",
        ":folder, ",
        ":name, ",
        ":value, ",
        ":usage_timestamp, ",
        ":browser_id ",
        ");"
    ].join("")
};
