var gToolbar;
var search;

function onLoad()
{
  // toolbar icon mode
  var iconModeDropdown = document.getElementById("general-toolbarmode");
  // HACK: Calls our function in Firefox window directly.
  // Need function calls with return value in messaging system.
  var firefoxWindow = united.findSomeBrowserWindow();
  iconModeDropdown.value = firefoxWindow.united.toolbar.getCurrentToolbarMode();

  // search and homepage checkboxen
  search = united.Cc["@mozilla.org/browser/search-service;1"]
      .getService(united.Ci.nsIBrowserSearchService);
  document.getElementById("general-search-checkbox")
      .checked = isSearchEnabled();
  document.getElementById("general-homepage-checkbox")
      .checked = isHomepageEnabled();
}
window.addEventListener("load", onLoad, false);

function onChangedToolbarMode(newMode)
{
  //gToolbar.setAttribute("mode", newMode);
  //gToolbar.ownerDocument.persist(gToolbar.id, "mode");
  united.notifyGlobalObservers("do-customize-toolbar", { mode : newMode });
}

function isSearchEnabled()
{
  return search.currentEngine.name == united.brand.search.engineName;
}

function isHomepageEnabled()
{
  return united.generalPref.get("browser.startup.homepage") ==
        united.brand.toolbar.startpageURL;
}

//<copied to="opt-in.js (with modifications">
function onSearchChanged(newValue)
{
  if (newValue) // turned on, set us as search engine
  {
    // sets pref "browser.search.selectedEngine" and notifies app
    search.currentEngine = search.getEngineByName(
        united.brand.search.engineName);

    // URLbar search
    united.generalPref.set("keyword.URL", united.brand.search.keywordURL);
  }
  else // turned off, restore default
  {
    search.currentEngine = search.defaultEngine;
    united.generalPref.reset("keyword.URL");
  }
}

function onHomepageChanged(newValue)
{
  if (newValue) // turned on, set us as homepage
  {
    united.generalPref.set("browser.startup.homepage",
        united.brand.toolbar.startpageURL);
  }
  else // turned off, restore default
  {
    united.generalPref.reset("browser.startup.homepage");
  }
}
//</copied>
