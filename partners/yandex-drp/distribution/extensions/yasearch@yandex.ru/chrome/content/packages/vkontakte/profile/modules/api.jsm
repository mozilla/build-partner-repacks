EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var DEBUG = false;
    function log(str) {
        common.log("[API]: " + str);
    }
    function logr(str) {
        common.logr("[API]: " + str);
    }
    function logObj(obj, str) {
        common.logObj(obj, "[API]: " + str);
    }
    const API_ROOT = "https://api.vk.com/method/";
    const API_VERSION = "5.21";
    const MAX_ERROR_COUNT = 3;
    function now() {
        return Math.floor(Date.now() / 1000);
    }
    var userCache = {
        INTERVAL: 60 * 60 * 1000,
        _map: {},
        _req: {},
        onuser: null,
        apply: function (arr, idField) {
            if (!arr || !idField) {
                return;
            }
            for (var i = 0; i < arr.length; ++i) {
                var user = arr[i];
                if (this.onuser) {
                    this.onuser(user);
                }
                user._expireTime = Date.now() + this.INTERVAL;
                var id = user[idField];
                this._map[id] = user;
                var req = this._req[id];
                if (req) {
                    for (var j = 0; j < req.length; ++j) {
                        req[j]._profile = user;
                    }
                    delete this._req[id];
                }
            }
        },
        request: function (uid, item) {
            if (!uid || !item) {
                return item;
            }
            var user = this._map[uid];
            if (user && user._expireTime < Date.now()) {
                user = null;
                delete this._map[uid];
            }
            if (user) {
                item._profile = user;
            } else {
                this._req[uid] = this._req[uid] || [];
                this._req[uid].push(item);
            }
            return item;
        },
        getReqIds: function () {
            return Object.keys(this._req);
        },
        clear: function (withReq) {
            this._map = {};
            if (withReq) {
                this._req = {};
            }
        }
    };
    var msgReloader = {
        INTERVAL: 15000,
        timer: null,
        request: function () {
            this.cancel();
            log("msgReloader request");
            this.timer = common.timers.setTimeout(function () {
                log("msgReloader timer callback");
                this.timer = null;
                VK.update(false, true);
            }, this.INTERVAL, this);
        },
        cancel: function () {
            if (this.timer) {
                log("msgReloader cancel");
                this.timer.cancel();
                this.timer = null;
            }
        }
    };
    var VK = {
        userData: {
            counterIds: [
                "messages",
                "friends"
            ],
            me: {},
            notifyData: {},
            counters: {},
            expired: false,
            error: null,
            getValue: function (name) {
                return this.expired ? null : this[name];
            },
            getCounter: function (name) {
                return this.expired ? 0 : this.counters[name];
            },
            clearError: function () {
                this.expired = false;
                this.error = null;
                this._errorCount = 0;
            },
            setError: function (st, text, force) {
                this.error = {
                    status: st,
                    text: text
                };
                this._errorCount = force ? MAX_ERROR_COUNT : (this._errorCount || 0) + 1;
                this.expired = this._errorCount >= MAX_ERROR_COUNT;
            },
            clearData: function () {
                this.counters = {};
                this.messages = null;
                this.friends = null;
            }
        },
        updating: false,
        _callbacks: null,
        _timeDiff: 0,
        _msgUpdateTime: 0,
        init: function (callbacks) {
            this._callbacks = callbacks;
            userCache.INTERVAL = 60 * 60 * 1000;
            userCache.onuser = this._handleUser;
            this._stor = common.storage("notify.json");
            this._stor.time = this._stor.time || {};
        },
        finalize: function () {
            this.stopLongPoll();
        },
        setCredentials: function (appCred, userCred) {
            this.keys = common.utils.copy(appCred, common.utils.copy(userCred));
            this.userData.me = { id: userCred.user_id };
            this.userData.clearData();
            this.userData.clearError();
            this._ts = this._stor.time[userCred.user_id] = this._stor.time[userCred.user_id] || { exists: false };
            var currtime = this.vkNow();
            this._ts.all = Math.max(this._ts.all || 0, currtime - 12 * 60 * 60);
            this._ts.msg = Math.max(this._ts.msg || 0, currtime - 90 * 60);
            this._msgUpdateTime = 0;
        },
        logout: function () {
            this._ts = null;
        },
        vkNow: function () {
            return now() - this._timeDiff;
        },
        saveTS: function (all, msg) {
            if (!this._ts) {
                return;
            }
            this._ts.exists = true;
            var currtime = this.vkNow();
            this._ts.all = all === true ? currtime : all || this._ts.all;
            this._ts.msg = msg === true ? currtime : msg || this._ts.msg;
            this._stor.save();
        },
        _handleRequestError: function (requestError, errback) {
            errback.call(this, 400, requestError.error_code == 5 ? "token" : "error" + requestError.error_code);
        },
        _ajax: function (method, data, callback, errback, resetTimeDiff) {
            log("VK.SendRequest: " + method);
            data = data || {};
            data.access_token = this.keys.access_token;
            data.v = API_VERSION;
            var starttime = resetTimeDiff ? Date.now() : 0;
            return common.http.GET({
                url: API_ROOT + method,
                scope: this,
                responseType: "json",
                background: true,
                params: data,
                callback: function (data, xhr) {
                    if (resetTimeDiff) {
                        var serverTime = new Date(xhr.getResponseHeader("Date"));
                        this._timeDiff = Math.round(((starttime + Date.now()) / 2 - serverTime.valueOf()) / 1000);
                        log("this._timeDiff = " + this._timeDiff);
                    }
                    if (data.error) {
                        this._handleRequestError(data.error, errback);
                    } else {
                        callback.call(this, data.response);
                    }
                },
                errback: errback
            });
        },
        _clearNotifyData: function () {
            this.userData.notifyData = {};
        },
        _addNotify: function (type, obj, append) {
            log("_addNotify " + type + " " + append);
            obj.my_id = this.userData.me.id;
            this.userData.notifyData[type] = this.userData.notifyData[type] || [];
            this.userData.notifyData[type][append ? "push" : "unshift"](obj);
        },
        _handleUser: function (user) {
            user.name = [
                user.first_name,
                user.last_name
            ].join(" ");
            user.photo50 = user.photo_50 || user.photo;
            user.url = app.getAppUrl("user", user.id);
            return user;
        },
        _handleGroup: function (group) {
            group.photo50 = group.photo_50 || group.photo;
            group.url = app.getAppUrl("club", group.id);
            return group;
        },
        _findDialogIndex: function (tid) {
            if (this.userData.messages) {
                for (var i = 0; i < this.userData.messages.length; ++i) {
                    if (this.userData.messages[i]._tid == tid) {
                        return i;
                    }
                }
            }
            return -1;
        },
        _getProfiles: function (callback) {
            var keys = userCache.getReqIds();
            if (keys.length) {
                log("_getProfiles: load " + keys.length + " profile(s)");
                this._ajax("users.get", {
                    fields: "online,photo_50,sex",
                    user_ids: keys.join(",")
                }, function (data) {
                    userCache.apply(data, "id");
                    callback.call(this);
                }, callback);
            } else {
                log("_getProfiles: no profiles for load");
                callback.call(this);
            }
        },
        _formatDlgMsg: function (msg, title, body) {
            title = title || msg.title;
            body = body || msg.body;
            msg._body = body;
            msg.body = !body || msg.emoji ? "" : body;
            msg.title = !title || /^\s*\.{3}\s*$/.test(title) ? "" : title;
        },
        _calcTid: function (idOrMsg) {
            if (!idOrMsg) {
                return "";
            }
            if (idOrMsg.chat_id) {
                return "c" + idOrMsg.chat_id;
            }
            if (idOrMsg.user_id) {
                return idOrMsg.user_id.toString();
            }
            if (typeof idOrMsg == "number") {
                return idOrMsg > 2000000000 ? "c" + (idOrMsg - 2000000000) : idOrMsg.toString();
            }
            return idOrMsg;
        },
        _getDialogs: function (callback, errback) {
            return this._ajax("messages.getDialogs", {
                count: 25,
                unread: 0
            }, function (data) {
                this.userData.counters.messages = data.unread_dialogs;
                if (data.items) {
                    var dialogs = [];
                    for (var i = 0; i < data.items.length; ++i) {
                        var item = data.items[i];
                        if (item.unread && item.message) {
                            dialogs.push(item);
                            this._formatDlgMsg(item.message);
                            item._tid = this._calcTid(item.message);
                            userCache.request(item.message.user_id, item.message);
                        }
                    }
                    this.userData.messages = dialogs;
                }
                this._msgUpdateTime = Date.now();
                callback.call(this);
            }, errback);
        },
        _getFriends: function (callback, errback) {
            return this._ajax("friends.getRequests", {}, function (data) {
                logObj(data, "friends.getRequests: ");
                this.userData.counters.friends = data.count;
                if (data.count) {
                    var uids = data.items, friends = [];
                    for (var i = 0; i < uids.length; ++i) {
                        friends.push(userCache.request(uids[i], { user_id: uids[i] }));
                    }
                    this.userData.friends = friends;
                }
                callback.call(this);
            }, errback, true);
        },
        _notifTypeFunc: {
            follow: function (item, userMap) {
                for (var i = 0; i < item.feedback.length; ++i) {
                    var fb = item.feedback[i];
                    this._addNotify("follow", { _profile: userMap[fb.from_id || fb.owner_id] });
                }
            },
            wall: function (item, userMap) {
                var fb = item.feedback;
                this._addNotify(item.type, {
                    _profile: userMap[fb.from_id || fb.owner_id],
                    type: item.type,
                    text: fb.text
                });
            },
            mention: "wall",
            _cmt: function (item, userMap) {
                var fb = item.feedback;
                var text = fb.text;
                if (text && item.type == "comment_post") {
                    text = text.replace(/^\[[0-9a-z_-]+\|(.+?)\]/i, "$1");
                }
                var groupType = item.type == "reply_topic" ? item.type : item.type == "mention_comments" ? "mention" : "comment";
                this._addNotify(groupType, {
                    _profile: userMap[fb.from_id || fb.owner_id],
                    parent: item.parent,
                    type: item.type,
                    text: text
                });
            },
            comment_post: "_cmt",
            comment_photo: "_cmt",
            comment_video: "_cmt",
            reply_comment: "_cmt",
            reply_topic: "_cmt",
            reply_comment_photo: "_cmt",
            reply_comment_video: "_cmt",
            mention_comments: "_cmt",
            mention_comment_photo: "_cmt",
            mention_comment_video: "_cmt"
        },
        _getNotifications: function () {
            var getNotifications = function () {
                var lastTime = this._ts.msg;
                var newLastTimeMsg = lastTime;
                if (this.userData.messages && this.userData.messages.length) {
                    for (var i = 0; i < this.userData.messages.length; ++i) {
                        var msg = this.userData.messages[i];
                        if (msg.message.date > lastTime) {
                            this._addNotify("message", msg);
                            if (msg.message.date > newLastTimeMsg) {
                                newLastTimeMsg = msg.message.date;
                            }
                        }
                    }
                }
                this.saveTS(null, newLastTimeMsg);
                lastTime = this._ts.all;
                var newLastTimeAll = lastTime;
                this._ajax("notifications.get", { start_time: lastTime }, function (data) {
                    logObj(data, "notifications.get: ");
                    var i, userMap = {};
                    for (i = 0; i < data.profiles.length; ++i) {
                        userMap[data.profiles[i].id] = this._handleUser(data.profiles[i]);
                    }
                    for (i = 0; i < data.groups.length; ++i) {
                        userMap[-data.groups[i].id] = this._handleGroup(data.groups[i]);
                    }
                    for (i = 0; i < data.items.length; ++i) {
                        var item = data.items[i];
                        var func = common.utils.getValue(this._notifTypeFunc, item.type);
                        if (func) {
                            if (item.date > newLastTimeAll) {
                                newLastTimeAll = item.date;
                            }
                            func.call(this, item, userMap);
                        }
                    }
                    this.saveTS(newLastTimeAll + 1, null);
                    this._callbacks.onNotify();
                    this._clearNotifyData();
                }, function (st, text) {
                    logr("_getNotifications error: " + st + " " + text);
                });
            };
            if (this._callbacks.onNeedNotify() && this._ts.exists) {
                getNotifications.call(this);
            } else {
                this.saveTS(true, true);
            }
        },
        update: function (force, onlyMsg) {
            if (this.updating) {
                return;
            }
            this.updating = true;
            msgReloader.cancel();
            var reqMsg = null;
            var reqFrnd = null;
            var uidsNotReady = onlyMsg ? 1 : 2;
            var getProfiles = function () {
                if (!--uidsNotReady) {
                    this.userData.clearError();
                    this.startLongPoll();
                    userCache.request(this.userData.me.id, this.userData.me);
                    this._getProfiles(function () {
                        this.updating = false;
                        this._callbacks.onUpdate();
                        this._getNotifications();
                    });
                }
            };
            var errback = function (st, text) {
                if (this.updating) {
                    this.updating = false;
                    if (reqMsg) {
                        reqMsg.abort();
                    }
                    if (reqFrnd) {
                        reqFrnd.abort();
                    }
                    this.userData.setError(st, text, force);
                    this._callbacks.onUpdateError(st, text);
                }
            };
            reqMsg = this._getDialogs(getProfiles, errback);
            if (!onlyMsg) {
                reqFrnd = this._getFriends(getProfiles, errback);
            }
        },
        _longPollData: {
            request: null,
            startTime: 0,
            intervalMin: DEBUG ? 1000 : 27,
            clear: function () {
                this.key = "";
                this.server = "";
                this.ts = 0;
                if (this.request) {
                    this.request.abort();
                    this.request = null;
                }
            },
            fnCallback: function (data) {
                logObj(data, "long poll response:");
                this._longPollData.request = null;
                if (data.failed == 2) {
                    this._longPollData.clear();
                } else {
                    if (data.ts) {
                        this._longPollData.ts = data.ts;
                    }
                    if (data.updates && data.updates.length) {
                        var msg, idx, tid, i;
                        var tsMsg = this._ts.msg;
                        var polledMsgsTime = this._msgUpdateTime;
                        var deletedDialogs = {};
                        var changedMsg = false;
                        var deleteMsgDetect = false;
                        for (i = 0; i < data.updates.length; ++i) {
                            msg = data.updates[i];
                            if (msg[0] == 6) {
                                tid = this._calcTid(msg[1]);
                                deletedDialogs[tid] = true;
                                idx = this._findDialogIndex(tid);
                                if (idx >= 0) {
                                    this.userData.messages.splice(idx, 1);
                                    changedMsg = true;
                                }
                            }
                            if (msg[0] == 80) {
                                if (this.userData.counters.messages != msg[1]) {
                                    this.userData.counters.messages = msg[1];
                                    changedMsg = true;
                                }
                            }
                            if (msg[0] == 2) {
                                if (msg[2] & 128) {
                                    deleteMsgDetect = true;
                                }
                            }
                        }
                        if (deleteMsgDetect) {
                            msgReloader.request();
                        }
                        for (i = 0; i < data.updates.length; ++i) {
                            msg = data.updates[i];
                            if (msg[0] == 4) {
                                if ((msg[2] & 3) == 1 && msg[4] > this._ts.msg) {
                                    tsMsg = Math.max(tsMsg, msg[4]);
                                    tid = this._calcTid(msg[3]);
                                    if (!deletedDialogs[tid]) {
                                        log("addNotify long poll msg");
                                        var uid = msg[7] ? msg[7].from || msg[3] : msg[3];
                                        var newDlg = {
                                            unread: 1,
                                            _tid: tid,
                                            message: userCache.request(uid, {
                                                id: msg[1],
                                                user_id: uid,
                                                emoji: msg[7].emoji
                                            })
                                        };
                                        this._formatDlgMsg(newDlg.message, msg[5], msg[6]);
                                        this._addNotify("message", newDlg, true);
                                        this.userData.messages = this.userData.messages || [];
                                        idx = this._findDialogIndex(tid);
                                        if (idx < 0) {
                                            log("insert at pos 0");
                                            this.userData.messages.unshift(newDlg);
                                        } else {
                                            log("update dlg last message");
                                            var dlg = this.userData.messages[idx];
                                            dlg.unread++;
                                            dlg.message = newDlg.message;
                                            if (idx > 0) {
                                                this.userData.messages.splice(idx, 1);
                                                this.userData.messages.unshift(dlg);
                                            }
                                        }
                                        changedMsg = true;
                                    }
                                }
                            }
                        }
                        if (changedMsg) {
                            this._getProfiles(function () {
                                if (this._msgUpdateTime > polledMsgsTime) {
                                    log("this._msgUpdateTime > polledMsgsTime");
                                    changedMsg = false;
                                }
                                if (changedMsg) {
                                    this._callbacks.onChangeMsgList();
                                }
                                this._callbacks.onNotify();
                                this._clearNotifyData();
                            });
                        }
                        if (tsMsg > this._ts.msg) {
                            this.saveTS(null, tsMsg);
                        }
                    }
                }
                this.startLongPoll();
            },
            fnCallbackKeys: function (data) {
                logObj(data, "getLongPollServer data:");
                this._longPollData.request = null;
                this._longPollData.key = data.key;
                this._longPollData.server = "https://" + data.server;
                this._longPollData.ts = data.ts;
                this.startLongPoll();
            },
            fnErrback: function (status, text) {
                if (text != "restart") {
                    this._longPollData.request = null;
                }
            }
        },
        startLongPoll: function () {
            if (this._longPollData.request) {
                if (this._longPollData.startTime + (this._longPollData.intervalMin + 20) * 1000 < Date.now()) {
                    this._longPollData.request.abort("restart");
                    this._longPollData.request = null;
                } else {
                    return;
                }
            }
            if (!this._longPollData.key) {
                log("request longPoll Data");
                this._longPollData.request = this._ajax("messages.getLongPollServer", {
                    use_ssl: 1,
                    mode: 2
                }, this._longPollData.fnCallbackKeys, this._longPollData.fnErrback);
            } else {
                log("start long poll");
                this._longPollData.request = common.http.GET({
                    url: this._longPollData.server,
                    scope: this,
                    params: {
                        act: "a_check",
                        key: this._longPollData.key,
                        ts: this._longPollData.ts,
                        wait: this._longPollData.intervalMin,
                        mode: 2
                    },
                    responseType: "json",
                    callback: this._longPollData.fnCallback,
                    errback: this._longPollData.fnErrback
                });
                this._longPollData.startTime = Date.now();
            }
        },
        stopLongPoll: function () {
            this._longPollData.clear();
        }
    };
    return VK;
};
