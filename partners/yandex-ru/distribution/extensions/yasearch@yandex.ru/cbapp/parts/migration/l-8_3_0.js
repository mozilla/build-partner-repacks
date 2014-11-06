"use strict";
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [
            {
                id: "removeOptions",
                action: this._removeOptions.bind(this)
            },
            {
                id: "removeVKPlayer",
                action: this._removeVKPlayer.bind(this)
            },
            {
                id: "removeYandexVideo",
                action: this._removeYandexVideo.bind(this)
            },
            {
                id: "removeTurkeySport",
                action: this._removeTurkeySport.bind(this)
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
    _removeOptions: function migrator__removeOptions() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar.yandex.ru/packages/yandexbar#opinions"]);
    },
    _removeVKPlayer: function migrator__removeVKPlayer() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/170/manifest.xml#vkplayer"]);
    },
    _removeYandexVideo: function migrator__removeYandexVideo() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/182/manifest.xml#yavideo"]);
    },
    _removeTurkeySport: function migrator__removeTurkeySport() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/184/manifest.xml#sport"]);
    }
};
