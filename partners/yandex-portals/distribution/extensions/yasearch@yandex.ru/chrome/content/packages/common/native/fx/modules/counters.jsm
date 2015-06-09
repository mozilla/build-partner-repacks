"use strict";
const EXPORTED_SYMBOLS = ["counters"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const counters = {
    _api: null,
    _bufferedCallbacks: [],
    _forcedUpdateTimer: false,
    _initialized: false,
    _lastResponseDoc: null,
    _lastResponseServices: null,
    _lastResponseFlags: null,
    _minsUpdateInterval: 5,
    _respListeners: [],
    _reqTimer: null,
    _serviceListeners: {},
    _UPD_INT_PREFNAME: "countersUpdateInterval",
    init: function yCounters_init(api) {
        if (this._initialized) {
            return;
        }
        this._api = api;
        this._authManager = api.Passport;
        this._authManager.addListener(this._authManager.EVENTS.AUTH_STATE_CHANGED, this);
        this._watchUpdIntervalPref();
        this._initialized = true;
    },
    requireService: function yCounters_requireService(serviceID, dataListener) {
        let listeners = this._serviceListeners[serviceID] || (this._serviceListeners[serviceID] = []);
        if (listeners.indexOf(dataListener) >= 0) {
            return;
        }
        listeners.push(dataListener);
        if (this._authManager.isAuthorized()) {
            if (!this._reqTimer) {
                this._schedule();
            }
        }
    },
    requireServiceByName: function yCounters_requireService(strServiceName, dataListener) {
        if (this._YA_USER_SERVICES[strServiceName]) {
            this.requireService(this._YA_USER_SERVICES[strServiceName].id, dataListener);
            return true;
        }
        return false;
    },
    ignoreService: function yCounters_ignoreService(serviceID, dataListener) {
        let listeners = this._serviceListeners[serviceID];
        if (!listeners) {
            return;
        }
        let listenerIdx = listeners.indexOf(dataListener);
        if (listenerIdx < 0) {
            return;
        }
        listeners.splice(listenerIdx, 1);
        if (listeners.length < 1) {
            delete this._serviceListeners[serviceID];
        }
        if (!this._hasListeners) {
            this._stopRequests();
        }
    },
    listenResponses: function yCounters_watchResponses(listener) {
        if (this._respListeners.indexOf(listener) >= 0) {
            return;
        }
        this._respListeners.push(listener);
    },
    ignoreResponses: function yCounters_ignoreResponses(listener) {
        let listenerIdx = this._respListeners.indexOf(listener);
        if (listenerIdx >= 0) {
            this._respListeners.splice(listenerIdx, 1);
        }
    },
    haveDataForService: function yCounters_haveDataForService(aServiceId) {
        return this._lastResponseServices && this._lastResponseServices.indexOf(String(aServiceId)) != -1;
    },
    haveDataForServices: function yCounters_haveDataForService(aServicesList) {
        return !aServicesList.some(function (serviceId) {
            return !this.haveDataForService(serviceId);
        }, this);
    },
    getLastResponse: function yCounters_getLastResponse() {
        return [
            this._lastResponseFlags,
            this._lastResponseDoc
        ];
    },
    forceUpdate: function yCounters_forceUpdate(srvID, callback) {
        if (callback) {
            this._bufferedCallbacks.push({
                serviceName: srvID,
                fn: callback
            });
        }
        if (this._forcedUpdateTimer) {
            return;
        }
        this._forcedUpdateTimer = true;
        let logger = this._api.logger;
        let finalWrapper = function (bufferedCallbacks) {
            bufferedCallbacks.forEach(function (fn) {
                try {
                    fn();
                } catch (e) {
                    logger.error(e);
                    logger.debug(e.stack);
                }
            });
        };
        let me = this;
        let event = {
            notify: function yCounters_forceUpdate_notify() {
                let srvIDs = [];
                let callbacks = [];
                me._bufferedCallbacks.forEach(function (bufferedCallback) {
                    srvIDs.push(bufferedCallback.serviceName);
                    callbacks.push(bufferedCallback.fn);
                });
                me._sendRequest(srvIDs.length ? srvIDs : null, finalWrapper(callbacks));
                me._forcedUpdateTimer = false;
                me._bufferedCallbacks.length = 0;
            }
        };
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    notify: function yCounters_notify(timer) {
        this._sendRequest();
    },
    observe: function yCounters_observe(subject, topic, data) {
        if (topic === this._authManager.EVENTS.AUTH_STATE_CHANGED) {
            this._onAuthStateChange(Boolean(data.accounts.length));
        }
    },
    get _COUNTERS_EXPORT_URL() {
        let exportURL = this._api.Localization.createStringBundle("/urls/common.properties").get("exportURLWithAuthCookies");
        delete this._COUNTERS_EXPORT_URL;
        return this._COUNTERS_EXPORT_URL = exportURL + "for/counters.xml";
    },
    _YA_USER_SERVICES: {
        mail: { id: 43 },
        lenta: { id: 44 },
        money: { id: 45 },
        fotki: { id: 46 },
        yaru: { id: 47 },
        moikrug: { id: 48 }
    },
    _onAuthStateChange: function yCounters__onAuthStateChange(authorized) {
        if (authorized) {
            this.forceUpdate();
            if (!this._reqTimer) {
                this._schedule();
            }
        } else {
            this._clear();
            this._stopRequests();
        }
    },
    _clear: function yCounters__clear() {
        this._lastResponseDoc = this._lastResponseFlags = this._lastResponseServices = null;
        this._notifyListeners(undefined, null, null);
    },
    get _updateInterval() {
        return this._minsUpdateInterval * 60 * 1000;
    },
    _watchUpdIntervalPref: function yCounters__watchUpdIntervalPref() {
        let updIntPrefName = this._api.Settings.getPackageBranchPath() + this._UPD_INT_PREFNAME;
        let prefsModule = this._api.Settings.PrefsModule;
        this._minsUpdateInterval = parseInt(prefsModule.get(updIntPrefName, 5), 10) || 0;
        prefsModule.observe(updIntPrefName, this._onUpdIntervalChange, this);
    },
    _ignoreUpdIntervalPref: function yCounters__ignoreUpdIntervalPref() {
        let updIntPrefName = this._api.Settings.getPackageBranchPath() + this._UPD_INT_PREFNAME;
        this._api.Settings.PrefsModule.ignore(updIntPrefName, this._onUpdIntervalChange, this);
    },
    _onUpdIntervalChange: function yCounters__onUpdIntervalChange(newValue) {
        this._minsUpdateInterval = parseInt(newValue, 10) || 0;
        if (this._hasListeners) {
            this._schedule();
        }
    },
    get _hasListeners() {
        for (let [
                    id,
                    list
                ] in Iterator(this._serviceListeners)) {
            if (list && list.length) {
                return true;
            }
        }
        return false;
    },
    _schedule: function yCounters__schedule() {
        if (this._reqTimer) {
            this._reqTimer.cancel();
        } else {
            this._reqTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        }
        if (this._minsUpdateInterval > 0) {
            this._reqTimer.initWithCallback(this, this._updateInterval, this._reqTimer.TYPE_REPEATING_SLACK);
        }
    },
    _stopRequests: function yCounters__stopRequests() {
        if (this._reqTimer) {
            this._reqTimer.cancel();
            this._reqTimer = null;
        }
    },
    _sendRequest: function yCounters__sendRequest(srvIDs, callback) {
        let [
            reqURL,
            reqHandler,
            svcList
        ] = this._createRequestHandler(srvIDs);
        if (!reqURL) {
            return;
        }
        let finalWrapper = function () {
            reqHandler.apply(this, arguments);
            if (callback) {
                callback();
            }
        };
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.open("GET", reqURL, true);
        request.QueryInterface(Ci.nsIDOMEventTarget);
        request.addEventListener("load", finalWrapper, false);
        request.addEventListener("error", finalWrapper, false);
        request.send(null);
    },
    _handleReqEvent: function yCounters__handleReqEvent(event, svcList) {
        let request = event.target;
        let flags = Object.create(null);
        if (event.type == "error" || request.status != 200) {
            flags.requestError = 1;
        }
        let responseDoc = request.responseXML;
        if (responseDoc) {
            let rootEl = responseDoc.documentElement;
            if (rootEl.hasAttribute("error")) {
                flags.exportError = 1;
            } else if (!rootEl.childNodes.length) {
                flags.noAuth = 1;
            }
        } else {
            flags.xmlError = 1;
        }
        if (this._emptyObject(flags)) {
            flags.ok = 1;
        }
        this._lastResponseServices = svcList;
        this._lastResponseDoc = responseDoc;
        this._lastResponseFlags = flags;
        if (flags.noAuth) {
            this._stopRequests();
        }
        this._notifyListeners(svcList, flags, responseDoc);
    },
    _notifyListeners: function yCounters__notifyListeners(svcList, flags, responseDoc) {
        this._respListeners.forEach(function (dataListener) {
            this._tryNotifyListener(dataListener, flags, responseDoc);
        }, this);
        svcList = svcList || Object.keys(this._serviceListeners);
        svcList.forEach(function (serviceID) {
            let listeners = this._serviceListeners[serviceID];
            if (!listeners) {
                return;
            }
            listeners.forEach(function (dataListener) {
                this._tryNotifyListener(dataListener, flags, responseDoc);
            }, this);
        }, this);
    },
    _tryNotifyListener: function yCounters__tryNotifyListener(dataListener, flags, responseDoc) {
        try {
            dataListener.onCountersChange(flags, responseDoc);
        } catch (e) {
            if (this._api) {
                this._api.logger.error(e);
                this._api.logger.debug(e.stack);
            } else {
                Cu.reportError(e);
            }
        }
    },
    _createRequestHandler: function yCounters__createRequestHandler(srvIDs) {
        let paramList = [];
        srvIDs = srvIDs || [];
        if (srvIDs.length) {
            for (let [
                        key,
                        svcID
                    ] in Iterator(srvIDs)) {
                paramList.push("services=" + encodeURIComponent(svcID));
            }
        } else {
            paramList = Object.keys(this._serviceListeners).map(function (svcID) {
                srvIDs.push(svcID);
                return "services=" + encodeURIComponent(svcID);
            });
        }
        if (!paramList.length) {
            return [];
        }
        let reqURL = this._COUNTERS_EXPORT_URL + "?" + paramList.join("&");
        let reqHandler = function yCounters__reqHandler(event) {
            this._handleReqEvent(event, srvIDs);
        }.bind(this);
        return [
            reqURL,
            reqHandler,
            srvIDs
        ];
    },
    _emptyObject: function yCounters__emptyObject(object) {
        for (let x in object) {
            return false;
        }
        return true;
    }
};
