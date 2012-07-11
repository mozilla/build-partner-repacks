
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var yahooCC=CC;var yahooCI=CI;var yahooPrefService=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/utils.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooAlertManager(){try{this.localstorage=Components.classes["@yahoo.com/localstorage;1"].getService(Components.interfaces.nsIYahooLocalStorage);this.notifier=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);this.pollinterval=7*60;this.ep={};}catch(e){yahooError(e);}}
YahooAlertManager.prototype={timer:null,notifier:null,currentpollids:null,pollinterval:null,ep:null,toolbarmanager:null,slideoutopenid:null,alrtopenid:null,ORobjPrev:null,overrideRSSbtnids:[],overrideTickbtnids:[],overrideParTickbtnids:[],initAlerts:function(toolbarManager){try{yahooDebug("Initializing alerts .. ");this.toolbarmanager=toolbarManager;}catch(e){yahooError(e);}},initAlertPolltime:function(){yahooDebug("initalertpolltime"+this.pollinterval);var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);if(prefs.prefHasUserValue("yahoo.debug.polltime")){this.pollinterval=prefs.getIntPref("yahoo.debug.polltime");yahooDebug("took from about config"+this.pollinterval);}
else if(this.pollinterval>this.localstorage.getString("P2")){this.pollinterval=parseInt(this.localstorage.getString("P2"));}
this.initAlertPoll();},initAlertPoll:function(){try{if(this.pollinterval==0){this.pollinterval=7*60;}
yahooDebug("Initializing alert poll .. "+this.pollinterval);if(this.timer!==null&&this.timer.delay!=this.pollinterval){this.stopAlertTimer(this);}
var alertmgr=this;var callback={notify:function(timer){try{alertmgr.retrieveAlerts();}catch(e){yahooError(e);}}};this.timer=CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);this.timer.initWithCallback(callback,this.pollinterval*1000,this.timer.TYPE_REPEATING_PRECISE);}catch(e){yahooError(e);}},clearSignedinData:function(){try{yahooDebug("AlertManager ClearSignedindata :");var alertD=this.localstorage.getObject("alert");if(alertD!=null){alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].algst===undefined||alertD[x].algst==0){var alertObj=this.localstorage.getObject(alertD[x].alrt);if(alertObj!==null){alertObj=alertObj.wrappedJSObject.object;if(alertObj!==null){alertObj=undefined;this.localstorage.putObject(alertD[x].alrt,new WrapperClass(alertObj));}}}}}}}catch(e){yahooError("Exception in AlertManager:refreshOnCookieChange"+e);}},refreshAlert:function(alertids,refresh)
{yahooDebug("Refresh Alert");var alertids=alertids.wrappedJSObject.object;var updateflag=false;if(!refresh){for(x in alertids){if(alertids[x].match(new RegExp("^slideout-"))){this.alrtopenid=null;this.slideoutopenid=null;}
else
{alertObj=this.localstorage.getObject(alertids[x]);if(alertObj!==null){alertObj=undefined;this.localstorage.putObject(alertids[x],new WrapperClass(alertObj));}
updateflag=true;}}
if(updateflag){this.notifier.notifyObservers(null,"yahoo-feed-alerts-updated","");updateflag=false;}}else{for(x in alertids){if(alertids[x].match(new RegExp("^slideout-"))){var sp=alertids[x].split("-");this.alrtopenid=sp[1];this.slideoutopenid=sp[2];yahooDebug("open"+this.alrtopenid+this.slideoutopenid);}}
this.retrieveAlerts(alertids);}},broadcastAlert:function(ids){this.notifier.notifyObservers(null,"yahoo-feed-alerts-updated",ids);},setExtraParam:function(key,value,persist){if(persist){var configManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);if(configManager){var eps=configManager.getCharValue("alertmanager.ep");var ep={};if(eps!==null&&eps!=""){ep=yahooUtils.JSON.parse(eps);}
ep[key]=value;var epstring=yahooUtils.JSON.stringify(ep);configManager.setCharValue("alertmanager.ep",epstring,true);}}else{if(this.ep===null){this.ep={};}
this.ep[key]=value;}},getExtraParams:function(){var ep={};if(this.ep!=null){ep=this.ep;}
var configManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);var persistant_ep_string=configManager.getCharValue("alertmanager.ep");var persistant_ep={};if(persistant_ep_string!==null&&persistant_ep_string!=""){persistant_ep=yahooUtils.JSON.parse(persistant_ep_string);}
for(var e in ep){persistant_ep[e]=ep[e];}
var eps='';for(var i in persistant_ep){eps+="ep["+i+"]=";eps+=persistant_ep[i];eps+="&";}
this._resetExtraParams();return eps;},_resetExtraParams:function(){if(this.ep!=null){this.ep=null;}},retrieveAlerts:function(ids){try{yahooStartTrace("Triggering alerts");yahooDebug("Retriving Alerts..");var alertIds=[];var overridealertIds=[];this.overrideRSSbtnids=[];this.overrideTickbtnids=[];this.overrideParTickbtnids=[];var cookies=new Array();var ix=0;var alrt_210=false;var alrt_205=false;var alrt_211=false;if(ids){alertIds=ids;}else{var alertD=this.localstorage.getObject("alert");var ORalertD=this.localstorage.getObject("ORalert");if(alertD===null){return;}
alertD=alertD.wrappedJSObject.object;var alertids;var isGuestAlert;var alertints;if(alertD!==undefined){for(x in alertD){if((this.toolbarmanager.isGuestMode()!==true)||(this.toolbarmanager.isGuestMode()&&alertD[x].algst)){var pollthistime=false;if(alertD[x].slot===undefined||alertD[x].slot<=0){if(alertD[x].alint!==undefined){alertD[x].slot=Math.floor(alertD[x].alint/this.pollinterval)-1;if(alertD[x].slot<=0)pollthistime=true;}else{alertD[x].slot=Math.floor((7*60)/this.pollinterval)-1;if(alertD[x].slot<=0)pollthistime=true;}
yahooDebug("alert "+alertD[x].alrt+" slot "+alertD[x].slot);}else{alertD[x].slot=alertD[x].slot-1;if(alertD[x].slot<=0){pollthistime=true;}}
if(pollthistime===true){var aids=alertD[x].alrt;aids=aids.split(",");for(y in aids){alertIds.push(aids[y]);if(aids[y]=="210")
alrt_210=true;else if(aids[y]=="205")
alrt_205=true;else if(aids[y]=="211")
alrt_211=true;}}}
var aids=alertD[x].alco;if(aids){aids=aids.split("+");for(y in aids){var alco_value=aids[y];alco_value=alco_value.split(",");cookies[ix]=new Array();cookies[ix][0]=alco_value[0];cookies[ix][1]=alco_value[1];cookies[ix][2]="";ix++;}}}}else{yahooDebug("No Alert data");}
if(ORalertD!=null)
ORalertD=ORalertD.wrappedJSObject.object;if(ORalertD!==undefined){for(z in ORalertD){var pollthistime=false;if(ORalertD[z].slot===undefined||ORalertD[z].slot<=0){if(ORalertD[z].alint!==undefined){ORalertD[z].slot=Math.floor(ORalertD[z].alint/this.pollinterval)-1;if(ORalertD[z].slot<=0)pollthistime=true;}else{ORalertD[z].slot=Math.floor((7*60)/this.pollinterval)-1;if(ORalertD[z].slot<=0)pollthistime=true;}
yahooDebug("ORalert "+ORalertD[z].alrt+" slot "+ORalertD[z].slot);}else{ORalertD[z].slot=ORalertD[z].slot-1;if(ORalertD[z].slot<=0){pollthistime=true;}}
if(pollthistime===true){var aids=ORalertD[z].alrt;aids=aids.split(",");for(y in aids){if(aids[y]=="210"&&alrt_210==false){overridealertIds.push(aids[y]);this.overrideTickbtnids.push(ORalertD[z].btnid);}
else if(aids[y]=="205"&&alrt_205==false){overridealertIds.push(aids[y]);this.overrideRSSbtnids.push(ORalertD[z].btnid);}
else if(aids[y]=="211"&&alrt_211==false){overridealertIds.push(aids[y]);this.overrideParTickbtnids.push(ORalertD[z].btnid);}}}}}else{yahooDebug("No override Alert data");}}
yahooStopTrace("Triggering alerts");if(alertIds===""&&overridealertIds===""){yahooDebug("No alert to fetch,");return;}
yahooStartTrace("Fetch Alert Feed");this.currentpollids=alertIds.toString()+","+overridealertIds.toString();yahooDebug("current pollids"+this.currentpollids);var url=this.buildAlertUrl(alertIds.concat(overridealertIds));yahooDebug("Alert URL :"+url);var alertmgr=this;var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);if(url!=null)
var channel=iosvc.newChannel(url,0,null).QueryInterface(CI.nsIHttpChannel);;var channelListener={stream:null,alertFeed:"",onStartRequest:function(request,context){this.alertFeed="";},onDataAvailable:function(request,context,inputStream,offset,count){if(!this.stream){this.stream=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);}
this.stream.init(inputStream);this.alertFeed+=this.stream.read(count);},onStopRequest:function(request,context,statusCode){try{yahooStopTrace("Fetch Alert Feed");if(this.stream){this.stream.close();}
request.QueryInterface(CI.nsIHttpChannel);if(this.alertFeed===""||request.status!==0){return;}
yahooStartTrace("Process Alert Feed");var uniconvert=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uniconvert.charset='utf-8';this.alertFeed=uniconvert.ConvertToUnicode(this.alertFeed);var haveAlerts=alertmgr.processJSONAlerts(this.alertFeed);if(haveAlerts){alertmgr.notifier.notifyObservers(null,"yahoo-feed-alerts-updated",alertmgr.currentpollids);}
yahooStopTrace("Process Alert Feed");}catch(e){yahooError(e);}
this.stream=null;}};if(url!=null){try{var cookies_local=yahooCC["@mozilla.org/cookiemanager;1"].getService(yahooCI.nsICookieManager2);cookies_local=cookies_local.enumerator;while(cookies_local.hasMoreElements()){var cookie=cookies_local.getNext().QueryInterface(yahooCI.nsICookie);for(var i=0;i<ix;i++){var s=cookies[i][1]+"";if(s.indexOf("http://")!=-1)
s="."+s.substring(7);if(s==cookie.host.toString())
cookies[i][2]+=cookie.name+"="+cookie.value+"; ";}}}catch(e){yahooError(e);}
for(var i=0;i<ix;i++)
channel.setRequestHeader("Cookie-"+cookies[i][0],cookies[i][2],false);channel.asyncOpen(channelListener,null);}
if(url==null){var curpollinterval=this.pollinterval;this.pollinterval=7*60;var alertD=this.localstorage.getObject("alert");if(alertD!=null){alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].alint!==undefined&&alertD[x].alint>0&&alertD[x].alint<this.pollinterval){this.pollinterval=alertD[x].alint;}}}}
var ORalertD=this.localstorage.getObject("ORalert");if(ORalertD!=null){ORalertD=ORalertD.wrappedJSObject.object;if(ORalertD!==undefined){for(x in ORalertD){if(ORalertD[x].alint!==undefined&&ORalertD[x].alint>0&&ORalertD[x].alint<this.pollinterval){this.pollinterval=ORalertD[x].alint;}}}}
if(curpollinterval<this.pollinterval){this.initAlertPoll();}else{this.pollinterval=curpollinterval;}}}catch(e){yahooError(e);}},stopAlertTimer:function(mgr){mgr=mgr||this;if(mgr.timer!==null){mgr.timer.cancel();mgr.timer=null;}},addAlertData:function(alertid,index,value){var alertData=this.localstorage.getObject(alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
if(alertData===null){alertData=[];}
alertData[index]=value;this.localstorage.putObject(alertid,new WrapperClass(alertData));},addAlertObject:function(alertid,index,value){var alertData=this.localstorage.getObject(alertid);if(alertData!=null){if(alertData.wrappedJSObject.object!=undefined){alertData=alertData.wrappedJSObject.object;}else{alertData=null;}}
if(alertData===null){alertData=[];}
alertData[index]=value.wrappedJSObject.object;yahooDebug("addAD: alert"+alertid+" index : "+index+" data: "+alertData);this.localstorage.putObject(alertid,new WrapperClass(alertData));},compObj:function(obj1,obj2){if(yahooUtils.JSON.stringify(obj1)==yahooUtils.JSON.stringify(obj2))
return true;else
return false;},processJSONAlerts:function(alertFeed){try{yahooDebug(alertFeed);var alertJSON=yahooUtils.JSON.parse(alertFeed);var override_data=[];var sameTTL=false;var currpolltime=this.pollinterval;var maxpolltime=7*60;for(fullalertid in alertJSON){var alertv=alertJSON[fullalertid];if((fullalertid=="AE_TTL_OVERRIDE")&&(this.compObj(this.ORobjPrev,alertv))==true)
sameTTL=true;if(fullalertid=="AE_TTL_OVERRIDE"){this.ORobjPrev=alertv;}
var keysplit=fullalertid.split('_');var alertid=parseInt(keysplit[1]);var index=parseInt(keysplit[2]);if(fullalertid=="AE_TTL_OVERRIDE"&&sameTTL==false){var alertOR=this.localstorage.getObject("ORalert");if(alertOR!==null){alertOR=undefined;this.localstorage.putObject("ORalert",new WrapperClass(alertOR));}
for(item in alertv)
{override_data=[];yahooDebug("TTL"+item+alertv[item]);idsplit=item.split('_');if(idsplit.length>1){override_data["alrt"]=idsplit[0];override_data["btnid"]=item.substring(4);var fbtnid="yahoo-toolbar-"+override_data["btnid"];var yahooStr=this.localstorage.getObject(fbtnid);if(yahooStr!==null&&yahooStr.wrappedJSObject.object["alint"]!=null)
{yahooStr=yahooStr.wrappedJSObject.object["alint"];}
if(alertv[item]==0){var yahooStr=this.localstorage.getObject(fbtnid);if(yahooStr!==null&&yahooStr.wrappedJSObject.object["alint"]!=null)
{alertv[item]=yahooStr.wrappedJSObject.object["alint"];}
else
alertv[item]=this.pollinterval;}
else if(alertv[item]<30)
alertv[item]=30;override_data["alint"]=alertv[item];if(parseInt(alertv[item])<this.pollinterval)
this.pollinterval=parseInt(alertv[item]);if(parseInt(alertv[item])<maxpolltime)
maxpolltime=parseInt(alertv[item]);if(this.localstorage!=null){var alert_array=this.localstorage.getObject("ORalert");if(alert_array!=null){alert_array=alert_array.wrappedJSObject.object;}
if(alert_array==undefined){alert_array=[];}
alert_array.push(override_data);this.localstorage.putObject("ORalert",new WrapperClass(alert_array));}else{yahooDebug("Yahoo LocalStorage Failed");}}
else{var alertD=this.localstorage.getObject("alert");if(alertD===null){return;}
alertD=alertD.wrappedJSObject.object;if(alertD!==undefined){for(x in alertD){if(alertD[x].alrt==item){if(alertv[item]==0)
alertv[item]=this.pollinterval;else if(alertv[item]<30)
alertv[item]=30;alertD[x].alint=alertv[item];}
if(parseInt(alertv[item])<this.pollinterval)
this.pollinterval=parseInt(alertv[item]);if(parseInt(alertv[item])<maxpolltime)
maxpolltime=parseInt(alertv[item]);}}}}}
else if(fullalertid=="defEP")
{for(item in alertv)
{this.setExtraParam(item,alertv[item],true);}}
else if(alertid=="210"){var tmp="";for(btnid in alertv){tmp="210_"+btnid;this.addAlertObject(tmp,index,new WrapperClass(alertv[btnid]));}}
else if(alertid=="211"){var tmp="";for(btnid in alertv){tmp="211_"+btnid;this.addAlertObject(tmp,index,new WrapperClass(alertv[btnid]));}}
else if(typeof alertv=="object"){for(var idx=0;idx<alertv.length;idx++){var bid="205_"+alertv[idx].id;this.addAlertObject(bid,index,new WrapperClass(alertv[idx]));}}
else
{this.addAlertData(alertid,index,alertv);yahooDebug(alertid+alertv);}}
if(currpolltime!=this.pollinterval){if(maxpolltime>this.pollinterval)
this.pollinterval=maxpolltime;this.initAlertPoll();yahooDebug("chnaged poll time to"+this.pollinterval);}
return true;}catch(e){yahooError("Error in processJSONAlerts"+e);}},buildAlertUrl:function(alertids){var param;var url="";var _mConfigManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);var _mFeedProcessor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);var fnum=2;var fver=8;var time=new Date().getTime();var cc=(_mConfigManager.getCharValue("installer.country")+".")||"us.";var pc=_mConfigManager.getCharValue("toolbar.pc")||"";var tid=_mConfigManager.getCharValue("installer.toolbarID")||"";var cid=_mConfigManager.getCharValue("installer.corpID")||"";var lang=_mConfigManager.getCharValue("installer.language")||cc.substr(0,2);var cver=_mConfigManager.getCharValue("installer.version")||"1.1.0";var crumb=this.localstorage.getString("crumb");var ep=this.getExtraParams();var protocol="https:\/\/";if(_mConfigManager.isKeyPresent("disablehttps")&&_mConfigManager.getBoolValue("disablehttps")){protocol="http:\/\/";}
var toolbar_guid="";_mConfigManager.isYahooKey=false;if(_mConfigManager.isKeyPresent('yahoo.ytffp.installer._u')){_mConfigManager.isYahooKey=false;toolbar_guid=_mConfigManager.getCharValue('yahoo.ytffp.installer._u');}
if(!this.toolbarmanager.isGuestMode()&&(param=this.localstorage.getString("lang"))){lang=param;}
if(tid===""){tid="none";}
if(cver!==""){cver=cver.split(".");if(cver.length>3){cver.length=3;}
cver=cver.join("_");}
alertids=this.removedup(alertids);url=protocol+this.localstorage.getString("yahoo.ytff.dataserver.url")+"/slv/v"+fver+"/not?v="+cver+"&t="+time+"&.tguid="+toolbar_guid+"&.ta=cg"+tid+",cc"+cid+",ci"+lang+",cv"+cver+",cjs,cbm";if(this.alrtopenid!=null)
{url+="&_ids="+this.alrtopenid+",&.open[btn]="+this.slideoutopenid+"&.open[alrt]="+this.alrtopenid;}
else if(this.overrideRSSbtnids.length>0){yahooError(" rss alert id (nsYahooAlertManager.js) "+alertids.toString()+"  "+this.overrideRSSbtnids.toString());url+="&_ids="+alertids.toString()+",&_rssbtns="+this.overrideRSSbtnids.toString();}
else
{url+="&_ids="+alertids.toString()+",&_rssbtns="+_mFeedProcessor.rssButtons;}
if(this.slideoutopenid!=null)
{if(this.alrtopenid!=null&&this.alrtopenid=="210"){url+="&_tickbtns="+this.slideoutopenid;}}
else if(this.overrideTickbtnids.length>0){url+="&_tickbtns="+this.overrideTickbtnids.toString();}
else
{url+="&_tickbtns="+this.toolbarmanager.TickerManager.getTickerButtonIds();}
if(this.overrideParTickbtnids.length>0){url+="&_partickbtns="+this.overrideParTickbtnids.toString();}
else
{url+="&_partickbtns="+this.toolbarmanager.TickerManager.getParTickerButtonIds();}
if(crumb!==null){url+="&.crumb="+crumb;}
if(ep!==null){url+="&"+ep;}
yahooDebug("alrtid "+alertids.toString()+"   openid"+this.alrtopenid);if(alertids.toString()==""&&this.alrtopenid==null){yahooDebug("URL null : No Alert fetch");url=null;}
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