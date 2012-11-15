/**
 * Counts how often the user hits opens a new tab page, and submit the count to a server.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

function onInit()
{
  submit();
}
runAsync(onInit);

const prefSubmit = "tracking.countnewtab.lastSubmit";
const prefCount = "tracking.countnewtab.count";

/**
 * Once every week, read the count from the prefs, submit it to a
 * server, and reset the count to 0.
 */
function submit()
{
  const intervalMS = 7 * 24 * 60 * 60 * 1000; // once a week
  var lastSubmit = sanitize.integer(ourPref.get(prefSubmit,
      ourPref.get("tracking.installtime", 0))); // default to install date
  if (lastSubmit * 1000 > (new Date() - intervalMS))
    return;

  var count = ourPref.get(prefCount, 0);
  new FetchHTTP({ url : brand.tracking.countNewTabURL, method : "GET",
      urlArgs : { ntc : count, ntd: lastSubmit }},
  function()
  {
    ourPref.set(prefCount, 0);
    ourPref.set(prefSubmit, Math.round(new Date().getTime() / 1000));
  },
  errorInBackend).start();
}
