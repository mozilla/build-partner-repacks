/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{AACCDCD3-2BF7-49E5-B63F-1CFA750B4469}");
const CLASS_NAME = "eBay Companion Datasource Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-datasource-service;1";

const EBAYCOMP_UUID = "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
/* Datasource file handling. */
const EBAYCOMP_DIRECTORY = "eBayComp";
const DS_FILE_NAME = "eBayComp.rdf";
const HIDDEN_ITEM_FILE_NAME = "-hidden.rdf";
const HIDDEN_ITEM_TEMPLATE_FILE_NAME = "template-hidden.rdf";
const USERS_FEEDBACK_FILE_NAME = "users-feedback.rdf";
/* RDF namespaces we need. */
const EBAYCOMP_NAME = "http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#";
const RDF_NAME = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
/* List prefixes. */
const EBAYCOMP_LIST = EBAYCOMP_NAME + "list-";
const EBAYCOMP_NEW_LIST =  EBAYCOMP_NAME + "new-list-";
const EBAYCOMP_HIDDEN = EBAYCOMP_NAME + "hidden-";
const EBAYCOMP_TOTALS = "-totals";
/* List names, without prefixes. */
const EBAYCOMP_LIST_SELLING = "selling";
const EBAYCOMP_LIST_BUYING = "buying";
const EBAYCOMP_LIST_FEEDBACK = "feedback";
const EBAYCOMP_LIST_MESSAGES = "messages";
const EBAYCOMP_LIST_HIDDEN = "hidden";
const EBAYCOMP_LIST_USERS_FEEDBACK = "users-feedback";
/* Frequently used arc names. */
const EBAYCOMP_TIME_LEFT = EBAYCOMP_NAME + "time-left";
const EBAYCOMP_HIGH_BIDDER = EBAYCOMP_NAME + "high-bidder";
const EBAYCOMP_BID_COUNT = EBAYCOMP_NAME + "bid-count";
const EBAYCOMP_RESERVE_MET = EBAYCOMP_NAME + "reserve-met";
const EBAYCOMP_CURRENT_PRICE = EBAYCOMP_NAME + "current-price-amount";
const EBAYCOMP_QUANTITY_WON = EBAYCOMP_NAME + "quantity-won";
/* These are required for alerts. */
const EBAYCOMP_ALERT_TIME_WATCH = "PT20M0S"; // 20 minutes
const EBAYCOMP_ALERT_TIME_BID = "PT20M0S"; // 20 minutes
const EBAYCOMP_ALERT_TIME_ACTIVE = "PT20M0S"; // 20 minutes
/* The time frame in which an ended item can throw an alert. */
const EBAYCOMP_ALERT_ENDED_FRAME = 24 * 60 * 60 * 1000; // 1 day.
/* Determines the role of the seller in a feedback item. */
const EBAYCOMP_FEEDBACK_ROLE_SELLER = "Seller";
/* Feedback score milestones. */
const EBAYCOMP_FEEDBACK_MILESTONES =
  [ 10, 50, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000 ];
/* Flush rate. */
const EBAYCOMP_DATASOURCES_FLUSH_RATE = 60 * 1000; // 1 min

/**
 * eBay datasource service. Provides access to the eBay stored.
 * information.
 * @author Jorge Villalobos, Raymond Lee Glaxstar Corp.
 */
