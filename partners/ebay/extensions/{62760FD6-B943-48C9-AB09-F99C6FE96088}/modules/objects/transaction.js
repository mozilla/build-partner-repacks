/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Transaction"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");

/**
 * eBay Transaction
 * @param itemId
 * @param transactionId
 */
function Transaction(itemId, transactionId) {
  this.set("itemId", itemId);
  this.set("transactionId", transactionId);
}

Transaction.prototype = {
  /**
   * Used to determine the type of the object
   */
  constructor : Transaction,

  /**
   * Types for each property of this object
   */
  propertyTypes : {
    itemId :                  "number",
    transactionId :           "number",
    creationTime :            "number",
    quantityPurchased :       "number",
    buyerUserId :             "string",
    isPaidFor :               "boolean",
    isShipped :               "boolean",
    userHasSentFeedback :     "boolean",
    userHasReceivedFeedback : "boolean",
    feedbackReceivedType :    "string"
  },

  /**
   * Returns a copy of this object
   */
  copy : function() {
    let copy = new Transaction(this.get("itemId"), this.get("transactionId"));
    copy.updateQuietlyTo(this);
    return copy;
  },

  /**
   * updateTo
   */
  updateTo : function(newObject, flags) {
    return ObjectHelper.
             updateObject(this, newObject,
                          "ebay-transaction-property-updated", flags);
  },

  /**
   * updateQuietlyTo
   */
  updateQuietlyTo : function(newObject) {
    return this.updateTo(newObject, ObjectHelper.flags.NO_NOTIFICATIONS);
  },

  /**
   * updateProperty
   */
  updateProperty : function(property, value) {
    return ObjectHelper.
             updateProperty(this, property, value,
                            "ebay-transaction-property-updated");
  },

  /**
   * Returns the value of the given property
   */
  get : function(property) {
    return ObjectHelper.getProperty(this, property);
  },

  /**
   * Sets the given property to the given value, checking that the value is of
   * the correct type for the property
   */
  set : function(property, value) {
    value = ObjectHelper.
              filterValue(property, this.propertyTypes[property], value);
    this["_" + property] = value;
  }
};
