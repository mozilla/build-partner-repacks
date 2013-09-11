"use strict";
const EXPORTED_SYMBOLS = ["thumbs"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const DAILY_IDLE_EVENT = "idle-daily";
const OLDEST_THUMB_TIME_SECONDS = 86400 * 30;
const PICKUP_QUEUE_TAIL = 3;
const MAX_HISTORY_RESULTS = 100;
const REFRESH_INTERVAL = 86400;
const BRANDING_PAGES_BOOST = 5;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL,"UUID_SVC","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const thumbs = {
init: function Thumbs_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("Thumbs");
Services.obs.addObserver(this,DAILY_IDLE_EVENT,false);
Services.obs.addObserver(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT,false);
this._initDatabase();
var appInfo = this._application.addonManager.info;
if (appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated",false) === false)
this._application.preferences.set("ftabs.emptyLastThumb",true);
var now = Math.round(Date.now() / 1000);
var lastPickupTime = this._application.preferences.get("ftabs.lastPickupTime",0);
var pickupDateDiff = Math.abs(now - lastPickupTime);
if (appInfo.addonUpgraded || appInfo.isFreshAddonInstall)
return this.pickupThumbs({
withForceThumbs: true});
this._fetchThumbs(function fetchThumbsOnInitCallback() {
if (pickupDateDiff > this._pickupInterval)
return this.pickupThumbs({
withForceThumbs: false});
this._pickupTimer = new sysutils.Timer(this.pickupThumbs.bind(this), Math.max(this._pickupInterval - pickupDateDiff,0) * 1000);
Services.obs.notifyObservers(this,this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT,null);
if (this._isRefreshNeeded)
{
this._refreshThumbsData();
}
 else
{
this.structure.iterate({
nonempty: true},function (thumbData) {
this._getMissingThumbData(thumbData);
}
,this);
let lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime",0);
let lastRefreshDiff = Math.abs(now - lastRefreshTime);
this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), Math.max(REFRESH_INTERVAL - lastRefreshDiff,0) * 1000);
}

}
.bind(this));
}
,
finalize: function Thumbs_finalize(doCleanup, callback) {
Services.obs.removeObserver(this,DAILY_IDLE_EVENT);
Services.obs.removeObserver(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT);
if (this._pickupTimer)
this._pickupTimer.cancel();
if (this._refreshThumbsTimer)
this._refreshThumbsTimer.cancel();
var dbClosedCallback = function Thumbs_finalize_dbClosedCallback() {
this.structure = null;
this._database = null;
this._application = null;
this._logger = null;
callback();
}
.bind(this);
if (this._database)
this._database.close(dbClosedCallback.bind(this)); else
dbClosedCallback();
}
,
observe: function Thumbs_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case DAILY_IDLE_EVENT:
this._database.execQueryAsync("DELETE FROM thumbs WHERE insertTimestamp < :oldestTime " + "AND rowid NOT IN (SELECT thumb_id FROM thumbs_shown)",{
oldestTime: Math.round(Date.now() / 1000) - OLDEST_THUMB_TIME_SECONDS});
break;
case this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT:
aData = JSON.parse(aData);
this.structure.iterate({
nonempty: true},function (thumbData, index) {
var thumbURI = this._application.fastdial.url2nsIURI(thumbData.url);
if (thumbURI.asciiHost !== aData.domain)
return;
delete aData.domain;
this._logger.trace("CloudDataChunk @: " + JSON.stringify([thumbData.url, aData],null,"\t"));
this.structure.set(index,aData);
var requestData = {
};
requestData[index] = this.structure.get(index);
this._application.fastdial.sendRequest("thumbChanged",requestData);
}
,this);
break;
}

}
,
save: function Thumbs_save(thumbs, startPickup, callbackAfterSave) {
var self = this;
var newThumbsUrls = [];
var newThumbs = {
};
var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
this._logger.trace("Save thumbs (pickup: " + startPickup + ") - " + JSON.stringify(thumbs,null,"\t"));
async.parallel({
blacklist: function Thumbs__saveThumbsData_blacklist(callback) {
self._database.execQueryAsync("SELECT domain FROM blacklist",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
var output = Object.create(null);
rowsData.forEach(function (row) output[row.domain] = true);
callback(null,output);
}
);
}
,
truncateShown: function Thumbs__saveThumbsData_truncateShown(callback) {
self._database.execQueryAsync("DELETE FROM thumbs_shown",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
,
maxThumbsId: function Thumbs__saveThumbsData_maxThumbsId(callback) {
self._database.execQueryAsync("SELECT MAX(rowid) AS rowid FROM thumbs",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData[0].rowid);
}
);
}
},function Thumbs__saveThumbsData_onPrepared(err, results) {
if (err)
throw new Error(err);
var maxRowID = results.maxThumbsId;
var blacklist = results.blacklist;
var till = self._application.layout.getThumbsNum();
const BLACKLIST_ADD = 1;
const BLACKLIST_DONT_ADD = 2;
const BLACKLIST_REMOVE = 4;
var newBlacklistDomains = Object.create(null);
var tasks = {
};
var emptyPositions = [];
var newFilledThumbsNum = 0;
for(let [, thumbData] in Iterator(thumbs)) {
if (thumbData && thumbData.url)
{
newFilledThumbsNum += 1;
}

}

var oldFilledThumbsNum = 0;
self.structure.iterate({
visible: true,
nonempty: true},function () {
oldFilledThumbsNum += 1;
}
);
var isEditOrDND = newFilledThumbsNum === oldFilledThumbsNum;
if (emptyLastThumb && newFilledThumbsNum > oldFilledThumbsNum)
{
self._application.preferences.set("ftabs.emptyLastThumb",false);
emptyLastThumb = false;
}

for (let i = 0;i < till;i++) {
(function (index, oldThumbData, newThumbData) {
tasks[index] = function Thumbs__saveThumbsData_thumbTask(callback) {
if (newThumbData && newThumbData.url)
{
newThumbData.url = self.fixURL(newThumbData.url);
if (! newThumbData.url)
{
emptyPositions.push(index);
return callback();
}

try {
let uri = netutils.newURI(newThumbData.url);
uri.QueryInterface(Ci.nsIURL);
}
catch (ex) {
emptyPositions.push(index);
return callback();
}

}

if (oldThumbData && oldThumbData.url)
{
if (newThumbData && newThumbData.url)
{
if (newThumbData.url === oldThumbData.url)
{
let domain = self._application.fastdial.url2nsIURI(oldThumbData.url).host;
newBlacklistDomains[domain] |= BLACKLIST_DONT_ADD;
}
 else
{
let domain = self._application.fastdial.url2nsIURI(newThumbData.url).host;
newBlacklistDomains[domain] |= BLACKLIST_REMOVE;
}

}
 else
{
let domain = self._application.fastdial.url2nsIURI(oldThumbData.url).host;
newBlacklistDomains[domain] |= BLACKLIST_ADD;
}

}
 else
{
if (newThumbData && newThumbData.url)
{
let domain = self._application.fastdial.url2nsIURI(newThumbData.url).host;
newBlacklistDomains[domain] |= BLACKLIST_REMOVE;
}

}

if (! newThumbData)
{
if (oldThumbData && oldThumbData.url && ! isEditOrDND)
self._application.usageHistory.logAction("delete",{
index: index});
emptyPositions.push(index);
return callback();
}

if (! oldThumbData && newThumbData.url)
{
if (! isEditOrDND)
{
self._application.usageHistory.logAction("add",{
url: newThumbData.url,
index: index,
title: newThumbData.title});
}

newThumbsUrls.push(newThumbData.url);
}

if (! newThumbData.url)
{
self._database.execQueryAsync("INSERT INTO thumbs_shown (thumb_id, position, fixed) VALUES(:id, :index, :fixed)",{
id: 0,
index: index,
fixed: Number(newThumbData.pinned)},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,{
pinned: newThumbData.pinned});
}
);
return;
}

if (emptyLastThumb && index === till - 1)
{
emptyPositions.push(index);
return callback();
}

newThumbsUrls.push(newThumbData.url);
self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url",{
url: newThumbData.url},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
if (! rowsData.length)
{
(function Thumbs__saveThumbsData_insertSavedThumbs(thumbRowId) {
var title = newThumbData.title || null;
var insertTimestamp = Math.round(Date.now() / 1000);
async.parallel([function Thumbs__saveThumbsData_insertSavedThumbs_thumbs(callback) {
self._database.execQueryAsync("INSERT INTO thumbs(rowid, url, title, insertTimestamp) VALUES(:id, :url, :title, :ts)",{
id: thumbRowId,
url: newThumbData.url,
title: title,
ts: insertTimestamp},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
, function Thumbs__saveThumbsData_insertSavedThumbs_shown(callback) {
self._database.execQueryAsync("INSERT INTO thumbs_shown (thumb_id, position, fixed) VALUES(:id, :index, :fixed)",{
id: thumbRowId,
index: index,
fixed: Number(newThumbData.pinned)},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
],function (err) {
var nodeURI = self._application.fastdial.url2nsIURI(newThumbData.url);
var output = {
rowid: thumbRowId,
url: newThumbData.url,
isIndexPage: nodeURI.path === "/",
title: title,
ts: insertTimestamp,
pinned: newThumbData.pinned};
callback(err,output);
}
);
}
)(++maxRowID);
return;
}

var title = newThumbData.title || null;
var tasks = {
};
tasks.insertIntoShown = function (callback) {
var data = {
id: rowsData[0].rowid,
index: index,
fixed: Number(newThumbData.pinned)};
self._database.execQueryAsync("INSERT INTO thumbs_shown (thumb_id, position, fixed) VALUES(:id, :index, :fixed)",data,function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,data);
}
);
}
;
if (title !== rowsData[0].title)
{
tasks.updateTitle = function (callback) {
self._database.execQueryAsync("UPDATE thumbs SET title = :title WHERE rowid = :id",{
title: title,
id: rowsData[0].rowid},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
;
}

tasks.cloud = function (callback) {
self._application.cloudSource.requestExistingTile(newThumbData.url,callback);
}
;
async.parallel(tasks,function (err, results) {
var nodeURI = self._application.fastdial.url2nsIURI(newThumbData.url);
var output = {
rowid: rowsData[0].rowid,
url: newThumbData.url,
isIndexPage: nodeURI.path === "/",
title: title,
ts: rowsData[0].insertTimestamp,
pinned: newThumbData.pinned};
if (rowsData[0].backgroundColor)
{
output.backgroundColor = rowsData[0].backgroundColor;
output.fontColor = self._application.colors.getFontColorByBackgroundColor(output.backgroundColor);
}

if (rowsData[0].favicon)
output.favicon = rowsData[0].favicon;
if (results.cloud)
sysutils.copyProperties(results.cloud,output);
if (results.insertIntoShown)
sysutils.copyProperties(results.shown,output);
callback(err,output);
}
);
}
);
}
;
}
)(i,self.structure.get(i),thumbs[i]);
}

async.parallel(tasks,function (err, thumbs) {
if (err)
throw new Error(err);
for(let [domain, status] in Iterator(newBlacklistDomains)) {
if (status & BLACKLIST_REMOVE)
{
delete blacklist[domain];
}
 else
if (status & BLACKLIST_ADD && ! (status & BLACKLIST_DONT_ADD))
{
blacklist[domain] = true;
}

}

async.parallel([function processBlacklist(callback) {
self._database.execQueryAsync("DELETE FROM blacklist",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
var placeholders = {
};
var unionParts = Object.keys(blacklist).map(function (domain, i) {
placeholders["domain" + i] = domain;
return "SELECT :domain" + i + " AS domain";
}
);
if (! unionParts.length)
return callback();
self._database.execQueryAsync("INSERT INTO blacklist (domain) " + unionParts.join(" UNION "),placeholders,function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
);
}
, function fillEmpty(callback) {
var fakeThumbsFilled = false;
var continueWithIndex = till;
emptyPositions.sort(function (a, b) a - b);
self.structure.iterate({
nonempty: true},function (thumbData) {
if (thumbData.pinned)
return;
var nodeURI = self._application.fastdial.url2nsIURI(thumbData.url);
if (blacklist[nodeURI.host] || newThumbsUrls.indexOf(thumbData.url) !== - 1)
return;
var newThumbData = {
rowid: thumbData.rowid,
pinned: false,
url: thumbData.url,
isIndexPage: nodeURI.path === "/",
title: thumbData.title,
backgroundColor: thumbData.backgroundColor,
fontColor: self._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor),
backgroundImage: thumbData.backgroundImage,
favicon: thumbData.favicon};
if (startPickup && emptyPositions.length)
{
let position = emptyPositions.shift();
thumbs[position] = newThumbData;
fakeThumbsFilled = true;
}
 else
{
thumbs[continueWithIndex] = newThumbData;
continueWithIndex += 1;
}

}
);
callback(null,fakeThumbsFilled);
}
],function (err, results) {
if (err)
throw new Error(err);
self.structure.clear();
self.structure.set(thumbs);
self.structure.iterate({
nonempty: true},function (thumbData) {
self._getMissingThumbData(thumbData,false);
}
);
callbackAfterSave && callbackAfterSave(results[1]);
}
);
}
);
}
);
}
,
fixURL: function Thumbs_fixURL(url) {
var thumbURI = misc.tryCreateFixupURI(url);
if (thumbURI && thumbURI.scheme === "file")
return url;
url = url.replace(/;/g,":").replace(/:+/g,":").replace(/\\/g,"/").replace(/(:\/)?\/+/g,"$1/").replace(/^([\w^\:]{3,5})(\:[\/]{1,})(\S*)/,"$1://$3");
var schemaString = url.substring(0,7).replace(/^([\w^\:]{3,5})\:(\S*)/,"$1");
var bScemaSyntaxOK = false;
if (schemaString.length == 3 && schemaString != "ftp")
{
schemaString = "ftp";
}
 else
if (schemaString.length == 4 && schemaString != "http")
{
schemaString = "http";
}
 else
if (schemaString.length == 5 && schemaString != "https")
{
schemaString = "https";
}
 else
{
bScemaSyntaxOK = true;
}

if (! bScemaSyntaxOK)
url = url.replace(/^([\w^\:]{3,5})\:(\S*)/,schemaString + ":$2");
thumbURI = misc.tryCreateFixupURI(url);
if (! thumbURI)
return;
var bPluralDotsInHost;
var bCommasInHost;
var bURLTemplateOK = false;
try {
bPluralDotsInHost = /\.{2,}/.test(thumbURI.host);
bCommasInHost = /,/.test(thumbURI.host);
let urlPatternMatch = thumbURI.host.match(/([^\,\{\}\|\\\^\~\[\]\`]{5,})|(([0-9]{1,3}.^\b){4})$/);
bURLTemplateOK = ! bPluralDotsInHost && ! bCommasInHost && urlPatternMatch !== null && urlPatternMatch[0].length === thumbURI.host.length;
}
catch (e) {

}

if (! bURLTemplateOK)
{
try {
if (bCommasInHost)
thumbURI.host = thumbURI.host.replace(/,/g,".");
if (bPluralDotsInHost)
thumbURI.host = thumbURI.host.replace(/\.{2,}/g,".");
thumbURI.host = thumbURI.host.replace(/^\.+/,"");
url = thumbURI.spec;
}
catch (e) {

}

}

if (! url)
return;
if (! /^(https?|ftp):\/\//.test(url))
url = "http://" + url;
return url;
}
,
requestLocalBlacklist: function Thumbs_requestLocalBlacklist(callback) {
this._database.execQueryAsync("SELECT domain FROM blacklist",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData.map(function (row) row.domain));
}
);
}
,
searchUrlInLocalDB: function Thumbs_searchUrlInLocalDB(url, callback) {
this._database.execQueryAsync("SELECT * FROM thumbs WHERE url = :url",{
url: url},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData);
}
);
}
,
cutShownThumbsTail: function Thumbs_cutShownThumbsTail(callback) {
var tailQueueLength = this._application.layout.getThumbsNum() + PICKUP_QUEUE_TAIL;
if (this._application.preferences.get("ftabs.emptyLastThumb",false))
tailQueueLength -= 1;
this.structure.iterate(null,function (thumbData, index) {
if (index <= tailQueueLength)
return;
this.structure.delete(index);
}
,this);
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position >= :position",{
position: tailQueueLength},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback && callback();
}
);
}
,
changePinnedState: function Thumbs_changePinnedState(index, isPinned) {
var current = this.structure.get(index);
this._database.execQueryAsync("INSERT OR REPLACE INTO thumbs_shown (thumb_id, position, fixed) VALUES (:thumb_id, :position, :fixed)",{
thumb_id: current && current.url ? current.rowid : 0,
position: index,
fixed: Number(isPinned)});
var lastThumbIndex = this._application.layout.getThumbsNum() - 1;
var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
var knowsAboutLastThumb = index === lastThumbIndex;
if (knowsAboutLastThumb)
this._application.preferences.set("ftabs.emptyLastThumb",false);
if (knowsAboutLastThumb && emptyLastThumb)
this.structure.delete(lastThumbIndex);
var requestData = {
};
if (! this.structure.get(index))
this.structure.delete(index);
this.structure.set(index,{
pinned: isPinned});
requestData[index] = this.structure.get(index);
this._application.fastdial.sendRequest("thumbChanged",requestData);
}
,
get structure() {
delete this.structure;
return this.structure = function () {
var thumbs = Object.create(null);
var self = this;
return {
set: function Thumbs__structure_set(index, value) {
if (arguments.length === 1)
{
for(let [index, value] in Iterator(arguments[0])) {
this.set(index,value);
}

}
 else
{
if (! value)
return;
thumbs[index] = thumbs[index] || {
};
sysutils.copyProperties(value,thumbs[index]);
}

}
,
get: function Thumbs__structure_get(index) {
return thumbs[index];
}
,
delete: function Thumbs__structure_delete(index) {
delete thumbs[index];
}
,
clear: function Thumbs__structure_clear() {
thumbs = Object.create(null);
}
,
iterate: function Thumbs__structure_iterate(options, callback, ctx) {
options = options || {
};
var currentThumbsNum = self._application.layout.getThumbsNum();
for(let [index, thumbData] in Iterator(thumbs)) {
if (options.visible && index >= currentThumbsNum)
continue;
if (options.nonempty && (! thumbData || ! thumbData.url))
continue;
if (options.pinned && (! thumbData || ! thumbData.pinned))
continue;
callback.call(ctx,thumbData,index);
}

}
};
}
.apply(this);
}
,
get fullStructure() {
var currentThumbsNum = this._application.layout.getThumbsNum();
var output = Object.create(null);
for (let i = 0;i < currentThumbsNum;i++) output[i] = this.structure.get(i) || {
};
return output;
}
,
get brandingBlacklistDoc() {
delete this.brandingBlacklistDoc;
return this.brandingBlacklistDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/blacklist.xml");
}
,
get muteFrontendMessages() this._muteFrontendMessages,
get numberOfFilled() {
var total = 0;
this.structure.iterate({
visible: true,
nonempty: true},function () {
total += 1;
}
);
return total;
}
,
get pinnedPositions() {
var thumbsNumX = this._application.layout.layoutX;
var thumbsNumY = this._application.layout.layoutY;
var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
var currentThumbsNum = this._application.layout.getThumbsNum();
var output = [];
this.structure.iterate({
visible: true},function (thumbData, index) {
if (index === currentThumbsNum - 1 && emptyLastThumb)
thumbData = {
pinned: true};
if (! thumbData || ! thumbData.pinned)
return;
var yPosition = Math.floor(parseInt(index,10) / thumbsNumX);
var xPosition = parseInt(index,10) - yPosition * thumbsNumX;
output.push(yPosition + "." + xPosition);
}
);
return output;
}
,
get _pickupInterval() {
var prefValue = this._application.preferences.get("ftabs.pickupInterval",3600);
return Math.max(parseInt(prefValue,10),0);
}
,
get _isRefreshNeeded() {
var now = Math.round(Date.now() / 1000);
var lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime",0);
var lastRefreshDiff = Math.abs(now - lastRefreshTime);
return ! lastRefreshTime || lastRefreshDiff > REFRESH_INTERVAL;
}
,
pickupThumbs: function Thumbs_pickupThumbs(options, callback) {
this._muteFrontendMessages = true;
options = options || {
};
options.withForceThumbs = options.withForceThumbs || false;
options.num = options.num || 1;
if (options.num > 3)
{
this._muteFrontendMessages = false;
return this._application.fastdial.sendRequest("thumbChanged",this.fullStructure);
}

if (options.guid && options.guid !== this._pickupGUID)
return;
options.guid = options.guid || UUID_SVC.generateUUID().toString();
this._pickupGUID = options.guid;
this._logger.debug(strutils.formatString("Pickup session %1:%2 started...",[this._pickupGUID, options.num]));
if (this._pickupTimer)
this._pickupTimer.cancel();
var now = Math.round(Date.now() / 1000);
this._application.preferences.set("ftabs.lastPickupTime",now);
var self = this;
async.parallel({
blacklist: function Thumbs_pickupThumbs_blacklist(callback) {
self._database.execQueryAsync("SELECT domain FROM blacklist",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData);
}
);
}
,
unsafe: this._application.safebrowsing.listUnsafeDomains.bind(this._application.safebrowsing),
pinned: function Thumbs_pickupThumbs_pinned(callback) {
var sql = "SELECT thumbs.rowid, thumbs.url, thumbs.title, thumbs.backgroundImage, thumbs.backgroundColor, thumbs.favicon, shown.*                     FROM thumbs_shown AS shown LEFT JOIN thumbs ON shown.thumb_id = thumbs.rowid                     WHERE shown.fixed = 1";
self._database.execQueryAsync(sql,{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData);
}
);
}
,
branded: function Thumbs_pickupThumbs_branded(callback) {
var brandedThumbs = [];
Array.forEach(self._application.fastdial.brandingXMLDoc.querySelectorAll("pages > page"),function (page) {
var boost = page.getAttribute("boost");
boost = boost === null ? BRANDING_PAGES_BOOST : parseInt(boost,10);
brandedThumbs.push({
url: self._application.fastdial.expandBrandingURL(page.getAttribute("url")),
title: page.getAttribute("custom_title"),
fixed: 0,
boost: boost});
}
);
callback(null,brandedThumbs);
}
},function Thumbs_pickupThumbs_onDataReceived(err, results) {
if (err)
throw new Error(err);
var blockedDomains = Array.concat(results.unsafe,results.blacklist.map(function (row) row.domain));
var existingPinnedThumbs = {
};
var currentThumbsNum = self._application.layout.getThumbsNum();
var thumbsNumAvailable = self._application.layout.getThumbsNum() + PICKUP_QUEUE_TAIL;
if (self._application.preferences.get("ftabs.emptyLastThumb",false))
thumbsNumAvailable -= 1;
var historyEntries = self._getMergedHistoryQueue([]);
results.pinned.forEach(function (row) {
if (row.url)
{
let thumbDomain = self._application.fastdial.url2nsIURI(row.url).host;
if (blockedDomains.indexOf(thumbDomain) !== - 1)
{
return;
}

}

existingPinnedThumbs[row.position] = row;
}
);
var thumbs = options.withForceThumbs ? self._getForceAndPinnedThumbs(self._application.fastdial.brandingXMLDoc,existingPinnedThumbs,thumbsNumAvailable) : existingPinnedThumbs;
var pinnedDomains = [];
for(let [, thumbData] in Iterator(thumbs)) {
if (thumbData.url)
{
pinnedDomains.push(self._application.fastdial.url2nsIURI(thumbData.url).host);
}

}

results.branded.sort(function (pageA, pageB) pageB.boost - pageA.boost);
var freeThumbsNum = thumbsNumAvailable - Object.keys(thumbs).length;
var mostVisitedList = self._getMostVisitedQueue(blockedDomains.concat(pinnedDomains),results.branded,historyEntries,freeThumbsNum);
var appInfo = self._application.addonManager.info;
if (appInfo.isFreshAddonInstall && self._application.preferences.get("yabar.migrated",false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion))
{
self._logger.debug("Blocked domains are: " + JSON.stringify(blockedDomains,null,"\t"));
self._logger.debug("Pinned thumbs are: " + JSON.stringify(results.pinned,null,"\t"));
self._logger.debug("Pinned domains are: " + JSON.stringify(pinnedDomains,null,"\t"));
self._logger.debug("Pinned thumbs w/ BP-forced are: " + JSON.stringify(thumbs,null,"\t"));
self._logger.debug("Most visited queue thumbs are: " + JSON.stringify(mostVisitedList,null,"\t"));
}

async.parallel({
maxRowID: function (callback) {
self._database.execQueryAsync("SELECT MAX(rowid) AS rowid FROM thumbs",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData.length ? rowsData[0].rowid : 0);
}
);
}
,
dropShown: function (callback) {
self._database.execQueryAsync("DELETE FROM thumbs_shown",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
},function Thumbs_pickupThumbs_onClear(err, results) {
if (err)
throw new Error(err);
var maxRowID = results.maxRowID;
var tasks = {
};
var onReadyRowID = function Thumbs_pickupThumbs_onReadyRowID(rowId, thumbPosition, thumbData, callback) {
self._database.execQueryAsync("INSERT INTO thumbs_shown(thumb_id, position, fixed) VALUES(:id, :index, :fixed)",{
id: rowId,
index: thumbPosition,
fixed: Number(thumbData.fixed)},function Thumbs_pickupThumbs_onShownInserted(rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
var output = {
pinned: Boolean(thumbData.fixed)};
if (thumbData.url)
{
let thumbURI = self._application.fastdial.url2nsIURI(thumbData.url);
output.url = thumbData.url;
output.rowid = rowId;
output.isIndexPage = thumbURI.path === "/";
output.ts = thumbData.insertTimestamp;
["title", "favicon"].forEach(function Thumbs_pickupThumbs_fillOptionalFields(fieldName) {
if (thumbData[fieldName])
{
output[fieldName] = thumbData[fieldName];
}

}
);
if (thumbData.backgroundColor)
{
output.backgroundColor = thumbData.backgroundColor;
output.fontColor = self._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor);
}

}

callback(null,output);
}
);
}
;
for (let i = 0;i < thumbsNumAvailable;i++) {
if (thumbs[i] === undefined)
thumbs[i] = mostVisitedList.length ? mostVisitedList.shift() : null;
(function (index, thumbData) {
tasks[index] = function (callback) {
if (! thumbData)
return callback();
if (thumbData.rowid)
return onReadyRowID(thumbData.rowid,index,thumbData,callback);
if (! thumbData.url)
return onReadyRowID(0,index,thumbData,callback);
self._database.execQueryAsync("SELECT thumbs.rowid, thumbs.url, thumbs.title, thumbs.backgroundImage, thumbs.backgroundColor, thumbs.favicon, shown.*                                                             FROM thumbs LEFT JOIN thumbs_shown AS shown ON shown.thumb_id = thumbs.rowid                                                             WHERE thumbs.url = :url",{
url: thumbData.url},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
if (rowsData.length)
{
sysutils.copyProperties(rowsData[0],thumbData);
return onReadyRowID(rowsData[0].rowid,index,thumbData,callback);
}

(function (thumbsRowId) {
async.parallel([function Thumbs_pickupThumbs_onDataReceived_insertIntoThumbs(callback) {
self._database.execQueryAsync("INSERT INTO thumbs(rowid, url, title, backgroundColor, favicon, insertTimestamp) VALUES(:id, :url, :title, :backgroundColor, :favicon, :ts)",{
id: thumbsRowId,
url: thumbData.url,
title: thumbData.title || null,
backgroundColor: thumbData.backgroundColor || null,
favicon: null,
ts: Math.round(Date.now() / 1000)},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
self._logger.debug("Thumb (URL: " + thumbData.url + ") was inserted into DB with rowid: " + thumbsRowId);
callback();
}
);
}
, function Thumbs_pickupThumbs_onDataReceived_insertIntoShown(callback) {
self._database.execQueryAsync("INSERT INTO thumbs_shown(thumb_id, position, fixed) VALUES(:id, :index, :fixed)",{
id: thumbsRowId,
index: index,
fixed: Number(thumbData.fixed)},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
],function (err, results) {
if (err)
return callback(err);
var thumbURI = self._application.fastdial.url2nsIURI(thumbData.url);
var output = {
pinned: Boolean(thumbData.fixed),
url: thumbData.url,
rowid: thumbsRowId,
isIndexPage: thumbURI.path === "/",
ts: thumbData.insertTimestamp};
if (thumbData.title)
output.title = thumbData.title;
if (thumbData.favicon)
output.favicon = thumbData.favicon;
if (thumbData.backgroundColor)
{
output.backgroundColor = thumbData.backgroundColor;
output.fontColor = self._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor);
}

callback(null,output);
}
);
}
)(++maxRowID);
}
);
}
;
}
)(i,thumbs[i]);
}

async.parallel(tasks,function (err, thumbs) {
self.structure.clear();
if (err)
throw new Error(err);
self.structure.set(thumbs);
Services.obs.notifyObservers(this,self._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT,null);
if (self._pickupTimer)
self._pickupTimer.cancel();
self._pickupTimer = new sysutils.Timer(function () {
self.pickupThumbs();
}
, self._pickupInterval * 1000);
if (self._isRefreshNeeded)
{
self._refreshThumbsData();
}
 else
{
self.structure.iterate({
nonempty: true},function (thumbData) {
self._getMissingThumbData(thumbData,false);
}
);
}

self._checkUnsafeDomains(options.guid,options.num,callback);
}
);
}
);
}
);
}
,
_refreshThumbsData: function Thumbs__refreshThumbsData() {
this._logger.debug("Start updating thumbs' data...");
var now = Math.round(Date.now() / 1000);
var installTime = this._application.preferences.get("general.install.time");
var daysPassedAfterInstall = Math.floor((now - installTime) / 86400);
var lastRefreshTime = this._application.preferences.get("ftabs.lastRefreshThumbsTime",now);
var refreshDiff = Math.max(now - lastRefreshTime,0);
var updateBackgroundImage = daysPassedAfterInstall % 7 === 0 || refreshDiff > 7 * REFRESH_INTERVAL;
this.structure.iterate({
nonempty: true},function (thumbData) {
if (updateBackgroundImage)
delete thumbData.backgroundImage;
this._getMissingThumbData(thumbData,true);
}
,this);
this._application.preferences.set("ftabs.lastRefreshThumbsTime",now);
this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), REFRESH_INTERVAL * 1000);
}
,
_getMissingThumbData: function Thumbs__getMissingThumbData(thumbData, force) {
var self = this;
var stopValues = [undefined, null];
var uri = this._application.fastdial.url2nsIURI(thumbData.url);
force = force || false;
var onDataReady = function (data) {
self._logger.trace("DataChunk @: " + JSON.stringify([thumbData.url, data],null,"\t"));
self.structure.iterate({
nonempty: true},function (internalThumbData, index) {
if (internalThumbData.url === thumbData.url)
{
self.structure.set(index,data);
}

}
);
var requestData = {
};
self.structure.iterate({
visible: true},function (internalThumbData, index) {
if (thumbData.url === internalThumbData.url)
{
requestData[index] = internalThumbData;
}

}
);
if (! sysutils.isEmptyObject(requestData))
self._application.fastdial.sendRequest("thumbChanged",requestData);
delete data.fontColor;
delete data.backgroundImage;
var sqlParts = Object.keys(data).map(function (field) field + " = :" + field).join(", ");
var queryData = sysutils.copyObj(data);
queryData.id = thumbData.rowid;
if (sqlParts.length)
self._database.execQueryAsync("UPDATE thumbs SET " + sqlParts + " WHERE rowid = :id",queryData);
}
;
if (stopValues.indexOf(thumbData.title) !== - 1)
{
this._application.fastdial.requestTitleForURL(thumbData.url,function (err, title) {
if (err)
return self._logger.error("Error while fetching title for " + thumbData.url + ": " + err);
onDataReady({
title: title});
}
);
}

if (stopValues.indexOf(thumbData.favicon) !== - 1 || force)
{
this._application.favicons.requestFaviconForURL(uri,function (faviconData, dominantColor) {
if (! faviconData)
return;
onDataReady({
favicon: faviconData});
if (stopValues.indexOf(thumbData.backgroundColor) === - 1)
return;
onDataReady({
backgroundColor: dominantColor,
fontColor: self._application.colors.getFontColorByBackgroundColor(dominantColor)});
}
);
}

if (uri.asciiHost)
{
this._application.cloudSource.requestExistingTile(uri,function Thumbs__getMissingThumbData_onTileDataReady(err, cloudData) {
if (err)
throw new Error(err);
if (! cloudData)
return self._application.cloudSource.fetchTileFromWeb(uri);
onDataReady(cloudData);
}
);
}

}
,
_fetchThumbs: function Thumbs__fetchThumbs(callback) {
var totalThumbsNum = this._application.layout.getThumbsNum();
var sql = "SELECT thumbs.rowid, thumbs.url, shown.fixed, thumbs.title, thumbs.backgroundColor, thumbs.backgroundImage, thumbs.favicon, shown.position             FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id             WHERE shown.position < :limit             ORDER BY shown.position";
this._database.execQueryAsync(sql,{
limit: totalThumbsNum + PICKUP_QUEUE_TAIL},function (rowsData, storageError) {
if (storageError)
{
let msg = strutils.formatString("DB error: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(msg);
}

rowsData.forEach(function (thumbData) {
this.structure.set(thumbData.position,{
pinned: Boolean(thumbData.fixed)});
if (! thumbData.url)
return;
var thumb = thumbs[thumbData.position];
var bgColor = thumbData.backgroundColor || "";
this.structure.set(thumbData.position,{
rowid: thumbData.rowid,
url: thumbData.url,
title: thumbData.title || "",
isIndexPage: this._application.fastdial.url2nsIURI(thumbData.url).path === "/",
backgroundColor: bgColor,
fontColor: this._application.colors.getFontColorByBackgroundColor(bgColor),
favicon: thumbData.favicon});
if (thumbData.backgroundImage)
{
this.structure.set(thumbData.position,{
backgroundImage: thumbData.backgroundImage});
}

}
,this);
this._muteFrontendMessages = false;
callback && callback();
}
.bind(this));
}
,
_getForceAndPinnedThumbs: function Thumbs__getForceAndPinnedThumbs(xmlDoc, existingPinnedThumbs, thumbsNumAvailable) {
var output = {
};
var emptyPositions = [];
var domains = Object.create(null);
for (let i = 0;i < thumbsNumAvailable;i++) {
if (existingPinnedThumbs[i])
{
output[i] = existingPinnedThumbs[i];
if (existingPinnedThumbs[i].url)
{
domains[this._application.fastdial.url2nsIURI(output[i].url).host] = 1;
}

}
 else
{
emptyPositions.push(i);
}

}

Array.forEach(xmlDoc.querySelectorAll("pages > page[force='true']"),function (page) {
var pageURL = this._application.fastdial.expandBrandingURL(page.getAttribute("url"));
var pageDomain = this._application.fastdial.url2nsIURI(pageURL).host;
if (domains[pageDomain])
return;
var index = parseInt(page.getAttribute("index"),10) - 1;
var pageTitle = page.getAttribute("custom_title");
if (output[index] === undefined)
{
output[index] = {
url: pageURL,
title: pageTitle,
fixed: 1};
}
 else
{
if (emptyPositions.length)
{
let index = emptyPositions.shift();
output[index] = {
url: pageURL,
title: pageTitle,
fixed: 1};
}

}

}
,this);
return output;
}
,
_getMergedHistoryQueue: function Thumbs__getMergedHistoryQueue(topHistoryData) {
var output = [];
var queueDomains = Object.create(null);
var query = PlacesUtils.history.getNewQuery();
var options = PlacesUtils.history.getNewQueryOptions();
options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
var result = PlacesUtils.history.executeQuery(query,options);
var resultRoot = result.root;
resultRoot.containerOpen = true;
var placesCounter = 0;
var topHistoryCounter = 0;
while (output.length < MAX_HISTORY_RESULTS) {
let historyNode = placesCounter < resultRoot.childCount ? resultRoot.getChild(placesCounter) : null;
let topHistoryElem = topHistoryCounter < topHistoryData.length ? topHistoryData[topHistoryCounter] : null;
if (! historyNode && ! topHistoryElem)
break;
if (! topHistoryElem || historyNode.accessCount > topHistoryElem.visits)
{
placesCounter += 1;
if (! historyNode.title)
continue;
if (! /^(https?|ftp):\/\//.test(historyNode.uri))
continue;
let domain = this._application.fastdial.url2nsIURI(historyNode.uri).host;
if (queueDomains[domain])
continue;
output.push({
url: historyNode.uri,
title: historyNode.title,
visits: historyNode.accessCount});
queueDomains[domain] = 1;
}
 else
{
topHistoryCounter += 1;
let domain = this._application.fastdial.url2nsIURI(topHistoryElem.url).host;
if (queueDomains[domain])
continue;
output.push(topHistoryElem);
queueDomains[domain] = 1;
}

}

resultRoot.containerOpen = false;
return output;
}
,
_getMostVisitedQueue: function Thumbs__getMostVisitedQueue(blocked, branded, historyEntries, free) {
var output = [];
var queueDomains = Object.create(null);
this._logger.trace("Blocked domains: " + JSON.stringify(blocked,null,"\t"));
this._logger.trace("Branded thumbs: " + JSON.stringify(branded,null,"\t"));
this._logger.trace("History entries: " + JSON.stringify(historyEntries,null,"\t"));
this._logger.trace("Free thumbs number: " + free);
while (branded.length || historyEntries.length || output.length < free) {
let brandedPage = branded.length ? branded[0] : null;
let historyPage = historyEntries.length ? historyEntries[0] : null;
if (! historyPage && ! brandedPage)
break;
let page = ! historyPage || brandedPage && brandedPage.boost >= historyPage.visits ? branded.shift() : historyEntries.shift();
let domain = this._application.fastdial.url2nsIURI(page.url).host;
if (! domain || queueDomains[domain] || blocked.indexOf(domain) !== - 1)
continue;
queueDomains[domain] = 1;
page.fixed = 0;
output.push(page);
}

return output;
}
,
_initDatabase: function Thumbs__initDatabase() {
var dbFile = this._application.core.rootDir;
dbFile.append(DB_FILENAME);
this._database = new Database(dbFile);
var appInfo = this._application.addonManager.info;
if (appInfo.addonVersionChanged && appInfo.addonDowngraded === false)
{
let unionParts = [];
let placeholders = {
};
Array.forEach(this.brandingBlacklistDoc.querySelectorAll("item"),function (item, i) {
unionParts.push("SELECT :domain" + i + " AS domain");
placeholders["domain" + i] = item.getAttribute("domain");
}
);
if (! unionParts.length)
return;
this._database.execQuery("INSERT OR REPLACE INTO blacklist (domain) " + unionParts.join(" UNION "),placeholders);
}

}
,
_checkUnsafeDomains: function Thumbs__checkUnsafeDomains(pickupGUID, pickupNum, callback) {
var self = this;
var domains = {
};
var totalThumbsNum = this._application.layout.getThumbsNum();
this.structure.iterate({
nonempty: true},function (thumbData) {
if (thumbData.pinned)
return;
var thumbURI = this._application.fastdial.url2nsIURI(thumbData.url);
if (! thumbURI.asciiHost)
return;
domains[thumbURI.asciiHost] = 1;
}
,this);
this._application.safebrowsing.checkDomains(Object.keys(domains),function Fastdial__checkUnsafeDomains_onFinished(unsafeDomainsList) {
if (unsafeDomainsList.length)
{
self.pickupThumbs({
guid: pickupGUID,
num: ++pickupNum},callback);
}
 else
{
self._muteFrontendMessages = false;
self._application.fastdial.sendRequest("thumbChanged",self.fullStructure);
callback && callback();
}

}
);
}
,
_application: null,
_logger: null,
_database: null,
_pickupTimer: null,
_muteFrontendMessages: true,
_pickupGUID: null,
_refreshThumbsTimer: null};
