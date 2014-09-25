"use strict";
const EXPORTED_SYMBOLS = ["alarms"];
const GLOBAL = this;
const MINUTE = 60000;
var handlers = Object.create(null);
var createdAlarms = Object.create(null);
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
            var preferences = this.application.preferences;
            var prefName = "alarms." + name;
            var currentAlarmConfig = preferences.get(prefName, false);
            if (params.handler) {
                this.addListener(name, params.handler);
            }
            if (!params.condition) {
                params.condition = function () true;
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
                    alarm.trigger();
                }
            }
        },
        reset: function alarms_reset(name) {
            var alarm = createdAlarms[name];
            if (alarm) {
                alarm.freeze();
                this.application.preferences.reset(alarm.prefName);
            }
            createdAlarms[name] = null;
        },
        addListener: function alarms_addListener(name, callback) {
            handlers[name] = handlers[name] || [];
            handlers[name].push(callback);
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
    var now = Date.now();
    var timePassed = Math.round(Math.abs(now - params.saved) / MINUTE);
    var expires = params.expires - timePassed;
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
            this.trigger();
    },
    freeze: function Alarm_freeze() {
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
    trigger: function Alarm_trigger() {
        (handlers[this.name] || []).forEach(function (handler) {
            handler();
        });
    }
};
