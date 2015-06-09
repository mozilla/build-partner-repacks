require(["slice/adapter/main"], function () {
    require(["slice/logic/main"]);
});
define("main-logic", function () {
});
define("slice/common-logic/data-manager", [
    "browser-adapter",
    "api/dispatcher"
], function (adapter, Dispatcher) {
    function log(str) {
        adapter.log("[request-mgr]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[request-mgr]: " + (str || ""));
    }
    function RequestProxy(reqMgr, param) {
        this._param = param;
        this._reqMgr = reqMgr;
        this._version = reqMgr._version;
    }
    RequestProxy.prototype = {
        constructor: RequestProxy,
        attached: function () {
            if (this._reqMgr && this._version !== this._reqMgr._version) {
                this._reqMgr = null;
            }
            return !!this._reqMgr;
        },
        getParams: function () {
            return this._param;
        },
        setValue: function (value, expireInterval) {
            if (this.attached()) {
                this._reqMgr.setValue(value, expireInterval);
            }
        },
        saveRequest: function (obj) {
            if (this.attached()) {
                this._reqMgr._request = obj;
            }
        },
        setError: function (error, aborted) {
            if (this.attached()) {
                this._reqMgr._setError(error, aborted);
            }
        }
    };
    function DataManager(requestFunc, ctx, expireInterval) {
        this._ctx = ctx;
        this._version = 0;
        this._expireInterval = expireInterval;
        this._requestFunc = requestFunc;
        this._request = null;
        this._error = null;
        this._value = null;
        this._updatedTime = 0;
        this._expireTime = null;
        this._updating = false;
        this._expireDetected = false;
        this._aborted = false;
        this._callbacks = new Dispatcher();
        this._errbacks = new Dispatcher();
        this.events = new Dispatcher();
    }
    DataManager.prototype = {
        constructor: DataManager,
        getValue: function () {
            return this._value;
        },
        getError: function () {
            return this._error;
        },
        getExpireTime: function () {
            return this._expireTime;
        },
        getUpdatedTime: function () {
            return this._updatedTime;
        },
        _sendResult: function (isError) {
            this[isError ? "_errbacks" : "_callbacks"].notify(null, this);
            this._callbacks.clear();
            this._errbacks.clear();
            this.events.notify(isError ? "error" : "response", this);
        },
        _endRequest: function () {
            this.clearValue(true);
            this._expireDetected = false;
            this._updating = false;
            this._request = null;
        },
        setValue: function (value, expireInterval) {
            var updating = this._updating;
            this._endRequest();
            this._value = value;
            this._updatedTime = Date.now();
            if (typeof expireInterval !== "number") {
                expireInterval = this._expireInterval;
            }
            var expired = false;
            if (typeof expireInterval === "number") {
                this._expireTime = this._updatedTime + expireInterval;
                expired = expireInterval < 0;
            }
            if (updating) {
                this.events.notify("loaded", this);
            }
            this.events.notify("changed", this);
            if (expired) {
                this._notifyExpired();
            }
            if (updating) {
                this._sendResult(false);
            }
            return this;
        },
        _setError: function (error, aborted) {
            if (this._updating) {
                this._endRequest();
                this._aborted = !!aborted;
                this._error = error || true;
                this._sendResult(true);
            }
        },
        expired: function () {
            return typeof this._expireTime === "number" && this._expireTime <= Date.now();
        },
        updating: function () {
            return this._updating;
        },
        requestAllowExpired: function (params, callback, errback, ctx) {
            return this.request(params, callback, errback, ctx, true);
        },
        request: function (params, callback, errback, ctx, allowExpired) {
            if (typeof params === "function") {
                allowExpired = ctx;
                ctx = errback;
                errback = callback;
                callback = params;
                params = null;
            }
            var expired = this.expired();
            if (expired) {
                this._notifyExpired();
            }
            if (this._updatedTime && (!expired || allowExpired) && !this.getError()) {
                if (callback) {
                    callback.call(ctx || this._ctx, this);
                }
                this.events.notify("response", this);
                return this;
            }
            this._callbacks.addListener(null, callback, ctx || this._ctx);
            this._errbacks.addListener(null, errback, ctx || this._ctx);
            this.events.notify("waiting", this);
            if (!this._updating) {
                this._updating = true;
                this.events.notify("loading", this);
                this._request = this._requestFunc.call(this._ctx || this, new RequestProxy(this, params));
            }
            return this;
        },
        abort: function (errorData) {
            if (this._updating) {
                var req = this._request;
                this._setError(errorData, true);
                if (req) {
                    try {
                        req.abort();
                    } catch (exc) {
                    }
                }
            }
        },
        _notifyExpired: function () {
            if (!this._expireDetected) {
                this._expireDetected = true;
                this.events.notify("expired", this);
            }
        },
        setExpire: function () {
            if (!this._updating && this._updatedTime && !this.getError()) {
                this._expireTime = 0;
                this._notifyExpired();
            }
            return this;
        },
        clearValue: function (notEvent) {
            this._version++;
            var hasValue = this._updatedTime;
            this._error = null;
            this._value = null;
            this._updatedTime = 0;
            this._expireTime = null;
            if (!notEvent && hasValue) {
                this.events.notify("clear", this);
            }
            return this;
        },
        clear: function () {
            this.abort("clear");
            this.clearValue();
            return this;
        }
    };
    return DataManager;
});
define("slice/logic/slice-data", [
    "browser-adapter",
    "api/manager"
], function (adapter, manager) {
    function log(str) {
        adapter.log("[slice-data]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[slice-data]: " + (str || ""));
    }
    var SETTING_NAME = "slice-data";
    var module = {
        data: {},
        init: function () {
            var data = adapter.getOption(SETTING_NAME);
            try {
                this.data = JSON.parse(data || "{}") || {};
            } catch (exc) {
            }
        },
        save: function (name, value) {
            if (name && arguments.length > 1) {
                this.data[name] = value;
            }
            adapter.setOption(SETTING_NAME, JSON.stringify(this.data));
        }
    };
    manager.onReady(module);
    return module;
});
define("slice/logic/token-manager", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "slice/common-logic/data-manager",
    "slice/logic/config"
], function (adapter, manager, http, DataManager, config) {
    function log(str) {
        adapter.log("[token-mgr]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[token-mgr]: " + (str || ""));
    }
    var tokenAPI = {
        init: function () {
            this._uid = "";
            var savedTokens = adapter.getOption("yadisk-tokens");
            try {
                this._tokenStorage = JSON.parse(savedTokens || "{}") || {};
                Object.keys(this._tokenStorage).forEach(function (key) {
                    if (key != "#v2") {
                        delete this._tokenStorage[key];
                    }
                }, this);
            } catch (exc) {
                this._tokenStorage = {};
            }
            this._tokens = this._tokenStorage["#v2"] = this._tokenStorage["#v2"] || {};
            tokenMgr.events.addListener("loaded", this._saveToken, this);
            tokenMgr.events.addListener("expired", this._clearToken, this);
        },
        observers: {
            "yadisk:user": function (topic, data) {
                if (tokenMgr.getError() || this._uid != data.uid) {
                    log("yadisk:user: data.uid=" + data.uid + ", this._uid=" + this._uid);
                    tokenMgr.clear();
                    this._uid = data.uid;
                    var token = data.uid && this._tokens[data.uid] && this._tokens[data.uid][config.HOST];
                    if (token) {
                        tokenMgr.setValue({
                            value: token.value,
                            uid: data.uid
                        }, token.expireTime - Date.now());
                    }
                }
            }
        },
        _clearToken: function () {
            if (this._uid && this._tokens[this._uid] && this._tokens[this._uid][config.HOST]) {
                delete this._tokens[this._uid][config.HOST];
                adapter.setOption("yadisk-tokens", JSON.stringify(this._tokenStorage));
            }
        },
        _saveToken: function () {
            var token = tokenMgr.getValue();
            if (token) {
                var uid = token.uid;
                this._tokens[uid] = this._tokens[uid] || {};
                this._tokens[uid][config.HOST] = {
                    value: token.value,
                    expireTime: tokenMgr.getExpireTime()
                };
                adapter.setOption("yadisk-tokens", JSON.stringify(this._tokenStorage));
            }
        },
        requestToken: function (reqMgr) {
            adapter.getCookie(config.HOST, "Session_id", "", true, function (sid) {
                if (!sid) {
                    reqMgr.setError({ status: 400 });
                    return;
                }
                reqMgr.saveRequest(http.POST({
                    url: config.OAUTH_URL,
                    responseType: "json",
                    params: {
                        grant_type: "sessionid",
                        client_id: config.AUTH1,
                        client_secret: config.AUTH2,
                        sessionid: sid,
                        host: config.HOST
                    },
                    ctx: this,
                    callback: function (data) {
                        logObj(data);
                        reqMgr.setValue({
                            value: data.access_token,
                            uid: data.uid
                        }, (data.expires_in - 3600) * 1000);
                    },
                    errback: function (status, text) {
                        log("_requestToken: error " + status + " " + text);
                        reqMgr.setError({ status: status });
                    }
                }));
            }, this);
        }
    };
    var tokenMgr = new DataManager(tokenAPI.requestToken, tokenAPI);
    manager.onReady(tokenAPI);
    return tokenMgr;
});
define("slice/logic/api", [
    "browser-adapter",
    "api/http",
    "api/utils",
    "slice/logic/config",
    "slice/logic/token-manager"
], function (adapter, http, utils, config, tokenMgr) {
    function log(str) {
        adapter.log("[api]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[api]: " + (str || ""));
    }
    var module = {
        ajax: function (conf) {
            var retry = false;
            function ajax() {
                var token = tokenMgr.getValue();
                http[conf.method || "GET"]({
                    url: conf.url || config.API_URL + (conf.path ? "/" + conf.path : ""),
                    ctx: this,
                    noCache: true,
                    params: conf.params,
                    query: conf.query,
                    data: conf.data,
                    responseType: conf.responseType || "json",
                    contentType: conf.contentType,
                    headers: utils.copy(conf.headers, { Authorization: "OAuth " + token.value }),
                    callback: function (data) {
                        if (!data.error) {
                            conf.callback.call(this, data);
                        } else {
                            conf.errback.call(this, 400, data.error);
                        }
                    },
                    errback: function (status, text, xhr) {
                        var data = null;
                        if (status) {
                            try {
                                data = JSON.parse(xhr.responseText);
                            } catch (exc) {
                            }
                        }
                        text = data && data.error || "";
                        if (text == "UnauthorizedError") {
                            tokenMgr.setExpire();
                            if (!retry) {
                                retry = true;
                                tokenMgr.request(ajax, tokenError, this);
                            } else {
                                if (conf.onAuthError) {
                                    conf.onAuthError.call(this);
                                }
                                conf.errback.call(this, 401, "Unauthorized");
                            }
                        } else {
                            conf.errback.call(this, status, data && data.error || "");
                        }
                    }
                });
            }
            function tokenError() {
                if (conf.onAuthError) {
                    conf.onAuthError.call(this);
                }
                conf.errback.call(this, tokenMgr.getError().status, tokenMgr.getError().text);
            }
            tokenMgr.request(ajax, tokenError, conf.ctx);
        }
    };
    return module;
});
define("slice/common-logic/plural", ["browser-adapter"], function (adapter) {
    function getLang() {
        return adapter.getLang();
    }
    var DEF_RULE_NUM = 1;
    var config = [
        [
            "kk,ka,km,ms,my,su,tt,th,ug,tr,zh,ja,vi,fa,tut,ko,lo,hi,id",
            1,
            function (n) {
                return 0;
            }
        ],
        [
            "en,de,et,no,el,it",
            2,
            function (n) {
                return n != 1 ? 1 : 0;
            }
        ],
        [
            "fr,uz,tg",
            2,
            function (n) {
                return n > 1 ? 1 : 0;
            }
        ],
        [
            "lv",
            3,
            function (n) {
                return n % 10 == 1 && n % 100 != 11 ? 1 : n != 0 ? 2 : 0;
            }
        ],
        [
            "gd",
            4,
            function (n) {
                return n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 0 && n < 20 ? 2 : 3;
            }
        ],
        [
            "ro",
            3,
            function (n) {
                return n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2;
            }
        ],
        [
            "lt",
            3,
            function (n) {
                return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 2 : 1;
            }
        ],
        [
            "ru,uk,be,hr,sr,bs",
            3,
            function (n) {
                return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
            }
        ],
        [
            "sk,cs",
            3,
            function (n) {
                return n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
            }
        ],
        [
            "pl",
            3,
            function (n) {
                return n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
            }
        ],
        [
            "sl",
            4,
            function (n) {
                return n % 100 == 1 ? 0 : n % 100 == 2 ? 1 : n % 100 == 3 || n % 100 == 4 ? 2 : 3;
            }
        ],
        [
            "ga",
            5,
            function (n) {
                return n == 1 ? 0 : n == 2 ? 1 : n >= 3 && n <= 6 ? 2 : n >= 7 && n <= 10 ? 3 : 4;
            }
        ],
        [
            "ar",
            6,
            function (n) {
                return n == 0 ? 5 : n == 1 ? 0 : n == 2 ? 1 : n % 100 >= 3 && n % 100 <= 10 ? 2 : n % 100 >= 11 && n % 100 <= 99 ? 3 : 4;
            }
        ],
        [
            "mt",
            4,
            function (n) {
                return n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 <= 10 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3;
            }
        ],
        [
            "mk",
            3,
            function (n) {
                return n % 10 == 1 ? 0 : n % 10 == 2 ? 1 : 2;
            }
        ],
        [
            "is",
            2,
            function (n) {
                return n % 10 == 1 && n % 100 != 11 ? 0 : 1;
            }
        ],
        [
            "br",
            5,
            function (n) {
                return n % 10 == 1 && n % 100 != 11 && n % 100 != 71 && n % 100 != 91 ? 0 : n % 10 == 2 && n % 100 != 12 && n % 100 != 72 && n % 100 != 92 ? 1 : (n % 10 == 3 || n % 10 == 4 || n % 10 == 9) && n % 100 != 13 && n % 100 != 14 && n % 100 != 19 && n % 100 != 73 && n % 100 != 74 && n % 100 != 79 && n % 100 != 93 && n % 100 != 94 && n % 100 != 99 ? 2 : n % 1000000 == 0 && n != 0 ? 3 : 4;
            }
        ]
    ];
    var rule = null;
    function getRule() {
        if (!rule) {
            var lang = "," + getLang() + ",";
            for (var i = 0; i < config.length; ++i) {
                if (("," + config[i][0] + ",").indexOf(lang) >= 0) {
                    rule = config[i];
                    break;
                }
            }
            rule = rule || config[DEF_RULE_NUM];
        }
        return rule;
    }
    return {
        index: function (n) {
            return getRule()[2](n);
        },
        form: function (n, forms, splitter) {
            if (typeof forms == "string") {
                forms = forms.split(splitter || ";");
            }
            var idx = Math.min(forms.length - 1, getRule()[2](n));
            return forms[idx];
        },
        formCount: function () {
            return getRule()[1];
        }
    };
});
define("slice/common-logic/notify", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "api/branding",
    "slice/common-logic/plural"
], function (adapter, manager, stat, branding, plural) {
    var config = {
        ENABLE_NOTIF: true,
        browser: { fx: { ENABLE_NOTIF: !/Linux/i.test(navigator.platform) } }
    };
    var queue = [];
    var showTimeoutId;
    var options = {
        useMailTemplates: false,
        serviceName: "",
        delayInMs: 4000,
        defaultTitle: "",
        defaultIconUrl: "",
        defaultClickUrl: "",
        pluralPlaceholder: "{N}",
        pluralForms: {},
        requestShowPermission: function (cb) {
            cb(true);
        }
    };
    function showNotification() {
        options.requestShowPermission(function (granted) {
            if (!granted) {
                queue = [];
                return;
            }
            var platformApi = adapter.getNotificationManager();
            var notificationsCount = queue.length;
            if (notificationsCount > 1) {
                platformApi.create(createCumulativeNotification(queue));
            } else if (notificationsCount === 1) {
                platformApi.create(createSingularNotification(queue[0]));
            }
            queue = [];
        });
    }
    function createSingularNotification(notification) {
        var platformApi = adapter.getNotificationManager();
        return {
            type: notification.type,
            title: notification.title || options.defaultTitle,
            text: ((notification.mainText || "") + "\n" + (notification.subText || "")).trim(),
            mainText: notification.mainText || "",
            subText: notification.subText || "",
            template: options.useMailTemplates ? platformApi.TEMPLATE_MAIL : platformApi.TEMPLATE_MESSAGE,
            context: notification.context || options.defaultClickUrl,
            icon: notification.icon || options.defaultIconUrl,
            groupSize: 1,
            isDefaultIcon: !notification.icon
        };
    }
    function createCumulativeNotification(notifications) {
        var platformApi = adapter.getNotificationManager();
        var count = notifications.length;
        var oneType = getNotificationsType(notifications);
        var retValue;
        if (options.ongroup) {
            retValue = options.ongroup(notifications, oneType);
            adapter.logObj(retValue);
        } else {
            var pluralForms;
            if (oneType) {
                pluralForms = options.pluralForms[oneType];
            } else {
                pluralForms = options.pluralForms.mix;
            }
            var message = plural.form(count, pluralForms).replace(options.pluralPlaceholder, count, "gm");
            retValue = {
                title: message,
                mainText: message,
                subText: "",
                template: platformApi.TEMPLATE_GROUP,
                isDefaultIcon: true
            };
        }
        retValue.text = ((retValue.mainText || "") + "\n" + (retValue.subText || "")).trim();
        retValue.groupSize = count;
        retValue.type = retValue.type || oneType || "mix";
        retValue.defaultTitle = retValue.defaultTitle || options.defaultTitle;
        retValue.icon = retValue.icon || options.defaultIconUrl;
        retValue.context = retValue.context || options.defaultClickUrl;
        return retValue;
    }
    function getNotificationsType(notifications) {
        var type = notifications[0].type;
        for (var i = 1, l = notifications.length; i < l; i++) {
            if (notifications[i].type !== type) {
                return null;
            }
        }
        return type;
    }
    function sendStat(groupSize, action) {
        var notificationType = groupSize > 1 ? "group" : "one";
        stat.logNotification(notificationType + "." + action);
    }
    var notify = {
        init: function () {
            branding.brandingObject(config);
            var platformApi = adapter.getNotificationManager();
            platformApi.addListener(this.handlers);
        },
        finalize: function () {
            var platformApi = adapter.getNotificationManager();
            platformApi.removeListener(this.handlers);
        },
        handlers: {
            notificationClicked: function (id, data, target) {
                adapter.log("Notification clicked with target: " + target);
                var platformApi = adapter.getNotificationManager();
                switch (target) {
                case platformApi.CLICK_TARGET_OPTIONS:
                    sendStat(data.groupSize, "sett");
                    adapter.openSettings();
                    break;
                case platformApi.CLICK_TARGET_CLOSE:
                    sendStat(data.groupSize, "close");
                    break;
                case platformApi.CLICK_TARGET_OTHER:
                case platformApi.CLICK_TARGET_TITLE:
                    sendStat(data.groupSize, "click");
                    if (options.onclick) {
                        options.onclick(data);
                    } else {
                        adapter.navigate(data.context, "new tab");
                    }
                    break;
                }
            },
            notificationClosed: function (id, data, reason) {
                adapter.log("Notification closed with reason: " + reason);
                var platformApi = adapter.getNotificationManager();
                switch (reason) {
                case platformApi.CLOSE_REASON_TIMEOUT:
                    sendStat(data.groupSize, "time");
                    break;
                }
            },
            notificationsGroup: function () {
                adapter.log("Notify: notificationGroup handler");
            }
        },
        setOptions: function (data) {
            var keys = Object.keys(data);
            for (var i = 0, l = keys.length; i < l; i++) {
                var optionName = keys[i];
                options[optionName] = data[optionName];
            }
        },
        show: function (notificationData) {
            if (!config.ENABLE_NOTIF) {
                return;
            }
            queue.push(notificationData);
            clearTimeout(showTimeoutId);
            showTimeoutId = setTimeout(showNotification, options.delayInMs);
        }
    };
    manager.onReady(notify);
    return notify;
});
define("slice/logic/notify", [
    "browser-adapter",
    "api/manager",
    "slice/logic/config",
    "slice/common-logic/notify",
    "slice/common-logic/plural"
], function (adapter, manager, config, notify, plural) {
    var mailUrl;
    var diskIcon;
    manager.onReady(function () {
        diskIcon = adapter.getSlicePath() + "images/disk" + config.NOTIF_PREVIEW_SIZE + ".png";
        notify.setOptions({
            serviceName: "yadisk",
            useMailTemplates: false,
            delayInMs: 1500,
            defaultTitle: adapter.getString("title"),
            defaultClickUrl: config.HOME_URL,
            pluralForms: {
                disksave: adapter.getString("slice.notif.saves"),
                mix: ""
            },
            requestShowPermission: function (callback) {
                var canShow = true;
                if (adapter.isWindowVisible() || String(adapter.getOption("show-notifications")) == "false") {
                    canShow = false;
                    adapter.log("Notify: requestShowPermission, slice visibility or not 'show-notifications' check result: " + canShow);
                    callback(canShow);
                } else {
                    callback(canShow);
                }
            },
            onclick: function (data) {
                var url = data.context == "" || data.context == "error" ? config.HOME_URL : data.context;
                adapter.navigate(url, "new tab");
            },
            ongroup: function (items, oneType) {
                var saves = 0, errors = 0;
                var context = "";
                items.forEach(function (item) {
                    if (item.context == "error") {
                        errors++;
                    } else {
                        context = context || item.context || "";
                        saves++;
                    }
                });
                saves = saves ? plural.form(saves, adapter.getString("slice.notif.saves")).replace("{N}", saves) : "";
                errors = errors ? plural.form(errors, adapter.getString("slice.notif.errors")).replace("{N}", errors) : "";
                return {
                    title: adapter.getString("title"),
                    context: context,
                    mainText: saves || errors,
                    subText: saves && errors ? errors : "",
                    template: adapter.getNotificationManager().TEMPLATE_MESSAGE,
                    icon: diskIcon
                };
            }
        });
    });
    function nameShort(name) {
        name = name || "";
        if (name.length > config.NOTIF_MAX_LENGTH) {
            var indexDot = name.lastIndexOf(".");
            if (indexDot < 0 || indexDot == name.length - 1) {
                name = name.substr(0, config.NOTIF_MAX_LENGTH - 3) + "...";
            } else {
                var extLength = name.length - indexDot;
                if (extLength <= config.NOTIF_MAX_LENGTH - 5) {
                    name = name.substr(0, config.NOTIF_MAX_LENGTH - extLength - 4) + "..." + name.substr(indexDot - 1);
                } else {
                    name = name.substr(0, config.NOTIF_MAX_LENGTH - 3) + "...";
                }
            }
        }
        return name;
    }
    return {
        createNotification: function (params) {
            adapter.log("Send notification to platform");
            var isError = params.context == "error";
            var conf = !isError && config.getNotificationBlank ? config.getNotificationBlank(adapter, nameShort(params.name)) : {
                title: adapter.getString(isError ? "slice.error.file-not-loaded" : config.NOTIF_DESCRIPTION_KEY),
                subText: nameShort(params.name)
            };
            conf.type = "disk";
            conf.icon = diskIcon;
            conf.context = params.context;
            notify.show(conf);
        }
    };
});
define("slice/logic/file-icons", ["browser-adapter"], function (adapter) {
    var PATH = "images/file-icons30/";
    var path = null;
    var iconMap = {
        "ai": true,
        "application": true,
        "archive": true,
        "audio": true,
        "avi": true,
        "bmp": true,
        "book": true,
        "cdr": true,
        "csv": true,
        "development": true,
        "djvu": true,
        "doc": true,
        "eml": true,
        "exe": true,
        "executable": true,
        "flash": true,
        "fonts": true,
        "general": true,
        "gif": true,
        "image": true,
        "jpg": true,
        "mail": true,
        "mov": true,
        "mp3": true,
        "mp4": true,
        "none": true,
        "odp": true,
        "ods": true,
        "odt": true,
        "pcx": true,
        "pdf": true,
        "pls": true,
        "png": true,
        "ppt": true,
        "psd": true,
        "rar": true,
        "rtf": true,
        "script": true,
        "srt": true,
        "text": true,
        "tiff": true,
        "txt": true,
        "video": true,
        "virus": true,
        "wav": true,
        "wma": true,
        "wmv": true,
        "xls": true,
        "zip": true
    };
    return function getIconPath(item) {
        var ext = /\.([^.]+)$/.test(item.name) ? RegExp.$1 : "";
        var name = ext && iconMap[ext.toLowerCase()] ? ext : item.media_type && iconMap[item.media_type] ? item.media_type : "none";
        path = path || adapter.getSlicePath() + PATH;
        return path + name + ".png";
    };
});
define("slice/logic/manager", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "api/stat",
    "api/utils",
    "slice/common-logic/data-manager",
    "slice/logic/config",
    "slice/logic/slice-data",
    "slice/logic/api",
    "slice/logic/notify",
    "slice/logic/file-icons"
], function (adapter, manager, http, stat, utils, DataManager, config, sliceData, diskAPI, notifyMgr, getIconPath) {
    function log(str) {
        adapter.log("[manager]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[manager]: " + (str || ""));
    }
    var MIN_UPDATE_INTERVAL = 3000;
    var MIN_USER_NOT_ACTIVITY_INTERVAL = 14 * 24 * 3600 * 1000;
    var module = {
        init: function () {
            this._uid = "";
            this._authError = false;
            this._list = new DataManager(this._getLastLoads, this, MIN_UPDATE_INTERVAL);
            this._list.events.addListener("response", this._reportListLoaded, this);
            this._list.events.addListener("clear", this._reportListLoaded, this);
            this._list.events.addListener("error", this._reportListError, this);
            this._list.events.addListener("waiting", function () {
                if (adapter.isWindowVisible()) {
                    adapter.sendMessage("slice:loaded-list:loading");
                }
            });
        },
        observers: {
            "yadisk:user": function (topic, data) {
                if (this._authError || this._uid != data.uid) {
                    this._authError = false;
                    this._uid = data.uid;
                    this._list.clear();
                    if (this._uid && (adapter.isWindowVisible() || this._isActiveUser())) {
                        log("yadisk:user - isWindowVisible - request");
                        this._list.request();
                    }
                }
            },
            "slice:ui:cmd-list-refresh": function (topic, minTimeout) {
                this._list.request(minTimeout);
            },
            "slice-event-show": function () {
                log("slice-event-show");
                sliceData.save("lastOpen", Date.now());
                this._reportListLoaded();
                this._list.request();
            },
            "yadisk:upload": function (topic, item) {
                if (item.uid != this._uid) {
                    return;
                }
                if (item.error && item.canceled) {
                    return;
                }
                if (item.error) {
                    stat.logWidget("pass.uploadtodisk.fail." + (item.errorDescription || "unknown"));
                    notifyMgr.createNotification({
                        name: item.name.replace(/^.*[\\\/](?=[^\\\/]+$)/, ""),
                        context: "error"
                    });
                    return;
                }
                if (item.percent != 100) {
                    return;
                }
                log("yadisk:upload 100%");
                stat.logWidget("pass.uploadtodisk.done");
                var notifConfig = {
                    name: item.name.replace(/^.*[\\\/](?=[^\\\/]+$)/, ""),
                    context: this._getFileUrl(item.name)
                };
                notifyMgr.createNotification(notifConfig);
                var name = item.name;
                var metadata = {};
                if (item.pageURL) {
                    metadata.page_url = item.pageURL.substr(0, 400);
                }
                if (item.pageTitle) {
                    metadata.page_title = item.pageTitle.substr(0, 140);
                }
                if (item.imageAlt) {
                    metadata.image_alt = item.imageAlt.substr(0, 140);
                }
                setTimeout(function () {
                    this._setMetadata(name, metadata);
                    if (this._list.getValue()) {
                        this._getFileInfo(name, function (data) {
                            if (adapter.isWindowVisible()) {
                                if (data) {
                                    var list = this._list.getValue();
                                    if (list) {
                                        list.unshift(data);
                                    }
                                    adapter.sendMessage("slice:update-loaded", {
                                        item: data,
                                        notAddNew: false
                                    });
                                } else {
                                    this._list.request();
                                }
                            } else {
                                this._list.setExpire();
                            }
                        });
                    } else {
                        this._list.request();
                    }
                }.bind(this), 150);
            },
            "slice:download": function (topic, path) {
                this._ajax({
                    path: "resources/download",
                    params: { path: path },
                    callback: function (data) {
                        adapter.navigate(this._brandingUrl(data.href), "current tab");
                    },
                    errback: function (status, text) {
                        log("/upload: error " + status + " " + text);
                    }
                });
            },
            "slice:publish-copy": function (topic, data) {
                function copy(error, url) {
                    if (!error) {
                        adapter.sendOuterMessage("yadisk:slice:copy", url, function (error) {
                        }, this);
                        adapter.sendMessage("slice:set-copied-link", {
                            id: data.id,
                            url: url
                        });
                    }
                }
                if (data.publicUrl) {
                    copy(null, data.publicUrl);
                } else {
                    this._publish(data.path, copy);
                }
            },
            "yd:test": function (d, data) {
                for (var i = 0; i < 1; ++i) {
                    notifyMgr.createNotification({
                        name: "file1.png",
                        context: "http://yandex.ru",
                        preview: "http://slon-nb-w71.ld.yandex.ru/50.png"
                    });
                }
                for (var i = 0; i < 0; ++i) {
                    notifyMgr.createNotification({
                        name: "file2.png",
                        context: "error",
                        preview: ""
                    });
                }
            }
        },
        _isActiveUser: function () {
            if (!sliceData.data.lastOpen) {
                sliceData.save("lastOpen", Date.now());
            }
            return Date.now() - sliceData.data.lastOpen < MIN_USER_NOT_ACTIVITY_INTERVAL;
        },
        _brandingUrl: function (url) {
            return url ? url.replace(/^(https?:\/\/[^\/]*)\.yandex\.ru/, "$1" + config.HOST) : "";
        },
        _setAuthError: function () {
            this._authError = true;
            this._list.clear();
        },
        _ajax: function (conf) {
            this._authError = false;
            conf.ctx = this;
            conf.onAuthError = this._setAuthError;
            diskAPI.ajax(conf);
        },
        _getFileUrl: function (path) {
            if (!path) {
                return config.PATH_URL + "/";
            }
            path = path.replace(/^disk:\//, "");
            var folder = encodeURIComponent(path.replace(/\/?[^\/]+$/, ""));
            return config.PATH_URL + "/" + folder + "%7Cselect/disk/" + encodeURIComponent(path);
        },
        _handleFileInfo: function (item) {
            if (!item.id) {
                item.id = "li_" + encodeURIComponent(item.path);
            }
            if (!item._iconUrl) {
                item._iconUrl = getIconPath(item);
            }
            if (!item._imgPreview && item.preview && item.media_type == "image") {
                item._imgPreview = this._brandingUrl(item.preview).replace("&crop=0", "&crop=1");
            }
            item._fileUrl = this._getFileUrl(item.path);
            return item;
        },
        _getFileInfo: function (path, callback) {
            return this._ajax({
                path: "resources",
                params: {
                    path: path,
                    preview_crop: "true",
                    preview_size: config.LIST_PREVIEW_SIZE + "x" + config.LIST_PREVIEW_SIZE
                },
                callback: function (data) {
                    callback.call(this, this._handleFileInfo(data));
                },
                errback: function (status, text) {
                    log("resources: error " + status + " " + text);
                    callback.call(this);
                }
            });
        },
        _setMetadata: function (path, data, callback) {
            return this._ajax({
                path: "resources",
                method: "PATCH",
                params: { path: path },
                contentType: "application/json",
                data: JSON.stringify({ custom_properties: data }),
                callback: function (fileData) {
                    if (callback) {
                        callback.call(this, null, this._handleFileInfo(fileData));
                    }
                },
                errback: function (status, text) {
                    log("PATCH resources: error " + status + " " + text);
                    if (callback) {
                        callback.call(this, {
                            status: status,
                            text: text
                        }, null);
                    }
                }
            });
        },
        _publish: function (path, callback) {
            this._ajax({
                path: "resources/publish",
                method: "PUT",
                params: { path: path },
                callback: function (data) {
                    this._ajax({
                        url: data.href,
                        callback: function (data) {
                            this._handleFileInfo(data);
                            var item = this._getLoadedItemById(data.id);
                            if (item) {
                                item.public_url = data.public_url;
                                item.public_key = data.public_key;
                            } else {
                                this._list.clearValue();
                            }
                            callback.call(this, null, data.public_url);
                        },
                        errback: function (status, text) {
                            log("resources/publish-get-info: error " + status + " " + text);
                        }
                    });
                },
                errback: function (status, text) {
                    log("resources/publish: error " + status + " " + text);
                }
            });
        },
        _getLastLoads: function (req) {
            var minEndTime = Date.now() + (req.getParams() || 0);
            return this._ajax({
                path: "resources/last-uploaded",
                params: {
                    limit: 20,
                    preview_crop: "true",
                    preview_size: config.LIST_PREVIEW_SIZE + "x" + config.LIST_PREVIEW_SIZE
                },
                callback: function (data) {
                    if (data.items) {
                        data.items.forEach(this._handleFileInfo, this);
                    }
                    req.setValue(data.items || []);
                },
                errback: function (status, text) {
                    var delta = minEndTime - Date.now();
                    if (delta > 10) {
                        setTimeout(function () {
                            req.setError({
                                status: status,
                                text: text
                            });
                        }, delta);
                    } else {
                        req.setError({
                            status: status,
                            text: text
                        });
                    }
                }
            });
        },
        _getLoadedItemById: function (id) {
            var list = this._list.getValue();
            if (!list) {
                return null;
            }
            for (var i = 0; i < list.length; ++i) {
                if (list[i].id == id) {
                    return list[i];
                }
            }
            return null;
        },
        _reportListLoaded: function () {
            var list = this._list.getValue();
            if (!list || !list.length || adapter.isWindowVisible()) {
                adapter.sendMessage("slice:loaded-list", {
                    uid: this._uid,
                    list: list
                });
            }
        },
        _reportListError: function () {
            if (adapter.isWindowVisible()) {
                var error = this._list.getError();
                adapter.sendMessage("slice:loaded-list:error", {
                    uid: this._uid,
                    error: error.text == "Unauthorized" ? "noauth" : error
                });
            }
        }
    };
    manager.onReady(module);
    return module;
});
define("slice/common-logic/timers", [
    "browser-adapter",
    "api/manager"
], function (adapter, manager) {
    var log = function (str, method) {
        adapter.log("[sliceApi.timers]: " + str);
    };
    var MAX_EXPANDING_SKIPS = 2;
    function Timer(ms, callback, scope, maxExpandingSkips) {
        var self = this;
        this._callback = function () {
            var canCall = true;
            if (self._expandingMode) {
                canCall = self._expandingCurrent >= self._expandingSkipCount;
                if (canCall) {
                    if (self._expandingSkipCount < self._maxSkipCount) {
                        self._expandingSkipCount++;
                    }
                    self._expandingCurrent = 0;
                } else {
                    self._expandingCurrent++;
                }
            }
            if (canCall) {
                callback.call(scope || self);
            }
        };
        this._interval = 0;
        this._maxSkipCount = maxExpandingSkips || MAX_EXPANDING_SKIPS;
        this._expandingMode = false;
        this.setInterval(ms);
    }
    Timer.prototype = {
        constructor: Timer,
        setInterval: function (v) {
            v = Number(v);
            if (this._interval != v) {
                this._interval = v;
                var started = this._timer;
                this.stop();
                if (started) {
                    this.start();
                }
            }
            return this;
        },
        start: function () {
            if (!this._timer && this._interval >= 1) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
                this._timer = setInterval(this._callback, this._interval);
            }
            return this;
        },
        stop: function () {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
            return this;
        },
        setExpanding: function (state) {
            state = state !== false;
            if (this._expandingMode == state) {
                return;
            }
            this._expandingMode = state;
            log("setExpanding " + state);
            if (state) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
            }
            return this;
        },
        resetExpanding: function () {
            if (this._expandingMode) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
            }
            return this;
        },
        finalize: function () {
            this.stop();
            this._callback = null;
            this._interval = 0;
        }
    };
    var timers = [];
    var thisModule = {
        create: function (ms, callback, scope, maxExpandingSkips) {
            if (typeof ms == "function") {
                maxExpandingSkips = scope;
                scope = callback;
                callback = ms;
                ms = 0;
            }
            var tmr = new Timer(ms, callback, scope, maxExpandingSkips);
            timers.push(tmr);
            return tmr;
        },
        stopAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].stop();
            }
        },
        startAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].start();
            }
        },
        finalize: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].finalize();
            }
            timers = [];
        }
    };
    manager.onReady(thisModule);
    return thisModule;
});
define("slice/logic/dl-helper", [
    "browser-adapter",
    "api/manager",
    "api/http"
], function (adapter, manager, http) {
    function log(str) {
        adapter.log("[dlHelper]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[dlHelper]: " + (str || ""));
    }
    var rxFile = /^[^?#]*[^\/?#]+\/([^\/?#]+)\.([a-z0-9-]+)([?#]|$)/i;
    var rxDomain = /^https?:\/\/([^\/]+)/;
    var ctypesDocs = {
        "application/acad": ["dwg"],
        "application/arj": ["arj"],
        "application/book": [
            "boo",
            "book"
        ],
        "application/clariscad": ["ccad"],
        "application/drafting": ["drw"],
        "application/dxf": ["dxf"],
        "application/ecmascript": ["js"],
        "application/excel": [
            "xls",
            "xlb",
            "xlc",
            "xld",
            "xlk",
            "xll",
            "xlm",
            "xla",
            "xlt",
            "xlv",
            "xlw"
        ],
        "application/gnutar": ["tgz"],
        "application/hlp": ["hlp"],
        "application/inf": ["inf"],
        "application/java": ["class"],
        "application/java-byte-code": ["class"],
        "application/javascript": ["js"],
        "application/lha": ["lha"],
        "application/lzx": ["lzx"],
        "application/mac-binary": ["bin"],
        "application/mac-compactpro": ["cpt"],
        "application/macbinary": ["bin"],
        "application/mime": ["aps"],
        "application/mspowerpoint": [
            "ppt",
            "pot",
            "pps",
            "ppz"
        ],
        "application/msword": [
            "doc",
            "dot"
        ],
        "application/octet-stream": [
            "",
            "arc",
            "arj",
            "bin",
            "com",
            "exe",
            "lha",
            "lhx",
            "lzh",
            "lzx",
            "psd",
            "msi",
            "xps",
            "fb2"
        ],
        "application/pdf": ["pdf"],
        "application/plain": ["text"],
        "application/postscript": [
            "ai",
            "ps"
        ],
        "application/powerpoint": ["ppt"],
        "application/rtf": [
            "rtf",
            "rtx"
        ],
        "application/vnd.hp-pcl": ["pcl"],
        "application/vnd.ms-excel": [
            "xls",
            "xlb",
            "xlc",
            "xll",
            "xlm",
            "xlw"
        ],
        "application/vnd.ms-powerpoint": [
            "ppt",
            "pot",
            "ppa",
            "pps",
            "pwz"
        ],
        "application/vnd.rn-realmedia": ["rm"],
        "application/vocaltec-media-desc": ["vmd"],
        "application/x-binary": ["bin"],
        "application/x-cdlink": ["vcd"],
        "application/x-compactpro": ["cpt"],
        "application/x-compress": ["z"],
        "application/x-compressed": [
            "zip",
            "gz",
            "tgz",
            "z"
        ],
        "application/x-cpt": ["cpt"],
        "application/x-director": [
            "dcr",
            "dir",
            "dxr"
        ],
        "application/x-dvi": ["dvi"],
        "application/x-excel": [
            "xls",
            "xla",
            "xlb",
            "xlc",
            "xld",
            "xlk",
            "xll",
            "xlm",
            "xlt",
            "xlv",
            "xlw"
        ],
        "application/x-gzip": [
            "gz",
            "gzip"
        ],
        "application/x-helpfile": ["hlp"],
        "application/x-java-class": ["class"],
        "application/x-java-commerce": ["jcm"],
        "application/x-javascript": ["js"],
        "application/x-latex": ["latex"],
        "application/x-lha": ["lha"],
        "application/x-lisp": ["lsp"],
        "application/x-lzh": ["lzh"],
        "application/x-lzx": ["lzx"],
        "application/x-macbinary": ["bin"],
        "application/x-midi": [
            "mid",
            "midi"
        ],
        "application/x-mplayer2": ["asx"],
        "application/x-msexcel": [
            "xls",
            "xla",
            "xlw"
        ],
        "application/x-mspowerpoint": ["ppt"],
        "application/x-navi-animation": ["ani"],
        "application/x-nokia-9000-communicator-add-on-software": ["aos"],
        "application/x-pagemaker": [
            "pm4",
            "pm5"
        ],
        "application/x-pcl": ["pcl"],
        "application/x-pointplus": ["css"],
        "application/x-rtf": ["rtf"],
        "application/x-shockwave-flash": ["swf"],
        "application/x-tar": ["tar"],
        "application/x-tcl": ["tcl"],
        "application/x-troff-man": ["man"],
        "application/x-troff-msvideo": ["avi"],
        "application/x-visio": [
            "vsd",
            "vst",
            "vsw"
        ],
        "application/x-vrml": ["vrml"],
        "application/x-winhelp": ["hlp"],
        "application/x-zip-compressed": ["zip"],
        "application/xml": ["xml"],
        "application/zip": ["zip"],
        "audio/aiff": [
            "aif",
            "aiff"
        ],
        "audio/basic": ["au"],
        "audio/midi": [
            "mid",
            "midi"
        ],
        "audio/mod": ["mod"],
        "audio/mpeg": [
            "mp2",
            "mpa",
            "mpg",
            "mpga"
        ],
        "audio/mpeg3": ["mp3"],
        "audio/wav": ["wav"],
        "audio/x-aiff": [
            "aif",
            "aiff"
        ],
        "audio/x-au": ["au"],
        "audio/x-jam": ["jam"],
        "audio/x-mid": [
            "mid",
            "midi"
        ],
        "audio/x-midi": [
            "mid",
            "midi"
        ],
        "audio/x-mod": ["mod"],
        "audio/x-mpeg": ["mp2"],
        "audio/x-mpeg-3": ["mp3"],
        "audio/x-mpequrl": ["m3u"],
        "audio/x-pn-realaudio": [
            "ra",
            "ram",
            "rm"
        ],
        "audio/x-pn-realaudio-plugin": [
            "ra",
            "rpm"
        ],
        "audio/x-realaudio": ["ra"],
        "audio/x-wav": ["wav"],
        "audio/xm": ["xm"],
        "image/bmp": [
            "bmp",
            "bm"
        ],
        "image/gif": ["gif"],
        "image/jpeg": [
            "jpg",
            "jfif",
            "jfif-tbnl",
            "jpe",
            "jpeg"
        ],
        "image/pict": [
            "pic",
            "pict"
        ],
        "image/pjpeg": [
            "jpg",
            "jfif",
            "jpe",
            "jpeg"
        ],
        "image/png": ["png"],
        "image/tiff": [
            "tif",
            "tiff"
        ],
        "image/vnd.dwg": [
            "dwg",
            "dxf"
        ],
        "image/x-dwg": [
            "dwg",
            "dxf"
        ],
        "image/x-icon": ["ico"],
        "image/x-jg": ["art"],
        "image/x-jps": ["jps"],
        "image/x-pcx": ["pcx"],
        "image/x-pict": ["pct"],
        "image/x-quicktime": ["qtif"],
        "image/x-tiff": [
            "tif",
            "tiff"
        ],
        "image/x-windows-bmp": ["bmp"],
        "image/x-xpixmap": ["pm"],
        "image/vnd.djvu": ["djvu"],
        "image/svg+xml": ["svg"],
        "model/vrml": ["vrml"],
        "multipart/x-gzip": ["gzip"],
        "multipart/x-zip": ["zip"],
        "music/crescendo": [
            "mid",
            "midi"
        ],
        "text/css": ["css"],
        "text/ecmascript": ["js"],
        "text/html": [
            "html",
            "htm",
            "htmls",
            "shtml"
        ],
        "text/javascript": ["js"],
        "text/pascal": ["pas"],
        "text/plain": [
            "txt",
            "c++",
            "com",
            "conf",
            "def",
            "h",
            "jav",
            "java",
            "list",
            "lst",
            "text"
        ],
        "text/richtext": [
            "rtf",
            "rtx"
        ],
        "text/sgml": ["sgml"],
        "text/uri-list": ["uri"],
        "text/webviewhtml": ["htt"],
        "text/x-asm": ["asm"],
        "text/x-c": [
            "c",
            "cpp"
        ],
        "text/x-h": ["h"],
        "text/x-sgml": ["sgml"],
        "text/xml": ["xml"],
        "video/3gpp": [
            "3gp",
            "3gpp"
        ],
        "video/avi": ["avi"],
        "video/dl": ["dl"],
        "video/mp4": ["mp4"],
        "video/mpeg": [
            "mpeg",
            "mp2",
            "mp3",
            "mpa",
            "mpg"
        ],
        "video/msvideo": ["avi"],
        "video/quicktime": [
            "mov",
            "qt"
        ],
        "video/vnd.rn-realvideo": ["rv"],
        "video/x-dl": ["dl"],
        "video/x-dv": ["dif"],
        "video/x-flv": ["flv"],
        "video/x-mpeg": [
            "mp2",
            "mp3"
        ],
        "video/x-mpeq2a": ["mp2"],
        "video/x-ms-asf": [
            "asf",
            "asx"
        ],
        "video/x-ms-asf-plugin": ["asx"],
        "video/x-msvideo": ["avi"],
        "video/x-sgi-movie": ["movie"],
        "video/webm": ["webm"],
        "windows/metafile": ["wmf"],
        "x-conference/x-cooltalk": ["ice"],
        "x-music/x-midi": [
            "mid",
            "midi"
        ],
        "x-world/x-vrml": ["vrml"]
    };
    var ctypesOther = {
        "applicaiton/x-bytecode.python": ["pyc"],
        "application/x-bsh": ["sh"],
        "application/x-sh": ["sh"],
        "application/x-shar": ["sh"],
        "text/x-java-source": [
            "java",
            "jav"
        ],
        "text/x-script.lisp": ["lsp"],
        "text/x-script.perl": ["pl"],
        "text/x-script.perl-module": ["pm"],
        "text/x-script.phyton": ["py"],
        "text/x-script.sh": ["sh"],
        "text/x-script.tcl": ["tcl"],
        "text/x-server-parsed-html": [
            "shtml",
            "ssi"
        ],
        "text/x-component": ["htc"],
        "text/asp": ["asp"]
    };
    function getDateStr() {
        var d = new Date();
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
    }
    function getHeader(xhr, name) {
        try {
            return xhr.getResponseHeader(name);
        } catch (exc) {
            return "";
        }
    }
    function createFileName(url, contentType) {
        var filename = rxDomain.test(url) ? RegExp.$1.replace(/\./g, "_") : getDateStr();
        log("contentType = " + contentType);
        if (contentType) {
            var tzidx = contentType.indexOf(";");
            if (tzidx > 0) {
                contentType = contentType.substr(0, tzidx);
            }
            var arr = ctypesDocs[contentType] || ctypesOther[contentType];
            if (arr) {
                return filename + (arr[0] ? "." + arr[0] : "");
            }
        }
        return filename;
    }
    function getNameFromHeaders(xhr, url) {
        var contentDisposition = getHeader(xhr, "Content-Disposition");
        log("contentDisposition = " + contentDisposition);
        if (/filename=(.+)$/.test(contentDisposition)) {
            return RegExp.$1;
        }
        return createFileName(url, getHeader(xhr, "Content-Type"));
    }
    function findExt(ctypesMap, ext) {
        for (var i in ctypesMap) {
            if (ctypesMap.hasOwnProperty(i)) {
                var arr = ctypesMap[i];
                if (arr.indexOf(ext) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }
    var MAX_FILE_FULLNAME_LENGTH = 244;
    var MAX_FILE_NAME_LENGTH = 228;
    var MAX_FILE_EXT_LENGTH = 15;
    function truncName(name) {
        if (name.length > MAX_FILE_FULLNAME_LENGTH) {
            var arr = name.split(/\.(?=[^.]+$)/);
            arr[0] = arr[0].substr(0, MAX_FILE_NAME_LENGTH);
            arr[1] = arr[1] && arr[1].substr(0, MAX_FILE_EXT_LENGTH);
            name = arr[0] + (arr[1] ? "." + arr[1] : "");
        }
        return name;
    }
    function removeBadChars(name) {
        return name ? name.replace(/[\\\/]/g, "_") : name;
    }
    var MAX_TRY_MAKE_NAME = 7;
    return {
        makeNextName: function (data) {
            var tryNumber = data._tn || 0;
            if (tryNumber >= MAX_TRY_MAKE_NAME) {
                return null;
            }
            data._tn = tryNumber + 1;
            if (tryNumber) {
                var rnd = "_(" + Date.now() % 10000000 + ")";
                var idx = data.name.lastIndexOf(".");
                return idx >= 0 ? data.name.replace(/(\.[^\.]*)$/, rnd + "$1") : data.name + rnd;
            }
            return data.name;
        },
        getFileName: function (data, callback, ctx) {
            var cb = callback;
            callback = function (name) {
                return cb.call(this, removeBadChars(name));
            };
            if (data.name) {
                callback.call(ctx, truncName(data.name.replace(/^.*[\\\/](?=[^\\\/]+$)/, "")));
                return;
            }
            if (!data.url) {
                callback.call(ctx);
                return;
            }
            if (/^data:(.+);base64,/.test(data.url)) {
                callback.call(ctx, createFileName("", RegExp.$1));
                return;
            }
            log(data.url);
            var match = rxFile.exec(data.url);
            if (match && findExt(ctypesDocs, match[2])) {
                var filename = match[1];
                try {
                    filename = decodeURIComponent(filename);
                } catch (exc) {
                }
                callback.call(ctx, truncName(filename + "." + match[2]));
                return;
            }
            http.HEAD({
                url: data.url,
                callback: function (resp, xhr) {
                    callback.call(ctx, truncName(getNameFromHeaders(xhr, data.url)));
                },
                errback: function (st) {
                    callback.call(ctx, truncName(createFileName(data.url)));
                }
            });
        }
    };
});
define("slice/logic/zaberun", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "slice/common-logic/data-manager",
    "slice/common-logic/timers",
    "slice/logic/config",
    "slice/logic/api",
    "slice/logic/dl-helper"
], function (adapter, manager, stat, DataManager, timers, config, diskAPI, dlHelper) {
    function log(str) {
        adapter.log("[zaberun]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[zaberun]: " + (str || ""));
    }
    var UPDATE_INTERVAL = 4000;
    var TIMER_INTERVAL = 3000;
    var MAX_CREATE_FOLDER_TRY_COUNT = 5;
    var ERROR_NO_AUTH = "service-http-401";
    var ERROR_NO_FILE_NAME = "service-http-400";
    var ERROR_USER_CHANGED = "service-http-401";
    var ERROR_FILE_EXISTS = "service-http-409";
    var ERROR_FOLDER_NOT_FOUND = "service-http-409";
    var ERROR_NO_UPLOAD_FOLDER = "service-http-409";
    var ENABLE_ZABERUN = false;
    function ZaberunItem(data) {
        this.id = data.id;
        this.uid = data.uid;
        this.name = data.name;
        this.operationURL = data.operationURL;
        this.ts = 0;
        this.requestCounter = 0;
    }
    ZaberunItem.prototype = {
        constructor: ZaberunItem,
        _getInterval: function () {
            if (this.lastError == 429) {
                return UPDATE_INTERVAL * 4;
            }
            if (this.requestCounter <= 3) {
                return UPDATE_INTERVAL;
            }
            if (this.requestCounter <= 6) {
                return UPDATE_INTERVAL * (this.requestCounter - 2);
            }
            return UPDATE_INTERVAL * 4;
        },
        tryRequest: function () {
            var now = Date.now();
            if (!this.updating && now - this.ts > this._getInterval()) {
                this.updating = true;
                this.lastError = null;
                module._ajax({
                    ctx: this,
                    url: this.operationURL,
                    callback: this._operationCallback,
                    errback: this._operationErrback
                });
            }
        },
        _operationCallback: function (data) {
            this.updating = false;
            this.requestCounter++;
            this.ts = Date.now();
            if (data.status !== "in-progress") {
                delete module._data[this.id];
            }
            if (data.status == "success") {
                adapter.sendOuterMessage("yadisk:slice:zaberun:success", { id: this.id });
                return;
            }
            if (data.status == "failed") {
                if (this.uid == module._uid) {
                    module._getUploadInfo(this, false);
                } else {
                    adapter.sendOuterMessage("yadisk:slice:zaberun:failed", { id: this.id });
                }
            }
        },
        _operationErrback: function (status, text) {
            this.updating = false;
            this.requestCounter++;
            this.ts = Date.now();
            if (status == 404) {
                delete module._data[this.id];
                adapter.sendOuterMessage("yadisk:slice:zaberun:expired", { id: this.id });
                return;
            }
            this.lastError = status;
        }
    };
    var module = {
        _data: {},
        _yadiskUploadsHandled: false,
        _uid: null,
        init: function () {
            this._timer = timers.create(TIMER_INTERVAL, this._timerFunc, this);
            this._uploadFolderGetter = new DataManager(this._requestUploadFolder, this);
            this._uploadFolderCreator = new DataManager(this._createUploadFolder, this, 5000);
            this._uploadClicked = false;
        },
        observers: {
            "yadisk:user": function (topic, data) {
                if (this._authError || this._uid != data.uid) {
                    this._authError = false;
                    this._uid = data.uid;
                    this._uploadFolderGetter.clear();
                    this._uploadFolderCreator.clear();
                    this._timerFunc();
                }
            },
            "yadisk:uploads": function (topic, list) {
                if (this._yadiskUploadsHandled) {
                    return;
                }
                this._yadiskUploadsHandled = true;
                for (var i = 0; i < list.length; ++i) {
                    if (list[i].operationURL && !list[i].zaberunFailed) {
                        this._data[list[i].id] = new ZaberunItem(list[i]);
                    }
                }
                this._timerFunc();
            },
            "yadisk:upload": function (topic, item) {
                if (item.canceled) {
                    log("remove zaberun item " + item.id);
                    delete this._data[item.id];
                }
            },
            "yadisk:slice:file-upload": function () {
                this._uploadClicked = true;
            },
            "yadisk:get-upload-info": function (topic, data) {
                log(topic);
                var params = {
                    id: data.id,
                    name: data.name,
                    url: data.url,
                    srcURL: /^https?:/.test(data.url) ? data.url : "",
                    zaberunFailed: data.zaberunFailed,
                    uid: this._uid
                };
                if (data.name && this._uploadClicked) {
                    stat.logWidget("act.slice.uploadbutton.done");
                }
                this._uploadClicked = false;
                if (!this._uid) {
                    this._sendUploadInfo(params.id, ERROR_NO_AUTH);
                    return;
                }
                adapter.sendMessage("yadisk:upload", params);
                dlHelper.getFileName(params, function (name) {
                    if (!name) {
                        this._sendUploadInfo(params.id, ERROR_NO_FILE_NAME);
                        return;
                    }
                    if (this._uid != params.uid) {
                        this._sendUploadInfo(params.id, ERROR_USER_CHANGED);
                        return;
                    }
                    if (params.name != name) {
                        adapter.sendOuterMessage("yadisk:slice:file-name", {
                            id: params.id,
                            name: name
                        });
                        params.name = name;
                        adapter.sendMessage("yadisk:upload", params);
                    }
                    this._getUploadInfo(params, ENABLE_ZABERUN && !params.zaberunFailed && params.url && /^https?:/.test(params.url));
                }, this);
            }
        },
        _sendUploadInfo: function (id, error, url, method) {
            setTimeout(function () {
                adapter.sendOuterMessage("yadisk:slice:upload-info", {
                    id: id,
                    error: error || "",
                    url: url || "",
                    method: method || ""
                });
            }, 200);
        },
        _timerFunc: function () {
            var count = 0;
            for (var i in this._data) {
                if (this._data.hasOwnProperty(i) && this._data[i].uid == this._uid) {
                    count++;
                    this._data[i].tryRequest();
                }
            }
            this._timer[count ? "start" : "stop"]();
        },
        _setAuthError: function () {
            this._authError = true;
            this._uploadFolderCreator.clear();
            this._uploadFolderGetter.clear();
        },
        _ajax: function (conf) {
            this._authError = false;
            conf.ctx = conf.ctx || this;
            conf.onAuthError = this._setAuthError;
            diskAPI.ajax(conf);
        },
        _requestUploadFolder: function (req) {
            return this._ajax({
                callback: function (data) {
                    req.setValue(data.system_folders.downloads);
                },
                errback: function (status, text) {
                    req.setError({
                        status: status,
                        text: text
                    });
                }
            });
        },
        _createUploadFolder: function (req) {
            this._uploadFolderGetter.request(function (folderGetter) {
                req.saveRequest(this._ajax({
                    method: "PUT",
                    path: "resources",
                    params: { path: folderGetter.getValue() },
                    callback: function (data) {
                        req.setValue(null);
                    },
                    errback: function (status, text) {
                        if (text == "DiskPathPointsToExistentDirectoryError") {
                            req.setValue(null);
                        } else {
                            req.setError({
                                status: status,
                                text: text
                            });
                        }
                    }
                }));
            }, function (folderGetter) {
                var error = folderGetter.getError();
                req.setError(error);
            });
        },
        _addZaberunItem: function (params, path, href) {
            var data = {
                id: params.id,
                uid: params.uid,
                srcURL: params.srcURL,
                name: path,
                operationURL: href
            };
            adapter.sendMessage("yadisk:upload", data);
            this._data[params.id] = new ZaberunItem(data);
            adapter.sendOuterMessage("yadisk:slice:zaberun:start", {
                id: params.id,
                operationURL: href
            });
            this._timer[params.uid == this._uid ? "start" : "stop"]();
        },
        _getUploadInfo: function (params, zab) {
            var rname = dlHelper.makeNextName(params);
            log("rname = " + rname);
            if (!rname) {
                this._sendUploadInfo(params.id, ERROR_FILE_EXISTS);
                return;
            }
            params._createFolderTryCount = params._createFolderTryCount || 0;
            this._uploadFolderGetter.request(function getUploadInfo(folderGetter) {
                var path = folderGetter.getValue() + rname;
                var uploadData = { path: path };
                if (zab) {
                    uploadData.url = params.url;
                }
                this._ajax({
                    path: "resources/upload",
                    method: zab ? "POST" : "GET",
                    query: uploadData,
                    callback: function (data) {
                        adapter.sendOuterMessage("yadisk:slice:file-name", {
                            id: params.id,
                            name: path
                        });
                        if (zab) {
                            this._addZaberunItem(params, path, data.href);
                        } else {
                            this._sendUploadInfo(params.id, null, data.href, data.method);
                        }
                        stat.logWidget("pass.uploadtodisk.start");
                    },
                    errback: function (status, text) {
                        log("/upload: error " + status + " " + text);
                        if (text == "DiskResourceAlreadyExistsError") {
                            this._getUploadInfo(params, zab);
                            return;
                        }
                        if (text == "DiskPathDoesntExistsError") {
                            params._createFolderTryCount++;
                            if (params._createFolderTryCount < MAX_CREATE_FOLDER_TRY_COUNT) {
                                log("uploadFolder not exists, try create");
                                this._uploadFolderCreator.request(function () {
                                    getUploadInfo.call(this, folderGetter);
                                }, function () {
                                    this._sendUploadInfo(params.id, ERROR_FOLDER_NOT_FOUND);
                                });
                                return;
                            }
                        }
                        if (zab && status == 429) {
                            this._getUploadInfo(params, false);
                            return;
                        }
                        this._sendUploadInfo(params.id, "service-http-" + status);
                    }
                });
            }, function () {
                this._sendUploadInfo(params.id, ERROR_NO_UPLOAD_FOLDER);
            });
        }
    };
    manager.onReady(module);
    return module;
});
define("slice/logic/main", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "slice/logic/config",
    "slice/logic/manager",
    "slice/logic/zaberun"
], function (adapter, manager, stat, config) {
    var main = {
        init: function () {
            this._uid = "";
            setTimeout(function () {
                adapter.sendOuterMessage("yadisk:slice:init");
                if (config.REQUEST_UPLOADS_IN_LOGIC) {
                    adapter.sendOuterMessage("yadisk:slice:get-uploads");
                }
            }, 10);
        },
        observers: {
            "yadisk:user": function (topic, data) {
                this._uid = data.uid;
            },
            "yadisk:slice:get-uploads": function (topic, data) {
                if (this._uid) {
                    adapter.sendMessage("slice:user", { uid: this._uid });
                }
            },
            "slice-event-show": function (topic, data) {
                stat.logWidget("act.button");
            }
        }
    };
    manager.onReady(main);
    return main;
});
