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
  window.removeEventListener("DOMContentLoaded", onLoad, false);

  document.getElementById("appcontent")
      .addEventListener("DOMContentLoaded", pageLoaded, false);
}
window.addEventListener("DOMContentLoaded", onLoad, false);

/**
 * @param event {Event}
 */
function pageLoaded(event)
{
  var doc = event.target;
  assert(doc instanceof Ci.nsIDOMDocument);
  var browser = top.gBrowser.getBrowserForDocument(doc);
  if (! browser) // happens a lot, probably sub-frames and chrome events
    return;
  var uri = browser.currentURI;
  if (! (uri &&
          (uri.scheme == "http" || uri.scheme == "https") &&
          uri.host))
    return;
  var host = uri.host; // TODO throws
  //debug("loaded page from " + browser.currentURI.host);
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
}
