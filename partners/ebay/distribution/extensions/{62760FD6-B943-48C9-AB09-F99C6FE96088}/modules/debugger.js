/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Debugger"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var Debugger = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/objects/account.js");
      Cu.import("resource://ebaycompanion/objects/item.js");
      Cu.import("resource://ebaycompanion/objects/transaction.js");
      Cu.import("resource://ebaycompanion/storage/objectsStorage.js");
      Cu.import("resource://ebaycompanion/apis/tradingApi.js");
      Cu.import("resource://ebaycompanion/datasource.js");
      Cu.import("resource://ebaycompanion/constants.js");

      Logger.log("Debugger is active.");

      // Start the activity logger if required
      if (Constants.prefBranch.get("debugging.activityLogger.enabled")) {
        Cu.import("resource://ebaycompanion/activityLogger.js");
      }

      // Perform unit tests if required
      if (Constants.prefBranch.get("debugging.runUnitTests")) {
        UnitTests.start();
      }

      // Register observers
      let that = this;
      this._observers = new Observers;
      this._observers.
        add(function() that._uninit(),
            "quit-application-granted");

      // Log Datasource events if required
      if (Constants.prefBranch.get("debugging.logDatasourceEvents")) {
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
                that._newItem(subject.object),
              "ebay-item-new");
        this._observers.
          add(function(subject, topic, data)
                that._itemPropertyUpdated(subject.object, data),
              "ebay-item-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._itemRemoved(subject.object),
              "ebay-item-removed");

        // Transactions
        this._observers.
          add(function(subject, topic, data)
                that._newTransaction(subject.object),
              "ebay-transaction-new");
        this._observers.
          add(function(subject, topic, data)
                that._transactionPropertyUpdated(subject.object, data),
              "ebay-transaction-property-updated");
        this._observers.
          add(function(subject, topic, data)
                that._transactionRemoved(subject.object),
              "ebay-transaction-removed");
        this._observers.
          add(function(subject, topic, data)
                that._transactionRemoved(subject.object.transaction),
              "ebay-transaction-item-removed");


        // Other
        this._observers.
          add(function(subject, topic, data)
                that._tradingApiTokenExpiryImminent(subject),
              "ebay-tradingapi-token-expiry-imminent");
      }

      // Log API events if required
      if (Constants.prefBranch.get("debugging.logApiEvents")) {
        // For these notifications, the \c data parameter holds the name of the
        // update type
        this._observers.
          add(function(subject, topic, data)
                Logger.log(data + " Started"),
              "ebay-update-started");
        this._observers.
          add(function(subject, topic, data)
                Logger.log(data + " Finished"),
              "ebay-update-finished");
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every account log-in
   */
  _accountLoggedIn : function(account) {
    try {
      Logger.log("Account logged in: " + account.get("userId"));
      if (account.get("isSandboxAccount")) {
        Logger.log("(This is a sandbox account.)");
      }
      this._checkObjectMembers(account);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every account property update
   */
  _accountPropertyUpdated : function(account, property) {
    try {
      Logger.log("Account update: " + account.get("userId") + ": " +
                 property + " := " + account.get(property));
      this._checkObjectMembers(account);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every account log-out
   */
  _accountLoggedOut : function(account) {
    try {
      if (account != null) {
        Logger.log("Account logged out: " + account.get("userId"));
        this._checkObjectMembers(account);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every new tracked item
   */
  _newItem : function(item) {
    try {
      Logger.log("New Item: " + item.get("itemId") +
                 " (" + item.get("title") + ")");
      this._checkObjectMembers(item);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every item property update
   */
  _itemPropertyUpdated : function(item, property) {
    try {
      if (property.indexOf("transaction") == -1) {
        Logger.log("Item update: " + item.get("itemId") + ": " + property +
                   " := " + item.get(property));
        this._checkObjectMembers(item);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every item that is removed
   */
  _itemRemoved : function(item) {
    try {
      Logger.log("Item Removed: " + item.get("itemId") +
                 " (" + item.get("title") + ")");
      this._checkObjectMembers(item);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every new tracked transaction
   */
  _newTransaction : function(transaction) {
    try {
      Logger.log("New Transaction: " +
                 transaction.get("itemId") + "." +
                 transaction.get("transactionId"));
      this._checkObjectMembers(transaction);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every transaction property update
   */
  _transactionPropertyUpdated : function(transaction, property) {
    try {
      Logger.log("Transaction update: " + transaction.get("itemId") + "." +
                 transaction.get("transactionId") + ": " + property +
                 " := " + transaction.get(property));
      this._checkObjectMembers(transaction);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs every transaction that is removed
   */
  _transactionRemoved : function(transaction) {
    try {
      Logger.log("Transaction Removed: " +
                 transaction.get("itemId") + "." +
                 transaction.get("transactionId"));
      this._checkObjectMembers(transaction);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Logs the fact that the token will soon expire
   */
  _tradingApiTokenExpiryImminent : function(expiryDate) {
    try {
      Logger.log("The current Trading API token will expire on: " + expiryDate);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Reports a warning if any of the given type's members are undefined.  This
   * helps highlight gaps in data processing.
   * @param object
   * @param prototype The object's prototype
   */
  _checkObjectMembers : function(object) {
    // Extract all defined members from the object's properties
    let definedMembers = [];
    for (let [property, value] in Iterator(object)) {
      let member = property.slice(1);
      definedMembers[member] = true;
    }

    // Make an array of all those members that are not defined
    let undefinedMembers = [];
    for (let [property, value] in Iterator(object.propertyTypes)) {
      if (!definedMembers[property]) {
        undefinedMembers.push(property);
      }
    }

    if (undefinedMembers.length > 0) {
      // Log a warning
      let undefinedMembersString = undefinedMembers.join(", ");
      Logger.warning("Members missing from " + object.constructor.name + ": " +
                     undefinedMembersString);
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
  }
};


/**
 * Unit tests
 */
var UnitTests = {
  /**
   * start
   */
  start : function() {
    this.ApiParsing.start();
    this.Storage.start();
    Logger.log("Finished unit testing");
  }
};

/**
 * Unit tests for eBay API parsing
 */
UnitTests.ApiParsing = {
  /**
   * start
   */
  start : function() {
    this.TradingApi.start();
  }
}

/**
 * Unit tests for Trading API parsing
 */
UnitTests.ApiParsing.TradingApi = {
  /**
   * start
   */
  start : function() {
    this.checkGetMyeBayBuying();
    this.checkGetMyeBaySelling();
    //this.checkGetItem();
  },

  /**
   * Checks that GetMyeBayBuying responses are correctly parsed
   */
  checkGetMyeBayBuying : function() {
    let xmlTree =
      <GetMyeBayBuyingResponse>
        <Timestamp>2008-07-30T11:57:23.185Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <WatchList>
          <ItemArray>
            <Item>
              <ItemID>000000000000</ItemID>
            </Item>
            <Item>
              <ItemID>111111111111</ItemID>
            </Item>
            <Item>
              <ItemID>222222222222</ItemID>
            </Item>
          </ItemArray>
        </WatchList>
        <LostList>
          <ItemArray>
            <Item>
              <ItemID>000000000000</ItemID>
            </Item>
            <Item>
              <ItemID>333333333333</ItemID>
            </Item>
          </ItemArray>
        </LostList>
        <BidList>
          <ItemArray>
            <Item>
              <BiddingDetails>
                <MaxBid currencyID="GBP">3.14</MaxBid>
                <QuantityBid>2</QuantityBid>
                <QuantityWon>1</QuantityWon>
                <BidAssistant>false</BidAssistant>
              </BiddingDetails>
              <ItemID>111111111111</ItemID>
            </Item>
            <Item>
              <BiddingDetails>
                <MaxBid currencyID="GBP">123456789.01</MaxBid>
                <QuantityBid>3141592654</QuantityBid>
                <QuantityWon>1</QuantityWon>
                <BidAssistant>false</BidAssistant>
              </BiddingDetails>
              <ItemID>444444444444</ItemID>
            </Item>
          </ItemArray>
        </BidList>
        <WonList>
          <OrderTransactionArray>
            <OrderTransaction>
              <Transaction>
                <CreatedDate>2008-06-20T18:16:35.000Z</CreatedDate>
                <Item>
                  <ItemID>000000000000</ItemID>
                </Item>
                <QuantityPurchased>1</QuantityPurchased>
                <TransactionID>111111111111</TransactionID>
                <BuyerPaidStatus>NotPaid</BuyerPaidStatus>
              </Transaction>
            </OrderTransaction>
            <OrderTransaction>
              <Order>
                <TransactionArray>
                  <Transaction>
                    <CreatedDate>2008-06-20T18:16:35.000Z</CreatedDate>
                    <Item>
                      <ItemID>111111111111</ItemID>
                    </Item>
                    <QuantityPurchased>1</QuantityPurchased>
                    <TransactionID>222222222222</TransactionID>
                    <BuyerPaidStatus>PaidWithPayPal</BuyerPaidStatus>
                    <ShippedTime>1985-08-19T18:16:35.000Z</ShippedTime>
                    <FeedbackLeft>
                      <CommentType>Positive</CommentType>
                    </FeedbackLeft>
                    <FeedbackReceived>
                      <CommentType>Positive</CommentType>
                    </FeedbackReceived>
                  </Transaction>
                </TransactionArray>
              </Order>
            </OrderTransaction>
          </OrderTransactionArray>
        </WonList>
      </GetMyeBayBuyingResponse>;

    let parsedResponse =
      TradingApi._parseGetMyeBayBuyingResponse(xmlTree.toXMLString());
    let items = parsedResponse.items;

    assert(items.length == 5,
           "GetMyeBayBuying extracted wrong number of item IDs: " +
           items.length);

    assertProperty(items[0], "itemId", 000000000000);
    assertProperty(items[0], "userMaxBid", 0);
    assertProperty(items[0], "userQuantityBidFor", 0);
    assertProperty(items[0], "userQuantityWinning", 1);

    assertProperty(items[1], "itemId", 111111111111);
    assertProperty(items[1], "userMaxBid", 3.14);
    assertProperty(items[1], "userQuantityBidFor", 2);
    assertProperty(items[1], "userQuantityWinning", 1);

    assertProperty(items[2], "itemId", 222222222222);
    assertProperty(items[2], "userMaxBid", 0);
    assertProperty(items[2], "userQuantityBidFor", 0);
    assertProperty(items[2], "userQuantityWinning", 0);

    assertProperty(items[3], "itemId", 333333333333);
    assertProperty(items[3], "userMaxBid", 1);
    assertProperty(items[3], "userQuantityBidFor", 1);
    assertProperty(items[3], "userQuantityWinning", 0);

    assertProperty(items[4], "itemId", 444444444444);
    assertProperty(items[4], "userMaxBid", 123456789.01);
    assertProperty(items[4], "userQuantityBidFor", 3141592654);
    assertProperty(items[4], "userQuantityWinning", 1);

    let transactions = parsedResponse.transactions;

    assert(transactions.length == 2,
           "GetMyeBayBuying extracted wrong number of transactions: " +
           transactions.length);
    assertProperty(transactions[0], "itemId", 000000000000);
    assertProperty(transactions[0], "transactionId", 111111111111);
    assertProperty(transactions[0], "creationTime",
                   Date.parse("20 June 2008 18:16:35 GMT"));
    assertProperty(transactions[0], "quantityPurchased", 1);
    assertProperty(transactions[0], "buyerUserId",
                   Datasource.activeAccount() ?
                     Datasource.activeAccount().get("userId") : "");
    assertProperty(transactions[0], "isPaidFor", false);
    assertProperty(transactions[0], "isShipped", false);
    assertProperty(transactions[0], "userHasSentFeedback", false);
    assertProperty(transactions[0], "userHasReceivedFeedback", false);
    assertProperty(transactions[0], "feedbackReceivedType", "");

    assertProperty(transactions[1], "itemId", 111111111111);
    assertProperty(transactions[1], "transactionId", 222222222222);
    assertProperty(transactions[1], "creationTime",
                   Date.parse("20 June 2008 18:16:35 GMT"));
    assertProperty(transactions[1], "quantityPurchased", 1);
    assertProperty(transactions[1], "buyerUserId",
                   Datasource.activeAccount() ?
                     Datasource.activeAccount().get("userId") : "");
    assertProperty(transactions[1], "isPaidFor", true);
    assertProperty(transactions[1], "isShipped", true);
    assertProperty(transactions[1], "userHasSentFeedback", true);
    assertProperty(transactions[1], "userHasReceivedFeedback", true);
    assertProperty(transactions[1], "feedbackReceivedType", "Positive");
  },

  /**
   * Checks that GetMyeBaySelling responses are correctly parsed
   */
  checkGetMyeBaySelling : function() {
    let xmlTree =
      <GetMyeBaySellingResponse>
        <Timestamp>2008-07-30T11:57:23.185Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <ActiveList>
          <ItemArray>
            <Item>
              <ItemID>000000000000</ItemID>
            </Item>
            <Item>
              <ItemID>111111111111</ItemID>
            </Item>
            <Item>
              <ItemID>222222222222</ItemID>
            </Item>
          </ItemArray>
        </ActiveList>
        <UnsoldList>
          <ItemArray>
            <Item>
              <ItemID>000000000000</ItemID>
            </Item>
            <Item>
              <ItemID>333333333333</ItemID>
            </Item>
          </ItemArray>
        </UnsoldList>
        <SoldList>
          <OrderTransactionArray>
            <OrderTransaction>
              <Transaction>
                <CreatedDate>2008-06-20T18:16:35.000Z</CreatedDate>
                <Item>
                  <ItemID>000000000000</ItemID>
                </Item>
                <QuantityPurchased>1</QuantityPurchased>
                <TransactionID>111111111111</TransactionID>
                <SellerPaidStatus>NotPaid</SellerPaidStatus>
                <Buyer>
                  <UserID>gideon</UserID>
                </Buyer>
              </Transaction>
            </OrderTransaction>
            <OrderTransaction>
              <Order>
                <TransactionArray>
                  <Transaction>
                    <CreatedDate>2008-06-20T18:16:35.000Z</CreatedDate>
                    <Item>
                      <ItemID>111111111111</ItemID>
                    </Item>
                    <QuantityPurchased>1</QuantityPurchased>
                    <TransactionID>222222222222</TransactionID>
                    <SellerPaidStatus>PaidWithPayPal</SellerPaidStatus>
                    <ShippedTime>1985-08-19T18:16:35.000Z</ShippedTime>
                    <FeedbackLeft>
                      <CommentType>Positive</CommentType>
                    </FeedbackLeft>
                    <FeedbackReceived>
                      <CommentType>Positive</CommentType>
                    </FeedbackReceived>
                    <Buyer>
                      <UserID>gideon</UserID>
                    </Buyer>
                  </Transaction>
                </TransactionArray>
              </Order>
            </OrderTransaction>
          </OrderTransactionArray>
        </SoldList>
      </GetMyeBaySellingResponse>;

    let parsedResponse =
      TradingApi._parseGetMyeBaySellingResponse(xmlTree.toXMLString());
    // now we can convert the item list from a hash to a regular array
    let items = [];
    for each (let [itemId, item] in Iterator(parsedResponse.items)) {
      items.push(item);
    }

    assert(items.length == 4,
           "GetMyeBaySelling extracted wrong number of item IDs: " +
           items.length);

    assertProperty(items[0], "itemId", 000000000000);
    assertProperty(items[0], "userMaxBid", 0);
    assertProperty(items[0], "userQuantityBidFor", 0);

    assertProperty(items[1], "itemId", 111111111111);
    assertProperty(items[1], "userMaxBid", 0);
    assertProperty(items[1], "userQuantityBidFor", 0);

    assertProperty(items[2], "itemId", 222222222222);
    assertProperty(items[2], "userMaxBid", 0);
    assertProperty(items[2], "userQuantityBidFor", 0);

    assertProperty(items[3], "itemId", 333333333333);
    assertProperty(items[3], "userMaxBid", 0);
    assertProperty(items[3], "userQuantityBidFor", 0);

    let transactions = parsedResponse.transactions;

    assert(transactions.length == 2,
           "GetMyeBayBuying extracted wrong number of transactions: " +
           transactions.length);
    assertProperty(transactions[0], "itemId", 000000000000);
    assertProperty(transactions[0], "transactionId", 111111111111);
    assertProperty(transactions[0], "creationTime",
                   Date.parse("20 June 2008 18:16:35 GMT"));
    assertProperty(transactions[0], "quantityPurchased", 1);
    assertProperty(transactions[0], "buyerUserId", "gideon");
    assertProperty(transactions[0], "isPaidFor", false);
    assertProperty(transactions[0], "isShipped", false);
    assertProperty(transactions[0], "userHasSentFeedback", false);
    assertProperty(transactions[0], "userHasReceivedFeedback", false);
    assertProperty(transactions[0], "feedbackReceivedType", "");

    assertProperty(transactions[1], "itemId", 111111111111);
    assertProperty(transactions[1], "transactionId", 222222222222);
    assertProperty(transactions[1], "creationTime",
                   Date.parse("20 June 2008 18:16:35 GMT"));
    assertProperty(transactions[1], "quantityPurchased", 1);
    assertProperty(transactions[1], "buyerUserId", "gideon");
    assertProperty(transactions[1], "isPaidFor", true);
    assertProperty(transactions[1], "isShipped", true);
    assertProperty(transactions[1], "userHasSentFeedback", true);
    assertProperty(transactions[1], "userHasReceivedFeedback", true);
    assertProperty(transactions[1], "feedbackReceivedType", "Positive");
  },

  /**
   * Checks that GetItem responses are correctly parsed
   */
  checkGetItem : function() {
    // FixedPriceItem
    let xmlTree =
      <GetItemResponse>
        <Timestamp>2008-07-30T14:49:08.362Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <Item>
          <BuyItNowPrice currencyID="GBP">0.0</BuyItNowPrice>
          <ItemID>110033589813</ItemID>
          <ListingDetails>
            <StartTime>2008-07-24T14:50:01.000Z</StartTime>
            <EndTime>2008-07-31T14:50:01.000Z</EndTime>
            <RelistedItemID>1234567890</RelistedItemID>
          </ListingDetails>
          <ListingType>FixedPriceItem</ListingType>
          <Quantity>1</Quantity>
          <Seller>
            <FeedbackScore>500</FeedbackScore>
            <UserID>testuser_ssbuk5</UserID>
          </Seller>
          <SellingStatus>
            <BidCount>0</BidCount>
            <CurrentPrice currencyID="GBP">0.99</CurrentPrice>
            <QuantitySold>0</QuantitySold>
            <ReserveMet>false</ReserveMet>
          </SellingStatus>
          <TimeLeft>P1DT53S</TimeLeft>
          <Title>Test Title</Title>
          <HitCount>0</HitCount>
          <PictureDetails/>
        </Item>
      </GetItemResponse>

    let item = new Item(000000000000);
    item = TradingApi._parseGetItemResponse(item, xmlTree);

    assertProperty(item, "title", "Test Title");
    assertProperty(item, "sellerUserId", "testuser_ssbuk5");
    assertProperty(item, "isEnded", false);
    assertProperty(item, "listingFormat", "FixedPriceItem");
    assertProperty(item, "currentPrice", 0.99);
    assertProperty(item, "currency", "GBP");
    assertProperty(item, "quantitySold", 0);
    assertProperty(item, "quantityRemaining", 1);
    assertProperty(item, "startTime", Date.parse("24 Jul 2008 14:50:01 GMT"));
    assertProperty(item, "endTime", Date.parse("31 Jul 2008 14:50:01 GMT"));
    assertProperty(item, "imageUrl", "");
    assertProperty(item, "pageViews", 0);
    assertProperty(item, "hasBuyItNow", true);
    assertProperty(item, "buyItNowPrice", 0.99);
    assertProperty(item, "numBids", 0);
    assertProperty(item, "isReserveMet", false);
    assertProperty(item, "sellerFeedbackRating", 500);
    assertProperty(item, "numWatching", 0);
    assertProperty(item, "relistedItemId", 1234567890);

    // Chinese auction
    xmlTree =
      <GetItemResponse>
        <Timestamp>2008-07-30T15:23:20.591Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <Item>
          <BuyItNowPrice currencyID="GBP">500.0</BuyItNowPrice>
          <ItemID>110033122196</ItemID>
          <ListingDetails>
            <StartTime>2008-07-11T20:35:33.000Z</StartTime>
            <EndTime>2008-07-18T20:35:33.000Z</EndTime>
            <BuyItNowAvailable>true</BuyItNowAvailable>
          </ListingDetails>
          <ListingType>Chinese</ListingType>
          <Quantity>1</Quantity>
          <Seller>
            <FeedbackScore>3</FeedbackScore>
            <UserID>testmaster5</UserID>
          </Seller>
          <SellingStatus>
            <BidCount>0</BidCount>
            <CurrentPrice currencyID="GBP">0.01</CurrentPrice>
            <QuantitySold>0</QuantitySold>
            <ReserveMet>true</ReserveMet>
          </SellingStatus>
          <TimeLeft>PT0S</TimeLeft>
          <Title>test len uk 1</Title>
          <HitCount>0</HitCount>
          <PictureDetails>
            <GalleryURL>http://www.danns.co.uk</GalleryURL>
          </PictureDetails>
        </Item>
      </GetItemResponse>;

    item = new Item(000000000000);
    item = TradingApi._parseGetItemResponse(item, xmlTree);

    assertProperty(item, "hasBuyItNow", true);
    assertProperty(item, "buyItNowPrice", 500);
    assertProperty(item, "currentPrice", 0.01);
    assertProperty(item, "currency", "GBP");
    assertProperty(item, "imageUrl", "http://www.danns.co.uk");
    assertProperty(item, "isEnded", true);

    // Chinese auction with BIN disabled (bids > 0)
    xmlTree =
      <GetItemResponse>
        <Timestamp>2008-07-30T15:23:20.591Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <Item>
          <BuyItNowPrice currencyID="GBP">500.0</BuyItNowPrice>
          <ItemID>110033122196</ItemID>
          <ListingDetails>
            <StartTime>2008-07-11T20:35:33.000Z</StartTime>
            <EndTime>2008-07-18T20:35:33.000Z</EndTime>
            <BuyItNowAvailable>false</BuyItNowAvailable>
          </ListingDetails>
          <ListingType>Chinese</ListingType>
          <Quantity>1</Quantity>
          <Seller>
            <FeedbackScore>3</FeedbackScore>
            <UserID>testmaster5</UserID>
          </Seller>
          <SellingStatus>
            <BidCount>1</BidCount>
            <CurrentPrice currencyID="GBP">0.01</CurrentPrice>
            <QuantitySold>0</QuantitySold>
            <ReserveMet>true</ReserveMet>
          </SellingStatus>
          <TimeLeft>PT1S</TimeLeft>
          <Title>test len uk 1</Title>
          <HitCount>0</HitCount>
          <PictureDetails/>
        </Item>
      </GetItemResponse>;

    item = new Item(000000000000);
    item = TradingApi._parseGetItemResponse(item, xmlTree);

    assertProperty(item, "hasBuyItNow", false);

    // Dutch auction
    xmlTree =
      <GetItemResponse>
        <Timestamp>2008-07-30T16:41:08.138Z</Timestamp>
        <Ack>Success</Ack>
        <Version>573</Version>
        <Build>e573_intl_Bundled_6934817_R1</Build>
        <Item>
          <BuyItNowPrice currencyID="USD">0.0</BuyItNowPrice>
          <ItemID>110033788727</ItemID>
          <ListingDetails>
            <StartTime>2008-07-30T07:31:51.000Z</StartTime>
            <EndTime>2008-07-31T07:31:51.000Z</EndTime>
          </ListingDetails>
          <ListingType>Dutch</ListingType>
          <Quantity>3</Quantity>
          <Seller>
            <FeedbackScore>30</FeedbackScore>
            <UserID>testps01</UserID>
          </Seller>
          <SellingStatus>
            <BidCount>0</BidCount>
            <CurrentPrice currencyID="USD">0.99</CurrentPrice>
            <QuantitySold>1</QuantitySold>
            <ReserveMet>true</ReserveMet>
          </SellingStatus>
          <TimeLeft>PT14H50M43S</TimeLeft>
          <Title>Test Title Dutch</Title>
          <HitCount>0</HitCount>
          <PictureDetails/>
        </Item>
        <HardExpirationWarning>2005-01-14 03:34:00</HardExpirationWarning>
      </GetItemResponse>;

    // Token expiry test
    let expiring = false;
    let checkTokenExpiry = function(subject, topic, data) {
      Observers.remove(checkTokenExpiry,
                       "ebay-tradingapi-token-expiry-imminent");
      expiring = true;
      assert(subject.getTime() == Date.parse("14 Jan 2005 03:34:00 GMT"),
             "Token expiration time is incorrect.");
    }
    Observers.add(checkTokenExpiry, "ebay-tradingapi-token-expiry-imminent");

    // Other
    item = new Item(000000000000);
    item = TradingApi._parseGetItemResponse(item, xmlTree);

    assertProperty(item, "currency", "USD");
    assertProperty(item, "quantityRemaining", 2);
    assertProperty(item, "hasBuyItNow", false);
    assert(expiring, "GetItem didn't catch imminent token expiry.");
  }
};

/**
 * Unit tests for storage module
 */
UnitTests.Storage = {
  /**
   * start
   */
  start : function() {
    let account = ObjectsStorage.activeAccount();
    if (account) {
      let items = ObjectsStorage.itemsForAccount(account);
      for (let i = 0; i < items.length; i++) {
        Debugger._checkObjectMembers(items[i]);
      }
    }
  }
}

/**
 * Asserts that the given object has the given value for the given property
 */
function assertProperty(object, property, value) {
  assert(object.get(property) == value,
         object.constructor.name + " object property " +
         property + " is " + object.get(property) + ", should be " + value,
         Components.stack.caller.lineNumber);
}

/**
 * If the given boolean is not true, logs an error
 * @param condition Boolean to check
 * @param failureMessage Message to display on failure
 * @param lineNumber Calculated from calling method if not supplied
 */
function assert(condition, failureMessage, lineNumber) {
  if (!condition) {
    if (!lineNumber) {
      lineNumber = Components.stack.caller.lineNumber;
    }
    if (!failureMessage) failureMessage = "(no failure message)";
    Logger.error("Unit test failure: " + failureMessage +
                 " (line " + lineNumber + ")");
  }
}


Debugger._init();
