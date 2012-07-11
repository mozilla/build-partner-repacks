/**
 * Checks number of new mails for a UnitedInternet account.
 * Polls periodically in the background, and sends around a message
 * when there are new mails.
 *
 * Once you getMailCheckAccount(), the account will listen to "logged-in"/out
 * messages by itself, and starting the mail check as soon as the account
 * is logged in, and send "mail-check" notifications when there are news.
 * So, doing "getMailCheckAccount()" and send "do-login" is all you need to do
 * to start mail checks.
 *
 * The implementation is getting a bit complicated due to UnitedInternet's
 * login and mail server systems, so we have about 5 steps here:
 * LoginTokenServer:
 *    takes username/password
 *    returns token as credentials.
 *    (A token is as good as a password, but with a short or long expiry)
 * UAS:
 *   takes loginToken
 *   returns URL for ContextService
 * ContextService (= PACS = trinity-toolbar-rest):
 *   takes URL + token
 *   creates session
 *   returns session cookie and URL for RESTfulMail and
 *       URL+params for Webmail login
 * getFolderStats() (= RESTfulMail = folderQuota):
 *   takes session cookie
 *   returns list of folders with number of unread mail etc.
 * Webmail:
 *   takes params for login
 *   returns HTTP redirect to webpage (for normal browser) with webmail
 *       (either login page or already logged in, depending on user)
 *
 * We can save the loginToken (if longSession) in the profile.
 * The loginToken and the session can expire, so we may need to fall back.
 */

/**
 * Messages sent:
 * "mail-check"
 *    Means: New information about number of new/unread mails
 *    When: We polled the server (periodically) about new mails, here in background
 *    Parameter:
 *      account {Account}
 */

const EXPORTED_SYMBOLS = [ "UnitedInternetMailCheckAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/email/login-logic.js");

var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/email.properties");

function UnitedInternetMailCheckAccount(accountID, isNew)
{
  UnitedInternetLoginAccount.call(this, accountID, isNew);
  this._loginAccount = this; // we used delegation before, so map to that
}
UnitedInternetMailCheckAccount.prototype =
{
  kType : "unitedinternet",
  _newMailCount : -1,

  _poller : null, // nsITimer for mail poll
  _eTag : null,

  get newMailCount() { return this._newMailCount; },

  /**
   * If the user is logged in and wants to go to webmail, i.e. read the mail
   * on the UnitedInternet website, go to this URL (you may need to do POST).
   * @returns {
   *    url {String}
   *    httpMethod {String-enum} "GET" or "POST"
   *    mimetype {String}   Content-Type header to set in request, as upload type
   *    body {String}   body to send in request
   *  }
   */
  getWebmailPage : function()
  {
    return this._loginAccount.loginContext.weblogin.mailbox;
  },

  logout : function(successCallback, errorCallback)
  {
    if (this._poller)
      this._poller.cancel();
    this._poller = null;
    this._newMailCount = -1;
    this._eTag = null;
    UnitedInternetLoginAccount.prototype.logout.apply(this, arguments);
  },

  mailCheck : function(peekMails, continuously, notifyCallback, errorCallback)
  {
    assert(this.isLoggedIn, "Please log in first");
    assert( !continuously, "I'm already checking regularly");
    this._mailPoll();
  },

  /**
   * Logs into server session and starts polling for new mails.
   * Result are "mail-check" messages.
   */
  _startMailCheck : function()
  {
    assert(this._loginAccount.isLoggedIn);
    var context = this._loginAccount.loginContext.service.mailbox;
    assert(context.interval > 5);

    this._mailPoll();
    var self = this;
    this._poller = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._poller.initWithCallback(function() { self._mailPoll(); },
        context.interval * 1000, Ci.nsITimer.TYPE_REPEATING_SLACK);
  },
  _mailPoll : function()
  {
    try {
      assert(this._loginAccount.isLoggedIn);
      var self = this;
      var lc = this._loginAccount.loginContext.service.mailbox;
      getFolderStats(lc.url, lc.ignoreFolderTypes,
          lc.sessionCookie, this._eTag, this._newMailCount,
          function(newMailCount, eTag)
          {
            self._newMailCount = newMailCount;
            self._eTag = eTag;
            notifyGlobalObservers("mail-check", { account : self });
          },
          function (e)
          {
            if (e.code == 403) // Forbidden, e.g. session expired
              self._loginAccount._sessionFailed();
            else
              errorInBackend(e);
          });
    } catch (e) { errorInBackend(e); }
  }
}
extend(UnitedInternetMailCheckAccount, UnitedInternetLoginAccount);



