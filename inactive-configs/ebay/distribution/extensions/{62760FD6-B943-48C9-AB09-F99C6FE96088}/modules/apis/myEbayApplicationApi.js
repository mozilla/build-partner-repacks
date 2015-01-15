/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["MyEbayApplicationApi"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/observers.js");Cu.import("resource://ebaycompanion/helpers/apiHelper.js");Cu.import("resource://ebaycompanion/apiAccessService.js");Cu.import("resource://ebaycompanion/objects/item.js");Cu.import("resource://ebaycompanion/datasource.js");Cu.import("resource://ebaycompanion/constants.js");MyEbayApplicationApi={removeFromDidntWinList:function(aItemId,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make MyEbayApplication API "+
"removeFromDidntWinList call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();innerBody+=<itemID>{aItemId}</itemID>;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("removeFromDidntWinList", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);
        Logger.error("remove from didnt win: " + response);

        let foundErrors = that._detectAndReportErrors(xmlTree);

        try {
          if (callback) {
            let result = {};
            result.error = foundErrors;
            callback(result);
          }
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
   * MyEbayApplicationApi API removeFromWonList
   * @param aItemId the id of the item to be removed
   * @param aTransactionId the id of the transaction to be removed
   * @param callback
   * @returns request object
   */
  removeFromWonList : function(aItemId, aTransactionId, callback) {
    if (!Datasource.activeAccount()) {
      Logger.error("Attempt to make MyEbayApplication API removeFromWonList " +
                   "call when no account is active.", Logger.DUMP_STACK);
      return;
    }
    let innerBody = new XMLList();

    let itemNode = <><item/></>;
    itemNode.itemID = aItemId;
    itemNode.transactionID = aTransactionId;

    innerBody += itemNode;

    // create flat XML string
    XML.prettyPrinting = false;
    let flatInnerBody = innerBody.toXMLString();
    XML.prettyPrinting = true;

    // do the call
    let wrappedBody =
      this._wrapCall("removeFromWonList", flatInnerBody);
    let localCallback =
      let(that = this) function(response) {
        // Workaround for E4X bug in Firefox
        // Also get rid of that annoying namespace
        response = response.replace(/<\?xml .*?>/, "").
                            replace(/ xmlns=["'].*?["']/, "");
        let xmlTree = XML(response);
        Logger.error("remove from won:" + response);

        let foundErrors = that._detectAndReportErrors(xmlTree);

        try {
          if (callback) {
            let result = {};
            result.error = foundErrors;
            callback(result);
          }
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
   * Reports any error messages in the API response
   * @param xmlTree the API response
   */
  _detectAndReportErrors : function(xmlTree) {
    let foundErrors = false;

    // Check for errors
    let errorNode = xmlTree..errorMessage.error;
    if (errorNode != undefined) {
      foundErrors = true;
      let errorCode = Number(errorNode.errorId);
      let severity = String(errorNode.severity.text());
      if (severity.indexOf("Error") != -1) {
        Logger.error("MyEbayApplication API Error:\n" + "Error Code:" + errorCode +
                     "\nMessage:" +
                     String(errorNode.message.text()) +
                     "\nSeverity:" +
                      severity +
                     "\nError category:" +
                     String(errorNode.category.text()) + "\n",
                     Logger.DUMP_STACK);
      }
    }

    return foundErrors;
  },

  /**
   * Wraps an XML fragment into a MyEbayApplication API call
   * @param callName The name of the call (without "Request")
   * @param body The body of the call
   * @returns the fully-formed text
   */
  _wrapCall : function(callName, innerBody) {
    let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";let xmlns="xmlns=\"http://www.ebay.com/marketplace/mobile/v1/services\"";let wrappedBody=xmlHeader+
"<"+callName+"Request "+xmlns+">"+
innerBody+
"</"+callName+"Request>";return wrappedBody;},_doCall:function(body,useSandbox,callback){let requestName;try{requestName=/><(.*?)Request/.exec(body)[1];}
catch(e){Logger.error("MyEbayApplication API request will not be sent, as it is "+
"badly-formed.",Logger.DUMP_STACK);return;}
let callDescription="MyEbayApplication API "+requestName;let apiCallback=ApiHelper.generateApiCallback(callDescription,callback);let siteId=Constants.siteIdForSite(Datasource.homeSite());ApiAccessService.siteId=siteId;ApiAccessService.apiVersion=1;let token=Datasource.activeAccount().get("token");let request=ApiAccessService.doMyEbayApplicationAPICall(requestName,token,body,useSandbox,apiCallback);ApiHelper.addPendingRequest(request,callDescription);let requestLog={};requestLog.requestName=requestName;requestLog.properties=body;requestLog.api="MyEbayApplication";Observers.notify(requestLog,"ebay-myEbayApplication-api-call",null);return request;}};