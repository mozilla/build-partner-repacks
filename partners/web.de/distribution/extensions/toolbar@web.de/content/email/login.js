/**
 * The UI for logging into the user's UnitedInternet account.
 *
 * This implements the triggers for login/logout, email address and password
 * UI, and the single account (backend supports multiple accounts).
 */

/**
 * Messages observed:
 * "logged-in", "logged-out"
 *    Effect: Changes login button/icon
 * "do-login"
 *    Parameters:
 *      withUI {Boolean}, currently always true
 *          Allow to show password dialog. See Effect.
 *      needAccountType {Integer-enum} optional
 *          1 = log in the primary account only (which always matches brand)
 *          9 = log in only the account passed in as |account|
 *          10 = try to log in all accounts
 *              if any account succeeds, the successCallback will be called.
 *              if all are aborted, the errorCallback will be called.
 *          default: if |account|: 9, else: 1
 *      account {Account} optional
 *          if given, log in only this account
 *          if null, log in all known accounts
 *          if null and there are no known accounts, allow to configure one
 *      successCallback {Function(account)}
 *          Will be called, once the user has successfully logged in.
 *          (this process may take several seconds)
 *          param account {Account}   The account that the user logged in with,
 *              matching your request.
 *          Optional. If null, do nothing.
 *      errorCallback {Function(e)}
 *          called when there was an error.
 *          In the login case, this is never called, but the error is shown to
 *          the user and then another login dialog, until he Cancels. Then we
 *          call abortCallback.
 *          param e {Exception}   Details of the failure
 *          Optional. If null, will show error to user.
 *      abortCallback {Function(e)}
 *          Will be called, if the user clicked Cancel in the login dialog.
 *          Optional. If null, do nothing.
 *          Either successCallback, errorCallback or abortCallback will
 *          always be called (if passed).
 *    Effect:
 *      If withUI = true: Same as clicking on login button:
 *        Tries to log in, incl. asking user for password if necessary, and
 *        server calls.
 *      If withUI = false: (currently unused)
 *        If we have a loginToken, try to log in with that. If it fails,
 *        forget about it. Do not even show an error to the user.
 *      Either way:
 *        If successful, will implicitly cause "logged-in" msg to be sent.
 */

Components.utils.import("resource://unitedtb/email/account-list.js", this);
Components.utils.import("resource://unitedtb/email/webapp-start.js", this);

var gStringBundle = new StringBundle("email/login");

// All accounts
// {Array of Account}
var gAccs = [];

