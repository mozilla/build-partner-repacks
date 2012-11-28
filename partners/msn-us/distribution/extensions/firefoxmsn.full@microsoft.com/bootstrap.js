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
 * The Original Code is Bing Search for Firefox.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Edward Lee <edilee@mozilla.com>
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

"use strict";
const global = this;

const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// Remember if we were just installed
let justInstalled = false;

// Remember if we're on Firefox or Fennec
let platform = Services.appinfo.name == "Firefox" ? "desktop" : "mobile";

// Add a default search engine and move it to the right place
function addSearchEngine() {
  // Hide any existing custom searches
  let origEngine = Services.search.getEngineByName(SEARCH_NAME);
  if (origEngine != null) {
    origEngine.hidden = true;
    unload(function() origEngine.hidden = false);
  }

  // Add the special search engine if necessary
  let engineName = SEARCH_NAME + " ";
  try {
    Services.search.addEngineWithDetails(engineName, SEARCH_ICON, "", "",
      "GET", SEARCH_URL);
  }
  catch(ex) {}

  // Get the just-added or existing engine
  let engine = Services.search.getEngineByName(engineName);
  if (engine == null)
    return;

  // Move it to the desired position
  Services.search.moveEngine(engine, SEARCH_POSITION);

  // Switch to the engine by default if it's first
  if (SEARCH_POSITION == 0 && justInstalled)
    Services.search.currentEngine = engine;

  // Clean up when disabling
  unload(function() Services.search.removeEngine(engine));
}

// Customize the default prefs
function setPref(pref, value) {
  let branch = Services.prefs.getBranch("");
  branch.setCharPref(pref, value);
}

// Make sure the window has an app tab set to MSN
function ensureMsnAppTab(window) {
  // Only bother if we were just installed and support app tabs
  if (!justInstalled || platform != "desktop")
    return;

  // Try again after a short delay if session store is initializing
  let {__SSi, __SS_restoreID, gBrowser, setTimeout} = window;
  if (__SSi == null || __SS_restoreID != null) {
    setTimeout(function() ensureMsnAppTab(window), 1000);
    return;
  }

  // Figure out if we already have a pinned MSN
  let msnTab = findOpenTab(gBrowser, function(tab, URI) {
    return tab.pinned && URI.host == "msn.com";
  });

  // Always remove the MSN tab when uninstalling
  unload(function() gBrowser.removeTab(msnTab));

  // No need to add!
  if (msnTab != null)
    return;

  // Add the tab and pin it as the last app tab
  msnTab = gBrowser.addTab(getMsnBase("", "apptab"));
  gBrowser.pinTab(msnTab);
}

// Open a new tab for the landing page and select it
function showLandingPage(window) {
  // Only bother if we were just installed and haven't shown yet
  if (!justInstalled || showLandingPage.shown)
    return;

  // Do the appropriate thing on each platform
  if (platform == "desktop") {
    // Try again after a short delay if session store is initializing
    let {__SSi, __SS_restoreID, gBrowser, setTimeout} = window;
    if (__SSi == null || __SS_restoreID != null) {
      setTimeout(function() showLandingPage(window), 1000);
      return;
    }

    // Figure out if we already have a landing page
    let landingTab = findOpenTab(gBrowser, function(tab, URI) {
      return URI.spec == LANDING_PAGE;
    });

    // Always remove the landing page when uninstalling
    unload(function() gBrowser.removeTab(landingTab));

    // Add the landing page if not open yet
    if (landingTab == null)
      landingTab = gBrowser.loadOneTab(LANDING_PAGE);

    // Make sure it's focused, unless the Firefox whatsnew is open
    let firstrunTab = findOpenTab(gbrowser, function(tab, URI) {
      return URI.spec == FIRST_RUN;
    });
    if (firstrunTab == null)
      gBrowser.selectedTab = landingTab;
  }
  else {
    let {BrowserUI} = window;
    let tab = BrowserUI.newTab(LANDING_PAGE);
    unload(function() BrowserUI.closeTab(tab));
  }

  // Only show the landing page once
  showLandingPage.shown = true;
}

/**

 * Handle the add-on being activated on install/enable
 */
function startup({id}, reason) AddonManager.getAddonByID(id, function(addon) {
  // Load various javascript includes for helper functions
  ["helper", "utils"].forEach(function(fileName) {
    let fileURI = addon.getResourceURI("scripts/" + fileName + ".js");
    Services.scriptloader.loadSubScript(fileURI.spec, global);
  });

  // Add custom search support to the browser
  addSearchEngine();

  // Change some prefs to custom search on install
  if (justInstalled) {
    setPref(PREF_KEYWORD, SEARCH_KEYWORD_URL);
    setPref(PREF_HOME, SEARCH_HOME_URL);
    setPref(PREF_HOME_RESET, SEARCH_HOME_URL);
  }

  // Add an MSN app tab
  watchWindows(ensureMsnAppTab);
  
  // Open the landing page
  watchWindows(showLandingPage);

  // We're no longer just installed after we get some windows loaded
  watchWindows(function(window) {
    if (justInstalled)
      window.setTimeout(function() justInstalled = false, 5000);
  });
})

/**
 * Handle the add-on being deactivated on uninstall/disable
 */
function shutdown(data, reason) {
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN)
    unload();
}

/**
 * Handle the add-on being installed
 */
function install(data, reason) {
  justInstalled = reason == ADDON_INSTALL;
}

/**
 * Handle the add-on being uninstalled
 */
function uninstall(data, reason) {}
