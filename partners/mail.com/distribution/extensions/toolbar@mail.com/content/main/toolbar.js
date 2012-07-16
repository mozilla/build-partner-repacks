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
 */

// Doesn't belong here, but don't know a better place
Components.utils.import("resource://unitedtb/main/extension.js", this);
Components.utils.import("resource://unitedtb/hotnews/hotnews.js", this);

var tb;

function onLoad()
{
  tb = document.getElementById("united-toolbar");
  fixToolbarSet();
  united.checkDisabledModules(window); // uiuils.js
  united.autoregisterGlobalObserver("region-changed", function(obj)
  {
    united.checkDisabledModules(window);
    onWindowResize();
  });
  united.autoregisterGlobalObserver("do-customize-toolbar", function(obj)
  {
    united.assert(typeof(obj.mode) == "string");
    tb.setAttribute("mode", obj.mode);
    tb.ownerDocument.persist(tb.id, "mode");
    onButtonSizeChangedByCode();
  });
}
window.addEventListener("load", onLoad, false);

/**
 * If you in your code change a button in a way that changes its size,
 * you must call this function (united.toolbar.onButtonSizeChangedByCode),
 * so that the automatic shrinking can adapt.
 */
function onButtonSizeChangedByCode()
{
  united.runAsync(function() { // TODO HACK Caused by new shopping button. Find out why this happens and fix properly. See #255.
  onWindowResize(); // in toolbar-resize.js
  }, 100);
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
 * We have to add toolbar items to <toolbarpalette> and via
 * <toolbar defaultset="">. However, the latter is copied to currentset=""
 * and this *not* updated on upgrade, i.e. new toolbar items never show up.
 * Work around this, by resetting currentset when defaultset changed.
 * <https://bugzilla.mozilla.org/show_bug.cgi?id=577822>
 * <http://84.16.230.222/projects/jai0wePh/ticket/131>
 */
function fixToolbarSet()
{
  try {
    var defaultset = tb.getAttribute("defaultset");
    //united.debug("toolbar currentSet is <" + tb.currentSet + ">");
    //united.debug("toolbar defaultSet is <" + defaultset + ">");
    //united.debug("toolbar last defaultSet is " + (tb.getAttribute("last-defaultset") == defaultset ? "" : "not") + " the same: <" + tb.getAttribute("last-defaultset") + ">");
    if (tb.getAttribute("last-defaultset") == defaultset
        && tb.currentSet != "__empty")
      return; // defaultset didn't change (either no upgrade, or no new items)
    setEnabledToolbarButtons(defaultset);
    tb.setAttribute("last-defaultset", defaultset);
    document.persist("united-toolbar", "last-defaultset");
  } catch (e) { united.errorInBackend(e); }
}

/**
 * Sets the toolbar buttons that should be shown on our toolbar
 *
 * Workaround for a XUL <toolbar> bug:
 * tb.currentSet = list; should suffice, but it doesn't :(
 *
 * @param list {String} comma-separated list of element IDs
 */
function setEnabledToolbarButtons(list)
{
  //united.debug("setting toolbar button list to <" + list + ">");
  tb.currentSet = list;
  tb.setAttribute("currentset", list); // should be done by property setter, but isn't
  // <http://mdn.beonex.com/en/Code_snippets/Toolbar>
  document.persist("united-toolbar", "currentset"); // make sure we write to disk
  try { // If you don't do the following call, funny things happen
    BrowserToolboxCustomizeDone(true); // Firefox function
  } catch (e) { united.errorInBackend(e); }
}

/**
 * Gives the given list of toolbar buttons currently *shown* on our toolbar
 * @returns list {String} comma-separated list of element IDs
 */
function getEnabledToolbarButtons()
{
  return tb.currentSet;
}

united.autoregisterGlobalObserver("upgrade", function(obj)
{
  tb.collapsed = false;
  document.persist('united-toolbar', 'collapsed');
});
