"use strict";
function createSliceWrapper(sliceProps, apiInstance, WIID) {
var platformEnv = new PlatformEnvironment(apiInstance, WIID, sliceProps.messageHandler || null);
sliceProps.injectedProperties = sliceProps.injectedProperties || {
};
sliceProps.injectedProperties.platform = platformEnv;
sliceProps.injectedProperties.external = platformEnv;
var slice = new application.slices.Slice(sliceProps);
platformEnv.sliceID = slice.id;
platformEnv.XMLHttpRequest = function PlatformEnvironment_XMLHttpRequest() {
return new XMLHttpRequestWrapper(platformEnv.sliceID);
}
;
return {
get url() slice.url,
set url(newUrl) {
slice.url = newUrl;
}
,
show: function SliceWrapper_show(anchorElement, onHide) {
slice.show(anchorElement,onHide);
}
,
hide: function SliceWrapper_hide() {
slice.hide();
}
,
get isOpen() slice.isOpen,
notify: function SliceWrapper_notify(message) {
var _args = Array.prototype.slice.call(arguments);
platformEnv.onMessage._listeners.forEach(function (listener) {
try {
listener.apply(listener,_args);
}
catch (e) {
apiInstance.logger.error("Could not notify slice. " + e);
}

}
);
}
,
destroy: function SliceWrapper_destroy() {
slice.destroy();
}
};
}

function PlatformEnvironment(nativeAPI, WIID, messageHandler) {
if (! (nativeAPI instanceof NativeBarAPI))
throw new CustomErrors.EArgType("nativeAPI", "NativeBarAPI", nativeAPI);
if (! ! messageHandler && typeof messageHandler != "function")
throw new CustomErrors.EArgType("messageHandler", "Function", messageHandler);
this._api = nativeAPI;
this._WIID = WIID || undefined;
this._messageHandler = messageHandler;
this._messanger = new Messager(this);
this._settingsListeners = [];
}

PlatformEnvironment.prototype = {
constructor: PlatformEnvironment,
get sliceID() this._sliceID,
set sliceID(sliceID) {
if (this._sliceID !== undefined)
throw new Error("Slice ID is already set.");
this._sliceID = sliceID;
}
,
currentPage: {
get url() {
var browser = misc.getTopBrowserWindow();
browser = browser && browser.gBrowser;
return browser && browser.contentWindow && "" + browser.contentWindow.location || null;
}
,
get title() {
var browser = misc.getTopBrowserWindow();
browser = browser && browser.gBrowser;
return browser && browser.contentTitle || null;
}
,
__exposedProps__: {
"url": "r",
"title": "r"}},
resizeWindowTo: function PlatformEnvironment_resizeWindowTo(width, height) {
application.slices.findSliceByID(this.sliceID).sizeTo(width,height);
}
,
getOption: function PlatformEnvironment_getOption(aKey) {
var value = this._api.Settings.getValue(aKey,this._WIID);
if (typeof value === "undefined")
value = "";
return String(value);
}
,
setOption: function PlatformEnvironment_setOption(aKey, aValue) {
if (typeof aValue !== "string")
throw new TypeError("Option value must be a string.");
this._api.Settings.setValue(aKey,aValue,this._WIID);
}
,
observeSettings: function PlatformEnvironment_observeSettings(aListenerFunction) {
if (this._settingsListeners.some(function (obs) obs.onSettingChange === aListenerFunction))
return;
var observer = {
onSettingChange: aListenerFunction};
this._settingsListeners.push(observer);
this._api.Settings.observeChanges(observer,this._WIID);
}
,
ignoreSettings: function PlatformEnvironment_ignoreSettings(aListenerFunction) {
var observer = this._settingsListeners.filter(function (obs) obs.onSettingChange === aListenerFunction)[0];
if (! observer)
return;
this._api.Settings.ignoreChanges(observer,this._WIID);
this._settingsListeners.splice(this._settingsListeners.indexOf(observer),1);
}
,
showSettings: function PlatformEnvironment_showSettings() {
var setupID = this._api.componentType == "widget" ? this._WIID : this._api.componentID;
application.openSettingsDialog(null,setupID,null);
}
,
getLocalizedString: function PlatformEnvironment_getLocalizedString(aKey) {
return this._api.Localization.getString(aKey);
}
,
sendMessage: function PlatformEnvironment_sendMessage(aMessage) {
if (! this._messageHandler)
return;
this._messageHandler.apply(this._api.componentCore,arguments);
}
,
get onMessage() this._messanger,
getCookie: function PlatformEnvironment_getCookie(aURL, aCookieName, aHTTPOnly) {
var cookie = netutils.findCookies(aURL,aCookieName,aHTTPOnly)[0];
return cookie ? cookie.value : null;
}
,
get language() {
return application.locale.language;
}
,
get brandID() {
return application.branding.productInfo.BrandID.toString();
}
,
navigate: function PlatformEnvironment_navigate(aURL, aTarget) {
this._api.Controls.navigateBrowser({
unsafeURL: aURL,
target: aTarget});
}
,
logCustomAction: function PlatformEnvironment_logCustomAction(aAction) {
return this._api.Statistics.logCustomAction(aAction);
}
,
XMLHttpRequest: function PlatformEnvironment_XMLHttpRequest() {

}
,
get logger() {
delete this.logger;
var logger = this._api.logger;
this.__defineGetter__("logger",function () logger);
return this.logger;
}
,
get Notifications() this._api.Notifications,
__exposedProps__: {
"logger": "r",
"sliceID": "r",
"currentPage": "r",
"resizeWindowTo": "r",
"getOption": "r",
"setOption": "r",
"observeSettings": "r",
"ignoreSettings": "r",
"showSettings": "r",
"getLocalizedString": "r",
"sendMessage": "r",
"onMessage": "r",
"getCookie": "r",
"language": "r",
"brandID": "r",
"navigate": "r",
"logCustomAction": "r",
"XMLHttpRequest": "r",
"Notifications": "r"}};
function Messager(sliceEnv) {
this._env = sliceEnv;
this._listeners = [];
}

