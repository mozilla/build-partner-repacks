(function (namespace) {
    "use strict";
    function urlEncode(args) {
        var query = "", i, arg, value;
        for (arg in args) {
            value = args[arg];
            if (!(value instanceof Array)) {
                value = [value];
            }
            for (i = 0; i < value.length; ++i) {
                if (query) {
                    query += "&";
                }
                query += arg + "=" + encodeURIComponent(value[i]);
            }
        }
        return query;
    }
    var util = {
        attachEvent: function (element, eventname, handler) {
            if (element.addEventListener) {
                element.addEventListener(eventname, handler, false);
                return handler;
            }
            var wrapper = function () {
                var event = window.event;
                event.target = event.srcElement;
                return handler(event);
            };
            element.attachEvent("on" + eventname, wrapper);
            return wrapper;
        },
        cancelEvent: function (event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        },
        fireEvent: function (element, eventname) {
            if (element.dispatchEvent) {
                var event = document.createEvent("HTMLEvents");
                event.initEvent(eventname, false, true);
                element.dispatchEvent(event);
            } else if (element.fireEvent) {
                eventname = "on" + eventname;
                if (eventname in element) {
                    element.fireEvent(eventname);
                }
            }
        },
        htmlEncode: function (str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },
        trim: function (str) {
            return str.replace(/^\s+|\s+$/g, "");
        },
        ABC: [
            [
                223,
                223
            ],
            [
                880,
                1791
            ],
            [
                4256,
                4351
            ]
        ],
        isAlpha: function (ch) {
            if (ch.toLowerCase() !== ch.toUpperCase()) {
                return true;
            }
            var code = ch.charCodeAt(0), i;
            for (i = 0; i < this.ABC.length; ++i) {
                if (code >= this.ABC[i][0] && code <= this.ABC[i][1]) {
                    return true;
                }
            }
            return false;
        },
        isDigit: function (ch) {
            var code = ch.charCodeAt(0);
            return code >= 48 && code <= 57;
        },
        isAlphaOrDigit: function (ch) {
            return this.isAlpha(ch) || this.isDigit(ch);
        },
        createElement: function (tag, attrs, styles) {
            var elem = document.createElement(tag), attr;
            if (attrs) {
                for (attr in attrs) {
                    elem[attr] = attrs[attr];
                }
            }
            if (styles) {
                for (attr in styles) {
                    elem.style[attr] = styles[attr];
                }
            }
            return elem;
        },
        selectValue: function (ctrl, value) {
            ctrl.selectedIndex = -1;
            var i;
            for (i = 0; i < ctrl.options.length; ++i) {
                if (ctrl.options[i].value == value) {
                    ctrl.selectedIndex = i;
                    break;
                }
            }
            return ctrl.selectedIndex;
        },
        getSelectedValue: function (ctrl) {
            var index = ctrl.selectedIndex;
            return index < 0 ? "" : ctrl.options[index].value;
        },
        newSet: function (keys) {
            var set = {}, i;
            for (i = 0; i < keys.length; ++i) {
                set[keys[i]] = 1;
            }
            return set;
        },
        time: function () {
            return new Date().getTime();
        },
        getDirection: function (lang) {
            return lang == "ar" || lang == "he" ? "rtl" : "ltr";
        },
        setCookies: function (name, dic, days) {
            var attr, value = "", sep = "";
            for (attr in dic) {
                value += sep + attr + "=" + dic[attr];
                sep = ":";
            }
            var expires = new Date(util.time() + (days || 100) * 24 * 3600 * 1000);
            document.cookie = name + "=" + value + "; expires=" + expires.toUTCString();
        },
        getCookies: function (name) {
            var items = document.cookie.split("; ");
            var dic = {};
            var i, j, item, pos, attrs, pair;
            for (i = 0; i < items.length; ++i) {
                item = items[i];
                pos = item.indexOf("=");
                if (item.substr(0, pos) == name) {
                    attrs = item.substr(pos + 1).split(":");
                    for (j = 0; j < attrs.length; ++j) {
                        pair = attrs[j].split("=");
                        dic[pair[0]] = pair[1] || "";
                    }
                    break;
                }
            }
            return dic;
        },
        apply: function (target, fields) {
            var key;
            for (key in fields) {
                if (fields.hasOwnProperty(key)) {
                    target[key] = fields[key];
                }
            }
        }
    };
    var ajax = {
        createRequest: function () {
            if (XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            if (window.ActiveXObject) {
                return new window.ActiveXObject("Msxml2.XMLHTTP");
            }
            return null;
        },
        sendQuery: function (query) {
            var request = this.createRequest();
            if (!request) {
                return null;
            }
            request.onreadystatechange = function () {
                if (request.readyState != 4) {
                    return;
                }
                if (request.status == 200) {
                    query.callback(request);
                    return;
                }
                var msg = request.status + " (" + request.statusText + ")";
                query.callback(null, {
                    type: "HttpError",
                    message: msg,
                    url: query.url
                });
            };
            var queryStr = urlEncode(query.args);
            var queryUrl = query.url;
            if (query.method == "GET") {
                queryUrl += "?" + queryStr;
                queryStr = null;
            }
            request.open(query.method, queryUrl, true);
            if (query.method == "POST") {
                request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }
            request.send(queryStr);
            return request;
        }
    };
    var json = {
        TIMEOUT: 20000,
        id: 0,
        r: {},
        prefix: "json-query",
        sendQuery: function (query) {
            var ref = this, id = this.id++;
            this.r[id] = query;
            var queryUrl = query.url + "?callback=ya_.json.c(" + id + ")&" + urlEncode(query.args);
            var head = document.getElementsByTagName("head")[0];
            var script = util.createElement("script", {
                type: "text/javascript",
                src: queryUrl,
                charset: "utf-8",
                id: this.prefix + id
            });
            script.onerror = function () {
                query.callback(null, {
                    type: "HttpError",
                    message: "Request failed",
                    url: query.url
                });
                ref.disposeQuery(id);
            };
            query.timer = setTimeout(function () {
                json.timeout(id);
            }, json.TIMEOUT);
            head.appendChild(script);
        },
        c: function (id) {
            var r = this.r[id];
            if (!r) {
                return function () {
                };
            }
            this.disposeQuery(id);
            return function (obj) {
                r.callback(obj);
            };
        },
        timeout: function (id) {
            var r = this.r[id];
            if (r) {
                r.callback(null, {
                    type: "TimeoutError",
                    message: "Timeout expired",
                    url: r.url
                });
                this.disposeQuery(id);
            }
        },
        disposeQuery: function (id) {
            var r = this.r[id];
            if (r) {
                delete this.r[id];
                clearTimeout(r.timer);
                var script = document.getElementById(this.prefix + id);
                if (script) {
                    script.parentNode.removeChild(script);
                }
            }
        }
    };
    namespace.Breaker = {
        breakText: function (text, blockLen) {
            var result = [], sent = [], token = {};
            var pos, ch, dotPos, spacePos;
            for (pos = 0; this.nextToken(text, pos, token); pos += token.length) {
                ch = token.word.charAt(0);
                if (ch.toLowerCase() != ch) {
                    dotPos = token.space.search(/[\.\?!;]/);
                    spacePos = token.space.search(/\s/);
                    if (dotPos >= 0 && spacePos > dotPos) {
                        sent.push(token.space.substr(0, spacePos + 1));
                        this.addSentence(result, sent, blockLen);
                        sent = [];
                        token.space = token.space.substr(spacePos + 1);
                    }
                }
                sent.push(token.space);
                sent.push(token.word);
            }
            this.addSentence(result, sent, blockLen);
            return result;
        },
        nextToken: function (s, pos, token) {
            var sepPos = pos;
            while (pos < s.length && this.isSep(s.charCodeAt(pos))) {
                ++pos;
            }
            var wordPos = pos;
            while (pos < s.length && !this.isSep(s.charCodeAt(pos))) {
                ++pos;
            }
            token.space = s.substr(sepPos, wordPos - sepPos);
            token.word = s.substr(wordPos, pos - wordPos);
            token.length = pos - sepPos;
            return token.length > 0;
        },
        isSep: function (ch) {
            return ch < 47 || ch >= 58 && ch <= 63;
        },
        addSentence: function (result, sent, blockLen) {
            var sentText = sent.join(""), i, s;
            if (sentText.length <= blockLen) {
                sent = [sentText];
            }
            var endIndex = result.length - 1;
            var textLen = endIndex >= 0 ? result[endIndex].length : blockLen;
            for (i = 0; i < sent.length; ++i) {
                s = sent[i];
                if (!s) {
                    continue;
                }
                if (textLen + s.length > blockLen) {
                    result[++endIndex] = "";
                    textLen = 0;
                }
                result[endIndex] += s;
                textLen += s.length;
            }
        }
    };
    namespace.util = namespace.util || util;
    namespace.ajax = namespace.ajax || ajax;
    namespace.json = namespace.json || json;
    namespace.ya_ = {
        util: util,
        ajax: ajax,
        json: json
    };
}(window));
