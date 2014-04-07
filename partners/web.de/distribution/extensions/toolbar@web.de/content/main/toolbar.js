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
importJSM("main/extension.js", this);
importJSM("hotnews/hotnews.js", this);
importJSM("main/startpage.js", this);

var tb;
var gAustralis = false;

// Australis (Firefox 29+ toolbar customization) specific
// This must be done before the toolbar is in DOM, so onLoad() is too late.
try {
  Components.utils.import("resource://app/modules/CustomizableUI.jsm");
  gAustralis = true;
  initAustralis();
} catch (e) {} // catch for older Firefox

function onLoad()
{
  try {
    tb = E("united-toolbar");
    fixToolbarSet();
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
    ourPref.observeAuto(window, "hiddenButtons", function() {
      try {
        setEnabledToolbarButtons();
      } catch (e) { errorNonCritical(e); }
    });
  } catch(e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);

function initAustralis() {
  var defaultset = [];
  for (let i in brand.toolbar.items) {
    if (i == "separator") {
      defaultset.push("separator");
    } else if (i == "spring") {
      defaultset.push("spring");
    } else {
      defaultset.push("united-" + i);
    }
  }

  CustomizableUI.registerArea("united-toolbar",
      { type: CustomizableUI.TYPE_TOOLBAR,
         legacy: true, // support defaultset XUL attribute etc.
         defaultPlacements: defaultset});
}

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
 * Re/initializes the toolbar if it has never been setup before or
 * if the toolbar set in brand.js has changed.
 */

function fixToolbarSet()
{
  // This covers any changes to brand.toolbar.items
  // This should also cover migration scenarios. latestset doesn't exist
  // for older versions, so getAttribute will return null.
  if (JSON.stringify(brand.toolbar.items) == tb.getAttribute("latestset")) {
    return;
  }

  // We're going to reset the toolbar, but first we need to remove
  // separators and springs otherwise they get duplicated
  var separators = tb.querySelectorAll("toolbarseparator");
  for (var i=0; i < separators.length; i++)
    tb.removeChild(separators[i]);
  var springs = tb.querySelectorAll("toolbarspring");
  for (var i=0; i < springs.length; i++)
    tb.removeChild(springs[i]);

  var defaultset = [];
  for (let i in brand.toolbar.items) {
    var tbitem;
    if (i == "separator") {
      tbitem = document.createElement("toolbarseparator");
      tbitem.setAttribute("removable", "true");
      defaultset.push("separator");
    } else if (i == "spring") {
      tbitem = document.createElement("toolbarspring");
      tbitem.setAttribute("removable", "true");
      tbitem.setAttribute("flex", "1");
      defaultset.push("spring");
    } else {
      tbitem = E("united-" + i);
      defaultset.push("united-" + i);
      // If the item is not on our toolbar, we don't move it
      if (!tbitem || tbitem.parentNode != tb)
        continue;
    }
    if (tbitem)
      tb.appendChild(tbitem);
  }
  // currentSet is the internal representation of the currentset. Since
  // we might have changed it, set it as an attribute
  tb.setAttribute("currentset", tb.currentSet);
  // Set the defaultset attribute so "Restore Default Set" works
  tb.setAttribute("defaultset", defaultset.join(','));
  // We're storing an attribute that contains our new set brand items
  // We don't want to use prefs, because they could get out of sync (#286)
  tb.setAttribute("latestset", JSON.stringify(brand.toolbar.items));
  document.persist(tb.id, "currentset");
  document.persist(tb.id, "defaultset");
  document.persist(tb.id, "latestset");
  // The list has changed, so we need to reset hidden buttons
  ourPref.reset("hiddenButtons");
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


/**
 * Add the given toolbar button into the given toolbar, using
 * the previous location if specified.
 * If we can't use the previous location and it is the united-toolbar,
 * we try to put it back in the right spot.
 *
 * @param toolbarID {String}  ID of the toolbar to add it to
 * @param button {DOMElement}  new element to add
 * @param insertAfterID {String}  if we have no other position information,
 *     i.e. no previous location stored and not in our default button list,
 *    then add it after this element.
 *    If we can't find this element either, add it at the end.
 */
function addButton(toolbarID, button, insertAfterID) {
  var toolbar = E(toolbarID);
  if (toolbar.id == "united-toolbar") {
    // Go through the brand list and figure out a location for the button
    // We work backwards from the buttons location in the array
    var brandItems = [];
    for (let i in brand.toolbar.items) {
      brandItems.push("united-" + i);
    }
    var itemIndex = brandItems.indexOf(button.id);
    for (var i = itemIndex - 1; i >= 0; i--) {
      if (toolbar.querySelector("#" + brandItems[i])) {
        _insertAfter(toolbar, button, brandItems[i])
        break;
      }
    }
    // If we couldn't find a place, just put it at the end.
    if (i < 0) {
      if (gAustralis) {
        CustomizableUI.addWidgetToArea(button.id, toolbarID);
      } else {
        toolbar.appendChild(button);
      }
    }
  } else {
    _insertAfter(toolbar, button, insertAfterID);
  }
  // Add the button to currentset and persist it
  toolbar.setAttribute("currentset", toolbar.currentSet);
  document.persist(toolbarID, "currentset");
}

/**
 * Helper function that abstracts insertAfter to work for Australis
 */
function _insertAfter(toolbar, button, insertAfterID) {
  if (gAustralis) {
    var buttonPlacement = CustomizableUI.getPlacementOfWidget(insertAfterID);
    if (buttonPlacement) {
      CustomizableUI.addWidgetToArea(button.id, toolbar.id, buttonPlacement.position+1);
    } else {
      CustomizableUI.addWidgetToArea(button.id, toolbar.id);
    }
  } else {
    insertAfter(toolbar, button, insertAfterID);
  }
}

/**
 * Removes the given button from the toolbar. Saves it's location in localstore
 * so that addButton can put it back.
 *
 * @param {string} id The ID of the button to remove
 * @returns {DOMElement} button The DOM Element for the button that was removed
 */
function removeButton(id) {
  var button = E(id);
  var origToolbar;
  if (gAustralis) {
    var buttonPlacement = CustomizableUI.getPlacementOfWidget(button.id);
    if (!buttonPlacement) {
      return button;
    }
    origToolbar = document.getElementById(buttonPlacement.area);
    CustomizableUI.removeWidgetFromArea(button.id);
  } else {
    origToolbar = button.parentNode;
    origToolbar.removeChild(button);
  }
  origToolbar.setAttribute("currentset", origToolbar.currentSet);
  document.persist(origToolbar.id, "currentset");
  return button;
}

function reshowToolbar()
{
  tb.collapsed = false;
  document.persist('united-toolbar', 'collapsed');
}
autoregisterGlobalObserver("upgrade", reshowToolbar);
autoregisterGlobalObserver("reinstall", reshowToolbar);
