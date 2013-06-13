Components.utils.import("resource://unitedtb/search/search-store.js");
Components.utils.import("resource://unitedtb/util/JXON.js");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/PageThumbs.jsm");
Components.utils.import("resource://gre/modules/NewTabUtils.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

var favicons = Components.classes["@mozilla.org/browser/favicon-service;1"]
                         .getService(Components.interfaces.nsIFaviconService)
                         .QueryInterface(Components.interfaces.mozIAsyncFavicons);

var unitedFromAbove;
var firefoxWindow;
var searchField;
var gAutocomplete;

function onLoad()
{
  // We need to access the global unitedinternet.newtab object, so that our
  // observer notifications happen at the window level, but we can't,
  // because we are not in the browser scope. Get it from the browser window.
  firefoxWindow = getTopLevelWindowContext(window);
  unitedFromAbove = firefoxWindow.unitedinternet;

  searchField = document.getElementById("searchterm");
  if (ourPref.get("newtab.setFocus"))
    searchField.focus();

  initAutocomplete();
  initBrand();
  fillUserSearchTerms();
  getRecommendedSites(fillRecommendedSites);
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
}
window.addEventListener("load", onLoad, false);

/**
 * If there is no entry in the Firefox thumbnail store for a given page URL, we
 * use a favicon instead as fallback.
 */
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

      // Check whether Firefox has a thumbnail, see above.
      var file;
      // This API was removed in Firefox 22
      if (PageThumbsStorage.getFileForURL) {
        file = PageThumbsStorage.getFileForURL(url);
      } else if (PageThumbsStorage.getFilePathForURL) {
        file = new FileUtils.File(PageThumbsStorage.getFilePathForURL(url));
      }
      if (!file || !file.exists()) {
        displayFaviconForThumbnail(url, cell.querySelector(".newtab-thumbnail"));
      }
    }
  }
}

/**
 * Continuation of addSitePlaceholders().
 * We need to use a separate function for this,
 * because we can not use a closure in a loop.
 * Used for < FF18 only.
 */
function cacheCallback(url, thumbnail) {
  return function(aSourceEntry) {
    if (!aSourceEntry) {
      displayFaviconForThumbnail(url, thumbnail);
    }
  }
}

/**
 * Display the favicon for a given URL
 */
function displayFaviconForThumbnail(url, thumbnail)
{
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

const maxTitleChars = 40;
const maxRecommendedItems = 9;

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

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  unitedFromAbove.common.notifyWindowObservers("search-keypress",
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
  unitedFromAbove.common.notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 4 });
  loadPage(brand.search.newTabURL +
      encodeURIComponent(searchTerm));
};
// </copied>

function onHistoryCleanButton()
{
  Cc['@mozilla.org/browser/browserglue;1']
    .getService(Ci.nsIBrowserGlue)
    .sanitize(window);
}

// When history is deleted, update the user terms
autoregisterGlobalObserver("delete-search-history", function()
{
  fillUserSearchTerms();
});
