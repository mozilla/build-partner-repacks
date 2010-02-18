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
 * The Original Code is Observers.
 *
 * The Initial Developer of the Original Code is Daniel Aquino.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Aquino <mr.danielaquino@gmail.com>
 *   Myk Melez <myk@mozilla.org>
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

let EXPORTED_SYMBOLS = ["Observers"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function Observers() {
  // each new instance will contain its own list of observers
  // the global object retains a global list
  this._observers = {};
}

// instances inherit static methods
Observers.prototype = Observers;

Observers.add = function(callback, topic) {
  let observer = new Observer(callback);
  if (!(topic in this._observers))
    this._observers[topic] = {};
  this._observers[topic][callback] = observer;
  this._service.addObserver(observer, topic, true);
  return observer;
};

Observers.remove = function(callback, topic) {
  let observer = this._observers[topic][callback];
  this._service.removeObserver(observer, topic);
  delete this._observers[topic][callback];
};

Observers.removeAll = function() {
  if (this == Observers) {
    throw Components.
      Exception("removeAll may not be called on global Observers object",
                Cr.NS_ERROR_FAILURE, Components.stack.caller);
  }
  for (let [topic, callbacks] in Iterator(this._observers)) {
    for (let [callback, observer] in Iterator(callbacks)) {
      this._service.removeObserver(observer, topic);
      delete observer;
    }
  }
};

Observers.notify = function(subject, topic, data) {
  Observers._service.notifyObservers(new Subject(subject), topic, data);
};

Observers._service = Cc["@mozilla.org/observer-service;1"].
                     getService(Ci.nsIObserverService);

Observers._observers = {};


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


function Subject(object) {
  this.wrappedJSObject = object;
}

Subject.prototype = {
  QueryInterface: XPCOMUtils.generateQI([]),
  getHelperForLanguage: function() {},
  getInterfaces: function() {}
};
