"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = {
    browser: {
        styles: ["/styles/ts/browser.css"],
        urlBarItems: { button: 10200 }
    }
};
const WIDGET_ID = "http://bar.yandex.ru/packages/yandexbar#typosquatting";
const core = {
    init: function Typosquatting_init(api) {
        this._api = api;
        this._logger = api.logger;
        filtersManager.init();
        this._loadModules();
        this.communicator.enableComponent(this);
    },
    finalize: function Typosquatting_finalize() {
        filtersManager.finalize();
        this._api = null;
        this._stringBundle = null;
        this.communicator.disableComponent(this);
        this.communicator = null;
    },
    initURLBarItem: function Typosquatting_initURLBarItem(itemElement, itemClass) {
        return new TyposquattingURLBarItem(itemElement, itemClass, this);
    },
    promiseCheckURL: function Typosquatting_promiseCheckURL(url) {
        return filtersManager.worker.promiseCheckURL(url);
    },
    get stringBundle() {
        return this._stringBundle || (this._stringBundle = this._api.Localization.createStringBundle("links/links.properties"));
    },
    _MODULES: { communicator: "communicator.js" },
    _loadModules: function Typosquatting__loadModules() {
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this._api.Package.resolvePath("/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function")
                module.init(this._api);
        }
    },
    goodRedirect: function Typosquatting_goodRedirect(data) {
        this.communicator.communicate(WIDGET_ID, "good-redirect", data);
    },
    isTabBad: function Typosquatting_isTabBad(aTab, aCallback, aCounter) {
        if (!(aCallback && aTab)) {
            return;
        }
        if (!aCounter) {
            aCounter = 0;
        }
        let windowListener = this._api.Browser.getWindowListener(aTab.ownerDocument.defaultView);
        let tabData = windowListener.getTabData(aTab, WIDGET_ID);
        if (!tabData.status || tabData.status == this.checkStatus.verifying) {
            if (aCounter++ < 20) {
                let timer = new this._api.SysUtils.Timer(this.isTabBad.bind(this, aTab, aCallback, aCounter), 50);
            } else {
                aCallback(false);
            }
            return;
        }
        if (tabData.status == this.checkStatus.verified) {
            aCallback(true);
            return;
        }
        aCallback(false);
    },
    get WIDGET_ID() WIDGET_ID,
    get API() this._api,
    get logger() this._logger,
    get yaUrl() {
        return this.stringBundle.get("yandex.url");
    },
    get checkStatus() {
        return {
            verifying: "verifying",
            verified: "verified",
            failed: "failed"
        };
    },
    _api: null
};
function TyposquattingURLBarItem(itemElement, itemClass, module) {
    this.itemElement = itemElement;
    itemElement.module = module;
    itemElement.setAttribute("yb-native-widget-name", WIDGET_ID);
}
TyposquattingURLBarItem.prototype = {
    itemElement: null,
    finalize: function TyposquattingURLBarItem_finalize() {
        if (typeof this.itemElement.wdgtxDestructor == "function") {
            this.itemElement.wdgtxDestructor();
        }
        this.itemElement.module = null;
        this.itemElement = null;
    }
};
const filtersManager = {
    UPDATE_INTERVAL_PREF_NAME: "updateInterval",
    LAST_UPDATE_TIME_PREF_NAME: "lastUpdate",
    JSON_LAST_MODIFIED_PREF_NAME: "jsonLastModified",
    JSON_FILE_NAME: "regexplist.json",
    init: function filtersManager_init() {
        let url = core.API.Package.resolvePath("/scripts/regexpValidation.js");
        let loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
        loader.loadSubScript(url, this);
        try {
            let json = core.API.Files.jsonFromFile(this.regexpFile);
            if (!this._validateJSON(json)) {
                core.logger.debug("Regexp list is not valid.");
            } else {
                this.worker.setFilters(json);
            }
        } catch (e) {
            core.logger.debug("filtersManager init: jsonFromFile failed");
        }
        this._setUpdateTimer();
    },
    finalize: function filtersManager_finalize() {
        if (this._updateTimer) {
            this._updateTimer.cancel();
            this._updateTimer = null;
        }
        this.worker = null;
    },
    get regexpFile() {
        if (!this._cachedFile) {
            let widgetFile = core.API.Files.getWidgetStorage(true);
            widgetFile.append(this.JSON_FILE_NAME);
            if (!widgetFile.exists()) {
                widgetFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0644", 8));
            }
            this._cachedFile = widgetFile;
        }
        return this._cachedFile;
    },
    get _jsonLastModified() {
        return core.API.Settings.getValue(this.JSON_LAST_MODIFIED_PREF_NAME);
    },
    set _jsonLastModified(tagString) {
        core.API.Settings.setValue(this.JSON_LAST_MODIFIED_PREF_NAME, tagString);
    },
    _update: function filtersManager__update() {
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.onreadystatechange = function () {
            if (request.readyState !== 4) {
                return;
            }
            let responseStatus = request.status;
            if (responseStatus >= 200 && responseStatus < 300 && request.responseText) {
                let newLastModified = "";
                try {
                    newLastModified = request.getResponseHeader("Last-Modified") || "";
                } catch (e) {
                }
                if (!newLastModified || newLastModified !== this._jsonLastModified) {
                    if (this._updateCallback(request))
                        this._jsonLastModified = newLastModified;
                }
            } else if (responseStatus !== 304) {
                core.logger.trace("XMLHTTPRequest failed to get new json.");
            }
            core.API.Settings.setValue(this.LAST_UPDATE_TIME_PREF_NAME, String(Date.now()));
            this._setUpdateTimer();
        }.bind(this);
        let url = core.stringBundle.get("server.url");
        request.open("GET", url);
        let previousLastModified = this._jsonLastModified;
        if (previousLastModified)
            request.setRequestHeader("If-Modified-Since", previousLastModified);
        request.send();
    },
    _updateCallback: function filtersManager__updateCallback(request) {
        try {
            let json = JSON.parse(request.responseText);
            if (this._validateJSON(json)) {
                let widgetFile = this.regexpFile;
                core.API.Files.jsonToFile(json, widgetFile);
                this.worker.setFilters(json);
                return true;
            } else {
                core.logger.debug("JSON from server is not valid.");
            }
        } catch (e) {
            core.logger.debug("Parsing json response from the server failed.\n" + e);
        }
        return false;
    },
    _validateJSON: function filtersManager__validateJSON(json) {
        return this.validateRegexpList(json);
    },
    _setUpdateTimer: function filtersManager__setUpdateTimer(delay) {
        if (typeof delay == "undefined") {
            const MINIMUM_DELAY_MS = 5000;
            let updateInterval = core.API.Settings.getValue(this.UPDATE_INTERVAL_PREF_NAME) * 1000;
            let lastUpdate = parseInt(core.API.Settings.getValue(this.LAST_UPDATE_TIME_PREF_NAME), 10);
            delay = updateInterval - Math.abs(lastUpdate - Date.now());
            delay = Math.max(delay, MINIMUM_DELAY_MS);
        }
        if (this._updateTimer)
            this._updateTimer.cancel();
        this._updateTimer = new core.API.SysUtils.Timer(this._update.bind(this), delay);
    },
    get worker() {
        if (!this._worker) {
            let url = core.API.Package.resolvePath("/scripts/filtersWorker.js");
            let mozWorker = new Worker(url);
            let listener = function listener(event) {
                let {name, data} = event.data;
                if (name !== "checkURL")
                    throw new Error("Unexpected name ('" + name + "')");
                let url = data.url;
                if (!(url in promises))
                    return;
                promises[url].forEach(function (promise) {
                    try {
                        promise.resolve(data);
                    } catch (ex) {
                        Cu.reportError(ex);
                    }
                });
                delete promises[url];
            };
            mozWorker.addEventListener("message", listener, false);
            let promises = Object.create(null);
            this._worker = {
                setFilters: function worker_setFilters(filters) {
                    mozWorker.postMessage({
                        name: "setFilters",
                        data: filters
                    });
                },
                promiseCheckURL: function worker_promiseCheckURL(url) {
                    let deferred = core.API.Promise.defer();
                    if (url) {
                        let promisesForURL = promises[url] || (promises[url] = []);
                        promisesForURL.push(deferred);
                        if (promisesForURL.length === 1) {
                            mozWorker.postMessage({
                                name: "checkURL",
                                data: url
                            });
                        }
                    } else {
                        deferred.resolve({
                            url: url,
                            block: null,
                            redirectURL: null
                        });
                    }
                    return deferred.promise;
                },
                terminate: function worker_terminate() {
                    mozWorker.removeEventListener("message", listener, false);
                    mozWorker.terminate();
                    mozWorker = null;
                    promises = null;
                }
            };
        }
        return this._worker;
    },
    set worker(val) {
        if (val !== null)
            throw new Error("Trying to set not null value as worker.");
        if (!this._worker)
            return;
        this._worker.terminate();
        this._worker = null;
    },
    _worker: null,
    _updateTimer: null,
    _cachedFile: null
};
