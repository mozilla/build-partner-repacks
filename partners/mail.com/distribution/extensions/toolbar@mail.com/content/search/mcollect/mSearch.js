/**
 * This represents a search engine. You create an instance of it, and then you
 * make a query based on a search term (string), and it does the search,
 * and returns the results asyncronously as mResult.
 * This object also serves as result set.
 *
 * The results are dynamic, meaning that the result set may change at any time.
 *
 * This class is abstract. You need to instantiate one of its incestors.
 *
 * @param searchTerm {String}
 */
function mSearch(searchTerm)
{
  this._searchTerm = sanitize.label(searchTerm);
  this._results = new Array();
  this._observers = new Array();
  this._error = null;
}
mSearch.prototype =
{
  _searchTerm : null, // {String}
  _results : null, // {Array of mResult}
  _observers : null, // {Array of Function}
  _error : null, // {Exception (or String?)}
  _cancelled : false, // {Boolean} cancel() has been called

  /**
   * Triggers the actual search, via DB, or over the network etc..
   */
  startSearch : function()
  {
    throw NotReached("abstract function");
  },

  /**
   * Aborts the search that is running at the moment.
   */
  cancel : function()
  {
    this._cancelled = true;
  },

  /**
   * Implementations call this to
   * add a result
   * @param result {mResult}
   */
  _addResult : function(result)
  {
    assert(result);
    if (this._cancelled)
      return;
    this._results.push(result);
  },

  /**
   * Returns what the search engine got as results, at the moment.
   * Results may be empty. Register an observer to know when there's
   * something new to get.
   *
   * @returns {Array of mResult}
   *     A new array. Not a deep copy, so don't modify the mResult objects.
   */
  get currentResults()
  {
    return this._results.slice(0); // return copy of array
  },

  get error()
  {
    return this._error;
  },

  /**
   * Notified when results changed.
   * @param observer {Function}
   */
  addObserver : function(observer)
  {
    assert(typeof(observer) == "function");
    this._observers.push(observer);
  },
  removeObserver : function(observer)
  {
    assert(typeof(observer) == "function");
    ArrayRemove(this._observers, observer);
  },
  _notifyObserversOfResultChanges : function()
  {
    //debug("new results:");
    //for each (let result in this._results)
    //  debug(result.title + (result.url ? ", url <" + result.url + ">" : ""));
    for each (let observer in this._observers)
    {
      try {
        observer();
      } catch (e) { errorInBackend(e); }
    }
  },
  /**
   * Implementations call this to
   * tell about an error that likely means that no results
   * will come.
   */
  _haveFatalError : function(e)
  {
    errorInBackend(e);
    if (!this._error)
      this._error = e;
    this._notifyObserversOfResultChanges();
  },
  /**
   * Implementations call this to
   * tell about an error during processing one of the
   * results, but other results might be processed properly.
   */
  _haveItemError : function(e)
  {
    errorInBackend(e);
  },

}
extend(mSearch, Abortable);
