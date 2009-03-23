/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{09CEDE09-116B-44EA-8986-34003B0924B7}");
const CLASS_NAME = "Autotrader Alert Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-alert-service;1";
/* String bundle constants */
const EBAYCOMP_STRING_BUNDLE_FILE =
  "chrome://ebaycompanion/locale/ebay.properties";
const EBAYCOMP_ALERT_TITLE_PREFIX = "ebayComp.alerts.title.";
/* Topics for alert notifications. */
const EBAYCOMP_TOPIC_NEW_ALERT = "ebayComp-new-alert";
const EBAYCOMP_TOPIC_ALERT_DISMISSED = "ebayComp-dismiss-alert";
/* Alert preferences. */
const EBAYCOMP_PREF_CHANGED = "nsPref:changed";
const EBAYCOMP_BRANCH_ALERTS = "extensions.ebaycomp.alerts.";
const EBAYCOMP_BRANCH_ALERTS_PRIMARY = EBAYCOMP_BRANCH_ALERTS + "isPrimary.";
const EBAYCOMP_BRANCH_ALERTS_ENABLESOUND =
  EBAYCOMP_BRANCH_ALERTS + "enableSound";
/* On/off alert preferences. */
const EBAYCOMP_ALERT_SWITCH_PREFERENCES_MAP =
  [ EBAYCOMP_BRANCH_ALERTS + "showWatchEnding",
    EBAYCOMP_BRANCH_ALERTS + "showBidEnding",
    EBAYCOMP_BRANCH_ALERTS + "showSellEnding",
    EBAYCOMP_BRANCH_ALERTS + "showWatchEnded",
    EBAYCOMP_BRANCH_ALERTS + "showOutbid",
    EBAYCOMP_BRANCH_ALERTS + "showHighBidder",
    EBAYCOMP_BRANCH_ALERTS + "showBidRaised",
    EBAYCOMP_BRANCH_ALERTS + "showWon",
    EBAYCOMP_BRANCH_ALERTS + "showLost",
    EBAYCOMP_BRANCH_ALERTS + "showSold",
    EBAYCOMP_BRANCH_ALERTS + "showUnsold",
    EBAYCOMP_BRANCH_ALERTS + "showReserveMet",
    EBAYCOMP_BRANCH_ALERTS + "showNewBid",
    EBAYCOMP_BRANCH_ALERTS + "showNewFeedback",
    EBAYCOMP_BRANCH_ALERTS + "showFeedbackScore" ];
/* Primary / secondary alert preferences. */
const EBAYCOMP_ALERT_PRIMARY_PREFERENCES_MAP =
  [ EBAYCOMP_BRANCH_ALERTS_PRIMARY + "watchEnding",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "bidEnding",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "sellEnding",
    null, EBAYCOMP_BRANCH_ALERTS_PRIMARY + "outbid",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "highBidder",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "bidRaised",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "won",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "lost",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "sold",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "unsold",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "reserveMet",
    EBAYCOMP_BRANCH_ALERTS_PRIMARY + "newBid", null, null ];
const EBAYCOMP_ALERT_COUNT = EBAYCOMP_ALERT_SWITCH_PREFERENCES_MAP.length;
/* The amount of time left for an item when its alert should be awakened. The 10
   second added time is due to the 10 second refresh tick rate. */
const EBAYCOMP_SLEEP_AWAKE_TIME = "PT5M10S"; // 5 minutes, 10 seconds.

/**
 * eBay alert service.
 * @author Jorge Villalobos Glaxstar Corp.
 */
