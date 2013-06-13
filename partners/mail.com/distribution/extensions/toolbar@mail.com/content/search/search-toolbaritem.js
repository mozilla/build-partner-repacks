/**
 * This implement the search field on our toolbar.
 */

/**
 * Messages sent by this module:
 * "search-started"
 *    Means: We start a search.
 *    When: the user entered a search term into the search field in our toolbar.
 *    Implementation limitation:
 *       Currently not sent when the user searches in Firefox' own search field,
 *       nor when a "keyword" search is started from the URLbar.
 *    Parameter: object
 *      searchTerm {String}   what the user searches for
 *      source {int-enum}   which widget or circumstance started the search
 *         1 = our own search field on our toolbar
 *         2 = Firefox search field
 *         3 = URLbar "keyword" search (currently not implemented)
 *         4 = new tab page, search text field
 *         5 = new tab page, click on previous search terms (history)
 *         7 = user double-clicked / selected on a word / test in a web page
 *         8 = net load error page, search text field
 *         9 = net load error page, click on previous search terms (history)
 *         10 = search on a competitor's site
 *         11 = URLbar icon
 *       engineThirdparty {Boolean}  only for source == 2
 *         false, if web.de/GMX/etc. search engine is selected.
 *         true, if third-party engine is selected, e.g. Google, Yahoo, Wikipedia.
 * "search-entered" (not yet implemented)
 *    Means: user stopped typing the search term
 *    When: focus leaves search field. this may be before or after "search-started"
 *    Implementation limitation: not yet implemented, because onblur calls us twice
 *    Parameter: @see "search-started"
 * "search-keypress"
 *    Means: search term changed, but user is still typing
 *    When: User entered a character or pressed another key in the search field
 *    Parameter: @see "search-started"
 *
 * Msg sent from this file have source = 1
 *
 * Messages reacted to by this module:
 * "do-search-suggestions"
 *   Means: Determines how the autocomplete suggestions in search field work.
 *   When: E.g. while highlight button is pressed, search suggestions are disabled.
 *    Parameter: object
 *       enable {Boolean}  if true, autocomplete dropdown will open when user types
 * "search-term"
 *    Means: we have some text that we want to put in the search field
 *    When: User double-clicked on a word in a page
 *      or user searched on a competitor's search website.
 *    Parameter: @see "search-started"
 */

Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js", this);
loadJS("chrome://unitedtb/content/util/AutoComplete.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mAutocompleteSource.js", this);


var searchField = null;
var clearButton = null;

var gAutocomplete = null;

function onLoad(event)
{
  clearButton = document.getElementById("united-search-clear-button");
  searchField = document.getElementById("united-search-field");
  clearButton.hidden = true;
  
  // must use capture and parent node, to prevent the Mozilla ac widget from interfering :(
  searchField.parentNode.addEventListener("keypress", onKeyPressTab, true);

  gAutocomplete = new AutocompleteWidget(searchField, { xul: true });
  gAutocomplete.addSource(new mCollectAutocompleteSource(gAutocomplete, window));

  // add splitter to allow user to resize search field
  // (which is positioned dynamically by toolbar.js)
  var splitter = document.createElement("splitter");
  splitter.setAttribute("resizebefore", "flex");
  splitter.setAttribute("resizeafter", "grow");
  var toolbar = document.getElementById("united-toolbar");
  var toolbaritem = document.getElementById("united-search-box");
  toolbar.insertBefore(splitter, toolbaritem.nextSibling);
};
window.addEventListener("load", onLoad, false);

autoregisterWindowObserver("do-search-suggestions", function(obj)
{
  searchField.disableAutoComplete = !obj.enable;
});
autoregisterWindowObserver("search-term", function(obj)
{
  setSearchText(obj.searchTerm);
});

/**
 * User clicked our "x" button in textbox
 */
function clearSearchField()
{
  setSearchText("");
  searchField.focus();
  clearButton.hidden = true;
}

function onFocus(event)
{
  //this.searchField = event.target;
  // select all text, to allow easy overwriting
  event.target.select();
};

