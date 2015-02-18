EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        common.log("[API]: " + str);
    }
    function logObj(obj, str) {
        common.logObj(obj, "[API]: " + (str || ""));
    }
    function logr(str) {
        common.logr("[API]: " + str);
    }
    var API_URL = "http://api.ok.ru/fb.do";
    function currMD() {
        var currd = new Date();
        return currd.getDate() + currd.getMonth() * 100;
    }
    function cmpDate(a, b) {
        return a.sortdate > b.sortdate ? 1 : a.sortdate < b.sortdate ? -1 : 0;
    }
    function filterProfile(a) {
        return !!a._profile;
    }
    var userCache = {
        INTERVAL: 180 * 60 * 1000,
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
    return {
        _stor: null,
        userData: {},
        updating: false,
        updatingNotif: false,
        _timeDiff: 0,
        _observer: null,
        init: function (observer, bds) {
            this._observer = observer;
            this._stor = common.storage("last.json");
            this._needBds = bds;
        },
        setCredentials: function (appCred, userCred) {
            logObj(userCred);
            this.keys = common.utils.copy(appCred, common.utils.copy(userCred));
        },
        okNow: function () {
            return Date.now() - this._timeDiff;
        },
        _getTS: function () {
            var ts = this._stor.def || 0;
            return ts ? Math.max(ts, this.okNow() - 12 * 60 * 60 * 1000) : 0;
        },
        _saveTS: function (val) {
            this._stor.save("def", val);
        },
        _errorCodesUnauth: [
            102,
            103,
            457
        ],
        _ajax: function (method, data, callback, errback, getTimeDiff) {
            data = data || {};
            data.application_key = this.keys.app_key;
            data.format = "json";
            data.method = method;
            var paramsSign = common.utils.obj2UrlParams(data, false).replace(/&/g, "");
            data.sig = common.strUtils.md5(paramsSign + common.strUtils.md5(this.keys.access_token + this.keys.client_secret));
            data.access_token = this.keys.access_token;
            var paramsPost = common.utils.obj2UrlParams(data, false);
            return common.http.POST({
                url: API_URL,
                scope: this,
                responseType: "json",
                getTimeDiff: getTimeDiff,
                params: paramsPost,
                callback: function (data, xhr, status, tdiff) {
                    if (tdiff != null) {
                        this._timeDiff = tdiff || 0;
                    }
                    if (data.error_code) {
                        if (this._errorCodesUnauth.indexOf(Number(data.error_code)) < 0) {
                            errback.call(this, 400, "Bad Request");
                        } else {
                            errback.call(this, 401, "Unauthorized");
                        }
                    } else {
                        callback.apply(this, arguments);
                    }
                },
                errback: errback
            });
        },
        clearData: function (force) {
            this.userData.counters = {};
            this.userData.conversations = null;
            this.userData.discussions = null;
            if (force || this.userData.bd && currMD() != this.userData.bd_created) {
                this.userData.bd = null;
                this.userData.bd_created = null;
            }
            if (force) {
                userCache.clear();
            }
        },
        _convertDate: function (str) {
            var n = str.split("-");
            var now = new Date();
            var age = now.getFullYear() - Number(n[0]);
            var month = Number(n[1]);
            var day = Number(n[2]);
            return {
                "day": day,
                "month": month,
                "age": age
            };
        },
        _getEvents: function (callback, errback) {
            log("_getEvents");
            return this._ajax("events.get", { types: "MESSAGES,CHATS,GUESTS,MARKS,NOTIFICATIONS,ACTIVITIES,DISCUSSIONS,APP_EVENTS" }, function (events) {
                log("this._timeDiff = " + this._timeDiff);
                if (events) {
                    var uid = 0;
                    for (var i in events) {
                        var event = events[i];
                        if (event) {
                            if (event.type && typeof event.number == "number") {
                                this.userData.counters[event.type] = event.number;
                            }
                            uid = uid || event.uid;
                        }
                    }
                    this.userData.uid = uid || this.userData.uid;
                    logObj(this.userData.counters, "_getEvents: this.userData.counters");
                    callback.call(this);
                }
            }, errback, true);
        },
        _getProfiles: function (callback) {
            var keys = userCache.getReqIds();
            if (keys.length) {
                log("_getProfiles: load " + keys.length + " profile(s)");
                this._ajax("users.getInfo", {
                    fields: "uid,name,first_name,last_name,gender,url_profile,pic50x50",
                    uids: keys.join(",")
                }, function (arr) {
                    logObj(arr, "users.getInfo: ");
                    userCache.apply(arr, "uid");
                    callback.call(this);
                }, callback);
            } else {
                log("_getProfiles: no profiles for load");
                callback.call(this);
            }
        },
        _getBirthdays: function (callback) {
            log("_getBirthdays");
            return this._ajax("friends.getBirthdays", { future: false }, function (arr) {
                function sortFunc(a, b) {
                    return a.sortParam == b.sortParam ? 0 : a.sortParam > b.sortParam ? 1 : -1;
                }
                arr = arr || [];
                for (var i = 0; i < arr.length; ++i) {
                    arr[i].sortParam = arr[i].date;
                    arr[i].date = this._convertDate(arr[i].date);
                    arr[i].hd = true;
                    userCache.request(arr[i].uid, arr[i]);
                }
                arr.sort(sortFunc);
                this.userData.bd = arr;
                this.userData.bd_created = currMD();
                callback.call(this);
            }, callback);
        },
        _getConversations: function (callback) {
            log("_getConversations");
            return this._ajax("messagesV2.getList", {
                fields: "conversation.id,conversation.type,conversation.topic,conversation.last_msg_time_ms,conversation.new_msgs_count,conversation.last_msg_text,conversation.last_author_id,conversation.participant",
                count: 100
            }, function (data) {
                var i, j, conversations = [];
                for (i = 0; i < data.conversation.length; ++i) {
                    var conv = data.conversation[i];
                    if (conv.new_msgs_count > 0) {
                        if (conv.type == "CHAT") {
                            if (!conv.topic) {
                                for (j = 0; j < conv.participant.length && j < 15; ++j) {
                                    var part = conv.participant[j];
                                    if (part.id != this.userData.uid) {
                                        userCache.request(part.id, part);
                                    }
                                }
                            }
                        } else {
                            userCache.request(conv.last_author_id, conv);
                        }
                        conversations.push(conv);
                    }
                }
                logObj(conversations, "conversations = ");
                this.userData.conversations = conversations;
                this.userData.counters.messages = conversations.length;
                callback.call(this);
            }, callback);
        },
        _getDiscussions: function (callback) {
            log("_getDiscussions");
            return this._ajax("discussions.getList", { fields: "discussion.object_type,discussion.object_id,discussion.new_comments_count,discussion.last_activity_date_ms" }, function (data) {
                this.userData.discussions = (data.discussions || []).filter(function (a) {
                    return a.new_comments_count > 0;
                });
                this.userData.counters.discussions = this.userData.discussions.length;
                logObj(this.userData.discussions, "discussions.getList response:");
                callback.call(this);
            }, callback);
        },
        _updateNotificationData: function () {
            var newTs = this.okNow();
            if (this.updatingNotif || this._observer.onNeedNotify && !this._observer.onNeedNotify()) {
                this._saveTS(newTs);
                return;
            }
            var ts = this._getTS();
            log("updateNotificationData: last time = " + ts);
            if (!ts) {
                log("first start");
                this._saveTS(newTs);
                return;
            }
            this.updatingNotif = true;
            var self = this, msgs = [], comments = [];
            function getMsgsPI(callback) {
                var conv = this;
                self._ajax("messagesV2.getMessages", {
                    cnv_id: conv.id,
                    fields: "message.id,message.type,message.author_id,message.date_ms,message.text,message.attachments",
                    count: Math.min(20, conv.new_msgs_count)
                }, function (data) {
                    logObj(data, "messagesV2.getMessages result:");
                    for (var i = 0; i < data.message.length; ++i) {
                        var msg = data.message[i];
                        if (msg.date_ms > ts) {
                            msg.sortdate = msg.date_ms;
                            msg.text = msg.text.replace(/{user:\d+}(.+?){user}/g, "$1");
                            msgs.push(userCache.request(msg.author_id, msg));
                            if (msg.date_ms > newTs) {
                                newTs = msg.date_ms;
                            }
                        }
                    }
                    callback();
                }, function (st, stt) {
                    log("getMsgsPI error: " + st + " " + stt);
                    callback();
                });
            }
            function getCommentsPI(callback) {
                var disc = this;
                self._ajax("discussions.getComments", {
                    discussionType: disc.object_type,
                    discussionId: disc.object_id,
                    fields: "comment.date_ms,comment.text,comment.author_id,comment.id",
                    count: disc.new_comments_count
                }, function (data) {
                    logObj(data, "getComments data:");
                    if (data.comments) {
                        for (var i = 0; i < data.comments.length; ++i) {
                            var cm = data.comments[i];
                            if (cm.date_ms > ts) {
                                cm.discussionId = data.discussionId;
                                cm.discussionType = data.discussionType;
                                cm.object_id = disc.object_id;
                                cm.sortdate = cm.date_ms;
                                comments.push(userCache.request(cm.author_id, cm));
                                if (cm.date_ms > newTs) {
                                    newTs = cm.date_ms;
                                }
                            }
                        }
                    }
                    callback();
                }, callback);
            }
            var arrFuncs = [];
            if (this.userData.conversations) {
                for (var i = 0; i < this.userData.conversations.length; ++i) {
                    var conv = this.userData.conversations[i];
                    if (conv.last_msg_time_ms > ts) {
                        arrFuncs.push(getMsgsPI.bind(conv));
                    }
                }
            }
            if (this.userData.discussions) {
                for (var i = 0; i < this.userData.discussions.length; ++i) {
                    var dis = this.userData.discussions[i];
                    if (dis.last_activity_date_ms > ts) {
                        arrFuncs.push(getCommentsPI.bind(dis));
                    }
                }
            }
            log("common.async.parallel(arrFuncs, end, this);");
            common.async.parallel(arrFuncs, function () {
                this._saveTS(newTs);
                this._getProfiles(function () {
                    this.userData.notifyData = {
                        messages: msgs.sort(cmpDate),
                        comments: comments.filter(filterProfile).sort(cmpDate)
                    };
                    logObj(this.userData.notifyData, "this.userData.notifyData:");
                    this.updatingNotif = false;
                    this._observer.onNotify();
                });
            }, this);
        },
        update: function (force) {
            if (this.updating) {
                return;
            }
            logr("begin update");
            this.updating = true;
            this.clearData(force);
            var uidsNotReady = 3;
            var getIdsInfo = function () {
                if (!--uidsNotReady) {
                    this.userData.counters.bd = this.userData.bd ? this.userData.bd.length : 0;
                    this._getProfiles(function () {
                        this.updating = false;
                        this._updateNotificationData();
                        logObj(this.userData, "this.userData = ");
                        this._observer.onUpdate();
                    });
                }
            };
            var bdReq = !this.userData.bd && this._needBds ? this._getBirthdays(getIdsInfo) : getIdsInfo.call(this);
            this._getEvents(function () {
                this.userData.counters.messages || this.userData.counters.chats ? this._getConversations(getIdsInfo) : getIdsInfo.call(this);
                this.userData.counters.discussions ? this._getDiscussions(getIdsInfo) : getIdsInfo.call(this);
            }, function (st, text) {
                if (bdReq) {
                    bdReq.abort();
                    bdReq = null;
                }
                this.updating = false;
                this._observer.onUpdateError(st, text);
            });
        },
        saveCurrentTime: function () {
            var ts = this._stor.def || 0;
            this._saveTS(Math.max(this.okNow(), ts));
        }
    };
};
