"use strict";
const EXPORTED_SYMBOLS = [];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
let foundationDir = Services.io.newURI(__URI__, null, null);
foundationDir = foundationDir.resolve("./foundation/");
const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
[
    "sysutils.js",
    "strutils.js",
    "fileutils.js",
    "xmlutils.js",
    "misc.js",
    "database.js",
    "patterns.js",
    "ecustom.js",
    "netutils.js",
    "async.js",
    "promise.js",
    "task.js"
].forEach(function load(moduleFileName) {
    try {
        SCRIPT_LOADER.loadSubScript(foundationDir + moduleFileName);
    } catch (e) {
        Cu.reportError(e);
        throw e;
    }
});
