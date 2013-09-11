"use strict";
const EXPORTED_SYMBOLS = ["appStrings"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const appStrings = {
init: function StringBundlePart_init(application) {
this._application = application;
this.defaultPrefixForURL = "chrome://" + application.name + "/locale/";
var globalPropsBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService).createBundle(this.defaultPrefixForURL + "global.properties");
var pluralRule = parseInt(globalPropsBundle.GetStringFromName("pluralRule"),10);
Cu.import("resource://gre/modules/PluralForm.jsm",this._pluralFormModule);
[this.getPluralForm, this.getNumForms] = this._pluralFormModule.PluralForm.makeGetter(pluralRule);
}
,
defaultPrefixForURL: undefined,
getPluralForm: undefined,
getNumForms: undefined,
_application: null,
_pluralFormModule: {
}};
appStrings.StringBundle = function StringBundle(aURL) {
this._url = this._createURL(aURL);
}
;
appStrings.StringBundle.prototype = {
get: function StringBundle_get(key, args) {
var nonBrandResult = args ? this._stringBundle.formatStringFromName(key,args,args.length) : this._stringBundle.GetStringFromName(key);
return appStrings._application.branding.expandBrandTemplates(nonBrandResult);
}
,
getPlural: function StringBundle_getPlural(key, pluralData, args) {
if (typeof pluralData == "number")
return this._getPluralString(key,pluralData);
var str = this.get(key,args);
for (let i = pluralData.length;i--;) {
let purIndex = i + 1;
let data = pluralData[i];
let plurStringKey = typeof data == "number" || ! ("key" in data) ? [key, purIndex, "Plur"].join("") : data.key;
let plurNumber = (typeof data == "number" ? data : data.number) || 0;
let plurString = this._getPluralString(plurStringKey,plurNumber);
str = str.replace(new RegExp("#" + purIndex, "g"),plurString);
}

return str;
}
,
tryGet: function StringBundle_tryGet(key, args, defaultString) {
try {
return this.get(key,args);
}
catch (e) {

}

return defaultString || "";
}
,
_createURL: function StringBundle__createURL(aURL) {
return (/^[a-z]+:\/\//.test(aURL) ? "" : appStrings.defaultPrefixForURL) + aURL;
}
,
get _stringBundle() {
var stringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService).createBundle(this._url);
this.__defineGetter__("_stringBundle",function _stringBundle() stringBundle);
return this._stringBundle;
}
,
_getPluralString: function StringBundle__getPluralString(aStringKey, aNumber) {
var plurStrings = this.get(aStringKey).split(";");
var plurStringNone = appStrings.getNumForms() < plurStrings.length ? plurStrings.shift() : null;
return aNumber === 0 && plurStringNone !== null ? plurStringNone : appStrings.getPluralForm(aNumber,plurStrings.join(";"));
}
};
