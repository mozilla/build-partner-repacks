"use strict";
BarPlatform.PackageManifest = function XBPackageManifest(srcURL, XMLDocOrFile, isTrusted) {
if (typeof srcURL != "string")
throw new CustomErrors.EArgType("srcURL", "String", srcURL);
this._packageID = srcURL;
this._baseURI = this._ioService.newURI(this._packageID,null,null);
this._files = [];
if (XMLDocOrFile instanceof Ci.nsIFile)
this._loadFromFile(XMLDocOrFile,isTrusted); else
if (XMLDocOrFile instanceof Ci.nsIDOMDocument)
this._loadFromDocument(XMLDocOrFile,isTrusted); else
throw new CustomErrors.EArgType("XMLDocOrFile", "nsIDOMDocument | nsIFile", XMLDocOrFile);
}
;
BarPlatform.PackageManifest.EPacManifestSyntax = CustomErrors.ECustom.extend({
$name: "EPacManifestSyntax",
constructor: function EPacManifestSyntax(elementName) {
this.base("Package manifest parse error");
this._elementName = elementName.toString();
}
,
get _details() {
return [this._elementName];
}
,
_elementName: undefined});
BarPlatform.PackageManifest.prototype = {
constructor: BarPlatform.PackageManifest,
get packageID() {
return this._packageID;
}
,
_ioService: Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
get id() {
return this._packageID;
}
,
get permissions() {
return this._permissions;
}
,
get packagesInfo() {
var result = [];
for each(let packageInfo in this._files) {
packageInfo = sysutils.copyObj(packageInfo);
packageInfo.permissions = this._permissions;
result.push(packageInfo);
}

return result;
}
,
_packageID: undefined,
_files: null,
_permissions: null,
_loadFromFile: function XBPkgMan__loadFromFile(file, isTrusted) {
this._loadFromDocument(fileutils.xmlDocFromFile(file),isTrusted);
}
,
_loadFromDocument: function XBPkgMan__loadFromDocument(document, isTrusted) {
var root = document.documentElement;
if (root.localName !== "manifest")
throw new BarPlatform.PackageManifest.EPacManifestSyntax(root.nodeName);
var Permissions = BarPlatform[isTrusted ? "TrustedPackagePermissions" : "Permissions"];
var children = root.childNodes;
for (let i = 0, length = children.length;i < length;i++) {
let childElement = children[i];
switch (childElement.localName) {
case "package":
let versionMin = parseInt(childElement.getAttribute("platform-min"),10);
if (! (versionMin > 0))
throw new BarPlatform.PackageManifest.EPacManifestSyntax(childElement.nodeName);
let packageVersion = childElement.getAttribute("version") || "1.0";
let fileURL = childElement.getAttribute("url");
if (! fileURL)
throw new BarPlatform.PackageManifest.EPacManifestSyntax(childElement.nodeName);
let packageInfo = {
id: this._packageID,
uri: this._packageID,
version: packageVersion,
fileURL: this._baseURI ? netutils.resolveRelativeURL(fileURL,this._baseURI) : fileURL,
platformMin: versionMin,
browser: childElement.getAttribute("browser") || undefined,
architecture: childElement.getAttribute("architecture") || undefined,
os: childElement.getAttribute("os") || undefined};
this._files.push(packageInfo);
break;
case "permissions":
this._permissions = new Permissions.fromElement(childElement);
break;
}

}

if (! this._permissions)
{
if (isTrusted)
this._permissions = new BarPlatform.FullPermissions.fromNull(); else
throw new BarPlatform.PackageManifest.EPacManifestSyntax("permissions");
}

}
};
