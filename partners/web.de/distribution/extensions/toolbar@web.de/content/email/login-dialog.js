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

Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", this);
Components.utils.import("resource://unitedtb/email/account-list.js", this);
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
var gVerifyAbortable = new Abortable();

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
  try {
    verifyAndShowError(false, function() {}, function () {});
  } catch (e) { errorCritical(e); }
}

/**
 * Calls verifyEmailAddressAndPassword() logic function, and
 * populates UI fields with the result.
 *
 * <copied to="login-page.js"/>
 */
function verifyAndShowError(needPassword, successCallback, errorCallback) {
  var oldErrorMessage = eErrorMsg.textContent;
  eErrorMsg.textContent = "";
  // login-common.js
  // gVerifyAbortable.cancel(); TODO breaks all further verify calls. ditto below.
  gVerifyAbortable = verifyEmailAddressAndPassword(
      eEmailAddress.value, ePassword.value,
      needPassword, gBrandOnly, gInParams.usecase == 2,
  successCallback,
  function(errorMsg) { // errorCallback, check failed
    debug("check failed: " + errorMsg);
    eErrorMsg.textContent = errorMsg;
    if (oldErrorMessage != errorMsg) // workaround for Mozilla bug 230959
      window.sizeToContent(); // I would like to avoid that
    eEmailAddress.focus();
    eEmailAddress.select();
    errorCallback(errorMsg);
  });
}

function onOK()
{
  verifyAndShowError(true, function() {
    gOutParams.emailAddress = eEmailAddress.value.toLowerCase();
    gOutParams.password = ePassword.value;
    gOutParams.wantStoredLogin = eLongSession.checked;
    gOutParams.ok = true;
    window.close();
  }, function() {}); // Don't close on error, force user to correct or click Cancel
  return false; // Wait for verification
}

function onCancel()
{
  debug("oncancel");
  //gVerifyAbortable.cancel();
  gOutParams.ok = false;
  return true;
}
