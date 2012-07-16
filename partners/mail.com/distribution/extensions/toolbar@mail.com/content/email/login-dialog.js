/**
 * Shows a login prompt, with email address and password input fields.
 * Also a [ ] Remember checkbox and [ Register now ] button.
 * Called by login.js getEmailAddressAndPassword().
 *
 * inparams (first window argument, you need to pass this):
 * @param emailAddress {String}  prefill this address
 * @param wantStoredLogin {Boolean}  prefill checkbox with this value
 * @param usecase {Integer-Enum} 1 = login, 2 = setup account, 3 = edit account
 *
 * outparams (second window argument, will be filled in by dialog and returned to you,
 * you just pass an empty object)
 * @returns emailAddress {String}  The email address that the user entered.
 *    Not necessarily the same as you passed in.
 * @returns password {String}  What the user entered
 * @returns wantStoredLogin {Boolean}  User wants password/credentials to be stored.
 * @returns ok {Boolean} true = User clicked OK button, false = user aborted
 */

Components.utils.import("resource://unitedtb/email/account-list.js", this);
var gStringBundle = new united.StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

var united = window.opener.united;
var gInParams = null;
var gOutParams = null;

var eEmailAddress = null;
var eLongSession = null;
var ePassword = null;
var eErrorMsg = null;

function onLoad()
{
  eEmailAddress = document.getElementById("emailaddress");
  ePassword = document.getElementById("password");
  eLongSession = document.getElementById("long-session");
  eErrorMsg = document.getElementById("error-msg");

  gInParams = window.arguments[0];
  gOutParams = window.arguments[1];
  united.debug("usecase " + gInParams.usecase);
  eEmailAddress.value = gInParams.emailAddress;
  eLongSession.checked = gInParams.wantStoredLogin;
  (gInParams.emailAddress ? ePassword : eEmailAddress).focus();

  // don't allow to edit email address, unless it's create account
  eEmailAddress.disabled = gInParams.usecase != 2;

  // Per PM, when we create the first account, the dialog must appear
  // to be a "Login" dialog. Also, the account added must be a brand account.
  gInParams.firstAccount = getAllExistingAccounts().length == 0;

  // modify dialog title, message and OK button for setup and edit use cases
  var introE = document.getElementById("intro");
  var stringsE = document.getElementById("intro-box");
  var dialog = document.documentElement;
  var okButton = dialog.getButton("accept");
  if (gInParams.firstAccount)
  {
    // (pretend to be) login case, already in XUL attributes
    introE.textContent = stringsE.getAttribute("loginBrandIntro");
  }
  else if (gInParams.usecase == 1)
  {
    // login case, already in XUL attributes
    if (isOurBrand(gInParams.emailAddress)) // login-common.js
      introE.textContent = stringsE.getAttribute("loginBrandIntro");
  }
  else if (gInParams.usecase == 2) // setup account
  {
    dialog.setAttribute("title", stringsE.getAttribute("setupTitle"));
    introE.textContent = stringsE.getAttribute("setupIntro");
    okButton.setAttribute("label", stringsE.getAttribute("setupOKLabel"));
    okButton.setAttribute("accesskey", stringsE.getAttribute("setupOKKey"));
  }
  else if (gInParams.usecase == 3) // edit account
  {
    dialog.setAttribute("title", stringsE.getAttribute("editTitle"));
    introE.textContent = stringsE.getAttribute("editIntro");
    okButton.setAttribute("label", stringsE.getAttribute("editOKLabel"));
    okButton.setAttribute("accesskey", stringsE.getAttribute("editOKKey"));
  }
}

function onLeaveEmailaddress()
{
  verifyAndShowError(false);
}

function verifyAndShowError(needPassword)
{
  var brandOnly = gInParams.firstAccount;
  var domains = [];
  for each (let provider in united.brand.login.configs)
    if ( !brandOnly || provider.providerID == united.brand.login.providerID)
      domains = domains.concat(provider.domains);
  var myBrand = united.brand.login.providerName;
  var exampleDomain = domains[0] || "example.net";

  var errorMsg = null;
  if ( !errorMsg && !eEmailAddress.value && !ePassword.value)
    errorMsg = gStringBundle.get(
        brandOnly ? "error.noEmailAndPassword.brand" : "error.noEmailAndPassword",
        [ myBrand, exampleDomain ]);
  if ( !errorMsg) // login-common.js
    errorMsg = verifyEmailAddress(eEmailAddress.value, brandOnly, domains, exampleDomain);
  if ( !errorMsg && needPassword && !ePassword.value)
    errorMsg = gStringBundle.get(
        brandOnly ? "error.noPassword.brand" : "error.noPassword",
        [ myBrand, exampleDomain ]);

  eErrorMsg.textContent = errorMsg ? errorMsg : "";
  window.sizeToContent(); // I would like to avoid that
  if (errorMsg)
  {
    eEmailAddress.focus();
    eEmailAddress.select();
    return false;
  }
  else
    return true;
}

function onOK()
{
  if ( !verifyAndShowError(true))
    return false; // don't close, force user to click Cancel

  gOutParams.emailAddress = eEmailAddress.value.toLowerCase();
  gOutParams.password = ePassword.value;
  gOutParams.wantStoredLogin = eLongSession.checked;
  gOutParams.ok = true;
  return true;
}

function onCancel()
{
  united.debug("oncancel");
  gOutParams.ok = false;
  return true;
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
          [ united.brand.login.providerName, exampleDomain ]);
    if (domains.length > 0 && !united.arrayContains(domains,
            Account.getDomainForEmailAddress(newAddress)))
      return gStringBundle.get(brandOnly ? "error.domain.brand" : "error.domain",
          [ united.brand.login.providerName, exampleDomain, domains.join(", ") ]);
    return null;
  } catch (e) { return e.toString(); }
}
