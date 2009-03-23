/**
 *  Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{535155A7-5AFC-4635-9FBD-E5414417B916}");
const CLASS_NAME = "Autotrader Account Guard Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/account-guard-service;1";
const HashPropertyBag =
  new Components.Constructor("@mozilla.org/hash-property-bag;1",
    Components.interfaces.nsIWritablePropertyBag);
const NSArray =
  new Components.Constructor("@mozilla.org/array;1",
    Components.interfaces.nsIMutableArray);
/* Regular expression used to match the login URL. */
const AUTH_AUTH_LOGIN_URL_REGEXP =
  /^https:\/\/signin(\.sandbox)?\.ebay(\.\w{2,3}){1,2}\/ws\/eBayISAPI\.dll\?SignIn/i;
/* Regular expression used to match the intermediate URL when logging in. */
const AUTH_AUTH_INTERMEDIATE_URL_REGEXP =
  /^https:\/\/scgi(\.sandbox)?\.ebay(\.\w{2,3}){1,2}\/ws\/eBayISAPI.dll/i;
/* Regular expression used to match the acceptance URL when logging in. */
const AUTH_AUTH_ACCEPT_URL_REGEXP =
  /^https:\/\/arribada(\.sandbox)?\.ebay(\.\w{2,3}){1,2}\/aw-secure\/auth_auth_thanks\.html\?(.*)/i;
/* Regular expression used to match the cancellation URL when logging in. */
const AUTH_AUTH_CANCEL_URL_REGEXP =
  /^https:\/\/arribada(\.sandbox)?\.ebay(\.\w{2,3}){1,2}\/aw-secure\/auth_auth_cancel\.html\?(.*)/i;
