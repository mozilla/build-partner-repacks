/**
 * Store and retrieve searches (personal history of search terms)
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
  var sel = searchHistoryDB().createStatement("SELECT " +
      "searchterm FROM searchterms GROUP BY searchterm ORDER BY id DESC LIMIT :amount");
  sel.params["amount"] = amount;
  sel.executeAsync(new sqlCallback(function (rows)
  {
    let terms = []
    for each (let row in rows)
    {
      terms.push(row.getResultByName("searchterm").toString());
    }
    resultCallback(terms);
  }, errorCallback));
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
  var sel = searchHistoryDB().createStatement("SELECT " +
      "searchterm,visited FROM searchterms ORDER BY id LIMIT :amount");
  sel.params["amount"] = amount;
  sel.executeAsync(new sqlCallback(function (rows)
  {
    let terms = [];
    for each (let row in rows)
    {
      let dateStr = row.getResultByName("visited").toString();
      let dateObj = new Date(Date.parse(dateStr));
      terms.push({
        term : row.getResultByName("searchterm").toString(),
        date : dateObj,
      });
    }
    resultCallback(terms);
  }, errorCallback));
}

/**
 * Removes all stored searches from database.
 */
function deleteLastSearches(successCallback, errorCallback)
{
  var sel = searchHistoryDB().createStatement("DELETE FROM searchterms");
  sel.executeAsync(new sqlCallback(successCallback, errorCallback));
  /* Notify all observers to clear out their stored search term */
  notifyGlobalObservers("delete-search-history", {});
}

/**
 * Deletes a given search term from database.
 *
 */
function deleteSearchTerm(term, successCallback, errorCallback)
{
  // multiple entries with the given search term might exist, delete them all
  // this mimicks the behaviour of getLastSearches which uses GROUP BY to
  // collapse multiple occurences of the same searchterm
  var sel = searchHistoryDB().createStatement("DELETE FROM searchterms WHERE searchterm = :term");
  sel.params["term"] = term;
  sel.executeAsync(new sqlCallback(successCallback, errorCallback));
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

var gSearchHistoryDB = null;
const amountToRememeber = 30;

/**
 * Set up sqlite database for storeing search terms
 * Called onLoad()
 */
function searchHistoryDB()
{
  if (gSearchHistoryDB)
    return gSearchHistoryDB;

  var file = getProfileDir();
  file.append("search-history.sqlite");
  var storageService = Cc["@mozilla.org/storage/service;1"]
                         .getService(Ci.mozIStorageService);
  // (also creates the file if it does not yet exist)
  gSearchHistoryDB = storageService.openDatabase(file);

  // init DB
  if (!gSearchHistoryDB.tableExists("searchterms"))
  {
    gSearchHistoryDB.createTable("searchterms",
        "id INTEGER PRIMARY KEY autoincrement, searchterm STRING, visited STRING");
    ourPref.set("search.db.version", 1);
  }
  return gSearchHistoryDB;  
}

function saveSearchTerm(searchTerm)
{
  debug("saving search term " + searchTerm);

  if (!searchTerm) // when user searches without anything in search field
    return;

  // store the search term
  var insert = searchHistoryDB().createStatement("INSERT INTO searchterms " +
      "(searchterm, visited) VALUES (:searchterm, :visited)");
  insert.params["searchterm"] = searchTerm;
  insert.params["visited"] = new Date().toISOString();
  insert.executeAsync();

  // delete all but the last n search terms
  // DELETE FROM searchterms ORDER BY id DESC LIMIT -1 OFFSET :amountToRem
  // GRRR, sqlite not complied with SQLITE_ENABLE_UPDATE_DELETE_LIMIT
  var del = searchHistoryDB().createStatement(
      "DELETE FROM searchterms WHERE id IN" +
      " (SELECT id FROM searchterms ORDER BY id DESC" +
      "  LIMIT -1 OFFSET :amountToRememeber)");
  del.params["amountToRememeber"] = amountToRememeber;
  del.executeAsync();
  //setTimeout(debugShowLastSearches, 500);
}

/**
* Clean up sensitive data on uninstall.
* Cleans: stored search terms.
*/
function cleanUpOnUnInstall()
{
  deleteLastSearches(function() {}, function() {});
}
registerGlobalObserver(
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall")
      cleanUpOnUnInstall();
  }
});
