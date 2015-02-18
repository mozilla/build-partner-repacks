EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        common.log("[API]: " + str);
    }
    function logObj(ob, pref) {
        common.logObj(ob, "[API]: " + (pref || ""));
    }
    function logr(str) {
        common.logr("[API]: " + str);
    }
    var queries = {
        "me": {
            query: "SELECT uid, name FROM user WHERE uid = me()",
            parser: function (fql_result_set) {
                var user = fql_result_set[0];
                return {
                    loggedIn: true,
                    user: user
                };
            }
        },
        "notif": {
            query: "SELECT title_text, body_text, created_time, notification_id, icon_url, sender_id, updated_time FROM notification WHERE recipient_id = me() AND is_unread = 1 LIMIT 101",
            parser: function (fql_result_set) {
                return {
                    notifications_count: fql_result_set.length,
                    notifications: fql_result_set
                };
            }
        },
        "friendrequests": {
            query: "SELECT uid_from, unread, time FROM friend_request WHERE uid_to = me() LIMIT 101",
            parser: function (fql_result_set) {
                return {
                    friend_requests_count: fql_result_set.length,
                    friend_requests: fql_result_set
                };
            }
        },
        "usernameresolver": {
            query: "SELECT uid, name, sex, pic_square FROM user WHERE " + "uid IN (SELECT uid_from FROM #friendrequests) " + "OR uid IN (SELECT snippet_author FROM #messages) " + "OR uid IN (SELECT sender_id FROM #notif WHERE created_time > {LAST})",
            parser: function (fql_result_set) {
                return { users: fql_result_set };
            }
        },
        "messages": {
            query: "SELECT thread_id, snippet_author, unread, subject,  snippet, unseen, updated_time FROM thread WHERE folder_id = 0 AND unread > 0 LIMIT 25",
            parser: function (fql_result_set) {
                return { messages: fql_result_set };
            }
        }
    };
    var msgQueryTemplate = "SELECT author_id, body, created_time, thread_id, attachment FROM message " + "WHERE thread_id = '{tid}' AND created_time > {last} ORDER BY created_time DESC LIMIT {limit}";
    var MAX_ERROR_COUNT = 3;
    function now() {
        return Math.floor(Date.now() / 1000);
    }
    return {
        userData: {},
        updating: null,
        _userId: "",
        _cred: {},
        _callbacks: null,
        _stor: null,
        init: function (callbacks) {
            this._callbacks = callbacks;
            this._stor = common.storage("last.json");
        },
        setCredentials: function (userCred) {
            this._cred = userCred;
            var id = userCred._user_id;
            if (id != this._userId) {
                this.clearData();
                this._userId = id;
            }
        },
        clearData: function () {
            this.userData = {};
            this._userId = "";
        },
        _abort: function () {
            if (this.updating) {
                this.updating.abort();
                this.updating = null;
            }
        },
        _setCounterData: function (counterData) {
            this.userData = counterData;
        },
        _handleError: function (st, text, force) {
            if (text != "abort") {
                this.userData.error = [
                    st,
                    text
                ];
                this.userData.errorCount = force ? MAX_ERROR_COUNT : (this.userData.errorCount || 0) + 1;
                this.userData.expired = this.userData.errorCount >= MAX_ERROR_COUNT;
                this._callbacks.onUpdateError(st, text);
            }
        },
        _errorTypesMap: {
            190: [
                401,
                "*token*"
            ],
            102: [
                401,
                "*token*"
            ],
            1: [
                500,
                "*server*"
            ],
            2: [
                500,
                "*server*"
            ],
            4: [
                429,
                "*many*"
            ],
            17: [
                429,
                "*many*"
            ],
            10: [
                403,
                "*denied*"
            ],
            200: [
                403,
                "*denied*"
            ]
        },
        _parseResult: function (res, force) {
            if ("error_code" in res) {
                logObj(res, "FQL error:");
                var code = Math.min(res.error_code, 200);
                var err = this._errorTypesMap[code] || [
                    0,
                    "error"
                ];
                this._handleError.call(this, err[0], err[1], force);
                return;
            }
            var i, l, counterData = {};
            for (i = 0, l = res.length; i < l; ++i) {
                var response = res[i];
                var name = response.name;
                if (name in queries) {
                    var result_set = response.fql_result_set;
                    if (result_set) {
                        common.utils.copy(queries[name].parser(result_set), counterData);
                    }
                }
            }
            var currDate = now();
            var lastTime = this._stor[counterData.user.uid];
            lastTime = lastTime ? Math.max(lastTime, currDate - 24 * 60 * 60) : 0;
            var map = {};
            counterData._userMap = map;
            if (counterData.users) {
                for (i = 0, l = counterData.users.length; i < l; ++i) {
                    map[counterData.users[i].uid] = counterData.users[i];
                }
            }
            counterData.notifyData = {
                friends: [],
                notifications: []
            };
            if (counterData.friend_requests) {
                for (i = 0, l = counterData.friend_requests.length; i < l; ++i) {
                    var fr = counterData.friend_requests[i];
                    fr._profile = map[fr.uid_from];
                    if (fr._profile && fr.unread && lastTime && fr.time > lastTime) {
                        counterData.notifyData.friends.unshift(fr);
                    }
                }
            }
            if (counterData.notifications) {
                for (i = 0, l = counterData.notifications.length; i < l; ++i) {
                    var notif = counterData.notifications[i];
                    notif._profile = map[notif.sender_id];
                    if (notif._profile && lastTime && notif.updated_time > lastTime) {
                        counterData.notifyData.notifications.unshift(notif);
                    }
                }
            }
            this._handleThreads(counterData, lastTime);
            this._stor.save(counterData.user.uid, currDate);
            this._setCounterData(counterData);
            this._callbacks.onUpdate();
        },
        _handleThreads: function (counterData, lastTime) {
            var i, l, msgCount = 0, oneMsgThreads = [], newMsgQuery = {}, newMsgQueryCount = 0, addQuery = function (thread) {
                    newMsgQuery["m_" + newMsgQueryCount] = msgQueryTemplate.replace("{tid}", thread.thread_id).replace("{last}", lastTime).replace("{limit}", thread.unread);
                    newMsgQueryCount++;
                };
            counterData.messages = counterData.messages || [];
            for (i = 0, l = counterData.messages.length; i < l; ++i) {
                var thr = counterData.messages[i];
                thr._profile = counterData._userMap[thr.snippet_author];
                msgCount += thr.unread ? 1 : 0;
                if (thr.unseen && thr.updated_time > lastTime) {
                    if (thr.unread == 1) {
                        oneMsgThreads.push(thr);
                    } else {
                        addQuery(thr);
                    }
                }
            }
            counterData.messages_count = msgCount;
            if (!this._callbacks.onNeedNotify() || !lastTime) {
                log("!this._callbacks.onNeedNotify()");
                return;
            }
            function notifyNextTick(th) {
                common.async.nextTick(th._callbacks.onNotify, th._callbacks);
            }
            var allNMC = newMsgQueryCount + oneMsgThreads.length;
            if (allNMC && this._callbacks.onNeedNotify("messages")) {
                if (allNMC <= common.ui.notifUngroupSize()) {
                    for (i = 0, l = oneMsgThreads.length; i < l; ++i) {
                        addQuery(oneMsgThreads[i]);
                    }
                    oneMsgThreads = [];
                }
                if (newMsgQueryCount) {
                    logObj(newMsgQuery, "request new messages");
                    this._execFQL(newMsgQuery, function (data) {
                        var i, j, msgs, msg, arr = [];
                        logObj(data, "new messages");
                        for (i = 0; i < data.length; ++i) {
                            msgs = data[i].fql_result_set;
                            for (j = 0; j < msgs.length; ++j) {
                                msg = msgs[j];
                                if (msg.author_id == counterData.user.uid) {
                                    continue;
                                }
                                msg._profile = counterData._userMap[msg.author_id];
                                if (msg._profile) {
                                    arr.unshift(msg);
                                }
                            }
                        }
                        if (oneMsgThreads.length) {
                            arr = { length: arr.length + oneMsgThreads.length };
                        }
                        counterData.notifyData.messages = arr;
                        this._callbacks.onNotify();
                    });
                } else {
                    counterData.notifyData.messages = oneMsgThreads;
                    notifyNextTick(this);
                }
            } else {
                notifyNextTick(this);
            }
        },
        _execFQL: function (query, callback, errback) {
            var method = "fql.query", queryField = "query";
            if (typeof query == "object") {
                method = "fql.multiquery";
                query = JSON.stringify(query);
                queryField = "queries";
            }
            log("execFQL, query = " + query);
            var params = {};
            params[queryField] = query;
            var headers = {
                "Authorization": "OAuth " + this._cred.access_token,
                "Accept-Charset": null,
                "Accept-Language": null,
                "Accept": null,
                "Connection": null,
                "Keep-Alive": null,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            };
            return common.http.POST({
                url: app.config.FBdomain.api + "method/" + method + "?format=json",
                background: true,
                anonymous: true,
                scope: this,
                responseType: "json",
                params: params,
                headers: headers,
                timeout: 10000,
                callback: callback,
                errback: errback
            });
        },
        update: function (force) {
            if (force) {
                this._abort();
            }
            if (this.updating) {
                return;
            }
            log("update");
            var q = {};
            var lastTime = this._stor[this._userId] || 1;
            for (var i in queries) {
                q[i] = queries[i].query.replace("{LAST}", lastTime);
            }
            logObj(q, "query");
            this.updating = this._execFQL(q, function (result, xhr) {
                this.updating = false;
                this._parseResult(result);
            }, function (status, text) {
                log("FQL error (network): status=" + status + " text=" + text);
                this.updating = false;
                this._handleError(status, text, force);
            });
        },
        saveCurrentTime: function () {
            if (this._userId) {
                log("saveCurrentTime");
                this._stor.save(this._userId, now());
            }
        }
    };
};
