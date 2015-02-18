"use strict";
let EXPORTED_SYMBOLS = ["EngineRecord"];
function EngineRecord(engine) {
    this._name = engine.name;
    this.init();
}
EngineRecord.prototype = {
    init: function Record_init() {
        this._logger = NativeAPI.logger.getLogger("EngineRecord." + this._name);
    },
    finalize: function Record_finalize() {
        this._logger.debug("finalize");
        this._fieldName = null;
        this._logger = null;
    },
    insert: function Engine_insert({add, remove}, sync) {
        add = add || [];
        remove = remove || [];
        let sqlStringPrefix = "INSERT INTO record (engine, data, on_delete, processing) ";
        let sqlData = { engine: this._name };
        let sqlStrings = [];
        add.forEach(function (record, index) {
            sqlData["data_add" + index] = this._createRecordForInsert(record);
            sqlStrings.push("SELECT :engine, :data_add" + index + ", 0, 0");
        }, this);
        remove.forEach(function (record, index) {
            sqlData["data_remove" + index] = this._createRecordForInsert(record);
            sqlStrings.push("SELECT :engine, :data_remove" + index + ", 1, 0");
        }, this);
        if (!sqlStrings.length) {
            return;
        }
        const SQLITE_TERMS_LIMIT = 300;
        let sqlStringsToProcess;
        while ((sqlStringsToProcess = sqlStrings.splice(0, SQLITE_TERMS_LIMIT)).length) {
            let sqlStringToProcess = sqlStringPrefix + sqlStringsToProcess.join(" UNION ") + ";";
            if (sync) {
                this.database.execQuery(sqlStringToProcess, sqlData);
            } else {
                this.database.execQuerySpinningly(sqlStringToProcess, sqlData);
            }
        }
    },
    _createRecordForInsert: function Engine__createRecordForInsert(data) {
        return JSON.stringify(data);
    },
    get database() {
        let database = require("sync").Sync.database;
        this.__defineGetter__("database", function () {
            return database;
        });
        return this.database;
    }
};
