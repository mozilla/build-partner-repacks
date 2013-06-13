/**
 * Statistics about user population. Ping server regularly.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/tracking/campaign-id.js");
var build = {}
Components.utils.import("resource://unitedtb/build.js", build);
Components.utils.import("resource://unitedtb/util/observer.js");
var accounts = {};
Components.utils.import("resource://unitedtb/email/account-list.js", accounts);

var aibTimer;

function onInit()
{
  try {
    saveInstallDate();
    aibTimer = runAsync(function() {
      aib("daily", "aib", 24 * 60 * 60 * 1000); // once a day
      aib("weekly", "aib7", 7 * 24 * 60 * 60 * 1000); // once a week
      aib("monthly", "aib30", 30 * 24 * 60 * 60 * 1000); // once a month (30 days)
    }, null, 10*1000); // 10s -- make sure we are logged in
  } catch (e) { errorInBackend(e); }
}
runAsync(onInit);

function aib(prefname, event, intervalMS)
{
  var lastAIB = sanitize.integer(ourPref.get("tracking.aib." + prefname, 0)) * 1000;
  if (lastAIB > (new Date() - intervalMS))
    return;

  var lastAIBTime = new Date(lastAIB).toISOString();
  var lastAIBDate = lastAIBTime.substr(0, lastAIBTime.indexOf("T"));

  var allAccounts = accounts.getAllExistingAccounts();
  var primaryAcc = accounts.getPrimaryAccount();
  var loggedIn = primaryAcc && primaryAcc.isLoggedIn;
  var rememberMe = primaryAcc && primaryAcc.wantStoredLogin;
  var paramsStr = "lastaib=" + lastAIBDate;
  paramsStr += "&accountconfigured=" + (allAccounts.length ? "1": "0");
  paramsStr += "&loggedin=" + (loggedIn ? "1": "0");
  paramsStr += "&rememberme=" + (rememberMe ? "1": "0");
  paramsStr += "&errorlogging=" + (ourPref.get("util.reportError.enabled", false) ? "1": "0");

  pingTrackingServer(event, paramsStr, function() {
    ourPref.set("tracking.aib." + prefname, Math.round(new Date().getTime() / 1000));
  });
}


/**
 * Used by:
 * AIB (above)
 * runonce page (ext.js)
 * modifyheader.js
 */
function saveInstallDate(object)
{
  // can't do this on "first-run" message, because other code that runs
  // on first-run (e.g. runonce page) needs to have this value already set.
  if ( !ourPref.isSet("tracking.installtime")) // has user value
  {
    // Blue the installtime a bit to protect privacy. Server should get only the date.
    ourPref.set("tracking.installtime",
        Math.round(new Date().getTime() / 100000) * 100);
    // Doing this at first run is too late because we need it for the initial
    // aib. This is the best place I found.
    setCampaignID(); // from campaign-id.js
  }
  if ( !ourPref.isSet("tracking.statisticclass")) // has user value
  {
    // see modifyheader.js
    ourPref.set("tracking.statisticclass",
        Math.floor(Math.random() * 100) + 1); // 1..100
  }
};

function pingTrackingServer(event, addlParams, callback) {
  var url = brand.tracking.trackingURL;
  url = url.replace("%EVENT%", event);
  url = url.replace("%TYPE%", build.kVariant == "release" ? "toolbar" : build.kVariant);
  var installTime = new Date(ourPref.get("tracking.installtime") * 1000).toISOString();
  var installDate = installTime.substr(0, installTime.indexOf("T"));
  url = url.replace("%INSTALLDATE%", installDate);
  url = url.replace("%KID%", ourPref.get("tracking.campaignid", 0));
  url = url.replace("%MOD%", ourPref.get("tracking.statisticclass"));
  // VERSION and LOCALE are replaced by brand-var-loader.js
  //url = url.replace("%VERSION%", build.version);
  //url = url.replace("%LOCALE%", generalPref.get("general.useragent.locale"));
  if (addlParams) {
    url += "&" + addlParams;
  }

  new FetchHTTP({ url : url, method : "GET" },
    function() {
      if (callback) {
        callback();
      }
    }, errorInBackend).start();}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "first-run")
      pingTrackingServer("install");
    if (msg == "uninstall")
      pingTrackingServer("uninstall");
  }
}
registerGlobalObserver(globalObserver);
