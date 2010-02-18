/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Notification"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/objectHelper.js");

/**
 * eBay Notification details for a user
 * @param aType the type of the notification
 */
function Notification(aType) {
  this.set("type", aType);
  this.set("isPersistent", true);
  this.set("callbacksArray", new Array());
}

Notification.prototype = {

  /**
   * Used to determine the type of the object
   */
  constructor : Notification,

  // non persistent notification constant
  NON_PERSISTENT_NOTIFICATION : false,

  /**
   * Types for each property of this object
   */
  propertyTypes : {
    type :              "number",
    isPersistent :      "boolean",
    priority :          "number",
    content :           "string",
    imageURL :          "string",
    callbacksArray :    "object"
  },

  /**
   * Returns a copy of this object
   */
  copy : function() {
    let copy = new Notification(this.get("type"));
    copy.updateQuietlyTo(this);
    return copy;
  },

  /**
   * updateTo
   */
  updateTo : function(newObject) {
    return ObjectHelper.
             updateObject(this, newObject, "ebay-notification-property-updated");
  },

  /**
   * updateProperty
   */
  updateProperty : function(property, value) {
    return ObjectHelper.
             updateProperty(
               this, property, value, "ebay-notification-property-updated");
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
  },

  /**
   * Adds a link callback to the linkCallbacks array
   * @param aPosition the position in the callbacks array to add the new
   * callback
   * @param aFunction the function to be added as a callback
   */
  addLinkCallback : function(aPosition, aFunction) {
    this["_callbacksArray"][aPosition] = aFunction;
  }
};
