EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[player]: " + str);
    }
    function logObj(o, p) {
        app.logObj(o, "[player]: " + (p || ""));
    }
    var wrapper_window = common.resolvePath("/content/wrapperWindow.xul");
    var defFailCount = 8;
    var r = {
        _window: null,
        init: function (observer) {
            this._initFailCount = defFailCount;
            this.initialized = false;
            this._observer = observer;
            this._onFlashEvent = this._onFlashEvent.bind(this);
            this._setState("pause");
            this._storage = common.storage("player.json");
            if (this._storage.isPlay) {
            }
        },
        finalize: function () {
            this._closeMainWindow();
            this._observer = null;
            this._storage.save();
        },
        _cancelTimers: function () {
            for (var i = 0; i < arguments.length; ++i) {
                var name = "_" + arguments[i] + "Timer";
                if (this[name]) {
                    this[name].cancel();
                    this[name] = null;
                }
            }
        },
        _openMainWindow: function () {
            var mainWindow = common.api.Browser.getHiddenFrame();
            mainWindow.contentWindow.location.href = wrapper_window;
            return mainWindow.contentWindow;
        },
        _closeMainWindow: function () {
            if (this._window && !this._window.closed) {
                if (this.initialized) {
                    try {
                        htmlDoc = this._window.outerInfo.doc;
                        if (htmlDoc) {
                            htmlDoc.removeEventListener("ShowThrobber", this._onFlashEvent, true);
                            htmlDoc.removeEventListener("HideThrobber", this._onFlashEvent, true);
                            htmlDoc.removeEventListener("SoundFail", this._onFlashEvent, true);
                            htmlDoc.removeEventListener("SoundError", this._onFlashEvent, true);
                        }
                    } catch (exc) {
                    }
                    this.initialized = false;
                }
                this._window.close();
                this._window = null;
            }
        },
        _getFlash: function () {
            log("_getFlash ***");
            var flash, htmlDoc;
            if (this._window) {
                try {
                    log("_getFlash: get outerInfo");
                    var info = this._window.outerInfo;
                    if (info) {
                        log("_getFlash: this._window not null");
                        htmlDoc = info.doc;
                        log("_getFlash: htmlDoc: " + htmlDoc);
                        flash = info.flash;
                        log("_getFlash: flash: " + flash);
                        if (typeof flash.SetStation != "function") {
                            XPCNativeWrapper.unwrap(flash);
                            flash = flash.wrappedJSObject;
                            log("_getFlash: flash Fx16+: " + flash);
                        }
                    }
                } catch (e) {
                }
                if (!flash) {
                    log("_getFlash: this.initialized = false;");
                    this.initialized = false;
                } else {
                    log("_getFlash: this.initialized=" + this.initialized);
                    if (!this.initialized) {
                        log("_getFlash: htmlDoc addEventListeners try");
                        htmlDoc.addEventListener("ShowThrobber", this._onFlashEvent, true);
                        htmlDoc.addEventListener("HideThrobber", this._onFlashEvent, true);
                        htmlDoc.addEventListener("SoundFail", this._onFlashEvent, true);
                        htmlDoc.addEventListener("SoundError", this._onFlashEvent, true);
                        log("_getFlash: htmlDoc addEventListeners OK");
                        this.initialized = true;
                    }
                    log("_getFlash: 1");
                }
            } else {
                log("this.initialized = false;");
                this.initialized = false;
            }
            log("_getFlash: 2");
            return flash;
        },
        _flashEvents: {
            "ShowThrobber": function () {
                this._setState("throbber", true);
            },
            "HideThrobber": function () {
                this._setState("play", true);
            },
            "SoundFail": function () {
                this._setState("error", true);
            },
            "SoundError": function () {
                if (this.playlist) {
                    app.log("Switch to next: " + this.playlist[this.playlist_count]);
                    this.playlist_count++;
                    if (this.playlist_count >= this.playlist.length) {
                        this.playlist = null;
                    }
                    this.play();
                } else {
                    this._setState("error", true);
                }
            }
        },
        _onFlashEvent: function (event) {
            var type = event.type;
            app.log("OnFlashEvent type: " + type);
            if (!this.isPlay) {
                return;
            }
            var func = this._flashEvents[type];
            if (typeof func == "function") {
                func.call(this, event);
            }
        },
        _setState: function (str, notify) {
            if (this._currState == str) {
                return;
            }
            this._currState = str;
            this.isError = str == "error";
            this.isThrobber = str == "throbber";
            var oldIsPlay = this.isPlay;
            this.isPlay = this.isThrobber || str == "play";
            if (notify) {
                this._observer.onState(this._currentChanged || oldIsPlay != this.isPlay);
                this._currentChanged = false;
            }
        },
        _getPlayList: function (b) {
            this.playlist = null;
            common.http.GET({
                url: this.getCurrentUrl(),
                timeout: 1000,
                scope: this,
                callback: function (response) {
                    var arr = response.toLowerCase().split("\n");
                    var valid = [];
                    for (var i in arr) {
                        var st = arr[i];
                        var sti = st.indexOf("http://");
                        if (st.indexOf("file") == 0 && st.indexOf("=") == 5) {
                            valid.push(st.substr(st.indexOf("=") + 1));
                        } else if (sti == 0) {
                            if (st.substr(st.length - 5).indexOf(".m3u") == -1) {
                                valid.push(st.substr(sti));
                            }
                        }
                    }
                    if (valid.length > 0) {
                        this.playlist = valid;
                        this.playlist_count = 0;
                        this.play();
                    }
                },
                errback: function (data) {
                    if (b) {
                        this._getPlayList(false);
                    }
                }
            });
        },
        _resetPlayer: function () {
            var wtmr = false;
            if (!this._window || this._window.closed) {
                this._window = this._openMainWindow();
                log("this._window = this._openMainWindow();");
                wtmr = true;
            } else {
                var flash = this._getFlash();
                wtmr = !flash;
                if (flash) {
                    this._cancelTimers("init");
                    this._initFailCount = defFailCount;
                }
            }
            if (wtmr) {
                log("setTimeout(this.play, 1000, this);");
                this._initTimer = common.timers.setTimeout(this.play, 1000, this);
                log("throbber");
                this._setState("throbber", true);
            }
            this._initFailCount--;
            if (this._initFailCount <= 0) {
                this._cancelTimers("init");
                this._initFailCount = defFailCount;
                this._setState("error", true);
            }
        },
        play: function () {
            try {
                log("play");
                log("var flash = this._getFlash();");
                var flash = this._getFlash();
                log("this._getFlash(); return");
                log(flash);
                if (flash) {
                    log("play: try flash.SetStation(this._currentUrl, false);");
                    if (!flash.SetStation) {
                        this._setState("error", true);
                        return;
                    }
                    flash.SetStation(this._currentUrl, false);
                    log("flash.SetStation(this._currentUrl, false);");
                    flash.PlayStream();
                    log("flash.PlayStream();");
                    this._setState("play", true);
                    this._storage.isPlay = true;
                } else {
                    log("this._resetPlayer();");
                    this._resetPlayer();
                }
            } catch (e) {
                this._resetPlayer();
            }
        },
        pause: function () {
            var flash = this._getFlash();
            if (flash && flash.StopStream) {
                flash.StopStream();
            }
            this._storage.isPlay = false;
            this._setState("pause", true);
        },
        toggle: function () {
            return this.isPlay ? this.pause() : this.play();
        },
        getPlayState: function () {
            return this.isError ? "error" : this.isThrobber ? "throbber" : this.isPlay ? "play" : "pause";
        },
        getCurrentUrl: function () {
            return this._currentUrl;
        },
        setCurrentUrl: function (url, start) {
            this._currentUrl = url;
            this._currentChanged = true;
            log("setCurrentUrl " + url);
            if (start || this.isPlay || this._storage.isPlay) {
                this.play();
            }
        }
    };
    return r;
};
