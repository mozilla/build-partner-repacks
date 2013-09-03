// implicit Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://gre/modules/Services.jsm");
const kBundleURL = "chrome://unitedtb/locale/util.properties";

/**
 * Minor errors.
 * This should include all errors in code that is automatic (on startup, on timer).
 * Also any errors that do not block the main purpose of the action.
 *
 * The current implementation does not show the error to the
 * end user at all, but only on the error console.
 * Future implementations may show it in a non-obtrusive way, e.g.
 * as an icon somewhere.
 *
 * If in doubt, use errorCritical(), not errorNonCritical().
 *
 * @param e {Exception or String}   the error message
 * @param parentWindow {window} (Optional)
 */
function errorNonCritical(e, parentWindow)
{
  e = convertException(e); // util.js
  _error(e);

  {
    // Can't import at top of file, because that would create a
    // circular dependency, which causes strange and subtle bugs
    var reporter = {};
    Components.utils.import("resource://unitedtb/util/sendError.js", reporter);
    if (reporter.shouldSendErrorToServer(e))
      reporter.sendErrorToServer(e);
  }
};
const error = errorNonCritical; // old alias, see #955

/**
 * Show error message to end user.
 * This should include all errors that are in response to actions that
 * the user requested immediately before, and that block the proper
 * execution of that action.
 * It should not be used for code that is automatic (on startup, on timer).
 * If in doubt, we assume the error is fatal.
 *
 * Current implementation shows a dialog to the end user.
 *
 * @param e {Exception or String}   the error message
 * @param parentWindow {window} (Optional)
 */
function errorCritical(e, parentWindow)
{
  e = convertException(e); // util.js
  _error(e);
  _showErrorDialog(e, parentWindow);
};

function _error(e)
{
  debug("ERROR: " + e);
  debug("Stack:\n" + (e.stack ? e.stack : "none"));
};

function _showErrorDialog(e, parentWindow)
{
  if (!parentWindow)
    parentWindow = window;
  var sb = Services.strings.createBundle(kBundleURL);
  var args = {};
  args.title = sb.GetStringFromName("errorDialog.title");
  args.text = e.toString();
  args.checked = false;

  if ( !e.causedByUser) {
    if (ourPref.isSet("util.reportError.enabled")) {
      // If we have a set value, then the user made a choice, so use it
      args.checked = ourPref.get("util.reportError.enabled");
    } else {
      // Get a random sample, but only as default for the checkbox.
      // Let the user still confirm it.
      if (Math.random() < 0.5) { // random sample of 50%
        args.checked = true;
      }
    }
    args.checkLabel  = sb.GetStringFromName("errorDialog.check");
  }
  args.moreInfo = {};
  args.moreInfo.title = sb.GetStringFromName("errorDialog.moreInfo.title");
  args.moreInfo.content = sb.GetStringFromName("errorDialog.moreInfo.content");

  parentWindow.openDialog("chrome://unitedtb/content/util/errorDialog.xul",
                 "united-error",
                 "centerscreen,chrome,modal,titlebar", args);

  if (args.checkLabel && !args.cancel)
    ourPref.set("util.reportError.enabled", args.checked);

  {
    // Can't import at top of file, because that would create a
    // circular dependency, which causes strange and subtle bugs
    var reporter = {};
    Components.utils.import("resource://unitedtb/util/sendError.js", reporter);
    if (reporter.shouldSendErrorToServer(e))
      reporter.sendErrorToServer(e);
  }
}

/**
 * For loadPageInSpecificTab() only.
 * When a button is clicked, the corresponding tab is stored in this array.
 * Then it is reused (if open) the next time the button is clicked.
 * {Array of {weak reference to <tab> from <tabbrowser>}}
 */
var _gActiveTabs = {};

