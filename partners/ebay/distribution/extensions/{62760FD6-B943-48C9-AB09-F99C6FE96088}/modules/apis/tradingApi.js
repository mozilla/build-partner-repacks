/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["TradingApi"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/observers.js");Cu.import("resource://ebaycompanion/helpers/apiHelper.js");Cu.import("resource://ebaycompanion/apiAccessService.js");Cu.import("resource://ebaycompanion/helpers/informationNotificationHelper.js");Cu.import("resource://ebaycompanion/helpers/warningNotificationHelper.js");Cu.import("resource://ebaycompanion/objects/account.js");Cu.import("resource://ebaycompanion/objects/item.js");Cu.import("resource://ebaycompanion/objects/transaction.js");Cu.import("resource://ebaycompanion/objects/favoriteSeller.js");Cu.import("resource://ebaycompanion/objects/favoriteSearch.js");Cu.import("resource://ebaycompanion/objects/notification.js");Cu.import("resource://ebaycompanion/datasource.js");Cu.import("resource://ebaycompanion/constants.js");Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");TradingApi={reportToolbarActivity:function(aActivity,aCredentialsArray,aUseSandbox,aCallback){let toolbarId=PropertiesStorage.get("ToolbarId");Logger.log("Reporting toolbar activity: \""+aActivity+"\" with "+
"toolbarId: "+toolbarId);if(aActivity!="Install"&&!toolbarId){Logger.error("Attempt to make Trading API non-install "+
"ReportToolbarActivity call when there is no toolbarId "+
"stored locally.",Logger.DUMP_STACK);return;}
if(aActivity=="Install"&&toolbarId){Logger.error("Attempt to make Trading API install "+
"ReportToolbarActivity call when there is already a "+
"toolbarId stored locally.",Logger.DUMP_STACK);let tempResult={};tempResult.error=true;tempResult.existingToolbarId=true;if(aCallback){aCallback(tempResult);}
return;}
let toolbarIdValue="";if(toolbarId){toolbarIdValue="<ToolbarID>"+toolbarId+"</ToolbarID>";}
let promptedForUpgrade="";if(aActivity=="Upgrade"){promptedForUpgrade="<PromptedForUpgrade>0</PromptedForUpgrade>";}
let credentials="";for each(let[name,value]in Iterator(aCredentialsArray)){credentials+="<"+name+">"+value+"</"+name+">";}
let requestIdentifier=Datasource.getRequestIdentifier();let wrappedBody="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<ReportToolbarActivityRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">"+
"<MessageID>"+requestIdentifier+"</MessageID>"+
"<RequesterCredentials>"+
credentials+
"</RequesterCredentials>"+
"<ToolbarVersion>1</ToolbarVersion>"+
"<Activity>"+aActivity+"</Activity>"+
toolbarIdValue+
promptedForUpgrade+
"</ReportToolbarActivityRequest>";let localCallback=let(that=this)function(response){let result=that._parseReportToolbarActivityResponse(response);try{if(aCallback)aCallback(result);}
catch(e){Logger.exception(e);}}
let request=this._doCall(wrappedBody,aUseSandbox,localCallback);return request;},_parseReportToolbarActivityResponse:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=this._detectAndReportErrors(xmlTree);let result={};if(!foundErrors){let toolbarId=xmlTree..ToolbarID;if(toolbarId){result.toolbarId=toolbarId;}}else{result.error=foundErrors;}
return result;},getSessionID:function(aUseSandbox,aCallback){let requestIdentifier=Datasource.getRequestIdentifier();let runame=Constants.getRuname(aUseSandbox,Datasource.homeSite());let wrappedBody="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<GetSessionIDRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">"+
"<MessageID>"+requestIdentifier+"</MessageID>"+
"<RuName>"+runame+"</RuName>"+
"</GetSessionIDRequest>";let localCallback=let(that=this)function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=that._detectAndReportErrors(xmlTree);let result={};if(!foundErrors){let sessionId=String(xmlTree.SessionID);result.sessionId=sessionId;}else{result.errors=foundErrors;}
try{if(aCallback){aCallback(result);}}
catch(e){Logger.exception(e);}}
let request=this._doCall(wrappedBody,aUseSandbox,localCallback);return request;},fetchToken:function(isSandboxAccount,sessionId,callback){let requestIdentifier=Datasource.getRequestIdentifier();let wrappedBody="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<FetchTokenRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">"+
"<MessageID>"+requestIdentifier+"</MessageID>"+
"<SessionID>"+sessionId+"</SessionID>"+
"</FetchTokenRequest>";let localCallback=let(that=this)function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let errors=that._detectAndReportErrors(xmlTree);let authToken=String(xmlTree.eBayAuthToken);try{if(callback){let result={};result.token=authToken;result.errors=errors;callback(result);}}
catch(e){Logger.exception(e);}}
let request=this._doCall(wrappedBody,isSandboxAccount,localCallback);return request;},getUser:function(aCallback){let activeAccount=Datasource.activeAccount();if(!activeAccount){Logger.error("Attempt to make Trading API getUser call when "+
"no account is active.",Logger.DUMP_STACK);return;}
var wrappedBody;var localCallback;var that=this;var request;var innerBody=""+
"<UserID>"+activeAccount.get("userId")+"</UserID>";wrappedBody=this._wrapCall("GetUser",innerBody);localCallback=function(aResponse){var result=that._parseGetUserResponse(aResponse);try{if(aCallback){aCallback(result);}}
catch(e){Logger.exception(e);}};request=this._doCall(wrappedBody,activeAccount.get("isSandboxAccount"),localCallback);return request;},_parseGetUserResponse:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=this._detectAndReportErrors(xmlTree);let result={};if(!foundErrors){result.feedbackRating=Number(xmlTree.User.FeedbackScore.text());result.registrationSite=String(xmlTree.User.Site.text());result.email=String(xmlTree.User.Email.text());}else{result.error=foundErrors;}
return result;},getMyeBayBuying:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API GetMyeBayBuying call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let activeLists=<><WatchList/><BidList/></>;
    let endedLists = <><WonList/><LostList/></>;
    let favoriteSellersList = <><FavoriteSellers/></>;
    favoriteSellersList.include = true;
    let favoriteSearchesList = <><FavoriteSearches/></>;
    favoriteSearchesList.include = true;
    let bestOfferList = <><BestOfferList/></>;
    // use only 30 days to match the information displayed on My eBay pages.
    //bestOfferList.DurationInDays = 30;
    for each (let list in endedLists) {
      list.DurationInDays = 60;
    }
    for each (let list in (endedLists + activeLists + bestOfferList)) {
      // XXX: despite http://developer.ebay.com/DevZone/XML/docs/Reference/eBay/GetMyeBayBuying.html
list.Pagination.EntriesPerPage=100;list.Pagination.PageNumber=1;list.Sort="EndTime";}
innerBody+=activeLists+endedLists+favoriteSellersList+
favoriteSearchesList+bestOfferList;XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("GetMyeBayBuying",flatInnerBody);let localCallback=let(that=this)function(response){let result=that._parseGetMyeBayBuyingResponse(response);try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},_parseGetMyeBayBuyingResponse:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=this._detectAndReportErrors(xmlTree);let result={};if(!foundErrors){let itemIds=[];let xmlItemIds=xmlTree..ItemID;for each(let xmlItemId in xmlItemIds){itemIds[xmlItemId.text()]=true;}
let bestOfferItems={};let xmlBestOfferItems=xmlTree..BestOfferList..Item;for each(let xmlItem in xmlBestOfferItems){bestOfferItems[xmlItem.ItemID]=xmlItem;}
let watchedItems={};let xmlWatchedItems=xmlTree..WatchList..Item;for each(let xmlItem in xmlWatchedItems){watchedItems[xmlItem.ItemID]=xmlItem;}
let bidItems={};let xmlBidItems=xmlTree..BidList..Item;for each(let xmlItem in xmlBidItems){bidItems[xmlItem.ItemID]=xmlItem;}
let lostItems={};let xmlLostItems=xmlTree..LostList..Item;for each(let xmlItem in xmlLostItems){lostItems[xmlItem.ItemID]=xmlItem;}
let wonItems={};let xmlWonItems=xmlTree..WonList..Item;for each(let xmlItem in xmlWonItems){wonItems[xmlItem.ItemID]=xmlItem;}
let items=[];for(let itemId in itemIds){let item=new Item(Number(itemId));let xmlItem;let quantityWinning=0;let addItemToArray=true;if(bidItems[itemId]){xmlItem=bidItems[itemId];item.fromXMLNode(xmlItem);item.type=Item.ITEM_TYPE_BIDDING;}else if(wonItems[itemId]){xmlItem=wonItems[itemId];item.fromXMLNode(xmlItem);let currentUser=Datasource.activeAccount();if(currentUser){item.set("highBidderId",currentUser.get("userId"));}
item.type=Item.ITEM_TYPE_WON;}else if(lostItems[itemId]){xmlItem=lostItems[itemId];item.fromXMLNode(xmlItem);item.type=Item.ITEM_TYPE_LOST;}else if(bestOfferItems[itemId]){xmlItem=bestOfferItems[itemId];item.fromXMLNode(xmlItem);item.type=Item.ITEM_TYPE_BEST_OFFER;}else{xmlItem=watchedItems[itemId];item.fromXMLNode(xmlItem);item.type=Item.ITEM_TYPE_WATCHING;let currentUser=Datasource.activeAccount();if(currentUser&&currentUser.get("userId").toLowerCase()==item.get("sellerUserId").toLowerCase()){addItemToArray=false;}}
if(addItemToArray&&this.isValidXMLItem(xmlItem)){items.push(item);}}
let transactions=[];let xmlTransactions=xmlTree..Transaction;for each(let xmlTransaction in xmlTransactions){let itemId=Number(xmlTransaction..ItemID.text());let transactionId=Number(xmlTransaction..TransactionID.text());let transaction=new Transaction(itemId,transactionId);transaction.set("quantityPurchased",Number(xmlTransaction..QuantityPurchased));let buyerUserId=Datasource.activeAccount()?Datasource.activeAccount().get("userId"):"";transaction.set("buyerUserId",buyerUserId);let paidStatus;switch(String(xmlTransaction..BuyerPaidStatus.text())){case"MarkedAsPaid":case"PaidWithEscrow":case"PaidWithPaisapay":case"PaidWithPayPal":paidStatus=true;break;default:paidStatus=false;}
transaction.set("isPaidFor",paidStatus);let isShipped=xmlTransaction..ShippedTime.length()>0;transaction.set("isShipped",isShipped);let feedbackLeft=xmlTransaction..FeedbackLeft.length()>0;transaction.set("userHasSentFeedback",feedbackLeft);let feedbackReceivedType=xmlTransaction..FeedbackReceived.CommentType;transaction.set("userHasReceivedFeedback",feedbackReceivedType.length()>0);transaction.set("feedbackReceivedType",String(feedbackReceivedType));let createdDate=Constants.dateFromIso8601(xmlTransaction..CreatedDate).getTime();transaction.set("creationTime",createdDate);let transactionPrice=Number(xmlTransaction..TransactionPrice);let transactionPriceCurrency;let convertedTransactionPrice;let convertedTransactionPriceCurrency;let finalPricePresent=!(transactionPrice==0);if(finalPricePresent){transactionPriceCurrency=String(xmlTransaction..TransactionPrice.@currencyID);convertedTransactionPrice=Number(xmlTransaction..ConvertedTransactionPrice);convertedTransactionPriceCurrency=String(xmlTransaction..ConvertedTransactionPrice.@currencyID);}else{transactionPrice=Number(xmlTransaction..SellingStatus.CurrentPrice);transactionPriceCurrency=String(xmlTransaction..SellingStatus.CurrentPrice.@currencyID);convertedTransactionPrice=Number(xmlTransaction..SellingStatus.ConvertedCurrentPrice);convertedTransactionPriceCurrency=String(xmlTransaction..SellingStatus.ConvertedCurrentPrice.@currencyID);}
transaction.set("transactionPrice",transactionPrice);transaction.set("transactionPriceCurrency",transactionPriceCurrency);transaction.set("convertedTransactionPrice",convertedTransactionPrice);transaction.set("convertedTransactionPriceCurrency",convertedTransactionPriceCurrency);transactions.push(transaction);}
let favoriteSellers=[];let xmlFavoriteSellers=xmlTree..FavoriteSeller;let activeAccount=Datasource.activeAccount();for each(let xmlFavoriteSeller in xmlFavoriteSellers){let sellerId=String(xmlFavoriteSeller..UserID.text());let storeName=String(xmlFavoriteSeller..StoreName.text());let favoriteSeller=new FavoriteSeller(activeAccount.get("userId"),activeAccount.get("isSandboxAccount"),sellerId);favoriteSeller.set("storeName",storeName);favoriteSellers.push(favoriteSeller);}
let favoriteSearches=[];let xmlFavoriteSearches=xmlTree..FavoriteSearch;for each(let xmlFavoriteSearch in xmlFavoriteSearches){let searchName=String(xmlFavoriteSearch..SearchName.text());let searchQuery=String(xmlFavoriteSearch..SearchQuery.text());let favoriteSearch=new FavoriteSearch(activeAccount.get("userId"),activeAccount.get("isSandboxAccount"),searchName);favoriteSearch.set("searchQuery",searchQuery);favoriteSearches.push(favoriteSearch);}
let timestampText=String(xmlTree.Timestamp.text());let timestamp=Constants.dateFromIso8601(timestampText);result.items=items;result.transactions=transactions;result.timestamp=timestamp;result.favoriteSellers=favoriteSellers;result.favoriteSearches=favoriteSearches;}else{result.error=foundErrors;}
return result;},getMyeBaySelling:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API GetMyeBaySelling call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let activeLists=<><ActiveList/></>;
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

  /***Processes a GetMyeBaySelling response*@param response*@returns Transaction objects and partially-initialised Item objects*/
  _parseGetMyeBaySellingResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/xmlns=["'].*?["']/, "");
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
      let items = {};
      for (let itemId in itemIds) {
        let item = new Item(Number(itemId));
        item.set("userMaxBid", 0);
        item.set("userQuantityBidFor", 0);

        let thumbnailUrl = "";
        let convertedCurrentPrice = 0;
        let convertedCurrentPriceCurrency = "";

        if (activeItems[itemId]) {
          xmlItem = activeItems[itemId];
          item.type = Item.ITEM_TYPE_SELLING;
        } else if (soldItems[itemId]) {
          xmlItem = soldItems[itemId];
          item.type = Item.ITEM_TYPE_SOLD;
        } else if (unsoldItems[itemId]) {
          xmlItem = unsoldItems[itemId];
          item.type = Item.ITEM_TYPE_UNSOLD;
        }

        item.fromXMLNode(xmlItem);

        if (this.isValidXMLItem(xmlItem)) {
          // use the items array as a hash too to use it during the
          // GetSellerList call
          items[itemId] = item;
          //items.push(item);
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
        // set the final price of the transaction
        let transactionPrice = Number(xmlTransaction..TransactionPrice);
        let transactionPriceCurrency;
        let convertedTransactionPrice;
        let convertedTransactionPriceCurrency;
        let finalPricePresent = !(transactionPrice == 0);
        if (finalPricePresent) {
          transactionPriceCurrency =
            String(xmlTransaction..TransactionPrice.@currencyID);
          convertedTransactionPrice =
            Number(xmlTransaction..ConvertedTransactionPrice);
          convertedTransactionPriceCurrency =
            String(xmlTransaction..ConvertedTransactionPrice.@currencyID);
        } else {
          transactionPrice = Number(xmlTransaction..SellingStatus.CurrentPrice);
          transactionPriceCurrency =
            String(xmlTransaction..SellingStatus.CurrentPrice.@currencyID);
          convertedTransactionPrice =
            Number(xmlTransaction..SellingStatus.ConvertedCurrentPrice);
          convertedTransactionPriceCurrency =
            String(xmlTransaction..SellingStatus.ConvertedCurrentPrice.@currencyID);
        }

        transaction.set("transactionPrice", transactionPrice);
        transaction.set("transactionPriceCurrency", transactionPriceCurrency);
        transaction.set("convertedTransactionPrice", convertedTransactionPrice);
        transaction.set(
          "convertedTransactionPriceCurrency", convertedTransactionPriceCurrency);
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
   * Trading API GetSellerList
   * @param getMyeBaySellingResults an object with the information (items and
   * transactions) returned by the GetMyEbaySelling call that we will need
   * during GetSellerList call and later on GetMultipleItems
   * @param callback
   * @returns request object
   */
  getSellerList : function(getMyeBaySellingResults, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Trading API GetSellerList call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

      // output selectors
    let outputSelectors = <OutputSelector/>;
    outputSelectors.appendChild(
      "ItemArray.Item.ItemID," +
      "ItemArray.Item.HitCount," +
      "ItemArray.Item.HitCounter");
    innerBody += outputSelectors;

    let granularity = <GranularityLevel />;
    granularity.appendChild("Coarse");

    let today = new Date();
    let fromDate = new Date().setDate(today.getDate()-119);

    let dateFormat = "$YYYY-$MM-$DD $hh:$mm:$ss";
    let startTime = <StartTimeFrom/>;
    startTime.appendChild(Constants.formatDate(fromDate, dateFormat));

    let endTime = <StartTimeTo />;
    endTime.appendChild(Constants.formatDate(today, dateFormat));

    // item lists
    let pagination = <><Pagination/></>;
    pagination.EntriesPerPage = 200;
    //pagination.PageNumber = 1;

    innerBody += granularity + pagination + startTime + endTime;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetSellerList", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let result =
          that._parseGetSellerListResponse(
            response, getMyeBaySellingResults.items);

        result.transactions = getMyeBaySellingResults.transactions;
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
   * Processes a GetSellerList response
   * @param itemsList the list of the items returned by GetMyEbaySelling, so we
   * can update the fields we are interested in when performing the
   * GetSellerList call
   * @param response
   * @returns partially-initialised Item objects
   */
  _parseGetSellerListResponse : function(response, itemsList) {
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

      //
      let sellingItems = {};
      let xmlActiveItems = xmlTree..ItemArray..Item;
      for each (let xmlItem in xmlActiveItems) {
        sellingItems[xmlItem.ItemID] = xmlItem;
      }

      // For each tracked item, extract necessary information and add to array
      let items = [];
      for (let itemId in itemIds) {
        let item = itemsList[itemId];
        if (item) {
          xmlItem = sellingItems[itemId];

          item.set("pageViews", Number(xmlItem..HitCount));
          item.set("hitCounterType", String(xmlItem..HitCounter));

          if (this.isValidXMLItem(xmlItem)) {
            itemsList[itemId] = item;
          }
        }

      }

      // now we can convert the item list from a hash to a regular array
      for each (let [itemId, item] in Iterator(itemsList)) {
        items.push(item);
      }

      result.items = items;

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
      Logger.error("Attempt to make Trading API GetItem call when" +
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
                        replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=this._detectAndReportErrors(xmlTree);if(foundErrors){return;}
let itemId=xmlTree..ItemID.text();item.fromXMLNode(xmlTree);let pageViews=Number(xmlTree..HitCount);if(pageViews>-1){item.set("pageViews",pageViews);}
let itemCountry=String(xmlTree.Item.Country);let localCountry=Constants.countryIso3166ForSite(Datasource.homeSite());let localOptions=xmlTree..ShippingServiceOptions;let intlOptions=xmlTree..InternationalShippingServiceOption;let shippingOptions=localOptions;if(itemCountry!=localCountry&&intlOptions.length()>0){shippingOptions=intlOptions;}
let shippingCost=0;if(shippingOptions.length()>=1){shippingCost=Number(shippingOptions[0].ShippingServiceCost);}
item.set("shippingCost",shippingCost);return item;},getMyMessages:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API GetMyMessages call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let outputSelectors=<OutputSelector/>;outputSelectors.appendChild("Messages.Message.Read");innerBody+=outputSelectors;innerBody+=<DetailLevel>ReturnHeaders</DetailLevel>;

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

  /***Processes a GetMyMessages response*@param response*@returns number of unread messages*/
  _parseGetMyMessagesResponse : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    this._detectAndReportErrors(xmlTree);

    let messages = xmlTree..Message;
    let alerts = xmlTree..Alert;
    let numUnread = 0;

    // XXX: this kind of sintax doesn't work on FF3.5
for(var i=0;i<messages.length();i++){if(messages[i].Read=="false"){numUnread++;}}
for(var i=0;i<alerts.length();i++){if(alerts[i].Read=="false"){numUnread++;}}
return numUnread;},getClientAlertsAuthToken:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API GetClientAlertsAuthToken "+
"call when no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("GetClientAlertsAuthToken",flatInnerBody);let localCallback=let(that=this)function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let errors=that._detectAndReportErrors(xmlTree);let authToken=String(xmlTree.ClientAlertsAuthToken.text());try{if(callback){let result={};result.token=authToken;result.errors=errors;callback(result);}}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},setNotificationPreferences:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API SetNotificationPreferences "+
"call when no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let notifications=["ItemAddedToWatchList","ItemRemovedFromWatchList","ItemMarkedPaid","ItemMarkedShipped","ItemListed","ItemWon","ItemLost","ItemSold","ItemUnsold","OutBid","BidPlaced","BidReceived","EndOfAuction","FixedPriceTransaction","FixedPriceEndOfTransaction","FeedbackLeft","FeedbackReceived","BestOffer","BestOfferPlaced","BestOfferDeclined","CounterOfferReceived"];let notificationList=new XMLList();for(let i=0;i<notifications.length;i++){let notificationEnable=<NotificationEnable/>;notificationEnable.EventType=notifications[i];notificationEnable.EventEnable="Enable";notificationList+=notificationEnable;}
let appPrefs=<ApplicationDeliveryPreferences/>;appPrefs.DeviceType="ClientAlerts";innerBody+=appPrefs;let userDelivery=<UserDeliveryPreferenceArray/>;userDelivery.appendChild(notificationList);innerBody+=userDelivery;XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("SetNotificationPreferences",flatInnerBody);let localCallback=let(that=this)function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let errors=that._detectAndReportErrors(xmlTree);let result={};result.errors=errors;try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},addToWatchList:function(itemId,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Trading API AddToWatchList "+
"call when no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();innerBody+=<ItemID>{itemId}</ItemID>;

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
                            replace(/xmlns=["'].*?["']/, "");
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
   * Checks if an item violates any policy and has been removed for this reason
   * @param aXMLItem the xml node with the item information
   */
  isValidXMLItem : function(aXMLItem) {
    let itemViolatesPolicy = String(aXMLItem..ItemPolicyViolation).length > 0;
    if (itemViolatesPolicy) {
      return false;
    }

    return true;
  },

  /**
   * Reports any error messages in the API response
   * @param xmlTree the API response
   */
  _detectAndReportErrors : function(xmlTree) {
    let foundErrors = null;

    // Check for errors
    if (xmlTree.Errors.length() > 0) {
      foundErrors = {};
      foundErrors.length = xmlTree.Errors.length();
      let errors = xmlTree.Errors;
      for (let i = 0; i < errors.length(); i++) {
        let errorCode = Number(errors[i].ErrorCode);
        let errorType = String(errors[i].ErrorClassification);
        if (errorType) {
          // we use this flag to know if the failed API calls can be retried
          // (applies only to client alerts login logic)
          if (errorType.indexOf("SystemError") != -1) {
            foundErrors.systemErrors = true;
          }
        }
        switch (errorCode) {
          // suspended account
          case 841:
            Logger.error("The user account has been suspended.Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;
          // Invalid token
          case 931:
            Logger.error("Auth token is invalid.Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;
          // Token hard expired
          case 932:
            Logger.error("Auth token is hard expired.Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;
          // Security token expired
          case 17470:
            Logger.error("Please login again now.Your security token has" +
                         "expired.Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;
          // Token expired
          case 16110:
            Logger.error("The Trading API token has expired.Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;

          // invalid authentication method
          case 16112:
            Logger.error("The authentication method used is invalid." +
                         "Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;

          // token retrieval window expired
          case 16118:
            Logger.error("The token retrieval window has expired." +
                         "Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;

          // token does not exist
          case 16119:
            Logger.error("The token does not exist." +
                         "Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;

          // token does not match headers credentials
          case 17476:
            Logger.error("The token does not match headers credentials." +
                         "Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
            break;

          // Token has been revoked by App
          case 21916013:
            Logger.error("The token Token has been revoked by App." +
                         "Forcing logout.");
            Datasource.logoutUser();
            Datasource.showSecuritySignOutWarningNotification();
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
            Logger.error("Trading API Error:\n" + "Error Code:" + errorCode +
                         "\nShort Message:" +
                         String(errors[i].ShortMessage.text()) +
                         "\nLong Message:" +
                         String(errors[i].LongMessage.text()) +
                         "\nSeverity:" +
                         String(errors[i].SeverityCode.text()) +
                         "\nError Clasification:" +
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
                                   replace("", "T") + ".000Z";
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

    let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";let token=Datasource.activeAccount().get("token");let credentials="<RequesterCredentials><eBayAuthToken>"+
token+
"</eBayAuthToken></RequesterCredentials>";let xmlns="xmlns=\"urn:ebay:apis:eBLBaseComponents\"";let requestIdentifier=Datasource.getRequestIdentifier();let messageID="<MessageID>"+requestIdentifier+"</MessageID>";let wrappedBody=xmlHeader+
"<"+callName+"Request "+xmlns+">"+
messageID+credentials+innerBody+
"</"+callName+"Request>";return wrappedBody;},_doCall:function(body,useSandbox,callback){let requestName;try{requestName=/><(.*?)Request/.exec(body)[1];}
catch(e){Logger.error("Trading API request will not be sent, as it is "+
"badly-formed.",Logger.DUMP_STACK);return;}
let callDescription="Trading API "+requestName;let apiCallback=ApiHelper.generateApiCallback(callDescription,callback);let siteId=Constants.siteIdForSite(Datasource.homeSite());ApiAccessService.siteId=siteId;ApiAccessService.apiVersion=693;let request=ApiAccessService.doTradingAPICall(requestName,body,useSandbox,apiCallback);ApiHelper.addPendingRequest(request,callDescription);let requestLog={};requestLog.requestName=requestName;requestLog.properties=body;requestLog.api="Trading";Observers.notify(requestLog,"ebay-trading-api-call",null);return request;}};