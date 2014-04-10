"use strict";
BarPlatform.FilePackage = Base.extend({
    constructor: function FilePackage(rootDir, domain) {
        if (!(rootDir instanceof Ci.nsIFile))
            throw new CustomErrors.EArgType("rootDir", "nsIFile", rootDir);
        if (!rootDir.isDirectory())
            throw new CustomErrors.EArgRange("rootDir", "nsIFile(Directory)", rootDir);
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
        var protocolHandler = barApp.core.xbProtocol;
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
        var channel = this.newChannelFromPath(path);
        return fileutils.xmlDocFromStream(channel.open(), channel.originalURI, channel.originalURI, usePrivilegedParser);
    },
    resolvePath: function FilePkg_resolvePath(path, base) {
        if (typeof path != "string")
            throw new CustomErrors.EArgType("path", "String", path);
        if (base)
            path = path.replace(/^(?!\/|\w+:)/, base.replace(/[^\/]+$/, ""));
        return this._uri.resolve(path);
    },
    newChannelFromPath: function FilePkg_newChannelFromPath(path) {
        return this.newChannel(netutils.newURI(this.resolvePath(path), null, null));
    },
    getFile: function FilePkg_getFile(path) {
        var file = this.findFile(path);
        if (!file)
            throw new Error(this._consts.ERR_FILE_NOT_FOUND + " \"" + path + "\"");
        return file;
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get wrappedJSObject() this,
    get UUID() this._domain,
    newChannel: function FilePkg_newChannel(aURI) {
        var file = this.getFile(aURI.QueryInterface(Ci.nsIURL).filePath);
        var filesStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        filesStream.init(file, fileutils.MODE_RDONLY, 0, filesStream.CLOSE_ON_EOF);
        var channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
        channel.setURI(aURI);
        channel.originalURI = aURI;
        channel.contentStream = filesStream;
        channel.owner = sysutils.scriptSecurityManager.getSystemPrincipal();
        return channel;
    },
    findFile: function FilePkg_findFile(path) {
        if (typeof path != "string")
            throw new CustomErrors.EArgType("path", "String", path);
        path = this._suppressRelativePathReference(path);
        path = path.replace(/#.+/, "");
        if (path in this._files)
            return this._files[path];
        var components = path.split("/");
        if (components[components.length - 1][0] == ".")
            return this._files[path] = null;
        var root = this._rootDir.clone();
        var locales = this._locales();
        var file = null;
        let (i = locales.length) {
            for (; i--;) {
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
                    let (j = 0, len = components.length) {
                        for (; j < len; j++)
                            brandedCandidate.append(components[j]);
                    }
                    if (!brandedCandidate.exists())
                        brandedCandidate = null;
                    else
                        candidate = brandedCandidate;
                }
                if (!brandedCandidate) {
                    let (j = 0, len = components.length) {
                        for (; j < len; j++)
                            candidate.append(components[j]);
                    }
                    if (!candidate.exists())
                        continue;
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
        }
        return this._files[path] = file;
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
        if (this._localesCache)
            return this._localesCache;
        const weights = {
                language: 32,
                root: 16,
                ru: 8,
                en: 4,
                country: 2,
                region: 1
            };
        var locales = [];
        locales.push({
            name: "",
            weight: weights.root,
            components: null
        });
        var localeDir = this._rootDir.clone();
        localeDir.append("locale");
        if (!localeDir.exists())
            return this._localesCache = locales;
        var appLocale = misc.parseLocale(barApp.localeString);
        var entries = localeDir.directoryEntries;
        while (entries.hasMoreElements()) {
            let file = entries.getNext().QueryInterface(Ci.nsIFile);
            if (file.isDirectory()) {
                let name = file.leafName;
                let components = misc.parseLocale(name);
                if (!components)
                    continue;
                let weight = 0;
                for (let space in weights) {
                    let component = components[space];
                    if (component === undefined)
                        continue;
                    if (space == "language")
                        if (component in weights)
                            weight += weights[component];
                    if (component === appLocale[space])
                        weight += weights[space];
                }
                locales.push({
                    name: name,
                    weight: weight,
                    components: components
                });
            }
        }
        locales.sort(function FilePkg__locales_sort(a, b) a.weight - b.weight);
        return this._localesCache = locales;
    },
    _suppressRelativePathReference: function FilePkg__suppressRelativePathReference(path) {
        var re = [
                /\/\//g,
                /\/\.\//g,
                /\/[^\/]+\/\.\.\//g,
                /\/\.\.\//g
            ];
        let (i = 0, len = re.length) {
            for (; i < len; i++)
                while (re[i].test(path))
                    path = path.replace(re[i], "/");
        }
        return path;
    }
});
BarPlatform.ComponentPackage = BarPlatform.FilePackage.extend({
    constructor: function ComponentPackage(rootDirectory, id, domain) {
        this.base(rootDirectory, domain);
        if (typeof id != "string")
            throw new CustomErrors.EArgType("id", "String", id);
        this._id = id;
        this._settings = {};
        this._units = {};
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
    get id() this._id,
    getUnit: function ComponentPackage_getUnit(unitName) {
        var unit = this._units[unitName];
        if (!unit) {
            let unitFile = this.getFile(unitName + ".xml");
            unit = new BarPlatform.Unit(unitFile.leafName, this, unitName);
            this._units[unitName] = unit;
        }
        return unit;
    },
    addSettingUser: function ComponentPackage_addSettingUser(settingName, componentID) {
        var users = this._settings[settingName] || (this._settings[settingName] = []);
        if (users.indexOf(componentID) === -1)
            users.push(componentID);
    },
    removeSettingUser: function ComponentPackage_removeSettingUser(settingName, componentID) {
        if (!settingName in this._settings)
            return;
        var users = this._settings[settingName];
        var userIndex = users.indexOf(componentID);
        if (userIndex !== -1)
            users.splice(userIndex, 1);
    },
    getSettingUsers: function ComponentPackage_getSettingUsers(settingName) {
        var users = this._settings[settingName];
        return users ? users.slice(0) : [];
    },
    _id: undefined,
    _domain: undefined,
    _uri: null,
    _units: null
});
