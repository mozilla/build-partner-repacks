function onLoad()
{
  try {
    new HomepageSelector(E("general-homepage-dropdown"));
    regionOnLoad();
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function regionOnLoad()
{
  if (brand.regions.list.length < 2 ||
      !ourPref.get("pref.show.regions"))
  {
    var regionPage = E("general-region-box");
    regionPage.hidden = true;
  }
}

function HomepageSelector(el)
{
  this._newTabURL = ourPref.get("newtab.url");
  SettingElement.call(this, el);
}
HomepageSelector.prototype =
{
  get storeValue()
  {
    var homepage = generalPref.getLocalized("browser.startup.homepage");
    if (homepage == this._newTabURL)
      return "newtab";
    else if (homepage == brand.toolbar.startpageHomepageURL)
      return "our-start-page";
    else if (homepage == brand.toolbar.startpageURL) // searchpage
      return "our-search-page";
    else
      return "browser-homepage";
  },
  set storeValue(val)
  {
    if (val == this.storeValue)
      return; // do not overwrite custom value
    generalPref.set("browser.startup.page", 1); // pay attention
    if (val == "browser-homepage")
      generalPref.reset("browser.startup.homepage"); // pay attention
    else if (val == "newtab")
      generalPref.set("browser.startup.homepage", this._newTabURL);
    else if (val == "our-start-page")
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageHomepageURL);
    else if (val == "our-search-page")
      generalPref.set("browser.startup.homepage",
          brand.toolbar.startpageURL);
    else
      throw new NotReached("unknow value");
  },

  get defaultValue()
  {
    return "our-search-page";
  },
}
extend(HomepageSelector, SettingElement);
