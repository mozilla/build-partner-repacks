"use strict";
const EXPORTED_SYMBOLS = ["addonManager"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const addonManager = {
        init: function AddonManager_init(aApplication) {
            this._application = aApplication;
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this._logger = aApplication.getLogger("AddonMgr");
            this.info = {
                __proto__: null,
                addonVersionState: 0,
                get addonVersionChanged() this.addonVersionState != 0,
                get addonUpgraded() this.addonVersionState > 0,
                get addonDowngraded() this.addonVersionState < 0,
                addonLastVersion: "0",
                buildNumberChanged: false,
                get isFreshAddonInstall() this.addonLastVersion === "0"
            };
            AddonManager.watchAddonUninstall(this.addonId);
            this._checkVersions();
        },
        finalize: function AddonManager_finalize() {
            this._application = null;
            this.info = null;
        },
        get addonDir() {
            return this._application.core.extensionPathFile;
        },
        get addonId() {
            var id = AddonManager.getAddonId(this.addonDir);
            this.__defineGetter__("addonId", function addonId() id);
            return this.addonId;
        },
        get addonVersion() {
            var ver = AddonManager.getAddonVersion(this.addonDir);
            this.__defineGetter__("addonVersion", function addonVersion() ver);
            return this.addonVersion;
        },
        get isAddonUninstalling() {
            return AddonManager.isAddonUninstalling(this.addonId);
        },
        isAddonDisabled: function AddonManager_isAddonDisabled() {
            var defer = promise.defer();
            AddonManager.getAddonsByIDs([this.addonId], function (addons) {
                defer.resolve(addons.length && addons[0].userDisabled || false);
            });
            return defer.promise;
        },
        disableAddon: function AddonManager_disableAddon() {
            AddonManager.disableAddonByID(this.addonId, function AddonManager__disableAddon() {
                var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                timer.initWithCallback({
                    notify: function AddonManager__disableAddonTimed() {
                        const nsIAppStartup = Ci.nsIAppStartup;
                        Cc["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup).quit(nsIAppStartup.eForceQuit | nsIAppStartup.eRestart);
                    }
                }, 50, timer.TYPE_ONE_SHOT);
            });
        },
        removeAddon: function AddonManager_removeAddon() {
            var ftabUrl = this._application.protocolSupport.url;
            this._application.installer.closeTabs(ftabUrl);
            AddonManager.uninstallAddonsByIDs([this.addonId], true, function AddonManager_getAddonByID(addon) {
                Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore).getBrowserState();
            });
        },
        get _addonLastInstalledVersion() {
            return Preferences.get("extensions." + this.addonId + ".versions.lastAddon", "0");
        },
        set _addonLastInstalledVersion(aValue) {
            Preferences.set("extensions." + this.addonId + ".versions.lastAddon", aValue);
        },
        get _lastRunBuildNumber() {
            return Preferences.get("extensions." + this.addonId + ".versions.lastBuild", 0);
        },
        set _lastRunBuildNumber(aValue) {
            Preferences.overwrite("extensions." + this.addonId + ".versions.lastBuild", aValue);
        },
        _checkVersions: function AddonManager__checkVersions() {
            var currentVersion = this.addonVersion;
            var lastVersion = this._addonLastInstalledVersion;
            this.info.addonLastVersion = lastVersion;
            const versionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
            this.info.addonVersionState = versionComparator.compare(currentVersion, lastVersion);
            this.info.buildNumberChanged = this._lastRunBuildNumber != this._application.core.buidRevision;
        },
        saveBuildDataToPreferences: function AddonManager_saveBuildDataToPreferences() {
            this._addonLastInstalledVersion = this.addonVersion;
            this._lastRunBuildNumber = this._application.core.buidRevision;
        },
        _application: null,
        _logger: null
    };
