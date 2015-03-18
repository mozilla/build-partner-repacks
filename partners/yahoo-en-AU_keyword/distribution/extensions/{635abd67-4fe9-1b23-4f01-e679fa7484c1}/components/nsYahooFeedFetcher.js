
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var yahooPrefService=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");var eLoadType={NOT_LOADED:0x01,CACHE_LOADED:0x02,LIVE_LOADED:0x03};function YahooFeedFetcher(){var _self=this;var mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);var localstorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var mConfigMgr=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);var FEED_URL="";var loading=false;var loadedType=eLoadType.NOT_LOADED;var serverRaw="";var raw="";var secureKey="AvadaKedavra";var alertManager=CC["@yahoo.com/alertmanager;1"].getService(CI.nsIYahooAlertManager);var notifier=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);var stream=CC["@mozilla.org/intl/converter-input-stream;1"].createInstance(CI.nsIConverterInputStream);buildFeedUrl=function(isGuestMode){var url="";try{var param;var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var time=new Date().getTime();var preview=mConfigMgr.getBoolValue("toolbar.preview")||false;var lang=mConfigMgr.getCharValue("installer.language")||"us";var cc=lang;var pc=mConfigMgr.getCharValue("toolbar.pc")||"";var dc=mConfigMgr.getCharValue("toolbar.dc")||"";var tid=mConfigMgr.getCharValue("installer.toolbarID")||"";var cid=mConfigMgr.getCharValue("installer.corpID")||"";var cver=mConfigMgr.getCharValue("installer.version")||"2.0.0";var d_url="";var protocol="https:\/\/";var ep=alertManager.getExtraParams();if(mConfigMgr.isKeyPresent("dataserver.url")){d_url=mConfigMgr.getCharValue("dataserver.url");if(preview){d_url=d_url.replace("$CONFIG_INTL$","preview");}else{d_url=d_url.replace("$CONFIG_INTL$",cc);}}else{if(preview){d_url="preview.data.toolbar.yahoo.com"}else{d_url=cc+".data.toolbar.yahoo.com";}}
var layout="def";if(mConfigMgr.isKeyPresent("disablehttps")&&mConfigMgr.getBoolValue("disablehttps")){protocol="http:\/\/";}
if(prefs.prefHasUserValue("yahoo.ytff.toolbar.layout")&&prefs.getCharPref("yahoo.ytff.toolbar.layout")){layout=mConfigMgr.getCharValue("toolbar.layout");}
if(!isGuestMode&&(param=localstorage.getString("lang"))){lang=param;}
if(tid===""){tid="none";}
if(cver!==""){cver=cver.split(".");if(cver.length>3){cver.length=3;}
cver=cver.join("_");}
var vert=mConfigMgr.getCharValue('installer.activeVertical');var skinEnabled=mConfigMgr.getIntValue('general.enableskins');var skinrequest=mConfigMgr.getBoolValue('skin.request')||false;var showvert=mConfigMgr.getBoolValue('general.enableverticals');var userskininfo=mConfigMgr.getCharValue("toolbar.userskininfo");var jsonObj=null;if(userskininfo!=""){jsonObj=yahooUtils.JSON.parse(userskininfo);}
var skin="";if(skinEnabled==1){skin=mConfigMgr.getCharValue('general.selectedskincode');}else if(skinEnabled==2&&jsonObj&&jsonObj[vert]){skin=jsonObj[vert];}
var toolbar_guid="";mConfigMgr.isYahooKey=false;if(mConfigMgr.isKeyPresent('yahoo.ytffp.installer._u')){mConfigMgr.isYahooKey=false;toolbar_guid=mConfigMgr.getCharValue('yahoo.ytffp.installer._u');}
var toolbar_bucket="";if(mConfigMgr.isKeyPresent('toolbar.forcedbucket')){toolbar_bucket=mConfigMgr.getCharValue('toolbar.forcedbucket');}
var toolbar_offer="";if(mConfigMgr.isKeyPresent('toolbar.offer')){toolbar_offer=mConfigMgr.getCharValue('toolbar.offer');}
url=protocol+d_url+"/glxy/v1/feed"+"?&.pc="+pc+"&.dc="+dc+"&.a=0"+"&.ta=cg"+tid+",cc"+cid+",ci"+lang+",cv"+cver+",cp"+pc+",cbm,cjs"+"&.skinm="+skinEnabled+"&.skin="+skin+"&.lo="+layout+"&t="+time+"&.tguid="+toolbar_guid+"&.offer="+toolbar_offer;if(showvert)
url+="&.vert="+vert;if(mConfigMgr.isKeyPresent('toolbar.deflayout'))
{defLayout=mConfigMgr.getCharValue("toolbar.deflayout");if(defLayout)
url+="&.dlo="+defLayout;}
if(isGuestMode){var lu=0,lc=0,nf=0;if(mConfigMgr.isKeyPresent('toolbar.lastuse'))
{lu=elapsedDays(mConfigMgr.getCharValue('toolbar.lastuse'));}
else
{lu=-1}
if(mConfigMgr.isKeyPresent('toolbar.lastcust'))
lc=elapsedDays(mConfigMgr.getCharValue('toolbar.lastcust'));else
lc=-1;var nf=mConfigMgr.getIntValue('toolbar.numfeed');url+="&.lu="+lu+"&.lc="+lc+"&.nf="+nf;}
if(toolbar_bucket!=""){url+="&tmpl="+toolbar_bucket;}
url+="&.cspb=1";if(skinrequest){url+="&alrt=2";mConfigMgr.setBoolValue('skin.request',false,true);}
if(ep!==null){url+="&"+ep;}}catch(e){yahooError("Error in buildFeedUrl : "+e);}
return url;};elapsedDays=function(date){if(date){return Math.round((new Date().getTime()-new Date(date).getTime())/86400000);}else{return-1;}};calculateYBCacheSig=function(){try{var cacheblobfile=mFileIO.getUserCacheDir();cacheblobfile.appendRelativePath("ybcache");if(cacheblobfile.exists()){var fileContent=mFileIO.readFile(cacheblobfile);var sig=yahooUtils.MD5Hash(fileContent);return sig;}
return null;}catch(e){yahooError("Error in calculateYBCacheSig"+e);}},calculateperButtonYBCacheSig=function(bid){try{var cacheblobfile=mFileIO.getUserCacheDir();cacheblobfile.appendRelativePath(bid);if(cacheblobfile.exists()){var fileContent=mFileIO.readFile(cacheblobfile);fileContent=fileContent.replace(/\\\"/g,"\"");fileContent=fileContent.replace(/\\\\/g,'\\');var sig=yahooUtils.MD5Hash(fileContent);return sig;}
return null;}catch(e){yahooError("Error in calculateperButtonYBCacheSig"+e);}},calculateCacheSig=function(){try{var cacheblobfile=mFileIO.getUserCacheDir();cacheblobfile.appendRelativePath("cachesection");if(cacheblobfile.exists()){var fileContent=mFileIO.readFile(cacheblobfile);var sig=yahooUtils.MD5Hash(fileContent);return sig;}else{}
return null;}catch(e){yahooError("Error in calculateCacheSig"+e);}},toolbarLoadRestart=function(seconds){yahooUtils.setTimeout(function(){_self.asyncLoadServerFeed();},1000*seconds);};this.setSecureKey=function(key){secureKey=key;}
this.asyncLoadServerFeed=function(isGuestMode,cbFunc,cbFail){var callBackFunc=cbFunc.wrappedJSObject.object,callBackFail=(cbFail)?cbFail.wrappedJSObject.object:null;if(loading){if(callBackFail){callBackFail();}
return"";}
loading=true;FEED_URL=buildFeedUrl(isGuestMode);var postData='';var isPost=false;var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var layout="";if(prefs.prefHasUserValue("yahoo.ytff.toolbar.layout")&&prefs.getCharPref("yahoo.ytff.toolbar.layout")){layout=mConfigMgr.getCharValue("toolbar.layout");}
var yob=CC['@yahoo.com/feed/localbutton;1'].getService(CI.nsIYahooLocalButtonProcessor).getLocalRSSButtonsJSON(layout);if(yob!=""){isPost=true;postData=".yob="+encodeURIComponent(yob);}
var feedContent=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);if(!isPost){feedContent.open("GET",FEED_URL,true);}else{feedContent.open("POST",FEED_URL,true);}
var usedButtons=mConfigMgr.getCharValue('ybButtons.used');var prefSrvc=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);if(prefSrvc.prefHasUserValue("yahoo.ytff.ybButtons.used")){prefSrvc.clearUserPref("yahoo.ytff.ybButtons.used");}
if(usedButtons)
{var splitButtons=usedButtons.split(",");var sig="",headerSig="";for(var i=0;i<splitButtons.length;i++)
{sig=calculateperButtonYBCacheSig(splitButtons[i]);headerSig="YTBSig_yb_"+splitButtons[i];if(sig!=null)
feedContent.setRequestHeader(headerSig,sig);}}
feedContent.setRequestHeader("YTBSig_p_p",calculateCacheSig());feedContent.setRequestHeader("Content-Type","application/x-www-form-urlencoded");feedContent.onreadystatechange=function(aEvt){if(feedContent.readyState==4){if(feedContent.status==200){serverRaw=feedContent.responseText;var httpResponsestatus=-1;var Errorstate=0;try{if(serverRaw===""){}
var ding=yahooUtils.JSON.parse(serverRaw);if(!ding){throw"Error in Fetching Feed from server";}
var feed={};feed.v=ding.v;Errorstate=61;feed.p=ding.p;Errorstate=62;feed.y=ding.y;Errorstate=63;feed.u=ding.u;Errorstate=7;feed=yahooUtils.JSON.stringify(feed);if(feed&&(raw!=serverRaw)){raw=serverRaw;loadedType=eLoadType.LIVE_LOADED;Errorstate=4;if(mConfigMgr.getCharValue('installer.activeVertical')!=""){var file=mFileIO.getUserCacheDir();mFileIO.writeFile(file,feed);Errorstate=9;}
if(mConfigMgr.getBoolValue("feedcaching")===true){var file=mFileIO.getUserCacheDir();file.appendRelativePath("feed");Errorstate=13;mFileIO.writeFile(file,feed);Errorstate=14;}}
else{Errorstate=15;}
var val=0;if(mConfigMgr.isKeyPresent('toolbar.numfeed'))
val=mConfigMgr.getIntValue('toolbar.numfeed');val++;mConfigMgr.setIntValue('toolbar.numfeed',val,true);}catch(e){var feedsizeafterstripKey=0;var sections="sections=";if(raw!==undefined&&raw!=null)
feedsizeafterstripKey=raw.length;var feedsize=0;if(serverRaw!==undefined&&serverRaw!=null)
{feedsize=serverRaw.length;if(serverRaw.match(/\"v\":\[/)!==null)
sections+="v";if(serverRaw.match(/\"p\":\[/)!==null)
sections+="p";if(serverRaw.match(/\"y\":\[/)!==null)
sections+="y";if(serverRaw.match(/\"u\":\[/)!==null)
sections+="u";if(serverRaw.match(/\"s\":\[/)!==null)
sections+="s";}
yahooError("Error Feed Data            "+raw);raw="";loadedType=eLoadType.NOT_LOADED;yahooError(e);_self.SendFeedFailureErrorReport("405: "+e+",Errorstate="+Errorstate+",Statue_Code="+httpResponsestatus+",Feed_Size="+feedsize+",Feed_Size_After_stripKey="+feedsizeafterstripKey+","+sections);notifier.notifyObservers(null,"yahoo-feed-error","405: "+e);}finally{loading=false;if(callBackFunc)
callBackFunc(serverRaw);}}
else if(callBackFail){loading=false;callBackFail();}}}
if(!isPost){feedContent.send(null);}else{feedContent.send(postData);}};this.loadCachedFeed=function(localCacheFile){if(loading){return;}
yahooStartTrace("LoadCachedFeed");var inStream,handle;var success=false;loading=true;try{if(localCacheFile!=null){loadedType=eLoadType.CACHE_LOADED;var file=mFileIO.getUserCacheDir();file.appendRelativePath(localCacheFile);var fileRaw=mFileIO.readFile(file);if(!fileRaw||fileRaw===""){}else{success=true;}
raw=fileRaw;}}catch(e){raw="";loadedType=eLoadType.NOT_LOADED;yahooError(e.message);_self.SendFeedFailureErrorReport("403: "+e);notifier.notifyObservers(null,"yahoo-feed-error","403: "+e);}finally{loading=false;if(!success)
{raw=mFileIO.readChromeContentFile("canned.feed");}
yahooStopTrace("LoadCachedFeed");return raw;}};this.pushLayoutToServer=function(userSave,layout,isGuestMode,cbFunc)
{try{if(isGuestMode){return 0;}
var intl=mConfigMgr.getCharValue("installer.language")||"us";var pc=mConfigMgr.getCharValue("toolbar.pc")||"";var port=mConfigMgr.getCharValue("layout.portable");var metroExp=localstorage.getString("metroexp");var cver=mConfigMgr.getCharValue("installer.version")||"2.0.0";var tipShown=localstorage.getString("tipshown");var udboffer=localstorage.getString("udboffer");if(cver!==""){cver=cver.split(".");if(cver.length>3)cver.length=3;cver=cver.join("_");}
var lo=layout;var crumb=localstorage.getString("crumb");var yob=CC['@yahoo.com/feed/localbutton;1'].getService(CI.nsIYahooLocalButtonProcessor).getLocalButtonsJSON(layout);var syob="";var toolbarConfigServer=localstorage.getString("yahoo.ytff.dataserver.url");var pslayURL="https:\/\/"+toolbarConfigServer
+"/config/pslay/?"
+"&.pc="+pc
+"&.intl="+intl
+"&.cver="+"8_0_0"
+"&.lo="+lo
+"&.crumb="+crumb
+"&usave="+userSave
+"&.port="+port
+"&.metroexp="+metroExp
+"&.udboffer="+udboffer
+"&.merge=1";if(tipShown=="1"){pslayURL+="&.yapbtnclear=1";localstorage.putString("tipshown","0");}
var postData="";if(yob!=null&&yob.length>0)postData=".yob="+encodeURIComponent(yob);if(syob!=null&&syob.length>0)postData+="&.syob="+syob;var request=CC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(CI.nsIXMLHttpRequest);request.open("POST",pslayURL,true);request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");request.onreadystatechange=function(aEvt){if(request.readyState==4){if(request.status==200){if(cbFunc){_self.asyncLoadServerFeed(isGuestMode,cbFunc);}}
return request.status;}};request.send(postData);}catch(e){yahooError("Exception in pushLayoutToServer "+e)}};this.SendFeedFailureErrorReport=function(data)
{try{var cc=mConfigMgr.getCharValue("installer.language")||"us";var d_url="";var protocol="https:\/\/";if(mConfigMgr.isKeyPresent("dataserver.url")){d_url=mConfigMgr.getCharValue("dataserver.url");d_url=d_url.replace("$CONFIG_INTL$",cc);}else{d_url=cc+".data.toolbar.yahoo.com";}
var reportData=protocol+d_url+"/cltrpt.html";reportData+="?&.layout=";reportData+=mConfigMgr.getCharValue('toolbar.layout');reportData+="&.errorcode=";reportData+=encodeURIComponent(data);reportData+="&.isCachedFeed=";var cachedfile=mFileIO.getUserCacheDir();cachedfile.appendRelativePath("feed");if(cachedfile.exists())
reportData+="true";else
reportData+="false"
reportData+="&.intl=";reportData+=mConfigMgr.getCharValue('installer.language');reportData+="&.cv=";if(mConfigMgr.isKeyPresent("installer.version"))
{reportData+=mConfigMgr.getCharValue('installer.version').replace(/\./g,'_');}
reportData+="&.pc=";reportData+=mConfigMgr.getCharValue("toolbar.pc")||"";var request=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);request.open("GET",reportData,true);request.send(null);}
catch(e){yahooDebug("error in SendFeedFailureErrorReport:"+e);}};};YahooFeedFetcher.prototype={classID:Components.ID("{4138788A-68DF-4cb5-B6F9-E50DE9C70708}"),contractID:"@yahoo.com/feed/fetcher;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIStreamListener,Components.interfaces.nsIYahooFeedFetcher])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooFeedFetcher]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooFeedFetcher]);