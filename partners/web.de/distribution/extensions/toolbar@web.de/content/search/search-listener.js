/**
 * This hooks up to the Firefox search field (top right) and registers the
 * search terms and calls the observer.
 * Later, we'll also hook up to the URLbar keyword searches.
 *
 * We need this mainly to offer the "last 10 searches" on the new tab page
 * and for search suggestions in the dropdown of our search field.
 * A side-effect is that the Amazon button etc. also works with the
 * Firefox search field.
 */

/**
 * Messages sent:
 * "search-started" with source = 2 @see search.js
 */

/////////////////////////////////////////////////////////
// Firefox search field
/////////////////////////////////////////////////////////

var gFirefoxSearchbar = null;
var origHandleSearchCommand = null;

function ourHandleSearchCommand(aEvent)
{
  // original Firfox handler
  origHandleSearchCommand.apply(gFirefoxSearchbar, [aEvent]);

  // thirdparty = not via our search engine
  // nsIBrowserSearchService
  var thirdparty =
      Services.search.currentEngine.name != brand.search.engineName;

  var searchTerm = gFirefoxSearchbar._textbox.value;
  notifyWindowObservers("search-started",
      { searchTerm : searchTerm, source : 2, engineThirdparty : thirdparty });
}

function onLoad()
{
    gFirefoxSearchbar = E("searchbar");
    origHandleSearchCommand = gFirefoxSearchbar.handleSearchCommand;
    gFirefoxSearchbar.handleSearchCommand = ourHandleSearchCommand;
}

window.addEventListener("load", onLoad, false);

/* This is a forwarder. The delete search history function can only send */
/* a global notification and we need to convert it to a window notification */
autoregisterGlobalObserver("delete-search-history", function()
{
  notifyWindowObservers("search-started",
      { searchTerm : null, source : 1 });
});
