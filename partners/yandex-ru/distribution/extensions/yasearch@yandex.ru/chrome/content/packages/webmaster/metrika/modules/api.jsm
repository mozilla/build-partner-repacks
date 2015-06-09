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
        init: function (application) {
            this._app = application;
            exportMgr = app.commonModule("export");
            exportMgr.init(_handlers);
        },
        finalize: function () {
            this._app = null;
            this._config = null;
            exportMgr = null;
        },
        _onSuccess: function (aWIID, action, data) {
            this.app.onUpdate(aWIID);
        },
        _onFail: function (aWIID, action, data) {
            this.app.onUpdate(aWIID);
        },
        configure: function (aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            if (!this._config[configActionName]) {
                this._config[configActionName] = Object.create(null);
            }
            this._config[configActionName][aName] = aValue;
        },
        getConfigValue: function (aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            return this._config[configActionName] && this._config[configActionName][aName];
        },
        cleanData: function (aWIID) {
            exportMgr.cleanData(aWIID);
        },
        getUpdateInterval: function (aWIID, force) {
            if (!this._updateIntervals[aWIID] || force) {
                this._updateIntervals[aWIID] = parseInt(this.app.api.Settings.getValue("update-interval"), 10) * 3600;
            }
            return this._updateIntervals[aWIID];
        },
        getLastUpdateTime: function (aWIID) {
            return exportMgr.getLastUpdateTime(aWIID);
        },
        getError: function (aWIID) {
            return exportMgr.getError(aWIID);
        },
        getUserData: function (aWIID, aAction) {
            return exportMgr.getServerData(aWIID, aAction);
        },
        update: function (aWIID, force) {
            exportMgr.update(aWIID, force);
        }
    };
    let _handlers = Object.create(null);
    _handlers._defaults = {
        updateInterval: function (aWIID) {
            return res.getUpdateInterval(aWIID);
        },
        expiryInterval: EXPIRY_TIME,
        errback: function (aXhr) {
            return { _error: true };
        },
        onSuccess: res._onSuccess.bind(res),
        onFail: res._onFail.bind(res)
    };
    _handlers.main = [{
            url: "http://api-metrika.yandex.ru/counters.json?format=json",
            cacheKeys: function () {
                return { login: res.getConfigValue("user") };
            },
            callback: function (aXhr) {
                let result = { _error: false };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsJSON;
                } catch (e) {
                    result._error = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let maxCountersToParse = 10;
                let counters = (xhrData.counters || []).slice(0, maxCountersToParse).filter(function (counter) {
                    return !!counter.id;
                }).map(function (counter) {
                    return {
                        id: counter.id,
                        name: counter.name || counter.site
                    };
                });
                result.counters = counters;
                return result;
            }
        }];
    return res;
};
