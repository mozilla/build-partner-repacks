Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/search/search-store.js");


var gUnitedFromAbove;
var gFirefoxWindow;
var gSearchField;
var gAutocomplete;

function onLoad()
{
  // We need to access the global unitedinternet.newtab object, so that our
  // observer notifications happen at the window level, but we can't,
  // because we are not in the browser scope. Get it from the browser window.
  gFirefoxWindow = getTopLevelWindowContext(window);
  gUnitedFromAbove = gFirefoxWindow.unitedinternet;

  gSearchField = document.getElementById("searchterm");
  if (ourPref.get("newtab.setFocus"))
    gSearchField.focus();

  initAutocomplete();
}
window.addEventListener("load", onLoad, false);

function initAutocomplete()
{
  Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js", this);
  loadJS("chrome://unitedtb/content/util/AutoComplete.js", this);
  loadJS("chrome://unitedtb/content/search/mcollect/mAutocompleteSource.js", this);

  gAutocomplete = new AutocompleteWidget(gSearchField, { xul: false });
  gAutocomplete.addSource(new mCollectAutocompleteSource(gAutocomplete, gFirefoxWindow));
}

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  gUnitedFromAbove.common.notifyWindowObservers("search-keypress",
      { searchTerm : event.target.value, source : 4 });
};

/**
 * Fired when the user presses RETURN in the text box.
 */
function onSearchTextEntered()
{
  startSearch(gSearchField.value);
};

function onSearchButtonClicked()
{
  startSearch(gSearchField.value);
};

/**
 * Searches for the term, by loading a page in the browser.
 * Called from our search field on the newtab page
 * (not from clicks on stored search terms).
 */
function startSearch(searchTerm)
{
  searchTerm = searchTerm.trim().replace(/\s+/g, " ");
  gSearchField.value = searchTerm;
  gUnitedFromAbove.common.notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 4 });
  loadPage(brand.search.newTabURL +
      encodeURIComponent(searchTerm));
};
// </copied>
