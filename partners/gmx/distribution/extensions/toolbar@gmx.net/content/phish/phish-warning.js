/**
 * Part of the anti-phishing module.
 * Used from phish-warning.xhtml.
 * This acts as a frontend to the whitelist
 * by adding new entries as request by the user.
 */

var united = {};
Components.utils.import("resource://unitedtb/util/util.js", united);
Components.utils.import("resource://unitedtb/util/globalobject.js", united);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", united);

function onload()
{
  initBrand();
}
window.addEventListener("load", onload, false);

function initBrand()
{
  // We do not seem to have an URL which will take us
  // directly to the search page, so use the value
  // of the placeholder which is just what we want.
  document.getElementById("search-button").setAttribute("href",
      united.brand.search.netErrorURL);
  document.getElementById("home-anchor").setAttribute("href",
      united.brand.toolbar.homepageURL);

}

/**
 * Adds the domain of the currently blocked 
 * phishing page to the whitelist.
 * Navigates to the blocked page
 * afterwards.
 *
 */
function whitelist()
{
  var URL = getURL();
  //united.debug("whitelist: got URL: " + URL);
  whitelistURL(URL);
  document.location = URL;
}

/**
 * Pushes domain of given URL to whitelist.
 *
 * @param URL {String} the URL whose domain is to be whitelisted
 */
function whitelistURL(URL)
{
  //united.debug("whitelist() called with url: " + URL);
  var host = getHost(URL);
  //united.debug("host: " + host);
  var whitelist = united.getGlobalObject("united", "whitelist");
  whitelist.push(host);
}

/**
 * Extracts hostname from string URL.
 * @param URL {String}
 * @return {String} hostname of the given URL
 */
function getHost(url)
{
  var wrapped = united.ioService.newURI(url, null, null);
  var host = wrapped.host;
  return host;
}
/**
 * Retrieves URL of blocked phishing page.
 * 
 */
// adapted from original firefox warning page
function getURL()
{
  var url = document.documentURI;
  var match = url.match(/\?u=([^&]+)/);
  // match == null if not found; if so, return an empty string
  // instead of what would turn out to be portions of the URI
  if (!match)
    return "";
  url = decodeURIComponent(match[1]);

  // If this is a view-source page, then get then real URI of the page
  if (/^view-source\:/.test(url))
    url = url.slice(12);
  //united.debug("extracted url: " + url);
  return url;
}

