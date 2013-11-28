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
this._application.internalStructure.iterate({
pinned: true,
nonempty: true},function (thumbData, index) {
var syncId = thumbData.sync.id || this._application.sync.generateId();
records[PREFIX + syncId] = JSON.stringify({
id: thumbData.sync.id || this._application.sync.generateId(),
url: this._application.sync.prepareUrlForServer(thumbData.source),
index: parseInt(index,10),
timestamp: thumbData.sync.timestamp || Math.round(Date.now() / 1000),
instance: thumbData.sync.instance || this._application.name});
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
this._engineInitFinished = val;
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
this._application.internalStructure.iterate({
pinned: true,
nonempty: true},function (thumbData, index) {
localThumbs[index] = {
url: thumbData.source,
syncId: thumbData.sync.id,
syncInstance: thumbData.sync.instance,
syncTimestamp: thumbData.sync.timestamp};
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
var localThumb = localThumbs[position];
var syncId = localThumb.syncId || this._application.sync.generateId();
output[PREFIX + syncId] = {
id: this._application.sync.generateId(),
url: localThumb.url,
index: parseInt(position,10),
timestamp: minTimestamp - 1,
instance: localThumb.syncInstance || this._application.name};
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
this._logger.trace("Process data: " + JSON.stringify(records));
var localPinnedThumbs = {
};
this._application.internalStructure.iterate({
nonempty: true,
pinned: true},function (thumbData, index) {
localPinnedThumbs[index] = thumbData;
}
,this);
var fastPickupSet = {
};
this._application.internalStructure.iterate({
nonempty: true},function (thumbData, index) {
if (thumbData.pinned)
return;
fastPickupSet[index] = thumbData;
}
);
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
this._logger.trace("This temporary resolved position is empty. Check thumbs for equality");
if (localPinnedThumbs[currentIndex] && localPinnedThumbs[currentIndex].source && this._isEqualURL(serverThumb.url,localPinnedThumbs[currentIndex].source))
serverThumb.title = localPinnedThumbs[currentIndex].thumb.title || "";
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
this._application.internalStructure.iterate({
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
return;
}

this._application.thumbs.updateCurrentSet(removePositions,saveData);
self._fastPickupTimer = new sysutils.Timer(function () {
self._application.thumbs.fastPickup(fastPickupSet);
}
, THRESHOLD_FASTPICKUP);
if (isInitialSync)
{
self._logger.trace("Save resolved data: " + JSON.stringify(saveEngineData));
self.engine.set(saveEngineData);
}

}
,
_isEqualURL: function SyncPinned__isEqualURL(url1, url2) {
var locationObj1 = this._application.fastdial.getDecodedLocation(url1);
var locationObj2 = this._application.fastdial.getDecodedLocation(url2);
if (! locationObj1.location || ! locationObj2.location)
return false;
try {
locationObj1.location.QueryInterface(Ci.nsIURL);
locationObj2.location.QueryInterface(Ci.nsIURL);
}
catch (ex) {
return url1 === url2;
}

this._cutParams(locationObj1.location);
this._cutParams(locationObj2.location);
return locationObj1.location.spec === locationObj2.location.spec;
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
var urlsAreEqual = this._isEqualURL(serverThumb.url,thumb.source);
var entriesKeysAreEqual = serverThumb.key === thumb.sync.id;
var instancesAreEqual = serverThumb.instance === thumb.sync.instance;
var timestampsAreEqual = serverThumb.timestamp === thumb.sync.timestamp;
return ! (urlsAreEqual && entriesKeysAreEqual && instancesAreEqual && timestampsAreEqual);
}
,
_application: null,
_logger: null,
_fastPickupTimer: null,
_engineInitFinished: false};
