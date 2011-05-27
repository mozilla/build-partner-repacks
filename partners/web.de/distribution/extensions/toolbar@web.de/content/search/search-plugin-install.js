/**
 * This installs and uninstalls our search OSD files, so that
 * our search engine appears in the Firefox search field.
 *
 * This is mostly a workaround for Mozilla bug 598697.
 */

/**
 * Messages reacted to by this module:
 * "first-run"
 * "uninstall"
 */

const EXPORTED_SYMBOLS = [];

var united = {};
Components.utils.import("resource://unitedtb/util/util.js", united);
Components.utils.import("resource://unitedtb/util/observer.js", united);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", united);
Components.utils.import("resource://unitedtb/build.js", united);

/**
 * Use addEngine() API.
 *
 * It will make the added engine the default, which is broken and not wanted.
 * That's why we save oldDefault here and restore it later.
 * If the patch in bug 493051 lands for FF4 (and we drop support for FF3.6),
 * addEngine() will not longer change the default, so we can remove oldDefault,
 * and the callback will start to work.
 */
function copySearchPlugins()
{
  var search = getSearchService();
  var oldDefault = search.currentEngine;
  var oldDefaultWasUs = false;
  for each (let entry in united.brand.search.allSearchPlugins)
    if (entry.name == oldDefault.name)
      oldDefaultWasUs = true;
  for each (let entry in united.brand.search.searchPlugins)
  {
    let sourceURL = "chrome://unitedtb-searchplugins/content/" + entry.filename;
    let preexisting = search.getEngineByName(entry.name) != null;
    if (united.ourPref.isSet("search.enginePreexising." + entry.name))
      continue; // already copied (we are also called from region-changed)
    united.ourPref.set("search.enginePreexising." + entry.name, preexisting);
    search.addEngine(sourceURL, united.Ci.nsISearchEngine.DATA_XML, false, null,
    function(engine, success) // callback depends on bug 493051
    {
      if (success)
        united.debug("added search engine " + engine.name);
      else
        united.error("could not add search engine " + engine.name);
      if (engine.name != entry.name)
        united.debug("brand.js has engine name " + entry.name + ", but OSD file has name " + engine.name);
    });
  }

  united.runAsync(function() { // workaround, @see function description above
    // on region-change, change to our region engine
    if (oldDefaultWasUs)
      search.currentEngine = search.getEngineByName(
          united.brand.search.engineName);
    // restore user choice after addEngine()
    else
      search.currentEngine = oldDefault;
  }, 500);
}

function removeAddedEngines()
{
  united.debug("uninstall engines");
  var search = getSearchService();
  //for each (let entry in united.brand.search.searchPlugins)
  for each (let prefname in united.ourPref.childPrefNames("search.enginePreexising."))
  {
    united.debug("search engine " + prefname);
    let preexisting = united.ourPref.get(prefname);
    if (preexisting)
      continue;
    let engineName = prefname.substr("search.enginePreexising.".length);
    let engine = search.getEngineByName(engineName);
    search.removeEngine(engine);
  }
}

function getSearchService()
{
  return search = united.Cc["@mozilla.org/browser/search-service;1"]
      .getService(united.Ci.nsIBrowserSearchService);
}

function install(isBrandedBrowser)
{
  if (!isBrandedBrowser)
  copySearchPlugins();
}

function uninstall()
{
  if (united.kAMO)
    removeAddedEngines();
}

function regionChanged()
{
  copySearchPlugins();
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "first-run")
      install(obj.isBrandedBrowser);
    else if (msg == "region-changed")
      regionChanged();
    else if (msg == "uninstall")
      uninstall();
  }
}
united.registerGlobalObserver(globalObserver);
