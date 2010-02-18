/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Account"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");

/**
 * eBay Account details for a user
 * @param userId eBay user ID
 * @param isSandboxAccount true if the account belongs to the sandbox
 */
function Account(userId, isSandboxAccount) {
  // isSandboxAccount is assumed false if undefined
  if (isSandboxAccount == undefined) {
    isSandboxAccount = false;
  }
  this.set("userId", userId);
  this.set("isSandboxAccount", isSandboxAccount);
}

Account.prototype = {
  /**
   * Used to determine the type of the object
   */
  constructor : Account,

  /**
   * Types for each property of this object
   */
  propertyTypes : {
    userId :            "string",
    isSandboxAccount :  "boolean",
    token :             "string",
    registrationSite :  "string",
    feedbackRating :    "number",
    numUnreadMessages : "number"
  },

  /**
   * Returns a copy of this object
   */
  copy : function() {
    let copy = new Account(this.get("userId"), this.get("isSandboxAccount"));
    copy.updateQuietlyTo(this);
    return copy;
  },

  /**
   * updateTo
   */
  updateTo : function(newObject, flags) {
    return ObjectHelper.
             updateObject(this, newObject, "ebay-account-property-updated", flags);
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
                            "ebay-account-property-updated");
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
