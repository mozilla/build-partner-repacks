Y.UI.MessageComposer = function (container) {
    var me = this;
    var collapseTimeout = null;
    var doNotCollapse = false;
    this.container = container;
    this.messageElement = Y.DOM.getElementsByClassName(container, "message-status")[0];
    this.messagePoster = Y.DOM.getElementsByClassName(container, "message-poster")[0];
    this.textarea = Y.DOM.getElementsByClassName(container, "textarea")[0];
    this.messageTextElement = Y.DOM.getElementsByClassName(container, "-message-status-text")[0];
    this.charcounter = Y.DOM.getElementsByClassName(container, "charcounter")[0];
    this.sendButton = Y.DOM.getElementsByClassName(container, "message-composer-send")[0];
    this.shortenButton = Y.DOM.getElementsByClassName(container, "message-composer-shorten")[0];
    this.clearAll = Y.DOM.getElementsByClassName(container, "clear-all")[0];
    this.msgDesc = Y.DOM.getElementsByClassName(container, "message-poster-header")[0];
    this.msgListClassName = "message-list";
    this._msgReplyData = null;
    this._isReply = false;
    this.opened = false;
    try {
        this.magicRule = function () {
            var shts = document.styleSheets;
            var selector = "." + this.msgListClassName;
            for (var j, jl, sh, rules, rule, i = 0, l = shts.length; i < l; ++i) {
                sh = shts[i];
                if ("cssRules" in sh) {
                    rules = sh.cssRules;
                } else {
                    rules = sh.rules;
                }
                for (j = 0, jl = rules.length; j < jl; ++j) {
                    rule = rules[j];
                    if (rule.selectorText.toLowerCase() == selector) {
                        return rule;
                    }
                }
            }
            var newRule;
            var newRuleIndex;
            if (sh.insertRule) {
                newRuleIndex = sh.insertRule(selector + "{}", rules.length);
                newRule = rules[newRuleIndex];
            } else {
                newRuleIndex = sh.addRule(selector, null, rules.length);
                newRule = rules[rules.length - 1];
            }
            return newRule;
        }.call(this);
    } catch (e) {
        this.magicRule = null;
    }
    this._animTimeline = null;
    this._animating = false;
    this._locked = false;
    this._canSend = false;
    this._textHasLinks = false;
    this._closePending = false;
    Y.DOM.attachEvent(this.textarea, "onkeypress", function (event) {
        return me.updateCharCounter();
    });
    Y.DOM.attachEvent(this.textarea, "onkeydown", function (event) {
        return me.updateCharCounter();
    });
    Y.DOM.attachEvent(this.textarea, "onkeyup", function (event) {
        return me.updateCharCounter();
    });
    var OS = Y.ObserverService.getInstance();
    OS.attachObserver("before-popup", function (t, data) {
        me.currentPageUrl = data.url;
        me._updateShortenButton();
    });
    OS.attachObserver("message:info", function (topic, data) {
        data = data || {};
        me.showMessage(data);
    });
    OS.attachObserver("message:locked", function (topic, data) {
        if (data == "true") {
            me.lock();
        } else {
            me.unlock();
        }
    });
    OS.attachObserver("twitlink:reply", function (topic, data) {
        var msg = data;
        return me.reply(msg);
    });
    OS.attachObserver("twitlink:direct-reply", function (topic, data) {
        var msg = data;
        return me.directReply(msg);
    });
    OS.attachObserver("message:text-value", function (topic, data) {
        me.setText(data);
    });
    OS.attachObserver("message:insert-text", function (topic, data) {
        me.textarea.focus();
        Y.DOM.insertWordAtCursor(me.textarea, data);
        me.updateCharCounter();
    });
    var value = this.textarea.value;
    if (value.length > 0) {
        this.open();
    }
    this.updateCharCounter();
    Y.DOM.attachEvent(this.textarea, "onfocus", function (event) {
        me._closePending = false;
        me.open();
    });
    Y.DOM.attachEvent(this.textarea, "onclick", function (event) {
        if (!me._opened) {
            me.open();
        }
    });
    Y.DOM.attachEvent(this.textarea, "onblur", function (event) {
        if (doNotCollapse) {
            return;
        }
        me._closePend();
    });
    Y.DOM.attachEvent(this.textarea, "onkeydown", function (event) {
        var keyCode = event.keyCode;
        var ctrlPressed = event.ctrlKey || event.metaKey;
        if (keyCode == 13 && ctrlPressed) {
            me.send();
        }
        if (keyCode == 27) {
            if (me.opened) {
                me.setText("");
                event.cancelBubble = true;
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                return false;
            }
        }
    });
    Y.DOM.attachEvent(this.sendButton, "onclick", function (event) {
        Twitter.platform.statLogWidget("send");
        me.send();
    });
    Y.DOM.attachEvent(this.shortenButton, "onmousedown", function (event) {
        doNotCollapse = true;
        setTimeout(function () {
            doNotCollapse = false;
        }, 50);
    });
    Y.DOM.attachEvent(this.shortenButton, "onblur", function (event) {
        me._closePend();
    });
    Y.DOM.attachEvent(this.shortenButton, "onclick", function (event) {
        me.insertURL();
    });
    Y.DOM.attachEvent(this.clearAll, "onclick", function (event) {
        me._setReplyState(null);
        me.setText("");
    });
    this._closePend = function () {
        var me = this;
        this._closePending = true;
        collapseTimeout = setTimeout(function () {
            if (me._closePending) {
                me._closePending = false;
                me.close();
            }
        }, 250);
    };
};
Y.UI.MessageComposer.prototype = {
    _classNames: {
        composerOpened: "message-composer-active",
        composerLocked: "message-composer-locked",
        messageError: "message-status-error",
        negativeCharcounter: "charcounter-negative",
        replyState: "message-composer-reply-state"
    },
    _maxChars: 140,
    _maxInput: 210,
    _minInputHeight: 15,
    _maxInputHeight: 60,
    _descHeight: 12,
    _magicHeight: 15 + 495,
    _magicMargin: 16 + 30,
    constructor: Y.UI.MessageComposer,
    showMessage: function (message) {
        var _this = this;
        if (!message) {
            message = { text: "" };
        }
        this.messageTextElement.innerHTML = tr(message.text);
        switch (message.type) {
        case "error":
            Y.DOM.addClass(this.messageElement, this._classNames.messageError);
            break;
        default:
            Y.DOM.removeClass(this.messageElement, this._classNames.messageError);
        }
        if (message.hasOwnProperty("showTime")) {
            clearTimeout(this.infoClearTimeout);
            this.infoClearTimeout = setTimeout(function () {
                _this.messageTextElement.innerHTML = "";
            }, message.showTime * 1000);
        }
        if (message.hasOwnProperty("cleanComposerDelay")) {
            var cleanTime = message.cleanComposerDelay * 1000;
            var emptyValue = " ";
            var oldValue = this.textarea.value;
            clearTimeout(this.messageClearTimeout);
            this.messageClearTimeout = setTimeout(function () {
                if (message.type !== "error" && _this.textarea.value == oldValue) {
                    _this.setText(emptyValue);
                }
            }, cleanTime);
        }
        if (message.hasOwnProperty("unlockComposerDelay")) {
            var unlockTime = message.unlockComposerDelay * 1000;
            clearTimeout(this.unlockComposerTimeout);
            this.unlockComposerTimeout = setTimeout(function () {
                if (_this.textarea.value == " ") {
                    _this._setReplyState(null);
                    _this.setText("");
                }
                _this.unlock();
            }, unlockTime);
        }
    },
    open: function () {
        if (this._animating) {
            this._animTimeline.stop();
        }
        if (this.opened)
            return false;
        this.opened = true;
        var dsh = this._descHeight;
        var drd = this._isDirectReply() ? 0 : dsh;
        var h1 = this._minInputHeight, h2 = this._maxInputHeight + drd, mh = this._magicHeight, mm = this._magicMargin, me = this;
        this._animTimeline = new Y.anim.Timeline(0.1, function (x) {
            var h = Math.round(h1 + (h2 - h1) * x);
            var mlh = mh - h - mm - dsh + drd;
            me.setMessageListsHeight(mlh);
            me.setTextareaHeight(h);
        });
        this._animating = true;
        Y.DOM.addClass(this.container, this._classNames.composerOpened);
        this._animTimeline.start(function () {
            me._animating = false;
        });
        this.textarea.focus();
        Y.DOM.selectText(this.textarea, this.textarea.value.length, 0);
        return true;
    },
    setTextareaHeight: function (h) {
        this.textarea.style.height = h + "px";
    },
    setMessageListsHeight: function (h) {
        if (this.magicRule) {
            this.magicRule.style.height = h + "px";
        } else {
            if (!this.listCache) {
                this.fillMessageListsCache();
            }
            for (var i = 0, el, l = this.listCache.length; i < l; ++i) {
                el = this.listCache[i];
                el.style.height = h + "px";
            }
        }
    },
    fillMessageListsCache: function () {
        var els = document.getElementsByTagName("*");
        this.listCache = [];
        for (var i = 0, l = els.length, el; i < l; ++i) {
            el = els[i];
            if (Y.DOM.hasClass(el, this.msgListClassName)) {
                this.listCache.push(el);
            }
        }
    },
    close: function () {
        if (this._animating) {
            this._animTimeline.stop();
        }
        var value = this.textarea.value;
        var length = value.length;
        if (!this.opened || length > 0 || this._isDirectReply()) {
            return false;
        }
        this._setReplyState(null);
        this.opened = false;
        var h1 = this._maxInputHeight, h2 = this._minInputHeight, mh = this._magicHeight, me = this;
        this._animTimeline = new Y.anim.Timeline(0.05, function Q2(x) {
            var h = parseInt(h1 - (h1 - h2) * x);
            var mlh = mh - h;
            me.setTextareaHeight(h);
            me.setMessageListsHeight(mlh);
        });
        this._animating = true;
        this._animTimeline.start(function () {
            me._animating = false;
            me.showMessage(null);
        });
        Y.DOM.removeClass(this.container, this._classNames.composerOpened);
        return true;
    },
    updateCharCounter: function () {
        var value = this.textarea.value;
        var length = value.length;
        var counterValue = this._maxChars - length;
        if (length >= this._maxInput) {
            this.textarea.value = value.substring(0, this._maxInput);
        }
        if (counterValue < 0) {
            Y.DOM.addClass(this.charcounter, this._classNames.negativeCharcounter);
            this.charcounter.innerHTML = "-" + -counterValue;
            this._canSend = false;
        } else {
            Y.DOM.removeClass(this.charcounter, this._classNames.negativeCharcounter);
            this.charcounter.innerHTML = counterValue;
            if (length == 0) {
                this._canSend = false;
            } else {
                this._canSend = true;
            }
        }
        this._updateButtons();
        this._updateReplyState();
        return true;
    },
    _checkIsReplyTo: function (screen_name) {
        var rx = new RegExp("(^|\\b)@" + screen_name + "\\b", "i");
        return rx.test(this.textarea.value);
    },
    _updateReplyState: function () {
        var flagClass = this._classNames.replyState;
        var screen_name = this._msgReplyData && this._msgReplyData.screen_name;
        var dr = this._isDirectReply();
        if (dr || this._checkIsReplyTo(screen_name)) {
            if (!this._isReply) {
                this._isReply = true;
                Y.DOM.addClass(this.container, flagClass);
            }
        } else {
            if (this._isReply) {
                this._isReply = false;
                Y.DOM.removeClass(this.container, flagClass);
            }
        }
    },
    _updateButtons: function () {
        this._updateSendButton();
        this._updateShortenButton();
    },
    _setReplyState: function (screen_name, msg_id, user_id) {
        if (!screen_name) {
            this._msgReplyData = null;
        } else {
            this._msgReplyData = {
                screen_name: screen_name,
                msg_id: msg_id,
                user_id: user_id
            };
        }
        this._updateReplyState();
        var dr = this._isDirectReply();
        if (dr) {
            var strDesc = (tr("&slice.composer.desc.dm;") || "").replace("{username}", "@" + this._msgReplyData.screen_name);
            this.msgDesc.innerHTML = strDesc + ":";
        } else {
            Y.DOM.empty(this.msgDesc);
        }
        if (!this._animating && this.opened) {
            this.setTextareaHeight(this._maxInputHeight + (dr ? 0 : this._descHeight));
        }
    },
    _updateShortenButton: function () {
        var url = this.currentPageUrl;
        this._isCurrentURLShortable = this._isURLShortable(url);
        var buttonActive = !this._locked && this._isCurrentURLShortable;
        if (buttonActive) {
            this.shortenButton.removeAttribute("disabled");
        } else {
            this.shortenButton.setAttribute("disabled", "true");
        }
    },
    _updateSendButton: function () {
        var buttonActive = !this._locked & this._canSend;
        if (buttonActive) {
            this.sendButton.removeAttribute("disabled");
        } else {
            this.sendButton.setAttribute("disabled", "true");
        }
    },
    setText: function (text) {
        if (text) {
            this.textarea.value = text;
            this.open();
        } else {
            this.textarea.value = "";
            this.close();
        }
        this.updateCharCounter();
    },
    lock: function () {
        this._locked = true;
        Y.DOM.addClass(this.container, this._classNames.composerLocked);
        this.textarea.setAttribute("disabled", "true");
        this._updateButtons();
    },
    unlock: function () {
        this._locked = false;
        Y.DOM.removeClass(this.container, this._classNames.composerLocked);
        this.textarea.removeAttribute("disabled");
        this._updateButtons();
    },
    reply: function (msg) {
        var message = "";
        var username = msg.username;
        var prefix = null;
        var msg_id = msg.msg_id;
        this._setReplyState(username, msg_id);
        var newValue = this._formatMessage(message, username, prefix);
        this.setText(newValue);
        this.open();
        this.textarea.focus();
    },
    directReply: function (msg) {
        this._setReplyState(msg.username, "dm", msg.user_id);
        this.setText("");
        this.open();
        this.textarea.focus();
    },
    _isDirectReply: function () {
        return this._msgReplyData && this._msgReplyData.msg_id == "dm";
    },
    _getDescr: function () {
        return this.msgDesc.innerHTML;
    },
    retweet: function (msg) {
        var username = msg.username;
        var text = msg.text;
        this.setText([
            "RT @",
            username,
            " ",
            text
        ].join(""));
    },
    send: function () {
        if (!this._locked && this._canSend) {
            var text = this.textarea.value;
            var message = {};
            if (this._isDirectReply()) {
                message.text = text;
                message.user_id = this._msgReplyData.user_id;
            } else {
                message.status = text;
                if (this._isReply) {
                    message.in_reply_to_status_id = this._msgReplyData.msg_id;
                }
            }
            Y.sendMessage("twitter:post", message);
        }
    },
    insertURL: function () {
        var url = this.currentPageUrl;
        if (this._isURLShortable(url)) {
            var me = this;
            Twitter.utils.shortenUrl(url, function (data) {
                me.textarea.focus();
                Y.DOM.insertWordAtCursor(me.textarea, data);
                me.updateCharCounter();
            }, function (status) {
            });
        } else {
        }
    },
    _isURLShortable: function (url) {
        if (!url) {
            return false;
        }
        var isShortable = false;
        var schemeRx = /\b(.*?\:)/i;
        var shortableRx = /^https?\:/i;
        var parts = schemeRx.exec(url || "");
        if (parts && parts.length == 2) {
            var scheme = parts[1];
        } else {
            return isShortable;
        }
        return shortableRx.test(scheme);
    },
    _formatMessage: function (message, username, prefix) {
        var prefixRx = /^((rt)|(d))\s*/i;
        var usernameRx = /^@(\w+)\s*/i;
        var newMessage = message;
        var EMPTY = "";
        if (prefix !== undefined) {
            newMessage = newMessage.replace(prefixRx, EMPTY);
        }
        if (username !== undefined) {
            newMessage = newMessage.replace(usernameRx, EMPTY);
        }
        if (username) {
            newMessage = "@" + username + " " + newMessage;
        }
        if (prefix) {
            newMessage = prefix + " " + newMessage;
        }
        return newMessage;
    }
};
