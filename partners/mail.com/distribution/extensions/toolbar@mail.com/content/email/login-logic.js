/**
 * See email-logic.js, top of file.
 * This does: LoginTokenServer and UnifedAuthenticationService/ContextService.
 *
 * We can save the loginToken (if longSession) in the profile.
 * The loginToken and the session can expire, so we may need to fall back.
 */

/**
 * Messages sent:
 * "logged-in"
 *    Means: The user successfully logged in.
 *    When: the user clicked on the "login" button,
 *       or started the browser and we have a long-session loginToken stored,
 *       or the user re-logged in after an expired session.
 *    Parameter: object
 *      account {Account}
 * "logged-out"
 *    Means: The user logged out.
 *    When: the user clicked on the "log out" button, or
 *      the session expired.
 *    Parameter: object
 *      account {Account}
 */

const EXPORTED_SYMBOLS = [ "UnitedInternetLoginAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/util/JXON.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/email/account-base.js");
var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/login.properties");

/**
 * Holds and manages login state of one UnitedInternet account
 */
function UnitedInternetLoginAccount(accountID, isNew)
{
  Account.call(this, accountID, isNew);
  if ( !isNew)
  {
    this._readFromPrefs(); // also calls _readServerConfig();
    this._loginToken = this._getStoredLoginToken();
  }
}
UnitedInternetLoginAccount.prototype =
{
   _loginToken : null, // { String } the stored credentials to log in without password
   _wantStoredLogin : false, // {Boolean} pref says "remember me"
   _isLongSession : false, // {Boolean} current login is "remember me"
  _isLoggedIn : false,
  _uasLoginTime : null, // {Date} when we logged in to UAS/ContextService
  _prefs : false, // {Preferences} prefs branch for this account. null, if not saved yet.
  _password : false, // {String} store temporarily to adhere to Account API

  /**
   * Gives some information about how to do the following server calls,
   * depending on the user account type.
   *
   * Object with properties:
   * {
   *    service.servicename = { -- servicename = "mailbox", "filestore", "addressbook" etc.
   *      url {URL as String} Service-specific base URL for server calls. 
   *          The API on that URL depends on the service.
   *      // for service "mailbox" only:
   *      interval {Integer} in seconds. How often to poll for new mails.
   *      ignoreFolderTypes {Array of String} String-IDs of folder types
   *        that should not be counted for the new mail count.
   *        Match the content of FolderQuota response <folderType>
   *        against each array element.
   *      sessionCookie {String} Cookie to set for requests.
   *    }
   *    weblogin.typename = { -- typename = "mailbox" or "iacUsecase"
   *      url {URL as String} Webpage with login, to load in main browser window.
   *        Note: You must also respect the other webmail* request specs,
   *        a normal GET on this URL will usually not work.
   *      body {String} upload body to send in request
   *      mimetype {String} Content-Type header to set in request, as upload type
   *      httpMethod {String-enum} "GET" or "POST"
   *      // for "iacUsecase" only:
   *    }
   * }
   * null, if not logged in.
   */
  loginContext : null,

  /**
   * The brand.js object for this account type and brand.
   * Contains server URLs etc..
   */
  config : null,

  /**
   * We have a session to the server.
   * Note: That's different from having a loginToken.
   */
  get isLoggedIn()
  {
    return this._isLoggedIn;
  },

  /**
   * We have a loginToken that we can probably use.
   * A LoginToken is a form of password-less credentials
   * with long or short expiry.
   * Alternatively, we have a password stored in RAM
   * that we can use.
   * @returns {Boolean}
   */
  get haveStoredLogin()
  {
    return !!this._loginToken || !!this._password;
  },

  /**
   * user says he wants to stay logged in / "remember me"
   * @returns {Boolean}
   */
  get wantStoredLogin()
  {
    return this._wantStoredLogin;
  },

  set wantStoredLogin(val)
  {
    this._wantStoredLogin = sanitize.boolean(val);
    if ( !val)
      this._removeStoredLoginToken();
    if (this._pref)
      this._pref.set("storeLogin", this._wantStoredLogin);
  },

  _verifyAccountSettings : function()
  {
    assert(this.config && this.config.type == "unitedinternet");
    sanitize.nonemptystring(this.accountID);
    sanitize.nonemptystring(this.emailAddress);
    Account.getDomainForEmailAddress(this.emailAddress); // checks
    sanitize.boolean(this._wantStoredLogin);
  },

  _readFromPrefs : function()
  {
    this._pref = ourPref.branch("account." + this.accountID + ".");
    assert(this._pref.get("type") == this.kType);
    this.emailAddress = this._pref.get("emailAddress").toLowerCase();
    this._wantStoredLogin = this._pref.get("storeLogin", this._wantStoredLogin);
    this._readServerConfig();
    this._verifyAccountSettings();
  },

  /**
   * Only to be invoked, if you created a new account.
   */
  saveToPrefs : function()
  {
    this._verifyAccountSettings();

    this._pref = ourPref.branch("account." + this.accountID + ".");
    this._pref.set("type", "unitedinternet");
    this._pref.set("provider", this.config.providerID);
    this._pref.set("emailAddress", this.emailAddress);
    this._pref.set("storeLogin", this._wantStoredLogin);

    // add to accounts list pref
    var accounts = ourPref.get("accountsList", "").split(",");
    if ( !arrayContains(accounts, this.accountID))
    {
      accounts.push(this.accountID);
      ourPref.set("accountsList", accounts.join(","));
    }
  },

  /**
   * Only for makeNewAccount() in account-list.js.
   * Needs to be called only once, because it persists.
   */
  setServerConfig : function(config)
  {
    assert(config && config.type == "unitedinternet" &&
        config.loginTokenServerURL,
        "Invalid UnitedInternet config for " + this.emailAddress);
    this.config = config;
  },

  _readServerConfig : function()
  {
    var providerID = this._pref.get("provider");
    if (providerID)
    {
      for each (let config in brand.login.configs)
      {
        if (config.providerID != providerID)
          continue;
        assert(config.type == "unitedinternet");
        this.config = config;
        break;
      }
    }
    else // migrate old accounts
    {
      var domain = Account.getDomainForEmailAddress(this.emailAddress);
      for each (let config in brand.login.configs)
      {
        if ( !arrayContains(config.domains, domain))
          continue;
        this.setServerConfig(config);
        if (this._pref) // was read from prefs
          this._pref.set("provider", this.config.providerID);
        break;
      }
    }
    assert(this.config && this.config.type == "unitedinternet" &&
        this.config.loginTokenServerURL,
        "Invalid UnitedInternet config for " + this.emailAddress);
  },

  /**
   * The account may have several email addresses, and the user
   * may have configured a secondary one. In this case,
   * this should give the primary email address *for this account*.
   *
   * Note that this is different from the primary account
   * in the toolbar configuration.
   *
   * TODO not yet implemented. For now, this is the same as |emailAddress|.
   */
  get primaryEmailAddress()
  {
    return this.emailAddress;
  },

  /**
   * Use this password for next login().
   *
   * In this implementation, wantStoredLogin does not have an effect
   * on this function, but login() will get and store a long-term logintoken.
   *
   * @param password {String}
   */
  setPassword : function(password)
  {
    this._password = sanitize.nonemptystring(password);
  },

  /**
   * @param peekMails ignored
   * @param continuously ignored, always true
   * @param notifyCallback will be called only once, even if the checks continue.
   *     TODO should be called until logout.
   *     workaround: listen to "mail-check" messages
   *     In fact, none of the current callers cares about notifyCallback, just "mail-check".
   */
  login : function(peekMails, continuously, notifyCallback, errorCallback)
  {
    var self = this;
    if (!!this._password)
    {
      let password = this._password;
      // clear stored password
      // success case: for security. We have a loginToken now.
      // error case: don't try [probably] wrong password again
      this._password = null;
      this._loginWithPassword(password, this._wantStoredLogin,
          notifyCallback, errorCallback);
    }
    else if (!!this._loginToken)
    {
      this._loginWithLoginToken(notifyCallback, errorCallback);
    }
    else
      throw new NotReached("You need to first setPassword or haveStoredLogin");
  },

  /**
   * Use this when haveStoredLogin is false (or you don't care),
   * and you want to log in with email address + password.
   * Creates and stores a login token, and logs in with that.
   * @param successCallback {Function()}
   */
  _loginWithPassword : function(password, wantStoredLogin,
      successCallback, errorCallback)
  {
    assert(!this._isLoggedIn);
    assert(password);
    var self = this;
    this._loginToken = getNewLoginToken(this.config.loginTokenServerURL,
        this.emailAddress, password, wantStoredLogin,
        function(loginToken)
    {
      self._loginToken = loginToken;
      self._isLongSession = wantStoredLogin;
      try {
        if (wantStoredLogin)
          self._storeLoginToken(self._loginToken);
      } catch (e) { errorInBackend(e); }

      self._loginWithLoginToken(successCallback, errorCallback);
    },
    function(e)
    {
      if (e.code == 403)
        e = gStringBundle.get("error.loginFailed");
      else if (e.code >= 500 && e.code < 600)
        // TODO suppress when just polling?
        e = gStringBundle.get("error.serverSide", [ e.message ]);
      errorCallback(e);
    });
  },

  /**
   * Use this when haveStoredLogin is true.
   * Allows to log in with already known credentials.
   * @param successCallback {Function()}
   */
  _loginWithLoginToken : function(successCallback, errorCallback)
  {
    assert(!this._isLoggedIn);
    assert(this._loginToken);
    var self = this;
    uasLogin(this.config.uasURL, this.config.serviceID, this._loginToken,
        function(loginContext)
    {
      self._isLoggedIn = true;
      self._uasLoginTime = new Date();
      self.loginContext = loginContext;
      successCallback();
      notifyGlobalObservers("logged-in", { account : self });
    },
    function (e)
    {
      if (e.code == 403) // loginToken expired, or was always invalid (bug)
      {
        self._clearLoginToken();
        // This is expected during startup/automatic login. with a stored
        // loginToken, which is probably simply expired. In that automatic
        // login case, the caller doesn't show the error to the user and
        // just stops login.
        // If this happens immediately after getting a new loginToken,
        // it's likely a server error. In that case, the caller shows errors
        // to the user, because there was password UI.
        // So, the error message here assumes the latter case.
        e = gStringBundle.get("error.uasFailed");
      }
      else if (e.code >= 500 && e.code < 600)
        // TODO suppress when just polling?
        e = gStringBundle.get("error.serverSide", [ e.message ]);
      errorCallback(e);
    });
  },

  _clearLoginToken : function()
  {
    this._loginToken = null;
    try {
      this._removeStoredLoginToken();
    } catch (e) { debug(e); };
  },

  /**
   * Invalidates and forgets the loginToken
   * @param successCallback {Function()}
   */
  logout : function(successCallback, errorCallback)
  {
    assert(typeof(successCallback) == "function", "need successCallback");
    assert(typeof(errorCallback) == "function", "need errorCallback");
    this._isLoggedIn = false;
    this.loginContext = null;
    var loginToken = this._loginToken;
    assert(loginToken, "have no login token which I could log out");
    this._clearLoginToken();
    var self = this;
    notifyGlobalObservers("logged-out", { account : self });
    // TODO removes and invalidates contextService session cookie?
    invalidateLoginToken(this.config.loginTokenServerURL, loginToken,
        successCallback, errorCallback);
  },

  /**
   * Called by email-logic.js when some server function was told that
   * the session expired or was invalid.
   *
   * We need change to logged-out state, and try to log in again,
   * if we still have a valid loginToken.
   *
   * A complication is that the server does not differentiate
   * between "expired" and "forbidden" and "didn't see any session" and
   * "which session?". So, it may also be a server or client bug or API change.
   * In that case, we would be very broken, e.g. normal login does not work
   * anymore or we even loop.
   * As a minimal protection, we're counting the time between login and this
   * presumed expirey. If the "expiry" happens immediately after login,
   * something else is wrong. It's of course an ugly hack, but
   * there is unfortunately very little else we can do to protect us against this.
   */
  _sessionFailed : function()
  {
    assert(this._isLoggedIn);
    this._isLoggedIn = false;
    this.loginContext = null;
    var self = this;
    notifyGlobalObservers("logged-out", { account : self });

    var timeSinceLogin = new Date() - this._uasLoginTime;
    this._uasLoginTime = null;
    const minLoginTimeToAssumeExpiry = 60 * 1000; // 1 minute
    if (timeSinceLogin < minLoginTimeToAssumeExpiry)
      // assume other login error, not expiry
      return; // prevents loops in exceptional error cases
    // assume session expired
    if (this._loginToken)
      this._loginWithLoginToken(function() {}, errorInBackend);
  },


  ////////////////////////////////////////////////
  // Login token local storage

  /**
   * Reads login token from profile (harddrive)
   * @returns {String} loginToken
   *   null/undefined, if unsuccessful
   */
  _getStoredLoginToken : function()
  {
    for each (let login in loginManager.findLogins({},
        this.hostnameForLM, this.formSubmitURLForLM, this.httpRealmForLM))
      if (login.username == this.emailAddress)
         return login.password;
    return null;
  },

  /**
   * Stored login token in profile (harddrive).
   * Do that only when it's a long session token ("remember me")
   */
  _storeLoginToken : function(loginToken)
  {
    assert(loginToken && typeof(loginToken) == "string");
    this._removeStoredLoginToken(); // loginManager can't just replace

    loginManager.addLogin(new LoginInfo(
        this.hostnameForLM, this.formSubmitURLForLM, this.httpRealmForLM,
        this.emailAddress, // username
        loginToken, // password
        "", "")); // username and password field
  },

  /**
   * Delete stored login token in profile (harddrive).
   */
  _removeStoredLoginToken : function()
  {
    for each (let login in loginManager.findLogins({},
        this.hostnameForLM, this.formSubmitURLForLM, this.httpRealmForLM))
      if (login.username == this.emailAddress)
         loginManager.removeLogin(login);
  },

  get hostnameForLM() { return this.config.loginTokenServerURL; },
  get formSubmitURLForLM() { return this.config.uasURL; },
  get httpRealmForLM() { return null; },
}
extend(UnitedInternetLoginAccount, Account);

