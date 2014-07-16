Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js");

/**
 * @param engine {mSearch}
 * @param acListener {nsIAutoCompleteObserver}
 * @param acSearch {nsIAutoCompleteSearch}
 */
function Results(engine, acListener, acSearch)
{
  assert(engine instanceof mSearch);
  assert(acListener.QueryInterface(Ci.nsIAutoCompleteObserver));
  assert(acSearch.QueryInterface(Ci.nsIAutoCompleteSearch));
  this._engine = engine;
  this._acListener = acListener;
  this._acSearch = acSearch;

  engine.addObserver(makeCallback(this, this.gotNewResults));
}
Results.prototype =
{
  _engine : null, // {mSearch}
  _acListener : null, // {nsIAutoCompleteObserver} where to send the results
  _acSearch : null, // {nsIAutoCompleteSearch} what triggered/created us

  gotNewResults : function()
  {
    // mark header entries
    var lastLabel = null;
    for each (let entry in this._engine._results)
    {
      if (entry.description != lastLabel)
        entry.isFirstOfSection = true;
      lastLabel = entry.description;
    }

    // call listeners
    this._acListener.onUpdateSearchResult(this._acSearch, this);
  },

  /**
   * @return {String} the user's query string
   */
  get searchString()
  {
    return this._engine._searchTerm;
  },

  /**
   * @return the result code of this result object, either:
   *         RESULT_IGNORED   (invalid searchString)
   *         RESULT_FAILURE   (failure)
   *         RESULT_NOMATCH   (no matches found)
   *         RESULT_SUCCESS   (matches found)
   */
  get searchResult()
  {
    if (this._engine.error)
      return Ci.nsIAutoCompleteResult.RESULT_FAILURE;
    if (this._engine._results.length == 0)
      return Ci.nsIAutoCompleteResult.RESULT_NOMATCH;
    return Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
  },

  /**
   * @return the default item that should be entered if none is selected
   */
  get defaultIndex()
  {
    return 0;
  },

  /**
   * @interface nsIAutoCompleteResults
   * @return {String} the reason the search failed
   */
  get errorDescription()
  {
    return this._engine.error;
  },

  /**
   * @interface nsIAutoCompleteResults
   * @return {Integer} the number of results
   */
  get matchCount()
  {
    return this._engine._results.length;
  },

  getResultAt : function(i)
  {
    return this._engine._results[i];
  },

  /**
   * What will be filled into the textfield, if the user selects this entry
   * We return either something to search for, or a URL.
   *
   * @interface nsIAutoCompleteResults
   * @param i {Integer}
   * @return {String}
   */
  getValueAt : function(i)
  {
    var result = this.getResultAt(i);
    if (result instanceof mURLResult)
      return result.url; // @see search-toolbaritem.js onTextEntered()
    return result.title;
  },

  /**
   * What the dropdown will show as label for this entry.
   * @interface nsIAutoCompleteResults
   * @param i {Integer}
   * @return {String}
   */
  getLabelAt : function(i)
  {
    return this.getResultAt(i).title;
  },

  /**
   * Will be shown as small grey text on the right of the dropdown entry
   * @interface nsIAutoCompleteResults
   * @param i {Integer}
   * @return {String}
   */
  getCommentAt : function(i)
  {
    return this.getResultAt(i).description;
  },

  /**
   * Style hint
   * @interface nsIAutoCompleteResults
   * @param i {Integer}
   * @return {String}
   */
  getStyleAt : function(i)
  {
    var result = this.getResultAt(i);
    var suffix = result.isFirstOfSection ? "-first-of-section" : "";
    if (result instanceof mSearchTermResult)
      return "united-searchterm" + suffix;
    if (result instanceof mURLResult)
      return "united-url" + suffix;
    return "united-other" + suffix;
  },

  /**
   * Icon URL for the dropdown entry
   * @interface nsIAutoCompleteResults
   * @param i {Integer}
   * @return
   */
  getImageAt : function(i)
  {
    // showimagecolumn="false" doesn't work with RichResult :(
    return "";
    //return this.getResultAt(i).icon || "";
  },

  /**
   * Removes a result from the resultset
   * @param  index    the index of the result to remove
   * @param removeFromDatabase {Boolean} Delete the history result from the DB
   */
  removeValueAt : function(i, removeFromDatabase)
  {
    if (removeFromDatabase)
    {      
      let resultToRemove = this._engine._results[i];
      // TODO
    }
    this._engine._results.splice(i, 1);
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteResult]),
};

function mCollectAutoComplete()
{
}
mCollectAutoComplete.prototype =
{
  _currentSearch : null,

  /**
   * @interface nsIAutoCompleteSearch
   * Initiates the search result gathering process.
   *
   * @param searchString {String}    the user's query string
   * @param searchParam {String}     extra parameter
   * @param previousResult   unused, a client-cached store of the previous
   *                        generated resultset for faster searching.
   * @param listener {nsIAutoCompleteObserver} we have to notify this when
   *     results are ready.
   */
  startSearch : function(searchString, searchParam, previousResult, listener)
  {
    try {
      ddebug("startSearch: " + searchString  + " with " + searchParam);
      var engine = null;
      if (searchParam == "local-united")
        engine = new mLocalUnitedSearch(searchString);
      else if (searchParam.substr(0, 18) == "websuggest,engine=")
        engine = new mWebSuggest(searchString, searchParam.substr(18));
      else if (searchParam == "places")
        engine = new mPlacesSearch(searchString);
      else if (searchParam == "psh")
        engine = new mPSHSearch(searchString);
      else
        throw new NotReached("unknow param '" + searchParam + "'");
      this._currentSearch = new Results(engine, listener, this);
      engine.startSearch();
    } catch(e) { errorInBackend(e); }
  },

  /**
   * @interface nsIAutoCompleteSearch
   * Ends the search immediately
   */
  stopSearch : function()
  {
    //throw new NotReached("not implemented");
    //this._currentSearch.cancel();
    //this._currentSearch = null;
  },

  classDescription: "AutoComplete from mCollect search engines",
  contractID: "@mozilla.org/autocomplete/search;1?name=unitedinternet-mcollect",
  classID: Components.ID("{aec3bc83-0b7d-4612-b625-4f22070a9b33}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch,
                                         Ci.nsIAutoCompleteObserver])
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([mCollectAutoComplete]);
