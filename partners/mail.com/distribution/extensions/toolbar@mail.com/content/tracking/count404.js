/**
 * Counts how often the user hits a 404, and submit the count to a server.
 * Web.de wants this to decide whether a 404 feature is worthwhile.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

function onInit()
{
  submit();
  listen();
}
runAsync(onInit);

const prefSubmit = "tracking.count404.lastSubmit";
const prefCount = "tracking.count404.count";

/**
 * Once every week, read the count from the prefs, submit it to a
 * server, and reset the count to 0.
 */
function submit()
{
  const intervalMS = 7 * 24 * 60 * 60 * 1000; // once a week
  if (sanitize.integer(ourPref.get(prefSubmit, 0)) * 1000 >
      (new Date() - intervalMS))
    return;

  var count = ourPref.get(prefCount, 0);
  new FetchHTTP({ url : brand.tracking.count404URL, method : "POST",
      urlArgs : { count : count }},
  function()
  {
    ourPref.set(prefCount, 0);
    ourPref.set(prefSubmit, Math.round(new Date().getTime() / 1000));
  },
  errorInBackend).start();
}

/**
 * Listen to all HTTP responses
 */
function listen()
{
  var observerService = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);
  observerService.addObserver(Track404, "http-on-examine-response", false);
}

var Track404 =
{
  observe: function(subject, topic, data)
  {
    try {
      if (topic != "http-on-examine-response")
        return;
      if (!(subject instanceof Ci.nsIHttpChannel))
        return;
      if (subject.responseStatus != 404)
        return;
      //debug("hit a 404 page with server msg: " + subject.responseStatusText);
      var count = ourPref.get(prefCount, 0);
      ourPref.set(prefCount, ++count);
      return;
    } catch (e) { errorInBackend(e); }
  }
}
