/**
 * This asks several other search implementations, and merges the result.
 * This is basically a meta search engine, and "United" is a word game.
 * It implements a certain algo and sources that UnitedInternet specced.
 *
 * It currently just uses static slots, e.g. up to 8 results from PSH and Places,
 * plus up to 5 from WebSuggest, plus 2 from ebay, with a total of 15.
 * If a higher engine doesn't use its slots, the lower engine fills them, too.
 *
 * Returns arbitrary |mResult|s.
 *
 * @param searchTerm {String}
 */
function mLocalUnitedSearch(searchTerm)
{
  mSearch.call(this, searchTerm);
  this._psh = new mPSHSearch(searchTerm);
  this._places = new mPlacesSearch(searchTerm);
  this._webSuggest = new mWebSuggest(searchTerm, "-ours-");
  //this._ebay = new mWebSuggest(searchTerm, brand.search.eBayEngineName);

  var notify = makeCallback(this, this._gotNewResults);
  this._psh.addObserver(notify);
  this._places.addObserver(notify);
  this._webSuggest.addObserver(notify);
  //this._ebay.addObserver(notify);
}
mLocalUnitedSearch.prototype =
{
  startSearch : function()
  {
    this._psh.startSearch();
    this._places.startSearch();
    this._webSuggest.startSearch();
    //this._ebay.startSearch();
  },
  _gotNewResults : function()
  {
    // acquire and sort
    var r = [];
    this._fillUpToN(r, this._psh, 8);
    this._fillUpToN(r, this._places, 8);
    this._fillUpToN(r, this._webSuggest, 13);
    //this._fillUpToN(r, this._ebay, 15);
    this._results = r;
    this._notifyObserversOfResultChanges();
  },
  _fillUpToN : function(ourResults, engine, maxFill)
  {
    for each (let result in engine.currentResults)
    {
      if (ourResults.length >= maxFill)
        break;
      ourResults.push(result);
    }
    return ourResults;
  },
}
extend(mLocalUnitedSearch, mSearch);
