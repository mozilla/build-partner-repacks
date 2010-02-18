
var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/installerVariables.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooConfigManager(){var _mPrefix="yahoo.ytff";var _mPrefBranch=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch2);var _mPrefBranch1=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var _mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);var _mLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var _self=this;var _mKeySource={'sc':'config','dc':'config','pc':'config','tc':'config'}
var _mYahooCodes={};_mYahooCodes.co=yahooInstallerVariables.country||"";_mYahooCodes.lang=yahooInstallerVariables.language||"";_mYahooCodes.sc=yahooInstallerVariables.sc||"";_mYahooCodes.dc=yahooInstallerVariables.dc||"";_mYahooCodes.pc=yahooInstallerVariables.pc||"";_mYahooCodes.sc=yahooInstallerVariables.sc||"";this.YCONF_BOOL=_mPrefBranch.PREF_BOOL;this.YCONF_INT=_mPrefBranch.PREF_INT;this.YCONF_STRING=_mPrefBranch.PREF_STRING;this.isYahooKey=true;function _setConfigValue(key,value,datatype,bOverride){var bSetValue=true;try{if(value===null){return true;}
if(_self.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:case _mPrefBranch.PREF_INT:case _mPrefBranch.PREF_STRING:bSetValue=bOverride;break;default:bSetValue=true;break;}
if(bSetValue){switch(datatype){case _self.YCONF_BOOL:_mPrefBranch.setBoolPref(key,value);break;case _self.YCONF_INT:_mPrefBranch.setIntPref(key,value);break;case _self.YCONF_STRING:default:var str=value.toString();_mPrefBranch.setCharPref(key,str);break;}}}catch(e){yahooError(e);}
_self.isYahooKey=true;return true;}
function _getConfigValue(key){var value;try{if(_self.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:value=_mPrefBranch.getBoolPref(key);break;case _mPrefBranch.PREF_INT:value=_mPrefBranch.getIntPref(key);break;case _mPrefBranch.PREF_STRING:value=_mPrefBranch.getCharPref(key);break;default:value=null;break;}}catch(e){yahooError(e);}
_self.isYahooKey=true;return value;}
function _migratePreferece(){try{var prefs=_mPrefBranch1;if(prefs.prefHasUserValue("yahoo.addtomy")){var val=prefs.getBoolPref("yahoo.addtomy");_self.setBoolValue("general.addtomy",val,true);}
if(prefs.prefHasUserValue("yahoo.homepage.dontask")){var val=prefs.getBoolPref("yahoo.homepage.dontask");_self.setBoolValue("general.dontshowhpoffer",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.sc")){var val=prefs.getCharPref("yahoo.installer.sc");_self.setCharValue("toolbar.sc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.dc")){var val=prefs.getCharPref("yahoo.installer.dc");_self.setCharValue("toolbar.dc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.pc")){var val=prefs.getCharPref("yahoo.installer.pc");_self.setCharValue("toolbar.pc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.tc")){var val=prefs.getCharPref("yahoo.installer.tc");_self.setCharValue("toolbar.tc",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.click.active")){var val=prefs.getBoolPref("yahoo.toolbar.click.active");_self.setBoolValue("tracking.clickactivated",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.searchbox.active")){var val=prefs.getBoolPref("yahoo.toolbar.searchbox.active");_self.setBoolValue("tracking.searchboxactivated",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.searchbox.width")){var val=prefs.getIntPref("yahoo.toolbar.searchbox.width");_self.setIntValue("search.boxwidth",val,false);}
if(prefs.prefHasUserValue("yahoo.installer.nd")){var val=prefs.getIntPref("yahoo.installer.nd");_self.isYahooKey=false;_self.setIntValue("yahoo.ytffp.installer.nd",val,true);}
if(prefs.prefHasUserValue("yahoo.options.iconsonly")){var val=prefs.getBoolPref("yahoo.options.iconsonly");_self.setBoolValue("general.showtextonfavs",!val,true);}
if(prefs.prefHasUserValue("yahoo.options.showbookmark")){var val=prefs.getBoolPref("yahoo.options.showbookmark");_self.setBoolValue("search.showbookmarks",val,true);}
var prefBool=["yahoo.options.autoclear","yahoo.options.showlivesearch","yahoo.options.mailsi.userenable","yahoo.options.mailsi.enable","yahoo.options.showmailalert","yahoo.options.showffhistorysearch","yahoo.options.showffbookmarksearch","yahoo.options.showiwr","yahoo.options.showhistory","yahoo.options.menubar"];prefBool.forEach(function(value){if(prefs.prefHasUserValue(value)){var val=prefs.getBoolPref(value);_self.setBoolValue(value.substring(6),val,true);}},prefBool);var prefInstall=["yahoo.installer.country","yahoo.installer.language","yahoo.installer.version","yahoo.installer.version.simple","yahoo.installer.installdate"];prefInstall.forEach(function(value){if(prefs.prefHasUserValue(value)){var val=prefs.getCharPref(value);_self.setCharValue(value.substring(6),val,true);}},prefInstall);var prefvalues=["yahoo.addtomy","yahoo.homepage.dontask","yahoo.supports.livesearch"];prefvalues.forEach(function(value){if(prefs.prefHasUserValue(value)){prefs.clearUserPref(value);}},prefvalues);_mPrefBranch1.deleteBranch("yahoo.options");_mPrefBranch1.deleteBranch("yahoo.toolbar");}catch(e){yahooError(e);}}
function _onToolbarInstall(){try{var file=_mFileIO.getExtensionDir();file.appendRelativePath("defaults");file.appendRelativePath("preferences");file.appendRelativePath("yahooToolbar.js");if(file.exists()){file.remove(false);}else{return;}
_mLocalStorage.putString("yahoo.ytff.installAction.showToolbar","true");if(!_self.isKeyPresent("installer.version")){_self.isYahooKey=false;if(!_self.isKeyPresent("yahoo.installer.dc")){_postToolbarInstall("yahoo-toolbar-install-fresh");_self.setBoolValue("toolbar.upgraded",false,true);}else{_migratePreferece();_postToolbarInstall("yahoo-toolbar-install-1xup");_self.setBoolValue("toolbar.upgraded",true,true);}
_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage","true");}else{var curVer=_self.getCharValue("installer.version").split(".");var newVer=yahooInstallerVariables.version.split(".");var compareVer=0;for(var i=0;i<curVer.length;i++){compareVer=newVer[i]-curVer[i];if(compareVer!==0)break;}
if(compareVer===0){_postToolbarInstall("yahoo-toolbar-install-over");_self.setBoolValue("toolbar.upgraded",false,true);}else if(compareVer>0){_postToolbarInstall("yahoo-toolbar-install-2xup");_self.setBoolValue("toolbar.upgraded",true,true);}else{_postToolbarInstall("yahoo-toolbar-install-2xdown");_self.setBoolValue("toolbar.upgraded",false,true);}}}catch(e){yahooError(e);}}
function _initCodesPartner(){var prefPc;if(_self.getCharValue('toolbar.pc')===null&&(prefPc=_self.getCharValue('installer.partner'))!==null){_self.setCharValue('toolbar.pc',prefPc,false);_self.setCharValue("installer.partner",null,false);}
try{var file=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);file=file.get('PrefD',CI.nsILocalFile);file.appendRelativePath("yahooToolbarSettings");if(file.exists()){var content=_mFileIO.readFile(file);var data=yahooUtils.JSON.parse(content);if(data.dc)
_mYahooCodes.dc=data.dc;if(data.sc)
_mYahooCodes.sc=data.sc;if(data.pc)
_mYahooCodes.pc=data.pc;if(data.tc)
_mYahooCodes.tc=data.tc;if(data.lang)
_mYahooCodes.lang=_mYahooCodes.co=data.lang.toLowerCase();if(data.homepage){_self.isYahooKey=false;_self.setCharValue('browser.startup.homepage',data.homepage,true);_self.isYahooKey=false;_self.setIntValue('browser.startup.page',1,true);}
if(data.searchengine){_self.isYahooKey=false;_self.setCharValue('browser.search.selectedEngine',data.searchengine,true);}
if(data.installer){for(var i=0;i<data.installer.length;i++){_self.setCharValue(data.installer[i].key,data.installer[i].value);}}
file.remove(false);}}catch(e){yahooError("ERROR in yahooGetDistCodes: "+e);}}
function _initCodesCPDL(){try{try{var cookieMgr=Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);var cookies=cookieMgr.enumerator;while(cookies.hasMoreElements()){var cookie=cookies.getNext().QueryInterface(CI.nsICookie);if(cookie.host==".toolbar.yahoo.com"&&cookie.name=="CPDL"){var values=cookie.value.split("&");var i=0;while(values[i]){var codes=values[i].split("=");if(codes[0]=="sc"){_mYahooCodes.sc=codes[1].match(/[A-Za-z0-9_]*/);}else if(codes[0]=="pc"){_mYahooCodes.pc=codes[1].match(/[A-Za-z0-9_]*/);}else if(codes[0]=="dc"){_mYahooCodes.dc="v2_"+codes[1].match(/[A-Za-z0-9_]*/);}else if(codes[0]=="tc"){_mYahooCodes.tc=codes[1].match(/[A-Za-z0-9_]*/);}else if(codes[0]=="u"){_mLocalStorage.putString("doneUrl",codes[1]);}else if(code[0]=="intl"){_mYahooCodes.lang=_mYahooCodes.co=codes[1].match(/[A-Za-z0-9_]*/);}
i++;}
cookieMgr.remove(cookie.host,cookie.name,cookie.path,false);break;}}}catch(e){}}catch(e){yahooError(e);}}
function _initFFConfig(topic){try{var instVersion=yahooInstallerVariables.version;var instSimpleVer=instVersion.split(".");if(instSimpleVer.length>3){instSimpleVer.pop();}
instSimpleVer=instSimpleVer.join(".");_self.isYahooKey=false;_mYahooCodes.nd=_self.getIntValue('yahoo.ytffp.installer.nd')||0;if((!_mYahooCodes.lang||_mYahooCodes.lang==="")){_mYahooCodes.co=(_self.getCharValue('installer.country')!="")?_self.getCharValue('installer.country'):"us";_mYahooCodes.lang=(_self.getCharValue('installer.language')!="")?_self.getCharValue('installer.language'):"us";}
_self.setCharValue('installer.version',instVersion,true);_self.setCharValue('installer.version.simple',instSimpleVer,true);if(_mYahooCodes.lang){_self.setCharValue('installer.language',_mYahooCodes.lang,true);_self.setCharValue('installer.country',_mYahooCodes.co,true);}
if(_mYahooCodes.dc){_self.setCharValue('toolbar.dc',_mYahooCodes.dc,true);}
if(_mYahooCodes.sc){_self.setCharValue('toolbar.sc',_mYahooCodes.sc,false);}
if(_mYahooCodes.pc){_self.setCharValue('toolbar.pc',_mYahooCodes.pc,false);}
if(_mYahooCodes.tc){_self.setCharValue('toolbar.tc',_mYahooCodes.tc,false);}
_self.isYahooKey=false;var search=_self.getCharValue("browser.search.defaulturl");if(search!==null&&search.match(new RegExp("^https?://([^\/]*\.)?yahoo\.com/"))){search=search.replace(/fr=((ytff)|(slv5))\-[^&]*/g,"fr=ytff-"+_mYahooCodes.sc);_self.isYahooKey=false;_self.setCharValue("browser.search.defaulturl",search,true);}
var pref=_self.getBoolValue("general.addtomy");if(pref===null){_self.setBoolValue("general.addtomy",true,true);}
if(!(topic.indexOf("yahoo-toolbar-install-over")>-1)){_mYahooCodes.nd++;_self.isYahooKey=false;_self.setIntValue('yahoo.ytffp.installer.nd',_mYahooCodes.nd,true);}
var d=new Date();var t=d.toUTCString();_self.setCharValue("installer.installdate",t,true);if(topic.indexOf("1xup")>-1){_self.setCharValue("toolbar.lastuse",t,true);_self.setCharValue("toolbar.lastcust",t,true);_self.setIntValue("toolbar.numfeed",0,true);}}catch(e){yahooError(e);}}
function _postToolbarInstall(topic){try{_initCodesPartner();_initCodesCPDL();_initFFConfig(topic);_changeMetaInformation();}catch(e){yahooError(e);_mLocalStorage.putString("yahoo.ytff.installAction.showErrorLoading","true");}}
function _changeMetaInformation(){try{var locale=_self.getCharValue("installer.language");var install=_mFileIO.getExtensionDir();install.appendRelativePath("install.rdf");var updateUrl="https:\/\/us.data.toolbar.yahoo.com/dl/toolbar/"
+locale+"/yhoo/v1/yhoo/update.rdf?.intl="+locale
+"&.pc="+_self.getCharValue('toolbar.pc')
+"&.dc="+_self.getCharValue('toolbar.dc')
+"&.sc="+_self.getCharValue('toolbar.sc')
+"&.tc="+_self.getCharValue('toolbar.tc')
+"&.ver="+_self.getCharValue('installer.version')
if(install.exists()){var contents=_mFileIO.readFile(install);var replace="<em:updateURL><![CDATA["+updateUrl+"]]></em:updateURL>";contents=contents.replace(/<em:updateURL>.*<\/em:updateURL>/,replace);replace="<em:homepageURL>http:\/\/"+locale+".toolbar.yahoo.com</em:homepageURL>";contents=contents.replace(/<em:homepageURL>.*<\/em:homepageURL>/,replace);var out=CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);out.init(install,0x04|0x08|0x20,0666,0);out.write(contents,contents.length);out.flush();out.close();}
var ext=[];ext[0]=_mFileIO.getProfileDir();ext[0].appendRelativePath("extensions.rdf");ext[1]=_mFileIO.getProfileDir();ext[1].appendRelativePath("extensions");ext[1].appendRelativePath("Extensions.rdf");for(var i=0;i<ext.length;i++){if(ext[i].exists()){try{var contents=_mFileIO.readFile(ext[i]);var replace="updateURL=\""+updateUrl+"\"";replace="homepageURL=\"http:\/\/"+locale+".toolbar.yahoo.com\/\"";contents=contents.replace(new RegExp("homepageURL=\"http:\/\/(.*)yahoo.com[^\"]*\""),replace);var out=CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);out.init(ext[i],0x04|0x08|0x20,0666,0);out.write(contents,contents.length);out.flush();out.close();var rdf=CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);var ds=rdf.GetDataSourceBlocking("file:///"
+ext[i].path);ds=ds.QueryInterface(CI.nsIRDFRemoteDataSource);ds.Flush();}catch(e){yahooError("Error in yahooChangeMetaInformation() with ext["+i+"]: "+e);}}}}catch(e){yahooError("Error in yahooChangeMetaInformation: "+e);}}
this.setIntValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_INT,bOverride);}catch(e){yahooError(e);}}
this.setBoolValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_BOOL,bOverride);}catch(e){yahooError(e);}}
this.setCharValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_STRING,bOverride);}catch(e){yahooError(e);}}
this.getIntValue=function(key){var val=_getConfigValue(key);if(val==null){val=0;}
return val;}
this.getBoolValue=function(key){var val=_getConfigValue(key);if(val==null){val=null;}
return val;},this.getCharValue=function(key){var val=_getConfigValue(key);if(val==null){val="";}
return val;}
this.cleanUp=function(){try{_mPrefBranch1.deleteBranch("yahoo.ytff");_mPrefBranch1.deleteBranch("yahoo.installer");}catch(e){yahooError(e);}}
this.isKeyPresent=function(key){var bKeyPresent=false;try{if(this.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:case _mPrefBranch.PREF_INT:case _mPrefBranch.PREF_STRING:bKeyPresent=true;break;default:bKeyPresent=false;break;}}catch(e){yahooError(e);}
this.isYahooKey=true;return bKeyPresent;};this.addOnChangeListener=function(key,observer){try{key=_mPrefix+'.'+key;_mPrefBranch.addObserver(key,observer,false);}catch(e){yahooError(e);}}
this.getValuefromSqlLite=function(key){}
this.setValueForSqlLite=function(key,value,bOverride){}
this.QueryInterface=function(iid){if(!iid.equals(CI.nsIYahooConfigManager)&&!iid.equals(CI.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}
_onToolbarInstall();};function debug(message){var console=CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);var d=new Date();var time="Logger :"+d.getHours()+":"+d.getMinutes()+":"
+d.getSeconds();console.logStringMessage(time+": "+message);}
function NSGetModule(compMgr,fileSpec){return{myCID:Components.ID("{A199A21C-C5C0-11DD-B9D5-360956D89593}"),myProgID:"@yahoo.com/configmanager;1",firstTime:true,registerSelf:function(compMgr,fileSpec,location,type){if(this.firstTime){this.firstTime=false;throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;}
compMgr=compMgr.QueryInterface(CI.nsIComponentRegistrar);compMgr.registerFactoryLocation(this.myCID,"Yahoo! Toolbar Config Manager",this.myProgID,fileSpec,location,type);},getClassObject:function(compMgr,cid,iid){if(!cid.equals(this.myCID)){throw Components.results.NS_ERROR_NO_INTERFACE;}
if(!iid.equals(CI.nsIFactory)){throw Components.results.NS_ERROR_NOT_IMPLEMENTED;}
return this.myFactory;},myFactory:{createInstance:function(outer,iid){if(outer!=null){throw Components.results.NS_ERROR_NO_AGGREGATION;}
return new YahooConfigManager().QueryInterface(iid);}},canUnload:function(compMgr){return true;}};}