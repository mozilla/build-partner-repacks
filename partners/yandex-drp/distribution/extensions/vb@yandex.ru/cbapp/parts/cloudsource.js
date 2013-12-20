"use strict";
const EXPORTED_SYMBOLS = ["cloudSource"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const API_DATA_RECEIVED_EVENT = "ftabs-api-data-received";
const SELF_DATA_RECEIVED_EVENT = "ftabs-self-data-received";
const CLOUD_API_URL = "http://api.browser.yandex.ru/dashboard/v2/get/?nodes=";
const MAX_LOGO_WIDTH = 150;
const MAX_LOGO_HEIGHT = 60;
var cachedCloudData = Object.create(null);
const cloudSource = {
init: function CloudSource_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this.__proto__ = new patterns.NotificationSource();
this.addListener(API_DATA_RECEIVED_EVENT,this);
this.addListener(SELF_DATA_RECEIVED_EVENT,this);
this._application = application;
this._logger = application.getLogger("CloudSource");
this._initDatabase();
}
,
finalize: function CloudSource_finalize(doCleanup, callback) {
this.removeAllListeners();
this._pendingRequests.forEach(function (request) {
request.abort();
}
);
this._pagesLoadQueue = null;
this._manifestLoadQueue = null;
var dbClosedCallback = (function _dbClosedCallback() {
this._database = null;
this._application = null;
this._logger = null;
}
).bind(this);
if (this._database)
{
this._database.close(function () {
dbClosedCallback();
callback();
}
);
return true;
}

dbClosedCallback();
}
,
observe: function CloudSource_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case API_DATA_RECEIVED_EVENT:
let self = this;
this._database.execQueryAsync("SELECT domain, logo, backgroundColor FROM cloud_data WHERE domain = :domain AND user_supplied = 1",{
domain: aData.domain},function (rowsData, storageError) {
if (storageError)
{
let msg = strutils.formatString("DB error while selecting local cloud data: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(msg);
}

if (rowsData.length)
return;
var newData = {
backgroundImage: aData.logo,
backgroundColor: aData.color,
domain: aData.domain};
cachedCloudData[aData.domain] = {
backgroundColor: aData.color,
backgroundImage: aData.logo};
self._database.execQueryAsync("INSERT INTO cloud_data (domain, logo, backgroundColor, user_supplied) VALUES (:domain, :logo, :color, 0)",{
domain: aData.domain,
logo: aData.logo,
color: aData.color});
Services.obs.notifyObservers(self,self._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT,JSON.stringify(newData));
}
);
break;
case SELF_DATA_RECEIVED_EVENT:
let newData = {
backgroundImage: aData.logo,
backgroundColor: aData.color,
domain: aData.domain};
this._database.execQueryAsync("INSERT OR REPLACE INTO cloud_data (domain, logo, backgroundColor, user_supplied) VALUES (:domain, :logo, :color, 1)",{
domain: aData.domain,
logo: aData.logo,
color: aData.color});
cachedCloudData[aData.domain] = {
backgroundColor: aData.color,
backgroundImage: aData.logo};
Services.obs.notifyObservers(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT,JSON.stringify(newData));
break;
}

}
,
getCachedExistingData: function CloudSource_getCachedData(host) {
return cachedCloudData[host] || {
};
}
,
requestExistingTile: function CloudSource_requestExistingTile(host, callback) {
if (cachedCloudData[host])
return callback(null,cachedCloudData[host]);
this._database.execQueryAsync("SELECT domain, logo, backgroundColor FROM cloud_data WHERE domain = :domain",{
domain: host},function CloudSource_requestTileFromDatabase_onDataReady(rowsData, storageError) {
if (storageError || ! rowsData.length)
return callback(storageError);
cachedCloudData[host] = {
backgroundImage: rowsData[0].logo,
backgroundColor: rowsData[0].backgroundColor};
callback(null,cachedCloudData[host]);
}
);
}
,
fetchTileFromWeb: function CloudSource_fetchTileFromWeb(uri, useBothSources) {
var host;
try {
uri.QueryInterface(Ci.nsIURL);
host = uri.asciiHost.replace(/^www\./,"");
}
catch (ex) {

}

if (! host)
return;
uri.host = uri.host.replace(/^www\./,"");
this._requestAPI(uri);
if (useBothSources && ! this._application.isYandexHost(uri.host))
{
this._requestPageManifest(uri);
}

}
,
_requestPageManifest: function CloudSource__requestPageManifest(uri) {
if (! uri.spec || this._pagesLoadQueue[uri.spec])
return;
this._pagesLoadQueue[uri.spec] = 1;
var self = this;
var xhr = this._createXHR();
uri = uri.clone();
uri.QueryInterface(Ci.nsIURL);
if (this._application.isYandexHost(uri.host))
{
let parsedQuery = netutils.querystring.parse(uri.query);
parsedQuery.nugt = "vbff-" + this._application.addonManager.addonVersion;
uri.query = netutils.querystring.stringify(parsedQuery);
}

xhr.open("GET",uri.spec,true);
var timer = new sysutils.Timer(function () {
xhr.abort();
}
, 25000);
xhr.addEventListener("load",function () {
timer.cancel();
delete self._pagesLoadQueue[uri.spec];
var responseText = (xhr.responseText || "").replace(/<\/head>[\s\S]*/i,"</head><body/></html>").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"");
var domParser = xmlutils.getDOMParser();
var xmlDocument;
try {
xmlDocument = domParser.parseFromString(responseText,"text/html");
}
catch (e) {

}

if (! xmlDocument)
return;
var link = xmlDocument.querySelector("link[rel='yandex-tableau-widget']");
if (! link)
return;
var manifestUrl = netutils.resolveRelativeURL(link.getAttribute("href"),uri);
self._validatePageManifest(manifestUrl,uri.asciiHost);
}
);
var errorHandler = function errorHandler(e) {
delete self._pagesLoadQueue[uri.spec];
}
;
xhr.addEventListener("error",errorHandler,false);
xhr.addEventListener("abort",errorHandler,false);
xhr.send();
}
,
_validatePageManifest: function CloudSource__validatePageManifest(url, domain) {
if (this._manifestLoadQueue[url])
return;
this._manifestLoadQueue[url] = 1;
var self = this;
var xhr = this._createXHR();
xhr.open("GET",url,true);
xhr.responseType = "json";
var timer = new sysutils.Timer(function () {
xhr.abort();
}
, 25000);
xhr.addEventListener("load",function () {
timer.cancel();
delete self._manifestLoadQueue[url];
if (! xhr.response)
return self._logger.error("Server response is not a valid JSON: " + xhr.responseText);
if (! xhr.response.api_version || ! xhr.response.layout || ! xhr.response.layout.logo || ! xhr.response.layout.color)
return;
var color = typeof xhr.response.layout.color === "object" ? xhr.response.layout.color[self._application.locale.language] || xhr.response.layout.color.default : xhr.response.layout.color;
var logo = typeof xhr.response.layout.logo === "object" ? xhr.response.layout.logo[self._application.locale.language] || xhr.response.layout.logo.default : xhr.response.layout.logo;
if (! logo || ! color || ! /^#/.test(color) || [4, 7].indexOf(color.length) === - 1)
return;
color = color.substr(1);
if (color.length === 3)
color = color.split("").map(function (symbol) symbol + symbol).join("");
var logoSource = netutils.resolveRelativeURL(logo,netutils.newURI(url));
self._validateImageAgainstSize(logoSource,function (valid) {
if (! valid)
return;
self._notifyListeners(SELF_DATA_RECEIVED_EVENT,{
domain: domain,
color: color,
logo: logoSource});
}
);
}
);
var errorHandler = function errorHandler(e) {
delete self._manifestLoadQueue[url];
}
;
xhr.addEventListener("error",errorHandler,false);
xhr.addEventListener("abort",errorHandler,false);
xhr.send();
}
,
_validateImageAgainstSize: function CloudSource__validateImageAgainstSize(imgSource, callback) {
var self = this;
var hiddenWindow = misc.hiddenWindows.appWindow;
var hiddenWindowDoc = hiddenWindow.document;
var image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml","img");
image.onload = function imgOnLoad() {
self._logger.trace("Image proportions: " + image.width + "x" + image.height);
callback(image.width <= MAX_LOGO_WIDTH && image.height <= MAX_LOGO_HEIGHT);
}
;
image.onerror = function imgOnError() {
callback(false);
}
;
image.src = imgSource;
}
,
_requestAPI: function CloudSource__requestAPI(uri) {
var host;
try {
uri.QueryInterface(Ci.nsIURL);
host = uri.asciiHost.replace(/^www\./,"");
}
catch (ex) {

}

if (! host)
return;
if (this._cloudDataDomainsQueue[host])
return;
this._cloudDataDomainsQueue[host] = 1;
var self = this;
var cloudURL = CLOUD_API_URL + encodeURIComponent(host) + "&brandID=" + this._application.branding.productInfo.BrandID + "&lang=" + this._application.locale.language;
var xhr = this._createXHR();
xhr.open("GET",cloudURL,true);
xhr.responseType = "json";
var timer = new sysutils.Timer(function () {
xhr.abort();
}
, 25000);
xhr.addEventListener("load",function () {
timer.cancel();
delete self._cloudDataDomainsQueue[host];
if (! xhr.response)
return self._logger.error("Server response is not a valid JSON: " + xhr.responseText);
if (xhr.response.error || ! xhr.response[0].color || ! xhr.response[0].resources.logo)
return;
self._notifyListeners(API_DATA_RECEIVED_EVENT,{
domain: host,
color: xhr.response[0].color.replace(/^#/,""),
logo: xhr.response[0].resources.logo.url});
}
);
var errorHandler = function errorHandler(e) {
delete self._cloudDataDomainsQueue[host];
}
;
xhr.addEventListener("error",errorHandler,false);
xhr.addEventListener("abort",errorHandler,false);
xhr.send();
}
,
_createXHR: function CloudSource__createXHR() {
var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
xhr.mozBackgroundRequest = true;
xhr.QueryInterface(Ci.nsIDOMEventTarget);
var dropFromQueue = (function () {
var pos = this._pendingRequests.indexOf(xhr);
this._pendingRequests.splice(pos,1);
}
).bind(this);
xhr.addEventListener("load",dropFromQueue,false);
xhr.addEventListener("error",dropFromQueue,false);
xhr.addEventListener("abort",dropFromQueue,false);
this._pendingRequests.push(xhr);
return xhr;
}
,
_initDatabase: function CloudSource__initDatabase() {
var dbFile = this._application.core.rootDir;
dbFile.append(DB_FILENAME);
this._database = new Database(dbFile);
}
,
_database: null,
_application: null,
_logger: null,
_pendingRequests: [],
_cloudDataDomainsQueue: {
},
_pagesLoadQueue: {
},
_manifestLoadQueue: {
}};
