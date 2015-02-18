"use strict";
const EXPORTED_SYMBOLS = ["WindowListener"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const ABOUT_BLANK_URI = Services.io.newURI("about:blank", null, null);
const {STATE_IS_NETWORK, STATE_START, STATE_STOP} = Ci.nsIWebProgressListener;
function warnOnceAboutWebProgress() {
    Cu.reportError("'webProgress' getter is deprecated");
    warnOnceAboutWebProgress = function _warnOnceAboutWebProgress() {
    };
}
function isCurrentTab(aTab) {
    let tabBrowser = aTab.getTabBrowser();
    return tabBrowser && tabBrowser.mCurrentBrowser === aTab;
}
function BrowserProgressListener(windowListener) {
    this._windowListener = windowListener;
}
BrowserProgressListener.prototype = {
    shutdown: function BrowserProgressListener_shutdown() {
        this._windowListener = null;
    },
    onLocationChange: function BrowserProgressListener_onLocationChange(webProgress, request, location) {
        if (this._isTopWindowWebProgress(webProgress)) {
            this._windowListener.onWindowLocationChange(location, webProgress, request);
        }
    },
    _isTopWindowWebProgress: function BrowserProgressListener__isTopWindowWebProgress(webProgress) {
        if ("isTopLevel" in webProgress) {
            return webProgress.isTopLevel;
        }
        try {
            return webProgress.DOMWindow === webProgress.DOMWindow.top;
        } catch (e) {
        }
        return false;
    }
};
const frameMessageListener = {
    _inited: false,
    init: function frameMessageListener_init() {
        if (this._inited) {
            return;
        }
        this._inited = true;
        this._windowListeners = new WeakMap();
        let globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        globalMessageManager.loadFrameScript(this._FRAME_SCRIPT_URL, true);
        this._MESSAGES_NAMES.forEach(function (eventType) {
            globalMessageManager.addMessageListener(eventType, this);
        }, this);
    },
    shutdown: function frameMessageListener_shutdown() {
        if (!this._inited) {
            return;
        }
        this._inited = false;
        let globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        globalMessageManager.removeDelayedFrameScript(this._FRAME_SCRIPT_URL);
        this._MESSAGES_NAMES.forEach(function (eventType) {
            globalMessageManager.removeMessageListener(eventType, this);
        }, this);
        this._windowListeners = null;
    },
    addWindowListener: function messageListener_addWindowListener(windowListener) {
        this._windowListeners.set(windowListener.window, windowListener);
    },
    removeWindowListener: function messageListener_removeWindowListener(windowListener) {
        this._windowListeners.delete(windowListener.window);
    },
    receiveMessage: function frameMessageListener_receiveMessage(message) {
        let {
            name,
            data,
            target: tab,
            objects
        } = message;
        let windowListener = this._windowListeners.get(tab.ownerDocument && tab.ownerDocument.defaultView);
        if (!windowListener) {
            return;
        }
        if (name.indexOf(this.FRAME_MESSAGES_PREFIX) !== 0) {
            throw new Error("Unknown message name");
        }
        name = name.split(this.FRAME_MESSAGES_PREFIX)[1];
        switch (name) {
        case "pageshow":
            name = "PageShow";
            break;
        case "pagehide":
            name = "PageHide";
            break;
        case "load":
            name = "PageLoad";
            break;
        }
        switch (name) {
        case "Frame:LocationChange":
            windowListener.onPageLocationChange(data.location, tab, data.requestURI);
            break;
        case "Frame:StateChange":
            if (data.stateFlags & STATE_IS_NETWORK) {
                if (data.stateFlags & STATE_START) {
                    windowListener.onPageStateStart(tab, data.requestURI);
                }
                if (data.stateFlags & STATE_STOP) {
                    windowListener.onPageStateStop(tab, data.requestURI);
                }
            }
            break;
        case "DOMContentLoaded":
        case "PageShow":
        case "PageHide":
        case "PageLoad": {
                let currentURL = data.url;
                if (currentURL == "about:blank") {
                    currentURL = "";
                }
                if (name !== "PageHide") {
                    let referringURL = data.docShellProps.referringURI;
                    if (referringURL) {
                        data.docShellProps.__defineGetter__("referringURI", () => Services.io.newURI(referringURL, null, null));
                    }
                    windowListener.tabsContentInfo.set(tab, { docShellProps: data.docShellProps });
                }
                windowListener.notifyListeners(name, {
                    tab: tab,
                    url: currentURL,
                    uri: tab.currentURI,
                    isCurrentTab: isCurrentTab(tab),
                    get readyState() {
                        let doc = this.tab.contentDocument;
                        return doc && doc.readyState;
                    }
                });
                if (name === "PageHide") {
                    windowListener.tabsContentInfo.delete(tab);
                }
                break;
            }
        case "DOMTitleChanged":
            if (isCurrentTab(tab)) {
                windowListener._updateWindowTitle();
            }
            break;
        default:
            throw new Error("Unknown message name ('" + name + "')");
        }
    },
    _FRAME_SCRIPT: "function messageListener__FRAME_SCRIPT() {" + "        const {" + "            classes: Cc," + "            interfaces: Ci," + "            results: Cr," + "            utils: Cu" + "        } = Components;" + "        Cu.import('resource://gre/modules/Services.jsm');" + "        [" + "            'load'," + "            'pageshow'," + "            'pagehide'," + "            'DOMContentLoaded'," + "            'DOMTitleChanged'" + "        ].forEach(function (eventType) {" + "            addEventListener(eventType, function contentEventListener(event) {" + "                if (!event.isTrusted || content.document !== event.originalTarget) {" + "                    return;" + "                }" + "                let tab = docShell.chromeEventHandler;" + "                if (!tab) {" + "                    return;" + "                }" + "                let type = typeof tab.getAttribute === 'function' ? tab.getAttribute('type') : null;" + "                if (!(type === null || type === 'content-primary' || type === 'content-targetable')) {" + "                    return;" + "                }" + "                let messageData = {" + "                    url: String(content.document.location)," + "                    originalURL: undefined," + "                    responseStatus: undefined," + "                    docShellProps: {" + "                        referringURI: undefined," + "                        currentDocumentChannel: {" + "                            originalURL: undefined," + "                            responseStatus: undefined" + "                        }," + "                        loadType: docShell.loadType" + "                    }" + "                };" + "                if (eventType !== 'DOMTitleChanged' && eventType !== 'pagehide') {" + "                    if (docShell.referringURI) {" + "                        messageData.docShellProps.referringURI = docShell.referringURI.spec;" + "                    }" + "                    try {" + "                        let originalURI = docShell.currentDocumentChannel.originalURI;" + "                        if (originalURI && originalURI.spec) {" + "                            messageData.docShellProps.currentDocumentChannel.originalURL = originalURI.spec;" + "                        }" + "                    } catch (e) {}" + "                    try {" + "                        messageData.docShellProps.currentDocumentChannel.responseStatus =" + "                            docShell.currentDocumentChannel.QueryInterface(Ci.nsIHttpChannel).responseStatus;" + "                    } catch (e) {}" + "                }" + "                sendSyncMessage('{{PREFIX}}' + eventType, messageData);" + "            }, true);" + "        });" + "        let WebProgressListener = {" + "            init: function() {" + "                let flags = Ci.nsIWebProgress.NOTIFY_LOCATION |" + "                    Ci.nsIWebProgress.NOTIFY_STATE_WINDOW |" + "                    Ci.nsIWebProgress.NOTIFY_STATE_NETWORK;" + "                this._filter = Cc['@mozilla.org/appshell/component/browser-status-filter;1']" + "                                 .createInstance(Ci.nsIWebProgress);" + "                this._filter.addProgressListener(this, flags);" + "                let webProgress = docShell.QueryInterface(Ci.nsIInterfaceRequestor)" + "                                          .getInterface(Ci.nsIWebProgress);" + "                webProgress.addProgressListener(this._filter, flags);" + "            }," + "            _isTopWindowWebProgress: function (webProgress) {" + "                if ('isTopLevel' in webProgress) {" + "                    return webProgress.isTopLevel;" + "                }" + "                try {" + "                    return webProgress.DOMWindow === webProgress.DOMWindow.top;" + "                } catch (ex) {}" + "                return false;" + "            }," + "            _requestSpec: function (request, propertyName) {" + "                if (!request || !(request instanceof Ci.nsIChannel)) {" + "                    return null;" + "                }" + "                return request.QueryInterface(Ci.nsIChannel)[propertyName].spec;" + "            }," + "            _setupJSON: function (webProgress, request) {" + "                if (webProgress) {" + "                    webProgress = {" + "                        isTopLevel: webProgress.isTopLevel," + "                        isLoadingDocument: webProgress.isLoadingDocument," + "                        loadType: webProgress.loadType" + "                    };" + "                }" + "                return {" + "                    webProgress: webProgress || null," + "                    requestURI: this._requestSpec(request, 'URI')," + "                    originalRequestURI: this._requestSpec(request, 'originalURI')" + "                };" + "            }," + "            _setupObjects: function (webProgress) {" + "                let domWindow = null;" + "                try {" + "                    domWindow = webProgress.DOMWindow;" + "                } catch (e) {}" + "                return {" + "                    contentWindow: content," + "                    DOMWindow: domWindow" + "                };" + "            }," + "            onStateChange: function onStateChange(webProgress, request, stateFlags, status) {" + "                if (!this._isTopWindowWebProgress(webProgress)) {" + "                    return;" + "                }" + "                let json = this._setupJSON(webProgress, request);" + "                let objects = this._setupObjects(webProgress);" + "                json.stateFlags = stateFlags;" + "                json.status = status;" + "                try {" + "                    sendAsyncMessage('{{PREFIX}}Frame:StateChange', json, objects);" + "                } catch (e) {}" + "            }," + "            onLocationChange: function onLocationChange(webProgress, request, locationURI, flags) {" + "                let json = this._setupJSON(webProgress, request);" + "                let objects = this._setupObjects(webProgress);" + "                json.location = locationURI ? locationURI.spec : '';" + "                json.flags = flags;" + "               sendAsyncMessage('{{PREFIX}}Frame:LocationChange', json, objects);" + "            }," + "            onProgressChange: function () {}," + "            onStatusChange: function () {}," + "            onSecurityChange: function () {}," + "            QueryInterface: function QueryInterface(aIID) {" + "                if (aIID.equals(Ci.nsIWebProgressListener) ||" + "                    aIID.equals(Ci.nsISupportsWeakReference) ||" + "                    aIID.equals(Ci.nsISupports)) {" + "                    return this;" + "                }" + "                throw Cr.NS_ERROR_NO_INTERFACE;" + "            }" + "        };" + "        WebProgressListener.init();" + "    }",
    get _FRAME_SCRIPT_URL() {
        return "data:application/javascript;charset=utf-8," + encodeURIComponent("(" + this._FRAME_SCRIPT.replace(/\{\{PREFIX\}\}/g, this.FRAME_MESSAGES_PREFIX) + ")()");
    },
    get FRAME_MESSAGES_PREFIX() {
        let prefix;
        switch (__URI__.match(/^resource:\/\/(.+)\-mod.+/)[1]) {
        case "yasearch":
            prefix = "yasearch@yandex.ru";
            break;
        case "yandex-vb":
            prefix = "vb@yandex.ru";
            break;
        default:
            throw new Error("Unknown application type");
        }
        prefix += ":WindowListener:";
        delete this.FRAME_MESSAGES_PREFIX;
        return this.FRAME_MESSAGES_PREFIX = prefix;
    },
    get _MESSAGES_NAMES() {
        return [
            "pageshow",
            "pagehide",
            "DOMContentLoaded",
            "load",
            "DOMTitleChanged",
            "Frame:LocationChange",
            "Frame:StateChange"
        ].map(function (msg) {
            return this.FRAME_MESSAGES_PREFIX + msg;
        }, this);
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIMessageListener])
};
frameMessageListener.init();
function WindowListener(aWindow, aAppName, aLogger) {
    this._window = aWindow;
    this._appName = aAppName;
    this._logger = aLogger;
    this._listeners = Object.create(null);
    this._tabsContentInfo = new WeakMap();
    this._tabsEnvironment = new WeakMap();
    this._started = false;
    this._windowTitle = null;
    this._browserProgressListener = null;
    aWindow.addEventListener("load", this, false);
    aWindow.addEventListener("unload", this, false);
}
WindowListener.prototype = {
    startup: function WindowListener_startup() {
        if (this._started) {
            return;
        }
        this._started = true;
        let gBrowser = this._window.gBrowser;
        this.notifyListeners("WindowTitleChange", {
            title: this.windowTitle,
            url: this.windowLocation
        });
        this.onWindowLocationChange(gBrowser.currentURI, gBrowser.webProgress, null);
        frameMessageListener.addWindowListener(this);
        this._browserProgressListener = new BrowserProgressListener(this);
        gBrowser.addProgressListener(this._browserProgressListener);
        let container = gBrowser.tabContainer;
        container.addEventListener("TabOpen", this, false);
        container.addEventListener("TabClose", this, false);
    },
    shutdown: function WindowListener_shutdown() {
        if (this._started) {
            this._started = false;
            let gBrowser = this._window.gBrowser;
            let panelsLen = gBrowser.mPanelContainer.childNodes.length;
            for (let i = 0; i < panelsLen; i++) {
                this.handleEvent({
                    type: "TabClose",
                    target: { linkedBrowser: gBrowser.getBrowserAtIndex(i) }
                });
            }
            let container = gBrowser.tabContainer;
            container.removeEventListener("TabOpen", this, false);
            container.removeEventListener("TabClose", this, false);
            gBrowser.removeProgressListener(this._browserProgressListener);
            this._browserProgressListener.shutdown();
            frameMessageListener.removeWindowListener(this);
        }
        this._tabsContentInfo = null;
        this._tabsEnvironment = null;
        this._listeners = null;
        this._window = null;
        this._windowTitle = null;
        this._browserProgressListener = null;
        this._logger = null;
    },
    get appName() {
        return this._appName;
    },
    get window() {
        return this._window;
    },
    get messageManager() {
        return this._window.messageManager;
    },
    get tabsContentInfo() {
        return this._tabsContentInfo;
    },
    get currentTab() {
        return this._started ? this._window.gBrowser.mCurrentBrowser : null;
    },
    getTabEnvironment: function WindowListener_getTabEnvironment(aTab) {
        let tabData = this._tabsEnvironment.get(aTab);
        if (!tabData) {
            tabData = Object.create(null);
            this._tabsEnvironment.set(aTab, tabData);
        }
        return tabData;
    },
    removeTabEnvironment: function WindowListener_removeTabEnvironment(aTab) {
        this._tabsEnvironment.delete(aTab);
    },
    getTabData: function WindowListener_getTabData(aTab, aObjectName) {
        let tabData = this.getTabEnvironment(aTab);
        if (!(aObjectName in tabData)) {
            tabData[aObjectName] = Object.create(null);
        }
        return tabData[aObjectName];
    },
    removeTabData: function WindowListener_clearTabData(aTab, aObjectName) {
        let tabData = this._tabsEnvironment.get(aTab);
        if (!tabData) {
            return;
        }
        if (aObjectName in tabData) {
            delete tabData[aObjectName];
        }
    },
    removeAllTabData: function WindowListener_removeAllTabData(aObjectName) {
        let gBrowser = this._window && this._window.gBrowser;
        if (!gBrowser) {
            return;
        }
        let i = gBrowser.mPanelContainer.childNodes.length;
        while (i--) {
            this.removeTabData(gBrowser.getBrowserAtIndex(i), aObjectName);
        }
    },
    handleEvent: function WindowListener_handleEvent(aEvent) {
        switch (aEvent.type) {
        case "TabOpen":
        case "TabClose":
            let tab = aEvent.target.linkedBrowser;
            if (!tab) {
                return;
            }
            switch (aEvent.type) {
            case "TabOpen":
                this.notifyListeners("TabOpen", { tab: tab });
                break;
            case "TabClose":
                this.notifyListenersImmediately("TabClose", { tab: tab });
                this.removeTabEnvironment(tab);
                break;
            }
            break;
        case "load":
            aEvent.currentTarget.removeEventListener("load", this, false);
            this.startup();
            break;
        case "unload":
            aEvent.currentTarget.removeEventListener("unload", this, false);
            this.shutdown();
            break;
        default:
            break;
        }
    },
    KNOWN_TOPICS: [
        "WindowTitleChange",
        "WindowLocationChange",
        "DOMContentLoaded",
        "PageLocationChange",
        "PageLoad",
        "PageShow",
        "PageHide",
        "PageStateStart",
        "PageStateStop",
        "TabOpen",
        "TabClose"
    ],
    addListener: function WindowListener_addListener(aTopic, aListener) {
        if (this.KNOWN_TOPICS.indexOf(aTopic) === -1) {
            throw new TypeError("WindowListener.addListener: unknown topic '" + aTopic + "'");
        }
        if (!this._listeners) {
            return;
        }
        if (!this._listeners[aTopic]) {
            this._listeners[aTopic] = [aListener];
        } else if (!this._listeners[aTopic].some(function (listener) {
                return listener === aListener;
            })) {
            this._listeners[aTopic].push(aListener);
        }
    },
    removeListener: function WindowListener_removeListener(aTopic, aListener) {
        if (this.KNOWN_TOPICS.indexOf(aTopic) === -1) {
            throw new TypeError("WindowListener.removeListener: unknown topic '" + aTopic + "'");
        }
        if (!this._listeners) {
            return;
        }
        if (!this._listeners[aTopic]) {
            return;
        }
        this._listeners[aTopic] = this._listeners[aTopic].filter(function (listener) {
            return listener !== aListener;
        });
        if (this._listeners[aTopic].length) {
            return;
        }
        delete this._listeners[aTopic];
    },
    notifyListeners: function WindowListener_notifyListeners(aTopic, aData) {
        let WindowListener_notifyListeners_timed = function WindowListener_notifyListeners_timed() {
            this.notifyListenersImmediately.apply(this, arguments);
        }.bind(this, aTopic, aData);
        let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback({ notify: WindowListener_notifyListeners_timed }, 1, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    notifyListenersImmediately: function WindowListener_notifyListenersImmediately(aTopic, aData) {
        let tabInfo = aData.tab && this._tabsContentInfo.get(aData.tab) || {};
        aData.docShellProps = tabInfo && tabInfo.docShellProps;
        this._notifyListeners(aTopic, aData);
    },
    _notifyListeners: function WindowListener__notifyListeners(aTopic, aData) {
        if (!this._listeners) {
            return;
        }
        let listeners = this._listeners[aTopic];
        if (!listeners) {
            return;
        }
        listeners.forEach(function WindowListener_NotificatorFunc(listener) {
            try {
                if (this._listeners[aTopic].indexOf(listener) != -1) {
                    listener.observe(null, aTopic, aData);
                }
            } catch (e) {
                this._logger.error("Notify listener error: " + e);
                if (e.stack) {
                    this._logger.debug(e.stack);
                }
            }
        }, this);
    },
    _updateWindowTitle: function WindowListener__updateWindowTitle() {
        let oldTitle = this._windowTitle;
        try {
            this._windowTitle = this._window.gBrowser.contentTitle || "";
        } catch (e) {
            this._windowTitle = "";
        }
        if (oldTitle === this._windowTitle) {
            return false;
        }
        this.notifyListeners("WindowTitleChange", { title: this._windowTitle });
        return true;
    },
    get windowTitle() {
        return this._windowTitle;
    },
    _lastWindowURL: null,
    _getTabFromWebProgress: function WindowListener__getTabFromWebProgress(aWebProgress) {
        let tab = aWebProgress.chromeEventHandler;
        if (!tab) {
            if (aWebProgress.DOMWindow) {
                let browser = this._window.getBrowser();
                if ("getBrowserForContentWindow" in browser) {
                    tab = browser.getBrowserForContentWindow(aWebProgress.DOMWindow);
                }
            }
        }
        return tab || null;
    },
    onWindowLocationChange: function WindowListener_onWindowLocationChange(aLocation, aWebProgress, aRequest) {
        let lastURL = this._lastWindowURL;
        let currentURL = this._getURISpec(aLocation);
        let specChanged = lastURL !== currentURL;
        let hashOnlyChanged = false;
        if (lastURL && currentURL && specChanged && lastURL.split("#")[0] == currentURL.split("#")[0]) {
            hashOnlyChanged = true;
        }
        this._updateWindowTitle();
        let tab = this._getTabFromWebProgress(aWebProgress);
        if (!tab) {
            return;
        }
        let contentDocument = tab.contentDocument;
        this.notifyListeners("WindowLocationChange", {
            uri: aLocation,
            url: currentURL,
            get referringURI() {
                if (contentDocument && contentDocument.referer) {
                    try {
                        return Services.io.newURI(contentDocument.referrer, null, null);
                    } catch (e) {
                    }
                }
                return null;
            },
            title: this.windowTitle,
            tab: tab,
            get webProgress() {
                warnOnceAboutWebProgress();
                return aWebProgress;
            },
            hashOnlyChanged: hashOnlyChanged,
            specChanged: specChanged,
            get URIWasModified() {
                let sessionHistory = tab.sessionHistory;
                let shEntry = sessionHistory.getEntryAtIndex(sessionHistory.index, false);
                shEntry.QueryInterface(Ci.nsISHEntry);
                return shEntry.URIWasModified;
            },
            request: aRequest,
            get readyState() {
                return contentDocument && contentDocument.readyState;
            },
            isCurrentTab: isCurrentTab(tab)
        });
        this._lastWindowURL = currentURL;
    },
    get windowLocation() {
        if (this._started) {
            try {
                return this._getURISpec(this._window.gBrowser.currentURI);
            } catch (e) {
            }
        }
        return null;
    },
    get currentURI() {
        if (this._started) {
            try {
                return this._window.gBrowser.currentURI;
            } catch (e) {
            }
        }
        return ABOUT_BLANK_URI.clone();
    },
    _getURISpec: function WindowListener__getURISpec(aURI) {
        let spec = null;
        try {
            spec = (typeof aURI == "string" ? aURI : aURI.spec) || "";
            if (spec == "about:blank") {
                spec = "";
            }
        } catch (e) {
        }
        return spec;
    },
    onPageLocationChange: function WindowListener_onPageLocationChange(aLocation, tab, requestURL) {
        this.notifyListeners("PageLocationChange", this._makePageEventParams(tab, requestURL));
    },
    onPageStateStart: function WindowListener_onPageStateStart(tab, requestURL) {
        this._tabsContentInfo.delete(tab);
        this.notifyListeners("PageStateStart", this._makePageEventParams(tab, requestURL));
    },
    onPageStateStop: function WindowListener_onPageStateStop(tab, requestURL) {
        this.notifyListeners("PageStateStop", this._makePageEventParams(tab, requestURL));
    },
    _makePageEventParams: function WindowListener__makePageEventParams(tab, requestURL) {
        return {
            tab: tab,
            request: {
                get URI() {
                    if (requestURL) {
                        try {
                            return Services.io.newURI(requestURL, null, null);
                        } catch (e) {
                        }
                    }
                    return null;
                }
            },
            isCurrentTab: isCurrentTab(tab)
        };
    }
};
