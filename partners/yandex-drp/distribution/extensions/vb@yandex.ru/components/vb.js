"use strict";
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyGetter(this,"app",function appGetter() Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject.application);
function typesCheck(args, types) {
for (let i = 0;i < types.length;i++) {
if (types[i] !== null && typeof args[i] !== types[i])
{
throw new Error("Wrong value passed: " + args[i] + ", expected: " + types[i]);
}

}

}

;
function vbAPI() {

}

vbAPI.prototype = {
classID: Components.ID("{64845B2B-DA10-4AC8-981C-BE0A3283EB7C}"),
QueryInterface: XPCOMUtils.generateQI([Ci.nsIDOMGlobalPropertyInitializer]),
init: function vbAPI_init(aWindow) {
if (! app)
return null;
var window = XPCNativeWrapper.unwrap(aWindow);
if (window.location.href !== app.protocolSupport.url)
return null;
var utils = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
var outerWindowId = utils.outerWindowID;
return new VBDOMObject(aWindow, outerWindowId);
}
};
function VBDOMObject(aWindow, outerWindowId) {
this._outerWindowId = outerWindowId;
this.onRequest._outerWindowId = outerWindowId;
this._window = aWindow;
}

VBDOMObject.prototype = {
navigator: "firefox",
get osName() app.core.Lib.sysutils.platformInfo.os.name,
get navigatorMajorVersion() parseInt(app.core.Lib.sysutils.platformInfo.browser.version,10),
getLocalizedString: function VBDOMObject_getLocalizedString(key) {
typesCheck(arguments,["string"]);
return app.fastdial.getLocalizedString(key);
}
,
requestSettings: function VBDOMObject_requestSettings(callback) {
typesCheck(arguments,["function"]);
return app.fastdial.requestSettings(callback);
}
,
pinThumb: function VBDOMObject_pinThumb(index) {
typesCheck(arguments,["number"]);
app.thumbs.changePinnedState(index,true);
}
,
unpinThumb: function VBDOMObject_unpinThumb(index) {
typesCheck(arguments,["number"]);
app.thumbs.changePinnedState(index,false);
}
,
requestAppsList: function VBDOMObject_requestAppsList(callback) {

}
,
launchApp: function VBDOMObject_launchApp(id) {

}
,
requestClosedPagesList: function VBDOMObject_requestClosedPagesList(callback) {
typesCheck(arguments,["function"]);
app.fastdial.requestRecentlyClosedTabs(callback);
}
,
restoreTab: function VBDOMObject_restoreTab(id) {
typesCheck(arguments,["string"]);
app.fastdial.restoreTab(id);
}
,
requestLastVisited: function VBDOMObject_requestLastVisited(offset, callback) {
typesCheck(arguments,["number", "function"]);
app.fastdial.requestLastVisited(offset,callback);
}
,
applySettings: function VBDOMObject_applySettings(layout, showBookmarks, showSearchForm, bgImage) {
typesCheck(arguments,["string", "boolean", "boolean", "string"]);
return app.fastdial.applySettings(layout,showBookmarks,showSearchForm,bgImage);
}
,
setSendStatistics: function VBDOMObject_setSendStatistics(sendStat) {
typesCheck(arguments,["boolean"]);
app.preferences.set("stat.usage.send",sendStat);
}
,
saveThumb: function VBDOMObject_saveThumb(index, data) {
typesCheck(arguments,["number", "object"]);
app.thumbs.save(index,data);
}
,
removeThumb: function VBDOMObject_removeThumb(index) {
typesCheck(arguments,["number"]);
app.thumbs.remove(index);
}
,
swapThumbs: function VBDOMObject_swapThumb(oldIndex, newIndex) {
typesCheck(arguments,["number", "number"]);
app.thumbs.swap(oldIndex,newIndex);
}
,
requestInit: function VBDOMObject_requestInit() {
app.fastdial.requestInit(this._outerWindowId);
}
,
uploadUserBackground: function VBDOMObject_uploadUserBackground(callback) {
typesCheck(arguments,["function"]);
app.fastdial.uploadUserBackground(this._window,callback);
}
,
requestBookmarksBranch: function VBDOMObject_requestBookmarksBranch(id, callback) {
typesCheck(arguments,["string", "function"]);
if (id.length === 0)
{
throw new Error("bookmark folder ID cannot be empty");
}

app.bookmarks.requestBranch(id,callback);
}
,
openThumb: function VBDOMObject_openThumb(url, index, navigateCode) {
typesCheck(arguments,["string", "number", "number"]);
app.fastdial.thumbOpened(this._outerWindowId,url,index,navigateCode);
}
,
openSpeculativeConnect: function VBDOMObject_openSpeculativeConnect(url) {
typesCheck(arguments,["string"]);
app.fastdial.openSpeculativeConnect(url);
}
,
navigateUrlWithReferer: function VBDOMObject_navigateUrlWithReferer(url, navigateCode) {
typesCheck(arguments,["string", "number"]);
app.fastdial.navigateUrlWithReferer(url,navigateCode);
}
,
setAsHomePage: function VBDOMObject_setAsHomePage() {
app.fastdial.setAsHomePage();
}
,
log: function VBDOMObject_log(level, msg, url, line, trace) {
typesCheck(arguments,["string", "string"]);
app.frontendHelper.logMessage(level,msg,url,line,trace);
}
,
openExternalWindow: function VBDOMObject_openExternalWindow(windowName) {
typesCheck(arguments,["string"]);
app.fastdial.openExternalWindow(windowName,this._window);
}
,
stat: function VBDOMObject_stat(param) {
typesCheck(arguments,["string"]);
app.usageHistory.logAction(param);
}
,
search: {
suggest: function VBDOMObject_search_suggest(query, callback) {
typesCheck(arguments,["string", "function"]);
app.searchSuggest.searchWeb(query,callback);
}
,
historySuggest: function VBDOMObject_search_historySuggest(query, callback) {
typesCheck(arguments,["string", "function"]);
app.searchSuggest.searchLocalHistory(query,callback);
}
,
suppressTutorial: function VBDOMObject_search_suppressTutorial() {
app.searchSuggest.suppressTutorial();
}
,
useExample: function VBDOMObject_search_useExample(query) {
typesCheck(arguments,["string"]);
app.searchSuggest.useExample(query);
}
,
get alternativeEngines() app.searchSuggest.alternativeEngines},
sync: {
openWP: function VBDOMObject_sync_openWP() {
app.sync.openWP();
}
,
suppressAdvert: function VBDOMObject_sync_suppressAdvert() {
app.sync.suppressAdvert();
}
,
suppressOffer: function VBDOMObject_sync_suppressOffer() {
app.sync.suppressOffer();
}
,
refuse: function VBDOMObject_sync_refuse() {
app.sync.hideBlockUI();
}
,
enableSyncVB: function VBDOMObject_sync_enableSyncVB() {
app.sync.enableSyncVB();
}
},
onRequest: {
addListener: function VBDOMObject_OnReq_addListener(command, callback) {
app.fastdial.setListenersForWindow.apply(app.fastdial,[this._outerWindowId].concat(Array.prototype.slice.call(arguments,0)));
}
,
removeListener: function VBDOMObject_OnReq_removeListener(command, callback) {
app.fastdial.removeListenersForWindow.apply(app.fastdial,[this._outerWindowId].concat(Array.prototype.slice.call(arguments,0)));
}
,
hasListener: function VBDOMObject_OnReq_hasListener(command, callback) {
return app.fastdial.hasListenerForWindow.apply(app.fastdial,[this._outerWindowId].concat(Array.prototype.slice.call(arguments,0)));
}
,
_outerWindowId: null},
_outerWindowId: null,
_window: null,
__exposedProps__: {
navigator: "r",
osName: "r",
getLocalizedString: "r",
requestSettings: "r",
pinThumb: "r",
unpinThumb: "r",
requestAppsList: "r",
launchApp: "r",
requestClosedPagesList: "r",
restoreTab: "r",
requestLastVisited: "r",
applySettings: "r",
saveThumb: "r",
removeThumb: "r",
swapThumbs: "r",
requestInit: "r",
uploadUserBackground: "r",
openExternalWindow: "r",
stat: "r",
search: "r",
sync: "r",
requestBookmarksBranch: "r",
openThumb: "r",
openSpeculativeConnect: "r",
navigateUrlWithReferer: "r",
onRequest: "r"}};
var NSGetFactory = XPCOMUtils.generateNSGetFactory([vbAPI]);
