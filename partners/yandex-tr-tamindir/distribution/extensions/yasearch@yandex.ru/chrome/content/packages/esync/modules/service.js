"use strict";
let EXPORTED_SYMBOLS = ["Service"];
let {Observers} = require("observers");
this.__defineGetter__("Auth", function () {
    delete this.Auth;
    this.Auth = require("auth").Auth;
    return this.Auth;
});
let Service = {
    init: function Service_init() {
        onShutdown.add(this.finalize.bind(this));
        require("wpage");
        require("component");
        let delayedInitTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        delayedInitTimer.initWithCallback(this._delayedInit.bind(this), 5000, delayedInitTimer.TYPE_ONE_SHOT);
        this._delayedInitTimer = delayedInitTimer;
    },
    finalize: function Service_finalize(opts) {
        if (this._delayedInitTimer) {
            this._delayedInitTimer.cancel();
            this._delayedInitTimer = null;
        }
        Observers.notify("ybar:esync:plugin:disable");
        Observers.remove("ybar:esync:auth:changed", this);
        if (this.enabled) {
            this._stopChildren();
        }
        if (opts && opts.stateSwitchedManually) {
            let {Sync} = require("sync");
            Auth.logout();
            Sync.cleanClient();
        }
        this._engineManager = null;
    },
    _delayedInit: function Service__delayedInit() {
        this._delayedInitTimer = null;
        Observers.add("ybar:esync:auth:changed", this);
        if (Auth && Auth.authorized) {
            this.enable();
        }
    },
    enable: function Service_enable() {
        if (this._enabled) {
            return;
        }
        this._runChildren();
        this._enabled = true;
        Observers.notify("ybar:esync:service:ready");
    },
    disable: function Service_disable() {
        if (!this._enabled) {
            return;
        }
        require("observers").Observers.notify("ybar:esync:service:disable");
        this._stopChildren();
        this._enabled = false;
    },
    _engineManager: null,
    get engineManager() {
        if (!this._engineManager) {
            let {EngineManager} = require("engines");
            this._engineManager = new EngineManager();
        }
        return this._engineManager;
    },
    set engineManager(val) {
        this._engineManager = val;
    },
    observe: function Scheduler_observe(subject, topic, data) {
        switch (topic) {
        case "ybar:esync:auth:changed":
            Auth.authorized ? this.enable() : this.disable();
            break;
        }
    },
    _runChildren: function Service__runChildren() {
        require("xmpp").XMPP.init();
        require("sync").Sync.init();
        require("scheduler").Scheduler.init();
        this.engineManager.init();
    },
    _stopChildren: function Service__stopChildren() {
        this.engineManager.finalize();
        require("scheduler").Scheduler.finalize();
        require("sync").Sync.finalize();
        require("xmpp").XMPP.finalize();
    },
    get enabled() this._enabled,
    _enabled: false,
    _delayedInitTimer: null
};
