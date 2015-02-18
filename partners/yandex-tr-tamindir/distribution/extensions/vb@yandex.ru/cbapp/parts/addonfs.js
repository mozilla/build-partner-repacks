"use strict";
const EXPORTED_SYMBOLS = ["addonFS"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const PERMS_FILE = parseInt("0644", 8);
const PERMS_DIRECTORY = parseInt("0755", 8);
const PERMS_OWNER_FULL = parseInt("0700", 8);
const addonFS = {
    init: function AddonFS_init(application) {
        this._logger = application.getLogger("AddonFS");
        this._CHROME_APP_PATH = "chrome://" + application.name + "/";
        this._EXTENSION_URI = application.core.extensionURI;
    },
    finalize: function AddonFS_finalize() {
        this._zipReader = null;
        this._logger = null;
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
                let zipReader = this._zipReader;
                if (!zipReader.hasEntry(entryPath) && !/\/$/.test(entryPath)) {
                    entryPath += "/";
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
                destination.append(aNewName || entryPath.split("/").slice(-2, -1)[0] || "");
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
    getEntry: function AddonFS_getEntry(path) {
        let sourceURI = this._convertPathToURI(path);
        if (sourceURI.schemeIs("chrome")) {
            sourceURI = this._CHROME_REGISTRY_SERVICE.convertChromeURL(sourceURI);
        }
        let entry;
        switch (sourceURI.scheme) {
        case "jar": {
                let zipReader = this._zipReader;
                sourceURI.QueryInterface(Ci.nsIJARURI);
                let entryPath = sourceURI.JAREntry;
                if (!zipReader.hasEntry(entryPath) && !/\/$/.test(entryPath)) {
                    entryPath += "/";
                }
                let zipEntry;
                if (zipReader.hasEntry(entryPath)) {
                    zipEntry = zipReader.getEntry(entryPath);
                }
                let entryWrapper = function entryWrapper(zipEntry, zipEntryPath) {
                    return {
                        get leafName() {
                            return zipEntryPath.replace(/\/$/, "").split("/").pop();
                        },
                        exists: function entryWrapper_exists() {
                            return Boolean(zipEntry);
                        },
                        isDirectory: function entryWrapper_isDirectory() {
                            if (!this.exists()) {
                                throw new Error("Entry is not exists");
                            }
                            return zipEntry.isDirectory;
                        },
                        isFile: function entryWrapper_isFile() {
                            return !this.isDirectory();
                        },
                        get directoryEntries() {
                            if (!this.isDirectory()) {
                                throw new Error("Entry is not a directory");
                            }
                            let entries = zipReader.findEntries(entryPath + "[^/]*");
                            let directoryEntries = [];
                            while (entries.hasMore()) {
                                let subEntryPath = entries.getNext();
                                let relativePath = subEntryPath.slice(entryPath.length);
                                if (relativePath.split("/").length > 2) {
                                    continue;
                                }
                                directoryEntries.push(subEntryPath);
                            }
                            let currentIndex = -1;
                            let directoryEntriesEnumerator = {
                                hasMoreElements: function () {
                                    return Boolean(directoryEntries[currentIndex + 1]);
                                },
                                getNext: function () {
                                    if (!this.hasMoreElements()) {
                                        throw Cr.NS_ERROR_FAILURE;
                                    }
                                    let subEntryPath = directoryEntries[++currentIndex];
                                    let zipSubEntry = zipReader.getEntry(subEntryPath);
                                    return entryWrapper(zipSubEntry, subEntryPath);
                                }
                            };
                            return directoryEntriesEnumerator;
                        },
                        getChannel: function entryWrapper_getChannel() {
                            if (!this.isFile()) {
                                throw new Error("Can not get channel. Entry is not a file.");
                            }
                            return addonFS.getChannel(zipEntryPath);
                        },
                        getStream: function entryWrapper_getStream() {
                            return this.getChannel().open();
                        }
                    };
                };
                entry = entryWrapper(zipEntry, entryPath);
                break;
            }
        case "file": {
                let entryWrapper = function entryWrapper(file, fileURL) {
                    return {
                        get leafName() {
                            return file.leafName;
                        },
                        exists: function entryWrapper_exists() {
                            return file.exists();
                        },
                        isDirectory: function entryWrapper_isDirectory() {
                            return file.isDirectory();
                        },
                        isFile: function entryWrapper_isFile() {
                            return file.isFile();
                        },
                        get directoryEntries() {
                            if (!this.isDirectory()) {
                                throw new Error("Entry is not a directory");
                            }
                            let directoryEntries = file.directoryEntries;
                            let directoryEntriesEnumerator = {
                                hasMoreElements: function () {
                                    return directoryEntries.hasMoreElements();
                                },
                                getNext: function () {
                                    let file = directoryEntries.getNext();
                                    file.QueryInterface(Ci.nsIFile);
                                    return entryWrapper(file, fileURL + file.leafName);
                                }
                            };
                            return directoryEntriesEnumerator;
                        },
                        getChannel: function entryWrapper_getChannel() {
                            if (!this.isFile()) {
                                throw new Error("Can not get channel. Entry is not a file.");
                            }
                            return addonFS.getChannel(fileURL);
                        },
                        getStream: function entryWrapper_getStream() {
                            return this.getChannel().open();
                        }
                    };
                };
                let protocolHandler = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
                entry = entryWrapper(protocolHandler.getFileFromURLSpec(sourceURI.spec), sourceURI.spec);
                break;
            }
        default:
            throw new Error("Copying from '" + sourceURI.scheme + "' scheme is not implemented");
        }
        return entry;
    },
    _CHROME_APP_PATH: undefined,
    _EXTENSION_URI: undefined,
    _CHROME_REGISTRY_SERVICE: Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry),
    __zipReader: null,
    get _zipReader() {
        if (!this.__zipReader) {
            let sourceURI = this._convertPathToURI("/");
            if (sourceURI.schemeIs("chrome")) {
                sourceURI = this._CHROME_REGISTRY_SERVICE.convertChromeURL(sourceURI);
            }
            let jarURI = sourceURI.QueryInterface(Ci.nsIJARURI);
            let archiveFile = jarURI.JARFile.QueryInterface(Ci.nsIFileURL).file;
            this.__zipReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
            this.__zipReader.open(archiveFile);
        }
        return this.__zipReader;
    },
    set _zipReader(value) {
        if (value !== null) {
            throw new TypeError("Value must be null.");
        }
        if (this.__zipReader) {
            this.__zipReader.close();
            this.__zipReader = null;
        }
    },
    _convertPathToURI: function AddonFS__convertPathToURI(aPath) {
        if (typeof aPath !== "string") {
            throw new TypeError("String required");
        }
        let path = aPath.replace(/^\$(content|locale|skin)\//, this._CHROME_APP_PATH + "$1/").replace(/^\$chrome\//, this._CHROME_APP_PATH);
        if (path.indexOf("chrome://") === 0) {
            return Services.io.newURI(path, null, null);
        }
        return Services.io.newURI(this._EXTENSION_URI.resolve(path), null, null);
    }
};
