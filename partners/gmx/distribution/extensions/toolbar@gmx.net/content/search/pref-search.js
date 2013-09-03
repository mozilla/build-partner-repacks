var build = {}
Components.utils.import("resource://unitedtb/build.js", build);

function onLoad()
{
  new OurEngineCheckbox(E("search-ourengine-checkbox"));
}
window.addEventListener("load", onLoad, false);

function OurEngineCheckbox(el)
{
  SettingElement.call(this, el);

  // we are already set, and we are also the default engine, so can't uncheck
  if (this.storeValue &&
      Services.search.currentEngine == Services.search.defaultEngine)
    el.hidden = true;
}
OurEngineCheckbox.prototype =
{
  get storeValue()
  {
    // nsIBrowserSearchService, same above and below
    return Services.search.currentEngine.name == brand.search.engineName;
  },
  set storeValue(val)
  {
    //<copied to="opt-in.js (with modifications">
    if (val) // turned on, set us as search engine
    {
      try {
        var engine = Services.search.getEngineByName(brand.search.engineName);
        if (engine) {
          engine.hidden = false;
          // sets pref "browser.search.selectedEngine" and notifies app
          Services.search.currentEngine = engine;
        } else {
          notifyGlobalObservers("install-searchengines", {});
        }
      } catch (e if build.kVariant == "browser") { errorNonCritical(e); } // silence for bug 163689

      ourPref.set("search.opt-in", true);
    }
    else // turned off, restore default
    {
      Services.search.currentEngine = Services.search.defaultEngine;
      ourPref.set("search.opt-in", false);
    }
    //</copied>
  },

  get defaultValue()
  {
    return true;
  },
}
extend(OurEngineCheckbox, SettingElement);
