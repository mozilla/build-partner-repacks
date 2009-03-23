/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{A9492229-CAC6-438A-BDD9-B3E22D935789}");
const CLASS_NAME = "eBay Companion Item";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-item;1";
// types of listing.
const EBAYCOMP_LISTING_TYPE_CHINESE = "Chinese";
const EBAYCOMP_LISTING_TYPE_DUTCH = "Dutch";
const EBAYCOMP_LISTING_TYPE_LIVE = "Live";
const EBAYCOMP_LISTING_TYPE_FIXED = "FixedPriceItem";
const EBAYCOMP_LISTING_TYPE_STORE_FIXED = "StoresFixedPrice";
const EBAYCOMP_LISTING_TYPE_CLASSIFIED = "AdType";
const EBAYCOMP_LISTING_TYPE_LEAD_GENERATION = "LeadGeneration";
// paying status.
const EBAYCOMP_PAY_STATUS_NOT_PAID = "NotPaid";
const EBAYCOMP_PAY_STATUS_NOT_CHECKED_OUT = "BuyerHasNotCompletedCheckout";
// shipping contants.
const EBAYCOMP_SHIP_TO_LOCATIONS_NONE = "None";
const EBAYCOMP_SHIPPING_TYPE_FLAT = "Flat";
const EBAYCOMP_SHIPPING_TYPE_UNSPECIFIED = "NotSpecified";
// regular expressions used to parse dates.
const EBAYCOMP_TIMESTAMP_REGEXP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;
const EBAYCOMP_TIMESTAMP_REPLACE = "$2 $3 $1 $4:$5:$6 GMT";

/**
 * Represents an eBay item.
 * @author Jorge Villalobos Glaxstar Corp.
 */
function EbayItem() {
  this._init();
}

