"use strict";
const EXPORTED_SYMBOLS = ["WindowListener"];
const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const ABOUT_BLANK_URI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI("about:blank", null, null);
const STATE_IS_NETWORK = Ci.nsIWebProgressListener.STATE_IS_NETWORK;
const STATE_START = Ci.nsIWebProgressListener.STATE_START;
const STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;
function isCurrentTab(aTab) {
    var tabBrowser = aTab.getTabBrowser();
    return tabBrowser && tabBrowser.mCurrentBrowser === aTab;
}
function ProgressListener(aWindowListener) {
    this._windowListener = aWindowListener;
}
ProgressListener.prototype = {
    shutdown: function ProgressListener_shutdown() {
        this._windowListener = null;
    },
    _isTopWindowWebProgress: function ProgressListener__isTopWindowWebProgress(aWebProgress) {
        try {
            let reqWindow = aWebProgress.DOMWindow;
            return reqWindow === reqWindow.top;
        } catch (ex) {
        }
        return false;
    },
    onLocationChange: function ProgressListener_onLocationChange(aWebProgress, aRequest, aLocation) {
        if (this._isTopWindowWebProgress(aWebProgress))
            this._windowListener.onWindowLocationChange(aLocation, aWebProgress, aRequest);
    },
    onStateChange: function ProgressListener_onStateChange(aWebProgress, aRequest, aStateFlags, aStatus) {
        if (!aRequest || !(aStateFlags & STATE_IS_NETWORK) || !this._isTopWindowWebProgress(aWebProgress))
            return;
        if (aStateFlags & STATE_START)
            this._windowListener.onPageStateStart(aWebProgress, aRequest);
        if (aStateFlags & STATE_STOP)
            this._windowListener.onPageStateStop(aWebProgress, aRequest);
    },
    onProgressChange: function ProgressListener_onProgressChange() {
    },
    onStatusChange: function ProgressListener_onStatusChange() {
    },
    onSecurityChange: function ProgressListener_onSecurityChange() {
    },
    onLinkIconAvailable: function ProgressListener_onLinkIconAvailable() {
    },
    QueryInterface: function ProgressListener_QueryInterface(aIID) {
        if (aIID.equals(Ci.nsIWebProgressListener) || aIID.equals(Ci.nsISupportsWeakReference) || aIID.equals(Ci.nsISupports))
            return this;
        throw Cr.NS_NOINTERFACE;
    }
};
const GLOBAL_MESSAGE_MANAGER = "nsIMessageListenerManager" in Ci ? Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager) : Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIChromeFrameMessageManager);
var messageListener = {
        _inited: false,
        init: function messageListener_init() {
            if (this._inited)
                return;
            this._inited = true;
            this._windowListeners = new WeakMap();
            GLOBAL_MESSAGE_MANAGER.loadFrameScript(this._CONTENT_SCRIPT_URL, true);
            this._MESSAGES_NAMES.forEach(function (eventType) {
                GLOBAL_MESSAGE_MANAGER.addMessageListener(eventType, this);
            }, this);
        },
        shutdown: function messageListener_shutdown() {
            if (!this._inited)
                return;
            this._inited = false;
            this._MESSAGES_NAMES.forEach(function (eventType) {
                GLOBAL_MESSAGE_MANAGER.removeMessageListener(eventType, this);
            }, this);
            GLOBAL_MESSAGE_MANAGER.removeDelayedFrameScript(this._CONTENT_SCRIPT_URL);
            this._windowListeners = null;
        },
        addWindowListener: function messageListener_addWindowListener(windowListener) {
            this._windowListeners.set(windowListener.window, windowListener);
        },
        removeWindowListener: function messageListener_removeWindowListener(windowListener) {
            this._windowListeners.delete(windowListener.window);
        },
        receiveMessage: function messageListener_receiveMessage(message) {
            var {
                    name: name,
                    data: data,
                    target: tab
                } = message;
            var windowListener = this._windowListeners.get(tab.ownerDocument && tab.ownerDocument.defaultView);
            if (!windowListener)
                return;
            if (typeof data === "undefined")
                data = message.json;
            if (name.indexOf(this._CONTENT_MESSAGES_PREFIX) !== 0)
                throw new Error("Unknown message name");
            name = name.split(this._CONTENT_MESSAGES_PREFIX)[1];
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
            case "DOMContentLoaded":
            case "PageShow":
            case "PageHide":
            case "PageLoad": {
                    let currentURL = data.url;
                    if (currentURL == "about:blank")
                        currentURL = "";
                    if (name !== "PageHide")
                        windowListener.tabsContentInfo.set(tab, { docShellProps: data.docShellProps });
                    windowListener.notifyListeners(name, {
                        tab: tab,
                        url: currentURL,
                        uri: tab.currentURI,
                        isCurrentTab: isCurrentTab(tab),
                        get readyState() {
                            var doc = this.tab.contentDocument;
                            return doc && doc.readyState;
                        }
                    });
                    if (name === "PageHide")
                        windowListener.tabsContentInfo.delete(tab);
                    break;
                }
            case "DOMTitleChanged":
                if (isCurrentTab(tab))
                    windowListener._updateWindowTitle();
                break;
            default:
                throw new Error("Unknown message name ('" + name + "')");
            }
        },
        _CONTENT_SCRIPT: "function messageListener__CONTENT_SCRIPT() {                                                              [                                                                                                                           \"load\",                                                                                                                 \"pageshow\",                                                                                                             \"pagehide\",                                                                                                             \"DOMContentLoaded\",                                                                                                     \"DOMTitleChanged\"                                                                                                   ].forEach(function(eventType) {                                                                                             addEventListener(eventType, function contentEventListener(event) {                                                          if (!event.isTrusted || content.document !== event.originalTarget)                                                          return;                                                                                                                                                                                                                                     let tab = docShell.chromeEventHandler;                                                                                                                                                                                                          if (!tab)                                                                                                                   return;                                                                                                                                                                                                                                     if (typeof tab.getAttribute !== \"function\")                                                                                 return;                                                                                                                                                                                                                                     let type = tab.getAttribute(\"type\");                                                                                                                                                                                                            if (!(type === \"content-primary\" || type === \"content-targetable\"))                                                         return;                                                                                                                                                                                                                                     let messageData = {                                                                                                         url: String(content.document.location),                                                                                 originalURL: undefined,                                                                                                 responseStatus: undefined,                                                                                              docShellProps: {                                                                                                            currentDocumentChannel: {                                                                                                   originalURL: undefined,                                                                                                 responseStatus: undefined                                                                                           },                                                                                                                      loadType: docShell.loadType                                                                                         }                                                                                                                   };                                                                                                                                                                                                                                              if (eventType !== \"DOMTitleChanged\" && eventType !== \"pagehide\") {                                                          try {                                                                                                                       let originalURI = docShell.currentDocumentChannel.originalURI;                                                          if (originalURI && originalURI.spec)                                                                                        messageData.docShellProps.currentDocumentChannel.originalURL = originalURI.spec;                                } catch (e) {}                                                                                                                                                                                                                                  try {                                                                                                                       messageData.docShellProps.currentDocumentChannel.responseStatus =                                                           docShell.currentDocumentChannel.QueryInterface(Ci.nsIHttpChannel).responseStatus;                               } catch (e) {}                                                                                                      }                                                                                                                                                                                                                                               sendSyncMessage(\"{{PREFIX}}\" + eventType, messageData);                                                             }, true);                                                                                                           });                                                                                                                 }",
        get _CONTENT_SCRIPT_URL() {
            return "data:,(" + this._CONTENT_SCRIPT.replace(/\{\{PREFIX\}\}/g, this._CONTENT_MESSAGES_PREFIX) + ")()";
        },
        _CONTENT_MESSAGES_PREFIX: __URI__.match(/^resource:\/\/(.+)\-mod.+/)[1],
        get _MESSAGES_NAMES() {
            return [
                "pageshow",
                "pagehide",
                "DOMContentLoaded",
                "load",
                "DOMTitleChanged"
            ].map(function (msg) this._CONTENT_MESSAGES_PREFIX + msg, this);
        },
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIMessageListener])
    };
