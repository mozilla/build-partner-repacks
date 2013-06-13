/**
 * This listens for page loads and checks to see if the URLs correspond to
 * competitor searches.
 * If they do, we grab the keyword and populate our toolbar.
 *
 */

/**
 * Messages sent:
 * "search-term" with source = 10
 * @see search-toolbaritem.js
 *   When: User searches on a competitor's search website
 *   Effect: Search term is placed in our toolbar's search field,
 *     but search is not triggered,
 *     nor is it added to personal search history.
 */

/**
 * Called on Firefox window load
 */
function onLoad()
{
  var appcontent = document.getElementById("appcontent");
  if (appcontent)
    appcontent.addEventListener("DOMContentLoaded", onPageLoad, false);
  // Special case for Google sites which don't reload the page, they
  // just change the hash on the URL
  window.addEventListener("hashchange", onHashChange, false);
}
window.addEventListener("load", onLoad, false);

/**
 * Called on each web page load
 */
function onPageLoad(event)
{
  var doc = event.target;
  if (!doc.location.hostname || !doc.location.search ||
      !brand.search.competitorlist[doc.location.hostname])
    return;

  var siteInfo = brand.search.competitorlist[doc.location.hostname];
  var queryParams = parseURLQueryString(doc.location.search);
  var term = queryParams[siteInfo.query];
  if (term)
    notifyWindowObservers("search-term", { searchTerm : term, source : 10 });
}

/**
 * Called on Google search page when the search term changes.
 * For Google Instant, we have to query the text field directly.
 */
function onHashChange()
{
  if (!brand.search.googlelist[content.document.location.hostname] ||
      !content.document.getElementById("gbqfq"))
    return;
  var term = content.document.getElementById("gbqfq").value;
  notifyWindowObservers("search-term", { searchTerm : term, source : 10 });
}
