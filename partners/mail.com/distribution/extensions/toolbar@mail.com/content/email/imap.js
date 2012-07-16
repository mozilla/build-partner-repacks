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
 * This module checks for new mail, using the IMAP standard protocol.
 *
 * TODO
 * - password store
 * - RECENT vs. EXISTS
 * - FETCH mail contents
 * - multiple folders
 */
/**
 * Messages sent:
 * "logged-in" @see login-logic.js
 *    Means: We are 
 *    When: We authenticated with the IMAP server
 * "logged-out" @see login-logic.js
 *    When: We dropped the IMAP connection.
 *    TODO currently only sent when voluntarily dropped.
 *    Should handle case when server drops connection.
 * "mail-check" @see email-logic.js
 *    We checked the number of new mails, and the number changed.
 */

const EXPORTED_SYMBOLS = [ "IMAPAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/util/Socket.js");
Components.utils.import("resource://unitedtb/util/Auth.js");
Components.utils.import("resource://unitedtb/email/MIME.js");
Components.utils.import("resource://unitedtb/email/account-base.js");
var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/email.properties");


/**
 * Holds and manages login state of one IMAP account
 */
function IMAPAccount(accountID, isNew)
{
  this._folders = {};
  this._connections = [];
  BaseStandardAccount.call(this, accountID, isNew);
}
IMAPAccount.prototype =
{
  kType : "imap",

  /**
   * {Map of foldername -> {
   *   mailCount {Integer}
   *   newMailCount {Integer}
   *   emails {Array of RFC822Mail}
   * }}
   */
  _folders : null, 

  /**
   * Lists |IMAPConnection|s for this account,
   * but only those which are open.
   * {Array of IMAPConnection}
   */
  _connections : null,

  get isLoggedIn()
  {
    return !!this._connections.length;
  },

  /**
   * Amount of new mails in all known folders.
   * New here means mails not seen by any IMAP client (called "RECENT" in IMAP).
   * It's NOT the unread mails (called "UNSEEN" in IMAP).
   * {Integer} -1 = not checked
   */
  get newMailCount()
  {
    var sum = 0;
    for each (let folder in this._folders)
    {
      if (folder.newMailCount)
        sum += folder.newMailCount;
    }
    return sum;
  },

  /**
   * Some of the unchecked mails (headers) in all folders
   * {Array of RFC822Mail} 
   */
  get emails()
  {
    var coll = [];
    for each (let folder in folders)
    {
      if (folder.emails && folder.emails.length)
        coll = coll.concat(folder.emails);
    }
    return coll;
  },

  /**
   * @param peekMails {Integer}  Also fetch the email headers.
   *   Fetch this many mails maximum. Pass 0 to only get the number of mails.
   * @param continuously {Boolean}
   *    if false, check only once. Logs out afterward.
   *    if true, keeps the connection open via IDLE and waits for the server
   *        to tell us about new mail arrivals.
   *        Calls notifyCallback several times!
   * @param notifyCallback {Function(newMailCount {Integer}),
   *    emails {Array of RFC822Mail})}
   *    May be called several times, if continuously == true.
   *    |emails| is null, if peekMails == false.
   */
  login : function(peekMails, continuously, notifyCallback, errorCallback)
  {
    sanitize.integer(peekMails);
    sanitize.boolean(continuously);
    var conn = new IMAPConnection(this, errorCallback);
    // IMAPConnection adds itself to this._connections
    var self = this;
    conn.login(function()
    {
      notifyGlobalObservers("logged-in", { account: self });
      // TODO NAMESPACE
      // TODO LIST folders
      conn.checkMailsFolder("INBOX", peekMails, continuously,
      function(newMailCount)
      {
        notifyCallback(newMailCount);
        notifyGlobalObservers("mail-check", { account: self });
        if (!continuously)
          conn.logout();
      }, errorCallback);
    }, errorCallback);
  },

  mailCheck : function(peekMails, continuously, notifyCallback, errorCallback)
  {
    // TODO
    this.login(peekMails, continuously, notifyCallback, errorCallback);
  },

  _getFolderInfo : function(foldername)
  {
    if ( !this._folders[foldername])
    {
      this._folders[foldername] = {
        newMailCount : 0,
        mailCount : 0,
        emails : [],
      };
    }
    return this._folders[foldername];
  },

  /**
   * Closes open connections with the server,
   * and stops any possible ongoing periodic checks.
   */
  logout : function(successCallback, errorCallback)
  {
    assert(typeof(successCallback) == "function", "need successCallback");
    assert(typeof(errorCallback) == "function", "need errorCallback");

    this._deleteStoredPassword();

    for each (let conn in this._connections.slice(0)) // logout modifies _conns
      conn.logout();
    this._folders = [];
    successCallback();
    var self = this;
    notifyGlobalObservers("mail-check", { account: self });
    notifyGlobalObservers("logged-out", { account: self });
  },
}
extend(IMAPAccount, BaseStandardAccount);



