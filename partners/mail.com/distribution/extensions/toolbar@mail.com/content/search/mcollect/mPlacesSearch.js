/**
 * This searches the browser history and bookmarks
 * for hits in the URL and title.
 * This is similar to the FF awesomebar suggestions, including frecency, which are
 * implemented in mozilla/toolkit/components/places/src/nsPlacesAutoComplete.js
 *
 * Returns |mURLResult|s.
 *
 * @param searchTerm {String}
 * @param includeHistory {Boolean} If true, include browser history, i.e. all visited URLs.
 *     If false, show only bookmarks.
 */
function mPlacesSearch(searchTerm, includeHistory)
{
  this._includeHistory = sanitize.boolean(includeHistory);
  mSearch.call(this, searchTerm);
}
mPlacesSearch.prototype =
{
  _maxResults : 10,

  /**
   * Triggers the Places database query.
   */
  startSearch : function()
  {
    try {
      /* nsINavHistoryQuery doesn't support frecency. :-(

         So, do what nsPlacesAutoComplete (awesomebar implementation) does:
         1) get the existing Places DB connection (only one allowed)
         2) use a simplified version of the SQL query that the awesomebar uses.
         <http://mxr.mozilla.org/comm-central/source/mozilla/toolkit/components/places/src/nsPlacesAutoComplete.js>

         We want substring match, i.e. not title = "term", but title LIKE "%term%"
         (same for url), so using the AUTOCOMPLETE_MATCH() SQL function
         (that nsPlacesAutoComplete also uses), which does the substring match.
         Not sure whether that's any faster than LIKE, though. TODO benchmark
         <https://mxr.mozilla.org/mozilla-central/source/toolkit/components/places/src/SQLFunctions.h#58>
         <http://mxr.mozilla.org/comm-central/source/mozilla/toolkit/components/places/src/SQLFunctions.cpp#332>
      */
      var db = Cc["@mozilla.org/browser/nav-history-service;1"]
          .getService(Ci.nsPIPlacesDatabase) // private, but no choice
          .DBConnection;
      /*
      var sql = "SELECT url, title, visit_count, typed, frecency " +
          "FROM moz_places " +
          "WHERE frecency != 0 " + 
            "AND AUTOCOMPLETE_MATCH(:searchTerm, url, title, " +
                "NULL, visit_count, typed, 0, 0, " +
                ":matchBehavior, :searchBehavior) " +
           "ORDER BY frecency DESC, last_visit_date DESC " +
           "LIMIT :maxResults";
        p.searchTerm = self._searchTerm;
        p.maxResults = self._maxResults;
        // https://mxr.mozilla.org/mozilla-central/source/toolkit/components/places/public/mozIPlacesAutoComplete.idl
        const ac = Ci.mozIPlacesAutoComplete;
        p.matchBehavior = ac.MATCH_ANYWHERE;
        p.searchBehavior = ac.BEHAVIOR_TITLE | ac.BEHAVIOR_URL;  
      */
      var sql = "SELECT url, moz_places.title AS pageTitle, " +
              "moz_bookmarks.title AS bookmarkTitle " +
          (this._includeHistory
              ? "FROM moz_places LEFT JOIN moz_bookmarks ON "
              : "FROM moz_bookmarks LEFT JOIN moz_places ON ") +
              "(moz_places.id = moz_bookmarks.fk) " +
          "WHERE url LIKE :search OR pageTitle LIKE :search OR bookmarkTitle LIKE :search " +
          "ORDER BY frecency DESC, last_visit_date DESC " +
          "LIMIT :maxResults";
      var self = this;
      var sqlQuery = db.createStatement(sql);
      let (p = sqlQuery.params)
      {
        p.search = "%" + self._searchTerm + "%";
        p.maxResults = self._maxResults;
      }
      sqlQuery.executeAsync(new sqlCallback(function(rows)
      {
        var sb = new StringBundle("chrome://unitedtb/locale/search/mcollect.properties");
        var descr = sb.get("mPlacesSearch.descr");
        var faviconServ = Cc["@mozilla.org/browser/favicon-service;1"]
            .getService(Ci.nsIFaviconService);
        for each (let row in rows)
        {
          try {
            let url = row.getResultByName("url").toString();
            if (url.substr(0, 5) != "http:" && url.substr(0, 6) != "https:")
              continue; // would throw in mURLResult
            let title = row.getResultByName("bookmarkTitle").toString();
            if (!title)
              title = row.getResultByName("pageTitle").toString();
            if (!title)
              title = url;
            let icon = faviconServ.getFaviconImageForPage(
                Services.io.newURI(url, null, null)).spec;
            self._addResult(new mURLResult(title, descr, icon, url));
          } catch (e) { self._haveItemError(e); }
        }
        self._notifyObserversOfResultChanges();
      }, self._haveFatalError));
    } catch (e) { this._haveFatalError(e); }
  },
}
extend(mPlacesSearch, mSearch);

XPCOMUtils.defineLazyServiceGetter(this, "gBookmarksService",
    "@mozilla.org/browser/nav-bookmarks-service;1",
    "nsINavBookmarksService");