/**
 * Called when user logged in or out.
 */
function onLoginStateChange(msg, obj)
{
  var acc = obj.account;
  if (!acc) // not yet created by UI, so don't poll
    return;
  if (acc.kType != "unitedinternet")
    return;
  if (msg == "logged-in")
  {
    assert(acc.isLoggedIn);
    //assert(!acc.newMailCount);
    acc._startMailCheck(); // will send another "mail-check" msg after server call
  }
  else if (msg == "logged-out")
  {
    notifyGlobalObservers("mail-check", { account : acc });
  }
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "logged-in" || msg == "logged-out")
      onLoginStateChange(msg, obj);
  },
}
registerGlobalObserver(globalObserver);



///////////////////////////////////////////////////////////////////////////
// Network functions

// (Do not use globals from here on, apart from gStringBundle and similar)

const kStandardHeaders =
    {
      "Accept" : "application/xml",
      "X-UI-App" : "Firefox-Toolbar/" + getExtensionFullVersion(),
    };

/**
 * folder step: Take URL for mail check and login token (?)
 * and return how many new mails are in each folder
 *
 * @param mailCheckBaseURL {String}
 * @param ignoreFolderTypes {Array of String} @see loginContext
 * @param sessionCookie {String} @see loginContext
 * @param successCallback {Function(newMailCount {Integer}, eTag {String})}
 *     newMailCount   how many new (currently all unread!) mails are in all folders
 *     eTag   Caching-mechanism for server's benefit, see "HTTP ETag"
 *
 */
function getFolderStats(mailCheckBaseURL, ignoreFolderTypes,
    sessionCookie, eTag, lastNewMailCount,
    successCallback, errorCallback)
{
  assert(ignoreFolderTypes);
  assert(sessionCookie);
  var headers = {
    Cookie : sessionCookie,   
    __proto__ : kStandardHeaders,
  };
  if (eTag)
    headers["If-None-Match"] = eTag;
  var fetch = new FetchHTTP(
      {
        url : mailCheckBaseURL + "FolderQuota?absoluteURI=false",
        method : "GET",
        headers : headers,
      },
  function(response) // success
  {
    assert(typeof(response) == "xml", gStringBundle.get("error.notXML"));
    assert(response.folderQuota, gStringBundle.get("error.badXML"));
    try {
      var newETag = fetch.getResponseHeader("ETag");
    } catch (e) { debug("Getting ETag failed: " + e); }
    //debug(response.toString());

    successCallback(countNewMailsInFolder(response.folderQuota,
                                          ignoreFolderTypes), newETag);
  },
  function (e)
  {
    if (e.code == 304) // not modified
    {
      try {
        var newETag = fetch.getResponseHeader("ETag");
        if (eTag != newETag)
          debug("server says 'not modified', but sends different eTag");
      } catch (e) { debug("Getting ETag failed: " + e); }
      successCallback(lastNewMailCount, newETag);
    }
    else
      errorCallback(e);
  });
  fetch.start();
}

/**
 * Recursive function for getFolderStats() that
 * adds up the number of new/unread mails in each folder,
 * including subfolders
 * @param xFolders {XML} A list of <folderQuota> elements
 * @param ignoreFolderTypes {Array of String} @see LoginContext
 * @returns {Integer} number of new mails in this folder and all subfolders
 */
function countNewMailsInFolder(xFolders, ignoreFolderTypes)
{
  var result = 0;
  assert(ignoreFolderTypes);
  for each (let folder in xFolders)
  {
    //debug("folder " + sanitize.string(folder.folderName) +
    //    " type " + sanitize.string(folder.folderType) +
    //    " has " + sanitize.integer(folder.totalMessages) +
    //    " of which " + sanitize.integer(folder.unreadMessages) + " are unread");
    if (arrayContains(ignoreFolderTypes, sanitize.string(folder.folderType)))
    {
      //debug("ignoring folder " + sanitize.string(folder.folderName));
      continue;
    }
    result += sanitize.integer(folder.unreadMessages);
    if (folder.subFolders)
      result += countNewMailsInFolder(folder.subFolders.folderQuota, ignoreFolderTypes);
  }
  return result;
}
