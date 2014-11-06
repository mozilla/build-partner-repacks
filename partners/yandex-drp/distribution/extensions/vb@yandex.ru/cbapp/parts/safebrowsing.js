"use strict";
const EXPORTED_SYMBOLS = ["safebrowsing"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const SBA_API_URL = "http://sba.yandex.net/cp?pver=4.0&client=yaffbookmarks&json=1&url=";
const OLDEST_SBA_TIME_SECONDS = 86400 * 7;
const DB_FILENAME = "fastdial.sqlite";
const IDLE_DAILY_EVENT = "idle-daily";
Cu.import("resource://gre/modules/Services.jsm");
const safebrowsing = {
    init: function Safebrowsing_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Safebrowsing");
        Services.obs.addObserver(this, IDLE_DAILY_EVENT, false);
        this._initDatabase();
    },
    finalize: function Safebrowsing_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, IDLE_DAILY_EVENT);
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
    observe: function Safebrowsing_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case IDLE_DAILY_EVENT:
            this._maintenanceDatabaseOnIdle();
            break;
        }
    },
    listUnsafeDomains: function Safebrowsing_listUnsafeDomains(callback) {
        this._database.execQueryAsync("SELECT domain FROM unsafe_domains", {}, function (rowsData, storageError) {
            if (storageError)
                return callback(storageError);
            callback(null, rowsData.map(row => row.domain));
        });
    },
    checkUnpinnedDomains: function Safebrowsing_checkUnpinnedDomains(pickupNum, topHistory) {
        let self = this;
        let domains = {};
        let totalThumbsNum = this._application.layout.getThumbsNum();
        this._application.internalStructure.iterate({ nonempty: true }, function (thumbData) {
            if (thumbData.pinned)
                return;
            let host = this._application.fastdial.getDecodedUrlHost(thumbData.source);
            if (host) {
                domains[host] = 1;
            }
        }, this);
        this._checkDomains(Object.keys(domains), function Fastdial__checkUnsafeDomains_onFinished(unsafeDomainsList) {
            if (unsafeDomainsList.length) {
                self._application.thumbs.pickupThumbs({ num: ++pickupNum });
            } else {
                self._application.frontendHelper.mute = false;
                self._application.fastdial.sendRequest("thumbChanged", self._application.frontendHelper.fullStructure);
                self._application.syncTopHistory.saveCurrentState(topHistory);
            }
        });
    },
    _checkDomains: function Safebrowsing__checkDomains(domains, callback) {
        let self = this;
        let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        xhr.mozBackgroundRequest = true;
        xhr.QueryInterface(Ci.nsIDOMEventTarget);
        let sbaURL = SBA_API_URL + domains.map(domain => encodeURIComponent(domain)).join(",");
        xhr.open("GET", sbaURL, true);
        xhr.responseType = "json";
        let onFinished = function Safebrowsing_checkDomains_onFinished() {
            callback([]);
        };
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 3000);
        xhr.addEventListener("load", function () {
            timer.cancel();
            if (!xhr.response)
                return onFinished();
            let domains = [];
            let unionParts = [];
            let i = 0;
            let placeholders = {};
            let now = Math.round(Date.now() / 1000);
            for (let domain in xhr.response) {
                if (xhr.response[domain] === "adult") {
                    unionParts.push("SELECT :domain" + i + " AS domain, :ts" + i + " AS insertTimestamp");
                    placeholders["domain" + i] = domain;
                    placeholders["ts" + i] = now;
                    domains.push(domain);
                    i += 1;
                }
            }
            if (!unionParts.length) {
                self._logger.trace("No unsafe domains found!");
                return onFinished();
            }
            self._logger.trace("Unsafe domains found: " + JSON.stringify(xhr.response));
            self._database.execQueryAsync("INSERT OR REPLACE INTO unsafe_domains (domain, insertTimestamp) " + unionParts.join(" UNION "), placeholders, function Safebrowsing_checkDomains_updateDatabase(rowsData, storageError) {
                if (storageError)
                    throw new Error(storageError);
                callback(domains);
            });
        });
        xhr.addEventListener("error", onFinished, false);
        xhr.addEventListener("abort", onFinished, false);
        xhr.send();
    },
    _maintenanceDatabaseOnIdle: function Safebrowsing__maintenanceDatabaseOnIdle() {
        this._database.execQueryAsync("DELETE FROM unsafe_domains WHERE insertTimestamp < :oldestTime", { oldestTime: Math.round(Date.now() / 1000) - OLDEST_SBA_TIME_SECONDS });
    },
    _initDatabase: function Fastdial__initDatabase() {
        let dbFile = this._application.core.rootDir;
        dbFile.append(DB_FILENAME);
        this._database = new Database(dbFile);
    },
    _database: null,
    _application: null,
    _logger: null
};
