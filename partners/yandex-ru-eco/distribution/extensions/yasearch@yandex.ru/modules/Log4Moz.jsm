"use strict";
const EXPORTED_SYMBOLS = [
        "Log4Moz",
        "ConsoleListener"
    ];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const MODE_RDONLY = 1;
const MODE_WRONLY = 2;
const MODE_CREATE = 8;
const MODE_APPEND = 16;
const MODE_TRUNCATE = 32;
const PERMS_FILE = parseInt("0644", 8);
const PERMS_DIRECTORY = parseInt("0755", 8);
const ONE_BYTE = 1;
const ONE_KILOBYTE = 1024 * ONE_BYTE;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;
const DEFAULT_NETWORK_TIMEOUT_DELAY = 5;
var Log4Moz = {
        Level: {
            Fatal: 70,
            Error: 60,
            Warn: 50,
            Info: 40,
            Config: 30,
            Debug: 20,
            Trace: 10,
            All: 0,
            Desc: {
                70: "FATAL",
                60: "ERROR",
                50: "WARN",
                40: "INFO",
                30: "CONFIG",
                20: "DEBUG",
                10: "TRACE",
                0: "ALL"
            }
        },
        get repository() {
            delete Log4Moz.repository;
            Log4Moz.repository = new LoggerRepository();
            return Log4Moz.repository;
        },
        set repository(value) {
            delete Log4Moz.repository;
            Log4Moz.repository = value;
        },
        get LogMessage() {
            return LogMessage;
        },
        get Logger() {
            return Logger;
        },
        get LoggerRepository() {
            return LoggerRepository;
        },
        get Formatter() {
            return Formatter;
        },
        get BasicFormatter() {
            return BasicFormatter;
        },
        get XMLFormatter() {
            return XMLFormatter;
        },
        get Appender() {
            return Appender;
        },
        get DumpAppender() {
            return DumpAppender;
        },
        get ConsoleAppender() {
            return ConsoleAppender;
        },
        get FileAppender() {
            return FileAppender;
        },
        get RotatingFileAppender() {
            return RotatingFileAppender;
        },
        get SocketAppender() {
            return SocketAppender;
        },
        enumerateInterfaces: function Log4Moz_enumerateInterfaces(aObject) {
            var interfaces = [];
            for (let i in Ci) {
                try {
                    aObject.QueryInterface(Ci[i]);
                    interfaces.push(i);
                } catch (ex) {
                }
            }
            return interfaces;
        },
        enumerateProperties: function Log4Moz_enumerateProps(aObject, aExcludeComplexTypes) {
            var properties = [];
            for (let p in aObject) {
                try {
                    if (aExcludeComplexTypes && (typeof aObject[p] == "object" || typeof aObject[p] == "function"))
                        continue;
                    properties.push(p + " = " + aObject[p]);
                } catch (ex) {
                    properties.push(p + " = " + ex);
                }
            }
            return properties;
        }
    };
