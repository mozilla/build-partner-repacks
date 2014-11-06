"use strict";
const EXPORTED_SYMBOLS = ["sync"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const STATES = {
    NO_SYNC_COMPONENT: 4,
    TOKEN_EXPIRED: 3,
    NOT_AUTHORIZED: 2,
    SYNCING: 1
};
const LOGIN_STATES = {
    NO_AUTH: 1,
    REQUEST: 2,
    AUTH: 3,
    UNKNOWN_ERROR: 4,
    CREDENTIALS_ERROR: 5,
    CAPTCHA_REQUIRED: 6,
    NETWORK_ERROR: 7,
    EXPIRED: 8
};
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "UUID_SVC", "@mozilla.org/uuid-generator;1", "nsIUUIDGenerator");
const sync = {
    init: function Sync_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Sync");
        let topics = this._application.core.eventTopics;
        Services.obs.addObserver(this, topics.APP_TAB_SHOWN, false);
        Services.obs.addObserver(this, topics.SYNC_AUTH_CHANGED, false);
        Services.obs.addObserver(this, topics.SYNC_COMPONENT_ENABLED, false);
        Services.obs.addObserver(this, topics.SYNC_COMPONENT_READY, false);
        Services.obs.addObserver(this, topics.SYNC_COMPONENT_DISABLED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_TOPHISTORY_DISABLED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_PINNED_ENABLED_STARTED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_PINNED_ENABLED_FINISHED, false);
        Services.obs.addObserver(this, topics.SYNC_SERVICE_PINNED_DISABLED, false);
        if (this.svc)
            this._application.syncPinned.engine.addListener("data", this);
    },
    finalize: function Fastdial_finalize(doCleanup, callback) {
        let topics = this._application.core.eventTopics;
        Services.obs.removeObserver(this, topics.APP_TAB_SHOWN);
        Services.obs.removeObserver(this, topics.SYNC_AUTH_CHANGED);
        Services.obs.removeObserver(this, topics.SYNC_COMPONENT_ENABLED);
        Services.obs.removeObserver(this, topics.SYNC_COMPONENT_READY);
        Services.obs.removeObserver(this, topics.SYNC_COMPONENT_DISABLED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_TOPHISTORY_DISABLED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_PINNED_ENABLED_STARTED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_PINNED_ENABLED_FINISHED);
        Services.obs.removeObserver(this, topics.SYNC_SERVICE_PINNED_DISABLED);
        if (this.svc)
            this._application.syncPinned.engine.removeListener("data", this);
        this._application = null;
        this._logger = null;
    },
    observe: function Fastdial_observe(aSubject, aTopic, aData) {
        this._logger.trace("Event caught: " + aTopic);
        switch (aTopic) {
        case this._application.core.eventTopics.SYNC_AUTH_CHANGED:
            try {
                aData = JSON.parse(aData);
            } catch (ex) {
                this._logger.error("Not a JSON string: " + strutils.formatError(ex));
                this._logger.debug(ex.stack);
                return;
            }
            if ([
                    LOGIN_STATES.AUTH,
                    LOGIN_STATES.NO_AUTH,
                    LOGIN_STATES.CREDENTIALS_ERROR,
                    LOGIN_STATES.EXPIRED
                ].indexOf(aData.state) !== -1) {
                this._application.fastdial.sendRequest("sync", this.state);
            }
            break;
        case this._application.core.eventTopics.SYNC_COMPONENT_ENABLED:
            async.nextTick(function () {
                this._application.fastdial.sendRequest("sync", this.state);
            }, this);
            break;
        case this._application.core.eventTopics.SYNC_COMPONENT_READY:
            this._application.syncPinned.engine.addListener("data", this);
            this._application.fastdial.sendRequest("sync", this.state);
            break;
        case this._application.core.eventTopics.SYNC_COMPONENT_DISABLED:
            this._application.syncPinned.engine.removeListener("data", this);
            this._application.fastdial.sendRequest("sync", { status: STATES.NO_SYNC_COMPONENT });
            break;
        case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED:
        case this._application.core.eventTopics.SYNC_SERVICE_PINNED_ENABLED_STARTED:
            this._onAnyEngineStartedLoading();
            this._enabledStarted = true;
            break;
        case this._application.core.eventTopics.SYNC_SERVICE_PINNED_ENABLED_FINISHED:
            this._onAnyEngineFinishedLoading();
            this._application.syncPinned.initFinished = true;
            this._application.syncPinned.processInitial();
            break;
        case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED:
            this._onAnyEngineFinishedLoading();
            this._application.syncTopHistory.initFinished = true;
            this._application.thumbs.pickupThumbs();
            break;
        case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_DISABLED:
            this._application.syncTopHistory.initFinished = false;
            this._application.preferences.set("sync.enabled", false);
            this._application.fastdial.sendRequest("sync", this.state);
            break;
        case this._application.core.eventTopics.SYNC_SERVICE_PINNED_DISABLED:
            this._application.syncPinned.initFinished = false;
            this._application.preferences.set("sync.enabled", false);
            this._application.fastdial.sendRequest("sync", this.state);
            break;
        case "data":
            if (this._enabledStarted)
                return;
            this._logger.trace("Processing data event");
            try {
                this._application.syncPinned.processData(aData, false);
            } catch (ex) {
                this._logger.error(ex.message);
                this._logger.debug(ex.stack);
            }
            break;
        }
    },
    openWP: function Sync_openWP() {
        if (!this.svc)
            return;
        misc.navigateBrowser({ url: this.svc.SYNC_PAGE_URL });
    },
    enableSyncVB: function Sync_enableSyncVB() {
        if (!this.svc)
            return;
        this._application.syncPinned.engine.enabled = true;
        this._application.syncTopHistory.engine.enabled = true;
    },
    get svc() {
        let syncSvc = null;
        try {
            syncSvc = Cc["@yandex.ru/esync;1"].getService().wrappedJSObject;
        } catch (ex) {
        }
        return syncSvc;
    },
    get state() {
        let output = {
            status: null,
            login: null,
            enabled: null
        };
        if (!this.svc) {
            output.status = STATES.NO_SYNC_COMPONENT;
        } else {
            if (this.svc.expired) {
                output.status = STATES.TOKEN_EXPIRED;
            } else {
                if (this.svc.authorized) {
                    output.status = STATES.SYNCING;
                    output.enabled = this._application.syncPinned.engine.enabled && this._application.syncTopHistory.engine.enabled;
                    output.login = this.svc.username;
                } else {
                    output.status = STATES.NOT_AUTHORIZED;
                }
            }
        }
        return output;
    },
    prepareUrlForServer: function Sync_prepareUrlForServer(url) {
        let uri;
        let host;
        try {
            uri = netutils.newURI(url);
        } catch (ex) {
        }
        if (!uri)
            return url;
        try {
            host = uri.host;
        } catch (ex) {
        }
        if (!host)
            return url;
        if (host !== "clck.yandex.ru")
            return this._application.isYandexHost(host) ? this._cutFromParam(url) : url;
        let clickrMatches = uri.path.match(/.+?\*(.+)/);
        if (clickrMatches)
            return this._cutFromParam(clickrMatches[1]);
        let clckrItem = this._application.fastdial.brandingClckrDoc.querySelector("item[url='" + url + "']");
        return clckrItem ? "http://" + clckrItem.getAttribute("domain") : url;
    },
    prepareUrlForSave: function Sync_prepareUrlForSave(url) {
        let uri;
        try {
            uri = netutils.newURI(url);
            if (!this._application.isYandexHost(uri.host)) {
                return url;
            }
        } catch (ex) {
        }
        if (!uri)
            return url;
        try {
            uri.QueryInterface(Ci.nsIURL);
        } catch (ex) {
            return url;
        }
        let parsedQuery = netutils.querystring.parse(uri.query);
        if (parsedQuery.clid) {
            delete parsedQuery.clid;
            let clidData = this._application.clids.vendorData.clid7;
            if (clidData && clidData.clidAndVid) {
                parsedQuery.clid = clidData.clidAndVid;
            }
            uri.query = netutils.querystring.stringify(parsedQuery);
        }
        return uri.spec;
    },
    generateId: function Sync_generateId() {
        return UUID_SVC.generateUUID().toString().substr(1, 8);
    },
    _onAnyEngineStartedLoading: function Sync__onAnyEngineStartedLoading() {
        if (this._application.preferences.get("sync.enabled", false))
            return;
        this._application.preferences.set("sync.enabled", true);
        let evtData = this.state;
        evtData.offer = 0;
        this._application.fastdial.sendRequest("sync", evtData);
    },
    _onAnyEngineFinishedLoading: function Sync__onAnyEngineFinishedLoading() {
        this._enabledStarted = false;
        this._application.preferences.set("ftabs.emptyLastThumb", false);
        this._application.fastdial.sendRequest("sync", this.state);
    },
    _cutFromParam: function Sync__cutFromParam(url) {
        let uri = netutils.newURI(url);
        let dropParamHappened = false;
        try {
            uri.QueryInterface(Ci.nsIURL);
            let parsedQuery = netutils.querystring.parse(uri.query);
            if (parsedQuery.from === this._application.core.CONFIG.APP.TYPE) {
                delete parsedQuery.from;
                dropParamHappened = true;
            }
            uri.query = netutils.querystring.stringify(parsedQuery);
            return dropParamHappened ? uri.spec : url;
        } catch (ex) {
            return url;
        }
    },
    _application: null,
    _logger: null,
    _enabledStarted: false
};
