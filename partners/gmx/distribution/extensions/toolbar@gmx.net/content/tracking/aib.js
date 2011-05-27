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
  aib(brand.tracking.AIBDailyURL, "daily", "d", 24 * 60 * 60 * 1000); // once a day
  aib(brand.tracking.AIBMonthlyURL, "monthly", "m", 30 * 24 * 60 * 60 * 1000); // once a month (30 days)
}
runAsync(onInit);

function aib(url, prefname, intervalURLName, intervalMS)
{
  if (sanitize.integer(ourPref.get("tracking.aib." + prefname)) * 1000 >
      (new Date() - intervalMS))
    return;

  url = url.replace("%INTERVAL%", intervalURLName);
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


// save install date

Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");

function saveInstallDate(object)
{
  // tracking.installdate is now obsolete
  ourPref.set("tracking.installtime", Math.round(new Date().getTime() / 100000) * 100);
};

registerGlobalObserver(
{
  notification : function(msg, obj)
  {
    if (msg == "first-run")
      saveInstallDate();
  }
});
