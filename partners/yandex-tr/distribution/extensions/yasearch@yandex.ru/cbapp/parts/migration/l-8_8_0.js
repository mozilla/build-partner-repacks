"use strict";
const migrator = {
    init: function (aMigrationModule) {
        this._migrationModule = aMigrationModule;
        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
        this._migrationArray = [];
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
            new sysutils.Timer(this._autoinstallDiskWidget.bind(this), 3000);
        }
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
        let historyConditions = [
            {
                domain: "element.yandex.ru",
                path: "/disk"
            },
            {
                domain: "element.yandex.ua",
                path: "/disk"
            },
            {
                domain: "elements.yandex.com.tr",
                path: "/disk"
            }
        ];
        let historyMinVisits = 1;
        let historyVisits = application.autoinstaller.getBrowserHistoryVisitsFor(historyConditions, historyMinVisits);
        if (!historyVisits) {
            return;
        }
        let overlayControllerName = application.name + "OverlayController";
        misc.getBrowserWindows().forEach(function (browserWindow) {
            let overlayController = browserWindow[overlayControllerName];
            if (overlayController.getWidgetItems("diskComponentId").length) {
                return;
            }
            let relativeTo = overlayController.getWidgetItems(null, overlayController.navToolbar.id).pop() || overlayController.getAllWidgetItems().pop() || null;
            overlayController.placeWidget(diskComponentId, relativeTo, true, "all", false);
        }, this);
    }
};
