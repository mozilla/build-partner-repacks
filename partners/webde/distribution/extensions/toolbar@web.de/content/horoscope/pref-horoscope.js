var gStringBundle;

function onLoad()
{
  try {
    new HoroscopeSelector(document.getElementById("sign"));
  } catch (e) { united.debug(e); }
  try {
    gStringBundle = new united.StringBundle(
      "chrome://unitedtb/locale/horoscope/horoscope.properties");
    buildTypeMenu();
  } catch (e) { united.debug(e); } // TODO
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

function HoroscopeSelector(el)
{
  AutoPrefElement.call(this, el, "horoscope.sign", united.ourPref);
}
HoroscopeSelector.prototype =
{
  reset: function()
  {},
}
united.extend(HoroscopeSelector, AutoPrefElement);
