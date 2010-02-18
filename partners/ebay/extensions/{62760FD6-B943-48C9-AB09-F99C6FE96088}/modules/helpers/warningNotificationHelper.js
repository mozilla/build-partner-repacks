/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["WarningNotificationHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var WarningNotificationHelper = {

  // Notification types

  // Warning notifications
  BEST_OFFER_NOT_SUPPORTED_WARNING : 10,
  LIST_LIMITED_WARNING : 11,
  API_CONNECTION_WARNING : 12,
  ADD_TO_WATCHLIST_ERROR_WARNING : 13,
  REMOVE_FROM_WATCHLIST_ERROR_WARNING : 14,
  HARD_UPDATE_ERROR_WARNING : 15,
  ITEM_MOVED_TO_ENDED_TAB_WARNING : 16,
  BIDDING_FILTER_WARNING : 17,
  WATCHING_FILTER_WARNING : 18,
  SELLING_FILTER_WARNING : 19,
  WATCHED_FILTER_WARNING : 20,
  WON_FILTER_WARNING : 21,
  LOST_FILTER_WARNING : 22,
  SOLD_FILTER_WARNING : 23,
  UNSOLD_FILTER_WARNING : 24,
  SIGNED_OUT_WARNING : 25,

  // Notification topics
  WARN_NOTIFICATION_TOPIC : "ebay-warning-notification",
  CLEAR_NOTIFICATION_BOX_TOPIC : "ebay-clear-warning-notificationbox",
  RESET_CURRENT_TAB_FILTER_TOPIC : "ebay-reset-current-tab-filter",

  // Warning notification image
  WARN_NOTIFICATION_IMAGE :
    "chrome://ebaycompanion/skin/notification/warningNotification.png",

  // we don't queue warning notifications, we just overwrite the existing one
  // if any. This are displayed on sidebar's top
  _warnNotification : null,
  // notification helper observers
  _observers : null,

  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");

      this._observers = new Observers;
      let (that = this) {
      this._observers.add(
        function() {that._uninit()},
        "quit-application-granted");
      }

    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    try {
      this._clearQueue();
      this._observers.removeAll();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Shows the pending notifications by getting the next one (if any) and
   * notifying the appropriate observer
   */
  showPendingNotifications : function() {
    try {
      let nextNotification = this.getNextNotification();

        if (null != nextNotification) {
          Observers.notify(
            nextNotification,
            this.WARN_NOTIFICATION_TOPIC,
            null);
        } else {
          // no next notification, then clear the notification boxes (if there
          // is any displayed)
          Observers.notify(
            null,
            this.CLEAR_NOTIFICATION_BOX_TOPIC,
            null);
        }
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Returns the next warning notification to be displayed.
   * @return the next notification to be displayed
   */
  getNextNotification : function() {
    let next = null;
    try {
      next = this._warnNotification;
    } catch(e) {
      Logger.exception(e);
      return null;
    }
    return next;
  },

  /**
   * Queues the notification passed as parameter.
   * Notifies the appropriate observer so the notification is
   * displayed in all windows sidebar.
   */
  queueNotification : function(aNotification) {
    try {
      // set notification image
      aNotification.set("imageURL", this.WARN_NOTIFICATION_IMAGE);
      // for warning notifications we just replace the current
      // warnNotification (if any) and notify the observer
      this._warnNotification = aNotification;
      // finally, this refreshes all the sidebars with the latest
      // notification
      this.showPendingNotifications();
    } catch (e) {
      Logger.exception(e);
    }
  },

   /**
   * Dimisses an alert by removing it from the queue
   * @param aNotificationType the type of notification to be dismissed
   */
  dismissNotification : function(aNotificationType) {
    this._removeNotificationsByType(aNotificationType);
    this.showPendingNotifications();
    // all filter notifications dismissal notifies the observer to reset
    // active or ended tab filtering
    if (aNotificationType >= this.BIDDING_FILTER_WARNING &&
        aNotificationType <= this.UNSOLD_FILTER_WARNING) {
      Observers.notify(
        null,
        this.RESET_CURRENT_TAB_FILTER_TOPIC,
        null);
    }
  },

  /**
   * Dismisses all filter notifications
   */
  dismissFilterNotifications : function() {
    for (var i = WarningNotificationHelper.BIDDING_FILTER_WARNING;
          i <= WarningNotificationHelper.UNSOLD_FILTER_WARNING;
          i++) {
      this._removeNotificationsByType(i);
    }
    this.showPendingNotifications();
  },

  /**
   * Removes all the notifications of the given type so we don't have duplicates
   * @param aType the type of notifications to be removed from the array
   */
  _removeNotificationsByType : function(aType) {
    try {
      if (this._warnNotification &&
          aType == this._warnNotification.get("type")) {
        this._warnNotification = null;
      }
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Removes the warning notification from the system. Then requests the
   * display of any pending notifications
   */
  removeCurrentNotification : function(aIsPersistent) {
    try {
      // remove the warning notification for warn notifications
      this._warnNotification = null;
      // show any pending notifications
      this.showPendingNotifications();
    } catch(e) {
      Logger.exception(e);
    }
  },

  /**
   * Clears the warning notification
   */
  _clearQueue : function() {
    try {
      this._warnNotification = null;
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Clears warnNotification variables when the sidebar is closed, so the next
   * time it is opened, all windows are refreshed properly.
   */
  clearCurrentNotification : function() {
    try {
      // non-persistent warning notifications should be removed here too
      if (null != this._warnNotification &&
          !this._warnNotification.get("isPersistent")) {
        this._warnNotification = null;
      }
    } catch(e) {
      Logger.exception(e);
    }
  }

};

WarningNotificationHelper._init();
