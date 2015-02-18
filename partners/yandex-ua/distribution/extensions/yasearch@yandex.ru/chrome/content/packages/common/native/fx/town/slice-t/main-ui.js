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
define("slice/ui/buttons/buttons", [
    "browser-adapter",
    "api/manager",
    "api/xml",
    "api/stat"
], function (adapter, manager, xmlHelper, stat) {
    var utils = {
        getTimeStr: function (sec) {
            if (sec < 31) {
                return "1 " + adapter.getString("time.m");
            }
            var m = Math.round(sec / 60);
            var h = Math.floor(m / 60 + 0.001);
            var hstr = h ? h + " " + adapter.getString("time.h") + " " : "";
            m = Math.round(m - h * 60);
            return hstr + (m ? m + " " + adapter.getString("time.m") : "");
        },
        lpad: function (num, len) {
            num = num.toString();
            while (num.length < len) {
                num = "0" + num;
            }
            return num;
        },
        getTimePointStr: function (time) {
            var dt = new Date(parseInt(time, 10));
            return this.lpad(dt.getHours()) + ":" + this.lpad(dt.getMinutes());
        }
    };
    var view = {
        init: function () {
            this._parent = document.querySelector(".b-traffic-map");
            this._traffic = this._parent.querySelector(".b-map-button_pic_ball");
            this._plus = this._parent.querySelector(".b-map-button_pic_plus");
            this._minus = this._parent.querySelector(".b-map-button_pic_minus");
            this._route = this._parent.querySelector(".b-map-button_pic_route");
            this._time = this._parent.querySelector(".b-map-button_time");
            this._map = this._parent.querySelector(".b-map-button_map");
            this._routeTraffic = this._route.querySelector(".b-map-button_pic_ball");
            xmlHelper.setText(this._map, adapter.getString("link.map"));
            this._traffic.onclick = function () {
                stat.logWidget("yamaps.{version}.slice.traffic");
                adapter.sendMessage("slice:btn-traffic");
            };
            this._plus.onclick = function () {
                stat.logWidget("yamaps.{version}.slice.zoom");
                adapter.sendMessage("slice:btn-zoom", 1);
            };
            this._minus.onclick = function () {
                stat.logWidget("yamaps.{version}.slice.zoom");
                adapter.sendMessage("slice:btn-zoom", -1);
            };
            this._route.onclick = function () {
                stat.logWidget("yamaps.{version}.slice.route");
                adapter.sendMessage("slice:btn-route");
            };
            this._map.onclick = function () {
                stat.logWidget("yamaps.{version}.slice.link");
                adapter.sendMessage("slice:btn-map");
            };
        },
        observers: {
            "slice:data": function (topic, data) {
                if (data.traffic.error) {
                    xmlHelper.setText(this._traffic, "");
                    this._traffic.setAttribute("data-color", "all");
                } else {
                    xmlHelper.setText(this._traffic, data.traffic.ball);
                    this._traffic.setAttribute("data-color", data.traffic.color);
                }
            },
            "slice:route-data": function (topic, data) {
                var metrics = data.metrics;
                xmlHelper.setText(this._routeTraffic, metrics.ball);
                this._routeTraffic.setAttribute("data-color", metrics.color);
                var timeLabel = "";
                if (metrics.isLongRoute) {
                    this._route.title = adapter.getString("error.longroute");
                } else {
                    timeLabel = utils.getTimeStr(metrics.jamsTime);
                    this._route.title = adapter.getString(data.revert ? "to.home" : "to.work", { content: timeLabel });
                }
                xmlHelper.setText(this._time, timeLabel);
                this._route.setAttribute("data-installed", "true");
            },
            "slice:route-params": function (topic, data) {
                if (!data) {
                    xmlHelper.setText(this._routeTraffic, "");
                    this._route.title = "";
                    this._routeTraffic.setAttribute("data-color", "none");
                    xmlHelper.setText(this._time, "");
                    this._route.setAttribute("data-installed", "false");
                }
            },
            "slice:map:traffic-enable": function (topic, data) {
                this._traffic.setAttribute("data-enable", data);
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
    this["JTEMPLATES"]["buttons"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-map-button b-map-button_map\"></div><div class=\"b-map-button b-map-button_pic b-map-button_pic_plus\"></div><div class=\"b-map-button b-map-button_pic b-map-button_pic_minus\"></div><div data-color=\"dis\" class=\"b-map-button b-map-button_pic b-map-button_pic_ball\"></div><div data-installed=\"false\" class=\"b-map-button b-map-button_pic b-map-button_pic_route\"><div data-color=\"none\" class=\"b-map-button_inner b-map-button_pic_ball\"></div><div class=\"b-map-button_inner b-map-button_time\"></div></div>");
        }
        return buf.join("");
    };
    this["JTEMPLATES"]["error-view"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-error-message\"></div><div class=\"b-refresh-button\"></div>");
        }
        return buf.join("");
    };
    this["JTEMPLATES"]["form"] = function anonymous(locals) {
        var buf = [];
        with (locals || {}) {
            buf.push("<div class=\"b-route-form__title\">" + (null == (jade.interp = jade.i18n("my.route")) ? "" : jade.interp) + "</div><div data-route=\"a\" class=\"b-route-form__input\"><div class=\"input-parent\"></div></div><div data-route=\"b\" class=\"b-route-form__input\"><div class=\"input-parent\"></div></div><div class=\"b-route-form__footer\"><div class=\"b-route-form__error\">" + (null == (jade.interp = jade.i18n("error.route")) ? "" : jade.interp) + "</div><input" + jade.attrs({
                "type": "button",
                "value": jade.i18n("make.route"),
                "data-type": "action",
                "class": "b-button" + " " + "b-route-form__ok"
            }, {
                "type": true,
                "value": true,
                "data-type": true
            }) + "/><input" + jade.attrs({
                "type": "button",
                "value": jade.i18n("remove.route"),
                "data-disabled": "true",
                "class": "b-button" + " " + "b-route-form__del"
            }, {
                "type": true,
                "value": true,
                "data-disabled": true
            }) + "/></div><div class=\"b-route-form__close\"></div>");
        }
        return buf.join("");
    };
    return this["JTEMPLATES"];
});
define("slice/common-ui/buttons/buttons", [], function () {
    function pressOn() {
        this.setAttribute("data-pressed", "true");
    }
    function pressOff() {
        this.removeAttribute("data-pressed");
    }
    return {
        initButton: function (button) {
            if (!button || button.__b_button_inited) {
                return button;
            }
            button.__b_button_inited = true;
            button.addEventListener("mousedown", pressOn, false);
            button.addEventListener("mouseup", pressOff, false);
            button.addEventListener("mouseout", pressOff, false);
            return button;
        },
        initParent: function (parent) {
            if (!parent) {
                return;
            }
            var arr = parent.querySelectorAll(".b-button");
            for (var i = 0; i < arr.length; ++i) {
                this.initButton(arr[i]);
            }
        }
    };
});
define("slice/common-ui/autocomplete/autocomplete", ["api/dom"], function (domHelper) {
    function Autocomplete(config) {
        this.createView(config);
        if (config.defaultItems) {
            this.defaultItems = config.defaultItems;
        }
        if (config.requestDataFn) {
            this.requestData = config.requestDataFn;
        }
        if (config.onSubmitFn) {
            this.onSubmit = config.onSubmitFn;
        }
        if (config.input) {
            this.input = config.input;
        }
        if (config.list) {
            this.list = config.list;
        }
        if (config.clearButton) {
            this.clearButton = config.clearButton;
        }
        if (config.staticList) {
            this.staticList = config.staticList;
        }
        if (config.preventEnter) {
            this.preventEnter = config.preventEnter;
        }
        this.attach();
        this.hide();
    }
    Autocomplete.prototype.MAX_INPUT_CHARS = 200;
    Autocomplete.prototype.MAX_SUGGEST_QUERY = 100;
    Autocomplete.prototype.items = [];
    Autocomplete.prototype.defaultItems = [];
    Autocomplete.prototype.lastInput = "";
    Autocomplete.prototype.listFocus = false;
    Autocomplete.prototype.listHover = null;
    Autocomplete.prototype.createView = function (config) {
        var container = config.container;
        domHelper.addClass(container, "typeahead");
        var fragment = document.createDocumentFragment();
        this.input = document.createElement("input");
        this.list = document.createElement("div");
        this.clearButton = document.createElement("div");
        this.input.className = "typeahead_auto-input";
        this.list.className = "typeahead_suggest-list";
        this.clearButton.className = "typeahead_input-clear";
        if (config.placeholder) {
            this.input.setAttribute("placeholder", config.placeholder);
        }
        if (config.initValue) {
            this.input.setAttribute("value", config.initValue);
        }
        fragment.appendChild(this.input);
        fragment.appendChild(this.list);
        fragment.appendChild(this.clearButton);
        container.appendChild(fragment);
    };
    Autocomplete.prototype.remove = function () {
        this.reset();
        this.detach();
        this.input = null;
        this.list = null;
        this.clearButton = null;
    };
    Autocomplete.prototype.attach = function () {
        this.handleInputFocus = this.handleInputFocus.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleInputKeyUp = this.handleInputKeyUp.bind(this);
        this.handleListClick = this.handleListClick.bind(this);
        this.handleCleanButtonClick = this.handleCleanButtonClick.bind(this);
        if (this.preventEnter) {
            this.handleInputKeyPress = this.handleInputKeyPress.bind(this);
        }
        var form = this.input.parentElement;
        while (form && form.tagName.toLowerCase() != "form") {
            form = form.parentElement;
        }
        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
            });
        }
        this.input.addEventListener("focus", this.handleInputFocus, true);
        this.input.addEventListener("blur", this.handleInputBlur, false);
        this.input.addEventListener("keyup", this.handleInputKeyUp, false);
        if (this.preventEnter) {
            this.input.addEventListener("keypress", this.handleInputKeyPress, false);
        }
        this.list.addEventListener("click", this.handleListClick, false);
        if (this.clearButton) {
            this.clearButton.addEventListener("mousedown", this.handleCleanButtonClick, false);
        }
        this.listHover = new MouseHover(this.list);
        this.listHover.onHover(function () {
            this.listFocus = true;
        }.bind(this));
        this.listHover.onOut(function () {
            this.listFocus = false;
        }.bind(this));
    };
    Autocomplete.prototype.detach = function () {
        this.input.removeEventListener("focus", this.handleInputFocus, true);
        this.input.removeEventListener("blur", this.handleInputBlur, false);
        this.input.removeEventListener("keyup", this.handleInputKeyUp, false);
        if (this.preventEnter) {
            this.input.removeEventListener("keypress", this.handleInputKeyPress, false);
        }
        this.list.removeEventListener("click", this.handleListClick, false);
        if (this.clearButton) {
            this.clearButton.removeEventListener("mousedown", this.handleCleanButtonClick, false);
        }
        this.listHover.removeEvents();
        this.listHover = null;
    };
    Autocomplete.prototype.handleInputFocus = function () {
        var input = this.input;
        if (input.value != "" && this.items.length) {
            this.show();
        }
        if (this.clearButton) {
            this.clearButton.style.display = input.value !== "" ? "block" : "none";
        }
    };
    Autocomplete.prototype.handleInputBlur = function (e) {
        if (this.clearButton) {
            this.clearButton.style.display = "none";
        }
        if (!this.listFocus) {
            setTimeout(function () {
                this.hide();
                var item = this.findItem(this.input.value);
                this.onSubmit(this.input.value, item);
            }.bind(this), 200);
        }
    };
    Autocomplete.prototype.handleCleanButtonClick = function () {
        this.clearButton.style.display = "none";
        this.reset();
        this.onSubmit();
        setTimeout(function () {
            this.input.focus();
        }.bind(this), 1);
    };
    Autocomplete.prototype.handleInputKeyPress = function (e) {
        if (e.keyCode === 13 && this.listVisible === true) {
            e.preventDefault();
        }
    };
    Autocomplete.prototype.handleInputKeyUp = function (e) {
        var input = this.input;
        if (this.clearButton) {
            this.clearButton.style.display = input.value !== "" ? "block" : "none";
        }
        switch (e.keyCode) {
        case 13:
            this.hide();
            var caretPos = this.input.value.length;
            if (this.input.setSelectionRange) {
                this.input.setSelectionRange(caretPos, caretPos);
            }
            if (this.onSubmit) {
                var item;
                var val = input.value;
                if (val.length > this.MAX_INPUT_CHARS) {
                    val = val.slice(0, this.MAX_INPUT_CHARS);
                    input.value = val;
                }
                item = this.findItem(val);
                this.onSubmit(val, item);
            }
            break;
        case 27:
            input.value = "";
            this.hide();
            this.onSubmit();
            break;
        case 38:
        case 40:
            e.preventDefault();
            this.selectNext(e.keyCode == 38);
            break;
        default:
            val = this.getInputValue();
            this.isComplement = e.keyCode !== 8;
            if (val == "") {
                this.hide();
                this.onSubmit();
            } else {
                if (!this.lastInput || this.lastInput != val) {
                    if (val.length < this.MAX_SUGGEST_QUERY) {
                        this.onChange(val);
                    } else if (val.length >= this.MAX_SUGGEST_QUERY) {
                        this.clearList();
                        this.items = [];
                        this.lastInput = "";
                        this.hide();
                    }
                }
            }
            this.lastInput = input.value;
        }
    };
    Autocomplete.prototype.handleListClick = function (e) {
        var item = e.target;
        while (!domHelper.hasClass(item, "b-autocomplete-item")) {
            item = item.parentNode;
            if (!item) {
                return;
            }
        }
        var index = Array.prototype.indexOf.call(this.list.children, item);
        if (index > -1 && this.items[index]) {
            item = this.items[index];
            this.input.value = item.value;
            setTimeout(this.hide.bind(this), 200);
            this.onSubmit(this.getInputValue(), item);
        }
    };
    Autocomplete.prototype.findItem = function (value) {
        value = value ? value.toLowerCase() : "";
        for (var i = 0; i < this.items.length; ++i) {
            if (this.items[i].value.toLowerCase() == value) {
                return this.items[i];
            }
        }
        return null;
    };
    Autocomplete.prototype.selectNext = function (up) {
        if (this.items.length == 0) {
            return;
        }
        var item, sibling;
        var list = this.list;
        var nodes = list.children;
        var selectedClass = "typeahead_suggest-list_selected";
        var current = list.querySelector("." + selectedClass);
        if (current) {
            domHelper.removeClass(current, selectedClass);
            sibling = up ? current.previousElementSibling || current.previousSibling : current.nextElementSibling || current.nextSibling;
            var index = Array.prototype.indexOf.call(nodes, sibling);
            item = this.items[index];
        }
        if (!item || !sibling) {
            item = up ? this.items[this.items.length - 1] : this.items[0];
            sibling = up ? list.lastChild : list.firstChild;
        }
        domHelper.addClass(sibling, selectedClass);
        if (sibling.offsetTop > sibling.offsetParent.offsetHeight - sibling.offsetHeight) {
            sibling.scrollIntoView();
        }
        this.input.value = item.value;
    };
    Autocomplete.prototype.hide = function () {
        if (this.list) {
            this.listVisible = false;
            this.list.style.display = "none";
        }
    };
    Autocomplete.prototype.show = function () {
        this.listVisible = true;
        this.list.style.display = "block";
    };
    Autocomplete.prototype._changeTimeoutId = null;
    Autocomplete.prototype.onChange = function (str) {
        clearTimeout(this._changeTimeoutId);
        if (!str) {
            this.onSubmit();
            return;
        }
        this._changeTimeoutId = setTimeout(function () {
            if (this.staticList) {
                var items = [];
                this.defaultItems.forEach(function (item) {
                    if (item.value.indexOf(str) !== -1) {
                        items.push(item);
                    }
                });
                if (items.length > 0) {
                    this.update(items);
                }
                return;
            }
            this.requestData(str, function (items) {
                this.update((items || []).concat(this.defaultItems));
            }.bind(this));
        }.bind(this), 200);
    };
    Autocomplete.prototype.onSubmit = function (inputValue, item) {
    };
    Autocomplete.prototype.requestData = function (str, callback) {
        callback([]);
    };
    Autocomplete.prototype.getInputValue = function () {
        var val = this.input.value;
        if (typeof this.selectionStart == "number") {
            val = val.slice(0, this.selectionStart);
        }
        return val;
    };
    Autocomplete.prototype.clearList = function () {
        this.list.innerHTML = "";
        if (this.list.firstChild) {
            this.list.removeChild(this.list.firstChild);
        }
    };
    Autocomplete.prototype.reset = function () {
        this.input.value = "";
        this.clearList();
        this.items = [];
        this.lastInput = "";
        this.hide();
    };
    Autocomplete.prototype.update = function (items) {
        if (items.length > 0) {
            this.show();
        } else {
            this.hide();
        }
        this.items = items;
        this.clearList();
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < items.length; ++i) {
            var node = document.createElement("div");
            node.className = "b-autocomplete-item" + (items[i].className ? " " + items[i].className : "");
            node.innerHTML = items[i].html;
            node.__value = items[i].value;
            fragment.appendChild(node);
        }
        this.list.appendChild(fragment);
        this.autofill();
    };
    Autocomplete.prototype.autofill = function () {
        if (!this.isComplement) {
            return;
        }
        if (this.items.length === 0) {
            return;
        }
        var val = this.getInputValue().toLowerCase();
        if (this.items[0].getMarkString && this.items[0].getMarkString().toLowerCase() !== val) {
            return;
        }
        var item, items = this.items, suitsAutofill = true;
        for (var i = 0; i < items.length; ++i) {
            if (items[i].source && items[i].source == "serpProvider") {
                suitsAutofill = false;
            }
            if (suitsAutofill && items[i].value.toLowerCase().indexOf(val) === 0) {
                item = items[i];
                break;
            }
        }
        if (!item) {
            return;
        }
        var complement = item.value;
        if (val.indexOf("/") < 0) {
            complement = complement.replace(/\/(.*)/, "");
        }
        if (val !== complement) {
            complement = complement.slice(complement.toLowerCase().indexOf(val) + val.length);
            if (complement) {
                if (item.capitalize !== false) {
                    this.input.value = this.input.value.charAt(0).toUpperCase() + this.input.value.slice(1);
                }
                this.input.value += complement;
                if (this.input.setSelectionRange) {
                    this.input.setSelectionRange(val.length, this.input.value.length);
                }
            }
        }
        this.isComplement = false;
    };
    function Item(value, title, className) {
        this.value = value;
        this.title = title.trim();
        this.className = className;
    }
    Item.prototype.capitalize = true;
    Item.prototype.toString = function () {
        return this.title;
    };
    Item.prototype.getInputValue = function () {
        return this.title;
    };
    Item.prototype.getValue = function () {
        return this.value;
    };
    var MouseHover = function (element, className) {
        this._element = element;
        this._className = className || element.className;
        this._hover = null;
        this._out = null;
        var self = this;
        this.onMouseover_ = function (event) {
            var element = self._getAncestorByClassName(event.target);
            var oldElement = self._getAncestorByClassName(event.relatedTarget);
            if (element && element !== oldElement) {
                if (!element.__hover) {
                    element.__hover = true;
                    if (self._hover) {
                        self._hover(event, element);
                    }
                }
            }
        };
        this.onMouseout_ = function (event) {
            var element = self._getAncestorByClassName(event.target);
            var newElement = self._getAncestorByClassName(event.relatedTarget);
            if (element && element !== newElement) {
                delete element.__hover;
                if (self._out) {
                    self._out(event, element, newElement);
                }
            }
        };
        element.addEventListener("mouseover", this.onMouseover_, false);
        element.addEventListener("mouseout", this.onMouseout_, false);
    };
    MouseHover.prototype.onHover = function (fn) {
        this._hover = fn;
    };
    MouseHover.prototype.onOut = function (fn) {
        this._out = fn;
    };
    MouseHover.prototype.removeEvents = function () {
        this._element.removeEventListener("mouseover", this.onMouseover_, false);
        this._element.removeEventListener("mouseout", this.onMouseout_, false);
        this._hover = null;
        this._out = null;
    };
    MouseHover.prototype._getAncestorByClassName = function (element) {
        var el = element;
        while (el && !domHelper.hasClass(el, this._className)) {
            el = el.parentNode;
            if (el === document) {
                el = null;
                break;
            }
        }
        return el;
    };
    return Autocomplete;
});
define("slice/ui/route-form/form", [
    "browser-adapter",
    "api/manager",
    "api/xml",
    "api/stat",
    "api/http",
    "slice/logic/config",
    "slice/templates",
    "slice/common-ui/buttons/buttons",
    "slice/common-ui/autocomplete/autocomplete"
], function (adapter, manager, xml, stat, http, config, JTEMPLATES, btnManager, Autocomplete) {
    var view = {
        init: function () {
            this._parent = document.querySelector(".b-route-form");
            this._parent.innerHTML = JTEMPLATES["form"]();
            this._close = this._parent.querySelector(".b-route-form__close");
            var inputs = this._parent.querySelectorAll(".b-route-form__input");
            this._inputHome = this._applyAutocomplete(inputs[0], adapter.getString("home"));
            this._inputWork = this._applyAutocomplete(inputs[1], adapter.getString("work"));
            btnManager.initParent(this._parent);
            this._btnOK = this._parent.querySelector(".b-route-form__ok");
            this._btnDel = this._parent.querySelector(".b-route-form__del");
            this._savedRoute = null;
            var self = this;
            this._close.onclick = function () {
                self._showError(false);
                self._updateFromSaved();
                adapter.sendMessage("slice:form:close");
            };
            this._btnOK.onclick = function () {
                self._showError(false);
                self._pave();
            };
            this._btnDel.onclick = function () {
                if (this.getAttribute("data-disabled") != "true") {
                    self._showError(false);
                    stat.logWidget("yamaps.{version}.slice.delete");
                    adapter.sendMessage("slice:form:delete-route");
                }
            };
            this._inputHome.input.addEventListener("keydown", function (e) {
                if (e.keyCode === 13 && self._inputHome.list.style.display === "none") {
                    self._inputWork.input.focus();
                }
            });
            this._inputWork.input.addEventListener("keydown", function (e) {
                if (e.keyCode === 13 && self._inputWork.list.style.display === "none") {
                    if (!self._inputHome.input.value.trim()) {
                        self._inputHome.input.focus();
                    } else {
                        self._pave();
                    }
                }
            });
            function focus() {
                this.parentNode.parentNode.setAttribute("data-focus", "true");
            }
            function blur() {
                this.parentNode.parentNode.setAttribute("data-focus", "false");
            }
            this._inputHome.input.addEventListener("focus", focus);
            this._inputHome.input.addEventListener("blur", blur);
            this._inputWork.input.addEventListener("focus", focus);
            this._inputWork.input.addEventListener("blur", blur);
        },
        observers: {
            "slice:route-params": function (topic, params) {
                adapter.logObj(params, "[form] saved route: ");
                this._savedRoute = params;
                this._updateFromSaved();
            },
            "slice:route-error": function (topic, data) {
                this._showError(true);
            },
            "slice:map:bounds-change": function (topic, data) {
                this._bounds = data;
            }
        },
        _updateFromSaved: function () {
            this._inputHome.input.value = this._savedRoute ? this._savedRoute.home : "";
            this._inputWork.input.value = this._savedRoute ? this._savedRoute.work : "";
            this._btnDel.setAttribute("data-disabled", !this._savedRoute);
            this._showError(false);
        },
        _showError: function (bShow) {
            this._parent.setAttribute("data-error", bShow);
        },
        _pave: function () {
            var home = this._inputHome.input.value.trim();
            var work = this._inputWork.input.value.trim();
            if (home && work) {
                stat.logWidget("yamaps.{version}.slice.pave");
                adapter.sendMessage("slice:form:pave-route", {
                    home: home,
                    work: work
                });
                return;
            }
            if (!home) {
                this._inputHome.input.focus();
            } else {
                this._inputWork.input.focus();
            }
        },
        _applyAutocomplete: function (containerEl, placeholder, value) {
            var that = this;
            return new Autocomplete({
                container: containerEl.querySelector(".input-parent"),
                placeholder: placeholder,
                initValue: "",
                requestDataFn: function (str, response) {
                    adapter.getCookie(config.COOKIE_DOMAIN, "yandexuid", "/", false, function (yandexuid) {
                        var params = {
                            callback: "",
                            lang: adapter.getLang(),
                            highlight: 1,
                            fullpath: 1,
                            v: 5,
                            yu: yandexuid || "",
                            search_type: "tp",
                            part: str
                        };
                        if (that._bounds) {
                            params.bbox = [
                                that._bounds[0][1],
                                that._bounds[0][0],
                                that._bounds[1][1],
                                that._bounds[1][0]
                            ].join(",");
                        }
                        http.GET({
                            url: config.SUGGEST_URL,
                            params: params,
                            responseType: "json",
                            callback: function (data) {
                                response(data[1].map(function (item) {
                                    return {
                                        value: item[2] && item[2].pers ? item[1] : item[2],
                                        html: item[1]
                                    };
                                }));
                            }
                        });
                    });
                }
            });
        }
    };
    manager.onReady(view);
});
define("slice/ui/error-view/error", [
    "browser-adapter",
    "api/manager"
], function (adapter, manager) {
    var view = {
        init: function () {
            this._errorExport = document.querySelector(".b-traffic-widget>.b-error-view>.b-error-message");
            this._errorMap = document.querySelector(".b-traffic-map>.b-error-view>.b-error-message");
            this._exportButton = document.querySelector(".b-traffic-widget>.b-error-view>.b-refresh-button");
            this._mapButton = document.querySelector(".b-traffic-map>.b-error-view>.b-refresh-button");
            this._errorExport.innerHTML = adapter.getString("error.map");
            this._errorMap.innerHTML = adapter.getString("error.map");
            setupButtons([
                this._exportButton,
                this._mapButton
            ]);
            function setupButtons(buttons) {
                buttons.forEach(function (button) {
                    button.innerHTML = adapter.getString("error.refresh");
                    button.onclick = onClickHandler;
                });
            }
            function onClickHandler() {
                adapter.sendMessage("update");
            }
        }
    };
    manager.onReady(view);
    return view;
});
define("slice/ui/map/maps-api", [
    "browser-adapter",
    "slice/logic/config"
], function (adapter, config) {
    var LOAD_FUNC_NAME = "slice_traffic_mapApiLoad";
    var mapsAPI = {
        ymaps: null,
        _loadState: "",
        _script: null,
        _timer: null,
        load: function () {
            if (!this._loadState) {
                this._loadState = "loading";
                var script = this._script = document.createElement("script");
                script.type = "text/javascript";
                script.src = config.MAP_API_URL.replace("{onload}", LOAD_FUNC_NAME).replace("{lang}", adapter.getLang());
                document.body.appendChild(script);
                this._timer = setTimeout(function () {
                    mapsAPI._timer = null;
                    if (mapsAPI._script) {
                        document.body.removeChild(mapsAPI._script);
                        mapsAPI._script = null;
                    }
                    if (mapsAPI._loadState !== "ok") {
                        mapsAPI._loadState = "";
                        adapter.sendMessage("slice:maps-api:error");
                    }
                }, 10000);
            }
        }
    };
    window[LOAD_FUNC_NAME] = function (ymaps) {
        window[LOAD_FUNC_NAME] = function () {
        };
        mapsAPI._loadState = "ok";
        if (mapsAPI._timer) {
            clearTimeout(mapsAPI._timer);
            mapsAPI._timer = null;
        }
        mapsAPI.ymaps = ymaps;
        mapsAPI._script = null;
        adapter.sendMessage("slice:maps-api:load");
    };
    return mapsAPI;
});
define("slice/ui/map/placemark", [
    "browser-adapter",
    "api/stat",
    "slice/logic/config",
    "slice/ui/map/maps-api"
], function (adapter, stat, config, mapsAPI) {
    var MIN_UPDATE_INTERVAL = 20 * 60 * 1000;
    function Placemark(map) {
        this._map = map;
        this._time = 0;
        this._updating = false;
        this._yaImgUrl = config.yaSymbol.URL;
        this.update();
    }
    Placemark.prototype = {
        constructor: Placemark,
        update: function () {
            if (!this._updating && this._map && Date.now() - this._time > MIN_UPDATE_INTERVAL) {
                this._updating = true;
                this._getCoords(this._createObj, this);
            }
        },
        _createObj: function (coords) {
            this._time = Date.now();
            this._updating = false;
            if (coords) {
                if (this._obj) {
                    this._obj.geometry.setCoordinates(coords);
                } else {
                    this._obj = new mapsAPI.ymaps.Placemark(coords, {}, {
                        iconLayout: "default#image",
                        iconImageHref: this._yaImgUrl,
                        iconImageSize: [
                            32,
                            32
                        ],
                        iconImageOffset: [
                            -20,
                            -20
                        ]
                    });
                    this._obj.events.add("click", this._onClick.bind(this));
                    this._map.geoObjects.add(this._obj);
                }
            }
        },
        _getCoords: function (callback, ctx) {
            adapter.getCookie(config.COOKIE_DOMAIN, "ys", "/", false, function (value) {
                if (value && /gpauto\.(-?\d*_\d*)(%3[Aa]|:)(-?\d*_\d*)[%:]/.test(value)) {
                    var lat = RegExp.$1.replace("_", ".");
                    var lon = RegExp.$3.replace("_", ".");
                    var ret = [
                        parseFloat(lat),
                        parseFloat(lon)
                    ];
                    callback.call(ctx, ret);
                } else {
                    ret = mapsAPI.ymaps.geolocation.get({
                        provider: "yandex",
                        autoReverseGeocode: false
                    }).then(function (value) {
                        callback.call(ctx, value.geoObjects.position);
                    }, function (err) {
                        callback.call(ctx, null);
                    });
                }
            }, this);
        },
        _onClick: function () {
            stat.logWidget("yamaps.{version}.slice.imhere");
        }
    };
    return Placemark;
});
define("slice/ui/map/route", [
    "browser-adapter",
    "api/manager",
    "slice/ui/map/maps-api"
], function (adapter, manager, mapsAPI) {
    var MIN_UPDATE_INTERVAL = 20 * 60 * 1000;
    function log(str) {
        adapter.log("[Route]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[Route]: " + (str || ""));
    }
    var storage = {
        observers: {
            "slice:data": function (topic, data) {
                var region = data.region.title.toUpperCase();
                if (this._region != region) {
                    this._region = region;
                    adapter.sendMessage("slice:route-storage:change-region");
                }
            }
        },
        _region: "",
        _symb: "^#",
        _getRoutes: function () {
            var noData = {
                index: 0,
                home: [""],
                work: [""]
            };
            var valueHome = adapter.getOption("route-home");
            if (!valueHome) {
                return noData;
            }
            var valueWork = adapter.getOption("route-work");
            if (!valueWork) {
                return noData;
            }
            var symb = this._symb;
            var region = this._region;
            if (valueHome.indexOf(symb) != 0) {
                valueHome = symb + region + "||" + valueHome;
                valueWork = symb + region + "||" + valueWork;
            }
            var arrHome = valueHome.split(symb);
            var arrWork = valueWork.split(symb);
            var routeIndex = 0;
            for (var i = 1; i < arrHome.length; ++i) {
                if (arrHome[i].substr(0, arrHome[i].indexOf("||")) == region) {
                    routeIndex = i;
                }
            }
            return {
                index: routeIndex,
                home: arrHome,
                work: arrWork
            };
        },
        getRouteData: function (bTest) {
            function numbers(str) {
                str = str.split("|");
                if (str[0] != "N") {
                    str[0] = parseFloat(str[0]);
                    str[1] = parseFloat(str[1]);
                    return str;
                } else {
                    return null;
                }
            }
            var routes = this._getRoutes();
            if (bTest || !routes.index) {
                return !!routes.index || null;
            }
            var home = routes.home[routes.index];
            var work = routes.work[routes.index];
            home = home.substr(home.indexOf("||") + 2);
            work = work.substr(work.indexOf("||") + 2);
            var fi1 = home.indexOf("||");
            var fi2 = work.indexOf("||");
            var result = {
                home: home.substr(fi1 + 2),
                work: work.substr(fi2 + 2),
                homePoint: fi1 > 0 ? numbers(home.substr(0, fi1)) : null,
                workPoint: fi2 > 0 ? numbers(work.substr(0, fi2)) : null
            };
            return result;
        },
        saveRouteData: function (data) {
            var arr = [
                "N",
                "N"
            ];
            var region = this._region;
            var routes = this._getRoutes();
            if (routes.index) {
                routes.home.splice(routes.index, 1);
                routes.work.splice(routes.index, 1);
            }
            if (data) {
                if (routes.home.length >= 5) {
                    routes.home.splice(1, 1);
                    routes.work.splice(1, 1);
                }
                routes.home.push(region + "||" + (data.homePoint || arr).join("|") + "||" + data.home);
                routes.work.push(region + "||" + (data.workPoint || arr).join("|") + "||" + data.work);
            }
            if (routes.index || data) {
                adapter.setOption("route-home", routes.home.join(this._symb));
                adapter.setOption("route-work", routes.work.join(this._symb));
            }
        }
    };
    manager.onReady(storage);
    var utils = {
        getJam: function (rTime, jamsTime, routeLength) {
            var k = 1, route_km = routeLength / 1000;
            if (routeLength < 500) {
                k = 0.5;
            } else if (route_km < 1) {
                k = 0.75;
            } else if (route_km >= 15 && route_km < 80) {
                k = 1 / 65 * (route_km - 15) + 1;
            } else if (route_km >= 80) {
                k = 2;
            }
            var index = k * (jamsTime / rTime - 1) * 100, c = -1;
            if (index >= 0) {
                c = 0;
            }
            ;
            if (index > 10) {
                c = 1;
            }
            ;
            if (index > 25) {
                c = 2;
            }
            ;
            if (index > 40) {
                c = 3;
            }
            ;
            if (index > 60) {
                c = 4;
            }
            ;
            if (index > 85) {
                c = 5;
            }
            ;
            if (index > 115) {
                c = 6;
            }
            ;
            if (index > 155) {
                c = 7;
            }
            ;
            if (index > 195) {
                c = 8;
            }
            ;
            if (index > 240) {
                c = 9;
            }
            ;
            if (index > 290) {
                c = 10;
            }
            ;
            return c;
        },
        getJamColor: function (balls) {
            return balls >= 7 ? "red" : balls >= 4 ? "yellow" : "green";
        }
    };
    function Route(map) {
        this._map = map;
        this._time = 0;
        this._updating = false;
        this._canceled = false;
        this._center = null;
        this._updateRouteFromStorage();
        manager.onReady(this);
    }
    Route.prototype = {
        constructor: Route,
        observers: {
            "slice:route-storage:change-region": function (topic, data) {
                this._updateRouteFromStorage();
            },
            "slice:form:pave-route": function (topic, data) {
                this._paveRoute(data, true);
            },
            "slice:form:delete-route": function (topic, data) {
                this._deleteRoute();
            }
        },
        _updateRouteFromStorage: function () {
            var savedRoute = storage.getRouteData();
            adapter.sendMessage("slice:route-params", savedRoute);
            if (savedRoute) {
                this._paveRoute(savedRoute);
            } else {
                this._setRoute(null);
            }
        },
        update: function () {
            if (!this._updating && this.isExpired()) {
                this._updateRouteFromStorage();
                return true;
            }
            return false;
        },
        _isRouteRevertByTime: function () {
            var dt = new Date();
            var h = dt.getHours();
            return !(h >= 3 && h < 16);
        },
        isExpired: function () {
            if (!this._route) {
                return false;
            }
            return Date.now() - this._time > MIN_UPDATE_INTERVAL || this._isRouteRevertByTime() != this._revert;
        },
        _deleteRoute: function () {
            storage.saveRouteData(null);
            this._setRoute(null);
            adapter.sendMessage("slice:route-params", null);
        },
        _paveRoute: function (data, newRoute) {
            if (this._updating || !data || !this._map) {
                return;
            }
            var rev = this._isRouteRevertByTime();
            var home = data.homePoint || data.home;
            var work = data.workPoint || data.work;
            this._updating = true;
            mapsAPI.ymaps.route([
                rev ? work : home,
                rev ? home : work
            ], {
                boundedBy: this._map.getBounds(),
                avoidTrafficJams: true,
                mapStateAutoApply: true
            }).then(function (route) {
                this._updating = false;
                if (this._canceled) {
                    this._canceled = false;
                    return;
                }
                if (route.getLength() < 2) {
                    return;
                }
                this._setRoute(route, rev);
                var points = route.getWayPoints();
                points.options.set("preset", "twirl#blueStretchyIcon");
                points.get(0).properties.set("iconContent", adapter.getString("route.begin.title"));
                points.get(0).properties.set("balloonContent", rev ? data.work : data.home);
                points.get(1).properties.set("iconContent", adapter.getString("route.end.title"));
                points.get(1).properties.set("balloonContent", rev ? data.home : data.work);
                if (newRoute) {
                    var point0 = points.get(0).geometry.getBounds()[0];
                    var point1 = points.get(1).geometry.getBounds()[0];
                    data.homePoint = rev ? [
                        point1[0],
                        point1[1]
                    ] : [
                        point0[0],
                        point0[1]
                    ];
                    data.workPoint = rev ? [
                        point0[0],
                        point0[1]
                    ] : [
                        point1[0],
                        point1[1]
                    ];
                    storage.saveRouteData(data);
                }
                var metrics = this._getRouteMetrics(route);
                adapter.sendMessage("slice:route-data", {
                    metrics: metrics,
                    revert: rev
                });
                if (newRoute) {
                    adapter.sendMessage("slice:route-params", data);
                    adapter.sendMessage("slice:form:close");
                }
            }, function (error) {
                this._updating = false;
                this._canceled = false;
                if (newRoute) {
                    adapter.sendMessage("slice:route-error");
                }
            }, null, this);
        },
        _setRoute: function (route, rev) {
            route = route || null;
            if (this._route == route) {
                return;
            }
            if (this._route) {
                this._map.geoObjects.remove(this._route);
                this._route = null;
                this._center = null;
            }
            this._time = Date.now();
            if (!route) {
                return;
            }
            this._route = route;
            this._revert = rev;
            route.events.add("boundsapply", function (e) {
                if (this._route) {
                    this._zoom = this._map.getZoom();
                    this._center = this._map.getCenter();
                }
            }, this);
            this._map.geoObjects.add(route);
        },
        _getRouteMetrics: function (route) {
            var time = route.getTime();
            var jamsTime = route.getJamsTime();
            var len = route.getLength();
            var ball = utils.getJam(time, jamsTime, len);
            var minProblemTime = 1200;
            var minSpeed = 0.28;
            var longRoute = jamsTime > minProblemTime && jamsTime * minSpeed > len;
            return {
                ball: ball,
                color: utils.getJamColor(ball),
                time: time,
                jamsTime: jamsTime,
                length: len,
                isLongRoute: longRoute
            };
        },
        exists: function () {
            return !!this._route;
        },
        getMapBounds: function () {
            return this._center && {
                center: this._center,
                zoom: this._zoom
            };
        },
        getWayPoints: function () {
            return this._route ? this._route.getWayPoints() : null;
        }
    };
    return Route;
});
define("slice/ui/map/map", [
    "browser-adapter",
    "api/manager",
    "api/utils",
    "slice/logic/config",
    "slice/ui/map/maps-api",
    "slice/ui/map/placemark",
    "slice/ui/map/route"
], function (adapter, manager, utils, config, mapsAPI, Placemark, Route) {
    var map = {
        init: function () {
            this._parent = document.querySelector(".b-traffic-map");
            this._mapParent = this._parent.querySelector(".b-traffic-map__ymap");
        },
        observers: {
            "slice:data": function (topic, data) {
                var region = data.trafficRegion;
                this._mapConfig = {
                    center: region.center,
                    zoom: region.zoom
                };
                this._createMap(true);
            },
            "slice-event-show": function (topic, data) {
                this._createMap();
            },
            "slice:maps-api:load": function (topic, data) {
                this._createMap();
            },
            "slice:maps-api:error": function (topic, data) {
                this._parent.setAttribute("data-state", "error");
            },
            "slice:btn-map": function (topic, data) {
                adapter.navigate(this._getMapUrl(), "new tab");
            },
            "slice:btn-zoom": function (topic, data) {
                this._map.setZoom(this._map.getZoom() + data, { checkZoomRange: true });
            },
            "slice:btn-route": function (topic, data) {
                this._parent.setAttribute("data-form", "visible");
            },
            "slice:form:close": function (topic, data) {
                adapter.log("close form");
                this._parent.setAttribute("data-form", "");
            },
            "slice:btn-traffic": function (topic, data) {
                this._trafficEnable = !this._trafficEnable;
                this._actualProvider.setMap(this._trafficEnable ? this._map : null);
                adapter.sendMessage("slice:map:traffic-enable", this._trafficEnable);
            },
            "slice:form:delete-route": function (topic, data) {
                if (this._mapConfig) {
                    this._map.setCenter(this._mapConfig.center, this._mapConfig.zoom);
                }
            }
        },
        _createMap: function (noMove) {
            if (!adapter.isWindowVisible()) {
                return;
            }
            if (this._map) {
                if (!noMove) {
                    this._updateMap();
                }
                return;
            }
            if (!mapsAPI.ymaps) {
                mapsAPI.load();
                return;
            }
            if (!this._mapConfig) {
                return;
            }
            this._map = new mapsAPI.ymaps.Map(this._mapParent, {
                center: this._mapConfig.center,
                zoom: this._mapConfig.zoom,
                behaviors: [
                    "drag",
                    "scrollZoom",
                    "dblClickZoom"
                ],
                controls: []
            });
            this._mapParent.addEventListener("click", function (e) {
                if (e.target.tagName == "A") {
                    utils.navigate(e.target.href, e);
                    return false;
                }
            }, false);
            this._map.events.add("boundschange", this._sendBounds, this);
            this._actualProvider = new mapsAPI.ymaps.traffic.provider.Actual({}, { infoLayerShown: false });
            this._actualProvider.setMap(this._map);
            this._trafficEnable = true;
            this._placeMark = new Placemark(this._map);
            this._route = new Route(this._map);
            this._parent.setAttribute("data-state", "loaded");
            this._sendBounds();
        },
        _sendBounds: function () {
            adapter.sendMessage("slice:map:bounds-change", this._map.getBounds());
        },
        _updateMap: function () {
            if (!this._route.update()) {
                var conf = this._route.getMapBounds() || this._mapConfig;
                var zoom = this._map.getZoom();
                if (zoom != conf.zoom || this._distance(conf.center, this._map.getCenter(), zoom) > 0.15) {
                    this._map.setCenter(conf.center, conf.zoom);
                }
            }
            this._placeMark.update();
        },
        _getMapUrl: function () {
            var domain = config.MAP_URL;
            if (!this._map) {
                return domain;
            }
            var cen = this._map.getCenter();
            var params = [
                "z=" + this._map.getZoom(),
                "ll=" + cen[1] + "%2C" + cen[0],
                "l=map%2Ctrf",
                config.linkParam
            ];
            var points = this._route.getWayPoints();
            if (points) {
                var p0 = points.get(0).geometry.getBounds()[0];
                var p1 = points.get(1).geometry.getBounds()[0];
                params.push("rtm=dtr");
                params.push("rt=" + p0[1] + "%2C" + p0[0] + "~" + p1[1] + "%2C" + p1[0]);
            }
            return domain + "?" + params.join("&");
        },
        _distance: function (a, b, zoom) {
            var len = Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) * Math.cos(b[0] * Math.PI / 180));
            while (zoom < 10) {
                len = len / 2;
                zoom++;
            }
            while (zoom > 10) {
                len = len * 2;
                zoom--;
            }
            return len;
        }
    };
    manager.onReady(map);
    return map;
});
define("slice/ui/main/main", [
    "browser-adapter",
    "api/manager",
    "slice/ui/buttons/buttons",
    "slice/ui/route-form/form",
    "slice/ui/error-view/error",
    "slice/ui/map/map"
], function (adapter, manager) {
    var widget = {
        init: function () {
            this._parent = document.querySelector(".b-traffic-widget");
            adapter.resizeWindowTo(470, 500);
            adapter.sendMessage("slice:request");
        },
        observers: {
            "slice:data": function () {
                this._parent.setAttribute("data-state", "loaded");
            },
            "traffic:loading": function (topic, data) {
                if (!data.sender || data.sender == "options") {
                    this._parent.setAttribute("data-state", "loading");
                }
            },
            "traffic:error": function () {
                this._parent.setAttribute("data-state", "error");
            }
        }
    };
    manager.onReady(widget);
});
