var gOptInBundle = new StringBundle(
    "chrome://unitedtb/locale/pref/opt-in.properties");

function optinConfirmClose()
{
  var aButtonFlags = (promptService.BUTTON_POS_0) * (promptService.BUTTON_TITLE_YES) +
                     (promptService.BUTTON_POS_1) * (promptService.BUTTON_TITLE_NO) +
                      promptService.BUTTON_POS_1_DEFAULT;
  var check = {value: true};
  var confirm = promptService.confirmEx(window,
                                        gOptInBundle.get("confirm.title"),
                                        gOptInBundle.get("confirm.message"),
                                        aButtonFlags,
                                        null,
                                        null,
                                        null,
                                        gOptInBundle.get("confirm.reminder"),
                                        check
                                        );
  if (confirm == 0)
  {
    if (check.value)
    {
      var now = Math.round(new Date().getTime() / 1000);
      now += 7*24*60*60; //7 days
      ourPref.set("optin.reminder", now);
    }
    else
      ourPref.reset("optin.reminder");

    // Route to the firstrun page
    document.location.href = brand.toolbar.firstrunURL +
                             "/?kid=" + ourPref.get("tracking.campaignid", 0);
;
  }
}
