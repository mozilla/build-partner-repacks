"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        this._migrationArray = [{
                id: "searchStudy_migration",
                action: this._migrateSearchStudy.bind(this)
            }];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _migrateSearchStudy: function migrator__migrateSearchStudy() {
        let prefs = this._migrationModule.app.preferences;
        let searchStatus = prefs.get("ftabs.searchStatus");
        if ([
                2,
                3
            ].indexOf(searchStatus) !== -1) {
            prefs.set("ftabs.searchStudyOmnibox", false);
        }
        let newSearchStatusValue;
        switch (searchStatus) {
        case 0:
        case 1:
            newSearchStatusValue = searchStatus;
            break;
        case 2:
            newSearchStatusValue = 0;
            break;
        default:
            newSearchStatusValue = 1;
        }
        prefs.set("ftabs.searchStatus", newSearchStatusValue);
    }
};
