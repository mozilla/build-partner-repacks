"use strict";
const EXPORTED_SYMBOLS = ["WindowListener"];
const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
const ABOUT_BLANK_URI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI("about:blank",null,null);
const STATE_IS_NETWORK = Ci.nsIWebProgressListener.STATE_IS_NETWORK;
const STATE_START = Ci.nsIWebProgressListener.STATE_START;
const STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;
function isCurrentTab(aTab) {
var tabBrowser = aTab.getTabBrowser();
return tabBrowser && tabBrowser.mCurrentBrowser === aTab;
}

function PropertyWatcher(aWindowListener) {
var windowListener = aWindowListener;
function _PropertyWatcher(aProp, aOldValue, aNewValue) {
if (aProp == "title" && windowListener._updateWindowTitle())
{
windowListener.notifyListeners("WindowTitleChange",{
title: windowListener.windowTitle,
url: windowListener.windowLocation});
}

return aNewValue;
}

return _PropertyWatcher;
}

function ProgressListener(aWindowListener) {
this._windowListener = aWindowListener;
}

ProgressListener.prototype = {
shutdown: function ProgressListener_shutdown() {
this._windowListener = null;
}
,
_isTopWindowWebProgress: function ProgressListener__isTopWindowWebProgress(aWebProgress) {
try {
let reqWindow = aWebProgress.DOMWindow;
return reqWindow === reqWindow.top;
}
catch (ex) {

}

return false;
}
,
onLocationChange: function ProgressListener_onLocationChange(aWebProgress, aRequest, aLocation) {
if (this._isTopWindowWebProgress(aWebProgress))
this._windowListener.onWindowLocationChange(aLocation,aWebProgress,aRequest);
}
,
onStateChange: function ProgressListener_onStateChange(aWebProgress, aRequest, aStateFlags, aStatus) {
if (! aRequest || ! (aStateFlags & STATE_IS_NETWORK) || ! this._isTopWindowWebProgress(aWebProgress))
return;
if (aStateFlags & STATE_START)
this._windowListener.onPageStateStart(aWebProgress,aRequest);
if (aStateFlags & STATE_STOP)
this._windowListener.onPageStateStop(aWebProgress,aRequest);
}
,
onProgressChange: function ProgressListener_onProgressChange() {

}
,
onStatusChange: function ProgressListener_onStatusChange() {

}
,
onSecurityChange: function ProgressListener_onSecurityChange() {

}
,
onLinkIconAvailable: function ProgressListener_onLinkIconAvailable() {

}
,
QueryInterface: function ProgressListener_QueryInterface(aIID) {
if (aIID.equals(Ci.nsIWebProgressListener) || aIID.equals(Ci.nsISupportsWeakReference) || aIID.equals(Ci.nsISupports))
return this;
throw Cr.NS_NOINTERFACE;
}
};
function TabListener(aWindowListener, aTab) {
this._windowListener = aWindowListener;
this._tab = aTab;
this._init();
this._tabData = Object.create(null);
}

TabListener.prototype = {
_events: [["DOMContentLoaded", false], ["load", true], ["pageshow", true], ["pagehide", true]],
_init: function TabListener__init() {
this._events.forEach(function (ev) {
this._tab.addEventListener(ev[0],this,ev[1]);
}
,this);
}
,
destroy: function TabListener_destroy() {
this._events.forEach(function (ev) {
this._tab.removeEventListener(ev[0],this,ev[1]);
}
,this);
this._windowListener = null;
this._tabData = null;
this._tab = null;
}
,
handleEvent: function TabListener_handleEvent(aEvent) {
if (this._tab.contentDocument !== aEvent.originalTarget)
return;
var eventType = aEvent.type;
switch (eventType) {
case "pageshow":
eventType = "PageShow";
break;
case "pagehide":
eventType = "PageHide";
break;
case "load":
eventType = "PageLoad";
break;
}

switch (eventType) {
case "DOMContentLoaded":

case "PageShow":

case "PageHide":

case "PageLoad":
let currentURL = this._tab.currentURI.spec;
if (currentURL == "about:blank")
currentURL = "";
this._windowListener.notifyListeners(eventType,{
tab: this._tab,
url: currentURL,
uri: this._tab.currentURI,
isCurrentTab: isCurrentTab(this._tab),
get readyState() {
var doc = this.tab.contentDocument;
return doc && doc.readyState;
}
});
break;
}

}
};
function WindowListener(aWindow, aAppName, aLogger) {
this._window = aWindow;
this._tabListenerName = aAppName + "TabListener";
this._logger = aLogger;
this._listeners = Object.create(null);
this._started = false;
this._windowTitle = null;
this._propertyWatcher = new PropertyWatcher(this);
this._progressListener = null;
aWindow.addEventListener("load",this,false);
aWindow.addEventListener("unload",this,false);
}

