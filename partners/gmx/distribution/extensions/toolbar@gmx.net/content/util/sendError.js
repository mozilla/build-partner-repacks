Components.utils.import("resource://unitedtb/util/util.js");
var build = {}
importJSM("build.js", build);
importJSM("util/fetchhttp.js", this);
Components.utils.import("resource://gre/modules/Services.jsm");

const EXPORTED_SYMBOLS = [ "sendErrorToServer", "shouldSendErrorToServer" ];

// Throttling
var gMaxPreviousErrors = 10;
var gPreviousErrors = [];
var gLastErrorTime = 0; // Unixtime
const kMinErrorInterval = 5; // in seconds

function sendErrorToServer(e)
{
  var fetch = new FetchHTTP({
    url: ourPref.get("util.reportError.url"),
    method: "POST",
    bodyFormArgs: {
      msg: e.toString(),
      callstack: e.stack,
      extID: build.EMID.replace("toolbar@", ""), // "web.de", "gmx.net", "mail.com"
      extVersion: build.version, // e.g. "2.6.4"
      browserType: "Firefox", // "Firefox", "G Chrome", "Safari", "Opera Next"
      browserVersion: Services.appinfo.platformVersion, // e.g. "17.0.0.6" or "24.0a1"
      osType: getOSType(),
      osVersion: getOSVersion(),
      // These only apply for server exceptions
      url: "uri" in e ? e.uri : null,
      code: "code" in e ? e.code : null,
      rootErrorMsg: "rootErrorMsg" in e ? e.rootErrorMsg : null,
    }
  }, function() {}, // success
  function(e) { e.doNotSendToServer = true; errorInBackend(e); }); // avoid loop
  fetch.start();
}

function shouldSendErrorToServer(e) {
  if (e.causedByUser || e.doNotSendToServer)
    return false;
  if ( !ourPref.get("util.reportError.enabled", false))
    return false;

  // Throttling
  // We don't want to keep sending the same errors to the server in a given
  // session, so if an error is repeated, don't send it.
  var sig = e.toString() + e.stack;
  if (gPreviousErrors.indexOf(sig) != -1) {
    // We have seen this error recently, don't report it
    return false;
  }
  gPreviousErrors.push(sig);
  // Limit our error array to gMaxPreviousErrors
  if (gPreviousErrors.length > gMaxPreviousErrors) {
    gPreviousErrors.splice(0, 1);
  }
  // If we've sent an error in the last kMinInterval seconds,
  // don't send another one
  // This avoids fallout errors caused by earlier errors to be submitted.
  // It also stops loops like #1140.
  var now = Math.round(new Date().getTime());
  if (now - gLastErrorTime < kMinErrorInterval * 1000) {
    return false;
  }
  gLastErrorTime = now;

  return true;
}

/**
 * @returns:
 *    Windows: "2000", "XP", "Vista", "7", "8"
 *    Mac OS X: e.g. "10.8.2"
 *    Linux: e.g. "x86_64"
 */
function getOSVersion() {
  var oscpu = Cc["@mozilla.org/network/protocol;1?name=http"].
                getService(Ci.nsIHttpProtocolHandler).oscpu;
  if (typeof(oscpu) != "string") {
    return "";
  }
  var version = oscpu.match(/\d+(\.\d+)+/);
  if (version && version.length > 0) {
    if (Services.appinfo.OS == "WINNT") {
      switch (version[0]) {
        case "5.0":
          return "2000";
        case "5.1":
          return "XP";
        case "6.0":
          return "Vista";
        case "6.1":
          return "7";
        case "6.2":
          return "8";
      }
    }
    return version[0];
  } else if (oscpu.indexOf(" ") != -1) { // has space
    var sp = oscpu.split(" ");
    return sp[sp.length - 1]; // last token
  } else {
    return oscpu.substr(-10); // last 10 chars
  }
}

/**
 * @returns one of "Win", "Mac OS X", "Linux"
 */
function getOSType() {
  switch (Services.appinfo.OS) {
    case "WINNT":
      return "Win";
    case "Darwin":
      return "Mac OS X";
    default:
      return Services.appinfo.OS;
  }
}
