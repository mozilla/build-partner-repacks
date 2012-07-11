/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
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
 * Ben Bucksch <ben.bucksch  beonex.com>
 * Portions created by the Initial Developer are Copyright (C) 2008-2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  David Ascher <dascher@mozillamessaging.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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
 * Some common, generic functions
 */

const EXPORTED_SYMBOLS = [ "Cc", "Ci", "Cu", "extend", "mixInto", "assert",
  "makeCallback", "sqlCallback", "loadJS", "runAsync", "runPeriodically",
  "makeNSIURI", "readURLasUTF8", "readFile", "writeFile", "splitLines",
  "ioService", "promptService", "ourPref", "generalPref", "privateBrowsing",
  "getStringBundle", "StringBundle", "getExtensionFullVersion", "findSomeBrowserWindow",
  "Exception", "NotReached", "Abortable", "TimeoutAbortable", "IntervalAbortable",
  "SuccessiveAbortable", "XPCOMUtils",  "getProfileDir", "getSpecialDir", "getOS",
  "arrayRemove", "arrayContains", "deepCopy", "ObserveTopic", "getErrorText",
  "errorInBackend", "kDebug", "debug", "debugObject", "dumpObject" ];

// to not pullute Firefox global namespace, load into a scope using subscriptloader
// (same for util/*.js)

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://unitedtb/util/Preferences.js");
Cu.import("resource://unitedtb/util/StringBundle.js");
Cu.import("resource://unitedtb/build.js");

XPCOMUtils.defineLazyServiceGetter(this, "ioService",
    "@mozilla.org/network/io-service;1", "nsIIOService");
XPCOMUtils.defineLazyServiceGetter(this, "promptService",
    "@mozilla.org/embedcomp/prompt-service;1", "nsIPromptService");
XPCOMUtils.defineLazyServiceGetter(this, "privateBrowsing",
    "@mozilla.org/privatebrowsing;1", "nsIPrivateBrowsingService");
XPCOMUtils.defineLazyServiceGetter(this, "scriptLoader",
    "@mozilla.org/moz/jssubscript-loader;1", "mozIJSSubScriptLoader");

XPCOMUtils.defineLazyGetter(this, "ourPref", function()
{
  return new Preferences("extensions.unitedinternet.");
});
XPCOMUtils.defineLazyGetter(this, "generalPref", function()
{
  return Preferences;
});

function getProfileDir()
{
  return getSpecialDir("ProfD");
}
function getSpecialDir(key)
{
  return Cc["@mozilla.org/file/directory_service;1"]
      .getService(Ci.nsIProperties)
      .get(key, Ci.nsILocalFile);
}

/**
 * Create a subtype
 */
function extend(child, supertype)
{
  child.prototype.__proto__ = supertype.prototype;
}

/**
 * Copy properties of |source| into |target|
 */
function mixInto(source, target)
{
  for (var property in source)
  {
    if (typeof(target[property]) == "undefined" &&
        // avoid execution of getters/setters
        !source.__lookupGetter__(property) &&
        !source.__lookupSetter__(property))
    {
      target[property] = source[property];
    }
  }
}

function assert(test, errorMsg)
{
  if (!test)
    throw new NotReached(errorMsg ? errorMsg : "Bug: assertion failed");
}

function makeCallback(obj, func)
{
  return function()
  {
    return func.apply(obj, arguments);
  }
}

/**
 * Shortcut for mozISubScriptLoader
 *
 * @param url {String} the URL of the JavaScript file to load
 * @param scope {Object} script will be loaded into this object
 */
function loadJS(url, scope)
{
  scriptLoader.loadSubScript(url, scope);
}


/**
 * Runs the given function sometime later.
 *
 * For reliable operation (esp. beyond 0), you must save
 * the returned Abortable until the function executed.
 *
 * @param func {Function}
 * @param delay {Integer} in ms. Default 0.
 * @returns {Abortable}
 */
function runAsync(func, delay)
{
  if (!delay)
    delay = 0;
  //setTimeout(func, delay);
  var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  timer.initWithCallback(function()
  {
    try {
      func();
    } catch (e) { debug(e); }
  }, delay, timer.TYPE_ONE_SHOT);

  return new TimerAbortable(timer);
}

