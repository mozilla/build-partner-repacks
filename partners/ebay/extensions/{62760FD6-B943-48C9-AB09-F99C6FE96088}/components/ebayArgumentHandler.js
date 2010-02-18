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
* The Original Code is mozilla.org code.
*
* The Initial Developer of the Original Code is
* Netscape Communications Corporation.
* Portions created by the Initial Developer are Copyright (C) 1999
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*   Martijn Pieters <mj@digicool.com>
*   Benjamin Smedberg <benjamin@smedbergs.us>
*   Simon Bünzli <zeniko@gmail.com>
*   Juan Manuel Rodriguez <juan@glaxstar.com>
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
* ***** END LICENSE BLOCK *****/

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/**
 * See http://mxr.mozilla.org/mozilla/source/toolkit/components/commandlines/public/nsICommandLineHandler.idl
 * for further documentation on the nsICommandLineHandler interface
 * See http://mxr.mozilla.org/mozilla-central/source/js/src/xpconnect/loader/XPCOMUtils.jsm
 * for further documentation on how to implement XPCOM components using
 * XPCOMUtils.jsm
 */

function EbayArgumentHandler() {}
EbayArgumentHandler.prototype = {

  _startedUsingShortcut : false,

  helpInfo : "  -ebayComp            Handle urls passed as parameter\n",

  classDescription: "EbayArgumentHandler",
  classID: Components.ID("{D51773EF-96FF-4FCB-A8A0-F0589BF8B32D}"),
  contractID:
    "@mozilla.org/commandlinehandler/general-startup;1?type=ebayarghandler",

  // custom implementation of nsIFactory to make the component a singleton and
  // keep startedUsingShortcut flag value available any time from any place
  _xpcom_factory: EbayArgumentHandlerFactory,
  QueryInterface: XPCOMUtils.generateQI(
    [Ci.nsICommandLineHandler, Ci.ecIEbayArgumentsHandler]),
  _xpcom_categories:
    [{category: "command-line-handler", entry: "m-ebayarghandler"}],

  /**
   * Obtains the startedUsingShortcut flag.
   * @returns the startedUsingShortcut flag.
   */
  get startedUsingShortcut() {
    return this._startedUsingShortcut;
  },

  handle: function clh_handle(cmdLine) {
    let ebayCompFlagIndex = cmdLine.findFlag("ebayComp", false);

    // set startedUsingShortcut flag in the ecIEbayArgumentsHandler interface,
    // so we can read it anywhere we need it
    this._startedUsingShortcut = (ebayCompFlagIndex != -1);
    return;
  }

};

/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var EbayArgumentHandlerFactory = {
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
      this._singletonObj = EbayArgumentHandler;
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([EbayArgumentHandler]);
}
