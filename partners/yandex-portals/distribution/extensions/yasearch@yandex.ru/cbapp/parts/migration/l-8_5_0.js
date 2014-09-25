"use strict";
const migrator = {
        init: function migrator_init(aMigrationModule) {
            this._migrationModule = aMigrationModule;
            this._migrationArray = [
                {
                    id: "removeYaru",
                    action: this._removeYaru.bind(this)
                },
                {
                    id: "removeBookmarks",
                    action: this._removeBookmarks.bind(this)
                },
                {
                    id: "removeRadioInTurkeyBranding",
                    action: this._removeRadioInTurkeyBranding.bind(this)
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
        _removeYaru: function migrator__removeYaru() {
            this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar.yandex.ru/packages/yandexbar#yaru"]);
        },
        _removeBookmarks: function migrator__removeBookmarks() {
            this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar.yandex.ru/packages/yandexbar#zakladki"]);
            var cacheFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
            cacheFile.append("yandex");
            cacheFile.append("users.sqlite");
            if (!cacheFile.exists()) {
                return;
            }
            var database = new Database(cacheFile, [
                    "DROP TABLE IF EXISTS bookmarks",
                    "DROP TABLE IF EXISTS versions"
                ]);
        },
        _removeRadioInTurkeyBranding: function migrator__removeRadioInTurkeyBranding() {
            if (this._migrationModule.app.branding.brandID !== "tb")
                return;
            const radioProtoID = "http://bar-widgets.yandex.ru/packages/approved/128/manifest.xml#radio";
            this._migrationModule.app.widgetLibrary.forgetWidgets([radioProtoID]);
        }
    };
