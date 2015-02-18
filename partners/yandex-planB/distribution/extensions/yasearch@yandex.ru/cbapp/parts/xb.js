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
        let toolkitDataProvider = new ToolkitDataProvider(application.name);
        application.core.xbProtocol.setDataProvider(TOOLKIT_DOMAIN, toolkitDataProvider);
    },
    finalize: function XB_finalize(doCleanup, callback) {
        this._application.core.xbProtocol.setDataProvider(TOOLKIT_DOMAIN, null);
    },
    _application: null
};
function ToolkitDataProvider(applicationName) {
    this._rootPath = "chrome://" + applicationName + "/content/packages/toolkit";
}
ToolkitDataProvider.prototype = {
    constructor: ToolkitDataProvider,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get wrappedJSObject() {
        return this;
    },
    get UUID() {
        return TOOLKIT_DOMAIN;
    },
    newChannel: function ToolkitDataProvider_newChannel(aURI) {
        let channel = Services.io.newChannel(this._rootPath + aURI.path, null, null);
        channel.originalURI = aURI;
        return channel;
    },
    _rootPath: null
};
