"use strict";
var EXPORTED_SYMBOLS = ["commonThumbsSuggest"];
var commonThumbsSuggest = function () {
    var debug = false;
    function getFoundMap(substrArr, str) {
        return substrArr.reduce(function (res, s) {
            var index = str.indexOf(s);
            if (index >= 0) {
                res[s] = true;
            }
            return res;
        }, {});
    }
    function multiplyWeight(item, koef, comment) {
        if (debug) {
            var msg = "x " + koef + (comment ? "(" + comment + ")" : "");
            item.log = item.log || [item.weight];
            item.log.push(msg);
        }
        item.weight = item.weight * koef;
    }
    return {
        init: function (_debug) {
            debug = _debug;
        },
        finalize: function () {
        },
        calcWeight: function commonThumbsSuggest_calcWeight(query, items, count, doFilter) {
            query = query.trim().toLowerCase();
            var words = query.split(/\s+/);
            words = words.length > 1 ? words : [];
            var searches = [query].concat(words);
            items = items.map(function (item) {
                var uri = new URI(item.url);
                var readable;
                try {
                    readable = uri.readable();
                } catch (e) {
                    readable = item.url;
                }
                return {
                    url: readable.toLowerCase(),
                    uri: uri,
                    sourceTitle: item.title,
                    title: item.title.toLowerCase(),
                    weight: item.weight
                };
            }).map(function (item) {
                item.foundInUrl = getFoundMap(searches, item.url);
                item.foundInTitle = getFoundMap(searches, item.title);
                return item;
            });
            if (doFilter !== false) {
                items = items.filter(function (item) {
                    return Object.keys(item.foundInUrl).length || Object.keys(item.foundInTitle).length;
                }).filter(function (item) {
                    return Boolean(item.uri.hostname());
                });
            }
            items = items.map(function (item) {
                if (words.length && (item.foundInUrl[query] || item.foundInTitle[query])) {
                    multiplyWeight(item, words.length, "words.length");
                }
                return item;
            }).map(function (item) {
                if (item.uri.path() === "/" && item.uri.search() === "" && item.uri.hash() === "") {
                    multiplyWeight(item, 2, "canonic url");
                }
                return item;
            });
            if (/[\/\.]/.test(query)) {
                items = items.map(function (item) {
                    if (item.foundInUrl[query]) {
                        multiplyWeight(item, 100, "url with full query");
                    } else if (item.foundInTitle[query]) {
                        multiplyWeight(item, 50, "title with full query");
                    }
                    return item;
                });
            } else if (words.length) {
                items = items.map(function (item) {
                    var notQuery = function (v) {
                        return v !== query;
                    };
                    var countInUrl = Object.keys(item.foundInUrl).filter(notQuery).length;
                    var countInTitle = Object.keys(item.foundInTitle).filter(notQuery).length;
                    multiplyWeight(item, 10, "koef");
                    multiplyWeight(item, countInUrl + countInTitle, "x word count matched in title / url");
                    return item;
                }).map(function (item) {
                    if (item.foundInUrl[query] || item.foundInTitle[query]) {
                        multiplyWeight(item, 100, "full phrase match");
                    }
                    return item;
                });
            } else {
                items = items.map(function (item) {
                    var str = (item.url + " " + item.title).replace(/&quot;/g, "\"").replace(/&#039;/g, "'");
                    var tokens = str.split(/[\.\/\s\-\"\'\:\,\;]+/);
                    tokens = tokens.slice(1);
                    if (tokens[0] === "www") {
                        tokens = tokens.slice(1);
                    }
                    tokens.every(function (token, pos) {
                        if (token && token.indexOf(query) === 0) {
                            multiplyWeight(item, Math.max(100 - 10 * pos, 1), "token #" + (pos + 1) + " match");
                            return false;
                        } else {
                            return true;
                        }
                    });
                    return item;
                });
            }
            var hostnames = items.reduce(function (res, item) {
                var host = item.uri.hostname();
                if (!res[host] || res[host].weight < item.weight) {
                    res[host] = item;
                }
                return res;
            }, {});
            items = Object.keys(hostnames).map(function (hostname) {
                var item = hostnames[hostname];
                var resItem = {
                    url: item.uri.toString(),
                    title: item.sourceTitle,
                    domain: hostname,
                    weight: item.weight
                };
                if (debug) {
                    resItem.log = Array.isArray(item.log) ? item.log.join(" ") : "";
                }
                return resItem;
            });
            items.sort(function (a, b) {
                return b.weight - a.weight;
            });
            if (count) {
                items = items.slice(0, count);
            }
            return items;
        }
    };
}();
