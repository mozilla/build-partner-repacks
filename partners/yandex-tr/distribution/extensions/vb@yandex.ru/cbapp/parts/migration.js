"use strict";
const EXPORTED_SYMBOLS = ["migration"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const migration = {
        init: function migration_init(aApplication) {
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this._application = aApplication;
            try {
                this._migrate();
            } catch (e) {
                this.logger.error("Failed while running migration process. " + e);
                this.logger.debug(e.stack);
            }
        },
        get app() {
            return this._application;
        },
        get logger() {
            if (!this._logger) {
                this._logger = this._application.getLogger("Migration");
            }
            return this._logger;
        },
        get addonVersionForMigration() {
            if (!this._addonVersionForMigration) {
                let installInfo = this.app.addonManager.info;
                this._addonVersionForMigration = installInfo.isFreshAddonInstall ? this.app.addonManager.addonVersion : installInfo.addonLastVersion;
            }
            return this._addonVersionForMigration;
        },
        set addonVersionForMigration(aVersion) {
            this._addonVersionForMigration = aVersion;
        },
        movePrefBranch: function migration_movePrefBranch(oldPrefBranchPath, newPrefBranchPath) {
            this._prefsSvc.getBranch(oldPrefBranchPath).getChildList("", {}).forEach(function (key) {
                var prefValue = Preferences.get(oldPrefBranchPath + key, null);
                if (prefValue !== null)
                    Preferences.set(newPrefBranchPath + key, prefValue);
            });
            Preferences.resetBranch(oldPrefBranchPath);
        },
        _migrate: function migration__migrate() {
            var installInfo = this.app.addonManager.info;
            if (!installInfo.addonVersionChanged || installInfo.addonDowngraded)
                return;
            this.logger.config("Migration started. " + "Fresh install: " + installInfo.isFreshAddonInstall + "; " + "addonVersion: " + this.app.addonManager.addonVersion + "; " + "addonLastVersion: " + installInfo.addonLastVersion + ".");
            var versionComparator = sysutils.versionComparator;
            try {
                if (installInfo.isFreshAddonInstall) {
                    this._migrateVersion({ file: "install.js" });
                }
                this._migrationScripts.forEach(function (scriptDef) {
                    var scriptName = scriptDef.name;
                    for (let [
                                alias,
                                operation
                            ] in Iterator(this._migrationConfig)) {
                        if (scriptName.indexOf(alias + "-") != 0)
                            continue;
                        let version = scriptName.replace(alias + "-", "");
                        let compResult = versionComparator.compare(this.addonVersionForMigration, version);
                        if (operation(compResult))
                            this._migrateVersion(scriptDef);
                        break;
                    }
                }, this);
            } catch (e) {
                this.logger.error("Failed migrating from another version. " + strutils.formatError(e));
                this.logger.debug(e.stack);
            }
            this.logger.config("Migration finished");
        },
        get _prefsSvc() {
            delete this._prefsSvc;
            this._prefsSvc = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
            return this._prefsSvc;
        },
        _migrateVersion: function migration__migrateVersion(migScriptDef) {
            var script = this._loadModule(migScriptDef.file);
            script.migrator.init(this);
            script.migrator.migrate();
        },
        _loadModule: function migration__loadModule(fileName) {
            const mozSSLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
            var scope = {};
            mozSSLoader.loadSubScript(this._application.partsURL + "migration/" + fileName, scope);
            this.logger.debug(" Migration module '" + fileName + "' loaded");
            return scope;
        },
        _migrationScripts: [
            {
                name: "l-2.0",
                file: "l-2_0.js"
            },
            {
                name: "l-2.3",
                file: "l-2_3.js"
            },
            {
                name: "l-2.9",
                file: "l-2_9.js"
            },
            {
                name: "l-2.12",
                file: "l-2_12.js"
            },
            {
                name: "l-2.13",
                file: "l-2_13.js"
            }
        ],
        _migrationConfig: {
            ge: function (a) a >= 0,
            le: function (a) a <= 0,
            g: function (a) a > 0,
            l: function (a) a < 0,
            e: function (a) a == 0
        },
        _addonVersionForMigration: null
    };
