/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{3C3C093A-8D65-481B-A73B-B6D030EFA9CA}");
const CLASS_NAME = "Autotrader Datasource Update Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-ds-update-service;1";
/* Update rate. An update will happen on every "tick". */
const EBAYCOMP_SECONDS_PER_TICK = 10;
const EBAYCOMP_TICK_RATE = EBAYCOMP_SECONDS_PER_TICK * 1000;
/* Timers sometimes fire too quickly (see Mozilla bug 291386), so we enforce a
   minimum tick time. */
const EBAYCOMP_MIN_TICK = (EBAYCOMP_SECONDS_PER_TICK - 1) * 1000;
/* User's system clock may be slow and this would be corrected by system time
  synchronization. However, this would cause some unexpected errors in the
  extension so we force a reload to correct the items' end time if the time
  difference between two ticks is big */
const EBAYCOMP_MIN_RELOAD_TICK = 3 * 60 * 1000;
/* Update rates for lists. Measured in ticks. */
// 1 hour, 10 min, 1 min, 30 sec.
const EBAYCOMP_BUYING_RATES = [ 60 * 6, 10 * 6, 1 * 6, 3 ];
// 2 hours, 30 min, 5 min.
const EBAYCOMP_SELLING_RATES = [ 120 * 6, 30 * 6, 5 * 6 ];
// 4 hours.
const EBAYCOMP_FEEDBACK_RATE = 4 * 60 * 6;
// 4 hours.
const EBAYCOMP_ITEM_RATE = 4 * 60 * 6;
// 4 hours.
const EBAYCOMP_MESSAGES_RATE = 4 * 60 * 6;
/* There's a delay before messages are downloaded, to reduce network usage at
   login.*/
const EBAYCOMP_MESSAGES_DEFAULT_COUNT = 3;

/**
 * Autotrader datasource update service. Handles automatic updates on the saved
 * Ebay information.
 * @author Jorge Villalobos Glaxstar Corp.
 */
