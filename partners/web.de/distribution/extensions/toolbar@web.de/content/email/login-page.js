Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", this);
Components.utils.import("resource://unitedtb/email/account-list.js", this);
Components.utils.import("resource://unitedtb/build.js");
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

var eLoginButton;
var gVerifyAbortable = new Abortable();
var confirmClose = true;

function onLoginLoad()
{
  window.onbeforeunload = function(e) {
    if (confirmClose)
      return confirmClose;
    else
      return;
  };

  eEmailAddress = document.getElementById("emailaddress");
  ePassword = document.getElementById("password");
  eLongSession = document.getElementById("long-session");
  eErrorMsg = document.getElementById("error-msg");
  eLoginButton = document.getElementById("login-button");
  eFinishButton = document.getElementById("finish-button");

  // We don't need to confirm close in the branded browser case or AMO
  if (ourPref.get("brandedbrowser", false) || kVariant == "amo") {
    confirmClose = false;
  }

  document.getElementById("forgot-password").setAttribute("href", brand.login.forgotPasswordURL);
  document.getElementById("create-account").setAttribute("href", brand.login.createAccountURLWeb);

  updateLoginButton();

  // Allow enter key to work
  document.addEventListener("keypress", function(event) {
    if (event.keyCode == 13)
      document.getElementById("login-button").click();
  }, false);

  eEmailAddress.focus();
}
window.addEventListener("load", onLoginLoad, false);

function onEmailaddressChanged()
{
  updateLoginButton();
}

function onPasswordChanged()
{
  updateLoginButton();
}

function updateLoginButton()
{
  // Allow login button, if the user entered both email address and password.
  // Also allow it, if no email address and no password are entered.
  eLoginButton.disabled = eFinishButton.disabled = !
    (ePassword.value && eEmailAddress.value ||
    !ePassword.value && !eEmailAddress.value);
}

function onLeaveEmailaddress()
{
  try {
    verifyAndShowError(false, function() {});
  } catch (e) { showErrorInline(e); }
}

/**
 * Calls verifyEmailAddressAndPassword() logic function, and
 * populates UI fields with the result.
 *
 * <copied from="login-dialog.js"/>
 */
function verifyAndShowError(needPassword, successCallback) {
  eErrorMsg.textContent = "";
  if (!eEmailAddress) // Not entering an email address is allowed
    return;
  // login-common.js
  // gVerifyAbortable.cancel(); TODO breaks all further verify calls. ditto below.
  gVerifyAbortable = verifyEmailAddressAndPassword(
      eEmailAddress.value, ePassword.value,
      needPassword, true,
  successCallback, showErrorInline);
}

function showErrorInline(errorMsg)
{
  debug("fail: " + errorMsg);
  eErrorMsg.textContent = errorMsg;
  eEmailAddress.focus();
}

// </copied>

function onLogin()
{
  if (!eEmailAddress.value && !ePassword.value) {
    closePage();
    return;
  }
  // Disable login button so it can't be double clicked
  eLoginButton.disabled = true;
  eFinishButton.disabled = true;
  var abortable = makeNewAccount(eEmailAddress.value.toLowerCase(),
  function(acc) // success
  {
    acc.setPassword(ePassword.value);
    acc.wantStoredLogin = eLongSession.checked;
    acc.login(0, true, function() // success
    {
      acc.saveToPrefs();
      closePage();
    },
    function(e) // error, e.g. wrong password
    {
      showErrorInline(e); // explicit user action, so notify user of errors
      acc.deleteAccount();
      acc = null;
      // We don't leave the page.
      // Even though there was an error, we reenable the button,
      // because our validation criteria is still met.
      eLoginButton.disabled = false;
      eFinishButton.disabled = false;
    });
  },
  function(e) // error, e.g. domain not supported or account already exists
  {
    showErrorInline(e);
    // Even though there was an error, we reenable the button since
    // Our validation criteria is still met
    eLoginButton.disabled = false;
  });
}

function onCloseButton()
{
  // gVerifyAbortable.cancel();
  // We don't need to confirm close in the branded browser case
  // or AMO
  if (ourPref.get("brandedbrowser", false) || kVariant == "amo")
    closePage();
  else
    optinConfirmClose(closePage);
}

function closePage()
{
  confirmClose = false;
  // Route to the firstrun page
  document.location.href = brand.toolbar.firstrunURL +
                "/?kid=" + ourPref.get("tracking.campaignid", 0);
}
