"use strict";
const EXPORTED_SYMBOLS = ["User"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const initPrefsQuery = "CREATE TABLE IF NOT EXISTS prefs (" + " name VARCHAR(255) UNIQUE," + " value VARCHAR(255)," + " userName VARCHAR(255)" + ")";
function User(strUsername) {
    this._name = strUsername.toLowerCase();
    this._database = User._db;
}
User.init = function User_init(api) {
    if (User._initialized) {
        return;
    }
    User._api = api;
    let cacheFile = utils.contentDir;
    cacheFile.append("users.sqlite");
    let database = new Database(cacheFile);
    database.execQuery(initPrefsQuery);
    database.addFunction("regexp", 2, regExpFunc);
    User.__defineGetter__("_db", function () {
        return database;
    });
    User._initialized = true;
};
User.prototype = {
    get name() {
        return this._name;
    },
    _SELECT_PREF_QUERY: "SELECT value FROM prefs WHERE name = :name AND userName = :userName",
    _INSERT_PREF_QUERY: "INSERT INTO prefs (name, value, userName) VALUES (:name, :value, :userName)",
    _UPDATE_PREF_QUERY: "UPDATE prefs SET value = :value WHERE name = :name AND userName = :userName",
    savePref: function User_savePref(strName, value) {
        let pref = this.selectPref(strName);
        let query = typeof pref == "undefined" ? this._INSERT_PREF_QUERY : this._UPDATE_PREF_QUERY;
        this._database.execQuery(query, {
            name: this.name + "###" + strName,
            value: String(value),
            userName: this.name
        });
    },
    selectPref: function User_selectPref(strName) {
        let row = this._database.execQuery(this._SELECT_PREF_QUERY, {
            name: this.name + "###" + strName,
            userName: this.name
        })[0];
        return row && row.value;
    },
    selectPrefInt: function User_selectPrefInt(strName) {
        return parseInt(this.selectPref(strName), 10) || 0;
    },
    _DELETE_FROM_TABLE_QUERY: "DELETE FROM @TABLE WHERE userName = :userName",
    _cleanTable: function User__cleanTable(strTable) {
        let preparedQuery = this._DELETE_FROM_TABLE_QUERY.replace("@TABLE", strTable);
        this._database.execQuery(preparedQuery, { userName: this.name });
    },
    _log: function User__log(msg) {
        User._api.logger.debug(msg);
    }
};
function Database(storageFile, initStatement) {
    if (storageFile) {
        this.open(storageFile, initStatement);
    }
}
Database.prototype = {
    open: function Database_open(storageFile, initStatement) {
        if (!(storageFile instanceof Ci.nsIFile)) {
            throw new TypeError("nsIFile required");
        }
        this.close();
        try {
            this._connectAndInit(storageFile, initStatement);
        } catch (e) {
            Cu.reportError(utils.formatError(e));
            if (this._connection) {
                this._connection.close();
            }
            let journalFile = storageFile.parent;
            journalFile.append(storageFile.leafName + "-journal");
            utils.removeFileSafe(journalFile);
            switch (e.result) {
            case Cr.NS_ERROR_FILE_CORRUPTED:
            case Cr.NS_ERROR_STORAGE_IOERR:
                Cu.reportError("Database: will try to remove corrupt DB file");
                storageFile.remove(false);
                Cu.reportError("Database: corrupt DB file removed");
            }
            this._connectAndInit(storageFile, initStatement);
        }
        this._storageFile = storageFile;
    },
    close: function Database_close(callback) {
        if (this._connection) {
            if ("asyncClose" in this._connection) {
                this._connection.asyncClose(callback ? {
                    complete: function Database_closeComplete() {
                        callback();
                    }
                } : undefined);
            } else {
                this._connection.close();
                if (callback) {
                    callback();
                }
            }
            this._connection = null;
        }
    },
    execQuery: function Database_execQuery(query, parameters) {
        let result = [];
        let statement = this._createStatement(query, parameters);
        try {
            let colNames = [];
            for (let i = statement.columnCount; i--;) {
                colNames.push(statement.getColumnName(i));
            }
            while (statement.executeStep()) {
                let row = {};
                for (let i = colNames.length; i--;) {
                    let colName = colNames[i];
                    row[colName] = statement.row[colName];
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
        let firstResult = this.execQuery(query, parameters)[0];
        if (firstResult) {
            for (let p in firstResult) {
                if (firstResult.hasOwnProperty(p)) {
                    return firstResult[p];
                }
            }
        }
        return;
    },
    execQueryAsync: function Database_execAsync(query, parameters, onCompletion) {
        if (onCompletion && typeof onCompletion != "function") {
            throw new TypeError("Third argument must be a function.");
        }
        let statement = this._createStatement(query, parameters, true);
        try {
            return statement.executeAsync(this._createStmtCallback(statement, onCompletion));
        } finally {
            statement.reset();
            statement.finalize();
        }
    },
    addFunction: function Database_addFunction(name, nParams, utilFunc) {
        if (!this._connection) {
            throw new Error("Can't add function. Database is closed.");
        }
        this._connection.createFunction(name, nParams, utilFunc);
    },
    _connection: null,
    _connectAndInit: function Database__connectAndInit(storageFile, initStatement) {
        this._connection = this._storageService.openDatabase(storageFile);
        if (!this._connection.connectionReady) {
            throw new Error(this._connection.lastError);
        }
        if (initStatement) {
            this.execQuery(initStatement);
        }
    },
    _createStmtCallback: function Database__createStmtCallback(statement, onCompletion) {
        let colNames = [];
        for (let i = 0, len = statement.columnCount; i < len; i++) {
            colNames.push(statement.getColumnName(i));
        }
        let numNames = colNames.length;
        return {
            _result: [],
            _error: undefined,
            handleResult: function Database_callback_handleResult(aResultSet) {
                let row;
                while (row = aResultSet.getNextRow()) {
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
                if (aReason == Ci.mozIStorageStatementCallback.REASON_CANCELED) {
                    return;
                }
                if (onCompletion) {
                    onCompletion(this._result, this._error);
                }
            }
        };
    },
    _createStatement: function Database__createStatement(query, parameters, asyncStatement) {
        if (!this._connection) {
            throw new Error("Can't create statement. Database is closed.");
        }
        let statement = this._connection.createStatement(query);
        if (parameters) {
            for (let name in parameters) {
                statement.params[name] = parameters[name];
            }
        }
        return statement;
    },
    get _storageService() {
        let storageSvc = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
        this.__defineGetter__("_storageService", function Database__getStorageService() {
            return storageSvc;
        });
        return storageSvc;
    }
};
const regExpFunc = {
    onFunctionCall: function (args) {
        let url = args.getString(0);
        let expr = new RegExp(args.getString(1));
        let match = expr.exec(url);
        if (match) {
            let endOfUrl = url.replace(match[0], "");
            if (!endOfUrl || (/^\/$/.test(endOfUrl) || /^\/?#/.test(endOfUrl))) {
                return true;
            }
        }
        return false;
    }
};
const utils = {
    formatError: function utils_formatError(e) {
        if (!(e instanceof Ci.nsIException)) {
            if (typeof e !== "object" || !("name" in e) || !("message" in e)) {
                return String(e);
            }
        }
        let text = e.name + ": " + e.message;
        let fileName = e.fileName || e.filename;
        if (fileName) {
            text += "\nin " + fileName + "@" + e.lineNumber;
        }
        return text;
    },
    removeFileSafe: function FileUtils_removeFileSafe(file) {
        if (!file.exists()) {
            return;
        }
        file = file.clone();
        try {
            file.remove(true);
            if (!file.exists()) {
                return;
            }
        } catch (e) {
            Cu.reportError("Can not remove file [" + file.path + "]\n" + e);
        }
        let trash = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
        trash.append("trash");
        trash.createUnique(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8));
        try {
            file.moveTo(trash, file.leafName);
        } catch (ex1) {
            try {
                file.remove(true);
            } catch (ex2) {
                Cu.reportError(this.formatError(ex2));
            }
        }
        try {
            trash.remove(true);
        } catch (e) {
            Cu.reportError(this.formatError(e));
        }
    },
    get contentDir() {
        let contentDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        contentDir.append("yandex");
        if (!contentDir.exists()) {
            contentDir.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8));
        }
        delete this.contentDir;
        this.__defineGetter__("contentDir", function () {
            return contentDir;
        });
        return contentDir;
    }
};
