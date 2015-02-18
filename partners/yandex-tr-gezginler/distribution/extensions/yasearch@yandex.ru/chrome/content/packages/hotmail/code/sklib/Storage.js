"use strict";
var EXPORTED_SYMBOLS = ["module"];
var unloadCallbacks = [];
function module(proxy) {
    var fileAPI = proxy.api.Files;
    proxy.onmoduleunload = function () {
        for (var i = 0, l = unloadCallbacks.length; i < l; ++i) {
            try {
                unloadCallbacks[i]();
            } catch (e) {
            }
        }
    };
    var StorageWrapper = function (key) {
        var data = {};
        var tmpData = {};
        var loaded = false;
        var modified = false;
        var keyPrefix = "";
        var writeDelay = 1000;
        var writeTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        var listeners = {};
        function getNativeStorage(key) {
            var filename = key + ".json";
            var storage = fileAPI.getWidgetStorage(true);
            storage.append(filename);
            return storage;
        }
        function mergeTmpData() {
            for (var i in tmpData) {
                if (tmpData.hasOwnProperty(i)) {
                    data[i] = tmpData[i];
                }
            }
        }
        function load() {
            var storage = getNativeStorage(key);
            try {
                var storageText = fileAPI.readTextFile(storage);
                data = JSON.parse(storageText);
            } catch (e) {
                proxy.logger.warn(e);
            }
            mergeTmpData();
            tmpData = {};
            loaded = true;
        }
        function save() {
            writeTimer.cancel();
            if (!loaded) {
                load();
            }
            var storage = getNativeStorage(key);
            var storageData = JSON.stringify(data);
            fileAPI.writeTextFile(storage, storageData);
            modified = false;
        }
        function saveDelayed() {
            writeTimer.initWithCallback(function () {
                save();
            }, writeDelay, writeTimer.TYPE_ONE_SHOT);
        }
        function executeListeners(topic, key, newValue) {
            var topicListeners = listeners[topic];
            var execList = [];
            var i, l;
            if (topicListeners) {
                for (i = 0, l = topicListeners.length; i < l; ++i) {
                    if (topicListeners[i]) {
                        execList.push(topicListeners[i]);
                    }
                }
            }
            for (i = 0, l = execList.length; i < l; ++i) {
                try {
                    execList[i](topic, key, newValue);
                } catch (e) {
                }
            }
        }
        var unloadCallback = function () {
            if (modified) {
                save();
            }
        };
        unloadCallbacks.push(unloadCallback);
        var Storage = function () {
        };
        Storage.prototype = {
            getValue: function (key) {
                var dataKey = keyPrefix + key;
                var dataValue;
                if (!loaded) {
                    if (tmpData.hasOwnProperty(dataKey)) {
                        dataValue = tmpData[dataKey];
                    } else {
                        load();
                        dataValue = data[dataKey];
                    }
                } else {
                    dataValue = data[dataKey];
                }
                return dataValue;
            },
            setValue: function (key, value) {
                modified = true;
                if (!loaded) {
                    tmpData[keyPrefix + key] = value;
                } else {
                    data[keyPrefix + key] = value;
                }
                saveDelayed();
                executeListeners("changed", key, value);
            },
            cleanValue: function (key) {
                proxy.logger.trace("cleanValue");
                modified = true;
                if (!loaded) {
                    load();
                }
                delete data[keyPrefix + key];
                saveDelayed();
                executeListeners("changed", key);
            },
            addListener: function (topic, handler) {
                if (!listeners[topic]) {
                    listeners[topic] = [];
                }
                listeners[topic].push(handler);
            },
            removeListener: function (topic, handler) {
                if (listeners[topic]) {
                    var idx = listners[topic].indexOf(handler);
                    delete listeners[topic][idx];
                }
            }
        };
        return new Storage();
    };
    return StorageWrapper;
}
