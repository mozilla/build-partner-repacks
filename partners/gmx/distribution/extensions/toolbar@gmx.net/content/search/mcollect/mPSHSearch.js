Components.utils.import("resource://unitedtb/search/search-store.js", this);
var sb = new StringBundle("search/mcollect");

/**
 * This searches in the user's previous searches, whether the user searched for
 * a similar term earlier, and proposes that.
 *
 * Returns |mSearchTermResult|s.
 *
 * @param searchTerm {String}
 */
function mPSHSearch(searchTerm)
{
  mSearch.call(this, searchTerm);
}
mPSHSearch.prototype =
{
  /**
   * Triggers the actual search in the search term DB
   */
  startSearch : function()
  {
    try {
      var self = this;
      // fetch whole list from search-store.js
      getLastSearches(10000, function(terms)
      {
        var descr = sb.get("mPSHSearch.descr");
        var icon = "chrome://unitedtb/skin/search/search-small.png";

        // check whether a hit
        for each (let term in terms)
        {
          let pos = term.toLowerCase().indexOf(self._searchTerm.toLowerCase());
          if (pos == -1)
            continue;
          //debug("PSH hit for " + self._searchTerm + " in " + term + " at pos " + pos);
          let result = new mPSHSearchTermResult(term, descr, icon);
          result.hitPos = pos;
          result.hitLengthRatio = term.length / self._searchTerm.length;
          self._addResult(result);
        }

        // sort
        self._results.sort(function(a, b)
        {
          let comp = a.hitPos - b.hitPos;
          if (comp)
            return comp; // lower is better
          let comp = a.hitLengthRatio - b.hitLengthRatio;
          if (comp)
            return comp; // higher is better
          return 0;
        });

        self._notifyObserversOfResultChanges();
      },
      function(e) { self._haveFatalError(e); });
    } catch (e) { this._haveFatalError(e); }
  },
}
extend(mPSHSearch, mSearch);

/**
 * This adds the clear history item
 *
 * Returns |mResult|s.
 */
function mClearPSH()
{
  mSearch.call(this);
}
mClearPSH.prototype =
{
  /**
   * Adds exactly one static item
   */
  startSearch : function()
  {
    try {
      this._addResult(new mClearCommandResult());
      this._notifyObserversOfResultChanges();
    } catch (e) { this._haveFatalError(e); }
  },
}
extend(mClearPSH, mSearch);


/**
 * An result item that allows the user to clear the search history.
 */
function mClearCommandResult()
{
  var title = sb.get("clearSearchHistory.descr");
  //var descr = sb.get("commands.descr"); // its own section
  var descr = sb.get("mPSHSearch.descr");
  mResult.call(this, title, descr, null, "command");
}
mClearCommandResult.prototype =
{
  activate : function(firefoxWindow)
  {
    Components.utils.import("resource://unitedtb/search/search-store.js", this);
    deleteLastSearches(function() {}, firefoxWindow.unitedinternet.common.errorCritical);
  },
}
extend(mClearCommandResult, mResult);
