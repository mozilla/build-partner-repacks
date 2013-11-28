"use strict";
const EXPORTED_SYMBOLS = ["overlayProvider"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
const overlayProvider = {
init: function Overlay_init(barApplication) {
this._application = barApplication;
barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib,GLOBAL);
this._barCore = barApplication.core;
this._logger = barApplication.getLogger("XULOverlay");
this._commonItemPattern = new RegExp("^" + this._application.name + "\\.cb\\-(\\S+)\\-inst\\-(.+)$");
this._defaultItemPattern = new RegExp("^" + this._application.name + "\\.cb\\-default\\-(\\d+)$");
this._defaultSetIDs = {
};
this._application.core.protocols[this._application.name].addDataProvider(this);
}
,
finalize: function Overlay_finalize() {
this._application.core.protocols[this._application.name].removeDataProvider(this);
}
,
getContent: function Overlay_getContent(aURI) {
try {
if (aURI.path.toLowerCase() == "browser-overlay")
{
let contentStr = strutils.utf8Converter.ConvertFromUnicode(xmlutils.xmlSerializer.serializeToString(this._createBrowserOverlay()));
return contentStr + strutils.utf8Converter.Finish();
}

}
catch (e) {
this._logger.error("Could not make browser overlay. " + strutils.formatError(e));
this._logger.debug(e.stack);
}

return null;
}
,
get currentSetIds() {
if (! this._currentSetIds)
this._currentSetIds = this._readCurrentSetIds();
return this._currentSetIds;
}
,
parseWidgetItemId: function Overlay_parseWidgetItemId(itemID, fullMode) {
var match;
if (match = itemID.match(this._commonItemPattern))
return {
prototypeID: match[1],
instanceID: match[2],
isFromDefaultSet: false};
if (match = itemID.match(this._defaultItemPattern))
{
let presetItemIndex = parseInt(match[1],10);
let widgetEntry = this._application.defaultPreset.visibleWidgetEntries[presetItemIndex];
if (widgetEntry)
{
let itemInfo = {
prototypeID: widgetEntry.componentID,
instanceID: 0,
isFromDefaultSet: true};
if (fullMode)
{
let instID;
if (presetItemIndex in this._defaultSetIDs)
itemInfo.instanceID = this._defaultSetIDs[presetItemIndex]; else
itemInfo.instanceID = this._defaultSetIDs[presetItemIndex] = this._application.BarPlatform.getNewWidgetInstanceID();
itemInfo.settings = sysutils.copyObj(widgetEntry.settings);
}

return itemInfo;
}

}

return null;
}
,
compileWidgetItemId: function Overlay_compileWidgetItemId(protoID, instanceID) {
return this._application.name + ".cb-" + protoID + "-inst-" + instanceID;
}
,
widgetItemRemoved: function Overlay_widgetItemRemoved(removedInstID) {
for(let [index, storedInstID] in Iterator(this._defaultSetIDs)) {
if (storedInstID == removedInstID)
{
delete this._defaultSetIDs[index];
break;
}

}

}
,
makePaletteItem: function Overlay_makePaletteItem(doc, widgetInfo, instanceID) {
var toolbarItem = doc.createElementNS(this._consts.STR_XUL_NS,"toolbaritem");
toolbarItem.setAttribute("id",this.compileWidgetItemId(widgetInfo.id,instanceID));
toolbarItem.setAttribute("cb-proto-id",widgetInfo.id);
toolbarItem.setAttribute("cb-inst-id",instanceID);
toolbarItem.setAttribute("cb-app",this._application.name);
toolbarItem.setAttribute("title",widgetInfo.name);
toolbarItem.setAttribute("image",widgetInfo.iconPath ? widgetInfo.package_.resolvePath(widgetInfo.iconPath) : "");
return toolbarItem;
}
,
makeDefaultSetItems: function Overlay_makeDefaultSetItems(document) {
return this._makeDefaultSetItems(document);
}
,
genWidgetHostID: function Overlay_genWidgetHostID() {
return this._newWEID++;
}
,
removeWidgetsFromToolbars: function Overlay_removeWidgetsFromToolbars() {
var filterAppIds = (function _filterAppIds(id) {
return id && ! (this._commonItemPattern.test(id) || this._defaultItemPattern.test(id));
}
).bind(this);
var allResources = LocalStoreData.getAllResources();
while (allResources.hasMoreElements()) {
let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
let toolbar = res.Value;
if (! toolbar)
continue;
let currentSet = LocalStoreData.getAttribute(toolbar,"currentset");
if (! currentSet || currentSet == "__empty")
continue;
let newCurrentset = currentSet.split(",").filter(filterAppIds).join(",") || "__empty";
if (newCurrentset === currentSet)
continue;
LocalStoreData.setAttribute(toolbar,"currentset",newCurrentset);
}

var appToolbarURIString = "chrome://browser/content/browser.xul#" + this._application.name + "-bar";
LocalStoreData.removeAttribute(appToolbarURIString,"currentset");
LocalStoreData.removeAttribute(appToolbarURIString,"collapsed");
LocalStoreData.removeAttribute("chrome://browser/content/browser.xul#navigator-toolbox","cb-barless");
}
,
returnNativeElements: function Overlay_returnNativeElements() {
var navToolbarURIString = "chrome://browser/content/browser.xul#nav-bar";
var navbarCurrentset = LocalStoreData.getAttribute(navToolbarURIString,"currentset");
if (navbarCurrentset && navbarCurrentset !== "__empty")
{
let ids = navbarCurrentset.split(",");
let insertIndex = ids.indexOf("bookmarks-menu-button-container");
if (insertIndex == - 1)
insertIndex = ids.indexOf("window-controls");
if (insertIndex == - 1)
insertIndex = ids.length - 1;
let currentSetsIds = this._getAllIdsFromCurrentSets();
["home-button"].forEach(function (id) {
if (currentSetsIds.indexOf(id) == - 1)
ids.splice(insertIndex,0,id);
}
);
LocalStoreData.setAttribute(navToolbarURIString,"currentset",ids.join(","));
}

}
,
removeToolbarsCollapsedState: function Overlay_removeToolbarsCollapsedState() {
var allResources = LocalStoreData.getAllResources();
while (allResources.hasMoreElements()) {
let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
let toolbar = res.Value;
if (! toolbar)
continue;
let collapsed = LocalStoreData.getAttribute(toolbar,"collapsed");
if (collapsed != "true")
continue;
LocalStoreData.removeAttribute(toolbar,"collapsed");
}

}
,
_commonItemPattern: null,
_defaultItemPattern: null,
_defaultSetIDs: null,
_DOMSerializer: null,
_logger: null,
_newWEID: 0,
_consts: {
STR_DYNBASE_PATH: "$content/overlay/dynbase.xul",
STR_XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
ERR_CREATE_ITEM: "Could not add widget palette item"},
_createBrowserOverlay: function Overlay__createBrowserOverlay() {
var start = Date.now();
var overlayDoc = this._getOverlayBase();
var [defaultSetItems, defaultSetIDs] = this._makeDefaultSetItems(overlayDoc);
var toolbarPalette = overlayDoc.getElementById("BrowserToolbarPalette");
for each(let [, defaultSetItem] in Iterator(defaultSetItems)) toolbarPalette.appendChild(defaultSetItem);
for each(let [, normalPaletteItem] in Iterator(this._makePaletteItems(overlayDoc))) toolbarPalette.appendChild(normalPaletteItem);
var appToolbar = overlayDoc.getElementById(this._application.name + "-bar");
var toolbox = overlayDoc.getElementById("navigator-toolbox");
appToolbar.setAttribute("defaultset",defaultSetIDs.join(","));
appToolbar.parentNode.setAttribute("cb-default-theme",this._defaultThemeActive);
toolbox.setAttribute("cb-os",sysutils.platformInfo.os.name);
var version = sysutils.platformInfo.browser.version.toString();
toolbox.setAttribute("cb-ff-version",parseInt(version,10));
this._logger.debug("Overlay created in " + (Date.now() - start) + "ms");
return overlayDoc;
}
,
_getOverlayBase: function Overlay__getOverlayBase() {
var overlayDocChannel = this._application.addonFS.getChannel(this._consts.STR_DYNBASE_PATH);
var overlayDoc = fileutils.xmlDocFromStream(overlayDocChannel.open(),overlayDocChannel.originalURI,overlayDocChannel.originalURI,true);
return overlayDoc;
}
,
_makePaletteItems: function Overlay__makePaletteItems(overlayDoc) {
var currentSetIDsData = this._readCurrentSetIds();
var widgetLibrary = this._application.widgetLibrary;
var paletteItems = [];
var avaibleWidgetIDs = widgetLibrary.getAvaibleWidgetIDs();
for (let i = 0, len = avaibleWidgetIDs.length;i < len;i++) {
let widgetInfo = widgetLibrary.getWidgetInfo(avaibleWidgetIDs[i]);
let isUsed = false;
let protoInstHash = currentSetIDsData[widgetInfo.id] || null;
if (protoInstHash)
{
isUsed = true;
for each(let instID in protoInstHash) {
paletteItems.push(this.makePaletteItem(overlayDoc,widgetInfo,instID));
this._application.BarPlatform.getNewWidgetInstanceID();
if (widgetInfo.isUnique)
break;
}

}

if (! widgetInfo.isUnique || ! isUsed)
{
paletteItems.push(this.makePaletteItem(overlayDoc,widgetInfo,0));
}

}

return paletteItems;
}
,
_makeDefaultSetItems: function Overlay__makeDefaultSetItems(overlayDoc) {
var widgetLibrary = this._application.widgetLibrary;
var paletteItems = [];
var defaultSetIDs = [];
var widgetEntries = this._application.defaultPreset.visibleWidgetEntries;
var usedIDs = Object.create(null);
for (let i = 0, length = widgetEntries.length;i < length;i++) {
let widgetEntry = widgetEntries[i];
let widgetInfo = null;
let protoID = widgetEntry.componentID;
let itemID;
try {
widgetInfo = widgetLibrary.getWidgetInfo(protoID);
if (widgetInfo.isUnique && protoID in usedIDs)
continue;
}
catch (e) {
this._logger.error(this._consts.ERR_CREATE_ITEM + ". " + strutils.formatError(e));
continue;
}

let paletteItem = this.makePaletteItem(overlayDoc,widgetInfo,0);
itemID = this._application.name + ".cb-default-" + i;
paletteItem.setAttribute("id",itemID);
paletteItem.setAttribute("cb-defaultset","");
paletteItems.push(paletteItem);
usedIDs[protoID] = true;
defaultSetIDs.push(itemID);
}

return [paletteItems, defaultSetIDs];
}
,
_readCurrentSetIds: function Overlay__readCurrentSetIds() {
var result = {
};
var commonItemPattern = this._commonItemPattern;
var currentSetIds = this._getAllIdsFromCurrentSets();
for (let i = 0, len = currentSetIds.length;i < len;i++) {
let barWidgetIDMatch = currentSetIds[i].match(commonItemPattern);
if (barWidgetIDMatch)
{
let widgetProtoID = barWidgetIDMatch[1];
let widgetInstance = barWidgetIDMatch[2];
let instArray = result[widgetProtoID];
if (! instArray)
{
instArray = [];
result[widgetProtoID] = instArray;
}

instArray.push(widgetInstance);
}

}

return result;
}
,
_getAllIdsFromCurrentSets: function Overlay__getAllIdsFromCurrentSets() {
var result = [];
function _getIdsFromCurrentset(aCurrenSetString) {
if (! aCurrenSetString || aCurrenSetString == "__empty")
return;
result = result.concat(aCurrenSetString.split(","));
}

var rdfService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
var localStoreDataSource = rdfService.GetDataSource("rdf:local-store");
var allResources = localStoreDataSource.GetAllResources();
var currentSetResource = rdfService.GetResource("currentset");
while (allResources.hasMoreElements()) {
let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
let tool = res.Value;
if (tool)
{
if (tool == "chrome://browser/content/browser.xul#customToolbars")
{
let customToolbarsResource = rdfService.GetResource(tool);
let index = 0;
let currentSetTarget;
do {
let toolbarResource = rdfService.GetResource("toolbar" + ++index);
currentSetTarget = localStoreDataSource.GetTarget(customToolbarsResource,toolbarResource,true);
if (currentSetTarget instanceof Ci.nsIRDFLiteral)
{
let ids = currentSetTarget.Value.split(":");
ids.shift();
_getIdsFromCurrentset(ids.join(":"));
}

}
 while (currentSetTarget);
}
 else
{
let toolbarResource = rdfService.GetResource(tool);
let currentSetTarget = localStoreDataSource.GetTarget(toolbarResource,currentSetResource,true);
if (currentSetTarget instanceof Ci.nsIRDFLiteral)
_getIdsFromCurrentset(currentSetTarget.Value);
}

}

}

return result;
}
,
get _defaultThemeActive() {
return Preferences.get("general.skins.selectedSkin") == "classic/1.0";
}
};
const LocalStoreData = {
get _RDFService() {
delete this._RDFService;
return this._RDFService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
}
,
get _dataSource() {
delete this._dataSource;
return this._dataSource = this._RDFService.GetDataSource("rdf:local-store");
}
,
getAllResources: function LocalStoreData_getAllResources() {
return this._dataSource.GetAllResources();
}
,
getRDFResource: function LocalStoreData_getRDFResource(aURIString) {
return this._RDFService.GetResource(aURIString);
}
,
getRDFLiteralValue: function LocalStoreData_getRDFLiteralValue(aSource, aProperty) {
var target = this._dataSource.GetTarget(aSource,aProperty,true);
if (target instanceof Ci.nsIRDFLiteral)
return target.Value;
return null;
}
,
setRDFLiteralValue: function LocalStoreData_setRDFLiteralValue(aSource, aProperty, aTarget) {
var oldTarget = this._dataSource.GetTarget(aSource,aProperty,true);
try {
if (oldTarget)
{
if (aTarget)
this._dataSource.Change(aSource,aProperty,oldTarget,this._RDFService.GetLiteral(aTarget)); else
this._dataSource.Unassert(aSource,aProperty,oldTarget);
}
 else
{
this._dataSource.Assert(aSource,aProperty,this._RDFService.GetLiteral(aTarget),true);
}

}
catch (e) {

}

}
,
getAttribute: function LocalStoreData_getAttribute(aURIString, aAttribute) {
var value;
var elementResource = this.getRDFResource(aURIString);
var attributeResource = this.getRDFResource(aAttribute);
try {
value = this.getRDFLiteralValue(elementResource,attributeResource);
}
catch (e) {
Cu.reportError(e);
}

return value;
}
,
setAttribute: function LocalStoreData_setAttribute(aURIString, aAttribute, aValue) {
var value = aValue;
if (value !== null)
value = value.toString();
var elementResource = this.getRDFResource(aURIString);
var attributeResource = this.getRDFResource(aAttribute);
try {
let currentValue = this.getRDFLiteralValue(elementResource,attributeResource);
if (currentValue === null)
{
if (value === null)
return;
}
 else
{
if (currentValue.toString() === value)
return;
}

this.setRDFLiteralValue(elementResource,attributeResource,value);
this.flush();
}
catch (e) {
Cu.reportError(e);
}

}
,
removeAttribute: function LocalStoreData_removeAttribute(aURIString, aAttribute) {
this.setAttribute(aURIString,aAttribute,null);
}
,
flush: function LocalStoreData_flush() {
this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
}
};
