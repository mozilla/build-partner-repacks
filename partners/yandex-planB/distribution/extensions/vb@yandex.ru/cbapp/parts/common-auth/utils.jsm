"use strict";
const EXPORTED_SYMBOLS = ["utils"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const URI_FIXUP = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
const utils = {
    init: function yUtils_init(shareableAPI) {
        this._shareableAPI = shareableAPI;
    },
    _shareableAPI: null,
    soundService: Cc["@mozilla.org/sound;1"].createInstance(Ci.nsISound),
    sendRequest: function yUtils_sendRequest(aUrl, aDetails) {
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        if (aDetails.background) {
            request.mozBackgroundRequest = true;
        }
        request.open(aDetails.data ? "POST" : "GET", aUrl, true);
        if (aDetails.bypassCache) {
            request.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
        }
        if (aDetails.data) {
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            request.setRequestHeader("Connection", "close");
        }
        if (aDetails.referrer) {
            request.setRequestHeader("Referrer", aDetails.referrer);
        }
        if (aDetails.timeout) {
            request.timeout = aDetails.timeout;
        }
        if (aDetails.callbackFunc) {
            let target = request.QueryInterface(Ci.nsIDOMEventTarget);
            target.addEventListener("load", aDetails.callbackFunc, false);
            target.addEventListener("error", aDetails.callbackFunc, false);
            target.addEventListener("timeout", aDetails.callbackFunc, false);
        }
        request.send(aDetails.data || null);
        return request;
    },
    tryCreateFixupURI: function yUtils_tryCreateFixupURI(aString) {
        try {
            return URI_FIXUP.createFixupURI(aString, URI_FIXUP.FIXUP_FLAG_NONE);
        } catch (e) {
        }
        return null;
    },
    _VALID_URL_RE: /^(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,4}(:[\d]+)?(\/([-+=_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?$/,
    isValidByRegExpURL: function yUtils_isValidByRegExpURL(strURL) {
        return this._VALID_URL_RE.test(strURL);
    },
    isValidURL: function yUtils_isValidURL(strURL) {
        try {
            this.newURI(strURL, null, null);
            return true;
        } catch (ex) {
        }
        return false;
    },
    getSelectionString: function yUtils_getSelectionString(browserWindow, imgHintTpl) {
        let focusedWindow = browserWindow.document.commandDispatcher.focusedWindow;
        if (focusedWindow == browserWindow) {
            focusedWindow = browserWindow.content;
        }
        if (!focusedWindow) {
            return undefined;
        }
        let selection = focusedWindow.getSelection();
        if (selection.isCollapsed || !selection.rangeCount) {
            return undefined;
        }
        let selRange = selection.getRangeAt(0);
        let selContainer = selRange && selRange.commonAncestorContainer ? selRange.commonAncestorContainer : null;
        let imageElements = selContainer && selContainer.getElementsByTagNameNS ? Array.slice(selContainer.getElementsByTagNameNS(selContainer.namespaceURI, "img")) : [];
        const TMP_ALT_ATTR_NAME = "__yandexBarTmpAlt";
        for (let [
                    ,
                    imgElem
                ] in Iterator(imageElements)) {
            imgElem.setAttribute(TMP_ALT_ATTR_NAME, imgElem.getAttribute("alt"));
            imgElem.setAttribute("alt", imgHintTpl.replace("%url", imgElem.src, "g"));
        }
        let selectedText = selection.toString();
        for (let [
                    ,
                    imgElem
                ] in Iterator(imageElements)) {
            imgElem.setAttribute("alt", imgElem.getAttribute(TMP_ALT_ATTR_NAME));
            imgElem.removeAttribute(TMP_ALT_ATTR_NAME);
        }
        return selectedText || undefined;
    },
    getDocumentDescription: function yUtils_getDocumentDescription(aDocument) {
        let description = "";
        let metaNodes = aDocument.getElementsByTagName("meta");
        for (let i = 0, len = metaNodes.length; i < len; i++) {
            let metaName = (metaNodes[i].name || "").toLowerCase();
            if (metaName == "description" && metaNodes[i].content) {
                description = metaNodes[i].content + "\n\n";
                break;
            }
        }
        return description;
    },
    newURI: function yUtils_newURI(spec, origCharset, baseURI) {
        return Services.io.newURI(spec, origCharset, baseURI);
    },
    _ESCAPE_RE: /([.*+?^=!:${}()|[\]\/\\])/g,
    escapeRE: function yUtils_escapeRE(aString) {
        return String(aString).replace(this._ESCAPE_RE, "\\$1");
    },
    get _UConverter() {
        let UConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        UConverter.charset = "UTF-8";
        delete this._UConverter;
        this.__defineGetter__("_UConverter", function _UConverter() {
            return UConverter;
        });
        return this._UConverter;
    },
    utf8Tounicode: function yUtils_utf8Tounicode(utf8String) {
        return this._UConverter.ConvertToUnicode(utf8String);
    },
    stringEndsWith: function yUtils_stringEndsWith(string, ending) {
        return string.substr(-ending.length) === ending;
    },
    get mostRecentBrowserWindow() {
        return Services.wm.getMostRecentWindow("navigator:browser");
    },
    getBrowserHostCookies: function yUtils_getBrowserHostCookies() {
        let cookies = {};
        const nsICookie = Ci.nsICookie;
        let cookEnum = Services.cookies.enumerator;
        while (cookEnum.hasMoreElements()) {
            let cookie = cookEnum.getNext();
            if (!(cookie && cookie instanceof nsICookie)) {
                continue;
            }
            let strHost = cookie.host;
            if (!cookies[strHost]) {
                cookies[strHost] = [];
            }
            let newCookie = Object.create(null);
            [
                "name",
                "host",
                "path",
                "expires"
            ].forEach(function (prop) {
                newCookie[prop] = cookie[prop];
            });
            try {
                newCookie.value = decodeURIComponent(cookie.value);
            } catch (e) {
                newCookie.value = cookie.value;
            }
            cookies[strHost].push(newCookie);
        }
        return cookies;
    },
    _getHostURIFromURL: function yUtils__getHostURIFromURL(strURL) {
        let host = strURL.replace(/^\s*([-\w]*:\/+)?/, "");
        return this.newURI("http://" + host);
    },
    showPromptExWithYesNo: function yUtils_showPromptExWithYesNo(parent, strTitle, strText) {
        return this._showPromptEx(parent, strTitle, strText, null, null, null, null, { value: false }, Services.prompt.STD_YES_NO_BUTTONS);
    },
    showPromptEx: function yUtils_showPromptEx(parent, strTitle, strText, strBtnTitle0, strBtnTitle1, strBtnTitle2, strCheckMsg, bCheckState) {
        return this._showPromptEx(parent, strTitle, strText, strBtnTitle0, strBtnTitle1, strBtnTitle2, strCheckMsg, bCheckState);
    },
    _showPromptEx: function yUtils__showPromptEx(parent, strTitle, strText, strBtnTitle0, strBtnTitle1, strBtnTitle2, strCheckMsg, bCheckState, initFlags) {
        let prompter = Services.prompt;
        let flags = (initFlags || 0) + prompter.BUTTON_POS_0_DEFAULT;
        if (strBtnTitle0) {
            flags += prompter.BUTTON_POS_0 * prompter.BUTTON_TITLE_IS_STRING;
        }
        if (strBtnTitle1) {
            flags += prompter.BUTTON_POS_1 * prompter.BUTTON_TITLE_IS_STRING;
        }
        if (strBtnTitle2) {
            flags += prompter.BUTTON_POS_2 * prompter.BUTTON_TITLE_IS_STRING;
        }
        let resultCode = prompter.confirmEx(parent, strTitle, strText, flags, strBtnTitle0, strBtnTitle1, strBtnTitle2, strCheckMsg, bCheckState);
        return resultCode;
    },
    showPrompt: function yUtils_showPrompt(parent, strTitle, strText) {
        return Services.prompt.confirm(parent, strTitle, strText);
    },
    showAlert: function yUtils_showPrompt(parent, strTitle, strText) {
        return Services.prompt.alert(parent, strTitle, strText);
    },
    playSound: function yUtils_playSound(strURI) {
        try {
            let tempLocalFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            tempLocalFile.initWithPath(strURI);
            let uri = Services.io.newFileURI(tempLocalFile);
            this.soundService.play(uri);
        } catch (e) {
            Cu.reportError("Could not play sound. " + e);
        }
    },
    notifyObservers: function yUtils_notifyObservers(strEvent, strState) {
        Services.obs.notifyObservers(null, strEvent, strState);
    },
    getHoverCell: function yUtils_getHoverCell(event, document) {
        let docBoxObject = document.documentElement.boxObject;
        let x = event.screenX - docBoxObject.screenX;
        let y = event.screenY - docBoxObject.screenY;
        let row = {};
        let col = {};
        let obj = {};
        let parent = event.originalTarget.parentNode;
        parent && parent.treeBoxObject && parent.treeBoxObject.getCellAt(x, y, row, col, obj);
        if (row.value < 0) {
            return null;
        }
        return {
            row: row.value,
            column: col.value
        };
    },
    isReqError: function yUtils_isReqError(req) {
        return !req || req.type === "error" || !req.target || req.target.status !== 200;
    },
    getNCRndStr: function yUtils_getNCRndStr() {
        return "ncrnd=" + (100000 + Math.floor(Math.random() * 899999));
    },
    createXMLString: function yUtils_createXMLString(strXML) {
        let str = strXML.replace(/[^\r\n\x9\xA\xD\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "").replace(/<\?xml .+\?>[\r\n]*/, "").replace(/<!DOCTYPE[^\]]*]>[\r\n]*/, "").replace(/<!DOCTYPE[^>]*>[\r\n]*/, "");
        return str;
    },
    getDOMWindowForChannel: function yUtils_getDOMWindowForChannel(aChannel) {
        try {
            return aChannel.loadGroup.groupObserver.QueryInterface(Ci.nsIWebProgress).DOMWindow;
        } catch (e) {
        }
        return null;
    },
    getBrowserForDOMWindow: function yUtils_getBrowserForDOMWindow(aWindow) {
        let chromeWindow = this.getChromeWindowForDOMWindow(aWindow);
        if (!chromeWindow) {
            return null;
        }
        return chromeWindow.getBrowser().getBrowserForDocument(aWindow.document) || null;
    },
    getChromeWindowForDOMWindow: function yUtils_getChromeWindowForDOMWindow(aWindow) {
        let docShellTree;
        try {
            docShellTree = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem);
        } catch (e) {
            return null;
        }
        if (docShellTree.itemType !== Ci.nsIDocShellTreeItem.typeContent) {
            return null;
        }
        let chromeWindow;
        try {
            chromeWindow = docShellTree.rootTreeItem.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow).wrappedJSObject;
        } catch (e) {
            return null;
        }
        return chromeWindow;
    }
};
utils.statistics = {
    log: function (cid, path) {
        utils._shareableAPI.Statistics.logClickStatistics({
            cid: cid,
            path: path
        });
    },
    logNotif: function (path) {
        utils.statistics.log(72358, path);
    },
    logWidget: function (path) {
        utils.statistics.log(72359, path);
    }
};
utils.NotificationSource = function NotificationSource() {
    this._listeners = {};
};
utils.NotificationSource.prototype = {
    constructor: utils.NotificationSource,
    addListener: function NotificationSource_addListener(topic, listener) {
        if (typeof listener != "object") {
            throw new TypeError("The listener must be an object");
        }
        let topicListeners = this._listeners[topic] || (this._listeners[topic] = []);
        if (topicListeners.indexOf(listener) >= 0) {
            return;
        }
        topicListeners.push(listener);
        this._listenerAdded(topic, listener);
    },
    removeListener: function NotificationSource_removeListener(topic, listener) {
        let topicListeners = this._listeners[topic] || (this._listeners[topic] = []);
        if (!topicListeners) {
            return;
        }
        let listenerIdx = topicListeners.indexOf(listener);
        if (listenerIdx < 0) {
            return;
        }
        topicListeners.splice(listenerIdx, 1);
        if (topicListeners.length < 1) {
            delete this._listeners[topic];
        }
        this._listenerRemoved(topic, listener);
    },
    removeAllListeners: function NotificationSource_removeAllListeners() {
        if (this._hasListeners) {
            this._listeners = {};
            this._listenerRemoved();
        }
    },
    _listeners: null,
    get _hasListeners() {
        for (let [
                    topic,
                    list
                ] in Iterator(this._listeners)) {
            if (list && list.length) {
                return true;
            }
        }
        return false;
    },
    _notifyListeners: function NotificationSource__notifyListeners(topic, data) {
        let topicListeners = this._listeners[topic];
        if (!topicListeners) {
            return;
        }
        topicListeners.forEach(function NotificationSource__notifyListenersFunc(listener) {
            try {
                if (this._listeners[topic].indexOf(listener) != -1) {
                    listener.observe(this, topic, data);
                }
            } catch (e) {
                Cu.reportError("Could not notify event listener.\n" + e);
            }
        }, this);
    },
    _listenerAdded: function NotificationSource__listenerAdded(topic, listener) {
    },
    _listenerRemoved: function NotificationSource__listenerRemoved(topic, listener) {
    }
};
utils.NotificationSource.objectMixIn = function NotificationSource_objectMixIn(object) {
    let notificationSourceInstance = new this();
    copy(Object.getPrototypeOf(notificationSourceInstance), object);
    copy(notificationSourceInstance, object);
    function copy(source, target) {
        Object.keys(source).forEach(function (aProp) {
            let descriptor = Object.getOwnPropertyDescriptor(source, aProp);
            Object.defineProperty(target, aProp, descriptor);
        });
    }
};
