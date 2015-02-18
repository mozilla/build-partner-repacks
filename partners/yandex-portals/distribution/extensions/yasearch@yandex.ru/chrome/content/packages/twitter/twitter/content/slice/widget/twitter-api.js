(function () {
    var CallChain = Twitter.utils.CallChain;
    var CallbackObject = Twitter.utils.CallbackObject;
    function log(text) {
        Y.log("twitter-api: " + text);
    }
    function mergeDirectMessages(x1, x2) {
        var x = x1.concat(x2);
        if (x.length > 20) {
            x.length = 20;
        }
        x.sort(function (a, b) {
            return Twitter.cmpId(b.id_str, a.id_str);
        });
        return x;
    }
    var DEFAULT_TWEET_COUNT = 20;
    var apiUrl = "https://api.twitter.com", twitterUrl = {
            info: "https://api.twitter.com/1.1/account/verify_credentials.json",
            statusUpdate: "https://api.twitter.com/1.1/statuses/update.json",
            postDMsg: "https://api.twitter.com/1.1/direct_messages/new.json",
            homeTimeline: "https://api.twitter.com/1.1/statuses/home_timeline.json",
            mentions: "https://api.twitter.com/1.1/statuses/mentions_timeline.json",
            dms: "https://api.twitter.com/1.1/direct_messages.json",
            dmsInbox: "https://api.twitter.com/1.1/direct_messages.json",
            dmsSent: "https://api.twitter.com/1.1/direct_messages/sent.json",
            search: "https://api.twitter.com/1.1/search/tweets.json",
            userInfo: "https://api.twitter.com/1.1/users/show.json",
            follow: "https://api.twitter.com/1.1/friendships/create.json",
            unfollow: "https://api.twitter.com/1.1/friendships/destroy.json",
            retweet: "https://api.twitter.com/1.1/statuses/retweet/{id}.json",
            friends: "https://api.twitter.com/1.1/friends/ids.json",
            deleteMsg: "https://api.twitter.com/1.1/statuses/destroy/{id}.json",
            deleteDMsg: "https://api.twitter.com/1.1/direct_messages/destroy.json",
            favorite: "https://api.twitter.com/1.1/favorites/create.json",
            unfavorite: "https://api.twitter.com/1.1/favorites/destroy.json",
            follower: "https://api.twitter.com/1.1/friendships/show.json"
        };
    var compareCallbacks = function (alien, own) {
        var url1 = alien.replace(/^https?:\/\//, "");
        var url2 = own.replace(/^https?:\/\//, "");
        return url1.indexOf(url2) == 0;
    };
    Twitter.twitterAccount = {
        credentials: {},
        maxMessageLength: 140,
        active: true,
        _sendSignedRequest: function (method, url, readystateListener, postDataObject) {
            return Twitter.utils.platformQuery.send(method, url, readystateListener, postDataObject);
        },
        post: function (callbacks, message) {
            log("post message");
            var messageObj = message;
            var _this = this;
            var url = message.user_id ? twitterUrl.postDMsg : twitterUrl.statusUpdate;
            var asyncWatcher = this._sendSignedRequest("POST", url, function (target) {
                if (target.status >= 200 && target.status <= 400) {
                    try {
                        var response = JSON.parse(target.responseText);
                        var id = response.id_str;
                        if (id) {
                            callbacks.success();
                        } else {
                            var error = response.error;
                            callbacks.error(error);
                        }
                    } catch (e) {
                        Components.utils.reportError(e);
                        callbacks.error();
                        return;
                    }
                } else if (target.status > 400 && target.status < 500) {
                    try {
                        var response = JSON.parse(target.responseText);
                    } catch (e) {
                        callbacks.error();
                        return;
                    }
                    var error = response && response.errors && response.errors[0];
                    if (!error) {
                        callbacks.error();
                        return;
                    }
                    if (error.message && error.message.indexOf("duplicate") != -1) {
                        callbacks.error("DUPLICATE");
                    } else {
                        if (error.code == 150) {
                            callbacks.error("NOFRIEND");
                        } else {
                            Y.log("oops! unauthorized. trying to reconnect");
                            callbacks.error();
                        }
                    }
                } else {
                    callbacks.error();
                }
            }, messageObj);
            return asyncWatcher;
        },
        getInfo: function (callbacks) {
            return callbacks.success();
        },
        queryAPI: function (callbacks, method, url, params) {
            var asyncWatcher = this._sendSignedRequest(method, url, function (target) {
                var status = target.status;
                var response = "";
                if (status < 500 && status >= 200) {
                    try {
                        response = target.responseText;
                    } catch (exc) {
                    }
                }
                switch (true) {
                case status >= 200 && status < 300:
                    var obj = null;
                    try {
                        obj = JSON.parse(response);
                    } catch (ex2) {
                        callbacks.error("PARSE_ERROR", status);
                        return;
                    }
                    callbacks.success(obj);
                    break;
                case status == 401:
                    callbacks.error("UNAUTHORIZED", status, response);
                    break;
                case status == 403:
                    callbacks.error("FORBIDDEN", status, response);
                    break;
                case status == 429:
                    callbacks.error("RATE_LIMIT", status);
                    break;
                default:
                    callbacks.error("TRANSPORT_ERROR", status);
                }
            }, params);
            return asyncWatcher;
        },
        getMyInfo: function (callbacks) {
            return this.userInfo(callbacks, this.credentials.uid);
        },
        getHomeTimeline: function (callbacks, max_id) {
            var options = { count: DEFAULT_TWEET_COUNT };
            if (typeof max_id !== "undefined") {
                options.max_id = max_id;
            }
            return this.queryAPI(callbacks, "GET", twitterUrl.homeTimeline, options);
        },
        getMentions: function (callbacks, max_id) {
            var options = { count: DEFAULT_TWEET_COUNT };
            if (typeof max_id !== "undefined") {
                options.max_id = max_id;
            }
            return this.queryAPI(callbacks, "GET", twitterUrl.mentions, options);
        },
        getDirectMessages: function (callbacks) {
            return this.queryAPI(callbacks, "GET", twitterUrl.dms);
        },
        getDirectMessagesEx: function (callbacks, max_id) {
            var _this = this;
            var options = { count: DEFAULT_TWEET_COUNT };
            if (typeof max_id !== "undefined") {
                options.max_id = max_id;
            }
            var dmsChain = new CallChain();
            var chainCb = new CallbackObject(function () {
                var results = dmsChain.getResults();
                var r1 = results[1];
                var r2 = results[2];
                callbacks.success(mergeDirectMessages(r1, r2));
            }, function (error) {
                callbacks.error(error);
            });
            dmsChain.addNode(function (callbacks) {
                return _this.queryAPI(callbacks, "GET", twitterUrl.dmsInbox, options);
            }).addNode(function (callbacks) {
                return _this.queryAPI(callbacks, "GET", twitterUrl.dmsSent, options);
            });
            return dmsChain.execute(chainCb);
        },
        getFriends: function (callbacks) {
            return this.queryAPI(callbacks, "GET", twitterUrl.friends);
        },
        search: function (callbacks, query) {
            var asyncWatcher = this.queryAPI(callbacks, "GET", twitterUrl.search, {
                q: query,
                count: DEFAULT_TWEET_COUNT
            });
            return asyncWatcher;
        },
        userInfo: function (callbacks, user_id) {
            var asyncWatcher = this.queryAPI(callbacks, "GET", twitterUrl.userInfo, { user_id: user_id });
            return asyncWatcher;
        },
        follow: function (callbacks, user_id) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.follow, {
                follow: "true",
                user_id: user_id
            });
            return asyncWatcher;
        },
        unfollow: function (callbacks, user_id) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.unfollow, { user_id: user_id });
            return asyncWatcher;
        },
        retweet: function (callbacks, msgId) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.retweet.replace("{id}", msgId));
            return asyncWatcher;
        },
        deleteMsg: function (callbacks, msgId) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.deleteMsg.replace("{id}", msgId));
            return asyncWatcher;
        },
        deleteDMsg: function (callbacks, msgId) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.deleteDMsg, {
                id: msgId,
                include_entities: 0
            });
            return asyncWatcher;
        },
        favorite: function (callbacks, msgId) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.favorite, { id: msgId });
            return asyncWatcher;
        },
        unfavorite: function (callbacks, msgId) {
            var asyncWatcher = this.queryAPI(callbacks, "POST", twitterUrl.unfavorite, { id: msgId });
            return asyncWatcher;
        },
        follower: function (callbacks, user_id) {
            var asyncWatcher = this.queryAPI(callbacks, "GET", twitterUrl.follower, {
                source_id: this.credentials.uid,
                target_id: user_id
            });
            return asyncWatcher;
        }
    };
}());
