/**
 * Allow certain sites to recognize that the toolbar is installed.
 * Main purpose is to avoid ad impressions for the toolbar,
 * if the user already has the toolbar installed.
 *
 * The list of sites is united.brand.tracking.identifyMyselfToSites.
 *
 * We identify ourselves by adding custom attributes
 * on the document element, i.e. <html
 * united-toolbar-brand="webde" / "gmx"
 * united-toolbar-version="1.6.1"
 * united-toolbar-variant="full" / "bundle" / "amo" / "dev"
 * united-toolbar-branded-browser="true" / "false"
 * >
 *
 * Implemented by
 * - adding a tab listener, and acting on DOMContentLoaded event.
 * - setting HTML/XML attributes on the document element (this is safest).
 */

var build = {}
Components.utils.import("resource://unitedtb/build.js", build);

// cache
var gBrand = null;
var gVersion = null;
var gVariant = null;
var gBrandedBrowser = null;

function onLoad()
{
  window.removeEventListener("DOMContentLoaded", onLoad, false);
  united.assert(typeof(united.brand.tracking.identifyMyselfToSites) == "object" &&
      united.brand.tracking.identifyMyselfToSites.length);

  gBrand = united.brand.tracking.brand;
  gVersion = build.version;
  gVariant = build.kVariant;
  if (gVariant == "browser")
    gVariant = "bundle";
  else if (gVariant == "release")
    gVariant = "full";
  gBrandedBrowser = united.ourPref.get("brandedbrowser", false);
  united.debug("brand " + gBrand + ", version " + gVersion +
      ", variant " + gVariant + ", branded browser " + gBrandedBrowser);

  document.getElementById("appcontent")
      .addEventListener("DOMContentLoaded", pageLoaded, false);
}
// on load fires too late for URLs passed on the firefox commandline
window.addEventListener("DOMContentLoaded", onLoad, false);

/**
 * @param doc {DOMDocument}
 */
function pageLoaded(event)
{
  var doc = event.target;
  united.assert(doc instanceof Ci.nsIDOMDocument);
  var browser = top.gBrowser.getBrowserForDocument(doc);
  if (! browser) // happens a lot, probably sub-frames and chrome events
    return;
  var uri = browser.currentURI;
  if (! (uri &&
          (uri.scheme == "http" || uri.scheme == "https") &&
          uri.host))
    return;
  var host = uri.host; // TODO throws
  //united.debug("loaded page from " + browser.currentURI.host);
  var hit = united.brand.tracking.identifyMyselfToSites.some(function(domain)
  {
    return domain == host ||
        host.substr(host.length - domain.length - 1) == "." + domain;
  });
  if (! hit)
    return;

  var el = doc.documentElement;
  // some protection, against unexpectedly breaking stuff:
  // site needs to already have the attribute with dummy content,
  // before we set the attributes
  if ( !el.hasAttribute("united-toolbar-brand"))
    return;

  el.setAttribute("united-toolbar-brand", gBrand);
  el.setAttribute("united-toolbar-version", gVersion);
  el.setAttribute("united-toolbar-variant", gVariant);
  el.setAttribute("united-toolbar-branded-browser", gBrandedBrowser);
}
