Components.utils.import("resource://unitedtb/ticker/tickerList.js", this);

var gStringBundle;

function onLoad()
{
  try {
  gStringBundle = new StringBundle(
      "chrome://unitedtb/locale/ticker/ticker.properties");
  buildFeedMenu();
  // update labels to new region and feeds
  autoregisterGlobalObserver("region-changed", buildFeedMenu);
  } catch (e) { debug(e); } // TODO
}
window.addEventListener("load", onLoad, false);

function buildFeedMenu()
{
  var dropdown = document.getElementById("channel")
  var menu = document.getElementById("channel-menu");
  var pref = dropdown.value; // ourPref.get("ticker.channel");
  // clear first
  cleanElement(menu);
  // Display "Loading..."
  let loading = document.createElement("menuitem");
  loading.setAttribute("label", gStringBundle.get("feedslist.loading.message"));
  loading.setAttribute("value", pref);
  menu.appendChild(loading);
  dropdown.selectedItem = loading;

  // fetch feeds list from server
  getFeedsList(function(feeds)
  {
    menu.removeChild(loading);

    // add feeds as dropdown entries
    for each (let feed in feeds)
    {
      let menuitem = document.createElement("menuitem");
      menuitem.setAttribute("value", feed.id);
      menuitem.setAttribute("label", feed.label);
      menu.appendChild(menuitem);
      if (feed.id == pref)
        dropdown.selectedItem = menuitem;
    }
  });
}
