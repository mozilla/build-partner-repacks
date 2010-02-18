/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["FavoriteSeller"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");

/**
 * eBay Favorite Seller details
 * @param userId the id of the user
 * @param isSandboxAccount whether this is a sandbox account or not
 * @param sellerId the userId of the favorite seller
 */
function FavoriteSeller(userId, isSandboxAccount, sellerId) {
  this.set("userId", userId);
  this.set("isSandboxAccount", isSandboxAccount);
  this.set("sellerId", sellerId);
}

FavoriteSeller.prototype = {
  /**
   * Used to determine the type of the object
   */
  constructor : FavoriteSeller,

  /**
   * Types for each property of this object
   */
  propertyTypes : {
    userId :            "string",
    isSandboxAccount :  "boolean",
    sellerId :          "string",
    storeName :         "string"
  },

  /**
   * Returns a copy of this object
   */
  copy : function() {
    let copy = new FavoriteSeller(
                 this.get("userId"),
                 this.get("isSandboxAccount"),
                 this.get("sellerId"));
    copy.updateQuietlyTo(this);
    return copy;
  },

  /**
   * updateTo
   */
  updateTo : function(newObject, flags) {
    return ObjectHelper.
             updateObject(
               this, newObject, "ebay-favorite-seller-property-updated", flags);
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
                            "ebay-favorite-seller-property-updated");
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
