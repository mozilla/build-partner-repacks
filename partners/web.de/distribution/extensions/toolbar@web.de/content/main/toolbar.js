/**
 * Some misc functions around the toolbar.
 */
/**
 * Messages reacted to by this module:
 * "do-customize-toolbar"
 *   Means: Set the Text/Icon toolbar mode
 *   When: When the user is in Prefs|Display. Not sent from Firefox' Customize... dialog.
 *    Parameter: object
 *       mode {String-enum}  new value of <toolbar mode=""/>
 * "upgrade"
 * "reinstall"
 *    Effect: Redisplays the toolbar if it is collapsed
 */

// Doesn't belong here, but don't know a better place
Components.utils.import("resource://unitedtb/main/extension.js", this);
Components.utils.import("resource://unitedtb/hotnews/hotnews.js", this);

var tb;

function onLoad()
{
  tb = document.getElementById("united-toolbar");

  // Migration from 2.2
  // If we have a spacer or a separator already on the toolbar, we're migrating
  // Remove them and reset currentset
  var tbseparator = tb.querySelector("toolbarseparator");
  var tbspring = tb.querySelector("toolbarspring");
  if (tbseparator || tbspring)
  {
    if (tbseparator)
      tb.removeChild(tbseparator);
    if (tbspring)
      tb.removeChild(tbspring);

    // Clean up our old settings
    tb.setAttribute("currentset", "");
    document.persist("united-toolbar", "currentset");
    tb.setAttribute("last-defaultset", "");
    document.persist("united-toolbar", "last-defaultset");
  }

  for (let i in brand.toolbar.items)
  {
    var tbitem;
    if (i == "separator")
      tbitem = document.createElement("toolbarseparator");
    else if (i == "spacer" || i == "spring")
      tbitem = document.createElement("toolbarspring");
    else
      tbitem = document.getElementById("united-" + i);
    if (tbitem)
      tb.appendChild(tbitem);
  }
  setEnabledToolbarButtons();
  checkDisabledModules(window); // uiuils.js
  autoregisterGlobalObserver("region-changed", function(obj)
  {
    checkDisabledModules(window);
    onWindowResize();
  });
  autoregisterGlobalObserver("do-customize-toolbar", function(obj)
  {
    assert(typeof(obj.mode) == "string");
    tb.setAttribute("mode", obj.mode);
    tb.ownerDocument.persist(tb.id, "mode");
    onButtonSizeChangedByCode();
  });
  ourPref.observeAuto(window, "hiddenButtons", setEnabledToolbarButtons);
}
window.addEventListener("load", onLoad, false);

/**
 * If you in your code change a button in a way that changes its size,
 * you must call this function (unitedinternet.toolbar.onButtonSizeChangedByCode),
 * so that the automatic shrinking can adapt.
 */
function onButtonSizeChangedByCode()
{
  onWindowResize(); // in toolbar-resize.js
}

/**
 * Returns Text/Icon mode, i.e. <toolbar mode=""/>
 * Called from pref-display.js, see comment there.
 */
function getCurrentToolbarMode()
{
  return tb.getAttribute("mode");
}

/**
 * Sets the toolbar buttons that should be shown on our toolbar
 */
function setEnabledToolbarButtons()
{
  var hiddenButtons
  if (ourPref.isSet("hiddenButtons")) {
    hiddenButtons = ourPref.get("hiddenButtons");
  } else {
    var hiddenButtonsArray = [];
    // Read hidden buttons from brand.js
    for (let i in brand.toolbar.items)
      if ( ! brand.toolbar.items[i])
        hiddenButtonsArray.push("united-" + i);
    hiddenButtons = hiddenButtonsArray.join(',');
    ourPref.set("hiddenButtons", hiddenButtons);
  }
  var allButtons = document.getElementsByAttribute("united-removable", "true");
  for (let i = 0; i < allButtons.length; i++) {
    let button = allButtons[i];
    if (hiddenButtons.indexOf(button.id) > -1) {
      button.style.display = "none";
    } else {
      button.style.display = "";
    }
  }
  onButtonSizeChangedByCode();
}

function reshowToolbar()
{
  tb.collapsed = false;
  document.persist('united-toolbar', 'collapsed');
}
autoregisterGlobalObserver("upgrade", reshowToolbar);
autoregisterGlobalObserver("reinstall", reshowToolbar);