function loadPageInSpecificTab(url, tabName)
{
  var gBrowser = top.gBrowser ? top.gBrowser :
      findSomeBrowserWindow().gBrowser;
  url = sanitize.url(url); // critical for security
  // .get retrieves the actual tab object from the weak reference.
  // If it is null, the tab no longer exists
  // We also have to check for parentNode, because the tab might
  // exist, but not be in the DOM anymore
  var tabRef = _gActiveTabs[tabName];
  if (tabRef &&
      tabRef.get() &&
      tabRef.get().parentNode)
  {
    var tabToUse = tabRef.get();
    var uri = Services.io.newURI(url, null, null);
    // Only use the same tab if the hosts are the same
    if (tabToUse.linkedBrowser.currentURI.host == uri.host)
    {
      gBrowser.selectedTab = tabToUse;
      loadChromePage(url, "current");
      return;
    }
  }
  var newTab = gBrowser.addTab();
  gBrowser.selectedTab = newTab;
  // Because we've added the tab and made it the selected tab, we can
  // pass to loadChromePage and use openUILink in current
  loadChromePage(url, "current");
  _gActiveTabs[tabName] = Components.utils.getWeakReference(newTab);
}

/**
 * Open a URL in the browser.
 *
 * @param url {String}   The page to load
 * @param target {String-enum}   Where to open it, current tab or new tab
 *   Default is "current"
 *   "current"
 *      Replaces currently displayed page.
 *      If there aren't any browser windows, then in a new window instead.
 *   "tab"         new tab
 *      If there aren't any browser windows, then in a new window instead.
 *   "tabshifted"  same as "tab" but in background if default is
 *      to select new tabs, and vice versa.
 *   "window"      new window
 *   "save"        save to disk (with no filename hint!)
 *   "united-*"    invokes code to reuse a tab that corresponds to the target
 */
function loadPage(url, target)
{
  url = sanitize.url(url); // critical for security
  /* If the target begins with united, try to reuse a tab */
  if (target && target.match(/^united/))
    loadPageInSpecificTab(url, target);
  else
    loadChromePage(url, target);
}

/**
 * Open a chrome URL in the browser.
 * Same as loadPage(), but allows to load a chrome: URL.
 *
 * Call this ONLY with a static, hardcoded URL. NEVER call this
 * with a URL constructed from parameters, esp. not if any parts
 * of it come from the network.
 */
function loadChromePage(url, target)
{
  target = sanitize.enum(target,
      ["current", "tab", "tabshifted", "window", "save"], "current");
  var openUILinkIn = top.openUILinkIn ? top.openUILinkIn :
      findSomeBrowserWindow().openUILinkIn;
  debug("loading webpage <" + url + "> in " + target);
  openUILinkIn(url, target);  // from utilityOverlay.js
}


/**
 * Similar to loadPage(), but using HTTP POST.
 */
function loadPageWithPOST(url, target, uploadBody, mimetype)
{
  url = sanitize.url(url); // critical for security
  target = sanitize.enum(target,
      ["current", "tab", "tabshifted", "window", "save"], "current");
  var openUILinkIn = top.openUILinkIn ? top.openUILinkIn :
      findSomeBrowserWindow().openUILinkIn;
  debug("loading webpage with POST <" + url + "> in " + target);
  openUILinkIn(url, target, false, createPostDataFromString(uploadBody, mimetype));
}

/**
 * Takes a JavaScript string and MIME-Type and creates
 * an nsIInputStream suitable for passing to webnavigation.loadURI().
 * @param uploadBody {String} what you want to post.
 *     The HTTP body of the HTTP request you will send.
 * @param mimetype {String} the format in which you are posting
 * @returns {nsIInputStream}
 */
