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
Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", this);
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

var gInParams = null;
var gOutParams = null;

var eEmailAddress = null;
var eLongSession = null;
var ePassword = null;
var eErrorMsg = null;

// In the login-page case, default gBrandOnly to true
var gBrandOnly = true;

function onLoad()
{
  eEmailAddress = document.getElementById("emailaddress");
  ePassword = document.getElementById("password");
  eLongSession = document.getElementById("long-session");
  eErrorMsg = document.getElementById("error-msg");

  gInParams = window.arguments[0];
  gOutParams = window.arguments[1];
  debug("usecase " + gInParams.usecase);
  eEmailAddress.value = gInParams.emailAddress;
  eLongSession.checked = gInParams.wantStoredLogin;
  (gInParams.emailAddress ? ePassword : eEmailAddress).focus();

  // don't allow to edit email address, unless it's create account
  eEmailAddress.disabled = gInParams.usecase != 2;

  // Per PM, when we create the first account, the dialog must appear
  // to be a "Login" dialog. Also, the account added must be a brand account.
  gBrandOnly = getAllExistingAccounts().length == 0;

  // modify dialog title, message and OK button for setup and edit use cases
  var introE = document.getElementById("intro");
  var stringsE = document.getElementById("intro-box");
  var dialog = document.documentElement;
  var okButton = dialog.getButton("accept");
  if (gBrandOnly)
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
  document.getElementById("forgot-password").setAttribute("href", brand.login.forgotPasswordURL);
}

function onLeaveEmailaddress()
{
  verifyAndShowError(false);
}

function verifyAndShowError(needPassword)
{
  var domains = [];
  for each (let provider in brand.login.configs)
    if ( !gBrandOnly || provider.providerID == brand.login.providerID)
      domains = domains.concat(provider.domains);
  var myBrand = brand.login.providerName;
  var exampleDomain = domains[0] || "example.net";

  var errorMsg = null;
  if ( !errorMsg && !eEmailAddress.value && !ePassword.value)
    errorMsg = gStringBundle.get(
        gBrandOnly ? "error.noEmailAndPassword.brand" : "error.noEmailAndPassword",
        [ myBrand, exampleDomain ]);
  if ( !errorMsg) // login-common.js
    errorMsg = verifyEmailAddress(eEmailAddress.value, gBrandOnly, domains, exampleDomain);
  if ( !errorMsg && needPassword && !ePassword.value)
    errorMsg = gStringBundle.get(
        gBrandOnly ? "error.noPassword.brand" : "error.noPassword",
        [ myBrand, exampleDomain ]);

  var oldErrorMessage = eErrorMsg.textContent;
  eErrorMsg.textContent = errorMsg ? errorMsg : "";
  if (oldErrorMessage != eErrorMsg.textContent) // workaround for Mozilla bug 230959
    // We only want to do this in the XUL case
    if (document instanceof XULDocument)
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
  debug("oncancel");
  gOutParams.ok = false;
  return true;
}
