"use strict";
const EXPORTED_SYMBOLS = ["usageHistory"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const usageHistory = {
init: function UsageHistory_init(application) {
this._application = application;
this._logger = application.getLogger("usageHistory");
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
Services.obs.addObserver(this,this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT,false);
this._database = new Database(this._dbFile);
}
,
finalize: function UsageHistory_finalize(finalCleanup, callback) {
Services.obs.removeObserver(this,this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT);
var dbClosedCallback = function () {
this._database = null;
this._application = null;
this._logger = null;
}
.bind(this);
if (this._database)
{
this._database.close(function () {
dbClosedCallback();
callback();
}
);
return true;
}

dbClosedCallback();
}
,
observe: function UsageHistory_observe(aSubject, aTopic, aData) {
switch (aTopic) {
case this._application.core.eventTopics.THUMBS_STRUCTURE_READY_EVENT:
this._sendUsageStat();
break;
}

}
,
getDataForPeriod: function UsageHistory_getDataForPeriod(params, callback) {
var self = this;
var params = params || {
};
var now = new Date();
params.from = params.from || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
params.to = params.to || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
if (params.emptyStat === undefined)
{
params.emptyStat = true;
}

this._database.execQueryAsync("SELECT COUNT(rowid) AS total, action FROM usagehistory WHERE (date BETWEEN :dateStart AND :dateEnd) GROUP BY action",{
dateStart: params.from.getTime(),
dateEnd: params.to.getTime()},function (rowsData) {
var output = {
vadd: 0,
vdel: 0,
vshow: 0,
vpinned: 0,
vsearchform: Number(self._application.searchSuggest.isFormVisible)};
rowsData.forEach(function (row) {
switch (row.action) {
case "add":
output.vadd = row.total;
break;
case "delete":
output.vdel = row.total;
break;
case "show":
output.vshow = row.total;
break;
}

}
);
if (params.emptyStat)
{
self._database.execQueryAsync("DELETE FROM usagehistory WHERE (date BETWEEN :dateStart AND :dateEnd)",{
dateStart: params.from.getTime(),
dateEnd: params.to.getTime()});
}

output.vpinned = self._application.thumbs.pinnedPositions.join("-");
callback && callback(output);
}
);
this._logger.debug("Perform SQL request to usagehistory table with start param = " + params.from.getTime() + " AND end = " + params.to.getTime());
}
,
logAction: function UsageHistory_logAction(action, info) {
info = info || {
};
this._database.execQueryAsync("INSERT INTO usagehistory (date, action, info) VALUES (:date, :action, :info)",{
date: Date.now(),
action: action,
info: JSON.stringify(info)});
}
,
_sendUsageStat: function UsageHistory__sendUsageStat() {
const SECONDS_IN_WEEK = 7 * 86400;
var makeRequest = function makeRequest() {
this._logger.debug("Perform barnavig request with week usage stat...");
this.getDataForPeriod(undefined,function (statData) {
var prefs = this._application.preferences;
var appInstallTime = prefs.get("general.install.time",0);
var now = Math.round(Date.now() / 1000);
var barNavigSendData = statData;
(barNavigSendData.vweek = Math.floor((now - appInstallTime) / SECONDS_IN_WEEK), barNavigSendData.vcountstbX = prefs.get("ftabs.layoutX",0));
barNavigSendData.vcountstbY = prefs.get("ftabs.layoutY",0);
barNavigSendData.vfill = this._application.thumbs.numberOfFilled;
this._logger.debug("Sending week usage data to bar-navig: " + JSON.stringify(barNavigSendData));
this._application.barnavig.sendRequest(barNavigSendData);
prefs.set(this._consts.LAST_SENT_PREF_TS,now);
}
.bind(this));
new sysutils.Timer(this._sendUsageStat, SECONDS_IN_WEEK * 1000);
}
.bind(this);
var lastCheckTime = this._application.preferences.get(this._consts.LAST_SENT_PREF_TS,0);
lastCheckTime = parseInt(lastCheckTime,10) || 0;
if (lastCheckTime === 0)
{
lastCheckTime = this._application.preferences.get("general.install.time");
}

var nextCheckInterval = SECONDS_IN_WEEK * 1000 - Math.abs(lastCheckTime * 1000 - Date.now());
nextCheckInterval = Math.max(nextCheckInterval,0);
if (nextCheckInterval)
{
this._logger.debug("Next week usage request will be sent in " + Math.round(nextCheckInterval / 1000) + " seconds");
}

new sysutils.Timer(makeRequest, nextCheckInterval);
}
,
get _dbFile() {
delete this._dbFile;
var dbFile = this._application.directories.appRootDir;
dbFile.append("usagehistory.sqlite");
return this._dbFile = dbFile;
}
,
_consts: {
LAST_SENT_PREF_TS: "stat.usage.lastsent"},
_application: null,
_logger: null,
_database: null};
