var barApi = function () {
    var platform = null;
    $.ajaxSetup({
        "xhr": function () {
            return new platform.XMLHttpRequest();
        }
    });
    var feedsObj = {
        _init: function () {
            if (!this._feeds) {
                var conf = window.newsCategConfig;
                this._title = conf.title;
                this._feeds = {};
                for (var i = 0; i < conf.items.length; ++i) {
                    var item = conf.items[i];
                    var sec_feeds = [{ url: item.url }];
                    this._feeds[item.text] = sec_feeds;
                }
            }
        },
        getFeeds: function () {
            this._init();
            return this._feeds;
        },
        getTitle: function () {
            this._init();
            return this._title;
        }
    };
    function getTagText(parent, tag) {
        var t = parent.querySelector(tag);
        return t ? t.textContent : "";
    }
    var module = {
        _getItemsFromRSS: function (url, callback) {
            barApi.log("_getItemsFromRSS: " + url);
            var cachedObj = this.Cache.get(url);
            barApi.logObj(cachedObj, "_getItemsFromRSS: cachedObj");
            if (cachedObj.valid) {
                callback(cachedObj.data);
                return;
            }
            barApi.log("_getItemsFromRSS: start load data " + url);
            $.ajax({
                url: url,
                type: "GET",
                dataType: "xml",
                context: this,
                success: function (data) {
                    barApi.log("load data");
                    var items = $("channel>item", data);
                    var news = [];
                    var DOMAIN = "haber.yandex.com.tr";
                    items.each(function (el) {
                        var el = this;
                        try {
                            news.push({
                                "description": $("description", el).text(),
                                "title": $("title", el).text(),
                                "link": "http://" + DOMAIN + decodeURIComponent($("link", el).text()),
                                "image": getTagText(el, "image-link"),
                                "pubDate": $("pubDateUT", el).text() * 1000
                            });
                        } catch (e) {
                        }
                    });
                    this.Cache.put(url, news);
                    callback(news);
                },
                error: function (st) {
                    barApi.log(st);
                    callback(cachedObj && cachedObj.exists && cachedObj.valid ? cachedObj.data : false);
                }
            });
        },
        getNewItems: function (section, callback, errorCallback) {
            barApi.log("getNewItems " + section);
            var feeds = feedsObj.getFeeds();
            var result = [];
            var _feedsCounter = 0;
            var _feedsErrorCounter = 0;
            var _feedsNum = feeds[section].length;
            barApi.logObj(feeds[section], "feeds['" + section + "']");
            function _feedCallback(items) {
                if (items !== false) {
                    result = result.concat(items);
                } else {
                    _feedsErrorCounter++;
                }
                _feedsCounter++;
                if (_feedsCounter == _feedsNum) {
                    if (_feedsErrorCounter == _feedsNum) {
                        errorCallback();
                    } else {
                        callback(result);
                    }
                }
            }
            var failedAttemptsCounter = 0;
            var numUrls = feeds[section].length;
            var arr = feeds[section];
            for (var i = 0; i < arr.length; ++i) {
                var feedItem = arr[i];
                barApi.logObj(feedItem, "arr[" + i + "]");
                try {
                    this._getItemsFromRSS(feedItem.url, _feedCallback);
                } catch (e) {
                    failedAttemptsCounter++;
                    if (failedAttemptsCounter == numUrls) {
                        errorCallback();
                    }
                }
            }
        },
        Cache: {
            init: function (params) {
                this.writer = params.writer;
                this.reader = params.reader;
                this.timeout = params.timeout;
                this.initiated = !!this.reader && !!this.writer && !!this.timeout;
            },
            get: function (key) {
                barApi.log("Cache get: key=" + key);
                var result = {
                    valid: false,
                    exists: false,
                    data: null
                };
                if (this.initiated) {
                    barApi.log("Cache get: var cached = this.reader(key);");
                    var cached = this.reader(key);
                    barApi.log("Cache get: cached=" + cached);
                    if (cached) {
                        barApi.log("Cache get: !!cached");
                        result.exists = true;
                        result.data = cached.data;
                        var cachedDate = new Date(cached.date);
                        if (cachedDate.setSeconds(cachedDate.getSeconds() + this.timeout) > new Date())
                            result.valid = true;
                    }
                }
                barApi.log("Cache get: return result;");
                return result;
            },
            put: function (key, data) {
                if (!this.initiated)
                    return;
                this.writer(key, data, new Date());
            }
        },
        readValue: function NewsWidget_readValue(name, storage) {
            try {
                var data = JSON.parse(this._api.Files.readTextFile(storage));
                return data[name];
            } catch (e) {
                this._logger.debug("Failed to read value." + e);
                return null;
            }
        },
        writeValue: function NewsWidget_wirteValue(name, value, storage) {
            try {
                try {
                    var data = JSON.parse(this._api.Files.readTextFile(storage));
                } catch (e) {
                    var data = {};
                }
                data[name] = value;
                this._api.Files.writeTextFile(storage, JSON.stringify(data));
            } catch (e) {
                this._logger.error("Failed to write value." + e);
            }
        }
    };
    var cacheStorage = {
        data: {},
        get: function (key) {
            return this.data[key];
        },
        put: function (key, data, date) {
            this.data[key] = {
                "data": data,
                "date": date
            };
        }
    };
    var eventDispatcher = {
        _listeners: {},
        removeListener: function (topic, callback) {
            if (!topic) {
                this._listeners = {};
                return;
            }
            if (!this._listeners[topic]) {
                return;
            }
            if (!callback) {
                this._listeners[topic] = null;
            } else {
                var listeners = this._listeners[topic];
                for (var i = 0; i < listeners.length; ++i) {
                    if (listeners[i].func == callback) {
                        listeners.splice(i, 1);
                        --i;
                    }
                }
            }
        },
        addListener: function (topic, callback, scope) {
            this._listeners[topic] = this._listeners[topic] || [];
            this._listeners[topic].push({
                func: callback,
                scope: scope
            });
            return callback;
        },
        notify: function (topic, data) {
            barapi.log("notify " + topic);
            var listeners = this._listeners[topic];
            if (listeners) {
                for (var i = 0; i < listeners.length; ++i) {
                    var ret = listeners[i].func.call(listeners[i].scope, topic, data);
                    if (ret === false) {
                        break;
                    }
                }
            }
        }
    };
    var barapi = {
        init: function (callback) {
            if (!platform) {
                platform = window.external || window.platform;
                module.Cache.init({
                    reader: function (key) {
                        return cacheStorage.get(key);
                    },
                    writer: function (key, data, date) {
                        cacheStorage.put(key, data, date);
                    },
                    timeout: this.getData("autoreloadInterval") * 60
                });
                this._helperPlatformListener = function (message) {
                    if (!message) {
                        return;
                    }
                    var topic, data;
                    try {
                        topic = message.message || message;
                        data = message.data || null;
                    } catch (exc) {
                        barapi.log("[slice] onMessage: parameter error");
                        return;
                    }
                    eventDispatcher.notify(topic, data);
                };
                platform.onMessage.addListener(this._helperPlatformListener);
                function unload() {
                    if (barapi._helperPlatformListener) {
                        try {
                            platform.onMessage.removeListener(barapi._helperPlatformListener);
                            this._helperPlatformListener = null;
                            eventDispatcher.notify("unload");
                            eventDispatcher.removeListener();
                        } catch (exc) {
                        }
                    }
                }
                window.onunload = unload;
                window.onbeforeunload = unload;
            }
            callback();
        },
        observer: eventDispatcher,
        resize: function (w, h) {
            platform.resizeWindowTo(w, h);
        },
        getString: function (key) {
            return platform.getLocalizedString("news." + key);
        },
        statLog: function (type) {
            var url = "http://clck.yandex.ru/click" + "/dtype=stred" + "/pid=12" + "/cid=72359" + "/path=fx.newstr." + type + "/*";
            $.get(url);
        },
        getData: function (key) {
            switch (key) {
            case "feeds":
                return feedsObj.getFeeds();
            case "autoreloadInterval":
                return parseInt(platform.getOption("autoreload-interval"), 10);
            case "position":
                return "";
            case "outline_title":
                return feedsObj.getTitle();
            case "isUbuntu":
                return false;
            default:
                return false;
            }
        },
        onResize: function (w, h) {
        },
        navigateLink: function (url) {
            platform.navigate(url, "new tab");
            this.hide();
        },
        setOption: function (option, value) {
            platform.setOption(option, value);
        },
        getOption: function (option) {
            return platform.getOption(option);
        },
        hide: function () {
            window.close();
        },
        log: function (str) {
        },
        logObj: function (obj, str) {
        },
        updateData: function (section, callback, errorCallback) {
            return module.getNewItems(section, callback, errorCallback);
        },
        sendMessage: function (msg, data) {
            var obj = { message: msg };
            if (data !== void 0) {
                obj.data = data;
            }
            platform.sendMessage(obj);
        }
    };
    return barapi;
}();
