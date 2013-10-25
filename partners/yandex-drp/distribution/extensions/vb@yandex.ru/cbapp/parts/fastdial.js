"use strict";
const EXPORTED_SYMBOLS = ["fastdial"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
[["SESSION_STORE_SVC", "@mozilla.org/browser/sessionstore;1", "nsISessionStore"], ["DOWNLOAD_MANAGER_SVC", "@mozilla.org/download-manager-ui;1", "nsIDownloadManagerUI"], ["UUID_SVC", "@mozilla.org/uuid-generator;1", "nsIUUIDGenerator"]].forEach(function ([name, contract, intf]) XPCOMUtils.defineLazyServiceGetter(GLOBAL,name,contract,intf));
const FILE_PROTOCOL_HANDLER = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
const WINDOW_DESTROY_EVENT = "dom-window-destroyed";
const CLEAR_HISTORY_THUMBS_INTERVAL = 3600;
const USER_FILE_LEAFNAME = "user.jpg";
const USER_TEMPFILE_LEAFNAME = "temp_user.jpg";
const RECENTLY_CLOSED_TABS = 15;
const BAR_EXTENSION_ID = "yasearch@yandex.ru";
const BG_IMAGES_BASEPATH = "resource://vb-profile-data/backgroundImages/";
const NATIVE_RESTORETAB_PREFIX = "current-";
const bgImagesURLHelper = {
getURLForFile: function bgImagesURLHelper_getURLForFile(aFile) {
var uri = BG_IMAGES_BASEPATH + aFile.leafName;
if ((aFile.leafName === USER_FILE_LEAFNAME || aFile.leafName === USER_TEMPFILE_LEAFNAME) && this._randomString)
uri += "?rnd=" + this._randomString;
return uri;
}
,
getFileNameFromURL: function bgImagesURLHelper_getFileNameFromURL(aURL) {
return aURL.split("/").pop().replace(/\?rnd=.*$/,"");
}
,
randomize: function bgImagesURLHelper_randomize() {
this._randomString = Math.floor(Math.random() * Date.now());
}
,
_randomString: ""};
const fastdial = {
init: function Fastdial_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("Fastdial");
var dataProvider = this._barnavigDataProvider.init(this._application);
this._application.barnavig.addDataProvider(dataProvider);
Services.obs.addObserver(this,WINDOW_DESTROY_EVENT,false);
Services.obs.addObserver(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT,false);
this._initFileSystem();
this._clearHistoryThumbsTimer = new sysutils.Timer((function () {
this._historyThumbs = {
};
}
).bind(this), CLEAR_HISTORY_THUMBS_INTERVAL * 1000, true);
}
,
finalize: function Fastdial_finalize(doCleanup, callback) {
this._application.core.protocol.removeDataProvider(this);
Services.obs.removeObserver(this,WINDOW_DESTROY_EVENT);
Services.obs.removeObserver(this,this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT);
if (this._clearHistoryThumbsTimer)
this._clearHistoryThumbsTimer.cancel();
this._barnavigDataProvider.finalize();
this._application.barnavig.removeDataProvider(this._barnavigDataProvider);
this._registeredListeners = null;
this._startDecision = null;
this._historyThumbs = null;
this._domainsCache = null;
this._application = null;
this._logger = null;
}
,
observe: function Fastdial_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case WINDOW_DESTROY_EVENT:
if (String(aSubject.vb) == "[object Object]")
{
let utils = aSubject.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
let outerWindowID = utils.outerWindowID;
delete this._registeredListeners[outerWindowID];
delete this._startDecision[outerWindowID];
}

break;
case this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT:
aData = JSON.parse(aData);
for(let [url, historyThumbData] in Iterator(this._historyThumbs)) {
let historyThumbURI = this.url2nsIURI(url);
if (historyThumbURI.asciiHost !== aData.domain)
continue;
delete aData.domain;
sysutils.copyProperties(aData,historyThumbData);
this.sendRequest("historyThumbChanged",historyThumbData);
}

break;
case "status":
break;
}

}
,
setListenersForWindow: function Fastdial_setListenersForWindow(outerWindowId, command, callback) {
this._registeredListeners[outerWindowId] = this._registeredListeners[outerWindowId] || {
};
this._startDecision[outerWindowId] = this._startDecision[outerWindowId] || Date.now();
var listeners = this._registeredListeners[outerWindowId];
if (! listeners[command])
return listeners[command] = [callback];
if (listeners[command].indexOf(callback) === - 1)
{
listeners[command].push(callback);
}

}
,
removeListenersForWindow: function Fastdial_removeListenersForWindow(outerWindowId, command, callback) {
var listeners = this._registeredListeners[outerWindowId];
if (! listeners || ! listeners[command])
return;
if (callback === undefined)
{
delete listeners[command];
}
 else
{
let index = listeners[command].indexOf(callback);
if (index !== - 1)
{
listeners[command].splice(index,1);
}

}

}
,
hasListenerForWindow: function Fastdial_hasListenerForWindow(outerWindowId, command, callback) {
var listeners = this._registeredListeners[outerWindowId];
return listeners[command] && listeners[command].indexOf(callback) !== - 1;
}
,
sendRequest: function Fastdial_sendRequest(command, data) {
for(let outerWindowId in this._registeredListeners) {
this.sendRequestToTab(outerWindowId,command,data);
}

}
,
sendRequestToTab: function Fastdial_sendRequestToTab(outerWindowId, command, data) {
var listeners = this._registeredListeners[outerWindowId];
if (! listeners || ! listeners[command] || this._application.thumbs.muteFrontendMessages && command === "thumbChanged")
return;
data = sysutils.copyObj(data,true);
if (command === "thumbChanged")
{
let lastThumbIndex = this._application.layout.getThumbsNum() - 1;
let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
if (data[lastThumbIndex] && emptyLastThumb)
data[lastThumbIndex] = {
pinned: true};
}

this._logger.trace("SendRequest [" + command + "]: outer_window_id " + outerWindowId + ": " + JSON.stringify(data));
listeners[command].forEach(function (callback) {
if (! (outerWindowId in this._registeredListeners))
return;
try {
callback(data);
}
catch (ex) {

}

}
,this);
}
,
openExternalWindow: function Fastdial_openExternalWindow(externalWindowName, window) {
if (["downloads", "bookmarks", "history"].indexOf(externalWindowName) === - 1)
throw new Error("Wrong window type selected");
if (externalWindowName === "downloads")
{
DOWNLOAD_MANAGER_SVC.show(window);
return;
}

var leftPaneRoot;
if (externalWindowName === "bookmarks")
leftPaneRoot = "AllBookmarks"; else
if (externalWindowName === "history")
leftPaneRoot = "History";
var organizer = misc.getTopWindowOfType("Places:Organizer");
if (! organizer)
{
let topWindow = misc.getTopBrowserWindow();
topWindow.openDialog("chrome://browser/content/places/places.xul","","chrome,toolbar=yes,dialog=no,resizable",leftPaneRoot);
}
 else
{
organizer.PlacesOrganizer.selectLeftPaneQuery(leftPaneRoot);
organizer.focus();
}

}
,
requestInit: function Fastdial_requestInit(outerWindowId, ignoreBookmarks) {
var self = this;
var backboneXY = this._application.layout.getThumbsNumXY();
var maxThumbIndex = backboneXY[0] * backboneXY[1];
var backgroundImage = this._application.preferences.get("ftabs.backgroundImage");
var showBookmarks = this._application.preferences.get("ftabs.showBookmarks");
var bgImageFile = this._application.core.rootDir;
bgImageFile.append("backgroundImages");
try {
bgImageFile.append(backgroundImage);
backgroundImage = bgImagesURLHelper.getURLForFile(bgImageFile);
}
catch (e) {
let backgroundElem = this.brandingXMLDoc.querySelector("background[force='true']");
if (backgroundElem !== null)
{
backgroundImage = backgroundElem.getAttribute("file");
this._application.preferences.set("ftabs.backgroundImage",backgroundImage);
bgImageFile.append(backgroundImage);
backgroundImage = bgImagesURLHelper.getURLForFile(bgImageFile);
}
 else
{
backgroundImage = "";
this._application.preferences.set("ftabs.backgroundImage",backgroundImage);
}

}

var thumbs = this._application.thumbs.muteFrontendMessages ? {
} : this._application.thumbs.fullStructure;
var searchStatusPref = this._application.preferences.get("ftabs.searchStatus");
var searchStatus;
var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb",false);
if (emptyLastThumb)
thumbs[maxThumbIndex - 1] = {
pinned: true};
switch (searchStatusPref) {
case 0:

case 2:
searchStatus = 2;
break;
case 1:
searchStatus = 3;
break;
default:
searchStatus = 1;
}

var requestData = {
debug: this._application.preferences.get("ftabs.debug",false),
x: backboneXY[0],
y: backboneXY[1],
showBookmarks: showBookmarks,
searchStatus: searchStatus,
backgroundImage: backgroundImage,
thumbs: thumbs};
var brandingLogo = this.brandingXMLDoc.querySelector("logo");
var brandingSearch = this.brandingXMLDoc.querySelector("search");
var brandingSearchURL = brandingSearch.getAttribute("url");
var searchURL = this._application.branding.expandBrandTemplates(brandingSearchURL);
var imgFile = this._application.branding.brandPackage.findFile("fastdial/" + brandingLogo.getAttribute("img_clear")) || "";
if (imgFile)
imgFile = FILE_PROTOCOL_HANDLER.getURLSpecFromFile(imgFile);
requestData.branding = {
logo: {
url: this.expandBrandingURL(brandingLogo.getAttribute("url")),
img: imgFile,
alt: brandingLogo.getAttribute("alt"),
title: brandingLogo.getAttribute("title")},
search: {
url: searchURL,
placeholder: brandingSearch.getAttribute("placeholder"),
example: this._application.searchExample.current,
navigateTitle: brandingSearch.getAttribute("navigate_title") || ""}};
requestData.sync = {
status: this._application.sync.state,
login: this._application.sync.login,
advert: this._application.sync.showAdvert,
offer: this._application.sync.showOffer};
if (outerWindowId !== undefined)
{
this.sendRequestToTab(outerWindowId,"init",requestData);
}
 else
{
this.sendRequest("init",requestData);
}

if (showBookmarks && ! ignoreBookmarks)
{
this._application.bookmarks.requestBranch("",function (bookmarks) {
if (outerWindowId !== undefined)
{
self.sendRequestToTab(outerWindowId,"bookmarksStateChanged",bookmarks);
}
 else
{
self.sendRequest("bookmarksStateChanged",bookmarks);
}

}
);
}

if (outerWindowId !== undefined && ! this._outerWindowIdList[outerWindowId])
{
this._outerWindowIdList[outerWindowId] = true;
if (this._logTabShowFlag)
{
this._application.usageHistory.logAction("show");
this._tabsShownCounter++;
}

this._logTabShowFlag = true;
}

}
,
requestSettings: function Fastdial_requestSettings(callback) {
var maxLayoutNum = this._application.layout.getMaxThumbLayout();
var productInfo = this._application.branding.productInfo;
var bgImagesDir = this._application.core.rootDir;
bgImagesDir.append("backgroundImages");
var bgImagesDirEntries = bgImagesDir.directoryEntries;
var bgImages = [];
var userImage = "";
while (bgImagesDirEntries.hasMoreElements()) {
let imgFile = bgImagesDirEntries.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_TEMPFILE_LEAFNAME)
{
continue;
}

let path = bgImagesURLHelper.getURLForFile(imgFile);
if (imgFile.leafName === USER_FILE_LEAFNAME)
{
userImage = path;
}
 else
{
bgImages.push(path);
}

}

