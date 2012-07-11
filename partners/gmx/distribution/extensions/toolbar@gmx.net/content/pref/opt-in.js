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


var united; // see onLoad()

function onLoad()
{
  var firefoxWindow = getTopLevelWindowContext();
  united = firefoxWindow.united;
}

function onCloseButton()
{
  var searchengine = document.getElementById("searchengine").checked;
  var startpage = document.getElementById("startpage").checked;
  var newtab = document.getElementById("newtab").checked;

  //<copied from="pref-general.js (with modifications">
  if (searchengine)
  {
    var search = united.Cc["@mozilla.org/browser/search-service;1"]
        .getService(united.Ci.nsIBrowserSearchService);
    // sets pref "browser.search.selectedEngine" and notifies app
    search.currentEngine = search.getEngineByName(united.brand.search.engineName);

    // URLbar search
    united.generalPref.set("keyword.URL", united.brand.search.keywordURL);
  }

  if (startpage)
  {
    if (document.getElementById("startpage-search").checked)
    {
      united.generalPref.set("browser.startup.homepage",
          united.brand.toolbar.startpageURL);
    } else {
      united.generalPref.set("browser.startup.homepage",
          united.brand.toolbar.startpageHomepageURL);
    }
  }
  //</copied>

  united.ourPref.set("newtab.enabled", newtab);

  window.close();
}
