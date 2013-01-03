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
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/build.js");

/* The following function is used to call functions in both opt-in.js and
  login-page.js */

function onFinishButton() {
  // If we are branded browser, don't process optin options
  if (!ourPref.get("brandedbrowser", false))
    onOptin();
  onLogin();
}

function onOptinLoad()
{
  if (brand.regions.list.length < 2)
    document.getElementById("region-label").hidden = true;
  if (ourPref.get("brandedbrowser", false)) {
    document.getElementById("container").setAttribute("brandedbrowser", "true");
  }
  if (kVariant == "amo")
    document.getElementById("container").setAttribute("amo", "true");
}
window.addEventListener("load", onOptinLoad, false);

function onOptin()
{
  var searchengine = document.getElementById("searchengine").checked;

  var startpageSelectedID;
  var startpageRadioButtons = document.getElementsByName("startpage");
  for (var i = 0; i < startpageRadioButtons.length; i++) {
    if (startpageRadioButtons[i].checked) {
      startpageSelectedID = startpageRadioButtons[i].id;
      break;
    }
  }
  var newtab = document.getElementById("newtab").checked;

  //<copied from="pref-general.js (with modifications">
  if (searchengine)
  {
    // sets pref "browser.search.selectedEngine" and notifies app
    try {
      // nsIBrowserSearchService
      Services.search.currentEngine = Services.search.getEngineByName(brand.search.engineName);
    } catch (ex) {
      // Fails on Mara
    }

    // URLbar search
    generalPref.set("keyword.URL", brand.search.keywordURL);
  }

  switch (startpageSelectedID) {
    case "startpage-search":
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageURL);
      break;
    case "startpage-brand":
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageHomepageURL);
      break;
  }
  //</copied>

  ourPref.set("newtab.enabled", newtab);
}
