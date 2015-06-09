"use strict";
const EXPORTED_SYMBOLS = ["barApplication"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const barApplication = {
    init: function BarApp_init(core) {
        this._barCore = core;
        core.Lib.sysutils.copyProperties(core.Lib, GLOBAL);
        this._logger = Log4Moz.repository.getLogger(core.appName + ".App");
        this._dirs._barApp = this;
        this._wndControllerName = this.name + "OverlayController";
        this._migrateOldPreferences();
        this._init();
        this.addonManager.saveBuildDataToPreferences();
        try {
            this.widgetLibrary.persist(false, true);
        } catch (e) {
            this._logger.error("Failed writing plugins list. " + strutils.formatError(e));
        }
        new sysutils.Timer(function cleanupFunc() {
            try {
                this._logger.debug("Preferences cleanup started");
                this._cleanupPreferences();
            } catch (e) {
                this._logger.error("Failed cleaning preferences. " + strutils.formatError(e));
            }
        }.bind(this), 15 * 60 * 1000);
    },
    finalize: function BarApp_finalize(callback) {
        let doFinalCleanup = this.addonManager.isAddonUninstalling;
        let addonId = this.addonManager.addonId;
        this.addonManager.isAddonDisabled().then(function (addonDisabled) {
            if (!(addonDisabled || doFinalCleanup)) {
                return;
            }
            try {
                this.overlayProvider.removeWidgetsFromToolbars();
            } catch (e) {
                this._logger.error("Failed remove widgets from toolbars. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
            try {
                this.overlayProvider.returnNativeElements();
            } catch (e) {
                this._logger.error("Failed return native elements. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
            try {
                this.overlayProvider.removeToolbarsCollapsedState();
            } catch (e) {
                this._logger.error("Failed remove toolbars collapsed state. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }.bind(this)).then(function () {
            let partsFinalizedCallback = function partsFinalizedCallback() {
                this._logger.debug("Finalize process finished.");
                if (doFinalCleanup) {
                    this._finalCleanup(addonId);
                }
                this._logger = null;
                this._barCore = null;
                callback();
            }.bind(this);
            this._finalizeParts(doFinalCleanup, partsFinalizedCallback);
        }.bind(this));
    },
    get core() {
        return this._barCore;
    },
    get name() {
        return this._barCore.appName;
    },
    get defaultPresetURL() {
        return this.preferences.get(this._consts.PREF_DEFAULT_PRESET_URL, null);
    },
    set defaultPresetURL(url) {
        this.preferences.set(this._consts.PREF_DEFAULT_PRESET_URL, url);
    },
    get defaultPreset() {
        return this._defaultPreset;
    },
    set defaultPreset(newPreset) {
        if (!(newPreset instanceof this.BarPlatform.Preset)) {
            throw new CustomErrors.EArgType("newPreset", "Preset", newPreset);
        }
        this._defaultPreset = newPreset;
    },
    get internalDefaultPreset() {
        let presetDoc = fileutils.xmlDocFromStream(this.addonFS.getStream("$content/presets/" + this._consts.DEF_PRESET_FILE_NAME));
        return new this.BarPlatform.Preset(presetDoc);
    },
    get usingInternalPreset() {
        return this._usingInternalPreset;
    },
    get preferencesBranch() {
        let appPrefsBranch = this.core.extensionPrefsPath;
        delete this.preferencesBranch;
        this.__defineGetter__("preferencesBranch", () => appPrefsBranch);
        return appPrefsBranch;
    },
    get preferences() {
        let appPrefs = new Preferences(this.preferencesBranch);
        delete this.preferences;
        this.__defineGetter__("preferences", () => appPrefs);
        return appPrefs;
    },
    get openLinksInNewTab() {
        return this.preferences.get("openLinksInNewTab", false);
    },
    _delayMultiplier: 0,
    _lastGeneratedDelay: 0,
    generateDelay: function BarApp_generateDelay() {
        if (!this._delayMultiplier) {
            this._delayMultiplier = this.preferences.get("debug.delayMultiplier", 60);
        }
        this._lastGeneratedDelay += this._delayMultiplier;
        return this._lastGeneratedDelay;
    },
    getLogger: function BarApp_getLogger(name) {
        return Log4Moz.repository.getLogger(this.name + "." + name);
    },
    get localeString() {
        if (!this._localeString) {
            let xulChromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry);
            try {
                this._localeString = xulChromeReg.getSelectedLocale(this.name);
            } catch (ex) {
                this._localeString = xulChromeReg.getSelectedLocale("global");
            }
        }
        return this._localeString || "en";
    },
    get locale() {
        if (!this._locale) {
            this._locale = misc.parseLocale(this.localeString);
        }
        return this._locale;
    },
    get directories() {
        return this._dirs;
    },
    get partsURL() {
        return "resource://" + this.name + "-app/parts/";
    },
    restartComponents: function BarApp_restartComponents(packageID) {
        this.switchWidgets(packageID, false);
        let pluginsState = this.widgetLibrary.getCurrentPluginsState();
        this.widgetLibrary.flushPlugins(packageID);
        this.packageManager.reloadPackage(packageID);
        this.widgetLibrary.setPluginsState(pluginsState);
        this.switchWidgets(packageID, true);
    },
    switchWidgets: function BarApp_switchWidgets(packageID, on) {
        this.forEachWindow(function switchWidgets(controller) {
            controller.switchWidgets(packageID, on);
        });
    },
    forEachWindow: function BarApp_forEachWindow(func, contextObj, handleExceptions) {
        if (typeof func !== "function") {
            throw CustomErrors.EArgType("func", "Function", func);
        }
        let browserWindows = misc.getBrowserWindows();
        for (let i = browserWindows.length; i--;) {
            try {
                let controller = browserWindows[i][this._wndControllerName];
                if (controller) {
                    func.call(contextObj, controller);
                }
            } catch (e) {
                if (!handleExceptions) {
                    throw e;
                }
                let errMsg = strutils.formatString("Could not call browser controller. Caller: '%1'. %2", [
                    func.name,
                    e
                ]);
                this._logger.error(errMsg);
                this._logger.debug(e.stack);
            }
        }
    },
    openSettingsDialog: function BarApp_openSettingsDialog(navigatorWindow) {
        let chromePath = "chrome://" + this.name + "/content/preferences/preferences.xul";
        let windowClass = this.name + ":Preferences";
        let resizeable = true;
        let modal = false;
        let windowArgs = Array.slice(arguments, 1);
        let focusIfOpened = true;
        this._openWindow.apply(this, [
            navigatorWindow,
            chromePath,
            windowClass,
            focusIfOpened,
            resizeable,
            modal,
            windowArgs
        ]);
    },
    openAboutDialog: function BarApp_openAboutDialog() {
        return this.openSettingsDialog(null, undefined, "about");
    },
    isYandexHost: function BarApp_isYandexHost(hostName) {
        return this._yandexHostsPattern.test(hostName);
    },
    onNewBrowserReady: function BarApp_onNewBrowserReady(controller) {
        let isFirstWindow = ++this._navigatorID == 1;
        if (!isFirstWindow) {
            return;
        }
        try {
            if (this._introducedWEntries.length > 0) {
                let widgetsToAdd = this._introducedWEntries.filter(function (widget) {
                    return widget.isImportant && widget.enabled === widget.ENABLED_YES;
                });
                controller.placeWidgets(widgetsToAdd);
            }
        } catch (e) {
            this._logger.error("Could not place introduced widgets on toolbar. " + strutils.formatError(e));
        }
        try {
            this.incomingCompMgr.activateIncoming(controller);
        } catch (e) {
            this._logger.error("Could not place preinstalled widgets on toolbar. " + strutils.formatError(e));
        }
    },
    _consts: {
        PREF_DEFAULT_PRESET_URL: "default.preset.url",
        DEF_PRESET_FILE_NAME: "default.xml"
    },
    _barCore: null,
    _logger: null,
    _defaultPreset: null,
    _usingInternalPreset: false,
    _introducedWEntries: [],
    _introducedPEntries: [],
    _overlayProvider: null,
    _navigatorID: 0,
    _localeString: null,
    _wndControllerName: undefined,
    _yandexHostsPattern: /(^|\.)yandex\.(ru|ua|by|kz|net|com(\.tr)?)$/i,
    _dirs: {
        get appRootDir() {
            if (!this._appRoot) {
                this._appRoot = this._barApp.core.rootDir;
            }
            let dirFile = this._appRoot.clone();
            this._forceDir(dirFile);
            return dirFile;
        },
        get packagesDir() {
            let packagesDir = this.appRootDir;
            packagesDir.append("packages");
            this._forceDir(packagesDir);
            return packagesDir;
        },
        get presetsDir() {
            let presetsDir = this.appRootDir;
            presetsDir.append("presets");
            this._forceDir(presetsDir);
            return presetsDir;
        },
        get nativeStorageDir() {
            let storageDir = this.appRootDir;
            storageDir.append("native_storage");
            this._forceDir(storageDir);
            return storageDir;
        },
        get vendorDir() {
            let vendorDir = this.appRootDir;
            vendorDir.append("vendor");
            this._forceDir(vendorDir);
            return vendorDir;
        },
        get userDir() {
            let isWindowsOS = sysutils.platformInfo.os.name == "windows";
            let userDir = Services.dirsvc.get(isWindowsOS ? "AppData" : "Home", Ci.nsIFile);
            userDir.append(isWindowsOS ? "Yandex" : ".yandex");
            this.__defineGetter__("userDir", function _userDir() {
                this._forceDir(userDir);
                return userDir.clone();
            }.bind(this));
            return this.userDir;
        },
        makePackageDirName: function BarApp_makePackageDirName() {
            return this._uuidGen.generateUUID().toString();
        },
        _barApp: null,
        _uuidGen: Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator),
        _forceDir: function BarAppDirs_forceDir(dirFile, perm) {
            fileutils.forceDirectories(dirFile, perm);
        }
    },
    _parts: {},
    _partNames: [
        {
            name: "addonManager",
            file: "addonmgr.js"
        },
        {
            name: "yCookie",
            file: "ycookie.js"
        },
        {
            name: "addonFS",
            file: "addonfs.js"
        },
        {
            name: "appStrings",
            file: "strbundle.js"
        },
        {
            name: "BarPlatform",
            file: "platform.js"
        },
        {
            name: "browserTheme",
            file: "browserTheme.js"
        },
        {
            name: "clids",
            file: "clids.js"
        },
        {
            name: "branding",
            file: "branding.js"
        },
        {
            name: "brandProviders",
            file: "brand_prov.js"
        },
        {
            name: "urlRewrite",
            file: "urlRewrite.js"
        },
        {
            name: "addonStatus",
            file: "addonStatus.js"
        },
        {
            name: "distribution",
            file: "distribution.js"
        },
        {
            name: "statistics",
            file: "statistics.js"
        },
        {
            name: "installer",
            file: "installer.js"
        },
        {
            name: "notifications",
            file: "notifications.js"
        },
        {
            name: "defender",
            file: "defender.js"
        },
        {
            name: "vendorCookie",
            file: "vendorCookie.js"
        },
        {
            name: "contentEnvironment",
            file: "contentEnvironment.js"
        },
        {
            name: "passport",
            file: "passport.js"
        },
        {
            name: "overlayProvider",
            file: "overlay_prov.js"
        },
        {
            name: "packageManager",
            file: "pacman.js"
        },
        {
            name: "NativeComponents",
            file: "native_comps.js"
        },
        {
            name: "XB",
            file: "xb.js"
        },
        {
            name: "widgetLibrary",
            file: "widgetlib.js"
        },
        {
            name: "incomingCompMgr",
            file: "incoming.js"
        },
        {
            name: "tutorial",
            file: "tutorial.js"
        },
        {
            name: "integration",
            file: "integration.js"
        },
        {
            name: "safeBrowsing",
            file: "safeBrowsing.js"
        },
        {
            name: "aboutSupport",
            file: "aboutSupport.js"
        },
        {
            name: "browserUsage",
            file: "browserUsage.js"
        },
        {
            name: "barnavig",
            file: "barnavig.js"
        },
        {
            name: "migration",
            file: "migration.js"
        },
        {
            name: "autoinstaller",
            file: "autoinst.js"
        },
        {
            name: "slices",
            file: "slices.js"
        },
        {
            name: "mailruStat",
            file: "mailruStat.js"
        },
        {
            name: "bookmarksStat",
            file: "bookmarksStat.js"
        },
        {
            name: "dayuse",
            file: "dayuse.js"
        }
    ],
    _finalCleanup: function BarApp__finalCleanup(aAddonId) {
        this._logger.debug("Cleanup...");
        let prefBranches = ["extensions." + aAddonId + "."];
        for (let prefBranch of prefBranches) {
            try {
                Preferences.resetBranch(prefBranch);
            } catch (e) {
                this._logger.error("Final cleanup: can't reset branch '" + prefBranch + "'. " + strutils.formatError(e));
            }
        }
        this._logger.debug("Removing all files");
        this._barCore.stop();
        fileutils.removeFileSafe(this.directories.appRootDir);
    },
    _init: function BarApp__init() {
        let httpHandler = Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler);
        let initString = "Initializing Bar platform " + this._barCore.CONFIG.PLATFORM.VERSION + " r" + this._barCore.buidRevision + ", UA: " + httpHandler.userAgent;
        this._logger.config(initString);
        let startTime = Date.now();
        try {
            this._loadParts();
        } catch (e) {
            this._finalizeParts();
            throw e;
        }
        this._hackKnownSkins();
        this._findDefaultPreset();
        let installInfo = this.addonManager.info;
        if (installInfo.isFreshAddonInstall) {
            try {
                this._switchDefaultPresetAutoComps();
            } catch (e) {
                this._logger.error("Failed switching default preset 'auto' components. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
            try {
                this.overlayProvider.removeWidgetsFromToolbars();
                this._logger.debug("Fresh install detected. Remove widgets from toolbars.");
            } catch (e) {
                if (String(e).indexOf("Area not yet restored") === -1) {
                    this._logger.error("Failed remove widgets from toolbars. " + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
        } else if (installInfo.addonVersionChanged) {
            this._logger.config("Addon version changed. Checking default preset stuff...");
            try {
                let internalPreset = new this.BarPlatform.Preset(fileutils.xmlDocFromStream(this.addonFS.getStream("$content/presets/" + this._consts.DEF_PRESET_FILE_NAME)));
                let widgetLibrary = this.widgetLibrary;
                let currDefPreset = this._defaultPreset;
                this._introducedWEntries = internalPreset.widgetEntries.filter(function (widgetEntry) {
                    let widgetID = widgetEntry.componentID;
                    return !widgetLibrary.isKnownWidget(widgetID) && !currDefPreset.refsWidget(widgetID);
                });
                this._introducedPEntries = internalPreset.pluginEntries.filter(pluginEntry => !widgetLibrary.isKnownPlugin(pluginEntry.componentID));
                if (!this._usingInternalPreset) {
                    if (internalPreset.url == this._defaultPreset.url) {
                        this._logger.config("Replacing existing default preset with internal version...");
                        this._replaceDefaultPresetWith(internalPreset);
                        this._usingInternalPreset = true;
                    } else {
                        let defaultPresetPath = "defaults/presets/" + encodeURIComponent(this._defaultPreset.url);
                        let defaultPresetEntry = this.addonFS.getEntry(defaultPresetPath);
                        if (defaultPresetEntry.exists() && defaultPresetEntry.isFile()) {
                            let preset = new this.BarPlatform.Preset(fileutils.xmlDocFromStream(defaultPresetEntry.getStream()));
                            this._logger.config("Replacing existing default preset with new version" + " from defaults/presets/" + this._defaultPreset.url);
                            this._replaceDefaultPresetWith(preset);
                        }
                    }
                }
            } catch (e) {
                this._logger.error("Failed in default preset check routines. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
        let normalWidgetIDs = Object.keys(this._defaultPreset.widgetIDs);
        this._introducedWEntries.forEach(widgetEntry => normalWidgetIDs.push(widgetEntry.componentID));
        this.widgetLibrary.registerWidgets(normalWidgetIDs);
        let pluginIDs = Object.keys(this._defaultPreset.pluginIDs);
        this.widgetLibrary.registerPlugins(pluginIDs);
        this._introducedPEntries.forEach(function (pluginEntry) {
            let pluginID = pluginEntry.componentID;
            this.widgetLibrary.registerPlugins(pluginID);
            if (pluginEntry.enabled != pluginEntry.ENABLED_YES) {
                return;
            }
            try {
                this.widgetLibrary.getPlugin(pluginID).enable();
            } catch (e) {
                this._logger.warn("Could not activate introduced plugin " + pluginID + ". " + strutils.formatError(e));
            }
        }, this);
        this.widgetLibrary.activatePlugins();
        this.addonStatus.onApplicationInitialized();
        this._logger.config("Init done in " + (Date.now() - startTime) + "ms");
    },
    _migrateOldPreferences: function () {
        try {
            let oldPrefBranchPath = this.name + ".";
            let newPrefBranchPath = this.preferencesBranch;
            Services.prefs.getBranch(oldPrefBranchPath).getChildList("", {}).forEach(function (key) {
                let prefValue = Preferences.get(oldPrefBranchPath + key, null);
                if (prefValue !== null) {
                    Preferences.set(newPrefBranchPath + key, prefValue);
                }
            });
            Preferences.resetBranch(oldPrefBranchPath);
        } catch (e) {
            this._logger.error("Failed migrating old preferences branch.");
            this._logger.debug(e);
        }
    },
    _replaceDefaultPresetWith: function BarApp__replaceDefaultPresetWith(newPreset) {
        this._defaultPreset = newPreset;
        let presetFileName = encodeURIComponent(this._defaultPreset.url);
        let presetFile = this.directories.presetsDir;
        presetFile.append(presetFileName);
        fileutils.removeFileSafe(presetFile);
        this.addonFS.copySource("$content/presets/" + this._consts.DEF_PRESET_FILE_NAME, this.directories.presetsDir, presetFileName, parseInt("0755", 8));
    },
    _switchDefaultPresetAutoComps: function BarApp__switchDefaultPresetAutoComps() {
        try {
            this._logger.config("Components autoactivation started");
            let autoActivatedComponentIds = [];
            for (let presetCompEntry in this.autoinstaller.genHistoryRelevantEntries(this.defaultPreset)) {
                presetCompEntry.enabled = presetCompEntry.ENABLED_YES;
                autoActivatedComponentIds.push(presetCompEntry.componentID);
            }
            this.autoinstaller.autoActivatedComponentIds = autoActivatedComponentIds;
            this._logger.debug("Total " + autoActivatedComponentIds.length + " components activated: " + autoActivatedComponentIds);
        } catch (e) {
            this._logger.error("Could not modify default preset. " + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
        const searchFieldID = "http://bar.yandex.ru/packages/yandexbar#search";
        let activatedComponentIds = [];
        this._defaultPreset.allEntries.forEach(function (compEntry) {
            switch (compEntry.enabled) {
            case compEntry.ENABLED_AUTO:
                compEntry.enabled = compEntry.ENABLED_NO;
                break;
            case compEntry.ENABLED_YES:
                activatedComponentIds.push(compEntry.componentID);
                break;
            }
        });
        this.autoinstaller.activatedComponentIds = activatedComponentIds;
        let presetFile = this.directories.presetsDir;
        presetFile.append(encodeURIComponent(this._defaultPreset.url));
        this._defaultPreset.saveToFile(presetFile);
    },
    _loadParts: function BarApp__loadParts() {
        const partsDirPath = this.partsURL;
        for (let i = 0, len = this._partNames.length; i < len; i++) {
            let partDescr = this._partNames[i];
            let partName = partDescr.name;
            let partPath = partsDirPath + partDescr.file;
            let loadPartStart = Date.now();
            Cu.import(partPath, this._parts);
            let part = this._parts[partName];
            if (!part) {
                throw new Error("Part " + partName + " not loaded!");
            }
            sysutils.defineLazyGetter(this, partName, () => part);
            if (typeof part.init == "function") {
                part.init(this);
            }
            this._logger.debug("Loading " + partName + " part from " + partPath + " (" + (Date.now() - loadPartStart) + " ms)");
        }
    },
    _finalizeParts: function BarApp__finalizeParts(doCleanup, partsFinalizedCallback) {
        let partNames = this._partNames;
        let asyncFinalizingParts = Object.create(null);
        let finalizeInProgress = true;
        let callback = function callback() {
            if (finalizeInProgress) {
                return;
            }
            if (typeof partsFinalizedCallback === "function" && sysutils.isEmptyObject(asyncFinalizingParts)) {
                partsFinalizedCallback();
            }
        };
        this._partNames.reverse().forEach(function (part) {
            let partName = part.name;
            let loadedPart = this._parts[partName];
            if (loadedPart && typeof loadedPart.finalize == "function") {
                this._logger.debug("Finalizing " + partName + " part");
                try {
                    let finalizeIsAsync = loadedPart.finalize(doCleanup, function () {
                        delete asyncFinalizingParts[partName];
                        callback();
                    }.bind(this));
                    if (finalizeIsAsync === true) {
                        asyncFinalizingParts[partName] = true;
                    }
                } catch (e) {
                    this._logger.error("Error finalizing part. " + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
            delete this._parts[partName];
            delete this[partName];
        }, this);
        finalizeInProgress = false;
        callback();
    },
    _findDefaultPreset: function BarApp__findDefaultPreset() {
        this._logger.config("Looking for default preset...");
        let internalPresetPath = "$content/presets/" + this._consts.DEF_PRESET_FILE_NAME;
        let presetFile;
        try {
            let presetUrl = this.defaultPresetURL;
            if (!presetUrl) {
                throw new Error("Can't get default preset preference value.");
            }
            let presetFileName = encodeURIComponent(presetUrl);
            presetFile = this.directories.presetsDir;
            presetFile.append(presetFileName);
            return this._defaultPreset = new this.BarPlatform.Preset(presetFile, presetUrl);
        } catch (e) {
            let presetFilePath = presetFile ? presetFile.path : "no file";
            this._logger.debug(strutils.formatString("Failed parsing normal default preset (%1).\n %2", [
                presetFilePath,
                strutils.formatError(e)
            ]));
            if (presetFile) {
                fileutils.removeFileSafe(presetFile);
            }
            let extPresetFile = this.directories.presetsDir;
            extPresetFile.append(this._consts.DEF_PRESET_FILE_NAME);
            try {
                let preset = new this.BarPlatform.Preset(extPresetFile);
                try {
                    extPresetFile.moveTo(null, encodeURIComponent(preset.url));
                    this.defaultPresetURL = preset.url;
                } catch (ex1) {
                    this._logger.error("Could not set external default preset as active. " + strutils.formatError(ex1));
                }
                return this._defaultPreset = preset;
            } catch (ex2) {
                if (extPresetFile.exists()) {
                    this._logger.debug("Failed parsing external default preset.\n" + strutils.formatError(ex2));
                    fileutils.removeFileSafe(extPresetFile);
                }
                try {
                    let presetDoc = fileutils.xmlDocFromStream(this.addonFS.getStream(internalPresetPath));
                    let preset = new this.BarPlatform.Preset(presetDoc);
                    try {
                        let destFileName = encodeURIComponent(preset.url);
                        let fMask = parseInt("0755", 8);
                        this.addonFS.copySource(internalPresetPath, this.directories.presetsDir, destFileName, fMask);
                        this.defaultPresetURL = preset.url;
                    } catch (ex3) {
                        this._logger.error("Could not extract internal preset.\n" + strutils.formatError(ex3));
                    }
                    this._usingInternalPreset = true;
                    return this._defaultPreset = preset;
                } catch (ex4) {
                    this._logger.fatal("Failed parsing internal default preset.\n" + strutils.formatError(ex4));
                    this._logger.debug(ex4.stack);
                }
            }
        }
        return null;
    },
    _hackKnownSkins: function BarApp__hackKnownSkins() {
        let selectedSkin = Preferences.get("extensions.lastSelectedSkin") || Preferences.get("general.skins.selectedSkin");
        if (!selectedSkin) {
            return;
        }
        if (selectedSkin == "classic/1.0") {
            selectedSkin = "classic";
        }
        let skinPaths = [
            selectedSkin,
            sysutils.platformInfo.os.name + "/" + selectedSkin
        ];
        const SS_SERVICE = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        const USER_SHEET = SS_SERVICE.USER_SHEET;
        skinPaths.forEach(function YS__hackKnownSkins_register(aSkinPath) {
            try {
                let uri = netutils.newURI("chrome://" + this.name + "/skin/hacks/themes/" + aSkinPath + ".css");
                if (!SS_SERVICE.sheetRegistered(uri, USER_SHEET)) {
                    SS_SERVICE.loadAndRegisterSheet(uri, USER_SHEET);
                }
            } catch (e) {
                if (!("result" in e && e.result === Components.results.NS_ERROR_FILE_NOT_FOUND)) {
                    this._logger.debug("Error while loading css for '" + aSkinPath + "' skin. " + e);
                }
            }
        }, this);
    },
    _cleanupPreferences: function BarApp__clearPreferences() {
        let currentSetData = this.overlayProvider.currentSetIds;
        if (sysutils.isEmptyObject(currentSetData)) {
            return;
        }
        let settingKeyPattern = /^(.+#.+)\.(\d+)\..+$/;
        function checkBranch(prefBranch) {
            prefBranch.getChildList("", {}).forEach(function (key) {
                let keyMatch = key.match(settingKeyPattern);
                if (!keyMatch) {
                    return;
                }
                let prefProtoID = keyMatch[1];
                let prefInstID = keyMatch[2];
                let instArray = currentSetData[prefProtoID];
                if (!instArray) {
                    prefBranch.deleteBranch(prefProtoID);
                } else {
                    if (instArray.indexOf(prefInstID) < 0) {
                        let settingKey = prefProtoID + "." + prefInstID;
                        prefBranch.deleteBranch(settingKey);
                    }
                }
            });
        }
        checkBranch(Services.prefs.getBranch(this._barCore.nativesPrefsPath));
    },
    _openWindow: function BarApp__openWindow(navigatorWindow, path, windowClass, focusIfOpened, resizeable, modal, windowArgs) {
        let baseNameMatch = path.match(/(\w+)\.x[um]l$/i);
        windowClass = windowClass || (this.name + baseNameMatch ? ":" + baseNameMatch[1] : "");
        if (focusIfOpened) {
            let chromeWindow = misc.getTopWindowOfType(windowClass);
            if (chromeWindow) {
                chromeWindow.focus();
                return chromeWindow;
            }
        }
        let features = [
            "chrome",
            "titlebar",
            "toolbar",
            "centerscreen",
            modal ? "modal" : "dialog=no"
        ];
        if (resizeable) {
            features.push("resizable");
        }
        let ownerWindow = navigatorWindow || misc.getTopBrowserWindow();
        let openParams = [
            path,
            windowClass,
            features.join()
        ].concat(windowArgs);
        return ownerWindow.openDialog.apply(ownerWindow, openParams);
    }
};
