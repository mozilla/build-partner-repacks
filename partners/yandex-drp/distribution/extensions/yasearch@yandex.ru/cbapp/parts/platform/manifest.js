"use strict";
BarPlatform.PackageManifest = function XBPackageManifest(srcURL, XMLDocOrFile, isTrusted) {
    if (typeof srcURL != "string") {
        throw new CustomErrors.EArgType("srcURL", "String", srcURL);
    }
    this._packageID = srcURL;
    this._baseURI = Services.io.newURI(this._packageID, null, null);
    this._files = [];
    if (XMLDocOrFile instanceof Ci.nsIFile) {
        this._loadFromFile(XMLDocOrFile, isTrusted);
    } else if (XMLDocOrFile instanceof Ci.nsIDOMDocument) {
        this._loadFromDocument(XMLDocOrFile, isTrusted);
    } else {
        throw new CustomErrors.EArgType("XMLDocOrFile", "nsIDOMDocument | nsIFile", XMLDocOrFile);
    }
};
BarPlatform.PackageManifest.EPacManifestSyntax = function EPacManifestSyntax(elementName) {
    CustomErrors.ECustom.apply(this, null);
    this._elementName = elementName.toString();
};
BarPlatform.PackageManifest.EPacManifestSyntax.prototype = {
    __proto__: CustomErrors.ECustom.prototype,
    constructor: BarPlatform.PackageManifest.EPacManifestSyntax,
    _message: "Package manifest parse error",
    _elementName: undefined,
    get _details() {
        return [this._elementName];
    }
};
BarPlatform.PackageManifest.prototype = {
    constructor: BarPlatform.PackageManifest,
    get packageID() {
        return this._packageID;
    },
    get id() {
        return this._packageID;
    },
    get packagesInfo() {
        return this._files.map(packageInfo => sysutils.copyObj(packageInfo));
    },
    _packageID: undefined,
    _files: null,
    _loadFromFile: function XBPkgMan__loadFromFile(file, isTrusted) {
        this._loadFromDocument(fileutils.xmlDocFromFile(file), isTrusted);
    },
    _loadFromDocument: function XBPkgMan__loadFromDocument(document, isTrusted) {
        let root = document.documentElement;
        if (root.localName !== "manifest") {
            throw new BarPlatform.PackageManifest.EPacManifestSyntax(root.nodeName);
        }
        let children = root.childNodes;
        for (let i = 0, length = children.length; i < length; i++) {
            let childElement = children[i];
            switch (childElement.localName) {
            case "package":
                let versionMin = parseInt(childElement.getAttribute("platform-min"), 10);
                if (versionMin < 1) {
                    throw new BarPlatform.PackageManifest.EPacManifestSyntax(childElement.nodeName);
                }
                let packageVersion = childElement.getAttribute("version") || "1.0";
                let fileURL = childElement.getAttribute("url");
                if (!fileURL) {
                    throw new BarPlatform.PackageManifest.EPacManifestSyntax(childElement.nodeName);
                }
                let packageInfo = {
                    id: this._packageID,
                    uri: this._packageID,
                    version: packageVersion,
                    fileURL: this._baseURI ? netutils.resolveRelativeURL(fileURL, this._baseURI) : fileURL,
                    platformMin: versionMin,
                    browser: childElement.getAttribute("browser") || undefined,
                    architecture: childElement.getAttribute("architecture") || undefined,
                    os: childElement.getAttribute("os") || undefined
                };
                this._files.push(packageInfo);
                break;
            }
        }
    }
};