function createPostDataFromString(uploadBody, mimetype)
{
  var stringStream = Cc["@mozilla.org/io/string-input-stream;1"]
      .createInstance(Ci.nsIStringInputStream);
  stringStream.data = uploadBody;
  var postData = Cc["@mozilla.org/network/mime-input-stream;1"]
      .createInstance(Ci.nsIMIMEInputStream);
  postData.addHeader("Content-Type", mimetype);
  postData.addContentLength = true;
  postData.setData(stringStream);
  return postData;
}

  /*
  var params = {
    sendingauthdata : 1,
    jsenabled : true,
    "login.ValidBrowser" : false,
    "login.Username" : acc.emailAddress,
    "login.Password" : acc._password, // tralala
  };
  loadPageWithPOSTParams(url, params);
  */
/**
 * loadPageWithPOST(), but passes params like a form submission
 *
function loadPageWithPOSTParams(url, target, params)
{
  assert(typeof(params) == "object");
  var paramsStr = "";
  var first = true;
  for (let paramname in params)
  {
    if (first)
      first = false;
    else
      paramsStr += "&";
    paramsStr += sanitize.alphanumdash(paramname) + "=" +
        encodeURIComponent(params[paramname]);
  }
  loadPageWithPOSTParams(url, target, paramsStr, "application/x-www-form-urlencoded");
}
*/



function cleanElement(el)
{
  while (el.hasChildNodes())
    el.removeChild(el.firstChild);
}

/**
 * For a given element, finds the tagname which contains it
 * @param element {DOMElement}
 * @return {DOMElement <tagname>} or null
 */
function findParentTagForElement(tagname, element)
{
  assert(element && element instanceof Ci.nsIDOMElement);
  sanitize.nonemptystring(tagname);
  for (; element && element.tagName != tagname; element = element.parentNode)
    ;
  return element;
}



/**
 * Same as waitForPageLoad(), just that you're waiting for a specific
 * URL to load.
 *
 * @param tabbrowser {<tabbrowser>}
 * @param url {<String-URL}
 * @param callback {Function(browser)}
 *    Will be called then any page in the tabbrowser finished loading.
 *    browser {<browser>}   <browser> element containing the page.
 *    Unlike waitForPageLoad |callback|, no |url| param, no return value.
 */
function waitForURLLoad(tabbrowser, waitForURL, callback)
{
  waitForPageLoad(tabbrowser, function(browser, loadedURL)
  {
    var hit = waitForURL == loadedURL;
    if (hit)
      callback(browser);
    return hit;
  });
}

/**
 * If you load a page, e.g. with loadPage() here, and want to wait until
 * it's loaded.
 * You decide whether this is the page you are waiting for.
 * Note that you get calls for all pageloads in all tabs in this browser window,
 * so you have to filter properly.
 *
 * @param tabbrowser {<tabbrowser>}
 * @param callback {Function(browser)}
 *    Will be called then any page in the tabbrowser finished loading.
 *    browser {<browser>}   <browser> element containing the page.
 *    url {String-URL}   URL of the page that just finished loading.
 *    You must return either true or false, whether this was the page you
 *    were waiting for.
 *      If true, we will stop listening for page loads and calling |callback|.
 *      If false, you will get further callbacks.
 */
function waitForPageLoad(tabbrowser, callback)
{
  var webTabProgressListener =
  {
    /**
     * <http://mdn.beonex.com/En/Listening_to_events_on_all_tabs>
     * @param browser {DOMElement <xul:browser>}
     */
    onStateChange : function(browser, webProgress, request, stateFlags, status)
    {
      try {
        //debug("onStateChange");
        if (! (stateFlags & Ci.nsIWebProgressListener.STATE_STOP ||
              stateFlags & Ci.nsIWebProgressListener.STATE_REDIRECTING))
          return;

        try {
          request = request.QueryInterface(Ci.nsIChannel);
        } catch (e) {
          //debug("request is not a channel");
          return;
        }
        //debug("uri requested: " + request.URI.spec);
        if (! callback(browser, request.URI.spec))
          return;
        tabbrowser.removeTabsProgressListener(webTabProgressListener);
      } catch (e) { errorInBackend(e); }
    },
    onLocationChange: function() {},
    onProgressChange: function() {},
    onStatusChange: function() {}, 
    onSecurityChange: function() {},
    onLinkIconAvailable: function() {},
    // it's not a real Ci.nsIWebProgressListener
    QueryInterface : XPCOMUtils.generateQI([Ci.nsISupportsWeakReference])
  }

  tabbrowser.addTabsProgressListener(webTabProgressListener);
}

