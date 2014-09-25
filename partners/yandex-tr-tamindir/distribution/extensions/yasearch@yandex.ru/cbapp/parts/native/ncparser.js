"use strict";
const nativeComponentsParser = {
        parseFromDoc: function NCParser_parseFromDoc(unitDoc, unit) {
            if (!(unitDoc instanceof Ci.nsIDOMDocument))
                throw new CustomErrors.EArgType("unitDoc", "nsIDOMDocument", unitDoc);
            if (!(unit instanceof BarPlatform.Unit))
                throw new CustomErrors.EArgType("unit", "Unit", unit);
            this._logger.debug("Parsing component from Unit " + unit.name);
            var componentElement = unitDoc.documentElement;
            var componentType = componentElement.localName;
            var componentName = componentElement.getAttribute("name");
            if (!componentName)
                throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, "No component name");
            var thisPackage = unit.unitPackage;
            var compID = thisPackage.id + "#" + unit.name;
            var iconPath = componentElement.getAttribute("icon-vector") || componentElement.getAttribute("icon") || undefined;
            var nativeModulePath = this._chooseNativeModule(componentElement);
            if (!thisPackage.findFile(nativeModulePath)) {
                throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, strutils.formatString("Native module file not found ('%1')", [nativeModulePath]));
            }
            var component = null;
            if (componentType == this._consts.STR_WIDGET_ELEMENT_NAME) {
                let unique = componentElement.getAttribute("unique") != "false";
                component = new NativeWidgetPrototype(compID, componentName, unique, iconPath, nativeModulePath, unit);
            } else if (componentType == this._consts.STR_PLUGIN_ELEMENT_NAME) {
                component = new NativeComponents.NativePlugin(compID, nativeModulePath, unit);
            } else
                throw new BarPlatform.Unit.EUnitSyntax(componentType, "Unsupported native component type");
            this._parseTopChildren(component, componentElement);
            return component;
        },
        _logger: NativeComponents._getLogger("NParser"),
        _consts: {
            STR_WIDGET_ELEMENT_NAME: "widget",
            STR_PLUGIN_ELEMENT_NAME: "plugin"
        },
        _chooseNativeModule: function NCParser__chooseNativeModule(componentElement) {
            var modulesElements = xmlutils.queryXMLDoc("./*[local-name() = 'modules']/*[local-name() = 'module']", componentElement);
            var numModules = modulesElements.length;
            if (numModules < 1)
                throw new BarPlatform.Unit.EUnitSyntax(componentElement.nodeName, "No module declaration");
            var platformInfo = sysutils.platformInfo;
            var moduleItems = [];
            let (i = 0) {
                for (; i < numModules; i++) {
                    let moduleElement = modulesElements[i];
                    let moduleItem = {};
                    moduleItem.filePath = moduleElement.getAttribute("file");
                    [
                        "os",
                        "browser",
                        "architecture"
                    ].forEach(function __readModuleAttr(attrName) {
                        if (moduleElement.hasAttribute(attrName))
                            moduleItem[attrName] = moduleElement.getAttribute(attrName);
                    });
                    moduleItems.push(moduleItem);
                }
            }
            var moduleInfo = BarPlatform.findPlatformMatch(moduleItems);
            if (!moduleInfo)
                throw new Error("No native module for this platform");
            return moduleInfo.filePath;
        },
        _parseTopChildren: function NCparser__parseTopChildren(component, compElement) {
            var children = compElement.childNodes;
            let (i = 0, len = children.length) {
                for (; i < len; i++) {
                    let child = children[i];
                    if (child.nodeType != child.ELEMENT_NODE)
                        continue;
                    switch (child.localName) {
                    case "setting":
                        let defaultScope = component instanceof NativeWidgetPrototype ? BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET : BarPlatform.Unit.scopes.ENUM_SCOPE_PLUGIN;
                        let settingData = BarPlatform.Unit.parseSetting(child, defaultScope);
                        component.registerSetting(settingData.name, settingData.scope, settingData.defaultValue, settingData.type, settingData.controlElement);
                        break;
                    case "modules":
                        break;
                    default:
                        this._logger.warn(strutils.formatString("Unknown element \"%1\" was ignored.", [child.nodeName]));
                    }
                }
            }
        }
    };
