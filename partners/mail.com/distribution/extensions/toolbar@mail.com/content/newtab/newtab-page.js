Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/search/search-store.js");
Components.utils.import("resource://unitedtb/util/JXON.js");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
try {
  // These don't exist before Firefox 13, so we need a try catch
  // We won't use either unless we are at least Firefox 13 anyway
  Components.utils.import("resource:///modules/PageThumbs.jsm");
  Components.utils.import("resource:///modules/NewTabUtils.jsm");
} catch (ex) {}

var favicons = Components.classes["@mozilla.org/browser/favicon-service;1"]
                         .getService(Components.interfaces.nsIFaviconService)
                         .QueryInterface(Components.interfaces.mozIAsyncFavicons);

var unitedFromAbove;
var firefoxWindow;
var searchField;
var gAutocomplete;

var useFirefoxNewTab = true;

function onLoad()
{
  // We need to access the global unitedinternet.newtab object, but we can't
  // because we are not in the browser scope. Get it from the browser window.
  // We do this because we need to access variables and functions in
  // thumbnail-capture.js which is loaded per window.
  // This is only needed for Firefox versions < 14 where we use our own
  // thumbnails on the new tab page.
  firefoxWindow = getTopLevelWindowContext(window);
  unitedFromAbove = firefoxWindow.unitedinternet;

  useFirefoxNewTab = generalPref.defaults.get("browser.newtab.url", "about:blank") != "about:blank";

  searchField = document.getElementById("searchterm");
  if (ourPref.get("newtab.setFocus"))
    searchField.focus();

  initAutocomplete();
  initBrand();
  fillUserSearchTerms();
  getRecommendedSites(fillRecommendedSites);
  if (useFirefoxNewTab) {
    document.getElementById("most-visited-list").style.display = "none";
    var firefoxThumbnailsIFrame = document.getElementById("firefoxThumbnails");
    firefoxThumbnailsIFrame.addEventListener("load", function(event) {
      var doc = event.target.contentDocument;
      // Add a custom attribute for our CSS. I investigated loading our CSS
      // dynamically, but it caused a flash. Better to load via chrome.manifest
      doc.getElementById('newtab-scrollbox').setAttribute('united-toolbar','true');
      // Make sure our new tab page is never disabled
      doc.getElementById('newtab-grid').removeAttribute('page-disabled');
      doc.getElementById('newtab-scrollbox').removeAttribute('page-disabled');
      // Reinitialize page just in case it was disabled
      event.target.contentWindow.gPage._init();
      // Use favicons for sites where we have no thumbnail
      addSitePlaceholders(doc);
      
    }, false);
    // The Firefox new tab page doesn't refresh, so we force it.
    // Load the page only after the cache is populated.
    NewTabUtils.links.populateCache(function () {
      firefoxThumbnailsIFrame.contentDocument.location.replace("chrome://browser/content/newtab/newTab.xul");
      },
      true);
  } else {
    document.getElementById("firefoxThumbnails").style.display = "none";
    fillMostVisited();
  }

}
window.addEventListener("load", onLoad, false);

// If there is no entry in the PageThumbsCache for a given URL, we
// use a favicon instead
function addSitePlaceholders(doc) {
  let cells = doc.querySelectorAll(".newtab-cell");
  // Can't use for each because Nodelists contains the length as a member
  for (let i=0; i < cells.length; i++) {
    let cell = cells[i];
    var link = cell.querySelector(".newtab-link");
    if (link) {
      // When a user clicks on a link, we want it to go outside the iframe
      link.setAttribute("target", "_top");
      var url = link.getAttribute("href");
      PageThumbsCache.getReadEntry(url, ReadEntryCallback(url, cell.querySelector(".newtab-thumbnail")));
    }
  }
}

// We need to use a separate function for this because we can not use a closure
// in a loop
function ReadEntryCallback(url, thumbnail) {
  return function(aSourceEntry) {
    if (!aSourceEntry) {
      thumbnail.style.backgroundSize = "auto";
      thumbnail.style.backgroundPosition = "center center";
      thumbnail.style.backgroundImage = "url('chrome://mozapps/skin/places/defaultFavicon.png')";
      favicons.getFaviconURLForPage(NetUtil.newURI(url), function(aURI, aDataLen, aData, aMimeType) {
        if (aURI)
        {
          var iconURL = favicons.getFaviconLinkForIcon(aURI).spec;
          thumbnail.style.backgroundImage = "url('" + iconURL + "')";
        }
      });
    }
  }
}

function initAutocomplete()
{
  Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js", this);
  loadJS("chrome://unitedtb/content/util/AutoComplete.js", this);
  loadJS("chrome://unitedtb/content/search/mcollect/mAutocompleteSource.js", this);

  gAutocomplete = new AutocompleteWidget(searchField, { xul: false });
  gAutocomplete.addSource(new mCollectAutocompleteSource(gAutocomplete, firefoxWindow));
}

// <copied to="neterror.js">

