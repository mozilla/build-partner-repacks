"use strict";
const EXPORTED_SYMBOLS = ["SimpleProtocol"];
const {classes: Cc, interfaces: Ci, results: Cr, utils: Cu, manager: Cm} = Components;
const IOS = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const InputStreamFabric = Cc["@mozilla.org/io/string-input-stream;1"];
const nsIStringInputStream = Ci.nsIStringInputStream;
const ccSimpleURI = Cc["@mozilla.org/network/simple-uri;1"];
const ccStandardURL = Cc["@mozilla.org/network/standard-url;1"];
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
function SimpleProtocol(scheme, classID) {
this._scheme = "" + scheme;
this._hostEnabledPrefix = this._scheme + "://";
this._readableName = this.constructor.name + " (" + this._scheme + ")";
var uuidStr = classID || Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();
this._classID = Components.ID(uuidStr);
this._contractID = "@mozilla.org/network/protocol;1?name=" + scheme;
this._dataProviders = [];
Cm.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this._classID,this._DESCR,this._contractID,this);
}

SimpleProtocol.prototype = {
constructor: SimpleProtocol,
get wrappedJSObject() {
return this;
}
,
unregister: function SimpleProtocol_unregister() {
this._dataProviders = [];
Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this._classID,this);
}
,
addDataProvider: function SimpleProtocol_addDataProvider(provider) {
if (this._dataProviders.indexOf(provider) > - 1)
return;
if (! ("newURI" in provider) && ! ("newChannel" in provider) && ! ("getContent" in provider))
throw new Error("Bad data provider interface.");
this._dataProviders.push(provider);
}
,
removeDataProvider: function SimpleProtocol_removeDataProvider(provider) {
if (this._dataProviders)
this._dataProviders = this._dataProviders.filter(function (handler) provider !== handler);
}
,
QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]),
createInstance: function SimpleProtocol_createInstance(aOuter, iid) {
return this.QueryInterface(iid);
}
,
lockFactory: function SimpleProtocol_lockFactory(lock) {

}
,
get scheme() {
return this._scheme;
}
,
get protocolFlags() {
return Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD;
}
,
get defaultPort() {
return - 1;
}
,
allowPort: function SimpleProtocol_allowPort(port, scheme) {
return false;
}
,
newURI: function SimpleProtocol_newURI(spec, originalCharset, baseURI) {
var createdURI = this._createURI(spec,originalCharset,baseURI);
var result = this._findURI(spec,originalCharset,baseURI,createdURI) || createdURI;
if (result)
return result;
return IOS.newURI("data:,",null,null);
}
,
newChannel: function SimpleProtocol_newChannel(uri) {
try {
let channel = this._findChannel(uri,! this._specHasHost(uri.spec));
if (! channel)
{
channel = IOS.newChannel("data:,",null,null);
channel.originalURI = uri;
}

return channel;
}
catch (e) {
Cu.reportError(this._readableName + " newChannel: " + e + ". URI: " + uri.spec);
throw Cr.NS_ERROR_FAILURE;
}

}
,
_scheme: undefined,
_hostEnabledPrefix: undefined,
_classID: undefined,
_contractID: undefined,
_DESCR: "Simple protocol handler",
_dataProviders: null,
_findURI: function SimpleProtocol__findURI(spec, originalCharset, baseURI, createdURI) {
for each(let dataProvider in this._dataProviders) {
if (typeof dataProvider.newURI != "function")
continue;
try {
let uri = dataProvider.newURI(spec,originalCharset,baseURI,createdURI);
if (uri)
return uri;
}
catch (e) {
Cu.reportError(this._readableName + " _findURI: " + e + ". Spec: " + spec);
}

}

return null;
}
,
_specHasHost: function SimpleProtocol__specHasHost(spec) {
return spec.substr(0,this._hostEnabledPrefix.length) == this._hostEnabledPrefix;
}
,
_createURI: function SimpleProtocol__createURI(spec, charset, baseURI) {
var simpleDestURI = ! this._specHasHost(spec) && (! baseURI || ! this._specHasHost(baseURI.spec));
var uriCreator = simpleDestURI ? this._makeSimpleURI : this._makeFullURI;
return uriCreator.call(this,spec,charset,baseURI);
}
,
_makeSimpleURI: function SimpleProtocol__makeSimpleURI(spec, charset, baseURI) {
try {
let simpleURI = ccSimpleURI.createInstance(Ci.nsIURI);
simpleURI.spec = spec;
return simpleURI;
}
catch (e) {
return null;
}

}
,
_makeFullURI: function SimpleProtocol__makeFullURI(spec, charset, baseURI) {
var standardUrl = ccStandardURL.createInstance(Ci.nsIStandardURL);
standardUrl.init(standardUrl.URLTYPE_STANDARD,- 1,spec,charset,baseURI);
standardUrl = standardUrl.QueryInterface(Ci.nsIURL);
return Proxy.create(proxyHandlerMaker(standardUrl));
}
,
_findChannel: function SimpleProtocol__findChannel(uri, isSimpleURI) {
var channel = null;
for each(let dataProvider in this._dataProviders) {
try {
if (typeof dataProvider.newChannel == "function")
{
channel = dataProvider.newChannel(uri,isSimpleURI);
}
 else
if (typeof dataProvider.getContent == "function")
{
let strData = "" + dataProvider.getContent(uri,isSimpleURI);
let inputStream = InputStreamFabric.createInstance(nsIStringInputStream);
inputStream.setData(strData,strData.length);
channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
channel.setURI(uri);
channel.originalURI = uri;
channel.contentStream = inputStream;
}

if (channel !== null)
return channel;
}
catch (e) {
Cu.reportError(this._readableName + " _findChannel: " + e + ". Spec: " + uri.spec);
}

}

throw new Error("None of " + this._dataProviders.length + " providers could serve the resource: " + uri.spec);
}
};
var proxyHandlerMaker = function proxyHandlerMaker(obj) {
return {
getOwnPropertyDescriptor: function proxyHandlerMaker_getOwnPropertyDescriptor(name) {
var desc = Object.getOwnPropertyDescriptor(obj,name);
if (desc !== undefined)
{
desc.configurable = true;
}

return desc;
}
,
getPropertyDescriptor: function proxyHandlerMaker_getPropertyDescriptor(name) {
var desc = Object.getPropertyDescriptor(obj,name);
if (desc !== undefined)
{
desc.configurable = true;
}

return desc;
}
,
getOwnPropertyNames: function proxyHandlerMaker_getOwnPropertyNames() {
return Object.getOwnPropertyNames(obj);
}
,
getPropertyNames: function proxyHandlerMaker_getPropertyNames() {
return Object.getPropertyNames(obj);
}
,
defineProperty: function proxyHandlerMaker_defineProperty(name, desc) {
Object.defineProperty(obj,name,desc);
}
,
delete: function proxyHandlerMaker_delete(name) {
return delete obj[name];
}
,
fix: function proxyHandlerMaker_fix() {
if (Object.isFrozen(obj))
{
return Object.getOwnPropertyNames(obj).map(function (name) {
return Object.getOwnPropertyDescriptor(obj,name);
}
);
}

return undefined;
}
,
has: function proxyHandlerMaker_has(name) name in obj,
hasOwn: function proxyHandlerMaker_hasOwn(name) Object.prototype.hasOwnProperty.call(obj,name),
get: function proxyHandlerMaker_get(receiver, name) {
if (name == "schemeIs")
{
return function (aScheme) {
aScheme = aScheme.toLowerCase();
return aScheme == obj.scheme || aScheme == "chrome" && /\.dtd$/.test(obj.spec);
}
;
}

return obj[name];
}
,
set: function proxyHandlerMaker_set(receiver, name, val) {
obj[name] = val;
return true;
}
,
enumerate: function proxyHandlerMaker_enumerate() {
var result = [];
for(name in obj) {
result.push(name);
}

return result;
}
,
keys: function proxyHandlerMaker_keys() Object.keys(obj)};
}
;
