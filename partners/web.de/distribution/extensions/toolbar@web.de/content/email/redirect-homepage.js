/**
 * This listens for any loads of http://web.de and
 * redirects to the logged-in version.
 */
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var accounts = {};
Components.utils.import("resource://unitedtb/email/account-list.js", accounts);

function onLoad(event)
{
  if ( !brand.login.homepageHostnames) {
    return;
  }
  gBrowser.addProgressListener(progressListener)
};
window.addEventListener("load", onLoad, false);

function onUnload(event)
{
  if ( !brand.login.homepageHostnames) {
    return;
  }
  gBrowser.removeProgressListener(progressListener)
};
window.addEventListener("unload", onUnload, false);

// nsIWebProgressListener
var progressListener = {
  QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
                                         "nsISupportsWeakReference"]),

  onLocationChange: function(aProgress, aRequest, aURI) {
    if (! (aURI instanceof Ci.nsIStandardURL)) {
      return;
    }
    if ( !brand.login.homepageHostnames[aURI.host]) {
      return;
    }
    if (aURI.scheme != "http" && aURI.scheme != "https") {
      return;
    }
    // Only handle a plain domain (no path or query at all)
    if (aURI.path && aURI.path != "/") {
      return;
    }
    var primaryAcc = accounts.getPrimaryAccount();
    if ( !primaryAcc || !primaryAcc.isLoggedIn) {
      return;
    }
    var homepage = primaryAcc.getHomepage();
    if ( !homepage || !homepage.url) {
      return;
    }
    var webNav = aProgress.DOMWindow.QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIWebNavigation);
    webNav.loadURI(homepage.url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null,
        createPostDataFromString(homepage.body, homepage.mimetype), null);
  },

  onStateChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {}
};
