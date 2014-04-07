/**
 * This loads the brand.js and assembles brand from it.
 * It is responsible for selecting the right locale for each module,
 * and putting that in brand, so that the modules don't
 * have to care about it.
 */

/**
 * Messages sent by this module:
 * "region-changes" (global)
 *    Means: The user changed the region/country for at least one module.
 *    When: A region pref changed and we changed brand accordingly.
 *    Parameter:
 *      pref {String} The name of the region pref that changed. (Not its content.)
 */

const EXPORTED_SYMBOLS = [ "brand" ];
var brand = {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/util.js");
var build = {};
importJSM("build.js", build);
importJSM("util/observer.js", this);
var gBrandJsStringBundle = new StringBundle("brand.js"); //brand.js.properties

function load(isFirst)
{
  try {
    // read brand.currentRegion from prefs
    const prefBaseStr = "extensions.unitedinternet.region.";
    if (isFirst)
    {
      Services.prefs.addObserver(prefBaseStr, brandRegionPrefObserver, false);
    }

/*
    var prefBranch = prefService.getBranch(prefBaseStr)
        .QueryInterface(Ci.nsIPrefBranch2);
    var regionPrefs = prefBranch.getChildList("", {});
    for each (let modulename in regionPrefs)
    {
      debug("region for " + modulename + " is " + prefBranch.getCharPref(modulename));
    }
*/

    var brandfile = {}
    if (true)
    {
      //debug("loading brand.js as JS file");
      var brandfile2 = {};
      loadJS("chrome://unitedtb/content/brand.js", brandfile2);
      brandfile = brandfile2.brand;

      // all overlay
      loadJS("chrome://unitedtb/content/brand-all.js", brandfile);

      // variant overlay
      loadJS("chrome://unitedtb/content/brand-overlay.js", brandfile);
    }
    else
    {
      //debug("loading brand.js as JSON file");
      var jsonString = readURLasUTF8("chrome://unitedtb/content/brand.js");
      //debug("brand.js read");
      brandfile = JSON.parse(jsonString);
    }
    //debug("brand.js loaded");

    // TODO usually "de-de" or "en-US", but might be "de"
    var weblocale = Services.prefs.getComplexValue("intl.accept_languages",
        Ci.nsIPrefLocalizedString).data.split(",")[0];
    var appPlaceholders = {
      VERSION : build.version,
      LOCALE : weblocale,
    };
    for (let compname in brandfile)
      brand[compname] = loadComponent(brandfile, compname, null, appPlaceholders);

//  } catch (e) { errorInBackend(e); }
  } catch (e) { errorInBackend(e);
    promptService.alert(null, "error when loading brand.js", e + "");
  }
}

/**
 * brandfile has structure:   component : { "de-DE" : { foo : "%BAR%" } }
 * brand has structure:       component : { foo : "bar" }
 *
 * So, this function picks the right locale, merges |brandfile.global| into it,
 * and replaces %FOO% placefolders with their values, including
 * considering brandfile.global.
 * It also replaces strings starting with "$TR " with their translations from
 * brand.js.properties.
 *
 * Note brandfile.global will be used in the locale of this component,
 * i.e. weather may get a different value for global placeholder %WWW%
 * than the general toolbar.
 *
 * @param brandfile {Object} the content of brand.js, as JSON objects
 * @param locale {String} ISO-639-1. Optional - if null, will be read from prefs.
 * @returns {Object} brand.component
 */
function loadComponent(brandfile, componentname, locale, upperPlaceholders)
{
  if (!locale)
    locale = ourPref.get("region." + componentname);
  if (!locale)
    locale = ourPref.get("region.general");
  // If locale is not specified, use the first entry in the locale list
  if (!locale)
    locale = brandfile.regions.defaultlocale.list[0].locale

  if (componentname != "global") // avoid loop
  {
    // use global placeholders in the locale of *this* component
    let glo = loadComponent(brandfile, "global", locale, {});
    upperPlaceholders = getPlaceholders(glo, upperPlaceholders);
  }

  var result = {};
  var brandfileComp = brandfile[componentname];
  if (!brandfileComp || !(brandfileComp[locale] || brandfileComp.defaultlocale))
    throw new NotReached("could not load brand vars for component " + componentname + " for locale " + locale);
  if (brandfileComp[locale])
    mixInto(brandfileComp[locale], result);
  if (brandfileComp.defaultlocale)
    mixInto(brandfileComp.defaultlocale, result);

  replaceVars(result, getPlaceholders(result, upperPlaceholders));
  /*
  var ph = getPlaceholders(result, upperPlaceholders)
  //debugObject(result, componentname + " vars: ");
  //debugObject(ph, componentname + " placeholders: ");
  replaceVars(result, ph);
  if (componentname != "global")
    debugObject(result, componentname + " replaced vars: ");
  */
  return result;
}

/**
 * Extracts |placeholder_FOO| properties of |vars| and returns them.
 * @param upperPlaceholders {Object} will be put in result.
 *    |upperPlaceholders| will not be altered.
 * @returns {Object} with e.g. FOO : "http://www.com"
 */
function getPlaceholders(vars, upperPlaceholders)
{
  // make copy, to not pullute other namespaces
  var placeholders = deepCopy(upperPlaceholders);

  for (let name in vars)
  {
    if (name.substr(0, 12) != "placeholder_" ||
        typeof(vars[name]) != "string")
      continue;
    placeholders[name.substr(12)] = replaceVar(vars[name], placeholders);
  }
  return placeholders;
}

/**
 * Replaces %FOO% in properties of |vars| with value from |placeholders|.
 *
 * Also replaces strings starting with "$TR " with their translations.
 *
 * @param vars {Object} variables to be expanded.
 *    |vars| is in/out, i.e. will be altered.
 * @param placeholders {Object} @see getPlaceholders() result
 *    |placeholders| will not be altered.
 * @returns nothing
 */
function replaceVars(vars, placeholders)
{
  // replace the placeholders in the normal variables in |vars|
  for (let name in vars)
  {
    let value = vars[name];
    if (typeof(value) == "string")
      vars[name] = replaceVar(vars[name], placeholders);
    else if (typeof(value) == "object" && value instanceof Array)
      for each (let entry in value)
        replaceVars(entry, placeholders);
    else if (typeof(value) == "object")
      replaceVars(value, placeholders);
  }
}

/**
 * Replaces %FOO% in value with value from |placeholders|.
 *
 * Also replaces strings starting with "$TR " with their translations.
 *
 * @param value {String}  to be expanded
 * @param placeholders {Object} @see getPlaceholders() result
 *    |placeholders| will not be altered.
 * @returns replaced value
 */
function replaceVar(value, placeholders)
{
  // translations
  if (value.substr(0, 4) == "$TR ")
  {
    try {
      value = gBrandJsStringBundle.get(value.substr(4));
    } catch (e) { errorInBackend("missing translation of " + value + " for brand.js"); }
  }

  if (value.indexOf("%") == -1) // has no placeholders
    return value;

  for (let phname in placeholders)
  {
    value = value.replace("%" + phname + "%", placeholders[phname]);
  }
  return value;
}

var brandRegionPrefObserver =
{
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
  /**
   * @param topic = "nsPref:changed"
   * @param data {String}  pref name
   */
  observe: function(subject, topic, data)
  {
    load(false);
    notifyGlobalObservers("region-changed", { pref : data });
  }
};

load(true);
