"use strict";
NativeComponents.NativePlugin = function NativePlugin(id, modulePath, unit) {
    if (!id) {
        throw new CustomErrors.EArgRange("id", "/.+/", id);
    }
    if (!modulePath) {
        throw new CustomErrors.EArgRange("modulePath", "/.+/", modulePath);
    }
    if (!(unit instanceof BarPlatform.Unit)) {
        throw new CustomErrors.EArgRange("unit", "Unit", unit);
    }
    this._id = id;
    this._modulePath = modulePath;
    this._unit = unit;
    this._package = unit.unitPackage;
    this._packageSettings = Object.create(null);
    this._settingsMap = Object.create(null);
    this._logger = NativeComponents._getLogger(BarPlatform.makeCompLoggerName(unit));
};
NativeComponents.NativePlugin.prototype = {
    constructor: NativeComponents.NativePlugin,
    get id() {
        return this._id;
    },
    get pkg() {
        return this._package;
    },
    get unit() {
        return this._unit;
    },
    get enabled() {
        return this._enabled;
    },
    set enabled(value) {
        if (Boolean(value)) {
            this.enable(false);
        } else {
            this.disable(false);
        }
    },
    set enabledManually(value) {
        if (Boolean(value)) {
            this.enable(true);
        } else {
            this.disable(true);
        }
    },
    enable: function NativePlugin_enable(manually) {
        if (this._enabled) {
            return;
        }
        this._tryNotify(appCore.eventTopics.EVT_PLUGIN_BEFORE_ENABLED, null);
        let pluginCore = this._module.core;
        if (pluginCore && typeof pluginCore.init === "function") {
            this._nativeAPIInst = new NativeBarAPI({
                type: "plugin",
                id: this._id,
                package_: this._package,
                component: this
            }, this._logger);
            pluginCore.init(this._nativeAPIInst, { stateSwitchedManually: manually });
        }
        Services.obs.addObserver(this, appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET, false);
        Services.obs.addObserver(this, appCore.eventTopics.EVT_AFTER_GLOBAL_RESET, false);
        this._enabled = true;
        this._logger.debug("Plugin enabled: " + this._id);
        this._tryNotify(appCore.eventTopics.EVT_PLUGIN_ENABLED, null);
    },
    disable: function NativePlugin_disable(manually) {
        if (!this._enabled) {
            return;
        }
        this._tryNotify(appCore.eventTopics.EVT_PLUGIN_BEFORE_DISABLED, null);
        let pluginCore = this._module.core;
        if (pluginCore && typeof pluginCore.finalize == "function") {
            try {
                pluginCore.finalize({ stateSwitchedManually: manually });
            } catch (e) {
                this._logger.error("Error finalizing plugin core. " + strutils.formatError(e));
                this._logger.debug(e.stack);
            } finally {
                if (this._nativeAPIInst) {
                    try {
                        this._nativeAPIInst.finalize();
                    } catch (e) {
                        this._logger.error("Error finalizing plugin native API. " + strutils.formatError(e));
                        this._logger.debug(e.stack);
                    }
                }
                this._nativeAPIInst = null;
            }
        }
        Services.obs.removeObserver(this, appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET);
        Services.obs.removeObserver(this, appCore.eventTopics.EVT_AFTER_GLOBAL_RESET);
        this._enabled = false;
        this._logger.debug("Plugin disabled: " + this._id);
        this._tryNotify(appCore.eventTopics.EVT_PLUGIN_DISABLED, null);
    },
    get browserStyles() {
        if (this._styleURLs) {
            return this._styleURLs;
        }
        this._styleURLs = [];
        let browserResources = this._browserResources;
        if (browserResources) {
            let declaredStyles = browserResources.styles;
            if (Array.isArray(declaredStyles)) {
                this._styleURLs = declaredStyles.map(function (stylePath) {
                    return this._package.resolvePath(stylePath);
                }, this);
            } else {
                this._logger.warn("Plugin resources.browser.styles is not an Array");
            }
        }
        return this._styleURLs;
    },
    get urlBarItems() {
        if (this._foundURLBarItems) {
            return this._foundURLBarItems;
        }
        this._foundURLBarItems = [];
        let browserResources = this._browserResources;
        if (browserResources) {
            let declaredItems = browserResources.urlBarItems;
            if (Array.isArray(declaredItems)) {
                declaredItems.forEach(function (itemName) {
                    let itemInfo = {
                        name: itemName,
                        priority: 0
                    };
                    this._foundURLBarItems.push(itemInfo);
                }, this);
            } else {
                for (let itemName in declaredItems) {
                    let priority = Math.max(0, parseInt(declaredItems[itemName], 10) || 0);
                    let itemInfo = {
                        name: itemName,
                        priority: priority
                    };
                    this._foundURLBarItems.push(itemInfo);
                }
            }
        }
        return sysutils.copyObj(this._foundURLBarItems);
    },
    initURLBarItem: function NativePlugin_initURLBarItem(xulElement, itemName) {
        return this._module.core.initURLBarItem(xulElement, itemName);
    },
    get pluginSettings() {
        return sysutils.copyObj(this._settingsMap);
    },
    get packageSettings() {
        return sysutils.copyObj(this._packageSettings);
    },
    getSettingValue: function NativePlugin_getSettingValue(settingName) {
        let rawValue;
        let settingData;
        if (settingName in this._settingsMap) {
            settingData = this._settingsMap[settingName];
            rawValue = Preferences.get(NativeComponents.makeWidgetPrefPath(this._id, settingName), settingData.defaultValue);
        } else if (settingName in this._packageSettings) {
            settingData = this._packageSettings[settingName];
            rawValue = Preferences.get(NativeComponents.makePackagePrefPath(this._package.id, settingName), settingData.defaultValue);
        } else {
            throw new Error(strutils.formatString(this._consts.MSG_SETTING_NOT_REGISTERED, [settingName]));
        }
        return NativeComponents._interpretSettingValue(rawValue, settingData.type);
    },
    applySetting: function NativePlugin_applySetting(settingName, value) {
        if (settingName in this._settingsMap) {
            let prefPath = NativeComponents.makeWidgetPrefPath(this._id, settingName);
            Preferences.overwrite(prefPath, value);
        } else if (settingName in this._packageSettings) {
            Preferences.overwrite(NativeComponents.makePackagePrefPath(this._package.id, settingName), value);
        } else {
            throw new Error(strutils.formatString(this._consts.MSG_SETTING_NOT_REGISTERED, [settingName]));
        }
    },
    applySettings: function NativePlugin_applySettings(settingsMap, noFail) {
        for (let name in settingsMap) {
            try {
                this.applySetting(name, settingsMap[name]);
            } catch (e) {
                this._logger.error("Couldn't apply plugin setting. " + strutils.formatError(e));
                if (!noFail) {
                    throw e;
                }
            }
        }
    },
    registerSetting: function NativePlugin_registerSetting(settingName, settingScope, defaultValue, valueType, controlElement) {
        switch (settingScope) {
        case BarPlatform.Unit.scopes.ENUM_SCOPE_PACKAGE: {
                this._packageSettings[settingName] = {
                    defaultValue: defaultValue,
                    type: valueType,
                    controlElement: controlElement
                };
                this._package.addSettingUser(settingName, this._id);
                break;
            }
        case BarPlatform.Unit.scopes.ENUM_SCOPE_PLUGIN:
            this._settingsMap[settingName] = {
                defaultValue: defaultValue,
                type: valueType,
                controlElement: controlElement
            };
            break;
        default:
            throw new CustomErrors.EArgType("settingScope", "ENUM_SCOPE_PLUGIN | ENUM_SCOPE_PACKAGE", String(settingScope));
        }
    },
    finalize: function NativePlugin_finalize() {
        this.disable();
        for (let settingName in this._packageSettings) {
            this._package.removeSettingUser(settingName, this.id);
        }
        this._module = this._unit = this._package = null;
        this._packageSettings = null;
        this._settingsMap = null;
        this._foundURLBarItems = null;
        this._logger = null;
    },
    get nativeModule() this._module,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    get wrappedJSObject() {
        return this;
    },
    observe: function NativePlugin_observe(subject, topic, data) {
        try {
            switch (topic) {
            case appCore.eventTopics.EVT_BEFORE_GLOBAL_RESET: {
                    let pluginCore = this._module.core;
                    if (pluginCore && typeof pluginCore.onBeforeReset == "function") {
                        pluginCore.onBeforeReset();
                    }
                    break;
                }
            case appCore.eventTopics.EVT_AFTER_GLOBAL_RESET: {
                    let pluginCore = this._module.core;
                    if (pluginCore && typeof pluginCore.onAfterReset == "function") {
                        pluginCore.onAfterReset();
                    }
                    break;
                }
            default:
                break;
            }
        } catch (e) {
            this._logger.error("nsIObserver.observe failed. " + strutils.formatError(e));
        }
    },
    _consts: { MSG_SETTING_NOT_REGISTERED: "Setting \"%1\" is not registered" },
    _logger: null,
    _shortName: undefined,
    _id: undefined,
    _modulePath: undefined,
    _unit: null,
    _package: null,
    _moduleObj: null,
    _enabled: false,
    _packageSettings: null,
    _settingsMap: null,
    _nativeAPIInst: null,
    _foundURLBarItems: null,
    get _module() {
        return this._moduleObj || (this._moduleObj = this._loadModule());
    },
    set _module(newValue) {
        this._moduleObj = newValue;
    },
    _loadModule: function NativePlugin__loadModule() {
        let module = {};
        Cu.import(this._package.resolvePath(this._modulePath), module);
        return module;
    },
    get _browserResources() {
        let resources = this._module.resources;
        if (resources) {
            return resources.browser;
        }
    },
    _tryNotify: function NativePlugin__tryNotify(topic, data) {
        try {
            Services.obs.notifyObservers(this, topic, data);
        } catch (e) {
            this._logger.error(strutils.formatString("Could not notify observers (%1). %2", [
                [
                    topic,
                    data
                ],
                strutils.formatError(e)
            ]));
        }
    }
};
