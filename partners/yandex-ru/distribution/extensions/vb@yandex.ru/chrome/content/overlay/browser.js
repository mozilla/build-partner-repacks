(function () {
    "use strict";
    const {
        Cc: classes,
        Ci: interfaces,
        Cu: utils
    } = Components;
    let core = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject;
    let app = core.application;
    if (app === null) {
        return;
    }
    const OS_NAME = app.core.Lib.sysutils.platformInfo.os.name;
    const FTAB_URL = app.protocolSupport.url;
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    const PRELOAD_CHROME_URL = "chrome://yandex-vb/content/overlay/hiddenwindow.xul";
    const PRELOADER_INIT_DELAY_MS = 5000;
    const BROWSER_CONTENT_SCRIPT = "chrome://browser/content/content.js";
    const BLANK_URL = "about:blank";
    const PREF_STARTUP = {
        OPEN_HOMEPAGE: 1,
        OPEN_BLANK: 0,
        RESTORE_SESSION: 3
    };
    let keysPressed = [];
    let onShortcutPressed = function () {
        let thumbIndex = 0;
        for (let i = 0; i < keysPressed.length; i++) {
            let exponent = keysPressed.length - i - 1;
            thumbIndex += keysPressed[i] * Math.pow(10, exponent);
        }
        app.fastdial.onShortcutPressed(thumbIndex - 1);
        app.fastdial.sendRequest("modifierPressed", { pressed: false });
        keysPressed.length = 0;
    };
    let lastKeyCodePressed;
    let shortCutListener = function shortCutListener(evt) {
        if (gBrowser.selectedBrowser.currentURI.spec !== FTAB_URL) {
            return;
        }
        if (OS_NAME === "windows") {
            if (windowsShortCutListener(evt)) {
                evt.preventDefault();
            }
            return;
        }
        let isNumberCode = evt.keyCode >= 48 && evt.keyCode <= 57;
        let isModifierAlsoPressed = evt.ctrlKey && OS_NAME === "linux" || evt.altKey && OS_NAME !== "linux";
        let isModifierPressedOnly = evt.keyCode === evt.DOM_VK_CONTROL && OS_NAME === "linux" || evt.keyCode === evt.DOM_VK_ALT && OS_NAME !== "linux";
        let thumbIndex;
        switch (evt.type) {
        case "keydown":
            if (!isNumberCode) {
                app.fastdial.sendRequest("modifierPressed", { pressed: isModifierPressedOnly });
            }
            if (lastKeyCodePressed && lastKeyCodePressed === evt.keyCode) {
                evt.preventDefault();
                return;
            }
            if (!isModifierAlsoPressed || !isNumberCode || evt.keyCode === evt.DOM_VK_0 && !keysPressed.length) {
                return;
            }
            thumbIndex = evt.keyCode - 48;
            keysPressed.push(thumbIndex);
            lastKeyCodePressed = evt.keyCode;
            break;
        case "keyup":
            if (!keysPressed.length) {
                app.fastdial.sendRequest("modifierPressed", { pressed: false });
                return;
            }
            if (lastKeyCodePressed === evt.keyCode) {
                lastKeyCodePressed = null;
            }
            let isControlKeyPressed = OS_NAME === "linux" && evt.keyCode === evt.DOM_VK_CONTROL || OS_NAME !== "linux" && evt.keyCode === evt.DOM_VK_ALT;
            if (!isControlKeyPressed) {
                return;
            }
            onShortcutPressed();
            break;
        }
        evt.preventDefault();
    };
    let keyPressedTimeoutId;
    let windowsShortCutListener = function (evt) {
        let [
            evtType,
            keyCode,
            altKeyPressed
        ] = [
            evt.type,
            evt.keyCode,
            evt.altKey
        ];
        let isNumberCode = keyCode >= 48 && keyCode <= 57;
        switch (evtType) {
        case "keydown":
            if (!isNumberCode) {
                app.fastdial.sendRequest("modifierPressed", { pressed: keyCode === evt.DOM_VK_ALT });
                return false;
            }
            if (!altKeyPressed) {
                return false;
            }
            if (lastKeyCodePressed && lastKeyCodePressed === keyCode) {
                return false;
            }
            if (keyCode === 48 && !keysPressed.length) {
                return false;
            }
            app.fastdial.sendRequest("modifierPressed", { pressed: true });
            let thumbIndex = keyCode - 48;
            keysPressed.push(thumbIndex);
            lastKeyCodePressed = keyCode;
            if (keyPressedTimeoutId) {
                window.clearTimeout(keyPressedTimeoutId);
            }
            break;
        case "keyup":
            if (!isNumberCode) {
                if (keyCode === evt.DOM_VK_ALT) {
                    app.fastdial.sendRequest("modifierPressed", { pressed: false });
                }
                return false;
            }
            if (lastKeyCodePressed === keyCode) {
                lastKeyCodePressed = null;
                if (keysPressed.length === 1 && app.internalStructure.length < 10) {
                    app.fastdial.sendRequest("modifierPressed", { pressed: false });
                    onShortcutPressed();
                    return;
                }
                keyPressedTimeoutId = window.setTimeout(onShortcutPressed, 1000);
            }
            break;
        }
        return true;
    };
    let hiddenTabManager = {
        get tab() {
            return !this._tab || !this._tab.contentDocument || this._tab.contentDocument.readyState !== "complete" ? null : this._tab;
        },
        init: function hiddenTabManager_init() {
            let doc = app.core.Lib.misc.hiddenWindows.appWindow.document;
            this._iframe = doc.createElement("iframe");
            this._iframe.setAttribute("src", PRELOAD_CHROME_URL);
            doc.documentElement.appendChild(this._iframe);
            let {availWidth, availHeight} = app.core.Lib.misc.hiddenWindows.appWindow.screen;
            app.core.Lib.misc.hiddenWindows.appWindow.resizeTo(availWidth, availHeight);
            window.setTimeout(this.create.bind(this), PRELOADER_INIT_DELAY_MS);
            let originalBrowserOpenTabFn = window.BrowserOpenTab;
            let self = this;
            window.BrowserOpenTab = function BrowserOpenTab() {
                if (!self.tab) {
                    originalBrowserOpenTabFn.call(window);
                    return;
                }
                app.fastdial.onHiddenTabAction("show");
                let newTab = gBrowser.loadOneTab(FTAB_URL, { inBackground: false });
                gBrowser.swapNewTabWithBrowser(newTab, self.tab);
                let win = newTab.ownerDocument.defaultView;
                let messageManager = newTab.linkedBrowser.messageManager;
                if ("getDelayedFrameScripts" in messageManager) {
                    let scripts = "getGroupMessageManager" in win ? win.getGroupMessageManager("browsers").getDelayedFrameScripts() : win.messageManager.getDelayedFrameScripts();
                    Array.forEach(scripts, function (script) {
                        let scriptToLoad = script;
                        let runGlobal;
                        if (Array.isArray(script)) {
                            scriptToLoad = script[0];
                            runGlobal = script[1];
                        }
                        if (scriptToLoad === BROWSER_CONTENT_SCRIPT) {
                            return;
                        }
                        messageManager.loadFrameScript(scriptToLoad, true, runGlobal);
                    });
                } else {
                    messageManager.loadFrameScript("chrome://browser/content/content-sessionStore.js", true);
                    if ("TabView" in win) {
                        messageManager.loadFrameScript("chrome://browser/content/tabview-content.js", true);
                    }
                }
                self._removeBrowser();
                let evt = document.createEvent("Events");
                evt.initEvent("TabOpen", true, false);
                newTab.dispatchEvent(evt);
                window.focusAndSelectUrlBar();
                self.create();
            };
        },
        finalize: function hiddenTabManager_finalize() {
            this._tab = null;
            if (this._iframe) {
                let doc = app.core.Lib.misc.hiddenWindows.appWindow.document;
                doc.documentElement.removeChild(this._iframe);
            }
            this._iframe = null;
        },
        create: function hiddenTabManager_create() {
            let contentWindow = this._iframe.contentWindow;
            let {width, height} = typeof this._utils.getBoundsWithoutFlushing === "function" ? this._utils.getBoundsWithoutFlushing(gBrowser) : gBrowser.getBoundingClientRect();
            this._iframe.setAttribute("style", [
                "width: " + width + "px !important",
                "height: " + height + "px !important",
                "max-width: " + width + "px !important",
                "max-height: " + height + "px !important",
                "min-width: " + width + "px !important",
                "min-height: " + height + "px !important",
                "overflow: hidden"
            ].join(";"));
            this._tab = contentWindow.document.createElementNS(XUL_NS, "browser");
            this._tab.setAttribute("type", "content");
            this._tab.setAttribute("src", FTAB_URL);
            contentWindow.document.documentElement.appendChild(this._tab);
            this._tab.docShell.isActive = false;
            this._tab.messageManager.loadFrameScript(BROWSER_CONTENT_SCRIPT, true);
            this._tab.style.width = width + "px";
            this._tab.style.height = height + "px";
            app.fastdial.onHiddenTabAction("hide");
        },
        _removeBrowser: function hiddenTabManager__removeBrowser() {
            if (this._tab && this._tab.parentNode) {
                this._tab.parentNode.removeChild(this._tab);
                this._tab = null;
            }
        },
        _utils: window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils),
        _tab: null,
        _iframe: null
    };
    let overlayController = {
        init: function OverlayController_init() {
            window.gInitialPages.push(FTAB_URL);
            this._setBoostOpenTab();
            this._setBrowserOpenTab();
            this._windowListener = new app.core.Lib.WindowListener(window, app.name, app.getLogger("WindowListener"));
            gURLBar.addEventListener("keydown", shortCutListener, false);
            gURLBar.addEventListener("keyup", shortCutListener, false);
            gBrowser.tabContainer.addEventListener("TabOpen", this, false);
            gBrowser.tabContainer.addEventListener("TabClose", this, false);
            this._windowListener.addListener("PageShow", this);
        },
        finalize: function OverlayController_finalize() {
            gBrowser.tabContainer.removeEventListener("TabClose", this, false);
            gBrowser.tabContainer.removeEventListener("TabOpen", this, false);
            gURLBar.removeEventListener("keydown", shortCutListener, false);
            gURLBar.removeEventListener("keyup", shortCutListener, false);
            this._windowListener.removeListener("PageShow", this);
            this._windowListener = null;
        },
        observe: function OverlayController_observe(subject, topic, data) {
            app.screenshots.handlePageShow(data);
        },
        handleEvent: function OverlayController_handleEvent(aEvent) {
            let browser = gBrowser.getBrowserForTab(aEvent.target);
            switch (aEvent.type) {
            case "TabOpen":
                app.advertisement.handleVBPageShow();
                browser.addEventListener("keydown", shortCutListener, false);
                browser.addEventListener("keyup", shortCutListener, false);
                break;
            case "TabClose":
                app.fastdial.onTabClose();
                browser.removeEventListener("keydown", shortCutListener, false);
                browser.removeEventListener("keyup", shortCutListener, false);
                break;
            }
        },
        _setBoostOpenTab: function OverlayController__setBoostOpenTab() {
            if (BROWSER_NEW_TAB_URL !== FTAB_URL) {
                return;
            }
            if (!app.preferences.get("ftabs.preload")) {
                return;
            }
            hiddenTabManager.init();
        },
        _setBrowserOpenTab: function OverlayController__setBrowserOpenTab() {
            if (!this._cachedBrowserOpenTab) {
                this._cachedBrowserOpenTab = window.BrowserOpenTab;
            } else {
                window.BrowserOpenTab = this._cachedBrowserOpenTab;
            }
            if (this._browserOpenTabTreshold < 10) {
                this._browserOpenTabTreshold++;
                window.setTimeout(this._setBrowserOpenTab.bind(this), 1000);
            } else {
                this._cachedBrowserOpenTab = null;
            }
        },
        _replaceBlankTab: function OverlayController__replaceBlankTab() {
            let tabs = gBrowser.tabContainer.childNodes;
            if (tabs.length !== 1) {
                return;
            }
            let browser = tabs[0].linkedBrowser;
            if (!browser) {
                return;
            }
            let currentURI = browser.currentURI;
            if (!currentURI || currentURI.spec != BLANK_URL) {
                return;
            }
            let startupTypePref = core.Lib.Preferences.get("browser.startup.page");
            let startupPagePref = core.Lib.Preferences.get("browser.startup.homepage");
            if (startupTypePref === PREF_STARTUP.OPEN_HOMEPAGE && startupPagePref !== BLANK_URL) {
                return;
            }
            if (browser.webProgress.isLoadingDocument || browser.userTypedValue) {
                return;
            }
            let doc = browser.contentDocument;
            if (!doc) {
                return;
            }
            let body = doc.body;
            if (!body || body.hasChildNodes()) {
                return;
            }
            browser.loadURI(FTAB_URL, null, null, false);
        },
        get windowListener() {
            return this._windowListener;
        },
        _browserOpenTabTreshold: 0,
        _cachedBrowserOpenTab: null,
        _preloadTabTimeoutId: null,
        _hiddenTab: null
    };
    window.addEventListener("visibilitychange", function (evt) {
        if (evt.target.location.href === FTAB_URL && evt.target.hidden) {
            app.fastdial.sendRequest("action", { type: "closeSettings" });
            app.fastdial.sendRequest("modifierPressed", { pressed: false });
        }
        if (evt.target.hidden === false && evt.target.location.href === FTAB_URL) {
            let win = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentWindow;
            if (!win) {
                return;
            }
            let utils = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
            let outerWindowID = utils.outerWindowID;
        }
    }, false);
    window.addEventListener("deactivate", function (evt) {
        if (gBrowser.selectedBrowser.currentURI.spec === FTAB_URL) {
            app.fastdial.sendRequest("action", { type: "closeSettings" });
        }
        app.fastdial.sendRequest("modifierPressed", { pressed: false });
    }, false);
    window[app.name + "OverlayController"] = overlayController;
    window.addEventListener("DOMContentLoaded", function onDOMContentLoaded() {
        window.removeEventListener("DOMContentLoaded", onDOMContentLoaded, false);
        overlayController.init();
        window.addEventListener("unload", function unLoad() {
            hiddenTabManager.finalize();
            overlayController.finalize();
        }, false);
    }, false);
    window.addEventListener("load", function onWindowLoaded() {
        window.removeEventListener("load", onWindowLoaded, false);
        setTimeout(function () {
            overlayController._replaceBlankTab();
        }, 10);
    }, false);
}());
