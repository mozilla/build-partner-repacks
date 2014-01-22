/**
 * Allow certain sites to recognize that the toolbar is installed.
 * Main purpose is to avoid ad impressions for the toolbar,
 * if the user already has the toolbar installed.
 *
 * The list of sites is brand.tracking.identifyMyselfToSites.
 *
 * We identify ourselves by adding custom attributes
 * on the document element, i.e. <html
 * united-toolbar-brand="webde" / "gmx"
 * united-toolbar-version="1.6.1"
 * united-toolbar-variant="maximized" / "minimized" / "bundle" / "amo" / "dev"
 * united-toolbar-branded-browser="true" / "false"
 * >
 *
 * Implemented by
 * - adding a tab listener, and acting on DOMContentLoaded event.
 * - setting HTML/XML attributes on the document element (this is safest).
 *
 * <copied to="search/inject-psh.js">
 */

var build = {}
Components.utils.import("resource://unitedtb/build.js", build);

// cache
var gBrand = null;
var gVersion = null;
var gVariant = null;
var gBrandedBrowser = null;
var gCampaignID = null;

function onLoad()
{
  try {
    window.removeEventListener("DOMContentLoaded", onLoad, false);
    assert(typeof(brand.tracking.identifyMyselfToSites) == "object" &&
        brand.tracking.identifyMyselfToSites.length);

    gBrand = brand.tracking.brand;
    gVersion = build.version;
    gVariant = build.kVariant;
    if (gVariant == "browser")
      gVariant = "bundle";
    else if (gVariant == "release")
      gVariant = "maximized";
    else if (gVariant == "minimode")
      gVariant = "minimized";
    gBrandedBrowser = ourPref.get("brandedbrowser", false);
    debug("brand " + gBrand + ", version " + gVersion +
        ", variant " + gVariant + ", branded browser " + gBrandedBrowser);

    E("appcontent")
        .addEventListener("DOMContentLoaded", pageLoaded, false);
  } catch(e) { errorNonCritical(e); }
}
// on load fires too late for URLs passed on the firefox commandline
window.addEventListener("DOMContentLoaded", onLoad, false);

/**
 * @param doc {DOMDocument}
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

    var el = doc.documentElement;
    // some protection, against unexpectedly breaking stuff:
    // site needs to already have the attribute with dummy content,
    // before we set the attributes
    if ( !el || !el.hasAttribute("united-toolbar-brand"))
      return;
    if (!gCampaignID) {
      gCampaignID = ourPref.get("tracking.campaignid", 0);
    }

    el.setAttribute("united-toolbar-brand", gBrand);
    el.setAttribute("united-toolbar-version", gVersion);
    el.setAttribute("united-toolbar-variant", gVariant);
    el.setAttribute("united-toolbar-branded-browser", gBrandedBrowser);
    el.setAttribute("united-toolbar-campaignid", gCampaignID);
  } catch (e) { errorNonCritical(e); }
}
