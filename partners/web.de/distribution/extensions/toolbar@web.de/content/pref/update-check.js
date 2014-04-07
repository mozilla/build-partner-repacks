Components.utils.import("resource://gre/modules/AddonManager.jsm");
var gStringBundle = new StringBundle("pref/pref-updates");

function check()
{
  AddonManager.getAddonByID(build.EMID, function(addon)
    {
      var listener = {
        onUpdateAvailable: function(aAddon, aInstall)
        {
          var confirm = promptService.confirm(window, gStringBundle.get("updates.title"),
                          gStringBundle.get("updateAvailable.msg"));
          if (confirm)
          {
            aInstall.install();
            var buttonFlags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING +
                              promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_IS_STRING;
            var check = {value: false};
            var confirmRestart = promptService.confirmEx(window,
                                  gStringBundle.get("updates.title"),
                                  gStringBundle.get("updatesRestart.msg"),
                                  buttonFlags,
                                  gStringBundle.get("updatesRestart.ok"),
                                  gStringBundle.get("updatesRestart.cancel"),
                                  null,
                                  null,
                                  check);
            if (confirmRestart == 0)
            {
              // nsIAppStartup
              Services.startup.quit(Services.startup.eRestart |
                                    Services.startup.eAttemptQuit);
            }
          }
        },
        onNoUpdateAvailable: function(aAddon)
        {
          promptService.alert(window, gStringBundle.get("updates.title"),
            gStringBundle.get("noUpdateAvailable.msg"))
        }
      };
      addon.findUpdates(listener, AddonManager.UPDATE_WHEN_USER_REQUESTED);
    });
}
