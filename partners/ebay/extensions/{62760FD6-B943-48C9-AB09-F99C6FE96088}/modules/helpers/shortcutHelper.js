/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
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
 * The Original Code is WebRunner.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mark Finkle <mark.finkle@gmail.com>, <mfinkle@mozilla.com>
 *   Cesar Oliveira <a.sacred.line@gmail.com>
 *   Matthew Gertner <matthew@allpeers.com>
 *   Juan Manuel Rodriguez <juan@glaxstar.com>
 *
 * ***** END LICENSE BLOCK ***** */
EXPORTED_SYMBOLS = ["ShortcutHelper"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

const PR_WRONLY = 0x02;
const PR_CREATE_FILE = 0x08;
const PR_TRUNCATE = 0x20;

const PR_PERMS_FILE = 0644;
const PR_PERMS_DIRECTORY = 0755;

var ShortcutHelper = {

  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/timer.js");
      Cu.import("resource://ebaycompanion/constants.js");

    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Creates a shortcut in the desktop that opens firefox
   */
  createShortcut : function() {
    const MAC_ICNS_FILE = "defaults/ebay.icns";
    const WIN_ICO_FILE = "defaults/ebay.ico";
    let dirSvc =
      Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);

    // Locate the executable of firefox
    let target = dirSvc.get("XREExeF", Ci.nsIFile);
    // these lines were commented because if Firefox is not completely closed
    // (i.e. you leave the add-ons dialog opened), and you use the desktop
    // shortcut to open a new window, it will use de profile parameter as if
    // it were a url for the browser to open, which is NOT correct.
    /*let profService =
      Cc["@mozilla.org/toolkit/profile-service;1"].
        getService(Ci.nsIToolkitProfileService);
    let currentProfile = profService.selectedProfile;
    let profileName = currentProfile.name;*/
    let parameters = "-ebayComp";
    /*if (profileName != "default") {
      parameters += " -p " + profileName;
    }*/

    /* Check to see if were pointing to a binary (eg. firefox-bin).
     * We always want to point to firefox rather than firefox-bin,
     * because firefox will set up the library paths
     */
    if (target.leafName.search("-bin") != -1) {
      let target_shell = target.parent;
      target_shell.append(target.leafName.replace("-bin", ""));
      if (target_shell.exists()) {
        target = target_shell;
      }
    }

    let name =
      Constants.stringBundle.getString(
        "extensions.{62760FD6-B943-48C9-AB09-F99C6FE96088}.name");
    let desk = dirSvc.get("Desk", Ci.nsIFile);
    let appIcon;
    let extensionLocation =
      Cc["@mozilla.org/extensions/manager;1"].
        getService(Ci.nsIExtensionManager).
          getInstallLocation(Constants.extensionId);

    switch (Constants.getOperatingSystem()) {
      /* Commented code for mac since we currently only have interest in
        windows
       case "MAC":
        // yes, we have to pass Constants.extensionId again... weird. See
        // http://www.xulplanet.com/references/xpcomref/ifaces/nsIInstallLocation.html
        // for further documentation
        appIcon =
          extensionLocation.getItemFile(Constants.extensionId, MAC_ICNS_FILE);
        this._createBundle(target, name, appIcon, desk, parameters);
        break;*/
      case "WINDOWS":
      case "VISTA":
        // yes, we have to pass Constants.extensionId again... weird. See
        // http://www.xulplanet.com/references/xpcomref/ifaces/nsIInstallLocation.html
        // for further documentation
        appIcon =
          extensionLocation.getItemFile(Constants.extensionId, WIN_ICO_FILE);
        let destination = desk.clone();
        destination.append(name + ".lnk");
        if (destination.exists())
          destination.remove(true);
        let shortcutMaker =
           Cc["@glaxstar.org/ebaycompanion/ebay-shortcut-maker;1"].
              getService(Ci.ecIEbayShortcutMaker);
        shortcutMaker.createShortcut(
          destination.path, target.path, name, appIcon.path, parameters);
        break;
      /* Commented code for linux since we currently only have interest in
        windows
      case "LINUX":
        this._createLinuxShortcut(target, name, desk, parameters);
        break;*/
      default:
        break;
    }
  },

  /**
   * Creates the shortcut bundle that opens firefox on mac OS X
   * @param aTarget the target application to be run
   * @param aName the shortcut name
   * @param aIcon the icon to be used
   * @param aLocation the directory where the shortcut will be created
   * @param aParameters a string with the parameters to be added to the shortcut
   * target
   * @return the created bundle
   */
  _createBundle : function(aTarget, aName, aIcon, aLocation, aParameters) {
    let contents =
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
    "<!DOCTYPE plist PUBLIC \"-//Apple Computer//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" +
    "<plist version=\"1.0\">\n" +
    "<dict>\n" +
    "<key>CFBundleExecutable</key>\n" +
    "<string>" + aName + "</string>\n" +
    "<key>CFBundleIconFile</key>\n" +
    "<string>" + aIcon.leafName + "</string>\n" +
    "</dict>\n" +
    "</plist>";

    aLocation.append(aName + ".app");
    if (aLocation.exists())
      aLocation.remove(true);
    aLocation.create(Ci.nsIFile.DIRECTORY_TYPE, PR_PERMS_DIRECTORY);

    let bundle = aLocation.clone();

    aLocation.append("Contents");
    aLocation.create(Ci.nsIFile.DIRECTORY_TYPE, PR_PERMS_DIRECTORY);

    let info = aLocation.clone();
    info.append("Info.plist");
    FileIO.stringToFile(contents, info);

    let resources = aLocation.clone();
    resources.append("Resources");
    resources.create(Ci.nsIFile.DIRECTORY_TYPE, PR_PERMS_DIRECTORY);
    aIcon.copyTo(resources, aIcon.leafName);

    let macos = aLocation.clone();
    macos.append("MacOS");
    macos.create(Ci.nsIFile.DIRECTORY_TYPE, PR_PERMS_DIRECTORY);

    let cmd = "#!/bin/sh\nexec \"" + aTarget.path + "\" " + aParameters;
    let script = macos.clone();
    script.append(aName);
    FileIO.stringToFile(cmd, script, 0755);

    return bundle;
  },

  /**
   * Creates the shortcut bundle that opens firefox on Linux
   * @param aTarget the target application to be run
   * @param aName the shortcut name
   * @param aLocation the directory where the shortcut will be created
   * @param aParameters a string with the parameters to be added to the shortcut
   * target
   */
  _createLinuxShortcut : function (aTarget, aName, aLocation, aParameters) {
    let cmd = "#!/bin/sh\nexec \"" + aTarget.path + "\" " + aParameters;
    let script = aLocation.clone();
    script.append(aName);
    FileIO.stringToFile(cmd, script, 0755);
  }

};