/*
function waitForPageLoad2(tabbrowser, pageURL, callback)
{
  var browser = gBrowser.selectedBrowser;
  var window = browser.contentWindow;
  var loaded = function()
  {
     window.removeEventListener("DOMContentLoaded", loaded, false); // TODO loaded already fine?
     callback(browser);
  };
  window.addEventListener("DOMContentLoaded", loaded, false);
}
*/



/**
 * You are in a frame, e.g. in the browser content area.
 * You are chrome.
 * You want to get to the JavaScript context of the chrome window,
 * e.g. the Firefox browser / extensions code/objects.
 * @returns {Window} the |window| (global JS context) of the chrome window.
 */
function getTopLevelWindowContext()
{
  const Ci = Components.interfaces; // We're not in extension JS context
  // <http://mdn.beonex.com/en/Working_with_windows_in_chrome_code#Accessing_the_elements_of_the_top-level_document_from_a_child_window>
  return window.QueryInterface(Ci.nsIInterfaceRequestor)
               .getInterface(Ci.nsIWebNavigation)
               .QueryInterface(Ci.nsIDocShellTreeItem)
               .rootTreeItem
               .QueryInterface(Ci.nsIInterfaceRequestor)
               .getInterface(Ci.nsIDOMWindow);
}


/**
 * Call this in the onLoad of each window/overlay.
 * @param win {DOMWindow} your window, i.e. |window|
 */
function checkDisabledModules(win)
{
  for each (let module in brand)
  {
    if (typeof(module.disabled) == "undefined")
      continue;
    for each (let entry in module.disabledIDs)
    {
      if (entry.win != win.document.documentElement.id)
        continue;
      let e = win.document.getElementById(entry.el);
      if (!e)
        e = E(entry.el, win.document);
      if (!e)
      {
        debug("warning: element ID " + entry.el + " (to be disabled) not found");
        continue;
      }
      e.hidden = module.disabled;
    }
  }
}


/**
 * Appends (to a menu button dropdown) menu entries that just load a URL.
 * The entries are coming from brand.js. They will be reloaded when the region changes.
 * Assumptions:
 * - The URL entries are at the end of the menu.
 * - The entries are defined in brand.<modulename>.dropdownURLEntries
 * - The <menupopup> has the ID "united-<modulename>-button-dropdown"
 * - The icons are at URL chrome://unitedtb/skin/<iconpath>/<entry.icon>
 * You call this function on window onLoad and then not again for this window.
 * @param modulename {String} e.g. "search" or "shopping". see assumptions above.
 * @param iconpath {String} e.g. "shopping" or "search/engine". see assumptions above.
 * @param initedCallback {Function(container)}
 *     container {<menupopup>}
 *     Called after the menu is constructed.
 *     May be called several times, due to region changes.
 *     May be null.
 * @param itemClickedCallback {Function(entry, item)}
 *     entry {Object with label, icon} the entry in
 *        brand.<modulename>.dropdownURLEntries
 *     item {<menuitem>} The clicked menuitem
 *     event   The click event
 *     event.target == item and event.target.entry == item.entry == entry
 */
