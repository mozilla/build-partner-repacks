"use strict";
const EXPORTED_SYMBOLS = ["searchExample"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const REQUEST_TIMEOUT = 5000;
const UPDATE_API_INTERVAL = 86400;
const UPDATE_API_ERROR_INTERVAL = 3600;
const UPDATE_LOCAL_INTERVAL = 3600;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PrivateBrowsingUtils", "resource://gre/modules/PrivateBrowsingUtils.jsm");
const searchExample = {
    init: function searchExample_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("SearchExample");
    },
    finalize: function searchExample_finalize() {
        if (this._timerLocal) {
            this._timerLocal.cancel();
        }
        if (this._timerRequest) {
            this._timerRequest.cancel();
        }
        this._application = null;
        this._logger = null;
    },
    get current() {
        let prefValue = this._application.preferences.get("search.example", "");
        try {
            prefValue = JSON.parse(prefValue);
        } catch (ex) {
            return "";
        }
        return typeof prefValue === "object" && Array.isArray(prefValue.examples) && prefValue.examples[prefValue.index] ? prefValue.examples[prefValue.index] : "";
    },
    set current(val) {
        this._application.preferences.set("search.example", JSON.stringify(val));
    },
    _requestAPIData: function searchExample__requestAPIData(callback) {
        let self = this;
        let requestURL;
        try {
            let exampleDomain = this._application.fastdial.brandingXMLDoc.querySelector("search").getAttribute("example_domain");
            requestURL = exampleDomain + "/search-samples?lang=" + this._application.locale.language;
        } catch (ex) {
            this._logger.error("Can't get domain for search examples: " + strutils.formatError(ex));
            this._logger.debug(ex.stack);
            callback("error");
            return;
        }
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        try {
            request.open("GET", requestURL, true);
        } catch (ex) {
            this._logger.error("Can't get domain for search examples: " + strutils.formatError(ex));
            this._logger.debug(ex.stack);
            callback("error");
            return;
        }
        request.responseType = "json";
        let timer = new sysutils.Timer(function abortOnTimeout() {
            request.abort();
        }, REQUEST_TIMEOUT);
        if (PrivateBrowsingUtils && request.channel instanceof Ci.nsIPrivateBrowsingChannel) {
            let topBrowserWindow = Services.wm.getMostRecentWindow("navigator:browser");
            if (topBrowserWindow) {
                request.channel.setPrivate(PrivateBrowsingUtils.isWindowPrivate(topBrowserWindow));
            }
        }
        request.onload = function () {
            timer.cancel();
            if (!request.response || !request.response.data || !request.response.data.length) {
                return callback("error");
            }
            let examples = request.response.data.map(el => el.text);
            let weights = {};
            request.response.data.forEach(function (el) {
                weights[el.text] = el.weight;
            });
            examples.sort((a, b) => weights[a] - weights[b]);
            callback(null, examples);
        };
        request.onerror = request.onabort = callback;
        request.send();
    },
    _updateAPI: function searchExample__updateAPI() {
        this._requestAPIData(function (err, examples) {
            let now = Math.round(Date.now() / 1000);
            this._application.preferences.set("search.example.lastRequestTime", now);
            if (err) {
                this._timerRequest.cancel();
                this._timerRequest = new sysutils.Timer(this._updateAPI.bind(this), UPDATE_API_ERROR_INTERVAL * 1000, UPDATE_API_INTERVAL * 1000);
                return;
            }
            this.current = {
                examples: examples,
                index: 0
            };
        }.bind(this));
    },
    _updateLocal: function searchExample__updateLocal() {
        let now = Math.round(Date.now() / 1000);
        this._application.preferences.set("search.example.lastUpdateTime", now);
        let prefValue = this._application.preferences.get("search.example", "");
        try {
            prefValue = JSON.parse(prefValue);
        } catch (ex) {
            return;
        }
        if (typeof prefValue !== "object" || !Array.isArray(prefValue.examples) && !prefValue.examples.length) {
            return;
        }
        let newIndex = prefValue.index + 1;
        if (!prefValue.examples[newIndex]) {
            newIndex = 0;
        }
        prefValue.index = newIndex;
        this.current = prefValue;
    },
    _application: null,
    _logger: null,
    _timerLocal: null,
    _timerRequest: null
};
