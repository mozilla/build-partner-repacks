Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);

/**
 * This asks a web search engine for search term suggestions for this term.
 * E.g. Google suggestions.
 *
 * Returns |mSearchTermResult|s.
 *
 * Part of the implementation is <copied to="mEBay.js">
 *
 * @param searchTerm {String}
 * @param engine {String} Name of OSD search plugin to use
 *    "-current-" = Use the currently in Firefox selected engine (top-right search field)
 *    "-ours-" = Use the UnitedInternet search engine, current brand and region
 *    otherwise use the search plugin with the given name
 */
function mWebSuggest(searchTerm, engine)
{
  mSearch.call(this, searchTerm);
  this._engineName = sanitize.label(engine);
}
mWebSuggest.prototype =
{
  _engineName : null, // for use by _getEngine() only, @see ctor engine
  _fetch : null, // {FetchHTTP}

  /**
   * Triggers the the network request to the search engine.
   */
  startSearch : function()
  {
    try {
      const kSuggestType = "application/x-suggestions+json";
      var engine = this._getEngine();
      if (!engine.supportsResponseType(kSuggestType))
        return;
      var self = this;
      var submission = engine.getSubmission(this._searchTerm, kSuggestType);
      this._fetch = new FetchHTTP({
        url : submission.uri.spec,
        method : submission.postData ? "POST" : "GET",
        uploadBody : submission.postData,
      },
      function(responseText)
      {
        var responseJSON = JSON.parse(responseText);
        //debugObject(responseJSON, "suggest", 3);
        //var originalSearchTerm = sanitize.label(responseJSON[0]) || "";
        // TODO how can I properly check that this is an array,
        // not an object with properties?
        var terms = responseJSON[1] || [];

        var sb = new StringBundle("chrome://unitedtb/locale/search/mcollect.properties");
        var descr = sb.get("mWebSuggest.descr").replace(/\$enginename\$/, engine.name);
        var icon = engine.iconURI ? engine.iconURI.spec : null;

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

  /**
   * Selects the search engine to use.
   * @see ctor @param engine
   *
   * There are 3 thinkable scenarios:
   * - currently in Firefox selected engine
   * - the UnitedInternet engine (for the current region)
   * - an engine that the caller specifies.
   *
   * @returns {nsISearchEngine}
   */
  _getEngine : function()
  {
    // nsIBrowserSearchService
    if (this._engineName == "-current-")
      return Services.search.currentEngine;
    else if (this._engineName == "-ours-")
      return Services.search.getEngineByName(brand.search.engineName);
    else
      return Services.search.getEngineByName(this._engineName);
  },
}
extend(mWebSuggest, mSearch);
