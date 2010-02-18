/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ObjectsStorage"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/storageHelper.js");
Cu.import("resource://ebaycompanion/objects/account.js");
Cu.import("resource://ebaycompanion/objects/item.js");
Cu.import("resource://ebaycompanion/objects/transaction.js");
Cu.import("resource://ebaycompanion/objects/favoriteSeller.js");
Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");

var ObjectsStorage = {
  // These tables will be created to house the properties of their corresponding
  // objects if those tables don't already exist.
  _tables : [
    {
      objectType : Account,
      tableName : "accounts",
      primaryKeys : ["userId", "isSandboxAccount"]
    },
    {
      objectType : Item,
      tableName : "items",
      primaryKeys : ["itemId"]
    },
    {
      objectType : Transaction,
      tableName : "transactions",
      primaryKeys : ["itemId", "transactionId"]
    },
    {
      objectType : FavoriteSeller,
      tableName : "favoriteSellers",
      primaryKeys : ["userId", "isSandboxAccount", "sellerId"]
    },
    {
      // custom table to specify many-to-many relationship between accounts and
      // items
      tableName : "account_items",
      columns : ["userId", "isSandboxAccount", "itemId"],
      primaryKeys : ["userId", "isSandboxAccount", "itemId"]
    }
  ],

  /**
   * Initialisation
   */
  _init : function() {
    try {
      // check each table exists and create it if necessary
      for (let i = 0; i < this._tables.length; i++) {
        let table = this._tables[i];
        if (!StorageHelper.connection.tableExists(table.tableName)) {

          let schema;
          if (table.objectType) {
            // object table; build schema to suit object's properties
            schema =
              this._buildSchemaForObject(table.objectType, table.primaryKeys);
          } else {
            // custom table; build schema from specified columns
            schema =
              table.columns.join(",") + "," +
              "PRIMARY KEY(" + table.primaryKeys.join(",") + ")";
          }
          StorageHelper.connection.createTable(table.tableName, schema);

        }
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
    for (let i = 0; i < this._tables.length; i++) {
      let statement = "DROP TABLE IF EXISTS #{table}; ";
      statement = statement.replace(/#{table}/g, this._tables[i].tableName);
      StorageHelper.doStatement(statement);
    }
  },

  /**
   * Stores an object of the given type in the corresponding database table
   */
  store : function(object) {
    // Object types map to table names (Item => items etc...)
    let tableName = object.constructor.name.toLowerCase() + "s";
    let objectProperties = object.constructor.prototype.propertyTypes;
    let columnNames = "";
    let numValues = 0;
    let placeholders = "";
    let values = [];
    for each (let [property,] in Iterator(objectProperties)) {
      columnNames += property + ",";
      placeholders += "?" + ++numValues + ",";
      values.push(object.get(property));
    }
    // remove trailing commas
    columnNames = columnNames.slice(0, -1);
    placeholders = placeholders.slice(0, -1);

    let statement =
      "INSERT OR REPLACE INTO #{table} (#{columns}) VALUES (#{placeholders})";
    statement = statement.replace(/#{table}/g, tableName).
                          replace(/#{columns}/g, columnNames).
                          replace(/#{placeholders}/g, placeholders);
    let params = values;
    StorageHelper.doStatement(statement, params);
  },

  /**
   * Returns the account that is marked as active in the database
   */
  activeAccount : function() {
    let accountProperty = PropertiesStorage.get("activeAccount");
    let account;
    if (accountProperty) {
      let statement =
        "SELECT * FROM accounts WHERE userId == ?1 AND isSandboxAccount == ?2";
      let params = accountProperty.split(",");
      let rows = StorageHelper.doStatement(statement, params);
      account = this._accountFromRow(rows[0]);
    }
    return account;
  },

  /**
   * Returns the account specified by username and isSandboxAccount
   * @param username The username for the account to be retrieved
   * @param isSandboxAccount Whether or not the account is a sandbox account
   * @return the relevant account
   */
  getAccount : function(username, isSandboxAccount) {
    let statement =
      "SELECT * FROM accounts WHERE userId == ?1 AND isSandboxAccount == ?2";
    let rows =
      StorageHelper.doStatement(statement, [username, isSandboxAccount]);

    let account;
    if (rows.length > 0) {
      account = this._accountFromRow(rows[0]);
    }

    return account;
  },

  /**
   * Marks the given account as active in the database
   */
  setActiveAccount : function(account) {
    if (account) {
      let userId = account.get("userId");
      let isSandboxAccount = account.get("isSandboxAccount");
      let accountProperty = [userId, isSandboxAccount].join(",");
      PropertiesStorage.set("activeAccount", accountProperty);
    } else {
      PropertiesStorage.remove("activeAccount");
    }
  },

  /**
   * Returns all the accounts stored locally
   * @return the accounts stored locally
   */
  getAllAccounts : function () {
    let statement =
      "SELECT accounts.* FROM accounts";
    let rows = StorageHelper.doStatement(statement);

    let accounts = [];
    for (let i = 0; i < rows.length; i++) {
      accounts.push(this._accountFromRow(rows[i]));
    }

    return accounts;
  },

  /**
   * Connects the given item to the given account.  The account should already
   * be stored in the database, but the item needn't be.
   */
  addItemToAccount : function(item, account) {
    // first, store the item in its own table
    this.store(item);

    // now, add the connection in the relationship table
    let statement =
      "INSERT OR REPLACE INTO account_items " +
        "(userId, isSandboxAccount, itemId) " +
        "VALUES (?1, ?2, ?3)";
    let params = [account.get("userId"),
                  account.get("isSandboxAccount"),
                  item.get("itemId")];
    StorageHelper.doStatement(statement, params);
  },

  /**
   * Disconnects the given item from the given account, and also removes any
   * orphaned items in the items table.
   */
  removeItemFromAccount : function(item, account) {
    let statement =
      "DELETE FROM account_items WHERE " +
        "userId == ?1 AND isSandboxAccount == ?2 AND itemId == ?3";
    let params = [account.get("userId"),
                  account.get("isSandboxAccount"),
                  item.get("itemId")];
    StorageHelper.doStatement(statement, params);

    // The above operation could leave some orphaned items that aren't tied to
    // any account, so we have to clean them up
    statement =
      "DELETE FROM items WHERE itemId NOT IN " +
        "(SELECT itemId FROM account_items)";
    StorageHelper.doStatement(statement);

    // The same is true for transactions
    statement =
      "DELETE FROM transactions WHERE itemId NOT IN " +
        "(SELECT itemId FROM account_items)";
    StorageHelper.doStatement(statement);
  },

  /**
   * Returns the items being tracked by the given account
   */
  itemsForAccount : function(account) {
    let statement =
      "SELECT items.* FROM account_items,items " +
      "WHERE account_items.itemId == items.itemId AND " +
        "userId == ?1 AND isSandboxAccount == ?2";
    let params = [account.get("userId"),
                  account.get("isSandboxAccount")];
    let rows = StorageHelper.doStatement(statement, params);

    let items = [];
    for (let i = 0; i < rows.length; i++) {
      items.push(this._itemFromRow(rows[i]));
    }

    return items;
  },

  /**
   * Returns the transactions for every item being tracked by the given account
   */
  transactionsForAccount : function(account) {
    let statement =
      "SELECT transactions.* FROM account_items,transactions " +
      "WHERE account_items.itemId == transactions.itemId AND " +
        "userId == ?1 AND isSandboxAccount == ?2";
    let params = [account.get("userId"),
                  account.get("isSandboxAccount")];
    let rows = StorageHelper.doStatement(statement, params);

    let transactions = [];
    for (let i = 0; i < rows.length; i++) {
      transactions.push(this._transactionFromRow(rows[i]));
    }

    return transactions;
  },

  /**
   * Returns the favorite sellers of the given account
   */
  favoriteSellersForAccount : function(account) {
    let statement =
      "SELECT favoriteSellers.* FROM favoriteSellers " +
      "WHERE userId == ?1 AND isSandboxAccount == ?2";
    let params = [account.get("userId"),
                  account.get("isSandboxAccount")];
    let rows = StorageHelper.doStatement(statement, params);

    let favoriteSellers = [];
    for (let i = 0; i < rows.length; i++) {
      favoriteSellers.push(this._favoriteSellerFromRow(rows[i]));
    }

    return favoriteSellers;
  },

  /**
   * Removes the favorite sellers related to the given account
   * @param aAccount the account to delete its related favorite sellers
   */
  removeFavoriteSellersFromAccount : function(aAccount) {
    let statement =
      "DELETE FROM favoriteSellers WHERE " +
        "userId == ?1 AND isSandboxAccount == ?2";
    let params = [aAccount.get("userId"),
                  aAccount.get("isSandboxAccount")];
    StorageHelper.doStatement(statement, params);
  },

  /**
   * Creates an object from the given database row
   */
  _accountFromRow : function(row) {
    let account;
    try {
      account = new Account(row.userId, row.isSandboxAccount);
      let propertyTypes = Account.prototype.propertyTypes;
      for (let [property,] in Iterator(propertyTypes)) {
        account.set(property, row[property]);
      }
    }
    catch (e) {
      Logger.error("Unable to create Account object from database row.",
                   Logger.DUMP_STACK);
    }
    return account;
  },

  /**
   * Creates an object from the given database row
   */
  _itemFromRow : function(row) {
    let item;
    try {
      item = new Item(row.itemId);
      let propertyTypes = Item.prototype.propertyTypes;
      for (let [property,] in Iterator(propertyTypes)) {
        item.set(property, row[property]);
      }
    }
    catch (e) {
      Logger.error("Unable to create Item object from database row.",
                   Logger.DUMP_STACK);
    }
    return item;
  },

  /**
   * Creates an object from the given database row
   */
  _transactionFromRow : function(row) {
    let transaction;
    try {
      transaction = new Transaction(row.itemId, row.transactionId);
      let propertyTypes = Transaction.prototype.propertyTypes;
      for (let [property,] in Iterator(propertyTypes)) {
        transaction.set(property, row[property]);
      }
    }
    catch (e) {
      Logger.error("Unable to create Transaction object from database row.",
                   Logger.DUMP_STACK);
    }
    return transaction;
  },

  /**
   * Creates an object from the given database row
   */
  _favoriteSellerFromRow : function(row) {
    let favoriteSeller;
    try {
      favoriteSeller =
        new FavoriteSeller(row.userId, row.isSandboxAccount, row.sellerId);
      let propertyTypes = FavoriteSeller.prototype.propertyTypes;
      for (let [property,] in Iterator(propertyTypes)) {
        favoriteSeller.set(property, row[property]);
      }
    }
    catch (e) {
      Logger.error("Unable to create FavoriteSeller object from database row.",
                   Logger.DUMP_STACK);
    }
    return favoriteSeller;
  },

  /**
   * Builds an SQL schema for a table that will hold the given object's
   * properties.
   * @param object The object (must contain propertyTypes)
   * @param primaryKeys Array of primary keys
   */
  _buildSchemaForObject : function(object, primaryKeys) {
    let schema = "";
    for (let [property, type] in Iterator(object.prototype.propertyTypes)) {
      schema += property + ",";
    }
    schema += "PRIMARY KEY(" + primaryKeys.join(",") + ")";

    return schema;
  }
};

ObjectsStorage._init();
