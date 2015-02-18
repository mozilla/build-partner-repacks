(function () {
    function log(text) {
        Y.log("counters: " + text);
    }
    ;
    function sendMessage(topic, data) {
        return Twitter.platform.fireEvent(topic, data);
    }
    ;
    function min2ts(x) {
        return x * 60 * 1000;
    }
    var application = {
        sliceAdapter: { sendMessage: sendMessage },
        utils: Twitter.utils
    };
    var dataWrp = Twitter.utils.dataWrapper;
    var setCounterData = function (data) {
        data = data || {};
        if (data.myInfo) {
            sendMessage("render:main", data.myInfo, true);
        }
        if (data.home) {
            sendMessage("render:home", dataWrp(data.home), true);
        }
        if (data.mentions) {
            sendMessage("render:mentions", dataWrp(data.mentions), true);
        }
        if (data.dms) {
            sendMessage("render:dms", dataWrp(data.dms), true);
        }
    };
    var c = Twitter.counters = {
        _updateInterval: Infinity,
        _failUpdateInterval: 30 * 1000,
        _failNetworkDelay: 10 * 1000,
        _failCount: 0,
        _maxFails: 1,
        _lastUpdatedTimestamp: 0,
        _lastUpdatedError: 0,
        _updating: false,
        _localChangedState: false,
        dataUpdateTimer: null,
        stopTimer: function () {
            if (c.dataUpdateTimer) {
                clearInterval(c.dataUpdateTimer);
                c.dataUpdateTimer = null;
            }
        },
        setUpdateInterval: function (interval) {
            if (interval > 0) {
                c._updateInterval = interval;
            } else {
                c._updateInterval = Infinity;
            }
            log("update interval = " + c._updateInterval);
        },
        _setUpdatingFlag: function () {
            c._updating = true;
            sendMessage("updating", "true", true);
        },
        _unsetUpdatingFlag: function () {
            c._updating = false;
            sendMessage("updating", "false", true);
        },
        localChangedStateOn: function () {
            c._localChangedState = true;
        },
        updateIfLocalChanged: function () {
            if (c._localChangedState) {
                c._localChangedState = false;
                c.update();
            }
        },
        update: function (forced) {
            if (c._updating) {
                return;
            }
            var me = this;
            this._setUpdatingFlag();
            var counterData = {};
            Twitter.userCache.clear();
            var abortTimer = null;
            function clearAbortTimer() {
                if (abortTimer) {
                    clearTimeout(abortTimer);
                    abortTimer = null;
                }
            }
            var cb = new application.utils.CallbackObject(function (result) {
                log("counters updated!!!");
                var results = updateChain.getResults();
                clearAbortTimer();
                me._unsetUpdatingFlag();
                c._failCount = 0;
                c._lastUpdatedError = 0;
                c._lastUpdatedTimestamp = Date.current();
                var data = {
                    myInfo: results[1],
                    home: results[2],
                    mentions: results[3],
                    dms: results[4]
                };
                Y.xParams.my_screen_name = data.myInfo.screen_name;
                setCounterData(data);
                Twitter.unreadInfo.updateMaxId(data);
            }, function (error, status) {
                Y.log("counters update error = \"" + error + "\"");
                clearAbortTimer();
                me._unsetUpdatingFlag();
                ++c._failCount;
                c._lastUpdatedError = 1;
                log("fail count " + c._failCount);
                if (c._failCount >= c._maxFails) {
                    c._lastUpdatedTimestamp = Date.current();
                    c._failCount = 0;
                    switch (error) {
                    case "TRANSPORT_ERROR":
                    case "RATE_LIMIT":
                    case "PARSE_ERROR":
                        if (forced) {
                            var counterData = {
                                home: error,
                                mentions: error,
                                dms: error
                            };
                            setCounterData(counterData);
                        }
                        break;
                    case "FORBIDDEN":
                    case "UNAUTHORIZED":
                        c.stopTimer();
                        Y.sendMessage("twitter:logout");
                        break;
                    }
                }
            });
            var updateChain = new application.utils.CallChain();
            updateChain.addNode(function (cb) {
                return Twitter.twitterAccount.getMyInfo(cb);
            }).addNode(function (cb) {
                return Twitter.twitterAccount.getHomeTimeline(cb);
            }).addNode(function (cb) {
                return Twitter.twitterAccount.getMentions(cb);
            }).addNode(function (cb) {
                return Twitter.twitterAccount.getDirectMessagesEx(cb);
            });
            var watcher = updateChain.execute(cb);
        },
        observe: function (subj, topic, data) {
            switch (topic) {
            case application.name + ".settings-changed":
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    log("observe data error, data = " + data);
                    return;
                }
                var field = "update-interval";
                if (field in data) {
                    var updateInterval = data[field];
                    c.setUpdateInterval(min2ts(updateInterval));
                }
                break;
            case application.name:
                if (data == "finalize") {
                    c.finalize();
                }
                break;
            }
        },
        _updateCheck: function () {
            if (c._updating) {
                return;
            }
            var now = Date.current();
            var nextRequestInterval = c._lastUpdatedError ? c._failUpdateInterval : c._updateInterval;
            if (c._lastUpdatedTimestamp + nextRequestInterval < now) {
                c.update(false);
            }
        },
        init: function (forced) {
            var checkInterval = 1000;
            var OS = Y.ObserverService.getInstance();
            OS.attachObserver("unload", function (topic, data) {
                c.stopTimer();
            });
            OS.attachObserver("update-me", function (topic, data) {
                c.update(true);
            });
            OS.attachObserver(":settings-change", function (topic, data) {
                if (data.name == "update-interval") {
                    c.setUpdateInterval(min2ts(data.value));
                }
            });
            var updInt = Twitter.platform.getOption("update-interval");
            if (!updInt && updInt != 0) {
                updInt = 10;
            }
            c.setUpdateInterval(min2ts(updInt));
            c.dataUpdateTimer = setInterval(this._updateCheck, 20000);
            if (forced) {
                c.update(true);
            }
        }
    };
    var userCache = Twitter.userCache = {
        data: {},
        add: function (user) {
            if (user) {
                this.data[user.id_str] = user;
                this.requestFollower(user.id_str);
            }
        },
        requestFollower: function (user_id) {
            var usr = this.data[user_id];
            if (usr) {
                if (!usr.__infoDef && !usr.__infoReq && user_id != Twitter.twitterAccount.credentials.uid) {
                    usr.__infoReq = true;
                    Twitter.twitterAccount.follower(new application.utils.CallbackObject(function (data) {
                        usr.__infoReq = false;
                        data;
                        userCache.setInfo(user_id, data.relationship.source);
                    }, function () {
                        usr.__infoReq = false;
                    }), user_id);
                }
            }
        },
        setInfo: function (user_id, data) {
            var usr = this.data[user_id];
            if (usr) {
                usr.__follover = data.followed_by;
                usr.__canDM = data.can_dm;
                usr.__infoDef = true;
                var OS = Y.ObserverService.getInstance();
                OS.notifyObservers("overlay:showDMsg", usr);
            }
        },
        get: function (user_id) {
            this.requestFollower(user_id);
            return this.data[user_id];
        },
        clear: function () {
            this.data = {};
        }
    };
    var cmpId = Twitter.cmpId = function (id1, id2) {
        if (!id1 && !id2) {
            return 0;
        }
        id1 = id1 || "0";
        id2 = id2 || "0";
        if (id1.length != id2.length) {
            return id1.length - id2.length;
        }
        return id1 < id2 ? -1 : id1 > id2 ? 1 : 0;
    };
    Twitter.unreadInfo = {
        tabs: [
            "home",
            "mentions",
            "dms"
        ],
        delay: 2000,
        viewed: null,
        maxId: {},
        currentTab: "",
        sliceVisible: false,
        init: function () {
            var data = Twitter.platform.getOption("slice-data");
            if (data) {
                try {
                    this.viewed = JSON.parse(data);
                } catch (exc) {
                    this.viewed = {};
                }
            } else {
                this.viewed = {};
            }
            var OS = Y.ObserverService.getInstance();
            var th = this;
            OS.attachObserver("before-popup", function () {
                th.sliceVisible = true;
                th.openSliceOrTab();
            });
            OS.attachObserver("before-hide", function () {
                th.sliceVisible = false;
            });
            OS.attachObserver("twitter:active-tab", function (t, tab) {
                if (th.currentTab != tab) {
                    th.currentTab = tab;
                    th.openSliceOrTab();
                }
            });
        },
        save: function () {
            var value = JSON.stringify(this.viewed);
            Twitter.platform.setOption("slice-data", value);
        },
        _hasNewMsgs: function () {
            for (var i = 0; i < this.tabs.length; ++i) {
                if (cmpId(this.viewed[this.tabs[i]], this.maxId[this.tabs[i]]) < 0) {
                    return true;
                }
            }
            return false;
        },
        openSliceOrTab: function () {
            if (this.sliceVisible && this.tabs.contains(this.currentTab)) {
                if (cmpId(this.viewed[this.currentTab], this.maxId[this.currentTab]) < 0) {
                    this.viewed[this.currentTab] = this.maxId[this.currentTab];
                    this.save();
                    var notify = "render:counter:" + this.currentTab;
                    setTimeout(function () {
                        var OS = Y.ObserverService.getInstance();
                        OS.notifyObservers(notify, 0);
                    }, this.delay);
                    if (!this._hasNewMsgs()) {
                        Y.sendMessage("twitter:fresh", false);
                    }
                }
            }
        },
        updateMaxId: function (obj) {
            for (var i = 0; i < this.tabs.length; ++i) {
                var data = obj[this.tabs[i]];
                if (data) {
                    var count = 0;
                    var max = this.maxId[this.tabs[i]] || "0";
                    var viewed = this.viewed[this.tabs[i]] || "0";
                    for (var j = 0; j < data.length; ++j) {
                        var id = data[j].id_str;
                        if (cmpId(id, viewed) > 0) {
                            count++;
                        }
                        if (cmpId(id, max) > 0) {
                            max = id;
                        }
                    }
                    this.maxId[this.tabs[i]] = max;
                    if (this.sliceVisible && this.tabs[i] == this.currentTab) {
                        count = 0;
                        if (cmpId(max, viewed) > 0) {
                            this.viewed[this.tabs[i]] = max;
                        }
                    }
                    var OS = Y.ObserverService.getInstance();
                    OS.notifyObservers("render:counter:" + this.tabs[i], count);
                }
            }
            if (this._hasNewMsgs()) {
                Y.sendMessage("twitter:fresh", true);
            }
        }
    };
}());
