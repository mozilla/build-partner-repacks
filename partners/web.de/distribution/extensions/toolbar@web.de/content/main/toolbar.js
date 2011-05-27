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
Components.utils.import("resource://unitedtb/tracking/aib.js", this);
Components.utils.import("resource://unitedtb/tracking/count404.js", this);
Components.utils.import("resource://unitedtb/hotnews/hotnews.js", this);

var tb;
var self = this;

function onLoad()
{
  tb = document.getElementById("united-toolbar");
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
