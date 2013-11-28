"use strict";
const EXPORTED_SYMBOLS = ["NativeComponents"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const BRAND_SVC_COMPONENT_ID = "ru.yandex.custombar.branding";
const BRAND_SVC_NAME = "package";
const BRAND_SVC_PKG_UPD_TOPIC = "package updated";
var application;
var appCore;
var BarPlatform;
const NativeComponents = {
init: function NativeComponents_init(barApplication) {
this._application = application = barApplication;
appCore = barApplication.core;
appCore.Lib.sysutils.copyProperties(appCore.Lib,GLOBAL);
BarPlatform = application.BarPlatform;
this._loggersRoot = application.name + ".NC";
this._logger = Log4Moz.repository.getLogger(this._loggersRoot);
this._loadModules();
this._application.branding.addListener(BRAND_SVC_PKG_UPD_TOPIC,this);
this.registerService(BRAND_SVC_COMPONENT_ID,BRAND_SVC_NAME,brandingService);
BarPlatform.registerUnitParser("native","widget",nativeComponentsParser);
BarPlatform.registerUnitParser("native","plugin",nativeComponentsParser);
}
,
makePackagePrefPath: function NativeComponents_makePackagePrefPath(packageID, settingName) {
if (! packageID)
throw new CustomErrors.EArgRange("packageID", "/.+/", packageID);
return appCore.nativesPrefsPath + packageID + ".settings." + (settingName ? settingName : "");
}
,
makeWidgetPrefPath: function NativeComponents_makeWidgetPrefPath(widgetID, settingName) {
if (! widgetID)
throw new CustomErrors.EArgRange("widgetID", "/.+/", widgetID);
return appCore.nativesPrefsPath + widgetID + ".all.settings." + (settingName ? settingName : "");
}
,
makeInstancePrefPath: function NativeComponents_makeInstancePrefPath(widgetID, instanceID, settingName) {
if (! widgetID)
throw new CustomErrors.EArgRange("widgetID", "/.+/", widgetID);
if (! instanceID)
throw new CustomErrors.EArgRange("instanceID", "/.+/", instanceID);
return appCore.nativesPrefsPath + widgetID + "." + instanceID + ".settings." + (settingName ? settingName : "");
}
,
makeStaticBranchPath: function NativeComponents_makeStaticBranchPath(compID, instanceID) {
if (! compID)
throw new CustomErrors.EArgRange("compID", "/.+/", compID);
return appCore.staticPrefsPath + compID + "." + (instanceID || "all") + ".settings.";
}
,
getPackageStorage: function NativeComponents_getPackageStorage(packageID) {
var storageDir = application.directories.nativeStorageDir;
storageDir.append(encodeURIComponent(packageID));
return storageDir;
}
,
getComponentStorage: function NativeComponents_getComponentStorage(compID) {
var storageDir = application.directories.nativeStorageDir;
storageDir.append(encodeURIComponent(compID));
return storageDir;
}
,
registerService: function NativeComponents_registerService(providerID, serviceName, serviceObject) {
if (! sysutils.isObject(serviceObject))
throw new CustomErrors.EArgRange("serviceObject", "Object", serviceObject);
var serviceData = this._makeServiceData(providerID,serviceName,serviceObject);
this._notifyServiceUsers(providerID,serviceName,serviceData,"registered",serviceObject);
}
,
notifyServiceUsers: function NativeComponents_notifyServiceUsers(providerID, serviceName, topic, data) {
var serviceData = this._getServiceData(providerID,serviceName);
if (! serviceData.serviceObject)
throw new Error(strutils.formatString(this._consts.ERR_SVC_NOT_REGISTERED,[providerID, serviceName]));
this._notifyServiceUsers(providerID,serviceName,serviceData,topic,data);
}
,
unregisterService: function NativeComponents_unregisterService(providerID, serviceName) {
var serviceData = this._getServiceData(providerID,serviceName);
if (! serviceData.serviceObject)
throw new Error(strutils.formatString(this._consts.ERR_SVC_NOT_REGISTERED,[providerID, serviceName]));
this._unregisterService(serviceData);
this._notifyServiceUsers(providerID,serviceName,serviceData,"unregistered",null);
}
,
obtainService: function NativeComponents_obtainService(providerID, serviceName, eventListener, scope) {
var serviceData;
try {
serviceData = this._getServiceData(providerID,serviceName);
}
catch (e) {
this._logger.warn(e);
serviceData = this._makeServiceData(providerID,serviceName,null);
}

for each(let userData in serviceData.usersData) {
if (userData.eventListener == eventListener)
{
if (! serviceData.serviceObject)
return null;
return userData.proxy || (userData.proxy = new sysutils.WeakObjectProxy(serviceData.serviceObject));
}

}

var result = serviceData.serviceObject ? new sysutils.WeakObjectProxy(serviceData.serviceObject) : null;
serviceData.usersData.push({
eventListener: eventListener,
proxy: result,
scope: scope});
return result;
}
,
releaseService: function NativeComponents_releaseService(providerID, serviceName, eventListener) {
var serviceUsersData;
try {
serviceUsersData = this._getServiceData(providerID,serviceName).usersData;
}
catch (e) {
return;
}

for (let i = 0, len = serviceUsersData.length;i < len;i++) {
let userData = serviceUsersData[i];
if (userData.eventListener !== eventListener)
continue;
if (userData.proxy)
{
userData.proxy.clear();
userData.proxy = null;
}

serviceUsersData.splice(i,1);
break;
}

}
,
finalize: function NativeComponents_finalize() {
if (this._findServiceData(BRAND_SVC_COMPONENT_ID,BRAND_SVC_NAME))
this.unregisterService(BRAND_SVC_COMPONENT_ID,BRAND_SVC_NAME);
this._application.branding.removeListener(BRAND_SVC_PKG_UPD_TOPIC,this);
application = appCore = BarPlatform = null;
}
,
observe: function NativeComponents_observe(subject, topic, data) {
if (subject == this._application.branding && topic == BRAND_SVC_PKG_UPD_TOPIC)
{
this._logger.info("Notifying native components about branding update...");
this.notifyServiceUsers(BRAND_SVC_COMPONENT_ID,BRAND_SVC_NAME,BRAND_SVC_PKG_UPD_TOPIC,null);
}

}
,
_modules: ["npwidget.js", "barplugin.js", "ncparser.js", "compapi.js", "sliceapi.js", "brandsvc.js"],
_registeredServices: {
},
_consts: {
ERR_SVC_NOT_REGISTERED: "Provider (%1) did not register service \"%2\"",
ERR_SVC_ALREADY_REGISTERED: "Provider (%1) already registered service \"%2\""},
_loadModules: function NativeComponents__loadModules() {
const mozSSLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const xbDirPath = this._application.partsURL + "native/";
this._modules.forEach(function BarPlatform_loadModule(moduleFileName) {
this._logger.debug("  Loading module " + moduleFileName);
mozSSLoader.loadSubScript(xbDirPath + moduleFileName);
}
,this);
}
,
_getLogger: function NativeComponents__getLogger(name) {
return Log4Moz.repository.getLogger(this._loggersRoot + "." + name);
}
,
_getWindowController: function NativeComponents__getWindowController(window) {
return window[appCore.appName + "OverlayController"];
}
,
_interpretSettingValue: function NativeComponents__interpretSettingValue(rawValue, prefferredType) {
if (rawValue == undefined)
return undefined;
var types = BarPlatform.Unit.settingTypes;
switch (prefferredType) {
case types.STYPE_BOOLEAN:
return ! ! rawValue && rawValue != "false";
case types.STYPE_FLOAT:
return Number(rawValue);
case types.STYPE_INTEGER:
return Math.floor(Number(rawValue));
case types.STYPE_STRING:

default:
return String(rawValue);
}

}
,
_unregisterServices: function NativeComponents__unregisterServices(providerID) {
var componentServices = this._registeredServices[providerID];
for(let serviceName in componentServices) {
let serviceData = componentServices[serviceName];
this._unregisterService(serviceData);
this._notifyServiceUsers(providerID,serviceName,serviceData,"unregistered",null);
}

}
,
_releaseServices: function NativeComponents__releaseServices(scope) {
for each(let provData in this._registeredServices) {
for each(let serviceData in provData) {
serviceData.usersData = serviceData.usersData.filter(function (userData) {
if (userData.scope == scope)
{
if (userData.proxy)
userData.proxy.clear();
return false;
}

return true;
}
);
}

}

}
,
_notifyServiceUsers: function (providerID, serviceName, serviceData, topic, data) {
for each(let userData in serviceData.usersData) {
try {
if (topic == "registered")
data = userData.proxy = new sysutils.WeakObjectProxy(serviceData.serviceObject);
userData.eventListener.observeServiceEvent(providerID,serviceName,topic,data);
if (topic == "unregistered")
{
if (userData.proxy)
{
userData.proxy.clear();
userData.proxy = null;
}

}

}
catch (e) {
this._logger.error("Error notifying service user. " + strutils.formatError(e));
}

}

}
,
_unregisterService: function (serviceData) {
serviceData.serviceObject = null;
}
,
_makeServiceData: function NativeComponents__makeServiceData(providerID, serviceName, serviceObject) {
if (! (providerID in this._registeredServices))
{
let servicesData = this._registeredServices[providerID] = {
};
return servicesData[serviceName] = {
serviceObject: serviceObject,
usersData: []};
}

var componentServices = this._registeredServices[providerID];
var serviceData = componentServices[serviceName];
if (! serviceData)
{
return componentServices[serviceName] = {
serviceObject: serviceObject,
usersData: []};
}

if (serviceData.serviceObject)
throw new Error(strutils.formatString(this._consts.ERR_SVC_ALREADY_REGISTERED,[providerID, serviceName]));
serviceData.serviceObject = serviceObject;
return serviceData;
}
,
_findServiceData: function NativeComponents__findServiceData(providerID, serviceName) {
var componentServices = this._registeredServices[providerID];
var serviceData = componentServices && componentServices[serviceName];
return serviceData;
}
,
_getServiceData: function NativeComponents__getServiceData(providerID, serviceName) {
var serviceData = this._findServiceData(providerID,serviceName);
if (! serviceData)
throw new Error(strutils.formatString(this._consts.ERR_SVC_NOT_REGISTERED,[providerID, serviceName]));
return serviceData;
}
};
