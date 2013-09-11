"use strict";
XB._base = {
init: function XBBase_init(application) {
this.application = application;
this.loggersRoot = application.name + ".XB";
this.logger = XB._logger;
}
,
finalize: function () {
this.logger = null;
this.domParser = null;
}
,
getLogger: function XBBase_getLogger(name) {
return Log4Moz.repository.getLogger(this.loggersRoot + "." + name);
}
,
application: null,
consts: {
MIN_SND_PLAY_INTERVAL: 1500,
STR_FUNCTIONAL_NS: "http://bar.yandex.ru/dev/functional",
STR_UI_NS: "http://bar.yandex.ru/dev/gui",
STR_VAL_REF_ELEM_NAME: "__value__",
STR_VAL_REF_ID_KEY_NAME: "uid",
ERR_XML_PARSE_ERROR: "XML Parse error",
ERR_INVALID_DOC_STRUC: "Invalid document structure",
ERR_UID_NOT_FOUND: "Node uid attribute not found",
ERR_DOM_DOC_EXPECTED: "DOM document expected",
ERR_DOM_NODES_EXPECTED: "DOM node or node list expected",
ERR_NUMBER_EXPECTED: "Number expected",
ERR_STRING_EXPECTED: "String expected",
ERR_NO_RUNTIME_FUNCTION: "Function is not defined",
ERR_UID_REQUIRED: "UID required",
ERR_RUNTIME_ERROR: "Runtime error occured",
ERR_UNIT_REQUIRED: "XB unit required",
ERR_WINST_REQUIRED: "Widget instance required",
ERR_DATA_UNDEFINED: "No data, variable or setting with this name was defined",
ERR_PROC_NODE_EXPECTED: "ProcNode instance expected",
ERR_DISPOSED_XML: "Disposed XML object"},
loggersRoot: undefined,
logger: null,
domParser: Cc["@mozilla.org/xmlextras/domparser;1"].getService(Ci.nsIDOMParser),
nsIIOService: Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService)};
XB._base.toolkitDataProvider = {
QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
get wrappedJSObject() this,
get UUID() "toolkit",
newChannel: function XBPToolkitDataProvider_newChannel(aURI) {
var channel = XB._base.nsIIOService.newChannel(this._rootPath + aURI.path,null,null);
channel.originalURI = aURI;
return channel;
}
,
findFile: function XBPToolkitDataProvider_findFile(path) {
var file = this._pkgsFile.clone().QueryInterface(Ci.nsILocalFile);
path.split("/").forEach(function appendPart(part) {
if (! path)
return;
file.append(part);
}
);
return file;
}
,
get _rootPath() {
var path = "chrome://" + XB._base.application.name + "/content/packages/toolkit";
delete this._rootPath;
return this._rootPath = path;
}
,
get _pkgsFile() {
var rootFile = XB._base.application.core.extensionPathFile.QueryInterface(Ci.nsILocalFile);
["chrome", "content", "packages", "toolkit"].forEach(function appendPart(part) {
rootFile.append(part);
}
);
delete this._pkgsFile;
return this._pkgsFile = rootFile;
}
};
