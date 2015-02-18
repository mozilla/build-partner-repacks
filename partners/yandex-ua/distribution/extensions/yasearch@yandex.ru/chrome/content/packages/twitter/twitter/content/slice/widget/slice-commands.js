(function () {
    var CallbackObject = Twitter.utils.CallbackObject;
    var CallChain = Twitter.utils.CallChain;
    function sendMessage(topic, data) {
        return Twitter.platform.fireEvent(topic, data);
    }
    Twitter.realSliceCommands = {
        "slice:load": true,
        "twitter:fresh": true,
        "twitter:logout": true,
        "api:request": true
    };
    Twitter.sliceCommands = {
        "slice:close": function () {
            window.close();
        },
        "twitter:post": function (d) {
            var drpl = d.hasOwnProperty("user_id");
            Twitter.platform.logAction(drpl || d.hasOwnProperty("in_reply_to_status_id") ? 112 : 114);
            sendMessage("updating", "true");
            sendMessage("message:locked", "true");
            sendMessage("message:info", { "text": "&slice.msg.sending;" });
            Twitter.twitterAccount.post(new CallbackObject(function () {
                sendMessage("updating", "false");
                sendMessage("message:text-value", " ");
                sendMessage("message:locked", "false");
                sendMessage("message:info", {
                    text: "&slice.msg.sent;",
                    showTime: 2.5,
                    cleanComposerDelay: 0,
                    unlockComposerDelay: 2.5
                });
                Twitter.counters.update();
            }, function (error) {
                Y.log("error posting = " + error);
                switch (error) {
                case "DUPLICATE":
                    sendMessage("message:info", {
                        "type": "error",
                        "text": "&slice.msg.error.duplicate;"
                    });
                    break;
                case "NOFRIEND":
                    sendMessage("message:info", {
                        "type": "error",
                        "text": "&slice.msg.error.nofriend;"
                    });
                    break;
                default:
                    sendMessage("message:info", {
                        "type": "error",
                        "text": "&slice.msg.error;"
                    });
                }
                sendMessage("updating", "false");
                sendMessage("message:locked", "false");
            }), d);
        },
        "twitter:retweet": function (d) {
            Twitter.platform.logAction(115);
            sendMessage("updating", "true");
            sendMessage("message:locked", "true");
            Twitter.twitterAccount.retweet(new CallbackObject(function () {
                sendMessage("message:locked", "false");
                Twitter.counters.update();
            }, function () {
                sendMessage("message:locked", "false");
                sendMessage("updating", "false");
            }), d);
        },
        "twitter:search": function (d) {
            sendMessage("updating", "true");
            var watcher = Twitter.twitterAccount.search(new CallbackObject(function (data) {
                sendMessage("updating", "false");
                data.statuses = data.statuses || [];
                data.statuses.searchQuery = String(d).toHTML();
                sendMessage("render:search", dataWrp(data.statuses));
            }, function (error) {
                sendMessage("updating", "false");
                sendMessage("render:search", dataWrp(error, false, { searchQuery: String(d).toHTML() }));
            }), d);
        },
        "twitter:info": function (d) {
            showUser(d);
        },
        "twitter:overlay-follow": function (d) {
            overlayFollow(d, "follow");
        },
        "twitter:overlay-unfollow": function (d) {
            overlayFollow(d, "unfollow");
        },
        "twitter:open": function (d) {
            Twitter.platform.openNewTab(d);
        },
        "twitter:favorite": function (id) {
            favorite(id, true);
        },
        "twitter:unfavorite": function (id) {
            favorite(id, false);
        },
        "twitter:delete": function (d) {
            deleteMsg(d, "deleteMsg");
        },
        "twitter:delete-direct": function (d) {
            deleteMsg(d, "deleteDMsg");
        },
        "twitter:get-more:home": function (max_id) {
            getMore(max_id, "home", "getHomeTimeline");
        },
        "twitter:get-more:mentions": function (max_id) {
            getMore(max_id, "mentions", "getMentions");
        },
        "twitter:get-more:dms": function (max_id) {
            getMore(max_id, "dms", "getDirectMessagesEx");
        }
    };
    function showUser(d) {
        var usr = Twitter.userCache.get(d);
        if (usr) {
            sendMessage("overlay:show", usr);
            return;
        }
        sendMessage("updating", "true");
        Twitter.twitterAccount.userInfo(new CallbackObject(function (data) {
            sendMessage("updating", "false");
            Twitter.userCache.add(data);
            sendMessage("overlay:show", data);
        }, function () {
            sendMessage("updating", "false");
        }), d);
    }
    function overlayFollow(d, method) {
        sendMessage("updating", "true");
        Twitter.twitterAccount[method](new CallbackObject(function (data) {
            sendMessage("updating", "false");
            Twitter.counters.update();
            sendMessage("overlay:follow", {
                userId: d,
                following: method == "follow"
            });
        }, function () {
            sendMessage("updating", "false");
        }), d);
    }
    function favorite(id, state) {
        sendMessage("updating", "true");
        var type = state ? "favorite" : "unfavorite";
        Twitter.twitterAccount[type](new CallbackObject(function (data) {
            sendMessage("updating", "false");
            sendMessage("data:favorite-message", {
                id: id,
                type: type
            });
        }, function (e, s, response) {
            sendMessage("updating", "false");
            if (e == "FORBIDDEN" && response && state) {
                try {
                    var obj = JSON.parse(response);
                    if (obj && obj.errors && obj.errors.length && obj.errors[0] && obj.errors[0].code == 139) {
                        sendMessage("data:favorite-message", {
                            id: id,
                            type: type
                        });
                    }
                } catch (e) {
                }
            }
        }), id);
    }
    function deleteMsg(d, method) {
        sendMessage("updating", "true");
        Twitter.twitterAccount[method](new CallbackObject(function () {
            sendMessage("data:hidden-message", d);
            sendMessage("updating", "false");
        }, function () {
            sendMessage("updating", "false");
        }), d);
    }
    var dataWrp = Twitter.utils.dataWrapper;
    function getMore(max_id, type, method) {
        sendMessage("updating", "true");
        Twitter.twitterAccount[method](new CallbackObject(function (data) {
            sendMessage("updating", "false");
            sendMessage("render:" + type, dataWrp(data, true));
        }, function () {
            sendMessage("updating", "false");
            sendMessage("render:" + type, dataWrp("error", true));
        }), max_id);
    }
}());
