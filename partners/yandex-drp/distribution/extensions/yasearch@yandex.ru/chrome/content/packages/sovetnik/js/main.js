"use strict";
const EXPORTED_SYMBOLS = ["core"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:sovetnik:event";
const core = {
    init: function (api) {
        this._api = api;
        if (this._disableIfSpecialVendor()) {
            return;
        }
        this._loadFrameScript();
    },
    finalize: function () {
        this._removeFrameScript();
        localStore.finalize();
        this._api = null;
    },
    get API() {
        return this._api;
    },
    _disableIfSpecialVendor: function () {
        if (this._api.Settings.getValue("specialVendorChecked") === true) {
            return false;
        }
        this._api.Settings.setValue("specialVendorChecked", true);
        let blockedClids = [
            "140462",
            "1820934",
            "1945599",
            "1989703",
            "1945584",
            "1945584",
            "1989665"
        ];
        let clidData = this._api.DistrData.getRecord("clid1");
        if (clidData && blockedClids.indexOf(clidData.clid) !== -1) {
            this._api.SysUtils.Timer(() => {
                this._api.Controls.disablePlugin(this._api.componentID);
            }, 0);
            return true;
        }
        return false;
    },
    _loadFrameScript: function () {
        this._api.Browser.messageManager.addMessageListener({
            messageName: EVENT_MESSAGE_NAME,
            listener: this
        });
        this._api.Browser.messageManager.loadFrameScript({ url: this._contentScriptPath });
    },
    _removeFrameScript: function () {
        this._api.Browser.messageManager.removeMessageListener({
            messageName: EVENT_MESSAGE_NAME,
            listener: this
        });
        this._api.Browser.messageManager.removeDelayedFrameScript({ url: this._contentScriptPath });
    },
    get _contentScriptPath() {
        return this._api.Package.resolvePath("/js/contentScript.js");
    },
    receiveMessage: function (message) {
        let {name, data} = message;
        switch (data.type) {
        case "getScriptText":
            return this._api.Package.readTextFile("/js/pageScript.js");
        case "setValue":
            localStore.setValue(data.name, String(data.value));
            break;
        case "getValue":
            return String(localStore.getValue(data.name) || "");
        case "getSetting":
            if (data.name === "clid") {
                let clidRecord = this._api.DistrData.getRecord("clid21");
                let clid = clidRecord && clidRecord.clidAndVid || "2210393";
                return String(clid);
            }
            return String(this._api.Settings.getValue(data.name));
        case "isStatEnabled":
            return Boolean(this._api.Statistics.alwaysSendUsageStat);
        case "getSelector":
            return this._scriptDataObject.selectors[data.domain] || null;
        case "getBlacklist":
            return this._scriptDataObject.blacklist || null;
        case "isBlacklistedHost": {
                let blacklisted = false;
                let fullBlackList = this._scriptDataObject.blacklist.fullBlackList;
                if (Array.isArray(fullBlackList)) {
                    let hostParts = data.host.split(".");
                    while (!blacklisted && hostParts.length) {
                        blacklisted = fullBlackList.indexOf(hostParts.join(".")) !== -1;
                        hostParts.shift();
                    }
                }
                return blacklisted;
            }
        case "showPreferences":
            this._api.Controls.openSettingsDialog(null, this._api.componentID);
            break;
        default:
            this._api.logger.error("Unknown message '" + data.type + "'");
            break;
        }
    },
    get _scriptDataObject() {
        delete this._scriptDataObject;
        this._scriptDataObject = scriptData.obj;
        return this._scriptDataObject;
    }
};
let scriptData = {
    EXPORT_URL: "https://dl.metabar.ru/static/script-data/script-data.json",
    UPDATE_INTERVAL: 60 * 60 * 24 * 1000,
    LAST_UPDATE_TIME_PREF_NAME: "lastUpdate",
    JSON_LAST_MODIFIED_PREF_NAME: "jsonLastModified",
    JSON_FILE_NAME: "script-data.json",
    get obj() {
        this._setUpdateTimer();
        let scriptDataObject = Object.create(null);
        try {
            let storeFile = this._api.Files.getPackageStorage(false);
            storeFile.append(this.JSON_FILE_NAME);
            let content;
            if (storeFile.exists()) {
                content = this._api.Files.jsonFromFile(storeFile);
            } else {
                content = JSON.parse(this._api.Package.readTextFile("/data/" + this.JSON_FILE_NAME));
            }
            if (this._validateJSON(content)) {
                scriptDataObject = content;
            }
        } catch (e) {
            this._api.logger.debug(e);
            this._api.logger.error("Can not load local script data");
        }
        if (!scriptDataObject.selectors) {
            scriptDataObject.selectors = Object.create(null);
        }
        if (!scriptDataObject.blacklist) {
            scriptDataObject.blacklist = Object.create(null);
        }
        return scriptDataObject;
    },
    _updateScriptData: function () {
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.onreadystatechange = function () {
            if (request.readyState !== 4) {
                return;
            }
            let responseStatus = request.status;
            if (responseStatus >= 200 && responseStatus < 300 && request.responseText) {
                this._api.logger.debug("Get response with script data, try parse.");
                let newLastModified = "";
                try {
                    newLastModified = request.getResponseHeader("Last-Modified") || "";
                } catch (e) {
                }
                if (!newLastModified || newLastModified !== this._jsonLastModified) {
                    if (this._updateScriptDataCallback(request)) {
                        this._jsonLastModified = newLastModified;
                    }
                }
            } else if (responseStatus !== 304) {
                this._api.logger.debug("XMLHTTPRequest failed to get new json.");
            }
            this._api.Settings.setValue(this.LAST_UPDATE_TIME_PREF_NAME, String(Date.now()));
            this._setUpdateTimer();
        }.bind(this);
        request.open("GET", this.EXPORT_URL);
        let previousLastModified = this._jsonLastModified;
        if (previousLastModified) {
            request.setRequestHeader("If-Modified-Since", previousLastModified);
        }
        request.send();
    },
    _updateScriptDataCallback: function filtersManager__updateCallback(request) {
        try {
            let json = JSON.parse(atob(request.responseText));
            if (this._validateJSON(json)) {
                let storeFile = this._api.Files.getPackageStorage(true);
                storeFile.append(this.JSON_FILE_NAME);
                this._api.Files.jsonToFile(json, storeFile);
                return true;
            } else {
                this._api.logger.debug("JSON from server is not valid.");
            }
        } catch (e) {
            this._api.logger.debug("Parsing json response from the server failed.\n" + e);
        }
        return false;
    },
    _validateJSON: function (json) {
        if (json && typeof json === "object" && typeof json.selectors === "object" && typeof json.blacklist === "object") {
            return true;
        }
        return false;
    },
    _setUpdateTimer: function filtersManager__setUpdateTimer(delay) {
        if (typeof delay == "undefined") {
            const MINIMUM_DELAY_MS = 5000;
            let lastUpdate = parseInt(this._api.Settings.getValue(this.LAST_UPDATE_TIME_PREF_NAME), 10);
            delay = this.UPDATE_INTERVAL - Math.abs(lastUpdate - Date.now());
            delay = Math.max(delay, MINIMUM_DELAY_MS);
        }
        if (this._updateTimer) {
            this._updateTimer.cancel();
        }
        this._updateTimer = new this._api.SysUtils.Timer(this._updateScriptData.bind(this), delay);
    },
    get _jsonLastModified() {
        return this._api.Settings.getValue(this.JSON_LAST_MODIFIED_PREF_NAME);
    },
    set _jsonLastModified(tagString) {
        this._api.Settings.setValue(this.JSON_LAST_MODIFIED_PREF_NAME, tagString);
    },
    get _api() {
        return core.API;
    },
    _updateTimer: null
};
let localStore = {
    finalize: function () {
        if (!this.__data) {
            return;
        }
        try {
            let storeFile = core.API.Files.getPackageStorage(true);
            storeFile.append("localStore.json");
            core.API.Files.jsonToFile(this.__data, storeFile);
        } catch (e) {
            Cu.reportError(e);
        }
        this.__data = null;
    },
    getValue: function (name) {
        return this._data[name];
    },
    setValue: function (name, value) {
        Object.keys(this._data).slice(1000).forEach(key => delete this._data[key]);
        this._data[name] = String(value).substr(0, 1000);
    },
    get _data() {
        if (this.__data === null) {
            this.__data = Object.create(null);
            try {
                let storeFile = core.API.Files.getPackageStorage(true);
                storeFile.append("localStore.json");
                if (storeFile.exists()) {
                    let data = core.API.Files.jsonFromFile(storeFile);
                    if (data && typeof data === "object") {
                        this.__data = data;
                    }
                }
            } catch (e) {
                Cu.reportError(e);
            }
        }
        return this.__data;
    },
    __data: null
};
