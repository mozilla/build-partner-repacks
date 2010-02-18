/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["StorageHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var StorageHelper = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");

      this._observers = new Observers;
      let (that = this) {
        this._observers.
          add(function() that._uninit(), "quit-application-granted");
      }

      // Define members
      this._databaseFile = Cc["@mozilla.org/file/directory_service;1"].
                             getService(Ci.nsIProperties).
                             get("ProfD", Ci.nsIFile);
      this._databaseFile.append("ebay-companion.sqlite");
      let databasePreexisted = this._databaseFile.exists();

      this._storageService = Cc["@mozilla.org/storage/service;1"].
                               getService(Ci.mozIStorageService);
      this._databaseConnection =
        this._storageService.openDatabase(this._databaseFile);

      // We need "connection" to be defined before this can be imported
      Cu.import("resource://ebaycompanion/storage/migrations.js");
      Migrations.performMigrations();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    try {
      this._observers.removeAll();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Getter
   */
  get connection() {
    return this._databaseConnection;
  },

  /**
   * Executes a statement on the database, optionally binding the given
   * parameters
   * @param statementText SQL statement; may include ?N-style placeholders
   * @param parameters Array containing the value to bind to the placeholders
   * @returns Array of hash objects, containing the data for each row
   */
  doStatement : function(statementText, parameters) {
    let rows = [];
    let statement = this.connection.createStatement(statementText);
    try {
      if (parameters) {
        for (let i = 0; i < parameters.length; i++) {
          statement.bindUTF8StringParameter(i, parameters[i]);
        }
      }
      while (statement.executeStep()) {
        let row = {};
        for (let i = 0; i < statement.numEntries; i++) {
          let key = statement.getColumnName(i);
          let value = statement.getUTF8String(i);
          row[key] = value;
        }
        rows.push(row);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
    finally {
      statement.reset();
    }

    return rows;
  },

  /**
   * Removes the database (used when uninstalling)
   */
  removeDatabase : function() {
    this._databaseFile.remove(false);
  }
};

StorageHelper._init();