//////////////////////////////////////////
// Fill lists of search terms
//////////////////////////////////////////

function fillUserSearchTerms()
{
  var manageE = document.getElementById("last-searches-manage");
  manageE.setAttribute("have-results", "false");
  getLastSearches(20, function(terms) // search-store.js
  {
    fillSearchTerms(terms, "last-searches-list", 5);
    if (terms && terms.length)
      manageE.setAttribute("have-results", "true");
  },
  error);
}

/*
 * Creates
 * <li><a href="http://...?su=term">term</a></li>
 */
function fillSearchTerms(terms, listID, sourceID)
{
  var listE = document.getElementById(listID);
  cleanElement(listE);
  for each (let term in terms)
  {
    let item = document.createElement("li");
    let link = document.createElement("a");
    var url;
    if (sourceID == 5)
      url = brand.search.historyNewTabURL;
    else
      throw NotReached("known source value");
    url += encodeURIComponent(term);
   /*  The user did not enter the search term,
    * but it's a stored search term from the personal search history, or
    * a marketed search term, and the user just clicked on the term.
    * The differentiation is required by Google contracts.
    * HACK hardcoded, breaks customizability */
    url += "&related=true&rq=" + term;        
    link.setAttribute("href", url);
    link.appendChild(document.createTextNode(term));
    item.appendChild(link);
    listE.appendChild(item);
  }

  // "no results"
  if (!terms || !terms.length)
  {
    let item = document.createElement("li");
    //item.setAttribute("class", "no-results");
    //item.setAttribute("fred", "no-results");
    item.classList.add("no-results");
    let text = listE.getAttribute("no-results-text");
    item.appendChild(document.createTextNode(text));
    listE.appendChild(item);
  }
}
// </copied>

function initBrand()
{
  document.getElementById("logo").setAttribute("href",
      brand.toolbar.homepageURL);
}


//////////////////////////////////////////
// Fill most visited buttons
//////////////////////////////////////////

const maxItems = 9;
const maxTitleChars = 40;
const maxRecommendedItems = 9;

function fillMostVisited()
{
  var listE = document.getElementById("most-visited-list");
  cleanElement(listE);
  initialFillIfNecessary();
  var i = 0;
  for each (let entry in unitedFromAbove.newtab.gMostVisited)
  {
    if (++i > maxItems)
      break;
    let titleText = entry.title || entry.url;
    if (titleText.length > maxTitleChars)
      titleText = titleText.substr(0, maxTitleChars);
    let item = document.createElement("div");
    item.setAttribute("class", "mostvisited");
    let link = document.createElement("a");
    link.setAttribute("href", entry.url);
    let title = document.createElement("span");
    title.appendChild(document.createTextNode(titleText));
    title.setAttribute("class", "sitetitle");
    let imgThumbDiv = document.createElement("div");
    imgThumbDiv.setAttribute("class", "thumbnail");
    let imgThumb = document.createElement("img");
    var tn = entry.getThumbnailURL();
    if (!tn)
    {
      if (entry.faviconURL) {
        tn = entry.faviconURL;
      } else {
        tn = "chrome://mozapps/skin/places/defaultFavicon.png";
      }
      imgThumb.setAttribute("class", "smallicon");
      // on-the-fly thumbnail generation, trac bug #160
      //imgThumb.setAttribute("loading", "true");
      //makeThumbnail(entry.url, function(thumbnailURL)
      //{
      //  imgThumb.removeAttribute("loading");
      //  imgThumb.setAttribute("src", thumbnailURL);
      //});
    }
    imgThumb.setAttribute("src", tn);
    imgThumbDiv.style.width = unitedFromAbove.newtab.thumbnailWidth + "px";
    imgThumbDiv.style.height = unitedFromAbove.newtab.thumbnailHeight + "px";
//    imgThumb.setAttribute("width", unitedFromAbove.newtab.thumbnailWidth);
//    imgThumb.setAttribute("height", unitedFromAbove.newtab.thumbnailHeight);
    let imgFavicon = document.createElement("img");
    imgFavicon.setAttribute("class", "favicon");
    imgFavicon.setAttribute("src", entry.faviconURL);
    imgThumbDiv.appendChild(imgThumb);
    link.appendChild(imgThumbDiv);
    link.appendChild(imgFavicon);
    link.appendChild(title);
    item.appendChild(link);
    listE.appendChild(item);
  }
}

/**
 * Fetch the data for fillRecommendedSites() from server XML,
 * once a day. Cache in prefs.
 */