WindowListener.prototype = {
startup: function WindowListener_startup() {
if (this._started)
return;
this._started = true;
var gBrowser = this._window.gBrowser;
this.notifyListeners("WindowTitleChange",{
title: this.windowTitle,
url: this.windowLocation});
this.onWindowLocationChange(gBrowser.currentURI,gBrowser.webProgress,null);
this._progressListener = new ProgressListener(this);
gBrowser.addProgressListener(this._progressListener);
var panelsLen = gBrowser.mPanelContainer.childNodes.length;
for (let i = 0;i < panelsLen;i++) this.addTabListener(gBrowser.getBrowserAtIndex(i));
var container = gBrowser.tabContainer;
container.addEventListener("TabOpen",this,false);
container.addEventListener("TabClose",this,false);
}
,
shutdown: function WindowListener_shutdown() {
if (this._started)
{
this._started = false;
this._window.document.unwatch("title",this._propertyWatcher);
let gBrowser = this._window.gBrowser;
let panelsLen = gBrowser.mPanelContainer.childNodes.length;
for (let i = 0;i < panelsLen;i++) this.removeTabListener(gBrowser.getBrowserAtIndex(i));
let container = gBrowser.tabContainer;
container.removeEventListener("TabOpen",this,false);
container.removeEventListener("TabClose",this,false);
gBrowser.removeProgressListener(this._progressListener);
this._progressListener.shutdown();
}

this._propertyWatcher = null;
this._listeners = null;
this._window = null;
this._windowTitle = null;
this._progressListener = null;
this._logger = null;
}
,
get currentTab() {
return this._started ? this._window.gBrowser.mCurrentBrowser : null;
}
,
addTabListener: function WindowListener_addTabListener(aTab) {
if (! (this._tabListenerName in aTab))
aTab[this._tabListenerName] = new TabListener(this, aTab);
}
,
removeTabListener: function WindowListener_removeTabListener(aTab) {
if (this._tabListenerName in aTab)
{
aTab[this._tabListenerName].destroy();
delete aTab[this._tabListenerName];
}

}
,
getTabData: function WindowListener_getTabData(aTab, aObjectName) {
this.addTabListener(aTab);
var tabData = aTab[this._tabListenerName]._tabData;
if (! (aObjectName in tabData))
tabData[aObjectName] = Object.create(null);
return tabData[aObjectName];
}
,
removeTabData: function WindowListener_clearTabData(aTab, aObjectName) {
if (! (this._tabListenerName in aTab))
return;
var tabData = aTab[this._tabListenerName]._tabData;
if (tabData && aObjectName in tabData)
delete tabData[aObjectName];
}
,
removeAllTabData: function WindowListener_removeAllTabData(aObjectName) {
var gBrowser = this._window && this._window.gBrowser;
if (! gBrowser)
return;
var i = gBrowser.mPanelContainer.childNodes.length;
while (i--) this.removeTabData(gBrowser.getBrowserAtIndex(i),aObjectName);
}
,
handleEvent: function WindowListener_handleEvent(aEvent) {
switch (aEvent.type) {
case "TabOpen":

case "TabClose":
let tab = aEvent.target.linkedBrowser;
if (! tab)
return;
switch (aEvent.type) {
case "TabOpen":
this.addTabListener(tab);
this.notifyListeners("TabOpen",{
tab: tab});
break;
case "TabClose":
this.notifyListeners("TabClose",{
tab: tab});
this.removeTabListener(tab);
break;
}

break;
case "load":
aEvent.currentTarget.removeEventListener("load",this,false);
this.startup();
break;
case "unload":
aEvent.currentTarget.removeEventListener("unload",this,false);
this.shutdown();
break;
default:
break;
}

}
,
KNOWN_TOPICS: ["WindowTitleChange", "WindowLocationChange", "DOMContentLoaded", "PageLoad", "PageShow", "PageHide", "PageStateStart", "PageStateStop", "TabOpen", "TabClose"],
addListener: function WindowListener_addListener(aTopic, aListener) {
if (this.KNOWN_TOPICS.indexOf(aTopic) == - 1)
throw new TypeError("WindowListener.addListener: unknown topic \"" + aTopic + "\"");
if (! this._listeners)
return;
if (! this._listeners[aTopic])
{
this._listeners[aTopic] = [aListener];
if (aTopic == "WindowTitleChange")
{
this._window.document.watch("title",this._propertyWatcher);
if (this._windowTitle === null)
this._updateWindowTitle();
}

}
 else
if (! this._listeners[aTopic].some(function (listener) listener === aListener))
{
this._listeners[aTopic].push(aListener);
}

}
,
removeListener: function WindowListener_removeListener(aTopic, aListener) {
if (this.KNOWN_TOPICS.indexOf(aTopic) == - 1)
throw new TypeError("WindowListener.removeListener: unknown topic \"" + aTopic + "\"");
if (! this._listeners)
return;
if (! this._listeners[aTopic])
return;
this._listeners[aTopic] = this._listeners[aTopic].filter(function (listener) listener !== aListener);
if (this._listeners[aTopic].length)
return;
delete this._listeners[aTopic];
if (aTopic == "WindowTitleChange")
{
this._window.document.unwatch("title",this._propertyWatcher);
this._windowTitle = null;
}

}
,
notifyListeners: function WindowListener_notifyListeners(aTopic, aData) {
var WindowListener_notifyListeners_timed = (function WindowListener_notifyListeners_timed() {
this._notifyListeners.apply(this,arguments);
}
).bind(this,aTopic,aData);
var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
timer.initWithCallback({
notify: WindowListener_notifyListeners_timed},0,Ci.nsITimer.TYPE_ONE_SHOT);
}
,
_notifyListeners: function WindowListener__notifyListeners(aTopic, aData) {
if (! this._listeners)
return;
var listeners = this._listeners[aTopic];
if (! listeners)
return;
listeners.forEach(function WindowListener_NotificatorFunc(listener) {
try {
if (this._listeners[aTopic].indexOf(listener) != - 1)
listener.observe(null,aTopic,aData);
}
catch (e) {
this._logger.error("Notify listener error: " + e);
}

}
,this);
}
,
_updateWindowTitle: function WindowListener__updateWindowTitle() {
var oldTitle = this._windowTitle;
try {
this._windowTitle = this._window.gBrowser.contentTitle || "";
}
catch (e) {
this._windowTitle = "";
}

return oldTitle != this._windowTitle;
}
,
get windowTitle() {
return this._windowTitle;
}
,
_lastWindowURL: null,
onWindowLocationChange: function WindowListener_onWindowLocationChange(aLocation, aWebProgress, aRequest) {
var lastURL = this._lastWindowURL;
var currentURL = this._getURISpec(aLocation);
var specChanged = lastURL != currentURL;
var hashOnlyChanged = false;
if (lastURL && currentURL && specChanged && lastURL.split("#")[0] == currentURL.split("#")[0])
hashOnlyChanged = true;
this._updateWindowTitle();
this.notifyListeners("WindowLocationChange",{
uri: aLocation,
url: currentURL,
referringURI: aWebProgress.referringURI,
title: this.windowTitle,
tab: aWebProgress.chromeEventHandler,
webProgress: aWebProgress,
hashOnlyChanged: hashOnlyChanged,
specChanged: specChanged,
get URIWasModified() {
var sessionHistory = aWebProgress.sessionHistory;
var shEntry = sessionHistory.getEntryAtIndex(sessionHistory.index,false);
shEntry.QueryInterface(Ci.nsISHEntry);
return shEntry.URIWasModified;
}
,
request: aRequest,
get readyState() {
var doc = this.tab.contentDocument;
return doc && doc.readyState;
}
,
isCurrentTab: isCurrentTab(aWebProgress.chromeEventHandler)});
this._lastWindowURL = currentURL;
}
,
get windowLocation() {
if (this._started)
{
try {
return this._getURISpec(this._window.gBrowser.currentURI);
}
catch (e) {

}

}

return null;
}
,
get currentURI() {
if (this._started)
{
try {
return this._window.gBrowser.currentURI;
}
catch (e) {

}

}

return ABOUT_BLANK_URI.clone();
}
,
_getURISpec: function WindowListener__getURISpec(aURI) {
var spec = null;
try {
spec = aURI.spec || "";
if (spec == "about:blank")
spec = "";
}
catch (e) {

}

return spec;
}
,
onPageStateStart: function WindowListener_onPageStateStart(aWebProgress, aRequest) {
this.notifyListeners("PageStateStart",{
tab: aWebProgress.chromeEventHandler,
request: aRequest,
isCurrentTab: isCurrentTab(aWebProgress.chromeEventHandler)});
}
,
onPageStateStop: function WindowListener_onPageStateStop(aWebProgress, aRequest) {
this.notifyListeners("PageStateStop",{
tab: aWebProgress.chromeEventHandler,
request: aRequest,
isCurrentTab: isCurrentTab(aWebProgress.chromeEventHandler)});
}
};
