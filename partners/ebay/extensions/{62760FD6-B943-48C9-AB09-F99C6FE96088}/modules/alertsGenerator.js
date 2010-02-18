/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["AlertsGenerator"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var AlertsGenerator = {

  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/helpers/itemList.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import(
        "resource://ebaycompanion/helpers/warningNotificationHelper.js");
      Cu.import("resource://ebaycompanion/datasource.js");
      Cu.import("resource://ebaycompanion/constants.js");
      Cu.import("resource://ebaycompanion/objects/alert.js");
      Cu.import("resource://ebaycompanion/objects/item.js");
      Cu.import("resource://ebaycompanion/objects/feedback.js");
      Cu.import("resource://ebaycompanion/objects/notification.js");

      this._observers = new Observers;
      let that = this;

      this._observers.
        add(function() that._uninit(),
            "quit-application-granted");

      this._observers.
        add(function(subject, topic, data)
              that._newItem(subject.object),
            "ebay-item-new");
      this._observers.
        add(function(subject, topic, data)
              that._itemChanged(subject.object, subject.originalObject),
            "ebay-item-changed");
      this._observers.
        add(function(subject, topic, data)
              that._accountFeedbackScoreChanged(
                subject.object, subject.originalObject),
            "ebay-account-feedback-changed");
    } catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    try {
      this._observers.removeAll();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Enables alerts
   */
  enable : function() {
    let that = this;

    // Item list used to track the order in which items will end
    this._endingSoonList = new ItemList();
    this._endingSoonAlerted = {};  // Keeps track of which alerts we've generated
    this._endingSoonList.
      filter(function(item) {
        let alreadyAlerted = that._endingSoonAlerted[item.get("itemId")];
        return !item.get("isEnded") && !alreadyAlerted;
      });
    this._endingSoonList.
      sort(function(a, b) {
        return a.get("endTime") < b.get("endTime");
      });

    this._endingSoonTimer =
      new Timer(function() that._checkForEndingSoon(), 1000 * 60,
                Timer.TYPE_REPEATING_SLACK);
    this._checkForEndingSoon();
  },

  /**
   * Disables alerts
   */
  disable : function() {
    if (this._endingSoonAlerted) {
      this._endingSoonTimer.cancel();
    }
  },

  /**
   * Checks the item that will end soonest to see if an Ending Soon alert should
   * be generated for it.
   */
  _checkForEndingSoon : function() {
    try {
      // We need to apply the filter again to filter out any items that have
      // already had alerts generated.
      // Because we only need to filter items out of (not into) our Item List,
      // we can simply apply the filter again without needing to reset the list.
      this._endingSoonList.filter();
      let items = this._endingSoonList.items;

      let mayBeMore = true;
      for (let i = 0; mayBeMore && i < items.length; i++) {
        let item = items[i];
        mayBeMore = this._checkItemForEndingSoon(item);
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Generates an appropriate "Ending Soon" alert if necessary for the provided
   * item
   * @param item An Item object
   * @returns true if an alert was generated; false otherwise
   */
  _checkItemForEndingSoon : function(item) {
    let alertGenerated = false;

    if (item.get("isEnded")) {
      // if the new item comes and it is ended, show the "ended items moved to
      // ended tab" notification
      let notification =
        new Notification(
          WarningNotificationHelper.
            ITEM_MOVED_TO_ENDED_TAB_WARNING);
      notification.addLinkCallback(0, function(aEvent){
          let windowMediator =
            Cc["@mozilla.org/appshell/window-mediator;1"].
              getService(Ci.nsIWindowMediator);
          let mostRecentWindow =
            windowMediator.getMostRecentWindow("navigator:browser");
          let sidebar = mostRecentWindow.document.getElementById("sidebar");
          sidebar.contentWindow.Sidebar.switchToTab(1);
        });
      notification.set(
        "content", Constants.stringBundle.getString(
          "ecSidebar.notification.info.ended"));
      notification.set("priority", 1);
      WarningNotificationHelper.queueNotification(notification);
      return alertGenerated;
    }

    let userIsSeller =
      item.get("sellerUserId").toLowerCase() ==
        Datasource.activeAccount().get("userId").toLowerCase();
    let hasTransactions =
      Datasource.transactions([item.get("itemId")]) != null;

    // If the user is not the seller, and the item has transactions, that means
    // the user bought the item.  We treat such items as ended and are not
    // interested in when the listing ends.
    if (hasTransactions && !userIsSeller) {
      return alertGenerated;
    }

    let timeLeft = item.get("endTime") - Datasource.getEbayTime().getTime();
    let minutesLeft = timeLeft / 1000 / 60;
    if (timeLeft > 0 && minutesLeft < 20) {
      if (userIsSeller) {
        this._generateAlert(Alert.ALERT_TYPE_SELLING_ENDING_SOON, item);
      } else {
        let userHasBid = item.get("userMaxBid") > 0;
        if (userHasBid) {
          this._generateAlert(Alert.ALERT_TYPE_BIDDING_ENDING_SOON, item);
        } else {
          this._generateAlert(Alert.ALERT_TYPE_WATCHING_ENDING_SOON, item);
        }
      }
      this._endingSoonAlerted[item.get("itemId")] = true;
      alertGenerated = true;
    } else if (timeLeft <= 0) {
      // show ended items moved to ended list notification
      let notification =
        new Notification(
          WarningNotificationHelper.
            ITEM_MOVED_TO_ENDED_TAB_WARNING);
      notification.addLinkCallback(0, function(aEvent){
          let windowMediator =
            Cc["@mozilla.org/appshell/window-mediator;1"].
              getService(Ci.nsIWindowMediator);
          let mostRecentWindow =
            windowMediator.getMostRecentWindow("navigator:browser");
          let sidebar = mostRecentWindow.document.getElementById("sidebar");
          sidebar.contentWindow.Sidebar.switchToTab(1);
        });
      notification.set(
        "content", Constants.stringBundle.getString(
          "ecSidebar.notification.info.ended"));
      notification.set("priority", 1);
      WarningNotificationHelper.queueNotification(notification);
      alertGenerated = true;
    }

    return alertGenerated;
  },

  /**
   * Called when a new item is being tracked
   * @param item The new item object
   */
  _newItem : function(item) {
    try {
      this._checkItemForEndingSoon(item);
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Called when an item object has been changed
   * @param item The Item object that has changed
   * @param originalItem The Item object before the change occured
   */
  _itemChanged : function(item, originalItem) {
    let userId = Datasource.activeAccount().get("userId");
    let userIsSeller =
      item.get("sellerUserId").toLowerCase() == userId.toLowerCase();
    let itemJustEnded =
      item.get("isEnded") != originalItem.get("isEnded");
    let userHasBid = item.get("userMaxBid") > 0;
    let userIsHighBidder =
      item.get("highBidderId").toLowerCase() == userId.toLowerCase();
    let userWasHighBidder =
      originalItem.get("highBidderId").toLowerCase() == userId.toLowerCase();

    let EC_LISTING_TYPE_FIXED = "FixedPriceItem";
    let EC_LISTING_TYPE_STORE_FIXED = "StoresFixedPrice";
    let itemHasBuyItNow = item.get("hasBuyItNow");
    let listingFormat = item.get("listingFormat");

    let isBINItem = (EC_LISTING_TYPE_STORE_FIXED == listingFormat ||
        EC_LISTING_TYPE_FIXED == listingFormat) && itemHasBuyItNow;
    // the first condition here applies for BIN items with multiple units. The
    // second condition applies to single unit BIN items. They behave
    // differently because for multiple units BIN items, the user is NEVER set
    // as high bidder and for single unit BIN items, the userQuantityWinning
    // column is never set.
    let buyerWon =
      (!userIsSeller &&
      item.get("userQuantityWinning") > originalItem.get("userQuantityWinning") &&
      item.get("quantityRemaining") < originalItem.get("quantityRemaining")) ||
      (!userIsSeller &&
      !userWasHighBidder && userIsHighBidder &&
      item.get("quantityRemaining") < originalItem.get("quantityRemaining"));

    if (userIsSeller) {
      // Selling
      let itemSold =
        item.get("quantitySold") > originalItem.get("quantitySold");
      let soldNone = item.get("quantitySold") == 0;
      let newBidPlaced = item.get("numBids") > originalItem.get("numBids");

      if (itemSold) {
        // create an ended copy of the item, so the alert status is correct
        let endedCopy = item.copy();
        endedCopy.set("isEnded", true);
        this._generateAlert(Alert.ALERT_TYPE_SELLING_ITEM_SOLD, endedCopy);
      } else if (itemJustEnded && soldNone) {
        this._generateAlert(Alert.ALERT_TYPE_SELLING_ITEM_UNSOLD, item);
      } else if (newBidPlaced) {
        this._generateAlert(Alert.ALERT_TYPE_SELLING_BID_PLACED, item);
      } else if (itemJustEnded) {
        this._generateAlert(Alert.ALERT_TYPE_ITEM_ENDED, item);
      }
    } else if (userHasBid || (isBINItem && buyerWon)) {
      // Bidding
      let priceIncreased =
        item.get("currentPrice") > originalItem.get("currentPrice");

      if (itemJustEnded) {
        if (userIsHighBidder) {
          this._generateAlert(Alert.ALERT_TYPE_BIDDING_ITEM_WON, item);
        } else {
          this._generateAlert(Alert.ALERT_TYPE_BIDDING_ITEM_LOST, item);
        }
      } else if (!isBINItem) {
        if (priceIncreased) {
          if (userIsHighBidder && userWasHighBidder) {
            this._generateAlert(Alert.ALERT_TYPE_BIDDING_RAISED_BID, item);
          } else if(userIsHighBidder && !userWasHighBidder) {
            this._generateAlert(Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER, item);
          } else if (!userIsHighBidder && userWasHighBidder) {
            this._generateAlert(Alert.ALERT_TYPE_BIDDING_OUTBID, item);
          }
        } else {
          if (!userWasHighBidder && userIsHighBidder) {
            // this means the user became the highest bidder by placing the
            // first bid on an item.
            this._generateAlert(Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER, item);
          }
        }
      } else if (isBINItem && buyerWon) {
        // this is for multiple units BIN items that are not marked as ended
        // create an ended copy of the item, so the alert status is correct
        let endedCopy = item.copy();
        endedCopy.set("isEnded", true);
        this._generateAlert(Alert.ALERT_TYPE_BIDDING_ITEM_WON, endedCopy);
      }
    }
  },

  /**
   * Called when the active account feedback changes.
   * @param aAccount The Account object that has changed
   * @param aOriginalAccount The Account object before the change occured
   */
  _accountFeedbackScoreChanged : function(aAccount, aOriginalAccount) {
    // just to be sure the feedback actually changed... and possitively
    let oldFeedbackValue = aOriginalAccount.get("feedbackRating");
    let newFeedbackValue = aAccount.get("feedbackRating");
    let preventAlertDisplay =
      Constants.prefBranch.get("prevent.first.feedback.score.notification");
    if (newFeedbackValue > oldFeedbackValue && !preventAlertDisplay) {
      let listLength = Feedback.MILESTONES.length;
      let showedScoreAlert = false;
      let feedback;

      for (var i=listLength-1; !showedScoreAlert && i>=0; i--) {
        if ((Feedback.MILESTONES[i] > oldFeedbackValue) &&
            (Feedback.MILESTONES[i] <= newFeedbackValue)) {
          feedback = new Feedback();
          feedback.score = Feedback.MILESTONES[i];
          this._generateAlert(Alert.ALERT_TYPE_FEEDBACK_SCORE, feedback);
          showedScoreAlert = true;
        }
      }
    }
  },

  /**
   * Creates and dispatches an alert with the given name for the given item
   * @param aType the type of the alert
   * @param aObject used to hold the item that caused the alert or the feedback
   * information in case of feedback alerts
   */
  _generateAlert : function(aType, aObject) {
    let alert = new Alert(aType, aObject);
    alert.dispatch();
  }
};

AlertsGenerator._init();
