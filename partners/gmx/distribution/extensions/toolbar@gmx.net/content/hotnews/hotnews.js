/**
 * Display certain webpages (in RSS file on server)
 * on browser start, in new tabs.
 * Show them only once.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");

// on startup
function onInit()
{
  fetch();
}
runAsync(onInit);

function fetch()
{
  new FetchHTTP({ url : brand.hotnews.rssVersionURL, method : "GET" },
  parseRSS,
  function(e)
  {
    if (e.code == 404)
    {
      // Use Fallback URL
      new FetchHTTP({ url : brand.hotnews.rssFallbackURL, method : "GET" },
          parseRSS, errorInBackend).start();
    }
    else
      errorInBackend(e);
  }).start();
}

function parseRSS(rssXML)
{
  var channel = rssXML.channel[0];
  var uiNS = "http://www.1und1.de/xmlns/tb/hotnews";
  let result = [];
  for each (let item in channel.item)
  {
    try {
      let validDate = sanitize.alphanumdash(item.uiNS::validDate[0]);
      if (validDate)
      {
        validDate = ISO8601DateUtils.parse(validDate);
      }
      else
      {
        // default: valid until pubDate + 2 days
        let pubDate = sanitize.alphanumdash(item.pubDate[0]);
        pubDate = ISO8601DateUtils.parse(pubDate);
        validDate = pubDate;
        validDate.setDate(validDate.getDate() + 2);
      }
      result.push({
        url : sanitize.url(item.link[0]),
        guid : sanitize.alphanumdash(item.guid[0]),
        validDate : validDate,
      });
    } catch (e)  { errorInBackend(e); }
  }
  useURLs(result);
}

/**
 * @param itemList { url {String}, guid {String}, validDate {Date} }
 */
function useURLs(itemList)
{
  var prefStr = ourPref.get("hotnews.shownGUIDs") || "";
  var shownGUIDs = prefStr.split(",");
  var newShownGUIDs = []; // drop old URLs no longer in file
  for each (let item in itemList)
  {
    debug("got hotnews url <" + item.url + ">, valid until " + item.validDate);
    if (arrayContains(shownGUIDs, item.guid))
    {
      debug("already shown, skipping");
      newShownGUIDs.push(item.guid);
      continue;
    }
    if (item.validDate.getTime() < new Date().getTime())
    {
      debug("already outdated, skipping");
      continue;
    }

    // show URL in new browser tab
    debug("showing <" + item.url + "> in new browser tab");
    var firefoxWindow = findSomeBrowserWindow(); // util.js
    assert(firefoxWindow, "hotnews found no open Firefox window. maybe we're too early?");
    // loadPage() is not available here
    firefoxWindow.openUILinkIn(item.url, "tab");
    newShownGUIDs.push(item.guid);
  }
  ourPref.set("hotnews.shownGUIDs", newShownGUIDs.join(","));
}
