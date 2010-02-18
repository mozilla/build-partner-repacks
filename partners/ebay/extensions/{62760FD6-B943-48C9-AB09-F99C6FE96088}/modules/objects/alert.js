/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Alert"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/objects/item.js");

/**
 * Alert object
 * @param aType the type of the alert
 * @param aObject used to hold the item that caused the alert or the feedback
 * information in case of feedback alerts
 */
function Alert(aType, aObject) {
  this._type = aType;
  this._object = aObject;
}

/* Alert state constants. */
Alert.ALERT_TYPE_BIDDING_ENDING_SOON = 0;
Alert.ALERT_TYPE_BIDDING_OUTBID = 1;
Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER = 2;
Alert.ALERT_TYPE_BIDDING_RAISED_BID = 3;
Alert.ALERT_TYPE_BIDDING_ITEM_WON = 4;
Alert.ALERT_TYPE_BIDDING_ITEM_LOST = 5;
Alert.ALERT_TYPE_WATCHING_ENDING_SOON = 6;
Alert.ALERT_TYPE_SELLING_ENDING_SOON = 7;
Alert.ALERT_TYPE_SELLING_ITEM_SOLD = 8;
Alert.ALERT_TYPE_SELLING_ITEM_UNSOLD = 9;
Alert.ALERT_TYPE_SELLING_BID_PLACED = 10;
Alert.ALERT_TYPE_SELLING_RESERVE_MET = 11;

/* Identifies the alert for increased feedback score. */
Alert.ALERT_TYPE_FEEDBACK_SCORE = 12;
/* Identifies the alert for ended items. */
Alert.ALERT_TYPE_ITEM_ENDED = 13;

Alert.prototype = {
  /**
   * Used to determine the type of the object.
   */
  constructor : Alert,

  /**
   * Returns the type of this alert.
   * @return the type of this alert.
   */
  get type() {
    return this._type;
  },

  /**
   * Returns the object related to this alert (an item or a feedback).
   * @return the object related to this alert (an item or a feedback).
   */
  get object() {
    return this._object;
  },

  /**
   * Dispatches the alert, using an observer notification.
   */
  dispatch : function() {
    Observers.notify(this, "ebay-alert-dispatched", null);
  },

  /**
   * Implements the equals operator.
   * @param aAlert the other alert to compare this one against.
   */
  equals : function(aAlert){
    let equal = false;

    equal = (this._type == aAlert.type);

    // for item alerts we also have to compare the item involved is the same.
    if (this._object instanceof Item) {
      equal = (this._object.get("itemId") == aAlert.object.get("itemId"));
    }

    return equal;
  }
};
