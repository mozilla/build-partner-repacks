"use strict";
let EXPORTED_SYMBOLS = ["WPage"];
let {Service} = require("service");
let {Auth, LOGIN_STATES} = require("auth");
let {Observers} = require("observers");
let VB_EXTENSION_ID = "vb@yandex.ru";
let SYNC_PAGE_URL = "bar:sync";
let authListener = {
    _enabled: false,
    enable: function authListener_enable() {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        Observers.add("ybar:esync:auth:changed", this);
        let E10SUtils;
        try {
            E10SUtils = Cu.import("resource:///modules/E10SUtils.jsm", {}).E10SUtils;
        } catch (e) {
        }
        if (E10SUtils) {
            let originalShouldBrowserBeRemote = E10SUtils.shouldBrowserBeRemote;
            E10SUtils.shouldBrowserBeRemote = function hiddenTabManager_shouldBrowserBeRemote(url) {
                if (url && url.toLowerCase() === SYNC_PAGE_URL) {
                    return false;
                }
                return originalShouldBrowserBeRemote.apply(E10SUtils, arguments);
            };
        }
    },
    disable: function authListener_disable() {
        if (!this._enabled) {
            return;
        }
        this._enabled = false;
        Observers.remove("ybar:esync:auth:changed", this);
    },
    observe: function authListener_observe(eventData) {
        switch (eventData.state) {
        case LOGIN_STATES.NO_AUTH:
            emitToWindows("init", {
                synced: false,
                username: Auth.token.username || null,
                settings: null,
                error: null,
                captchaKey: Auth.captcha && Auth.captcha.key || null,
                captchaURL: Auth.captcha && Auth.captcha.url || null
            });
            break;
        case LOGIN_STATES.AUTH: {
                let neverHasAuthBefore = Auth.neverHasAuthBefore;
                let inviteToYaDisk = null;
                let getYandexDiskVersionPromise;
                if (neverHasAuthBefore) {
                    getYandexDiskVersionPromise = getYandexDiskVersion;
                } else {
                    let defer = new NativeAPI.Promise.defer();
                    defer.resolve(null);
                    getYandexDiskVersionPromise = function getYandexDiskVersionPromise() {
                        return defer.promise;
                    };
                }
                getYandexDiskVersionPromise().then(function (diskVersion) {
                    if (diskVersion !== null) {
                        inviteToYaDisk = Services.vc.compare(diskVersion, "0.9.1") < 0;
                    }
                    return WPage.getServicesState();
                }).then(function (settings) {
                    emitToWindows("init", {
                        synced: true,
                        username: eventData.username,
                        settings: settings,
                        error: neverHasAuthBefore ? 2 : null,
                        yadisk: inviteToYaDisk
                    });
                });
                break;
            }
        case LOGIN_STATES.EXPIRED:
            emitToWindows("init", {
                synced: false,
                username: Auth.token.username || null,
                settings: null,
                error: 3
            });
            break;
        case LOGIN_STATES.CREDENTIALS_ERROR:
            emitToWindows("error", { code: 0 });
            break;
        case LOGIN_STATES.NETWORK_ERROR:
            emitToWindows("error", { code: 1 });
            break;
        case LOGIN_STATES.CAPTCHA_REQUIRED:
            emitToWindows("error", {
                code: 5,
                captchaURL: Auth.captcha.url,
                captchaKey: Auth.captcha.key
            });
            break;
        case LOGIN_STATES.UNKNOWN_ERROR:
            emitToWindows("error", { code: 4 });
            break;
        }
    }
};
let barProtocolHandler = {
    URL_PATH: SYNC_PAGE_URL.split("bar:")[1],
    newURI: function BarPH_newURI(aSpec, aOriginCharset, aBaseURI, aSimpleURI) {
        if (!aBaseURI && this.canHandlePath(aSimpleURI.path)) {
            windowMediatorListener.enable();
            return aSimpleURI;
        }
        if (aBaseURI && this.canHandlePath(aBaseURI.path)) {
            return this._makeWPURI(aSpec, aOriginCharset, null);
        }
        return null;
    },
    newChannel: function BarPH_newChannel(aURI) {
        if (!this.canHandlePath(aURI.path)) {
            return null;
        }
        let baseURI = this._makeWPURI("", null, null);
        let uri = this._makeWPURI("index.html", null, baseURI);
        let channel = Services.io.newChannelFromURI(uri);
        channel.originalURI = aURI;
        return channel;
    },
    canHandlePath: function BarPH_canHandlePath(aPath) {
        return aPath.toLowerCase() === this.URL_PATH;
    },
    _makeWPURI: function BarPH__makeURI(aTarget, aOriginCharset, aBaseURI) {
        let spec = NativeAPI.Package.resolvePath("/content/wpage/") + aTarget;
        return Services.io.newURI(spec, aOriginCharset, aBaseURI);
    }
};
let windowMediatorListener = {
    _enabled: false,
    enable: function WML_enable() {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        this._browserWindows.forEach(function (browserWindow) {
            this._addDOMContentLoadedListener(browserWindow);
        }, this);
        Services.ww.registerNotification(this);
    },
    disable: function WML_disable() {
        if (!this._enabled) {
            return;
        }
        this._enabled = false;
        Services.ww.unregisterNotification(this);
        this._browserWindows.forEach(function (browserWindow) {
            this._removeDOMContentLoadedListener(browserWindow);
        }, this);
    },
    observe: function WML_observe(aSubject, aTopic, aData) {
        aSubject.addEventListener("load", this, false);
    },
    handleEvent: function WML_handleEvent(aEvent) {
        let win = aEvent.target.defaultView;
        switch (aEvent.type) {
        case "load":
            win.removeEventListener("load", this, false);
            this._addDOMContentLoadedListener(win);
            break;
        case "unload":
            win.removeEventListener("unload", this, false);
            this._removeDOMContentLoadedListener(win);
            break;
        }
    },
    _getWindowListener: function WML_getWindowListener(aWindow) {
        try {
            return NativeAPI.Browser.getWindowListener(aWindow);
        } catch (e) {
        }
        return null;
    },
    _addDOMContentLoadedListener: function WML__addDOMContentLoadedListener(aWindow) {
        let winListener = this._getWindowListener(aWindow);
        if (winListener) {
            winListener.addListener("DOMContentLoaded", windowEventsListener);
        }
    },
    _removeDOMContentLoadedListener: function WML__removeDOMContentLoadedListener(aWindow) {
        let winListener = this._getWindowListener(aWindow);
        if (winListener) {
            winListener.removeListener("DOMContentLoaded", windowEventsListener);
        }
    },
    get _browserWindows() {
        let windows = [];
        let wndEnum = Services.wm.getEnumerator("navigator:browser");
        while (wndEnum.hasMoreElements()) {
            windows.push(wndEnum.getNext());
        }
        return windows;
    }
};
function emitToWindows(messageName, data) {
    getBarSyncWindows().forEach(function (window) {
        if (!window.platform) {
            return;
        }
        try {
            window.platform.onMessage.execListeners({
                message: messageName,
                data: data
            });
        } catch (e) {
            NativeAPI.logger.warn("Error while send message to the 'bar:sync' page.");
            NativeAPI.logger.debug(e);
        }
    });
}
function removeBarSyncTabs() {
    let browserEnumerator = Services.wm.getEnumerator("navigator:browser");
    while (browserEnumerator.hasMoreElements()) {
        let chromeWin = browserEnumerator.getNext();
        let gBrowser = chromeWin.gBrowser;
        let containerNodes = gBrowser.mTabContainer.childNodes;
        let tabsLength = containerNodes.length;
        for (let i = containerNodes.length - 1; i >= 0; i--) {
            let browser = gBrowser.getBrowserForTab(containerNodes[i]);
            if (browser.currentURI.spec !== SYNC_PAGE_URL) {
                continue;
            }
            if (--tabsLength === 0) {
                chromeWin.BrowserOpenTab();
            }
            gBrowser.removeTab(containerNodes[i]);
        }
    }
}
function browserOpenTab() {
    let browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    if (browserWindow) {
        browserWindow.BrowserOpenTab();
    }
}
function getBarSyncWindows() {
    let browserEnumerator = Services.wm.getEnumerator("navigator:browser");
    let windows = [];
    while (browserEnumerator.hasMoreElements()) {
        let tabbrowser = browserEnumerator.getNext().gBrowser;
        for (let i = 0, len = tabbrowser.browsers.length; i < len; i++) {
            let browser = tabbrowser.getBrowserAtIndex(i);
            if (browser.currentURI.spec !== SYNC_PAGE_URL) {
                continue;
            }
            windows.push(browser.contentWindow.wrappedJSObject);
        }
    }
    return windows;
}
let windowEventsListener = {
    observe: function WindowEventsListener_observe(aSubject, aTopic, aData) {
        if (aTopic !== "DOMContentLoaded") {
            return;
        }
        if (aData.url !== SYNC_PAGE_URL) {
            return;
        }
        aData.tab.contentWindow.wrappedJSObject.platform = new pageObject();
    }
};
function pageObject() {
    this.onMessage = new pageObjectMessageManager();
}
pageObject.prototype = {
    sendMessage: function pageObject_sendMessage(message) {
        this._handleEvent(message);
    },
    onMessage: null,
    get language() {
        let language = NativeAPI.Environment.addon.locale.language || "ru";
        this.__defineGetter__("language", function pageObject_language() {
            return language;
        });
        return this.language;
    },
    get brandID() {
        let brandID = "yandex";
        try {
            let listener = {
                observeServiceEvent: function () {
                }
            };
            let service = NativeAPI.Services.obtainService("ru.yandex.custombar.branding", "package", listener);
            try {
                brandID = String(service && service.getBrandID() || brandID);
            } finally {
                NativeAPI.Services.releaseService("ru.yandex.custombar.branding", "package", listener);
            }
        } catch (ex) {
        }
        this.__defineGetter__("brandID", function pageObject_brandID() {
            return brandID;
        });
        return this.brandID;
    },
    get os() {
        return NativeAPI.Environment.os.name;
    },
    _handleEvent: function pageObject__handleEvent(message) {
        switch (message.message) {
        case "ready":
            this._requestInit();
            break;
        case "login":
            this._login(message);
            break;
        case "saveSettings":
            this._saveSettings(message);
            break;
        case "logout":
            this._logout();
            break;
        case "deleteData":
            this._drop();
            break;
        default:
            NativeAPI.logger.warn("Unknown message '" + message.message + "'");
            break;
        }
    },
    _requestInit: function pageObject__requestInit() {
        let synced = false;
        let username = Auth.token.username || null;
        let error = null;
        if (Auth.authorized) {
            synced = true;
        } else if (Auth.expired) {
            error = 3;
        }
        WPage.getServicesState().then(function (settings) {
            this.onMessage.execListeners({
                message: "init",
                data: {
                    synced: synced,
                    username: username,
                    settings: settings,
                    error: error,
                    captchaKey: Auth.captcha && Auth.captcha.key || null,
                    captchaURL: Auth.captcha && Auth.captcha.url || null
                }
            });
        }.bind(this));
    },
    _login: function pageObject__login(message) {
        let data = message.data;
        Auth.login(data.username, data.password, data.captchaKey, data.captchaAnswer);
    },
    _logout: function pageObject__logout() {
        Auth.logout();
        require("sync").Sync.cleanClient();
    },
    _drop: function pageObject__drop() {
        require("sync").Sync.drop();
    },
    _saveSettings: function pageObject__saveSettings(message) {
        WPage.setServicesState(message.data.settings);
        browserOpenTab();
        removeBarSyncTabs();
    }
};
function pageObjectMessageManager() {
    this._listeners = [];
}
pageObjectMessageManager.prototype = {
    addListener: function pageObjectMessageManager_addListener(aListener) {
        if (!this._listeners.some(function (listener) {
                return listener === aListener;
            })) {
            this._listeners.push(aListener);
        }
    },
    removeListener: function pageObjectMessageManager_removeListener(aListener) {
        this._listeners = this._listeners.filter(function (listener) {
            return listener !== aListener;
        });
    },
    execListeners: function pageObjectMessageManager_execListeners(data) {
        this._listeners.forEach(function (listener) {
            listener(data);
        });
    }
};
let WPage = {
    init: function WPage_init() {
        authListener.enable();
        NativeAPI.Protocols.addBarHandler(barProtocolHandler);
        onShutdown.add(this.finalize.bind(this));
    },
    finalize: function WPage_finalize() {
        authListener.disable();
        NativeAPI.Protocols.removeBarHandler(barProtocolHandler);
        windowMediatorListener.disable();
        removeBarSyncTabs();
    },
    getServicesState: function WPage_getServicesState() {
        let settings = {};
        let enabledEngines = Service.engineManager.enabledEngines;
        let defer = new NativeAPI.Promise.defer();
        let totalEnginesAvailable = Object.keys(this.ENGINE_MAP).length;
        let totalEnginesParsed = 0;
        for (let [
                    key,
                    value
                ] in Iterator(this.ENGINE_MAP)) {
            let enabled = true;
            if (Array.isArray(value)) {
                if (key === "vb") {
                    (function (key, value) {
                        const AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm", {}).AddonManager;
                        AddonManager.getAddonByID(VB_EXTENSION_ID, function (addonData) {
                            let vbInstalled = addonData && addonData.installDate && addonData.isActive;
                            if (!vbInstalled) {
                                totalEnginesParsed += 1;
                                if (totalEnginesParsed === totalEnginesAvailable) {
                                    defer.resolve(settings);
                                    return;
                                }
                            }
                            let enabled = true;
                            for (let i in value) {
                                enabled = enabled && enabledEngines.indexOf(value[i]) !== -1;
                            }
                            settings[key] = enabled;
                            totalEnginesParsed += 1;
                            if (totalEnginesParsed === totalEnginesAvailable) {
                                defer.resolve(settings);
                            }
                        });
                    }(key, value));
                } else {
                    for (let i in value) {
                        enabled = enabled && enabledEngines.indexOf(value[i]) !== -1;
                    }
                    settings[key] = enabled;
                    totalEnginesParsed += 1;
                }
            } else {
                enabled = enabledEngines.indexOf(value) !== -1;
                settings[key] = enabled;
                totalEnginesParsed += 1;
            }
        }
        if (totalEnginesParsed === totalEnginesAvailable) {
            defer.resolve(settings);
        }
        return defer.promise;
    },
    setServicesState: function WPage_setServicesState(aSettings) {
        for (let [
                    engineName,
                    engineEnabled
                ] in Iterator(aSettings)) {
            let engineNames = this.ENGINE_MAP[engineName];
            if (!engineNames) {
                continue;
            }
            if (engineEnabled) {
                Service.engineManager.register(engineNames);
            } else {
                Service.engineManager.unregister(engineNames);
            }
        }
    },
    ENGINE_MAP: {
        forms: "Autofill",
        vb: [
            "Pinned",
            "Tophistory"
        ],
        bookmarks: "Bookmarks",
        passwords: [
            "Nigori",
            "Passwords"
        ],
        history: "Typedurls"
    },
    URL: SYNC_PAGE_URL
};
function getYandexDiskVersion() {
    let diskVersion = null;
    let defer = new NativeAPI.Promise.defer();
    if ([
            "mac",
            "windows"
        ].indexOf(NativeAPI.Environment.os.name) === -1) {
        defer.resolve(diskVersion);
    } else {
        switch (NativeAPI.Environment.os.name) {
        case "windows": {
                let regPath = "Software\\Yandex\\Yandex.Disk.Installer3";
                let regName = "FullVersion";
                if ("WinReg" in NativeAPI) {
                    diskVersion = NativeAPI.WinReg.read("HKCU", regPath, regName) || NativeAPI.WinReg.read("HKLM", regPath, regName) || "0";
                    if (!/^\d+/.test(diskVersion)) {
                        diskVersion = null;
                    }
                }
                defer.resolve(diskVersion);
                break;
            }
        case "mac": {
                let tmpDir = Services.dirsvc.get("TmpD", Ci.nsIFile);
                let tmpFile = tmpDir.clone();
                tmpFile.append("yasync-bash-out.txt");
                tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
                let args = [
                    "-c",
                    "IFS=$'\n'; for f in $(mdfind \"kMDItemCFBundleIdentifier=ru.yandex.desktop.disk\"); " + " do defaults read \"$f/Contents/Info.plist\" CFBundleShortVersionString 2> /dev/null; " + " done | sort -n -r > " + tmpFile.path.replace(/\W/g, "\\$&")
                ];
                let bashFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                bashFile.initWithPath("/bin/bash");
                let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                try {
                    process.init(bashFile);
                    process.runAsync(args, args.length, function runBashScript_observer(subject, topic, data) {
                        if (process.exitValue === 0) {
                            try {
                                diskVersion = NativeAPI.Files.readTextFile(tmpFile).split("\n")[0] || "0";
                                if (!/^\d+/.test(diskVersion)) {
                                    diskVersion = null;
                                }
                            } catch (e) {
                                NativeAPI.logger.error("Error while read file with Yandex.Disk version.");
                                NativeAPI.logger.debug(e);
                            }
                        }
                        defer.resolve(diskVersion);
                    });
                } catch (e) {
                    NativeAPI.logger.error("Can not run process for get Yandex.Disk version.");
                    NativeAPI.logger.debug(e);
                    defer.resolve(diskVersion);
                }
                break;
            }
        }
    }
    return defer.promise;
}
WPage.init();
