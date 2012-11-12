/**
 * This sets our page as newtab page in Firefox prefs.
 * For Firefox 13 and higher.
 */

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
  ourPref.observeAuto(window, "newtab.enabled", updateNewTabPagePref);
  generalPref.observeAuto(window, "browser.newtab.url", updateNewTabPref);
  if (/^chrome:/.test(ourNewTabURL))
    // Pushing pages to gInitialPages, causes their URL not to be displayed
    // at all in the URL bar. This is convenient for users to type a new URL.
    // We only do this for chrome URLs.
    gInitialPages.push(ourNewTabURL);
  else
    hookupSelectURLinURLbar();
}
window.addEventListener("load", onLoad, false);

/**
 * Firefox does not highlight the URL in the URL bar when a new tab
 * is opened (bug 757455). This code works around that.
 */

function hookupSelectURLinURLbar() {
  var newTab = false;

  var FFBrowserOpenTab = BrowserOpenTab;
  function ourBrowserOpenTab()
  {
    FFBrowserOpenTab();
    newTab = true;
  }
  BrowserOpenTab = ourBrowserOpenTab;

  var FFURLBarSetURI = URLBarSetURI;
  function ourURLBarSetURI(aURI)
  {
    FFURLBarSetURI(aURI);
    if (newTab)
    {
      gURLBar.select();
      newTab = false;
    }
  }
  URLBarSetURI = ourURLBarSetURI;
}

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
* Reset the new tab page on uninstall.
* Only reset it if it is set to our value.
*/
function cleanUpOnUnInstall()
{
  if (generalPref.get("browser.newtab.url") == ourNewTabURL) {
    generalPref.reset("browser.newtab.url");
  }
}
registerGlobalObserver(
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall")
      cleanUpOnUnInstall();
  }
});

