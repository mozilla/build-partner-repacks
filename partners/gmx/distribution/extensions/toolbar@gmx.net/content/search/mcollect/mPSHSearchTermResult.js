/**
 * This represents a search term, from the personal search history.
 * We are only using it so that clicking on PSH results from the dropdown
 * can go to a different URL.
 */

function mPSHSearchTermResult(term, descr, icon)
{
  mSearchTermResult.call(this, term, descr, icon);
}
mPSHSearchTermResult.prototype =
{
  activate : function(firefoxWindow)
  {
    firefoxWindow.unitedinternet.common.notifyWindowObservers("search-started",
      { searchTerm : this._term, source : 1 });
    var url = brand.search.pshURL;
    url += encodeURIComponent(this._term);
    firefoxWindow.unitedinternet.common.loadPage(url); // from util.js
  }
}
extend(mPSHSearchTermResult, mSearchTermResult);
