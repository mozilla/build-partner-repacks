"use strict";
EXPORTED_SYMBOLS.push("DownloadQueue");
function DownloadQueue(queue, callback, progressmeter) {
this.queue = queue;
this.callback = callback;
this.progressmeter = progressmeter;
if (this.progressmeter)
this.progressmeter.value = 0;
if (this.queue.length == 0)
{
this.checkDefer();
return;
}

this.start();
}

;
DownloadQueue.prototype = {
start: function DownloadQueue_start() {
var failed = false;
for each(let item in this.queue) {
try {
item.uri = item.uri || item.url;
let uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(item.uri,null,null);
if (! item.file)
item.file = this.tempFile(item.uri);
let persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
persist.persistFlags = persist.PERSIST_FLAGS_REPLACE_EXISTING_FILES | persist.PERSIST_FLAGS_BYPASS_CACHE;
persist.progressListener = {
item: item,
owner: this,
onLocationChange: this.onLocationChange,
onSecurityChange: this.onSecurityChange,
onStatusChange: this.onStatusChange,
onStateChange: this.onStateChange,
onProgressChange: this.onProgressChange};
persist.saveURI(uri,null,null,null,"",item.file,null);
item.persist = persist;
}
catch (e) {
Components.utils.reportError(e);
item.done = true;
item.status = Components.results.NS_ERROR_UNEXPECTED;
failed = true;
Components.utils.reportError(e);
}

}

if (failed)
this.checkDefer();
}
,
tempFile: function DownloadQueue_tempFile(uri) {
if (! this.tempDirectory)
{
this.tempDirectory = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD",Components.interfaces.nsIFile);
}

var file = this.tempDirectory.clone();
file.append(misc.CryptoHash.getFromString(uri,"MD5"));
file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE,parseInt("0666",8));
return file;
}
,
destroy: function DownloadQueue_destroy() {
this.clean();
}
,
clean: function DownloadQueue_clean() {
for each(let item in this.queue) {
try {
if (item.persist)
item.persist.cancelSave();
}
catch (e) {

}

try {
if (item.file)
fileutils.removeFileSafe(item.file);
}
catch (e) {

}

}

}
,
checkDefer: function DownloadQueue_checkDefer() {
var context = this;
(this._timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer)).initWithCallback({
notify: function () {
context.check();
}
},1,Ci.nsITimer.TYPE_ONE_SHOT);
}
,
check: function DownloadQueue_check() {
var done = true;
for each(let item in this.queue) if (! item.done)
{
done = false;
break;
}

if (done)
this.callback(this.queue);
}
,
onLocationChange: function DownloadQueue_onLocationChange() {

}
,
onSecurityChange: function DownloadQueue_onSecurityChange() {

}
,
onStatusChange: function DownloadQueue_onStatusChange() {

}
,
onStateChange: function DownloadQueue_onStateChange(webProgress, request, state, message) {
try {
if (state & Components.interfaces.nsIWebProgressListener.STATE_STOP)
{
let item = this.item, owner = this.owner, queue = owner.queue;
let httpStatus = 400;
try {
httpStatus = request.QueryInterface(Components.interfaces.nsIHttpChannel).responseStatus;
}
catch (e) {

}

item.httpStatus = httpStatus;
item.status = request.status;
if (item.httpStatus >= 400)
item.status = Components.results.NS_ERROR_UNEXPECTED;
item.done = true;
owner.check();
}

}
catch (e) {
Components.utils.reportError(strutils.formatError(e));
}

}
,
onProgressChange: function DownloadQueue_onProgressChange(webProgress, request, currentSelfProgress, maxSelfProgress, currentTotalProgress, maxTotalProgress) {
var item = this.item, owner = this.owner, queue = owner.queue;
if (! item || ! owner || queue.length <= 0)
return;
item.percent = (maxTotalProgress <= 0 ? 1 : currentTotalProgress / maxTotalProgress) * 100;
var total = 0;
for each(let item in queue) total += item.percent;
if (this.owner.progressmeter)
this.owner.progressmeter.value = total / queue.length;
}
};
