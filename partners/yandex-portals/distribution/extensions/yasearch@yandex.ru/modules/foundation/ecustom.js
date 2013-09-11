"use strict";
EXPORTED_SYMBOLS.push("CustomErrors");
const CustomErrors = {
};
CustomErrors.ECustom = Base.extend({
$name: "ECustom",
constructor: function ECustom(message) {
this._stackFrame = Components.stack.caller;
if (message)
this._message = message.toString();
}
,
get name() {
return this.$name;
}
,
get message() {
return this._message + " (" + this._details.join(", ") + ")";
}
,
get fileName() {
return this._stackFrame.filename;
}
,
get lineNumber() {
return this._stackFrame.lineNumber;
}
,
get stack() {
return this._makeStackStr(this._stackFrame);
}
,
toString: function ECustom_toString() {
return this.name + ": " + this.message;
}
,
_stackFrame: null,
_message: "Unknown error",
_details: undefined,
_makeStackStr: function ECustom__makeStackStr(stackFrame) {
var result = "";
do {
let frameLine = stackFrame.name + "(...)@" + stackFrame.filename + ":" + stackFrame.lineNumber + "\n";
result += frameLine;
stackFrame = stackFrame.caller;
}
 while (stackFrame);
return result;
}
});
CustomErrors.EArgRange = CustomErrors.ECustom.extend({
$name: "EArgRange",
constructor: function EArgRange(argName, expectedRange, actualValue) {
this.base();
this._argName = argName.toString();
this._expectedRange = expectedRange.toString();
this._actualValue = actualValue == undefined ? "[" + String(actualValue) + "]" : actualValue.toString();
}
,
_message: "Invalid argument value range",
_argName: undefined,
_expectedRange: undefined,
_actualValue: undefined,
get _details() {
return [this._argName, this._expectedRange, this._actualValue];
}
});
CustomErrors.EArgType = CustomErrors.ECustom.extend({
$name: "EArgType",
constructor: function EArgType(argName, expectedTypeName, actualTypeNameOrValue) {
this.base();
this._argName = argName.toString();
this._expectedTypeName = expectedTypeName.toString();
if (typeof actualTypeNameOrValue == "string" && actualTypeNameOrValue.length)
this._actualTypeName = actualTypeNameOrValue.toString(); else
this._actualTypeName = this._guessType(actualTypeNameOrValue);
}
,
_message: "Argument type missmatch",
_argName: undefined,
_expectedTypeName: undefined,
_actualTypeName: undefined,
get _details() {
return [this._argName, this._expectedTypeName, this._actualTypeName];
}
,
_guessType: function EArgType__guessType(value) {
if (value === null || value === undefined)
return "" + value; else
{
if (value instanceof Components.interfaces.nsISupports)
return value.toString();
let constr = value.constructor;
return constr ? constr.name : "Unknown";
}

}
});
CustomErrors.ENoInterface = CustomErrors.ECustom.extend({
$name: "ENoInterface",
constructor: function ENoInterface(interfaceName, missingProperties) {
this.base();
this._intfName = interfaceName.toString();
this._missing = missingProperties ? String(missingProperties) : undefined;
}
,
_message: "Object does not support a required interface",
_intfName: undefined,
_missing: undefined,
get _details() {
var details = [this._intfName];
if (this._missing)
details.push("missing properties: " + this._missing);
return details;
}
});
CustomErrors.ESecurityViolation = CustomErrors.ECustom.extend({
$name: "ESecurityViolation",
constructor: function ESecurityViolation(where, what) {
this.base();
this._where = where.toString();
this._what = what.toString();
}
,
_message: "Security violation",
_where: undefined,
_what: undefined,
get _details() {
return [this._where, this._what];
}
});
CustomErrors.EDownload = CustomErrors.ECustom.extend({
$name: "EDownload",
constructor: function EDownload(uri, reason) {
this.base();
this._uri = uri.toString();
this._reason = reason.toString();
}
,
_message: "Download error",
_uri: undefined,
_reason: undefined,
get _details() {
return [this._uri, this._reason];
}
});