var EbayAlertService = {
  /* log service */
  _logService : null,
  /* datasource service. */
  _dsService : null,
  /* observer service. */
  _observerService : null,
  /* string bundle for localisation */
  _stringBundle : null,
  /* the alert queue. */
  _alertList : new Array(),
  /* the values of the on/off alert preferences. */
  _switchAlertPreferences : new Array(),
  /* the values of the primary alert preferences. */
  _primaryAlertPreferences : new Array(),
  /* matrix of cancelled alerts. */
  _cancelledAlerts : new Array(),
  /* the interval that represents the time left when an alert should be
     awakened.*/
  _sleepAwakeTime : null,
  /* timestamp of the last alert reset. */
  _lastReset : 0,

  /**
   * Initialize the component.
   */
  init : function() {
    var timer = CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
    var that = this;

    //dump("EbayAlertService.init().\n");

    var prefService = CC["@mozilla.org/preferences-service;1"].
                        getService(CI.nsIPrefBranch);
    var stringBundleService = CC["@mozilla.org/intl/stringbundle;1"].
                                getService(CI.nsIStringBundleService);
    var soundService = CC["@mozilla.org/sound;1"].getService(CI.nsISound);

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._observerService =
      CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
    this._stringBundle =
      stringBundleService.createBundle(EBAYCOMP_STRING_BUNDLE_FILE);

    // Avoid cycles in initialisation.
    // This would otherwise break debug builds.
    timer.initWithCallback({
      notify : function() {
        that._dsService =
          CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
            getService(CI.gsIAutotraderDatasourceService);
      }
    }, 0, CI.nsITimer.TYPE_ONE_SHOT);

    // Initialise the sound service, so that there's no delay when the first
    //   sound is played.
    try {
      soundService.init();
    }
    catch (e) {
      // there will be an exception if no sound is available
    }

    for (var i = 0; i < EBAYCOMP_ALERT_COUNT; i++) {
      //set the initial values of the preferences.
      this._switchAlertPreferences[i] =
        prefService.getBoolPref(EBAYCOMP_ALERT_SWITCH_PREFERENCES_MAP[i]);

      if (EBAYCOMP_ALERT_PRIMARY_PREFERENCES_MAP[i] != null) {
        this._primaryAlertPreferences[i] =
          prefService.getBoolPref(EBAYCOMP_ALERT_PRIMARY_PREFERENCES_MAP[i]);
      } else {
        this._primaryAlertPreferences[i] = null;
      }

      // initialize the cancelled alerts matrix.
      this._cancelledAlerts[i] = new Array();
    }
    // initialize the time left interval to awake alerts.
    this._sleepAwakeTime =
      CC["@glaxstar.org/autotrader/autotrader-time-interval;1"].
        createInstance(CI.gsIAutotraderTimeInterval);
    this._sleepAwakeTime.init(EBAYCOMP_SLEEP_AWAKE_TIME);
    // register a preference observer.
    prefService.QueryInterface(CI.nsIPrefBranch2);
    prefService.addObserver(EBAYCOMP_BRANCH_ALERTS, this, false);
    // register an observer for login / logout.
    this._observerService.addObserver(this, "ebayComp-login-status", false);
  },

  /**
   * Obtains the amount of time left an item will have when its alert will be
   * awakened after being put to sleep.
   * @return the amount of time left an item will have when its alert will be
   * awakened after being put to sleep, represented as a
   * gsIAutotraderTimeInterval.
   */
  get SLEEP_AWAKE_TIME_LEFT() {
    return this._sleepAwakeTime;
  },

  /**
   * Adds an alert to the service.
   * @param aAlertType the type of alert being added.
   * @param aItem the item that triggered the alert.
   * @param aFeedback the feedback object associated with the alert (null when
   * not a feedback alert).
   */
  addAlert : function(aAlertType, aItem, aFeedback) {
    this._logService.debug(
      "Begin: EbayAlertService.addAlert. Type: " + aAlertType);

    var itemId = aItem.id;
    var isValid = !aItem.isDuplicate;

    if (isValid) {
      var cancelledIds = this._cancelledAlerts[aAlertType];
      // check if the alert has been cancelled for this item.
      for (var i = 0, m = cancelledIds.length; i < m; i++) {
        if (cancelledIds[i] == itemId) {
          isValid = false;
          break;
        }
      }
    }

    if (isValid) {
      var currentTime = (new Date()).getTime();
      var autotraderAlert =
        CC["@glaxstar.org/autotrader/autotrader-alert;1"].
          createInstance(CI.gsIAutotraderAlert);

      autotraderAlert.init(aAlertType, currentTime, aItem, aFeedback);
      this._addAlert(autotraderAlert);
    }
  },

  /**
   * Adds a feedback score alert to the service.
   * @param aFeedbackScore the new feedback score.
   */
  addFeedbackScoreAlert : function(aFeedbackScore) {
    this._logService.debug(
      "Begin: EbayAlertService.addFeedbackScoreAlert. Score: " +
      aFeedbackScore);

    var currentTime = (new Date()).getTime();
    var autotraderAlert =
      CC["@glaxstar.org/autotrader/autotrader-alert;1"].
        createInstance(CI.gsIAutotraderAlert);

    autotraderAlert.initFeedbackScore(currentTime, aFeedbackScore);
    this._addAlert(autotraderAlert);
  },

  /**
   * Obtains a list with the pending (not dismissed) secondary alerts.
   * @param aCount the number of items on the list.
   * @param aAlertList the list with the pending (not dismissed) secondary
   * alerts.
   */
  getPendingSecondaryAlerts : function(aCount, aAlertList) {
    this._logService.debug(
      "Begin: EbayAlertService.getPendingSecondaryAlerts");

    var secondaryList = new Array();
    var currentAlert;
    var length;

    length = this._alertList.length;
    for (var i = 0; i < length; i++) {
      currentAlert = this._alertList[i];

      if (this.isSecondaryAlert(currentAlert)) {
        secondaryList.push(currentAlert);
      }
    }

    aAlertList.value = secondaryList;
    aCount.value = secondaryList.length;
  },

  /**
   * Obtains a list of primary alerts.
   * @param aCount the number of items on the list.
   * @param aAlertList the list of primary alerts.
   */
  getPrimaryAlerts : function(aCount, aAlertList) {
    this._logService.debug(
      "Begin: EbayAlertService.getPrimaryAlerts");

    var primaryList = new Array();
    var currentAlert;
    var length;

    length = this._alertList.length;
    for (var i = 0; i < length; i++) {
      currentAlert = this._alertList[i];

      if (this.isPrimaryAlert(currentAlert)) {
        primaryList.push(currentAlert);
      }
    }

    aAlertList.value = primaryList;
    aCount.value = primaryList.length;
  },

  /**
   * Puts the given alert to sleep, for a predetermined amount of time.
   * @param aAlert the alert to put to sleep.
   */
  sleepAlert : function(aAlert) {
    this._logService.debug("Begin: EbayAlertService.sleepAlert");

    var alertItem = aAlert.item;
    var alertListLength = this._alertList.length;
    var found = false;
    // first verify that the alert is on the current list.
    for (var i = 0; i < alertListLength; i++) {
      if (aAlert.equals(this._alertList[i])) {
        found = true;
        break;
      }
    }
    // if the alert is found, put it to sleep.
    if (found && alertItem) {
      var timeLeft = alertItem.timeLeft;
      // note we remove the 10 seconds to be accurate when awaking the alert.
      var sleepTime =
        ((timeLeft.minutes - this._sleepAwakeTime.minutes) * 60 +
         timeLeft.seconds - this._sleepAwakeTime.seconds + 10) * 1000;

      if (sleepTime > 0) {
        var timer =
          CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
        var callback = {
          notify: function() {
            EbayAlertService._awakeAlert(aAlert, sleepTime);
          }
        };
        timer.initWithCallback(callback,
                               sleepTime,
                               CI.nsITimer.TYPE_ONE_SHOT);
      } else {
        this._logService.error(
          "The alert has less time left than the predefined awake time. " +
          "Time difference: " + sleepTime);
      }
    } else {
      this._logService.error(
        "The alert wasn't found in the current alert list.");
    }
  },

  /**
   * Awake an alert that has been put to sleep.
   * @param aAlert the alert to wake up.
   * @param aSleepTime the amount of time the alert was put to sleep.
   */
  _awakeAlert : function(aAlert, aSleepTime) {
    this._logService.trace("Begin: EbayAlertService._awakeAlert");

    var currentTime = (new Date()).getTime();
    var alertListLength;

    // check that alerts haven't been reset while this alert was sleeping.
    if ((currentTime - this._lastReset) > aSleepTime) {
      // ensure the alert is still in the list before displaying it.
      alertListLength = this._alertList.length;
      for (var i = 0; i < alertListLength; i++) {
        if (aAlert.equals(this._alertList[i])) {
          this._sendAlert(aAlert);
          break;
        }
      }
    } else {
      this._logService.debug(
        "An awaken alert was dropped because all alerts were reset");
    }
  },

  /**
   * Indicates if an alert is primary or not.
   * @param aAlert the alert to check whether it's primary or not.
   * @return true if the alert is primary, false otherwise.
   */
  isPrimaryAlert : function(aAlert) {
    this._logService.debug("Begin: EbayAlertService.isPrimaryAlert");

    var alertType = aAlert.type;
    var isPrimary = false;

    if (this._canShowAlertType(alertType)) {
      if (this._primaryAlertPreferences[alertType] != null) {
         isPrimary = this._primaryAlertPreferences[alertType];
      } else {
        isPrimary =
          (CI.gsIAutotraderAlert.ALERT_TYPE_FEEDBACK_SCORE == alertType);
      }
    }

    return isPrimary;
  },

  /**
   * Indicates if an alert is secondary or not.
   * @param aAlert the alert to check whether it's secondary or not.
   * @return true if the alert is secondary, false otherwise.
   */
  isSecondaryAlert : function(aAlert) {
    this._logService.debug("Begin: EbayAlertService.isSecondaryAlert");

    var alertType = aAlert.type;
    var isSecondary =
      (this._canShowAlertType(alertType) &&
       (this._primaryAlertPreferences[alertType] != null) &&
       !this._primaryAlertPreferences[alertType]);

    return isSecondary;
  },

  /**
   * Adds an alert to the service.
   * @param aAlert the alert to add.
   */
  _addAlert : function(aAlert) {
    this._logService.trace("Begin: EbayAlertService._addAlert");

    var dismissTypes = this._getDismissedAlertTypes(aAlert.type);
    var dismissAlertList = new Array();
    var listAlert;
    var alertListLength;
    var dismissTypesLength;
    var dismissAlertListLength;

    // see if any alerts have to be dismissed because of this one.
    if (dismissTypes != null) {
      alertListLength = this._alertList.length;
      dismissTypesLength = dismissTypes.length;

      for (var i = 0; i < alertListLength; i++) {
        listAlert = this._alertList[i];
        // first check if they have the same id.
        if (listAlert.item.id == aAlert.item.id) {
          for (var j = 0; j < dismissTypesLength; j++) {
            // then check if the list alert has any of the types that should be
            // dismissed.
            if (listAlert.type == dismissTypes[j]) {
              // XXX : dismissAlert func should be called outside the outer loop
              // because the dismissAlert func removes an element in
              // the _alertList and shifts all the indexes in that array.
              dismissAlertList.push(listAlert);
            }
          }
        }
      }
      // dismiss alerts
      dismissAlertListLength = dismissAlertList.length;
      for (var i = 0; i < dismissAlertListLength; i++) {
        this.dismissAlert(dismissAlertList[i]);
      }
    }

    if (this._canShowAlertType(aAlert.type)) {
      // add it to the alert list.
      this._alertList.push(aAlert);
      // see if the alert should be cancelled for the future.
      this._setCancelledAlert(aAlert);
      // display the alert.
      this._sendAlert(aAlert);
    } else {
      this._logService.debug("This alert type cannot be shown.");
    }
  },

  /**
   * Sends the alert to all observers and displays a system notification
   * @param aAlert the alert to send.
   */
  _sendAlert : function(aAlert) {
    var prefService = CC["@mozilla.org/preferences-service;1"].
                        getService(CI.nsIPrefBranch);
    var soundsAreEnabled;

    this._observerService.
      notifyObservers(aAlert, EBAYCOMP_TOPIC_NEW_ALERT, null);

    this._displaySystemNotification(aAlert);

    soundsAreEnabled = prefService.
                         getBoolPref(EBAYCOMP_BRANCH_ALERTS_ENABLESOUND);

    if (soundsAreEnabled) {
      this._generateSoundForAlert(aAlert);
    }
  },

  /**
   * Displays an alert using the nsIAlertsService, which will be visible even
   *   if the browser window is minimized.
   * @param aAlert the alert to display
   */
  _displaySystemNotification : function(aAlert) {
    var windowMediator = CC["@mozilla.org/appshell/window-mediator;1"].
                           getService(CI.nsIWindowMediator);
    var mostRecentWindow = windowMediator.
                             getMostRecentWindow("navigator:browser");
    var growlIsAvailable =  CC["@growl.info/notifications;1"] != null;

    var icon;
    var title;
    var message;
    var clickListener;

    // draw attention to the most recent browser window
    if (mostRecentWindow) {
      mostRecentWindow.getAttention();
    }

    // only display a system notification if the user is away from the browser
    if (mostRecentWindow.EBayComp.userIsAway) {
      icon = "chrome://ebaycompanion/skin/eBay32x32.png";
      title = this._stringBundle.
                GetStringFromName(EBAYCOMP_ALERT_TITLE_PREFIX + aAlert.type);
      message = aAlert.item.title;
      clickListener = {
        observe : function(aSubject, aTopic, aData) {
          if (aTopic == "alertclickcallback"  && mostRecentWindow != null) {
            mostRecentWindow.focus();
            if (growlIsAvailable) {
              CC["@growl.info/notifications;1"].getService(CI.grINotifications).
                makeAppFocused();
            }
          }
        }
      };

      // if Growl (MacOS X) is not available, use the standard alerts service
      if (!growlIsAvailable) {
        try {
          var alertsService = CC["@mozilla.org/alerts-service;1"].
                                getService(CI.nsIAlertsService);
          alertsService.
            showAlertNotification(icon, title, message, true, "", clickListener);
        }
        catch (e) {
          // MacOS X causes an exception when calling getService
        }
      } else {
        // the Growl service is available, so we'll use that
        var growlService = CC["@growl.info/notifications;1"]
                             .getService(CI.grINotifications);
        growlService.
          sendNotification("General Notification", icon, title, message, "",
                           clickListener);
      }
    }
  },

  /**
   * Generates a sound for the given alert, depending on the alert type.
   * @param aAlert the alert for which to produce the sound
   */
  _generateSoundForAlert : function(aAlert) {
    const ALERT_DIR = "chrome://ebaycompanion/skin/";
    const ALERT_GENERIC = ALERT_DIR + "alert-generic.wav";
    const ALERT_OUTBID = ALERT_DIR + "alert-outbid.wav";
    const ALERT_SUCCESS = ALERT_DIR + "alert-success.wav";

    var soundService = CC["@mozilla.org/sound;1"].getService(CI.nsISound);
    var soundURL = CC["@mozilla.org/network/standard-url;1"].
                     createInstance(CI.nsIURL);

    // choose the correct sound file, depending on the alert type
    switch (aAlert.type) {
      case CI.gsIAutotraderAlert.ALERT_TYPE_WON:
      case CI.gsIAutotraderAlert.ALERT_TYPE_SOLD:
        soundURL.spec = ALERT_SUCCESS;
        break;

      case CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID:
        soundURL.spec = ALERT_OUTBID;
        break;

      case CI.gsIAutotraderAlert.ALERT_TYPE_NEW_FEEDBACK:
      case CI.gsIAutotraderAlert.ALERT_TYPE_FEEDBACK_SCORE:
        soundURL = null;
        break;

      default:
        soundURL.spec = ALERT_GENERIC;
        break;
    }

    if (soundURL) {
      try {
        soundService.play(soundURL);
      }
      catch (e) {
        // an error will be thrown if no sound is available
      }
    }
  },

  /**
   * Dismisses the given alert.
   * @param aAlert the alert to dismiss.
   */
  dismissAlert : function(aAlert) {
    this._logService.debug("Begin: EbayAlertService.dismissAlert");

    if (this._dismissAlert(aAlert)) {
      this._observerService.notifyObservers(
        aAlert, EBAYCOMP_TOPIC_ALERT_DISMISSED, null);
    }
  },

  /**
   * Dismisses the given alerts.
   * @param aCount the amount of alerts being dismissed.
   * @param aAlertList the list of alerts to dismiss.
   */
  dismissAlerts : function(aCount, aAlertList) {
    this._logService.debug(
      "Begin: EbayAlertService.dismissAlerts. Count: " + aCount);

    for (var i = 0; i < aCount; i++) {
      this._dismissAlert(aAlertList[i]);
    }
  },

  /**
   * Dismisses the given alert.
   * @param aAlert the alert to dismiss.
   * @return true if the alert was found and dismissed, false otherwise.
   */
  _dismissAlert : function(aAlert) {
    this._logService.debug("Begin: EbayAlertService._dismissAlert");

    var removed = false;
    var listLength;

    listLength = this._alertList.length;
    for (var i = 0; i < listLength; i++) {
      if (aAlert.equals(this._alertList[i])) {
        this._alertList.splice(i, 1);
        removed = true;
        break;
      }
    }

    if (!removed) {
      this._logService.warn("A dismissed alert wasn't found.");
    }

    return removed;
  },

  /**
   * Resets everything about alerts.
   */
  _resetAlerts : function() {
    this._logService.debug("Begin: EbayAlertService.resetAlerts");

    var start = this._alertList.length - 1;
    // set the last reset time.
    this._lastReset = (new Date()).getTime();
    // dismiss all alerts.
    for (var i = start; i >= 0; i--) {
      this._observerService.notifyObservers(
        this._alertList[i], EBAYCOMP_TOPIC_ALERT_DISMISSED, null);
      this._alertList.splice(i, 1);
    }

    for (var i = 0; i < EBAYCOMP_ALERT_COUNT; i++) {
      this._cancelledAlerts[i].splice(0, this._cancelledAlerts[i].length);
    }
  },

  /**
   * Cancels an alert for the future if necessary.
   * @param aAlert the alert to verify whether it should be cancelled.
   */
  _setCancelledAlert : function(aAlert) {
    this._logService.trace("Begin: EbayAlertService._setCancelledAlert.");

    var alertType = aAlert.type;

    if (CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_BID_ENDING == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_SELL_ENDING == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDED == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_WON == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_LOST == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_SOLD == alertType ||
        CI.gsIAutotraderAlert.ALERT_TYPE_UNSOLD == alertType) {
      this._cancelledAlerts[alertType].push(aAlert.item.id);
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
    this._logService.trace(
      "Begin: EbayAlertService._getDismissedAlertTypes. Type: " +
      aAlertType);

    var dismissedTypes = null;

    switch (aAlertType) {
      case CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDED:
        dismissedTypes = [ CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING ];
        break;
      case CI.gsIAutotraderAlert.ALERT_TYPE_WON:
      case CI.gsIAutotraderAlert.ALERT_TYPE_LOST:
        dismissedTypes =
          [ CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING,
            CI.gsIAutotraderAlert.ALERT_TYPE_BID_ENDING,
            CI.gsIAutotraderAlert.ALERT_TYPE_HIGH_BIDDER,
            CI.gsIAutotraderAlert.ALERT_TYPE_BID_RAISED,
            CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID ];
        break;
      case CI.gsIAutotraderAlert.ALERT_TYPE_SOLD:
      case CI.gsIAutotraderAlert.ALERT_TYPE_UNSOLD:
        dismissedTypes =
          [ CI.gsIAutotraderAlert.ALERT_TYPE_SELLING_ENDING,
            CI.gsIAutotraderAlert.ALERT_TYPE_RESERVE_MET,
            CI.gsIAutotraderAlert.ALERT_TYPE_NEW_BID ];
        break;
      case CI.gsIAutotraderAlert.ALERT_TYPE_HIGH_BIDDER:
        dismissedTypes = [ CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID ];
        break;
      case CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID:
        dismissedTypes =
          [ CI.gsIAutotraderAlert.ALERT_TYPE_HIGH_BIDDER,
            CI.gsIAutotraderAlert.ALERT_TYPE_BID_RAISED ];
        break;
    }

    return dismissedTypes;
  },

  /**
   * Indicates wheter the given alert type is allowed to be displayed.
   * @param aAlertType the type of alert.
   * @return true if this alert type is allowed to be displayed. false
   * otherwise.
   */
  _canShowAlertType : function(aAlertType) {
    this._logService.trace("Begin: EbayAlertService._canShowAlertType.");

    return this._switchAlertPreferences[aAlertType];
  },

  /**
   * Observes certain topic changes.
   * @param aSubject the object that experienced the change.
   * @param aTopic the topic being observed.
   * @param aData the data relating to the change.
   */
  observe : function(aSubject, aTopic, aData) {
    this._logService.debug(
      "Begin: EbayAlertService.observe. Topic: " + aTopic);

    switch (aTopic) {
      case "ebayComp-login-status":
        this._resetAlerts();
        break;

      case EBAYCOMP_PREF_CHANGED:
        if (aSubject instanceof CI.nsIPrefBranch) {
            var prefChanged = String(aData);
            var newValue = aSubject.getBoolPref(prefChanged);

            if (prefChanged.search(EBAYCOMP_BRANCH_ALERTS_PRIMARY) >= 0) {
              for (var i = 0; i < EBAYCOMP_ALERT_COUNT; i++) {
                if (EBAYCOMP_ALERT_PRIMARY_PREFERENCES_MAP[i] == prefChanged) {
                  this._primaryAlertPreferences[i] = newValue;
                  break;
                }
              }
            } else {
              for (var i = 0; i < EBAYCOMP_ALERT_COUNT; i++) {
                if (EBAYCOMP_ALERT_SWITCH_PREFERENCES_MAP[i] == prefChanged) {
                  this._switchAlertPreferences[i] = newValue;
                  break;
                }
              }
            }
          } else {
            this._logService.error(
              "EbayAlertService.observe. Invalid subject.");
          }
        break;
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderAlertService) &&
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
var EbayAlertServiceFactory = {
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
      this._singletonObj = EbayAlertService;
      EbayAlertService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayAlertServiceModule = {
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
      return EbayAlertServiceFactory;
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
  return EbayAlertServiceModule;
}
