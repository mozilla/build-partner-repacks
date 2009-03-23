/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{87C8B2D8-6071-4B43-B2B4-89724AC23DF6}");
const CLASS_NAME = "eBay Companion Display List";
const CONTRACT_ID = "@glaxstar.org/ebaycomp/ebay-display-list;1";

/**
 * Represents the eBay display list. This is list of relevant items that is
 * shown to the user on the sidebar. This list is sorted like follows:
 *  - First the active items, sorted in ascending order by end time.
 *  - Then the ended items, sorted in descending order by end time.
 * @author Jorge Villalobos Glaxstar Corp.
 */
function EbayDisplayList() {
  this._init();
}

EbayDisplayList.prototype = {
  /* Log service */
  _logService : null,
  /* Cached observer service. */
  _observerService : null,
  /* The active list displayed on the sidebar. */
  _activeList : new Array(),
  /* The index of the first ended item in the active list */
  _endedItemsStartIndex : 0,
  /* The ended (and hidden) list displayed on the sidebar. */
  _endedList : new Array(),


  /**
   * Initialize the component.
   */
  _init : function() {
    //dump("EbayDisplayList.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._dsService =
      CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
        getService(CI.gsIAutotraderDatasourceService);
    this._observerService =
      CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
    this._observerService.addObserver(this, "ebayComp-hide-item", false);
  },

  /**
   * Gets the number of items in the list.
   * @return the number of items in the list.
   */
  get length() {
    this._logService.debug("Begin: EbayDisplayList.get length");

    var realLength = this._activeList.length + this._endedList.length;
    var limitedLength;

    if (realLength < CI.gsIEbayDisplayList.DISPLAY_LIST_MAX) {
      limitedLength = realLength;
    } else {
      limitedLength = CI.gsIEbayDisplayList.DISPLAY_LIST_MAX;

      if (!this._dsService.listCutNotified) {
        // necessary to set this boolean as a display list cut could happen
        // the download lists are below the limit.
        this._dsService.listCutNotified = true;
        this._observerService.notifyObservers(
          null, "ebayComp-display-list-cut", null);
      }
    }

    return limitedLength;
  },

  /**
   * Gets the index of the first ended (and hidden) item on the list.
   * @return the index of the first ended (and hidden) item on the list.
   */
  get endedHiddenItemsIndex() {
    this._logService.debug("Begin: EbayDisplayList.get endedHiddenItemsIndex");

    return this._activeList.length;
  },

  /**
   * Obtain the item in the specified index.
   * @param aIndex the index to get the item from.
   * @return the gsIAutotraderItem in the specified index.
   */
  getItemAt : function(aIndex) {
    this._logService.debug(
      "Begin: EbayDisplayList.getItemAt. Index: " + aIndex);

    var activeListLength = this._activeList.length;
    var totalLength = activeListLength + this._endedList.length;
    var item = null;

    if (0 <= aIndex && aIndex < CI.gsIEbayDisplayList.DISPLAY_LIST_MAX &&
        aIndex < totalLength) {
      if (aIndex < activeListLength) {
        item = this._activeList[aIndex];
      } else {
        item = this._endedList[aIndex - activeListLength];
      }
    } else {
      this._logService.error("An invalid index was given: " + aIndex);
    }

    return item;
  },

  /**
   * Insert an item on the list.
   * @param aItem the item to insert.
   */
  insertItem : function(aItem) {
    this._logService.debug("Begin: EbayDisplayList.insertItem");

    var itemEndTime = aItem.endTime;
    var itemEnded = !(aItem.timeLeft.isPositive());

    if (itemEndTime > 0) {
      var useActiveList = (!itemEnded || !aItem.hidden);
      var displayList = (useActiveList ? this._activeList : this._endedList);
      var left;
      var right;
      var isAfter;

      // The item is placed differently in the list, depending on whether or not
      // it has ended.  Active items are ordered from ending-soonest to
      // ending-last, and ended items are ordered in reverse and placed beneath
      // the active items.
      if (itemEnded) {
        // Set search bounds
        if (useActiveList) {
          // In the active list, ended items are placed below active items
          left = this._endedItemsStartIndex - 1;
          right = displayList.length; // last index + 1
        } else {
          left = -1;
          right = displayList.length; // last index + 1
        }
        isAfter = function(bisect) {
          return (itemEndTime < bisect.endTime);
        }
      } else {
        // Set search bounds
        left = -1;
        right = this._endedItemsStartIndex; // last index + 1
        isAfter = function(bisect) {
          return (itemEndTime > bisect.endTime);
        }
      }

      // Insert the new item using the rules described above
      var bisectIndex = Math.floor((right - left) / 2);
      while (bisectIndex > 0) {
        bisectIndex += left;
        if (isAfter(displayList[bisectIndex])) {
          left = bisectIndex;
        } else {
          right = bisectIndex;
        }
        bisectIndex = Math.floor((right - left) / 2);
      }

      // Iterate through all items that have the same end time and stop if we
      // find one with the same ID and Type as the item we're inserting.
      var i = right;
      var listItem = displayList[i];
      var foundDuplicate = false;
      while (listItem && listItem.endTime == itemEndTime && !foundDuplicate) {
        if (listItem.id == aItem.id && listItem.type == aItem.type) {
          foundDuplicate = true;
        }
        listItem = displayList[++i];
      }

      // Make sure we don't insert duplicate items
      if (!foundDuplicate) {
        displayList.splice(right, 0, aItem);
        // Inserting an active item pushes the ended items down
        if (!itemEnded) {
          this._endedItemsStartIndex++;
        }
      }
    } else {
      // If the end time is invalid or not present, its value is zero.
      this._endedList.push(aItem);
      this._logService.warn(
        "The item has an invalid end time. Id: " + aItem.id);
    }
  },

  /**
   * Remove an item from the list.
   * @param aIndex the index of the item to remove.
   */
  removeItemAt : function(aIndex) {
    this._logService.debug(
      "Begin: EbayDisplayList.removeItemAt. Index: " + aIndex);

    var activeListLength = this._activeList.length;
    var totalLength = activeListLength + this._endedList.length;

    if (0 <= aIndex && aIndex < totalLength) {
      // Remove the item.
      if (aIndex < activeListLength) {
        // Removing an active item moves the ended items up
        if (this._activeList[aIndex].timeLeft.isPositive()) {
          this._endedItemsStartIndex--;
        }
        this._activeList.splice(aIndex, 1);
      } else {
        this._endedList.splice(aIndex - activeListLength, 1);
      }
    } else {
      this._logService.error("An invalid index was given: " + aIndex);
    }
  },

  /**
   * Resorts ended items in the display list. Recently ended items are located
   * at the top of the list, and they need to be moved below active items. Since
   * they are the most recently ended items, they will be above all other ended
   * items.
   */
  sortEndedItems : function() {
    this._logService.debug("Begin: EbayDisplayList.sortEndedItems");

    let finishedSearch = false;
    let endedItems = [];

    // Push the ended items into an array and remove them from the active list
    while (!finishedSearch) {
      let currentItem = this._activeList[0];
      // The final condition prevents us from entering the items that were
      // already moved down, in the case where all items are ended
      if (currentItem && !currentItem.timeLeft.isPositive() &&
          this._endedItemsStartIndex > 0)
      {
        this._activeList.shift();
        endedItems.push(currentItem);
        // Removing this item moves the ended items up
        this._endedItemsStartIndex--;
      } else {
        finishedSearch = true;
      }
    }

    // Re-insert the ended items at the correct position in the display list
    for (let i=0; i < endedItems.length; i++) {
      // The insert operation also checks for duplication
      this.insertItem(endedItems[i]);
    }
  },

  /**
   * Empties the list completely.
   */
  clear : function() {
    this._logService.debug("Begin: EbayDisplayList.clear");
    this._activeList.splice(0, this._activeList.length);
    this._endedList.splice(0, this._endedList.length);
    this._endedItemsStartIndex = 0;
    this.hasBestOffers = false;
  },

  /**
   * Moves an ended item (or more than one if there are duplicates) from the
   * active list to the ended (and hidden) item list.
   * @param aItemId the id of the item to hide.
   */
  _hideEndedItems : function(aItemId) {
    var listLength = this._activeList.length;
    var displayItem;

    for (var i = listLength - 1; i >= 0; i--) {
      displayItem = this._activeList[i];

      if (aItemId == displayItem.id) {
        // remove the item from the active list.
        this._activeList.splice(i, 1);
        // insert the item again. It should go to the ended item list.
        this.insertItem(displayItem);
      }
    }
  },

  /**
   * Observes for eBay topic changes.
   * @param aSubject the object that experienced the change.
   * @param aTopic the topic being observed.
   * @param aData the data relating to the change.
   */
  observe : function(aSubject, aTopic, aData) {
    this._logService.debug("Begin: EbayDisplayList.observe. Topic: " + aTopic);

    if ("ebayComp-hide-item" == aTopic) {
      this._hideEndedItems(aData);
    } else {
      this._logService.error(
        "EbayDisplayList.observe: unexpected topic received.");
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIEbayDisplayList) && !aIID.equals(CI.nsISupports)) {
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
var EbayDisplayListFactory = {
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

    return (new EbayDisplayList()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayDisplayListModule = {
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
      return EbayDisplayListFactory;
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
  return EbayDisplayListModule;
}
