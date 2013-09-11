"use strict";
XB._Parser = {
init: function XBParser_init() {
BarPlatform.registerUnitParser("xb","widget",XB._Parser.widgetProtoParser);
}
};
XB._Parser.widgetProtoParser = {
parseFromDoc: function XBWidgetParser_parseFromDoc(unitDoc, unit) {
if (! (unitDoc instanceof Ci.nsIDOMDocument))
throw new CustomErrors.EArgType("unitDoc", "nsIDOMDocument", unitDoc);
this._logger.debug("Parsing component from Unit " + unit.name);
if (unitDoc.documentElement.localName != this._consts.STR_WIDGET_ELEMENT_NAME)
throw new BarPlatform.Unit.EWidgetSyntax(unitDoc.documentElement.nodeName, this._consts.ERR_ROOT_NAME);
var widget = this._parseWidgetElement(unitDoc.documentElement,unit);
return widget;
}
,
serializeComponent: function XBWidgetParser_serializeComponent(widget, toFile) {
var logger = this._logger;
var cacheDoc = Cc["@mozilla.org/xml/xml-document;1"].createInstance(Ci.nsIDOMDocument).implementation.createDocument("","parsed-widget",null);
cacheDoc.documentElement.setAttribute("version",this._consts.CACHE_VERSION);
var dataElem = cacheDoc.documentElement.appendChild(cacheDoc.createElement("data"));
var xmlDataID = 0;
var importFailed = false;
const IPersistentProp = "persistentProperties";
function toJSON(persistent) {
if (persistent instanceof Ci.nsIDOMNode)
{
xmlDataID++;
let xmlData = dataElem.appendChild(cacheDoc.createElement("xbxml"));
xmlData.setAttribute("id",xmlDataID);
let xmlCopy;
try {
xmlCopy = cacheDoc.importNode(persistent,true);
}
catch (e) {
importFailed = true;
xmlCopy = xmlutils.recreateXML(persistent,cacheDoc,true);
}

xmlData.appendChild(xmlCopy);
return "<<XBXML:" + xmlDataID + ">>";
}

var constr = persistent.constructor;
var constrName = constr ? constr.name : "[NONE]";
if (constrName == "Object" || IPersistentProp in persistent.constructor)
{
let result = {
};
let props = persistent.constructor[IPersistentProp];
let describe = function (propValue) {
return propValue && typeof propValue == "object" ? toJSON(propValue) : propValue;
}
;
if (! props)
{
for(let propName in persistent) {
try {
result[propName] = describe(persistent[propName]);
}
catch (e) {
logger.error("Failed persisting " + propName + ". " + e);
break;
}

}

}
 else
{
for each(let propName in props) {
try {
result[propName] = describe(persistent[propName]);
}
catch (e) {
logger.error("Failed persisting " + propName + ". " + e);
break;
}

}

}

return result;
}
 else
if (constrName == "Array")
{
return persistent.map(toJSON);
}
 else
throw new Error("Can't persist complex object: " + constrName);
}

var strucElem = cacheDoc.documentElement.appendChild(cacheDoc.createElement("structure"));
var widgetStruc = toJSON(widget);
if (importFailed)
logger.warn("cacheDoc.importNode failed");
strucElem.appendChild(cacheDoc.createCDATASection(JSON.stringify(widgetStruc)));
fileutils.writeTextFile(toFile,xmlutils.serializeXML(cacheDoc));
}
,
deserializeComponent: function XBWidgetParser_deserializeComponent(unit, fromFile) {
var cacheDoc = fileutils.xmlDocFromFile(fromFile);
var docElement = cacheDoc.documentElement;
var cacheVersion = parseInt(docElement.getAttribute("version"),10);
if (cacheVersion != this._consts.CACHE_VERSION)
{
cacheDoc = null;
fileutils.removeFileSafe(fromFile);
throw new Error("Cache version missmatch");
}

var xmlData = xmlutils.queryXMLDoc("./data",docElement)[0];
var widgetStruc = JSON.parse(xmlutils.queryXMLDoc("string(./structure)",docElement));
return XB.WidgetPrototype.createFromPersistData(unit,widgetStruc,xmlData,cacheDoc);
}
,
extractCachedXML: function (descr, container) {
var idMatch = descr.match(/^<<XBXML:(\d+)>>$/);
if (! idMatch)
throw new Error("No XBXML ID match");
var xmlDataID = idMatch[1];
return xmlutils.queryXMLDoc("./xbxml[@id='" + xmlDataID + "']",container)[0].firstChild;
}
,
_consts: {
CACHE_VERSION: 1,
STR_WIDGET_ELEMENT_NAME: "widget",
STR_WIDGET_NAME_ATTR_NAME: "name",
STR_FUNC_PARAM_ELEM_NAME: "param",
STR_DEBUGMODE_ATTR_NAME: "__debug",
WARN_UNKNOWN_TOKEN: "Unknown token",
WARN_DUPLICATE_ARG: "Duplicate argument",
ERR_ROOT_NAME: "Widget unit root element name missmatch",
ERR_NO_WIDGET_NAME: "No widget name",
ERR_NO_DATA_NAME: "Unnamed data declaration",
ERR_NO_VAR_NAME: "Unnamed variable declaration",
ERR_NO_SETTING_NAME: "Unnamed setting",
ERR_INVALID_SCOPE: "Invalid scope definition",
ERR_VALNODE_AMBIGUITY: "Value node has both a value attribute and a child node(s)",
ERR_UNKNOWN_VALUE_TYPE: "Unknown value type",
ERR_NO_FUNCTION: "No such function",
ERR_NO_INC_FILE: "No include file"},
_nodeUID: 1,
get _logger() {
delete this._logger;
return this._logger = XB._base.getLogger("WParser");
}
,
_parseWidgetElement: function XBWidgetParser__parseWidgetElement(widgetElement, unit) {
var widgetName = widgetElement.getAttribute(this._consts.STR_WIDGET_NAME_ATTR_NAME);
if (! widgetName)
throw new BarPlatform.Unit.EWidgetSyntax(widgetElement.nodeName, this._consts.ERR_NO_WIDGET_NAME);
var thisPackage = unit.unitPackage;
var protoID = thisPackage.id + "#" + unit.name;
var unique = widgetElement.getAttribute("unique") != "false";
var iconPath = widgetElement.getAttribute("icon") || undefined;
var widgetProto = new XB.WidgetPrototype(protoID, widgetName, unique, iconPath, unit, widgetElement.ownerDocument);
this._parseTopChildren(widgetProto,widgetElement,unit);
return widgetProto;
}
,
_parseTopChildren: function XBWidgetParser__parseTopChildren(widgetProto, DOMNode, unit) {
var treeWalker = DOMNode.ownerDocument.createTreeWalker(DOMNode,Ci.nsIDOMNodeFilter.SHOW_ALL,this._nodeFilter,true);
if (treeWalker.firstChild())
{
do {
let subNode = treeWalker.currentNode;
if (subNode.namespaceURI == XB._base.consts.STR_FUNCTIONAL_NS)
{
switch (subNode.localName) {
case "data":
this._parseWidgetData(widgetProto,treeWalker);
break;
case "variable":
this._parseWidgetVar(widgetProto,treeWalker);
break;
case "setting":
this._parseWidgetSetting(widgetProto,treeWalker);
break;
case "include":
this._includeFile(widgetProto,treeWalker.currentNode,unit.unitPackage);
break;
default:
let valRef = this._createFunctionRef(treeWalker,widgetProto);
widgetProto.addContentNode(valRef);
}

}
 else
{
widgetProto.addContentNode(subNode);
this._parseElement(treeWalker,null,widgetProto);
}

}
 while (treeWalker.nextSibling());
}

}
,
_includeFile: function XBWidgetParser__includeFile(widgetProto, incNode, package_) {
var filePath = incNode.getAttribute("file");
var incFile = package_.findFile(filePath);
if (! incFile)
throw new BarPlatform.Unit.EWidgetSyntax(incNode.nodeName, this._consts.ERR_NO_INC_FILE + " " + filePath);
var incDoc = fileutils.xmlDocFromFile(incFile);
this._parseTopChildren(widgetProto,incDoc.documentElement);
}
,
_parseWidgetData: function XBWidgetParser__parseWidgetData(parentWidget, treeWalker) {
var dataNode = treeWalker.currentNode;
var dataName = dataNode.getAttribute("name");
if (! dataName)
throw new BarPlatform.Unit.EWidgetSyntax(dataNode.nodeName, this._consts.ERR_NO_DATA_NAME);
var nodeID = this._genNodeUID();
var calcNode = new XB._calcNodes.FuncNodeProto(nodeID, "Data");
calcNode.debugMode = dataNode.hasAttribute(this._consts.STR_DEBUGMODE_ATTR_NAME);
this._parseElement(treeWalker,calcNode,parentWidget);
parentWidget.registerData(dataName,calcNode);
}
,
_parseWidgetVar: function XBWidgetParser__parseWidgetVar(parentWidget, treeWalker) {
var varNode = treeWalker.currentNode;
var varName = varNode.getAttribute("name");
if (! varName)
throw new BarPlatform.Unit.EWidgetSyntax(varNode.nodeName, this._consts.ERR_NO_VAR_NAME);
var initialValue = varNode.getAttribute("default") || XB.types.empty;
var varScope;
try {
varScope = BarPlatform.Unit.evalScope(varNode.getAttribute("scope") || undefined,BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET);
}
catch (e) {
throw new BarPlatform.Unit.EWidgetSyntax(varNode.nodeName, this._consts.ERR_INVALID_SCOPE);
}

var persist = varNode.getAttribute("persist") == "true";
parentWidget.registerVariable(varName,varScope,persist,initialValue);
}
,
_parseWidgetSetting: function XBWidgetParser__parseWidgetSetting(parentWidget, treeWalker) {
var settingNode = treeWalker.currentNode;
var settingData = BarPlatform.Unit.parseSetting(settingNode,BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET);
parentWidget.registerSetting(settingData.name,settingData.scope,settingData.defaultValue,settingData.type,settingData.controlElement);
}
,
_parseElement: function XBWidgetParser__parseElement(treeWalker, parentCalcNode, parentWidget) {
var calcNodeArgs = [];
var currElement = treeWalker.currentNode;
if (treeWalker.firstChild())
{
try {
do {
let temp = treeWalker.currentNode;
let nextSibling = treeWalker.nextSibling();
treeWalker.currentNode = temp;
if (parentCalcNode == null)
{
if (treeWalker.currentNode.namespaceURI != XB._base.consts.STR_FUNCTIONAL_NS)
{
this._parseElement(treeWalker,null,parentWidget);
}
 else
{
this._createFunctionRef(treeWalker,parentWidget);
}

}
 else
{
let argInfo = this._handleFunctionSubNode(treeWalker,parentWidget);
calcNodeArgs.push(argInfo);
}

if (! nextSibling)
break;
treeWalker.currentNode = nextSibling;
}
 while (true);
}
 finally {
treeWalker.currentNode = currElement;
}

}

if (parentCalcNode != null)
{
let unnamedArgs = [];
for each(let argInfo in calcNodeArgs) {
if (argInfo.name)
{
if (! parentCalcNode.argumentAttached(argInfo.name))
parentCalcNode.attachArgument(argInfo.name,argInfo.calcNode); else
this._logger.warn(this._consts.WARN_DUPLICATE_ARG + " '" + argInfo.name + "'");
}
 else
unnamedArgs.push(argInfo);
}

for each(let argInfo in unnamedArgs) {
argInfo.name = parentCalcNode.proposeArgName();
parentCalcNode.attachArgument(argInfo.name,argInfo.calcNode);
}

}

}
,
_createFunctionRef: function XBWidgetParser__createFuncRef(treeWalker, parentWidget) {
var srcXMLNode = treeWalker.currentNode;
var calcNode;
if (srcXMLNode.localName == "value")
{
calcNode = this._createValNode(srcXMLNode);
}
 else
{
let funcName = srcXMLNode.localName;
let calcNodeConstructor = XB._functions["CN_" + funcName];
if (! (XB._calcNodes.FuncNode.ancestorOf(calcNodeConstructor) || XB._calcNodes.ProcNode.ancestorOf(calcNodeConstructor)))
throw new BarPlatform.Unit.EWidgetSyntax(srcXMLNode.nodeName, this._consts.ERR_NO_FUNCTION);
calcNode = new XB._calcNodes.FuncNodeProto(this._genNodeUID(), funcName);
}

var refID = calcNode.baseID;
parentWidget.registerReference(refID,calcNode);
var valRefElement = srcXMLNode.ownerDocument.createElementNS(XB._base.consts.STR_UI_NS,XB._base.consts.STR_VAL_REF_ELEM_NAME);
valRefElement.setAttribute(XB._base.consts.STR_VAL_REF_ID_KEY_NAME,refID);
srcXMLNode.parentNode.replaceChild(valRefElement,srcXMLNode);
try {
if (! (calcNode instanceof XB._calcNodes.ConstNodeProto))
{
this._parseFuncNodeAttributes(srcXMLNode.attributes,calcNode);
this._parseElement(treeWalker,calcNode,parentWidget);
}

}
 finally {
treeWalker.currentNode = valRefElement;
}

return valRefElement;
}
,
_handleFunctionSubNode: function XBWidgetParser__handleFuncSubNode(treeWalker, parentWidget) {
var calcNode;
var argName;
var argXMLNode = treeWalker.currentNode;
if (argXMLNode.nodeType == argXMLNode.ELEMENT_NODE && argXMLNode.localName == this._consts.STR_FUNC_PARAM_ELEM_NAME && argXMLNode.namespaceURI == XB._base.consts.STR_FUNCTIONAL_NS)
{
argName = argXMLNode.getAttribute("name") || undefined;
let argsLen = 0;
let currNode = treeWalker.currentNode;
if (treeWalker.firstChild())
{
try {
do {
argsLen++;
}
 while (treeWalker.nextSibling());
if (argsLen == 1)
calcNode = this._handleArgumentNode(treeWalker,parentWidget);
}
 finally {
treeWalker.currentNode = currNode;
}

}

if (argsLen > 1)
{
let nodeID = this._genNodeUID();
calcNode = new XB._calcNodes.FuncNodeProto(nodeID, "concat");
this._parseElement(treeWalker,calcNode,parentWidget);
}
 else
if (argsLen == 0)
calcNode = new XB._calcNodes.ConstNodeProto(this._genNodeUID(), "");
}
 else
{
calcNode = this._handleArgumentNode(treeWalker,parentWidget);
}

return {
name: argName,
calcNode: calcNode};
}
,
_handleArgumentNode: function XBWidgetParser__handleArgNode(treeWalker, parentWidget) {
var calcNode;
var argXMLNode = treeWalker.currentNode;
if (argXMLNode.nodeType == argXMLNode.ELEMENT_NODE && argXMLNode.namespaceURI == XB._base.consts.STR_FUNCTIONAL_NS)
{
if (argXMLNode.localName == "value")
{
calcNode = this._createValNode(argXMLNode);
}
 else
{
let funcName = argXMLNode.localName;
let calcNodeConstructor = XB._functions["CN_" + funcName];
if (! (XB._calcNodes.FuncNode.ancestorOf(calcNodeConstructor) || XB._calcNodes.ProcNode.ancestorOf(calcNodeConstructor)))
throw new BarPlatform.Unit.EWidgetSyntax(argXMLNode.nodeName, this._consts.ERR_NO_FUNCTION);
calcNode = new XB._calcNodes.FuncNodeProto(this._genNodeUID(), funcName);
this._parseFuncNodeAttributes(argXMLNode.attributes,calcNode);
this._parseElement(treeWalker,calcNode,parentWidget);
}

}
 else
{
if (argXMLNode.nodeType == argXMLNode.TEXT_NODE)
{
let text = strutils.trimSpaces(argXMLNode.nodeValue);
calcNode = new XB._calcNodes.ConstNodeProto(this._genNodeUID(), text);
}
 else
{
this._parseElement(treeWalker,null,parentWidget);
let xbXML = new XB.types.XML(argXMLNode.ownerDocument, []);
xbXML.appendChild(argXMLNode);
calcNode = new XB._calcNodes.ConstNodeProto(this._genNodeUID(), xbXML);
}

}

return calcNode;
}
,
_parseFuncNodeAttributes: function XBWidgetParser__parseFuncNodeAttrs(attrsNodeMap, calcNode) {
for (let attrIdx = 0, len = attrsNodeMap.length;attrIdx < len;attrIdx++) {
let attrNode = attrsNodeMap.item(attrIdx);
let argName = attrNode.localName;
if (argName == this._consts.STR_DEBUGMODE_ATTR_NAME)
{
calcNode.debugMode = true;
continue;
}

let arg;
let text = attrNode.value;
let match = text.match(/^\$(.+)$/);
if (match)
{
let refName = match[1];
let refNameNode = new XB._calcNodes.ConstNodeProto(this._genNodeUID(), refName);
arg = new XB._calcNodes.FuncNodeProto(this._genNodeUID(), "value-of");
arg.attachArgument("name",refNameNode);
}
 else
{
arg = new XB._calcNodes.ConstNodeProto(this._genNodeUID(), text);
}

if (! calcNode.argumentAttached(argName))
calcNode.attachArgument(argName,arg); else
this._logger.warn(this._consts.WARN_DUPLICATE_ARG + " '" + argName + "'");
}

}
,
_createValNode: function XBWidgetParser__createValNode(srcXMLNode) {
if (srcXMLNode.hasAttribute("value") && srcXMLNode.hasChildNodes())
throw new BarPlatform.Unit.EWidgetSyntax(srcXMLNode.nodeName, this._consts.ERR_VALNODE_AMBIGUITY);
var valueType = srcXMLNode.getAttribute("type") || "string";
var raw;
if (valueType == "xml")
{
raw = srcXMLNode.childNodes;
}
 else
{
if (srcXMLNode.hasAttribute("value"))
{
raw = srcXMLNode.getAttribute("value");
}
 else
{
raw = srcXMLNode.getAttribute("xml:space") == "preserve" ? srcXMLNode.textContent : strutils.trimSpaces(srcXMLNode.textContent);
}

}

var val;
switch (valueType) {
case "string":
val = raw;
break;
case "xml":
val = new XB.types.XML(srcXMLNode.ownerDocument, []);
while (raw.length) val.appendChild(raw.item(0));
break;
case "number":
val = XB.types.xToNumber(raw);
break;
case "bool":
val = XB.types.xToBool(raw);
break;
case "empty":
val = XB.types.empty;
break;
default:
throw new BarPlatform.Unit.EWidgetSyntax(srcXMLNode.nodeName, this._consts.ERR_UNKNOWN_VALUE_TYPE);
}

return new XB._calcNodes.ConstNodeProto(this._genNodeUID(), val);
}
,
_genNodeUID: function XBWidgetParser__genNodeUID() {
return this._nodeUID++;
}
,
_nodeFilter: {
acceptNode: function XBWidgetParser__acceptNode(node) {
if (node.nodeType == node.COMMENT_NODE || node.nodeType == node.TEXT_NODE && ! this._emptyTextRE.test(node.nodeValue))
return Ci.nsIDOMNodeFilter.FILTER_REJECT;
return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
}
,
_emptyTextRE: /[^\t\n\r ]/}};
