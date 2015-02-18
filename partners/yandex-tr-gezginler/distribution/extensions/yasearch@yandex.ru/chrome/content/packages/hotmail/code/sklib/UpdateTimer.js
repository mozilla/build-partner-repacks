"use strict";
var EXPORTED_SYMBOLS = ["module"];
var nsTimer = Components.classes["@mozilla.org/timer;1"];
var nsITimer = Components.interfaces.nsITimer;
var instances = [];
function module(proxy) {
    proxy.onmoduleunload = function () {
        for (var i = 0, l = instances.length; i < l; ++i) {
            if (instances[i]) {
                instances[i].stop();
                delete instances[i];
            }
        }
    };
    var UpdateTimer = function (updateInterval, failUpdateInterval) {
        this._updating = false;
        this._lastUpdatedError = false;
        this._lastUpdatedTimestamp = 0;
        this._updateInterval = updateInterval || 5 * 60000;
        this._failUpdateInterval = failUpdateInterval || this._updateInterval / 3;
        this.dataUpdateTimer = nsTimer.createInstance(nsITimer);
        instances.push(this);
        this.ontimer = function (callbacks) {
            callbacks.success();
        };
    };
    UpdateTimer.prototype = {
        _updateCheck: function () {
            if (this._updating) {
                return;
            }
            var now = new Date();
            var nextRequestInterval = this._lastUpdatedError ? this._failUpdateInterval : this._updateInterval;
            if (this._lastUpdatedTimestamp + nextRequestInterval < +now) {
                this.update();
            }
        },
        _setUpdatingFlag: function () {
            this._updating = true;
        },
        _unsetUpdatingFlag: function () {
            this._lastUpdatedTimestamp = +new Date();
            this._updating = false;
        },
        setUpdateIntervalAsSeconds: function (aSeconds) {
            this.setUpdateInterval(aSeconds * 1000);
        },
        setUpdateIntervalAsMinutes: function (aMinutes) {
            this.setUpdateInterval(aMinutes * 1000 * 60);
        },
        setUpdateInterval: function (interval) {
            this._updateInterval = interval;
        },
        update: function () {
            var _this = this;
            if (!this._updating) {
                this._setUpdatingFlag();
            } else {
                return;
            }
            this.ontimer({
                success: function () {
                    _this._unsetUpdatingFlag();
                    _this._lastUpdatedError = false;
                },
                error: function () {
                    _this._unsetUpdatingFlag();
                    _this._lastUpdatedError = true;
                }
            });
        },
        start: function (forced) {
            var checkInterval = 1000;
            var _this = this;
            this.dataUpdateTimer.initWithCallback(function () {
                _this._updateCheck();
            }, checkInterval, nsITimer.TYPE_REPEATING_SLACK);
            if (forced) {
                this.update();
            }
        },
        stop: function () {
            this.dataUpdateTimer.cancel();
        }
    };
    return UpdateTimer;
}
