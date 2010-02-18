/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ObjectHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");

var ObjectHelper = {
  flags : {
    NO_NOTIFICATIONS : 1
  },

  /**
   * Returns a value that the given property expects, and/or generates an error
   * if there is a type mismatch.  For example, if a value "true" (string) is
   * given to a property of type boolean, this will return the expected boolean
   * value ("true" => true, "false" => false)
   * @param property Name of property (used in exception string)
   * @param type Type that the value should match
   * @param value Value that should match type
   * @returns filtered value
   */
  filterValue : function(property, type, value) {
    const TYPE_MISMATCH =
      "Type Mismatch: %1 (\"%2\") given for %3, which is of type %4";

    let reportError = function() {
      let str = TYPE_MISMATCH.replace(/%1/, typeof(value)).
                              replace(/%2/, value).
                              replace(/%3/, property).
                              replace(/%4/, type);
      Logger.error(str, Logger.DUMP_STACK, Components.stack.caller.caller.caller);
    }

    let newValue = value;
    switch (type) {
      case "number":
        newValue = Number(value);
        if (isNaN(newValue)) {
          reportError();
        }
        break;

      case "listingFormat":
        switch (value) {
          case "Chinese":
          case "Dutch":
          case "FixedPriceItem":
          case "StoresFixedPrice":
          case "LeadGeneration":
          case "AdType":
          case "Live":
            newValue = value;
            break;
          default:
            newValue = "FixedPriceItem";
            reportError();
        }
        break;

      case "boolean":
        switch (typeof(value)) {
          case "boolean":
            newValue = value;
            break;
          case "string":
            if (value == "true") {
              newValue = true;
            } else if (value == "false") {
              newValue = false;
            } else {
              newValue = false;
              reportError();
            }
            break;
          default:
            newValue = false;
            reportError();
        }
        break;

      default:
        if (typeof(value) != type) {
          newValue = undefined;
          reportError();
        }
    }

    return newValue;
  },

  /**
   * Updates one object's properties to match those of another object, and
   * generates a notification with the given name for each property that
   * changed.
   * @param curObject the object to update
   * @param newObject the object to copy from
   * @param notificationName string indicating name of notification
   * @param flags may be NO_NOTIFICATONS to suppress observer notifications
   * @return true if the object received modifications, false if not
   */
  updateObject : function(curObject, newObject, notificationName, flags) {
    let objectModified = false;
    for (let [property, value] in Iterator(newObject)) {
      if (property.charAt(0) == "_") {
        let curValue = curObject[property];
        curObject[property] = value;
        if (curValue != value) {
          objectModified = true;
          if (flags != this.flags.NO_NOTIFICATIONS) {
            let member = property.slice(1);
            let info = {};
            info.object = curObject;
            info.oldValue = curValue;
            info.newValue = value;
            Observers.notify(info, notificationName, member);
          }
        }
      }
    }
    return objectModified;
  },

  /**
   * Updates the given property of the given object, and generates a
   * notification with the given name if it was different to the previous value.
   * @param curObject the object to update
   * @param property the name of the property
   * @param value the new value for the property
   * @param notificationName string indicating name of notification
   */
  updateProperty : function(curObject, property, value, notificationName) {
    let curValue = curObject["_" + property];
    curObject.set(property, value);
    if (curValue != value) {
      let info = {};
      info.object = curObject;
      info.oldValue = curValue;
      info.newValue = value;
      Observers.notify(info, notificationName, property);
    }
  },

  /**
   * Returns the value of the given property from the given object
   */
  getProperty : function(object, property) {
    let value = object["_" + property];
    if (value == undefined) {
      Logger.error("Attempt to get property \"" + property + "\" of " +
                   object.constructor.name + " object, which is undefined.",
                   Logger.DUMP_STACK);
    }
    return value;
  }
}
