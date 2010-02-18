/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ActivityLogger"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var ActivityLogger = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/datasource.js");
      Cu.import("resource://ebaycompanion/constants.js");

      // Register observers
      this._observers = new Observers;
      let (that = this) {
        this._observers.
          add(function() that._uninit(),
              "quit-application-granted");

        // Accounts
        this._observers.
          add(function(subject, topic, data)
                that._accountLoggedIn(subject.object),
              "ebay-account-logged-in");
        this._observers.
          add(function(subject, topic, data)
                that._accountPropertyUpdated(subject.object, data),
              "ebay-account-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._accountLoggedOut(subject.object),
              "ebay-account-logged-out");

        // Items
        this._observers.
          add(function(subject, topic, data)
                that._newObject(subject.object),
              "ebay-item-new");
        this._observers.
          add(function(subject, topic, data)
                that._objectPropertyUpdated(subject.object, data),
              "ebay-item-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._objectChanged(subject.object, data),
              "ebay-item-changed");
        this._observers.
          add(function(subject, topic, data)
                that._objectRemoved(subject.object),
              "ebay-item-removed");

        // Transactions
        this._observers.
          add(function(subject, topic, data)
                that._newObject(subject.object),
              "ebay-transaction-new");
        this._observers.
          add(function(subject, topic, data)
                that._objectPropertyUpdated(subject.object, data),
              "ebay-transaction-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._objectRemoved(subject.object),
              "ebay-transaction-removed");
      }

      this._dirtyObjects = [];
      this._postUrl =
        Constants.prefBranch.get("debugging.activityLogger.postUrl");
      this._nativeJSON =
        Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    this._observers.removeAll();
  },

  /**
   * Called when an account is logged in
   * @param account the ObjectHelper-based account object
   */
  _accountLoggedIn : function(account) {
    try {
      let accountCopy = account.copy();
      accountCopy.set("token", "HIDDEN");
      let properties = this._propertiesOfObject(accountCopy);
      this._logEvent(accountCopy, "login", properties);

      // Dump all existing items and transactions
      let items = Datasource.items();
      for (let [itemId, item] in Iterator(items)) {
        // Dump item
        properties = this._propertiesOfObject(item);
        this._logEvent(item, "exists", properties);

        // Dump transactions for item
        let transactions = Datasource.transactions(item.get("itemId"));
        if (transactions) {
          for (let [transactionId, transaction] in Iterator(transactions)) {
            properties = this._propertiesOfObject(transaction);
            this._logEvent(transaction, "exists", properties);
          }
        }
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when an account property has changed
   * @param account The ObjectHelper-based account object
   * @param property Name of the property that changed
   */
  _accountPropertyUpdated : function(account, property) {
    try {
      let properties = {};
      properties[property] = account.get(property);
      this._logEvent(account, "modified", properties);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when an account is logged out
   * @param account the ObjectHelper-based account object
   */
  _accountLoggedOut : function(account) {
    try {
      let properties = {};
      this._logEvent(account, "logout", properties);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when a new item or transaction is being tracked
   * @param object ObjectHelper-based object
   */
  _newObject : function(object) {
    try {
      let properties = this._propertiesOfObject(object);
      this._logEvent(object, "added", properties);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Calls when an object property has changed.  We mark the object as dirty but
   * don't log it until we're told the changes have finished.
   * @see _objectChanged
   * @param object ObjectHelper-based object
   * @param property Name of the property that changed
   */
  _objectPropertyUpdated : function(object, property) {
    try {
      let uniqueKey = this._uniqueKeyFor(object);
      let dirtyEntry = this._dirtyObjects[uniqueKey];
      if (!dirtyEntry) {
        dirtyEntry = {};
        this._dirtyObjects[uniqueKey] = dirtyEntry;
      }
      dirtyEntry[property] = true;
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when an object has finished a set of property changes
   * @param object ObjectHelper-based object
   */
  _objectChanged : function(object) {
    try {
      let uniqueKey = this._uniqueKeyFor(object);
      let dirtyEntry = this._dirtyObjects[uniqueKey];
      if (dirtyEntry) {
        let properties = {};
        for each (let [property,] in Iterator(dirtyEntry)) {
          properties[property] = object.get(property);
        }
        this._logEvent(object, "modified", properties);
        delete this._dirtyObjects[uniqueKey];
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when an item is no longer being tracked
   * @param object ObjectHelper-based object
   */
  _objectRemoved : function(object) {
    try {
      let properties = {};
      let event = this._logEvent(object, "removed", properties);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Returns a key that uniquely identifies the given object within its type
   * (not globally)
   * @param object An ObjectHelper-based object
   * @return a string key
   */
  _uniqueKeyFor : function(object) {
    let key = "";
    switch (object.constructor.name) {
      case "Item":
        key = "" + object.get("itemId");
        break;

      case "Transaction":
        key = "" + object.get("itemId") + "." + object.get("transactionId");
        break;

      case "Account":
        key = object.get("userId");
        break;

      default:
        Logger.error("Unrecognised object type: " + object.constructor.name,
                     Logger.DUMP_STACK);
        key = "ERROR";
    }
    return key;
  },

  /**
   * Returns the properties of the given ObjectHelper-based object in a hash
   * list (with no leading underscores)
   * @param object ObjectHelpe-based object
   */
  _propertiesOfObject : function(object) {
    let properties = {};
    for (let [property, value] in Iterator(object)) {
      properties[property.slice(1)] = value;
    }
    return properties;
  },

  /**
   * Logs an event
   * @param object ObjectHelper-based object relating to the event
   * @param eventName Name to give the event
   * @param properties Hash list of properties (belonging to the object) to log
   */
  _logEvent : function(object, eventName, properties) {
    let out = {};
    out.testClientId = "Firefox";
    out.testUserId = Datasource.activeAccount().get("userId");
    out.timestamp = Date.now();
    out.objectType = object.constructor.name;
    out.uniqueKey = this._uniqueKeyFor(object);
    out.eventName = eventName;
    out.properties = properties;
    this._log(out);
  },

  /**
   * Given a javascript object, converts it to JSON and logs it
   * @param dataObject The object to log
   */
  _log : function(dataObject) {
    let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].
                    createInstance(Ci.nsIXMLHttpRequest);
    request.open("POST", this._postUrl);

    let message = this._nativeJSON.encode(dataObject);

    request.setRequestHeader("Content-Type", "application/json");
    request.send(message);
  }
}

ActivityLogger._init();
