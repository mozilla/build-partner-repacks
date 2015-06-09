!function (a) {
    "use strict";
    function b(a, b) {
        this._currentDomainData = a, this._referrerData = b;
    }
    function c(a, b, c) {
        this.html = a, this.randomNameLength = b || 13, this.saveNames = !!c;
        var d = this._getAllClassesAndIds();
        this.randomNames = this._createRandomNames(d), this.re = this._createRandomizationRegEx(d);
    }
    function d(a) {
        return yandexElementsSovetnik.showPreferences(), m.pricebar.hideWelcomePopover(a), a.stopPropagation(), a.preventDefault(), !1;
    }
    function e() {
        if (m.extensionStorage && m.extensionStorage.getDefaultAffId() == m.settings.getAffId() && m.pricebar && m.pricebar.type)
            for (var a = m.config.getSettingsHost() + "/sovetnik/#/settings", b = document.querySelectorAll("a[href=\"" + a + "\"]"), c = 0; c < b.length; c++)
                b[c].addEventListener ? b[c].addEventListener("click", d, !1) : b[c].attachEvent && b[c].attachEvent("onclick", d);
    }
    function f() {
        return m.log("start"), m.settings.synchronizeSettings(), m.hub.trigger("statsd:init"), m.settings.isSuggestScriptEnabled(document) ? (m.settings.saveFirstStartTime(), m.settings.saveStartTime(new Date().getTime()), m.hub.on("script:offer", function (a) {
            a && m.settings.saveEulaAcceptTime();
        }), void m.settings.synchronizeSettings().then(m.settings.waitToStartScript.bind(m.settings)).then(g)) : void m.log("script disabled");
    }
    function g() {
        m.parserPipe.init().addParser(m.partnerWebsiteParser).addParser(m.aviaParser).addParser(m.selectorsParser).addParser(m.microdataParser).addParser(m.searchParser).addParser(m.cmsParser).addParser(m.urlParser).end();
    }
    function h() {
        var a = j(new Date().toDateString());
        document.documentElement.setAttribute("g_init", a);
    }
    function i() {
        var a = document.documentElement.getAttribute("g_init");
        return !(!a || a !== j(new Date().toDateString()));
    }
    function j(a) {
        return a.split("").reduce(function (a, b, c) {
            return a + b.charCodeAt() * (c + 1);
        }, 0).toString();
    }
    function k() {
        if (!t) {
            if (t = !0, !Function.prototype.bind || !Array.prototype.forEach)
                return !1;
            if (document.querySelector("[href*=\"instiki\"]"))
                return !1;
            m.hub.init && m.hub.init(), m.stats && m.stats.init(), m.view && m.view.init(), m.environment && m.environment.init();
            var b = m.storage.init(m.config.getStorageHost()).then(function () {
                return m.settings.init(a.document.domain);
            });
            m.tools.getHostname(document);
            b.then(function () {
                if (m.settings.isSuggestScriptEnabled(document)) {
                    if (i())
                        return m.log("second script on the page"), void m.hub.trigger("script:alreadyWorked");
                    m.hub.trigger("script:start", new Date().getTime()), l(), h(), f(), m.tools.clearPriceContextNodes();
                } else
                    m.log("clear iframe because of suggest disabled"), m.hub.trigger("statsd:init"), m.tools.clearPriceContextNodes(!0);
            })["catch"](function () {
                m.log("clear iframe because of error"), m.tools.clearPriceContextNodes(!0);
            });
        }
    }
    function l() {
        var b = [
            /https?:\/\/(www\.)?google\.(ru|com)/,
            /https?:\/\/(www\.)?onetwotrip.com/,
            /https?:\/\/(www\.)?biletix.ru/,
            /https?:\/\/www\.pososhok.ru/,
            /https?:\/\/(www\.)?momondo\.ru/,
            /(www\.)?svyaznoy\.travel/
        ];
        if (a.location && a.location)
            for (var c = 0; c < b.length; c++)
                b[c].test(a.location.href) && (a.addEventListener ? a.addEventListener("hashchange", function () {
                    g();
                }, !1) : a.attachEvent("hashchange", function () {
                    g();
                }));
    }
    var m = a.mbr || m || {};
    a.mbr = m, m.config = {
        _current: {
            apiHost: "%SOVETNIK_API_HOST%",
            storageHost: "%SOVETNIK_STORAGE_HOST%",
            settingsHost: "%SOVETNIK_SETTINGS_HOST%",
            statsDHost: "%SOVETNIK_STATSD_HOST%"
        },
        _production: {
            apiHost: "https://suggest.sovetnik.yandex.net",
            storageHost: "https://dl.metabar.ru",
            settingsHost: "https://dl.metabar.ru",
            statsDHost: "https://s.sovetnik.yandex.net"
        },
        _isPatched: function (a) {
            return !/^%[^%]+%$/.test(a);
        },
        _getHost: function (a) {
            return this._current[a] && this._isPatched(this._current[a]) ? this._current[a] : this._production[a];
        },
        getApiHost: function () {
            return this._getHost("apiHost");
        },
        getStorageHost: function () {
            return this._getHost("storageHost");
        },
        getSettingsHost: function () {
            return this._getHost("settingsHost");
        },
        getStatsDHost: function () {
            return this._getHost("statsDHost");
        }
    }, m.JSONP = function () {
        function b(b, c) {
            var d = a.document.createElement("script"), e = !1;
            d.src = b, d.async = !0;
            var g = c || h.error;
            "function" == typeof g && (d.onerror = function (a) {
                g({
                    url: b,
                    event: a
                });
            }), d.onload = d.onreadystatechange = function () {
                e || this.readyState && "loaded" !== this.readyState && "complete" !== this.readyState || (e = !0, d.onload = d.onreadystatechange = null, d && d.parentNode && d.parentNode.removeChild(d));
            }, f || (f = a.document.getElementsByTagName("head")[0]), f.appendChild(d);
        }
        function c(a) {
            return encodeURIComponent(a);
        }
        function d(d, e, f, i) {
            var j, k = -1 === (d || "").indexOf("?") ? "?" : "&";
            i = i || h.callbackName || "callback";
            var l = "metabar_" + i + "_json" + ++g;
            e = e || {};
            for (j in e)
                e.hasOwnProperty(j) && (k += c(j) + "=" + c(e[j]) + "&");
            return a[l] = function (b) {
                f(b);
                try {
                    delete a[l];
                } catch (c) {
                }
                a[l] = null;
            }, b(d + k + i + "=" + l), l;
        }
        function e(a) {
            h = a;
        }
        var f, g = 0, h = {};
        return {
            get: d,
            init: e
        };
    }();
    var n = "Mediator", o = {}, p = { exports: o };
    !function (a, b) {
        "undefined" != typeof o ? o.Mediator = b() : "function" == typeof define && define.amd ? define("mediator-js", [], function () {
            return a.Mediator = b(), a.Mediator;
        }) : a.Mediator = b();
    }(this, function () {
        function a() {
            var a = function () {
                return (65536 * (1 + Math.random()) | 0).toString(16).substring(1);
            };
            return a() + a() + "-" + a() + "-" + a() + "-" + a() + "-" + a() + a() + a();
        }
        function b(c, d, e) {
            return this instanceof b ? (this.id = a(), this.fn = c, this.options = d, this.context = e, void (this.channel = null)) : new b(c, d, e);
        }
        function c(a, b) {
            return this instanceof c ? (this.namespace = a || "", this._subscribers = [], this._channels = [], this._parent = b, void (this.stopped = !1)) : new c(a);
        }
        function d() {
            return this instanceof d ? void (this._channels = new c("")) : new d();
        }
        return b.prototype = {
            update: function (a) {
                a && (this.fn = a.fn || this.fn, this.context = a.context || this.context, this.options = a.options || this.options, this.channel && this.options && void 0 !== this.options.priority && this.channel.setPriority(this.id, this.options.priority));
            }
        }, c.prototype = {
            addSubscriber: function (a, c, d) {
                var e = new b(a, c, d);
                return c && void 0 !== c.priority ? (c.priority = c.priority >> 0, c.priority < 0 && (c.priority = 0), c.priority >= this._subscribers.length && (c.priority = this._subscribers.length - 1), this._subscribers.splice(c.priority, 0, e)) : this._subscribers.push(e), e.channel = this, e;
            },
            stopPropagation: function () {
                this.stopped = !0;
            },
            getSubscriber: function (a) {
                var b = 0, c = this._subscribers.length;
                for (c; c > b; b++)
                    if (this._subscribers[b].id === a || this._subscribers[b].fn === a)
                        return this._subscribers[b];
            },
            setPriority: function (a, b) {
                var c, d, e, f, g = 0, h = 0;
                for (h = 0, f = this._subscribers.length; f > h && (this._subscribers[h].id !== a && this._subscribers[h].fn !== a); h++)
                    g++;
                c = this._subscribers[g], d = this._subscribers.slice(0, g), e = this._subscribers.slice(g + 1), this._subscribers = d.concat(e), this._subscribers.splice(b, 0, c);
            },
            addChannel: function (a) {
                this._channels[a] = new c((this.namespace ? this.namespace + ":" : "") + a, this);
            },
            hasChannel: function (a) {
                return this._channels.hasOwnProperty(a);
            },
            returnChannel: function (a) {
                return this._channels[a];
            },
            removeSubscriber: function (a) {
                var b = this._subscribers.length - 1;
                if (!a)
                    return void (this._subscribers = []);
                for (b; b >= 0; b--)
                    (this._subscribers[b].fn === a || this._subscribers[b].id === a) && (this._subscribers[b].channel = null, this._subscribers.splice(b, 1));
            },
            publish: function (a) {
                var b, c, d, e = 0, f = this._subscribers.length, g = !1;
                for (f; f > e; e++)
                    g = !1, this.stopped || (b = this._subscribers[e], void 0 !== b.options && "function" == typeof b.options.predicate ? b.options.predicate.apply(b.context, a) && (b.fn.apply(b.context, a), g = !0) : (c = this._subscribers.length, b.fn.apply(b.context, a), d = this._subscribers.length, f = d, d === c - 1 && e--, g = !0)), g && b.options && void 0 !== b.options && (b.options.calls--, b.options.calls < 1 && (this.removeSubscriber(b.id), f--, e--));
                this._parent && this._parent.publish(a), this.stopped = !1;
            }
        }, d.prototype = {
            getChannel: function (a) {
                var b = this._channels, c = a.split(":"), d = 0, e = c.length;
                if ("" === a)
                    return b;
                if (c.length > 0)
                    for (e; e > d; d++)
                        b.hasChannel(c[d]) || b.addChannel(c[d]), b = b.returnChannel(c[d]);
                return b;
            },
            subscribe: function (a, b, c, d) {
                var e = this.getChannel(a);
                return c = c || {}, d = d || {}, e.addSubscriber(b, c, d);
            },
            once: function (a, b, c, d) {
                return c = c || {}, c.calls = 1, this.subscribe(a, b, c, d);
            },
            getSubscriber: function (a, b) {
                return this.getChannel(b || "").getSubscriber(a);
            },
            remove: function (a, b) {
                this.getChannel(a).removeSubscriber(b);
            },
            publish: function (a) {
                var b = Array.prototype.slice.call(arguments, 1), c = this.getChannel(a);
                b.push(c), this.getChannel(a).publish(b);
            }
        }, d.prototype.on = d.prototype.subscribe, d.prototype.bind = d.prototype.subscribe, d.prototype.emit = d.prototype.publish, d.prototype.trigger = d.prototype.publish, d.prototype.off = d.prototype.remove, d.Channel = c, d.Subscriber = b, d.version = "0.9.7", d;
    }), m[n] = o[n] || p.exports[n] || p.exports || o;
    var n = "Mustache", o = {}, p = { exports: o };
    !function (a, b) {
        "object" == typeof o && o ? b(o) : "function" == typeof define && define.amd ? define(["exports"], b) : b(a.Mustache = {});
    }(this, function (a) {
        function b(a) {
            return "function" == typeof a;
        }
        function c(a) {
            return a.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
        }
        function d(a, b) {
            return o.call(a, b);
        }
        function e(a) {
            return !d(p, a);
        }
        function f(a) {
            return String(a).replace(/[&<>"'\/]/g, function (a) {
                return q[a];
            });
        }
        function g(b, d) {
            function f() {
                if (w && !x)
                    for (; q.length;)
                        delete p[q.pop()];
                else
                    q = [];
                w = !1, x = !1;
            }
            function g(a) {
                if ("string" == typeof a && (a = a.split(s, 2)), !n(a) || 2 !== a.length)
                    throw new Error("Invalid tags: " + a);
                k = new RegExp(c(a[0]) + "\\s*"), l = new RegExp("\\s*" + c(a[1])), m = new RegExp("\\s*" + c("}" + a[1]));
            }
            if (!b)
                return [];
            var k, l, m, o = [], p = [], q = [], w = !1, x = !1;
            g(d || a.tags);
            for (var y, z, A, B, C, D, E = new j(b); !E.eos();) {
                if (y = E.pos, A = E.scanUntil(k))
                    for (var F = 0, G = A.length; G > F; ++F)
                        B = A.charAt(F), e(B) ? q.push(p.length) : x = !0, p.push([
                            "text",
                            B,
                            y,
                            y + 1
                        ]), y += 1, "\n" === B && f();
                if (!E.scan(k))
                    break;
                if (w = !0, z = E.scan(v) || "name", E.scan(r), "=" === z ? (A = E.scanUntil(t), E.scan(t), E.scanUntil(l)) : "{" === z ? (A = E.scanUntil(m), E.scan(u), E.scanUntil(l), z = "&") : A = E.scanUntil(l), !E.scan(l))
                    throw new Error("Unclosed tag at " + E.pos);
                if (C = [
                        z,
                        A,
                        y,
                        E.pos
                    ], p.push(C), "#" === z || "^" === z)
                    o.push(C);
                else if ("/" === z) {
                    if (D = o.pop(), !D)
                        throw new Error("Unopened section \"" + A + "\" at " + y);
                    if (D[1] !== A)
                        throw new Error("Unclosed section \"" + D[1] + "\" at " + y);
                } else
                    "name" === z || "{" === z || "&" === z ? x = !0 : "=" === z && g(A);
            }
            if (D = o.pop())
                throw new Error("Unclosed section \"" + D[1] + "\" at " + E.pos);
            return i(h(p));
        }
        function h(a) {
            for (var b, c, d = [], e = 0, f = a.length; f > e; ++e)
                b = a[e], b && ("text" === b[0] && c && "text" === c[0] ? (c[1] += b[1], c[3] = b[3]) : (d.push(b), c = b));
            return d;
        }
        function i(a) {
            for (var b, c, d = [], e = d, f = [], g = 0, h = a.length; h > g; ++g)
                switch (b = a[g], b[0]) {
                case "#":
                case "^":
                    e.push(b), f.push(b), e = b[4] = [];
                    break;
                case "/":
                    c = f.pop(), c[5] = b[2], e = f.length > 0 ? f[f.length - 1][4] : d;
                    break;
                default:
                    e.push(b);
                }
            return d;
        }
        function j(a) {
            this.string = a, this.tail = a, this.pos = 0;
        }
        function k(a, b) {
            this.view = null == a ? {} : a, this.cache = { ".": this.view }, this.parent = b;
        }
        function l() {
            this.cache = {};
        }
        var m = Object.prototype.toString, n = Array.isArray || function (a) {
                return "[object Array]" === m.call(a);
            }, o = RegExp.prototype.test, p = /\S/, q = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;",
                "/": "&#x2F;"
            }, r = /\s*/, s = /\s+/, t = /\s*=/, u = /\s*\}/, v = /#|\^|\/|>|\{|&|=|!/;
        j.prototype.eos = function () {
            return "" === this.tail;
        }, j.prototype.scan = function (a) {
            var b = this.tail.match(a);
            if (!b || 0 !== b.index)
                return "";
            var c = b[0];
            return this.tail = this.tail.substring(c.length), this.pos += c.length, c;
        }, j.prototype.scanUntil = function (a) {
            var b, c = this.tail.search(a);
            switch (c) {
            case -1:
                b = this.tail, this.tail = "";
                break;
            case 0:
                b = "";
                break;
            default:
                b = this.tail.substring(0, c), this.tail = this.tail.substring(c);
            }
            return this.pos += b.length, b;
        }, k.prototype.push = function (a) {
            return new k(a, this);
        }, k.prototype.lookup = function (a) {
            var c, d = this.cache;
            if (a in d)
                c = d[a];
            else {
                for (var e, f, g = this; g;) {
                    if (a.indexOf(".") > 0)
                        for (c = g.view, e = a.split("."), f = 0; null != c && f < e.length;)
                            c = c[e[f++]];
                    else
                        c = g.view[a];
                    if (null != c)
                        break;
                    g = g.parent;
                }
                d[a] = c;
            }
            return b(c) && (c = c.call(this.view)), c;
        }, l.prototype.clearCache = function () {
            this.cache = {};
        }, l.prototype.parse = function (a, b) {
            var c = this.cache, d = c[a];
            return null == d && (d = c[a] = g(a, b)), d;
        }, l.prototype.render = function (a, b, c) {
            var d = this.parse(a), e = b instanceof k ? b : new k(b);
            return this.renderTokens(d, e, c, a);
        }, l.prototype.renderTokens = function (c, d, e, f) {
            function g(a) {
                return k.render(a, d, e);
            }
            for (var h, i, j = "", k = this, l = 0, m = c.length; m > l; ++l)
                switch (h = c[l], h[0]) {
                case "#":
                    if (i = d.lookup(h[1]), !i)
                        continue;
                    if (n(i))
                        for (var o = 0, p = i.length; p > o; ++o)
                            j += this.renderTokens(h[4], d.push(i[o]), e, f);
                    else if ("object" == typeof i || "string" == typeof i)
                        j += this.renderTokens(h[4], d.push(i), e, f);
                    else if (b(i)) {
                        if ("string" != typeof f)
                            throw new Error("Cannot use higher-order sections without the original template");
                        i = i.call(d.view, f.slice(h[3], h[5]), g), null != i && (j += i);
                    } else
                        j += this.renderTokens(h[4], d, e, f);
                    break;
                case "^":
                    i = d.lookup(h[1]), (!i || n(i) && 0 === i.length) && (j += this.renderTokens(h[4], d, e, f));
                    break;
                case ">":
                    if (!e)
                        continue;
                    i = b(e) ? e(h[1]) : e[h[1]], null != i && (j += this.renderTokens(this.parse(i), d, e, i));
                    break;
                case "&":
                    i = d.lookup(h[1]), null != i && (j += i);
                    break;
                case "name":
                    i = d.lookup(h[1]), null != i && (j += a.escape(i));
                    break;
                case "text":
                    j += h[1];
                }
            return j;
        }, a.name = "mustache.js", a.version = "0.8.1", a.tags = [
            "{{",
            "}}"
        ];
        var w = new l();
        a.clearCache = function () {
            return w.clearCache();
        }, a.parse = function (a, b) {
            return w.parse(a, b);
        }, a.render = function (a, b, c) {
            return w.render(a, b, c);
        }, a.to_html = function (c, d, e, f) {
            var g = a.render(c, d, e);
            return b(f) ? void f(g) : g;
        }, a.escape = f, a.Scanner = j, a.Context = k, a.Writer = l;
    }), m[n] = o[n] || p.exports[n] || p.exports || o;
    var n = "Promise", o = {}, p = { exports: o };
    !function (a, b) {
        function c(a, b) {
            return (typeof b)[0] == a;
        }
        function d(f, g) {
            return g = function h(i, j, k, l, m, n) {
                function o(a) {
                    return function (b) {
                        m && (m = 0, h(c, a, b));
                    };
                }
                if (l = h.q, i != c)
                    return d(function (a, b) {
                        l.push({
                            p: this,
                            r: a,
                            j: b,
                            1: i,
                            0: j
                        });
                    });
                if (k && c(a, k) | c(b, k))
                    try {
                        m = k.then;
                    } catch (p) {
                        j = 0, k = p;
                    }
                if (c(a, m))
                    try {
                        m.call(k, o(1), j = o(0));
                    } catch (p) {
                        j(p);
                    }
                else
                    for (g = function (b, g) {
                            return c(a, b = j ? b : g) ? d(function (a, c) {
                                e(this, a, c, k, b);
                            }) : f;
                        }, n = 0; n < l.length;)
                        m = l[n++], c(a, i = m[j]) ? e(m.p, m.r, m.j, k, i) : (j ? m.r : m.j)(k);
            }, g.q = [], f.call(f = {
                then: function (a, b) {
                    return g(a, b);
                },
                "catch": function (a) {
                    return g(0, a);
                }
            }, function (a) {
                g(c, 1, a);
            }, function (a) {
                g(c, 0, a);
            }), f;
        }
        function e(d, e, f, g, h) {
            setTimeout(function () {
                try {
                    g = h(g), h = g && c(b, g) | c(a, g) && g.then, c(a, h) ? g == d ? f(TypeError()) : h.call(g, e, f) : e(g);
                } catch (i) {
                    f(i);
                }
            });
        }
        function f(a) {
            return d(function (b) {
                b(a);
            });
        }
        p.exports = d, d.resolve = f, d.reject = function (a) {
            return d(function (b, c) {
                c(a);
            });
        }, d.all = function (a) {
            return d(function (b, c, d, e) {
                e = [], d = a.length || b(e), a.map(function (a, g) {
                    f(a).then(function (a) {
                        e[g] = a, --d || b(e);
                    }, c);
                });
            });
        }, d.queue = function (a, b) {
            function c(b, d, e) {
                e = Array.prototype.slice.call(arguments, 2);
                var f = a.shift();
                if (f) {
                    var g = f.apply(null, e);
                    g.then(function () {
                        var a = Array.prototype.slice.call(arguments);
                        a = [
                            b,
                            d
                        ].concat(a), c.apply(null, a);
                    }, d);
                } else
                    b.apply(null, e);
            }
            return new d(function (a, d) {
                c(a, d, b);
            });
        };
    }("f", "o"), m[n] = o[n] || p.exports[n] || p.exports || o;
    var q = q || function (a, b) {
        var c = {}, d = c.lib = {}, e = function () {
            }, f = d.Base = {
                extend: function (a) {
                    e.prototype = this;
                    var b = new e();
                    return a && b.mixIn(a), b.hasOwnProperty("init") || (b.init = function () {
                        b.$super.init.apply(this, arguments);
                    }), b.init.prototype = b, b.$super = this, b;
                },
                create: function () {
                    var a = this.extend();
                    return a.init.apply(a, arguments), a;
                },
                init: function () {
                },
                mixIn: function (a) {
                    for (var b in a)
                        a.hasOwnProperty(b) && (this[b] = a[b]);
                    a.hasOwnProperty("toString") && (this.toString = a.toString);
                },
                clone: function () {
                    return this.init.prototype.extend(this);
                }
            }, g = d.WordArray = f.extend({
                init: function (a, c) {
                    a = this.words = a || [], this.sigBytes = c != b ? c : 4 * a.length;
                },
                toString: function (a) {
                    return (a || i).stringify(this);
                },
                concat: function (a) {
                    var b = this.words, c = a.words, d = this.sigBytes;
                    if (a = a.sigBytes, this.clamp(), d % 4)
                        for (var e = 0; a > e; e++)
                            b[d + e >>> 2] |= (c[e >>> 2] >>> 24 - 8 * (e % 4) & 255) << 24 - 8 * ((d + e) % 4);
                    else if (65535 < c.length)
                        for (e = 0; a > e; e += 4)
                            b[d + e >>> 2] = c[e >>> 2];
                    else
                        b.push.apply(b, c);
                    return this.sigBytes += a, this;
                },
                clamp: function () {
                    var b = this.words, c = this.sigBytes;
                    b[c >>> 2] &= 4294967295 << 32 - 8 * (c % 4), b.length = a.ceil(c / 4);
                },
                clone: function () {
                    var a = f.clone.call(this);
                    return a.words = this.words.slice(0), a;
                },
                random: function (b) {
                    for (var c = [], d = 0; b > d; d += 4)
                        c.push(4294967296 * a.random() | 0);
                    return new g.init(c, b);
                }
            }), h = c.enc = {}, i = h.Hex = {
                stringify: function (a) {
                    var b = a.words;
                    a = a.sigBytes;
                    for (var c = [], d = 0; a > d; d++) {
                        var e = b[d >>> 2] >>> 24 - 8 * (d % 4) & 255;
                        c.push((e >>> 4).toString(16)), c.push((15 & e).toString(16));
                    }
                    return c.join("");
                },
                parse: function (a) {
                    for (var b = a.length, c = [], d = 0; b > d; d += 2)
                        c[d >>> 3] |= parseInt(a.substr(d, 2), 16) << 24 - 4 * (d % 8);
                    return new g.init(c, b / 2);
                }
            }, j = h.Latin1 = {
                stringify: function (a) {
                    var b = a.words;
                    a = a.sigBytes;
                    for (var c = [], d = 0; a > d; d++)
                        c.push(String.fromCharCode(b[d >>> 2] >>> 24 - 8 * (d % 4) & 255));
                    return c.join("");
                },
                parse: function (a) {
                    for (var b = a.length, c = [], d = 0; b > d; d++)
                        c[d >>> 2] |= (255 & a.charCodeAt(d)) << 24 - 8 * (d % 4);
                    return new g.init(c, b);
                }
            }, k = h.Utf8 = {
                stringify: function (a) {
                    try {
                        return decodeURIComponent(escape(j.stringify(a)));
                    } catch (b) {
                        throw Error("Malformed UTF-8 data");
                    }
                },
                parse: function (a) {
                    return j.parse(unescape(encodeURIComponent(a)));
                }
            }, l = d.BufferedBlockAlgorithm = f.extend({
                reset: function () {
                    this._data = new g.init(), this._nDataBytes = 0;
                },
                _append: function (a) {
                    "string" == typeof a && (a = k.parse(a)), this._data.concat(a), this._nDataBytes += a.sigBytes;
                },
                _process: function (b) {
                    var c = this._data, d = c.words, e = c.sigBytes, f = this.blockSize, h = e / (4 * f), h = b ? a.ceil(h) : a.max((0 | h) - this._minBufferSize, 0);
                    if (b = h * f, e = a.min(4 * b, e), b) {
                        for (var i = 0; b > i; i += f)
                            this._doProcessBlock(d, i);
                        i = d.splice(0, b), c.sigBytes -= e;
                    }
                    return new g.init(i, e);
                },
                clone: function () {
                    var a = f.clone.call(this);
                    return a._data = this._data.clone(), a;
                },
                _minBufferSize: 0
            });
        d.Hasher = l.extend({
            cfg: f.extend(),
            init: function (a) {
                this.cfg = this.cfg.extend(a), this.reset();
            },
            reset: function () {
                l.reset.call(this), this._doReset();
            },
            update: function (a) {
                return this._append(a), this._process(), this;
            },
            finalize: function (a) {
                return a && this._append(a), this._doFinalize();
            },
            blockSize: 16,
            _createHelper: function (a) {
                return function (b, c) {
                    return new a.init(c).finalize(b);
                };
            },
            _createHmacHelper: function (a) {
                return function (b, c) {
                    return new m.HMAC.init(a, c).finalize(b);
                };
            }
        });
        var m = c.algo = {};
        return c;
    }(Math);
    !function (a) {
        function b(a, b, c, d, e, f, g) {
            return a = a + (b & c | ~b & d) + e + g, (a << f | a >>> 32 - f) + b;
        }
        function c(a, b, c, d, e, f, g) {
            return a = a + (b & d | c & ~d) + e + g, (a << f | a >>> 32 - f) + b;
        }
        function d(a, b, c, d, e, f, g) {
            return a = a + (b ^ c ^ d) + e + g, (a << f | a >>> 32 - f) + b;
        }
        function e(a, b, c, d, e, f, g) {
            return a = a + (c ^ (b | ~d)) + e + g, (a << f | a >>> 32 - f) + b;
        }
        for (var f = q, g = f.lib, h = g.WordArray, i = g.Hasher, g = f.algo, j = [], k = 0; 64 > k; k++)
            j[k] = 4294967296 * a.abs(a.sin(k + 1)) | 0;
        g = g.MD5 = i.extend({
            _doReset: function () {
                this._hash = new h.init([
                    1732584193,
                    4023233417,
                    2562383102,
                    271733878
                ]);
            },
            _doProcessBlock: function (a, f) {
                for (var g = 0; 16 > g; g++) {
                    var h = f + g, i = a[h];
                    a[h] = 16711935 & (i << 8 | i >>> 24) | 4278255360 & (i << 24 | i >>> 8);
                }
                var g = this._hash.words, h = a[f + 0], i = a[f + 1], k = a[f + 2], l = a[f + 3], m = a[f + 4], n = a[f + 5], o = a[f + 6], p = a[f + 7], q = a[f + 8], r = a[f + 9], s = a[f + 10], t = a[f + 11], u = a[f + 12], v = a[f + 13], w = a[f + 14], x = a[f + 15], y = g[0], z = g[1], A = g[2], B = g[3], y = b(y, z, A, B, h, 7, j[0]), B = b(B, y, z, A, i, 12, j[1]), A = b(A, B, y, z, k, 17, j[2]), z = b(z, A, B, y, l, 22, j[3]), y = b(y, z, A, B, m, 7, j[4]), B = b(B, y, z, A, n, 12, j[5]), A = b(A, B, y, z, o, 17, j[6]), z = b(z, A, B, y, p, 22, j[7]), y = b(y, z, A, B, q, 7, j[8]), B = b(B, y, z, A, r, 12, j[9]), A = b(A, B, y, z, s, 17, j[10]), z = b(z, A, B, y, t, 22, j[11]), y = b(y, z, A, B, u, 7, j[12]), B = b(B, y, z, A, v, 12, j[13]), A = b(A, B, y, z, w, 17, j[14]), z = b(z, A, B, y, x, 22, j[15]), y = c(y, z, A, B, i, 5, j[16]), B = c(B, y, z, A, o, 9, j[17]), A = c(A, B, y, z, t, 14, j[18]), z = c(z, A, B, y, h, 20, j[19]), y = c(y, z, A, B, n, 5, j[20]), B = c(B, y, z, A, s, 9, j[21]), A = c(A, B, y, z, x, 14, j[22]), z = c(z, A, B, y, m, 20, j[23]), y = c(y, z, A, B, r, 5, j[24]), B = c(B, y, z, A, w, 9, j[25]), A = c(A, B, y, z, l, 14, j[26]), z = c(z, A, B, y, q, 20, j[27]), y = c(y, z, A, B, v, 5, j[28]), B = c(B, y, z, A, k, 9, j[29]), A = c(A, B, y, z, p, 14, j[30]), z = c(z, A, B, y, u, 20, j[31]), y = d(y, z, A, B, n, 4, j[32]), B = d(B, y, z, A, q, 11, j[33]), A = d(A, B, y, z, t, 16, j[34]), z = d(z, A, B, y, w, 23, j[35]), y = d(y, z, A, B, i, 4, j[36]), B = d(B, y, z, A, m, 11, j[37]), A = d(A, B, y, z, p, 16, j[38]), z = d(z, A, B, y, s, 23, j[39]), y = d(y, z, A, B, v, 4, j[40]), B = d(B, y, z, A, h, 11, j[41]), A = d(A, B, y, z, l, 16, j[42]), z = d(z, A, B, y, o, 23, j[43]), y = d(y, z, A, B, r, 4, j[44]), B = d(B, y, z, A, u, 11, j[45]), A = d(A, B, y, z, x, 16, j[46]), z = d(z, A, B, y, k, 23, j[47]), y = e(y, z, A, B, h, 6, j[48]), B = e(B, y, z, A, p, 10, j[49]), A = e(A, B, y, z, w, 15, j[50]), z = e(z, A, B, y, n, 21, j[51]), y = e(y, z, A, B, u, 6, j[52]), B = e(B, y, z, A, l, 10, j[53]), A = e(A, B, y, z, s, 15, j[54]), z = e(z, A, B, y, i, 21, j[55]), y = e(y, z, A, B, q, 6, j[56]), B = e(B, y, z, A, x, 10, j[57]), A = e(A, B, y, z, o, 15, j[58]), z = e(z, A, B, y, v, 21, j[59]), y = e(y, z, A, B, m, 6, j[60]), B = e(B, y, z, A, t, 10, j[61]), A = e(A, B, y, z, k, 15, j[62]), z = e(z, A, B, y, r, 21, j[63]);
                g[0] = g[0] + y | 0, g[1] = g[1] + z | 0, g[2] = g[2] + A | 0, g[3] = g[3] + B | 0;
            },
            _doFinalize: function () {
                var b = this._data, c = b.words, d = 8 * this._nDataBytes, e = 8 * b.sigBytes;
                c[e >>> 5] |= 128 << 24 - e % 32;
                var f = a.floor(d / 4294967296);
                for (c[(e + 64 >>> 9 << 4) + 15] = 16711935 & (f << 8 | f >>> 24) | 4278255360 & (f << 24 | f >>> 8), c[(e + 64 >>> 9 << 4) + 14] = 16711935 & (d << 8 | d >>> 24) | 4278255360 & (d << 24 | d >>> 8), b.sigBytes = 4 * (c.length + 1), this._process(), b = this._hash, c = b.words, d = 0; 4 > d; d++)
                    e = c[d], c[d] = 16711935 & (e << 8 | e >>> 24) | 4278255360 & (e << 24 | e >>> 8);
                return b;
            },
            clone: function () {
                var a = i.clone.call(this);
                return a._hash = this._hash.clone(), a;
            }
        }), f.MD5 = i._createHelper(g), f.HmacMD5 = i._createHmacHelper(g);
    }(Math), m.crypto = q, function () {
        var b = {
            set: function (b, c, d, e, f) {
                var g = b + "=" + a.escape(c) + ";";
                d && (d instanceof Date ? a.isNaN(d.getTime()) && (d = new Date()) : d = new Date(new a.Date().getTime() + 1000 * a.parseInt(d, 10) * 60 * 60 * 24), g += "expires=" + d.toGMTString() + ";"), e && (g += "path=" + e + ";"), f && (g += "domain=" + f + ";"), a.document.cookie = g;
            },
            get: function (b) {
                var c = new a.RegExp("(?:^" + b + "|;\\s*" + b + ")=(.*?)(?:;|$)", "g"), d = c.exec(a.document.cookie);
                return null === d ? null : d[1];
            },
            remove: function (a) {
                this.set(a, "", new Date(1970, 1, 1, 1, 1), "/");
            }
        };
        "object" == typeof m ? m.cookie = b : a.cookie = b;
    }(), m.hub = m.hub || {
        init: function () {
            m.hub = new m.Mediator();
        }
    }, m.tools = m.tools || {
        _months: [
            "янв",
            "фев",
            "мар",
            "апр",
            "май",
            "июн",
            "июл",
            "авг",
            "сен",
            "окт",
            "ноя",
            "дек"
        ],
        getHostname: function (b) {
            b = b || a.document;
            var c = b.domain;
            return /^www./.test(c) && (c = c.slice(4)), c;
        },
        isSubdomain: function (a, b) {
            var c = a.indexOf(b);
            return -1 === c ? !1 : 0 === c ? !0 : "." === a[c - 1];
        },
        priceAnalyze: function (a) {
            return a = a.replace(/\s*/g, ""), a = /\d+[\.,`]*[0-9]*[\.,`]*[0-9]*/g.exec(a), a = a && a.length && a[0] || "", a = a.replace(/[^0-9,\.]/g, ""), a = a.replace(/(,|\.)$/g, ""), a = a.replace(/(,|\.)\d\d?$/g, ""), a = a.replace(/[.,]/g, ""), a = a.replace(/`*/g, "");
        },
        getTextContents: function (a) {
            for (var b = "", c = 0; c < a.childNodes.length; c++)
                a.childNodes[c].nodeType == document.TEXT_NODE ? b += " " + a.childNodes[c].textContent : a.childNodes[c].nodeType == document.ELEMENT_NODE && (b += " " + this.getTextContents(a.childNodes[c]));
            return b = b.replace(/\s+/g, " ").replace(/^[^\dA-Za-zА-Яа-я\(\)\.\,\$€]+/, "").replace(/[^\dA-Za-zА-Яа-я\(\)]\.\,\$€+$/, ""), b.trim();
        },
        getQueryParam: function (a, b) {
            var c, d, e = [
                    b,
                    encodeURIComponent(b)
                ];
            if (-1 != a.lastIndexOf("#") ? c = a.substr(a.lastIndexOf("#") + 1) : -1 != a.indexOf("?") && (c = a.substr(a.indexOf("?") + 1)), c) {
                c = c.split("&");
                for (var f = 0; f < e.length; f++)
                    for (var g = 0; g < c.length; g++)
                        if (0 === c[g].indexOf(e[f] + "="))
                            return d = c[g].substr((e[f] + "=").length), decodeURIComponent(d.replace(/\+/g, " "));
            }
        },
        formatDate: function (a) {
            var b = /^\d{4}-(\d{2})-(\d{2})/;
            return a && b.test(a) ? "(" + RegExp.$2 + " " + this._months[parseInt(RegExp.$1, 10) - 1] + ")" : "";
        },
        decodeHtml: function (a) {
            var b = function (a) {
                var b, c = document.createElement("p");
                return c.innerHTML = a, b = c.textContent || c.text, c = null, b;
            };
            return a.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);?/gi, function (a, c) {
                return "#" === c[0] ? String.fromCharCode("x" === c[1].toLowerCase() ? parseInt(c.substr(2), 16) : parseInt(c.substr(1), 10)) : b("&" + c + ";");
            });
        },
        getProfitText: function (a, b, c) {
            var d = a - b, e = "";
            return d > 100 && "руб." == c && (e += d + " " + c), e;
        },
        isMonthOfNextYear: function (a) {
            var b = new Date().getMonth();
            return b > a;
        },
        decode: function (a) {
            var b, c, d, e, f, g, h, i = "", j = 0, k = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            for (a = a.replace(/[^A-Za-z0-9\+\/\=]/g, ""); j < a.length;)
                e = k.indexOf(a.charAt(j++)), f = k.indexOf(a.charAt(j++)), g = k.indexOf(a.charAt(j++)), h = k.indexOf(a.charAt(j++)), b = e << 2 | f >> 4, c = (15 & f) << 4 | g >> 2, d = (3 & g) << 6 | h, i += String.fromCharCode(b), 64 != g && (i += String.fromCharCode(c)), 64 != h && (i += String.fromCharCode(d));
            var l = "";
            j = 0;
            for (var m = 0, n = 0; j < i.length;)
                if (m = i.charCodeAt(j), 128 > m)
                    l += String.fromCharCode(m), j++;
                else if (m > 191 && 224 > m)
                    n = i.charCodeAt(j + 1), l += String.fromCharCode((31 & m) << 6 | 63 & n), j += 2;
                else {
                    n = utftext.charCodeAt(j + 1);
                    var o = utftext.charCodeAt(j + 2);
                    l += String.fromCharCode((15 & m) << 12 | (63 & n) << 6 | 63 & o), j += 3;
                }
            return l;
        },
        mixin: function (a, b) {
            var c = {};
            for (var d in b)
                ("undefined" == typeof c[d] || c[d] != b[d]) && (a[d] = b[d]);
            return a;
        },
        log: function (a) {
            m.settings && m.settings.isLogEnabled && m.settings.isLogEnabled() && console.log(a);
        },
        getPriceContextElement: function () {
            var a, b = document.getElementsByTagName("script");
            for (a = b.length - 1; a >= 0; a--)
                if (b[a].src && b[a].src.indexOf("sovetnik.webpartner.min.js") > -1)
                    return b[a];
            for (a = b.length - 1; a >= 0; a--)
                if (b[a].src && (b[a].src.indexOf("static/js/ecomerce-context") > -1 || b[a].src.indexOf("sovetnik.min.js") > -1 || b[a].src.indexOf("mbr=") > -1))
                    return b[a];
        },
        clearPriceContextNodes: function (a) {
            if (m.settings.needCleanDOM()) {
                a ? m.storage.clear() : m.hub.on("pipe:reject", function () {
                    m.log("clear iframe after pipe:reject"), m.storage.clear();
                    var a = document.getElementById("mbrstl"), b = document.getElementById("mbrtmplt");
                    a && a.parentNode.removeChild(a), b && b.parentNode.removeChild(b);
                });
                var b = this.getPriceContextElement();
                b && b.parentNode && b.parentNode.removeChild(b);
            }
        },
        getCurrencyFromStr: function (a) {
            if (a) {
                a = a.toUpperCase();
                var b = [
                        {
                            pattern: /(?:EUR)|€/,
                            currency: "EUR"
                        },
                        {
                            pattern: /(?:USD)|(?:У\.Е\.)|\$/,
                            currency: "USD"
                        },
                        {
                            pattern: /(?:UAH)|(?:ГРН)|(?:₴)/,
                            currency: "UAH"
                        },
                        {
                            pattern: /(?:RUR)|(?:RUB)|(?:Р\.)|(?:РУБ)/,
                            currency: "RUB"
                        },
                        {
                            pattern: /(?:ТГ)|(?:KZT)|(?:₸)|(?:ТҢГ)|(?:TENGE)|(?:ТЕНГЕ)/,
                            currency: "KZT"
                        }
                    ], c = b.map(function (b) {
                        return {
                            currency: b.currency,
                            index: a.search(b.pattern)
                        };
                    }).filter(function (a) {
                        return a.index > -1;
                    }).sort(function (a, b) {
                        return a.index - b.index;
                    });
                return c.length ? c[0].currency : void 0;
            }
        },
        getDifferentElement: function (a) {
            for (var b = [].slice.call(document.querySelectorAll(a)); b.length > 1;)
                b = b.map(function (a) {
                    return a.parentNode;
                }), b = b.filter(function (a) {
                    return a && 1 === b.filter(function (b) {
                        return b === a;
                    }).length;
                });
            if (b.length) {
                try {
                    if (b[0].matches(a))
                        return b[0];
                } catch (c) {
                    if (b[0].webkitMatchesSelector(a))
                        return b[0];
                }
                return b[0].querySelector && b[0].querySelector(a);
            }
        },
        getUniqueElements: function (a) {
            var b = [].slice.call(document.querySelectorAll(a));
            if (b.length) {
                var c = [], d = [], e = [];
                b.forEach(function (a) {
                    a.className ? c.push(a) : d.push(a);
                }), c = c.filter(function (a) {
                    var b = a.className;
                    return 1 === c.filter(function (a) {
                        return a.className === b;
                    }).length;
                }), e = b.filter(function (a) {
                    return a.getAttribute("itemtype");
                }), e = e.filter(function (a) {
                    var b = a.getAttribute("itemtype");
                    return 1 === e.filter(function (a) {
                        return a.getAttribute("itemtype") === b;
                    }).length;
                }), (d.length || c.length || e.length) && (b = e, (!b.length || d.length && d.length < b.length) && (b = d), (!b.length || c.length && c.length < b.length) && (b = c)), b.length > 5 && (b = []);
            }
            return b;
        },
        formatPrice: function (a, b) {
            "USD" === b ? b = "$" : "EUR" === b && (b = "€");
            var c = Math.floor(a), d = Math.round(a % 1 * 100), e = c.toString().split("");
            return c = e.map(function (a, b) {
                return b && (e.length - b) % 3 === 0 && (a = " " + a), a;
            }).join(""), a = c, d && (a += "." + d), a += " " + b;
        },
        getShopDetailsUrl: function (a) {
            var b = "http://market.yandex.ru/shop-info.xml?shop_id=", c = {}, d = [];
            a.forEach(function (a) {
                a.id && (c[a.id] = !0);
            });
            for (var e in c)
                c.hasOwnProperty(e) && d.push(e);
            return d.length ? b += d.join(",") : null;
        },
        getPageHeight: function () {
            return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
        },
        getOffsetTop: function () {
            var b = a.pageYOffset;
            if (!b) {
                var c = document.documentElement.clientHeight ? document.documentElement : document.body;
                b = c.scrollTop || 0;
            }
            return b;
        }
    }, m.log = m.tools.log, m.xhr = {
        isCORSSupported: function () {
            return !!this._getXHR(!0);
        },
        _getXHR: function (a) {
            var b;
            if (void 0 !== typeof XMLHttpRequest && (b = new XMLHttpRequest()), a)
                if ("withCredentials" in b)
                    try {
                        b.withCredentials = !0;
                    } catch (c) {
                        b = null;
                    }
                else
                    b = null;
            else if (!b)
                try {
                    b = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (d) {
                    try {
                        b = new ActiveXObject("Msxml2.XMLHTTP");
                    } catch (c) {
                    }
                }
            return b;
        },
        get: function (a, b, c, d) {
            var e, f = this._getXHR(!d);
            f || c && c({ error: "CORS not supported" }), d || (f.withCredentials = !0);
            var g, h = b ? -1 === (a || "").indexOf("?") ? "?" : "&" : "";
            b = b || {};
            var i = [];
            for (g in b)
                b.hasOwnProperty(g) && i.push(encodeURIComponent(g) + "=" + encodeURIComponent(b[g]));
            h += i.join("&"), f.open("GET", a + h, !0), f.onreadystatechange = function () {
                if (e) {
                    var a = new Date().getTime() - e;
                    m.hub.trigger("server:responseEnd", a);
                }
                if (4 === f.readyState)
                    if (200 === f.status)
                        c && c(JSON.parse(f.responseText));
                    else {
                        var b;
                        if ("number" == typeof f.status || "string" == typeof f.status ? (b = f.status, "string" == typeof f.statusText && (b += " " + f.statusText)) : b = "Unknown code", f.responseText)
                            try {
                                var d = JSON.parse(f.responseText);
                                return void (c && c(d));
                            } catch (g) {
                            }
                        c && c({
                            error: "Error with XHR",
                            errorMessage: b
                        });
                    }
            }, e = new Date().getTime(), f.send(null);
        },
        post: function (a, b) {
            var c = this._getXHR();
            c.open("POST", a, !0), c.setRequestHeader("Content-Type", "application/json;charset=UTF-8"), c.send(JSON.stringify(b));
        }
    }, b.prototype.getSelector = function () {
        return this._currentDomainData && this._currentDomainData.selector ? {
            nameSelector: this._currentDomainData.selector.name,
            priceSelector: this._currentDomainData.selector.price,
            currencySelector: this._currentDomainData.selector.currency,
            urlTemplates: this._currentDomainData.urlTemplates
        } : null;
    }, b.prototype._checkRule = function (a, b, c) {
        var d = c ? this._referrerData : this._currentDomainData;
        return d && d.rules && d.rules.length && d.rules.indexOf(a) > -1 ? (b && m.log(b), !0) : !1;
    }, b.prototype.isBlacklisted = function () {
        return this._checkRule("blacklisted", "domain is blacklisted");
    }, b.prototype.isYandexWebPartner = function () {
        return this._checkRule("yandex-web-partner", "this is webpartner");
    }, b.prototype.isBlacklistedByReferrer = function () {
        return this._checkRule("blacklisted-by-referrer", "blacklisted by referrer", !0);
    }, b.prototype.canUsePriceContext = function () {
        return !this._checkRule("no-price-context", "can not use price context");
    }, b.prototype.canUseMicrodata = function () {
        return !this._checkRule("no-microdata", "can not use microdata");
    }, b.prototype.canExtractPrice = function () {
        return !this._checkRule("no-price", "can not extract price");
    }, b.prototype.canAddRelativePosition = function () {
        return !this._checkRule("no-relative-position", "can not add relative position");
    }, b.prototype.isReviewSite = function () {
        return this._checkRule("review", "this is review site");
    }, b.prototype.isShop = function () {
        return this._checkRule("shop", "this is shop");
    }, m.SiteInfo = b, m.settings = m.settings || {
        _defaultSettings: JSON.parse("{\"trackingId\":\"UA-46120314-1\",\"campaignName\":\"Price Suggest Sovetnik\",\"applicationName\":\"Элементов Яндекса\",\"affId\":1048,\"aviaEnabled\":true,\"offerEnabled\":false,\"autoShowShopList\":true,\"mbrApplication\":false,\"clid\":2210393}"),
        _blacklist: {},
        _defaultCampaignPrefix: "Price Suggest - ",
        isKnownHttpsSite: function (a) {
            return this.getSelector() || this._domainData || m.aviaParser.isAviaDomain(a) || this.isOurSite(a);
        },
        isYandexWebPartner: function () {
            return !!this._defaultSettings.yandexWebPartner;
        },
        _fromYandexMarket: function (a) {
            var b = !1;
            if (a.referrer) {
                var c = a.referrer.replace(/https?:\/\//, "");
                b = m.tools.isSubdomain(c, "market.yandex") || m.tools.isSubdomain(c, "market-click2.yandex");
            } else {
                var d = m.tools.getQueryParam(document.URL, "frommarket"), e = m.tools.getQueryParam(document.URL, "from"), f = m.tools.getQueryParam(document.URL, "utm_source"), g = /market\.yandex/i, h = /market/i;
                b = d && g.test(d) || e && h.test(e) || f && h.test(f);
            }
            if (document.URL.indexOf("mvideo") > -1) {
                var i = document.URL;
                i = i.replace(/\?.+/, ""), b ? m.cookie.set("svt-url", i) : b = i === decodeURIComponent(m.cookie.get("svt-url"));
            }
            return b;
        },
        _fromDirect: function (a) {
            return a.indexOf("yclid=") > 0;
        },
        _isYandexSite: function (a) {
            var b = /([^\.]+?)\.[^\.]+?$/, c = b.exec(a);
            return c && c.length > 1 ? "yandex" === c[1] || "ya" === c[1] : void 0;
        },
        _fromYandexPartner: function (a) {
            if (a) {
                var b = a.replace(/https?:\/\//, "");
                if (this._blacklist.yandexBlackList)
                    for (var c = 0; c < this._blacklist.yandexBlackList.length; c++)
                        if (0 === b.indexOf(this._blacklist.yandexBlackList[c]))
                            return !0;
                return this._siteInfo.isBlacklistedByReferrer();
            }
            return !1;
        },
        isSuggestScriptEnabled: function (a) {
            var b = m.tools.getHostname(a);
            if (this._settings && this._settings.sovetnikRemoved)
                return m.log("sovetnik removed"), !1;
            if (this._settings && this._settings.offerEnabled && "rejected" === this._settings.offer)
                return m.hub.trigger("script:disabled", "EulaNotAccepted"), m.log("offer rejected"), !1;
            if (this._domainDisabled)
                return m.hub.trigger("script:domainDisabled"), m.hub.trigger("script:disabled", "DisabledForDomain"), m.log("domain disabled"), !1;
            if (this.isYandexWebPartner())
                return !0;
            if ("https:" === a.location.protocol && !this.isKnownHttpsSite(b))
                return m.hub.trigger("page:unknownHttpsSite", b), m.log("unknown https site"), !1;
            if (this._siteInfo.isBlacklisted() || this._siteInfo.isYandexWebPartner())
                return m.log("full blacklist"), !1;
            if (this._blacklist.fullBlackList)
                for (var c = 0; c < this._blacklist.fullBlackList.length; c++)
                    if (b && m.tools.isSubdomain(b, this._blacklist.fullBlackList[c]))
                        return m.hub.trigger("page:fullBlackList", b), m.log("full blacklist"), !1;
            if (this._blacklist.yandexWebPartners)
                for (var c = 0; c < this._blacklist.yandexWebPartners.length; c++)
                    if (b && m.tools.isSubdomain(b, this._blacklist.yandexWebPartners[c]))
                        return m.hub.trigger("page:yandexWebPartners", b), m.log("yandex web partners"), !1;
            return this._isYandexSite(b) ? (m.log("yandex site"), !1) : this._fromYandexMarket(a) ? (m.hub.trigger("script:disabled", "fromMarketSite"), m.log("from market"), !1) : this._fromYandexPartner(a.referrer) ? (m.log("from yandex partner"), !1) : !0;
        },
        isProductSuggestEnabled: function (b) {
            if (this.isYandexWebPartner())
                return !0;
            if (!this._siteInfo.canUsePriceContext())
                return !1;
            if (this._blacklist.pcBlackList)
                for (var c = 0; c < this._blacklist.pcBlackList.length; c++)
                    if (b && m.tools.isSubdomain(b, this._blacklist.pcBlackList[c]))
                        return m.log("pc blacklist"), !1;
            return this._fromDirect(document.URL) ? (m.hub.trigger("script:disabled", "fromYandexDirect"), m.log("from direct"), !1) : "/" === a.location.pathname ? (m.log("main page"), !1) : !0;
        },
        canExtractPrice: function (a) {
            if (a) {
                if (!this._siteInfo.canExtractPrice())
                    return !1;
                if (this._blacklist.priceBlackList)
                    for (var b = 0; b < this._blacklist.priceBlackList.length; b++)
                        if (m.tools.isSubdomain(a, this._blacklist.priceBlackList[b]))
                            return !1;
            }
            return !0;
        },
        isAviaEnabled: function () {
            return !(!this._settings || !this._settings.aviaEnabled);
        },
        isOtherRegionsEnabled: function () {
            return !(!this._settings || !this._settings.otherRegionsEnabled);
        },
        canUseMicrodata: function (a) {
            if (!this._siteInfo.canUseMicrodata())
                return !1;
            if (this._blacklist.microdataBlackList)
                for (var b = 0; b < this._blacklist.microdataBlackList.length; b++)
                    if (a && m.tools.isSubdomain(a, this._blacklist.microdataBlackList[b]))
                        return !1;
            return !0;
        },
        canAddRelativePosition: function (a) {
            if (!this._siteInfo.canAddRelativePosition())
                return !1;
            if (this._blacklist.relativePositionBlacklist)
                for (var b = 0; b < this._blacklist.relativePositionBlacklist.length; b++)
                    if (a && m.tools.isSubdomain(a, this._blacklist.relativePositionBlacklist[b]))
                        return !1;
            return !0;
        },
        canCheckCMS: function () {
            return !this.getSelector();
        },
        canCheckDomain: function () {
            return !this.getSelector();
        },
        canSearchCheck: function () {
            return !this._settings.offerEnabled || "accepted" === this._settings.offer;
        },
        isOurSite: function (a) {
            return a.indexOf(".metabar.ru") > -1 || "localhost" === a;
        },
        isMbrApplication: function () {
            return this._settings && this._settings.mbrApplication && !this.isYandexWebPartner();
        },
        needShowOffer: function () {
            return this.isYandexWebPartner() ? !1 : !(!this._settings.offerEnabled || this._settings.offer);
        },
        getViewModificators: function () {
            return this._settings && this._settings.view;
        },
        getCustomLogo: function () {
            return this._settings && this._settings.customLogo;
        },
        isUniversalScript: function () {
            return this._defaultSettings && this._defaultSettings.universalScript;
        },
        needRandomize: function () {
            return !this._settingsLoaded || this._randomize;
        },
        getRandomNameLength: function () {
            return document.URL.match(/holodilnik\.ru/) ? 7 : 13;
        },
        isStatsEnabled: function () {
            return !(this._settings && this._settings.statsDisabled);
        },
        _onSettingsLoaded: function (a) {
            a.settings = a.settings || {}, this._settings = a.settings, this._settings.sovetnikRemoved = "true" === a.sovetnikRemoved, this._settings.otherRegionsEnabled = "otherRegionsDisabled" !== a.otherRegions, m.hub.trigger("script:removed", this._settings.sovetnikRemoved), a.offerAccepted ? (this._settings.offer = "accepted", m.hub.trigger("script:offer", !0)) : a.offerAccepted === !1 ? (this._settings.offer = "rejected", m.hub.trigger("script:offer", !1)) : m.hub.trigger("script:offer", void 0), this._blacklist = a.blacklist || {}, this._selector = a.selector, this._siteInfo = new m.SiteInfo(a.domainData, a.referrerData), a.clientId || (a.clientId = "xxxxxxxxxxxxxxxxxxx".replace(/x/g, function () {
                return Math.round(15 * Math.random()).toString(16);
            }), m.storage.set("clientId", a.clientId)), this._clientId = a.clientId, this._logEnabled = !!a.logEnabled, this._doNotClean = !!a.doNotClean, this._domainDisabled = a.domainDisabled, this._region = a.activeCity && a.activeCity.id, this._regionName = a.activeCity && a.activeCity.name, this._country = a.activeCountry && a.activeCountry.id || 225, this._firstStartTime = a.firstStartTime, this._eulaAcceptTime = a.eulaAcceptTime, this._settingsLoaded = !0, this._randomize = !a.noRandomize, this._firstStart = !a.firstStart, m.log(a);
        },
        getSelector: function () {
            var a = null, b = !0, c = m.customSelectors[m.tools.getHostname()];
            if (this._settings && this._settings.selector)
                return { nameSelector: this._settings.selector };
            if (this._selector = this._selector || this._siteInfo.getSelector(), this._selector)
                if (this._selector.urlTemplates) {
                    var d = document.URL;
                    b = this._selector.urlTemplates.some(function (a) {
                        return new RegExp(a).test(d);
                    }), b && (a = this._selector);
                } else
                    a = this._selector;
            if (c && b)
                if (a)
                    for (var e in c)
                        c.hasOwnProperty(e) && (a[e] = c[e]);
                else
                    a = c;
            return a;
        },
        isReviewSite: function () {
            if (this._siteInfo.isReviewSite())
                return !0;
            var a = this.getSelector();
            return a && "review" === a;
        },
        getProductName: function () {
            return this._settings && this._settings.productName;
        },
        getModelId: function () {
            return this._settings && this._settings.modelId;
        },
        needLowestPriceOnly: function () {
            return !!(this.lowestPriceOnly || this.isAvitoSite() || this.isAliexpress());
        },
        getAppName: function () {
            return this._settings && this._settings.applicationName;
        },
        getAppVersion: function () {
            return "201505291755";
        },
        getCampaignName: function () {
            return this._settings && this._settings.campaignName;
        },
        getClientId: function () {
            return this._clientId;
        },
        getAffId: function () {
            return this._settings && this._settings.affId;
        },
        getClid: function () {
            return this._settings && this._settings.clid;
        },
        isLogEnabled: function () {
            return this._logEnabled;
        },
        getAffSub: function () {
            return this._settings && this._settings.affSub;
        },
        getSource: function () {
            return this._settings && this._settings.source;
        },
        isAutoShowingShopListEnabled: function () {
            return this._settings && this._settings.autoShowShopList;
        },
        getRegion: function () {
            return this._region;
        },
        getRegionName: function () {
            return this._regionName;
        },
        getCountryId: function () {
            return this._region && this._country;
        },
        isDefaultScript: function () {
            return (1008 == this.getAffId() || 2210364 == this.getClid()) && this.isMbrApplication();
        },
        isAvitoSite: function () {
            return location.host.indexOf("avito.ru") > -1;
        },
        isAliexpress: function () {
            return location.host.indexOf("aliexpress.com") > -1;
        },
        isWildberries: function () {
            return location.host.indexOf("wildberries.ru") > -1;
        },
        isLamoda: function () {
            return location.host.indexOf("lamoda.ru") > -1;
        },
        isShop: function () {
            return this._siteInfo.isShop();
        },
        needCleanDOM: function () {
            return !this._doNotClean && !this.isYandexWebPartner();
        },
        saveFirstStartTime: function () {
            this._settingsLoaded && !this._firstStartTime && (this._firstStartTime = new Date().getTime(), m.storage.set("firstStartTime", this._firstStartTime));
        },
        saveEulaAcceptTime: function () {
            this._settingsLoaded && !this._eulaAcceptTime && (this._eulaAcceptTime = new Date().getTime(), m.storage.set("eulaAcceptTime", this._eulaAcceptTime));
        },
        getActivateTime: function () {
            return this._settings.offerEnabled ? this._eulaAcceptTime : this._firstStartTime;
        },
        getFirstStartTime: function () {
            return this._firstStartTime;
        },
        synchronizeSettings: function () {
            return this._syncSettingsPromise || (this.isUniversalScript() ? this._syncSettingsPromise = this.applySettingsFromUrl() || this._waitPostMessage() : this.isYandexWebPartner() ? this._syncSettingsPromise = this.applySettingsFromUrl() || m.Promise.resolve() : this._syncSettingsPromise = this.applySettingsFromUrl() || this.applySettings({})), this._syncSettingsPromise;
        },
        _waitPostMessage: function () {
            return new m.Promise(function (a) {
                this._settingsApplied ? a() : this._resolvePostMessage = a, setTimeout(function () {
                    this._settingsApplied || this.applySettings({});
                }.bind(this), 5000);
            }.bind(this));
        },
        isFirstStart: function () {
            return this._firstStart;
        },
        isYandexElementsExtension: function () {
            return !(!m.extensionStorage || this.getAffId() != m.extensionStorage.getDefaultAffId() && this.getClid() != m.extensionStorage.getDefaultClid());
        },
        getScrollPosition: function () {
            return +(this._settings && this._settings.startScroll || 0);
        },
        getStartDelay: function () {
            return +(this._settings && this._settings.startDelay || 0);
        },
        getTransactionId: function () {
            return this._transactionId || (this._transactionId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, function () {
                return Math.round(35 * Math.random()).toString(36);
            })), this._transactionId;
        },
        getReferrer: function () {
            return document.referrer;
        },
        applySettingsFromUrl: function () {
            var a = m.tools.getPriceContextElement(), b = [
                    "affId",
                    "clid",
                    "applicationName",
                    "offerEnabled",
                    "affSub",
                    "aviaEnabled",
                    "autoShowShopList",
                    "selector",
                    "productName",
                    "modelId",
                    "startScroll",
                    "startDelay",
                    "statsDisabled"
                ];
            if (a) {
                var c, d = m.tools.getQueryParam(a.src, "settings");
                if (d)
                    c = JSON.parse(decodeURIComponent(d));
                else
                    for (var e, f = 0; f < b.length; f++)
                        e = m.tools.getQueryParam(a.src, b[f]), "undefined" != typeof e && (e = "true" === e ? !0 : "false" === e ? !1 : e, c = c || {}, c[b[f]] = e);
                if (c)
                    return this.applySettings(c);
            }
        },
        applySettings: function (a) {
            "string" == typeof a && (a = JSON.parse(a)), this._settings = this._settings || {};
            var b = {};
            if (a)
                for (var c in a)
                    a.hasOwnProperty(c) && ("undefined" == typeof this._settings[c] && (this.isYandexWebPartner() ? this._settings[c] = a[c] : "clid" === c ? this._settings.affId && this._settings.affId != a.affId || (this._settings[c] = a[c]) : this._settings[c] = a[c]), b[c] = a[c]);
            if (this._defaultSettings) {
                this._defaultSettings.aviaEnabled = !0;
                for (c in this._defaultSettings)
                    this._defaultSettings.hasOwnProperty(c) && ("undefined" == typeof this._settings[c] && (this.isYandexWebPartner() ? this._settings[c] = this._defaultSettings[c] : "clid" === c ? this._settings.affId && this._settings.affId != this._defaultSettings.affId || (this._settings[c] = this._defaultSettings[c]) : this._settings[c] = this._defaultSettings[c]), "undefined" == typeof b[c] && (b[c] = this._defaultSettings[c]));
            }
            return !this._settings.campaignName && this._settings.applicationName && (this._settings.campaignName = this._defaultCampaignPrefix + this._settings.applicationName), !this._settings.mbrApplication && this._settings.applicationName && m.storage.set("appName", this._settings.applicationName), this._resolvePostMessage && this._resolvePostMessage(), this._settingsApplied = !0, this.isYandexWebPartner() || m.storage.saveSettings(b), m.Promise.resolve();
        },
        saveStartTime: function (a) {
            this._startTime = a;
        },
        getStartTime: function () {
            return this._startTime;
        },
        getTimeAfterStart: function () {
            return a.performance ? new Date().getTime() - a.performance.timing.domContentLoadedEventStart : new Date().getTime() - this.getStartTime();
        },
        delayAfterStart: function (a) {
            var b = this.getTimeAfterStart.bind(this);
            return new m.Promise(function (c) {
                function d() {
                    b() > 1000 * a && (clearInterval(e), c());
                }
                var e = setInterval(d, 2000);
            });
        },
        init: function (a) {
            return this._loadPromise ? this._loadPromise : (this._loadPromise = m.storage.canUseDomainData().then(function (b) {
                var c = {
                    clientId: m.storage.get("clientId"),
                    settings: m.storage.loadSettings(),
                    sovetnikRemoved: m.storage.get("sovetnikRemoved"),
                    offerAccepted: m.storage.get("mbr.offerAccepted"),
                    logEnabled: m.storage.get("logEnabled"),
                    domainDisabled: m.storage.get(m.tools.getHostname(document)),
                    doNotClean: m.storage.get("doNotClean"),
                    activeCity: m.storage.get("activeCity"),
                    activeCountry: m.storage.get("activeCountry"),
                    otherRegions: m.storage.get("otherRegions"),
                    firstStartTime: m.storage.get("firstStartTime"),
                    eulaAcceptTime: m.storage.get("eulaAcceptTime"),
                    noRandomize: m.storage.get("noRandomize"),
                    firstStart: m.storage.get("firstStart")
                };
                if (b) {
                    if (c.domainData = m.storage.getDomainData(a), document.referrer) {
                        var d = document.referrer.replace(/^https?\:\/\//, "").replace(/\/.*$/, "");
                        d && (c.referrerData = m.storage.getDomainData(d));
                    }
                } else
                    c.selector = m.storage.getSelector(a), c.blacklist = m.storage.get("blacklist");
                var e = [], f = [];
                for (var g in c)
                    c.hasOwnProperty(g) && (e.push(g), f.push(c[g]));
                return m.Promise.all(f).then(function (a) {
                    for (var b = {}, c = 0; c < a.length; c++)
                        b[e[c]] = a[c];
                    return b;
                });
            }).then(this._onSettingsLoaded.bind(this)), this._loadPromise);
        },
        waitToStartScript: function () {
            var b = this.getScrollPosition(), c = this.getStartDelay();
            return new m.Promise(function (d) {
                function e() {
                    m.tools.getOffsetTop() / m.tools.getPageHeight() * 100 > b && (m.log("try run after scroll"), a.removeEventListener ? a.removeEventListener("scroll", e) : a.detachEvent && a.detachEvent("onscroll", e), d());
                }
                b && (m.log("wait when scroll is " + b + "%"), a.addEventListener ? a.addEventListener("scroll", e, !1) : a.attachEvent && a.attachEvent("onscroll", e)), c && (m.log("wait " + c + " seconds"), m.settings.delayAfterStart(c).then(function () {
                    m.log("run after delay"), d();
                })), b || c || (m.log("run script without delay"), d());
            });
        }
    }, m.iframeStorage = m.iframeStorage || {
        listeners: {},
        messages: [],
        iframe: {},
        ready: !1,
        iframepath: "/static/storage/index.html",
        version: 1,
        generateCookie: function () {
            return Math.round(9000000 * Math.random());
        },
        sendMessage: function (a) {
            this.iframe.postMessage(a, this.host), this.iframe.postMessage(JSON.stringify(a), this.host);
        },
        processMessages: function () {
            for (; this.messages.length;) {
                var a = this.messages.pop();
                this.sendMessage(a);
            }
        },
        prepareMessage: function (a, b) {
            var c = this.generateCookie();
            return a.cookie = c, this.listeners[c] = b, a;
        },
        pullMessage: function (a) {
            var b = new m.Promise(function (b) {
                a = this.prepareMessage(a, b);
            }.bind(this));
            return this.messages.push(a), this.ready && this.processMessages(), b;
        },
        getVersion: function () {
            var a = {
                    type: "MBR_STORAGE",
                    command: "get",
                    key: "version"
                }, b = new m.Promise(function (b) {
                    a = this.prepareMessage(a, b);
                }.bind(this));
            return this.sendMessage(a), b;
        },
        get: function (a) {
            var b = {
                type: "MBR_STORAGE",
                command: "get",
                key: a
            };
            return this.pullMessage(b);
        },
        set: function (a, b) {
            var c = {
                type: "MBR_STORAGE",
                command: "set",
                key: a,
                value: b
            };
            return this.pullMessage(c);
        },
        loadSettings: function () {
            return this.init(m.config.getStorageHost()).then(function () {
                return this.version > 1 ? this._loadSettingsV2() : this._loadSettingsV1();
            }.bind(this));
        },
        _loadSettingsV1: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "loadSettings"
            };
            return this.pullMessage(a);
        },
        _loadSettingsV2: function () {
            return m.Promise.all([
                this._loadPartnerSettings(),
                this._loadUserSettings()
            ]).then(function (a) {
                var b = a[0], c = a[1];
                for (var d in b)
                    b.hasOwnProperty(d) && !c.hasOwnProperty(d) && (c[d] = b[d]);
                return c;
            });
        },
        _loadPartnerSettings: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "loadPartnerSettings"
            };
            return this.pullMessage(a);
        },
        _loadUserSettings: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "loadUserSettings"
            };
            return this.pullMessage(a);
        },
        saveSettings: function (a) {
            var b = {
                type: "MBR_STORAGE",
                command: "saveSettings",
                value: a
            };
            this.pullMessage(b);
        },
        getSelector: function (a) {
            var b = {
                type: "MBR_STORAGE",
                command: "getSelector",
                domain: a
            };
            return this.pullMessage(b);
        },
        getDomainData: function (a) {
            for (var b = []; -1 !== a.indexOf(".");)
                b.push(m.crypto.MD5(a).toString()), a = a.replace(/^[^\.]+\./, "");
            var c = {
                type: "MBR_STORAGE",
                command: "getDomainInfo",
                domains: JSON.stringify(b)
            };
            return this.pullMessage(c);
        },
        canUseDomainData: function () {
            return this.init(m.config.getStorageHost()).then(function () {
                return this.version > 2;
            }.bind(this));
        },
        getCookies: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "getCookies"
            };
            return this.pullMessage(a);
        },
        getLocalStorage: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "getLocalStorage"
            };
            return this.pullMessage(a);
        },
        test: function () {
            var a = {
                type: "MBR_STORAGE",
                command: "testStorage"
            };
            return this.pullMessage(a);
        },
        listener: function (a) {
            var b;
            if (a && a.data) {
                if ("string" == typeof a.data)
                    try {
                        b = JSON.parse(a.data);
                    } catch (c) {
                        return;
                    }
                else
                    b = a.data;
                if (b.cookie && "MBR_STORAGE" === b.type) {
                    var d = this.listeners[b.cookie];
                    if (d) {
                        try {
                            d(b.value);
                        } catch (e) {
                        }
                        delete this.listeners[b.cookie];
                    }
                }
                b && "MBR_SETTINGS" === b.type && b.value && (m.log("save settings"), m.settings.isUniversalScript() && m.settings.applySettings(b.value));
            }
        },
        clear: function () {
            m.settings.isOurSite(m.tools.getHostname(document)) || m.settings.isYandexWebPartner() || (this._container && this._container.parentNode && this._container.parentNode.removeChild(this._container), this.readyPromise = !1);
        },
        init: function (b) {
            if (!this.readyPromise) {
                var c = this;
                this.readyPromise = new m.Promise(function (d) {
                    c.host = b;
                    var e = document.createElement("iframe");
                    e.style.display = "none", e.onload = function () {
                        c.iframe = this.contentWindow, c.getVersion().then(function (a) {
                            a && (c.version = a), c.ready = !0, c.messages.length && c.processMessages(), d();
                        });
                    }, e.src = c.host + c.iframepath + "?version=" + m.settings.getAppVersion(), c._container = e, document.body.appendChild(e), a.addEventListener ? a.addEventListener("message", function () {
                        c.listener.apply(c, arguments);
                    }, !0) : a.attachEvent("onmessage", function () {
                        c.listener.apply(c, arguments);
                    });
                });
            }
            return this.test().then(function (a) {
                a || (this.clear(), m.tools.clearPriceContextNodes());
            }.bind(this)), this.readyPromise;
        }
    }, m.extensionStorage = m.extensionStorage || {
        _defaultSettings: JSON.parse("{\"trackingId\":\"UA-46120314-1\",\"campaignName\":\"Price Suggest Sovetnik\",\"applicationName\":\"Элементов Яндекса\",\"affId\":1048,\"aviaEnabled\":true,\"offerEnabled\":false,\"autoShowShopList\":true,\"mbrApplication\":false,\"clid\":2210393}"),
        getDefaultAffId: function () {
            return this._defaultSettings.affId;
        },
        getDefaultClid: function () {
            return this._defaultSettings.clid;
        },
        _getFromYandexStorage: function (a) {
            var b = yandexElementsSovetnik.getValue(a);
            return "undefined" === b && (b = void 0), b && (b = JSON.parse(b)), b;
        },
        _getters: {
            blacklist: function () {
                return yandexElementsSovetnik.getBlacklist();
            },
            activeCity: function () {
                var a = yandexElementsSovetnik.getSetting("geoid");
                return a ? { id: a.split(";")[0] } : void 0;
            },
            activeCountry: function () {
                var a = yandexElementsSovetnik.getSetting("geoid");
                return a ? { id: a.split(";")[1] } : void 0;
            },
            otherRegions: function () {
                return JSON.parse(yandexElementsSovetnik.getSetting("showOtherRegionsSuggest")) ? "otherRegionsEnabled" : "otherRegionsDisabled";
            },
            statEnabled: function () {
                return yandexElementsSovetnik.isStatEnabled && yandexElementsSovetnik.isStatEnabled();
            }
        },
        get: function (a) {
            if (this._getters[a])
                return m.Promise.resolve(this._getters[a]());
            var b = this._getFromYandexStorage(a);
            return m.Promise.resolve(b);
        },
        set: function (a, b) {
            return b = JSON.stringify(b), yandexElementsSovetnik.setValue(a, b), m.Promise.resolve(!0);
        },
        loadSettings: function (a) {
            var b = this._getFromYandexStorage("mbr.iframeStorage.settings") || null, c = this._defaultSettings, d = yandexElementsSovetnik.getSetting("clid");
            return d && (d = parseInt(d, 10), c.clid = d), c.autoShowShopList = JSON.parse(yandexElementsSovetnik.getSetting("showShopListOnHover")), a || b && (b.affId && b.affId != this._defaultSettings.affId || !b.affId && b.clid && b.clid != c.clid) && (c = b), m.Promise.resolve(c);
        },
        getSelector: function (a) {
            for (var b; -1 !== a.indexOf(".") && !(b = yandexElementsSovetnik.getSelector(a));)
                a = a.replace(/^[^\.]+\./, "");
            return m.Promise.resolve(b);
        },
        needSynchronize: function () {
            var a = 86400000, b = parseInt(this._getFromYandexStorage("lastSynchronizeDate")) || 0, c = new Date().getTime();
            return c - b > a ? (this._getFromYandexStorage("mbr.iframeStorage.settings") && this.set("lastSynchronizeDate", c), !0) : !1;
        }
    }, m.storage = m.storage || {
        _synchronize: function () {
            return m.Promise.all([
                this._iframeStorage.loadSettings(),
                this._iframeStorage.get("mbr.offerAccepted"),
                this._iframeStorage.get("sovetnikRemoved")
            ]).then(function (a) {
                return a = {
                    settings: a[0],
                    offerAccepted: a[1],
                    sovetnikRemoved: a[2]
                }, "string" == typeof a.settings && (a.settings = JSON.parse(settings)), a.sovetnikRemoved && (a.settings = {}), a || { settings: {} };
            }).then(function (a) {
                return this.set("mbr.iframeStorage.settings", a.settings), this.set("mbr.offerAccepted", a.offerAccepted), this.loadSettings(!0);
            }.bind(this)).then(function (a) {
                this._iframeStorage.saveSettings(a);
            }.bind(this));
        },
        init: function (a) {
            return this._initPromise ? this._initPromise : (m.extensionStorage ? (this._extensionStorage = m.extensionStorage, this._iframeStorage = m.iframeStorage, m.iframeStorage = this, this._extensionStorage.needSynchronize() ? (this._needSynchronize = !0, this._initPromise = this._iframeStorage.init(a).then(function () {
                return this._synchronize();
            }.bind(this))) : this._initPromise = m.Promise.resolve()) : (this._iframeStorage = m.iframeStorage, this._initPromise = this._iframeStorage.init(a)), this._initPromise);
        },
        set: function (a, b) {
            var c = this._extensionStorage || this._iframeStorage;
            return c.set(a, b);
        },
        get: function (a) {
            var b = this._extensionStorage || this._iframeStorage;
            return b.get(a);
        },
        getSelector: function (a) {
            var b = this._extensionStorage || this._iframeStorage;
            return b.getSelector(a);
        },
        saveSettings: function (a) {
            this._extensionStorage || this._iframeStorage.saveSettings(a);
        },
        loadSettings: function (a) {
            var b = this._extensionStorage || this._iframeStorage;
            return b.loadSettings(a);
        },
        clear: function () {
            this._needSynchronize || (this._iframeStorage.clear(), this._initPromise = null);
        },
        test: function () {
            return this._iframeStorage.test();
        },
        canUseDomainData: function () {
            return this._extensionStorage ? m.Promise.resolve(!1) : this._iframeStorage.canUseDomainData();
        },
        getDomainData: function (a) {
            return this._iframeStorage.getDomainData(a);
        }
    }, m.environment = m.environment || {
        _pageInBlackList: function (b) {
            a.postMessage({
                type: "MBR_ENVIRONMENT",
                command: "blacklist",
                value: b
            }, "*");
        },
        _sovetnikRemoved: function (b) {
            a.postMessage({
                type: "MBR_ENVIRONMENT",
                command: "removed",
                value: b
            }, "*");
        },
        _offerAccepted: function (b) {
            a.postMessage({
                type: "MBR_ENVIRONMENT",
                command: "offerAccepted",
                value: b
            }, "*");
        },
        _scriptStarted: function () {
            a.postMessage({
                type: "MBR_ENVIRONMENT",
                command: "scriptStarted"
            }, "*");
        },
        init: function () {
            m.hub.on("page:fullBlackList", this._pageInBlackList), m.hub.on("page:unknownHttpsSite", this._pageInBlackList), m.hub.on("script:removed", this._sovetnikRemoved), m.hub.on("script:offer", this._offerAccepted), m.hub.on("script:start", this._scriptStarted);
        }
    }, m.stats = m.stats || {
        _cacheStatsdCount: [],
        _cacheStatsdTimings: [],
        _statsDHost: m.config.getStatsDHost(),
        _sendStatsdMetric: function (a, b, c) {
            var d = m.xhr && m.xhr.isCORSSupported() || !m.JSONP ? m.xhr : m.JSONP;
            d.get(a, {
                name: b,
                value: c,
                client_id: m.settings.getClientId(),
                transaction_id: m.settings.getTransactionId()
            }, null, !0);
        },
        _getClid: function () {
            return m.settings && (m.settings.getClid && m.settings.getClid() || m.settings.getAffId && m.settings.getAffId());
        },
        _sendStatsdCount: function (a, b) {
            var c = this._statsDHost + "/count";
            if (a && b && this._cacheStatsdCount.push({
                    name: a,
                    value: b
                }), this._statsdInitialized)
                for (var d; this._cacheStatsdCount.length;)
                    d = this._cacheStatsdCount.shift(), this._sendStatsdMetric(c, d.name.replace("<clid>", this._getClid()), d.value);
        },
        _sendStatsdTiming: function (a, b) {
            var c = this._statsDHost + "/timing";
            if (a && b && this._cacheStatsdTimings.push({
                    name: a,
                    value: b
                }), this._statsdInitialized)
                for (var d; this._cacheStatsdTimings.length;)
                    d = this._cacheStatsdTimings.shift(), this._sendStatsdMetric(c, d.name.replace("<clid>", this._getClid()), d.value);
        },
        _getDomain: function () {
            return document.domain;
        },
        _getTypeView: function (a) {
            return "product" === a ? "PriceBar" : "avia" === a ? "AviaBar" : a;
        },
        trackShow: function (a) {
            var b = this._getTypeView(a).toLowerCase(), c = "suggest_script.<clid>.sitebar.<bar_type>.shown".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send PricebarIsShown");
        },
        trackPriceBarClose: function (a) {
            var b = this._getTypeView(a).toLowerCase(), c = "suggest_script.<clid>.sitebar.<bar_type>.closed.click".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send CloseButtonClick");
        },
        trackDisallowDomain: function (a) {
            var b = this._getTypeView(a).toLowerCase(), c = "suggest_script.<clid>.sitebar.<bar_type>.settings_dlg.disable_domain.checked".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send DisableForDomainClick");
        },
        trackClick: function (a, b, c) {
            var d = this._getTypeView(a).toLowerCase();
            if (a = this._getTypeView(a), c = this._getTypeView(c) || c, c === a) {
                var e = "suggest_script.<clid>.sitebar.<bar_type>.click".replace("<bar_type>", d);
                this._sendStatsdCount(e, 1);
            }
            m.log("send PriceBarClick");
        },
        trackOptInShow: function (a, b) {
            b = this._getTypeView(b).toLowerCase();
            var c = "suggest_script.<clid>.sitebar.<bar_type>.optin.shown".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send opt-in shown");
        },
        trackOptInAccept: function (a, b) {
            b = this._getTypeView(b).toLowerCase();
            var c = "suggest_script.<clid>.sitebar.<bar_type>.optin.accept".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send opt-in accept");
        },
        trackOptInDecline: function (a, b) {
            b = this._getTypeView(b).toLowerCase();
            var c = "suggest_script.<clid>.sitebar.<bar_type>.optin.decline".replace("<bar_type>", b);
            this._sendStatsdCount(c, 1), m.log("send opt in decline");
        },
        trackShowInfoPopup: function (a) {
            a = this._getTypeView(a).toLowerCase();
            var b = "suggest_script.<clid>.sitebar.<bar_type>.about_dlg.shown".replace("<bar_type>", a);
            this._sendStatsdCount(b, 1);
        },
        trackShowSettingsPopup: function (a) {
            a = this._getTypeView(a).toLowerCase();
            var b = "suggest_script.<clid>.sitebar.<bar_type>.settings_dlg.shown".replace("<bar_type>", a);
            this._sendStatsdCount(b, 1);
        },
        trackScriptAlreadyWorked: function () {
            var a = "lastAlreadyWorked", b = "suggest_script.<clid>.script.stopped.already_worked";
            this._sendStatsdCount(b, 1), m.storage.get(a).then(function (b) {
                var c = new Date().getTime();
                (!b || c - parseInt(b, 10) > 86400000) && m.storage.set(a, c);
            });
        },
        trackScriptDisabled: function (a) {
            var b = "suggest_script.<clid>.script.stopped.<reason>".replace("<reason>", a);
            if ("EulaNotAccepted" === a) {
                var c = "lastEulaNotAccepted";
                m.storage.get(c).then(function (a) {
                    var b = new Date().getTime();
                    (!a || b - parseInt(a, 10) > 86400000) && m.storage.set(c, b);
                });
            } else
                this._sendStatsdCount(b, 1);
            m.log("script stopped " + a);
        },
        trackShopListShown: function (a) {
            var b = a ? "shop_list" : "dress_carousel", c = "suggest_script.<clid>.popup.<popup_type>.shown".replace("<popup_type>", b);
            this._sendStatsdCount(c, 1), m.log("Shoplist is shown");
        },
        trackShopClick: function (a, b, c) {
            var d = c ? "shop_list" : "dress_carousel", e = "suggest_script.<clid>.popup.<popup_type>.offerslist.<type_click>.click".replace("<type_click>", a.toLowerCase()).replace("<popup_type>", d);
            this._sendStatsdCount(e, 1), m.log("shop clicked + " + a + " + " + b);
        },
        trackShopListCloseClick: function (a) {
            var b = a ? "shop_list" : "dress_carousel", c = "suggest_script.<clid>.popup.<popup_type>.closed.click".replace("<popup_type>", b);
            this._sendStatsdCount(c, 1);
        },
        trackTiming: function (b, c) {
            if ("start" === c)
                this._cacheStartTime = b;
            else if ("server" === c)
                this._cacheServerResponseTime = b;
            else if ("show" === c && a.performance && a.performance.timing) {
                var d = a.performance.timing.responseEnd, e = a.performance.timing.domContentLoadedEventStart, f = a.performance.timing.loadEventStart;
                d && (this._sendStatsdTiming("suggest_script.<clid>.script.startTime.AfterResponseEnd", this._cacheStartTime - d), this._sendStatsdTiming("suggest_script.<clid>.script.showTime.AfterResponseEnd", b - d)), e && (this._sendStatsdTiming("suggest_script.<clid>.script.startTime.AfterDOMContentLoaded", this._cacheStartTime - e), this._sendStatsdTiming("suggest_script.<clid>.script.showTime.AfterDOMContentLoaded", b - e)), f && (this._sendStatsdTiming("suggest_script.<clid>.script.startTime.AfterOnLoad", this._cacheStartTime - f), this._sendStatsdTiming("suggest_script.<clid>.script.showTime.AfterOnLoad", b - f)), this._cacheServerResponseTime && this._sendStatsdTiming("suggest_script.<clid>.script.serverTime.ResponseTime", this._cacheServerResponseTime);
            }
        },
        trackAbTestInfo: function (a) {
            for (var b in a)
                if (a.hasOwnProperty(b)) {
                    var c = "suggest_script.<clid>.script.abtest." + b + "." + a[b];
                    this._sendStatsdCount(c, 1);
                }
        },
        trackUnacceptableAction: function (a) {
            var b = this._statsDHost + "/count", c = "suggest_script.<clid>.script.error." + a;
            c = c.replace("<clid>", this._getClid()), this._sendStatsdMetric(b, c, 1), m.log("Unacceptable action");
        },
        trackWrongProduct: function () {
            var a = this._statsDHost + "/count", b = "suggest_script.<clid>.script.wrong_product".replace("<clid>", this._getClid());
            this._sendStatsdMetric(a, b, 1), m.log("track wrong product");
        },
        init: function () {
            this._initialized || (this._initialized = !0, m.hub.on("pricebar:show", this.trackShow, null, this), m.hub.on("pricebar:close", this.trackPriceBarClose, null, this), m.hub.on("pricebar:disallowDomain", this.trackDisallowDomain, null, this), m.hub.on("pricebar:click", this.trackClick, null, this), m.hub.on("pricebar:optInShow", this.trackOptInShow, null, this), m.hub.on("pricebar:optInAccept", this.trackOptInAccept, null, this), m.hub.on("pricebar:optInDecline", this.trackOptInDecline, null, this), m.hub.on("pricebar:showInfoPopup", this.trackShowInfoPopup, null, this), m.hub.on("pricebar:showSettingsPopup", this.trackShowSettingsPopup, null, this), m.hub.once("script:disabled", this.trackScriptDisabled, null, this), m.hub.on("script:alreadyWorked", this.trackScriptAlreadyWorked, null, this), m.hub.on("shop:openList", this.trackShopListShown, null, this), m.hub.on("shop:opened", this.trackShopClick, null, this), m.hub.on("shop:closeButtonClicked", this.trackShopListCloseClick, null, this), m.hub.on("script:start", function (a) {
                this.trackTiming(a, "start");
            }, null, this), m.hub.on("pricebar:render", function (a) {
                this.trackTiming(a, "show");
            }, null, this), m.hub.on("server:responseEnd", function (a) {
                this.trackTiming(a, "server");
            }, null, this), m.hub.on("statsd:init", function () {
                m.settings.isStatsEnabled() ? (this._statsdInitialized = !0, this._sendStatsdCount(), this._sendStatsdTiming()) : m.log("stats disabled");
            }, null, this), m.hub.on("suggest:abtest", function (a) {
                this.trackAbTestInfo(a);
            }, null, this), m.hub.on("script:unacceptableAction", function (a) {
                this.trackUnacceptableAction(a);
            }, null, this), m.hub.on("script:wrongProduct", this.trackWrongProduct, null, this));
        }
    };
    var r = m.stats.init.bind(m.stats);
    m.stats.init = function () {
        "object" == typeof yandexElementsSovetnik && yandexElementsSovetnik.isStatEnabled() && r();
    }, m.suggest = m.suggest || {
        _host: m.config.getApiHost(),
        _addScriptDataToParams: function (a) {
            var b = {}, c = m.settings.getAffId && m.settings.getAffId(), d = m.settings.getClid && m.settings.getClid(), e = m.settings.getAppVersion && m.settings.getAppVersion(), f = m.settings.getAffSub && m.settings.getAffSub(), g = m.settings.getSource && m.settings.getSource(), h = m.settings.getRegion && m.settings.getRegion(), i = m.settings.getCountryId && m.settings.getCountryId(), j = m.settings.getClientId && m.settings.getClientId(), k = m.settings.needShowOffer && m.settings.needShowOffer(), l = m.settings.getFirstStartTime && m.settings.getFirstStartTime(), n = m.settings.getActivateTime && m.settings.getActivateTime(), o = m.settings.getTransactionId && m.settings.getTransactionId(), p = m.settings.isShop && m.settings.isShop();
            d ? b.clid = d : b.aff_id = c, e && (b.v = e), f && (b.aff_sub = f), g && (b.source = g), h && (b.region = h), i && (b.country = i), j && (b.clientid = j), k && (b.opt_in = k), n && (b.activate_time = n), l && (b.first_run = l), o && (b.transaction_id = o), p && (b.is_shop = !0), b.referrer = m.settings.getReferrer();
            for (var q in a)
                a.hasOwnProperty(q) && (b[q] = a[q]);
            return b;
        },
        _getNetProvider: function () {
            return m.xhr && m.xhr.isCORSSupported() || !m.JSONP ? m.xhr : m.JSONP;
        },
        _getURL: function (a, b) {
            var c, d = -1 === (a || "").indexOf("?") ? "?" : "&";
            b = b || {};
            var e = [];
            for (c in b)
                b.hasOwnProperty(c) && e.push(encodeURIComponent(c) + "=" + encodeURIComponent(b[c]));
            return d += e.join("&"), a + d;
        },
        getProductOffers: function (a) {
            m.log("get offers");
            var b = {};
            a.productPrice > 0 && (b.price = a.productPrice), a.modelId && (b.model_id = a.modelId), a.productName && (b.text = a.productName), a.url && (b.url = a.url), a.currency && (b.currency = a.currency), b = this._addScriptDataToParams(b), b.other_reg = !(!m.settings.isOtherRegionsEnabled || !m.settings.isOtherRegionsEnabled()), b.method = a.method, m.log("get lowest price"), m.log(b);
            var c = this._getNetProvider();
            return a.query = this._getURL(this._host + "/products?", b), new m.Promise(function (d, e) {
                c.get(a.query, null, function (c) {
                    c.bucketInfo && m.hub.trigger("suggest:abtest", c.bucketInfo), !c.error && c.offers && c.offers.length && c.offers[0].price ? (c.original = a, c.offers = c.offers.map(function (a) {
                        if (b.price) {
                            var c = parseInt(a.price.value, 10);
                            a.price.isHigherThanCurrent = c > b.price, a.price.isEqualToCurrent = c === b.price, a.price.isLowerThanCurrent = c < b.price;
                        }
                        return a;
                    }), c.method = a.method, m.log("offers found"), m.log(c), m.hub.trigger("suggest:productOfferFound", c), d(c)) : (m.log("have not offers"), e(c));
                });
            });
        },
        getFlights: function (a) {
            if (m.log(a), a.origin && a.destination && a.departure_at && a.return_at) {
                var b = {
                    origin: a.origin,
                    destination: a.destination,
                    departure_at: a.departure_at,
                    return_at: a.return_at,
                    url: a.url
                };
                a.price && (b.price = a.person ? a.price / a.person : a.price), a.currency && (b.currency = a.currency), b = this._addScriptDataToParams(b);
                var c = this._getNetProvider();
                return a.query = this._getURL(this._host + "/avia?", b), new m.Promise(function (b, d) {
                    c.get(a.query, null, function (c) {
                        c && c.avia && c.avia.length ? (c.avia[0].original = a, m.log("avia found"), m.log(c), m.hub.trigger("suggest:aviaFound", c.avia[0]), b(c)) : d(c);
                    });
                });
            }
            return m.Promise.reject();
        },
        getProductOfferByURL: function (a) {
            m.log("get offers by url");
            var b = {};
            a.url && (b.url = a.url), a.price && (b.price = a.price), b.method = a.method || "url-search", b = this._addScriptDataToParams(b), m.log("get product offer by url"), m.log(b);
            var c = this._getNetProvider();
            return b.query = this._getURL(this._host + "/products?", b), new m.Promise(function (d, e) {
                c.get(b.query, null, function (c) {
                    if (!c.error && c.offers && c.offers.length && c.offers[0].price) {
                        c.original = a;
                        var f = c.convertedPrice || b.price;
                        c.offers = c.offers.map(function (a) {
                            if (f) {
                                var b = parseInt(a.price.value, 10);
                                a.price.isHigherThanCurrent = b > f, a.price.isEqualToCurrent = b === f, a.price.isLowerThanCurrent = f > b;
                            }
                            return a;
                        }), c.method = b.method, m.log("offers found"), m.log(c), m.hub.trigger("suggest:productOfferFound", c), d(c);
                    } else
                        m.log("have not offers"), e(c);
                });
            });
        }
    }, m.customSelectors = {
        "aliexpress.com": {
            _tryGetEnglishName: function (a) {
                if (a = a || [], a = a.filter(function (a) {
                        return "oem" !== a && "new" !== a && -1 === a.indexOf("Другой");
                    }), !a.length)
                    return "";
                var b = /[а-яА-Я]/, c = a.filter(function (a) {
                        return !b.test(a);
                    });
                return c.length ? c[0] : a[0].indexOf("Яблоко") > -1 || a[0].indexOf("яблоко") > -1 ? "Apple" : a[0];
            },
            _getNameByCategoryRegex: function (a, b) {
                return this._tryGetEnglishName(a.filter(function (a) {
                    return b.test(a.innerHTML);
                }).map(function (a) {
                    return m.tools.getTextContents(a.querySelector("dd")).toLowerCase();
                }));
            },
            getName: function (a) {
                var b = "", c = /^(Фирменное\sнаименование)|(Производитель)|(>Brand)/, d = /(Model)|(моделирует)|(Модел)/, e = /(ПЗУ)|(ROM)/, f = [].slice.call(a.querySelectorAll("#product-desc .product-params .ui-box-body .ui-attr-list"));
                if (f && f.length) {
                    var g = this._getNameByCategoryRegex(f, c), h = this._getNameByCategoryRegex(f, d), i = this._getNameByCategoryRegex(f, e);
                    g && h && !h.match(/другой/i) && (-1 === h.indexOf(g) && (b = g + " "), b += h, i && (/\dg$/.test(i) && (i += "b"), b += " " + i));
                }
                return b;
            }
        },
        "videoigr.net": {
            getName: function (a) {
                var b, c = a.querySelector("tbody>tr>.pageHeading:nth-of-type(1) br"), d = a.querySelector("tbody>tr>.pageHeading:nth-of-type(1)");
                return b = c && c.previousSibling.textContent, b || (b = d ? m.tools.getTextContents(d) : ""), d && m.hub.trigger("productName:found", d), b;
            }
        }
    }, m.priceParser = m.priceParser || {
        _getProductPriceBySchema: function (a) {
            var b = 0, c = m.tools.getUniqueElements("[itemtype=\"http://schema.org/Product\"],[itemtype=\"http://schema.org/Offer\"],[itemtype=\"http://data-vocabulary.org/Product\"],[xmlns\\:gr=\"http://purl.org/goodrelations/v1#\"]");
            if (c.length) {
                var d = c[0], e = d.querySelector("[itemprop=price]") || d.querySelector("[itemprop=average]") || d.querySelector("[itemprop=lowPrice]") || d.querySelector("[property=\"gr:hasCurrencyValue\"]");
                e && (m.hub.trigger("productPrice:found", e), b = m.tools.priceAnalyze(e.textContent || e.text || e.getAttribute("content")), b = Number(b), b = b || 0);
            }
            return b;
        },
        _getProductCurrencyBySchema: function (a) {
            var b, c = m.tools.getUniqueElements("[itemtype=\"http://schema.org/Product\"],[itemtype=\"http://schema.org/Offer\"],[itemtype=\"http://data-vocabulary.org/Product\"],[xmlns\\:gr=\"http://purl.org/goodrelations/v1#\"]");
            if (c.length) {
                var d = c[0], e = d.querySelector("[itemprop=priceCurrency]") || d.querySelector("[itemprop=currency]"), f = d.querySelector("[itemprop=price]") || d.querySelector("[itemprop=average]") || d.querySelector("[itemprop=lowPrice]") || d.querySelector("[property=\"gr:hasCurrencyValue\"]");
                e ? b = e.getAttribute("content") || e.textContent || e.text : f && (b = f.getAttribute("content") || f.textContent || f.text, b = m.tools.getCurrencyFromStr(b), b || (b = f.parentNode.getAttribute("content") || f.parentNode.textContent || f.parentNode.text, b = m.tools.getCurrencyFromStr(b))), b && (b = b.replace(/[a-z]/g, function (a) {
                    return a.toUpperCase();
                }).replace(/[^A-Z]/g, ""));
            }
            return b;
        },
        _getProductPriceByHProduct: function (a) {
            var b = 0, c = m.tools.getUniqueElements(".hproduct .price");
            if (c.length) {
                var d = c[0];
                m.hub.trigger("productPrice:found", d), b = m.tools.priceAnalyze(d.textContent || d.text || d.getAttribute("content")), b = Number(b), b = b || 0;
            }
            return b;
        },
        _getProductCurrencyByHProduct: function (a) {
            var b, c = m.tools.getUniqueElements(".hproduct .price");
            if (c.length) {
                var d = c[0];
                b = m.tools.getCurrencyFromStr(d.innerHTML), b || (b = m.tools.getCurrencyFromStr(d.parentNode.innerHTML));
            }
            return b;
        },
        _getProductPriceByDefaultSelector: function (a) {
            var b;
            return b = m.tools.getDifferentElement(".price"), b ? (m.hub.trigger("productPrice:found", b), b = m.tools.getTextContents(b), b ? (b = m.tools.priceAnalyze(b), b = Number(b) || 0) : b = 0, b) : 0;
        },
        _getPriceBySelector: function (a, b) {
            var c = 0, d = a.querySelector(b);
            if (d && (m.hub.trigger("productPrice:found", d), d.getAttribute && (c = d.getAttribute("data-price")), !c)) {
                var e = m.tools.getTextContents(d) || d.getAttribute("value");
                e = m.tools.priceAnalyze(e), e = Number(e), c = e || 0;
            }
            return c;
        },
        _getCurrencyBySelector: function (a, b) {
            var c, d = a.querySelector(b);
            return d && (c = m.tools.getCurrencyFromStr(d.innerHTML), c || (c = m.tools.getCurrencyFromStr(d.parentNode.innerHTML))), c;
        },
        getProductPrice: function (a) {
            var b = m.tools.getHostname(a), c = 0, d = m.settings.getSelector();
            return m.settings.canExtractPrice(b) && (d && (d.priceSelector ? c = this._getPriceBySelector(a, d.priceSelector) : d.getPrice && (c = d.getPrice(a))), c = c || this._getProductPriceBySchema(a) || this._getProductPriceByHProduct(a) || this._getProductPriceByDefaultSelector(a)), c;
        },
        getCurrency: function (a) {
            var b, c = m.settings.getSelector();
            return b = this._getCurrencyBySelector(a, c && (c.currencySelector || c.priceSelector) || ".price"), b = b || c && c.getCurrency && c.getCurrency(a), b = b || this._getProductCurrencyBySchema(a) || this._getProductCurrencyByHProduct(a);
        }
    }, m.selectorsParser = m.selectorsParser || {
        _canParse: function (a) {
            return m.settings.isProductSuggestEnabled(a);
        },
        _getNameBySelector: function (b, c) {
            for (var d = c.split(","), e = null; d.length;) {
                c = d.shift();
                var f = a.document.querySelectorAll(c);
                if (1 == f.length) {
                    var g = f[0];
                    if (m.hub.trigger("productName:found", g), e = m.tools.getTextContents(g) || g.getAttribute("value"))
                        return e;
                }
            }
            return e;
        },
        _parse: function (a, b) {
            var c, d = {};
            return b.getName && (c = b.getName(a)), !c && b.nameSelector && (c = this._getNameBySelector(a, b.nameSelector)), c ? (d.name = c, d.price = this.getProductPrice(a), d.currency = this.getCurrency(a), d) : (m.hub.trigger("parser:notFound", { domain: m.tools.getHostname(a) }), null);
        },
        run: function (a) {
            var b = m.tools.getHostname(a);
            if (this._canParse(b)) {
                m.log("selectors run!");
                var c = m.settings.getSelector();
                if (c && (c.nameSelector || c.getName)) {
                    var d = this._parse(a, c);
                    if (d)
                        return m.log("Name: " + d.name + "; Price: " + d.price + "; Currency " + d.currency), m.suggest.getProductOffers({
                            productName: d.name,
                            productPrice: d.price,
                            currency: d.currency,
                            url: a.URL,
                            method: "selectors"
                        });
                }
            }
            return m.Promise.reject();
        }
    }, m.tools.mixin(m.selectorsParser, m.priceParser), m.microdataParser = m.microdataParser || {
        _canParse: function (a) {
            return m.settings.isProductSuggestEnabled(a) && m.settings.canUseMicrodata(a);
        },
        _getProductNameBySchema: function (a) {
            var b = null, c = m.tools.getUniqueElements("[itemtype=\"http://schema.org/Product\"],[itemtype=\"http://schema.org/Offer\"],[itemtype=\"http://data-vocabulary.org/Product\"],[xmlns\\:gr=\"http://purl.org/goodrelations/v1#\"]");
            if (c.length) {
                var d = c[0];
                if (d.getAttribute("itemref"))
                    return;
                var e = d.querySelectorAll("[itemprop=name],[property=\"gr:name\"]");
                if ([].forEach.call(e, function (a) {
                        b = b || a.getAttribute("content") || a.textContent || a.text || "";
                    }), e.length && m.hub.trigger("productName:found", e[0]), !b)
                    return null;
                b = b.replace(/\,/g, " ");
                var f = d.querySelector("[itemprop=brand]");
                if (f) {
                    var g = f.textContent || f.text || f.getAttribute("content");
                    g && (b = 0 !== b.indexOf(g) ? g + " " + b : b.replace(g, g + " "));
                }
            }
            return b;
        },
        _getProductNameByHProduct: function (a) {
            var b = null, c = m.tools.getUniqueElements(".hProduct,.hproduct");
            if (c.length) {
                var d = c[0], e = d.querySelectorAll(".fn");
                [].forEach.call(e, function (a) {
                    b = b || a.getAttribute("content") || a.textContent || a.text || "";
                }), e.length && m.hub.trigger("productName:found", e[0]), b = b.replace(/\,/g, " ");
                var f = d.querySelector(".brand");
                if (f) {
                    var g = f.textContent || f.text || f.getAttribute("content");
                    b = 0 !== b.indexOf(g) ? g + " " + b : b.replace(g, g + " ");
                }
            }
            return b;
        },
        _parse: function (a) {
            var b, c = this._getProductNameBySchema(a);
            if (c ? b = "microdata" : (c = this._getProductNameByHProduct(a), c && (b = "hproduct")), !c)
                return null;
            var d = this.getProductPrice(a), e = this.getCurrency(a);
            return {
                name: c,
                price: d,
                currency: e
            };
        },
        run: function (a) {
            var b = m.tools.getHostname(a);
            if (this._canParse(b)) {
                m.log("md.run!");
                var c = this._parse(a);
                if (c)
                    return m.log("Product name = " + c.name + " price = " + c.price), m.suggest.getProductOffers({
                        productName: c.name,
                        productPrice: c.price,
                        currency: c.currency,
                        url: a.URL,
                        method: "microdata"
                    });
            }
            return m.Promise.reject();
        }
    }, m.tools.mixin(m.microdataParser, m.priceParser), m.cmsParser = m.cmsParser || {
        _selectors: [
            {
                selector: "link[href*=\"bitrix/\"]",
                cms: "1C-Bitrix"
            },
            {
                selector: "meta[content*=\"Amiro.CMS\"]",
                cms: "Amiro.CMS"
            },
            {
                selector: "[umi\\:field-name],html[xmlns\\:umi*=\"umi-cms.ru\"]",
                cms: "UMI.CMS",
                product: "[umi\\:field-name=\"h1\"]",
                price: "[umi\\:field-name=\"price\"]"
            },
            {
                selector: "meta[content*='AdVantShop.NET']",
                cms: "AdVantShop.NET"
            },
            {
                selector: "meta[content*='PHPSHOP']",
                cms: "PHPShop"
            },
            {
                selector: "link[href*=\"insales.ru\"]",
                cms: "InSales"
            },
            {
                selector: "h1.mainbox-title",
                cms: "CS-Cart",
                product: "h1.mainbox-title"
            },
            {
                cms: "PrestaShop",
                selector: "meta[content*='PrestaShop']"
            },
            {
                cms: "OsCommerce",
                selector: "link[rel=\"stylesheet\"][href^=\"templates/\"][href$=\"/stylesheet.css\"]"
            },
            {
                cms: "Joomla!",
                selector: "meta[content*='Joomla']"
            },
            {
                cms: "WordPress",
                selector: "meta[content*='WordPress']"
            },
            {
                selector: "script[src*=\"drupal\"]",
                cms: "Drupal"
            }
        ],
        _canParse: function (a) {
            return m.settings.isProductSuggestEnabled(a) && m.settings.canCheckCMS(a);
        },
        _getCMS: function (a) {
            for (var b = 0; b < this._selectors.length; b++)
                if (this._selectors[b].selector && a.querySelector(this._selectors[b].selector))
                    return this._selectors[b];
            return null;
        },
        _getProductName: function (a, b) {
            var c = b.product || "h1", d = a.querySelector(c);
            return d ? m.tools.getTextContents(d) : null;
        },
        _getProductPriceBySelector: function (a, b) {
            if (b) {
                var c = a.querySelector(b);
                if (c) {
                    var d = m.tools.getTextContents(c);
                    return d = m.tools.priceAnalyze(d), d = Number(d) || 0;
                }
            }
            return 0;
        },
        run: function (a) {
            var b = m.tools.getHostname(a);
            if (this._canParse(b)) {
                m.log("cms.run!");
                var c = this._getCMS(a);
                if (c) {
                    m.log("find cms = " + c.cms);
                    var d = this._getProductName(a, c);
                    if (d) {
                        var e = this._getProductPriceBySelector(a, c.price) || this.getProductPrice(a), f = this.getCurrency(a);
                        if (e)
                            return m.log("Product name = " + d + " price = " + e), m.suggest.getProductOffers({
                                productName: d,
                                productPrice: e,
                                currency: f,
                                url: a.URL,
                                method: "cms"
                            });
                        m.log("price not found");
                    }
                }
            }
            return m.Promise.reject();
        }
    }, m.tools.mixin(m.cmsParser, m.priceParser), m.aviaParser = m.aviaParser || {
        _sites: [
            {
                name: "aeroflot",
                urlRE: /https?:\/\/reservation\.aeroflot\.ru/,
                domain: "reservation.aeroflot.ru",
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = 10, e = function () {
                                if (!d)
                                    return void b(n);
                                d -= 1;
                                var c = a.querySelector("[name=\"itineraryParts[0].departureAirport\"]"), f = a.querySelector("[name=\"itineraryParts[0].arrivalAirport\"]"), g = a.querySelector("#outbounds .active .date"), h = a.querySelector("#inbounds .active .date"), i = a.querySelector("#outbounds .active .prices-amount"), j = a.querySelector("#inbounds .active .prices-amount"), k = a.querySelector("#outbounds .active .currency"), l = a.querySelector("#ADT_id");
                                if (c && f && g && h && i && j && l && k) {
                                    var n = {};
                                    if (n.origin = c.value, n.destination = f.value, n.departure_at = g.getAttribute("data-wl-date").split(" ")[0].replace(/\//g, "-"), n.return_at = h.getAttribute("data-wl-date").split(" ")[0].replace(/\//g, "-"), n.price = parseInt(m.tools.priceAnalyze(i.innerText || i.textContent), 10) + parseInt(m.tools.priceAnalyze(j.innerText || j.textContent), 10), n.person = l.getAttribute("data-wl-value"), n.currency = k.innerText || k.textContent, n.origin && n.destination && n.departure_at && n.return_at && n.price && n.person && n.currency)
                                        return void b(n);
                                }
                                setTimeout(e, 500);
                            };
                        e();
                    });
                }
            },
            {
                name: "s7",
                urlRE: /ibe\.s7\.ru\/S7\/webqtrip\.html/,
                domain: "ibe.s7.ru",
                months: {
                    "Январь": "01",
                    "Февраль": "02",
                    "Март": "03",
                    "Апрель": "04",
                    "Май": "05",
                    "Июнь": "06",
                    "Июль": "07",
                    "Август": "08",
                    "Сентябрь": "09",
                    "Октябрь": "10",
                    "Ноябрь": "11",
                    "Декабрь": "12",
                    January: "01",
                    February: "02",
                    March: "03",
                    April: "04",
                    May: "05",
                    June: "06",
                    July: "07",
                    August: "08",
                    September: "09",
                    October: "10",
                    November: "11",
                    December: "12"
                },
                getInfo: function (a) {
                    var b, c, d, e, f = a.querySelectorAll(".route_details_left .col_2");
                    if (!(f && f.length > 1))
                        return m.Promise.reject();
                    b = f[0], c = f[1];
                    var g = a.querySelectorAll(".route_details_right .col_2")[1];
                    if (b && c) {
                        var h = /\((.+?)\).+?\((.+?)\)/, i = h.exec(m.tools.getTextContents(b));
                        i && i.length > 2 && (d = i[1], e = i[2]), c = m.tools.getTextContents(c), c = c.split(" "), c[1] = this.months[c[1]], c = c[2] + "-" + c[1] + "-" + c[0];
                    }
                    var j = {
                        origin: d,
                        destination: e,
                        departure_at: c
                    };
                    return g && (g = m.tools.getTextContents(g), g = g.split(" "), g[1] = this.months[g[1]], g[0] = 1 === g[0].length ? "0" + g[0] : g[0], g = g[2] + "-" + g[1] + "-" + g[0], j.return_at = g), new m.Promise(function (b) {
                        var c = 10, d = "#totalAmountWithOutDiscount", e = function () {
                                if (!c)
                                    return void b(j);
                                c -= 1;
                                var f = a.querySelector(d);
                                f && (f.innerText || f.textContent) ? (j.price = parseInt((f.innerText || f.textContent).replace(/\D/g, ""), 10), b(j)) : setTimeout(e, 500);
                            };
                        e();
                    });
                }
            },
            {
                name: "ozon.travel",
                urlRE: /ozon\.travel\/flight\/search\//,
                domain: "ozon.travel",
                getInfo: function (a) {
                    var b, c = a.URL, d = /flight\/search\/([a-z]{3})([a-z]{3})(?:[a-z]{6}){0,1}\/d(\d{4}\-\d{2}\-\d{2})(?:d(\d{4}\-\d{2}\-\d{2}))?/, e = d.exec(c);
                    return e && e.length > 3 ? (b = {
                        origin: e[1].toUpperCase(),
                        destination: e[2].toUpperCase(),
                        departure_at: e[3],
                        person: parseInt(m.tools.getQueryParam(c, "Dlts"), 10) || 1
                    }, e.length > 4 && (b.return_at = e[4]), new m.Promise(function (c) {
                        var d = 30, e = ".tariff big", f = function () {
                                if (!d)
                                    return void c(b);
                                d -= 1;
                                var g = a.querySelector(e);
                                if (g) {
                                    var h = "RUR";
                                    g.innerHTML.indexOf("$") > -1 ? h = "USD" : g.innerHTML.indexOf("€") > -1 && (h = "EUR"), b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10), b.currency = h, c(b);
                                } else
                                    setTimeout(f, 500);
                            };
                        f();
                    })) : m.Promise.reject();
                }
            },
            {
                name: "avia.travel.ru",
                domain: "avia.travel.ru",
                urlRE: /\.avia\.travel\.ru\/flights/,
                getInfo: function (a) {
                    return new m.Promise(function (b) {
                        var c = ".TPWL-ticket-price", d = ".TPWL-realtime_progressbar.ui-progressbar", e = /([A-Z]{3})$/, f = function () {
                                var g = a.querySelector(c), h = a.querySelector(d);
                                if (!h || 0 == h.offsetWidth && 0 == h.offsetHeight) {
                                    var i = a.URL, j = /\.avia\.travel\.ru\/flights\/([A-Z]{3})(\d{2})(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d)/, k = j.exec(i), l = {
                                            origin: k[1],
                                            destination: k[4],
                                            person: +k[7]
                                        }, n = k[2], o = k[3], p = k[5], q = k[6], r = new Date().getFullYear(), s = m.tools.isMonthOfNextYear(parseInt(o, 10)) ? r + 1 : r, t = m.tools.isMonthOfNextYear(parseInt(q, 10)) || m.tools.isMonthOfNextYear(parseInt(o, 10)) ? r + 1 : r;
                                    if (l.departure_at = s + "-" + o + "-" + n, l.return_at = t + "-" + q + "-" + p, g) {
                                        var k = e.exec(g.innerHTML);
                                        k && k.length > 1 && (l.currency = k[1]), l.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10);
                                    }
                                    b(l);
                                } else
                                    setTimeout(f, 500);
                            };
                        f();
                    });
                }
            },
            {
                name: "transaero.ru",
                urlRE: /https?:\/\/(?:www\.)?transaero\.ru\/wps\/portal\//,
                domain: "transaero.ru",
                getInfo: function (a) {
                    var b = (a.URL, {}), c = /\(([A-Z]+)\).+?\(([A-Z]+)\)/, d = /(\d{2})\-(\d{2})\-(\d{4})/, e = a.getElementById("onewayItin"), f = a.getElementById("onewayDepartureDateTime"), g = a.getElementById("returnwayDepartureDateTime");
                    if (e && f) {
                        var h = c.exec(e.innerText || e.textContent);
                        if (h && 3 === h.length && (b.origin = h[1], b.destination = h[2], h = d.exec(f.innerText || f.textContent), h && 4 === h.length))
                            return b.departure_at = h[3] + "-" + h[2] + "-" + h[1], g && (h = d.exec(g.innerText || g.textContent), h && 4 === h.length && (b.return_at = h[3] + "-" + h[2] + "-" + h[1])), new m.Promise(function (c) {
                                var d = 30, e = ".totalPrice > table > tbody > tr > td", f = function () {
                                        if (!d)
                                            return void c(b);
                                        d -= 1;
                                        var g = a.querySelector(e);
                                        g && (g.innerText || g.textContent) ? (b.price = parseInt(g.innerText || g.textContent, 10), c(b)) : setTimeout(f, 500);
                                    };
                                f();
                            });
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "sale.transaero.ru",
                urlRE: /sale\.transaero\.ru\/step/,
                domain: "sale.transaero.ru",
                getInfo: function (a) {
                    var b = a.URL, c = a.referrer, d = {
                            origin: m.tools.getQueryParam(b, "departureAirportCode") || m.tools.getQueryParam(c, "departureAirportCode") || m.tools.getQueryParam(b, "origin") || m.tools.getQueryParam(c, "origin"),
                            destination: m.tools.getQueryParam(b, "arrivalAirportCode") || m.tools.getQueryParam(c, "arrivalAirportCode") || m.tools.getQueryParam(b, "destination") || m.tools.getQueryParam(c, "destination"),
                            departure_at: m.tools.getQueryParam(b, "departureDate") || m.tools.getQueryParam(c, "departureDate"),
                            person: +(m.tools.getQueryParam(b, "adultsNum") || m.tools.getQueryParam(c, "adultsNum") || m.tools.getQueryParam(b, "numAdults") || m.tools.getQueryParam(c, "numAdults")),
                            return_at: m.tools.getQueryParam(b, "returnDate") || m.tools.getQueryParam(c, "returnDate")
                        };
                    return d.origin && d.destination && d.departure_at && d.return_at ? new m.Promise(function (b) {
                        var c = "#summaryTable td", e = 200, f = function () {
                                if (!e--)
                                    return void b(d);
                                var g = a.querySelectorAll(c);
                                g && g.length ? (g = g[g.length - 1], d.price = parseInt(m.tools.priceAnalyze(g.innerText || g.textContent), 10), d.currency = m.tools.getCurrencyFromStr(g.innerText || g.textContent), b(d)) : setTimeout(f, 1000);
                            };
                        f();
                    }) : m.Promise.reject(d);
                }
            },
            {
                name: "avia.tutu.ru",
                urlRE: /avia\.tutu\.ru\/offers\/\?/,
                domain: "avia.tutu.ru",
                getInfo: function (a) {
                    function b(a) {
                        return a && !/[А-Я]/i.test(a);
                    }
                    for (var c, d = a.URL.substr(a.URL.indexOf("?") + 1), e = d.split("&"), f = {
                                city_name_from: null,
                                city_name_to: null,
                                date_forward: null,
                                date_back: null,
                                passengers: ""
                            }, g = 0; g < e.length; g++)
                        e[g] = e[g].split("="), e[g][0] in f && (f[e[g][0]] = decodeURIComponent(e[g][1]), f[e[g][0]] = f[e[g][0]].split(" ")[0]);
                    if (!b(f.city_name_from) || !b(f.city_name_to)) {
                        var h = a.querySelector(".rm-page-container~script");
                        if (h) {
                            var i = h.innerHTML;
                            if (i = i.substring(i.indexOf("{\"from"), i.indexOf(",\"debugInfo"))) {
                                var j = JSON.parse(i);
                                j && (f.city_name_from = j.from[0].iata, f.city_name_to = j.to[0].iata), f.date_forward && f.date_back || (f.date_forward = j.date[0], f.date_back = j.date[1]);
                            }
                        }
                    }
                    return f.city_name_from && f.city_name_to && f.date_forward ? (c = {
                        origin: f.city_name_from,
                        destination: f.city_name_to,
                        departure_at: f.date_forward.split(".").reverse().join("-")
                    }, f.date_back && (c.return_at = f.date_back.split(".").reverse().join("-")), new m.Promise(function (b) {
                        var d = ".b-promostamp.b-promostamp-bestprice ~ .b-buttonext-avia > .buttonext_rows > .buttonext_digits", e = ".b-clouds_wait", g = function () {
                                var h = a.querySelector(d), i = a.querySelector(e);
                                h && !i ? (c.price = parseInt((h.innerText || h.textContent).replace(/\D/g, ""), 10), c.person = parseInt(f.passengers[0], 10) || 1, b(c)) : setTimeout(g, 500);
                            };
                        g();
                    })) : m.Promise.reject();
                }
            },
            {
                name: "travelwith.s7.ru",
                domain: "travelwith.s7.ru",
                urlRE: /travelwith\.s7\.ru\/(?:selectExactDateSearchFlights|selectFlexibleSearchFlights)\.action/,
                getInfo: function (a) {
                    var b, c = a.URL;
                    if (b = {
                            origin: m.tools.getQueryParam(c, "DA1"),
                            destination: m.tools.getQueryParam(c, "AA1"),
                            departure_at: m.tools.getQueryParam(c, "DD1"),
                            person: +m.tools.getQueryParam(c, "TA"),
                            return_at: m.tools.getQueryParam(c, "DD2") || void 0,
                            currency: m.tools.getQueryParam(c, "CUR")
                        }, b.origin && b.destination && b.departure_at && b.person > 0) {
                        var d = a.querySelector(".amount b");
                        if (d) {
                            var e = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(d)), 10);
                            e && (b.price = e);
                        }
                        return m.Promise.resolve(b);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "onetwotrip.com",
                domain: "onetwotrip.com",
                urlRE: /onetwotrip\.com\/.*(\d{2})(\d{2})([A-Z]{3})([A-Z]{3})(\d{2})(\d{2}).*&s$/,
                getInfo: function (a) {
                    var b, c, d = a.URL, e = this.urlRE.exec(d), f = {
                            origin: e[3],
                            destination: e[4],
                            person: 1
                        }, g = e[1], h = e[2], i = e[5], j = e[6], k = new Date();
                    if (b = m.tools.isMonthOfNextYear(parseInt(h, 10)) ? k.getFullYear() + 1 : k.getFullYear(), c = m.tools.isMonthOfNextYear(parseInt(j, 10)) || m.tools.isMonthOfNextYear(parseInt(h, 10)) ? k.getFullYear() + 1 : k.getFullYear(), f.departure_at = b + "-" + h + "-" + g, f.return_at = c + "-" + j + "-" + i, f.origin && f.destination && f.departure_at && f.return_at) {
                        var l = a.querySelector(".direction_price span:not(.min_priceword)");
                        if (l) {
                            var n = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(l)), 10);
                            n && (f.price = n);
                            var o = a.querySelector("#CurrenciesBlock .d_option .selected");
                            o && (f.currency = o.getAttribute("data-cur"));
                        }
                        return m.Promise.resolve(f);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "anywayanyday.com",
                domain: "anywayanyday.com",
                urlRE: /anywayanyday\.com\/avia\/offers\/(\d{2})(\d{2})([A-Z]{3})([A-Z]{3})(\d{2})(\d{2})[A-Z]{6}AD(\d+)/,
                getInfo: function (a) {
                    var b, c, d = a.URL, e = this.urlRE.exec(d), f = {
                            origin: e[3],
                            destination: e[4],
                            person: +e[7]
                        }, g = e[1], h = e[2], i = e[5], j = e[6], k = new Date();
                    return b = m.tools.isMonthOfNextYear(parseInt(h, 10)) ? k.getFullYear() + 1 : k.getFullYear(), c = m.tools.isMonthOfNextYear(parseInt(j, 10)) || m.tools.isMonthOfNextYear(parseInt(h, 10)) ? k.getFullYear() + 1 : k.getFullYear(), f.departure_at = b + "-" + h + "-" + g, f.return_at = c + "-" + j + "-" + i, new m.Promise(function (b) {
                        var c = 50, d = ".b-price", e = ".j-currency_changer.s-selected", g = function () {
                                if (!c)
                                    return void b(f);
                                c -= 1;
                                var h = a.querySelector(d);
                                if (h && (h.innerText || h.textContent)) {
                                    f.price = parseInt((h.innerText || h.textContent).replace(/\D/g, ""), 10);
                                    var i = a.querySelector(e);
                                    i && (f.currency = i.getAttribute("data-currency")), b(f);
                                } else
                                    setTimeout(g, 500);
                            };
                        g();
                    });
                }
            },
            {
                name: "biletix.ru",
                domain: "biletix.ru",
                urlRE: /https?:\/\/biletix\.ru\/#offer__\d+/,
                getInfo: function (a) {
                    var b = {}, c = {
                            origin: "depart",
                            destination: "arrival",
                            departure_at: "dateto",
                            return_at: "dateback",
                            type: "RT_OW",
                            person: "adult"
                        };
                    for (var d in c)
                        if (c.hasOwnProperty(d)) {
                            if (c[d] = a.getElementsByName(c[d]), !c[d] || !c[d].length)
                                return m.Promise.reject();
                            if (c[d] = c[d][0].value, !c[d])
                                return m.Promise.reject();
                        }
                    if ("RT" === c.type) {
                        var e, f = /\(([A-Z]{3})\)/;
                        if (e = f.exec(c.origin), e && e.length > 1 && (b.origin = e[1], e = f.exec(c.destination), e && e.length > 1)) {
                            b.destination = e[1], b.departure_at = c.departure_at.split(".").reverse().join("-"), b.return_at = c.return_at.split(".").reverse().join("-"), b.person = +c.person;
                            var g = a.querySelector(".price");
                            if (g) {
                                b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10);
                                var h = a.querySelector("li.selected label");
                                h && (b.currency = h.innerText || h.textContent);
                            }
                            return m.Promise.resolve(b);
                        }
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "pososhok.ru",
                domain: "pososhok.ru",
                urlRE: /https?:\/\/(www.)?pososhok\.ru\//,
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = 15, e = "#mapContainer", f = function () {
                                var b = a.querySelector(".flight .price h5"), c = a.querySelector(".thin-selector .selected"), d = a.querySelectorAll("#form-roundtrip .datepicker-bind");
                                if (b && c && d && 2 === d.length) {
                                    var e = location.hash.split("-");
                                    if (e.length > 2) {
                                        var f = {};
                                        return f.origin = e[e.length - 2], f.destination = e[e.length - 1], f.person = +m.tools.getTextContents(c), f.departure_at = d[0].value, f.return_at = d[0].value, f.price = +m.tools.priceAnalyze(m.tools.getTextContents(b)), f;
                                    }
                                }
                                return null;
                            }, g = function () {
                                if (!d) {
                                    var h = f();
                                    return void (h ? b(h) : c());
                                }
                                d -= 1, a.querySelector(e) ? setTimeout(g, 1000) : (h = f(), h ? b(h) : c(h));
                            };
                        g();
                    });
                }
            },
            {
                name: "new.pososhok.ru",
                domain: "new.pososhok.ru",
                urlRE: /https?:\/\/new\.pososhok\.ru\/#result\//,
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = {}, e = /([A-Z]{3})\-([A-Z]{3})$/, f = e.exec(a.URL);
                        if (!(f && f.length > 2))
                            return void c();
                        d.origin = f[1], d.destination = f[2];
                        var g = 60, h = function () {
                                if (g--) {
                                    var e = a.querySelector("#form-roundtrip");
                                    if (!e)
                                        return void setTimeout(h, 1000);
                                    var f = a.querySelectorAll("#minor-form-roundtrip .dates .datepicker-bind");
                                    f && 2 === f.length && (d.departure_at = f[0].value, d.return_at = f[1].value);
                                    var i = a.querySelector("[data-field=\"adults\"]");
                                    d.person = i ? i.value : 1;
                                    var j = a.querySelector(".best-flight .price");
                                    if (j && (d.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(j)), 10), d.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(j))), d.origin && d.destination && d.departure_at && d.return_at && d.price)
                                        return void b(d);
                                    c();
                                } else
                                    c();
                            };
                        h();
                    });
                }
            },
            {
                name: "agent.ru",
                domain: "agent.ru",
                urlRE: /https?:\/\/(www.)?agent.ru\/ru\/booking\/choice/,
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        for (var d, e = a.getElementsByTagName("script"), f = /var searchRequest\s*=\s*(.+?);\s*\n?/, g = e.length - 1; g >= 0 && !(e[g].textContent.indexOf("var searchRequest") > -1 && (d = f.exec(e[g].textContent), d && d.length)); g--);
                        if (d && d.length) {
                            var h;
                            try {
                                h = JSON.parse(d[1]);
                            } catch (i) {
                                c();
                            }
                            if (h && h.segments && 2 === h.segments.length) {
                                var j = {};
                                j.origin = h.segments[0].departurePoint.city.codeIATA, j.destination = h.segments[0].arrivalPoint.city.codeIATA, j.person = h.adultsCount;
                                var k = new Date(h.segments[0].departureDate), l = k.getMonth() + 1;
                                l = 10 > l ? "0" + l : l;
                                var n = new Date(h.segments[1].departureDate), o = n.getMonth() + 1;
                                o = 10 > o ? "0" + o : o, j.departure_at = k.getFullYear() + "-" + l + "-" + (k.getDate() < 10 ? "0" + k.getDate() : k.getDate()), j.return_at = n.getFullYear() + "-" + o + "-" + (n.getDate() < 10 ? "0" + n.getDate() : n.getDate());
                                var p = a.querySelector("nobr.rub"), q = a.querySelector("nobr.usd"), r = a.querySelector("nobr.eur"), s = ".price .rub b";
                                p && "none" !== p.style.display ? j.currency = "RUB" : q && "none" !== q.style.display ? (j.currency = "USD", s = ".price .usd b") : r && "none" !== r.style.display && (j.currency = "EUR", s = ".price .eur b");
                                var t = a.querySelector(s);
                                t && (j.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(t)), 10)), b(j);
                            }
                        }
                        c();
                    });
                }
            },
            {
                name: "nabortu.ru",
                domain: "nabortu.ru",
                urlRE: /https?:\/\/(www.)?nabortu\.ru\/aviabilety\/\?/,
                getInfo: function (a) {
                    var b, c = a.URL;
                    if (b = {
                            origin: m.tools.getQueryParam(c, "codeFrom"),
                            destination: m.tools.getQueryParam(c, "codeWhere"),
                            departure_at: m.tools.getQueryParam(c, "datein"),
                            person: +m.tools.getQueryParam(c, "adults_num"),
                            return_at: m.tools.getQueryParam(c, "dateout") || void 0
                        }, b.origin && b.destination && b.departure_at && b.person > 0) {
                        b.departure_at = b.departure_at.split(".").reverse().join("-"), b.return_at = b.return_at.split(".").reverse().join("-");
                        var d = a.querySelector(".act-black a");
                        if (d) {
                            var e = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(d)), 10);
                            e && (b.price = e);
                        }
                        return m.Promise.resolve(b);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "aviacassa.ru",
                domain: "aviacassa.ru",
                urlRE: /https?:\/\/(?:www\.)?aviacassa\.ru\/air\/view\/([A-Z]{3})\-([A-Z]{3})\/(\d{4}\-\d{2}\-\d{2})\/(\d{4}\-\d{2}\-\d{2})\/(\d+)ADT/,
                getInfo: function (a) {
                    var b = a.URL, c = this.urlRE.exec(b), d = {
                            origin: c[1],
                            destination: c[2],
                            departure_at: c[3],
                            return_at: c[4],
                            person: +c[5]
                        };
                    if (d.origin && d.destination && d.departure_at && d.return_at) {
                        var e = a.querySelector(".blueborderedflight .dyna-currency-amount");
                        if (e) {
                            var f = parseInt((e.innerText || e.textContent).replace(/\D/g, ""), 10);
                            if (f) {
                                d.price = f;
                                var g = a.querySelector(".dyna-currency-symbol");
                                g && (d.currency = g.innerText || g.textContent);
                            }
                        }
                        return m.Promise.resolve(d);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "sindbad.ru",
                domain: "sindbad.ru",
                urlRE: /https?:\/\/(?:www\.)?sindbad\.ru\/ru\/flight\/results\/([A-Z]{3})([A-Z]{3})(\d{4})(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d)00E0/,
                getInfo: function (a) {
                    var b = a.URL, c = this.urlRE.exec(b), d = {
                            origin: c[1],
                            destination: c[2],
                            departure_at: c[3] + "-" + c[4] + "-" + c[5],
                            return_at: c[6] + "-" + c[7] + "-" + c[8],
                            person: +c[9]
                        };
                    if (d.origin && d.destination && d.departure_at && d.return_at) {
                        var e = a.querySelector(".cost .lPrice");
                        if (e) {
                            var f = parseInt((e.innerText || e.textContent).replace(/\D/g, ""), 10);
                            f && (d.price = f);
                        }
                        return m.Promise.resolve(d);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "klm.com",
                domain: "klm.com",
                urlRE: /https?:\/\/(?:www\.)?klm\.com\/travel\/[^\/]+\/apps\/ebt\/calendar\.htm/,
                getInfo: function (a) {
                    var b = a.URL, c = {
                            origin: m.tools.getQueryParam(b, "origin"),
                            destination: m.tools.getQueryParam(b, "destination"),
                            departure_at: m.tools.getQueryParam(b, "outboundDate"),
                            return_at: m.tools.getQueryParam(b, "inboundDate"),
                            person: +m.tools.getQueryParam(b, "numberOfAdults")
                        };
                    return c.origin && c.destination && c.departure_at && c.return_at && c.person ? new m.Promise(function (b) {
                        var d = ".est-selected.est-price div, .est-flight.est-selected .est-price", e = ".search-loading", f = ".est-loading-indicator", g = 15, h = function () {
                                if (g--) {
                                    var i = a.querySelector(d), j = a.querySelector(e), k = a.querySelector(f);
                                    if (i && !j && 0 == k.offsetWidth && 0 == k.offsetHeight) {
                                        var l = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(i).replace(/\D/g, "")), 10);
                                        if (l)
                                            return c.price = l, c.currency = m.tools.getCurrencyFromStr(i.querySelector("span").innerText), void b(c);
                                    }
                                    setTimeout(h, 1000);
                                } else
                                    b(c);
                            };
                        h();
                    }) : m.Promise.reject();
                }
            },
            {
                name: "britishairways.com",
                domain: "britishairways.com",
                urlRE: /https?:\/\/(www.)?britishairways\.com\/travel\/fx/,
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        for (var d, e = a.getElementsByTagName("script"), f = /depart_airport\s*=\s*'(\S{3})';[\s\S]+?destination_airport\s*=\s*'(\S{3})'[\s\S]+currency_code\s*=\s*'(\S{3})[\s\S]+depart_date\s*=\s*'([\d\-]{10})[\s\S]+return_date\s*=\s*'([\d\-]{10})/, g = e.length - 1; g >= 0 && !(e[g].textContent.indexOf("collectTagManData") > -1 && (d = f.exec(e[g].textContent), d && d.length)); g--);
                        if (d && d.length > 5) {
                            var h = {};
                            if (h.origin = d[1], h.destination = d[2], h.currency = d[3], h.departure_at = d[4], h.return_at = d[5], h.person = 1, h.origin && h.destination && h.departure_at && h.return_at) {
                                var i = a.querySelector("#outboundDates .col1 .lowestPriceFlagtrue label"), j = a.querySelector("#inboundDates .col1 .lowestPriceFlagtrue label");
                                return j && i && (h.price = parseInt(i.innerHTML.replace(/\D/g, ""), 10) + parseInt(j.innerHTML.replace(/\D/g, ""), 10)), void b(h);
                            }
                        }
                        c();
                    });
                }
            },
            {
                name: "airfrance.ru",
                domain: "airfrance.ru",
                urlRE: /https?:\/\/(www.)?airfrance\.ru\/cgi\-bin\/AF\/.+?\/.+?\/local\/process\/standardbooking\/DisplayFlightPageAction\.do/,
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        for (var d, e = a.getElementsByTagName("script"), f = /u3\s*=\s*"(\S{3})(\S{3})";[\s\S]+?u5\s*=\s*"(\S{3})"/, g = e.length - 1; g >= 0 && !(e[g].textContent.indexOf("var u3") > -1 && (d = f.exec(e[g].textContent), d && d.length)); g--);
                        if (d && d.length > 3) {
                            var h = {};
                            h.origin = d[1], h.destination = d[2], h.currency = d[3];
                            var i = a.getElementById("idTrip0Day"), j = a.getElementById("idTrip0MonthYear"), k = a.getElementById("idTrip1Day"), l = a.getElementById("idTrip1MonthYear");
                            if (i && j && k && l && (h.departure_at = j.value.substr(0, 4) + "-" + j.value.substr(4, 2) + "-" + i.value, h.return_at = l.value.substr(0, 4) + "-" + l.value.substr(4, 2) + "-" + k.value), h.origin && h.destination && h.departure_at && h.return_at) {
                                var n = a.querySelector(".blocMiniRecapOnePaxPrice");
                                return n && (h.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(n)), 10)), void b(h);
                            }
                        }
                        c();
                    });
                }
            },
            {
                name: "skyscanner.ru",
                urlRE: /https?\:\/\/(www\.)?skyscanner\.(ru|com|de|net|co\.id|com\.ua)\/transport\/(flights|fluge)\//,
                domain: "skyscanner.ru",
                getInfo: function (a) {
                    var b = {};
                    return new m.Promise(function (c, d) {
                        var e = 40, f = ".header-info-bestprice button", g = function () {
                                if (!e)
                                    return void c(b);
                                e -= 1;
                                var d = a.querySelector(".day-options-item.depart .day-options-navigation span"), h = a.querySelector(".day-options-item.return .day-options-navigation span"), i = a.querySelectorAll(".route-code");
                                d && h && i && i.length > 1 && (b.departure_at = d.getAttribute("data-date"), b.return_at = h.getAttribute("data-date"), b.origin = (i[0].innerText || i[0].textContent).substr(1, 3), b.destination = (i[1].innerText || i[1].textContent).substr(1, 3));
                                var j = a.querySelector(f);
                                j ? (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(j)), 10), b.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(j)), c(b)) : setTimeout(g, 1000);
                            };
                        g();
                    });
                }
            },
            {
                name: "airberlin.com",
                urlRE: /https?\:\/\/(www\.)?airberlin\.com\/.+?\/booking\/flight\/vacancy\.php/,
                domain: "airberlin.com",
                getInfo: function (a) {
                    var b = {};
                    return new m.Promise(function (c) {
                        var d = 40, e = "#vacancy_priceoverview .total td", f = function () {
                                if (!d)
                                    return void c(b);
                                d -= 1;
                                var g = a.querySelector(".paxcountpertype");
                                g && (b.person = +g.innerHTML.replace(/\D/g, ""));
                                var h = a.getElementById("departurecode"), i = a.getElementById("destinationcode"), j = a.getElementById("outbounddate"), k = a.getElementById("returndate");
                                a.querySelectorAll(".route-code");
                                h && i && j && k && (b.departure_at = j.value.split(/\.|\//).reverse().join("-"), b.return_at = k.value.split(/\.|\//).reverse().join("-"), b.origin = h.value, b.destination = i.value);
                                var l = a.querySelector(e);
                                l ? (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(l)).replace(".", ""), 10), b.currency = m.tools.getCurrencyFromStr(l.innerHTML), c(b)) : setTimeout(f, 1000);
                            };
                        f();
                    });
                }
            },
            {
                name: "booking.alitalia.com",
                urlRE: /https?:\/\/booking\.alitalia\.com\/Booking\//,
                domain: "alitalia.com",
                getInfo: function (a) {
                    var b = {}, c = a.getElementById("Destinations_DepartureAirport"), d = a.getElementById("Destinations_ArrivalAirport"), e = a.querySelector("[name=\"DCSext.NumAd\"]"), f = a.getElementById("Destinations_DepartureDate"), g = a.getElementById("Destinations_ReturnDate"), h = a.querySelector("#OutboundRoutePanel .brand_routedetail_bestprice input"), i = a.querySelector("#ReturnRoutePanel .brand_routedetail_bestprice input");
                    return c && d && e && f && g ? (b.origin = c.value, b.destination = d.value, b.person = +e.content, b.departure_at = f.value.split("/").reverse().join("-"), b.return_at = g.value.split("/").reverse().join("-"), h && i && (b.price = Number(h.getAttribute("price")) + Number(i.getAttribute("price")), b.currency = m.tools.getCurrencyFromStr(h.value)), m.Promise.resolve(b)) : m.Promise.reject();
                }
            },
            {
                name: "iberia.com",
                urlRE: /https?:\/\/(www\.)?iberia\.com\/web\/(dispatchSearchFormHOME|dispatchCurrencyChangeConfirm)/,
                domain: "iberia.com",
                getInfo: function (a) {
                    var b = {}, c = a.querySelector(".from-fly-table .choose-flight-list .like-row");
                    if (c) {
                        var d = a.querySelectorAll(".from-fly-table .choose-flight-list .like-row .flight-code");
                        if (d && d.length) {
                            var e = d[0].href;
                            b.origin = m.tools.getQueryParam(e, "beginLocation"), b.departure_at = m.tools.getQueryParam(e, "bDate"), b.departure_at = b.departure_at.replace(/(\d{4})(\d{2})(\d{2}).+/, "$1-$2-$3"), e = d[d.length - 1].href, b.destination = m.tools.getQueryParam(e, "endLocation");
                        }
                        d = a.querySelector(".return-fly-table .choose-flight-list .like-row .flight-code"), d && (b.return_at = m.tools.getQueryParam(d.href, "bDate").replace(/(\d{4})(\d{2})(\d{2}).+/, "$1-$2-$3"));
                        var f = a.querySelectorAll(".selected .price");
                        if (f)
                            var g = f[0], h = f[1];
                        g && (b.price = +m.tools.priceAnalyze(m.tools.getTextContents(g)), b.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(g))), h && (b.price += +m.tools.priceAnalyze(m.tools.getTextContents(h)));
                    }
                    return b.origin && b.destination && b.departure_at && b.return_at ? m.Promise.resolve(b) : m.Promise.reject();
                }
            },
            {
                name: "kayak.ru",
                urlRE: /https?:\/\/(?:www\.)?kayak\.ru\/flights\/(\S{3})\-(\S{3})\/(\S{10})\/(\S{10})/,
                domain: "kayak.ru",
                getInfo: function (a) {
                    var b, c = a.URL, d = this.urlRE.exec(c);
                    return d ? (b = {
                        origin: d[1].toUpperCase(),
                        destination: d[2].toUpperCase(),
                        departure_at: d[3],
                        return_at: d[4]
                    }, new m.Promise(function (c) {
                        var d = ".pricerange a", e = "#progressDiv", f = function () {
                                var g = a.querySelector(d), h = a.querySelector(e);
                                g && !h ? (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10), c(b)) : setTimeout(f, 500);
                            };
                        f();
                    })) : m.Promise.reject();
                }
            },
            {
                name: "lufthansa.com",
                urlRE: /https?:\/\/book\.lufthansa\.com\/lh\/dyn\/air\-lh\/revenue\/viewFlights/,
                domain: "lufthansa.com",
                getInfo: function (a) {
                    var b = {}, c = a.querySelector(".flight-details").querySelectorAll("[title=\"Acronym full name\"]");
                    c && (b.origin = c[0].innerHTML, b.destination = c[1].innerHTML);
                    var d = a.querySelector("#calendarDatesList0 .tab.ui-state-active time");
                    d && (b.departure_at = d.innerHTML.replace(/[^\.\d]/g, "").replace(/(\d{2})\.(\d{2})\.(\d{2})/, "20$3-$2-$1"));
                    var e = a.querySelector("#calendarDatesList1 .tab.ui-state-active time");
                    e && (b.return_at = e.innerHTML.replace(/[^\.\d]/g, "").replace(/(\d{2})\.(\d{2})\.(\d{2})/, "20$3-$2-$1"));
                    var f = a.querySelector("#calendarDatesList0 .tab.ui-state-active .number");
                    f && (b.price = +f.getAttribute("data-value"));
                    var g = a.querySelector("#calendarDatesList1 .tab.ui-state-active .number");
                    g && (b.price += +g.getAttribute("data-value"));
                    var h = a.querySelector("#calendarDatesList1 .tab.ui-state-active .currency");
                    return h && (b.currency = m.tools.getTextContents(h)), b.origin && b.destination && b.return_at && b.departure_at ? m.Promise.resolve(b) : m.Promise.reject();
                }
            },
            {
                name: "travel.ulmart.ru",
                urlRE: /https?:\/\/travel\.ulmart\.ru\/flight\/search/,
                domain: "travel.ulmart.ru",
                getInfo: function (a) {
                    var b = {}, c = a.URL, d = m.tools.getQueryParam(c, "fromPoint"), e = m.tools.getQueryParam(c, "toPoint"), f = m.tools.getQueryParam(c, "adultsCount"), g = m.tools.getQueryParam(c, "forthDate"), h = m.tools.getQueryParam(c, "returnDate"), i = a.querySelector(".b-price__num");
                    return d && e && f && g && h ? (b.origin = d, b.destination = e, b.person = +f, b.departure_at = g.split(/\.|\//).reverse().join("-"), b.return_at = h.split(/\.|\//).reverse().join("-"), i && (b.price = Number(m.tools.priceAnalyze(m.tools.getTextContents(i))) || 0, b.currency = "RUR"), m.Promise.resolve(b)) : m.Promise.reject();
                }
            },
            {
                name: "tripadvisor.ru",
                urlRE: /https?\:\/\/(www\.)?tripadvisor\.(com|ru)\/CheapFlights/,
                domain: "tripadvisor.ru",
                getInfo: function (a) {
                    var b = a.URL, c = {
                            origin: m.tools.getQueryParam(b, "Orig"),
                            destination: m.tools.getQueryParam(b, "Dest")
                        }, d = m.tools.getQueryParam(b, "leaveday"), e = m.tools.getQueryParam(b, "retday");
                    return d && e && (1 === d.length && (d = "0" + d), 1 === e.length && (e = "0" + e), c.departure_at = d + "/" + m.tools.getQueryParam(b, "leavemonth"), c.return_at = e + "/" + m.tools.getQueryParam(b, "retmonth"), c.origin && c.destination && c.departure_at && c.return_at) ? (c.departure_at = c.departure_at.split("/").reverse().join("-"), c.return_at = c.return_at.split("/").reverse().join("-"), m.Promise.resolve(c)) : m.Promise.reject();
                }
            },
            {
                name: "momondo.ru",
                urlRE: /https?:\/\/(?:www\.)?momondo\.ru\/.+?Search=true/,
                domain: "momondo.ru",
                getInfo: function (a) {
                    var b = a.URL, c = {
                            origin: m.tools.getQueryParam(b, "SO0"),
                            destination: m.tools.getQueryParam(b, "SD0"),
                            departure_at: m.tools.getQueryParam(b, "SDP0"),
                            return_at: m.tools.getQueryParam(b, "SDP1")
                        };
                    return c.origin && c.destination && c.departure_at && c.return_at ? (c.departure_at = c.departure_at.split("-").reverse().join("-"), c.return_at = c.return_at.split("-").reverse().join("-"), new m.Promise(function (d) {
                        var e = "#flight-tickets-sortbar-cheapest .price", f = "#wheelcontainer object", g = function () {
                                var h = a.querySelector(e), i = a.querySelector(f);
                                !i || i.offsetWidth < 100 ? (h && (c.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(h)), 10), c.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(h))), b = a.URL, c.origin = m.tools.getQueryParam(b, "SO0"), c.destination = m.tools.getQueryParam(b, "SD0"), c.departure_at = m.tools.getQueryParam(b, "SDP0"), c.return_at = m.tools.getQueryParam(b, "SDP1"), c.departure_at = c.departure_at.split("-").reverse().join("-"), c.return_at = c.return_at.split("-").reverse().join("-"), d(c)) : setTimeout(g, 500);
                            };
                        g();
                    })) : m.Promise.reject();
                }
            },
            {
                name: "buruki.ru",
                urlRE: /https?:\/\/(?:www\.)?buruki\.ru\/search\/([a-z]{3})\/([a-z]{3})\/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})\/(\d+)/,
                domain: "kayak.ru",
                getInfo: function (a) {
                    var b = this.urlRE.exec(a.URL);
                    if (b) {
                        var c = {
                            origin: b[1].toUpperCase(),
                            destination: b[2].toUpperCase(),
                            departure_at: b[3],
                            return_at: b[4],
                            person: b[5]
                        };
                        return new m.Promise(function (b) {
                            var d = ".search-results-item .price", e = ".bu-progress", f = 60, g = function () {
                                    if (f--) {
                                        var h = a.querySelector(d), i = a.querySelector(e);
                                        h && !i ? (c.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(h)), 10), c.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(h)), b(c)) : setTimeout(g, 500);
                                    } else
                                        b(c);
                                };
                            g();
                        });
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "trip.ru",
                urlRE: /https?:\/\/(www\.)?trip\.ru\/flights\/searches\//,
                domain: "trip.ru",
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = a.getElementById("workingIndication");
                        d || c();
                        var e = 60, f = function () {
                                if (e--)
                                    if ("none" === d.style.display) {
                                        var g = {}, h = a.getElementById("resultsContainer");
                                        h && (h = h.getAttribute("data-search-od"), h && (g.origin = h.split("-")[0], g.destination = h.split("-")[1])), g.departure_at = a.getElementById("e_travel_flights_search_departure").value, g.return_at = a.getElementById("e_travel_flights_search_return").value, g.person = parseInt(a.getElementById("passengers").value, 10);
                                        var i = a.getElementById("lblMinPrice");
                                        i && (g.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(i)), 10), g.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(i.parentNode))), b(g);
                                    } else
                                        setTimeout(f, 1000);
                                else
                                    c();
                            };
                        f();
                    });
                }
            },
            {
                name: "orenair.ru",
                urlRE: /https?:\/\/(intershop\.)?orenair\.ru\/(.+?)\/timetable#timetable-pricing/,
                domain: "intershop.orenair.ru",
                getInfo: function (a) {
                    var b = {}, c = a.getElementById("originCityName"), d = a.getElementById("destinationCityName"), e = a.getElementById("thereDate"), f = a.getElementById("backDate"), g = a.getElementById("count-aaa");
                    if (c && d && e && f && g) {
                        b.origin = c.value, b.destination = d.value, b.departure_at = e.value.split(".").reverse().join("-"), b.return_at = f.value.split(".").reverse().join("-"), b.person = +g.value;
                        var h = a.querySelector("#payment-type-card a");
                        return h && (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(h)), 10), b.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(h))), m.Promise.resolve(b);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "utair.ru",
                urlRE: /https?:\/\/(booking\.)?utair\.ru\/(.+?)\/avia\/b2b\/(tariffication|availability)\.jsf/,
                domain: "booking.utair.ru",
                getInfo: function (a) {
                    var b = a.referrer, c = {
                            origin: m.tools.getQueryParam(b, "origin-city-name"),
                            destination: m.tools.getQueryParam(b, "destination-city-name"),
                            departure_at: m.tools.getQueryParam(b, "there-date"),
                            return_at: m.tools.getQueryParam(b, "back-date"),
                            person: +m.tools.getQueryParam(b, "count-aaa")
                        };
                    return c.origin && c.destination && c.departure_at && c.return_at && c.person ? (c.departure_at = c.departure_at.split(".").reverse().join("-"), c.return_at = c.return_at.split(".").reverse().join("-"), new m.Promise(function (b) {
                        var d = ".variant-cost a, .tarif-payment-variants a", e = 60, f = function () {
                                if (e--) {
                                    var g = a.querySelector(d);
                                    g ? (c.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10), c.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(g)), b(c)) : setTimeout(f, 1000);
                                } else
                                    b(c);
                            };
                        f();
                    })) : m.Promise.reject();
                }
            },
            {
                name: "pass.rzd.ru",
                urlRE: /https?:\/\/pass\.rzd\.ru\/timetable\/.+?st0/,
                domain: "pass.rzd.ru",
                getInfo: function (a) {
                    var b = {}, c = a.URL.replace(/\|/g, "&"), d = m.tools.getQueryParam(c, "st0"), e = m.tools.getQueryParam(c, "st1"), f = m.tools.getQueryParam(c, "dt0"), g = m.tools.getQueryParam(c, "dt1");
                    return d && e && f && g ? (b.origin = d, b.destination = e, b.departure_at = f.split(".").reverse().join("-"), b.return_at = g.split(".").reverse().join("-"), m.Promise.resolve(b)) : m.Promise.reject();
                }
            },
            {
                name: "transport.marshruty.ru",
                urlRE: /transport\.marshruty\.ru\/Transports\/Timetable\.aspx/,
                domain: "transport.marshruty.ru",
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = 60, e = function () {
                                if (d--)
                                    if (a.getElementById("ctnWaitSeats"))
                                        setTimeout(e, 1000);
                                    else {
                                        var f = {}, g = a.querySelectorAll(".variants a");
                                        g && 2 === g.length && (f.origin = m.tools.getTextContents(g[0]), f.destination = m.tools.getTextContents(g[1]));
                                        var h = a.querySelector(".ritem");
                                        if (h = h && h.getAttribute("rid"), h && (f.departure_at = h.substr(0, 8), f.return_at = h.substr(h.indexOf(",") + 1, 8), f.departure_at && f.return_at)) {
                                            f.departure_at = f.departure_at.substr(0, 4) + "-" + f.departure_at.substr(4, 2) + "-" + f.departure_at.substr(6, 2), f.return_at = f.return_at.substr(0, 4) + "-" + f.return_at.substr(4, 2) + "-" + f.return_at.substr(6, 2), f.person = +m.tools.getQueryParam(a.URL, "adult") || 1;
                                            var i = a.querySelector(".price");
                                            return i && (f.price = +m.tools.priceAnalyze(m.tools.getTextContents(i)), f.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(i))), void b(f);
                                        }
                                        c();
                                    }
                                else
                                    c();
                            };
                        e();
                    });
                }
            },
            {
                name: "svyaznoy.travel",
                urlRE: /(?:www\.)?svyaznoy\.travel\/#([A-Z]{3})(\d{2})(\d{2})\/([A-Z]{3})(\d{2})(\d{2})\/A(\d)/,
                domain: "svyaznoy.travel",
                getInfo: function (a) {
                    var b = this.urlRE.exec(a.URL), c = {
                            origin: b[1],
                            destination: b[4],
                            person: +b[7]
                        }, d = b[2], e = b[3], f = b[5], g = b[6], h = new Date().getFullYear(), i = m.tools.isMonthOfNextYear(parseInt(e, 10)) ? h + 1 : h, j = m.tools.isMonthOfNextYear(parseInt(g, 10)) || m.tools.isMonthOfNextYear(parseInt(e, 10)) ? h + 1 : h;
                    return c.departure_at = i + "-" + e + "-" + d, c.return_at = j + "-" + g + "-" + f, c.origin && c.destination && c.departure_at && c.return_at ? new m.Promise(function (b, d) {
                        var e = 60, f = function () {
                                if (e--) {
                                    var d = a.querySelector("#results_best .sum .price strong");
                                    d ? (c.price = +m.tools.priceAnalyze(m.tools.getTextContents(d)), b(c)) : setTimeout(f, 1000);
                                } else
                                    b(c);
                            };
                        f();
                    }) : m.Promise.reject();
                }
            },
            {
                name: "bravoavia.ru",
                urlRE: /(www\.)?bravoavia\.ru\/vg1\/search\/results\.action/,
                domain: "bravoavia.ru",
                getInfo: function (a) {
                    return new m.Promise(function (b, c) {
                        var d = 60, e = function () {
                                if (d--) {
                                    var f = a.querySelector(".vg_sld_bar .rangeContainer");
                                    if (f) {
                                        var g = a.referrer, h = {
                                                origin: m.tools.getQueryParam(g, "departureAirport"),
                                                destination: m.tools.getQueryParam(g, "arrivalAirport"),
                                                departure_at: m.tools.getQueryParam(g, "outboundDay") + m.tools.getQueryParam(g, "outboundMonthYear"),
                                                return_at: m.tools.getQueryParam(g, "returnDay") + m.tools.getQueryParam(g, "returnMonthYear")
                                            };
                                        if (h.origin && h.destination && h.departure_at && h.return_at)
                                            return h.departure_at = h.departure_at.substr(0, 2) + "-" + h.departure_at.substr(2, 2) + "-" + h.departure_at.substr(4, 4), h.return_at = h.return_at.substr(0, 2) + "-" + h.return_at.substr(2, 2) + "-" + h.return_at.substr(4, 4), h.price = Number(m.tools.priceAnalyze(m.tools.getTextContents(f))), h.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(f)), void b(h);
                                        c();
                                    } else
                                        setTimeout(e, 1000);
                                } else
                                    c();
                            };
                        e();
                    });
                }
            },
            {
                name: "finnair.com",
                urlRE: /https?:\/\/(www\.)finnair\.com\/pl\/AY(Online|Portal)\/wds\/(Override|StartOver|FlexPricerAvailability)\.action/,
                domain: "finnair.com",
                getInfo: function (a) {
                    var b = {}, c = a.querySelector("[name='B_LOCATION_1']"), d = a.querySelector("[name='B_LOCATION_2']"), e = a.querySelector("[name='B_DATE_1']"), f = a.querySelector("[name='B_DATE_2']"), g = a.querySelector("[name='NB_TRAVELLERS']");
                    if (c && d && e && f && g) {
                        b.origin = c.value, b.destination = d.value, b.departure_at = [
                            e.value.substr(0, 4),
                            e.value.substr(4, 2),
                            e.value.substr(6, 2)
                        ].join("-"), b.return_at = [
                            f.value.substr(0, 4),
                            f.value.substr(4, 2),
                            f.value.substr(6, 2)
                        ].join("-"), b.person = +g.value;
                        var h = a.querySelector(".priceSelectedEffectOff span, #roundtripBox1");
                        return h && (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(h)), 10), b.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(h))), m.Promise.resolve(b);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "letaem.ru",
                urlRE: /https?:\/\/(www\.)?letaem\.ru\/search/,
                domain: "letaem.ru",
                getInfo: function (a) {
                    var b = {}, c = a.getElementById("pseudoFromCode"), d = a.getElementById("pseudoToCode"), e = a.getElementById("dateThere"), f = a.getElementById("dateBack");
                    if (c && d && e && f) {
                        b.origin = c.value, b.destination = d.value, b.departure_at = e.value.split(".").reverse().join("-"), b.return_at = f.value.split(".").reverse().join("-");
                        var g = a.querySelector(".price");
                        return g && (b.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(g)), 10), b.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(g))), m.Promise.resolve(b);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "light-flight.ru",
                urlRE: /https?:\/\/light\-flight\.ru\/ticketsearch/,
                domain: "light-flight.ru",
                getInfo: function (a) {
                    var b = a.URL, c = {
                            origin: m.tools.getQueryParam(b, "from"),
                            destination: m.tools.getQueryParam(b, "to"),
                            departure_at: m.tools.getQueryParam(b, "dateThere"),
                            return_at: m.tools.getQueryParam(b, "dateBack"),
                            person: m.tools.getQueryParam(b, "adult")
                        };
                    if (c.origin && c.destination && c.departure_at && c.return_at && c.person) {
                        c.departure_at = c.departure_at.split(".").reverse().join("-"), c.return_at = c.return_at.split(".").reverse().join("-"), c.person = +c.person || 1;
                        var d = a.querySelector(".ticketBlock .head");
                        return d && (c.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(d)), 10), c.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(d))), m.Promise.resolve(c);
                    }
                    return m.Promise.reject();
                }
            },
            {
                name: "avia.euroset.ru",
                urlRE: /avia\.euroset\.ru\/\?go\=flights\/results/,
                domain: "avia.euroset.ru",
                getInfo: function (a) {
                    var b = m.tools.getQueryParam(a.URL, "sro"), c = /([A-Z]{3})([A-Z]{3})(\d{2}\.\d{2}\.\d{4})RT(\d{2}\.\d{2}\.\d{4})(\d)/;
                    if (c.test(b)) {
                        var d = {
                                origin: RegExp.$1,
                                destination: RegExp.$2,
                                departure_at: RegExp.$3.split(".").reverse().join("-"),
                                return_at: RegExp.$4.split(".").reverse().join("-"),
                                person: +RegExp.$5
                            }, e = a.querySelector(".item_foot a");
                        return e && (d.price = parseInt(m.tools.priceAnalyze(m.tools.getTextContents(e)), 10), d.currency = m.tools.getCurrencyFromStr(m.tools.getTextContents(e))), m.Promise.resolve(d);
                    }
                    return m.Promise.reject();
                }
            }
        ],
        getInfo: function (a) {
            for (var b = 0; b < this._sites.length; b++)
                if (this._sites[b].urlRE.test(a.URL)) {
                    var c = this._sites[b].getInfo(a);
                    return c.then(function (b) {
                        b.method = "avia", b.url = a.URL, m.hub.trigger("parser:found", b);
                    }), c;
                }
            return m.Promise.reject();
        },
        isAviaDomain: function (a) {
            a = a || "";
            for (var b = 0; b < this._sites.length; b++)
                if (a.indexOf(this._sites[b].domain) > -1)
                    return !0;
            return !1;
        },
        _canParse: function () {
            return m.settings.isAviaEnabled();
        },
        run: function (a) {
            return this._canParse() ? (m.log("start avia"), this.getInfo(a).then(function (a) {
                return m.suggest.getFlights(a);
            })) : m.Promise.reject();
        }
    }, m.urlParser = m.urlParser || {
        _canParse: function (a) {
            return m.settings.isProductSuggestEnabled(a) && !m.settings.getSelector();
        },
        run: function (a) {
            m.log("url parser run");
            var b = m.tools.getHostname(a);
            if (this._canParse(b)) {
                var c;
                if (m.settings.isReviewSite() ? c = "review-site" : m.settings.isShop() && (c = "shop"), c)
                    return m.suggest.getProductOfferByURL({
                        url: a.URL,
                        method: c
                    });
            }
            return m.Promise.reject();
        }
    }, m.searchParser = m.searchParser || {
        _isFirstSearch: function (a) {
            return !m.cookie.get(a);
        },
        _searchEngines: {
            "Mail.ru": {
                urlPattern: /https?:\/\/go\.mail\.ru\/search/,
                queryParam: "q",
                nextPageParam: "sf"
            },
            Yandex: {
                urlPattern: /https?:\/\/(?:www.)?yandex\.ru\/yandsearch/,
                queryParam: "text",
                nextPageParam: "p"
            },
            Google: {
                urlPattern: /^https?:\/\/(?:www.)?google\.(ru|com)\/.+q=/,
                nextPageParam: "start",
                queryParam: "q"
            },
            SuperJob: {
                urlPattern: /https?:\/\/(?:www.)?superjob\.ru\/(vacancy|resume)\/search/,
                queryParam: "keywords[0][keys]",
                nextPageParam: "page"
            },
            Avito: {
                urlPattern: /https?:\/\/(?:www.)?avito\.ru\/.+?\//,
                queryParam: "q",
                infoRe: /https?:\/\/(?:www.)?avito\.ru\/.+?\/([^\/\?]+)\/?([^\?]+)?(?:.*?)(?:q\=([^&]+))?$/,
                priceContextSections: {
                    telefony: !0,
                    bytovaya_elektronika: !0,
                    velosipedy: !0,
                    bytovaya_tehnika: !0,
                    tovary_dlya_kompyutera: !0,
                    audio_i_video: !0
                },
                isPriceContextEnabled: function (a) {
                    var b = this.infoRe.exec(a);
                    if (b && b.length) {
                        var c = b[1];
                        return !!this.priceContextSections[c];
                    }
                    return !1;
                }
            }
        },
        getInfoFromAvito: function (a) {
            var b, c, d, e = this._searchEngines.Avito.infoRe.exec(a), f = null;
            return e && e.length && (b = e[1], c = e[2], d = e[3], f = {}, b && (f.section = b), c && -1 === c.search(/_\d+$/) && (f.subSection = c), d && (f.query = decodeURIComponent(d.replace(/\+/g, " ")))), f;
        },
        getInfoAboutSearchPage: function (a) {
            var b = null;
            for (var c in this._searchEngines)
                this._searchEngines.hasOwnProperty(c) && (!this._searchEngines[c].urlPattern.test(a) || this._searchEngines[c].nextPageParam && -1 !== a.indexOf(this._searchEngines[c].nextPageParam + "=") || (b = {}, "Avito" === c ? b = this.getInfoFromAvito(a) : (b.query = m.tools.getQueryParam(a, this._searchEngines[c].queryParam), "SuperJob" === c && (b.type = this._searchEngines[c].urlPattern.exec(a)[1])), b.engine = c));
            return b;
        },
        _canFindOffers: function (a) {
            return m.settings.isProductSuggestEnabled(a);
        },
        run: function (a) {
            m.log("search run!");
            var b = a.URL, c = m.tools.getHostname(a), d = this.getInfoAboutSearchPage(b);
            return d && this._searchEngines[d.engine].isPriceContextEnabled && this._searchEngines[d.engine].isPriceContextEnabled(b) && d.query && this._isFirstSearch(d.query) && (m.cookie.set(d.query, "true"), this._canFindOffers(c)) ? m.suggest.getProductOffers({
                productName: d.query,
                url: b,
                method: "search"
            }) : m.Promise.reject();
        }
    }, m.partnerWebsiteParser = m.partnerWebsiteParser || {
        _canParse: function () {
            return m.settings.isYandexWebPartner && m.settings.isYandexWebPartner();
        },
        run: function (a) {
            m.tools.getHostname(a);
            if (this._canParse()) {
                m.log("partner's website parser run!");
                var b = m.settings.getProductName(), c = m.settings.getModelId();
                if (b || c) {
                    var d = {
                        url: a.URL,
                        method: "partner-website"
                    };
                    return c ? d.modelId = c : b && (d.productName = b), m.log("Name: " + d.productName + "; ModelId: " + d.modelId), m.suggest.getProductOffers(d)["catch"](function () {
                        return !0;
                    });
                }
            }
            return m.Promise.reject();
        }
    }, m.parserPipe = m.parserPipe || {
        _state: "",
        _canAddParser: !0,
        _parsers: [],
        _callNext: function () {
            this._state = "pending";
            var a = this._parsers.shift();
            a && a.run(document).then(this._onPromiseResolve, this._onPromiseReject);
        },
        _onPromiseResolve: function () {
            this._state = "fulfilled", m.hub.trigger("pipe:fulfill");
        },
        _onPromiseReject: function () {
            this._state = "rejected", 0 !== this._parsers.length || this._canAddParser ? this._callNext() : m.hub.trigger("pipe:reject");
        },
        isDone: function () {
            return "fulfilled" === this._state;
        },
        isPending: function () {
            return "pending" === this._state;
        },
        addParser: function (a) {
            return a && "function" == typeof a.run && !this.isDone() && this._canAddParser && (this._parsers.push(a), this.isPending() || this._callNext()), this;
        },
        end: function () {
            this._canAddParser = !1;
        },
        init: function () {
            return this._state = "", this._parsers = [], this._canAddParser = !0, this._onPromiseReject = this._onPromiseReject.bind(this), this._onPromiseResolve = this._onPromiseResolve.bind(this), this;
        }
    }, c.prototype._getAllClassesAndIds = function () {
        for (var a = {}, b = /(?:class|id)\s*=["'](.+?)["']/g, c = null; c = b.exec(this.html);)
            c[1].replace(/\s+/, " ").split(" ").forEach(function (b) {
                b && (a[b] = !0);
            });
        return Object.keys(a).sort(function (a, b) {
            return b.length - a.length;
        });
    }, c.prototype._createRandomNames = function (a) {
        for (var b = {}, c = this.saveNames, d = "m"; d.length < this.randomNameLength;)
            d += "x";
        return a.forEach(function (a) {
            b[a] = c ? a : d.replace(/x/g, function () {
                return Math.round(35 * Math.random()).toString(36);
            });
        }), b;
    }, c.prototype._createRandomizationRegEx = function (a) {
        return new RegExp(a.join("|"), "g");
    }, c.prototype.randomize = function (a) {
        return a.replace(this.re, function (a) {
            return this.randomNames[a];
        }.bind(this));
    }, m.Randomizer = c, m.feedback = m.feedback || {
        _url: "http://jira.metabar.ru/rest/api/2/issue/",
        _highPrice: {
            summary: "Высокая цена на {{productName}}",
            description: "Страница - {{url}}\nОпределенное название - {{originProductName}}\nОпределенная цена - {{originPrice}}\nВалюта - {{currency}}\n----\nНазвание на прайсбаре - {{productName}}\nЦена на прайсбаре - {{price}}\n----\nМетод извлечения - {{extractMethod}}\nГород - {{region}}\nUser-Agent: {{userAgent}}\n----\n{code:javascript}{{settings}}{code}\n----\nCookies:\n||Name||Value||\n{{cookiesTable}}\nLocal Storage:\n||Name||Value||\n{{localStorageTable}}----\nСсылка-запрос к серверу - {{requestUrl}}\nОтвет сервера - {code:javascript}{{serverResponse}}{code}\n"
        },
        _wrongName: {
            summary: "Неверно определен товар {{productName}}",
            description: "Страница - {{url}}\nОпределенное название - {{originProductName}}\nОпределенная цена - {{originPrice}}\nВалюта - {{currency}}\n----\nНазвание на прайсбаре - {{productName}}\nЦена на прайсбаре - {{price}}\n----\nМетод извлечения - {{extractMethod}}\nГород - {{region}}\nUser-Agent: {{userAgent}}\n----\n{code:javascript}{{settings}}{code}\n----\nCookies:\n||Name||Value||\n{{cookiesTable}}\nLocal Storage:\n||Name||Value||\n{{localStorageTable}}----\nСсылка-запрос к серверу - {{requestUrl}}\nОтвет сервера - {code:javascript}{{serverResponse}}{code}\n"
        },
        _unknownError: {
            summary: "Ошибка в предложении {{productName}}",
            description: "Сообщение пользователя: \"{{message}}\"\n----\nСтраница - {{url}}\nОпределенное название - {{originProductName}}\nОпределенная цена - {{originPrice}}\nВалюта - {{currency}}\n----\nНазвание на прайсбаре - {{productName}}\nЦена на прайсбаре - {{price}}\n----\nМетод извлечения - {{extractMethod}}\nГород - {{region}}\nUser-Agent: {{userAgent}}\n----\n{code:javascript}{{settings}}{code}\n----\nCookies:\n||Name||Value||\n{{cookiesTable}}\nLocal Storage:\n||Name||Value||\n{{localStorageTable}}----\nСсылка-запрос к серверу - {{requestUrl}}\nОтвет сервера - {code:javascript}{{serverResponse}}{code}\n"
        },
        _prepareString: function (a, b) {
            return a.replace(/{{message}}/g, b.message).replace(/{{productName}}/g, b.productName).replace(/{{url}}/g, b.url).replace(/{{requestUrl}}/g, b.requestUrl).replace(/{{originProductName}}/g, b.originProductName).replace(/{{originPrice}}/g, b.originPrice).replace(/{{serverResponse}}/g, b.serverResponse).replace(/{{settings}}/g, b.settings).replace(/{{extractMethod}}/g, b.extractMethod).replace(/{{region}}/g, b.regionName || "Определен автоматически").replace(/{{currency}}/g, b.currency || "Unknown").replace(/{{userAgent}}/g, navigator.userAgent).replace(/{{price}}/g, b.price).replace(/{{cookiesTable}}/g, m.settings.getCookiesTable()).replace(/{{localStorageTable}}/g, m.settings.getLocalStorageTable());
        },
        _sendMessage: function (a, b, c) {
            var d = {
                fields: {
                    project: { key: "SOV" },
                    summary: a,
                    description: b,
                    issuetype: { name: "Bug" },
                    labels: [c],
                    customfield_11130: "%REMOTE_IP%"
                }
            };
            m.xhr.post(this._url, d);
        },
        trackHighPrice: function (a, b, c, d, e, f, g) {
            var h = this._prepareString(this._highPrice.summary, { productName: b }), i = this._prepareString(this._highPrice.description, {
                    url: a,
                    productName: b,
                    requestUrl: f.query,
                    originProductName: f && f.productName,
                    extractMethod: d,
                    serverResponse: e,
                    regionName: m.settings.getRegionName(),
                    price: c,
                    originPrice: f && (f.price || f.productPrice),
                    currency: f && f.currency,
                    settings: JSON.stringify(g, 2, 2)
                });
            this._sendMessage(h, i, "high_price");
        },
        trackWrongProduct: function (a, b, c, d, e, f, g) {
            var h = this._prepareString(this._wrongName.summary, { productName: b }), i = this._prepareString(this._wrongName.description, {
                    url: a,
                    productName: b,
                    requestUrl: f.query,
                    originProductName: f && f.productName,
                    extractMethod: d,
                    serverResponse: e,
                    regionName: m.settings.getRegionName(),
                    price: c,
                    currency: f && f.currency,
                    originPrice: f && (f.price || f.productPrice),
                    settings: JSON.stringify(g, 2, 2)
                });
            this._sendMessage(h, i, "wrong_offer");
        },
        trackUnknownError: function (a, b, c, d, e, f, g, h) {
            var i = this._prepareString(this._unknownError.summary, { productName: c }), j = this._prepareString(this._unknownError.description, {
                    message: a,
                    url: b,
                    productName: c,
                    requestUrl: g.query,
                    originProductName: g && g.productName,
                    extractMethod: e,
                    serverResponse: f,
                    regionName: m.settings.getRegionName(),
                    price: d,
                    originPrice: g && (g.price || g.productPrice),
                    currency: g && g.currency,
                    settings: JSON.stringify(h, 2, 2)
                });
            this._sendMessage(i, j, "unknown_error");
        }
    }, m.abtest = m.abtest || {
        tests: [],
        getModificators: function (a) {
            a = a || {};
            var b = [];
            this.tests.forEach(function (b) {
                for (var c in b.match)
                    b.match.hasOwnProperty(c) && !a.hasOwnProperty(c) && (a[c] = "original");
            });
            for (var c in a)
                a.hasOwnProperty(c) && b.push(c + "_" + a[c]);
            return b;
        }
    };
    var s = {
        type: "",
        data: {},
        css: "#market_context_headcrab *{margin:0;padding:0;text-shadow:none;background:0 0}#market_context_headcrab a{border:0!important}#market_context_headcrab .pb-sitebar-right-action{cursor:pointer!important}html>body>:not(#mbr-citilink-container):not(#mbr-citilink-container):not(#mbr-citilink-container)#market_context_headcrab,#market_context_headcrab .pb-cell{transition:background .2s ease 0s;background:#f1e6c0}#market_context_headcrab:hover,#market_context_headcrab.hover,#market_context_headcrab:active,#market_context_headcrab.active,#market_context_headcrab:hover .pb-cell,#market_context_headcrab.hover .pb-cell,#market_context_headcrab:active .pb-cell,#market_context_headcrab.active .pb-cell{background:#f8f0d3!important}html>body>:not(#mbr-citilink-container):not(#mbr-citilink-container):not(#mbr-citilink-container)#market_context_headcrab{display:table!important;visibility:visible!important;opacity:100!important;font:13px/38px Arial,sans-serif!important;cursor:pointer;color:#000;width:100%!important;min-width:800px!important;height:35px!important;position:fixed;top:0;left:0;right:0;z-index:2147483647;border-bottom:1px solid #c8c3ad;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;-o-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.13);-moz-box-shadow:0 1px 3px rgba(0,0,0,.13);box-shadow:0 1px 3px rgba(0,0,0,.13)}html>body>:not(#mbr-citilink-container):not(#mbr-citilink-container):not(#mbr-citilink-container)#market_context_headcrab.clickable_off{cursor:default}#market_context_headcrab .pb-dash{font:13px/38px Arial,sans-serif!important}#market_context_headcrab strong{font-weight:700!important}#market_context_headcrab .pb-cell{display:table-cell;vertical-align:top!important;white-space:nowrap;text-align:left!important;font:13px/38px Arial,sans-serif!important;color:#000!important}#market_context_headcrab .pb-sitebar-logo{vertical-align:middle!important}#market_context_headcrab .pb-sitebar-logo img{display:block!important;max-width:inherit!important;margin:0 14px 0 11px!important;max-height:37px!important}#market_context_headcrab .pb-sitebar-options{width:89px;padding:0 5px 0 27px;text-align:right!important;box-sizing:initial!important;font-size:0!important}#market_context_headcrab .pb-sitebar-i,#market_context_headcrab .pb-caret,.pb-sitebar_popover-close,.pb-icheckbox,#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label input,#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label .jq-checkbox{width:16px;height:16px;text-indent:-9999px;display:inline-block;vertical-align:top!important;overflow:hidden;margin:11px 6px 0 7px;position:relative;background:url(data:image/png;base64,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) 0 0 no-repeat}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVR42mP4//8/AyUYBoSAWBuIjYDYGA82AGJFIGYBaYIZwAfEOkDMxUAYMAGxFBCrIxugCHUBKQBkITvMADUg5iHRALCeUQOGlQEUJySKkzJlmYnS7AwAm1iSw3nOshwAAAAASUVORK5CYII=) 0 4px no-repeat;cursor:pointer;font-weight:400!important;font-size:1em!important;color:#000!important;line-height:24px}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label.checked{background:url(data:image/png;base64,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) 0 2px no-repeat}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label input{opacity:0!important;cursor:pointer}#market_context_headcrab .pb-sitebar-close{background-position:-32px 0;margin-left:5px}#market_context_headcrab .pb-sitebar-close:hover{background-position:-32px -16px}#market_context_headcrab .pb-sitebar-close:focus,#market_context_headcrab .pb-sitebar-close:active{background-position:-32px -32px}#market_context_headcrab .pb-sitebar-question:hover{background-position:0 -16px}#market_context_headcrab .pb-sitebar-question:focus,#market_context_headcrab .pb-sitebar-question:active{background-position:0 -32px}#market_context_headcrab .pb-sitebar-settings{background-position:-16px 0}#market_context_headcrab .pb-sitebar-settings:hover{background-position:-16px -16px}#market_context_headcrab .pb-sitebar-settings:focus,#market_context_headcrab .pb-sitebar-settings:active{background-position:-16px -32px}#market_context_headcrab .pb-sitebar-btns{text-align:right!important;position:relative;vertical-align:middle!important}#market_context_headcrab .pb-sitebar-button{cursor:pointer;*cursor:pointer;height:26px;display:inline-block;*display:inline;*zoom:1;text-decoration:none;text-align:center;color:#000!important;padding:0 22px;line-height:25px!important;background:#fff;border:1px solid rgba(0,0,0,.2)!important;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;transition:all .2s ease 0s}#market_context_headcrab .pb-sitebar-btns .pb-sitebar-button{margin:0 2px 0 3px!important;*margin:0 4px 0 5px!important;vertical-align:middle!important;position:relative;top:-1px}#market_context_headcrab .pb-sitebar-button:hover{border-color:rgba(0,0,0,.3)!important;background:#fff}#market_context_headcrab .pb-sitebar-button:focus,#market_context_headcrab .pb-sitebar-button:active{background-color:#f6f5f3;border-color:rgba(0,0,0,.2)!important}#market_context_headcrab .pb-sitebar-button-all~.pb-sitebar-button{right:249px}#market_context_headcrab .pb-sitebar-button-all{background:transparent}#market_context_headcrab .pb-sitebar-button-all:hover{background:#f8f0d3;border-color:#B2B2B2!important}#market_context_headcrab .pb-sitebar-button-all:focus,#market_context_headcrab .pb-sitebar-button-all:active{background:#FFEBA0;border-color:rgba(153,122,0,.5)!important}#market_context_headcrab .pb-sitebar-button-all .pb-caret{vertical-align:middle!important;background-position:-64px 0;margin:0 -3px 0 5px!important;border:0!important}#market_context_headcrab .pb-sitebar-button-all:hover .pb-caret,#market_context_headcrab .pb-sitebar-button-all:active .pb-caret{}#market_context_headcrab.shoplist.shoplist .pb-caret{background-position:-64px -32px}#market_context_headcrab .pb-sitebar-cnt{text-align:left;white-space:nowrap}#market_context_headcrab .pb-sitebar-cnt div{display:inline-block;vertical-align:top!important}#market_context_headcrab .pb-sitebar-text{text-overflow:ellipsis;overflow:hidden;max-width:85%;float:left}#market_context_headcrab .pb-sitebar-price{font-weight:700!important;background:none!important;position:relative!important}#market_context_headcrab .pb-sitebar-cnt div.pb-sitebar-price-without-delivery{min-width:20%;color:#898163!important}#market_context_headcrab .pb-sitebar-welcome .settings-link{color:#777!important}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-price{width:78px;overflow:hidden}#market_context_headcrab .pb-sitebar_popover{cursor:auto;position:fixed;top:53px;right:38px;width:356px;padding:45px 40px 25px 50px;font:12px/24px arial,sans-serif;color:#000;background:#fff;border:1px solid rgba(0,0,0,.1);text-align:left!important;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;-o-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:0 10px 20px rgba(0,0,0,.4);-moz-box-shadow:0 10px 20px rgba(0,0,0,.4);box-shadow:0 10px 20px rgba(0,0,0,.4)}#market_context_headcrab .pb-sitebar_popover_large{width:540px}#market_context_headcrab .pb-sitebar_popover *{margin:0;padding:0;font-family:arial,sans-serif!important}#market_context_headcrab .pb-sitebar_popover a{color:#669!important;text-decoration:underline!important;display:inline!important;border:0!important;font-weight:400!important;cursor:pointer!important}#market_context_headcrab .pb-sitebar_popover a.pb-color{color:#070!important}#market_context_headcrab .pb-sitebar_popover a:hover,#market_context_headcrab .pb-sitebar_popover a:active{color:red!important;text-decoration:underline!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer{background:#f0f0f0;margin-top:20px;font-size:11px!important;line-height:18px!important;color:#999!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer .pb-items{margin:0 -7px 0 -8px!important;padding:0!important;list-style:none!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer .pb-item{margin:0 7px 0 8px!important;list-style:none!important;display:inline!important;color:#999!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer a{color:#4a4a4a!important;font-size:11px!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer a:hover,#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover_footer a:active{color:#2a2a2a!important}#market_context_headcrab .pb-sitebar_popover .pb-product-all .pb-sitebar_popover_footer{margin:20px -30px -30px;padding:19px 30px}#market_context_headcrab .pb-sitebar_popover a.link-inside,#market_context_headcrab .pb-sitebar_popover a.link-inside:hover{text-decoration:none!important}#market_context_headcrab .pb-sitebar_popover a.link-inside{border-bottom:1px dashed!important}#market_context_headcrab .pb-sitebar_popover ul,#market_context_headcrab .pb-sitebar_popover li{list-style:none!important;font-size:1em!important}#market_context_headcrab .pb-sitebar_popover h1{border:0!important;position:static!important}#market_context_headcrab .pb-sitebar_popover p{font-size:1em!important;color:#000!important;margin:0 0 2em!important}#market_context_headcrab .pb-sitebar_popover label{font-weight:400!important}#market_context_headcrab .pb-sitebar_popover_product{right:123px;padding:30px}#market_context_headcrab.shoplist .pb-sitebar_popover_product,#market_context_headcrab.shoplist .pb-sitebar_popover_clothes{display:block!important}#market_context_headcrab .pb-sitebar_popover .pb-title{font:700 12px/24px arial,sans-serif!important;color:#000!important;margin:0!important;text-align:left!important;border:0!important}#market_context_headcrab .pb-sitebar_popover_policy .pb-title{font-weight:400!important;margin:0 0 16px!important}#market_context_headcrab .pb-sitebar_popover .pb-footer{color:#a9a9a9!important;font-size:11px!important;line-height:18px!important}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label{margin:1em 0 0 -22px!important;padding:0 0 0 22px!important;position:relative!important;display:block!important;width:auto!important}#market_context_headcrab .pb-sitebar_popover .pb-icheckbox,#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label input,#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label .jq-checkbox{padding:0;background-position:-80px 0;display:block;position:absolute!important;left:0!important;top:4px!important;width:16px!important;height:16px!important}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label input{top:-7px!important;left:-8px!important}#market_context_headcrab .pb-sitebar_popover .pb-icheckbox:hover,#market_context_headcrab .pb-sitebar_popover .pb-icheckbox.hover{background-position:-80px -16px}#market_context_headcrab .pb-sitebar_popover .pb-icheckbox.checked{background-position:-80px -32px;height:17px!important;top:2px!important}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label:first-child{margin-top:0!important}#market_context_headcrab .pb-sitebar_popover .pb-checkbox-label b{display:block!important;font-weight:700!important}#market_context_headcrab .pb-sitebar_popover_settings .pb-btn{margin-top:15px!important;margin-bottom:10px!important}#market_context_headcrab .pb-sitebar_popover .pb-btn-cnt{margin:0 0 .7em!important}#market_context_headcrab .pb-sitebar_popover .pb-btn{display:inline-block!important;margin:0 6px 10px 0;*margin:0 10px 10px 0;padding:0 19px;text-align:center!important;text-decoration:none!important;font:13px/25px Arial,sans-serif!important;color:#000!important;min-width:118px;height:28px;border:1px solid rgba(0,0,0,.2)!important;transition:all .2s ease 0s;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}#market_context_headcrab .pb-sitebar_popover .pb-btn:last-child{margin-right:0;*margin-right:0}#market_context_headcrab .pb-sitebar_popover .pb-btn:hover,#market_context_headcrab .pb-sitebar_popover .pb-btn:focus,#market_context_headcrab .pb-sitebar_popover .pb-btn:active{color:#000!important;text-decoration:none!important}#market_context_headcrab .pb-sitebar_popover .pb-btn:hover{border-color:rgba(0,0,0,.3)!important}#market_context_headcrab .pb-sitebar_popover .pb-btn:focus,#market_context_headcrab .pb-sitebar_popover .pb-btn:active{background:#f6f5f3;border-color:rgba(0,0,0,.2)!important}#market_context_headcrab .pb-sitebar_popover .pb-btn-primary{min-width:128px;background:#FDE100;border:1px solid #C8B100!important}#market_context_headcrab .pb-sitebar_popover .pb-btn-primary:hover{border-color:#AF9D00!important}#market_context_headcrab .pb-sitebar_popover .pb-btn-primary:focus,#market_context_headcrab .pb-sitebar_popover .pb-btn-primary:active{background:#FFD100;border-color:#AF9D00!important}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover-close{position:absolute;right:7px;top:7px;background-position:-48px 0}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover-close:hover{text-decoration:none!important;background-position:-48px -16px}#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover-close:focus,#market_context_headcrab .pb-sitebar_popover .pb-sitebar_popover-close:active{text-decoration:none!important;background-position:-48px -32px}#market_context_headcrab .pb-product-best{border-bottom:solid 1px #eee;position:relative;overflow:hidden;padding-top:4px;padding-bottom:9px;margin-top:-4px;margin-bottom:11px}#market_context_headcrab .pb-product-best-img{width:70px;float:left}#market_context_headcrab .pb-product-best-img img{border:1px solid #eee;max-width:48px;display:block}#market_context_headcrab .pb-product-best-txt{width:267px;float:left}#market_context_headcrab .pb-sitebar_popover h1.pb-disclaimer{position:absolute!important;color:#999!important;right:30px;top:6px;font-size:12px!important;font-weight:inherit!important}#market_context_headcrab .pb-product-best-btn{padding-top:28px;width:118px;float:right;clear:right}#market_context_headcrab .pb-product-best-btn .pb-btn{width:118px;min-width:118px}#market_context_headcrab .pb-product-best-btn .pb-btn:hover{text-decoration:none!important}#market_context_headcrab .pb-product-all .pb-divider{width:100%!important;border:0!important;height:1px!important;background:#e5e5e5!important;display:block!important;visibility:visible!important;margin:18px 0 11px!important}#market_context_headcrab .pb-product-best h1,#market_context_headcrab .pb-product-all h1{color:#999;font-weight:400;font-size:13px;padding:4px 0 2px;text-align:left}#market_context_headcrab .pb-product-best h1{padding:0 0 2px;margin:0}#market_context_headcrab ul.pb-products{margin:0 -30px -2px!important}#market_context_headcrab .pb-products li,#market_context_headcrab .pb-products p{*zoom:1;margin:0!important;line-height:inherit!important}#market_context_headcrab .pb-products li:hover{background:#ffeba0}#market_context_headcrab .pb-products li:before,#market_context_headcrab .pb-products p:before,#market_context_headcrab .pb-products li:after,#market_context_headcrab .pb-products p:after{display:table;content:\" \"}#market_context_headcrab .pb-products li:after,#market_context_headcrab .pb-products p:after{clear:both}#market_context_headcrab .pb-products a{display:block!important;*zoom:1;position:relative;padding:2px 0 1px;overflow:hidden}#market_context_headcrab .pb-products a:hover,#market_context_headcrab .pb-products a:active{color:#669!important}#market_context_headcrab .pb-products .pb-products-name{float:left;max-width:242px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}#market_context_headcrab .pb-product-best .pb-products .pb-products-name{max-width:177px}#market_context_headcrab .pb-products .pb-products-price{font-size:13px!important;float:right!important;clear:right!important;font-weight:700!important;color:#000!important;text-align:right!important;margin:1px 0 0 10px!important}#market_context_headcrab .pb-products-rate{width:85px;float:right;clear:right;margin-top:4px;margin-right:62px}#market_context_headcrab .pb-products-rate,#market_context_headcrab .pb-products-rate-active{height:16px;overflow:hidden;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAgCAYAAAD0S5PyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmZJREFUeNqkVc9rE0EUnk21TVODLXiwSXUxEsRLCj2VoJcUcoiiRwVz8JhDyCHgxYO39uTV/AGW/gHtIYcWcmghAQOiufTctIUgMSYUadGU9Xvr2zKdzM7S9MHHzM578/Z7P2bGchxHmMSyrEkMMHP++tmERLDMMMRYTsDCcxLh+VhMwplMZiKVSt3EfNLP6EZQKPl8XnQ6HdFqtYjRHy1jv8Ra//kv9Pv9UK/XE4lEYojvY609L0aBeQkxIF4ul23oXRQKBZt1dxVEXSactNvAbLVaFbFYTEQiEZFMJi/9sNlsiuFwKMBO5HI5WuoDA5eJB6oCcL9SqVwwUEE6siHbi32yE3ZEVYjX6/URB7VajRzEyUbeE9LkiCowwB9H8sdrv9gmsE/C2WzWnTQaDTcXJOgZGqa11VHCIbnX7XbtYrFocwXmS6WS3W636XtB3adzMpVOp8mYMEstw5gDExvda6s5GWk2lHuOq/QTujNFF8ZwBziBbmAKh/olpK5L+gmyMTJR5WTPWsJwGn3q7F/nPskDr4xXhokJWBD1I7e1hXgMNs44TDJc4kfA4rjhvJHmr68cDkKhMnf4miA5AB7oQnKdYEMR87fMzAM5eajYfwXUW3/dux4/AbeANe5OP1mSTwzwns7lpXDA6CWGjaAnAvKb8oXQNrU5gSOqwhZfPDppAy/g4LtvdVj5wcDinezAVOKswclKYIkRDiX7Bx19XvrC75OX1GO6b+RS65gsswMyWgWeAGngI+vjavfqXsDnwCEdPPxtV84FWG5j/Aw8A76ZmFD5FhUHXtJ3MKSAc3n9nwADAP67YTz5bbWmAAAAAElFTkSuQmCC) 0 0 repeat-x}#market_context_headcrab .pb-products-rate-active{display:block;background-position:0 -16px;text-indent:-9999em}#market_context_headcrab .pb-products-rate-active-0{width:0}#market_context_headcrab .pb-products-rate-active-1{width:17px}#market_context_headcrab .pb-products-rate-active-2{width:34px}#market_context_headcrab .pb-products-rate-active-3{width:51px}#market_context_headcrab .pb-products-rate-active-4{width:68px}#market_context_headcrab .pb-products-rate-active-5{width:100%}#market_context_headcrab .pb-products-txt{width:337px;float:left;padding-left:30px}#market_context_headcrab .track{width:1px!important;height:1px!important;position:absolute!important;bottom:0;right:0}#market_context_headcrab .sitebar__logo{position:absolute;top:0;left:0;width:80px;height:37px;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAlCAMAAACAj7KHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAMlQTFRF2NS+IiIifJS6oq+8zcy+TnS4u7OXwsW9W324wbibgpm61dK+T3W4wLealaa7y8y+aoe5zMOki4VyjJ+7qbO8rba8xMa91Muqtq6TxMe9mKi7dI65n6281tO+lI550cinbou5ZYS5VHi4U1BH4de05d6/vLSXp6CHwcS9n5mCg5m61NG+JiYl39m/5N2/4Nq/iYNwfZW6l6e7nZaAXH645ty3ysGiboq5OTgzgXxrJCQjMTAt4Nazhpu6p7K8iIJwjYh0S3K4/////a6jsQAAAEN0Uk5T////////////////////////////////////////////////////////////////////////////////////////AEFiBO8AAACzSURBVHjazNPFFsMgEAVQphJp6u7u7m7k/z+qoSGkkdl1kbfizF0MMEB0LCTIsgqzzHwkQlmmqESX/n1ilD79Raa0Q1xZmHvbU09CplRRaaCit1EpoDKIY8KO5EzOkrFbiuKuld+y8qjYU9ha1e4mrznmo30vtlZPeSd3SiflP70DdS2J0ihbskUFgDKHF8CtL+RtyIVLz1gPhRzncE1waQKcD3af1i4j+kiTe9D/wkeAAQCf8NnweFJ78gAAAABJRU5ErkJggg==);background-repeat:no-repeat;background:#fdeeaa;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.13);-moz-box-shadow:0 1px 3px rgba(0,0,0,.13);box-shadow:0 1px 3px rgba(0,0,0,.13)}#market_context_headcrab.lowest .pb-sitebar-text:not(.lowest){display:none!important}#market_context_headcrab.profitable .pb-sitebar-text:not(.profitable){display:none!important}#market_context_headcrab .pb-sitebar_popover .app-title{font:15px Arial,sans-serif}#market_context_headcrab .pb-sitebar_popover .pb-btn-attention{background:#489413;background-image:inherit!important;-webkit-animation:greenPulse 2s infinite;-moz-animation:greenPulse 2s infinite;-ms-animation:greenPulse 2s infinite;-o-animation:greenPulse 2s infinite;animation:greenPulse 2s infinite}@-webkit-keyframes greenPulse{0%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}50%{background:#489413;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25)}100%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}}@-moz-keyframes greenPulse{0%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}50%{background:#489413;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25)}100%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}}@-ms-keyframes greenPulse{0%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}50%{background:#489413;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25)}100%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}}@-o-keyframes greenPulse{0%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}50%{background:#489413;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25)}100%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}}@keyframes greenPulse{0%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}50%{background:#489413;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24),0 0 6px rgba(0,0,0,.25)}100%{background:#5fbb53;-webkit-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);-moz-box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24);box-shadow:inset 0 -1px #344d11,inset 0 0 1px rgba(255,255,255,.24)}}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-button{display:none}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-options{display:none!important}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-button{display:none}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-settings{display:none}#market_context_headcrab.pb-sitebar_offer .pb-sitebar-options{right:-24px}#market_context_headcrab:not(.pb-sitebar_offer) .pb-sitebar-offer{display:none}#market_context_headcrab .pb-sitebar-welcome{display:block!important}#market_context_headcrab .pb-sitebar_popover_feedback{right:67px;display:none}#market_context_headcrab .pb-sitebar_popover_feedback ul{padding:0!important;margin:11px 0 21px!important;list-style:none}#market_context_headcrab .pb-sitebar_popover_feedback li{margin:10px 0}#market_context_headcrab .pb-sitebar_popover_feedback li a.active{color:#000!important}#market_context_headcrab .pb-sitebar_popover_feedback li a.pb-link-underline{color:#777!important;text-decoration:underline!important}#market_context_headcrab .pb-sitebar_popover_feedback form{text-align:right;padding-bottom:5px;display:none}#market_context_headcrab .pb-sitebar_popover_feedback form.error-shown{display:block}#market_context_headcrab .pb-sitebar_popover_feedback form .pb-btn{margin:0;height:26px}#market_context_headcrab .pb-sitebar_popover_feedback li p{margin:10px 0;display:none}#market_context_headcrab .pb-sitebar_popover_feedback textarea{border:1px solid #eee!important;width:100%!important;height:140px!important;margin:17px 0 8px!important;color:#000!important;padding:5px!important;background:#fff!important;font:12px/15px Arial,sans-serif!important;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}#market_context_headcrab a:after{background:none!important;height:0;width:0;margin:0}#market_context_headcrab.without_settings .pb-sitebar-options{width:60px}#market_context_headcrab.without_settings .pb-sitebar-settings{display:none!important}#market_context_headcrab.without_settings .pb-sitebar_popover_feedback{right:38px!important}#market_context_headcrab.without_settings .pb-sitebar_popover_product,#market_context_headcrab.without_settings .pb-sitebar_popover_clothes{right:94px!important}#market_context_headcrab.without_about_link .link-about{display:none!important}#market_context_headcrab .pb-sitebar_popover .link-underline{color:#777!important;text-decoration:underline!important}#market_context_headcrab .pb-sitebar_popover_clothes{max-height:345px;right:123px;display:none}#market_context_headcrab .pb-sitebar_popover_clothes .pb-title{text-align:center!important;margin:-7px 0 16px!important;font-size:15px!important}#market_context_headcrab .pb-sitebar-carousel-item{width:128px!important;margin:0 11px 1px;position:relative;text-align:center;float:left}#market_context_headcrab .pb-sitebar-carousel-item a{display:block!important;cursor:pointer!important}#market_context_headcrab .pb-sitebar-carousel-item a,#market_context_headcrab .pb-sitebar-carousel-item a:hover{text-decoration:none!important}#market_context_headcrab .pb-sitebar-carousel-item a:hover .pb-sitebar-carousel-title{text-decoration:underline!important}#market_context_headcrab .pb-sitebar-carousel-img{height:130px;width:100%;display:table-cell;vertical-align:middle;width:125px}#market_context_headcrab .pb-sitebar-carousel-img img{border:1px solid #e7e7e7;display:block;margin:0 auto;max-width:103px;max-height:128px}#market_context_headcrab .pb-sitebar-carousel-title{font-weight:400!important;font-size:12px!important;margin:9px 0 0!important;height:40px;overflow:hidden;line-height:18px!important}#market_context_headcrab .pb-sitebar-carousel-price{font-weight:700;color:#000}#market_context_headcrab .pb-sitebar-carousel-item p.pb-sitebar-carousel-url{font-size:11px!important;color:#777!important}#market_context_headcrab .pb-sitebar-carousel .slick-prev,#market_context_headcrab .pb-sitebar-carousel .slick-next{width:20px;height:20px;border:0;outline:0;cursor:pointer;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAa1JREFUeNrEljFIQlEUhm8JgpMQNLm6OgWC0CQ0BGHQFLrUJAbSakuDS64iFEJQCEpTkCRtroHQ5OrqJASCIAjy+oM/eNzutXPfe9APH8rhnnP+573vHrc8z1N+tdtttUFn4BZ8gONyufyp/hDq7eDjBeyBC/BoW4t6v2LbSq4CuAcJsA86wrwO1yeYX3DoKTaYBU8g5osdCHP962Ksk43SYBq88hfw613YQ1+XYL10FAZ3wRs//ZqCktBgiesldZ0M2p50Dg4NTW2acv1cuDMig7azsgInYKzcNGbeSnC2RQZblrftHAxVMA2Zb7odWi4GL0HFEL8CPRVOPdbRVWFfkcFrQ+wONFQ0arCepK/TRf0vMhmsW7agFlHPmuUI1aUGm5YtuAHFkOaKrGM6Qk2XLa6CviH+APIBzeWZr6vPfk7XzBqcgpEWj4NnkHE0l2FeXIuP2GcdZJIswRGYaPEkx1RKaC7F9UktPmH9ZZhZPOOYmhmadoUGu4aHsdUNdM3YnjQnNJgT7kyo/4OmszIQ5g4EZzu0wZ+37XuWLjbMVbVhfi/4ve/ydn0JMAClkWAH05a3wQAAAABJRU5ErkJggg==) no-repeat;text-indent:-9999em;position:absolute;top:55px}#market_context_headcrab .pb-sitebar-carousel .slick-prev{left:-4px}#market_context_headcrab .pb-sitebar-carousel .slick-next{background-position:-20px 0;right:-4px}#market_context_headcrab .pb-sitebar-carousel .slick-prev:before,#market_context_headcrab .pb-sitebar-carousel .slick-next:before{content:''}#market_context_headcrab .pb-sitebar-carousel .slick-prev.slick-disabled,#market_context_headcrab .pb-sitebar-carousel .slick-next.slick-disabled{opacity:.3;filter:alpha(opacity=30);*zoom:1}#market_context_headcrab .pb-sitebar-carousel{height:220px!important;overflow:hidden}#market_context_headcrab .pb-sitebar-carousel-items{height:100%;position:relative;width:200%;left:0;transition:left 1s linear}.fotorama--fullscreen{z-index:2147483647!important}@font-face{font-family:RoubleArial;src:url(\"data:font/truetype;base64,AAEAAAAQAQAABAAATFRTSAN3AgwAAAIQAAAADk9TLzJotF+SAAABiAAAAGBWRE1Ybm52mQAAAiAAAAXgY21hcAl/E/EAAAkcAAABJGN2dCAAFAAAAAALzAAAAAZmcGdtBlmcNwAACkAAAAFzZ2x5Zp8dTugAAAvUAAACwGhkbXgFN3HGAAAIAAAAARxoZWFkA2OHDgAAAQwAAAA2aGhlYQd+A4kAAAFEAAAAJGhtdHgMGQEqAAAB6AAAAChsb2NhAsABYAAADpQAAAAWbWF4cAIXAZwAAAFoAAAAIG5hbWVNQun4AAAOrAAAATtwb3N0Pjb5lgAAD+gAAABTcHJlcBz8fZwAAAu0AAAAFgABAAAAAQAAufRle18PPPUAGQPoAAAAANBQc58AAAAA0FLPzQCVAAAC/wK8AAAACQACAAAAAAAAAAEAAAMg/zgAyAPoAJUAXgL/AAEAAAAAAAAAAAAAAAAAAAAKAAEAAAAKACgAAgAAAAAAAQAAAAAACgAAAgABcwAAAAAAAwGDArwABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAAAAAAIBAAAAAAAAAAAAAAAAUFlSUwBAAAAEQwMg/zgAyAK8AAAAAAABAAAAAAGQAyAAAAAgAAAASwAAA+gAAAAAAAAASwAAAEsAAANdAJUASwAAAEsAAAAAAAADXQCVAAAACgEBAQEBOwEBATsAAAAAAAEAAQEBAQEADAD4CP8ACAAGAAAACQAHAAAACgAHAAAACwAIAAAADAAJAAAADQAKAAAADgAKAAAADwALAAAAEAAMAAAAEQAMAAAAEgANAAAAEwAOAAAAFAAOAAAAFQAPAAAAFgAQAAAAFwARAAAAGAARAAAAGQASAAAAGgATAAAAGwATAAAAHAAUAAAAHQAVAAAAHgAVAAAAHwAWAAAAIAAXAAAAIQAYAAAAIgAYAAAAIwAZAAAAJAAaAAAAJQAaAAAAJgAbAAAAJwAcAAAAKAAcAAAAKQAdAAAAKgAeAAAAKwAfAAAALAAfAAAALQAgAAAALgAhAAAALwAhAAAAMAAiAAAAMQAjAAAAMgAjAAAAMwAkAAAANAAlAAAANQAmAAAANgAmAAAANwAnAAAAOAAoAAAAOQAoAAAAOgApAAAAOwAqAAAAPAAqAAAAPQArAAAAPgAsAAAAPwAtAAAAQAAtAAAAQQAuAAAAQgAvAAAAQwAvAAAARAAwAAAARQAxAAAARgAxAAAARwAyAAAASAAzAAAASQA0AAAASgA0AAAASwA1AAAATAA2AAAATQA2AAAATgA3AAAATwA4AAAAUAA4AAAAUQA5AAAAUgA6AAAAUwA7AAAAVAA7AAAAVQA8AAAAVgA9AAAAVwA9AAAAWAA+AAAAWQA/AAAAWgA/AAAAWwBAAAAAXABBAAAAXQBCAAAAXgBCAAAAXwBDAAAAYABEAAAAYQBEAAAAYgBFAAAAYwBGAAAAZABGAAAAZQBHAAAAZgBIAAAAZwBJAAAAaABJAAAAaQBKAAAAagBLAAAAawBLAAAAbABMAAAAbQBNAAAAbgBNAAAAbwBOAAAAcABPAAAAcQBQAAAAcgBQAAAAcwBRAAAAdABSAAAAdQBSAAAAdgBTAAAAdwBUAAAAeABUAAAAeQBVAAAAegBWAAAAewBXAAAAfABXAAAAfQBYAAAAfgBZAAAAfwBZAAAAgABaAAAAgQBbAAAAggBbAAAAgwBcAAAAhABdAAAAhQBeAAAAhgBeAAAAhwBfAAAAiABgAAAAiQBgAAAAigBhAAAAiwBiAAAAjABiAAAAjQBjAAAAjgBkAAAAjwBlAAAAkABlAAAAkQBmAAAAkgBnAAAAkwBnAAAAlABoAAAAlQBpAAAAlgBpAAAAlwBqAAAAmABrAAAAmQBsAAAAmgBsAAAAmwBtAAAAnABuAAAAnQBuAAAAngBvAAAAnwBwAAAAoABwAAAAoQBxAAAAogByAAAAowBzAAAApABzAAAApQB0AAAApgB1AAAApwB1AAAAqAB2AAAAqQB3AAAAqgB3AAAAqwB4AAAArAB5AAAArQB6AAAArgB6AAAArwB7AAAAsAB8AAAAsQB8AAAAsgB9AAAAswB+AAAAtAB+AAAAtQB/AAAAtgCAAAAAtwCBAAAAuACBAAAAuQCCAAAAugCDAAAAuwCDAAAAvACEAAAAvQCFAAAAvgCFAAAAvwCGAAAAwACHAAAAwQCIAAAAwgCIAAAAwwCJAAAAxACKAAAAxQCKAAAAxgCLAAAAxwCMAAAAyACMAAAAyQCNAAAAygCOAAAAywCPAAAAzACPAAAAzQCQAAAAzgCRAAAAzwCRAAAA0ACSAAAA0QCTAAAA0gCTAAAA0wCUAAAA1ACVAAAA1QCWAAAA1gCW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\") format(\"truetype\");font-weight:700}.pb-rouble{font-family:RoubleArial!important}#market_context_headcrab .pb-cell .pb-rouble,#market_context_headcrab .pb-sitebar_popover_product .pb-rouble{font-size:1.05em!important}#market_context_headcrab .pb-cell .pb-rouble{display:inline-block}#market_context_headcrab .pb-footer a.pb-sitebar_software_agreement{display:block!important}",
        template: "<div id=\"market_context_headcrab\" class=\"pb-sitebar {{#showOffer}}pb-sitebar_offer pb-sitebar-price-covered{{/showOffer}} {{abClass}} {{viewModificators}}\" style=\"top:0\">{{#isAvia}}<div class=\"pb-cell pb-sitebar-logo\">{{#customLogo}} <img alt=\"\" src=\"{{customLogo}}\"> {{/customLogo}} {{^customLogo}} <img alt=\"\" src=\"data:image/png;base64,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\"> {{/customLogo}}</div>{{/isAvia}} {{#isProduct}} {{#isDefaultScript}}<div class=\"pb-cell pb-sitebar-logo\"><img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAYCAYAAAAPtVbGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAghJREFUeNpidM3ZKMXGxhrLgAZ+//m3ddcknysMVAAsrMwssgwMTB0YEixMhkAqghqWMOGSYGT4H+icvU6YKpZsm3j69O/Xr3hg+P///6ug1rCxs3HGUcMSRnQBj/zt7szMjDtA7P//Ga4z/PobQIkFP9j+fWXEFG5g8i40f8TAyChNDV/8Z2DYgiVOGv4BPbiEgYoAa8T//v17Ac0t2TXF9wYwPk7S1BIoWEBzSxh//FkJTM4/aWrJ1uk+74HURorzyH+G50x4k9///xQFGTBe////93c1Xku2P/2yC2jRc9IN//8ciJcAM6HbtoneuxkJafAq3N7FyMhYSsDQT0DqILD82PP/9/892yd7XUMpbAm66s//BYys6Jb8/wUMiuP//zPuBYbInh8XTp4+cKDhD9FlFzbgXbjjJLB4YAMqBhr6d8/Lr/8OnZ3l+42aGZbBwaGBhWGwA2ZcEnJyctbCwsLJfHx8TB8/frxPKL8pKSlFCQgIBPDy8j799OnTe4JxArKAmZn5MDBVgeX//fvn+eDBgx24bABa0Aik6qAp7e2vX7/Unz59+hZvjgdaYA+zAKyIicmRQBKGywO1CbOwsOgRLFaAmrYBqV9Q9l8gtRlv0cHIuAGJ+/jr169niErCioqK6kALHIC+OHbv3r3LhCIXGMTOwBBQ/Pnz54Znz569QZYDCDAADJjPt0ourxwAAAAASUVORK5CYII=\"></div>{{/isDefaultScript}} {{^isDefaultScript}}<div class=\"pb-cell pb-sitebar-logo\">{{#customLogo}} <img alt=\"\" src=\"{{customLogo}}\"> {{/customLogo}} {{^customLogo}} <img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAYCAYAAAAPtVbGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAghJREFUeNpidM3ZKMXGxhrLgAZ+//m3ddcknysMVAAsrMwssgwMTB0YEixMhkAqghqWMOGSYGT4H+icvU6YKpZsm3j69O/Xr3hg+P///6ug1rCxs3HGUcMSRnQBj/zt7szMjDtA7P//Ga4z/PobQIkFP9j+fWXEFG5g8i40f8TAyChNDV/8Z2DYgiVOGv4BPbiEgYoAa8T//v17Ac0t2TXF9wYwPk7S1BIoWEBzSxh//FkJTM4/aWrJ1uk+74HURorzyH+G50x4k9///xQFGTBe////93c1Xku2P/2yC2jRc9IN//8ciJcAM6HbtoneuxkJafAq3N7FyMhYSsDQT0DqILD82PP/9/892yd7XUMpbAm66s//BYys6Jb8/wUMiuP//zPuBYbInh8XTp4+cKDhD9FlFzbgXbjjJLB4YAMqBhr6d8/Lr/8OnZ3l+42aGZbBwaGBhWGwA2ZcEnJyctbCwsLJfHx8TB8/frxPKL8pKSlFCQgIBPDy8j799OnTe4JxArKAmZn5MDBVgeX//fvn+eDBgx24bABa0Aik6qAp7e2vX7/Unz59+hZvjgdaYA+zAKyIicmRQBKGywO1CbOwsOgRLFaAmrYBqV9Q9l8gtRlv0cHIuAGJ+/jr169niErCioqK6kALHIC+OHbv3r3LhCIXGMTOwBBQ/Pnz54Znz569QZYDCDAADJjPt0ourxwAAAAASUVORK5CYII=\"> {{/customLogo}}</div>{{/isDefaultScript}} {{/isProduct}}<div class=\"pb-cell pb-sitebar-cnt\" id=\"market_context_text\">{{#bestOffers}}<div class=\"pb-sitebar-text\">Советник рекомендует {{productName}} в магазине {{shop.name}}</div>{{/bestOffers}} {{^bestOffers}} {{#comparePopup}}<div class=\"pb-sitebar-text\">Сравните цены на {{productName}} в вашем регионе</div>{{/comparePopup}} {{^comparePopup}} {{#isLowestPrice}}<div class=\"pb-sitebar-text lowest\">{{#isProduct}} {{#isAvito}} Советник рекомендует новый {{productName}} в магазине {{shop.name}} {{/isAvito}} {{^isAvito}} Самая низкая цена на {{productName}} в магазине {{shop.name}} {{/isAvito}} {{/isProduct}} {{#isAvia}} Есть более дешевый билет <b>{{originCity}}</b> {{departureAt}} <b>{{destinationCity}}</b> {{returnAt}} {{/isAvia}}</div>{{/isLowestPrice}} {{^isLowestPrice}}<div class=\"pb-sitebar-text profitable\">{{#isProduct}} {{#isAvito}} Советник рекомендует новый {{productName}} в магазине {{shop.name}} {{/isAvito}} {{^isAvito}} Более выгодная цена на {{productName}} в магазине {{shop.name}} {{/isAvito}} {{/isProduct}} {{#isAvia}} Самая низкая цена Авиасейлс на авиабилет <b>{{originCity}}</b> {{departureAt}} <b>{{destinationCity}}</b> {{returnAt}} {{/isAvia}}</div>{{/isLowestPrice}} {{/comparePopup}} {{/bestOffers}} {{^comparePopup}} <span class=\"pb-dash\">&nbsp;&mdash;&nbsp;</span><div class=\"pb-sitebar-price\" id=\"market_context_price\">{{priceText}}</div>&nbsp;<div class=\"pb-sitebar-price-without-delivery\" id=\"market_context_without_delivery\">(без учета доставки)</div>&nbsp;<div class=\"pb-sitebar-profit\">{{profitText}}</div>{{/comparePopup}}</div><div class=\"pb-cell pb-sitebar-btns\">{{^comparePopup}} <a class=\"pb-sitebar-button\">{{#isProduct}} Посмотреть {{/isProduct}} {{#isAvia}} Найти билеты {{/isAvia}}</a> {{/comparePopup}} {{#shops.length}} <a id=\"market_context_shops\" class=\"pb-sitebar-button pb-sitebar-button-all\">{{#comparePopup}} Сравнить <span class=\"pb-caret\"></span> {{/comparePopup}} {{^comparePopup}} Еще варианты <span class=\"pb-caret\"></span> {{/comparePopup}}</a> {{/shops.length}} {{#clothes.length}} <a id=\"market_context_shops\" class=\"pb-sitebar-button pb-sitebar-button-all\">{{#comparePopup}} Сравнить <span class=\"pb-caret\"></span> {{/comparePopup}} {{^comparePopup}} Еще варианты <span class=\"pb-caret\"></span> {{/comparePopup}}</a> {{/clothes.length}}</div><div class=\"pb-cell pb-sitebar-options\"><a id=\"market_context_question\" class=\"pb-sitebar-i pb-sitebar-question pb-sitebar-right-action\" title=\"Инфо\">Инфо</a> <a id=\"market_context_settings\" class=\"pb-sitebar-i pb-sitebar-settings pb-sitebar-right-action\" title=\"Настройки\">Настройки</a> <a id=\"market_context_close\" class=\"pb-sitebar-i pb-sitebar-close pb-sitebar-right-action\" title=\"Закрыть\">Закрыть</a></div><div id=\"sitebar_info_popover\" class=\"pb-sitebar_popover pb-sitebar_popover_feedback\" style=\"display:none\"><a class=\"pb-sitebar_popover-close\">&times;</a><h1 class=\"pb-title\">{{#isMbrApplication}}<strong>Советник</strong>{{/isMbrApplication}} {{^isMbrApplication}}Советник для <strong>{{appName}}</strong>{{/isMbrApplication}}</h1>{{#isProduct}}<p>Это приложение подсказывает вам более выгодные цены на товары, на которые вы смотрите прямо сейчас.</p><p><a href=\"https://feedback2.yandex.ru/market/sovetnik/\" target=\"_blank\" class=\"pb-color\">Обратная связь</a></p><p class=\"pb-footer\">© 2013-2015 ООО «ЯНДЕКС» <a class=\"pb-sitebar_software_agreement\" href=\"http://legal.yandex.ru/desktop_software_agreement\" target=\"_blank\">Лицензионное соглашение</a></p>{{/isProduct}} {{#isAvia}}<p>Это приложение подсказывает вам более выгодные цены на авиабилеты в нужном вам направлении. Данные Aviasales.</p>{{/isAvia}} </div><div id=\"sitebar_feedback_popover\" class=\"pb-sitebar_popover pb-sitebar_popover_feedback\" style=\"display: none\"><a href=\"\" class=\"pb-sitebar_popover-close\">&times;</a><h1 class=\"pb-title\">Спасибо</h1><p>Мы скоро станем лучше</p></div><div id=\"sitebar_settings_popover\" class=\"pb-sitebar_popover pb-sitebar_popover_settings\" style=\"display:none; z-index:10000\"><a class=\"pb-sitebar_popover-close\">&times;</a><p>Сообщить об ошибке:<br><a class=\"wrong-product pb-color\" data-type=\"wrong-product\">Неверно определен товар</a></p><p><label id=\"price_context_dont_show_this_site\" class=\"pb-checkbox-label\"><input type=\"checkbox\" id=\"checkbox_do_not_show\">{{#isProduct}} <b>Не показывать</b> низкие цены для товаров с этого сайта {{/isProduct}} {{#isAvia}} <b>Не показывать</b> дешевые авиабилеты {{/isAvia}}</label><a href=\"{{settingsHost}}/sovetnik/#/settings\" target=\"_blank\" class=\"pb-btn pb-btn-primary\">Настройки</a></p></div>{{#showOffer}}<div id=\"sitebar_policy_popover\" class=\"pb-sitebar-offer pb-sitebar_popover pb-sitebar_popover_policy\" style=\"z-index:100000\"><a class=\"pb-sitebar_popover-close\">&times;</a><h1 class=\"pb-title\"><strong>{{appName}}</strong> может показывать более выгодные цены на&nbsp;товары в&nbsp;интернете</h1><p class=\"pb-btn-cnt\"><a id=\"price_context_show_price\" class=\"pb-btn pb-btn-primary\">Показывать</a> <a id=\"price_context_no\" class=\"pb-btn\">Нет, спасибо</a></p><p class=\"pb-footer\">Нажимая «Показывать», я&nbsp;соглашаюсь с&nbsp;условиями <a href=\"http://legal.yandex.ru/desktop_software_agreement/\" target=\"_blank\" id=\"price_context_policy\" class=\"pb-link pb-link-policy\">Лицензионного соглашения</a></p></div>{{/showOffer}} {{#showWelcome}}<div id=\"sitebar_policy_popover\" class=\"pb-sitebar-offer pb-sitebar_popover pb-sitebar_popover_policy pb-sitebar-welcome\" style=\"z-index:100000\"><a class=\"pb-sitebar_popover-close\">&times;</a><h1 class=\"pb-title\"><strong>Яндекс.Элементы</strong> помогут найти более выгодные цены на&nbsp;товары в&nbsp;интернете</h1><p class=\"pb-btn-cnt\"><a id=\"pricebar_welcome_ok\" class=\"pb-btn pb-btn-primary\">ОК</a></p><p class=\"pb-footer\">Вы можете настроить или отключить такие советы в <a href=\"{{settingsHost}}/sovetnik/#/settings\">Настройках</a></p></div>{{/showWelcome}} {{#shops.length}}<div id=\"sitebar_shops_popover\" class=\"pb-sitebar_popover pb-sitebar_popover_large pb-sitebar_popover_product\" style=\"display:none\"><a class=\"pb-sitebar_popover-close\">&times;</a><div class=\"pb-product-best\"><div class=\"pb-product-best-img\"><a href=\"{{bestShop.url}}\" class=\"shop-url\" data-type-shop=\"OfferImage\" data-type-offer=\"{{bestShop.type}}-{{bestShop.rating}}\" target=\"_blank\">{{#photo}} <img src=\"{{photo}}\" alt=\"\"> {{/photo}} {{^photo}} <img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADZQTFRF7+/v+vr68/Pz/f398PDw9PT0/Pz88fHx+fn59/f39fX18vLy+/v7+Pj49vb2/v7+////7u7urdMKSAAAAWFJREFUeNrkltl6hCAMhQPI6pIz7/+yTZh+VmeRzEVvWi8QkD/mSEik24cX/VHAlwAE18gG5ASAgzbRAnggRZ31DqhjYD6sioxtCISjVXlbHgAR6ThcUQaAw0noBB4AjPNEevLpAXi06ODNQFtSmazAFHPVzWMTMLHuda1085sJIBdcLPkTDb6ss4go1ahhE48QnYZfMgGM1mR18EVai2hpSJYWjSUbgJSQGI7vQGxDQJBJghuli2aMgJD1o1KeblbgHEu/APCnwH4IiI3Ash9RIwCn81RhBPpJWAtrxwAQmFbdZLjsMF8DPQkEEU1z9KSipTl85hdpRlyocN/D3vP78AXQ9CGFXTRnNXIRfOKDOJ130V6zLdNFbt2QZIpW3EVLN50z8lO6X7B0d7pouS/7Lr4BxGKYf7J/6G+8rEBiE66XFNJEsNC4xrVer4LuXWi2Khq1LCKU+H/+BC6vLwEGAIrei8ynYGh0AAAAAElFTkSuQmCC\" alt=\"\"> {{/photo}}</a></div><div class=\"pb-product-best-txt\"><h1>Советник рекомендует</h1><div class=\"pb-products\"><p><a href=\"{{bestShop.url}}\" class=\"shop-url\" data-type-shop=\"TopOffer\" data-type-offer=\"{{bestShop.type}}-{{bestShop.rating}}\" target=\"_blank\"><span class=\"pb-products-name\">{{bestShop.name}}</span> <span class=\"pb-products-price\">{{bestShop.price}}</span></a></p></div></div><div class=\"pb-product-best-btn\"><a href=\"{{bestShop.url}}\" target=\"_blank\" class=\"pb-btn pb-btn-primary shop-url\" data-type-offer=\"{{bestShop.type}}-{{bestShop.rating}}\" data-type-shop=\"OfferButton\">Посмотреть</a></div></div><div class=\"pb-product-all\"><h1>Другие предложения этого товара</h1><ul class=\"pb-products\">{{#byRelevanceShops}}<li><a href=\"{{url}}\" target=\"_blank\" class=\"shop-url\" data-type-offer=\"{{type}}-{{rating}}\" data-type-shop=\"Offer{{index}}\"><div class=\"pb-products-txt\"><span class=\"pb-products-name\">{{name}}</span> <span class=\"pb-products-price\">{{price}}</span></div><div class=\"pb-products-rate\"><i class=\"pb-products-rate-active pb-products-rate-active-{{rating}}\">{{rating}}</i></div></a></li>{{/byRelevanceShops}}</ul>{{#bothShopLists}}<div class=\"pb-divider\"></div>{{/bothShopLists}}<ul class=\"pb-products pb-product-all-price\">{{#byPriceShops}}<li><a href=\"{{url}}\" target=\"_blank\" class=\"shop-url\" data-type-offer=\"{{type}}-{{rating}}\" data-type-shop=\"Offer{{index}}\"><div class=\"pb-products-txt\"><span class=\"pb-products-name\">{{name}}</span> <span class=\"pb-products-price\">{{price}}</span></div><div class=\"pb-products-rate\"><i class=\"pb-products-rate-active pb-products-rate-active-{{rating}}\">{{rating}}</i></div></a></li>{{/byPriceShops}}</ul><div class=\"pb-sitebar_popover_footer\"><ul class=\"pb-items\"><li class=\"pb-item\">Цена без учета стоимости доставки</li>{{#shopDetailsUrl}}<li class=\"pb-item\"><a class=\"shop-data\" target=\"_blank\" href=\"{{shopDetailsUrl}}\">Информация о продавцах</a></li>{{/shopDetailsUrl}}<li class=\"pb-item market-data\">Данные <a href=\"http://market.yandex.ru/?clid=766\" target=\"_blank\">Яндекс.Маркета</a></li></ul></div></div></div>{{/shops.length}} {{#clothes.length}}<div id=\"sitebar_clothes_popover\" class=\"pb-sitebar_popover pb-sitebar_popover_large pb-sitebar_popover_clothes\"><a class=\"pb-sitebar_popover-close\">&times;</a><h1 class=\"pb-title\">{{productName}}</h1><div class=\"pb-sitebar-carousel\"><div id=\"clothes-carousel\" class=\"pb-sitebar-carousel-items\">{{#clothes}}<div class=\"pb-sitebar-carousel-item\"><a href=\"{{url}}\" class=\"shop-url\" target=\"_blank\" data-type-offer=\"{{type}}-{{rating}}\" data-type-shop=\"Offer{{index}}\"><div class=\"pb-sitebar-carousel-img\"><img src=\"{{photo}}{{^photo}}data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADZQTFRF7+/v+vr68/Pz/f398PDw9PT0/Pz88fHx+fn59/f39fX18vLy+/v7+Pj49vb2/v7+////7u7urdMKSAAAAWFJREFUeNrkltl6hCAMhQPI6pIz7/+yTZh+VmeRzEVvWi8QkD/mSEik24cX/VHAlwAE18gG5ASAgzbRAnggRZ31DqhjYD6sioxtCISjVXlbHgAR6ThcUQaAw0noBB4AjPNEevLpAXi06ODNQFtSmazAFHPVzWMTMLHuda1085sJIBdcLPkTDb6ss4go1ahhE48QnYZfMgGM1mR18EVai2hpSJYWjSUbgJSQGI7vQGxDQJBJghuli2aMgJD1o1KeblbgHEu/APCnwH4IiI3Ash9RIwCn81RhBPpJWAtrxwAQmFbdZLjsMF8DPQkEEU1z9KSipTl85hdpRlyocN/D3vP78AXQ9CGFXTRnNXIRfOKDOJ130V6zLdNFbt2QZIpW3EVLN50z8lO6X7B0d7pouS/7Lr4BxGKYf7J/6G+8rEBiE66XFNJEsNC4xrVer4LuXWi2Khq1LCKU+H/+BC6vLwEGAIrei8ynYGh0AAAAAElFTkSuQmCC{{/photo}}\" alt=\"\"></div><h2 class=\"pb-sitebar-carousel-title\">{{productName}}</h2><p class=\"pb-sitebar-carousel-price\">{{price}}</p><p class=\"pb-sitebar-carousel-url\">{{name}}</p></a></div>{{/clothes}}</div><button type=\"button\" data-role=\"none\" class=\"slick-prev clothes-carousel-control slick-disabled\">Previous</button> <button type=\"button\" data-role=\"none\" class=\"slick-next clothes-carousel-control {{#onePage}}slick-disabled{{/onePage}}\">Next</button></div><div class=\"pb-sitebar_popover_footer\"><ul class=\"pb-items\"><li class=\"pb-item\">Цена без учета стоимости доставки</li>{{#shopDetailsUrl}}<li class=\"pb-item\"><a class=\"shop-data\" target=\"_blank\" href=\"{{shopDetailsUrl}}\">Информация о продавцах</a></li>{{/shopDetailsUrl}}<li class=\"pb-item market-data\">Данные <a href=\"http://market.yandex.ru/?clid=766\" target=\"_blank\">Яндекс.Маркета</a></li></ul></div></div>{{/clothes.length}} <img class=\"track\" src=\"{{trackLogo}}\"></div><div class=\"mbr-citilink-container\" style=\"display:none\"></div>",
        html: null,
        _offerAccepted: void 0,
        events: {
            "click #market_context_headcrab": "_openUrl",
            "click .shop-url": "_shopOpened",
            "click #price_context_show_price": "_acceptOffer",
            "click #price_context_no": "_declineOffer",
            "click #pricebar_welcome_ok": "hideWelcomePopover",
            "click #market_context_question": "_toggleInfo",
            "click #market_context_settings": "_toggleSettings",
            "click #market_context_shops": "_toggleShops",
            "click #market_context_headcrab .pb-sitebar_popover-close": "_hidePopovers",
            "click #market_context_close": "_closePopup",
            "click #checkbox_do_not_show": "_toggleDisallowDomain",
            "click body": "_onBodyClick",
            "mouseenter .pb-sitebar-options": "_preventShowShops",
            "mouseleave .pb-sitebar-options": "_stopPreventingShowShops",
            "mouseenter #market_context_headcrab,#market_context_shops,.pb-sitebar-button": "_initShowShops",
            "mouseenter .pb-sitebar-right-action": "_cancelShowShops",
            "mouseenter .pb-sitebar-welcome": "_cancelShowShops",
            "mouseleave #market_context_headcrab": "_cancelShowShops",
            "click #sitebar_shops_popover, #sitebar_settings_popover, #sitebar_info_popover, #sitebar_clothes_popover, .pb-sitebar-welcome, #sitebar_feedback_popover": "_onPopoverClick",
            "resize window": "_onResize",
            "click .wrong-product, .high-price, .unknown-error, .wrong-region": "_sendError",
            "submit #form-error": "_sendError",
            "click .pb-sitebar-carousel .clothes-carousel-control": "_carouselControlClick"
        },
        ids: {
            pricebar: "market_context_headcrab",
            text: "market_context_text",
            price: "market_context_price",
            offerPopup: "sitebar_policy_popover",
            welcomePopover: "sitebar_policy_popover",
            offerYesButton: "price_context_show_price",
            popoverInfo: "sitebar_info_popover",
            popoverSettings: "sitebar_settings_popover",
            popoverShops: "sitebar_shops_popover",
            popoverClothes: "sitebar_clothes_popover",
            checkboxDoNotShow: "checkbox_do_not_show",
            popoverThanks: "sitebar_feedback_popover",
            formError: "form-error",
            clothesCarousel: "clothes-carousel",
            withoutDelivery: "market_context_without_delivery"
        },
        classes: {
            offerShown: "pb-sitebar_offer",
            buttonGo: "pb-sitebar-button",
            shoplist: "shoplist",
            text: "pb-sitebar-cnt",
            carouselDisabled: "slick-disabled",
            carouselPrev: "slick-prev",
            clothesCarouselControl: "clothes-carousel-control",
            optionsBlock: "pb-sitebar-options"
        },
        clean: function () {
            this.type = "", this.data = {}, this.html = null, this._offerAccepted = void 0;
        },
        init: function (a, b, c) {
            c = c || {}, this.type = a, this.extractMethod = b.method || "", this.original = b.original || {};
            try {
                this.serverResponse = JSON.stringify(b, 2, 2);
            } catch (d) {
                this.serverResponse = JSON.stringify(b);
            }
            var e;
            if (b.offers) {
                var f = b.offers.filter(function (a) {
                    return "pricebar" === a.target;
                });
                f.length && (e = f[0]);
            } else
                e = b;
            this.data = {
                isAvia: "avia" === a,
                isProduct: "product" === a,
                isAvito: c.isAvito || m.settings.isAvitoSite(),
                isDefaultScript: "undefined" != typeof c.isDefaultScript ? c.isDefaultScript : m.settings.isDefaultScript(),
                isMbrApplication: "undefined" != typeof c.isMbrApplication ? c.isMbrApplication : m.settings.isMbrApplication(),
                appName: c.appName || m.settings.getAppName(),
                showOffer: "undefined" != typeof c.showOffer ? c.showOffer : m.settings.needShowOffer(),
                isLowestPrice: e.guaranteedLowestPrice,
                isMostRelevant: e.mostRelevant,
                url: e.url,
                autoShowShopList: "undefined" != typeof c.autoShowShopList ? c.autoShowShopList : m.settings.isAutoShowingShopListEnabled(),
                bestOffers: b.bestOffers,
                viewModificators: c.viewModificators || m.settings.getViewModificators(),
                customLogo: c.customLogo || m.settings.getCustomLogo(),
                settingsHost: m.config.getSettingsHost(),
                showWelcome: c.showWelcome || m.settings.isFirstStart() && m.settings.isYandexElementsExtension()
            };
            var g = m.abtest.getModificators(b.bucketInfo);
            if (this.data.abClass = g.join(" "), this.data.ab = {}, g.forEach(function (a) {
                    this.data.ab[a] = !0;
                }.bind(this)), "product" === a && e.name) {
                var h = e.name.split("(")[0];
                this.data.originalProductName = h, h && h.length > 64 && (h = h.substr(0, 64) + "..."), this.data.productName = h, this.data.photo = e.photo, this.data.shop = e.shopInfo, this.data.type = this._getTypeOffer(e), this.data.isHigherThanCurrent = e.price.isHigherThanCurrent, this.data.isEqualToCurrent = e.price.isEqualToCurrent, this.data.shops = b.offers.map(function (a, b) {
                    return a.shopInfo.rating = Math.max(a.shopInfo.rating, 0), {
                        id: a.shopInfo.id,
                        name: a.shopInfo.name,
                        rating: a.shopInfo.rating,
                        url: a.url,
                        price: m.tools.formatPrice(a.price.value, a.price.currencyName || ""),
                        type: this._getTypeOffer(a),
                        photo: a.photo,
                        target: a.target
                    };
                }.bind(this)), this.data.bestOffers = this.data.bestOffers || !this.original.productPrice || !this.data.isAvito && (this.data.isHigherThanCurrent || this.data.isEqualToCurrent), this.data.shopDetailsUrl = m.tools.getShopDetailsUrl(this.data.shops);
                var i = !1;
                if (!i) {
                    var j = this.data.shops.filter(function (a) {
                        return "top-offer" === a.target;
                    });
                    j.length && (this.data.bestShop = j[0]);
                }
                this.data.shops = this.data.shops.filter(function (a) {
                    return "pricebar" !== a.target && ("top-offer" !== a.target || i);
                }), this.data.shops.forEach(function (a, b) {
                    a.index = b + 1;
                }.bind(this)), i ? (this.data.clothes = this.data.shops.filter(function (a) {
                    return "relevance-list" === a.target || "top-offer" === a.target;
                }), this.data.onePage = this.data.clothes.length < 4, delete this.data.shops) : (this.data.byRelevanceShops = this.data.shops.filter(function (a) {
                    return "relevance-list" === a.target;
                }), this.data.byPriceShops = this.data.shops.filter(function (a) {
                    return "price-list" === a.target;
                }), this.data.bothShopLists = !(!this.data.byRelevanceShops.length || !this.data.byPriceShops.length));
            }
            if ("avia" === a && (this.data.originCity = e.originCity, this.data.destinationCity = e.destinationCity, this.data.departureAt = m.tools.formatDate(e.departureAt), this.data.returnAt = m.tools.formatDate(e.returnAt), this.data.routeText = this.data.originCity + " " + this.data.departureAt + " - " + this.data.destinationCity + " " + this.data.returnAt), e.price && (this.data.priceText = m.tools.formatPrice(e.price.value, e.price.currencyName || "")), this.data.comparePopup) {
                if (this.data.showOffer)
                    return void m.log("do not show a pricebar if offer has not accepted");
                if (this.data.shops && 0 === this.data.shops.length || this.data.clothes && this.data.clothes.length < 2)
                    return void m.log("do not show a pricebar if we have only one offer");
            }
            return this._randomizer = this.getRandomizer(), m.log("render"), this._render(), this;
        },
        isPricebarClickable: function () {
            return !this.data.ab.clickable_off;
        },
        getRandomizer: function () {
            var a = "";
            for (var b in this.classes)
                this.classes.hasOwnProperty(b) && (a += " " + this.classes[b]);
            var d = "<div class=\"" + a + "\"></div>";
            return new c(this._getHTMLFromTemplate() + d, m.settings.getRandomNameLength(), !m.settings.needRandomize());
        },
        _getTypeOffer: function (a) {
            return a.mostRelevant ? "BestCPC" : a.guaranteedLowestPrice ? "Lowest" : "Profitable";
        },
        _injectCSS: function (a) {
            var b = document.createElement("style");
            b.textContent = a, b.text = a, document.body.appendChild(b);
        },
        _prepareExistingStyle: function () {
            var a, b, c = document.styleSheets;
            if (c) {
                for (var d = 0; d < c.length; d++)
                    if (c[d].ownerNode && "mbrstl" === c[d].ownerNode.id) {
                        a = c[d];
                        break;
                    }
                if (a && a.cssRules && a.cssRules.length)
                    for (b = a.cssRules.length, currentRule, id = 0, selector; b--;)
                        currentRule = a.cssRules[0], selector = currentRule.selectorText || "", a.insertRule(currentRule.cssText.replace(selector, this._randomizer.randomize(selector)), a.cssRules.length), a.deleteRule(0);
            }
        },
        _loadTemplate: function () {
            var a = "", b = document.getElementById("mbrtmplt");
            return b ? (a = b.innerHTML, b.parentNode.removeChild(b), a) : a;
        },
        _getHTMLFromTemplate: function () {
            var a = this.template;
            return this.html || (this.template = a || this._loadTemplate(), this.template && (this.html = m.Mustache.render(this.template, this.data))), this.html;
        },
        _render: function () {
            if (this.el)
                return void m.log("pricebar is already shown");
            this.css = this.css, this.css ? this._injectCSS(this._randomizer.randomize(this.css)) : this._prepareExistingStyle();
            var b = a.document.createElement("div"), c = this._randomizer.randomize(this._getHTMLFromTemplate());
            if (c) {
                b.innerHTML = c, this.el = b.childNodes[0], this.el.style.top = "-40px", a.document.body.appendChild(this.el), this.el.style.setProperty("display", "table", "important"), this.el.style.setProperty("opacity", "1", "important"), this.data.autoShowShopList || this.isPricebarClickable() || this.el.style.setProperty("cursor", "pointer", "important");
                var d = document.querySelector("." + this._randomizer.randomize(this.classes.text)), e = m.tools.getTextContents(d);
                e = e.replace(this.data.productName, this.data.originalProductName), d.setAttribute("title", e), this.data.showOffer ? (this._fixOfferPosition(), m.hub.trigger("pricebar:optInShow", !1, this.type)) : this.data.showWelcome ? (m.storage.set("firstStart", !0), this._fixOfferPosition()) : this.data.comparePopup || m.hub.trigger("pricebar:show", this.type), this._bindEvents(), this._animateShow(), this._fixTextWidth(), this._startPricebarHighlighting(), m.hub.trigger("pricebar:render", new Date().getTime());
                var f = Math.round(25000 * Math.random() + 5000), g = setTimeout(this._checkPricebar.bind(this), f);
                m.hub.on("pricebar:close", function () {
                    clearTimeout(g);
                });
            }
        },
        _animateShow: function () {
            var a = -39, b = parseInt(document.documentElement.style.marginTop, 10) || 0;
            document.documentElement.setAttribute("mbr-initial-margin-top", b), document.documentElement.setAttribute("mbr-initial-position", document.documentElement.style.position), m.settings.canAddRelativePosition(m.tools.getHostname(document)) && (document.documentElement.style.position = "relative");
            var c = this.el, d = setInterval(function () {
                    a += 2, b += 2, -1 === a && clearInterval(d), c.style.top = a + "px", document.documentElement.style.setProperty("margin-top", b + "px", "important");
                }, 15);
        },
        _onResize: function () {
            this._fixTextWidth(), this._fixOfferPosition();
        },
        _fixOfferPosition: function () {
            var a = this._getElementById(this.ids.price), b = this._getElementById(this.ids.offerPopup);
            a && b && (b.style.left = Math.round(a.offsetLeft - a.offsetWidth / 2) - 140 + "px");
        },
        _fixTextWidth: function () {
            for (var a, b = this._getElementById(this.ids.price), c = this._getElementById(this.ids.withoutDelivery), d = this._getElementById(this.ids.text), e = d.offsetWidth - b.offsetWidth - c.offsetWidth - 40, f = 0; f < d.childNodes.length; f++)
                if ("DIV" === d.childNodes[f].tagName) {
                    a = d.childNodes[f];
                    break;
                }
            a && a.style.setProperty("max-width", e + "px", "important"), e = d.offsetWidth - b.offsetWidth - c.offsetWidth - 40, a && a.style.setProperty("max-width", e + "px", "important");
        },
        _bindEvents: function () {
            var a, b = /^(\S+)\s(.+)$/;
            for (var c in this.events)
                this.events.hasOwnProperty(c) && (a = b.exec(c), a && a.length > 2 && this._addEventListener(a[2], a[1], this.events[c]));
        },
        _getElementById: function (a) {
            return document.getElementById(this._randomizer.randomize(a));
        },
        _querySelectorAll: function (a) {
            return document.querySelectorAll(this._randomizer.randomize(a));
        },
        _addEventListener: function (b, c, d) {
            if ("function" == typeof this[d] && (b = "window" === b && [a] || "string" == typeof b && this._querySelectorAll(b) || b)) {
                var e = this[d].bind(this);
                if (b && b[0] == a)
                    a.addEventListener(c, e, !1);
                else
                    for (var f = 0; f < b.length; f++)
                        b[f].addEventListener ? b[f].addEventListener(c, e, !1) : b[f].attachEvent && b[f].attachEvent("on" + c, e);
            }
        },
        hidePopup: function () {
            this.el.style.setProperty("display", "none", "important");
            var a = document.documentElement.getAttribute("mbr-initial-margin-top") || 0;
            document.documentElement.style.removeProperty("margin-top"), document.documentElement.style.marginTop = a + "px";
            var b = document.documentElement.getAttribute("mbr-initial-position") || "";
            document.documentElement.style.position = b;
        },
        _toggleInfo: function (a) {
            var b = this._getElementById(this.ids.popoverInfo), c = "block" === b.style.display;
            return this._hidePopovers(), b.style.display = c ? "none" : "block", c || (m.hub.trigger("pricebar:showInfoPopup", this.type), m.hub.trigger("pricebar:click", this.type, !1, "FeedbackButton")), a.stopPropagation(), !1;
        },
        _toggleSettings: function (a) {
            var b = this._getElementById(this.ids.popoverSettings), c = "block" === b.style.display;
            return this._hidePopovers(), b.style.display = c ? "none" : "block", c || (m.hub.trigger("pricebar:showSettingsPopup", this.type), m.hub.trigger("pricebar:click", this.type, !1, "SettingsButton")), a.stopPropagation(), !1;
        },
        _getShopsPopover: function () {
            return this._getElementById(this.ids.popoverShops) || this._getElementById(this.ids.popoverClothes);
        },
        _toggleShops: function (a) {
            var b = this._getShopsPopover();
            if (b) {
                var c = this._isShopsPopupVisible();
                return this._hidePopovers(), c ? this._hideShopsPopup() : this._showShopsPopup(), a && a.stopPropagation(), !1;
            }
        },
        _showShopsPopup: function () {
            if (!this._isShopsPopupVisible() && !this._isSomePopupVisible() && -1 === this.el.className.indexOf(this._randomizer.randomize(this.classes.offerShown))) {
                this._hidePopovers();
                var a = this._getShopsPopover();
                a && (this.el.className += " " + this._randomizer.randomize(this.classes.shoplist), m.hub.trigger("shop:openList", !!this.data.shops));
            }
        },
        _hideShopsPopup: function () {
            this._showShopsTimeout = null;
            var a = this._getShopsPopover();
            a && (this.el.className = this.el.className.replace(" " + this._randomizer.randomize(this.classes.shoplist), ""));
        },
        _isShopsPopupVisible: function () {
            return this._getShopsPopover() && this.el.className.indexOf(this._randomizer.randomize(this.classes.shoplist)) > -1;
        },
        _isSomePopupVisible: function () {
            var a = this._getElementById(this.ids.popoverInfo), b = this._getElementById(this.ids.popoverSettings), c = this._getElementById(this.ids.popoverThanks);
            return this._isShopsPopupVisible() || a && "none" !== a.style.display || b && "none" !== b.style.display || c && "none" !== c.style.display || this.el.className.indexOf(this._randomizer.randomize(this.classes.offerShown)) > -1;
        },
        _acceptOffer: function (a) {
            return m.hub.trigger("pricebar:optInAccept", !1, this.type), this.data.comparePopup || m.hub.trigger("pricebar:show", this.type), m.storage.set("mbr.offerAccepted", !0).then(function () {
                this._offerAccepted = !0, m.hub.trigger("script:offer", !0), this.el.className = this.el.className.replace(this._randomizer.randomize(this.classes.offerShown), ""), this._fixTextWidth();
            }.bind(this)), this._openUrl(null, !0), a.stopPropagation(), !1;
        },
        _declineOffer: function (a) {
            return m.hub.trigger("pricebar:optInDecline", !1, this.type), m.storage.set("mbr.offerAccepted", !1).then(function () {
                this.hidePopup(), m.hub.trigger("script:offer", !1);
            }.bind(this)), a.stopPropagation(), !1;
        },
        _closePopup: function (a) {
            return m.hub.trigger("pricebar:close", this.type), this.hidePopup(), "avia" === this.type && m.cookie.set("flights_context_not_show", !0, null, "/"), a.stopPropagation(), !1;
        },
        _openUrl: function (b, c) {
            if (!this.data.showOffer || this._offerAccepted || c)
                if (this.data.comparePopup)
                    this._showShopsPopup(), this._showShopsTimeout = null;
                else {
                    var d = !1;
                    if (b) {
                        var e = b.srcElement || b.target;
                        d = e.className === this._randomizer.randomize(this.classes.buttonGo);
                    }
                    this.isPricebarClickable() || d ? (m.hub.trigger("pricebar:click", this.type, d, this.type), a.open(this.data.url)) : this._showShopsPopup(), c || (this._showShopsPopup(), this._showShopsTimeout = null);
                }
            else {
                var f = this._getElementById(this.ids.offerYesButton), g = this._randomizer.randomize(" pb-btn-attention");
                f.className += g, setTimeout(function () {
                    f.className = f.className.replace(g, "");
                }, 300);
            }
            return b && b.stopPropagation(), !1;
        },
        _toggleDisallowDomain: function (a) {
            var b = this._getElementById(this.ids.checkboxDoNotShow);
            return this.domainDisallowed = !this.domainDisallowed, m.storage.set(m.tools.getHostname(document), this.domainDisallowed), this.domainDisallowed ? b.parentNode.className += " checked" : b.parentNode.className = b.parentNode.className.replace(" checked", ""), this.domainDisallowed && m.hub.trigger("pricebar:disallowDomain", this.type), a.stopPropagation(), !1;
        },
        hideWelcomePopover: function (a) {
            var b = this._getElementById(this.ids.welcomePopover);
            return b && (b.className = b.className.replace(this._randomizer.randomize("pb-sitebar-welcome"), "")), a.stopPropagation(), !1;
        },
        _hidePopovers: function (a) {
            var b = this._getElementById(this.ids.popoverInfo);
            b.style.display = "none";
            var c = this._getElementById(this.ids.popoverSettings);
            c.style.display = "none";
            var d = this._getShopsPopover();
            d && (this.el.className = this.el.className.replace(" " + this._randomizer.randomize(this.classes.shoplist), ""));
            var e = this._getElementById(this.ids.popoverThanks);
            e && (e.style.display = "none");
            var f = this._getElementById(this.ids.formError);
            f && (f.className = f.className.replace(/form-error-shown/g, ""));
            var g = a && (a.target || a.srcElement);
            g && g.parentNode && g.parentNode === d && m.hub.trigger("shop:closeButtonClicked", !!this.data.shops);
        },
        _onBodyClick: function () {
            this._hidePopovers();
        },
        _shopOpened: function (a) {
            for (var b = a.target || a.srcElement; !b.className || -1 === b.className.indexOf(this._randomizer.randomize("shop-url"));)
                b = b.parentNode;
            m.hub.trigger("shop:opened", b.getAttribute("data-type-shop"), b.getAttribute("data-type-offer"), !!this.data.shops), a.stopPropagation();
        },
        _initShowShops: function (a) {
            var b = a.srcElement || a.target;
            if (b === this.el) {
                var c = document.querySelector("." + this._randomizer.randomize(this.classes.optionsBlock));
                if (c && c.offsetLeft && a.x && a.x >= c.offsetLeft)
                    return;
            }
            this.data.autoShowShopList && !this._showingShopsPrevented && (this._hideShopsTimeout && (clearTimeout(this._hideShopsTimeout), this._hideShopsTimeout = null), this._showShopsTimeout = setTimeout(function () {
                this._showShopsPopup();
            }.bind(this), 0));
        },
        _cancelHideShops: function () {
            this._hideShopsTimeout && clearTimeout(this._hideShopsTimeout);
        },
        _cancelShowShops: function () {
            this.data.autoShowShopList && this._showShopsTimeout && (clearTimeout(this._showShopsTimeout), this._showShopsTimeout = null, this._isShopsPopupVisible() && (this._hideShopsTimeout = setTimeout(function () {
                this._isShopsPopupVisible() && this._hideShopsPopup();
            }.bind(this), 1000)));
        },
        _onPopoverClick: function (a) {
            return a.stopPropagation(), !1;
        },
        _sendError: function (a) {
            var b = a.srcElement || a.target;
            b && (m.hub.trigger("script:wrongProduct"), this._showPopoverThanks()), a.preventDefault(), a.stopPropagation();
        },
        _showPopoverThanks: function () {
            this._hidePopovers();
            var a = this._getElementById(this.ids.popoverThanks);
            a && (a.style.display = "block", setTimeout(function () {
                a && "block" === a.style.display && (a.style.display = "none");
            }, 5000));
        },
        _preventShowShops: function () {
            this._showingShopsPrevented = !0, this._cancelShowShops();
        },
        _stopPreventingShowShops: function () {
            this._showingShopsPrevented = !1;
        },
        _carouselControlClick: function (a) {
            var b = a.srcElement || a.target, c = this._randomizer.randomize(this.classes.carouselDisabled);
            if (b && -1 === b.className.indexOf(c)) {
                var d = this._getElementById(this.ids.clothesCarousel);
                if (d) {
                    var e = b.className.indexOf(this._randomizer.randomize(this.classes.carouselPrev)) > -1 ? "0px" : "-100%";
                    d.style.left = e;
                    var f = document.querySelectorAll(this._randomizer.randomize("." + this.classes.clothesCarouselControl));
                    [].slice.call(f).forEach(function (a) {
                        a.className = a.className.replace(c, "");
                    }), b.className += " " + c;
                }
            }
        },
        _startPricebarHighlighting: function () {
            var a = [];
            m.view.nameElement && a.push(m.view.nameElement), m.view.priceElement && a.push(m.view.priceElement), this._addEventListener(a, "mouseenter", "_highlightPricebar"), this._addEventListener(a, "mouseleave", "_normalizePricebar");
        },
        _highlightPricebar: function () {
            this.el.className += " hover";
        },
        _normalizePricebar: function () {
            this.el.className = this.el.className.replace(/\shover/g, "");
        },
        _checkPricebar: function () {
            if (a.getComputedStyle) {
                var b, c = a.getComputedStyle(this.el), d = c.getPropertyValue("display"), e = c.getPropertyValue("visibility"), f = c.getPropertyValue("opacity"), g = this.el.offsetTop, h = this.el.offsetLeft, i = this.el.offsetWidth, j = this.el.offsetHeight, k = a.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                if (this.el.parentNode !== document.body)
                    b = "body";
                else if ("none" === d)
                    b = "display";
                else if ("hidden" === e)
                    b = "visibility";
                else if (0 == f)
                    b = "opacity";
                else if (-1 > g || g > 0 || 0 !== h)
                    b = "position";
                else if (39 > j || Math.abs(k - i) > 100)
                    b = "size";
                else if (document.elementFromPoint) {
                    var l = Math.round(Math.random() * i + h), n = Math.round(Math.random() * j + g - 1);
                    m.log("check point " + l + "," + n);
                    var o = document.elementFromPoint(l, n);
                    do {
                        if (o === document.body || o === document) {
                            b = "zindex";
                            break;
                        }
                        if (o === this.el)
                            break;
                    } while (o = o.parentNode);
                }
                b && (m.log("unacceptable action is detected. Parameter is " + b), m.hub.trigger("script:unacceptableAction", b));
            }
        }
    };
    m.PriceBar = m.PriceBar || function (a, b, c) {
        return s.clean(), s.init(a, b, c);
    }, m.PriceBar = function (a, b, c) {
        return m.hub.on("pricebar:render", function () {
            setTimeout(e, 1000);
        }), s.clean(), s.init(a, b, c);
    }, m.view = m.view || {
        _onProductOfferFound: function (a) {
            m.pricebar = m.pricebar || new m.PriceBar("product", a);
        },
        _onAviaFound: function (a) {
            m.pricebar = m.pricebar || new m.PriceBar("avia", a);
        },
        init: function () {
            m.hub.on("suggest:productOfferFound", this._onProductOfferFound, null, this), m.hub.on("suggest:aviaFound", this._onAviaFound, null, this), m.hub.on("productPrice:found", function (a) {
                m.view.priceElement = a;
            }), m.hub.on("productName:found", function (a) {
                m.view.nameElement = a;
            });
        }
    };
    var t = !1;
    "complete" === a.document.readyState || "interactive" === a.document.readyState ? k() : a.document.addEventListener ? (a.document.addEventListener("DOMContentLoaded", k, !1), a.addEventListener("load", k, !1)) : document.attachEvent && a.attachEvent("onload", k);
}(function () {
    return window.RegExp ? window : Function("return this")();
}());
