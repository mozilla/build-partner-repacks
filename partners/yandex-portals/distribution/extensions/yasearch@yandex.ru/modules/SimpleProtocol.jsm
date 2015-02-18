"use strict";
const EXPORTED_SYMBOLS = ["SimpleProtocol"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu,
    manager: Cm
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyGetter(this, "stringInputStreamConstructor", () => Components.Constructor("@mozilla.org/io/string-input-stream;1", "nsIStringInputStream", "setData"));
XPCOMUtils.defineLazyGetter(this, "simpleURIConstructor", () => Components.Constructor("@mozilla.org/network/simple-uri;1", "nsIURI"));
function SimpleProtocol(scheme, classID) {
    this._scheme = String(scheme);
    this._hostEnabledPrefix = this._scheme + "://";
    this._readableName = this.constructor.name + " (" + this._scheme + ")";
    let uuidStr = classID || Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();
    this._classID = Components.ID(uuidStr);
    this._contractID = "@mozilla.org/network/protocol;1?name=" + scheme;
    this._dataProviders = [];
    Cm.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this._classID, this._DESCR, this._contractID, this);
}
SimpleProtocol.prototype = {
    constructor: SimpleProtocol,
    get wrappedJSObject() {
        return this;
    },
    unregister: function SimpleProtocol_unregister() {
        this._dataProviders = [];
        Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this._classID, this);
    },
    addDataProvider: function SimpleProtocol_addDataProvider(provider) {
        if (this._dataProviders.indexOf(provider) > -1) {
            return;
        }
        if (!("newURI" in provider) && !("newChannel" in provider) && !("getContent" in provider)) {
            throw new Error("Bad data provider interface.");
        }
        this._dataProviders.push(provider);
    },
    removeDataProvider: function SimpleProtocol_removeDataProvider(provider) {
        if (this._dataProviders) {
            this._dataProviders = this._dataProviders.filter(function (handler) {
                return provider !== handler;
            });
        }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]),
    createInstance: function SimpleProtocol_createInstance(aOuter, iid) {
        return this.QueryInterface(iid);
    },
    lockFactory: function SimpleProtocol_lockFactory(lock) {
    },
    get scheme() {
        return this._scheme;
    },
    get protocolFlags() {
        return Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD;
    },
    get defaultPort() {
        return -1;
    },
    allowPort: function SimpleProtocol_allowPort(port, scheme) {
        return false;
    },
    newURI: function SimpleProtocol_newURI(spec, originalCharset, baseURI) {
        let createdURI = this._createURI(spec, originalCharset, baseURI);
        let result = this._findURI(spec, originalCharset, baseURI, createdURI) || createdURI;
        if (result) {
            return result;
        }
        return Services.io.newURI("data:,", null, null);
    },
    newChannel: function SimpleProtocol_newChannel(uri) {
        try {
            let channel = this._findChannel(uri, !this._specHasHost(uri.spec));
            if (!channel) {
                channel = Services.io.newChannel("data:,", null, null);
                channel.originalURI = uri;
            }
            return channel;
        } catch (e) {
            Cu.reportError(this._readableName + " newChannel: " + e + ". URI: " + uri.spec);
            throw Cr.NS_ERROR_FAILURE;
        }
    },
    _scheme: undefined,
    _hostEnabledPrefix: undefined,
    _classID: undefined,
    _contractID: undefined,
    _DESCR: "Simple protocol handler",
    _dataProviders: null,
    _findURI: function SimpleProtocol__findURI(spec, originalCharset, baseURI, createdURI) {
        for (let i = 0, len = this._dataProviders.length; i < len; i++) {
            let dataProvider = this._dataProviders[i];
            if (typeof dataProvider.newURI != "function") {
                continue;
            }
            try {
                let uri = dataProvider.newURI(spec, originalCharset, baseURI, createdURI);
                if (uri) {
                    return uri;
                }
            } catch (e) {
                Cu.reportError(this._readableName + " _findURI: " + e + ". Spec: " + spec);
            }
        }
        return null;
    },
    _specHasHost: function SimpleProtocol__specHasHost(spec) {
        return spec.substr(0, this._hostEnabledPrefix.length) == this._hostEnabledPrefix;
    },
    _createURI: function SimpleProtocol__createURI(spec, charset, baseURI) {
        let simpleDestURI = !this._specHasHost(spec) && (!baseURI || !this._specHasHost(baseURI.spec));
        let uriCreator = simpleDestURI ? this._makeSimpleURI : this._makeFullURI;
        return uriCreator.call(this, spec, charset, baseURI);
    },
    _makeSimpleURI: function SimpleProtocol__makeSimpleURI(spec, charset, baseURI) {
        try {
            let simpleURI = new simpleURIConstructor();
            simpleURI.spec = spec;
            return simpleURI;
        } catch (e) {
            return null;
        }
    },
    _makeFullURI: function SimpleProtocol__makeFullURI(spec, charset, baseURI) {
        return new SimpleURI(spec, charset, baseURI);
    },
    _findChannel: function SimpleProtocol__findChannel(uri, isSimpleURI) {
        let channel = null;
        for (let i = 0, len = this._dataProviders.length; i < len; i++) {
            let dataProvider = this._dataProviders[i];
            try {
                if (typeof dataProvider.newChannel == "function") {
                    channel = dataProvider.newChannel(uri, isSimpleURI);
                } else if (typeof dataProvider.getContent == "function") {
                    let strData = String(dataProvider.getContent(uri, isSimpleURI));
                    let inputStream = new stringInputStreamConstructor(strData, strData.length);
                    channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
                    channel.setURI(uri);
                    channel.originalURI = uri;
                    channel.contentStream = inputStream;
                }
                if (channel !== null) {
                    return channel;
                }
            } catch (e) {
                Cu.reportError(this._readableName + " _findChannel: " + e + ". Spec: " + uri.spec);
            }
        }
        throw new Error("None of " + this._dataProviders.length + " providers could serve the resource: " + uri.spec);
    }
};
function SimpleURI(spec, originalCharset, baseURI) {
    let standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
    standardURL.init(standardURL.URLTYPE_STANDARD, -1, spec, originalCharset, baseURI);
    standardURL.QueryInterface(Ci.nsIURL);
    this._standardURL = standardURL;
}
SimpleURI.prototype = {
    get wrappedJSObject() {
        return this;
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
    clone: function SimpleURI_clone() {
        return new SimpleURI(this.spec);
    },
    cloneIgnoringRef: function SimpleURI_cloneIgnoringRef() {
        return new SimpleURI(this._standardURL.cloneIgnoringRef().spec);
    },
    equals: function SimpleURI_equals(uri) {
        return this.spec === uri.spec;
    },
    equalsExceptRef: function SimpleURI_equalsExceptRef(uri) {
        return this.spec.split("#")[0] === uri.spec.split("#")[0];
    },
    schemeIs: function SimpleURI_schemeIs(scheme) {
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
}, SimpleURI.prototype);
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
}, SimpleURI.prototype);
