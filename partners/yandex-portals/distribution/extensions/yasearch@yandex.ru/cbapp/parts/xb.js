"use strict";
const EXPORTED_SYMBOLS = ["XB"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const TOOLKIT_DOMAIN = "toolkit";
const XB = {
        init: function XB_init(application) {
            this._application = application;
            var toolkitDataProvider = new ToolkitDataProvider(application.name, application.core.extensionPathFile);
            application.core.xbProtocol.setDataProvider(TOOLKIT_DOMAIN, toolkitDataProvider);
        },
        finalize: function XB_finalize(doCleanup, callback) {
            this._application.core.xbProtocol.setDataProvider(TOOLKIT_DOMAIN, null);
        },
        _application: null
    };
function ToolkitDataProvider(applicationName, extensionPathFile) {
    this._rootPath = "chrome://" + applicationName + "/content/packages/toolkit";
    var rootFile = extensionPathFile;
    "chrome/content/packages/toolkit".split("/").forEach(function appendPart(part) rootFile.append(part));
    this._pkgsFile = rootFile;
}
ToolkitDataProvider.prototype = {
    constructor: ToolkitDataProvider,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get wrappedJSObject() this,
    get UUID() TOOLKIT_DOMAIN,
    newChannel: function ToolkitDataProvider_newChannel(aURI) {
        var channel = Services.io.newChannel(this._rootPath + aURI.path, null, null);
        channel.originalURI = aURI;
        return channel;
    },
    findFile: function ToolkitDataProvider_findFile(path) {
        var file = this._pkgsFile.clone();
        path.split("/").forEach(function appendPart(part) {
            if (path)
                file.append(part);
        });
        return file;
    },
    _rootPath: null,
    _pkgsFile: null
};
