"use strict";
const EXPORTED_SYMBOLS = ["thumbs"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const DAILY_IDLE_EVENT = "idle-daily";
const OLDEST_THUMB_TIME_SECONDS = 86400 * 30;
const PICKUP_QUEUE_TAIL = 3;
const MAX_HISTORY_RESULTS = 100;
const MAX_PICKUP_LENGTH = 49 + 24 + 3;
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
this._fetchThumbs((function fetchThumbsOnInitCallback() {
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
).bind(this));
}
,
finalize: function Thumbs_finalize(doCleanup, callback) {
Services.obs.removeObserver(this,DAILY_IDLE_EVENT);
Services.obs.removeObserver(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT);
if (this._pickupTimer)
this._pickupTimer.cancel();
if (this._refreshThumbsTimer)
this._refreshThumbsTimer.cancel();
var dbClosedCallback = (function Thumbs_finalize_dbClosedCallback() {
this.structure = null;
this._database = null;
this._application = null;
this._logger = null;
callback();
}
).bind(this);
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
swap: function Thumbs_swap(oldIndex, newIndex) {
if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0)
return;
var pos1ThumbData = sysutils.copyObj(this.structure.get(oldIndex));
var pos2ThumbData = sysutils.copyObj(this.structure.get(newIndex));
var self = this;
this._logger.trace("Swap thumbs #" + oldIndex + " and #" + newIndex);
this._logger.trace("Old index data: " + JSON.stringify(pos1ThumbData));
this._logger.trace("New index data: " + JSON.stringify(pos2ThumbData));
if (sysutils.isEmptyObject(pos1ThumbData))
return;
var currentThumbsNum = this._application.layout.getThumbsNum();
if (newIndex === currentThumbsNum - 1)
this._application.preferences.set("ftabs.emptyLastThumb",false);
this.structure.delete(oldIndex);
this.structure.delete(newIndex);
pos1ThumbData.pinned = true;
this.structure.set(newIndex,pos1ThumbData);
var evtData = {
};
evtData[newIndex] = pos1ThumbData;
if (! sysutils.isEmptyObject(pos2ThumbData))
{
this.structure.set(oldIndex,pos2ThumbData);
evtData[oldIndex] = pos2ThumbData;
}
 else
{
evtData[oldIndex] = {
};
}

this._application.fastdial.sendRequest("thumbChanged",evtData);
this._application.tasksRunner.pseudoSync(function (done) {
var tasks = [];
tasks.push(function (callback) {
var syncId = self._application.sync.generateId();
var syncInstance = self._application.name;
var syncTimestamp = Math.round(Date.now() / 1000);
self._database.execQueryAsync("INSERT INTO thumbs_shown (position, fixed, thumb_id, syncId, syncInstance, syncTimestamp)                                                 VALUES (:index, 1, :rowid, :syncId, :syncInstance, :syncTimestamp)",{
index: newIndex,
rowid: pos1ThumbData.rowid,
syncId: syncId,
syncInstance: syncInstance,
syncTimestamp: syncTimestamp},function (rowsData, storageError) {
self.structure.set(newIndex,{
syncId: syncId,
syncInstance: syncInstance,
syncTimestamp: syncTimestamp});
callback(storageError);
}
);
}
);
if (! sysutils.isEmptyObject(pos2ThumbData))
{
tasks.push(function (callback) {
var syncId = self._application.sync.generateId();
var syncInstance = self._application.name;
var syncTimestamp = Math.round(Date.now() / 1000);
self._database.execQueryAsync("INSERT INTO thumbs_shown (position, fixed, thumb_id, syncId, syncInstance, syncTimestamp)                                                     VALUES (:index, :fixed, :rowid, :syncId, :syncInstance, :syncTimestamp)",{
index: oldIndex,
fixed: Number(pos2ThumbData.pinned),
rowid: pos2ThumbData.rowid || 0,
syncId: syncId,
syncInstance: syncInstance,
syncTimestamp: syncTimestamp},function (rowsData, storageError) {
self.structure.set(oldIndex,{
syncId: syncId,
syncInstance: syncInstance,
syncTimestamp: syncTimestamp});
callback(storageError);
}
);
}
);
}

this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position IN (:oldIndex, :newIndex)",{
oldIndex: oldIndex,
newIndex: newIndex},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB1 error: %1 (code %2)",[storageError.message, storageError.result]));
async.parallel(tasks,function (storageError) {
if (storageError)
throw new Error(strutils.formatString("DB2 error: %1 (code %2)",[storageError.message, storageError.result]));
done();
self._application.syncPinned.save();
}
);
}
);
}
,this);
}
,
remove: function Thumbs_remove(aIndex) {
var self = this;
var thumbData = this.structure.get(aIndex);
if (aIndex < 0 || sysutils.isEmptyObject(thumbData))
return;
this._logger.trace("Remove thumb #" + aIndex);
this._application.usageHistory.logAction("delete",{
index: aIndex});
this._application.tasksRunner.pseudoSync(function (done) {
this.structure.delete(aIndex);
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position = :index",{
index: aIndex},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB3 error: %1 (code %2)",[storageError.message, storageError.result]));
var hasSameDomain = false;
var thumbHost = self._application.fastdial.url2nsIURI(thumbData.url).host;
self.structure.iterate({
nonempty: true,
visible: true},function (thumbData, thumbIndex) {
if (aIndex === thumbIndex)
return;
var host = self._application.fastdial.url2nsIURI(thumbData.url).host;
if (thumbHost === host)
{
hasSameDomain = true;
}

}
,self);
if (! hasSameDomain)
{
let domain = self._application.fastdial.url2nsIURI(thumbData.url).host;
self._application.blacklist.upsertDomain(domain);
}

self._application.syncPinned.save();
self._compactUnpinned(aIndex,function (numCompacted) {
if (! numCompacted)
{
self._application.fastdial.sendRequest("thumbChanged",self.fullStructure);
self.pickupThumbs();
}

done();
}
);
}
);
}
,this);
}
,
removeSilent: function Thumbs_removeSilent(aIndex, aCallback) {
this._application.tasksRunner.pseudoSync(function (done) {
this.structure.delete(aIndex);
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position = :index",{
index: aIndex},function (rowsData, storageError) {
done();
aCallback && aCallback(storageError);
}
);
}
,this);
}
,
save: function Thumbs_save(index, data) {
var self = this;
if (index < 0 || sysutils.isEmptyObject(data))
return;
data = {
url: this.fixURL(data.url),
title: data.title.trim() || ""};
if (! data.url)
return;
this._logger.trace("Save thumb #" + index + " (" + JSON.stringify(data) + ")");
this._application.tasksRunner.pseudoSync(function (done) {
var dropSameThumbsTasks = {
};
var currentThumbsNum = this._application.layout.getThumbsNum();
this.structure.iterate({
pinned: true,
nonempty: true},function (thumbData, index) {
if (thumbData.url !== data.url || index < currentThumbsNum)
return;
dropSameThumbsTasks[index] = function (callback) {
self.structure.delete(index);
self._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position = :index",{
index: index},function (rowsData, storageError) {
if (storageError)
return callback(storageError);
self._compactUnpinned(index,function () {
callback();
}
);
}
);
}
;
}
);
async.parallel(dropSameThumbsTasks,function (err) {
if (err)
throw new Error(strutils.formatString("DB4 error: %1 (code %2)",[err.message, err.result]));
if (index === currentThumbsNum - 1)
self._application.preferences.set("ftabs.emptyLastThumb",false);
var currentThumbData = self.structure.get(index);
var uri = self._application.fastdial.url2nsIURI(data.url);
if (! currentThumbData)
{
self._application.usageHistory.logAction("add",{
url: data.url,
index: index,
title: data.title || ""});
}

var insertPositionStmt = "INSERT OR REPLACE INTO thumbs_shown                                             (thumb_id, position, fixed, syncId, syncInstance, syncTimestamp)                                             VALUES(:id, :index, 1, :syncId, :syncInstance, :syncTimestamp)";
var onThumbDataGot = function (thumbData) {
var syncId = self._application.sync.generateId();
var syncInstance = self._application.name;
var syncTimestamp = Math.round(Date.now() / 1000);
self._database.execQueryAsync(insertPositionStmt,{
id: thumbData.rowid,
index: index,
syncId: syncId,
syncInstance: syncInstance,
syncTimestamp: syncTimestamp});
thumbData.pinned = true;
thumbData.fontColor = self._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor);
thumbData.isIndexPage = self._application.fastdial.isIndexPage(uri);
thumbData.syncId = syncId;
thumbData.syncInstance = syncInstance;
thumbData.syncTimestamp = syncTimestamp;
self.structure.iterate({
nonempty: true},function (localThumbData) {
if (localThumbData.url === data.url && localThumbData.backgroundImage)
{
thumbData.backgroundImage = localThumbData.backgroundImage;
}

}
);
if (data.title.length && thumbData.title !== data.title)
{
self._database.execQueryAsync("UPDATE thumbs SET title = :title WHERE rowid = :id",{
title: data.title,
id: thumbData.rowid});
thumbData.title = data.title;
}

self.structure.set(index,thumbData);
var evtData = {
};
evtData[index] = thumbData;
self._application.fastdial.sendRequest("thumbChanged",evtData);
self._application.syncPinned.save();
done();
self._getMissingThumbData(thumbData);
}
;
self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url",{
url: data.url},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB5 error: %1 (code %2)",[storageError.message, storageError.result]));
if (rowsData.length)
{
onThumbDataGot(rowsData[0]);
return;
}

self._database.execQueryAsync("INSERT INTO thumbs (url, title, insertTimestamp) VALUES (:url, :title, :ts)",{
url: data.url,
title: data.title || null,
ts: Math.round(Date.now() / 1000)},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB6 error: %1 (code %2)",[storageError.message, storageError.result]));
self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url",{
url: data.url},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB7 error: %1 (code %2)",[storageError.message, storageError.result]));
onThumbDataGot(rowsData[0]);
}
);
}
);
}
);
self._application.blacklist.deleteDomain(uri.host);
}
);
}
,this);
}
,
updateCurrentSet: function Thumbs_updateCurrentSet(removePositions, saveData, callback) {
var self = this;
var currentThumbsNum = this._application.layout.getThumbsNum();
var requestData = {
};
var pendingCallbacks = {
};
var insertPositionStmt = "INSERT OR REPLACE INTO thumbs_shown                                     (thumb_id, position, fixed, syncId, syncInstance, syncTimestamp)                                     VALUES(:id, :index, 1, :syncId, :syncInstance, :syncTimestamp)";
var onThumbDataGot = function Thumbs_updateCurrentSet_onThumbDataGot(thumbData, index, saveData, callback) {
var uri = self._application.fastdial.url2nsIURI(saveData.url);
thumbData.pinned = true;
thumbData.fontColor = self._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor);
thumbData.isIndexPage = self._application.fastdial.isIndexPage(uri);
thumbData.syncId = saveData.id;
thumbData.syncInstance = saveData.instance;
thumbData.syncTimestamp = saveData.timestamp;
self.structure.iterate({
nonempty: true},function (localThumbData) {
if (localThumbData.url === saveData.url && localThumbData.backgroundImage)
{
thumbData.backgroundImage = localThumbData.backgroundImage;
}

}
);
if (saveData.title.length && thumbData.title !== saveData.title)
{
self._database.execQueryAsync("UPDATE thumbs SET title = :title WHERE rowid = :id",{
title: saveData.title,
id: thumbData.rowid});
thumbData.title = saveData.title;
}

self.structure.set(index,thumbData);
requestData[index] = thumbData;
self._database.execQueryAsync(insertPositionStmt,{
id: thumbData.rowid,
index: index,
syncId: saveData.id,
syncInstance: saveData.instance,
syncTimestamp: saveData.timestamp},function (rowsData, storageError) {
if (storageError)
return callback(storageError);
self._getMissingThumbData(thumbData);
callback();
}
);
}
;
var onThumbsRemoved = function Thumbs_updateCurrentSet_onThumbsRemoved() {
var saveTasks = {
};
Object.keys(saveData).forEach(function (index) {
saveTasks[index] = function (callback) {
if (index == currentThumbsNum - 1)
self._application.preferences.set("ftabs.emptyLastThumb",false);
var data = {
url: self.fixURL(saveData[index].url),
title: saveData[index].title.trim() || ""};
if (pendingCallbacks[data.url])
{
pendingCallbacks[data.url].push({
index: index,
saveData: saveData[index],
callback: callback});
return;
}

pendingCallbacks[data.url] = [{
index: index,
saveData: saveData[index],
callback: callback}];
self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url",{
url: data.url},function (rowsData, storageError) {
if (storageError)
return callback(storageError);
if (rowsData.length)
{
pendingCallbacks[data.url].forEach(function (data) {
onThumbDataGot(rowsData[0],data.index,data.saveData,data.callback);
}
);
delete pendingCallbacks[data.url];
return;
}

self._database.execQueryAsync("INSERT INTO thumbs (url, title, insertTimestamp) VALUES (:url, :title, :ts)",{
url: data.url,
title: data.title || null,
ts: Math.round(Date.now() / 1000)},function (rowsData, storageError) {
if (storageError)
return callback(storageError);
self._database.execQueryAsync("SELECT rowid, * FROM thumbs WHERE url = :url",{
url: data.url},function (rowsData, storageError) {
if (storageError)
return callback(storageError);
pendingCallbacks[data.url].forEach(function (data) {
onThumbDataGot(rowsData[0],data.index,data.saveData,data.callback);
}
);
delete pendingCallbacks[data.url];
}
);
}
);
}
);
}
;
}
);
async.parallel(saveTasks,function (storageError) {
if (storageError)
throw new Error(strutils.formatString("DB error (updateCurrentSet): %1 (code %2)",[storageError.message, storageError.result]));
self._application.fastdial.sendRequest("thumbChanged",requestData);
callback();
}
);
}
;
if (! removePositions.length)
return onThumbsRemoved();
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position IN (" + removePositions.join(",") + ")",{
},function (rowsData, storageError) {
if (storageError)
throw new Error(strutils.formatString("DB9 error: %1 (code %2)",[storageError.message, storageError.result]));
removePositions.forEach(function (pos) {
self.structure.delete(pos);
requestData[pos] = {
};
}
);
onThumbsRemoved();
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
searchUrlInLocalDB: function Thumbs_searchUrlInLocalDB(url, callback) {
this._database.execQueryAsync("SELECT * FROM thumbs WHERE url = :url",{
url: url},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB11 error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData);
}
);
}
,
cutShownThumbsTail: function Thumbs_cutShownThumbsTail(position, callback) {
this._application.tasksRunner.pseudoSync(function (done) {
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE position >= :position",{
position: position},function (rowsData, storageError) {
done();
if (storageError)
return callback(strutils.formatString("DB12 error: %1 (code %2)",[storageError.message, storageError.result]));
callback();
}
);
}
,this);
}
,
changePinnedState: function Thumbs_changePinnedState(index, isPinned) {
var current = this.structure.get(index);
var syncId, syncInstance, syncTimestamp;
var needSync;
var logMessage = strutils.formatString("%1 thumb #%2",[isPinned ? "Pin" : "Unpin", index]);
this._logger.trace(logMessage);
if (isPinned && current && current.url)
{
syncId = this._application.sync.generateId();
syncInstance = this._application.name;
syncTimestamp = Math.round(Date.now() / 1000);
}
 else
{
syncId = syncInstance = syncTimestamp = null;
}

this._database.execQueryAsync("INSERT OR REPLACE INTO thumbs_shown (thumb_id, position, fixed, syncInstance, syncId, syncTimestamp) VALUES (:thumb_id, :position, :fixed, :instance, :key, :ts)",{
thumb_id: current && current.url ? current.rowid : 0,
position: index,
fixed: Number(isPinned),
instance: syncInstance,
key: syncId,
ts: syncTimestamp});
var lastThumbIndex = this._application.layout.getThumbsNum() - 1;
var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
var knowsAboutLastThumb = index === lastThumbIndex;
if (knowsAboutLastThumb)
this._application.preferences.set("ftabs.emptyLastThumb",false);
if (isPinned)
{
needSync = current && current.url;
}
 else
{
needSync = current && current.url && current.pinned;
}

if (knowsAboutLastThumb && emptyLastThumb)
this.structure.delete(lastThumbIndex);
var requestData = {
};
if (! this.structure.get(index))
this.structure.delete(index);
var saveData = {
pinned: isPinned};
if (isPinned && current && current.url)
{
saveData.syncId = syncId;
saveData.syncTimestamp = syncTimestamp;
saveData.syncInstance = syncInstance;
}

this.structure.set(index,saveData);
requestData[index] = this.structure.get(index);
this._application.fastdial.sendRequest("thumbChanged",requestData);
if (needSync)
{
this._application.syncPinned.save();
}

}
,
pickupThumbs: function Thumbs_pickupThumbs(options) {
this._application.tasksRunner.pseudoSync(function (done) {
var self = this;
options = options || {
};
options.withForceThumbs = options.withForceThumbs || false;
options.num = options.num || 1;
if (options.num > 3)
{
this._muteFrontendMessages = false;
this._application.fastdial.sendRequest("thumbChanged",this.fullStructure);
return done();
}

this._logger.debug("Pickup session started...");
if (this._pickupTimer)
this._pickupTimer.cancel();
var now = Math.round(Date.now() / 1000);
this._application.preferences.set("ftabs.lastPickupTime",now);
async.parallel({
blacklist: function Thumbs_pickupThumbs_blacklist(callback) {
self._application.blacklist.getAll(callback);
}
,
topHistory: function Thumbs_pickupThumbs_topHistory(callback) {
callback(null,self._application.syncTopHistory.requestData());
}
,
unsafe: function Thumbs_pickupThumbs_unsafe(callback) {
self._application.safebrowsing.listUnsafeDomains(callback);
}
,
pinned: function Thumbs_pickupThumbs_pinned(callback) {
var sql = "SELECT thumbs.rowid, thumbs.url, thumbs.title, thumbs.backgroundImage, thumbs.backgroundColor, thumbs.favicon, shown.*                         FROM thumbs_shown AS shown LEFT JOIN thumbs ON shown.thumb_id = thumbs.rowid                         WHERE shown.fixed = 1";
self._database.execQueryAsync(sql,{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB14 error: %1 (code %2)",[storageError.message, storageError.result]));
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
self._logger.trace("Start data: " + JSON.stringify(results));
var blockedDomains = Array.concat(results.unsafe,results.blacklist);
var existingPinnedThumbs = {
};
var currentThumbsNum = self._application.layout.getThumbsNum();
var {local: historyEntries, tophistory: topHistoryEntries} = self._getMergedHistoryQueue(results.topHistory,results.unsafe,results.branded);
self._logger.trace("Merged history entries: " + JSON.stringify(historyEntries));
results.pinned.forEach(function (row) {
if (row.url)
{
["syncId", "syncInstance", "syncTimestamp"].forEach(function (fieldName) {
var current = self.structure.get(row.position);
if (! current)
return;
row[fieldName] = row[fieldName] || current[fieldName];
}
);
}

existingPinnedThumbs[row.position] = row;
}
);
var fixedThumbs = options.withForceThumbs ? self._getForceAndPinnedThumbs(self._application.fastdial.brandingXMLDoc,existingPinnedThumbs) : existingPinnedThumbs;
var pinnedDomains = [];
for(let [, thumbData] in Iterator(fixedThumbs)) {
if (thumbData.url)
{
pinnedDomains.push(self._application.fastdial.url2nsIURI(thumbData.url).host);
}

}

results.branded.sort(function (pageA, pageB) pageB.boost - pageA.boost);
var free = Math.max(MAX_PICKUP_LENGTH - Object.keys(fixedThumbs).length,0);
var allBlockedDomains = blockedDomains.concat(pinnedDomains);
var mostVisitedList = self._getMostVisitedQueue(allBlockedDomains,results.branded,historyEntries,free);
topHistoryEntries = topHistoryEntries.filter(function (entry) {
var domain = self._application.fastdial.url2nsIURI(entry.url).host;
return results.unsafe.indexOf(domain) === - 1;
}
);
var appInfo = self._application.addonManager.info;
if (appInfo.isFreshAddonInstall && self._application.preferences.get("yabar.migrated",false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion))
{
self._logger.debug("Blocked domains are: " + JSON.stringify(blockedDomains,null,"\t"));
self._logger.debug("Pinned thumbs are: " + JSON.stringify(results.pinned,null,"\t"));
self._logger.debug("Pinned domains are: " + JSON.stringify(pinnedDomains,null,"\t"));
self._logger.debug("Pinned thumbs w/ BP-forced are: " + JSON.stringify(fixedThumbs,null,"\t"));
self._logger.debug("Most visited queue thumbs are: " + JSON.stringify(mostVisitedList,null,"\t"));
}

async.parallel({
maxRowID: function (callback) {
self._database.execQueryAsync("SELECT MAX(rowid) AS rowid FROM thumbs",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB15 error: %1 (code %2)",[storageError.message, storageError.result]));
callback(null,rowsData.length ? rowsData[0].rowid : 0);
}
);
}
,
dropShown: function (callback) {
self._database.execQueryAsync("DELETE FROM thumbs_shown",{
},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB16 error: %1 (code %2)",[storageError.message, storageError.result]));
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
self._database.execQueryAsync("INSERT INTO thumbs_shown(thumb_id, position, fixed, syncInstance, syncId, syncTimestamp) VALUES(:id, :index, :fixed, :instance, :key, :ts)",{
id: rowId,
index: thumbPosition,
fixed: Number(thumbData.fixed),
instance: thumbData.syncInstance || null,
key: thumbData.syncId || null,
ts: thumbData.syncTimestamp || null},function Thumbs_pickupThumbs_onShownInserted(rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB17 error: %1 (code %2)",[storageError.message, storageError.result]));
var output = {
pinned: Boolean(thumbData.fixed)};
if (thumbData.url)
{
let thumbURI = self._application.fastdial.url2nsIURI(thumbData.url);
output.url = thumbData.url;
output.rowid = rowId;
output.isIndexPage = self._application.fastdial.isIndexPage(thumbURI);
output.ts = thumbData.insertTimestamp;
["title", "favicon", "syncInstance", "syncId", "syncTimestamp"].forEach(function Thumbs_pickupThumbs_fillOptionalFields(fieldName) {
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
for (let i = 0;;i++) {
if (! Object.keys(fixedThumbs).length && ! mostVisitedList.length)
break;
let thumbData;
if (fixedThumbs[i])
{
thumbData = fixedThumbs[i];
delete fixedThumbs[i];
}
 else
{
thumbData = mostVisitedList.length ? mostVisitedList.shift() : null;
}

(function (index, thumbData) {
tasks[index] = function (callback) {
if (! thumbData)
return callback();
if (thumbData.rowid)
return onReadyRowID(thumbData.rowid,index,thumbData,callback);
if (! thumbData.url)
return onReadyRowID(0,index,thumbData,callback);
self._database.execQueryAsync("SELECT thumbs.rowid, thumbs.url, thumbs.title, thumbs.backgroundImage, thumbs.backgroundColor, thumbs.favicon, shown.*                                                                 FROM thumbs LEFT JOIN thumbs_shown AS shown ON shown.thumb_id = thumbs.rowid                                                                 WHERE thumbs.url = :url",{
url: thumbData.url},function (rowsData, storageError) {
if (storageError)
return callback(strutils.formatString("DB18 error: %1 (code %2)",[storageError.message, storageError.result]));
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
return callback(strutils.formatString("DB19 error: %1 (code %2)",[storageError.message, storageError.result]));
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
return callback(strutils.formatString("DB20 error: %1 (code %2)",[storageError.message, storageError.result]));
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
isIndexPage: self._application.fastdial.isIndexPage(thumbURI),
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
)(i,thumbData);
}

async.parallel(tasks,function (err, thumbs) {
self.structure.clear();
if (err)
throw new Error(err);
self.structure.set(thumbs);
Services.obs.notifyObservers(this,self._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT,null);
self._application.fastdial.sendRequest("thumbChanged",self.fullStructure);
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

done();
self._application.safebrowsing.checkPinnedDomains(options.num,topHistoryEntries);
}
);
}
);
}
);
}
,this);
}
,
fastPickup: function Thumbs_fastPickup() {
var self = this;
var blockedDomains = [];
this.structure.iterate({
nonempty: true,
pinned: true},function (thumbData, index) {
var domain = this._application.fastdial.url2nsIURI(thumbData.url).host;
blockedDomains.push(domain);
}
,this);
this._logger.trace("Blocked domains during fast pickup: " + JSON.stringify(blockedDomains));
var emptyPositionIndex = 0;
var setRecords = {
};
var dbRecords = [];
var structureNeedsChanges = false;
var dropPositions = [];
this.structure.iterate({
nonempty: true},function (thumbData, index) {
if (thumbData.pinned)
return;
var domain = this._application.fastdial.url2nsIURI(thumbData.url).host;
if (blockedDomains.indexOf(domain) !== - 1)
{
structureNeedsChanges = true;
dropPositions.push(index);
return;
}

while (true) {
let positionThumb = self.structure.get(emptyPositionIndex);
if (! positionThumb || ! positionThumb.pinned)
break;
emptyPositionIndex += 1;
}

setRecords[emptyPositionIndex] = thumbData;
dbRecords.push([thumbData.rowid, emptyPositionIndex, thumbData.syncId, thumbData.syncInstance, thumbData.syncTimestamp]);
if (emptyPositionIndex != index)
structureNeedsChanges = true;
emptyPositionIndex += 1;
}
,this);
this._logger.trace("Need to drop records from structure: " + structureNeedsChanges);
if (! structureNeedsChanges)
return;
this.structure.iterate(null,function (thumbData, index) {
if (thumbData && thumbData.pinned)
return;
if (dbRecords.length || dropPositions.indexOf(index) !== - 1)
{
this.structure.delete(index);
}

}
,this);
this.structure.set(setRecords);
this._application.fastdial.sendRequest("thumbChanged",self.fullStructure);
this._logger.trace("Clear current unfixed thumbs from the database...");
this._application.tasksRunner.pseudoSync(function (done) {
var ending = dbRecords.length ? "" : " AND position IN (" + ["?" for (i in Array.apply([],new Array(dropPositions.length)))].join(", ") + ")";
var placeholders = dbRecords.length ? {
} : dropPositions;
this._database.execQueryAsync("DELETE FROM thumbs_shown WHERE fixed = 0" + ending,placeholders,function (rowsData, storageError) {
if (storageError)
{
let msg = strutils.formatString("DB21 error: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(msg);
}

if (! dbRecords.length)
{
self._logger.trace("Duplicating thumbs deleted!");
done();
return;
}

var multipleInsertEnding = ["(?, ?, 0, ?, ?, ?)" for (i in Array.apply([],new Array(dbRecords.length)))].join(", ");
var multipleInsertPlaceholders = Array.prototype.concat.apply([],dbRecords);
self._logger.trace("Insert new set into the database...");
self._database.execQueryAsync("INSERT INTO thumbs_shown (thumb_id, position, fixed, syncId, syncInstance, syncTimestamp) VALUES " + multipleInsertEnding,multipleInsertPlaceholders,function (rowsData, storageError) {
if (storageError)
{
let msg = strutils.formatString("DB22 error: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(msg);
}

self._logger.trace("New thumbs inserted!");
done();
}
);
}
);
}
,this);
}
,
get structure() {
delete this.structure;
return this.structure = (function () {
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
).apply(this);
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
get muteFrontendMessages() {
return this._muteFrontendMessages;
}
,
set muteFrontendMessages(value) {
this._muteFrontendMessages = value;
}
,
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
this._getMissingThumbData(thumbData,updateBackgroundImage);
}
,this);
this._application.preferences.set("ftabs.lastRefreshThumbsTime",now);
this._refreshThumbsTimer = new sysutils.Timer(this._refreshThumbsData.bind(this), REFRESH_INTERVAL * 1000);
}
,
_getMergedHistoryQueue: function Thumbs__getMergedHistoryQueue(topHistoryData, unsafeDomains, branded) {
var mergedTopHistory = [];
var queueDomains = Object.create(null);
var historyEntries = branded.map(function (entry) {
return this._application.sync.prepareUrlForServer(entry.url);
}
,this);
var topHistoryHash = {
};
topHistoryData.forEach(function (elem) {
topHistoryHash[elem.url] = elem.id;
}
);
var query = PlacesUtils.history.getNewQuery();
var options = PlacesUtils.history.getNewQueryOptions();
options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
var result = PlacesUtils.history.executeQuery(query,options);
var resultRoot = result.root;
resultRoot.containerOpen = true;
var placesCounter = 0;
var topHistoryCounter = 0;
while (mergedTopHistory.length < MAX_HISTORY_RESULTS) {
let historyNode = placesCounter < resultRoot.childCount ? resultRoot.getChild(placesCounter) : null;
let topHistoryElem = topHistoryCounter < topHistoryData.length ? topHistoryData[topHistoryCounter] : null;
if (! historyNode && ! topHistoryElem)
break;
if (! topHistoryElem || historyNode && historyNode.accessCount >= topHistoryElem.visits)
{
placesCounter += 1;
if (! historyNode.title)
continue;
if (! /^(https?|ftp):\/\//.test(historyNode.uri))
continue;
if (/(social\.yandex\.|\Woauth\d?|\/login\.php|logout)/i.test(historyNode.uri))
continue;
historyEntries.push(historyNode.uri);
let domain = this._application.fastdial.url2nsIURI(historyNode.uri).host;
if (queueDomains[domain] || unsafeDomains.indexOf(domain) !== - 1)
continue;
mergedTopHistory.push({
id: topHistoryHash[historyNode.uri] || null,
url: historyNode.uri,
title: historyNode.title,
visits: historyNode.accessCount,
isLocal: true});
queueDomains[domain] = 1;
}
 else
{
topHistoryCounter += 1;
let domain = this._application.fastdial.url2nsIURI(topHistoryElem.url).host;
if (queueDomains[domain] || unsafeDomains.indexOf(domain) !== - 1)
continue;
mergedTopHistory.push(topHistoryElem);
queueDomains[domain] = 1;
}

}

var mergedLocalHistory = mergedTopHistory.map(function (entry) {
entry = sysutils.copyObj(entry);
if (entry.isLocal)
return entry;
entry.url = this._application.syncTopHistory.saveLocalClidState(entry.url,historyEntries);
return entry;
}
,this);
resultRoot.containerOpen = false;
return {
local: mergedLocalHistory,
tophistory: mergedTopHistory};
}
,
_getMissingThumbData: function Thumbs__getMissingThumbData(thumbData, force) {
this._logger.trace("Get missing: " + JSON.stringify(thumbData));
var self = this;
var stopValues = [undefined, null];
var uri = this._application.fastdial.url2nsIURI(thumbData.url);
force = force || false;
var onDataReady = function (data) {
self.structure.iterate({
nonempty: true},function (internalThumbData, index) {
if (internalThumbData.url === thumbData.url)
{
if (data.favicon && stopValues.indexOf(internalThumbData.backgroundColor) === - 1)
{
delete data.backgroundColor;
delete data.fontColor;
}

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
favicon: faviconData,
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
if (! cloudData || force)
return self._application.cloudSource.fetchTileFromWeb(uri);
onDataReady(cloudData);
}
);
}

}
,
_fetchThumbs: function Thumbs__fetchThumbs(callback) {
var totalThumbsNum = this._application.layout.getThumbsNum();
var self = this;
var sql = "SELECT thumbs.rowid, thumbs.url, shown.fixed, thumbs.title, thumbs.backgroundColor, thumbs.backgroundImage, thumbs.favicon, shown.position             FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id             WHERE shown.position < :limit             ORDER BY shown.position";
this._database.execQueryAsync(sql,{
limit: totalThumbsNum + PICKUP_QUEUE_TAIL},(function (rowsData, storageError) {
if (storageError)
{
let msg = strutils.formatString("DB33 error: %1 (code %2)",[storageError.message, storageError.result]);
throw new Error(msg);
}

rowsData.forEach(function (thumbData) {
this.structure.set(thumbData.position,{
pinned: Boolean(thumbData.fixed)});
if (! thumbData.url)
return;
var thumb = thumbs[thumbData.position];
var uri = this._application.fastdial.url2nsIURI(thumbData.url);
this.structure.set(thumbData.position,{
rowid: thumbData.rowid,
url: thumbData.url,
title: thumbData.title,
isIndexPage: self._application.fastdial.isIndexPage(uri),
backgroundColor: thumbData.backgroundColor,
fontColor: this._application.colors.getFontColorByBackgroundColor(thumbData.backgroundColor),
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
).bind(this));
}
,
_getForceAndPinnedThumbs: function Thumbs__getForceAndPinnedThumbs(xmlDoc, existingPinnedThumbs) {
var output = {
};
var emptyPositions = [];
var domains = Object.create(null);
for (let i = 0;i < MAX_PICKUP_LENGTH;i++) {
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
_getMostVisitedQueue: function Thumbs__getMostVisitedQueue(blocked, branded, historyEntries, free) {
var output = [];
var queueDomains = Object.create(null);
while (branded.length || historyEntries.length || output.length < free) {
let brandedPage = branded.length ? branded[0] : null;
let historyPage = historyEntries.length ? historyEntries[0] : null;
if (! historyPage && ! brandedPage)
break;
let page = ! historyPage || brandedPage && brandedPage.boost > historyPage.visits ? branded.shift() : historyEntries.shift();
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
}
,
_compactUnpinned: function Thumbs__compactUnpinned(gapIndex, callback) {
var self = this;
var evtData = {
};
var tasks = {
};
var index = gapIndex;
this.structure.iterate({
nonempty: true},function (thumbData, thumbIndex) {
if (thumbIndex <= gapIndex || thumbData.pinned)
return;
this.structure.set(index,thumbData);
evtData[index] = thumbData;
this.structure.delete(thumbIndex);
evtData[thumbIndex] = {
};
tasks[thumbIndex] = (function (oldIndex, newIndex) {
return function (callback) {
self._database.execQueryAsync("UPDATE thumbs_shown SET position = :newIndex WHERE position = :oldIndex",{
oldIndex: oldIndex,
newIndex: newIndex},function (rowsData, storageError) {
callback(storageError);
}
);
}
;
}
)(thumbIndex,index);
index = thumbIndex;
}
,this);
this._application.fastdial.sendRequest("thumbChanged",evtData);
async.parallel(tasks,function (err, res) {
if (err)
throw new Error(strutils.formatString("DB334 error: %1 (code %2)",[err.message, err.result]));
callback && callback(Object.keys(res).length);
}
);
}
,
_application: null,
_logger: null,
_database: null,
_pickupTimer: null,
_muteFrontendMessages: true,
_refreshThumbsTimer: null};
