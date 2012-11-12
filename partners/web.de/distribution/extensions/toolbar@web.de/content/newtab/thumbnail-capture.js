Cu.import("resource://unitedtb/util/globalobject.js", this);

XPCOMUtils.defineLazyServiceGetter(this, "annotationService",
    "@mozilla.org/browser/annotation-service;1", "nsIAnnotationService");
XPCOMUtils.defineLazyServiceGetter(this, "historyService",
    "@mozilla.org/browser/nav-history-service;1", "nsINavHistoryService");

/////////////////////////////////////////////////////
// Browser page load hookup
/////////////////////////////////////////////////////

/**
 * Messages observed:
 * "uninstall" (extension.js)
 *    Effect: private data (thumbnails) is removed from profile
 */


function onLoad()
{
  autoregisterGlobalObserver("uninstall", cleanUpOnUnInstall);
  gBrowser.addTabsProgressListener(webProgressListener);
  findLastModified();
}
window.addEventListener("load", onLoad, false);

var webProgressListener =
{
  // |browser| == <browser> (iframe) which fired the event. != gBrowser
  onStateChange : function(browser, webProgress, request, stateFlags, status)
  {
    if (stateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
        stateFlags & Ci.nsIWebProgressListener.STATE_IS_WINDOW)
      onPageLoad(browser);
    return 0;
  },
  onLocationChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {},
  onLinkIconAvailable: function() {},
  // it's not a real Ci.nsIWebProgressListener
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupportsWeakReference])
}

// How often to refresh the thumbnail
const expireCurrentAfter = 24 * 60 * 60 * 1000; // one day, in ms
//const expireCurrentAfter = 60 * 1000; // one minute, in ms TODO for test only
// When Firefox will delete the thumbnail (if not refreshed)
const expireStorageAfter = Ci.nsIAnnotationService.EXPIRE_WEEKS;

function onPageLoad(browser)
{
  var pageURL = browser.currentURI.spec;
  initialPopulateHack(pageURL, browser);
  var entry = getMostVisitedEntryForURL(pageURL, browser);
  if (!entry)
  {
    return;
  }
  //debug("lastmodtime (cached): " + entry.lastmodtime + ", earliest allowed: " + (new Date() - expireCurrentAfter) + ", diff: " + new Date(new Date() - entry.lastmodtime).toUTCString());
  if (entry.lastmodtime > (new Date() - expireCurrentAfter))
  {
    //debug("have current thumbnail");
    return;
  }
  // update cache, in case new snapshot was just made, possibly in other window
  entry.load();
  if (entry.lastmodtime > (new Date() - expireCurrentAfter))
  {
    //debug("have just made new thumbnail");
    return;
  }
  captureThumbnail(browser);
}

/////////////////////////////////////////////////////
// Thumbnail capture
/////////////////////////////////////////////////////

const thumbnailWidth = 196;
const thumbnailHeight = 134;
const visibleWidthMax = 1024;

/**
 * Makes a thumbnail of the page and stores it.
 *
 * @param browser {DOMElement <xul:browser>} the webpage rendered normally
 * @returns {String}  URL of the thumbnail image
 */
function captureThumbnail(browser)
{
  if (privateBrowsing.privateBrowsingEnabled)
    return null;
  var win = browser.contentWindow;
  if (!win)
    return null;
  var uri = browser.currentURI ? browser.currentURI :
      ioService.newURI(browser.contentDocument.location.href, null, null);
  if (uri.scheme != "http" && uri.scheme != "https")
    return null;

  var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  canvas.mozOpaque = true;
  var ctx = canvas.getContext("2d");

  canvas.height = thumbnailHeight;
  canvas.width = thumbnailWidth;
  var visibleWidth = Math.min(win.innerWidth, visibleWidthMax);
  var visibleHeight = visibleWidth / thumbnailWidth * thumbnailHeight;
  var scale = thumbnailWidth / visibleWidth;
  ctx.scale(scale, scale);
  ctx.drawWindow(win, 0, 0, visibleWidth, visibleHeight, "white");
  debug("capturing thumbnail for <" + win.location + ">, with size w " + thumbnailHeight + ", h " + thumbnailWidth +
      ", scale " + scale + ", page area w " + visibleWidth + " h " + visibleHeight);

  var imageDataURL = canvas.toDataURL("image/png")
  storeThumbnail(uri, imageDataURL);
  return imageDataURL;
}

