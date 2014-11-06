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
                id: "saveLayout_migration",
                action: this._saveLayout.bind(this)
            }];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "':" + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _saveLayout: function migrator__migrateSearchStudy() {
        let prefs = this._migrationModule.app.preferences;
        let x = prefs.get("ftabs.layoutX", 0);
        let y = prefs.get("ftabs.layoutY", 0);
        if (x && y) {
            prefs.set("ftabs.oldThumbsLayout", x + "x" + y);
        }
    }
};
