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
 *      emailAddress {String}
 *      account {Account} Object in login-logic.js representing the
 *          client-side account state.
 * "logged-out"
 *    Means: The user logged out.
 *    When: the user clicked on the "log out" button, or
 *      the session expired.
 *    Parameter: object
 *      emailAddress {String}
 *
 * Messages observed:
 * "session-failed" (sent by email-logic.js and other server calls)
 *    Parameter: emailAddress {String}, account {Account}
 *    Meaning: Our session expired or is not accepted
 *    When: A server function returned an error saying that our session (cookie)
 *      is no longer valid.
 * "uninstall" (extension.js)
 *    Meaning: User requested the application to be removed
 *    When: Extension Manager is performing the uninstall
 *    Effect: private data is removed from profile
 */

const EXPORTED_SYMBOLS = [ "getAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/login.properties");

/**
 * This module is supporting several accounts, even though the UI doesn't yet.
 * Object with
 *    properties = emailAddress { String }  // the account
 *    values = {Account}
 */
var gAccounts = {};

/**
 * Returns the |Account| object for |emailAddress|.
 * If none exists yet, creates it.
 */
function getAccount(emailAddress)
{
  assert(emailAddress);
  if (gAccounts[emailAddress])
    return gAccounts[emailAddress];
  gAccounts[emailAddress] = new Account(emailAddress);
  return gAccounts[emailAddress];
}

/**
 * Holds and manages login state of one UnitedInternet account
 */
