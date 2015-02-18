"use strict";
const EXPORTED_SYMBOLS = ["blacklist"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const SERVER_URL = "http://download.cdn.yandex.net/bar/vb/bl.xml";
const SYNC_INTERVAL_SEC = 86400;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const blacklist = {
    init: function Blacklist_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Blacklist");
        this._initDatabase();
        this._application.alarms.restoreOrCreate("syncBlacklist", {
            isInterval: true,
            timeout: 60 * 24,
            triggerIfCreated: true,
            handler: this._syncServerXML.bind(this)
        });
    },
    finalize: function Blacklist_finalize(doCleanup, callback) {
        if (this._timer && this._timer.isRunning) {
            this._timer.cancel();
        }
        let dbClosedCallback = function Backup_finalize_dbClosedCallback() {
            this._database = null;
            this._application = null;
            this._logger = null;
            callback();
        }.bind(this);
        if (this._database) {
            this._database.close(dbClosedCallback);
            return true;
        }
        dbClosedCallback();
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
        this._database.executeQueryAsync({
            query: "SELECT domain FROM blacklist",
            columns: ["domain"],
            callback: function (rowsData, storageError) {
                if (storageError) {
                    let errorMsg = strutils.formatString("DB error while fetching blacklist: %1 (code %2)", [
                        storageError.message,
                        storageError.result
                    ]);
                    throw new Error(errorMsg);
                }
                rowsData.forEach(function (row) {
                    output.domains.push(row.domain);
                });
                callback(null, output);
            }
        });
    },
    upsertDomain: function Blacklist_upsertDomain(domain, callback) {
        this._database.executeQueryAsync({
            query: "INSERT OR REPLACE INTO blacklist (domain) VALUES (:domain)",
            parameters: { domain: domain },
            callback: function (rowsData, storageError) {
                if (storageError) {
                    let errorMsg = strutils.formatString("DB error while upserting item into blacklist: %1 (code %2)", [
                        storageError.message,
                        storageError.result
                    ]);
                    throw new Error(errorMsg);
                }
                if (callback) {
                    callback();
                }
            }
        });
    },
    deleteDomain: function Blacklist_deleteDomain(domain, callback) {
        this._database.executeQueryAsync({
            query: "DELETE FROM blacklist WHERE domain = :domain",
            parameters: { domain: domain },
            callback: function (rowsData, storageError) {
                if (storageError) {
                    let errorMsg = strutils.formatString("DB error while deleting item from blacklist: %1 (code %2)", [
                        storageError.message,
                        storageError.result
                    ]);
                    throw new Error(errorMsg);
                }
                if (callback) {
                    callback();
                }
            }
        });
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
    _initDatabase: function Blacklist__initDatabase() {
        let dbFile = this._application.core.rootDir;
        dbFile.append(DB_FILENAME);
        this._database = new Database(dbFile);
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
    _logger: null,
    _timer: null
};
