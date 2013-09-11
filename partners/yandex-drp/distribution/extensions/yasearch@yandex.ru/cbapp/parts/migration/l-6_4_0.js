"use strict";
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
var application;
const migrator = {
init: function migrator_init(aMigrationModule) {
this._migrationModule = aMigrationModule;
application = aMigrationModule.app;
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
}
,
migrate: function migrator_migrate() {
const geolocationPluginId = "http://bar.yandex.ru/packages/yandexbar#geolocation";
var oldGeolocationPrefName = "yasearch.geolocation.enabled";
var geolocationEnabled = Preferences.get(oldGeolocationPrefName,null);
if (geolocationEnabled !== null)
{
try {
application.widgetLibrary.getPlugin(geolocationPluginId).enabled = geolocationEnabled;
}
catch (e) {
this._logger.config("Couldn't change Geolocation plugin state. " + strutils.formatError(e));
}

Preferences.reset(oldGeolocationPrefName);
}

if (! application.usingInternalPreset && ! application.defaultPreset.refsPlugin(geolocationPluginId) && application.branding.getYandexFeatureState("geolocation"))
{
let CompEntryProps = application.BarPlatform.Preset.ComponentEntry.prototype;
application.defaultPreset.appendEntry({
componentType: CompEntryProps.TYPE_PLUGIN,
componentID: geolocationPluginId,
enabled: CompEntryProps.ENABLED_YES});
let presetFile = application.directories.presetsDir;
presetFile.append(encodeURIComponent(application.defaultPreset.url));
application.defaultPreset.saveToFile(presetFile);
}

}
,
get _logger() {
return this._migrationModule.logger;
}
};
