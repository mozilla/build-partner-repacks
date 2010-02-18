/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["PropertiesStorage"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var PropertiesStorage = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/storageHelper.js");

      // members
      this._tableName = "properties";
      this._columns = ["key", "value"];
      this._primaryKeys = ["key"];

      if (!StorageHelper.connection.tableExists(this._tableName)) {
        let schema = this._columns.join(",") + "," +
                     "PRIMARY KEY(" + this._primaryKeys.join(",") + ")";
        StorageHelper.connection.createTable(this._tableName, schema);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Removes all tables used by this object; used when uninstalling
   */
  removeTables : function() {
    let statement = "DROP TABLE IF EXISTS #{table}; ";
    statement = statement.replace(/#{table}/g, this._tableName);
    StorageHelper.doStatement(statement);
  },

  /**
   * Sets a property in the table
   */
  set : function(key, value) {
    try {
      let statement =
        "INSERT OR REPLACE INTO #{table} (key, value) VALUES (?1, ?2)";
      statement = statement.replace(/#{table}/g, this._tableName);
      let params = arguments;
      StorageHelper.doStatement(statement, params);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Gets a property from the table
   */
  get : function(key) {
    let result;
    try {
      let statement =
        "SELECT value FROM #{table} WHERE key == ?1";
      statement = statement.replace(/#{table}/g, this._tableName);
      let params = arguments;
      let rows = StorageHelper.doStatement(statement, params);
      result = (rows.length > 0) ? rows[0].value : null;
    }
    catch (e) {
      Logger.exception(e);
    }
    return result;
  },

  /**
   * Removes a property from the table
   */
  remove : function(key) {
    try {
      let statement = "DELETE FROM #{table} WHERE key == ?1";
      statement = statement.replace(/#{table}/g, this._tableName);
      let params = arguments;
      StorageHelper.doStatement(statement, params);
    }
    catch (e) {
      Logger.exception(e);
    }
  }
};

PropertiesStorage._init();
