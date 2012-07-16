/**
 * This implements the help menu for our toolbar.
 * It appears in the Firefox help menu and
 * in the "Settings" button dropdown.
 */

function loadPageWithFallback(url, fallbackURL)
{
  new TrackHTTPError(url, null, function(url, httpcode) // error callback
  {
    united.debug("url <" + url + "> failed to load (" + httpcode + "), falling back to <" + fallbackURL + ">");
    united.loadPage(fallbackURL);
  });
  united.loadPage(url);
}

// <copied from="uiutil.js (with modifications, for fallbackURL)">
function onMenuitem(event)
{
  if (event.target.hasAttribute("aboutextdialog"))
    openAboutDialog();
  else
  {
    var url = event.target.getAttribute("url");
    var fallbackURL = event.target.getAttribute("fallbackURL");
    if (!url)
      throw new NotReached("expected url attribute");
    if (fallbackURL)
      loadPageWithFallback(url, fallbackURL);
    else
      united.loadPage(url);
  }
  event.stopPropagation(); // prevent from bubbling to main <button>
};

var gMenuInited = false;
function initMenus()
{
  if (gMenuInited)
    return;
  initMenuitems("united-pref-button-dropdown");
  initMenuitems("united-help-submenu");
  gMenuInited = true;
}

function initMenuitems(containerID)
{
  // create <menuitem label="Foobar" url="..."/>, url attr used above
  var container = document.getElementById(containerID);
  for each (let entry in united.brand.toolbar.helpMenuURLEntries)
  {
    let item = document.createElement("menuitem");
    if (entry.aboutExtDialog)
      item.setAttribute("aboutextdialog", "true");
    if (entry.url)
      item.setAttribute("url", entry.url);
    if (entry.fallbackURL)
      item.setAttribute("fallbackURL", entry.fallbackURL);
    if (entry.replaceVersion && entry.url)
      item.setAttribute("url", entry.url);
    item.setAttribute("label", entry.label);
    item.addEventListener("command", onMenuitem, false);
    container.appendChild(item);
  }
}
// </copied>

function openAboutDialog()
{
  if (Cc["@mozilla.org/extensions/manager;1"]) // FF3.6
  {
    var rdfs = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    var extensionDS= Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager).datasource;

    window.openDialog("chrome://mozapps/content/extensions/about.xul", "", "chrome,centerscreen,modal",
                      "urn:mozilla:item:" + united.EMID, extensionDS);
  }
  else // FF4
  {
    var am = {};
    Components.utils.import("resource://gre/modules/AddonManager.jsm", am);
    am.AddonManager.getAddonByID(united.EMID, function(addon)
    {
      window.openDialog("chrome://mozapps/content/extensions/about.xul",
          "", "chrome,centerscreen,modal", addon);
    });
  }
}


/**
 * Reports whether a certain URL load worked or failed.
 */
function TrackHTTPError(url, successCallback, errorCallback)
{
  united.assert(url && typeof(url) == "string", "need url");
  this.url = url;
  if (successCallback)
    this.successCallback = successCallback;
  if (errorCallback)
    this.errorCallback = errorCallback;
  this._hookup();
}
TrackHTTPError.prototype =
{
  url : null,
  errorCallback : function() {},
  successCallback : function() {},
  observe: function(subject, topic, data)
  {
    try {
      if (topic != "http-on-examine-response")
        return;
      if (!(subject instanceof Ci.nsIHttpChannel))
        return;
      if (subject.originalURI.spec != this.url)
        return;
      this._unhook();
      if (Components.isSuccessCode(subject.status) &&
           subject.responseStatus == 200)
        this.successCallback(this.url);
      else
        this.errorCallback(this.url, subject.responseStatus);
    } catch (e) { united.errorInBackend(e); }
  },
  _hookup : function()
  {
    var observerService = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);
    observerService.addObserver(this, "http-on-examine-response", false);
  },
  _unhook : function()
  {
    var observerService = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);
    observerService.removeObserver(this, "http-on-examine-response");
  },
}
