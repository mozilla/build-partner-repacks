"use strict";
const EXPORTED_SYMBOLS = ["backup"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const SYNC_THROTTLE_TIMEOUT_MS = 15000 * 60;
const MAX_BACKUPS_COUNT = 7;
const backup = {
    init: function (application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Backup");
        this._timers = Object.create(null);
        this._reloadableModules = [];
        this._application.alarms.restoreOrCreate("createBackup", {
            isInterval: true,
            timeout: 60 * 24,
            handler: () => this._createBackup()
        });
    },
    finalize: function () {
        Object.keys(this._timers).forEach(key => {
            let timer = this._timers[key];
            if (timer.isRunning) {
                timer.notify();
            }
        });
        this._reloadableModules = null;
        this._timers = null;
        this._logger = null;
        this._application = null;
    },
    decorate: function (moduleName, module) {
        if (module.loadData) {
            this._decorateLoadData(moduleName, module);
        }
        if (module.saveData) {
            this._decorateSaveData(moduleName, module);
        }
    },
    _decorateLoadData: function (moduleName, module) {
        module._sourceLoadData = module.loadData;
        module.loadData = () => {
            let file = this._getBackupFile(moduleName);
            let data = null;
            try {
                data = fileutils.jsonFromFile(file);
            } catch (e) {
            }
            if (!data) {
                try {
                    let bakupFile = file.parent;
                    bakupFile.append(file.leafName + ".bakup");
                    data = fileutils.jsonFromFile(bakupFile);
                } catch (e) {
                }
            }
            module._sourceLoadData(data);
            module.loadData = function () {
            };
            module._backupDataLoaded = true;
            if (!data) {
                module.saveData();
            }
        };
        this._reloadableModules.push(moduleName);
    },
    _decorateSaveData: function (moduleName, module) {
        let file = this._getBackupFile(moduleName);
        let timers = this._timers;
        module.saveData = module.saveData.bind(module, (data, {force, timeout}, callback) => {
            let timer = timers[moduleName];
            if (timer && timer.isRunning) {
                timer.cancel();
            }
            data = JSON.stringify(data);
            let writeData = () => {
                if ("loadData" in module && !module._backupDataLoaded) {
                    backup._logger.error("Skip save data in the module '" + moduleName + "' because data was not loaded before.");
                    return;
                }
                if (file.exists()) {
                    try {
                        file.renameTo(file.parent, file.leafName + ".bakup");
                    } catch (e) {
                    }
                }
                delete timers[moduleName];
                fileutils.writeTextFile(file, data);
                if (callback) {
                    callback(data);
                }
            };
            if (force) {
                writeData();
                return;
            }
            timers[moduleName] = new sysutils.Timer(writeData, timeout || SYNC_THROTTLE_TIMEOUT_MS);
        });
    },
    _createBackup: function () {
        let now = Date.now();
        let storageDir = this._storageDir;
        let backupDir = this._backupDir;
        storageDir.copyTo(backupDir, now);
        this._logger.info("New backup created at profile-dir/backups/" + now + "/");
        let backups = backupDir.directoryEntries;
        let filesCount = 0;
        let oldestDir;
        let oldestDirName = 0;
        while (backups.hasMoreElements()) {
            let dir = backups.getNext().QueryInterface(Ci.nsIFile);
            let date = parseInt(dir.leafName, 10);
            if (!oldestDirName || oldestDirName > date) {
                oldestDirName = date;
                oldestDir = dir;
            }
            filesCount++;
        }
        if (filesCount < MAX_BACKUPS_COUNT) {
            return;
        }
        if (oldestDir) {
            fileutils.removeFileSafe(oldestDir);
        }
    },
    _getBackupFile: function (name) {
        let file = this._storageDir;
        file.append(name + ".json");
        return file;
    },
    get _storageDir() {
        let storageDir = this._application.core.rootDir;
        storageDir.append("data");
        fileutils.forceDirectories(storageDir);
        return storageDir;
    },
    get _backupDir() {
        let backupDir = this._application.core.rootDir;
        backupDir.append("backups");
        fileutils.forceDirectories(backupDir);
        return backupDir;
    },
    get list() {
        let output = [];
        let backups = this._backupDir.directoryEntries;
        while (backups.hasMoreElements()) {
            let dir = backups.getNext().QueryInterface(Ci.nsIFile);
            if (dir.exists() && dir.isDirectory()) {
                output.push({
                    name: dir.leafName,
                    date: parseInt(dir.leafName, 10)
                });
            }
        }
        return output;
    },
    restore: function (name) {
        fileutils.removeFileSafe(this._storageDir);
        let backup = this._backupDir;
        backup.append(name);
        backup.copyTo(this._application.core.rootDir, "data");
        this._reloadableModules.forEach(moduleName => {
            let file = this._getBackupFile(moduleName);
            let data = null;
            try {
                data = fileutils.jsonFromFile(file);
            } catch (err) {
                return;
            }
            let module = this._application[moduleName];
            module._sourceLoadData(data);
            if (module.saveData) {
                module.saveData({ force: true });
            }
        });
    },
    _application: null,
    _logger: null,
    _reloadableModules: null,
    _timers: null
};
