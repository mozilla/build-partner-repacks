/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{82B66BD4-140D-49DF-88B0-31C56ECAF6B6}"); 
const CLASS_NAME = "eBay Autocomplete Search";
const CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=ebay-search";

const SUGGEST_PREF = "extensions.ebaycomp.searchbox.showSuggestions";
const SITEID_PREF = "extensions.ebaycomp.site.id";
const QUERY_URL = "http://web.ebay.co.uk/autosuggest/output.php?q=";
const QUERY_TIMEOUT_LENGTH = 1000;

/**
 * AutoComplete implementation for eBay Search
 */
function EbayAutoCompleteSearch() {
  this._init();
}

EbayAutoCompleteSearch.prototype = {
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
    var prefBranch =
      CC["@mozilla.org/preferences-service;1"].
        getService(CI.nsIPrefBranch);
    var request =
      CC["@mozilla.org/xmlextras/xmlhttprequest;1"].
        createInstance(CI.nsIXMLHttpRequest);
    var that = this;

    var suggestionsEnabled;

    this._formHistoryInstance =
      CC["@mozilla.org/autocomplete/search;1?name=form-history"].
        createInstance(CI.nsIAutoCompleteSearch);
    this._timeout =
      CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);

    // Retrieve preference
    try {
      suggestionsEnabled = prefBranch.getBoolPref(SUGGEST_PREF);
    }
    catch (e) {
      suggestionsEnabled = true;
    }

    // REMOVE AFTER BETA TESTING
    // Only display results if we're logged in to the UK site
    if (prefBranch.getIntPref(SITEID_PREF) != 3) {
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
      request.open("GET", (QUERY_URL + aSearchString), true);

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
      }, QUERY_TIMEOUT_LENGTH, CI.nsITimer.TYPE_ONE_SHOT);

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

      result.searchResult = CI.nsIAutoCompleteResult.RESULT_SUCCESS;
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
      result.searchResult = CI.nsIAutoCompleteResult.RESULT_NOMATCH;
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

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.nsIAutoCompleteSearch) &&
        !aIID.equals(CI.nsIAutoCompleteObserver) &&
        !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
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

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.nsIAutoCompleteResult) &&
        !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
};

/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var EbayAutoCompleteSearchFactory = {
  /**
   * Creates an instance of the class associated with this factory.
   * @param aOuter pointer to a component that wishes to be aggregated in the
   * resulting instance. This can be nsnull if no aggregation is requested.
   * @param aIID the interface type to be returned.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NO_AGGREGATION if aOuter is not null. This component
   * doesn't support aggregation.
   */
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw CR.NS_ERROR_NO_AGGREGATION;
    }

    return (new EbayAutoCompleteSearch()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayAutoCompleteSearchModule = {
  /**
   * When the nsIModule is discovered, this method will be called so that any
   * setup registration can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   * @param aType loader type being used to load this module.
   */
  registerSelf : function(aCompMgr, aLocation, aLoaderStr, aType) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      CLASS_ID, CLASS_NAME, CONTRACT_ID, aLocation, aLoaderStr, aType);
  },

  /**
   * When the nsIModule is being unregistered, this method will be called so
   * that any cleanup can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   */
  unregisterSelf : function (aCompMgr, aLocation, aLoaderStr) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  },

  /**
   * This method returns a class object for a given ClassID and IID.
   * @param aCompMgr the global component manager.
   * @param aClass the ClassID of the object instance requested.
   * @param aIID the IID of the object instance requested.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NOT_IMPLEMENTED if aIID is inadequate.
   * @throws NS_ERROR_NO_INTERFACE if the interface is not found.
   */
  getClassObject : function(aCompMgr, aClass, aIID) {
    if (!aIID.equals(CI.nsIFactory)) {
      throw CR.NS_ERROR_NOT_IMPLEMENTED;
    }

    if (aClass.equals(CLASS_ID)) {
      return EbayAutoCompleteSearchFactory;
    }

    throw CR.NS_ERROR_NO_INTERFACE;
  },

  /**
   * This method may be queried to determine whether or not the component
   * module can be unloaded by XPCOM.
   * @param aCompMgr the global component manager.
   * @return true if the module can be unloaded by XPCOM. false otherwise.
   */
  canUnload: function(aCompMgr) {
    return true;
  }
};

/**
 * Initial entry point.
 * @param aCompMgr the global component manager.
 * @param aFileSpec component file.
 * @return the module for the service.
 */
function NSGetModule(aCompMgr, aFileSpec) {
  return EbayAutoCompleteSearchModule;
}
