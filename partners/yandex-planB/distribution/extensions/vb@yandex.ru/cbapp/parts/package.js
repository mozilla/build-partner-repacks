"use strict";
const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils, Cr = Components.results, EXPORTED_SYMBOLS = ["FilePackage"], GLOBAL = this;
let app = null;
function FilePackage(rootDir, domain) {
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
        this._domain = uuid.replace(/[^\w\-]/g, "") + "." + app.name;
    }
    this._files = { __proto__: null };
    this._logger = app.getLogger("Package_" + this._domain);
    let protocolHandler = app.core.protocol;
    protocolHandler.addDataProvider(this);
    this._uri = protocolHandler.newURI(protocolHandler.scheme + "://" + this._domain + "/", null, null);
}
;
FilePackage.init = function FilePackage_init(application) {
    app = application;
    app.core.Lib.sysutils.copyProperties(app.core.Lib, GLOBAL);
};
FilePackage.prototype = {
    finalize: function FilePkg_finalize() {
        this._files = { __proto__: null };
        this._rootDir = null;
        app.core.protocol.removeDataProvider(this);
    },
    get rootDirectory() {
        return this._rootDir.clone();
    },
    getXMLDocument: function FilePkg_getXMLDocument(path, usePrivilegedParser) {
        let channel = this.newChannelFromPath(path);
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
        let file = this.findFile(path);
        if (!file)
            throw new Error(this._consts.ERR_FILE_NOT_FOUND + " \"" + path + "\"");
        return file;
    },
    get UUID() {
        return this._domain;
    },
    newChannel: function FilePkg_newChannel(aURI, isSimpleURI) {
        if (isSimpleURI || aURI.host != this._domain)
            return null;
        let file = this.getFile(aURI.path);
        let filesStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        filesStream.init(file, fileutils.MODE_RDONLY, 0, filesStream.CLOSE_ON_EOF);
        let channel = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel).QueryInterface(Ci.nsIChannel);
        channel.setURI(aURI);
        channel.originalURI = aURI;
        channel.contentStream = filesStream;
        channel.owner = this._chromeChannelPrincipal;
        return channel;
    },
    findFile: function FilePkg_findFile(path) {
        if (typeof path != "string")
            throw new CustomErrors.EArgType("path", "String", path);
        path = this._suppressRelativePathReference(path);
        path = path.replace(/#.+/, "");
        if (path in this._files)
            return this._files[path];
        let components = path.split("/");
        if (components[components.length - 1][0] == ".")
            return this._files[path] = null;
        let root = this._rootDir.clone();
        let locales = this._locales();
        let file = null;
        for (let i = locales.length; i--;) {
            let localeName = locales[i].name;
            let candidate = root.clone();
            if (localeName != "") {
                candidate.append("locale");
                candidate.append(localeName);
            }
            for (let j = 0, len = components.length; j < len; j++)
                candidate.append(components[j]);
            if (!candidate.exists())
                continue;
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
    _consts: {
        ERR_FILE_NOT_FOUND: "File not found",
        ERR_ACCESS_DENIED: "Attempt to access a file outside the package directory"
    },
    _rootDir: null,
    _files: null,
    _logRoot: undefined,
    _name: undefined,
    _logger: null,
    get _chromeChannelPrincipal() {
        let chromeChannel = netutils.ioService.newChannel("chrome://" + app.name + "/content/", null, null);
        let systemPrincipal = chromeChannel.owner;
        chromeChannel.cancel(Components.results.NS_BINDING_ABORTED);
        this.__defineGetter__("_chromeChannelPrincipal", () => systemPrincipal);
        return this._chromeChannelPrincipal;
    },
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
        let locales = [];
        locales.push({
            name: "",
            weight: weights.root,
            components: null
        });
        let localeDir = this._rootDir.clone();
        localeDir.append("locale");
        if (!localeDir.exists())
            return this._localesCache = locales;
        let appLocale = misc.parseLocale(app.localeString);
        let entries = localeDir.directoryEntries;
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
        locales.sort((a, b) => a.weight - b.weight);
        return this._localesCache = locales;
    },
    _suppressRelativePathReference: function FilePkg__suppressRelativePathReference(path) {
        let re = [
            /\/\//g,
            /\/\.\//g,
            /\/[^\/]+\/\.\.\//g,
            /\/\.\.\//g
        ];
        for (let i = 0, len = re.length; i < len; i++)
            while (re[i].test(path))
                path = path.replace(re[i], "/");
        return path;
    }
};
