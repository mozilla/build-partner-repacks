"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
let extDir = Services.io.newURI(__URI__, null, null);
Cu.import(extDir.resolve("..") + "config.js");
const CLASS_ID = "{6BA7D0A8-A115-11DE-8D96-029555D89593}";
const SCHEME = "xb";
this.__defineGetter__("G_XB_HANDLER", function () {
    delete this.G_XB_HANDLER;
    return this.G_XB_HANDLER = Cc[XBProtocolHandler.prototype.contractID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
});
function XBProtocolHandler() {
    this._providers = Object.create(null);
}
XBProtocolHandler.prototype = {
    version: 9,
    classDescription: "Custom Yandex.Bar protocol handler for XB-resources.",
    classID: Components.ID(CLASS_ID),
    contractID: "@mozilla.org/network/protocol;1?name=" + SCHEME,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]),
    get wrappedJSObject() {
        return this;
    },
    setDataProvider: function XBProtocolHandler_setDataProvider(aUUID, aProvider) {
        if (aProvider) {
            this._providers[aUUID] = aProvider;
        } else {
            delete this._providers[aUUID];
        }
    },
    getDataProvider: function XBProtocolHandler_getDataProvider(aUUID) {
        if (!(aUUID in this._providers)) {
            throw Cr.NS_ERROR_NOT_AVAILABLE;
        }
        return this._providers[aUUID];
    },
    get scheme() {
        return SCHEME;
    },
    get protocolFlags() {
        return Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD | Ci.nsIProtocolHandler.URI_NOAUTH | Ci.nsIProtocolHandler.URI_IS_UI_RESOURCE | Ci.nsIProtocolHandler.URI_IS_LOCAL_FILE;
    },
    get defaultPort() {
        return -1;
    },
    allowPort: function XBProtocolHandler_allowPort() {
        return false;
    },
    newURI: function XBProtocolHandler_newURI(aSpec, aOriginalCharset, aBaseURI) {
        let uri = new XBProtocolHandler.XBURI(aSpec, aOriginalCharset, aBaseURI);
        return uri;
    },
    newChannel: function XBProtocolHandler_newChannel(aURI) {
        let uri = aURI.wrappedJSObject;
        let provider;
        try {
            provider = uri.dataProvider;
        } catch (e) {
            Cu.reportError("XB protocol couldn't get data provider for URI: " + aURI.spec);
        }
        if (!provider) {
            throw Cr.NS_ERROR_FAILURE;
        }
        return provider.newChannel(uri);
    },
    _destroy: function XBProtocolHandler__destroy() {
        this._providers = null;
    }
};
XBProtocolHandler.XBURI = function XBURI(spec, originalCharset, baseURI) {
    let standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
    standardURL.init(standardURL.URLTYPE_STANDARD, -1, spec, originalCharset, baseURI);
    standardURL.QueryInterface(Ci.nsIURL);
    this._standardURL = standardURL;
};
XBProtocolHandler.XBURI.prototype = {
    get wrappedJSObject() {
        return this;
    },
    get dataProvider() {
        if (!this._dataProvider) {
            this._dataProvider = G_XB_HANDLER.getDataProvider(this.host);
        }
        return this._dataProvider.wrappedJSObject;
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIURI,
        Ci.nsIURL,
        Ci.nsIFileURL
    ]),
    get hostPort() {
        return CB_CONFIG.APP.NAME;
    },
    set hostPort(aHostPort) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    clone: function XBURI_clone() {
        return new XBProtocolHandler.XBURI(this.spec);
    },
    cloneIgnoringRef: function XBURI_cloneIgnoringRef() {
        return new XBProtocolHandler.XBURI(this._standardURL.cloneIgnoringRef().spec);
    },
    equals: function XBURI_equals(uri) {
        return this.spec === uri.spec;
    },
    equalsExceptRef: function XBURI_equalsExceptRef(uri) {
        return this.spec.split("#")[0] === uri.spec.split("#")[0];
    },
    schemeIs: function XBURI_schemeIs(scheme) {
        scheme = scheme.toLowerCase();
        return scheme == this.scheme || scheme == "chrome" && /\.dtd$/.test(this.spec);
    },
    get file() {
        return this.dataProvider.findFile(this.filePath);
    },
    set file(val) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    _dataProvider: null,
    _standardURL: null
};
[
    "spec",
    "prePath",
    "scheme",
    "userPass",
    "username",
    "password",
    "host",
    "port",
    "path",
    "asciiSpec",
    "asciiHost",
    "originCharset",
    "directory",
    "fileBaseName",
    "fileExtension",
    "fileName",
    "filePath",
    "query",
    "ref"
].forEach(function (propName) {
    Object.defineProperty(this, propName, {
        get: function () {
            return this._standardURL[propName];
        },
        set: function (val) {
            this._standardURL[propName] = val;
        }
    });
}, XBProtocolHandler.XBURI.prototype);
[
    "resolve",
    "getCommonBaseSpec",
    "getRelativeSpec"
].forEach(function (methodName) {
    Object.defineProperty(this, methodName, {
        value: function () {
            return this._standardURL[methodName].apply(this._standardURL, arguments);
        }
    });
}, XBProtocolHandler.XBURI.prototype);
const NSGetFactory = XPCOMUtils.generateNSGetFactory([XBProtocolHandler]);