EbayItem.prototype = {
  /* Log service. */
  _logService : null,
  /* Datasource service. */
  _dsService : null,
  /* User service. */
  _userService : null,
  /* The RDF item that corresponds to the ebay item. */
  _rdfItem : null,
  /* The id of the item. */
  _id : null,
  /* The type of the item. */
  _type : -1,
  /* The title of the item. */
  _title : null,
  /* The URL of the picture of the item. */
  _pictureURL : null,
  /* The listing type of the item. */
  _listingType : false,
  /* The currency of the price of the item. */
  _priceCurrency : null,
  /* The currency of the converted price of the item. */
  _convertedPriceCurrency : null,
  /* The last time left string. */
  _lastTimeLeftString : null,
  /* The last time left object. */
  _lastTimeLeft : null,
  /* The last value for the hidden property. */
  _lastIsHidden : false,
  /* The last value for the isDuplicate property. */
  _lastIsDuplicate : false,
  /* The start time for the item. */
  _startTime : null,
  /* The end time for the item. */
  _endTime : null,
  /* Indicates whether the end time is properly set or it's an approximation. */
  _endTimeSet : false,
  /* The id of the transaction for the purchase of the item (depends on type).
     */
  _transactionId : null,
  /* The amount of available items. */
  _quantityAvailable : 0,
  /* The currency of the current max bid for the item. */
  _maxBidCurrency : null,
  /* The amount of the current max bid for the item. */
  _maxBidAmount : null,
  /* The currency of the converted current max bid for the item. */
  _convertedMaxBidCurrency : null,
  /* The amount of the converted current max bid for the item. */
  _convertedMaxBidAmount : null,
  /* The currency of the Buy-It-Now price of the item. */
  _buyItNowPriceCurrency : null,
  /* The amount of the Buy-It-Now price of the item. */
  _buyItNowPriceAmount : null,
  /* The currency of the converted Buy-It-Now price of the item. */
  _convertedBuyItNowPriceCurrency : null,
  /* The amount of the converted Buy-It-Now price of the item. */
  _convertedBuyItNowPriceAmount : null,

  /**
   * Initializes the component.
   */
  _init : function() {
    //dump("EbayItem._init().\n");
    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._dsService =
      CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
        getService(CI.gsIAutotraderDatasourceService);
    this._userService =
      CC["@glaxstar.org/autotrader/ebay-user-service;1"].
        getService(CI.gsIEbayUserService);
  },

  /**
   * Object constructor.
   * @param aItem RDF reference to the item.
   */
  init : function(aItem) {
    this._logService.debug("Begin: EbayItem.init");

    var quantityAvailableProp =
      this._dsService.getItemProperty(aItem, "quantity-available");

    this._rdfItem = aItem;
    this._id = this._dsService.getItemProperty(aItem, "item-id");
    this._type = this._dsService.getItemType(aItem);
    this._title = this._dsService.getItemProperty(aItem, "title");
    this._pictureURL = this._dsService.getItemProperty(aItem, "picture-url");
    this._listingType = this._dsService.getItemProperty(aItem, "listing-type");
    this._priceCurrency =
      this._dsService.getItemProperty(aItem, "current-price-currency");
    this._convertedPriceCurrency =
      this._dsService.getItemProperty(
        aItem, "converted-current-price-currency");
    this._startTime =
      this._convertToTimestamp(
        this._dsService.getItemProperty(aItem, "listing-start-time"));
    this._endTime =
      this._convertToTimestamp(
        this._dsService.getItemProperty(aItem, "listing-end-time"));
    this._endTimeSet = (this._endTime > 0);
    this._quantityAvailable =
      (quantityAvailableProp != "" ? parseInt(quantityAvailableProp, 10) : 0);
    this._maxBidCurrency =
      this._dsService.getItemProperty(aItem, "max-bid-currency");
    this._convertedMaxBidCurrency =
      this._dsService.getItemProperty(aItem, "converted-max-bid-currency");
    this._buyItNowPriceCurrency =
      this._dsService.getItemProperty(aItem, "buy-it-now-price-currency");
    this._buyItNowPriceAmount =
      this._dsService.getItemProperty(aItem, "buy-it-now-price-amount");
    this._convertedBuyItNowPriceCurrency =
      this._dsService.getItemProperty(
        aItem, "converted-buy-it-now-price-currency");
    this._convertedBuyItNowPriceAmount =
      this._dsService.getItemProperty(
        aItem, "converted-buy-it-now-price-amount");
    this._transactionId =
      this._dsService.getItemProperty(aItem, "transaction-id");
  },

  /**
   * Converts an ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SS.SSSZ) to a Javascript
   * date timestamp (milliseconds since the Epoch).
   * @param aDateString an ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SS.SSSZ).
   * @return the equivalent Javascript date timestamp.
   */
  _convertToTimestamp : function(aDateString) {
    var converted = 0;

    if (aDateString && aDateString != "") {
      var dateToParse =
        aDateString.replace(
          EBAYCOMP_TIMESTAMP_REGEXP, EBAYCOMP_TIMESTAMP_REPLACE);

      if (dateToParse) {
        converted = (new Date(dateToParse)).getTime();
      }
    }

    return converted;
  },

  /**
   * Indicates whether this item is equal to the given item. Equal items can
   * have different values in their properties, equality just means they are the
   * same item on the same list.
   * @param aEbayItem the item to compare this object with.
   * @return true is both items are equal. false otherwise.
   */
  equals : function(aEbayItem) {
    this._logService.debug("Begin: EbayItem.equals");
    return (this.id == aEbayItem.id && this.type == aEbayItem.type);
  },

  /**
   * Reset a property.
   * @param aType the type of property.
   */
  resetProperty: function(aType) {
    this._logService.debug("Begin: EbayItem.resetProperty");

    switch (aType) {
      case CI.gsIAutotraderItem.PROPERTY_IS_HIDDEN:
        this._lastIsHidden = false;
        break;
      case CI.gsIAutotraderItem.PROPERTY_IS_DUPLICATE:
        this._lastIsDuplicate = false;
        break;
    }
  },

  /**
   * Obtains the id of the item.
   * @returns the id of the item.
   */
  get id() {
    this._logService.trace("Begin: EbayItem.get id");
    return this._id;
  },

  /**
   * Obtains the type of the item.
   * @returns the type of the item.
   */
  get type() {
    this._logService.trace("Begin: EbayItem.get type");
    return this._type;
  },

  /**
   * Obtains the title of the item.
   * @returns the title of the item.
   */
  get title() {
    this._logService.trace("Begin: EbayItem.get title");
    return this._title;
  },

  /**
   * Obtains the URL of the picture of the item.
   * @returns the URL of the picture of the item.
   */
  get pictureURL() {
    this._logService.trace("Begin: EbayItem.get pictureURL");
    return this._pictureURL;
  },

  /**
   * Indicates if this user can place a bid on the item.
   * @returns true if this user can place a bid on the item. false otherwise.
   */
  get canBid() {
    this._logService.trace("Begin: EbayItem.get canBid");

    var result =
      (EBAYCOMP_LISTING_TYPE_CHINESE == this._listingType ||
       EBAYCOMP_LISTING_TYPE_DUTCH == this._listingType ||
       EBAYCOMP_LISTING_TYPE_LIVE == this._listingType);

    return result;
  },

  /**
   * Indicates if this user can use the Buy It Now option on the item.
   * @returns true if this user can use the Buy It Now option on the item. false
   * otherwise.
   */
  get canBuyItNow() {
    this._logService.trace("Begin: EbayItem.get canBuyItNow");

    var result =
      ((EBAYCOMP_LISTING_TYPE_FIXED == this._listingType) ||
       (EBAYCOMP_LISTING_TYPE_STORE_FIXED == this._listingType) ||
       ((null != this._buyItNowPriceCurrency) &&
        ("" != this._buyItNowPriceCurrency)));

    return result;
  },

  /**
   * Indicates if this listing is a classified ad.
   * @returns true if this listing is a classified ad. false otherwise.
   */
  get isClassified() {
    this._logService.trace("Begin: EbayItem.get isClassified");

    var classified =
      (EBAYCOMP_LISTING_TYPE_CLASSIFIED == this._listingType ||
       EBAYCOMP_LISTING_TYPE_LEAD_GENERATION == this._listingType);

    return classified;
  },

  /**
   * Indicates if this listing is a multiple item listing.
   * @returns true if this listing is a multiple item listing. false otherwise.
   */
  get isMultipleItem() {
    this._logService.trace("Begin: EbayItem.get isMultipleItem");
    return (EBAYCOMP_LISTING_TYPE_DUTCH == this._listingType);
  },

  /**
   * Obtains the number of bids on the item.
   * @returns the number of bids on the item.
   */
  get bidCount() {
    this._logService.trace("Begin: EbayItem.get bidCount");

    var bidCountProp =
      this._dsService.getItemProperty(this._rdfItem, "bid-count");

    return (bidCountProp != "" ? parseInt(bidCountProp, 10) : 0);
  },

  /**
   * Obtains the number of watchers for the item.
   * @returns the number of watchers for the item.
   */
  get watchCount() {
    this._logService.trace("Begin: EbayItem.get watchCount");

    var watchCountProp =
      this._dsService.getItemProperty(this._rdfItem, "watch-count");

    return (watchCountProp != "" ? parseInt(watchCountProp, 10) : -1);
  },

  /**
   * Obtains the number of views for the item.
   * @returns the number of views for the item.
   */
  get hitCount() {
    this._logService.trace("Begin: EbayItem.get hitCount");

    var hitCountProp =
      this._dsService.getItemProperty(this._rdfItem, "hit-count");

    return (hitCountProp != "" ? parseInt(hitCountProp, 10) : -1);
  },

  /**
   * Indicates if this user is the high bidder for this item.
   * @returns true if this user is the high bidder for this item. false
   * otherwise.
   */
  get isHighBidder() {
    this._logService.trace("Begin: EbayItem.get isHighBidder");

    var result = false;
    var session = this._userService.userSession;
    var currentUser = null;
    var highBidder;

    if (session) {
      highBidder =
        this._dsService.getItemProperty(this._rdfItem, "high-bidder");
      // XXX: the high bidder is always in lowser case but the login username
      // has mixed cases.
      result = (highBidder == session.username.toLowerCase());
    }

    return result;
  },

  /**
   * Obtains the currency of the price of the item.
   * @returns the currency of the price of the item.
   */
  get priceCurrency() {
    this._logService.trace("Begin: EbayItem.get priceCurrency");
    return this._priceCurrency;
  },

  /**
   * Obtains the amount of the price of the item.
   * @returns the amount of the price of the item.
   */
  get priceAmount() {
    this._logService.trace("Begin: EbayItem.get priceAmount");

    var result =
      this._dsService.getItemProperty(this._rdfItem, "current-price-amount");

    return result;
  },

  /**
   * Obtains the currency of the converted price of the item.
   * @returns the currency of the converted price of the item.
   */
  get convertedPriceCurrency() {
    this._logService.trace("Begin: EbayItem.get convertedPriceCurrency");
    return this._convertedPriceCurrency;
  },

  /**
   * Obtains the amount of the converted price of the item.
   * @returns the amount of the converted price of the item.
   */
  get convertedPriceAmount() {
    this._logService.trace("Begin: EbayItem.get convertedPriceAmount");

    var result =
      this._dsService.getItemProperty(
        this._rdfItem, "converted-current-price-amount");

    return result;
  },

  /**
   * Obtains the time left for the item.
   * @returns the time left for the item.
   */
  get timeLeft() {
    this._logService.trace("Begin: EbayItem.get timeLeft");

    var timeLeftProp =
      this._dsService.getItemProperty(this._rdfItem, "time-left");
    // only create the object when necessary.
    if (this._lastTimeLeftString != timeLeftProp) {
      this._lastTimeLeft =
        CC["@glaxstar.org/autotrader/autotrader-time-interval;1"].
          createInstance(CI.gsIAutotraderTimeInterval);
      this._lastTimeLeftString =
        (timeLeftProp != "" ? timeLeftProp :
         this._lastTimeLeft.ZERO_INTERVAL_STRING);
      this._lastTimeLeft.init(this._lastTimeLeftString);
    }

    return this._lastTimeLeft;
  },

  /**
   * Indicates if the item is hidden.
   * @returns true if the item is hidden. false otherwise.
   */
  get hidden() {
    this._logService.trace("Begin: EbayItem.get hidden");

    if (!this._lastIsHidden) {
      this._lastIsHidden = this._dsService.isHidden(this._id, this._type);
    }

    return this._lastIsHidden;
  },

  /**
   * Indicates if the item is a duplicate.
   * @returns true if the item is a duplicate. false otherwise.
   */
  get isDuplicate() {
    this._logService.trace("Begin: EbayItem.get isDuplicate");

    if (!this._lastIsDuplicate) {
      this._lastIsDuplicate = this._dsService.isDuplicate(this._id, this._type);
    }

    return this._lastIsDuplicate;
  },

  /**
   * Indicates that the user has to pay for this item.
   * @returns true if the user has to pay for this item. false otherwise.
   */
  get hasToPay() {
    this._logService.trace("Begin: EbayItem.get hasToPay");

    var paymentStatus =
      this._dsService.getItemProperty(this._rdfItem, "paid-status");

    var result =
      (EBAYCOMP_PAY_STATUS_NOT_PAID == paymentStatus ||
       EBAYCOMP_PAY_STATUS_NOT_CHECKED_OUT == paymentStatus);

    return result;
  },

  /**
   * Indicates that the seller has marked the item as sent.
   * @returns true if the seller has sent the item
   */
  get hasBeenSent() {
    var shippedTime;

    this._logService.trace("Begin: EbayItem.get hasBeenSent");

    shippedTime =
      this._dsService.getItemProperty(this._rdfItem, "shipped-time");

    return (shippedTime != "");
  },

  /**
   * Indicates that the user has left feedback for this item.
   * @returns true if the user has left feedback
   */
  get hasLeftFeedback() {
    var feedbackLeft;

    this._logService.trace("Begin: EbayItem.get hasLeftFeedback");

    feedbackLeft =
      this._dsService.getItemProperty(this._rdfItem, "feedback-left");

    return (feedbackLeft != "");
  },

  /**
   * Indicates if the reserve has been met for this item.
   * @returns true if the reserve has been met for this item.
   */
  get isReserveMet() {
    this._logService.trace("Begin: EbayItem.get isReserveMet");

    var reserveMetProp =
      this._dsService.getItemProperty(this._rdfItem, "reserve-met");

    return (reserveMetProp == "true");
  },

  /**
   * Obtains the start time for the item.
   * @returns the start time for the item.
   */
  get startTime() {
    this._logService.trace("Begin: EbayItem.get startTime");
    return this._startTime;
  },

  /**
   * Obtains the end time for the item.
   * @returns the end time for the item.
   */
  get endTime() {
    this._logService.trace("Begin: EbayItem.get endTime");

    var timeLeftInt = this.timeLeft;

    if (!this._endTimeSet) {
      this._endTime =
        this._convertToTimestamp(
          this._dsService.getItemProperty(this._rdfItem, "listing-end-time"));
      this._endTimeSet = (this._endTime > 0);
    }

    if (!this._endTimeSet && timeLeftInt.isPositive()) {
      // XXX: calculate the time offset in milliseconds. Note this is an
      // approximation, to keep things simple. We're using 30 day months, which
      // is not correct. But since there are almost no listings that take this
      // long, and refresh rates are within an hour, it shouldn't be a big
      // issue.
      var offset =
        ((((((((timeLeftInt.getItem(0) * 12) + timeLeftInt.getItem(1)) * 30 +
                timeLeftInt.getItem(2)) * 24) + timeLeftInt.getItem(3)) * 60) +
                timeLeftInt.getItem(4)) * 60 + timeLeftInt.getItem(5)) * 1000;

      this._endTime = (new Date()).getTime() + offset;
    }

    return this._endTime;
  },

  /**
   * Obtains the id of the buyer or seller of the item (depends on type).
   * @returns the id of the buyer or seller of the item (depends on type).
   */
  get userId() {
    this._logService.trace("Begin: EbayItem.get userId");

    var userIdPropName;

    if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_UNSOLD != this._type) {
      userIdPropName = "seller-id";
    } else if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD == this._type) {
      userIdPropName = "buyer-id";
    } else {
      userIdPropName = "high-bidder";
    }

    return this._dsService.getItemProperty(this._rdfItem, userIdPropName);
  },

  /**
   * Obtains the feedback score of the buyer or seller of the item (depends on
   * type).
   * @returns the feedback score of the buyer or seller of the item (depends on
   * type).
   */
  get feedbackScore() {
    this._logService.trace("Begin: EbayItem.get feedbackScore");

    var result;
    var feedbackScorePropName;
    var feedbackScoreProp;

    if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_UNSOLD != this._type) {
      feedbackScorePropName = "seller-feedback-score";
    } else {
      feedbackScorePropName = "bidder-feedback-score";
    }

    feedbackScoreProp =
      this._dsService.getItemProperty(this._rdfItem, feedbackScorePropName);
    result =
      (feedbackScoreProp != "" ? parseInt(feedbackScoreProp, 10) :
       CI.gsIAutotraderItem.FEEDBACK_SCORE_NONE);

    return result;
  },

  /**
   * Obtains the feedback star of the buyer or seller of the item (depends on
   * type).
   * @returns the feedback star of the buyer or seller of the item (depends on
   * type).
   */
  get feedbackStar() {
    this._logService.trace("Begin: EbayItem.get feedbackStar");

    var feedbackStarStr;
    var result;

    if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD != this._type &&
        CI.gsIAutotraderDatasourceService.ITEM_TYPE_UNSOLD != this._type) {
      feedbackStarStr =
        this._dsService.getItemProperty(
          this._rdfItem, "seller-feedback-rating-star");
    } else {
      feedbackStarStr =
        this._dsService.getItemProperty(
          this._rdfItem, "bidder-feedback-rating-star");
    }

    return feedbackStarStr;
  },

  /**
   * Obtains the id of the transaction for the purchase of the item (depends on
   * type).
   * @returns the id of the transaction for the purchase of the item (depends on
   * type).
   */
  get transactionId() {
    this._logService.trace("Begin: EbayItem.get transactionId");
    return ((this._transactionId != "") ? this._transactionId : null);
  },

  /**
   * Obtains the amount of available items.
   * @returns the amount of available items.
   */
  get quantityAvailable() {
    this._logService.trace("Begin: EbayItem.get quantityAvailable");
    return this._quantityAvailable;
  },

  /**
   * Obtains the amount of items the user is bidding on.
   * @returns the amount of items the user is bidding on. -1 if not applicable.
   */
  get quantityBid() {
    this._logService.trace("Begin: EbayItem.get quantityBid");

    var quantityBidProp =
      this._dsService.getItemProperty(this._rdfItem, "quantity-bid");

    return (quantityBidProp != "" ? parseInt(quantityBidProp, 10) : -1);
  },

  /**
   * Obtains the amount of items the user is winning or has won.
   * @returns the amount of items the user is winning or has won. -1 if not
   * applicable.
   */
  get quantityWon() {
    this._logService.trace("Begin: EbayItem.get quantityWon");

    var quantity = -1;
    var quantityPurchasedProp =
      this._dsService.getItemProperty(this._rdfItem, "quantity-purchased");

    if (quantityPurchasedProp != "") {
      quantity = parseInt(quantityPurchasedProp, 10);
    } else {
      var quantityWonProp =
        this._dsService.getItemProperty(this._rdfItem, "quantity-won");

      quantity = (quantityWonProp != "" ? parseInt(quantityWonProp, 10) : -1);
    }

    return quantity;
  },

  /**
   * Obtains the currency of the current max bid for the item.
   * @returns the currency of the current max bid for the item.
   */
  get maxBidCurrency() {
    this._logService.trace("Begin: EbayItem.get maxBidCurrency");
    return this._maxBidCurrency;
  },

  /**
   * Obtains the amount of the current max bid for the item.
   * @returns the amount of the current max bid for the item.
   */
  get maxBidAmount() {
    this._logService.trace("Begin: EbayItem.get maxBidAmount");

    var result =
      this._dsService.getItemProperty(this._rdfItem, "max-bid-amount");

    return result;
  },

  /**
   * Obtains the currency of the converted current max bid for the item.
   * @returns the currency of the converted current max bid for the item.
   */
  get convertedMaxBidCurrency() {
    this._logService.trace("Begin: EbayItem.get convertedMaxBidCurrency");
    return this._convertedMaxBidCurrency;
  },

  /**
   * Obtains the amount of the converted current max bid for the item.
   * @returns the amount of the converted current max bid for the item.
   */
  get convertedMaxBidAmount() {
    this._logService.trace("Begin: EbayItem.get convertedMaxBidAmount");

    var result =
      this._dsService.getItemProperty(
        this._rdfItem, "converted-max-bid-amount");

    return result;
  },

  /**
   * Obtains the type of shipping cost.
   * @returns the type of shipping cost. It can be any of the SHIPPING_COST_TYPE
   * constants.
   */
  get shippingCostType() {
    this._logService.trace("Begin: EbayItem.get shippingCostType");

    var shippingType = -1;
    var seeDescriptionProp =
      this._dsService.getItemProperty(
        this._rdfItem, "shipping-terms-in-description");

    if ("true" != seeDescriptionProp) {
      var shipToLocationsProp =
        this._dsService.getItemProperty(this._rdfItem, "ship-to-locations");

      if (EBAYCOMP_SHIP_TO_LOCATIONS_NONE != shipToLocationsProp) {
        var shippingTypeProp =
          this._dsService.getItemProperty(this._rdfItem, "shipping-type");

        switch (shippingTypeProp) {
          case EBAYCOMP_SHIPPING_TYPE_FLAT:
            shippingType = CI.gsIAutotraderItem.SHIPPING_COST_TYPE_FLAT;
            break;
          case EBAYCOMP_SHIPPING_TYPE_UNSPECIFIED:
          case "":
            shippingType = CI.gsIAutotraderItem.SHIPPING_COST_TYPE_UNSPECIFIED;
            break;
          default:
            shippingType = CI.gsIAutotraderItem.SHIPPING_COST_TYPE_CALCULATED;
            break;
        }
      } else {
        shippingType = CI.gsIAutotraderItem.SHIPPING_COST_TYPE_PICK_UP_ONLY;
      }
    } else {
      shippingType = CI.gsIAutotraderItem.SHIPPING_COST_TYPE_SEE_DESCRIPTION;
    }

    if (-1 == shippingType) {
      this._logService.error(
        "An error occurred determining the shipping cost type");
    }

    return shippingType;
  },

  /**
   * Obtains the currency of the shipping cost of the item.
   * @returns the currency of the shipping cost of the item.
   */
  get shippingCostCurrency() {
    this._logService.trace("Begin: EbayItem.get shippingCostCurrency");

    var shippingCostCurrencyProp =
      this._dsService.getItemProperty(this._rdfItem, "shipping-cost-currency");

    return shippingCostCurrencyProp;
  },

  /**
   * Obtains the amount of the shipping cost of the item.
   * @returns the amount of the shipping cost of the item.
   */
  get shippingCostAmount() {
    this._logService.trace("Begin: EbayItem.get shippingCostAmount");

    var shippingCostAmountProp =
      this._dsService.getItemProperty(this._rdfItem, "shipping-cost-amount");

    return shippingCostAmountProp;
  },

  /**
   * Obtains the currency of the Buy-It-Now price of the item.
   * @returns the currency of the Buy-It-Now price of the item.
   */
  get buyItNowPriceCurrency() {
    this._logService.trace("Begin: EbayItem.get buyItNowPriceCurrency");
    return this._buyItNowPriceCurrency;
  },

  /**
   * Obtains the amount of the Buy-It-Now price of the item.
   * @returns the amount of the Buy-It-Now price of the item.
   */
  get buyItNowPriceAmount() {
    this._logService.trace("Begin: EbayItem.get buyItNowPriceAmount");
    return this._buyItNowPriceAmount;
  },

  /**
   * Obtains the currency of the converted Buy-It-Now price of the item.
   * @returns the currency of the converted Buy-It-Now price of the item.
   */
  get convertedBuyItNowPriceCurrency() {
    this._logService.trace(
      "Begin: EbayItem.get convertedBuyItNowPriceCurrency");
    return this._convertedBuyItNowPriceCurrency;
  },

  /**
   * Obtains the amount of the converted Buy-It-Now price of the item.
   * @returns the amount of the converted Buy-It-Now price of the item.
   */
  get convertedBuyItNowPriceAmount() {
    this._logService.trace(
      "Begin: EbayItem.get convertedBuyItNowPriceAmount");
    return this._convertedBuyItNowPriceAmount;
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderItem) && !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
};

