Components.utils.import("resource://unitedtb/search/search-store.js", this);

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
   * Triggers the actual search, via DB, or over the network etc..
   */
  startSearch : function()
  {
    try {
      var self = this;
      // fetch whole list from search-store.js
      getLastSearches(10000, function(terms)
      {
        XPCOMUtils.defineLazyGetter(this, "descr", function()
        {
          var sb = new StringBundle("chrome://unitedtb/locale/search/mcollect.properties");
          return sb.get("mPSHSearch.descr");
        });
        var icon = "chrome://unitedtb/skin/search/search-small.png";

        // check whether a hit
        for each (let term in terms)
        {
          let pos = term.indexOf(self._searchTerm);
          if (pos == -1)
            continue;
          //debug("PSH hit for " + self._searchTerm + " in " + term + " at pos " + pos);
          let result = new mSearchTermResult(term, descr, icon);
          result.hitPos = pos;
          result.hitLengthRatio = term.length / self._searchTerm.length;
          self._results.push(result);
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
      function(e) { self._haveError(e); });
    } catch (e) { this._haveError(e); }
  },
}
extend(mPSHSearch, mSearch);
