'use strict';
XB._calcNodes = {};
XB._calcNodes.finalizeNodesInMap = function XBCN_finalizeNodesInMap(map) {
    for (let [
                ,
                node
            ] in Iterator(map)) {
        try {
            node.finalize();
        } catch (e) {
            XB._base.logger.error('Error while finalizing calc node. ' + strutils.formatError(e));
            XB._base.logger.debug(e.stack);
        }
    }
};
XB._calcNodes.createFromPersistData = function XBCN_createFromPersistData(owner, persistData, xmlData) {
    return this[persistData.$name].createFromPersistData(owner, persistData, xmlData);
};
XB._calcNodes.NodeBase = Base.extend({
    $name: 'NodeBase',
    constructor: function NodeBase(baseUID) {
        if (!baseUID)
            throw new Error(XB._base.consts.ERR_UID_REQUIRED);
        this._baseUID = baseUID;
    },
    get baseID() {
        return this._baseUID;
    },
    set debugMode(value) {
        this._debugMode = !!value;
    },
    _baseUID: undefined,
    _storedValue: undefined,
    _debugMode: false
});
XB._calcNodes.ConstNodeProto = XB._calcNodes.NodeBase.extend({
    $name: 'ConstNodeProto',
    constructor: function ConstNodeProto(baseUID, initVal) {
        this.base(baseUID);
        this._storedValue = initVal;
    },
    createInstance: function ConstNodeProto_createInstance(widgetInstance) {
        return new XB._calcNodes.ConstNode(this._baseUID, widgetInstance, this._storedValue);
    }
}, {
    persistentProperties: [
        '$name',
        '_baseUID',
        '_storedValue'
    ],
    createFromPersistData: function ConstNodeProto_createFromPersistData(owner, persistData, xmlData) {
        var initialValue = persistData._storedValue;
        if (sysutils.isObject(initialValue)) {
            let xmlNodes = XB._Parser.widgetProtoParser.extractCachedXML(initialValue._rootNode, xmlData);
            initialValue = new XB.types.XML(owner.runtimeXMLDoc, []);
            initialValue.setRoot(xmlNodes);
        }
        return new this(persistData._baseUID, initialValue);
    }
});
XB._calcNodes.FuncNodeProto = XB._calcNodes.NodeBase.extend({
    $name: 'FuncNodeProto',
    constructor: function FuncNodeProto(baseUID, funcName) {
        var instanceClass = XB._functions['CN_' + funcName];
        if (!instanceClass.inherits(XB._calcNodes.FuncNode) && !instanceClass.inherits(XB._calcNodes.ProcNode))
            throw new CustomErrors.EArgType('funcName', 'XB._functions.*', funcName);
        this.base(baseUID);
        this._funcName = funcName;
        this._instanceClass = instanceClass;
        this._argsMap = {};
    },
    proposeArgName: function FuncNodeProto_proposeArgName() {
        var expectedArgNames = this._instanceClass.prototype.expectedArgNames;
        if (expectedArgNames) {
            for (let [
                        ,
                        argName
                    ] in Iterator(expectedArgNames)) {
                if (!this.argumentAttached(argName))
                    return argName;
            }
        }
        return 'param' + this._argsCount;
    },
    attachArgument: function FuncNodeProto_attachArgument(argName, argProto) {
        if (!(argProto instanceof XB._calcNodes.NodeBase))
            throw new CustomErrors.EArgType('argProto', 'NodeBase', argProto);
        if (typeof argProto.createInstance != 'function')
            throw new CustomErrors.EArgRange('argProto', 'function createInstance', argProto.createInstance);
        this._argsMap[argName] = argProto;
        this._argsCount++;
    },
    argumentAttached: function FuncnodeProto_argumentAttached(argName) {
        return !!this._argsMap[argName];
    },
    createInstance: function FuncNodeProto_createInstance(widgetInstance) {
        return new this._instanceClass(this._baseUID, widgetInstance, this._argsMap, this._debugMode);
    },
    _argsMap: null,
    _argsCount: 0,
    _instanceClass: null
}, {
    persistentProperties: [
        '$name',
        '_baseUID',
        '_funcName',
        '_argsMap'
    ],
    createFromPersistData: function FuncNodeProto_createFromPersistData(owner, persistData, xmlData) {
        var result = new this(persistData._baseUID, persistData._funcName);
        for (let [
                    argName,
                    argDescr
                ] in Iterator(persistData._argsMap)) {
            result._argsMap[argName] = XB._calcNodes.createFromPersistData(owner, argDescr, xmlData);
            result._argsCount++;
        }
        return result;
    }
});
XB._calcNodes.ICalcNodeOwner = new sysutils.Interface('ICalcNodeOwner', undefined, {
    effectiveID: 'string',
    logger: 'object'
});
XB._calcNodes.BoundNode = XB._calcNodes.NodeBase.extend({
    $name: 'BoundNode',
    constructor: function BoundNode(baseUID, owner) {
        XB._calcNodes.ICalcNodeOwner.checkImplementation(owner);
        this.base(baseUID);
        this._owner = owner;
        this._effectiveID = [
            this._owner.effectiveID,
            this._baseUID
        ].join('_');
        this._logger = this._owner.logger;
    },
    get effectiveID() {
        return this._effectiveID;
    },
    get description() {
        return this._getHumanReadableID();
    },
    get owner() {
        return this._owner;
    },
    hasSubscribers: function BoundNode_hasSubscribers() {
        return false;
    },
    finalize: function BoundNode_finalize() {
        this._owner = null;
        this._logger = null;
    },
    _owner: null,
    _logger: null,
    _effectiveID: undefined,
    _createException: function BoundNode__createException(type, message) {
        return new XB.types.Exception(this._getHumanReadableID(), XB.types.Exception.types[type], message);
    },
    _formatRuntimeError: function BoundNode__formatRuntimeError(e) {
        return XB._base.consts.ERR_RUNTIME_ERROR + ' in node ' + this._getHumanReadableID() + '. ' + strutils.formatError(e);
    },
    _getHumanReadableID: function BoundNode__getHumanReadableID() {
        return this.$name + '(' + this.effectiveID + ')';
    }
});
XB._calcNodes.ConstNode = XB._calcNodes.BoundNode.extend({
    $name: 'ConstNode',
    constructor: function ConstNode(baseUID, owner, initVal) {
        this.base(baseUID, owner);
        this._storedValue = initVal;
        if (XB.types.isXML(initVal))
            initVal.owner = this;
    },
    getValue: function ConstNode_getValue() {
        return this._storedValue;
    },
    unsubscribe: function ConstNode_unsubscribe() {
    },
    finalize: function ConstNode_finalize() {
        if (XB.types.isXML(this._storedValue))
            this._storedValue.dispose();
        this._storedValue = undefined;
        this.base();
    },
    freeze: function ConstNode_freeze() {
        throw new Error(XB._calcNodes.ConstNode.ERR_UNSUPPORTED_ACTION);
    },
    melt: function ConstNode_melt() {
        throw new Error(XB._calcNodes.ConstNode.ERR_UNSUPPORTED_ACTION);
    }
}, { ERR_UNSUPPORTED_ACTION: 'ConstNode does not support this method' });
XB._calcNodes.DynNode = XB._calcNodes.ConstNode.extend({
    $name: 'DynNode',
    constructor: function DynNode(baseUID, widget, initVal) {
        this.base.apply(this, arguments);
        this._dependants = {};
    },
    getValue: function DynNode_getValue(subscriber) {
        if (subscriber)
            this._subscribe(subscriber);
        return this.base();
    },
    unsubscribe: function DynNode_unsubscribe(subscriber) {
        var subscriberID = subscriber.effectiveID;
        if (!(subscriberID in this._dependants))
            return;
        delete this._dependants[subscriberID];
        if (!this.hasSubscribers()) {
            if (this._debugMode) {
                let subID = typeof subscriber._getHumanReadableID == 'function' ? subscriber._getHumanReadableID() : subscriber.effectiveID;
                this._logger.debug('Node ' + this._getHumanReadableID() + ' lost all subscribers. Last one was ' + subID);
            }
            try {
                this._notNeeded();
            } catch (e) {
                this._logger.error('Node ' + this._getHumanReadableID() + ' failed in _notNeeded. ' + this._formatRuntimeError(e));
                this._logger.debug(e.stack);
            }
        }
    },
    hasSubscribers: function DynNode_hasSubscribers() {
        return !sysutils.isEmptyObject(this._dependants);
    },
    finalize: function DynNode_finalize() {
        try {
            this._dependants = {};
            this._notNeeded();
            this._setNewVal(XB.types.empty);
        } finally {
            this.base();
        }
    },
    _setNewVal: function DynNode__setNewVal(newVal) {
        var XBTypes = XB.types;
        var valuesDiffer;
        if (newVal !== undefined && this._storedValue !== undefined) {
            let compResult = XBTypes.compareValues(newVal, this._storedValue, XBTypes.cmpModes.CMP_STRICT, this._owner);
            valuesDiffer = compResult != 0;
        } else
            valuesDiffer = newVal !== this._storedValue;
        if (this._debugMode && this._logger.level <= Log4Moz.Level.Debug) {
            this._logger.debug('Node ' + this._getHumanReadableID() + ' _setNewVal from ' + (this._storedValue === undefined ? 'undefined' : XBTypes.describeValue(this._storedValue)) + ' to ' + (newVal === undefined ? 'undefined' : XBTypes.describeValue(newVal)) + ', differ: ' + valuesDiffer);
            if (XBTypes.isXML(newVal))
                this._logger.debug('new value is:' + newVal.toString());
        }
        if (valuesDiffer || newVal === undefined || this._storedValue === undefined) {
            if (XBTypes.isXML(newVal)) {
                if (newVal.disposed && this._debugMode)
                    this._logger.warn(this._getHumanReadableID() + ' got disposed XML');
            }
            if (XBTypes.isXML(this._storedValue) && this._storedValue.owner === this)
                this._storedValue.dispose();
            this._storedValue = newVal;
            if (XBTypes.isXML(newVal) && !newVal.owner)
                newVal.owner = this;
        } else {
            if (XBTypes.isXML(newVal) && newVal !== this._storedValue) {
                newVal.dispose();
            }
        }
        return valuesDiffer;
    },
    _subscribe: function DynNode__subscribe(subscriber) {
        this._dependants[subscriber.effectiveID] = subscriber;
    },
    _notifyDeps: function DynNode__notifyDeps() {
        try {
            this._freezeDeps();
        } finally {
            this._meltDeps(true);
        }
    },
    _freezeDeps: function DynNode__freezeDeps() {
        for (let [
                    ,
                    dependant
                ] in Iterator(this._dependants))
            dependant.freeze();
    },
    _meltDeps: function DynNode__meltDeps(iChanged) {
        var depsCopy = sysutils.copyObj(this._dependants);
        for (let [
                    ,
                    dependant
                ] in Iterator(depsCopy)) {
            try {
                dependant.melt(iChanged ? this : null);
            } catch (e) {
                let depID = typeof dependant._getHumanReadableID == 'function' ? dependant._getHumanReadableID() : dependant.effectiveID;
                this._logger.error(this._getHumanReadableID() + ' failed melting dependant node ' + depID + '. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
    },
    _notNeeded: function DynNode__notNeeded() {
    },
    _dependants: null
});
XB._calcNodes.IVariable = {
    $name: 'IVariable',
    setValue: function IVariable_setValue(newValue) {
        if (this._setNewVal(newValue)) {
            if (XB.types.isXML(newValue))
                newValue.owner = this;
            this._notifyDeps();
        }
    }
};
XB._calcNodes.IHasArguments = {
    constructor: function HasArgs(baseUID, widget, argsMap) {
        this.base(baseUID, widget);
        if (!(widget instanceof XB.WidgetPrototype || widget instanceof XB.WidgetInstance))
            throw new CustomErrors.EArgType('widget', 'XB.WidgetPrototype or XB.WidgetInstance', widget);
        this._parentWidget = widget;
        this._argManager = new XB._calcNodes.FuncNode.ArgManager(this);
        for (let argName in argsMap) {
            let argProto = argsMap[argName];
            this._argManager.attachArgument(argName, argProto.createInstance(widget));
        }
    },
    unsubscribe: function HasArgs_unsubscribe(subscriber) {
        try {
            this.base(subscriber);
        } finally {
            if (!this.hasSubscribers())
                this._argManager.freeAll();
        }
    },
    finalize: function HasArgs_finalize() {
        try {
            this.base();
        } finally {
            this._argManager.freeAll();
        }
    },
    _parentWidget: null,
    _argManager: null
};
XB._calcNodes.ProcNodeBase = XB._calcNodes.ConstNode.extend(XB._calcNodes.IHasArguments);
XB._calcNodes.ProcNode = XB._calcNodes.ProcNodeBase.extend({
    $name: 'ProcNode',
    perform: function ProcNode_perform(eventInfo) {
        try {
            return this._proc(eventInfo);
        } catch (e) {
            if (e instanceof XB.types.Exception)
                return e;
            return XB.types.createXBExceptionFromRTError(this._getHumanReadableID(), e);
        }
    },
    getValue: function ProcNode_getValue() {
        return this.perform();
    }
});
XB._calcNodes.FuncNodeBase = XB._calcNodes.DynNode.extend(XB._calcNodes.IHasArguments);
XB._calcNodes.FuncNode = XB._calcNodes.FuncNodeBase.extend({
    $name: 'FuncNode',
    constructor: function FuncNode(baseUID, widget, argsMap, debugMode) {
        this.base(baseUID, widget, argsMap);
        this._changedArgs = [];
        this._debugMode = !!debugMode;
    },
    freeze: function FuncNode_freeze() {
        if (!this.hasSubscribers()) {
            XB._base.logger.warn('Attempt to freeze ' + this._getHumanReadableID() + ', which has no subscribers.');
            return;
        }
        this._freezeLevel++;
        this._freezeDeps();
    },
    melt: function FuncNode_melt(changedArgNode) {
        if (this._freezeLevel == 0)
            return;
        this._freezeLevel = Math.max(0, this._freezeLevel - 1);
        var hasSubscribers = this.hasSubscribers();
        if (changedArgNode)
            this._changedArgs.push(changedArgNode);
        var iChanged = false;
        try {
            if (this._freezeLevel == 0 && this._changedArgs.length > 0 && hasSubscribers) {
                let newVal = this._calculateSafely();
                this._changedArgs = [];
                iChanged = this._setNewVal(newVal);
            }
        } finally {
            this._meltDeps(iChanged);
        }
    },
    unsubscribe: function FuncNode_unsubscribe(subscriber) {
        if (!(subscriber.effectiveID in this._dependants))
            return;
        try {
            this.base(subscriber);
        } finally {
            let (i = this._freezeLevel) {
                for (; i > 0; i--)
                    subscriber.melt(null);
            }
        }
        if (!this.hasSubscribers()) {
            this._freezeLevel = 0;
            this._setNewVal(undefined);
        }
    },
    getValue: function FuncNode_getValue(subscriber) {
        var prevValue = this.base(subscriber);
        if (prevValue === undefined) {
            let newVal = this._calculateSafely();
            if (this.hasSubscribers())
                this._setNewVal(newVal);
            return newVal;
        }
        return prevValue;
    },
    _freezeLevel: 0,
    _changedArgs: null,
    _debugMode: false,
    _subscribe: function FuncNode__subscribe(subscriber) {
        try {
            this.base(subscriber);
        } finally {
            let (i = this._freezeLevel) {
                for (; i > 0; i--)
                    subscriber.freeze();
            }
        }
    },
    _calculateSafely: function FuncNode__calculateSafely() {
        var val;
        this._argManager.resetUseStat();
        try {
            val = this._calculate(this._changedArgs);
        } catch (e) {
            if (e instanceof XB.types.Exception)
                val = e;
            else {
                val = XB.types.createXBExceptionFromRTError(this._getHumanReadableID(), e);
                if (this._debugMode) {
                    this._logger.debug(this._formatRuntimeError(e));
                    this._logger.debug(e.stack);
                }
            }
        } finally {
            this._argManager.freeUnused();
        }
        if (this._debugMode)
            this._logger.debug(this._getHumanReadableID() + ' calculated ' + XB.types.describeValue(val));
        return val;
    }
});
XB._calcNodes.FuncNode.ArgManager = function FNArgManager(managedNode) {
    if (!(managedNode instanceof XB._calcNodes.FuncNode || managedNode instanceof XB._calcNodes.ProcNode))
        throw new CustomErrors.EArgType('managedNode', 'FuncNode|ProcNode', managedNode);
    this._managedNode = managedNode;
    this._namedArgs = {};
    this._orderedArgs = [];
};
XB._calcNodes.FuncNode.ArgManager.prototype = {
    constructor: XB._calcNodes.FuncNode.ArgManager,
    attachArgument: function ArgMan_attachArgument(argName, argNode) {
        if (!argName)
            throw new CustomErrors.EArgRange('argName', '/.+/', argName);
        if (!(argNode instanceof XB._calcNodes.BoundNode))
            throw new CustomErrors.EArgType('argNode', 'BoundNode', argNode);
        var argInfo = {
                node: argNode,
                used: false
            };
        this._argsCount = this._orderedArgs.push(argInfo);
        this._namedArgs[argName] = argInfo;
    },
    detachArgument: function ArgMan_detachArgument(argName) {
        var argInfo = this._getArgInfoByName(argName);
        argInfo.used = false;
        argInfo.node.unsubscribe(this._managedNode);
        delete this._namedArgs[argName];
    },
    resetUseStat: function ArgMan_resetUseStat() {
        for (let [
                    ,
                    argInfo
                ] in Iterator(this._namedArgs))
            argInfo.used = false;
    },
    freeUnused: function ArgMan_freeUnused() {
        for (let [
                    ,
                    argInfo
                ] in Iterator(this._namedArgs)) {
            if (!argInfo.used)
                argInfo.node.unsubscribe(this._managedNode);
        }
    },
    freeAll: function ArgMan_freeAll() {
        for (let [
                    ,
                    argInfo
                ] in Iterator(this._namedArgs)) {
            argInfo.used = false;
            argInfo.node.unsubscribe(this._managedNode);
        }
    },
    argExists: function ArgMan_argExists(argName) {
        return argName in this._namedArgs && typeof this._namedArgs[argName] == 'object';
    },
    get argsNames() {
        return [argName for (argName in this._namedArgs)];
    },
    getValByName: function ArgMan_getValByName(argName, preferedType) {
        return this._processArgInfo(this._getArgInfoByName(argName), preferedType);
    },
    getValsByClass: function AtgMan_getValsByClass(className, preferedType) {
        var namePattern = new RegExp('^' + className + '\\.(.+)$');
        var retVal = {};
        for (let argName in this._namedArgs) {
            let match = argName.match(namePattern);
            if (match)
                retVal[match[1]] = this._processArgInfo(this._namedArgs[argName], preferedType);
        }
        return retVal;
    },
    getValByIndex: function ArgMan_getValByIndex(argIndex, preferedType) {
        return this._processArgInfo(this._getArgInfoByIndex(argIndex), preferedType);
    },
    getValByNameDef: function ArgMan_getValByNameDef(argName, preferedType, defaultValue) {
        if (!this.argExists(argName))
            return defaultValue;
        return this._processArgInfo(this._getArgInfoByName(argName), preferedType);
    },
    getValByIndexDef: function ArgMan_getValByIndexDef(argIndex, preferedType, defaultValue) {
        if (!(argIndex in this._orderedArgs))
            return defaultValue;
        return this._processArgInfo(this._getArgInfoByIndex(argIndex), preferedType);
    },
    findNodeByName: function ArgMan_findNodeByName(argName) {
        var argInfo = this._namedArgs[argName];
        if (argInfo) {
            argInfo.used = true;
            return argInfo.node;
        }
        return null;
    },
    findNodeByIndex: function ArgMan_findNodeByIndex(argIndex) {
        var argInfo = this._orderedArgs[argIndex];
        if (argInfo) {
            argInfo.used = true;
            return argInfo.node;
        }
        return null;
    },
    get argsCount() {
        return this._argsCount;
    },
    argInArray: function ArgMan_argInArray(argName, array) {
        if (!Array.isArray(array))
            throw new TypeError('Array expected');
        var argNode = this.findNodeByName(argName);
        if (!argNode)
            return false;
        for (let [
                    ,
                    item
                ] in Iterator(array)) {
            if (item === argNode)
                return true;
        }
        return false;
    },
    _consts: { ERR_NO_ARG: 'No such argument' },
    _managedNode: null,
    _namedArgs: null,
    _orderedArgs: null,
    _argsCount: 0,
    _getArgInfoByName: function ArgMan__getArgInfoByName(argName) {
        if (!(argName in this._namedArgs))
            throw new Error(this._consts.ERR_NO_ARG + ': "' + argName + '"');
        return this._namedArgs[argName];
    },
    _getArgInfoByIndex: function ArgMan__getArgInfoByIndex(argIndex) {
        if (!(argIndex in this._orderedArgs))
            throw new Error(this._consts.ERR_NO_ARG + ': ' + argIndex);
        return this._orderedArgs[argIndex];
    },
    _processArgInfo: function ArgMan__processArgInfo(argInfo, preferedType) {
        if (argInfo == undefined)
            throw new Error(this._consts.ERR_NO_ARG);
        argInfo.used = true;
        var argVal = argInfo.node.getValue(this._managedNode.hasSubscribers() ? this._managedNode : null);
        if (argVal instanceof XB.types.Exception)
            throw argVal;
        switch (preferedType) {
        case 'Number':
            return XB.types.xToNumber(argVal);
        case 'String':
            return XB.types.xToString(argVal);
        case 'Bool':
            return XB.types.xToBool(argVal);
        case 'XML':
            return XB.types.xToXML(argVal, this._managedNode.owner.prototype.runtimeXMLDoc);
        case 'ResDescriptor':
            return XB.types.xToResDescriptor(argVal, this._managedNode.owner);
        default:
            return argVal;
        }
    }
};
XB._calcNodes.Persistent = XB._calcNodes.DynNode.extend({
    $name: 'Persistent',
    constructor: function FPersistentNode(baseUID, owner, defaultValue, persistSettings) {
        this._defaultValue = defaultValue || XB.types.empty;
        this.base(baseUID, owner, this._defaultValue);
        if (!persistSettings)
            return;
        if (!persistSettings.path || !persistSettings.category || !persistSettings.key)
            throw new CustomErrors.EArgRange('persistSettings', '{path, category, key}', sysutils.dump(persistSettings));
        this._prefFullPath = [
            persistSettings.path,
            persistSettings.category,
            persistSettings.key
        ].join('.');
        this._persistSettings = persistSettings;
        var storedVal = Preferences.get(this._prefFullPath);
        if (storedVal !== undefined) {
            this._dontWrite = true;
            try {
                this._setNewVal(storedVal);
            } finally {
                this._dontWrite = false;
            }
        }
        Preferences.observe(this._prefFullPath, this);
    },
    finalize: function FPersistentNode_finalize() {
        if (this._prefFullPath)
            Preferences.ignore(this._prefFullPath, this);
        this._dontWrite = true;
        this.base();
    },
    get defaultValue() {
        return this._defaultValue;
    },
    erase: function FPersistentNode_erase() {
        if (!this._prefFullPath)
            throw new Error('Persist settings are undefined');
        this._erasing = true;
        try {
            Preferences.reset(this._prefFullPath);
        } finally {
            this._erasing = false;
        }
    },
    observe: function FPersistentNode_observe(subject, topic, data) {
        if (this._erasing)
            return;
        var prefPath = data;
        this._logger.debug(this._getHumanReadableID() + ' observes ' + topic);
        var value = Preferences.get(prefPath, this._defaultValue);
        this._dontWrite = true;
        try {
            if (this._setNewVal(value))
                this._notifyDeps();
        } finally {
            this._dontWrite = false;
        }
    },
    _prefsModule: null,
    _prefFullPath: undefined,
    _dontWrite: false,
    _erasing: false,
    _setNewVal: function FPersistentNode__setNewVal(value) {
        if (value === undefined)
            return undefined;
        var changed = this.base(value);
        if (changed && !this._dontWrite && this._prefFullPath) {
            this._logger.debug('Persistent node ' + this.effectiveID + ' writes new value ' + value);
            Preferences.ignore(this._prefFullPath, this);
            try {
                if (!XB.types.isXML(value))
                    Preferences.overwrite(this._prefFullPath, value);
            } finally {
                Preferences.observe(this._prefFullPath, this);
            }
        }
        return changed;
    }
});
XB._calcNodes.Persistent.implement(XB._calcNodes.IVariable);
XB._calcNodes.SettingNode = XB._calcNodes.Persistent.extend({
    constructor: function SettingNode(baseUID, owner, persistPath, name, defaultValue) {
        this.base(baseUID, owner, defaultValue, {
            path: persistPath,
            category: 'settings',
            key: name
        });
    }
}, {
    persistentProperties: [
        '$name',
        '_baseUID',
        '_defaultValue',
        '_persistSettings'
    ],
    createFromPersistData: function SettingNode_createFromPersistData(owner, persistData, xmlData) {
        var ps = persistData._persistSettings;
        return new this(persistData._baseUID, owner, ps.path, ps.key, persistData._defaultValue);
    }
});
XB._calcNodes.VarNode = XB._calcNodes.Persistent.extend({
    constructor: function VarNode(baseUID, widgetInstance, defaultValue, persistSettings) {
        if (persistSettings)
            persistSettings.category = 'variables';
        this.base(baseUID, widgetInstance, defaultValue, persistSettings);
    }
}, {
    persistentProperties: [
        '$name',
        '_baseUID',
        '_defaultValue',
        '_persistSettings'
    ],
    createFromPersistData: function VarNode_createFromPersistData(owner, persistData, xmlData) {
        return new this(persistData._baseUID, owner, persistData._defaultValue, persistData._persistSettings);
    }
});
