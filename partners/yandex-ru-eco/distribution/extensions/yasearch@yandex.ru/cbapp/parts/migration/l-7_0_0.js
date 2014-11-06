"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
let NC = null;
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        NC = this._migrationModule.app.NativeComponents;
        this._migrationArray = [
            {
                id: "mailPrefs",
                action: this._migrateMail.bind(this)
            },
            {
                id: "lentaPrefs",
                action: this._migrateLenta.bind(this)
            },
            {
                id: "zakladkiPrefs",
                action: this._migrateBookmarks.bind(this)
            },
            {
                id: "cyPrefs",
                action: this._migrateCY.bind(this)
            },
            {
                id: "opinionsPrefs",
                action: this._migrateOpinions.bind(this)
            },
            {
                id: "loginPrefs",
                action: this._migrateLogin.bind(this)
            },
            {
                id: "townPrefs",
                action: this._migrateTown.bind(this)
            },
            {
                id: "miscPrefs",
                action: this._migrateMisc.bind(this)
            },
            {
                id: "packagePrefs",
                action: this._migratePackage.bind(this)
            },
            {
                id: "rdfIds",
                action: this._migrateRDF.bind(this)
            },
            {
                id: "defender",
                action: this._migrateDefender.bind(this)
            },
            {
                id: "translator",
                action: this._migrateTranslator.bind(this)
            },
            {
                id: "usageStat",
                action: this._migrateUsageStat.bind(this)
            },
            {
                id: "smartbox",
                action: this._migrateSmartbox.bind(this)
            },
            {
                id: "srs",
                action: this._migrateSRS.bind(this)
            },
            {
                id: "wwtMail",
                action: this._removeWWTMail.bind(this)
            },
            {
                id: "wwtTranslator",
                action: this._removeWWTTranslator.bind(this)
            }
        ];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "':" + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _migrateMail: function migrator__migrateMail() {
        const mailID = "http://bar.yandex.ru/packages/yandexbar#mail";
        const prefPath = NC.makeWidgetPrefPath(mailID);
        let mailAlertPref = Preferences.get("yasearch.mail.ui.notification.enabled", true);
        Preferences.set(prefPath + "showTextAlert", mailAlertPref);
        let mailToPref = Preferences.get("yasearch.general.ui.mail.integration", true);
        Preferences.set(prefPath + "mailToIntegration", mailToPref);
        let mailToHelperAlertPref = Preferences.get("yasearch.general.ui.mail.integration.helper.show", true);
        Preferences.set(prefPath + "integrationHelperAlert", mailToHelperAlertPref);
        let mailToOpenNewPref = Preferences.get("yasearch.mail.uri.open.new", false);
        Preferences.set(prefPath + "openOnlyNewMessages", mailToOpenNewPref);
        let mailSoundAlertPref = Preferences.get("yasearch.mail.ui.soundnotification.enabled", false);
        Preferences.set(prefPath + "playSoundAlert", mailSoundAlertPref);
        let mailSoundURIPref = Preferences.get("yasearch.mail.ui.soundnotification.uri", null);
        if (mailSoundURIPref) {
            Preferences.set(prefPath + "soundURI", mailSoundURIPref);
        }
    },
    _migrateLenta: function migrator__migrateLenta() {
        const feedsID = "http://bar.yandex.ru/packages/yandexbar#lenta";
        const prefPath = NC.makeWidgetPrefPath(feedsID);
        let feedsAlertPref = Preferences.get("yasearch.feeds.ui.notification.enabled", true);
        Preferences.set(prefPath + "showTextAlert", feedsAlertPref);
        let feedsSoundAlertPref = Preferences.get("yasearch.feeds.ui.soundnotification.enabled", false);
        Preferences.set(prefPath + "playSoundAlert", feedsSoundAlertPref);
        let feedsSoundURIPref = Preferences.get("yasearch.feeds.ui.soundnotification.uri", null);
        if (feedsSoundURIPref) {
            Preferences.set(prefPath + "soundURI", feedsSoundURIPref);
        }
    },
    _migrateBookmarks: function migrator__migrateBookmarks() {
        const bookmarksID = "http://bar.yandex.ru/packages/yandexbar#zakladki";
        const prefPath = NC.makeWidgetPrefPath(bookmarksID);
        let bookmarksActionPref = Preferences.get("yasearch.general.ui.bookmarks.action", null);
        if (bookmarksActionPref !== null) {
            Preferences.set(prefPath + "action", bookmarksActionPref);
        }
        let onFolderTopPref = Preferences.get("yasearch.general.ui.bookmarks.showaddtofolderontop", true);
        Preferences.set(prefPath + "showAddToFolderOnTop", onFolderTopPref ? "1" : "0");
        let yaruLiveWindowDisabled = Preferences.get("yasearch.general.ui.bookmarks.prefs.yaruLiveWindowDisabled", false);
        Preferences.set(prefPath + "yaruLiveWindowEnabled", !yaruLiveWindowDisabled);
    },
    _migrateCY: function migrator__migrateCY() {
        const cyID = "http://bar.yandex.ru/packages/yandexbar#cy";
        let showCYPref = Preferences.get("yasearch.general.ui.show.cy.value", false);
        let setPath = NC.makeWidgetPrefPath(cyID) + "showValue";
        Preferences.set(setPath, showCYPref);
    },
    _migrateOpinions: function migrator__migrateOpinions() {
        const opinionsID = "http://bar.yandex.ru/packages/yandexbar#opinions";
        let showOpinionsPref = Preferences.get("yasearch.general.ui.show.bloggers.value", false);
        let setPath = NC.makeWidgetPrefPath(opinionsID) + "showValue";
        Preferences.set(setPath, showOpinionsPref);
    },
    _migrateLogin: function migrator__migrateLogin() {
        const loginID = "http://bar.yandex.ru/packages/yandexbar#login";
        const prefPath = NC.makeWidgetPrefPath(loginID);
        let showLoginPref = Preferences.get("yasearch.general.ui.mybar.login.show", true);
        Preferences.set(prefPath + "showLogin", showLoginPref);
        let logoutWithourConfirmPref = Preferences.get("yasearch.general.ui.mybar.logout.noprompt", false);
        Preferences.set(prefPath + "logoutWithoutConfirm", logoutWithourConfirmPref);
    },
    _migrateTranslator: function migrator__migrateTranslator() {
        const translatorWidgetBase = "yasearch.general.ui.translate.";
        const oldComponentId = "yasearch.cb-http://bar.yandex.ru/packages/yandexbar#translator-inst-0";
        const translatorPluginId = "http://bar.yandex.ru/packages/yandexbar#translator";
        let oldPath = translatorWidgetBase + "key.enabled";
        let oldKeyEnabledPrefValue = Preferences.get(oldPath, false);
        let newTranslateOnHoverPrefValue = oldKeyEnabledPrefValue ? false : true;
        let newPath = NC.makeWidgetPrefPath(translatorPluginId) + "translate_on_hover";
        Preferences.set(newPath, newTranslateOnHoverPrefValue);
        let oldFromPath = translatorWidgetBase + "from";
        let oldFromPrefValue = Preferences.get(oldFromPath, "en");
        let newFromPath = NC.makeWidgetPrefPath(translatorPluginId) + "from";
        let newToPath = NC.makeWidgetPrefPath(translatorPluginId) + "to";
        if (oldFromPrefValue !== "en") {
            Preferences.set(newFromPath, oldFromPrefValue);
            Preferences.set(newToPath, "ru");
        }
        let oldEnabledPath = translatorWidgetBase + "enabled";
        let oldEnabledPrefValue = Preferences.get(oldEnabledPath, true);
        if (oldEnabledPrefValue) {
            let allResources = this._localStoreRDF.GetAllResources();
            let currentsetResource = this._rdfService.GetResource("currentset");
            while (allResources.hasMoreElements()) {
                let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
                if (res.Value && res.Value.split("#")[1] === this._migrationModule.app.name + "-bar") {
                    let toolbar = this._rdfService.GetResource(res.Value);
                    let currentSet = this._getRDFLiteralValue(toolbar, currentsetResource);
                    if (currentSet && currentSet != "__empty") {
                        oldEnabledPrefValue = currentSet.split(",").indexOf(oldComponentId) !== -1;
                    }
                }
            }
        }
        if (oldEnabledPrefValue === false) {
            this._migrationModule.app.widgetLibrary.getPlugin(translatorPluginId).disable();
        }
    },
    _migratePackage: function migrator__migratePackage() {
        const packageID = "http://bar.yandex.ru/packages/yandexbar";
        let updatePref = Preferences.get("yasearch.http.update.interval", 5);
        let setPath = NC.makePackagePrefPath(packageID) + "countersUpdateInterval";
        Preferences.set(setPath, updatePref);
    },
    _migrateMisc: function migrator__migrateMisc() {
        const oldOpenInNewTabPrefName = "yasearch.general.ui.command.open.tab";
        let openInNewTabEnabled = Preferences.get(oldOpenInNewTabPrefName, null);
        if (openInNewTabEnabled !== null) {
            this._migrationModule.app.preferences.set("openLinksInNewTab", openInNewTabEnabled);
            Preferences.reset(oldOpenInNewTabPrefName);
        }
    },
    _migrateTown: function migrator__migrateTown() {
        this._migrationModule.movePrefBranch("yasearch.xbwidgets.http://bar.yandex.ru/packages/yandexbar#town.", "yasearch.native_comps.http://bar.yandex.ru/packages/yandexbar#town.");
    },
    _migrateRDF: function migrator__migrateRDF() {
        let allResources = this._localStoreRDF.GetAllResources();
        let currentsetResource = this._rdfService.GetResource("currentset");
        while (allResources.hasMoreElements()) {
            let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
            if (res.Value) {
                let toolbar = this._rdfService.GetResource(res.Value);
                let currentSet = this._getRDFLiteralValue(toolbar, currentsetResource);
                if (currentSet && currentSet != "__empty") {
                    let currentSetIds = currentSet.split(",");
                    for (let i = 0, len = currentSetIds.length; i < len; i++) {
                        if (currentSetIds[i] in this._widgetMigrationMap) {
                            let protoID = this._widgetNamespace + this._widgetMigrationMap[currentSetIds[i]];
                            this._widgetMigrationDoneMap[currentSetIds[i]] = true;
                            currentSetIds[i] = this._migrationModule.app.overlayProvider.compileWidgetItemId(protoID, "0");
                        }
                    }
                    this._setRDFLiteralValue(toolbar, currentsetResource, currentSetIds.join(","));
                }
            }
        }
        this._localStoreRDF.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
    },
    _widgetNamespace: "http://bar.yandex.ru/packages/yandexbar#",
    _widgetMigrationMap: {
        "yasearch-mail": "mail",
        "yasearch-money": "money",
        "yasearch-translate": "translator",
        "yasearch-bloggers": "opinions",
        "yasearch-preferences": "settings",
        "yasearch-login": "login",
        "yasearch-cy": "cy",
        "yasearch-fotki": "fotki",
        "yasearch-yaru": "yaru",
        "yasearch-moikrug": "moikrug",
        "yasearch-bookmarks": "zakladki",
        "yasearch-spam": "spam",
        "yasearch-lenta": "lenta"
    },
    _widgetMigrationDoneMap: {},
    _getRDFLiteralValue: function migrator__getRDFLiteralValue(aSource, aProperty) {
        let target = this._localStoreRDF.GetTarget(aSource, aProperty, true);
        if (target instanceof Ci.nsIRDFLiteral) {
            return target.Value;
        }
        return null;
    },
    _setRDFLiteralValue: function migrator__setRDFLiteralValue(aSource, aProperty, aTarget) {
        try {
            let oldTarget = this._localStoreRDF.GetTarget(aSource, aProperty, true);
            if (oldTarget) {
                if (aTarget) {
                    this._localStoreRDF.Change(aSource, aProperty, oldTarget, this._rdfService.GetLiteral(aTarget));
                } else {
                    this._localStoreRDF.Unassert(aSource, aProperty, oldTarget);
                }
            } else {
                this._localStoreRDF.Assert(aSource, aProperty, this._rdfService.GetLiteral(aTarget), true);
            }
        } catch (e) {
        }
    },
    get _rdfService() {
        delete this._rdfService;
        return this._rdfService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    },
    get _localStoreRDF() {
        delete this._localStoreRDF;
        return this._localStoreRDF = this._rdfService.GetDataSource("rdf:local-store");
    },
    _migrateDefender: function migrator__migrateDefender() {
        let appPreferences = this._migrationModule.app.preferences;
        let isEnabled = Preferences.get("yasearch.defence.homepage.enabled", null);
        if (isEnabled === false) {
            appPreferences.set("defender.homepage.enabled", false);
        }
        let protectedHP = Preferences.get("yasearch.defence.homepage.protected", "");
        if (protectedHP) {
            appPreferences.set("defender.homepage.protected", protectedHP);
        }
        let changesValue = Preferences.get("yasearch.defence.homepage.changes", "");
        if (changesValue) {
            changesValue = changesValue.split("|");
            if (changesValue.length == 4) {
                changesValue.pop();
                appPreferences.set("defender.homepage.changes", changesValue.join("|"));
            }
        }
    },
    _migrateUsageStat: function migrator__migrateUsageStat() {
        let appPreferences = this._migrationModule.app.preferences;
        let currentValue = appPreferences.get("stat.usage.send", null);
        if (currentValue !== null) {
            return;
        }
        currentValue = false;
        if ("yasearch-bloggers" in this._widgetMigrationDoneMap || "yasearch-cy" in this._widgetMigrationDoneMap) {
            currentValue = true;
        } else {
            let socId = "http://bar-widgets.yandex.ru/packages/approved/133/manifest.xml#soc";
            let allResources = this._localStoreRDF.GetAllResources();
            let currentsetResource = this._rdfService.GetResource("currentset");
            while (!currentValue && allResources.hasMoreElements()) {
                let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
                if (res.Value) {
                    let toolbar = this._rdfService.GetResource(res.Value);
                    let currentSet = this._getRDFLiteralValue(toolbar, currentsetResource);
                    if (currentSet && currentSet.indexOf(socId) !== -1) {
                        currentValue = true;
                    }
                }
            }
        }
        this._migrationModule.logger.debug("Set send usage stat preference to '" + currentValue + "'");
        appPreferences.set("stat.usage.send", currentValue);
    },
    _migrateSmartbox: function migrator__migrateSmartbox() {
        const smartboxID = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
        let widgetLibrary = this._migrationModule.app.widgetLibrary;
        try {
            widgetLibrary.getPlugin(smartboxID).enabled = true;
            if (widgetLibrary._prevPluginsState) {
                widgetLibrary._prevPluginsState[smartboxID] = true;
            }
        } catch (e) {
            this._migrationModule.logger.debug("Couldn't change Smartbox plugin state. " + strutils.formatError(e));
        }
    },
    _migrateSRS: function migrator__migrateSRS() {
        this._migrationModule.app.widgetLibrary.forgetPlugins(["http://bar-widgets.yandex.ru/packages/approved/117/manifest.xml#srs"]);
    },
    _removeWWTMail: function migrator__removeWWTMail() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/168/manifest.xml#yamail"]);
    },
    _removeWWTTranslator: function migrator__removeWWTTranslator() {
        this._migrationModule.app.widgetLibrary.forgetWidgets(["http://bar-widgets.yandex.ru/packages/approved/137/manifest.xml#translator"]);
    }
};
