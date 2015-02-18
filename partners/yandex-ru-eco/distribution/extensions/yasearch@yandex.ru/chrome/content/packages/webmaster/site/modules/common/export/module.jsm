"use strict";
const EXPORTED_SYMBOLS = ["module"];
const ERRORS = { SERVER_RESPONSE_ERROR: "serverResponseError" };
var module = function (app, common) {
    var handlers = null;
    var Export = {
        _storage: Object.create(null),
        init: function Export_init(aHandlers) {
            let defaults = aHandlers._defaults;
            delete aHandlers._defaults;
            for (let actionKey in aHandlers) {
                let requestsArray = aHandlers[actionKey];
                requestsArray.forEach(function (requestObject) {
                    for (let defaultsProp in defaults) {
                        if (!requestObject[defaultsProp]) {
                            requestObject[defaultsProp] = defaults[defaultsProp];
                        }
                    }
                });
            }
            handlers = aHandlers;
        },
        finalize: function Export_finalize() {
            handlers = null;
            this.cleanData();
        },
        _getWIID: function Export__getWIID(aWIID) {
            if (!this._storage[aWIID]) {
                this._storage[aWIID] = new WIIDDataContainer(aWIID);
            }
            return this._storage[aWIID];
        },
        getServerData: function Export_getServerData(aWIID, aAction) {
            return this._getWIID(aWIID).getServerData(aAction);
        },
        cleanData: function Export_cleanData(aWIID) {
            if (aWIID) {
                this._getWIID(aWIID).finalize();
                delete this._storage[aWIID];
                return;
            }
            for (let wiid in this._storage) {
                this._getWIID(wiid).finalize();
                delete this._storage[wiid];
            }
        },
        getError: function Export_getError(aWIID) {
            if (!aWIID) {
                return false;
            }
            return this._getWIID(aWIID).getError();
        },
        getLastUpdateTime: function Export_getLastUpdateTime(aWIID) {
            return this._getWIID(aWIID).getLastUpdateTime();
        },
        update: function Export_update(aWIID, force) {
            this._getWIID(aWIID).update(force);
        }
    };
    function WIIDDataContainer(aWIID) {
        this._wiid = aWIID;
        this._items = [];
        for (let action in handlers) {
            this._initItem(action);
        }
    }
    WIIDDataContainer.prototype = {
        constructor: WIIDDataContainer,
        get WIID() {
            return this._wiid;
        },
        get items() {
            return this._items;
        },
        finalize: function Export_WIIDDataContainer_finalize() {
            this.items.forEach(function (item) {
                item.finalize();
            });
            this._items = null;
        },
        _initItem: function Export_WIIDDataContainer__initItem(aAction) {
            let actionConfig = handlers[aAction];
            let item = new Action(aAction, actionConfig, this);
            this.items.push(item);
            return item;
        },
        getItem: function Export_WIIDDataContainer_getItem(aAction) {
            for (let i = 0; i < this.items.length; i++) {
                if (this.items[i].action == aAction) {
                    return this.items[i];
                }
            }
        },
        getServerData: function Export_WIIDDataContainer_getServerData(aAction) {
            if (aAction) {
                return this.getItem(aAction).data;
            }
            return this.items.reduce(function (result, actionObj) {
                result[actionObj.action] = actionObj.data;
                return result;
            }, {});
        },
        getLastUpdateTime: function Export_WIIDDataContainer_getLastUpdateTime() {
            return this.items.reduce(function (lastUpdate, item) {
                return item.lastUpdate > lastUpdate ? item.lastUpdate : lastUpdate;
            }, null);
        },
        getError: function Export_WIIDDataContainer_getError() {
            let errorsArray = this.items.filter(function (aItem) {
                return !!aItem.error;
            }).map(function (aItem) {
                return {
                    action: aItem.action,
                    error: aItem.error
                };
            });
            return errorsArray.length ? errorsArray : null;
        },
        update: function Export_WIIDDataContainer_update(force) {
            this.items.forEach(function (item) {
                item.update(force);
            });
        }
    };
    function Action(action, actionConfig, parent) {
        if (!action || !actionConfig) {
            throw new Error("Action name and config should be specified;");
        }
        this._action = action;
        this._parent = parent;
        this._config = actionConfig;
        this._data = null;
        this._requests = [];
        this._error = null;
        this._lastUpdate = null;
        this._currentRequestExecuted = 0;
        this._forcing = false;
        this._initialUpdate = true;
    }
    Action.prototype = {
        constructor: Action,
        get action() {
            return this._action;
        },
        get data() {
            return this._data;
        },
        get error() {
            return this._error;
        },
        get lastUpdate() {
            return this._lastUpdate;
        },
        finalize: function Export_WIIDDataContainer_Action_finalize() {
            this._data = null;
            this._error = null;
            this._lastUpdate = null;
            this._parent = null;
            this._removeRequest();
            this._requests = null;
        },
        _setServerData: function Export_WIIDDataContainer_Action__setServerData(data) {
            this._data = data;
            return this;
        },
        _resetData: function Export_WIIDDataContainer_Action__resetData() {
            this._data = null;
            this._lastUpdate = null;
            this._resetError();
        },
        _setError: function Export_WIIDDataContainer_Action__setError(error) {
            this._error = error;
            return this;
        },
        _resetError: function Export_WIIDDataContainer_Action__resetError() {
            this._error = null;
            return this;
        },
        _createRequest: function Export_WIIDDataContainer_Action__createRequest(aConfig) {
            let wiid = this._parent.WIID;
            let action = this.action;
            let url = typeof aConfig.url == "function" ? aConfig.url(wiid, action) : aConfig.url;
            let expiryInterval = typeof aConfig.expiryInterval == "function" ? aConfig.expiryInterval(wiid, action) : aConfig.expiryInterval;
            let updateInterval = typeof aConfig.updateInterval == "function" ? aConfig.updateInterval(wiid, action) : aConfig.updateInterval;
            let validStatusRange = typeof aConfig.validStatusRange == "function" ? aConfig.validStatusRange(wiid, action) : aConfig.validStatusRange;
            let cacheKeys = typeof aConfig.cacheKeys == "function" ? aConfig.cacheKeys(wiid, action) : aConfig.cacheKeys;
            let method = aConfig.method || "GET";
            let cachedResource;
            try {
                cachedResource = common.api.Network.getCachedResource({
                    url: url,
                    method: method,
                    updateInterval: updateInterval,
                    expireInterval: expiryInterval,
                    cacheKeys: cacheKeys,
                    validStatusRange: validStatusRange
                });
            } catch (e) {
                return null;
            }
            cachedResource.addListener("changed", this);
            return cachedResource;
        },
        _removeRequest: function Export_WIIDDataContainer_Action__removeRequest(aRequest) {
            let action = this;
            if (aRequest) {
                let index = this._requests.indexOf(aRequest);
                if (index > -1) {
                    this._requests[index].removeListener("changed", action);
                    this._requests[index] = null;
                }
                return;
            }
            this._requests.forEach(function (cachedResource, i) {
                if (cachedResource) {
                    cachedResource.removeListener("changed", action);
                }
            });
            this._requests = [];
        },
        _update: function Export_WIIDDataContainer_Action__update() {
            let targetIndex = this._currentRequestExecuted;
            let request = this._requests[targetIndex];
            let config = this._config[targetIndex];
            if (request) {
                let url = request.descriptor.url;
                let targetURL = typeof config.url == "function" ? config.url(this._parent.WIID, this.action) : config.url;
                if (url == targetURL) {
                    if (this._forcing) {
                        request.update(true, true);
                    } else {
                        this._currentRequestExecuted = 0;
                    }
                    return;
                }
                this._removeRequest(request);
            }
            request = this._createRequest(this._config[targetIndex]);
            if (!request) {
                let wiid = this._parent.WIID;
                let prevConfig = this._config[targetIndex - 1];
                let result = prevConfig.errback ? prevConfig.errback(null, wiid, this.action) : prevConfig.callback(null, wiid, this.action);
                this._setServerData(common.utils.copy(result, this.data || Object.create(null)));
                if (prevConfig.onFail) {
                    prevConfig.onFail(wiid, this.action, this.data);
                } else {
                    prevConfig.onSuccess(wiid, this.action, this.data);
                }
                this._currentRequestExecuted--;
                return;
            }
            if (this._requests[targetIndex] === null) {
                this._requests[targetIndex] = request;
            } else {
                this._requests.splice(targetIndex, 0, request);
            }
            if (request.dataIsReady) {
                this.observe(request, "changed");
            }
        },
        update: function Export_WIIDDataContainer_Action_update(force) {
            if (this._currentRequestExecuted) {
                if (!force) {
                    return;
                } else {
                    this._currentRequestExecuted = 0;
                }
            }
            if (force) {
                this._forcing = true;
            }
            this._update();
        },
        observe: function Export_WIIDDataContainer_Action_observe(subject, topic, data) {
            let requestIndex = this._requests.indexOf(subject);
            let currentIndex = this._currentRequestExecuted;
            let wiid = this._parent.WIID;
            if (currentIndex && requestIndex > currentIndex) {
                return;
            }
            let isLastRequest = requestIndex + 1 == this._config.length;
            let maintainQueue = !!(this._forcing || this._initialUpdate);
            if (maintainQueue) {
                if (currentIndex != requestIndex) {
                    return;
                }
                if (requestIndex == 0) {
                    this._resetData();
                }
            }
            let config = this._config[requestIndex];
            if (subject.statusCode >= 200 && subject.statusCode < 400) {
                let result = config.callback(subject, wiid, this.action);
                this._setServerData(common.utils.copy(result, this.data || Object.create(null)));
            } else {
                let result = config.errback ? config.errback(subject, wiid, this.action) : config.callback(subject, wiid, this.action);
                this._setServerData(common.utils.copy(result, this.data || Object.create(null)));
                this._setError(ERRORS.SERVER_RESPONSE_ERROR);
                for (let j = this._requests.length - 1; j > requestIndex; j--) {
                    let req = this._requests[j];
                    if (req) {
                        this._removeRequest(req);
                    }
                }
                if (config.onFail) {
                    config.onFail(wiid, this.action, this.data);
                } else {
                    config.onSuccess(wiid, this.action, this.data);
                }
                return;
            }
            if (isLastRequest) {
                this._currentRequestExecuted = 0;
                this._initialUpdate = false;
                this._forcing = false;
                this._onUpdate();
                config.onSuccess(wiid, this.action, this.data);
            } else {
                this._currentRequestExecuted = requestIndex + 1;
                this._update();
            }
        },
        _onUpdate: function () {
            this._lastUpdate = Date.now();
            this._resetError();
        }
    };
    return Export;
};