/////////////////////////////////////////////////////
// Thumbnail storage/retrieval
/////////////////////////////////////////////////////

/**
 * Stores the thumbnail on disk.
 * Currently storing in Places database as Annotation.
 *
 * @param uri {nsIURI}  page URL for which the thumbnail is made
 * @param imageURL {URL} URL of the thumbnail image
 */
function storeThumbnail(uri, imageURL)
{
  var now = new Date();

  annotationService.setPageAnnotation(uri,
      "unitedtb/thumbnail/dataurl", imageURL,
      0, expireStorageAfter);
  annotationService.setPageAnnotation(uri,
      "unitedtb/thumbnail/lastmodtime", now.toISOString(),
      0, expireStorageAfter);

  /* save as binary:
  // <http://mdn.beonex.com/en/Code_snippets/Canvas#Saving_a_canvas_image_to_a_file>
  annotationService.setPageAnnotationBinary(aTab...uri,
      "unitedtb/thumbnail/dataurl",
      binaryArray, binaryArray.length,
      expireStorageAfter);
  */
}

/**
 * Returns an image to use as picture for a page, if stored
 * @param pageURL {String}
 * @returns {String} URL of image or
 *   null, if no thumbnail is stored
 */
function getThumbnailURL(pageURL)
{
  try {
    //return annotationService.getPageAnnotation(makeNSIURI(pageURL),
    //  "unitedtb/thumbnail/dataurl");
    var imgurl = annotationService.getPageAnnotation(makeNSIURI(pageURL),
      "unitedtb/thumbnail/dataurl");
    //debug("returning thumbnail URL for <" + pageURL + ">: <" + imgurl.substr(0,30) + "...>");
    return imgurl;
  } catch (e) {
    //debug("have no thumbnail for <" + pageURL + ">");
    return null;
  }
}

/////////////////////////////////////////////////////
// Most visited list
/////////////////////////////////////////////////////

var gMostVisited = [];
const kMostVisitedEntryCount = 20; // store top n most visited URLs in gMostVisited. This is n.

function findLastModified()
{
  if (!haveGlobalObject("united", "most-visited"))
    setGlobalObject("united", "most-visited", []);
  gMostVisited = getGlobalObject("united", "most-visited");
  gMostVisited.splice(0); // flush: remove all entries from array

  var query = historyService.getNewQuery();
  var options = historyService.getNewQueryOptions();
  var O = Ci.nsINavHistoryQueryOptions;
  options.queryType = O.QUERY_TYPE_HISTORY;
  options.resultType = O.RESULT_AS_URI;
  options.sortingMode = O.SORT_BY_VISITCOUNT_DESCENDING;
  options.maxResults = kMostVisitedEntryCount;
  try {
    options.redirectsMode = O.REDIRECTS_MODE_TARGET;
  } catch (ex) {
    // This doesn't work on FF14
  }
  var result = historyService.executeQuery(query, options); // TODO should be async
  var container = result.root;
  container.containerOpen = true;
  //debug("have " + container.childCount + " entries in history");
  for (let i = 0; i < container.childCount; i ++)
  {
    let node = container.getChild(i);
    // <http://mdn.beonex.com/en/nsINavHistoryResultNode>
    //debug(i + ". " + node.accessCount + "times <" + node.uri + ">, title: " + node.title);
    if ((node.uri.substr(0, 5) != "http:" && node.uri.substr(0, 6) != "https:") || (!node.title))
      continue;
    let entry = new MostVisitedEntry(node.uri);
    entry.title = node.title;
    entry.faviconURL = node.icon;
    gMostVisited.push(entry);
  }
  container.containerOpen = false;
}

