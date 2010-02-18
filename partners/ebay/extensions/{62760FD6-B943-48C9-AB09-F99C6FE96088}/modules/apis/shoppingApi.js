/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["ShoppingApi"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://ebaycompanion/helpers/logger.js");
Cu.import("resource://ebaycompanion/helpers/observers.js");
Cu.import("resource://ebaycompanion/helpers/apiHelper.js");
Cu.import("resource://ebaycompanion/datasource.js");
Cu.import("resource://ebaycompanion/constants.js");

/**
 * Shopping API actions
 */
ShoppingApi = {
  /**
   * Shopping API GetUserProfile
   * @param callback
   * @returns request object
   */
  getUserProfile : function(callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Shopping API GetUserProfile call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    innerBody += <IncludeSelector>Details</IncludeSelector>;
    innerBody += <UserID>{Datasource.activeAccount().get("userId")}</UserID>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetUserProfile", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetUserProfile(response);
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetUserProfile response
   * @param response
   * @returns current user's feedback score
   */
  _parseGetUserProfile : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    let foundErrors = this._detectAndReportErrors(xmlTree);
    if (foundErrors) {
      // The returned item will be null
      return;
    }

    let feedbackRating = xmlTree.User.FeedbackScore.toString();
    let registrationSite = xmlTree.User.RegistrationSite.toString();

    let ret = {};
    ret.feedbackRating = feedbackRating;
    ret.registrationSite = registrationSite;

    return ret;
  },

  /**
   * Shopping API GetMultipleItems
   * @param itemIds Array of itemIds corresponding to items to fetch
   * @param callback
   * @returns request object
   */
  getMultipleItems : function(itemIds, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make Shopping API GetMultipleItems call when " +
                   "no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    innerBody += <IncludeSelector>Details</IncludeSelector>;
    for (let i = 0; i < itemIds.length; i++) {
      innerBody += <ItemID>{itemIds[i]}</ItemID>;
    }

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody = this._wrapCall("GetMultipleItems", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        let result = that._parseGetMultipleItems(response);
        try {
          if (callback) callback(result);
        }
        catch (e) {
          Logger.exception(e);
        }
      }
    let useSandbox = Datasource.activeAccount().get("isSandboxAccount");
    let request = this._doCall(wrappedBody, useSandbox, localCallback);

    return request;
  },

  /**
   * Processes a GetMultipleItems response
   * @param response
   * @returns current user's feedback score
   */
  _parseGetMultipleItems : function(response) {
    // Workaround for E4X bug in Firefox
    // Also get rid of that annoying namespace
    response = response.replace(/<\?xml .*?>/, "").
                        replace(/ xmlns=["'].*?["']/, "");
    let xmlTree = XML(response);

    this._detectAndReportErrors(xmlTree);

    let ret = {};
    ret.items = [];

    let items = xmlTree.Item;
    for (let i = 0; i < items.length(); i++) {
      let retItem = {};
      retItem.itemId = Number(items[i].ItemID);
      let quantity = Number(items[i].Quantity);
      retItem.quantitySold = Number(items[i].QuantitySold);
      retItem.quantityRemaining = quantity - retItem.quantitySold;
      ret.items.push(retItem);
    }

    return ret;
  },

  /**
   * Reports any error messages in the API response
   * @param xmlTree the API response
   */
  _detectAndReportErrors : function(xmlTree) {

    // Check for errors
    if (xmlTree.Errors.length() > 0) {
      foundErrors = true;
      let errors = xmlTree.Errors;
      for (let i = 0; i < errors.length(); i++) {
        let errorCode = Number(errors[i].ErrorCode);
        Logger.error("Shopping API Error:\n" + "Error Code: " + errorCode +
                     "\nShort Message: " +
                     String(errors[i].ShortMessage.text()) +
                     "\nSeverity: " +
                     String(errors[i].SeverityCode.text()) +
                     "\nError Clasification: " +
                     String(errors[i].ErrorClassification.text()) + "\n",
                     Logger.DUMP_STACK);
      }
    }
  },

  /**
   * Wraps an XML fragment into a Shopping API call
   * @param callName The name of the call (without "Request")
   * @param body The body of the call
   * @returns the fully-formed text
   */
  _wrapCall : function(callName, innerBody) {
    let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
    let xmlns = "xmlns=\"urn:ebay:apis:eBLBaseComponents\"";

    let wrappedBody = xmlHeader +
                      "<" + callName + "Request " + xmlns + ">" +
                      innerBody +
                      "</" + callName + "Request>";

    return wrappedBody;
  },

  /**
   * Performs Shopping API call
   * @param body The full body of the call, as will be POSTed
   * @param useSandbox boolean
   * @param callback The callback function
   */
  _doCall : function(body, useSandbox, callback) {
    // Extract the call name from the body --- we need it in the headers
    let requestName;
    try {
      requestName = /><(.*?)Request/.exec(body)[1];
    }
    catch (e) {
      Logger.error("Shopping API request will not be sent, as it is " +
                   "badly-formed.", Logger.DUMP_STACK);
      return;
    }
    let callDescription = "Shopping API " + requestName;

    let apiCallback =
      ApiHelper.generateApiCallback(callDescription, callback);

    if (!ApiHelper.accessService) {
      // The binary component is missing.
      return;
    }
    let siteId = Constants.siteIdForSite(Datasource.homeSite());
    ApiHelper.accessService.setSiteId(siteId);
    ApiHelper.accessService.setApiVersion(623);
    let request =
      ApiHelper.accessService.
        doShoppingApiCall(requestName, body, useSandbox, apiCallback);

    ApiHelper.addPendingRequest(request, callDescription);

    return request;
  }
};
