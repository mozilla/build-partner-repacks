"use strict";
const migrator = {
    init: function (aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [{
                id: "resetSovetnikPartnerCheck",
                action: this._resetSovetnikPartnerCheck.bind(this)
            }];
        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
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
    observe: function (subject, topic, data) {
        if (topic === "sessionstore-windows-restored") {
            Services.obs.removeObserver(this, topic, false);
            new sysutils.Timer(() => this._enableSovetnik(), 1000);
        }
    },
    _resetSovetnikPartnerCheck: function () {
        let componentId = "http://bar-widgets.yandex.ru/packages/approved/289/manifest.xml#sovetnik";
        let componentPrefOldBaseName = "yasearch.native_comps." + componentId + ".all.settings.";
        Preferences.reset(componentPrefOldBaseName + "specialVendorChecked");
        let componentPrefNewBaseName = "extensions.yasearch@yandex.ru.native_comps." + componentId + ".all.settings.";
        Preferences.reset(componentPrefNewBaseName + "specialVendorChecked");
    },
    _enableSovetnik: function () {
        let componentId = "http://bar-widgets.yandex.ru/packages/approved/289/manifest.xml#sovetnik";
        let application = this._migrationModule.app;
        if (!application.widgetLibrary.isKnownPlugin(componentId)) {
            return;
        }
        try {
            application.widgetLibrary.getPlugin(componentId).enabled = true;
        } catch (e) {
            this._migrationModule.logger.config("Couldn't change Sovetnik plugin state. " + strutils.formatError(e));
        }
    }
};
