Components.utils.import("resource://unitedtb/search/search-store.js", this);

var united;
var searchField;

function onLoad(unitedFromAbove)
{
  var firefoxWindow = getTopLevelWindowContext();
  united = firefoxWindow.united;
  searchField = document.getElementById("searchterm");

  setSearchTerm();
  initBrand();
  fillUserSearchTerms();
}
//window.setTimeout(onLoad, 1000);
//window.setTimeout)addEventListener("load", onLoad, false);

function setSearchTerm()
{
   var url = document.documentURI;

   var desc = url.search(/d\=/);
   // desc == -1 if not found; if so, return an empty string
   // instead of what would turn out to be portions of the URI
   if (desc != -1)
   {
     let msg = decodeURIComponent(url.slice(desc + 2));
     document.getElementById("message").appendChild(document.createTextNode(msg));
   }

   var u = url.search(/u\=/);
   // desc == -1 if not found; if so, return an empty string
   // instead of what would turn out to be portions of the URI
   if (u != -1)
   {
     var badurl = decodeURIComponent(url.substr(u).slice(2, url.substr(u).indexOf('&')));
     badurl = badurl.slice(badurl.search(/:\/\//)+3);
     badurl = badurl.replace(/^www\./,'');
     badurl = badurl.replace(/\/$/,'');
     badurl = badurl.replace(/\./g,' ').replace(/\//g,' ');
     document.getElementById("searchterm").value = badurl;
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
    var url = united.brand.search.historyNetErrorURL;
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
  document.getElementById("logo").setAttribute("href",
      united.brand.toolbar.homepageURL);
}
// </copied>

//////////////////////////////////////////
// Search field
//////////////////////////////////////////

// <copied from="search-toolbaritem.js">

function onSearchTextChanged(event)
{
  united.notifyWindowObservers("search-keypress",
      { searchTerm : event.target.value, source : 8 });
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
      { searchTerm : searchTerm, source : 8 });
  united.loadPage(united.brand.search.netErrorURL +
      encodeURIComponent(searchTerm));
};
// </copied>