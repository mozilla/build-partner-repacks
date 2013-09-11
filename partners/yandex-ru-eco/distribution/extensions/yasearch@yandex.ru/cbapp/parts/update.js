"use strict";
const EXPORTED_SYMBOLS = ["updater"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
var barApplication;
const Interfaces = {
get IUpdateProcess() {
var IUpdateProcess = new sysutils.Interface("IUpdateProcess", ["checkPresets", "startSilentDefaultPresetUpdate", "checkUserPackagesUpdates", "updateUserComponents"]);
delete this.IUpdateProcess;
return this.IUpdateProcess = IUpdateProcess;
}
,
get IUpdateController() {
var IUpdateController = new sysutils.Interface("IUpdateController", ["start", "onPresetsDownloaded", "onDefaultPresetUpdateFinish", "onUserComponentsDataReady", "onUserComponentsUpdated"]);
delete this.IUpdateController;
return this.IUpdateController = IUpdateController;
}
,
get IPresetUpdatePair() {
var IPresetUpdatePair = new sysutils.Interface("IPresetUpdatePair", undefined, {
"oldPreset": barApplication.BarPlatform.Preset,
"newPreset": barApplication.BarPlatform.Preset});
delete this.IPresetUpdatePair;
return this.IPresetUpdatePair = IPresetUpdatePair;
}
};
function DefaultController() {

}

DefaultController.prototype = {
constructor: DefaultController,
start: function DefaultController_start(updateProcess) {
Interfaces.IUpdateProcess.checkImplementation(updateProcess);
if (updater._updatesThrottled)
{
this._logger.debug("Throttling user components update check");
this._silentDPOnly = true;
updater._updatesThrottlingTick();
}

this._updateProcess = updateProcess;
this._updateProcess.checkPresets(this._silentDPOnly);
}
,
onPresetsDownloaded: function DefaultController_onPresetsDownloaded(newDefPresetPair, newPresetPairs) {
this._newPresetPairs = newPresetPairs;
if (newDefPresetPair)
this._updateProcess.startSilentDefaultPresetUpdate(); else
this.onDefaultPresetUpdateFinish();
}
,
onDefaultPresetUpdateFinish: function DefaultController_onDefaultPresetUpdateFinish() {
if (! this._silentDPOnly)
this._updateProcess.checkUserPackagesUpdates(this._newPresetPairs);
}
,
onUserComponentsDataReady: function DefaultController_onUserComponentsDataReady(presetUpdPairs, packageInfoList) {
if (! presetUpdPairs.length && ! packageInfoList.length)
{
this._logger.debug(this._consts.MSG_NO_NEW_COMPS);
return;
}

this._logger.debug(strutils.formatString(this._consts.MSG_FOUND_COMPS,[presetUpdPairs.length, packageInfoList.length]));
if (updater.silentTrustedUpdates)
{
try {
let [silentPresetPairs, unconfirmedPresets] = misc.separateItems(presetUpdPairs,function silentPresetTest(presetPair) {
return barApplication.isTrustedPresetURL(presetPair.newPreset.address) || presetPair.newPreset.address == barApplication.defaultPresetURL;
}
);
let [silentPackages, unconfirmedPackages] = this._sortPackages(packageInfoList,silentPresetPairs);
this._unconfirmedPresets = unconfirmedPresets;
this._unconfirmedPackages = unconfirmedPackages;
if (silentPackages.length || silentPresetPairs.length)
{
this._logger.debug(strutils.formatString("Attempting silent update for %1 presets and %2 packages",[silentPresetPairs.length, silentPackages.length]));
this._updateProcess.updateUserComponents(silentPackages,silentPresetPairs);
}
 else
this._userConfirmUpdates(presetUpdPairs,packageInfoList);
}
catch (e) {
this._logger.error(this._consts.ERR_START_SILENT + e);
this._logger.debug(e.stack);
this._userConfirmUpdates(presetUpdPairs,packageInfoList);
}

}
 else
{
this._userConfirmUpdates(presetUpdPairs,packageInfoList);
}

}
,
onUserComponentsUpdated: function DefaultController_onUserComponentsUpdated(failedPresets) {
this._logger.debug(strutils.formatString(this._consts.MSG_SILENT_FINISHED,[this._unconfirmedPresets ? this._unconfirmedPresets.length : 0, this._unconfirmedPackages ? this._unconfirmedPackages.length : 0]));
if (failedPresets && failedPresets.length > 0)
this._logger.warn(this._consts.MSG_FAILED_PRESETS + failedPresets.map(function (pair) pair.newPreset.address));
this._userConfirmUpdates(this._unconfirmedPresets,this._unconfirmedPackages);
}
,
get _logger() {
var logger = barApplication.getLogger("DefUpdCtrl");
this.__defineGetter__("_logger",function () logger);
return this._logger;
}
,
_newPresetPairs: null,
_unconfirmedPresets: null,
_unconfirmedPackages: null,
_silentDPOnly: false,
_consts: {
MSG_FOUND_COMPS: "Found %1 new presets and %2 new packages.",
MSG_NO_NEW_COMPS: "No new components found. Update check finished.",
MSG_SILENT_FINISHED: "Silent updates finished. Unconfirmed presets left: %1. Unconfirmed packages left: %2",
MSG_FAILED_PRESETS: "Following presets failed to update: ",
ERR_START_SILENT: "Could not sort out and start updating silent components. "},
_sortPackages: function DefaultController__sortPackages(packageInfoList, silentPresetPairs) {
var pacMan = barApplication.packageManager;
var widgetLibrary = barApplication.widgetLibrary;
return misc.separateItems(packageInfoList,function silentPackagesTest(packageInfo) {
return pacMan.isPackageInstalled(packageInfo.id) && barApplication.isTrustedPackageURL(packageInfo.id) || silentPresetPairs.some(function (presetPair) {
var preset = presetPair.newPreset;
return preset.refsPackage(packageInfo.id) && preset.allEntries.some(function (compEntry) {
return ! widgetLibrary.isKnownComponent(compEntry.componentID) && compEntry.packageID == packageInfo.id;
}
);
}
);
}
);
}
,
_userConfirmUpdates: function DefaultController__userConfirmUpdates(presetUpdPairs, packageInfoList) {
if (! presetUpdPairs.length && ! packageInfoList.length)
return; else
this._logger.debug(strutils.formatString("Asking for user confirmation to update %1 presets and %2 packages",[presetUpdPairs.length, packageInfoList.length]));
updater._updatesThrottlingTick();
var newPresets = presetUpdPairs.map(function (pair) pair.newPreset);
misc.openWindow({
url: "chrome://" + barApplication.name + "/content/dialogs/package-management/notification-update/notification-update.xul",
features: "__popup__",
name: "notification-update",
presets: newPresets,
packageInfoList: packageInfoList,
application: barApplication,
then: this._onUserAnswer.bind(this,newPresets,packageInfoList)});
}
,
_onUserAnswer: function DefaultController__onUserAnswer(newPresets, packageInfoList, install, fastInstall) {
if (! install)
return;
misc.openWindow({
url: "chrome://" + barApplication.name + "/content/dialogs/package-management/update/update.xul",
features: "__popup__",
name: "package-management-update",
mode: "update",
presets: newPresets,
packageInfoList: packageInfoList,
application: barApplication,
simple: fastInstall,
then: function onUpdateDlgFinished(somethingUpdated) {
if (somethingUpdated)
updater.resetUpdatesThrottling();
}
});
}
};
const updater = {
init: function Updater_init(application) {
barApplication = this._application = application;
barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib,GLOBAL);
this._logger = application.getLogger("CompUpdater");
this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
var nextInterval = this._nextCheckInterval;
this._timer.initWithCallback(this,nextInterval,this._timer.TYPE_ONE_SHOT);
this._logger.config("Components updates will be checked in " + parseInt(nextInterval / 60 / 1000,10) + " minutes");
var skippedUpdatesCount = Math.floor((Date.now() - this._lastUpdateTimestamp) / this._updateInterval) - 1;
if (skippedUpdatesCount < 0)
skippedUpdatesCount = 0;
this.riseSkippedUpdatesThrottling(skippedUpdatesCount);
}
,
finalize: function Updater_finalize() {
this._timer.cancel();
}
,
get Interfaces() Interfaces,
get silentTrustedUpdates() {
return barApplication.preferences.get("barplatform.components.updates.silent-trusted",true);
}
,
checkUpdates: function Updater_checkUpdates(updateController) {
Interfaces.IUpdateController.checkImplementation(updateController);
try {
if (! misc.getTopBrowserWindow())
return;
this._logger.debug("Updates check initiated");
this._downloadBlackList(this._updateComponents.bind(this,updateController));
}
 finally {
this._timer.cancel();
this._timer.initWithCallback(this,this._updateInterval,this._timer.TYPE_ONE_SHOT);
this._logger.config("Components updates will be checked in " + parseInt(this._updateInterval / 60 / 1000,10) + " minutes");
this._lastUpdateTimestamp = Date.now();
}

}
,
notify: function Updater_notify() {
try {
this.checkUpdates(new DefaultController());
}
catch (e) {
this._logger.error("Could not check updates. " + strutils.formatError(e));
this._logger.debug(e.stack);
}

}
,
_consts: {
ERR_PRESET_DL: "Preset %1 was not downloaded. Status code: %2. Error: %3",
ERR_MFS_DL: "Manifest %1 was not downloaded. Status code: %2. Error: %3",
ERR_PKG_DL: "Package %1 was not downloaded. Status code: %2. Error: %3",
ERR_WUNIT_FAIL: "Could not get unit for widget '%1'. %2",
ERR_PUNIT_FAIL: "Could not get unit for plugin '%1'. %2",
ERR_W_MISSING: "Widget '%1' is missing",
ERR_P_MISSING: "Plugin '%1' is missing"},
_comparator: Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator),
_sysTmpDir: Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD",Ci.nsIFile),
get _obsService() {
var obs = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
delete this._obsService;
return this._obsService = obs;
}
,
get _lastUpdatePrefName() {
return this._application.name + ".updates.widgets.lastUpdateTime";
}
,
get _lastUpdateTimestamp() {
return parseInt(Preferences.get(this._lastUpdatePrefName,0),10) * 1000;
}
,
set _lastUpdateTimestamp(val) {
Preferences.set(this._lastUpdatePrefName,Math.round(val / 1000));
}
,
get _updateInterval() {
return 24 * 60 * 60 * 1000;
}
,
get _nextCheckInterval() {
var nextCheckInterval = this._updateInterval - Math.abs(this._lastUpdateTimestamp - Date.now());
nextCheckInterval = Math.max(nextCheckInterval,this._application.generateDelay() * 1000);
return nextCheckInterval;
}
,
get _blackListETag() {
return this._application.preferences.get("blacklist.etag","");
}
,
set _blackListETag(eTag) {
this._application.preferences.set("blacklist.etag",eTag);
}
,
_makeTempFile: function Updater__makeTempFile(URLStr) {
var fileName;
try {
let stdURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
stdURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD,- 1,URLStr,null,null);
let url = stdURL.QueryInterface(Components.interfaces.nsIURL);
fileName = url.fileName;
}
catch (e) {
this._logger.warn("Could not extract URL fileName. " + e);
}

