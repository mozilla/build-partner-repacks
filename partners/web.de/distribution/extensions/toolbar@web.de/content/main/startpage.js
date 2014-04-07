/**
 * Messages reacted to by this module, app-global:
 * "disable"
 *    Effect:
 *    Reset the homepage back to what it was before we were installed
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/common-jsm.js");

var globalObserver = {
  notification : function(msg, obj) {
    if (msg == "disable" ||
        msg == "uninstall") {
      // original...homepage will only be set if the user
      // opted in to one of our homepages
      if (build.kVariant == "amo" &&
          ourPref.isSet("original.browser.startup.homepage")) {
        var currentHomepage = generalPref.getLocalized("browser.startup.homepage");
        var isBrandHomepage = currentHomepage == brand.toolbar.startpageURL ||
                        currentHomepage == brand.toolbar.startpageHomepageURL;
        if (isBrandHomepage) {
          generalPref.set("browser.startup.homepage",
                          ourPref.get("original.browser.startup.homepage"));
        }
      }
    }
  }
}
registerGlobalObserver(globalObserver);
