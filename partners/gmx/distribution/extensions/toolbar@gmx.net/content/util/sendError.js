var build = {}
Components.utils.import("resource://unitedtb/build.js", build);
Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://gre/modules/Services.jsm");

const EXPORTED_SYMBOLS = [ "sendErrorToServer", "shouldSendErrorToServer" ];

/**
 * Remove any functions from the stack that are related to
 * showing or sending the error.
 */
function cleanupStack(s) {
  return s.split(/\n/).filter(function(element) {
    if (element.match(/^sendErrorToServer/) ||
        element.match(/^_showErrorDialog/) ||
        element.match(/^Exception/) ||
        element.match(/^NotReached/) ||
        element.match(/^assert/) ||
        element.match(/^errorCritical/) ||
        element.match(/^errorNonCritical/) ||
        element.match(/^errorInBackend/))
      return false;
    return true;
    }).join("\n");
}

function sendErrorToServer(e)
{
  // If we didn't get an Exception object (but e.g. a string),
  // create one and give it a stack
  if (typeof e != "object") {
    e = new Exception(e);
    e.stack = Error().stack;
  }
  var fetch = new FetchHTTP({
    url: ourPref.get("util.reportError.url"),
    method: "POST",
    bodyFormArgs: {
      ffVersion: Services.appinfo.platformVersion,
      extVersion: build.version,
      extID: build.EMID,
      msg: e.toString(),
      platform: Services.appinfo.OS,
      callstack: cleanupStack(e.stack),
      // These only apply for server exceptions
      url: "uri" in e ? e.uri : null,
      code: "code" in e ? e.code : null,
      rootErrorMsg: "rootErrorMsg" in e ? e.rootErrorMsg : null
    }
  }, function() {}, // success
  debug); // error -- don't do errorInBackend(), to avoid a loop
  fetch.start();
}

function shouldSendErrorToServer(e) {
  if (e.causedByUser)
    return false;
  if ( !ourPref.get("util.reportError.enabled", false))
    return false;
  return true;
}