/**
 * Runs the given function periodically, i.e. in intervals
 *
 * For reliable operation, you must save the returned
 * Abortable until you abort. When the Abortable goes
 * out of scope, the callbacks may or may not cease
 * to be fired.
 *
 * @param func {Function}
 * @param interval {Integer} in ms
 * @returns {Abortable}
 */
function runPeriodically(func, interval)
{
  assert(typeof(interval) == "number" && interval > 0);
  //setInterval(func, interval);
  //var next = new Date();
  //next.setSeconds(next.getSeconds() + interval/1000);
  //debug("run periodically every " + (interval/1000) +
  //    "s, first time at " + next.toLocaleTimeString());
  var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  timer.initWithCallback(function()
  {
    try {
      func();
    } catch (e) { debug(e); }
  }, interval, timer.TYPE_REPEATING_SLACK);

  return new TimerAbortable(timer);
}

function TimerAbortable(timer)
{
  assert(timer instanceof Ci.nsITimer);
  this._timer = timer;
}
TimerAbortable.prototype =
{
  cancel : function()
  {
    this._timer.cancel();
  },
};
extend(TimerAbortable, Abortable);


/**
 * @param uriStr {String}
 * @result {nsIURI}
 */
function makeNSIURI(uriStr)
{
  return ioService.newURI(uriStr, null, null);
}


/**
 * @param nsresult {Integer}  an XPCOM error code
 * @returns {String} an error message
 *     Mostly based on the C++ macro constants, so
 *     may be very technical and in English.
 *     If no name found, returns the error code in hex.
 * @see <https://developer.mozilla.org/en/Table_Of_Errors>
 */
function getErrorText(nsresult)
{
  assert(typeof(nsresult) == "number");
  // name is the C++ macro name of the error
  // code is the numeric error code
  for (let name in Components.results)
  {
    let code = Components.results[name];
    if (code == nsresult)
    {
      // Just base the text on the C++ macro name.
      // If we wanted to make a nice human-readable, translated error msg,
      // we could insert a string bundle read right here.
      let text = name.toString().replace("NS_ERROR_", "")
          .replace("_", " ").toLowerCase();
      return text;
    }
  }
  // Just return error code as hex code
  return "0x" + nsresult.toString(16).toUpperCase();
}


/**
 * Reads UTF8 data from a URL.
 *
 * @param uri {nsIURI or String}   what you want to read
 * @return {String}   the contents of the file, as one long string
 */
