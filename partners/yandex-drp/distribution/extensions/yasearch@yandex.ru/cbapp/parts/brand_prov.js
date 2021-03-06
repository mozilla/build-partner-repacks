"use strict";
const EXPORTED_SYMBOLS = ["brandProviders"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
let branding;
const brandProviders = {
    init: function brandProviders_init(aApplication) {
        this._barApp = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        branding = aApplication.branding;
        this._barApp.core.protocols[this._barApp.name].addDataProvider(appProtocolHandler);
        this._barApp.core.xbProtocol.setDataProvider(brandNamesProvider.UUID, brandNamesProvider);
    },
    finalize: function brandProviders_finalize(aDoCleanup) {
        this._barApp.core.xbProtocol.setDataProvider(brandNamesProvider.UUID, null);
        this._barApp.core.protocols[this._barApp.name].removeDataProvider(appProtocolHandler);
    }
};
const appProtocolHandler = {
    newURI: function AppPH_newURI(aSpec, aOriginalCharset, aBaseURI, simpleURI) {
        if (!aSpec) {
            return null;
        }
        let spec = aBaseURI ? aBaseURI.resolve(aSpec) : aSpec;
        let resourcePath = spec && spec.split(/:\/\/branding\//)[1];
        let brandingPackageURL = resourcePath && branding.brandPackage.resolvePath(resourcePath);
        return misc.tryCreateFixupURI(brandingPackageURL);
    }
};
const brandNamesProvider = {
    get wrappedJSObject() {
        return this;
    },
    get UUID() {
        return this._domain;
    },
    newChannel: function xbBrandProv_newChannel(aURI) {
        let dataString = this._getData(aURI);
        let inputStream = strutils.utf8Converter.convertToInputStream(dataString);
        let channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
        channel.setURI(aURI);
        channel.originalURI = aURI;
        channel.contentStream = inputStream;
        return channel;
    },
    _domain: "branding",
    _namesStr: undefined,
    _namesTpl: "<!ENTITY product1.nom \"{product1.nom}\">" + "<!ENTITY product1.gen \"{product1.gen}\">" + "<!ENTITY product1.dat \"{product1.dat}\">" + "<!ENTITY product1.acc \"{product1.acc}\">" + "<!ENTITY product1.ins \"{product1.ins}\">" + "<!ENTITY product1.pre \"{product1.pre}\">" + "<!ENTITY product1.loc \"{product1.loc}\">" + "<!ENTITY product2.nom \"{product2.nom}\">" + "<!ENTITY product2.gen \"{product2.gen}\">" + "<!ENTITY product2.dat \"{product2.dat}\">" + "<!ENTITY product2.acc \"{product2.acc}\">" + "<!ENTITY product2.ins \"{product2.ins}\">" + "<!ENTITY product2.pre \"{product2.pre}\">" + "<!ENTITY product2.loc \"{product2.loc}\">" + "<!ENTITY vendor.nom \"{vendor.nom}\">" + "<!ENTITY vendor.gen \"{vendor.gen}\">" + "<!ENTITY vendor.dat \"{vendor.dat}\">" + "<!ENTITY vendor.acc \"{vendor.acc}\">" + "<!ENTITY vendor.ins \"{vendor.ins}\">" + "<!ENTITY vendor.pre \"{vendor.pre}\">" + "<!ENTITY vendor.loc \"{vendor.loc}\">",
    _getData: function xbBrandProv__getData(aURI) {
        if (aURI.path == "/names.dtd") {
            if (!this._namesStr) {
                this._namesStr = branding.expandBrandTemplates(this._namesTpl);
            }
            return this._namesStr;
        }
        throw Cr.NS_ERROR_MALFORMED_URI;
    }
};
