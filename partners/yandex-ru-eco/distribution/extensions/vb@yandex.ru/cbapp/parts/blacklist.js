"use strict";
const EXPORTED_SYMBOLS = ["blacklist"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const SERVER_URL = "http://download.cdn.yandex.net/bar/vb/bl.xml";
const SYNC_INTERVAL_SEC = 86400;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const blacklist = {
init: function Blacklist_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("Blacklist");
this._initDatabase();
this._initServerSync();
}
,
finalize: function Blacklist_finalize(doCleanup, callback) {
if (this._timer)
this._timer.cancel();
var dbClosedCallback = (function Blacklist_finalize_dbClosedCallback() {
this._database = null;
this._application = null;
this._logger = null;
callback();
}
).bind(this);
if (this._database)
{
this._database.close(dbClosedCallback);
}
 else
{
dbClosedCallback();
}

}
,
getAll: function Blacklist_getAll(callback) {
var output = [];
var serverFile = this._serverFile;
if (serverFile.exists() && serverFile.isFile() && serverFile.isReadable())
{
try {
let serverXML = fileutils.xmlDocFromFile(serverFile);
Array.forEach(serverXML.querySelectorAll("list > item[domain]"),function (item) {
output.push(item.getAttribute("domain"));
}
);
}
catch (ex) {
this._logger.error("Error while reading synced XML: " + strutils.formatError(ex));
this._logger.debug(ex.stack);
}

}

this._database.execQueryAsync("SELECT domain FROM blacklist",{
},function (rowsData, storageError) {
if (storageError)
{
let errorMsg = strutils.formatString("DB error while fetching blacklist: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(errorMsg);
}

callback(null,output.concat(rowsData.map(function (row) row.domain)));
}
);
}
,
upsertDomain: function Blacklist_upsertDomain(domain, callback) {
this._database.execQueryAsync("INSERT OR REPLACE INTO blacklist (domain) VALUES (:domain)",{
domain: domain},function (rowsData, storageError) {
if (storageError)
{
let errorMsg = strutils.formatString("DB error while upserting item into blacklist: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(errorMsg);
}

callback && callback();
}
);
}
,
deleteDomain: function Blacklist_deleteDomain(domain, callback) {
this._database.execQueryAsync("DELETE FROM blacklist WHERE domain = :domain",{
domain: domain},function (rowsData, storageError) {
if (storageError)
{
let errorMsg = strutils.formatString("DB error while deleting item from blacklist: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(errorMsg);
}

callback && callback();
}
);
}
,
get brandingDoc() {
delete this.brandingDoc;
return this.brandingDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/blacklist.xml");
}
,
get _serverFile() {
var file = this._application.directories.appRootDir;
file.append("blacklist.xml");
return file;
}
,
_initDatabase: function Blacklist__initDatabase() {
var dbFile = this._application.core.rootDir;
dbFile.append(DB_FILENAME);
this._database = new Database(dbFile);
var appInfo = this._application.addonManager.info;
if (appInfo.addonVersionChanged && appInfo.addonDowngraded === false)
{
let unionParts = [];
let placeholders = {
};
Array.forEach(this.brandingDoc.querySelectorAll("item"),function (item, i) {
var domain = item.getAttribute("domain");
if (! domain)
return;
unionParts.push("SELECT :domain" + i + " AS domain");
placeholders["domain" + i] = domain;
}
);
if (! unionParts.length)
return;
this._database.execQuery("INSERT OR REPLACE INTO blacklist (domain) " + unionParts.join(" UNION "),placeholders);
}

}
,
_initServerSync: function Blacklist__initServerSync() {
var lastSyncTime = this._application.preferences.get("blacklist.lastSyncTime",0);
var now = Math.round(Date.now() / 1000);
var delay = Math.max(SYNC_INTERVAL_SEC - Math.abs(now - lastSyncTime),0);
this._timer = new sysutils.Timer(this._syncServerXML.bind(this), delay * 1000, SYNC_INTERVAL_SEC * 1000);
}
,
_syncServerXML: function Blacklist__syncServerXML() {
var self = this;
this._logger.debug("Sync blacklist data");
var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
request.mozBackgroundRequest = true;
request.QueryInterface(Ci.nsIDOMEventTarget);
request.open("GET",SERVER_URL,true);
var lastModified = this._application.preferences.get("blacklist.lastModified");
if (lastModified)
{
request.setRequestHeader("If-Modified-Since",lastModified);
}

var timer = new sysutils.Timer(request.abort.bind(request), 5000);
request.addEventListener("load",function () {
timer.cancel();
if (request.status === 304)
{
self._logger.debug("XML file on server has not yet changed, status = 304");
return;
}

if (! request.responseXML || request.responseXML.documentElement.nodeName !== "list")
{
self._logger.error("Not valid XML: " + request.responseText);
return;
}

try {
let serializedXML = xmlutils.serializeXML(request.responseXML);
fileutils.writeTextFile(self._serverFile,serializedXML);
self._logger.debug("XML is valid, saved into filesystem");
let now = Math.round(Date.now() / 1000);
self._application.preferences.set("blacklist.lastSyncTime",now);
let lastModified = request.getResponseHeader("last-modified");
if (lastModified)
{
self._application.preferences.set("blacklist.lastModified",lastModified);
}

}
catch (ex) {
self._logger.error("Error while writing synced XML: " + strutils.formatError(ex));
self._logger.debug(ex.stack);
}

}
);
request.send();
}
,
_application: null,
_logger: null,
_timer: null};
