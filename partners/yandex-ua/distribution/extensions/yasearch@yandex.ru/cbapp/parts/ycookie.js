"use strict";
const EXPORTED_SYMBOLS = ["yCookie"];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const yCookie = {
init: function YCookie_init(application) {
this._application = application;
this._logger = application.getLogger("YCookie");
var cookieFieldName = application.core.CONFIG.APP.COOKIE;
var cookieFieldValue = application.addonManager.addonVersion;
this.setValue("ys",cookieFieldName,cookieFieldValue);
}
,
finalize: function YCookie_finalize(aDoCleanup) {
this._application = null;
}
,
TRUSTED_DOMAINS: [".yandex.ru", ".yandex.kz", ".yandex.ua", ".yandex.by", ".yandex.net", ".yandex.com", ".yandex.com.tr", ".ya.ru", ".moikrug.ru", ".narod.ru"],
getAnyValue: function YCookie_getAnyValue(aFieldName) {
var yCookieValue = this.getYandexCookie("ys",aFieldName);
if (yCookieValue === null)
yCookieValue = this.getYandexCookie("yp",aFieldName);
return yCookieValue;
}
,
getValue: function YCookie_getValue(aCookieName, aFieldName, aDomain) {
var yCookieValue = this._getYCookie(aCookieName,aDomain);
if (yCookieValue)
{
let reg;
switch (aCookieName) {
case "ys":
reg = new RegExp("(?:^|#)" + this._application.core.Lib.strutils.escapeRE(aFieldName) + "\\.([^#]+)");
break;
case "yp":
reg = new RegExp("(?:^|#)(?:\\d+)\\." + this._application.core.Lib.strutils.escapeRE(aFieldName) + "\\.([^#]+)");
break;
}

let match = yCookieValue.match(reg);
if (match)
return decodeURIComponent(match[1]);
}

return null;
}
,
setValue: function YCookie_setValue(aCookieName, aFieldName, aFieldValue, aFieldExpire) {
this._setYCookie(aCookieName,aFieldName,aFieldValue,aFieldExpire);
}
,
_cookieService: Cc["@mozilla.org/cookieService;1"].getService(Ci.nsICookieService),
_makeCookieURI: function YCookie__makeCookieURI(aDomain) {
var cookieURI = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIURI);
cookieURI.spec = "http://" + aDomain.replace(/^\./,"");
return cookieURI;
}
,
_getYCookie: function YCookie__getYCookie(aCookieName, aDomain) {
var domain = aDomain || ".yandex.ru";
var allCookiesStr = this._cookieService.getCookieString(this._makeCookieURI(domain),null) || "";
var cookieMatch = allCookiesStr.match("(?:^|;)\\s*" + aCookieName + "=([^;]*)");
return cookieMatch && cookieMatch[1] || null;
}
,
_setYCookie: function YCookie__setYCookie(aCookieName, aFieldName, aFieldValue, aFieldExpire) {
this.TRUSTED_DOMAINS.forEach(function (aDomain) {
this._setYCookieOnDomain(aDomain,aCookieName,aFieldName,aFieldValue,aFieldExpire);
}
,this);
}
,
_setYCookieOnDomain: function YCookie__setYCookieOnDomain(aDomain, aCookieName, aFieldName, aFieldValue, aFieldExpire) {
var yCookieValue = this._getYCookie(aCookieName,aDomain);
var newCookieValue = this._parseAndSetFieldValue(yCookieValue,aFieldName,aFieldValue,aFieldExpire);
var cookieStr = aCookieName + "=" + newCookieValue;
if (! newCookieValue.length)
cookieStr += ";expires=" + new Date(0);
if (aDomain.charAt(0) == ".")
cookieStr += ";domain=" + aDomain;
this._cookieService.setCookieString(this._makeCookieURI(aDomain),null,cookieStr,null);
}
,
_parseAndSetFieldValue: function YCookie__parseAndSetFieldValue(aCookieValue, aFieldName, aFieldValue, aFieldExpire) {
var ySubCookies = (aCookieValue || "").split("#");
var found = false;
for (let i = ySubCookies.length;i--;) {
if (ySubCookies[i].indexOf(aFieldName + ".") == 0)
{
found = true;
ySubCookies[i] = aFieldValue === null ? null : aFieldName + "." + aFieldValue;
break;
}

}

if (! found && aFieldValue)
ySubCookies.push(aFieldName + "." + aFieldValue);
return ySubCookies.filter(function (v) ! ! v).join("#");
}
};
