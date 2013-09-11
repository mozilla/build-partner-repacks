"use strict";
const EXPORTED_SYMBOLS = ["favicons"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const GLOBAL = this;
const FAVICON_URL = "http://favicon.yandex.net/favicon/";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL,"FAVICON_SRV","@mozilla.org/browser/favicon-service;1","nsIFaviconService");
XPCOMUtils.defineLazyServiceGetter(GLOBAL,"@mozilla.org/browser/livemark-service;2","mozIAsyncLivemarks" in Ci ? "mozIAsyncLivemarks" : "nsILivemarkService");
const favicons = {
init: function Favicons_init(application) {
application.core.Lib.sysutils.copyProperties(application.core.Lib,GLOBAL);
XPCOMUtils.defineLazyModuleGetter(GLOBAL,"DataURI","resource://" + application.name + "-mod/DataURI.jsm");
this._application = application;
this._logger = application.getLogger("Favicons");
}
,
finalize: function Favicons_finalize(doCleanup, callback) {
this._application = null;
this._logger = null;
}
,
requestFaviconForURL: function Favicons_requestFaviconForURL(uri, callback) {
if (! uri.asciiHost)
return callback(null);
var bFFversionIsUnder14 = sysutils.platformInfo.browser.version.isLessThan(14);
var faviconData;
if (bFFversionIsUnder14)
{
try {
faviconData = FAVICON_SRV.getFaviconDataAsDataURL(uri);
if (faviconData)
{
return callback(faviconData);
}

}
catch (e) {

}

if (! faviconData)
{
faviconData = /\.yandex\-team\.ru$/.test(uri.asciiHost) ? "http://" + uri.asciiHost + "/favicon.ico" : FAVICON_URL + uri.asciiHost;
}

this._application.colors.requestImageDominantColor(faviconData,function (err, color) {
if (err || color === null)
return callback();
callback(faviconData,color);
}
);
}
 else
{
let self = this;
FAVICON_SRV.getFaviconDataForPage(uri,function Favicons_requestFaviconForURL_onDataGot(aURI, aDataLen, aData, aMimeType) {
if (aURI)
{
faviconData = ! aURI.schemeIs("chrome") && aDataLen > 0 ? (new DataURI({
contentType: aMimeType,
base64: true}, aData)).toString() : aURI.spec;
}
 else
{
faviconData = /\.yandex\-team\.ru$/.test(uri.asciiHost) ? "http://" + uri.asciiHost + "/favicon.ico" : FAVICON_URL + uri.asciiHost;
}

self._application.colors.requestImageDominantColor(faviconData,function (err, color) {
if (err || color === null)
return callback();
callback(faviconData,color);
}
);
}
);
}

}
,
_application: null,
_logger: null};
