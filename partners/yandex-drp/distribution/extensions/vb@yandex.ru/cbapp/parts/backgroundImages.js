"use strict";
const EXPORTED_SYMBOLS = ["backgroundImages"];
const GLOBAL = this;
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const SYNC_JSON_URL = "https://download.cdn.yandex.net/bar/vb/bgs.json";
const BG_IMAGES_BASEPATH = "resource://vb-profile-data/backgroundImages/";
const USER_FILE_LEAFNAME = "user.jpg";
const INTERVAL_SEC = 86400;
const PREF_LAST_REQUEST_TIME = "backgroundImages.lastRequestTime";
const PREF_HEADER_LASTMODIFIED = "backgroundImages.lastModified";
const PREF_LAST_SYNCED_VERSION = "backgroundImages.lastVersion";
const PREF_SELECTED_SKIN = "ftabs.backgroundImage";
const backgroundImages = {
init: function BackgroundImages_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("BackgroundImages");
this._initFileSystem();
var now = Math.round(Date.now() / 1000);
var lastRequestTime = this._application.preferences.get(PREF_LAST_REQUEST_TIME,0);
var requestDateDiff = Math.abs(now - lastRequestTime);
var requestTimeoutMs = Math.max(INTERVAL_SEC - requestDateDiff,0) * 1000;
new sysutils.Timer(this._sync.bind(this), requestTimeoutMs, INTERVAL_SEC * 1000);
}
,
finalize: function BackgroundImages_finalize(doCleanup, callback) {
Object.keys(this._downloadTasks).forEach(function (downloadTask) {
downloadTask.abort(Components.results.NS_ERROR_NET_INTERRUPT);
}
);
this._application = null;
this._logger = null;
}
,
get list() {
var skinsFile = this._skinsFile;
var output = {
};
var previouslySelectedImage;
var skins;
if (skinsFile.exists() && skinsFile.isFile() && skinsFile.isReadable())
{
try {
skins = fileutils.jsonFromFile(skinsFile);
}
catch (ex) {
this._logger.error(ex.message);
this._logger.debug(ex.stack);
}

}

(skins || []).forEach(function ({image: image, preview: preview}) {
if (image && preview)
{
output[image] = preview;
}

}
);
var bgImagesDirEntries = this._imagesDir.directoryEntries;
while (bgImagesDirEntries.hasMoreElements()) {
let imgFile = bgImagesDirEntries.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_FILE_LEAFNAME)
{
continue;
}

let skinExistsNow = Object.keys(output).some(function (imageURL) {
var imageFilename = imageURL.split("/").pop();
return imgFile.leafName === imageFilename;
}
);
if (! skinExistsNow)
{
let uri = BG_IMAGES_BASEPATH + imgFile.leafName;
output[uri] = uri;
}

}

return output;
}
,
get userImageURL() {
this._userUploadedRandom = this._userUploadedRandom || Math.floor(Math.random() * Date.now());
var userUploadedFile = this._imagesDir;
userUploadedFile.append(USER_FILE_LEAFNAME);
if (userUploadedFile.exists() && userUploadedFile.isFile() && userUploadedFile.isReadable())
{
let outputURL = BG_IMAGES_BASEPATH + userUploadedFile.leafName + "?rnd=" + this._userUploadedRandom;
let output = {
};
output[outputURL] = outputURL;
return output;
}

return null;
}
,
get currentSelectedURL() {
var prefValue = this._application.preferences.get(PREF_SELECTED_SKIN,"");
if (prefValue === USER_FILE_LEAFNAME)
{
let userImage = this.userImageURL;
return userImage ? Object.keys(userImage)[0] : "";
}

var output = "";
for(let imageURL in this.list) {
let leafName = imageURL.split("/").pop();
if (leafName === prefValue)
{
output = imageURL;
break;
}

}

return output;
}
,
select: function BackgroundImages_select(url) {
if (url === "user")
{
if (this.userImageURL)
{
this._application.preferences.set(PREF_SELECTED_SKIN,USER_FILE_LEAFNAME);
}
 else
{
this._logger.error("User-uploaded image needs to be set as background, but it does not exist");
}

return;
}

var leafName = url.split("/").pop();
var prevSelectedSkin = this._application.preferences.get(PREF_SELECTED_SKIN);
this._application.preferences.set(PREF_SELECTED_SKIN,leafName);
var resultFile = this._imagesDir;
resultFile.append(leafName);
var resultFileExists = resultFile.exists() && resultFile.isFile() && resultFile.isReadable();
if (this._downloadTasks[url] || resultFileExists)
return;
var self = this;
this._downloadTasks[url] = new netutils.DownloadTask(url, resultFile);
this._downloadTasks[url].start({
onTaskFinished: function (task) {
if (task.statusCode === Cr.NS_OK)
{
self._logger.debug("Background '" + leafName + "' downloaded");
}
 else
{
self._logger.warn("Background '" + leafName + "' download process failed: " + task.statusCode);
self._application.preferences.set(PREF_SELECTED_SKIN,prevSelectedSkin);
self._application.fastdial.requestInit(undefined,true);
}

delete self._downloadTasks[url];
}
,
onTaskProgress: function () {

}
});
}
,
upload: function BackgroundImages_upload(aWindow, callback) {
var filepickerBundle = new this._application.appStrings.StringBundle("chrome://global/locale/filepicker.properties");
var filterTitle = filepickerBundle.tryGet("imageTitle");
if (filterTitle.length === 0)
{
this._logger.warn("Can not find \"imageTitle\" key in the filepicker.properties");
}

var filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
filePicker.init(aWindow,null,filePicker.modeOpen);
filePicker.appendFilter(filterTitle,"*.jpg; *.jpeg; *.gif; *.png");
var modalDialog = filePicker.show();
if (modalDialog !== filePicker.returnOK)
return callback("");
this._userUploadedRandom = null;
var resultFile = this._imagesDir;
resultFile.append(USER_FILE_LEAFNAME);
fileutils.removeFileSafe(resultFile);
var output = "";
try {
filePicker.file.copyTo(this._imagesDir,USER_FILE_LEAFNAME);
output = Object.keys(this.userImageURL)[0];
}
catch (ex) {
this._logger.error("Could not copy user image: " + strutils.formatError(ex));
this._logger.debug(ex.stack);
}

callback(output);
}
,
get _imagesDir() {
var bgImagesDir = this._application.core.rootDir;
bgImagesDir.append("backgroundImages");
return bgImagesDir;
}
,
get _skinsFile() {
var resultFile = this._application.core.rootDir;
resultFile.append("skins.json");
return resultFile;
}
,
get _brandingSkins() {
var brandingBgImages = this._application.branding.brandPackage.findFile("fastdial/backgrounds/").directoryEntries;
var output = [];
while (brandingBgImages.hasMoreElements()) {
let imgFile = brandingBgImages.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName))
continue;
output.push(imgFile);
}

