/**
 * This file contains functional facilities for the whole extension,
 * e.g. startup notification and uninstall handler.
 */

/**
 * Messages sent by this module, app-global:
 * "first-run"
 *    Means: First installation of extension.
 *       Really the very first time. Not on upgrade and not on re-installs.
 *    When: shortly after onInit after an install and the following browser restart.
 *       Do not load webpages yet, Firefox is not yet ready for that.
 *    Parameter: null
 * "upgrade"
 *    Means: Installation of extension (but not the first)
 *       Only when the version changed (lower or higher), not reinstall
 *    When: see first-run
 *    Parameter: null
 * "first-run-pageload"
 *    Means: Same as "first-run", but Firefox is ready to load webpages
 *      This is used for the opt-in page. Make sure not to overlay that.
 *    When: Firefox is settled
 * "uninstall"
 *   Means: Application is removed via Extension Manager
 *   When: User removes Application via Extension Manager
 * "reinstall"
 *   Means: The same version of the extension has been installed over itself
 *   When: The user clicked to install the extension, but before he restarts
 *         the browser to complete the install.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/build.js");
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/main/extension.properties");

// these are the various brands of this toolbar, and they conflict
// they are here for now because they can't be in brand.js because
// it replaces the mara toolbar ID with another ID
const ourEMIDs = [
  "toolbar@web.de",
  "toolbar@gmx.net",
  "toolbar@mail.com",
  "toolbar@1und1.de",
  "united.toolbar@mara.beonex.com"
];

/**
 * Runs when new browser window opens (because that loads this JS module),
 * but only once per app instance (because this is a JS module).
 */
function onLoadForInit()
{
  try {
    debug("startup");
    checkMultipleToolbars();
    checkForBrandedBrowser();
    waitForFirefox(); // calls onInstall()
    hookupUninstall();
  } catch (e) { errorInBackend(e); }
}

/**
 * onLoadForInit(), Firefox is not yet ready to load pages, so
 * we can't use doFirstRun() to load webpages,
 * but we have to wait for this event.
 *
 * Also, the runonce page wants information that the "first-run"
 * observers set, but the runonce page also needs to happen
 * before all other page loads in other observers, so
 * that is fixed by the separation of
 * "first-run" vs. "first-run-pageload" as well.
 */
function waitForFirefox()
{
    var obss = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);
    sessionRestoreObserve =  {
        observe: function(subject, topic, data)
        {
            try {
                onInstall();
            } catch (e) { errorInBackend(e); }
        }
    }
    obss.addObserver( sessionRestoreObserve,  "sessionstore-windows-restored" , false);

}

function hookupUninstall()
{ 
  // Extension Manager actions, used for uninstall. cancel
  var obss = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);
  if (Cc["@mozilla.org/extensions/manager;1"])
  {
    obss.addObserver(this.emAction, "em-action-requested", false);
  }
  else
  {
    Components.utils.import("resource://gre/modules/AddonManager.jsm");
    AddonManager.addAddonListener(emAction);
  }
  obss.addObserver(this.emAction, "quit-application-granted", false);
}

var emAction =
{
  _uninstall : false,
  observe : function (subject, topic, data) {
    try {
      if (topic == "em-action-requested") {
        subject.QueryInterface(Ci.nsIUpdateItem);
        if (subject.id == EMID) { // build.js
          if (data == "item-uninstalled") {
            this._uninstall = true;
            // Some XPCOM is not available at quit-application-granted time,
            // so we are showing the page here
            onUninstall();
          } else if (data == "item-cancel-action") {
            this._uninstall = false;
          }
        }
      } else if (topic == "quit-application-granted") {
        if (this._uninstall) {
          // You can do other actions here such as remove user preferences
          ourPref.reset("ext.firstrun");
        }
        this.unregister();
      }
    } catch (e) { errorInBackend(e); }
  },

  unregister : function() {
    var obss = Cc["@mozilla.org/observer-service;1"]
       .getService(Ci.nsIObserverService);
    obss.removeObserver(this, "em-action-requested");
    obss.removeObserver(this, "quit-application-granted");
  },

  onUninstalling: function(addon) {
    try {
      if (addon.id == EMID) {
        this._uninstall = true;
        onUninstall();
      }
    } catch (e) { errorInBackend(e); }
  },

  onOperationCancelled: function(addon) {
    if (addon.id == EMID) {
      this._uninstall = false;
    }
  },
  onInstalling: function(addon) {
    // The user is installing the same version of the extension over itself
    if (addon.id == EMID) {
      if (addon.version == getExtensionFullVersion()) {
        notifyGlobalObservers("reinstall", {});
      }
    }
  }
}

function onUninstall()
{
  notifyGlobalObservers("uninstall", {});
  findSomeBrowserWindow().unitedinternet.common.loadPage(brand.toolbar.uninstallURL, "tab");
}

