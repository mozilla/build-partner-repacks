"use strict";
let EXPORTED_SYMBOLS = ["Scheduler"];
let {Utils} = require("utils");
let {Observers} = require("observers");
let {Sync} = require("sync");
let {Service} = require("service");
[[
        "IDLE_SERVICE",
        "@mozilla.org/widget/idleservice;1",
        "nsIIdleService"
    ]].forEach(function ([
    name,
    contract,
    iface
]) {
    XPCOMUtils.defineLazyServiceGetter(this, name, contract, iface);
}, this);
let Scheduler = {
    get nextSync() NativeAPI.Settings.getValue("scheduler.nextSync") * 1000,
    set nextSync(val) NativeAPI.Settings.setValue("scheduler.nextSync", Math.floor(val / 1000)),
    get syncInterval() NativeAPI.Settings.getValue("scheduler.syncInterval") || this.idleInterval,
    set syncInterval(val) NativeAPI.Settings.setValue("scheduler.syncInterval", val),
    setDefaults: function Scheduler_setDefaults() {
        this.idleInterval = NativeAPI.Settings.getValue("scheduler.idleInterval") * 1000;
        this.activeInterval = NativeAPI.Settings.getValue("scheduler.activeInterval") * 1000;
        this.immediateInterval = NativeAPI.Settings.getValue("scheduler.immediateInterval") * 1000;
        this.idleTime = NativeAPI.Settings.getValue("scheduler.idleTime") * 1000;
        this.idle = false;
        this.hasIncomingItems = false;
        this.clearTriggers();
        this.cleanupPlansData();
        this._enginesToUpdate = [];
    },
    init: function Scheduler_init() {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        this._logger = NativeAPI.logger.getLogger("Scheduler");
        this.setDefaults();
        this._NOTIFICATIONS.forEach(function (topic) {
            Observers.add(topic, this);
        }, this);
        IDLE_SERVICE.addIdleObserver(this, this.idleTime);
    },
    finalize: function Scheduler_finalize() {
        if (!this._enabled) {
            return;
        }
        this._enabled = false;
        this._NOTIFICATIONS.forEach(function (topic) {
            Observers.remove(topic, this);
        }, this);
        IDLE_SERVICE.removeIdleObserver(this, this.idleTime);
        if (this._throttledSync) {
            this._throttledSync.cancel();
            this._throttledSync = null;
        }
        this.setDefaults();
        this._logger = null;
    },
    observe: function Scheduler_observe(subject, topic, data) {
        this._logger.debug(topic);
        switch (topic) {
        case "idle":
            this.idle = true;
            this.adjustSyncInterval();
            break;
        case "ybar:esync:engine:Autofill:sync:start":
        case "ybar:esync:engine:Bookmarks:sync:start":
        case "ybar:esync:engine:Nigori:sync:start":
        case "ybar:esync:engine:Pinned:sync:start":
        case "ybar:esync:engine:Passwords:sync:start":
        case "ybar:esync:engine:Tophistory:sync:start":
        case "ybar:esync:engine:Typedurls:sync:start":
        case "ybar:esync:engine:Deviceinfo:sync:start":
            this.throttledSync();
            break;
        case "ybar:esync:engine:Autofill:update:start":
        case "ybar:esync:engine:Bookmarks:update:start":
        case "ybar:esync:engine:Nigori:update:start":
        case "ybar:esync:engine:Passwords:update:start":
        case "ybar:esync:engine:Pinned:update:start":
        case "ybar:esync:engine:Tophistory:update:start":
        case "ybar:esync:engine:Typedurls:update:start":
        case "ybar:esync:engine:Deviceinfo:update:start":
            let engine = topic.match(/ybar:esync:engine:(\w+):update:start/)[1];
            this.update(engine, subject);
            break;
        case "back":
            this.idle = false;
            Utils.namedTimer(function onBack() {
                if (this.idle) {
                    return;
                }
                this.scheduleNextSync(0);
            }, 100, this, "idleDebouncerTimer");
            break;
        }
    },
    adjustSyncInterval: function Scheduler_adjustSyncInterval() {
        if (this.idle) {
            this.syncInterval = this.idleInterval;
            return;
        }
        if (this.hasIncomingItems) {
            this.hasIncomingItems = false;
            this.syncInterval = this.immediateInterval;
        } else {
            this.syncInterval = this.activeInterval;
        }
    },
    get throttledSync() {
        if (!this._throttledSync) {
            this._throttledSync = Utils.throttle(this.sync.bind(this), 500);
        }
        return this._throttledSync;
    },
    sync: function Scheduler_sync() {
        Utils.nextTick(Sync.commit.bind(Sync));
    },
    update: function Scheduler_update(engineOrList, opts) {
        let func = this.update;
        let engineList = [];
        opts = opts || {};
        function Scheduler_updateInternal(engineOrList, engineOpts) {
            this._logger.debug("update", engineOrList);
            engineOrList = engineOrList || Service.engineManager.enabledEngines;
            if (!Array.isArray(engineOrList)) {
                engineOrList = [engineOrList];
            }
            engineOrList.forEach(function addEngine(engine) {
                if (engineList.indexOf(engine) === -1) {
                    engineList.push(engine);
                }
            }, this);
            NativeAPI.SysUtils.copyProperties(engineOpts, opts);
            Utils.namedTimer(this._updateTimer ? null : function () {
                Sync.update(engineList, opts);
                this.update = func;
            }.bind(this), this._UPDATE_TRESHOLD, this, "_updateTimer");
        }
        this.update = Scheduler_updateInternal;
        this.update(engineOrList, opts);
    },
    plan: function Scheduler_plan(action, data) {
        if (!this._enabled) {
            return;
        }
        this._logger.debug("Plan", action);
        if (++this._plansCount > this._MAX_PLANS_BY_SESSION) {
            return;
        }
        let timerName;
        let func;
        if (action === "update") {
            timerName = "_planTimerUpdate";
            let engines = data;
            engines.forEach(function (engine) {
                if (this._enginesToUpdate.indexOf(engine) === -1) {
                    this._enginesToUpdate.push(engine);
                }
            }, this);
            func = function () {
                this.update(this._enginesToUpdate);
                this._enginesToUpdate = [];
            }.bind(this);
        } else {
            this._logger.error("Wrong plan action: ", action);
            return;
        }
        this._planTimeout = this._planTimeout * 3 || this._PLAN_TRESHOLD;
        this._planTimeout = Math.min(this._planTimeout, this._MAX_PLAN_TIMEOUT);
        this._logger.debug("Timeout: " + this._planTimeout);
        Utils.namedTimer(func, this._planTimeout, this, timerName);
    },
    cleanupPlansData: function Scheduler_cleanupPlansData() {
        this._planTimeout = null;
        this._plansCount = 0;
    },
    scheduleNextSync: function Scheduler_scheduleNextSync(interval) {
        if (!interval) {
            interval = this.syncInterval;
        }
        interval = Math.max(0, interval);
        if (this._syncTimer && this.nextSync !== 0) {
            let currentInterval = this.nextSync - Date.now();
            if (currentInterval < interval) {
                return;
            }
        }
        this._logger.debug("Next sync in " + interval + " ms.");
        Utils.namedTimer(this.sync, interval, this, "_syncTimer");
        this.nextSync = Date.now() + interval;
    },
    delayedConnect: function Scheduler_delayedConnect(delay) {
        Utils.namedTimer(this.autoConnect, delay * 1000, this, "_autoTimer");
    },
    autoConnect: function Scheduler_autoConnect() {
        this.scheduleNextSync(this.nextSync - Date.now());
        if (this._autoTimer) {
            this._autoTimer.clear();
            this._autoTimer = null;
        }
    },
    clearTriggers: function Scheduler_clearTriggers() {
        this.nextSync = 0;
        [
            "_updateTimer",
            "_planTimerUpdate",
            "_syncTimer",
            "_autoTimer"
        ].forEach(function (timerName) {
            if (!this[timerName]) {
                return;
            }
            this[timerName].clear();
            this[timerName] = null;
        }, this);
    },
    _throttledSync: null,
    _updateTimer: null,
    _planTimerUpdate: null,
    _syncTimer: null,
    _autoTimer: null,
    _enabled: false,
    _NOTIFICATIONS: [
        "ybar:esync:engine:Autofill:sync:start",
        "ybar:esync:engine:Bookmarks:sync:start",
        "ybar:esync:engine:Nigori:sync:start",
        "ybar:esync:engine:Pinned:sync:start",
        "ybar:esync:engine:Passwords:sync:start",
        "ybar:esync:engine:Tophistory:sync:start",
        "ybar:esync:engine:Typedurls:sync:start",
        "ybar:esync:engine:Deviceinfo:sync:start",
        "ybar:esync:engine:Autofill:update:start",
        "ybar:esync:engine:Bookmarks:update:start",
        "ybar:esync:engine:Nigori:update:start",
        "ybar:esync:engine:Pinned:update:start",
        "ybar:esync:engine:Passwords:update:start",
        "ybar:esync:engine:Tophistory:update:start",
        "ybar:esync:engine:Typedurls:update:start",
        "ybar:esync:engine:Deviceinfo:update:start"
    ],
    _UPDATE_TRESHOLD: 500,
    _planTimeout: null,
    _plansCount: 0,
    _enginesToUpdate: [],
    _MAX_PLANS_BY_SESSION: 100,
    _MAX_PLAN_TIMEOUT: 15 * 60 * 1000,
    _PLAN_TRESHOLD: 3000
};
