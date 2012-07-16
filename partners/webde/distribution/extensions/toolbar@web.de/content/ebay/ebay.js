/**
 * Messages observed:
 * "search-keypress", "search-started"
 *    Effect: Store the search term. When the user clicks on the button, use the term
 *       to search on Amazon and display results in a dropdown.
 *       Also, for testing: Display the search term.
 */

/**
 * User clicked on EBay button
 */
function onButton(event)
{
  if (currentSearchTerm)
  {
    united.notifyWindowObservers("search-started",
      { searchTerm : currentSearchTerm, source : 1 });
    united.loadPage(united.brand.ebay.searchURL +
        encodeURIComponent(currentSearchTerm), "united-ebay");
  }
  else
    united.loadPage(united.brand.ebay.portalURL, "united-ebay");
};

/**
 * User clicked on LastMinute button
 * HACK
 */
function onLastMinuteButton(event)
{
  if (currentSearchTerm)
  {
    united.notifyWindowObservers("search-started",
      { searchTerm : currentSearchTerm, source : 1 });
    // NOTE: not encodeURIComponent() = UTF-(), but escape() = ISO-8859-1
    united.loadPage(united.brand.ebay.lastminuteSearchURL +
        window.escape(currentSearchTerm), "tab");
  }
  else
    united.loadPage(united.brand.ebay.lastminutePortalURL, "tab");
};

// <copied from="amazon.js">
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