function LogMessage(loggerName, level, messages) {
    this.loggerName = loggerName;
    this.message = Array.join(messages, " ");
    this.level = level;
    this.time = Date.now();
}
LogMessage.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    get levelDesc() {
        if (this.level in Log4Moz.Level.Desc)
            return Log4Moz.Level.Desc[this.level];
        return "UNKNOWN";
    },
    toString: function LogMsg_toString() {
        return "LogMessage [" + this.time + " " + this.level + " " + this.message + "]";
    }
};
function Logger(name, repository) {
    if (!repository)
        repository = Log4Moz.repository;
    this._name = name;
    this._appenders = [];
    this._repository = repository;
}
Logger.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    parent: null,
    get name() {
        return this._name;
    },
    _level: null,
    get level() {
        if (this._level != null)
            return this._level;
        if (this.parent)
            return this.parent.level;
        dump("log4moz warning: root logger configuration error: no level defined\n");
        return Log4Moz.Level.All;
    },
    set level(level) {
        this._level = level;
    },
    getLogger: function Logger_getLogger(name) {
        return this._repository.getLogger(this._name + "." + name);
    },
    _appenders: null,
    get appenders() {
        if (!this.parent)
            return this._appenders;
        return this._appenders.concat(this.parent.appenders);
    },
    addAppender: function Logger_addAppender(aAppender) {
        if (!this._appenders.some(function (appender) appender === aAppender))
            this._appenders.push(aAppender);
    },
    removeAppender: function Logger_removeAppender(aAppender) {
        this._appenders = this._appenders.filter(function (appender) appender !== aAppender);
    },
    log: function Logger_log(message) {
        if (this.level > message.level)
            return;
        var appenders = this.appenders;
        let (i = 0) {
            for (; i < appenders.length; i++) {
                appenders[i].append(message);
            }
        }
    },
    fatal: function Logger_fatal() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Fatal, arguments));
    },
    error: function Logger_error() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Error, arguments));
    },
    warn: function Logger_warn() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Warn, arguments));
    },
    info: function Logger_info() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Info, arguments));
    },
    config: function Logger_config() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Config, arguments));
    },
    debug: function Logger_debug() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Debug, arguments));
    },
    trace: function Logger_trace() {
        this.log(new LogMessage(this._name, Log4Moz.Level.Trace, arguments));
    },
    __exposedProps__: {
        getLogger: "r",
        fatal: "r",
        error: "r",
        warn: "r",
        info: "r",
        config: "r",
        debug: "r",
        trace: "r"
    }
};
function LoggerRepository() {
}
LoggerRepository.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    _loggers: {},
    _rootLogger: null,
    get rootLogger() {
        if (!this._rootLogger) {
            this._rootLogger = new Logger("root", this);
            this._rootLogger.level = Log4Moz.Level.All;
        }
        return this._rootLogger;
    },
    _updateParents: function LogRep__updateParents(name) {
        var pieces = name.split(".");
        var cur, parent;
        let (i = 0) {
            for (; i < pieces.length - 1; i++) {
                if (cur)
                    cur += "." + pieces[i];
                else
                    cur = pieces[i];
                if (cur in this._loggers)
                    parent = cur;
            }
        }
        if (!parent)
            this._loggers[name].parent = this.rootLogger;
        else
            this._loggers[name].parent = this._loggers[parent];
        for (let logger in this._loggers) {
            if (logger != name && logger.indexOf(name) == 0)
                this._updateParents(logger);
        }
    },
    getLogger: function LogRep_getLogger(name) {
        if (!name)
            name = this.getLogger.caller.name;
        if (name in this._loggers)
            return this._loggers[name];
        this._loggers[name] = new Logger(name, this);
        this._updateParents(name);
        return this._loggers[name];
    }
};
function Formatter() {
}
Formatter.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    format: function Formatter_format(message) {
    }
};
function BasicFormatter(dateFormat) {
    if (dateFormat)
        this.dateFormat = dateFormat;
}
BasicFormatter.prototype = {
    __proto__: Formatter.prototype,
    _dateFormat: null,
    get dateFormat() {
        return this._dateFormat || (this._dateFormat = "%Y-%m-%d %H:%M:%S");
    },
    set dateFormat(format) {
        this._dateFormat = format;
    },
    format: function BF_format(message) {
        var pad = function BF__pad(str, len, chr) str + new Array(Math.max((len || 20) - str.length + 1, 0)).join(chr || " ");
        var messageDate = new Date(message.time);
        var msec = messageDate.getMilliseconds();
        var dateStr = messageDate.toLocaleFormat(this.dateFormat) + "." + (msec < 100 ? msec < 10 ? "00" + msec : "0" + msec : msec);
        return dateStr + "	" + pad(message.loggerName) + " " + message.levelDesc + "	" + message.message + "\n";
    }
};
function XMLFormatter() {
}
XMLFormatter.prototype = {
    __proto__: Formatter.prototype,
    format: function XF_format(message) {
        var msg = message.message;
        var file = null;
        var line = null;
        var method = null;
        if (typeof msg == "object" && "lineNumber" in msg) {
            file = msg.fileName || msg.filename;
            line = msg.lineNumber;
        } else {
            let stackFrame = Components.stack.caller.caller.caller.caller;
            file = stackFrame.filename;
            line = stackFrame.lineNumber;
            method = stackFrame.name;
        }
        var escapedMessage = String(msg).replace(/[^ \u0021-\u003B\u003F-\u007A]/g, function (ch) "&#" + ch.charCodeAt(0) + ";");
        return "" + "<log4j:event logger='" + message.loggerName + "' " + "level='" + message.levelDesc + "' thread='unknown' " + "timestamp='" + message.time + "'>" + "<log4j:message>" + escapedMessage + "</log4j:message>" + "<log4j:locationInfo class='" + message.loggerName + "' " + "method='" + method + "' " + "file='" + file + "' line='" + line + "'/>" + "</log4j:event>";
    }
};
function Appender(formatter) {
    this._name = "Appender";
    this._formatter = formatter ? formatter : new BasicFormatter();
}
Appender.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports]),
    _level: Log4Moz.Level.All,
    get level() {
        return this._level;
    },
    set level(level) {
        this._level = level;
    },
    append: function App_append(message) {
        if (this._level <= message.level)
            this.doAppend(this._formatter.format(message));
    },
    toString: function App_toString() {
        return this._name + " [level=" + this._level + ", formatter=" + this._formatter + "]";
    },
    doAppend: function App_doAppend(message) {
    }
};
function DumpAppender(formatter) {
    this._name = "DumpAppender";
    this._formatter = formatter ? formatter : new BasicFormatter();
}
DumpAppender.prototype = {
    __proto__: Appender.prototype,
    doAppend: function DApp_doAppend(message) {
        dump(message);
    }
};
;
ConsoleAppender.prototype = {
    __proto__: Appender.prototype,
    doAppend: function CApp_doAppend(message) {
        if (message.level > Log4Moz.Level.Warn) {
            Cu.reportError(message);
            return;
        }
        gConsoleService.logStringMessage(message);
    }
};
function FileAppender(file, formatter) {
    this._name = "FileAppender";
    this._file = file;
    this._formatter = formatter ? formatter : new BasicFormatter();
}
FileAppender.prototype = {
    __proto__: Appender.prototype,
    __fos: null,
    get _fos() {
        if (!this.__fos)
            this.openStream();
        return this.__fos;
    },
    openStream: function FApp_openStream() {
        try {
            let __fos = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            let flags = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
            __fos.init(this._file, flags, PERMS_FILE, 0);
            this.__fos = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
            this.__fos.init(__fos, "UTF-8", 4096, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        } catch (e) {
            dump("Error opening stream:\n" + e);
        }
    },
    closeStream: function FApp_closeStream() {
        if (!this.__fos)
            return;
        try {
            this.__fos.close();
            this.__fos = null;
        } catch (e) {
            dump("Failed to close file output stream\n" + e);
        }
    },
    doAppend: function FApp_doAppend(message) {
        if (message === null || message.length <= 0)
            return;
        try {
            this._fos.writeString(message);
        } catch (e) {
            dump("Error writing file:\n" + e);
        }
    },
    clear: function FApp_clear() {
        this.closeStream();
        try {
            this._file.remove(false);
        } catch (e) {
        }
    }
};
function RotatingFileAppender(file, formatter, maxSize, maxBackups) {
    if (maxSize === undefined)
        maxSize = ONE_MEGABYTE * 2;
    if (maxBackups === undefined)
        maxBackups = 0;
    this._name = "RotatingFileAppender";
    this._file = file;
    this._formatter = formatter ? formatter : new BasicFormatter();
    this._maxSize = maxSize;
    this._maxBackups = maxBackups;
}
RotatingFileAppender.prototype = {
    __proto__: FileAppender.prototype,
    doAppend: function RFApp_doAppend(message) {
        if (message === null || message.length <= 0)
            return;
        try {
            this.rotateLogs();
            FileAppender.prototype.doAppend.call(this, message);
        } catch (e) {
            dump("Error writing file:" + e + "\n");
        }
    },
    rotateLogs: function RFApp_rotateLogs() {
        if (this._file.exists() && this._file.fileSize < this._maxSize)
            return;
        this.closeStream();
        let (i = this.maxBackups - 1) {
            for (; i > 0; i--) {
                let backup = this._file.parent.clone();
                backup.append(this._file.leafName + "." + i);
                if (backup.exists())
                    backup.moveTo(this._file.parent, this._file.leafName + "." + (i + 1));
            }
        }
        var cur = this._file.clone();
        if (cur.exists())
            cur.moveTo(cur.parent, cur.leafName + ".1");
    }
};
function SocketAppender(host, port, formatter, timeoutDelay) {
    this._name = "SocketAppender";
    this._host = host;
    this._port = port;
    this._formatter = formatter;
    this._timeout_delay = timeoutDelay || DEFAULT_NETWORK_TIMEOUT_DELAY;
    this._mainThread = Cc["@mozilla.org/thread-manager;1"].getService().mainThread;
}
SocketAppender.prototype = {
    __proto__: Appender.prototype,
    __nos: null,
    get _nos() {
        if (!this.__nos)
            this.openStream();
        return this.__nos;
    },
    __socketService: null,
    get _socketService() {
        if (!this.__socketService) {
            try {
                this.__socketService = Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService);
            } catch (e) {
            }
        }
        return this.__socketService;
    },
    _nextCheck: 0,
    openStream: function SApp_openStream() {
        var now = Date.now();
        if (now <= this._nextCheck)
            return null;
        if (!this._socketService)
            return null;
        this._nextCheck = now + this._timeout_delay * 1000;
        try {
            this._transport = this._socketService.createTransport(null, 0, this._host, this._port, null);
            this._transport.setTimeout(Ci.nsISocketTransport.TIMEOUT_CONNECT, this._timeout_delay);
            this._transport.setEventSink(this, this._mainThread);
            this.__nos = this._transport.openOutputStream(0, 0, 0);
        } catch (ex) {
            if (ex.result != Cr.NS_ERROR_OFFLINE)
                dump("Unexpected SocketAppender connection problem: " + ex.fileName + ":" + ex.lineNumber + ": " + ex + "\n");
        }
    },
    closeStream: function SApp_closeStream() {
        if (!this._transport)
            return;
        try {
            this._connected = false;
            this._transport = null;
            let nos = this.__nos;
            this.__nos = null;
            nos.close();
        } catch (e) {
        }
    },
    doAppend: function SApp_doAppend(message) {
        if (message === null || message.length <= 0)
            return;
        try {
            let nos = this._nos;
            if (nos)
                nos.write(message, message.length);
        } catch (e) {
            if (this._transport && !this._transport.isAlive()) {
                this.closeStream();
            }
        }
    },
    clear: function SApp_clear() {
        this.closeStream();
    },
    onTransportStatus: function SApp_onTransportStatus(aTransport, aStatus, aProgress, aProgressMax) {
        if (aStatus == 2152398852)
            this._connected = true;
    }
};
const nsIScriptError = Ci.nsIScriptError;
const ScriptError = new Components.Constructor("@mozilla.org/scripterror;1", "nsIScriptError", "init");
const gConsoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
function ConsoleAppender(formatter) {
    this._name = "ConsoleAppender";
    this._formatter = formatter;
}
ConsoleAppender.prototype = {
    __proto__: Appender.prototype,
    _makeScriptError: function CApp__makeScriptError(message, flags) {
        var stackFrame = Components.stack.caller.caller.caller.caller.caller;
        var error = new ScriptError(message, stackFrame.filename, stackFrame.sourceLine, stackFrame.lineNumber, stackFrame.columnNumber || 0, flags, "component javascript");
        return error;
    },
    append: function CApp_append(message) {
        if (this._level <= message.level)
            this.doAppend(this._formatter.format(message), message.level);
    },
    doAppend: function CApp_doAppend(message, messageLevel) {
        if (messageLevel > Log4Moz.Level.Config) {
            let seFlags = messageLevel >= Log4Moz.Level.Info && messageLevel <= Log4Moz.Level.Warn ? nsIScriptError.warningFlag : nsIScriptError.errorFlag;
            gConsoleService.logMessage(this._makeScriptError(message, seFlags));
            return;
        }
        gConsoleService.logStringMessage(message);
    }
};
const ConsoleListener = {
        addLogger: function ConsoleListener_addLogger(aLogger) {
            if (this._loggers.some(function (logger) logger === aLogger))
                return;
            this._loggers.push(aLogger);
            if (this._loggers.length == 1)
                gConsoleService.registerListener(this);
        },
        removeLogger: function ConsoleListener_removeLogger(aLogger) {
            this._loggers = this._loggers.filter(function (logger) logger !== aLogger);
            if (this._loggers.length == 0)
                gConsoleService.unregisterListener(this);
        },
        observe: function ConsoleListener_observe(aMessage) {
            try {
                if (aMessage instanceof Ci.nsIScriptError) {
                    this._logError(aMessage);
                } else if (aMessage instanceof Ci.nsIConsoleMessage) {
                    if (aMessage.message) {
                        this._logMessage(aMessage.message);
                    }
                } else {
                    this._logMessage(aMessage);
                }
            } catch (e) {
            }
        },
        _logMessage: function ConsoleListener__logMessage(aMessage) {
            this._loggers.forEach(function (logger) logger.info(aMessage));
        },
        _logError: function ConsoleListener__logError(aErrorObject) {
            if (typeof aErrorObject.category == "string" && !/(chrome|XPConnect|component)/.test(aErrorObject.category))
                return;
            if (/^(uncaught exception: )?\[Exception... /.test(aErrorObject.errorMessage)) {
                aErrorObject = this._parseException(aErrorObject.errorMessage);
                if (!aErrorObject)
                    return;
            }
            var error = !aErrorObject.flags || aErrorObject.flags & nsIScriptError.exceptionFlag;
            if (!error) {
                this._logWarning(aErrorObject);
                return;
            }
            this._loggers.forEach(function (logger) logger.error(aErrorObject));
        },
        _logWarning: function ConsoleListener__logWarning(aErrorObject) {
            this._loggers.forEach(function (logger) logger.warn(aErrorObject));
        },
        _parseException: function ConsoleListener__parseException(aErrorMessage) {
            if (/^(?:uncaught exception: )?\[Exception... "(?!<no message>)([\s\S]+)"  nsresult: "0x\S+ \((.+)\)"  location: "(?:(?:JS|native) frame :: (?!<unknown filename>)(.+) :: .+ :: line (\d+)|<unknown>)"  data: (?:yes|no)\]$/.test(aErrorMessage) || /^(?:uncaught exception: )?\[Exception... "(?!<no message>)([\s\S]+)"  code: "\d+" nsresult: "0x\S+ \((.+)\)"  location: "(?:(.+) Line: (\d+)|<unknown>)"\]$/.test(aErrorMessage)) {
                return new ScriptError(RegExp.$1 + (RegExp.$1.indexOf(RegExp.$2) == -1 ? " = " + RegExp.$2 : ""), RegExp.$3, 0, RegExp.$4, 0, nsIScriptError.exceptionFlag, "component javascript");
            }
            return null;
        },
        _loggers: []
    };
const StackUtils = {
        formatFrame: function StackUtils_formatFrame(aFrame) {
            var tmp = "<file:unknown>";
            var file = aFrame.filename || aFrame.fileName;
            if (file)
                tmp = file.replace(/^(?:chrome|file):.*?([^\/\.]+\.\w+)$/, "$1");
            if (aFrame.lineNumber)
                tmp += ":" + aFrame.lineNumber;
            if (aFrame.name)
                tmp = aFrame.name + "()@" + tmp;
            return tmp;
        },
        exceptionStr: function StackUtils_exceptionStr(aException) {
            var message = aException.message || aException;
            return message + "\n" + this.stackTrace(aException);
        },
        stackTraceFromFrame: function StackUtils_stackTraceFromFrame(aFrame) {
            var output = [];
            while (aFrame) {
                let str = this.formatFrame(aFrame);
                if (str)
                    output.push(str);
                aFrame = aFrame.caller;
            }
            return " ## " + output.join("\n <- ");
        },
        stackTrace: function StackUtils_stackTrace(aException) {
            if (!arguments.length)
                return "Current stack trace:\n" + this.stackTraceFromFrame(Components.stack.caller);
            if (aException.location)
                return "Stack trace:\n" + this.stackTraceFromFrame(aException.location);
            if (aException.stack) {
                let result = aException.stack.trim().replace(/\n/g, "\n <- ").replace(/@[^@]*?([^\/\.]+\.\w+:)/g, "@$1");
                return "JS Stack trace:\n ## " + result;
            }
            return "No traceback available";
        }
    };
