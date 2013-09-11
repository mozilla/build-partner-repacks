"use strict";
XB.types = {
isXML: function XBRuntime_isXML(xVal) {
return xVal instanceof this.XML;
}
,
isException: function XBRuntime_isException(xVal) {
return xVal instanceof this.Exception;
}
,
isResDescriptor: function XBRuntime_isResDescriptor(xVal) {
return xVal instanceof this.ResDescriptor;
}
,
ensureValueTypeIs: function XBTypes_ensureValueTypeIs(xValue, xType) {
var expectedRank = this._ranksMap[xType];
if (expectedRank === undefined)
throw new Error(this._consts.ERR_UNKNOWN_TYPE + xType);
var valueRank = this.rankValue(xValue);
if (expectedRank != valueRank)
throw new TypeError(xType + " expected, got " + this._typeNames[valueRank]);
}
,
describeValue: function XBRuntime_describeValue(xValue) {
var valueRank = this.rankValue(xValue);
var descr = this._typeNames[valueRank];
if (valueRank > this._ranksMap.Empty && valueRank < this._ranksMap.XML)
descr += "(" + this.xToString(xValue) + ")";
if (valueRank == this._ranksMap.Exception)
descr += "(" + xValue.toString() + ")";
return descr;
}
,
rankValue: function XBRuntime__rankValue(value) {
if (value === XB.types.empty)
return this._ranksMap.Empty;
if (typeof value == "boolean")
return this._ranksMap.Bool;
if (sysutils.isNumber(value))
return this._ranksMap.Number;
if (typeof value == "string")
return this._ranksMap.String;
if (this.isXML(value))
return this._ranksMap.XML;
if (this.isResDescriptor(value))
return this._ranksMap.ResDescriptor;
if (this.isException(value))
return this._ranksMap.Exception;
throw new TypeError(this._consts.ERR_UNKNOWN_TYPE + typeof value);
}
,
xToString: function XBRuntime_xToString(fromXVal, ownerWidget) {
if (typeof fromXVal == "string")
return fromXVal;
if (fromXVal == undefined || fromXVal == XB.types.empty)
return "";
if (this.isXML(fromXVal))
return fromXVal.textContent;
if (this.isResDescriptor(fromXVal))
return fromXVal.url;
if (this.isException(fromXVal))
throw new this.ETypeCast(this.describeValue(fromXVal), "String");
return fromXVal.toString();
}
,
xToNumber: function XBRuntime_xToNumber(fromXVal, ownerWidget) {
if (sysutils.isNumber(fromXVal))
{
if (isNaN(fromXVal))
throw new this.ETypeCast(this.describeValue(fromXVal), "Number");
return fromXVal;
}

if (this.isException(fromXVal))
throw new this.ETypeCast(this.describeValue(fromXVal), "Number");
if (typeof fromXVal == "boolean")
return Number(fromXVal);
var trimmedStrVal = this.xToString(fromXVal).trim();
if (! trimmedStrVal)
return 0;
if (! this._numPattern.test(trimmedStrVal))
throw new this.ETypeCast(this.describeValue(fromXVal), "Number");
var num = parseFloat(trimmedStrVal);
if (isNaN(num))
throw new this.ETypeCast(this.describeValue(fromXVal), "Number");
return num;
}
,
xToBool: function XBRuntime_xToBool(fromXVal, ownerWidget) {
if (typeof fromXVal == "boolean")
return fromXVal;
if (sysutils.isNumber(fromXVal))
return fromXVal != 0;
if (this.isException(fromXVal))
throw new this.ETypeCast(this.describeValue(fromXVal), "Bool");
var strVal = strutils.trimSpaces(this.xToString(fromXVal));
if (strVal == "" || strVal == "false")
return false;
if (this._numPattern.test(strVal))
{
let numVal = Number(strVal);
if (! isNaN(numVal))
return numVal != 0;
}

return true;
}
,
xToXML: function XBRuntime_xToXML(fromXVal, ownerWidget) {
if (this.isXML(fromXVal))
return fromXVal;
var destDoc = ownerWidget.prototype.runtimeXMLDoc;
return new XB.types.XML(destDoc, destDoc.createTextNode(this.xToString(fromXVal)));
}
,
xToResDescriptor: function XBRuntime_xToResDescriptor(fromXVal, ownerWidget) {
if (this.isResDescriptor(fromXVal))
return fromXVal;
return this.makeResDescriptor({
url: this.xToString(fromXVal),
method: "GET",
updateInterval: this._consts.SECONDS_IN_MONTH,
expireInterval: this._consts.SECONDS_IN_MONTH * 2,
format: XB.types.ResDescriptor.Format.FMT_XML,
validStatusRange: {
start: 100,
end: 399}},ownerWidget);
}
,
makeResDescriptor: function XBRuntime_makeResDescriptor(params, ownerWidget) {
var addrScheme = netutils.ioService.extractScheme(params.url);
if (addrScheme !== "http" && addrScheme !== "https")
throw new CustomErrors.ESecurityViolation("XB:request", "URL scheme is " + addrScheme);
if (params.updateInterval < XB._functions.CN_request.MIN_INTERVAL)
throw new CustomErrors.EArgRange("update", XB._functions.CN_request.MIN_INTERVAL + "+", params.updateInterval);
var accessLevel = ownerWidget.prototype.unit.unitPackage.permissions.accessLevelForURL(params.url);
if (accessLevel === "none")
throw new CustomErrors.ESecurityViolation("XB:request", "Request to [" + url + "] is not permitted");
return new XB.types.ResDescriptor(params);
}
,
makeXML: function XBRuntime_makeXML(xmlJson, destDoc) {
const DOMImpl = this._DOM_IMPL;
function makeElement(elementJson, asDoc) {
var element;
if (! asDoc)
element = destDoc.createElement(elementJson.name); else
{
destDoc = DOMImpl.createDocument("",elementJson.name,null);
element = destDoc.documentElement;
}

for(let attrName in elementJson.attributes) element.setAttribute(attrName,elementJson.attributes[attrName]);
makeXML_append(elementJson.children,element);
return asDoc ? destDoc : element;
}

function makeXML_append(children, parent) {
for each(let elementJson in children) parent.appendChild(makeElement(elementJson));
}

if (! Array.isArray(xmlJson))
return new XB.types.XML(makeElement(xmlJson,true));
var result = new XB.types.XML(destDoc, []);
makeXML_append(xmlJson,result);
return result;
}
,
createXBExceptionFromRTError: function XBRuntime_XBEFromRTE(nid, error) {
var XBE = new XB.types.Exception(nid, XB.types.Exception.types.E_RUNTIME, error.message);
XBE.name = error.name;
XBE.fileName = error.fileName;
XBE.lineNumber = error.lineNumber;
XBE.original = error;
return XBE;
}
,
compareValues: function XBRuntime_compareValues(left, right, mode, ownerWidget, castFails) {
if (left === right)
return 0;
var commonRank = this._findCommonRank(left,right,mode,castFails);
try {
var value1 = this._castToRank(left,commonRank,ownerWidget);
var value2 = this._castToRank(right,commonRank,ownerWidget);
}
catch (e) {
if (castFails)
throw e;
commonRank = NaN;
}

var ranksMap = this._ranksMap;
switch (commonRank) {
case ranksMap.Empty:
return 0;
case ranksMap.Bool:
return Number(value1) - Number(value2);
case ranksMap.Number:
return value1 - value2;
case ranksMap.String:
return strutils.compareStrings(value1,value2);
case ranksMap.XML:

case ranksMap.ResDescriptor:

case ranksMap.Exception:
return value1.equalsTo(value2) ? 0 : NaN;
default:
return NaN;
}

}
,
cmpModes: {
CMP_STRICT: 0,
CMP_FREE: 1,
CMP_SMART: 2},
_consts: {
ERR_XPATH_QUERY_FAILED: "XPATH query '%1' failed. %2",
ERR_UNKNOWN_TYPE: "Unknown type: ",
ERR_NO_CAST_FUNC: "No casting function for this rank",
SECONDS_IN_MONTH: 60 * 60 * 24 * 30},
_DOM_IMPL: Cc["@mozilla.org/xml/xml-document;1"].createInstance(Ci.nsIDOMDocument).implementation,
_numPattern: /^[+\-]?(\d+\.?|\d*\.\d+)$/,
_typeNames: {
0: "Empty",
1: "Bool",
2: "Number",
3: "String",
4: "XML",
5: "ResDescriptor",
6: "Exception"},
_ranksMap: {
Empty: 0,
Bool: 1,
Number: 2,
String: 3,
XML: 4,
ResDescriptor: 5,
Exception: 6},
_castToRank: function XBRuntime__castToRank(value, rank, ownerWidget) {
var destType = this._typeNames[rank];
var castFunc = this["xTo" + destType];
if (castFunc == undefined)
throw new Error(this._consts.ERR_NO_CAST_FUNC);
return castFunc.call(this,value,ownerWidget);
}
,
_findCommonRank: function XBRuntime__findCommonRank(value1, value2, mode, castFails) {
var r1 = this.rankValue(value1);
var r2 = this.rankValue(value2);
if (r1 == r2)
return r1;
if (mode == this.cmpModes.CMP_STRICT || r1 > this._ranksMap.ResDescriptor || r2 > this._ranksMap.ResDescriptor)
return NaN;
var maxRank = Math.max(r1,r2);
var commonRank = mode == this.cmpModes.CMP_SMART ? Math.min(this._ranksMap.String,maxRank) : maxRank;
return commonRank;
}
};
XB.types.EXPATH = CustomErrors.ECustom.extend({
$name: "EXPATH",
constructor: function XBRuntimeEXPATH(expression) {
this.base();
this._expr = expression.toString();
}
,
_message: "XPATH query error",
_expr: undefined,
get _details() {
return [this._expr];
}
});
XB.types.EXPATHNaN = XB.types.EXPATH.extend({
$name: "EXPATHNaN",
_message: "XPATH 'number' expression returned NaN"});
XB.types.EXPATHUnexpectedResult = XB.types.EXPATH.extend({
$name: "EXPATHUnexpectedResult",
constructor: function XBRuntimeEXPATHUnexpReslt(expression, resultType) {
this.base(expression);
this._resType = resultType.toString();
}
,
_message: "XPATH query error",
_resType: undefined,
get _details() {
return [this._expr, this._resType];
}
});
XB.types.ETypeCast = CustomErrors.ECustom.extend({
$name: "ETypeCast",
constructor: function XBRuntimeETypeCast(origValueDescr, destTypeName) {
this.base();
this._origValueDescr = origValueDescr.toString();
this._destTypeName = destTypeName.toString();
}
,
_message: "This value conversion is impossible",
_origValueDescr: undefined,
_destTypeName: undefined,
get _details() {
return [this._origValueDescr, this._destTypeName];
}
});
XB.types.empty = null;
XB.types.XML = function XBXML(bufferDoc, _) {
if (! (bufferDoc instanceof Ci.nsIDOMDocument))
throw new CustomErrors.EArgType("bufferDoc", "nsIDOMDocument", bufferDoc);
this._bufferDoc = bufferDoc;
if (arguments.length == 1)
{
this._isADocument = true;
this._rootNode = bufferDoc.documentElement;
}
 else
{
this._initAsList();
this.appendNodes.apply(this,Array.slice(arguments,1));
}

}
;
XB.types.XML.persistentProperties = ["_valType", "_rootNode"];
XB.types.XML.prototype = {
constructor: XB.types.XML,
appendNodes: function XML_appendNodes() {
if (this._isADocument)
{
let oldRoot = this._rootNode;
this._initAsList();
this._rootNode.appendChild(oldRoot);
}

for (let argIndex = 0, argsLen = arguments.length;argIndex < argsLen;argIndex++) {
let arg = arguments[argIndex];
if (Array.isArray(arg))
{
this.appendNodes.apply(this,arg);
continue;
}

if (arg instanceof Ci.nsIDOMNode)
{
this._appendAnyNode(arg);
continue;
}

let isThisType = arg instanceof this.constructor;
if (arg instanceof Ci.nsIDOMNodeList || isThisType)
{
for (let nodeIndex = 0, nodesLen = arg.length;nodeIndex < nodesLen;nodeIndex++) {
this._appendAnyNode(arg.item(nodeIndex));
}

if (isThisType)
{
let argAttrs = arg.attributes;
for (let i = 0, len = argAttrs.length;i < len;i++) {
this._appendAnyNode(argAttrs.item(i));
}

}

continue;
}

throw new TypeError(XB._base.consts.ERR_DOM_NODES_EXPECTED);
}

}
,
addAttribute: function XML_addAttribute(ns, name, value) {
if (this.disposed)
throw new Error(XB._base.consts.ERR_DISPOSED_XML);
this._rootNode.setAttributeNS(ns,name,value);
}
,
toString: function XML_toString() {
var role = this._isADocument ? "document" : "nodes";
if (this.disposed)
return "[XBXML " + role + " (disposed)]";
return "[XBXML " + role + " length: " + this.length + ", content:\n" + strutils.trimSpaces(this.serialize().substr(0,800)) + "...\n]";
}
,
appendChild: function XML_appendChild(node) {
this._rootNode.appendChild(node);
}
,
item: function XML_item(at) {
if (! this._isADocument)
return this._rootNode.childNodes[at];
if (at > 0)
throw new RangeError("Document has only one root node");
return this._rootNode;
}
,
get attributes() {
if (this.disposed)
throw new Error(XB._base.consts.ERR_DISPOSED_XML);
return this._rootNode.attributes;
}
,
get childNodes() {
return this._rootNode.childNodes;
}
,
get length() {
if (this.disposed)
return 0;
if (this._isADocument)
return 1;
return this._rootNode.childNodes.length;
}
,
get disposed() {
return ! this._rootNode;
}
,
dispose: function XML_dispose() {
if (this._isADocument)
{
this._isADocument = false;
}
 else
{
if (this._frag)
this._frag.removeChild(this._rootNode);
this._frag = null;
}

if (this.disposed)
XB._base.logger.warn("Attemp to dispose an already disposed XML object."); else
{
if (XB._base.logger.level <= Log4Moz.Level.Trace)
XB._base.logger.trace("Disposing XML:\n" + this.serialize().substr(0,400) + "\n...");
this._rootNode = null;
}

}
,
serialize: function XML_serialize() {
var result = "";
for (let nodeIndex = 0, len = this.length;nodeIndex < len;nodeIndex++) {
result += xmlutils.serializeXML(this.item(nodeIndex));
}

return result;
}
,
get textContent() {
return this._rootNode.textContent;
}
,
equalsTo: function XML_equalsTo(other) {
sysutils.ensureValueTypeIs(other,this.constructor);
if (other === this)
return true;
if (this._isADocument ^ other._isADocument)
return false;
if (this.disposed || other.disposed)
return false;
return this._rootNode.isEqualNode(other._rootNode);
}
,
query: function XML_query(expr, NSResolver) {
if (this.disposed)
throw new Error("Querying from disposed XML object (expression: \"" + expr + "\")");
var queryNode = this._isADocument ? this._rootNode.ownerDocument : this._rootNode;
return this._processQueryResult(this._queryXMLDocCheck(expr,queryNode,NSResolver));
}
,
transform: function XML_transform(stylesheet, destDoc) {
var src = this._isADocument ? this._rootNode.ownerDocument : this._rootNode;
var newXML = new XB.types.XML(destDoc, xmlutils.transformXMLToFragment(src,stylesheet,destDoc));
return newXML;
}
,
clone: function XML_clone() {
return new this.constructor(this);
}
,
get owner() {
return this._owner;
}
,
set owner(owner) {
this._owner = owner;
}
,
setRoot: function XBXML_setRoot(rootNode) {
this._rootNode = this._frag.appendChild(rootNode);
if (! this._rootNode)
throw new Error("Couldn't set root node");
this._isADocument = false;
}
,
_bufferDoc: null,
_valType: "XBXML",
_isADocument: false,
_frag: null,
_rootNode: null,
_owner: null,
_initAsList: function XML__initAsList() {
this._frag = this._bufferDoc.createDocumentFragment();
this._rootNode = this._frag.appendChild(this._bufferDoc.createElement("xml"));
if (! this._rootNode)
throw new Error("Couldn't create root node");
this._isADocument = false;
}
,
_appendAnyNode: function XML__appendAnyNode(node) {
var newNode = null;
if (node.ownerDocument == this._rootNode.ownerDocument)
{
newNode = node.cloneNode(true);
}
 else
{
try {
newNode = this._rootNode.ownerDocument.importNode(node,true);
}
catch (e) {
XB._base.logger.warn("Native importNode failed. " + e);
newNode = xmlutils.recreateXML(node,this._rootNode.ownerDocument,true);
}

}

if (newNode.nodeType == newNode.ATTRIBUTE_NODE)
this._rootNode.setAttributeNS(newNode.namespaceURI,newNode.localName,newNode.value); else
this._rootNode.appendChild(newNode);
}
,
_queryXMLDocCheck: function XBXML_queryXMLDocCheck(expr, contextNode, extNSResolver) {
try {
let result = xmlutils.queryXMLDoc(expr,contextNode,extNSResolver);
if (typeof result == "number" && isNaN(result))
throw new XB.types.EXPATHNaN(expr);
if (result === undefined)
throw new XB.types.EXPATHUnexpectedResult(expr, typeof result);
return result;
}
catch (e) {
if (! (e instanceof XB.types.EXPATHNaN))
XB._base.logger.warn(strutils.formatString(XB.types._consts.ERR_XPATH_QUERY_FAILED,[expr, strutils.formatError(e)]));
throw e;
}

}
,
_processQueryResult: function XBXML__processQueryResult(queryResult) {
if (Array.isArray(queryResult))
{
if (! queryResult.length)
return XB.types.empty;
let xmlContent = queryResult.length == 1 ? queryResult[0] : queryResult;
queryResult = xmlContent instanceof Ci.nsIDOMDocument ? new XB.types.XML(xmlContent) : new XB.types.XML(this._bufferDoc, xmlContent);
}

return queryResult;
}
};
XB.types.Exception = function XBException(srcNodeUid, eType, msg) {
this._type = eType || this._type;
this._msg = msg;
this._srcNodeUid = srcNodeUid;
}
;
XB.types.Exception.types = {
E_GENERIC: "Exception",
E_SYNTAX: "Syntax",
E_TYPE: "Type",
E_RUNTIME: "Runtime",
E_SECURITY: "Security",
E_RETHROW: "Rethrow",
E_LASTVALUE: "LastValue"};
XB.types.Exception.prototype = {
get type() {
return this._type;
}
,
get srcNodeUid() {
return this._srcNodeUid;
}
,
get message() {
return this._msg;
}
,
equalsTo: function XBException_equalsTo(other) {
return sysutils.objectsAreEqual(this,other);
}
,
toString: function XBException_toString() {
return this._type + "@" + this._srcNodeUid + ": " + this._msg;
}
,
_type: XB.types.Exception.types.E_GENERIC,
_srcNodeUid: undefined};
XB.types.ResDescriptor = function XBResDescriptor({format: format}) {
BarPlatform.CachedResources.ResDescriptor.apply(this,arguments);
sysutils.ensureValueTypeIs(format,"number");
if (format < XB.types.ResDescriptor.Format.FMT_TEXT || format > XB.types.ResDescriptor.Format.FMT_JSON)
throw new RangeError("Unknown format type: " + format);
this._format = format;
}
;
XB.types.ResDescriptor.Format = {
FMT_TEXT: 0,
FMT_XML: 1,
FMT_JSON: 2};
XB.types.ResDescriptor.prototype = {
__proto__: BarPlatform.CachedResources.ResDescriptor.prototype,
constructor: XB.types.ResDescriptor,
get format() this._format,
get hash() {
return this._hash || (this._hash = [this._origHashFunc(), this._format].join("#"));
}
,
_format: XB.types.ResDescriptor.Format.FMT_TEXT,
get _origHashFunc() BarPlatform.CachedResources.ResDescriptor.prototype.__lookupGetter__("hash"),
_fields: BarPlatform.CachedResources.ResDescriptor.prototype._fields.concat(["_format"])};
