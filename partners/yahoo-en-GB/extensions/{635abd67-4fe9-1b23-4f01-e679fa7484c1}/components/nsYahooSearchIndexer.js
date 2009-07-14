/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/**
* @fileoverview This file stores the datastructues that provide the various calssess of search
* data acrsoos firefox instances.The Advantages of moving entire data to Components provide.Reduced
* memory usage for storing data. Synchronizes between firefox instances .
*
* @author geldhose@yahoo-inc.com
* @date 14 - june - 2008
*/
var CI = Components.interfaces;
var CC = Components.classes;
var yahooCC = CC;
var yahooCI = CI;
var loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);             
var gConfigFilePath = "file://"+__LOCATION__.parent.path+"/extconfig.js";
loader.loadSubScript(gConfigFilePath);
loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/utils.js");
/**
* @class Utility class for querying data from search indexer
* @author geldhose@yahoo-inc.com
* class contains the indformation about the string which needs the be searched for.
* The type of search needed to be performed. The number of results expected
* @constructor
* 
*/
function YahooSearchQuery() {
    this.resetQuery();
}
YahooSearchQuery.prototype = {    
    /**
    Search nothing
    @type enum
    */
    T_NONE :0x00,
    /**
    Search for term in keys of search suggestions
    @type enum
    */    
    T_SUGGESTION : 0x01,
    /**
    Search for term in user search history
    @type enum
    */
    T_HISTORY : 0x02,
    /**
    Search for term in yahoo bookmarks
    @type enum
    */
    T_YAHOO_BOOKMARKS : 0x04,
    /**
    Search for term in users firefox bookmarks
    @type enum
    */
    T_FIREFOX_BOOKMARKS : 0x08,
    /**
    Search for term in personalized links
    @type enum
    */
    T_PERSONALIZED_LINKS : 0x10,
    /**
    Search for term keys of instant web results
    @type enum
    */
    T_INSTANT_WEB_RESULTS : 0x20,
    /**
    Search for the keyord in firefox user history
    @type enum
    */
    T_FIREFOX_USER_HISTORY : 0x40,
    /**
    search for the keyword in the button names and menu items. Helpful when a user is having delicious added as button 
    and this similar to run - notepad from the run prompt    
    @type enum
    */
    T_YAHOO_BUTTON_DATA : 0x80,   
    /**
    The combination of history + suggestion to be given in yahoo search
    @type enum
    */
    T_YAHOO_SUGGESTION : (0x100000 + 0x01 + 0x04),
    /**
    The type of search to be made is a substring match
    @type enum
    */
    SEARCH_SUBSTR : 0x01,    
    /**
    The type of search to be made is a Prefix Match match
    @type enum
    */
    SEARCH_PREFIX : 0x02,    
    /**
    The type of search to be made is a Word match match
    @type enum
    */
    SEARCH_WORDS : 0x03,
    /**
    Current search to me made
    @type enum
    */
    mQueryType : 0x01,
    /**
    The type of search to be made
    @type enum
    */
    mSearchType : 0x01,
    /**
    The number of results needed.
    @type number
    */
    mResultCount : 128,
    /**
    The search query
    @type string
    */
    mQuery : "",       
    /**
    Resets the query object
    */
    resetQuery : function() {
        this.mSearchType = this.SEARCH_SUBSTR;
        this.mQueryType = this.T_SUGGESTION;
        this.mResultCount = 128;
        this.mQuery = "";
    }
    ,
    /**
    * Gets the string representation of searhc query
    */
    getQueryType : function() {
        var type = "user";        
        switch (this.mQueryType) {
            case this.T_SUGGESTION :
                type = "suggestion";
                break;
            case this.T_LOOKUP_SUGGESTION:
                type = "suggestion";
                break;
            case this.T_HISTORY :
                type = "history";
                break;
            case this.T_YAHOO_BOOKMARKS:
                type = "bookmark";
                break;
            case this.T_FIREFOX_BOOKMARKS:
                type = "bookmark";
                break;
            case this.T_PERSONALIZED_LINKS:
                type = "bookmark";
                break;
            case this.T_INSTANT_WEB_RESULTS:
                type = "bookmark";
                break;
            case this. T_FIREFOX_USER_HISTORY:
                type = "bookmark";
                break;                
            case this.T_YAHOO_BUTTON_DATA:
                type = "bookmark";
                break;
            default :
                type = "user";
                break;
        }
        return type;
    },
    QueryInterface : function (iid) {
        if(!iid.equals(CI.nsIYahooSearchQuery) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
     }
};
/**
* @class Utility class for transfering array of strings without much copy
*/
function YahooStringEnumerator() {
    /**
    The Array that holds the string objects internally
    @type Array
    */
    this.mValues = [];
    /**
    The current index of string retrieved
    @type int
    */
    this.mIdx = 0;
}
YahooStringEnumerator.prototype = {
    /**
    * Intitalizes the iterator to start from the beginning
    */
    initialize : function() {
        this.mIdx = 0;
        return this;
    },
    /**
    * Clear the data present in current result set
    */
    clearData : function() {
        this.mValues = [];
        this.mIdx = 0;        
    },
    /**
    * Function gets the next string from intenal idx
    * @return {string} The string at the next index
    */
    getNext : function() {    
        return this.mValues[this.mIdx++];
    },
    /**
    * Checks whether there are more strings available in the current row
    */
    hasMoreElements : function() {
        return this.mIdx < this.mValues.length;
    },
    /**
    * Adds a string to the array
    * @param {string} str The string to be added.
    */
    addString : function (str) {
        this.mValues.push(str);
    },
    /**
    * Adds an array of string to the String enumerator
    */
    addStringArray : function(lst) {
        for (var idx = 0; idx < lst.length; idx++) {
            this.mValues.push(lst[idx]);
        }
    }
    ,
    /**
    * Creates a clone of the current object
    * @returns {nsIYahooStringEnumerator }
    */
    clone : function () {
        var ret = new YahooStringEnumerator();
        ret.mValues = this.mValues.slice();
        return ret;
    },
    QueryInterface : function (iid) {
        if(!iid.equals(CI.nsIYahooStringEnumerator) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    }
};
/**
* @class Utility class for transfering data from/to search indexer,
* ResultSet holds a 2D array of strings, each of the elements in the
* array can be iterated using the functions provided.
<pre>
Various classes of data handled 
            _______________________________________________
            |        |     |      |           |            |
PNL         | Title  | Url | Desc | hit Count |  timestamp |
            |________|_____|______|___________|____________|
            _______________________
            |        |     |      |
IWR         | Title  | Url | Desc |
            |________|_____|______|
            __________
            |        |
Suggestion  | Title  |
            |________|
            ________________________
            |        |             |
History     | Title  |   timestamp |
            |________|_____________|
</pre>
* @constructor
* @author geldhose@yahoo-inc.com
*/
function YahooResultSet() {
    /**
    The Array that holds the YahooStringEnumerator objects internally
    @type Array
    */
    this.mValues = [];    
    /**
    The current row index from wher data needs to be fetched
    @type int
    */
    this.mRowIdx = 0;   
    /**
    Status whether the resultset is populated
    @type boolean
    */
    this.mPopulatedType = 0;
    /**
    The meta data about the populated resultset 
    @type nsIYahooStringEnumerator
    */
    this.mMetaData = new YahooStringEnumerator();
    /**
    The reference of the query object resulted in the Resultset. 
    This object can be used by other parties to make the query to search indexer.   
    @type nsIYahooSearchQuery
    */
    this.mQueryObject = null;
}
YahooResultSet.prototype = {    
    /**
    * The possible column names , Combination of this will be present on the metadata
    * <pre>
    * COL_TEXT : "TEXT",
    * COL_URL : "URL",
    * COL_DESC :"DESCRIPTION",
    * COL_TIME_DIFF : "TIME_DIFF",        
    * COL_HIT_COUNT : "HIT_COUNT",
    * </pre>
    */
    COL_TEXT : "TEXT",
    COL_URL : "URL",
    COL_DESC :"DESCRIPTION",
    COL_TIME_DIFF : "TIME_DIFF",        
    COL_HIT_COUNT : "HIT_COUNT",   
    /**
    * Adds another item to the metadata
    * @param {string} name
    *       The key name - similar to the column name in data bases
    */
    addMetaData : function(name) {
        this.mMetaData.addString(name);
    },    
    /**
    * Returns a reference to the Meta Data
    * @return  nsIYahooStringEnumerator 
    */
    getMetaData : function() {
        return this.mMetaData;
    },    
    /**
    * Clear the data & Meta data present in current result set.
    */
    clearRows : function() {
        this.mValues = [];
        this.mRowIdx = 0;  
        this.mMetaData.clearData();
        this.mPopulatedType = 0;
    },    
    /**
    * Adds a new row whcih is an instance of nsIYahooStringEnumerator.
    * @returns nsIYahooStringEnumerator
    */
    createRow : function () {        
        var row = new YahooStringEnumerator();
        this.mValues.push(row);        
        return row;
    },    
    /**
    * Return the current Row and increments the row index by one and 
    * @return nsIYahooStringEnumerator
    */
    getNextRow : function() {
        return this.mValues[this.mRowIdx++];
    },  
    /**
    * Checks whether there are more rows available.
    * @returns boolean
    */
    hasMoreRows : function() {
        return this.mRowIdx < this.mValues.length;
    },
    /**
    * Returns the total number of rows available in the resultset
    * @return {number}
    */
    getRowCount : function() {
        return this.mValues.length;
    },
    /**
    * splice the length of result set
    */
    spliceResults : function(len) {
        this.mValues.splice(len);
    },
    /**
    * Creates a clone of the current object
    * @returns {nsIYahooResultSet}
    */
    clone : function() {
        var ret = new YahooResultSet();
        for (var idx = 0; idx < this.mValues.length; idx++) {
            ret.mValues.push(this.mValues[idx].clone());
        }        
        return ret;
    }
    ,
    /**
    * Populates the current result set from a string table.
    */
    populateWithStringTable : function(tab) {
        for (var idx = 0; idx < tab.length; idx++) {
            this.createRow().addStringArray(tab[idx]);            
        }
    }
    ,
    initialize : function () {
        this.mRowIdx = 0;
        for (var idx = 0; idx < this.mValues.length; idx++) {
            this.mValues[idx].initialize();
        }
    },  
    QueryInterface : function (iid) {
        if(!iid.equals(CI.nsIYahooResultSet) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
     }
};
/**
* @class Stores key and associated values
* @author geldhose@yahoo.com
* @constructor
* @param {string} key 
*       The key against which the values needs to be stored.
*/
function HashData(key) {
    /**
    The key 
    @type string
    */
    this.mKey = key;
    /**
    Array of values
    type string[]*/
    this.mValues = [];      
}
HashData.prototype = {
/**
* Populates the values from the result set
* @param {@link nsIResultSet} resultSet The result set to be filled in
*/
populateWithResultSet : function(rs) {
    this.mValues = [];
    while (rs.hasMoreRows()) {            
        var data = [];
        var si = rs.getNextRow();
        while (si.hasMoreElements()) {
             data.push(si.getNext());
        }
        this.mValues.push(data);
    }    
}
};
/**
* @class Stores the History data
* @constructor
* @param {string} term 
*       The search query made by user.
* @param {number} timeStamp 
*       The number of milliseconds from epoch.
* @param {number} hitCount
*       The number of hits made on the particulat term.
* @author geldhose@yahoo.com
*/
function HistoryData(term, timeStamp, hitCount) {
    /*Setting the default values */    
    timeStamp = timeStamp || 0;    
    hitCount = hitCount || 1;
    /**
    The History term
    @type string
    */
    this.mTerm = term;
    /**
    The recent time at which the term was searched.The number of milliseconds from epoch
    @type int 
    */
    this.mTimeStamp = timeStamp;
    /**
    The Number of searches made with the term
    @type int
    */
    this.mHitCount = hitCount;    
}
/**
* @class Stores the direct navigational links. aka bookmarks data
* This class stores the bookmarkdata in way which helps us to search it 
* efficiently
* @param {string} title
*       The title of the Diret navigational link
* @param {string} description
*       The Tag information or the Description of the bookmark
* @param {string} url 
*       The url of the bookmark
* @author geldhose@yahoo.com
*/
function BookmarkData(title, desc, url) {
    /**
    The Bookmark Title
    @type string
    */
    this.mTitle = title;
    /**
    The processed title value used for searching purpose
    @type string
    */
    this.mPTitle = title.toLowerCase();
    /**
    The Tag or description of the bookmarkdata
    @type string
    */
    this.mDescription = desc;
    /**
    The Processed Tag or description variable used for searching purpose.
    @type string
    */
    this.mPDescription = desc.toLowerCase();
    /**
    The bookmark url
    @type strnig
    */
    this.mUrl = url;
    /**
    The processed bookmark url used for searching purpose
    @type strnig
    */
    this.mPUrl = ytbUtils.removeStopWords(url);
}
/**
* @class Storess the list of hash values. Checks for direct cache hits,
* and also capable of making a search in the stored keys to provide 
* with a rough match
* @author geldhose@yahoo.com
*/
function SimpleHash () {
    /**
    List of {@link HashData}
    @type HashData[]
    */
    this.mDataStore = [];
    /**
    The maximum number of entries to be stored
    @type int
    */
    this.mMaxSize = 15;
}
SimpleHash.prototype = {   
    /**
    * Adds a new key and set of values.Also takes care of keeping track of the maximum 
    * size of the cahe. It behaves in a Priority based approach the proiority governed by the recency of use
    *
    * @param {string} key.
    */
    addData : function(key,values) {      
        var data =  new HashData(key.toLowerCase()); 
        var len = this.mDataStore.unshift(data);           
        if (len > this.mMaxSize) {
            this.mDataStore = this.mDataStore.slice(0, this.mMaxSize);                                
        }
        return data;
    },
    /**
    * Gets Data for a particular key
    * @param {string} key    
    */
    getData : function(key) {
        for(var idx = 0; idx < this.mDataStore.length; idx++) {
            if (this.mDataStore[idx].mKey == key) {                                       
                var hashData = this.mDataStore[idx];
                this.mDataStore.splice(idx,1);
                this.mDataStore.unshift(hashData);                  
                return hashData;                
            }
        }
        return null;             
    }
};
/**
* @class nsIYahooSearchIndexer - This class handles all the data that need to be displayed in the search
* assist popup. Class provides data for various operations. stores the various data of interest 
* in a form thats easy for search. the varios classes of data are - user search history,user's 
* yahoo bookmarks, user search suggestions are also cached , so this can be used across firefox 
* instances and will give a better user experience if the terms are searched again.
* we will incorporate searching of users browser history + the browser bookmarks + will give a 
* frame work for providing other parties to provide data to the yahoo search indexer which will be
* getting displayed when the user performs a search using the search box.
* @contructor 
* @author  geldhose@yahoo-inc.com
* @date 14 - june - 2008
*/
function YahooSearchIndexer(){
    /**
    The instance of nsIYahooFileIO service
    @type nsIYahooFileIOPre
    */
    this.mFileIO = CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIOPre);
    /**
    The resultset for transfering data from/to search indexer
    @type nsIYahooResultSet
    */    
    this.mResultSet = new YahooResultSet();   
    this.mResultSet.mQueryObject =  new YahooSearchQuery();
    this.loadSearchHistory();                                
}
YahooSearchIndexer.prototype = {
/**
* bookmarsData is an array of {@link BookmarkData} 
* @type BomkmarkData []
*
*/    
mYaooBookmarkData : [],
/**
* The suggestion cache.An array of objects of used for searching the cached suggestions 
* @type SimpleHash
*/    
mSuggestionCache : new SimpleHash(),
/**
* The cache for storing instant web resutls. We will be storing the latest 30 instant web results to
* provide a faster response time to the user
*/
mInstantWebResultCache : new SimpleHash(),
/**
* User history is an array of {@link HistoryData} ordered based on the recency
* @type HistoryData[]
*
*/    
mUserSearchHistory : [],
/**
* The Maximum number of user history to be tracked
* @type int
*/
mMaxHistory : 50,
/**
* Gets the reference of resultset
*/
getResultSet : function() {
    return this.mResultSet;
},
/**
* Gets the reference of resultset
*/
getQueryObject : function() {    
    return this.mResultSet.mQueryObject;
},
/**
* Loads Yaoo Bookmark Data which is received from the bookmark server.
* This function parses the content; extacts the information which needs to be
* searched, ie URL,TITLE and TAG - saves them to the bookmarks array 
* @param {DomNodes} bookmarkData 
*       The xml document of the bookmarks.xml
*
* @author  geldhose@yahoo-inc.com
* @date     14 - june - 2008
*/    
loadYahooBookmarkData : function(bookmarkdata) {    
    function addBookmarksToList(node, bookmarksData) {
        if(node.nodeType != node.ELEMENT_NODE || !node.getAttribute) {
            return;
        }            
        var type = node.getAttribute("type");
        if (type == "B") {
            var url = ytbUtils.encodeToUTF8(node.getAttribute("u"));                          
            var text = ytbUtils.encodeToUTF8(node.getAttribute("text"));   
            var tag = ytbUtils.encodeToUTF8(node.getAttribute("tags"));
            /* tag view may have duplicates */                
            for(var idx = 0; idx < bookmarksData.length;idx++) {                    
                if(bookmarksData[idx].mUrl == url ) {
                    return;
                }                    
            }    
            var obj = new BookmarkData(text,tag,url);             
            bookmarksData.push(obj);
        } else if( type == "F") {                
            for (idx = 0; idx < node.childNodes.length; idx++) {
                addBookmarksToList(node.childNodes[idx], bookmarksData);
            }
        } 
    }
    try {           
        this.mYaooBookmarkData = [];
        var node =  bookmarkdata.documentElement.childNodes[3].childNodes[1];            
        for (var idx = 0; idx < node.childNodes.length; idx++) {
            if(node.childNodes[idx].getAttribute && 
            node.childNodes[idx].getAttribute("type") == "F") {
                addBookmarksToList(node.childNodes[idx],this.mYaooBookmarkData);            
            }
        }
        //
    } catch(e) {
    }
},
/**
* Clears the Yahoo Bookmark data when the user signs out
*
* @author geldhose@yahoo-inc.com
* @date   7 - july - 2008
*
*/    
clearYahooBookmarkData : function() {
    this.mYaooBookmarkData = [];
},
/**
* Searching the bookmarks data; we try to search whether the search query is a 
* substring of any of the terms , we search in the TAG, URL and TITLE
*
* @return {nsIYahooResultSet} The list of matches for the particular search query
*
* @author geldhose@yahoo-inc.com
* @date 24 - july - 2008
*/
fetchBookmarks : function() {
    var rs = this.mResultSet;    
    var qry = rs.mQueryObject;        
    rs.addMetaData(rs.COL_TEXT);
    rs.addMetaData(rs.COL_URL);
    rs.addMetaData(rs.COL_DESC);
    rs.addMetaData("ysearchtype");
    var aTerm = qry.mQuery.toLowerCase();
    var count = 0;      
    var pq = new ytbUtils.PriorityQueue();
    try {
        var resultSetRelevance = 0;
        for (var idx = 0; idx < this.mYaooBookmarkData.length; idx++) {
            var bmData = this.mYaooBookmarkData[idx];
            var pri = ytbUtils.relevanceMatch(bmData.mPTitle,aTerm);
            if (bmData.mPUrl.indexOf(aTerm) !== -1) {
                pri += 1;
            }            
            if (bmData.mPDescription.indexOf(aTerm) > -1) {
                pri += 1;
            }            
            if (pri > 0 ) {   
                resultSetRelevance += pri;
                pq.addData(pri,idx);
                count ++;
            }              
            if (count > qry.mResultCount ) {
                if (resultSetRelevance / count > 10) {
                   // 
                    break;
                }
            }
        }
        for (idx = 0; idx < pq.mQueue.length && idx <  qry.mResultCount ; idx++) {
            bmData = this.mYaooBookmarkData[pq.mQueue[idx].mData];
            //       
            //            
            var row = rs.createRow();          
            row.addString(ytbUtils.encodeToUTF8(bmData.mTitle) );
            row.addString(bmData.mUrl);
            row.addString(bmData.mDescription);     
            row.addString("bookmark");
        }        
    } catch(e) {
    }                      
    return rs;
},   
/**
* function for adding a search suggestion to the suggestion cache
*
* @param {string} term
*       The term for which suggestions are fetched
* @param {nsIYahooResultSet} suggestions 
*       The list of suggestions for term
*          
*/
addSuggestion : function(term,suggestions) {                
    var data = this.mSuggestionCache.addData(term);        
    data.populateWithResultSet(suggestions);
},     
/**
* Query the suggestions for a term from the cache.Looks for an exact match of the query
*
* @return {nsIYahooResultSet} The suggestions cahed for the particular search query
* @author geldhose@yahoo-inc.com
* @date    14 - june - 2008
*/
fetchSuggestions : function() {   
    var rs = this.mResultSet;    
    var qry = rs.mQueryObject;        
    rs.addMetaData(rs.COL_TEXT);      
    rs.addMetaData("ysearchtype");
    var term = qry.mQuery;    
    var hashData =  this.mSuggestionCache.getData(term);     
    if (hashData) {        
        var values = hashData.mValues;
        for (var idx = 0; idx < values.length; idx++) {
            var row = rs.createRow();
            row.addString(values[idx][0])
            row.addString("suggestion");
        }
        rs.spliceResults(qry.mResultCount);
    } else {
        rs.mPopulatedType = qry.T_NONE;
    }
    return rs;
},     
/**
* Clear search history (function #39)
* 
* @author geldhose@yahoo-inc.com
* @date  14 - june - 2008
*/
clearSearchHistory : function() {
    this.mUserSearchHistory = [];
    this.saveSearchHistory();        
},
/**
* Add an item to the user search history (function #41)
*
* @param {string} history 
*       The history value
* 
* @author geldhose@yahoo-inc.com
* @date  14 - june - 2008
*/
addToSearchHistory : function(val) {        
    this.addToHistory(val);
    this.saveSearchHistory();
},  
fetchTBSuggestion : function() {
    var rs = this.mResultSet;        
    rs.addMetaData(rs.COL_TEXT);     
    rs.addMetaData("ysearchtype");
    var qry = rs.mQueryObject;
    var term = qry.mQuery;
    var count = qry.mResultCount ;
    var hashData =  this.mSuggestionCache.getData(term);     
    if (hashData) {        
        var suggest = [];   
        for (var idx = 0; idx <  hashData.mValues.length; idx++) {
            suggest.push(hashData.mValues[idx]);
        }
        var history = []        
        for (var idx = 0; idx < this.mUserSearchHistory.length && history.length < 10; idx++) {
            var hEntry = this.mUserSearchHistory[idx];
            var pos = hEntry.mTerm.toLowerCase().indexOf(term);
            if ( pos !== -1) {               
                history.push(hEntry.mTerm);
            }        
        }       
        for (idx = suggest.length; idx >= 0 ; idx-- ) {
            for (var idx2 =0; idx2 < history.length; idx2++) {
                if (history[idx2] == suggest[idx]){
                    suggest.splice(idx,1);
                    break;
                }
            }
        }
        var hTotalCount = history.length;
        var sTotalCount = suggest.length;
        if (hTotalCount > 6 && sTotalCount > 4) {
            sTotalCount = 4;
            hTotalCount = 6;
        } else if (hTotalCount <= 6 && sTotalCount >= 4) {            
            sTotalCount = 10 - hTotalCount;
        } else if (hTotalCount >= 6 && sTotalCount <= 4) {            
            hTotalCount = 10 - sTotalCount;
        }       
        var strTable = [];
        for ( idx =0 ; idx < sTotalCount; idx++) {
            strTable.push([suggest[idx],"suggestion"]);
        }
        for ( idx =0 ; idx < hTotalCount; idx++) {
            strTable.push([history[idx],"history"]);
        }        
        rs.populateWithStringTable(strTable);
        rs.spliceResults(qry.mResultCount);
    } else {
        rs.mPopulatedType = qry.T_NONE;
    }
    return rs;
}
,
/**
* function for searching the history values
*
* @return  {nsIYahooResultSet} the result of seaching in the history
*
* @author  geldhose@yahoo-inc.com
* @date    24 - july - 2008
*/
fetchHistory : function() {
    var rs = this.mResultSet;        
    rs.addMetaData(rs.COL_TEXT);
    rs.addMetaData("ysearchtype");
    rs.addMetaData(rs.COL_TIME_DIFF);   
    var qry = rs.mQueryObject;
    var term = qry.mQuery;
    var count = qry.mResultCount ; 
    var pq = new ytbUtils.PriorityQueue();
    for (var idx = 0; idx < this.mUserSearchHistory.length && pq.mQueue.length < count; idx++) {
        var hEntry = this.mUserSearchHistory[idx];
        var pos = hEntry.mTerm.toLowerCase().indexOf(term);
        if (qry.mSearchType == qry.SEARCH_PREFIX && pos === 0) {               
            pq.addData(1,idx);
        } else if (qry.mSearchType == qry.SEARCH_SUBSTR && pos !== -1) {               
            pq.addData(1,idx);
        } else if (qry.mSearchType == qry.SEARCH_WORD) {                           
            var pri = ytbUtils.relevanceMatch(hEntry.mTerm, term);
            if (pri > 0 ) {
                pq.addData(pri,idx);
            }
        }        
    }   
    for (idx = 0; idx < pq.mQueue.length; idx++) {
        hEntry = this.mUserSearchHistory[pq.mQueue[idx].mData];
        var row = rs.createRow();
        row.addString(hEntry.mTerm);
        row.addString("history");        
        row.addString(ytbUtils.getTimeDifference(hEntry.mTimeStamp));                               
    }
    return rs;
},
/**
* Loads the history from the xml file ; the file name is search history.xml
* this file is present in the cahce directory
*
* @author geldhose@yahoo-inc.com
* @date  14 - june - 2008
*/    
loadSearchHistory : function () {
    try{                        
        /* loading history from file */
        var file = this.mFileIO.getCacheFile("searchHistory.xml");        
        var xml = this.mFileIO.readFile(file);
        if (!xml || xml === "" ) {
            return;
        }
        var parser = CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);                   
        var history = parser.parseFromString(xml, "text/xml");        
        if (history.tagName === "parserError") {                    
            return;
        }
        history = history.firstChild;
        var queries = history.childNodes;                
        this.mUserSearchHistory = [];
        for(var idx = 0; idx < queries.length; idx++) {                
            var val = queries[idx].childNodes[0].data;
            var tm = 0; // new Date().getTime();
            var hc = 1;
            try {                    
                tm = parseInt(queries[idx].attributes[0].value,10);    
                hc = parseInt(queries[idx].attributes[1].value,10);                    
            } catch (e) {                    
            }                
            this.addToHistory(ytbUtils.encodeToUTF8(unescape(val) ),tm, hc);
        }                   
    } catch(ex) {
    }
},
/**
* Add search term to history xml file.
* The history list is sorted as FIFO
*
* @param {string} value
*       Search term to add
* @param {int} [timeStamp] 
*       The time at which the history was saved recently
* @param {int} [hitCount] 
*       The number of hits on the particular search term
* @author geldhose@yahoo-inc.com
* @date  14 - june - 2008
*/
addToHistory : function (value, tm, hitCount) {
    try {
        hitCount = hitCount || 1;
        if (value.search(/[^\s]/) < 0) {
            return;
        }        
        var history = null;        
        for (var idx = 0; idx < this.mUserSearchHistory.length; idx++) {
            if (this.mUserSearchHistory[idx].mTerm == value) {
                history = this.mUserSearchHistory[idx];
                this.mUserSearchHistory.splice(idx,1);
            }
        }
        if (!tm) {
            tm = new Date().getTime();
        }
        if (history === null) {
            history = new HistoryData(value,tm,hitCount);
        } else {
            history.mTimeStamp = tm;
            history.mHitCount++;
        }
        var len = this.mUserSearchHistory.unshift(history);
        if (len > this.mMaxHistory ) {
            this.mUserSearchHistory = this.mUserSearchHistory.slice(0, this.mMaxHistory);
        }        
    } catch(e) {
    }
} 
,
/**
* Saves the current history values which are avaialble in the history array to 
* searchhistory.xml file insode the cache directory
* 
* @author geldhose@yahoo-inc.com
* @date    14 - june - 2008
*/
saveSearchHistory : function() {
    try {        
        var xml = "<?xml version=\"1.0\" encoding=\"utf8\" ?><history>";        
        for (var idx = 0;idx < this.mUserSearchHistory.length ; idx++) {
            var obj = this.mUserSearchHistory[idx];
            xml += '<q t="'+obj.mTimeStamp+'" h="'+obj.mHitCount+'">'+ytbUtils.decodeFromUTF8(escape(obj.mTerm))+'</q>';
        }
        xml +="</history>";               
        this.mFileIO.writeCacheFile("searchHistory.xml", xml);        
    } catch(e) {
    }
}
,
/**
* Searched for the data in firefox user bookmarks. This function makes use of the Places API ,
* hence available only in FF3
*
* @return nsIYahooResultSet
* @author : geldhose@yahoo-inc.com
*/
fetchFirefoxBookmarks : function() {
    var rs = this.mResultSet;     
    if (ytbUtils.mFFVersion < 3) {
        return rs;
    }
    rs.addMetaData(rs.COL_TEXT);
    rs.addMetaData(rs.COL_URL);  
    rs.addMetaData("ysearchtype");
    var qry = rs.mQueryObject;    
    var count = qry.mResultCount; 
    try {    
        var historyService = CC["@mozilla.org/browser/nav-history-service;1"]
            .getService(CI.nsINavHistoryService);
        var options = historyService.getNewQueryOptions();                
        var query = historyService.getNewQuery();        
        query.searchTerms = qry.mQuery;
        options.queryType = options.QUERY_TYPE_BOOKMARKS;
        var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
            .getService(Components.interfaces.nsINavBookmarksService);
        var folders = [ bookmarksService.toolbarFolder];                    
        query.setFolders(folders, folders.length)
        var result = historyService.executeQuery(query, options);
        var container = result.root;
        container.containerOpen = true;        
        for (var idx = 0; idx< container.childCount && count-- > 0; idx++) {
            var child = container.getChild(idx);            
            var row = rs.createRow();
            row.addString(child.title);        
            row.addString(child.uri);        
            row.addString("bookmark");
        }
        container.containerOpen = false;
        container = null;
        query = null;
        historyService = null;
    } catch (e) {
    }
    return rs;
 },
/**
* Searches the firefox history data for providing a direct navigation link. We are making use of the places API
* this function wont work in versions less than FF3.
* @return nsIYahooResultSet
* @author : geldhose@yahoo-inc.com
*/
fetchFirefoxHistoryData : function() {
    var rs = this.mResultSet;     
    if (ytbUtils.mFFVersion < 3) {
        return rs;
    }
    rs.addMetaData(rs.COL_TEXT);
    rs.addMetaData(rs.COL_URL);  
    rs.addMetaData("ysearchtype");
    var qry = rs.mQueryObject;    
    var count = qry.mResultCount; 
    try {    
        var historyService = CC["@mozilla.org/browser/nav-history-service;1"]
            .getService(CI.nsINavHistoryService);
        var options = historyService.getNewQueryOptions();                
        var query = historyService.getNewQuery();        
        query.searchTerms = qry.mQuery;    
        var result = historyService.executeQuery(query, options);
        var container = result.root;
        container.containerOpen = true;        
        for (var idx = 0; idx< container.childCount && count-- > 0; idx++) {
            var child = container.getChild(idx);            
            var row = rs.createRow();
            row.addString(child.title);        
            row.addString(child.uri);        
            row.addString("bookmark");
        }
        container.containerOpen = false;
        container = null;
        query = null;
        historyService = null;
    } catch (e) {
    }
    return rs;
},
/**
* Searches for the given text in the user buttons labels. populates the result set if a match is found
* we parse the the dom toolbar node created by nsIYahooDomBuilder. this function iterated through the tree
* and when it finds matches that satisfies the count we return. Iterating through a tree is a costly operation
* 
* @return nsIYahooResultSet
* @author : geldhose@yahoo-inc.com
*/
fetchToolbarButtonData : function() {
    var rs = this.mResultSet;        
    rs.addMetaData(rs.COL_TEXT);
    rs.addMetaData(rs.COL_URL);  
    rs.addMetaData("ysearchtype");
    var qry = rs.mQueryObject;
    var term = qry.mQuery;
    var count = qry.mResultCount; 
    try {
        var processor = Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);
        var dom = processor.domBuilder;
        function populateResultSet(dom)  {
            var node = dom;
            while (node && count > 0) {                
                if (typeof node.getAttribute === "function") {
                    var text = node.getAttribute("label");
                    var url = node.getAttribute("yurl");
                    if (url && url !== "" &&  ytbUtils.relevanceMatch(text,term) > 0) {                        
                        count--;
                        var row = rs.createRow();
                        row.addString(text);
                        row.addString(url.substr(1));
                        row.addString("bookmark");
                    }                    
                }
                if (node.firstChild) {
                    populateResultSet(node.firstChild);
                }
                node = node.nextSibling;
            }
        }
        populateResultSet(dom.toolbar);
    } catch (e) {
    }
    return rs;    
}
,
/**
* Clear the instant webresults cache. This is required when you chagne the search provider
*/
clearInstantWebResults  : function() {
    this.mInstantWebResultCache.clearData();
},
/**
* function for adding a search suggestion to the suggestion cache
*
* @param {string} term
*       The term for which suggestions are fetched
* @param {nsIYahooResultSet} iwr 
*       The table of strnig which represents the instant web results for a key term
*          
*/
addInstantWebResults : function(term,iwr) {        
    var data = this.mInstantWebResultCache.addData(term);        
    data.populateWithResultSet(iwr);
},     
/**
* Query the suggestions for a term from the cache.Looks for an exact match of the query
*
* @return {nsIYahooResultSet} The suggestions cahed for the particular search query
* @author geldhose@yahoo-inc.com
* @date    14 - june - 2008
*/
fetchInstantWebResults : function() {   
    var rs = this.mResultSet;    
    var qry = rs.mQueryObject;        
    rs.addMetaData(rs.COL_TEXT);      
    rs.addMetaData(rs.COL_DESC);      
    rs.addMetaData(rs.COL_URL);
    rs.addMetaData("ysearchtype");    
    var term = qry.mQuery;    
    var hashData =  this.mInstantWebResultCache.getData(term);     
    if (hashData) {
        var values = hashData.mValues;
        for (var idx = 0 ; idx < values.length; idx++) {
            var row = rs.createRow();
            row.addString(values[idx][0]);
            row.addString(values[idx][1]);
            row.addString(values[idx][2]);
            row.addString("bookmark");       
        }       
        rs.spliceResults(qry.mResultCount);        
    } else {
        rs.mPopulatedType = qry.T_NONE;        
    }
    return rs;
},   
/**
* Query for a particular type of data of data
@param nsIYahooSearchQuery qry The search query object
@return nsIYahooResultSet     
*/
getQueryResult : function(qry) {
    var rs  = this.mResultSet;
    rs.clearRows();    
    rs.mQueryObject = qry;
    rs.mPopulatedType = qry.mQueryType;
    switch (qry.mQueryType) {
        case qry.T_SUGGESTION :
            return this.fetchSuggestions();         
        case qry.T_HISTORY :
            return this.fetchHistory();   
        case qry.T_HISTORY + qry.T_SUGGESTION :
            return this.fetchTBSuggestion();
        case qry.T_YAHOO_BOOKMARKS:
            return this.fetchBookmarks();    
        case qry.T_FIREFOX_BOOKMARKS:  
            return this.fetchFirefoxBookmarks();            
        case qry.T_FIREFOX_USER_HISTORY:                
            return this.fetchFirefoxHistoryData();  
        case qry.T_PERSONALIZED_LINKS:               
            break;
        case qry.T_INSTANT_WEB_RESULTS:                 
            return this.fetchInstantWebResults();           
        case qry.T_YAHOO_BUTTON_DATA:
            return this.fetchToolbarButtonData();                
        default :                
            break;
    }    
   rs.clearRows();    
   return rs;
},
QueryInterface : function (iid) {
    if(!iid.equals(CI.nsIYahooSearchIndexer) && !iid.equals(CI.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
}
};
/** 
* DO NOT CHANGE THIS OBJECT 
* @private
*/
function debug(message,level) {
    var console = yahooCC["@mozilla.org/consoleservice;1"].getService(yahooCI.nsIConsoleService);         
   var d = new Date();
   var time = "Module :"+d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds();
   console.logStringMessage(time + ": " + message);   
}
var Module = {                        
    mObjects :[] ,        
    mFirstTime: true,
    registerSelf : function (compMgr, fileSpec, location, type) {  
        if (this.mFirstTime) {
            this.mFirstTime = false;
            throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
        }
        compMgr = compMgr.QueryInterface(CI.nsIComponentRegistrar);
        debug("Registring :"+this.mObjects.length);            
        for (var idx = 0; idx < this.mObjects.length; idx++) {
            var obj = this.mObjects[idx];              
            debug(obj.mCID + obj.mName+ obj.mProgID);
            compMgr.registerFactoryLocation(obj.mCID, obj.mName, obj.mProgID, fileSpec, location, type);
        }            
        debug("Done with registering.. ");
    },
    getClassObject : function (compMgr, cid, iid) {       
        try {
        debug("Gets class object");
            if (!iid.equals(CI.nsIFactory) ) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED; 
            }       
            for (var idx =  0; idx < this.mObjects.length; idx++) {    
                if (cid.equals(this.mObjects[idx].mCID)) {       
                   debug(this.mObjects[idx]);
                   return this.mObjects[idx].mFactory;            
                }            
            } 
            throw Components.results.NS_ERROR_NO_INTERFACE;
        } catch (e) {
            debug(e);
            throw e;
        }
    },        
    canUnload : function(compMgr) { return true; }
};
function NSGetModule(compMgr, fileSpec) {
    var programId = YahooExtConfig.mProgID;
        Module.mObjects.push( {
            mCID  : Components.ID("{78408edc-2f7a-4c8c-b1fe-4b9131197f6d}"),      
            mProgID : programId+"/search/indexer;1",
            mName : "Yahoo ! Search Indexer",
            mFactory : {    
                createInstance : function (outer, iid) {
                    if (outer !== null) {
                        throw Components.results.NS_ERROR_NO_AGGREGATION;
                    }                          
                    return new YahooSearchIndexer().QueryInterface(iid);
                }
            }
        });
        Module.mObjects.push( {
            mCID : Components.ID("{3a03b46a-8521-4737-b3ff-0531fc12285d}"),
            mProgID : programId+"/search/resultset;1",
            mName : "Yahoo ! Search Resultset",
            mFactory : {
                createInstance : function(outer, iid) {
                    if (outer !== null) {
                        throw Components.results.NS_ERROR_NO_AGGREGATION;
                    }                      
                    return new YahooResultSet().QueryInterface(iid);
                }
            }
        });
        Module.mObjects.push( {
            mCID : Components.ID("{865baf98-64bf-4b6e-8237-31cc2e18e202}"),
            mProgID : programId+"/search/query;1",
            mName : "Yahoo ! Search Query",
            mFactory : {
                createInstance : function(outer, iid) {
                    if (outer !== null) {
                        throw Components.results.NS_ERROR_NO_AGGREGATION;
                    }  
                    return new YahooSearchQuery().QueryInterface(iid);
                }
            }
        });
        Module.mObjects.push( {
            mCID : Components.ID("{455b51ae-29af-4019-a313-bfbde9b1c5b7}"),
            mProgID : programId+"/search/stringenumerator;1",
            mName : "Yahoo ! String enumerator",
            mFactory : {
                createInstance : function(outer, iid) {
                    if (outer !== null) {
                        throw Components.results.NS_ERROR_NO_AGGREGATION;
                    }  
                    return new YahooStringEnumerator().QueryInterface(iid);
                }
            }
        });
    return Module;
}
