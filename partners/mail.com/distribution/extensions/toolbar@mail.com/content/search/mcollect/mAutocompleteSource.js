// Caller must load AutoComplete.js and import mCollectImport.js and util.js
Components.utils.import("resource://unitedtb/util/StringBundle.js", this);

/**
 * Connects mCollect to our AutoComplete widget
 * @param windowContext {Object with loadPage() function}
 */
function mCollectAutocompleteSource(ac, windowContext)
{
  this._ac = ac;
  action.windowContext = windowContext;
}
mCollectAutocompleteSource.prototype = 
{
  _ac : null,
  _itemsShowing : {},
  _slots : {},
  _engine : null, // {mSearch}
  _currentTerm : null, // {mSearch}
  _clearSearchHistoryLabel: null,

  /**
   * Called by autocomplete widget
   */
  onTextChanged : function (text)
  {
    if (this._engine)
      this._engine.cancel();
    this._engine = null;
    this._ac.hideSuggestions();
    this._ac.clearItems();
    this._slots = {};
    this._currentTerm = text;
    if (!text)
      return;
    this._engine = new mLocalUnitedSearch(text);
    var self = this;
    this._engine.addObserver(function()
    {
      self._populate(self._engine.currentResults);
    });
    this._engine.startSearch();
    this._ac.shouldShowSuggestions();
  },

  _populate : function (results)
  {
    var oldSelectedItem = this._ac.currentItem();
    var selectedResult = oldSelectedItem ? oldSelectedItem.searchResult : null;
    this._ac.clearItems();
    this._slots = {};
    for each (var result in results)
    {
      // section header (based on description), e.g. "Web search results"
      var header = null;
      if (result.description && this._slots[result.description])
      {
        header = this._slots[result.description];
      }
      else if (result.description) 
      {
        header = new SimpleAutocompleteItem(null, result.description, null, null, null, true, null, ["ac-item-header"]);
        this._slots[result.description] = header;
        this._ac.addItem(header);
      }

      var icon = result.icon;
      var value = result instanceof mSearchTermResult ? result.title : "";
      var highlight = (result.type == "searchterm" || result.type == "url") ? this._currentTerm : "";
      var item = new SimpleAutocompleteItem(value, result.title, result.description, icon,
          action, false, highlight, [ "ac-" + result.type ]);
      item.searchResult = result;
      this._ac.addItem(item);
      if (result == selectedResult && selectedResult)
        this._ac.selectItem(item, true); // noscroll is a hack, prevents a bug
    }
  },

  cancel : function()
  {
    if (this._engine)
    {
      this._engine.cancel();
    }
  },
}
extend(mCollectAutocompleteSource, AutocompleteSource);

function action(item)
{
  item.searchResult.activate(action.windowContext);
}
