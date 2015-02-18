"use strict";
var NativeWidgetPrototype = BarPlatform.WidgetPrototypeBase.extend({
    constructor: function NativeWidgetPrototype(protoID, name, unique, iconPath, nativeModulePath, unit) {
        if (!nativeModulePath) {
            throw new CustomErrors.EArgRange("nativeModulePath", "FilePath", nativeModulePath);
        }
        this.base(protoID, name, unique, iconPath, unit);
        this._nativeModulePath = nativeModulePath;
        this._settingsMap = Object.create(null);
        this._packageSettings = Object.create(null);
        this._instSettings = Object.create(null);
        this._logger = NativeComponents._getLogger(BarPlatform.makeCompLoggerName(unit));
    },
    createInstance: function NativeWidgetPrototype_createInstance(instanceID, widgetHost, instanceSettings) {
        let spawnRec = instanceID in this._spawns ? this._spawns[instanceID] : this._makeSpawnRecord(instanceID);
        let instance = new NativeWidgetInstance(instanceID, this, widgetHost, spawnRec.settings);
        spawnRec.projections.push(instance);
        this._spawns[instanceID] = spawnRec;
        instance.applySettings(instanceSettings, true);
        return instance;
    },
    get widgetSettings() {
        return sysutils.copyObj(this._settingsMap);
    },
    get packageSettings() {
        return sysutils.copyObj(this._packageSettings);
    },
    finalize: function NativeWidgetprototype_finalize() {
        this._coreInitAttempted = false;
        if (this._coreInitialized) {
            this._finalizeCore();
        }
        if (this._observing) {
            this._stopObserving();
        }
        this._nativeModule = null;
        this._settingsMap = null;
        for (let settingName in this._packageSettings) {
            try {
                this.pkg.removeSettingUser(settingName, this.id);
            } catch (e) {
                this._logger.error(strutils.formatString("Failed in removeSettingUser(%1). %2", [
                    settingName,
                    strutils.formatError(e)
                ]));
            }
        }
        this._packageSettings = null;
        this._instSettings = null;
        this.base();
    },
    registerSetting: function NativeWidgetPrototype_registerSetting(settingName, settingScope, defaultValue, valueType, controlElement) {
        switch (settingScope) {
        case BarPlatform.Unit.scopes.ENUM_SCOPE_PACKAGE: {
                this._packageSettings[settingName] = {
                    defaultValue: defaultValue,
                    type: valueType,
                    controlElement: controlElement
                };
                this.pkg.addSettingUser(settingName, this.id);
                break;
            }
        case BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET:
            this._settingsMap[settingName] = {
                defaultValue: defaultValue,
                type: valueType,
                controlElement: controlElement
            };
            break;
        case BarPlatform.Unit.scopes.ENUM_SCOPE_INSTANCE:
            this._instSettings[settingName] = {
                defaultValue: defaultValue,
                type: valueType,
                controlElement: controlElement
            };
            break;
        default:
            throw new CustomErrors.EArgType("settingScope", "ENUM_SCOPE_PACKAGE | ENUM_SCOPE_WIDGET | ENUM_SCOPE_INSTANCE", String(settingScope));
        }
    },
    getSettingValue: function NativeWidgetPrototype_getSettingValue(settingName) {
        let rawValue;
        let settingData;
        if (settingName in this._settingsMap) {
            settingData = this._settingsMap[settingName];
            rawValue = Preferences.get(NativeComponents.makeWidgetPrefPath(this.id, settingName), settingData.defaultValue);
        } else if (settingName in this._packageSettings) {
            settingData = this._packageSettings[settingName];
            rawValue = Preferences.get(NativeComponents.makePackagePrefPath(this.pkg.id, settingName), settingData.defaultValue);
        } else {
            throw new Error(strutils.formatString(this._consts.MSG_SETTING_NOT_REGISTERED, [settingName]));
        }
        return NativeComponents._interpretSettingValue(rawValue, settingData.type);
    },
    lookupGetSettingValue: function NativeWidgetPrototype_lookupGetSettingValue(settingName, WIID) {
        if (!WIID) {
            return this.getSettingValue(settingName);
        }
        let spawnRec = this._spawns[WIID];
        if (!spawnRec) {
            throw new Error("Invalid widget instance ID: " + WIID);
        }
        let projections = spawnRec.projections;
        let projection = projections && projections[0];
        if (!projection) {
            throw new Error("Could not find widget projections for instance: " + WIID);
        }
        return projection.getSettingValue(settingName);
    },
    lookupSetSettingValue: function NativeWidgetPrototype_lookupSetSettingValue(settingName, WIID, newValue) {
        if (WIID && settingName in this._instSettings) {
            Preferences.overwrite(NativeComponents.makeInstancePrefPath(this.id, WIID, settingName), newValue);
        } else {
            this.applySetting(settingName, newValue);
        }
    },
    applySetting: function NativeWidgetPrototype_applySetting(settingName, value) {
        if (settingName in this._settingsMap) {
            Preferences.overwrite(NativeComponents.makeWidgetPrefPath(this.id, settingName), value);
        } else if (settingName in this._packageSettings) {
            Preferences.overwrite(NativeComponents.makePackagePrefPath(this.pkg.id, settingName), value);
        } else {
            throw new Error(strutils.formatString(this._consts.MSG_SETTING_NOT_REGISTERED, [settingName]));
        }
    },
    get nativeModule() {
        if (!this._nativeModule) {
            this._nativeModule = {};
            Cu.import(this.unit.unitPackage.resolvePath(this._nativeModulePath), this._nativeModule);
        }
        if (!this._coreInitAttempted) {
            this._initCore();
        }
        if (!this._observing) {
            this._startObserving();
        }
        return this._nativeModule;
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    observe: function NativeWidgetPrototype_observe(subject, topic, data) {
        switch (topic) {
        case appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET: {
                let widgetCore = this._nativeModule && this._nativeModule.core;
                if (widgetCore && typeof widgetCore.onBeforeReset == "function") {
                    widgetCore.onBeforeReset();
                }
                break;
            }
        case appCore.eventTopics.EVT_AFTER_GLOBAL_RESET: {
                let widgetCore = this._nativeModule && this._nativeModule.core;
                if (widgetCore && typeof widgetCore.onAfterReset == "function") {
                    widgetCore.onAfterReset();
                }
                break;
            }
        default:
            break;
        }
    },
    _consts: {
        MSG_SETTING_NOT_REGISTERED: "Setting '%1' is not registered",
        ERR_FINALIZING_CORE: "Could not finalize native module core. ",
        ERR_FINALIZING_API: "Could not finalize native API object. ",
        ERR_NOTIFYING_CORE: "Could not notify native widget core. ",
        ERR_SUBSCRIBING: "Could not subscribe to event notifications. ",
        ERR_UNSUBSCRIBING: "Could not unsubscribe from event notifications. "
    },
    _nativeModulePath: undefined,
    _nativeAPIInst: null,
    _nativeModule: null,
    _instSettings: null,
    _coreInitAttempted: false,
    _coreInitialized: false,
    _observing: false,
    _initCore: function NativeWidgetPrototype__initCore() {
        this._coreInitAttempted = true;
        let widgetCore = this._nativeModule.core;
        if (widgetCore && typeof widgetCore.init == "function") {
            this._nativeAPIInst = new NativeBarAPI({
                type: "widget",
                id: this._id,
                package_: this.unit.unitPackage,
                component: this
            }, this._logger);
            widgetCore.init(this._nativeAPIInst);
            this._coreInitialized = true;
        }
    },
    _finalizeCore: function NativeWidgetPrototype__finalizeCore() {
        let widgetCore = this._nativeModule.core;
        if (widgetCore && typeof widgetCore.finalize == "function") {
            try {
                widgetCore.finalize();
            } catch (e) {
                this._logger.error(this._consts.ERR_FINALIZING_CORE + strutils.formatError(e));
                this._logger.debug(e.stack);
            } finally {
                this._coreInitialized = false;
            }
        }
        try {
            if (this._nativeAPIInst) {
                this._nativeAPIInst.finalize();
            }
        } catch (e) {
            this._logger.error(this._consts.ERR_FINALIZING_API + strutils.formatError(e));
        } finally {
            this._nativeAPIInst = null;
        }
    },
    _startObserving: function NativeWidgetPrototype__startObserving() {
        try {
            Services.obs.addObserver(this, appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET, false);
            Services.obs.addObserver(this, appCore.eventTopics.EVT_AFTER_GLOBAL_RESET, false);
        } catch (e) {
            this._logger.error(this._consts.ERR_SUBSCRIBING + strutils.formatError(e));
        }
        this._observing = true;
    },
    _stopObserving: function NativeWidgetPrototype__stopObserving() {
        try {
            Services.obs.removeObserver(this, appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET);
            Services.obs.removeObserver(this, appCore.eventTopics.EVT_AFTER_GLOBAL_RESET);
        } catch (e) {
            this._logger.error(this._consts.ERR_UNSUBSCRIBING + strutils.formatError(e));
        }
        this._observing = false;
    },
    _makeSpawnRecord: function NativeWidgetPrototype__makeSpawnRecord(instanceID) {
        let result = this.base();
        result.settings = sysutils.copyObj(this._instSettings);
        return result;
    },
    _noMoreInstProjections: function NativeWidgetPrototype__noMoreInstProjections(WIID, spawnRec) {
        try {
            let widgetCore = this._nativeModule && this._nativeModule.core;
            if (widgetCore && typeof widgetCore.onNoMoreInstProjections == "function") {
                widgetCore.onNoMoreInstProjections(WIID);
            }
        } catch (e) {
            this._logger.error(this._consts.ERR_NOTIFYING_CORE + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
    },
    _onAllInstancesFinalized: function NativeWidgetPrototype__onAllInstancesFinalized() {
        this._coreInitAttempted = false;
        if (this._coreInitialized) {
            this._finalizeCore();
        }
        this._stopObserving();
    }
});
var NativeWidgetInstance = Base.extend({
    constructor: function NativeWidgetInstance(IID, proto, widgetHost, settingsInfo) {
        if (!(proto instanceof NativeWidgetPrototype)) {
            throw new CustomErrors.EArgType("proto", "NativeWidgetPrototype", proto);
        }
        if (!IID) {
            throw new CustomErrors.EArgRange("IID", "/.+/", IID);
        }
        this._IID = IID;
        this._proto = proto;
        this._host = widgetHost;
        this._logger = NativeComponents._getLogger(BarPlatform.makeCompLoggerName(proto.unit) + "." + IID);
        this._settingsMap = settingsInfo;
    },
    get id() {
        return this._IID;
    },
    get prototype() {
        return this._proto;
    },
    get host() {
        return this._host;
    },
    get uiElement() {
        return this._toolbarElement;
    },
    buildUI: function NativeWidgetInstance_buildUI(toolbarElement) {
        this._toolbarElement = toolbarElement;
        this._applyResources();
        this._coreContext = this._proto.nativeModule.core.buildWidget(this._IID, toolbarElement);
    },
    get instanceSettings() {
        return sysutils.copyObj(this._settingsMap);
    },
    getSettingValue: function NativeWidgetInstance_getSettingValue(settingName) {
        if (!(settingName in this._settingsMap)) {
            return this._proto.getSettingValue(settingName);
        }
        let settingData = this._settingsMap[settingName];
        let rawValue = Preferences.get(NativeComponents.makeInstancePrefPath(this._proto.id, this.id, settingName), settingData.defaultValue);
        return NativeComponents._interpretSettingValue(rawValue, settingData.type);
    },
    applySetting: function NativeWidgetInstance_applySetting(settingName, value) {
        if (settingName in this._settingsMap) {
            Preferences.overwrite(NativeComponents.makeInstancePrefPath(this._proto.id, this.id, settingName), value);
        } else {
            this._proto.applySetting(settingName, value);
        }
    },
    applySettings: function NativeWidgetInstance_applySettings(settingsMap, noFail) {
        for (let name in settingsMap) {
            try {
                this.applySetting(name, settingsMap[name]);
            } catch (e) {
                this._logger.error("Couldn't apply widget instance setting. " + strutils.formatError(e));
                if (!noFail) {
                    throw e;
                }
            }
        }
    },
    eraseSettings: function NativeWidgetInstance_eraseSettings() {
        Preferences.resetBranch(NativeComponents.makeInstancePrefPath(this._proto.id, this.id));
    },
    finalize: function NativeWidgetInstance_finalize() {
        this._logger.config("Instance finalization");
        this._destroyUI();
        let proto = this._proto;
        this._proto = null;
        this._settingsMap = null;
        proto.instanceFinalized(this);
    },
    _IID: undefined,
    _proto: null,
    _host: null,
    _settingsMap: null,
    _coreContext: undefined,
    _toolbarElement: undefined,
    _destroyUI: function NativeWidgetInstance__destroyUI() {
        try {
            this._proto.nativeModule.core.destroyWidget(this._IID, this._toolbarElement, this._coreContext);
        } catch (e) {
            this._logger.error("Failed in widgetCore.destroyWidget. " + strutils.formatError(e));
            this._logger.debug(e.stack);
        } finally {
            this._coreContext = undefined;
            this._toolbarElement = undefined;
            this._revertResources();
        }
    },
    _applyResources: function NativeWidgetInstance__applyResources() {
        let resources = this._proto.nativeModule.resources;
        if (!resources) {
            return;
        }
        let browserResources = resources.browser;
        if (!browserResources) {
            return;
        }
        let package_ = this._proto.unit.unitPackage;
        let overlayController = this._host.overlayController;
        if (browserResources.styles) {
            browserResources.styles.forEach(function (stylesheetPath) {
                overlayController.requireStylesheet(package_.resolvePath(stylesheetPath));
            });
        }
    },
    _revertResources: function NativeWidgetInstance__revertResources() {
        let resources = this._proto.nativeModule.resources;
        if (!resources) {
            return;
        }
        let browserResources = resources.browser;
        if (!browserResources) {
            return;
        }
        let package_ = this._proto.unit.unitPackage;
        let overlayController = this._host.overlayController;
        if (browserResources.styles) {
            browserResources.styles.forEach(function (stylesheetPath) {
                overlayController.stylesheetNotNeeded(package_.resolvePath(stylesheetPath));
            });
        }
    }
});
