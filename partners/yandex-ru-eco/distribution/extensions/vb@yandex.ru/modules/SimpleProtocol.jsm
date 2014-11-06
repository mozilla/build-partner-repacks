"use strict";
const EXPORTED_SYMBOLS = ["SimpleProtocol"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu,
    manager: Cm
} = Components;
const IOS = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const InputStreamFabric = Cc["@mozilla.org/io/string-input-stream;1"];
const nsIStringInputStream = Ci.nsIStringInputStream;
const ccSimpleURI = Cc["@mozilla.org/network/simple-uri;1"];
const ccStandardURL = Cc["@mozilla.org/network/standard-url;1"];
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
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
        return IOS.newURI("data:,", null, null);
    },
    newChannel: function SimpleProtocol_newChannel(uri) {
        try {
            let channel = this._findChannel(uri, !this._specHasHost(uri.spec));
            if (!channel) {
                channel = IOS.newChannel("data:,", null, null);
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
            let simpleURI = ccSimpleURI.createInstance(Ci.nsIURI);
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
                    let inputStream = InputStreamFabric.createInstance(nsIStringInputStream);
                    inputStream.setData(strData, strData.length);
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
function SimpleURI(aSpec, aOriginalCharset, aBaseURI) {
    let standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
    standardURL.init(standardURL.URLTYPE_STANDARD, -1, aSpec, aOriginalCharset, aBaseURI);
    standardURL.QueryInterface(Ci.nsIURL);
    this.spec = standardURL.spec;
    this._constructSpec();
}
;
SimpleURI.prototype = {
    get wrappedJSObject() {
        return this;
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIURI,
        Ci.nsIURL,
        Ci.nsIFileURL
    ]),
    get spec() {
        return this._spec;
    },
    set spec(aSpec) {
        this._spec = aSpec;
        this._parse();
    },
    get prePath() {
        return this._prePath;
    },
    get scheme() {
        return this._scheme;
    },
    set scheme(aScheme) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get userPass() {
        return this._userPass || "";
    },
    set userPass(aUserPass) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get username() {
        return this._username || "";
    },
    set username(aUsername) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get password() {
        return this._password || "";
    },
    set password(aPassword) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get hostPort() {
        return CB_CONFIG.APP.NAME;
    },
    set hostPort(aHostPort) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get host() {
        return this._host;
    },
    set host(aHost) {
        this._host = aHost;
        this._constructSpec();
    },
    get port() {
        return this._port;
    },
    set port(aPort) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    get path() {
        return this._path || "";
    },
    set path(aPath) {
        this._path = aPath;
        this._constructSpec();
    },
    get asciiSpec() {
        return this.spec;
    },
    get asciiHost() {
        return this.host;
    },
    get originCharset() {
        return "UTF-8";
    },
    clone: function SimpleURI_clone() {
        return new SimpleURI(this.spec);
    },
    cloneIgnoringRef: function SimpleURI_cloneIgnoringRef() {
        return new SimpleURI(this.spec.split("#")[0]);
    },
    equals: function SimpleURI_equals(aURI) {
        return aURI.spec === this.spec;
    },
    equalsExceptRef: function SimpleURI_equalsExceptRef(aURI) {
        return aURI.spec.split("#")[0] === this.spec.split("#")[0];
    },
    resolve: function SimpleURI_resolve(aRelativePath) {
        if (typeof aRelativePath != "string") {
            throw Cr.NS_ERROR_MALFORMED_URI;
        }
        if (aRelativePath) {
            if (aRelativePath.indexOf(this.scheme + "://") == 0) {
                return aRelativePath;
            }
            if (aRelativePath.indexOf("//") == 0) {
                return this.scheme + ":" + aRelativePath;
            }
            if (aRelativePath[0] == "/") {
                return this.scheme + "://" + this.host + aRelativePath;
            }
            if (aRelativePath[0] == "#") {
                return this.scheme + "://" + this.host + this.path + aRelativePath;
            }
        }
        return this.scheme + "://" + this.host + this.path.replace(/[^\/]*$/, "") + aRelativePath;
    },
    schemeIs: function SimpleURI_schemeIs(aScheme) {
        aScheme = aScheme.toLowerCase();
        return aScheme == this.scheme || aScheme == "chrome" && /\.dtd$/.test(this.spec);
    },
    get directory() {
        return this._directory || "";
    },
    set directory(aDirectory) {
        this._directory = aDirectory;
        this._constructFilePath();
    },
    get fileBaseName() {
        return this._fileBaseName || "";
    },
    set fileBaseName(aFileBaseName) {
        this._fileBaseName = aFileBaseName;
        this._constructFileName();
    },
    get fileExtension() {
        return this._fileExtension || "";
    },
    set fileExtension(aFileExtension) {
        this._fileExtension = aFileExtension;
        this._constructFileName();
    },
    get fileName() {
        return this._fileName || "";
    },
    set fileName(aFileName) {
        this._fileName = aFileName;
        this._constructFilePath();
    },
    get filePath() {
        return this._filePath || "";
    },
    set filePath(aFilePath) {
        this._filePath = aFilePath;
        this._constructPath();
    },
    get query() {
        return this._query || "";
    },
    set query(aQuery) {
        this._query = aQuery;
        this._constructPath();
    },
    get ref() {
        return this._ref || "";
    },
    set ref(aRef) {
        this._ref = aRef;
        this._constructPath();
    },
    getCommonBaseSpec: function SimpleURI_getCommonBaseSpec(aURIToCompare) {
        return "";
    },
    getRelativeSpec: function SimpleURI_getRelativeSpec(aURIToCompare) {
        return "";
    },
    get file() {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    set file(val) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    _ERR_MALFORMED_URI: "Malformed protocol URI: ",
    _spec: "",
    _prePath: "",
    _scheme: "",
    _userPass: "",
    _username: "",
    _password: "",
    _hostPort: "",
    _host: "",
    _port: -1,
    _path: "",
    _filePath: "",
    _directory: "",
    _fileName: "",
    _fileBaseName: "",
    _fileExtension: "",
    _query: "",
    _ref: "",
    _parse: function SimpleURI__parse() {
        if (!this._spec) {
            Cu.reportError(this._ERR_MALFORMED_URI);
            throw Cr.NS_ERROR_MALFORMED_URI;
        }
        let standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
        standardURL.init(standardURL.URLTYPE_STANDARD, -1, this._spec, null, null);
        standardURL = standardURL.QueryInterface(Ci.nsIURL);
        [
            "prePath",
            "scheme",
            "userPass",
            "username",
            "password",
            "hostPort",
            "host",
            "port",
            "path",
            "filePath",
            "directory",
            "fileName",
            "fileBaseName",
            "fileExtension",
            "query",
            "ref"
        ].forEach(function (p) {
            this["_" + p] = standardURL[p];
        }, this);
    },
    _constructFileName: function SimpleURI__constructFileName() {
        this._fileName = this._fileBaseName + (this._fileExtension ? "." + this._fileExtension : "");
        this._constructFilePath();
    },
    _constructFilePath: function SimpleURI__constructFilePath() {
        this._filePath = this._directory + this._fileName;
        this._constructPath();
    },
    _constructPath: function SimpleURI__constructPath() {
        this._path = this._filePath + (this._query ? "?" + this._query : "") + (this._ref ? "#" + this._ref : "");
        this._constructSpec();
    },
    _constructSpec: function SimpleURI__constructSpec() {
        this._spec = this._scheme + "://" + this._host + this._path;
    }
};