// IMAP Implementation

/**
 * @param errorCallback   Called when the connection drops.
 */
function IMAPConnection(account, errorCallback)
{
  this._capability = [];
  assert(account instanceof IMAPAccount);
  this._account = account;
  var self = this;
  this._socket = new IMAPClientSocket({
    hostname : self._account.hostname,
    port : self._account.port,
    ssl : self._account.ssl,
    errorCallback : errorCallback,
  });
}
IMAPConnection.prototype =
{
  /**
   * {Map of server capability (string per IMAP spec) -> true}
   */
  _capability : null,

  _loggedIn : false,

  /**
   * Opens a new connection to the server.
   */
  login : function(successCallback, errorCallback)
  {
    assert(typeof(successCallback) == "function");
    assert(typeof(errorCallback) == "function");
    assert( !this._loggedIn, "already logged in");
    assert(this._account._password, "need password before trying to log in");
    var self = this;
    var callerErrorCallback = errorCallback;
    errorCallback = function(e)
    {
      self.logout();
      callerErrorCallback(e);
    };

    var socket = this._socket;
    this._openConnection(function()
    {
      var done = function()
      {
        self._loggedIn = true;
        self._account._connections.push(self);
        successCallback();
      };
      var username = self._account.username;
      var password = self._account._password;
      if (self._capability["AUTH=CRAM-MD5"])
      {
        socket.sendAndReceiveIMAP("AUTHENTICATE CRAM-MD5",
        function(line)
        {
          var challenge = sanitize.nonemptystring(line);
          var cred = AuthCRAMMD5.encodeLine(username, password, challenge);
          socket.sendLines([ cred ]);
        }, null, done, errorCallback);
      }
      else if (self._capability["AUTH=PLAIN"])
      {
        socket.sendAndReceiveIMAP("AUTHENTICATE PLAIN",
        function()
        {
          var cred = AuthPLAIN.encodeLine(username, password);
          socket.sendLines([ cred ]);
        }, null, done, errorCallback);
      }
      else if ( !self._capability["LOGINDISABLED"])
      {
        socket.sendAndReceiveIMAP("LOGIN " +
            socket.quoteArg(username) + " " + socket.quoteArg(password),
            null, null, done, errorCallback);
      }
      else
        throw new Exception(gStringBundle.get("imap.noLoginMechs.error",
                                              [ self._account.hostname ]));
    }, errorCallback);
  },

  _openConnection : function(successCallback, errorCallback)
  {
    var self = this;
    this._socket.openSocket(function()
    {
      // Wait for server response
      self._socket.receiveIMAP(null, function(line)
      {
        // Got "* OK servername" response
        self._doSTARTTLSIfNecessary(function()
        {
          self._getCAPs(successCallback, errorCallback);
        }, errorCallback);
      },
      function(okMsg)
      {
        // command success: there was no command, so this never comes
      }, errorCallback);
    }, errorCallback);
  },

  _doSTARTTLSIfNecessary : function(successCallback, errorCallback)
  {
    if (this._account.ssl != 3)
    {
      successCallback();
      return;
    }
    // Don't bother checking CAPS. If it's configured in prefs, we require it.

    assert(this._socket._socket instanceof Ci.nsISocketTransport);
    var sslControl = this._socket._socket.securityInfo;
    if (!(sslControl instanceof Ci.nsISSLSocketControl)) // implicitly does QI
      throw new Exception("nsISSLSocketControl not found");

    this._socket.sendAndReceiveIMAP("STARTTLS", null, null,
    function()
    {
      // |Socket| implements SSL notification callbacks
      sslControl.StartTLS(); // apparently sync, blocks UI :-(
      successCallback();
    }, errorCallback);
  },

  _getCAPs : function(successCallback, errorCallback)
  {
    var self = this;
    this._socket.sendAndReceiveIMAP("CAPABILITY", null,
    function(line)
    {
      if (line.substr(0, 11) != "CAPABILITY ")
        return;
      line = line.substr(11);
      for each (let cap in line.split(" "))
      {
        cap = sanitize.nonemptystring(cap);
        if (!/^[a-zA-Z0-9\-\_=\+]*$/.test(cap))
          continue;
        self._capability[cap] = true;
      }
    },
    successCallback, errorCallback);
  },

  /**
   * @param peekMails {Integer}  Also fetch the email headers.
   *   Fetch this many mails maximum. Pass 0 to only get the number of mails.
   * @param continuously {Boolean}
   *    if false, check only once. Logs out afterward.
   *    if true, keeps the connection open via IDLE and waits for the server
   *        to tell us about new mail arrivals.
   *        Calls notifyCallback several times!
   * @param notifyCallback {Function(newMailCount {Integer}),
   *    emails {Array of RFC822Mail})}
   *    May be called several times, if continuously == true.
   *    |emails| is null, if peekMails == false.
   */
  checkMailsFolder : function(foldername, peekMails, continuously,
                              notifyCallback, errorCallback)
  {
    assert(this._loggedIn, "Please login() first");
    sanitize.nonemptystring(foldername);
    sanitize.integer(peekMails);
    sanitize.boolean(continuously);
    assert(typeof(notifyCallback) == "function");
    assert(typeof(errorCallback) == "function");
    var self = this;
    var callerErrorCallback = errorCallback;
    errorCallback = function(e)
    {
      self.logout();
      callerErrorCallback(e);
    };

    var folderInfo = this._account._getFolderInfo(foldername);

    var socket = this._socket;
    socket.sendAndReceiveIMAP("EXAMINE " + socket.quoteArg(foldername), null,
    function(line)
    {
      self._folderInfoReponse(folderInfo, line);
    },
    function(okMsg)
    {
      // Note: Must run _haveNewMail() only after we have one full statement
      // EXISTS and RECENT, because we'll otherwise consider the
      // increate of EXISTS from 0 (start) to the real number as new mail

      // TODO FETCH

      // notifyCallback must be called at least once
      notifyCallback(folderInfo.newMailCount);
      folderInfo.previousNewMailCount = folderInfo.newMailCount;
      folderInfo.previousMailCount = folderInfo.mailCount;
      if (!continuously)
        return;

      if (self._capability["IDLE"])
      {
        // RFC 2177

        // Remove timeout on our side
        assert(socket._socket instanceof Ci.nsISocketTransport);
        const PR_UINT32_MAX = Math.pow(2, 32) - 1;
        socket._socket.setTimeout(Ci.nsISocketTransport.TIMEOUT_READ_WRITE, PR_UINT32_MAX);

        var idle = function()
        {
          socket.sendAndReceiveIMAP("IDLE", null,
          function(line)
          {
            self._folderInfoReponse(folderInfo, line);
            self._haveNewMail(folderInfo, notifyCallback);
          },
          function(okMsg) // server response to "DONE" received
          {
            idle(); // loop
          }, errorCallback);
          self._poller = runAsync(function()
          {
            socket.sendLines(["DONE"]);
          }, 28*60*1000); // 28min
          // There's no need to implement a nice loop exit.
          // The only way is to stop is logout(), which cuts the connection and
          // prevents the runAsync = DONE.
        }
        idle();
      }
      else
      {
        self._poller = runPeriodically(function()
        {
          //socket.sendAndReceiveIMAP("EXAMINE " + socket.quoteArg(foldername), null,
          socket.sendAndReceiveIMAP("NOOP", null,
          function(line)
          {
            self._folderInfoReponse(folderInfo, line);
            self._haveNewMail(folderInfo, notifyCallback);
          },
          function(okMsg)
          {
          }, errorCallback);
        }, self._account._interval * 1000);
      }
    }, errorCallback);
  },

  /**
   * Parses "* 4 RECENT" response to EXAMIME or IDLE
   */
  _folderInfoReponse : function(folderInfo, line)
  {
    var spl = line.split(" ");
    if (spl.length < 2)
      return;
    if (spl[1] == "RECENT")
    {
      folderInfo.newMailCount = sanitize.integer(spl[0]);
    }
    else if (spl[1] == "EXISTS")
    {
      folderInfo.mailCount = sanitize.integer(spl[0]);
    }
  },

  _haveNewMail : function(folderInfo, notifyCallback)
  {
    //debug("have new mail?");    
    //debugObject(folderInfo, "folderInfo");
    if (folderInfo.newMailCount != folderInfo.previousNewMailCount)
    {
      //debug("RECENT changed");
      notifyCallback(folderInfo.newMailCount);
    }
    /*
    // When another mail client is active, it gets the RECENT instead of us.
    // Also, imap.web.de server is broken and never reports RECENT (imap.gmx.net works).
    // So, watch changes in EXISTS.
    else if ( !folderInfo.newMailCount && !folderInfo.previousNewMailCount &&
        typeof(folderInfo.previousMailCount) == "number" &&
        folderInfo.mailCount != folderInfo.previousMailCount)
    {
      //debug("EXISTS changed");
      // TODO issue "SEARCH UNSEEN", but we might be in the middle
      // of IDLE, so we'd have to close and restart that. Bad IMAP protocol!
      // So, for now, accept that the new mail will be shown only for |interval| time.
      notifyCallback(folderInfo.mailCount - folderInfo.previousMailCount);
    }
    */
    folderInfo.previousNewMailCount = folderInfo.newMailCount;
    folderInfo.previousMailCount = folderInfo.mailCount;
  },

  logout : function()
  {
    this._loggedIn = false;
    if (this._poller)
      this._poller.cancel();
    this._socket.close();
    arrayRemove(this._account._connections, this);
  },

}

