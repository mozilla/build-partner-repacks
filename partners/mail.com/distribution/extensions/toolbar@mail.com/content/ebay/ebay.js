/**
 * Messages observed:
 * "search-keypress", "search-started"
 *    Effect: Store the search term. When the user clicks on the button, use the term
 *       to search on Amazon and display results in a dropdown.
 *       Also, for testing: Display the search term.
 */

var gIconName;

/**
 * Use statistic class to change icon
 */
function onLoad()
{
  // Test which of 2 icons works better -- #1166
  if (brand.tracking &&
      (brand.tracking.brand == "webde" || brand.tracking.brand == "gmx") &&
      ourPref.get("tracking.statisticclass") < 25) {
    gIconName = "shoppingbag";
  } else {
    gIconName = "ebay";
  }
  E("united-ebay-button").setAttribute("icon", gIconName);
}
window.addEventListener("load", onLoad, false);

/**
 * User clicked on EBay button
 */
function onButton(event)
{
  try {
    if (false && currentSearchTerm) // #702
    {
      notifyWindowObservers("search-started",
        { searchTerm : currentSearchTerm, source : 1 });
      loadPage(brand.ebay.searchURL +
          encodeURIComponent(currentSearchTerm), "united-ebay");
    }
    else {
      var url = brand.ebay.portalURL;
      if (gIconName) {
        url += "?" + gIconName;
      }
      loadPage(url, "united-ebay");
    }
  } catch (e) { errorCritical(e); }
};

/**
 * User clicked on LastMinute button
 * HACK
 */
function onLastMinuteButton(event)
{
  try {
    if (false && currentSearchTerm) // #702
    {
      notifyWindowObservers("search-started",
        { searchTerm : currentSearchTerm, source : 1 });
      // NOTE: not encodeURIComponent() = UTF-(), but escape() = ISO-8859-1
      loadPage(brand.ebay.lastminuteSearchURL +
          window.escape(currentSearchTerm), "tab");
    }
    else
      loadPage(brand.ebay.lastminutePortalURL, "tab");
  } catch (e) { errorCritical(e); }
};

// <copied from="amazon.js">
var currentSearchTerm = null;

function saveSearchTerm(object)
{
  if (object.source != 1) // only use terms from search field on our toolbar
    return;
  currentSearchTerm = object.searchTerm;
};

autoregisterWindowObserver("search-started", saveSearchTerm);
autoregisterWindowObserver("search-keypress", saveSearchTerm);
// </copied>

/**
 * User clicked on Amazon button
 */
function onAmazonButton(event)
{
  try {
    loadPage(brand.amazon.portalURL, "tab");
  } catch (e) { errorCritical(e); }
};
