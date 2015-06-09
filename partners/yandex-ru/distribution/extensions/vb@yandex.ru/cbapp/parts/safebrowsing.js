"use strict";
const EXPORTED_SYMBOLS = ["safebrowsing"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
const SBA_API_URL = "https://sba.yandex.net/cp?pver=4.0&client=yaffbookmarks&json=1&url=";
const OLDEST_SBA_TIME_SECONDS = 86400 * 7;
const IDLE_DAILY_EVENT = "idle-daily";
Cu.import("resource://gre/modules/Services.jsm");
const safebrowsing = {
    init: function Safebrowsing_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Safebrowsing");
        this._unsafe = [];
        Services.obs.addObserver(this, IDLE_DAILY_EVENT, false);
        this.loadData();
    },
    loadData: function Safebrowsing_loadData(unsafe) {
        this._unsafe = unsafe || [];
    },
    saveData: function Safebrowsing_saveData(save, options = {}) {
        save(this._unsafe, options);
    },
    finalize: function Safebrowsing_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, IDLE_DAILY_EVENT);
        this._application = null;
        this._logger = null;
    },
    observe: function Safebrowsing_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case IDLE_DAILY_EVENT:
            this._removeOldEntries();
            break;
        }
    },
    listUnsafeDomains: function Safebrowsing_listUnsafeDomains(callback) {
        callback(null, this._unsafe.map(site => site.host));
    },
    checkUnpinnedDomains: function Safebrowsing_checkUnpinnedDomains(pickupNum, topHistory) {
        let self = this;
        let hosts = Object.create(null);
        let totalThumbsNum = this._application.internalStructure.length;
        this._application.internalStructure.iterate({ pinned: false }, function (thumb) {
            hosts[thumb.host] = true;
        }, this);
        this._checkDomains(Object.keys(hosts), function Fastdial__checkUnsafeDomains_onFinished(unsafeDomainsList) {
            if (unsafeDomainsList.length) {
                self._application.pickup.run({ num: ++pickupNum });
            } else {
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
        let onFinished = function Safebrowsing_checkDomains_onFinished(hosts = []) {
            callback(hosts);
        };
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 3000);
        xhr.addEventListener("load", () => {
            timer.cancel();
            if (!xhr.response) {
                onFinished();
                return;
            }
            let domains = [];
            let now = Math.round(Date.now() / 1000);
            let unsafeHosts = [];
            for (let host in xhr.response) {
                if (xhr.response[host] !== "adult") {
                    continue;
                }
                unsafeHosts.push(host);
                let alreadySaved = this._unsafe.some(site => site.host === host);
                if (!alreadySaved) {
                    this._unsafe.push({
                        host: host,
                        insertTimestamp: now
                    });
                }
            }
            onFinished(unsafeHosts);
            if (unsafeHosts.length > 0) {
                this.saveData();
            }
        });
        xhr.addEventListener("error", onFinished, false);
        xhr.addEventListener("abort", onFinished, false);
        xhr.send();
    },
    _removeOldEntries: function Safebrowsing__removeOldEntries() {
        let oldestTime = Math.round(Date.now() / 1000) - OLDEST_SBA_TIME_SECONDS;
        this._unsafe = this._unsafe.filter(site => site.insertTimestamp >= oldestTime);
        this.saveData();
    },
    _application: null,
    _logger: null
};
