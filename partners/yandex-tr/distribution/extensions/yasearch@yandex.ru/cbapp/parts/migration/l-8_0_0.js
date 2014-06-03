"use strict";
const migrator = {
        init: function migrator_init(aMigrationModule) {
            this._migrationModule = aMigrationModule;
            this._migrationArray = [{
                    id: "removeNotifier",
                    action: this._removeNotifier.bind(this)
                }];
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
        _removeNotifier: function migrator__removeNotifier() {
            this._migrationModule.app.widgetLibrary.forgetPlugins(["http://bar-widgets.yandex.ru/packages/approved/212/manifest.xml#notifier"]);
        }
    };
