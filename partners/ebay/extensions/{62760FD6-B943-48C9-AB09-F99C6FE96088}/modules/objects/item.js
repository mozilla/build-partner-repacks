/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Item"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");

/**
 * Ebay item object.
 * @param itemId
 */
function Item(itemId) {
  this.set("itemId", itemId);
  this._transaction = null;
  this.set("userQuantityWinning", 0);
  this.set("thumbnailUrl", "");
  this.set("pageViews", 0);
  this.set("convertedMaxBid", 0);
  this.set("convertedMaxBidCurrency", '');
}

/* Item state constants. */
Item.ITEM_STATE_WATCHING = 0;
Item.ITEM_STATE_BUYING_ITEM_WON = 1;
Item.ITEM_STATE_BUYING_ITEM_LOST = 2;
Item.ITEM_STATE_BUYING_ITEM_LOST_RESERVE_NOT_MET = 3;
Item.ITEM_STATE_BUYING_SUCCESS = 4;
Item.ITEM_STATE_BUYING_OUTBID = 5;
Item.ITEM_STATE_BUYING_RESERVE_NOT_MET = 6;
Item.ITEM_STATE_SELLING = 7;
Item.ITEM_STATE_SELLING_SUCCESS = 8;
Item.ITEM_STATE_SELLING_RESERVE_NOT_MET = 9;
Item.ITEM_STATE_SELLING_ITEM_SOLD = 10;
Item.ITEM_STATE_SELLING_ITEM_UNSOLD = 11;
Item.ITEM_STATE_SELLING_ITEM_UNSOLD_RESERVE_NOT_MET = 12;
// classified ads
Item.ITEM_STATE_WATCHING_CLASSIFIED_AD = 13;
Item.ITEM_STATE_SELLING_CLASSIFIED_AD = 14;

