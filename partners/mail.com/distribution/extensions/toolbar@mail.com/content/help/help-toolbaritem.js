Components.utils.import("resource://gre/modules/AddonManager.jsm");

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
  for each (let entry in brand.toolbar.helpMenuURLEntries)
  {
    let item = document.createElement("menuitem");
    if (entry.aboutExtDialog)
      item.setAttribute("aboutextdialog", "true");
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
