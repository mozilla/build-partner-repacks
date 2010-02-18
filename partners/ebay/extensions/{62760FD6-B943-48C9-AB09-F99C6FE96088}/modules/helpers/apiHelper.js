/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ApiHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var ApiHelper = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import(
        "resource://ebaycompanion/helpers/warningNotificationHelper.js");
      Cu.import("resource://ebaycompanion/objects/notification.js");
      Cu.import("resource://ebaycompanion/constants.js");

      this._observers = new Observers;
      this._observers.
        add(let (that = this) function() that._uninit(),
            "quit-application-granted");

      try {
        this._accessService =
          Cc["@glaxstar.org/ebaycompanion/ebay-access-component;1"].
            getService(Ci.ecIEbayAccessComponent);
      }
      catch (e) {
        Logger.error("The eBay API Access service is not available.");
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
      this.abortPendingRequests();
      this._observers.removeAll();
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Getter
   */
  get accessService() {
    return this._accessService;
  },

  /**
   * Generates an ecIEbayApiCallback object for use with the Access Component.
   * @param callDescription used for reporting errors
   * @param callback Function called with the response when it was successful
   */
  generateApiCallback : function(callDescription, callback) {
    let callSendStack = Components.stack.caller;
    let apiCallback = {
      trigger : function(err, response) {
        // Check for an error code
        if (err != 0) {
          // An abort isn't worth reporting.
          if (err != Cr.NS_BINDING_ABORTED) {
            // Determine the name of the error (expensive!)
            let errorString = err; // (default value in case there is no string)
            for (let [name, code] in Iterator(Cr)) {
              if (code == err) {
                errorString = name;
              }
            }
            Logger.error(callDescription + " resulted in error: " +
                         errorString);
            Logger.error("The call was sent from the following stack:",
                         Logger.DUMP_STACK, callSendStack)
            // create sidebar notification
            let notification =
              new Notification(
                WarningNotificationHelper.API_CONNECTION_WARNING);
            notification.set(
              "content", Constants.stringBundle.getString(
                "ecSidebar.notification.error.connection"));
            notification.set("priority", 1);
            WarningNotificationHelper.queueNotification(notification);
          }
          return;
        }

        // All is OK; call our callback
        try {
          if (callback) callback(response);
          // remove API_CONNECTION_WARNING message (if any)
          WarningNotificationHelper.dismissNotification(
            WarningNotificationHelper.API_CONNECTION_WARNING);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    }
    return apiCallback;
  },

  /**
   * Adds the given request to the list of pending requests and starts a timer.
   * The request will automatically time-out and cancel after a preset interval.
   * @param request nsIEbayApiRequest to track
   * @param requestDescription String used to describe call when reporting
   *                           timeout
   * @returns An ID that identifies the request.  It can be used to untrack the
   *          request
   */
  addPendingRequest : function(request, requestDescription) {
    const CALL_TIMEOUT = 3 * 60 * 1000;   // in milliseconds
    const TIMEOUT_ERROR_MSG = "Call timed out after " + CALL_TIMEOUT/1000 +
                              " seconds";
    const that = this;

    // Keep reference to request until it's returned, so that it can be
    // cancelled if necessary, and prepare timeout.
    if (!this._lastRequestIndex || !this._pendingRequests) {
      this._lastRequestIndex = 1;
      this._pendingRequests = {};
    }
    let requestIndex = this._lastRequestIndex++;
    let timeout =
      new Timer(function() {
                  Logger.error(requestDescription + ": " + TIMEOUT_ERROR_MSG);
                  request.cancel();
                }, CALL_TIMEOUT);
    this._pendingRequests[requestIndex] =
      {
        request : request,
        timeout : timeout
      };

    // Add callback to request so that it can be removed from the list when it
    // returns.
    request.addCallback({
      trigger : function(err, response) {
        that.removePendingRequest(requestIndex);
      }
    });

    return requestIndex;
  },

  /**
   * Removes the request with the given tracking ID from the list of pending
   * requests and aborts the timeout timer.
   * @param requestId ID that identifies the request, provided by
   *                  addPendingRequest
   */
  removePendingRequest : function(requestId) {
    if (!this._pendingRequests[requestId]) {
      Logger.error("Attempt to remove a request that isn't in the list of " +
                   "pending requests!", Logger.DUMP_STACK);
      return;
    }
    this._pendingRequests[requestId].timeout.cancel();
    delete this._pendingRequests[requestId];
  },

  /**
   * Returns the number of pending requests
   */
  get numPendingRequests() {
    let num = 0;

    if (this._pendingRequests) {
      for each (let [index, requestObject] in Iterator(this._pendingRequests)) {
        num++;
      }
    }

    return num;
  },

  /**
   * Aborts all pending requests
   */
  abortPendingRequests : function() {
    if (!this._pendingRequests) {
      return;
    }

    for each (let [index, requestObject] in Iterator(this._pendingRequests)) {
      requestObject.request.cancel();
      requestObject.timeout.cancel();
    }
  }
};

ApiHelper._init();
