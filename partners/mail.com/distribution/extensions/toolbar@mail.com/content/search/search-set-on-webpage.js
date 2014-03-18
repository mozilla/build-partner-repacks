/**
 * This listens for search website page loads and
 * unhides an opt-in button on the page,
 * to make us the Firefox default search engine, if we're not already.
 */

Components.utils.import("resource://gre/modules/Services.jsm");

/**
 * Called on Firefox window load
 */
function onLoad()
{
  try {
    E("appcontent").addEventListener("DOMContentLoaded", onPageLoad, false);
  } catch(e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);

/**
 * Called on each web page load
 */
function onPageLoad(event)
{
  // If we are the default search engine, no need to do anything
  if (Services.search.currentEngine.name == brand.search.engineName) {
    return;
  }

  //<copied from="tracking/identifyMyselfToSite.js">
  try {
    var doc = event.target;
    assert(doc instanceof Ci.nsIDOMDocument);
    var uri = doc.documentURIObject;
    // Ignore about URLs
    if ( ! (uri instanceof Ci.nsIStandardURL))
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
    if ( !hit)
      return;
    //</copied>

    var pageUI = doc.getElementById("united-toolbar-set-search");
    if ( !pageUI) {
      return;
    }
    pageUI.hidden = false;
    pageUI.addEventListener("click", setDefaultSearchEngine, false);
  } catch (e) { errorNonCritical(e); }
}

// <copied from="pref-search.js"/>
function setDefaultSearchEngine() {
  try {
    var engine = Services.search.getEngineByName(brand.search.engineName);
    if (engine) {
      engine.hidden = false;
      // sets pref "browser.search.selectedEngine" and notifies app
      Services.search.currentEngine = engine;
    } else {
      notifyGlobalObservers("install-searchengines", {});
    }
  } catch (e) {
    errorNonCritical(e);
  }

  ourPref.set("search.opt-in", true);
}
