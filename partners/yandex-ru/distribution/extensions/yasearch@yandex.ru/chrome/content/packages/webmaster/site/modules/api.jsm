"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const WEBMASTER_URL = "http://webmaster.yandex.ru/bar-export-host-info.xml";
    const METRIKA_URL = "http://api-metrika.yandex.ru/stat/traffic/summary";
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
            exportMgr = null;
        },
        _createURLforWIID: function (aWIID, type) {
            if (type == "metrika") {
                return METRIKA_URL + "?id=" + (this._Helper.getMetrikaID(aWIID) || "");
            }
            return WEBMASTER_URL + "?host=" + (this._Helper.getMasterID(aWIID) || "");
        },
        _onSuccess: function (aWIID, aAction, data) {
            if (data) {
                if (data.master && data.master.siteInList) {
                    let masterIDSetting = "";
                    let metrikaIDSetting = "";
                    if (data.master.masterID) {
                        masterIDSetting = data.master.masterID;
                    }
                    if (data.metrikaSpec && data.metrikaSpec.metrikaID) {
                        metrikaIDSetting = data.metrikaSpec.metrikaID;
                    }
                    this.app.api.Settings.setValue("masterSaveId", masterIDSetting, aWIID);
                    this.app.api.Settings.setValue("metrikaSaveId", metrikaIDSetting, aWIID);
                }
            }
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
                this._updateIntervals[aWIID] = parseInt(this.app.api.Settings.getValue("updateInterval", aWIID), 10) * 3600;
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
        },
        _Helper: {
            getMasterID: function (aWIID) {
                let siteName = res.app.api.Settings.getValue("selectedSitenameSetting", aWIID);
                try {
                    let siteID = null;
                    let currentData = res.getUserData(aWIID, "main");
                    let exportData = currentData && currentData.metrika && currentData.metrika.exportData;
                    if (!exportData) {
                        return null;
                    }
                    if (!siteName) {
                        siteID = exportData[0].id;
                    } else {
                        exportData.some(function (siteObj) {
                            if (siteObj.name == siteName) {
                                siteID = siteObj.id;
                                return true;
                            }
                        });
                    }
                    let masterID = /\d+(?=_master)/.exec(siteID)[0];
                    return masterID;
                } catch (e) {
                }
                return null;
            },
            getMetrikaID: function (aWIID) {
                let siteName = res.app.api.Settings.getValue("selectedSitenameSetting", aWIID);
                try {
                    let siteID = null;
                    let currentData = res.getUserData(aWIID, "main");
                    let exportData = currentData && currentData.metrika && currentData.metrika.exportData;
                    if (!exportData) {
                        return null;
                    }
                    if (!siteName) {
                        siteID = exportData[0].id;
                    } else {
                        exportData.some(function (siteObj) {
                            if (siteObj.name == siteName) {
                                siteID = siteObj.id;
                                return true;
                            }
                        }).id;
                    }
                    let masterID = /\d+(?=_metrika)/.exec(siteID)[0];
                    return masterID;
                } catch (e) {
                }
                return null;
            }
        }
    };
    let _handlers = Object.create(null);
    _handlers._defaults = {
        cacheKeys: function () {
            return { login: res.getConfigValue("user") };
        },
        updateInterval: function (aWIID) {
            return res.getUpdateInterval(aWIID);
        },
        expiryInterval: function (aWIID) {
            return res.getUpdateInterval(aWIID) + 2;
        },
        errback: function (aXhr) {
            return { _error: true };
        },
        onSuccess: res._onSuccess.bind(res),
        onFail: res._onFail.bind(res)
    };
    _handlers.main = [
        {
            url: "https://export.yandex.ru/bar/metrika.xml",
            callback: function (aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    metrika: data,
                    _exportError: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._exportError = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let hostsList = [];
                let hosts = xhrData.querySelectorAll("hostlist > host");
                for (let i = 0; i < hosts.length; i++) {
                    let hostElement = hosts[i];
                    let host = {};
                    host.id = hostElement.getAttribute("id") || null;
                    let name = hostElement.querySelector("name");
                    host.name = name ? name.textContent : "";
                    hostsList.push(host);
                }
                data.exportData = hostsList;
                return result;
            },
            errback: function (aXhr) {
                return { _exportError: true };
            },
            onSuccess: function () {
            }
        },
        {
            url: "http://api-metrika.yandex.ru/counters.json",
            callback: function (aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    counters: data,
                    _countersError: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsJSON;
                } catch (e) {
                    result._countersError = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                data.countersData = xhrData;
                return result;
            },
            errback: function (aXhr) {
                return { _countersError: true };
            },
            onSuccess: function () {
            }
        },
        {
            url: function (aWIID, aAction) {
                let url = res._createURLforWIID(aWIID);
                return url;
            },
            callback: function (aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    master: data,
                    _masterErrors: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._masterErrors = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let currentData = res.getUserData(aWIID, "main");
                let exportData = currentData && currentData.metrika && currentData.metrika.exportData;
                if (!(exportData && exportData.length)) {
                    return result;
                }
                let siteName = res.app.api.Settings.getValue("selectedSitenameSetting", aWIID) || exportData[0].name;
                data.siteNum = !!exportData.length;
                data.siteInList = exportData.some(function (siteObj) {
                    return siteObj.name == siteName;
                });
                if (!data.siteInList) {
                    return result;
                }
                let masterID = res._Helper.getMasterID(aWIID);
                data.masterID = masterID;
                let errors = xhrData.querySelector("page > data > errors > error");
                if (errors) {
                    result._masterErrors = true;
                    return result;
                }
                let host = xhrData.querySelector("page > data > host[id='" + masterID + "']");
                if (!host) {
                    return result;
                }
                let name = host.querySelector("name");
                data.name = name ? name.textContent : "";
                let verification = host.querySelector("verification-state");
                data.verification = verification ? verification.textContent : null;
                let tcy = host.querySelector("tcy-value");
                data.tcy = tcy ? parseInt(tcy.textContent, 10) : 0;
                let page = host.querySelector("index-count");
                data.pages = page ? parseInt(page.textContent, 10) : 0;
                let urls = host.querySelector("link-count");
                data.urls = urls ? parseInt(urls.textContent, 10) : 0;
                let virused = host.querySelector("virused");
                data.virused = false;
                if (virused && virused.textContent != "false") {
                    data.virused = true;
                }
                return result;
            }
        },
        {
            url: function (aWIID, aAction) {
                let url = res._createURLforWIID(aWIID, "metrika");
                return url;
            },
            callback: function (aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    metrikaSpec: data,
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
                let currentData = res.getUserData(aWIID, "main");
                let countersData = currentData && currentData.counters && currentData.counters.countersData;
                data.metrikaID = res._Helper.getMetrikaID(aWIID);
                let metrikaVerified = false;
                if (data.metrikaID) {
                    if (countersData && countersData.counters) {
                        countersData.counters.some(function (counterObj) {
                            if (counterObj.id == data.metrikaID) {
                                metrikaVerified = counterObj.code_status;
                                return true;
                            }
                        });
                    }
                }
                data.metrikaVerified = metrikaVerified;
                let totals = xhrData.querySelector("totals");
                if (!totals) {
                    return result;
                }
                let visits = totals.querySelector("visits");
                data.metrikaVisits = visits ? visits.textContent : 0;
                let pageviews = totals.querySelector("page_views");
                data.metrikaPageViews = pageviews ? pageviews.textContent : 0;
                let visitors = totals.querySelector("visitors");
                data.metrikaVisitors = visitors ? visitors.textContent : 0;
                return result;
            }
        }
    ];
    return res;
};
