/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ApiCoordinator"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var ApiCoordinator = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import("resource://ebaycompanion/helpers/eventTracker.js");
      Cu.import("resource://ebaycompanion/helpers/apiHelper.js");
      Cu.import("resource://ebaycompanion/helpers/itemList.js");
      Cu.import(
        "resource://ebaycompanion/helpers/warningNotificationHelper.js");
      Cu.import("resource://ebaycompanion/objects/item.js");
      Cu.import("resource://ebaycompanion/objects/notification.js");
      Cu.import("resource://ebaycompanion/apis/tradingApi.js");
      Cu.import("resource://ebaycompanion/apis/shoppingApi.js");
      Cu.import("resource://ebaycompanion/apis/clientAlertsApi.js");
      Cu.import("resource://ebaycompanion/datasource.js");
      Cu.import("resource://ebaycompanion/constants.js");

      let that = this;
      this._observers = new Observers;
      this._observers.
        add(function() that._uninit(),
            "quit-application-granted");

      // listen to default site changes to force a hard update for the converted
      // prices to be shown correctly.
      Constants.prefBranch.addObserver(
        function() {
          if (Datasource.activeAccount()) {
            that.hardUpdate();
          }
        },
        "chosenSite");

      this._numActiveUpdates = 0;
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
   * The number of currently active updates
   */
  get numActiveUpdates() {
    return this._numActiveUpdates;
  },

  /**
   * The current client alerts polling rate
   */
  get clientAlertsPollRate() {
    // return the current alerts polling rate if not null or 5 mins if null
    return this._clientAlertsPollRate ? this._clientAlertsPollRate : 5 * 60 * 1000;
  },

  /**
   * Enable updates
   */
  enableUpdates : function() {
    try {
      const HARD_UPDATE_INTERVAL = 1000 * 60 * 60 * 8;
      const SOFT_UPDATE_INTERVAL = 1000 * 60 * 60 * 4;
      let that = this;

      // Disable existing timers before resetting them
      if (this._updatesEnabled) {
        this.disableUpdates();
      }

      // Hard Update
      this._hardUpdateTimer =
        new Timer(function() that.hardUpdate(),
                  HARD_UPDATE_INTERVAL, Timer.TYPE_REPEATING_SLACK);

      // Soft Update
      this._softUpdateTimer =
        new Timer(function() that.softUpdate(), SOFT_UPDATE_INTERVAL,
                  Timer.TYPE_REPEATING_SLACK);

      // Client Alerts
      let callback =
        function(numErrors) {
          if (numErrors > 0) {
            Logger.error("Unable to log in to Client Alerts.");
            return;
          }
          that._clientAlertsTimer =
            new Timer(function() that.clientAlertsUpdate(),
                      that._optimalTimeToNextClientAlertsUpdate());
        }
      this._connectClientAlerts(callback);

      // Maintain list of active items sorted by ending time, so that we can
      // adjust the Client Alerts poll rate as necessary.
      this._itemsByEndingTime = new ItemList();
      this._itemsByEndingTime.filter(function(item) {
                                       return !item.get("isEnded");
                                     });
      this._itemsByEndingTime.sort(function(a, b) {
                                     return a.get("endTime") < b.get("endTime");
                                   });
      this._itemsByEndingTime.
        addListener({
          itemAddedEvent: function(index, itemId) {
            if (index == 0) {
              that._adjustClientAlertsPollPeriod();
            }
          },
          itemRemovedEvent: function(index) {
            if (index == 0) {
              that._adjustClientAlertsPollPeriod();
            }
          }
        });

      // Updates Enabled
      this._updatesEnabled = true;

      // Do hard update straight away
      this.hardUpdate();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Disable updating
   */
  disableUpdates : function() {
    try {
      // Make sure the timers are actually active
      if (!this._updatesEnabled) {
        return;
      }

      // Hard Update
      this._hardUpdateTimer.cancel();

      // Soft Update
      this._softUpdateTimer.cancel();

      // Client Alerts
      // (User may log out before CA has had a chance to log in.)
      if (this._clientAlertsTimer) {
        this._clientAlertsTimer.cancel();
        delete this._clientAlertsToken;
      }

      // Delete any pending requests to avoid data being updated when they
      // return
      ApiHelper.abortPendingRequests();

      // Updates Disabled
      delete this._updatesEnabled;
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Returns the period of time that should elapse before the next Client Alerts
   * update.
   * @returns time in ms
   */
  _optimalTimeToNextClientAlertsUpdate : function() {
    const maxPollingPeriod = 5 * 60 * 1000; // 5 mins
    const minPollingPeriod = 10 * 1000; // 10 secs
    const pollRatio = 0.2; // Poll at this ratio to remaining time (20%)

    let itemEndingSoonest = this._itemsByEndingTime.items[0];
    let pollPeriod;
    if (itemEndingSoonest) {
      let endTime = itemEndingSoonest.get("endTime");
      let ebayTime = Datasource.getEbayTime().getTime();
      let timeLeft = Math.max(0, endTime - ebayTime);
      // Start with ratio, then apply limits
      pollPeriod = Math.round(timeLeft * pollRatio);
      pollPeriod = Math.max(pollPeriod, minPollingPeriod);
      pollPeriod = Math.min(pollPeriod, maxPollingPeriod);
    } else {
      pollPeriod = maxPollingPeriod;
    }

    this._clientAlertsPollRate = pollPeriod;

    return pollPeriod;
  },

  /**
   * Adjusts the Client Alerts polling period, which depends on how soon the
   * next item will end
   */
  _adjustClientAlertsPollPeriod : function() {
    try {
      // Client alerts may not be connected yet, in which case we don't need to
      // adjust anything.
      if (!this._clientAlertsTimer) {
        return;
      }

      let oldPollPeriod = this._clientAlertsTimer.interval;
      let newPollPeriod = this._optimalTimeToNextClientAlertsUpdate();
      if (this._clientAlertsTimer) {
        oldPollPeriod = this._clientAlertsTimer.interval;
      }

      if (newPollPeriod != oldPollPeriod) {
        // Add or remove from the time that's already elapsed since the last
        // update
        let timeSinceLastUpdate = this._clientAlertsTimer.elapsedTime;
        let adjustedPeriod = newPollPeriod - timeSinceLastUpdate;
        adjustedPeriod = Math.max(0, adjustedPeriod);
        this._clientAlertsTimer.cancel();
        this._clientAlertsTimer =
          new Timer(let (that = this) function() that.clientAlertsUpdate(),
                    adjustedPeriod);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Connects and configures the Client Alerts service
   * @param callback
   */
  _connectClientAlerts : function(callback) {
    let eventTracker = new EventTracker("Connect Client Alerts Sequence");
    let notificationsSet = eventTracker.addCallbackEvent();
    let gotAuthToken = eventTracker.addCallbackEvent();
    let loggedIn = eventTracker.addCallbackEvent();
    eventTracker.doWhenAllFinished(callback);

    let errorWatcher = new EventTracker("Connect Client Alerts Calls");
    errorWatcher.doWhenAllFinished(function(numErrors) {
      eventTracker.failRemainingEvents();
    });

    let notificationsCallback =
      function() {
        notificationsSet();
        errorWatcher.addRequest(
          TradingApi.getClientAlertsAuthToken(tokenCallback));
      }
    let tokenCallback =
      function(result) {
        if (!result.token) {
          Logger.error("GetClientAlertsAuthToken returned an empty token.");
          eventTracker.failRemainingEvents();
          return;
        }
        gotAuthToken();
        errorWatcher.addRequest(
          ClientAlertsApi.login(result.token, loginCallback));
      }
    let loginCallback =
      function(result) {
        if (!result.sessionData || !result.sessionId) {
          Logger.error("No SessionData or SessionID returned by Login call");
          eventTracker.failRemainingEvents();
          return;
        }
        loggedIn();
      }
    errorWatcher.addRequest(
      TradingApi.setNotificationPreferences(notificationsCallback));
  },

  /**
   * Called when an update starts
   */
  _updateStarted : function(updateName) {
    this._numActiveUpdates++;
    Observers.notify(null, "ebay-update-started", updateName);
  },

  /**
   * Called when an update finished
   */
  _updateFinished : function(updateName) {
    this._numActiveUpdates--;
    Observers.notify(null, "ebay-update-finished", updateName);
  },

  /**
   * Hard update
   */
  hardUpdate : function(callback) {
    try {
      let that = this;
      this._updateStarted("Hard Update");

      // Using "let" for these seems to produce a race condition or similar.  I
      // get "reserved slot index out of range" now and then.
      var trackedItems = [];
      var localCallback;

      // Track each event so that we can know when we're done
      let hardUpdateTracker = new EventTracker("Hard Update");
      let phaseOneComplete = hardUpdateTracker.addCallbackEvent();
      let phaseTwoComplete = hardUpdateTracker.addCallbackEvent();
      let accountUpdateComplete = hardUpdateTracker.addCallbackEvent();
      hardUpdateTracker.doWhenAllFinished(function(numErrors) {
        that._updateFinished("Hard Update");
        if (callback) {
          callback(numErrors);
        }
      });

      // flag used to know when there where eBay API response errors.
      let apiErrors = false;

      // Phase One involves calling GetMyeBayBuying and GetMyeBaySelling.  When
      // both have returned, we check the items they've returned against the
      // datasource to remove any old items.
      let phaseOneTracker = new EventTracker("Hard Update Phase One");
      phaseOneTracker.doWhenAllFinished(function(numErrors) {
        if (numErrors > 0 || apiErrors) {
          Logger.error("Errors in Hard Update Phase One; " +
                       "skipping removal of old items as the tracked item " +
                       "list is probably incorrect.");
        } else {
          let hashList = {};
          for (let i = 0; i < trackedItems.length; i++) {
            hashList[trackedItems[i].get("itemId")] = true;
          }
          let dsItems = Datasource.items();
          for each (let [itemId, item] in Iterator(dsItems)) {
            if (!hashList[itemId]) {
              Datasource.removeItem(item);
            }
          }
        }
        phaseOneComplete(numErrors);

        // If we're not tracking any items, the phase two tracker doesn't
        // contain any events, so finish phase two directly:
        if (phaseTwoTracker.numPendingEvents() == 0) {
          phaseTwoComplete();
        }
      });

      // Phase Two contains the GetItem calls that are spawned as the Phase One
      // calls return.  We don't wait until both Phase One calls have returned
      // to start on Phase Two -- we start it as soon as the first one returns.
      let phaseTwoTracker = new EventTracker("Hard Update Phase Two");
      phaseTwoTracker.doWhenAllFinished(phaseTwoComplete);

      // GetMyeBayBuying & GetMyeBaySelling
      localCallback =
        function(result) {
          if (result.error) {
            Logger.warning("Hard update reported API errors");
            // we create the sidebar notification to let the user know
            // addToWatchList failed
            let notification =
              new Notification(
                WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);
            notification.set(
              "content", Constants.stringBundle.getString(
                "ecSidebar.notification.error.download"));
            notification.set("priority", 1);
            WarningNotificationHelper.queueNotification(notification);
            // there were API errors
            apiErrors = true;
            return;
          }
          // dismiss any download error notification if we succeed in the
          // subsequent requests
          WarningNotificationHelper.dismissNotification(
            WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);
          let items = result.items;
          let transactions = result.transactions;
          let favoriteSellers = result.favoriteSellers;
          if (favoriteSellers) {
            // delete the favorite sellers for the current account and clear
            // the array kept in memory
            Datasource.clearAccountFavoriteSellers();
            // Update or add favoriteSellers to Datasource
            for (let i = 0; i < favoriteSellers.length; i++) {
              Datasource.addFavoriteSeller(favoriteSellers[i]);
            }
          }

          // Update eBay time
          if (result.timestamp) {
            Datasource.setEbayTime(result.timestamp);
          }

          // Update or add transactions to Datasource
          for (let i = 0; i < transactions.length; i++) {
            Datasource.addOrUpdateTransaction(transactions[i]);
          }

          // GetItem for each item from GetMyeBayBuying and GetMyeBaySelling
          var getItemCallback = function(result) {
            if (!result.item) {
              Logger.warning("GetItem encountered an error, so the associated " +
                             "item will not be updated.");
              return;
            }
            Datasource.addOrUpdateItem(result.item);
          }
          for (let i = 0; i < items.length; i++) {
            let itemId = items[i].get("itemId");
            let dsItem = Datasource.items()[itemId];
            // Call GetItem only if the item is not yet being tracked or if it's
            // still active
            if (!dsItem || !dsItem.get("isEnded")) {
              phaseTwoTracker.addRequest(
                TradingApi.getItem(items[i], getItemCallback));
            } else if (dsItem && dsItem.get("isEnded")) {
              // for ended items stored locally
              // we can update the item so thumbnailUrl gets updated
              Datasource.addOrUpdateItem(items[i]);
            }
          }

          // Keep a list of tracked items for use at the end of Phase One
          trackedItems = trackedItems.concat(items);
        }

      phaseOneTracker.addRequest(
        TradingApi.getMyeBayBuying(localCallback));
      phaseOneTracker.addRequest(
        TradingApi.getMyeBaySelling(localCallback));

      // Update account data
      this.accountUpdate(accountUpdateComplete);
      // adjust client alerts polling rate, to keep it as accurate as possible
      this._adjustClientAlertsPollPeriod();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Soft Update
   */
  softUpdate : function(callback) {
    try {
      let that = this;
      this._updateStarted("Soft Update");

      var localCallback;

      let eventTracker = new EventTracker("Soft Update");
      eventTracker.doWhenAllFinished(function(numErrors) {
        that._updateFinished("Soft Update");
        if (callback) {
          callback(numErrors);
        }
      });

      // GetMyMessages
      localCallback = function(result) {
        Datasource.activeAccount().
          updateProperty("numUnreadMessages", result.numUnreadMessages);
      }
      eventTracker.addRequest(TradingApi.getMyMessages(localCallback));

      // GetMultipleItems
      let items = Datasource.items();
      let itemIds = [];
      for each (let [itemId,] in Iterator(items)) {
        itemIds = itemIds.concat(itemId);
      }
      localCallback = function(result) {
        let items = result.items;
        for (let i = 0; i < items.length; i++) {
          let dsItem = Datasource.items()[items[i].itemId];
          if (!dsItem) {
            Logger.error("ItemId returned by GetMultipleItems is not " +
                         "present in the datasource!", Logger.DUMP_STACK);
          } else {
            dsItem.updateProperty("quantitySold",
                                  items[i].quantitySold);
            dsItem.updateProperty("quantityRemaining",
                                  items[i].quantityRemaining);
          }
        }
      }
      // The call can only manage 20 items at a time
      while (itemIds.length > 0) {
        let itemIdsSubset = itemIds.splice(0, 20);
        eventTracker.addRequest(
          ShoppingApi.getMultipleItems(itemIdsSubset, localCallback));
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Account Update
   * @param callback
   */
  accountUpdate : function(callback) {
    let localCallback;

    let eventTracker = new EventTracker("Account Update");
    eventTracker.doWhenAllFinished(callback);

    let activeAccount = Datasource.activeAccount();

    // GetUserProfile
    localCallback =
      function(result) {
        if (result && result.feedbackRating) {
          // only notify if the feedback rating actually changes
          if (result.feedbackRating != activeAccount.get("feedbackRating")) {
            let info = {};
            info.originalObject = activeAccount.copy();
            activeAccount.updateProperty(
              "feedbackRating", result.feedbackRating);
            info.object = activeAccount;
            // notify to see if we should generate an alert for a new feedback
            // milestone achieved
            Observers.notify(info, "ebay-account-feedback-changed", null);
          }
          activeAccount.
            updateProperty("registrationSite", result.registrationSite);
        } else {
          Logger.warning("getUserProfile API call reported errors when " +
                         "trying to update user feedback score");
        }
      }
    eventTracker.addRequest(ShoppingApi.getUserProfile(localCallback));

    // GetMyMessages
    localCallback =
      function(result) {
        // only notify if the number of unread messages increases
        let info = {};
        info.originalObject = activeAccount.copy();
        activeAccount.updateProperty(
          "numUnreadMessages", result.numUnreadMessages);
        info.object = activeAccount;
        if (result.numUnreadMessages >=
            activeAccount.get("numUnreadMessages")) {
          // notify number of unread messages changed.
          Observers.notify(
            info, "ebay-account-unread-messages-changed", null);
        }
      }
    eventTracker.addRequest(TradingApi.getMyMessages(localCallback));
  },

  /**
   * Client Alerts Update
   */
  clientAlertsUpdate : function(callback) {
    try {
      let that = this;
      this._updateStarted("Client Alerts Update");

      let mainTracker = new EventTracker("Client Alerts Update");
      mainTracker.doWhenAllFinished(function(numErrors) {
        // Set timer for next update
        that._clientAlertsTimer.cancel();  // In case it was reset by updates
        that._clientAlertsTimer =
          new Timer(function() that.clientAlertsUpdate(),
                    that._optimalTimeToNextClientAlertsUpdate());

        that._updateFinished("Client Alerts Update");
        if (callback) {
          callback(numErrors);
        }
      });

      let publicAlertsCallback =
        function(result) {
          try {

            if (result.feedbackReceived) {
              let callback = mainTracker.addCallbackEvent();
              that._updateFeedbackScore(callback);
            }

            if (result.bidItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processBidItems(result.bidItems, callback);
            }

            if (result.sellItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processSellItems(result.sellItems, callback);
            }

            if (result.watchedItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processWatchedItems(result.watchedItems, callback);
            }

            if (result.removedItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processRemovedItems(result.removedItems, callback);
            }

            if (result.listedItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processListedItems(result.listedItems, callback);
            }

            if (result.changedItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processChangedItems(result.changedItems, callback);
            }

            if (result.wonItems.length > 0 || result.soldItems.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processItemsWithNewTransactions(
                result.wonItems, result.soldItems, callback);
            }

            if (result.changedTransactions.length > 0) {
              let callback = mainTracker.addCallbackEvent();
              that._processChangedTransactions(result.changedTransactions,
                                               callback);
            }

          }
          catch (e) {
            Logger.exception(e);
          }
        }

      let userAlertsCallback =
        function(result) {
          // We only want to call GetPublicAlerts if we have active items to track
          let activeItemsExist = false;
          for (let [itemId, item] in Iterator(Datasource.items())) {
            if (!item.get("isEnded")) {
              activeItemsExist = true;
              break;
            }
          }
          // this means we must call public alerts, so make the intermediate
          // connection
          if (activeItemsExist) {
            mainTracker.addRequest(
              ClientAlertsApi.getPublicAlerts(result, publicAlertsCallback));
          } else {
            // call publicAlertsCallback directly
            publicAlertsCallback(result);
          }
        }

      let resultObject = ClientAlertsApi.emptyResultObject();

      mainTracker.addRequest(
        ClientAlertsApi.getUserAlerts(resultObject, userAlertsCallback));

    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Updates the feedback score of the active account by making a GetUserProfile
   * call
   */
  _updateFeedbackScore : function(callback) {
    let tracker = new EventTracker("Update Feedback Score");
    tracker.doWhenAllFinished(callback);

    let activeAccount = Datasource.activeAccount();

    let localCallback = function(result) {
      if (result && result.feedbackRating) {
        // only notify if the feedback rating actually changes
        if (result.feedbackRating != activeAccount.get("feedbackRating")) {
          let info = {};
          info.originalObject = activeAccount.copy();
          activeAccount.updateProperty("feedbackRating", result.feedbackRating);
          info.object = activeAccount;
          // notify to see if we should generate an alert for a new feedback
          // milestone achieved
          Observers.notify(info, "ebay-account-feedback-changed", null);
        }
      } else {
        Logger.warning("getUserProfile API call reported errors when trying " +
                       "to update user feedback score");
      }
    }

    tracker.addRequest(
      ShoppingApi.getUserProfile(localCallback));
  },

  /**
   * Given an array of item IDs, makes the necessary API calls to retrieve
   * complete data about each item, assuming the user has placed a bid on AT
   * LEAST ONE of the items
   */
  _processBidItems : function(bidItems, callback) {
    let mainTracker = new EventTracker("New Bid Items");

    // Initialise hash list of items
    var items = {};
    for (let i = 0; i < bidItems.length; i++) {
      let itemId = bidItems[i];
      items[itemId] = new Item(itemId);
      items[itemId].set("currentPrice", 4);
    }

    // When all GetItem and GetMyeBayBuying calls have returned, the data in the
    // items hash list will be up-to-date, and we can add it to the Datasource
    // (and call the callback)
    mainTracker.doWhenAllFinished(function(numErrors) {
      for (let [itemId, item] in Iterator(items)) {
        Datasource.addOrUpdateItem(item);
      }
      if (callback) {
        callback(numErrors);
      }
    });

    // Call GetItem to get the bulk of data for each item
    let getItemCallback = function(result) {
      let item = result.item;
      if (!item) {
        Logger.warning("GetItem encountered an error, so the associated " +
                       "item will not be updated.");
        return;
      }

      let localItem = items[item.get("itemId")];
      localItem.updateQuietlyTo(item);
    }
    for (let [itemId, item] in Iterator(items)) {
      mainTracker.addRequest(
        TradingApi.getItem(item, getItemCallback));
    }

    // Call GetMyeBayBuying to get the userMaxBid & userQuantityBidFor data
    let getMyeBayBuyingCallback = function(result) {
      if (result.error) {
        Logger.warning("Hard update reported API errors");
        // we create the sidebar notification to let the user know
        // addToWatchList failed
        let notification =
          new Notification(
            WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);
        notification.set(
          "content", Constants.stringBundle.getString(
            "ecSidebar.notification.error.download"));
        notification.set("priority", 1);
        WarningNotificationHelper.queueNotification(notification);
        return;
      }

      // dismiss any download error notification if we succeed in the
      // subsequent requests
      WarningNotificationHelper.dismissNotification(
        WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);

      for (let i = 0; i < result.items.length; i++) {
        let resultItem = result.items[i];
        let item = items[resultItem.get("itemId")];
        if (item) {
          item.updateQuietlyTo(resultItem);
        }
      }
    }
    mainTracker.addRequest(
      TradingApi.getMyeBayBuying(getMyeBayBuyingCallback));
  },

  /**
   * Given an array of item IDs, makes the necessary API calls to retrieve
   * complete data about each item, assuming the user has received a bid on AT
   * LEAST ONE of the items
   */
  _processSellItems : function(sellItems, callback) {
    let mainTracker = new EventTracker("New Sell Items");

    // Initialise hash list of items
    var items = {};
    for (let i = 0; i < sellItems.length; i++) {
      let itemId = sellItems[i];
      items[itemId] = new Item(itemId);
    }

    // When all GetItem and GetMyeBaySelling calls have returned, the data in the
    // items hash list will be up-to-date, and we can add it to the Datasource
    // (and call the callback)
    mainTracker.doWhenAllFinished(function(numErrors) {
      for (let [itemId, item] in Iterator(items)) {
        Datasource.addOrUpdateItem(item);
      }
      if (callback) {
        callback(numErrors);
      }
    });

    // Call GetItem to get the bulk of data for each item
    let getItemCallback = function(result) {
      let item = result.item;
      if (!item) {
        Logger.warning("GetItem encountered an error, so the associated " +
                       "item will not be updated.");
        return;
      }

      let localItem = items[item.get("itemId")];
      localItem.updateQuietlyTo(item);
    }
    for (let [itemId, item] in Iterator(items)) {
      mainTracker.addRequest(
        TradingApi.getItem(item, getItemCallback));
    }

    // Call GetMyeBaySelling
    let getMyeBaySellingCallback = function(result) {
      if (result.error) {
        Logger.warning("Hard update reported API errors");
        // we create the sidebar notification to let the user know
        // addToWatchList failed
        let notification =
          new Notification(
            WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);
        notification.set(
          "content", Constants.stringBundle.getString(
            "ecSidebar.notification.error.download"));
        notification.set("priority", 1);
        WarningNotificationHelper.queueNotification(notification);
        return;
      }

      // dismiss any download error notification if we succeed in the
      // subsequent requests
      WarningNotificationHelper.dismissNotification(
        WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);

      for (let i = 0; i < result.items.length; i++) {
        let resultItem = result.items[i];
        let item = items[resultItem.get("itemId")];
        if (item) {
          item.updateQuietlyTo(resultItem);
        }
      }
    }
    mainTracker.addRequest(
      TradingApi.getMyeBaySelling(getMyeBaySellingCallback));
  },


  /**
   * Given an array of item IDs, makes the necessary API calls to retrieve
   * complete data about each item, assuming the user has NOT placed a bid on
   * ANY of the items
   */
  _processWatchedItems : function(watchedItems, callback) {
    let mainTracker = new EventTracker("New Watched Items");
    mainTracker.doWhenAllFinished(callback);

    // Call GetItem for each new watched item
    let getItemCallback = function(result) {
      let item = result.item;
      if (!item) {
        Logger.warning("GetItem encountered an error, so the associated " +
                       "item will not be updated.");
        return;
      }

      Datasource.addOrUpdateItem(item);
    }

    for (let i = 0; i < watchedItems.length; i++) {
      let item = new Item(watchedItems[i]);
      // The user hasn't bid on these items
      item.set("userMaxBid", 0);
      item.set("userQuantityBidFor", 0);
      item.set("userQuantityWinning", 0);
      mainTracker.addRequest(
        TradingApi.getItem(item, getItemCallback));
    }
  },

  /**
   * Given an array of item IDs, removes each relevant item from the Datasource
   */
  _processRemovedItems : function(removedItems, callback) {
    let mainTracker = new EventTracker("Removed Items");
    mainTracker.doWhenAllFinished(callback);

    // Remove removed items
    for (let i = 0; i < removedItems.length; i++) {
      let dsItem = Datasource.items()[removedItems[i]];
      if (dsItem) {
        Datasource.removeItem(dsItem);
      } else {
        Logger.warning("Client Alerts tried to remove item " + removedItems[i] +
                       ", which isn't being tracked.");
      }
    }

    // Call the callback on return to the event loop as we have no actual
    // asynchronous requests
    new Timer(callback, 0);
  },

  /**
   * Given an array of item IDs, makes the necessary API calls to retrieve
   * complete data about each item, only for newly listed items
   */
  _processListedItems : function(listedItems, callback) {
    let mainTracker = new EventTracker("New Listed Items");
    mainTracker.doWhenAllFinished(callback);

    // Call GetItem for each new watched item
    let getItemCallback = function(result) {
      let item = result.item;
      if (!item) {
        Logger.warning("GetItem encountered an error, so the associated " +
                       "item will not be updated.");
        return;
      }

      Datasource.addOrUpdateItem(item);
    }

    for (let i = 0; i < listedItems.length; i++) {
      let item = new Item(listedItems[i]);
      // The user hasn't bid on these items
      item.set("userMaxBid", 0);
      item.set("userQuantityBidFor", 0);
      item.set("userQuantityWinning", 0);
      mainTracker.addRequest(
        TradingApi.getItem(item, getItemCallback));
    }
  },

  /**
   * Given an array of partial item objects, updates each relevant item in the
   * Datasource with the provided data
   */
  _processChangedItems : function(changedItems, callback) {
    let mainTracker = new EventTracker("Changed Items");
    mainTracker.doWhenAllFinished(callback);

    // Update modified items
    for (let i = 0; i < changedItems.length; i++) {
      let partialItem = changedItems[i];
      let dsItem = Datasource.items()[partialItem.get("itemId")];
      if (dsItem) {
        //keep the thumbnail url
        partialItem.set("thumbnailUrl", dsItem.get("thumbnailUrl"));
        //keep the userQuantityWinning to the current value. This prevents
        // displaying the outbid state when it is not the case
        partialItem.set("userQuantityWinning", dsItem.get("userQuantityWinning"));
        Datasource.addOrUpdateItem(partialItem);
      } else {
        Logger.warning("Tried to update an item that isn't being tracked!",
                       Logger.DUMP_STACK);
      }
    }

    // Call the callback on return to the event loop as we have no actual
    // asynchronous requests
    new Timer(callback, 0);
  },

  /**
   * Given two arrays of ItemIDs, makes the necessary API calls to retrieve
   * Transaction objects assuming the first list are items the user has bought,
   * and the second is items the user has sold.
   */
  _processItemsWithNewTransactions : function(wonItems, soldItems, callback) {
    let mainTracker = new EventTracker("New Transactions and items update");

    // Initialise hash list of items
    // we have to call getItem for each item so we have the latest information
    // of the item and we can display it correctly in the sidebar
    var items = {};
    for (let i = 0; i < wonItems.length; i++) {
      let itemId = wonItems[i];
      items[itemId] = new Item(itemId);
    }
    for (let i = 0; i < soldItems.length; i++) {
      let itemId = soldItems[i];
      items[itemId] = new Item(itemId);
    }

    // When all GetItem and GetMyeBayBuying calls have returned, the data in the
    // items hash list will be up-to-date, and we can add it to the Datasource
    // (and call the callback)
    mainTracker.doWhenAllFinished(function(numErrors) {
      for (let [itemId, item] in Iterator(items)) {
        Datasource.addOrUpdateItem(item);
      }
      if (callback) {
        callback(numErrors);
      }
    });

    let localCallback = function(result) {
      if (result.error) {
        Logger.warning("Hard update reported API errors");
        // we create the sidebar notification to let the user know
        // addToWatchList failed
        let notification =
          new Notification(
            WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);
        notification.set(
          "content", Constants.stringBundle.getString(
            "ecSidebar.notification.error.download"));
        notification.set("priority", 1);
        WarningNotificationHelper.queueNotification(notification);
        return;
      }

      // dismiss any download error notification if we succeed in the
      // subsequent requests
      WarningNotificationHelper.dismissNotification(
        WarningNotificationHelper.HARD_UPDATE_ERROR_WARNING);

      // Update or add transactions to Datasource
      let transactions = result.transactions;
      for (let i = 0; i < transactions.length; i++) {
        Datasource.addOrUpdateTransaction(transactions[i]);
      }
    }

    if (wonItems.length > 0) {
      mainTracker.addRequest(
        TradingApi.getMyeBayBuying(localCallback));
    }
    if (soldItems.length > 0) {
      mainTracker.addRequest(
        TradingApi.getMyeBaySelling(localCallback));
    }

    // Call GetItem to get the bulk of data for each item
    let getItemCallback = function(result) {
      let item = result.item;
      if (!item) {
        Logger.warning("GetItem encountered an error, so the associated " +
                       "item will not be updated.");
        return;
      }

      let localItem = items[item.get("itemId")];
      localItem.updateQuietlyTo(item);
    }
    for (let [itemId, item] in Iterator(items)) {
      mainTracker.addRequest(
        TradingApi.getItem(item, getItemCallback));
    }

  },

  /**
   * Given an array of partial transaction objects, updates each relevant
   * transaction in the Datasource with the provided data
   */
  _processChangedTransactions : function(changedTransactions, callback) {
    let mainTracker = new EventTracker("Changed Transactions");
    mainTracker.doWhenAllFinished(callback);

    // Update modified transactions
    for (let i = 0; i < changedTransactions.length; i++) {
      let partialTrans = changedTransactions[i];
      let itemId = partialTrans.get("itemId");
      let transId = partialTrans.get("transactionId");
      let dsTranses = Datasource.transactions(itemId);
      if (!dsTranses) {
        Logger.warning("Tried to update a transaction whose item isn't being " +
                       "tracked!", Logger.DUMP_STACK);
        continue;
      }
      let dsTrans = dsTranses[transId];
      if (dsTrans) {
        Datasource.addOrUpdateTransaction(partialTrans);
      } else {
        Logger.warning("Tried to update a transaction that isn't being " +
                       "tracked!", Logger.DUMP_STACK);
      }
    }

    // Call the callback on return to the event loop as we have no actual
    // asynchronous requests
    new Timer(callback, 0);
  },

  /**
   * Adds the item with the given itemId to the user's watch list
   * @param itemId ItemID of the item to add
   * @param callback Function that is called when the process is complete
   */
  addToWatchList : function(itemId, callback) {
    try {
      if (Datasource.items()[itemId]) {
        Logger.warning("addToWatchList called for item " + itemId + ", which is " +
                       "already being tracked.");
        return;
      }

      this._updateStarted("Add To Watch List");
      let eventTracker = new EventTracker("Add Item to Watchlist");
      let finishedGettingItem = eventTracker.addCallbackEvent();
      eventTracker.doWhenAllFinished(callback);

      let that = this;
      let localCallback = function(result) {
        that._updateFinished("Add To Watch List");
        if (result.error) {
          Logger.warning(
            "Adding item failed because the API reported an error.");
          // we create the sidebar notification to let the user know
          // addToWatchList failed
          let notification =
            new Notification(
              WarningNotificationHelper.ADD_TO_WATCHLIST_ERROR_WARNING);
          notification.set(
            "content", Constants.stringBundle.getString(
              "ecSidebar.notification.error.addWatch"));
          notification.set("priority", 1);
          WarningNotificationHelper.queueNotification(notification);
          return;
        }
        // Do GetItem call to get item details
        let getItemCallback = function(result) {
          let item = result.item;
          if (!item) {
            Logger.warning("GetItem encountered an error, so the associated " +
                           "item will not be updated.");
            return;
          }

          Datasource.addOrUpdateItem(item);
          // dismiss any add to watchlist error notification if we succeed in
          // the subsequent requests
          WarningNotificationHelper.dismissNotification(
            WarningNotificationHelper.ADD_TO_WATCHLIST_ERROR_WARNING);
          finishedGettingItem();
        }
        let item = new Item(itemId);
        // The user hasn't bid on this item, so we can fill these in right now
        item.set("userMaxBid", 0);
        item.set("userQuantityBidFor", 0);
        item.set("userQuantityWinning", 0);
        TradingApi.getItem(item, getItemCallback);
      }

      eventTracker.addRequest(
        TradingApi.addToWatchList(itemId, localCallback));
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Removes the item with the given itemId from the user's watch list
   * @param itemId ItemID of the item to remove
   * @param callback Function that is called when the process is complete
   */
  removeFromWatchList : function(itemId, callback) {
    try {
      if (!Datasource.items()[itemId]) {
        Logger.warning("removeFromWatchList called for item " + itemId +
                       ", which is not being tracked.");
        return;
      }
      if (Datasource.transactions(itemId)) {
        Logger.warning("removeFromWatchList called for item " + itemId +
                       ", which has tracked transactions.");
        return;
      }

      this._updateStarted("Remove From Watch List");
      let eventTracker = new EventTracker("Remove Item from Watchlist");
      let removedFromDatasource = eventTracker.addCallbackEvent();
      eventTracker.doWhenAllFinished(callback);

      let that = this;
      let localCallback = function(result) {
        that._updateFinished("Remove From Watch List");
        if (result.error) {
          Logger.warning("Skipping removal of the item from " +
                         "datasource because the API reported an error.");
          // we create the sidebar notification to let the user know
          // removeFromWatchList failed
          let notification =
            new Notification(
              WarningNotificationHelper.REMOVE_FROM_WATCHLIST_ERROR_WARNING);
          notification.set(
            "content", Constants.stringBundle.getString(
              "ecSidebar.notification.error.stopWatch"));
          notification.set("priority", 1);
          WarningNotificationHelper.queueNotification(notification);
          return;
        }
        // It's possible that the item was removed before this callback was
        // called
        let item = Datasource.items()[itemId];
        if (item) {
          Datasource.removeItem(item);
        }
        // dismiss any remove from watchlist error notification if we succeed in
        // the subsequent requests
        WarningNotificationHelper.dismissNotification(
          WarningNotificationHelper.REMOVE_FROM_WATCHLIST_ERROR_WARNING);
        removedFromDatasource();
      }

      eventTracker.addRequest(
        TradingApi.removeFromWatchList(itemId, localCallback));
    }
    catch (e) {
      Logger.exception(e);
    }
  }
};

ApiCoordinator._init();
