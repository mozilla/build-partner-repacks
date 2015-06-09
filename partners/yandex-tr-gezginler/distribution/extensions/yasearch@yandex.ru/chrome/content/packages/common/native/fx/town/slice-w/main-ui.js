require(["slice/adapter/main"], function () {
    require([
        "slice/ui/main/main",
        "browser-adapter",
        "api/manager"
    ], function (mainUI, adapter, manager) {
        manager.onReady(function () {
            adapter.initSliceShowEvent();
        });
    });
});
define("main-ui", function () {
});
define("slice/ui/dayparts/dayparts", [
    "browser-adapter",
    "api/manager",
    "api/xml"
], function (adapter, manager, xml) {
    function DayPart(parent) {
        this._parent = parent;
        this._temp = parent.querySelector(".b-daypart__temp");
        this._name = parent.querySelector(".b-daypart__name");
        this._img = parent.querySelector(".b-daypart__image");
    }
    DayPart.prototype.show = function (data) {
        if (data) {
            xml.setText(this._temp, data.temperature);
            xml.setText(this._name, adapter.getString("dp." + data.type));
            this._parent.style.backgroundColor = data.bgcolor;
            this._img.style.backgroundImage = "url('images/parts/" + data.img + ".png')";
        }
        this._parent.setAttribute("data-hasvalue", !!data);
    };
    var view = {
        init: function () {
            this._parent = document.querySelector(".b-dayparts");
            this._parts = [].map.call(this._parent.querySelectorAll(".b-daypart"), function (p) {
                return new DayPart(p);
            });
        },
        observers: {
            "slice:data": function (topic, data) {
                this._parts.forEach(function (part, i) {
                    part.show(data.period[i]);
                });
                this._parent.setAttribute("data-count", data.period.length);
            }
        }
    };
    manager.onReady(view);
    return view;
});
define("slice/ui/footer/footer", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "api/utils",
    "api/xml"
], function (adapter, manager, stat, utils, xml) {
    var view = {
        init: function () {
            var link = this._link = document.querySelector(".b-footer__link");
            xml.setText(this._link, adapter.getString("url.title"));
            this._link.onclick = function (e) {
                stat.logWidget("slice.link");
                utils.navigate(link.href, e || window.event);
                return false;
            };
        },
        observers: {
            "slice:data": function (topic, data) {
                this._link.href = data.url;
            }
        }
    };
    manager.onReady(view);
    return view;
});
define("slice/ui/error-view/error", [
    "browser-adapter",
    "api/manager"
], function (adapter, manager) {
    var view = {
        init: function () {
            this._text = document.querySelector(".b-error-view");
        },
        observers: {
            "weather:error": function (topic, data) {
                this._text.innerHTML = adapter.getString("error." + data.type).replace("##", "<br />");
            }
        }
    };
    manager.onReady(view);
    return view;
});
!function (e) {
    if ("object" == typeof exports)
        module.exports = e();
    else if ("function" == typeof define && define.amd)
        define("jade", ["browser-adapter"], e);
    else {
        var f;
        "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.jade = e();
    }
}(function (adapter) {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a)
                        return a(o, !0);
                    if (i)
                        return i(o, !0);
                    throw new Error("Cannot find module '" + o + "'");
                }
                var f = n[o] = { exports: {} };
                t[o][0].call(f.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, f, f.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++)
            s(r[o]);
        return s;
    }({
        1: [
            function (_dereq_, module, exports) {
                exports.i18n = function i18n(key) {
                    return adapter && adapter.getString ? adapter.getString(key) : "";
                };
                exports.merge = function merge(a, b) {
                    if (arguments.length === 1) {
                        var attrs = a[0];
                        for (var i = 1; i < a.length; i++) {
                            attrs = merge(attrs, a[i]);
                        }
                        return attrs;
                    }
                    var ac = a["class"];
                    var bc = b["class"];
                    if (ac || bc) {
                        ac = ac || [];
                        bc = bc || [];
                        if (!Array.isArray(ac))
                            ac = [ac];
                        if (!Array.isArray(bc))
                            bc = [bc];
                        a["class"] = ac.concat(bc).filter(nulls);
                    }
                    for (var key in b) {
                        if (key != "class") {
                            a[key] = b[key];
                        }
                    }
                    return a;
                };
                function nulls(val) {
                    return val != null && val !== "";
                }
                exports.joinClasses = joinClasses;
                function joinClasses(val) {
                    return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(" ") : val;
                }
                exports.cls = function cls(classes, escaped) {
                    var buf = [];
                    for (var i = 0; i < classes.length; i++) {
                        if (escaped && escaped[i]) {
                            buf.push(exports.escape(joinClasses([classes[i]])));
                        } else {
                            buf.push(joinClasses(classes[i]));
                        }
                    }
                    var text = joinClasses(buf);
                    if (text.length) {
                        return " class=\"" + text + "\"";
                    } else {
                        return "";
                    }
                };
                exports.attr = function attr(key, val, escaped, terse) {
                    if ("boolean" == typeof val || null == val) {
                        if (val) {
                            return " " + (terse ? key : key + "=\"" + key + "\"");
                        } else {
                            return "";
                        }
                    } else if (0 == key.indexOf("data") && "string" != typeof val) {
                        return " " + key + "='" + JSON.stringify(val).replace(/'/g, "&apos;") + "'";
                    } else if (escaped) {
                        return " " + key + "=\"" + exports.escape(val) + "\"";
                    } else {
                        return " " + key + "=\"" + val + "\"";
                    }
                };
                exports.attrs = function attrs(obj, terse) {
                    var buf = [];
                    var keys = Object.keys(obj);
                    if (keys.length) {
                        for (var i = 0; i < keys.length; ++i) {
                            var key = keys[i], val = obj[key];
                            if ("class" == key) {
                                if (val = joinClasses(val)) {
                                    buf.push(" " + key + "=\"" + val + "\"");
                                }
                            } else {
                                buf.push(exports.attr(key, val, false, terse));
                            }
                        }
                    }
                    return buf.join("");
                };
                exports.escape = function escape(html) {
                    var result = String(html).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                    if (result === "" + html)
                        return html;
                    else
                        return result;
                };
                exports.rethrow = function rethrow(err, filename, lineno, str) {
                    if (!(err instanceof Error))
                        throw err;
                    if ((typeof window != "undefined" || !filename) && !str) {
                        err.message += " on line " + lineno;
                        throw err;
                    }
                    try {
                        str = str || _dereq_("fs").readFileSync(filename, "utf8");
                    } catch (ex) {
                        rethrow(err, null, lineno);
                    }
                    var context = 3, lines = str.split("\n"), start = Math.max(lineno - context, 0), end = Math.min(lines.length, lineno + context);
                    var context = lines.slice(start, end).map(function (line, i) {
                        var curr = i + start + 1;
                        return (curr == lineno ? "  > " : "    ") + curr + "| " + line;
                    }).join("\n");
                    err.path = filename;
                    err.message = (filename || "Jade") + ":" + lineno + "\n" + context + "\n\n" + err.message;
                    throw err;
                };
            },
            { "fs": 2 }
        ],
        2: [
            function (_dereq_, module, exports) {
            },
            {}
        ]
    }, {}, [1])(1);
});
define("slice/templates", ["jade"], function (jade) {
    if (jade && jade["runtime"] !== undefined) {
        jade = jade.runtime;
    }
    this["JTEMPLATES"] = this["JTEMPLATES"] || {};
    this["JTEMPLATES"]["daypart"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-daypart\"><div class=\"b-daypart__image\"></div><span class=\"b-daypart__deg b-daypart__deghide\">&deg;</span><span class=\"b-daypart__temp\"></span><span class=\"b-daypart__deg\">&deg;</span><div class=\"b-daypart__name\"></div></div>");
        }
        return buf.join("");
    };
    this["JTEMPLATES"]["error"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-error-view\"></div>");
        }
        return buf.join("");
    };
    this["JTEMPLATES"]["now"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-title\"></div><div class=\"b-description b-fact\"><span class=\"b-description__text\"></span><span class=\"b-description__image\"></span></div><div class=\"b-fact\"><span class=\"b-dampness__name\">" + (null == (jade.interp = jade.i18n("dampness")) ? "" : jade.interp) + "</span><span class=\"b-dampness__value\"></span></div><div class=\"b-fact\"><span class=\"b-wind__name\">" + (null == (jade.interp = jade.i18n("wind")) ? "" : jade.interp) + "</span><span class=\"b-wind__value\"></span></div><div class=\"b-fact\"><span class=\"b-pressure__name\">" + (null == (jade.interp = jade.i18n("pressure")) ? "" : jade.interp) + "</span><span class=\"b-pressure__value\"></span></div>");
        }
        return buf.join("");
    };
    return this["JTEMPLATES"];
});
define("slice/ui/now/now", [
    "browser-adapter",
    "api/manager",
    "api/xml",
    "slice/templates"
], function (adapter, manager, xml, templates) {
    function capsFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.substr(1) : "";
    }
    var view = {
        init: function () {
            var parent = document.querySelector(".b-now");
            parent.innerHTML = templates.now();
            this._title = parent.querySelector(".b-title");
            this._descr = parent.querySelector(".b-description");
            this._descrText = this._descr.querySelector(".b-description__text");
            this._descrImg = this._descr.querySelector(".b-description__image");
            this._wind = parent.querySelector(".b-wind__value");
            this._dampness = parent.querySelector(".b-dampness__value");
            this._pressure = parent.querySelector(".b-pressure__value");
        },
        observers: {
            "slice:data": function (topic, data) {
                xml.setText(this._title, data.title + ", " + data.now.temperature + String.fromCharCode(176));
                xml.setText(this._descrText, capsFirst(data.now.description));
                this._descrImg.style.backgroundImage = "url('images/now/" + data.now.img + ".png')";
                xml.setText(this._wind, data.now.windSpeed + " " + adapter.getString("wind.ms"));
                xml.setText(this._dampness, data.now.dampness + "%");
                xml.setText(this._pressure, data.now.pressure + " " + adapter.getString("pressure." + data.pressureUnit));
                this._wind.style.backgroundPosition = "1px " + (9 - (this._windDirMap[data.now.windDir] || 5)) + "px";
            }
        },
        _windDirMap: {
            sw: 5,
            nw: 21,
            ne: 37,
            se: 52,
            s: 69,
            w: 85,
            n: 101,
            e: 117
        }
    };
    manager.onReady(view);
    return view;
});
define("slice/ui/main/main", [
    "browser-adapter",
    "api/manager",
    "slice/ui/dayparts/dayparts",
    "slice/ui/footer/footer",
    "slice/ui/error-view/error",
    "slice/ui/now/now"
], function (adapter, manager) {
    var widget = {
        init: function () {
            this._parent = document.querySelector(".b-weather-widget");
            adapter.sendMessage("slice:request");
            var rsize = this._resize.bind(this);
            this._resize = function () {
                setTimeout(rsize, 20);
            };
            this._resize();
        },
        observers: {
            "slice:data": function () {
                this._parent.setAttribute("data-state", "loaded");
                this._resize();
            },
            "weather:loading": function (topic, data) {
                if (!data.sender || data.sender == "options") {
                    this._parent.setAttribute("data-state", "loading");
                    this._resize();
                }
            },
            "weather:error": function () {
                this._parent.setAttribute("data-state", "error");
                this._resize();
            }
        },
        _resize: function () {
            var width = 320;
            var height = this._parent.offsetHeight;
            adapter.log("***** H = " + height);
            adapter.resizeWindowTo(width, height);
        }
    };
    manager.onReady(widget);
});
