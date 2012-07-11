/**
 * Statistics about user population. Ping server regularly.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

function onInit()
{
  try {
    saveInstallDate();
    aib(brand.tracking.AIBDailyURL, "daily", "d", 24 * 60 * 60 * 1000); // once a day
    aib(brand.tracking.AIBMonthlyURL, "monthly", "m", 30 * 24 * 60 * 60 * 1000); // once a month (30 days)
  } catch (e) { errorInBackend(e); }
}
runAsync(onInit);

// <copied to="main/extension.js">
function addTrackingInfo(url) {
  try {
    if ( !brand.tracking.sendCampaignID)
      return url;
    var kid = ourPref.get("tracking.campaignid");
    var installTime = new Date(ourPref.get("tracking.installtime") * 1000).toISOString();
    var installDate = installTime.substr(0, installTime.indexOf("T"));
    var mod = ourPref.get("tracking.statisticclass");
    return url + (url.indexOf("?") >= 0 ? "&" : "?") +
        "kid=" + kid + "&ins=" + installDate + "&mod=" + mod;
  } catch (e) { errorInBackend(e); return url; }
}
// </copied>

function aib(url, prefname, intervalURLName, intervalMS)
{
  if (sanitize.integer(ourPref.get("tracking.aib." + prefname, 0)) * 1000 >
      (new Date() - intervalMS))
    return;

  url = url.replace("%INTERVAL%", intervalURLName);
  url = addTrackingInfo(url);
  //new FetchHTTP({ url : url, method : "HEAD" },
  new FetchHTTP({ url : url, method : "GET" },
  function()
  {
    ourPref.set("tracking.aib." + prefname, Math.round(new Date().getTime() / 1000));
  },
  function(e)
  {
    if (e.code == 404)
      ; // silence error, because we get this a lot
    else
      errorInBackend(e);
  }).start();
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
  }
  if ( !ourPref.isSet("tracking.statisticclass")) // has user value
  {
    // see modifyheader.js
    ourPref.set("tracking.statisticclass",
        Math.floor(Math.random() * 100) + 1); // 1..100
  }
};
