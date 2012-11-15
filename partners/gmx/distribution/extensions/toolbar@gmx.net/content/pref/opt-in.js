/**
 * This is a dialog (implemented as page displayed in the browser content
 * part, due to AMO rules) that's invoked on installation of the toolbar
 * (if not part of branded browser).
 *
 * It makes our search engine the default in the Firefox search field,
 * and our portal the homepage/startpage. It's opt-in (per AMO rules),
 * i.e. we do that only if the user explicitly checks the checkbox.
 *
 * Installation of our search plugin OSD file happens in search-plugin-install.js.
 * Here, we only set the default.
 *
 * Over time, this grew into a general installation questionaire.
 */
Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

var confirmClose = true;

function onLoad()
{
  window.onbeforeunload = function(e) {
    if (confirmClose)
      return confirmClose;
    else
      return;
  };
}

function onContinueButton()
{
  confirmClose = false;
  var searchengine = document.getElementById("searchengine").checked;
  var startpage = document.getElementById("startpage").checked;
  var newtab = document.getElementById("newtab").checked;

  //<copied from="pref-general.js (with modifications">
  if (searchengine)
  {
    var search = Cc["@mozilla.org/browser/search-service;1"]
        .getService(Ci.nsIBrowserSearchService);
    // sets pref "browser.search.selectedEngine" and notifies app
    try {
      search.currentEngine = search.getEngineByName(brand.search.engineName);
    } catch (ex) {
      // Fails on Mara
    }

    // URLbar search
    generalPref.set("keyword.URL", brand.search.keywordURL);
  }

  if (startpage)
  {
    if (document.getElementById("startpage-search").checked)
    {
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageURL);
    } else {
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageHomepageURL);
    }
  }
  //</copied>

  ourPref.set("newtab.enabled", newtab);

  document.location.href = "chrome://unitedtb/content/email/login-page.xhtml";
}

function onCloseButton()
{
  confirmClose = false;
  optinConfirmClose();
}
