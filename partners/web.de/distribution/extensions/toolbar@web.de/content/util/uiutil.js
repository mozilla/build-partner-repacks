
function error(e)
{
  dump("ERROR: " + e + "\n");
  dump("Stack:\n" + (e.stack ? e.stack : "none") + "\n");
};

function errorCritical(e)
{
  dump("ERROR: " + e + "\n");
  dump("Stack:\n" + (e.stack ? e.stack : "none") + "\n");
  var sb = united.getStringBundle("chrome://unitedtb/locale/util.properties");
  var title = sb.GetStringFromName("errorDialog.title");
  alertPrompt(title, e);
};

function alertPrompt(alertTitle, alertMsg)
{
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Ci.nsIPromptService)
      .alert(window, alertTitle, alertMsg);
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
 */
function loadPage(url, target)
{
  url = united.sanitize.url(url); // critical for security
  target = united.sanitize.enum(target,
      ["current", "tab", "tabshifted", "window", "save"], "current");
  openUILinkIn(url, target);  // from utilityOverlay.js
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
  target = united.sanitize.enum(target,
      ["current", "tab", "tabshifted", "window", "save"], "current");
  openUILinkIn(url, target);  // from utilityOverlay.js
}

function cleanElement(el)
{
  while (el.hasChildNodes())
    el.removeChild(el.firstChild);
}


/**
 * If you load a page, e.g. with loadPage() here, and want to wait until
 * it's loaded.
 */
function waitForPageLoad(tabbrowser, pageURL, callback)
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
        //united.debug("onStateChange");
        if (! (stateFlags & Ci.nsIWebProgressListener.STATE_STOP ||
              stateFlags & Ci.nsIWebProgressListener.STATE_REDIRECTING))
          return;

        try {
          request = request.QueryInterface(Ci.nsIChannel);
        } catch (e) {
          //united.debug("request is not a channel");
          return;
        }
        //united.debug("uri requested: " + request.URI.spec);
        if (request.URI.spec != pageURL)
          return;
        tabbrowser.removeTabsProgressListener(webTabProgressListener);
        callback(browser);
      } catch (e) { united.errorInBackend(e); }
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
  for each (let module in united.brand)
  {
    if (typeof(module.disabled) == "undefined")
      continue;
    for each (let entry in module.disabledIDs)
    {
      if (entry.win != win.document.documentElement.id)
        continue;
      let e = win.document.getElementById(entry.el);
      e.hidden = module.disabled;
    }
  }
}


/**
 * Appends (to a menu button dropdown) menu entries that just load a URL.
 * The entries are coming from brand.js. They will be reloaded when the region changes.
 * Assumptions:
 * - The URL entries are at the end of the menu.
 * - The entries are defined in united.brand.<modulename>.dropdownURLEntries
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
 *        united.brand.<modulename>.dropdownURLEntries
 *     item {<menuitem>} The clicked menuitem
 *     event   The click event
 *     event.target == item and event.target.entry == item.entry == entry
 */
function appendBrandedMenuitems(modulename, iconpath, initedCallback, itemClickedCallback)
{
  // I can't save (or get passed) united.brand[modulename] here,
  // because it gets re-created by brand-var-loader.js on region change.
  this.modulename = united.sanitize.nonemptystring(modulename);
  this.iconpath = united.sanitize.nonemptystring(iconpath);
  this.container = document.getElementById(
      "united-" + modulename + "-button-dropdown");
  united.assert(!initedCallback || typeof(initedCallback) == "function");
  united.assert(typeof(itemClickedCallback) == "function", "need an itemClickedCallback");
  this.itemClickedCallback = itemClickedCallback;
  this.initedCallback = initedCallback;

  var self = this;
  this.container.addEventListener("popupshowing", function ()
  {
    self.populate();
  }, false);
  united.autoregisterGlobalObserver("region-changed", function()
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
    for each (let entry in united.brand[this.modulename].dropdownURLEntries)
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
    united.debug("Shall I load <" + uri.spec + ">?");
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
    united.loadPage(uri);
  };
}