function appendBrandedMenuitems(modulename, iconpath, initedCallback, itemClickedCallback)
{
  // I can't save (or get passed) brand[modulename] here,
  // because it gets re-created by brand-var-loader.js on region change.
  this.modulename = sanitize.nonemptystring(modulename);
  this.iconpath = sanitize.nonemptystring(iconpath);
  this.container = E(
      "united-" + modulename + "-button-dropdown");
  assert(!initedCallback || typeof(initedCallback) == "function");
  assert(typeof(itemClickedCallback) == "function", "need an itemClickedCallback");
  this.itemClickedCallback = itemClickedCallback;
  this.initedCallback = initedCallback;

  var self = this;
  this.container.addEventListener("popupshowing", function ()
  {
    self.populate();
  }, false);
  autoregisterGlobalObserver("region-changed", function()
  {
    self.resetMenuitems();
  });
}
appendBrandedMenuitems.prototype =
{
  inited : false,
  modulename : null,
  container : null,

  // static function, cannot use |this|
  onCommand : function(event)
  {
    var item = event.target;
    item.itemClickedCallback(item.entry, item, event);
    event.stopPropagation(); // prevent from bubbling to main <button>
  },

  populate : function()
  {
    if (this.inited)
      return;
    // create <menuitem label="Foobar" url="..."/>, url property used above
    for each (let entry in brand[this.modulename].dropdownURLEntries)
    {
      let item = this.container.ownerDocument.createElement("menuitem");
      item.setAttribute("label", entry.label);
      if (entry.icon)
      {
        item.setAttribute("class", "menuitem-iconic")
        if (entry.icon == "brand")
          item.setAttribute("image", "chrome://unitedtb/skin/brand/icon-small.png");
        else
          item.setAttribute("image", "chrome://unitedtb/skin/" +
              this.iconpath + "/" + entry.icon);
      }
      item.brandedItem = true; // for resetMenuitems()
      item.entry = entry;
      item.itemClickedCallback = this.itemClickedCallback; // for onCommand()
      item.addEventListener("command", this.onCommand, false);
      this.container.appendChild(item);
    }
    if (this.initedCallback)
      this.initedCallback(this.container);
    this.inited = true;
  },

  resetMenuitems : function()
  {
    var els = this.container.getElementsByTagName("menuitem");
    for (let i = 0, len = els.length; i < len; i++)
    {
      let el = els.item(i);
      if (!el.brandedItem)
        continue;
      this.container.removeChild(el);
      i--;
      len--;
    }
    this.inited = false;
  },
}


/**
 * nsIURIContentListener which allows only certain
 * URLs to load in the docshell, and calls you when
 * other URLs are attempted.
 * This is useful for small page windows, where you display rich content,
 * but want to redirect link clicks (and other types of load) into
 * the main browser window.
 *
 * Does work for "dragged clicks", apparently Mozilla bug,
 * @see <https://bugzilla.mozilla.org/show_bug.cgi?id=570222>
 */
function BlockContentListener(allowFunc, blockedCallback)
{
  this.allowFunc = allowFunc;
  this.blockedCallback = blockedCallback;
}
BlockContentListener.prototype =
{
  QueryInterface: function(iid)
  {
    const Ci = Components.interfaces;
    if (iid.equals(Ci.nsIURIContentListener) ||
        iid.equals(Ci.nsISupportsWeakReference) ||
        iid.equals(Ci.nsISupports))
      return this;
    return Components.results.NS_NOINTERFACE;
  },
  onStartURIOpen: function(uri)
  {
    debug("Shall I load <" + uri.spec + ">?");
    var allow = this.allowFunc(uri.spec, uri)
    if (!allow && this.blockedCallback)
      this.blockedCallback(uri.spec);
    return !allow; // true = block
  },
  doContent: function(contentType, isContentPreferred, request, contentHandler)
  {
    return true;
  },
  isPreferred: function(contentType, desiredContentType)
  {
    return false;
  },
  canHandleContent: function(contentType, isContentPreferred, desiredContentType)
  {
    return true;
  },

  loadCookie: null,
  parentContentListener: null,

  hookUpIFrame: function(iframe)
  {
    const Ci = Components.interfaces;
    iframe.docShell
        .QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIURIContentListener)
        .parentContentListener = this;
  },
}

