const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
const EXT_ID = "yasearch@yandex.ru";
const CHROME_CONTENT = "chrome://yasearch/content/";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
this.__defineGetter__("AddonManager",function addonManagerGetter() {
delete this.AddonManager;
Cu.import("resource://yasearch-mod/AddonManager.jsm",this);
return this.AddonManager;
}
);
var gSubscriptsForInit = [];
["consts", "ya_installer", "ya_overlay"].forEach(function (aScriptName) this.loadSubScript(CHROME_CONTENT + "sub-scripts/" + aScriptName + ".js"),Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader));
function nsIYaSearch() {
this.version = "201204080600";
this.wrappedJSObject = this;
this._inited = false;
}

nsIYaSearch.prototype = {
globalScope: this,
log: function (msg) {

}
,
get customBarApp() {
return this._customBarApp || (this._customBarApp = Cc["@yandex.ru/custombarcore;yasearch"].getService().wrappedJSObject.application);
}
,
get barnavigR1String() {
return this.customBarApp.barnavig.barnavigR1String;
}
,
set barnavigR1String(aR1String) {
this.customBarApp.barnavig.barnavigR1String = aR1String || "";
}
,
isFirstDOMWinStuffDone: false,
onBrowserUIStartupComplete: function () {
if (! this.initialized || this.isFirstDOMWinStuffDone)
return;
this.stringBundle = null;
this.isFirstDOMWinStuffDone = true;
}
,
get initialized() {
return this._inited;
}
,
init: function () {
if (this.initialized)
return;
if (! this.customBarApp)
{
OBSERVER_SERVICE.addObserver(this,"yasearch-state-changed",false);
return;
}

const scriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const branding = this.customBarApp.branding;
OBSERVER_SERVICE.addObserver(this,"browser-ui-startup-complete",true);
OBSERVER_SERVICE.addObserver(this,"profile-before-change",true);
["http-on-modify-request"].forEach(function YS_init_addObservers(aTopicName) {
OBSERVER_SERVICE.addObserver(this,aTopicName,true);
}
,this);
gSubscriptsForInit.forEach(function (aObject) {
if (typeof aObject === "object" && "startup" in aObject)
{
try {
aObject.startup();
}
catch (e) {
Cu.reportError(e);
Cu.reportError("Error running sub-script startup (" + aObject + ")");
}

}

}
);
gSubscriptsForInit = null;
this._inited = true;
OBSERVER_SERVICE.notifyObservers(null,"yasearch-state-changed","initialized");
}
,
uninit: function () {
if (! this._inited)
return;
this._inited = false;
OBSERVER_SERVICE.notifyObservers(null,"yasearch-state-changed","before-finalized");
["http-on-modify-request"].forEach(function YS_uninit_removeObservers(aTopicName) {
OBSERVER_SERVICE.removeObserver(this,aTopicName,true);
}
,this);
OBSERVER_SERVICE.notifyObservers(null,"yasearch-state-changed","finalized");
}
,
get yaOverlay() {
return this.globalScope.gYaOverlay || null;
}
,
getInstallDir: function YS_getInstallDir() {
return __LOCATION__.parent.parent;
}
,
get barPref() {
if (! this._barPref)
this._barPref = " YB/" + this.barExtensionVersionWithLocale;
return this._barPref;
}
,
get barPrefReg() {
if (! this._barPrefReg)
this._barPrefReg = new RegExp(this.barPref.replace(/(\.|\-)/g,"\\$1"));
return this._barPrefReg;
}
,
__localeLang: null,
get localeLang() {
if (! this.__localeLang)
this.__localeLang = this.getString("locale.lang");
return this.__localeLang;
}
,
observe: function (aSubject, aTopic, aData) {
switch (aTopic) {
case "http-on-modify-request":
aSubject.QueryInterface(Ci.nsIHttpChannel);
switch (aSubject.URI.host) {
case "bar.yandex.ru":
if (! /bar\.yandex\.ru\/library/.test(aSubject.URI.spec))
return;
case "bar-widgets.yandex.ru":
try {
var ua = aSubject.getRequestHeader("User-Agent");
if (! this.barPrefReg.test(ua))
aSubject.setRequestHeader("User-Agent",ua + this.barPref,false);
}
catch (e) {

}

break;
}

break;
case "yasearch-state-changed":
switch (aData) {
case "custombar-initialized":
this.init();
break;
}

break;
case "profile-after-change":
this.init();
break;
case "profile-before-change":
this.uninit();
break;
case "app-startup":
OBSERVER_SERVICE.addObserver(this,"profile-after-change",true);
break;
case "browser-ui-startup-complete":
this.onBrowserUIStartupComplete();
break;
}

}
,
getStringBundle: function (aLocaleFilePath) {
var strBundleService = Cc["@mozilla.org/intl/stringbundle;1"].createInstance(Ci.nsIStringBundleService);
if (aLocaleFilePath)
return strBundleService.createBundle("chrome://yasearch/locale/" + aLocaleFilePath);
if (! this.stringBundle)
this.stringBundle = strBundleService.createBundle("chrome://yasearch/locale/yasearch.properties");
return this.stringBundle;
}
,
getString: function (aName) {
return this.getStringBundle().GetStringFromName(aName);
}
,
_getBytesFromStream: function (aInputStream) {
var byteArray = null;
try {
let binaryStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
binaryStream.setInputStream(aInputStream);
byteArray = binaryStream.readByteArray(binaryStream.available());
binaryStream.close();
}
catch (ex) {
Cu.reportError(ex);
}

return byteArray;
}
,
_getStringFromStream: function (aInputStream) {
var content = "";
try {
let fileSize = aInputStream.available();
let cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
cvstream.init(aInputStream,"UTF-8",fileSize,Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
let data = {
};
cvstream.readString(fileSize,data);
content = data.value;
cvstream.close();
}
catch (ex) {
Cu.reportError(ex);
}

return content;
}
,
readFile: function (aSource, aBinaryMode) {
if (! aSource)
return null;
var inputStream;
var content = "";
if (typeof aSource == "string")
{
const CHROME_APP_PATH = "chrome://yasearch/";
aSource = aSource.replace(/^\$(content|locale|skin)\//,CHROME_APP_PATH + "$1/").replace(/^\$chrome\//,CHROME_APP_PATH);
let chromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
let chromeURI;
try {
chromeURI = chromeReg.convertChromeURL(IO_SERVICE.newURI(aSource,null,null));
}
catch (ex) {

}

if (chromeURI)
{
switch (chromeURI.scheme) {
case "jar":
chromeURI.QueryInterface(Ci.nsIJARURI);
let fileURI = chromeURI.JARFile;
fileURI.QueryInterface(Ci.nsIFileURL);
let chromeFile = fileURI.file;
let jarEntry = chromeURI.JAREntry;
let zipreader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
zipreader.open(chromeFile);
if (zipreader.hasEntry(jarEntry))
inputStream = zipreader.getInputStream(jarEntry);
zipreader.close();
break;
case "file":
let protocolHandler = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
aSource = protocolHandler.getFileFromURLSpec(chromeURI.spec);
break;
default:
throw new Error("'" + chromeURI.scheme + "' not yet impl");
break;
}

}

}

if (! inputStream && aSource instanceof Ci.nsILocalFile)
{
inputStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
inputStream.init(aSource,1,0,inputStream.CLOSE_ON_EOF);
}

if (inputStream)
{
content = aBinaryMode ? this._getBytesFromStream(inputStream) : this._getStringFromStream(inputStream);
inputStream.close();
}

return content;
}
,
removeFile: function (aFile) {
if (! (aFile instanceof Ci.nsILocalFile))
throw new Error("nsYaSearch.removeFile: not nsILocalFile.");
if (! aFile.exists())
return true;
if (! aFile.isFile() && ! aFile.isDirectory())
throw new Error("nsYaSearch.removeFile: not a file or directory.");
try {
aFile.remove(true);
return true;
}
catch (e) {

}

var tmpDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD",Ci.nsILocalFile);
var tmpFile = tmpDir.clone();
tmpFile.append(aFile.leafName);
if (aFile.isFile())
tmpFile.createUnique(tmpFile.NORMAL_FILE_TYPE,PERMS_FILE); else
tmpFile.createUnique(tmpFile.DIRECTORY_TYPE,PERMS_DIRECTORY);
aFile.moveTo(tmpDir,tmpFile.leafName);
return true;
}
,
prefBranchInternal: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2),
prefBranch: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
setBoolPref: function (aName, aValue) {
this.prefBranch.setBoolPref(aName,aValue);
}
,
getBoolPref: function (aName) {
var rv = null;
try {
rv = this.prefBranch.getBoolPref(aName);
}
catch (e) {

}

return rv;
}
,
setIntPref: function (aName, aValue) {
this.prefBranch.setIntPref(aName,aValue);
}
,
getIntPref: function (aName) {
var rv = null;
try {
rv = this.prefBranch.getIntPref(aName);
if (rv < 0)
rv = 0;
}
catch (e) {

}

return rv;
}
,
setCharPref: function (aName, aValue) {
this.prefBranch.setCharPref(aName,aValue);
}
,
getCharPref: function (aName) {
var rv = null;
try {
rv = this.prefBranch.getCharPref(aName);
}
catch (e) {

}

return rv;
}
,
getComplexValue: function (aName) {
var rv = null;
try {
rv = this.prefBranch.getComplexValue(aName,Ci.nsIPrefLocalizedString).data;
}
catch (e) {

}

return rv;
}
,
setComplexValue: function (aName, aValue) {
try {
let str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
str.data = aValue;
this.prefBranch.setComplexValue(aName,Ci.nsISupportsString,str);
}
catch (e) {

}

}
,
resetPref: function (aPrefName) {
try {
this.prefBranch.clearUserPref(aPrefName);
}
catch (e) {

}

}
,
get barExtensionVersion() {
if (! this._barExtensionVersion)
this._barExtensionVersion = this.barExtensionMajorVersion;
return this._barExtensionVersion;
}
,
get barExtensionMajorVersion() {
if (! this._barExtensionMajorVersion)
this._barExtensionMajorVersion = AddonManager.getAddonVersion(__LOCATION__.parent.parent);
return this._barExtensionMajorVersion;
}
,
get barExtensionVersionWithLocale() {
if (! this._barExtensionVersionWithLocale)
this._barExtensionVersionWithLocale = this.barExtensionVersion + this.versionLocaleAppend;
return this._barExtensionVersionWithLocale;
}
,
get versionLocaleAppend() {
var verLocaleAppend = this.localeLang;
return verLocaleAppend && verLocaleAppend != "ru" ? "-" + verLocaleAppend : "";
}
,
get isYandexFirefoxDistribution() {
var isYandexDistrib = gYaSearchService.getCharPref("app.distributor") == "yandex";
if (! isYandexDistrib)
{
let curProcDir;
try {
curProcDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("CurProcD",Ci.nsIFile);
}
catch (e) {

}

if (curProcDir)
{
["distribution", "extensions", "yasearch@yandex.ru"].forEach(function (aPath) curProcDir.append(aPath));
isYandexDistrib = curProcDir.exists();
}

}

this.__defineGetter__("isYandexFirefoxDistribution",function () isYandexDistrib);
return this.isYandexFirefoxDistribution;
}
,
classDescription: "nsYaSearch JS component",
contractID: "@yandex.ru/yasearch;1",
classID: Components.ID("{3F79261A-508E-47a3-B61C-D1F29E2068F3}"),
_xpcom_categories: [{
category: "app-startup",
service: true}],
QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIYaSearch, Ci.nsIObserver, Ci.nsISupportsWeakReference])};
var NSGetFactory = XPCOMUtils.generateNSGetFactory([nsIYaSearch]);
this.__defineGetter__("gYaSearchService",function gYaSearchServiceGetter() {
delete this.gYaSearchService;
return this.gYaSearchService = Cc["@yandex.ru/yasearch;1"].getService(Ci.nsIYaSearch).wrappedJSObject;
}
);
