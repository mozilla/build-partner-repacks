"use strict";
BarPlatform.FilePackage = Base.extend({
    constructor: function FilePackage(rootDir, domain) {
        if (!(rootDir instanceof Ci.nsIFile)) {
            throw new CustomErrors.EArgType("rootDir", "nsIFile", rootDir);
        }
        if (!rootDir.isDirectory()) {
            throw new CustomErrors.EArgRange("rootDir", "nsIFile(Directory)", rootDir);
        }
        this._rootDir = rootDir.clone();
        this._rootDir.normalize();
        if (domain) {
            this._domain = domain;
        } else {
            let uuid = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString();
            this._domain = uuid.replace(/[^\w\-]/g, "") + "." + barApp.name;
        }
        this._files = Object.create(null);
        this._logger = BarPlatform._getLogger("Package_" + this._domain);
        let protocolHandler = barApp.core.xbProtocol;
        protocolHandler.setDataProvider(this._domain, this);
        this._uri = protocolHandler.newURI(protocolHandler.scheme + "://" + this._domain + "/", null, null);
    },
    finalize: function FilePkg_finalize() {
        this._files = Object.create(null);
        this._rootDir = null;
        barApp.core.xbProtocol.setDataProvider(this._domain, null);
    },
    get rootDirectory() {
        return this._rootDir.clone();
    },
    getXMLDocument: function FilePkg_getXMLDocument(path, usePrivilegedParser) {
        let cacheFile = this.cache.getFile(path);
        if (cacheFile.exists()) {
            try {
                return fileutils.xmlDocFromFile(cacheFile);
            } catch (e) {
                this._logger.error("Can not get XML from cache");
                this._logger.debug(e);
            }
        }
        let channel = this.newChannelFromPath(path);
        let xmlDocument = fileutils.xmlDocFromStream(channel.open(), channel.originalURI, channel.originalURI, usePrivilegedParser);
        channel = this.newChannelFromPath(path);
        let xmlDocumentClone = fileutils.xmlDocFromStream(channel.open(), channel.originalURI, channel.originalURI, usePrivilegedParser);
        fileutils.writeTextFile(cacheFile, xmlutils.xmlSerializer.serializeToString(xmlDocumentClone).replace(/\<\?xml[^>]+\>[\r\n]*/, "").replace(/<!ENTITY((.|\n|\r)*?)["']>/g, "").replace(/<!DOCTYPE((.|\n|\r)*?)["'\]]>/g, ""));
        return xmlDocument;
    },
    resolvePath: function FilePkg_resolvePath(path, base) {
        if (typeof path != "string") {
            throw new CustomErrors.EArgType("path", "String", path);
        }
        if (base) {
            path = path.replace(/^(?!\/|\w+:)/, base.replace(/[^\/]+$/, ""));
        }
        return this._uri.resolve(path);
    },
    newChannelFromPath: function FilePkg_newChannelFromPath(path) {
        return this.newChannel(netutils.newURI(this.resolvePath(path), null, null));
    },
    getFile: function FilePkg_getFile(path) {
        let file = this.findFile(path);
        if (!file) {
            throw new Error(this._consts.ERR_FILE_NOT_FOUND + " '" + path + "'");
        }
        return file;
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get wrappedJSObject() {
        return this;
    },
    get UUID() {
        return this._domain;
    },
    newChannel: function FilePkg_newChannel(aURI) {
        let file = this.getFile(aURI.QueryInterface(Ci.nsIURL).filePath);
        let filesStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        filesStream.init(file, fileutils.MODE_RDONLY, 0, filesStream.CLOSE_ON_EOF);
        let channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
        channel.setURI(aURI);
        channel.originalURI = aURI;
        channel.contentStream = filesStream;
        channel.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return channel;
    },
    findFile: function FilePkg_findFile(path) {
        if (typeof path != "string") {
            throw new CustomErrors.EArgType("path", "String", path);
        }
        path = this._suppressRelativePathReference(path);
        path = path.replace(/#.+/, "");
        if (path in this._files) {
            return this._files[path];
        }
        let components = path.split("/");
        if (components[components.length - 1][0] == ".") {
            return this._files[path] = null;
        }
        let root = this._rootDir.clone();
        let locales = this._locales();
        let file = null;
        for (let i = locales.length; i--;) {
            let localeName = locales[i].name;
            let candidate = root.clone();
            if (localeName) {
                candidate.append("locale");
                candidate.append(localeName);
            }
            let brandedCandidate;
            let brandID = barApp.branding.brandID;
            if (brandID) {
                brandedCandidate = candidate.clone();
                brandedCandidate.append("brand");
                brandedCandidate.append(brandID);
                for (let j = 0, len = components.length; j < len; j++) {
                    brandedCandidate.append(components[j]);
                }
                if (!brandedCandidate.exists()) {
                    brandedCandidate = null;
                } else {
                    candidate = brandedCandidate;
                }
            }
            if (!brandedCandidate) {
                for (let j = 0, len = components.length; j < len; j++) {
                    candidate.append(components[j]);
                }
                if (!candidate.exists()) {
                    continue;
                }
            }
            try {
                candidate.normalize();
                if (candidate.isReadable() && this._rootDir.contains(candidate, true)) {
                    file = candidate;
                    break;
                }
            } catch (e) {
                this._logger.error("Error while searching file. " + strutils.formatError(e));
                continue;
            }
        }
        return this._files[path] = file;
    },
    get cache() {
        let filePackage = this;
        const getCacheDir = function () {
            let dir = filePackage.rootDirectory;
            dir.append(".cache");
            return dir;
        };
        return {
            purge: function () {
                fileutils.removeFileSafe(getCacheDir());
            },
            getFile: function (filePath) {
                let file = getCacheDir();
                file.append(barApp.branding.brandID);
                file.append(barApp.locale.language);
                fileutils.forceDirectories(file);
                file.append(misc.crypto.createHash("md5").update(filePath).digest("hex"));
                return file;
            }
        };
    },
    _consts: {
        ERR_FILE_NOT_FOUND: "File not found",
        ERR_ACCESS_DENIED: "Attempt to access a file outside the package directory"
    },
    _rootDir: null,
    _files: null,
    _logRoot: undefined,
    _name: undefined,
    _logger: null,
    _locales: function FilePkg__locales() {
        if (this._localesCache) {
            return this._localesCache;
        }
        const weights = {
            language: 32,
            root: 16,
            ru: 8,
            en: 4,
            country: 2,
            region: 1
        };
        let locales = [];
        locales.push({
            name: "",
            weight: weights.root,
            components: null
        });
        let localeDir = this._rootDir.clone();
        localeDir.append("locale");
        if (!localeDir.exists()) {
            return this._localesCache = locales;
        }
        let appLocale = misc.parseLocale(barApp.localeString);
        let entries = localeDir.directoryEntries;
        while (entries.hasMoreElements()) {
            let file = entries.getNext().QueryInterface(Ci.nsIFile);
            if (file.isDirectory()) {
                let name = file.leafName;
                let components = misc.parseLocale(name);
                if (!components) {
                    continue;
                }
                let weight = 0;
                for (let space in weights) {
                    let component = components[space];
                    if (component === undefined) {
                        continue;
                    }
                    if (space == "language") {
                        if (component in weights) {
                            weight += weights[component];
                        }
                    }
                    if (component === appLocale[space]) {
                        weight += weights[space];
                    }
                }
                locales.push({
                    name: name,
                    weight: weight,
                    components: components
                });
            }
        }
        locales.sort(function FilePkg__locales_sort(a, b) {
            return a.weight - b.weight;
        });
        return this._localesCache = locales;
    },
    _suppressRelativePathReference: function FilePkg__suppressRelativePathReference(path) {
        let re = [
            /\/\//g,
            /\/\.\//g,
            /\/[^\/]+\/\.\.\//g,
            /\/\.\.\//g
        ];
        for (let i = 0, len = re.length; i < len; i++) {
            while (re[i].test(path)) {
                path = path.replace(re[i], "/");
            }
        }
        return path;
    }
});
BarPlatform.ComponentPackage = BarPlatform.FilePackage.extend({
    constructor: function ComponentPackage(rootDirectory, id, domain) {
        this.base(rootDirectory, domain);
        if (typeof id != "string") {
            throw new CustomErrors.EArgType("id", "String", id);
        }
        this._id = id;
        this._settings = Object.create(null);
        this._units = Object.create(null);
    },
    finalize: function ComponentPackage_finalize() {
        for (let unitName in this._units) {
            try {
                this._units[unitName].finalize();
            } catch (e) {
                this._logger.error("Couldn't clear loaded unit " + unitName + ". " + strutils.formatError(e));
            }
        }
        this._units = null;
        this._settings = null;
        this.base();
    },
    get id() {
        return this._id;
    },
    getUnit: function ComponentPackage_getUnit(unitName) {
        let unit = this._units[unitName];
        if (!unit) {
            let unitFile = this.getFile(unitName + ".xml");
            unit = new BarPlatform.Unit(unitFile.leafName, this, unitName);
            this._units[unitName] = unit;
        }
        return unit;
    },
    addSettingUser: function ComponentPackage_addSettingUser(settingName, componentID) {
        let users = this._settings[settingName] || (this._settings[settingName] = []);
        if (users.indexOf(componentID) === -1) {
            users.push(componentID);
        }
    },
    removeSettingUser: function ComponentPackage_removeSettingUser(settingName, componentID) {
        if (!(settingName in this._settings)) {
            return;
        }
        let users = this._settings[settingName];
        let userIndex = users.indexOf(componentID);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
        }
    },
    getSettingUsers: function ComponentPackage_getSettingUsers(settingName) {
        let users = this._settings[settingName];
        return users ? users.slice(0) : [];
    },
    _id: undefined,
    _domain: undefined,
    _uri: null,
    _units: null
});
