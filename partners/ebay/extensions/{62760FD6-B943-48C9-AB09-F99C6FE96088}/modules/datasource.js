/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Datasource"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");

var Datasource = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import("resource://ebaycompanion/helpers/eventTracker.js");
      Cu.import("resource://ebaycompanion/objects/account.js");
      Cu.import("resource://ebaycompanion/storage/objectsStorage.js");
      Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");
      Cu.import("resource://ebaycompanion/apis/tradingApi.js");
      Cu.import("resource://ebaycompanion/apiCoordinator.js");
      Cu.import("resource://ebaycompanion/alertsGenerator.js");
      Cu.import("resource://ebaycompanion/constants.js");

      // import debugger if debugging is enabled
      if (Constants.prefBranch.get("debugging.enabled")) {
        Cu.import("resource://ebaycompanion/debugger.js");
      }

      this._observers = new Observers;
      let (that = this) {
        this._observers.
          add(function() that._uninit(),
              "quit-application-granted");
        this._observers.
          add(function(subject, topic, data)
                that._markObjectDirty(subject.object),
              "ebay-account-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._markObjectDirty(subject.object),
              "ebay-item-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._markObjectDirty(subject.object),
              "ebay-transaction-property-updated");
        // XXX: this is the necessary observer to catch every http request made
        // from the browser. We will use this to extract the username used
        // when the user signs into the extension.
        this._observers.
          add(function(aSubject, aTopic, aData)
                that._extractSignInUsername(aSubject),
              "http-on-modify-request");
      }

      // Periodically flush dirty objects to storage
      new Timer(let (that = this) function() that._flushDirtyObjects(),
                60 * 1000, Timer.TYPE_REPEATING_PRECISE);

      // Get active account, if one is stored
      this._activeAccount = ObjectsStorage.activeAccount();

      // Members at least need to be sane
      this._items = {};
      this._transactions = {};
      this._favoriteSellers = [];

      let extensionManager =
          Cc["@mozilla.org/extensions/manager;1"].
            getService(Ci.nsIExtensionManager);
      let item =
        extensionManager.getItemForID(Constants.extensionId);

      let currentVersion = Constants.prefBranch.get("version");
      if (currentVersion && currentVersion.match(/^1\.(.)*$/g) &&
          this._activeAccount) {
        // log out any active account to display the T & C change notification
        this.logoutUser();
      }

      // tries to connect the user automatically if the conditions are met
      // (there is an active account and the connectAutomatically flag is true)
      this.tryAutomaticConnect();

    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    try {
      this._flushDirtyObjects();
      this._observers.removeAll();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Extracts the username used when the user submits the sidebar sign in form
   * @param aHTTPRequest
   */
  _extractSignInUsername : function(aHTTPRequest) {
    // most of this code is adapted from TamperData add-on
    aHTTPRequest.QueryInterface(Ci.nsIHttpChannel);
    let headerArray = new Array();
    let url = aHTTPRequest.URI.asciiSpec;
    /* Regular expression used to match the login URL. */
    const AUTH_AUTH_LOGIN_URL_REGEXP =
      /^https:\/\/signin(\.sandbox)?\.ebay(\.\w{2,3}){1,2}\/ws\/eBayISAPI\.dll\?/i;

    let result = url.match(AUTH_AUTH_LOGIN_URL_REGEXP);
    if (result != null && !this.activeAccount()) {

      let visitor = new ecHttpHeaderVisitor(aHTTPRequest);
      // this is necessary to extract all the information from the
      // request
      let requestHeaders = visitor.inspectRequest();
      // here we iterate the request headers if necessary
      /*for each (let [name, value] in Iterator(requestHeaders)) {
        dump(name + ": " + value + "\n");
      }*/
      let postData = visitor.getPostData();
      if (postData) {
        // separate all the pairs name=value
        let parameters = postData.split("&");
        let postParamsArray = new Array();
        for(var i = 0; i < parameters.length; i++) {
          let param = parameters[i].split("=");
          postParamsArray[param[0]] = param[1];
        }
        // set the lastestUsername
        this._latestUsername = postParamsArray["userid"];
        //Logger.log(
        //      "Latest username used to sign in: " + this._latestUsername);
      }
    }
  },

  /**
   * Returns an Auth & Auth URL for login
   * @param sourceAreaName used for rover tracking
   * @param useSandbox boolean
   */
  generateLoginUrl : function(sourceAreaName, useSandbox) {
    let uuidGenerator = Cc["@mozilla.org/uuid-generator;1"].
                          getService(Ci.nsIUUIDGenerator);
    let uuid = String(uuidGenerator.generateUUID());
    uuid = uuid.slice(1, -1); // Remove { and } surrounding UUID

    let runame = Constants.getRuname(useSandbox, this.homeSite());

    // These are custom parameters that are passed back to us after login
    let params = "isSandboxAccount=" + useSandbox;
    let encodedParams = encodeURIComponent(params);

    // Parameters required by the URL template
    let templateArgs = {
      runame :   runame,
      sid :      uuid,
      ruparams : encodedParams
    };

    let url;
    if (!useSandbox) {
      // Production
      url = Constants.getUrl(sourceAreaName, "authAuth", templateArgs);
    } else {
      // Sandbox
      url = Constants.getUrl(sourceAreaName, "authAuthSandbox", templateArgs);
    }

    // Save the UUID for later login
    this._loginSecretId = uuid;

    return url;
  },

  /**
   * Attempts to connect the user automatically if there is an active account
   * and the connectAutomatically flag is set
   */
  tryAutomaticConnect : function() {
    // If there is an active account, get saved items from storage and start
    // the update process
    let connectAutomatically =
      Constants.prefBranch.get("connectAutomatically");
    let activeAccount = this._activeAccount;
    if (activeAccount && connectAutomatically) {
      this._loadDataFromStorage();

      let eventTracker = new EventTracker("Installation and upgrade report");
      let extensionActivated = eventTracker.addCallbackEvent();
      eventTracker.doWhenAllFinished();

      let isSandboxAccount = activeAccount.get("isSandboxAccount");

      let reportInstallCallback =
        let (that = this) function(result) {
          try {
            if (result.error) {
              Logger.warning(
                "Extension installation/activation report reported errors");
            }
            if (result.toolbarId) {
              Logger.log(
                "Installation/Activation reported through API. Returned " +
                "toolbarId: " + result.toolbarId);
              PropertiesStorage.set("ToolbarId", result.toolbarId);
              Constants.prefBranch.set("firstSignIn", false);

              // the report upgrade can be made independently, we don't have to
              // wait for it to complete
              let reportUpgrade = Constants.prefBranch.get("reportUpgrade");
              if (reportUpgrade) {
                let ebayAuthToken = that._activeAccount.get("token");
                let credentialsArray = { eBayAuthToken: ebayAuthToken };

                TradingApi.reportToolbarActivity(
                  "Upgrade", credentialsArray,
                  isSandboxAccount, reportUpgradeCallback);
              }
            }
            // Inform event tracker
            extensionActivated();
          }
          catch (e) {
            Logger.exception(e);
          }
        }

      let reportUpgradeCallback =
        function(result) {
          try {
            if (result.error) {
              Logger.warning("Extension upgrade report reported errors");
            } else {
              Logger.log("Upgrade reported successfully");
            }
            // set the preference to false so we don't send the upgrade request
            // everytime someone signs in
            Constants.prefBranch.set("reportUpgrade", false);
          }
          catch (e) {
            Logger.exception(e);
          }
        }

      // Use timer to start updates after all other initialisation
      new Timer(let (that = this) function() {
        // send the activation request if this is the first time ever signing
        // in
        let firstSignIn = Constants.prefBranch.get("firstSignIn");

        // change the sidebar to the signed in state and enable the updates
        that._loggedIn(firstSignIn);

        if (firstSignIn) {
          let ebayAuthToken = activeAccount.get("token");
          let credentialsArray = { eBayAuthToken: ebayAuthToken };

          let request = TradingApi.reportToolbarActivity(
            "Install", credentialsArray,
            isSandboxAccount, reportInstallCallback);
          // the call failed for some reason
          if (!request) {
            // Inform event tracker
            extensionActivated();
          }
        } else {
          // if this is not the first sign in, check if this is an upgrade
          // and send the upgrade request
          // the report upgrade can be made independently, we don't have to
          // wait for it to complete
          let reportUpgrade = Constants.prefBranch.get("reportUpgrade");
          if (reportUpgrade) {
            let ebayAuthToken = that._activeAccount.get("token");
            let credentialsArray = { eBayAuthToken: ebayAuthToken };

            TradingApi.reportToolbarActivity(
              "Upgrade", credentialsArray,
              isSandboxAccount, reportUpgradeCallback);
          }

          // Inform event tracker
          extensionActivated();
        }

        }, 0);
    } else if (!connectAutomatically) {
      // do as if the user has signed out
      this._activeAccount = null;
      this._latestUsername = null;
      ObjectsStorage.setActiveAccount(null);
    }
  },

  /**
   * Called when user has passed Auth & Auth -- fetches token and starts to
   * fetch data
   * @param username eBay UserId
   * @param isSandboxAccount boolean
   * @param callback function to call when done
   */
  loginUser : function(username, isSandboxAccount, callback) {
    if (!this._loginSecretId) {
      Logger.error("Attempt to login when no Secret ID was generated!",
                   Logger.DUMP_STACK);
      return;
    }

    let eventTracker = new EventTracker("User Login");
    let gotToken = eventTracker.addCallbackEvent();
    let updatedAccount = eventTracker.addCallbackEvent();
    let extensionActivated = eventTracker.addCallbackEvent();
    eventTracker.doWhenAllFinished(callback);

    let tokenCallback =
      let (that = this) function(result) {
        try {
          let token = result.token;
          if (token == "") {
            Logger.error("FetchToken returned an empty token; login aborted.");
            return;
          }
          // Log out if there is an active account
          if (that._activeAccount) {
            that.logoutUser();
          }

          // Try to load account from storage
          let storedAccount =
            ObjectsStorage.getAccount(username, isSandboxAccount);

          // If we have a local copy of the account data, we don't need to do an
          // account update now and can rely on the hard update that immediately
          // follows login
          if (storedAccount) {
            that._activeAccount = storedAccount;
            that._activeAccount.set("token", token);
            // allow feedback score notifications be displayed
            Constants.prefBranch.set(
              "prevent.first.feedback.score.notification", false);
            // Shortcut to account update callback
            accountUpdateCallback(0);
          } else {
            // The account is not stored locally, so we must retrive it from
            // the server and store it locally before we continue the login
            // process.
            that._activeAccount = new Account(username, isSandboxAccount);
            that._activeAccount.set("token", token);
            that._activeAccount.set("registrationSite",   // temporary value
                                    Constants.prefBranch.get("chosenSite"));
            that._activeAccount.set("feedbackRating", 0);
            that._activeAccount.set("numUnreadMessages", 0);
            // set the preference to prevent first display of feedback score
            // change notification when the user is signing in for the first
            // time
            Constants.prefBranch.set(
              "prevent.first.feedback.score.notification", true);
            ApiCoordinator.accountUpdate(accountUpdateCallback);
          }

          // Inform event tracker
          gotToken();
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let accountUpdateCallback =
      let (that = this) function(numErrors) {
        try {
          // We write the account data as it's now up-to-date.
          ObjectsStorage.store(that._activeAccount);
          ObjectsStorage.setActiveAccount(that._activeAccount);
          that._loadDataFromStorage();
          that._loggedIn();
          // send the activation request if this is the first time ever signing
          // in
          let firstSignIn = Constants.prefBranch.get("firstSignIn");
          if (firstSignIn) {
            let ebayAuthToken = that._activeAccount.get("token");
            let credentialsArray = { eBayAuthToken: ebayAuthToken };

            let request = TradingApi.reportToolbarActivity(
              "Install", credentialsArray,
              isSandboxAccount, reportInstallCallback);
            // the call failed for some reason
            if (!request) {
              // Inform event tracker
              extensionActivated();
            }
          } else {
            // if this is not the first sign in, check if this is an upgrade
            // and send the upgrade request
            // the report upgrade can be made independently, we don't have to
            // wait for it to complete
            let reportUpgrade = Constants.prefBranch.get("reportUpgrade");
            if (reportUpgrade) {
              let ebayAuthToken = that._activeAccount.get("token");
              let credentialsArray = { eBayAuthToken: ebayAuthToken };

              TradingApi.reportToolbarActivity(
                "Upgrade", credentialsArray,
                isSandboxAccount, reportUpgradeCallback);
            }

            // Inform event tracker
            extensionActivated();
          }

          // Inform event tracker
          updatedAccount();
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let reportInstallCallback =
      let (that = this) function(result) {
        try {
          if (result.error) {
            Logger.warning(
              "Extension installation/activation report reported errors");
          }
          if (result.toolbarId) {
            Logger.log(
              "Installation/Activation reported through API. Returned " +
              "toolbarId: " + result.toolbarId);
            PropertiesStorage.set("ToolbarId", result.toolbarId);
            Constants.prefBranch.set("firstSignIn", false);

            // the report upgrade can be made independently, we don't have to
            // wait for it to complete
            let reportUpgrade = Constants.prefBranch.get("reportUpgrade");
            if (reportUpgrade) {
              let ebayAuthToken = that._activeAccount.get("token");
              let credentialsArray = { eBayAuthToken: ebayAuthToken };

              TradingApi.reportToolbarActivity(
                "Upgrade", credentialsArray,
                isSandboxAccount, reportUpgradeCallback);
            }
          }
          // Inform event tracker
          extensionActivated();
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let reportUpgradeCallback =
      let (that = this) function(result) {
        try {
          if (result.error) {
            Logger.warning("Extension upgrade report reported errors");
          } else {
            Logger.log("Upgrade reported successfully");
          }
          // set the preference to false so we don't send the upgrade request
          // everytime someone signs in
          Constants.prefBranch.set("reportUpgrade", false);
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    TradingApi.fetchToken(username, isSandboxAccount, this._loginSecretId,
                          tokenCallback);
  },

  /**
   * Called once an account is logged in
   * @param aDisableNotifications whether or not to disable the feedback score
   * notifications. This is optional and used when the user upgrades from 1.6
   * to prevent the automatic login from displaying the feedback score change
   * notifications.
   */
  _loggedIn : function(aDisableNotifications) {
    try {
      let info = {};
      info.object = this._activeAccount;
      Observers.notify(info, "ebay-account-logged-in", null);

      AlertsGenerator.enable();
      ApiCoordinator.enableUpdates();      // Start updating
      if (!aDisableNotifications) {
        // now we allow feedback score notifications be displayed
        Constants.prefBranch.set(
          "prevent.first.feedback.score.notification", false);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Invalidates the active account.
   */
  logoutUser : function() {
    try {
      if (!this._activeAccount) {
        Logger.warning("Attempt to log out when there is no active account.");
        return;
      }

      ApiCoordinator.disableUpdates(); // Stop any further requests
      AlertsGenerator.disable();

      let info = {};
      info.object = this._activeAccount;
      Observers.notify(info, "ebay-account-logged-out", null);

      this._flushDirtyObjects();
      delete this._activeAccount;
      this._activeAccount = null;
      this._latestUsername = null;
      ObjectsStorage.setActiveAccount(null);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Returns the ID of the eBay site that is used for user interaction
   */
  homeSite : function() {
    let siteId;
    if (Constants.prefBranch.get("useRegistrationSite") &&
        this._activeAccount)
    {
      siteId = this._activeAccount.get("registrationSite");
    } else {
      siteId = Constants.prefBranch.get("chosenSite");
    }
    return siteId;
  },

  /**
   * Returns the currently active account
   */
  activeAccount : function() {
    return this._activeAccount;
  },

  /**
   * Sets the active account. ONLY Used when the user upgrades from 1.6
   * @param aAccount the account to be set as active
   */
  setActiveAccount : function(aAccount) {
    this._activeAccount = aAccount;
    ObjectsStorage.setActiveAccount(aAccount);
    // store the account locally since we are sure it is not there
    ObjectsStorage.store(aAccount);
  },

  /**
   * Returns all tracked item objects in a hash list object, hashed by itemId
   */
  items : function() {
    return this._items;
  },

  /**
   * Returns latest username used to sign in to the extension
   */
  latestUsername : function() {
    return this._latestUsername;
  },

  /**
   * Adds an item to the local store, or updates it to match the given item.
   * Notifications are generated to inform listeners that the item has been
   * added or changed.
   * @param item Item object
   */
  addOrUpdateItem : function(item) {
    let itemId = item.get("itemId");
    let dsItem = this._items[itemId];

    if (dsItem) {
      let originalObject = dsItem.copy();
      let objectChanged = dsItem.updateTo(item);
      if (objectChanged) {
        let info = {};
        info.object = dsItem;
        info.originalObject = originalObject;
        Observers.notify(info, "ebay-item-changed", null);
      }
    } else {
      this._items[itemId] = item;
      ObjectsStorage.addItemToAccount(item, this._activeAccount);

      let info = {}
      info.object = item;
      Observers.notify(info, "ebay-item-new", null);
    }
  },

  /**
   * Removes an item from the local store
   * @param item Item object
   */
  removeItem : function(item) {
    let itemId = item.get("itemId");
    if (!itemId) {
      Logger.warning("Empty object passed to removeItem.", Logger.DUMP_STACK);
    }

    // Remove any transactions for the item
    let transactions = this._transactions[itemId];
    if (transactions) {
      for each (let [transactionId, transaction] in Iterator(transactions)) {
        let info = {};
        info.object = transaction;
        Observers.notify(info, "ebay-transaction-removed", null);
      }
      delete this._transactions[itemId];
    }

    let info = {};
    info.object = this._items[itemId];
    Observers.notify(info, "ebay-item-removed", null);

    ObjectsStorage.
      removeItemFromAccount(this._items[itemId], this._activeAccount);
    delete this._items[itemId];
  },

  /**
   * Returns all tracked transaction objects for the given itemId in a hash list
   * object, hashed by transaction Id
   */
  transactions : function(itemId) {
    return this._transactions[itemId];
  },

  /**
   * Adds a transactions to the local store
   * @param transaction Transaction object
   */
  addOrUpdateTransaction : function(transaction) {
    let itemId = transaction.get("itemId");
    let transactionId = transaction.get("transactionId");
    let transactions = this._transactions[itemId];

    if (transactions && transactions[transactionId]) {
      let dsTransaction = transactions[transactionId];
      let originalObject = dsTransaction.copy();
      let objectChanged = dsTransaction.updateTo(transaction);
      if (objectChanged) {
        let info = {};
        info.object = dsTransaction;
        info.originalObject = originalObject;
        Observers.notify(info, "ebay-transaction-changed", null);
      }
    } else {
      if (!transactions) {
        this._transactions[itemId] = [];
        transactions = this._transactions[itemId];
      }
      transactions[transactionId] = transaction;
      ObjectsStorage.store(transaction);

      let info = {};
      info.object = transaction;
      Observers.notify(info, "ebay-transaction-new", null);
    }
  },

  /**
   * Returns all the user's favorite sellers
   */
  favoriteSellers : function() {
    return this._favoriteSellers;
  },

  /**
   * Adds an favorite seller to the local store.
   * @param aFavoriteSeller FavoriteSeller object
   */
  addFavoriteSeller : function(aFavoriteSeller) {
    this._favoriteSellers[this._favoriteSellers.length] = aFavoriteSeller;
    ObjectsStorage.store(aFavoriteSeller);
  },

  /**
   * Deletes all the records in the favorite sellers table and clears the array
   * kept in memory, for the current account
   */
  clearAccountFavoriteSellers : function() {
    this._favoriteSellers = [];
    ObjectsStorage.removeFavoriteSellersFromAccount(this._activeAccount);
  },

  /**
   * Sets the current eBay time, making sure that nothing too funky is happening
   * that could cause visible time-jumps
   */
  setEbayTime : function(claimedTime) {
    // Avoid letting time go backwards
    if (this._lastEbayTime && claimedTime < this._lastEbayTime) {
      return;
    }
    this._lastEbayTime = claimedTime;

    let localTime = Date.now();
    let ebayTime = claimedTime.getTime();
    let offset = ebayTime - localTime;

    this._ebayTimeOffset = offset;
    PropertiesStorage.set("ebayTimeOffset", this._ebayTimeOffset);
  },

  /**
   * Returns the current eBay time as a Date object
   */
  getEbayTime : function() {
    if (!this._ebayTimeOffset) {
      // Retrieve the offset from storage, if it is there
      let storedOffset = PropertiesStorage.get("ebayTimeOffset");
      this._ebayTimeOffset = (storedOffset != null) ? Number(storedOffset) : 0;
    }
    return new Date(Date.now() + this._ebayTimeOffset);
  },

  /**
   * Marks an object (Data Type) for later storage on disk
   * @param object Data Type from objects modules
   */
  _markObjectDirty : function(object) {
    if (!this._dirtyObjects) {
      this._dirtyObjects = [];
    }

    let objectType = object.constructor.name;
    let entry = {};
    entry.type = objectType;

    // The idea here is to produce a key that will be unique for each object,
    // but clash when the same object is marked dirty twice, to avoid it being
    // written to disk several times, and also store enough information to
    // identify the object that should be stored.
    switch (objectType) {
      case "Account":
        let userId = object.get("userId");
        let isSandboxAccount = object.get("isSandboxAccount");
        let key = objectType + "." + userId + "." + isSandboxAccount;
        entry.userId = userId;
        entry.isSandboxAccount = isSandboxAccount;
        this._dirtyObjects[key] = entry;
        break;

      case "Item":
        let itemId = object.get("itemId");
        key = objectType + "." + itemId;
        entry.itemId = itemId;
        this._dirtyObjects[key] = entry;
        break;

      case "Transaction":
        itemId = object.get("itemId");
        let transactionId = object.get("transactionId");
        key = objectType + "." + itemId + "." + transactionId;
        entry.itemId = itemId;
        entry.transactionId = transactionId;
        this._dirtyObjects[key] = entry;
        break;

      default:
        Logger.error("Unable to mark object of type \"" + objectType + "\" " +
                     "as dirty, because it is not a recognised type.",
                     Logger.DUMP_STACK);
    }
  },

  /**
   * Flushes all objects to disk that have been marked as dirty.
   */
  _flushDirtyObjects : function() {
    try {
      if (!this._dirtyObjects) {
        return;
      }

      for each (let [key, entry] in Iterator(this._dirtyObjects)) {
        switch (entry.type) {
          case "Account":
            let account = this._activeAccount;
            if (account) {
              ObjectsStorage.store(account);
            }
            break;

          case "Item":
            let item = this._items[entry.itemId];
            if (item) {
              ObjectsStorage.addItemToAccount(this._items[entry.itemId],
                                            this._activeAccount);
            }
            break;

          case "Transaction":
            let transactions = this._transactions[entry.itemId];
            if (transactions) {
              ObjectsStorage.store(transactions[entry.transactionId]);
            }
            break;

          default:
            Logger.error("Unable to flush dirty object of type " +
                         "\"" + entry.type + "\" because it is not a " +
                         "recognised type.");
        }
        delete this._dirtyObjects[key];
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Loads Item and Transaction objects from storage
   */
  _loadDataFromStorage : function() {
    this._items = [];
    this._transactions = [];
    this._favoriteSellers = [];

    // Load stored items
    let storedItems = ObjectsStorage.itemsForAccount(this._activeAccount);
    for (let i = 0; i < storedItems.length; i++) {
      let itemId = storedItems[i].get("itemId");
      this._items[itemId] = storedItems[i];
    }

    // Load stored transactions
    let storedTransactions =
      ObjectsStorage.transactionsForAccount(this._activeAccount);
    for (let i = 0; i < storedTransactions.length; i++) {
      let transaction = storedTransactions[i];
      let itemId = transaction.get("itemId");
      let transactionId = transaction.get("transactionId");
      if (!this._transactions[itemId]) {
        this._transactions[itemId] = [];
      }
      this._transactions[itemId][transactionId] = transaction;
    }

    this._favoriteSellers =
      ObjectsStorage.favoriteSellersForAccount(this._activeAccount);
  }
};

/**
 * Utilitary class to visit http request headers and extract POST parameters
 */
function ecHttpHeaderVisitor (aHttpChannel) {
  this._httpChannel = aHttpChannel;
  this._requestHeadersArray = new Array();
  this._postBody = null;
}

ecHttpHeaderVisitor.prototype =  {
  /**
   * Returns an instance of the ecPostDataExtractor class that will help us
   * extracting request body
   */
  getPostDataExtractor : function(aHttpChannel) {
    try {
      // "type cast" to nsIUploadChannel so we can process post data
      aHttpChannel.QueryInterface(Ci.nsIUploadChannel);
      let postStream = aHttpChannel.uploadStream;
      // if there is no POST body, there is nothing to do
      if (postStream) {
        // "type cast" nsISeekableStream so we can rewind after extracting the
        // post and prevent the request from stalling
        postStream.QueryInterface(Ci.nsISeekableStream);
        // And return a postData object
        return new ecPostDataExtractor(postStream);
      }
    } catch (ex) {
      Logger.exception("There was an error extracting the POST DATA: " + ex);
    }
    return null;
  },

  /**
   * This method makes this class implement the nsIHttpHeaderVisitor interface,
   * so we can send the class as parameter when we call visitRequestHeaders on
   * any instance of nsIHttpChannel, and extract the header values to our own
   * array
   */
  visitHeader : function(name, value) {
    this._requestHeadersArray[name] = value;
  },

  /**
   * Inspects the requests headers and also extracts its post parameters (if
   * any)
   */
  inspectRequest : function () {
    this._requestHeadersArray = {};
    // first get the request headers
    this._httpChannel.visitRequestHeaders(this);

    // There may be post data in the request
    var postDataExtractor = this.getPostDataExtractor(this._httpChannel);
    if (postDataExtractor) {
      let postBody = postDataExtractor.getPostBody();
      if (postBody !== null) {
        this._postBody = postBody;
      }
    }
    return this._requestHeadersArray;
  },

  getPostData : function() {
    return this._postBody;
  }

};

/**
 * Helper class to extract post data from a request
 */
function ecPostDataExtractor(aStream) {
  // the stream to be processed
  this._stream = aStream;
  // necessary to extract the stream contents
  this._scriptableStream =
    Cc["@mozilla.org/scriptableinputstream;1"].
      createInstance(Ci.nsIScriptableInputStream);
  this._scriptableStream.init(this._stream);
}

ecPostDataExtractor.prototype = {
  // method to go back to the beginning of the stream
  rewind: function() {
    this._stream.seek(0,0);
  },

  /**
   * Extracts the post body from the stream
   */
  getPostBody: function() {
    let streamLength = this._scriptableStream.available();
    let postString = "";
    try {
      // prevent any "NS_BASE_STREAM_CLOSED" thrown occasionally
      for (var i = 0; i < streamLength; i++) {
        let character = this._scriptableStream.read(1);
        character ? postString += character : postString+='\0';
      }
    } catch (ex) {
      return "" + ex;
    } finally {
      this.rewind();
    }
    // get rid of those "\r\n" occurrences in the string
    while (postString.indexOf("\r\n") == (postString.length - 2)) {
      postString = postString.substring(0, postString.length - 2);
    }
    return postString;
  }
};

Datasource._init();