function onLoad()
{
  try {
    migrate();
    readAccounts();
    updateUI();
    autoLoginIfPossible();
  } catch (e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);

function readAccounts()
{
  //gAccs = getAllExistingAccounts().filter(function(acc) { return acc.kType == "unitedinternet"; });
  gAccs = getAllExistingAccounts();
}

function migrate()
{
  try {
    if (ourPref.get("accountsList", null))
      ourPref.set("email.runonceNewUsersShown", true);
  } catch (e) { errorNonCritical(e); }
}

// automatically log in without UI, if "remember me" activated and we have credentials
function autoLoginIfPossible()
{
  for each (let acc in gAccs)
  {
    if (acc.haveStoredLogin && !acc.isLoggedIn)
    {
      acc.login(0, true, function() {}, error);
      // automatic action, so do not bother user about errors
      // login-logic.js will send out a global "logged-in" message which will trigger
      // the further steps
    }
  }
}

function updateUI()
{
  var loggedinE = E("united-logged-in-button");
  var loggedinMenuitemE = E("united-logged-in-menuitem");
  var loggedoutE = E("united-logged-out-button");

  var primaryAcc = getPrimaryAccount();
  // Show "logged in", if any account is logged in
  var loggedin = gAccs.some(function(acc) { return acc.isLoggedIn; });
  //var loggedin = primaryAcc ? primaryAcc.isLoggedIn : false;
  loggedinE.hidden = !loggedin;
  loggedoutE.hidden = loggedin;

  // put username on logout button
  if ( !loggedinE.originalLabel)
    loggedinE.originalLabel = loggedinE.label;
  if ( !loggedinMenuitemE.originalLabel)
    loggedinMenuitemE.originalLabel = loggedinMenuitemE.label;
  if (primaryAcc && primaryAcc.isLoggedIn)
  {
    let username = sanitize.label(primaryAcc.emailAddress.split("@")[0]);
    // Wanted to make it configurable in local, but ran into
    // <https://bugzilla.mozilla.org/show_bug.cgi?id=698831>
    loggedinE.label = username;
    loggedinMenuitemE.label = gStringBundle.get("logout.primary.menuitem",
        [ primaryAcc.emailAddress ]);
  }
  else
  {
    loggedinE.label = loggedinE.originalLabel;
    loggedinMenuitemE.label = loggedinMenuitemE.originalLabel;
  }
        
  unitedinternet.toolbar.onButtonSizeChangedByCode();
}

autoregisterGlobalObserver("logged-in", updateUI);
autoregisterGlobalObserver("logged-out", updateUI);

/**
 * Listen to "do-login" requests.
 * email.js and co asks us to trigger login, including UI for password.
 * @see definition at top of file
 */
function onLoginRequest(params)
{
  // param checking
  assert(typeof(params.withUI) == "boolean");
  if ( !params.withUI)
    throw NotReached("Disabled - Do you really need this?"); //autoLoginIfPossible();
  var acc = params.account;
  assert(typeof(acc) == "object" || typeof(acc) == "undefined");
  if (acc && !arrayContains(gAccs, acc)) // just in case this is new
    gAccs.push(acc);
  var needAccountType = sanitize.enum(params.needAccountType,
      [1, 9, 10], acc ? 9 : 1);
  var successCallback = params.successCallback || function() {};
  var errorCallback = params.errorCallback || errorCritical;
  var abortCallback = params.abortCallback || function() {};
  assert(typeof(successCallback) == "function");
  assert(typeof(errorCallback) == "function");
  assert(typeof(abortCallback) == "function");

  if ( !gAccs.length) // we have no accounts yet
  {
    // create account, but only our brand
    tryLogin(2, null, false, null, successCallback, errorCallback, abortCallback);
  }
  else if (needAccountType == 9 || needAccountType == 1) // specific account
  {
    if (needAccountType == 1)
      acc = getPrimaryAccount();
    tryLogin(1, acc, true, null, successCallback, errorCallback, abortCallback);
  }
  else if (needAccountType == 10) // all accounts
  {
    // combine all callbacks to one
    let waiting = gAccs.length;
    let firstError = null;
    let firstAcc = null;
    let aborted = false;
    let combinedCallback = function(acc)
    {
      if (--waiting)
        return;
      if (aborted)
        abortCallback();
      else if (firstError)
        errorCallback(firstError);
      else
        successCallback(firstAcc);
    };
    let combinedSuccessCallback = function(acc)
    {
      if ( !firstAcc)
        firstAcc = acc;
      combinedCallback();
    };
    let combinedErrorCallback = function(e)
    {
      if ( !firstError)
        firstError = e;
      combinedCallback();
    };
    let combinedAbortCallback = function()
    {
      aborted = true;
      combinedCallback();
    };

    for each (let acc in gAccs)
      tryLogin(1, acc, true, null, combinedSuccessCallback, combinedErrorCallback,
          combinedAbortCallback);
  }
}
autoregisterWindowObserver("do-login", onLoginRequest);

function accountListChange()
{
  readAccounts();
  updateUI();
}

function logoutRemovedAccount(obj)
{
  var account = obj.account;
  assert(account);
  if (account.isLoggedIn)
  {
    account.logout(function() {}, error);
  }
}
autoregisterGlobalObserver("account-added", accountListChange);
autoregisterGlobalObserver("account-removed", accountListChange);
autoregisterGlobalObserver("account-removed", logoutRemovedAccount);

/**
 * Called by Login button
 */
function onCommandDoLogin()
{
  try {
    onLoginRequest({
      withUI : true,
      needAccountType : 10, // all
      // successCallback default: do nothing
      // errorCallback default: show errors
      // abortCallback default: do nothing
    });
  } catch (e) { errorCritical(e); }
}

/**
 * Open UI prompt to get password, and then log in with server.
 *
 * This should only be called in response to user action, not on startup.
 * Called when:
 * - Login button clicked
 * - some component sends the "do-login" msg.
 * - bad password (recursively)
 * - account setup
 *
 * - if usecase == login and already logged in: does nothing.
 * - if usecase == login, the email address is not editable anymore.
 *
 * @param usecase {Integer-enum}
 *     1 = login, only of the account |acc|
 *     2 = create new account only
 *     3 = edit existing account |acc|
 * @param acc {Account}  Log in or edit this account.
 *     The fields will be prefilled with this account.
 *     Required for usecase 1 and 3, must be null for usecase 2.
 * @param allowAutoLogin {Boolean}
 *     if true and we have a password stored, don't show UI, but login directly
 *     if false, show dialog in any case
 * @param parentWin {Window} optional
 *     if given the window is used as the parent of the login dialog
 *     if null, the current window is used
 *
 * @param successCallback {Function(account)}
 *    called when the user successfully logged in (usecase 1 and 2)
 *    param account {Account}
 * @param errorCallback {Function(e)}
 *    called when there was an error.
 *    In the login case, this is never called, but the error is shown to the
 *    user and then another login dialog, until he Cancels. Then we call
 *    abortCallback.
 * @param abortCallback {Function(e)}
 *    called when user clicked Cancel (including after an error)
 */
function tryLogin(usecase, acc, allowAutoLogin, parentWindow,
    successCallback, errorCallback, abortCallback)
{
  var loginFunc = function()
  {
    acc.login(0, true,
    // on success, login-logic.js will send out a global "logged-in"
    // message, which will trigger the further steps (in all windows)
    function() // success
    {
      if (usecase == 2)
      {
        acc.saveToPrefs();
        openWelcomePageMaybe(acc);
      }
      successCallback(acc);
    },
    function(e) // error handler, e.g. wrong password
    {
      e.causedByUser = true;
      errorCritical(e, parentWindow); // explicit user action, so notify user of errors
      if (usecase == 2)
      {
        acc.deleteAccount();
        acc = null;
      }
      // let user try again. no loop, because user can abort dialog
      tryLogin(usecase, acc, false, parentWindow,
               successCallback, errorCallback, abortCallback);
    });
  };

  try {
    sanitize.enum(usecase, [1, 2, 3]);
    assert(usecase == 2 || acc && acc.emailAddress);
    assert(usecase != 2 || !acc);
    assert(typeof(successCallback) == "function");
    assert(typeof(errorCallback) == "function");
    assert(typeof(abortCallback) == "function");

    if (usecase == 1 && acc.isLoggedIn)
    {
      successCallback(acc);
      return;
    }

    if (usecase == 1 && acc.haveStoredLogin && allowAutoLogin)
    {
      // don't show dialog, skip directly to login
      loginFunc(acc);
    }
    else // show dialog
    {
      var prefillEmail = acc ? acc.emailAddress : "";
      var prefillStore = acc ? acc.wantStoredLogin : true;
      var answ = common.getEmailAddressAndPassword({
          emailAddress : prefillEmail,
          wantStoredLogin : prefillStore,
          usecase : usecase,
        }, parentWindow);
      if (!answ) // user cancelled
      {
        abortCallback();
        return;
      }

      if (usecase == 2) // create account
      {
        // email address already checked in login-dialog.js
        assert(answ.emailAddress && answ.emailAddress != prefillEmail);
        acc = getExistingAccountForEmailAddress(answ.emailAddress);
        if (acc)
        {
          var e = new Exception(gStringBundle.get("error.exists"));
          e.causedByUser = true;
          errorCallback(e);
          return;
        }
        makeNewAccount(answ.emailAddress, function(newAcc) {
          acc = newAcc;
          acc.wantStoredLogin = answ.wantStoredLogin;
          acc.setPassword(answ.password);
          loginFunc();
        }, errorCallback);
      }
      else // login or edit
      {
        assert(answ.emailAddress == prefillEmail);
        if (answ.wantStoredLogin != prefillStore)
        {
          acc.wantStoredLogin = answ.wantStoredLogin;
          acc.saveToPrefs();
        }
        acc.setPassword(answ.password);
        loginFunc();
      }
    }
  } catch (e) { errorCritical(e); }
}

/**
 * Logout button clicked.
 * Invalidate token and delete it from disk.
 */
function onCommandDoLogout()
{
  if ( !logoutConfirmation())
    return;

  var remainingCount = gAccs.length;
  var loggedOut = function()
  {
    remainingCount--;
    if (remainingCount == 0 && brand.login.afterLogoutWebURL)
      loadPage(brand.login.afterLogoutWebURL, "tab");
  };

  for each (let acc in gAccs)
  {
    try {
      if (acc.config && acc.config.type == "unitedinternet")
        logoutPerUsecase(acc); // log out web app, too (must happen before toolbar logout)
    } catch (e) { errorCritical(e) };

    if ( !acc.isLoggedIn)
      loggedOut();
    else
      acc.logout(loggedOut, errorCritical); // (notify user of errors)
  }
}

/**
 * Upon very first successful login, we may open a special
 * "welcome" / "runonce" webpage.
 * Depends on brand and marketing actions.
 */
function openWelcomePageMaybe(account)
{
  var webpageURL = brand.login.runonceNewUsersWebURL;
  if ( !webpageURL)
    return;
  if (ourPref.get("email.runonceNewUsersShown"))
    return;
  // If the redirect does not exist, the page is not shown, and no error is thrown.
  // So, we need to make 2 requests: The first background request is only
  // to check whether the URL gives HTTP 200 or 404.
  // The second is then the browser.
  new FetchHTTP({ url : webpageURL, method : "GET" },
  function() // success
  {
    // load in browser
    ourPref.set("email.runonceNewUsersShown", true);
    loadPage(webpageURL, "tab");
  },
  function(e)
  {
    // silence error (esp. 404), that's the whole point
    debug("Got error from runonceNewUsers: " + e);
  }).start();
}

/**
 * Prompt for logout: Are you sure?
 * @returns {Boolean}
 *     true = The user confirmed explicitly or by pref
 *     false = cancel
 */
function logoutConfirmation()
{
  if (ourPref.get("login.logoutConfirm"))
  {
    var buttonFlags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING +
        promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_CANCEL +
        promptService.BUTTON_POS_1_DEFAULT;
    var remember = { value : null };
    var confirm = promptService.confirmEx(window,
        gStringBundle.get("logout.confirm.title"),
        gStringBundle.get("logout.confirm.msg"),
        buttonFlags,
        gStringBundle.get("logout.confirm.ok"),
        null,
        null,
        gStringBundle.get("logout.confirm.remember"),
        remember);
    var ok = confirm == 0;
    if (!ok)
      return false;
    if (ok && remember.value)
      ourPref.set("login.logoutConfirm", false);
  }
  return true;
}
