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
function copySearchPlugins(makeDefault)
{
  var search = getSearchService();
  var oldDefault = search.currentEngine;
  var oldDefaultWasUs = !!makeDefault;
  var selectedEngine = united.generalPref.get("browser.search.selectedEngine");
  for each (let entry in united.brand.search.allSearchPlugins)
    if ((entry.name == oldDefault.name) || (entry.name == selectedEngine))
    {
      oldDefaultWasUs = true;
      break;
    }

  for each (let entry in united.brand.search.searchPlugins)
  {
    let sourceURL = "chrome://unitedtb-searchplugins/content/" + entry.filename;
    let preexisting = search.getEngineByName(entry.name) != null;
    if (united.ourPref.isSet("search.enginePreexising." + entry.name))
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
  for each (let prefname in united.ourPref.branch("search.enginePreexising.").childPrefNames())
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


/* This function is a one off and it duplicates code in other places on purpose. */
/* It is designed to go through a users existing search engines and upgrade them */
/* to be current. It only replaces engines that already exist. It puts them in */
/* the same place as they were before. If one of them was the default, it stays */
/* rhe default */
function upgradeSearchPlugins()
{
  var search = getSearchService();
  var oldDefault = search.currentEngine;
  for each (let entry in united.brand.search.searchPlugins)
  {
    var engine = search.getEngineByName(entry.name)
    if (engine) {
      let sourceURL = "chrome://unitedtb-searchplugins/content/" + entry.filename;
      search.removeEngine(engine);
      search.addEngine(sourceURL, united.Ci.nsISearchEngine.DATA_XML, null, false);
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
  for each (let entry in united.brand.search.searchPlugins)
  {
    var engine = search.getEngineByName(entry.name);
    if (engine)
      engine.hidden = false;
  }
  // If the pref selectedEngine is still set to the brand search, it means
  // they had it as the default, but it got hidden. Put it back.
  if (united.generalPref.get("browser.search.selectedEngine") == united.brand.search.engineName)
  {
    var engine = search.getEngineByName(united.brand.search.engineName);
    if (engine)
      search.currentEngine = engine;
  }
}

function install()
{
  if ( !united.ourPref.get("brandedbrowser", false) &&
      united.kVariant != "browser")
    copySearchPlugins();
}

function uninstall()
{
  if (united.kVariant == "amo")
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
        if ( !united.ourPref.get("brandedbrowser", false) &&
            united.kVariant != "browser") {
          upgradeSearchPlugins();
        } else {
          unhideSearchPlugins();
        }
      } catch (e) {
        united.errorInBackend(e)
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
united.registerGlobalObserver(globalObserver);
