"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        this._migrationArray = [{
                id: "removeUnusedPrefs",
                action: this._removeUnusedPrefs.bind(this)
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
    _removeUnusedPrefs: function migrator__removeUnusedPrefs() {
        let preferences = this._migrationModule.app.preferences;
        preferences.reset("sync.showButton");
        preferences.reset("sync.advert");
        preferences.reset("sync.offer");
        preferences.reset("ftabs.lastRefreshBackgroundsTime");
    }
};
