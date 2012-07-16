// Idea from Mozilla Lab's "Auto Dial" extension
// <https://addons.mozilla.org/de/firefox/addon/8615>
// It's a HACK, though.
// This should really be in Firefox browser.js.
// See bug 561749 <https://bugzilla.mozilla.org/show_bug.cgi?id=561749>
// for that.

/* Here we are checking if the browser.newtab.url preference exists at all.
   This allows us to only enable this code for Firefox 12 and beyond. */
  var haveFirefoxNewTab = united.generalPref.has("browser.newtab.url");

/**
 * If the user disables our new tab page, we need to reset the
 * browser.newtab.url value. We only want to reset it if it is
 * set to our value.
 */
function updateNewTabPagePref(ourNewTabEnabled) {
  if (ourNewTabEnabled) {
    united.generalPref.set("browser.newtab.url", united.ourPref.get("newtab.url"));
  } else {
    if (united.generalPref.get("browser.newtab.url") ==
        united.ourPref.get("newtab.url")) {
      united.generalPref.reset("browser.newtab.url");
    }
  }
}

/**
 * If the new tab URL is changed by another application or the user, 
 * we want to turn off our preference since we are no longer the
 * new tab page. This will allow the user to turn us back on.
 */
function updateNewTabPref(newTabPage) {
  if (newTabPage != united.ourPref.get("newtab.url")) {
    united.ourPref.set("newtab.enabled", false);
  }
}

if (haveFirefoxNewTab) {
  updateNewTabPagePref(united.ourPref.get("newtab.enabled"));
  united.ourPref.observeAuto(window, "newtab.enabled", updateNewTabPagePref);
  united.generalPref.observeAuto(window, "browser.newtab.url", updateNewTabPref);
  var newTabURL = gPrefService.getCharPref("extensions.unitedinternet.newtab.url");
  // gInitialPages is from Firefox browser.js. Hides the chrome:// in the URLbar.
  // Allows user to type another URL conveniently.
  gInitialPages.push(newTabURL);
} else {
  // Overwrite Firefox functions :-(
  eval(BrowserOpenTab.toSource()
      .replace(/"about:blank"/g, "newTabURL")
      .replace(/BROWSER_NEW_TAB_URL/g, "newTabURL")
      .replace(/{/, "{ var newTabURL = United_NewTabURL();"));
}

function United_NewTabURL()
{
  var newTabURL = "about:blank";
  try {
    if (gPrefService.getBoolPref("extensions.unitedinternet.newtab.enabled"))
    {
      newTabURL = gPrefService.getCharPref("extensions.unitedinternet.newtab.url");
      if (gInitialPages.indexOf(newTabURL) == -1 &&
          (newTabURL.substr(0, 7) == "chrome:" ||
           newTabURL.substr(0, 6) == "about:"))
        gInitialPages.push(newTabURL);
    }
  } catch (e) {}
  return newTabURL;
}
