
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var yahooCC=CC;var yahooCI=CI;var yahooPrefService=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/utils.js");var MaxRetry=3;var defaultPollTime=180;function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooAlertManager(){try{this.localstorage=Components.classes["@yahoo.com/localstorage;1"].getService(Components.interfaces.nsIYahooLocalStorage);this.notifier=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);this.pollinterval=defaultPollTime;this.retryCount=0;this.ep={};}catch(e){yahooError(e);}}
YahooAlertManager.prototype={timer:null,notifier:null,currentpollids:null,pollinterval:null,ep:null,toolbarmanager:null,slideoutopenid:null,alrtopenid:null,ORobjPrev:null,overrideRSSbtnids:[],overrideTickbtnids:[],overrideParTickbtnids:[],securealertids:[],guestAlertIds:[],bSignedInAlertsOnSsl:false,bAllAlertsOnSsl:false,userInactive:false,initAlerts:function(toolbarManager){try{this.toolbarmanager=toolbarManager;}catch(e){yahooError(e);}},setUserInactive:function(userInactive)
{if(this.userInactive==true&&userInactive==false)
{this.userInactive=false;this.retrieveAlerts();this.initAlertPoll();}
this.userInactive=userInactive;},initAlertPolltime:function(){var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);if(prefs.prefHasUserValue("yahoo.debug.polltime")){this.pollinterval=prefs.getIntPref("yahoo.debug.polltime");}
else if(this.pollinterval>this.localstorage.getString("P2")){this.pollinterval=parseInt(this.localstorage.getString("P2"));}
this.initAlertPoll();},initAlertPoll:function(){try{if(this.pollinterval==0){this.pollinterval=defaultPollTime;}
if(this.timer!==null&&this.timer.delay!=this.pollinterval){this.stopAlertTimer(this);}
var alertmgr=this;var callback={notify:function(timer){try{alertmgr.retrieveAlerts();}catch(e){yahooError(e);}}};this.timer=CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);this.timer.initWithCallback(callback,this.pollinterval*1000,this.timer.TYPE_REPEATING_PRECISE);}catch(e){yahooError(e);}},clearSignedinData:function(){try{var alertD=this.localstorage.getObject("alert");if(alertD!=null){alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].algst===undefined||alertD[x].algst==0){var alertObj=this.localstorage.getObject(alertD[x].alrt);if(alertObj!==null){alertObj=alertObj.wrappedJSObject.object;if(alertObj!==null){alertObj=undefined;this.localstorage.putObject(alertD[x].alrt,new WrapperClass(alertObj));}}
var full_alertid=alertD[x].alrt+'_full';var fullalertObj=this.localstorage.getObject(full_alertid);if(fullalertObj!==null){fullalertObj=fullalertObj.wrappedJSObject.object;if(fullalertObj!==null){fullalertObj=undefined;this.localstorage.putObject(full_alertid,new WrapperClass(fullalertObj));}}}}}}}catch(e){yahooError("Exception in AlertManager:refreshOnCookieChange"+e);}},refreshAlert:function(alertids,refresh)
{var alertids=alertids.wrappedJSObject.object;var updateflag=false;if(!refresh){for(x in alertids){if(alertids[x].match(new RegExp("^slideout-"))){this.alrtopenid=null;this.slideoutopenid=null;}
else
{alertObj=this.localstorage.getObject(alertids[x]);if(alertObj!==null){alertObj=undefined;this.localstorage.putObject(alertids[x],new WrapperClass(alertObj));}
updateflag=true;}}
if(updateflag){this.notifier.notifyObservers(null,"yahoo-feed-alerts-updated","");updateflag=false;}}else{for(x in alertids){if(alertids[x].match(new RegExp("^slideout-"))){var sp=alertids[x].split("-");this.alrtopenid=sp[1];this.slideoutopenid=sp[2];}}
this.retrieveAlerts(alertids);}},broadcastAlert:function(ids){this.notifier.notifyObservers(null,"yahoo-feed-alerts-updated",ids);},setExtraParam:function(key,value,persist){if(persist){var configManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);if(configManager){var eps=configManager.getCharValue("alertmanager.ep");var ep;if(eps!==null&&eps!=""){ep=yahooUtils.JSON.parse(eps);}
if(!ep){ep={};}
ep[key]=value;var epstring=yahooUtils.JSON.stringify(ep);configManager.setCharValue("alertmanager.ep",epstring,true);}}else{if(this.ep===null){this.ep={};}
this.ep[key]=value;}},getExtraParams:function(){var ep={};if(this.ep!=null){ep=this.ep;}
var configManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);var persistant_ep_string=configManager.getCharValue("alertmanager.ep");var persistant_ep={};if(persistant_ep_string!==null&&persistant_ep_string!=""){persistant_ep=yahooUtils.JSON.parse(persistant_ep_string);}
for(var e in ep){persistant_ep[e]=ep[e];}
var eps='';for(var i in persistant_ep){eps+="ep["+i+"]=";eps+=persistant_ep[i];eps+="&";}
this._resetExtraParams();return eps;},_resetExtraParams:function(){if(this.ep!=null){this.ep=null;}},setPollInterval:function(pollinterval)
{this.pollinterval=pollinterval;this.calculateAlertSlots();},calculateAlertSlots:function()
{var alertD=this.localstorage.getObject("alert");alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].alint!==undefined){alertD[x].slot=Math.floor(alertD[x].alint/this.pollinterval)-1;}else{alertD[x].slot=Math.floor((defaultPollTime)/this.pollinterval)-1;}}}},refreshAllAlert:function(){var alertD=this.localstorage.getObject("alert");alertD=alertD.wrappedJSObject.object;var alertids=[];this.retryCount=0;if(alertD!==undefined){var temp=JSON.stringify(alertD);for(x in alertD){if(alertD[x].algst==1)
{this.guestAlertIds.push(alertD[x].alrt);}
alertids.push(alertD[x].alrt);}}
this.retrieveAlerts(alertids);},retrieveAlerts:function(ids){try{yahooStartTrace("Triggering alerts");if(this.userInactive==true){var iStopAlertPollingOnUserInactivtiy=0;var presBtnHash=this.localstorage.getObject("yahoo-toolbar-pres.yhash");if(presBtnHash){presBtnHash=presBtnHash?presBtnHash.wrappedJSObject.object:null;if(presBtnHash){if(presBtnHash.inactivealert){iStopAlertPollingOnUserInactivtiy=presBtnHash.inactivealert;}}}
if(iStopAlertPollingOnUserInactivtiy==1){return;}}
var alertIds=[];var overridealertIds=[];this.overrideRSSbtnids=[];this.overrideTickbtnids=[];this.overrideParTickbtnids=[];var cookies=new Array();var ix=0;var alrt_210=false;var alrt_205=false;var alrt_211=false;if(ids){alertIds=ids;}else{var alertD=this.localstorage.getObject("alert");var ORalertD=this.localstorage.getObject("ORalert");if(alertD===null){return;}
alertD=alertD.wrappedJSObject.object;var alertids;var alertints;if(alertD!==undefined){for(x in alertD){if((this.toolbarmanager.isGuestMode()!==true)||(this.toolbarmanager.isGuestMode()&&alertD[x].algst)){var pollthistime=false;if(alertD[x].slot===undefined||alertD[x].slot<=0){if(alertD[x].alint!==undefined){alertD[x].slot=Math.floor(alertD[x].alint/this.pollinterval)-1;if(alertD[x].slot<=0)pollthistime=true;}else{alertD[x].slot=Math.floor((defaultPollTime)/this.pollinterval)-1;if(alertD[x].slot<=0)pollthistime=true;}}else{alertD[x].slot=alertD[x].slot-1;if(alertD[x].slot<=0){pollthistime=true;}}
if(pollthistime===true){var aids=alertD[x].alrt;aids=aids.split(",");for(y in aids){alertIds.push(aids[y]);if(aids[y]=="210")
alrt_210=true;else if(aids[y]=="205")
alrt_205=true;else if(aids[y]=="211")
alrt_211=true;}}}
var aids=alertD[x].alco;if(aids){aids=aids.split("+");for(y in aids){var alco_value=aids[y];alco_value=alco_value.split(",");cookies[ix]=new Array();cookies[ix][0]=alco_value[0];cookies[ix][1]=alco_value[1];cookies[ix][2]="";ix++;}}}}else{yahooDebug("No Alert data");}
if(ORalertD!=null)
ORalertD=ORalertD.wrappedJSObject.object;if(ORalertD!==undefined){for(z in ORalertD){var pollthistime=false;if(ORalertD[z].slot===undefined||ORalertD[z].slot<=0){if(ORalertD[z].alint!==undefined){ORalertD[z].slot=Math.floor(ORalertD[z].alint/this.pollinterval)-1;if(ORalertD[z].slot<=0)pollthistime=true;}else{ORalertD[z].slot=Math.floor((defaultPollTime)/this.pollinterval)-1;if(ORalertD[z].slot<=0)pollthistime=true;}}else{ORalertD[z].slot=ORalertD[z].slot-1;if(ORalertD[z].slot<=0){pollthistime=true;}}
if(pollthistime===true){var aids=ORalertD[z].alrt;aids=aids.split(",");for(y in aids){if(aids[y]=="210"&&alrt_210==false){overridealertIds.push(aids[y]);this.overrideTickbtnids.push(ORalertD[z].btnid);}
else if(aids[y]=="205"&&alrt_205==false){overridealertIds.push(aids[y]);if(ORalertD[z].btnid.indexOf("@lbrss")==-1)
this.overrideRSSbtnids.push(ORalertD[z].btnid);}
else if(aids[y]=="211"&&alrt_211==false){overridealertIds.push(aids[y]);this.overrideParTickbtnids.push(ORalertD[z].btnid);}}}}}else{}}
yahooStopTrace("Triggering alerts");if(alertIds===""&&overridealertIds===""){return;}
yahooStartTrace("Fetch Alert Feed");this.currentpollids=alertIds.toString()+","+overridealertIds.toString();var alertIdsToRetrieve=[];if(this.toolbarmanager.isGuestMode())
{alertIdsToRetrieve=this.currentpollids.split(",");this.currentpollids="";for(i=0;i<alertIdsToRetrieve.length;++i)
{if(this.isGuestAlert(alertIdsToRetrieve[i])==true)
{this.currentpollids+=alertIdsToRetrieve[i];this.currentpollids+=",";}}}
var url=null;if(this.currentpollids!='')
{alertIdsToRetrieve=this.currentpollids.split(",");url=this.buildAlertUrl(alertIdsToRetrieve);}
var alertmgr=this;this.createCustomRSSButtonJob();var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);if(url!=null)
var channel=iosvc.newChannel(url,0,null).QueryInterface(CI.nsIHttpChannel);;var channelListener={stream:null,alertFeed:"",onStartRequest:function(request,context){this.alertFeed="";},onDataAvailable:function(request,context,inputStream,offset,count){if(!this.stream){this.stream=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);}
this.stream.init(inputStream);this.alertFeed+=this.stream.read(count);},onStopRequest:function(request,context,statusCode){try{yahooStopTrace("Fetch Alert Feed");if(this.stream){this.stream.close();}
request.QueryInterface(CI.nsIHttpChannel);if(this.alertFeed===""||request.status!==0){return;}
yahooStartTrace("Process Alert Feed");var uniconvert=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uniconvert.charset='utf-8';this.alertFeed=uniconvert.ConvertToUnicode(this.alertFeed);var haveAlerts=alertmgr.processJSONAlerts(this.alertFeed);if(haveAlerts){alertmgr.notifier.notifyObservers(null,"yahoo-feed-alerts-updated",alertmgr.currentpollids);}
if(!this.toolbarmanager.isGuestMode()){}
yahooStopTrace("Process Alert Feed");}catch(e){yahooError(e);}
this.stream=null;}};if(url!=null){try{var cookies_local=yahooCC["@mozilla.org/cookiemanager;1"].getService(yahooCI.nsICookieManager2);cookies_local=cookies_local.enumerator;while(cookies_local.hasMoreElements()){var cookie=cookies_local.getNext().QueryInterface(yahooCI.nsICookie);for(var i=0;i<ix;i++){var s=cookies[i][1]+"";if(s.indexOf("http://")!=-1)
s="."+s.substring(7);if(s==cookie.host.toString())
cookies[i][2]+=cookie.name+"="+cookie.value+"; ";}}}catch(e){yahooError(e);}
for(var i=0;i<ix;i++)
channel.setRequestHeader("Cookie-"+cookies[i][0],cookies[i][2],false);channel.asyncOpen(channelListener,null);}
if(url==null){var curpollinterval=this.pollinterval;this.setPollInterval(defaultPollTime);var alertD=this.localstorage.getObject("alert");if(alertD!=null){alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].alint!==undefined&&alertD[x].alint>0&&alertD[x].alint<this.pollinterval){this.setPollInterval(alertD[x].alint);}}}}
var ORalertD=this.localstorage.getObject("ORalert");if(ORalertD!=null){ORalertD=ORalertD.wrappedJSObject.object;if(ORalertD!==undefined){for(x in ORalertD){if(ORalertD[x].alint!==undefined&&ORalertD[x].alint>0&&ORalertD[x].alint<this.pollinterval){this.setPollInterval(ORalertD[x].alint);}}}}
if(curpollinterval<this.pollinterval){this.initAlertPoll();}else{this.setPollInterval(curpollinterval);}}}catch(e){yahooError(e);}},stopAlertTimer:function(mgr){mgr=mgr||this;if(mgr.timer!==null){mgr.timer.cancel();mgr.timer=null;}},createCustomRSSButtonJob:function(){try
{var _mFeedProcessor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);var _rssButtons=_mFeedProcessor.rssButtons.split(',');var winMediator=Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);var topWin=winMediator.getMostRecentWindow("navigator:browser");for(var i=0;i<_rssButtons.length;i++)
{if(_rssButtons[i].indexOf("@lbrss")==-1)
continue;var cusRSS=topWin.document.getElementById("yahoo-toolbar-"+_rssButtons[i]);if(cusRSS){this.setCutoRSSButtonJob(_rssButtons[i],cusRSS.getAttribute("yurl"));}
else{var rssHash=this.localstorage.getObject("yahoo-toolbar-"+_rssButtons[i]+".btn");rssHash=rssHash?rssHash.wrappedJSObject.object:null;if(rssHash){var funcUrl=rssHash.funcUrl;if(funcUrl&&funcUrl.slice(0,1)=='%'){funcUrl=funcUrl.slice(1);this.setCutoRSSButtonJob(_rssButtons[i],funcUrl);}}}}}
catch(e)
{yahooDebug(e+"          Error in createCustomRSSButtonJob "+_mFeedProcessor.rssButtons);}},setCutoRSSButtonJob:function(buttonID,url){var rssHash=this.localstorage.getObject("yahoo-toolbar-"+buttonID+".yhash");rssHash=rssHash?rssHash.wrappedJSObject.object:null;if(rssHash)
{if(rssHash.rssurl)
{url=unescape(rssHash.rssurl).replace("%s",escape(url));}}
var alertmgr=this;var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);if(url!=null)
var channel=iosvc.newChannel(url,0,null).QueryInterface(CI.nsIHttpChannel);var channelListener={stream:null,alertFeed:"",onStartRequest:function(request,context){this.alertFeed="";},onDataAvailable:function(request,context,inputStream,offset,count){if(!this.stream){this.stream=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);}
this.stream.init(inputStream);this.alertFeed+=this.stream.read(count);},onStopRequest:function(request,context,statusCode){try{yahooStopTrace("Fetch Alert Feed");if(this.stream){this.stream.close();}
request.QueryInterface(CI.nsIHttpChannel);if(this.alertFeed===""||request.status!==0){return;}
yahooStartTrace("Process Alert Feed");var uniconvert=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uniconvert.charset='utf-8';var alertData="";if(rssHash.conv&&(rssHash.conv==='1'))
{alertData=this.alertFeed;}
else
alertData=alertmgr.convertXMLAlertstoJSON(buttonID,this.alertFeed);try
{alertData=uniconvert.ConvertToUnicode(alertData);}
catch(e)
{}
alertData=alertData.replace(/\\t/g,"\\\\t");alertData=alertData.replace(/\ca/g,"\\u0001");alertData=alertData.replace(/\cb/g,"\\u0002");alertData=alertData.replace(/\cc/g,"\\u0003");alertData=alertData.replace(/\cd/g,"\\u0004");alertData=alertData.replace(/\ce/g,"\\u0005");alertData=alertData.replace(/\cf/g,"\\u0006");alertData=alertData.replace(/\cg/g,"\\u0007");alertData=alertData.replace(/\ch/g,"\\u0008");alertData=alertData.replace(/\ci/g,"\\u0009");alertData=alertData.replace(/\cn/g,"\\u000E");alertData=alertData.replace(/\co/g,"\\u000F");alertData=alertData.replace(/\cx/g,"\\u0018");alertData=alertData.replace(/\cy/g,"\\u0019");alertData=alertData.replace(/\x82/g,"\\u0082");alertData=alertData.replace(/\n/g,"");var haveAlerts=alertmgr.processJSONAlerts(alertData);if(haveAlerts){alertmgr.notifier.notifyObservers(null,"yahoo-feed-alerts-updated",alertmgr.currentpollids);}
yahooStopTrace("Process Alert Feed");}catch(e){yahooError(e);}
this.stream=null;}};channel.asyncOpen(channelListener,null);},addFullAlertData:function(alertid,value){var full_alertid=alertid+'_full';var alertData=this.localstorage.getObject(full_alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
alertData=JSON.stringify(value);this.localstorage.putObject(full_alertid,new WrapperClass(alertData));},addAlertData:function(alertid,value){if(typeof(value)==="string")
{value=JSON.parse(value);}
this.addFullAlertData(alertid,value);var alertData=this.localstorage.getObject(alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
if(alertData===null){alertData=[];}
var arr_idx='AE_'+alertid+'_';var arr_idx_key;for(key in value){arr_idx_key=arr_idx+key;if(typeof(value[key])=='string'){alertData[arr_idx]=value[key];}else{ivalue=value[key];if(key=='persist'){for(item in ivalue){this.setExtraParam(item,ivalue[item],true);}}else{var arr_idx_1;for(ikey in ivalue){arr_idx_1=arr_idx_key+'_'+ikey;if(typeof(ivalue[ikey])=='string'){alertData[arr_idx_1]=ivalue[ikey];}else{alertData[arr_idx_1]=JSON.stringify(ivalue[ikey]);var temp=JSON.stringify(ivalue[ikey]);}}}}}
this.localstorage.putObject(alertid,new WrapperClass(alertData));},addMultiObject:function(alertid,value){var alertData=this.localstorage.getObject(alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
if(alertData===null){alertData=[];}
for(key in value){alertData[value[key]['id']]=JSON.stringify(value[key]);}
this.localstorage.putObject(alertid,new WrapperClass(alertData));},addAlertObject:function(alertid,alertField,value){var alertData=this.localstorage.getObject(alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
if(alertData===null){alertData=[];}
alertData[alertField]=value.wrappedJSObject.object;this.localstorage.putObject(alertid,new WrapperClass(alertData));},compObj:function(obj1,obj2){if(yahooUtils.JSON.stringify(obj1)==yahooUtils.JSON.stringify(obj2))
return true;else
return false;},isSecureAlert:function(id){return this.securealertids.indexOf(id)!=-1;},refreshSecureAlertList:function(alertids){this.securealertids=alertids.split(",");},signedInAlertsOnSsl:function(bSAlertsOnSsl){this.bSignedInAlertsOnSsl=bSAlertsOnSsl;},allAlertsOnSsl:function(bSAlertsOnSsl){this.bAllAlertsOnSsl=bSAlertsOnSsl;},isGuestAlert:function(alertId)
{return this.guestAlertIds.indexOf(alertId)!=-1;},convertXMLAlertstoJSON:function(buttonID,alertData){var rssJSON={};var rssTemp={};var rssBlob={};var buttonNode="/rss/channel/pubDate^Clastupdated^B/rss/channel/lastBuildDate^Clastupdated^B/rss/channel/ttl^Cttl";var blobNode="/rss/channel/title^CsiteTitle^B/rss/channel/link^CsiteURL";var itemNode="/rss/channel/item^Bitems^Btitle^CitemTitle^Blink^CitemURL^Bmedia:content^Cimage^Bmedia:content/media:thumbnail^Cimage^BpubDate^CitemPD^Bdescription^CitemDesc^Bsource^CitemSource"
var content="";var parser=yahooCC["@mozilla.org/xmlextras/domparser;1"].createInstance(yahooCI.nsIDOMParser);var alertDataXML=parser.parseFromString(alertData,"text/xml");if(alertDataXML.tagName==="parserError")
{return"";}
else
{try
{var rssHash=this.localstorage.getObject("yahoo-toolbar-"+buttonID+".yhash");rssHash=rssHash?rssHash.wrappedJSObject.object:null;if(rssHash)
{if(rssHash.bval&&rssHash.bval!="")
{buttonNode=unescape(rssHash.bval).replace(/0002/g,"^B");buttonNode=buttonNode.replace(/0003/g,"^C");}
if(rssHash.bitems&&rssHash.bitems!="")
{itemNode=unescape(rssHash.bitems).replace(/0002/g,"^B");itemNode=itemNode.replace(/0003/g,"^C");}
if(rssHash.blobNodes&&rssHash.blobNodes!="")
{blobNode=unescape(rssHash.blobNodes).replace(/0002/g,"^B");blobNode=blobNode.replace(/0003/g,"^C");}}
rssJSON['id']=buttonID;var temp=buttonNode.split("^B");var nodes=null;var result=null;var nodeKeyVal="";var bIsDateWriiten=false;var val;for(val=0;val<temp.length;val++)
{nodeKeyVal=temp[val].split("^C");nodes=alertDataXML.evaluate(nodeKeyVal[0],alertDataXML,null,0,null);if(!nodes)
continue;result=nodes.iterateNext();if(result)
{var nodeval="";if(result.nodeType==CI.nsIDOMNode.ELEMENT_NODE&&result.firstChild)
nodeval=result.firstChild.nodeValue;else if(result.nodeType==CI.nsIDOMNode.TEXT_NODE)
nodeval=result.nodeValue;if(nodeKeyVal[1].indexOf("lastupdated")!=-1)
{if(bIsDateWriiten==true)
continue;nodeval=Date.parse(nodeval)/1000;bIsDateWriiten=true;}
rssJSON[nodeKeyVal[1]]=nodeval;}}
temp=blobNode.split("^B");var blobnodes=null;var blobResult=null;for(val=0;val<temp.length;val++)
{nodeKeyVal=temp[val].split("^C");blobnodes=alertDataXML.evaluate(nodeKeyVal[0],alertDataXML,null,0,null);if(!blobnodes)
continue;blobResult=blobnodes.iterateNext();if(blobResult)
{var nodeval="";if(blobResult.nodeType==CI.nsIDOMNode.ELEMENT_NODE&&blobResult.firstChild)
nodeval=blobResult.firstChild.nodeValue;else if(blobResult.nodeType==CI.nsIDOMNode.TEXT_NODE)
nodeval=blobResult.nodeValue;rssBlob[nodeKeyVal[1]]=nodeval;}}
temp=itemNode.split("^B");var itemnNodes=alertDataXML.evaluate(temp[0],alertDataXML,null,0,null);;var itemResult=itemnNodes.iterateNext();rssBlob[temp[1]]=[];while(itemResult)
{var nodeFound=false;var isImageParsed=false;for(val=2;val<temp.length;val++)
{nodeKeyVal=temp[val].split("^C");var nodes=null;try
{nodes=alertDataXML.evaluate(nodeKeyVal[0],itemResult,alertDataXML.createNSResolver(alertDataXML.documentElement),0,null);}
catch(e)
{continue;}
result=nodes.iterateNext();if(result)
{if(nodeKeyVal[1]=="image")
{if(isImageParsed)
continue;var imgQueryNode=["url","width","height"];var imgNodeName=["itemImg","imgWidth","imgHeight"];if(result.hasAttributes())
{for(var imgIndex=0;imgIndex<3;imgIndex++)
{var imgNode=result.attributes.getNamedItem(imgQueryNode[imgIndex]);if(imgNode)
{rssTemp[imgNodeName[imgIndex]]=imgNode.nodeValue;isImageParsed=true;}
else
isImageParsed=false;}}}
else
{var nodeval="";if(result.nodeType==CI.nsIDOMNode.ELEMENT_NODE&&result.firstChild)
nodeval=result.firstChild.nodeValue;else if(result.nodeType==CI.nsIDOMNode.TEXT_NODE)
nodeval=result.nodeValue;if(nodeKeyVal[1].indexOf("itemPD")!=-1)
{nodeval=Date.parse(nodeval)/1000;}
else if(nodeval.indexOf('<')>=0)
{var stripped=nodeval.replace(/(<([^>]+)>)/ig,"");if(stripped!='')
{nodeval=stripped;}}
rssTemp[nodeKeyVal[1]]=nodeval;}
nodeFound=true;}}
if(nodeFound)
rssBlob[temp[1]].push(rssTemp);rssTemp={};itemResult=itemnNodes.iterateNext();}}
catch(e)
{yahooError("Error In convertXMLAlertstoJSON:       "+e+"    rssJSON:   "+rssJSON);return"";}
rssJSON['blob']=rssBlob;rssTemp={};rssTemp['AE_205']=[];rssTemp['AE_205'].push(rssJSON);rssJSON={};rssJSON['alerts']=rssTemp;}
return yahooUtils.JSON.stringify(rssJSON);;},processJSONAlerts:function(alertFeed){try{var alertJSONCMPT=yahooUtils.JSON.parse(alertFeed);var override_data=[];var sameTTL=false;var currpolltime=this.pollinterval;var maxpolltime=defaultPollTime;var alertJSON=alertJSONCMPT["alerts"];for(fullalertid in alertJSON){var alertv=alertJSON[fullalertid];if((fullalertid=="AE_TTL_OVERRIDE")&&(this.compObj(this.ORobjPrev,alertv))==true)
sameTTL=true;if(fullalertid=="AE_TTL_OVERRIDE"){this.ORobjPrev=alertv;}
var keysplit=fullalertid.split('_');var alertid=parseInt(keysplit[1]);if(fullalertid=="AE_TTL_OVERRIDE"&&sameTTL==false){var alertOR=this.localstorage.getObject("ORalert");if(alertOR!==null){alertOR=undefined;this.localstorage.putObject("ORalert",new WrapperClass(alertOR));}
for(item in alertv)
{override_data=[];idsplit=item.split('_');if(idsplit.length>1){override_data["alrt"]=idsplit[0];override_data["btnid"]=item.substring(4);var fbtnid="yahoo-toolbar-"+override_data["btnid"];var yahooStr=this.localstorage.getObject(fbtnid);if(yahooStr!==null&&yahooStr.wrappedJSObject.object["alint"]!=null)
{yahooStr=yahooStr.wrappedJSObject.object["alint"];}
if(alertv[item]==0){var yahooStr=this.localstorage.getObject(fbtnid);if(yahooStr!==null&&yahooStr.wrappedJSObject.object["alint"]!=null)
{alertv[item]=yahooStr.wrappedJSObject.object["alint"];}
else
alertv[item]=this.pollinterval;}
else if(alertv[item]<30)
alertv[item]=30;override_data["alint"]=alertv[item];if(parseInt(alertv[item])<this.pollinterval)
{this.setPollInterval(parseInt(alertv[item]));}
if(parseInt(alertv[item])<maxpolltime)
maxpolltime=parseInt(alertv[item]);if(this.localstorage!=null){var alert_array=this.localstorage.getObject("ORalert");if(alert_array!=null){alert_array=alert_array.wrappedJSObject.object;}
if(alert_array==undefined){alert_array=[];}
alert_array.push(override_data);this.localstorage.putObject("ORalert",new WrapperClass(alert_array));}else{yahooDebug("Yahoo LocalStorage Failed");}}
else{var alertD=this.localstorage.getObject("alert");if(alertD===null){return;}
alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].alrt==item){if(alertv[item]==0)
alertv[item]=this.pollinterval;else if(alertv[item]<30)
alertv[item]=30;alertD[x].alint=alertv[item];}
if(parseInt(alertv[item])<this.pollinterval)
{this.setPollInterval(parseInt(alertv[item]));}
if(parseInt(alertv[item])<maxpolltime)
maxpolltime=parseInt(alertv[item]);}}}}}
else if(fullalertid=="defEP")
{for(item in alertv)
{this.setExtraParam(item,alertv[item],true);}}
else if(typeof alertv=="object"){if(alertid=='205'){for(var idx=0;idx<alertv.length;idx++){var bid="205_"+alertv[idx].id;this.addAlertData(bid,alertv[idx]);}}else{this.addAlertData(alertid,alertv);}}
else
{this.addAlertData(alertid,alertv);}}
if(currpolltime!=this.pollinterval){if(maxpolltime>this.pollinterval)
this.setPollInterval(maxpolltime);this.initAlertPoll();}
return true;}catch(e){yahooError("Error in processJSONAlerts"+e);if(this.retryCount<=MaxRetry){this.retryCount+=1;yahooError("Error in processJSONAlerts. Retry count : "+this.retryCount);var alertmgr=this;var callback={notify:function(timer){try{alertmgr.retrieveAlerts();}catch(e){yahooError(e);}}};this.timer=CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);this.timer.initWithCallback(callback,30*1000,this.timer.TYPE_REPEATING_PRECISE);}}},buildAlertUrl:function(alertids){var param;var url="";var _mConfigManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);var _mFeedProcessor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);var fnum=2;var fver=2;var time=new Date().getTime();var lang=_mConfigManager.getCharValue("installer.language")||"us";var cc=lang+".";var pc=_mConfigManager.getCharValue("toolbar.pc")||"";var tid=_mConfigManager.getCharValue("installer.toolbarID")||"";var cid=_mConfigManager.getCharValue("installer.corpID")||"";var cver=_mConfigManager.getCharValue("installer.version")||"1.1.0";var crumb=this.localstorage.getString("crumb");var ep=this.getExtraParams();var protocol="http:\/\/";var isOnlyCustomRssButtons=true;var bucketid=null;var isSecureChannelReq=false;if(this.bSignedInAlertsOnSsl==false)
{for(x in alertids){isSecureChannelReq=isSecureChannelReq||this.isSecureAlert(alertids[x]);}}
if(this.bSignedInAlertsOnSsl&&this.toolbarmanager.isGuestMode()!==true)
{isSecureChannelReq=true;}
if(this.bAllAlertsOnSsl)
{isSecureChannelReq=true;}
if(isSecureChannelReq){protocol="https:\/\/";}
if(_mConfigManager.isKeyPresent("disablehttps")&&_mConfigManager.getBoolValue("disablehttps")){protocol="http:\/\/";}
var toolbar_guid="";_mConfigManager.isYahooKey=false;if(_mConfigManager.isKeyPresent('yahoo.ytffp.installer._u')){_mConfigManager.isYahooKey=false;toolbar_guid=_mConfigManager.getCharValue('yahoo.ytffp.installer._u');}
if(!this.toolbarmanager.isGuestMode()&&(param=this.localstorage.getString("lang"))){lang=param;}
if(tid===""){tid="none";}
if(cver!==""){cver=cver.split(".");if(cver.length>3){cver.length=3;}
cver=cver.join("_");}
alertids=this.removedup(alertids);url=protocol+this.localstorage.getString("yahoo.ytff.dataserver.url")+"/glxy/v"+fver+"/alert?v="+cver+"&t="+time+"&.tguid="+toolbar_guid+"&.ta=cg"+tid+",cc"+cid+",ci"+lang+",cv"+cver+",cjs,cbm";if(this.alrtopenid!=null)
{url+="&_ids="+this.alrtopenid+",&.open[btn]="+this.slideoutopenid+"&.open[alrt]="+this.alrtopenid;}
else if(this.overrideRSSbtnids.length>0){url+="&_ids="+alertids.toString()+",&_rssbtns="+this.overrideRSSbtnids.toString();}
else
{var _rssButtons=_mFeedProcessor.rssButtons.split(',');var temprssButtons="";for(var i=0;i<_rssButtons.length;i++)
{if(_rssButtons[i]!=""&&_rssButtons[i].indexOf("@lbrss")==-1)
{temprssButtons+=_rssButtons[i];if(i<_rssButtons.length)
temprssButtons+=',';isOnlyCustomRssButtons=false;}}
url+="&_ids="+alertids.toString()+",&_rssbtns="+temprssButtons;}
if(this.slideoutopenid!=null)
{if(this.alrtopenid!=null&&this.alrtopenid=="210"){url+="&_tickbtns="+this.slideoutopenid;}}
else if(this.overrideTickbtnids.length>0){url+="&_tickbtns="+this.overrideTickbtnids.toString();}
else
{url+="&_tickbtns="+this.toolbarmanager.TickerManager.getTickerButtonIds();}
if(this.overrideParTickbtnids.length>0){url+="&_partickbtns="+this.overrideParTickbtnids.toString();}
else
{url+="&_partickbtns="+this.toolbarmanager.TickerManager.getParTickerButtonIds();}
if(crumb!==null){url+="&.crumb="+crumb;}
var toolbar_bucket="";if(_mConfigManager.isKeyPresent('toolbar.forcedbucket')){toolbar_bucket=_mConfigManager.getCharValue('toolbar.forcedbucket');}
if(toolbar_bucket=='')
{toolbar_bucket=this.localstorage.getString("vtestid");}
if(toolbar_bucket)
{url+="&tmpl="+toolbar_bucket;}
if(ep!==null){url+="&"+ep;}
if(alertids.toString()==""&&this.alrtopenid==null){url=null;}
if(isOnlyCustomRssButtons==true)
{try
{if(alertids.length==1&&alertids[0]=="205")
{url=null;}}
catch(e)
{yahooError(e);}}
return url;},removedup:function(alertids){alertids=alertids.sort();var uniqArr=[];var prev=null;var sopen=true;var configManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);if(configManager){configManager.isYahooKey=true;if(configManager.getBoolValue("buttons.close.yahoo-toolbar-grp_vert")!=null&&configManager.getBoolValue("buttons.close.yahoo-toolbar-grp_vert")==true){sopen=false;}
configManager.isYahooKey=false;}
for(x in alertids){if(prev==null){if((alertids[x]=="210"||alertids[x]=="211")&&sopen==false)
yahooDebug("Omitting 210/211 alert");else
uniqArr.push(alertids[x]);prev=alertids[x];}
if(prev!=alertids[x]){if((alertids[x]=="210"||alertids[x]=="211")&&sopen==false)
yahooDebug("Omitting 210/211 alert");else
uniqArr.push(alertids[x]);prev=alertids[x];}}
return uniqArr;},classID:Components.ID("{48dc5d59-2592-4bdb-8ed4-680c8ffc9f10}"),contractID:"@yahoo.com/alertmanager;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIRunnable,Components.interfaces.nsIYahooAlertManager])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooAlertManager]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooAlertManager]);