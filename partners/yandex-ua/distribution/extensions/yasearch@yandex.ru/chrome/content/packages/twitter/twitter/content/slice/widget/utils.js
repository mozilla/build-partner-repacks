(function () {
    var map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&apos;"
    };
    var map2 = {
        "&amp;": "&",
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": "\"",
        "&apos;": "'"
    };
    var funcReplace = function (str) {
        return map[str];
    };
    var funcReplace2 = function (str) {
        return map2[str];
    };
    var rx = /&|'|<|>|"/g;
    var rx2 = /&amp;|&nbsp;|&lt;|&gt;|&quot;|&apos;/g;
    String.prototype.toHTML = function () {
        return this.replace(rx, funcReplace);
    };
    String.prototype.fromHTML = function () {
        return this.replace(rx2, funcReplace2);
    };
    String.prototype.trim = function () {
        return this.replace(/^\s\s*|\s*\s$/gm, "");
    };
}());
Date.current = function () {
    return new Date().valueOf();
};
Function.empty = function () {
};
Function.prototype.callbackDelay = function (minTimeout) {
    if (!minTimeout || minTimeout < 1) {
        return this;
    }
    var endTime = new Date().valueOf() + minTimeout;
    var func = this;
    return function () {
        var interval = endTime - new Date().valueOf();
        var args = arguments, self = this;
        if (interval > 0) {
            setTimeout(function () {
                func.apply(self, args);
            }, interval);
        } else {
            func.apply(self, args);
        }
    };
};
window.Twitter = window.Twitter || {};
Twitter.utils = {
    shortenUrl: function (url, callback, errback) {
        return Twitter.http.GET({
            url: "http://clck.ru/--",
            params: { url: url },
            callback: callback,
            errback: errback
        });
    },
    copy: function (src, dest) {
        dest = dest || {};
        if (src) {
            for (var i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    },
    isArray: function (obj) {
        return !!obj && !!obj.splice && Object.prototype.toString.call(obj) === "[object Array]";
    },
    isRegExp: function (obj) {
        return !!obj && !!obj.test && Object.prototype.toString.call(obj) === "[object RegExp]";
    },
    parseDate: function (str) {
        if (typeof str !== "string" || !str) {
            return str;
        }
        var i, part = str.match(/\d+/g);
        for (i = 0; i < part.length; ++i) {
            part[i] = parseInt(part[i], 10);
        }
        return new Date(part[0], part[1] - 1, part[2], part[3], part[4], part[5]);
    },
    CallbackObject: function (success, error) {
        var $ = this;
        $.success = function () {
            try {
                return success.apply($, arguments);
            } catch (e) {
                Twitter.platform.logError(e);
                $.error();
            }
        };
        $.error = error || function () {
        };
    },
    CallChain: function () {
        var nodes = [];
        var results = [];
        var currentNode = 0;
        var currentWatcher = null;
        var executing = false;
        var aborted = false;
        this.addNode = function (fn) {
            nodes.push(fn);
            return this;
        };
        this.removeNode = function (fn) {
            for (var i = 0, l = nodes.length; i < l; ++i) {
                if (nodes[i] === fn) {
                    delete nodes[i];
                    nodes.splice(i, 1);
                    break;
                }
            }
            return this;
        };
        this.getResults = function () {
            return results;
        };
        this.execute = function (finalCallbacks) {
            currentNode = 0;
            aborted = false;
            results = [];
            executing = true;
            var watcher = {
                abort: function () {
                    Y.log("abort chain");
                    aborted = true;
                    currentWatcher && currentWatcher.abort && currentWatcher.abort();
                }
            };
            var executor = function executor(result) {
                var node = nodes[currentNode];
                results[currentNode] = result;
                if (aborted) {
                    return;
                }
                if (node) {
                    currentNode++;
                    currentWatcher = node.call({}, new Twitter.utils.CallbackObject(executor, finalCallbacks.error));
                } else {
                    currentNode = 0;
                    executing = false;
                    finalCallbacks.success.apply({}, arguments);
                }
            };
            executor();
            return watcher;
        };
    },
    dataWrapper: function (data, more, addData) {
        var r = { more: !!more };
        if (!data || typeof data == "string") {
            r.networkerror = data || true;
            r.data = { networkerror: data || true };
            r.moreButtonState = r.more ? "show" : "hide";
            r.render = !r.more;
        } else {
            r.render = !r.more || data.length > 0;
            r.data = data;
            r.moreButtonState = data.length >= 17 ? "show" : more || data.length ? "no-more" : "hide";
        }
        Twitter.utils.copy(addData, r.data);
        return r;
    }
};
(function platformQuery() {
    var requestMap = {};
    var seq = 0;
    function observer(topic, data) {
        var callback = requestMap[data.id];
        if (callback) {
            delete requestMap[data.id];
            callback(data);
        }
    }
    Twitter.utils.platformQuery = {
        send: function (method, url, callback, params) {
            var id = String(++seq);
            var arr = [];
            if (params) {
                for (var i in params) {
                    if (params.hasOwnProperty(i)) {
                        arr.push({
                            name: i,
                            value: String(params[i])
                        });
                    }
                }
            }
            requestMap[id] = callback;
            Twitter.platform.sendMessage("api:request", {
                method: method,
                url: url,
                params: arr,
                id: id
            });
            return {
                abort: function () {
                    delete requestMap[id];
                    Y.log("aborted ");
                    callback({
                        id: id,
                        status: 0,
                        responseText: ""
                    });
                }
            };
        },
        init: function () {
            requestMap = {};
            seq = 0;
            Twitter.platform.addListener("api:response", observer);
        }
    };
}());
