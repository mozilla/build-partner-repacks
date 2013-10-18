function onLoad()
{
  try {
    if (brand.regions.list.length < 2 ||
        !ourPref.get("pref.show.regions"))
    {
      var prefWindow = E("united-pref-window");
      var regionPane = document.getAnonymousElementByAttribute(prefWindow, "pane", "region-pane");
      regionPane.hidden = true;
    }
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);
