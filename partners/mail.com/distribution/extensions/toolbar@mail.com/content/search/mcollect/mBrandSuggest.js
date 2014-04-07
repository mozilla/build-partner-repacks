Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);

/**
 * This asks a web search engine for search term suggestions for this term.
 * The URL is from the brand.js file, not from OSDs.
 * Use mWebSuggest, if you want to use the suggest URL from an OSD.
 *
 * Implementation <copied from="mWebSuggest.js">
 *
 * Returns |mSearchTermResult|s.
 *
 * @param searchTerm {String}
 */
function mBrandSuggest(searchTerm)
{
  mSearch.call(this, searchTerm);
}
mBrandSuggest.prototype =
{
  _fetch : null, // {FetchHTTP}

  /**
   * Triggers the the network request to the search engine.
   */
  startSearch : function()
  {
    try {
      var self = this;
      var url = brand.search.suggestURL + this._searchTerm;
      this._fetch = new FetchHTTP({
        url : url,
        method : "GET",
      },
      function(responseText)
      {
        var responseJSON = JSON.parse(responseText);
        var terms = responseJSON[1] || [];

        var sb = new StringBundle("search/mcollect");
        var descr = sb.get("mBrandSuggest.descr")
            .replace(/\$brandname\$/, brand.search.suggestName);
        var icon = "chrome://unitedtb/skin/brand/icon-small.png";

        // create mSearchTermResult objects
        for each (let term in terms)
          self._addResult(new mSearchTermResult(term, descr, icon));

        // keep sort order of search engine

        self._notifyObserversOfResultChanges();
      },
      function(e) {
        if (e instanceof UserCancelledException)
          return;
        self._haveFatalError(e);
      });
      //this._fetch._request.channel.notificationCallbacks = ...
      this._fetch.start();
    } catch (e) { this._haveFatalError(e); }
  },

  cancel : function()
  {
    mSearch.prototype.cancel.apply(this);
    if (this._fetch && ! this._fetch.result)
      this._fetch.cancel();
  },
}
extend(mBrandSuggest, mSearch);
