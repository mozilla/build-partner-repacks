require(["slice/adapter/main"], function () {
    require(["slice/logic/main"]);
});
define("main-logic", function () {
});
define("slice/logic/track", ["browser-adapter"], function (adapter) {
    function log(str) {
        adapter.log("[track]: " + str);
    }
    function logObj(obj, prefix) {
        adapter.logObj(obj, "[track]: " + (prefix || ""));
    }
    function Track(onupdate, ctx) {
        this._onupdate = onupdate;
        this._ctx = ctx;
        this._timerFunc = this._timerFunc.bind(this);
        this._timer = null;
        this._track = null;
        this._errorData = null;
    }
    Track.prototype = {
        constructor: Track,
        setChannel: function (channel) {
            this._clear();
            if (!channel) {
                return;
            }
            this._errorData = null;
            var track = channel.timeline[0];
            var remaining = track.remainingSeconds * 1000 - (Date.now() - channel._timestamp) - 40;
            if (remaining > 0) {
                this._track = {
                    _timestamp: channel._timestamp,
                    hide_counter: track.hide_counter,
                    artistTitle: track.artistTitle,
                    songTitle: track.songTitle,
                    remaining: track.remainingSeconds,
                    duration: track.duration,
                    albumImg: track.albumCoverIMG
                };
                this._timer = setTimeout(this._timerFunc, remaining);
                this.report();
            } else {
                this._onupdate.call(this._ctx);
            }
        },
        setError: function (status, text) {
            this._errorData = {
                status: status,
                text: text
            };
            this._clear();
            this._timer = setTimeout(this._timerFunc, status ? 120000 : 30000);
            this.report();
        },
        _clearTimer: function () {
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }
        },
        _clear: function () {
            this._clearTimer();
            this._track = null;
        },
        report: function (tryReload) {
            if (this._errorData) {
                if (tryReload) {
                    this._clearTimer();
                    this._onupdate.call(this._ctx);
                } else {
                    adapter.sendMessage("track:error", this._errorData);
                }
                return;
            }
            if (!this._track) {
                this._onupdate.call(this._ctx);
                return;
            }
            adapter.sendMessage("track:current", this._track);
        },
        getTrack: function () {
            return this._track;
        },
        _timerFunc: function () {
            this._timer = null;
            this._track = null;
            this._onupdate.call(this._ctx);
        }
    };
    return Track;
});
define("slice/logic/powerfm-api", [
    "browser-adapter",
    "api/manager",
    "api/http",
    "slice/logic/config",
    "slice/logic/track"
], function (adapter, manager, http, config, Track) {
    function log(str) {
        adapter.log("[api]: " + str);
    }
    function logObj(obj, prefix) {
        adapter.logObj(obj, "[api]: " + (prefix || ""));
    }
    var emptyFunc = function () {
    };
    function ajax(path, callback, errback, ctx, params) {
        errback = errback || emptyFunc;
        return http.GET({
            url: config.API_URL_TPL.replace("{path}", path) + Date.now(),
            params: params,
            responseType: "json",
            ctx: ctx,
            callback: function (data) {
                if (data.errorCode) {
                    errback.call(ctx, 400, "#" + data.errorCode);
                    return;
                }
                callback.call(ctx, data.response);
            },
            errback: errback
        });
    }
    var api = {
        getChannels: function (callback, errback, ctx) {
            return ajax("Channels", callback, errback, ctx);
        },
        getChannelInfo: function (alias, callback, errback, ctx) {
            return ajax("Channels/" + alias, callback, errback, ctx);
        },
        getSchedule: function (callback, errback, ctx) {
            return ajax("ProgramSchedule", callback, errback, ctx);
        },
        getChannelSchedule: function (alias, callback, errback, ctx) {
            return ajax("ProgramSchedule/" + alias, callback, errback, ctx);
        },
        getPodcasts: function (callback, errback, ctx) {
            return ajax("Podcasts", callback, errback, ctx);
        },
        getPodcastInfo: function (id, page, pageSize, callback, errback, ctx) {
            return ajax("Podcasts/" + id, callback, errback, ctx, {
                page: page || 1,
                limit: pageSize || 10
            });
        },
        getCharts: function (callback, errback, ctx) {
            return ajax("Charts", callback, errback, ctx);
        },
        getChannelCharts: function (alias, callback, errback, ctx) {
            return ajax("Charts/" + alias, callback, errback, ctx);
        },
        getChartSongs: function (chId, callback, errback, ctx) {
            return ajax("ChartSongs/" + chId, callback, errback, ctx);
        }
    };
    var channelsManager = {
        init: function () {
            this._playerSupported = null;
            this._requestChannels = null;
            this._track = new Track(this._requestCurrentChannelData, this);
            this._data = {
                channels: null,
                currentId: "",
                lastUpdateTime: 0,
                error: ""
            };
        },
        observers: {
            "slice:player:init": function (topic, data) {
                logObj(data, topic);
                this._playerSupported = data.supported;
                if (adapter.isWindowVisible()) {
                    this._requestChannelsData();
                }
            },
            "slice-event-show": function (topic, data) {
                this._reportInfo();
            },
            "channels:cmd:set-current": function (topic, data) {
                this._setCurrent(data.id);
                adapter.sendMessage("player:cmd:playState", { play: !!data.play });
            },
            "channels:cmd:set-next": function (topic, data) {
                this._changeChannel("next");
                adapter.sendMessage("player:cmd:playState", { play: true });
            },
            "channels:cmd:set-prev": function (topic, data) {
                this._changeChannel("prev");
                adapter.sendMessage("player:cmd:playState", { play: true });
            }
        },
        _setCurrent: function (id) {
            if (!id || id == this._data.currentId) {
                return;
            }
            var channel = this._getChannelById(id);
            if (channel) {
                this._data.currentId = channel.id;
                this._reportCurrentChannelInfo();
                this._track.setChannel(channel);
            }
        },
        _changeChannel: function (direction) {
            var channels = this._data.channels;
            var currentChannel = this._getCurrentChannel();
            var channelToSelect = null;
            if (currentChannel) {
                var currentChannelIndex = channels.indexOf(currentChannel);
                var channelToSelectIndex = currentChannelIndex + (direction === "next" ? +1 : -1);
                channelToSelectIndex = channelToSelectIndex < 0 ? channels.length - 1 : channelToSelectIndex >= channels.length ? 0 : channelToSelectIndex;
                channelToSelect = channels[channelToSelectIndex] || currentChannel;
            } else {
                channelToSelect = channels[0] || null;
            }
            this._data.currentId = channelToSelect && channelToSelect.id || "";
            if (channelToSelect && channelToSelect !== currentChannel) {
                this._reportCurrentChannelInfo();
                this._track.setChannel(channelToSelect);
            }
        },
        _requestChannelsData: function () {
            if (this._requestChannels || !this._playerSupported) {
                return;
            }
            this._requestChannels = api.getChannels(function callback(data) {
                this._data.error = "";
                this._requestChannels = null;
                this._setChannels(data);
            }, function errback(status, text) {
                this._requestChannels = null;
                this._reportError(status, text);
            }, this);
        },
        _requestCurrentChannelData: function () {
            if (this._requestChannels || !this._playerSupported || !adapter.isWindowVisible()) {
                return;
            }
            var currentChannel = this._getCurrentChannel();
            if (!currentChannel) {
                log("_requestCurrentChannelData: currentChannel not found");
                return;
            }
            api.getChannelInfo(currentChannel.data.alias, function (data) {
                this._data.error = "";
                this._setChannel(data);
            }, function errback(status, text) {
                this._track.setError(status, text);
            }, this);
        },
        _wrapChannelData: function (channel, ts, target) {
            if (channel) {
                target = target || {};
                target.id = String(channel.channel_id);
                target._timestamp = ts || Date.now();
                target.data = {
                    id: target.id,
                    alias: channel.channel_seo_name,
                    logoMedium: channel.channel_logo_medium,
                    streamURL: channel.channel_stream_url
                };
                target.timeline = channel.timeline;
            }
            return target;
        },
        _setChannels: function (serverData) {
            if (!(serverData && Array.isArray(serverData))) {
                return;
            }
            var ts = Date.now();
            this._data.channels = serverData.map(function (channel) {
                return this._wrapChannelData(channel, ts);
            }, this);
            this._data.lastUpdateTime = ts;
            this._reportChannelsInfo();
            this._data.currentId = this._data.currentId || String(this._data.channels[0].id);
            this._reportCurrentChannelInfo();
            this._track.setChannel(this._getCurrentChannel());
        },
        _setChannel: function (serverData) {
            if (serverData) {
                var exists = this._getChannelById(serverData.channel_id);
                if (exists) {
                    this._wrapChannelData(serverData, null, exists);
                    if (exists.id == this._data.currentId) {
                        this._reportCurrentChannelInfo();
                        this._track.setChannel(exists);
                    }
                }
            }
        },
        _reportInfo: function () {
            if (!adapter.isWindowVisible()) {
                return;
            }
            if (!this._data.channels || this._data.error) {
                this._requestChannelsData();
            } else {
                this._reportChannelsInfo();
                this._reportCurrentChannelInfo();
                this._track.report(true);
            }
        },
        _reportError: function (status, text) {
            this._data.error = status ? "api" : "net";
            adapter.sendMessage("api:error", { type: this._data.error });
        },
        _reportChannelsInfo: function () {
            if (!this._data.channels) {
                return;
            }
            adapter.sendMessage("channels:list", {
                channels: this._data.channels.map(function (ch) {
                    return ch.data;
                })
            });
        },
        _reportCurrentChannelInfo: function () {
            var channel = this._getCurrentChannel();
            if (channel) {
                adapter.sendMessage("channels:current", channel.data);
            }
        },
        _getCurrentChannel: function () {
            var result = null;
            if (this._data.currentId) {
                result = this._getChannelById(this._data.currentId);
                if (!result) {
                    this._data.currentId = "";
                }
            }
            return result;
        },
        _getChannelById: function (channelId) {
            if (typeof channelId !== "string")
                throw new TypeError("Channel id must be a string.");
            var result = null;
            if (!this._data.channels) {
                return result;
            }
            this._data.channels.some(function (channel) {
                return channel.id === channelId ? (result = channel, true) : false;
            });
            return result;
        }
    };
    manager.onReady(channelsManager);
    return channelsManager;
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
define("slice/logic/player", [
    "browser-adapter",
    "api/manager",
    "api/stat",
    "slice/common-logic/timers",
    "slice/logic/powerfm-api"
], function (adapter, manager, stat, timers) {
    function log(str) {
        adapter.log("[player]: " + str);
    }
    function logObj(obj, str) {
        adapter.logObj(obj, "[player]: " + (str || ""));
    }
    function Html5Player() {
        this._createAudioElement();
        this._errorTimer = timers.create(10000, function () {
            if (this._stopped || !this._errorState) {
                this._errorTimer.stop();
                return;
            }
            this._errorState = false;
            var audioElement = this._audioElement;
            audioElement.pause();
            audioElement.removeAttribute("src");
            audioElement.setAttribute("src", this.getURL());
            audioElement.play();
        }, this, 10).setExpanding(true);
    }
    Html5Player.prototype = {
        setURL: function (url) {
            if (url === this.getURL())
                return;
            this._audioElement.setAttribute("src", url);
            this._currentURL = url;
        },
        getURL: function () {
            return this._currentURL;
        },
        _addErrorHandler: function () {
            var self = this;
            this._audioElement.onerror = function () {
                self._errorState = true;
                self._errorTimer.start();
            };
        },
        sliceShow: function () {
            this._errorTimer.resetExpanding();
        },
        _removeErrorHanler: function () {
            this._errorTimer.stop();
            this._errorState = false;
            this._audioElement.onerror = null;
        },
        play: function () {
            var currentURL = this.getURL();
            if (!currentURL) {
                return false;
            }
            var retValue = this._stopped;
            this._stopped = false;
            this._addErrorHandler();
            this._audioElement.onplaying = null;
            if (!this._audioElement.hasAttribute("src")) {
                this._audioElement.setAttribute("src", currentURL);
            }
            this._audioElement.play();
            return retValue;
        },
        pause: function () {
            this._audioElement.pause();
        },
        isPaused: function () {
            return this._audioElement.paused;
        },
        stop: function () {
            if (this._stopped) {
                return false;
            }
            this._removeErrorHanler();
            this.pause();
            this._audioElement.removeAttribute("src");
            var that = this;
            this._audioElement.onplaying = function () {
                that._audioElement.pause();
                that._audioElement.onplaying = null;
            };
            this._stopped = true;
            return true;
        },
        isStopped: function () {
            return this._stopped;
        },
        getMuted: function () {
            return this._audioElement.muted;
        },
        setMuted: function (value) {
            if (typeof value !== "boolean")
                throw new Error("Muted value is not a boolean");
            this._audioElement.muted = value;
        },
        getVolume: function () {
            return this._audioElement.volume;
        },
        setVolume: function (value) {
            if (typeof value !== "number" || value < 0 || value > 1)
                throw new Error("Volume value not a number");
            this._audioElement.volume = value;
            if (value)
                this._audioElement.muted = false;
        },
        isDisabled: function () {
            return !this._audioElement;
        },
        _createAudioElement: function () {
            var audio = document.createElement("audio");
            if (!audio || typeof audio.canPlayType !== "function") {
                return null;
            }
            var canPlayMpeg = audio.canPlayType("audio/mpeg");
            if (!canPlayMpeg || canPlayMpeg === "no") {
                return null;
            }
            if (adapter.browser === "opera" && canPlayMpeg === "probably") {
                return null;
            }
            document.body.appendChild(audio);
            this._audioElement = audio;
        },
        _audioElement: undefined,
        _currentURL: "",
        _stopped: true,
        _errorState: false
    };
    var player = {
        init: function () {
            this._playerInstance = new Html5Player();
            adapter.sendMessage("slice:player:init", { supported: !this._playerInstance.isDisabled() });
            if (this._playerInstance.isDisabled()) {
                if (adapter.isWindowVisible()) {
                    adapter.sendMessage("player:not-supported");
                }
                this.observers = this._observersUnsupported;
            }
        },
        _observersUnsupported: {
            "slice-event-show": function (topic, eventData) {
                adapter.sendMessage("player:not-supported");
            }
        },
        observers: {
            "slice-event-show": function (topic, eventData) {
                this._playerInstance.sliceShow();
            },
            "player:cmd:playState": function (topic, eventData) {
                if (typeof eventData.play === "boolean") {
                    if (eventData.play) {
                        this._play();
                    } else {
                        if (this._playerInstance.stop()) {
                            this._timeStat();
                        }
                    }
                }
                this._reportInfo();
            },
            "player:cmd:volume": function (topic, eventData) {
                if ("volume" in eventData)
                    this._playerInstance.setVolume(eventData.volume);
                if ("mute" in eventData)
                    this._playerInstance.setMuted(eventData.mute);
                this._reportInfo();
            },
            "channels:current": function (topic, channel) {
                if (this._currentAlias == channel.alias) {
                    return;
                }
                this._timeStat();
                var streamURL = channel.streamURL;
                this._currentAlias = channel.alias;
                if (streamURL) {
                    log("play url " + streamURL);
                    this._playerInstance.setURL(streamURL);
                } else {
                    this._playerInstance.stop();
                }
                this._reportInfo();
            },
            "slice:request-info": function () {
                this._reportInfo();
            }
        },
        finalize: function () {
            this._timeStat();
        },
        _timeStat: function () {
            if (this._startPlay && this._lastCurrentAlias) {
                var delta = Math.max(Math.floor((Date.now() - this._startPlay) / 60000), 0);
                if (delta) {
                    stat.logWidget("time." + this._lastCurrentAlias + "." + delta);
                }
            }
            this._startPlay = 0;
        },
        _play: function () {
            if (this._currentAlias && (this._playerInstance.isStopped() || this._currentAlias !== this._lastCurrentAlias)) {
                stat.logWidget("slice.chanelplay." + this._currentAlias);
                this._startPlay = Date.now();
                this._lastCurrentAlias = this._currentAlias;
            }
            this._playerInstance.play();
        },
        _reportInfo: function () {
            var playerInstance = this._playerInstance;
            adapter.sendMessage("player:state", {
                url: playerInstance.getURL(),
                paused: playerInstance.isPaused(),
                stopped: playerInstance.isStopped(),
                volume: playerInstance.getVolume(),
                muted: playerInstance.getMuted()
            });
        },
        _startPlay: 0,
        _currentAlias: "",
        _lastCurrentAlias: ""
    };
    manager.onReady(player);
    return player;
});
define("slice/logic/main", [
    "slice/logic/powerfm-api",
    "slice/logic/player"
], function () {
});
