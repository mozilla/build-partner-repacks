/**
 *  Copyright (C) 2007-2008  eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CC = Components.classes;
const CR = Components.results;
const CLASS_ID = Components.ID("{C2146C38-A49E-11DB-A939-B04356D89593}");
const CLASS_NAME = "eBay User Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/ebay-user-service;1";
const EBAYCOMP_UUID = "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
const EBAYCOMP_FOLDER = "eBayComp";
const XSL_FILES =
  [ "MyeBayBuying.xsl", "MyeBaySelling.xsl", "Feedback.xsl", "Item.xsl",
    "MyMessages.xsl" ];
const MY_EBAY_FILE_NAMES =
  [ "MyeBayBuying", "MyeBaySelling", "Feedback", "Item", "MyMessages" ];
const EBAY_HOST_FOR_PASSWORD_MANAGER = "eBay.companion";
const CONSTANTS_FILE = "chrome://ebaycompanion/content/constants.js";
const UTILSERVICE_FILE = "chrome://ebaycompanion/content/utilService.js";

/**
 * eBay User Service. Provides the functionality to perform operations
 * on users.
 * @author Raymond Lee, Jorge Villalobos Glaxstar Corp.
 */
var EbayUserService = {
  /* logging service */
  _logService : null,
  /* directory service. */
  _dirService : null,
  /* URL handler. */
  _fileURLHandler : null,
  /* Autotrader datasource service. */
  _dsService : null,
  /* Observer */
  _observer : null,
  /* User session */
  _userSession : null,
  /* points to the install location of the extension. */
  _installLocation : null,
  /* XSL templates that transform eBayXML -> RDF. */
  _rdfTransformers : [null, null],
  /* login service available in Firefox 3 */
  _loginManagerService : null,
  /* password manager service, precursor to login service above */
  _passwordManagerService : null,
  /* preferences service */
  _prefsService : null,
  /* server access service */
  _serverAccessService : null,
  /* account guard service */
  _accountGuardService : null,
  /* server number. */
  _ebayServer : 0,

  /**
   * Initialize the component.
   */
  init : function() {
    var timer = CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
    var that = this;

    //dump("AccessEntry.init().\n");
    
    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._observer =
      CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
    this._installLocation =
      CC["@mozilla.org/extensions/manager;1"].
        getService(CI.nsIExtensionManager).getInstallLocation(EBAYCOMP_UUID);
    this._dirService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    this._fileURLHandler =
      CC["@mozilla.org/network/protocol;1?name=file"].
        getService(CI.nsIFileProtocolHandler);
    this._prefsService =
      CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);

    // Avoid cycles in initialisation.
    // This would otherwise break debug builds.
    timer.initWithCallback({
      notify : function() {
        that._dsService =
          CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
            getService(CI.gsIAutotraderDatasourceService);
        that._accountGuardService =
          CC["@glaxstar.org/autotrader/account-guard-service;1"].
            getService(CI.gsIAccountGuardService);
      }
    }, 0, CI.nsITimer.TYPE_ONE_SHOT);

    try {
      this._serverAccessService =
        CC["@glaxstar.org/autotrader/ebay-access-service;1"].
          getService(CI.gsIEbayAccessService);
    }
    catch (e) {
      // this will happen if the binary components are not working
      var promptService =
        CC["@mozilla.org/embedcomp/prompt-service;1"].
          getService(CI.nsIPromptService);
      var dialogTitle = "ERROR: Firefox Companion for eBay";
      var buttonPressed;

      buttonPressed =
        promptService.
          confirmEx(null, dialogTitle,
            "The Companion is unable to access the binary components that " +
            "allow it to connect to the eBay servers.  This usually " +
            "happens when running a 64-bit version of Firefox, which we " +
            "unfortunately do not currently support.\n\n" +
            "To use the Companion, please install a 32-bit build of " +
            "Firefox, such as the official Mozilla release.\n\n" +
            "NOTE: This problem is also known to be caused on Ubuntu " +
            "systems by a missing file.  Would you like to see " +
            "instructions for fixing the Ubuntu problem?",
            promptService.STD_YES_NO_BUTTONS, null, null, null, null, {});

      if (buttonPressed == 0) {
        promptService.
          confirmEx(null, dialogTitle,
            "The Debian package for Firefox, which is used by Ubuntu, " +
            "is missing an important symlink.  To restore it, follow " +
            "these steps:\n\n" +
            "Close Firefox and open a terminal window " +
            "(Applications->Accessories->Terminal) " +
            "and type the following commands:\n\n" +
            "cd /usr/lib\n" +
            "sudo ln -s libnspr4.so.0d libnspr4.so\n" +
            "cd ~/.mozilla/firefox/*.default\n" +
            "rm xpti.dat compreg.dat\n\n" +
            "Now start Firefox again, and the Companion should be OK.",
            promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_OK,
            null, null, null, null, {});
      }
    }

    // Firefox 2 and 3 use different services for storing passwords.
    {
      var loginManagerClass = CC["@mozilla.org/login-manager;1"];
      var passwordManagerClass = CC["@mozilla.org/passwordmanager;1"];

      if (loginManagerClass) {
        // Firefox 3
        this._loginManagerService =
          loginManagerClass.getService(CI.nsILoginManager);
      } else {
        //Firefox 2
        this._passwordManagerService =
          passwordManagerClass.getService(CI.nsIPasswordManager);
      }
    }

    this._loadXSLStylesheets();

    Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
      getService(Components.interfaces.mozIJSSubScriptLoader).
        loadSubScript(CONSTANTS_FILE);
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
      getService(Components.interfaces.mozIJSSubScriptLoader).
        loadSubScript(UTILSERVICE_FILE);

    this._ebayServer =
      this._prefsService.getIntPref(EBAYCOM_PREF_BRANCH + "server");
    // register necessary observers.
    this._observer.addObserver(this, "quit-application-granted", false);
  },

  /**
   * Uninitialises the component.
   */
  uninit : function() {
    this._observer.removeObserver(this, "quit-application-granted");
    // Unload RDF transformers, which hold references to the XSL documents.
    this._rdfTransformers = null;
  },

  /**
   * Loads the XSL stylesheets needed to convert the XML responses into RDF
   * documents.
   */
  _loadXSLStylesheets : function() {
    this._logService.trace("Begin: EbayUserService._loadXSLStylesheets");

    var domParser =
      CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);
    var fileStream =
      CC["@mozilla.org/network/file-input-stream;1"].
        createInstance(CI.nsIFileInputStream);
    var xslFile;
    var xslDocument;

    for (var i = 0, m = XSL_FILES.length; i < m; i++) {
      fileStream =
        CC["@mozilla.org/network/file-input-stream;1"].
          createInstance(CI.nsIFileInputStream);
      // instantiate the RDF transformer.
      this._rdfTransformers[i] =
        CC["@mozilla.org/document-transformer;1?type=xslt"].
          createInstance(CI.nsIXSLTProcessor);
      // open the XSL file.
      try {
        xslFile = this._installLocation.getItemLocation(EBAYCOMP_UUID);
        xslFile.append("defaults");
        xslFile.append(XSL_FILES[i]);
        fileStream.init(xslFile, -1, 0x01, 0444);
      } catch(e) {
        this._logService.fatal(
          "An error occurred trying to open the XSL file: " + XSL_FILES[i] +
          ".\n[" + e.name + "] " +  e.message);
      }
      // parse the XSL file and load it as a stylesheet.
      try {
        xslDocument =
          domParser.parseFromStream(
            fileStream, null, fileStream.available(), "text/xml");
        this._rdfTransformers[i].importStylesheet(xslDocument);
      } catch(e) {
        this._logService.fatal(
          "An error occurred trying to import the XSL stylesheet: " +
          XSL_FILES[i]+ ".\n[" + e.name + "] " + e.message);
      }
    }
  },

  /**
   * Determines if the server returns an erorr in the response document.
   * @param aDocument the response document.
   * @return true if the response is valid, false if there was an error.
   * http://developer.ebay.com/DevZone/XML/docs/Support/ErrorMessages.htm
   */
  _isValidResponse : function(aDocument) {
    this._logService.trace("Begin: EbayUserService._loadXSLStylesheets");

    var isValid = false;

    try {
      var errorNodes =
        aDocument.documentElement.getElementsByTagName("Errors");

      if (errorNodes.length == 0) {
        isValid = true;
      } else {
        var nodes = errorNodes[0].getElementsByTagName("SeverityCode");

        if (nodes.length != 0) {
          // error - the request was not processed successfully.
          // warning - the request was processed successfully, but
          //   something occurred that may affect the user.
          // special case (request timeout) - error code = 21359,
          //  return severityCode = 1
          // Just deal with the error here.
          var regExp = /(Error|1)/i;

          severityCode = nodes[0].firstChild.nodeValue;
          if (!regExp.test(severityCode)) {
            isValid = true;
          }
        }
        // convert the error from DOM to string.
        var xmlSerializer =
          CC["@mozilla.org/xmlextras/xmlserializer;1"].
            getService(CI.nsIDOMSerializer);
        var errorString = xmlSerializer.serializeToString(errorNodes[0]);

        this._logService.warn(
          "An error was returned from the server.\n" + errorString);
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to check the response document.\n[" +
          e.name + "] " + e.message);
    }

    return isValid;
  },

  /**
   * Returns the user session
   */
  get userSession() {
    return this._userSession;
  },

  /**
   * Determines if there is a user currently logged in the system
   * @return Whether there is a user logged in
   */
  isUserLoggedIn : function() {
    this._logService.trace("Begin: EbayUserService.isUserLoggedIn");

    return (this.userSession != null);
  },

  /**
   * Tries to log user in if the user token exists in the password
   * manager
   * @return Whether the user is logged in or not
   */
  autoLogin : function() {
    this._logService.info("Begin: EbayUserService.autoLogin");
    // get the token from the password manager
    var tokenContainer =
      this._getTokenFromPasswordManager();

    if (tokenContainer) {
      var tokenArray =  tokenContainer.tokenString.split("&");
      if(tokenArray.length >= 3) {
        var dateObject =
          EBayCompUtilService.dateFromISOTimestamp(tokenArray[1]);
        if (dateObject) {
          var currDateObject = new Date();
          // get the time difference
          var timeDiffObject = EBayCompUtilService.timeDifference(
          currDateObject.getTime(), dateObject.getTime())
          if (EBAYCOMP_DAYS_BEOFRE_TOKEN_EXPIRE >= timeDiffObject.days) {
            this._removeTokenFromPasswordManager();
            this._accountGuardService.removePassword(0);
            this._observer.notifyObservers(
              null, "ebayComp-token", "token-expired");
          } else {
            this._userSession = {
              username : tokenContainer.username,
              authToken : tokenArray[0],
              expirationTime : tokenArray[1],
              siteId : tokenArray[2]
            }
            // notify all windows
            this._observer.notifyObservers(
              null, "ebayComp-login-status", "logged-in-auto");
            return true;
          }
        }
      }
    }

    return false;
  },

  /**
   * Logs user in. Obtains user token for subsequence API calls.
   * @param username The eBay username.
   * @param secretId The secret id from the auth & auth accept page
   * @param siteId The site id representing the ebay site.
   */
  login : function(username, secretId, siteId) {
    var that = this;
    var callback;

    this._logService.info("Begin: EbayUserService.login");

    // callback object that is called when _fetchUserToken returns
    callback = {
      onload : function() {
        that._observer.
          notifyObservers(null, "ebayComp-login-status", "logged-in-manual");
      },
      onerror : function() {
        that._observer.
          notifyObservers(null, "ebayComp-token", "request-token-failed");
      }
    };

    this._fetchUserToken(username, secretId, siteId, callback);
  },

  /**
   * Logs user out. Clear all the user related data.
   */
  logout : function() {
    this._logService.info("Begin: EbayUserService.logout");
    this._userSession = null;
    this._removeTokenFromPasswordManager();
    this._observer.notifyObservers(null, "ebayComp-login-status", "logged-out");
  },

  /**
   * Gets the user Auth & Auth token using the API.
   * @param username The eBay username.
   * @param secretId The secret id from the
   *  auth & auth accept page
   * @param siteId The site id representing the
   *  ebay site.
   * @param aCallback optional callback object
   */
  _fetchUserToken : function(username, secretId, siteId, aCallback) {
    this._logService.trace("Begin: EbayUserService._fetchUserToken");

    var callback = {
      onload : function(xmlDocument) {
        EbayUserService._logService.
          trace("EbayUserService._fetchUserToken - onload callback");

        if (EbayUserService._isValidResponse(xmlDocument)) {
          EbayUserService.
            _fetchUserTokenCallback(username, siteId, xmlDocument, aCallback);
        } else {
          EbayUserService._logService.
            error("EbayUserService._fetchUserToken onload: Error response\n");
          if (aCallback) {
            aCallback.onerror(0);
          }
        }
      },
      onerror : function(errorCode) {
        EbayUserService._logService.
          error("EbayUserService._fetchUserToken onError: " +
                errorCode + "\n");
        if (aCallback) {
          aCallback.onerror(errorCode);
        }
      }
    }

    try {
      this._serverAccessService.
        getUserToken(username, secretId, siteId, callback);
    } catch (e) {
      this._logService.
        fatal("An error occurred trying to send the request.\n[" +
              e.name + "] " + e.message);
    }
  },

  /**
   * Processes fetch user token response.
   * @param username The eBay username.
   * @param siteId The site id representing the
   *  ebay site.
   * @param xmlDocument The returned XML document.
   * @param aCallback optional callback object
   */
  _fetchUserTokenCallback : function(username, siteId, xmlDocument, aCallback) {
    this._logService.trace("Begin: EbayUserService._fetchUserTokenCallback");

    var doc = xmlDocument;
    var userTokenNode =
      doc.documentElement.getElementsByTagName("eBayAuthToken");
    var token = userTokenNode[0].firstChild.nodeValue;
    var expireTime =
      doc.documentElement.getElementsByTagName("HardExpirationTime")[0].
        firstChild.nodeValue;

    var that = this;
    var callback;

    this._userSession = {
      username : username,
      authToken : token,
      expirationTime : expireTime,
      siteId : siteId
    }

    // callback object to be executed when the updateSiteID call finishes
    callback = {
      onload : function() {
        //prompt observer to store the user token.
        that._observer.
          notifyObservers(null, "ebayComp-token", "request-to-store");

        // call the callback object that we were provided with
        if (aCallback) {
          aCallback.onload(0);
        }
      },
      onerror : function() {}
    }

    // update the site (country) ID that the user's registered with
    this.updateSiteID(callback);
  },

  /**
   * Obtains and stores the site ID from the user's eBay account.
   * @param aCallback optional callback object
   */
  updateSiteID : function(aCallback) {
    var that = this;

    this._logService.debug("Begin: EbayUserService.updateSiteID.");

    // The user must be logged in or this is meaningless.
    if (this.isUserLoggedIn()) {
      var callback = {
        onload : function(xmlDocument) {
          that._logService.
            trace("EbayUserService.updateSiteID - onload callback");

          if (that._isValidResponse(xmlDocument)) {
            that._updateSiteIdCallback(xmlDocument, aCallback);
          } else {
            that._logService.
              error("EbayUserService.updateSiteID - onload: Error response\n");
            if (aCallback) {
              aCallback.onerror(0);
            }
          }
        },
        onerror : function(errorCode) {
          that._logService.
            error("EbayUserService.updateSiteID - onError: " +
                  errorCode + "\n");
          if (aCallback) {
            aCallback.onerror(errorCode);
          }
        }
      };

      try {
        this._serverAccessService.
          getUser(this.userSession.authToken, this.userSession.siteId,
                  null, callback);
      } catch (e) {
        this._logService.
          error("An error occurred trying to get User details " +
                ". [" + e.name + "] " + e.message);
      }
    } else {
      // the user is not logged in
      this._logService.
        error("A call to the server was attempted " +
              "and the user is not logged in.");
    }
  },

  /**
   * Processes the GetUser API response called from getUserSiteID.
   * @param aXMLDocument The returned XML document.
   * @param aCallback optional callback object
   */
  _updateSiteIdCallback : function(aXMLDocument, aCallback) {
    this._logService.trace("Begin: EbayUserService._updateSiteIdCallback.");

    // simple way to extract the site type code.
    var prefName, userNode, userNodes, siteNodes, siteNode, site;
    var firstAuthRun = false;
    userNodes = aXMLDocument.getElementsByTagName("User");

    if (userNodes.length > 0) {
      userNode = userNodes[0];
      siteNodes = userNode.getElementsByTagName("Site");

      if (siteNodes.length > 0) {
        var serverURLs = EBayCompUtilService.getServerURLs();
        var siteId;

        siteNode = siteNodes[0];
        site = siteNode.textContent;
        for (var name in serverURLs) {
          if (site == serverURLs[name]["siteCodeType"]) {
            siteId = serverURLs[name]["siteId"];
            break;
          }
        }

        // change the site id
        if (siteId) {
          this._userSession.siteId = siteId;
        }
      }
    }

    // call the callback object that we were provided with
    if (aCallback) {
      aCallback.onload(0);
    }
  },

  /**
   * Obtains user information from MyEbay.
   * @param aRequestType the type of request that was executed. Can be any of
   * the REQUEST_TYPE constants defined on this interface.
   */
  getMyEBay : function(aRequestType) {
    this._logService.debug(
      "Begin: EbayUserService.getMyEBay. Request type: " + aRequestType);
    this._getMyEBay(aRequestType, null);
  },

  /**
   * Obtains information on an item from MyEbay.
   * @param aItemId the id of the item to obtain.
   */
  getItem : function(aItemId) {
    this._logService.debug(
      "Begin: EbayUserService.getItem. Item ID: " + aItemId);
    this._getMyEBay(CI.gsIEbayUserService.REQUEST_TYPE_ITEM, aItemId);
  },

  /**
   * Obtains information from MyEbay through a server call.
   * @param aRequestType the type of request that was executed. Can be any of
   * the REQUEST_TYPE constants defined on this interface.
   * @param aItemId the id of the item to obtain. Only required when making a
   * getItem call.
   */
  _getMyEBay : function(aRequestType, aItemId) {
    this._logService.trace(
      "Begin: EbayUserService._getMyEBay. Request type: " + aRequestType);

    if (!this.isUserLoggedIn()) {
      this._logService.error(
        "A call to the server was attempted and the user is not logged in.");
      return;
    }

    // getMyEBay callback.
    var callback = {
      onload : function(xmlDocument) {
        EbayUserService._logService.trace(
          "EbayUserService.getMyEBay - onload callback");
        if (EbayUserService._isValidResponse(xmlDocument)) {
          EbayUserService._getMyEbayCallback(
            aRequestType, xmlDocument, aItemId);
        } else {
          EbayUserService._logService.error(
            "EbayUserService.getMyEBay onload: Error response\n");
          EbayUserService._observer.notifyObservers(
            null, "ebayComp-getMyEBay-failed", String(aRequestType));
        }
      },
      onerror : function(errorCode) {
        EbayUserService._logService.error(
          "EbayUserService.getMyEBay onError: " + errorCode + "\n");
        // notify all observers.
        EbayUserService._observer.notifyObservers(
          null, "ebayComp-getMyEBay-failed", String(aRequestType));
      }
    };

    try {
      switch (aRequestType) {
        case CI.gsIEbayUserService.REQUEST_TYPE_BUYING_LIST:
          // notify all observers.
          this._observer.notifyObservers(
            null, "ebayComp-lists-start-updating",
            CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_BUYING);
          this._serverAccessService.getMyEBayBuying(
            this.userSession.authToken, this.userSession.siteId, callback);
          break;
        case CI.gsIEbayUserService.REQUEST_TYPE_SELLING_LIST:
          // notify all observers.
          this._observer.notifyObservers(
            null, "ebayComp-lists-start-updating",
            CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_SELLING);
          this._serverAccessService.getMyEBaySelling(
            this.userSession.authToken, this.userSession.siteId, callback);
          break;
        case CI.gsIEbayUserService.REQUEST_TYPE_FEEDBACK:
          // notify all observers.
          this._observer.notifyObservers(
            null, "ebayComp-lists-start-updating",
            CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_FEEDBACK);
          this._serverAccessService.getFeedback(
            this.userSession.authToken, this.userSession.siteId, callback);
          break;
        case CI.gsIEbayUserService.REQUEST_TYPE_ITEM:
          this._serverAccessService.getItem(
            this.userSession.authToken, this.userSession.siteId, aItemId,
            callback);
          break;
        case CI.gsIEbayUserService.REQUEST_TYPE_MESSAGE_LIST:
          // notify all observers.
          this._observer.notifyObservers(
            null, "ebayComp-lists-start-updating",
            CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_MESSAGES);
          this._serverAccessService.getMyMessages(
            this.userSession.authToken, this.userSession.siteId, callback);
          break;
      }
    } catch (e) {
      this._logService.error(
        "An error occurred trying to send the request. Request type: " +
        aRequestType + ".\n[" + e.name + "] " + e.message);
    }
  },

  /**
   * Processes the MyEBay response.
   * @param aRequestType the type of request that was executed. Can be any of
   * the REQUEST_TYPE constants defined on this interface.
   * @param aXMLDocument The returned XML document.
   * @param aItemId the id of the item to obtain. Only required when making a
   * getItem call.
   */
  _getMyEbayCallback : function(aRequestType, aXMLDocument, aItemId) {
    this._logService.trace(
      "Begin: EbayUserService._getMyEbayCallback. Request type: " +
      aRequestType);

    var rdfDocument;
    var rdfFile;

    // XXX: the following block is for debugging purposes only.
    // var xmlFile = this._dirService.get("ProfD", CI.nsIFile);
    //
    // xmlFile.append(EBAYCOMP_FOLDER);
    // xmlFile.append(aRequestType + (aItemId ? "_" + aItemId : "") + "_.xml");
    // this._writeXMLDocumentToFile(aXMLDocument, xmlFile);
    // XXX: end debug block.

    // generate the path for the RDF file.
    rdfFile = this._dirService.get("ProfD", CI.nsIFile);
    rdfFile.append(EBAYCOMP_FOLDER);
    rdfFile.append(
      MY_EBAY_FILE_NAMES[aRequestType] + (aItemId ? "_" + aItemId : "") +
      ".rdf");
    // convert the XML document into an RDF document.
    this._logService.debug("Transforming XML to RDF");
    rdfDocument =
      this._rdfTransformers[aRequestType].transformToDocument(aXMLDocument);
    // save the RDF document to a file.
    this._writeXMLDocumentToFile(rdfDocument, rdfFile);
    // update de datasource with the URL of the saved file.
    this._logService.debug("Loading RDF into datasource.");

    switch (aRequestType) {
      case CI.gsIEbayUserService.REQUEST_TYPE_BUYING_LIST:
        this._dsService.updateMyeBayBuying(
          this._fileURLHandler.getURLSpecFromFile(rdfFile));
        // notify all observers.
        this._observer.notifyObservers(
          null, "ebayComp-lists-updated",
          CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_BUYING);
        break;
      case CI.gsIEbayUserService.REQUEST_TYPE_SELLING_LIST:
        this._dsService.updateMyeBaySelling(
          this._fileURLHandler.getURLSpecFromFile(rdfFile));
        // notify all observers.
        this._observer.notifyObservers(
          null, "ebayComp-lists-updated",
          CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_SELLING);
        break;
      case CI.gsIEbayUserService.REQUEST_TYPE_FEEDBACK:
        this._dsService.updateFeedback(
          this._fileURLHandler.getURLSpecFromFile(rdfFile));
        // notify all observers.
        this._observer.notifyObservers(
          null, "ebayComp-lists-updated",
          CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_FEEDBACK);
        break;
      case CI.gsIEbayUserService.REQUEST_TYPE_ITEM:
        this._dsService.updateItem(
          aItemId, this._fileURLHandler.getURLSpecFromFile(rdfFile));
        // notify all observers.
        this._observer.notifyObservers(null, "ebayComp-item-updated", aItemId);
        break;
      case CI.gsIEbayUserService.REQUEST_TYPE_MESSAGE_LIST:
        this._dsService.updateMyMessages(
          this._fileURLHandler.getURLSpecFromFile(rdfFile));
        // notify all observers.
        this._observer.notifyObservers(
          null, "ebayComp-lists-updated",
          CI.gsIAutotraderDSUpdateService.UPDATE_TYPE_MESSAGES);
        break;
    }

    if (rdfFile.exists()) {
      // remove the temporary file.
      rdfFile.remove(false);
    } else {
      this._logService.error(
        "The file that was going to be deleted no longer exists! File: " +
        rdfFile.path);
    }
  },

  /**
   * Adds an item to the watchlist.
   * @param aItemId the id of the item to add to the watch list.
   * @param aCallback callback object to call when request returns
   */
  addItemToWatchlist : function(aItemId, aCallback) {
    this._logService.debug(
      "Begin: EbayUserService.addItemToWatchlist. Item id: " + aItemId);

    try {
      var that = this;

      if (!this.isUserLoggedIn()) {
        this._logService.error(
          "A call to the server was attempted and the user is not logged in.");
        return;
      }

      var callback = {
        onload : function(xmlDocument) {
          if (EbayUserService._isValidResponse(xmlDocument) &&
              xmlDocument.getElementsByTagName("Errors").length == 0) {
            that._observer.
              notifyObservers(null, "ebayComp-addToWatchList-success",
                              String(aItemId));
            aCallback.onload(0);
          } else {
            that._observer.
              notifyObservers(null, "ebayComp-addToWatchList-failed",
                              String(aItemId));
            aCallback.onerror(0);
          }
        },
        onerror : function(errorCode) {
          aCallback.onerror(errorCode);
        }
      };

      this._serverAccessService.
        addItemToWatchlist(this.userSession.authToken, this.userSession.siteId,
                           aItemId, callback);
    } catch (e) {
      this._logService.error(
        "An error occurred trying to add an item to the watch list. " +
        "Item id: " + aItemId + ". [" + e.name + "] " + e.message);
    }
  },

  /**
   * Removes the item with the given id from the watch list.
   * @param aItemId the id of the item to remove from the watch list.
   * @param aCallback callback object to call when request returns
   */
  stopWatchingItem : function(aItemId, aCallback) {
    this._logService.debug(
      "Begin: EbayUserService.stopWatchingItem. Item id: " + aItemId);

    try {
      var that = this;

      if (!this.isUserLoggedIn()) {
        this._logService.error(
          "A call to the server was attempted and the user is not logged in.");
        return;
      }

      var callback = {
        onload : function(xmlDocument) {
          if (EbayUserService._isValidResponse(xmlDocument) &&
              xmlDocument.getElementsByTagName("Errors").length == 0) {
            const ITEM_TYPE_WATCH =
              CI.gsIAutotraderDatasourceService.ITEM_TYPE_WATCH;

            that._observer.
              notifyObservers(null, "ebayComp-stopWatchingItem-success",
                              String(aItemId));
            // Remove the item from the display list.
            that._dsService.removeItemFromDisplayList(aItemId, ITEM_TYPE_WATCH);
            aCallback.onload(0);
          } else {
            that._observer.
              notifyObservers(null, "ebayComp-stopWatchingItem-failed",
                              String(aItemId));
            aCallback.onerror(0);
          }
        },
        onerror : function(errorCode) {
          that._observer.
            notifyObservers(null, "ebayComp-stopWatchingItem-failed",
                            String(aItemId));
          aCallback.onerror(errorCode);
        }
      };

      this._serverAccessService.
        stopWatchingItem(this.userSession.authToken, this.userSession.siteId,
                         aItemId, callback);
    } catch (e) {
      this._logService.error(
        "An error occurred trying to stop watching the item. Item id: " +
        aItemId + ".\n[" + e.name + "] " + e.message);
    }
  },

  /**
   * Gets the url of the auth & auth page.
   * @param aArea the area which the request comes from.
   * @return authURL of the auth & auth page.
   */
  getAuthPage : function(aArea) {
    this._logService.trace("Begin: EBayUserService.getAuthPage");

    var windowMediator =
      CC["@mozilla.org/appshell/window-mediator;1"].
            getService(CI.nsIWindowMediator);
    var windowEnumerator = windowMediator.getEnumerator("navigator:browser");
    var firstWindow = windowEnumerator.getNext();

    var authURL;
    var params
    var siteId = firstWindow.EBayCompUtilService.getSiteId();
    // get a random 32 chars string
    var sid = EBayCompUtilService.generateRandomId();
    params =
      ("&runame=" +
        EBAYCOMP_RUNAMES[this._ebayServer][(siteId == "0" ? 1 : 0)]);

    params += ("&sid=" + sid);
    params += ("&ruparams=" +  encodeURIComponent("mysid=" + sid));
    params += encodeURIComponent("&mysiteid=" + siteId);
    // encoding the string is required for rover link to work.
    authURL = firstWindow.EBayCompUtilService.getEbayURL(
      aArea, EBAYCOMP_URL_NAME_AUTH, params);

    return authURL;
  },

  /**
   * Writes an XML document into a file.
   * @param aXMLDocument the XML document.
   * @param aFile the file the XML will be saved to.
   */
  _writeXMLDocumentToFile : function(aXMLDocument, aFile) {
    this._logService.trace("Begin: EbayUserService._writeXMLDocumentToFile");

    var xmlSerializer =
      CC["@mozilla.org/xmlextras/xmlserializer;1"].
        getService(CI.nsIDOMSerializer);
    var outputStream =
      CC["@mozilla.org/network/file-output-stream;1"].
        createInstance(CI.nsIFileOutputStream);
    // write to the file.
    outputStream.init(aFile, 0x04 | 0x08 | 0x20, 0664, 0);
    xmlSerializer.serializeToStream(aXMLDocument, outputStream, "utf-8");
    outputStream.close();
  },

  /**
   * Stores the user token.  This should only be called after user
   * is logged in.
   */
  storeUserToken : function() {
    this._logService.trace("Begin: EbayUserService.storeUserToken");

    if (this.isUserLoggedIn()) {
      // ensure there is no entry in the password manager.
      this._removeTokenFromPasswordManager();
      // append the expiration time and site id to the end
      // of token.
      var password = this.userSession.authToken + "&" +
        this.userSession.expirationTime + "&" +
        this.userSession.siteId;
      this._storeTokenToPasswordManager(this.userSession.username,
        password);
    }
  },

  /**
   * Removes user token.
   */
  removeUserToken : function() {
    this._logService.trace("Begin: EbayUserService.removeUserToken");

    this._removeTokenFromPasswordManager();
  },

  /**
   * Stores username and password to the password manager
   * @param aUsername the username will be saved.
   * @param aPassword the password will be saved.
   */
  _storeTokenToPasswordManager : function(aUsername, aPassword) {
    this._logService.
      trace("Begin: EbayUserService._storeTokenToPasswordManager");

    if (this._loginManagerService) {
      // Firefox 3
      const hostName = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const formSubmitURL = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const httpRealm = null;
      var login = CC["@mozilla.org/login-manager/loginInfo;1"].
                    createInstance(CI.nsILoginInfo);

      login.init(hostName, formSubmitURL, httpRealm, aUsername, aPassword,
                 "", "");
      this._loginManagerService.addLogin(login);
    } else {
      // Firefox 2
      this._passwordManagerService.
        addUser(EBAY_HOST_FOR_PASSWORD_MANAGER, aUsername, aPassword);
    }
  },

  /**
   * Removes the token from the password manager
   */
  _removeTokenFromPasswordManager : function() {
    this._logService.trace(
      "Begin: EbayUserService._removeTokenFromPasswordManager");

    if (this._loginManagerService) {
      // Firefox 3
      const hostName = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const formSubmitURL = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const httpRealm = null;
      var logins;

      logins = this._loginManagerService.
                 findLogins({}, hostName, formSubmitURL, httpRealm);

      if (logins && logins[0]) {
        this._loginManagerService.removeLogin(logins[0]);
      }
    } else {
      // Firefox 2
      var passwords = this._passwordManagerService.enumerator;

      while (passwords.hasMoreElements()) {
        var pass = passwords.getNext().
                     QueryInterface(Components.interfaces.nsIPassword);

        if (pass.host == EBAY_HOST_FOR_PASSWORD_MANAGER) {
          this._passwordManagerService.
            removeUser(EBAY_HOST_FOR_PASSWORD_MANAGER, pass.user);
        }
      }
    }
  },

  /**
   * Gets the token for the last logged in user from
   * in the password manager.
   * @return the entry if found.
   */
  _getTokenFromPasswordManager : function() {
    this._logService.trace(
      "Begin: EbayUserService._getTokenFromPasswordManager");

    var tokenContainer = {
      username: null,
      tokenString: null
    };
    var ret;

    if (this._loginManagerService) {
      // Firefox 3
      const hostName = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const formSubmitURL = EBAY_HOST_FOR_PASSWORD_MANAGER;
      const httpRealm = null;
      var logins;

      logins = this._loginManagerService.
                 findLogins({}, hostName, formSubmitURL, httpRealm);

      if (logins && logins[0]) {
        tokenContainer.username = logins[0].username;
        tokenContainer.tokenString = logins[0].password;
        ret = tokenContainer;
      }
    } else {
      // Firefox 2
      var passwords = this._passwordManagerService.enumerator;

      while (!ret && passwords.hasMoreElements()) {
        var entry = passwords.getNext().
          QueryInterface(Components.interfaces.nsIPassword);

        if (entry.host == EBAY_HOST_FOR_PASSWORD_MANAGER) {
          tokenContainer.username = entry.user;
          tokenContainer.tokenString = entry.password;
          ret = tokenContainer;
        }
      }
    }

    return ret;
  },

  /**
   * Remove any necessary data from user's pc.  This should only be called when
   * user uninstalls this extension.
   */
  cleanup : function() {
    this._removeTokenFromPasswordManager();
    this._accountGuardService.removePassword(2);
  },

  /**
   * Observes any ebay topics changes.
   * @param aSubject the object that experienced the change.
   * @param aTopic the topic being observed.
   * @param aData the data relating to the change.
   */
  observe : function(aSubject, aTopic, aData) {
    this._logService.debug("Begin: EbayUserService.observe. Topic: " + aTopic);
  
    if (aTopic == "quit-application-granted") {
      EbayUserService.uninit();
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIEbayUserService) &&
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
var EbayUserServiceFactory = {
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
      this._singletonObj = EbayUserService;
      EbayUserService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayUserServiceModule = {
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
      return EbayUserServiceFactory;
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
  return EbayUserServiceModule;
}
