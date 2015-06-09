"use strict";
const EXPORTED_SYMBOLS = ["blacklist"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const SERVER_URL = "http://download.cdn.yandex.net/bar/vb/bl.xml";
const SYNC_INTERVAL_SEC = 86400;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const blacklist = {
    init: function Blacklist_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Blacklist");
        this._blacklist = [];
        this._application.alarms.restoreOrCreate("syncBlacklist", {
            isInterval: true,
            timeout: 60 * 24,
            triggerIfCreated: true,
            handler: this._syncServerXML.bind(this)
        });
        this.loadData();
    },
    finalize: function Blacklist_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    loadData: function Blacklist_loadData(data) {
        this._blacklist = data || [];
    },
    saveData: function Blacklist_saveData(save, options = {}) {
        save(this._blacklist, options);
    },
    getBlacklist: function Blacklist_getBlacklist() {
        return this._blacklist;
    },
    getAll: function Blacklist_getAll(callback) {
        let serverFile = this._serverFile;
        let output = {
            domains: [],
            regexps: []
        };
        let itemNodeProcess = function Blacklist_getAll_itemNodeProcess(item) {
            let domain = item.getAttribute("domain");
            let regexp = item.getAttribute("url_regex");
            if (domain) {
                output.domains.push(domain);
            } else if (regexp) {
                output.regexps.push(regexp);
            }
        };
        Array.forEach(this._brandingDoc.querySelectorAll("list > item"), itemNodeProcess);
        if (serverFile.exists() && serverFile.isFile() && serverFile.isReadable()) {
            try {
                let serverXML = fileutils.xmlDocFromFile(serverFile);
                Array.forEach(serverXML.querySelectorAll("list > item"), itemNodeProcess);
            } catch (ex) {
                this._logger.error("Error while reading synced XML: " + strutils.formatError(ex));
                this._logger.debug(ex.stack);
            }
        }
        output.domains = output.domains.concat(this._blacklist);
        callback(null, output);
    },
    upsertDomain: function Blacklist_upsertDomain(domain) {
        this._blacklist.push(domain);
        this.saveData();
    },
    deleteDomain: function Blacklist_deleteDomain(domain) {
        this._blacklist = this._blacklist.filter(host => {
            if (host === domain) {
                return false;
            }
            return true;
        });
        this.saveData();
    },
    get _brandingDoc() {
        delete this._brandingDoc;
        this._brandingDoc = this._application.branding.brandPackage.getXMLDocument("fastdial/blacklist.xml");
        return this._brandingDoc;
    },
    get _serverFile() {
        let file = this._application.directories.appRootDir;
        file.append("blacklist.xml");
        return file;
    },
    _syncServerXML: function Blacklist__syncServerXML() {
        let self = this;
        this._logger.debug("Sync blacklist data");
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.QueryInterface(Ci.nsIDOMEventTarget);
        request.open("GET", SERVER_URL, true);
        let lastModified = this._application.preferences.get("blacklist.lastModified");
        if (lastModified) {
            request.setRequestHeader("If-Modified-Since", lastModified);
        }
        let timer = new sysutils.Timer(request.abort.bind(request), 5000);
        request.addEventListener("load", function () {
            timer.cancel();
            if (request.status === 304) {
                self._logger.debug("XML file on server has not yet changed, status = 304");
                return;
            }
            if (!request.responseXML || request.responseXML.documentElement.nodeName !== "list") {
                self._logger.error("Not valid XML: " + request.responseText.substr(0, 1000));
                return;
            }
            try {
                let serializedXML = xmlutils.serializeXML(request.responseXML);
                fileutils.writeTextFile(self._serverFile, serializedXML);
                self._logger.debug("XML is valid, saved into filesystem");
                let lastModified = request.getResponseHeader("last-modified");
                if (lastModified) {
                    self._application.preferences.set("blacklist.lastModified", lastModified);
                }
            } catch (ex) {
                self._logger.error("Error while writing synced XML: " + strutils.formatError(ex));
                self._logger.debug(ex.stack);
            }
        });
        request.send();
    },
    _application: null,
    _logger: null
};
