
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var loader=Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/installerVariables.js");function YahooToolbarManager(){var _self=this;var _mInitialized=false;var _mFeedProcessor=null;var _mConfigManager=null;var _mYTLogger=null;var _mYahooFileIO=null;var _mCacheDir=null;var _mCacheFile=null;var _mBlindYID=null;var _mIsGuest=true;var _mChachedXUL=null;var _mDoPostFirstPageLoad=false;var _mPluginManager=null;function _doPostInit(){yahooStartTrace("ToolbarManager_PostInit");try{var d_url=_mConfigManager.getCharValue("dataserver.url");var c_url=_mConfigManager.getCharValue("configserver.url");var lang=_mConfigManager.getCharValue("installer.language");if(lang==""){lang="us";}
d_url=d_url.replace("$CONFIG_INTL$",lang);c_url=c_url.replace("$CONFIG_INTL$",lang);yahooDebug("dataserver url:"+d_url+"config server url:"+c_url);_mLocalStorage.putString("yahoo.ytff.dataserver.url",d_url);_mLocalStorage.putString("yahoo.ytff.configserver.url",c_url);var dir=_mConfigManager.getCharValue("debug.dir");if(dir)
_mLocalStorage.putString("dir",dir);_mChachedXUL=_loadCachedXul();Components.classes["@yahoo.com/navassist;1"].getService(Components.interfaces.nsIYahooNavAssist).initialize();Components.classes["@yahoo.com/singleinstance;1"].getService(Components.interfaces.nsIYahooMailSingleInstance).initialize();}catch(e){yahooError("_doPostInit"+e);}
yahooStopTrace("ToolbarManager_PostInit");};function _writeXulFile(){try{var toolbar=_mFeedProcessor.domBuilder.toolbar;if(!toolbar){return;}
var xul=yahooUtils.dumpXUL(toolbar,0);toolbar=null;xul=xul.replace(new RegExp("\x01","g"),"&#01;");xul=xul.replace(new RegExp("\x02","g"),"&#02;");xul=xul.replace(new RegExp("\x03","g"),"&#03;");xul=xul.replace(new RegExp("\x04","g"),"&#04;");xul=xul.replace(new RegExp("&","g"),"&amp;")
xul=xul.replace(new RegExp("\\?","g"),"&#63;")
xul=xul.replace(new RegExp("\\$","g"),"&#36;");xul=xul.replace(new RegExp("#document-fragment","g"),"toolbar");xul='<?xml version="1.0"  encoding="utf-8" ?>'+xul;xul=xul.replace(/class="chromeclass-toolbar"/,"");var file=_mYahooFileIO.getUserCacheDir();file.appendRelativePath("ytoolbar.xml");_mYahooFileIO.writeFile(file,xul);}catch(e){yahooError(e);}};function _loadCachedXul(){try{if(_mChachedXUL){yahooDebug("Loading toolbar from cached Xul");return _mChachedXUL;}else{var retFrag="";var idir=_mYahooFileIO.getUserCacheDir();idir.appendRelativePath("ytoolbar.xml");var xmlContent=_mYahooFileIO.readFile(idir);if(xmlContent){var parser=Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);var toolbarxml=parser.parseFromString(xmlContent,"text/xml");var xslfile=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);xslfile.open("GET","chrome://ytoolbar/skin/transform.xsl",true);xslfile.onreadystatechange=function(aEvt){if(xslfile.readyState==4){if(xslfile.status==200){var processor=Components.classes["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Components.interfaces.nsIXSLTProcessor);processor.importStylesheet(xslfile.responseXML);var domDocument=Components.classes["@mozilla.org/xul/xul-document;1"].createInstance(Components.interfaces.nsIDOMDocument);var ownerDocument;if(Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).platformVersion.split(".")[0]>"1"){var sysPrincipal=Components.classes['@mozilla.org/systemprincipal;1'].createInstance(Components.interfaces.nsIPrincipal);var domParser=Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParserJS);domParser.init(sysPrincipal,null,null);ownerDocument=domParser.parseFromString("<?xml version=\"1.0\" encoding=\"utf-8\"?> <overlay xmlns=\"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul\" xmlns:svg=\"http://www.w3.org/2000/svg\" />","text/xml");}else{ownerDocument=Components.classes["@mozilla.org/xul/xul-document;1"].createInstance(Components.interfaces.nsIDOMDocument).implementation.createDocument("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","overlay",null);}
var idocumentFragment=processor.transformToFragment(toolbarxml,ownerDocument);var fc=idocumentFragment.firstChild;idocumentFragment.removeChild(idocumentFragment.firstChild);retFrag=idocumentFragment.cloneNode(false);retFrag.appendChild(fc.firstChild);}
else
yahooError("error :: _loadCachedXul ");}};xslfile.send(null);return retFrag;}}}catch(e){yahooError("loadXulCache:"+e);}
return null;};function _createCacheDir(){try{_mCacheDir=_mYahooFileIO.getUserCacheDir();_mCacheFile=_mCacheDir.clone().QueryInterface(Components.interfaces.nsILocalFile);_mCacheFile.setRelativeDescriptor(_mCacheDir,"feed");}catch(e){yahooError(e);}};function _checkCookies(){_mBlindYID=yahooNetUtils.getBlindYID();if(!_mCacheDir){_createCacheDir();}
_mIsGuest=true;if(_mBlindYID!=="default"){_mIsGuest=false;}
_mCacheDir=_mYahooFileIO.getUserCacheDir();_mCacheFile=_mCacheDir.clone().QueryInterface(Components.interfaces.nsILocalFile);_mCacheFile.appendRelativePath("feed");_self.BookmarkManager.createBM2CacheFile(_mCacheDir);};function _cacheFeed(){try{var rawFeed=_mFeedProcessor.raw;if(rawFeed){try{_checkCookies();if(_mCacheFile===null){return;}
if(!_mCacheFile.exists()){_mCacheFile.create(_mCacheFile.NORMAL_FILE_TYPE,0666);}
var out=Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);out.init(_mCacheFile,0x20|0x02,00666,null);out.write(rawFeed,rawFeed.length);out.flush();out.close();yahooDebug("Inside cacheFeed Writing :"+_mCacheFile);}catch(e){yahooError(e);}}}catch(e){yahooError("_cacheFeed error : "+e);}};function _addListeners(feedProcessor,alertmgr,configmgr){var _ytbmgr=this;var ytbObserver={_observing:["cookie-changed","em-action-requested","quit-application-granted","yahoo-feed-updated","private-browsing"],prefSrvc:Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),obsSrvc:Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),localstorage:Components.classes["@yahoo.com/localstorage;1"].getService(Components.interfaces.nsIYahooLocalStorage),yahooUninstalled:false,yahooUninstallTracked:false,feedProc:null,alertmgr:null,configmgr:null,yahooUninstallTracked:false,yCookieChanged:false,tCookieChanged:false,notifier:Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),observe:function(subject,topic,data){try{if(topic=="cookie-changed"){yahooUtils.setTimeout(function(){var cookie=subject.QueryInterface(Components.interfaces.nsICookie);if(cookie.host!='.yahoo.com'){return;}
if(cookie.name=='Y'){ytbObserver.yCookieChanged=true;}else if(cookie.name=='T'){ytbObserver.tCookieChanged=true;}
if(ytbObserver.yCookieChanged&&ytbObserver.tCookieChanged){yahooDebug("Cookie Change detected. Triggering Toolbar refresh.");_checkCookies();ytbObserver.tCookieChanged=false;ytbObserver.yCookieChanged=false;try{ytbObserver.alertmgr.clearSignedinData();ytbObserver.feedProc.processServerFeed();}catch(e){yahooError("Error "+e);}}},5);}
else if(topic=="private-browsing"){yahooUtils.setTimeout(_self.refreshToolbar,5);}
else if(topic=="em-action-requested"){yahooUtils.setTimeout(function(){subject.QueryInterface(Components.interfaces.nsIUpdateItem);if(subject.id=="{635abd67-4fe9-1b23-4f01-e679fa7484c1}"){if(data=="item-uninstalled"){ytbObserver.yahooUninstalled=true;}else if(data=="item-cancel-action"){ytbObserver.yahooUninstalled=false;}}},5);}
else if(topic=="quit-application-granted"){yahooUtils.setTimeout(function(){if(ytbObserver.yahooUninstalled&&!ytbObserver.yahooUninstallTracked){var server=ytbObserver.localstorage.getString("server");var lang=ytbObserver.localstorage.getString("lang");var param;if(ytbObserver.localstorage&&(param=ytbObserver.localstorage.getString("lang"))){lang=param;}
var channel=ytbObserver.localstorage.getString("channel");var nd=ytbObserver.localstorage.getString("nd");var trackRemove=ytbObserver.localstorage.getString("trackRemove");try{var url="http://"+server+"/moz/"+trackRemove+"/"+lang+"/"+channel+"/"+nd+"/*http://us.yimg.com/i/sh/bl.gif";var request=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);request.open("GET",url,true);request.onreadystatechange=function(aEvt){if(request.readyState==4){}};request.send(null);}catch(e){}
ytbObserver.yahooUninstallTracked=true;var uninstallExePath=ytbObserver.configmgr.getCharValue("toolbar.uninstall");if(uninstallExePath&&uninstallExePath!=""){try{yahooDebug("uninstall path found, value = "+uninstallExePath);var uninstallExe=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);uninstallExe.initWithPath(uninstallExePath);if(uninstallExe.exists()){yahooDebug("Uninstall found going to launch it");uninstallExe.launch();}}catch(e){yahooDebug(e);}}
var prefvalues=["yahoo.search.highlight","yahoo.supports.livesearch"];prefvalues.forEach(function(value){if(ytbObserver.prefSrvc.prefHasUserValue(value)){ytbObserver.prefSrvc.clearUserPref(value);}},ytbObserver);_mYahooFileIO.cleanupCache();configmgr.cleanUp();_mPluginManager.unloadPartners(true);}},5);_mPluginManager.unloadPartners(true);}else if(topic=="yahoo-feed-updated"){yahooUtils.setTimeout(function(){yahooDebug("Got yahoo-feed-updated");try{ytbObserver.notifier.notifyObservers(ytbObserver,"yahoo-toolbarxul-updated",null);if((ytbObserver.configmgr.getBoolValue("xulcaching")===true)){yahooDebug("Writing to xul cache");_writeXulFile();_mChachedXUL=null;_mChachedXUL=_loadCachedXul();}
if(ytbObserver.configmgr.getBoolValue("filefeedcaching")){yahooDebug("Writing cached feed");_cacheFeed();}}catch(e){yahooError("error "+e);}},5);}
else if(data&&data.indexOf("yahoo.ytff.options")>-1){yahooUtils.setTimeout(function(){if(data=="yahoo.ytff.options.iconsonly"){ytbObserver.feedProc.domBuilder.iconsOnly=_mConfigManager.getBoolValue("options.iconsonly");}},5);}}catch(e){ytbDebug("error"+e);}},register:function(fp,alertmanager,configmgr){this.feedProc=fp;this.alertmgr=alertmanager;this.configmgr=configmgr;this._observing.forEach(function(topic){this.obsSrvc.addObserver(this,topic,false);},this);var pref=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch2);pref.addObserver("yahoo.ytff.options",this,false);}};ytbObserver.register(feedProcessor,alertmgr,configmgr);var listener={onUninstalling:function(addon){if(addon.id=="{635abd67-4fe9-1b23-4f01-e679fa7484c1}"){ytbObserver.yahooUninstalled=true;}},onOperationCancelled:function(addon){if(addon.id=="{635abd67-4fe9-1b23-4f01-e679fa7484c1}"){ytbObserver.yahooUninstalled=false;}}};try{Components.utils.import("resource://gre/modules/AddonManager.jsm");AddonManager.addAddonListener(listener);}catch(e){}};this.LocalButtonProcessor=null;this.DOMBuilder=null;this.BookmarkManager=null;this.AlertManager=null;this.EventTipManager=null;this.TickerManager=null;this.NavAssist=null;this.isGuestMode=function(){return _mIsGuest;};this.isFeedLoaded=function(){return _mFeedProcessor.loaded;};this.initializeToolbar=function(){yahooStartTrace("ToolbarManager_InitToolbar");yahooDebug("initialize Toolbar...");if(_mInitialized==false){try{_mYahooFileIO=Components.classes["@yahoo.com/fileio;1"].getService(Components.interfaces.nsIYahooFileIO2);_mLocalStorage=Components.classes["@yahoo.com/localstorage;1"].getService(Components.interfaces.nsIYahooLocalStorage);_mConfigManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);_self.AlertManager=Components.classes["@yahoo.com/alertmanager;1"].getService(Components.interfaces.nsIYahooAlertManager);_self.AlertManager.initAlerts(this);_mFeedProcessor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);_mFeedProcessor.init(this);_self.LocalButtonProcessor=_mFeedProcessor.localButtonProcessor;_self.DOMBuilder=_mFeedProcessor.domBuilder;_self.BookmarkManager=_mFeedProcessor.bookmarkManager;_self.EventTipManager=Components.classes["@yahoo.com/eventtipmanager;1"].getService(Components.interfaces.nsIYahooEventTipManager);_self.EventTipManager.init(this);_self.TickerManager=Components.classes["@yahoo.com/tickermanager;1"].getService(Components.interfaces.nsIYahooTickerManager);_self.TickerManager.init(this);_self.NavAssist=Components.classes["@yahoo.com/navassist;1"].getService(Components.interfaces.nsIYahooNavAssist);_self.NavAssist.initialize();_mPluginManager=Components.classes["@yahoo.com/ypluginmanager;1"].getService(Components.interfaces.nsIYahooPluginManager);if(_mFeedProcessor.loaded==false){}else{yahooDebug("Feed Processor already loaded");}
_checkCookies();_mInitialized=true;}catch(e){yahooError(e);}
yahooStopTrace("ToolbarManager_InitToolbar");}};this.shutdown=function(){if(_mInitialized){yahooToolbarLogger.yahooShutdown();_mInitialized=false;Components.classes["@yahoo.com/singleinstance;1"].getService(Components.interfaces.nsIYahooMailSingleInstance).uninitialize();}};this.getLayoutButtons=function(groupID){return _mFeedProcessor.getLayout(groupID);};this.getGroupButtonId=function(){return _mFeedProcessor.domBuilder.groupId;}
this.getLayoutForType=function(buttonType){return _mFeedProcessor.getLayoutForType(buttonType);};this.setLayoutButtons=function(layout,groupID){var date=new Date().toUTCString();_mConfigManager.setCharValue('toolbar.lastcust',date,true);_mConfigManager.setIntValue('toolbar.numfeed',0,true);_mFeedProcessor.setLayout(layout,groupID);};this.addButton=function(buttonID){var layout=buttonID;layout+=(_self.getLayoutButtons("grp_fav")!="")?",":"";layout+=_self.getLayoutButtons("grp_fav");_self.setLayoutButtons(layout,"grp_fav");};this.removeButton=function(buttonID){var layout=_self.getLayoutButtons("grp_fav");var tempLayout=","+layout+",";var index=tempLayout.indexOf(","+buttonID+",");if(index==0){layout=layout.substr(buttonID.length+1);}else if(index>0){layout=layout.substring(0,index-1)+layout.substr(index+buttonID.length);}
_self.setLayoutButtons(layout,"grp_fav");};this.getToolbarXUL=function(){if(_mFeedProcessor&&_mFeedProcessor.loaded){yahooDebug("Loading xul from feedprocessor.");return _mFeedProcessor.domBuilder.toolbar;}else if(_mConfigManager.getBoolValue("xulcaching")){yahooDebug("Trying to load cached xul");return _loadCachedXul();}
return null;};this.getBookmark=function(){return _mFeedProcessor.domBuilder.bookmarks;};this.getSkinData=function(){var retData='{}';if(_mConfigManager.getIntValue('general.enableskins')!=0)
{var skinData=_mFeedProcessor.domBuilder.skinData;if(skinData)
retData='{"params":'+skinData+'}';}
return retData;};this.refreshBookmark=function(){yahooUtils.setTimeout(function(){_mFeedProcessor.bookmarkManager.processBookmarks(true);},5);};this.refreshToolbar=function(){_mFeedProcessor.processServerFeed();};this.saveAndRefreshToolbar=function(){_mFeedProcessor.saveAndReload();};this.saveToUDB=function(){_mFeedProcessor.saveToUDB();};this.doPostFirstPageLoad=function(){try{if(_mDoPostFirstPageLoad==false){_mCacheFeedProcessor=Components.classes["@yahoo.com/feed/processor;1"].getService(Components.interfaces.nsIYahooFeedProcessor);_mCacheFeedProcessor.processCachedFeed("feed");yahooUtils.setTimeout(function(){_mFeedProcessor.processServerFeed();},10);_mDoPostFirstPageLoad=true;}}catch(e){yahooError("ToolbarManager::_doPostFirstPageLoad :"+e);}};this.observe=function(aSubject,aTopic,aData){return;};try{this.initializeToolbar();_doPostInit();_addListeners(_mFeedProcessor,this.AlertManager,_mConfigManager);}catch(e){yahooError("Error initializing Toolbar : "+e);}};YahooToolbarManager.prototype={classID:Components.ID("{DDEAD770-3CE9-48de-B08F-F35D36594911}"),contractID:"@yahoo.com/yahootoolbarmanager;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIObserver,Components.interfaces.nsIRunnable,Components.interfaces.nsIYahooToolbarManager])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooToolbarManager]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooToolbarManager]);