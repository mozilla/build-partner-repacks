"use strict";
EXPORTED_SYMBOLS.push("CustomErrors");
const CustomErrors = {};
CustomErrors.ECustom = function ECustom(message) {
    this._stackFrame = Components.stack.caller;
    if (message) {
        this._message = message.toString();
    }
};
CustomErrors.ECustom.prototype = {
    get name() {
        return this._name;
    },
    get message() {
        return this._message + " (" + this._details.join(", ") + ")";
    },
    get fileName() {
        return this._stackFrame.filename;
    },
    get lineNumber() {
        return this._stackFrame.lineNumber;
    },
    get stack() {
        return this._makeStackStr(this._stackFrame);
    },
    toString: function ECustom_toString() {
        return this.name + ": " + this.message;
    },
    _name: "ECustom",
    _stackFrame: null,
    _message: "Unknown error",
    _details: undefined,
    _makeStackStr: function ECustom__makeStackStr(stackFrame) {
        let result = "";
        do {
            let frameLine = stackFrame.name + "(...)@" + stackFrame.filename + ":" + stackFrame.lineNumber + "\n";
            result += frameLine;
            stackFrame = stackFrame.caller;
        } while (stackFrame);
        return result;
    }
};
CustomErrors.EArgRange = function EArgRange(argName, expectedRange, actualValue) {
    CustomErrors.ECustom.apply(this, arguments);
    this._argName = argName.toString();
    this._expectedRange = expectedRange.toString();
    this._actualValue = actualValue == undefined ? "[" + String(actualValue) + "]" : actualValue.toString();
};
CustomErrors.EArgRange.prototype = {
    _name: "EArgRange",
    __proto__: CustomErrors.ECustom.prototype,
    constructor: CustomErrors.EArgRange,
    _message: "Invalid argument value range",
    _argName: undefined,
    _expectedRange: undefined,
    _actualValue: undefined,
    get _details() [
        this._argName,
        this._expectedRange,
        this._actualValue
    ]
};
CustomErrors.EArgType = function EArgType(argName, expectedTypeName, actualTypeNameOrValue) {
    CustomErrors.ECustom.apply(this, arguments);
    this._argName = argName.toString();
    this._expectedTypeName = expectedTypeName.toString();
    if (typeof actualTypeNameOrValue == "string" && actualTypeNameOrValue.length) {
        this._actualTypeName = actualTypeNameOrValue.toString();
    } else {
        this._actualTypeName = this._guessType(actualTypeNameOrValue);
    }
};
CustomErrors.EArgType.prototype = {
    _name: "EArgType",
    __proto__: CustomErrors.ECustom.prototype,
    constructor: CustomErrors.EArgType,
    _message: "Argument type missmatch",
    _argName: undefined,
    _expectedTypeName: undefined,
    _actualTypeName: undefined,
    get _details() [
        this._argName,
        this._expectedTypeName,
        this._actualTypeName
    ],
    _guessType: function EArgType__guessType(value) {
        if (value === null || value === undefined) {
            return String(value);
        }
        if (value instanceof Components.interfaces.nsISupports) {
            return value.toString();
        }
        let constr = value.constructor;
        return constr ? constr.name : "Unknown";
    }
};
CustomErrors.ENoInterface = function ENoInterface(interfaceName, missingProperties) {
    CustomErrors.ECustom.apply(this, arguments);
    this._intfName = interfaceName.toString();
    this._missing = missingProperties ? String(missingProperties) : undefined;
};
CustomErrors.ENoInterface.prototype = {
    _name: "ENoInterface",
    __proto__: CustomErrors.ECustom.prototype,
    constructor: CustomErrors.ENoInterface,
    _message: "Object does not support a required interface",
    _intfName: undefined,
    _missing: undefined,
    get _details() {
        let details = [this._intfName];
        if (this._missing) {
            details.push("missing properties: " + this._missing);
        }
        return details;
    }
};
CustomErrors.ESecurityViolation = function ESecurityViolation(where, what) {
    CustomErrors.ECustom.apply(this, arguments);
    this._where = where.toString();
    this._what = what.toString();
};
CustomErrors.ESecurityViolation.prototype = {
    _name: "ESecurityViolation",
    __proto__: CustomErrors.ECustom.prototype,
    constructor: CustomErrors.ESecurityViolation,
    _message: "Security violation",
    _where: undefined,
    _what: undefined,
    get _details() [
        this._where,
        this._what
    ]
};
CustomErrors.EDownload = function EDownload(uri, reason) {
    CustomErrors.ECustom.apply(this, arguments);
    this._uri = uri.toString();
    this._reason = reason.toString();
};
CustomErrors.EDownload.prototype = {
    _name: "EDownload",
    __proto__: CustomErrors.ECustom.prototype,
    constructor: CustomErrors.EDownload,
    _message: "Download error",
    _uri: undefined,
    _reason: undefined,
    get _details() [
        this._uri,
        this._reason
    ]
};
