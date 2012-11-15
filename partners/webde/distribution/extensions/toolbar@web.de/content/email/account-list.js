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
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2011
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
/**
 * This file contains the mechanics of account object creation,
 * which gets the account class of an appropriate type.
 * It keeps the list of all account objects created.
 */
/**
 * Messages sent:
 * "account-added"
 *    Means: A new login/email account is available from getAllExistingAccounts()
 *    When: The user configured a new account
 *    Parameter: object
 *      account {Account}
 * "account-removed"
 *    Means: A login/email account has been removed.
 *        You must not use it anymore, and drop all references to it.
 *    When: The user removed an new account using the config UI
 *    Parameter: object
 *      account {Account}
 *
 * Messages observed:
 * "uninstall" (extension.js)
 *    Meaning: User requested the application to be removed
 *    When: Extension Manager is performing the uninstall
 *    Effect:
 *      - Passwords are removed from profile
 *      - Accounts are removed from prefs (per spec)
 *      - Logout at server
 */

const EXPORTED_SYMBOLS = [ "getAllExistingAccounts", "getExistingAccount",
    "getExistingAccountForEmailAddress", "makeNewAccount", "_removeAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/email/account-base.js");
Components.utils.import("resource://unitedtb/email/imap.js");
Components.utils.import("resource://unitedtb/email/pop3.js");
Components.utils.import("resource://unitedtb/email/email-logic.js");
var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/login.properties");

/**
 * Contains all Account objected created.
 * {Map accountID -> Account}
 */
var gAccounts = {};

var gHaveReadAll = false;
/**
 * Returns all accounts from prefs and local objects
 */
function getAllExistingAccounts()
{
  if ( !gHaveReadAll)
  {
    for each (let accountID in ourPref.get("accountsList", "").split(","))
    {
      if ( !accountID)
        continue;
      if (gAccounts[accountID])
        continue;
      try {
        _readExistingAccountFromPrefs(accountID); // adds to gAccounts
      } catch (e) { errorInBackend(e); }
    }
    gHaveReadAll = true;
  }
  var result = []; // convert map to new array
  for each (let acc in gAccounts)
    result.push(acc)
  return result;
}

function _readExistingAccountFromPrefs(accountID)
{
  sanitize.nonemptystring(accountID);
  var type = ourPref.get("account." + accountID + ".type", null);
  assert(type, "account does not exist in prefs");
  gAccounts[accountID] = _newAccountOfType(type, accountID, false);
  return gAccounts[accountID];
}

/**
 * Returns the |Account| object for |accountID|.
 * If the account does not exist yet, returns null;
 */
function getExistingAccount(accountID)
{
  sanitize.nonemptystring(accountID);
  if ( !gHaveReadAll)
    getAllExistingAccounts();
  return gAccounts[accountID];
}

/**
 * Returns the |Account| object for |emailAddress|.
 * If the account does not exist yet, returns null;
 */
function getExistingAccountForEmailAddress(emailAddress)
{
  sanitize.nonemptystring(emailAddress);
  for each (let acc in getAllExistingAccounts())
    if (acc.emailAddress == emailAddress)
      return acc;
  return null;
}

/**
 * Returns the |Account| object for |emailAddress|.
 * If none exists yet, creates it.
 *
 * Note: You need to call account.saveToPrefs() yourself.
 */
function makeNewAccount(emailAddress)
{
  sanitize.nonemptystring(emailAddress);
  assert( !getExistingAccountForEmailAddress(emailAddress),
          "account already exists");
  //var accountID = emailAddress;
  var accountID = generateNewAccountID();

  // TODO move to account creation wizard
  var domain = Account.getDomainForEmailAddress(emailAddress);
  var account = null;
  for each (let config in brand.login.configs)
  {
    if ( !arrayContains(config.domains, domain))
      continue;
    account = _newAccountOfType(config.type, accountID, true);
    account.emailAddress = emailAddress;
    if (config.type == "imap" || config.type == "pop3")
    {
      if (config.interval)
        account._interval = config.interval;
      else if (config.type == "imap")
        // If this is too long, the server closes the connection.
        account._interval = 30; // Just for NOOP, not IDLE
      else if (config.type == "pop3")
        account._interval = 300;

      account.username = emailAddress;
      account.hostname = config.hostname;
      account.port = config.port;
      account.ssl = config.socketType;
    }
    else if (config.type == "unitedinternet")
    {
      account._readServerConfig();
    }
  }
  if ( !account)
  {
    throw new Exception(gStringBundle.get("error.domain",
        [ brand.login.providerName ]));
  }

  gAccounts[accountID] = account;
  runAsync(function()
  {
    notifyGlobalObservers("account-added", { account : account });
  }, 0);
  return account;
}

function generateNewAccountID()
{
  var existingAccountIDs = ourPref.get("accountsList", "").split(",");
  var newAccountID;
  var i = 1;
  do {
    newAccountID = "account" + i++;
  } while (existingAccountIDs.indexOf(newAccountID) != -1 &&
      ourPref.get("account." + newAccountID + ".type", null))
  return newAccountID;
}

function _newAccountOfType(type, accountID, isNew)
{
  if (type == "imap")
    return new IMAPAccount(accountID, isNew);
  else if (type == "pop3")
    return new POP3Account(accountID, isNew);
  else if (type == "unitedinternet")
    return new UnitedInternetMailCheckAccount(accountID, isNew);
  else
    throw new NotReached("unknown account type requested to be created: " + type);
}

/**
 * To be called only from Account.deleteAccount() in account-base.js.
 * Other callers must call Account.deleteAccount().
 */
function _removeAccount(account)
{
  delete gAccounts[account.accountID];
  // delete from array must happen before the observers see the msg,
  // because they to getAllExistingAccounts().
  notifyGlobalObservers("account-removed", { account : account });
}


/**
* Clean up sensitive data on uninstall.
* Cleans: stored login tokens
*/
function cleanUpOnUnInstall()
{
  for each (let acc in getAllExistingAccounts()) // use copy
  {
    // this 1) removes passwords 2) removes prefs 3) logs out
    acc.deleteAccount();
  }
  ourPref.resetBranch("account.");
  ourPref.reset("accountsList");
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall")
      cleanUpOnUnInstall();
  },
}
registerGlobalObserver(globalObserver);
