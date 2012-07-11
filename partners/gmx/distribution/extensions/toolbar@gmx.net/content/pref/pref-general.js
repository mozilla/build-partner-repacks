function onLoad()
{
  try {
    new HomepageSelector(document.getElementById("general-homepage-dropdown"));
    regionOnLoad();
  } catch (e) { united.errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function regionOnLoad()
{
  if (united.brand.regions.list.length < 2 ||
      !united.ourPref.get("pref.show.regions"))
  {
    var regionPage = document.getElementById("general-region-box");
    regionPage.hidden = true;
  }
}

function HomepageSelector(el)
{
  this._newTabURL = united.ourPref.get("newtab.url");
  SettingElement.call(this, el);
}
HomepageSelector.prototype =
{
  get storeValue()
  {
    var homepage = united.generalPref.get("browser.startup.homepage");
    if (homepage == this._newTabURL)
      return "newtab";
    else if (homepage == united.brand.toolbar.startpageHomepageURL)
      return "our-start-page";
    else if (homepage == united.brand.toolbar.startpageURL) // searchpage
      return "our-search-page";
    else
      return "browser-homepage";
  },
  set storeValue(val)
  {
    if (val == this.storeValue)
      return; // do not overwrite custom value
    united.generalPref.set("browser.startup.page", 1); // pay attention
    if (val == "browser-homepage")
      united.generalPref.reset("browser.startup.homepage"); // pay attention
    else if (val == "newtab")
      united.generalPref.set("browser.startup.homepage", this._newTabURL);
    else if (val == "our-start-page")
      united.generalPref.set("browser.startup.homepage",
          united.brand.toolbar.startpageHomepageURL);
    else if (val == "our-search-page")
      united.generalPref.set("browser.startup.homepage",
          united.brand.toolbar.startpageURL);
    else
      throw new NotReached("unknow value");
  },

  get defaultValue()
  {
    return "our-search-page";
  },
}
united.extend(HomepageSelector, SettingElement);
