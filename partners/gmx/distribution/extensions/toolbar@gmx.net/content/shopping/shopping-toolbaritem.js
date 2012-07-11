/**
 * This implement the shopping button on our toolbar, for amazon, ebay etc.,
 * in a dropdown. The main button is the same as the last dropdown entry selected.
 */

/**
 * Messages observed:
 * "search-keypress", "search-started"
 *    Effect: Store the search term. When the user clicks on the button, use the term
 *       to search it in the page and highlight results and scroll to the first one.
 * Messages sent by this module:
 * "do-search-suggestions"
 *    Effect: disable search suggestions dropdown in highlight mode
 */

var shoppingButton = null;

// <copied to="highlight.js">
var currentSearchTerm = null;

function saveSearchTerm(object)
{
  if (object.source != 1) // only use terms from search field on our toolbar
    return;
  currentSearchTerm = object.searchTerm;
};

united.autoregisterWindowObserver("search-started", saveSearchTerm);
united.autoregisterWindowObserver("search-keypress", saveSearchTerm);
// </copied>


function onLoad(event)
{
  shoppingButton = document.getElementById("united-shopping-button");

  united.ourPref.reset("shopping.main"); // old
  // If there is only one entry in brand.js, don't show an arrow
  // or do anything with the menu
  if (united.brand.shopping.dropdownURLEntries.length == 1)
  {
    shoppingButton.removeAttribute("type");
    setMainButton(united.brand.shopping.dropdownURLEntries[0]);
  }
  else
  {
    // Get main item from prefs
    setMainButtonFromID(united.ourPref.get("shopping.mainID"));
    united.ourPref.observeAuto(window, "shopping.mainID", setMainButtonFromID);
    new united.appendBrandedMenuitems("shopping", "shopping", null, onMenuItemClicked);
  }
};
window.addEventListener("load", onLoad, false);

/**
 * @param entry {Object}  one element of united.brand.shopping.dropdownURLEntries
 */
function setMainButton(entry)
{
  shoppingButton.setAttribute("label", entry.label);
  shoppingButton.setAttribute("tooltiptext", entry.label);
  shoppingButton.setAttribute("image",
      "chrome://unitedtb/skin/shopping/" + entry.icon);
  shoppingButton.entry = entry;
}

/**
 * @param id {String}  united.brand.shopping.dropdownURLEntries[i].id
 */
function setMainButtonFromID(id)
{
  var entries = united.brand.shopping.dropdownURLEntries;
  for each (let entry in entries)
  {
    if (entry.id == id)
    {
      setMainButton(entry);
      return;
    }
  }
  // fallback
  if (entries.length > 0)
    setMainButton(entries[0]);
}

/**
 * @param entry {Object}  one element of
 *     united.brand.shopping.dropdownURLEntries or
 *     united.brand.shopping.singleButtons
 */
function onClicked(entry)
{
  var url = currentSearchTerm
      ? entry.searchURL + encodeURIComponent(currentSearchTerm)
      : entry.url;
  united.loadPage(url, "united-shopping");

  if (currentSearchTerm)
  {
    united.notifyWindowObservers("search-started",
      { searchTerm : currentSearchTerm, source : 1 });
  }
}

/**
 * @param entry {Object}  one element of
 *     united.brand.shopping.dropdownURLEntries
 */
function onMenuItemClicked(entry)
{
  onClicked(entry);
  //setMainButton(entry); -- called by pref observer
  // save it in prefs
  united.ourPref.set("shopping.mainID", entry.id);
}


/**
 * @param id {String}  united.brand.shopping.singleButtons[i].id
 *
function onSingleButtonClickedFromID(id)
{
  var entry = null;
  for each (let e in united.brand.shopping.singleButtons)
  {
    if (e.id == id)
    {
      entry = e;
      break;
    }
  }
  united.assert(entry, "Invalid shopping button ID " + id);

  onClicked(entry);
}
*/
