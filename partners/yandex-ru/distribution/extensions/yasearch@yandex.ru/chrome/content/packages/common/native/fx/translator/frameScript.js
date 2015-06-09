(function () {
    "use strict";
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/Timer.jsm");
    const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:translator:event";
    const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:translator:preferences";
    let translator = {
        handleEvent: function (event) {
            let target = event.originalTarget;
            switch (event.type) {
            case "mousemove":
                if (this._mouseEventSending) {
                    event.stopPropagation();
                    this._startTryTranslate(event);
                } else {
                    if (!this._lastMouseMoveData) {
                        this._lastMouseMoveData = {
                            x: 0,
                            y: 0
                        };
                    }
                    let {x, y} = this._lastMouseMoveData;
                    let deltaX = Math.abs(event.clientX - x);
                    let deltaY = Math.abs(event.clientY - y);
                    if (deltaX < 3 && deltaY < 3) {
                        return;
                    }
                    this._lastMouseMoveData = {
                        x: event.clientX,
                        y: event.clientY
                    };
                    if (this._shouldTranslate(event)) {
                        this._lastTimeStamp = event.timeStamp;
                        this._startTryTranslate(event);
                    } else {
                        this._showTooltipTimeoutId = setTimeout(function () {
                            sendAsyncMessage(EVENT_MESSAGE_NAME, {
                                type: "hideBalloon",
                                doNotShowBalloon: false
                            });
                        }, this._preferences.intervalShow);
                    }
                }
                break;
            case "mouseout":
                this._lastMouseMoveData = null;
                sendAsyncMessage(EVENT_MESSAGE_NAME, { type: "mouseout" });
                break;
            case "keydown":
                if (this._shouldTranslate()) {
                    sendAsyncMessage(EVENT_MESSAGE_NAME, {
                        type: "hideBalloon",
                        doNotShowBalloon: false
                    });
                    return;
                }
                if (!this._shouldTranslate(event)) {
                    sendAsyncMessage(EVENT_MESSAGE_NAME, {
                        type: "hideBalloon",
                        doNotShowBalloon: true
                    });
                    return;
                }
                if (this._lastCtrlKeydown) {
                    return;
                }
                this._lastCtrlKeydown = Date.now();
                this.sendMouseEvent();
                break;
            case "keyup":
                if (this._shouldTranslate() || !this._shouldTranslate(event)) {
                    return;
                }
                this._lastCtrlKeydown = null;
                sendAsyncMessage(EVENT_MESSAGE_NAME, { type: "keyup" });
                break;
            case "scroll":
                sendAsyncMessage(EVENT_MESSAGE_NAME, {
                    type: "hideBalloon",
                    doNotShowBalloon: true
                });
                break;
            default:
                break;
            }
        },
        tryTranslate: function (aTextNode, aTextOffset, aClientX, aClientY) {
            if (typeof this._nodesForTranslation.get(aTextNode) === "undefined") {
                return false;
            }
            let nodeDocument;
            let nodeParent;
            try {
                nodeDocument = aTextNode.ownerDocument;
                nodeParent = aTextNode.parentNode;
            } catch (e) {
                return false;
            }
            let nodeValue = aTextNode.nodeValue;
            let elementFromPoint = nodeDocument && nodeDocument.elementFromPoint(aClientX, aClientY);
            if (!elementFromPoint || nodeParent !== elementFromPoint) {
                return false;
            }
            let [
                text,
                begin,
                end
            ] = this.getTranslatableTextFromString(nodeValue, aTextOffset);
            if (this.isBadText(text)) {
                return false;
            }
            let surroundingTextMaxLength = 1000;
            let surroundingText = text + " " + nodeValue;
            while (surroundingText.length < surroundingTextMaxLength / 4 && nodeParent) {
                surroundingText += " " + this._langDetector._getPlainText(nodeParent.textContent);
                nodeParent = nodeParent.parentNode;
            }
            surroundingText = surroundingText.substr(0, surroundingTextMaxLength);
            this._langDetector.detect(surroundingText, true);
            sendAsyncMessage(EVENT_MESSAGE_NAME, {
                type: "translate",
                text: text,
                clientX: aClientX,
                clientY: aClientY,
                begin: begin,
                end: end,
                surroundingText: surroundingText
            });
            this._nodesForTranslation.delete(aTextNode);
            return true;
        },
        getTranslatableTextFromString: function (aString, aOffset) {
            if (!aString) {
                return [];
            }
            let text = aString;
            let offset = aOffset || 0;
            let getLength = function getLength(aString, aReverse) {
                let str = aReverse ? aString.split("").reverse().join("") : aString;
                return (str.match(/^[\u0041-\u005a\u0061-\u007a\u00c0-\u1fff\-\'\u2019]+/) || [""])[0].length;
            };
            let begin = offset - getLength(text.substr(0, offset), true);
            let end = offset + getLength(text.substr(offset), false);
            text = end - begin <= 0 ? "" : text.substr(begin, end - begin);
            if (!text || /(^\-)|(\-$)|(\-{2,})|([\'\u2019]{2,})/.test(text)) {
                return [];
            }
            return [
                text,
                begin,
                end
            ];
        },
        isBadText: function (text) {
            return !text || /^\u00D7+$/.test(text);
        },
        isEventInRange: function (aNode, aStart, aEnd, aEvent) {
            let nodeRange = aNode.ownerDocument.createRange();
            nodeRange.setStart(aNode, aStart);
            nodeRange.setEnd(aNode, aEnd);
            let nodeBCR = nodeRange.getBoundingClientRect();
            if (nodeBCR.left > aEvent.clientX || nodeBCR.right < aEvent.clientX || nodeBCR.top > aEvent.clientY || nodeBCR.bottom < aEvent.clientY) {
                return false;
            }
            return true;
        },
        sendMouseEvent: function () {
            this._clearShowTimeout();
            let mouseData = this._lastMouseMoveData;
            if (!mouseData) {
                return;
            }
            this._sendMouseEvent(mouseData.x, mouseData.y);
        },
        receiveMessage: function ({data}) {
            if (data.type === "drop") {
                this.__preferences = null;
            }
        },
        _mouseEventSending: false,
        _nodesForTranslation: new WeakMap(),
        __preferences: null,
        get _preferences() {
            if (!this.__preferences) {
                this.__preferences = sendSyncMessage(PREFERENCES_MESSAGE_NAME, { type: "get" }).filter(Boolean)[0];
            }
            return this.__preferences;
        },
        __langDetector: null,
        get _langDetector() {
            if (!this.__langDetector) {
                this.__langDetector = Cu.import(this._preferences.langDetectorPath, {}).langDetector;
            }
            return this.__langDetector;
        },
        _shouldTranslate: function (aEvent) {
            let preferences = this._preferences;
            if (preferences.translateOnHover) {
                return true;
            }
            if (!aEvent) {
                return false;
            }
            let translateKeyPref = preferences.translateOnHoverOption;
            let ctrlKey = preferences.isMac ? "metaKey" : "ctrlKey";
            let shiftKey = "shiftKey";
            let ctrlKeyConst = preferences.TRANSLATE_ON_CTRLKEY;
            let shiftKeyConst = preferences.TRANSLATE_ON_SHIFTKEY;
            if (translateKeyPref == ctrlKeyConst || translateKeyPref == shiftKeyConst) {
                if (aEvent[ctrlKey] && aEvent.shiftKey) {
                    return false;
                }
            }
            if (translateKeyPref == ctrlKeyConst) {
                if (aEvent instanceof Ci.nsIDOMMouseEvent) {
                    return aEvent[ctrlKey];
                }
                return aEvent.keyCode === (preferences.isMac ? aEvent.DOM_VK_META : aEvent.DOM_VK_CONTROL);
            }
            if (translateKeyPref == shiftKeyConst) {
                if (aEvent instanceof Ci.nsIDOMMouseEvent) {
                    return aEvent[shiftKey];
                }
                return aEvent.keyCode === aEvent.DOM_VK_SHIFT;
            }
            return false;
        },
        _startTryTranslate: function (aEvent) {
            this._clearShowTimeout();
            let mouseData = this._lastMouseMoveData;
            if (!mouseData) {
                return;
            }
            let node = aEvent.rangeParent;
            if (!node || node.nodeType !== content.Node.TEXT_NODE) {
                return;
            }
            try {
                if (/^(chrome|about|yafd|bar):/.test(node.ownerDocument.documentURI)) {
                    return;
                }
            } catch (e) {
            }
            let offset = aEvent.rangeOffset;
            this._nodesForTranslation.set(node, true);
            this._showTooltipTimeoutId = setTimeout(() => {
                if (!this.tryTranslate(node, offset, mouseData.x, mouseData.y)) {
                    sendAsyncMessage(EVENT_MESSAGE_NAME, {
                        type: "hideBalloon",
                        doNotShowBalloon: false
                    });
                }
            }, this._preferences.intervalShow);
        },
        _clearShowTimeout: function () {
            clearTimeout(this._showTooltipTimeoutId);
            this._showTooltipTimeoutId = null;
        },
        _sendMouseEvent: function (aClientX, aClientY) {
            try {
                let node = content.document.elementFromPoint(aClientX, aClientY);
                if (node && /\[object XrayWrapper \[object HTML(Object|Embed)Element\]\]/.test(String(node))) {
                    return;
                }
            } catch (e) {
            }
            this._mouseEventSending = true;
            try {
                let domWindowUtils = content.window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
                domWindowUtils.sendMouseEvent("mousemove", aClientX, aClientY, 0, 0, 0);
            } catch (e) {
            }
            this._mouseEventSending = false;
        }
    };
    [
        "mousemove",
        "mouseout",
        "keydown",
        "scroll",
        "keyup"
    ].forEach(function (eventType) {
        addEventListener(eventType, translator, false);
    });
    addMessageListener(PREFERENCES_MESSAGE_NAME, translator);
}());
