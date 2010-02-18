/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

const QUERY_TIMEOUT_LENGTH = 1000;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");


/**
 * AutoComplete implementation for eBay Search
 */
function EbayAutoCompleteSearch() {
  this._init();
}

EbayAutoCompleteSearch.prototype = {
  // properties required for XPCOM registration
  classDescription: "eBay Autocomplete Search",
  classID:          Components.ID("{82B66BD4-140D-49DF-88B0-31C56ECAF6B6}"),
  contractID:       "@mozilla.org/autocomplete/search;1?name=ebay-search",

  _searchString : null,       // string we're searching for
  _listener : null,           // listener to which the results will be returned
  _request : null,            // xmlHTTPRequest for server request
  _timeout : null,            // timeout in case request doesn't return
  _formHistory : null,        // form history service instance
  _suggestionResults : null,  // results returned by query search
  _historyResults : null,     // results returned by history search

  /**
   * Performs component initialisation.
   */
  _init : function() {
    // Modules
    Cu.import("resource://ebaycompanion/helpers/logger.js");
    Cu.import("resource://ebaycompanion/constants.js");
    Cu.import("resource://ebaycompanion/datasource.js");
  },

  /**
   * Start asynchronous autocomplete search (nsIAutoCompleteSearch)
   * @param aSearchString string that is being queried
   * @param aSearchParam string parameter passed to search for any use
   * @param aPreviousResult previous result that was returned?
   * @param aListener listener to which to return our results
   */
  startSearch : function(aSearchString, aSearchParam, aPreviousResult,
                         aListener) {
    var request =
      Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].
        createInstance(Ci.nsIXMLHttpRequest);
    var that = this;

    var suggestionsEnabled;

    this._formHistoryInstance =
      Cc["@mozilla.org/autocomplete/search;1?name=form-history"].
        createInstance(Ci.nsIAutoCompleteSearch);
    this._timeout =
      Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

    suggestionsEnabled = Constants.prefBranch.get("searchbox.showSuggestions");

    // REMOVE AFTER BETA TESTING
    // Only display results if we're logged in to the UK site
    if (Datasource.homeSite() != "UK") {
      suggestionsEnabled = false;
    }

    // Record details for later return.
    this._searchString = aSearchString;
    this._listener = aListener;

    // Reset results in case they're populated from previous search.
    this._historyResults = null;
    this._suggestionResults = null;

    // Start searching history for matches.
    // It returns via nsIAutoCompleteObserver.
    this._formHistoryInstance.
      startSearch(aSearchString, aSearchParam, aPreviousResult, this);

    if (suggestionsEnabled) {
      // Send request to server for query matches.
      let url = Constants.getUrl("autosuggest", "autosuggest",
                                 {query: aSearchString});
      request.open("GET", url, true);

      request.addEventListener("load",
        function () {
          that._handleQueryResponse();
        }, false);

      if (this._request) {
        this._request.abort();
      }
      this._request = request;

      // Initialise timer in case request doesn't return.
      this._timeout.initWithCallback({
        notify : function() {
          // Abort request, create empty result set, and continue.
          that._timeout = null;
          that._request.abort();
          that._request = 0;
          that._suggestionResults = {values : [], comments : []};
          that._resultsReturned();
        }
      }, QUERY_TIMEOUT_LENGTH, Ci.nsITimer.TYPE_ONE_SHOT);

      request.send(null);
    } else {
      // Suggestions are disabled; create empty list and continue.
      this._suggestionResults = {values : [], comments : []};
      that._resultsReturned();
    }
  },

  /**
   * Called when the Form History service returns a set of matches.
   * (nsIAutoCompleteObserver)
   * @param aSearch the search that is returning these results
   * @param aResult the result object being returned
   */
  onSearchResult : function(aSearch, aResult) {
    var results = {
      values : [],
      comments : []
    };

    // We're done with the form history service now.
    this._formHistory = null;

    for (var i=0; i<aResult.matchCount; i++) {
      results.values.push(aResult.getValueAt(i));
      results.comments.push(aResult.getCommentAt(i));
    }

    this._historyResults = results;
    this._resultsReturned();
  },

  /**
   * Handles the response returned from a query.
   */
  _handleQueryResponse : function() {
    const RESPONSE_REGEX = /"(.*?)"/g;
    const WHITESPACE_TRIM = /^(.*?)\s*$/;
    var responseText = this._request.responseText;
    var trimmedSearchString = WHITESPACE_TRIM.exec(this._searchString)[1];
    var results = {
      values : [],
      comments : [],
    };
    var currentMatch;

    // Cancel timeout as request has returned successfully.
    this._timeout.cancel();
    this._timeout = null;

    // We're done with our xmlHTTPRequest instance now.
    this._request = null;

    // The first match should be the query string echoed back.
    // If it's not, the returned page is not sane (maybe an error page?) and we
    //   ignore it.
    currentMatch = RESPONSE_REGEX.exec(responseText);
    if (currentMatch && currentMatch[1] == trimmedSearchString) {
      currentMatch = RESPONSE_REGEX.exec(responseText);
      while (currentMatch) {
        results.values.push(currentMatch[1]);
        results.comments.push(null);
        currentMatch = RESPONSE_REGEX.exec(responseText);
      }
    } else {
      // Reset the RegExp so that we match the first result next time it's used.
      RESPONSE_REGEX.lastIndex = 0;
    }

    this._suggestionResults = results;
    this._resultsReturned();
  },

  /**
   * Called when results are returned from history or query searches.
   */
  _resultsReturned : function() {
    // When both sets of results are in, return them to our listener.
    if (this._historyResults && this._suggestionResults) {
      this._removeDuplicates();
      this._returnResults();
    }
  },

  /**
   * Removes duplicate entries from the suggestion results.
   */
  _removeDuplicates : function() {
    var curHistoryVal;
    var curSuggestVal;

    for (var i = 0; i < this._historyResults.values.length; i++) {
      curHistoryVal = this._historyResults.values[i];
      for (var j = 0; j < this._suggestionResults.values.length; j++) {
        curSuggestVal = this._suggestionResults.values[j];
        if (curHistoryVal == curSuggestVal) {
          // remove this result from the suggestions
          this._suggestionResults.values.splice(j, 1);
          this._suggestionResults.comments.splice(j, 1);
        }
      }
    }
  },

  /**
   * Called when all results are in and we want to return them.
   */
  _returnResults : function() {
    const HIST_TARGET = 3;    // the prefered number of history entries
    const SUGG_TARGET = 7;    // the prefered number of suggestion entries
    var numHistResults = this._historyResults.values.length;
    var numSuggResults = this._suggestionResults.values.length;
    var result = new AutoCompleteResult();

    result.searchString = this._searchString;

    if ((numHistResults + numSuggResults) > 0) {
      var deltaHist;
      var deltaSugg;
      var requiredHist;
      var requiredSugg;

      result.searchResult = Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
      result.defaultIndex = 0;

      // Start calculating how we'll split between history and suggestions.
      // The aim is to stick to TARGETs as much as possible, but to borrow
      //   results from the other list to make up numbers if necessary and
      //   possible.
      deltaHist = numHistResults - HIST_TARGET;
      deltaSugg = numSuggResults - SUGG_TARGET;

      // The default case is that all is OK
      requiredHist = HIST_TARGET;
      requiredSugg = SUGG_TARGET;

      // if we don't have enough of either result type, use as much as possible
      if (deltaHist < 0) {
        requiredHist = numHistResults;
      }
      if (deltaSugg < 0) {
        requiredSugg = numSuggResults;
      }

      // if suggestions are lacking and history has slack
      if (deltaSugg < 0 && deltaHist > 0) {
        // if history has more than it needs to fill the lacking suggestions
        if ((deltaSugg + deltaHist) > 0) {
          // add what we need to fill the missing suggestions
          requiredHist = HIST_TARGET - deltaSugg;
        } else {
          // add as much as we have available
          requiredHist = HIST_TARGET + deltaHist;
        }
      // the reverse
      } else if (deltaHist < 0 && deltaSugg > 0) {
        if ((deltaHist + deltaSugg) > 0) {
          requiredSugg = SUGG_TARGET - deltaHist;
        } else {
          requiredSugg = SUGG_TARGET + deltaSugg;
        }
      }

      // Append history
      for (var i=0; i < requiredHist; i++) {
        result.appendMatch(this._historyResults.values[i],
                           this._historyResults.comments[i]);
      }

      // Add comment to first suggestion, if one exists.
      if (this._suggestionResults.values.length > 0) {
        this._suggestionResults.comments[0] = "Suggestions";
      }

      // Append suggestions
      for (var i=0; i < requiredSugg; i++) {
        result.appendMatch(this._suggestionResults.values[i],
                           this._suggestionResults.comments[i]);
      }
    } else {
      result.searchResult = Ci.nsIAutoCompleteResult.RESULT_NOMATCH;
    }

    this._listener.onSearchResult(this, result);
  },

  /**
   * Stop asynchronous autocomplete search (nsIAutoCompleteSearch)
   */
  stopSearch : function() {
    if (this._request) {
      this._request.abort();
      this._request = 0;
    }
    if (this._formHistory) {
      this._formHistory.stopSearch();
      this._formHistory = null;
    }
    if (this._timeout) {
      this._timeout.cancel();
      this._timeout = null;
    }
  },

  // QueryInterface implementation
  QueryInterface : XPCOMUtils.generateQI([
    Ci.nsIAutoCompleteSearch,
    Ci.nsIAutoCompleteObserver
  ])
};