var EbayDatasourceService = {
  /* Log service */
  _logService : null,
  /* Cached datasource object */
  _datasource : null,
  /* Hidden item datasource. */
  _hiddenItemDatasource : null,
  /* Users feedback datasource */
  _usersFeedbackDatasource : null,
  /* Composite datasource */
  _compositeDatasource : null,
  /* Cached user service */
  _userService : null,
  /* Cached alert service. */
  _alertService : null,
  /* Cached rdf service */
  _rdfService : null,
  /* Cached container utils service. */
  _containerUtils : null,
  /* Cached observer service. */
  _observerService : null,
  /* The list displayed on the sidebar. */
  _displayList : null,
  /* Arc corresponding to the RDF type of an RDF object. */
  _rdfTypeArc : null,
  /* Arc corresponding to the item id. */
  _itemIdArc : null,
  /* Arc corresponding to the feedback score. */
  _feedbackArc : null,
  /* Arc corresponding to the last update time. */
  _lastUpdateArc : null,
  /* Arc corresponding to the time left property. */
  _timeLeftArc : null,
  /* Arc corresponding to the duplicate item property. */
  _duplicateArc : null,
  /* Arc corresponding to the total property. */
  _totalArc : null,
  /* Arc corresponding to the username. */
  _usernameArc : null,
  /* An interval of length zero. */
  _zeroInterval : null,
  /* The time when an alert will be shown for a watch item about to end. */
  _alertTimeWatch : null,
  /* The time when an alert will be shown for a bid item about to end. */
  _alertTimeBid : null,
  /* The time when an alert will be shown for a sell item about to end. */
  _alertTimeActive : null,
  /* Flag that indicates the first update for the buying lists has ended. */
  _firstUpdateBuyingDone : false,
  /* Flag that indicates the first update for the selling lists has ended. */
  _firstUpdateSellingDone : false,
  /* Flag that indicates the first update for the feedback list has ended. */
  _firstUpdateFeedbackDone : false,
  /* Indicates (temporarily) that a user has been outbid on an item. */
  _isOutbid : false,
  /* Indicates (temporarily) that a user is the new high bidder on an item. */
  _highAgain : false,
  /* Indicates (temporarily) that a user's bid might have been raised. */
  _isPossibleAutoRaise : false,
  /* Flag that indicates the hidden item datasource should be flushed or not. */
  _shouldFlushHiddenItemDatasource : false,
  /* Flag that indicates the users' feedback  datasource should be flushed or
     not. */
  _shouldFlushFeedbackDatasource : false,
  /* Flag that indicates the datasource should be flushed or not. */
  _shouldFlushDatasource : false,
  /* Flag that indicates the extension will be uninstalled or not. */
  _uninstallExtension : false,
  /* List of items that have the Buy-it-Now option. */
  _binItems : new Array(),
  /* Indicates that the list cut has been notified or not. */
  _listCutNotified : false,

  /**
   * Initialize the component.
   */
  init : function() {
    //dump("EbayDatasourceService.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._rdfService =
      CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);
    this._containerUtils =
      CC["@mozilla.org/rdf/container-utils;1"].
        getService(CI.nsIRDFContainerUtils);
    this._observerService =
      CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
    this._userService =
      CC["@glaxstar.org/autotrader/ebay-user-service;1"].
        getService(CI.gsIEbayUserService);
    this._alertService =
      CC["@glaxstar.org/autotrader/autotrader-alert-service;1"].
        getService(CI.gsIAutotraderAlertService);
    this._displayList =
      CC["@glaxstar.org/ebaycomp/ebay-display-list;1"].
        createInstance(CI.gsIEbayDisplayList);
    // some RDF resources we use frequently.
    this._rdfTypeArc = this._rdfService.GetResource(RDF_NAME + "type");
    this._itemIdArc = this._rdfService.GetResource(EBAYCOMP_NAME + "item-id");
    this._feedbackArc =
      this._rdfService.GetResource(EBAYCOMP_NAME + "feedback-score");
    this._lastUpdateArc =
      this._rdfService.GetResource(EBAYCOMP_NAME + "last-update");
    this._timeLeftArc =
      this._rdfService.GetResource(EBAYCOMP_NAME + "time-left");
    this._duplicateArc =
      this._rdfService.GetResource(EBAYCOMP_NAME + "is-duplicate");
    this._totalArc = this._rdfService.GetResource(EBAYCOMP_NAME + "total");
    this._usernameArc =
      this._rdfService.GetResource(EBAYCOMP_NAME + "username");
    // intervals we use frequently.
    this._zeroInterval = this._createInterval();
    this._alertTimeWatch = this._createInterval(EBAYCOMP_ALERT_TIME_WATCH);
    this._alertTimeBid = this._createInterval(EBAYCOMP_ALERT_TIME_BID);
    this._alertTimeActive = this._createInterval(EBAYCOMP_ALERT_TIME_ACTIVE);
    // register necessary observers.
    this._observerService.addObserver(this, "ebayComp-login-status", false);
  },

  /**
   * Loads the datasource.
   */
  loadDatasource : function () {
    this._logService.debug("Begin: EbayDatasourceService.loadDatasource");

    var fileURLHandler =
      CC["@mozilla.org/network/protocol;1?name=file"].
        getService(CI.nsIFileProtocolHandler);
    var datasourceFile = this._getDatasourceFile();
    var datasourceURL;
    // clear the BIN item list.
    this._binItems.splice(0, this._binItems.length);
    // delete the current file and copy the template to the profile directory.
    // This is always done because the contents have to be emptied anyway, and
    // newer versions might require a different template.
    if (datasourceFile.exists()) {
      datasourceFile.remove(false);
    }

    this._logService.debug("Creating eBay main datasource file.");
    this._copyFileFromDefaultDir(DS_FILE_NAME, datasourceFile);
    // load the datasource.
    this._logService.debug("Creating datasource object.");
    datasourceURL = fileURLHandler.getURLSpecFromFile(datasourceFile);
    this._datasource = this._rdfService.GetDataSource(datasourceURL);
    this._rdfService.RegisterDataSource(this._datasource, true);
    // laad the users' feedback datasource
    this._loadFeedbackDatasource();
    // load the composite datasource
    this._loadCompositeDatasource();
    // register necessary observers.
    this._observerService.addObserver(this, "ebayComp-login-status", false);
    this._observerService.addObserver(this, "em-action-requested", false);
    this._observerService.addObserver(this, "quit-application-granted", false);
    // Start a timer for flushing datasources.
    this._flushTimer = CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
    var callback = {
      notify: function() {
        EbayDatasourceService._save();
      }
    };
    this._flushTimer.initWithCallback(
      callback, EBAYCOMP_DATASOURCES_FLUSH_RATE,
      CI.nsITimer.TYPE_REPEATING_SLACK);    
  },

  /**
   * Attempts to unload the datasources.
   */
  unloadDatasource : function() {
    this._logService.debug("Begin: EbayDatasourceService.unloadDatasource");

    var datasourceFile = this._getDatasourceFile();
    var datasourceURL;

    // only try to flush the hidden item and feedback datasources as the main
    // datasource would be removed.
    this._shouldFlushDatasource = false;
    this._save();
    // Cancel the timer for flushing datasources.
    this._flushTimer.cancel();
    // Reset all the other should flush datasource variables.
    this._shouldFlushHiddenItemDatasource = false;
    this._shouldFlushFeedbackDatasource = false;
    
    // unregister the datasources.
    this._unloadCompositeDatasource();
    this._rdfService.UnregisterDataSource(this._datasource);
    this._rdfService.UnregisterDataSource(this._hiddenItemDatasource);
    this._rdfService.UnregisterDataSource(this._usersFeedbackDatasource);
    this._datasource = null;
    this._hiddenItemDatasource = null;
    this._usersFeedbackDatasource = null;
    // remove main the datasource file (for privacy).
    if (datasourceFile.exists()) {
      datasourceFile.remove(false);
    }
    // reset the update flags.
    this._firstUpdateBuyingDone = false;
    this._firstUpdateSellingDone = false;
    this._firstUpdateFeedbackDone = false;
    // empty the display list.
    this._displayList.clear();
    // reset the list cut boolean.
    this._listCutNotified = false;
    // unregister observers.
    this._observerService.removeObserver(this, "ebayComp-login-status");
    this._observerService.removeObserver(this, "em-action-requested");
    this._observerService.removeObserver(this, "quit-application-granted");
  },

  /**
   * Obtains the datasource file object.
   * @return the nsIFile that points to the datasource file.
   */
  _getDatasourceFile : function() {
    this._logService.trace("Begin: EbayDatasourceService._getDatasourceFile");
    var directoryService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    var datasourceFile;

    datasourceFile = directoryService.get("ProfD", CI.nsIFile);
    datasourceFile.append(EBAYCOMP_DIRECTORY);
    // if directory does not exist, create it.
    if (!datasourceFile.exists() || !datasourceFile.isDirectory()) {
      this._logService.debug("Creating eBay profile directory.");
      datasourceFile.create(CI.nsIFile.DIRECTORY_TYPE, 0774);
    }

    datasourceFile.append(DS_FILE_NAME);

    return datasourceFile;
  },

  /**
   * Loads the users feedback datasource
   */
  _loadFeedbackDatasource : function() {
    this._logService.debug("Begin: EbayDatasourceService._loadUsersFeedback");

    var directoryService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    var fileURLHandler =
      CC["@mozilla.org/network/protocol;1?name=file"].
        getService(CI.nsIFileProtocolHandler);
    var datasourceFile;
    var datasourceURL;

    datasourceFile = directoryService.get("ProfD", CI.nsIFile);
    datasourceFile.append(EBAYCOMP_DIRECTORY);
    datasourceFile.append(USERS_FEEDBACK_FILE_NAME);
    // create the file if it doesn't exist.
    if (!datasourceFile.exists()) {
      this._logService.debug("Creating users' feedback datasource file.");
      this._copyFileFromDefaultDir(
        USERS_FEEDBACK_FILE_NAME, datasourceFile);
    }
    // load the datasource.
    this._logService.debug("Creating datasource object.");
    datasourceURL = fileURLHandler.getURLSpecFromFile(datasourceFile);
    // unload the datasource, if it's loaded.
    if (this._usersFeedbackDatasource != null) {
      this._rdfService.UnregisterDataSource(this._usersFeedbackDatasource);
    }
    this._usersFeedbackDatasource = this._rdfService.GetDataSource(datasourceURL);
    this._rdfService.RegisterDataSource(this._usersFeedbackDatasource, true);
  },

  /**
   *  Loads the composite datasource of the main datasource and
   *  the users' feedback datasource.
   */
  _loadCompositeDatasource : function() {
    if (!this._compositeDatasource) {
      this._compositeDatasource =
        CC["@mozilla.org/rdf/datasource;1?name=composite-datasource"]
          .createInstance( CI.nsIRDFCompositeDataSource );
      this._compositeDatasource.AddDataSource(this._datasource);
      this._compositeDatasource.AddDataSource(this._usersFeedbackDatasource);
    }

    return this._compositeDatasource;
  },

  /**
   *  Unloads the composite datasource of the main datasource and
   *  users' feedback datasource.
   */
  _unloadCompositeDatasource : function() {
    if (this._compositeDatasource) {
      this._compositeDatasource.RemoveDataSource(this._datasource);
      this._compositeDatasource.RemoveDataSource(this._usersFeedbackDatasource);
      this._compositeDatasource = null;
    }
  },

  /**
   * Saves the datasources to disk.
   * @param aForceToSave the boolean indicates some datasources should be
   * flushed immedidately.  Only force to save when quitting Firefox.
   */
  _save : function() {
    this._logService.trace("Begin: EbayDatasourceService._save");

    if (this._shouldFlushDatasource) {
      this._shouldFlushDatasource = false;
      this._saveDatasource(this._datasource);
    }
    if (this._hiddenItemDatasource != null &&
          this._shouldFlushHiddenItemDatasource) {
      this._shouldFlushHiddenItemDatasource = false;
      this._saveDatasource(this._hiddenItemDatasource);
    }
    if (this._usersFeedbackDatasource != null &&
          this._shouldFlushFeedbackDatasource) {
      this._shouldFlushFeedbackDatasource = false;
      this._saveDatasource(this._usersFeedbackDatasource); 
    }
  },

  /**
   * Saves a datasource to disk.
   * @param aDatasource the datasource to save to disk.
   */
  _saveDatasource : function(aDatasource) {
    this._logService.trace("Begin: EbayDatasourceService._saveDatasource");
    aDatasource.QueryInterface(CI.nsIRDFRemoteDataSource);
    aDatasource.Flush();
    aDatasource.QueryInterface(CI.nsIRDFDataSource);
  },


  /**
   * Removes the datasource directory from the disk.
   */
  removeDatasource : function() {
    var directoryService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    var datasourceFile;

    datasourceFile = directoryService.get("ProfD", CI.nsIFile);
    datasourceFile.append(EBAYCOMP_DIRECTORY);

    // if directory exists, remove it recursively
    if (datasourceFile.exists()) {
      datasourceFile.remove(true);
    }
  },

  /**
   * Changes the user specific data, which is basically the hidden items.
   */
  _changeUser : function() {
    this._logService.debug("Begin: EbayDatasourceService._changeUser");

    var directoryService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    var fileURLHandler =
      CC["@mozilla.org/network/protocol;1?name=file"].
        getService(CI.nsIFileProtocolHandler);
    var username = this._userService.userSession.username;
    var datasourceFile;
    var datasourceURL;

    datasourceFile = directoryService.get("ProfD", CI.nsIFile);
    datasourceFile.append(EBAYCOMP_DIRECTORY);
    datasourceFile.append(username + HIDDEN_ITEM_FILE_NAME);
    // create the file if it doesn't exist.
    if (!datasourceFile.exists()) {
      this._logService.debug("Creating hidden item datasource file.");
      this._copyFileFromDefaultDir(
        HIDDEN_ITEM_TEMPLATE_FILE_NAME, datasourceFile);
    }
    // load the datasource.
    this._logService.debug("Creating datasource object.");
    datasourceURL = fileURLHandler.getURLSpecFromFile(datasourceFile);
    // unload the hidden datasource, if it's loaded.
    if (this._hiddenItemDatasource != null) {
      this._rdfService.UnregisterDataSource(this._hiddenItemDatasource);
    }

    this._hiddenItemDatasource = this._rdfService.GetDataSource(datasourceURL);
    this._rdfService.RegisterDataSource(this._hiddenItemDatasource, true);
  },

  /**
   * Updates the MyeBayBuying information from an RDF file.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  updateMyeBayBuying : function(aURL) {
    this._logService.debug("Begin: EbayDatasourceService.updateMyeBayBuying");
    this._updateList(EBAYCOMP_LIST_BUYING, aURL);
    this._firstUpdateBuyingDone = true;
  },

  /**
   * Updates the MyeBaySelling information from an RDF file.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  updateMyeBaySelling : function(aURL) {
    this._logService.debug("Begin: EbayDatasourceService.updateMyeBaySelling");
    this._updateList(EBAYCOMP_LIST_SELLING, aURL);
    this._firstUpdateSellingDone = true;
  },

  /**
   * Updates the Feedback information from an RDF file.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  updateFeedback : function(aURL) {
    this._logService.debug("Begin: EbayDatasourceService.updateFeedback");
    this._updateList(EBAYCOMP_LIST_FEEDBACK, aURL);
    this._firstUpdateFeedbackDone = true;
  },

  /**
   * Updates the MyMessages information from an RDF file.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  updateMyMessages : function(aURL) {
    this._logService.debug("Begin: EbayDatasourceService.updateMyMessages");
    this._updateList(EBAYCOMP_LIST_MESSAGES, aURL);
  },

  /**
   * Updates the list with the datasource that will be opened from the file
   * identified by the given URL.
   * @param aListName the name of the list.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  _updateList : function(aListName, aURL) {
    this._logService.trace(
      "Begin: EbayDatasourceService._updateList. Name: " + aListName);

    const ITEM_TYPE_BESTOFFER =
      CI.gsIAutotraderDatasourceService.ITEM_TYPE_BESTOFFER;
    const ITEM_TYPE_WATCH =
      CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH;
    var isVisible =
      (EBAYCOMP_LIST_FEEDBACK != aListName &&
       EBAYCOMP_LIST_MESSAGES != aListName);
    var isFeedbackList = (EBAYCOMP_LIST_FEEDBACK == aListName);
    var isFirstFeedbackListSync = false;
    var updateTime = (new Date()).getTime();
    var autoHide = false;
    var removeList = new Array();
    var updateTimeLiteral;
    var lastUpdate;
    var newDatasource;
    var currentListResource;
    var currentList;
    var currentListItems;
    var currentListItem;
    var currentUser;
    var feedbackListResource;
    var feedbackList;
    var newListResource;
    var newList;
    var newListItems;
    var newListItem;
    var itemId;
    var itemType;
    var listLength;
    var userLiteral;
    var datasource;

    // create a datasource from the file.
    this._logService.debug("Loading datasource from URL: " + aURL);
    
    newDatasource = this._rdfService.GetDataSourceBlocking(aURL);
    this._rdfService.RegisterDataSource(newDatasource, true);
    // create the update time literal.
    updateTimeLiteral = this._rdfService.GetLiteral(updateTime);
    // create the logged in username literal.
    currentUser = this._userService.userSession.username.toLowerCase();
    userLiteral = this._rdfService.GetLiteral(currentUser);
    // begin transaction.
    datasource  =
      (isFeedbackList ?
         this._usersFeedbackDatasource: this._datasource);
    datasource.beginUpdateBatch();

    try {
      newListResource =
        this._rdfService.GetResource(EBAYCOMP_NEW_LIST + aListName);
      newList = this._containerUtils.MakeSeq(newDatasource, newListResource);
      // user different list resource based on the type of the list.
      if (isFeedbackList) {
        feedbackListResource =
          this._rdfService.GetResource(
            EBAYCOMP_LIST + EBAYCOMP_LIST_USERS_FEEDBACK);
        feedbackList =
          this._containerUtils.
            MakeSeq(datasource, feedbackListResource);
        currentListResource =
          datasource.GetSource(this._usernameArc, userLiteral, true);
        if (!currentListResource) {
          currentListResource = this._rdfService.GetAnonymousResource();
          this._usersFeedbackDatasource.Assert(
            currentListResource, this._usernameArc, userLiteral, true);
          this._usersFeedbackDatasource.Assert(
            currentListResource, this._feedbackArc,
          this._rdfService.GetLiteral(""), true);
          this._usersFeedbackDatasource.Assert(
            currentListResource, this._lastUpdateArc,
          this._rdfService.GetLiteral(""), true);
          feedbackList.AppendElement(currentListResource);
          // set a flag of the first feedback list sync for a user
          isFirstFeedbackListSync = true;
        }
      } else {
        currentListResource =
          this._rdfService.GetResource(EBAYCOMP_LIST + aListName);
      }
      currentList =
        this._containerUtils.MakeSeq(datasource, currentListResource);
      currentListItems = currentList.GetElements();
      // first go through the current list. If there's a corresponding item in
      // the new list, update it and remove it from the new list, otherwise
      // remove it from the current list.
      this._logService.debug("Update lists: Going through the current list.");

      while (currentListItems.hasMoreElements()) {
        currentListItem = currentListItems.getNext();
        itemId = this.getItemProperty(currentListItem, "item-id");
        itemType = this.getItemType(currentListItem);
        this._logService.debug(
          "Update or remove. Item id: " + itemId  + ", type: " + itemType);
        // find the item in the new list.
        newListItem = this._getItemByIdAndType(newDatasource, itemId, itemType);

        if (newListItem != null) {
          // the item is on both lists, so we need to update it and remove it
          // from the new list.
          this._logService.debug("The item is on both lists. Update it.");
          this._moveAllArcsOut(newListItem, currentListItem, newDatasource,
                               datasource);
          newList.RemoveElement(newListItem, true);

          // ensure that the item is in the display list if it should be
          // It may have been removed from the watch list and replaced between
          //   reloads.
          if (isVisible && itemType == ITEM_TYPE_WATCH) {
            var newItem = this._createItem(currentListItem);
            // this method checks for duplicates, so no need to worry here
            this._displayList.insertItem(newItem);
          }
        } else {
          // the item is not on the new list. Remove it.
          this._logService.debug("The item is not on the new list. Remove it.");
          // the item is added to the remove list and will be removed later. We
          // don't remove it here because it affects the iterator.
          removeList.push(currentListItem);

          if (isVisible) {
            var listItem;

            listLength = this._displayList.length;
            // remove the item from the display list.
            for (var i = 0; i < listLength; i++) {
              listItem = this._displayList.getItemAt(i);

              if ((itemId == listItem.id) && (itemType == listItem.type)) {
                this._displayList.removeItemAt(i);
                break;
              }
            }
            // remove the item from the hidden items list
            if (this.isHidden(itemId, itemType)) {
              this.showHiddenItem(itemId, itemType);
            }
          }
          // dismiss the watch ending primary alert if the item has been
          // removed from the user's list before it ends.
          if (itemType == CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH) {
            var itemTimeLeft =
              this.getItemProperty(currentListItem, "time-left");

            if (itemTimeLeft) {
              var timeInterval = this._createInterval(itemTimeLeft);

              if (timeInterval.isPositive()) {
                // dismiss the ending watch item primary alert.
                this._dismissPrimaryAlert(
                  CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING, itemId);
              }
            }
          }
        }
      }

      listLength = removeList.length;
      // remove all items in the remove list.
      for (var i = 0; i < listLength; i++) {
        currentList.RemoveElement(removeList[i], true);
        this._removeAllArcsOut(removeList[i], datasource);
      }
      // now we go through the items that are left in the new list. These have
      // to be moved to the current list.
      this._logService.debug("Update lists: Going through the new list.");
      newListItems = newList.GetElements();

      while (newListItems.hasMoreElements()) {
        newListItem = newListItems.getNext();
        currentList.AppendElement(newListItem);
        this._moveAllArcsOut(newListItem, null, newDatasource, datasource);
        itemId = this.getItemProperty(newListItem, "item-id");
        itemType = this.getItemType(newListItem);
        this._logService.debug(
          "New item. Item id: " + itemId  + ", type: " + itemType);
        currentListItem =
          this._getItemByIdAndType(datasource, itemId, itemType);

        if (isVisible) {
          if (itemType == ITEM_TYPE_BESTOFFER) {
            var timeLeft = this.getItemProperty(newListItem, "time-left"); 
            var hasEnded = (timeLeft == "PT0S");

            if (!hasEnded) {
              this._displayList.hasBestOffers = true;
            }
          } else {
            var newItem = this._createItem(newListItem);
            var newItemEnded = !newItem.timeLeft.isPositive();
            // add the item to the display list.
            this._displayList.insertItem(newItem);
            // obtain additional item information.
            if (!newItemEnded) {
              this._userService.getItem(newItem.id);
            }
            // add item to the BIN list, if it applies.
            if (newItem.canBuyItNow) {
              this._logService.debug("Item added to the BIN list");
              this._binItems.push(newItem);
            }

            this._identifyDuplicates(itemId, itemType);
            // autohide ended items when the list loads for the first time.
            if (newItemEnded &&
                ((!this._firstUpdateBuyingDone &&
                  EBAYCOMP_LIST_BUYING == aListName) ||
                 (!this._firstUpdateSellingDone &&
                  EBAYCOMP_LIST_SELLING == aListName)) &&
                !this.isHidden(itemId, itemType)) {
              this.hideItem(itemId, itemType);
              autoHide = true;
            }
          }
        }
        // show alerts for new items.
        if (!isFirstFeedbackListSync) {
          this._setNewItemAlerts(currentListItem);
        }
      }
      // notify observers if an autohide happened.
      if (autoHide) {
        this._observerService.notifyObservers(
          null, "ebayComp-auto-hide-items", aListName);
      }
      // update feedback score.
      if (isFeedbackList) {
        this._updateFeedbackScore(currentListResource, newDatasource);
      }
      if (isVisible) {
        // look if we had to limit the user's lists.
        this._checkForCutResults(newDatasource, aListName);
      }
      // set the new update timestamp.
      lastUpdate =
        datasource.GetTarget(
          currentListResource, this._lastUpdateArc, true);
      datasource.Change(
        currentListResource, this._lastUpdateArc, lastUpdate,
        updateTimeLiteral);
    } catch (e) {
      this._logService.error(
        "An error occurred trying to update the list in the datasource. " +
        "List: " + aListName + "\nURL: " + aURL + ".\n[" + e.name + "] " +
        e.message + " file: " + e.filename + " line: " + e.lineNumber);
    }

    // finish transaction.
    datasource.endUpdateBatch();
    // remove the new datasource.
    this._logService.debug("Removing new datasource.");
    this._rdfService.UnregisterDataSource(newDatasource);
    // XXX : If an item is in the watch list, a bid is
    // placed and then do a bid retraction, the watch item would never show up
    // again in the list because it is in the hide list.
    if (EBAYCOMP_LIST_BUYING == aListName && this._firstUpdateSellingDone) {
      this._cleanHideList();
    }
    // set flags to flush the appriopriate datasources.
    if (isFeedbackList) {
      this._shouldFlushFeedbackDatasource = true;
    } else {
      this._shouldFlushDatasource = true;
    }
    // move any ended items down the list.
    if (isVisible) {
      this._displayList.sortEndedItems();
    }
  },

  /**
   * Identify if an item is a duplicate of another one, or if the item has
   * duplicates and marks it the watch item as duplicate.
   * @param aItemId the id of the item to use to look for duplicates.
   * @param aItemType the type of the item to use to look for duplicates.
   */
  _identifyDuplicates : function(aItemId, aItemType) {
    this._logService.trace("Begin: EbayDatasourceService._identifyDuplicates");

    if (this._hasDuplicate(aItemId, aItemType)) {
      if (!this.isHidden(aItemId, aItemType)) {
        this._hideDuplicateItem(
          aItemId, CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH);
      }
    }
  },

  /**
   * Identify if an item is a duplicate of another one, or if the item has
   * duplicates
   * @param aItemId the id of the item to use to look for duplicates.
   * @param aItemType the type of the item to use to look for duplicates.
   */
  _hasDuplicate : function(aItemId, aItemType) {
    this._logService.trace("Begin: EbayDatasourceService._hasDuplicates");

    var dupeItemFound = false;
    var dupeItem = null;
    // look for duplicate items.
    if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH == aItemType) {
      // XXX: note the hard-coded item types in the for loop. This is done for
      // efficiency.
      for (var type = 1; type < 7; type++) {
        dupeItem = this._getItemByIdAndType(this._datasource, aItemId, type);
        dupeItemFound = (dupeItem != null);

        if (dupeItemFound) {
          break;
        }
      }
    } else {
      dupeItem =
        this._getItemByIdAndType(
          this._datasource, aItemId,
          CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH);
      dupeItemFound = (dupeItem != null);
    }

    return dupeItemFound;
  },

  /**
   * Updates information for an item from an RDF file.
   * @param aItemId the id of the item to update.
   * @param aURL the URL for the RDF file containing the information to update.
   */
  updateItem : function(aItemId, aURL) {
    this._logService.debug(
      "Begin: EbayDatasourceService.updateItem. Item id: " + aItemId);

    var idLiteral = this._rdfService.GetLiteral(aItemId);
    var newDatasource;
    var itemNew;
    var foundItems;
    var itemLocal;
    var itemLocalType;
    var itemNewType;

    // create a datasource from the file.
    this._logService.debug("Loading datasource from URL: " + aURL);
    newDatasource = this._rdfService.GetDataSourceBlocking(aURL);
    this._rdfService.RegisterDataSource(newDatasource, true);
    // begin transaction.
    this._datasource.beginUpdateBatch();

    try {
      // find the item in the new datasource.
      itemNew = newDatasource.GetSource(this._itemIdArc, idLiteral, true);
      // get all items matching the ID in the local datasource.
      foundItems =
        this._datasource.GetSources(this._itemIdArc, idLiteral, true);
      // update all items matching the ID.
      while (foundItems.hasMoreElements()) {
        itemLocal = foundItems.getNext();
        // change the new item type temporarily, to match the local item's type.
        itemLocalType =
          this._datasource.GetTarget(itemLocal, this._rdfTypeArc, true);
        itemNewType = newDatasource.GetTarget(itemNew, this._rdfTypeArc, true);
        newDatasource.Change(
          itemNew, this._rdfTypeArc, itemNewType, itemLocalType);
        // update item info.
        this._moveAllArcsOut(itemNew, itemLocal, newDatasource,
                             this._datasource);
        // show alerts for new items. This call is a workaround because the end
        // time is one of the properties we have to download separately.
        this._setNewItemAlerts(itemLocal);
      }
      // save the datasource so that we can remove the file later.
      this._saveDatasource(newDatasource);
    } catch (e) {
      this._logService.error(
        "An error occurred trying to update an item in the datasource. " +
        "Item id: " + aItemId + "\nURL: " + aURL + ".\n[" + e.name + "] " +
        e.message + " file: " + e.filename + " line: " + e.lineNumber);
    }

    // finish transaction.
    this._datasource.endUpdateBatch();
    // remove the new datasource.
    this._logService.debug("Removing new datasource.");
    this._rdfService.UnregisterDataSource(newDatasource);
    // set flag to flush the datasource.
    this._shouldFlushDatasource = true;
  },

  /**
   * Updates all items that require individual information updated.
   */
  updateAllItems : function() {
    this._logService.debug("Begin: EbayDatasourceService.updateAllItems");

    var listLength = this._displayList.length;
    var item;
    // get the additional item information for all non-ended items.
    for (var i = 0; i < listLength; i++) {
      item = this._displayList.getItemAt(i);

      if (item.timeLeft.isPositive()) {
        this._userService.getItem(item.id);
      } else {
        // all remaining items have ended.
        break;
      }
    }
  },

  /**
   * Update the time left value for all items in the buying lists.
   */
  updateTimeLeftBuying : function() {
    this._logService.debug("Begin: EbayDatasourceService.updateTimeLeftBuying");
    this._updateTimeLeft(true);
  },

  /**
   * Update the time left value for all items in the selling lists.
   */
  updateTimeLeftSelling : function() {
    this._logService.debug(
      "Begin: EbayDatasourceService.updateTimeLeftSelling");
    this._updateTimeLeft(false);
  },

  /**
   * Update the time left value for the items in the display list that have any
   * of the types in the type list.
   * @param aIsBuying true if updating the buying list, false if updating the
   * selling list.
   */
  _updateTimeLeft : function(aIsBuying) {
    this._logService.trace("Begin: EbayDatasourceService._updateTimeLeft");

    var updateTime = (new Date()).getTime();
    var listName =
      (aIsBuying ? EBAYCOMP_LIST_BUYING : EBAYCOMP_LIST_SELLING);
    var listResource = this._rdfService.GetResource(EBAYCOMP_LIST + listName);
    var lastUpdate;
    var updateTimeLiteral;
    var timeDifference; // in seconds.
    var item;
    var itemTimeLeft;
    var rdfItem;
    var oldTimeLeft;
    var newTimeLeft;
    var oldTimeLeftLiteral;
    var listLength;

    // create the update time literal.
    updateTimeLiteral = this._rdfService.GetLiteral(updateTime);
    // begin transaction.
    this._datasource.beginUpdateBatch();

    try {
      // get the last update timestamp.
      lastUpdate =
        this._datasource.GetTarget(listResource, this._lastUpdateArc, true);
      timeDifference = (updateTime - this._getValue(lastUpdate)) / 1000;

      // set the new update timestamp.
      this._datasource.Change(
        listResource, this._lastUpdateArc, lastUpdate, updateTimeLiteral);
      listLength = this._displayList.length;

      for (var i = 0; i < listLength; i++) {
        item = this._displayList.getItemAt(i);
        itemTimeLeft = item.timeLeft;
        // keep in mind that all items are sorted by the end time, so if we
        // find an ended item, all items following it will have ended as well.
        if (itemTimeLeft.isPositive()) {
          if ((aIsBuying &&
               (CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH ==
                item.type ||
                CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID ==
                item.type)) ||
              (!aIsBuying &&
               CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE ==
               item.type)) {
            rdfItem =
              this._getItemByIdAndType(this._datasource, item.id, item.type);
            oldTimeLeft = itemTimeLeft.toString();
            oldTimeLeftLiteral = this._rdfService.GetLiteral(oldTimeLeft);
            // adjust the time with the calculated difference.
            itemTimeLeft.decrement(timeDifference);
            // change the value in the datasource.
            newTimeLeftLiteral =
              this._rdfService.GetLiteral(itemTimeLeft.toString());
            this._datasource.Change(
              rdfItem, this._timeLeftArc, oldTimeLeftLiteral,
              newTimeLeftLiteral);
            this._setAlerts(
              rdfItem, this._timeLeftArc, oldTimeLeft, itemTimeLeft.toString());
          }
        } else {
          // all remaining items have ended.
          break;
        }
      }
    } catch (e) {
      this._logService.error(
        "An error occurred trying to update the time left.\n[" + e.name + "] " +
        e.message);
    }
    // finish transaction.
    this._datasource.endUpdateBatch();

    // set flag to flush the datasource.
    this._shouldFlushDatasource = true;
    // move any ended items down the list.
    this._displayList.sortEndedItems();
  },

  /**
   * Obtains the closest end time among the buying items.
   * @return the closest end time among the buying items.
   */
  get closestEndTimeBuying() {
    this._logService.debug(
      "Begin: EbayDatasourceService.get closestEndTimeBuying");
    return this._getClosestEndTime(true);
  },

  /**
   * Obtains the closest end time among the buying items.
   * @return the closest end time among the buying items.
   */
  get closestEndTimeSelling() {
    this._logService.debug(
      "Begin: EbayDatasourceService.get closestEndTimeSelling");
    return this._getClosestEndTime(false);
  },

  /**
   * Obtains the closest end time for buying or selling items, according to the
   * given flag.
   * @param aIsBuying true to get the closest end time for buying items, false
   * to get the closest end time for selling items.
   * @return the closest end time for buying or selling items, according to the
   * given flag.
   */
  _getClosestEndTime : function(aIsBuying) {
    this._logService.trace("Begin: EbayDatasourceService._getClosestEndTime");

    var closestEndTime = this._zeroInterval;
    var listLength = this._displayList.length;
    var item;
    var itemTimeLeft;

    for (var i = 0; i < listLength; i++) {
      item = this._displayList.getItemAt(i);
      itemTimeLeft = item.timeLeft;
      // keep in mind that all items are sorted by the time left, so if we find
      // an ended item, all items following it will have ended as well.
      if (itemTimeLeft.isPositive()) {
        if ((aIsBuying &&
             (CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH == item.type ||
              CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID == item.type)) ||
            (!aIsBuying &&
             CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE == item.type)) {
          closestEndTime = itemTimeLeft;
          break;
        }
      } else {
        // all relevant items are ended.
        closestEndTime = itemTimeLeft;
        break;
      }
    }

    return closestEndTime;
  },

  /**
   * Obtains the number of unread messages.
   * @return the number of unread messages.
   */
  get unreadMessageCount() {
    this._logService.debug(
      "Begin: EbayDatasourceService.get unreadMessageCount");

    var unreadMessages = 0;
    var messageListResource =
        this._rdfService.GetResource(EBAYCOMP_LIST + EBAYCOMP_LIST_MESSAGES);
    var messageList =
        this._containerUtils.MakeSeq(this._datasource, messageListResource);
    var messageListItems = messageList.GetElements();
    var messageListItem;
    var unreadProp;

    while (messageListItems.hasMoreElements()) {
      messageListItem = messageListItems.getNext();
      unreadProp = this.getItemProperty(messageListItem, "message-read");

      if ("false" == unreadProp) {
        unreadMessages++;
      }
    }

    return unreadMessages;
  },

  /**
   * Removes an item from the display list.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   */
  removeItemFromDisplayList : function(aItemId, aItemType) {
    const ITEM_TYPE_WATCH =
      CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH;
    var listLength = this._displayList.length;
    var listItem;
    var foundItem;

    foundItem = false;
    for (var i=0; !foundItem && (i < listLength); i++) {
      listItem = this._displayList.getItemAt(i);

      if ((listItem.id == aItemId) && (listItem.type == aItemType)) {
        this._displayList.removeItemAt(i);
        foundItem = true;
      }
    }
  },

  /**
   * Marks an item in the display list as hidden.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   */
  hideItem : function(aItemId, aItemType) {
    this._logService.debug(
      "Begin: EbayDatasourceService.hideItem. Item id: " + aItemId +
      ", type: " + aItemType);
    this._hideItem(aItemId, aItemType, false);
  },

  /**
   * Marks an item in the display list as a duplicate of another item.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   */
  _hideDuplicateItem : function(aItemId, aItemType) {
    this._logService.debug(
      "Begin: EbayDatasourceService._hideDuplicateItem. Item id: " +
      aItemId + ", type: " + aItemType);
    this._hideItem(aItemId, aItemType, true);
  },

  /**
   * Marks an item in the display list as hidden and optionally as a duplicate.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @param aMarkDuplicate true if the item should be marked as a duplicate as
   * well, false otherwise.
   */
  _hideItem : function(aItemId, aItemType, aMarkDuplicate) {
    this._logService.trace("Begin: EbayDatasourceService._hideItem");

    if (!this.isHidden(aItemId, aItemType)) {
      var hiddenItemResource =
        this._getItemByIdAndType(this._datasource, aItemId, aItemType);
      var hideList =
        this._rdfService.GetResource(EBAYCOMP_LIST + EBAYCOMP_LIST_HIDDEN);
      var hideListSeq =
        this._containerUtils.MakeSeq(this._hiddenItemDatasource, hideList);
      var typeArc =  this._rdfService.GetResource(EBAYCOMP_NAME + "type");
      var idLiteral = this._rdfService.GetLiteral(aItemId);
      var typeLiteral = this._rdfService.GetLiteral(aItemType);

      this._hiddenItemDatasource.Assert(
        hiddenItemResource, this._itemIdArc, idLiteral, true);
      this._hiddenItemDatasource.Assert(
        hiddenItemResource, typeArc, typeLiteral, true);

      if (aMarkDuplicate) {
        var trueLiteral = this._rdfService.GetLiteral("true");

        this._hiddenItemDatasource.Assert(
          hiddenItemResource, this._duplicateArc, trueLiteral, true);
      }

      hideListSeq.AppendElement(hiddenItemResource);
      // set flag to flush the datasource.
      this._shouldFlushHiddenItemDatasource = true;
      this._observerService.notifyObservers(
        null, "ebayComp-hide-item", aItemId);
    } else if (aMarkDuplicate && !this.isDuplicate(aItemId, aItemType)) {
      // ensure that the duplicate item is marked correctly.
      var hiddenItemResource =
        this._getHiddenItem(aItemId, aItemType, false).
          QueryInterface(CI.nsIRDFResource)

      var trueLiteral = this._rdfService.GetLiteral("true");
      this._hiddenItemDatasource.Assert(
        hiddenItemResource, this._duplicateArc, trueLiteral, true);
      // set flag to flush the datasource.
      this._shouldFlushHiddenItemDatasource = true;
    } else {
      this._logService.warn(
        "The item was hidden more than once. Id: " + aItemId + ", type: " +
        aItemType);
    }
  },

  /**
   * Removes the hidden mark from an item in the display list.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   */
  showHiddenItem : function(aItemId, aItemType) {
    this._logService.debug(
      "Begin: EbayDatasourceService.showHiddenItem. Item id: " + aItemId +
      ", type: " + aItemType);

    var hiddenItemResource = this._getHiddenItem(aItemId, aItemType);

    if (hiddenItemResource != null) {
      var hideList =
        this._rdfService.GetResource(EBAYCOMP_LIST + EBAYCOMP_LIST_HIDDEN);
      var hideListSeq =
        this._containerUtils.MakeSeq(this._hiddenItemDatasource, hideList);
      var arcs = this._hiddenItemDatasource.ArcLabelsOut(hiddenItemResource);
      var arc;
      var arcTarget;

      while (arcs.hasMoreElements()) {
        arc = arcs.getNext();
        arcTarget =
          this._hiddenItemDatasource.GetTarget(hiddenItemResource, arc, true);
        this._hiddenItemDatasource.Unassert(hiddenItemResource, arc, arcTarget);
      }

      hideListSeq.RemoveElement(hiddenItemResource, true);
      // set flag to flush the datasource.
      this._shouldFlushHiddenItemDatasource = true;
      this._observerService.notifyObservers(
        null, "ebayComp-show-hidden-item", aItemId + "|" + aItemType);
    } else {
      this._logService.error(
        "The item is not hidden. Id: " + aItemId + ", type: " + aItemType);
    }
  },

  /**
   * Indicates if an item is hidden or not.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @return true if the item is hidden. false otherwise.
   */
  isHidden : function(aItemId, aItemType) {
    this._logService.trace(
      "Begin: EbayDatasourceService.isHidden. Item id: " + aItemId +
      ", item type: " + aItemType);
    return (this._getHiddenItem(aItemId, aItemType, false) != null);
  },

  /**
   * Indicates if an item is a duplicate or not. A duplicate item is an item on
   * the watch list that is also on another list, such as bidding or selling.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @return true if the item is a duplicate. false otherwise.
   */
  isDuplicate : function(aItemId, aItemType) {
    this._logService.trace(
      "Begin: EbayDatasourceService.isDuplicate. Item id: " + aItemId +
      ", item type: " + aItemType);
    return (this._getHiddenItem(aItemId, aItemType, true) != null);
  },

  /**
   * Obtains a hidden item with the given id and type. An item can be hidden
   * because it has ended or because it is a duplicate of another more relevant
   * item. Returns null if not found.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @param aDuplicatesOnly if this is set to true, this will only return the
   * hidden item if it's a duplicate.
   * @return nsIRDFNode that represents the item in the hidden list with the
   * given id and type. null if not found.
   */
  _getHiddenItem : function(aItemId, aItemType, aDuplicatesOnly) {
    this._logService.trace(
      "Begin: EbayDatasourceService._getHiddenItem. Item id: " + aItemId +
      ", item type: " + aItemType);

    var foundItem = null;
    var idLiteral = this._rdfService.GetLiteral(aItemId);
    var foundItems =
      this._hiddenItemDatasource.GetSources(this._itemIdArc, idLiteral, true);
    var typeArc =  this._rdfService.GetResource(EBAYCOMP_NAME + "type");
    var item;
    var itemTypeProp;

    while (foundItems.hasMoreElements()) {
      item = foundItems.getNext();
      itemTypeProp = this._hiddenItemDatasource.GetTarget(item, typeArc, true);

      if (aItemType == this._getValue(itemTypeProp)) {
        this._logService.debug("Found hidden item.");

        if (!aDuplicatesOnly ||
            this._hiddenItemDatasource.GetTarget(
              item, this._duplicateArc, true)) {
            foundItem = item;
        }
        break;
      }
    }

    return foundItem;
  },

  /**
   * Remove the items with isDuplicate attribute in the hide list datasource
   * when there are no duplicates of the items in user's main datasource.
   */
  _cleanHideList : function() {
    this._logService.trace(
      "Begin: EbayDatasourceService._cleanHideList.");

    var arcs;
    var arc;
    var arcTarget;
    var hiddenItemResource;
    var item;
    var itemIdProp;
    var itemTypeProp;
    var itemId;
    var itemType;

    var hideListResource =
      this._rdfService.GetResource(EBAYCOMP_LIST + EBAYCOMP_LIST_HIDDEN);
    var hideList =
      this._containerUtils.MakeSeq(this._hiddenItemDatasource,
                                   hideListResource);
    var typeArc =  this._rdfService.GetResource(EBAYCOMP_NAME + "type");
    var showItemsArray = new Array();

    var hideListItems = hideList.GetElements();
    while (hideListItems.hasMoreElements()) {
      item = hideListItems.getNext();
      itemIdProp =
        this._hiddenItemDatasource.GetTarget(item, this._itemIdArc, true);
      itemTypeProp =
        this._hiddenItemDatasource.GetTarget(item, typeArc, true);
      if (itemIdProp && itemTypeProp) {
        itemId = this._getValue(itemIdProp);
        itemType = this._getValue(itemTypeProp);
        // if it is a watch item, has isDuplicate attribute and there isn't a
        // duplicate in the main datasource, remove it from the hiden list
        // datasource.
        if (itemType == CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH &&
            this._hiddenItemDatasource.GetTarget(
              item, this._duplicateArc, true) &&
            this.getItemByIdAndType(itemId, itemType) &&
            !this._hasDuplicate(itemId, itemType)) {
            arcs = this._hiddenItemDatasource.ArcLabelsOut(item);

            while (arcs.hasMoreElements()) {
              arc = arcs.getNext();
              arcTarget =
                this._hiddenItemDatasource.GetTarget(item, arc, true);
              this._hiddenItemDatasource.Unassert(item, arc, arcTarget);
            }
            hideList.RemoveElement(item, true);
            showItemsArray[showItemsArray.length] = itemId + "|" + itemType;
        }
      }
    }

    if (showItemsArray.length > 0) {
      // ensure the hidden item datasource would be flushed in the next save
      // cycle.
      this._shouldFlushHiddenItemDatasource = true;
      this._observerService.notifyObservers(
        null, "ebayComp-show-hidden-items", showItemsArray.join(","));
    }
  },


  /**
   * Looks in the datasource for evidence that the results obtained don't match
   * the complete information that eBay offers. List requests are limited for
   * efficiency considerations, and the user has to be notified about it.
   * @param aDatasource the datasource to be analyzed.
   * @param aListName the name of the list to analyze.
   */
  _checkForCutResults : function(aDatasource, aListName) {
    this._logService.trace("Begin: EbayDatasourceService._checkForCutResults");

    if (!this._listCutNotified) {
      var listResource =
        this._rdfService.GetResource(
          EBAYCOMP_NEW_LIST + aListName + EBAYCOMP_TOTALS);
      var list = this._containerUtils.MakeSeq(aDatasource, listResource);
      var listItems = list.GetElements();
      var listItem;
      var totalProp;
      var total;

      while (listItems.hasMoreElements()) {
        listItem = listItems.getNext();
        totalProp = aDatasource.GetTarget(listItem, this._totalArc, true);

        if (totalProp) {
          total = parseInt(this._getValue(totalProp), 10);

          if (CI.gsIEbayAccessService.MAX_LIST_SIZE < total) {
            this._listCutNotified = true;
            this._observerService.notifyObservers(
              null, "ebayComp-download-list-cut", null);
          }
        }
      }
    }
  },

  /**
   * Obtains the item with the given id and type. Both are required as the same
   * item can be present in multiple types.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @return the nsIRDFNode that corresponds to the found item. null if the item
   * wasn't found.
   */
  getItemByIdAndType : function(aItemId, aItemType) {
    this._logService.debug("Begin: EbayDatasourceService.getItemByIdAndType");

    var item = null;
    var rdfItem =
      this._getItemByIdAndType(this._compositeDatasource, aItemId, aItemType);

    if (rdfItem) {
      if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_FEEDBACK != aItemType) {
        item =
          CC["@glaxstar.org/autotrader/autotrader-item;1"].
            createInstance(CI.gsIAutotraderItem);
      } else {
        item =
          CC["@glaxstar.org/autotrader/autotrader-feedback;1"].
            createInstance(CI.gsIAutotraderFeedback);
      }

      item.init(rdfItem);
    }

    return item;
  },

  /**
   * Obtains the item with the given id and type. Both are required as the same
   * item can be present in multiple types.
   * @param aDatasource the datasource where to look the item.
   * @param aItemId the id of the item.
   * @param aItemType the type of the item.
   * @return the nsIRDFNode that corresponds to the found item. null if the item
   * wasn't found.
   */
  _getItemByIdAndType : function (aDatasource, aItemId, aItemType) {
    this._logService.trace(
      "Begin: EbayDatasourceService._getItemByIdAndType. Item id: " +
      aItemId + ", item type: " + aItemType);

    var idLiteral = this._rdfService.GetLiteral(aItemId);
    var foundItems = aDatasource.GetSources(this._itemIdArc, idLiteral, true);
    var foundItem = null;
    var item;
    var itemType;

    while (foundItems.hasMoreElements()) {
      item = foundItems.getNext();
      itemType = this._getItemType(aDatasource, item);
      // verify if the item is on the list.
      if (aItemType == itemType) {
        foundItem = item;
        break;
      }
    }

    return foundItem;
  },

  /**
   * Obtains the list type of an item.
   * @param aItem the item to get the type for.
   * @return the type of the item. It can be any of the ITEM_TYPE constants
   * defined in the interface. Returns -1 if an error occurred.
   */
  getItemType : function(aItem) {
    this._logService.trace("Begin: EbayDatasourceService.getItemType");
    return this._getItemType(this._compositeDatasource, aItem);
  },

  /**
   * Obtains the list type of an item.
   * @param aDatasource the datasource to look into.
   * @param aItem the item to get the type for.
   * @return the type of the item. It can be any of the ITEM_TYPE constants
   * defined in the interface. Returns -1 if an error occurred.
   */
  _getItemType : function(aDatasource, aItem) {
    this._logService.trace("Begin: EbayDatasourceService._getItemType");

    var propResource = this._rdfService.GetResource(RDF_NAME + "type");
    var prop = aDatasource.GetTarget(aItem, propResource, true);
    var type = -1;
    var typeStr;

    if (prop) {
      typeStr = this._getValue(prop);
      this._logService.debug("Type string: " + typeStr);

      switch (typeStr) {
        case EBAYCOMP_NAME + "WatchItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH;
          break;
        case EBAYCOMP_NAME + "BidItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID;
          break;
        case EBAYCOMP_NAME + "BestOfferItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_BESTOFFER;
          break;
        case EBAYCOMP_NAME + "WonItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_WON;
          break;
        case EBAYCOMP_NAME + "LostItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_LOST;
          break;
        case EBAYCOMP_NAME + "ActiveItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE;
          break;
        case EBAYCOMP_NAME + "SoldItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD;
          break;
        case EBAYCOMP_NAME + "UnsoldItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_UNSOLD;
          break;
        case EBAYCOMP_NAME + "FeedbackItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_FEEDBACK;
          break;
        case EBAYCOMP_NAME + "MessageItem":
          type = CI.gsIAutotraderDatasourceService.ITEM_TYPE_MESSAGE;
          break;
      }
    }

    if (-1 == type) {
      this._logService.error(
        "An error occurred trying to obtain the type of an item.");
    }

    return type;
  },

  /**
   * Obtains the string value of a item property.
   * @param aItem the item for which the property will be obtained.
   * @param aPropertyName the name of the property to obtain.
   * @return the string value of the property for the item.
   */
  getItemProperty : function(aItem, aPropertyName) {
    this._logService.debug(
      "Begin: EbayDatasourceService.getItemProperty. Property: " +
      aPropertyName);
    return this._getItemProperty(this._compositeDatasource,
                                 aItem, aPropertyName);
  },

  /**
   * Obtains the string value of a item property.
   * @param aDatasource the datasource to look into.
   * @param aItem the item for which the property will be obtained.
   * @param aPropertyName the name of the property to obtain.
   * @return the string value of the property for the item.
   */
  _getItemProperty : function(aDatasource, aItem, aPropertyName) {
    this._logService.debug(
      "Begin: EbayDatasourceService._getItemProperty. Property: " +
      aPropertyName);

    var propResource =
      this._rdfService.GetResource(EBAYCOMP_NAME + aPropertyName);
    var prop = aDatasource.GetTarget(aItem, propResource, true);
    var result = "";

    if (prop) {
      result = this._getValue(prop);
    }

    return result;
  },

  /**
   * Obtains the feedback score for the currently logged in user.
   * @return the feedback score for the currently logged in user.
   */
  get feedbackScore() {
    this._logService.debug(
      "Begin: EbayDatasourceService.get feedbackScore");

    var feedbackList;
    var feedbackResource;
    var feedbackScore;
    var feedbackScoreValue;
    var userLiteral
    var currentUser = this._userService.userSession.username.toLowerCase();

    userLiteral = this._rdfService.GetLiteral(currentUser);
    feedbackResource =
      this._usersFeedbackDatasource.GetSource(
        this._usernameArc, userLiteral, true);
    if (feedbackResource) {
      feedbackScore =
        this._usersFeedbackDatasource.GetTarget(
          feedbackResource, this._feedbackArc, true);
      feedbackScoreValue = this._getValue(feedbackScore)
    }

    return feedbackScoreValue;
  },

  /**
   * Updates the total feedback score.
   * @param aResource the target resource for the feedback score.
   * @param aNewDS the datasource that contains the updated feedback.
   */
  _updateFeedbackScore : function(aResource, aNewDS) {
    this._logService.trace(
      "Begin: EbayDatasourceService._updateFeedbackScore");

    var newList;
    var newFeedback;
    var newFeedbackValue;
    var oldFeedback;
    var oldFeedbackValue;
    var feedbackId;
    var feedback;
    var feedbackItem;
    var foundResource;
    var newResource;
    var currentUser = this._userService.userSession.username.toLowerCase();
    var userLiteral = this._rdfService.GetLiteral(currentUser);

    newList =
      this._rdfService.GetResource(
        EBAYCOMP_NEW_LIST + EBAYCOMP_LIST_FEEDBACK);
    newFeedback = aNewDS.GetTarget(newList, this._feedbackArc, true);
    newFeedbackValue = parseInt(this._getValue(newFeedback), 10);
    oldFeedback =
      this._usersFeedbackDatasource.GetTarget(
        aResource, this._feedbackArc, true);
    oldFeedbackValue = parseInt(this._getValue(oldFeedback), 10);

    // update the feedback score.
    this._usersFeedbackDatasource.Change(
      aResource, this._feedbackArc, oldFeedback, newFeedback);

    // check whether we should congratulate the user on a
    //   new feedback milestone
    if (newFeedbackValue > oldFeedbackValue) {
      var listLength = EBAYCOMP_FEEDBACK_MILESTONES.length;
      var showedScoreAlert = false;

      for (var i=listLength-1; !showedScoreAlert && i>=0; i--) {
        if ((EBAYCOMP_FEEDBACK_MILESTONES[i] > oldFeedbackValue) &&
            (EBAYCOMP_FEEDBACK_MILESTONES[i] <= newFeedbackValue)) {
          this._alertService.
            addFeedbackScoreAlert(EBAYCOMP_FEEDBACK_MILESTONES[i]);
          showedScoreAlert = true;
        }
      }
    }
  },

  /**
   * Removes all arcs coming out of a resource.
   * @param aResource the resource from which all arcs out will be removed.
   * @param aResource the datasource where all arcs out will be removed.
   */
  _removeAllArcsOut : function(aResource, aTargetDS) {
    this._logService.trace("Begin: EbayDatasourceService._removeAllArcsOut");

    var arcs;
    var arc;
    var arcTarget;

    arcs = aTargetDS.ArcLabelsOut(aResource);

    while (arcs.hasMoreElements()) {
      arc = arcs.getNext();
      arcTarget = aTargetDS.GetTarget(aResource, arc, true);
      aTargetDS.Unassert(aResource, arc, arcTarget);
    }
  },

  /**
   * Moves all arcs out from a resource in another datasource to another one in
   * this datasource. It might also set the alerts the item might have.
   * @param aSource the resource whose arcs will be moved.
   * @param aTarget the resource that will have the arcs moved to. It's null if
   * there is no corresponding resource in the local datasource.
   * @param aSourceDS the datasource associated with the resource.
   * @param aTargetDS the datasource that the arcs will be moved to.
   */
  _moveAllArcsOut : function(aSource, aTarget, aSourceDS, aTargetDS) {
    this._logService.trace("Begin: EbayDatasourceService._moveAllArcsOut");

    var isBidList =
      (CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID ==
       this._getItemType(aSourceDS, aSource));
    var arcs;
    var arc;
    var arcTarget;
    var oldTarget;
    var oldValue;
    var newValue;

    if (isBidList) {
      this._isOutbid = false;
      this._highAgain = false;
      this._isPossibleAutoRaise = false;
    }

    arcs = aSourceDS.ArcLabelsOut(aSource);

    while (arcs.hasMoreElements()) {
      arc = arcs.getNext();
      arcTarget = aSourceDS.GetTarget(aSource, arc, true);

      if (aTarget != null) {
        if (aTargetDS.hasArcOut(aTarget, arc)) {
          oldTarget = aTargetDS.GetTarget(aTarget, arc, true);
          oldValue = this._getValue(oldTarget);
          newValue = this._getValue(arcTarget);

          if (oldValue != newValue) {
            aTargetDS.Change(aTarget, arc, oldTarget, arcTarget);
          }
        } else {
          oldValue = null;
          newValue = this._getValue(arcTarget);
          aTargetDS.Assert(aTarget, arc, arcTarget, true);
        }

        this._setAlerts(aTarget, arc, oldValue, newValue);
      } else {
        aTargetDS.Assert(aSource, arc, arcTarget, true);
      }
    }

    if (isBidList && this._isPossibleAutoRaise && !this._isOutbid &&
        !this._highAgain) {
      // a target is never null in here because the previous conditions are only
      // true after updates, not on the first load.
      this._alertService.addAlert(
        CI.gsIAutotraderAlert.ALERT_TYPE_BID_RAISED, this._createItem(aTarget),
        null);
      this._logService.info(
        "The user's bid for an item has been automatically raised.");
    }
  },

  /**
   * Set any alerts on the item, if necessary. Alerts are set when certain
   * properties of the item are updated.
   * @param aResource the resource whose arc was updated.
   * @param aArc the arc (property) that was updated.
   * @param aOldValue the previous value of the property. It can be null if the
   * property wasn't set previously.
   * @param aNewValue the new value of the property.
   */
  _setAlerts : function(aResource, aArc, aOldValue, aNewValue) {
    this._logService.trace("Begin: EbayDatasourceService._setAlerts");

    var arcName = this._getValue(aArc);
    var valueChanged = (aOldValue != aNewValue);
    var itemType = this.getItemType(aResource);

    switch (arcName) {
      case EBAYCOMP_TIME_LEFT:
        // all lists with updateable time have this.
        var newInterval = this._createInterval(aNewValue);
        var endSoon = false;
        var alertType = -1;

        if (valueChanged) {
          switch (itemType) {
            case CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH:
              endSoon = (this._alertTimeWatch.compareTo(newInterval) > 0);
              // we only have an ended item alert for watch items because bid
              // and sell items change type when they end.
              alertType =
                (newInterval.isPositive() ?
                 CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING :
                 CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDED);
              break;

            case CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID:
              if (newInterval.isPositive()) {
                endSoon = (this._alertTimeBid.compareTo(newInterval) > 0);
                alertType = CI.gsIAutotraderAlert.ALERT_TYPE_BID_ENDING;
              }
              break;

            case CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE:
              if (newInterval.isPositive()) {
                endSoon = (this._alertTimeActive.compareTo(newInterval) > 0);
                alertType = CI.gsIAutotraderAlert.ALERT_TYPE_SELL_ENDING;
              }
              break;
          }
        }

        if (endSoon) {
          this._alertService.addAlert(
            alertType, this._createItem(aResource), null);
          this._logService.info("A list item will end soon.");
        }
        break;

      case EBAYCOMP_HIGH_BIDDER:
        if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID == itemType) {
          var currentUser =
            this._userService.userSession.username.toLowerCase();

          this._isOutbid =
            (!this._isOutbid && valueChanged && aOldValue == currentUser);
          this._highAgain =
            (!this._highAgain && valueChanged && aNewValue == currentUser);

          if (this._isOutbid) {
            this._alertService.addAlert(
              CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID,
              this._createItem(aResource), null);
            this._logService.info("The user was outbid by:" + aNewValue);
          } else if (this._highAgain) {
            this._alertService.addAlert(
              CI.gsIAutotraderAlert.ALERT_TYPE_HIGH_BIDDER,
              this._createItem(aResource), null);
            this._logService.info("The user is the high bidder again.");
          }
        } else if (valueChanged &&
          CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE == itemType) {
          var itemId = this.getItemProperty(aResource, "item-id");
          // if the high bidder for a selling item has changed, update its
          // information.
          this._userService.getItem(itemId);
        }
        break;

      case EBAYCOMP_QUANTITY_WON:
        if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID == itemType &&
            valueChanged) {
          var oldQuantityWon = parseInt(aOldValue, 10);
          var newQuantityWon = parseInt(aNewValue, 10);

          if (!this._isOutbid && (oldQuantityWon > newQuantityWon)) {
            this._alertService.addAlert(
              CI.gsIAutotraderAlert.ALERT_TYPE_OUTBID,
              this._createItem(aResource), null);
            this._logService.info(
              "The user is winning less items: " + aNewValue);
            this._isOutbid = true;
          } else if (!this._highAgain && (oldQuantityWon < newQuantityWon)) {
            this._alertService.addAlert(
              CI.gsIAutotraderAlert.ALERT_TYPE_HIGH_BIDDER,
              this._createItem(aResource), null);
            this._logService.info(
              "The user is winning more items: " + aNewValue);
            this._highAgain = true;
          }
        }
        break;

      case EBAYCOMP_BID_COUNT:
        if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE == itemType &&
            valueChanged) {
          this._alertService.addAlert(
            CI.gsIAutotraderAlert.ALERT_TYPE_NEW_BID,
            this._createItem(aResource), null);
          this._logService.info(
            "The user has a new bid. Bid count:" + aNewValue);
        }
        break;

      case EBAYCOMP_RESERVE_MET:
        if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_ACTIVE == itemType &&
            valueChanged) {
          this._alertService.addAlert(
            CI.gsIAutotraderAlert.ALERT_TYPE_RESERVE_MET,
            this._createItem(aResource), null);
          this._logService.info(
            "The reserve has been met for a selling item.");
        }
        break;

      case EBAYCOMP_CURRENT_PRICE:
        if (CI.gsIAutotraderDatasourceService.ITEM_TYPE_BID == itemType &&
            valueChanged) {
          var currentUser =
            this._userService.userSession.username.toLowerCase();
          var highBidderArc =
            this._rdfService.GetResource(EBAYCOMP_HIGH_BIDDER);
          var highBidder =
            this._datasource.GetTarget(aResource, highBidderArc, true);
          var highBidderValue = this._getValue(highBidder);
          // here we can only know if the user is or was the high bidder, but
          // not both. He has to be the high bidder before and after the update
          // so that we know that there was an automatic raise in the user's
          // bid. When deciding if the alert should be shown we need to check
          // for the outbid and high-again flags, which should be both not true.
          // See _moveAllArcsOut for the rest of the code.
          this._isPossibleAutoRaise = (currentUser == highBidderValue);
        }
        break;
    }
  },

  /**
   * Sets any alerts that are necessary for new items found on the lists.
   * @param aResource the resource added to the list.
   */
  _setNewItemAlerts : function(aResource) {
    this._logService.trace("Begin: EbayDatasourceService._setNewItemAlerts");

    var itemType = this.getItemType(aResource);
    var alertType = -1;

    switch (itemType) {
      case CI.gsIAutotraderDatasourceService.ITEM_TYPE_WON:
        if (this._firstUpdateBuyingDone && this._hasRecentlyEnded(aResource)) {
          var wonItem = this._createItem(aResource);
          // prevent BIN items to trigger won alerts.
          if (wonItem.canBid) {
            var binItemCount = this._binItems.length;
            var onBINList = false;
            var binItem;
            // look for the matching item on the BIN list.
            for (var i = 0; !onBINList && i < binItemCount; i++) {
              binItem = this._binItems[i];

              if (wonItem.id == binItem.id) {
                this._logService.debug("The item was found on the BIN list.");
                onBINList = true;

                // if the end time for the item hasn't changed, then the item
                // was most likely won through regular bidding.
                if (wonItem.endTime == binItem.endTime) {
                  alertType = CI.gsIAutotraderAlert.ALERT_TYPE_WON;
                  this._logService.info("The user won an item.");
                }
              }
            }

            if (!onBINList) {
              this._logService.debug("The item was not found on the BIN list.");
              alertType = CI.gsIAutotraderAlert.ALERT_TYPE_WON;
              this._logService.info("The user won an item.");
            }
          } else {
           // dismiss the ending watch item primary alert.
            this._dismissPrimaryAlert(
              CI.gsIAutotraderAlert.ALERT_TYPE_WATCH_ENDING, wonItem.id);
          }
        }
        break;
      case CI.gsIAutotraderDatasourceService.ITEM_TYPE_LOST:
        if (this._firstUpdateBuyingDone && this._hasRecentlyEnded(aResource)) {
          alertType = CI.gsIAutotraderAlert.ALERT_TYPE_LOST;
          this._logService.info("The user lost an item.");
        }

        break;
      case CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD:
        if (this._firstUpdateSellingDone && this._hasRecentlyEnded(aResource)) {
          alertType = CI.gsIAutotraderAlert.ALERT_TYPE_SOLD;
          this._logService.info("The user sold an item.");
        }

        break;
      case CI.gsIAutotraderDatasourceService.ALERT_TYPE_UNSOLD:
        if (this._firstUpdateSellingDone && this._hasRecentlyEnded(aResource)) {
          alertType = CI.gsIAutotraderAlert.ALERT_TYPE_UNSOLD;
          this._logService.info("The user didn't sell an item.");
        }

        break;
      case CI.gsIAutotraderDatasourceService.ITEM_TYPE_FEEDBACK:
          alertType = CI.gsIAutotraderAlert.ALERT_TYPE_NEW_FEEDBACK;
          this._logService.info("The user has new feedback.");
        break;
    }

    if (alertType != -1) {
      if (alertType != CI.gsIAutotraderAlert.ALERT_TYPE_NEW_FEEDBACK) {
        this._alertService.addAlert(
          alertType, this._createItem(aResource), null);
      } else {
        var itemId = this.getItemProperty(aResource, "item-id");
        var feedbackItem =
          this.getItemByIdAndType(
            itemId, CI.gsIAutotraderDatasourceService.ITEM_TYPE_FEEDBACK);
        var role = this.getItemProperty(aResource, "role");
        var item;

        if (EBAYCOMP_FEEDBACK_ROLE_SELLER == role) {
          item =
            this.getItemByIdAndType(
              itemId, CI.gsIAutotraderDatasourceService.ITEM_TYPE_SOLD);
        } else {
          item =
            this.getItemByIdAndType(
              itemId, CI.gsIAutotraderDatasourceService.ITEM_TYPE_WON);
        }

        if (item) {
          this._alertService.addAlert(alertType, item, feedbackItem);
        }
      }
    }
  },

  /**
   * Dismisses any unwanted primary alert.
   * @param aAlertType the alert type to be dismissed.
   * @param aItemId the item id of the primary alert to be dismissed.
   */
  _dismissPrimaryAlert : function(aAlertType, aItemId) {
    this._logService.trace("Begin: EbayDatasourceService._dismissPrimaryAlert");

    var listCount = new Object();
    var list = new Object();
    var primaryAlerts;

    // get all the primary alerts
    this._alertService.getPrimaryAlerts(listCount, list);
    primaryAlerts = list.value;
    listLength = listCount.value;
    // remove unwanted ending soon watch item primary alert.
    for (var i = 0; i < listLength; i++) {
      if (primaryAlerts[i].type == aAlertType &&
          primaryAlerts[i].item.id == aItemId) {
        this._alertService.dismissAlert(primaryAlerts[i]);
        break;
      }
    }
  },

  /**
   * Indicates whether the item the resource represents has ended recently or
   * not.
   * @param aResource the resource to verify if it corresponds to a recently
   * ended item.
   * @return true if the item ended recently. false otherwise.
   */
  _hasRecentlyEnded : function(aResource) {
    this._logService.trace("Begin: EbayDatasourceService._hasRecentlyEnded");

    var endedItem = this._createItem(aResource);
    var currentTime = (new Date()).getTime();
    var timeDifference = currentTime - endedItem.endTime;
    var recent =
      ((0 < endedItem.endTime) && (0 <= timeDifference) &&
       (EBAYCOMP_ALERT_ENDED_FRAME > timeDifference));

    return recent;
  },

  /**
   * Empties the sequence and removes all arcs from all elements in the
   * sequence.
   * @param aSequence the sequence to be emptied.
   * @param aDatasource the datasource where the sequence will be emptied.
   */
  _emptySequence : function(aSequence, aDatasource) {
    this._logService.trace("Begin: EbayDatasourceService._emptySequence");

    var seqElements = aSequence.GetElements();
    var seqElement;

    while (seqElements.hasMoreElements()) {
      seqElement = seqElements.getNext();
      this._removeAllArcsOut(seqElement, aDatasource);
      aSequence.RemoveElement(seqElement, true);
    }
  },

  /**
   * Gets the value for a resource or literal.
   * @param aNode the resource or literal we want the value from.
   * @returns the value of the resource or literal.
   */
  _getValue : function(aNode) {
    this._logService.trace("Begin: EbayDatasourceService._getValue");

    var resourceValue = null;

    try {
      aNode.QueryInterface(CI.nsIRDFResource);
      resourceValue = aNode.Value;
    } catch(e) {
      try {
        aNode.QueryInterface(CI.nsIRDFLiteral);
        resourceValue = aNode.Value;
      } catch(e) {
        this._logService.error(
          "An error occurred trying to get the value for a node.\n[" + e.name +
          "] " + e.message);
        throw(e);
      }
    }

    return resourceValue;
  },

  /**
   * Creates an instance of the interval object, with the given value.
   * @param aValue the string representation of an interval. A value of null
   * creates an interval equal to zero.
   * @return interval object initialized with the given value.
   */
  _createInterval : function(aValue) {
    this._logService.trace("Begin: EbayDatasourceService._createInterval");

    var interval =
      CC["@glaxstar.org/autotrader/autotrader-time-interval;1"].
        createInstance(CI.gsIAutotraderTimeInterval);

    if (aValue) {
      interval.init(aValue);
    }

    return interval;
  },

  /**
   * Creates an instance of the item object, with the given resource.
   * @param aResource the RDF resource that corresponds to the item.
   * @return item object initialized with the given resource.
   */
  _createItem : function(aResource) {
    this._logService.trace("Begin: EbayDatasourceService._createItem");

    var item =
      CC["@glaxstar.org/autotrader/autotrader-item;1"].
        createInstance(CI.gsIAutotraderItem);

    if (aResource) {
      item.init(aResource);
    }

    return item;
  },

  /**
   * Obtains the datasource object for external use.
   * @return the datasource object.
   */
  get datasource() {
    return this._compositeDatasource;
  },

  /**
   * Obtains the display list.
   * @return the display list.
   */
  get displayList() {
    return this._displayList;
  },
   
  /**
   * Obtains the list cut notified boolean.
   * @return the list cut notified boolean.
   */
  get listCutNotified() {
    return this._listCutNotified; 
  },

  /**
   * Obtains the list cut notified boolean.
   * @param the list cut notified boolean.
   */
  set listCutNotified(aValue) {
    this._listCutNotified = aValue; 
  },
  
  /**
   * Observes any ebay topics changes.
   * @param aSubject the object that experienced the change.
   * @param aTopic the topic being observed.
   * @param aData the data relating to the change.
   */
  observe : function(aSubject, aTopic, aData) {
    this._logService.debug(
      "Begin: EbayDatasourceService.observe. Topic: " + aTopic);
  
    switch(aTopic) {
      case "em-action-requested":
        aSubject.QueryInterface(CI.nsIUpdateItem);
        
        if (aSubject.id == EBAYCOMP_UUID) {
          if (aData == "item-uninstalled") {
            this._uninstallExtension = true;
          }
          else if (aData == "item-cancel-action") {
            this._uninstallExtension = false;
          }
        }
        break;
      case "quit-application-granted":
        if (!this._uninstallExtension) {
          // ensure datasources are flushed.
          this._save();
        }
        break;
      case "ebayComp-login-status":
        if (aData == "logged-in-manual" || aData == "logged-in-auto") {
          this._changeUser();
        }
        break;
      default:
        this._logService.error(
          "EbayDatasourceService.observe: unexpected topic received.");
    }
  },

  /**
   * Copy a file identified by aFileName from the defaults directory
   * to a location in the filesystem identified by a aDestination.
   * @param aFileName the name of the file to copy.
   * @param aDestination the nsIFile where the file should be copied.
   */
  _copyFileFromDefaultDir : function (aFileName, aDestination) {
    this._logService.trace(
      "Begin: EbayDatasourceService._copyFileFromDefaultDir");

    try {
      var file =
        Components.classes["@mozilla.org/extensions/manager;1"].
          getService(Components.interfaces.nsIExtensionManager).
          getInstallLocation(EBAYCOMP_UUID).
          getItemLocation(EBAYCOMP_UUID);

      file.append("defaults");
      file.append(aFileName);
      file.copyTo(aDestination.parent, aDestination.leafName);
    } catch(e) {
      this._logService.error(
        "An error occurred trying to copy a file from the defaults dir. " +
        "File name:" + aFileName + ".\n[" + e.name + "] " + e.message);
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderDatasourceService) &&
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
var EbayDatasourceServiceFactory = {
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
      this._singletonObj = EbayDatasourceService;
      EbayDatasourceService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayDatasourceServiceModule = {
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
      return EbayDatasourceServiceFactory;
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
  return EbayDatasourceServiceModule;
}
