(function () {
    window.Y = {};
    Y.browser = {
        ie: navigator.userAgent.indexOf("MSIE") != -1,
        ff: /Firefox|Gecko/i.test(navigator.userAgent),
        version: function () {
            var msieRes = /MSIE (\d.\d)/.exec(navigator.userAgent);
            var ffRes = /Firefox\/(\d.\d)/.exec(navigator.userAgent);
            var res = msieRes || ffRes;
            if (res) {
                return parseFloat(res[1]);
            }
        }()
    };
    Y.ObserverService = {
        attachObserver: function (topic, handler) {
            Twitter.platform.addListener(topic, handler);
            return handler;
        },
        removeObserver: function (topic, handler) {
            Twitter.platform.removeListener(topic, handler);
        },
        notifyObservers: function (topic, data) {
            Twitter.platform.fireEvent(topic, data);
        },
        getInstance: function () {
            return this;
        }
    };
    Y.observer = function (topic, data) {
        Y.ObserverService.getInstance().notifyObservers(topic, data);
    };
    Y.xParams = {};
    Y.xData = {};
    Y.DEBUG = true;
    Y.log = function (x) {
        if (Y.DEBUG) {
            Twitter.platform.logDebug(x);
        }
    };
    Y.logObj = function (x, prefix) {
        if (Y.DEBUG) {
            Y.log((prefix ? prefix + "\n" : "") + JSON.stringify(x, "", 4));
        }
    };
    Y.windowSize = [
        559,
        582
    ];
    Y.init = function () {
        try {
            if (window.__debug_Tools_) {
                window.__debug_Tools_();
            }
            Twitter.platform.init({ statName: "twitter" });
            Twitter.platform.resizeWindowTo(Y.windowSize[0], Y.windowSize[1]);
            Y.log("***** init");
            Twitter.utils.platformQuery.init();
            var OS = Y.ObserverService.getInstance();
            Twitter.unreadInfo.init();
            OS.attachObserver("user:info", function (t, data) {
                Y.xParams.my_id = data.uid;
                Y.log("data.uid=" + data.uid);
                Twitter.twitterAccount.credentials.uid = data.uid;
                Y.l8n.entities = Y.XTools.parseEntities(data.dtd);
                Y.XTools.initXJT(data);
                Y.UI.buildUI(document.documentElement);
                Y.log("Twitter.counters.init(true);");
                Twitter.counters.init(true);
            });
            Y.sendMessage("slice:load", void 0);
        } catch (e) {
            throw e;
        }
    };
    Y.sendMessage = function (topic, message) {
        if (topic == "error") {
            alert(message);
        }
        var func = Twitter.realSliceCommands[topic];
        if (func) {
            Twitter.platform.sendMessage(topic, message);
            return;
        }
        var cmd = Twitter.sliceCommands[topic];
        if (cmd) {
            cmd(message, topic);
        }
    };
    Y.DOM = {};
    (function () {
        var CLASS_SEPARATOR = /\s+/, CLASS_JOINER = " ";
        this.attachEvent = document.addEventListener ? function (obj, name, handler) {
            obj.addEventListener(name.slice(2), handler, false);
        } : function (obj, name, handler) {
            obj.attachEvent(name, handler);
        };
        this.empty = function (cnt) {
            cnt.innerHTML = "";
            if (cnt.firstChild) {
                cnt.removeChild(cnt.firstChild);
            }
        };
        this.createNode = function (tag, id, className, html) {
            var node;
            if (Y.browser.ie) {
                node = document.createElement("div");
            } else {
                node = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
            }
            if (className) {
                node.className = className;
            }
            if (id) {
                node.setAttribute("id", id);
            }
            if (html) {
                node.innerHTML = html;
            }
            return node;
        };
        this.hasClass = function (el, className) {
            var classList = el.className.split(CLASS_SEPARATOR);
            return classList.indexOf(className) !== -1;
        };
        this.addClass = function (el, className) {
            var classList = el.className.split(CLASS_SEPARATOR);
            if (classList.indexOf(className) !== -1) {
                return false;
            }
            classList.push(className);
            el.className = classList.join(CLASS_JOINER);
            return true;
        };
        this.removeClass = function (el, className) {
            var classNameArray = className.split(CLASS_SEPARATOR);
            var classList = el.className.split(CLASS_SEPARATOR);
            el.className = classList.diff(classNameArray).join(CLASS_JOINER);
        };
        this.toggleClass = function (el, className) {
            var classNameArray = className.split(CLASS_SEPARATOR);
            for (var name, i = 0; i < l; ++i) {
                name = classNameArray[i];
                if (this.hasClass(el, name)) {
                    this.removeClass(el, name);
                } else {
                    this.addClass(el, name);
                }
            }
        };
        this.getElementsByClassName = function (container, className) {
            var res = [];
            var elements = container.getElementsByTagName("*");
            for (var element, i = 0, l = elements.length; i < l; ++i) {
                element = elements[i];
                if (this.hasClass(element, className)) {
                    res.push(element);
                }
            }
            return res;
        };
        this.selectText = function (input, start, length) {
            if (input.createTextRange) {
                var selRange = input.createTextRange();
                selRange.collapse(true);
                selRange.moveStart("character", start);
                selRange.moveEnd("character", length);
                selRange.select();
            } else if (input.setSelectionRange) {
                input.setSelectionRange(start, start + length);
            } else if (typeof input.selectionStart !== "undefined") {
                input.selectionStart = start;
                input.selectionEnd = start + length;
            }
        };
        this.insertAtCursor = function (input, str) {
            var value = input.value;
            if (value == "") {
                input.value = str;
                return;
            }
            if (typeof input.createTextRange !== "undefined") {
                var range = document.selection.createRange();
                range.text = str;
            } else if (typeof input.selectionStart !== "undefined") {
                var start = input.selectionStart, end = input.selectionEnd, value = input.value;
                input.value = value.slice(0, start) + str + value.slice(end);
                input.selectionStart = input.selectionEnd = start + str.length;
            }
        };
        this.insertWordAtCursor = function (input, str) {
            var spaceRx = /\s/;
            var info = this.getCaretInfo(input);
            var start = info.start, end = info.end, value = input.value;
            var prevSymbol = value[start - 1], nextSymbol = value[end];
            if (typeof prevSymbol !== "undefined" && !spaceRx.test(prevSymbol)) {
                str = " " + str;
            }
            if (typeof nextSymbol !== "undefined" && !spaceRx.test(nextSymbol)) {
                str = str + " ";
            }
            this.insertAtCursor(input, str);
        };
        this.getCaretInfo = function (oTextarea) {
            var docObj = oTextarea.ownerDocument;
            var result = {
                start: 0,
                end: 0,
                caret: 0
            };
            if (Y.browser.ie) {
                if (oTextarea.tagName.toLowerCase() == "textarea") {
                    if (oTextarea.value.charCodeAt(oTextarea.value.length - 1) < 14) {
                        oTextarea.value = oTextarea.value.replace(/34/g, "") + String.fromCharCode(28);
                    }
                    var oRng = docObj.selection.createRange();
                    var oRng2 = oRng.duplicate();
                    oRng2.moveToElementText(oTextarea);
                    oRng2.setEndPoint("StartToEnd", oRng);
                    result.end = oTextarea.value.length - oRng2.text.length;
                    oRng2.setEndPoint("StartToStart", oRng);
                    result.start = oTextarea.value.length - oRng2.text.length;
                    result.caret = result.end;
                    if (oTextarea.value.substr(oTextarea.value.length - 1) == String.fromCharCode(28)) {
                        oTextarea.value = oTextarea.value.substr(0, oTextarea.value.length - 1);
                    }
                } else {
                    var range = docObj.selection.createRange();
                    var r2 = range.duplicate();
                    result.start = 0 - r2.moveStart("character", -100000);
                    result.end = result.start + range.text.length;
                    result.caret = result.end;
                }
            } else {
                result.start = oTextarea.selectionStart;
                result.end = oTextarea.selectionEnd;
                result.caret = result.end;
            }
            if (result.start < 0) {
                result = {
                    start: 0,
                    end: 0,
                    caret: 0
                };
            }
            return result;
        };
    }.call(Y.DOM));
}());
