EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var log = function (str, method) {
        common.log("[-common.timers]: " + str, method);
    };
    var Cc = Components.classes["@mozilla.org/timer;1"];
    var MAX_EXPANDING_SKIPS = 2;
    function Timer(ms, callback, scope, started) {
        var self = this;
        this._callback = function () {
            var canCall = true;
            if (self._expandingMode) {
                canCall = self._expandingCurrent >= self._expandingSkipCount;
                if (canCall) {
                    if (self._expandingSkipCount < self._maxSkipCount) {
                        self._expandingSkipCount++;
                    }
                    self._expandingCurrent = 0;
                } else {
                    self._expandingCurrent++;
                }
            }
            log("try call: " + canCall);
            if (canCall) {
                callback.call(scope || self);
            }
        };
        this._interval = 0;
        this._maxSkipCount = MAX_EXPANDING_SKIPS;
        this._expandingMode = false;
        this.setInterval(ms);
        if (started) {
            this.start();
        }
    }
    Timer.prototype = {
        constructor: Timer,
        setInterval: function (v) {
            v = Number(v);
            if (this._interval != v) {
                this._interval = v;
                var started = this._timer;
                this.stop();
                if (started) {
                    this.start();
                }
            }
        },
        start: function () {
            if (!this._timer && this._interval > 1) {
                this._expandingSkipCount = 0;
                this._timer = thisModule.setInterval(this._callback, this._interval);
            }
        },
        stop: function () {
            if (this._timer) {
                this._timer.cancel();
                this._timer = null;
            }
        },
        setExpanding: function (state) {
            state = state !== false;
            if (this._expandingMode == state) {
                return;
            }
            this._expandingMode = state;
            log("setExpanding " + state);
            if (state) {
                this._expandingSkipCount = 1;
                this._expandingCurrent = 0;
            }
        },
        finalize: function () {
            this.stop();
            this._callback = null;
            this._interval = 0;
        }
    };
    var timers = [];
    var thisModule = {
        setTimeout: function (func, ms, scope) {
            if (arguments.length > 2) {
                func = func.bind(scope);
            }
            var tmr = Cc.createInstance(Components.interfaces.nsITimer);
            tmr.initWithCallback(func, ms, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
            return tmr;
        },
        setInterval: function (func, ms, scope) {
            if (arguments.length > 2) {
                func = func.bind(scope);
            }
            var tmr = Cc.createInstance(Components.interfaces.nsITimer);
            tmr.initWithCallback(func, ms, Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE);
            return tmr;
        },
        create: function (ms, callback, scope, started) {
            if (typeof ms == "function") {
                started = scope;
                scope = callback;
                callback = ms;
                ms = 0;
            }
            var tmr = new Timer(ms, callback, scope, started);
            timers.push(tmr);
            return tmr;
        },
        stopAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].stop();
            }
        },
        startAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].start();
            }
        },
        finalize: function () {
            log("finalize");
            for (var i = 0; i < timers.length; ++i) {
                timers[i].finalize();
            }
            timers = [];
        }
    };
    return thisModule;
};