function getRecommendedSites(successCallback)
{
  var url = brand.newtab.recommendedSitesXMLURL;
  if (!url)
    return;
  const intervalMS = 3 * 24 * 60 * 60 * 1000; // every 3 days
  if (sanitize.integer(
        ourPref.get("newtab.recommended.lastFetched", 0)) * 1000 >
      (new Date() - intervalMS)) // have current cache
  {
    var parser = new DOMParser();
    successCallback(
      parser.parseFromString(ourPref.get("newtab.recommended.cacheXML"), "application/xml"));
  }
  else
  {
    new FetchHTTP({ url : url, method : "GET" },
    function(xml)
    {
      var s = new XMLSerializer();
      ourPref.set("newtab.recommended.cacheXML", s.serializeToString(xml));
      ourPref.set("newtab.recommended.lastFetched",
          Math.round(new Date().getTime() / 1000));
      successCallback(xml);
    },
    errorNonCritical).start();
  }
}

/**
 * This is a small list of partner sites that should be displayed
 * like the most-visited sites.
 */
function fillRecommendedSites(xml)
{
  var launchitems = JXON.build(xml).launchitems;
  var listE = document.getElementById("recommended-list");
  cleanElement(listE);
  var i = 0;
  for each (let entry in launchitems.$launchitem)
  {
    if (++i > maxRecommendedItems)
      break;
    let url = sanitize.label(entry.url);
    let faviconURL = sanitize.label(entry.icon);
    let title = sanitize.label(entry.name);
    title = title || url;
    if (title.length > maxTitleChars)
      title = title.substr(0, maxTitleChars);

    let itemE = document.createElement("div");
    itemE.setAttribute("class", "recommended-site");
    let linkE = document.createElement("a");
    linkE.setAttribute("href", url);
    let titleE = document.createElement("span");
    titleE.appendChild(document.createTextNode(title));
    titleE.setAttribute("class", "sitetitle");
    let imgFaviconE = document.createElement("img");
    imgFaviconE.setAttribute("class", "favicon");
    imgFaviconE.setAttribute("src", faviconURL);
    linkE.appendChild(imgFaviconE);
    linkE.appendChild(titleE);
    itemE.appendChild(linkE);
    listE.appendChild(itemE);
  }
  listE.parentNode.setAttribute("have-results", "true");
}

// if new profile, fill up list with defined initial entries
function initialFillIfNecessary()
{
  if (unitedFromAbove.newtab.gMostVisited.length >= maxItems)
    return;
  // If fresh profile, just populate with "initial entries", up to maxItems.
  // If real most visited has 5 entries, fill up remaining slots with
  // the top of initial entries.
  // Also catch case when initial entries are less than max entries.
  let l = Math.min(maxItems - unitedFromAbove.newtab.gMostVisited.length,
    brand.newtab.initialEntries.length);
  for (let i = 0; i < l; i++)
  {
    let initEntry = brand.newtab.initialEntries[i];
    let entry = new unitedFromAbove.newtab.MostVisitedEntry(initEntry.url);
    entry.title = initEntry.label;
    entry.getThumbnailURL = function() // not nice :(
    {
      if (!initEntry.preview)
        return null;
      return "chrome://unitedtb/skin/newtab/initial-thumbs/" + initEntry.preview;
    }
    unitedFromAbove.newtab.gMostVisited.push(entry);
  }
}

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  notifyWindowObservers("search-keypress",
      { searchTerm : event.target.value, source : 4 });
};

/**
 * Fired when the user presses RETURN in the text box.
 */
function onSearchTextEntered()
{
  startSearch(searchField.value);
};

function onSearchButtonClicked()
{
  startSearch(searchField.value);
};

/**
 * Searches for the term, by loading a page in the browser.
 * Called from our search field on the newtab page
 * (not from clicks on stored search terms).
 */
function startSearch(searchTerm)
{
  searchTerm = searchTerm.trim().replace(/\s+/g, " ");
  searchField.value = searchTerm;

  notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 4 });
  loadPage(brand.search.newTabURL +
      encodeURIComponent(searchTerm));
};
// </copied>

/**
 * Makes a thumbnail of an arbitrary URL (for which we have
 * no thumbnail yet), by loading the page in an invisible <browser>.
 * @param url {String} page URL to make the thumbnail of
 * @successCallback { Function(imageURL {String}) }
 *   Will be called when the thumbnail is made.
 *   imageURL {String} will contain the URL of the thumbnail
 */
function makeThumbnail(url, successCallback) 
{
  try {
    debug("making thumbnail on-the-fly for <" + url + ">");
    var iframe = document.createElement("iframe"); // <html:iframe>
    iframe.height = "0px";
    iframe.width = (window.innerWidth - 25) + "px";
    iframe.style.visibility = "hidden";
    iframe.addEventListener("load", function(event)
    {
      var thumbnailURL = unitedFromAbove.newtab.captureThumbnail(iframe);
      successCallback(thumbnailURL);
    }, true);
    iframe.src = url;
    // append <iframe> to the end of newtab-page.xhtml
    document.getElementsByTagName("body")[0].appendChild(iframe);
  } catch (e) { alert(e); error(e); }
}

function onHistoryCleanButton()
{
  Cc['@mozilla.org/browser/browserglue;1']
    .getService(Ci.nsIBrowserGlue)
    .sanitize(window);
}

                    
