/**
 * This component allows to jump directly to the UnitedInternet
 * web application with parameters to initiate an action.
 * This allows to e.g. show the webmailer, the web-based user interface
 * for the notes app, or the calendar.
 *
 * Instead of opening applications per se, we trigger
 * "usecases", e.g. "new mail" or "new SMS", to be independent
 * from where the SMS feature is implemented. The usecases can
 * have parameters, which allows to create a new mail
 * to fred@flintstones.net, with the recipient prefilled.
 */

const EXPORTED_SYMBOLS = [ "startUsecase", "logoutPerUsecase", "goToWebmailOld" ];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/email/account-base.js");
Components.utils.import("resource://unitedtb/email/login-logic.js");

var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

// {Integer} Unique ID for each call. Just counted up.
var gID = 0;

/**
 * This will start an arbitrary action in the UnitedInternet webapp,
 * as the given user.
 *
 * Where: If the webfrontend is already open in some tab,
 * we open it and load the usecase there (non-destructive).
 * If there is no open webapp, we open a new session
 * in a new tab.
 *
 * What: Determined by usecase and parameters.
 *
 * @param account {UnitedInternetLoginAccount}
 *     In which account the action should happen.
 *     Normally, this is the primary account.
 *     Must be a UnitedInternet LoginTokenServer / PACS account.
 * @param usecase {String}   ID of the usecase.
 *     The usecase and its parameter is defined by the
 *     web frontend, and you (the caller) needs to know it.
 * @param parameters {Object}   Put the parameters
 *     as named properties of a new JS object.
 *     They'll be stringified via JSON, base64-encoded and
 *     sent as-is to the web-app.
 *     This function doesn't care about the content and just
 *     passes them on to the webapp.
 *     Any security must be ensured by you, the caller.
 * @param win {nsIDOMWindow} A Firefox window
 *    If a new tab must be opened, it will be in this window.
 *    Ignored, if an existing webfrondend instance is opened.
 * @result @see result of makePayload()
 */
function startUsecase(account, usecase, parameters, win)
{
  assert(account instanceof Account, "need Account");
  assert(account instanceof UnitedInternetLoginAccount,
      "account is an Account, but not a UnitedInternetLoginAccount");
  assert(account.isLoggedIn); // in toolbar
  var payload = makePayload(usecase, parameters);

  var existingTabData = findExistingTab(account, false);
  if (existingTabData)
  {
    focusTabAndWindow(existingTabData);
    sendEventToPage(existingTabData.document, payload);
  }
  else
  {
    assert(win && win.unitedinternet, "Need a Firefox window");
    if (usecase == "openmail" && ! brand.toolbar.pay) // Hack per PM: Go to homepage first
      goToWebmailOldUnitedInternet(account, win);
    else
      loadNewTab(account, payload, win);
  }
  return payload;
}

/**
 * This logs out *all* active webapp sessions for this account.
 *
 * @param account {UnitedInternetLoginAccount}
 */
function logoutPerUsecase(account)
{
  for each (let tab in findExistingTab(account, true))
  {
    sendEventToPage(tab.document, makePayload("logout_navigator", {}));
  }
}

/**
 * If the user already is logged in to the webmailer or
 * webapps, we want to 1) find that tab, 2) bring it to the front,
 * and 2) trigger the use case in there.
 *
 * (Triggering usecases is non-destructive, the web app ensures
 * that the existing action and data stays in the background and
 * the user can go back to it and find it as it was when we
 * triggered the use case.)
 *
 * We identify the tab by a domain whitelist, and by a
 * certain <div> that the webfrontend puts in there for us.
 * We need to verify that it's the right account and that it's
 * still alive, based on the data in the <div> (no further verification).
 *
 * We should make sure to always find the same tab.
 *
 * @param account @see startUsecase()
 * @param returnAll {Boolean}
 *     If false: return the first page that matches
 *     If true: return all pages match
 * @returns
 *     if returnAll = false:
 *     {
 *       document : {nsIDOMDocument}, == browser.contentDocument
 *       browser : {<browser>}, part of <tabbrowser>
 *       tabbrowser : {<tabbrowser>}
 *       window : {XUL <window>},
 *     }
 *     or null, if no existing tab is found
 *     if returnAll = true: Array of the same objs as above.
 */