function readURLasUTF8(uri)
{
  assert(uri && (uri instanceof Ci.nsIURI || typeof(uri) == "string"), "uri must be an nsIURI or string");
  try {
    var chan = uri instanceof Ci.nsIURI ? ioService.newChannelFromURI(uri) :
         ioService.newChannel(uri, null, null);
    var is = Cc["@mozilla.org/intl/converter-input-stream;1"]
             .createInstance(Ci.nsIConverterInputStream);
    is.init(chan.open(), "UTF-8", 1024,
            Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

    var content = "";
    var strOut = new Object();
    try {
      while (is.readString(1024, strOut) != 0)
        content += strOut.value;
    // catch in outer try/catch
    } finally {
      is.close();
    }

    return content;
  } catch (e) {
    // TODO this has a numeric error message. We need to ship translations
    // into human language.
    throw e;
  }
}


/**
 * Read a file from disk, as UTF-8, and return the contents as plaintext.
 * @param file {nsIFile}
 * @return {Array of String} contents of file. one string per line.
 */
function readFile(file)
{
  assert(file instanceof Ci.nsIFile, "argument must be an nsIFile");
  try {
    var fileis = Cc["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Ci.nsIFileInputStream);
    const MODE_READONLY = 1;
    const PERMISSIONS = 420; // 0644
    fileis.init(file, MODE_READONLY, PERMISSIONS, false);
    try {
      var convis = Cc["@mozilla.org/intl/converter-input-stream;1"]
          .createInstance(Ci.nsIConverterInputStream);
      convis.init(fileis, "UTF-8", 0, 0x0000);
      try {
        assert(convis instanceof Ci.nsIUnicharLineInputStream);
        var result = new Array();
        var line = { value : null };
        var haveMore = true;
        while (haveMore)
        {
          haveMore = convis.readLine(line)
          result.push(line.value);
        }
      } finally {
        convis.close(); // also closes the underlying stream
      }
    } finally {
      fileis.close(); // is already closed if no exception was thrown by convOS.init
    }
    return result;
  } catch (e) {
    throw "Reading file " + file.path + " failed: " + e;
  }
}


/**
 * Writes a string to a file, as UTF-8.
 * @param  file {nsIFile}  the file to write to.
 *     If already existing, it will be overwritten. TODO or will fail?
 * @param  content {String} what to write to the file
 */
function writeFile(file, content)
{
  assert(file instanceof Ci.nsIFile, "file argument must be an nsIFile");
  try {
    var fileos = Cc["@mozilla.org/network/file-output-stream;1"]
       .createInstance(Ci.nsIFileOutputStream);
    // @see <http://mxr.mozilla.org/mozilla-central/source/nsprpub/pr/include/prio.h>
    const PERM = 420; // 0644
    fileos.init(file, 0x02 | 0x08 | 0x20, PERM, 0); // write, create, truncate
    try {
      var convos = Cc["@mozilla.org/intl/converter-output-stream;1"]
          .createInstance(Ci.nsIConverterOutputStream);
      convos.init(fileos, "UTF-8", 0, 0x0000);
      try {
        var success = convos.writeString(content);
        if (!success)
          throw "writeString() failed";
      } finally {
        convos.close(); // also closes the underlying stream
      }
    } finally {
      fileos.close(); // is already closed if no exception was thrown by convOS.init
    }
  } catch (e) {
    throw "Writing file " + file.path + " failed: " + e;
  }
}

/**
 * Takes a string (which is typically the content of a file,
 * e.g. the result returned from readURLUTF8() ), and splits
 * it into lines, and returns an array with one string per line
 *
 * Linebreaks are not contained in the result,,
 * and all of \r\n, (Windows) \r (Mac) and \n (Unix) counts as linebreak.
 *
 * @param content {String} one long string with the whole file
 * @return {Array of String} one string per line (no linebreaks)
 */
function splitLines(content)
{
  content = content.replace("\r\n", "\n");
  content = content.replace("\r", "\n");
  return content.split("\n");
}

// TODO Use https://wiki.mozilla.org/Labs/JS_Modules#StringBundle
/**
 * @param bundleURI {String}   chrome URL to properties file
 * @return nsIStringBundle
 */
function getStringBundle(bundleURI)
{
  try {
    return Cc["@mozilla.org/intl/stringbundle;1"]
           .getService(Ci.nsIStringBundleService)
           .createBundle(bundleURI);
  } catch (e) {
    throw new Exception("Failed to get stringbundle URI <" + bundleURI + ">. Error: " + e);
  }
}

/**
 * Get our own version
 */
function getExtensionFullVersion()
{
  return version; // build.js
}

/**
 * The operating system we're running on currently.
 *
 * @returns {String-enum}
 *     "win" =  Windows
 *     "mac" =  Mac OS X
 *     "unix" =  Linux, BSD, Solaris etc.
 *     "android" = Android
 *     "other" = anything not fitting above
 */
function getOS()
{
  switch(Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS)
  {
    case "WINNT":
      return "win";
    case "Darwin":
      return "mac";
    case "Linux":
    case "FreeBSD":
    case "NetBSD":
    case "OpenBSD":
    case "DragonFly":
    case "SunOS": // Solaris
    case "IRIX64":
    case "AIX":
    case "HP-UX":
      return "unix";
    case "Android":
      return "android";
    default:
      return "other";
  }
}

/**
 * When you need to go to the UI, from the JSM.
 * Avoid at all costs.
 */
function findSomeBrowserWindow()
{
  return Cc["@mozilla.org/appshell/window-mediator;1"]
     .getService(Ci.nsIWindowMediator)
     .getMostRecentWindow("navigator:browser");
}


function Exception(msg)
{
  this._message = msg;

  // get stack
  try {
    not.found.here += 1; // force a native exception ...
  } catch (e) {
    this.stack = e.stack; // ... to get the current stack
  }
  //debug("ERROR (exception): " + msg + "\nStack:\n" + this.stack);
}
Exception.prototype =
{
  get message()
  {
    return this._message;
  },
  toString : function()
  {
    return this._message;
  }
}

function NotReached(msg)
{
  Exception.call(this, msg);
}
extend(NotReached, Exception);


/**
 * A handle for an async function which you can cancel.
 * The async function will return an object of this type (a subtype)
 * and you can call cancel() when you feel like killing the function.
 */
function Abortable()
{
}
Abortable.prototype =
{
  cancel : function()
  {
  }
}

/**
 * Utility implementation, for allowing to abort a setTimeout.
 * Use like: return new TimeoutAbortable(setTimeout(function(){ ... }, 0));
 * @param setTimeoutID {Integer}  Return value of setTimeout()
 */
function TimeoutAbortable(setTimeoutID)
{
  this._id = setTimeoutID;
}
TimeoutAbortable.prototype =
{
  cancel : function()
  {
    clearTimeout(this._id);
  }
}
extend(TimeoutAbortable, Abortable);

/**
 * Utility implementation, for allowing to abort a setTimeout.
 * Use like: return new TimeoutAbortable(setTimeout(function(){ ... }, 0));
 * @param setIntervalID {Integer}  Return value of setInterval()
 */
function IntervalAbortable(setIntervalID)
{
  this._id = setIntervalID;
}
IntervalAbortable.prototype =
{
  cancel : function()
  {
    clearInterval(this._id);
  }
}
extend(IntervalAbortable, Abortable);


// Allows you to make several network calls, but return only one Abortable object.
function SuccessiveAbortable()
{
  this._current = null;
}
SuccessiveAbortable.prototype =
{
  set current(abortable)
  {
    assert(abortable instanceof Abortable || abortable == null,
        "need an Abortable object (or null)");
    this._current = abortable;
  },
  get current()
  {
    return this._current;
  },
  cancel : function()
  {
    if (this._current)
      this._current.cancel();
  },
}
extend(SuccessiveAbortable, Abortable);


/**
 * Callback for asynchronous SQL queries.
 *
 * This class implements mozIStorageStatementCallback. Use with
 * mozIStorageStatement::executeAsync.
 *
 * If the query produces no results, the first callback
 * will be called with the empty array.
 * The second callback is called in case of an error.
 * 
 * Only one of the provided callbacks is called. The callback
 * which is called exactly once.
 *
 * @param successCallback {Function(rows)} rows {Array of mozIStorageRow}
 * @param errorCallback {Function(msg)} msg {String} user-displayable error message
 */
function sqlCallback(successCallback, errorCallback)
{
  assert(typeof(successCallback) == "function");
  assert(typeof(errorCallback) == "function");
  this._successCallback = successCallback;
  this._errorCallback = errorCallback;
  this._results = [];
}
sqlCallback.prototype =
{
  /**
   * @param result {mozIStoragerResultSet} <https://developer.mozilla.org/en/Storage#Asynchronously>
   */
  handleResult : function(resultSet)
  {
    for (let row = resultSet.getNextRow(); row; row = resultSet.getNextRow())
    {
      this._results.push(row);
    }
  },
  /**
   * @param error {mozIStorageError} <https://developer.mozilla.org/en/mozIStorageError>
   */
  handleError : function(error)
  {
    if (! this._error)
      this._error = error.message;
    else
      errorInBackend("Another SQL error: " + error.message);
  },
  handleCompletion : function(reason)
  {
    if (this._error || reason != Ci.mozIStorageStatementCallback.REASON_FINISHED)
      this._errorCallback(this._error ? this._error : "Query canceled or aborted");
    else
    {
      try {
        this._successCallback(this._results);
      } catch (e) { this._errorCallback(e); } 
    }
  }
}


/**
 * UNTESTED
 * Get notified for a certain nsIObserver event from Mozilla.
 *
 * This wraps nsIObserver, and listens for a one-time notification.
 * You need to pass the topic to listen to.
 *
 * In the filterFunc, you can discard all notifications of a certain topic
 * that are not relevant to you, e.g. look for a certain nsIChannel or URL.
 *
 * @param once {Boolean}   Unhook when the callback is called.
 * @param topic {String}   nsIObserver topic,
 *     e.g. "http-on-examine-response" or "http-on-modify-request"
 * @param filterFunc {Function(subject)} (Optional)
 *     Called for every |topic| notification. If this returns true,
 *     |callback| is called and, if |once| is true, the observer removed.
 *     If this returns false, nothing happens and it will continue
 *     to observe for other events.
 *     subject {Object}  nsIObserver subject.
 *         For network notifications, this is an {nsIChannel}.
 *         So, you can check e.g. subject.originalURI.spec == "http://...";
 * @param callback {Function(subject, data)}
 *     Do what you actually wanted to do in the case of the event.
 *     subject {Object}  nsIObserver subject
 *     data {Object}  nsIObserver data
 */
function ObserveTopic(once, topic, filterFunc, callback)
{
  this._once = !!once;
  this._topic = topic.toString();
  assert(typeof(filterFunc) == "function" || !filterFunc, "filterFunc is not a function");
  assert(typeof(callback) == "function", "need callback");
  this._filterFunc = filterFunc;
  this._callback = callback;

  this._hookup();
}
ObserveTopic.prototype =
{
  _once : true,
  _topic : null,
  _filterFunc : null,
  _callback : null,

  observe: function(subject, topic, data)
  {
    try {
      if (topic != this._topic)
        return;
      if (this._filterFunc && !this._filterFunc(subject, data))
        return;
      if (this._once)
        this.unhook();
      this._callback(subject, data);
    } catch (e) { errorInBackend(e); }
  },
  _hookup : function()
  {
    var observerService = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);
    observerService.addObserver(this, this._topic, false);
  },
  unhook : function()
  {
    var observerService = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);
    observerService.removeObserver(this, this._topic);
  },
}