/**
 * This implements the basic IMAP protocol syntax, i.e.
 * how commands and responses are passed.
 *
 * Parses IMAP command responses ala
 * "* some info", "+ continue", "A03 OK msg" and "A03 BAD error msg".
 * Per IMAP spec, the latter two are called "tagged" responses,
 * the former two ("* " and "+ ") are called "untagged".
 * Although IMAP allows it, you should not send 2 commands at the same time
 * using this implementation.
 */
function IMAPClientSocket(p)
{
  p.separator = "newline";
  p.charset = "ASCII";
  this.protocolDebug = true;
  LineSocket.call(this, p);
  this.registerReceiveLinesCallback(makeCallback(this, this._receiveLinesToIMAP));
}
IMAPClientSocket.prototype =
{
  _currentLineTag : 0,

  sendIMAPCommand : function(line)
  {
    this._currentLineTag++;
    this.sendLines([ this._currentLineTag + " " + line ]);
  },
  receiveIMAP : function(continuationResponseCallback, infoResponseCallback,
      successResponseCallback, errorResponseCallback)
  {
    assert( !continuationResponseCallback || typeof(continuationResponseCallback) == "function");
    assert( !infoResponseCallback || typeof(infoResponseCallback) == "function");
    assert(typeof(successResponseCallback) == "function");
    assert(typeof(errorResponseCallback) == "function");

    this._continuationResponseCallback = continuationResponseCallback ?
        continuationResponseCallback : function() {};
    this._infoResponseCallback = infoResponseCallback ?
        infoResponseCallback : function() {};
    this._successResponseCallback = successResponseCallback;
    this._errorResponseCallback = errorResponseCallback;
  },
  /**
   * @param continuationResponseCallback {Function(line {String})}
   *    The server sent a "+" line
   *    Typically, you have to react to this by sending another raw line
   *    using sendLines() (*not* sendIMAPCommand()).
   * @param infoResponseCallback {Function(line {String})}
   *    The server sent a "*" line
   *    This is normally called several times, once per info line.
   * @param successResponseCallback {Function(line {String})}
   *    The server sent a "OK" result to this specific command.
   *    This is called only once.
   * @param errorResponseCallback {Function(line {String})}
   *    The server sent a "NO", "BAD" or invalid line.
   *    This may be called several times, esp. if the server does nonsense.
   */
  sendAndReceiveIMAP : function(sendLine,
      continuationResponseCallback, infoResponseCallback,
      successResponseCallback, errorResponseCallback)
  {
    this.receiveIMAP(continuationResponseCallback, infoResponseCallback,
        successResponseCallback, errorResponseCallback);
    this.sendIMAPCommand(sendLine);
  },

  //  RFC 3501 Sec 2.2.1 and 2.2.2 and 7
  _receiveLinesToIMAP : function(inLines)
  {
    var expectedTagSpace = this._currentLineTag + " ";
    for each (let line in inLines)
    {
      if (line == "")
        continue;
      else if (line[0] == "+")
        this._continuationResponseCallback(line.substr(2));
      else if (line.substr(0, 5) == "* BAD")
        this._errorResponseCallback(new IMAPSyntaxErrorResponse(
            line.substr(6), this.hostname));
      else if (line[0] == "*")
        this._infoResponseCallback(line.substr(2));
      else if (line.substr(0, expectedTagSpace.length) == expectedTagSpace)
      {
        line = line.substr(expectedTagSpace.length);
        if (line.substr(0, 2) == "OK")
        {
          this._successResponseCallback(line.substr(3));

          // ensure that the successCallback is called only once
          /* TODO is called when it shouldn't be
          this._successResponseCallback = function(line)
          {
            this._errorResponseCallback(new UnexpectedIMAPResponse(
                line, this.hostname));
          };
          */
        }
        else if (line.substr(0, 2) == "NO")
          this._errorResponseCallback(new IMAPErrorResponse(
              line.substr(3), this.hostname));
        else if (line.substr(0, 3) == "BAD")
          this._errorResponseCallback(new IMAPSyntaxErrorResponse(
              line.substr(4), this.hostname));
        else if (line.substr(0, 3) == "BYE")
          this._errorResponseCallback(new IMAPErrorResponse(
              line.substr(4), this.hostname));
        else
          this._errorResponseCallback(new UnexpectedIMAPResponse(
              line, this.hostname));
      }
      else
        this._errorResponseCallback(new UnexpectedIMAPResponse(
            line, this.hostname));
    }
  },

  quoteArg : function(arg)
  {
    return '"' + arg + '"';
  },
},
extend(IMAPClientSocket, LineSocket);

function UnexpectedIMAPResponse(badLine, hostname)
{
  Exception.call(this, gStringBundle.get("imap.unexpected.error", [ hostname, badLine ]));
}
extend(UnexpectedIMAPResponse, Exception);

function IMAPErrorResponse(serverErrorMsg, hostname)
{
  Exception.call(this, gStringBundle.get("imap.server.error", [ hostname, serverErrorMsg ]));
}
extend(IMAPErrorResponse, Exception);

function IMAPSyntaxErrorResponse(serverErrorMsg, hostname)
{
  Exception.call(this, gStringBundle.get("imap.syntax.error", [ hostname, serverErrorMsg ]));
}
extend(IMAPSyntaxErrorResponse, Exception);