function setSearchText(text)
{
  searchField.value = text;
  clearButton.hidden = !text;
  // pretending it came from here, because Amazon module expects that. TODO good idea?
  var obj = { searchTerm : text, source : 1 };
  notifyWindowObservers("search-keypress", obj);
  notifyWindowObservers("search-entered", obj);
}

// <copied to="newtab-page.js">

function onTextChanged(event)
{
  debug("on text changed in textfield");
  var searchTerm = searchField.value;
  notifyWindowObservers("search-keypress",
      { searchTerm : searchTerm, source : 1 });
  clearButton.hidden = !searchTerm;
}

function onButton(event)
{
  var term = startSearchOrURL(searchField.value);
  if (term)
    startRealSearch(term, brand.search.toolbarURL, 1);
};

/**
 * Fired when the user selects an entry in the autocomplete dropdown,
 * either via mouse click or keyboard RETURN,
 * or presses RETURN in the text box directly.
 */
function onTextEntered()
{
  var term = startSearchOrURL(searchField.value);
  if (term)
    startRealSearch(term, brand.search.toolbarURL, 1);
}

/**
 * Checks whether |term| is an URL.
 * If so, goes to that URL and returns null.
 * If not a URL, returns the term.
 * @return {String} term (if search term) or null (if URL)
 */
function startSearchOrURL(term, goDirectlyToURLs)
{
  term = term.trim().replace(/\s+/g, " ");

  debug("search term or URL: " + term);

  // Help the user who enters URLs or domains in the search field
  var url = null;
  if (goDirectlyToURLs || ourPref.get("search.goDirectlyToURLs"))
  {
    if (!url)
      url = getTermRedirect(term);
    if (!url && isFullURL(term))
      url = term;
    if (!url)
      url = getFreetextURL(term);
  }
  if (url)
  {
    debug("going to <" + url + ">");
    loadPage(url);
    setSearchText("");
    return null;
  }
  else
  {
    return term;
  }
};

function isFullURL(str)
{
  try {
    Services.io.newURI(str, null, null);
  } catch (ex) {
    return false;
  }
  return true;
}

/**
 * Takes pseudo-URLs like "gmx.net" and completes
 * them to a full URL.
 * We need this in case the user enters "gmx.net" into the search box,
 * but he really wants to go to a page, not do a search.
 *
 * @returns {String} URL
 *     In case it's not a URL, returns null.
 */
function getFreetextURL(str)
{
  if (str.indexOf(" ") != -1) // has space => no URL
    return null;
  if (str.indexOf(".") == -1) // has no dot => no URL
    return null;
  // Remove trailing slash
  if (str.substr(-1) == '/')
    str = str.substr(0, str.length - 1);
  try {
    //debug("got dot-string");
    var hostname = sanitize.hostname(str);
    //debug("got syntactic hostname");
    if (!knownTLD(hostname))
      return null;
    //debug("creating URI");
    return "http://" + hostname;
  } catch (e) { return null; }
}

/**
 * @returns {Boolean} the hostname ends in a TLD that we know.
 */
function knownTLD(hostname)
{
    /* getBaseDomainFromHost("utter.non.sense") returns "non.sense" => useless :-( 
    try {
      var domain = Services.eTLD.getBaseDomainFromHost(hostname);
      debug("base domain: " + domain);
      return !!domain;
    } catch (e) { errorInBackend(e); return false; }
    */
    var tld = hostname.substr(hostname.lastIndexOf(".") + 1);
    switch (tld)
    {
      case "com":
      case "org":
      case "net":
      case "edu":
      case "de":
      case "at":
      case "ch":
      case "fr":
      case "it":
      case "uk":
        return true;
      default:
        return false;
    }
}

/**
 * If the user enters "amazon.de" into our search field,
 * redirect him to our link for amazon.
 *
 * @returns {URL as String} open this page directly
 *     if null or undefined: there is no redirect, continue as normal.
 */
function getTermRedirect(term)
{
  return brand.search.termRedirect[term];
}

/**
 * Searches for the term, by loading a page in the browser.
 * Called from our search field (but not Firefox' search field nor urlbar).
 */
