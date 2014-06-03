"use strict";
EXPORTED_SYMBOLS.push("Database");
const storageSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
function Database(storageFile, initStatements) {
    if (storageFile)
        this.open(storageFile, initStatements);
}
;
Database.prototype = {
    constructor: Database,
    open: function Database_open(storageFile, initStatements) {
        if (!(storageFile instanceof Ci.nsIFile))
            throw new TypeError("nsIFile required");
        this.close();
        try {
            this._connectAndInit(storageFile, initStatements);
        } catch (e) {
            Cu.reportError(strutils.formatError(e));
            if (this._connection) {
                this._connection.close();
            }
            let journalFile = storageFile.parent;
            journalFile.append(storageFile.leafName + "-journal");
            fileutils.removeFileSafe(journalFile);
            switch (e.result) {
            case Cr.NS_ERROR_FILE_CORRUPTED:
            case Cr.NS_ERROR_STORAGE_IOERR:
                Cu.reportError("Database: will try to remove corrupt DB file");
                fileutils.removeFileSafe(storageFile);
                if (storageFile.exists())
                    Cu.reportError("Database: can not remove corrupt DB file");
                else
                    Cu.reportError("Database: corrupt DB file removed");
            }
            this._connectAndInit(storageFile, initStatements);
        }
    },
    close: function Database_close(callback) {
        if (callback && typeof callback != "function")
            throw new CustomErrors.EArgType("callback", "Function", callback);
        if (this._connection) {
            if ("asyncClose" in this._connection)
                this._connection.asyncClose(callback ? {
                    complete: function Database_closeComplete() {
                        callback();
                    }
                } : undefined);
            else {
                this._connection.close();
                if (callback)
                    callback();
            }
            this._connection = null;
        }
    },
    execQuery: function Database_execQuery(query, parameters) {
        var result = [];
        var statement = this._createStatement(query, parameters, false);
        try {
            let columnNames = this._getStatementColumnNames(statement);
            while (statement.executeStep()) {
                let row = {};
                let (i = columnNames.length) {
                    for (; i--;) {
                        let colName = columnNames[i];
                        row[colName] = statement.row[colName];
                    }
                }
                result.push(row);
            }
        } finally {
            statement.reset();
            statement.finalize();
        }
        return result;
    },
    execSimpleQuery: function Database_execSimpleQuery(query, parameters) {
        var firstResult = this.execQuery(query, parameters)[0];
        if (firstResult)
            for (let p in firstResult)
                if (firstResult.hasOwnProperty(p))
                    return firstResult[p];
        return undefined;
    },
    execQueryAsync: function Database_execQueryAsync(query, parameters, callback) {
        if (callback && typeof callback != "function")
            throw new TypeError("Third argument must be a function.");
        var statement = this._createStatement(query, parameters, false);
        var columnNames = callback && this._getStatementColumnNames(statement);
        try {
            let callbackObj = this._createStmtCallback(statement, columnNames, callback);
            return statement.executeAsync(callbackObj);
        } finally {
            statement.finalize();
        }
    },
    executeQueryAsync: function Database_executeQueryAsync({
        query: query,
        parameters: parameters,
        columns: columns,
        callback: callback
    }) {
        if (typeof query !== "string")
            throw new TypeError("'query' must be a string.");
        if (callback && typeof callback !== "function")
            throw new TypeError("'callback' must be a function.");
        var statement = this._createStatement(query, parameters, true);
        try {
            let callbackObj = this._createStmtCallback(statement, columns || undefined, callback);
            return statement.executeAsync(callbackObj);
        } finally {
            statement.finalize();
        }
    },
    execQuerySpinningly: function Database_execQuerySpinningly(query, parameters) {
        var working = true;
        var result;
        var error;
        try {
            this.execQueryAsync(query, parameters, function Database_execQuerySpinningly_onCompletion(res, err) {
                working = false;
                result = res;
                error = err;
            });
        } catch (ex) {
            working = false;
            error = ex;
        }
        var thread = Services.tm.currentThread;
        while (working)
            thread.processNextEvent(true);
        if (error)
            throw error;
        return result;
    },
    get lastInsertRowID() {
        return this._connection && this._connection.lastInsertRowID || 0;
    },
    get affectedRows() {
        return this._connection && this._connection.affectedRows || 0;
    },
    get schemaVersion() {
        return this._connection.schemaVersion;
    },
    set schemaVersion(version) {
        if (version < 1 || parseInt(version, 10) !== version)
            throw new Error("Database schema version must be a positive number.");
        this._connection.schemaVersion = version;
    },
    get storageFile() this._connection && this._connection.databaseFile,
    get connection() this._connection,
    set connection(val) this._connection = val,
    _connection: null,
    _connectAndInit: function Database__connectAndInit(storageFile, initStatements) {
        this._connection = storageSvc.openDatabase(storageFile);
        if (!this._connection.connectionReady)
            throw new Error(this._connection.lastError);
        if (!initStatements)
            return;
        (Array.isArray(initStatements) ? initStatements : [initStatements]).forEach(function (statement) this.execQuery(statement), this);
    },
    _createStmtCallback: function Database__createStmtCallback(statement, columnNames, onCompletion) {
        if (!onCompletion)
            return;
        return {
            _results: [],
            _error: undefined,
            handleResult: function Database_callback_handleResult(aResultSet) {
                var row;
                while (row = aResultSet.getNextRow()) {
                    if (Array.isArray(columnNames)) {
                        let resultRow = Object.create(null);
                        columnNames.forEach(function (name, index) resultRow[name] = row.getResultByIndex(index));
                        this._results.push(resultRow);
                    } else {
                        let resultRow = [];
                        try {
                            let (index = 0) {
                                for (;; index++)
                                    resultRow.push(row.getResultByIndex(index));
                            }
                        } catch (e) {
                        }
                        this._results.push(resultRow);
                    }
                }
            },
            handleError: function Database_callback_handleError(aError) {
                this._error = aError;
            },
            handleCompletion: function Database_callback_handleCompletion(aReason) {
                if (aReason === Ci.mozIStorageStatementCallback.REASON_CANCELED)
                    return;
                if (onCompletion)
                    onCompletion(this._results, this._error);
            }
        };
    },
    _createStatement: function Database__createStatement(query, parameters, asyncStatement) {
        if (!this._connection)
            throw new Error("Can't create statement. Database is closed.");
        var statement;
        try {
            statement = asyncStatement ? this._connection.createAsyncStatement(query) : this._connection.createStatement(query);
        } catch (e) {
            Cu.reportError([
                "Error: " + e,
                "Query: " + query,
                "Last error string: " + this._connection.lastErrorString
            ].join("\n  ----\n"));
            throw e;
        }
        if (parameters) {
            if (Array.isArray(parameters)) {
                let params = statement.newBindingParamsArray();
                parameters.forEach(function (value, index) {
                    var bp = params.newBindingParams();
                    bp.bindByIndex(index, value);
                    params.addParams(bp);
                });
                statement.bindParameters(params);
            } else {
                for (let [
                            key,
                            value
                        ] in Iterator(parameters))
                    statement.params[key] = value;
            }
        }
        return statement;
    },
    _getStatementColumnNames: function Database__getStatementColumnNames(statement) {
        var columnNames = [];
        let (i = 0, len = statement.columnCount) {
            for (; i < len; i++)
                columnNames.push(statement.getColumnName(i));
        }
        return columnNames;
    }
};
Database.DatedValues = function DatedValues(storageFile) {
    this._database = new Database(storageFile, this._consts.INIT_TABLE_QUERY);
    this.eraseOldRecords();
};
Database.DatedValues.prototype = {
    get storageFile() this._connection && this._connection.databaseFile,
    close: function DatedValues_close(callback) {
        this._database.close(function () {
            this._database = null;
            callback();
        }.bind(this));
    },
    store: function DatedValues_store(key, value) {
        if (sysutils.isObject(value))
            value = JSON.stringify(value);
        var storeTime = this._currentTimestampSecs;
        return this._database.execQueryAsync(this._consts.INSERT_QUERY, {
            id: key,
            time: storeTime,
            value: value.toString()
        });
    },
    startSearch: function DatedValues_startSearch(key, notOlderThan, callback) {
        var treshold = notOlderThan ? this._currentTimestampSecs - notOlderThan : 0;
        var dbCallback = this._onSearchComplete.bind(this, callback);
        return this._database.execQueryAsync(this._consts.SEARCH_QUERY, {
            id: key,
            treshold: treshold
        }, dbCallback);
    },
    eraseRecord: function DatedValues_eraseRecord(key) {
        return this._database.execQueryAsync("DELETE FROM resources WHERE (id = :id)", { id: key });
    },
    eraseOldRecords: function DatedValues_eraseOldRecords() {
        return this._database.execQueryAsync("DELETE FROM resources WHERE (time < :time)", { time: this._currentTimestampSecs - 3600 * 24 * 90 });
    },
    flush: function DatedValues_flush() {
        return this._database.execQueryAsync("DELETE FROM resources");
    },
    _consts: {
        INIT_TABLE_QUERY: "CREATE TABLE IF NOT EXISTS resources (id TEXT, time INTEGER, value BLOB, PRIMARY KEY(id))",
        INSERT_QUERY: "INSERT OR REPLACE INTO resources (id, time, value) VALUES (:id, :time, :value)",
        SEARCH_QUERY: "SELECT * FROM resources WHERE id = :id AND time >= :treshold LIMIT 1"
    },
    _database: null,
    get _currentTimestampSecs() {
        return parseInt(Date.now() / 1000, 10);
    },
    _onSearchComplete: function DatedValues__onSearchComplete(userCallback, rows, storageError) {
        var cachedData;
        var cacheTimestamp;
        if (!storageError) {
            let row = rows[0];
            if (row) {
                cacheTimestamp = row.time;
                cachedData = row.value;
            }
        }
        userCallback(cachedData, cacheTimestamp, storageError);
    }
};
