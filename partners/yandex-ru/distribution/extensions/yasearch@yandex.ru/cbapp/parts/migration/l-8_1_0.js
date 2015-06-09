"use strict";
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._nativeComponents = this._migrationModule.app.NativeComponents;
        this._migrationArray = [
            {
                id: "migrateCommonQuotes",
                action: this._migrateCommonQuotes.bind(this)
            },
            {
                id: "migrateTRQuotes",
                action: this._migrateTRQuotes.bind(this)
            },
            {
                id: "migrateMetrika",
                action: this._migrateMetrika.bind(this)
            },
            {
                id: "migrateDirect",
                action: this._migrateDirect.bind(this)
            },
            {
                id: "migrateYandexMoney",
                action: this._migrateYandexMoney.bind(this)
            },
            {
                id: "removeSoC",
                action: this._removeSoC.bind(this)
            },
            {
                id: "removeSeparators",
                action: this._removeSeparators.bind(this)
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
    _migrateCommonQuotes: function migrator__migrateCommonQuotes() {
        const quotesID = "http://bar.yandex.ru/packages/yandexbar#quote";
        const oldQuotesPrefPath = "yasearch.xbwidgets." + quotesID;
        const newQuotesPrefPath = "extensions.yasearch@yandex.ru.native_comps." + quotesID;
        this._migrationModule.movePrefBranch(oldQuotesPrefPath, newQuotesPrefPath);
    },
    _migrateTRQuotes: function migrator__migrateTRQuotes() {
        const oldQuotesID = "http://bar-widgets.yandex.ru/packages/approved/138/manifest.xml#quotebtn";
        const oldQuotesPrefPath = "yasearch.xbwidgets." + oldQuotesID;
        const newQuotesID = "http://bar.yandex.ru/packages/yandexbar#quote";
        const newQuotesPrefPath = "extensions.yasearch@yandex.ru.native_comps." + newQuotesID;
        this._migrationModule.movePrefBranch(oldQuotesPrefPath, newQuotesPrefPath);
        const oldBtnPrefix = this._makeWidgetIdPrefix(oldQuotesID);
        const newBtnPrefix = this._makeWidgetIdPrefix(newQuotesID);
        this._migrationModule.currentset.replaceIds(function (id) {
            if (id.indexOf(oldBtnPrefix) !== -1) {
                return newBtnPrefix + id.split(oldBtnPrefix)[1];
            }
            return id;
        });
        this._migrationModule.app.widgetLibrary.forgetWidgets([oldQuotesID]);
    },
    _migrateMetrika: function migrator__migrateMetrika() {
        const oldMetrikaID = "http://bar-widgets.yandex.ru/packages/175/manifest.xml#metrika";
        const oldMetrikaPrefPath = "yasearch.xbwidgets." + oldMetrikaID;
        const newMetrikaID = "http://bar-widgets.yandex.ru/packages/approved/76/manifest.xml#metrika";
        const newMetrikaPrefPath = "extensions.yasearch@yandex.ru.native_comps." + newMetrikaID;
        this._migrationModule.movePrefBranch(oldMetrikaPrefPath, newMetrikaPrefPath);
        const oldSiteID = "http://bar-widgets.yandex.ru/packages/175/manifest.xml#site";
        const oldSitePrefPath = "yasearch.xbwidgets." + oldSiteID;
        const newSiteID = "http://bar-widgets.yandex.ru/packages/approved/76/manifest.xml#site";
        const newSitePrefPath = "extensions.yasearch@yandex.ru.native_comps." + newSiteID;
        this._migrationModule.movePrefBranch(oldSitePrefPath, newSitePrefPath);
        const oldMetrikaBtnPrefix = this._makeWidgetIdPrefix(oldMetrikaID);
        const newMetrikaBtnPrefix = this._makeWidgetIdPrefix(newMetrikaID);
        const oldSiteBtnPrefix = this._makeWidgetIdPrefix(oldSiteID);
        const newSiteBtnPrefix = this._makeWidgetIdPrefix(newSiteID);
        this._migrationModule.currentset.replaceIds(function (id) {
            if (id.indexOf(oldMetrikaBtnPrefix) !== -1) {
                return newMetrikaBtnPrefix + id.split(oldMetrikaBtnPrefix)[1];
            }
            if (id.indexOf(oldSiteBtnPrefix) !== -1) {
                return newSiteBtnPrefix + id.split(oldSiteBtnPrefix)[1];
            }
            return id;
        });
        this._migrationModule.app.widgetLibrary.forgetWidgets([
            oldMetrikaID,
            oldSiteID
        ]);
    },
    _migrateDirect: function migrator__migrateDirect() {
        const directIDPrefix = "http://bar-widgets.yandex.ru/packages/approved/17/manifest";
        const oldDirectPrefPath = "yasearch.xbwidgets." + directIDPrefix;
        const newDirectPrefPath = "extensions.yasearch@yandex.ru.native_comps." + directIDPrefix;
        this._migrationModule.movePrefBranch(oldDirectPrefPath, newDirectPrefPath);
    },
    _migrateYandexMoney: function migrator__migrateYandexMoney() {
        const oldYaMoneyID = "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#account";
        const newYaMoneyID = "http://bar.yandex.ru/packages/yandexbar#money";
        const oldYaMoneyBtnPrefix = this._makeWidgetIdPrefix(oldYaMoneyID);
        const newYaMoneyBtnPrefix = this._makeWidgetIdPrefix(newYaMoneyID);
        const oldYaMoneyPackageWidgetIDs = [
            "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#bank_card",
            "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#p2ptr",
            "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#prepaid-ns",
            "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#replenish",
            "http://bar-widgets.yandex.ru/packages/approved/9/manifest.xml#shops"
        ];
        let oldYaMoneyPackageWidgetBtnPrefix = oldYaMoneyPackageWidgetIDs.map(function (id) {
            return this._makeWidgetIdPrefix(id);
        }, this);
        this._migrationModule.currentset.replaceIds(function (id) {
            if (id.indexOf(oldYaMoneyBtnPrefix) !== -1) {
                return newYaMoneyBtnPrefix + id.split(oldYaMoneyBtnPrefix)[1];
            }
            if (oldYaMoneyPackageWidgetBtnPrefix.some(oldBtnPrefix => id.indexOf(oldBtnPrefix) !== -1)) {
                return null;
            }
            return id;
        });
        this._migrationModule.app.widgetLibrary.forgetWidgets([oldYaMoneyID].concat(oldYaMoneyPackageWidgetIDs));
    },
    _removeSoC: function migrator__removeSoC() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/133/manifest.xml#soc"]);
    },
    _removeSeparators: function migrator__removeSeparators() {
        this._migrationModule.app.widgetLibrary.forgetWidgets([
            "http://bar.yandex.ru/packages/yandexbar#spring",
            "http://bar.yandex.ru/packages/yandexbar#settings",
            "http://bar.yandex.ru/packages/yandexbar#separator"
        ]);
    },
    _makeWidgetIdPrefix: function migrstor__makeWidgetIdPrefix(widgetProtoId) {
        return this._migrationModule.app.name + ".cb-" + widgetProtoId + "-";
    }
};
