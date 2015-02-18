"use strict";
var gYaInstaller = {
    __installed: true,
    __lastEmActionRequestedName: "",
    get isBarUninstalled() {
        return this.__installed === false;
    },
    APP_ACTION_QUIT_TOPIC: "quit-application",
    LASTVERSION_PREF_NAME: "yasearch.general.lastVersion",
    CHECK_TOOLBAR_COLLAPSED_PREF_NAME: "yasearch.general.checkToolbarCollapsed",
    startup: function YaInstaller_startup() {
        Services.obs.addObserver(this, this.APP_ACTION_QUIT_TOPIC, false);
        this._proccessInstall();
        AddonManager.addAddonListener(this);
    },
    shutdown: function YaInstaller_shutdown() {
        AddonManager.removeAddonListener(this);
        Services.obs.removeObserver(this, this.APP_ACTION_QUIT_TOPIC);
        if (this.isBarUninstalled) {
            this._proccessUninstall();
        }
    },
    onAddonEvent: function YaInstaller_onAddonEvent(aEventType, aAddon, aPendingRestart) {
        if (aAddon.id !== EXT_ID) {
            return;
        }
        switch (aEventType) {
        case "onUninstalling":
        case "onUpdateFinished":
            gYaSearchService.setIntPref(this.CHECK_TOOLBAR_COLLAPSED_PREF_NAME, this.CHECK_GLOBAL_INSTALL_POST_CHECK);
            break;
        case "onOperationCancelled":
            if (this.__lastEmActionRequestedName && this.__lastEmActionRequestedName == aEventType) {
                gYaSearchService.resetPref(this.CHECK_TOOLBAR_COLLAPSED_PREF_NAME);
            }
            break;
        default:
            break;
        }
        this.__installed = aEventType !== "onUninstalling";
        this.__lastEmActionRequestedName = aEventType;
    },
    observe: function YaInstaller_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case this.APP_ACTION_QUIT_TOPIC:
            this.shutdown();
            break;
        default:
            break;
        }
    },
    _proccessInstall: function YaInstaller__proccessInstall() {
        let currentVersion = gYaSearchService.barExtensionMajorVersion;
        let lastVersion = gYaSearchService.getCharPref(this.LASTVERSION_PREF_NAME);
        this._checkToolbarCollapsed(lastVersion, currentVersion);
        if (lastVersion == currentVersion) {
            return;
        }
        gYaSearchService.setCharPref(this.LASTVERSION_PREF_NAME, currentVersion);
        if (lastVersion == "0") {
            if (typeof gYaOverlay == "object") {
                if ("setNavBarIconSizeToSmall" in gYaOverlay && gYaSearchService.isYandexFirefoxDistribution) {
                    gYaOverlay.setNavBarIconSizeToSmall();
                }
            }
            this._changePreferencesOnInstall();
        } else {
            try {
                if (typeof gYaOverlay === "object" && "migrateWidgets" in gYaOverlay) {
                    gYaOverlay.migrateWidgets(lastVersion);
                }
            } catch (e) {
                gYaSearchService.log(e);
            }
        }
    },
    _checkToolbarCollapsed: function YaInstaller__checkToolbarCollapsed(aLastVersion, aCurrentVersion) {
        let checkToolbarCollapsed = gYaSearchService.getIntPref(this.CHECK_TOOLBAR_COLLAPSED_PREF_NAME);
        if (checkToolbarCollapsed) {
            gYaSearchService.resetPref(this.CHECK_TOOLBAR_COLLAPSED_PREF_NAME);
            if (checkToolbarCollapsed == 1 && typeof gYaOverlay === "object" && "setToolbarCollapsedState" in gYaOverlay) {
                if (aLastVersion == "0" || aLastVersion === aCurrentVersion) {
                    gYaOverlay.setToolbarCollapsedState(false);
                }
            }
        }
    },
    _changePreferencesOnInstall: function YaInstaller__changePreferencesOnInstall() {
    },
    STT_PREF_NAME: "yasearch.general.stt",
    get sttInstall() {
        let stt = gYaSearchService.getCharPref(this.STT_PREF_NAME);
        return stt !== "{'s':{'i':4}}";
    },
    set sttInstall(aValue) {
        gYaSearchService.setCharPref(this.STT_PREF_NAME, "{'s':{'i':4}}");
    },
    _proccessUninstall: function YaInstaller__proccessUninstall() {
        gYaSearchService.resetPref(this.LASTVERSION_PREF_NAME);
        gYaSearchService.resetPref("yasearch.license.accepted");
        gYaSearchService.resetPref("yasearch.welcomepage.version.introduced");
        gYaSearchService.resetPref("yasearch.guid.clids.creationDate");
        gYaSearchService.resetPref(this.STT_PREF_NAME);
        let vendorFileName = gYaSearchService.vendorFileName;
        gYaSearchService.resetPref("yasearch.general.app.bar.type");
        if (typeof gYaStorage === "object" && "shutdown" in gYaStorage) {
            gYaStorage.shutdown();
        }
        try {
            gYaSearchService.yaAuth.PasswordManager.removeAllUsersData();
        } catch (ex) {
        }
        let asyncModule = gYaSearchService.customBarApp.core.Lib.async;
        let yandexDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        yandexDir.append("yandex");
        if (yandexDir.exists()) {
            [
                "cities.data.xml",
                "regions.data.xml",
                "services.mybar.xml",
                "maps.data.xml",
                "services.data.xml",
                "ftab.data.xml",
                "yasearch-storage.sqlite",
                "bar-logo.ico",
                "ftab-data",
                "users.sqlite"
            ].forEach(function (aFileOrDirectoryName) {
                let fileToRemove = yandexDir.clone();
                fileToRemove.append(aFileOrDirectoryName);
                try {
                    asyncModule.nextTick(function () {
                        gYaSearchService.removeFile(fileToRemove);
                    });
                } catch (e) {
                    Cu.reportError(e);
                }
            });
            asyncModule.nextTick(function () {
                if (!yandexDir.directoryEntries.hasMoreElements()) {
                    try {
                        gYaSearchService.removeFile(yandexDir);
                    } catch (e) {
                        Cu.reportError(e);
                    }
                }
            });
        }
    }
};
gSubscriptsForInit.push(gYaInstaller);
