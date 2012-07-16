Components.utils.import("resource://unitedtb/search/search-store.js", this);

var united;
var searchField;
var gAutocomplete;

const prefCount = "tracking.countnewtab.count";

function onLoad(unitedFromAbove)
{
  var firefoxWindow = getTopLevelWindowContext();
  united = firefoxWindow.united;

  // Tracking new tab pages
  var count = united.ourPref.get(prefCount, 0);
  united.ourPref.set(prefCount, ++count);

  searchField = document.getElementById("searchterm");
  if (united.ourPref.get("newtab.setFocus"))
    searchField.focus();

  initAutocomplete();
  initBrand();
  initViewMode();
  fillUserSearchTerms();
  fillMostVisited();
  getRecommendedSites(fillRecommendedSites);
}
window.addEventListener("load", onLoad, false);

function initAutocomplete()
{
  Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js", this);
  united.loadJS("chrome://unitedtb/content/util/AutoComplete.js", this);
  united.loadJS("chrome://unitedtb/content/search/mcollect/mAutocompleteSource.js", this);

  gAutocomplete = new AutocompleteWidget(searchField, { xul: false });
  gAutocomplete.addSource(new mCollectAutocompleteSource(gAutocomplete, window));
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
  united.error);
}

/*
 * Creates
 * <li><a href="http://...?su=term">term</a></li>
 */
function fillSearchTerms(terms, listID, sourceID)
{
  var listE = document.getElementById(listID);
  united.cleanElement(listE);
  for each (let term in terms)
  {
    let item = document.createElement("li");
    let link = document.createElement("a");
    var url;
    if (sourceID == 5)
      url = united.brand.search.historyNewTabURL;
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
      united.brand.toolbar.homepageURL);
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
  united.cleanElement(listE);
  initialFillIfNecessary();
  var i = 0;
  for each (let entry in united.newtab.gMostVisited)
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
    imgThumbDiv.style.width = united.newtab.thumbnailWidth + "px";
    imgThumbDiv.style.height = united.newtab.thumbnailHeight + "px";
//    imgThumb.setAttribute("width", united.newtab.thumbnailWidth);
//    imgThumb.setAttribute("height", united.newtab.thumbnailHeight);
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
  var url = united.brand.newtab.recommendedSitesXMLURL;
  if (!url)
    return;
  const intervalMS = 3 * 24 * 60 * 60 * 1000; // every 3 days
  if (united.sanitize.integer(
        united.ourPref.get("newtab.recommended.lastFetched", 0)) * 1000 >
      (new Date() - intervalMS)) // have current cache
  {
    successCallback(
        new XML(united.ourPref.get("newtab.recommended.cacheXML")));
  }
  else
  {
    new united.FetchHTTP({ url : url, method : "GET" },
    function(xml)
    {
      united.ourPref.set("newtab.recommended.cacheXML", xml.toString());
      united.ourPref.set("newtab.recommended.lastFetched",
          Math.round(new Date().getTime() / 1000));
      successCallback(xml);
    },
    united.errorNonCritical).start();
  }
}

/**
 * This is a small list of partner sites that should be displayed
 * like the most-visited sites.
 */
function fillRecommendedSites(xml)
{
  var listE = document.getElementById("recommended-list");
  united.cleanElement(listE);
  var i = 0;
  for each (let entry in xml.launchitem)
  {
    if (++i > maxRecommendedItems)
      break;
    let url = united.sanitize.label(entry.url);
    let faviconURL = united.sanitize.label(entry.icon);
    let title = united.sanitize.label(entry.name);
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
  if (united.newtab.gMostVisited.length >= maxItems)
    return;
  // If fresh profile, just populate with "initial entries", up to maxItems.
  // If real most visited has 5 entries, fill up remaining slots with
  // the top of initial entries.
  // Also catch case when initial entries are less than max entries.
  let l = Math.min(maxItems - united.newtab.gMostVisited.length,
    united.brand.newtab.initialEntries.length);
  for (let i = 0; i < l; i++)
  {
    let initEntry = united.brand.newtab.initialEntries[i];
    let entry = new united.newtab.MostVisitedEntry(initEntry.url);
    entry.title = initEntry.label;
    entry.getThumbnailURL = function() // not nice :(
    {
      if (!initEntry.preview)
        return null;
      return "chrome://unitedtb/skin/newtab/initial-thumbs/" + initEntry.preview;
    }
    united.newtab.gMostVisited.push(entry);
  }
}

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  united.notifyWindowObservers("search-keypress",
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
  united.notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 4 });
  united.loadPage(united.brand.search.newTabURL +
      encodeURIComponent(searchTerm));
};
// </copied>


//////////////////////////////////////////
// View modes
//////////////////////////////////////////

const kViewModePrefname = "newtab.viewmode";

function initViewMode()
{
  setViewModeFromPref();
  united.ourPref.observeAuto(window, kViewModePrefname, setViewModeFromPref);
}

function setViewModeFromPref()
{
  var pref = united.ourPref.get(kViewModePrefname);
  document.body.setAttribute("viewmode", pref == 2 ? "list" : "gallery");
}

function toggleView(mode)
{
  document.body.setAttribute("viewmode", mode);
  united.ourPref.set(kViewModePrefname, mode == "list" ? 2 : 1);

  //fillMostVisited();
  /*
  // swap <img> attribute "no-src" <-> "src"
  var toGallery = mode != "list";
  var oldAttr = toGallery ? "no-src" : "src";
  var newAttr = toGallery ? "src" : "no-src";
  var listE = document.getElementById("most-visited-list");
  //var imgs = listE.getElementsByTagName("img");
  var imgs = listE.getElementsByClassName("thumbnail");
  for (let i = 0, l = imgs.length; i < l; i++)
  {
    let img = imgs[i];
    let src = img.getAttribute(oldAttr);
    img.removeAttribute(oldAttr);
    img.setAttribute(newAttr, src);
  }
  */
}

function toggleViewToList()
{
  toggleView("list");
}
function toggleViewToGallery()
{
  toggleView("gallery");
}

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
    united.debug("making thumbnail on-the-fly for <" + url + ">");
    var iframe = document.createElement("iframe"); // <html:iframe>
    iframe.height = "0px";
    iframe.width = (window.innerWidth - 25) + "px";
    iframe.style.visibility = "hidden";
    iframe.addEventListener("load", function(event)
    {
      var thumbnailURL = united.newtab.captureThumbnail(iframe);
      successCallback(thumbnailURL);
    }, true);
    iframe.src = url;
    // append <iframe> to the end of newtab-page.xhtml
    document.getElementsByTagName("body")[0].appendChild(iframe);
  } catch (e) { alert(e); united.error(e); }
}

function onHistoryCleanButton()
{
  united.Cc['@mozilla.org/browser/browserglue;1']
    .getService(united.Ci.nsIBrowserGlue)
    .sanitize(window);
}

                    
