/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["ClientAlertsApi"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/observers.js");Cu.import("resource://ebaycompanion/helpers/apiHelper.js");Cu.import("resource://ebaycompanion/apiAccessService.js");Cu.import("resource://ebaycompanion/objects/item.js");Cu.import("resource://ebaycompanion/objects/transaction.js");Cu.import("resource://ebaycompanion/datasource.js");Cu.import("resource://ebaycompanion/apiCoordinator.js");Cu.import("resource://ebaycompanion/constants.js");Cu.import("resource://ebaycompanion/helpers/observers.js");ClientAlertsApi={get connected(){return this._sessionId&&this._sessionData;},login:function(token,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Client Alerts Login call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let parameters={};parameters.ClientAlertsAuthToken=token;let localCallback=let(that=this)function(response){let result=that._parseLogin(response);if(result.sessionId&&result.sessionData){that._sessionId=result.sessionId;that._sessionData=result.sessionData;if(result.timestamp){that._lastPublicUpdateTime=result.timestamp;}}
try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall("Login",parameters,useSandbox,localCallback);return request;},_parseLogin:function(response,callback){let nativeJSON=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);jsonObject=nativeJSON.decode(response);let errors=this._detectAndReportErrors(jsonObject);let result={};result.sessionId=jsonObject.SessionID;result.sessionData=jsonObject.SessionData;result.timestamp=jsonObject.Timestamp;result.errors=errors;return result;},getPublicAlerts:function(resultObject,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Client Alerts GetPublicAlerts call when "+
"no account is active.",Logger.DUMP_STACK);return;}
if(!this.connected){Logger.warning("Making Client Alerts GetPublicAlerts call when "+
"not logged in to Client Alerts!",Logger.DUMP_STACK);}
let parameters={};if(this._lastPublicUpdateTime){parameters.LastRequestTime=this._lastPublicUpdateTime;}
let items=Datasource.items();parameters.ChannelDescriptor=[];for each(let[itemId,item]in Iterator(items)){if(!item.get("isEnded")){let channelDescriptor={};channelDescriptor.ChannelID=itemId;channelDescriptor.ChannelType="Item";channelDescriptor.EventType=["ItemEnded","PriceChange"];parameters.ChannelDescriptor.push(channelDescriptor);}}
if(parameters.ChannelDescriptor.length==0){Logger.warning("Attempt to make Client Alerts GetPublicAlerts call "+
"when there are no items to track!",Logger.DUMP_STACK);return;}
let localCallback=let(that=this)function(response){let result=that._parseGetPublicAlerts(response,resultObject);if(result.timestamp){that._lastPublicUpdateTime=result.timestamp;}
try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall("GetPublicAlerts",parameters,useSandbox,localCallback);return request;},_parseGetPublicAlerts:function(response,resultObject){let nativeJSON=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);jsonObject=nativeJSON.decode(response);this._detectAndReportErrors(jsonObject);for(let i=0;i<jsonObject.Content.length;i++){let channelEvents=jsonObject.Content[i].ChannelEvent;for(let j=0;j<channelEvents.length;j++){let event=channelEvents[j][channelEvents[j].EventType];this._processAlert(event,resultObject);}}
resultObject.timestamp=jsonObject.Timestamp;return resultObject;},getUserAlerts:function(resultObject,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Client Alerts GetUserAlerts call when "+
"no account is active.",Logger.DUMP_STACK);throw"Attempt to make Client Alerts GetUserAlerts call when "+
"no account is active.";return;}
if(!this.connected){Logger.error("Attempt to make Client Alerts GetUserAlerts call when "+
"not logged in to Client Alerts!",Logger.DUMP_STACK);throw"Attempt to make Client Alerts GetUserAlerts call when "+
"no account is active.";return;}
let parameters={};parameters.SessionID=this._sessionId;parameters.SessionData=this._sessionData;let localCallback=let(that=this)function(response){let result=that._parseGetUserAlerts(response,resultObject);if(result.sessionData){that._sessionData=result.sessionData;}
try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall("GetUserAlerts",parameters,useSandbox,localCallback);return request;},_parseGetUserAlerts:function(response,resultObject){let nativeJSON=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);jsonObject=nativeJSON.decode(response);this._detectAndReportErrors(jsonObject);let clientAlerts=jsonObject.ClientAlerts;if(clientAlerts){let alertEvents=clientAlerts.ClientAlertEvent;for(let i=0;i<alertEvents.length;i++){let eventType=alertEvents[i].EventType;if(eventType=="OutBid"){eventType="Outbid";}
let event=alertEvents[i][eventType];if(null!=event){this._processAlert(event,resultObject);}}}
resultObject.sessionData=jsonObject.SessionData;return resultObject;},emptyResultObject:function(){let result={};result.feedbackReceived=false;result.removedItems=new Array();result.needUpdate=new Array();return result;},_processAlert:function(alertObject,result){Logger.log("Event: "+alertObject.EventType+
", ID: "+alertObject.ItemID);let eventType=alertObject.EventType;let itemId=alertObject.ItemID;let item;let feedbackDetail;let itemType=null;switch(eventType){case"ItemAddedToWatchList":item=Datasource.items()[itemId];if(!item){item=new Item(itemId);item.type=Item.ITEM_TYPE_WATCHING;result.needUpdate.push(item);}
for(var i=0;i<result.removedItems.length;i++){if(result.removedItems[i]==itemId){result.removedItems.splice(i,1);break;}}
break;case"ItemRemovedFromWatchList":item=Datasource.items()[itemId];if(item){result.removedItems.push(itemId);}
for each(let[aIndex,aItem]in result.needUpdate){if(aItem&&aItem.get("itemId")==itemId){result.needUpdate.splice(aIndex,1);break;}}
break;case"ItemMarkedPaid":var transactions=Datasource.transactions(itemId);var transaction=transactions[alertObject.TransactionID];if(transaction){transaction=transaction.copy();transaction.set("isPaidFor",true);Datasource.addOrUpdateTransaction(transaction);}
break;case"ItemMarkedShipped":var transactions=Datasource.transactions(itemId);var transaction=transactions[alertObject.TransactionID];if(transaction){transaction=transaction.copy();transaction.set("isShipped",true);Datasource.addOrUpdateTransaction(transaction);}
break;case"OutBid":case"BidReceived":case"BidPlaced":item=new Item(itemId);if(eventType=="BidReceived"){item.type=Item.ITEM_TYPE_SELLING;}else{item.type=Item.ITEM_TYPE_BIDDING;}
var localItem=Datasource.items()[itemId];if(localItem&&eventType=="OutBid"){item=localItem.copy();item.set("numBids",alertObject.BidCount);item.set("currentPrice",alertObject.CurrentPrice.Value);item.set("currency",alertObject.CurrentPrice.CurrencyID);item.set("highBidderId",alertObject.HighBidderUserID);if(alertObject.ReserveMet){item.set("isReserveMet",alertObject.ReserveMet);}
if(eventType=="BidPlaced"){item.set("highBidderId",Datasource.activeAccount().get("userId"));}
Datasource.addOrUpdateItem(item);}else{result.needUpdate.push(item);}
break;case"PriceChange":item=Datasource.items()[itemId];if(item){item=item.copy();item.set("currentPrice",alertObject.CurrentPrice.Value);item.set("numBids",alertObject.BidCount);if(alertObject.ReserveMet){item.set("isReserveMet",alertObject.ReserveMet);}
Datasource.addOrUpdateItem(item);}
break;case"ItemSold":case"ItemWon":case"ItemUnsold":case"ItemLost":item=Datasource.items()[itemId];if(item){item=item.copy();}
if(eventType=="ItemSold"){item.type=Item.ITEM_TYPE_SOLD;}else if(eventType=="ItemWon"){item.type=Item.ITEM_TYPE_WON;}else if(eventType=="ItemUnsold"){item.type=Item.ITEM_TYPE_UNSOLD;item.set("isEnded",true);}else{item.type=Item.ITEM_TYPE_LOST;item.set("isEnded",true);}
if(eventType=="ItemWon"){result.needUpdate.push(item);}else{item.set("numBids",alertObject.BidCount);item.set("currentPrice",alertObject.CurrentPrice.Value);item.set("currency",alertObject.CurrentPrice.CurrencyID);Datasource.addOrUpdateItem(item);}
break;case"ItemEnded":item=Datasource.items()[itemId];if(item){item=item.copy();item.set("isEnded",true);}
Datasource.addOrUpdateItem(item);break;case"EndOfAuction":case"FixedPriceTransaction":case"FixedPriceEndOfTransaction":item=Datasource.items()[itemId];if(!item){item=new Item(itemId);var sellerId=alertObject.SellerUserID;if(sellerId.toLowerCase()==Datasource.activeAccount().get("userId").toLowerCase()){item.type==Item.ITEM_TYPE_SOLD;}else{item.type==Item.ITEM_TYPE_WON;}}
result.needUpdate.push(item);break;case"FeedbackLeft":case"FeedbackReceived":itemId=alertObject.FeedbackDetail.ItemID;var transactionId=alertObject.FeedbackDetail.TransactionID;var transactions=Datasource.transactions(itemId);var transaction;if(transactions){transaction=transactions[transactionId];}
if(!transaction){item=Datasource.items()[itemId];if(item){result.needUpdate.push(item);}}else{transaction=transaction.copy();if(eventType=="FeedbackReceived"){var feedbackType=alertObject.FeedbackDetail.CommentType;transaction.set("feedbackReceivedType",feedbackType);transaction.set("userHasReceivedFeedback",true);result.feedbackReceived=true;}else{transaction.set("userHasSentFeedback",true);}
Datasource.addOrUpdateTransaction(transaction);}
break;case"BestOfferPlaced":case"BestOfferDeclined":case"CounterOfferReceived":item=Datasource.items()[itemId];if(item){let sellerId=item.get("sellerUserId");let currentUser=Datasource.activeAccount().get("userId");if(sellerId.toLowerCase()==currentUser.toLowerCase()){result.needUpdate.push(item);}else{item=item.copy();if(eventType=="BestOfferDeclined"){item.set("bestOfferStatus","Declined");}else if(eventType=="CounterOfferReceived"){item.set("bestOfferStatus","Countered");}else{item.set("bestOfferStatus","Pending");}
Datasource.addOrUpdateItem(item);}}
break;case"BestOffer":item=Datasource.items()[itemId];if(item){item=item.copy();let currentCount=item.get("bestOfferCount");item.set("bestOfferCount",currentCount++);Datasource.addOrUpdateItem(item);}
break;default:Logger.warning("Unrecognised Client Alert: "+
"\""+alertObject.EventType+"\"");let nativeJSON=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);Logger.warning(nativeJSON.encode(alertObject));break;}},_detectAndReportErrors:function(jsonObject){let errors=jsonObject.Errors;if(errors){for(let i=0;i<errors.length;i++){let error=errors[i];let errorCode=Number(error.ErrorCode);switch(errorCode){case 11.3:Logger.error("Client Alerts Session has expired; "+
"resetting update cycle.");ApiCoordinator.disableUpdates();ApiCoordinator.enableUpdates(true);break;default:Logger.error("Client Alerts API Error:\n"+"Error Code: "+
errorCode+
"\nShort Message: "+
String(errors[i].ShortMessage.text())+
"\nSeverity: "+
String(errors[i].SeverityCode.text())+
"\nError Clasification: "+
String(errors[i].ErrorClassification.text())+"\n",Logger.DUMP_STACK);break;}}}},_doCall:function(requestName,parameters,useSandbox,callback){let unflattened=[];let parameterString="";for each(let[name,value]in Iterator(parameters)){unflattened.push({name:name,value:value});}
while(unflattened.length>0){let entry=unflattened.shift();if(typeof(entry.value)!="object"){parameterString+="&"+entry.name+
"="+encodeURIComponent(entry.value);}else{if(entry.value.constructor.name=="Array"){for(let i=0;i<entry.value.length;i++){let newEntry={};newEntry.name=entry.name+"("+i+")";newEntry.value=entry.value[i];unflattened.splice(i,0,newEntry);}}else{let i=0;for each(let[name,value]in Iterator(entry.value)){let newEntry={};newEntry.name=entry.name+"."+name;newEntry.value=value;unflattened.splice(i++,0,newEntry);}}}}
let callDescription="Client Alerts API "+requestName;let apiCallback=ApiHelper.generateApiCallback(callDescription,callback);let siteId=Constants.siteIdForSite(Datasource.homeSite());ApiAccessService.siteId=siteId;ApiAccessService.apiVersion=691;let request=ApiAccessService.doClientAlertsAPICall(requestName,parameterString,useSandbox,apiCallback);ApiHelper.addPendingRequest(request,callDescription);let requestLog={};requestLog.requestName=requestName;requestLog.properties=parameters;requestLog.api="Client Alerts";Observers.notify(requestLog,"ebay-client-alerts-api-call",null);return request;}};