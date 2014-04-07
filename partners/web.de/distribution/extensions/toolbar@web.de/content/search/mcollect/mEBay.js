Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);

/**
 * This asks ebay for search term suggestions for this term.
 *
 * Returns |mURLResult|s, going to ebay search.
 * TODO I'd like to use |mSearchTermResult|s, but that wouldn't allow me to go to eBay.
 *
 * A lot of the implementation is <copied from="mWebSuggest.js">
 *
 * @param searchTerm {String}
 */
function mEBay(searchTerm)
{
  mSearch.call(this, searchTerm);
}
mEBay.prototype =
{
  _fetch : null, // {FetchHTTP}

  /**
   * Triggers the the network request to the search engine.
   */
  startSearch : function()
  {
    try {
      var self = this;
      this._fetch = new FetchHTTP({
        url : brand.ebay.suggestURL + encodeURIComponent(self._searchTerm),
        method : "GET",
      },
      function(responseText)
      {
        var responseJSON = JSON.parse(responseText);
        //debugObject(responseJSON, "suggest", 3);
        //var originalSearchTerm = sanitize.label(responseJSON[0]) || "";
        // TODO how can I properly check that this is an array,
        // not an object with properties?
        var terms = responseJSON[1] || [];

        var sb = new StringBundle("search/mcollect");
        var engineName = "eBay";
        var descr = sb.get("mWebSuggest.descr").replace(/\$enginename\$/, engineName);
        var icon = "chrome://unitedtb/skin/ebay/ebay-small.png";

        // create mResult objects
        for each (let term in terms)
          self._addResult(new mURLResult(term, descr, icon,
                                         brand.ebay.searchURL + encodeURIComponent(term)));

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
extend(mEBay, mSearch);
Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);
