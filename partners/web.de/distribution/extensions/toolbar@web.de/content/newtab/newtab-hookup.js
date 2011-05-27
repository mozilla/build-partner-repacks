// Idea from Mozilla Lab's "Auto Dial" extension
// <https://addons.mozilla.org/de/firefox/addon/8615>
// It's a HACK, though.
// This should really be in Firefox browser.js.
// See bug 561749 <https://bugzilla.mozilla.org/show_bug.cgi?id=561749>
// for that.

// Overwrite Firefox functions :-(
eval(BrowserOpenTab.toSource()
    .replace(/"about:blank"/g, "newTabURL")
    .replace(/{/, "{ var newTabURL = United_NewTabURL();"));

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
