Components.utils.import("resource://gre/modules/AddonManager.jsm");

var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/help/help.properties");

/**
 * This implements the help menu for our toolbar.
 * It appears in the Firefox help menu and
 * in the "Settings" button dropdown.
 */

// <copied from="uiutil.js ">
function onMenuitem(event)
{
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
    loadPage(url);
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
  initMenuitems("united-helpbutton-submenu");
  gMenuInited = true;
}

function initMenuitems(containerID)
{
  // create <menuitem label="Foobar" url="..."/>, url attr used above
  var container = document.getElementById(containerID);
  if (!container) // "united-help-submenu" in Firefox menu doesn't exist on Mac
    return;
  for each (let entry in brand.toolbar.helpMenuURLEntries)
  {
    if (entry.separator) {
      container.appendChild(document.createElement("menuseparator"));
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
    container.appendChild(item);
  }
}
// </copied>

function openAboutDialog()
{
  AddonManager.getAddonByID(EMID, function(addon)
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

  AddonManager.getAddonByID(EMID, function(addon)
  {
    addon.uninstall();
  });
}
