"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (application, fileAPI) {
    function StorableObject(filename) {
        if (filename) {
            this.__load__(filename);
        }
    }
    StorableObject.prototype = {
        __save__: function (filename) {
            var storage = fileAPI.getWidgetStorage(true);
            var storageData = JSON.stringify(this);
            storage.append(filename);
            fileAPI.writeTextFile(storage, storageData);
        },
        __load__: function (filename) {
            var storage = fileAPI.getWidgetStorage(true);
            storage.append(filename);
            try {
                var storageText = fileAPI.readTextFile(storage);
                var storageObj = JSON.parse(storageText);
                for (var key in storageObj) {
                    if (storageObj.hasOwnProperty(key)) {
                        this[key] = storageObj[key];
                    }
                }
            } catch (e) {
            }
        },
        toString: function () {
            return fileAPI.getWidgetStorage(true).path;
        }
    };
    return StorableObject;
};
