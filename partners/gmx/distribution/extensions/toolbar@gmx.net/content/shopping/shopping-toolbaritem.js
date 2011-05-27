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

  // Get main item from prefs. index into array in brand.js.
  setMainButtonFromIndex(united.ourPref.get("shopping.main"));
  united.ourPref.observeAuto(window, "shopping.main", setMainButtonFromIndex);

  new united.appendBrandedMenuitems("shopping", "shopping", null, onItemClicked);
};
window.addEventListener("load", onLoad, false);

/**
 * @param i {Integer}  index of united.brand.shopping.dropdownURLEntries
 */
function setMainButtonFromIndex(i)
{
  setMainButton(united.brand.shopping.dropdownURLEntries[
      Math.min(i, united.brand.shopping.dropdownURLEntries.length) ]);
}

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
 * @param entry {Object}  one element of united.brand.shopping.dropdownURLEntries
 */
function onItemClicked(entry)
{
  var url = currentSearchTerm ?
    entry.searchURL + currentSearchTerm :
    entry.url;
  united.loadPage(url, "tab");

  setMainButton(entry);
  // save it in prefs. for that, get back index of current entry.
  for (let i = 0, l = united.brand.shopping.dropdownURLEntries.length; i < l; i++)
    if (entry == united.brand.shopping.dropdownURLEntries[i])
    {
      united.ourPref.set("shopping.main", i);
      //setMainButtonFromIndex(entry);
      break;
    }
}
