"use strict";
const EXPORTED_SYMBOLS = ["protocolSupport"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const PAGE_NAME = "tabs";
const protocolSupport = {
    init: function Fastdial_init(application) {
        this._application = application;
        let pageChromeURL = "chrome://" + application.name + "/content/fastdial/layout/newtab.html";
        this._pageChromeURI = Services.io.newURI(pageChromeURL, null, null);
        application.core.protocol.addDataProvider(this);
    },
    finalize: function Fastdial_finalize(doCleanup, callback) {
        this._application.core.protocol.removeDataProvider(this);
        this._pageChromeURI = null;
        this._application = null;
    },
    get url() {
        return this._application.core.CONFIG.APP.PROTOCOL + ":" + PAGE_NAME;
    },
    newChannel: function Fastdial_newChannel(uri, isSimpleURI) {
        return isSimpleURI && uri.path === PAGE_NAME ? Services.io.newChannelFromURI(this._pageChromeURI) : null;
    },
    _application: null,
    _pageChromeURI: null
};