var AutotraderDSUpdateService = {
  /* log service */
  _logService : null,
  /* user service. */
  _userService : null,
  /* datasource service. */
  _dsService : null,
  /* observer service. */
  _observerService : null,
  /* branch containing our preferences */
  _prefBranch : null,
  /* indicates whether the automatic updating is active or not. */
  _active : false,
  /* reference to the object that handles the timeouts. */
  _updater : null,
  /* ticks for the next ebay buying list update. */
  _updateEbayBuyingCounter : -1,
  /* ticks for the next ebay selling list update. */
  _updateEbaySellingCounter : -1,
  /* ticks for the next ebay feedback list update. */
  _updateEbayFeedbackCounter : -1,
  /* ticks for the next ebay item update. */
  _updateEbayItemCounter : -1,
  /* ticks for the next ebay message update. */
  _updateEbayMessagesCounter : -1,
  /* timestamp for the last time the buying list was updated. */
  _lastUpdateBuying : 0,
  /* timestamp for the last time the selling list was updated. */
  _lastUpdateSelling : 0,
  /* Flag that indicates that the next tick should be skipped. */
  _skipNextTick : false,
  /* The timestamp for the last tick. */
  _lastTick : -1,

  /**
   * Initialize the component.
   */
  init : function() {
    const EBAYCOM_PREF_BRANCH = "extensions.ebaycomp.";

    //dump("AutotraderDSUpdateService.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._userService =
      CC["@glaxstar.org/autotrader/ebay-user-service;1"].
        getService(CI.gsIEbayUserService);
    this._dsService =
      CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
        getService(CI.gsIAutotraderDatasourceService);
    this._observerService =
      CC["@mozilla.org/observer-service;1"].
        getService(CI.nsIObserverService);
    this._prefBranch =
      CC["@mozilla.org/preferences-service;1"].
        getService(CI.nsIPrefService).getBranch(EBAYCOM_PREF_BRANCH);
  },

  /**
   * Starts the automatic updating process.
   */
  start : function() {
    this._logService.debug("Begin: AutotraderDSUpdateService.start");

    if (!this.active) {
      this._active = true;
      // initialize the counters and timestamps.
      this._updateEbayBuyingCounter = 1;
      this._updateEbaySellingCounter = 1;
      this._updateEbayFeedbackCounter = 1;
      this._updateEbayItemCounter = EBAYCOMP_ITEM_RATE;
      this._updateEbayMessagesCounter = EBAYCOMP_MESSAGES_DEFAULT_COUNT;
      this._lastUpdateBuying = 0;
      this._lastUpdateSelling = 0;
      // load the datasource.
      this._dsService.loadDatasource();
      // start ticking.
      this._tick(false);
      this._updater =
        CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
      var callback = {
        notify: function() {
          AutotraderDSUpdateService._tick(false);
        }
      };
      this._updater.initWithCallback(callback,
                                     EBAYCOMP_TICK_RATE,
                                     CI.nsITimer.TYPE_REPEATING_SLACK);
      // register observer.
      this._observerService.addObserver(this, "ebayComp-lists-updated", false);
      this._logService.debug("The Datasource Update service has been started.");
    } else {
      this._logService.debug(
        "Start ignored: the Datasource Update service is already active.");
    }
  },

  /**
   * Stops the automatic updating process.
   */
  stop : function() {
    this._logService.debug("Begin: AutotraderDSUpdateService.stop");

    if (this.active) {
      this._active = false;
      // unload the datasource.
      this._dsService.unloadDatasource();
      // stop ticking.
      this._updater.cancel();
      // unregister observer.
      this._observerService.removeObserver(this, "ebayComp-lists-updated");
      this._logService.debug("The Datasource Update service has been stopped.");
    } else {
      this._logService.debug(
        "Stop ignored: the Datasource Update service is already inactive.");
    }
  },

  /**
   * Forces a reload of the Ebay lists.
   */
  forceListReload : function() {
    this._logService.debug("Begin: AutotraderDSUpdateService.forceListReload");
    // reset counters and force a tick.
    this._updateEbayBuyingCounter = 1;
    this._updateEbaySellingCounter = 1;
    this._updateEbayFeedbackCounter = 1;
    this._updateEbayMessagesCounter = EBAYCOMP_MESSAGES_DEFAULT_COUNT;
    // skip the next tick to avoid conflicts with the datasource.
    this._tick(true);
  },

  /**
   * Indicates if automatic updates are active.
   * @returns true if automatic updates are active.
   */
  get active() {
    this._logService.debug("Begin: AutotraderDSUpdateService.get active");
    return this._active;
  },

  /**
   * Obtains the timestamp for the last update of the buying list.
   * @returns the timestamp for the last update of the buying list.
   */
  get lastUpdateBuying() {
    this._logService.debug(
      "Begin: AutotraderDSUpdateService.get lastUpdateBuying");
    return this._lastUpdateBuying;
  },

  /**
   * Obtains the timestamp for the next update of the buying list.
   * @returns the timestamp for the next update of the buying list.
   */
  get nextUpdateBuying() {
    this._logService.debug(
      "Begin: AutotraderDSUpdateService.get nextUpdateBuying");

    var nextUpdate;

    if (this._updateEbayBuyingCounter >= 0) {
      this._logService.debug(
        "Buying counter: " + this._updateEbayBuyingCounter);
      nextUpdate =
        this._updateEbayBuyingCounter * EBAYCOMP_TICK_RATE +
        (new Date()).getTime();
    } else {
      nextUpdate = (new Date()).getTime() + EBAYCOMP_TICK_RATE;
    }

    return nextUpdate;
  },

  /**
   * Obtains the timestamp for the last update of the selling list.
   * @returns the timestamp for the last update of the selling list.
   */
  get lastUpdateSelling() {
    this._logService.debug(
      "Begin: AutotraderDSUpdateService.get lastUpdateSelling");
    return this._lastUpdateSelling;
  },

  /**
   * Obtains the timestamp for the next update of the selling list.
   * @returns the timestamp for the next update of the selling list.
   */
  get nextUpdateSelling() {
    this._logService.debug(
      "Begin: AutotraderDSUpdateService.get nextUpdateSelling");

    var nextUpdate;

    if (this._updateEbaySellingCounter >= 0) {
      nextUpdate =
        this._updateEbaySellingCounter * EBAYCOMP_TICK_RATE +
        (new Date()).getTime();
    } else {
      nextUpdate = (new Date()).getTime() + EBAYCOMP_TICK_RATE;
    }

    return nextUpdate;
  },

  /**
   * Advances one "tick". This function is called at regular intervals when the
   * updater is active. It triggers all the other actoins the service performs.
   * @param aSkipNext indicates that the next tick should be skipped.
   */
  _tick : function(aSkipNext) {
    this._logService.trace("Begin: AutotraderDSUpdateService._tick");

    if (this.active && !this._skipNextTick) {
      var currentTime = (new Date()).getTime();
      var timeSinceLastTick = currentTime - this._lastTick;
      // check for premature ticks.
      if (EBAYCOMP_MIN_TICK <= timeSinceLastTick) {
        var updateTimeLeft;

        var forceReload = false;
        this._lastTick = currentTime;
        this._skipNextTick = aSkipNext;
        this._updateEbayBuyingCounter--;
        this._updateEbaySellingCounter--;
        this._updateEbayFeedbackCounter--;
        this._updateEbayItemCounter--;
        this._updateEbayMessagesCounter--;
        this._logService.debug(
          "Buying counter: " + this._updateEbayBuyingCounter +
          "\nSelling counter: " + this._updateEbaySellingCounter +
          "\nFeedback counter: " + this._updateEbayFeedbackCounter +
          "\nItem counter: " + this._updateEbayItemCounter +
          "\nMessage counter: " + this._updateEbayMessagesCounter);
        // the time left has to be updated unless both lists need to be updated.
        updateTimeLeft =
          (0 != this._updateEbayBuyingCounter ||
           0 != this._updateEbaySellingCounter);
        // see if we have to update the buying lists.
        if (0 == this._updateEbayBuyingCounter) {
          // set the next call for the default interval, in case the response
          // takes more than one tick to arrive.
          this._updateEbayBuyingCounter = EBAYCOMP_BUYING_RATES[1];
          // async call. See observe function for what happens next.
          this._userService.getMyEBay(
            CI.gsIEbayUserService.REQUEST_TYPE_BUYING_LIST);
        } else {
          // XXX: force a reload if the time difference between current time and
          // last tick time is big.  This might be caused by system time
          // sync.
          if (EBAYCOMP_MIN_RELOAD_TICK < timeSinceLastTick) {
            forceReload = true;
          } else {
            // update time left.
            this._dsService.updateTimeLeftBuying();
          }
        }
        // see if we have to update the selling lists.
        if (0 == this._updateEbaySellingCounter) {
          // set the next call for the default interval, in case the response
          // takes more than one tick to arrive.
          this._updateEbaySellingCounter = EBAYCOMP_SELLING_RATES[0];
          // async call. See observe function for what happens next.
          this._userService.getMyEBay(
            CI.gsIEbayUserService.REQUEST_TYPE_SELLING_LIST);
        } else {
          // XXX: force a reload if the time difference between current time and
          // last tick time is big.  This might be caused by system time
          // sync.
          if (EBAYCOMP_MIN_RELOAD_TICK < timeSinceLastTick) {
            forceReload = true;
          } else {
            // update time left.
            this._dsService.updateTimeLeftSelling();
          }
        }
        // see if we have to update the feedback list.
        if (this._updateEbayFeedbackCounter <= 0) {
          // set the next call for the default interval.
          this._updateEbayFeedbackCounter = EBAYCOMP_FEEDBACK_RATE;
          // async call. See observe function for what happens next.
          this._userService.getMyEBay(
            CI.gsIEbayUserService.REQUEST_TYPE_FEEDBACK);
        }
        // see if we have to update individual items.
        if (this._updateEbayItemCounter <= 0) {
          // set the next call for the default interval.
          this._updateEbayItemCounter = EBAYCOMP_ITEM_RATE;
          this._dsService.updateAllItems();
        }
        // see if we have to update the messages lists.
        if (this._updateEbayMessagesCounter <= 0) {
          var messageNotificationsEnabled =
            this._prefBranch.getBoolPref("notifyOfNewMessages");

          // set the next call for the default interval.
          this._updateEbayMessagesCounter = EBAYCOMP_MESSAGES_RATE;

          // only update messages if preference is set
          if (messageNotificationsEnabled) {
            // async call.
            this._userService.getMyEBay(
              CI.gsIEbayUserService.REQUEST_TYPE_MESSAGE_LIST);
          }
        }
        // force a reload
        if (forceReload) {
          this.forceListReload();
        }

        if (updateTimeLeft) {
          this._observerService.notifyObservers(
            null, "ebayComp-lists-updated",
            CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_TIME_LEFT);
        }
      } else {
        this._logService.warn("Tick skipped because the timer fired too soon.");
      }
    } else if (this._skipNextTick) {
      this._skipNextTick = false;
      this._logService.debug("Tick skipped due to a forced reload.");
    } else {
      this._logService.debug(
        "Tick ignored: the Datasource Update service has been stopped.");
    }
  },

  /**
   * Update the counters depending on the current state of the items on the
   * lists.
   * @param aType the type of update that was performed. See the constants in
   * the gsIAutotraderDSUpdateService interface.
   */
  _updateCounters : function(aType) {
    this._logService.trace(
      "Begin: AutotraderDSUpdateService._updateCounters. Type: " + aType);

    switch (aType) {
      case CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_BUYING:
        this._lastUpdateBuying = (new Date()).getTime();
        this._updateBuyingCounter(false);
        break;
      case CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_SELLING:
        this._lastUpdateSelling = (new Date()).getTime();
        this._updateSellingCounter(false);
        break;
      case CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_TIME_LEFT:
        this._updateBuyingCounter(true);
        this._updateSellingCounter(true);
        break;
    }

    this._observerService.notifyObservers(null, "ebayComp-timer-updated", null);
  },

  /**
   * Update the buying counter.
   * @param aIsTimeUpdate true if the update is happening due to a time left
   * update. false otherwise.
   */
  _updateBuyingCounter : function(aIsTimeUpdate) {
    this._logService.trace(
      "Begin: AutotraderDSUpdateService._updateBuyingCounter");

    var closestEndTime = this._dsService.closestEndTimeBuying;

    this._logService.debug("Closest end time buying: " + closestEndTime);
    // if there's less than 1 hour left for an item, we need to adjust the
    // rates.
    if (closestEndTime.isPositive() && 0 == closestEndTime.years &&
        0 == closestEndTime.months && 0 == closestEndTime.days &&
        0 == closestEndTime.hours) {
      var calculatedUpdate;

      if (30 < closestEndTime.minutes) {
        // set the next update when there's 30 minutes left.
        calculatedUpdate =
          (closestEndTime.minutes - 30) * 6 +
          Math.round(closestEndTime.seconds / EBAYCOMP_SECONDS_PER_TICK) + 1;
        this._logService.debug(
          "Setting to fire at 30 minutes. Calculated: " + calculatedUpdate);
      } else if (10 <= closestEndTime.minutes) {
        // there's less than 30 minutes left and more than 10, update every 10
        // minutes.
        calculatedUpdate = EBAYCOMP_BUYING_RATES[1];
        this._logService.debug("Setting to fire every 10 minutes.");
      } else if (5 < closestEndTime.minutes) {
        // set the next update when there's 5 minutes left.
        calculatedUpdate =
          (closestEndTime.minutes - 5) * 6 +
          Math.round(closestEndTime.seconds / EBAYCOMP_SECONDS_PER_TICK) + 1;
        this._logService.debug(
          "Setting to fire at 5 minutes. Calculated: " + calculatedUpdate);
      } else if (1 <= closestEndTime.minutes) {
        // there's less than 5 minutes and more than one minute left,
        // update every minute.
        calculatedUpdate = EBAYCOMP_BUYING_RATES[2];
        this._logService.debug("Setting to fire every minute.");
      } else {
        // there's less than one minute left, update every 30 seconds.
        calculatedUpdate = EBAYCOMP_BUYING_RATES[3];
        this._logService.debug("Setting to fire every 30 seconds.");
      }
      // only change it when it's smaller than the one already scheduled.
      if (this._updateEbayBuyingCounter > calculatedUpdate) {
        this._updateEbayBuyingCounter = calculatedUpdate;
      }
    } else if (!aIsTimeUpdate) {
      // the normal update rate for the buying list is every hour.
      this._updateEbayBuyingCounter = EBAYCOMP_BUYING_RATES[0];
      this._logService.debug("Setting default rate.");
    }
  },

  /**
   * Update the selling counter.
   * @param aIsTimeUpdate true if the update is happening due to a time left
   * update. false otherwise.
   */
  _updateSellingCounter : function(aIsTimeUpdate) {
    this._logService.trace(
      "Begin: AutotraderDSUpdateService._updateSellingCounter");

    var closestEndTime = this._dsService.closestEndTimeSelling;

    this._logService.debug("Closest end time selling: " + closestEndTime);
    // if there's less than 2 hours left for an item, we need to adjust the
    // rates.
    if (closestEndTime.isPositive() && 0 == closestEndTime.years &&
        0 == closestEndTime.months && 0 == closestEndTime.days &&
        1 >= closestEndTime.hours) {
      var calculatedUpdate;

      if (1 == closestEndTime.hours) {
        // set the next update when there's 60 minutes left.
        calculatedUpdate =
          closestEndTime.minutes * 6 +
          Math.round(closestEndTime.seconds / EBAYCOMP_SECONDS_PER_TICK) + 1;
        this._logService.debug(
          "Setting to fire at 60 minutes. Calculated: " + calculatedUpdate);
      } else if (35 <= closestEndTime.minutes) {
        // there's less than 60 minutes left and more than 35, update every 30
        // minutes.
        calculatedUpdate = EBAYCOMP_SELLING_RATES[1];
        this._logService.debug("Setting to fire every 30 minutes.");
      } else {
        // there's less than 35 minutes left, update every 5 minutes.
        calculatedUpdate = EBAYCOMP_SELLING_RATES[2];
        this._logService.debug("Setting to fire every 5 minutes.");
      }
      // only change it when it's smaller than the one already scheduled.
      if (this._updateEbaySellingCounter > calculatedUpdate) {
        this._updateEbaySellingCounter = calculatedUpdate;
      }
    } else if (!aIsTimeUpdate) {
      // the normal update rate for the selling list is every 2 hours.
      this._updateEbaySellingCounter = EBAYCOMP_SELLING_RATES[0];
      this._logService.debug("Setting default rate.");
    }
  },

  /**
   * Observes any ebay topics changes.
   * @param subject the object that experienced the change.
   * @param topic the topic being observed.
   * @param data the data relating to the change.
   */
  observe : function(subject, topic, data) {
    this._logService.debug("Begin: AutotraderDSUpdateService.observe");

    if ("ebayComp-lists-updated" == topic) {
      this._updateCounters(parseInt(data, 10));
    } else {
      this._logService.error(
        "AutotraderDSUpdateService.observe: unexpected topic received.");
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderDSUpdateService) &&
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
var AutotraderDSUpdateServiceFactory = {
  /* single instance of the component. */
  _singletonObj: null,

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
    // in this case we need a unique instance of the service.
    if (!this._singletonObj) {
      this._singletonObj = AutotraderDSUpdateService;
      AutotraderDSUpdateService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var AutotraderDSUpdateServiceModule = {
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
      return AutotraderDSUpdateServiceFactory;
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
  return AutotraderDSUpdateServiceModule;
}