function arrayRemove(array, element, all)
{
  var found = 0;
  var pos = 0;
  while ((pos = array.indexOf(element, pos)) != -1)
  {
    array.splice(pos, 1);
    found++
    if ( ! all)
      return found;
  }
  return found;
}

function arrayContains(array, element)
{
  return array.indexOf(element) != -1;
}


function deepCopy(org)
{
  if (typeof(org) == "undefined")
    return undefined;
  if (org == null)
    return null;
  if (typeof(org) == "string")
    return org;
  if (typeof(org) == "number")
    return org;
  if (typeof(org) == "boolean")
    return org == true;
  if (typeof(org) == "function")
    return org;
  if (typeof(org) != "object")
    throw "can't copy objects of type " + typeof(org) + " yet";

  //TODO still instanceof org != instanceof copy
  //var result = new org.constructor();
  var result = new Object();
  if (typeof(org.length) != "undefined")
    var result = new Array();
  for (var prop in org)
    result[prop] = deepCopy(org[prop]);
  return result;
}

//kDebug defined in build.js
var kDebugAlsoOnErrorConsole = true;

XPCOMUtils.defineLazyServiceGetter(this, "gConsoleService",
    "@mozilla.org/consoleservice;1", "nsIConsoleService");

function debug(text)
{
  if (!kDebug)
    return;
  dump(text + "\n");
  if (!kDebugAlsoOnErrorConsole)
    return;

  gConsoleService.logStringMessage(text);
}

