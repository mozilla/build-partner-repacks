"use strict";
const EXPORTED_SYMBOLS = ["addonFS"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const PERMS_FILE = parseInt("0644", 8);
const PERMS_DIRECTORY = parseInt("0755", 8);
const PERMS_OWNER_FULL = parseInt("0700", 8);
const addonFS = {
    init: function AddonFS_init(application) {
        this._logger = application.getLogger("AddonFS");
        this._CHROME_APP_PATH = "chrome://" + application.name + "/";
        this._EXTENSION_PATH_FILE = application.core.extensionPathFile;
    },
    getChannel: function AddonFS_getChannel(path) {
        return Services.io.newChannelFromURI(this._convertPathToURI(path));
    },
    getStream: function AddonFS_getStream(path) {
        return this.getChannel(path).open();
    },
    copySource: function AddonFS_copySource(aSource, aDestination, aNewName, aPermissions) {
        if (!(aDestination instanceof Ci.nsIFile)) {
            throw new TypeError("nsIFile required");
        }
        let destination = aDestination.clone();
        let sourceURI = this._convertPathToURI(aSource);
        if (sourceURI.schemeIs("chrome")) {
            sourceURI = this._CHROME_REGISTRY_SERVICE.convertChromeURL(sourceURI);
        }
        switch (sourceURI.scheme) {
        case "jar": {
                let jarURI = sourceURI.QueryInterface(Ci.nsIJARURI);
                let entryPath = jarURI.JAREntry;
                this._logger.debug("JAR entry requested: " + entryPath);
                if (!entryPath) {
                    break;
                }
                let archiveFile = jarURI.JARFile.QueryInterface(Ci.nsIFileURL).file;
                let zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
                zipReader.open(archiveFile);
                try {
                    if (!zipReader.hasEntry(entryPath)) {
                        entryPath = entryPath.replace(/(\/?)$/, "/");
                    }
                    if (!zipReader.hasEntry(entryPath)) {
                        throw new Error("No JAR entry for " + aSource);
                    }
                    let getTargetFile = function (aTargetPath) {
                        let targetFile = destination.clone();
                        aTargetPath.replace(entryPath, "").split("/").forEach(aPart => targetFile.append(aPart));
                        return targetFile;
                    };
                    let zipEntry = zipReader.getEntry(entryPath);
                    if (!zipEntry.isDirectory) {
                        let targetPath = entryPath + "/" + (aNewName || entryPath.split("/").pop());
                        let targetFile = getTargetFile(targetPath);
                        if (!targetFile.exists()) {
                            targetFile.create(Ci.nsIFile.FILE_TYPE, PERMS_FILE);
                        }
                        zipReader.extract(entryPath, targetFile);
                        targetFile.permissions = aPermissions || PERMS_FILE;
                        return;
                    }
                    destination.append(aNewName || jarEntry.split("/").slice(-2, -1)[0] || "");
                    let entries = zipReader.findEntries(entryPath + "*");
                    while (entries.hasMore()) {
                        let entryPath = entries.getNext();
                        let targetFile = getTargetFile(entryPath);
                        if (!targetFile.exists()) {
                            targetFile.create(Ci.nsIFile.DIRECTORY_TYPE, aPermissions || PERMS_DIRECTORY);
                        } else if (targetFile.isDirectory()) {
                            continue;
                        }
                        zipReader.extract(entryPath, targetFile);
                        targetFile.permissions = zipReader.getEntry(entryPath).isDirectory ? PERMS_DIRECTORY : PERMS_FILE;
                    }
                } finally {
                    zipReader.close();
                }
                break;
            }
        case "file": {
                let protocolHandler = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
                let file = protocolHandler.getFileFromURLSpec(sourceURI.spec);
                if (file instanceof Ci.nsIFile) {
                    file.copyTo(destination, aNewName || "");
                    file.permissions = aPermissions || (file.isDirectory() ? PERMS_DIRECTORY : PERMS_FILE);
                }
                break;
            }
        default:
            throw new Error("Copying from '" + sourceURI.scheme + "' scheme is not implemented");
        }
    },
    _CHROME_APP_PATH: undefined,
    _EXTENSION_PATH_FILE: undefined,
    _CHROME_REGISTRY_SERVICE: Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry),
    _convertPathToURI: function AddonFS__convertPathToURI(aPath) {
        if (!(typeof aPath == "string")) {
            throw new TypeError("String required");
        }
        let path = aPath.replace(/^\$(content|locale|skin)\//, this._CHROME_APP_PATH + "$1/").replace(/^\$chrome\//, this._CHROME_APP_PATH);
        if (path.indexOf("chrome://") == 0) {
            return Services.io.newURI(path, null, null);
        }
        let file = this._EXTENSION_PATH_FILE.clone();
        aPath.split("/").forEach(part => file.append(part));
        return Services.io.newFileURI(file);
    }
};
