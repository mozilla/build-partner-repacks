var build = {}
Components.utils.import("resource://unitedtb/build.js", build);

function onLoad()
{
  new OurEngineCheckbox(document.getElementById("search-ourengine-checkbox"));
}
window.addEventListener("load", onLoad, false);

function OurEngineCheckbox(el)
{
  this.searchServ = united.Cc["@mozilla.org/browser/search-service;1"]
      .getService(united.Ci.nsIBrowserSearchService);
  SettingElement.call(this, el);

  // we are already set, and we are also the default engine, so can't uncheck
  if (this.storeValue &&
      this.searchServ.currentEngine == this.searchServ.defaultEngine)
    el.hidden = true;
}
OurEngineCheckbox.prototype =
{
  get storeValue()
  {
    return this.searchServ.currentEngine.name == united.brand.search.engineName;
  },
  set storeValue(val)
  {
    //<copied to="opt-in.js (with modifications">
    if (val) // turned on, set us as search engine
    {
      try {
        var engine = this.searchServ.getEngineByName(united.brand.search.engineName);
        if (engine) {
          engine.hidden = false;
          // sets pref "browser.search.selectedEngine" and notifies app
          this.searchServ.currentEngine = engine;
        } else {
          united.notifyGlobalObservers("install-searchengines", {});
        }
      } catch (e if build.kVariant == "browser") { united.error(e); } // silence for bug 163689

      // URLbar search
      united.generalPref.set("keyword.URL", united.brand.search.keywordURL);
    }
    else // turned off, restore default
    {
      this.searchServ.currentEngine = this.searchServ.defaultEngine;
      united.generalPref.reset("keyword.URL");
    }
    //</copied>
  },

  get defaultValue()
  {
    return true;
  },
}
united.extend(OurEngineCheckbox, SettingElement);
