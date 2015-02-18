require(["slice/adapter/main"], function () {
    require(["slice/logic/main"]);
});
define("main-logic", function () {
});
define("slice/common-logic/request-manager", [
    "browser-adapter",
    "api/dispatcher"
], function (adapter, Dispatcher) {
    function log(str) {
        adapter.log("[request-mgr]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[request-mgr]: " + (str || ""));
    }
    function RequestMgr(requestFunc, ctx, expireInterval) {
        this._ctx = ctx;
        this._expireInterval = expireInterval;
        this._requestFunc = requestFunc;
        this._request = null;
        this._error = null;
        this._value = null;
        this._updatedTime = 0;
        this._expireTime = null;
        this._updating = false;
        this._expireDetected = false;
        this._callbacks = new Dispatcher();
        this.events = new Dispatcher();
    }
    RequestMgr.prototype = {
        constructor: RequestMgr,
        getValue: function () {
            return this.expired() ? null : this._value;
        },
        getError: function () {
            return this._error;
        },
        getExpireTime: function () {
            return this._expireTime;
        },
        _setResult: function (error, value, expireInterval) {
            this._error = error;
            this._value = value;
            this._expireDetected = false;
            this._updatedTime = error ? 0 : Date.now();
            this._expireTime = null;
            if (typeof expireInterval !== "number") {
                expireInterval = this._expireInterval;
            }
            if (!error && typeof expireInterval === "number") {
                this._expireTime = this._updatedTime + expireInterval;
            }
            this._updating = false;
            this._request = null;
        },
        setValue: function (value, expireInterval) {
            var updating = this._updating;
            this._setResult(null, value, expireInterval);
            if (updating) {
                this.events.notify("loaded", this);
            }
            this.events.notify("changed", this);
            if (this.expired()) {
                this._notifyExpired();
            }
            this._callbacks.notify(null, this);
            this._callbacks.clear();
            if (updating) {
                this.events.notify("response", this);
            }
            return this;
        },
        setError: function (error) {
            if (this._updating) {
                this._setResult(error || true, null);
                this._callbacks.notify(null, this);
                this._callbacks.clear();
                this.events.notify("error", this);
            }
            return this;
        },
        expired: function () {
            return typeof this._expireTime === "number" && this._expireTime <= Date.now();
        },
        updating: function () {
            return this._updating;
        },
        request: function (callback, ctx) {
            var expired = this.expired();
            if (this._updatedTime && !expired && !this.getError()) {
                if (callback) {
                    callback.call(ctx || this._ctx, this);
                }
                this.events.notify("response", this);
                return this;
            }
            if (expired) {
                this._notifyExpired();
            }
            this._callbacks.addListener(null, callback, ctx || this._ctx);
            this.events.notify("waiting", this);
            if (!this._updating) {
                this._updating = true;
                this.events.notify("loading", this);
                this._request = this._requestFunc.call(this._ctx || this, this);
            }
            return this;
        },
        abort: function () {
            if (this._request) {
                this._request.abort();
                this._request = null;
                this._updating = false;
                this._callbacks.notify(null, this);
                this._callbacks.clear();
            }
        },
        _notifyExpired: function () {
            if (!this._expireDetected) {
                this._expireDetected = true;
                this.events.notify("expired", this);
            }
        },
        setExpire: function () {
            if (!this._updating && this._updatedTime && !this.expired() && !this.getError()) {
                this._expireTime = 0;
                this._notifyExpired();
            }
            return this;
        },
        clearValue: function () {
            this._error = null;
            this._value = null;
            this._updatedTime = 0;
            this._expireTime = null;
            return this;
        },
        clear: function () {
            this.abort();
            this.clearValue();
            return this;
        }
    };
    return RequestMgr;
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
        "image/gif": ["gif"],
        "image/x-icon": ["ico"],
        "image/png": ["png"],
        "image/jpeg": [
            "jpg",
            "jpeg",
            "jpe",
            "jfif",
            "jfif-tbnl"
        ],
        "image/pjpeg": ["jpg"],
        "image/svg+xml": ["svg"],
        "image/bmp": [
            "bmp",
            "bm"
        ],
        "image/x-windows-bmp": ["bmp"],
        "image/vnd.dwg": ["dwg"],
        "image/x-dwg": ["dwg"],
        "image/x-jg": ["art"],
        "image/pict": [
            "pic",
            "pict"
        ],
        "image/x-pict": ["pct"],
        "image/x-pcx": ["pcx"],
        "image/x-quicktime": ["qtif"],
        "image/tiff": [
            "tiff",
            "tif"
        ],
        "image/x-tiff": ["tif"],
        "image/x-jps": ["jps"],
        "image/vnd.djvu": ["djvu"],
        "text/xml": ["xml"],
        "text/plain": ["txt"],
        "application/pdf": ["pdf"],
        "audio/mpeg3": ["mp3"],
        "audio/x-mpeg-3": ["mp3"],
        "application/x-compress": ["z"],
        "application/x-compressed": [
            "zip",
            "z"
        ],
        "application/x-zip-compressed": ["zip"],
        "application/zip": ["zip"],
        "multipart/x-zip": ["zip"],
        "application/octet-stream": [
            "",
            "xps",
            "fb2",
            "exe",
            "msi"
        ]
    };
    var ctypesOther = {};
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
            if (data.name) {
                callback.call(ctx, data.name.replace(/^.*[\\\/](?=[^\\\/]+$)/, ""));
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
                callback.call(ctx, match[1].replace(/%20/g, " ") + "." + match[2]);
                return;
            }
            http.HEAD({
                url: data.url,
                callback: function (resp, xhr) {
                    callback.call(ctx, getNameFromHeaders(xhr, data.url));
                },
                errback: function (st) {
                    callback.call(ctx, createFileName(data.url));
                }
            });
        }
    };
});
define("slice/logic/token-manager", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "slice/common-logic/request-manager",
    "slice/logic/config"
], function (adapter, manager, http, RequestMgr, config) {
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
            } catch (exc) {
                this._tokenStorage = {};
            }
            tokenMgr.events.addListener("loaded", this._saveToken, this);
            tokenMgr.events.addListener("expired", this._clearToken, this);
        },
        observers: {
            "yadisk:user": function (topic, data) {
                if (tokenMgr.getError() || this._uid != data.uid) {
                    log(data.uid);
                    tokenMgr.clear();
                    this._uid = data.uid;
                    var token = data.uid && this._tokenStorage[data.uid] && this._tokenStorage[data.uid][config.HOST];
                    if (token) {
                        tokenMgr.setValue(token.value, token.expireTime - Date.now());
                    }
                }
            }
        },
        _clearToken: function () {
            if (this._uid && this._tokenStorage[this._uid] && this._tokenStorage[this._uid][config.HOST]) {
                delete this._tokenStorage[this._uid][config.HOST];
                adapter.setOption("yadisk-tokens", JSON.stringify(this._tokenStorage));
            }
        },
        _saveToken: function () {
            var token = tokenMgr.getValue();
            if (token) {
                this._tokenStorage[this._uid] = this._tokenStorage[this._uid] || {};
                this._tokenStorage[this._uid][config.HOST] = {
                    value: token,
                    expireTime: tokenMgr.getExpireTime()
                };
                adapter.setOption("yadisk-tokens", JSON.stringify(this._tokenStorage));
            }
        },
        requestToken: function (reqMgr) {
            var httpreq = null;
            adapter.getCookie(config.HOST, "Session_id", "", true, function (sid) {
                if (!sid) {
                    reqMgr.setError({ status: 400 });
                    return;
                }
                httpreq = http.POST({
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
                        reqMgr.setValue(data.access_token, (data.expires_in - 3600) * 1000);
                    },
                    errback: function (status, text) {
                        log("_requestToken: error " + status + " " + text);
                        reqMgr.setError({ status: status });
                    }
                });
            }, this);
            return {
                abort: function () {
                    if (httpreq) {
                        httpreq.abort();
                    }
                }
            };
        }
    };
    var tokenMgr = new RequestMgr(tokenAPI.requestToken, tokenAPI);
    manager.onReady(tokenAPI);
    return tokenMgr;
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
    "slice/common-logic/plural"
], function (adapter, manager, stat, plural) {
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
            mainText: notification.mainText,
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
        var pluralForms;
        var oneType = getNotificationsType(notifications);
        if (oneType) {
            pluralForms = options.pluralForms[oneType];
        } else {
            pluralForms = options.pluralForms.mix;
        }
        var message = plural.form(count, pluralForms).replace(options.pluralPlaceholder, count, "gm");
        return {
            defaultTitle: options.defaultTitle,
            title: message,
            mainText: message,
            subText: "",
            type: oneType || "mix",
            template: platformApi.TEMPLATE_GROUP,
            context: options.defaultClickUrl,
            icon: options.defaultIconUrl,
            groupSize: count,
            isDefaultIcon: true
        };
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
        stat.logNotification(options.serviceName + ".{version}." + notificationType + "." + action);
    }
    var notify = {
        init: function () {
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
                    adapter.navigate(data.context, "new tab");
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
    "slice/common-logic/notify"
], function (adapter, manager, config, notify) {
    var mailUrl;
    manager.onReady(function () {
        notify.setOptions({
            serviceName: "yadisk",
            useMailTemplates: true,
            defaultTitle: adapter.getString("title"),
            defaultIconUrl: adapter.getSlicePath() + "images/disk16.png",
            defaultClickUrl: config.HOME_URL,
            pluralForms: {
                disksave: adapter.getString("slice.notif.saves"),
                mix: ""
            },
            requestShowPermission: function (callback) {
                var canShow = true;
                if (adapter.isWindowVisible()) {
                    canShow = false;
                    adapter.log("Notify: requestShowPermission, slice visibility check result: " + canShow);
                    callback(canShow);
                } else {
                    adapter.getCurrentTabUrl(function (url) {
                        canShow = url.indexOf(config.HOME_URL) === -1;
                        adapter.log("Notify: requestShowPermission, active tab check result: " + canShow);
                        callback(canShow);
                    });
                }
            }
        });
    });
    return {
        createNotification: function (fileInfo) {
            adapter.log("Send notification to platform");
            notify.show({
                type: "disksave",
                title: fileInfo.name,
                mainText: adapter.getString("slice.notif.saved"),
                icon: adapter.getSlicePath() + "images/disk32.png",
                context: fileInfo.url
            });
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
define("slice/logic/api", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "api/stat",
    "api/utils",
    "slice/common-logic/request-manager",
    "slice/logic/config",
    "slice/logic/dl-helper",
    "slice/logic/token-manager",
    "slice/logic/notify",
    "slice/logic/file-icons"
], function (adapter, manager, http, stat, utils, RequestMgr, config, dlHelper, tokenMgr, notifyMgr, getIconPath) {
    function log(str) {
        adapter.log("[api]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[api]: " + (str || ""));
    }
    var MIN_UPDATE_INTERVAL = 3000;
    var api = {
        init: function () {
            this._uid = "";
            this._authError = false;
            this._uploadFolderGetter = new RequestMgr(this._requestUploadFolder, this);
            this._uploadFolderCreator = new RequestMgr(this._createUploadFolder, this, 5000);
            this._list = new RequestMgr(this._getLastLoads, this, MIN_UPDATE_INTERVAL);
            this._list.events.addListener("response", this._reportLoaded, this);
            this._list.events.addListener("error", this._reportLoaded, this);
            this._list.events.addListener("waiting", function () {
                adapter.sendMessage("slice:loaded-list:loading");
            });
        },
        observers: {
            "yadisk:user": function (topic, data) {
                if (this._authError || this._uid != data.uid) {
                    this._authError = false;
                    this._uid = data.uid;
                    this._uploadFolderGetter.clear();
                    this._uploadFolderCreator.clear();
                    this._list.clear();
                    if (this._uid && adapter.isWindowVisible()) {
                        this._list.request();
                    }
                }
            },
            "slice:ui:cmd-list-refresh": function () {
                this._list.request();
            },
            "slice-event-show": function () {
                log("slice-event-show");
                this._list.request();
            },
            "yadisk:get-upload-info": function (topic, data) {
                log(topic);
                var params = {
                    id: data.id,
                    name: data.name,
                    url: data.url,
                    uid: this._uid
                };
                function reportError(error) {
                    adapter.sendOuterMessage("yadisk:slice:upload-info", {
                        id: params.id,
                        error: error,
                        name: params.name || "",
                        url: "",
                        method: ""
                    });
                }
                if (!this._uid) {
                    reportError(params, "no auth");
                    return;
                }
                dlHelper.getFileName(params, function (name) {
                    if (!name) {
                        reportError("no file name");
                        return;
                    }
                    params.name = name;
                    if (this._uid != params.uid) {
                        reportError("user changed");
                        return;
                    }
                    this._getUploadInfo(params, function (error, data) {
                        if (error) {
                            reportError(error);
                        } else {
                            adapter.sendOuterMessage("yadisk:slice:upload-info", {
                                id: params.id,
                                error: "",
                                name: data.path,
                                url: data.href,
                                method: data.method
                            });
                        }
                    });
                }, this);
            },
            "yadisk:upload": function (topic, item) {
                if (item.error || item.canceled || item.percent < 100) {
                    var statText = item.error ? "fail" : item.canceled ? "pause" : item.percent == 0 ? "start" : "";
                    if (statText) {
                        stat.logWidget("yadisk.{version}.uploadtodisk." + statText);
                    }
                    return;
                }
                log("yadisk:upload 100%");
                stat.logWidget("yadisk.{version}.uploadtodisk.done");
                if (!adapter.isWindowVisible()) {
                    notifyMgr.createNotification({
                        name: item.name.replace(/^.*[\\\/](?=[^\\\/]+$)/, ""),
                        url: this._getFileUrl(item.name)
                    });
                }
                this._setMetadata(item.name, {
                    "page_url": item.pageURL || null,
                    "page_title": item.pageTitle || null,
                    "image_alt": item.imageAlt || null
                }, function (error, data) {
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
                        this._list.clearValue();
                    }
                });
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
                            if (!error) {
                                adapter.sendMessage("slice:set-copied-link", url);
                            }
                        }, this);
                    }
                }
                if (data.publicUrl) {
                    copy(null, data.publicUrl);
                } else {
                    this._publish(data.path, copy);
                }
            },
            "yd:test": function (d, data) {
                this._setMetadata("/10a.png", data);
            }
        },
        _brandingUrl: function (url) {
            return url ? url.replace(/^(https?:\/\/[^\/]*)\.yandex\.ru/, "$1" + config.HOST) : "";
        },
        _setAuthError: function () {
            this._authError = true;
            this._list.clear();
            this._uploadFolderCreator.clear();
            this._uploadFolderGetter.clear();
        },
        _ajax: function (conf) {
            var retry = false;
            tokenMgr.request(function ajax() {
                var token = tokenMgr.getValue();
                if (!token) {
                    this._setAuthError();
                    log("_ajax errback 401");
                    conf.errback.call(this, 401, "Unauthorized");
                } else {
                    this._authError = false;
                    http[conf.method || "GET"]({
                        url: conf.url || config.API_URL + (conf.path ? "/" + conf.path : ""),
                        ctx: this,
                        noCache: true,
                        params: conf.params,
                        data: conf.data,
                        responseType: conf.responseType || "json",
                        contentType: conf.contentType,
                        headers: utils.copy(conf.headers, { Authorization: "OAuth " + token }),
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
                            if (text == "UnauthorizedError" && !retry) {
                                this._authError = true;
                                tokenMgr.setExpire();
                                if (!retry) {
                                    retry = true;
                                    tokenMgr.request(ajax, this);
                                }
                            } else {
                                conf.errback.call(this, status, data && data.error || "");
                            }
                        }
                    });
                }
            }, this);
        },
        _getFileUrl: function (path) {
            return config.PATH_URL + (path ? path.replace(/\/[^\/]+$/, "").replace(/^disk:/, "") : "");
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
            setTimeout(function () {
                this._ajax({
                    path: "resources",
                    params: { path: path },
                    callback: function (data) {
                        callback.call(this, this._handleFileInfo(data));
                    },
                    errback: function (status, text) {
                        log("resources: error " + status + " " + text);
                        callback.call(this);
                    }
                });
            }.bind(this), 150);
        },
        _setMetadata: function (path, data, callback) {
            setTimeout(function () {
                this._ajax({
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
            }.bind(this), 150);
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
                            adapter.sendMessage("slice:update-loaded", {
                                item: data,
                                notAddNew: true
                            });
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
            this._uploadFolderGetter.request(function () {
                var folder = this._uploadFolderGetter.getValue();
                if (folder) {
                    return this._ajax({
                        method: "PUT",
                        path: "resources",
                        params: { path: folder },
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
                    });
                } else {
                    var error = this._uploadFolderGetter.getError();
                    req.setError(error);
                }
            });
        },
        _getUploadInfo: function (params, callback) {
            var rname = dlHelper.makeNextName(params);
            if (!rname) {
                callback.call(this, "file exists");
                return;
            }
            this._uploadFolderGetter.request(function getUploadInfo() {
                if (!this._uploadFolderGetter.getValue()) {
                    callback.call(this, "no upload folder");
                    return;
                }
                var path = this._uploadFolderGetter.getValue() + rname;
                this._ajax({
                    path: "resources/upload",
                    params: { path: path },
                    callback: function (data) {
                        data.path = path;
                        callback.call(this, null, data);
                    },
                    errback: function (status, text) {
                        log("/upload: error " + status + " " + text);
                        if (text == "DiskResourceAlreadyExistsError") {
                            this._getUploadInfo(params, callback);
                            return;
                        }
                        if (text == "DiskPathDoesntExistsError") {
                            log("uploadFolder not exists, try create");
                            this._uploadFolderCreator.request(function () {
                                if (this._uploadFolderCreator.getError()) {
                                    callback.call(this, "folder not found");
                                } else {
                                    getUploadInfo.call(this);
                                }
                            });
                            return;
                        }
                        callback.call(this, "error " + status);
                    }
                });
            });
        },
        _getLastLoads: function (req) {
            return this._ajax({
                path: "resources/last-uploaded",
                params: { limit: 20 },
                callback: function (data) {
                    if (data.items) {
                        data.items.forEach(this._handleFileInfo, this);
                    }
                    req.setValue(data.items || []);
                },
                errback: function (status, text) {
                    req.setError({
                        status: status,
                        text: text
                    });
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
        _reportLoaded: function () {
            if (adapter.isWindowVisible()) {
                if (this._list.getError()) {
                    var authErr = tokenMgr.getError();
                    adapter.sendMessage("slice:loaded-list:error", {
                        uid: this._uid,
                        error: authErr && authErr.status == 400 ? "noauth" : this._list.getError()
                    });
                } else {
                    adapter.sendMessage("slice:loaded-list", {
                        uid: this._uid,
                        list: this._list.getValue()
                    });
                }
            }
        }
    };
    manager.onReady(api);
    return api;
});
define("slice/logic/main", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "slice/logic/api"
], function (adapter, manager, stat) {
    var main = {
        init: function () {
            this._uid = "";
            setTimeout(function () {
                adapter.sendOuterMessage("yadisk:slice:init");
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
                stat.logWidget("yadisk.{version}.button");
            }
        }
    };
    manager.onReady(main);
    return main;
});
