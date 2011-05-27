/**
 * Shows a login prompt, with email address and password input fields.
 * Also a [ ] Remember checkbox and [ Register now ] button.
 * Called by login.js getEmailAddressAndPassword().
 */

var united = window.opener.united;
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

  var inparams = window.arguments[0];
  gOutParams = window.arguments[1];
  eEmailAddress.value = inparams.emailAddress;
  eLongSession.checked = inparams.longSession;
  (inparams.emailAddress ? ePassword : eEmailAddress).focus();
}

function onLeaveEmailaddress()
{
  verifyEmailAddressAndShowError();
}

function verifyEmailAddressAndShowError()
{
  var errorMsg = verifyEmailAddress(false); // login-dialogs.js, also reads eEmailAddress
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
  if (!verifyEmailAddressAndShowError())
    return false; // don't close, force user to click Cancel

  gOutParams.emailAddress = eEmailAddress.value.toLowerCase();
  gOutParams.password = ePassword.value;
  gOutParams.longSession = eLongSession.checked;
  gOutParams.ok = true;
  return true;
}

function onCancel()
{
  gOutParams.ok = false;
  return true;
}
