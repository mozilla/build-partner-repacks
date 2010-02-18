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
 * The Original Code is Timer.
 *
 * The Initial Developer of the Original Code is Daniel Aquino.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

let EXPORTED_SYMBOLS = ["Timer"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

function Timer(callback, interval, type) {
  if (!type) type = Timer.TYPE_ONE_SHOT;
  this._callback = callback;
  this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  this._timer.initWithCallback(this, interval, type);
  this._startTime = Date.now();
}

Timer.TYPE_ONE_SHOT =          Ci.nsITimer.TYPE_ONE_SHOT;
Timer.TYPE_REPEATING_SLACK =   Ci.nsITimer.TYPE_REPEATING_SLACK;
Timer.TYPE_REPEATING_PRECISE = Ci.nsITimer.TYPE_REPEATING_PRECISE;

Timer.prototype = {
  /**
   * The interval of this timer
   */
  get interval() {
    return this._timer.delay;
  },

  /**
   * Time elapsed since last call to callback (or since the timer was created,
   * if none has yet been made).
   */
  get elapsedTime() {
    return Date.now() - this._startTime;
  },

  notify : function(timer) {
    if (this._timer.type == Timer.TYPE_REPEATING_PRECISE) {
      this._startTime = Date.now();
    }

    this._callback();

    if (this._timer.type == Timer.TYPE_REPEATING_SLACK) {
      this._startTime = Date.now();
    }
  },

  cancel : function() {
    this._timer.cancel();
  }
};
