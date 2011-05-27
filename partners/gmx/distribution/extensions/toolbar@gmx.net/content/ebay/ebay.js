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
    united.loadPage(united.brand.ebay.searchURL +
        encodeURIComponent(currentSearchTerm));
  else
    united.loadPage(united.brand.ebay.portalURL);
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
