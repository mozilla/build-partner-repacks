"use strict";
const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils, EXPORTED_SYMBOLS = ["brandingPlus"], GLOBAL = this;
const PKG_UPD_TOPIC = "package updated";
const brandingPlus = {
init: function brandingPlus_init(application) {
this._application = application;
this._logger = this._application.getLogger("Package");
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application.core.protocol.addDataProvider(this);
this._application.branding.addListener(PKG_UPD_TOPIC,this);
}
,
finalize: function brandingPlus_finalize() {
this._application.branding.removeListener(PKG_UPD_TOPIC,this);
this._application.core.protocol.removeDataProvider(this);
this._application = null;
this._logger = null;
}
,
newURI: function brandingPlus_newURI(aSpec, aOriginalCharset, aBaseURI, simpleURI) {
if (! aSpec)
return null;
var spec = aBaseURI ? aBaseURI.resolve(aSpec) : aSpec;
var resourcePath = spec && spec.split(/:\/\/branding\//)[1];
var brandingPackageURL = resourcePath && this._application.branding.brandPackage.resolvePath(resourcePath);
return misc.tryCreateFixupURI(brandingPackageURL);
}
,
newChannel: function brandingPlus_newChannel(aURI, isSimpleURI) {
if (isSimpleURI || aURI.host != "plus.branding" || aURI.path != "/names.dtd")
return null;
var stream = strutils.utf8Converter.convertToInputStream(this._namesDTDContent);
var channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
channel.setURI(aURI);
channel.originalURI = aURI;
channel.contentStream = stream;
return channel;
}
,
observe: function brandingPlus_observe(aSubject, aTopic, aData) {
if (aTopic == PKG_UPD_TOPIC)
this._namesStr = undefined;
}
,
get _namesDTDContent() {
if (! this._namesStr)
{
this._namesStr = this._application.branding.expandBrandTemplates(this._namesTpl);
}

return this._namesStr;
}
,
_namesStr: undefined,
_namesTpl: "        <!ENTITY product1.nom \"{product1.nom}\">        <!ENTITY product1.gen \"{product1.gen}\">        <!ENTITY product1.dat \"{product1.dat}\">        <!ENTITY product1.acc \"{product1.acc}\">        <!ENTITY product1.ins \"{product1.ins}\">        <!ENTITY product1.pre \"{product1.pre}\">        <!ENTITY product1.loc \"{product1.loc}\">                <!ENTITY product2.nom \"{product2.nom}\">        <!ENTITY product2.gen \"{product2.gen}\">        <!ENTITY product2.dat \"{product2.dat}\">        <!ENTITY product2.acc \"{product2.acc}\">        <!ENTITY product2.ins \"{product2.ins}\">        <!ENTITY product2.pre \"{product2.pre}\">        <!ENTITY product2.loc \"{product2.loc}\">                <!ENTITY vendor.nom \"{vendor.nom}\">        <!ENTITY vendor.gen \"{vendor.gen}\">        <!ENTITY vendor.dat \"{vendor.dat}\">        <!ENTITY vendor.acc \"{vendor.acc}\">        <!ENTITY vendor.ins \"{vendor.ins}\">        <!ENTITY vendor.pre \"{vendor.pre}\">        <!ENTITY vendor.loc \"{vendor.loc}\">",
_application: null,
_logger: null};
