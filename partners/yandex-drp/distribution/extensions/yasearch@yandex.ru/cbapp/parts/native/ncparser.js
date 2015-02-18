"use strict";
const nativeComponentsParser = {
    parseFromDoc: function NCParser_parseFromDoc(unitDoc, unit) {
        if (!(unitDoc instanceof Ci.nsIDOMDocument)) {
            throw new CustomErrors.EArgType("unitDoc", "nsIDOMDocument", unitDoc);
        }
        if (!(unit instanceof BarPlatform.Unit)) {
            throw new CustomErrors.EArgType("unit", "Unit", unit);
        }
        this._logger.debug("Parsing component from Unit " + unit.name);
        let componentElement = unitDoc.documentElement;
        let componentType = componentElement.localName;
        let componentName = componentElement.getAttribute("name");
        if (!componentName) {
            throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, "No component name");
        }
        let thisPackage = unit.unitPackage;
        let compID = thisPackage.id + "#" + unit.name;
        let iconPath = componentElement.getAttribute("icon-vector") || componentElement.getAttribute("icon") || undefined;
        let nativeModulePath = this._chooseNativeModule(componentElement);
        if (!thisPackage.findFile(nativeModulePath)) {
            throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, strutils.formatString("Native module file not found ('%1')", [nativeModulePath]));
        }
        let component = null;
        if (componentType == this._consts.STR_WIDGET_ELEMENT_NAME) {
            let unique = componentElement.getAttribute("unique") != "false";
            component = new NativeWidgetPrototype(compID, componentName, unique, iconPath, nativeModulePath, unit);
        } else if (componentType == this._consts.STR_PLUGIN_ELEMENT_NAME) {
            component = new NativeComponents.NativePlugin(compID, nativeModulePath, unit);
        } else {
            throw new BarPlatform.Unit.EUnitSyntax(componentType, "Unsupported native component type");
        }
        this._parseTopChildren(component, componentElement);
        return component;
    },
    _logger: NativeComponents._getLogger("NParser"),
    _consts: {
        STR_WIDGET_ELEMENT_NAME: "widget",
        STR_PLUGIN_ELEMENT_NAME: "plugin"
    },
    _chooseNativeModule: function NCParser__chooseNativeModule(componentElement) {
        let modulesElements = xmlutils.queryXMLDoc("./*[local-name() = 'modules']/*[local-name() = 'module']", componentElement);
        if (modulesElements.length < 1) {
            throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, "No module declaration");
        }
        let moduleItems = modulesElements.map(function (moduleElement) {
            let moduleItem = {};
            moduleItem.filePath = moduleElement.getAttribute("file");
            [
                "os",
                "browser",
                "architecture"
            ].forEach(function __readModuleAttr(attrName) {
                if (moduleElement.hasAttribute(attrName)) {
                    moduleItem[attrName] = moduleElement.getAttribute(attrName);
                }
            });
            return moduleItem;
        });
        let moduleInfo = BarPlatform.findPlatformMatch(moduleItems);
        if (!moduleInfo) {
            throw new Error("No native module for this platform");
        }
        return moduleInfo.filePath;
    },
    _parseTopChildren: function NCparser__parseTopChildren(component, compElement) {
        let children = compElement.childNodes;
        for (let i = 0, len = children.length; i < len; i++) {
            let child = children[i];
            if (child.nodeType != child.ELEMENT_NODE) {
                continue;
            }
            switch (child.localName) {
            case "setting":
                let defaultScope = component instanceof NativeWidgetPrototype ? BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET : BarPlatform.Unit.scopes.ENUM_SCOPE_PLUGIN;
                let settingData = BarPlatform.Unit.parseSetting(child, defaultScope);
                component.registerSetting(settingData.name, settingData.scope, settingData.defaultValue, settingData.type, settingData.controlElement);
                break;
            case "modules":
                break;
            default:
                this._logger.warn(strutils.formatString("Unknown element '%1' was ignored.", [child.nodeName]));
            }
        }
    }
};
