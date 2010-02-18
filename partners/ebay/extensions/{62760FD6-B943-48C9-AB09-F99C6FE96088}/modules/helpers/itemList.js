/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ItemList"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/datasource.js");

/**
 * This object provides an interface for sorting and filtering item objects
 * @param hashedItems Hash list of item objects, by itemId
 */
function ItemList() {
  // Reset the list
  this.reset();

  // Set up observers
  this._observers = new Observers;
  let (that = this) {
    this._observers.
      add(function(subject, topic, data) { that._addItem(subject.object); },
          "ebay-item-new");
    this._observers.
      add(function(subject, topic, data) {
            that._removeItem(subject.object, true);
          },
          "ebay-item-removed");
    this._observers.
      add(function(subject, topic, data) {
            that._refilterItem(subject.object);
          },
          "ebay-item-changed");
    this._observers.
      add(function(subject, topic, data) {
            that._addTransactionItem(subject.object);
          },
          "ebay-transaction-new");
  }

  // List of listeners to notify on changes
  this._listeners = [];
}

ItemList.prototype = {
  /**
   * Returns the items held by this list
   */
  get items() {
    return this._itemArray;
  },

  /**
   * Resets this item list to contain all items in the datasource, unfiltered
   * and unsorted.
   */
  reset : function() {
    this._itemArray = [];

    // Add existing items from Datasource to array
    let hashList = Datasource.items();
    for (let [itemId, item] in Iterator(hashList)) {

      // we want to take item transactions into account (if it has any) and add
      // a representative item for each one of them.
      // If the item has transactions, but hasn't ended (dutch items), we also
      // add items with transactions as items to be considered for the
      // filter method, but only for items where the user is the seller.
      let itemTransactions = Datasource.transactions(item.get("itemId"));
      if (itemTransactions) {
        let userId = Datasource.activeAccount().get("userId");
        for (let [transactionId, transaction] in Iterator(itemTransactions)) {
          let copy = item.copy();
          copy.set("isEnded", true);
          // user is seller
          if (copy.get("sellerUserId").toLowerCase() == userId.toLowerCase()) {
            copy.set(
              "quantitySold", transaction.get("quantityPurchased"));
            copy.set(
              "userQuantityWinning", 0);
          } else {
          // user is buyer
            // XXX: for BIN items with many units, the highBidderId column
            // is not set, so we have to set it in the representative item for
            // each transaction where the user was involved
            if (copy.get("highBidderId").length == 0) {
              copy.set("highBidderId", transaction.get("buyerUserId"));
            }
            copy.set(
              "userQuantityWinning", transaction.get("quantityPurchased"));
            copy.set(
              "quantitySold", 0);
          }
          copy.transaction = transaction;
          this._itemArray.push(copy);
        }
        if (!item.get("isEnded")) {
          if (item.get("sellerUserId").toLowerCase() == userId.toLowerCase()) {
            this._itemArray.push(item);
          }
        }
      } else {
        this._itemArray.push(item);
      }
    }

    // Default blank filter
    this._filter =
      function(item) {
        return true;
      };

    // Default sort by itemId
    this._lessThan =
      function(a, b) {
        return a.get("itemId") < b.get("itemId");
      };
  },

  /**
   * Filters the items in this list using the function provided, and sets the
   * filter used for automatically-added and removed items.
   * @param filter Function taking an item object as a parameter and returning
   *               true if it should be in the list, and false if it should not.
   */
  filter : function(filter) {
    if (filter) {
      this._filter = filter;
    }
    let filteredArray = [];
    let item;
    for (let i = 0; i < this._itemArray.length; i++) {
      item = this._itemArray[i];
      if (this._filter(item)) {
        filteredArray.push(item);
      }
    }

    this._itemArray = filteredArray;
  },

  /**
   * Sorts the items in this list using the quicksort algorithm, and sets the
   * sort order used for automatically-added and removed items.
   * @param lessThan Function taking two item objects as parameters and
   *                 returning true if the first should be sorted lower than
   *                 the second. If the parameter is null, the previous value
   *                 passed to this method is used.
   */
  sort : function(lessThan) {
    if (lessThan) {
      this._lessThan = lessThan;
    }
    this._itemArray = quicksort(this._itemArray, this._lessThan);
  },

  /**
   * Adds an object that will listen for add / remove events
   * @param listener The object that will listen for these events
   */
  addListener : function(listener) {
    this._listeners.push(listener);
  },

  /**
   * Notifies all listeners of the given event
   * @param eventName Name of the event (e.g. "itemAdded")
   * @param params Parameter list for the event. These will be passed into the
   *               event handler as arguments.
   */
  _notifyListeners : function(eventName, params) {
    try {
      let methodName = eventName + "Event";
      for (let i = 0; i < this._listeners.length; i++) {
        let listener = this._listeners[i];
        try {
          listener[methodName].apply(listener, params);
        }
        catch (e) {
          // this will happen if the event handler isn't implemented
        }
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Adds an item to the item list
   * @param item Item object to add
   */
  _addItem : function(item) {
    try {
      // Reject the item if the filter rejects it
      if (!this._filter(item)) {
        return;
      }
      let newIndex = binarySearch(item, this._itemArray, this._lessThan);
      // Avoid duplicates
      let existingItem = this._itemArray[newIndex];
      let sameItem = false;

      if (existingItem) {
        sameItem = (existingItem.get("itemId") == item.get("itemId"));
        if (sameItem) {
          if (existingItem.transaction != null &&
              item.transaction != null &&
              existingItem.transaction.get("transactionId") !=
                item.transaction.get("transactionId")) {
            sameItem = false;
          }
          // this removes items from the active tab when the user buys or wins
          // the auction. The item has to be active, the user be the buyer and
          // the collection item shouldn't a related transaction despite there
          // are transactions in the datasource. When these conditions are met,
          // we have to remove the item from the active list.
          let userId = Datasource.activeAccount().get("userId");
          let itemTransactions = Datasource.transactions(item.get("itemId"));
          if (!existingItem.get("isEnded") &&
              existingItem.get("sellerUserId").toLowerCase() !=
                userId.toLowerCase() &&
              existingItem.transaction == null &&
              itemTransactions) {
            this._removeItem(item, true);
          }
        }
      }

      if (!existingItem || !sameItem) {
        this._itemArray.splice(newIndex, 0, item);
        this._notifyListeners("itemAdded", [newIndex, item]);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Removes an item from the list
   * @param item object to remove
   * @force determines either we should or shouldn't display a "Recently ended
   * items moved to ended list" notification or not
   */
  _removeItem : function(item, force) {
    try {
      let itemIndex = binarySearch(item, this._itemArray, this._lessThan);
      let existingItem = this._itemArray[itemIndex];
      if (!existingItem) {
        return;
      }

      let sameItem = (existingItem.get("itemId") == item.get("itemId"));
      if (!sameItem) {
        // XXX: in case we didn't find the item with the binary search, we try
        // to iterate the whole list to find it
        let exhaustiveIndex = exhaustiveSearch(item, this._itemArray);
        if (null != exhaustiveIndex) {
          existingItem = this._itemArray[exhaustiveIndex];
          sameItem = (existingItem.get("itemId") == item.get("itemId"));
          itemIndex = exhaustiveIndex;
        }
      }

      // removed this code because we want to be able to remove sold, won and
      // any other ended items from my ebay page and see the sidebar reflect
      // those changes.
      /*if (sameItem) {
        // if the existing item has a transaction we shouldn't remove it because
        // that means we are in the ended tab, and we don't want to remove
        // transaction items
        if (existingItem.transaction != null) {
          sameItem = false;
        }
      }*/
      if (sameItem) {
        this._itemArray.splice(itemIndex, 1);
        this._notifyListeners("itemRemoved", [itemIndex, force, item.get("itemId")]);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Re-applies the filter to an item. Ensures the item is in the list if it
   * passes, and removed if not.
   * @param item The item object to filter.
   */
  _refilterItem : function(item) {
    if (this._filter(item)) {
      this._addItem(item);
    } else {
      this._removeItem(item);
    }
  },

  /**
   * Adds a transaction item to the item list
   * @param transaction transaction object to add
   */
  _addTransactionItem : function(transaction) {
    try {
      // get the related item first
      let item = Datasource.items()[transaction.get("itemId")];
      let userId = Datasource.activeAccount().get("userId");
      if (item) {
        // work with a copy so we can set it as ended without affecting the
        // original one that might not have ended.
        let itemCopy = item.copy();
        itemCopy.set("isEnded", true);
        itemCopy.transaction = transaction;
        if (itemCopy.get("sellerUserId").toLowerCase() ==
              userId.toLowerCase()) {
          itemCopy.set(
            "quantitySold", transaction.get("quantityPurchased"));
          itemCopy.set(
            "userQuantityWinning", 0);
        } else {
          // XXX: for BIN items with many units, the highBidderId column
          // is not set, so we have to set it in the representative item for
          // each transaction where the user was involved
          if (itemCopy.get("highBidderId").length == 0) {
            itemCopy.set("highBidderId", transaction.get("buyerUserId"));
          }
          itemCopy.set(
            "userQuantityWinning", transaction.get("quantityPurchased"));
          itemCopy.set(
            "quantitySold", 0);
        }
        // Reject the item if the filter rejects it
        if (!this._filter(itemCopy)) {
          return;
        }
        let newIndex = binarySearch(itemCopy, this._itemArray, this._lessThan);
        // Avoid duplicates
        let existingItem = this._itemArray[newIndex];
        let sameItem = false;

        if (existingItem) {
          sameItem = (existingItem.get("itemId") == itemCopy.get("itemId"));
          if (sameItem) {
            if (existingItem.transaction != null &&
                itemCopy.transaction != null &&
                existingItem.transaction.get("transactionId") !=
                  itemCopy.transaction.get("transactionId")) {
              sameItem = false;
            }
          }
        }
        if (!existingItem || !sameItem) {
          this._itemArray.splice(newIndex, 0, itemCopy);
          this._notifyListeners("itemAdded", [newIndex, itemCopy]);
        }
      }
    } catch (e) {
      Logger.exception(e);
    }
  }
}

/**
 * Quicksort algorithm
 * @param array The array to sort
 * @param lessThan Function taking two item objects and returning true
 *                 if the first should be sorted lower than the second
 * @return The sorted array
 */
function quicksort(array, lessThan) {
  if (array.length <= 1) {
    return array;
  }

  let less = [];
  let greater = [];
  let pivot = array.shift();
  for (let i = 0; i < array.length; i++) {
    if (lessThan(array[i], pivot)) {
      less.push(array[i]);
    } else {
      greater.push(array[i]);
    }
  }

  let left = quicksort(less, lessThan);
  let right = quicksort(greater, lessThan);

  return left.concat(pivot).concat(right);
}

/**
 * Searches for the given item in the given array, using the lessThan method to
 * determine when one item comes before another in the array.
 * @param item The Item object to search for
 * @param array The array of Item objects to search
 * @param lessThan Function taking two item objects and returning true if the
 *                 first appears before the other.
 * @return Array index that provides the closest match to the provided item.  If
 *         the provided item was not in the array, it will not be equal.
 */
function binarySearch(item, array, lessThan) {
  let low = 0;
  let high = array.length;
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (lessThan(array[mid], item)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  // Since there may be several items that are equal by sort order, so we need
  // to iterate through the list until we find an item with the same itemId, or
  // until we're sure it's not there.
  while (array[high + 1] && !lessThan(array[high], array[high + 1]) &&
         array[high].get("itemId") != item.get("itemId")) {
    high++;
  }
  return high;
}

/**
 * Iterates the entire list of items looking for a particular item. Used only
 * to remove an item when the binary search doesn't return it
 * @param aItem the item to be searched
 * @param aArray the array to be searched
 * @return the index of the item being searched, or null if not in the list
 */
function exhaustiveSearch(aItem, aArray) {
  let item;
  let index = null;
  for (var i = 0; i < aArray.length; i++) {
    if (aArray[i].get("itemId") == aItem.get("itemId")) {
      index = i;
      break;
    }
  }
  return index;
}
