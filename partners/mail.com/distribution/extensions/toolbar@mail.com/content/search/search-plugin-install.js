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
 * "install-searchengines"
 *    Effect:
 *    1. all our search engines are installed
 *    2. We are set as the default
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://unitedtb/util/observer.js", this);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", this);
Components.utils.import("resource://unitedtb/build.js", this);

/**
 * Use addEngine() API.
 *
 * It will make the added engine the default, which is broken and not wanted.
 * That's why we save oldDefault here and restore it later.
 * If the patch in bug 493051 lands for FF4 (and we drop support for FF3.6),
 * addEngine() will not longer change the default, so we can remove oldDefault,
 * and the callback will start to work.
 */
function copySearchPlugins(makeDefault)
{
  var search = getSearchService();
  var oldDefault = search.currentEngine;
  var oldDefaultWasUs = !!makeDefault;
  var selectedEngine = generalPref.get("browser.search.selectedEngine");
  for each (let entry in brand.search.allSearchPlugins)
    if ((entry.name == oldDefault.name) || (entry.name == selectedEngine))
    {
      oldDefaultWasUs = true;
      break;
    }

  for each (let entry in brand.search.searchPlugins)
  {
    let sourceURL = "chrome://unitedtb-searchplugins/content/" + entry.filename;
    let preexisting = search.getEngineByName(entry.name) != null;
    if (ourPref.isSet("search.enginePreexising." + entry.name))
    {
      /* The pref is not enough. We should verify that the search engine exists */
      /* In particular, when installed on 3.6, we set the pref but the search engines */
      /* disappear on uninstall */
      if (search.getEngineByName(entry.name))
      {
        search.getEngineByName(entry.name).hidden = false;
        continue; // already copied (we are also called from region-changed)
      }
    }
    ourPref.set("search.enginePreexising." + entry.name, preexisting);
    search.addEngine(sourceURL, Ci.nsISearchEngine.DATA_XML, false, null,
    function(engine, success) // callback depends on bug 493051
    {
      if (success)
        debug("added search engine " + engine.name);
      else
        error("could not add search engine " + engine.name);
      if (engine.name != entry.name)
        debug("brand.js has engine name " + entry.name + ", but OSD file has name " + engine.name);
    });
  }

  runAsync(function() { // workaround, @see function description above
    // on region-change, change to our region engine
    if (oldDefaultWasUs)
      search.currentEngine = search.getEngineByName(
          brand.search.engineName);
    // restore user choice after addEngine()
    else
      search.currentEngine = oldDefault;
  }, 500);
}

function removeAddedEngines()
{
  debug("uninstall engines");
  var search = getSearchService();
  //for each (let entry in brand.search.searchPlugins)
  for each (let prefname in ourPref.branch("search.enginePreexising.").childPrefNames())
  {
    debug("search engine " + prefname);
    let preexisting = ourPref.get(prefname);
    if (preexisting)
      continue;
    let engineName = prefname.substr("search.enginePreexising.".length);
    let engine = search.getEngineByName(engineName);
    search.removeEngine(engine);
  }
}

function getSearchService()
{
  return search = Cc["@mozilla.org/browser/search-service;1"]
      .getService(Ci.nsIBrowserSearchService);
}


/* This function is a one off and it duplicates code in other places on purpose. */
/* It is designed to go through a users existing search engines and upgrade them */
/* to be current. It only replaces engines that already exist. It puts them in */
/* the same place as they were before. If one of them was the default, it stays */
/* rhe default */
function upgradeSearchPlugins()
{
  var search = getSearchService();
  var oldDefault = search.currentEngine;
  for each (let entry in brand.search.searchPlugins)
  {
    var engine = search.getEngineByName(entry.name)
    if (engine) {
      let sourceURL = "chrome://unitedtb-searchplugins/content/" + entry.filename;
      search.removeEngine(engine);
      search.addEngine(sourceURL, Ci.nsISearchEngine.DATA_XML, null, false);
    }
  }
  search.currentEngine = oldDefault;
}

// Unforunately we accidentally ran the upgradeSearchPlugins code on our bundle
// builds with the side effect of hiding the search engine.
// So we need to unhide it.
// This code only runs for branded builds in an upgrade
function unhideSearchPlugins()
{
  var search = getSearchService();
  for each (let entry in brand.search.searchPlugins)
  {
    var engine = search.getEngineByName(entry.name);
    if (engine)
      engine.hidden = false;
  }
  // If the pref selectedEngine is still set to the brand search, it means
  // they had it as the default, but it got hidden. Put it back.
  if (generalPref.get("browser.search.selectedEngine") == brand.search.engineName)
  {
    var engine = search.getEngineByName(brand.search.engineName);
    if (engine)
      search.currentEngine = engine;
  }
}

/**
 * The search service is now asynchronously initialized, so we need to handle
 * that whenever we invoke the search service early on in the Firefox process
 * @param func {Function} to be executed after the search service is initialized.
 * If that already happened, execute it immediately.
 */
function searchInitRun(func)
{
  var search = getSearchService();
  if (search.init && !search.isInitialized)
    search.init(func);
  else
    func();
}


function install()
{
  if ( !ourPref.get("brandedbrowser", false) &&
      kVariant != "browser")
    searchInitRun(copySearchPlugins);
}

function uninstall()
{
  if (kVariant == "amo")
    removeAddedEngines();
}

function regionChanged()
{
  install();
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "first-run")
      install();
    else if (msg == "upgrade")
    {
      try {
        if ( !ourPref.get("brandedbrowser", false) &&
            kVariant != "browser") {
          searchInitRun(upgradeSearchPlugins);
        } else {
          searchInitRun(unhideSearchPlugins);
        }
      } catch (e) {
        errorInBackend(e)
      }
      install();
    }
    else if (msg == "install-searchengines")
      copySearchPlugins(true);
    else if (msg == "region-changed")
      regionChanged();
    else if (msg == "uninstall")
      uninstall();
  }
}
registerGlobalObserver(globalObserver);
