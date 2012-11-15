/**
 * Verify email address, esp. that it's a UnitedInternet address.
 * Shows an error to the user, if needed.
 * @returns null, if address OK, otherwise the error msg to display to the user
 */
function verifyEmailAddress(resetOnInvalid)
{
  united.debug("resetOnInvalid = " + resetOnInvalid);
  var textbox = document.getElementById("emailaddress");
  var newAddress = textbox.value.toLowerCase();
  if (!newAddress) // allow empty
    return null;
  var errorMsg = null;
  if (!new RegExp(united.brand.login.emailAddressPattern).test(newAddress))
    errorMsg = textbox.getAttribute("error-domain");
  const emailAddressRegexp = /[a-z0-9\-_\.]+@[a-z0-9\-\.]+/;
  if (!errorMsg && !emailAddressRegexp.test(newAddress))
    errorMsg = textbox.getAttribute("error-syntax");
  if (errorMsg && resetOnInvalid)
  {
    // setting textbox.value doesn't apply to pref when we close immediately afterwards
    document.getElementById("extensions.unitedinternet.login.emailAddress").value = "";
    errorMsg = null;
  }
  return errorMsg;
}

function onCreateAccount()
{
  united.loadPage(united.brand.login.createAccountURLWeb);
  window.close();
}