function Account(emailAddress)
{
  assert(emailAddress);
  this.emailAddress = emailAddress;
  this._loginToken = getStoredLoginToken(this.emailAddress);
}
Account.prototype =
{
   _loginToken : null, // { String } the stored credentials to log in without password
   _isLongSession : false, // {Boolean} current login is "remember me"
   //sessionCookie : null; // from context service. But don't even need that,
          // XMLHttpRequest does cookies automatically.
  _isLoggedIn : false,
  _uasLoginTime : null, // {Date} when we logged in to UAS/ContextService

  /**
   * Gives some information about how to do the following server calls,
   * depending on the user account type.
   *
   * Object with properties:
   * {
   *    mailCheckBaseURL {String} Base URL for mail check server call
   *    mailCheckInterval {Integer} How often we may check for new mails. In seconds.
   *    mailIgnoreFolderTypes {Array of String} String-IDs of folder types that should
   *        not be counted for the new mail count. Match the content of FolderQuota
   *        response <folderType> against each array element.
   *    webmailURL {String} Webmail webpage, to load in main browser window.
   *        You must also respect the other webmail* request specs,
   *        a normal GET on this URL will usually not work.
   *    webmailHTTPMethod {String-enum} "GET" or "POST"
   *    webmailMimetype {String} Content-Type header to set in request, as upload type
   *    webmailBody {String} upload body to send in request
   * }
   * null, if not logged in.
   */
  loginContext : null,

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
   * @returns {Boolean}
   */
  get haveLoginToken()
  {
    return !!this._loginToken;
    /*
    if (this._loginToken)
      return true;
    this._loginToken = getStoredLoginToken(this.emailAddress);
    if (this._loginToken)
      return true;
    return false;
    */
  },

  get isLongSession() { return this._isLongSession; },

  /**
   * Use this when haveLoginToken is false (or you don't care),
   * and you want to log in with email address + password.
   * Creates and stores a login token, and logs in with that.
   * @param successCallback {Function()}
   */
  loginWithPassword : function(password, wantLongSession,
      successCallback, errorCallback)
  {
    assert(!this._isLoggedIn);
    assert(password);
    var self = this;
    this._loginToken = getNewLoginToken(brand.login.loginTokenServerURL,
        this.emailAddress, password, wantLongSession,
        function(loginToken)
    {
      self._loginToken = loginToken;
      self._isLongSession = wantLongSession;
      try {
        if (wantLongSession)
          storeLoginToken(self.emailAddress, self._loginToken);
      } catch (e) { errorInBackend(e); }

      self.loginWithLoginToken(successCallback, errorCallback);
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
   * Use this when haveLoginToken is true.
   * Allows to log in with already known credentials.
   * @param successCallback {Function()}
   */
  loginWithLoginToken : function(successCallback, errorCallback)
  {
    assert(!this._isLoggedIn);
    assert(this._loginToken);
    var self = this;
    uasLogin(brand.login.uasURL, this._loginToken,
        function(loginContext)
    {
      self._isLoggedIn = true;
      self._uasLoginTime = new Date();
      self.loginContext = loginContext;
      successCallback();
      notifyGlobalObservers("logged-in", {
        emailAddress : self.emailAddress,
        account : self,
      });
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
      removeStoredLoginToken(this.emailAddress);
    } catch (e) { debug(e); };
  },

  /**
   * Invalidates and forgets the loginToken
   * @param successCallback {Function()}
   */
  logout : function(successCallback, errorCallback)
  {
    this._isLoggedIn = false;
    this.loginContext = null;
    var loginToken = this._loginToken;
    assert(loginToken, "have no login token which I could log out");
    this._clearLoginToken();
    var self = this;
    notifyGlobalObservers("logged-out", { emailAddress : self.emailAddress });
    invalidateLoginToken(brand.login.loginTokenServerURL, loginToken, function ()
    {
      // TODO removes and invalidates contextService session cookie?
      successCallback();
    },
    errorCallback);
  },

  /**
   * Called when some server function was told that the session expired or
   * was invalid.
   * We need change to logged-out state and try to log in again,
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
    notifyGlobalObservers("logged-out", { emailAddress : self.emailAddress });

    var timeSinceLogin = new Date() - this._uasLoginTime;
    this._uasLoginTime = null;
    const minLoginTimeToAssumeExpiry = 60 * 1000; // 1 minute
    if (timeSinceLogin < minLoginTimeToAssumeExpiry)
      // assume other login error, not expiry
      return; // prevents loops in exceptional error cases
    // assume session expired
    if (this.haveLoginToken)
      this.loginWithLoginToken(function() {}, errorInBackend);
  },
}



var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall")
      cleanUpOnUnInstall();
    else if (msg == "session-failed")
      onMsgReceived();
  },
}
registerGlobalObserver(globalObserver);

function onMsgReceived(msg, obj)
{
  assert(obj.emailAddress);
  assert(obj.account);
  assert(obj.account == gAccounts[obj.emailAddress]);
  obj.account._sessionFailed();
}

/**
* Clean up sensitive data on uninstall.
* Cleans: stored login tokens
*/
function cleanUpOnUnInstall()
{
  for (address in gAccounts)
  {
    removeStoredLogintoken(address);
    var acc = gAccounts[address];
    acc.logout(function(){}, function(){});
  }
}


// (Don't use gAccounts from here on)


////////////////////////////////////////////////
// Login token local storage


XPCOMUtils.defineLazyServiceGetter(this, "loginManager",
    "@mozilla.org/login-manager;1", "nsILoginManager");
const LoginInfo = new Components.Constructor(
    "@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init");
const hostnameForLM = brand.login.loginTokenServerURL;
const formSubmitURLForLM = brand.login.uasURL;
const httpRealmForLM = null;

/**
 * Reads login token from profile (harddrive)
 * @returns {String} loginToken
 *   null/undefined, if unsuccessful
 */
function getStoredLoginToken(emailAddress)
{
  for each (let login in loginManager.findLogins({},
      hostnameForLM, formSubmitURLForLM, httpRealmForLM))
    if (login.username == emailAddress)
       return login.password;
}

/**
 * Stored login token in profile (harddrive).
 * Do that only when it's a long session token ("remember me")
 */
function storeLoginToken(emailAddress, loginToken)
{
  assert(loginToken && typeof(loginToken) == "string");
  removeStoredLoginToken(emailAddress); // loginManager can't just replace

  loginManager.addLogin(new LoginInfo(
      hostnameForLM, formSubmitURLForLM, httpRealmForLM,
      emailAddress, // username
      loginToken, // password
      "", "")); // username and password field
}

/**
 * Delete stored login token in profile (harddrive).
 */
function removeStoredLoginToken(emailAddress)
{
  for each (let login in loginManager.findLogins({},
      hostnameForLM, formSubmitURLForLM, httpRealmForLM))
    if (login.username == emailAddress)
       loginManager.removeLogin(login);
}

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
 * @param loginToken {String}
 * @param successCallback {Function({new Object for Account.loginContext})}
 */
function uasLogin(uasURL, loginToken,
    successCallback, errorCallback)
{
  var fetch = new FetchHTTP(
      {
        url : uasURL,
        method : "POST",
        bodyFormArgs :
        {
          logintoken : "urn:password:toolbartoken:" + loginToken,
          serviceID : brand.login.serviceID,
        },
        headers : kStandardHeaders,
      },
  function(response) // success
  {
    // Does a HTTP redirect (which XMLHttpRequest follows) directly to the
    // ContextService, which gives:
    assert(typeof(response) == "xml", gStringBundle.get("error.notXML"));
    //assert(response.mailServiceBaseURI, gStringBundle.get("error.badXML"));
    //debug("contextservice response:\n" + response);
    var loginContext = {
        mailCheckBaseURL : sanitize.url(response.mailServiceBaseURI),
        mailCheckInterval : sanitize.integer(response.mailServicePollIntervalSec),
        mailIgnoreFolderTypes : sanitize.string(
            response.mailNewMailCountIgnoredFolderTypes).split(","),
        webmailURL : replaceWebmailParams(
            sanitize.url(response.webMailerLoginURI), loginToken),
        webmailHTTPMethod : sanitize.enum(response.webMailerLoginMethod,
            [ "GET", "POST" ]),
        webmailMimetype : "application/x-www-form-urlencoded",
        webmailBody : replaceWebmailParams(
            sanitize.string(response.webMailerLoginFormParams), loginToken),
    }
    //debugObject(loginContext, "login context");
    successCallback(loginContext);
  }, errorCallback);
  fetch.start();
}

function replaceWebmailParams(org, loginToken)
{
  return org
    .replace("@LOGIN_TOKEN@", loginToken)
    // TODO JS_ENABLED will not work with NoScript
    .replace("@JS_ENABLED@", generalPref.get("javascript.enabled"));
}
