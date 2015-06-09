"use strict";
const EXPORTED_SYMBOLS = ["addonManager"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const addonManager = {
    init: function AddonManager_init(aApplication) {
        this._application = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._logger = aApplication.getLogger("AddonMgr");
        this.info = {
            __proto__: null,
            addonVersionState: 0,
            get addonVersionChanged() {
                return this.addonVersionState !== 0;
            },
            get addonUpgraded() {
                return this.addonVersionState > 0;
            },
            get addonDowngraded() {
                return this.addonVersionState < 0;
            },
            addonLastVersion: "0",
            buildNumberChanged: false,
            get isFreshAddonInstall() {
                return this.addonLastVersion === "0";
            }
        };
        AddonManager.watchAddonUninstall(this.addonId);
        this._checkVersions();
    },
    finalize: function AddonManager_finalize() {
        this._application = null;
        this._logger = null;
        this.info = null;
    },
    get extensionURI() {
        return this._application.core.extensionURI;
    },
    get addonId() {
        let id = AddonManager.getAddonId(this.extensionURI);
        this.__defineGetter__("addonId", () => id);
        return this.addonId;
    },
    get addonVersion() {
        let ver = AddonManager.getAddonVersion(this.extensionURI);
        this.__defineGetter__("addonVersion", () => ver);
        return this.addonVersion;
    },
    get isAddonUninstalling() {
        return AddonManager.isAddonUninstalling(this.addonId);
    },
    isAddonDisabled: function AddonManager_isAddonDisabled() {
        let defer = promise.defer();
        AddonManager.getAddonsByIDs([this.addonId], function (addons) {
            defer.resolve(addons.length && addons[0].userDisabled || false);
        });
        return defer.promise;
    },
    get _addonLastInstalledVersion() {
        return this._application.preferences.get("versions.lastAddon", null) || Preferences.get(this._application.name + ".versions.lastAddon", null) || Preferences.get(this._application.name + ".general.lastVersion", "0");
    },
    set _addonLastInstalledVersion(aValue) {
        this._application.preferences.set("versions.lastAddon", aValue);
    },
    get _lastRunBuildNumber() {
        return this._application.preferences.get("versions.lastBuild", null) || Preferences.get(this._application.name + ".versions.lastBuild", 0);
    },
    set _lastRunBuildNumber(aValue) {
        this._application.preferences.set("versions.lastBuild", aValue);
    },
    _checkVersions: function AddonManager__checkVersions() {
        let currentVersion = this.addonVersion;
        let lastVersion = this._addonLastInstalledVersion;
        this.info.addonLastVersion = lastVersion;
        this.info.addonVersionState = Services.vc.compare(currentVersion, lastVersion);
        this.info.buildNumberChanged = this._lastRunBuildNumber != this._application.core.buidRevision;
    },
    saveBuildDataToPreferences: function AddonManager_saveBuildDataToPreferences() {
        this._addonLastInstalledVersion = this.addonVersion;
        this._lastRunBuildNumber = this._application.core.buidRevision;
    },
    _application: null,
    _logger: null
};