function findExistingTab(account, returnAll)
{
  var resultArray = [];
  // nsIWindowMediator
  var browserEnumerator = Services.wm.getEnumerator("navigator:browser");
  while (browserEnumerator.hasMoreElements())
  {
    let browserWin = browserEnumerator.getNext();
    debug("\nfound window");
    let tabbrowser = browserWin.gBrowser;
    let browsers = browserWin.gBrowser.browsers;
    for (let i = 0, l = browsers.length; i < l; i++)
    {
      let browser = tabbrowser.getBrowserAtIndex(i);
      debug("found page '" + browser.contentTitle + "' <" + browser.currentURI.spec + ">");
      if ( ! (browser.currentURI instanceof Ci.nsIStandardURL))
        continue;
      let hostname = browser.currentURI.host;
      if (account.config.domains.some(function(domain)
      {
        domain = "." + domain;
        return hostname.substr(0 - domain.length) == domain;
      }))
      {
        // is our domain, now check whether it's
        // the webapp, and our account and active
        debug("this is our domain");
        let doc = browser.contentDocument;
        let el = doc.getElementById("unitedinternet_toolbar");
        if (el &&
            el.getAttribute("session_alive") == "true" &&
            el.getAttribute("primary_mail_address").toLowerCase() == account.primaryEmailAddress)
        {
          debug("yes, this is an active session for this account. Using it.");
          var aResult = {
            document : doc,
            browser : browser,
            tabbrowser : tabbrowser,
            window : browserWin,
          };
          if (returnAll)
            resultArray.push(aResult);
          else
            return aResult;
        }
      }
    }
  }
  if (returnAll)
    return resultArray;
  else
    return null;
}

/**
 * Ensures that a given tab and its window are visible and focused.
 * Selects the tab, and focuses the window.
 */
function focusTabAndWindow(tabData)
{
  assert(tabData.browser.localName == "browser");
  assert(tabData.tabbrowser.localName == "tabbrowser");
  assert(tabData.window instanceof Ci.nsIDOMWindow);
  tabData.tabbrowser.selectTabAtIndex(tabData.tabbrowser
      .getBrowserIndexForDocument(tabData.browser.contentDocument));
  tabData.window.focus();
}

/**
 * @param doc @param {nsIDOMDocument}
 * @param payload @see result of makePayload()
 */
function sendEventToPage(doc, payload)
{
  debug("Sending usecase event " + payload.usecase + " to webpage");
  var event = doc.createEvent("Event");
  event.initEvent("unitedinternet_toolbar_start_usecase", true, true);
  //event.payload = makePayloadStr(payload); -- blocked by Mozilla security restrictions
  var div = doc.getElementById("unitedinternet_toolbar");
  div.setAttribute("event_data_to_page", makePayloadStr(payload));
  div.dispatchEvent(event); // to doc.body?
  debug("sent event with payload " + makePayloadStr(payload));
}

/**
 * Loads the usecase in a new tab with a new web frontend session.
 *
 * @param account @see startUsecase()
 * @param payload @see result of makePayload()
 * @param win   A Firefox window to create the new tab in
 */
function loadNewTab(account, payload, win)
{
  assert(win && win.unitedinternet);
  var lc = account.loginContext.weblogin.iacUsecase;
  assert(lc, "Did not get IAC usecase URLs from PACS server");
  assert(lc.httpMethod == "POST", "GET for login calls not supported");
  win.unitedinternet.common.loadPageWithPOST(
      lc.url,
      "tab",
      lc.body.replace("@IAC_USECASE@",
          encodeURIComponent(makePayloadStr(payload))),
      "application/x-www-form-urlencoded");
  debug("loaded usecase in new tab <" + lc.url + ">, params " +
      lc.body.replace("@IAC_USECASE@", makePayloadStr(payload)));
}

