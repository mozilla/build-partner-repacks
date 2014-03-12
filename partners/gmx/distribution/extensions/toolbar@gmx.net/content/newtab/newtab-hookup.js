/**
 * This sets our page as newtab page in Firefox prefs.
 *
 * Messages reacted to by this module:
 * "uninstall"
 * "disable"
 *    Effect:
 *      Set prefs back to the default new tab page
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/common-jsm.js");

var ourNewTabURL;

function onLoad()
{
  if (brand.tracking &&
      brand.tracking.brand == "webde" &&
      ourPref.get("tracking.statisticclass") >= 96)
// We can't use the value from brand.js because it is a redirect and our
// URL selection won't work properly
//    ournewTabURL = brand.global.placeholder_GOTB + "newtab";
    ourNewTabURL = "http://suche.web.de/starthp?src=tb_newtab_ff,exp_nafs_treatment";
  else
    ourNewTabURL = ourPref.get("newtab.url");

  updateNewTabPagePref(ourPref.get("newtab.enabled"));
  ourPref.observe("newtab.enabled", updateNewTabPagePref);
  generalPref.observe("browser.newtab.url", updateNewTabPref);
}
runAsync(onLoad);

/**
 * If the user disables our new tab page, we need to reset the
 * browser.newtab.url value. We only want to reset it if it is
 * set to our value.
 */
function updateNewTabPagePref(ourNewTabEnabled) {
  if (ourNewTabEnabled) {
    generalPref.set("browser.newtab.url", ourNewTabURL);
  } else {
    if (generalPref.get("browser.newtab.url") == ourNewTabURL) {
      generalPref.reset("browser.newtab.url");
    }
  }
}

/**
 * If the new tab URL is changed by another application or the user, 
 * we want to turn off our preference since we are no longer the
 * new tab page. This will allow the user to turn us back on.
 */
function updateNewTabPref(newTabPage) {
  if (newTabPage != ourNewTabURL) {
    ourPref.set("newtab.enabled", false);
  }
}

/**
 * When we are uninstalled or disabled, we need to reset the new tab URL
 * if we are the ones that set it
 */
function cleanUpOnUninstall() {
  if (generalPref.get("browser.newtab.url") == ourNewTabURL) {
    ourPref.ignore("newtab.enabled", updateNewTabPagePref);
    generalPref.ignore("browser.newtab.url", updateNewTabPref);
    generalPref.reset("browser.newtab.url");
  }
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall" || msg == "disable")
      cleanUpOnUninstall();
  }
}
registerGlobalObserver(globalObserver);
