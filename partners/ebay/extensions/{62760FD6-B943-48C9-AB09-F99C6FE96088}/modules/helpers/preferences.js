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
 * The Original Code is Preferences.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Myk Melez <myk@mozilla.org>
 *   Daniel Aquino <mr.danielaquino@gmail.com>
 *   Paul Gideon Dann <pdgiddie@gmail.com>
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

EXPORTED_SYMBOLS = ["Preferences"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function Preferences(prefBranch) {
  if (prefBranch)
    this._prefBranch = prefBranch;
}

// Set the prototype to itself so new instances inherit the class's properties.
Preferences.prototype = Preferences;

Preferences._observers = {};
Preferences._prefBranch = "";

// Preference Service
Preferences.__defineGetter__("_prefSvc",
  function() {
    let prefSvc = Cc["@mozilla.org/preferences-service;1"].
                  getService(Ci.nsIPrefBranch2);
    return prefSvc;
  }
);

/**
  * Get the name of the pref branch
  */
Preferences.branchName =
function() {
  return this._prefBranch;
};

/**
  * Get the value of a pref, if any; otherwise return the default value.
  *
  * @param   aPrefName      the name of the pref to get
  * @param   aDefaultValue  the default value, if any
  *
  * @returns the value of the pref, if any; otherwise the default value
  */
Preferences.get =
function(prefName, defaultValue) {
  // We can't check for |prefName.constructor == Array| here, since we have
  // a different global object, so we check the constructor name instead.
  if (typeof prefName == "object" && prefName.constructor.name == Array.name)
    return prefName.map(function(v) { return this.get(v) }, this);

  let prefFullName = this._prefBranch + prefName;

  try {
    switch (this._prefSvc.getPrefType(prefFullName)) {
      case Ci.nsIPrefBranch.PREF_STRING:
        return this._prefSvc.getCharPref(prefFullName);
      case Ci.nsIPrefBranch.PREF_INT:
        return this._prefSvc.getIntPref(prefFullName);
      case Ci.nsIPrefBranch.PREF_BOOL:
        return this._prefSvc.getBoolPref(prefFullName);
    }
  }
  catch (ex) {}

  return defaultValue;
};

Preferences.set =
function(prefName, prefValue) {
  // We can't check for |prefName.constructor == Object| here, since we have
  // a different global object, so we check the constructor name instead.
  if (typeof prefName == "object" && prefName.constructor.name == Object.name)
    for (let [name, value] in Iterator(prefName))
      this.set(name, value);
  else {
    let prefFullName = this._prefBranch + prefName;

    switch (typeof prefValue) {
      case "number":
        this._prefSvc.setIntPref(prefFullName, prefValue);
        break;
      case "boolean":
        this._prefSvc.setBoolPref(prefFullName, prefValue);
        break;
      case "string":
      default:
        this._prefSvc.setCharPref(prefFullName, prefValue);
        break;
    }
  }
};

Preferences.addObserver =
function(callback, prefName) {
  var prefFullName = this._prefBranch + prefName;
  var observer = new Observer(callback);
  if (!(prefName in this._observers))
    this._observers[prefName] = {};
  this._observers[prefName][callback] = observer;
  this._prefSvc.addObserver(prefFullName, observer, false);
};

Preferences.removeObserver =
function(callback, prefName) {
  var prefFullName = this._prefBranch + prefName;
  var observer = this._observers[prefName][callback];
  this._prefSvc.removeObserver(prefFullName, observer);
  delete this._observers[prefName][callback]
};

Preferences.has =
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  return (this._prefSvc.getPrefType(this._prefBranch + prefName) !=
          this._prefSvc.PREF_INVALID);
};

Preferences.reset =
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  this._prefSvc.clearUserPref(this._prefBranch + prefName);
};

Preferences.modified = 
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  return (this.has(prefName) &&
          this._prefSvc.prefHasUserValue(this._prefBranch + prefName));
};

Preferences.lock =
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  this._prefSvc.lockPref(this._prefBranch + prefName);
};

Preferences.unlock = 
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  this._prefSvc.unlockPref(this._prefBranch + prefName);
};

Preferences.locked = 
function(prefName) {
  if (!prefName) {
    prefName = "";
  }
  return this._prefSvc.isLocked(this._prefBranch + prefName);
};

Preferences.resetBranch = 
function(prefBranch) {
  if (!prefBranch) {
    prefBranch = "";
  }
  this._prefSvc.resetBranch(this._prefBranch + prefBranch);
};

Preferences.deleteBranch = 
function(prefBranch) {
  if (!prefBranch) {
    prefBranch = "";
  }
  this._prefSvc.deleteBranch(this._prefBranch + prefBranch);
};


function Observer(callback) {
  this._callback = callback;
}

Observer.prototype = {
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver, Ci.nsISupportsWeakReference]),
  observe: function(subject, topic, data) {
    // Pass the wrappedJSObject for subjects that have one.  Otherwise pass
    // the subject itself.  This way we support both wrapped subjects created
    // using this module and those that are real XPCOM components.
    if (subject && subject.wrappedJSObject)
      this._callback(subject.wrappedJSObject, topic, data);
    else
      this._callback(subject, topic, data);
  }
}
