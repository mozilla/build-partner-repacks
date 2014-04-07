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
    "getExistingAccountForEmailAddress", "getPrimaryAccount", "makeNewAccount",
    "verifyEmailAddressDomain", "_removeAccount", ];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/common-jsm.js");
importJSM("email/account-base.js", this);
importJSM("email/imap.js", this);
importJSM("email/pop3.js", this);
importJSM("email/email-logic.js", this);
var gStringBundle = new StringBundle("email/login");

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

/**
 * The "main" account is used by all the services and UI
 * that do not support multiple accounts.
 * @returns {Account}
 *     May be null, if no account is configured,
 *     or if none of the configured accounts is from
 *     the brand of the current toolbar,
 *     e.g. only a GMX account, but this is a web.de toolbar.
 */
function getPrimaryAccount() {
  for each (let acc in gAccounts) {
    if (acc.providerID == brand.login.providerID) {
      return acc;
    }
  }
  return null;
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

  return getAccountProviderWithNet(domain, emailAddress, function(config)
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

      account.username = config.username || emailAddress;
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
  return getAccountProviderWithNet(domain, emailAddress,
      successCallback, errorCallback);
}




/********************************************************************
 * Find config for an email address
 ********************************************************************/

// TODO move to TB account creation wizard

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
function getAccountProviderWithNet(domain, emailAddress,
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

  // Now fetch the MX record for the domain and check whether
  // the SLD of it matches one of our known domains.
  // Given that Mozilla can't do DNS MX lookups,
  // we use the webservice that Thunderbird uses.
  // @see fetchConfigForMX()
  // <http://mxr.mozilla.org/comm-central/source/
  // mailnews/base/prefs/content/accountcreation/fetchConfig.js#136>
  var sab = new SuccessiveAbortable();
  sab.current = getMX(domain, function(mxHostname)
  {
    debug("got MX " + mxHostname);
    var providerDomain = Services.eTLD.getBaseDomainFromHost(mxHostname);
    debug("got domain " + providerDomain);
    var config = getAccountProviderLocally(providerDomain);
    debug("got config " + (config ? config.providerID : "(none)"));
    if (config) {
      debug("found config for MX " + providerDomain);
      successCallback(config);
      return;
    }

    // At this point, it's definitely not one of our accounts.
    // Try to query the Mozilla ISP database and see whether we can find
    // IMAP server information there.

    // First, try the domain directly, then via MX domain
    sab.current = fetchConfigFromMozillaDB(domain, function(ac) {
      debug("found config for " + domain);
      successCallback(convertMozillaConfigToOurs(ac, emailAddress));
    },
    function(e) {
      errorInBackend(e);
      sab.current = fetchConfigFromMozillaDB(providerDomain, function(ac) {
        debug("found config for " + providerDomain);
        successCallback(convertMozillaConfigToOurs(ac, emailAddress));
      },
      function(e) { errorCallback(new UserError(errorMsg)); });
    });
  },
  function(e) {
    errorCallback(e == "no MX found" || e.code == 404 ? new UserError(errorMsg) : e);
  });
  return sab;
}

/**
 * @param ac {AccountConfig}
 * @returns {Object} like config in brand.js
 */
function convertMozillaConfigToOurs(ac, emailAddress) {
  replaceVariables(ac, emailAddress);
  return ac.incoming; // all the properties match, luckily
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
  var url = brand.login.mozillaMXURL + domain;
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


/**
 * <copied from="mailnews/base/prefs/content/accountcreation/fetchConfig.js"
 * license="MPL" />
 *
 * Tries to get a configuration for this ISP from a central database at
 * Mozilla servers.
 *
 * @param domain {String}   The domain part of the user's email address
 * @param successCallback {Function(config {AccountConfig}})}   A callback that
 *         will be called when we could retrieve a configuration.
 *         The AccountConfig object will be passed in as first parameter.
 * @param errorCallback {Function(ex)}   A callback that
 *         will be called when we could not retrieve a configuration,
 *         for whatever reason. This is expected (e.g. when there's no config
 *         for this domain at this location),
 *         so do not unconditionally show this to the user.
 *         The first paramter will be an exception object or error string.
 */
function fetchConfigFromMozillaDB(domain, successCallback, errorCallback)
{
  var url = brand.login.mozillaISPDBURL + domain;
  domain = sanitize.hostname(domain);

  if (!url.length)
    return errorCallback("no fetch url set");
  let fetch = new FetchHTTP({ url: url }, function(result) {
    successCallback(readFromXML(JXON.build(result)));
  }, errorCallback);
  fetch.start();
  return fetch;
}

/**
 * <copied from="mailnews/base/prefs/content/accountcreation/readFromXML.js"
 * license="MPL" />
 *
 * Takes an XML snipplet (as JXON) and reads the values into
 * a new AccountConfig object.
 * It does so securely (or tries to), by trying to avoid remote execution
 * and similar holes which can appear when reading too naively.
 * Of course it cannot tell whether the actual values are correct,
 * e.g. it can't tell whether the host name is a good server.
 *
 * The XML format is documented at
 * <https://wiki.mozilla.org/Thunderbird:Autoconfiguration:ConfigFileFormat>
 *
 * @param clientConfigXML {JXON}  The <clientConfig> node.
 * @return AccountConfig   object filled with the data from XML
 */
function readFromXML(clientConfigXML)
{
  function array_or_undef(value) {
    return value === undefined ? [] : value;
  }
  var exception;
  if (typeof(clientConfigXML) != "object" ||
      !("clientConfig" in clientConfigXML) ||
      !("emailProvider" in clientConfigXML.clientConfig))
  {
    debug("client config xml = " + JSON.stringify(clientConfigXML));
    var stringBundle = getStringBundle(
        "chrome://messenger/locale/accountCreationModel.properties");
    throw stringBundle.GetStringFromName("no_emailProvider.error");
  }
  var xml = clientConfigXML.clientConfig.emailProvider;

  var d = new AccountConfig();
  d.source = AccountConfig.kSourceXML;

  d.id = sanitize.hostname(xml["@id"]);
  d.displayName = d.id;
  try {
    d.displayName = sanitize.label(xml.displayName);
  } catch (e) { logException(e); }
  for (var domain of xml.$domain)
  {
    try {
      d.domains.push(sanitize.hostname(domain));
    } catch (e) { logException(e); exception = e; }
  }
  if (domain.length == 0)
    throw exception ? exception : "need proper <domain> in XML";
  exception = null;

  // incoming server
  for (let iX of array_or_undef(xml.$incomingServer)) // input (XML)
  {
    let iO = d.createNewIncoming(); // output (object)
    try {
      // throws if not supported
      iO.type = sanitize.enum(iX["@type"], ["pop3", "imap", "nntp"]);
      iO.hostname = sanitize.hostname(iX.hostname);
      iO.port = sanitize.integerRange(iX.port, 1, 65535);
      // We need a username even for Kerberos, need it even internally.
      iO.username = sanitize.string(iX.username); // may be a %VARIABLE%

      if ("password" in iX) {
        d.rememberPassword = true;
        iO.password = sanitize.string(iX.password);
      }

      for (let iXsocketType of array_or_undef(iX.$socketType))
      {
        try {
          iO.socketType = sanitize.translate(iXsocketType,
              { plain : 1, SSL: 2, STARTTLS: 3 });
          break; // take first that we support
        } catch (e) { exception = e; }
      }
      if (!iO.socketType)
        throw exception ? exception : "need proper <socketType> in XML";
      exception = null;

      for (let iXauth of array_or_undef(iX.$authentication))
      {
        try {
          iO.auth = sanitize.translate(iXauth,
              { "password-cleartext" : "password-cleartext",
                "plain" : "password-cleartext",
                "password-encrypted" : "password-encrypted",
                "secure" : "password-encrypted",
                "GSSAPI" : "GSSAPI",
                "NTLM" : "NTLM",
              });
          break; // take first that we support
        } catch (e) { exception = e; }
      }
      if (!iO.auth)
        throw exception ? exception : "need proper <authentication> in XML";
      exception = null;

      // defaults are in accountConfig.js
      if (iO.type == "pop3" && "pop3" in iX)
      {
        try {
          if ("leaveMessagesOnServer" in iX.pop3)
            iO.leaveMessagesOnServer =
                sanitize.boolean(iX.pop3.leaveMessagesOnServer);
          if ("daysToLeaveMessagesOnServer" in iX.pop3)
            iO.daysToLeaveMessagesOnServer =
                sanitize.integer(iX.pop3.daysToLeaveMessagesOnServer);
        } catch (e) { logException(e); }
        try {
          if ("downloadOnBiff" in iX.pop3)
            iO.downloadOnBiff = sanitize.boolean(iX.pop3.downloadOnBiff);
        } catch (e) { logException(e); }
      }

      // processed successfully, now add to result object
      if (!d.incoming.hostname) // first valid
        d.incoming = iO;
      else
        d.incomingAlternatives.push(iO);
    } catch (e) { exception = e; }
  }
  if (!d.incoming.hostname)
    // throw exception for last server
    throw exception ? exception : "Need proper <incomingServer> in XML file";
  exception = null;

  // outgoing server
  for (let oX of array_or_undef(xml.$outgoingServer)) // input (XML)
  {
    let oO = d.createNewOutgoing(); // output (object)
    try {
      if (oX["@type"] != "smtp")
      {
        var stringBundle = getStringBundle(
            "chrome://messenger/locale/accountCreationModel.properties");
        throw stringBundle.GetStringFromName("outgoing_not_smtp.error");
      }
      oO.hostname = sanitize.hostname(oX.hostname);
      oO.port = sanitize.integerRange(oX.port, 1, 65535);

      for (let oXsocketType of array_or_undef(oX.$socketType))
      {
        try {
          oO.socketType = sanitize.translate(oXsocketType,
              { plain : 1, SSL: 2, STARTTLS: 3 });
          break; // take first that we support
        } catch (e) { exception = e; }
      }
      if (!oO.socketType)
        throw exception ? exception : "need proper <socketType> in XML";
      exception = null;

      for (let oXauth of array_or_undef(oX.$authentication))
      {
        try {
          oO.auth = sanitize.translate(oXauth,
              {
                // open relay
                "none" : "none",
                // inside ISP or corp network
                "client-IP-address" : "client-IP-address",
                // hope for the best
                "smtp-after-pop" : "smtp-after-pop",
                "password-cleartext" : "password-cleartext",
                "plain" : "password-cleartext",
                "password-encrypted" : "password-encrypted",
                "secure" : "password-encrypted",
                "GSSAPI" : "GSSAPI",
                "NTLM" : "NTLM",
              });
          break; // take first that we support
        } catch (e) { exception = e; }
      }
      if (!oO.auth)
        throw exception ? exception : "need proper <authentication> in XML";
      exception = null;

      if ("username" in oX ||
          // if password-based auth, we need a username,
          // so go there anyways and throw.
          oO.auth == "password-cleartext" ||
          oO.auth == "password-encrypted")
        oO.username = sanitize.string(oX.username);

      if ("password" in oX) {
        d.rememberPassword = true;
        oO.password = sanitize.string(oX.password);
      }

      try {
        // defaults are in accountConfig.js
        if ("addThisServer" in oX)
          oO.addThisServer = sanitize.boolean(oX.addThisServer);
        if ("useGlobalPreferredServer" in oX)
          oO.useGlobalPreferredServer =
              sanitize.boolean(oX.useGlobalPreferredServer);
      } catch (e) { logException(e); }

      // processed successfully, now add to result object
      if (!d.outgoing.hostname) // first valid
        d.outgoing = oO;
      else
        d.outgoingAlternatives.push(oO);
    } catch (e) { logException(e); exception = e; }
  }
  if (!d.outgoing.hostname)
    // throw exception for last server
    throw exception ? exception : "Need proper <outgoingServer> in XML file";
  exception = null;

  d.inputFields = new Array();
  for (let inputField of array_or_undef(xml.$inputField))
  {
    try {
      var fieldset =
      {
        varname : sanitize.alphanumdash(inputField["@key"]).toUpperCase(),
        displayName : sanitize.label(inputField["@label"]),
        exampleValue : sanitize.label(inputField.value)
      };
      d.inputFields.push(fieldset);
    } catch (e) { logException(e); } // for now, don't throw,
        // because we don't support custom fields yet anyways.
  }

  return d;
}

/**
 * <copied from="mailnews/base/prefs/content/accountcreation/accountConfig.js"
 * license="MPL" />
 *
 * This creates the class AccountConfig, which is a JS object that holds
 * a configuration for a certain account. It is *not* created in the backend
 * yet (use aw-createAccount.js for that), and it may be incomplete.
 *
 * Several AccountConfig objects may co-exist, e.g. for autoconfig.
 * One AccountConfig object is used to prefill and read the widgets
 * in the Wizard UI.
 * When we autoconfigure, we autoconfig writes the values into a
 * new object and returns that, and the caller can copy these
 * values into the object used by the UI.
 *
 * See also
 * <https://wiki.mozilla.org/Thunderbird:Autoconfiguration:ConfigFileFormat>
 * for values stored.
 */
function AccountConfig()
{
  this.incoming = this.createNewIncoming();
  this.incomingAlternatives = [];
  this.outgoing = this.createNewOutgoing();
  this.outgoingAlternatives = [];
  this.identity =
  {
    // displayed real name of user
    realname : "%REALNAME%",
    // email address of user, as shown in From of outgoing mails
    emailAddress : "%EMAILADDRESS%",
  };
  this.inputFields = [];
  this.domains = [];
};
AccountConfig.prototype =
{
  // @see createNewIncoming()
  incoming : null,
  // @see createNewOutgoing()
  outgoing : null,
  /**
   * Other servers which can be used instead of |incoming|,
   * in order of decreasing preference.
   * (|incoming| itself should not be included here.)
   * { Array of incoming/createNewIncoming() }
   */
  incomingAlternatives : null,
  outgoingAlternatives : null,
  // just an internal string to refer to this. Do not show to user.
  id : null,
  // who created the config.
  // { one of kSource* }
  source : 0,
  displayName : null,
  // { Array of { varname (value without %), displayName, exampleValue } }
  inputFields : null,
  // email address domains for which this config is applicable
  // { Array of Strings }
  domains : null,

  /**
   * Factory function for incoming and incomingAlternatives
   */
  createNewIncoming : function()
  {
    return {
      // { String-enum: "pop3", "imap", "nntp" }
      type : null,
      hostname : null,
      // { Integer }
      port : null,
      // May be a placeholder (starts and ends with %). { String }
      username : null,
      password : null,
      // { enum: 1 = plain, 2 = SSL/TLS, 3 = STARTTLS always, 0 = not inited }
      // ('TLS when available' is insecure and not supported here)
      socketType : 0,
      /**
       * true when the cert is invalid (and thus SSL useless), because it's
       * 1) not from an accepted CA (including self-signed certs)
       * 2) for a different hostname or
       * 3) expired.
       * May go back to false when user explicitly accepted the cert.
       */
      badCert : false,
      /**
       * How to log in to the server: plaintext or encrypted pw, GSSAPI etc.
       * Same as server pref "authMethod".
       */
      auth : 0,
      /**
       * Other auth methods that we think the server supports.
       * They are ordered by descreasing preference.
       * (|auth| itself is not included in |authAlternatives|)
       * {Array of Strings} (same as .auth)
       */
      authAlternatives : null,
      // in minutes { Integer }
      checkInterval : 10,
      loginAtStartup : true,
      // POP3 only:
      // Not yet implemented. { Boolean }
      useGlobalInbox : false,
      leaveMessagesOnServer : true,
      daysToLeaveMessagesOnServer : 14,
      deleteByAgeFromServer : true,
      // When user hits delete, delete from local store and from server
      deleteOnServerWhenLocalDelete : true,
      downloadOnBiff : true,
    };
  },
  /**
   * Factory function for outgoing and outgoingAlternatives
   */
  createNewOutgoing : function()
  {
    return {
      type : "smtp",
      hostname : null,
      port : null, // see incoming
      username : null, // see incoming. may be null, if auth is 0.
      password : null, // see incoming. may be null, if auth is 0.
      socketType : 0, // see incoming
      badCert : false, // see incoming
      auth : 0, // see incoming
      authAlternatives : null, // see incoming
      addThisServer : true, // if we already have an SMTP server, add this
      // if we already have an SMTP server, use it.
      useGlobalPreferredServer : false,
      // we should reuse an already configured SMTP server.
      // nsISmtpServer.key
      existingServerKey : null,
      // user display value for existingServerKey
      existingServerLabel : null,
    };
  },

  /**
   * Returns a deep copy of this object,
   * i.e. modifying the copy will not affect the original object.
   */
  copy : function()
  {
    // Workaround: deepCopy() fails to preserve base obj (instanceof)
    var result = new AccountConfig();
    for (var prop in this)
      result[prop] = deepCopy(this[prop]);

    return result;
  },
  isComplete : function()
  {
    return (!!this.incoming.hostname && !!this.incoming.port &&
         !!this.incoming.socketType && !!this.incoming.auth &&
         !!this.incoming.username &&
         (!!this.outgoing.existingServerKey ||
          (!!this.outgoing.hostname && !!this.outgoing.port &&
           !!this.outgoing.socketType && !!this.outgoing.auth &&
           !!this.outgoing.username)));
  },
};


// enum consts

// .source
AccountConfig.kSourceUser = 1; // user manually entered the config
AccountConfig.kSourceXML = 2; // config from XML from ISP or Mozilla DB
AccountConfig.kSourceGuess = 3; // guessConfig()


/**
 * <copied from="mailnews/base/prefs/content/accountcreation/accountConfig.js"
 * license="MPL" />
 * with many modifications to remove unneeded things
 *
 * Some fields on the account config accept placeholders (when coming from XML).
 *
 * These are the predefined ones
 * * %EMAILADDRESS% (full email address of the user, usually entered by user)
 * * %EMAILLOCALPART% (email address, part before @)
 * * %EMAILDOMAIN% (email address, part after @)
 * * %REALNAME%
 * as well as those defined in account.inputFields.*.varname, with % added
 * before and after.
 *
 * These must replaced with real values, supplied by the user or app,
 * before the account is created. This is done here. You call this function once
 * you have all the data - gathered the standard vars mentioned above as well as
 * all listed in account.inputFields, and pass them in here. This function will
 * insert them in the fields, returning a fully filled-out account ready to be
 * created.
 *
 * @param account {AccountConfig}
 * The account data to be modified. It may or may not contain placeholders.
 * After this function, it should not contain placeholders anymore.
 * This object will be modified in-place.
 *
 * @param emailfull {String}
 * Full email address of this account, e.g. "joe@example.com".
 * Empty of incomplete email addresses will/may be rejected.
 */
function replaceVariables(account, emailfull)
{
  let emailsplit = emailfull.split("@");
  let emaillocal = sanitize.nonemptystring(emailsplit[0]);
  let emaildomain = sanitize.nonemptystring(emailsplit[1]);

  let otherVariables = {};
  otherVariables.EMAILADDRESS = emailfull;
  otherVariables.EMAILLOCALPART = emaillocal;
  otherVariables.EMAILDOMAIN = emaildomain;

  account.incoming.username =
      _replaceVariable(account.incoming.username, otherVariables);
  account.incoming.hostname =
      _replaceVariable(account.incoming.hostname, otherVariables);
}

function _replaceVariable(variable, values)
{
  let str = variable;
  if (typeof(str) != "string")
    return str;

  for (let varname in values)
      str = str.replace("%" + varname + "%", values[varname]);

  return str;
}
