"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const EXPIRY_TIME = 7 * 24 * 60 * 60;
    let exportMgr = null;
    let res = {
        _app: null,
        _config: Object.create(null),
        _updateIntervals: Object.create(null),
        get app() {
            return this._app;
        },
        init: function direct_direct_init(application) {
            this._app = application;
            exportMgr = app.commonModule("export");
            exportMgr.init(_handlers);
        },
        finalize: function direct_direct_finalize() {
            this._app = null;
            exportMgr = null;
        },
        _onSuccess: function direct_direct__onSuccess(aWIID, data) {
            this.app.onUpdate(aWIID);
        },
        _onFail: function direct_direct__onFail(aWIID, data) {
            this.app.onUpdate(aWIID);
        },
        configure: function direct_direct_configure(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            if (!this._config[configActionName]) {
                this._config[configActionName] = Object.create(null);
            }
            this._config[configActionName][aName] = aValue;
        },
        getConfigValue: function direct_direct_getConfigValue(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            return this._config[configActionName] && this._config[configActionName][aName];
        },
        cleanData: function direct_direct_cleanData(aWIID) {
            exportMgr.cleanData(aWIID);
        },
        getUpdateInterval: function direct_direct_getUpdateInterval(aWIID, force) {
            if (!this._updateIntervals[aWIID] || force) {
                this._updateIntervals[aWIID] = parseInt(this.app.api.Settings.getValue("update-interval"), 10) * 60;
            }
            return this._updateIntervals[aWIID];
        },
        getLastUpdateTime: function direct_direct_getLastUpdateTime(aWIID) {
            return exportMgr.getLastUpdateTime(aWIID);
        },
        getError: function direct_direct_getError(aWIID) {
            return exportMgr.getError(aWIID);
        },
        getUserData: function direct_direct_getUserData(aWIID, aAction) {
            return exportMgr.getServerData(aWIID, aAction);
        },
        update: function direct_direct_update(aWIID, force) {
            exportMgr.update(aWIID, force);
        }
    };
    let _handlers = Object.create(null);
    _handlers._defaults = {
        cacheKeys: function direct_direct__handlers_main_cacheKeys() {
            return { login: res.getConfigValue("user") };
        },
        updateInterval: function direct_direct__handlers_main_updateInterval(aWIID) {
            return res.getUpdateInterval(aWIID);
        },
        expiryInterval: EXPIRY_TIME,
        errback: function direct_direct__handlers_main_errback(aXhr) {
            return { _error: true };
        },
        onSuccess: res._onSuccess.bind(res),
        onFail: res._onFail.bind(res)
    };
    _handlers.main = [
        {
            url: "http://direct.yandex.ru/widget/export?format=xml&bar=1",
            callback: function direct_direct__handlers_main_callback(aXhr) {
                let data = {};
                let result = {
                    common: data,
                    _error: false
                };
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
                let errors = xhrData.querySelector("root > error");
                if (errors) {
                    result._error = true;
                    return result;
                }
                result.isAgency = !!xhrData.querySelector("root > agency");
                if (result.isAgency) {
                    return result;
                }
                let noCampaigns = xhrData.querySelector("root > no_campaigns");
                data.noCampaigns = !noCampaigns || parseInt(noCampaigns.textContent, 10) != 1 ? false : true;
                let sum_rest = xhrData.querySelector("root > sum_rest");
                data.sumrest = sum_rest ? sum_rest.textContent : null;
                let currency = xhrData.querySelector("root > currency");
                data.currency = currency ? currency.textContent : "";
                let activeCamps = xhrData.querySelector("root > active_camps_num");
                data.camps = activeCamps ? activeCamps.textContent : null;
                let overdraft = xhrData.querySelector("root > overdraft");
                if (overdraft) {
                    data.overdraftrest = overdraft.getAttribute("overdraft_rest") || null;
                    data.isoverdraft = overdraft.getAttribute("debt") || null;
                }
                data.campsList = [];
                Array.slice(xhrData.querySelectorAll("root > camps_list > camp")).forEach(function (camp) {
                    let campObj = {};
                    campObj.cid = camp.getAttribute("cid") || null;
                    campObj.name = camp.getAttribute("name") || "";
                    if (campObj.cid) {
                        data.campsList.push(campObj);
                    }
                });
                return result;
            }
        },
        {
            url: function direct_direct__handlers_main_2nd_url(aWIID, aAction) {
                let url = "http://direct.yandex.ru/widget/export?format=xml&bar=1&cid=";
                let currentData = res.getUserData(aWIID, "main");
                let campsList = currentData.common && currentData.common.campsList;
                if (!(campsList && campsList.length)) {
                    return null;
                }
                return url + campsList.map(function (campObj) {
                    return campObj.cid;
                }).sort().join(",");
            },
            callback: function direct_direct__handlers_main_2nd_callback(aXhr) {
                let data = {};
                let result = {
                    menu: data,
                    _menuError: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._menuError = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let campsInfo = [];
                Array.slice(xhrData.querySelectorAll("root > camps_info > camp")).forEach(function (campElement) {
                    let campObj = {
                        name: campElement.getAttribute("name") || "",
                        sumrest: campElement.getAttribute("sum_rest") || null,
                        cid: campElement.getAttribute("cid") || null
                    };
                    campsInfo.push(campObj);
                });
                data.campsInfo = campsInfo;
                return result;
            },
            errback: function direct_direct__handlers_main_errback(aXhr) {
                return {
                    menu: {},
                    _menuError: true
                };
            }
        }
    ];
    return res;
};
