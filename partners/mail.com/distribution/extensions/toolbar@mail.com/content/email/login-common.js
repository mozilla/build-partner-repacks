Components.utils.import("resource://unitedtb/email/account-base.js", this); // just for getDomainForEmailAddress()
var gStringBundle = new united.StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

/**
 * @param emailAddress {String}
 * @returns {Boolean}  true for email domains that are of the same brand
 *     as this toolbar.
 *     E.g. if this is a WEB.DE toolbar, accept only @web.de email addresses.
 */
function isOurBrand(emailAddress)
{
  var domains = [];
  for each (let provider in united.brand.login.configs)
    if (provider.providerID == united.brand.login.providerID)
      domains = domains.concat(provider.domains);
  return united.arrayContains(domains, Account.getDomainForEmailAddress(emailAddress));
}


function onCreateAccount()
{
  united.loadPage(united.brand.login.createAccountURLWeb);
  window.close();
}


/**
 * Unconditionally opens a dialog that asks for the
 * password, and returns it.
 *
 * @param emailAddress {String}   for which account the password is
 *     displayed to user
 * @param wantStoredLoginDefault {Boolean}   Whether "Remember me"
 *     is checked by default
 * @returns {
 *      emailAddress {String}  what you passed in
 *      password {String}
 *      wantStoredLogin {Boolean}   "Remember me" is checked
 *    }
 *    null, if user cancels
 */
function getPassword(emailAddress, wantStoredLoginDefault)
{
  var passwordInout = { value : "" };
  var storedLoginInout = { value : wantStoredLoginDefault };
  var ok = united.promptService.promptPassword(window,
      gStringBundle.get("passwordDialog.title"),
      gStringBundle.get("passwordDialog.msgWithEmail", [ emailAddress ]),
      passwordInout,
      gStringBundle.get("passwordDialog.remember"),
      storedLoginInout);
  if (!ok || !passwordInout.value)
    return null;
  return {
    emailAddress : emailAddress,
    password : passwordInout.value,
    wantStoredLogin : storedLoginInout.value
  };
}

/**
 * Unconditionally opens a dialog that asks for the email address and
 * password, and returns it.
 *
 * @param inparams {Object}   Parameter @see login-dialog.js
 * @returns {
 *      emailAddress {String}  what user entered (or left as-is)
 *      password {String}
 *      wantStoredLogin {Boolean}   "Remember me" is checked
 *    }
 *    null, if user cancels
 */
function getEmailAddressAndPassword(inparams)
{
  var outparams = {};
  // Window ID needs to be unique, otherwise the async error callback
  // opens a login dialog while the login dialog for the next account
  // is already open, and *Mozilla makes the former replace the latter*.
  // If we use a unique window ID, there's no replacement, we get
  // 2 modal dialogs, overlapping, which is OK. See #486 / bug 165280.
  // We'll use the email address. Alternatively, we could use random().
  var windowID = "united-login-dialog-" + inparams.emailAddress;
  //united.debug(new Date().toISOString() + "opening " + windowID);

  var parentWin = window;
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
       .getService(Ci.nsIWindowMediator);
  // If our preferences window is open, use it as the parent
  var win = wm.getMostRecentWindow("Unitedtb:Preferences");
  if (win && !win.closed) {
    parentWin = win;
  }

  parentWin.openDialog("chrome://unitedtb/content/email/login-dialog.xul",
      windowID, "modal,centerscreen", inparams, outparams);

  if (!outparams.ok || !outparams.emailAddress || !outparams.password)
    return null;

  return {
    emailAddress : outparams.emailAddress,
    password : outparams.password,
    wantStoredLogin : outparams.wantStoredLogin,
  };
}
