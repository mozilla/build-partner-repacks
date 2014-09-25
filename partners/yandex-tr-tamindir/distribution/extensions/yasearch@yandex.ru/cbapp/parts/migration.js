"use strict";
const EXPORTED_SYMBOLS = ["migration"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
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
            Services.prefs.getBranch(oldPrefBranchPath).getChildList("", {}).forEach(function (key) {
                var prefValue = Preferences.get(oldPrefBranchPath + key, null);
                if (prefValue !== null)
                    Preferences.set(newPrefBranchPath + key, prefValue);
            });
            Preferences.resetBranch(oldPrefBranchPath);
        },
        currentset: {
            replaceIds: function migration_currentset_replaceIds(replacer) {
                var browserCustomizableUI = this._browserCustomizableUI;
                if (!browserCustomizableUI) {
                    this._replaceIdsInLocalStore(replacer);
                    return;
                }
                browserCustomizableUI.areas.map(function (area) browserCustomizableUI.getWidgetIdsInArea(area)).reduce(function (a, b) a.concat(b)).forEach(function (id) {
                    var newId = replacer(id);
                    if (id === newId || typeof newId === "undefined")
                        return;
                    var placement = browserCustomizableUI.getPlacementOfWidget(id);
                    if (!placement)
                        return;
                    migration.logger.debug("Replace '" + id + "' with '" + newId + "'");
                    browserCustomizableUI.addWidgetToArea(newId, placement.area, placement.position);
                    browserCustomizableUI.removeWidgetFromArea(id);
                });
            },
            addIds: function migration_currentset_addIds(ids) {
                var browserCustomizableUI = this._browserCustomizableUI;
                if (!browserCustomizableUI)
                    return;
                browserCustomizableUI.beginBatchUpdate();
                ids.forEach(function (id) {
                    browserCustomizableUI.addWidgetToArea(id, browserCustomizableUI.AREA_NAVBAR);
                });
                browserCustomizableUI.endBatchUpdate();
            },
            get _browserCustomizableUI() {
                delete this.browserCustomizableUI;
                return this.browserCustomizableUI = Cu.import("resource:///modules/CustomizableUI.jsm", {}).CustomizableUI;
            },
            _replaceIdsInLocalStore: function migration_currentset__replaceIdsInLocalStore(replacer) {
                var allResources = this._localStoreRDF.GetAllResources();
                var currentsetResource = this._rdfService.GetResource("currentset");
                while (allResources.hasMoreElements()) {
                    let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
                    if (!res.Value)
                        continue;
                    let toolbar = this._rdfService.GetResource(res.Value);
                    let currentSet = this._getRDFLiteralValue(toolbar, currentsetResource);
                    if (!(currentSet && currentSet != "__empty"))
                        continue;
                    let currentSetIds = currentSet.split(",");
                    let (i = 0, len = currentSetIds.length) {
                        for (; i < len; i++) {
                            let currentSetId = currentSetIds[i];
                            let newId = replacer(currentSetId);
                            if (currentSetId === newId || typeof newId === "undefined")
                                continue;
                            migration.logger.debug("Replace '" + currentSetIds[i] + "' with '" + newId + "'");
                            currentSetIds[i] = newId;
                        }
                    }
                    currentSetIds = currentSetIds.filter(function (id) id !== null).join(",");
                    this._setRDFLiteralValue(toolbar, currentsetResource, currentSetIds);
                }
                this._localStoreRDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
            },
            get _localStoreRDF() {
                delete this._localStoreRDF;
                return this._localStoreRDF = this._rdfService.GetDataSource("rdf:local-store");
            },
            get _rdfService() {
                delete this._rdfService;
                return this._rdfService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
            },
            _getRDFLiteralValue: function migrator__getRDFLiteralValue(aSource, aProperty) {
                var target = this._localStoreRDF.GetTarget(aSource, aProperty, true);
                if (target instanceof Ci.nsIRDFLiteral)
                    return target.Value;
                return null;
            },
            _setRDFLiteralValue: function migrator__setRDFLiteralValue(aSource, aProperty, aTarget) {
                try {
                    let oldTarget = this._localStoreRDF.GetTarget(aSource, aProperty, true);
                    if (oldTarget) {
                        if (aTarget)
                            this._localStoreRDF.Change(aSource, aProperty, oldTarget, this._rdfService.GetLiteral(aTarget));
                        else
                            this._localStoreRDF.Unassert(aSource, aProperty, oldTarget);
                    } else {
                        this._localStoreRDF.Assert(aSource, aProperty, this._rdfService.GetLiteral(aTarget), true);
                    }
                } catch (e) {
                }
            }
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
        _migrateVersion: function migration__migrateVersion(migScriptDef) {
            var script = this._loadModule(migScriptDef.file);
            script.migrator.init(this);
            script.migrator.migrate();
        },
        _loadModule: function migration__loadModule(fileName) {
            const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
            var scope = {};
            SCRIPT_LOADER.loadSubScript(this._application.partsURL + "migration/" + fileName, scope);
            this.logger.debug(" Migration module '" + fileName + "' loaded");
            return scope;
        },
        _migrationScripts: [
            {
                name: "l-5.2.0",
                file: "l-5_2_0.js"
            },
            {
                name: "l-6.4.0",
                file: "l-6_4_0.js"
            },
            {
                name: "l-7.0.0",
                file: "l-7_0_0.js"
            },
            {
                name: "l-7.6.0",
                file: "l-7_6_0.js"
            },
            {
                name: "l-7.8.0",
                file: "l-7_8_0.js"
            },
            {
                name: "l-7.8.1",
                file: "l-7_8_1.js"
            },
            {
                name: "l-8.0.0",
                file: "l-8_0_0.js"
            },
            {
                name: "l-8.1.0",
                file: "l-8_1_0.js"
            },
            {
                name: "l-8.3.0",
                file: "l-8_3_0.js"
            },
            {
                name: "l-8.5.0",
                file: "l-8_5_0.js"
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
