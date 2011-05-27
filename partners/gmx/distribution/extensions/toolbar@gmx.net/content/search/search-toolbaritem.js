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
 *         6 = new tab page, click on marketed search terms
 *         7 = user double-clicked / selected on a word / test in a web page
 *         8 = net load error page, search text field
 *         9 = net load error page, click on previous search terms (history)
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
 *    When: User double-clicked on a word in a page.
 *    Parameter: @see "search-started"
 */

var searchField = null;
var clearButton = null;
/**
 * {Object} The brand object corresponding to the selected menu item.
 */
var currentEngine = null;
/**
 * Drop down where user selects search engine variant,
 * e.g. web or picture or maps search.
 * {<toolbarbutton>}
 */
var engineDropdown = null;

function onLoad(event)
{
  clearButton = document.getElementById("united-search-clear-button");
  searchField = document.getElementById("united-search-field");
  engineDropdown = document.getElementById("united-search-button-select");  
  clearButton.hidden = true;

  if (! united.XPCOMUtils.generateNSGetFactory) // FF 3.6
  {
    emptytext = searchField.getAttribute("emptytext");
    searchField.addEventListener("dragover", onDragMouseover, false);
  }

  new united.appendBrandedMenuitems("search", "search/engine",
  function(menupopup)
  {
    // activate first entry by default (usually "web search")
    var first = menupopup.firstChild;
    onEngineChanged(first.entry, first);
  },
  onEngineChanged).populate();
};
window.addEventListener("load", onLoad, false);

united.autoregisterWindowObserver("do-search-suggestions", function(obj)
{
  searchField.disableAutoComplete = !obj.enable;
});
united.autoregisterWindowObserver("search-term", function(obj)
{
  setSearchText(obj.searchTerm);
});

/**
 * User clicked our "x" button in textbox
 */
function clearSearchField()
{
  setSearchText("");
  clearButton.hidden = true;
  restoreEmptytext();
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
  united.notifyWindowObservers("search-keypress", obj);
  united.notifyWindowObservers("search-entered", obj);
}

// <copied to="newtab-page.js">

function onTextChanged(event)
{
  var searchTerm = event.target.value;
  united.notifyWindowObservers("search-keypress",
      { searchTerm : searchTerm, source : 1 });
  clearButton.hidden = !searchTerm;
  restoreEmptytext();
};

/**
 * Fired once the user selects a different search engine in
 * our search box.
 * @param entry {Object} The brand object corresponding to the selected menu item
 * @param item {<menuitem>}
 */
function onEngineChanged(entry, item)
{
  currentEngine = entry;
  engineDropdown.setAttribute("image", item.getAttribute("image"));
  engineDropdown.setAttribute("tooltiptext", item.getAttribute("label"));
}

function onButton(event)
{
  this.startSearch(searchField.value);
};

/**
 * Fired when the user selects an entry in the autocomplete dropdown,
 * either via mouse click or keyboard RETURN,
 * or presses RETURN in the text box directly.
 */
function onTextEntered()
{
  var term = searchField.value;
  /* HACK: The autocomplete entries may give us an URL to go to directly.
   * However, the Mozilla autocomplete widget doesn't allow the entries
   * to define a special action, they will always just fill text into the textfield.
   * So, mURLResults will return the URL and we'll try to detect that here.
   * We won't catch all URLs, but well.
   */
  var url = null;
  if (isFullURL(term))
    url = term;
  else
    url = getFreetextURL(term);
  if (url)
  {
    united.loadPage(url);
    setSearchText("");
  }
  else
  {
    this.startSearch(searchField.value);
  }
};

function isFullURL(str)
{
  return str.substr(0, 5) == "http:" ||
      str.substr(0, 6) == "https:" ||
      str.substr(0, 4) == "ftp:";
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
  try {
    //united.debug("got dot-string");
    var hostname = united.sanitize.hostname(str);
    //united.debug("got syntactic hostname");
    if (!knownTLD(hostname))
      return null;
    //united.debug("creating URI");
    return "http://" + hostname;
  } catch (e) { return null; }
}

//XPCOMUtils.defineLazyServiceGetter(this, "eTLDService",
//    "@mozilla.org/network/effective-tld-service;1", "nsIEffectiveTLDService");
/**
 * @returns {Boolean} the hostname ends in a TLD that we know.
 */
function knownTLD(hostname)
{
    /* getBaseDomainFromHost("utter.non.sense") returns "non.sense" => useless :-( 
    try {
      var domain = eTLDService.getBaseDomainFromHost(hostname);
      united.debug("base domain: " + domain);
      return !!domain;
    } catch (e) { united.errorInBackend(e); return false; }
    */
    var tld = hostname.substr(hostname.lastIndexOf(".") + 1);
    switch (tld)
    {
      case "com":
      case "org":
      case "net":
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
 * Searches for the term, by loading a page in the browser.
 * Called from our search field (but not Firefox' search field nor urlbar).
 */
function startSearch(searchTerm)
{
  united.notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 1 });

  var url = united.brand.search.toolbarURL;
  if (currentEngine)
    url = currentEngine.url;
  united.loadPage(url + encodeURIComponent(searchTerm));
};

// </copied>

// Workaround for bug #293, Mozilla bug 509800
// Called ondrop and ondragover of searchfield
function onDragDrop(event)
{
  united.debug("drop");
  var dragData = event.dataTransfer;
  var text = dragData.getData("text/plain");
  if (!text)
    return;
  setSearchText(text);
  event.preventDefault();
}
// Further workaround for FF3.6, because it doesn't send the ondrop event.
function onDragMouseover(event)
{
  removeEmptytext();
}
function removeEmptytext()
{
  searchField.setAttribute("emptytext", "");
  searchField.setAttribute("placeholder", "");
}
var emptytext = ""; // set in onLoad()
function restoreEmptytext()
{
  if (! emptytext) // FF4
    return;
  searchField.setAttribute("emptytext", emptytext);
  searchField.setAttribute("placeholder", emptytext);
}
