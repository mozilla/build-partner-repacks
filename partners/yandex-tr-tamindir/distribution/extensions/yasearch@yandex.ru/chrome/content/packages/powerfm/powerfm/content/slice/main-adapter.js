;
define("main-adapter", function () {
});
define("api/dispatcher", [], function () {
    function Dispatcher() {
        this._observers = {};
    }
    var EMPTY_TOPIC = "<empty>";
    Dispatcher.prototype = {
        constructor: Dispatcher,
        notify: function (topic, data, callback) {
            var rt = false;
            var observers = this._observers[topic || EMPTY_TOPIC];
            if (observers) {
                observers.forEach(function (observer) {
                    var args = [
                        data,
                        callback
                    ];
                    if (topic) {
                        args.unshift(topic);
                    }
                    if (observer.callback.apply(observer.ctx, args)) {
                        rt = true;
                    }
                });
            }
            return rt;
        },
        notifyAsync: function (topic, data, callback) {
            var self = this;
            setTimeout(function () {
                self.notify(topic, data, callback);
            }, 1);
        },
        addListener: function (topic, callback, ctx) {
            if (!callback) {
                return null;
            }
            topic = topic || EMPTY_TOPIC;
            var observers = this._observers[topic] = this._observers[topic] || [];
            observers.push({
                callback: callback,
                ctx: ctx || null
            });
            return callback;
        },
        clear: function () {
            this._observers = {};
        },
        removeListener: function (topic, callback, ctx) {
            topic = topic || EMPTY_TOPIC;
            if (!callback) {
                delete this._observers[topic];
            } else {
                var observers = this._observers[topic];
                if (observers) {
                    ctx = ctx || null;
                    this._observers[topic] = observers.filter(function (observer) {
                        return !(observer.callback === callback && ctx == observer.ctx);
                    });
                }
            }
        }
    };
    return Dispatcher;
});
define("browser-adapter", ["api/dispatcher"], function (Dispatcher) {
    var platform = null;
    function getPlatform() {
        if (!platform) {
            platform = window.external;
        }
        return platform;
    }
    var MSG_OPTIONS_CHANGE = "options:change";
    function Adapter() {
        var dispatcher = this._dispatcher = new Dispatcher();
        this._helperPlatformListener = function (message) {
            if (message) {
                dispatcher.notify(message.message || message, message.data || null);
            }
        };
        getPlatform().onMessage.addListener(this._helperPlatformListener);
    }
    Adapter.prototype = {
        constructor: Adapter,
        browser: /Firefox/.test(navigator.userAgent) ? "fx" : "ie",
        adapterType: "fxie",
        getProductInfo: function () {
            return null;
        },
        sendMessage: function (topic, data, callback, ctx) {
            if (callback && ctx)
                callback = callback.bind(ctx);
            this._dispatcher.notifyAsync(topic, data, callback);
        },
        sendOuterMessage: function (topic, data, callback, ctx) {
            if (callback && ctx)
                callback = callback.bind(ctx);
            this.sendMessage(topic, data, callback);
            var msg = { message: topic };
            if (data != null) {
                msg.data = data;
            }
            getPlatform().sendMessage(msg, callback);
        },
        addListener: function (topic, callback, ctx) {
            var ret = this._dispatcher.addListener(topic, callback, ctx);
            if (topic === MSG_OPTIONS_CHANGE && !this._settingsListener) {
                this._settingsListener = function (settingName, settingValue) {
                    this.sendMessage(MSG_OPTIONS_CHANGE, {
                        name: settingName,
                        value: settingValue
                    });
                }.bind(this);
                getPlatform().observeSettings(this._settingsListener);
            }
            return ret;
        },
        removeListener: function (topic, callback, ctx) {
            this._dispatcher.removeListener(topic, callback, ctx);
        },
        getOption: function (name) {
            return getPlatform().getOption(name);
        },
        setOption: function (name, value) {
            getPlatform().setOption(name, value);
        },
        getLang: function () {
            return getPlatform().language;
        },
        getBrandId: function () {
            return getPlatform().brandID;
        },
        log: function (str) {
            getPlatform().logger.debug(str);
        },
        logObj: function (obj, prefix) {
            try {
                getPlatform().logger.debug((prefix || "") + (obj && typeof obj === "object" ? "\n" + JSON.stringify(obj, "", 3) : obj));
            } catch (exc) {
            }
        },
        getCookie: function (domain, name, path, httpOnly, secure, callback, ctx) {
            var path = path || "/";
            var value = getPlatform().getCookie((secure ? "https://" : "http://") + domain.replace(/^\./, "") + path, name, !!httpOnly);
            callback.call(ctx, value);
        },
        getString: function (key) {
            return getPlatform().getLocalizedString(key);
        },
        openSettings: function () {
            window.close();
            getPlatform().showSettings();
        },
        navigate: function (url, target) {
            getPlatform().navigate(url, target);
            window.close();
        },
        createXHR: function () {
            return new (getPlatform()).XMLHttpRequest();
        },
        resizeWindowTo: function (w, h) {
            getPlatform().resizeWindowTo(w, h);
        },
        isWindowVisible: function () {
            return getPlatform().isWindowVisible;
        },
        clear: function () {
            if (this._helperPlatformListener) {
                getPlatform().onMessage.removeListener(this._helperPlatformListener);
                this._helperPlatformListener = null;
            }
            if (this._settingsListener) {
                getPlatform().ignoreSettings(this._settingsListener);
                this._settingsListener = null;
            }
        },
        initSliceShowEvent: function () {
        },
        getNotificationManager: function () {
            return getPlatform().Notifications;
        },
        sendClickerStatistics: function (options) {
            var platform = getPlatform();
            if ("sendClickerStatistics" in platform) {
                platform.sendClickerStatistics(options);
                return true;
            } else {
                return false;
            }
        },
        getSlicePath: function () {
            return location.href.replace(/index\.html$/, "");
        },
        getCurrentTabUrl: function (callback, ctx) {
            callback.call(ctx, getPlatform().currentPage.url || "");
        },
        getWebSocket: function () {
            return getPlatform().WebSocket;
        },
        _helperPlatformListener: undefined,
        _settingsListener: undefined,
        _dispatcher: undefined
    };
    return new Adapter();
});
define("api/messages", ["browser-adapter"], function (adapter) {
    var messages = {
        addListeners: function (obj) {
            if (!(obj && obj.observers)) {
                return;
            }
            for (var i in obj.observers) {
                if (obj.observers.hasOwnProperty(i) && typeof obj.observers[i] === "function") {
                    adapter.addListener(i, obj.observers[i], obj);
                }
            }
        },
        removeListeners: function (obj) {
            if (!(obj && obj.observers)) {
                return;
            }
            for (var i in obj.observers) {
                if (obj.observers.hasOwnProperty(i) && typeof obj.observers[i] === "function") {
                    adapter.removeListener(i, obj.observers[i], obj);
                }
            }
        }
    };
    return messages;
});
define("api/manager", [
    "browser-adapter",
    "api/dispatcher",
    "api/messages"
], function (adapter, Dispatcher, messages) {
    var manager = {};
    manager.onReady = function () {
        var readyQueue = new Dispatcher();
        var isIE8 = /MSIE\s+8/i.test(navigator.userAgent);
        function loader() {
            if (isIE8) {
                window.onload = null;
            } else {
                document.removeEventListener("DOMContentLoaded", loader, false);
            }
            function initCallback() {
                var queue = readyQueue;
                readyQueue = null;
                queue.notify("ready");
            }
            if (adapter.init) {
                adapter.init(initCallback);
            } else {
                initCallback();
            }
        }
        if (document.readyState !== "loading") {
            loader();
        } else {
            if (isIE8) {
                window.onload = loader;
            } else {
                document.addEventListener("DOMContentLoaded", loader, false);
            }
        }
        return function sliceAPI_onReady(callback, ctx) {
            if (typeof callback !== "function") {
                ctx = callback;
                callback = function () {
                    if (typeof this.init === "function") {
                        if (this.init() === false) {
                            return;
                        }
                    }
                    messages.addListeners(this);
                    if (typeof this.finalize === "function") {
                        manager.onExit(this.finalize, this);
                    }
                };
            }
            if (readyQueue) {
                readyQueue.addListener("ready", callback, ctx);
            } else {
                callback.call(ctx);
            }
        };
    }();
    manager.onExit = function () {
        var exitQueue = new Dispatcher();
        function unload() {
            if (exitQueue && adapter) {
                exitQueue.notify("exit");
                exitQueue = null;
                adapter.clear();
                adapter = null;
            }
        }
        window.onunload = unload;
        window.onbeforeunload = unload;
        return function (callback, ctx) {
            if (exitQueue) {
                exitQueue.addListener("exit", callback, ctx);
            }
        };
    }();
    return manager;
});
define("api/branding", ["browser-adapter"], function (adapter) {
    function getBrid() {
        return adapter.getBrandId();
    }
    function getBrowser() {
        return adapter.browser;
    }
    function getAdapterType() {
        return adapter.adapterType;
    }
    function getLang() {
        return adapter.getLang();
    }
    function isRegExp(obj) {
        return obj && Object.prototype.toString.call(obj) === "[object RegExp]";
    }
    var domainsConfig = {
        domains: {
            ya: "yandex.ru",
            locale: {
                be: { ya: "yandex.by" },
                uk: { ya: "yandex.ua" },
                kk: { ya: "yandex.kz" }
            }
        },
        branding: {
            tb: { domains: { ya: "yandex.com.tr" } },
            ua: { domains: { ya: "yandex.ua" } }
        }
    };
    var config = null;
    var brandingModule = {
        getDomain: function (withKUBR) {
            if (!config) {
                config = {
                    notLocalized: brandingModule.brandingObject(domainsConfig, true, false),
                    full: brandingModule.brandingObject(domainsConfig, true)
                };
            }
            return config[withKUBR ? "full" : "notLocalized"].domains.ya;
        },
        _funcReplaceTLD: function (a, b) {
            return brandingModule.getDomain(!!b);
        },
        brandingUrl: function (url) {
            return url ? url.replace(/\byandex\.\{tld((-kubr)?)\}/, brandingModule._funcReplaceTLD) : "";
        },
        brandingObject: function (obj, copy, lang) {
            var brid = getBrid();
            if (lang !== false) {
                lang = lang || getLang();
            }
            var browser = getBrowser();
            var adapterType = getAdapterType();
            var specFields = {
                browser: true,
                locale: true,
                branding: true,
                adapter: true
            };
            function handleItems(obj, target, handleds, name, value) {
                var src = obj;
                if (name) {
                    if (obj[name]) {
                        src = obj[name][value];
                        if (typeof src === "string") {
                            src = obj[name][src];
                        }
                        if (!copy) {
                            delete obj[name];
                        }
                        if (!src) {
                            return target;
                        }
                        src = brandingLocalize(src);
                    } else {
                        return target;
                    }
                }
                var keys = Object.keys(src);
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (!handleds.hasOwnProperty(key) && !specFields[key]) {
                        handleds[key] = true;
                        target[key] = brandingLocalize(src[key]);
                    }
                }
                return target;
            }
            function brandingLocalize(obj) {
                if (typeof obj === "string") {
                    return brandingModule.brandingUrl(obj);
                }
                if (!obj || !brid && !lang && !browser || typeof obj != "object") {
                    return obj;
                }
                if (isRegExp(obj)) {
                    return obj;
                }
                var target;
                if (Array.isArray(obj)) {
                    target = copy ? [] : obj;
                    for (var i = 0; i < obj.length; ++i) {
                        target[i] = brandingLocalize(obj[i]);
                    }
                    return target;
                }
                var handleds = {};
                target = copy ? {} : obj;
                handleItems(obj, target, handleds, "browser", browser);
                handleItems(obj, target, handleds, "adapter", adapterType);
                handleItems(obj, target, handleds, "branding", brid);
                handleItems(obj, target, handleds, "locale", lang);
                return handleItems(obj, target, handleds);
            }
            return brandingLocalize(obj);
        }
    };
    return brandingModule;
});
define("api/stat", ["browser-adapter"], function (adapter) {
    function log(str) {
        adapter.log("[api/stat]: " + str);
    }
    var stat = {
        _statName: null,
        log: function (params) {
            if (adapter.sendClickerStatistics({
                    cid: params.cid,
                    param: params.param,
                    statisticsId: this._statName
                })) {
                return;
            }
            var dtype = params.dtype;
            var pid = params.pid;
            var cid = params.cid;
            var param = params.param;
            if (typeof dtype === "undefined") {
                dtype = "stred";
            }
            if (typeof pid === "undefined") {
                pid = 12;
            }
            if (typeof dtype === "string") {
                if (!dtype) {
                    throw new RangeError("dtype is empty string");
                }
            } else {
                throw new TypeError("Invalid dtype type ('" + typeof dtype + "')");
            }
            if (typeof pid === "number") {
                if (pid < 0) {
                    throw new RangeError("Invalid pid value (" + pid + ")");
                }
            } else {
                throw new TypeError("Wrong pid type ('" + typeof pid + "'). Number required.");
            }
            if (typeof cid === "number") {
                if (cid <= 0) {
                    throw new RangeError("Invalid cid value (" + cid + ")");
                }
            } else {
                throw new TypeError("Wrong cid type ('" + typeof cid + "'). Number required.");
            }
            var prodInfo = adapter.getProductInfo();
            param = adapter.browser + "." + this._statName + "." + (prodInfo ? prodInfo.version.replace(/\./g, "-") + "." : "") + param;
            var url = "https://clck.yandex.ru/click" + "/dtype=" + encodeURIComponent(dtype) + "/pid=" + pid + "/cid=" + cid + "/path=" + encodeURIComponent(param);
            var extraString = "";
            var processedKeys = [
                "dtype",
                "pid",
                "cid",
                "param"
            ];
            for (var key in params) {
                if (!params.hasOwnProperty(key)) {
                    continue;
                }
                if (processedKeys.indexOf(key) !== -1) {
                    continue;
                }
                var value = params[key];
                if (key === "*") {
                    extraString = value;
                    continue;
                }
                url += "/" + key + "=" + encodeURIComponent(value);
            }
            url += "/*" + extraString;
            log("stat log " + url);
            var xhr = adapter.createXHR();
            xhr.open("GET", url, true);
            xhr.send();
        },
        logWidget: function (path) {
            this.log({
                cid: 72359,
                param: path
            });
        },
        logNotification: function (path) {
            this.log({
                cid: 72358,
                param: path
            });
        },
        setStatName: function (name) {
            this._statName = name || null;
        }
    };
    return stat;
});
define("slice/locale", [], function () {
    return {};
});
define("slice/logic/config", {
    statName: "ipower",
    API_URL_TPL: "http://api.powergroup.com.tr/{path}/?appRef=YandexElements&version=1&_=",
    BROWSER_URL: "http://browser.yandex.{tld}/",
    browser: {
        fx: { BROWSER_URL: "http://fx.yandex.{tld}/?from=elmntradio" },
        ie: {
            _BROWSER_URL_IE: "http://ie.yandex.{tld}/?from=elmntradio",
            BROWSER_URL_FUNC: function () {
                return navigator.userAgent.indexOf("Windows NT 5.") === -1 ? this._BROWSER_URL_IE : "";
            }
        }
    }
});
define("slice/adapter/main", [
    "browser-adapter",
    "api/manager",
    "api/branding",
    "api/stat",
    "slice/locale",
    "slice/logic/config"
], function (adapter, manager, branding, stat, localesMap, config) {
    manager.onReady(function () {
        branding.brandingObject(config);
        stat.setStatName(config.statName);
        if (localesMap && localesMap.ru !== undefined) {
            var locales = localesMap[adapter.getLang()] || localesMap.ru;
            adapter.getString = function (key, params) {
                var str = locales[key] || "";
                if (!str || !params) {
                    return str;
                }
                return str.replace(/<i18n:param>([a-zA-Z0-9\._-]+)<\/i18n:param>/g, function (m, g1) {
                    return params[g1];
                });
            };
        }
        if (typeof jQuery === "function") {
            jQuery.ajaxSetup({
                crossDomain: false,
                "xhr": function () {
                    return adapter.createXHR();
                }
            });
        }
    });
});
define("api/dom", [], function () {
    function escapeStringForRegexp(str) {
        return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
    }
    function createRx(className) {
        return new RegExp("(^|\\s)" + escapeStringForRegexp(className) + "(\\s|$)");
    }
    function getEventData(e, self) {
        var node = e.target || e.srcElement;
        var data = {
            self: self,
            target: node,
            event: e
        };
        while (node) {
            if (!data.parent && node.getAttribute("data-cmd-parent")) {
                data.parent = node;
            }
            data.param = data.param || node.getAttribute("data-cmd-param") || "";
            data.command = data.command || node.getAttribute("data-command") || "";
            if (node == self) {
                break;
            }
            node = node.parentNode;
        }
        return data;
    }
    return {
        getClickHandler: function (self) {
            return function (e) {
                e = e || window.event;
                var eventInfo = getEventData(e, this);
                if (!self.commands || !eventInfo.command || !self.commands[eventInfo.command]) {
                    return;
                }
                if (e.stopPropagation) {
                    e.stopPropagation();
                } else {
                    e.cancelBubble = true;
                }
                return self.commands[eventInfo.command].call(self, eventInfo);
            };
        },
        addClass: function (elem, className) {
            if (!elem || !className) {
                return;
            }
            if (elem.classList) {
                elem.classList.add(className);
                return;
            }
            var rx = new RegExp("^(?!.*(^|\\s)" + escapeStringForRegexp(className) + "(\\s|$))");
            elem.className = elem.className.replace(rx, className + " ").trim();
        },
        removeClass: function (elem, className) {
            if (!elem || !className) {
                return;
            }
            if (elem.classList) {
                elem.classList.remove(className);
                return;
            }
            var rx = createRx(className);
            elem.className = elem.className.replace(rx, " ").trim();
        },
        toggleClass: function (elem, className) {
            if (!elem || !className) {
                return false;
            }
            if (elem.classList) {
                return elem.classList.toggle(className);
            }
            if (this.hasClass(elem, className)) {
                this.removeClass(elem, className);
            } else {
                this.addClass(elem, className);
            }
        },
        hasClass: function (elem, className) {
            if (!elem || !className) {
                return false;
            }
            if (elem.classList) {
                return elem.classList.contains(className);
            }
            var rx = createRx(className);
            return rx.test(elem.className);
        },
        dragNDropCore: function (prm) {
            var dragInfo = null;
            function onMM(e) {
                if (!dragInfo) {
                    return;
                }
                dragInfo.oldX = dragInfo.pageX;
                dragInfo.oldY = dragInfo.pageY;
                dragInfo.pageX = e.pageX;
                dragInfo.pageY = e.pageY;
                prm.onmove.call(prm.ctx, dragInfo, e);
                return false;
            }
            function onMU(e) {
                if (!dragInfo) {
                    return;
                }
                document.removeEventListener("mousemove", onMM, false);
                document.removeEventListener("mouseup", onMU, false);
                if (prm.onstop) {
                    prm.onstop.call(prm.ctx, dragInfo, e);
                }
                dragInfo = null;
                return false;
            }
            function onMD(e) {
                onMU();
                dragInfo = {
                    elem: this,
                    target: e.target,
                    startX: e.pageX,
                    startY: e.pageY,
                    pageX: e.pageX,
                    pageY: e.pageY
                };
                if (prm.start) {
                    if (prm.start.call(prm.ctx, dragInfo, e) === false) {
                        dragInfo = null;
                        return;
                    }
                }
                document.addEventListener("mousemove", onMM, false);
                document.addEventListener("mouseup", onMU, false);
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
            if (prm.elems.tagName) {
                prm.elems.addEventListener("mousedown", onMD, false);
            } else {
                for (var i = 0; i < prm.elems.length; ++i) {
                    prm.elems[i].addEventListener("mousedown", onMD, false);
                }
            }
        }
    };
});
define("api/utils", ["browser-adapter"], function (adapter) {
    var utils = {
        copy: function (src, dest) {
            dest = dest || {};
            if (src) {
                for (var i in src) {
                    if (src.hasOwnProperty(i)) {
                        dest[i] = src[i];
                    }
                }
            }
            return dest;
        },
        emptyFunc: function () {
        },
        navigate: function (url, event) {
            if (!url) {
                return;
            }
            var target = event && event.shiftKey ? "new window" : "new tab";
            if (event) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            }
            adapter.navigate(url, target);
        },
        getParam: function (param, url) {
            return (RegExp("[?&]" + param + "=([^&#]*)", "i").exec(url || document.location.href) || "")[1] || "";
        },
        debounce: function (func, wait, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) {
                        func.apply(context, args);
                    }
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    func.apply(context, args);
                }
            };
        }
    };
    return utils;
});
define("api/http", [
    "browser-adapter",
    "api/utils"
], function (adapter, utils) {
    function log(str) {
        adapter.log("[ajax]: " + str);
    }
    function makeParam(name, value) {
        return name + "=" + encodeURIComponent(value);
    }
    function makeMultipartParam(name, value) {
        return "Content-Disposition: form-data; " + "name=\"" + name + "\"" + "\r\n\r\n" + value;
    }
    function makeParamStr(params, multipart) {
        if (!params || typeof params === "string") {
            return params || "";
        }
        var buffer = [];
        var func = multipart ? makeMultipartParam : makeParam;
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                var paramValue = params[i];
                if (Array.isArray(paramValue)) {
                    paramValue.forEach(function (value) {
                        buffer.push(func(i, value));
                    });
                } else {
                    buffer.push(func(i, paramValue));
                }
            }
        }
        if (multipart) {
            var CR = "\r\n";
            return multipart + CR + buffer.join(CR + multipart + CR) + CR + multipart + "--" + CR;
        }
        return buffer.join("&");
    }
    function createRequest(obj) {
        var xhr = adapter.createXHR();
        var mpBoundary = obj.multipart ? "-----8a7gadg1ahSDCV" + Date.now() : null;
        var url = obj.url;
        var txt = null;
        var query = makeParamStr(obj.query);
        var params = makeParamStr(obj.params, mpBoundary ? "--" + mpBoundary : null);
        if (obj.data) {
            query = query || params;
            params = "";
        }
        if (obj.method === "POST") {
            txt = obj.data || params || "";
        } else {
            txt = obj.data || null;
            query = query || params;
        }
        if (query) {
            url += (url.indexOf("?") === -1 ? "?" : "&") + query;
        }
        xhr.open(obj.method, url, !obj.sync);
        if (obj.overrideMimeType && xhr.overrideMimeType) {
            xhr.overrideMimeType(obj.overrideMimeType);
        }
        if (obj.background) {
            try {
                xhr.mozBackgroundRequest = true;
            } catch (e) {
            }
        }
        var httpHeaders = utils.copy(obj.headers);
        if (!httpHeaders["Content-Type"]) {
            var contentType = obj.contentType;
            if (!contentType && obj.method == "POST") {
                contentType = mpBoundary ? "multipart/form-data; boundary=" + mpBoundary : "application/x-www-form-urlencoded;  charset=UTF-8";
            }
            if (contentType) {
                httpHeaders["Content-Type"] = contentType;
            }
        }
        for (var httpHeader in httpHeaders) {
            if (httpHeaders.hasOwnProperty(httpHeader)) {
                xhr.setRequestHeader(httpHeader, httpHeaders[httpHeader]);
            }
        }
        return {
            xhr: xhr,
            text: txt
        };
    }
    function getResponse(req, responseType) {
        if (responseType == "xml") {
            var xml = req.responseXML;
            if (!xml) {
                throw "parse error";
            } else {
                return xml;
            }
        }
        var data = req.responseText;
        if (responseType == "json") {
            data = JSON.parse(data);
        }
        return data;
    }
    function ajax(obj) {
        var xhrData = createRequest(obj);
        if (!obj.sync) {
            var onend = obj.end || utils.emptyFunc;
            var callback = obj.callback || utils.emptyFunc;
            var errback = obj.errback || utils.emptyFunc;
            var ctx = obj.ctx || obj.scope || obj;
            var startRequestTime = Date.now();
            xhrData.xhr.onreadystatechange = function () {
                if (xhrData.xhr && xhrData.xhr.readyState == 4) {
                    var endRequestTime = Date.now();
                    onend.call(ctx, xhrData.xhr);
                    if (xhrData.timer) {
                        clearTimeout(xhrData.timer);
                        xhrData.timer = null;
                    }
                    if (!xhrData.aborted) {
                        var status = xhrData.xhr.status;
                        var statusText = "error";
                        if (status >= 200 && status < 400) {
                            var response = "";
                            var parsed = false;
                            if (obj.method === "HEAD") {
                                callback.call(ctx, null, xhrData.xhr, status, timeDiff);
                            } else {
                                try {
                                    response = getResponse(xhrData.xhr, obj.responseType);
                                    parsed = true;
                                } catch (e) {
                                    errback.call(ctx, 500, "parse error", xhrData.xhr, obj);
                                }
                                if (parsed) {
                                    var timeDiff = null;
                                    if (obj.getTimeDiff) {
                                        var serverTime = new Date(xhrData.xhr.getResponseHeader("Date")).valueOf();
                                        timeDiff = serverTime ? Math.round((startRequestTime + endRequestTime) / 2) - serverTime : null;
                                    }
                                    callback.call(ctx, response, xhrData.xhr, status, timeDiff);
                                }
                            }
                        } else {
                            try {
                                statusText = xhrData.xhr.statusText;
                            } catch (e) {
                            }
                            errback.call(ctx, status, statusText, xhrData.xhr, obj);
                        }
                    }
                    xhrData.xhr = null;
                }
            };
        }
        xhrData.xhr.send(xhrData.text);
        if (obj.sync) {
            try {
                return getResponse(xhrData.xhr, obj.responseType);
            } catch (e) {
                return null;
            }
        }
        function abort(msg) {
            if (xhrData.xhr && !xhrData.aborted) {
                xhrData.aborted = msg || "abort";
                xhrData.xhr.abort();
                errback.call(ctx, 0, xhrData.aborted, xhrData.xhr, obj);
            }
        }
        if (obj.timeout && obj.timeout > 0) {
            xhrData.timer = setTimeout(function () {
                if (xhrData.timer) {
                    abort("timeout");
                }
            }, obj.timeout);
        }
        return { abort: abort };
    }
    return {
        HEAD: function (obj) {
            obj.method = "HEAD";
            return ajax(obj);
        },
        GET: function (obj) {
            obj.method = "GET";
            if (obj.noCache) {
                var query = obj.query || obj.params || {};
                if (typeof query == "string") {
                    query = query + "&_randomparameter=" + Date.now();
                } else {
                    query._randomparameter = Date.now();
                }
                if (obj.params) {
                    obj.params = query;
                } else {
                    obj.query = query;
                }
            }
            return ajax(obj);
        },
        POST: function (obj) {
            obj.method = "POST";
            return ajax(obj);
        },
        PATCH: function (obj) {
            obj.method = "PATCH";
            return ajax(obj);
        },
        PUT: function (obj) {
            obj.method = "PUT";
            return ajax(obj);
        }
    };
});
define("api/xml", [], function () {
    var rxEscape = /&|  |<|>|\r\n|\n|"/g;
    var rxUnescape = /&amp;|&nbsp;|&lt;|&gt;|<(br|BR)\s*\/?>|&quot;/g;
    var mapEscape = {
        "&": "&amp;",
        "  ": "&nbsp; ",
        "<": "&lt;",
        ">": "&gt;",
        "\n": "<br />",
        "\r\n": "<br />",
        "\"": "&quot;"
    };
    var mapUnescape = {
        "&amp;": "&",
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "<br />": "\n",
        "<br/>": "\n",
        "<br>": "\n",
        "&quot;": "\""
    };
    var funcReplaceEscape = function (str) {
        return mapEscape[str];
    };
    var funcReplaceUnescape = function (str) {
        return mapUnescape[str.toLowerCase()];
    };
    var xml = {
        escape: function (str) {
            return str ? String(str).replace(rxEscape, funcReplaceEscape) : "";
        },
        unescape: function (str) {
            return str ? String(str).replace(rxUnescape, funcReplaceUnescape) : "";
        },
        stringToXml: function (string) {
            var xmlDocument;
            if (typeof DOMParser === "function") {
                xmlDocument = new DOMParser().parseFromString(string, "text/xml");
            } else if (typeof ActiveXObject === "function") {
                xmlDocument = new ActiveXObject("Microsoft.XMLDOM");
                xmlDocument.async = false;
                xmlDocument.loadXML(string);
            }
            return xmlDocument;
        },
        select: function (selector, parent) {
            parent = parent || document;
            if (typeof Sizzle === "function") {
                return Sizzle(selector, parent)[0] || null;
            }
            return parent.querySelector(selector);
        },
        selectAll: function (selector, parent) {
            parent = parent || document;
            if (typeof Sizzle === "function") {
                return Sizzle(selector, parent);
            }
            return parent.querySelectorAll(selector);
        },
        getText: function (elem, selector) {
            if (elem && selector) {
                elem = xml.select(selector, elem);
            }
            return elem ? elem.textContent || elem.innerText || elem.firstChild && elem.firstChild.data || "" : "";
        },
        setText: function (elem, text) {
            if (elem) {
                elem.textContent = text;
                elem.innerText = text;
            }
        },
        getAttr: function (elem, selector, attr) {
            if (arguments.length == 2) {
                attr = selector;
                selector = null;
            }
            if (elem && selector) {
                elem = xml.select(selector, elem);
            }
            return elem && elem.getAttribute(attr) || "";
        }
    };
    return xml;
});
