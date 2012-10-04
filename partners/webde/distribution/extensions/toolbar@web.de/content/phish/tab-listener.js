/**
* Anti-Phishing module.
* This part hooks into the user interface and checks
* what URLs are being loaded.
*
* If a bad URL is requested, the request is aborted
* and the user is sent to a warning page.
*/

Components.utils.import("resource://unitedtb/phish/database.js", this);

function onLoad()
{
  window.removeEventListener("DOMContentLoaded", onLoad, false);
  top.gBrowser.addTabsProgressListener(webTabProgressListener);
}
// on load fires too late for URLs passed on the firefox commandline
// This is an important use-case for phishing links from email apps.
window.addEventListener("DOMContentLoaded", onLoad, false);

/**
 * The webProgressListener listens for location changes and
 * fires off a blacklist check.
 */
var webTabProgressListener =
{
  /**
   * <http://mdn.beonex.com/En/Listening_to_events_on_all_tabs>
   * @param browser {DOMElement <xul:browser>}
   */
  onStateChange : function(browser, webProgress, request, stateFlags, status)
  {
    try {
      //debug("onStateChanged called");
      // TODO think carefully about what we want listen for.
      // we want to interrupt loading of bad url as early as possible
      // so we look for STATE_START and STATE_REDIRECTING,
      // the semantics of STATE_REDIRECTING are not entirely clear to me,
      // but surely looking at redirects is what we want to do.
      //
      // TODO we're only looking at "state transition" flags, while ignoring
      // "state type" flags which could be used to distinguish document
      // requests from e.g. image requests.
      // Also see onLocationChange()
      if (! (stateFlags & Ci.nsIWebProgressListener.STATE_START ||
            stateFlags & Ci.nsIWebProgressListener.STATE_REDIRECTING))
        return;

      try {
        request = request.QueryInterface(Ci.nsIChannel);
      } catch (e) {
        //debug("request is not a channel");
        return;
      }
      let uri = request.URI;
      //debug("uri requested: " + uri.spec);
      checkBlacklisted(uri, browser, request);
    } catch (e) { errorInBackend(e); }
  },
  onLocationChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {}, 
  onSecurityChange: function() {},
  onLinkIconAvailable: function() {},
  // it's not a real Ci.nsIWebProgressListener
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupportsWeakReference])
}

/**
 * Checks whether a given URL is blacklisted.
 * The check is done asynchronously. If the URL
 * is blacklisted, an internal callback will
 * break the navigation chain and redirect
 * the user to a warning page. 
 *
 * @param url {nsIURI}
 * @param browser {<xul:browser>}
 * @param request {nsIRequest}
 */
function checkBlacklisted(url, browser, request)
{
  if (! ourPref.get("phish.enable"))
    return;

  /**
   * Called with the result of the blacklist check.
   *
   * @param resultCallback {Function(block {boolean})
   *     result true: URL is blacklisted, false otherwise
   */
  checkURI(url, function(block)
  {
    if (!block)
      return;
    //debug("URL " + url + " is blacklisted");
    request.cancel(Components.results.NS_BINDING_ABORTED);
    // TODO: semantics of loadURIWithFlags(foo, LOAD_FLAGS_REPLACE_HISTORY)
    // are not entirely clear to me
    // I intend to use it to kill the current "bad" URL from browser history,
    // but I'm not sure if it's been placed there
    var encoded = encodeURIComponent(url.spec);
    browser.loadURIWithFlags(
        "chrome://unitedtb/content/phish/phish-warning.xhtml?u=" + encoded,
        Ci.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY, null, null);
  }, errorInBackend);
}