delete this._brandingSkins;
return this._brandingSkins = output;
}
,
get brandingXMLDoc() {
delete this.brandingXMLDoc;
return this.brandingXMLDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
}
,
_initFileSystem: function Fastdial__initFileSystem() {
var bgImagesDir = this._imagesDir;
if (! bgImagesDir.exists())
{
bgImagesDir.create(Ci.nsIFile.DIRECTORY_TYPE,fileutils.PERMS_DIRECTORY);
}

var appInfo = this._application.addonManager.info;
if (appInfo.isFreshAddonInstall || appInfo.addonUpgraded)
{
this._logger.debug("Update background images directory contents");
let backgroundImagePref = this._application.preferences.get(PREF_SELECTED_SKIN,"");
let files = bgImagesDir.directoryEntries;
while (files.hasMoreElements()) {
let imgFile = files.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_FILE_LEAFNAME || imgFile.leafName === backgroundImagePref)
{
continue;
}

this._logger.debug("Remove " + imgFile.leafName + " skin");
fileutils.removeFileSafe(imgFile);
}

this._brandingSkins.forEach(function (imgFile) {
try {
imgFile.copyTo(bgImagesDir,imgFile.leafName);
this._logger.debug("Copy " + imgFile.leafName + " skin");
}
catch (ex) {

}

}
,this);
let forceChangeBg = false;
if (backgroundImagePref)
{
let bgImage = bgImagesDir.clone();
bgImage.append(backgroundImagePref);
if (! bgImage.exists() || ! bgImage.isFile() || ! bgImage.isReadable())
{
forceChangeBg = true;
}

}

let backgroundElem = this.brandingXMLDoc.querySelector("background");
let hasJustMigrated = appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated",false) || appInfo.addonUpgraded && /^1\./.test(appInfo.addonLastVersion);
let force = forceChangeBg || backgroundElem.getAttribute("force") === "true" || hasJustMigrated && this._application.preferences.get(PREF_SELECTED_SKIN).length === 0;
if (force || appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated",false) === false)
{
this._application.preferences.set(PREF_SELECTED_SKIN,backgroundElem.getAttribute("file"));
}

}

}
,
_sync: function BackgroundImages_sync() {
var self = this;
this._logger.debug("Sync background images");
var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
request.mozBackgroundRequest = true;
request.QueryInterface(Ci.nsIDOMEventTarget);
request.open("GET",SYNC_JSON_URL,true);
request.responseType = "json";
var lastModified = this._application.preferences.get(PREF_HEADER_LASTMODIFIED);
if (lastModified)
{
request.setRequestHeader("If-Modified-Since",lastModified);
}

var timer = new sysutils.Timer(request.abort.bind(request), 5000);
request.addEventListener("load",function () {
timer.cancel();
var now = Math.round(Date.now() / 1000);
self._application.preferences.set(PREF_LAST_REQUEST_TIME,now);
if (request.status === 304)
{
self._logger.debug("JSON file on server has not yet changed, status = 304");
return;
}

if (! request.response)
{
self._logger.error("Not valid JSON: " + request.responseText);
return;
}

var lastModified = request.getResponseHeader("last-modified");
if (lastModified)
{
self._application.preferences.set(PREF_HEADER_LASTMODIFIED,lastModified);
}

var lastVersion = self._application.preferences.get(PREF_LAST_SYNCED_VERSION);
var newVersion = request.response.version || 1;
if (newVersion > lastVersion)
{
self._logger.debug("Replace old skins.json (" + lastVersion + ") with a new one (" + newVersion + ")");
let skins = Array.isArray(request.response.skins) ? request.response.skins : [];
fileutils.jsonToFile(skins,self._skinsFile);
self._application.preferences.set(PREF_LAST_SYNCED_VERSION,newVersion);
let selectedBgImage = self._application.preferences.get(PREF_SELECTED_SKIN);
let brandingSkins = self._brandingSkins.map(function (imgFile) imgFile.leafName);
let bgImagesDirEntries = self._imagesDir.directoryEntries;
while (bgImagesDirEntries.hasMoreElements()) {
let imgFile = bgImagesDirEntries.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName))
continue;
if (imgFile.leafName === USER_FILE_LEAFNAME || imgFile.leafName === selectedBgImage || brandingSkins.indexOf(imgFile.leafName) !== - 1)
continue;
self._logger.debug("Remove " + imgFile.leafName + " skin");
fileutils.removeFileSafe(imgFile);
}

}

}
);
request.send();
}
,
_application: null,
_logger: null,
_userUploadedRandom: null,
_downloadTasks: {
}};