/* Regular expressions used to match the verified pages */
const VERIFIED_URLS_REGEXP = [
  /^http(s)?:\/\/[^\?\/\\]*\.ebay\.(fr|de|com\.au|at|be|ca|es|com|in|ie|it|nl|pl|co\.uk|com\.sg|ch|com|com\.cn|com\.hk)\//i,
  /^http(s)?:\/\/[^\?\/\\]*\.paypal\.(com\.au|at|be|com|fr|de|it|nl|pl|es|ch|co.\uk|com)\//i];
/* The hosts used for account guard */
const ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER =
  ["eBay.companion.ebay.guard", "eBay.companion.paypal.guard"];
/* The user used for account guard */
const ACCOUNT_GUARD_USER_FOR_PASSWORD_MANAGER = "p";
const CONSTANTS_FILE = "chrome://ebaycompanion/content/constants.js";

/**
 * Account guard service.  Provides account guard functionalities.
 * @author Raymond Lee Glaxstar Corp.
 */
var AccountGuardService = {
  /* log service */
  _logService : null,
  /* login service available in Firefox 3 */
  _loginManagerService : null,
  /* password manager service, precursor to login service above */
  _passwordManagerService : null,
  /* account guard datasource service */
  _accountGuardDSService : null,
  /* user service */
  _userService : null,

  /**
   * Initialize the component.
   */
  init : function() {
    //dump("AccountGuardService.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._accountGuardDSService =
      CC["@glaxstar.org/autotrader/account-guard-datasource-service;1"].
        getService(CI.gsIAccountGuardDatasourceService);
    this._userService =
      CC["@glaxstar.org/autotrader/ebay-user-service;1"].
        getService(CI.gsIEbayUserService);

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
  },

  /**
   * Checks whether the url is in the white list or not.
   * @param aURL the url to be checked.
   * @return the number indicates whether it is the not a verified url,
   * eBay url or PayPal url.
   */
  isVerifiedURL : function(aURL) {
    this._logService.trace("Begin: AccountGuardService._isVerifiedURL");

    try {
      var result;
      for (var i = 0, m = VERIFIED_URLS_REGEXP.length; i < m; i++) {
        result = aURL.match(VERIFIED_URLS_REGEXP[i]);
        if (result != null) {
          return i;
        }
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to check whether it is a verified url.\n["+
          e.name + "] " + e.message);
    }
    return -1;
  },

  /**
   * Checks whether the url is the auth & auth login page or not.
   * @param aURL the url to be checked.
   * @return the number indicates whether it is the login, accept url
   * or cancel url
   */
  isAuthAuthURL : function(aURL) {
    this._logService.trace("Begin: AccountGuardService.isAuthAuthURL");

    try {
      var result = aURL.match(AUTH_AUTH_LOGIN_URL_REGEXP);
      if (result != null) {
        return 0;
      }
      result = aURL.match(AUTH_AUTH_INTERMEDIATE_URL_REGEXP);
      if (result != null) {
        return 1;
      }
      result = aURL.match(AUTH_AUTH_ACCEPT_URL_REGEXP);
      if (result != null) {
        return 2;
      }
      result = aURL.match(AUTH_AUTH_CANCEL_URL_REGEXP);
      if (result != null) {
        return 3;
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to check whether it is an auth & auth url.\n["+
          e.name + "] " + e.message);
    }

    return -1;
  },

  /**
   * Checks whether this url is already in the user's checked list or not.
   * If it is in the list, the form from this url should not be checked again.
   * Otherwise, carrys out a form fields check.
   * @param aURL the url to be checked.
   * @param returnValue the boolean indicating whether it is a user's checked
   * url or not.
   */
  isUserCheckedURL : function(aURL) {
    this._logService.trace("Begin: AccountGuardService.isUserCheckedURL");
    var returnValue = false;

    try {
      var processedURL = this._removeURLParams(aURL);
      if (this._accountGuardDSService.isCheckedSite(processedURL)) {
        returnValue = true;
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to check a site against the checked list.\n["+
          e.name + "] " + e.message);
    }
    return returnValue;
  },

  /**
   * Adds checked site to the checked list.
   * @param aURL the url to be added.
   */
  addCheckedURL : function(aURL) {
    this._logService.trace("Begin: AccountGuardService.addCheckedURL");
    try {
      var processedURL = this._removeURLParams(aURL);
      this._accountGuardDSService.addCheckedSite(processedURL);
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to add a site to the checked list.\n["+
          e.name + "] " + e.message);
    }
  },

  /**
   * Process the url to remove
   * @param aURL the url to be added.
   */
  _removeURLParams : function(aURL) {
    this._logService.trace("Begin: AccountGuardService._removeURLParams");
    var processedURL = aURL;

    try {
      var ioService = CC["@mozilla.org/network/io-service;1"].
        getService(CI.nsIIOService);
      var nsURI = ioService.newURI(aURL, null, null);
      // removes the username, password and port.
      var path = nsURI.path.split("?")[0];
      // removes the last char if it is a slash
      if (path.length && path.lastIndexOf("/") == (path.length - 1)) {
        path = path.substr(0, (path.length-1));
      }
      processedURL = nsURI.scheme + "://" + nsURI.host + path;
    } catch(e) {
      this._logService.fatal(
        "An error occurred trying to remove url params.\n["+
          e.name + "] " + e.message);
    }

    return processedURL;
  },

  /**
   * Gets the stored password  for particular type.
   * @param aType the type representing the password type.
   *              0 - eBay, 1 - paypal
   * @param string the password stored in the password manager.
   */
  getStoredPassword : function(aType) {
    this._logService.trace("Begin: AccountGuardService.hasStoredPassword");

    var entry;
    var password;

    if (this._loginManagerService) {
      // Firefox 3
      const hostName = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
      const formSubmitURL = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
      const httpRealm = null;
      var logins;

      logins = this._loginManagerService.
                 findLogins({}, hostName, formSubmitURL, httpRealm);

      if (logins && logins[0]) {
        password = logins[0].password;
      }
    } else {
      // Firefox 2
      var enumerator = this._passwordManagerService.enumerator;

      while (!password && enumerator.hasMoreElements()) {
        entry = enumerator.getNext().
                  QueryInterface(Components.interfaces.nsIPassword);
        if (entry.host == ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType]) {
          password = entry.password;
        }
      }
    }

    return password;
  },

  /**
   * Stores the eBay password for account guard in the password manager.
   * @param aType the type representing the password type.
   * 0 - eBay, 1 - paypal
   * @param aPassword the password to be stored.
   */
  storePassword : function(aType, aPassword) {
    this._logService.trace("Begin: AccountGuardService.storePassword");

    if (aType == 0 || aType == 1) {
      if (this._loginManagerService) {
        // Firefox 3
        const hostName = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
        const formSubmitURL = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
        const httpRealm = null;
        const username = ACCOUNT_GUARD_USER_FOR_PASSWORD_MANAGER;
        var newLogin = CC["@mozilla.org/login-manager/loginInfo;1"].
                         createInstance(CI.nsILoginInfo);
        var curLogins;

        newLogin.init(hostName, formSubmitURL, httpRealm, username, aPassword,
                      "", "");

        curLogins = this._loginManagerService.
                      findLogins({}, hostName, formSubmitURL, httpRealm);

        if (curLogins && curLogins[0]) {
          this._loginManagerService.modifyLogin(curLogins[0], newLogin);
        } else {
          this._loginManagerService.addLogin(newLogin);
        }
      } else {
        // Firefox 2
        this._passwordManagerService.
          addUser(ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType],
                  ACCOUNT_GUARD_USER_FOR_PASSWORD_MANAGER,
                  aPassword);
      }
    }
  },

  /**
   * Removes the stored password for account guard from the password manager.
   * @param aType the type representing the password type.
   * 0 - eBay, 1 - paypal, 2 - all
   */
  removePassword : function(aType) {
    this._logService.trace("Begin: AccountGuardService.removePassword");

    if (this._loginManagerService) {
      // Firefox 3
      var that = this;
      var removeSinglePassword;

      removeSinglePassword = function(aType) {
        const hostName = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
        const formSubmitURL = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
        const httpRealm = null;
        var logins;

        logins = that._loginManagerService.
                   findLogins({}, hostName, formSubmitURL, httpRealm);

        if (logins && logins[0]) {
          that._loginManagerService.removeLogin(logins[0]);
        }
      }

      if (aType == 2) {
        removeSinglePassword(0);
        removeSinglePassword(1);
      } else {
        removeSinglePassword(aType);
      }
    } else {
      // Firefox 2
      var key, password, host;
      var enumerator = this._passwordManagerService.enumerator;
      while (enumerator.hasMoreElements()) {
        password = enumerator.getNext().
                     QueryInterface(Components.interfaces.nsIPassword);
        if (aType == 0 || aType == 1) {
          host = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[aType];
          if (password.host == host) {
            this._passwordManagerService.removeUser(host, password.user);
          }
        } else {
          for (var i = 0, m = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER.length;
               i < m; i++) {
            host = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[i];
            if (password.host == host) {
              this._passwordManagerService.removeUser(host, password.user);
            }
          }
        }
      }
    }
  },

  /**
   * Gets the stored passwords for account guard.
   * @return Array of strings representing passwords
   */
  _getPasswordsFromPasswordManager : function() {
    this._logService.
      trace("Begin: AccountGuardService._getPasswordsFromPasswordManager");

    var passwords = [];

    if (this._loginManagerService) {
      // Firefox 3
      const httpRealm = null;
      var hostName;
      var formSubmitURL;
      var logins;
      var password;

      for (var i=0; i<ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER.length; i++) {
        hostName = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[i];
        formSubmitURL = hostName;

        logins = this._loginManagerService.
                   findLogins({}, hostName, formSubmitURL, httpRealm);

        if (logins && logins[0]) {
          passwords.push(logins[0].password);
        }
      }
    } else {
      // Firefox 2
      var password;
      var enumerator = this._passwordManagerService.enumerator;
      while (enumerator.hasMoreElements()) {
        password = enumerator.getNext().
          QueryInterface(Components.interfaces.nsIPassword);
        for (var i = 0, m = ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER.length;
              i < m; i++) {
          if (password.host == ACCOUNT_GUARD_HOSTS_FOR_PASSWORD_MANAGER[i]) {
            passwords.push(password.password);
          }
        }
      }
    }

    return passwords;
  },

  /**
   * Checks whether the html form contains the eBay password or not.
   * @param aFormNode the html form node.
   * @return boolean indicates whether it contains the eBay password or not.
   */
  checkAgainstForm : function(aFormNode){
    this._logService.trace("Begin: AccountGuardService.checkAgainstForm");

    try {
      var key;
      var storedPassword = this._getPasswordsFromPasswordManager();
      if (storedPassword.length > 0) {
        var password;
        var propertyBagArray = this._getInputValues(aFormNode);
        var enumerate = propertyBagArray.enumerate();
        while (enumerate.hasMoreElements()) {
          propertyBag = enumerate.getNext();
          propertyBag.QueryInterface(Components.interfaces.nsIPropertyBag);
          password = propertyBag.getProperty("value");
          // check against the stored eBay password in password manager
          for (var i = 0, m = storedPassword.length; i < m; i++) {
            if (password == storedPassword[i]) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to check password.\n[" +
          e.name + "] " + e.message);
    }

    return false;
  },

  /**
   * Extracts the text and password input elements' values from a form.
   * @param aFormNode the form node.
   * @return returnArray the array containing the input elements' values
   * in property bags.
   */
  _getInputValues : function(aFormNode) {
    this._logService.trace("Begin: AccountGuardService._getInputValues");

    var returnArray;
    try {
      returnArray = new NSArray();
      var elements = aFormNode.elements;
      var length = elements.length;
      var elementNode, inputElement;
      var isText, isPassword;
      var passwordValue, textValue;
      for (var i = 0; i < length; ++i) {
        isText = false;
        isPassword = false;
        elementNode = elements[i];
        if (elementNode && elementNode.nodeName == "INPUT") {
          inputElement = elementNode.QueryInterface(CI.nsIDOMHTMLInputElement);
          if (inputElement) {
            type = inputElement.type;
            isText = (type == "" || type == "text");
            isPassword = (type == "password")
            if (isPassword || isText) {
              elementValue = inputElement.value;
              propertyBag = new HashPropertyBag();
              propertyBag.setProperty("type", isPassword ? "password" : "text");
              propertyBag.setProperty("value", elementValue);
              returnArray.appendElement(propertyBag, false);
            }
          }
        }
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to extract input elements' values. Node: " +
          elementNode.nodeName + "\n[" + e.name + "] " + e.message);
    }
    return returnArray;
  },

  /**
   * Loads the report site url.
   * @param aURL the url to be reported.
   */
  loadReportSite : function(aURL) {
    this._logService.trace("Begin: AccountGuardService._loadReportSite");
    try {
      var windowMediator =
         Components.classes["@mozilla.org/appshell/window-mediator;1"].
           getService(Components.interfaces.nsIWindowMediator);
      var win = windowMediator.getMostRecentWindow("navigator:browser");
      if (win) {
        var reportUrl;

        // get the report phishing url.
        try {
          reportUrl = win.safebrowsing.getReportURL("Phish");
        }
        catch (e) {
          // try the Firefox 2 version
          reportUrl = win.safebrowsing.getReportPhishingURL();
        }
        reportUrl += "&url=" + encodeURIComponent(aURL);
        // ensure the alert dialog disappears before loading the page.
        win.setTimeout(function(a){ a.openUILinkIn(reportUrl, "tab"); }, 0, win);
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to load report site url.\n[" +
          e.name + "] " + e.message);
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAccountGuardService) &&
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
var AccountGuardServiceFactory = {
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
      this._singletonObj = AccountGuardService;
      AccountGuardService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var AccountGuardServiceModule = {
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
      return AccountGuardServiceFactory;
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
  return AccountGuardServiceModule;
}