Messager.prototype = {
constructor: Messager,
addListener: function MessageHandler_addListener(aListener) {
if (! this._listeners.some(function (listener) listener === aListener))
this._listeners.push(aListener);
}
,
removeListener: function MessageHandler_removeListener(aListener) {
this._listeners = this._listeners.filter(function (listener) listener !== aListener);
}
,
__exposedProps__: {
"addListener": "r",
"removeListener": "r"}};
function XMLHttpRequestWrapper(sliceID) {
var that = Object.create(XMLHttpRequestWrapper.prototype);
var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
xhr.mozBackgroundRequest = true;
xhr.onreadystatechange = (function XMLHttpRequestWrapper_onreadystatechange() {
if (! application)
return;
this.readyState = xhr.readyState;
this.responseText = xhr.responseText;
this.responseXML = undefined;
if (xhr.responseXML)
{
let slice = application.slices.findSliceByID(sliceID);
if (/^(xb|chrome):\/\//.test(slice && slice.url))
{
this.responseXML = xhr.responseXML;
}
 else
{

}

}

this.statusText = "";
this.status = 0;
try {
this.status = xhr.status;
this.statusText = xhr.statusText;
}
catch (e) {

}

if (typeof this.onreadystatechange == "function")
this.onreadystatechange(arguments);
}
).bind(that);
that.readyState = xhr.readyState;
that.status = xhr.status;
that.responseText = xhr.responseText;
that.responseXML = undefined;
that.statusText = xhr.statusText;
that.open = xhr.open.bind(xhr);
that.setRequestHeader = function XHRWrapper_setRequestHeader() {
var args = Array.prototype.slice.call(arguments);
xhr.setRequestHeader.apply(xhr,args);
}
;
that.send = xhr.send.bind(xhr);
that.abort = xhr.abort.bind(xhr);
that.getAllResponseHeaders = function XHRWrapper_getAllResponseHeaders() {
return xhr.getAllResponseHeaders();
}
;
that.getResponseHeader = function XHRWrapper_getResponseHeader() {
var args = Array.prototype.slice.call(arguments);
return xhr.getResponseHeader.apply(xhr,args);
}
;
return that;
}

;
XMLHttpRequestWrapper.prototype = {
__exposedProps__: {
onreadystatechange: "rw",
readyState: "r",
open: "r",
setRequestHeader: "r",
send: "r",
abort: "r",
getAllResponseHeaders: "r",
getResponseHeader: "r",
responseText: "r",
responseXML: "r",
status: "r",
statusText: "r",
withCredentials: "rw"}};
