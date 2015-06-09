"use strict";
const migrator = {
    init: function (aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [{
                id: "migrateBrowseroffer",
                action: this._migrateBrowseroffer.bind(this)
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
            new sysutils.Timer(this._autoinstallDiskWidget.bind(this), 3500);
        }
    },
    _migrateBrowseroffer: function () {
        let componentId = "http://bar-widgets.yandex.ru/packages/approved/286/manifest.xml#browseroffer";
        let componentPrefOldBaseName = "yasearch.native_comps." + componentId + ".all.settings.";
        let componentPrefNewBaseName = "extensions.yasearch@yandex.ru.native_comps." + componentId + ".all.settings.";
        let counter = Preferences.get(componentPrefOldBaseName + "noflash.closedCounter");
        let timestamp = Preferences.get(componentPrefOldBaseName + "noflash.userActionTime");
        let newPref = {
            closedCounter: counter,
            timestamp: timestamp
        };
        Preferences.set(componentPrefNewBaseName + "no-flash.suggest-session", JSON.stringify(newPref));
        Preferences.reset(componentPrefOldBaseName + "noflash.closedCounter");
        Preferences.reset(componentPrefOldBaseName + "noflash.userActionTime");
    },
    _autoinstallDiskWidget: function () {
        const diskComponentId = "http://bar-widgets.yandex.ru/packages/approved/288/manifest.xml#yadisk";
        let application = this._migrationModule.app;
        if (diskComponentId in application.overlayProvider.currentSetIds) {
            return;
        }
        if (!application.widgetLibrary.isKnownWidget(diskComponentId)) {
            return;
        }
        let maxAge = 30 * 24 * 60 * 60 * 1000;
        let historyConditions = [
            {
                domain: "disk.yandex.ru",
                path: "/client/disk",
                maxAge: maxAge
            },
            {
                domain: "disk.yandex.ua",
                path: "/client/disk",
                maxAge: maxAge
            },
            {
                domain: "disk.yandex.com.tr",
                path: "/client/disk",
                maxAge: maxAge
            }
        ];
        let historyMinVisits = 1;
        let historyVisits = application.autoinstaller.getBrowserHistoryVisitsFor(historyConditions, historyMinVisits);
        if (!historyVisits) {
            return;
        }
        let overlayControllerName = application.name + "OverlayController";
        misc.getBrowserWindows().forEach(browserWindow => {
            let overlayController = browserWindow[overlayControllerName];
            if (overlayController.getWidgetItems("diskComponentId").length) {
                return;
            }
            let allItemsOnNavToolbar = overlayController.getWidgetItems(null, overlayController.navToolbar.id);
            if (allItemsOnNavToolbar.length > 6) {
                return;
            }
            let relativeTo = allItemsOnNavToolbar.pop() || overlayController.getAllWidgetItems().pop() || null;
            overlayController.placeWidget(diskComponentId, relativeTo, true, "all", false);
        });
    }
};