XPCOMUtils.defineLazyServiceGetter(this, "loginManager",
    "@mozilla.org/login-manager;1", "nsILoginManager");
const LoginInfo = new Components.Constructor(
    "@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init");


// (Don't use gAccounts from here on)


////////////////////////////////////////////////
// Login token server requests

const kStandardHeaders =
    {
      "Accept" : "application/xml",
      "X-UI-App" : "Firefox-Toolbar/" + getExtensionFullVersion(),
    };

/**
 * Asks the server for a new token
 * @param loginTokenServerURL {String}
 * @param email address {String}
 * @param password {String}
 * @param longSession {Boolean}   "remember me"
 * @param successCallback {Function(loginToken)}
 */
function getNewLoginToken(loginTokenServerURL,
      emailAddress, password, longSession,
      successCallback, errorCallback)
{
  assert(loginTokenServerURL.substr(0, 6) == "https:",
      "Configuration error: Need https for loginTokenServerURL, " +
      "otherwise we'd be sending password as plaintext");
  var fetch = new FetchHTTP(
      {
        url : loginTokenServerURL + "/Logintoken",
        method : "POST",
        bodyFormArgs :
        {
          identifierUrn : "urn:identifier:mailto:" + emailAddress,
          password : password,
          durationType : longSession ? "LONG" : "SHORT",
          loginClientType : "toolbar",
        },
        headers : { Accept: "text/plain; charset=iso-8859-15" },
      },
  function(response) // success
  {
    assert(typeof(response) == "string");
    var loginToken = sanitize.string(response).replace(/[\n\r]/g, "");
    successCallback(loginToken);
  }, errorCallback);
  fetch.start();
}

