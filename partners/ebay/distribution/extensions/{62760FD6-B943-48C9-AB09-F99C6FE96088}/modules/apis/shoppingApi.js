/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["ShoppingApi"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/observers.js");Cu.import("resource://ebaycompanion/helpers/apiHelper.js");Cu.import("resource://ebaycompanion/apiAccessService.js");Cu.import("resource://ebaycompanion/objects/item.js");Cu.import("resource://ebaycompanion/datasource.js");Cu.import("resource://ebaycompanion/constants.js");ShoppingApi={getUserProfile:function(callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Shopping API GetUserProfile call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();innerBody+=<IncludeSelector>Details</IncludeSelector>;
    innerBody += <UserID>{Datasource.activeAccount().get("userId")}</UserID>;XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("GetUserProfile",flatInnerBody);let localCallback=let(that=this)function(response){let result=that._parseGetUserProfile(response);try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},_parseGetUserProfile:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let foundErrors=this._detectAndReportErrors(xmlTree);if(foundErrors){return;}
let feedbackRating=xmlTree.User.FeedbackScore.toString();let registrationSite=xmlTree.User.RegistrationSite.toString();let ret={};ret.feedbackRating=feedbackRating;ret.registrationSite=registrationSite;return ret;},getMultipleItems:function(aItems,callback,aRequestTracker){if(!Datasource.activeAccount()){Logger.error("Attempt to make Shopping API GetMultipleItems call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let itemHashList={};innerBody+=<IncludeSelector>Details,ItemSpecifics,ShippingCosts</IncludeSelector>;
    for (let i = 0; i < aItems.length; i++) {
      let aItem = aItems[i];
      innerBody += <ItemID>{aItem.get("itemId")}</ItemID>;itemHashList[aItem.get("itemId")]=aItem;}
XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("GetMultipleItems",flatInnerBody);let localCallback=let(that=this)function(response){let result=that._parseGetMultipleItems(response);try{if(callback){if(aRequestTracker){callback(itemHashList,result,aRequestTracker);}else{callback(aItems,result);}}}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},_parseGetMultipleItems:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);this._detectAndReportErrors(xmlTree);let ret={};ret.items=[];let items=xmlTree.Item;for(let i=0;i<items.length();i++){let retItem=new Item(Number(items[i].ItemID));retItem.fromXMLNode(items[i]);ret.items.push(retItem);}
return ret;},getSingleItem:function(aItemId,callback){if(!Datasource.activeAccount()){Logger.error("Attempt to make Shopping API GetSingleItem call when "+
"no account is active.",Logger.DUMP_STACK);return;}
let innerBody=new XMLList();let itemHashList={};innerBody+=<IncludeSelector>Details,ItemSpecifics,ShippingCosts</IncludeSelector>;
    innerBody += <ItemID>{aItemId}</ItemID>;XML.prettyPrinting=false;let flatInnerBody=innerBody.toXMLString();XML.prettyPrinting=true;let wrappedBody=this._wrapCall("GetSingleItem",flatInnerBody);let localCallback=let(that=this)function(response){let result=that._parseGetSingleItem(response);try{if(callback)callback(result);}
catch(e){Logger.exception(e);}}
let useSandbox=Datasource.activeAccount().get("isSandboxAccount");let request=this._doCall(wrappedBody,useSandbox,localCallback);return request;},_parseGetSingleItem:function(response){response=response.replace(/<\?xml .*?>/,"").replace(/ xmlns=["'].*?["']/,"");let xmlTree=XML(response);let ret={};ret.item=null;let foundErrors=this._detectAndReportErrors(xmlTree);if(!foundErrors){let items=xmlTree.Item;if(items.length()==1){let retItem=new Item(Number(items[0].ItemID));retItem.fromXMLNode(items[0]);ret.item=retItem;}}else{ret.error=foundErrors;}
return ret;},_detectAndReportErrors:function(xmlTree){if(xmlTree.Errors.length()>0){foundErrors=true;let errors=xmlTree.Errors;for(let i=0;i<errors.length();i++){let errorCode=Number(errors[i].ErrorCode);let severity=String(errors[i].SeverityCode.text());if(severity.indexOf("Error")!=-1){Logger.error("Shopping API Error:\n"+"Error Code: "+errorCode+
"\nShort Message: "+
String(errors[i].ShortMessage.text())+
"\nSeverity: "+
severity+
"\nError Clasification: "+
String(errors[i].ErrorClassification.text())+"\n",Logger.DUMP_STACK);}else{Logger.warning("Shopping API Warning:\n"+"Error Code: "+
errorCode+
"\nShort Message: "+
String(errors[i].ShortMessage.text())+
"\nSeverity: "+
severity+
"\nError Clasification: "+
String(errors[i].ErrorClassification.text())+"\n",Logger.DUMP_STACK);}}}},_wrapCall:function(callName,innerBody){let xmlHeader="<?xml version=\"1.0\" encoding=\"utf-8\"?>";let xmlns="xmlns=\"urn:ebay:apis:eBLBaseComponents\"";let wrappedBody=xmlHeader+
"<"+callName+"Request "+xmlns+">"+
innerBody+
"</"+callName+"Request>";return wrappedBody;},_doCall:function(body,useSandbox,callback){let requestName;try{requestName=/><(.*?)Request/.exec(body)[1];}
catch(e){Logger.error("Shopping API request will not be sent, as it is "+
"badly-formed.",Logger.DUMP_STACK);return;}
let callDescription="Shopping API "+requestName;let apiCallback=ApiHelper.generateApiCallback(callDescription,callback);let siteId=Constants.siteIdForSite(Datasource.homeSite());ApiAccessService.siteId=siteId;ApiAccessService.apiVersion=693;let request=ApiAccessService.doShoppingAPICall(requestName,body,useSandbox,apiCallback);ApiHelper.addPendingRequest(request,callDescription);let requestLog={};requestLog.requestName=requestName;requestLog.properties=body;requestLog.api="Shopping";Observers.notify(requestLog,"ebay-shopping-api-call",null);return request;}};