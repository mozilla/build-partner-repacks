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
  try {
    var appcontent = E("appcontent");
    if (appcontent)
      appcontent.addEventListener("DOMContentLoaded", onPageLoad, false);
    // Special case for Google sites which don't reload the page, they
    // just change the hash on the URL
    window.addEventListener("hashchange", onHashChange, false);
  } catch(e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);

/**
 * Called on each web page load
 */
function onPageLoad(event)
{
  var doc = event.target;
  var win = doc.defaultView;
  // ignore frame loads
  if (win != win.top) {
    return;
  }

  try {
    if (!doc.location || !doc.location.hostname || !doc.location.search ||
        !brand.search.competitorlist[doc.location.hostname])
      return;

    var siteInfo = brand.search.competitorlist[doc.location.hostname];
    var queryParams = parseURLQueryString(doc.location.search);
    var term;
    if (Array.isArray(siteInfo)) {
      // suche.web.de can't decide on ?q= or ?su=
      for (var i=0; i < siteInfo.length; i++) {
        term = queryParams[siteInfo[i].query];
        if (term) {
          break;
        }
      }
    } else {
      term = queryParams[siteInfo.query];
    }
    if (term)
      notifyWindowObservers("search-term", { searchTerm : term, source : 10 });
  } catch(e) { errorNonCritical(e); }
}

/**
 * Called on Google search page when the search term changes.
 * For Google Instant, we parse the URL's # value to get the query
 */
function onHashChange()
{
  try {
    if ( !brand.search.googlelist[content.document.location.hostname]) {
      return;
    }
    var anchor = content.document.location.hash.substr(1);
    var queryParams = parseURLQueryString(anchor);
    var siteInfo = brand.search.competitorlist[content.document.location.hostname];
    var term = queryParams[siteInfo.query];
    if (term) {
      notifyWindowObservers("search-term", { searchTerm : term, source : 10 });
    }
  } catch(e) { errorNonCritical(e); }
}
