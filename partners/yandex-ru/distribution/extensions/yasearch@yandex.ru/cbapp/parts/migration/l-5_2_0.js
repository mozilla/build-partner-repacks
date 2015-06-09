"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
let application;
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        application = aMigrationModule.app;
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
    },
    migrate: function migrator_migrate() {
        let textonlyPluginId = "http://bar.yandex.ru/packages/yandexbar#textonly";
        let oldTextonlyPrefBranch = "yasearch.general.ui.textonly.";
        let enabledTextonly = Preferences.get(oldTextonlyPrefBranch + "enabled", null);
        if (enabledTextonly !== null) {
            try {
                application.widgetLibrary.getPlugin(textonlyPluginId).enabled = enabledTextonly;
            } catch (e) {
                this._migrationModule.logger.config("Couldn't change Textonly plugin state. " + strutils.formatError(e));
            }
            Preferences.reset(oldTextonlyPrefBranch + "enabled");
        }
    },
    get _logger() {
        return this._migrationModule.logger;
    }
};
