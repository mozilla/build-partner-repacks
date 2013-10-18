Components.utils.import("resource://unitedtb/util/common-jsm.js");
Components.utils.import("resource://unitedtb/search/search-store.js");


var gUnitedFromAbove;
var gFirefoxWindow;
var gSearchField;
var gAutocomplete;

function onLoad()
{
  try {
    // We need to access the global unitedinternet.newtab object, so that our
    // observer notifications happen at the window level, but we can't,
    // because we are not in the browser scope. Get it from the browser window.
    gFirefoxWindow = getTopLevelWindowContext(window);
    gUnitedFromAbove = gFirefoxWindow.unitedinternet;

    gSearchField = E("searchterm");
    if (ourPref.get("newtab.setFocus"))
      gSearchField.focus();

    initAutocomplete();
  } catch (e) { errorCritical(e); }
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

function onSearchButtonClicked()
{
  try {
    startSearch(gSearchField.value);
  } catch (e) { errorCritical(e); }
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
