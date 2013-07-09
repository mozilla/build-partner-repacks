
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);try{var gConfigFilePath="file://"+__LOCATION__.parent.path+"/extconfig.js";loader.loadSubScript(gConfigFilePath);loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/utils.js");loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/logger.js");}catch(e){}
function ExposedObject(extra){this.canCreateWrapper=function canCreateWrapper(aIID){return"allAccess";}
this.canCallMethod=function canCallMethod(aIID,methodName){return"allAccess";}
this.canGetProperty=function canGetProperty(aIID,propertyName){return"allAccess";}
this.canSetProperty=function canSetProperty(aIID,propertyName){return"allAccess";}
this.mInterfaces=[CI.nsISupports,CI.nsISecurityCheckedComponent];this.QueryInterface=function(iid){for(var idx=0;idx<this.mInterfaces.length;idx++){if(iid.equals(this.mInterfaces[idx])){return this;}}
return null;}}
function YahooSearchQuery(){this.resetQuery();}
YahooSearchQuery.prototype={T_NONE:0x00,T_SUGGESTION:0x01,T_HISTORY:0x02,T_YAHOO_BOOKMARKS:0x04,T_FIREFOX_BOOKMARKS:0x8,T_PERSONALIZED_LINKS:0x10,T_INSTANT_WEB_RESULTS:0x20,T_FIREFOX_USER_HISTORY:0x40,T_YAHOO_BUTTON_DATA:0x80,T_VERTICAL_SEARCH:0x100,T_VERTICAL_SEARCH_ALL:0x200,T_DATA_CLASS:0x10000-1,T_YTB:0x10000,T_INQ:0x20000,SEARCH_SUBSTR:0x01,SEARCH_PREFIX:0x02,SEARCH_WORDS:0x03,mQueryType:0x01,mSearchType:0x01,mResultCount:128,mQuery:"",resetQuery:function(){this.mSearchType=this.SEARCH_SUBSTR;this.mQueryType=this.T_SUGGESTION;this.mResultCount=128;this.mQuery="";},getQueryType:function(){var type="user";switch(this.mQueryType&this.T_DATA_CLASS){case this.T_SUGGESTION:type="suggestion";break;case this.T_HISTORY:type="history";break;case this.T_YAHOO_BOOKMARKS:type="bookmark";break;case this.T_FIREFOX_BOOKMARKS:type="bookmark";break;case this.T_PERSONALIZED_LINKS:type="bookmark";break;case this.T_INSTANT_WEB_RESULTS:type="bookmark";break;case this.T_FIREFOX_USER_HISTORY:type="bookmark";break;case this.T_YAHOO_BUTTON_DATA:type="bookmark";break;default:type="user";break;}
return type;},classID:Components.ID("{2ff2dde3-f36b-418d-90d3-85f89c65ace4}"),contractID:"@yahoo.com/search/query;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooSearchQueryV2])};function YahooStringEnumerator(){this.mValues=[];this.mIdx=0;ExposedObject.call(this);this.mInterfaces.push(CI.nsIYahooStringEnumerator);}
YahooStringEnumerator.prototype={initialize:function(){this.mIdx=0;return this;},clearData:function(){this.mValues=[];this.mIdx=0;},getNext:function(){return this.mValues[this.mIdx++];},hasMoreElements:function(){return this.mIdx<this.mValues.length;},addString:function(str){this.mValues.push(str);},addStringArray:function(lst){for(var idx=0;idx<lst.length;idx++){this.mValues.push(lst[idx]);}},clone:function(){var ret=new YahooStringEnumerator();ret.mValues=this.mValues.slice();return ret;},classID:Components.ID("{c9e4a883-f6b2-4166-89be-77667bc4b1aa}"),contractID:"@yahoo.com/search/stringenumerator;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooStringEnumerator])};function YahooResultSet(){this.mValues=[];this.mRowIdx=0;this.mPopulatedType=0;this.mMetaData=new YahooStringEnumerator();this.mQueryObject=null;ExposedObject.call(this);this.mInterfaces.push(CI.nsIYahooResultSetV2);}
YahooResultSet.prototype={COL_TEXT:"TEXT",COL_URL:"URL",COL_DESC:"DESCRIPTION",COL_TIME_DIFF:"TIME_DIFF",COL_HIT_COUNT:"HIT_COUNT",COL_KEY:"KEY",COL_HIDDEN_URL:"HIDDEN_URL",addMetaData:function(name){this.mMetaData.addString(name);},getMetaData:function(){return this.mMetaData;},clearRows:function(){this.mValues=[];this.mRowIdx=0;this.mMetaData.clearData();this.mPopulatedType=0;},createRow:function(){var row=new YahooStringEnumerator();this.mValues.push(row);return row;},getNextRow:function(){return this.mValues[this.mRowIdx++];},hasMoreRows:function(){return this.mRowIdx<this.mValues.length;},getRowCount:function(){return this.mValues.length;},spliceResults:function(len){this.mValues.splice(len);},clone:function(){var ret=new YahooResultSet();for(var idx=0;idx<this.mValues.length;idx++){ret.mValues.push(this.mValues[idx].clone());}
return ret;},populateWithStringTable:function(tab){for(var idx=0;idx<tab.length;idx++){this.createRow().addStringArray(tab[idx]);}},initialize:function(){this.mRowIdx=0;for(var idx=0;idx<this.mValues.length;idx++){this.mValues[idx].initialize();}},classID:Components.ID("{a0dcea21-fc20-4cdd-a711-cf192fd56052}"),contractID:"@yahoo.com/search/resultset;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooResultSetV2])};function HashData(key){this.mKey=key;this.mValues=[];}
HashData.prototype={populateWithResultSet:function(rs){this.mValues=[];while(rs.hasMoreRows()){var data=[];var si=rs.getNextRow();while(si.hasMoreElements()){data.push(si.getNext());}
this.mValues.push(data);}}};function BinarySearchHash(){this.maxHeight=20;var _mDataStore=[];var _mComparisons=0;function _find(key,min,max){if(_mComparisons++>this.maxHeight){return null;}
if(min<0||max>=_mDataStore.length){return null;}
var pos=Math.floor((max+min)/2);var dsKey=_mDataStore[pos].mKey;if(dsKey==key){return _mDataStore[pos];}else if(min!=max){if(key<dsKey){return _find(key,min,pos);}else{return _find(key,pos+1,max);}}
return null;}
function _insert(key,min,max){if(_mComparisons++>this.mMaxHeight){return;}
if(min!=max){var pos=Math.floor((max+min)/2);var data=_mDataStore[pos];var dsKey=data.mKey;if(key==dsKey){return _mDataStore[pos];}else if(key<dsKey){return _insert(key,min,pos);}else{return _insert(key,pos+1,max);}}else{var data=new HashData(key);_mDataStore.splice(min,0,data);return data;}}
this.getData=function(key){_mComparisons=0;if(_mDataStore.length===0){return null;}
return _find(key,0,_mDataStore.length-1);};this.addData=function(key){_mComparisons=0;return _insert(key,0,_mDataStore.length);};this.clearData=function(){_mDataStore=[];this.mDataStore=[];};this.mDataStore=_mDataStore;}
function BinaryStrSearchHash(){BinarySearchHash.call(this);var _mDataStore=this.mDataStore;var _mComparisons=0;function _findPrefixPos(key,min,max){if(_mComparisons++>this.maxHeight){return;}
if(min<0||max>=_mDataStore.length){return-1;}
var pos=Math.floor((max+min)/2);var dsKey=_mDataStore[pos].mKey;if(dsKey.indexOf(key)===0){return pos;}else if(min!=max){if(key<dsKey){return _findPrefixPos(key,min,pos);}else{return _findPrefixPos(key,pos+1,max);}}
return-1;}
this.searchData=function(key){var matches=[];if(_mDataStore.length===0){return matches;}
_mComparisons=0;var prefixMatchPos=_findPrefixPos(key,0,_mDataStore.length-1);var backwardLookup=prefixMatchPos;var forwardLookup=prefixMatchPos+1;var matches=[];while(backwardLookup>=0&&_mDataStore[backwardLookup].mKey.indexOf(key)===0){matches.push(_mDataStore[backwardLookup]);backwardLookup--;}
while(forwardLookup<_mDataStore.length&&_mDataStore[forwardLookup].mKey.indexOf(key)===0){matches.push(_mDataStore[forwardLookup]);forwardLookup++;}
return matches;};this.getValues=function(keys){var prevHash=null;var matchHash=new BinarySearchHash();for(var idx=0;idx<keys.length;idx++){var matches=this.searchData(keys[idx]);matchHash=new BinarySearchHash();for(var mIdx=0;mIdx<matches.length;mIdx++){var match=matches[mIdx];for(var vIdx=0;vIdx<match.mValues.length;vIdx++){var val=match.mValues[vIdx];if(prevHash){if(prevHash.getData(val)){matchHash.addData(val);}}else{matchHash.addData(val);}}}
prevHash=matchHash;}
return matchHash.mDataStore;};this.clearData=function(){_mDataStore=[];this.mDataStore=[];};}
function HistoryData(term,timeStamp,hitCount){timeStamp=timeStamp||0;hitCount=hitCount||1;this.mTerm=term;this.mTimeStamp=timeStamp;this.mHitCount=hitCount;}
var SearchWeightConfig={mQueryTermWeight:30,mTitleWordWeight:20,mUrlWordWeight:30,mPerWordDecrement:3,mTodayWeight:50,mPerVisitWeight:20,mPerDayDecrement:5,loadPreference:function(xml){var xmlMap={queryTermWeight:"mQueryTermWeight",titleWordWeight:"mTitleWordWeight",urlWordWeight:"mUrlWordWeight",perWordDecrement:"mPerWordDecrement",perVisitWeight:"mPerVisitWeight",todayWeight:"mTodayWeight",perDayDecrement:"mPerDayDecrement"};try{var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var config=parser.parseFromString(xml,"text/xml");if(config.tagName==="parserError"){yahooToolbarDebug("Error in parsing search_settings.xml");return;}
config=config.firstChild.firstChild;var settings=config.childNodes;for(var idx=0;idx<settings.length;idx++){try{var name=xmlMap[settings[idx].attributes["name"].value];if(!name){continue;}
var val=parseInt(settings[idx].attributes["value"].value,10);this[name]=val;}catch(e){}}
yahooToolbarDebug("Search weights loded from config file");}catch(ex){yahooToolbarDebug(ex);}}};function VerticalData(engine,url,akey,bEnabled){this.mEngine=engine;this.mUrl=url;this.mKey=akey;this.mEnabled=bEnabled;}
function InstantData(term,title,url,desc,timeStamp,hitCount){timeStamp=timeStamp||0;hitCount=hitCount||1;this.mTerm=term+";";this.mTitle=title;this.mUrl=url;this.mDescription=desc;this.mTimeStamp=timeStamp;this.mHitCount=hitCount;}
InstantData.prototype={getWeight:function(term){var weight=0;var milliSecPerDay=24*60*60*1000;var t=new Date().getTime();var timeDiff=t-this.mTimeStamp;if(timeDiff<milliSecPerDay){weight+=SearchWeightConfig.mTodayWeight;}else if(timeDiff>(milliSecPerDay*21)){weight=0;return weight;}else{weight-=(Math.floor((timeDiff/milliSecPerDay))*SearchWeightConfig.mPerDayDecrement);}
if(this.mTerm.toLowerCase().indexOf(term)!=-1){weight+=SearchWeightConfig.mQueryTermWeight;}
if(this.mTitle.toLowerCase().indexOf(term)!=-1){weight+=SearchWeightConfig.mTitleWordWeight;var tokens=yahooUtils.tokenizeText(this.mTitle);for(var idx=0;idx<tokens.length&&tokens[idx].toLowerCase()!=term;idx++){weight-=SearchWeightConfig.mPerWordDecrement;}}
if(this.mUrl.toLowerCase().indexOf(term)!=-1){weight+=SearchWeightConfig.mUrlWordWeight;var tokens=yahooUtils.tokenizeUrl(this.mUrl);for(var idx=0;idx<tokens.length&&tokens[idx].toLowerCase()!=term;idx++){weight-=SearchWeightConfig.mPerWordDecrement;}}
weight+=SearchWeightConfig.mPerVisitWeight*this.mHitCount;return weight;}};function BookmarkData(title,desc,url){this.mTitle=title;this.mPTitle=title.toLowerCase();this.mDescription=desc;this.mPDescription=desc.toLowerCase();this.mUrl=url;this.mPUrl=yahooUtils.removeStopWords(url);}
function SimpleHash(){this.mDataStore=[];this.mMaxSize=20;}
SimpleHash.prototype={addData:function(key){var data=new HashData(key.toLowerCase());var len=this.mDataStore.unshift(data);if(len>this.mMaxSize){this.mDataStore=this.mDataStore.slice(0,this.mMaxSize);}
return data;},getData:function(key){for(var idx=0;idx<this.mDataStore.length;idx++){if(this.mDataStore[idx].mKey==key){var hashData=this.mDataStore[idx];this.mDataStore.splice(idx,1);return hashData;}}
return null;},clearData:function(){this.mDataStore=[];}};function YahooSearchIndexer(){this.mFileIO=CC[YahooExtConfig.mProgID+"/fileio;1"].getService(CI.nsIYahooFileIO2);try{var fileIO=this.mFileIO;var xml=fileIO.readChromeContentFile("search_settings.xml");SearchWeightConfig.loadPreference(xml);}catch(e){}
this.mResultSet=new YahooResultSet();this.mResultSet.mQueryObject=new YahooSearchQuery();this.hitnavUrl=false;this.hitInq=false;this.hitInqPop=false;this.firstinstall=false;this.overinstall=false;this.searchTerm="";this.mSuggestionCache=new SimpleHash();this.mInstantWebResultCache=new SimpleHash();this.mPNLDataHash=new BinaryStrSearchHash();this.loadSearchHistory();this.loadInstantHistory();}
YahooSearchIndexer.prototype={mYaooBookmarkData:[],mUserSearchHistory:[],mUserInstantHistory:[],mUserVerticalSearch:[],mMaxHistory:500,getResultSet:function(){return this.mResultSet;},getQueryObject:function(){return this.mResultSet.mQueryObject;},loadYahooBookmarkData:function(bookmarkdata){yahooToolbarDebug("**** Adding yahoo bookmark data .. ");function addBookmarksToList(node,bookmarksData){if(node.nodeType!=node.ELEMENT_NODE||!node.getAttribute){return;}
var type=node.getAttribute("type");if(type=="B"){var url=yahooUtils.encodeToUTF8(node.getAttribute("u"));var text=yahooUtils.encodeToUTF8(node.getAttribute("text"));var tag=yahooUtils.encodeToUTF8(node.getAttribute("tags"));for(var idx=0;idx<bookmarksData.length;idx++){if(bookmarksData[idx].mUrl==url){return;}}
var obj=new BookmarkData(text,tag,url);bookmarksData.push(obj);}else if(type=="F"){for(idx=0;idx<node.childNodes.length;idx++){addBookmarksToList(node.childNodes[idx],bookmarksData);}}}
try{this.mYaooBookmarkData=[];var node=bookmarkdata.documentElement.childNodes[3].childNodes[1];for(var idx=0;idx<node.childNodes.length;idx++){if(node.childNodes[idx].getAttribute&&node.childNodes[idx].getAttribute("type")=="F"){addBookmarksToList(node.childNodes[idx],this.mYaooBookmarkData);}}}catch(e){yahooToolbarDebug(e);}},clearYahooBookmarkData:function(){this.mYaooBookmarkData=[];},fetchBookmarks:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_URL);rs.addMetaData(rs.COL_DESC);rs.addMetaData("ysearchtype");rs.mPopulatedType=qry.T_YAHOO_BOOKMARKS;var aTerm=qry.mQuery.toLowerCase();var count=qry.mResultCount;try{for(var idx=0;idx<this.mYaooBookmarkData.length&&count>0;idx++){if(this.mYaooBookmarkData[idx].mPUrl.indexOf(aTerm)>-1||yahooUtils.wordMatch(this.mYaooBookmarkData[idx].mPTitle,aTerm)||this.mYaooBookmarkData[idx].mPDescription.indexOf(aTerm)>-1){var row=rs.createRow();row.addString(this.mYaooBookmarkData[idx].mTitle);row.addString(this.mYaooBookmarkData[idx].mUrl);if(this.mYaooBookmarkData[idx].mDescription!=""){row.addString(this.mYaooBookmarkData[idx].mDescription);}else{row.addString("No Description");}
row.addString("bookmark");count--;}}}catch(e){yahooToolbarDebug(e);}
return rs;},addSuggestion:function(term,suggestions){var data=this.mSuggestionCache.addData(term);data.populateWithResultSet(suggestions);},fetchSuggestions:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData("ysearchtype");var term=qry.mQuery;var hashData=this.mSuggestionCache.getData(term);if(hashData){rs.mPopulatedType=qry.T_SUGGESTION;var values=hashData.mValues;for(var idx=0;idx<values.length;idx++){var row=rs.createRow();row.addString(values[idx][0])
row.addString("suggestion");}
rs.spliceResults(qry.mResultCount);}else{rs.mPopulatedType=qry.T_NONE;}
return rs;},clearSuggestions:function(){this.mSuggestionCache.clearData();},fetchInqHistorySuggestions:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData("ysearchtype");rs.addMetaData(rs.COL_TIME_DIFF);var count=qry.mResultCount;var term=qry.mQuery;var tmpStrTable=[];var tmpArray=[];if((qry.mQueryType&qry.T_HISTORY)!=0){rs.mPopulatedType+=qry.T_HISTORY;for(var idx=0;idx<this.mUserSearchHistory.length;idx++){var hEntry=this.mUserSearchHistory[idx];var pos=hEntry.mTerm.toLowerCase().indexOf(term);if(qry.mSearchType==qry.SEARCH_PREFIX&&pos!==0){continue;}
if(qry.mSearchType==qry.SEARCH_SUBSTR&&pos===-1){continue;}
tmpArray=[];tmpArray.push(hEntry.mTerm);tmpArray.push("history");tmpArray.push(yahooUtils.getTimeDifference(hEntry.mTimeStamp));tmpStrTable.push(tmpArray);if(tmpStrTable.length==2){break;}}}
if((qry.mQueryType&qry.T_SUGGESTION)!=0){var hashData=this.mSuggestionCache.getData(term);if(hashData){rs.mPopulatedType+=qry.T_SUGGESTION;for(var idx=0;idx<hashData.mValues.length;idx++){var sugg=hashData.mValues[idx][0];var presentInHistory=false;for(var i=0;!presentInHistory&&(qry.mQueryType&qry.T_HISTORY)!=0&&i<tmpStrTable.length;i++){if(sugg.toLowerCase()==tmpStrTable[i][0].toLowerCase()){presentInHistory=true;}}
if(presentInHistory!==true){tmpArray=[];tmpArray.push(sugg);tmpArray.push("suggestion");tmpStrTable.push(tmpArray);}}}else{rs.mPopulatedType=qry.T_NONE;}}
if(rs.mPopulatedType!==qry.T_NONE){rs.mPopulatedType+=qry.T_INQ;}
rs.populateWithStringTable(tmpStrTable);rs.spliceResults(count);return rs;},clearSearchHistory:function(){yahooToolbarDebug("Clearing search history");this.mUserSearchHistory=[];this.saveSearchHistory();},clearNavigationHistory:function(){this.mPNLDataHash=new BinaryStrSearchHash();this.mUserInstantHistory=[];this.saveInstantHistory();},addToSearchHistory:function(val){this.addToHistory(val);this.saveSearchHistory();},addToInstantHistory:function(term,title,url,desc){this.addInstantHistory(term,title,url,desc);this.saveInstantHistory();},fetchHistory:function(){var rs=this.mResultSet;rs.addMetaData(rs.COL_HIT_COUNT);rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_TIME_DIFF);var qry=rs.mQueryObject;rs.mPopulatedType=qry.T_HISTORY;var term=qry.mQuery;var count=qry.mResultCount;for(var idx=0;idx<this.mUserSearchHistory.length&&count>0;idx++){var hEntry=this.mUserSearchHistory[idx];var pos=hEntry.mTerm.toLowerCase().indexOf(term);if(qry.mSearchType==qry.SEARCH_PREFIX&&pos!==0){continue;}
if(qry.mSearchType==qry.SEARCH_SUBSTR&&pos===-1){continue;}
var row=rs.createRow();row.addString(hEntry.mHitCount);row.addString(hEntry.mTerm);row.addString(hEntry.mTimeStamp);count--;}
return rs;},fetchVerticalSearch:function(bFetchAll){var rs=this.mResultSet;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_HIDDEN_URL);if(bFetchAll)
rs.addMetaData(rs.COL_TEXT);else
rs.addMetaData("ysearchtype");rs.addMetaData(rs.COL_KEY);var qry=rs.mQueryObject;rs.mPopulatedType=(bFetchAll===false?qry.T_VERTICAL_SEARCH:qry.T_VERTICAL_SEARCH_ALL);for(var idx=0;idx<this.mUserVerticalSearch.length;idx++){if(bFetchAll===false&&this.mUserVerticalSearch[idx].mEnabled===false)
continue;var hEntry=this.mUserVerticalSearch[idx];var row=rs.createRow();row.addString(hEntry.mEngine);row.addString(hEntry.mUrl);if(bFetchAll)
row.addString(hEntry.mEnabled);else
row.addString("verticalsearch");row.addString(hEntry.mKey);}
return rs;},fetchPersonalizedNavLink:function(){var rs=this.mResultSet;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_DESC);rs.addMetaData(rs.COL_URL);rs.addMetaData(rs.COL_TIME_DIFF);rs.addMetaData(rs.COL_HIT_COUNT);rs.addMetaData("ysearchtype");var qry=rs.mQueryObject;rs.mPopulatedType=qry.T_PERSONALIZED_LINKS;var term=qry.mQuery;var count=qry.mResultCount;var priorityQueue=this.getPNLData(term);if(priorityQueue){var pos=priorityQueue.mDataStore.length-1;while(pos>=0){var hEntry=this.mUserInstantHistory[priorityQueue.mDataStore[pos].mValues[0]];if(hEntry.mTerm.indexOf(term)>=0){var row=rs.createRow();row.addString(hEntry.mTitle);row.addString(hEntry.mDescription);row.addString(hEntry.mUrl);row.addString(hEntry.mTimeStamp);row.addString(hEntry.mHitCount);}else{break;}
pos--;}}
return rs;},loadSearchHistory:function(){try{var xml=this.mFileIO.readEncodedCacheFile("searchHistory.xml");if(!xml||xml===""){yahooToolbarDebug("Search history file empty not found");return;}
var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var history=parser.parseFromString(xml,"text/xml");if(history.tagName==="parserError"){return;}
yahooToolbarDebug("Loading history"+xml);history=history.firstChild;var queries=history.childNodes;this.mUserSearchHistory=[];for(var idx=0;idx<queries.length;idx++){var val=queries[idx].childNodes[0].data;var tm=0;var hc=1;try{tm=parseInt(queries[idx].attributes[0].value,10);hc=parseInt(queries[idx].attributes[1].value,10);}catch(e){}
this.addToHistory(yahooUtils.encodeToUTF8(val),tm,hc);}}catch(ex){yahooToolbarDebug(ex);}},loadInstantHistory:function(){try{yahooToolbarDebug("loading from instant history file");var xml=this.mFileIO.readEncodedCacheFile("InstantHistory.xml");if(!xml||xml===""){yahooToolbarDebug("Instant history file empty not found");return;}
var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var history=parser.parseFromString(xml,"text/xml");if(history.tagName==="parserError"){return;}
history=history.firstChild;var queries=history.childNodes;this.mUserInstantHistory=[];var timeDiff21Days=21*24*60*60*1000;var nowTime=new Date().getTime();for(var idx=0;idx<queries.length;idx++){var tit="";var url="";var tm=0;var hc=1;var desc="";var term="";try{url=unescape(queries[idx].attributes["url"].value);tit=unescape(queries[idx].attributes["title"].value);term=unescape(queries[idx].attributes["term"].value);desc=unescape(queries[idx].attributes["desc"].value);tm=parseInt(queries[idx].attributes["t"].value,10);hc=parseInt(queries[idx].attributes["h"].value,10);if(nowTime-tm>timeDiff21Days){continue;}}catch(e){}
this.addInstantHistory(term,tit,url,desc,tm,hc);}}catch(ex){yahooToolbarDebug(ex);}},loadVerticalSearch:function(){try{var yahooLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var numVert=0,vertName,vertUrl,vertKey,name,url,key;if(yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash")&&yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object["numVerticals"]){numVert=yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object["numVerticals"];}
var defaultXml="<?xml version=\"1.0\"?><verticals>";if(numVert>0)
{for(var i=1;i<=numVert;i++)
{vertName="Vname"+i;vertUrl="Vurl"+i;vertKey="Vkey"+i;if(yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertName]&&yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertUrl]&&yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertKey])
{name=yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertName];url=yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertUrl];key=yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object[vertKey];defaultXml+="<vertical name=\""+name+"\" queryUrl=\""+url+"=&lt;TERM&gt;\" shortcut=\""+key+"\" enabled=\"true\" ></vertical>";}}}
defaultXml+="</verticals>";var xml=this.mFileIO.readEncodedCacheFile("userverticals.xml");var errorFlag=false;if(xml===""){xml=defaultXml;errorFlag=true;yahooToolbarDebug("*** Empty vertical search engine file",10);}
var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);yahooToolbarDebug(xml);var dom=parser.parseFromString(xml,"text/xml");if(dom.tagName==="parserError"){xml=defaultXml;errorFlag=true;dom=parser.parseFromString(xml,"text/xml");yahooToolbarDebug("*** Error in vertical search engine file",10);}
if(errorFlag){this.mFileIO.writeEncodedCacheFile("userverticals.xml",xml)}
this.mUserVerticalSearch=[];var node=dom.firstChild.firstChild;var name=null,url=null,key=null,enabled=false;while(node){name=unescape(node.attributes["name"].value);url=unescape(node.attributes["queryUrl"].value);enabled=node.attributes["enabled"].value=="true"?true:false;key=node.attributes["shortcut"].value;if(key=="undefined")
key="";this.addVerticalSearch(name,url,key,enabled);node=node.nextSibling;}}
catch(e){yahooToolbarDebug(e);}},addVerticalSearch:function(engine,url,akey,bEnabled){try{var vert=new VerticalData(engine,url,akey,bEnabled);var len=this.mUserVerticalSearch.push(vert);}catch(e){yahooToolbarDebug(e);}},addToHistory:function(value,tm,hitCount){try{hitCount=hitCount||1;if(value.search(/[^\s]/)<0){return;}
var history=null;for(var idx=0;idx<this.mUserSearchHistory.length;idx++){if(this.mUserSearchHistory[idx].mTerm==value){history=this.mUserSearchHistory[idx];this.mUserSearchHistory.splice(idx,1);}}
if(!tm){tm=new Date().getTime();}
if(history===null){history=new HistoryData(value,tm,hitCount);}else{history.mTimeStamp=tm;history.mHitCount++;}
var len=this.mUserSearchHistory.unshift(history);if(len>this.mMaxHistory){this.mUserSearchHistory=this.mUserSearchHistory.slice(0,this.mMaxHistory);}}catch(e){yahooToolbarDebug(e);}},addInstantHistory:function(term,title,url,desc,tm,hitCount){try{hitCount=hitCount||1;var history=null;if(url==""){return;}
var pos=-1;for(var idx=0;idx<this.mUserInstantHistory.length;idx++){if(this.mUserInstantHistory[idx].mUrl==url){history=this.mUserInstantHistory[idx];pos=idx;}}
if(!tm){tm=new Date().getTime();}
if(history===null){history=new InstantData(term,title,url,desc,tm,hitCount);}else{history.mTitle=title;if(term!=="")
{history.mTerm+=term+";";}
history.mTimeStamp=tm;history.mHitCount++;}
if(pos==-1)
{var len=this.mUserInstantHistory.push(history);pos=len-1;}
else
this.mUserInstantHistory[pos]=history;var data=this.mPNLDataHash.addData(term);data.mValues.push(pos);var tokens=yahooUtils.tokenizeText(title);for(var idx=0;idx<tokens.length;idx++){var data=this.mPNLDataHash.addData(tokens[idx]);data.mValues.push(pos);}
tokens=yahooUtils.tokenizeUrl(url);for(idx=0;idx<tokens.length;idx++){var data=this.mPNLDataHash.addData(tokens[idx]);data.mValues.push(pos);}}catch(e){yahooToolbarDebug(e);}},checkBlackList:function(url)
{try{var xml=this.mFileIO.readChromeContentFile("Blacklist.xml");if(!xml||xml===""){yahooToolbarDebug("Black list XML file empty not found");return;}
var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var history=parser.parseFromString(xml,"text/xml");if(history.tagName==="parserError"){return;}
history=history.firstChild;var queries=history.childNodes;var blkUrl="";var regexp="";for(var idx=0;idx<queries.length;idx++){try{blkUrl=queries[idx].childNodes[0].nodeValue;regexp=new RegExp(blkUrl);if(url.match(regexp)){return true;}}catch(e){}}}catch(ex){yahooToolbarDebug(ex);}
return false;},saveSearchHistory:function(){try{var xml="<?xml version=\"1.0\" encoding=\"utf8\" ?><history>";for(var idx=0;idx<this.mUserSearchHistory.length;idx++){var obj=this.mUserSearchHistory[idx];xml+='<q t="'+obj.mTimeStamp+'" h="'+obj.mHitCount+'">'+yahooUtils.decodeFromUTF8(obj.mTerm)+'</q>';}
xml+="</history>";this.mFileIO.writeEncodedCacheFile("searchHistory.xml",xml);}catch(e){yahooToolbarDebug(e);}},saveInstantHistory:function(){try{var xml="<?xml version=\"1.0\" encoding=\"utf-8\" ?><history>";for(var idx=0;idx<this.mUserInstantHistory.length;idx++){var obj=this.mUserInstantHistory[idx];xml+='<q url="'+escape(obj.mUrl)+'" title="'+escape(obj.mTitle)+'" term="'+escape(obj.mTerm)+'" desc="'+escape(obj.mDescription)+'" t="'+obj.mTimeStamp+'" h="'+obj.mHitCount+'" >'+'</q>';}
xml+="</history>";this.mFileIO.writeEncodedCacheFile("InstantHistory.xml",xml);}catch(e){yahooToolbarDebug(e);}},modVerticalSearch:function(oldName,Name,Url,Skey,Enabled){try{for(var i=0;i<this.mUserVerticalSearch.length;i++){if(this.mUserVerticalSearch[i].mEngine==oldName)
{this.mUserVerticalSearch[i].mEngine=Name;this.mUserVerticalSearch[i].mUrl=Url;this.mUserVerticalSearch[i].mKey=Skey;this.mUserVerticalSearch[i].mEnabled=Enabled;}}}catch(e){yahooToolbarDebug(e);}},saveVerticalSearch:function(){try{var fileContents="<?xml version=\"1.0\"?><verticals>";for(var i=0;i<this.mUserVerticalSearch.length;i++){fileContents+=("<vertical "
+"name=\""+escape(this.mUserVerticalSearch[i].mEngine)+"\" "
+"queryUrl=\""+escape(this.mUserVerticalSearch[i].mUrl)+"\" "
+"shortcut=\""+escape(this.mUserVerticalSearch[i].mKey)+"\" "
+"enabled=\""+escape(this.mUserVerticalSearch[i].mEnabled)+"\" "
+" />");}
fileContents+="</verticals>";yahooToolbarDebug(fileContents);this.mFileIO.writeEncodedCacheFile("userverticals.xml",fileContents);}catch(e){yahooToolbarDebug(e);}},removeVerticalSearch:function(name){for(var i=0;i<this.mUserVerticalSearch.length;i++){if(this.mUserVerticalSearch[i].mEngine.indexOf(name)===0){this.mUserVerticalSearch.splice(i,1);}}},fetchFirefoxBookmarks:function(){var rs=this.mResultSet;if(yahooUtils.mFFVersion<3){return rs;}
rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_DESC);rs.addMetaData(rs.COL_URL);rs.addMetaData("ysearchtype");var qry=rs.mQueryObject;rs.mPopulatedType=qry.T_FIREFOX_BOOKMARKS;var count=qry.mResultCount;try{var historyService=CC["@mozilla.org/browser/nav-history-service;1"].getService(CI.nsINavHistoryService);var options=historyService.getNewQueryOptions();var query=historyService.getNewQuery();query.searchTerms=qry.mQuery;options.queryType=options.QUERY_TYPE_BOOKMARKS;var bookmarksService=Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);var folders=[bookmarksService.placesRoot];query.setFolders(folders,folders.length)
var result=historyService.executeQuery(query,options);var container=result.root;container.containerOpen=true;for(var idx=0;idx<container.childCount&&count-->0;idx++){var child=container.getChild(idx);var row=rs.createRow();row.addString(child.title);row.addString("Browser Bookmark");row.addString(child.uri);row.addString("bookmark");}
container.containerOpen=false;container=null;query=null;historyService=null;}catch(e){yahooToolbarDebug(e);}
return rs;},fetchFirefoxHistoryData:function(){var rs=this.mResultSet;if(yahooUtils.mFFVersion<3){return rs;}
rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_URL);rs.addMetaData("ysearchtype");rs.mPopulatedType=qry.T_FIREFOX_USER_HISTORY;var qry=rs.mQueryObject;var count=qry.mResultCount;try{var historyService=CC["@mozilla.org/browser/nav-history-service;1"].getService(CI.nsINavHistoryService);var options=historyService.getNewQueryOptions();var query=historyService.getNewQuery();query.searchTerms=qry.mQuery;var result=historyService.executeQuery(query,options);var container=result.root;container.containerOpen=true;for(var idx=0;idx<container.childCount&&count-->0;idx++){var child=container.getChild(idx);var row=rs.createRow();row.addString(child.title);row.addString(child.uri);row.addString("bookmark");}
container.containerOpen=false;container=null;query=null;historyService=null;}catch(e){yahooToolbarDebug(e);}
return rs;},fetchToolbarButtonData:function(){var rs=this.mResultSet;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_URL);var qry=rs.mQueryObject;var term=qry.mQuery;var count=qry.mResultCount;rs.mPopulatedType=qry.T_YAHOO_BUTTON_DATA;try{var processor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);var dom=processor.domBuilder;function populateResultSet(dom){var node=dom;while(node&&count>0){if(typeof node.getAttribute==="function"){var text=node.getAttribute("label");var url=node.getAttribute("yurl");if(url&&url!==""&&yahooUtils.wordMatch(text.toLowerCase(),term)){count--;var row=rs.createRow();row.addString(text);row.addString(url.substr(1));}}
if(node.firstChild){populateResultSet(node.firstChild);}
node=node.nextSibling;}}
populateResultSet(dom.toolbar);}catch(e){yahooToolbarDebug(e);}
return rs;},clearInstantWebResults:function(){this.mInstantWebResultCache.clearData();},addInstantWebResults:function(term,iwr){var data=this.mInstantWebResultCache.addData(term);data.populateWithResultSet(iwr)},getPNLData:function(term){var tokens=yahooUtils.tokenizeText(term);var matches=this.mPNLDataHash.getValues(tokens);var pq=new BinarySearchHash();for(var idx=0;idx<matches.length;idx++){var pnlIdx=matches[idx].mKey;var weight=this.mUserInstantHistory[pnlIdx].getWeight(term);if(weight>0){var data=pq.addData(weight);data.mValues.push(pnlIdx);}}
var len=pq.mDataStore.length;if(len>0){return pq;}
return null;},fetchInstantWebResults:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_DESC);rs.addMetaData(rs.COL_URL);var qry=rs.mQueryObject;var term=qry.mQuery;var count=qry.mResultCount;var hashData=this.mInstantWebResultCache.getData(term);if(hashData){rs.mPopulatedType=qry.T_INSTANT_WEB_RESULTS;rs.populateWithStringTable(hashData.mValues);rs.spliceResults(qry.mResultCount);}
return rs;},populateString:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData("ysearchtype");rs.mPopulatedType=qry.T_YTB+qry.T_NONE;var row=rs.createRow();var yahooLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var srch=null;if(yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash")&&yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object["yahoo.ebox.srchoptions"]){srch=yahooLocalStorage.getObject("yahoo-toolbar-srch_ebox.yhash").wrappedJSObject.object["yahoo.ebox.srchoptions"];row.addString(srch);}
else
row.addString("Search Options...");row.addString("moreoptions");return rs;},fetchInqInstantWebResults:function(){var rs=this.mResultSet;var qry=rs.mQueryObject;rs.addMetaData(rs.COL_TEXT);rs.addMetaData(rs.COL_DESC);rs.addMetaData(rs.COL_URL);rs.addMetaData(rs.COL_TIME_DIFF);rs.addMetaData(rs.COL_HIT_COUNT);rs.addMetaData("ysearchtype");var qry=rs.mQueryObject;var term=qry.mQuery;var count=qry.mResultCount;var tmpArray1=[];var tmpStrTable=[];rs.mPopulatedType=qry.T_NONE;rs.mPopulatedType+=qry.T_INQ;if((qry.mQueryType&qry.T_PERSONALIZED_LINKS)!=0){rs.mPopulatedType+=qry.T_PERSONALIZED_LINKS;rs.mPopulatedType+=qry.T_HISTORY;var hEntry=null;if(hEntry){tmpArray1.push(hEntry.mTitle);tmpArray1.push(hEntry.mDescription);tmpArray1.push(hEntry.mUrl);tmpArray1.push(yahooUtils.getTimeDifference(hEntry.mTimeStamp));tmpArray1.push(hEntry.mHitCount);tmpArray1.push("personalisednavlink");tmpStrTable.push(tmpArray1);}}
var flag=true;var hashData=this.mInstantWebResultCache.getData(term);if(hashData){var milliSecPerDay=24*60*60*1000;var currTime=new Date().getTime();rs.mPopulatedType+=qry.T_INSTANT_WEB_RESULTS;for(var idx=0;idx<hashData.mValues.length;idx++){if(hashData.mValues[idx][2]==tmpArray1[2]){continue;}
var tmpArray=[];tmpArray.push(hashData.mValues[idx][0]);if(hashData.mValues[idx][1].length<=0){tmpArray.push("No Description");}else{tmpArray.push(hashData.mValues[idx][1]);}
tmpArray.push(hashData.mValues[idx][2]);var tmpflag=true;for(var idx1=0;(qry.mQueryType&qry.T_HISTORY)!=0&&idx1<this.mUserInstantHistory.length;idx1++){if(this.mUserInstantHistory[idx1].mTitle==hashData.mValues[idx][0]&&this.mUserInstantHistory[idx1].mUrl==hashData.mValues[idx][2]){var timeDiff=currTime-this.mUserInstantHistory[idx1].mTimeStamp;if(timeDiff<(milliSecPerDay*21)){tmpArray.push(yahooUtils.getTimeDifference(this.mUserInstantHistory[idx1].mTimeStamp));tmpArray.push(this.mUserInstantHistory[idx1].mHitCount);tmpflag=false;}
break;}}
if(tmpflag==true){tmpArray.push("");tmpArray.push("");}
tmpArray.push("bookmark");tmpStrTable.push(tmpArray);}}else{rs.mPopulatedType=qry.T_NONE;}
rs.populateWithStringTable(tmpStrTable);rs.spliceResults(count);return rs;},getQueryResult:function(qry){var rs=this.mResultSet;rs.clearRows();rs.mQueryObject=qry;rs.mPopulatedType=qry.T_NONE;switch(qry.mQueryType){case qry.T_SUGGESTION:return this.fetchSuggestions();case qry.T_LOOKUP_SUGGESTION:return this.fetchProbableSuggestions();case qry.T_HISTORY:return this.fetchHistory();case qry.T_YAHOO_BOOKMARKS:return this.fetchBookmarks();case qry.T_FIREFOX_BOOKMARKS:return this.fetchFirefoxBookmarks();case qry.T_FIREFOX_USER_HISTORY:return this.fetchFirefoxHistoryData();case qry.T_PERSONALIZED_LINKS:return this.fetchPersonalizedNavLink();case qry.T_INSTANT_WEB_RESULTS:return this.fetchInstantWebResults();case qry.T_INQ+qry.T_SUGGESTION:return this.fetchInqHistorySuggestions();case qry.T_INQ+qry.T_SUGGESTION+qry.T_HISTORY:return this.fetchInqHistorySuggestions();case qry.T_INQ+qry.T_HISTORY:return this.fetchInqHistorySuggestions();case qry.T_INQ+qry.T_INSTANT_WEB_RESULTS:return this.fetchInqInstantWebResults();case qry.T_INQ+qry.T_INSTANT_WEB_RESULTS+qry.T_HISTORY+qry.T_PERSONALIZED_LINKS:return this.fetchInqInstantWebResults();case qry.T_YAHOO_BUTTON_DATA:return this.fetchToolbarButtonData();case qry.T_VERTICAL_SEARCH:return this.fetchVerticalSearch(false);case qry.T_VERTICAL_SEARCH_ALL:return this.fetchVerticalSearch(true);case qry.T_YTB+qry.T_NONE:return this.populateString();default:yahooToolbarDebug("*** Critical *** Invalid query"+qry.mQueryType,10);break;}
rs.clearRows();return rs;},classID:Components.ID("{1085656f-9a58-4190-ab48-33df802e9fa3}"),contractID:"@yahoo.com/search/indexer;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooSearchIndexerV3])};function debug(message,level){var console=CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);var d=new Date();var time="Module :"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();console.logStringMessage(time+": "+message);}
if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooStringEnumerator,YahooResultSet,YahooSearchIndexer,YahooSearchQuery]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooStringEnumerator,YahooResultSet,YahooSearchIndexer,YahooSearchQuery]);