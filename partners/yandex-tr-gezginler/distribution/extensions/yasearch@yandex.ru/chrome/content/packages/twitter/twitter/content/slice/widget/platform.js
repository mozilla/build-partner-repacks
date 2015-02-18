window.Twitter = window.Twitter || {};
Twitter.platform = {
    _localStringPrefix: "",
    _initialized: false,
    init: function (config) {
        var localStringPrefix = "";
        if (this._initialized) {
            return this;
        }
        this._initialized = true;
        var platform = window.external;
        if (!platform) {
            platform = window.platform;
        }
        this._platform = platform;
        this._sliceStatPrefix = (/Firefox/i.test(navigator.userAgent) ? "fx." : "ie.") + config.statName + ".slice.";
        this._notifStatPrefix = (/Firefox/i.test(navigator.userAgent) ? "fx." : "ie.") + config.statName + ".";
        this._localStringPrefix = localStringPrefix || "";
        var self = this;
        this._helperPlatformListener = function (message) {
            if (!message) {
                self.logError("[slice] onMessage: empty message");
                return;
            }
            var topic = message.message || message;
            var data = message.data || null;
            self.fireEvent(topic, data);
        };
        this._platform.onMessage.addListener(this._helperPlatformListener);
        var settingsListener = function (name, value) {
            self.fireEvent(":settings-change", {
                name: name,
                value: value
            });
        };
        try {
            this._platform.observeSettings(settingsListener);
            this._helperSettingsListener = settingsListener;
        } catch (exc) {
        }
        var notunloaded = true;
        function unload(e) {
            Y.log("*** call unload()!!! event=" + (e || window.event).type);
            if (notunloaded) {
                Y.log("*** unload");
                try {
                    self.clearInterval();
                    self.fireEvent("unload");
                    self._removePlatformListener();
                    notunloaded = false;
                } catch (exc) {
                }
            }
        }
        window.onunload = unload;
        if (navigator.userAgent.indexOf("MSIE") == -1) {
            window.onbeforeunload = unload;
        }
        if (window.jQuery) {
            jQuery.ajaxSetup({
                crossDomain: false,
                xhr: function () {
                    return new platform.XMLHttpRequest();
                }
            });
        }
        if (!this._enableContextMenu) {
            document.oncontextmenu = function (e) {
                e = e || window.event;
                var tag = (e.target || e.srcElement).tagName;
                return tag === "INPUT" || tag === "TEXTAREA";
            };
            window.onerror = function (e, ur, ln) {
                Y.log("ERROR: " + e + "  (" + ln + "  url=" + ur + ")");
                return false;
            };
        }
        ;
        return this;
    },
    statLog: function (dtype, pid, cid, path) {
        var url = "http://clck.yandex.ru/click" + "/dtype=" + encodeURIComponent(dtype) + "/pid=" + pid + "/cid=" + cid + "/path=" + encodeURIComponent(path) + "/*";
        Twitter.http.GET({
            url: url,
            callback: Function.empty
        });
    },
    statLogNotif: function (type) {
        this.statLog("stred", 12, 72358, this._notifStatPrefix + type);
    },
    statLogWidget: function (type) {
        this.statLog("stred", 12, 72359, this._sliceStatPrefix + type);
    },
    getOption: function (name) {
        return this._platform.getOption(name);
    },
    setOption: function (name, value) {
        this._platform.setOption(name, value);
    },
    resizeWindowTo: function (cx, cy) {
        this._platform.resizeWindowTo(cx, cy);
    },
    createRequest: function () {
        return new this._platform.XMLHttpRequest();
    },
    setInterval: function (ms) {
        this.clearInterval();
        var curtime = new Date().valueOf();
        var self = this;
        this._workTimer = setInterval(function () {
            var time = new Date().valueOf();
            self.fireEvent(":timer", time - curtime);
            curtime = time;
        }, ms || 10);
    },
    clearInterval: function () {
        if (this._workTimer) {
            clearInterval(this._workTimer);
            this._workTimer = null;
        }
    },
    logDebug: function (str) {
        this._platform.logger.debug("[slice]: " + str);
    },
    logError: function (str) {
        this._platform.logger.error(str);
    },
    branding: function (conf) {
        if (!conf.current) {
            conf.current = {};
            var bran = (conf.branding || {})[this._platform.brandID];
            $.extend(conf.current, conf.common || {}, bran || {});
        }
        return conf.current;
    },
    getScript: function (url, callback) {
        this.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script"
        });
    },
    ajax: function (config, attemptsCount) {
        attemptsCount = attemptsCount || 1;
        if (config.dataType == "script" || config.dataType == "jsonp") {
            config.crossDomain = true;
        }
        function request() {
            attemptsCount--;
            return $.ajax(config);
        }
        if (attemptsCount > 1) {
            var oldError = config.error || Function.empty;
            config.error = function () {
                if (attemptsCount) {
                    request();
                } else {
                    oldError.apply(this, arguments);
                }
            };
        }
        request();
    },
    getCookie: function (url, name, http) {
        if (!/^https?:/.test(url)) {
            url = "http://" + url;
        }
        return this._platform.getCookie(url, name, !!http);
    },
    openSettings: function () {
        if (!window.closed) {
            window.close();
        }
        this._platform.showSettings();
    },
    openNewTab: function (url) {
        this._platform.navigate(url, "new tab");
        window.close();
    },
    localStr: function (key) {
        var str = this._platform.getLocalizedString(this._localStringPrefix + key) || "";
        if (!str) {
            this.logError("[slice] getLocalizedString: (" + this.lang() + ") empty string '" + this._localStringPrefix + key + "'");
        }
        return str;
    },
    lang: function () {
        return this._platform.language;
    },
    getParam: function (param, url) {
        return (RegExp("[?&]" + param + "=([^&#]*)", "i").exec(url || document.location.href) || "")[1] || "";
    },
    platformLocalization: function (mainBlock) {
        if (mainBlock.platform_i18n) {
            mainBlock.platform_i18n(this);
        }
        for (var bl in BEM.blocks) {
            if (/^b-/.test(bl)) {
                var blocks = mainBlock.findBlocksInside(bl);
                if (blocks) {
                    for (var i = 0; i < blocks.length; ++i) {
                        if (blocks[i].platform_i18n) {
                            blocks[i].platform_i18n(this, i);
                        }
                    }
                }
            }
        }
    },
    currentPage: function () {
        return this._platform.currentPage;
    },
    logAction: function (actionCode) {
        this._platform.logCustomAction(actionCode);
    },
    _helperPlatformListener: null,
    _helperSettingsListener: null,
    _pltfListeners: {},
    _removePlatformListener: function () {
        if (this._helperPlatformListener) {
            this._platform.onMessage.removeListener(this._helperPlatformListener);
            this._helperPlatformListener = null;
        }
        if (this._helperSettingsListener) {
            this._platform.ignoreSettings(this._helperSettingsListener);
            this._helperSettingsListener = null;
        }
    },
    reloadSlice: function () {
        Y.log("*** reload slice ***");
        this._removePlatformListener();
        window.location.reload(true);
    },
    removeListener: function (topic, callback) {
        if (!this._pltfListeners[topic]) {
            return;
        }
        if (!callback) {
            this._pltfListeners[topic] = null;
        } else {
            var listeners = this._pltfListeners[topic];
            for (var i = 0; i < listeners.length; ++i) {
                if (listeners[i].func == callback) {
                    listeners.splice(i, 1);
                    --i;
                }
            }
        }
    },
    addListener: function (topic, callback, scope) {
        this._pltfListeners[topic] = this._pltfListeners[topic] || [];
        this._pltfListeners[topic].push({
            func: callback,
            scope: scope
        });
        return this;
    },
    addBlockListeners: function (block) {
        var handlers = block.handlers;
        if (handlers && !block.__addBlockListeners_called) {
            for (var i in handlers) {
                if (handlers.hasOwnProperty(i)) {
                    var val = handlers[i];
                    if (typeof val == "string" && handlers.hasOwnProperty(val)) {
                        val = handlers[val];
                    }
                    if (typeof val == "function") {
                        this.addListener(i, val, block);
                    }
                }
            }
            block.__addBlockListeners_called = true;
        }
        return this;
    },
    initAllHandlers: function (mainBlock) {
        this.addBlockListeners(mainBlock);
        for (var bl in BEM.blocks) {
            if (/^b-/.test(bl)) {
                var blocks = mainBlock.findBlocksInside(bl);
                if (blocks) {
                    for (var i = 0; i < blocks.length; ++i) {
                        this.addBlockListeners(blocks[i]);
                    }
                }
            } else {
                if (/^i-/.test(bl)) {
                    this.addBlockListeners(BEM.blocks[bl]);
                }
            }
        }
    },
    sendMessage: function (msg, data) {
        if (typeof msg == "object") {
            this._platform.sendMessage(msg);
        }
        var obj = { message: msg };
        if (data !== undefined) {
            obj.data = data;
        }
        this._platform.sendMessage(obj);
    },
    fireEvent: function (topic, data) {
        var listeners = this._pltfListeners[topic];
        if (listeners) {
            for (var i = 0; i < listeners.length; ++i) {
                var ret = listeners[i].func.call(listeners[i].scope || window, topic, data);
                if (ret === false) {
                    break;
                }
            }
        }
    },
    md5: function (str, callback, scope) {
        this.addListener("md5", function md5Callback(topic, data) {
            if (typeof callback === "function")
                scope ? callback.call(scope, data) : callback(data);
            this.removeListener("md5", md5Callback);
        }, this);
        window.platform.sendMessage({
            message: "md5",
            data: str
        });
    },
    shuffle: function (inArray) {
        var outArray = Array.prototype.slice.call(inArray);
        for (var j, x, i = outArray.length; i; j = parseInt(Math.random() * i), x = outArray[--i], outArray[i] = outArray[j], outArray[j] = x);
        return outArray;
    }
};
