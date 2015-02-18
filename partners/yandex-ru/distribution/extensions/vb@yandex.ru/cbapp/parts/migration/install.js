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
                id: "bar",
                action: this._migrateBar.bind(this)
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
    _migrateBar: function migrator__migrateBar() {
        if (this._migrationModule.app.preferences.get("yabar.migrated", false)) {
            this._migrationModule.addonVersionForMigration = "1.0";
        }
    }
};
