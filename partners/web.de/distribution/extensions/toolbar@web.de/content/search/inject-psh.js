/**
 * Inject personal search history into any of our own websites that have
 * an element with ID="united-toolbar-psh-container".
 *
 * Implemented by
 * - adding a tab listener, and acting on DOMContentLoaded event
 * - injecting HTML in the page
 *
 * <copied from="tracking/identifyMyselfToSite.js">
 */

Components.utils.import("resource://unitedtb/search/search-store.js", this);

function onLoad()
{
  try {
    window.removeEventListener("DOMContentLoaded", onLoad, false);

    E("appcontent").addEventListener("DOMContentLoaded", pageLoaded, false);
  } catch (e) { errorCritical(e); }
}
window.addEventListener("DOMContentLoaded", onLoad, false);

/**
 * @param event {Event}
 */
function pageLoaded(event)
{
  try {
    var doc = event.target;
    assert(doc instanceof Ci.nsIDOMDocument);
    var uri = doc.documentURIObject;
    // Ignore about URLs
    if (! (uri instanceof Ci.nsIStandardURL))
      return;
    // Ignore chrome URLs
    if (uri.scheme != "http" && uri.scheme != "https")
      return;
    var host = uri.host;
    //debug("loaded page from " + uri.host);
    var hit = brand.tracking.identifyMyselfToSites.some(function(domain)
    {
      return domain == host ||
          host.substr(host.length - domain.length - 1) == "." + domain;
    });
    if (! hit)
      return;
    var unitedPSHContainer = doc.getElementById("united-toolbar-psh-container");
    if (!unitedPSHContainer)
      return;
    getLastSearches(10, function(terms) // search-store.js
    {
      for each (let term in terms)
      {
        var item = doc.createElement("li");
        var link = doc.createElement("a");
        var url = brand.search.injectPSHURL + encodeURIComponent(term);
        link.setAttribute("href", url);
        link.appendChild(doc.createTextNode(term));
        item.appendChild(link);
        unitedPSHContainer.appendChild(item);
      }
    },
    error);
  } catch (e) { errorNonCritical(e); }
}
