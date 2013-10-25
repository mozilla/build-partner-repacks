"use strict";
const EXPORTED_SYMBOLS = ["searchSuggest"];
const GLOBAL = this;
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
if ("nsIPrivateBrowsingChannel" in Ci)
XPCOMUtils.defineLazyModuleGetter(this,"PrivateBrowsingUtils","resource://gre/modules/PrivateBrowsingUtils.jsm"); else
this.PrivateBrowsingUtils = null;
const searchSuggest = {
SUGGEST_TIMEOUT: 5000,
init: function searchSuggest_init(application) {
this._application = application;
this._logger = application.getLogger("searchSuggest");
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
}
,
finalize: function searchSuggest_finalize() {
searchEngines.finalize();
this._application = null;
this._logger = null;
}
,
searchWeb: function searchSuggest_searchWeb(queryString, callback) {
var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
request.mozBackgroundRequest = true;
request.open("GET",this._makeURLForQuery(queryString),true);
request.setRequestHeader("Cache-Control","no-cache");
var listenerCallback = function listenerCallback(data) callback(data || JSON.stringify([queryString, []]));
var timer = new this._application.core.Lib.sysutils.Timer(function abortOnTimeout() request.abort(), this.SUGGEST_TIMEOUT);
var listener = new searchRequestListener(request, timer, listenerCallback);
if (PrivateBrowsingUtils && request.channel instanceof Ci.nsIPrivateBrowsingChannel)
{
let topBrowserWindow = Services.wm.getMostRecentWindow("navigator:browser");
if (topBrowserWindow)
request.channel.setPrivate(PrivateBrowsingUtils.isWindowPrivate(topBrowserWindow));
}

request.send(null);
}
,
searchLocalHistory: function searchSuggest_searchLocalHistory(searchQuery, callback) {
var query = PlacesUtils.history.getNewQuery();
query.searchTerms = searchQuery;
var options = PlacesUtils.history.getNewQueryOptions();
options.resultType = options.RESULT_TYPE_URI;
options.queryType = Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY;
options.sortingMode = options.SORT_BY_DATE_DESCENDING;
var result = PlacesUtils.history.executeQuery(query,options);
result.root.containerOpen = true;
var output = [];
var i = 0;
while (i < result.root.childCount && output.length < 10) {
let node = result.root.getChild(i);
if (/^(https?|ftp):\/\//.test(node.uri))
{
output.push([node.uri, node.title || node.uri]);
}

i += 1;
}

result.root.containerOpen = false;
callback(searchQuery,output);
}
,
useExample: function searchSuggest_useExample(query) {
var gURLBar = misc.getTopBrowserWindow().gURLBar;
var currentPos = 0;
var self = this;
if (this._useExampleTimer)
this._useExampleTimer.cancel();
gURLBar.focus();
gURLBar.inputField.value = "";
this._useExampleTimer = new sysutils.Timer(function () {
gURLBar.inputField.value += query.substr(currentPos,1);
currentPos += 1;
if (currentPos === query.length)
{
try {
gURLBar.mController.startSearch(gURLBar.inputField.value);
}
catch (e) {
self._logger.error(e.message);
}

}

}
, 25, true, query.length);
}
,
suppressTutorial: function searchSuggest_suppressTutorial() {
this._application.preferences.set("ftabs.searchStatus",3);
this._application.fastdial.requestInit();
}
,
get isFormVisible() {
return [0, 2].indexOf(this._application.preferences.get("ftabs.searchStatus")) !== - 1;
}
,
get alternativeEngines() searchEngines.list,
_makeURLForQuery: function searchSuggest__makeURLForQuery(queryString) {
return this._application.branding.expandBrandTemplatesEscape(this._brandingSuggestURL,{
"searchTerms": queryString});
}
,
get _brandingSuggestURL() {
delete this._brandingSuggestURL;
return this._brandingSuggestURL = this._application.fastdial.brandingXMLDoc.querySelector("search").getAttribute("suggest");
}
,
_application: null,
_logger: null,
_useExampleTimer: null};
function searchRequestListener(request, timer, callback) {
this._request = request;
this._callback = callback;
this._timer = timer;
request.QueryInterface(Ci.nsIDOMEventTarget);
this._addEventListeners();
}

searchRequestListener.prototype = {
_finalize: function searchRequestListener__finalize() {
this._request = null;
this._callback = null;
this._timer = null;
}
,
_addEventListeners: function searchRequestListener__addEventListeners() {
this._request.addEventListener("error",this,false);
this._request.addEventListener("abort",this,false);
this._request.addEventListener("load",this,false);
}
,
_removeEventListeners: function searchRequestListener__removeEventListeners() {
this._request.removeEventListener("error",this,false);
this._request.removeEventListener("abort",this,false);
this._request.removeEventListener("load",this,false);
}
,
handleEvent: function searchRequestListener_handleEvent(event) {
this._removeEventListeners();
this._timer.cancel();
var data = event.type === "load" ? this._request.responseText : "";
this._callback(data);
this._finalize();
}
};
const searchEngines = {
finalize: function searchEngines_finalize() {
if (this._browserEnginesObserverAdded)
Services.obs.removeObserver(this,"browser-search-engine-modified");
}
,
get list() {
if (! this._cachedList)
this._cachedList = this._createEnginesList();
return [].concat(this._cachedList);
}
,
observe: function searchEngines_observe(subject, topic, data) {
if (topic === "browser-search-engine-modified")
this._cachedList = null;
}
,
_createEnginesList: function searchEngines__createEnginesList() {
var getEngineSubmissionURL = function getEngineSubmissionURL(engine) {
var engineSubmission = engine.getSubmission("NevermindQueryString","text/html");
return engineSubmission && engineSubmission.uri.spec && engineSubmission.uri.spec.replace("NevermindQueryString","{searchTerms}") || null;
}
;
if (! this._browserEnginesObserverAdded)
{
Services.obs.addObserver(this,"browser-search-engine-modified",false);
this._browserEnginesObserverAdded = true;
}

return Services.search.getVisibleEngines({
}).map(function (engine) {
return {
title: engine.name,
url: getEngineSubmissionURL(engine)};
}
).filter(function (engine) engine.url && ! /^https?:\/\/yandex\.[a-z.]+\/yandsearch/.test(engine.url));
}
,
_browserEnginesObserverAdded: false,
_cachedList: null};
