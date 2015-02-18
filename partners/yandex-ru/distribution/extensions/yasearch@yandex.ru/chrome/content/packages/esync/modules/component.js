"use strict";
let EXPORTED_SYMBOLS = ["SyncComponent"];
let SyncComponent = {
    VERSION: 1,
    CONTRACT_ID: "@yandex.ru/esync;1",
    CLASS_ID: Components.ID("92df3d52-a92f-11e2-a517-60334b147402"),
    CLASS_DESCRIPTION: "Sync Plugin Javascript XPCOM Component",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get wrappedJSObject() {
        return {
            get VERSION() SyncComponent.VERSION,
            getEngine: function SyncComponentWrapper_getEngine(name) {
                return SyncComponent.getEngine(name);
            },
            get username() SyncComponent.username,
            get authorized() SyncComponent.authorized,
            get expired() SyncComponent.expired,
            get SYNC_PAGE_URL() SyncComponent.SYNC_PAGE_URL
        };
    },
    createInstance: function SyncComponent_createInstance(aOuter, aIID) {
        return this.QueryInterface(aIID);
    },
    finalize: function SyncComponent_finalize() {
        for (let [
                    ,
                    engineComponent
                ] in Iterator(this._engines)) {
            engineComponent.finalize();
        }
        this._engines = Object.create(null);
    },
    get username() {
        return require("auth").Auth.token.username;
    },
    get authorized() {
        return require("auth").Auth.authorized;
    },
    get expired() {
        return require("auth").Auth.expired;
    },
    getEngine: function SyncComponent_getEngine(name) {
        name = (name || "").toLowerCase();
        if (!name) {
            return null;
        }
        if (name in this._engines) {
            return this._engines[name];
        }
        this._engines[name] = new EngineComponent(name);
        return this._engines[name];
    },
    notify: function SyncComponent_notify(engineName, topic, data) {
        engineName = (engineName || "").toLowerCase();
        if (!engineName) {
            return;
        }
        let engineComp = this._engines[engineName];
        if (!engineComp) {
            return;
        }
        try {
            engineComp.notify(topic, data);
        } catch (e) {
            NativeAPI.logger.debug("SyncComponent notify error " + engineName + " topic: " + topic + " error: " + e);
        }
    },
    get SYNC_PAGE_URL() require("wpage").WPage.URL,
    _engines: Object.create(null)
};
function EngineComponent(engineName) {
    this._engineName = engineName[0].toUpperCase() + engineName.substring(1);
    this._logger = NativeAPI.logger.getLogger("EngineComponent." + this._engineName);
    this.listeners = {};
}
EngineComponent.prototype = {
    finalize: function EngineComponent_finalize() {
        this.listeners = null;
        this._engineName = null;
        this._logger = null;
    },
    get enabled() {
        let enginePref = "engine." + this._engineName + ".enabled";
        let serviceEnabled = require("service").Service.enabled;
        return serviceEnabled && NativeAPI.Settings.getValue(enginePref);
    },
    set enabled(val) {
        let {Service} = require("service");
        if (val === true) {
            Service.engineManager.register(this._engineName);
        } else if (val === false) {
            Service.engineManager.unregister(this._engineName);
        }
    },
    get: function EngineComponent_get(key) {
        let engineName = this._engineName;
        let engine = require("service").Service.engineManager.get(engineName);
        if (!engine) {
            return false;
        }
        return engine.get && engine.get(key);
    },
    set: function EngineComponent_set(data) {
        let engineName = this._engineName;
        let engine = require("service").Service.engineManager.get(engineName);
        if (!engine) {
            return false;
        }
        return engine.set && engine.set(data);
    },
    notify: function EngineComponent_notify(topic, data) {
        let listeners = this.listeners[topic];
        if (!listeners) {
            return;
        }
        for (let i = 0, length = listeners.length; i < length; i++) {
            listeners[i].observe(this, topic, data);
        }
    },
    addListener: function EngineComponent_addListener(topic, obj) {
        if ([
                "data",
                "delete"
            ].indexOf(topic) === -1) {
            this._logger.error("Topic " + topic + " not supported");
            return;
        }
        if (!obj) {
            this._logger.error("Couldn't add listener for object: " + obj);
            return;
        }
        if (typeof obj.observe !== "function") {
            this._logger.error("Wrong interface: obj " + obj + " should implement nsIObserver interface");
            return;
        }
        let listeners = this.listeners[topic] || (this.listeners[topic] = []);
        if (listeners.indexOf(obj) === -1) {
            listeners.push(obj);
        }
    },
    removeListener: function EngineComponent_removeListener(topic, obj) {
        if ([
                "data",
                "delete"
            ].indexOf(topic) === -1) {
            this._logger.error("Topic " + topic + " not supported");
            return;
        }
        let listeners = this.listeners[topic] = this.listeners[topic] || [];
        let index = listeners.indexOf(obj);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }
};
let SyncComponentRegistar = {
    get _registered() {
        return Components.manager.QueryInterface(Ci.nsIComponentRegistrar).isCIDRegistered(SyncComponent.CLASS_ID);
    },
    _register: function SyncComponentRegistar__register() {
        if (this._registered) {
            return;
        }
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(SyncComponent.CLASS_ID, SyncComponent.CLASS_DESCRIPTION, SyncComponent.CONTRACT_ID, SyncComponent);
    },
    _unregister: function SyncComponentRegistar__unregister() {
        if (!this._registered) {
            return;
        }
        SyncComponent.finalize();
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(SyncComponent.CLASS_ID, SyncComponent);
    }
};
SyncComponentRegistar._register();
onShutdown.add(function SyncComponentRegistar_finalize() {
    return SyncComponentRegistar._unregister();
});
