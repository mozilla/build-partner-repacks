'use strict';
XB.WidgetPrototype = BarPlatform.WidgetPrototypeBase.extend({
    constructor: function XBWidgetPrototype(protoID, name, unique, iconPath, unit, bufferDoc) {
        this.base(protoID, name, unique, iconPath, unit);
        if (!(bufferDoc instanceof Ci.nsIDOMDocument))
            throw new CustomErrors.EArgType('bufferDoc', 'nsIDOMDocument', bufferDoc);
        let (xbWidgetsPrefsPath = XB._base.application.core.xbWidgetsPrefsPath) {
            this._persistPath = xbWidgetsPrefsPath + this.id + '.all';
            this._pkgsPersistPath = xbWidgetsPrefsPath + this.pkg.id;
        }
        this._logger = XB._base.getLogger(BarPlatform.makeCompLoggerName(unit));
        this._runtimeXMLDoc = bufferDoc;
        this._varsMap = {};
        this._dataMap = {};
        this._settingsMap = {};
        this._refsMap = {};
        this._contentNodes = [];
        this._packageSettings = {};
        this._instSettings = {};
        this._instVars = [];
    },
    createInstance: function XBWidgetPrototype_createInstance(instanceID, widgetHost, instanceSettings) {
        var spawnRec = instanceID in this._spawns ? this._spawns[instanceID] : this._makeSpawnRecord(instanceID);
        var instance = new XB.WidgetInstance(instanceID, this, widgetHost, this._refsMap, this._dataMap, spawnRec.settings, spawnRec.vars);
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
    finalize: function XBWidgetPrototype_finalize() {
        this._finalizeSettingsMap(this._settingsMap);
        XB._calcNodes.finalizeNodesInMap(this._varsMap);
        for (let settingName in this._packageSettings) {
            try {
                this.pkg.removeSettingUser(settingName, this.id);
                this._packageSettings[settingName].node.finalize();
            } catch (e) {
                this._logger.error(strutils.formatString('Could not finalize setting "%1". %2', [
                    settingName,
                    strutils.formatError(e)
                ]));
            }
        }
        this._packageSettings = null;
        this._settingsMap = null;
        this._varsMap = null;
        this._refsMap = null;
        this._instSettings = null;
        this._instVars = null;
        this._contentNodes = null;
        this.base();
    },
    get effectiveID() {
        return this.id;
    },
    get contentNodes() {
        return this._contentNodes.slice();
    },
    get runtimeXMLDoc() {
        return this._runtimeXMLDoc;
    },
    registerReference: function XBWIdgetPrototype_registerReference(refID, calcNode) {
        this._refsMap[refID] = calcNode;
    },
    addContentNode: function XBWidgetPrototype_addContentNode(DOMNode) {
        if (!(DOMNode instanceof Ci.nsIDOMNode))
            throw new CustomErrors.EArgType('DOMNode', 'nsIDOMNode', DOMNode);
        this._contentNodes.push(DOMNode);
    },
    registerVariable: function XBWidgetPrototype_registerVariable(varName, varScope, persistent, initialValue) {
        this._logger.trace('Registering var ' + varName + ', scope ' + varScope);
        if (this._varsMap[varName])
            this._logger.warn(this._consts.WARN_VAR_REDEFINED + ' ' + varName);
        switch (varScope) {
        case BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET:
            let nodeID = this.id + '_var_' + varName;
            this._varsMap[varName] = new XB._calcNodes.VarNode(nodeID, this, initialValue, persistent ? {
                path: this._persistPath,
                key: varName
            } : null);
            break;
        case BarPlatform.Unit.scopes.ENUM_SCOPE_INSTANCE:
            this._instVars.push({
                name: varName,
                persistent: persistent,
                initialValue: initialValue
            });
            break;
        default:
            throw new CustomErrors.EArgType('varScope', 'ENUM_SCOPE_WIDGET | ENUM_SCOPE_INSTANCE', '' + varScope);
        }
    },
    findVariable: function XBWidgetPrototype_findVariable(varName) {
        return this._varsMap[varName] || null;
    },
    registerData: function XBWidgetPrototype_registerData(dataName, dataNode) {
        if (this._dataMap[dataName])
            this._logger.warn(this._consts.WARN_DATA_REDEFINED + ' ' + dataName);
        this._dataMap[dataName] = dataNode;
    },
    registerSetting: function XBWidgetPrototype_registerSetting(settingName, settingScope, defaultValue, valueType, controlElement) {
        this._logger.trace('Registering setting ' + settingName + ', scope ' + settingScope);
        switch (settingScope) {
        case BarPlatform.Unit.scopes.ENUM_SCOPE_PACKAGE: {
                let nodeID = this.pkg.id + '_setting_' + settingName;
                let settingNode = new XB._calcNodes.SettingNode(nodeID, this, this._pkgsPersistPath, settingName, defaultValue);
                this._packageSettings[settingName] = {
                    node: settingNode,
                    controlElement: controlElement,
                    type: valueType
                };
                this.pkg.addSettingUser(settingName, this.id);
                break;
            }
        case BarPlatform.Unit.scopes.ENUM_SCOPE_WIDGET: {
                let nodeID = this.id + '_setting_' + settingName;
                let settingNode = new XB._calcNodes.SettingNode(nodeID, this, this._persistPath, settingName, defaultValue);
                this._settingsMap[settingName] = {
                    node: settingNode,
                    controlElement: controlElement,
                    type: valueType
                };
                break;
            }
        case BarPlatform.Unit.scopes.ENUM_SCOPE_INSTANCE:
            this._instSettings[settingName] = {
                defaultValue: defaultValue,
                controlElement: controlElement,
                type: valueType
            };
            break;
        default:
            throw new CustomErrors.EArgType('settingScope', 'ENUM_SCOPE_PACKAGE | ENUM_SCOPE_WIDGET | ENUM_SCOPE_INSTANCE', '' + settingScope);
        }
    },
    findSetting: function XBWidgetPrototype_findSetting(settingName) {
        var setting = this._settingsMap[settingName] || this._packageSettings[settingName];
        return setting ? setting.node : null;
    },
    get logger() {
        return this._logger;
    },
    _consts: {
        WARN_VAR_REDEFINED: 'Redefined variable',
        WARN_DATA_REDEFINED: 'Redefined data'
    },
    _logger: null,
    _persistPath: undefined,
    _runtimeXMLDoc: null,
    _dataMap: null,
    _refsMap: null,
    _varsMap: null,
    _settingsMap: null,
    _contentNodes: null,
    _packageSettings: null,
    _instSettings: null,
    _instVars: null,
    _finalizeSettingsMap: function XBWidgetPrototype__finalizeSettingsMap(settingsMap) {
        for (let [
                    ,
                    setting
                ] in Iterator(settingsMap)) {
            try {
                setting.node.finalize();
            } catch (e) {
                this._logger.error('Error while finalizing setting node. ' + strutils.formatError(e));
            }
        }
    },
    _makeSpawnRecord: function XBWidgetPrototype__makeSpawnRecord(instanceID) {
        var spawnRec = this.base();
        spawnRec.settings = {};
        spawnRec.vars = {};
        var instPersistPath = XB._base.application.core.xbWidgetsPrefsPath + [
                this.id,
                instanceID
            ].join('.');
        for (let settingName in this._instSettings) {
            let settingInfo = this._instSettings[settingName];
            let nodeID = instanceID + '_setting_' + settingName;
            let settingNode = new XB._calcNodes.SettingNode(nodeID, this, instPersistPath, settingName, settingInfo.defaultValue);
            spawnRec.settings[settingName] = {
                controlElement: settingInfo.controlElement,
                type: settingInfo.type,
                defaultValue: settingInfo.defaultValue,
                node: settingNode
            };
        }
        for (let [
                    ,
                    varInfo
                ] in Iterator(this._instVars)) {
            let varName = varInfo.name;
            let nodeID = instanceID + '_var_' + varName;
            spawnRec.vars[varName] = new XB._calcNodes.VarNode(nodeID, this, varInfo.initialValue, varInfo.persistent ? {
                path: instPersistPath,
                key: varName
            } : null);
        }
        return spawnRec;
    },
    _noMoreInstProjections: function XBWidgetPrototype__noMoreInstProjections(WIID, spawnRec) {
        XB._calcNodes.finalizeNodesInMap(spawnRec.vars);
        this._finalizeSettingsMap(spawnRec.settings);
    }
}, {
    persistentProperties: [
        'id',
        'name',
        'isUnique',
        'iconPath',
        '_varsMap',
        '_dataMap',
        '_settingsMap',
        '_refsMap',
        '_contentNodes',
        '_packageSettings',
        '_instSettings',
        '_instVars'
    ],
    createFromPersistData: function XBWidgetPrototype_createFromPersistData(unit, persistData, xmlData, bufferDoc) {
        var protoParser = XB._Parser.widgetProtoParser;
        var result = new this(persistData.id, persistData.name, persistData.isUnique, persistData.iconPath, unit, bufferDoc);
        for (let [
                    ,
                    strucName
                ] in Iterator([
                '_varsMap',
                '_dataMap',
                '_refsMap'
            ])) {
            let dest = result[strucName];
            for (let [
                        key,
                        nodeDescr
                    ] in Iterator(persistData[strucName])) {
                dest[key] = XB._calcNodes.createFromPersistData(result, nodeDescr, xmlData);
            }
        }
        var settStruc = result._settingsMap;
        for (let [
                    settingName,
                    settingDescr
                ] in Iterator(persistData._settingsMap)) {
            settingDescr.node = XB._calcNodes.createFromPersistData(result, settingDescr.node, xmlData);
            let elemDescr = settingDescr.controlElement;
            if (elemDescr) {
                settingDescr.controlElement = protoParser.extractCachedXML(elemDescr, xmlData);
            }
            settStruc[settingName] = settingDescr;
        }
        var pkgSettStruc = result._packageSettings;
        for (let [
                    settingName,
                    settingDescr
                ] in Iterator(persistData._packageSettings)) {
            settingDescr.node = XB._calcNodes.createFromPersistData(result, settingDescr.node, xmlData);
            let elemDescr = settingDescr.controlElement;
            if (elemDescr) {
                settingDescr.controlElement = protoParser.extractCachedXML(elemDescr, xmlData);
            }
            pkgSettStruc[settingName] = settingDescr;
            result.pkg.addSettingUser(settingName, result.id);
        }
        var instSettStruc = result._instSettings;
        for (let [
                    settingName,
                    settingDescr
                ] in Iterator(persistData._instSettings)) {
            let elemDescr = settingDescr.controlElement;
            if (elemDescr) {
                settingDescr.controlElement = protoParser.extractCachedXML(elemDescr, xmlData);
            }
            instSettStruc[settingName] = settingDescr;
        }
        result._instVars = persistData._instVars;
        for (let [
                    ,
                    contentID
                ] in Iterator(persistData._contentNodes)) {
            result._contentNodes.push(protoParser.extractCachedXML(contentID, xmlData));
        }
        return result;
    }
});
XB.WidgetInstance = Base.extend({
    constructor: function XBWidgetInstance(IID, proto, host, refsMap, dataMap, settingsInfo, varsInfo) {
        if (!(proto instanceof XB.WidgetPrototype))
            throw new CustomErrors.EArgType('proto', 'XB.WidgetPrototype', proto);
        if (!IID)
            throw new CustomErrors.EArgRange('IID', '/.+/', IID);
        var startTime = Date.now();
        this._logger = XB._base.getLogger(BarPlatform.makeCompLoggerName(proto.unit) + '.' + IID);
        this._IID = IID;
        this._proto = proto;
        this._host = host;
        this._refsMap = {};
        for (let refID in refsMap)
            this._refsMap[refID] = refsMap[refID].createInstance(this);
        this._dataMap = {};
        for (let dataName in dataMap)
            this._dataMap[dataName] = dataMap[dataName].createInstance(this);
        this._settingsMap = settingsInfo;
        this._varsMap = varsInfo;
        this._logger.config('Instance created in ' + (Date.now() - startTime) + 'ms');
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
    buildUI: function XBWidgetInstance_buildUI(toolbarElement) {
        this._toolbarElement = toolbarElement;
        this._host.overlayController.guiBuilder.makeWidget(this, toolbarElement);
    },
    get instanceSettings() {
        return sysutils.copyObj(this._settingsMap);
    },
    getSettingValue: function XBWidgetInstance_getSettingValue(settingName) {
        var settingNode = this.findSetting(settingName);
        if (!settingNode)
            throw new Error(strutils.formatString('No such setting (%1)', [settingName]));
        return settingNode.getValue();
    },
    applySetting: function XBWidgetInstance_applySetting(settingName, value) {
        var settingNode = this.findSetting(settingName);
        if (!settingNode)
            throw new Error(strutils.formatString('No such setting (%1)', [settingName]));
        settingNode.setValue(value);
    },
    applySettings: function XBWidgetInstance_applySettings(settingsMap, noFail) {
        for (let settingName in settingsMap) {
            try {
                this.applySetting(settingName, settingsMap[settingName]);
            } catch (e) {
                this._logger.error('Couldn\'t apply widget setting. ' + strutils.formatError(e));
                if (!noFail)
                    throw e;
            }
        }
    },
    eraseSettings: function XBWidgetInstance_eraseSettings() {
        for (let [
                    ,
                    setting
                ] in Iterator(this._settingsMap)) {
            setting.node.erase();
        }
    },
    finalize: function XBWidgetInstance_finalize() {
        this._logger.config('Instance finalization');
        this._destroyUI();
        XB._calcNodes.finalizeNodesInMap(this._refsMap);
        this._refsMap = null;
        XB._calcNodes.finalizeNodesInMap(this._dataMap);
        this._dataMap = null;
        this._settingsMap = null;
        this._varsMap = null;
        var proto = this._proto;
        this._proto = null;
        this._host = null;
        proto.instanceFinalized(this);
    },
    get effectiveID() {
        if (!this._effectiveID) {
            this._effectiveID = [
                this._host.id,
                this._IID
            ].join('_');
        }
        return this._effectiveID;
    },
    findReference: function XBWidgetInstance_findReference(refID) {
        return this._refsMap[refID] || null;
    },
    findData: function XBWidgetInstance_findData(dataName) {
        return this._dataMap[dataName] || null;
    },
    findSetting: function XBWidgetInstance_findSetting(settingName) {
        var instSetting = this._settingsMap[settingName];
        return instSetting ? instSetting.node : this._proto.findSetting(settingName);
    },
    findVariable: function XBWidgetInstance_findVariable(varName) {
        return this._varsMap[varName] || this._proto.findVariable(varName);
    },
    get logger() {
        return this._logger;
    },
    _IID: undefined,
    _proto: null,
    _host: null,
    _varsMap: null,
    _dataMap: null,
    _settingsMap: null,
    _refsMap: null,
    _destroyUI: function XBWidgetInstance__destroyUI() {
        try {
            this._host.overlayController.guiBuilder.destroyWidget(this.id);
        } finally {
            this._toolbarElement = undefined;
        }
    }
});
