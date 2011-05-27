/**
 * This represents a search term, i.e. a word, that the user can search
 * for using another search engine.
 * Selecting it will trigger a web search using this word.
 *
 * TODO always use a given engine (e.g. current FF engine or
 * our preferred engine), or allow the mSearch to define that?
 *
 * @param term {String} a search term that the user can search for with a search engine
 * @param descr {String} (optional) additional text explaining the result,
 *     e.g. where it comes from or why it was returned.
 */
function mSearchTermResult(term, descr, icon)
{
  if (!descr)
    descr = "";
  descr = sanitize.label(descr).replace(/\$searchterm\$/g, term);
  this._term = sanitize.label(term);
  mResult.call(this, term, descr, icon);
}
mSearchTermResult.prototype =
{
  _term : null, // {String}

  /**
   * Load this in the browser window, if the user activates this result.
   */
  get url()
  {
    return this._url;
  },

  // Help for ranking
  /**
   * Length of original search term / length of this search term.
   * Higher is better, 1 is best (exact match).
   */
  hitLengthRatio : 0.0,
  /**
   * Position of the original search term in this search term.
   * Lower is better.
   */
  hitPos : 0,

  activate : function(firefoxWindow)
  {
    // TODO
    //united.notifyWindowObservers("search-started",
    //    { searchTerm : this._term, source : 1 });
    var url = brand.search.toolbarURL;
    url += encodeURIComponent(this._term);
    firefoxWindow.united.loadPage(url); // from util.js
  },

}
extend(mSearchTermResult, mResult);