XPCOMUtils.defineLazyServiceGetter(this, "faviconService",
    "@mozilla.org/browser/favicon-service;1", "nsIFaviconService");

/**
 * Make sure we fill the most visited list
 * (when the history is still almost empty)
 * and make thumbnails of these pages.
 *
 * Populate gMostVisited on fresh profiles immediately,
 * instead of waiting for new window open
 * (when we normally search the history and populate gMostVisited),
 * or searching the history on every pageload,
 * do it only when when we don't have enough entries yet.
 *
 * Just findLastModified(); should suffice, but it doesn't,
 * because our webProgressListener for some pages fires
 * before the Firefox History Service (Places) added the URL
 * to the global history, so we won't find the just-loaded URL
 * in history just yet.
 *
 * HACK So, we'll just directly add it to gMostVisited.
 *
 * @param url { String }
 * @param browser {<browser>}
 */
function initialPopulateHack(url, browser)
{
  if (gMostVisited.length < kMostVisitedEntryCount)
  {
    //debug("have only " + gMostVisited.length + " entries in gMostVisited");
    findLastModified(); // flushes gMostVisited, and searches history

    // HACK just add current URL
    if (url.substr(0, 5) != "http:" && url.substr(0, 6) != "https:")
      return;
    let entry = new MostVisitedEntry(url);
    try {
      entry.title = browser.contentTitle;
      entry.faviconURL = faviconService.getFaviconForPage(browser.currentURI);
    } catch (e if e.result == Components.results.NS_ERROR_NOT_AVAILABLE) {} // no favicon
      catch (e) { errorInBackend(e) };
    gMostVisited.push(entry);

    //debug("now have " + gMostVisited.length + " entries in gMostVisited");
  }
}

/**
 * @param url { String }
 * @returns { MostVisitedEntry } or
 *   null, if not a most visited page
 */
function getMostVisitedEntryForURL(url, browser)
{
  var entry = null;
  gMostVisited.forEach(function (e)
  {
    if (e.url == url)
      entry = e;
  });
  //debug("found URL in gMostVisited? " + entry);
  return entry;
}

/**
 * @param url { String }
 */
function MostVisitedEntry(url)
{
  assert(typeof(url) == "string" && url);
  this.url = url;
  this.load();
}
MostVisitedEntry.prototype =
{
  // { String }
  url : null,
  // Time when snapshot was taken. {Integer} unixtime. 0, if no snapshot.
  lastmodtime : 0,
  // { String } HTML page <title>
  title : null,
  // { String } internal URL of the favicon of the site, or the default icon
  faviconURL : null,
  load : function()
  {
    try {
      this.lastmodtime = new Date(Date.parse(
          annotationService.getPageAnnotation(makeNSIURI(this.url),
            "unitedtb/thumbnail/lastmodtime"))).getTime();
    } catch (e) {} // default = unixtime 0 = 1970
  },
  getThumbnailURL : function()
  {
    return getThumbnailURL(this.url);
  },
}


/**
* Clean up sensitive data on uninstall.
*
* Cleans: annotations:
*         - unitedtb/thumbnail/dataurl
*         - unitedtb/thumbnail/lastmodtime
* @param {String} message (via observer mechanism)
*/
function cleanUpOnUnInstall()
{
  // TODO throws in FF 3.6 -- #285
  var URIs = annotationService.getPagesWithAnnotation("unitedtb/thumbnail/dataurl");
  for (var index in URIs)
  {
    var URI = URIs[index];
    annotationService.removePageAnnotation(URI, "unitedtb/thumbnail/dataurl");
    annotationService.removePageAnnotation(URI, "unitedtb/thumbnail/lastmodtime");
  }
}
