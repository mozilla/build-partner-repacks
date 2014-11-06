"use strict";
const EXPORTED_SYMBOLS = ["alarms"];
const GLOBAL = this;
const MINUTE = 60000;
let handlers = Object.create(null);
let createdAlarms = Object.create(null);
const alarms = {
    init: function alarms_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this.application = application;
        this._logger = this.application.getLogger("Alarms");
    },
    finalize: function alarms_finalize(application) {
        for (let [
                    name,
                    alarm
                ] in Iterator(createdAlarms)) {
            if (alarm)
                alarm.freeze();
        }
        this.application = null;
        this._logger = null;
    },
    restoreOrCreate: function alarms_restoreOrCreate(name, params) {
        let preferences = this.application.preferences;
        let prefName = "alarms." + name;
        let currentAlarmConfig = preferences.get(prefName, false);
        if (params.handler) {
            this.addListener(name, params.handler, params.ctx);
        }
        if (!params.condition) {
            params.condition = () => true;
        } else if (params.ctx) {
            params.condition = params.condition.bind(params.ctx);
        }
        if (currentAlarmConfig) {
            try {
                currentAlarmConfig = JSON.parse(currentAlarmConfig);
            } catch (err) {
                preferences.reset(prefName);
                this.restoreOrCreate.apply(this, arguments);
                return;
            }
            currentAlarmConfig.condition = params.condition;
            new Alarm(name, currentAlarmConfig);
        } else {
            let newAlarmConfig = {
                expires: params.timeout,
                nextInterval: params.isInterval && params.timeout || undefined,
                saved: Date.now()
            };
            preferences.set(prefName, JSON.stringify(newAlarmConfig));
            newAlarmConfig.condition = params.condition;
            let alarm = new Alarm(name, newAlarmConfig);
            if (params.triggerIfCreated) {
                alarm.trigger([true]);
            }
        }
    },
    create: function alarms_create() {
        this.reset.apply(this, arguments);
        this.restoreOrCreate.apply(this, arguments);
    },
    reset: function alarms_reset(name) {
        let alarm = createdAlarms[name];
        if (alarm) {
            alarm.freeze();
            this.application.preferences.reset(alarm.prefName);
        }
        createdAlarms[name] = null;
    },
    exists: function alarms_exists(name) {
        return Boolean(createdAlarms[name]);
    },
    addListener: function alarms_addListener(name, callback, ctx) {
        handlers[name] = handlers[name] || [];
        handlers[name].push({
            callback: callback,
            ctx: ctx || {}
        });
    }
};
function Alarm(name, params) {
    if (createdAlarms[name])
        return createdAlarms[name];
    if (!name || !params || params.expires === undefined)
        throw new Error("Wrong arguments passed: " + JSON.stringify(arguments));
    this.name = name;
    this._nextInterval = params.nextInterval;
    this._condition = params.condition;
    this.prefName = "alarms." + name;
    let now = Date.now();
    let timePassed = Math.round(Math.abs(now - params.saved) / MINUTE);
    let expires = params.expires - timePassed;
    if (expires <= 0) {
        this._onTick();
    } else {
        this._expires = expires;
        this._timer = new sysutils.Timer(this._onTick.bind(this), expires * MINUTE);
        this._timerCreated = now;
    }
    return createdAlarms[name] = this;
}
Alarm.prototype = {
    constructor: Alarm,
    _onTick: function Alarm__onTick() {
        if (this._timer && this._timer.isRunning)
            this._timer.cancel();
        this._timer = null;
        if (this._nextInterval) {
            this._expires = this._nextInterval;
            this._timer = new sysutils.Timer(this._onTick.bind(this), this._nextInterval * MINUTE);
            this._timerCreated = Date.now();
            alarms.application.preferences.set(this.prefName, JSON.stringify({
                expires: this._nextInterval,
                nextInterval: this._nextInterval,
                saved: Date.now()
            }));
        } else {
            alarms.application.preferences.reset(this.prefName);
        }
        if (this._condition())
            this.trigger([false]);
    },
    freeze: function Alarm_freeze() {
        handlers[this.name] = [];
        if (this._timer) {
            let newExpirationTime = Math.round((this._expires * MINUTE - Math.abs(Date.now() - this._timerCreated)) / MINUTE);
            alarms.application.preferences.set(this.prefName, JSON.stringify({
                expires: newExpirationTime,
                nextInterval: this._nextInterval,
                saved: Date.now()
            }));
            this._timer.cancel();
            this._timer = null;
        }
    },
    trigger: function Alarm_trigger(args) {
        (handlers[this.name] || []).forEach(function (handlerData) {
            handlerData.callback.apply(handlerData.ctx, args);
        });
    }
};
