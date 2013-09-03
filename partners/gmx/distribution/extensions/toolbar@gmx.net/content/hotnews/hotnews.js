/**
 * Display certain webpages (in RSS file on server)
 * on browser start, in new tabs.
 * Show them only once.
 */

const EXPORTED_SYMBOLS = [];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/common-jsm.js");

sessionRestoreObserve =  {
  observe: function(subject, topic, data)
  {
    if (!ourPref.get("hotnews.firstrun", true))
      fetch();
    else
      ourPref.set("hotnews.firstrun", false);
  }
}
// nsIObserverService
Services.obs.addObserver(sessionRestoreObserve, "sessionstore-windows-restored", false);

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

function parseRSS(rssDOM)
{
  var channel = JXON.build(rssDOM).rss.channel;
  let result = [];
  for each (let item in channel.$item)
  {
    try {
      let validDate = item["ui:validDate"];
      if (!validDate)
      {
        // default: valid until pubDate + 2 days
        let pubDate = item.pubDate;
        validDate = pubDate;
        validDate.setDate(validDate.getDate() + 2);
      }
      result.push({
        url : sanitize.url(item.link),
        guid : sanitize.alphanumdash(item.guid),
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
