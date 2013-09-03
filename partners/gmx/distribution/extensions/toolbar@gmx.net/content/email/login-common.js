Components.utils.import("resource://unitedtb/email/account-base.js", this); // just for getDomainForEmailAddress()
Components.utils.import("resource://unitedtb/email/account-list.js", this); // just for verifyEmailAddressDomain()
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
 * @param parentWin {Window}  Parent window to use for login dialog
 * @returns {
 *      emailAddress {String}  what user entered (or left as-is)
 *      password {String}
 *      wantStoredLogin {Boolean}   "Remember me" is checked
 *    }
 *    null, if user cancels
 */
function getEmailAddressAndPassword(inparams, parentWin)
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

  // If a login window is open with the exact same ID, use it
  // nsIWindowWatcher
  var loginWin = Services.ww.getWindowByName(windowID, null);
  if (loginWin)
  {
    loginWin.focus();
    return null;
  }

  if (!parentWin || parentWin.closed)
    parentWin = window;
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
 * This is a logic function with no access to UI.
 *
 * @param emailAddress {String} what the user entered, to be checked
 * @param password {String} what the user entered, to be checked
 * @param needPassword {Boolean} lack of password shall be an error or not
 * @param brandOnly {Boolean}
 *     Accept only accounts that are of the same brand as this toolbar,
 *     e.g. if this is a WEB.DE toolbar, accept only @web.de email addresses.
 * @param newAccount {Boolean}
 *     If true, we are about to add a new account.
 *     If false, this email address is already in the list of accounts.
 * @param successCallback {Function()} Called if the checks passed
 * @param errorCallback {Function(msg {String or Exception})}
 *     Called if the checks failed
 *     |msg| a translated error message to show to the user verbatim.
 * @returns {Abortable}
 */
function verifyEmailAddressAndPassword(emailAddress, password,
    needPassword, brandOnly, newAccount, successCallback, errorCallback)
{
  try {
    assert(typeof(emailAddress) == "string", "need emailAddress param");
    assert(typeof(password) == "string", "need password param");
    assert(typeof(needPassword) == "boolean", "need needPassword param");
    assert(typeof(brandOnly) == "boolean", "need brandOnly param");
    assert(typeof(successCallback) == "function", "need successCallback");
    assert(typeof(errorCallback) == "function", "need errorCallback");
    emailAddress = emailAddress.toLowerCase();
    var myBrand = brand.login.providerName;
    var domains = [];
    for each (let config in brand.login.configs) {
      if (config.providerID == brand.login.providerID) {
        domains = domains.concat(config.domains);
      }
    }
    var exampleDomain = domains[0] || "example.net";
    const emailAddressRegexp = /^[a-z0-9\-%+_\.]+@[a-z0-9\-\.]+\.[a-z]+$/;

    if ( ! emailAddress && ! password) {
      throw new UserError(gStringBundle.get(
          "error.noEmailAndPassword" + (brandOnly ? ".brand" : ""),
          [ myBrand, exampleDomain ]));
    } else if (needPassword && ! password) {
      throw new UserError(gStringBundle.get(
          "error.noPassword" + (brandOnly ? ".brand" : ""),
          [ myBrand, exampleDomain ]));
    } else if ( ! emailAddressRegexp.test(emailAddress)) {
      throw new UserError(gStringBundle.get(
          "error.syntax" + (brandOnly ? ".brand" : ""),
          [ brand.login.providerName, exampleDomain ]));
    } else if (newAccount && getExistingAccountForEmailAddress(emailAddress)) {
      throw new UserError(gStringBundle.get("error.exists"));
    } else {
      // account-list.js
      return verifyEmailAddressDomain(emailAddress,
      function(config) {
        if (brandOnly && config.providerID != brand.login.providerID) {
          errorCallback(new UserError(gStringBundle.get("error.domain.brand",
              [ brand.login.providerName, exampleDomain, domains.join(", ") ])));
        } else {
          successCallback();
        }
      },
      function (e) {
        errorInBackend(e);
        // Just tell user that it's not supported
        errorCallback(new UserError(gStringBundle.get(
            "error.domain" + (brandOnly ? ".brand" : ""),
            [ brand.login.providerName, exampleDomain, domains.join(", ") ])));
      });
    }
  } catch (e) { errorInBackend(e); errorCallback(e); return new Abortable(); }
}
