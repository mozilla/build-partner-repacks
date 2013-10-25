"use strict";
const EXPORTED_SYMBOLS = ["sync"];
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
const GLOBAL = this;
const STATES = {
NO_SYNC_COMPONENT: 4,
TOKEN_EXPIRED: 3,
NOT_AUTHORIZED: 2,
SYNCING: 1};
const LOGIN_STATES = {
NO_AUTH: 1,
REQUEST: 2,
AUTH: 3,
UNKNOWN_ERROR: 4,
CREDENTIALS_ERROR: 5,
CAPTCHA_REQUIRED: 6,
NETWORK_ERROR: 7,
EXPIRED: 8};
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL,"UUID_SVC","@mozilla.org/uuid-generator;1","nsIUUIDGenerator");
const sync = {
init: function Sync_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
this._application = application;
this._logger = application.getLogger("Sync");
var topics = this._application.core.eventTopics;
Services.obs.addObserver(this,topics.APP_TAB_SHOWN,false);
Services.obs.addObserver(this,topics.SYNC_AUTH_CHANGED,false);
Services.obs.addObserver(this,topics.SYNC_COMPONENT_ENABLED,false);
Services.obs.addObserver(this,topics.SYNC_COMPONENT_READY,false);
Services.obs.addObserver(this,topics.SYNC_COMPONENT_DISABLED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_TOPHISTORY_DISABLED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_PINNED_ENABLED_STARTED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_PINNED_ENABLED_FINISHED,false);
Services.obs.addObserver(this,topics.SYNC_SERVICE_PINNED_DISABLED,false);
if (this.svc)
this._application.syncPinned.engine.addListener("data",this);
var appInfo = this._application.addonManager.info;
if (appInfo.isFreshAddonInstall || appInfo.addonUpgraded)
{
this._application.preferences.set("sync.advert",true);
if (appInfo.addonUpgraded)
{
this._application.preferences.reset("sync.showButton");
}

}

}
,
finalize: function Fastdial_finalize(doCleanup, callback) {
var topics = this._application.core.eventTopics;
Services.obs.removeObserver(this,topics.APP_TAB_SHOWN);
Services.obs.removeObserver(this,topics.SYNC_AUTH_CHANGED);
Services.obs.removeObserver(this,topics.SYNC_COMPONENT_ENABLED);
Services.obs.removeObserver(this,topics.SYNC_COMPONENT_READY);
Services.obs.removeObserver(this,topics.SYNC_COMPONENT_DISABLED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_TOPHISTORY_DISABLED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_PINNED_ENABLED_STARTED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_PINNED_ENABLED_FINISHED);
Services.obs.removeObserver(this,topics.SYNC_SERVICE_PINNED_DISABLED);
if (this.svc)
this._application.syncPinned.engine.removeListener("data",this);
this._application = null;
this._logger = null;
}
,
observe: function Fastdial_observe(aSubject, aTopic, aData) {
this._logger.trace("Event caught: " + aTopic);
switch (aTopic) {
case this._application.core.eventTopics.APP_TAB_SHOWN:
if (! this._application.preferences.get("sync.advert",true))
return;
let now = Math.round(Date.now() / 1000);
let installTime = this._application.preferences.get("general.install.time");
let daysPassedAfterInstall = Math.floor((now - installTime) / 86400);
if (daysPassedAfterInstall >= 1 && aData > 3)
{
this._application.preferences.set("sync.advert",false);
this._application.fastdial.sendRequest("sync",{
status: this.status,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
}

break;
case this._application.core.eventTopics.SYNC_AUTH_CHANGED:
try {
aData = JSON.parse(aData);
}
catch (ex) {
this._logger.error("Not a JSON string: " + strutils.formatError(ex));
this._logger.debug(ex.stack);
return;
}

if ([LOGIN_STATES.AUTH, LOGIN_STATES.NO_AUTH, LOGIN_STATES.CREDENTIALS_ERROR, LOGIN_STATES.EXPIRED].indexOf(aData.state) !== - 1)
{
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
if (aData.state === LOGIN_STATES.AUTH)
{
this._application.preferences.reset("sync.showButton");
}

}

break;
case this._application.core.eventTopics.SYNC_COMPONENT_ENABLED:
async.nextTick(function () {
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
}
,this);
break;
case this._application.core.eventTopics.SYNC_COMPONENT_READY:
this._application.syncPinned.engine.addListener("data",this);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
break;
case this._application.core.eventTopics.SYNC_COMPONENT_DISABLED:
this._application.syncPinned.engine.removeListener("data",this);
this._application.fastdial.sendRequest("sync",{
status: STATES.NO_SYNC_COMPONENT});
break;
case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED:

case this._application.core.eventTopics.SYNC_SERVICE_PINNED_ENABLED_STARTED:
this._onAnyEngineStartedLoading();
this._enabledStarted = true;
break;
case this._application.core.eventTopics.SYNC_SERVICE_PINNED_ENABLED_FINISHED:
this._onAnyEngineFinishedLoading();
this._application.syncPinned.initFinished = true;
this._application.syncPinned.processInitial();
break;
case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED:
this._onAnyEngineFinishedLoading();
this._application.syncTopHistory.initFinished = true;
this._application.thumbs.pickupThumbs();
break;
case this._application.core.eventTopics.SYNC_SERVICE_TOPHISTORY_DISABLED:

case this._application.core.eventTopics.SYNC_SERVICE_PINNED_DISABLED:
this._application.preferences.set("sync.enabled",false);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
break;
case "data":
if (this._enabledStarted)
return;
this._logger.trace("Processing data event");
try {
this._application.syncPinned.processData(aData,false);
}
catch (ex) {
this._logger.error(ex.message);
this._logger.debug(ex.stack);
}

break;
}

}
,
openWP: function Sync_openWP() {
if (! this.svc)
return;
misc.navigateBrowser({
url: this.svc.SYNC_PAGE_URL});
}
,
enableSyncVB: function Sync_enableSyncVB() {
if (! this.svc)
return;
this._application.syncPinned.engine.enabled = true;
this._application.syncTopHistory.engine.enabled = true;
}
,
get svc() {
var syncSvc = null;
try {
syncSvc = Cc["@yandex.ru/esync;1"].getService().wrappedJSObject;
}
catch (ex) {

}

return syncSvc;
}
,
get state() {
if (! this.svc)
return STATES.NO_SYNC_COMPONENT;
if (this.svc.expired)
return STATES.TOKEN_EXPIRED;
if (this.svc.authorized)
return STATES.SYNCING;
return this._application.preferences.get("sync.showButton",true) ? STATES.NOT_AUTHORIZED : STATES.NO_SYNC_COMPONENT;
}
,
get login() {
return this.state === STATES.SYNCING ? this.svc.username : null;
}
,
get showAdvert() {
if (this.state !== STATES.NOT_AUTHORIZED || ! this._application.preferences.get("sync.advert",true))
return false;
var now = Math.round(Date.now() / 1000);
var installTime = this._application.preferences.get("general.install.time");
var daysPassedAfterInstall = Math.floor((now - installTime) / 86400);
return daysPassedAfterInstall >= 1;
}
,
get showOffer() {
var bothEnginesEnabled = this.svc && this._application.syncPinned.engine.enabled && this._application.syncTopHistory.engine.enabled;
if (this.state !== STATES.SYNCING || bothEnginesEnabled)
return 0;
return Number(this._application.preferences.get("sync.offer",true));
}
,
suppressAdvert: function Sync_suppressAdvert() {
this._application.preferences.set("sync.advert",false);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: false,
offer: this.showOffer});
}
,
suppressOffer: function Sync_suppressOffer() {
this._application.preferences.set("sync.offer",false);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: false,
offer: this.showOffer});
}
,
hideBlockUI: function Sync_hideBlockUI() {
this._application.preferences.set("sync.showButton",false);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
}
,
prepareUrlForServer: function Sync_prepareUrlForServer(url) {
var uri;
try {
uri = netutils.newURI(url);
}
catch (ex) {
return url;
}

if (uri.host !== "clck.yandex.ru")
return this._application.isYandexHost(uri.host) ? this._cutFromParam(url) : url;
var clickrMatches = uri.path.match(/.+?\*(.+)/);
if (clickrMatches)
return this._cutFromParam(clickrMatches[1]);
var clckrItem = this._application.fastdial.brandingClckrDoc.querySelector("item[url='" + url + "']");
return clckrItem ? "http://" + clckrItem.getAttribute("domain") : url;
}
,
prepareUrlForSave: function Sync_prepareUrlForSave(url) {
var uri = netutils.newURI(url);
if (! this._application.isYandexHost(uri.host))
return url;
try {
uri.QueryInterface(Ci.nsIURL);
}
catch (ex) {
return url;
}

var parsedQuery = netutils.querystring.parse(uri.query);
if (parsedQuery.clid)
{
delete parsedQuery.clid;
let clidData = this._application.clids.vendorData.clid7;
if (clidData && clidData.clidAndVid)
{
parsedQuery.clid = clidData.clidAndVid;
}

uri.query = netutils.querystring.stringify(parsedQuery);
}

return uri.spec;
}
,
generateId: function Sync_generateId() {
return UUID_SVC.generateUUID().toString().substr(1,8);
}
,
_onAnyEngineStartedLoading: function Sync__onAnyEngineStartedLoading() {
if (this._application.preferences.get("sync.enabled",false))
return;
this._application.preferences.set("sync.enabled",true);
this._application.preferences.set("sync.offer",false);
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: 0});
}
,
_onAnyEngineFinishedLoading: function Sync__onAnyEngineFinishedLoading() {
this._enabledStarted = false;
this._application.fastdial.sendRequest("sync",{
status: this.state,
login: this.login,
advert: this.showAdvert,
offer: this.showOffer});
}
,
_cutFromParam: function Sync__cutFromParam(url) {
var uri = netutils.newURI(url);
var dropParamHappened = false;
try {
uri.QueryInterface(Ci.nsIURL);
let parsedQuery = netutils.querystring.parse(uri.query);
if (parsedQuery.from === this._application.core.CONFIG.APP.TYPE)
{
delete parsedQuery.from;
dropParamHappened = true;
}

uri.query = netutils.querystring.stringify(parsedQuery);
return dropParamHappened ? uri.spec : url;
}
catch (ex) {
return url;
}

}
,
_application: null,
_logger: null,
_enabledStarted: false};