function onInstall()
{
    // Check first-run / update
    var firstrun = ourPref.get("ext.firstrun");
    if (firstrun !== false) // non-existing returns undefined
      firstrun = true;
    var currentVersion = getExtensionFullVersion();
    if (firstrun)
    {
      ourPref.set("ext.firstrun", false);

      notifyGlobalObservers("first-run", {});

      // this loads opt-in pages and then first run page
      notifyGlobalObservers("first-run-pageload", {});
    }
    else
    {
        // non-existing returns undefined
        var lastVersion = ourPref.get("ext.currentversion");
        if (currentVersion != lastVersion)
        {
          findSomeBrowserWindow().unitedinternet.common.loadPage(brand.toolbar.upgradeURL, "tab");
          notifyGlobalObservers("upgrade", {
              lastVersion : lastVersion,
              currentVersion : currentVersion,
          });
        }
        // We don't want to remind them to configure the toolbar if there
        // is an upgrade page displayed
        else
        {
          if (ourPref.isSet("optin.reminder")) {
            var remindDate = ourPref.get("optin.reminder");
            var now = Math.round(new Date().getTime() / 1000);
            if (remindDate > now)
            {
              // If no accounts have been setup, remind them
              var accounts = {};
              Components.utils.import("resource://unitedtb/email/account-list.js", accounts);
              if (accounts.getAllExistingAccounts().length == 0) {
                notifyGlobalObservers("first-run-pageload", {});
              }
              // Reset the reminder pref. It will get set again by optin
              // if the user chooses.
              ourPref.reset("optin.reminder");
            }
          }
        }
    }
    ourPref.set("ext.currentversion", currentVersion);
}

 /**
  * We can't have several instances of this toolbar running at the same time,
  * because all the URLs and element IDs are the same.
  * The normal protection by AddonManager using EMID doesn't work,
  * because we use different EMIDs per brand.
 *
 * So, check for this situation here, and alert the user,
 * and let him uninstall the others.
 *
 * This code should run only once, not once per installed extension,
 * because it's a JS module and therefore single instance.
 * Which toolbar runs, however, is undefined.
 */
function checkMultipleToolbars()
{  
  if (Cc["@mozilla.org/extensions/manager;1"]) // FF3.6
  {
    /* We do nothing for Firefox 3.6 and lower */
  }
  else // FF4
  {
    var am = {};
    Components.utils.import("resource://gre/modules/AddonManager.jsm", am);
    am.AddonManager.getAddonsByIDs(ourEMIDs, function(addons)
    {
      try {
        var numAddons = 0;
        addons.forEach(function(addon)
        {
          if (addon)
            numAddons++;
        });
        if (numAddons == 1) {
          return;  // All fine
        }

        // show warning dialog. Asking user for permission to uninstall.
        var conflNames  = [];
        var conflIDs  = [];
        var myName = "";
        addons.forEach(function(addon) {
          if (!addon) {
            return;
          }
          if (addon.id == EMID) // me
          {
            myName = addon.name;
        }
          else
          {
            conflNames.push(addon.name);
            conflIDs.push(addon.id);
          }
        });
        assert(myName, "Couldn't find myself. ourEMIDs is missing my ID " + EMID);
        var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Ci.nsIPromptService);

        var aButtonFlags = (prompts.BUTTON_POS_0) * (prompts.BUTTON_TITLE_IS_STRING) +
                           (prompts.BUTTON_POS_1) * (prompts.BUTTON_TITLE_IS_STRING) +
                           prompts.BUTTON_POS_1_DEFAULT;

        var confirm = prompts.confirmEx(findSomeBrowserWindow(),
              gStringBundle.get("ext.conflict.title"),
              gStringBundle.get("ext.conflict.msg"),
              aButtonFlags,
              gStringBundle.get("ext.conflict.keep", [conflNames[0]]),
              gStringBundle.get("ext.conflict.keep", [myName]),
              null,
              null,
              {}
              );

        var addonToUninstall;
        if (confirm == 1) {
          addonToUninstall = conflIDs[0];
        } else {
          addonToUninstall = EMID;
        }
        addons.forEach(function(addon) {
          if (!addon) {
            return;
          }
          if (addon.id == addonToUninstall)
          {
            addon.uninstall();
          }
        });

        // try to restart, to effectuate the uninstall
        var appService = Cc["@mozilla.org/toolkit/app-startup;1"]
            .getService(Ci.nsIAppStartup)
        appService.quit(Ci.nsIAppStartup.eRestart |
            Ci.nsIAppStartup.eAttemptQuit); // asks in each window. TODO too nice?

      } catch (e) { errorInBackend(e); }
    });
  }
}

 /**
  * We dont' want the light version of the toolbar running
  * with vanilla Firefox. If we detect this, we tell the user to
  * upgrade to the branded browser.
  * We offer them a checkbox if they do not want to see the message again
 */
function checkForBrandedBrowser()
{
  var brandedBrowser = ourPref.get("brandedbrowser", false);
  var bundledToolbar = (kVariant == "browser");
  if (bundledToolbar && !brandedBrowser) {
    var browser = findSomeBrowserWindow();
    var noCoexistenceWarning = ourPref.get("noCoexistenceWarning", false);
    if (noCoexistenceWarning)
      return;
    var check = {value: false};
    var result = promptService.confirmCheck(browser,
                   gStringBundle.get("ext.bundle.title"),
                   gStringBundle.get("ext.bundle.message"),
                   gStringBundle.get("ext.bundle.checkbox"),
                   check);
    /* Save the value of the checkbox no matter what */
    if (check.value)
      ourPref.set("noCoexistenceWarning", true);
    /* Only show the install page for the bundle if they clicked OK */
    if (result)
      findSomeBrowserWindow().unitedinternet.common.loadPage(brand.toolbar.browserInstallURL, "window");
  }
}


runAsync(onLoadForInit);
