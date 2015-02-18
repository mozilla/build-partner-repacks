"use strict";
const EXPORTED_SYMBOLS = ["contentEnvironment"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const contentEnvironment = {
    init: function contentEnvironment_init(application) {
        this._logger = application.getLogger("ContentEnvironment");
        this._application = application;
        this._windowProvidersMap = new WeakMap();
        this._platformObjectProviders = [];
        Services.obs.addObserver(this, this._consts.GLOBAL_CONTENT_DOC_CREATED, false);
        Services.obs.addObserver(this, this._consts.GLOBAL_CHROME_DOC_CREATED, false);
        windowMediatorListener.enable();
    },
    finalize: function contentEnvironment_finalize() {
        windowMediatorListener.disable();
        Services.obs.removeObserver(this, this._consts.GLOBAL_CONTENT_DOC_CREATED, false);
        Services.obs.removeObserver(this, this._consts.GLOBAL_CHROME_DOC_CREATED, false);
        this._platformObjectProviders = null;
        this._windowProvidersMap = null;
        this._logger = null;
        this._application = null;
    },
    addPlatformObjectProvider: function contentEnvironment_addPlatformObjectProvider(provider) {
        if (typeof provider.getListenerForPage !== "function") {
            throw new Error("Bad window object provider interface (no 'getListenerForPage' method).");
        }
        this._platformObjectProviders.push(provider);
    },
    removePlatformObjectProvider: function contentEnvironment_removePlatformObjectProvider(provider) {
        this._platformObjectProviders = this._platformObjectProviders.filter(p => p !== provider);
    },
    observe: function contentEnvironment_observe(subject, topic, data) {
        switch (topic) {
        case this._consts.GLOBAL_CHROME_DOC_CREATED:
        case this._consts.GLOBAL_CONTENT_DOC_CREATED:
            subject.QueryInterface(Ci.nsIDOMWindow);
            this._setupInnerBrowser(subject, undefined);
            break;
        }
    },
    _consts: {
        GLOBAL_CONTENT_DOC_CREATED: "content-document-global-created",
        GLOBAL_CHROME_DOC_CREATED: "chrome-document-global-created"
    },
    _setupInnerBrowser: function contentEnvironment__setupInnerBrowser(window, metaContent) {
        if (window !== window.top) {
            return;
        }
        let pageURL = window.document.documentURI;
        let providersForPage = this._platformObjectProviders.map(function (provider) {
            try {
                return provider.getListenerForPage({
                    url: pageURL,
                    meta: metaContent
                });
            } catch (e) {
            }
            return false;
        }).filter(function (provider) {
            return provider && typeof provider === "object";
        });
        if (!providersForPage.length) {
            return;
        }
        let windowProvidersMap = this._windowProvidersMap;
        function checkWindowDataExists() {
            let windowData = windowProvidersMap.get(window);
            if (!windowData) {
                windowProvidersMap.set(window, {
                    providers: [],
                    messageListeners: []
                });
            }
        }
        function getProviders() {
            checkWindowDataExists();
            return windowProvidersMap.get(window).providers;
        }
        function getMessageListeners() {
            checkWindowDataExists();
            return windowProvidersMap.get(window).messageListeners;
        }
        let currentProvidersForPage = getProviders();
        if (currentProvidersForPage) {
            providersForPage = providersForPage.concat(currentProvidersForPage);
        }
        windowProvidersMap.set(window, {
            providers: providersForPage,
            messageListeners: getMessageListeners()
        });
        function copyObj(src) {
            if (typeof src !== "object" || !src) {
                return src;
            }
            if (Array.isArray(src)) {
                return src.map(el => copyObj(el));
            }
            let dataCopy = Cu.createObjectIn(window);
            for (let [
                        name,
                        value
                    ] in Iterator(src)) {
                dataCopy[name] = copyObj(value);
            }
            Cu.makeObjectPropsNormal(dataCopy);
            return dataCopy;
        }
        getProviders().forEach(function (provider) {
            provider.sendPageMessage = function (name, data) {
                getMessageListeners().forEach(function (listener) {
                    try {
                        listener.apply(listener, [
                            name,
                            copyObj(data)
                        ]);
                    } catch (e) {
                        Cu.reportError(e);
                    }
                });
            };
        });
        let wrappedWindowObject = window.wrappedJSObject || new XPCNativeWrapper(window).wrappedJSObject;
        wrappedWindowObject.__defineGetter__("elementsPlatform", function () {
            let elementsPlatformObject = Cu.createObjectIn(window);
            function genPropDesc(value) {
                return {
                    enumerable: true,
                    configurable: false,
                    writable: false,
                    value: value
                };
            }
            let propList = {
                language: genPropDesc(contentEnvironment._application.locale.language),
                brandID: genPropDesc(contentEnvironment._application.branding.brandID),
                navigate: genPropDesc(function (url, target) {
                    if (url === "about:tabs") {
                        url = "yafd:tabs";
                        Cu.import("resource://gre/modules/AddonManager.jsm", {}).AddonManager.getAddonByID("vb@yandex.ru", function (aAddon) {
                            if (!aAddon || !aAddon.isActive) {
                                switch (contentEnvironment._application.branding.brandID) {
                                case "ua":
                                    url = "http://visual.yandex.ua/";
                                    break;
                                case "tb":
                                    url = "http://visual.yandex.com.tr/";
                                    break;
                                default:
                                    url = "http://visual.yandex.ru/";
                                    break;
                                }
                            }
                            this.navigate(url, target);
                        }.bind(elementsPlatformObject));
                        return;
                    }
                    switch (target) {
                    case "new tab":
                    case "new window":
                        contentEnvironment._application.core.Lib.misc.navigateBrowser({
                            url: url,
                            target: target
                        });
                        break;
                    case "current tab":
                    default:
                        window.location = url;
                        break;
                    }
                }),
                sendMessage: genPropDesc(function (name, data) {
                    let hasAnyAnswer = false;
                    let providersForPage = getProviders();
                    for (let i = 0, len = providersForPage.length; i < len; i++) {
                        let provider = providersForPage[i];
                        if (typeof provider.onPageMessage !== "function") {
                            continue;
                        }
                        try {
                            let result = provider.onPageMessage(name, data);
                            if (typeof result === "boolean") {
                                hasAnyAnswer = true;
                                if (result) {
                                    return true;
                                }
                            }
                        } catch (e) {
                            Cu.reportError(e);
                        }
                    }
                    return hasAnyAnswer;
                }),
                addListener: genPropDesc(function (listener) {
                    let messageListeners = getMessageListeners();
                    if (messageListeners.indexOf(listener) === -1) {
                        messageListeners.push(listener);
                    }
                }),
                removeListener: genPropDesc(function (listener) {
                    let pageMessageListeners = getMessageListeners();
                    pageMessageListeners = pageMessageListeners.filter(l => l !== listener);
                }),
                queryObject: genPropDesc(function (name) {
                    let providersForPage = getProviders();
                    for (let i = 0, len = providersForPage.length; i < len; i++) {
                        let provider = providersForPage[i];
                        if (typeof provider.onQueryObject !== "function") {
                            continue;
                        }
                        try {
                            let obj = provider.onQueryObject(name);
                            if (obj && typeof obj === "object") {
                                return copyObj(obj);
                            }
                        } catch (e) {
                            Cu.reportError(e);
                        }
                    }
                    return null;
                }),
                __exposedProps__: genPropDesc({
                    language: "r",
                    brandID: "r",
                    navigate: "r",
                    sendMessage: "r",
                    addListener: "r",
                    removeListener: "r",
                    queryObject: "r"
                })
            };
            Object.defineProperties(elementsPlatformObject, propList);
            Cu.makeObjectPropsNormal(elementsPlatformObject);
            delete this.elementsPlatform;
            return this.elementsPlatform = elementsPlatformObject;
        });
        window.addEventListener("unload", function unloadHandler(event) {
            event.currentTarget.removeEventListener("unload", unloadHandler, false);
            getProviders().forEach(function (provider) {
                if (typeof provider.onDestroy !== "function") {
                    return;
                }
                try {
                    provider.onDestroy();
                } catch (e) {
                    Cu.reportError(e);
                }
            });
            delete wrappedWindowObject.elementsPlatform;
            windowProvidersMap.delete(window);
        }, false);
    },
    _platformObjectProviders: null
};
const windowMediatorListener = {
    enable: function WML_enable() {
        Services.ww.registerNotification(this);
    },
    disable: function WML_disable() {
        Services.ww.unregisterNotification(this);
    },
    observe: function WML_observe(subject, topic, data) {
        subject.addEventListener("load", this, false);
    },
    handleEvent: function WML_handleEvent(event) {
        let win = event.target.defaultView;
        switch (event.type) {
        case "load":
            win.removeEventListener("load", this, false);
            win.addEventListener("unload", function WML_win_onUnload() {
                win.removeEventListener("unload", WML_win_onUnload, false);
                win.removeEventListener("DOMContentLoaded", windowEventsListener, false);
            }, false);
            win.addEventListener("DOMContentLoaded", windowEventsListener, false);
            break;
        }
    }
};
const windowEventsListener = {
    handleEvent: function windowEventsListener_handleEvent(event) {
        if (event.type !== "DOMContentLoaded") {
            throw new Error("Unexpected event type ('" + event.type + "')");
        }
        let window = event.target.defaultView;
        if (!window || window !== window.top) {
            return;
        }
        let pageURL = window.document.documentURI;
        if (/^https?:\/\//.test(pageURL)) {
            if (!/^https?:\/\/([^\/]+\.)?(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|kinopoisk|moikrug)\.ru)\//i.test(pageURL)) {
                return;
            }
        } else {
            if (!/^(about|bar|yafd):/.test(pageURL)) {
                return;
            }
        }
        let elementsPlatformMeta = window.document.querySelector("head > meta[name='yandex-require-elements-platform']");
        if (elementsPlatformMeta) {
            contentEnvironment._setupInnerBrowser(window, elementsPlatformMeta.getAttribute("content") || "");
        }
    }
};
