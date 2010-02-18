/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["InformationNotificationHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var InformationNotificationHelper = {

  // Notification types

  // Information Notifications
  TERMS_CONDITIONS_CHANGED_NOTIFICATION : 1,
  LOGIN_EXPLAIN_NOTIFICATION : 2,
  FEEDBACK_NOTIFICATION : 3,
  NEW_MESSAGES_NOTIFICATION : 4,
  MARKETING_NOTIFICATION : 5,
  BEST_OFFER_NOT_SUPPORTED_NOTIFICATION : 6,

  // Notification topics
  INFO_NOTIFICATION_TOPIC : "ebay-information-notification",
  CLEAR_NOTIFICATION_BOX_TOPIC : "ebay-clear-information-notificationbox",

  // Information notification image
  INFO_NOTIFICATION_IMAGE :
    "chrome://ebaycompanion/skin/notification/infoNotification.png",

  // we DO queue information notifications, so we use an array for that purpose.
  // These are displayed on sidebar's bottom
  _infoNotifications : null,
  // the info notification currently being displayed. This allow us sorting
  // the info notifications array when new notifications are queued, and still
  // be able to remove it properly from the array when closed
  _currentInfoNotification : null,
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
        function() {that.clearQueue()},
        "ebay-account-logged-out");
      this._observers.add(
        function() {that._uninit()},
        "quit-application-granted");
      }
      this._infoNotifications = new Array();

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
   * Current info notification getter for general use
   * @return the currentInfoNotification variable value
   */
  get currentInfoNotification() {
    return this._currentInfoNotification;
  },

  /**
   * Function to keep information notifications sorted by their priority
   * @param aNotification1 the first notification to be compared
   * @param aNotification2 the second notification to be compared
   * @return which of the two goes first The lower the value the higher the
   * priority
   */
  sortNotifications : function(aNotification1, aNotification2) {
    return aNotification1.get("priority") - aNotification2.get("priority");
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
          this.INFO_NOTIFICATION_TOPIC,
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
   * Returns the next warning or information notification to be displayed.
   * Depending on whether it is an information notification, if it is also a
   * non-persistent notification (such as the T's & C's changed notification or
   * the login explain notification), it gets removed immediatelly from the
   * array. Other types of notifications remain in the array until they are
   * closed by the user when they are displayed on the sidebar. Then they are
   * removed. This method also sets the currentInfoNotification variable for
   * info notifications.
   */
  getNextNotification : function(aLevel) {
    let next = null;
    let tmp = null;
    try {
      if (this._infoNotifications.length > 0) {
        tmp = this._infoNotifications[0];
        if (null != this._currentInfoNotification) {
          // there is a higher priority notification, we should show it first
          if (this._currentInfoNotification.get("priority") >
              tmp.get("priority")) {
            next = tmp;
          } else {
            // there is no higher priority notification than then one
            // currently displayed. So, the next one should be the current
            // one
            next = this._currentInfoNotification;
          }
        } else {
          next = tmp;
        }

        // if the next notification is auto-dismissable (not persistent),
        // we remove it from the array immediately.
        if (!next.get("isPersistent")) {
          this._removeNotificationsByType(next.get("type"));
        }
        this._currentInfoNotification = next;
      }

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
      // first we remove any other notification with the same type, so we
      // don't have the same type of notification twice.
      this._removeNotificationsByType(aNotification.get("type"));
      // set notification image
      aNotification.set("imageURL", this.INFO_NOTIFICATION_IMAGE);
      // now queue the new notification and sort the array according to
      // notifications priority before notifying the observer
      this._infoNotifications.push(aNotification);
      this._infoNotifications.sort(this.sortNotifications);
      // if this is the first notification added to the array, we should
      // set the currentInfoNotification variable or it will be null when
      // we try to remove it from the array when closed
      if (this._infoNotifications.length == 1) {
        this._currentInfoNotification = aNotification;
      }
      // finally, this refreshes all the sidebars with the latest
      // notification
      this.showPendingNotifications();
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Dimisses an notification by removing it from the queue
   * @param aNotificationType the type of notification to be dismissed
   */
  dismissNotification : function(aNotificationType) {
    this._removeNotificationsByType(aNotificationType);
    this.showPendingNotifications();
  },

  /**
   * Removes all the notifications of the given type so we don't have duplicates
   * @param aType the type of notifications to be removed from the array
   */
  _removeNotificationsByType : function(aType) {
    try {
      // we should always have maximum one notification of each type any moment
      // so we can break the for once we found it
      for (var i = 0; i < this._infoNotifications.length; i++) {
        if (aType == this._infoNotifications[i].get("type")) {
          this._infoNotifications.splice(i, 1);
          break;
        }
      }
      this._currentInfoNotification = null;
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Removes the current notification from the array. Then requests the
   * display of any pending notifications
   */
  removeCurrentNotification : function(aIsPersistent) {
    try {
      // iterate the info notifications array searching the current one and
      // then remove it. We can use _removeNotificationsByType because
      // we should always have only one notification of each type in the
      // array
      if (null != this._currentInfoNotification && aIsPersistent) {
        this._removeNotificationsByType(
          this._currentInfoNotification.get("type"));
      }
      // show any pending notifications
      this.showPendingNotifications();
    } catch(e) {
      Logger.exception(e);
    }
  },

  /**
   * Clears the queue when the user signs out
   */
  clearQueue : function() {
    this._clearQueue();
    this.showPendingNotifications();
  },

  /**
   * Clears the information notification queue
   */
  _clearQueue : function() {
    try {
      // clean the information messages  array
      this._infoNotifications.splice(0, this._infoNotifications.length);
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Clears the currentInfoNotification  when the
   * sidebar is closed, so the next time it is opened, all windows are refreshed
   * properly.
   */
  clearCurrentNotification : function() {
    try {
      this._currentInfoNotification = null;
    } catch(e) {
      Logger.exception(e);
    }
  }

};

InformationNotificationHelper._init();
