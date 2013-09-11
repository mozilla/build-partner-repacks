"use strict";
BarPlatform.Preset = Base.extend({
constructor: function Preset_constructor(content, address) {
this._packageIDs = {
};
this._compEntries = [];
if (address !== undefined)
{
this._baseURI = netutils.ioService.newURI(address,null,null);
this._address = address;
}

var loggerName = this._baseURI ? this._baseURI.QueryInterface(Ci.nsIURL).fileBaseName : "?";
this._logger = BarPlatform._getLogger("Preset." + loggerName);
try {
if (content instanceof Ci.nsIFile)
{
this._loadFromFile(content);
}
 else
if (content instanceof Ci.nsIDOMDocument)
{
this._loadFromDocument(content);
}
 else
throw new CustomErrors.EArgType("content", "nsIFile|nsIDOMDocument", typeof content);
}
catch (e) {
throw new Error("Can not parse preset document from [" + address + "] \n" + strutils.formatError(e));
}

}
,
get address() {
return this._address;
}
,
get name() {
return this._name;
}
,
get version() {
return this._version;
}
,
get formatVersion() {
return this._formatVersion;
}
,
set formatVersion(verStr) {
this._originalDocument.documentElement.setAttribute("format-version",String(verStr));
}
,
get author() {
return this._author;
}
,
get icon() {
return this._icon;
}
,
get url() {
return this._url;
}
,
get updateMode() {
return this._updateMode;
}
,
get packageIDs() {
return sysutils.copyObj(this._packageIDs);
}
,
get widgetIDs() {
return sysutils.copyObj(this._widgetIDs);
}
,
get pluginIDs() {
return sysutils.copyObj(this._pluginIDs);
}
,
get componentIDs() {
return sysutils.mergeObj(this._widgetIDs,this._pluginIDs);
}
,
get importantComponentIDs() {
function isImportantEntryF(compID, compEntry) compEntry.isImportant
var result = {
};
sysutils.copyProperties(this._widgetIDs,result,isImportantEntryF);
sysutils.copyProperties(this._pluginIDs,result,isImportantEntryF);
return result;
}
,
refsPackage: function Preset_refsPackage(packageID) {
return packageID in this._packageIDs;
}
,
refsWidget: function Preset_refsWidget(widgetID) {
return widgetID in this._widgetIDs;
}
,
refsPlugin: function Preset_refsPlugin(pluginID) {
return pluginID in this._pluginIDs;
}
,
get widgetEntries() {
return sysutils.copyObj(this._widgetEntries,false);
}
,
get visibleWidgetEntries() {
return this.widgetEntries.filter(function passVisible(widgetEntry) widgetEntry.enabled == widgetEntry.ENABLED_YES);
}
,
get pluginEntries() {
return sysutils.copyObj(this._pluginEntries,false);
}
,
get allEntries() {
return sysutils.copyObj(this._compEntries,false);
}
,
appendEntry: function Preset_appendEntry(entryDescr) {
var componentEntry = new BarPlatform.Preset.ComponentEntry(entryDescr);
this._compEntries.push(componentEntry);
this._packageIDs[componentEntry.packageID] = undefined;
if (componentEntry.componentType == componentEntry.TYPE_WIDGET)
{
delete this._widgetEntries;
this._widgetIDs[componentEntry.componentID] = componentEntry;
}
 else
{
delete this._pluginEntries;
this._pluginIDs[componentEntry.componentID] = componentEntry;
}

this._originalDocument.documentElement.appendChild(this._createEntryElement(componentEntry));
}
,
saveToFile: function Preset_saveToFile(destFile) {
fileutils.xmlDocToFile(this._originalDocument,destFile);
}
,
_consts: {
UPDMODE_ATTR_NAME: "update-mode",
DEF_UPDMODE: "default",
STR_PRESET_ELEMENT_NAME: "preset",
ERR_NO_COMP_ID: "No component ID"},
_updateModes: {
"default": 0,
"silent": 2,
"reset": 3,
"soft-reset": 4,
"reorder": 5},
_address: undefined,
_baseURI: null,
_author: undefined,
_name: undefined,
_version: "1.0",
_formatVersion: "1.0",
_icon: undefined,
_updateMode: undefined,
_packageIDs: null,
_compEntries: undefined,
get _widgetEntries() {
var widgetEntries = this._compEntries.filter(function passWidgets(compEntry) compEntry.componentType == compEntry.TYPE_WIDGET);
this.__defineGetter__("_widgetEntries",function () widgetEntries);
return this._widgetEntries;
}
,
get _pluginEntries() {
var pluginEntries = this._compEntries.filter(function passPlugins(compEntry) compEntry.componentType == compEntry.TYPE_PLUGIN);
this.__defineGetter__("_pluginEntries",function () pluginEntries);
return this._pluginEntries;
}
,
get _widgetIDs() {
var widgetIDs = {
};
for each(let entry in this._widgetEntries) widgetIDs[entry.componentID] = entry;
this.__defineGetter__("_widgetIDs",function () widgetIDs);
return this._widgetIDs;
}
,
get _pluginIDs() {
var pluginIDs = {
};
for each(let entry in this._pluginEntries) pluginIDs[entry.componentID] = entry;
this.__defineGetter__("_pluginIDs",function () pluginIDs);
return this._pluginIDs;
}
,
_loadFromFile: function Preset__loadFromFile(presetFile) {
this._loadFromDocument(fileutils.xmlDocFromFile(presetFile));
}
,
_loadFromDocument: function Preset__loadFromDocument(XMLDocument) {
var rootName = XMLDocument.documentElement.localName;
if (rootName != this._consts.STR_PRESET_ELEMENT_NAME)
throw new BarPlatform.Preset.EPresetSyntax(rootName, "Wrong root element name");
this._parsePreset(XMLDocument.documentElement);
this._originalDocument = XMLDocument;
}
,
_parsePreset: function Preset__parsePreset(presetElement) {
this._version = presetElement.getAttribute("version") || "1.0";
this._formatVersion = presetElement.getAttribute("format-version") || "1.0";
var updateMode = presetElement.hasAttribute(this._consts.UPDMODE_ATTR_NAME) ? presetElement.getAttribute(this._consts.UPDMODE_ATTR_NAME) : this._consts.DEF_UPDMODE;
if (! (updateMode in this._updateModes))
{
this._logger.warn("Invalid update mode: '" + updateMode + "'. Will use 'default'.");
updateMode = this._consts.DEF_UPDMODE;
}

this._updateMode = updateMode;
var appLang = misc.parseLocale(barApp.localeString).language;
var urlNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./url",presetElement));
this._url = urlNode ? urlNode.textContent : undefined;
if (! this._baseURI)
{
try {
this._baseURI = netutils.ioService.newURI(this._url,null,null);
}
catch (e) {
this._logger.warn("Preset URL in the <url> node is malformed.");
}

}

var authorNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./author",presetElement));
if (! authorNode)
throw new BarPlatform.Preset.EPresetSyntax("preset", "Missing 'author' element");
this._author = authorNode.textContent;
var nameNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./name",presetElement));
if (! nameNode)
throw new BarPlatform.Preset.EPresetSyntax("preset", "Missing 'name' element");
this._name = nameNode.textContent;
var iconNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./icon",presetElement));
var iconRelPath = strutils.trimSpaces(iconNode && iconNode.textContent);
this._icon = iconRelPath && this._baseURI ? netutils.resolveRelativeURL(iconRelPath,this._baseURI) : iconRelPath;
var compElements = xmlutils.queryXMLDoc("(.|./firefox)/widget|(.|./firefox)/plugin",presetElement);
for each(let compElement in compElements) {
let compEntry = new BarPlatform.Preset.ComponentEntry(compElement, this._baseURI);
this._packageIDs[compEntry.packageID] = undefined;
this._compEntries.push(compEntry);
}

}
,
_createEntryElement: function Preset__createEntryElement(componentEntry) {
var isWidget = componentEntry.componentType == componentEntry.TYPE_WIDGET;
var compElemName = isWidget ? "widget" : "plugin";
var entryElement = this._originalDocument.createElement(compElemName);
entryElement.setAttribute("id",componentEntry.componentID);
if (componentEntry.enabled != componentEntry.ENABLED_YES)
entryElement.setAttribute(isWidget ? "visible" : "enabled",componentEntry.enabled);
if (componentEntry.isImportant)
entryElement.setAttribute("important","true");
if (componentEntry.settingsMap)
{
for each(let [settingName, settingValue] in Iterator(componentEntry.settingsMap)) {
let settingElement = this._originalDocument.createElement("setting");
settingElement.setAttribute("name",settingName);
settingElement.appendChild(this._originalDocument.createTextNode(settingValue));
entryElement.appendChild(settingElement);
}

}

return entryElement;
}
});
BarPlatform.Preset.ComponentEntry = function PresetComponentEntry(entrySource, presetURI) {
if (presetURI && ! (presetURI instanceof Ci.nsIURI))
throw new CustomErrors.EArgType("presetURI", "nsIURI", presetURI);
this._presetURI = presetURI;
var loggerName = this._presetURI ? this._presetURI.QueryInterface(Ci.nsIURL).fileBaseName : "?";
this._logger = BarPlatform._getLogger("Preset." + loggerName);
if (entrySource instanceof Ci.nsIDOMElement)
{
this._createFromDOMElement(entrySource);
}
 else
if (sysutils.isObject(entrySource))
{
this._createFromObject(entrySource);
}
 else
throw new CustomErrors.EArgType("entrySource", "nsIDOMElement or Object", entrySource);
}
;
BarPlatform.Preset.ComponentEntry.prototype = {
constructor: BarPlatform.Preset.ComponentEntry,
get componentType() this._type,
get TYPE_WIDGET() "widget",
get TYPE_PLUGIN() "plugin",
get componentID() this._componentID,
get packageID() this._packageID,
get name() this._name,
get enabled() this._enabled,
get ENABLED_NO() "false",
get ENABLED_YES() "true",
get ENABLED_AUTO() "auto",
set enabled(newVal) {
if (this._enabled == newVal)
return;
if (newVal != this.ENABLED_AUTO && newVal != this.ENABLED_YES && newVal != this.ENABLED_NO)
throw new CustomErrors.EArgRange("enabled", "ENABLED_NO or ENABLED_YES or ENABLED_AUTO", enabled);
if (this._srcElement)
this._srcElement.setAttribute(this._type == this.TYPE_WIDGET ? "visible" : "enabled",newVal);
this._enabled = newVal;
}
,
get isImportant() this._isImportant,
get settings() {
return sysutils.copyObj(this._settings);
}
,
get forcedSettings() {
return sysutils.copyObj(this._forcedSettings);
}
,
toSimpleObject: function ComponentEntry_toSimpleObject() {
return {
componentType: this.componentType,
componentID: this.componentID,
enabled: this.enabled,
isImportant: this.isImportant,
settings: sysutils.copyObj(this.settings),
forcedSettings: sysutils.copyObj(this.forcedSettings)};
}
,
_isImportant: false,
_createFromDOMElement: function ComponentEntry__createFromDOMElement(srcElement) {
var compElemName = srcElement.localName;
if (compElemName == "widget")
this._type = this.TYPE_WIDGET; else
if (compElemName == "plugin")
this._type = this.TYPE_PLUGIN; else
throw new BarPlatform.Preset.EPresetSyntax(compElemName, "Unknown component type");
var compID = srcElement.getAttribute("id");
if (! compID)
throw new BarPlatform.Preset.EPresetSyntax(srcElement.localName, "Missing 'id' attribute");
if (this._presetURI)
{
compID = netutils.resolveRelativeURL(compID,this._presetURI);
}

this._componentID = compID;
[this._packageID, this._name] = BarPlatform.parseComponentID(this._componentID);
var enabledAttrVal = srcElement.getAttribute(this._type == this.TYPE_WIDGET ? "visible" : "enabled");
if (enabledAttrVal === null || enabledAttrVal == "true")
this._enabled = this.ENABLED_YES; else
if (enabledAttrVal == "auto")
this._enabled = this.ENABLED_AUTO; else
this._enabled = this.ENABLED_NO;
this._isImportant = srcElement.getAttribute("important") === "true";
[this._settings, this._forcedSettings] = this._parseSettings(srcElement);
this._srcElement = srcElement;
}
,
_createFromObject: function ComponentEntry__createFromObject({componentType: componentType, componentID: componentID, enabled: enabled, isImportant: isImportant, settings: settings, forcedSettings: forcedSettings}) {
if (componentType != this.TYPE_WIDGET && componentType != this.TYPE_PLUGIN)
throw new CustomErrors.EArgRange("componentType", "TYPE_WIDGET or TYPE_PLUGIN", componentType);
this._type = componentType;
var [packageID, compName] = BarPlatform.parseComponentID(componentID);
this._componentID = componentID;
this._packageID = packageID;
this._name = compName;
if (enabled != this.ENABLED_NO && enabled != this.ENABLED_YES && enabled != this.ENABLED_AUTO)
throw new CustomErrors.EArgRange("enabled", "ENABLED_NO or ENABLED_YES or ENABLED_AUTO", enabled);
this._enabled = enabled;
this._isImportant = ! ! isImportant;
if (settings !== undefined && typeof settings != "object")
throw new CustomErrors.EArgType("settings", "object", settings);
this._settings = sysutils.copyObj(settings) || {
};
if (forcedSettings !== undefined && typeof forcedSettings != "object")
throw new CustomErrors.EArgType("forcedSettings", "object", forcedSettings);
this._forcedSettings = sysutils.copyObj(forcedSettings);
}
,
_parseSettings: function ComponentEntry__parseSettings(srcElement) {
var settingElements = Object.create(null);
for (let settingIndex = srcElement.childNodes.length;settingIndex--;) {
let settingElement = srcElement.childNodes[settingIndex];
if (settingElement.nodeType != settingElement.ELEMENT_NODE || settingElement.localName != "setting")
{
continue;
}

let settingName = settingElement.getAttribute("name");
if (! settingName)
{
this._logger.warn("Widget setting was ignored because of syntax errors");
continue;
}

if (! (settingName in settingElements))
settingElements[settingName] = [];
settingElements[settingName].push(settingElement);
}

var settings = {
};
var forcedSettings = {
};
for(let name in settingElements) {
let settingElement = BarPlatform.findBestLocalizedElement(settingElements[name]);
let settingValue = settingElement.textContent;
settings[name] = settingValue;
let forceVal = settingElement.getAttribute("force");
if (strutils.xmlAttrToBool(forceVal))
forcedSettings[name] = settingValue;
}

return [settings, forcedSettings];
}
};
BarPlatform.Preset.EPresetSyntax = CustomErrors.ECustom.extend({
$name: "EPresetSyntax",
constructor: function EPresetSyntax(elementName, explanation) {
this.base("Preset parse error");
this._elementName = elementName.toString();
this._explanation = explanation.toString();
}
,
get _details() {
return [this._elementName, this._explanation];
}
,
_elementName: undefined,
_explanation: undefined});
