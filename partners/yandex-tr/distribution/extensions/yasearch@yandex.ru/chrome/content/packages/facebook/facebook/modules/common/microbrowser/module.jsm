EXPORTED_SYMBOLS = ["module"];
var module = function (app, common, modPath) {
    function log(str) {
        common.log("[MicroBrowser]: " + str);
    }
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    var netErrorCodes = [
        Cr.NS_ERROR_UNKNOWN_PROTOCOL,
        Cr.NS_ERROR_NO_CONTENT,
        Cr.NS_ERROR_NOT_CONNECTED,
        Cr.NS_ERROR_CONNECTION_REFUSED,
        Cr.NS_ERROR_PROXY_CONNECTION_REFUSED,
        Cr.NS_ERROR_NET_TIMEOUT,
        Cr.NS_ERROR_OFFLINE,
        Cr.NS_ERROR_PORT_ACCESS_NOT_ALLOWED,
        Cr.NS_ERROR_NET_RESET,
        Cr.NS_ERROR_REDIRECT_LOOP,
        Cr.NS_ERROR_UNKNOWN_PROXY_HOST,
        Cr.NS_ERROR_UNKNOWN_SOCKET_TYPE,
        Cr.NS_ERROR_UNKNOWN_HOST
    ];
    var netTimeoutError = 5;
    var netErrorText = "net error";
    var empty = function () {
    };
    var contentPath = modPath = common.api.Package.resolvePath(modPath + "content/");
    var openWindows = {};
    var throbberUrl = contentPath + "throbber.html";
    var isWaitingUrl = function (url) {
        return /^https?:\/\//i.test(url);
    };
    var resolveUrl = function (url) {
        if (!url || url == "throbber") {
            return contentPath + "throbber.html";
        }
        if (!/^(xb|https?):\/\//i.test(url)) {
            return common.resolvePath(url);
        }
        return url;
    };
    function MBrowser(win, cb, onclose, urls, mbAdapter, timeout) {
        this.window = win;
        this._cb = cb;
        this._urls = urls;
        this._urls = urls;
        this._onclose = onclose;
        this._mbAdapter = mbAdapter;
        this._lastError = null;
        this._timer = null;
        this._timeout = timeout;
    }
    MBrowser.prototype = {
        constructor: MBrowser,
        close: function () {
            if (this.window && !this.window.closed) {
                this._onclose();
                this.window.close();
                this.window = null;
            }
        },
        _destroy: function () {
            this._clearTimer();
        },
        _ontimer: function () {
            if (this._timer) {
                this._timer = null;
                if (this._urls.errorUrl) {
                    this._lastError = {
                        status: 0,
                        text: netErrorText,
                        net: netTimeoutError
                    };
                    this.loadURL(this._urls.errorUrl);
                }
            }
        },
        _clearTimer: function () {
            if (this._timer) {
                this._timer.cancel();
                this._timer = null;
            }
        },
        _onxulready: function () {
            this.loadURL(this._urls.url);
        },
        lastURL: function () {
            return this._lastHTTPURL;
        },
        loadURL: function (url, force) {
            if (!this.closed() && this._cb && this._cb.scope && this._cb.scope.loadUrl) {
                url = resolveUrl(url);
                if (this._currentUrl == url && !force) {
                    return;
                }
                this._lastErrorUrl = null;
                this._clearTimer();
                var isWU = isWaitingUrl(url);
                if (isWU) {
                    this._lastHTTPURL = url;
                }
                if (isWU && this._currentUrl != this._urls.throbberUrl) {
                    this.loadURL(this._urls.throbberUrl);
                    common.timers.setTimeout(function () {
                        this.loadURL(url);
                    }, 100, this);
                } else {
                    log("loadURL: url=" + url);
                    this._currentUrl = url;
                    if (url == this._urls.errorUrl) {
                        this._mbAdapter.error = this._lastError;
                        this._lastError = null;
                    } else {
                        this._mbAdapter.error = null;
                    }
                    this._cb.scope.loadUrl(url);
                    if (isWU && this._urls.errorUrl && this._timeout) {
                        this._timer = common.timers.setTimeout(this._ontimer, this._timeout, this);
                    }
                }
            }
        },
        _handleLoadError: function (url, data) {
            common.logObj(data, "_handleLoadError: url=" + url);
            this._lastErrorUrl = url;
            this._lastError = data;
            this.showError();
        },
        showError: function (status, text, net) {
            if (this._urls.errorUrl) {
                if (arguments.length) {
                    this._lastError = {
                        status: status,
                        text: text || "",
                        net: typeof net == "number" ? net : -1
                    };
                }
                this.loadURL(this._urls.errorUrl);
            }
        },
        setTitle: function (str) {
            if (!this.closed() && this._cb && this._cb.scope && this._cb.scope.setTitle) {
                this._cb.scope.setTitle(str);
            }
        },
        closed: function () {
            return this.window && this.window.closed;
        },
        focus: function () {
            if (!this.closed()) {
                this.window.focus();
            }
        }
    };
    var mod = {
        handlerBlanksFunc: function (e) {
            for (var elem = e.target, i = 3; i && elem; elem = elem.parentNode, i--) {
                if (elem.tagName == "A" && !/^javascript:/.test(elem.href) && elem.target == "_blank") {
                    common.api.Controls.navigateBrowser({ url: e.target.href });
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
            }
        },
        testUrl: function (url, tpl, paramsParse) {
            var res = false;
            if (common.utils.isRegExp(tpl)) {
                res = tpl.test(url);
            } else {
                url = url.replace(/^https?:\/\/(www\.)?/, "");
                tpl = tpl.replace(/^https?:\/\/(www\.)?/, "");
                res = url.indexOf(tpl) == 0;
            }
            if (!res || !paramsParse) {
                return res;
            }
            var idxQS = url.indexOf("?"), idxH = url.indexOf("#");
            if (idxQS < 0 && idxH < 0) {
                return {
                    qs: {},
                    hash: {}
                };
            }
            if (idxH < 0) {
                idxH = url.length;
            }
            if (idxQS > idxH || idxQS < 0) {
                idxQS = idxH - 1;
            }
            return {
                qs: common.utils.urlParams2Obj(url.substring(idxQS + 1, idxH)),
                hash: common.utils.urlParams2Obj(url.substring(idxH + 1))
            };
        },
        open: function (config) {
            var window = common.ui.getTopBrowserWindow();
            var id = "mb" + new Date().valueOf();
            var cgfClose = config.onclose;
            var scope = config.scope || null;
            var onclose = function () {
                if (openWindows[id]) {
                    delete openWindows[id];
                }
                ww._destroy();
                if (cgfClose) {
                    cgfClose.call(scope);
                    cgfClose = null;
                }
                ww = null;
            };
            var args = {
                title: config.title || "",
                scope: scope,
                allowPlugins: config.allowPlugins,
                htmlOnly: config.htmlOnly,
                onload: config.onload,
                onclose: onclose,
                _log: log,
                onxulready: function () {
                    log("onxulready");
                    ww._onxulready();
                }
            };
            var mbAdapter = { throbberTitle: config.throbberTitle || "" };
            var testHeightTimer = null;
            args.inject = function (document) {
                var location = document.location;
                if (!/^(https?|xb):\/\//i.test(location)) {
                    return;
                }
                document.defaultView.widgetAdapter = config.adapter;
                document.defaultView.mbAdapter = mbAdapter;
                document.addEventListener("CloseMicrobrowser", function () {
                    log("CloseMicrobrowser handled");
                    ww.close();
                }, false, true);
                if (document.body) {
                    var script = document.createElement("script");
                    script.innerHTML = "window.close=function(e){e=document.createEvent(\"Event\");e.initEvent(\"CloseMicrobrowser\",true,false);document.documentElement.dispatchEvent(e);};";
                    document.body.appendChild(script);
                } else {
                    log("not found body for url " + document.location);
                }
                if (config.handleBlanks) {
                    document.addEventListener("click", mod.handlerBlanksFunc, false, true);
                }
                if (config.onready) {
                    config.onready.call(scope, document, document.defaultView);
                }
                if (config.testHeight && !testHeightTimer) {
                    testHeightTimer = common.timers.setInterval(function () {
                        var closed = true;
                        try {
                            closed = !ww || !document.defaultView || document.defaultView.closed;
                        } catch (exc) {
                        }
                        if (closed) {
                            testHeightTimer.cancel();
                            testHeightTimer = null;
                            return;
                        }
                        var sh = document.defaultView.scrollMaxY || 0;
                        if (sh > 1) {
                            log("document.defaultView.scrollMaxY = " + sh);
                            browserWindow.resizeBy(0, sh + 1);
                        }
                    }, 450);
                }
            };
            var progressListener = {
                QueryInterface: function (aIID) {
                    if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports)) {
                        return this;
                    } else {
                        throw Components.results.NS_NOINTERFACE;
                    }
                },
                onStateChange: function (webProgress, request, state, status) {
                    var url1 = request.name;
                    try {
                        if (ww && state & Ci.nsIWebProgressListener.STATE_STOP && state & Ci.nsIWebProgressListener.STATE_IS_WINDOW) {
                            ww._clearTimer();
                            var fi = netErrorCodes.indexOf(status);
                            if (fi > -1) {
                                request.cancel(status);
                                ww._handleLoadError(url1, {
                                    status: 0,
                                    net: fi,
                                    text: netErrorText
                                });
                                return;
                            }
                            let httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
                            let httpStatus = httpChannel.responseStatus;
                            if (httpStatus >= 400 && httpStatus != 404 || httpStatus < 200) {
                                ww._handleLoadError(url1, {
                                    status: httpStatus,
                                    net: -1,
                                    text: httpChannel.responseStatusText
                                });
                            }
                        }
                    } catch (e) {
                    }
                },
                onLocationChange: function (aWebProgress, aRequest, aLocation) {
                    if (ww) {
                        ww._clearTimer();
                    }
                    if (config.onlocationchange) {
                        config.onlocationchange.apply(config.scope, arguments);
                    }
                },
                onProgressChange: empty,
                onSecurityChange: empty,
                onStatusChange: empty
            };
            args.notifyMask = args.notifyMask || Components.interfaces.nsIWebProgress.NOTIFY_ALL;
            args.progressListener = progressListener;
            args.callbacks = {};
            log("open: url=" + config.url);
            var windowName = "yb_microbrowser" + Date.now();
            var browserWindow = window.openDialog(contentPath + "microbrowser.xul", windowName, config.features, args);
            var ww = new MBrowser(browserWindow, args.callbacks, onclose, {
                url: config.url,
                errorUrl: config.errorUrl && !isWaitingUrl(config.errorUrl) ? resolveUrl(config.errorUrl) : "",
                throbberUrl: config.throbberUrl && !isWaitingUrl(config.throbberUrl) ? resolveUrl(config.throbberUrl) : throbberUrl
            }, mbAdapter, config.timeout ? config.timeout * 1000 : null);
            ww.windowName = windowName;
            openWindows[id] = ww;
            return ww;
        },
        finalize: function () {
            log("finalize");
            for (var i in openWindows) {
                if (openWindows.hasOwnProperty(i)) {
                    openWindows[i].close();
                }
            }
            openWindows = {};
        }
    };
    return mod;
};
