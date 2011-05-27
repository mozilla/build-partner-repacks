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
 * "do-login" (various)
 *    Parameter: withUI {boolean}
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

Components.utils.import("resource://unitedtb/email/login-logic.js", this);

var gStringBundle = new united.StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

// Current account. |Account| object from login-logic.js,
// corresponding to pref "login.emailAddress"
var gCurAcc = null;

function onLoad()
{
  united.ourPref.observeAuto(window, "login.emailAddress", prefChangeObserver);
  united.ourPref.observeAuto(window, "login.longSession", prefChangeObserver);

  // if we don't have the prefs, leave at null/undefined
  var emailAddress = united.ourPref.get("login.emailAddress");
  var longSession = united.ourPref.get("login.longSession");
  gCurAcc = emailAddress ? getAccount(emailAddress) : null;
  updateUI();
  autoLoginIfPossible();
}
window.addEventListener("load", onLoad, false);

// automatically log in without UI, if "remember me" activated and we have credentials
function autoLoginIfPossible()
{
  if (gCurAcc && gCurAcc.haveLoginToken && !gCurAcc.isLoggedIn)
  {
    gCurAcc.loginWithLoginToken(function() {}, united.error);
    // automatic action, so do not bother user about errors
    // loginlogic.js will send out a global "logged-in" message which will trigger
    // the further steps
  }
}

function updateUI()
{
  var loggedin = gCurAcc && gCurAcc.isLoggedIn;
  document.getElementById("united-logged-in-button").hidden = !loggedin;
  document.getElementById("united-logged-out-button").hidden = loggedin;
  united.toolbar.onButtonSizeChangedByCode();
}

united.autoregisterGlobalObserver("logged-in", updateUI);
united.autoregisterGlobalObserver("logged-out", updateUI);

/**
 * Listen to login requests.
 * email.js and co asks us to trigger login, including UI for password.
 */
function onLoginRequest(obj)
{
  united.assert(!(gCurAcc && gCurAcc.isLoggedIn),
      "Already logged in, so why does somebody want to log in?");
  if (obj.withUI)
    onCommandDoLogin();
  else
    throw NotReached("Disabled - Do you really need this?"); //autoLoginIfPossible();
}

united.autoregisterWindowObserver("do-login", onLoginRequest);


function prefChangeObserver()
{
  var oldAccount = gCurAcc;
  var emailAddress = united.ourPref.get("login.emailAddress");
  gCurAcc = emailAddress ? getAccount(emailAddress) : null;
  updateUI();
  if (oldAccount && emailAddress != oldAccount.emailAddress &&
      oldAccount.haveLoginToken)
  {
    oldAccount.logout(function() {}, united.error);
    // leave it to user to log in again,
    // to avoid e.g. password popup while in pref window
  }
}

/**
 * Login button clicked.
 * Also called when some component sends the "do-login" msg.
 */
function onCommandDoLogin()
{
  var answ = getEmailAddressAndPassword(gCurAcc ? gCurAcc.emailAddress : "");
  if (!answ) // user cancelled
    return;
  if (!gCurAcc || answ.emailAddress != gCurAcc.emailAddress)
  {
    united.ourPref.set("login.emailAddress", answ.emailAddress);
    // prefChangeObserver() triggered by setting pref
    gCurAcc = getAccount(answ.emailAddress);
  }

  gCurAcc.loginWithPassword(answ.password, answ.longSession,
      function() {},
  function(e) // error handler, e.g. wrong password
  {
    united.errorCritical(e); // explicit user action, so notify user of errors
    onCommandDoLogin(); // let user try again. no loop, because user can abort dialog.
  });
  // login-logic.js will send out a global "logged-in" message which will trigger
  // the further steps (in all windows)
}

/**
 * Logout button clicked.
 * Invalidate token and delete it from disk.
 */
function onCommandDoLogout()
{
  united.assert(gCurAcc, "Have no current account, so why is this button showing?");
  united.assert(gCurAcc.isLoggedIn, "Not logged in, so why is this button showing?");
  gCurAcc.logout(function() {
    united.loadPage(united.brand.login.afterLogoutWebURL, "tab");
  }, united.errorCritical); // (notify user of errors)
}

/**
 * Unconditionally opens a dialog that asks for the email address and
 * password, and returns it.
 *
 * @param emailAddress {String}   default value for email address field
 * @returns {
 *      emailAddress {String}  what user entered (or left as-is)
 *      password {String}
 *      longSession {Boolean}   "Remember me" is checked
 *    }
 *    null, if user cancels
 */
function getEmailAddressAndPassword(defaultEmailAddress)
{
  var longSessionDefault = united.ourPref.get("login.longSession");
  var inparams = {
    emailAddress : defaultEmailAddress,
    longSession : longSessionDefault,
  };
  var outparams = {};
  window.openDialog("chrome://unitedtb/content/email/login-dialog.xul",
      "united-login-dialog", "modal,centerscreen", inparams, outparams);

  if (!outparams.ok || !outparams.emailAddress || !outparams.password)
    return null;

  if (outparams.longSession != longSessionDefault)
  {
    united.assert(typeof(outparams.longSession) == "boolean");
    united.ourPref.set("login.longSession", outparams.longSession);
  }
  return {
    emailAddress : outparams.emailAddress,
    password : outparams.password,
    longSession : outparams.longSession,
  };
}
