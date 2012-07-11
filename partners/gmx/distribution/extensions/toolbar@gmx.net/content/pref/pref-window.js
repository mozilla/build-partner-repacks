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
  try {
    if (window.arguments && typeof(window.arguments[0]) == "object")
      initWithParams(window.arguments[0]);

    hookupAllPreferencesElements(document.getElementById("tabpanels"), united.generalPref);

    united.checkDisabledModules(window); // uiuils.js
    window.sizeToContent();
    united.autoregisterGlobalObserver("region-changed", function()
    {
      united.checkDisabledModules(window);
      window.sizeToContent();
    });
  } catch (e) { united.errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function initWithParams(args)
{
  if (args.module) // see openPrefWindow() param |module|
  {
    var tabbox = document.getElementById("tabbox");
    tabbox.selectedPanel = document.getElementById(args.module + "-panel");
    tabbox.selectedTab = document.getElementById(args.module + "-tab");
  }
}

/**
 * "Apply" button clicked
 */
function save()
{
  try {
    if ( !validate(true))
      return false;
    //united.debug("validate all passed");

    united.assert(gPrefElements);
    for each (let prefElement in gPrefElements)
    {
      try {
        prefElement.save();
      } catch (e) { united.errorCritical(e); }
    }
    return true;
  } catch (e) { united.errorCritical(e); return true; }
}

/**
 * "Cancel" button clicked
 */
function cancel()
{
  try {
    united.assert(gPrefElements);
    for each (let prefElement in gPrefElements)
    {
      try {
        prefElement.cancel();
      } catch (e) { united.errorCritical(e); }
    }
    return true;
  } catch (e) { united.errorCritical(e); return true; }
}

/**
 * "Set defaults" button clicked
 * Resets *all* panels.
 */
function setDefault()
{
  try {
    united.assert(gPrefElements);
    for each (let prefElement in gPrefElements)
    {
      try {
        prefElement.reset();
      } catch (e) { united.errorCritical(e); }
    }
    return true;
  } catch (e) { united.errorCritical(e); return true; }
}

/**
 * Allows elements to validate the input.
 * There should be a <textbox onvalidate="upref.foo.checkPostalCode();">
 * (no "return" in the attribute!).
 * That function should return an error message for the user, if there's
 * a problem, otherwise null.
 *
 * This function will call all onvalidate functions successively,
 * and in case of the first error,
 * - display the error
 * - switch to the pane with the error
 * - prevent the dialog from closing.
 *
 * We wouldn't need all this, if addEventListener("dialogaccept"...
 * (in contrast to ondialogaccept="" attribute) would react to return false
 * and not close the window.
 *
 * @param save {Boolean}   @see SettingElement.validate()
 * @return {Boolean}   there was no error
 */
 function validate(save)
{
  try {
    //united.debug("save = " + save);
    united.assert(gPrefElements);
    for each (let prefElement in gPrefElements)
    {
      if ( !validateElementWithUI(prefElement, save))
        return false;
    }
    return true;
  } catch (e) { united.errorCritical(e); return true; }
}

/**
 * @param save {Boolean}   @see SettingElement.validate()
 * @return {Boolean}   there was no error
 */
function validateElementWithUI(prefElement, save)
{
  try {
    var errorMsg = prefElement.validate(save);
  } catch (e) { errorMsg = e.toString(); }
  if (errorMsg)
  {
    try {
      document.getElementById("tabbox").selectedPanel =
          united.findParentTagForElement("tabpanel", prefElement.element); // from uiutil.js
    } catch (e) { united.error("when trying to switch pane to " + pane.id + ": " + e); }
    united.errorCritical(errorMsg);
    return false;
  }
  return true;
}
