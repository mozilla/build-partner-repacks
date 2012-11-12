/**
 * Store and retrieve searches (personal history of search terms)
 *
 * Search terms are stored as an JSON array in the preferences
 * [{
 *   "searchterm": "apple",
 *   "visited": "2012-06-11T17:02:25.657Z"
 *  }]
 */

const EXPORTED_SYMBOLS = [
  "getLastSearches", "getLastSearchesWithDate", "saveSearchTerm", "deleteLastSearches", "deleteSearchTerm",
];

/**
 * Messages observed:
 * "uninstall"
 *    Effect: Clean up sensitive data on uninstall
 */

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/observer.js");

//////////////////////////////////////////////////////////////////////////
// Store searches
//////////////////////////////////////////////////////////////////////////

/**
 * Returns the last n search terms the user searched for.
 *
 * @param amount {Integer} how many terms to return
 *   If |amount| > |amountToRememeber|, then only the
 *   latter will be returned.
 * @param resultCallback {function(terms {Array of String})}
 *   Will be called to return the search terms.
 *   First parameter contains an array with the search terms.
 *   Order: last search is first
 *   (use Array.reverse(), if you want chronological order.)
 * @returns nothing
 */
function getLastSearches(amount, resultCallback, errorCallback)
{
  var searchitems = JSON.parse(ourPref.get("search.termsJSON"));

  // This was the easiest way to imitate GROUP BY so we can remove dupes
  // without sorting
  var addedTerms = {};
  var terms = []
  for each (let searchitem in searchitems)
  {
    if (!addedTerms[searchitem.searchterm])
    {
      terms.push(searchitem.searchterm)
      addedTerms[searchitem.searchterm] = true;
    }
  }
  if (amount < terms.length)
    terms = terms.slice(0, amount);
  resultCallback(terms);
}

/**
 * @see getLastSearches(), just that the the time of search is included
 *
 * @param amount @see getLastSearches()
 * @param resultCallback {Function(terms)}
 *    terms { Array of { term {String}, date {Date} }}
 */
function getLastSearchesWithDate(amount, resultCallback, errorCallback)
{
  var searchitems = JSON.parse(ourPref.get("search.termsJSON"));

  var terms = []
  for each (let searchitem in searchitems)
  {
    terms.push({
      term : searchitem.searchterm,
      date : new Date(Date.parse(searchitem.visited))
    });
  }
  if (amount < terms.length)
    terms = terms.slice(0, amount);
  resultCallback(terms);
}

/**
 * Removes all stored searches from database.
 */
function deleteLastSearches(successCallback, errorCallback)
{
  ourPref.reset("search.termsJSON");
  /* Notify all observers to clear out their stored search term */
  notifyGlobalObservers("delete-search-history", {});
  successCallback();
}

/**
 * Deletes a given search term from database.
 *
 */
function deleteSearchTerm(term, successCallback, errorCallback)
{
  // multiple entries with the given search term might exist, delete them all
  // this mimicks the behaviour of getLastSearches which
  // collapses multiple occurences of the same searchterm
  var searchitems = JSON.parse(ourPref.get("search.termsJSON"));

  searchitems = searchitems.filter(function(e) {return e.searchterm != term});

  ourPref.set("search.termsJSON", JSON.stringify(searchitems));
  successCallback();
}

function debugShowLastSearches()
{
  debug("show last searches");
  getLastSearches(500, function(terms)
  {
    debug("\nlast search terms: " + terms.join(", ") + "\n");
  },
  debug);
}

const amountToRemember = 30;

function saveSearchTerm(searchTerm)
{
  debug("saving search term " + searchTerm);

  if (!searchTerm) // when user searches without anything in search field
    return;

  var term = {};
  term.searchterm = searchTerm;
  term.visited = new Date().toISOString();

  var searchitems = JSON.parse(ourPref.get("search.termsJSON"));
  searchitems.push(term);
  if (searchitems.length > amountToRemember)
    searchitems.splice(0, searchitems.length - amountToRemember);
  ourPref.set("search.termsJSON", JSON.stringify(searchitems));
}

/**
* Clean up sensitive data on uninstall.
* Cleans: stored search terms.
*/
function cleanUpOnUnInstall()
{
  deleteLastSearches(function() {}, function() {});
}

function convertDatabaseToJSON()
{
  var file = getProfileDir();
  file.append("search-history.sqlite");
  if (!file.exists()) {
    return;
  }
  var storageService = Cc["@mozilla.org/storage/service;1"]
                         .getService(Ci.mozIStorageService);
  var searchHistoryDB = storageService.openDatabase(file);

  if (searchHistoryDB.tableExists("searchterms")) {
    var sel = searchHistoryDB.createStatement("SELECT " +
      "searchterm,visited FROM searchterms ORDER BY id LIMIT :amount");
    sel.params["amount"] = amountToRemember;
    sel.executeAsync(new sqlCallback(function (rows) {
      var searchitems = []
      for each (let row in rows)
      {
        searchitems.push({
          searchterm : row.getResultByName("searchterm").toString(),
          visited : row.getResultByName("visited").toString()
        });
      }
      ourPref.set("search.termsJSON", JSON.stringify(searchitems));
    }, function() {}));
    searchHistoryDB.asyncClose()
  }
}

registerGlobalObserver(
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall")
      cleanUpOnUnInstall();
    else if (msg == "upgrade")
      convertDatabaseToJSON();
  }
});
