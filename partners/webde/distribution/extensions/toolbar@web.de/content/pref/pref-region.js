function onLoad()
{
  if (united.brand.regions.list.length < 2 ||
      !united.ourPref.get("pref.show.regions"))
  {
    var prefWindow = document.getElementById("united-pref-window");
    var regionPane = document.getAnonymousElementByAttribute(prefWindow, "pane", "region-pane");
    regionPane.hidden = true;
  }
}
window.addEventListener("load", onLoad, false);
