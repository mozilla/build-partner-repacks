/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["TradingApi"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/helpers/apiHelper.js");
Cu.import("resource://ebaycompanion/helpers/informationNotificationHelper.js");
Cu.import("resource://ebaycompanion/objects/account.js");
Cu.import("resource://ebaycompanion/objects/item.js");
Cu.import("resource://ebaycompanion/objects/transaction.js");
Cu.import("resource://ebaycompanion/objects/favoriteSeller.js");
Cu.import("resource://ebaycompanion/objects/notification.js");
Cu.import("resource://ebaycompanion/datasource.js");
Cu.import("resource://ebaycompanion/constants.js");
Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");

/**
 * Trading API actions
 */
TradingApi = {

  /**
   * Reports Toolbar Activity (install/uninstall/upgrade)
   * @param aActivity the activity to be reported
   * @param aCredentialsArray an array with the credentials to be sent with the
   * request
   * @param aUseSandbox whether to use the sandbox or not
   * @param callback Provides token
   */
  reportToolbarActivity : function(
    aActivity, aCredentialsArray, aUseSandbox, aCallback) {

    let toolbarId = PropertiesStorage.get("ToolbarId");
    Logger.log("Reporting toolbar activity: \"" + aActivity + "\" with " +
               "toolbarId: " + toolbarId);

    if (aActivity != "Install" && !toolbarId) {
      Logger.error("Attempt to make Trading API non-install " +
                   "ReportToolbarActivity call when there is no toolbarId " +
                   "stored locally.", Logger.DUMP_STACK);
      return;
    }

    if (aActivity == "Install" && toolbarId) {
      Logger.error("Attempt to make Trading API install " +
                   "ReportToolbarActivity call when there is already a " +
                   "toolbarId stored locally.", Logger.DUMP_STACK);
      return;
    }

    let toolbarIdValue = "";
    if (toolbarId) {
      toolbarIdValue = "<ToolbarID>" + toolbarId + "</ToolbarID>";
    }

    let promptedForUpgrade = "";
    if (aActivity == "Upgrade") {
      promptedForUpgrade = "<PromptedForUpgrade>0</PromptedForUpgrade>";
    }

    let credentials = "";
    for each (let [name, value] in Iterator(aCredentialsArray)) {
      credentials += "<" + name + ">" + value + "</" + name + ">";
    }

    let wrappedBody =
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
      "<ReportToolbarActivityRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">" +
        "<RequesterCredentials>" +
          credentials +
        "</RequesterCredentials>" +
        "<ToolbarVersion>1</ToolbarVersion>" +
        "<Activity>" + aActivity + "</Activity>" +
          toolbarIdValue +
          promptedForUpgrade +
      "</ReportToolbarActivityRequest>";

    let localCallback =
      let(that = this) function(response) {
        let result = that._parseReportToolbarActivityResponse(response);
        try {
          if (aCallback) aCallback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let request = this._doCall(wrappedBody, aUseSandbox, localCallback);

    return request;
  },

  /**
   * Processes a ReportToolbarActivity response
   * @param response
   * @returns toolbar activity response details
   */
  _parseReportToolbarActivityResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    let foundErrors = this._detectAndReportErrors(xmlTree);
    let result = {};

    if (!foundErrors) {
      let toolbarId = xmlTree..ToolbarID;
      if (toolbarId) {
        result.toolbarId = toolbarId;
      }
    } else {
      result.error = foundErrors;
    }

    return result;

  },

  /**
   * Trading API FetchToken
   * @param username The eBay UserID that is being logged in
   * @param isSandboxAccount boolean
   * @param secretId UUID passed to Auth & Auth page (stored in Datasource)
   * @param callback Provides token
   */
  fetchToken : function(username, isSandboxAccount, secretId, callback) {
    let wrappedBody =
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
      "<FetchTokenRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">" +
        "<RequesterCredentials>" +
          "<Username>" + username + "</Username>" +
        "</RequesterCredentials>" +
        "<SecretID>" + secretId + "</SecretID>" +
      "</FetchTokenRequest>";

    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);

        that._detectAndReportErrors(xmlTree);

        let authToken = String(xmlTree.eBayAuthToken.text());
        try {
          if (callback) {
            let result = {};
            result.token = authToken;
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let request = this._doCall(wrappedBody, isSandboxAccount, localCallback);
    return request;
  },

  /**
   * Trading API GetMyeBayBuying
   * @param callback
   * @returns request object
   */
  getMyeBayBuying : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetMyeBayBuying call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    // output selectors
    let outputSelectors = <OutputSelector/>;
    outputSelectors.appendChild(
      "BestOfferList.ItemArray.Item.ItemID," +
      "BestOfferList.ItemArray.Item.PictureDetails.GalleryURL," +
      "WatchList.ItemArray.Item.ItemID," +
      "WatchList.ItemArray.Item.PictureDetails.GalleryURL," +
      "WatchList.ItemArray.Item.SellingStatus.ConvertedCurrentPrice," +
      "LostList.ItemArray.Item.ItemID," +
      "LostList.ItemArray.Item.PictureDetails.GalleryURL," +
      "LostList.ItemArray.Item.SellingStatus.CurrentPrice," +
      "LostList.ItemArray.Item.BiddingDetails.ConvertedMaxBid," +
      "LostList.ItemArray.Item.SellingStatus.ConvertedCurrentPrice," +
      "BidList.ItemArray.Item.ItemID," +
      "BidList.ItemArray.Item.PictureDetails.GalleryURL," +
      "BidList.ItemArray.Item.BiddingDetails," +
      "BidList.ItemArray.Item.SellingStatus.ConvertedCurrentPrice," +
      "BidList.ItemArray.Item.BiddingDetails.ConvertedMaxBid," +
      // ItemID
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.ItemID," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Item.ItemID," +
      // item image
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.PictureDetails.GalleryURL," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Item.PictureDetails.GalleryURL," +
      // item sell price
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.SellingStatus.CurrentPrice," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Item.SellingStatus.CurrentPrice," +
      // item converted max bid
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.BiddingDetails.ConvertedMaxBid," +
      "WonList.OrderTransactionArray.OrderTransaction.Order." +
        "TransactionArray.Transaction.Item.BiddingDetails.ConvertedMaxBid," +
      // item converted current price
      "WonList.OrderTransactionArray.OrderTransaction.Order.TransactionArray." +
        "Transaction.Item.SellingStatus.ConvertedCurrentPrice," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.SellingStatus.ConvertedCurrentPrice," +
      // TransactionID
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.TransactionID," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.TransactionID," +
      // CreatedDate
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.CreatedDate," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.CreatedDate," +
      // QuantityPurchased
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.QuantityPurchased," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.QuantityPurchased," +
      // BuyerPaidStatus
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.BuyerPaidStatus," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.BuyerPaidStatus," +
      // ShippedTime
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.ShippedTime," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.ShippedTime," +
      // FeedbackLeft
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.FeedbackLeft," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.FeedbackLeft," +
      // FeedbackReceived
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Transaction.FeedbackReceived," +
      "WonList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.FeedbackReceived," +
      "FavoriteSellers.FavoriteSeller.StoreName," +
      "FavoriteSellers.FavoriteSeller.UserID"
    );
    innerBody += outputSelectors;

    // item lists
    let activeLists = <><WatchList/><BidList/></>;
    let endedLists = <><WonList/><LostList/></>;
    let favoriteSellersList = <><FavoriteSellers/></>;
    favoriteSellersList.include = true;
    let bestOfferList = <><BestOfferList/></>;
    bestOfferList.DurationInDays = 60;
    for each (let list in endedLists) {
      list.DurationInDays = 60;
    }
    for each (let list in (endedLists + activeLists + bestOfferList)) {
      // XXX: despite http://developer.ebay.com/DevZone/XML/docs/Reference/eBay/GetMyeBayBuying.html
      // says the max value for EntriesPerPage is 200, the API throws errors if
      // we use any value higher than 100
      list.Pagination.EntriesPerPage = 100;
      list.Pagination.PageNumber = 1;
      list.Sort = "EndTime";
    }
    innerBody += activeLists + endedLists + favoriteSellersList + bestOfferList;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetMyeBayBuying", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetMyeBayBuyingResponse(response);
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetMyeBayBuying response
   * @param response
   * @returns Transaction objects and partially-initialised Item objects
   */
  _parseGetMyeBayBuyingResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    let foundErrors = this._detectAndReportErrors(xmlTree);
    let result = {};

    if (!foundErrors) {
      // Extract item IDs from the call (avoiding duplicates)
      let itemIds = [];
      let xmlItemIds = xmlTree..ItemID;
      for each (let xmlItemId in xmlItemIds) {
        // Using this array as a hash list to avoid duplicates
        itemIds[xmlItemId.text()] = true;
      }

      let bestOfferItems = {};
      let xmlBestOfferItems = xmlTree..BestOfferList..Item;
      let hasBestOfferItems = false;
      for each (let xmlItem in xmlBestOfferItems) {
        hasBestOfferItems = true;
        bestOfferItems[xmlItem.ItemID] = xmlItem;
      }

      if (hasBestOfferItems &&
          !Constants.prefBranch.get("warnedAboutBestOffers")) {
        // show best offers not supported warning
        let notification =
          new Notification(
            InformationNotificationHelper.
              BEST_OFFER_NOT_SUPPORTED_NOTIFICATION);
        notification.addLinkCallback(0, function(aEvent){
            let windowMediator =
              Cc["@mozilla.org/appshell/window-mediator;1"].
                getService(Ci.nsIWindowMediator);
            let mostRecentWindow =
              windowMediator.getMostRecentWindow("navigator:browser");
            mostRecentWindow.EbayCompanion.openPage(
              aEvent, 'sidebarNotification', 'myEbay', {});
            InformationNotificationHelper.dismissNotification(
              InformationNotificationHelper.
                BEST_OFFER_NOT_SUPPORTED_NOTIFICATION);
          });
        notification.set(
          "content",
          Constants.stringBundle.getString(
            "ecSidebar.notification.warning.noBestOffer"));
        notification.set("priority", 1);
        InformationNotificationHelper.queueNotification(notification);

        Constants.prefBranch.set("warnedAboutBestOffers", true);
      }

      // Keep an array with the watched items to get their thumbnail image
      let watchedItems = {};
      let xmlWatchedItems = xmlTree..WatchList..Item;
      for each (let xmlItem in xmlWatchedItems) {
        watchedItems[xmlItem.ItemID] = xmlItem;
      }

      // Keep an array with the bid items to get their thumbnail image
      let bidItems = {};
      let xmlBidItems = xmlTree..BidList..Item;
      for each (let xmlItem in xmlBidItems) {
        bidItems[xmlItem.ItemID] = xmlItem;
      }

      // Keep an array with the lost items to get their thumbnail image
      let lostItems = {};
      let xmlLostItems = xmlTree..LostList..Item;
      for each (let xmlItem in xmlLostItems) {
        lostItems[xmlItem.ItemID] = xmlItem;
      }

      // Keep an array with the won items to get their thumbnail image
      let wonItems = {};
      let xmlWonItems = xmlTree..WonList..Item;
      for each (let xmlItem in xmlWonItems) {
        wonItems[xmlItem.ItemID] = xmlItem;
      }

      // For each tracked item, extract necessary information and add to array
      let items = [];
      for (let itemId in itemIds) {
        let item = new Item(Number(itemId));

        // maxBid and bidQuantity will be 0 if they're not applicable
        // thumbnailUrl will be an empty string
        let maxBid = 0;
        let bidQuantity = 0;
        let thumbnailUrl = "";
        let convertedCurrentPrice = 0;
        let convertedCurrentPriceCurrency = 0;
        let convertedMaxBid = 0;
        let convertedMaxBidCurrency = "";

        let xmlItem;

        // The QuantityWon element will not be returned for ended items, but we
        // can infer userQuantityWinning from which list the item was found in
        let quantityWinning = 0;
        // flag used to prevent bestOffer items not returned in watched items
        // list from being added to the items array
        let addItemToArray = true;
        if (bidItems[itemId]) {
          xmlItem = bidItems[itemId];
          maxBid = Number(xmlItem..MaxBid);
          bidQuantity = Number(xmlItem..QuantityBid);
          quantityWinning = Number(xmlItem..QuantityWon);
          convertedCurrentPrice = Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
          convertedMaxBid = Number(xmlItem..ConvertedMaxBid);
          convertedMaxBidCurrency =
            String(xmlItem..ConvertedMaxBid.@currencyID);
        } else if (wonItems[itemId]) {
          xmlItem = wonItems[itemId];
          // Rather over-simplified -- we may be winning more than one, but better
          // than letting it become 0!
          quantityWinning = 1;
          // update currentPrice field for won items
          item.set("currentPrice", xmlItem..CurrentPrice);
          convertedCurrentPrice = Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
          convertedMaxBid = Number(xmlItem..ConvertedMaxBid);
          convertedMaxBidCurrency =
            String(xmlItem..ConvertedMaxBid.@currencyID);
        } else if (lostItems[itemId]) {
          xmlItem = lostItems[itemId];
          // XXX: If the item is not in the BidList, check the lost list to set the
          // userMaxBid and userQuantityBidFor to 1. This is a trick so that the
          // sidebar knows this item is lost.
          maxBid = 1;
          bidQuantity = 1;
          // update currentPrice field for won items
          item.set("currentPrice", xmlItem..CurrentPrice);
          convertedCurrentPrice = Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
          convertedMaxBid = Number(xmlItem..ConvertedMaxBid);
          convertedMaxBidCurrency =
            String(xmlItem..ConvertedMaxBid.@currencyID);
        } else if (watchedItems[itemId]) {
          xmlItem = watchedItems[itemId];
          convertedCurrentPrice = Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
        } else {
          xmlItem = bestOfferItems[itemId];
          addItemToArray = false;
        }

        thumbnailUrl = String(xmlItem..GalleryURL);
        item.set("thumbnailUrl", thumbnailUrl);
        item.set("userMaxBid", maxBid);
        item.set("userQuantityBidFor", bidQuantity);
        item.set("userQuantityWinning", quantityWinning);
        item.set("convertedMaxBid", convertedMaxBid);
        item.set("convertedMaxBidCurrency", convertedMaxBidCurrency);

        if (addItemToArray) {
          items.push(item);
        }

      }

      // Extract transactions from the call
      let transactions = [];
      let xmlTransactions = xmlTree..Transaction;
      for each (let xmlTransaction in xmlTransactions) {
        let itemId = Number(xmlTransaction..ItemID.text());
        let transactionId = Number(xmlTransaction..TransactionID.text());
        let transaction = new Transaction(itemId, transactionId);
        transaction.set("quantityPurchased",
                        Number(xmlTransaction..QuantityPurchased));
        let buyerUserId = Datasource.activeAccount() ?
                            Datasource.activeAccount().get("userId") : "";
        transaction.set("buyerUserId", buyerUserId);

        let paidStatus;
        switch (String(xmlTransaction..BuyerPaidStatus.text())) {
          case "MarkedAsPaid":
          case "PaidWithEscrow":
          case "PaidWithPaisapay":
          case "PaidWithPayPal":
            paidStatus = true;
            break;
          default:
            paidStatus = false;
        }
        transaction.set("isPaidFor", paidStatus);

        let isShipped = xmlTransaction..ShippedTime.length() > 0;
        transaction.set("isShipped", isShipped);
        let feedbackLeft = xmlTransaction..FeedbackLeft.length() > 0;
        transaction.set("userHasSentFeedback", feedbackLeft);
        let feedbackReceivedType = xmlTransaction..FeedbackReceived.CommentType;
        transaction.set("userHasReceivedFeedback",
                        feedbackReceivedType.length() > 0);
        transaction.set("feedbackReceivedType", String(feedbackReceivedType));

        let createdDate =
          Constants.dateFromIso8601(xmlTransaction..CreatedDate).getTime();
        transaction.set("creationTime", createdDate);
        transactions.push(transaction);
      }

      // Extract favorite sellers from the call (if any)
      let favoriteSellers = [];
      let xmlFavoriteSellers = xmlTree..FavoriteSeller;
      let activeAccount = Datasource.activeAccount();
      for each (let xmlFavoriteSeller in xmlFavoriteSellers) {
        let sellerId = String(xmlFavoriteSeller.. UserID.text());
        let storeName = String(xmlFavoriteSeller..StoreName.text());
        let favoriteSeller =
          new FavoriteSeller(
            activeAccount.get("userId"),
            activeAccount.get("isSandboxAccount"),
            sellerId);
        favoriteSeller.set("storeName", storeName);
        favoriteSellers.push(favoriteSeller);
      }

      // Extract the timestamp (used for tracking eBay time)
      let timestampText = String(xmlTree.Timestamp.text());
      let timestamp = Constants.dateFromIso8601(timestampText);

      result.items = items;
      result.transactions = transactions;
      result.timestamp = timestamp;
      result.favoriteSellers = favoriteSellers;
    } else {
      result.error = foundErrors;
    }

    return result;
  },

  /**
   * Trading API GetMyeBaySelling
   * @param callback
   * @returns request object
   */
  getMyeBaySelling : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetMyeBaySelling call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    // output selectors
    let outputSelectors = <OutputSelector/>;
    outputSelectors.appendChild(
      "ActiveList.ItemArray.Item.ItemID," +
      "ActiveList.ItemArray.Item.PictureDetails.GalleryURL," +
      "ActiveList.ItemArray.Item.SellingStatus.ConvertedCurrentPrice," +
      "SoldList.ItemArray.Item.ItemID," +
      "UnsoldList.ItemArray.Item.ItemID," +
      "UnsoldList.ItemArray.Item.PictureDetails.GalleryURL," +
      // Unsold converted price
      "UnsoldList.ItemArray.Item.SellingStatus.ConvertedCurrentPrice," +
      // ItemID
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.ItemID," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Item.ItemID," +
      // item image
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.PictureDetails.GalleryURL," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Item.PictureDetails.GalleryURL," +
      // TransactionID
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.TransactionID," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.TransactionID," +
      // Sold item converted price
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Item.SellingStatus.ConvertedCurrentPrice," +
      "SoldList.OrderTransactionArray.OrderTransaction.Order.TransactionArray." +
        "Transaction.Item.SellingStatus.ConvertedCurrentPrice," +
      // CreatedDate
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.CreatedDate," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.CreatedDate," +
      // QuantityPurchased
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.QuantityPurchased," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.QuantityPurchased," +
      // BuyerUserId
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.Buyer.UserID," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.Buyer.UserID," +
      // SellerPaidStatus
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.SellerPaidStatus," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.SellerPaidStatus," +
      // ShippedTime
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.ShippedTime," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.ShippedTime," +
      // FeedbackLeft
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.FeedbackLeft," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.FeedbackLeft," +
      // FeedbackReceived
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Transaction.FeedbackReceived," +
      "SoldList.OrderTransactionArray.OrderTransaction." +
        "Order.TransactionArray.Transaction.FeedbackReceived"
    );
    innerBody += outputSelectors;

    // item lists
    let activeLists = <><ActiveList/></>;
    let endedLists = <><SoldList/><UnsoldList/></>;
    for each (let list in endedLists) {
      list.DurationInDays = 60;
    }
    for each (let list in (endedLists + activeLists)) {
      list.Pagination.EntriesPerPage = 200;
      list.Pagination.PageNumber = 1;
      list.Sort = "EndTime";
    }
    innerBody += activeLists + endedLists;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetMyeBaySelling", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetMyeBaySellingResponse(response);
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetMyeBaySelling response
   * @param response
   * @returns Transaction objects and partially-initialised Item objects
   */
  _parseGetMyeBaySellingResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);


    let foundErrors = this._detectAndReportErrors(xmlTree);
    let result = {};

    if (!foundErrors) {
      // Extract item IDs from the call (avoiding duplicates)
      let itemIds = [];
      let xmlItemIds = xmlTree..ItemID;
      for each (let xmlItemId in xmlItemIds) {
        // Using this array as a hash list to avoid duplicates
        itemIds[xmlItemId.text()] = true;
      }

      // Keep an array with the active items to get their thumbnail image
      let activeItems = {};
      let xmlActiveItems = xmlTree..ActiveList..Item;
      for each (let xmlItem in xmlActiveItems) {
        activeItems[xmlItem.ItemID] = xmlItem;
      }

      // Keep an array with the sold items to get their thumbnail image
      let soldItems = {};
      let xmlSoldItems = xmlTree..SoldList..Item;
      for each (let xmlItem in xmlSoldItems) {
        soldItems[xmlItem.ItemID] = xmlItem;
      }

      // Keep an array with the unsold items to get their thumbnail image
      let unsoldItems = {};
      let xmlUnsoldItems = xmlTree..UnsoldList..Item;
      for each (let xmlItem in xmlUnsoldItems) {
        unsoldItems[xmlItem.ItemID] = xmlItem;
      }

      // For each tracked item, extract necessary information and add to array
      let items = [];
      for (let itemId in itemIds) {
        let item = new Item(Number(itemId));
        item.set("userMaxBid", 0);
        item.set("userQuantityBidFor", 0);

        let thumbnailUrl = "";
        let convertedCurrentPrice = 0;
        let convertedCurrentPriceCurrency = "";

        if (activeItems[itemId]) {
          xmlItem = activeItems[itemId];
          convertedCurrentPrice =
            Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
        } else if (soldItems[itemId]) {
          xmlItem = soldItems[itemId];
          convertedCurrentPrice =
            Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
        } else if (unsoldItems[itemId]) {
          xmlItem = unsoldItems[itemId];
          convertedCurrentPrice =
            Number(xmlItem..ConvertedCurrentPrice);
          convertedCurrentPriceCurrency =
            String(xmlItem..ConvertedCurrentPrice.@currencyID);
        }
        thumbnailUrl = String(xmlItem..GalleryURL);
        item.set("thumbnailUrl", thumbnailUrl);
        item.set("convertedCurrentPrice", convertedCurrentPrice);
        item.set("convertedCurrentPriceCurrency", convertedCurrentPriceCurrency);

        items.push(item);
      }

      // Extract transactions from the call
      let transactions = [];
      let xmlTransactions = xmlTree..Transaction;
      for each (let xmlTransaction in xmlTransactions) {
        let itemId = Number(xmlTransaction..ItemID.text());
        let transactionId = Number(xmlTransaction..TransactionID.text());
        let transaction = new Transaction(itemId, transactionId);
        transaction.set("quantityPurchased",
                        Number(xmlTransaction..QuantityPurchased));
        transaction.set("buyerUserId", xmlTransaction..Buyer.UserID.toString());

        let paidStatus;
        switch (String(xmlTransaction..SellerPaidStatus.text())) {
          case "MarkedAsPaid":
          case "PaidWithEscrow":
          case "PaidWithPaisapay":
          case "PaidWithPayPal":
            paidStatus = true;
            break;
          default:
            paidStatus = false;
        }
        transaction.set("isPaidFor", paidStatus);

        let isShipped = xmlTransaction..ShippedTime.length() > 0;
        transaction.set("isShipped", isShipped);
        let feedbackLeft = xmlTransaction..FeedbackLeft.length() > 0;
        transaction.set("userHasSentFeedback", feedbackLeft);
        let feedbackReceivedType = xmlTransaction..FeedbackReceived.CommentType;
        transaction.set("userHasReceivedFeedback",
                        feedbackReceivedType.length() > 0);
        transaction.set("feedbackReceivedType", String(feedbackReceivedType));

        let createdDate =
          Constants.dateFromIso8601(xmlTransaction..CreatedDate).getTime();
        transaction.set("creationTime", createdDate);
        transactions.push(transaction);
      }

      result.items = items;
      result.transactions = transactions;

    } else {
      result.error = foundErrors;
    }

    return result;
  },

  /**
   * Trading API GetItem
   * @param item The Item object to update
   * @param callback
   * @returns request object
   */
  getItem : function(item, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetItem call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    // output selectors
    let outputSelectors = <OutputSelector/>;
    outputSelectors.appendChild(
      "Item.BuyItNowPrice," +
      "Item.Country," +
      "Item.HitCount," +
      "Item.HitCounter," +
      "Item.ItemID," +
      "Item.ListingDetails.BuyItNowAvailable," +
      "Item.ListingDetails.EndTime," +
      "Item.ListingDetails.StartTime," +
      "Item.ListingDetails.RelistedItemID," +
      "Item.ListingType," +
      "Item.PictureDetails.GalleryURL," +
      "Item.Quantity," +
      "Item.Seller.FeedbackScore," +
      "Item.Seller.UserID," +
      "Item.Seller.PositiveFeedbackPercent," +
      "Item.SellingStatus.BidCount," +
      "Item.SellingStatus.CurrentPrice," +
      "Item.SellingStatus.QuantitySold," +
      "Item.SellingStatus.ReserveMet," +
      "Item.SellingStatus.HighBidder.UserID," +
      "Item.SellingStatus.HighBidder.FeedbackScore," +
      "Item.SellingStatus.ConvertedCurrentPrice," +
      "Item.ShippingTermsInDescription," +
      "Item.ShipToLocations," +
      "Item.ShippingDetails." +
        "InternationalShippingServiceOption.ShippingServiceCost," +
      "Item.ShippingDetails." +
        "InternationalShippingServiceOption.ShipToLocation," +
      "Item.ShippingDetails." +
        "ShippingServiceOptions.ShippingServiceCost," +
      "Item.ShippingDetails.ShippingType," +
      "Item.TimeLeft," +
      "Item.Title," +
      "Item.WatchCount"
    );
    innerBody += outputSelectors;

    // item lists
    innerBody += <IncludeWatchCount>true</IncludeWatchCount>;
    innerBody += <ItemID>{item.get("itemId")}</ItemID>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetItem", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        item = that._parseGetItemResponse(item, response);
        try {
          if (callback) {
            let result = {};
            result.item = item;
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetItem response
   * @param item the Item object to modify
   * @param response
   * @returns A fully initialised Item object
   */
  _parseGetItemResponse : function(item, response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    let foundErrors = this._detectAndReportErrors(xmlTree);
    if (foundErrors) {
      // The returned item will be null
      return;
    }

    let itemId = xmlTree..ItemID.text();
    item.set("title", String(xmlTree..Title));
    item.set("sellerUserId", String(xmlTree..Seller.UserID));
    item.set("isEnded", xmlTree..TimeLeft == "PT0S" ? true : false);
    item.set("listingFormat", String(xmlTree..ListingType));
    item.set("currentPrice", Number(xmlTree..SellingStatus.CurrentPrice));
    item.set("currency",
             String(xmlTree..SellingStatus.CurrentPrice.@currencyID));
    item.set("quantitySold", Number(xmlTree..SellingStatus.QuantitySold));
    item.set("imageUrl", String(xmlTree..PictureDetails.GalleryURL));
    let pageViews = Number(xmlTree..HitCount);
    // XXX: for some reason the API alternates the hitCount value between the
    // real value and -1, so prevent -1 values from being set
    if (pageViews > -1) {
      item.set("pageViews", pageViews);
    }
    item.set("hitCounterType", String(xmlTree..HitCounter));
    item.set("numBids", Number(xmlTree..SellingStatus.BidCount));
    item.set("isReserveMet", xmlTree..SellingStatus.ReserveMet == "true");
    item.set("sellerFeedbackRating", Number(xmlTree..Seller.FeedbackScore));
    item.set("sellerFeedbackPercent",
             Number(xmlTree..Seller.PositiveFeedbackPercent));
    item.set("numWatching", Number(xmlTree..WatchCount));
    item.set("relistedItemId", Number(xmlTree..RelistedItemID));

    item.set("highBidderId", String(xmlTree..SellingStatus.HighBidder.UserID));
    item.set("highBidderFeedbackScore",
             Number(xmlTree..SellingStatus.HighBidder.FeedbackScore));

    // We split shipping options into local and international, but just take the
    // first option out of those remaining.  We don't currently deal with
    // constraints such as regions.
    let itemCountry = String(xmlTree.Item.Country);
    let localCountry =
      Constants.countryIso3166ForSite(Datasource.homeSite());
    let localOptions = xmlTree..ShippingServiceOptions;
    let intlOptions = xmlTree..InternationalShippingServiceOption;
    let shippingOptions = localOptions;

    if (itemCountry != localCountry && intlOptions.length() > 0) {
      shippingOptions = intlOptions;
    }
    let shippingCost = 0;

    if (shippingOptions.length() >= 1) {
      shippingCost = Number(shippingOptions[0].ShippingServiceCost);
    }
    item.set("shippingCost", shippingCost);
    // set the rest of the shipping information fields
    item.set(
      "shippingTermsInDescription",
      xmlTree.Item.ShippingTermsInDescription.text() == "true");
    item.set("shipToLocations", String(xmlTree.Item.ShipToLocations));
    item.set("shippingType", String(xmlTree..ShippingType));

    // quantitySold
    let quantity = Number(xmlTree..Quantity);
    item.set("quantityRemaining", quantity - item.get("quantitySold"));

    // startTime and endTime
    let startTime =
      Constants.dateFromIso8601(xmlTree..ListingDetails.StartTime).getTime();
    let endTime =
      Constants.dateFromIso8601(xmlTree..ListingDetails.EndTime).getTime();
    item.set("startTime", startTime);
    item.set("endTime", endTime);

    // hasBuyItNow and buyItNowPrice
    let hasBuyItNow;
    let buyItNowPrice;
    switch (item.get("listingFormat")) {
      case "Chinese":
      case "Dutch":
        buyItNowPrice = Number(xmlTree..BuyItNowPrice);
        if (buyItNowPrice == 0) {
          hasBuyItNow = false;
        } else {
          hasBuyItNow =
            xmlTree..ListingDetails.BuyItNowAvailable.text() == "true";
        }
        break;
      default:
        hasBuyItNow = true;
        buyItNowPrice = item.get("currentPrice");
    }
    item.set("hasBuyItNow", hasBuyItNow);
    item.set("buyItNowPrice", buyItNowPrice);
    item.set("convertedCurrentPrice",
      Number(xmlTree..SellingStatus.ConvertedCurrentPrice));
    item.set("convertedCurrentPriceCurrency",
      String(xmlTree..SellingStatus.ConvertedCurrentPrice.@currencyID));

    return item;
  },

  /**
   * Trading API GetMyMessages
   * @param callback
   * @returns request object
   */
  getMyMessages : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetMyMessages call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    // output selectors
    let outputSelectors = <OutputSelector/>;
    outputSelectors.appendChild(
      "Messages.Message.Read"
    );
    innerBody += outputSelectors;

    // add detail level
    innerBody += <DetailLevel>ReturnHeaders</DetailLevel>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetMyMessages", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let numUnreadMessages = that._parseGetMyMessagesResponse(response);
        try {
          if (callback) {
            let result = {};
            result.numUnreadMessages = numUnreadMessages;
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetMyMessages response
   * @param response
   * @returns number of unread messages
   */
  _parseGetMyMessagesResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    this._detectAndReportErrors(xmlTree);

    let messages = xmlTree..Message;
    let alerts = xmlTree..Alert;
    let numUnread = 0;

    // XXX: this kind of sintax doesn't work on FF3.5
    // let numUnread = xmlTree..Message.(Read == "false").length();
    // so we have to iterate the array manually to guarantee the right values
    for (var i = 0; i < messages.length(); i++) {
      if(messages[i].Read == "false") {
        numUnread++;
      }
    }
    // count alerts as messages too
    for (var i = 0; i < alerts.length(); i++) {
      if(alerts[i].Read == "false") {
        numUnread++;
      }
    }

    return numUnread;
  },

  /**
   * Trading API GetClientAlertsAuthToken
   * @param callback Provides token
   * @returns request object
   */
  getClientAlertsAuthToken : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetClientAlertsAuthToken " +
                   "call when no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("GetClientAlertsAuthToken", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);

        that._detectAndReportErrors(xmlTree);

        let authToken = String(xmlTree.ClientAlertsAuthToken.text());
        try {
          if (callback) {
            let result = {};
            result.token = authToken;
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Trading Api SetNotificationPreferences
   * @param callback
   * @returns request object
   */
  setNotificationPreferences : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API SetNotificationPreferences " +
                   "call when no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    let notifications = [
      "ItemAddedToWatchList",
      "ItemRemovedFromWatchList",
      "ItemMarkedPaid",
      "ItemMarkedShipped",
      "ItemListed",
      "ItemWon",
      "ItemLost",
      "ItemSold",
      "ItemUnsold",
      "OutBid",
      "BidPlaced",
      "BidReceived",
      "EndOfAuction",
      "FixedPriceTransaction",
      "FixedPriceEndOfTransaction",
      "FeedbackLeft",
      "FeedbackReceived"
    ];

    let notificationList = new XMLList();
    for (let i = 0; i < notifications.length; i++) {
      let notificationEnable = <NotificationEnable/>;
      notificationEnable.EventType = notifications[i];
      notificationEnable.EventEnable = "Enable";
      notificationList += notificationEnable;
    }

    let appPrefs = <ApplicationDeliveryPreferences/>;
    appPrefs.DeviceType = "ClientAlerts";
    innerBody += appPrefs;

    let userDelivery = <UserDeliveryPreferenceArray/>;
    userDelivery.appendChild(notificationList);
    innerBody += userDelivery;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("SetNotificationPreferences", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);

        that._detectAndReportErrors(xmlTree);

        try {
          if (callback) callback();
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Trading API AddToWatchList
   * @param callback
   * @returns request object
   */
  addToWatchList : function(itemId, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API AddToWatchList " +
                   "call when no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    innerBody += <ItemID>{itemId}</ItemID>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("AddToWatchList", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);

        let foundErrors =
          that._detectAndReportErrors(xmlTree);

        try {
          if (callback) {
            let result = {};
            result.error = foundErrors
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Trading API RemoveFromWatchList
   * @param callback
   * @returns request object
   */
  removeFromWatchList : function(itemId, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API RemoveFromWatchList " +
                   "call when no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    innerBody += <ItemID>{itemId}</ItemID>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("RemoveFromWatchList", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);

        let foundErrors = that._detectAndReportErrors(xmlTree);

        try {
          if (callback) {
            let result = {};
            result.error = foundErrors
            callback(result);
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }

    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Reports any error messages in the API response
   * @param xmlTree the API response
   */
  _detectAndReportErrors : function(xmlTree) {
    let foundErrors = false;

    // Check for errors
    if (xmlTree.Errors.length() > 0) {
      foundErrors = true;
      let errors = xmlTree.Errors;
      for (let i = 0; i < errors.length(); i++) {
        let errorCode = Number(errors[i].ErrorCode);
        switch (errorCode) {
          // Token expired
          case 16110:
            Logger.error("The Trading API token has expired. Forcing logout.");
            Datasource.logoutUser();
            break;

          // Invalid item Id (only active items can be added to the watchlist)
          case 21000:
            Logger.error("Tried to add an ended item to the watchlist.",
                         Logger.DUMP_STACK);
            break;

          // Item not in watch list
          case 21002:
            let itemId = errors[i].ErrorParameters[0].Value;
            Logger.error("The Item is not in the watch list.",
                         Logger.DUMP_STACK);
            break;

          // Items were not removed from watch list
          case 20820:
            // We can safely ignore this
            break;

          // Item not found
          case 1505:
            itemId = errors[i].ErrorParameters[0].Value;
            Logger.error("Trading API reports that the item was not found.",
                         Logger.DUMP_STACK);
            break;

          // Item already in watch list
          case 21003:
            itemId = errors[i].ErrorParameters[0].Value;
            Logger.error("Item is already in the watch list.",
                         Logger.DUMP_STACK);
            break;

          // Items were not added to watch list
          case 20819:
            // We can safely ignore this
            break;

          // Catch-all
          default:
            Logger.error("Trading API Error:\n" + "Error Code: " + errorCode +
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

    // Check for imminent token expiration
    if (xmlTree.HardExpirationWarning.length() > 0) {
      // Create Zulu-format date string
      let expirationDateString = String(xmlTree.HardExpirationWarning.text()).
                                   replace(" ", "T") + ".000Z";
      // Convert to date object
      let expirationDate = Constants.dateFromIso8601(expirationDateString);
      Observers.
        notify(expirationDate, "ebay-tradingapi-token-expiry-imminent", null);
    }

    return foundErrors;
  },

  /**
   * Wraps an XML fragment into a Trading API call
   * @param callName The name of the call (without "Request")
   * @param body The body of the call
   * @returns the fully-formed text
   */
  _wrapCall : function(callName, innerBody) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to wrap Trading API call without active account.",
                   Logger.DUMP_STACK);
      return "";
    }

    let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
    let token = Datasource.activeAccount().get("token");
    let credentials = "<RequesterCredentials><eBayAuthToken>" +
                      token +
                      "</eBayAuthToken></RequesterCredentials>";
    let xmlns = "xmlns=\"urn:ebay:apis:eBLBaseComponents\"";

    let wrappedBody = xmlHeader +
                      "<" + callName + "Request " + xmlns + ">" +
                      credentials + innerBody +
                      "</" + callName + "Request>";

    return wrappedBody;
  },

  /**
   * Performs Trading API call
   * @param body The full body of the call, as will be POSTed
   * @param useSandbox boolean
   * @param callback The callback function
   * @returns request object
   */
  _doCall : function(body, useSandbox, callback) {
    // Extract the call name from the body --- we need it in the headers
    let requestName;
    try {
      requestName = /><(.*?)Request/.exec(body)[1];
    }
    catch (e) {
      Logger.error("Trading API request will not be sent, as it is " +
                   "badly-formed.", Logger.DUMP_STACK);
      return;
    }
    let callDescription = "Trading API " + requestName;

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
        doTradingApiCall(requestName, body, useSandbox, apiCallback);

    ApiHelper.addPendingRequest(request, callDescription);

    return request;
  }
};
