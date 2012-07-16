/**
 * This asks several other search implementations, and merges the result.
 * This is basically a meta search engine, and "United" is a word game.
 * It implements a certain algo and sources that UnitedInternet specced.
 *
 * It currently just uses static slots, e.g. up to 8 results from PSH and Places,
 * plus up to 7 from WebSuggest, with a total of 15.
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
  this._places = new mPlacesSearch(searchTerm, false);
  this._webSuggest = new mBrandSuggest(searchTerm);

  var notify = makeCallback(this, this._gotNewResults);
  this._psh.addObserver(notify);
  this._places.addObserver(notify);
  this._webSuggest.addObserver(notify);
}
mLocalUnitedSearch.prototype =
{
  startSearch : function()
  {
    this._psh.startSearch();
    this._places.startSearch();
    this._webSuggest.startSearch();
  },
  cancel : function()
  {
    mSearch.prototype.cancel.apply(this);
    this._psh.cancel();
    this._places.cancel();
    this._webSuggest.cancel();
  },
  _gotNewResults : function()
  {
    // acquire and sort
    var r = [];
    this._fillUpToN(r, this._psh, 5);
    this._fillUpToN(r, this._webSuggest, 10);
    this._fillUpToN(r, this._places, 15);
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
