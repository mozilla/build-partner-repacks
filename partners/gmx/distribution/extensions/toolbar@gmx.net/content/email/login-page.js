/* Unique code for handling the login page */

var confirmClose = true;
var eLoginButton;

// Used for the login page
function onPageLoad()
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

  document.getElementById("forgot-password").setAttribute("href", brand.login.forgotPasswordURL);
  document.getElementById("create-account").setAttribute("href", brand.login.createAccountURLWeb);
}

function onPasswordChanged()
{
  if (ePassword.value)
    eLoginButton.disabled = false;
  else
    eLoginButton.disabled = true;
}

function onLoginButtonClicked()
{
  // Disable login button so it can't be double clicked
  eLoginButton.disabled = true;
  try {
    var acc = makeNewAccount(eEmailAddress.value);
  } catch (ex) {
    errorCritical(ex);
    // Even though there was an error, we reenable the button since
    // Our validation criteria is still met
    eLoginButton.disabled = false;
    return;
  }
  acc.setPassword(ePassword.value);
  acc.wantStoredLogin = eLongSession.checked;
  acc.login(0, true,
    function() // success
    {
      confirmClose = false;
      acc.saveToPrefs();
      document.location.href = brand.toolbar.firstrunURL;
    },
    function(e) // error handler, e.g. wrong password
    {
      errorCritical(e); // explicit user action, so notify user of errors
      acc.deleteAccount();
      acc = null;
      // We don't leave page
      // Even though there was an error, we reenable the button since
      // Our validation criteria is still met
      eLoginButton.disabled = false;
    });
}

function onCloseButton()
{
  confirmClose = false;
  optinConfirmClose();
}