messageListener.init();
function WindowListener(aWindow, aAppName, aLogger) {
    this._window = aWindow;
    this._appName = aAppName;
    this._logger = aLogger;
    this._listeners = Object.create(null);
    this._tabsContentInfo = new WeakMap();
    this._tabsEnvironment = new WeakMap();
    this._started = false;
    this._windowTitle = null;
    this._progressListener = null;
    aWindow.addEventListener("load", this, false);
    aWindow.addEventListener("unload", this, false);
}
WindowListener.prototype = {
    startup: function WindowListener_startup() {
        if (this._started)
            return;
        this._started = true;
        var gBrowser = this._window.gBrowser;
        this.notifyListeners("WindowTitleChange", {
            title: this.windowTitle,
            url: this.windowLocation
        });
        this.onWindowLocationChange(gBrowser.currentURI, gBrowser.webProgress, null);
        this._progressListener = new ProgressListener(this);
        gBrowser.addProgressListener(this._progressListener);
        messageListener.addWindowListener(this);
        var container = gBrowser.tabContainer;
        container.addEventListener("TabOpen", this, false);
        container.addEventListener("TabClose", this, false);
    },
    shutdown: function WindowListener_shutdown() {
        if (this._started) {
            this._started = false;
            let gBrowser = this._window.gBrowser;
            let panelsLen = gBrowser.mPanelContainer.childNodes.length;
            let (i = 0) {
                for (; i < panelsLen; i++)
                    this.removeTabEnvironment(gBrowser.getBrowserAtIndex(i));
            }
            let container = gBrowser.tabContainer;
            container.removeEventListener("TabOpen", this, false);
            container.removeEventListener("TabClose", this, false);
            gBrowser.removeProgressListener(this._progressListener);
            this._progressListener.shutdown();
            messageListener.removeWindowListener(this);
        }
        this._tabsContentInfo = null;
        this._tabsEnvironment = null;
        this._listeners = null;
        this._window = null;
        this._windowTitle = null;
        this._progressListener = null;
        this._logger = null;
    },
    get appName() this._appName,
    get window() this._window,
    get messageManager() this._window.messageManager,
    get tabsContentInfo() this._tabsContentInfo,
    get currentTab() {
        return this._started ? this._window.gBrowser.mCurrentBrowser : null;
    },
    getTabEnvironment: function WindowListener_getTabEnvironment(aTab) {
        var tabData = this._tabsEnvironment.get(aTab);
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
        var tabData = this.getTabEnvironment(aTab);
        if (!(aObjectName in tabData))
            tabData[aObjectName] = Object.create(null);
        return tabData[aObjectName];
    },
    removeTabData: function WindowListener_clearTabData(aTab, aObjectName) {
        var tabData = this._tabsEnvironment.get(aTab);
        if (!tabData)
            return;
        if (aObjectName in tabData)
            delete tabData[aObjectName];
    },
    removeAllTabData: function WindowListener_removeAllTabData(aObjectName) {
        var gBrowser = this._window && this._window.gBrowser;
        if (!gBrowser)
            return;
        var i = gBrowser.mPanelContainer.childNodes.length;
        while (i--)
            this.removeTabData(gBrowser.getBrowserAtIndex(i), aObjectName);
    },
    handleEvent: function WindowListener_handleEvent(aEvent) {
        switch (aEvent.type) {
        case "TabOpen":
        case "TabClose":
            let tab = aEvent.target.linkedBrowser;
            if (!tab)
                return;
            switch (aEvent.type) {
            case "TabOpen":
                this.notifyListeners("TabOpen", { tab: tab });
                break;
            case "TabClose":
                this.notifyListeners("TabClose", { tab: tab });
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
        "PageLoad",
        "PageShow",
        "PageHide",
        "PageStateStart",
        "PageStateStop",
        "TabOpen",
        "TabClose"
    ],
    addListener: function WindowListener_addListener(aTopic, aListener) {
        if (this.KNOWN_TOPICS.indexOf(aTopic) == -1)
            throw new TypeError("WindowListener.addListener: unknown topic \"" + aTopic + "\"");
        if (!this._listeners)
            return;
        if (!this._listeners[aTopic]) {
            this._listeners[aTopic] = [aListener];
        } else if (!this._listeners[aTopic].some(function (listener) listener === aListener)) {
            this._listeners[aTopic].push(aListener);
        }
    },
    removeListener: function WindowListener_removeListener(aTopic, aListener) {
        if (this.KNOWN_TOPICS.indexOf(aTopic) == -1)
            throw new TypeError("WindowListener.removeListener: unknown topic \"" + aTopic + "\"");
        if (!this._listeners)
            return;
        if (!this._listeners[aTopic])
            return;
        this._listeners[aTopic] = this._listeners[aTopic].filter(function (listener) listener !== aListener);
        if (this._listeners[aTopic].length)
            return;
        delete this._listeners[aTopic];
    },
    notifyListeners: function WindowListener_notifyListeners(aTopic, aData) {
        var tabInfo = aData.tab && this._tabsContentInfo.get(aData.tab) || {};
        aData.docShellProps = tabInfo && tabInfo.docShellProps;
        var WindowListener_notifyListeners_timed = function WindowListener_notifyListeners_timed() {
                this._notifyListeners.apply(this, arguments);
            }.bind(this, aTopic, aData);
        var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        timer.initWithCallback({ notify: WindowListener_notifyListeners_timed }, 0, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    _notifyListeners: function WindowListener__notifyListeners(aTopic, aData) {
        if (!this._listeners)
            return;
        var listeners = this._listeners[aTopic];
        if (!listeners)
            return;
        listeners.forEach(function WindowListener_NotificatorFunc(listener) {
            try {
                if (this._listeners[aTopic].indexOf(listener) != -1)
                    listener.observe(null, aTopic, aData);
            } catch (e) {
                this._logger.error("Notify listener error: " + e);
                if (e.stack) {
                    this._logger.debug(e.stack);
                }
            }
        }, this);
    },
    _updateWindowTitle: function WindowListener__updateWindowTitle() {
        var oldTitle = this._windowTitle;
        try {
            this._windowTitle = this._window.gBrowser.contentTitle || "";
        } catch (e) {
            this._windowTitle = "";
        }
        if (oldTitle === this._windowTitle)
            return false;
        this.notifyListeners("WindowTitleChange", { title: this._windowTitle });
        return true;
    },
    get windowTitle() {
        return this._windowTitle;
    },
    _lastWindowURL: null,
    _getTabFromWebProgress: function WindowListener__getTabFromWebProgress(aWebProgress) {
        return aWebProgress.chromeEventHandler || this._window.getBrowser().getBrowserForDocument(aWebProgress.DOMWindow.document);
    },
    onWindowLocationChange: function WindowListener_onWindowLocationChange(aLocation, aWebProgress, aRequest) {
        var lastURL = this._lastWindowURL;
        var currentURL = this._getURISpec(aLocation);
        var specChanged = lastURL != currentURL;
        var hashOnlyChanged = false;
        if (lastURL && currentURL && specChanged && lastURL.split("#")[0] == currentURL.split("#")[0])
            hashOnlyChanged = true;
        this._updateWindowTitle();
        var tab = this._getTabFromWebProgress(aWebProgress);
        this.notifyListeners("WindowLocationChange", {
            uri: aLocation,
            url: currentURL,
            referringURI: aWebProgress.referringURI,
            title: this.windowTitle,
            tab: tab,
            webProgress: aWebProgress,
            hashOnlyChanged: hashOnlyChanged,
            specChanged: specChanged,
            get URIWasModified() {
                var sessionHistory = aWebProgress.sessionHistory;
                var shEntry = sessionHistory.getEntryAtIndex(sessionHistory.index, false);
                shEntry.QueryInterface(Ci.nsISHEntry);
                return shEntry.URIWasModified;
            },
            request: aRequest,
            get readyState() {
                var doc = this.tab.contentDocument;
                return doc && doc.readyState;
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
        var spec = null;
        try {
            spec = (typeof aURI == "string" ? aURI : aURI.spec) || "";
            if (spec == "about:blank")
                spec = "";
        } catch (e) {
        }
        return spec;
    },
    onPageStateStart: function WindowListener_onPageStateStart(aWebProgress, aRequest) {
        var tab = this._getTabFromWebProgress(aWebProgress);
        this._tabsContentInfo.delete(tab);
        this.notifyListeners("PageStateStart", {
            tab: tab,
            request: aRequest,
            isCurrentTab: isCurrentTab(tab)
        });
    },
    onPageStateStop: function WindowListener_onPageStateStop(aWebProgress, aRequest) {
        var tab = this._getTabFromWebProgress(aWebProgress);
        this.notifyListeners("PageStateStop", {
            tab: tab,
            request: aRequest,
            isCurrentTab: isCurrentTab(tab)
        });
    }
};
