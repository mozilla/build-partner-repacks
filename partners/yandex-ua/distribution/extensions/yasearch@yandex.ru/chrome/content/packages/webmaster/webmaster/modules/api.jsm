"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const EXPIRY_TIME = 60 * 60;
    let exportMgr = null;
    let res = {
        _app: null,
        _config: Object.create(null),
        _updateIntervals: Object.create(null),
        get app() {
            return this._app;
        },
        init: function webmaster_webmaster_init(application) {
            this._app = application;
            exportMgr = app.commonModule("export");
            exportMgr.init(_handlers);
        },
        finalize: function webmaster_webmaster_finalize() {
            this._app = null;
            exportMgr = null;
        },
        _onSuccess: function webmaster_webmaster__onSuccess(aWIID, action, data) {
            this.app.onUpdate(aWIID);
        },
        _onFail: function webmaster_webmaster__onFail(aWIID, action, data) {
            this.app.onUpdate(aWIID);
        },
        configure: function webmaster_webmaster_configure(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            if (!this._config[configActionName]) {
                this._config[configActionName] = Object.create(null);
            }
            this._config[configActionName][aName] = aValue;
        },
        getConfigValue: function webmaster_webmaster_getConfigValue(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            return this._config[configActionName] && this._config[configActionName][aName];
        },
        cleanData: function webmaster_webmaster_cleanData(aWIID) {
            exportMgr.cleanData(aWIID);
        },
        getUpdateInterval: function webmaster_webmaster_getUpdateInterval(aWIID, force) {
            if (!this._updateIntervals[aWIID] || force) {
                this._updateIntervals[aWIID] = parseInt(this.app.api.Settings.getValue("update-interval"), 10) * 60;
            }
            return this._updateIntervals[aWIID];
        },
        getLastUpdateTime: function webmaster_webmaster_getLastUpdateTime(aWIID) {
            return exportMgr.getLastUpdateTime(aWIID);
        },
        getError: function webmaster_webmaster_getError(aWIID) {
            return exportMgr.getError(aWIID);
        },
        getUserData: function webmaster_webmaster_getUserData(aWIID, aAction) {
            return exportMgr.getServerData(aWIID, aAction);
        },
        update: function webmaster_webmaster_update(aWIID, force) {
            exportMgr.update(aWIID, force);
        }
    };
    let _handlers = Object.create(null);
    _handlers._defaults = {
        updateInterval: function webmaster_webmaster__handlers_main_updateInterval(aWIID) {
            return res.getUpdateInterval(aWIID);
        },
        expiryInterval: EXPIRY_TIME,
        errback: function webmaster_webmaster__handlers_main_errback(aXhr) {
            return { _error: true };
        },
        onSuccess: res._onSuccess.bind(res),
        onFail: res._onFail.bind(res)
    };
    _handlers.main = [{
            url: "http://webmaster.yandex.ru/bar-export.xml?version=2&format=xml",
            cacheKeys: function webmaster_webmaster__handlers_main_cacheKeys() {
                return { login: res.getConfigValue("user") };
            },
            callback: function webmaster_webmaster__handlers_main_callback(aXhr) {
                let result = { _error: false };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._error = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let errors = xhrData.querySelector("page > data > errors");
                if (errors) {
                    result._error = true;
                    return result;
                }
                let hostlist = xhrData.querySelector("page > data > hostlist");
                if (!hostlist) {
                    return result;
                }
                let hostsArray = [];
                Array.slice(hostlist.querySelectorAll("host")).forEach(function (host) {
                    let verification = host.querySelector("verification-state");
                    if (!(verification && verification.textContent == "VERIFIED")) {
                        return;
                    }
                    let hostObj = {};
                    hostObj.id = host.getAttribute("id");
                    let name = host.querySelector("name");
                    hostObj.name = name ? name.textContent : "";
                    let virused = host.querySelector("virused");
                    hostObj.virused = virused && virused.textContent == "true" ? true : false;
                    hostsArray.push(hostObj);
                });
                result.hosts = hostsArray;
                return result;
            }
        }];
    return res;
};
