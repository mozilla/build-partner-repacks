/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["UninstallManager"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var UninstallManager = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/observers.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import("resource://ebaycompanion/helpers/storageHelper.js");
      Cu.import("resource://ebaycompanion/storage/objectsStorage.js");
      Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");
      Cu.import("resource://ebaycompanion/constants.js");
      Cu.import("resource://ebaycompanion/datasource.js");
      Cu.import("resource://ebaycompanion/apis/tradingApi.js");

      this._observers = new Observers;
      this._observers.
        add(let (that = this) function() that._uninit(),
            "quit-application-granted");

      // Keep track of whether or not the extension is marked for uninstallation
      this._observers.
        add(let (that = this) function(subject, topic, data) {
          subject.QueryInterface(Ci.nsIUpdateItem);
          if (subject.id == Constants.extensionId) {
            switch (data) {
              case "item-uninstalled":
                that._uninstall = true;
                break;

              case "item-cancel-action":
                that._uninstall = false;
                break;
            }
          }
        }, "em-action-requested");
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Uninitialisation
   */
  _uninit : function() {
    try {
      this._observers.removeAll();

      // if the extension is marked for uninstallation, perform cleanup
      if (this._uninstall) {
        this._reportUninstall();
        this.clearPersistantData();
        this._deleteShortcut();
      }
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Sends the API requets to report extension uninstall
   */
  _reportUninstall : function() {
    let activeAccount = Datasource.activeAccount();
    if (!activeAccount) {
      Logger.log("No user signed in, using the first local account to send " +
                 "the uninstall request");
      let localAccounts = ObjectsStorage.getAllAccounts();
      // the first local account (if any) will help us sending the uninstall
      // request
      if (localAccounts.length > 0) {
        activeAccount = localAccounts[0];
      }
    }
    // if we don't have an account at this point, we can't send the uninstall
    // API call because we don't have any eBayAuthToken to send with it.
    if (activeAccount) {
      let ebayAuthToken = activeAccount.get("token");
      let credentialsArray = { eBayAuthToken: ebayAuthToken };

      TradingApi.reportToolbarActivity(
        "Uninstall", credentialsArray,
        activeAccount.get("isSandboxAccount"), reportUninstallCallback);
    }

    let reportUninstallCallback =
      let (that = this) function(result) {
        try {
          if (result.error) {
            Logger.warning("Extension uninstall report reported errors");
          } else {
            Logger.log("Uninstall reported successfully");
          }
        }
        catch (e) {
          Logger.exception(e);
        }
      }
  },

  /**
   * Marks the extension for uninstallation and forces a browser restart
   */
  forceUninstall : function() {
    let extManager = Cc["@mozilla.org/extensions/manager;1"].
                       getService(Ci.nsIExtensionManager);
    extManager.uninstallItem(Constants.extensionId);

    // Return to the event loop before forcing an app restart.
    new Timer(function() {
      let appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].
                         getService(Ci.nsIAppStartup);
      appStartup.quit(appStartup.eForceQuit | appStartup.eRestart);
    }, 0);
  },

  /**
   * Ensures that the extension's data is cleared up as best as possible before
   * it's uninstalled.
   */
  clearPersistantData : function() {
    Constants.prefBranch.deleteBranch();
    try {
      StorageHelper.removeDatabase();
    }
    catch (e) {
      // This will happen if the database file couldn't be removed.
      ObjectsStorage.removeTables();
      PropertiesStorage.removeTables();
      StorageHelper.doStatement("VACUUM");
    }
  },

  /**
   * Deletes the shortcut in the desktop (if any)
   */
  _deleteShortcut : function() {
    let dirSvc =
      Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
    let desk = dirSvc.get("Desk", Ci.nsIFile);

    let shortcutName =
      Constants.stringBundle.getString(
        "extensions.{62760FD6-B943-48C9-AB09-F99C6FE96088}.name");

    switch (Constants.getOperatingSystem()) {
      case "MAC":
        desk.append(shortcutName + ".app");
        break;
      case "WINDOWS":
      case "VISTA":
        desk.append(shortcutName + ".lnk");
        break;
      case "LINUX":
        desk.append(shortcutName);
        break;
      default:
        break;
    }

    if (desk.exists()) {
      desk.remove(true);
    }
  }

};

UninstallManager._init();
