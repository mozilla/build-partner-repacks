require(["slice/adapter/main"], function () {
    require(["slice/logic/main"]);
});
define("main-logic", function () {
});
define("slice/common-logic/timers", [
    "browser-adapter",
    "api/manager"
], function (adapter, manager) {
    var log = function (str, method) {
        adapter.log("[sliceApi.timers]: " + str);
    };
    var MAX_EXPANDING_SKIPS = 2;
    function Timer(ms, callback, scope, maxExpandingSkips) {
        var self = this;
        this._callback = function () {
            var canCall = true;
            if (self._expandingMode) {
                canCall = self._expandingCurrent >= self._expandingSkipCount;
                if (canCall) {
                    if (self._expandingSkipCount < self._maxSkipCount) {
                        self._expandingSkipCount++;
                    }
                    self._expandingCurrent = 0;
                } else {
                    self._expandingCurrent++;
                }
            }
            if (canCall) {
                callback.call(scope || self);
            }
        };
        this._interval = 0;
        this._maxSkipCount = maxExpandingSkips || MAX_EXPANDING_SKIPS;
        this._expandingMode = false;
        this.setInterval(ms);
    }
    Timer.prototype = {
        constructor: Timer,
        setInterval: function (v) {
            v = Number(v);
            if (this._interval != v) {
                this._interval = v;
                var started = this._timer;
                this.stop();
                if (started) {
                    this.start();
                }
            }
            return this;
        },
        start: function () {
            if (!this._timer && this._interval >= 1) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
                this._timer = setInterval(this._callback, this._interval);
            }
            return this;
        },
        stop: function () {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
            return this;
        },
        setExpanding: function (state) {
            state = state !== false;
            if (this._expandingMode == state) {
                return;
            }
            this._expandingMode = state;
            log("setExpanding " + state);
            if (state) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
            }
            return this;
        },
        resetExpanding: function () {
            if (this._expandingMode) {
                this._expandingSkipCount = 0;
                this._expandingCurrent = 0;
            }
            return this;
        },
        finalize: function () {
            this.stop();
            this._callback = null;
            this._interval = 0;
        }
    };
    var timers = [];
    var thisModule = {
        create: function (ms, callback, scope, maxExpandingSkips) {
            if (typeof ms == "function") {
                maxExpandingSkips = scope;
                scope = callback;
                callback = ms;
                ms = 0;
            }
            var tmr = new Timer(ms, callback, scope, maxExpandingSkips);
            timers.push(tmr);
            return tmr;
        },
        stopAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].stop();
            }
        },
        startAll: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].start();
            }
        },
        finalize: function () {
            for (var i = 0; i < timers.length; ++i) {
                timers[i].finalize();
            }
            timers = [];
        }
    };
    manager.onReady(thisModule);
    return thisModule;
});
define("slice/common-logic/town-importer", [
    "browser-adapter",
    "api/stat",
    "slice/logic/config",
    "api/http",
    "slice/common-logic/timers"
], function (adapter, stat, config, http, timers) {
    var OPTION_REGION_ID = "id";
    var OPTION_INTERVAL = "update-interval";
    var Importer = function (name, statName) {
        this._errorUpdate = false;
        this._errorExport = false;
        this._updating = false;
        this._request = null;
        this._saved = null;
        this._savedUrl = null;
        this._savedPermanent = null;
        this._statName = statName;
        this._sliceName = name;
        this._lastUpdateTime = 0;
    };
    Importer.prototype = {
        constructor: Importer,
        init: function () {
            this._timer = timers.create(this._getInterval(), function () {
                this._update("timer");
            }, this).start();
            this._update("init");
        },
        finalize: function () {
            if (this._request) {
                this._request.abort();
            }
        },
        observers: {
            "update": function (topic, data) {
                this._update(data);
            },
            "slice-event-show": function (topic, data) {
                var statString = data && data.sender == "menu" ? "menu" : "button";
                stat.logWidget(this._statName + ".{version}." + statString);
                if (Date.now() - this._lastUpdateTime > 5 * 60 * 1000) {
                    this._update("popup");
                }
            },
            "options:change": function (topic, data) {
                if (data.name == OPTION_REGION_ID) {
                    this._update("options");
                }
                if (data.name == OPTION_INTERVAL) {
                    adapter.log("interval setting change");
                    this._timer.setInterval(this._getInterval());
                }
            },
            "slice:request": function () {
                if (this._updating) {
                    return;
                }
                if (this._sendError(false) || this._sendData(false)) {
                    return;
                }
                this._update("popup");
            },
            "navigate": function (topic, data) {
                stat.logWidget(this._statName + ".{version}.button");
                adapter.navigate(this._savedUrl || config.defaultHomeUrl, data);
            }
        },
        _getInterval: function () {
            if (this._errorExport) {
                return 5 * 60 * 1000;
            }
            return parseInt(adapter.getOption(OPTION_INTERVAL) || 5, 10) * 1000 * 60;
        },
        _getSavedData: function () {
            if (!this._saved) {
                return null;
            }
            var delta = Date.now() - this._saved.timestamp;
            if (delta < 0 || delta > config.expireInterval) {
                this._saved = null;
            }
            return this._saved;
        },
        _sendData: function (withOuter) {
            var data = this._getSavedData();
            if (data) {
                adapter.sendMessage("slice:data", data);
                if (withOuter && data.outerData) {
                    adapter.sendOuterMessage(this._sliceName + ":data", data.outerData);
                }
            }
            return !!data;
        },
        _sendError: function (sender) {
            if (this._errorUpdate) {
                adapter.sendMessage("slice:error", this._errorUpdate);
                if (sender !== false) {
                    adapter.sendOuterMessage(this._sliceName + ":error", {
                        type: this._errorUpdate,
                        sender: sender
                    });
                }
            }
            return !!this._errorUpdate;
        },
        _updateErrorHandler: function (sender, type) {
            if (!this._sendData(true)) {
                this._errorUpdate = type;
                this._sendError(sender);
            }
            this._errorExport = true;
            this._timer.setInterval(this._getInterval());
        },
        _update: function (sender) {
            sender = sender || "";
            if (!sender || sender == "options") {
                this._saved = null;
            }
            if (sender == "options") {
                this._savedUrl = null;
                this._savedPermanent = null;
                this._updating = false;
                if (this._request) {
                    this._request.abort();
                }
            }
            if (this._updating) {
                return;
            }
            this._updating = true;
            this._errorUpdate = null;
            this._errorExport = false;
            try {
                this._request = http.GET({
                    url: config.EXPORT_URL,
                    params: {
                        region: adapter.getOption(OPTION_REGION_ID) || "",
                        lang: adapter.getLang(),
                        brid: adapter.getBrandId(),
                        _rand: Math.round(new Date().valueOf() / 30000)
                    },
                    ctx: this,
                    responseType: "xml",
                    callback: function (data) {
                        this._updating = false;
                        this._request = null;
                        data = this.extractData(data);
                        if (data) {
                            this._saved = data;
                            this._savedPermanent = data.permanentData || this._savedPermanent;
                            this._saved.timestamp = Date.now();
                            this._lastUpdateTime = Date.now();
                            this._savedUrl = data.url;
                            this._timer.setInterval(this._getInterval());
                            this._sendData(true);
                        } else {
                            this._updateErrorHandler(sender, "server");
                        }
                    },
                    errback: function (status, textStatus) {
                        if (textStatus == "abort") {
                            return;
                        }
                        this._updating = false;
                        this._request = null;
                        this._updateErrorHandler(sender, status < 200 ? "net" : "server");
                    }
                });
                adapter.sendOuterMessage(this._sliceName + ":loading", { sender: sender });
            } catch (exc) {
            }
        },
        extractData: function () {
            return null;
        }
    };
    return Importer;
});
define("slice/logic/main", [
    "browser-adapter",
    "api/manager",
    "slice/logic/config",
    "api/xml",
    "slice/common-logic/town-importer"
], function (adapter, manager, config, xmlParser, Importer) {
    var utils = {
        _temperature: function (t) {
            return t ? config.formatTemperature(t) : "";
        },
        _divColor: function (color, k) {
            return color.replace(/../g, function (m) {
                var r = Math.round(parseInt(m, 16) / k).toString(16);
                return r.length > 1 ? r : "0" + r;
            });
        },
        _avgColor: function (c1, c2) {
            var r = "";
            for (var i = 0; i < 6; i += 2) {
                var c = Math.round((parseInt(c1.substr(i, 2), 16) + parseInt(c2.substr(i, 2), 16)) / 2).toString(16);
                r += c.length > 1 ? c : "0" + c;
            }
            return r;
        },
        _avgTemp: function (t1, t2) {
            return Math.round((parseInt(t1, 10) + parseInt(t2, 10)) / 2).toString(10).replace(/^([1-9])/, "+$1");
        },
        _replaceIconMap: {
            "wnd": "ovc",
            "strm": "ovc",
            "sq": "ovc",
            "br_d": "fg_d",
            "br_n": "fg_n",
            "ovc_gr_ra": "ovc_gr",
            "ovc_ra_gr": "ovc_gr",
            "ovc_ra_sn": "ovc_+sn",
            "ovc_ra_sn_gr": "ovc_+sn",
            "ovc_ts_ra_sn": "ovc_ts_ra",
            "ovc_ts_sn": "ovc_ts_ra"
        },
        getIconName: function (url) {
            if (!url) {
                return "";
            }
            var file = url.replace(/^.+\/([^\/]+)\.png$/, "$1").replace(/_[+-]\d+$/, "");
            return this._replaceIconMap[file] || file;
        }
    };
    function extractData(xml) {
        var weatherNode = xmlParser.select("info > weather", xml);
        if (!weatherNode) {
            return null;
        }
        var day = xmlParser.select("weather > day", xml);
        var dparts = xmlParser.selectAll("day_part", day);
        var dpart = dparts && dparts[0];
        if (!dpart) {
            return null;
        }
        var temp = xmlParser.select("temperature", dpart);
        if (!temp) {
            return null;
        }
        var result = {
            title: xmlParser.getText(xml, "weather > day > title"),
            now: {
                temperature: utils._temperature(xmlParser.getText(temp)),
                bgcolor: "#" + temp.getAttribute("color"),
                color: "#" + utils._divColor(temp.getAttribute("color"), 2),
                img: utils.getIconName(xmlParser.getText(dpart, "image-v3")),
                description: xmlParser.getText(dpart, "weather_type"),
                windDir: xmlParser.getAttr(dpart, "wind_direction", "id"),
                windSpeed: xmlParser.getText(dpart, "wind_speed"),
                dampness: xmlParser.getText(dpart, "dampness"),
                pressure: xmlParser.getText(dpart, "pressure")
            },
            url: xmlParser.getText(xml, "weather > url") + config.linkParam,
            period: [],
            pressureUnit: config.pressureUnit
        };
        var dpTypes = [
            "",
            "morning",
            "day",
            "evening",
            "night"
        ];
        for (var i = 1; i < dparts.length; ++i) {
            dpart = dparts[i];
            var temp1 = xmlParser.select("temperature_from", dpart);
            var temp2 = xmlParser.select("temperature_to", dpart);
            var temp0 = temp1 && temp2 ? null : xmlParser.select("temperature", dpart);
            if (!temp0 && !(temp1 && temp2)) {
                continue;
            }
            var bgcolor = temp0 ? temp0.getAttribute("color") : utils._avgColor(temp1.getAttribute("color"), temp2.getAttribute("color"));
            result.period.push({
                type: dpTypes[dpart.getAttribute("typeid")],
                img: utils.getIconName(xmlParser.getText(dpart, "image-v3")),
                hint: "",
                temperature: utils._temperature(temp0 ? xmlParser.getText(temp0) : utils._avgTemp(xmlParser.getText(temp1), xmlParser.getText(temp2))),
                bgcolor: "#" + bgcolor,
                color: "#" + utils._divColor(bgcolor, 2)
            });
        }
        result.outerData = {
            title: result.title,
            temperature: result.now.temperature,
            image: result.now.img
        };
        return result;
    }
    var importer = new Importer("weather", "yapogoda");
    importer.extractData = extractData;
    manager.onReady(importer);
    return importer;
});