var layouts = this._application.layout.getPossibleLayouts();
var selectedBgImage = bgImagesDir.clone();
selectedBgImage.append(this._application.preferences.get("ftabs.backgroundImage"));
callback({
bgImages: bgImages,
userImage: userImage,
showBookmarks: this._application.preferences.get("ftabs.showBookmarks"),
sendStat: this._application.preferences.get("stat.usage.send",false),
isHomePage: Preferences.get("browser.startup.homepage").split("|").indexOf(this._application.protocolSupport.url) !== - 1,
showSearchForm: [0, 2].indexOf(this._application.preferences.get("ftabs.searchStatus")) !== - 1,
selectedBgImage: bgImagesURLHelper.getURLForFile(selectedBgImage),
maxLayoutX: maxLayoutNum,
layouts: layouts.layouts,
currentLayout: layouts.current,
maxLayoutY: maxLayoutNum,
licenseURL: productInfo.LicenseURL.fx,
copyright: productInfo.Copyright.fx,
rev: this._application.addonManager.addonVersion,
build: this._application.core.CONFIG.BUILD.REVISION,
buildDate: Math.round((new Date(this._application.core.CONFIG.BUILD.DATE)).getTime() / 1000)});
}
,
getLocalizedString: function Fastdial_getLocalizedString(key) {
var node = this.i18nXMLDoc.querySelector("key[name='" + key + "']");
if (node === null)
{
throw new Error("Unknown i18n key: " + key);
}

return this.expandBrandingURL(node.getAttribute("value"));
}
,
applySettings: function Fastdial_applySettings(layout, showBookmarks, sendStat, showSearchForm, bgImage) {
var self = this;
var maxNum = this._application.layout.getMaxThumbLayout();
var oldThumbsNum = this._application.layout.getThumbsNum();
var layoutXY = this._application.layout.getThumbsXYOfThumbsNum(layout);
var pickupNeeded = this._application.layout.layoutX !== layoutXY[0] || this._application.layout.layoutY !== layoutXY[1];
var ignoreBookmarks;
if (! this._application.preferences.get("ftabs.showBookmarks") && showBookmarks)
{
ignoreBookmarks = false;
}
 else
{
ignoreBookmarks = true;
}

this._application.preferences.set("ftabs.showBookmarks",showBookmarks);
this._application.preferences.set("stat.usage.send",sendStat);
var bgImageFile = this._application.core.rootDir;
bgImageFile.append("backgroundImages");
if (bgImage === "user")
{
bgImageFile.append(USER_FILE_LEAFNAME);
if (bgImageFile.exists() && bgImageFile.isFile() && bgImageFile.isReadable())
{
this._application.preferences.set("ftabs.backgroundImage",USER_FILE_LEAFNAME);
}
 else
{
this._logger.error("User-uploaded image needs to be set as background, but it does not exist");
}

}
 else
{
bgImage = bgImagesURLHelper.getFileNameFromURL(bgImage);
bgImageFile.append(bgImage);
if (bgImageFile.exists() && bgImageFile.isFile() && bgImageFile.isReadable())
{
this._application.preferences.set("ftabs.backgroundImage",bgImage);
}
 else
{
this._logger.error("Wrong background image path needs to be set: " + bgImage);
}

}

var searchStatusOldValue = this._application.preferences.get("ftabs.searchStatus");
var onStatusGot = function Fastdial_saveSettings_onStatusGot(status) {
self._application.preferences.set("ftabs.searchStatus",status);
if (pickupNeeded)
{
self._application.layout.layoutX = layoutXY[0];
self._application.layout.layoutY = layoutXY[1];
}

self.requestInit(undefined,ignoreBookmarks);
}
;
if (showSearchForm)
{
let searchStatusNewValue = searchStatusOldValue === 0 ? 0 : 2;
onStatusGot(searchStatusNewValue);
}
 else
{
AddonManager.gre_AddonManager.getAddonByID(BAR_EXTENSION_ID,function (addonData) {
var isBarInstalled = addonData !== null && addonData.installDate && addonData.isActive;
var searchStatusNewValue = isBarInstalled && [0, 1].indexOf(searchStatusOldValue) !== - 1 ? 1 : 3;
onStatusGot(searchStatusNewValue);
}
);
}

}
,
requestRecentlyClosedTabs: function Fastdial_requestRecentlyClosedTabs(callback) {
var self = this;
var tabsData = [];
try {
let tabsDataJSON = SESSION_STORE_SVC.getClosedTabData(misc.getTopBrowserWindow());
tabsData = JSON.parse(tabsDataJSON);
}
catch (e) {

}

if (Preferences.get("browser.startup.page",1) !== 3)
tabsData.push(this._sessionStoreFileData);
var tasks = [];
for (let i = 0;i < tabsData.length;i++) {
if (! tabsData[i].state || ! tabsData[i].state.entries)
continue;
let lastTabEntry = tabsData[i].state.entries.pop();
if (lastTabEntry.url === this._application.protocolSupport.url)
continue;
try {
let uri = netutils.newURI(lastTabEntry.url);
uri.QueryInterface(Ci.nsIURL);
}
catch (ex) {
continue;
}

let bookmark = {
id: NATIVE_RESTORETAB_PREFIX + i,
title: lastTabEntry.title || lastTabEntry.url};
(function (bookmarkData, url, icon) {
tasks.push(function (callback) {
if (icon)
{
bookmarkData.favicon = icon;
return callback(null,bookmarkData);
}

var uri = self.url2nsIURI(url);
self._application.favicons.requestFaviconForURL(uri,function (faviconData, dominantColor) {
bookmarkData.favicon = faviconData || "";
callback(null,bookmarkData);
}
);
}
);
}
)(bookmark,lastTabEntry.url,tabsData[i].image);
if (tasks.length === RECENTLY_CLOSED_TABS)
{
break;
}

}

async.parallel(tasks,function (err, results) {
callback(results);
}
);
}
,
restoreTab: function Fastdial_restoreTab(id) {
var isNativeTabRegexp = new RegExp("^" + NATIVE_RESTORETAB_PREFIX);
var isNativeTab = isNativeTabRegexp.test(id);
var aWindow = misc.getTopBrowserWindow();
if (isNativeTab)
id = parseInt(id.replace(isNativeTabRegexp,""),10);
if (isNativeTab)
{
if (id >= SESSION_STORE_SVC.getClosedTabCount(aWindow))
throw new Error("Tab doesn't exist: #" + id);
return SESSION_STORE_SVC.undoCloseTab(aWindow,id);
}

}
,
uploadUserBackground: function Fastdial_uploadUserBackground(aWindow, callback) {
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
bgImagesURLHelper.randomize();
var bgImagesDir = this._application.core.rootDir;
bgImagesDir.append("backgroundImages");
var resultFile = bgImagesDir.clone();
resultFile.append(USER_FILE_LEAFNAME);
fileutils.removeFileSafe(resultFile);
var output = "";
try {
filePicker.file.copyTo(bgImagesDir,USER_FILE_LEAFNAME);
output = bgImagesURLHelper.getURLForFile(resultFile);
}
catch (e) {
this._logger.error("Could not copy user image: " + strutils.formatError(e));
this._logger.debug(e.stack);
}

callback(output);
}
,
requestLastVisited: function Fastdial_requestLastVisited(offset, callback) {
var self = this;
async.parallel({
blacklist: function (callback) {
self._application.blacklist.getAll(callback);
}
,
tabs: function Fastdial_requestLastVisited_tabs(callback) {
var urls = [];
misc.getBrowserWindows().forEach(function (chromeWin) {
var tabBrowser = chromeWin.gBrowser;
var tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
if (! Array.isArray(tabs))
return;
tabs.forEach(function (tab) {
try {
let browser = tabBrowser.getBrowserForTab(tab);
let currentURI = browser.currentURI.spec;
if (/^(chrome|about|yafd|bar):/.test(currentURI))
return;
urls.push({
url: currentURI,
title: browser.contentTitle});
}
catch (e) {

}

}
);
}
);
callback(null,urls);
}
,
pickup: function Fastdial_requestLastVisited_pickup(callback) {
var output = {
pages: [],
domains: {
},
pinned: []};
var maxThumbIndex = self._application.layout.getThumbsNum();
self._application.thumbs.structure.iterate({
nonempty: true},function (thumbData, i) {
if (i < maxThumbIndex)
{
let thumbHost = self.url2nsIURI(thumbData.url).host;
output.domains[thumbHost] = 1;
}
 else
{
let pushData = {
url: thumbData.url};
if (thumbData.title)
pushData.title = thumbData.title;
if (thumbData.pinned)
{
output.pinned.push(pushData);
}
 else
{
output.pages.push(pushData);
}

}

}
);
callback(null,output);
}
,
lastVisited: function Fastdial_requestLastVisited_lastVisited(callback) {
var urls = [];
var query = PlacesUtils.history.getNewQuery();
var options = PlacesUtils.history.getNewQueryOptions();
query.minVisits = 2;
options.maxResults = 100;
options.sortingMode = options.SORT_BY_DATE_DESCENDING;
var result = PlacesUtils.history.executeQuery(query,options);
result.root.containerOpen = true;
for (let i = 0;i < result.root.childCount;i++) {
let node = result.root.getChild(i);
if (! node.title)
continue;
if (! /^(https?|ftp):\/\//.test(node.uri))
continue;
urls.push({
url: node.uri,
title: node.title,
favicon: node.icon});
}

result.root.containerOpen = false;
callback(null,urls);
}
},function (err, results) {
if (err)
throw new Error(err);
const MAX_VISITED_NUM = 24;
var excludeDomains = results.pickup.domains;
var output = [];
var pages = {
};
Array.concat(results.pickup.pinned,results.tabs,results.pickup.pages,results.lastVisited).forEach(function (page) {
pages[page.url] = pages[page.url] || {
};
sysutils.copyProperties(page,pages[page.url]);
}
);
for(let [, page] in Iterator(pages)) {
let pageURI = self.url2nsIURI(page.url);
if (results.blacklist.indexOf(pageURI.host) !== - 1 || excludeDomains[pageURI.host])
continue;
(function (pageData, pageURI) {
if (self._historyThumbs[pageData.url])
return sysutils.copyProperties(self._historyThumbs[pageData.url],pageData);
pageData.isIndexPage = self.isIndexPage(pageURI);
self._historyThumbs[pageData.url] = pageData;
self._application.thumbs.searchUrlInLocalDB(pageData.url,function (storageError, rowsData) {
if (storageError)
throw new Error(storageError);
if (rowsData.length)
{
if (! pageData.favicon && rowsData[0].favicon)
pageData.favicon = rowsData[0].favicon;
if (rowsData[0].backgroundColor)
{
pageData.backgroundColor = rowsData[0].backgroundColor;
pageData.fontColor = self._application.colors.getFontColorByBackgroundColor(rowsData[0].backgroundColor);
}

if (pageURI.asciiHost)
{
self._application.cloudSource.requestExistingTile(pageURI,function (err, cloudData) {
if (err)
throw new Error(err);
if (! cloudData)
return;
sysutils.copyProperties(cloudData,pageData);
sysutils.copyProperties(pageData,self._historyThumbs[pageData.url]);
self.sendRequest("historyThumbChanged",pageData);
}
);
}

sysutils.copyProperties(pageData,self._historyThumbs[pageData.url]);
self.sendRequest("historyThumbChanged",pageData);
}
 else
{
let onFaviconDataReady = function (faviconData) {
pageData.favicon = faviconData;
sysutils.copyProperties(pageData,self._historyThumbs[pageData.url]);
self.sendRequest("historyThumbChanged",pageData);
if (self._historyThumbs[pageData.url].backgroundColor)
return;
self._application.colors.requestImageDominantColor(faviconData,function (err, color) {
if (err || color === null)
return;
if (self._historyThumbs[pageData.url].backgroundColor)
return;
pageData.backgroundColor = color;
pageData.fontColor = self._application.colors.getFontColorByBackgroundColor(color);
sysutils.copyProperties(pageData,self._historyThumbs[pageData.url]);
self.sendRequest("historyThumbChanged",pageData);
}
);
}
;
if (pageData.favicon)
{
onFaviconDataReady(pageData.favicon);
}
 else
{
self._application.favicons.requestFaviconForURL(pageURI,function (faviconData, dominantColor) {
if (! faviconData)
return;
onFaviconDataReady(faviconData);
}
);
}

if (pageURI.asciiHost)
{
self._application.cloudSource.requestExistingTile(pageURI,function (err, cloudData) {
if (err)
throw new Error(err);
if (! cloudData)
return self._application.cloudSource.fetchTileFromWeb(pageURI);
sysutils.copyProperties(cloudData,pageData);
sysutils.copyProperties(pageData,self._historyThumbs[pageData.url]);
self.sendRequest("historyThumbChanged",pageData);
}
);
}

}

}
);
}
)(page,pageURI);
output.push(page);
excludeDomains[pageURI.host] = 1;
if (output.length >= MAX_VISITED_NUM)
break;
}

if (offset)
{
output = output.splice(offset,9);
}
 else
{
output.length = Math.min(output.length,9);
}

callback(output);
}
);
}
,
thumbOpened: function Fastdial_thumbOpened(outerWindowId, url, index, navigateCode) {
if (this._application.barnavig.alwaysSendUsageStat === false)
return;
var decisionTime = Date.now() - this._startDecision[outerWindowId];
this._barnavigDataProvider.addURLData(url,{
decisionTime: decisionTime,
vtbNum: index + 1});
async.nextTick(function Fastdial_thumbOpened_openSpeculativeConnect() {
this.openSpeculativeConnect(url);
}
,this);
}
,
isIndexPage: function Fastdial_isIndexPage(uri) {
try {
if (! this._application.isYandexHost(uri.asciiHost))
return uri.path === "/";
uri.QueryInterface(Ci.nsIURL);
return uri.filePath === "/";
}
catch (ex) {
return true;
}

}
,
openSpeculativeConnect: function Fastdial_openSpeculativeConnect(url) {
if (! ("nsISpeculativeConnect" in Ci))
return;
var uri;
try {
uri = netutils.newURI(this._application.thumbs.fixURL(url));
}
catch (e) {

}

if (! uri)
{
this._logger.error("Can not create URI for '" + url + "'");
return;
}

Services.io.QueryInterface(Ci.nsISpeculativeConnect).speculativeConnect(uri,null,null);
}
,
onShortcutPressed: function Fastdial_onShortcutPressed(thumbIndex) {
var thumb = this._application.thumbs.structure.get(thumbIndex);
if (thumb && thumb.url)
{
misc.navigateBrowser({
url: thumb.url,
target: "current tab"});
}

}
,
navigateUrlWithReferer: function Fastdial_navigateUrlWithReferer(url, navigateCode) {
var brandingLogoURL = this.brandingXMLDoc.querySelector("logo").getAttribute("url");
brandingLogoURL = this._application.branding.expandBrandTemplates(brandingLogoURL);
var target = {
1: "current tab",
2: "new window",
3: "new tab"}[navigateCode];
misc.navigateBrowser({
url: url,
target: target,
referrer: brandingLogoURL});
}
,
setAsHomePage: function Fastdial_setAsHomePage() {
var currentHomePages = Preferences.get("browser.startup.homepage").split("|");
if (currentHomePages.length > 1)
{
currentHomePages.unshift(this._application.protocolSupport.url);
Preferences.set("browser.startup.homepage",currentHomePages.join("|"));
}
 else
{
Preferences.set("browser.startup.homepage",this._application.protocolSupport.url);
}

}
,
onTabSelect: function Fastdial_onTabSelect(outerWindowId) {
if (this._startDecision[outerWindowId] !== undefined)
this._startDecision[outerWindowId] = Date.now();
}
,
onTabLeave: function Fastdial_onTabLeave(outerWindowId) {
delete this._registeredListeners[outerWindowId];
delete this._startDecision[outerWindowId];
}
,
onHiddenTabAction: function Fastdial_onHiddenTabAction(action) {
switch (action) {
case "hide":
this._logTabShowFlag = false;
break;
case "show":
this._application.usageHistory.logAction("show");
this._tabsShownCounter++;
Services.obs.notifyObservers(this,this._application.core.eventTopics.APP_TAB_SHOWN,this._tabsShownCounter);
break;
}

}
,
url2nsIURI: function Fastdial_url2nsIURI(url, initialUrl) {
if (this._domainsCache[initialUrl || url])
return this._domainsCache[initialUrl || url];
var uri;
try {
uri = netutils.newURI(url);
if (uri.host !== "clck.yandex.ru")
{
uri.host = uri.host.replace(/^www\./,"");
return this._domainsCache[initialUrl || url] = uri;
}

}
catch (ex) {
this._logger.error("Could not parse URL: " + strutils.formatError(ex));
this._logger.debug(ex.stack);
return this._domainsCache[initialUrl || url] = {
};
}

var clickrMatches = uri.path.match(/.+?\*(.+)/);
if (uri.host === "clck.yandex.ru")
{
if (clickrMatches)
{
let regexFromOld = new RegExp("\\?from=vb-fx$");
let regexFromNew = new RegExp("\\?from=" + this._application.core.CONFIG.APP.TYPE + "$");
clickrMatches[1] = clickrMatches[1].replace(/[?&]clid=[^&]+/,"").replace(regexFromOld,"").replace(regexFromNew,"");
return this.url2nsIURI(clickrMatches[1],url);
}

let clckrItem = this.brandingClckrDoc.querySelector("item[url='" + url + "']");
if (clckrItem)
{
let host = clckrItem.getAttribute("domain");
this._domainsCache[initialUrl || url] = netutils.newURI("http://" + host);
}
 else
{
this._domainsCache[initialUrl || url] = uri;
}

return this._domainsCache[url];
}

}
,
get brandingXMLDoc() {
delete this.brandingXMLDoc;
return this.brandingXMLDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/config.xml");
}
,
get brandingClckrDoc() {
delete this.brandingClckrDoc;
return this.brandingClckrDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/clckr.xml");
}
,
get i18nXMLDoc() {
delete this.i18nXMLDoc;
var stream = this._application.addonFS.getStream("$content/fastdial/i18n.xml");
return this.i18nXMLDoc = fileutils.xmlDocFromStream(stream);
}
,
get _sessionStoreFileData() {
var tabsData = [];
var sessionstoreData;
var sessionFile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
sessionFile.append("sessionstore.js");
if (! sessionFile.exists() || ! sessionFile.isFile() || ! sessionFile.isReadable())
return tabsData;
try {
sessionstoreData = fileutils.jsonFromFile(sessionFile);
}
catch (e) {
this._logger.warn(e.message);
return tabsData;
}

return tabsData;
return tabsData;
}
,
_barnavigDataProvider: {
init: function Fastdial_BNDP_init() {
this._dataContainer = new sysutils.DataContainer({
expirationTime: 1 * 60 * 60 * 1000});
return this;
}
,
finalize: function Fastdial_BNDP_finalize() {
this._dataContainer.finalize();
this._dataContainer = null;
return this;
}
,
addURLData: function Fastdial_BNDP_addURLData(aURL, aThumbData) {
if (typeof aURL == "string" && typeof aThumbData == "object")
this._dataContainer.set(aURL,aThumbData);
}
,
onWindowLocationChange: function Fastdial_BNDP_onWindowLocationChange() {

}
,
onPageLoad: function Fastdial_BNDP_onPageLoad(aParams) {
var url = aParams.barNavigParams.oldurl || aParams.url;
var thumbData = url && this._dataContainer.get(url);
if (thumbData)
{
this._dataContainer.remove(url);
aParams.barNavigParams.decisionTime = thumbData.decisionTime;
aParams.barNavigParams.vtbNum = thumbData.vtbNum;
return this;
}

return false;
}
,
onBarNavigResponse: function Fastdial_BNDP_onBarNavigResponse() {

}
,
_dataContainer: null},
requestTitleForURL: function Fastdial_requestTitleForURL(url, callback) {
var self = this;
var uri = netutils.newURI(url);
var seriesTasks = {
};
var titleFound;
seriesTasks.history = function Fastdial_requestTitleForURL_historySeriesTask(callback) {
try {
PlacesUtils.asyncHistory.getPlacesInfo(uri,{
handleResult: function handleResult(aPlaceInfo) {
titleFound = aPlaceInfo.title;
if (titleFound)
return callback("stop");
callback();
}
,
handleError: function handleError(aResultCode, aPlaceInfo) {
if (aResultCode !== Cr.NS_ERROR_NOT_AVAILABLE)
self._logger.error("Error in asyncHistory.getPlacesInfo (" + JSON.stringify(uri) + "): " + aResultCode);
callback();
}
});
}
catch (ex) {
titleFound = PlacesUtils.history.getPageTitle(uri);
if (titleFound)
return callback("stop");
callback();
}

}
;
seriesTasks.request = function Fastdial_requestTitleForURL_requestSeriesTask(callback) {
if (self._application.isYandexHost(uri.host))
{
try {
uri.QueryInterface(Ci.nsIURL);
let parsedQuery = netutils.querystring.parse(uri.query);
parsedQuery.nugt = "vbff-" + self._application.addonManager.addonVersion;
uri.query = netutils.querystring.stringify(parsedQuery);
}
catch (ex) {
self._logger.error("URI is not URL: " + uri.spec);
}

}

var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
xhr.overrideMimeType("text/plain; charset=x-user-defined");
xhr.mozBackgroundRequest = true;
xhr.QueryInterface(Ci.nsIDOMEventTarget);
xhr.open("GET",uri.spec,true);
var timer = new sysutils.Timer(function () {
xhr.abort();
}
, 25000);
xhr.setRequestHeader("Cache-Control","no-cache");
xhr.addEventListener("load",function () {
timer.cancel();
var responseText = (xhr.responseText || "").replace(/<\/head>[\s\S]*/i,"</head><body/></html>").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"");
var title = "";
var domParser = xmlutils.getDOMParser();
var xmlDocument;
try {
xmlDocument = domParser.parseFromString(responseText,"text/html");
}
catch (e) {

}

var charset = xhr.getResponseHeader("Content-Type");
if (xmlDocument && ! (charset && /charset=(.+)$/.test(charset)))
{
charset = xmlDocument.querySelector("meta[http-equiv='Content-Type'][content]");
charset = charset && charset.getAttribute("content");
}

charset = charset && charset.match(/charset=(.+)$/);
charset = charset && charset[1] || "UTF-8";
charset = charset.replace(/[^a-z\d-]/gi,"");
var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
try {
converter.charset = charset;
responseText = converter.ConvertToUnicode(responseText);
xmlDocument = domParser.parseFromString(responseText,"text/html");
}
catch (e) {

}

var titleNode = xmlDocument && xmlDocument.querySelector("head > title");
if (titleNode)
{
title = titleNode.textContent;
}
 else
{
let titleMatches = responseText.match(/<title>(.*?)<\/title>/im);
title = titleMatches ? titleMatches[1] : "";
}

title = title.substr(0,1000) || url;
callback(null,title);
}
,false);
var errorHandler = function (e) {
callback(e.type);
}
;
xhr.addEventListener("error",errorHandler,false);
xhr.addEventListener("abort",errorHandler,false);
xhr.send();
}
;
async.series(seriesTasks,function Fastdial_requestTitleForURL_onSeriesTasksRun(err, results) {
if (titleFound)
return callback(null,titleFound);
if (results && results.request)
return callback(null,results.request);
callback(err);
}
);
}
,
expandBrandingURL: function Fastdial_expandBrandingURL(url) {
return this._application.branding.expandBrandTemplates(url,{
vbID: this._application.core.CONFIG.APP.TYPE});
}
,
_initFileSystem: function Fastdial__initFileSystem() {
var bgImagesDir = this._application.core.rootDir;
bgImagesDir.append("backgroundImages");
if (! bgImagesDir.exists())
{
bgImagesDir.create(Ci.nsIFile.DIRECTORY_TYPE,fileutils.PERMS_DIRECTORY);
}

var appInfo = this._application.addonManager.info;
if (appInfo.isFreshAddonInstall || appInfo.addonUpgraded)
{
const BACKGROUND_IMAGE_PREF = "ftabs.backgroundImage";
let files = bgImagesDir.directoryEntries;
while (files.hasMoreElements()) {
let imgFile = files.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName) || imgFile.leafName === USER_FILE_LEAFNAME)
{
continue;
}

fileutils.removeFileSafe(imgFile);
}

