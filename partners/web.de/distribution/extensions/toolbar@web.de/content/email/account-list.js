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
 * The Original Code is the Beonex Mail Notifier and Mozilla Thunderbird
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
    "getExistingAccountForEmailAddress", "makeNewAccount",
    "verifyEmailAddressDomain", "_removeAccount", ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/email/account-base.js");
Components.utils.import("resource://unitedtb/email/imap.js");
Components.utils.import("resource://unitedtb/email/pop3.js");
Components.utils.import("resource://unitedtb/email/email-logic.js");
Components.utils.import("resource://gre/modules/Services.jsm");
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
 * Create a new |Account| object for |emailAddress|.
 *
 * Note: You need to call account.saveToPrefs() yourself.
 *
 * @param successCallback {Function(account {Account})}
 *     Called, if the email address is supported and could be configured.
 * @param errorCallback {Function(msg {String or Exception})}
 *     Called, if we cannot configure that email address.
 * @returns {Abortable}
 */
function makeNewAccount(emailAddress, successCallback, errorCallback)
{
  try {
    sanitize.nonemptystring(emailAddress);
    assert(emailAddress == emailAddress.toLowerCase(),
            "email addresses must be lowercase");
    assert( !getExistingAccountForEmailAddress(emailAddress),
            "account already exists");
    //var accountID = emailAddress;
    var accountID = generateNewAccountID();
    var domain = Account.getDomainForEmailAddress(emailAddress);
  } catch (e) { errorCallback(e); }

  return getAccountProviderWithNet(domain, function(config)
  {
    var account = _newAccountOfType(config.type, accountID, true);
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
      account.setServerConfig(config);
    }

    gAccounts[accountID] = account;
    successCallback(account);
    notifyGlobalObservers("account-added", { account : account });
  }, errorCallback);
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

/**
 * Checks whether the domain of the email address is supported by us.
 *
 * @param emailAddress {String}
 * @param successCallback {Function(config {Object})} check passed
 *    |config| the brand.js object for this provider
 * @param errorCallback check failed, with reason
 * @returns {Abortable}
 */
function verifyEmailAddressDomain(emailAddress, successCallback, errorCallback)
{
  var domain = Account.getDomainForEmailAddress(emailAddress);
  return getAccountProviderWithNet(domain, successCallback, errorCallback);
}

/**
 * Finds the provider that hosts this email address.
 * Uses both the internal list of domains in brand.js,
 * as well as MX lookups over the network to determine
 * the provider.
 *
 * @see Disclaimers at fetchConfigForMX()
 * <http://mxr.mozilla.org/comm-central/source/
 * mailnews/base/prefs/content/accountcreation/fetchConfig.js#136>
 *
 * @param domain {String} email address, part after @
 * @param successCallback {Function(provider {Object})}
 *     Called, if the provider could be found and is supported.
 *     |provider| config object from brand.js for the provider.
 * @param errorCallback {Function(msg {String or Exception})}
 *     Called, if we cannot configure that email address.
 * @returns {Abortable}
 */
function getAccountProviderWithNet(domain,
                                   successCallback, errorCallback)
{
  // first check whether it's one of the main domains for which
  // we have the config locally
  var config = getAccountProviderLocally(domain);
  if (config)
  {
    successCallback(config);
    return new Abortable();
  }
  var errorMsg = gStringBundle.get("error.domain",
      [ brand.login.providerName ]);

  // TODO move to TB account creation wizard

  // Now fetch the MX record for the domain and check whether
  // the SLD of it matches one of our known domains.
  // Given that Mozilla can't do DNS MX lookups,
  // we use the webservice that Thunderbird uses.
  // @see fetchConfigForMX()
  // <http://mxr.mozilla.org/comm-central/source/
  // mailnews/base/prefs/content/accountcreation/fetchConfig.js#136>
  return getMX(domain, function(mxHostname)
  {
    debug("got MX " + mxHostname);
    var providerDomain = Services.eTLD.getBaseDomainFromHost(mxHostname);
    debug("got domain " + providerDomain);
    var config = getAccountProviderLocally(providerDomain);
    debug("got config " + (config ? config.providerID : "(none)"));
    if (config) {
      successCallback(config);
    } else {
      errorCallback(errorMsg);
    }
  },
  function(e)
  {
    errorCallback(e == "no MX found" ? errorMsg : e);
  });
}

/**
 * Finds the provider that hosts this email address.
 * Uses only the internal list of domains in brand.js.
 *
 * @param domain {String} email address, part after @
 * @returns {Object} config object from brand.js for the provider.
 *     null, if no config found.
 */
function getAccountProviderLocally(domain)
{
  for each (let config in brand.login.configs)
  {
    if (arrayContains(config.domains, domain))
      return config;
  }
  return null;
}

/**
 * <copied from="mailnews/base/prefs/content/accountcreation/fetchConfig.js"
 * license="MPL" />
 *
 * Queries the DNS MX for the domain
 *
 * The current implementation goes to a web service to do the
 * DNS resolve for us, because Mozilla unfortunately has no implementation
 * to do it. That's just a workaround. Once bug 545866 is fixed, we make
 * the DNS query directly on the client. The API of this function should not
 * change then.
 *
 * Returns (in successCallback) the hostname of the MX server.
 * If there are several entires with different preference values,
 * only the most preferred (i.e. those with the lowest value)
 * is returned. If there are several most preferred servers (i.e.
 * round robin), only one of them is returned.
 *
 * @param domain {String}
 * @param successCallback {function(hostname {String})
 *   Called when we found an MX for the domain.
 *   For |hostname|, see description above.
 * @param errorCallback
 * @returns {Abortable}
 */
function getMX(domain, successCallback, errorCallback)
{
  domain = sanitize.hostname(domain);
  var url = "https://mx-live.mozillamessaging.com/dns/mx/" + domain;
  var fetch = new FetchHTTP({ url : url }, function(result)
  {
    // result is plain text, with one line per server.
    // So just take the first line
    debug("MX query result: \n" + result + "(end)");
    assert(typeof(result) == "string");
    let first = result.split("\n")[0];
    first.toLowerCase().replace(/[^a-z0-9\-_\.]*/g, "");
    if (first.length == 0)
    {
      errorCallback("no MX found");
      return;
    }
    successCallback(first);
  }, errorCallback);
  fetch.start();
  return fetch;
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