Item.prototype = {
  /**
   * Used to determine the type of the object
   */
  constructor : Item,

  /**
   * Types for each property of this object
   */
  propertyTypes : {
    itemId :               "number",
    title :                "string",
    sellerUserId :         "string",
    isEnded :              "boolean",
    listingFormat :        "listingFormat",
    currentPrice :         "number",
    currency :             "string",
    convertedCurrentPrice : "number",
    convertedCurrentPriceCurrency : "string",
    convertedMaxBid :        "number",
    convertedMaxBidCurrency : "string",
    shippingCost :         "number",
    shippingTermsInDescription : "boolean",
    shipToLocations :      "string",
    shippingType :         "string",
    quantitySold :         "number",
    quantityRemaining :    "number",
    startTime :            "number",
    endTime :              "number",
    relistedItemId :       "number",
    imageUrl :             "string",
    thumbnailUrl :         "string",
    pageViews :            "number",
    hitCounterType :       "string",
    hasBuyItNow :          "boolean",
    buyItNowPrice :        "number",
    numBids :              "number",
    isReserveMet :         "boolean",
    userMaxBid :           "number",
    highBidderId :         "string",
    highBidderFeedbackScore : "number",
    userQuantityBidFor :   "number",
    userQuantityWinning :  "number",
    sellerFeedbackRating : "number",
    sellerFeedbackPercent : "number",
    numWatching :          "number"
  },

  /**
   * Returns a copy of this object.
   * @return the copy of this object.
   */
  copy : function() {
    let copy = new Item(this.get("itemId"));
    copy.updateQuietlyTo(this);
    return copy;
  },

  /**
   * Updates this object with the new object.
   * @param aNewObject the new object.
   * @param aFlags the set of flags.
   * @return the result.
   */
  updateTo : function(aNewObject, aFlags) {
    return ObjectHelper.updateObject(
      this, aNewObject, "ebay-item-property-updated", aFlags);
  },

  /**
   * Updates quietly this object with the new object.
   * @param aNewObject the new object.
   * @return the result.
   */
  updateQuietlyTo : function(aNewObject) {
    return this.updateTo(aNewObject, ObjectHelper.flags.NO_NOTIFICATIONS);
  },

  /**
   * Updates a property of the object.
   * @param aProperty the property name.
   * @param aValue the property value.
   * @return the result.
   */
  updateProperty : function(aProperty, aValue) {
    return ObjectHelper.updateProperty(
      this, aProperty, aValue, "ebay-item-property-updated");
  },

  /**
   * Returns the value of the given property.
   * @param aProperty the property name.
   * @return the property value.
   */
  get : function(aProperty) {
    return ObjectHelper.getProperty(this, aProperty);
  },

  /**
   * Sets the given property to the given value, checking that the value is of
   * the correct type for the property
   * @param aProperty the property name.
   * @param aValue the property value.
   */
  set : function(aProperty, aValue) {
    aValue = ObjectHelper.filterValue(
      aProperty, this.propertyTypes[aProperty], aValue);
    this["_" + aProperty] = aValue;
  },

  /**
   * Returns the transaction related to this item or null if the item doesn't
   * have any.
   * @return the transaction.
   */
  get transaction() {
    return this._transaction;
  },

  /**
   * Sets this item transaction to the given value.
   * @param aValue the value to be set.
   */
  set transaction(aValue) {
    this._transaction = aValue;
  },

  /**
   * Gets the item currenct state.
   * @param aUserId the current active user id.
   * @param aEbayTime the current ebay time.
   * @param aOriginalQuantitySold the original quantity sold value.
   * @return the item current state.
   */
  getCurrentState : function(aUserId, aEbayTime, aOriginalQuantitySold) {
    let state = null;
    let userIsSeller =
      (this.get("sellerUserId").toLowerCase() == aUserId.toLowerCase());
    let endTime = this.get("endTime");
    let timeLeft = Math.max(0, endTime - aEbayTime);
    let itemEnded = this.get("isEnded") || timeLeft == 0;
    let hasBids = (this.get("numBids") > 0);
    let isReserveMet = this.get("isReserveMet");
    let userHasBid = (this.get("userMaxBid") > 0);
    let soldNone = (this.get("quantitySold") == 0);
    let itemHasBuyItNow = this.get("hasBuyItNow");
    let userIsWinning = (this.get("userQuantityWinning") > 0);
    let itemJustSold = (this.get("quantitySold") > aOriginalQuantitySold);
    let userIsHighBidder =
      this.get("highBidderId").toLowerCase() == aUserId.toLowerCase();
    let EC_LISTING_TYPE_CLASSIFIED = "AdType";
    let EC_LISTING_TYPE_LEAD_GENERATION = "LeadGeneration";
    let EC_LISTING_TYPE_FIXED = "FixedPriceItem";
    let EC_LISTING_TYPE_STORE_FIXED = "StoresFixedPrice";
    let listingFormat = this.get("listingFormat");

    let classifiedAd = (EC_LISTING_TYPE_LEAD_GENERATION == listingFormat ||
                        EC_LISTING_TYPE_CLASSIFIED == listingFormat);
    let isBINItem = (EC_LISTING_TYPE_STORE_FIXED == listingFormat ||
                     EC_LISTING_TYPE_FIXED == listingFormat) &&
                     itemHasBuyItNow;

    if (userIsSeller) {
      if (classifiedAd) {
        state = Item.ITEM_STATE_SELLING_CLASSIFIED_AD;
      } else {
        // selling item.
        if (itemEnded) {
          if (itemJustSold || !soldNone) {
            state = Item.ITEM_STATE_SELLING_ITEM_SOLD;
          } else {
            if (hasBids && !isReserveMet) {
              state = Item.ITEM_STATE_SELLING_ITEM_UNSOLD_RESERVE_NOT_MET;
            } else {
              state = Item.ITEM_STATE_SELLING_ITEM_UNSOLD;
            }
          }
        } else {
          if (hasBids && !isReserveMet) {
            state = Item.ITEM_STATE_SELLING_RESERVE_NOT_MET;
          } else if (hasBids) {
            state = Item.ITEM_STATE_SELLING_SUCCESS;
          } else {
            state = Item.ITEM_STATE_SELLING;
          }
        }
      }
    } else if (userHasBid || userIsHighBidder) {
      // buying item.
      if (itemEnded) {
        if (userHasBid && !isReserveMet) {
          state = Item.ITEM_STATE_BUYING_ITEM_LOST_RESERVE_NOT_MET;
        } else if (!userIsHighBidder) {
          state = Item.ITEM_STATE_BUYING_ITEM_LOST;
        } else {
          state = Item.ITEM_STATE_BUYING_ITEM_WON;
        }
      } else {
        if (userIsHighBidder) {
          state = Item.ITEM_STATE_BUYING_SUCCESS;
        } else if (userHasBid && !isReserveMet) {
          state = Item.ITEM_STATE_BUYING_RESERVE_NOT_MET;
        } else {
          state = Item.ITEM_STATE_BUYING_OUTBID;
        }
      }
    } else {
      // watching item.
      if (classifiedAd) {
        state = Item.ITEM_STATE_WATCHING_CLASSIFIED_AD;
      } else if (isBINItem && userIsWinning) {
        // this condition is for BIN items with multiple units since these are
        // not marked as ended when you purchase one of them.
        state = Item.ITEM_STATE_BUYING_ITEM_WON;
      } else {
        state = Item.ITEM_STATE_WATCHING;
      }
    }

    return state;
  }
};
