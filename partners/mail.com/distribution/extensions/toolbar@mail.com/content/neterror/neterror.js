Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/search/search-store.js", this);

var unitedFromAbove;
var searchField;

function onLoad()
{
  try {
    var firefoxWindow = getTopLevelWindowContext(window);
    unitedFromAbove = firefoxWindow.unitedinternet;

    searchField = E("searchterm");

    setSearchTerm();
    initBrand();
    fillUserSearchTerms();
  } catch (e) { errorCritical(e); }
}
//window.setTimeout(onLoad, 1000);
//window.setTimeout)addEventListener("load", onLoad, false);

function setSearchTerm()
{
  var url = document.documentURI;

  var u = url.search(/u\=/);
  var badurl = decodeURIComponent(url.substr(u).slice(2, url.substr(u).indexOf('&')));

  var uri = Services.io.newURI(badurl, null, null);

  E("badurl").textContent = uri.host;

  // Turn the URL into search parameters
  if (u != -1)
  {
    badurl = badurl.slice(badurl.search(/:\/\//)+3);
    badurl = badurl.replace(/^www\./,'');
    badurl = badurl.replace(/\/$/,'');
    badurl = badurl.replace(/\./g,' ').replace(/\//g,' ');
    E("searchterm").value = badurl;
  }
}

// <copied from="newtab-page.xhtml">

//////////////////////////////////////////
// Fill lists of search terms
//////////////////////////////////////////

function fillUserSearchTerms()
{
  getLastSearches(10, function(terms) // search-store.js
  {
    fillSearchTerms(terms, "last-searches-list", 9);
  },
  error);
}

/*
 * Creates
 * <li><a href="http://...?su=term">term</a></li>
 */
function fillSearchTerms(terms, listID, sourceID)
{
  var listE = E(listID);
  cleanElement(listE);
  for each (let term in terms)
  {
    let item = document.createElement("li");
    let link = document.createElement("a");
    var url = brand.search.historyNetErrorURL;
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

function initBrand()
{
  E("logo").setAttribute("href", brand.toolbar.homepageURL);
}
// </copied>

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  try {
    unitedFromAbove.common.notifyWindowObservers("search-keypress",
        { searchTerm : event.target.value, source : 8 });
  } catch (e) { errorNonCritical(e); }
};

function onSearchButtonClicked()
{
  try {
    startSearch(searchField.value);
  } catch (e) { errorCritical(e); }
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
      { searchTerm : searchTerm, source : 8 });
  loadPage(brand.search.netErrorURL +
      encodeURIComponent(searchTerm));
};
// </copied>
