/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Logger"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://glaxebay/gsCommon.js");

/**
 * Main object for Ebay Companion Logger
 */
var Logger = {
  // Used as a constant to make code easier to read
  DUMP_STACK : true,
  // Glaxstar's common logger class
  _logger : null,

  /**
   * Initialises the object
   */
  init : function() {
    this._logger = GlaxEbay.getLogger("Logger");
    this._logger.trace("_init");
  },

  /**
   * Report a Javascript exception and produce a stack trace
   * @param exception The exception to report
   */
  exception : function(exception) {
    let logString = exception.message;

    // JS exceptions have stack, XPCOM exceptions have location
    if (exception.stack) {
      logString += "\n" + this._dumpJsStack(exception.stack);
    } else {
      logString += "\n" + this._dumpXpcomStack(exception.location);
    }

    this._logger.error(logString);
  },

  /**
   * Enter generic event in the log
   * @param message the message the user wishes to log
   * @param dumpStack A stack dump is produced if true
   * @param nonStandardStack If set, this stack is dumped instead
   */
  log : function(message, dumpStack, nonStandardStack) {
    let logString = message;

    if (dumpStack) {
      logString += "\n" +
        this._dumpXpcomStack(nonStandardStack ? nonStandardStack :
                                                Components.stack.caller);
    }

    this._logger.info(logString);
  },

  /**
   * Enter a warning in the log
   * @param message the message the user wishes to log
   * @param dumpStack A stack dump is produced if true
   * @param nonStandardStack If set, this stack is dumped instead
   */
  warning : function(message, dumpStack, nonStandardStack) {
    let logString = message;

    if (dumpStack) {
      logString += "\n" +
        this._dumpXpcomStack(nonStandardStack ? nonStandardStack :
                                                Components.stack.caller);
    }

    this._logger.warn(logString);
  },

  /**
   * Enter an error in the log
   * @param message the message the user wishes to log
   * @param dumpStack A stack dump is produced if true
   * @param nonStandardStack If set, this stack is dumped instead
   */
  error : function(message, dumpStack, nonStandardStack) {
    let logString = message;

    if (dumpStack) {
      logString += "\n" +
        this._dumpXpcomStack(nonStandardStack ? nonStandardStack :
                                                Components.stack.caller);
    }

    this._logger.error(logString);
  },

  /**
   * Strips the useless components of a file:// path so that we end up with a
   * more readable path
   * @param path A full file:// path
   * @returns path relative to the extension directory
   */
  _getRelativePath : function(path) {
    // might as well cache this value
    if (!this._baseStart) {
      try {
        let extensionId = "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
        let extensionPath = Cc["@mozilla.org/extensions/manager;1"].
                              getService(Ci.nsIExtensionManager).
                              getInstallLocation(extensionId).
                              getItemLocation(extensionId).path;
        // Add 8 to get rid of the "file:///" prefix
        this._baseStart = extensionPath.length + 8;
      }
      catch (e) {
        this.warning("Extension ID in Logger module is set incorrectly. " +
                     "Can't calculate relative paths for stack trace.");
        // Add 7 to get rid of the "file://" prefix, leaving one leading /
        this._baseStart = 7;
      }
    }

    return path.slice(this._baseStart);
  },

  /**
   * Dumps the provided JavaScript stack
   * @param stack
   */
  _dumpJsStack : function(stack) {
    let message = "--- JS Stack Trace:\n";

    let stackArray = stack.split("\n");
    stackArray.pop();  // the last element is empty
    for (let [, frame] in Iterator(stackArray)) {
      frame = frame.split("@");
      let context = frame[0];
      let filePath = unescape(frame[1]);
      // If the path uses the file:// protocol, strip that down to make it
      // more readable
      if (filePath.indexOf("file://") != -1) {
        filePath = this._getRelativePath(filePath);
      }
      message += "---   " + filePath + " " + context + "\n";
    }
    return message;
  },

  /**
   * Dumps the provided XPCOM stack
   * @param stack
   */
  _dumpXpcomStack : function(stack) {
    let message = "--- XPCOM Stack Trace:\n";

    let frame = stack;
    while (frame) {
      let filePath = unescape(frame.filename);
      // If the path uses the file:// protocol, strip that down to make it
      // more readable
      if (filePath.indexOf("file://") != -1) {
        filePath = this._getRelativePath(filePath);
      }
      message += "---   " + filePath + ":" + frame.lineNumber + "\n";
      frame = frame.caller;
    }
    return message;
  }
};

Logger.init();
