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
 * The Original Code is BRIKS, Brian King s.p.
 *
 * The Initial Developer of the Original Code is
 * Brian King <brian@mozdev.org>.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * David McNamara <dave@33eels.com>
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

 /*
 * Constants
 */
const LOCATION_CONTRACTID = '@mozilla.com/fotofox/utilities;1';
const LOCATION_CID = Components.ID('{dd28dea6-f3c3-4af7-9ddc-46be9273f946}');
const LOCATION_IID = Components.interfaces.fotofoxIUtilities;

var gEmGUID;
var gUninstallObserverInited = false;

/* Remove user set Fotofox prefs on uninstall
   XXXBrian : We should make it more general and delete the thumbs RDF file also */
function cleanupPrefs()
{
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].
          getService(Components.interfaces.nsIPrefBranch);
  var brandBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                           .getService(Components.interfaces.nsIStringBundleService);
  try {
    brandBundle = brandBundle.createBundle("chrome://fotofox/content/brand.properties");
    var prefRoot = brandBundle.GetStringFromName("prefs.root");

    if (prefRoot == "extensions.fotofox.")
      prefs.deleteBranch("extensions.fotofox");
    else
      prefs.deleteBranch("extensions.kodakcompanion");
  }
  catch(e) {}
}

/*
 * Class definitions
 */

/* The fotofoxUtilities class constructor. */
function fotofoxUtilities() {
  this.wrappedJSObject = this;
  var brandBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                           .getService(Components.interfaces.nsIStringBundleService);
  brandBundle = brandBundle.createBundle("chrome://fotofox/content/brand.properties");
  this.gPrefRoot = brandBundle.GetStringFromName("prefs.root");
  var prefSvc = Components.classes["@mozilla.org/preferences-service;1"].
                      getService(Components.interfaces.nsIPrefService);
  this.gPrefs = prefSvc.getBranch(this.gPrefRoot);
  if (this.gPrefRoot == "extensions.fotofox.")
    gEmGUID = "fotofox@mozilla.com";
  else
    gEmGUID = "kodak-companion@mozilla.com";
}

/* the fotofoxUtilities class def */
fotofoxUtilities.prototype= {
    wrappedJSObject : null,
    gPrefRoot : "",
    gPrefs : null,

    /* This function returns the folder on disk where the Fotofox extension is installed */
    getLocation: function() {
      try {
        // Mozilla 1.8 and greater
        var extdir = __LOCATION__.parent.parent;
        return extdir;
      }
      catch (ex) {
        return this.getExtDefaultPath();
      }
    },

    /* This function returns the user profile folder */
    getProfileFolder: function() {
      var p;
      var NSIFILE = Components.interfaces.nsIFile;
      var dirLocator = Components.classes["@mozilla.org/file/directory_service;1"]
              .getService(Components.interfaces.nsIProperties);
      p = dirLocator.get("ProfD", NSIFILE).path;
      var dirLocal = Components.classes["@mozilla.org/file/local;1"]
                               .createInstance(Components.interfaces.nsILocalFile);
      dirLocal.initWithPath(p);
      if (dirLocal.exists() && dirLocal.isDirectory())  {
        return dirLocal;
      }
      return null;
    },

    getExtDefaultPath: function() {
      var p;
      var NSIFILE = Components.interfaces.nsIFile;
      var dirLocator = Components.classes["@mozilla.org/file/directory_service;1"]
              .getService(Components.interfaces.nsIProperties);
      p = dirLocator.get("ProfD", NSIFILE).path;
      var dirLocal = Components.classes["@mozilla.org/file/local;1"]
                               .createInstance(Components.interfaces.nsILocalFile);
      dirLocal.initWithPath(p);
      dirLocal.append("extensions");
      dirLocal.append("{"+this.gEmGUID+"}");
      if (dirLocal.exists() && dirLocal.isDirectory())  {
        return dirLocal;
      }
      return null;
    },

    /*QueryInterface: function(iid) {
        if (!iid.equals(Components.interfaces.nsISupports) &&
            !iid.equals(LOCATION_IID))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    },*/

    QueryInterface : function (iid)
    {
      if (iid.equals(Components.interfaces.nsISupports) || iid.equals(Components.interfaces.nsIObserver))
        return this;

      throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    startUninstallObserver : function ()
    {
      if (gUninstallObserverInited) return;

      var extService = Components.classes["@mozilla.org/extensions/manager;1"].
                         getService(Components.interfaces.nsIExtensionManager);
      if (extService && ("uninstallItem" in extService)) {
        var observerService = Components.classes["@mozilla.org/observer-service;1"].
                                getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this.addonsAction, "em-action-requested", false);
        gUninstallObserverInited = true;
      } else {
        try {
          extService.datasource.AddObserver(this.addonsObserver);
          gUninstallObserverInited = true;
        } catch (e) { }
      }
    },

    addonsObserver :
    {
      onAssert : function (ds, subject, predicate, target)
      {
        if ((subject.Value == "urn:mozilla:extension:" + gEmGUID)
            &&
            (predicate.Value == "http://www.mozilla.org/2004/em-rdf#toBeUninstalled")
            &&
            (target instanceof Components.interfaces.nsIRDFLiteral)
            &&
            (target.Value == "true"))
        {
          cleanupPrefs();
        }
      },

      onUnassert : function (ds, subject, predicate, target) {},
      onChange : function (ds, subject, predicate, oldtarget, newtarget) {},
      onMove : function (ds, oldsubject, newsubject, predicate, target) {},
      onBeginUpdateBatch : function() {},
      onEndUpdateBatch : function() {}
    },

    addonsAction :
    {
      observe : function (subject, topic, data)
      {
        if ((data == "item-uninstalled") &&
            (subject instanceof Components.interfaces.nsIUpdateItem) &&
            (subject.id == gEmGUID))
        {
          cleanupPrefs();
        }
      }
    },

    /* nsIObserver */
    observe : function (subject, topic, data)  { }

};

/*
 * Objects
 */

/* fotofoxUtilities Module (for XPCOM registration) */
var fotofoxUtilitiesModule = {
    registerSelf: function(compMgr, fileSpec, location, type) {
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.registerFactoryLocation(LOCATION_CID,
                                        "fotofoxUtilities JS component",
                                        LOCATION_CONTRACTID,
                                        fileSpec,
                                        location,
                                        type);
    },

    getClassObject: function(compMgr, cid, iid) {
        if (!cid.equals(LOCATION_CID))
            throw Components.results.NS_ERROR_NO_INTERFACE;

        if (!iid.equals(Components.interfaces.nsIFactory))
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

        return fotofoxUtilitiesFactory;
    },

    canUnload: function(compMgr) { return true; }
};

/* fotofoxUtilities Class Factory */
var fotofoxUtilitiesFactory = {
    createInstance: function(outer, iid) {
        if (outer != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;

        if (!iid.equals(LOCATION_IID) &&
            !iid.equals(Components.interfaces.nsISupports))
            throw Components.results.NS_ERROR_INVALID_ARG;

        return new fotofoxUtilities();
    }
}

/*
 * Functions
 */

/* module initialisation */
function NSGetModule(comMgr, fileSpec) { return fotofoxUtilitiesModule; }
