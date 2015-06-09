"use strict";
const migrator = {
    init: function (aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [
            {
                id: "removeTwitter",
                action: this._removeTwitter.bind(this)
            },
            {
                id: "removeLenta",
                action: this._removeLenta.bind(this)
            }
        ];
    },
    migrate: function () {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + this._migrationModule.app.core.Lib.strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _removeTwitter: function () {
        this._migrationModule.app.widgetLibrary.forgetWidgets([
            "http://bar-widgets.yandex.ru/packages/approved/136/manifest.xml#twitter",
            "http://bar-widgets.yandex.ru/packages/approved/172/manifest.xml#twitter"
        ]);
    },
    _removeLenta: function () {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar.yandex.ru/packages/yandexbar#lenta"]);
    }
};
