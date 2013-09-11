"use strict";
const EXPORTED_SYMBOLS = ["aboutSupport"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const aboutSupport = {
init: function AboutSupport_init(aApplication) {
aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib,GLOBAL);
this._application = aApplication;
this._logger = this._application.getLogger("AboutSupport");
switch (this._application.core.CONFIG.APP.TYPE) {
case "barff":
this.aboutPrefix = "elements-support";
this._classID = Components.ID("{75ec0b66-60ec-11e2-90b8-60334b147402}");
this._classDescription = "Elements support page protocol handler";
break;
case "vbff":
this.aboutPrefix = "visualbookmarks-support";
this._classID = Components.ID("{8c844382-614d-11e2-848d-60334b147402}");
this._classDescription = "Visual Bookmarks support page protocol handler";
break;
}

Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this._classID,this._classDescription,"@mozilla.org/network/protocol/about;1?what=" + this.aboutPrefix,this);
}
,
finalize: function Defender_finalize(aDoCleanup) {
Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this._classID,this);
this._logger = null;
this._application = null;
}
,
get _appName() {
delete this._appName;
switch (this._application.core.CONFIG.APP.TYPE) {
case "barff":
return this._appName = "yasearch";
case "vbff":
return this._appName = "yandex-vb";
}

}
,
get _appProtocol() {
delete this._appProtocol;
return this._appProtocol = this._application.core.CONFIG.APP.PROTOCOL || "yasearch";
}
,
createInstance: function AboutSupport_createInstance(outer, iid) {
if (outer != null)
throw Cr.NS_ERROR_NO_AGGREGATION;
return this.QueryInterface(iid);
}
,
QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIAboutModule]),
getURIFlags: function AboutSupport_getURIFlags(aURI) {
return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT;
}
,
newChannel: function AboutSupport_newChannel(aURI) {
var url = "chrome://" + this._appName + "/content/support/about.xhtml";
var pageSource = fileutils.readStringFromStream(this._application.addonFS.getStream(url)).replace(/__APP_NAME__/g,this._appName).replace(/__APP_PROTOCOL__/g,this._appProtocol);
var inputStream = strutils.utf8Converter.convertToInputStream(pageSource);
var channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
channel.setURI(aURI);
channel.originalURI = aURI;
channel.owner = sysutils.scriptSecurityManager.getSystemPrincipal();
channel.contentStream = inputStream;
return channel;
}
};
