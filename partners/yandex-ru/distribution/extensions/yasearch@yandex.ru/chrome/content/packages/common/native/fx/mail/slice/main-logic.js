require(["slice/adapter/main"], function () {
    require(["slice/logic/main"]);
});
define("main-logic", function () {
});
define("slice/common-logic/yauth", ["browser-adapter"], function (adapter) {
    var KnownMessages = {
        USER_GET_ALL: "user:get-all",
        USER_LOGOUT: "user:logout",
        USER_LOGIN: "user:login",
        USER_LOGOUT_ALL: "user:logout-all",
        AUTH_LIST_UPDATED: "slice:auth:list-updated",
        AUTH_ADD_USER: "slice:auth:add-user",
        AUTH_REMOVE_USER: "slice:auth:remove-user",
        AUTH_CURRENT: "slice:auth:current",
        AUTH_LOGIN: "slice:auth:login",
        AUTH_LOGOUT: "slice:auth:logout"
    };
    function userId(user) {
        return user ? user.id : "";
    }
    function getUrlForDomain(domain, srcUrl) {
        return srcUrl ? srcUrl.replace("{passport}", domain) : "";
    }
    function User(cfg, passp) {
        this.data = {};
        this.requests = {};
        this.isCurrent = false;
        this.authorized = false;
        this.setUserInfo(cfg, passp);
    }
    User.prototype = {
        constructor: User,
        getUrl: function (srcUrl) {
            return getUrlForDomain(this.passport, srcUrl);
        },
        setUserInfo: function (cfg, passp) {
            var arrEmail = cfg.login.split("@");
            var domain = arrEmail[1] || passp;
            var email = arrEmail[0] + "@" + domain;
            this.login = arrEmail[0];
            this.domain = domain;
            this.passport = passp;
            this.email = email;
            this.displayName = cfg.displayName;
            this.email = email;
            this.id = cfg.uid;
            if (!this.login) {
                this.data.displayEmail = this.displayName;
            }
        },
        setMessages: function (newMessages, deleteRemainingMessages) {
            if (deleteRemainingMessages) {
                delete this.data.messages;
            }
            if (this.data.messages) {
                newMessages = newMessages.filter(this._filterMessage.bind(this));
            }
            if (newMessages) {
                this.data.messages = newMessages.concat(this.data.messages || []);
            }
            return newMessages ? newMessages.length > 0 : false;
        },
        deleteMessageById: function (id) {
            if (!this.data.messages) {
                return false;
            }
            var oldLength = this.data.messages.length;
            this.data.messages = this.data.messages.filter(function (oldMessage) {
                return oldMessage.id !== id;
            });
            return oldLength !== this.data.messages.length;
        },
        _filterMessage: function (message) {
            for (var i = 0, l = this.data.messages.length; i < l; i++) {
                var oldMessage = this.data.messages[i];
                if (oldMessage.id === message.id) {
                    return false;
                }
            }
            return true;
        }
    };
    function YAuth() {
        this._users = [];
        this._userMap = {};
        this._currentUser = null;
        this._domain = null;
    }
    YAuth.prototype = {
        constructor: YAuth,
        init: function () {
        },
        observers: {
            "user:all": function (topic, data) {
                adapter.log("Yauth: catch user:all event");
                adapter.log("Yauth: received domain - " + data.domain);
                this._domain = data.domain;
                var users = data.list;
                var i, user;
                var logoutUsers = [];
                var oldCurrent = this._currentUser;
                var newCurrent = null;
                var summary = {
                    addCount: 0,
                    removeCount: 0,
                    loginCount: 0,
                    logoutCount: 0,
                    currentChanged: false
                };
                for (i = 0; i < users.length; ++i) {
                    var srcUser = users[i];
                    user = this.getUser(srcUser.uid);
                    if (!user) {
                        user = new User(srcUser, data.domain);
                        this._users.push(user);
                        this._userMap[user.id] = user;
                        summary.addCount++;
                        adapter.log("Add user with id: " + user.id);
                        adapter.sendMessage(KnownMessages.AUTH_ADD_USER, user.id);
                    } else {
                        user.setUserInfo(srcUser, data.domain);
                    }
                    if (user.authorized != srcUser.isAuthorized) {
                        if (!user.authorized) {
                            user.authorized = true;
                            summary.loginCount++;
                            adapter.log("Login user with id: " + user.id);
                            adapter.sendMessage(KnownMessages.AUTH_LOGIN, user.id);
                        } else {
                            logoutUsers.push(user);
                        }
                    }
                    if (user.id == data.defaultUid) {
                        newCurrent = user;
                    }
                    if (user.isDeleted) {
                        delete user.isDeleted;
                    }
                    user.__handled = true;
                }
                if (newCurrent != oldCurrent) {
                    this._currentUser = newCurrent;
                    summary.currentChanged = true;
                    if (oldCurrent) {
                        oldCurrent.isCurrent = false;
                    }
                    if (newCurrent) {
                        newCurrent.isCurrent = true;
                    }
                    adapter.sendMessage(KnownMessages.AUTH_CURRENT, {
                        current: userId(newCurrent),
                        oldCurrent: userId(oldCurrent)
                    });
                }
                for (i = 0; i < logoutUsers.length; ++i) {
                    logoutUsers[i].authorized = false;
                    summary.logoutCount++;
                    adapter.log("Logout user with id: " + user.id);
                    adapter.sendMessage(KnownMessages.AUTH_LOGOUT, logoutUsers[i].id);
                }
                for (i = this._users.length - 1; i >= 0; --i) {
                    user = this._users[i];
                    if (!user.__handled) {
                        if (user.authorized) {
                            user.authorized = false;
                            summary.logoutCount++;
                            adapter.log("Logout user with id: " + user.id);
                            adapter.sendMessage(KnownMessages.AUTH_LOGOUT, user.id);
                        }
                        summary.removeCount++;
                        user.isDeleted = true;
                        adapter.log("Remove user with id: " + user.id);
                        adapter.sendMessage(KnownMessages.AUTH_REMOVE_USER, user.id);
                    } else {
                        delete user.__handled;
                    }
                }
                if (summary.addCount || summary.removeCount || summary.loginCount || summary.logoutCount || summary.currentChanged) {
                    adapter.sendMessage(KnownMessages.AUTH_LIST_UPDATED, summary);
                }
            }
        },
        updateUserData: function () {
            adapter.sendOuterMessage(KnownMessages.USER_GET_ALL);
        },
        getUser: function (id) {
            return id && this._userMap[id] || null;
        },
        getCurrentUser: function () {
            return this._currentUser;
        },
        getUrl: function (user, template) {
            var domain;
            if (!user) {
                domain = this._domain;
            } else {
                domain = user.passport;
            }
            return getUrlForDomain(domain, template);
        },
        hasAuth: function () {
            return this._currentUser !== null;
        },
        forEach: function (authOnly, callback, ctx) {
            for (var i = 0; i < this._users.length; ++i) {
                var user = this._users[i];
                if (!user.isDeleted && (!authOnly || user.authorized)) {
                    callback.call(ctx, user);
                }
            }
        }
    };
    return YAuth;
});
define("slice/logic/yauth", [
    "api/manager",
    "slice/common-logic/yauth"
], function (manager, Yauth) {
    var auth = new Yauth();
    manager.onReady(auth);
    return auth;
});
define("slice/logic/folders", [
    "browser-adapter",
    "api/xml"
], function (adapter, xml) {
    return {
        parse: function (data, callback, ctx) {
            var result;
            try {
                result = this._parseFolders(data);
                callback.call(ctx, null, result);
            } catch (e) {
                adapter.log("getfolders error:", e, result);
                callback.call(ctx, result);
            }
        },
        getFolderById: function (folders, id) {
            if (folders) {
                for (var i = 0; i < folders.length; i++) {
                    if (folders[i].id === id) {
                        return folders[i];
                    }
                }
            }
            return null;
        },
        _parseFolders: function (xmlDoc) {
            var folders = [];
            var nodeFolders = xml.selectAll("folder", xmlDoc);
            for (var i = 0; i < nodeFolders.length; i++) {
                var nodeFolder = nodeFolders[i];
                var symbol = xml.getText(nodeFolder, "symbol");
                var name = xml.getText(nodeFolder, "name").split("|").pop();
                folders.push({
                    id: xml.getText(nodeFolder, "fid"),
                    symbol: symbol,
                    name: name
                });
            }
            return folders;
        }
    };
});
define("slice/logic/messages", [
    "browser-adapter",
    "api/xml",
    "slice/logic/yauth",
    "slice/logic/config",
    "slice/logic/folders"
], function (adapter, xml, yauth, config, folders) {
    return {
        parse: function (data, callback, ctx) {
            var result;
            try {
                result = this._parseMessages(data);
                callback.call(ctx, null, result);
            } catch (e) {
                result = this._parseError(data);
                adapter.log("parseMessages error:", result);
                callback.call(ctx, result);
            }
        },
        parseDate: function (string) {
            try {
                var date = new Date();
                var parts = string.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
                if (!parts || parts.length === 0) {
                    parts = string.match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/);
                    date.setFullYear(parseInt(parts[3], 10), parseInt(parts[2], 10) - 1, parseInt(parts[1], 10));
                } else {
                    date.setFullYear(parseInt(parts[1], 10), parseInt(parts[2], 10) - 1, parseInt(parts[3], 10));
                }
                date.setHours(parts[4]);
                date.setMinutes(parts[5]);
                date.setSeconds(parts[6]);
                return date.valueOf();
            } catch (e) {
                return new Date(string).valueOf();
            }
        },
        _parseMessages: function (xmlDoc) {
            var list = xml.select("mailbox_list", xmlDoc);
            if (!list) {
                throw new Error("Bad response format");
            }
            var error = xml.select("error", list);
            if (error) {
                throw new Error("Error with code" + xml.getAttr(error, "code"));
            }
            var nodeDetails = xml.select("details", list);
            var details = {};
            var messages = [];
            details.count = parseInt(xml.getAttr(nodeDetails, "msg_count"), 10);
            details.countUnread = parseInt(xml.getAttr(nodeDetails, "unread"), 10);
            details.name = (xml.getAttr(nodeDetails, "name") || "").split("|").pop();
            details.type = xml.getAttr(nodeDetails, "fid") !== undefined ? "folder" : "label";
            details.id = xml.getAttr(nodeDetails, "fid") || xml.getAttr(nodeDetails, "lid");
            details.symbol = xml.getAttr(nodeDetails, "symbol");
            details.page = parseInt(xml.getAttr(nodeDetails, "page_number"), 10) - 1;
            details.unread = !!parseInt(xml.getAttr(nodeDetails, "unread"), 10);
            var nodeMessages = xml.selectAll("message", list);
            var offset = 0;
            for (var i = 0; i < nodeMessages.length; i++) {
                var nodeMessage = nodeMessages[i];
                var number = offset + i;
                var subject = "";
                var attach = 0;
                var firstline = "";
                var from = "";
                var date = null;
                var unread = false;
                var id = null;
                var fid = null;
                try {
                    subject = xml.getText(xml.select("subject", nodeMessage), "text");
                    if (subject === "No subject") {
                        subject = "";
                    }
                    firstline = xml.getText(nodeMessage, "firstline");
                    from = xml.getText(xml.select("from", nodeMessage), "name");
                    if (!from) {
                        from = xml.getText(xml.select("from", nodeMessage), "email");
                    }
                    date = this.parseDate(xml.getAttr(nodeMessage, "recv_date"));
                    fid = xml.getAttr(nodeMessage, "fid");
                    unread = xml.getAttr(nodeMessage, "status") === "New";
                    id = xml.getAttr(nodeMessage, "mid");
                    attach = parseInt(xml.getAttr(nodeMessage, "att_count"), 10);
                } catch (e) {
                    throw new Error("Неверный формат.");
                }
                messages.push({
                    number: number,
                    id: id,
                    from: from,
                    subject: subject,
                    firstline: firstline,
                    unread: unread,
                    date: date,
                    attach: attach,
                    fid: fid
                });
            }
            var data = {
                status: "ok",
                messages: this._filterMessages(messages),
                details: details
            };
            return data;
        },
        _parseError: function (xmlDoc) {
            var authProcedure = xml.select("authProcedure", xmlDoc);
            var data = {
                status: "error",
                errorType: "authorization"
            };
            if (authProcedure) {
                var error = xml.select("error", authProcedure);
                data.code = error ? xml.getAttr(error, "code") : "";
            }
            return data;
        },
        _filterMessages: function (messages) {
            var ignoreFolders = config.IGNORED_FOLDERS;
            var currentUser = yauth.getCurrentUser();
            return messages.filter(function (message) {
                var folder = folders.getFolderById(currentUser.data.folders, message.fid);
                return !folder || ignoreFolders.indexOf(folder.symbol) < 0;
            }.bind(this));
        }
    };
});
define("slice/logic/mail-api", [
    "browser-adapter",
    "api/http",
    "api/xml",
    "slice/logic/config",
    "slice/logic/messages",
    "slice/logic/folders"
], function (adapter, http, xml, config, messages, folders) {
    function API() {
    }
    API.prototype = {
        constructor: API,
        getAllCounters: function (options) {
            return http.GET({
                url: config.URL_COUNTERS_ALL,
                ctx: this,
                responseType: "json",
                callback: this._onGetAllCounters.bind(this, options),
                errback: this._onGetAllCountersError.bind(this, options)
            });
        },
        _onGetAllCounters: function (options, data) {
            var error = data ? data.error : "empty response";
            if (error) {
                adapter.log("MailApi: getAllCounters error: " + error);
                options.callback.call(options.ctx, error);
                return;
            }
            options.callback.call(options.ctx, null, data);
        },
        _onGetAllCountersError: function (options, status, text) {
            adapter.log("MailApi: getAllCounters error: " + status + " " + text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        getMessages: function (options) {
            var url = config.URL_API + "mailbox_list";
            return http.GET({
                url: url,
                ctx: this,
                params: {
                    first: 0,
                    last: config.MESSAGES_TO_LOAD,
                    extra_cond: "only_new",
                    goto: "all",
                    elmt: "mail"
                },
                responseType: "xml",
                callback: this._createRedirectCatcher("getMessages", options, this._onGetMessages.bind(this, options)),
                errback: this._onGetMessagesError.bind(this, options)
            });
        },
        _onGetMessages: function (options, data) {
            messages.parse(data, options.callback, options.ctx);
        },
        _onGetMessagesError: function (options, status, text) {
            adapter.log("MailApi: getMessages error: " + status + " " + text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        getFolders: function (options) {
            var url = config.URL_API + "folder_list";
            return http.GET({
                url: url,
                ctx: this,
                responseType: "xml",
                callback: this._createRedirectCatcher("getFolders", options, this._onGetFolders.bind(this, options)),
                errback: this._onGetFoldersError.bind(this, options)
            });
        },
        _onGetFolders: function (options, data) {
            folders.parse(data, options.callback, options.ctx);
        },
        _onGetFoldersError: function (options, status, text) {
            adapter.log("MailApi: getfolders error: " + status + " " + text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        changeMessageState: function (options) {
            var url = config.URL_API + "mailbox_oper";
            var params = {
                "oper": options.action,
                "ids": [options.message.id]
            };
            if (options.user.data.ckey) {
                params.ckey = options.user.data.ckey;
            }
            return http.POST({
                url: url,
                ctx: this,
                params: params,
                responseType: "xml",
                callback: this._createRedirectCatcher("changeMessageState", options, this._onChangeMessageState.bind(this, options)),
                errback: this._onChangeMessageStateError.bind(this, options)
            });
        },
        _onChangeMessageState: function (options, data) {
            var errorTag = data.getElementsByTagName("error");
            var error = errorTag ? errorTag[0] : null;
            if (!error) {
                options.callback.call(options.ctx);
            } else {
                adapter.log("MailApi: changeMessageState error: " + error);
                options.callback.call(options.ctx, error);
            }
        },
        _onChangeMessageStateError: function (options, status, text) {
            adapter.log("MailApi: changeMessageState error: " + status + " " + text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        getUserSettings: function (options) {
            var url = config.URL_API + "settings_setup";
            return http.GET({
                url: url,
                ctx: this,
                responseType: "xml",
                callback: this._createRedirectCatcher("getUserSettings", options, this._onGetUserSettings.bind(this, options)),
                errback: this._onGetUserSettingsError.bind(this, options)
            });
        },
        _onGetUserSettings: function (options, data) {
            var error;
            try {
                error = xml.select("error", data);
                if (!error) {
                    var body = xml.select("body", data);
                    var email = xml.getText(body, "default_email");
                    var name = xml.getText(body, "from_name");
                    options.callback.call(options.ctx, null, {
                        user: options.user,
                        email: email,
                        name: name
                    });
                }
            } catch (e) {
                error = e;
            }
            if (error) {
                adapter.log("MailApi: getUserSettings error");
                var errorCode = parseInt(xml.getAttr(error, "code"), 10);
                options.callback.call(options.ctx, {
                    status: errorCode,
                    text: ""
                });
            }
        },
        _onGetUserSettingsError: function (options, status, text) {
            adapter.log("MailApi: getUserSettings network error:", status, text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        getAccountInfo: function (options) {
            var url = config.URL_API + "account_information";
            return http.GET({
                url: url,
                ctx: this,
                responseType: "xml",
                callback: this._createRedirectCatcher("getAccountInfo", options, this._onGetAccountInfo.bind(this, options)),
                errback: this._onGetAccountInfoError.bind(this, options)
            });
        },
        _onGetAccountInfo: function (options, data) {
            var error;
            try {
                error = xml.select("error", data);
                if (!error) {
                    var info = xml.select("account_information", data);
                    var ckey = xml.getText(info, "ckey");
                    options.callback.call(options.ctx, null, {
                        user: options.user,
                        ckey: ckey
                    });
                }
            } catch (e) {
                error = e;
            }
            if (error) {
                adapter.log("getAccountInfo error");
                var errorCode = parseInt(xml.getAttr(error, "code"), 10);
                options.callback.call(options.ctx, {
                    status: errorCode,
                    text: ""
                });
            }
        },
        _onGetAccountInfoError: function (options, status, text) {
            adapter.log("getAccountInfo network error, status: %s, text: %s", status, text);
            options.callback.call(options.ctx, {
                status: status,
                text: text
            });
        },
        _createRedirectCatcher: function (methodName, methodOptions, methodCallback) {
            return function (responseData) {
                var requestRedirected = false;
                if (!methodOptions || !methodOptions.noFurtherRedirects) {
                    requestRedirected = this._tryCatchRedirect(responseData, methodName, methodOptions, methodCallback);
                }
                if (!requestRedirected) {
                    methodCallback.call(this, responseData);
                }
            };
        },
        _tryCatchRedirect: function (responseData, methodName, methodOptions, methodCallback) {
            try {
                var redirect = xml.select("redirect", responseData);
                var redirectUrl = xml.getText(redirect, "redirect_to");
                if (redirectUrl) {
                    adapter.log("Catch redirect for method: " + methodName + ", redirect url: " + redirectUrl);
                    this._goToRedirect(redirectUrl, methodName, methodOptions, methodCallback);
                    return true;
                }
            } catch (e) {
                adapter.log("Can not parse response for redirects");
            }
            return false;
        },
        _goToRedirect: function (url, callbackName, callbackOptions, errback) {
            return http.GET({
                url: url,
                ctx: this,
                responseType: "xml",
                callback: function () {
                    if (typeof this[callbackName] === "function") {
                        callbackOptions = callbackOptions || {};
                        callbackOptions.noFurtherRedirects = true;
                        this[callbackName].call(this, callbackOptions);
                    } else {
                        adapter.log("Bad callback for name: " + callbackName);
                    }
                },
                errback: function (status, text) {
                    adapter.log("Error while going to redirect after: " + callbackName);
                    adapter.log("Status: " + status + ", text: " + text);
                    errback(null);
                }
            });
        }
    };
    return API;
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
    "slice/common-logic/notify"
], function (adapter, manager, config, notify) {
    var mailUrl;
    manager.onReady(function () {
        notify.setOptions({
            serviceName: "yamail",
            useMailTemplates: true,
            defaultTitle: adapter.getString("logo"),
            defaultIconUrl: adapter.getSlicePath() + "images/mail_128.png",
            pluralForms: {
                mail: adapter.getString("new-messages-plural"),
                mix: ""
            },
            requestShowPermission: function (callback) {
                var showOption = String(adapter.getOption("showTextAlert"));
                var isWindowVisible = adapter.isWindowVisible();
                if (isWindowVisible || showOption === "false") {
                    adapter.log("Notify: requestShowPermission denied");
                    adapter.log("isWindowVisible: " + isWindowVisible);
                    adapter.log("showOption: " + showOption);
                    callback(false);
                    return;
                }
                adapter.getCurrentTabUrl(function (url) {
                    var canShow = url.indexOf(mailUrl) === -1;
                    adapter.log("Notify: requestShowPermission, active tab check result: " + canShow);
                    callback(canShow);
                });
            }
        });
    });
    return {
        createNotification: function (user, message) {
            adapter.log("Send notification to platform");
            mailUrl = user.getUrl(config.URL_WEB);
            notify.setOptions({ defaultClickUrl: user.getUrl(config.URL_WEB) });
            notify.show({
                type: "mail",
                title: message.from || message.email,
                mainText: ((message.subject || "") + "\n" + (message.firstline || "")).trim(),
                icon: null,
                context: user.getUrl(config.URL_WEB) + "neo2/?" + config.linkParam + "#message/" + message.id
            });
        }
    };
});
(function () {
    var async = {};
    var root, previous_async;
    root = this;
    if (root != null) {
        previous_async = root.async;
    }
    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };
    function only_once(fn) {
        var called = false;
        return function () {
            if (called)
                throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        };
    }
    var _toString = Object.prototype.toString;
    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === "[object Array]";
    };
    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };
    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };
    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };
    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };
    if (typeof process === "undefined" || !process.nextTick) {
        if (typeof setImmediate === "function") {
            async.nextTick = function (fn) {
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        } else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    } else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== "undefined") {
            async.setImmediate = function (fn) {
                setImmediate(fn);
            };
        } else {
            async.setImmediate = async.nextTick;
        }
    }
    async.each = function (arr, iterator, callback) {
        callback = callback || function () {
        };
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done));
        });
        function done(err) {
            if (err) {
                callback(err);
                callback = function () {
                };
            } else {
                completed += 1;
                if (completed >= arr.length) {
                    callback();
                }
            }
        }
    };
    async.forEach = async.each;
    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {
        };
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {
                    };
                } else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    } else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;
    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [
            arr,
            iterator,
            callback
        ]);
    };
    async.forEachLimit = async.eachLimit;
    var _eachLimit = function (limit) {
        return function (arr, iterator, callback) {
            callback = callback || function () {
            };
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;
            (function replenish() {
                if (completed >= arr.length) {
                    return callback();
                }
                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {
                            };
                        } else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            } else {
                                replenish();
                            }
                        }
                    });
                }
            }());
        };
    };
    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function (limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };
    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {
                index: i,
                value: x
            };
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };
    var _mapLimit = function (limit) {
        return doParallelLimit(limit, _asyncMap);
    };
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    async.inject = async.reduce;
    async.foldl = async.reduce;
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    async.foldr = async.reduceRight;
    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {
                index: i,
                value: x
            };
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    async.select = async.filter;
    async.selectSeries = async.filterSeries;
    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {
                index: i,
                value: x
            };
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);
    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {
                    };
                } else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);
    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {
                    };
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    async.any = async.some;
    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {
                    };
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    async.all = async.every;
    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, {
                        value: x,
                        criteria: criteria
                    });
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            } else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };
    async.auto = function (tasks, callback) {
        callback = callback || function () {
        };
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback();
        }
        var results = {};
        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--;
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };
        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                callback = function () {
                };
                theCallback(null, results);
            }
        });
        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k] : [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function (rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    callback = function () {
                    };
                } else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return a && results.hasOwnProperty(x);
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            } else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };
    async.retry = function (times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        if (typeof times === "function") {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function (wrappedCallback, wrappedResults) {
            var retryAttempt = function (task, finalAttempt) {
                return function (seriesCallback) {
                    task(function (err, result) {
                        seriesCallback(!err || finalAttempt, {
                            err: err,
                            result: result
                        });
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times -= 1)));
            }
            async.series(attempts, function (done, data) {
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        };
        return callback ? wrappedTask() : wrappedTask;
    };
    async.waterfall = function (tasks, callback) {
        callback = callback || function () {
        };
        if (!_isArray(tasks)) {
            var err = new Error("First argument to waterfall must be an array of functions");
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {
                    };
                } else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    } else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };
    var _parallel = function (eachfn, tasks, callback) {
        callback = callback || function () {
        };
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        } else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.parallel = function (tasks, callback) {
        _parallel({
            map: async.map,
            each: async.each
        }, tasks, callback);
    };
    async.parallelLimit = function (tasks, limit, callback) {
        _parallel({
            map: _mapLimit(limit),
            each: _eachLimit(limit)
        }, tasks, callback);
    };
    async.series = function (tasks, callback) {
        callback = callback || function () {
        };
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        } else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return index < tasks.length - 1 ? makeCallback(index + 1) : null;
            };
            return fn;
        };
        return makeCallback(0);
    };
    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(null, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);
    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        } else {
            callback();
        }
    };
    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            } else {
                callback();
            }
        });
    };
    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        } else {
            callback();
        }
    };
    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            } else {
                callback();
            }
        });
    };
    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
            if (!q.started) {
                q.started = true;
            }
            if (!_isArray(data)) {
                data = [data];
            }
            if (data.length == 0) {
                return async.setImmediate(function () {
                    if (q.drain) {
                        q.drain();
                    }
                });
            }
            _each(data, function (task) {
                var item = {
                    data: task,
                    callback: typeof callback === "function" ? callback : null
                };
                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }
                if (q.saturated && q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = null;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function () {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) {
                    return;
                }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) {
                    return;
                }
                q.paused = false;
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };
    async.priorityQueue = function (worker, concurrency) {
        function _compareTasks(a, b) {
            return a.priority - b.priority;
        }
        ;
        function _binarySearch(sequence, item, compare) {
            var beg = -1, end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + (end - beg + 1 >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }
        function _insert(q, data, priority, callback) {
            if (!q.started) {
                q.started = true;
            }
            if (!_isArray(data)) {
                data = [data];
            }
            if (data.length == 0) {
                return async.setImmediate(function () {
                    if (q.drain) {
                        q.drain();
                    }
                });
            }
            _each(data, function (task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === "function" ? callback : null
                };
                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);
                if (q.saturated && q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }
        var q = async.queue(worker, concurrency);
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };
        delete q.unshift;
        return q;
    };
    async.cargo = function (worker, payload) {
        var working = false, tasks = [];
        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function (task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === "function" ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working)
                    return;
                if (tasks.length === 0) {
                    if (cargo.drain && !cargo.drained)
                        cargo.drain();
                    cargo.drained = true;
                    return;
                }
                var ts = typeof payload === "number" ? tasks.splice(0, payload) : tasks.splice(0, tasks.length);
                var ds = _map(ts, function (task) {
                    return task.data;
                });
                if (cargo.empty)
                    cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;
                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });
                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };
    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (typeof console !== "undefined") {
                        if (err) {
                            if (console.error) {
                                console.error(err);
                            }
                        } else if (console[name]) {
                            _each(args, function (x) {
                                console[name](x);
                            });
                        }
                    }
                }]));
        };
    };
    async.log = _console_fn("log");
    async.dir = _console_fn("dir");
    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            } else if (key in queues) {
                queues[key].push(callback);
            } else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                        memo[key] = arguments;
                        var q = queues[key];
                        delete queues[key];
                        for (var i = 0, l = q.length; i < l; i++) {
                            q[i].apply(null, arguments);
                        }
                    }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };
    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };
    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };
    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };
    async.seq = function () {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                        var err = arguments[0];
                        var nextargs = Array.prototype.slice.call(arguments, 1);
                        cb(err, nextargs);
                    }]));
            }, function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };
    async.compose = function () {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };
    var _applyEach = function (eachfn, fns) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            }, callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        } else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);
    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = async;
    } else if (typeof define !== "undefined" && define.amd) {
        define("slice/common-libs/async", [], function () {
            return async;
        });
    } else {
        root.async = async;
    }
}());
define("slice/logic/xiva", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "api/xml",
    "slice/logic/folders",
    "slice/logic/messages",
    "slice/logic/config",
    "slice/logic/yauth"
], function (adapter, manager, http, xml, folders, messages, config, auth) {
    var WebSocket;
    var xiva = {
        init: function () {
            if (window.WebSocket) {
                adapter.log("XIVA: use native websockets");
                WebSocket = window.WebSocket;
            } else {
                adapter.log("XIVA: use platform's websockets");
                WebSocket = adapter.getWebSocket();
            }
            if (!WebSocket) {
                adapter.log("XIVA: websockets isn't supported");
            }
        },
        finalize: function () {
            auth.forEach(true, this.disconnect, this);
        },
        observers: {
            "slice:auth:current": function () {
                if (WebSocket) {
                    auth.forEach(false, this.disconnect, this);
                    this.connect(auth.getCurrentUser());
                }
            }
        },
        connect: function (user) {
            if (!user || user.data.xivaConnect) {
                return;
            }
            if (user.data.xivaCredentials) {
                this.openSocket(user);
                return;
            }
            this.getCredentials(user, function (error, data) {
                if (error) {
                    this.reset(user);
                    this.reconnect(user);
                    return;
                }
                user.data.xivaCredentials = data;
                this.openSocket(user);
            }.bind(this));
        },
        reconnect: function (user) {
            if (!user) {
                return;
            }
            this.disconnect(user);
            var timeout = config.XIVA_RECONNECT_TIMEOUT_MS;
            var now = parseInt(new Date());
            var retryAfter = user.data.xivaReconnectTimeout;
            if (retryAfter) {
                if (retryAfter > now) {
                    timeout = retryAfter - now;
                } else {
                    user.data.xivaReconnectTimeout = 0;
                }
            }
            adapter.log("XIVA: reconnect after " + timeout);
            clearTimeout(user.data.xivaReconnectTimeoutId);
            user.data.xivaReconnectTimeoutId = setTimeout(function () {
                this.connect(user);
            }.bind(this), timeout);
        },
        disconnect: function (user) {
            if (!user) {
                return;
            }
            this._closeSocket(user);
            this._clearTimers(user);
        },
        _closeSocket: function (user) {
            if (user.data.xivaConnect) {
                this.removeListenersFromSocket(user.data.xivaConnect, user.data.xivaConnectHandlers);
                user.data.xivaConnect.close();
                delete user.data.xivaConnect;
                delete user.data.xivaConnectHandlers;
                adapter.log("XIVA: socket disconnected for user:" + user.login);
            }
        },
        _clearTimers: function (user) {
            clearTimeout(user.data.xivaReconnectTimeoutId);
            delete user.data.xivaReconnectTimeoutId;
            user.data.xivaReconnectTimeout = 0;
            clearTimeout(user.data.xivaPingReconnectTimeoutId);
            delete user.data.xivaPingReconnectTimeoutId;
        },
        openSocket: function (user) {
            if (!user || user.data.xivaConnect) {
                return;
            }
            var data = user.data.xivaCredentials;
            if (!data) {
                return;
            }
            var url = "wss://xiva-daria.mail.yandex.net/events/websocket/?" + "sign=" + data.sign + "&ts=" + data.ts + "&uid=" + data.uid + "&client_id=bar&service=mail&format=json";
            user.data.xivaConnect = new WebSocket(url);
            user.data.xivaConnectHandlers = {
                "message": this.onSocketMessage.bind(this, user),
                "open": this.onSocketOpen.bind(this, user),
                "close": this.onSocketClose.bind(this, user),
                "error": this.onSocketClose.bind(this, user)
            };
            this.updatePingReconnectTimeout(user);
            this.addListenersToSocket(user.data.xivaConnect, user.data.xivaConnectHandlers);
        },
        updatePingReconnectTimeout: function (user) {
            adapter.log("Xiva: updatePingReconnectTimeout");
            clearTimeout(user.data.xivaPingReconnectTimeoutId);
            user.data.xivaPingReconnectTimeoutId = setTimeout(this.reconnect.bind(this, user), config.XIVA_PING_RECONNECT_TIMEOUT_MS);
        },
        getCredentials: function (user, callback) {
            adapter.getCookie(user.passport, "yandexuid", "/", false, function (cookie) {
                if (!cookie) {
                    callback(true);
                    return;
                }
                http.GET({
                    url: user.getUrl(config.XIVA_CREDENTIALS_URL),
                    params: { req: cookie },
                    callback: function (data) {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            callback(true);
                            return;
                        }
                        if (data && data.sign && data.ts && data.uid && data.timestamp) {
                            data.expire = +new Date() / 1000 + (data.ts - data.timestamp);
                            callback(null, data);
                        } else {
                            callback(true);
                        }
                    },
                    errback: function (status, text) {
                        callback(status, text);
                    }
                });
            }, this);
        },
        reset: function (user) {
            if (user) {
                delete user.data.xivaCredentials;
                delete user.data.xivaReconnectTimeout;
            }
        },
        addListenersToSocket: function (socket, listeners) {
            for (var type in listeners) {
                var handler = listeners[type];
                if (socket.addEventListener) {
                    socket.addEventListener(type, handler, false);
                } else if (socket.attachEvent) {
                    socket.attachEvent("on" + type, handler);
                } else {
                    socket["on" + type] = handler;
                }
            }
        },
        removeListenersFromSocket: function (socket, listeners) {
            for (var type in listeners) {
                var handler = listeners[type];
                if (socket.removeEventListener) {
                    socket.removeEventListener(type, handler, false);
                } else if (socket.detachEvent) {
                    socket.detachEvent("on" + type, handler);
                } else {
                    socket["on" + type] = null;
                }
            }
        },
        onSocketOpen: function (user) {
            adapter.log("XIVA: socketOpen event for user: " + user.login);
        },
        onSocketClose: function (user, event) {
            adapter.log("XIVA: socketClose event for user: " + user.login + ", type: " + event.type + ", code: " + event.code + ", reason: " + event.reason);
            if (event.type == "close") {
                if (event.code == 4000) {
                    var reason = "" + event.reason;
                    var seconds = null;
                    try {
                        seconds = parseInt(reason.match(/^\s*retry\-after\:\s*(\d+)\s*$/i)[1]);
                    } catch (e) {
                    }
                    if (seconds) {
                        var timestamp = parseInt(new Date() + seconds * 1000);
                        user.data.xivaReconnectTimeout = timestamp;
                    }
                } else {
                    this.reset(user);
                }
            }
            this.reconnect(user);
        },
        onSocketMessage: function (user, event) {
            if (!WebSocket) {
                return;
            }
            var receivedData = event.data;
            try {
                receivedData = JSON.parse(receivedData);
            } catch (e) {
                return;
            }
            if (!receivedData) {
                return;
            }
            if (receivedData.Error == "bad sign") {
                this.reset(user);
                this.reconnect(user);
            }
            if (receivedData.operation == "insert") {
                adapter.log("XIVA: socket receivedData with operation: insert");
                var exclude = config.IGNORED_FOLDERS;
                var message = receivedData.message;
                if (message) {
                    var folderId = message.fid;
                    var isNew = message.hdr_status === "New";
                    var folder = folders.getFolderById(folderId);
                    if (isNew && folder && exclude.indexOf(folder.symbol || "") === -1) {
                        var nameMatch = message.hdr_from.match(/^"(.+)"/);
                        var mailMatch = message.hdr_from.match(/<(.+)>$/);
                        var name = nameMatch ? nameMatch[1] : null;
                        var mail = mailMatch ? mailMatch[1] : null;
                        var subject = message.hdr_subject;
                        if (subject === "No subject") {
                            subject = "";
                        }
                        var firstline = message.firstline;
                        var id = message.mid;
                        var date = messages.parseDate(message.received_date);
                        var from = mail;
                        if (name && name !== mail) {
                            from = name;
                        }
                        var notificationData = {
                            uid: user.id,
                            message: {
                                email: mail,
                                from: from,
                                subject: subject || "",
                                firstline: firstline || "",
                                id: id,
                                fid: folderId,
                                date: date
                            }
                        };
                        var isMessagesAdded = user.setMessages([notificationData.message]);
                        if (isMessagesAdded) {
                            this.notify(notificationData);
                        } else {
                            adapter.log("XIVA: new message have been declined as a duplicate");
                        }
                    }
                }
            } else if (receivedData.operation !== "ping") {
                adapter.log("XIVA: socket receivedData with operation: " + receivedData.operation);
                this.notify({ uid: user.id });
            }
            this.updatePingReconnectTimeout(user);
        },
        notify: function (data) {
            adapter.sendMessage("mail:xiva:notify", data);
        }
    };
    manager.onReady(xiva);
    return xiva;
});
define("slice/logic/main", [
    "browser-adapter",
    "api/manager",
    "api/utils",
    "api/stat",
    "slice/logic/config",
    "slice/logic/mail-api",
    "slice/common-logic/timers",
    "slice/logic/yauth",
    "slice/logic/notify",
    "slice/common-libs/async",
    "slice/logic/xiva"
], function (adapter, manager, utils, stat, config, MailApi, timers, auth, notify, async) {
    var NO_AUTH_STATUS = 2001;
    var COUNTER_OPTION_NAME = "allAccountsCounter";
    var yamail = {
        _timer: null,
        _mailApi: null,
        _updateCounterDelayed: null,
        init: function () {
            this._mailApi = new MailApi();
            this._updateCounterDelayed = utils.debounce(this.updateAllCounters.bind(this), 1000);
            this._addListeners();
            this._initPollingTimer();
            adapter.log("Send user:get-all to platform");
            adapter.sendOuterMessage("user:get-all");
        },
        _initPollingTimer: function () {
            this._timer = timers.create(config.UPDATE_TIME_MS, this.handleTimerTick, this);
            this._timer.start();
        },
        _addListeners: function () {
            adapter.addListener("slice:auth:list-updated", this.handleListUpdatedEvent, this);
            adapter.addListener("slice:auth:current", this.handleAuthCurrentEvent, this);
            adapter.addListener("mail:xiva:notify", this.handleXivaNotifyEvent, this);
            adapter.addListener("mail:ui:request", this.handleRequestAllEvent, this);
            adapter.addListener("mail:ui:request-messages", this.handleRequestMessagesEvent, this);
            adapter.addListener("mail:messages:change", this.handleMessageChangeEvent, this);
            adapter.addListener("mail:compose", this.handleComposeEvent, this);
            adapter.addListener("mail:open", this.handleOpenEvent, this);
            adapter.addListener("slice-event-show", this.handleSliceShowEvent, this);
            adapter.addListener("options:change", this.handleOptionChangeEvent, this);
        },
        finalize: function () {
            auth.forEach(true, this.abortRequests, this);
            this._timer.stop();
        },
        handleTimerTick: function () {
            adapter.log("TIMER TICK");
            this.updateAllCounters();
        },
        handleSliceShowEvent: function (topic, data) {
            var statString = data && data.sender === "menu" ? "menu" : "button";
            stat.logWidget(statString);
        },
        handleListUpdatedEvent: function (topic, summary) {
            this.sendUsers();
            if (!summary.currentChanged) {
                adapter.log("update counters in list updated handler");
                this.updateAllCounters();
            }
        },
        handleAuthCurrentEvent: function (topic, data) {
            var old = auth.getUser(data.oldCurrent);
            var current = auth.getUser(data.current);
            if (old) {
                delete old.data.count;
                this.abortRequests(old);
            }
            if (current) {
                this.sendAllCounters();
            }
            this.updateUser(current);
        },
        handleXivaNotifyEvent: function (topic, data) {
            var user = auth.getUser(data.uid);
            if (data.message) {
                adapter.log("New message from xiva");
                this.updateAllCounters();
                this.sendMessages(user);
                notify.createNotification(user, data.message);
            } else {
                adapter.log("New notification from xiva, call updateCounterDelayed");
                this._updateCounterDelayed();
            }
        },
        handleRequestAllEvent: function () {
            var user = auth.getCurrentUser();
            if (!user) {
                this.handleError();
                return;
            }
            adapter.log("mail:ui:request: start update logic for user: " + user.login);
            this.updateUser(user);
            this.sendUsers();
        },
        handleRequestMessagesEvent: function () {
            var user = auth.getCurrentUser();
            adapter.log("mail:ui:request-messages: start fetching messages logic for user: " + user.login);
            this.updateMessages(user);
        },
        handleMessageChangeEvent: function (topic, data) {
            var currentUser = auth.getCurrentUser();
            var isDeleted = currentUser.deleteMessageById(data.message.id);
            if (isDeleted) {
                adapter.log("Change message state - action: " + data.action + " id: " + data.message.id);
                this.sendMessages(currentUser);
                currentUser.data.count = Math.max(0, currentUser.data.count - 1);
                this.sendAllCounters();
                this.changeMessageState(currentUser, data.message, data.action, function () {
                    adapter.log("Change message state success - action: " + data.action + " id: " + data.message.id);
                    this._updateCounterDelayed();
                }.bind(this));
            }
        },
        handleComposeEvent: function (topic, data) {
            var user = auth.getCurrentUser();
            this.compose(user, data);
        },
        handleOpenEvent: function (topic, data) {
            var user = auth.getCurrentUser();
            var params = "?" + config.linkParam;
            if (data && data.message) {
                params = "neo2/" + params + "#message/" + data.message.id + "/";
            }
            adapter.navigate(auth.getUrl(user, config.URL_WEB) + params, "new tab");
        },
        handleOptionChangeEvent: function (topic, data) {
            if (data.name === COUNTER_OPTION_NAME) {
                this.sendAllCounters();
            }
        },
        abortRequests: function (user) {
            if (!user) {
                return;
            }
            var requests = user.requests;
            for (var requestName in requests) {
                if (requests.hasOwnProperty(requestName)) {
                    requests[requestName].abort();
                    delete requests[requestName];
                }
            }
        },
        updateUser: function (user) {
            if (!user) {
                return;
            }
            adapter.sendMessage("mail:loading");
            async.parallel([
                this.getUserCkey.bind(this, user),
                this.updateUserEmail.bind(this, user),
                this.updateAllCounters.bind(this)
            ], function (error) {
                if (error) {
                    return;
                }
                if (!user.data.count) {
                    user.setMessages(null, true);
                    this.sendMessages(user);
                } else if (adapter.isWindowVisible()) {
                    async.series([
                        this.updateFolders.bind(this, user),
                        this.updateMessages.bind(this, user)
                    ]);
                }
            }.bind(this));
        },
        getUserCkey: function (user, callback) {
            if (!user || user.requests.getUserCkey) {
                return;
            }
            user.requests.getUserCkey = this._mailApi.getAccountInfo({
                user: user,
                callback: function (error, data) {
                    delete user.requests.getUserCkey;
                    if (error) {
                        this.handleError(user, error);
                        call(callback, true);
                        return;
                    }
                    if (data.ckey) {
                        adapter.log("Ckey for " + user.login + ": " + data.ckey);
                        user.data.ckey = data.ckey;
                    }
                    call(callback, null);
                },
                ctx: this
            });
        },
        updateUserEmail: function (user, callback) {
            if (!user || user.requests.updateUserEmail) {
                return;
            }
            user.requests.updateUserEmail = this._mailApi.getUserSettings({
                user: user,
                callback: function (error, data) {
                    delete user.requests.updateUserEmail;
                    if (data && data.email) {
                        adapter.log("Default email for " + user.login + " is - " + data.email);
                        this.fixDisplayEmail(data.email);
                        user.data.displayEmail = data.email;
                        this.sendUsers();
                    }
                    call(callback, null);
                },
                ctx: this
            });
        },
        updateAllCounters: function (callback) {
            if (!auth.hasAuth()) {
                call(callback, true);
                return;
            }
            this._mailApi.getAllCounters({
                callback: function (error, data) {
                    if (error) {
                        call(callback, true);
                        this.handleError(null, error);
                        return;
                    }
                    var receivedUids = [];
                    data.forEach(function (chunk) {
                        var counters = chunk.data.counters;
                        var user = null;
                        if (chunk.uid && counters) {
                            receivedUids.push(chunk.uid);
                            user = auth.getUser(chunk.uid);
                            if (user) {
                                user.data.count = counters.unread;
                            }
                        }
                    });
                    auth.forEach(true, function (user) {
                        if (receivedUids.indexOf(user.id) === -1) {
                            user.data.count = 0;
                        }
                    });
                    this.sendAllCounters();
                    this.sendUsers();
                    call(callback, null);
                },
                ctx: this
            });
        },
        updateFolders: function (user, callback) {
            if (!user || user.requests.updateFolders) {
                return;
            }
            user.requests.updateFolders = this._mailApi.getFolders({
                user: user,
                callback: function (error, data) {
                    delete user.requests.updateFolders;
                    if (error) {
                        call(callback, true);
                        this.handleError(user, error);
                        return;
                    }
                    user.data.folders = data;
                    adapter.sendMessage("mail:folders", data);
                    call(callback, null);
                },
                ctx: this
            });
        },
        updateMessages: function (user, callback) {
            if (!user || user.requests.updateMessages) {
                return;
            }
            user.requests.updateMessages = this._mailApi.getMessages({
                user: user,
                callback: function (error, data) {
                    delete user.requests.updateMessages;
                    if (error) {
                        this.handleError(user, error);
                        call(callback, true);
                        return;
                    }
                    user.setMessages(data.messages, true);
                    this.sendMessages(user);
                    adapter.log("updateMessages: new messages for user: " + user.login);
                    call(callback, null);
                },
                ctx: this
            });
        },
        changeMessageState: function (user, message, action, callback) {
            if (!user) {
                return;
            }
            user.requests.changeMessageState = this._mailApi.changeMessageState({
                user: user,
                message: message,
                action: action,
                callback: function (error) {
                    delete user.requests.changeMessageState;
                    if (error) {
                        call(callback, true);
                        this.handleMessageStateError(this, user, message);
                        return;
                    }
                    user.deleteMessageById(message.id);
                    this.sendMessages(user);
                    call(callback, null);
                },
                ctx: this
            });
        },
        compose: function (user, data) {
            var messageId;
            if (data && data.message) {
                messageId = data.message.id;
            }
            adapter.navigate(auth.getUrl(user, config.URL_WEB) + "neo2/?" + config.linkParam + "#compose" + (messageId ? "/oper=reply&ids=" + messageId : ""), "new tab");
        },
        sendAllCounters: function () {
            var allUsersCounter = this._getAllUsersCounter();
            var currentCount = this._getCurrentUserCounter();
            var isSendAllCounter = adapter.getOption(COUNTER_OPTION_NAME);
            adapter.sendOuterMessage("mail:data", { count: isSendAllCounter ? allUsersCounter : currentCount });
            adapter.sendMessage("mail:counter", {
                currentUserCount: currentCount,
                count: allUsersCounter || 0
            });
        },
        _getCurrentUserCounter: function () {
            var currentUser = auth.getCurrentUser();
            if (currentUser) {
                return currentUser.data.count || 0;
            } else {
                return 0;
            }
        },
        _getAllUsersCounter: function () {
            var counter = 0;
            auth.forEach(true, function (user) {
                counter += user.data.count || 0;
            }, this);
            return counter;
        },
        sendUsers: function () {
            var users = [];
            auth.forEach(false, function (user) {
                users.push({
                    id: user.id,
                    email: user.data.displayEmail || user.email,
                    isCurrent: user.isCurrent,
                    authorized: user.authorized,
                    count: user.data.count || 0
                });
            }, this);
            adapter.sendMessage("mail:users", users);
        },
        sendMessages: function (user) {
            adapter.sendMessage("mail:messages", {
                messages: user.data.messages,
                count: user.data.count
            });
        },
        handleError: function (user, error) {
            error = error || {};
            if (error.status === NO_AUTH_STATUS && user) {
                user.data.count = 0;
                this.sendAllCounters();
                this.sendUsers();
            }
            adapter.sendMessage("mail:error", {
                status: error.status,
                text: error.text
            });
        },
        handleMessageStateError: function (user, message) {
            user.setMessages([message]);
            this.sendMessages(user);
            this.updateAllCounters();
        },
        fixDisplayEmail: function (email) {
            auth.forEach(false, function (user) {
                if (user.data.displayEmail === email) {
                    delete user.data.displayEmail;
                }
            }, this);
        }
    };
    function call(fn, arg) {
        if (fn) {
            fn(arg);
        }
    }
    manager.onReady(yamail);
    return yamail;
});
