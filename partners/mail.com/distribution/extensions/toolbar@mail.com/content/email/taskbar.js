/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Not any newer versions of these licenses
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
 * The Original Code is the Windows taskbar icon overlay extension
 *
 * The Initial Developer of the Original Code is
 *  Siddharth Agarwal <https://github.com/sid0>
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mike Kaply
 *   Ben Bucksch
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

const EXPORTED_SYMBOLS = [ "updateTaskbarIcon" ];

// This code is copied from https://github.com/sid0/overlay-extension
// except for the last function (hasTaskbarIcon)

Components.utils.import("resource://unitedtb/util/util.js");

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "gImageToolsService",
                                   "@mozilla.org/image/tools;1",
                                   "imgITools");
XPCOMUtils.defineLazyServiceGetter(this, "gTaskbarService",
                                   "@mozilla.org/windows-taskbar;1",
                                   "nsIWinTaskbar");

/**
 * Given a URL {String} referring to an image, calls the callback with an
 * imgIContainer for the image. Copied from WindowsPreviewPerTab.jsm.
 */
function _imageFromURL(url, callback) {
  let channel = ioService.newChannelFromURI(NetUtil.newURI(url));
  NetUtil.asyncFetch(channel, function(inputStream, resultCode) {
    if (!Components.isSuccessCode(resultCode))
      return;
    let out_img = { value: null };
    gImageToolsService.decodeImageData(inputStream, channel.contentType, out_img);
    callback(out_img.value);
  });
}

var gHasTaskbar = true;

function updateTaskbarIcon(window, iconURL) {
  if ( !gHasTaskbar)
    return;
  try {
    if (!Cc["@mozilla.org/windows-taskbar;1"] ||
        !gTaskbarService.getOverlayIconController)
    {
      gHasTaskbar = false;
      return;
    }
    let docshell = window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem)
      .treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIXULWindow).docShell;

    let controller = gTaskbarService.getOverlayIconController(docshell);
    if (iconURL) {
      _imageFromURL(iconURL,
        function (aIcon) {
          controller.setOverlayIcon(aIcon, "");
        });
    } else {
      controller.setOverlayIcon(null, "");
    }
  } catch (e) {
    errorInBackend(e);
    gHasTaskbar = false;
  }
}
