/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["AlertsService"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

const EBAYCOMP_ALERT_PREFERENCE_MAP = [
  "bidding.endingSoon",
  "bidding.outbid",
  "bidding.highBidder",
  "bidding.raisedBid",
  "bidding.itemWon",
  "bidding.itemLost",
  "watching.endingSoon",
  "selling.endingSoon",
  "selling.itemSold",
  "selling.itemUnsold",
  "selling.bidPlaced",
  "selling.reserveMet",
  "feedbackScore"
];

// Modules
Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/helpers/timer.js");
Cu.import("resource://ebaycompanion/datasource.js");
Cu.import("resource://ebaycompanion/constants.js");
Cu.import("resource://ebaycompanion/objects/item.js");
Cu.import("resource://ebaycompanion/objects/alert.js");
Cu.import("resource://ebaycompanion/objects/feedback.js");

var AlertsService = {

  /* Observers. */
  _observers : null,
  /* Primary alerts queue. */
  _primaryAlertsQueue : new Array(),
  /* Primary alerts index. */
  _primaryAlertsIndex : -1,
  /* Secondary alerts queue. */
  _secondaryAlertsQueue : new Array(),
  /* Slept alerts queue. */
  _sleptAlertsQueue : new Array(),
  /* Awake alerts timer. */
  _awakeAlertsTimer : null,
  /* Flag to know if the alert was displayed. */
  _alertDisplayed : false,
  /* Purge ending soon alerts timer */
  _purgeEndingSoonTimer : null,
  /* Sound service used to play sounds */
  _soundService : null,

  /**
   * Initialisation.
   */
  _init : function() {
    let that = this;

    this._soundService = Cc["@mozilla.org/sound;1"].getService(Ci.nsISound);
    // Initialise the sound service, so that there's no delay when the first
    // sound is played.
    try {
      this._soundService.init();
    } catch (e) {
      // there will be an exception if no sound is available
      Logger.error("There was an error initializing the sound service: " + e);
    }

    this._observers = new Observers;

    // purge the queues on startup.
    this._clearAlertsQueues();

    // add the uninit observer.
    this._observers.add(
      function() { that._uninit() }, "quit-application-granted");
    // listen the signed out event to clear the alerts queues.
    this._observers.add(
      function() { that._clearAlertsQueues(); }, "ebay-account-logged-out");
    // listen for dispatched alerts.
    this._observers.add(
      function(aAlert) { that._queueAlert(aAlert); }, "ebay-alert-dispatched");
    // keep track of removed items so we can dismiss all related alerts.
    this._observers.add(
      function(aSubject, aTopic, aData) {
        that._removeItemAlerts(aSubject.object);
      }, "ebay-item-removed");
    // listen for secondary alerts to be dismissed
    this._observers.add(
      function(aSubject, aTopic, aData) {
        that._removeItemAlerts(aSubject.object, true);
      }, "ebay-secondary-alert-dismissed");

    this._purgeEndingSoonTimer =
      new Timer(function() {that.purgeEndingSoonAlerts();},
                10000,
                Timer.TYPE_REPEATING_SLACK)
  },

  /**
   * Uninitialisation.
   */
  _uninit : function() {
    try {
      this._observers.removeAll();
      this._purgeEndingSoonTimer.cancel();
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Gets the primary alert index value.
   * @return the primary alert index value.
   */
  getPrimaryAlertsIndex : function() {
    return this._primaryAlertsIndex;
  },

  /**
   * Gets the primary alert size value.
   * @return the primary alert size value.
   */
  getPrimaryAlertsSize : function() {
    return this._primaryAlertsQueue.length;
  },

  /**
   * Gets the current primary alert.
   * @return the current primary alert.
   */
  getCurrentPrimaryAlert : function() {
    let currentAlert =  null;

    if (0 < this._primaryAlertsQueue.length) {
      currentAlert = this._primaryAlertsQueue[this._primaryAlertsIndex];
    }

    return currentAlert;
  },

  /**
   * Clears the queues of alerts.
   */
  _clearAlertsQueues : function() {
    this._primaryAlertsQueue = new Array();
    this._primaryAlertsIndex = -1;
    this._secondaryAlertsQueue = new Array();
    this._sleptAlertsQueue = new Array();

    if (this._awakeAlertsTimer) {
      this._awakeAlertsTimer.cancel();
      delete this._awakeAlertsTimer;
    }

    Observers.notify(null, "ebay-alert-close-item", null);
  },

  /**
   * Queues the given alert to the current alerts queue.
   * @param aAlert the alert to be queued.
   */
  _queueAlert : function(aAlert) {
    this._dismissDependentAlerts(aAlert);

    // queue the alert only if the user has the respective type of alert
    // enabled in the preferences dialog.
    if (this._canShowAlertType(aAlert.type)) {
      if (this._isPrimaryAlert(aAlert.type)) {
        // add it to the alert list.
        this._primaryAlertsQueue.push(aAlert);
        // display the alert.
        if (this._primaryAlertsIndex == -1) {
          this._primaryAlertsIndex = 0;
        }

        Observers.notify(aAlert, "ebay-alert-show-primary", null);

        this._displaySystemNotification(aAlert);

        if (Constants.prefBranch.get("alerts.enableSound")) {
          this._generateSoundForAlert(aAlert);
        }
      } else {
        this._secondaryAlertsQueue.push(aAlert);

        Observers.notify(aAlert, "ebay-alert-show-secondary", null);
      }
    } else {
      Logger.log("This alert type cannot be shown. Type: " + aAlert.type);
    }
  },

  /**
   * Indicates wheter the given alert type is allowed to be displayed.
   * @param aAlertType the type of alert.
   * @return true if this alert type is allowed to be displayed. false
   * otherwise.
   */
  _canShowAlertType : function(aAlertType) {
    return aAlertType != Alert.ALERT_TYPE_ITEM_ENDED &&
      Constants.prefBranch.get(
        "alerts." + EBAYCOMP_ALERT_PREFERENCE_MAP[aAlertType] + ".isEnabled");
  },

  /**
   * Indicates if an alert is primary or not.
   * @param aAlertType the alert to check whether it's primary or not.
   * @return true if the alert is primary, false otherwise.
   */
  _isPrimaryAlert : function(aAlertType) {
    return Constants.prefBranch.get(
      "alerts." + EBAYCOMP_ALERT_PREFERENCE_MAP[aAlertType] + ".isPrimary");
  },

  /**
   * Dismisses the alerts (primary and secondary) that depend on the alert
   * passed as parameter.
   * @param aAlert the alert to use to find alerts to be dismissed.
   */
  _dismissDependentAlerts : function(aAlert) {
    let dismissTypes = this._getDismissedAlertTypes(aAlert.type);
    let queueLength;
    let alert;
    let alertObject;
    let dismissAlertList = new Array();

    // see if any alerts have to be dismissed because of this one.
    if (dismissTypes != null) {
      // first iterate primary alerts queue
      queueLength = this._primaryAlertsQueue.length;
      for (var i = 0; i < queueLength; i++) {
        alert = this._primaryAlertsQueue[i];
        // make sure it is not a feedback alert
        alertObject = alert.object;
        if (alertObject instanceof Item && aAlert.object instanceof Item) {
          // first check if they have the same id.
          if (alertObject.get("itemId") == aAlert.object.get("itemId")) {
            for (var j = 0; j < dismissTypes.length; j++) {
              // then check if the list alert has any of the types that should
              // be dismissed.
              if (alert.type == dismissTypes[j]) {
                // XXX : dismissAlert func should be called outside the outer
                // loop because the dismissAlert func removes an element in
                // the _primaryAlertsQueue and shifts all the indexes in that
                // array.
                dismissAlertList.push(alert);
                break;
              }
            }
          }
        } else if (alertObject instanceof Feedback &&
            aAlert.object instanceof Feedback) {
          for (var h = 0; h < dismissTypes.length; h++) {
            // then check if the list alert has any of the types that should
            // be dismissed.
            if (alert.type == dismissTypes[h]) {
              // XXX : dismissAlert func should be called outside the outer
              // loop because the dismissAlert func removes an element in
              // the _primaryAlertsQueue and shifts all the indexes in that
              // array.
              dismissAlertList.push(alert);
              break;
            }
          }
        }
      }

      // now iterate the secondary alerts queue
      queueLength = this._secondaryAlertsQueue.length;
      for (var r = 0; r < queueLength; r++) {
        alert = this._secondaryAlertsQueue[r];
        // make sure it is not a feedback alert
        alertObject = alert.object;
        if (alertObject instanceof Item && aAlert.object instanceof Item) {
          // first check if they have the same id.
          if (alertObject.get("itemId") == aAlert.object.get("itemId")) {
            for (var s = 0; s < dismissTypes.length; s++) {
              // then check if the list alert has any of the types that should
              // be dismissed.
              if (alert.type == dismissTypes[s]) {
                // XXX : dismissAlert func should be called outside the outer
                // loop because the dismissAlert func removes an element in
                // the _secondaryAlertsQueue and shifts all the indexes in that
                // array.
                dismissAlertList.push(alert);
                break;
              }
            }
          }
        }
      }

      // finally, iterate sleptAlertsQueue
      queueLength = this._sleptAlertsQueue.length;
      for (var r = 0; r < queueLength; r++) {
        alert = this._sleptAlertsQueue[r];
        // make sure it is not a feedback alert
        alertObject = alert.object;
        if (alertObject instanceof Item && aAlert.object instanceof Item) {
          // first check if they have the same id.
          if (alertObject.get("itemId") == aAlert.object.get("itemId")) {
            for (var s = 0; s < dismissTypes.length; s++) {
              // then check if the list alert has any of the types that should
              // be dismissed.
              if (alert.type == dismissTypes[s]) {
                // XXX : dismissAlert func should be called outside the outer
                // loop because the dismissAlert func removes an element in
                // the _secondaryAlertsQueue and shifts all the indexes in that
                // array.
                dismissAlertList.push(alert);
                break;
              }
            }
          }
        }
      }

      // now dismiss the alerts
      for (var t = 0; t < dismissAlertList.length; t++) {
        this.dismissAlert(dismissAlertList[t]);
      }
    }
  },

  /**
   * Some alerts dismiss other alerts for the same item. This function returns
   * the alert types that should be looked for and dismissed for the item, given
   * the alert type of the new alert.
   * @param aAlertType the type of the new alert.
   * @return an array with the alert types that should be looked for and
   * dismissed for the item. null if there are no types to dismiss.
   */
  _getDismissedAlertTypes : function(aAlertType) {
    let dismissedTypes = null;

    switch (aAlertType) {
      case Alert.ALERT_TYPE_ITEM_ENDED:
        dismissedTypes = [
          Alert.ALERT_TYPE_WATCHING_ENDING_SOON,
          Alert.ALERT_TYPE_BIDDING_ENDING_SOON,
          Alert.ALERT_TYPE_SELLING_ENDING_SOON
        ];
        break;
      case Alert.ALERT_TYPE_BIDDING_ITEM_WON:
      case Alert.ALERT_TYPE_BIDDING_ITEM_LOST:
        dismissedTypes = [
          Alert.ALERT_TYPE_WATCHING_ENDING_SOON,
          Alert.ALERT_TYPE_BIDDING_ENDING_SOON,
          Alert.ALERT_TYPE_BIDDING_RAISED_BID,
          Alert.ALERT_TYPE_BIDDING_OUTBID,
          Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER
        ];
        break;
      case Alert.ALERT_TYPE_SELLING_ITEM_SOLD:
        dismissedTypes = [
          Alert.ALERT_TYPE_SELLING_ITEM_UNSOLD,
          Alert.ALERT_TYPE_SELLING_ENDING_SOON,
          Alert.ALERT_TYPE_SELLING_BID_PLACED
        ];
        break;
      case Alert.ALERT_TYPE_SELLING_ITEM_UNSOLD:
        dismissedTypes = [
          Alert.ALERT_TYPE_SELLING_ENDING_SOON,
          Alert.ALERT_TYPE_SELLING_BID_PLACED
        ];
        break;
      case Alert.ALERT_TYPE_BIDDING_OUTBID:
        dismissedTypes = [
          Alert.ALERT_TYPE_BIDDING_RAISED_BID,
          Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER
        ];
        break;
      case Alert.ALERT_TYPE_BIDDING_RAISED_BID:
        dismissedTypes = [
          Alert.ALERT_TYPE_BIDDING_OUTBID,
          Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER
        ];
        break;
      case Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER:
        dismissedTypes = [
          Alert.ALERT_TYPE_BIDDING_OUTBID,
          Alert.ALERT_TYPE_BIDDING_RAISED_BID
        ];
        break;
      case Alert.ALERT_TYPE_SELLING_BID_PLACED:
        dismissedTypes = [
          Alert.ALERT_TYPE_SELLING_BID_PLACED
        ];
        break;
      case Alert.ALERT_TYPE_FEEDBACK_SCORE:
        dismissedTypes = [ Alert.ALERT_TYPE_FEEDBACK_SCORE ];
        break;
    }

    return dismissedTypes;
  },

  /**
   * Dismisses the given alert.
   * @param aAlert the alert to dismiss.
   * @param aSkipSleptAlerts whether to skip the sleptAlertsQueue or not
   * @return true if the alert was found and dismissed, false otherwise.
   */
  dismissAlert : function(aAlert, aSkipSleptAlerts) {
    let removed = false;
    let queueLength;

    if (!aSkipSleptAlerts) {
      // iterate the slept alerts queue
      queueLength = this._sleptAlertsQueue.length;
      for (var k = 0; k < queueLength; k++) {
        if (aAlert.equals(this._sleptAlertsQueue[k])) {
          this._sleptAlertsQueue.splice(k, 1);
          removed = true;
          break;
        }
      }
      // if the sleptAlertsQueue got empty, we can cancel the timer (if it
      // exists of course)
      if (this._sleptAlertsQueue.length == 0 && this._awakeAlertsTimer) {
        this._awakeAlertsTimer.cancel();
        delete this._awakeAlertsTimer;
      }
    }

    // then iterate the primary alerts queue
    queueLength = this._primaryAlertsQueue.length;
    for (var i = 0; i < queueLength; i++) {
      if (aAlert.equals(this._primaryAlertsQueue[i])) {
        this._primaryAlertsQueue.splice(i, 1);
        removed = true;
        break;
      }
    }

    // if not found in the primary alerts queue, try the secondary one
    if (!removed) {
      queueLength = this._secondaryAlertsQueue.length;
      for (var j = 0; j < queueLength; j++) {
        if (aAlert.equals(this._secondaryAlertsQueue[j])) {
          this._secondaryAlertsQueue.splice(j, 1);
          removed = true;
          break;
        }
      }
    }

    if (removed) {
      if (0 < this._primaryAlertsQueue.length) {
        this._primaryAlertsIndex = 0;

        let currentAlert = this.getCurrentPrimaryAlert();

        Observers.notify(currentAlert, "ebay-alert-show-item", null);
      } else {
        Observers.notify(null, "ebay-alert-close-item", null);
      }
    }
  },

  /**
   * Removes all the alerts related to the given item.
   * @param aItem the item to remove all its alerts.
   * @param aOnlySecondary whether to iterate only the secondary alerts array
   * or not
   */
  _removeItemAlerts : function(aItem, aOnlySecondary) {
    let alert;
    let removed = false;
    // first go through primary alerts if we are not iterating only the
    // secondary alerts
    if (!aOnlySecondary) {
      for(var i = 0; i < this._primaryAlertsQueue.length; i++) {
        alert = this._primaryAlertsQueue[i];
        if (alert.object instanceof Item) {
          if (alert.object.get("itemId") == aItem.get("itemId")) {
            this._primaryAlertsQueue.splice(i, 1);
            removed = true;
          }
        }
      }
    }

    // then go through secondary alerts
    for(var j = 0; j < this._secondaryAlertsQueue.length; j++) {
      alert = this._secondaryAlertsQueue[j];
      if (alert.object instanceof Item) {
        if (alert.object.get("itemId") == aItem.get("itemId")) {
          this._secondaryAlertsQueue.splice(j, 1);
          removed = true;
        }
      }
    }

    // after dismissing an alerts, if the queue is not empty, go back to
    // the first one
    if (removed && !aOnlySecondary) {
      if (0 < this._primaryAlertsQueue.length) {
        this._primaryAlertsIndex = 0;

        let currentAlert = this.getCurrentPrimaryAlert();

        Observers.notify(currentAlert, "ebay-alert-show-item", null);
      } else {
        Observers.notify(null, "ebay-alert-close-item", null);
      }
    }
  },

  /**
   * Iterates the secondary alerts array and notifies the highlight item topic
   * to highlight it in the sidebar, when the sidebar filter changes
   */
  applySecondaryAlerts : function() {
    let alert;

    if (this._secondaryAlertsQueue) {
      for (var i = 0; i < this._secondaryAlertsQueue.length; i++) {
        alert = this._secondaryAlertsQueue[i];
        Observers.notify(alert, "ebay-alert-show-secondary", null);
      }
    }
  },

  /**
   * Displays an alert using the nsIAlertsService, which will be visible even
   * if the browser window is minimized.
   * @param aAlert the alert to display
   */
  _displaySystemNotification : function(aAlert) {
    let windowMediator =
      Cc["@mozilla.org/appshell/window-mediator;1"].
        getService(Ci.nsIWindowMediator);
    let mostRecentWindow =
      windowMediator.getMostRecentWindow("navigator:browser");
    let icon;
    let title;
    let message;
    let clickListener;

    // draw attention to the most recent browser window
    if (mostRecentWindow) {
      mostRecentWindow.getAttention();
    }

    // only display a system notification if the user is away from the browser
    // and it is an item alert
    if (mostRecentWindow.EbayCompanion.userIsAway &&
        aAlert.type != Alert.ALERT_TYPE_FEEDBACK_SCORE) {
      icon = "chrome://ebaycompanion/skin/common/extension-icon.png";
      let typePref = EBAYCOMP_ALERT_PREFERENCE_MAP[aAlert.type];
      let that = this;
      title =
        Constants.stringBundle.getString("ecAlert." + typePref + ".title");
      message = Constants.getUTF8(aAlert.object.get("title"));

      clickListener = {
        observe : function(aSubject, aTopic, aData) {
          if (aTopic == "alertclickcallback" && mostRecentWindow != null) {
            mostRecentWindow.focus();
            // XXX: for some reason Firefox 3.6 doesn't process the focus event
            // properly and is not enough to display the primary alerts when the
            // toaster alert is clicked, so we have to force the display
            that.showCurrentAlerts();
          } else if (aTopic == "alertfinished") {
            that._alertDisplayed = false;
          }
        }
      };

      // growl is fully integrated in firefox 3, so if the user doesn't have it
      // nothing bad happens.
      // XXX: in windows, if we display multiple alerts at the same time, it
      // can cause problems, so we make sure we display only one of them
      if (!this._alertDisplayed) {
        this._alertDisplayed = true;
        let alertsService =
          Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        alertsService.
          showAlertNotification(icon, title, message, true, "", clickListener);
      }
    }
  },

  /**
   * Generates a sound for the given alert, depending on the alert type.
   * @param aAlert the alert for which to produce the sound
   */
  _generateSoundForAlert : function(aAlert) {
    const ALERT_DIR = "chrome://ebaycompanion/skin/sounds/";
    const ALERT_GENERIC = ALERT_DIR + "alert-generic.wav";
    const ALERT_OUTBID = ALERT_DIR + "alert-outbid.wav";
    const ALERT_SUCCESS = ALERT_DIR + "alert-success.wav";

    let soundURL =
      Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIURL);

    // choose the correct sound file, depending on the alert type
    switch (aAlert.type) {
      case Alert.ALERT_TYPE_BIDDING_ITEM_WON:
      case Alert.ALERT_TYPE_SELLING_ITEM_SOLD:
        soundURL.spec = ALERT_SUCCESS;
        break;
      case Alert.ALERT_TYPE_BIDDING_OUTBID:
        soundURL.spec = ALERT_OUTBID;
        break;
      case Alert.ALERT_TYPE_FEEDBACK_SCORE:
        soundURL = null;
        break;
      default:
        soundURL.spec = ALERT_GENERIC;
        break;
    }

    if (soundURL) {
      try {
        this._soundService.play(soundURL);
      } catch (e) {
        // an error will be thrown if no sound is available
        Logger.error("Unable to play sound: " + soundURL.spec + ". " + e);
      }
    }
  },

  /**
   * Displays the previous alert in the alerts queue.
   */
  moveToPreviousAlert : function() {
    if (0 < this._primaryAlertsIndex) {
      this._primaryAlertsIndex--;
      let currentAlert = this.getCurrentPrimaryAlert();

      Observers.notify(currentAlert, "ebay-alert-show-item", null);
    }
  },

  /**
   * Displays the next alert in the alerts queue.
   */
  moveToNextAlert : function() {
    if (this._primaryAlertsIndex < this._primaryAlertsQueue.length - 1) {
      this._primaryAlertsIndex++;
      let currentAlert = this.getCurrentPrimaryAlert();

      Observers.notify(currentAlert, "ebay-alert-show-item", null);
    }
  },

  /**
   * Remind later
   */
  remindLater : function() {
    let currentAlert = this.getCurrentPrimaryAlert();

    // queue it in the sleptAlertsQueue
    this._sleptAlertsQueue.push(currentAlert);
    // dismiss it from the primaryAlertsQueue.
    this.dismissAlert(currentAlert, true);
    // if this is the first alert put to sleep, set the _awakeAlertsTimer
    // to iterate the sleptAlertsQueue to see which alerts should be awakened
    if (this._sleptAlertsQueue.length == 1) {
      // 30 secs interval
      const AWAKE_ALERTS_TIMER_INTERVAL = 30 * 1000;
      let that = this;
      this._awakeAlertsTimer = new Timer(
        function() { that._awakeAlerts(); },
        AWAKE_ALERTS_TIMER_INTERVAL, Timer.TYPE_REPEATING_SLACK);
    }
  },

  /**
   * Iterates the slept alerts queue to see which of them should be awakened
   */
  _awakeAlerts : function() {
    if (this._sleptAlertsQueue.length > 0) {
      // just like in _dismissDependentAlerts, we can't remove the alert from
      // the array immediately since that would alterate the array length and
      // cause us problems
      let awakenedAlerts = new Array();
      let alert;
      let item;
      let timeLeft;
      for (var i = 0; i < this._sleptAlertsQueue.length; i++) {
        alert = this._sleptAlertsQueue[i];
        // check the alert should be awakened (time left < 5 mins)
        item = alert.object;
        timeLeft = item.get("endTime") - Datasource.getEbayTime().getTime();
        let minutesLeft = timeLeft / 1000 / 60;
        if (minutesLeft < 5) {
          // the alert should be awakened, but only if the item is still in the
          // local collection
          if (Datasource.items()[item.get("itemId")]) {
            this._queueAlert(alert);
          }
          // set the alert to be removed from the sleptAlertsQueue
          awakenedAlerts.push(alert);
        }
      }

      // now we can safely remove the awakened alerts from the sleptAlertsQueue
      for (var j = 0; j < awakenedAlerts.length; j++) {
        for (var k = 0; k < this._sleptAlertsQueue.length; k++) {
          if (awakenedAlerts[j].equals(this._sleptAlertsQueue[k])) {
            this._sleptAlertsQueue.splice(k, 1);
          }
        }
      }

      // finally, if the sleptAlertsQueue is empty, we can cancel the timer
      if (this._sleptAlertsQueue.length == 0) {
        this._awakeAlertsTimer.cancel();
        delete this._awakeAlertsTimer;
      }
    }
  },

  /**
   * Shows the current alerts when a new window is open.
   */
  showCurrentAlerts : function() {
    if (0 < this._primaryAlertsQueue.length) {
      let currentAlert = this.getCurrentPrimaryAlert();

      if (this._canShowAlertType(currentAlert.type)) {
        if (this._isPrimaryAlert(currentAlert.type)) {
          Observers.notify(currentAlert, "ebay-alert-show-primary", null);
        }
      }
    }
  },

  /**
   * Checks ending soon alerts and dismisses them when the related item runs
   * out of time left
   */
  purgeEndingSoonAlerts : function() {
    let queueLength = this._primaryAlertsQueue.length;
    let alert;
    let item;
    for (var i = 0; i < queueLength; i++) {
      alert = this._primaryAlertsQueue[i];
      if (alert.type == Alert.ALERT_TYPE_BIDDING_ENDING_SOON ||
          alert.type == Alert.ALERT_TYPE_SELLING_ENDING_SOON ||
          alert.type == Alert.ALERT_TYPE_WATCHING_ENDING_SOON) {
        item = alert.object;
        let endTime = item.get("endTime");
        let ebayTime = Datasource.getEbayTime().getTime();
        let timeLeft = Math.max(0, endTime - ebayTime);
        if (timeLeft == 0) {
          this.dismissAlert(alert, true);
        }
      }
    }

  }
};

AlertsService._init();