/**
 * For BlockContentListener
 * Returns a Function object to be passed as allowFunc
 * that allows all URLs with the given prefix to load.
 * @param urlPrefix {String}  the URL must start with this string to be allowed
 *     E.g. "resource://unitedtb/" or "http://www.amazon.de/"
 *     (note the trailing slash).
 */
function allowURLPrefix(urlPrefix)
{
  return function(uriStr, nsiuri) // allowFunc
  {
    return uriStr.substr(0, urlPrefix.length) == urlPrefix;
  };
}

/**
 * For BlockContentListener
 * Returns a Function object to be passed as blockedCallback to
 * cause all blocked URLs to load in the main browser window.
 */
function loadBlockedInBrowser(panel)
{
  return function(uri) // blockedCallback
  {
    panel.hidePopup();
    loadPage(uri);
  };
}

/**
 * If a dialog with the given name is open, it focuses it and returns true
 * It also checks for child dialogs and focuses them as well.
 * Otherwise it returns false
 * @param type {String}   The name of the dialog as specified to openDialog
 * @returns {Boolean} true if the window exists and was focused. False otherwise.
 */
function focusDialogIfOpen(name) {
  // nsIWindowWatcher
  var winToFocus = Services.ww.getWindowByName(name, null);
  if (winToFocus) {
    // It won't focus, if it has child windows. Check for them
    // nsIWindowMediator
    let enumerator = Services.wm.getEnumerator(null);
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
      if (winToFocus == win.opener) {
        winToFocus = win;
        break;
      }
    }
    winToFocus.focus();
    return true;
  }
  return false;
}



/**
 * Shortcut for document.getElementById()
 *
 * If a toolbar button or item is not on the toolbar, getting it by ID will
 * fail. This is because the toolbar palette is removed from the document
 * via removeChild, but still used to hold items in the palette.
 * This function checks to see if it is in the current window and if
 * not, it grabs it from the toolbar palette.
 * This can be any item that is a child of a toolbar element
 */
function E(id) {
  var element = document.getElementById(id);
  if (element)
    return element;
  var toolbox = document.getElementById("navigator-toolbox");
  if (toolbox && toolbox.palette)
    element = toolbox.palette.querySelector("#" + id);
  // Will be either the element or null if no element was found
  return element;
}

/**
 * createElement()
 * @param tagname {String} <tagname>
 * @param classname {String} class="classname"
 * @param attributes {Array of String}
 */
function cE(tagname, classname, attributes) {
  var el = document.createElement(tagname);
  if (classname)
    el.classList.add(classname);
  for (var name in attributes)
    el.setAttribute(name, attributes[name]);
  return el;
}

/**
 * createTextNode()
 */
function cTN(text) {
  return document.createTextNode(text);
}

/**
 * Like parentElement.insertBefore(newElement, insertBefore), just insert
 * after some other element.
 *
 * @param parentElement {node} Insert |newElement| as child of |parentElement|.
 * @param newElement {node} new node that you want to insert
 * @param insertAfterInfo {String or DOMElement}  Element or ID of the node
 *     that should be before (left to) |newElement|.
 *     This must be a child of |parentElement|.
 *     If it does not exist, the |newElement| is added to the end.
 * @returns {node} the node that was inserted
 */
function insertAfter(parentElement, newElement, insertAfterInfo) {
  var afterEl = null;
  if (insertAfterInfo) {
    if (typeof(insertAfterInfo) == "string") {
      afterEl = parentElement.ownerDocument.getElementById(insertAfterInfo);
    } else if (insertAfterInfo.ownerDocument) {
      afterEl = insertAfterInfo;
    } else {
      throw new NotReached("insertAfterInfo has the wrong type");
    }
    if (afterEl.parentNode != parentElement) {
      throw new NotReached("insertAfterInfo has the wrong parent element");
    }
  }
  if (afterEl && afterEl.nextSibling) {
    parentElement.insertBefore(newElement, afterEl.nextSibling);
  } else {
    parentElement.appendChild(newElement);
  }
  return newElement;
}
