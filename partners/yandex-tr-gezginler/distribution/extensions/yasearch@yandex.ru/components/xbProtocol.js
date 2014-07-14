"use strict";
const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
const EXTENSION_PATH = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newFileURI(__LOCATION__.parent.parent).spec;
Cu.import(EXTENSION_PATH + "config.js");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const CLASS_ID = "{6BA7D0A8-A115-11DE-8D96-029555D89593}";
const SCHEME = "xb";
this.__defineGetter__("G_XB_HANDLER", function () {
    delete this.G_XB_HANDLER;
    return this.G_XB_HANDLER = Cc[XBProtocolHandler.prototype.contractID].getService(Ci.nsIProtocolHandler).wrappedJSObject;
});
function XBProtocolHandler() {
    this._providers = Object.create(null);
}
;
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
        if (aProvider)
            this._providers[aUUID] = aProvider;
        else
            delete this._providers[aUUID];
    },
    getDataProvider: function XBProtocolHandler_getDataProvider(aUUID) {
        if (!(aUUID in this._providers))
            throw Cr.NS_ERROR_NOT_AVAILABLE;
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
        var uri = new XBProtocolHandler.XBURI(aSpec, aOriginalCharset, aBaseURI);
        return uri;
    },
    newChannel: function XBProtocolHandler_newChannel(aURI) {
        var uri = aURI.wrappedJSObject;
        try {
            var provider = uri.dataProvider;
        } catch (e) {
            Cu.reportError("XB protocol couldn't get data provider for URI: " + aURI.spec);
        }
        if (!provider)
            throw Cr.NS_ERROR_FAILURE;
        return provider.newChannel(uri);
    },
    _destroy: function XBProtocolHandler__destroy() {
        this._providers = null;
    }
};
XBProtocolHandler.XBURI = function XBURI(aSpec, aOriginalCharset, aBaseURI) {
    var standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
    standardURL.init(standardURL.URLTYPE_STANDARD, -1, aSpec, aOriginalCharset, aBaseURI);
    standardURL.QueryInterface(Ci.nsIURL);
    this.spec = standardURL.spec;
    this._constructSpec();
};
XBProtocolHandler.XBURI.prototype = {
    get wrappedJSObject() {
        return this;
    },
    get dataProvider() {
        if (!this._dataProvider)
            this._dataProvider = G_XB_HANDLER.getDataProvider(this._host);
        return this._dataProvider.wrappedJSObject;
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
    clone: function XBURI_clone() {
        return new XBProtocolHandler.XBURI(this.spec);
    },
    cloneIgnoringRef: function XBURI_cloneIgnoringRef() {
        return new XBProtocolHandler.XBURI(this.spec.split("#")[0]);
    },
    equals: function XBURI_equals(aURI) {
        return aURI.spec === this.spec;
    },
    equalsExceptRef: function XBURI_equalsExceptRef(aURI) {
        return aURI.spec.split("#")[0] === this.spec.split("#")[0];
    },
    resolve: function XBURI_resolve(aRelativePath) {
        if (typeof aRelativePath != "string")
            throw Cr.NS_ERROR_MALFORMED_URI;
        if (aRelativePath) {
            if (aRelativePath.indexOf(this.scheme + "://") == 0)
                return aRelativePath;
            if (aRelativePath.indexOf("//") == 0)
                return this.scheme + ":" + aRelativePath;
            if (aRelativePath[0] == "/")
                return this.scheme + "://" + this.host + aRelativePath;
            if (aRelativePath[0] == "#")
                return this.scheme + "://" + this.host + this.path + aRelativePath;
        }
        return this.scheme + "://" + this.host + this.path.replace(/[^\/]*$/, "") + aRelativePath;
    },
    schemeIs: function XBURI_schemeIs(aScheme) {
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
    getCommonBaseSpec: function XBURI_getCommonBaseSpec(aURIToCompare) {
        return "";
    },
    getRelativeSpec: function XBURI_getRelativeSpec(aURIToCompare) {
        return "";
    },
    get file() {
        return this.dataProvider.findFile(this.filePath);
    },
    set file(val) {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    _dataProvider: null,
    _ERR_MALFORMED_URI: "Malformed XB protocol URI: ",
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
    _parse: function XBURI__parse() {
        if (!this._spec) {
            Cu.reportError(this._ERR_MALFORMED_URI);
            throw Cr.NS_ERROR_MALFORMED_URI;
        }
        var standardURL = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
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
        ].forEach(function (p) this["_" + p] = standardURL[p], this);
        if (this._scheme !== SCHEME) {
            Cu.reportError(this._ERR_MALFORMED_URI + this._spec);
            throw Cr.NS_ERROR_MALFORMED_URI;
        }
    },
    _constructFileName: function XBURI__constructFileName() {
        this._fileName = this._fileBaseName + (this._fileExtension ? "." + this._fileExtension : "");
        this._constructFilePath();
    },
    _constructFilePath: function XBURI__constructFilePath() {
        this._filePath = this._directory + this._fileName;
        this._constructPath();
    },
    _constructPath: function XBURI__constructPath() {
        this._path = this._filePath + (this._query ? "?" + this._query : "") + (this._ref ? "#" + this._ref : "");
        this._constructSpec();
    },
    _constructSpec: function XBURI__constructSpec() {
        this._spec = this._scheme + "://" + this._host + this._path;
    }
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([XBProtocolHandler]);
