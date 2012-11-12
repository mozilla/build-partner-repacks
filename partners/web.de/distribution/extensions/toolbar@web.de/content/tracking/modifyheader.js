/**
 * Adds extra header info when connecting to United Internet Sites
 *
 * This depends on prefs set by aib.js saveInstallDate()
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
var build = {}
Components.utils.import("resource://unitedtb/build.js", build);

/**
 * Listen to all HTTP requests
 */
function listen()
{
  var observerService = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);
  observerService.addObserver(AddHeaders, "http-on-modify-request", false);
}
runAsync(listen);

var gInstallDate = null;
var gStatisticClass = null;
var gBrand = null;
var gVersion = null;
var gVariant = null;
var gBrandedBrowser = null;

function getValues()
{
  /* Easiest way to get the format we need is to get an ISO date and split it */
  var isoInstallDate = new Date(ourPref.get("tracking.installtime") * 1000).toISOString();
  gInstallDate = isoInstallDate.substr(0, isoInstallDate.indexOf("T"));
  gStatisticClass = ourPref.get("tracking.statisticclass");
  gBrand = brand.tracking.brand;
  gVersion = build.version;
  gVariant = build.kVariant;
  if (gVariant == "browser")
    gVariant = "bundle";
  else if (gVariant == "release")
    gVariant = "full";
  gBrandedBrowser = ourPref.get("brandedbrowser", false);
}

var AddHeaders =
{
  observe: function(subject, topic, data)
  {
    try {
      if (topic != "http-on-modify-request")
        return;
      var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
      if (!httpChannel.URI.host)
        return;
      var host = httpChannel.URI.host;
      var hit = brand.tracking.identifyMyselfToSites.some(function(domain)
      {
        return domain == host ||
            host.substr(host.length - domain.length - 1) == "." + domain;
      });
      if (!hit)
        return;
      if ( !gInstallDate)
        getValues();
      httpChannel.setRequestHeader("X-UnitedInternet-InstallDate",
                                   gInstallDate, false);
      httpChannel.setRequestHeader("X-UnitedInternet-StatisticClass",
                                   gStatisticClass, false);
      httpChannel.setRequestHeader("X-UnitedInternet-Brand",
                                   gBrand, false);
      httpChannel.setRequestHeader("X-UnitedInternet-Version",
                                   gVersion, false);
      httpChannel.setRequestHeader("X-UnitedInternet-Variant",
                                   gVariant, false);
      httpChannel.setRequestHeader("X-UnitedInternet-Branded-Browser",
                                   gBrandedBrowser, false);
    } catch (e) { errorInBackend(e); }
  }
}
