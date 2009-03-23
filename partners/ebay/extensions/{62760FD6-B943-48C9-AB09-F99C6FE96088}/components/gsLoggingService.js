/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CLASS_ID = Components.ID("{994BD072-FECB-4748-9500-8A3ED8EBA1EC}");
const CLASS_NAME = "Logging Service";
const CONTRACT_ID = "@glaxstar.org/autotrader/log-service;1";

const AUTOTRADER_UUID = "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
const PREFERENCE_LOGLEVEL = "extensions.ebaycomp.logger.level";
const PREFERENCE_APPENDER = "extensions.ebaycomp.logger.appender";
const PREFERENCE_FILE_MAXSIZE = "extensions.ebaycomp.logger.file.maxSize";
const PREFERENCE_FILE_MAXFILES = "extensions.ebaycomp.logger.file.maxFiles";
const PREFERENCE_FILE_LASTBACKUP =
  "extensions.ebaycomp.logger.file.lastBackup";

const DEFAULT_FILE_MAXSIZE = 10;
const DEFAULT_FILE_MAXFILES = 10;
const DEFAULT_FILE_LASTBACKUP = 0;

const LOG_DIRECTORY = "eBayComp";
const LOG_FILE = "log";
const LOG_FILE_PLAIN_EXTENSION = "txt";
const LOG_FILE_HTML_EXTENSION = "dat";
const LOG_FILE_HTML_CSS = "logStyle.css";
const LOG_FILE_HTML_VIEWER = "logViewer.html";

/**
 * Logging Service.
 * Logs messages of various levels, through different output methods.
 */
