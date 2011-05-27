/**
 * This is the framework for the settings dialogs of all the
 * other modules. Each module hooks in here using an overlay.
 * Each module's settings dialog just reads and writes prefs
 * the same as as Firefox/Thunderbird prefs dialogs do.
 * Per customer request, we use instant apply (on all platforms),
 * like in the Mac OS X settings dialog.
 * Each module observes its own prefs using normal
 * nsIPrefBranch2.addObserver(), united.ourPref.observeAuto() or
 * <preference> facilities, and adapts on pref change.
 * This way, the module's settings dialog and the module itself
 * are entirely decoupled and just have to agree on the pref to use.
 */

function onLoad()
{
  if (window.arguments && typeof(window.arguments[0]) == "object")
    initWithParams(window.arguments[0]);

  // buttons="accept" doesn't show the button, so do manually
  var prefWindow = document.getElementById("united-pref-window");
  prefWindow.instantApply = true;
  var okButton = prefWindow.getButton("accept");
  okButton.hidden = false;
  okButton.disabled = false;
  okButton.label = prefWindow.getAttribute("closebuttonlabel");
  okButton.accesskey = prefWindow.getAttribute("closebuttonaccesskey");
  window.sizeToContent();

  united.checkDisabledModules(window); // uiuils.js
  united.autoregisterGlobalObserver("region-changed", function()
  {
    united.checkDisabledModules(window);
  });
}
window.addEventListener("load", onLoad, false); // doesn't work as onload="onLoad();" :-(((

function initWithParams(args)
{
  if (args.module) // see openPrefWindow() param |module|
  {
    var prefWindow = document.getElementById("united-pref-window");
    var pane = document.getElementById(args.module + "-pane");
    prefWindow.showPane(pane);
  }
}

/**
 * Allows <prefpane>s to validate the input.
 * There should be a <prefpane onvalidate="upref.foo.checkPostalCode();">
 * (no "return" in the attribute!).
 * That function should return an error message for the user, if there's
 * a problem, otherwise null.
 * This function will call all onvalidate functions successively,
 * and in case of an error, display the error and switch to the pane with
 * the error, and prevent the dialog from closing.
 *
 * All this should be supported by <prefwindow> natively.
 * In fact, we wouldn't need it, if addEventListener("dialogaccept"...
 * (in contrast to ondialogaccept="" attribute) would react to return false
 * and not close the window.
 *
 * @param accepted {Boolean} if true, the OK button was pressed.
 *   If false, the Cancel button or the X in the window title bar was pressed.
 */
function validateAllPanes(accepted)
{
  try {
  var prefWindow = document.getElementById("united-pref-window");
  var panes = prefWindow.getElementsByTagName("prefpane");
  for (let i = 0, l = panes.length; i < l; i++)
  {
    let pane = panes.item(i);
    let validator = pane.getAttribute("onvalidate");
    if (!validator)
      continue;
    united.debug("accepted = " + accepted);
    let resetOnInvalid = !united.sanitize.boolean(accepted);
    let varstr = "let resetOnInvalid = " + resetOnInvalid + "; ";
    let errorMsg = eval(varstr + validator); // meh, no other way to run onfoo event handlers
    if (errorMsg)
    {
      united.debug(errorMsg);
      try {
        prefWindow.showPane(pane);
      } catch (e) { united.error("when trying to switch pane to " + pane.id + ": " + e); }
      united.errorCritical(errorMsg);
      return !accepted; // if cancel: close. if OK button: stay open and let correct.
    }
  }
  //united.debug("all panes OK");
  return true;
  } catch (e) { united.errorCritical(e); return true; }
}
