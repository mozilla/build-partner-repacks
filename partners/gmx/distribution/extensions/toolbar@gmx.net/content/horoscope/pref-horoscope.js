var gStringBundle;

function onLoad()
{
  try {
  gStringBundle = new united.StringBundle(
      "chrome://unitedtb/locale/horoscope/horoscope.properties");
  buildTypeMenu();
  } catch (e) { united.debug(e); } // TODO
  if (!united.ourPref.isSet("horoscope.sign")) {
    united.ourPref.set("horoscope.sign", "none");
  }

}
window.addEventListener("load", onLoad, false);

function buildTypeMenu()
{
  var dropdown = document.getElementById("type")
  var menu = document.getElementById("type-menu");
  var pref = dropdown.value; // united.ourPref.get("ticker.channel");
  united.cleanElement(menu);
  var menuitems = ["tag","woche","monat","jahr","liebe","partnertest","typologie"];
  for (let i=0; i < menuitems.length; i++)
  {
    let menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", menuitems[i]);
    menuitem.setAttribute("label", gStringBundle.getString(menuitems[i]));
    menu.appendChild(menuitem);
    if (menuitems[i] == pref)
    {
      dropdown.selectedItem = menuitem;
    }
  }
}
