"use strict";
const EXPORTED_SYMBOLS = ["AddonManager"];
const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
const OBSERVER_SERVICE = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
const AddonManager = {
SCOPE_PROFILE: 1,
SCOPE_APPLICATION: 4,
_started: false,
_applyCallback: function AM__applyCallback(aCallback) {
if (! aCallback)
return;
try {
aCallback.apply(null,Array.slice(arguments,1));
}
catch (e) {
Cu.reportError(e);
}

}
,
get gre_AddonManager() {
delete this.gre_AddonManager;
return this.gre_AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm",{
}).AddonManager;
}
,
_getInstallRdfContent: function AM__getInstallRdfContent(aAddonDirectory) {
var installRDFFile = aAddonDirectory;
installRDFFile.append("install.rdf");
var content = "";
try {
let inputStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
inputStream.init(installRDFFile,1,0,inputStream.CLOSE_ON_EOF);
let fileSize = inputStream.available();
let cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
cvstream.init(inputStream,"UTF-8",fileSize,Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
let data = {
};
cvstream.readString(fileSize,data);
content = data.value;
cvstream.close();
}
catch (e) {
Cu.reportError(e);
}

return content;
}
,
getAddonVersion: function AM_getAddonVersion(aAddonDirectory) {
var installRdfContent = this._getInstallRdfContent(aAddonDirectory);
if (installRdfContent)
{
let version = installRdfContent.match(/<em:version>([^<]*)<\/em:version>/);
if (version && /^\d+\.\d+/.test(version[1]))
return version[1];
}

throw new Error("AddonManager: can't get addon version from install.rdf");
}
,
getAddonId: function AM_getAddonId(aAddonDirectory) {
var installRdfContent = this._getInstallRdfContent(aAddonDirectory);
if (installRdfContent)
{
let addonId = installRdfContent.match(/<em:id>([^<]*)<\/em:id>/);
if (addonId && addonId[1])
return addonId[1];
}

throw new Error("AddonManager: can't get addon id from install.rdf");
}
,
disableAddonByID: function AM_disableAddonByID(aAddonId, aCallback) {
this.gre_AddonManager.getAddonByID(aAddonId,function AM_disableAddonByID_callback(aAddon) {
if (aAddon)
aAddon.userDisabled = true;
this._applyCallback(aCallback);
}
.bind(this));
}
,
uninstallAddonsByIDs: function AM_uninstallAddonsByIDs(aAddonIds, aRestartBrowser, aCallback) {
var removeAddonsDirs = function removeAddonsDirs() {
aAddonIds.forEach(function (addonId) {
var addonDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
addonDir.append("extensions");
addonDir.append(addonId);
if (! addonDir.exists())
return;
try {
addonDir.remove(true);
if (! addonDir.exists())
return;
}
catch (e) {

}

var trash = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD",Ci.nsIFile);
trash.append("trash");
trash.createUnique(Ci.nsIFile.DIRECTORY_TYPE,this.PERMS_DIRECTORY);
try {
addonDir.moveTo(trash,addonDir.leafName);
}
catch (e) {
return;
}

try {
trash.remove(true);
}
catch (e) {

}

}
);
}
;
var onUninstall = function onUninstall(addons, restart) {
removeAddonsDirs();
this._applyCallback(aCallback);
if (! ! aRestartBrowser && (restart || addons && addons.length))
{
let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
timer.initWithCallback({
notify: function AM_uninstallAddonsByIDsTimed() {
const nsIAppStartup = Ci.nsIAppStartup;
Cc["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup).quit(nsIAppStartup.eForceQuit | nsIAppStartup.eRestart);
}
},150,timer.TYPE_ONE_SHOT);
}

}
.bind(this);
var addonsUninstallCallback = false;
try {
AddonManager.getAddonsByIDs(aAddonIds,function (addons) {
if (addonsUninstallCallback)
return;
addonsUninstallCallback = true;
addons.forEach(function (addon) {
try {
addon.uninstall();
}
catch (e) {

}

}
);
onUninstall(addons);
}
);
}
catch (e) {

}

sleep(5000,function () ! addonsUninstallCallback);
if (! addonsUninstallCallback)
{
addonsUninstallCallback = true;
onUninstall(null,true);
}

}
,
getAddonsByIDs: function AM_getAddonsByIDs(aIds, aCallback) {
this.gre_AddonManager.getAddonsByIDs(aIds,aCallback);
}
,
_addonListeners: [],
startup: function AM_startup() {
if (this._started)
return;
this._started = true;
var me = this;
["onEnabling", "onEnabled", "onDisabling", "onDisabled", "onInstalling", "onInstalled", "onUninstalling", "onUninstalled", "onOperationCancelled", "onUpdateAvailable", "onNoUpdateAvailable", "onUpdateFinished", "onCompatibilityUpdateAvailable", "onNoCompatibilityUpdateAvailable", "onPropertyChanged"].forEach(function (aEvent) {
me[aEvent] = function () {
me._notifyAddonListeners.apply(me,[aEvent].concat(Array.slice(arguments)));
}
;
}
);
this.gre_AddonManager.addAddonListener(this);
}
,
shutdown: function AM_shutdown() {
if (! this._started)
return;
this._started = false;
this.gre_AddonManager.removeAddonListener(this);
this._addonListeners = null;
this._watchingAddons = null;
}
,
observe: function AM_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case "browser-ui-startup-complete":
OBSERVER_SERVICE.removeObserver(this,"browser-ui-startup-complete");
OBSERVER_SERVICE.addObserver(this,"xpcom-shutdown",false);
this.startup();
break;
case "xpcom-shutdown":
OBSERVER_SERVICE.removeObserver(this,"xpcom-shutdown");
this.shutdown();
break;
default:
break;
}

}
,
onAddonEvent: function AM_onAddonEvent(aEventType, aAddon, aPendingRestart) {
var addonId = aAddon.id;
var watchingAddon = this._watchingAddons[addonId] || null;
if (! watchingAddon)
return;
watchingAddon.installed = ! (aEventType == "onUninstalling");
}
,
_watchingAddons: Object.create(null),
watchAddonUninstall: function AM_watchAddonUninstall(aAddonId) {
this._watchingAddons[aAddonId] = {
__proto__: null,
installed: null};
this.addAddonListener(this);
}
,
isAddonUserDisabled: function AM_isAddonUserDisabled(aAddonId, aSleepTimeout) {
var result = null;
var callback = false;
this.gre_AddonManager.getAddonByID(aAddonId,function AM_isAddonUserDisabled_callback(aAddon) {
callback = true;
if (aAddon)
result = ! ! aAddon.userDisabled;
}
);
sleep(aSleepTimeout ? aSleepTimeout : 10000,function () ! callback);
return result;
}
,
isAddonUninstalling: function AM_isAddonUninstalling(aAddonId) {
var watchingAddon = this._watchingAddons[aAddonId] || null;
return watchingAddon && watchingAddon.installed === false;
}
,
addAddonListener: function AM_addAddonListener(aListener) {
if (! this._addonListeners.some(function (listener) listener == aListener))
this._addonListeners.push(aListener);
}
,
removeAddonListener: function AM_removeAddonListener(aListener) {
this._addonListeners = this._addonListeners.filter(function (listener) listener != aListener);
}
,
_notifyAddonListeners: function AM__notifyAddonListeners() {
var args = arguments;
this._addonListeners.forEach(function (aListener) {
try {
aListener.onAddonEvent.apply(aListener,args);
}
catch (e) {
Cu.reportError("AddonManager._notifyAddonListeners threw exception " + "when calling Listener.onAddonEvent: " + e);
}

}
);
}
};
function sleep(aTimeout, aConditionFunction) {
var func = typeof aConditionFunction == "function" ? aConditionFunction : function () true;
var timeout = 1;
if (typeof aTimeout == "number" && aTimeout > 0)
timeout = aTimeout;
var t = Date.now();
var conditionFunc = function () Date.now() - t < timeout && func();
var thread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
while (conditionFunc()) thread.processNextEvent(true);
}

OBSERVER_SERVICE.addObserver(AddonManager,"browser-ui-startup-complete",false);
