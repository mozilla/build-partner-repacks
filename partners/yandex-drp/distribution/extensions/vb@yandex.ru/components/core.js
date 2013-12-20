"use strict";
const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
const EXTENSION_DIR = __LOCATION__.parent.parent;
const EXTENSION_PATH = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newFileURI(EXTENSION_DIR).spec;
Cu.import(EXTENSION_PATH + "config.js");
const APP_NAME = VB_CONFIG.APP.NAME;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
function VBCore() {
this._loadModules();
this._observerService.addObserver(this,"profile-after-change",false);
this._observerService.addObserver(this,"quit-application",false);
}

;
VBCore.prototype = {
Lib: {
},
get CONFIG() {
return VB_CONFIG;
}
,
get appName() {
return this._appName;
}
,
get buildDate() {
return new Date(this._buildTimeStamp);
}
,
get buidRevision() {
return VB_CONFIG.BUILD.REVISION;
}
,
get application() {
return this._appObj;
}
,
get protocol() {
return this._protocol;
}
,
get rootDir() {
if (this._appRoot === null)
{
this._appRoot = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
this._appRoot.append(this.appName);
if (this._appRoot.exists() === false)
{
this._appRoot.create(Ci.nsIFile.DIRECTORY_TYPE,this.Lib.fileutils.PERMS_DIRECTORY);
}

if (this._appRoot.exists() === false)
{
throw "Can't create extension data folder in profile directory";
}

}

return this._appRoot.clone();
}
,
get extensionPathFile() {
return EXTENSION_DIR.clone();
}
,
get wrappedJSObject() {
return this;
}
,
get eventTopics() {
return this._globalEvents;
}
,
get logging() {
return this._logging;
}
,
set logging(newVal) {
if (this._logging == ! ! newVal)
return;
this._logging = ! this._logging;
if (this._logging)
this._startLogging(); else
this._stopLogging();
}
,
observe: function VBCore_observe(subject, topic, data) {
switch (topic) {
case "profile-after-change":
this._startLogging();
this._protocol = new this.Lib.SimpleProtocol(VB_CONFIG.APP.PROTOCOL);
this._initApp();
break;
case "quit-application":
if (this._appObj)
{
this._destroyApp();
}

this._protocol.unregister();
break;
case "nsPref:changed":
this._updateLoggers(data == this._dumpLogLevelPrefName,data == this._consoleLogLevelPrefName,data == this._fileLogLevelPrefName,data == this._socketLogLevelPrefName);
break;
}

}
,
_buildTimeStamp: Date.parse(VB_CONFIG.BUILD.DATE),
_appName: APP_NAME,
_modulesPath: "resource://" + APP_NAME + "-mod/",
_appResPath: "resource://" + APP_NAME + "-app/",
_appChromePath: "chrome://" + APP_NAME + "/",
_protocol: null,
_appRoot: null,
_appObj: null,
_dumpLogLevelPrefName: "extensions." + VB_CONFIG.APP.ID + ".logging.stdout.level",
_consoleLogLevelPrefName: "extensions." + VB_CONFIG.APP.ID + ".logging.console.level",
_fileLogLevelPrefName: "extensions." + VB_CONFIG.APP.ID + ".logging.file.level",
_socketLogLevelPrefName: "extensions." + VB_CONFIG.APP.ID + ".logging.socket.level",
_dumpAppender: null,
_consoleAppender: null,
_fileAppender: null,
_socketAppender: null,
_logging: true,
_globalEvents: {
CLOUD_DATA_RECEIVED_EVENT: APP_NAME + "-cloud-data-received",
THUMBS_STRUCTURE_READY_EVENT: APP_NAME + "-internal-thumbs-ready",
APP_TAB_SHOWN: APP_NAME + "-tab-shown",
SYNC_COMPONENT_ENABLED: "ybar:esync:plugin:enable",
SYNC_COMPONENT_READY: "ybar:esync:service:ready",
SYNC_COMPONENT_DISABLED: "ybar:esync:plugin:disable",
SYNC_AUTH_CHANGED: "ybar:esync:auth:changed",
SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED: "ybar:esync:engine:Tophistory:init:start",
SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED: "ybar:esync:engine:Tophistory:init:finish",
SYNC_SERVICE_TOPHISTORY_DISABLED: "ybar:esync:engine:Tophistory:finalize:start",
SYNC_SERVICE_PINNED_ENABLED_STARTED: "ybar:esync:engine:Pinned:init:start",
SYNC_SERVICE_PINNED_ENABLED_FINISHED: "ybar:esync:engine:Pinned:init:finish",
SYNC_SERVICE_PINNED_DISABLED: "ybar:esync:engine:Pinned:finalize:start"},
_moduleFileNames: ["Log4Moz.jsm", "Preferences.jsm", "WindowListener.jsm", "AddonManager.jsm", "Foundation.jsm", "wc.jsm", "SimpleProtocol.jsm"],
_observerService: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
_loadModules: function VBCore__loadModules() {
const Lib = this.Lib;
const prePath = this._modulesPath;
this._moduleFileNames.forEach(function loadModule(fileName) {
Cu.import(prePath + fileName,Lib);
}
);
}
,
_startLogging: function VBCore__startLogging() {
const Log4Moz = this.Lib.Log4Moz;
var root = Log4Moz.repository.rootLogger;
root.level = Log4Moz.Level.All;
var formatter = new Log4Moz.BasicFormatter();
this._consoleAppender = new Log4Moz.ConsoleAppender(formatter);
root.addAppender(this._consoleAppender);
this._dumpAppender = new Log4Moz.DumpAppender(formatter);
root.addAppender(this._dumpAppender);
var logFile = this.rootDir;
logFile.append("debug.log");
this._fileAppender = new Log4Moz.RotatingFileAppender(logFile, formatter);
root.addAppender(this._fileAppender);
var [host, port] = "localhost:4448".split(":");
this._socketAppender = new Log4Moz.SocketAppender(host, port, new Log4Moz.XMLFormatter());
root.addAppender(this._socketAppender);
this._logger = Log4Moz.repository.getLogger(this.appName + ".Core");
this._logger.level = Log4Moz.Level.Debug;
this._updateLoggers(true,true,true,true);
this.Lib.Preferences.observe(this._dumpLogLevelPrefName,this);
this.Lib.Preferences.observe(this._consoleLogLevelPrefName,this);
this.Lib.Preferences.observe(this._fileLogLevelPrefName,this);
this.Lib.Preferences.observe(this._socketLogLevelPrefName,this);
}
,
_stopLogging: function VBCore__stopLogging() {
this.Lib.Preferences.ignore(this._dumpLogLevelPrefName,this);
this.Lib.Preferences.ignore(this._consoleLogLevelPrefName,this);
this.Lib.Preferences.ignore(this._fileLogLevelPrefName,this);
this.Lib.Preferences.ignore(this._socketLogLevelPrefName,this);
var root = this.Lib.Log4Moz.repository.rootLogger;
root.removeAppender(this._consoleAppender);
this._consoleAppender = null;
root.removeAppender(this._dumpAppender);
this._dumpAppender = null;
this._fileAppender.closeStream();
root.removeAppender(this._fileAppender);
this._fileAppender = null;
this._socketAppender.closeStream();
root.removeAppender(this._socketAppender);
this._socketAppender = null;
}
,
_updateLoggers: function VBCore__updateLoggers(checkDumpSetting, checkConsoleSetting, checkFileSetting, checkSocketSetting) {
const Preferences = this.Lib.Preferences;
function readLogLevel(prefName) {
var logLevel = parseInt(Preferences.get(prefName,NaN),10);
return isNaN(logLevel) || logLevel < 0 ? 100 : logLevel;
}

if (checkDumpSetting)
this._dumpAppender.level = readLogLevel(this._dumpLogLevelPrefName);
if (checkConsoleSetting)
this._consoleAppender.level = readLogLevel(this._consoleLogLevelPrefName);
if (checkFileSetting)
this._fileAppender.level = readLogLevel(this._fileLogLevelPrefName);
if (checkSocketSetting)
this._socketAppender.level = readLogLevel(this._socketLogLevelPrefName);
}
,
_initApp: function VBCore__initApp() {
try {
let appModule = {
};
Cu.import(this._appResPath + "app.js",appModule);
this._appObj = appModule.application;
this._appObj.init(this);
}
catch (e) {
this._appObj = null;
this._logger.fatal("Couldn't initialize application. " + this._formatError(e));
if (e.stack)
{
this._logger.debug(e.stack);
}

}

}
,
_destroyApp: function VBCore__destroyApp() {
try {
this._appObj.finalize(this._stopLogging.bind(this));
this._appObj = null;
}
catch (e) {
this._logger.error(this._formatError(e));
this._logger.debug(e.stack);
}

}
,
_formatError: function VBCore__formatError(e) {
var text = e.name + ": " + e.message;
var fileName = e.fileName || e.filename;
if (fileName)
text += "\nin " + fileName + "@" + e.lineNumber;
return text;
}
,
classDescription: "Yandex Visual Bookmarks core JS component",
classID: VB_CONFIG.CORE.CLASS_ID,
contractID: VB_CONFIG.CORE.CONTRACT_ID,
QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIObserver]),
_xpcom_categories: [{
category: "app-startup",
service: true}]};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([VBCore]);
if (Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment).exists("YAVB_DEBUG_PROFILER_RUN"))
{
Cu.import(VBCore.prototype._modulesPath + "Profiler.jsm",{
}).Profiler.run();
}