let brandingBgImages = this._application.branding.brandPackage.findFile("fastdial/backgrounds/").directoryEntries;
while (brandingBgImages.hasMoreElements()) {
let imgFile = brandingBgImages.getNext().QueryInterface(Ci.nsIFile);
if (/^\./.test(imgFile.leafName))
{
continue;
}

imgFile.copyTo(bgImagesDir,imgFile.leafName);
}

let forceChangeBg = false;
let backgroundImagePref = this._application.preferences.get(BACKGROUND_IMAGE_PREF,"");
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
let force = forceChangeBg || backgroundElem.getAttribute("force") === "true" || hasJustMigrated && this._application.preferences.get(BACKGROUND_IMAGE_PREF).length === 0;
if (force || appInfo.isFreshAddonInstall && this._application.preferences.get("yabar.migrated",false) === false)
{
this._application.preferences.set(BACKGROUND_IMAGE_PREF,backgroundElem.getAttribute("file"));
}

}

}
,
_application: null,
_logger: null,
_applyingThumbsSettings: false,
_applyThumbsSettingsQueue: [],
_registeredListeners: {
},
_startDecision: {
},
_historyThumbs: {
},
_pickupGUID: null,
_clearHistoryThumbsTimer: null,
_outerWindowIdList: {
},
_logTabShowFlag: true,
_tabsShownCounter: 0,
_domainsCache: {
}};
