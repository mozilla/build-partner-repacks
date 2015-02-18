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
                id: "slider_migration",
                action: this._saveCurrentThumbsLayout.bind(this)
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
    _saveCurrentThumbsLayout: function migrator__saveCurrentThumbsLayout() {
        let prefs = this._migrationModule.app.preferences;
        let curX = parseInt(prefs.get("ftabs.layoutX", 0), 10);
        let curY = parseInt(prefs.get("ftabs.layoutY", 0), 10);
        if (curX * curY !== 0) {
            prefs.set("ftabs.oldThumbsLayout", curX + "x" + curY);
        }
    }
};