var LoggingService = {
  /* Current log level */
  _logLevel : null,
  /* Current type of appender */
  _appenderType : null,
  /* Cached preferences service */
  _prefService : null,
  /* Cached file service */
  _fileService : null,

  /**
   * Initialize the component.
   */
  init : function() {
    //dump("LoggingService.init().\n");
    var file;

    this._prefService =
      Components.classes["@mozilla.org/preferences-service;1"].
        getService(CI.nsIPrefBranch2);
    this._fileService =
      Components.classes["@mozilla.org/file/directory_service;1"].
        getService(CI.nsIProperties);

    this._prefService.
      addObserver(PREFERENCE_LOGLEVEL, logPreferencesObserver, false);
    this._prefService.
      addObserver(PREFERENCE_APPENDER, logPreferencesObserver, false);

    // Initiliaze logging options
    try {
      this._logLevel = this._prefService.getIntPref(PREFERENCE_LOGLEVEL);
      this._appenderType = this._prefService.getCharPref(PREFERENCE_APPENDER);
    } catch (e) {
      this._prefService.
        setIntPref(PREFERENCE_LOGLEVEL, CI.gsILoggingService.LEVEL_WARN);
      this._prefService.
        setCharPref(PREFERENCE_APPENDER, this.APPENDER_FILE_PLAIN);
      this._logLevel = CI.gsILoggingService.LEVEL_WARN;
      this._appenderType = this.APPENDER_FILE_PLAIN;
    }

    try {
      // Copy LogViewer file from defaults dir
      file = this._getFileReference(LOG_FILE_HTML_VIEWER);

      if (!file.exists()) {
        this._copyFileFromDefaultDir(LOG_FILE_HTML_VIEWER, file);
      }
      // Copy logStyle file from defaults dir
      file = this._getFileReference(LOG_FILE_HTML_CSS);

      if (!file.exists()) {
        this._copyFileFromDefaultDir(LOG_FILE_HTML_CSS, file);
      }
    } catch (e) {
      //dump("LoggingService.Warning: " +
      //  "The logViewer and logStyle files were not copied\n");
    }
  },

  /**
   * Attempts to log a message in FATAL level
   * @param aMessage The message to log
   */
  fatal : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_FATAL);
  },

  /**
   * Attempts to log a message in ERROR level
   * @param aMessage The message to log
   */
  error : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_ERROR);
  },

  /**
   * Attempts to log a message in WARN level
   * @param aMessage The message to log
   */
  warn : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_WARN);
  },

  /**
   * Attempts to log a message in INFO level
   * @param aMessage The message to log
   */
  info : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_INFO);
  },

  /**
   * Attempts to log a message in DEBUG level
   * @param aMessage The message to log
   */
  debug : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_DEBUG);
  },

  /**
   * Attempts to log a message in TRACE level
   * @param aMessage The message to log
   */
  trace : function(aMessage) {
    this._logMessage(aMessage, CI.gsILoggingService.LEVEL_TRACE);
  },

  /**
   * Attempts to log a message in the specified level
   * @param aMessage The message to log
   * @param aLevel The level of the message
   * @returns Boolean, whether the message was logged
   */
  _logMessage : function(aMessage, aLevel) {
    var wasLogged = false;
    var logEntry;

    logEntry = this._buildLogEntry(aMessage, aLevel);

    // If the level is WARN or more, output to console regardless of log level
    //   settings.  Obviously we don't bother if the log is already going to
    //   console.
    if (aLevel <= CI.gsILoggingService.LEVEL_WARN &&
        this._appenderType != this.APPENDER_CONSOLE_PLAIN) {
      dump(logEntry + "\n");
    }

    // if the importance level for this entry is great enough, log it
    if (this._logLevel >= aLevel) {
      this._dumpLogEntry(logEntry);
      wasLogged = true;
    }

    return wasLogged;
  },

  /**
   * Builds a log entry from the specified message and level
   * @param aMessage The message to log
   * @param aLevel The level of the message
   * @returns A log entry in the appender type format
   */
  _buildLogEntry : function(aMessage, aLevel) {
    var str = "";
    var levelString = this._levelToString(aLevel);

    if (this._appenderType == this.APPENDER_FILE_HTML) {
      var message = this._trim(aMessage).replace(/\n/g, "<br/>");

      str += "document.write('<tr class=\"level-";
      str += this._trim(levelString) + '\">';
      str += '<td>' + new Date().toUTCString() + '</td>';
      str += '<td><strong>' + this._trim(levelString) + '</strong></td>';
      str += '<td>' + message + '</td>';
      str += "</tr>');";
    } else {
      str += "[" + new Date().toUTCString() + "]";
      str += " " + levelString;
      str += " " + this._trim(aMessage);
    }

    return str;
  },

  /**
   * Dumps a log entry depending of the current appender type
   * @param aEntry The log entry to be dumped
   * @returns Boolean, whether the log entry was succesfully dumped
   */
  _dumpLogEntry : function(aEntry) {
    try {
      if (this._appenderType == this.APPENDER_CONSOLE_PLAIN) {
        dump(aEntry + "\n");
      } else {
        var foStream =
          Components.classes["@mozilla.org/network/file-output-stream;1"].
            createInstance(CI.nsIFileOutputStream);
        var file = this._getLogFileReference();

        aEntry += "\r\n";
        // write, append, append
        foStream.init(file, 0x02 | 0x08 | 0x10, 0664, 0);
        foStream.write(aEntry, aEntry.length);
        foStream.close();
      }

      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Gets a reference to the log file, depending on preferences
   * @returns The reference to the log file
   */
  _getLogFileReference : function() {
    var file =
      this._getFileReference(LOG_FILE + "." + this._getFileExtension());
    var maxSize = this._getMaxFileSize();

    if (file.exists() && file.fileSize >= maxSize) {
      this._backupLogFile();
    }

    return file;
  },

  /**
   * Backups the current log file in the log directory with a new number
   * If a backup file with the designated number already exists it is replaced
   */
  _backupLogFile : function() {
    if (this._getMaxFiles() <= 0) {
      return;
    }

    var nextNumber = this._getNextBackupNumber();
    var logFileName =
      LOG_FILE + "." + this._getFileExtension();
    var bakFileName =
      LOG_FILE + "." + nextNumber + "." + this._getFileExtension();

    var logFile = this._getFileReference(logFileName);
    var bakFile;

    if (logFile.exists()) {
      // Remove file/plain backup file
      bakFile =
        this._getFileReference(
          LOG_FILE + "." + nextNumber + "." + LOG_FILE_PLAIN_EXTENSION);
      if (bakFile.exists()) {
        bakFile.remove(false);
      }
      // Remove html backup file
      bakFile =
        this._getFileReference(
          LOG_FILE + "." + nextNumber + "." + LOG_FILE_HTML_EXTENSION);

      if (bakFile.exists()) {
        bakFile.remove(false);
      }

      logFile.moveTo(null, bakFileName);
    }
  },

  /**
   * Gets a reference to a specified file in the log directory
   * @param aFileName The name of the file to get
   * @returns A nsIFile object
   */
  _getFileReference : function(aFileName) {
    var file = this._fileService.get("ProfD", Components.interfaces.nsIFile);

    file.append(LOG_DIRECTORY);

    if (!file.exists() || !file.isDirectory()) {
      file.create(CI.nsIFile.DIRECTORY_TYPE, 0774);
    }

    file.append(aFileName);

    return file;
  },

  /**
   * Converts a log level to its string representation
   * @param aLevel The level to be converted
   * @returns The log level converted to string
   */
  _levelToString : function(aLevel) {
    var levelStr = "";

    switch (aLevel) {
      case CI.gsILoggingService.LEVEL_FATAL:
        levelStr = "FATAL";
        break;
      case CI.gsILoggingService.LEVEL_ERROR:
        levelStr = "ERROR";
        break;
      case CI.gsILoggingService.LEVEL_WARN:
        levelStr = "WARN ";
        break;
      case CI.gsILoggingService.LEVEL_INFO:
        levelStr = "INFO ";
        break;
      case CI.gsILoggingService.LEVEL_DEBUG:
        levelStr = "DEBUG";
        break;
      case CI.gsILoggingService.LEVEL_TRACE:
        levelStr = "TRACE";
        break;
    }

    return levelStr;
  },

  /**
   * Gets the file extension for the current appender type
   * @returns The file extension string
   */
  _getFileExtension : function() {
    var extension = "";

    switch (this._appenderType) {
      case this.APPENDER_FILE_PLAIN:
        extension = LOG_FILE_PLAIN_EXTENSION;
        break;
      case this.APPENDER_FILE_HTML:
        extension = LOG_FILE_HTML_EXTENSION;
        break;
    }

    return extension;
  },

  /**
   * Obtains the max file size preference value
   * @returns The max file size allowed in bytes
   */
  _getMaxFileSize : function() {
    try {
      var maxFileSize =
        this._prefService.getIntPref(PREFERENCE_FILE_MAXSIZE) * 1024;

      return ((maxFileSize > 0) ? maxFileSize : DEFAULT_FILE_MAXSIZE * 1024);
    } catch (e) {
      this._prefService.
        setIntPref(PREFERENCE_FILE_MAXSIZE, DEFAULT_FILE_MAXSIZE);

      return (DEFAULT_FILE_MAXSIZE * 1024);
    }
  },

  /**
   * Obtains the max files preference value
   * @returns The value of the preference
   */
  _getMaxFiles : function() {
    try {
      var maxFiles = this._prefService.getIntPref(PREFERENCE_FILE_MAXFILES);

      return (maxFiles >= 0) ? maxFiles : DEFAULT_FILE_MAXFILES;
    } catch (e) {
      this._prefService.
        setIntPref(PREFERENCE_FILE_MAXFILES, DEFAULT_FILE_MAXFILES);

      return DEFAULT_FILE_MAXFILES;
    }
  },

  /**
   * Obtains the number of the next backup file
   * @returns The number of the next backup file
   */
  _getNextBackupNumber : function() {
    var logNumber;
    var maxFiles = this._getMaxFiles();

    try {
      logNumber = this._prefService.getIntPref(PREFERENCE_FILE_LASTBACKUP);
      logNumber = (logNumber % maxFiles) + 1;
    } catch (e) {
      logNumber = 1;
    }

    this._prefService.setIntPref(PREFERENCE_FILE_LASTBACKUP, logNumber);

    return logNumber;
  },

  /**
   * Copy a file identified by aFileName from the defaults directory
   * to a location in the filesystem identified by a aDestination.
   * @param aFileName the name of the file to copy.
   * @param aDestination the nsIFile where the file should be copied.
   */
  _copyFileFromDefaultDir : function (aFileName, aDestination) {
    try {
      var file =
        Components.classes["@mozilla.org/extensions/manager;1"].
          getService(Components.interfaces.nsIExtensionManager).
          getInstallLocation(AUTOTRADER_UUID).
          getItemLocation(AUTOTRADER_UUID);

      file.append("defaults");
      file.append(aFileName);
      file.copyTo(aDestination.parent, aDestination.leafName);
    } catch(e) {
      //dump("An error occurred trying to copy a file from the defaults dir. " +
      //     "File name:'" + aFileName + "'.\n[" + e.name + "] " + e.message);
    }
  },

  /**
   * Removes blank spaces at the beginning and at the end of a string
   * @param aString The string to be trimmed
   * @returns The trimmed string
   */
  _trim : function(aString) {
    // Method borrowed from http://www.pbdr.com/jscript/trimstr.htm
    aString = aString.replace( /^\s+/g, "" );// strip leading
    return aString.replace( /\s+$/g, "" );// strip trailing
  },

  /**
   * Getter of the current log level
   * @returns The current log level
   */
  get logLevel() {
    return this._logLevel;
  },

  /**
   * Setter of the log level
   * @param aLogLevel The log level to be set
   * @throws NS_ERROR_INVALID_ARG when the aLogLevel is null or not recognized
   */
  set logLevel(aLogLevel) {
    if (!aLogLevel || !(
        aLogLevel == CI.gsILoggingService.LEVEL_OFF ||
        aLogLevel == CI.gsILoggingService.LEVEL_FATAL ||
        aLogLevel == CI.gsILoggingService.LEVEL_ERROR ||
        aLogLevel == CI.gsILoggingService.LEVEL_WARN ||
        aLogLevel == CI.gsILoggingService.LEVEL_DEBUG ||
        aLogLevel == CI.gsILoggingService.LEVEL_INFO ||
        aLogLevel == CI.gsILoggingService.LEVEL_TRACE)) {
      //dump("LoggingService.set logLevel called with invalid argument\n");
      throw CR.NS_ERROR_INVALID_ARG;
    }

    this._prefService.setIntPref(PREFERENCE_LOGLEVEL, aLogLevel);
  },

  /**
   * Getter of the current appender type
   * @returns The current appender type
   */
  get appenderType() {
    return this._appenderType;
  },

  /**
   * Setter of the apender type
   * @param aAppenderType The appender type to be set
   * @throws NS_ERROR_INVALID_ARG when the aAppenderType is not recognized
   */
  set appenderType(aAppenderType) {
    if (!aApenderType || !(
        aApenderType == this.APPENDER_FILE_PLAIN ||
        aApenderType == this.APPENDER_FILE_HTML ||
        aApenderType == this.APPENDER_CONSOLE_PLAIN)) {
      //dump("LoggingService.set appenderType called with invalid argument\n");
      throw CR.NS_ERROR_INVALID_ARG;
    }

    this._prefService.setCharPref(PREFERENCE_LOGLEVEL, aAppenderType);
  },

  /**
   * Getter of the APPENDER_CONSOLE_PLAIN constant
   * @returns The APPENDER_CONSOLE_PLAIN constant
   */
  get APPENDER_CONSOLE_PLAIN() {
    return "console/plain";
  },

  /**
   * Getter of the APPENDER_FILE_PLAIN constant
   * @returns The APPENDER_FILE_PLAIN constant
   */
  get APPENDER_FILE_PLAIN() {
    return "file/plain";
  },

  /**
   * Getter of the APPENDER_FILE_HTML constant
   * @returns The APPENDER_FILE_HTML constant
   */
  get APPENDER_FILE_HTML() {
    return "file/html";
  },

  /**
   * Updates the value of the logLevel property
   * @param aLogLevel The log level to be set
   */
  updateLogLevel : function(aValue) {
    this._logLevel = aValue;
  },

  /**
   * Updates the value of the appenderType property
   * @param aLogLevel The appenderType to be set
   */
  updateAppenderType : function(aValue) {
    this._appenderType = aValue;
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsILoggingService) &&
        !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
};

/**
 * This object observes for any changes in the preferences in order to keep
 * the logging service updated.
 */
var logPreferencesObserver = {
  observe: function(subject, topic, data) {
    var value = null;
    var prefService =
      Components.classes["@mozilla.org/preferences-service;1"].
        getService(CI.nsIPrefBranch);

    if (String(data) == PREFERENCE_LOGLEVEL) {
      value = prefService.getIntPref(PREFERENCE_LOGLEVEL);
      LoggingService.updateLogLevel(value);
    } else if (String(data) == PREFERENCE_APPENDER) {
      value = prefService.getCharPref(PREFERENCE_APPENDER);
      LoggingService.updateAppenderType(value);
    }
  }
};


/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var LoggingServiceFactory = {
  /* single instance of the component. */
  _singletonObj: null,

  /**
   * Creates an instance of the class associated with this factory.
   * @param aOuter pointer to a component that wishes to be aggregated in the
   * resulting instance. This can be nsnull if no aggregation is requested.
   * @param aIID the interface type to be returned.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NO_AGGREGATION if aOuter is not null. This component
   * doesn't support aggregation.
   */
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw CR.NS_ERROR_NO_AGGREGATION;
    }
    // in this case we need a unique instance of the service.
    if (!this._singletonObj) {
      this._singletonObj = LoggingService;
      LoggingService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var LoggingServiceModule = {
  /**
   * When the nsIModule is discovered, this method will be called so that any
   * setup registration can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   * @param aType loader type being used to load this module.
   */
  registerSelf : function(aCompMgr, aLocation, aLoaderStr, aType) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      CLASS_ID, CLASS_NAME, CONTRACT_ID, aLocation, aLoaderStr, aType);
  },

  /**
   * When the nsIModule is being unregistered, this method will be called so
   * that any cleanup can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   */
  unregisterSelf : function (aCompMgr, aLocation, aLoaderStr) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  },

  /**
   * This method returns a class object for a given ClassID and IID.
   * @param aCompMgr the global component manager.
   * @param aClass the ClassID of the object instance requested.
   * @param aIID the IID of the object instance requested.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NOT_IMPLEMENTED if aIID is inadequate.
   * @throws NS_ERROR_NO_INTERFACE if the interface is not found.
   */
  getClassObject : function(aCompMgr, aClass, aIID) {
    if (!aIID.equals(CI.nsIFactory)) {
      throw CR.NS_ERROR_NOT_IMPLEMENTED;
    }

    if (aClass.equals(CLASS_ID)) {
      return LoggingServiceFactory;
    }

    throw CR.NS_ERROR_NO_INTERFACE;
  },

  /**
   * This method may be queried to determine whether or not the component
   * module can be unloaded by XPCOM.
   * @param aCompMgr the global component manager.
   * @return true if the module can be unloaded by XPCOM. false otherwise.
   */
  canUnload: function(aCompMgr) {
    return true;
  }
};

/**
 * Initial entry point.
 * @param aCompMgr the global component manager.
 * @param aFileSpec component file.
 * @return the module for the service.
 */
function NSGetModule(aCompMgr, aFileSpec) {
  return LoggingServiceModule;
}
