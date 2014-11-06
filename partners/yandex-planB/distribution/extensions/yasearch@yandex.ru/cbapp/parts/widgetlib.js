"use strict";
const EXPORTED_SYMBOLS = ["widgetLibrary"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const widgetLibrary = {
    init: function WidgetLibrary_init(application) {
        this._barApp = application;
        this._barCore = application.core;
        this._barPlatform = application.BarPlatform;
        this._barCore.Lib.sysutils.copyProperties(this._barCore.Lib, GLOBAL);
        this._logger = application.getLogger("WLib");
        this._useParserCache = application.preferences.get("barplatform.components.parsercache") !== false;
        this._loadBundleLists();
        this._checkPreinstalledPackages();
        this._loadComponentsInfo();
        if (application.addonManager.info.addonVersionChanged) {
            try {
                this._logger.config("Removing parsers cache...");
                fileutils.removeFileSafe(application.directories.parsedCompsDir);
            } catch (e) {
                this._logger.error("Parser cache cleanup failed. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
    },
    finalize: function WidgetLibrary_finalize() {
        this._trySaveWidgetsList();
        this._trySavePluginsList();
        this.clear();
        this._logger = null;
    },
    clear: function WidgetLibrary_clear() {
        this.flushPlugins();
        this._packages = Object.create(null);
        this._knownWidgets = Object.create(null);
        this._pluginsData = Object.create(null);
    },
    cleanPackageParserCache: function WidgetLibrary_cleanPackageParserCache(packageID) {
        fileutils.removeFileSafe(this._getParserCacheDir(packageID));
    },
    activatePlugins: function WidgetLibrary_activatePlugins() {
        this._activatePlugins(undefined, this._prevPluginsState || this._defaultActivationMap, true);
    },
    setDefaultPluginsState: function WidgetLibrary_setDefaultPluginsState(noDefaultSettings) {
        this._activatePlugins(undefined, this._defaultActivationMap, false, noDefaultSettings);
    },
    setPluginsState: function WidgetLibrary_setPluginsState(activationMap, ignoreOthers) {
        this._activatePlugins(undefined, activationMap, ignoreOthers);
    },
    getComponentInfo: function WidgetLibrary_getComponentInfo(componentID) {
        let componentData = this._knownWidgets[componentID] || this._pluginsData[componentID];
        if (!componentData) {
            throw new Error(strutils.formatString("No such component (%1)", [componentID]));
        }
        let componentInfo = componentData.info || (componentData.info = this._loadComponentInfo(componentID));
        return sysutils.copyObj(componentInfo);
    },
    getComponentsInfo: function WidgetLibrary_getComponentsInfo(fromPackageID) {
        return this.getWidgetsInfo(fromPackageID).concat(this.getPluginsInfo(fromPackageID));
    },
    registerWidgets: function WidgetLibrary_registerWidgets(newWidgetIDs, dontFail, logStat) {
        let registered = 0;
        if (!Array.isArray(newWidgetIDs)) {
            newWidgetIDs = [newWidgetIDs];
        }
        for (let [
                    ,
                    widgetID
                ] in Iterator(newWidgetIDs)) {
            registered += this._registerComponent(widgetID, "widget", dontFail, logStat);
        }
        if (registered > 0) {
            this._logger.debug("Registered " + registered + " widgets.");
        }
        return registered;
    },
    registerPlugins: function WidgetLibrary_registerPlugins(newPluginIDs, dontFail, logStat) {
        let registered = 0;
        if (!Array.isArray(newPluginIDs)) {
            newPluginIDs = [newPluginIDs];
        }
        for (let [
                    ,
                    pluginID
                ] in Iterator(newPluginIDs)) {
            registered += this._registerComponent(pluginID, "plugin", dontFail, logStat);
        }
        if (registered > 0) {
            this._logger.debug("Registered " + registered + " plugins.");
        }
        return registered;
    },
    forgetWidgets: function WidgetLibrary_forgetWidget(protoIDsArray, logStat) {
        let componentsUsage = this._barApp.componentsUsage;
        let unregistered = 0;
        protoIDsArray.forEach(function (protoID) {
            if (!(protoID in this._knownWidgets)) {
                return;
            }
            let widgetInfo = this.getWidgetInfo(protoID);
            unregistered++;
            delete this._knownWidgets[protoID];
            if (logStat) {
                componentsUsage.logSysAction(protoID, componentsUsage.ACTIONS.COMP_REMOVE);
            }
            if (widgetInfo.barAPI == "xb") {
                fileutils.removeFileSafe(this._getParserCacheFile(protoID));
            } else {
                fileutils.removeFileSafe(this._barApp.NativeComponents.getComponentStorage(protoID));
            }
        }, this);
        if (unregistered > 0) {
            this._logger.debug("Forgot " + unregistered + " widgets.");
        }
        return unregistered;
    },
    forgetPlugins: function WidgetLibrary_forgetPlugins(pluginIDsArray, logStat) {
        let componentsUsage = this._barApp.componentsUsage;
        let unregistered = 0;
        pluginIDsArray.forEach(function (pluginID) {
            if (!(pluginID in this._pluginsData)) {
                return;
            }
            unregistered++;
            delete this._pluginsData[pluginID];
            if (logStat) {
                componentsUsage.logSysAction(pluginID, componentsUsage.ACTIONS.COMP_REMOVE);
            }
            fileutils.removeFileSafe(this._barApp.NativeComponents.getComponentStorage(pluginID));
        }, this);
        if (unregistered > 0) {
            this._logger.debug("Forgot " + unregistered + " plugins.");
        }
        return unregistered;
    },
    forgetComponents: function WidgetLibrary_forgetComponents(compIDsArray, logStat) {
        let unregistered = 0;
        compIDsArray.forEach(function (compID) {
            if (compID in this._knownWidgets) {
                this.forgetWidgets([compID], logStat);
            } else if (compID in this._pluginsData) {
                this.forgetPlugins([compID], logStat);
            } else {
                return;
            }
            unregistered++;
        }, this);
        return unregistered;
    },
    getCurrentPluginsState: function WidgetLibrary_getCurrentPluginsState(packageID) {
        return this._getPluginActivationMap(packageID);
    },
    getPlugin: function WidgetLibrary_getPlugin(pluginID) {
        if (!(pluginID in this._pluginsData)) {
            throw new Error(strutils.formatString("No such plugin (%1).", [pluginID]));
        }
        let pluginData = this._pluginsData[pluginID];
        return (pluginData ? pluginData.component : null) || this._loadPlugin(pluginID);
    },
    getPlugins: function WidgetLibrary_getPlugins(fromPackageID, activeOnly) {
        return this._forEachKnownPlugin(fromPackageID, function id2plugin(pluginID) {
            let plugin = this.getPlugin(pluginID);
            if (activeOnly) {
                return plugin.enabled ? plugin : null;
            }
            return plugin;
        });
    },
    getPluginIDs: function WidgetLibrary_getPluginIDs(fromPackageID) {
        return this._forEachKnownPlugin(fromPackageID, function id2id(protoID) {
            return protoID;
        });
    },
    getPluginInfo: function WidgetLibrary_getPluginInfo(pluginID) {
        if (!(pluginID in this._pluginsData)) {
            throw new Error(strutils.formatString("No such plugin (%1).", [pluginID]));
        }
        let pluginData = this._pluginsData[pluginID];
        let pluginInfo = pluginData.info || (pluginData.info = this._loadComponentInfo(pluginID));
        return sysutils.copyObj(pluginInfo);
    },
    getPluginsInfo: function WidgetLibrary_getPluginsInfo(fromPackageID) {
        return this._forEachKnownPlugin(fromPackageID, function id2info(pluginID) {
            return this.getPluginInfo(pluginID);
        });
    },
    pluginEnabled: function WidgetLibrary_pluginEnabled(pluginID) {
        if (!(pluginID in this._pluginsData)) {
            throw new Error(strutils.formatString("No such plugin (%1).", [pluginID]));
        }
        let plugin = this._pluginsData[pluginID].component;
        return plugin ? plugin.enabled : false;
    },
    flushPlugins: function WidgetLibrary_flushPlugins(packageID) {
        this._forEachKnownPlugin(packageID, function __flushPlugin(pluginID) {
            try {
                let plugin = this._pluginsData[pluginID].component;
                if (plugin) {
                    plugin.finalize();
                }
            } catch (e) {
                this._logger.error("Could not finalize plugin. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            } finally {
                this._pluginsData[pluginID] = {
                    info: null,
                    component: null
                };
            }
        }, this);
    },
    get noKnownPlugins() sysutils.isEmptyObject(this._pluginsData),
    getWidgetInfo: function WidgetLibrary_getWidgetInfo(protoID) {
        if (!(protoID in this._knownWidgets)) {
            throw new Error(strutils.formatString(this._consts.ERR_NO_SUCH_WIDGET, [protoID]));
        }
        let widgetData = this._knownWidgets[protoID];
        let widgetInfo = widgetData.info || (widgetData.info = this._loadComponentInfo(protoID));
        return sysutils.copyObj(widgetInfo);
    },
    getWidgetsInfo: function WidgetLibrary_getWidgetsInfo(fromPackageID) {
        return this._forEachKnownWidget(fromPackageID, function id2info(protoID) {
            return this.getWidgetInfo(protoID);
        });
    },
    widgetProtoInstantiated: function WidgetLibrary_widgetProtoInstantiated(protoID) {
        if (!(protoID in this._knownWidgets)) {
            throw new Error(strutils.formatString(this._consts.ERR_NO_SUCH_WIDGET, [protoID]));
        }
        let widgetProto = this._knownWidgets[protoID].component;
        return widgetProto ? widgetProto.spawnedIDs.length > 0 : false;
    },
    getWidgetProto: function WidgetLibrary_getWidgetProto(protoID) {
        if (!(protoID in this._knownWidgets)) {
            throw new Error(strutils.formatString(this._consts.ERR_NO_SUCH_WIDGET, [protoID]));
        }
        let widgetData = this._knownWidgets[protoID];
        return widgetData.component || (widgetData.component = this._loadWidgetProto(protoID));
    },
    getWidgetProtos: function WidgetLibrary_getWidgetProtos(fromPackageID) {
        return this._forEachKnownWidget(fromPackageID, function id2proto(protoID) {
            return this.getWidgetProto(protoID);
        });
    },
    getWidgetIDs: function WidgetLibrary_getWidgetIDs(fromPackageID) {
        return this._forEachKnownWidget(fromPackageID, function id2id(protoID) {
            return protoID;
        });
    },
    getAvaibleWidgetIDs: function WidgetLibrary_getAvaibleWidgetIDs(fromPackageID) {
        return this._forEachKnownWidget(fromPackageID, function id2avaible_id(protoID) {
            return protoID;
        });
    },
    get noKnownWidgets() sysutils.isEmptyObject(this._knownWidgets),
    isKnownWidget: function WidgetLibrary_isKnownWidget(protoID) {
        return protoID in this._knownWidgets;
    },
    isKnownPlugin: function WidgetLibrary_isKnownPlugin(pluginID) {
        return pluginID in this._pluginsData;
    },
    isKnownComponent: function WidgetLibrary_isKnownWidget(componentID) {
        return this.isKnownWidget(componentID) || this.isKnownPlugin(componentID);
    },
    isPreinstalledPackage: function WidgetLibrary_isPreinstalledPackage(packageID) {
        return this._barApp.defaultPreset.refsPackage(packageID);
    },
    isPreinstalledWidget: function WidgetLibrary_isPreinstalledWidget(widgetID) {
        return this._barApp.defaultPreset.refsWidget(widgetID);
    },
    isPreinstalledPlugin: function WidgetLibrary_isPreinstalledPlugin(pluginID) {
        return this._barApp.defaultPreset.refsPlugin(pluginID);
    },
    persist: function WidgetLibrary_persist(writeWidgets, writePlugins) {
        if (writeWidgets === undefined || writeWidgets) {
            this._saveWidgetsList();
        }
        if (writePlugins === undefined || writePlugins) {
            this._savePluginsList();
        }
    },
    flushWidgets: function WidgetLibrary_flushWidgets(packageID) {
        this._forEachKnownWidget(packageID, function flushWidget(protoID) {
            this._knownWidgets[protoID] = {
                info: null,
                component: null
            };
        }, this);
    },
    _consts: {
        STR_KNOWN_WIDGETS_FILE_NAME: "known_widgets.json",
        STR_KNOWN_PLUGINS_FILE_NAME: "plugins.json",
        STR_INTERNAL_PKGS_DATA_PATH: "$content/internal_packages.json",
        ERR_UNIT_HAS_NO_WIDGET: "Unit does not declare a widget",
        ERR_UNIT_HAS_NO_PLUGIN: "Unit does not declare a plugin",
        ERR_NO_COMP_INFO: "Could not get component info from unit",
        ERR_COULDNT_WRITE_WLIST: "Could not write known widgets list. ",
        ERR_COULDNT_WRITE_PLIST: "Could not write known plugins list. ",
        ERR_INVALID_WIDGET_ID: "Invalid widget ID",
        ERR_NO_SUCH_WIDGET: "No such widget (%1)"
    },
    _barApp: null,
    _logger: null,
    _packages: Object.create(null),
    _knownWidgets: Object.create(null),
    _prevPluginsState: undefined,
    _pluginsData: Object.create(null),
    _internalPackagesInfo: Object.create(null),
    _useParserCache: true,
    _registerComponent: function WidgetLibrary__registerComponent(componentID, componentType, dontFail, logStat) {
        let registry = componentType == "widget" ? this._knownWidgets : this._pluginsData;
        if (componentID in registry) {
            return 0;
        }
        const componentsUsage = this._barApp.componentsUsage;
        try {
            let componentInfo = this._loadComponentInfo(componentID);
            if (componentInfo.barAPI === "xb") {
                fileutils.removeFileSafe(this._getParserCacheFile(componentID));
                return 0;
            }
            if (componentType != componentInfo.type) {
                throw new TypeError(strutils.formatString("Component type missmatch. Expected: '%1', got '%2'", [
                    componentType,
                    componentInfo.type
                ]));
            }
            registry[componentID] = {
                component: null,
                info: componentInfo
            };
            if (logStat) {
                componentsUsage.logSysAction(componentID, componentsUsage.ACTIONS.COMP_INSTALL);
            }
            return 1;
        } catch (e) {
            if (dontFail) {
                this._logger.warn("Could not register component \"" + componentID + "\". " + strutils.formatError(e));
                return 0;
            }
            throw e;
        }
    },
    _getParserCacheDir: function WidgetLibrary__getParserCacheDir(packageID) {
        let cacheDir = this._barApp.directories.parsedCompsDir;
        cacheDir.append(misc.CryptoHash.getFromString(packageID, "MD5"));
        return cacheDir;
    },
    _getParserCacheFile: function WidgetLibrary__getParserCacheFile(componentID) {
        let [
            packageID,
            compName
        ] = this._barPlatform.parseComponentID(componentID);
        let cacheFile = this._getParserCacheDir(packageID);
        cacheFile.append(compName);
        cacheFile.append(this._barApp.localeString);
        cacheFile.append(compName);
        return cacheFile;
    },
    _loadBundleLists: function WidgetLibrary__loadBundleLists() {
        let addonFS = this._barApp.addonFS;
        try {
            this._internalPackagesInfo = JSON.parse(fileutils.readStringFromStream(addonFS.getStream(this._consts.STR_INTERNAL_PKGS_DATA_PATH)));
        } catch (e) {
            this._logger.error("Could not load preinstalled widgets info. " + strutils.formatError(e));
        }
    },
    _checkPreinstalledPackages: function WidgetLibrary__checkPreinstalledPackages() {
        let installInfo = this._barApp.addonManager.info;
        if (installInfo.addonVersionChanged || installInfo.buildNumberChanged) {
            this._logger.config("  Replacing built-in packages");
            for (let pkgID in this._internalPackagesInfo) {
                if (this._barApp.packageManager.isPackageInstalled(pkgID)) {
                    this._barApp.packageManager.uninstallPackage(pkgID);
                    this.cleanPackageParserCache(pkgID);
                }
            }
            this._extractBuiltinPackages(misc.mapKeysToArray(this._internalPackagesInfo));
            this._barApp.packageManager.rescanPackages();
        } else {
            let missingPackages = [];
            for (let pkgID in this._internalPackagesInfo) {
                this._logger.debug("  Checking package " + pkgID);
                if (!this._barApp.packageManager.isPackageInstalled(pkgID)) {
                    missingPackages.push(pkgID);
                    this.cleanPackageParserCache(pkgID);
                    continue;
                }
            }
            if (missingPackages.length > 0) {
                this._logger.warn("  Missing packages: " + missingPackages + ". I'll try to restore.");
                this._extractBuiltinPackages(missingPackages);
                this._barApp.packageManager.rescanPackages();
            }
        }
    },
    _extractBuiltinPackages: function WidgetLibrary_extractBuiltinPackages(packageIDs) {
        let packagesDir = this._barApp.directories.packagesDir;
        packageIDs.forEach(function (packageID) {
            try {
                let packageDirName = this._internalPackagesInfo[packageID].dirName;
                let destPackageDirName = this._barApp.directories.makePackageDirName();
                let packageDir = packagesDir.clone();
                packageDir.append(destPackageDirName);
                if (packageDir.exists()) {
                    packageDir.remove(true);
                }
                this._barApp.addonFS.copySource("$content/packages/" + packageDirName, packagesDir, destPackageDirName);
            } catch (e) {
                this._logger.error("Couldn't extract package \"" + packageID + "\". " + strutils.formatError(e));
                let stackTace = e.stack;
                if (stackTace) {
                    this._logger.debug(stackTace);
                }
            }
        }, this);
    },
    _forEachKnownWidget: function WidgetLibrary__forEachKnownWidget(fromPackageID, callback) {
        return this._forEachComponentID(this._knownWidgets, fromPackageID, callback);
    },
    _forEachKnownPlugin: function WidgetLibrary__forEachKnownPlugin(fromPackageID, callback) {
        return this._forEachComponentID(this._pluginsData, fromPackageID, callback);
    },
    _forEachComponentID: function WidgetLibrary__forEachComponentID(componentsMap, fromPackageID, callback) {
        let result = [];
        for (let componentID in componentsMap) {
            if (fromPackageID) {
                let [packageID] = this._barPlatform.parseComponentID(componentID);
                if (packageID !== fromPackageID) {
                    continue;
                }
            }
            let component = callback.call(this, componentID);
            if (component != null) {
                result.push(component);
            }
        }
        return result;
    },
    _loadComponentsInfo: function WidgetLibrary__loadComponentsInfo() {
        let knownWidgetIDs = [];
        try {
            let dataFile = this._barApp.directories.appRootDir;
            dataFile.append(this._consts.STR_KNOWN_WIDGETS_FILE_NAME);
            if (dataFile.exists()) {
                knownWidgetIDs = JSON.parse(fileutils.readTextFile(dataFile));
            }
        } catch (e) {
            this._logger.error("An error occured while reading known widgets list. " + strutils.formatError(e));
        }
        this.registerWidgets(knownWidgetIDs, true);
        try {
            let dataFile = this._barApp.directories.appRootDir;
            dataFile.append(this._consts.STR_KNOWN_PLUGINS_FILE_NAME);
            if (dataFile.exists()) {
                this._prevPluginsState = JSON.parse(fileutils.readTextFile(dataFile));
            }
        } catch (e) {
            this._logger.error("Could not load active plugins list. " + strutils.formatError(e));
        }
        if (this._prevPluginsState) {
            this.registerPlugins(misc.mapKeysToArray(this._prevPluginsState), true);
        }
    },
    _makeComponentID: function WidgetLibrary__makeComponentID(packageID, componentName) {
        return packageID + "#" + componentName;
    },
    _loadWidgetProto: function WidgetLibrary__loadWidgetProto(protoID) {
        let [
            packageID,
            widgetName
        ] = this._barPlatform.parseComponentID(protoID);
        let packageInfo = this._barApp.packageManager.getPackageInfo(packageID);
        let package_ = this._barApp.packageManager.getPackage(packageID);
        let unit = package_.getUnit(widgetName);
        let componentInfo = unit.componentInfo;
        if (componentInfo.type != "widget") {
            throw new Error(this._consts.ERR_UNIT_HAS_NO_WIDGET);
        }
        if (this._useParserCache) {
            let cacheFile = this._getParserCacheFile(protoID);
            let cacheFileExists = cacheFile.exists();
            let proto = unit.getComponent(cacheFileExists ? cacheFile : undefined);
            if (!cacheFileExists) {
                unit.tryCacheComponent(cacheFile);
            }
            return proto;
        }
        return unit.getComponent();
    },
    _loadComponentInfo: function WidgetLibrary__loadComponentInfo(protoID) {
        let [
            packageID,
            componentName
        ] = this._barPlatform.parseComponentID(protoID);
        let package_ = this._barApp.packageManager.getPackage(packageID);
        let info = package_.getUnit(componentName).componentInfo;
        if (!info) {
            throw new Error(this._consts.ERR_NO_COMP_INFO);
        }
        return info;
    },
    _activatePlugins: function WidgetLibrary__activatePlugins(packageID, activationMap, ignoreOthers, noDefaultSettings) {
        let failedPlugins = [];
        this._forEachKnownPlugin(packageID, function __loadPlugin(pluginID) {
            try {
                if (ignoreOthers && !(pluginID in activationMap)) {
                    return;
                }
                let plugin = this.getPlugin(pluginID);
                try {
                    let active;
                    let settings;
                    let activationRec = activationMap[pluginID];
                    if (Array.isArray(activationRec)) {
                        active = activationRec[0];
                        settings = activationRec[1];
                    } else {
                        active = Boolean(activationRec);
                    }
                    if (settings && !noDefaultSettings) {
                        plugin.applySettings(settings, true);
                    }
                    plugin.enabled = active;
                } catch (e) {
                    this._logger.error(strutils.formatString("Could not turn plugin (%1) on. %2", [
                        pluginID,
                        strutils.formatError(e)
                    ]));
                }
            } catch (e) {
                failedPlugins.push(pluginID);
                this._logger.error(strutils.formatString("Could not create plugin %1. %2", [
                    pluginID,
                    strutils.formatError(e)
                ]));
            }
        });
        failedPlugins.forEach(function __removeFailed(pluginID) {
            delete this._pluginsData[pluginID];
        }, this);
    },
    _loadPlugin: function WidgetLibrary__loadPlugin(pluginID) {
        let [
            packageID,
            pluginName
        ] = this._barPlatform.parseComponentID(pluginID);
        let unit = this._barApp.packageManager.getPackage(packageID).getUnit(pluginName);
        let componentInfo = unit.componentInfo;
        if (componentInfo.type != "plugin") {
            throw new Error(this._consts.ERR_UNIT_HAS_NO_PLUGIN);
        }
        let plugin = unit.getComponent();
        this._pluginsData[pluginID] = {
            info: componentInfo,
            component: plugin
        };
        return plugin;
    },
    _getPluginActivationMap: function WidgetLibrary__getPluginActivationMap(fromPackageID) {
        let result = Object.create(null);
        for (let pluginID in this._pluginsData) {
            if (fromPackageID) {
                let [packageID] = this._barPlatform.parseComponentID(pluginID);
                if (packageID !== fromPackageID) {
                    continue;
                }
            }
            let plugin = this._pluginsData[pluginID].component;
            result[pluginID] = plugin ? plugin.enabled : false;
        }
        return result;
    },
    get _defaultActivationMap() {
        let result = Object.create(null);
        this._barApp.defaultPreset.pluginEntries.forEach(function (pluginEntry) {
            result[pluginEntry.componentID] = [
                pluginEntry.enabled == pluginEntry.ENABLED_YES,
                pluginEntry.settings
            ];
        });
        return result;
    },
    _trySaveWidgetsList: function WidgetLibrary__trySaveWidgetsList() {
        try {
            this._saveWidgetsList();
        } catch (e) {
            this._logger.error(this._consts.ERR_COULDNT_WRITE_WLIST + strutils.formatError(e));
        }
    },
    _trySavePluginsList: function WidgetLibrary__trySavePluginsList(stateMap) {
        try {
            this._savePluginsList(stateMap);
        } catch (e) {
            this._logger.error(this._consts.ERR_COULDNT_WRITE_PLIST + strutils.formatError(e));
        }
    },
    _saveWidgetsList: function WidgetLibrary__saveWidgetsList() {
        let dataFile = this._barApp.directories.appRootDir;
        dataFile.append(this._consts.STR_KNOWN_WIDGETS_FILE_NAME);
        let writeWhat = JSON.stringify(this.getWidgetIDs());
        fileutils.writeTextFile(dataFile, writeWhat);
    },
    _savePluginsList: function WidgetLibrary__savePluginsList(stateMap) {
        let dataFile = this._barApp.directories.appRootDir;
        dataFile.append(this._consts.STR_KNOWN_PLUGINS_FILE_NAME);
        let writeWhat = JSON.stringify(stateMap || this._getPluginActivationMap());
        fileutils.writeTextFile(dataFile, writeWhat);
    }
};
