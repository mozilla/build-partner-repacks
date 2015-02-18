"use strict";
var EXPORTED_SYMBOLS = ["module"];
var topic = "SettingsChanged";
var instance = null;
function module(proxy) {
    var Handlers = proxy.module("sklib.Handlers");
    var Settings = function () {
        if (instance) {
            return instance;
        }
        instance = this;
        var observer = {
            onSettingChange: function (key, value, instanceId) {
                instance.executeHandlers(topic, key, value, instanceId);
            }
        };
        proxy.api.Settings.observeChanges(observer);
    };
    var SettingsPrototype = function () {
        this.getValue = function (key, wiid) {
            return proxy.api.Settings.getValue(key, wiid);
        };
        this.getTimerValueAsMinutes = function (key, wiid) {
            return proxy.api.Settings.getValue(key, wiid) * 60000;
        };
        this.setValue = function (key, value, wiid) {
            return proxy.api.Settings.setValue(key, value, wiid);
        };
        this.addListener = function (listener) {
            return this.addHandler(topic, listener);
        };
        this.removeListener = function (listener) {
            return this.removeHandler(topic, listener);
        };
    };
    SettingsPrototype.prototype = new Handlers();
    Settings.prototype = new SettingsPrototype();
    return Settings;
}