/**
 * @param usecase @see startUsecase()
 * @param parameters @see startUsecase()
 */
function makePayload(usecase, parameters)
{
  var payload = {
    usecase : sanitize.nonemptystring(usecase),
    args : parameters,
    id : ++gID,
    caller_app : "toolbar",
    caller_version : "Firefox/" + getExtensionFullVersion(),
  };
  return payload;
}

/**
 * @param payload @see result of makePayload()
 * @result stringified version, base64-encoded, of the payload
 */
function makePayloadStr(payload)
{
  // JSON is a native JS function since ES5
  // window.btoa() and btoa() for XPCOM components
  return btoa(JSON.stringify(payload));
}




//////////////////////////////////////////////////////////////////////////////
// Old, non-Usecase API for starting webmail

/**
 * For UnitedInternet accounts, go to Webmail webpage in browser.
 * See top of email-logic.js for what's supposed to happen in general.
 */
function goToWebmailOld(acc, win)
{
  assert(acc && acc.emailAddress);
  assert(win && win.unitedinternet);
  debug("going to webmail of " + acc.emailAddress);
  debug("type " + acc.type + ", domain " + acc.domain);
  if (acc.type == "imap" && acc.providerID == "mailcom")
  {
    goToWebmailMailcom(acc, win);
  }
  else if (acc.type == "imap" && acc.providerID == "1und1")
  {
    goToWebmail1und1(acc, win);
  }
  else if (acc.type == "unitedinternet")
  {
    goToWebmailOldUnitedInternet(acc, win);
  }
  else
    assert(true, "Have no webmail for this account type: " + acc.emailAddress);
}


/**
 * Log in to UnitedInternet webmail, but
 * via webmail URL from PACS, not via usecase.
 */
function goToWebmailOldUnitedInternet(acc, win)
{
  var webmail = acc.getWebmailPage();
  if (!webmail || !webmail.url) // (normally assert(), but it's a server error)
    throw new Exception(gStringBundle.get("error.noWebmailURL"));
  if (webmail.httpMethod == "GET")
  {
    debug("using GET webmail URL " + webmail.url);
    win.unitedinternet.common.loadPage(webmail.url);
  }
  else if (webmail.httpMethod == "POST")
  {
    debug("using POST webmail URL " + webmail.url);
    win.unitedinternet.common.loadPageWithPOST(webmail.url, "tab", webmail.body, webmail.mimetype);
  }
  else
    throw new NotReached("invalid webmail.httpMethod" + webmail.httpMethod);
}

/**
 * TODO move to brand.js?
 * For mail.com IMAP accounts,
 * log in to mail.com webmail upon button click.
 *
 * Just loads a URL with the login in URL parameters.
 */
function goToWebmailMailcom(acc, win)
{
  assert(acc.haveStoredLogin);
  var url = "https://service.mail.com/login.html";
  var params = "";
  params += "&rdirurl=" + encodeURIComponent("http://www.mail.com"); // needed
  params += "&login=" + encodeURIComponent(acc.emailAddress);
  params += "&password=" + encodeURIComponent(acc._password); // tralala
  win.unitedinternet.common.loadPageWithPOST(url, "tab", params, "application/x-www-form-urlencoded");
  //win.unitedinternet.common.loadPage(url + "?" + params, "tab"); // GET works, too
}



/**
 * Log in to 1&1 webmail
 * Just loads a URL with the login as HTTP POST content.
 */
function goToWebmail1und1(acc, win)
{
  assert(acc.haveStoredLogin);
  var url = "https://webmailcluster.1und1.de/xml/webmail/Login";
  var params = "__sendingauthdata=1&login.ValidBrowser=false&jsenabled=true";
  params += "&login.Username=" + encodeURIComponent(acc.emailAddress);
  params += "&login.Password=" + encodeURIComponent(acc._password); // tralala
  win.unitedinternet.common.loadPageWithPOST(url, "tab", params, "application/x-www-form-urlencoded");
  //win.unitedinternet.common.loadPage(url + "?" + params, "tab"); // GET works, too
}
