EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var log = function (str, method) {
        common.log("[-common.storage]: " + str, method);
    };
    var StorableObject = function (filename, cons) {
        this._storageFileName = filename;
        this._storageTypeIsJSON = /\.json$/i.test(filename);
        this.constructor = cons;
    };
    var undf = void 0;
    function nvl(v) {
        if (v === null || v === undf) {
            return "";
        }
        return typeof v !== "string" ? v.toString() : v;
    }
    function stringify(obj) {
        return common.DEBUG ? JSON.stringify(obj, "", 3) : JSON.stringify(obj);
    }
    StorableObject.prototype = {
        constructor: StorableObject,
        save: function (key, value) {
            if (arguments.length) {
                if (this._storageTypeIsJSON) {
                    if (key && value !== undf) {
                        this[key] = value;
                    }
                } else {
                    this.data = arguments.length > 2 && key == "data" ? value : key;
                }
            }
            var storage = common.api.Files.getWidgetStorage(true), storageData = this._storageTypeIsJSON ? stringify(this) : nvl(this.data);
            storage.append(this._storageFileName);
            try {
                common.api.Files.writeTextFile(storage, storageData);
            } catch (exc) {
                Components.utils.reportError(exc);
            }
        },
        load: function () {
            var storage = common.api.Files.getWidgetStorage(true);
            storage.append(this._storageFileName);
            try {
                var storageText = common.api.Files.readTextFile(storage) || "";
                if (this._storageTypeIsJSON) {
                    var storageObj = JSON.parse(storageText);
                    common.utils.copy(storageObj, this.clear());
                } else {
                    this.data = storageText;
                }
            } catch (e) {
                log("error read file \"" + this._storageFileName + "\"");
                if (!this._storageTypeIsJSON) {
                    this.data = nvl(this.data);
                }
            }
            return this;
        },
        clear: function () {
            if (!this._storageTypeIsJSON) {
                this.data = "";
            } else {
                var keys = arguments;
                if (!keys.length) {
                    keys = [];
                    for (var key in this) {
                        if (this.hasOwnProperty(key)) {
                            keys.push(key);
                        }
                    }
                }
                for (var i = 0; i < keys.length; ++i) {
                    if (this.hasOwnProperty(keys[i])) {
                        delete this[keys[i]];
                    }
                }
            }
            return this;
        }
    };
    var storages = {};
    var autoSave = false;
    var mod = function (fileName) {
        if (!fileName || !storages) {
            return null;
        }
        var stor = storages[fileName];
        if (!stor) {
            var func = function () {
                this.load();
            };
            func.prototype = new StorableObject(fileName, func);
            storages[fileName] = stor = new func();
        }
        return stor;
    };
    mod.setAutoSave = function (asave) {
        autoSave = asave !== false;
    };
    mod.saveAll = function () {
        if (storages) {
            for (var key in storages) {
                if (storages.hasOwnProperty(key)) {
                    storages[key].save();
                }
            }
        }
    };
    mod.finalize = function () {
        log("finalize");
        if (autoSave) {
            this.saveAll();
        }
        autoSave = false;
        storages = {};
    };
    return mod;
};
