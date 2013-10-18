/**
 * News feed
 * Loads an RSS file and displays the items as <menuitem>s of a
 * dropdown button on the toolbar. The menuitem is the news title.
 * Hovering over the item gives you a tooltip with the short description.
 * Clicking on the item loads the webpage with the news story.
 *
 * We currently load the feed for each window separately.
 *
 * We load the feed on browser window open. There is a refresh time,
 * and we support 2 refresh modes (only Lazy mode is used, per kLazyRefresh):
 * - Non-lazy reloads in the background and replaces
 * the dropdown entries, so that the user always has the freshest news
 * immediately.
 * - Lazy mode does the initial load, but does not refresh in background.
 * If the user clicks on the button, the user sees possibly outdated
 * news items, but still immediately. We then, at the same time as displaying them,
 * trigger a reload (only if the refresh interval has passed/expired), and replace
 * the displayed items with the fresh ones as soon as we have them, which is
 * usually 1-3 seconds after the user opened the dropdown.
 */

Components.utils.import("resource://unitedtb/ticker/tickerList.js", this);
Components.utils.import("resource://unitedtb/util/JXON.js", this);

const kRefreshInterval = 15*60*1000; // news feed is polled in a 15min interval, per spec
const kLazyLoad = true; // false = load on startup
const kLazyRefresh = true; // don't refresh automatically in inttervals, only refresh when user clicks on dropdown

var gLastLoad = 0; // Unixtime
var gMenuE = null;
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/ticker/ticker.properties");

function onLoad()
{
  try {
    gMenuE = E("united-ticker-popup");
    gMenuE.addEventListener("popupshown", onDropdownOpened, false);
    if (kLazyLoad)
      reset();
    else
      fetchFeed();
    if (!kLazyRefresh)
      setInterval(fetchFeed, kRefreshInterval);

    autoregisterGlobalObserver("region-changed", reset);
    ourPref.observeAuto(window, "ticker.channel", fetchFeed);
  } catch(e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);


/**
 * Fetch the feed, and populate the menu with the news once we have them
 */
function fetchFeed()
{
  gLastLoad = new Date().getTime();
  getFeedURL(function(url)
  {
    new FetchHTTP({ url : url }, buildMenu, buildEmptyMenu).start();
  });
};

/**
 * Populate the dropdown with the news items
 * @param xml {E4X} RSS
 */
function buildMenu(xml)
{
  try {
    //debug(xml.toString());
    var feed = JXON.build(xml);
    var atom = false;
    var channel;
    if (feed.rss) {
      channel = feed.rss.channel;
    } else if (feed["rdf:RDF"]) {
      channel = feed["rdf:RDF"];
    } else if (feed.feed &&
        feed.feed["@xmlns"] == "http://www.w3.org/2005/Atom") {
      atom = true;
      channel = feed.feed;
    }
    var items = atom ? channel.$entry : channel.$item;

    if (!items || !items.length)
    {
      buildEmptyMenu(gStringBundle.get("feed.empty.message"));
      return;
    }
    cleanElement(gMenuE);

    var count = 0;
    for each (let item in items)
    {
      if (++count > brand.ticker.maxItems)
        break;
      //debug("item " + item);
      var url;
      var title;
      var descr;
      if ( ! atom)
      {
        url = sanitize.url(item.link);
        title = sanitize.label(item.title);
        descr = sanitize.label(item.description);
      }
      else // Atom
      {
        url = sanitize.url(item.link["@href"]);
        // title can have an attribute, and if it does, the value
        // is stored separately
        if (item.title.value)
          title = sanitize.label(item.title.value);
        else
          title = sanitize.label(item.title);
        // atom feeds can have summary as xhtml. If they do, JXON
        // incorrectly parses it all (which makes sense, since it's raw
        // HTML mixed in XML. Just ignore it.
        if (item.summary && item.summary["@type"] != "xhtml")
          descr = sanitize.label(item.summary);
      }

      let menuitem = document.createElement("menuitem");
      gMenuE.appendChild(menuitem);
      menuitem.url = url;
      menuitem.setAttribute("label", title);
      menuitem.setAttribute("tooltiptext", descr);
      menuitem.className = "menuitem-iconic united-news-item";
    }
    appendStaticEntries();
  } catch (e) {
    errorNonCritical(e);
    buildEmptyMenu(gStringBundle.get("feed.error.message"), e);
  }
}

/**
 * Make an empty dropdown entry, optionally with an error message.
 * @param errorMsg {String}
 */
function buildEmptyMenu(errorMsg, errorDetail)
{
  cleanElement(gMenuE);
  var menuitem = document.createElement("menuitem");
  gMenuE.appendChild(menuitem);
  menuitem.setAttribute("label", errorMsg);
  menuitem.setAttribute("tooltiptext", errorDetail ? errorDetail : errorMsg);
  //menuitem.className = "menuitem-iconic bookmark-item";
  menuitem.setAttribute("disabled", true);
  appendStaticEntries();
}

/**
 * Add "More..." button at the end.
 */
function appendStaticEntries()
{
  for each (let entry in brand.ticker.dropdownURLEntries)
  {
    let menuitem = document.createElement("menuitem");
    gMenuE.appendChild(menuitem);
    menuitem.url = entry.url;
    menuitem.setAttribute("label", entry.label);
    menuitem.className = "menuitem-iconic";
  }
}

/**
 * Empty the menu, and cause it to be re-populated
 * with current values the next it's used.
 */
function reset()
{
  gLastLoad = 0;
  buildEmptyMenu(gStringBundle.get("feed.loading.message"));
}

/**
 * When user clicks on news button and the dropdown opens,
 * check whether we should reload, do so, and replace the items.
 */
function onDropdownOpened(event)
{
  try {
    if (!kLazyRefresh)
      return;
    if (gLastLoad > new Date().getTime() - kRefreshInterval)
      return;
    fetchFeed();
  } catch (e) { errorNonCritical(e); }
}

/**
 * User clicked on News button or dropdown entry
 * Loads the |url| JS property in the browser, to load the news story webpage,
 * or (if user clicked directly on button) the news homepage.
 */
function onButton(event)
{
  try {
    loadPage(event.target.url ? event.target.url : brand.ticker.portalURL, "united-ticker");
  } catch (e) { errorCritical(e); }
};
