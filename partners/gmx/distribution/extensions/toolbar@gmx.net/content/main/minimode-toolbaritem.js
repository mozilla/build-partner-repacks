Components.utils.import("resource://gre/modules/Services.jsm");
var accounts = {};
Components.utils.import("resource://unitedtb/email/account-list.js", accounts);
Components.utils.import("resource://unitedtb/util/globalobject.js", this);

var gToolbar;
var gMailMiniModeEndMenuitem;
var gMailMiniModeStartMenuitem;
var gMailMiniModeLogoffMenuitem;

function onLoad()
{
  try {
    gToolbar = E("united-toolbar");
    gMailMiniModeStartMenuitem = E("united-email-minimode-start-menuitem");
    gMailMiniModeEndMenuitem = E("united-email-minimode-end-menuitem");
    gMailMiniModeLogoffMenuitem = E("united-email-minimode-logoff-menuitem");
    if (gToolbar.hasAttribute("minimode") &&
        gToolbar.getAttribute("minimode") == "true") {
      gMailMiniModeStartMenuitem.hidden = true;
      gMailMiniModeEndMenuitem.hidden = false;
      gMailMiniModeLogoffMenuitem.hidden = false;
      setGlobalObject("united", "minimode", true);
    } else {
      setGlobalObject("united", "minimode", false);
    }
    // We need to catch when the toolbar is displayed via the toolbar view
    // menu so we can drop out of mini mode.
    window.addEventListener("command", onViewToolbarCommand, false);
    // Command messages for the appbutton will not come through the window event listener.
    // We have to add the listener to the popup menu.
    if (E("appmenu_customizeMenu")) { // App menu doesn't exist on Mac
      E("appmenu_customizeMenu").addEventListener("command",
          onViewToolbarCommand, false);
    }
    updateUI();
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function updateUI() {
  var allAccounts = accounts.getAllExistingAccounts();
  var loggedin = allAccounts.some(function(acc) { return acc.isLoggedIn; });
  gMailMiniModeLogoffMenuitem.disabled = !loggedin;
}

function onViewToolbarCommand(event) {
  try {
    if (event.originalTarget.getAttribute("toolbarId") == "united-toolbar") {
      var isVisible = event.originalTarget.getAttribute("checked") == "true";
      if (isVisible) {
        end();
      }
    }
  } catch (e) { errorCritical(e); }
}

function setDefaultSearchEngine() {
  if (!ourPref.get("search.opt-in", false)) {
    return;
  }
  var engine = Services.search.getEngineByName(brand.search.engineName);
  if (engine) {
    Services.search.currentEngine = engine;
  }
}

/**
 * Start mini mode which consists of moving the email button to
 * the nav bar, showing the "exit minimode" menu, collapsing
 * the toolbar and changing the search engine
 */
function start() {
  try {
    var emailButton = unitedinternet.toolbar.removeButton("united-email-button");
    unitedinternet.toolbar.addButton("nav-bar", emailButton, "search-container");
    gMailMiniModeStartMenuitem.hidden = true;
    gMailMiniModeEndMenuitem.hidden = false;
    gMailMiniModeLogoffMenuitem.hidden = false;
    gToolbar.collapsed = true;
    document.persist("united-toolbar", "collapsed");
    gToolbar.setAttribute("minimode", "true");
    document.persist("united-toolbar", "minimode");
    setDefaultSearchEngine();
    if (ourPref.get("newtab.opt-in", false)) {
      ourPref.set("newtab.enabled", true);
    }
    setGlobalObject("united", "minimode", true);
  } catch (e) { errorCritical(e); }}

/**
 * End mini mode which consists of moving the email button back to
 * the toolbar, hiding the "exit minimode" menu and showing
 * the toolbar
 */
function end(showToolbar) {
  try {
    var emailButton = unitedinternet.toolbar.removeButton("united-email-button");
    unitedinternet.toolbar.addButton("united-toolbar", emailButton);
    gMailMiniModeStartMenuitem.hidden = false;
    gMailMiniModeEndMenuitem.hidden = true;
    gMailMiniModeLogoffMenuitem.hidden = true;
    gToolbar.collapsed = false;
    document.persist("united-toolbar", "collapsed");
    gToolbar.setAttribute("minimode", "false");
    document.persist("united-toolbar", "minimode");
    setGlobalObject("united", "minimode", false);
  } catch (e) { errorCritical(e); }
}

autoregisterGlobalObserver("minimode", function(obj) {
  if (obj.enable) {
    start();
  } else {
    end();
  }
});

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "logged-in" || msg == "logged-out") {
      updateUI();
    } else if (msg == "first-run") {
      // For web.de club, start mini mode by default
      if (brand.toolbar.pay ||
          build.kVariant == "amo" ||
          build.kVariant == "browser" ||
          build.kVariant == "minimode") {
        start();
      }
    }
  },
}
registerGlobalObserver(globalObserver);

window.addEventListener("aftercustomization", function() {
  // If the toolbar thinks it is in minimode, but the email button is on our
  // toolbar, end mini mode.
  // This can happen if the user clicks "Restore default" or
  // drags the button back to our toolbar while customizing.
  if (gToolbar.hasAttribute("minimode") &&
    gToolbar.getAttribute("minimode") == "true") {
    var emailButton = E("united-email-button");
    if (emailButton && emailButton.parentNode == gToolbar) {
      end();
    }
  }
}, false);
