"use strict";
const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
const EXTENSION_DIR = __LOCATION__.parent.parent;
const EXTENSION_PATH = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newFileURI(EXTENSION_DIR).spec;
Cu.import(EXTENSION_PATH + "config.js");
const APP_NAME = VB_CONFIG.APP.NAME;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
function Log(libs, rootDir) {
    this._libs = libs;
    this._rootDir = rootDir;
    this._prefs = libs.Preferences;
    const Log4Moz = libs.Log4Moz;
    Log4Moz.repository.rootLogger.level = Log4Moz.Level.All;
    this._coreLogger = Log4Moz.repository.getLogger(VB_CONFIG.APP.NAME + ".Core");
    this._coreLogger.level = Log4Moz.Level.Debug;
    this._logAppenders = null;
}
Log.prototype = {
    fatal: function Log_fatal(err, msg) {
        return this._logError("fatal", err, msg);
    },
    error: function Log_error(err, msg) {
        return this._logError("error", err, msg);
    },
    start: function Log_start() {
        this._logAppenders = Log.APPENDERS.map(function (LoggerClass) {
            return new LoggerClass(this._libs, this._rootDir);
        }, this);
        this._logAppenders.forEach(function (logger) {
            for (let prefName in logger.prefs) {
                logger.prefs[prefName](this._prefs.get(prefName, null));
                this._prefs.observe(prefName, this);
            }
        }, this);
    },
    stop: function Log_stop() {
        this._logAppenders.forEach(function (logger) {
            if (logger.prefs) {
                for (let prefName in logger.prefs) {
                    this._prefs.ignore(prefName, this);
                }
            }
            logger.stop();
        }, this);
        this._logAppenders = null;
    },
    observe: function Log_observe(subject, topic, prefName) {
        if (topic == "nsPref:changed") {
            this._logAppenders.forEach(function (logger) {
                if (logger.prefs && logger.prefs[prefName]) {
                    logger.prefs[prefName](this._prefs.get(prefName, null));
                }
            }, this);
        }
    },
    _logError: function Log__logError(level, err, msg) {
        var text = err.name + ": " + (msg ? msg + ";\n" + err.message : err.message);
        var fileName = err.fileName || err.filename;
        if (fileName) {
            text += "\nin " + fileName + "@" + err.lineNumber;
        }
        this._coreLogger[level](text);
        if (err.stack) {
            this._coreLogger.debug(err.stack);
        }
    }
};
Log.getLogLevelHandler = function Log_getLogLevelHandler(appender) {
    return function LogLevelHandler(level) {
        level = parseInt(level, 10);
        level >= 0 ? level : 100;
        appender.level = level;
    };
};
Log.getPrefName = function (name) {
    return [
        "extensions",
        VB_CONFIG.APP.ID,
        "logging",
        name
    ].join(".");
};
Log.APPENDERS = [
    function Log_APPENDERS_console(libs) {
        var basicFormatter = new libs.Log4Moz.BasicFormatter();
        var appender = new libs.Log4Moz.ConsoleAppender(basicFormatter);
        var appLogger = libs.Log4Moz.repository.getLogger(VB_CONFIG.APP.NAME);
        appLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_console_stop() {
            appLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("console.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_stdout(libs) {
        var basicFormatter = new libs.Log4Moz.BasicFormatter();
        var appender = new libs.Log4Moz.DumpAppender(basicFormatter);
        var rootLogger = libs.Log4Moz.repository.rootLogger;
        rootLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_stdout_stop() {
            rootLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("stdout.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_file(libs, rootDir) {
        rootDir.append("debug.log");
        var basicFormatter = new libs.Log4Moz.BasicFormatter();
        var appender = new libs.Log4Moz.RotatingFileAppender(rootDir, basicFormatter);
        var rootLogger = libs.Log4Moz.repository.rootLogger;
        rootLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_file_stop() {
            appender.closeStream();
            rootLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("file.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_socket(libs) {
        var xmlFormatter = new libs.Log4Moz.XMLFormatter();
        var rootLogger = libs.Log4Moz.repository.rootLogger;
        var appender = getSocket("localhost:4448");
        this.stop = closeSocket;
        this.prefs = {};
        this.prefs[Log.getPrefName("socket.level")] = Log.getLogLevelHandler(appender);
        this.prefs[Log.getPrefName("socket.address")] = function Log_APPENDERS_socket_pref_address(address) {
            if (address) {
                closeSocket();
                appender = getSocket(address);
            }
        };
        function closeSocket() {
            appender.closeStream();
            rootLogger.removeAppender(appender);
        }
        function getSocket(address) {
            var [
                    host,
                    port
                ] = address.split(":");
            var appender = new libs.Log4Moz.SocketAppender(host, port, xmlFormatter);
            rootLogger.addAppender(appender);
            return appender;
        }
    },
    function Log_APPENDERS_browserConsole(libs) {
        var logger = libs.Log4Moz.repository.getLogger("Browser.Console");
        logger.level = libs.Log4Moz.Level.Error;
        libs.ConsoleListener.addLogger(logger);
        this.stop = function Log_APPENDERS_browserConsole_stop() {
            libs.ConsoleListener.removeLogger(logger);
        };
    }
];
function VBCore() {
    this._libs = this._moduleFileNames.map(function VBCore_map(fileName) {
        return this._modulesPath + fileName;
    }, this).reduce(function VBCore_reduce(libs, filePath) {
        Cu.import(filePath, libs);
        return libs;
    }, {});
    this._log = new Log(this._libs, this.rootDir);
    this._observerService.addObserver(this, "profile-after-change", false);
    this._observerService.addObserver(this, "quit-application", false);
}
;
VBCore.prototype = {
    get Lib() {
        return this._libs;
    },
    get CONFIG() {
        return VB_CONFIG;
    },
    get appName() {
        return APP_NAME;
    },
    get buildDate() {
        return new Date(this._buildTimeStamp);
    },
    get buidRevision() {
        return VB_CONFIG.BUILD.REVISION;
    },
    get application() {
        return this._appObj;
    },
    get protocol() {
        return this._protocol;
    },
    get rootDir() {
        if (this._appRoot === null) {
            this._appRoot = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
            this._appRoot.append(this.appName);
            if (this._appRoot.exists() === false) {
                this._appRoot.create(Ci.nsIFile.DIRECTORY_TYPE, this.Lib.fileutils.PERMS_DIRECTORY);
            }
            if (this._appRoot.exists() === false) {
                throw "Can't create extension data folder in profile directory";
            }
        }
        return this._appRoot.clone();
    },
    get extensionPathFile() {
        return EXTENSION_DIR.clone();
    },
    get wrappedJSObject() {
        return this;
    },
    get eventTopics() {
        return this._globalEvents;
    },
    cleanup: function () {
        this._log.stop();
    },
    observe: function VBCore_observe(subject, topic, data) {
        switch (topic) {
        case "profile-after-change":
            this._log.start();
            this._protocol = new this.Lib.SimpleProtocol(VB_CONFIG.APP.PROTOCOL);
            this._initApp();
            break;
        case "quit-application":
            if (this._appObj)
                this._destroyApp();
            break;
        }
    },
    _buildTimeStamp: Date.parse(VB_CONFIG.BUILD.DATE),
    _appResPath: "resource://" + APP_NAME + "-app/",
    _appChromePath: "chrome://" + APP_NAME + "/",
    _modulesPath: "resource://" + APP_NAME + "-mod/",
    _moduleFileNames: [
        "Log4Moz.jsm",
        "Preferences.jsm",
        "WindowListener.jsm",
        "AddonManager.jsm",
        "Foundation.jsm",
        "SimpleProtocol.jsm"
    ],
    _protocol: null,
    _appRoot: null,
    _appObj: null,
    _globalEvents: {
        CLOUD_DATA_RECEIVED_EVENT: APP_NAME + "-cloud-data-received",
        THUMBS_STRUCTURE_READY_EVENT: APP_NAME + "-internal-thumbs-ready",
        APP_TAB_SHOWN: APP_NAME + "-tab-shown",
        SYNC_COMPONENT_ENABLED: "ybar:esync:plugin:enable",
        SYNC_COMPONENT_READY: "ybar:esync:service:ready",
        SYNC_COMPONENT_DISABLED: "ybar:esync:plugin:disable",
        SYNC_AUTH_CHANGED: "ybar:esync:auth:changed",
        SYNC_SERVICE_TOPHISTORY_ENABLED_STARTED: "ybar:esync:engine:Tophistory:init:start",
        SYNC_SERVICE_TOPHISTORY_ENABLED_FINISHED: "ybar:esync:engine:Tophistory:init:finish",
        SYNC_SERVICE_TOPHISTORY_DISABLED: "ybar:esync:engine:Tophistory:finalize:start",
        SYNC_SERVICE_PINNED_ENABLED_STARTED: "ybar:esync:engine:Pinned:init:start",
        SYNC_SERVICE_PINNED_ENABLED_FINISHED: "ybar:esync:engine:Pinned:init:finish",
        SYNC_SERVICE_PINNED_DISABLED: "ybar:esync:engine:Pinned:finalize:start"
    },
    _observerService: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
    _initApp: function VBCore__initApp() {
        try {
            let appModule = {};
            Cu.import(this._appResPath + "app.js", appModule);
            this._appObj = appModule.application;
            this._appObj.init(this);
        } catch (e) {
            this._appObj = null;
            this._log.fatal(e, "Couldn't initialize application.");
        }
    },
    _destroyApp: function VBCore__destroyApp() {
        this._appObj.finalize(function () {
            try {
                this._protocol.unregister();
            } catch (e) {
                this._log.error(e, "Couldn't unregister protocol.");
            }
            this._log.stop();
            this._appObj = null;
        }.bind(this));
    },
    classDescription: "Yandex Visual Bookmarks core JS component",
    classID: VB_CONFIG.CORE.CLASS_ID,
    contractID: VB_CONFIG.CORE.CONTRACT_ID,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    _xpcom_categories: [{
            category: "app-startup",
            service: true
        }]
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([VBCore]);
if (Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment).exists("YAVB_DEBUG_PROFILER_RUN")) {
    Cu.import(VBCore.prototype._modulesPath + "Profiler.jsm", {}).Profiler.run();
}
