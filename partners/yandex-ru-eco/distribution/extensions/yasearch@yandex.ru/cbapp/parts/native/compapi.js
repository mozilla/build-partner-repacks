"use strict";
function NativeBarAPI(componentInfo, logger) {
    if (!componentInfo || !(componentInfo.package_ instanceof BarPlatform.ComponentPackage)) {
        throw new CustomErrors.EArgType("componentInfo", "ComponentInfo", componentInfo);
    }
    this._componentInfo = componentInfo;
    if (!logger) {
        throw new CustomErrors.EArgType("logger", "Object", logger);
    }
    this._logger = logger;
    [
        "Async",
        "Autocomplete",
        "Browser",
        "Controls",
        "Database",
        "DistrData",
        "ElementsPlatform",
        "Environment",
        "Files",
        "Integration",
        "Localization",
        "Network",
        "Notifications",
        "Overlay",
        "Passport",
        "Package",
        "Promise",
        "Protocols",
        "Services",
        "Settings",
        "Statistics",
        "StrUtils",
        "SysUtils",
        "Task",
        "Tutorial",
        "WinReg",
        "XMLUtils"
    ].forEach(function inst(apiName) {
        sysutils.defineLazyGetter(this, apiName, function lazyGetter() {
            return new NativeBarAPI[apiName](this._componentInfo, this._logger, this);
        });
    }, this);
}
NativeBarAPI.CONSTS = { NOT_A_WIDGET: "This component is not a widget." };
function NoCompInfo(package_) {
    this._package = package_;
}
NoCompInfo.prototype = {
    get id() {
        throw new Error(this._NO_COMP_INFO);
    },
    get type() {
        throw new Error(this._NO_COMP_INFO);
    },
    get component() {
        throw new Error(this._NO_COMP_INFO);
    },
    get package_() {
        return this._package;
    },
    _NO_COMP_INFO: "Shareable API can't access component information!"
};
NativeBarAPI.prototype = {
    get componentID() {
        return this._componentInfo.id;
    },
    get componentType() {
        return this._componentInfo.type;
    },
    get componentCore() {
        return this._componentInfo.component.nativeModule.core;
    },
    get logger() {
        return this._logger;
    },
    queryAPIVersion: function NativeAPI_queryAPIVersion(version) {
        let apiVer = Number(version);
        if (apiVer > 0 && apiVer <= this.Environment.barPlatform.version) {
            return this;
        }
        throw new Error(strutils.formatString("API version %1 is not available", [version]));
    },
    get shareableAPI() {
        let logger = Log4Moz.repository.getLogger(appCore.appName + ".NativeAPI." + this._componentInfo.package_.id);
        let shareableAPI = new NativeBarAPI(new NoCompInfo(this._componentInfo.package_), logger);
        this.__defineGetter__("shareableAPI", function _shareableAPI() {
            return shareableAPI;
        });
        return this.shareableAPI;
    },
    finalize: function NativeAPI_finalize() {
        try {
            NativeComponents._unregisterServices(this.componentID);
        } catch (e) {
            this._logger.error("NativeComponents._unregisterServices failed. " + strutils.formatError(e));
        }
        try {
            NativeComponents._releaseServices(this.Services);
        } catch (e) {
            this._logger.error("NativeComponents._releaseServices failed. " + strutils.formatError(e));
        }
        this.ElementsPlatform._finalize();
        this.Settings._finalize();
        this.Autocomplete._finalize();
        this.Browser._finalize();
        this.SysUtils._finalize();
        this._componentInfo = null;
    }
};
NativeBarAPI.Services = function Services(componentInfo) {
    this._componentInfo = componentInfo;
};
NativeBarAPI.Services.prototype = {
    registerService: function NativeAPI_registerService(serviceName, serviceObject) {
        return NativeComponents.registerService(this._componentInfo.id, serviceName, serviceObject);
    },
    notifyServiceUsers: function NativeAPI_notifyServiceUsers(serviceName, topic, data) {
        NativeComponents.notifyServiceUsers(this._componentInfo.id, serviceName, topic, data);
    },
    unregisterService: function NativeAPI_unregisterService(serviceName) {
        return NativeComponents.unregisterService(this._componentInfo.id, serviceName);
    },
    obtainService: function NativeAPI_obtainService(providerID, serviceName, eventListener) {
        if (providerID === "ru.yandex.custombar.branding") {
            Cu.reportError("Warning! Obtaining branding as a service is deprecated.");
        }
        return NativeComponents.obtainService(providerID, serviceName, eventListener, this);
    },
    releaseService: function NativeAPI_releaseService(providerID, serviceName, eventListener) {
        NativeComponents.releaseService(providerID, serviceName, eventListener);
    }
};
NativeBarAPI.Environment = function Environment() {
};
NativeBarAPI.Environment.os = {
    get name() {
        return sysutils.platformInfo.os.name;
    }
};
NativeBarAPI.Environment.browser = {
    get name() {
        return sysutils.platformInfo.browser.name;
    },
    get version() {
        return sysutils.platformInfo.browser.version;
    }
};
NativeBarAPI.Environment.addon = {
    get id() {
        let id = AddonManager.getAddonId(appCore.extensionURI);
        this.__defineGetter__("id", function NativeAPI_Env_addon_id() {
            return id;
        });
        return this.id;
    },
    get version() {
        return application.addonManager.addonVersion;
    },
    get locale() {
        let localeString = application.localeString;
        let localeComponents = application.locale;
        let locale = {
            toString: function NativeAPI_locale_toString() {
                return localeString;
            },
            language: localeComponents.language || "",
            country: localeComponents.country || "",
            region: localeComponents.region || ""
        };
        this.__defineGetter__("locale", function NativeAPI_locale() {
            return locale;
        });
        return this.locale;
    },
    get userID() {
        return application.addonStatus.guidString;
    },
    get goingToUninstall() {
        return application.addonManager.isAddonUninstalling;
    },
    get type() {
        return appCore.CONFIG.APP.TYPE;
    }
};
NativeBarAPI.Environment.barPlatform = {
    get name() {
        return appCore.appName;
    },
    get version() {
        return appCore.CONFIG.PLATFORM.VERSION;
    },
    get soundsEnabled() {
        return false;
    }
};
NativeBarAPI.Environment.branding = {
    get brandID() {
        return application.branding.brandID;
    },
    expandBrandTemplates: function NativeAPI_branding_expandBrandTemplates(templateString, params, encodeParams) {
        if (typeof templateString !== "string") {
            throw new TypeError("'templateString' must be a string");
        }
        if (typeof params !== "undefined" && !(params && typeof params === "object")) {
            throw new TypeError("'params' must be an object");
        }
        if (typeof encodeParams !== "undefined" && typeof encodeParams !== "boolean") {
            throw new TypeError("'encodeParams' must be a boolean");
        }
        return application.branding.expandBrandTemplates(templateString, params, encodeParams);
    },
    expandBrandTemplatesEscape: function NativeAPI_branding_expandBrandTemplatesEscape(templateStr, params) {
        return this.expandBrandTemplates(templateStr, params, true);
    },
    findFile: function NativeAPI_branding_findFile(filePath) {
        return application.branding.brandPackage.findFile(filePath);
    },
    getXMLDocument: function NativeAPI_branding_getXMLDocument(docPath, privilegedParser) {
        return application.branding.brandPackage.getXMLDocument(docPath, privilegedParser);
    },
    resolvePath: function NativeAPI_branding_resolvePath(filePath) {
        return application.branding.brandPackage.resolvePath(filePath);
    }
};
NativeBarAPI.Environment.prototype = NativeBarAPI.Environment;
NativeBarAPI.Controls = function Controls(componentInfo, logger, api) {
    this._componentInfo = componentInfo;
    this._logger = logger;
    this._api = api;
};
NativeBarAPI.Controls.prototype = {
    openSettingsDialog: function NativeAPI_openSettingsDialog(browserWindow, setupID, paneType) {
        application.openSettingsDialog(browserWindow, setupID, paneType);
    },
    openAboutDialog: function NativeApi_openAboutDialog() {
        application.openAboutDialog();
    },
    navigateBrowser: function NativeAPI_navigateBrowser(navigateData) {
        return BarPlatform.navigateBrowser(navigateData);
    },
    addWidget: function NativeAPI_addWidget(widgetID, browserWindow, relativeTo, placeAfter) {
        if (!browserWindow) {
            browserWindow = misc.getTopBrowserWindow();
        } else if (!(browserWindow instanceof Ci.nsIDOMWindow)) {
            throw new TypeError("XUL window required " + browserWindow);
        }
        let wndController = NativeComponents._getWindowController(browserWindow);
        widgetID = widgetID || this._componentInfo.id;
        let [
            ,
            widgetElement
        ] = wndController.placeWidget(widgetID, relativeTo, placeAfter, undefined, true);
        return [
            widgetElement.wdgtInstanceID,
            widgetElement
        ];
    },
    removeWidget: function NativeAPI_removeWidget(WIIDorElement, browserWindow) {
        if (!browserWindow) {
            if (WIIDorElement instanceof Ci.nsIDOMElement) {
                browserWindow = WIIDorElement.ownerDocument.defaultView;
            } else {
                browserWindow = misc.getTopBrowserWindow();
            }
        }
        if (!(browserWindow instanceof Ci.nsIDOMWindow)) {
            throw new TypeError("XUL window required " + browserWindow);
        }
        NativeComponents._getWindowController(browserWindow).removeItem(WIIDorElement);
    },
    get allWidgetInstanceIDs() {
        if (this._componentInfo.type != "widget") {
            throw new Error(NativeBarAPI.CONSTS.NOT_A_WIDGET);
        }
        return this._componentInfo.component.spawnedIDs;
    },
    getAllWidgetItems: function NativeAPI_getAllWidgetItems() {
        if (this._componentInfo.type != "widget") {
            throw new Error(NativeBarAPI.CONSTS.NOT_A_WIDGET);
        }
        return this._componentInfo.component.getAllWidgetItems();
    },
    getAllWidgetItemsOfInstance: function NativeAPI_getAllWidgetItemsOfInstance(WIID) {
        if (this._componentInfo.type != "widget") {
            throw new Error(NativeBarAPI.CONSTS.NOT_A_WIDGET);
        }
        return this._componentInfo.component.getAllWidgetItemsOfInstance(WIID);
    },
    enablePlugin: function NativeAPI_enablePlugin(pluginID) {
        application.widgetLibrary.getPlugin(pluginID).enable();
    },
    disablePlugin: function NativeAPI_disablePlugin(pluginID) {
        application.widgetLibrary.getPlugin(pluginID).disable();
    },
    isPluginEnabled: function NativeAPI_isPluginEnabled(aPluginID) {
        if (!application.widgetLibrary.isKnownPlugin(aPluginID)) {
            return null;
        }
        return application.widgetLibrary.pluginEnabled(aPluginID);
    },
    createSlice: function NativeAPI_createSlice(sliceProps, WIID) {
        if (arguments.length > 1 && !WIID) {
            this._logger.error("Empty widget instance id.");
        }
        if (!sliceProps || typeof sliceProps !== "object") {
            throw new Error("Wrong slice properties object.");
        }
        return createSliceWrapper(sliceProps, this._api, WIID);
    }
};
NativeBarAPI.Overlay = function Overlay(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
};
NativeBarAPI.Overlay.prototype = {
    checkWidgetsInCurrentSet: function NativeAPI_checkWidgetsInCurrentSet(aWidgetProtoIds) {
        let currentSetIds = application.overlayProvider.currentSetIds;
        let result = Object.create(null);
        if (!Array.isArray(aWidgetProtoIds)) {
            aWidgetProtoIds = [aWidgetProtoIds];
        }
        aWidgetProtoIds.forEach(function (widgetID) {
            if (!application.widgetLibrary.isKnownWidget(widgetID)) {
                result[widgetID] = null;
            } else {
                result[widgetID] = widgetID in currentSetIds;
            }
        });
        return result;
    }
};
NativeBarAPI.Statistics = function Statistics(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
};
NativeBarAPI.Statistics.prototype = {
    logShortAction: function NativeAPI_logShortAction() {
    },
    logCustomAction: function NativeAPI_logCustomAction() {
    },
    logButtonClick: function NativeAPI_logButtonClick() {
    },
    logMenuClick: function NativeAPI_logMenuClick() {
    },
    logClickStatistics: function NativeAPI_logClickStatistics(statData) {
        return application.statistics.logClickStatistics(statData);
    },
    logAddonEvents: function NativeAPI_logAddonEvents(eventsMap) {
        application.addonStatus.logAddonEvents(eventsMap);
    },
    fetchBarNavigStat: function NativeAPI_fetchBarNavigStat() {
        return "";
    },
    get barnavigR1String() {
        return application.barnavig.barnavigR1String || "";
    },
    set barnavigR1String(aR1String) {
        if (typeof aR1String != "string") {
            throw new TypeError("aR1String must be a string");
        }
        application.barnavig.barnavigR1String = aR1String;
    },
    get alwaysSendUsageStat() {
        return application.statistics.alwaysSendUsageStat;
    },
    BarNavig: {
        addDataProvider: function NativeAPI_addDataProvider(aProvider) {
            application.barnavig.addDataProvider(aProvider);
        },
        removeDataProvider: function NativeAPI_removeDataProvider(aProvider) {
            application.barnavig.removeDataProvider(aProvider);
        },
        sendRequest: function NativeAPI_sendRequest(aRequestParams, aCallback) {
            application.barnavig.sendRequest(aRequestParams, aCallback);
        },
        forceRequest: function NativeAPI_sendRequestAlways(aRequestParams, aCallback) {
            application.barnavig.forceRequest(aRequestParams, aCallback);
        }
    }
};
NativeBarAPI.Settings = function Settings(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
    this._allSettingsObservers = Object.create(null);
    this._compSettingsObservers = [];
};
NativeBarAPI.Settings.prototype = {
    getValue: function NativeAPI_getValue(settingName, WIID) {
        if (this._componentInfo.type == "widget") {
            return this._componentInfo.component.lookupGetSettingValue(settingName, WIID);
        }
        return this._componentInfo.component.getSettingValue(settingName);
    },
    setValue: function NativeAPI_setValue(settingName, newValue, WIID) {
        if (this._componentInfo.type == "widget") {
            this._componentInfo.component.lookupSetSettingValue(settingName, WIID, newValue);
        } else {
            this._componentInfo.component.applySetting(settingName, newValue);
        }
    },
    observeChanges: function NativeAPI_observeChanges(observer, WIID) {
        if (!observer || typeof observer.onSettingChange != "function") {
            throw new TypeError("Observer must be an object with 'onSettingChange' method");
        }
        this._watchSettings();
        if (!WIID) {
            let observers = this._compSettingsObservers;
            if (observers.indexOf(observer) == -1) {
                observers.push(observer);
            }
        } else {
            let observers = this._allSettingsObservers[WIID];
            if (!observers) {
                this._watchInstSettings(WIID);
                observers = this._allSettingsObservers[WIID] = [];
            }
            if (observers.indexOf(observer) == -1) {
                observers.push(observer);
            }
        }
    },
    ignoreChanges: function NativeAPI_ignoreChanges(observer, WIID) {
        if (WIID) {
            if (this._allSettingsObservers[WIID]) {
                let index = this._allSettingsObservers[WIID].indexOf(observer);
                if (index != -1) {
                    this._allSettingsObservers[WIID].splice(index, 1);
                    if (!this._allSettingsObservers[WIID].length) {
                        delete this._allSettingsObservers[WIID];
                        this._ignoreInstSettings(WIID);
                    }
                }
            }
        } else {
            let ind = this._compSettingsObservers.indexOf(observer);
            if (ind != -1) {
                this._compSettingsObservers.splice(ind, 1);
            }
        }
        let isEmpty = function isEmpty(object) {
            for (let x in object) {
                return false;
            }
            return true;
        };
        if (!this._compSettingsObservers.length && isEmpty(this._allSettingsObservers)) {
            this._ignoreSettings();
        }
    },
    get PrefsModule() {
        return Preferences;
    },
    getPackageBranchPath: function NativeAPI_getPackageBranchPath() {
        return this._pbp || (this._pbp = NativeComponents.makePackagePrefPath(this._componentInfo.package_.id));
    },
    getComponentBranchPath: function NativeAPI_getComponentBranchPath() {
        return this._cbp || (this._cbp = NativeComponents.makeWidgetPrefPath(this._componentInfo.id));
    },
    getInstanceBranchPath: function NativeAPI_getInstanceBranchPath(WIID) {
        return NativeComponents.makeInstancePrefPath(this._componentInfo.id, WIID);
    },
    getStaticBranchPath: function NativeAPI_getStaticBranchPath(WIID) {
        return NativeComponents.makeStaticBranchPath(this._componentInfo.id, WIID);
    },
    get addonBranchPath() {
        return application.preferencesBranch;
    },
    _allSettingsObservers: null,
    _compSettingsObservers: null,
    _watchingCommonSettings: false,
    _finalize: function NativeAPI__finalize() {
        for (let WIID in this._allSettingsObservers) {
            try {
                this._ignoreInstSettings(WIID);
            } catch (e) {
            }
        }
        this._ignoreSettings();
        delete this._allSettingsObservers;
        delete this._compSettingsObservers;
    },
    observe: function NativeAPI_observe(subject, topic, data) {
        if (topic != "nsPref:changed") {
            return;
        }
        try {
            let prefProperties = BarPlatform.parsePrefPath(data, this._componentInfo.component.id);
            if (this._isRelevantPrefChange(prefProperties)) {
                this._logger.debug("Setting changed: " + sysutils.dump(prefProperties));
                this._notifyRelevantObservers(prefProperties);
            }
        } catch (e) {
            this._logger.error("nsIObserver.observe failed. " + strutils.formatError(e));
        }
    },
    _watchSettings: function NativeAPI__watchSettings() {
        if (this._watchingCommonSettings) {
            return;
        }
        let component = this._componentInfo.component;
        Preferences.observe2(NativeComponents.makePackagePrefPath(component.pkg.id), this);
        Preferences.observe2(NativeComponents.makeWidgetPrefPath(component.id), this);
        this._watchingCommonSettings = true;
    },
    _watchInstSettings: function NativeAPI__watchInstSettings(WIID) {
        if (WIID in this._allSettingsObservers) {
            throw new Error("Widget instance " + WIID + " settings are already being watched");
        }
        Preferences.observe2(NativeComponents.makeInstancePrefPath(this._componentInfo.component.id, WIID), this);
    },
    _ignoreSettings: function NativeAPI__ignoreSettings() {
        let component = this._componentInfo.component;
        Preferences.ignore2(NativeComponents.makePackagePrefPath(component.pkg.id), this);
        Preferences.ignore2(NativeComponents.makeWidgetPrefPath(component.id), this);
        this._watchingCommonSettings = false;
    },
    _ignoreInstSettings: function NativeAPI__ignoreInstSettings(WIID) {
        Preferences.ignore2(NativeComponents.makeInstancePrefPath(this._componentInfo.component.id, WIID), this);
    },
    _isRelevantPrefChange: function NativeAPI__isRelevantPrefChange(prefProperties) {
        let component = this._componentInfo.component;
        let settingName = prefProperties.settingName;
        if (this._componentInfo.type == "widget") {
            return prefProperties.isInstancePref && settingName in component._instSettings || prefProperties.isComponentPref && settingName in component.widgetSettings || prefProperties.isPackagePref && settingName in component.packageSettings;
        } else {
            return prefProperties.isComponentPref && settingName in component.pluginSettings || prefProperties.isPackagePref && settingName in component.packageSettings;
        }
    },
    _notifyRelevantObservers: function NativeAPI__notifyRelevantObservers(prefProperties) {
        let settingName = prefProperties.settingName;
        let newValue = this.getValue(settingName, prefProperties.instanceID);
        if (!prefProperties.isInstancePref) {
            this._notifyCompSettingsObservers(settingName, newValue);
        }
        this._notifyAllSettingsObservers(settingName, newValue, prefProperties.instanceID);
    },
    _notifyAllSettingsObservers: function NativeAPI__notifyAllSettingsObservers(settingName, newValue, instanceID) {
        let observersList;
        if (instanceID) {
            observersList = this._allSettingsObservers[instanceID];
        } else {
            observersList = [];
            for (let [
                        ,
                        instList
                    ] in Iterator(this._allSettingsObservers)) {
                observersList = observersList.concat(instList);
            }
        }
        this._callEachOnSettingChange(observersList, [
            settingName,
            newValue,
            instanceID
        ]);
    },
    _notifyCompSettingsObservers: function NativeAPI__notifyCompSettingsObservers(settingName, newValue) {
        this._callEachOnSettingChange(this._compSettingsObservers, [
            settingName,
            newValue
        ]);
    },
    _callEachOnSettingChange: function NativeAPI__callEachOnSettingChange(observersList, args) {
        for (let [
                    ,
                    observer
                ] in Iterator(observersList)) {
            try {
                if (observersList.indexOf(observer) != -1) {
                    observer.onSettingChange.apply(observer, args);
                }
            } catch (e) {
                this._logger.error("Settings observer failed in 'onSettingChange'. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
    }
};
NativeBarAPI.Package = function Package(componentInfo, logger) {
    this._package = componentInfo.package_;
    this._logger = logger;
};
NativeBarAPI.Package.prototype = {
    get id() {
        return this._package.id;
    },
    resolvePath: function NativeAPI_resolvePath(path, basePath) {
        return this._package.resolvePath(path, basePath);
    },
    fileExists: function NativeAPI_fileExists(path) {
        return Boolean(this._package.findFile(path));
    },
    getFileInputChannel: function NativeAPI_getFileInputChannel(path) {
        return this._package.newChannelFromPath(path);
    },
    readTextFile: function NativeAPI_readTextFile(path) {
        let fileStream = this.getFileInputChannel(path).contentStream;
        let fileContent = fileutils.readStringFromStream(fileStream);
        fileStream.close();
        return fileContent;
    },
    get info() {
        let packageInfo = application.packageManager.getPackageInfo(this._package.id);
        let info = {
            id: packageInfo.id,
            version: packageInfo.version,
            platformMin: packageInfo.platformMin
        };
        this.__defineGetter__("info", function _info() {
            return info;
        });
        return this.info;
    }
};
NativeBarAPI.Files = function Files(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
};
NativeBarAPI.Files.prototype = {
    getPackageStorage: function NativeAPI_getPackageStorage(create) {
        let result = NativeComponents.getPackageStorage(this._componentInfo.package_.id);
        this.getPackageStorage = function NativeAPI_getPackageStorage(inCreate) {
            if (inCreate) {
                fileutils.forceDirectories(result);
            }
            return result.clone();
        };
        return this.getPackageStorage(create);
    },
    getWidgetStorage: function NativeAPI_getWidgetStorage(create) {
        let result = NativeComponents.getComponentStorage(this._componentInfo.id);
        this.getWidgetStorage = function NativeAPI_getWidgetStorage(inCreate) {
            if (inCreate) {
                fileutils.forceDirectories(result);
            }
            return result.clone();
        };
        return this.getWidgetStorage(create);
    },
    getInstanceStorage: function NativeAPI_getInstanceStorage(WIID, create) {
        let result = this.getWidgetStorage();
        result.append(WIID);
        if (create) {
            fileutils.forceDirectories(result);
        }
        return result;
    },
    forceDirectories: function NativeAPI_forceDirectories(file) {
        fileutils.forceDirectories(file);
    },
    writeStreamToFile: function NativeAPI_writeStreamToFile(inputStream, destFile, accessRights, modeFlags) {
        return fileutils.writeStreamToFile(inputStream, destFile, accessRights, modeFlags);
    },
    readTextFile: function NativeAPI_readTextFile(file) {
        return fileutils.readTextFile(file);
    },
    writeTextFile: function NativeAPI_writeTextFile(file, text, accessRights, modeFlags) {
        return fileutils.writeTextFile(file, text, accessRights, modeFlags);
    },
    jsonFromFile: function NativeAPI_jsonFromFile(file) {
        return fileutils.jsonFromFile(file);
    },
    jsonToFile: function NativeAPI_jsonToFile(json, file, accessRights, modeFlags) {
        fileutils.jsonToFile(json, file, accessRights, modeFlags);
    }
};
NativeBarAPI.Database = function NativeBarAPI_Database(componentInfo, logger) {
};
NativeBarAPI.Database.prototype = {
    createInstance: function NativeAPI_Database_createInstance(storageFile, initStatements) {
        return new Database(storageFile, initStatements);
    }
};
NativeBarAPI.Async = function NativeBarAPI_Async(componentInfo, logger) {
};
NativeBarAPI.Async.prototype = {
    parallel: function NativeAPI_Async_parallel() {
        return async.parallel.apply(async, arguments);
    },
    series: function NativeAPI_Async_series() {
        return async.series.apply(async, arguments);
    },
    waterfall: function NativeAPI_Async_waterfall() {
        return async.waterfall.apply(async, arguments);
    },
    nextTick: function NativeAPI_Async_nextTick() {
        return async.nextTick.apply(async, arguments);
    }
};
NativeBarAPI.Promise = function NativeBarAPI_Promise(componentInfo, logger) {
};
NativeBarAPI.Promise.prototype = {
    defer: function NativeAPI_Promise_defer() {
        return promise.defer.apply(promise, arguments);
    },
    resolve: function NativeAPI_Promise_resolve() {
        return promise.resolve.apply(promise, arguments);
    },
    reject: function NativeAPI_Promise_reject() {
        return promise.reject.apply(promise, arguments);
    },
    all: function NativeAPI_Promise_all() {
        return promise.all.apply(promise, arguments);
    },
    race: function NativeAPI_Promise_race() {
        return promise.race.apply(promise, arguments);
    }
};
NativeBarAPI.Task = function NativeBarAPI_Task(componentInfo, logger) {
};
NativeBarAPI.Task.prototype = {
    spawn: function NativeAPI_Task_spawn() {
        return task.spawn.apply(task, arguments);
    },
    Result: function NativeAPI_Task_Result() {
        return task.Result.apply(task, arguments);
    }
};
NativeBarAPI.XMLUtils = function XMLUtils(componentInfo, logger) {
    this._logger = logger;
};
NativeBarAPI.XMLUtils.prototype = {
    xmlDocFromStream: function NativeAPI_xmlDocFromStream(stream, docURI, baseURI, privileged) {
        return fileutils.xmlDocFromStream(stream, docURI, baseURI, privileged);
    },
    xmlDocFromFile: function NativeAPI_xmlDocFromFile(localFile, privileged) {
        return fileutils.xmlDocFromFile(localFile, privileged);
    },
    xmlDocToFile: function NativeAPI_xmlDocToFile(xmlDocument, destFile, accessRights, modeFlags) {
        return fileutils.xmlDocToFile(xmlDocument, destFile, accessRights, modeFlags);
    },
    transformXMLToFragment: function NativeAPI_transformXMLToFragment(sourceNode, stylesheet, destDoc, oParams) {
        return xmlutils.transformXMLToFragment(sourceNode, stylesheet, destDoc, oParams);
    },
    queryXMLDoc: function NativeAPI_queryXMLDoc(xpathExpr, contextNode, extNSResolver) {
        return xmlutils.queryXMLDoc(xpathExpr, contextNode, extNSResolver);
    },
    getDOMParser: function NativeAPI_getDOMParser(docURI, baseURI, withSystemPrincipal) {
        return xmlutils.getDOMParser(docURI, baseURI, withSystemPrincipal);
    }
};
NativeBarAPI.StrUtils = function StrUtils(componentInfo, logger) {
    this._logger = logger;
};
NativeBarAPI.StrUtils.prototype = {
    readStringFromStream: function NativeAPI_readStringFromStream(inputStream) {
        return fileutils.readStringFromStream(inputStream);
    },
    formatError: function NativeAPI_formatError(error) {
        this._logger.error("NativeAPI.StrUtils.formatError is obsolete.");
        return strutils.formatError(error);
    },
    dumpValue: function NativeBarAPI_dumpValue(value, depth) {
        return sysutils.dump(value, depth);
    }
};
NativeBarAPI.Localization = function Localization(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
    this.__messagesHash = null;
};
NativeBarAPI.Localization.prototype = {
    createStringBundle: function Localization_createStringBundle(aURL) {
        let url = /^[a-z]+:\/\//.test(aURL) ? aURL : this._componentInfo.package_.resolvePath(aURL);
        return new application.appStrings.StringBundle(url);
    },
    getString: function Localization_getString(key) {
        return this._messagesHash[key] || "";
    },
    __messagesHash: null,
    get _messagesHash() {
        if (this.__messagesHash === null) {
            this.__messagesHash = Object.create(null);
            let xmlDoc = this._getMessagesXMLDoc(this._componentInfo.component.unit.name + ".messages.xml") || this._getMessagesXMLDoc("messages.xml");
            let nodes = xmlDoc && xmlutils.queryXMLDoc("/Messages/Message", xmlDoc) || [];
            for (let i = 0, node; node = nodes[i++];) {
                let key = node.getAttribute("key");
                if (key) {
                    this.__messagesHash[key] = node.getAttribute("value");
                }
            }
        }
        return this.__messagesHash;
    },
    _getMessagesXMLDoc: function Localization__getMessagesXMLDoc(fileName) {
        try {
            let package_ = this._componentInfo.package_;
            if (package_.findFile(fileName)) {
                return package_.getXMLDocument(fileName);
            }
        } catch (e) {
            this._logger.warn("Could not parse " + fileName + ". " + e);
        }
        return null;
    }
};
NativeBarAPI.SysUtils = function SysUtils(componentInfo, logger) {
    this._logger = logger;
    this._createdDataContainers = [];
};
NativeBarAPI.SysUtils.prototype = {
    Timer: function SysUtils_Timer(aCallback, aDelay, aRepeating, aMaxTimes) {
        return new sysutils.Timer(aCallback, aDelay, aRepeating, aMaxTimes);
    },
    createDataContainer: function SysUtils_createDataContainer(aDataContainerProperties) {
        let dc = new sysutils.DataContainer(aDataContainerProperties);
        this._createdDataContainers.push(dc);
        return dc;
    },
    copyProperties: function SysUtils_copyProperties(from, to, filter) {
        return sysutils.copyProperties(from, to, filter);
    },
    _createdDataContainers: null,
    _finalize: function SysUtils__finalize() {
        this._createdDataContainers.forEach(function (dc) {
            try {
                dc.finalize();
            } catch (e) {
                this._logger.error("Error finalizing DataContainer. " + e);
                this._logger.debug(e.stack);
            }
        }, this);
    }
};
NativeBarAPI.Browser = function Browser(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
    this._hiddenFrameAccessed = false;
    this._messageManager = null;
};
NativeBarAPI.Browser.prototype = {
    getWindowListener: function NativeAPI_getWindowListener(window) {
        return NativeComponents._getWindowController(window).windowListener;
    },
    getWindowDataIsland: function NativeAPI_getWindowDataIsland(window) {
        return NativeComponents._getWindowController(window).windowDataIsland;
    },
    get globalHiddenWindow() {
        throw new Error("Deprecated since platform 28 (8.10.1)");
    },
    getHiddenFrame: function NativeAPI_getHiddenFrame() {
        throw new Error("Deprecated since platform 28 (8.10.1)");
    },
    getHiddenFramePromise: function NativeAPI_getHiddenFramePromise() {
        this._hiddenFrameAccessed = true;
        return misc.hiddenWindows.getFramePromise(this._componentInfo.id, this.HIDDEN_CHROME_WINDOW_URL);
    },
    removeHiddenFrame: function NativeAPI_removeHiddenFrame() {
        return misc.hiddenWindows.removeFrame(this._componentInfo.id);
    },
    HIDDEN_CHROME_WINDOW_URL: "chrome://" + application.name + "/content/overlay/hiddenwindow.xul",
    get messageManager() {
        if (!this._messageManager) {
            this._messageManager = new MessageManager();
            Services.ww.registerNotification(this._messageManager);
        }
        return this._messageManager;
    },
    _finalize: function NativeAPI_Browser__finalize() {
        if (this._hiddenFrameAccessed) {
            this.removeHiddenFrame();
        }
        if (this._messageManager) {
            Services.ww.unregisterNotification(this._messageManager);
            this._messageManager = null;
        }
    }
};
function MessageManager() {
    this._urlsToLoad = Object.create(null);
    misc.getBrowserWindows().forEach(browserWindow => {
        if (browserWindow.document && browserWindow.document.readyState === "complete") {
            this._onWindowLoad(browserWindow);
        }
    });
}
MessageManager.prototype = {
    loadFrameScript: function MessageManager_loadFrameScript({url, target, allowDelayedLoad, runInGlobalScope}) {
        this._validateArgument("url", url);
        this._validateArgument("allowDelayedLoad", allowDelayedLoad);
        this._validateArgument("runInGlobalScope", runInGlobalScope);
        if (typeof target === "undefined") {
            this._loadFrameScriptInExistsWindows({
                url: url,
                runInGlobalScope: runInGlobalScope
            });
            return;
        }
        if (url.startsWith("xb://")) {
            let xbURI = Services.io.newURI(url, null, null);
            xbURI.QueryInterface(Ci.nsIFileURL);
            url = "file://" + xbURI.file.path;
        }
        this._getMessageManager(target).loadFrameScript(url, allowDelayedLoad || false, runInGlobalScope || false);
    },
    removeDelayedFrameScript: function MessageManager_removeDelayedFrameScript({url, target}) {
        this._validateArgument("url", url);
        if (typeof target === "undefined") {
            delete this._urlsToLoad[url];
            if (this._loadScriptInWindow) {
                misc.getBrowserWindows().forEach(function (browserWindow) {
                    this.removeDelayedFrameScript({
                        url: url,
                        target: browserWindow
                    });
                }, this);
            }
            return;
        }
        this._getMessageManager(target).removeDelayedFrameScript(url);
    },
    addMessageListener: function MessageManager_addMessageListener({target, messageName, listener}) {
        this._validateArgument("messageName", messageName);
        this._getMessageManager(target).addMessageListener(messageName, listener);
    },
    removeMessageListener: function MessageManager_removeMessageListener({target, messageName, listener}) {
        this._validateArgument("messageName", messageName);
        this._getMessageManager(target).removeMessageListener(messageName, listener);
    },
    sendAsyncMessage: function MessageManager_sendAsyncMessage({target, messageName, obj, objects, principal}) {
        this._validateArgument("messageName", messageName);
        this._getMessageManager(target).sendAsyncMessage(messageName, obj, objects, principal);
    },
    broadcastAsyncMessage: function MessageManager_broadcastAsyncMessage({target, messageName, obj, objects}) {
        this._validateArgument("messageName", messageName);
        this._getMessageManager(target).broadcastAsyncMessage(messageName, obj, objects);
    },
    observe: function WML_observe(subject, topic, data) {
        if (topic === "domwindowopened") {
            subject.addEventListener("load", this, false);
        }
    },
    handleEvent: function MessageManager_handleEvent(event) {
        switch (event.type) {
        case "load": {
                let window = event.currentTarget;
                window.removeEventListener("load", this, false);
                this._onWindowLoad(window);
                break;
            }
        case "unload": {
                let window = event.currentTarget;
                this._onWindowUnload(window);
                break;
            }
        case "TabOpen":
            this._loadFrameScriptsInBrowser(event.target.linkedBrowser);
            break;
        }
    },
    _onWindowLoad: function MessageManager__onWindowLoad(window) {
        if (!(window.gBrowser && window.gBrowser.tabContainer)) {
            return;
        }
        if (this._loadScriptInWindow) {
            this._loadFrameScriptsInWindow(window);
            return;
        }
        window.addEventListener("unload", this, false);
        this._loadFrameScriptsInWindow(window);
        window.gBrowser.tabContainer.addEventListener("TabOpen", this, false);
    },
    _onWindowUnload: function MessageManager__onWindowUnload(window) {
        window.removeEventListener("unload", this, false);
        window.gBrowser.tabContainer.removeEventListener("TabOpen", this, false);
    },
    _loadFrameScriptInExistsWindows: function MessageManager__loadFrameScriptInExistsWindows({url, runInGlobalScope}) {
        this._urlsToLoad[url] = { runInGlobalScope: Boolean(runInGlobalScope) };
        misc.getBrowserWindows().forEach(function (browserWindow) {
            this._loadFrameScriptsInWindow(browserWindow);
        }, this);
    },
    _loadFrameScriptsInWindow: function MessageManager__loadFrameScriptsInWindow(window) {
        if (this._loadScriptInWindow) {
            Object.keys(this._urlsToLoad).forEach(function (url) {
                this.loadFrameScript({
                    url: url,
                    target: window,
                    runInGlobalScope: this._urlsToLoad[url].runInGlobalScope,
                    allowDelayedLoad: true
                });
            }, this);
            return;
        }
        let gBrowser = window.gBrowser;
        if (!gBrowser || !Array.isArray(gBrowser.browsers)) {
            return;
        }
        gBrowser.browsers.forEach(function (browser) {
            this._loadFrameScriptsInBrowser(browser);
        }, this);
    },
    _loadFrameScriptsInBrowser: function MessageManager__loadFrameScriptsInBrowser(browser) {
        Object.keys(this._urlsToLoad).forEach(function (url) {
            this.loadFrameScript({
                url: url,
                target: browser,
                runInGlobalScope: this._urlsToLoad[url].runInGlobalScope
            });
        }, this);
    },
    get _loadScriptInWindow() {
        let loadScriptInWindow = sysutils.platformInfo.browser.version.isGreaterThan("38.a0");
        this.__defineGetter__("_loadScriptInWindow", () => loadScriptInWindow);
        return this._loadScriptInWindow;
    },
    _getMessageManager: function MessageManager__getMessageManager(target) {
        let messageManager = typeof target === "undefined" || target === "global" ? Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager) : target.messageManager;
        if (!messageManager) {
            throw new Error("Can not find message manager.");
        }
        return messageManager;
    },
    _validateArgument: function MessageManager__validateArgument(argumentType, argumentValue) {
        switch (argumentType) {
        case "url":
        case "messageName":
            if (typeof argumentValue !== "string" || !argumentValue) {
                throw new TypeError("'" + argumentType + "' must be a string.");
            }
            break;
        case "allowDelayedLoad":
        case "runInGlobalScope":
            if (typeof argumentValue !== "boolean" && typeof argumentValue !== "undefined") {
                throw new TypeError("'" + argumentType + "' must be boolean.");
            }
            break;
        default:
            break;
        }
    }
};
NativeBarAPI.Network = function Network() {
};
NativeBarAPI.Network.prototype = {
    Cookie: netutils.Cookie,
    findCookieValue: function Network_findCookieValue(URLorURI, cookieName, incHttpOnly, checkExpired, strictMatch) {
        return netutils.findCookieValue.apply(netutils, arguments);
    },
    findCookies: function Network_findCookies(URLorURI, cookieName, incHttpOnly, checkExpired, strictMatch) {
        return netutils.findCookies.apply(netutils, arguments);
    },
    getCookiesFromHost: function Network_getCookiesFromHost(aHost) {
        return netutils.getCookiesFromHost.apply(netutils, arguments);
    },
    cookieMatchesURI: function Network_cookieMatchesURL(cookie, uri, strictMatch) {
        return netutils.cookieMatchesURI.apply(netutils, arguments);
    },
    getCachedResource: function Network_getCachedResource(descrData) {
        return BarPlatform.CachedResources.getResource(new BarPlatform.CachedResources.ResDescriptor(descrData));
    }
};
NativeBarAPI.Autocomplete = function Autocomplete(componentInfo, logger) {
    this._componentInfo = componentInfo;
    this._logger = logger;
    this._providers = Object.create(null);
};
NativeBarAPI.Autocomplete.prototype = {
    commonHistoryCategory: appCore.appName + "-history",
    searchComponentName: appCore.appName + "-autocomplete",
    addSearchProvider: function NativeAPI_Autocomplete_addSearchProvider(aSearchId, aProvider) {
        let ok = this._autocompleteSearchService.addSearchProvider(aSearchId, aProvider);
        if (!ok) {
            throw new Error(strutils.formatString("Could not add search provider '%1'", [aSearchId]));
        }
        this._providers[aSearchId] = aProvider;
    },
    removeSearchProvider: function NativeAPI_Autocomplete_removeSearchProvider(aSearchId) {
        let ok = this._autocompleteSearchService.removeSearchProvider(aSearchId, this._providers[aSearchId]);
        delete this._providers[aSearchId];
        if (!ok) {
            throw new Error(strutils.formatString("Could not remove search provider '%1'", [aSearchId]));
        }
    },
    _providers: null,
    get _autocompleteSearchService() {
        let serviceId = "@mozilla.org/autocomplete/search;1?name=" + this.searchComponentName;
        let autocompleteSearchService = Cc[serviceId].getService().wrappedJSObject;
        this.__defineGetter__("_autocompleteSearchService", function NativeAPI_Autocomplete__autocompleteSearchService() {
            return autocompleteSearchService;
        });
        return this._autocompleteSearchService;
    },
    _finalize: function NativeAPI_Autocomplete__finalize() {
        for (let [
                    id,
                    provider
                ] in Iterator(this._providers)) {
            this._logger.warn("Removing dangling autocomplete provider " + id);
            this._autocompleteSearchService.removeSearchProvider(id, provider);
        }
    }
};
NativeBarAPI.DistrData = function DistrData() {
};
NativeBarAPI.DistrData.prototype = {
    getRecord: function NativeAPI_DistrData_getRecord(id) {
        return application.clids.vendorData[id] || null;
    }
};
NativeBarAPI.Protocols = function Protocols() {
};
NativeBarAPI.Protocols.prototype = {
    addBarHandler: function NativeAPI_Protocols_addBarHandler(protocolHandler) {
        appCore.protocols.bar.addDataProvider(protocolHandler);
    },
    removeBarHandler: function NativeAPI_Protocols_removeBarHandler(protocolHandler) {
        appCore.protocols.bar.removeDataProvider(protocolHandler);
    }
};
XPCOMUtils.defineLazyGetter(this, "WinRegObject", function WinRegObjectGetter() {
    return Cu.import("resource://" + application.name + "-mod/WinReg.jsm", {}).WinReg;
});
NativeBarAPI.WinReg = function WinReg() {
};
NativeBarAPI.WinReg.prototype = {
    read: function NativeAPI_WinReg_read() {
        return WinRegObject.read.apply(WinRegObject, arguments);
    },
    write: function NativeAPI_WinReg_write() {
        return WinRegObject.write.apply(WinRegObject, arguments);
    },
    remove: function NativeAPI_WinReg_remove() {
        return WinRegObject.remove.apply(WinRegObject, arguments);
    }
};
NativeBarAPI.Notifications = function Notifications(componentInfo) {
    this._componentId = componentInfo.id;
};
NativeBarAPI.Notifications.prototype = {
    create: function NativeAPI_Notifications_create(notificationData) {
        return application.notifications.create(this._componentId, notificationData, false);
    },
    erase: function NativeAPI_Notifications_erase(onlyHidden) {
        application.notifications.erase(this._componentId, onlyHidden);
    },
    update: function NativeAPI_Notifications_update(notificationId, notificationData) {
        application.notifications.update(this._componentId, notificationId, notificationData);
    },
    group: function NativeAPI_Notifications_group(queryId, notificationData) {
        return application.notifications.group(this._componentId, queryId, notificationData);
    },
    addListener: function NativeAPI_Notifications_addListener(listener) {
        application.notifications.addListener(this._componentId, listener);
    },
    removeListener: function NativeAPI_Notifications_removeListener(listener) {
        application.notifications.removeListener(this._componentId, listener);
    }
};
for (let p in application.notifications) {
    if (!/^(CLICK_TARGET_|CLOSE_REASON_|TEMPLATE_)/.test(p)) {
        continue;
    }
    NativeBarAPI.Notifications.prototype[p] = application.notifications[p];
}
NativeBarAPI.Integration = function NativeAPI_Integration() {
};
NativeBarAPI.Integration.prototype = {
    yandexBrowser: {
        get isInstalled() {
            return application.integration.yandexBrowser.isInstalled;
        },
        get isDefault() {
            return application.integration.yandexBrowser.isDefaultBrowser;
        },
        openBrowser: function NativeAPI_Integration_YaBrowser_openBrowser(aURL) {
            return application.integration.yandexBrowser.openBrowser(aURL);
        }
    }
};
NativeBarAPI.ElementsPlatform = function ElementsPlatform() {
    this._objectProviders = [];
};
NativeBarAPI.ElementsPlatform.prototype = {
    addObjectProvider: function NativeAPI_ElementsPlatform_addObjectProvider(provider) {
        if (typeof provider.getListenerForPage !== "function") {
            throw new Error("Bad window object provider interface (no 'getListenerForPage' method).");
        }
        this._objectProviders.push(provider);
        application.contentEnvironment.addPlatformObjectProvider(provider);
    },
    removeObjectProvider: function NativeAPI_ElementsPlatform_removeObjectProvider(provider) {
        application.contentEnvironment.removePlatformObjectProvider(provider);
        this._objectProviders = this._objectProviders.filter(p => p !== provider);
    },
    _objectProviders: null,
    _finalize: function NativeAPI_ElementsPlatform__finalize() {
        this._objectProviders.forEach(function (provider) {
            this.removeObjectProvider(provider);
        }, this);
        this._objectProviders = null;
    }
};
NativeBarAPI.Passport = function NativeAPI_Integration(componentInfo, logger) {
};
NativeBarAPI.Passport.prototype = {
    get EVENTS() {
        return application.passport.authManager.EVENTS;
    },
    get defaultAccount() {
        return application.passport.authManager.getDefaultAccount();
    },
    get authorizedAccounts() {
        return application.passport.authManager.accounts;
    },
    get allAccounts() {
        return application.passport.authManager.allAccounts;
    },
    get authdefs() {
        return application.passport.authManager.authdefs;
    },
    addListener: function (aEventType, aListener) {
        application.passport.authManager.addListener(aEventType, aListener);
    },
    removeListener: function (aEventType, aListener) {
        application.passport.authManager.removeListener(aEventType, aListener);
    },
    isAuthorized: function () {
        return application.passport.authManager.authorized;
    },
    hasSavedAccounts: function () {
        return application.passport.authManager.hasSavedAccounts();
    },
    hasSavedLogins: function () {
        return application.passport.authManager.hasSavedLogins();
    },
    getAuthorizedAccount: function (aAccountLoginOrUid) {
        return application.passport.authManager.getAuthorizedAccount(aAccountLoginOrUid);
    },
    getAccount: function (aAccountLoginOrUid) {
        return application.passport.authManager.getAccount(aAccountLoginOrUid);
    },
    switchAccount: function (aAccountLoginOrUid) {
        return application.passport.authManager.switchAccount(aAccountLoginOrUid);
    },
    logoutAccount: function (aAccount, aParams) {
        return application.passport.authManager.initLogoutProcess(aAccount, aParams);
    },
    logoutAllAccounts: function () {
        return application.passport.authManager.initLogoutAll();
    },
    openAuthDialog: function (dialogParams) {
        application.passport.authManager.openAuthDialog(dialogParams);
    }
};
NativeBarAPI.Tutorial = function NativeAPI_Tutorial(componentInfo, logger) {
};
NativeBarAPI.Tutorial.prototype = {
    showHighlight: function (window, target, effect) {
        return application.tutorial.showHighlight(window, target, effect);
    },
    showInfo: function (window, target, tutorialData) {
        return application.tutorial.showInfo(window, target, tutorialData);
    },
    hideHighlight: function (window) {
        return application.tutorial.hideHighlight(window);
    },
    hideInfo: function (window) {
        return application.tutorial.hideInfo(window);
    }
};
