(function () {
    "use strict";
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:sovetnik:event";
    const DEBUG = false;
    function log(msg) {
        if (!DEBUG) {
            return;
        }
        msg = "sovetnik :: " + msg;
        if (typeof console === "object") {
            console.log(msg);
        } else {
            dump(msg + "\n");
        }
    }
    function wrapObject(obj, context) {
        if (!obj || typeof obj !== "object") {
            return obj;
        }
        let objectAdapter = Cu.createObjectIn(context);
        let genPropDesc = function (key) {
            let value;
            if (typeof obj[key] === "function") {
                value = obj[key].bind(obj);
            } else {
                value = obj[key];
            }
            return {
                enumerable: true,
                configurable: false,
                writable: false,
                value: value
            };
        };
        let properties = {};
        Object.keys(obj).forEach(key => {
            properties[key] = genPropDesc(key);
        });
        Object.defineProperties(objectAdapter, properties);
        Cu.makeObjectPropsNormal(objectAdapter);
        return Object.freeze(objectAdapter);
    }
    ;
    let sovetnik = {
        handleEvent: function (event) {
            switch (event.type) {
            case "DOMContentLoaded":
                this._setupPageEnvironment(event.originalTarget);
                break;
            default:
                break;
            }
        },
        _isBlacklistedHost: function (host) {
            return syncGetData({
                type: "isBlacklistedHost",
                host: host
            });
        },
        _setupPageEnvironment: function (doc) {
            let win = doc.defaultView;
            if (!win || win !== win.top || !doc.body || !/^https?:/.test(doc.location.protocol)) {
                return;
            }
            if (this._isBlacklistedHost(doc.location.host.replace(/^www\./, ""))) {
                return;
            }
            this._setupPageObject(doc);
            this._setupPageScripts(doc);
        },
        _setupPageObject: function () {
            log("Setup page object");
            let win = content.window;
            if ("exportFunction" in Cu) {
                let objectAdapter = Cu.createObjectIn(win, { defineAs: "yandexElementsSovetnik" });
                Object.keys(yandexElementsSovetnikPageObject).forEach(key => {
                    let prop = yandexElementsSovetnikPageObject[key];
                    if (typeof prop === "function") {
                        Cu.exportFunction(prop, objectAdapter, { defineAs: key });
                    } else {
                        Object.defineProperty(objectAdapter, key, { value: prop });
                    }
                });
                Cu.makeObjectPropsNormal(objectAdapter);
            } else {
                if (!win.wrappedJSObject) {
                    win = new XPCNativeWrapper(win);
                }
                win = win.wrappedJSObject;
                let yandexElementsSovetnikWrapped = wrapObject(yandexElementsSovetnikPageObject, win);
                Object.defineProperty(win, "yandexElementsSovetnik", {
                    enumerable: true,
                    configurable: false,
                    writable: false,
                    value: yandexElementsSovetnikWrapped
                });
            }
            log("Setup page object done");
        },
        _setupPageScripts: function () {
            log("Setup page scripts");
            this._injectScripts();
        },
        _injectScripts: function () {
            let scriptText = syncGetData({ type: "getScriptText" });
            this._createScriptNode({ scriptText: scriptText });
            log("Scripts injected");
        },
        _createScriptNode: function ({id, url, scriptText}) {
            let script = content.document.createElement("script");
            script.setAttribute("type", "application/javascript;version=1.8");
            script.setAttribute("charset", "utf-8");
            script.async = false;
            if (id) {
                script.setAttribute("id", id);
            }
            if (url) {
                script.setAttribute("src", url);
            }
            if (scriptText) {
                script.innerHTML = scriptText;
            }
            if (content.document.head) {
                content.document.head.appendChild(script);
            }
            return script;
        }
    };
    let yandexElementsSovetnikPageObject = {
        setValue: function (name, value) {
            sendSyncMessage(EVENT_MESSAGE_NAME, {
                type: "setValue",
                name: name,
                value: value
            });
        },
        getValue: function (name) {
            return syncGetData({
                type: "getValue",
                name: name
            }) || "";
        },
        getSetting: function (name) {
            return syncGetData({
                type: "getSetting",
                name: name
            }) || "";
        },
        isStatEnabled: function () {
            return syncGetData({ type: "isStatEnabled" });
        },
        getSelector: function (domain) {
            return syncGetData({
                type: "getSelector",
                domain: domain
            });
        },
        getBlacklist: function () {
            return syncGetData({ type: "getBlacklist" });
        },
        showPreferences: function () {
            sendAsyncMessage(EVENT_MESSAGE_NAME, { type: "showPreferences" });
        }
    };
    function syncGetData(properties) {
        let result = sendSyncMessage(EVENT_MESSAGE_NAME, properties)[0];
        if (!("cloneInto" in Cu)) {
            return wrapObject(result, content.window);
        }
        return Cu.cloneInto(result, content.window);
    }
    ["DOMContentLoaded"].forEach(function (eventType) {
        addEventListener(eventType, sovetnik, false);
    });
}());
