/**
 * Loads the list of available feeds and their URLs,
 * From the server or from a shipped default.
 * Also gets the URL of the currently selected feed.
 *
 * The feeds list from the server must be in the following XML form:
 * <feeds>
 *   <feed id="1">
 *     <link>http://go.gmx.net/tb/mff_news</link>
 *     <title>GMX - Deutschland, Ausland und Panorama</title>
 *   </feed>
 *   ...
 * </feeds>
 */

const EXPORTED_SYMBOLS = [ "getFeedsList", "getFeedURL", ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/JXON.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");

const kFeedListRefreshInterval = 24*60*60; // 1 day
const kPrefBranch = "ticker.feedsListCache.";
const kChannelPrefname = "ticker.channel"; // also in ticker.js

/**
 * Returns the list of feeds available for the user to choose from.
 * It's fetched from the server, and cached (for up to one day).
 * In case of failure to fetch, a hardcoded value from brand.js is used.
 *
 * @param successCallback {Function(feedsList)}
 *    @param feedsList same format as brand.ticker.feedsListFallback
 *
 * @implementation note
 * XML is cached in preferences, because it should be small.
 * Cache disregards region, so we need to refresh it when the region changes.
 */
function getFeedsList(successCallback)
{
  if (ourPref.get(kPrefBranch + "since", 0) + kFeedListRefreshInterval
        > (new Date().getTime() / 1000) &&
      ourPref.get(kPrefBranch + "fromURL") == brand.ticker.feedsListURL)
  {
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                           .createInstance(Components.interfaces.nsIDOMParser);
    var feedsListXML = ourPref.get(kPrefBranch + "XML");
    successCallback(parseFeedsList(parser.parseFromString(feedsListXML, "application/xml")));
    return;
  }
  try {
    var url = brand.ticker.feedsListURL;
    new FetchHTTP({ url : url },
    function(xml) // success
    {
      assert(xml && xml.firstChild.nodeName == "feeds", "FeedsList URL didn't return XML");
      var s = new XMLSerializer();
      ourPref.set(kPrefBranch + "XML", s.serializeToString(xml));
      ourPref.set(kPrefBranch + "fromURL", url);
      ourPref.set(kPrefBranch + "since", Math.round(new Date().getTime() / 1000));
      successCallback(parseFeedsList(xml));
    },
    function(e) // error
    {
      errorInBackend(e);
      successCallback(brand.ticker.feedsListFallback);
    }).start();
  } catch (e) {
    errorInBackend(e);
    successCallback(brand.ticker.feedsListFallback);
  }
}

/**
 * @param xml {E4X} format from server, see header comment.
 * @returns same format as brand.ticker.feedsListFallback
 * @throws, if the XML is invalid
 */
function parseFeedsList(xml)
{
  var feeds = JXON.build(xml).feeds;
  var result = [];
  for each (let feed in feeds.$feed)
  {
    result.push({
      id : sanitize.integer(feed["@id"]),
      label : sanitize.label(feed.title),
      url : sanitize.url(feed.link),
    });
  }
  return result;
}

/**
 * Gets the RSS URL from prefs
 * @param successCallback {Function(url {String})}
 *   url RSS http URL
 */
function getFeedURL(successCallback)
{
  var feedsListXML = ourPref.get(kPrefBranch + "XML");
  if (feedsListXML)
  {
    var parser = new DOMParser();
    getFeedURLCallback(parseFeedsList(parser.parseFromString(feedsListXML, "application/xml")), successCallback);
  }
  else
  {
    // If we never fetched the list, trigger it here. Do *not* care about refresh here.
    // We want to refresh the list only when the user goes to the pref window,
    // or the very first time they open the ticker, not once a day on every Firefox start.
    getFeedsList(function(feedsList) { getFeedURLCallback(feedsList, successCallback); });
  }
}

function getFeedURLCallback(feedsList, successCallback)
{
  var pref = ourPref.get(kChannelPrefname);
  for each (let feed in feedsList)
  {
    if (feed.id == pref)
    {
      successCallback(feed.url);
      return;
    }
  }
  // user has pref set to feed that no longer exists in brand.js
  let defaultFeed = feedsList[0];
  ourPref.set(kChannelPrefname, defaultFeed.id);
  successCallback(defaultFeed.url);
}
