"use strict";
const EXPORTED_SYMBOLS = ["brandProviders"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
var branding;
const PKG_UPD_TOPIC = "package updated";
const brandProviders = {
init: function brandProviders_init(aApplication) {
this._barApp = aApplication;
aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib,GLOBAL);
branding = aApplication.branding;
this._barApp.core.protocols.bar.addDataProvider(barProtocolHandler);
this._barApp.core.protocols[this._barApp.name].addDataProvider(appProtocolHandler);
this._barApp.core.xbProtocol.setDataProvider(brandNamesProvider.UUID,brandNamesProvider);
branding.addListener(PKG_UPD_TOPIC,brandNamesProvider);
}
,
finalize: function brandProviders_finalize(aDoCleanup) {
branding.removeListener(PKG_UPD_TOPIC,brandNamesProvider);
this._barApp.core.xbProtocol.setDataProvider(brandNamesProvider.UUID,null);
this._barApp.core.protocols[this._barApp.name].removeDataProvider(appProtocolHandler);
this._barApp.core.protocols.bar.removeDataProvider(barProtocolHandler);
}
,
get welcomePageProvider() {
return barProtocolHandler;
}
};
const barProtocolHandler = {
INDEX_FILE_NAME: "welcome.html",
newURI: function BarPH_WP_newURI(aSpec, aOriginCharset, aBaseURI, aSimpleURI) {
if (! aBaseURI && this.canHandlePath(aSimpleURI.path))
{
let welcomePage = brandProviders._barApp.branding.productInfo.WelcomePage;
return welcomePage && welcomePage.url ? this._makeExternalWPURI(welcomePage.url,aOriginCharset,null) : aSimpleURI;
}

if (aBaseURI && this.canHandlePath(aBaseURI.path))
return this._makeWPURI(aSpec,aOriginCharset,null);
return null;
}
,
newChannel: function BarPH_WP_newChannel(aURI) {
if (! this.canHandlePath(aURI.path))
return null;
var baseURI = this._makeWPURI("",null,null);
var uri = this._makeWPURI(this.INDEX_FILE_NAME,null,baseURI);
var channel = this._ioService.newChannelFromURI(uri);
channel.originalURI = aURI;
return channel;
}
,
canHandlePath: function BarPH_WP_canHandlePath(aPath) {
return aPath.toLowerCase() == "welcome";
}
,
_makeWPURI: function BarPH_WP__makeURI(aTarget, aOriginCharset, aBaseURI) {
return this._ioService.newURI(brandProviders._barApp.name + "://branding/welcome/fx/" + aTarget,aOriginCharset,aBaseURI);
}
,
_makeExternalWPURI: function BarPH_WP__makeExternalWPURI(aSpec, aOriginCharset, aBaseURI) {
var overlayController = misc.getTopBrowserWindow()[brandProviders._barApp.name + "OverlayController"];
var lang = brandProviders._barApp.locale.language;
var isClean = overlayController.chevronButton.isHidden;
var spec = aSpec + "?lang=" + lang;
spec += isClean ? "&clear" : "";
return this._ioService.newURI(spec,aOriginCharset,aBaseURI);
}
,
get _ioService() {
delete this._ioService;
return this._ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
}
};
const appProtocolHandler = {
newURI: function AppPH_newURI(aSpec, aOriginalCharset, aBaseURI, simpleURI) {
if (! aSpec)
return null;
var spec = aBaseURI ? aBaseURI.resolve(aSpec) : aSpec;
var resourcePath = spec && spec.split(/:\/\/branding\//)[1];
var brandingPackageURL = resourcePath && branding.brandPackage.resolvePath(resourcePath);
return misc.tryCreateFixupURI(brandingPackageURL);
}
};
const brandNamesProvider = {
observe: function xbBrandProv_observe(subject, topic, data) {
if (subject != branding || topic != PKG_UPD_TOPIC)
return;
this._namesStr = undefined;
}
,
get wrappedJSObject() this,
get UUID() this._domain,
newChannel: function xbBrandProv_newChannel(aURI) {
var dataString = this._getData(aURI);
var inputStream = strutils.utf8Converter.convertToInputStream(dataString);
var channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
channel.setURI(aURI);
channel.originalURI = aURI;
channel.contentStream = inputStream;
return channel;
}
,
_domain: "branding",
_namesStr: undefined,
_namesTpl: "        <!ENTITY product1.nom \"{product1.nom}\">        <!ENTITY product1.gen \"{product1.gen}\">        <!ENTITY product1.dat \"{product1.dat}\">        <!ENTITY product1.acc \"{product1.acc}\">        <!ENTITY product1.ins \"{product1.ins}\">        <!ENTITY product1.pre \"{product1.pre}\">        <!ENTITY product1.loc \"{product1.loc}\">                <!ENTITY product2.nom \"{product2.nom}\">        <!ENTITY product2.gen \"{product2.gen}\">        <!ENTITY product2.dat \"{product2.dat}\">        <!ENTITY product2.acc \"{product2.acc}\">        <!ENTITY product2.ins \"{product2.ins}\">        <!ENTITY product2.pre \"{product2.pre}\">        <!ENTITY product2.loc \"{product2.loc}\">                <!ENTITY vendor.nom \"{vendor.nom}\">        <!ENTITY vendor.gen \"{vendor.gen}\">        <!ENTITY vendor.dat \"{vendor.dat}\">        <!ENTITY vendor.acc \"{vendor.acc}\">        <!ENTITY vendor.ins \"{vendor.ins}\">        <!ENTITY vendor.pre \"{vendor.pre}\">        <!ENTITY vendor.loc \"{vendor.loc}\">",
_getData: function xbBrandProv__getData(aURI) {
if (aURI.path == "/names.dtd")
{
if (! this._namesStr)
this._namesStr = branding.expandBrandTemplates(this._namesTpl);
return this._namesStr;
}

throw Cr.NS_ERROR_MALFORMED_URI;
}
};
