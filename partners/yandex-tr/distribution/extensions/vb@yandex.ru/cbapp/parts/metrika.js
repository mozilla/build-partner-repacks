"use strict";
const EXPORTED_SYMBOLS = ["metrika"];
const GLOBAL = this;
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const QUEUE_INTERVAL_RUN_MS = 5000;
const QUEUE_REQUEST_TIMEOUT_MS = 3000;
const QUEUE_PROCESSING_FINISHED = "ftabs-metrika-queue-processed";
const metrika = {
        init: function Metrika_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("Metrika");
            this._guidString = this._application.addonStatus.guidString;
            this._addonVersion = this._application.addonManager.addonVersion;
            this._locale = this._application.localeString;
            this._counterId = this._application.preferences.get("metrika.counter");
            this.__proto__ = new patterns.NotificationSource();
            var self = this;
            this._timer = new sysutils.Timer(function () {
                var tasks = [];
                Object.keys(self._paramsQueue).forEach(function (serializedData) {
                    try {
                        let data = JSON.parse(serializedData);
                        let counter = self._paramsQueue[serializedData];
                        tasks.push(function (callback) {
                            self._sendParamRequest(data, counter, callback);
                        });
                    } catch (e) {
                    }
                });
                self._paramsQueue = Object.create(null);
                async.parallel(tasks, function () {
                    self._notifyListeners(QUEUE_PROCESSING_FINISHED);
                });
            }, QUEUE_INTERVAL_RUN_MS, true);
            var root = Log4Moz.repository.rootLogger;
            root.level = Log4Moz.Level.All;
            root.addAppender(this._logAppender);
        },
        finalize: function Metrika_finalize(doCleanup, callback) {
            if (Object.keys(this._paramsQueue).length) {
                this.addListener(QUEUE_PROCESSING_FINISHED, this);
                this._finalizeCallback = callback;
                this._timer.notify();
                return true;
            }
            this._logger = null;
            this._application = null;
        },
        observe: function Backup_observe(aSubject, aTopic, aData) {
            switch (aTopic) {
            case QUEUE_PROCESSING_FINISHED:
                this._timer.cancel();
                this._logger.trace("Queue processed");
                this._logger = null;
                this._application = null;
                this.removeAllListeners();
                this._finalizeCallback();
                break;
            }
        },
        param: function Metrika_param(msg, line, data) {
            var serializedData;
            data = data || {};
            try {
                data.msg = msg;
                data.line = line || 0;
                serializedData = JSON.stringify(data);
            } catch (ex) {
                this._logger.error("Data could not be serialized: " + strutils.formatError(ex));
                this._logger.debug(ex.stack);
            }
            if (!serializedData)
                return;
            this._paramsQueue[serializedData] = this._paramsQueue[serializedData] || 0;
            this._paramsQueue[serializedData] += 1;
        },
        _sendParamRequest: function Metrika__sendParamRequest(data, totalEvents, callback) {
            var addonVersion = this._addonVersion;
            var msgWithLine = data.msg.replace(this._appBasePath, "") + (data.line ? ":" + data.line : "");
            var paramData = JSON.stringify({
                    id: this._guidString,
                    lang: this._locale,
                    os: sysutils.platformInfo.os.name,
                    bv: sysutils.platformInfo.browser.version.toString(),
                    module: data.module || "",
                    file: data.file || "",
                    trace: data.trace || ""
                });
            var siteInfo = {};
            siteInfo[addonVersion] = {};
            siteInfo[addonVersion][msgWithLine] = {};
            siteInfo[addonVersion][msgWithLine][paramData] = totalEvents;
            var postData = {
                    "browser-info": [
                        "ar:1",
                        "en:utf-8",
                        "i:" + strutils.formatDate(new Date(), "%Y%M%D%H%N%S"),
                        "js:1",
                        "la:" + this._locale,
                        "rn:" + Math.round(Math.random() * 100000),
                        "wmode:1"
                    ].join(":"),
                    "site-info": JSON.stringify(siteInfo)
                };
            var sendData = [];
            for (let [
                        key,
                        value
                    ] in Iterator(postData)) {
                sendData.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
            }
            var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            request.mozBackgroundRequest = true;
            request.QueryInterface(Ci.nsIDOMEventTarget);
            request.open("POST", "http://mc.yandex.ru/watch/" + this._counterId + "/1?" + sendData.join("&"), true);
            var timer = new sysutils.Timer(function () {
                    request.abort();
                }, QUEUE_REQUEST_TIMEOUT_MS);
            var requestCallback = function Metrika__sendParamRequest_requestCallback(evt) {
                timer.cancel();
                callback(null, evt.type);
            };
            request.addEventListener("load", requestCallback, false);
            request.addEventListener("error", requestCallback, false);
            request.addEventListener("abort", requestCallback, false);
            request.send();
        },
        get _logFormatter() {
            delete this._logFormatter;
            var formatter = Object.create(Log4Moz.BasicFormatter.prototype);
            Log4Moz.BasicFormatter.call(formatter);
            formatter.format = function (message) {
                return {
                    module: message.loggerName,
                    msg: message.message
                };
            };
            return this._formatter = formatter;
        },
        get _logAppender() {
            delete this._logAppender;
            var appender = Object.create(Log4Moz.Appender.prototype);
            Log4Moz.Appender.call(appender, this._logFormatter);
            appender.doAppend = function (aMessage) {
                metrika.param(aMessage.msg, 0, aMessage);
            };
            appender.level = Log4Moz.Level.Error;
            return this._logAppender = appender;
        },
        get _appBasePath() {
            var {Services: Services} = Cu.import("resource://gre/modules/Services.jsm", {});
            var appBasePath = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(this._application.core.extensionPathFile);
            delete this._appBasePath;
            return this._appBasePath = decodeURIComponent(appBasePath);
        },
        _application: null,
        _logger: null,
        _timer: null,
        _finalizeCallback: null,
        _paramsQueue: {}
    };
