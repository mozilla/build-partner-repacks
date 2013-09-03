Components.utils.import("resource://gre/modules/Services.jsm");

var gToolbar;
var gMailMiniModeEndMenuitem;
var gMailMiniModeStartMenuitem;

function onLoad()
{
  try {
    gToolbar = E("united-toolbar");
    gMailMiniModeStartMenuitem = E("united-email-minimode-start-menuitem");
    gMailMiniModeEndMenuitem = E("united-email-minimode-end-menuitem");
    if (gToolbar.hasAttribute("minimode") &&
        gToolbar.getAttribute("minimode") == "true") {
      gMailMiniModeStartMenuitem.hidden = true;
      gMailMiniModeEndMenuitem.hidden = false;
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
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function onViewToolbarCommand(event) {
  if (event.originalTarget.getAttribute("toolbarId") == "united-toolbar") {
    var isVisible = event.originalTarget.getAttribute("checked") == "true";
    if (isVisible) {
      end();
    }
  }
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
    gToolbar.collapsed = true;
    document.persist("united-toolbar", "collapsed");
    gToolbar.setAttribute("minimode", "true");
    document.persist("united-toolbar", "minimode");
    setDefaultSearchEngine();
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
    gToolbar.collapsed = false;
    document.persist("united-toolbar", "collapsed");
    gToolbar.setAttribute("minimode", "false");
    document.persist("united-toolbar", "minimode");
  } catch (e) { errorCritical(e); }
}

autoregisterGlobalObserver("minimode", function(obj) {
  if (obj.enable) {
    start();
  } else {
    end();
  }
});
