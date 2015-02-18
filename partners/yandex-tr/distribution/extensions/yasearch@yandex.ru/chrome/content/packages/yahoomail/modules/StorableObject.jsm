var EXPORTED_SYMBOLS = ["module"];
var module = function (application) {
    var file_api = application.api.Files;
    var StorableObject = function (filename) {
        if (filename) {
            this.__load__(filename);
        }
    };
    StorableObject.prototype = new function () {
        this.__save__ = function (filename) {
            var storage = file_api.getWidgetStorage(true), storageData = JSON.stringify(this);
            storage.append(filename);
            file_api.writeTextFile(storage, storageData);
        };
        this.__clear__ = function (filename) {
            var storage = file_api.getWidgetStorage(true), storageData = "";
            storage.append(filename);
            file_api.writeTextFile(storage, storageData);
        };
        this.__load__ = function (filename) {
            var storage = file_api.getWidgetStorage(true);
            storage.append(filename);
            try {
                var storageText = file_api.readTextFile(storage), storageObj = JSON.parse(storageText);
                for (var key in storageObj) {
                    if (storageObj.hasOwnProperty(key)) {
                        this[key] = storageObj[key];
                    }
                }
            } catch (e) {
                application.log("StorableObject load error");
            }
        };
        this.toString = function () {
            return file_api.getWidgetStorage(true).path;
        };
    }();
    return StorableObject;
};
