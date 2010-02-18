/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Appcoast.
 *
 * The Initial Developer of the Original Code is Appcoast.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Juan Manuel Rodriguez <juan@appcoast.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var EXPORTED_SYMBOLS = ["GlaxEbay"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://glaxebay/log4moz.js");

/**
 * GlaxEbay namespace. This is the root namespace for all our JCM objects.
 */
if ("undefined" == typeof(GlaxEbay)) {
  var GlaxEbay = {
    /* The FUEL Application object. */
    _application : null,
    /* Reference to the observer service. */
    _observerService : null,

    /**
     * Initializes the object and sets up logging for the whole extension.
     */
    _init : function() {
      Cu.import("resource://ebaycompanion/helpers/preferences.js");
      // The basic formatter will output lines like:
      // DATE/TIME  LoggerName LEVEL  (log message)
      let formatter = new Log4Moz.GlaxFormatter();
      let root = Log4Moz.repository.rootLogger;
      let logFile = this.getProfileDirectory();
      let app;

      logFile.append("ebayLog.txt");

      // Loggers are hierarchical, lowering this log level will affect all
      // output.
      root.level = Log4Moz.Level["All"];

      prefBranch = new Preferences("extensions.ebaycomp.common.");

      switch (prefBranch.get("logger.appender")) {
        case "rotating":
          // this appender will log to the file system.
          app = new Log4Moz.RotatingFileAppender(logFile, formatter);
          app.level = Log4Moz.Level["Error"];
          root.addAppender(app);
          break;
        case "console":
          // A console appender outputs to the JS Error Console.
          app = new Log4Moz.ConsoleAppender(formatter);
          app.level = Log4Moz.Level["All"];
          root.addAppender(app);
          break;
        case "dump":
        default:
          // A dump appender outputs to standard out.
          app = new Log4Moz.DumpAppender(formatter);
          app.level = Log4Moz.Level["All"];
          root.addAppender(app);
          break;
      }

      // get the observer service.
      this._observerService =
        Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
    },

    /**
     * Gets a logger repository from Log4Moz.
     * @param aName the name of the logger to create.
     * @param aLevel (optional) the logger level.
     * @return the generated logger.
     */
    getLogger : function(aName, aLevel) {
      let logger = Log4Moz.repository.getLogger(aName);

      logger.level = Log4Moz.Level[(aLevel ? aLevel : "All")];

      return logger;
    },

    /* The FUEL Application object. */
    get Application() {
      // use lazy initialization because the FUEL object is only available for
      // Firefox and won't work on XUL Runner builds.
      if (null == this._application) {
        try {
          this._application =
            Cc["@mozilla.org/fuel/application;1"].
              getService(Ci.fuelIApplication);
        } catch (e) {
          throw "The FUEL application object is not available.";
        }
      }

      return this._application;
    },

    /* The observer service. */
    get ObserverService() { return this._observerService; },

    /**
     * Gets a reference to the directory where the extension will keep its
     * files. The directory is created if it doesn't exist.
     * @return reference (nsIFile) to the extension directory.
     */
    getProfileDirectory : function() {
      // XXX: there's no logging here because the logger initialization depends
      // on this method.

      let directoryService =
        Cc["@mozilla.org/file/directory_service;1"].
          getService(Ci.nsIProperties);
      let profDir = directoryService.get("ProfD", Ci.nsIFile);

      profDir.append("eBay Inc");

      if (!profDir.exists() || !profDir.isDirectory()) {
        // read and write permissions to owner and group, read-only for others.
        profDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
      }

      return profDir;
    }
  };

  /**
   * Constructor.
   */
  (function() {
    this._init();
  }).apply(GlaxEbay);
}
