"use strict";
BarPlatform.Preset = Base.extend({
    constructor: function Preset_constructor(content, address) {
        this._packageIDs = Object.create(null);
        this._compEntries = [];
        if (address !== undefined) {
            this._baseURI = netutils.ioService.newURI(address, null, null);
            this._address = address;
        }
        let loggerName = this._baseURI ? this._baseURI.QueryInterface(Ci.nsIURL).fileBaseName : "?";
        this._logger = BarPlatform._getLogger("Preset." + loggerName);
        try {
            if (content instanceof Ci.nsIFile) {
                this._loadFromFile(content);
            } else if (content instanceof Ci.nsIDOMDocument) {
                this._loadFromDocument(content);
            } else {
                throw new CustomErrors.EArgType("content", "nsIFile|nsIDOMDocument", typeof content);
            }
        } catch (e) {
            throw new Error("Can not parse preset document from [" + address + "] \n" + strutils.formatError(e));
        }
    },
    get address() {
        return this._address;
    },
    get name() {
        return this._name;
    },
    get version() {
        return this._version;
    },
    get formatVersion() {
        return this._formatVersion;
    },
    set formatVersion(verStr) {
        this._originalDocument.documentElement.setAttribute("format-version", String(verStr));
    },
    get author() {
        return this._author;
    },
    get icon() {
        return this._icon;
    },
    get url() {
        return this._url;
    },
    get updateMode() {
        return this._updateMode;
    },
    get packageIDs() {
        return sysutils.copyObj(this._packageIDs);
    },
    get widgetIDs() {
        return sysutils.copyObj(this._widgetIDs);
    },
    get pluginIDs() {
        return sysutils.copyObj(this._pluginIDs);
    },
    get componentIDs() {
        return sysutils.mergeObj(this._widgetIDs, this._pluginIDs);
    },
    get importantComponentIDs() {
        function isImportantEntryF(compID, compEntry) {
            return compEntry.isImportant;
        }
        let result = Object.create(null);
        sysutils.copyProperties(this._widgetIDs, result, isImportantEntryF);
        sysutils.copyProperties(this._pluginIDs, result, isImportantEntryF);
        return result;
    },
    refsPackage: function Preset_refsPackage(packageID) {
        return packageID in this._packageIDs;
    },
    refsWidget: function Preset_refsWidget(widgetID) {
        return widgetID in this._widgetIDs;
    },
    refsPlugin: function Preset_refsPlugin(pluginID) {
        return pluginID in this._pluginIDs;
    },
    get widgetEntries() {
        return sysutils.copyObj(this._widgetEntries, false);
    },
    get visibleWidgetEntries() {
        return this.widgetEntries.filter(function passVisible(widgetEntry) {
            return widgetEntry.enabled == widgetEntry.ENABLED_YES;
        });
    },
    get pluginEntries() {
        return sysutils.copyObj(this._pluginEntries, false);
    },
    get allEntries() {
        return sysutils.copyObj(this._compEntries, false);
    },
    appendEntry: function Preset_appendEntry(entryDescr) {
        let componentEntry = new BarPlatform.Preset.ComponentEntry(entryDescr);
        this._compEntries.push(componentEntry);
        this._packageIDs[componentEntry.packageID] = undefined;
        if (componentEntry.componentType == componentEntry.TYPE_WIDGET) {
            delete this._widgetEntries;
            this._widgetIDs[componentEntry.componentID] = componentEntry;
        } else {
            delete this._pluginEntries;
            this._pluginIDs[componentEntry.componentID] = componentEntry;
        }
        this._originalDocument.documentElement.appendChild(this._createEntryElement(componentEntry));
    },
    saveToFile: function Preset_saveToFile(destFile) {
        fileutils.xmlDocToFile(this._originalDocument, destFile);
    },
    _consts: {
        UPDMODE_ATTR_NAME: "update-mode",
        DEF_UPDMODE: "default",
        STR_PRESET_ELEMENT_NAME: "preset",
        ERR_NO_COMP_ID: "No component ID"
    },
    _updateModes: {
        default: 0,
        silent: 2,
        reset: 3,
        "soft-reset": 4,
        reorder: 5
    },
    _address: undefined,
    _baseURI: null,
    _author: undefined,
    _name: undefined,
    _version: "1.0",
    _formatVersion: "1.0",
    _icon: undefined,
    _updateMode: undefined,
    _packageIDs: null,
    _compEntries: undefined,
    get _widgetEntries() {
        let widgetEntries = this._compEntries.filter(function passWidgets(compEntry) {
            return compEntry.componentType == compEntry.TYPE_WIDGET;
        });
        this.__defineGetter__("_widgetEntries", function () {
            return widgetEntries;
        });
        return this._widgetEntries;
    },
    get _pluginEntries() {
        let pluginEntries = this._compEntries.filter(function passPlugins(compEntry) {
            return compEntry.componentType == compEntry.TYPE_PLUGIN;
        });
        this.__defineGetter__("_pluginEntries", function () {
            return pluginEntries;
        });
        return this._pluginEntries;
    },
    get _widgetIDs() {
        let widgetIDs = Object.create(null);
        this._widgetEntries.forEach(entry => widgetIDs[entry.componentID] = entry);
        this.__defineGetter__("_widgetIDs", function () {
            return widgetIDs;
        });
        return this._widgetIDs;
    },
    get _pluginIDs() {
        let pluginIDs = Object.create(null);
        this._pluginEntries.forEach(entry => pluginIDs[entry.componentID] = entry);
        this.__defineGetter__("_pluginIDs", function () {
            return pluginIDs;
        });
        return this._pluginIDs;
    },
    _loadFromFile: function Preset__loadFromFile(presetFile) {
        this._loadFromDocument(fileutils.xmlDocFromFile(presetFile));
    },
    _loadFromDocument: function Preset__loadFromDocument(XMLDocument) {
        let rootName = XMLDocument.documentElement.localName;
        if (rootName != this._consts.STR_PRESET_ELEMENT_NAME) {
            throw new BarPlatform.Preset.EPresetSyntax(rootName, "Wrong root element name");
        }
        this._parsePreset(XMLDocument.documentElement);
        this._originalDocument = XMLDocument;
    },
    _parsePreset: function Preset__parsePreset(presetElement) {
        this._version = presetElement.getAttribute("version") || "1.0";
        this._formatVersion = presetElement.getAttribute("format-version") || "1.0";
        let updateMode = presetElement.hasAttribute(this._consts.UPDMODE_ATTR_NAME) ? presetElement.getAttribute(this._consts.UPDMODE_ATTR_NAME) : this._consts.DEF_UPDMODE;
        if (!(updateMode in this._updateModes)) {
            this._logger.warn("Invalid update mode: '" + updateMode + "'. Will use 'default'.");
            updateMode = this._consts.DEF_UPDMODE;
        }
        this._updateMode = updateMode;
        let appLang = misc.parseLocale(barApp.localeString).language;
        let urlNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./url", presetElement));
        this._url = urlNode ? urlNode.textContent : undefined;
        if (!this._baseURI) {
            try {
                this._baseURI = netutils.ioService.newURI(this._url, null, null);
            } catch (e) {
                this._logger.warn("Preset URL in the <url> node is malformed.");
            }
        }
        let authorNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./author", presetElement));
        if (!authorNode) {
            throw new BarPlatform.Preset.EPresetSyntax("preset", "Missing 'author' element");
        }
        this._author = authorNode.textContent;
        let nameNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./name", presetElement));
        if (!nameNode) {
            throw new BarPlatform.Preset.EPresetSyntax("preset", "Missing 'name' element");
        }
        this._name = nameNode.textContent;
        let iconNode = BarPlatform.findBestLocalizedElement(xmlutils.queryXMLDoc("./icon", presetElement));
        let iconRelPath = strutils.trimSpaces(iconNode && iconNode.textContent);
        this._icon = iconRelPath && this._baseURI ? netutils.resolveRelativeURL(iconRelPath, this._baseURI) : iconRelPath;
        let compElements = xmlutils.queryXMLDoc("(.|./firefox)/widget|(.|./firefox)/plugin", presetElement);
        if (compElements) {
            compElements.forEach(function (compElement) {
                let compEntry = new BarPlatform.Preset.ComponentEntry(compElement, this._baseURI);
                this._packageIDs[compEntry.packageID] = undefined;
                this._compEntries.push(compEntry);
            }, this);
        }
    },
    _createEntryElement: function Preset__createEntryElement(componentEntry) {
        let isWidget = componentEntry.componentType == componentEntry.TYPE_WIDGET;
        let compElemName = isWidget ? "widget" : "plugin";
        let entryElement = this._originalDocument.createElement(compElemName);
        entryElement.setAttribute("id", componentEntry.componentID);
        if (componentEntry.enabled != componentEntry.ENABLED_YES) {
            entryElement.setAttribute(isWidget ? "visible" : "enabled", componentEntry.enabled);
        }
        if (componentEntry.isImportant) {
            entryElement.setAttribute("important", "true");
        }
        if (componentEntry.settingsMap) {
            for (let [
                        settingName,
                        settingValue
                    ] in Iterator(componentEntry.settingsMap)) {
                let settingElement = this._originalDocument.createElement("setting");
                settingElement.setAttribute("name", settingName);
                settingElement.appendChild(this._originalDocument.createTextNode(settingValue));
                entryElement.appendChild(settingElement);
            }
        }
        return entryElement;
    }
});
BarPlatform.Preset.ComponentEntry = function PresetComponentEntry(entrySource, presetURI) {
    if (presetURI && !(presetURI instanceof Ci.nsIURI)) {
        throw new CustomErrors.EArgType("presetURI", "nsIURI", presetURI);
    }
    this._presetURI = presetURI;
    let loggerName = this._presetURI ? this._presetURI.QueryInterface(Ci.nsIURL).fileBaseName : "?";
    this._logger = BarPlatform._getLogger("Preset." + loggerName);
    if (entrySource instanceof Ci.nsIDOMElement) {
        this._createFromDOMElement(entrySource);
    } else if (sysutils.isObject(entrySource)) {
        this._createFromObject(entrySource);
    } else {
        throw new CustomErrors.EArgType("entrySource", "nsIDOMElement or Object", entrySource);
    }
};
BarPlatform.Preset.ComponentEntry.prototype = {
    constructor: BarPlatform.Preset.ComponentEntry,
    get componentType() {
        return this._type;
    },
    get TYPE_WIDGET() {
        return "widget";
    },
    get TYPE_PLUGIN() {
        return "plugin";
    },
    get componentID() {
        return this._componentID;
    },
    get packageID() {
        return this._packageID;
    },
    get name() {
        return this._name;
    },
    get enabled() {
        return this._enabled;
    },
    get ENABLED_NO() {
        return "false";
    },
    get ENABLED_YES() {
        return "true";
    },
    get ENABLED_AUTO() {
        return "auto";
    },
    set enabled(newVal) {
        if (this._enabled == newVal) {
            return;
        }
        if (newVal != this.ENABLED_AUTO && newVal != this.ENABLED_YES && newVal != this.ENABLED_NO) {
            throw new CustomErrors.EArgRange("enabled", "ENABLED_NO or ENABLED_YES or ENABLED_AUTO", newVal);
        }
        if (this._srcElement) {
            this._srcElement.setAttribute(this._type == this.TYPE_WIDGET ? "visible" : "enabled", newVal);
        }
        this._enabled = newVal;
    },
    get isImportant() {
        return this._isImportant;
    },
    get settings() {
        return sysutils.copyObj(this._settings);
    },
    get forcedSettings() {
        return sysutils.copyObj(this._forcedSettings);
    },
    toSimpleObject: function ComponentEntry_toSimpleObject() {
        return {
            componentType: this.componentType,
            componentID: this.componentID,
            enabled: this.enabled,
            isImportant: this.isImportant,
            settings: sysutils.copyObj(this.settings),
            forcedSettings: sysutils.copyObj(this.forcedSettings)
        };
    },
    _isImportant: false,
    _createFromDOMElement: function ComponentEntry__createFromDOMElement(srcElement) {
        let compElemName = srcElement.localName;
        if (compElemName == "widget") {
            this._type = this.TYPE_WIDGET;
        } else if (compElemName == "plugin") {
            this._type = this.TYPE_PLUGIN;
        } else {
            throw new BarPlatform.Preset.EPresetSyntax(compElemName, "Unknown component type");
        }
        let compID = srcElement.getAttribute("id");
        if (!compID) {
            throw new BarPlatform.Preset.EPresetSyntax(srcElement.localName, "Missing 'id' attribute");
        }
        if (this._presetURI) {
            compID = netutils.resolveRelativeURL(compID, this._presetURI);
        }
        this._componentID = compID;
        [
            this._packageID,
            this._name
        ] = BarPlatform.parseComponentID(this._componentID);
        let enabledAttrVal = srcElement.getAttribute(this._type == this.TYPE_WIDGET ? "visible" : "enabled");
        if (enabledAttrVal === null || enabledAttrVal == "true") {
            this._enabled = this.ENABLED_YES;
        } else if (enabledAttrVal == "auto") {
            this._enabled = this.ENABLED_AUTO;
        } else {
            this._enabled = this.ENABLED_NO;
        }
        this._isImportant = srcElement.getAttribute("important") === "true";
        [
            this._settings,
            this._forcedSettings
        ] = this._parseSettings(srcElement);
        this._srcElement = srcElement;
    },
    _createFromObject: function ComponentEntry__createFromObject({componentType, componentID, enabled, isImportant, settings, forcedSettings}) {
        if (componentType != this.TYPE_WIDGET && componentType != this.TYPE_PLUGIN) {
            throw new CustomErrors.EArgRange("componentType", "TYPE_WIDGET or TYPE_PLUGIN", componentType);
        }
        this._type = componentType;
        let [
            packageID,
            compName
        ] = BarPlatform.parseComponentID(componentID);
        this._componentID = componentID;
        this._packageID = packageID;
        this._name = compName;
        if (enabled != this.ENABLED_NO && enabled != this.ENABLED_YES && enabled != this.ENABLED_AUTO) {
            throw new CustomErrors.EArgRange("enabled", "ENABLED_NO or ENABLED_YES or ENABLED_AUTO", enabled);
        }
        this._enabled = enabled;
        this._isImportant = Boolean(isImportant);
        if (settings !== undefined && typeof settings != "object") {
            throw new CustomErrors.EArgType("settings", "object", settings);
        }
        this._settings = sysutils.copyObj(settings) || Object.create(null);
        if (forcedSettings !== undefined && typeof forcedSettings != "object") {
            throw new CustomErrors.EArgType("forcedSettings", "object", forcedSettings);
        }
        this._forcedSettings = sysutils.copyObj(forcedSettings);
    },
    _parseSettings: function ComponentEntry__parseSettings(srcElement) {
        let settingElements = Object.create(null);
        for (let settingIndex = srcElement.childNodes.length; settingIndex--;) {
            let settingElement = srcElement.childNodes[settingIndex];
            if (settingElement.nodeType != settingElement.ELEMENT_NODE || settingElement.localName != "setting") {
                continue;
            }
            let settingName = settingElement.getAttribute("name");
            if (!settingName) {
                this._logger.warn("Widget setting was ignored because of syntax errors");
                continue;
            }
            if (!(settingName in settingElements)) {
                settingElements[settingName] = [];
            }
            settingElements[settingName].push(settingElement);
        }
        let settings = Object.create(null);
        let forcedSettings = Object.create(null);
        for (let name in settingElements) {
            let settingElement = BarPlatform.findBestLocalizedElement(settingElements[name]);
            let settingValue = settingElement.textContent;
            settings[name] = settingValue;
            let forceVal = settingElement.getAttribute("force");
            if (strutils.xmlAttrToBool(forceVal)) {
                forcedSettings[name] = settingValue;
            }
        }
        return [
            settings,
            forcedSettings
        ];
    }
};
BarPlatform.Preset.EPresetSyntax = function EPresetSyntax(elementName, explanation) {
    CustomErrors.ECustom.apply(this, null);
    this._elementName = elementName.toString();
    this._explanation = explanation.toString();
};
BarPlatform.Preset.EPresetSyntax.prototype = {
    __proto__: CustomErrors.ECustom.prototype,
    constructor: BarPlatform.Preset.EPresetSyntax,
    _message: "Preset parse error",
    get _details() {
        return [
            this._elementName,
            this._explanation
        ];
    },
    _elementName: undefined,
    _explanation: undefined
};