var FileIO = {
  // Returns the text content of a given nsIFile
  fileToString : function(file) {
    let data = "";
    try {
      // Get a nsIFileInputStream for the file
      let fis =
        Cc["@mozilla.org/network/file-input-stream;1"].
          createInstance(Ci.nsIFileInputStream);
      fis.init(file, -1, 0, 0);

      // Get an intl-aware nsIConverterInputStream for the file
      let is =
        Cc["@mozilla.org/intl/converter-input-stream;1"].
          createInstance(Ci.nsIConverterInputStream);
      is.init(
        fis,
        "UTF-8",
        1024,
        Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

      // Read the file into string via buffer
      let buffer = {};
      while (is.readString(4096, buffer) != 0) {
        data += buffer.value;
      }

      // Clean up
      is.close();
      fis.close();


    } catch (e) {
      Logger.exception(e);
    }
    return data;
  },

  // Saves the given text string to the given nsIFile
  stringToFile : function(data, file) {
    try {
      // Get a nsIFileOutputStream for the file
      let fos =
        Cc["@mozilla.org/network/file-output-stream;1"].
          createInstance(Ci.nsIFileOutputStream);
      fos.init(
        file,
        PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE,
        (arguments.length == 3 ? arguments[2] : PR_PERMS_FILE),
        0);

      // Get an intl-aware nsIConverterOutputStream for the file
      let os =
        Cc["@mozilla.org/intl/converter-output-stream;1"].
          createInstance(Ci.nsIConverterOutputStream);
      os.init(fos, "UTF-8", 0, 0x0000);

      // Write data to the file
      os.writeString(data);

      // Clean up
      os.close();
      fos.close();
    } catch (e) {
      Logger.exception(e);
    }
  }
};

ShortcutHelper._init();
