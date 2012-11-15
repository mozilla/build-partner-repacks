Components.utils.import("resource://unitedtb/email/account-base.js", this); // just for getDomainForEmailAddress()
Components.utils.import("resource://unitedtb/util/StringBundle.js", this);
var gStringBundle = new StringBundle(
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
  for each (let provider in brand.login.configs)
    if (provider.providerID == brand.login.providerID)
      domains = domains.concat(provider.domains);
  return arrayContains(domains, Account.getDomainForEmailAddress(emailAddress));
}


function onCreateAccount()
{
  loadPage(brand.login.createAccountURLWeb);
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
  var ok = promptService.promptPassword(window,
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
  //debug(new Date().toISOString() + "opening " + windowID);

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

/**
 * Verify email address, esp. that it's a UnitedInternet address.
 * Shows an error to the user, if needed.
 * @param emailAddress {String} to be checked
 * @param brandOnly {Boolean}
 *     Accept only accounts that are of the same brand as this toolbar,
 *     e.g. if this is a WEB.DE toolbar, accept only @web.de email addresses.
 * @param domains {Array of String}   List of acceptable domains.
 *     Accept only email addresses from these domains.
 *     If empty array, this check is skipped.
 * @param exampleDomain {String}   Any domain that we want to show
 *     to users in the example email address.
 * @returns null, if address OK, otherwise the error msg to display to the user
 */
function verifyEmailAddress(emailAddress, brandOnly, domains, exampleDomain)
{
  try {
    var newAddress = emailAddress.toLowerCase();
    const emailAddressRegexp = /^[a-z0-9\-%+_\.]+@[a-z0-9\-\.]+$/;
    if ( !emailAddressRegexp.test(newAddress))
      return gStringBundle.get(brandOnly ? "error.syntax.brand" : "error.syntax",
          [ brand.login.providerName, exampleDomain ]);
    if (domains.length > 0 && !arrayContains(domains,
            Account.getDomainForEmailAddress(newAddress)))
      return gStringBundle.get(brandOnly ? "error.domain.brand" : "error.domain",
          [ brand.login.providerName, exampleDomain, domains.join(", ") ]);
    return null;
  } catch (e) { return e.toString(); }
}