function startRealSearch(searchTerm, searchURL, source)
{
  notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : source });

  loadPage(searchURL + encodeURIComponent(searchTerm));
};

// </copied>


////////////////////////////////////////////////////////////
// Autocomplete single words inline in text field, after pressing TAB

var gDidAutocomplete = false;
var gSearchCompleteHandler = null;

/**
 * Handle TAB to autocomplete word
 */
function onKeyPressTab(event)
{
  if (!gDidAutocomplete &&
      event.keyCode == event.DOM_VK_TAB)
  {
    gDidAutocomplete = true;
    var curText = searchField.value;
    debug("waiting for search for " + curText);
    getLocalmCollectAutocompleteLabels(curText, function(results)
    {
      debug("search completed " + curText);
      if (searchField.value != curText)
        return; // user modified before search completed
      var completed = getAutocompleteText(curText, results);
      debug("autocomplete text " + completed);
      if (!completed)
        return;
      setSearchText(completed);
      searchField.setSelectionRange(curText.length, completed.length);
    });
    event.preventDefault();
  }
  // a real letter
  // <http://mdn.beonex.com/en/DOM/event.charCode>
  if (event.charCode)
  {
    gDidAutocomplete = false;
  }
}

function getAutocompleteText(userTyped, labels)
{
  try {
    userTyped = userTyped.toLowerCase();
    var results = [];
    for each (let label in labels)
    {
      for each (let word in label.split(" "))
      {
        let pos = word.toLowerCase().indexOf(userTyped);
        if (pos != 0) // only accept hits at the start
          continue;
        results.push({
          term : word,
          hitPos : pos,
          hitLengthRatio : userTyped.length / word.length,
        });
      }
    }

    // sort
    results.sort(function(a, b)
    {
      let comp = a.hitPos - b.hitPos;
      if (comp)
        return comp; // lower is better
      let comp = a.hitLengthRatio - b.hitLengthRatio;
      if (comp)
        return -comp; // lower is better
      return 0;
    });
    debug("result words, sorted: " + results.map(function(a) { return a.term; }));

    if (results.length < 1)
      return null;
    return results[0].term; // return best hit

  } catch (e) { errorInBackend(e); return null; }
}

/**
 * Returns all labels that are currently in the
 * Mozilla <textbox type="autocomplete"> dropdown.
 * It only returns what is already populated.
 * @returns {Array of String}
 *
function getMozillaAutocompleteLabels()
{
  var controller = searchField.controller;
  var results = [];
  for (let i = 0, l = controller.matchCount; i < l; i++)
    results.push(controller.getLabelAt(i));
  debug("result labels: " + results);
  return results;
}
*/

/**
 * Makes an mCollect search in PSH and bookmarks.
 * @param successCallback {Function(results)}
 *     results {Array of String}   the search result = search terms
 */
function getLocalmCollectAutocompleteLabels(term, successCallback)
{
  var psh = new mPSHSearch(term);
  var places = new mPlacesSearch(term);
  var waiting = 2;
  var end = function()
  {
    if (--waiting != 0)
      return;
    var mresults = psh.currentResults.concat(places.currentResults);
    var labels = mresults.map(function(a) { return a.title; });
    successCallback(labels);
  }
  // observer can be called several times, but we'll ignore that
  psh.addObserver(end);
  places.addObserver(end);
  psh.startSearch();
  places.startSearch();
}

function onURLBarButton(event)
{
  var searchTerm = document.getElementById("urlbar").value;
  try {
    var uriFixup = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
    var fixupURI = uriFixup.createFixupURI(searchTerm, Ci.nsIURIFixup.FIXUP_FLAG_USE_UTF8);
    // If the current URL is the same as the search URL, just reload the page
    if (fixupURI.spec == content.document.location.href) {
      loadPage(fixupURI.spec);
      return;
    }
  } catch (ex) {
    // Not a fatal error - just means URI Fixup couldn't fix up the URL
  }
  var term = startSearchOrURL(searchTerm, true);
  if (term)
    startRealSearch(term, brand.search.urlbarURL, 11);
}
