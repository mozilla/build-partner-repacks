"use strict";
const EXPORTED_SYMBOLS = ["tutorial"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource:///modules/UITour.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const FRAME_SCRIPT = function () {
    addMessageListener("UITour:SendPageCallback", function (message) {
        sendAsyncMessage("{{PREFIX}}:UITour:SendPageCallback", message.data);
    });
};
const tutorial = {
    init: function (aApplication) {
        this._app = aApplication;
        XPCOMUtils.defineLazyGetter(this, "_browserVersion", function () {
            return this._app.core.Lib.sysutils.platformInfo.browser.version;
        });
        if (this._browserVersion.isLessThan("28.*")) {
            let emptyFunction = function empty() {
            };
            [
                "showHighlight",
                "showInfo",
                "hideHighlight",
                "hideInfo"
            ].forEach(functionName => {
                this[functionName] = emptyFunction;
            });
            return;
        }
    },
    finalize: function () {
        for (let id in this._wrappedCallbacksRemoveListeners) {
            this._wrappedCallbacksRemoveListeners[id]();
        }
        if (this._globalMM) {
            this._globalMM.removeDelayedFrameScript(this._FRAME_SCRIPT_URL);
        }
    },
    showHighlight: function (window, target, effect) {
        let UITourArguments = this._createShowHighlightBaseArgumentsForUITour(window);
        UITourArguments.push(target, effect);
        UITour.showHighlight.apply(UITour, UITourArguments);
    },
    hideHighlight: function (window) {
        UITour.hideHighlight(window);
    },
    showInfo: function (window, target, tutorialData) {
        let UITourArguments = this._createShowInfoBaseArgumentsForUITour(window);
        let {title, text, icon, buttons, options} = tutorialData;
        let buttonsData = this._createButtonsData(window, buttons);
        let optionsData = this._createOptionsData(window, options);
        UITourArguments.push(target, title, text, icon, buttonsData, optionsData);
        UITour.showInfo.apply(UITour, UITourArguments);
    },
    hideInfo: function (window) {
        UITour.hideInfo(window);
    },
    _wrappedCallbacksRemoveListeners: Object.create(null),
    _scriptLoaded: false,
    get _FRAME_SCRIPT_URL() {
        return "data:application/javascript;charset=utf-8," + encodeURIComponent("(" + FRAME_SCRIPT.toSource().replace(/\{\{PREFIX\}\}/g, this._app.name) + ")()");
    },
    _createShowHighlightBaseArgumentsForUITour: function (window) {
        let result = [];
        if (this._browserVersion.isGreaterThan("34.*")) {
            result.push(window);
        }
        return result;
    },
    _createShowInfoBaseArgumentsForUITour: function (window) {
        let result = [];
        if (this._browserVersion.isGreaterThan("35.*")) {
            result.push(window, window.getBrowser().mCurrentBrowser.messageManager);
        } else if (this._browserVersion.isGreaterThan("34.*")) {
            result.push(window, window.document);
        } else {
            result.push(window.document);
        }
        return result;
    },
    _createButtonsData: function (window, buttons = []) {
        let result = [];
        buttons.forEach(button => {
            result.push({
                label: button.label,
                icon: button.icon,
                style: button.style,
                callbackID: this._wrapCallbackAndReturnId(button.callback, window)
            });
        });
        return result;
    },
    _createOptionsData: function (window, options = {}) {
        let result = {};
        [
            "closeButtonCallback",
            "targetCallback"
        ].forEach(callbackName => {
            if (options && options[callbackName]) {
                result[callbackName + "ID"] = this._wrapCallbackAndReturnId(options[callbackName], window);
            }
        });
        return result;
    },
    _wrapCallbackAndReturnId: function (callback, window) {
        let id = this._generateId();
        let addListener;
        let removeListener;
        function listener(callbackId, data) {
            if (callbackId !== id) {
                return;
            }
            removeListener();
            if (typeof callback === "function") {
                callback(data);
            }
        }
        if (this._browserVersion.isLessThan("35.*")) {
            let listenerTarget = window.document;
            let eventListener = function (event) {
                if (typeof event.detail !== "object") {
                    return;
                }
                listener(event.detail.callbackID, event.detail.data);
            };
            addListener = function () {
                listenerTarget.addEventListener("mozUITourResponse", eventListener);
            };
            removeListener = function () {
                listenerTarget.removeEventListener("mozUITourResponse", eventListener);
                this._clearCachedRemoveListener(id);
            }.bind(this);
        } else {
            if (!this._globalMM) {
                this._globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
            }
            if (!this._scriptLoaded) {
                this._globalMM.loadFrameScript(this._FRAME_SCRIPT_URL, true);
            }
            let listenerTarget = this._globalMM;
            let appName = this._app.name;
            let receiver = function (message) {
                listener(message.data.callbackID, message.data.data);
            };
            addListener = function () {
                listenerTarget.addMessageListener(appName + ":UITour:SendPageCallback", receiver);
            };
            removeListener = function () {
                listenerTarget.removeMessageListener(appName + ":UITour:SendPageCallback", receiver);
                this._clearCachedRemoveListener(id);
            }.bind(this);
        }
        this._wrappedCallbacksRemoveListeners[id] = removeListener;
        addListener();
        return id;
    },
    _generateId: function () {
        return Math.random().toString(36).replace(/[^a-z]+/g, "");
    },
    _clearCachedRemoveListener: function (id) {
        if (this._wrappedCallbacksRemoveListeners[id]) {
            delete this._wrappedCallbacksRemoveListeners[id];
        }
    }
};