/**
 * Simple AutoComplete result object, used to return results.
 */
function AutoCompleteResult() {
  this._searchString = "";
  this._searchResult = 0;
  this._defaultIndex = 0;
  this._errorDescription = "";
  this._results = [];
  this._comments = [];
};

AutoCompleteResult.prototype = {
  /**
   * The original search query
   */
  get searchString() {
    return this._searchString;
  },

  set searchString(val) {
    this._searchString = val;
  },

  /**
   * The result code for this result object, from nsIAutoCompleteResult:
   *   RESULT_IGNORED (invalid searchString)
   *   RESULT_FAILURE (failure)
   *   RESULT_NOMATCH (no matches found)
   *   RESULT_SUCCESS (matches found)
   */
  get searchResult() {
    return this._searchResult;
  },

  set searchResult(val) {
    this._searchResult = val;
  },

  /**
   * Index of the default item that should be entered if none is selected.
   */
  get defaultIndex() {
    return this._defaultIndex;
  },

  set defaultIndex(val) {
    this._defaultIndex = val;
  },

  /**
   * String describing the cause of a search failure.
   */
  get errorDescription() {
    return this._errorDescription;
  },

  set errorDescription(val) {
    this._errorDescription = val;
  },

  /**
   * The number of matches.
   */
  get matchCount() {
    return this._results.length;
  },

  /**
   * Get the value of the result at the given index.
   */
  getValueAt : function(index) {
    return this._results[index];
  },

  /**
   * Get the comment of the result at the given index.
   */
  getCommentAt : function(index) {
    return this._comments[index];
  },

  getImageAt : function(index) {
    return "";
  },

  /**
   * Append a match to the list.
   */
  appendMatch : function(value, comment) {
    this._results.push(value);
    this._comments.push(comment);
  },

  /**
   * Get the style hint for the result at the given index.
   */
  getStyleAt : function(index) {
    var ret = null

    // Only apply special style if there's a category in the comment column.
    if (this._comments[index]) {
      if (index == 0) {
        ret = "suggestfirst";
      } else {
        ret = "suggesthint";
      }
    }

    return ret;
  },

  /**
   * Remove the value at the given index from the autocomplete results.
   * If removeFromDb is set to true, the value should be removed from persistent
   * storage as well.
   */
  removeValueAt : function(index, removeFromDb) {
    this._results.splice(index, 1);
    this._comments.splice(index, 1);
  },

  // QueryInterface implementation
  QueryInterface : XPCOMUtils.generateQI([
    Ci.nsIAutoCompleteResult
  ])
};

var components = [EbayAutoCompleteSearch];

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule(components);
}