/**
 * Tell server to destroy login token, so that it can't be used anymore.
 */
function invalidateLoginToken(loginTokenServerURL, loginToken,
    successCallback, errorCallback)
{
  var fetch = new FetchHTTP({
      url : loginTokenServerURL + "/Logintoken/" + loginToken,
      method : "DELETE",
  }, successCallback, errorCallback);
  fetch.start();
}

// UAS and ContextService requests

/**
 * UnifiedAuthenticationService: Takes token, returns URL to ContextService
 * as HTTP redirect, which XMLHttpRequest automatically follows.
 * ContextService then returns user-dependent variables and URLs,
 * which we store in a loginContext object and return.
 * UAS or ContextService also create a login session on the server and
 * send an HTTP cookie for it.
 *
 * @param uasURL {String}
 * @param serviceID {String}
 * @param loginToken {String}
 * @param successCallback {Function({new Object for Account.loginContext})}
 */
function uasLogin(uasURL, serviceID, loginToken,
    successCallback, errorCallback)
{
  var fetch = new FetchHTTP({
        url : uasURL,
        method : "POST",
        bodyFormArgs :
        {
          logintoken : "urn:password:toolbartoken:" + loginToken,
          serviceID : serviceID,
        },
        headers : kStandardHeaders,
  },
  function(responseDOM) // success
  {
    /* Does a HTTP redirect (which XMLHttpRequest follows) directly to the
       ContextService, which gives:
    <ToolbarContext version="1.1">
      <service name="mailbox">
        <baseURI>https://.../primaryMailbox/</baseURI>
        <ignoredFolders>SENT,DRAFTS,TRASH,SPAM,SPAM_UNKNOWN,VIRUS</ignoredFolders>
        <pollIntervalSec>300</pollIntervalSec>
      </service>
      <service name="addressbook">
        <baseURI>https://.../AddressBook/20075400</baseURI>
      </service>
      <service name="filestore">
        <baseURI>https://.../primaryEmail/</baseURI>
      </service>
      <weblogin name="mailbox">
        <loginFormParams>serviceID=hom...&amp;...@LOGIN_TOKEN@</loginFormParams>
        <loginMethod>POST</loginMethod>
        <loginURI>https://.../tokenlogin</loginURI>
      </weblogin>
      <weblogin name="iacUsecase">
        <loginFormParams>service=freemail&amp;...token=@LOGIN_TOKEN@&amp;partnerdata=@IAC_USECASE@</loginFormParams>
        <loginMethod>POST</loginMethod>
        <loginURI>https://.../login/</loginURI>
      </weblogin>
    </ToolbarContext>
    */
    assert(responseDOM && responseDOM.firstChild.nodeName == "ToolbarContext", gStringBundle.get("error.notXML"));
    //assert(response.mailServiceBaseURI, gStringBundle.get("error.badXML"));
    //debug("contextservice response:\n" + fetch._request.response.replace(/>/g, ">\n"));

    var fatalError = null;

    var loginContext = {
      service : {},
      weblogin : {},
    };
    //try {
      var response = JXON.build(responseDOM).ToolbarContext;

      for each (let weblogin in response.$weblogin)
      {
        try {
          let name = sanitize.alphanumdash(weblogin["@name"]);
          assert(name);
          loginContext.weblogin[name] = {
            url : sanitize.url(weblogin.loginURI),
            body : replaceLoginParams(
                sanitize.string(weblogin.loginFormParams), loginToken),
            mimetype : "application/x-www-form-urlencoded",
            httpMethod : sanitize.enum(weblogin.loginMethod,
                [ "GET", "POST" ], "POST"),
          };
        } catch (e) { errorInBackend(e); }
      }
      for each (let service in response.$service)
      {
        try {
          let name = sanitize.alphanumdash(service["@name"]);
          assert(name);
          loginContext.service[name] = {
            url : sanitize.url(service.baseURI),
          };

          obj = loginContext.service[name];
          if (name == "mailbox")
          {
            obj.ignoreFolderTypes = sanitize.string(service.ignoredFolders).split(",");
            obj.interval = sanitize.integer(service.pollIntervalSec);
            obj.sessionCookie = fetch.getResponseHeader("Set-Cookie"); // HACK bug 163861
          }
        } catch (e) {
          errorInBackend(e);
          /* If something fails with mailbox, it's a serious error. */
          /* We need to call the errorCallback */
          if (sanitize.alphanumdash(service["@name"]) == "mailbox")
            fatalError = e;
        }
      }
    //} catch (e) { throw new Exception(gStringBundle.get("error.notXML") + ": " + e); }
    //debugObject(loginContext, "login context");
    if (fatalError)
      errorCallback(fatalError);
    else
      successCallback(loginContext);
  }, errorCallback);
  fetch.start();
}

function replaceLoginParams(org, loginToken)
{
  return org
    .replace("@LOGIN_TOKEN@", loginToken)
    // TODO JS_ENABLED will not work with NoScript
    .replace("@JS_ENABLED@", generalPref.get("javascript.enabled"));
}
