/**
 * This file contains functional facilities for the whole extension,
 * e.g. startup notification and uninstall handler.
 */

/**
 * Messages sent by this module, app-global:
 * "init"
 *    Means: Application startup
 *    When: The first browser window opened, but not for subsequent new browser windows
 *    Parameter: null
 * "uninstall"
 *   Means: Application is removed via Extension Manager
 *   When: User removes Application via Extension Manager
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/build.js");

/**
 * Runs when new browser window opens (because that loads this JS module),
 * but only once per app instance (because this is a JS module).
 */
function onLoadForInit()
{
  try {
    debug("startup");
    setupFirstRun();
    hookupUninstall();
  } catch (e) { debug("ERROR in extension.js: " + e); }
}

function setupFirstRun()
{
    var obss = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);
    sessionRestoreObserve =  {
        observe: function(subject, topic, data)
        {
            doFirstRun();
            doUpgrade();
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
  observe : function (subject, topic, data)
  {
    if (topic == "em-action-requested")
    {
      subject.QueryInterface(Ci.nsIUpdateItem);
      if (subject.id == EMID) // build.js
      {
        if (data == "item-uninstalled")
        {
          this._uninstall = true;
          // Some XPCOM is not available at quit-application-granted time,
          // so we are showing the page here
          onUninstall();
        }
        else if (data == "item-cancel-action")
        {
          this._uninstall = false;
        }
      }
    }
    else if (topic == "quit-application-granted")
    {
      if (this._uninstall)
      {
        // You can do other actions here such as remove user preferences
        ourPref.reset("ext.firstrun");
      }
      this.unregister();
    }
  },

  unregister : function()
  {
    var obss = Cc["@mozilla.org/observer-service;1"]
       .getService(Ci.nsIObserverService);
    obss.removeObserver(this, "em-action-requested");
    obss.removeObserver(this, "quit-application-granted");
  },

  onUninstalling: function(addon)
  {
    if (addon.id == EMID) {
      this._uninstall = true;
      onUninstall();
    }
  },

  onOperationCancelled: function(addon)
  {
    if (addon.id == EMID) {
      this._uninstall = false;
    }
  }
}


function onUninstall()
{
  notifyGlobalObservers("uninstall", {});
  findSomeBrowserWindow().united.loadPage(brand.toolbar.uninstallURL, "tab");
}

function doFirstRun()
{
    // Check first-run / update
    var firstrun = ourPref.get("ext.firstrun");
    if (firstrun !== false) // non-existing returns undefined
      firstrun = true;
    var currentVersion = getExtensionFullVersion();
    if (firstrun)
    {
      ourPref.set("ext.firstrun", false);

      findSomeBrowserWindow().united.loadPage(brand.toolbar.firstrunURL, "tab");

      var isBrandedBrowser = ourPref.get("brandedbrowser") ? true : false;
      notifyGlobalObservers("first-run",
          { isBrandedBrowser : isBrandedBrowser });
    }
    else
    {
        // non-existing returns undefined
        var lastVersion = ourPref.get("ext.currentversion");
        if (currentVersion != lastVersion)
        {
          findSomeBrowserWindow().united.loadPage(brand.toolbar.upgradeURL, "tab");
        }
    }
    ourPref.set("ext.currentversion", currentVersion);
}

function doUpgrade()
{
  fixToolbarSet();
}

/**
 * We have to add toolbar items to <toolbarpalette> and via
 * <toolbar defaultset="">. However, the latter is copied to currentset=""
 * and this *not* updated on upgrade, i.e. new toolbar items never show up.
 * Work around this, by resetting currentset when defaultset changed.
 * <https://bugzilla.mozilla.org/show_bug.cgi?id=577822>
 * <http://84.16.230.222/projects/jai0wePh/ticket/131>
 */
function fixToolbarSet()
{
  try {
    var firefoxWin = findSomeBrowserWindow();
    var toolbar = firefoxWin.document.getElementById("united-toolbar");
    var defaultset = toolbar.getAttribute("defaultset");
    if (toolbar.getAttribute("last-defaultset") == defaultset)
      return; // defaultset didn't change (either no upgrade, or no new items)
    toolbar.currentSet = defaultset; // reset
    toolbar.setAttribute("currentset", defaultset); // :-(
    toolbar.setAttribute("last-defaultset", defaultset);
    // <http://mdn.beonex.com/en/Code_snippets/Toolbar>
    firefoxWin.document.persist("united-toolbar", "currentset"); // make sure we write to disk
    firefoxWin.document.persist("united-toolbar", "last-defaultset");
    try { // If you don't do the following call, funny things happen
      firefoxWin.BrowserToolboxCustomizeDone(true);
    } catch (e) { errorInBackend(e); }
  } catch (e) { errorInBackend(e); }
}


runAsync(onLoadForInit);