/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var EbayItemFactory = {
  /**
   * Creates an instance of the class associated with this factory.
   * @param aOuter pointer to a component that wishes to be aggregated in the
   * resulting instance. This can be nsnull if no aggregation is requested.
   * @param aIID the interface type to be returned.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NO_AGGREGATION if aOuter is not null. This component
   * doesn't support aggregation.
   */
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw CR.NS_ERROR_NO_AGGREGATION;
    }

    return (new EbayItem()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayItemModule = {
  /**
   * When the nsIModule is discovered, this method will be called so that any
   * setup registration can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   * @param aType loader type being used to load this module.
   */
  registerSelf : function(aCompMgr, aLocation, aLoaderStr, aType) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      CLASS_ID, CLASS_NAME, CONTRACT_ID, aLocation, aLoaderStr, aType);
  },

  /**
   * When the nsIModule is being unregistered, this method will be called so
   * that any cleanup can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   */
  unregisterSelf : function (aCompMgr, aLocation, aLoaderStr) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  },

  /**
   * This method returns a class object for a given ClassID and IID.
   * @param aCompMgr the global component manager.
   * @param aClass the ClassID of the object instance requested.
   * @param aIID the IID of the object instance requested.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NOT_IMPLEMENTED if aIID is inadequate.
   * @throws NS_ERROR_NO_INTERFACE if the interface is not found.
   */
  getClassObject : function(aCompMgr, aClass, aIID) {
    if (!aIID.equals(CI.nsIFactory)) {
      throw CR.NS_ERROR_NOT_IMPLEMENTED;
    }

    if (aClass.equals(CLASS_ID)) {
      return EbayItemFactory;
    }

    throw CR.NS_ERROR_NO_INTERFACE;
  },

  /**
   * This method may be queried to determine whether or not the component
   * module can be unloaded by XPCOM.
   * @param aCompMgr the global component manager.
   * @return true if the module can be unloaded by XPCOM. false otherwise.
   */
  canUnload: function(aCompMgr) {
    return true;
  }
};

/**
 * Initial entry point.
 * @param aCompMgr the global component manager.
 * @param aFileSpec component file.
 * @return the module for the service.
 */
function NSGetModule(aCompMgr, aFileSpec) {
  return EbayItemModule;
}