var tempFile = this._sysTmpDir.clone();
tempFile.append(fileName || misc.CryptoHash.getFromString(URLStr,"MD5"));
tempFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,parseInt("0666",8));
return tempFile;
}
,
_getInstalledPresets: function Updater__getInstalledPresets(defaultOnly) {
var presets = {
};
if (defaultOnly)
{
presets[this._application.defaultPresetURL] = this._application.defaultPreset;
return presets;
}

var presetDirEntries = this._application.directories.presetsDir.directoryEntries;
while (presetDirEntries.hasMoreElements()) {
let file = presetDirEntries.getNext().QueryInterface(Ci.nsIFile);
try {
let presetAddress = decodeURIComponent(file.leafName);
let preset = new this._application.BarPlatform.Preset(file, presetAddress);
let widgetLibrary = this._application.widgetLibrary;
let used = false;
for(let componentID in preset.componentIDs) {
if (widgetLibrary.isKnownComponent(componentID))
{
used = true;
break;
}

}

if (used)
presets[preset.address] = preset; else
file.remove(false);
}
catch (e) {
this._logger.warn("Invalid preset file. " + e);
this._logger.debug(e.stack);
file.remove(true);
}

}

return presets;
}
,
_gatherUnknownComponents: function Updater__gatherUnknownComponents(preset) {
var widgetLibrary = this._application.widgetLibrary;
var unknownWIDs = {
};
var unknownPIDs = {
};
for each(let presetEntry in preset.allEntries) {
if (presetEntry.componentType == presetEntry.TYPE_WIDGET)
{
if (! widgetLibrary.isKnownWidget(presetEntry.componentID))
unknownWIDs[presetEntry.componentID] = 1;
}
 else
{
if (! this._application.widgetLibrary.isKnownPlugin(presetEntry.componentID))
unknownPIDs[presetEntry.componentID] = 1;
}

}

return [unknownWIDs, unknownPIDs];
}
,
_startAsyncDownloads: function Updater__startAsyncDownloads(URLs, bypassCache, onDownloadsComplete, noFiles) {
var downloadQueue = new patterns.AsyncTaskQueue(onDownloadsComplete);
for each(let URL in URLs) {
try {
downloadQueue.addTask(new netutils.DownloadTask(URL, noFiles ? undefined : this._makeTempFile(URL), undefined, bypassCache));
}
catch (e) {
this._logger.warn("Could not add download task for URL " + URL + ". " + e);
}

}

downloadQueue.startTasks();
}
,
_check4NewManifests: function Updater__check4NewManifests(downloadQueue) {
this._logger.debug("Checking manifests");
var pacMan = this._application.packageManager;
var blackList = this._application.packagesBlackList;
var manifestsCheckResult = {
};
for each(let mfsDlTask in downloadQueue.finishedTasks) {
let manifestURL = mfsDlTask.originalURI.spec;
manifestsCheckResult[manifestURL] = undefined;
if (mfsDlTask.statusCode === Cr.NS_OK)
{
try {
let manifestDoc = fileutils.xmlDocFromStream(mfsDlTask.getContentInputStream(),mfsDlTask.originalURI);
let packageManifest = new this._application.BarPlatform.PackageManifest(manifestURL, manifestDoc, this._application.isTrustedPackageURL(manifestURL));
let [newPkgInfo] = this._application.selectBestPackage(packageManifest);
if (! newPkgInfo)
continue;
if (pacMan.isPackageInstalled(manifestURL))
{
let currPkgInfo = pacMan.getPackageInfo(manifestURL);
if (this._comparator.compare(newPkgInfo.version,currPkgInfo.version) <= 0)
continue;
}

let packageBanReason = blackList.banReasonForPackage(newPkgInfo);
if (packageBanReason)
{
this._logger.warn(strutils.formatString("New package '%1' is banned (%2). Skipping it.",[manifestURL, packageBanReason]));
continue;
}

manifestsCheckResult[manifestURL] = newPkgInfo;
}
catch (e) {
if (manifestURL !== "http://bar.yandex.ru/packages/yandexbar")
this._logger.warn("Could not check new manifest from URL [" + manifestURL + "] \n" + strutils.formatError(e));
}

}
 else
{
this._logger.warn(strutils.formatString(this._consts.ERR_MFS_DL,[manifestURL, mfsDlTask.statusCode, mfsDlTask.error]));
}

}

return manifestsCheckResult;
}
,
_preinstallPackage: function Updater__preinstallPackage(packageInfo, archiveFile) {
var preinstDir = archiveFile.clone();
preinstDir.createUnique(Ci.nsIFile.DIRECTORY_TYPE,parseInt("0755",8));
fileutils.extractZipArchive(archiveFile,preinstDir);
var preinstPkg = new this._application.BarPlatform.ComponentPackage(preinstDir, packageInfo.id, packageInfo.permissions);
return preinstPkg;
}
,
_getComponentIDsRemovedFromPackage: function Updater__getComponentIDsRemovedFromPackage(newPackage) {
const BarPlatform = this._application.BarPlatform;
const widgetLibrary = this._application.widgetLibrary;
if (! (newPackage instanceof BarPlatform.ComponentPackage))
throw new CustomErrors.EArgType("newPackage", "BarPlatform.ComponentPackage", newPackage);
var removedWIDs = [], removedPIDs = [];
for each(let widgetID in widgetLibrary.getWidgetIDs(newPackage.id)) {
try {
let [packageID, widgetName] = BarPlatform.parseComponentID(widgetID);
let unit = newPackage.getUnit(widgetName);
unit.checkSecurity();
if (unit.componentInfo.type != "widget")
removedWIDs.push(widgetID);
}
catch (e) {
this._logger.warn(strutils.formatString(this._consts.ERR_WUNIT_FAIL,[widgetID, e]));
removedWIDs.push(widgetID);
}

}

for each(let pluginID in widgetLibrary.getPluginIDs(newPackage.id)) {
try {
let [packageID, pluginName] = BarPlatform.parseComponentID(pluginID);
let unit = newPackage.getUnit(pluginName);
unit.checkSecurity();
if (unit.componentInfo.type != "plugin")
removedPIDs.push(pluginID);
}
catch (e) {
this._logger.warn(strutils.formatString(this._consts.ERR_PUNIT_FAIL,[pluginID, e]));
removedPIDs.push(pluginID);
}

}

return [removedWIDs, removedPIDs];
}
,
_checkForMissingComponents: function Updater__checkForMissingComponents(newPackages, expectedWidgets, expectedPlugins) {
const BarPlatform = this._application.BarPlatform;
const pacMan = this._application.packageManager;
var missingWIDs = [], missingPIDs = [];
this._logger.debug("Expecting widgets: " + misc.mapKeysToArray(expectedWidgets) + ". Expecting plugins: " + misc.mapKeysToArray(expectedPlugins));
for(let widgetID in expectedWidgets) {
try {
let [packageID, widgetName] = BarPlatform.parseComponentID(widgetID);
let isNewPackage = packageID in newPackages;
let checkedPackage = isNewPackage ? newPackages[packageID].tempPackage : pacMan.getPackage(packageID);
let unit = checkedPackage.getUnit(widgetName);
if (isNewPackage)
unit.checkSecurity();
if (unit.componentInfo.type != "widget")
missingWIDs.push(widgetID);
}
catch (e) {
this._logger.warn(strutils.formatString(this._consts.ERR_WUNIT_FAIL,[widgetID, e]));
missingWIDs.push(widgetID);
}

}

for(let pluginID in expectedPlugins) {
try {
let [packageID, pluginName] = BarPlatform.parseComponentID(pluginID);
let isNewPackage = packageID in newPackages;
let checkedPackage = isNewPackage ? newPackages[packageID].tempPackage : pacMan.getPackage(packageID);
let unit = checkedPackage.getUnit(pluginName);
if (isNewPackage)
unit.checkSecurity();
if (unit.componentInfo.type != "plugin")
missingPIDs.push(pluginID);
}
catch (e) {
this._logger.warn(strutils.formatString(this._consts.ERR_PUNIT_FAIL,[pluginID, e]));
missingPIDs.push(pluginID);
}

}

return [missingWIDs, missingPIDs];
}
,
_installUpdatePackage: function Updater__installUpdatePackage(newPackage, packageInfo) {
var widgetLibrary = this._application.widgetLibrary;
if (! (newPackage instanceof this._application.BarPlatform.ComponentPackage))
throw new CustomErrors.EArgType("newPackage", "BarPlatform.ComponentPackage", newPackage);
var packageID = packageInfo.id;
var [removedWIDs, removedPIDs] = this._getComponentIDsRemovedFromPackage(newPackage);
if (removedWIDs.length > 0)
this._logger.info("The following widgets will no longer be available: " + removedWIDs);
if (removedPIDs.length > 0)
this._logger.info("The following plugins will no longer be available: " + removedPIDs);
var prevPluginsState = widgetLibrary.getCurrentPluginsState(packageID);
this._application.switchWidgets(packageID,false);
try {
let widgetsChanged = barApplication.widgetLibrary.forgetWidgets(removedWIDs,true);
let pluginsChanged = barApplication.widgetLibrary.forgetPlugins(removedPIDs,true);
barApplication.widgetLibrary.persist(widgetsChanged > 0,pluginsChanged > 0);
widgetLibrary.flushWidgets(packageID);
widgetLibrary.cleanPackageParserCache(packageID);
widgetLibrary.flushPlugins(packageID);
this._application.packageManager.installPackage(newPackage.rootDirectory,packageInfo);
this._updateBrowserWindows([packageID],removedWIDs);
}
 finally {
widgetLibrary.setPluginsState(prevPluginsState,true);
this._application.switchWidgets(packageID,true);
}

}
,
_updateBrowserWindows: function Updater__updateBrowserWindows(changedPackageIDs, obsoleteWIDs) {
if (! (changedPackageIDs && changedPackageIDs.length) && ! (obsoleteWIDs && obsoleteWIDs.length))
return;
barApplication.forEachWindow(function UpdateProcess_updBrowserWnds(controller) {
if (obsoleteWIDs)
{
for each(let widgetID in obsoleteWIDs) controller.removeWidgetsOfProto(widgetID);
}

if (changedPackageIDs)
controller.updatePalette(changedPackageIDs);
}
,this,true);
}
,
_storePreset: function Updater__storePreset(preset) {
var presetFile = this._application.directories.presetsDir;
presetFile.append(encodeURIComponent(preset.address));
preset.saveToFile(presetFile);
}
,
_compareBlacklistEffect: function Updater__compareBlacklistEffect(oldBlacklist, newBlacklist) {
var pacMan = this._application.packageManager;
var changedPackages = [];
for each(let packageID in pacMan.packageIDs) {
let packageInfo = pacMan.getPackageInfo(packageID);
let lastReason = oldBlacklist.banReasonForPackage(packageInfo);
let newReason = newBlacklist.banReasonForPackage(packageInfo);
if (! lastReason !== ! newReason)
changedPackages.push(packageInfo);
}

return changedPackages;
}
,
_updateComponents: function Updater__updateComponents(updateController) {
new UpdateProcess(updateController);
}
,
get _blackListURL() this._application.core.CONFIG.PLATFORM.BLACKLIST_URL,
_downloadBlackList: function Updater__checkBlackListUpdates(onDone) {
this._logger.debug("Downloading package black list from " + this._blackListURL);
var downloadQueue = new patterns.AsyncTaskQueue(this._onBlackListDownloaded.bind(this,onDone));
var blETag = this._blackListETag;
var reqHeaders = blETag ? {
"If-None-Match": blETag} : undefined;
var blTask = new netutils.DownloadTask(this._blackListURL, this._makeTempFile(this._blackListURL), undefined, true, reqHeaders);
downloadQueue.addTask(blTask);
downloadQueue.startTasks();
}
,
_onBlackListDownloaded: function Updater__onBlackListDownloaded(onDone, dlQueue) {
var packageInfos;
var blackListFile;
try {
let blackListDlTask = dlQueue.finishedTasks[0];
blackListFile = blackListDlTask.outputFile;
if (blackListDlTask.statusCode == Cr.NS_OK)
{
this._logger.debug("Black list download task finished OK.");
let responseStatus = blackListDlTask.httpStatus;
let newETag = blackListDlTask.findHttpResponseHeader("ETag") || "";
if (responseStatus >= 200 && responseStatus < 300 && (! newETag || newETag != this._blackListETag))
{
let blDoc = this._application.core.Lib.fileutils.xmlDocFromFile(blackListFile);
let blackList = new this._application.BarPlatform.BlackList.fromDoc(blDoc);
let prevBlackList = this._application.packagesBlackList;
this._application.packagesBlackList = blackList;
this._blackListETag = newETag;
packageInfos = this._compareBlacklistEffect(prevBlackList,blackList);
}
 else
{
this._logger.info(strutils.formatString("Black list won't be updated. Response: %1, answer ETag: '%2', my ETag: '%3'.",[responseStatus, newETag, this._blackListETag]));
}

}
 else
this._logger.warn("Black list was not downloaded. Status code: " + blackListDlTask.statusCode);
}
catch (e) {
this._logger.error("Could not update black list from [" + this._blackListURL + "] \n" + strutils.formatError(e));
}
 finally {
if (blackListFile)
fileutils.removeFileSafe(blackListFile);
}

if (packageInfos && packageInfos.length)
{
try {
let widgetLibrary = this._application.widgetLibrary;
let packageIDs = packageInfos.map(function (info) info.id);
let bannedWIDs = [];
for each(let packageID in packageIDs) bannedWIDs = bannedWIDs.concat(widgetLibrary.getWidgetIDs(packageID));
this._updateBrowserWindows(packageIDs,bannedWIDs);
for each(let packageID in packageIDs) {
widgetLibrary.flushWidgets(packageID);
}

this._showBanPopupNotification(packageInfos,onDone);
}
catch (e) {
this._logger.error("Could not apply black list. " + strutils.formatError(e));
this._logger.debug(e.stack);
if (onDone)
onDone();
}

}
 else
{
if (onDone)
onDone();
}

}
,
_showBanPopupNotification: function Updater__showBanPopupNotification(packages, onDone) {
this._logger.debug("Notifying user about changes in black list...");
misc.openWindow({
url: "chrome://" + this._application.name + "/content/dialogs/package-management/ban/ban-notification.xul",
features: "__popup__",
name: "ban-notification",
application: this._application,
then: this._onBanPopupClosed.bind(this,packages,onDone)});
}
,
_onBanPopupClosed: function Updater__onBanPopupClosed(packages, onDone, showBans) {
if (! showBans)
{
if (onDone)
onDone();
return;
}

this._application.core.Lib.misc.openWindow({
url: "chrome://" + this._application.name + "/content/dialogs/package-management/ban/ban.xul",
features: "__popup__",
name: "package-management-ban",
packages: packages,
application: this._application,
then: onDone});
}
,
riseSkippedUpdatesThrottling: function Updater_riseSkippedUpdatesThrottling(count) {
for (let i = 0;i < count;++i) {
if (! this._updatesThrottled)
break;
this._updatesThrottlingTick();
}

}
,
resetUpdatesThrottling: function Updater_resetUpdatesThrottling() {
this._updatesThrottling = 2;
}
,
get _updatesThrottled() {
return this._updatesThrottling & this._updatesThrottling - 1;
}
,
_updatesThrottlingTick: function Updater__updatesThrottlingTick() {
var current = this._updatesThrottling + 1;
var limit = this._updatesThrottlingLimit;
if (current > limit * 2)
{
current -= limit;
}

this._updatesThrottling = current;
}
,
get _updatesThrottling() {
return this._application.preferences.get(this._updatesThrottlingPrefName,2);
}
,
set _updatesThrottling(val) {
this._application.preferences.set(this._updatesThrottlingPrefName,val);
}
,
get _updatesThrottlingLimit() {
return this._application.preferences.get("barplatform.components.updates.throttling.limit",32);
}
,
get _updatesThrottlingPrefName() {
return "barplatform.components.updates.throttling";
}
};
const UpdateProcess = function UpdateProcess(updateController) {
Interfaces.IUpdateController.checkImplementation(updateController);
this._updateController = updateController;
this._logger = barApplication.getLogger("CompUpdater");
updateController.start(this);
}
;
UpdateProcess.prototype = {
constructor: UpdateProcess,
checkPresets: function UpdateProcess_checkPresets(defaultOnly) {
var checkedPresets = updater._getInstalledPresets(defaultOnly);
this._downloadPresets(checkedPresets,this._updateController.onPresetsDownloaded.bind(this._updateController));
}
,
startSilentDefaultPresetUpdate: function UpdateProcess_startSilentDefaultPresetUpdate() {
if (this._defPresetPair)
{
this._startDefPresetUpdate();
}
 else
{
this._logger.debug("No new version of default preset available");
this._updateController.onDefaultPresetUpdateFinish();
}

}
,
checkUserPackagesUpdates: function UpdateProcess_checkUserPackagesUpdates(newPresetPairs, ignoredPkgIDsSet) {
this._startUserCompsUpdate(newPresetPairs,ignoredPkgIDsSet);
}
,
updateUserComponents: function UpdateProcess_startPackagesInstallation(packageInfoList, presetPairs) {
var packageInfoSet = {
};
for each(let packageInfo in packageInfoList) packageInfoSet[packageInfo.id] = packageInfo;
this._startPackageDownloads(packageInfoSet,this._onUsrPkgsPreinstalled.bind(this,presetPairs));
}
,
_updateController: null,
_presetsChecked: null,
_defPresetPair: null,
_downloadPresets: function UpdateProcess__downloadPresets(presetMap, onDone) {
if (typeof onDone != "function")
throw new CustomErrors.EArgType("onDone", "Function", onDone);
this._logger.debug("Downloading presets: " + misc.mapKeysToArray(presetMap));
var downloadQueue = new patterns.AsyncTaskQueue(this._onPresetsDownloaded.bind(this,onDone,presetMap));
var mark = {
};
mark[barApplication.core.presetRequestMarkName] = true;
for(let presetURL in presetMap) {
try {
downloadQueue.addTask(new netutils.DownloadTask(presetURL, undefined, mark, true));
}
catch (e) {
this._logger.warn("Could not add download task for preset with URL " + presetURL + ". " + e);
}

}

downloadQueue.startTasks();
}
,
_onPresetsDownloaded: function UpdateProcess__onPresetsDownloaded(onDone, presetMap, downloadQueue) {
this._logger.debug("Checking downloaded presets");
var userUpdPairs = [];
for each(let presetDlTask in downloadQueue.finishedTasks) {
let presetURL = presetDlTask.originalURI.spec;
if (presetDlTask.statusCode === Cr.NS_OK)
{
try {
let oldPreset = presetMap[presetURL];
if (! oldPreset)
{
this._logger.warn("Older preset not found: " + presetURL);
continue;
}

let presetDoc = fileutils.xmlDocFromStream(presetDlTask.getContentInputStream(),presetDlTask.originalURI);
let newPreset = new barApplication.BarPlatform.Preset(presetDoc, presetURL);
if (updater._comparator.compare(newPreset.version,oldPreset.version) > 0)
{
let presetUpdPair = {
newPreset: newPreset,
oldPreset: oldPreset};
if (! this._defPresetPair && newPreset.updateMode != "default" && presetURL == barApplication.defaultPresetURL)
this._defPresetPair = presetUpdPair; else
userUpdPairs.push(presetUpdPair);
}

}
catch (e) {
if (presetURL !== "http://bar.yandex.ru/presets/default.xml")
this._logger.warn("Could not check new preset from " + presetURL + ". " + strutils.formatError(e));
}

}
 else
{
this._logger.warn(strutils.formatString(updater._consts.ERR_PRESET_DL,[presetURL, presetDlTask.statusCode, strutils.formatError(presetDlTask.error)]));
}

}

try {
if (onDone)
onDone(this._defPresetPair,userUpdPairs);
}
catch (e) {
this._logger.error("Update failed. " + strutils.formatError(e));
this._logger.debug(e.stack);
}

}
,
_startDefPresetUpdate: function UpdateProcess__startDefPresetUpdate() {
this._logger.debug("Silent update started");
var manifestURLsList = misc.mapKeysToArray(this._defPresetPair.newPreset.packageIDs);
this._logger.debug("Downloading package manifests: " + manifestURLsList);
updater._startAsyncDownloads(manifestURLsList,true,this._onDefPresetManifestsDownloaded.bind(this),true);
}
,
_onDefPresetManifestsDownloaded: function UpdateProcess__onDefPresetManifestsDownloaded(mfsQueue) {
this._startPackageDownloads(updater._check4NewManifests(mfsQueue),this._onDPPkgsPreinstalled.bind(this));
}
,
_startPackageDownloads: function UpdateProcess__startPackageDownloads(manifestsCheckResult, onPreinstalled) {
if (typeof onPreinstalled != "function")
throw new CustomErrors.EArgType("onPreinstalled", "Function", onPreinstalled);
var packageDlQueue = new patterns.AsyncTaskQueue(this._preinstallPackages.bind(this,manifestsCheckResult,onPreinstalled));
for each(let [packageID, packageInfo] in Iterator(manifestsCheckResult)) {
if (! packageInfo)
continue;
try {
this._logger.debug("Adding download task for package " + packageID);
let archiveDlTask = new netutils.DownloadTask(packageInfo.fileURL, updater._makeTempFile(packageInfo.fileURL), undefined, true);
archiveDlTask.packageID = packageID;
packageDlQueue.addTask(archiveDlTask);
}
catch (e) {
this._logger.warn("Could not add archive download task for URL " + packageInfo.fileURL + ". " + e);
}

}

var numDlTasks = packageDlQueue.pendingTasks.length;
if (numDlTasks > 0)
{
this._logger.debug("Downloading " + numDlTasks + " package archives...");
packageDlQueue.startTasks();
}
 else
{
this._logger.debug("No new packages are available right now.");
onPreinstalled({
});
}

}
,
_preinstallPackages: function UpdateProcess__preinstallPackages(packageInfoSet, onPreinstalled, pkgsQueue) {
const pacMan = barApplication.packageManager;
var preinstalledPackages = {
};
if (pkgsQueue)
{
for each(let pkgDlTask in pkgsQueue.finishedTasks) {
try {
let packageID = pkgDlTask.packageID;
let archiveURL = pkgDlTask.originalURI.spec;
if (pkgDlTask.statusCode !== Cr.NS_OK)
{
this._logger.warn(strutils.formatString(updater._consts.ERR_PKG_DL,[archiveURL, pkgDlTask.statusCode, pkgDlTask.error]));
continue;
}

let packageInfo = packageInfoSet[packageID];
if (! packageInfo)
{
this._logger.warn("Strange thing happened. Could not find PackageInfo for " + [packageID, archiveURL]);
continue;
}

try {
preinstalledPackages[packageID] = {
tempPackage: updater._preinstallPackage(packageInfo,pkgDlTask.outputFile),
packageInfo: packageInfo};
}
catch (e) {
this._logger.error("Could not preinstall package from " + archiveURL + ". " + strutils.formatError(e));
}

}
 finally {
fileutils.removeFileSafe(pkgDlTask.outputFile);
}

}

}

try {
onPreinstalled(preinstalledPackages);
}
 finally {
for each(let preinstInfo in preinstalledPackages) {
let rootDir = preinstInfo.tempPackage.rootDirectory;
preinstInfo.tempPackage.finalize();
fileutils.removeFileSafe(rootDir);
}

}

}
,
_onDPPkgsPreinstalled: function UpdateProcess__onDPPkgsPreinstalled(preinstalledPackages) {
this._logger.debug("Default preset and its components are ready to update");
try {
let [newDPWIDsSet, newDPPIDsSet] = updater._gatherUnknownComponents(this._defPresetPair.newPreset);
this._ensureComponentsAvailable(preinstalledPackages,newDPWIDsSet,newDPPIDsSet);
for each(let preinstInfo in preinstalledPackages) {
updater._installUpdatePackage(preinstInfo.tempPackage,preinstInfo.packageInfo);
}

this._registerNewComponents(newDPWIDsSet,newDPPIDsSet);
this._defaultPresetUpdate(this._defPresetPair.newPreset,newDPWIDsSet,newDPPIDsSet);
}
catch (e) {
this._logger.error("Silent default preset update failed. " + strutils.formatError(e));
this._logger.debug(e.stack);
}

this._updateController.onDefaultPresetUpdateFinish();
}
,
_onUsrPkgsPreinstalled: function UpdateProcess__onUsrPkgsPreinstalled(presetPairs, preinstalledPackages) {
this._logger.debug("User components are ready to update");
var failedPresets = [];
try {
for each(let preinstInfo in preinstalledPackages) {
let newPackage = preinstInfo.tempPackage;
try {
updater._installUpdatePackage(newPackage,preinstInfo.packageInfo);
}
catch (e) {
this._logger.warn(strutils.formatString("Package %1 failed to install/update. %2",[newPackage.id, e]));
this._logger.debug(e.stack);
}

}

for each(let presetPair in presetPairs) {
try {
let [newWIDsSet, newPIDsSet] = updater._gatherUnknownComponents(presetPair.newPreset);
this._ensureComponentsAvailable([],newWIDsSet,newPIDsSet);
this._registerNewComponents(newWIDsSet,newPIDsSet);
if (presetPair.newPreset.address != barApplication.defaultPresetURL)
this._userPresetUpdate(presetPair,newWIDsSet,newPIDsSet); else
this._defaultPresetUpdate(presetPair.newPreset,newWIDsSet,newPIDsSet);
}
catch (e) {
this._logger.warn(strutils.formatString("Preset %1 failed to update. %2",[presetPair.newPreset.address, e]));
this._logger.debug(e.stack);
failedPresets.push(presetPair);
}

}

}
catch (e) {
this._logger.error("Silent components update failed. " + strutils.formatError(e));
this._logger.debug(e.stack);
}

this._updateController.onUserComponentsUpdated(failedPresets);
}
,
_ensureComponentsAvailable: function UpdateProcess__ensureComponentsAvailable(preinstalledPackages, newWIDsSet, newPIDsSet) {
var [missingWIDs, missingPIDs] = updater._checkForMissingComponents(preinstalledPackages,newWIDsSet,newPIDsSet);
var errorMessage = "";
if (missingWIDs.length > 0)
errorMessage += "Missing widgets: " + missingWIDs + ".";
if (missingPIDs.length > 0)
errorMessage += "Missing plugins: " + missingPIDs + ".";
if (errorMessage)
throw new Error(errorMessage);
}
,
_registerNewComponents: function UpdateProcess__registerNewComponents(newWIDsSet, newPIDsSet) {
var widgetLibrary = barApplication.widgetLibrary;
var widgetsChanged = 0, pluginsChanged = 0;
for(let widgetID in newWIDsSet) {
if (widgetLibrary.registerWidgets(widgetID,true,true))
{
widgetsChanged++;
this._tryAddToAllPalettes([widgetID]);
}

}

for(let pluginID in newPIDsSet) pluginsChanged += widgetLibrary.registerPlugins(pluginID,true,true);
widgetLibrary.persist(widgetsChanged > 0,pluginsChanged > 0);
}
,
_tryAddToAllPalettes: function UpdateProcess__tryAddToAllPalettes(widgetIDs) {
try {
barApplication.forEachWindow(function (controller) {
controller.appendToPalette(widgetIDs);
}
);
}
catch (e) {
this._logger.error("Could not add following items to palettes: " + widgetIDs + ". " + strutils.formatError(e));
this._logger.debug(e.stack);
}

}
,
_userPresetUpdate: function UpdateProcess__userPresetUpdate(presetPair, newWIDsSet, newPIDsSet) {
var newPreset = presetPair.newPreset;
var newVisibleWidgetEntries = newPreset.visibleWidgetEntries.filter(function (wEntry) wEntry.componentID in newWIDsSet);
barApplication.forEachWindow(function UpdateProcess_applyPresetToWindow(controller) {
controller.placeWidgets(newVisibleWidgetEntries,false,true);
}
,this,true);
for each(let pluginEntry in newPreset.pluginEntries) {
if (! (pluginEntry.componentID in newPIDsSet))
continue;
try {
let plugin = barApplication.widgetLibrary.getPlugin(pluginEntry.componentID);
plugin.applySettings(pluginEntry.settings,true);
plugin.enabled = pluginEntry.enabled == pluginEntry.ENABLED_YES;
}
catch (e) {
this._logger.error("Could not activate plugin " + pluginEntry.componentID + ". " + e);
}

}

updater._storePreset(newPreset);
}
,
_defaultPresetUpdate: function UpdateProcess__defaultPresetUpdate(newPreset, newWIDsSet, newPIDsSet) {
const updateApplyModeMap = {
reset: "hard",
"soft-reset": "soft",
reorder: "order",
silent: "addleft"};
const widgetLibrary = barApplication.widgetLibrary;
const pacMan = barApplication.packageManager;
const BarPlatform = barApplication.BarPlatform;
var resetMode = newPreset.updateMode == "reset";
var softResetMode = newPreset.updateMode == "soft-reset";
var reorderMode = newPreset.updateMode == "reorder";
var prevDefPresetComps = barApplication.defaultPreset.componentIDs;
var newDefPresetWidgets = newPreset.widgetIDs;
barApplication.defaultPreset = newPreset;
if (resetMode)
BarPlatform.eraseSettings();
var applyMode = updateApplyModeMap[newPreset.updateMode] || "addleft";
var newEntries = newPreset.visibleWidgetEntries.filter(function (wEntry) wEntry.componentID in newWIDsSet);
barApplication.forEachWindow(function UpdateProcess_applyPresetToWindow(controller) {
if (applyMode == "addleft")
controller.placeWidgets(newEntries,false,true); else
controller.applyPreset(newPreset,applyMode,true);
controller.updateToolbarDefaultSet();
}
);
if (! resetMode)
{
for each(let pluginEntry in newPreset.pluginEntries) {
let isNewPlugin = pluginEntry.componentID in newPIDsSet;
let plugin = barApplication.widgetLibrary.getPlugin(pluginEntry.componentID);
plugin.applySettings(isNewPlugin ? pluginEntry.settings : pluginEntry.forcedSettings,true);
if (isNewPlugin || reorderMode)
plugin.enabled = pluginEntry.enabled == pluginEntry.ENABLED_YES;
}

}

if (resetMode || softResetMode)
{
widgetLibrary.setDefaultPluginsState(softResetMode);
let newDefPresetComps = newPreset.componentIDs;
let affectedPackages = {
};
for(let widgetID in prevDefPresetComps) {
try {
if (! (widgetID in newDefPresetComps))
{
widgetLibrary.forgetComponents([widgetID]);
let [packageID] = BarPlatform.parseComponentID(widgetID);
affectedPackages[packageID] = 1;
}

}
catch (e) {
this._logger.error("Could not uninstall component. " + strutils.formatError(e));
}

}

for(let packageID in affectedPackages) {
if (widgetLibrary.getWidgetIDs(packageID).length < 1)
{
pacMan.uninstallPackage(packageID,true);
widgetLibrary.cleanPackageParserCache(packageID);
}

}

}

updater._storePreset(newPreset);
updater._obsService.notifyObservers(null,barApplication.core.eventTopics.EVT_AFTER_DEFPRESET_UPD,null);
}
,
_startUserCompsUpdate: function UpdateProcess__startUserCompsUpdate(presetUpdPairs, ignoredPkgIDsSet) {
this._logger.debug("User components update started. We have " + presetUpdPairs.length + " new presets");
var packageIDsSet = {
};
for each(let presetPair in presetUpdPairs) {
let preset = presetPair.newPreset;
sysutils.copyProperties(preset.packageIDs,packageIDsSet,ignoredPkgIDsSet);
}

for each(let [, packageID] in Iterator(barApplication.packageManager.packageIDs)) {
if (! ignoredPkgIDsSet || ! (packageID in ignoredPkgIDsSet))
packageIDsSet[packageID] = 1;
}

var URLsList = misc.mapKeysToArray(packageIDsSet);
if (URLsList.length > 0)
{
this._logger.debug("Need to check manifests: " + URLsList);
updater._startAsyncDownloads(URLsList,true,this._onUserManifestsDownloaded.bind(this,presetUpdPairs),true);
}
 else
{
this._updateController.onUserComponentsDataReady(presetUpdPairs,[]);
}

}
,
_onUserManifestsDownloaded: function UpdateProcess__onUserManifestsDownloaded(presetUpdPairs, mfsQueue) {
var manifestsCheckResult = updater._check4NewManifests(mfsQueue);
var packageInfoList = [];
for each(let packageInfo in manifestsCheckResult) {
if (packageInfo)
packageInfoList.push(packageInfo);
}

this._updateController.onUserComponentsDataReady(presetUpdPairs,packageInfoList);
}
};
