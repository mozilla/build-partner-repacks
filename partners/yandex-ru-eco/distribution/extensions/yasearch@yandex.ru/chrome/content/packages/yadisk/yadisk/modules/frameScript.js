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
    const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:yadisk:event";
    const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:yadisk:preferences";
    let yadisk = {
        get dataImageRegexp() {
            if (!this._dataImageRegexp) {
                this._dataImageRegexp = /^data:image\/((x\-ms\-)?bmp|gif|jpeg|jpg|png|tiff|svg\+xml|x\-icon);base64,/i;
            }
            return this._dataImageRegexp;
        },
        init: function () {
            addMessageListener(PREFERENCES_MESSAGE_NAME, this);
            addMessageListener("UITour:SendPageCallback", this);
            let state = sendSyncMessage(PREFERENCES_MESSAGE_NAME, { type: "getSuggestStates" })[0];
            if (state) {
                this._onStateChanged(state);
            }
        },
        handleEvent: function (aEvent) {
            if (!aEvent.isTrusted) {
                return;
            }
            let target = aEvent.originalTarget;
            switch (aEvent.type) {
            case "scroll":
                this._disarmShowButtonCheck();
                if (this._element) {
                    this._hideButton();
                }
                break;
            case "mousemove":
                this._armShowButtonCheck(aEvent);
                break;
            case "visibilitychange":
                if (!this._element) {
                    return;
                }
                if (this._element.ownerDocument === target) {
                    this._hideButton();
                }
                break;
            case "keydown":
                this._hideButton();
                break;
            case "mouseup":
                this._hideButton();
                break;
            case "resize":
                this._hideButton();
                break;
            default:
                return;
            }
        },
        _active: {
            popup: false,
            document: false
        },
        _eventsArray: [
            "mousemove",
            "scroll",
            "visibilitychange",
            "resize",
            "keydown",
            "mouseup"
        ],
        _hideSent: false,
        _dataImageRegexp: null,
        _element: null,
        _showableArea: null,
        _armShowButtonCheck: function (aEvent) {
            this._disarmShowButtonCheck();
            this._showCheckTimeout = setTimeout(this._tryShowButton.bind(this, aEvent), 100);
        },
        _disarmShowButtonCheck: function () {
            if (this._showCheckTimeout) {
                clearTimeout(this._showCheckTimeout);
            }
        },
        _tryShowButton: function (aEvent) {
            let target;
            try {
                target = aEvent.originalTarget;
            } catch (e) {
                return;
            }
            if (this._element) {
                if (this._element === target) {
                    return;
                }
                if (target.ownerDocument === this._element.ownerDocument) {
                    if (this._showableArea.left < aEvent.clientX && this._showableArea.right > aEvent.clientX && this._showableArea.top < aEvent.clientY && this._showableArea.bottom > aEvent.clientY) {
                        return;
                    }
                }
            }
            let element = this._getSuitableElement(aEvent);
            if (!element) {
                this._hideButton();
                return;
            }
            let mediaInfo = this._getMediaInfoByElement(element);
            if (!mediaInfo) {
                this._hideButton();
                return;
            }
            let showableArea = this._getElementShowableArea(element);
            if (!showableArea) {
                this._hideButton();
                return;
            }
            let buttonPosition = this._findButtonPosition(element, showableArea);
            if (!buttonPosition) {
                this._hideButton();
                return;
            }
            this._element = element;
            this._showableArea = showableArea;
            this._sendShowMessage({
                position: buttonPosition,
                mediaInfo: mediaInfo
            });
        },
        _hideButton: function () {
            this._element = null;
            this._showableArea = null;
            this._sendHideMessage();
        },
        _enablePopupButton: function () {
            if (this._active.popup) {
                return;
            }
            this._eventsArray.forEach(function (aEventType) {
                addEventListener(aEventType, this, true);
            }, this);
            this._active.popup = true;
        },
        _disablePopupButton: function () {
            if (!this._active.popup) {
                return;
            }
            this._hideButton();
            this._eventsArray.forEach(function (aEventType) {
                removeEventListener(aEventType, this, true);
            }, this);
            this._active.popup = false;
        },
        _sendHideMessage: function () {
            if (this._hideSent) {
                return;
            }
            this._hideSent = true;
            this._sendAsyncMessage("hidePopupButton");
        },
        _sendShowMessage: function (aData) {
            this._hideSent = false;
            this._sendAsyncMessage("showPopupButton", aData);
        },
        _sendAsyncMessage: function (aMessage, aData) {
            let data = { type: aMessage };
            if (aData) {
                Object.keys(aData).forEach(function (aKey) {
                    data[aKey] = aData[aKey];
                });
            }
            sendAsyncMessage(EVENT_MESSAGE_NAME, data);
        },
        _getSuitableElement: function (aEvent) {
            if (!this._isHTMLElementBeyondPointer(aEvent.clientX, aEvent.clientY)) {
                return null;
            }
            if (!this._isProperElementPageURL()) {
                return null;
            }
            return this._getProperElement(aEvent.clientX, aEvent.clientY, aEvent.originalTarget.ownerDocument);
        },
        _isTransparentElement: function (aElement) {
            let window = aElement.ownerDocument.defaultView;
            let compStyle = window.getComputedStyle(aElement);
            let bgOpacity = 1;
            let bgc = compStyle.getPropertyValue("background-color");
            if (bgc.indexOf("rgba") === 0) {
                let colorComponents = bgc.substring(5, bgc.length - 1).replace(/\s/g, "").split(",");
                bgOpacity = parseFloat(colorComponents.pop());
                if (colorComponents.join("") === "255255255") {
                    bgOpacity /= 2;
                }
            } else if (bgc.indexOf("rgb") !== 0) {
                bgOpacity = 0;
            }
            let opacity = parseFloat(compStyle.getPropertyValue("opacity"));
            if (isNaN(opacity)) {
                opacity = 1;
            }
            return opacity * bgOpacity <= 0.4;
        },
        _isHTMLElementBeyondPointer: function (x, y) {
            let node = content.document.elementFromPoint(x, y);
            if (node && /\[object XrayWrapper \[object HTML(Object|Embed)Element\]\]/.test(String(node))) {
                return false;
            }
            return true;
        },
        _isProperElementPageURL: function () {
            let currentURL = content.document.documentURI;
            return !this._isYandexDiskURL(currentURL);
        },
        _getProperElement: function (aX, aY, aDocument) {
            let digger = new Digger(aDocument);
            let {element} = digger.digElement({
                x: aX,
                y: aY,
                isTargetElement: this._isProperElement.bind(this),
                isStopElement: aElement => !this._isTransparentElement(aElement)
            });
            return element;
        },
        _isProperElement: function (aElement) {
            return this._isProperImage(aElement);
        },
        _isProperImage: function (aElement) {
            if ((aElement.localName || "").toLowerCase() !== "img") {
                return false;
            }
            let imgBO = aElement.getBoundingClientRect();
            return imgBO.width >= 200 && imgBO.height >= 100;
        },
        _isElementVisibleInArea: function (elem, showableArea, x, y) {
            let digger = new Digger(elem.ownerDocument);
            let {element} = digger.digElement({
                x: x,
                y: y,
                isTargetElement: elem,
                isStopElement: aElement => {
                    if (!this._isTransparentElement(aElement)) {
                        let elemBO = aElement.getBoundingClientRect();
                        let elemAllWithinArea = showableArea.left < elemBO.left && showableArea.right > elemBO.right && showableArea.top < elemBO.top && showableArea.bottom > elemBO.bottom;
                        if (!elemAllWithinArea) {
                            return true;
                        }
                    }
                    return false;
                }
            });
            return Boolean(element);
        },
        _getMediaInfoByElement: function (aElement) {
            let mediaURL = this._getTargetURL(aElement);
            if (!mediaURL) {
                return null;
            }
            let pageInfo = this._getPageInfo();
            return {
                url: mediaURL,
                meta: {
                    alt: this._getImageAltText(aElement),
                    pageURL: pageInfo.url,
                    pageTitle: pageInfo.title
                }
            };
        },
        _getTargetURL: function (aElement) {
            let mediaURL = this._getElementSourceURL(aElement);
            if (!(mediaURL && this._isProperElementURL(mediaURL))) {
                return null;
            }
            return mediaURL;
        },
        _isProperElementURL: function (aURL) {
            return this._isImageURL(aURL) && !this._isYandexDiskURL(aURL);
        },
        _getElementSourceURL: function (aElement) {
            return aElement.currentURI && aElement.currentURI.spec;
        },
        _getImageAltText: function (aImg) {
            return aImg.getAttribute("alt");
        },
        _getPageInfo: function () {
            let doc = content.document;
            return {
                title: doc.title,
                url: doc.location && doc.location.href
            };
        },
        _getWindowScale: function (aWindow) {
            return aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils).fullZoom;
        },
        _isImageURL: function (aURL) {
            return /^(https?|file):\/\//i.test(aURL) || this.dataImageRegexp.test(aURL);
        },
        _isYandexDiskURL: function (aURL) {
            return /^https?:\/\/(yadi\.sk|([^/]*\.)?disk\.yandex\.[^/]+|[^/]+\.storage\.yandex\.net\/rdisk)\//i.test(aURL);
        },
        _findButtonPosition: function (aElement, aArea) {
            let scale = this._getWindowScale(content);
            let buttonWidth = Math.ceil(28 / scale);
            let buttonHeight = Math.ceil(28 / scale);
            let position = this._findButtonPositionInArea(aArea, aElement, buttonWidth, buttonHeight);
            if (!position) {
                return null;
            }
            return {
                x: (aArea.offsetX - aArea.left + position.x) * scale,
                y: (aArea.offsetY - aArea.top + position.y) * scale
            };
        },
        _findButtonPositionInArea: function (aShowableArea, aElement, aButtonWidth, aButtonHeight) {
            let isImage = false;
            let left = aShowableArea.left;
            let top = aShowableArea.top;
            let right = aShowableArea.right;
            let bottom = aShowableArea.bottom;
            let leftStartPosition = left + 10;
            let topStartPosition = top + 10;
            let buttonX = leftStartPosition;
            let buttonY = topStartPosition;
            let eps = 2;
            while (!isImage) {
                for (let i = 0; i < 3 && !isImage; i++) {
                    if (i > 0) {
                        buttonX += aButtonWidth;
                    }
                    isImage = this._isElementVisibleInArea(aElement, aShowableArea, buttonX, buttonY);
                }
                if (isImage) {
                    break;
                }
                buttonX = this._binarySearch(buttonX, right, eps, function (aCoord) {
                    return this._isElementVisibleInArea(aElement, aShowableArea, aCoord, buttonY);
                }.bind(this));
                if (right - buttonX >= aButtonWidth) {
                    isImage = true;
                    break;
                }
                if (bottom - buttonY < aButtonHeight) {
                    break;
                }
                buttonY += Math.ceil(aButtonHeight / 2);
                buttonX = leftStartPosition;
            }
            if (!isImage) {
                return null;
            }
            return {
                x: buttonX,
                y: buttonY
            };
        },
        _binarySearch: function (aBottomLimit, aTopLimit, aEps, aTestCallback) {
            let inverted = false;
            let topEdge = aTopLimit;
            let bottomEdge = aBottomLimit;
            if (aBottomLimit > aTopLimit) {
                inverted = true;
                topEdge = aBottomLimit;
                bottomEdge = aTopLimit;
            }
            while (topEdge - bottomEdge > aEps) {
                let middle = Math.floor((topEdge + bottomEdge) / 2);
                if (aTestCallback(middle)) {
                    if (inverted) {
                        bottomEdge = middle;
                    } else {
                        topEdge = middle;
                    }
                } else {
                    if (inverted) {
                        topEdge = middle;
                    } else {
                        bottomEdge = middle;
                    }
                }
            }
            return !inverted ? topEdge : bottomEdge;
        },
        _getElementShowableArea: function (aElement, aMinWidth, aMinHeight) {
            let elemBO = aElement.getBoundingClientRect();
            let areaWidth = elemBO.right - this._getPaddingBorderValue(aElement, "right");
            let areaHeight = elemBO.bottom - this._getPaddingBorderValue(aElement, "bottom");
            let showableArea = new Area(0, 0, areaWidth, areaHeight);
            let elementProcessed = false;
            let levelsCounter = 0;
            let maxLevels = 5;
            let target = aElement;
            while (target) {
                if (++levelsCounter > maxLevels) {
                    return null;
                }
                let targetOwnerWindow = target.ownerDocument.defaultView;
                let scrollbars = this._getWindowScrollbarsWidth(targetOwnerWindow);
                let targetOwnerWindowWidth = targetOwnerWindow.innerWidth - scrollbars.width;
                let targetOwnerWindowHeight = targetOwnerWindow.innerHeight - scrollbars.height;
                let targetElementOffset = this._getTargetOffsetFromWindow(target);
                let newLeft = targetElementOffset.x + showableArea.offsetX;
                let newTop = targetElementOffset.y + showableArea.offsetY;
                if (!elementProcessed) {
                    newLeft = -newLeft;
                    newTop = -newTop;
                }
                if (newLeft < 0) {
                    showableArea.cut(Math.abs(newLeft), Area.VERTICAL);
                }
                if (newTop < 0) {
                    showableArea.cut(Math.abs(newTop), Area.HORIZONTAL);
                }
                let newRight = showableArea.offsetX + showableArea.width;
                let newBottom = showableArea.offsetY + showableArea.height;
                let windowAreaDiffRight = newRight - targetOwnerWindowWidth;
                let windowAreaDiffBottom = newBottom - targetOwnerWindowHeight;
                if (windowAreaDiffRight > 0) {
                    showableArea.cut(windowAreaDiffRight, Area.VERTICAL, "end");
                }
                if (windowAreaDiffBottom > 0) {
                    showableArea.cut(windowAreaDiffBottom, Area.HORIZONTAL, "end");
                }
                if (elementProcessed) {
                    showableArea.moveCoord(targetElementOffset);
                }
                elementProcessed = true;
                target = targetOwnerWindow.frameElement;
            }
            return showableArea;
        },
        _getWindowScrollbarsWidth: function (aWindow) {
            let result = {
                width: 0,
                height: 0
            };
            let targetOwnerWindowUtils = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
            let sbWidth = {};
            let sbHeight = {};
            try {
                targetOwnerWindowUtils.getScrollbarSize(false, sbWidth, sbHeight);
            } catch (e) {
                sbWidth.value = sbHeight.value = 0;
            }
            result.width = sbWidth.value;
            result.height = sbHeight.value;
            return result;
        },
        _getTargetOffsetFromWindow: function (aTarget) {
            let currentOffset = {
                x: 0,
                y: 0
            };
            let targetPaddingBorderLeft = this._getPaddingBorderValue(aTarget, "left");
            let targetPaddingBorderTop = this._getPaddingBorderValue(aTarget, "top");
            currentOffset.x += targetPaddingBorderLeft;
            currentOffset.y += targetPaddingBorderTop;
            let targetBO = aTarget.getBoundingClientRect();
            currentOffset.x += targetBO.left;
            currentOffset.y += targetBO.top;
            return currentOffset;
        },
        _getPaddingBorderValue: function (aElem, aPropName) {
            let elemStyle = aElem.ownerDocument.defaultView.getComputedStyle(aElem);
            return parseInt(elemStyle.getPropertyValue("padding-" + aPropName) || 0, 10) + parseInt(elemStyle.getPropertyValue("border-" + aPropName + "-width") || 0, 10);
        },
        _onStateChanged: function (aStates) {
            if (typeof aStates.popup !== "undefined") {
                if (aStates.popup) {
                    this._enablePopupButton();
                } else {
                    this._disablePopupButton();
                }
            }
        },
        receiveMessage: function (aMessage) {
            let {name, data, target} = aMessage;
            switch (name) {
            case PREFERENCES_MESSAGE_NAME:
                if (data.type === "change") {
                    this._onStateChanged(data.states);
                }
                break;
            case "UITour:SendPageCallback":
                sendAsyncMessage("yasearch:UITour:SendPageCallback", data);
                break;
            default:
                return;
            }
        }
    };
    function Digger(aDocument) {
        if (!aDocument) {
            throw new Error("Document is obligatory.");
        }
        this._doc = aDocument;
    }
    Digger.prototype.digElement = function (aOptions) {
        let x = aOptions.x;
        let y = aOptions.y;
        if (!(typeof x === "number" && typeof y === "number")) {
            throw new Error("X, Y coordinates are obligatory.");
        }
        let isTargetElement = aOptions.isTargetElement;
        let isStopElement = aOptions.isStopElement;
        let maxDepth = aOptions.depth || 5;
        let currentDepth = 0;
        let searchStopped = false;
        let stylePropertyName = "visibility";
        let stylePropertyValue = "hidden";
        let element = null;
        let hiddenElements = [];
        let hiddenElementsStyleMap = new WeakMap();
        let inspectedElement = this._doc.elementFromPoint(x, y);
        while (inspectedElement && currentDepth < maxDepth) {
            if (hiddenElements.indexOf(inspectedElement) > -1) {
                break;
            }
            if (this._test(inspectedElement, isTargetElement)) {
                element = inspectedElement;
                break;
            }
            if (inspectedElement === this._doc.body || inspectedElement === this._doc.documentElement) {
                break;
            }
            if (this._test(inspectedElement, isStopElement)) {
                hiddenElements.push(inspectedElement);
                searchStopped = true;
                break;
            }
            let stylePropertyActualValue = inspectedElement.style[stylePropertyName];
            inspectedElement.style[stylePropertyName] = stylePropertyValue;
            hiddenElements.push(inspectedElement);
            hiddenElementsStyleMap.set(inspectedElement, stylePropertyActualValue);
            inspectedElement = this._doc.elementFromPoint(x, y);
            currentDepth++;
        }
        if (hiddenElements.length) {
            hiddenElements.forEach(storedElement => {
                let styleValue = hiddenElementsStyleMap.get(storedElement);
                if (typeof styleValue !== "undefined") {
                    storedElement.style[stylePropertyName] = styleValue;
                }
            });
        }
        return {
            element: element,
            stack: hiddenElements,
            stopped: searchStopped
        };
    };
    Digger.prototype._test = function (aTarget, aTester) {
        if (typeof aTester === "function") {
            return aTester(aTarget);
        }
        return aTester === aTarget;
    };
    function Area(x, y, w, h) {
        if (!(typeof x === "number" && typeof y === "number" && typeof w === "number" && typeof h === "number")) {
            throw new Error("All arguments are obligatory.");
        }
        this._originalX = x;
        this._originalY = y;
        this._width = w;
        this._height = h;
        this._offset = {
            x: 0,
            y: 0
        };
    }
    Object.defineProperty(Area, "VERTICAL", {
        enumberable: true,
        get: function () {
            return 1;
        }
    });
    Object.defineProperty(Area, "HORIZONTAL", {
        enumberable: true,
        get: function () {
            return 2;
        }
    });
    Area.prototype.cut = function (aStartPoint, aCutType, aStartFrom) {
        if (!aStartPoint || aStartPoint < 0) {
            throw new Error("Cut coord should be positive.");
        }
        if (!aCutType) {
            aCutType = Area.VERTICAL;
        }
        if (!(aCutType === Area.VERTICAL || aCutType === Area.HORIZONTAL)) {
            throw new Error("Wrong cut type to cut the Area.");
        }
        if (!aStartFrom || [
                "start",
                "end"
            ].indexOf(aStartFrom) < 0) {
            aStartFrom = "start";
        }
        if (aCutType === Area.VERTICAL) {
            if (aStartPoint > this.width) {
                aStartPoint = this.width;
            }
            if (aStartFrom === "start") {
                this._originalX += aStartPoint;
            }
            this._width -= aStartPoint;
        } else {
            if (aStartPoint > this.height) {
                aStartPoint = this.height;
            }
            if (aStartFrom === "start") {
                this._originalY += aStartPoint;
            }
            this._height -= aStartPoint;
        }
    };
    Area.prototype.moveCoord = function (x, y) {
        if (x && typeof x === "object") {
            y = x.y;
            x = x.x;
        }
        if (!(typeof x === "number" && typeof y === "number")) {
            throw new Error("x or y are missing.");
        }
        this._offset.x += x;
        this._offset.y += y;
    };
    Object.defineProperty(Area.prototype, "offsetX", {
        enumberable: true,
        get: function () {
            return this._originalX + this._offset.x;
        }
    });
    Object.defineProperty(Area.prototype, "offsetY", {
        enumberable: true,
        get: function () {
            return this._originalY + this._offset.y;
        }
    });
    Object.defineProperty(Area.prototype, "width", {
        enumberable: true,
        get: function () {
            return this._width;
        }
    });
    Object.defineProperty(Area.prototype, "height", {
        enumberable: true,
        get: function () {
            return this._height;
        }
    });
    Object.defineProperty(Area.prototype, "left", {
        enumberable: true,
        get: function () {
            return this._originalX;
        }
    });
    Object.defineProperty(Area.prototype, "right", {
        enumberable: true,
        get: function () {
            return this._originalX + this._width;
        }
    });
    Object.defineProperty(Area.prototype, "top", {
        enumberable: true,
        get: function () {
            return this._originalY;
        }
    });
    Object.defineProperty(Area.prototype, "bottom", {
        enumberable: true,
        get: function () {
            return this._originalY + this._height;
        }
    });
    yadisk.init();
}());
