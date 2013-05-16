let EXPORTED_SYMBOLS = ["Database"];

const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;


const storageSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);


function Database(storageFile, initStatements) {
    if (storageFile)
        this.open(storageFile, initStatements);
};

Database.prototype = {
    constructor: Database,
    
    
    open: function Database_open(storageFile, initStatements) {
        if (!(storageFile instanceof Ci.nsILocalFile))
            throw new TypeError("nsILocalFile required");
        
        this.close();
        
        try {
            this._connectAndInit(storageFile, initStatements);
        } catch(e) {
            Cu.reportError(e);
            
            if (this._connection) {
                this._connection.close();
            }
            /*
            let journalFile = storageFile.parent;
            journalFile.append(storageFile.leafName + "-journal");
            fileutils.removeFileSafe(journalFile);
            */
            switch (e.result) {
                case Cr.NS_ERROR_FILE_CORRUPTED:
                case Cr.NS_ERROR_STORAGE_IOERR:
                    Cu.reportError("Database: will try to remove corrupt DB file");
                    storageFile.remove(false);
                    Cu.reportError("Database: corrupt DB file removed");
            }
            
            this._connectAndInit(storageFile, initStatements);
        }
        this._storageFile = storageFile;
    },
    
    
    close: function Database_close(callback) {
        if (callback && (typeof callback != "function"))
            throw new CustomErrors.EArgType("callback", "Function", callback);
        
        if (this._connection) {
            if ("asyncClose" in this._connection)
                this._connection.asyncClose( callback ? {
                    complete: function Database_closeComplete() { callback(); }
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
        let result = [];
        
        let statement = this._createStatement(query, parameters);
        try {
            let colNames = [];
            for (let i = statement.columnCount; i--;)
                colNames.push(statement.getColumnName(i));
            while (statement.executeStep()) {
                let row = {};
                for (let i = colNames.length; i--;) {
                    let colName = colNames[i];
                    row[colName] = statement.row[colName];
                }
                
                result.push(row);
            }
        }
        finally {
            statement.reset();
            statement.finalize();
        }
        
        return result;
    },
    
    
    execSimpleQuery: function Database_execSimpleQuery(query, parameters) {
        let firstResult = this.execQuery(query, parameters)[0];
        if (firstResult)
            for (let p in firstResult)
                if (firstResult.hasOwnProperty(p))
                    return firstResult[p];
        return undefined;
    },
    
    
    execQueryAsync: function Database_execAsync(query, parameters, onCompletion) {
        if (onCompletion && (typeof onCompletion != "function"))
            throw new TypeError("Third argument must be a function.");
        
        let statement = this._createStatement(query, parameters, true);
        try {
            let callbackObj = this._createStmtCallback(statement, onCompletion);
            return statement.executeAsync(callbackObj);
        }
        finally {
            statement.reset();
            statement.finalize();
        }
    },
    
    
    get lastInsertRowID() {
        return (this._connection && this._connection.lastInsertRowID) || 0;
    },

    
    get affectedRows() {
        return (this._connection && this._connection.affectedRows) || 0;
    },
    
    _connection: null,
    
    _connectAndInit: function Database__connectAndInit(storageFile, initStatements) {
        this._connection = storageSvc.openDatabase(storageFile);
        if (!this._connection.connectionReady)
            throw new Error(this._connection.lastError);
        
        if (!initStatements)
            return;
        
        (Array.isArray(initStatements) ? initStatements : [initStatements])
            .forEach(function(statement) this.execQuery(statement), this);
    },
    
    _createStmtCallback: function Database__createStmtCallback(statement, onCompletion) {
        if (!onCompletion)
            return null;
        
        let colNames = [];
        for (let i = 0, len = statement.columnCount; i < len; i++)
            colNames.push(statement.getColumnName(i));
        let numNames = colNames.length;
        
        return {
            _result: [],
            _error: undefined,
            
            handleResult: function Database_callback_handleResult(aResultSet) {
                let row;
                while ((row = aResultSet.getNextRow())) {
                    let resultRow = {};
                    for (let nameIdx = 0; nameIdx < numNames; nameIdx++) {
                        let colName = colNames[nameIdx];
                        resultRow[colName] = row.getResultByName(colName);
                    }
                    this._result.push(resultRow);
                }
            },
           
            handleError: function Database_callback_handleError(aError) {
                this._error = aError;
            },
           
            handleCompletion: function Database_callback_handleCompletion(aReason) {
                if (aReason == Ci.mozIStorageStatementCallback.REASON_CANCELED)
                    return;
                if (onCompletion)
                    onCompletion(this._result, this._error);
            }
        };
    },
    
    _createStatement: function Database__createStatement(query, parameters, asyncStatement) {
        if (!this._connection)
            throw new Error("Can't create statement. Database is closed.");
        let statement = this._connection.createStatement(query);
        if (parameters) {
            for (let name in parameters)
                statement.params[name] = parameters[name];
        }
        
        return statement;
    }
};


Database.DatedValues = function DatedValues(storageFile) {
    this._database = new Database(storageFile, this._consts.INIT_TABLE_QUERY);
    this._storageFile = storageFile;
    this.eraseOldRecords();
}

Database.DatedValues.prototype = {
    get storageFile() this._storageFile && this._storageFile.clone(),
    
    close: function DatedValues_close(callback) {
        this._database.close(
            (
                function() {
                    this._database = null;
                    this._storageFile = null;
                    
                    callback();
                }
            ).bind(this)
        );
    },
    
    
    store: function DatedValues_store(key, value) {
        if ('object' == typeof value)
            value = JSON.stringify(value);
        let storeTime = this._currentTimestampSecs;
        return this._database.execQueryAsync(this._consts.INSERT_QUERY, {
            id: key,
            time: storeTime,
            value: value.toString()
        });
    },
    
    startSearch: function DatedValues_startSearch(key, notOlderThan, callback) {
        let treshold = notOlderThan? (this._currentTimestampSecs - notOlderThan): 0;
        let dbCallback = this._onSearchComplete.bind(this, callback);
        
        return this._database.execQueryAsync(this._consts.SEARCH_QUERY, {id: key, treshold: treshold}, dbCallback);
    },
    
    eraseRecord: function DatedValues_eraseRecord(key) {
        return this._database.execQueryAsync("DELETE FROM resources WHERE (id = :id)", {id: key});
    },
    
    
    eraseOldRecords: function DatedValues_eraseOldRecords() {
        return this._database.execQueryAsync("DELETE FROM resources WHERE (time < :time)", {
            time: (this._currentTimestampSecs - 3600 * 24 * 90)
        });
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
    _storageFile: null,
    
    get _currentTimestampSecs() {
        return parseInt(Date.now() / 1000, 10);
    },
    
    _onSearchComplete: function DatedValues__onSearchComplete(userCallback, rows, storageError) {
        let cachedData;
        let cacheTimestamp;
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

