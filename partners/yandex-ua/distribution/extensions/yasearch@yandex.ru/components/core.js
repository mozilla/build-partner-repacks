'use strict';
const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
const EXTENSION_DIR = __LOCATION__.parent.parent;
const EXTENSION_PATH = Services.io.newFileURI(EXTENSION_DIR).spec;
Cu.import(EXTENSION_PATH + 'config.js');
const APP_NAME = CB_CONFIG.APP.NAME;
function CustomBarCore() {
    this._loadModules();
    Services.obs.addObserver(this, 'quit-application', false);
}
;
CustomBarCore.prototype = {
    Lib: {},
    get CONFIG() {
        return CB_CONFIG;
    },
    get appName() {
        return this._appName;
    },
    get buildDate() {
        return new Date(this._buildTimeStamp);
    },
    get buidRevision() {
        return CB_CONFIG.BUILD.REVISION;
    },
    get xbWidgetsPrefsPath() {
        return CB_CONFIG.PREFS_PATH.XB_WIDGETS;
    },
    get nativesPrefsPath() {
        return CB_CONFIG.PREFS_PATH.NATIVES;
    },
    get staticPrefsPath() {
        return CB_CONFIG.PREFS_PATH.STATIC;
    },
    get application() {
        return this._appObj;
    },
    get rootDir() {
        if (!this._appRoot) {
            this._appRoot = Services.dirsvc.get('ProfD', Ci.nsIFile);
            this._appRoot.append(this.appName + '-xb');
            if (!this._appRoot.exists())
                this._appRoot.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt('0755', 8));
        }
        return this._appRoot.clone();
    },
    get xbProtocol() {
        if (!this._xbProtocol)
            this._xbProtocol = Cc['@mozilla.org/network/protocol;1?name=xb'].getService(Ci.nsIProtocolHandler).wrappedJSObject;
        return this._xbProtocol;
    },
    get protocols() {
        return this._protocols;
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
    get logging() {
        return this._logging;
    },
    set logging(newVal) {
        if (this._logging == !!newVal)
            return;
        this._logging = !this._logging;
        if (this._logging)
            this._startLogging();
        else
            this._stopLogging();
    },
    observe: function CustomBarCore_observe(subject, topic, data) {
        switch (topic) {
        case 'profile-after-change':
            this._startLogging();
            this._registerProtocols();
            this._initApp();
            break;
        case 'quit-application':
            if (this._appObj)
                this._destroyApp();
            break;
        case 'nsPref:changed':
            this._updateLoggers(data == this._dumpLogLevelPrefName, data == this._consoleLogLevelPrefName, data == this._fileLogLevelPrefName, data == this._socketLogLevelPrefName);
            break;
        }
    },
    get oldCore() {
        try {
            let oldCore = 'nsIYaSearch' in Ci && Cc['@yandex.ru/' + APP_NAME + ';1'].getService(Ci.nsIYaSearch).wrappedJSObject;
            this.__defineGetter__('oldCore', function () oldCore);
            return this.oldCore;
        } catch (e) {
        }
        return null;
    },
    _buildTimeStamp: Date.parse(CB_CONFIG.BUILD.DATE),
    _appName: APP_NAME,
    _modulesPath: 'resource://' + APP_NAME + '-mod/',
    _appResPath: 'resource://' + APP_NAME + '-app/',
    _appChromePath: 'chrome://' + APP_NAME + '/',
    _appRoot: null,
    _appObj: null,
    _dumpLogLevelPrefName: APP_NAME + '.xbcore.logging.stdout.level',
    _consoleLogLevelPrefName: APP_NAME + '.xbcore.logging.console.level',
    _fileLogLevelPrefName: APP_NAME + '.xbcore.logging.file.level',
    _socketLogLevelPrefName: APP_NAME + '.xbcore.logging.socket.level',
    _dumpAppender: null,
    _consoleAppender: null,
    _fileAppender: null,
    _socketAppender: null,
    _logging: true,
    _globalEvents: {
        EVT_PLUGIN_BEFORE_ENABLED: APP_NAME + '-platform-plugin-before_enabled',
        EVT_PLUGIN_ENABLED: APP_NAME + '-platform-plugin-enabled',
        EVT_PLUGIN_BEFORE_DISABLED: APP_NAME + '-platform-plugin-before_disabled',
        EVT_PLUGIN_DISABLED: APP_NAME + '-platform-plugin-disabled',
        EVT_AFTER_DEFPRESET_UPD: APP_NAME + '-platform-defpreset-after_update',
        EVT_BEFORE_GLOBAL_RESET: APP_NAME + '-platform-components-before_reset',
        EVT_AFTER_GLOBAL_RESET: APP_NAME + '-platform-components-after_reset'
    },
    _moduleFileNames: [
        'Log4Moz.jsm',
        'Preferences.jsm',
        'WindowListener.jsm',
        'AddonManager.jsm',
        'Foundation.jsm',
        'SimpleProtocol.jsm'
    ],
    _loadModules: function CustomBarCore__loadModules() {
        const Lib = this.Lib;
        const prePath = this._modulesPath;
        this._moduleFileNames.forEach(function loadModule(fileName) {
            Cu.import(prePath + fileName, Lib);
        });
    },
    _startLogging: function CustomBarCore__startLogging() {
        const Log4Moz = this.Lib.Log4Moz;
        var root = Log4Moz.repository.rootLogger;
        root.level = Log4Moz.Level.All;
        var formatter = new Log4Moz.BasicFormatter();
        this._consoleAppender = new Log4Moz.ConsoleAppender(formatter);
        Log4Moz.repository.getLogger(this.appName).addAppender(this._consoleAppender);
        this._dumpAppender = new Log4Moz.DumpAppender(formatter);
        root.addAppender(this._dumpAppender);
        var logFile = this.rootDir;
        logFile.append('debug.log');
        this._fileAppender = new Log4Moz.RotatingFileAppender(logFile, formatter);
        root.addAppender(this._fileAppender);
        var host = 'localhost';
        var port = '4448';
        this._socketAppender = new Log4Moz.SocketAppender(host, port, new Log4Moz.XMLFormatter());
        root.addAppender(this._socketAppender);
        this._logger = Log4Moz.repository.getLogger(this.appName + '.Core');
        this._logger.level = Log4Moz.Level.Debug;
        this._updateLoggers(true, true, true, true);
        this.Lib.Preferences.observe(this._dumpLogLevelPrefName, this);
        this.Lib.Preferences.observe(this._consoleLogLevelPrefName, this);
        this.Lib.Preferences.observe(this._fileLogLevelPrefName, this);
        this.Lib.Preferences.observe(this._socketLogLevelPrefName, this);
        var consoleListenerLogger = Log4Moz.repository.getLogger('Browser.Console');
        consoleListenerLogger.level = Log4Moz.Level.Error;
        this.Lib.ConsoleListener.addLogger(consoleListenerLogger);
    },
    _stopLogging: function CustomBarCore__stopLogging() {
        this.Lib.Preferences.ignore(this._dumpLogLevelPrefName, this);
        this.Lib.Preferences.ignore(this._consoleLogLevelPrefName, this);
        this.Lib.Preferences.ignore(this._fileLogLevelPrefName, this);
        this.Lib.Preferences.ignore(this._socketLogLevelPrefName, this);
        var root = this.Lib.Log4Moz.repository.rootLogger;
        this.Lib.Log4Moz.repository.getLogger(this.appName).removeAppender(this._consoleAppender);
        this._consoleAppender = null;
        root.removeAppender(this._dumpAppender);
        this._dumpAppender = null;
        this._fileAppender.closeStream();
        root.removeAppender(this._fileAppender);
        this._fileAppender = null;
        this._socketAppender.closeStream();
        root.removeAppender(this._socketAppender);
        this._socketAppender = null;
        this.Lib.ConsoleListener.removeLogger(this.Lib.Log4Moz.repository.getLogger('Browser.Console'));
    },
    _updateLoggers: function CustomBarCore__updateLoggers(checkDumpSetting, checkConsoleSetting, checkFileSetting, checkSocketSetting) {
        const Preferences = this.Lib.Preferences;
        function readLogLevel(prefName) {
            var logLevel = parseInt(Preferences.get(prefName, NaN), 10);
            return isNaN(logLevel) || logLevel < 0 ? 100 : logLevel;
        }
        if (checkDumpSetting)
            this._dumpAppender.level = readLogLevel(this._dumpLogLevelPrefName);
        if (checkConsoleSetting)
            this._consoleAppender.level = readLogLevel(this._consoleLogLevelPrefName);
        if (checkFileSetting)
            this._fileAppender.level = readLogLevel(this._fileLogLevelPrefName);
        if (checkSocketSetting)
            this._socketAppender.level = readLogLevel(this._socketLogLevelPrefName);
    },
    _initApp: function CustomBarCore__initApp() {
        try {
            let appModule = {};
            Cu.import(this._appResPath + 'bar.js', appModule);
            this._appObj = appModule.barApplication;
            this._appObj.init(this);
            Services.obs.notifyObservers(null, this.appName + '-state-changed', 'custombar-initialized');
        } catch (e) {
            this._appObj = null;
            this._logger.fatal('Couldn\'t initialize application. ' + this._formatError(e));
            if (e.stack)
                this._logger.debug(e.stack);
        }
    },
    _destroyApp: function CustomBarCore__destroyApp() {
        try {
            this._appObj.finalize(function () {
                this._stopLogging();
                this._unregisterProtocols();
                this._appObj = null;
            }.bind(this));
        } catch (e) {
            this._logger.error(this._formatError(e));
            this._logger.debug(e.stack);
        }
    },
    _registerProtocols: function CustomBarCore__registerProtocols() {
        this._protocols = {};
        for (let [
                    scheme,
                    classID
                ] in Iterator(CB_CONFIG.PROTOCOLS)) {
            this._protocols[scheme] = new this.Lib.SimpleProtocol(scheme, classID);
        }
    },
    _unregisterProtocols: function CustomBarCore__unregisterProtocols() {
        for (let [
                    scheme,
                    protocol
                ] in Iterator(this._protocols)) {
            try {
                protocol.unregister();
            } catch (e) {
                this._logger.error('Error unregistering \'' + scheme + '\' protocol. ' + e);
            }
        }
        this._protocols = {};
    },
    _formatError: function CustomBarCore__formatError(e) {
        if (typeof e != 'object')
            return '' + e;
        var text = e.name + ': ' + e.message;
        var fileName = e.fileName || e.filename;
        if (fileName)
            text += '\nin ' + fileName + '@' + e.lineNumber;
        return text;
    },
    classDescription: 'Custom Yandex bar core JS component for ' + APP_NAME,
    classID: Components.ID(CB_CONFIG.CORE.CLASS_ID),
    contractID: CB_CONFIG.CORE.CONTRACT_ID,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    _xpcom_categories: [{
            category: 'app-startup',
            service: true
        }]
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([CustomBarCore]);
if (Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment).exists('YABAR_DEBUG_PROFILER_RUN'))
    Cu.import(CustomBarCore.prototype._modulesPath + 'Profiler.jsm', {}).Profiler.run();
