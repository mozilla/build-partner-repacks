Components.utils.import("resource://gre/modules/AddonManager.jsm");

var gStringBundle = new StringBundle("help/help");

/**
 * This implements the help menu for our toolbar.
 * It appears in the Firefox help menu and
 * in the "Settings" button dropdown.
 */

// <copied from="uiutil.js ">
function onMenuitem(event)
{
  try {
    if (event.target.hasAttribute("aboutextdialog"))
      openAboutDialog();
    else if (event.target.hasAttribute("uninstall"))
      uninstall();
    else if (event.target.hasAttribute("checkforupdates"))
      unitedinternet.updates.check();
    else
    {
      var url = event.target.getAttribute("url");
      if (!url)
        throw new NotReached("expected url attribute");
      loadPage(url, "tab");
    }
    event.stopPropagation(); // prevent from bubbling to main <button>
  } catch (e) { errorCritical(e); }
};

var gMenuInited = false;
function initMenus()
{
  try {
    if (gMenuInited)
      return;
    initMenuitems("united-pref-button-dropdown", "united-pref-button-menuitem");
    initMenuitems("united-help-submenu");
    initMenuitems("united-helpbutton-submenu");
    gMenuInited = true;
  } catch (e) { errorCritical(e); }
}

function initMenuitems(containerID, insertAfterID)
{
  // create <menuitem label="Foobar" url="..."/>, url attr used above
  var container = E(containerID);
  if (!container) // "united-help-submenu" in Firefox menu doesn't exist on Mac
    return;
  // |insertAfterE| will be changed (below) while we insert new elements
  var insertAfterE = null;
  if (insertAfterID) {
    insertAfterE = E(insertAfterID);
  }
  for each (let entry in brand.toolbar.helpMenuURLEntries)
  {
    if (entry.separator) {
      insertAfterE = insertAfter(container, document.createElement("menuseparator"), insertAfterE);
      continue;
    }
    let item = document.createElement("menuitem");
    if (entry.aboutExtDialog)
      item.setAttribute("aboutextdialog", "true");
    if (entry.uninstall)
      item.setAttribute("uninstall", "true");
    if (entry.checkForUpdates)
      item.setAttribute("checkforupdates", "true");
    if (entry.url)
      item.setAttribute("url", entry.url);
    if (entry.replaceVersion && entry.url)
      item.setAttribute("url", entry.url);
    item.setAttribute("label", entry.label);
    item.addEventListener("command", onMenuitem, false);
    insertAfterE = insertAfter(container, item, insertAfterE);
  }
}
// </copied>

function openAboutDialog()
{
  AddonManager.getAddonByID(build.EMID, function(addon)
  {
    window.openDialog("chrome://mozapps/content/extensions/about.xul",
        "", "chrome,centerscreen,modal", addon);
  });
}

function uninstall()
{
  var aButtonFlags =
      (promptService.BUTTON_POS_0) * (promptService.BUTTON_TITLE_IS_STRING) +
      (promptService.BUTTON_POS_1) * (promptService.BUTTON_TITLE_CANCEL) +
      promptService.BUTTON_POS_1_DEFAULT;

  var confirm = promptService.confirmEx(window,
      gStringBundle.get("uninstall.title"),
      gStringBundle.get("uninstall.text", [brand.toolbar.name]),
      aButtonFlags,
      gStringBundle.get("uninstall.button"),
      null, null, null, {});
  if (confirm != 0)
    return;

  AddonManager.getAddonByID(build.EMID, function(addon)
  {
    addon.uninstall();
  });
}
