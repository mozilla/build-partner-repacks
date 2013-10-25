"use strict";
EXPORTED_SYMBOLS.push("misc");
const misc = {
getBrowserWindows: function misc_getBrowserWindows() {
var windows = [];
var wndEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
while (wndEnum.hasMoreElements()) windows.push(wndEnum.getNext());
return windows;
}
,
getTopBrowserWindow: function misc_getTopBrowserWindow() {
return this.getTopWindowOfType("navigator:browser");
}
,
getTopWindowOfType: function misc_getTopWindowOfType(windowType) {
var mediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
return mediator.getMostRecentWindow(windowType);
}
,
hiddenWindows: {
get appWindow() {
var hiddenWindow;
try {
hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
}
catch (e) {
Cu.reportError(e);
}

if (! hiddenWindow)
return null;
delete this.appWindow;
return this.appWindow = hiddenWindow;
}
,
getFrame: function misc_getFrame(aFrameId, aFrameURL) {
if (! aFrameURL || typeof aFrameURL != "string")
throw new TypeError("aFrameURL must be a string.");
var hiddenWindow = this.appWindow;
if (! hiddenWindow)
return null;
var hiddenDoc = hiddenWindow.document;
if (! hiddenDoc)
return null;
var url = aFrameURL;
var id = aFrameId || btoa(url);
var frameLoader = hiddenDoc.getElementById(id);
if (! frameLoader)
{
frameLoader = hiddenDoc.createElement("iframe");
frameLoader.setAttribute("id",id);
frameLoader.setAttribute("src",url);
hiddenDoc.documentElement.appendChild(frameLoader);
let contentWindow = frameLoader.contentWindow;
if (contentWindow.location != url)
sysutils.sleep(10000,function _checkLocation() contentWindow.location != url);
if (contentWindow.location != url)
{
Cu.reportError("Can't get hidden window for '" + aFrameURL + "'");
return null;
}

sysutils.sleep(10);
}

return frameLoader;
}
,
removeFrame: function misc_removeFrame(aFrameId, aFrameURL) {
if (! aFrameId && ! aFrameURL)
throw new TypeError("Need frame id or frame url.");
var hiddenWindow = this.appWindow;
if (! hiddenWindow)
return;
var hiddenDoc = hiddenWindow.document;
if (! hiddenDoc)
return;
var id = aFrameId || btoa(aFrameURL);
var frameLoader = hiddenDoc.getElementById(id);
if (frameLoader)
frameLoader.parentNode.removeChild(frameLoader);
}
,
getWindow: function misc_getWindow(aFrameURL) {
var frameLoader = this.getFrame(null,aFrameURL);
return frameLoader && frameLoader.contentWindow || null;
}
},
openWindow: function misc_openWindow(parameters) {
var window;
if ("name" in parameters && parameters.name)
{
const WM = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
if (window = WM.getMostRecentWindow(parameters.name))
{
window.focus();
return window;
}

}

var parent;
var features = parameters.features || "";
if (features.indexOf("__popup__") != - 1)
{
let addFeature = function (aFeatureString) {
var [name, value] = aFeatureString.split("=");
if (name && ! (name in featuresHash))
{
featuresHash[name] = value;
}

}
;
let featuresHash = Object.create(null);
features.replace(/(^|,)__popup__($|,)/,"").split(",").forEach(addFeature);
addFeature("chrome");
addFeature("dependent=yes");
if (sysutils.platformInfo.os.name != "windows")
addFeature("popup=yes");
let featuresMod = [];
for(let [name, value] in Iterator(featuresHash)) featuresMod.push(name + (value ? "=" + value : ""));
features = featuresMod.join(",");
if (! ("parent" in parameters))
parent = this.getTopBrowserWindow();
}

parent = parent || parameters.parent || null;
const WW = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
window = WW.openWindow(parent,parameters.url,parameters.name || "_blank",features,parameters.arguments || undefined);
window.parameters = parameters;
return window;
}
,
navigateBrowser: function misc_navigateBrowser(aNavigateData) {
if (typeof aNavigateData != "object")
throw new Error("Navigation data object required.");
var url = aNavigateData.url;
var uri = misc.tryCreateFixupURI(url);
if (! uri)
throw new CustomErrors.EArgRange("url", "URL", url);
url = uri.spec;
var postData = "postData" in aNavigateData ? aNavigateData.postData : null;
var referrer = "referrer" in aNavigateData ? aNavigateData.referrer : null;
var loadInBackground = "loadInBackground" in aNavigateData ? aNavigateData.loadInBackground : false;
if (typeof loadInBackground !== "boolean")
throw new CustomErrors.EArgRange("loadInBackground", "Boolean", loadInBackground);
if (typeof referrer == "string")
{
try {
referrer = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(referrer,null,null);
}
catch (e) {
referrer = null;
}

}

var sourceWindow = aNavigateData.sourceWindow || misc.getTopBrowserWindow();
if (! sourceWindow)
return this.openNewBrowser(url,referrer,postData);
switch (aNavigateData.target) {
case "new tab":
sourceWindow.gBrowser.loadOneTab(url,referrer,null,postData,loadInBackground);
break;
case "new window":
sourceWindow.openNewWindowWith(url,null,postData,false,referrer);
break;
default:
sourceWindow.gBrowser.loadURI(url,referrer,postData,false);
break;
}

return sourceWindow;
}
,
openNewBrowser: function misc_openNewBrowser(url, referrer, postData) {
var sa = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
var wuri = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
wuri.data = url;
sa.AppendElement(wuri);
sa.AppendElement(null);
sa.AppendElement(referrer);
sa.AppendElement(postData);
var allowThirdPartyFixupSupports = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
allowThirdPartyFixupSupports.data = false;
sa.AppendElement(allowThirdPartyFixupSupports);
var windowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
return windowWatcher.openWindow(null,"chrome://browser/content/browser.xul",null,"chrome,dialog=no,all",sa);
}
,
tryCreateFixupURI: function misc_tryCreateFixupURI(aString) {
var URIFixup = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
try {
return URIFixup.createFixupURI(aString,URIFixup.FIXUP_FLAG_NONE);
}
catch (e) {
return null;
}

}
,
mapKeysToArray: function misc_mapKeysToArray(map, filter) {
return filter ? [key for (key in map) if (filter(key))] : [key for (key in map)];
}
,
mapValsToArray: function misc_mapValsToArray(map, filter) {
return filter ? [val for each (val in map) if (filter(key))] : [val for each (val in map)];
}
,
invertMap: function misc_invertMap(map) {
var result = {
};
for each(let [key, value] in Iterator(map)) result[value] = key;
return result;
}
,
separateItems: function misc_separateItems(input, check) {
if (typeof check != "function")
throw new CustomErrors.EArgType("check", "Function", check);
var trueList = [];
var falseList = [];
for each(let item in input) {
(check(item) ? trueList : falseList).push(item);
}

return [trueList, falseList];
}
,
get CryptoHash() {
var CryptoHash = {
getFromString: function CryptoHash_getFromString(aString, aAlgorithm) {
return this._binaryToHex(this.getBinaryFromString(aString,aAlgorithm));
}
,
getBinaryFromString: function CryptoHash_getBinaryFromString(aString, aAlgorithm) {
var hash = this._createHash(aAlgorithm);
var stream = strutils.utf8Converter.convertToInputStream(aString);
this._updateHashFromStream(hash,stream);
return hash.finish(false);
}
,
_createHash: function CryptoHash__createHash(aAlgorithm) {
var hash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
hash.initWithString(aAlgorithm);
return hash;
}
,
_binaryToHex: function CryptoHash__binaryToHex(aInput) {
return [("0" + aInput.charCodeAt(i).toString(16)).slice(- 2) for (i in aInput)].join("");
}
,
_updateHashFromStream: function CryptoHash__updateHashFromStream(aHash, aStream) {
var streamSize = aStream.available();
if (streamSize)
aHash.updateFromStream(aStream,streamSize);
}
};
delete this.CryptoHash;
return this.CryptoHash = CryptoHash;
}
,
parseLocale: function misc_parseLocale(localeString) {
var components = localeString.match(this._localePattern);
if (components)
return {
language: components[1],
country: components[3],
region: components[5]};
return null;
}
,
findBestLocalizedValue: function misc_findBestLocalizedValue(map, forLocale) {
const lpWeights = {
language: 32,
empty: 16,
en: 8,
ru: 4,
country: 2,
region: 1};
var results = [];
for(let key in map) {
if (! map.hasOwnProperty(key))
continue;
let weight = 0;
if (key)
{
let locale = misc.parseLocale(key);
for(let partName in lpWeights) {
if (partName in locale)
{
let localePart = locale[partName];
if (partName == "language")
if (localePart in lpWeights)
weight += lpWeights[localePart];
if (localePart === forLocale[partName])
weight += lpWeights[partName];
}

}

}
 else
{
weight = lpWeights.empty;
}

results.push({
key: key,
weight: weight});
}

results.sort(function rule(a, b) {
if (a.weight == b.weight)
return 0;
return a.weight > b.weight ? - 1 : + 1;
}
);
return results[0] && map[results[0].key];
}
,
_localePattern: /^([a-z]{2})(-([A-Z]{2})(-(\w{2,5}))?)?$/};
