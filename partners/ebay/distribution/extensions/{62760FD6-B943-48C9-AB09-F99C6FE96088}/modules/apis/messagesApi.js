/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */var EXPORTED_SYMBOLS=["MessagesApi"];const Cc=Components.classes;const Ci=Components.interfaces;const Cu=Components.utils;const SOAP_URL="http://api4.qa.ebay.com/services/mobile/v1/MessagesForTheDayService";MessagesApi={_appName:null,init:function(){Cu.import("resource://ebaycompanion/constants.js");Cu.import("resource://ebaycompanion/datasource.js");Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/accessKeysHelper.js");Cu.import("resource://ebaycompanion/objects/systemMessage.js");this._setAppName();},_setAppName:function(){let siteId=Constants.siteIdForSite(Datasource.homeSite());let keyset=AccessKeysHelper.getKeySet(false,siteId);this._appName=keyset.appName;},_extractSoapResponse:function(aResponseText){let xmlResponse=null;aResponseText=aResponseText.replace(/<\?xml .*?>/,"");aResponseText=aResponseText.replace(/soapenv:/gi,"");aResponseText=aResponseText.replace(/ xmlns:soapenv=["'].*?["']/,"");aResponseText=aResponseText.replace(/ xmlns:ms=["'].*?["']/,"");aResponseText=aResponseText.replace(/ xmlns=["'].*?["']/,"");xmlResponse=XML(aResponseText);return xmlResponse..Body;},getMessagesForTheDay:function(){let methodName="getMessagesForTheDay";let that=this;let callback=function(aRequest){if(aRequest){let body=that._extractSoapResponse(aRequest.responseText);let response=body.getMessagesForTheDayResponse;let ack=response.ack.text();if("Success"==ack){that._buildMessageArray(response);}else{let message=response.errorMessage.error.message.text();Logger.error("getMessagesForTheDay: "+ack+": "+message);}}};this._sendRequest(methodName,callback);if(typeof(ObjectsStorage)=="undefined"){Cu.import("resource://ebaycompanion/storage/objectsStorage.js");}
ObjectsStorage.removeSystemMessages(Datasource.getEbayTime().getTime());},_buildMessageArray:function(aResponse){let message=null;let validToTime=null;let validFromTime=null;let systemMessage=null;let userId=Datasource.activeAccount().get("userId");let jsonBody=null;for(let messageIndex in aResponse.messageList){message=aResponse.messageList[messageIndex];validFromTime=String(message.validFromTime);validToTime=String(message.validToTime);jsonBody=String(message.message);if(this._isValidMessageBody(jsonBody)){systemMessage=new SystemMessage(String(message.messageId),String(userId));systemMessage.set("jsonBody",jsonBody);systemMessage.set("type",String(message.messageType));systemMessage.set("maxNumberOfViews",String(message.maxNumberOfViews));systemMessage.set("validFromTime",this._getTimestamp(validFromTime));systemMessage.set("validToTime",this._getTimestamp(validToTime));Datasource.addOrUpdateSystemMessage(systemMessage);}}},_getTimestamp:function(aTimeString){let dateRegExp=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;let dateResults=dateRegExp.exec(aTimeString);let date=new Date();let timestamp=null;if(dateResults){date.setUTCFullYear(dateResults[1],dateResults[2]-1,dateResults[3]);date.setUTCHours(dateResults[4],dateResults[5],dateResults[6]);}else{Logger.error("Incompatible date format: "+aTimeString,Logger.DUMP_STACK);}
timestamp=String(date.getTime());return timestamp;},_isValidMessageBody:function(aJsonBody){let isValidBody=false;try{let json=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);let messageObject=json.decode(aJsonBody);let url=messageObject.url;let icon=messageObject.icon;const EBAY_URL_REGEX=/^http:\/\/(\w*\.)+ebay(\.\w{2,3}){1,2}/i;if(null!=url.match(EBAY_URL_REGEX)&&null!=icon.match(EBAY_URL_REGEX)){isValidBody=true;}}catch(e){Logger.error("There was an error validating the system messages: "+e);}
return isValidBody;},getRelatedApplicationLinks:function(){let methodName="getRelatedApplicationLinks";let that=this;let callback=function(aRequest){if(aRequest){}};this._sendRequest(methodName,callback);},_sendRequest:function(aMethod,aCallback){let request=Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);let headers={"X-EBAY-SOA-SERVICE-NAME":"MessagesForTheDayService","X-EBAY-SOA-MESSAGE-PROTOCOL":"SOAP12","X-EBAY-SOA-OPERATION-NAME":aMethod,"X-EBAY-SOA-GLOBAL-ID":"EBAY-US","X-EBAY-SOA-SECURITY-APPNAME":this._appName};let content=this._createSoapRequest(aMethod);request.mozBackgroundRequest=true;request.open("POST",SOAP_URL,true);request.onreadystatechange=function(){if(4!=request.readyState){return;}
aCallback(request);};for(let header in headers){request.setRequestHeader(header,headers[header]);}
request.send(content);},_createSoapRequest:function(aMethod){let site=Datasource.homeSite();let siteId=Constants.siteIdForSite(site);let language="en-US";let soapRequest="<soapenv:Envelope "+
"xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" "+
"xmlns:ser=\"http://www.ebay.com/marketplace/mobile/v1/services\">";for(locale in Constants.localeSiteDataSelector){if(Constants.localeSiteDataSelector[locale]==site){language=locale;}}
siteId=0;language="en-US";soapRequest+="<soapenv:Header/>";soapRequest+="<soapenv:Body>";soapRequest+="<ser:"+aMethod+"Request>";soapRequest+="<ser:clientId>FIREFOXEXTENSION</ser:clientId>";soapRequest+="<ser:language>"+language+"</ser:language>";soapRequest+="<ser:siteId>"+siteId+"</ser:siteId>";soapRequest+="</ser:"+aMethod+"Request>";soapRequest+="</soapenv:Body>";soapRequest+="</soapenv:Envelope>";return soapRequest;},generateSystemMessageNotification:function(aSystemMessage){if(typeof(Notification)=="undefined"){Cu.import("resource://ebaycompanion/objects/notification.js");}
if(typeof(InformationNotificationHelper)=="undefined"){Cu.import("resource://ebaycompanion/helpers/informationNotificationHelper.js");}
try{let jsonBody=aSystemMessage.get("jsonBody");let json=Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);let messageObject=json.decode(jsonBody);let messageFormat="[1 body]";let messageContent=messageFormat.replace("body",messageObject.message);let notification=new Notification(aSystemMessage.get("messageId"));notification.addLinkCallback(0,function(aEvent){let windowMediator=Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);let mostRecentWindow=windowMediator.getMostRecentWindow("navigator:browser");let roveredUrl=Constants.roverUrl(messageObject.url,Datasource.homeSite(),"platformNotification");mostRecentWindow.EbayCompanion.openRawURL(roveredUrl,aEvent);InformationNotificationHelper.dismissNotification(aSystemMessage.get("messageId"));});notification.set("content",messageContent);notification.set("imageURL",messageObject.icon);notification.set("bgColor",messageObject.bgColor);notification.set("priority",1);InformationNotificationHelper.queueNotification(notification,true);}catch(e){Logger.exception(e);}}};(function(){this.init();}).apply(MessagesApi);