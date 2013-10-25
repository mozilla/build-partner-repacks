"use strict";
const EXPORTED_SYMBOLS = ["syncPinned"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const PREFIX = "entries.entry-";
const THRESHOLD_FASTPICKUP = 1000;
const syncPinned = {
init: function SyncPinned_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("SyncPinned");
}
,
finalize: function SyncPinned_finalize(doCleanup, callback) {
if (this._fastPickupTimer)
this._fastPickupTimer.cancel();
this._logger = null;
this._application = null;
}
,
save: function SyncPinned_save() {
if (! this._application.sync.svc || ! this.engine.enabled || ! this._engineInitFinished)
return;
var records = {
};
this._application.thumbs.structure.iterate({
pinned: true,
nonempty: true},function (thumbData, index) {
var syncId = thumbData.syncId || this._application.sync.generateId();
records[PREFIX + syncId] = JSON.stringify({
id: thumbData.id || this._application.sync.generateId(),
url: this._application.sync.prepareUrlForServer(thumbData.url),
index: parseInt(index,10),
timestamp: thumbData.syncTimestamp || Math.round(Date.now() / 1000),
instance: thumbData.syncInstance || this._application.name});
}
,this);
this._logger.trace("Saving pinned: " + JSON.stringify(records));
this.engine.set(records);
}
,
get engine() {
if (! this._application.sync.svc)
return null;
return this._application.sync.svc.getEngine("Pinned");
}
,
set initFinished(val) {
this._engineInitFinished = true;
}
,
processInitial: function SyncPinned_processInitial() {
if (! this._engineInitFinished)
return;
var records = this.engine.get(null);
var minTimestamp = Math.round(Date.now() / 1000);
var currentThumbsNum = this._application.layout.getThumbsNum();
var localThumbs = {
};
this._application.thumbs.structure.iterate({
pinned: true,
nonempty: true},function (thumb, index) {
localThumbs[index] = sysutils.copyObj(thumb);
}
,this);
this._logger.trace("Initial thumbs on server: " + JSON.stringify(records));
this._logger.trace("Local thumbs: " + JSON.stringify(localThumbs));
this._logger.trace("Visible thumbs num: " + currentThumbsNum);
for(let key in records) {
records[key] = JSON.parse(records[key]);
}

Object.keys(records).forEach(function (key) {
var serverThumb = records[key];
var isInvisible = serverThumb.index >= currentThumbsNum;
minTimestamp = Math.min(minTimestamp,serverThumb.timestamp);
Object.keys(localThumbs).forEach(function (position) {
if (isInvisible && position < currentThumbsNum)
return;
if (this._isEqualURL(localThumbs[position].url,serverThumb.url))
{
delete localThumbs[position];
}

}
,this);
}
,this);
Object.keys(localThumbs).forEach(function (position) {
var localThumb = localThumbs[position];
if (position >= currentThumbsNum)
return;
Object.keys(records).forEach(function (key) {
if (this._isEqualURL(localThumb.url,records[key].url))
{
delete records[key];
}

}
,this);
}
,this);
var output = {
};
Object.keys(localThumbs).forEach(function (position) {
var syncId = localThumbs[position].syncId || this._application.sync.generateId();
output[PREFIX + syncId] = {
id: this._application.sync.generateId(),
url: localThumbs[position].url,
index: parseInt(position,10),
timestamp: minTimestamp - 1,
instance: localThumbs[position].syncInstance || this._application.name};
}
,this);
sysutils.copyProperties(records,output);
this.processData(output,true);
}
,
processData: function SyncPinned_processData(records, isInitialSync) {
if (! this._engineInitFinished)
return;
this._logger.trace("Engine initialized. Processing data");
if (this._fastPickupTimer)
this._fastPickupTimer.cancel();
this._application.tasksRunner.pseudoSync(function (done) {
this._logger.trace("Process data: " + JSON.stringify(records));
var localPinnedThumbs = {
};
this._application.thumbs.structure.iterate({
nonempty: true,
pinned: true},function (thumbData, index) {
localPinnedThumbs[index] = thumbData;
}
,this);
var self = this;
var pinnedThumbsRegex = new RegExp("^" + PREFIX + "(.+)$");
var serverPinnedThumbs = [];
var resolvedPinnedThumbs = {
};
var wereChangesMade = false;
Object.keys(records).forEach(function (key) {
var matches = key.match(pinnedThumbsRegex);
if (! matches)
{
this._logger.error("Wrong key name: " + key);
return;
}

if (typeof records[key] === "string")
{
records[key] = JSON.parse(records[key]);
}

records[key].key = matches[1];
serverPinnedThumbs.push(records[key]);
}
,this);
serverPinnedThumbs.sort(function (a, b) {
return b.timestamp - a.timestamp;
}
);
serverPinnedThumbs.forEach(function (serverThumb) {
var currentIndex = serverThumb.index;
var localThumb = resolvedPinnedThumbs[currentIndex];
var containsLocalThumb = localThumb !== undefined;
this._logger.trace("Iterate through: " + JSON.stringify([currentIndex, localThumb, serverThumb, containsLocalThumb]));
if (containsLocalThumb)
{
let emptyPosition = this._findEmptyPosition(resolvedPinnedThumbs,currentIndex);
this._logger.trace("This position was filled. Save on position: " + emptyPosition);
serverThumb.key = this._application.sync.generateId();
serverThumb.index = emptyPosition;
serverThumb.timestamp = Math.round(Date.now() / 1000);
serverThumb.instance = this._application.name;
resolvedPinnedThumbs[emptyPosition] = serverThumb;
wereChangesMade = true;
}
 else
{
this._logger.trace("This temporary resolved position is empty");
this._logger.trace("Check thumbs for equality: " + JSON.stringify({
local: localPinnedThumbs[currentIndex],
server: serverThumb}));
if (localPinnedThumbs[currentIndex] && this._isEqualURL(serverThumb.url,localPinnedThumbs[currentIndex].url))
serverThumb.title = localPinnedThumbs[currentIndex].title || "";
if (this._wereChangesMade(localPinnedThumbs,serverThumb))
{
this._logger.trace("Thumbs differ");
wereChangesMade = true;
}

resolvedPinnedThumbs[currentIndex] = serverThumb;
}

}
,this);
var removePositions = [];
var saveData = {
};
var saveEngineData = {
};
this._application.thumbs.structure.iterate({
nonempty: true,
pinned: true},function (thumbData, index) {
removePositions.push(index);
if (resolvedPinnedThumbs[index])
{
if (this._wereChangesMade(localPinnedThumbs,resolvedPinnedThumbs[index]))
{
wereChangesMade = true;
}

}
 else
{
wereChangesMade = true;
}

}
,this);
if (removePositions.length)
{
this._logger.trace("Drop thumb(s) on positions: " + JSON.stringify(removePositions));
}

Object.keys(resolvedPinnedThumbs).forEach(function (position) {
saveData[position] = {
url: self._application.sync.prepareUrlForSave(resolvedPinnedThumbs[position].url),
title: "",
id: resolvedPinnedThumbs[position].key,
instance: resolvedPinnedThumbs[position].instance,
timestamp: resolvedPinnedThumbs[position].timestamp};
saveEngineData[PREFIX + resolvedPinnedThumbs[position].key] = JSON.stringify({
id: resolvedPinnedThumbs[position].id,
url: this._application.sync.prepareUrlForServer(resolvedPinnedThumbs[position].url),
index: parseInt(position,10),
timestamp: resolvedPinnedThumbs[position].timestamp,
instance: resolvedPinnedThumbs[position].instance});
}
,this);
if (! wereChangesMade)
{
this._logger.trace("No changes were made. Quit");
done();
return;
}

this._application.thumbs.updateCurrentSet(removePositions,saveData,function () {
if (! isInitialSync)
{
done();
return;
}

self._logger.trace("Save resolved data: " + JSON.stringify(saveEngineData));
self.engine.set(saveEngineData);
done();
self._fastPickupTimer = new sysutils.Timer(function () {
self._application.thumbs.fastPickup();
}
, THRESHOLD_FASTPICKUP);
}
);
}
,this);
}
,
_isEqualURL: function SyncPinned__isEqualURL(url1, url2) {
var uri1 = this._application.fastdial.url2nsIURI(this._application.sync.prepareUrlForServer(url1));
var uri2 = this._application.fastdial.url2nsIURI(this._application.sync.prepareUrlForServer(url2));
if (sysutils.isEmptyObject(uri1) || sysutils.isEmptyObject(uri2))
return false;
uri1 = uri1.clone();
uri2 = uri2.clone();
try {
uri1.QueryInterface(Ci.nsIURL);
uri2.QueryInterface(Ci.nsIURL);
}
catch (ex) {
return url1 === url2;
}

this._cutParams(uri1);
this._cutParams(uri2);
return uri1.spec === uri2.spec;
}
,
_cutParams: function SyncPinned__cutParams(uri) {
if (! this._application.isYandexHost(uri.host))
return uri;
uri.host = uri.host.replace(/^www\./,"");
var parsedQuery = netutils.querystring.parse(uri.query);
delete parsedQuery.clid;
if (parsedQuery.from === this._application.core.CONFIG.APP.TYPE)
delete parsedQuery.from;
uri.query = netutils.querystring.stringify(parsedQuery);
}
,
_findEmptyPosition: function SyncPinned__findEmptyPosition(pinnedThumbs, startPos) {
var currentIndex = startPos;
var moveLeft = false;
var lastCheckedIndexes = {
left: currentIndex,
right: currentIndex};
while (pinnedThumbs[currentIndex]) {
if (moveLeft && lastCheckedIndexes.left)
{
currentIndex = --lastCheckedIndexes.left;
moveLeft = false;
}
 else
{
currentIndex = ++lastCheckedIndexes.right;
moveLeft = true;
}

}

return currentIndex;
}
,
_wereChangesMade: function SyncPinned__wereChangesMade(currentPinnedThumbs, serverThumb) {
var thumb = currentPinnedThumbs[serverThumb.index];
if (! thumb)
return true;
var urlsAreEqual = this._isEqualURL(thumb.url,serverThumb.url);
var entriesKeysAreEqual = serverThumb.key === thumb.syncId;
var instancesAreEqual = serverThumb.instance === thumb.syncInstance;
var timestampsAreEqual = serverThumb.timestamp === thumb.syncTimestamp;
return ! (urlsAreEqual && entriesKeysAreEqual && instancesAreEqual && timestampsAreEqual);
}
,
_application: null,
_logger: null,
_fastPickupTimer: null,
_engineInitFinished: false};
