Components.utils.import("resource://gre/modules/Services.jsm");
importJSM("email/account-list.js", this);
var gStringBundle = new StringBundle("email/login");

var eEmailAddress;
var ePassword;
var eLongSession;
var eErrorMsg;
var eLoginButton;
var eFinishButton;

var gVerifyAbortable = new Abortable();
var confirmClose = true;

function onLoginLoad()
{
  try {
    window.onbeforeunload = function(e) {
      if (confirmClose)
        return confirmClose;
      else
        return;
    };

    eEmailAddress = E("emailaddress");
    ePassword = E("password");
    eLongSession = E("long-session");
    eErrorMsg = E("error-msg");
    eLoginButton = E("login-button");
    eFinishButton = E("finish-button");

    E("forgot-password").setAttribute("href", brand.login.forgotPasswordURL);
    E("create-account").setAttribute("href", brand.login.createAccountURLWeb);

    updateLoginButton();

    // Allow enter key to work
    document.addEventListener("keypress", function(event) {
      if (event.keyCode == 13)
        E("finish-button").click();
    }, false);

    eEmailAddress.focus();
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoginLoad, false);

function onEmailaddressChanged()
{
  try {
    updateLoginButton();
  } catch (e) { errorNonCritical(e); }
}

function onPasswordChanged()
{
  try {
    updateLoginButton();
  } catch (e) { errorNonCritical(e); }
}

function updateLoginButton()
{
  // Allow login button, if the user entered both email address and password.
  // Also allow it, if no email address and no password are entered.
  eLoginButton.disabled = eFinishButton.disabled = !
    (ePassword.value && eEmailAddress.value ||
    !ePassword.value && !eEmailAddress.value);
  // If we have an email address, change the button to say "Login"
  // Otherwise change it to "Finish"
  // We do this by having multiple attributes on the finish button that
  // designate the various states. This allows us to avoid properties files.
  if (eEmailAddress.value)
    eFinishButton.textContent = eFinishButton.getAttribute("login-label");
  else
    eFinishButton.textContent = eFinishButton.getAttribute("finish-label");
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
      needPassword, true, true,
  successCallback, showErrorInline);
}

function showErrorInline(e)
{
  errorNonCritical(e);
  eErrorMsg.textContent = e.toString();
  eEmailAddress.focus();
}

// </copied>

function onLogin(closeCallback)
{
  try {
    assert(typeof(closeCallback) == "function");
    if (!eEmailAddress.value && !ePassword.value) {
      closePage(closeCallback);
      return;
    }
    verifyAndShowError(false, function() { onLoginStep2(closeCallback); });
  } catch (e) { showErrorInline(e); }
}

function onLoginStep2(closeCallback)
{
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
      closePage(closeCallback);
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

function onCloseButton(closeCallback)
{
  try {
    assert(typeof(closeCallback) == "function");
    // If confirmClose is false, don't show the nag screen
    if (confirmClose)
      optinConfirmClose(function() { closePage(closeCallback); });
    else
      closePage(closeCallback);
  } catch (e) { errorCritical(e); }
}

function closePage(closeCallback)
{
  confirmClose = false;
  closeCallback();
}