function debugObject(obj, name, maxDepth, curDepth)
{
  debug(dumpObject(obj, name, maxDepth, curDepth));
}

function dumpObject(obj, name, maxDepth, curDepth)
{
  if (curDepth == undefined)
    curDepth = 1;
  if (maxDepth != undefined && curDepth > maxDepth)
    return "";

  var result = "";
  var i = 0;
  for (var prop in obj)
  {
    i++;
    if (typeof(obj[prop]) == "xml")
    {
      result += name + "." + prop + "=[object]" + "\n";
      result += dumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
    }
    else if (typeof(obj[prop]) == "object")
    {
      if (obj[prop] && typeof(obj[prop].length) != "undefined")
        result += name + "." + prop + "=[probably array, length " + obj[prop].length + "]" + "\n";
      else
        result += name + "." + prop + "=[object]" + "\n";
      result += dumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
    }
    else if (typeof(obj[prop]) == "function")
      result += name + "." + prop + "=[function]" + "\n";
    else
      result += name + "." + prop + "=" + obj[prop] + "\n";
  }
  if ( ! i)
    result += name + " is empty\n";
  return result;
}

/**
 * You are in the backend without UI, and there's
 * no way to redesign your API to pass the errors to the UI.
 * This should be avoided at all costs and is basically a bug.
 */
function errorInBackend(e)
{
  debug("ERROR (from backend): " + e);
  debug("Stack:\n" + (e.stack ? e.stack : "none"));
}
