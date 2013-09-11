"use strict";
BarPlatform.BlackList = new function BlackList_prototype() {
var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
var versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
var logger = BarPlatform._getLogger("black-list");
(this.fromNull = function BarPlatform_BlackList__fromNull() {
this.reasons = this.reasons || {
};
this.masks = this.masks || [];
this.packages = this.packages || {
};
}
).prototype = this;
(this.fromJSON = function BarPlatform_BlackList__fromJSON(aJSON) {
this.fromNull();
if (! aJSON)
return this;
if (typeof aJSON === "string")
aJSON = JSON.parse(aJSON);
if (aJSON.reasons)
{
for each(let [id, locales] in Iterator(aJSON.reasons)) {
if (! this.reasons[id])
this.reasons[id] = {
};
for each(let [lang, text] in Iterator(locales)) {
this.reasons[id][lang] = text;
}

}

}

if (aJSON.masks)
{
for each(let rule in aJSON.masks) {
this.masks.push({
reason: this.aReason(rule.reason),
domain: this.aDomainMask(rule.domain),
path: this.aPath(rule.path),
regexp: this.aRegExp(rule.regexp)});
}

}

if (aJSON.packages)
{
for each(let [id, rule] in Iterator(aJSON.packages)) {
let versions = ! rule.versions && [] || rule.versions.map(function (range) {
var reason = this.aReason(range.reason || rule.reason);
return new function () {
this.reason = reason;
this.from = range.from;
this.to = range.to;
}
();
}
,this);
let reason = this.aReason(rule.reason);
this.packages[id] = new function () {
this.reason = reason;
this.versions = versions;
}
();
}

}

return this;
}
).prototype = this;
(this.fromDoc = function BarPlatform_BlackList__fromDoc(aDoc) {
this.fromElement(aDoc.documentElement);
}
).prototype = this;
(this.fromElement = function BarPlatform_BlackList__fromElement(node) {
this.fromNull();
this.parseNode(node,new function () {
this.reasons = function (node) {
this.parseNode(node,new function () {
this.code = function (node) {
var id = node.getAttribute("id");
var lang = node.getAttribute("lang");
var text = node.textContent;
var locales = this.reasons[id];
if (! locales)
locales = this.reasons[id] = {
};
locales[lang] = text;
}
;
}
());
}
;
this.bans = function (node) {
this.parseNode(node,new function () {
this.url = function (node) {
var reason = this.aReason(node.getAttribute("reason"));
var domain = this.aDomainMask(node.getAttribute("domain"));
var path = node.getAttribute("path");
this.masks.push({
reason: reason,
domain: domain,
path: path});
}
;
this.regexp = function (node) {
var reason = this.aReason(node.getAttribute("reason"));
var regexp = node.getAttribute("mask");
this.masks.push({
reason: reason,
regexp: regexp});
}
;
this.mask = function (node) {
var reason = this.aReason(node.getAttribute("reason"));
var domain = this.aDomainMask(node.getAttribute("domain"));
var path = node.getAttribute("path");
var regexp = node.getAttribute("regexp");
this.masks.push({
reason: reason,
domain: domain,
path: path,
regexp: regexp});
}
;
this.package = function (node) {
var rule = {
};
var id = node.getAttribute("id");
rule.reason = this.aReason(node.getAttribute("reason"));
var versions = rule.versions = [];
this.parseNode(node,new function () {
this.version = function (node) {
var from = node.getAttribute("from");
var to = node.getAttribute("to");
var reason = this.aReason(node.getAttribute("reason") || rule.reason);
versions.push({
reason: reason,
from: from,
to: to});
}
;
}
());
this.packages[id] = rule;
}
;
}
());
}
;
}
());
return this;
}
).prototype = this;
this.banReasonForURI = function BarPlatform_BlackList__banReasonForURI(uri) {
var domain = this.getDomainSuffixForURI(uri);
var path = this.getPathForURI(uri);
for each(let rule in this.masks) {
if (rule.domain && ! this.aDomainMaskRE(rule.domain).test(domain))
continue;
if (rule.path && path.indexOf(rule.path) !== 0)
continue;
if (rule.regexp && ! this.aRegExp(rule.regexp).test(uri))
continue;
return rule.reason;
}

return 0;
}
;
this.banReasonForPackage = function BarPlatform_BlackList__banReasonForPackage({id: url, version: version}) {
var reason = this.banReasonForURI(url);
if (reason > 0)
return reason;
var rule = this.packages[url];
if (! rule)
return 0;
if (! rule.versions.length)
return this.aReason(rule.reason);
var reason = 0;
for each(let range in rule.versions) {
if (range.from && versionComparator.compare(version,range.from) < 0)
continue;
if (range.to && versionComparator.compare(version,range.to) >= 0)
continue;
reason = this.aReason(range.reason || rule.reason);
}

return reason;
}
;
this.localesForReason = function BarPlatform_BlackList__localesForReason(id) {
return this.reasons[id];
}
;
this.messageForReasonByLocale = function BarPlatform_BlackList__localesForReason(id, locale) {
if (! id)
return "";
var strings = this.localesForReason(id);
if (strings)
{
return misc.findBestLocalizedValue(strings,locale);
}
 else
{
let bundle = new barApp.appStrings.StringBundle("package-management/package-management.properties");
return bundle.get("ban.reason.default");
}

}
;
this.parseNode = function BarPlatform_BlackList__parseNode(node, map) {
map["#text"] = map["#text"] || function () {

}
;
map["#comment"] = map["#comment"] || function () {

}
;
var child = node.firstChild;
while (child) {
let name = child.nodeName;
if (name)
{
if (map.hasOwnProperty(name))
{
map[name].call(this,child);
}
 else
{
logger.warn("Unexpected element [" + name + "] in <" + node.nodeName + "/>");
}

}

child = child.nextSibling;
}

}
;
this.getDomainSuffixForURI = function BarPlatform_BlackList__getDomainSuffixForURI(uri) {
return "." + parseURI(uri).host;
}
;
this.getPathForURI = function BarPlatform_BlackList__getPathForURI(uri) {
return this.aPath(parseURI(uri).path);
}
;
this.toString = function BarPlatform_BlackList__toString() {
return "BarPlatform.BlackList" + JSON.stringify(this);
}
;
var parseURI = function BarPlatform_BlackList__parseURI(uri) {
return ioService.newURI(uri,null,null);
}
;
function Cached(func) {
var cache = {
};
return function Cached__instance(domainMask) {
var key = "cache:" + domainMask;
if (key in cache)
return cache[key];
return cache[key] = func.apply(this,arguments);
}
;
}

this.aReason = function BarPlatform_BlackList__aReason(reason) {
return Number(reason) || 1;
}
;
this.aPath = Cached(function BarPlatform_BlackList__aPath(path) {
return String(path || "").replace(/^\/*/,"/").replace(/^(.*?)\/*$/,"$1/");
}
);
this.aRegExp = Cached(function BarPlatform_BlackList__aRegExp(regexp) {
return regexp && RegExp(regexp);
}
);
this.aDomainMask = function BarPlatform_BlackList__aDomainMask(domainMask) {
domainMask = String(domainMask || "");
domainMask = domainMask.replace(/^[^\w]*/,"");
if (/^\w+$/.test(domainMask))
throw new Error("Wrong domain for ban in black-list (" + domainMask + ")");
if (domainMask)
domainMask = "." + domainMask;
return domainMask;
}
;
var escapeREChars = RegExp("[" + "^({[\\.?+*]})$".replace(/./g,"\\$&") + "]","g");
this.aDomainMaskRE = Cached(function BarPlatform_Permissions__aDomainMaskRE(domainMask) {
if (typeof domainMask === "string")
{
domainMask = this.aDomainMask(domainMask);
domainMask = domainMask.replace(escapeREChars,"\\$&") + "$";
}

return RegExp(domainMask,"i");
}
);
sysutils.freezeObj(this);
}
();
