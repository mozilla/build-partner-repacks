"use strict";
const EXPORTED_SYMBOLS = ["protocolSupport"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const PAGE_NAME = "tabs";
const protocolSupport = {
        init: function Fastdial_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._pageChromeURI = netutils.newURI("chrome://" + this._application.name + "/content/fastdial/layout/newtab.html");
            this._application.core.protocol.addDataProvider(this);
        },
        finalize: function Fastdial_finalize(doCleanup, callback) {
            this._application.core.protocol.removeDataProvider(this);
            this._pageChromeURI = null;
            this._application = null;
            this._logger = null;
        },
        get url() {
            return this._application.core.CONFIG.APP.PROTOCOL + ":" + PAGE_NAME;
        },
        newChannel: function Fastdial_newChannel(aURI, isSimpleURI) {
            return isSimpleURI && aURI.path === PAGE_NAME ? netutils.ioService.newChannelFromURI(this._pageChromeURI) : null;
        },
        _application: null,
        _logger: null,
        _pageChromeURI: null
    };
