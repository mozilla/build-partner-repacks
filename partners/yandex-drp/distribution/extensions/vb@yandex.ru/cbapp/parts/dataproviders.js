"use strict";
const EXPORTED_SYMBOLS = ["dataproviders"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
let dataproviders = {
    init: function (app) {
        this._application = app;
        this._logger = app.getLogger("Dataproviders");
        this._registeredProviders = Object.create(null);
    },
    finalize: function () {
        this._application = null;
        this._logger = null;
        this._registeredProviders = null;
    },
    getProvider: function (name) {
        if (!this._registeredProviders[name]) {
            this._registeredProviders[name] = new Dataprovider(name);
        }
        return this._registeredProviders[name];
    },
    _application: null,
    _logger: null,
    _registeredProviders: null
};
function Dataprovider(name) {
    this._name = name;
    this._listeners = Object.create(null);
    this._cache = Object.create(null);
    this._hostCache = Object.create(null);
    this._requestedHostToURL = Object.create(null);
}
Dataprovider.prototype = {
    constructor: Dataprovider,
    emit: function (name, target, data) {
        let listeners = this._listeners[name] = this._listeners[name] || [];
        listeners.forEach(listener => listener(name, normalizeTarget(target), data));
    },
    provideData: function (name, target, data) {
        let urlsToEmit = [];
        let normalizedTarget = normalizeTarget(target);
        if (!normalizedTarget) {
            return;
        }
        this._cache[normalizedTarget.spec] = this._cache[normalizedTarget.spec] || Object.create(null);
        this._cache[normalizedTarget.spec][name] = data;
        let host = normalizedTarget.host.replace(/^www\./, "");
        this._hostCache[host] = this._hostCache[host] || Object.create(null);
        this._hostCache[host][name] = data;
        let wwwHost = "www." + host;
        this._hostCache[wwwHost] = this._hostCache[wwwHost] || Object.create(null);
        this._hostCache[wwwHost][name] = data;
        this.emit("change", normalizedTarget, data);
        let requestedHostToURL = this._requestedHostToURL;
        if (target.host && !(target instanceof Ci.nsIURI) && host in requestedHostToURL) {
            requestedHostToURL[host].forEach(url => {
                this.emit("change", normalizeTarget(url), data);
            });
        }
    },
    get: function (name, target) {
        let normalizedTarget = normalizeTarget(target);
        if (!normalizedTarget) {
            return null;
        }
        let res;
        if (target && target.host && !(target instanceof Ci.nsIURI)) {
            res = (this._hostCache[normalizedTarget.host] || {})[name] || null;
        }
        if (res) {
            return res;
        }
        return (this._cache[normalizedTarget.spec] || {})[name] || null;
    },
    getAll: function (name) {
        return Object.keys(this._cache).map(key => this._cache[key][name]).filter(Boolean);
    },
    addListener: function (names, handler) {
        if (typeof names === "string") {
            names = [names];
        }
        names.forEach(name => {
            let listeners = this._listeners[name] = this._listeners[name] || [];
            listeners.push(handler);
        });
    },
    removeListener: function (names, handler) {
        if (typeof names === "string") {
            names = [names];
        }
        names.forEach(name => {
            let listeners = this._listeners[name] = this._listeners[name] || [];
            if (listeners.indexOf(handler) !== -1) {
                listeners.splice(listeners.indexOf(handler), 1);
            }
        });
    },
    requestData: function (target, data) {
        let normalizedTarget = normalizeTarget(target);
        if (!normalizedTarget) {
            return;
        }
        if (typeof target === "string" || target instanceof Ci.nsIURI || target.url) {
            let host = normalizedTarget.host.replace(/^www\./, "");
            let requestedHostToURL = this._requestedHostToURL;
            requestedHostToURL[host] = requestedHostToURL[host] || [];
            if (requestedHostToURL[host].indexOf(normalizedTarget.spec) === -1) {
                requestedHostToURL[host].push(normalizedTarget.spec);
            }
        }
        this.emit("request", normalizedTarget, data);
    }
};
function normalizeTarget(raw) {
    let res;
    if (raw === null || raw === undefined) {
        res = null;
    } else if (raw instanceof Ci.nsIURI) {
        res = raw.clone();
    } else if (typeof raw === "object") {
        if (raw.host) {
            res = newURI("http://" + raw.host);
        } else if (raw.url) {
            res = newURI(raw.url);
        }
    } else if (typeof raw === "string") {
        res = newURI(raw);
    }
    if (!res && res !== null) {
        throw new Error("Cannot resolve target: " + raw);
    }
    return res;
}
let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
function fixURI(uri) {
    let fixedURI = Object.create(uri);
    fixedURI.__defineGetter__("isInternalURL", () => true);
    fixedURI.__defineGetter__("sourceURI", () => uri);
    fixedURI.__defineGetter__("host", () => fixedURI.spec);
    fixedURI.__defineGetter__("asciiHost", () => fixedURI.host);
    fixedURI.__defineGetter__("clone", () => () => fixURI(uri.clone()));
    return fixedURI;
}
function newURI(url) {
    let uri;
    let host;
    try {
        uri = ioService.newURI(url, null, null);
        host = uri.host;
    } catch (err) {
        if (!uri) {
            return null;
        }
    }
    if (!host && dataproviders._application) {
        uri = fixURI(uri);
    }
    return uri;
}
