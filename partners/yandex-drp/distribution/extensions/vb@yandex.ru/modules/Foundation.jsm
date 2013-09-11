"use strict";
const EXPORTED_SYMBOLS = [];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const FOUNDATION_DIR = __LOCATION__.parent;
FOUNDATION_DIR.append("foundation");
const FOUNDATION_PATH = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newFileURI(FOUNDATION_DIR).spec;
["legacy.js", "sysutils.js", "strutils.js", "fileutils.js", "xmlutils.js", "misc.js", "database.js", "patterns.js", "ecustom.js", "netutils.js", "dlqueue.js", "async.js", "promise.js", "task.js"].forEach(function load(moduleFileName) {
try {
this.loadSubScript(FOUNDATION_PATH + moduleFileName);
}
catch (e) {
Cu.reportError(e);
throw e;
}

}
,Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader));
