/**
 * "Marketed search terms", also called "Top searches" or "popular searches",
 * are terms deemed by UnitedInternet to provide the most revenue.
 * They are published in form of XML on the UnitedInternet website.
 * This module downloads, parses and caches them,
 * and allows callers to get the list.
 */

const EXPORTED_SYMBOLS = [ "getMarketedSearchTerms", ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

var gTerms = [];
const kCacheFilename = "marketed-searchterms.xml"; // in local profile dir (next to Cache)
const expireCurrentAfter = 1 * 24 * 60 * 60 * 1000; // one day, in ms
//const expireCurrentAfter = 60 * 1000; // 1 min, in ms TODO for test only

/**
 * If we have a cached file and it's not too old, parse.
 * Otherwise, fetch, save it and parse it.
 */
function loadFile()
{
  var cacheFile = getSpecialDir("ProfLD"); // local profile directory, where Cache is
  cacheFile.append(kCacheFilename);

  //debug(cacheFile.path + " exists " + cacheFile.exists() + ", age = " + (new Date() - cacheFile.lastModifiedTime));
  if (cacheFile.exists() &&
      cacheFile.lastModifiedTime > (new Date() - expireCurrentAfter))
  {
    // cache current
    parseResult(new XML(readFile(cacheFile).join("")));
  }
  else // not cached or cache outdated
  {
    new FetchHTTP({ url : brand.newtab.marketedSearchTermsURL, },
    function(response)
    {
      parseResult(response);
      writeFile(cacheFile, response.toString());
    },
    errorInBackend).start();
  }
}
runAsync(loadFile);

function parseResult(response)
{
  assert(typeof(response) == "xml", "Not XML");
  //debug(response.toString());
  assert(response.hotspots, "XML not in expected format");
  var result = [];
  for each (let category in response.hotspots)
    result.push(sanitize.string(category.hotspot.term));
  gTerms = result;
}

/* Example result:
<?xml version="1.0" encoding="UTF-8"?>
<hotspot-result searchbrand="mara">
  <hotspots searchterm="Computer" results="1">
    <hotspot position="1">
      <term>Bluetooth</term>
      <url>http://suche.gmx.net/</url>
    </hotspot>
  </hotspots>
  <hotspots searchterm="Ernährung" results="1">
    <hotspot position="1">
      <term>Orange</term>
      <url>http://suche.gmx.net/</url>
    </hotspot>
  </hotspots>
</hotspot-result>
*/

/**
 * Return the cached marketed search terms.
 * They were fetched from network earlier.
 * If not fetched yet (e.g. at startup), the array is empty.
 * @returns {Array of String} search terms
 */
function getMarketedSearchTerms()
{
  return gTerms.slice(0); // return copy
}
