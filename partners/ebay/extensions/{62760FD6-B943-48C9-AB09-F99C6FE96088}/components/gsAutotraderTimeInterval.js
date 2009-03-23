/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{A723E398-E06B-47CE-A7C1-9A760BE0A0DE}");
const CLASS_NAME = "eBay Companion Time Interval";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-time-interval;1";
/* Regular expression that matches the ISO 8601 time interval.
   Format: PnYnMnDTnHnMnS. */
const EBAYCOMP_ISO_INTERVAL_REGEXP =
  /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
/* Constants used to decrement the interval. Note that they are very rough in
   terms of months and years since the decrement function is meant to be called
   with small quantities of seconds. */
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY;
const SECONDS_IN_YEAR = 12 * SECONDS_IN_MONTH;

/**
 * Represents a time interval beginning on the current time, measured in years,
 * months, days, hours, minutes and seconds.
 * @author Jorge Villalobos Glaxstar Corp.
 */
function EbayTimeInterval() {
  this._init();
}

EbayTimeInterval.prototype = {
  /* log service */
  _logService : null,
  /* The amount of years in this interval. */
  _years : 0,
  /* The amount of months in this interval. */
  _months : 0,
  /* The amount of days in this interval. */
  _days : 0,
  /* The amount of hours in this interval. */
  _hours : 0,
  /* The amount of minutes in this interval. */
  _minutes : 0,
  /* The amount of seconds in this interval. */
  _seconds : 0,

  /**
   * Initialize the component.
   */
  _init : function() {
    //dump("EbayTimeInterval._init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
  },

  /**
   * Initializes the interval with its string representation.
   * @param an ISO 8601 time interval. Format: PnYnMnDTnHnMnS.
   */
  init : function(aInterval) {
    this._logService.debug("Begin: EbayTimeInterval.init");

    var matched = EBAYCOMP_ISO_INTERVAL_REGEXP.exec(aInterval);

    if (matched) {
      this._years = parseInt((matched[1] ? matched[1] : 0), 10);
      this._months = parseInt((matched[2] ? matched[2] : 0), 10);
      this._days = parseInt((matched[3] ? matched[3] : 0), 10);
      this._hours = parseInt((matched[4] ? matched[4] : 0), 10);
      this._minutes = parseInt((matched[5] ? matched[5] : 0), 10);
      this._seconds = parseInt((matched[6] ? matched[6] : 0), 10);
    } else {
      this._logService.error(
        "An error occurred when parsing the interval string: " + aInterval);
    }
  },

  /**
   * Obtains the string representation of the interval.
   * @return an ISO 8601 time interval that represents the object. Format:
   * PnYnMnDTnHnMnS.
   */
  toString : function() {
    this._logService.debug("Begin: EbayTimeInterval.toString");

    var intervalStr = "P";

    if (this._years > 0) {
      intervalStr += (this._years + "Y");
    }

    if (this._months > 0) {
      intervalStr += (this._months + "M");
    }

    if (this._days > 0) {
      intervalStr += (this._days + "D");
    }

    intervalStr += "T";

    if (this._hours > 0) {
      intervalStr += (this._hours + "H");
    }

    if (this._minutes > 0) {
      intervalStr += (this._minutes + "M");
    }

    intervalStr += (this._seconds + "S");

    return intervalStr;
  },

  /**
   * Obtain the value of the item corresponding to the given index.
   * @param aIndex the index of the requested item. 0 - years, 1 - months,
   * 2 - days, 3 - hours, 4 - minutes, 5 - seconds.
   * @return the value of the item corresponding to the given index.
   */
  getItem : function(aIndex) {
    this._logService.debug("Begin: EbayTimeInterval.getItem");

    var result = NaN;

    switch (aIndex) {
      case 0:
        result = this._years;
        break;
      case 1:
        result = this._months;
        break;
      case 2:
        result = this._days;
        break;
      case 3:
        result = this._hours;
        break;
      case 4:
        result = this._minutes;
        break;
      case 5:
        result = this._seconds;
        break;
      default:
        this._logService.error("getItem received an invalid index: " + aIndex);
        break;
    }

    return result;
  },

  /**
   * Sets the value of the item corresponding to the given index.
   * @param aIndex the index of the requested item. 0 - years, 1 - months,
   * 2 - days, 3 - hours, 4 - minutes, 5 - seconds.
   * @param aValue the new value of the item.
   */
  setItem : function(aIndex, aValue) {
    this._logService.debug("Begin: EbayTimeInterval.setItem");

    switch (aIndex) {
      case 0:
        this._years = aValue;
        break;
      case 1:
        this._months = aValue;
        break;
      case 2:
        this._days = aValue;
        break;
      case 3:
        this._hours = aValue;
        break;
      case 4:
        this._minutes = aValue;
        break;
      case 5:
        this._seconds = aValue;
        break;
      default:
        this._logService.error("setItem received an invalid index: " + aIndex);
        break;
    }
  },

  /**
   * Decrement the interval by the given amount of seconds.
   * @param aSeconds the amount of seconds to reduce from the interval.
   */
  decrement : function (aSeconds) {
    this._logService.debug(
      "Begin: EbayTimeInterval.decrement. Amount: " + aSeconds + " seconds.");

    var interval = new EbayTimeInterval();
    var carry = false;
    var subtracted;
    // create an interval with the given seconds.
    interval.years = Math.round(aSeconds / SECONDS_IN_YEAR);
    interval.months =
      Math.round((aSeconds % SECONDS_IN_YEAR) / SECONDS_IN_MONTH);
    interval.days = Math.round((aSeconds % SECONDS_IN_MONTH) / SECONDS_IN_DAY);
    interval.minutes =
      Math.round((aSeconds % SECONDS_IN_DAY) / SECONDS_IN_MINUTE);
    interval.seconds = Math.round(aSeconds % SECONDS_IN_MINUTE);
    this._logService.debug("Decrement: " + interval);
    // see if we're subtracting more than we have.
    if (this.compareTo(interval) > 0) {
      for (var i = 5; i >= 0; i--) {
        subtracted = (carry ? interval.getItem(i) + 1 : interval.getItem(i));

        if (this.getItem(i) >= subtracted) {
          carry = false;
          this.setItem(i, this.getItem(i) - subtracted);
        } else {
          carry = true;
          // XXX: note this is an approximation, to keep things simple. We're
          // using 30 day months, which is not correct. But since there are
          // almost no listings that take this long, and refresh rates are
          // within an hour, it shouldn't be a big issue.
          switch (i) {
            case 5:
            case 4:
              this.setItem(i, 60 - subtracted);
              break;
            case 3:
              this.setItem(i, 24 - subtracted);
              break;
            case 2:
              this.setItem(i, 30 - subtracted);
              break;
            case 1:
              this.setItem(i, 12 - subtracted);
              break;
          }
        }
      }
    } else {
      this._years = 0;
      this._months = 0;
      this._days = 0;
      this._hours = 0;
      this._minutes = 0;
      this._seconds = 0;
    }
  },

  /**
   * Indicates whether the interval is positive or not. It should only return
   * false if the interval is uninitialized or equal to zero.
   * @return true if the interval is greater than zero. false otherwise.
   */
  isPositive : function() {
    this._logService.debug("Begin: EbayTimeInterval.isPositive");

    var result =
      (this._years > 0 || this._months > 0 || this._days > 0 ||
       this._hours > 0 || this._minutes > 0 || this._seconds > 0);

    return result;
  },

  /**
   * Compares this interval to the one passed as an argument.
   * @param aInterval the interval this object will be compared to.
   * @return -1 if this object is smaller (aInterval is larger), 0 if they are
   * equal, 1 if this object is larger (aInterval is smaller).
   */
  compareTo : function(aInterval) {
    var result = 0;

    for (var i = 0; i < 6; i++) {
      if (this.getItem(i) > aInterval.getItem(i)) {
        result = 1;
        break;
      } else if (this.getItem(i) < aInterval.getItem(i)) {
        result = -1;
        break;
      }
    }

    return result;
  },

  /**
   * Obtains the amount of years in this interval.
   * @returns the amount of years in this interval.
   */
  get years() {
    this._logService.debug("Begin: EbayTimeInterval.get years");
    return this._years;
  },

  /**
   * Sets the amount of years in this interval.
   * @param aValue the amount of years in this interval.
   */
  set years(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get years");
    this._years = aValue;
  },

  /**
   * Obtains the amount of months in this interval.
   * @returns the amount of months in this interval.
   */
  get months() {
    this._logService.debug("Begin: EbayTimeInterval.get months");
    return this._months;
  },

  /**
   * Sets the amount of months in this interval.
   * @param aValue the amount of months in this interval.
   */
  set months(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get months");
    this._months = aValue;
  },

  /**
   * Obtains the amount of days in this interval.
   * @returns the amount of days in this interval.
   */
  get days() {
    this._logService.debug("Begin: EbayTimeInterval.get days");
    return this._days;
  },

  /**
   * Sets the amount of days in this interval.
   * @param aValue the amount of days in this interval.
   */
  set days(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get days");
    this._days = aValue;
  },

  /**
   * Obtains the amount of hours in this interval.
   * @returns the amount of hours in this interval.
   */
  get hours() {
    this._logService.debug("Begin: EbayTimeInterval.get hours");
    return this._hours;
  },

  /**
   * Sets the amount of hours in this interval.
   * @param aValue the amount of hours in this interval.
   */
  set hours(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get hours");
    this._hours = aValue;
  },

  /**
   * Obtains the amount of minutes in this interval.
   * @returns the amount of minutes in this interval.
   */
  get minutes() {
    this._logService.debug("Begin: EbayTimeInterval.get minutes");
    return this._minutes;
  },

  /**
   * Sets the amount of minutes in this interval.
   * @param aValue the amount of minutes in this interval.
   */
  set minutes(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get minutes");
    this._minutes = aValue;
  },

  /**
   * Obtains the amount of seconds in this interval.
   * @returns the amount of seconds in this interval.
   */
  get seconds() {
    this._logService.debug("Begin: EbayTimeInterval.get seconds");
    return this._seconds;
  },

  /**
   * Sets the amount of seconds in this interval.
   * @param aValue the amount of seconds in this interval.
   */
  set seconds(aValue) {
    this._logService.debug("Begin: EbayTimeInterval.get seconds");
    this._seconds = aValue;
  },

  /**
   * Obtains the string representation of an interval of length zero.
   * @returns the string representation of an interval of length zero.
   */
  get ZERO_INTERVAL_STRING() {
    this._logService.debug(
      "Begin: EbayTimeInterval.get ZERO_INTERVAL_STRING");
    return "PT0S";
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderTimeInterval) &&
        !aIID.equals(CI.nsISupports)) {
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
var EbayTimeIntervalFactory = {
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

    return (new EbayTimeInterval()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayTimeIntervalModule = {
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
      return EbayTimeIntervalFactory;
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
  return EbayTimeIntervalModule;
}
