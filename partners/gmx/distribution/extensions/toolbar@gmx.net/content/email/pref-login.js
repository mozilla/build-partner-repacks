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
 * The Original Code is the Beonex Mail Notifier
 *
 * The Initial Developer of the Original Code is
 *  Ben Bucksch <ben.bucksch beonex.com>
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

Components.utils.import("resource://unitedtb/email/account-list.js", this);
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/email/login.properties");

function onLoad()
{
  populateList();
  checkForDesktopNotifications();
}

function populateList()
{
  try {
    var listbox = document.getElementById("accounts-list");
    var listboxStyle = window.getComputedStyle(listbox, null);
    var width = parseInt(listboxStyle.getPropertyValue("width"));
    var height = parseInt(listboxStyle.getPropertyValue("height"));
    listbox.setAttribute("width", width);
    listbox.setAttribute("height", height);

    // delete
    for (let listitems = listbox.getElementsByTagName("richlistitem"); listitems.length; )
      listbox.removeChild(listitems.item(0));
    gPrefElements = gPrefElements.filter(function(o) {
      return !(o instanceof RememberMe);
    });

    for each (let account in getAllExistingAccounts())
    {
      // build UI elements
      let listitem = document.createElement("richlistitem");
      let listcellEmail = document.createElement("listcell");
      let listcellPw = document.createElement("checkbox");
      listitem.appendChild(listcellEmail);
      listcellEmail.setAttribute("flex", "1");
      listitem.appendChild(listcellPw);
      listbox.appendChild(listitem);

      // set UI values
      listitem.backendAccount = account;
      listcellEmail.setAttribute("label", account.emailAddress);
      new RememberMe(listcellPw, account);
    }

    document.getElementById("remove-account").disabled =
        getAllExistingAccounts().length == 0;
  } catch (e) { errorCritical(e); }
}

function checkForDesktopNotifications()
{
  try
  {
    var alerts = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
  }
  catch (ex)
  {
    document.getElementById("desktop-notification").disabled = true;
    if (getOS() == "mac")
    {
      document.getElementById("growl").hidden = false;
      document.getElementById("growl").addEventListener("click", function()
      {
        loadPage("http://growl.info/", "tab");
      }, false);
    }
  }
}

window.addEventListener("load", onLoad, false);
autoregisterGlobalObserver("account-added", populateList);
autoregisterGlobalObserver("account-removed", populateList);

function setup()
{
  /* for POP3/IMAP support
  window.openDialog("chrome://unitedtb/content/email/accountcreation/emailWizard.xul",
      "united-accountcreation",
      "chrome=yes,dialog,titlebar,toolbar,modal,centerscreen");
  */

  // Short-term workaround until POP3/IMAP and the above wizard is integrated
  // 2 = create account
  findSomeBrowserWindow().unitedinternet.login.tryLogin(2, null, false,
      function() {}, errorCritical, function() {});
  // list refreshes automatically due to listeners
}

/*
function edit()
{
  var acc = getSelectedAccount();

  var answ = login.common.getEmailAddressAndPassword({
      emailAddress : acc.emailAddress,
      wantStoredLogin : acc.wantStoredLogin,
      usecase : 2,
    });
  if ( !answ) // user cancelled
    return;

  if (answ.emailAddress != acc.emailAddress ||
      answ.wantStoredLogin != acc.wantStoredLogin)
  {
    acc.emailAddress = answ.emailAddress;
    acc.wantStoredLogin = answ.wantStoredLogin;
    acc.saveToPrefs();
    // main window menu items and pref listbox observe pref
  }
}
*/

function remove()
{
  var acc = getSelectedAccount();

  var ok = promptService.confirm(window,
      gStringBundle.get("remove.title"),
      gStringBundle.get("remove.confirm", [ acc.emailAddress ]));
  if (!ok) {
    return;
  }

  // delete this account from backend and prefs
  acc.deleteAccount();

  // main window menu items and pref listbox observe pref
}

/**
 * @returns {Account}
 * @throws if nothing is selected
 */
function getSelectedAccount()
{
  var listbox = document.getElementById("accounts-list");
  // Workaround Firefox bug
  // selectedItem has a value when nothing is selected
  var listitem;
  if (listbox.selectedIndex != -1)
    listitem = listbox.selectedItem;
  if (!listitem)
  {
    errorCritical(gStringBundle.get("error.noselection"));
    throw "no selection";
  }
  return listitem.backendAccount;
}

function RememberMe(el, account)
{
  assert(account);
  this._account = account;
  SettingElement.call(this, el);
}
RememberMe.prototype =
{
  get storeValue()
  {
    return this._account.wantStoredLogin;
  },
  set storeValue(val)
  {
    this._account.wantStoredLogin = val;
    if ( !val && this._account.isLoggedIn) {
      // destroy token on server
      this._account.logout(function() {}, errorCritical);
    }
  },
  get defaultValue()
  {
     return true;
  },
}
extend(RememberMe, SettingElement);
