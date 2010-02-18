/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ClientAlertsApi"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/helpers/apiHelper.js");
Cu.import("resource://ebaycompanion/objects/item.js");
Cu.import("resource://ebaycompanion/objects/transaction.js");
Cu.import("resource://ebaycompanion/datasource.js");
Cu.import("resource://ebaycompanion/apiCoordinator.js");
Cu.import("resource://ebaycompanion/constants.js");

/**
 * Client Alerts API actions
 */
ClientAlertsApi = {

  /**
   * Used to know if we are connected to client alerts
   */
  get connected() {
    return this._sessionId && this._sessionData;
  },

  /**
   * Client Alerts Login
   * @param token Client Alerts Auth token
   * @param callback
   * @returns request object
   */
  login : function(token, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Client Alerts Login call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let parameters = {};

    parameters.ClientAlertsAuthToken = token;

    // do the call
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseLogin(response);
        if (result.sessionId && result.sessionData) {
          // for GetUserAlerts calls
          that._sessionId = result.sessionId;
          that._sessionData = result.sessionData;
        }
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall("Login", parameters, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a Login response
   * @param response
   */
  _parseLogin : function(response, callback) {
    let nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    jsonObject = nativeJSON.decode(response);
    this._detectAndReportErrors(jsonObject);

    let result = {};
    result.sessionId = jsonObject.SessionID;
    result.sessionData = jsonObject.SessionData;
    result.timestamp = jsonObject.Timestamp;

    return result;
  },

  /**
   * Client Alerts GetPublicAlerts
   * @param resultObject the result object to store the retured data
   * @param callback
   * @returns request object
   */
  getPublicAlerts : function(resultObject, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Client Alerts GetPublicAlerts call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    if (!this.connected) {
      Logger.warning("Making Client Alerts GetPublicAlerts call when " +
                     "not logged in to Client Alerts!", Logger.DUMP_STACK);
    }
    let parameters = {};

    if (this._lastPublicUpdateTime) {
      // TODO: We can't use LastRequestTime, because ClientAlerts requires that
      // we call GetPublicAlerts at least once without it for each item, and
      // that's a real headache.  By not specifying one, we get public alerts we
      // don't need, but at least we stay up to date.

      parameters.LastRequestTime = this._lastPublicUpdateTime;
    }

    let items = Datasource.items();
    parameters.ChannelDescriptor = [];
    for each (let [itemId, item] in Iterator(items)) {
      // Only retrieve alerts for active items
      if (!item.get("isEnded")) {
        let channelDescriptor = {};
        channelDescriptor.ChannelID = itemId;
        channelDescriptor.ChannelType = "Item";
        channelDescriptor.EventType = ["ItemEnded", "PriceChange"];
        parameters.ChannelDescriptor.push(channelDescriptor);
      }
    }

    // Abort the call if there's nothing to watch
    if (parameters.ChannelDescriptor.length == 0) {
      Logger.warning("Attempt to make Client Alerts GetPublicAlerts call " +
                     "when there are no items to track!", Logger.DUMP_STACK);
      return;
    }

    // do the call
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetPublicAlerts(response, resultObject);
        if (result.timestamp) {
          that._lastPublicUpdateTime = result.timestamp;
        }
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request =
      this._doCall("GetPublicAlerts", parameters, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetPublicAlerts response
   * @param response the API response
   * @param resultObject the result object to store the retured data
   */
  _parseGetPublicAlerts : function(response, resultObject) {
    let nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    jsonObject = nativeJSON.decode(response);
    this._detectAndReportErrors(jsonObject);

    for (let i = 0; i < jsonObject.Content.length; i++) {
      let channelEvents = jsonObject.Content[i].ChannelEvent;
      for (let j = 0; j < channelEvents.length; j++) {
        let event = channelEvents[j][channelEvents[j].EventType];
        this._processAlert(event, resultObject);
      }
    }

    resultObject.timestamp = jsonObject.Timestamp;

    return resultObject;
  },

  /**
   * Client Alerts GetUserAlerts
   * @param resultObject the result object to store the retured data
   * @param callback
   * @returns request object
   */
  getUserAlerts : function(resultObject, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Client Alerts GetUserAlerts call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    if (!this.connected) {
      Logger.error("Attempt to make Client Alerts GetUserAlerts call when " +
                   "not logged in to Client Alerts!", Logger.DUMP_STACK);
      return;
    }
    let parameters = {};

    parameters.SessionID = this._sessionId;
    parameters.SessionData = this._sessionData;

    // do the call
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetUserAlerts(response, resultObject);
        if (result.sessionData) {
          that._sessionData = result.sessionData;
        }
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request =
      this._doCall("GetUserAlerts", parameters, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetUserAlerts response
   * @param response the API response
   * @param resultObject the result object to store the retured data
   */
  _parseGetUserAlerts : function(response, resultObject) {
    let nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    jsonObject = nativeJSON.decode(response);

    this._detectAndReportErrors(jsonObject);

    let clientAlerts = jsonObject.ClientAlerts;
    if (clientAlerts) {
      let alertEvents = clientAlerts.ClientAlertEvent;
      for (let i = 0; i < alertEvents.length; i++) {
        let eventType = alertEvents[i].EventType;
        // XXX: necessary due to a camel case violation returned by the API
        if (eventType == "OutBid") {
          eventType = "Outbid";
        }
        let event = alertEvents[i][eventType];
        this._processAlert(event, resultObject);
      }
    }

    resultObject.sessionData = jsonObject.SessionData;

    return resultObject;
  },

  /**
   * Returns an empty result object ready to hold information from _processAlert
   */
  emptyResultObject : function() {
    let result = {};
    result.feedbackReceived = false;  // boolean
    result.watchedItems = [];         // ItemIDs
    result.removedItems = [];         // ItemIDs
    result.listedItems = [];          // ItemIDs
    result.bidItems = [];             // ItemIDs
    result.sellItems = [];            // ItemIDs
    result.changedItems = [];         // Partial Item objects
    result.wonItems = [];             // ItemIDs
    result.soldItems = [];            // ItemsIDs
    result.changedTransactions = [];  // Partial Transaction objects

    return result;
  },

  /**
   * Performs appropriate actions for the given Client Alert object
   * @param alertObject the alert object, containing relevant data
   * @param result accumulator object that collects parsed data
   */
  _processAlert : function(alertObject, result) {
    Logger.log("Event: " + alertObject.EventType +
               ", ID: " + alertObject.ItemID);

    // The switch statement doesn't consider each case a block, so 'let' doesn't
    // work as might be expected.
    let itemId
    let item;
    let transaction;
    let feedbackDetail;
    let activeUserId = Datasource.activeAccount().get("userId");

    switch (alertObject.EventType) {
      case "ItemAddedToWatchList":
        itemId = alertObject.ItemID;
        if (!Datasource.items()[itemId]) {
          result.watchedItems.push(itemId);
        }
        // if this event comes in the same response as a previous
        // ItemRemovedFromWatchList event, we should remove the itemId from the
        // removedItems array
        for (var i = 0; i < result.removedItems.length; i++) {
          if (result.removedItems[i] == itemId) {
            result.removedItems.splice(i, 1);
            break;
          }
        }
        break;

      case "ItemRemovedFromWatchList":
        itemId = alertObject.ItemID;
        if (Datasource.items()[itemId]) {
          result.removedItems.push(itemId);
        }
        // if this event comes in the same response as a previous
        // ItemAddedToWatchList event, we should remove the itemId from the
        // watchedItems array
        for (var i = 0; i < result.watchedItems.length; i++) {
          if (result.watchedItems[i] == itemId) {
            result.watchedItems.splice(i, 1);
            break;
          }
        }
        break;

      case "ItemMarkedPaid":
      case "ItemMarkedShipped":
        // We don't get enough data from CA about the new transaction, so we'll
        // call GetMyeBayBuying or GetMyeBaySelling depending on whether this is
        // a won or sold item.
        result.wonItems.push(alertObject.ItemID);
        break;

      case "ItemListed":
        itemId = alertObject.ItemID
        if (!Datasource.items()[itemId]) {
          result.listedItems.push(itemId);
        }
        break;

      case "ItemWon":
        result.wonItems.push(alertObject.ItemID);
        break;

      case "ItemLost":
        result.bidItems.push(alertObject.ItemID);
        break;

      case "ItemSold":
        result.soldItems.push(alertObject.ItemID);
        break;

      case "ItemUnsold":
        result.sellItems.push(alertObject.ItemID);
        break;

      case "BidPlaced":
        result.bidItems.push(alertObject.ItemID);
        break;

      case "BidReceived":
        result.sellItems.push(alertObject.ItemID);
        break;

      case "PriceChange":
        // XXX: We use the price change event only when the item is being
        // watched. In any other case, the price change will be notified
        // through other events, e.g. outbid, bid placed.
        itemId = alertObject.ItemID;
        item = Datasource.items()[itemId];
        if (item.get("userMaxBid") == 0 &&
            !item.get("sellerUserId").toLowerCase() ==
              activeUserId.toLowerCase()) {
          item.set("currentPrice", alertObject.CurrentPrice.Value);
          item.set("numBids", alertObject.BidCount);

          if (alertObject.ReserveMet) {
            item.set("isReserveMet", alertObject.ReserveMet);
          }
          result.changedItems.push(item);

          // For Chinese and Dutch auctions with BIN, a new bid may remove the BIN
          // option.  That information isn't available from CA, so we have to
          // force a GetItem call.

          let listingFormat = item.get("listingFormat");
          let isChineseOrDutch =
            listingFormat == "Chinese" || listingFormat == "Dutch";
          if (item.get("hasBuyItNow") && isChineseOrDutch) {
            result.watchedItems.push(itemId);
          }
        } else {
          // if the user is the seller, add the item to sellItems, else, add it
          // to bidItems
          if (activeUserId.toLowerCase() ==
              alertObject.SellerUserID.toLowerCase()) {
            result.sellItems.push(alertObject.ItemID);
          } else if (item.get("userMaxBid") > 0) {
            result.bidItems.push(alertObject.ItemID);
          }
        }
        break;

      case "OutBid":
        item = new Item(alertObject.ItemID);
        item.set("currentPrice", alertObject.CurrentPrice.Value);
        item.set("numBids", alertObject.BidCount);
        item.set("highBidderId", alertObject.HighBidderUserID);
        result.changedItems.push(item);
        break;

      case "ItemEnded":
        // prepare the item to call getMyeBayBuying or getMyeBaySelling and
        // getItem to update the item properly.
        if (activeUserId.toLowerCase() ==
            alertObject.SellerUserID.toLowerCase()) {
          result.sellItems.push(alertObject.ItemID);
        } else {
          result.bidItems.push(alertObject.ItemID);
        }
        break;

      case "EndOfAuction":
        // there are cases where there is no transaction returned (e.g. a user
        // is outbid and the auction ends), so we have to use the item
        // seller's information.
        if (alertObject.SellerUserID.toLowerCase() ==
            activeUserId.toLowerCase()) {
          result.soldItems.push(alertObject.ItemID);
        } else {
          result.wonItems.push(alertObject.ItemID);
        }
        break;

      case "FixedPriceTransaction":
      case "FixedPriceEndOfTransaction":
        // We don't get enough data from CA about the new transaction, so we'll
        // call GetMyeBayBuying or GetMyeBaySelling depending on whether this is
        // a won or sold item.
        if (alertObject.Transaction) {
          if (alertObject.Transaction[0].BuyerUserID.toLowerCase() ==
              activeUserId.toLowerCase()) {
            result.wonItems.push(alertObject.ItemID);
          } else {
            result.soldItems.push(alertObject.ItemID);
          }
        }
        break;

      case "FeedbackReceived":
        feedbackDetail = alertObject.FeedbackDetail;
        // for some reason the API returns a different transaction id than the
        // one we use internally, so we better call getMyeBayBuying and selling
        // respectively.

        // in this case the feedback uses the role of the counterpart, so the
        // arrays should be switched
        if (feedbackDetail.Role == "Buyer") {
          result.soldItems.push(feedbackDetail.ItemID);
        } else {
          result.wonItems.push(feedbackDetail.ItemID);
        }
        result.feedbackReceived = true;
        break;

      case "FeedbackLeft":
        feedbackDetail = alertObject.FeedbackDetail;
        // for some reason the API returns a different transaction id than the
        // one we use internally, so we better call getMyeBayBuying and selling
        // respectively.

        // in this case the feedback comes from the logged user, so the arrays
        // shouldn't be switched.
        if (feedbackDetail.Role == "Buyer") {
          result.wonItems.push(feedbackDetail.ItemID);
        } else {
          result.soldItems.push(feedbackDetail.ItemID);
        }
        break;

      default:
        Logger.warning("Unrecognised Client Alert: " +
                       "\"" + alertObject.EventType + "\"");
        let nativeJSON =
          Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
        Logger.warning(nativeJSON.encode(alertObject));
        break;
    }
  },

  /**
   * Reports any error messages in the API response
   * @param jsonObject the response
   */
  _detectAndReportErrors : function(jsonObject) {
    let errors = jsonObject.Errors;
    if (errors) {
      for (let i = 0; i < errors.length; i++) {
        let error = errors[i];
        let errorCode = Number(error.ErrorCode);
        switch (errorCode) {
          case 11.3:
            Logger.warning("Client Alerts token has expired; " +
                           "resetting update cycle.");
            ApiCoordinator.disableUpdates();
            ApiCoordinator.enableUpdates();
            break;

          default:
            Logger.error("Client Alerts API Error:\n" + "Error Code: " +
                         errorCode +
                         "\nShort Message: " +
                         String(errors[i].ShortMessage.text()) +
                         "\nSeverity: " +
                         String(errors[i].SeverityCode.text()) +
                         "\nError Clasification: " +
                         String(errors[i].ErrorClassification.text()) + "\n",
                         Logger.DUMP_STACK);
            break;
        }
      }
    }
  },

  /**
   * Performs ClientAlerts API call
   * @param requestName
   * @param parameters object with parameters to add to the call
   * @param callback The callback function
   * @returns request object
   */
  _doCall : function(requestName, parameters, useSandbox, callback) {
    // Flatten the parameters object into a string for inclusion in the URI
    let unflattened = [];
    let parameterString = "";
    for each (let [name, value] in Iterator(parameters)) {
      unflattened.push({name: name, value: value});
    }
    while (unflattened.length > 0) {
      let entry = unflattened.shift();
      if (typeof(entry.value) != "object") {
        // Base type
        parameterString += "&" + entry.name +
                           "=" + encodeURIComponent(entry.value);
      } else {
        if (entry.value.constructor.name == "Array") {
          // Array
          for (let i = 0; i < entry.value.length; i++) {
            let newEntry = {};
            newEntry.name = entry.name + "(" + i + ")";
            newEntry.value = entry.value[i];
            unflattened.splice(i, 0, newEntry);
          }
        } else {
          // Object
          let i = 0;
          for each (let [name, value] in Iterator(entry.value)) {
            let newEntry = {};
            newEntry.name = entry.name + "." + name;
            newEntry.value = value;
            unflattened.splice(i++, 0, newEntry);
          }
        }
      }
    }

    let callDescription = "Client Alerts API " + requestName;

    let apiCallback =
      ApiHelper.generateApiCallback(callDescription, callback);

    if (!ApiHelper.accessService) {
      // The binary component is missing.
      return;
    }
    let siteId = Constants.siteIdForSite(Datasource.homeSite());
    ApiHelper.accessService.setSiteId(siteId);
    ApiHelper.accessService.setApiVersion(627);
    let request =
      ApiHelper.accessService.
        doClientAlertsApiCall(requestName, parameterString, useSandbox,
                              apiCallback);

    ApiHelper.addPendingRequest(request, callDescription);

    return request;
  }
};
