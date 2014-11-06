"use strict";
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [
            {
                id: "removeTabsStatFile",
                action: this._removeTabsStatFile.bind(this)
            },
            {
                id: "resetPassportConfigPref",
                action: this._resetPassportConfigPref.bind(this)
            }
        ];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + this._migrationModule.app.core.Lib.strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _removeTabsStatFile: function migrator__removeTabsStatFile() {
        let mmmStatFile = this._migrationModule.app.directories.appRootDir;
        mmmStatFile.append("mmm.json");
        if (mmmStatFile.exists()) {
            this._migrationModule.app.core.Lib.fileutils.removeFileSafe(mmmStatFile);
        }
    },
    _resetPassportConfigPref: function migrator__resetPassportConfigPref() {
        Preferences.reset("yasearch.native_comps.http://bar.yandex.ru/packages/yandexbar.settings.yauth.passport.config");
    }
};
