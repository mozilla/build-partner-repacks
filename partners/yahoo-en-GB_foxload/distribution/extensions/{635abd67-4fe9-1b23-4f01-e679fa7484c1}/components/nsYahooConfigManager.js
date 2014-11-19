
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/installerVariables.js");loader.loadSubScript("chrome://ytoolbar/content/utils.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooConfigManager(){var _mPrefix="yahoo.ytff";var _mPrefBranch=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch2);var _mPrefBranch1=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var _mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);var _mLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var _self=this;var _mKeySource={'sc':'config','dc':'config','pc':'config','tc':'config'}
var _mForceWrite="";var _mForceWriteSc=false;var _mForceWriteFr=false;var _mForceWritePc=false;var _mForceWriteTc=true;var _mYahooCodes={};_mYahooCodes.co=yahooInstallerVariables.country||"";_mYahooCodes.lang=yahooInstallerVariables.language||"";_mYahooCodes.sc=yahooInstallerVariables.sc||"";_mYahooCodes.dc=yahooInstallerVariables.dc||"";_mYahooCodes.pc=yahooInstallerVariables.pc||"";_mYahooCodes.sc=yahooInstallerVariables.sc||"";_mYahooCodes.fr=yahooInstallerVariables.fr||"";_mYahooCodes.verticals=yahooInstallerVariables.verticals||"";_mYahooCodes.activeVertical=yahooInstallerVariables.activeVertical||"";this.YCONF_NOTFOUND=_mPrefBranch.PREF_INVALID;this.YCONF_BOOL=_mPrefBranch.PREF_BOOL;this.YCONF_INT=_mPrefBranch.PREF_INT;this.YCONF_STRING=_mPrefBranch.PREF_STRING;this.isYahooKey=true;function _setConfigValue(key,value,datatype,bOverride){var bSetValue=true;try{if((typeof value=='undefined')||(value===null)){_self.deleteKey(key);return true;}
if(_self.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:case _mPrefBranch.PREF_INT:case _mPrefBranch.PREF_STRING:bSetValue=bOverride;break;default:bSetValue=true;break;}
if(bSetValue){switch(datatype){case _self.YCONF_BOOL:_mPrefBranch.setBoolPref(key,value);break;case _self.YCONF_INT:_mPrefBranch.setIntPref(key,value);break;case _self.YCONF_STRING:default:var str=value.toString();_mPrefBranch.setCharPref(key,str);break;}}}catch(e){yahooError(e);}
_self.isYahooKey=true;return true;}
function _getConfigValue(key){var value;try{if(_self.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:value=_mPrefBranch.getBoolPref(key);break;case _mPrefBranch.PREF_INT:value=_mPrefBranch.getIntPref(key);break;case _mPrefBranch.PREF_STRING:value=_mPrefBranch.getCharPref(key);break;default:value=null;break;}}catch(e){yahooError(e);}
_self.isYahooKey=true;return value;}
function _detectOlderClients(){var val="";try{if(_self.isKeyPresent('toolbar.sc')){val=_self.getCharValue('toolbar.sc')||"";_self.setCharValue('toolbar.osc',val,true);}
if(_self.isKeyPresent('toolbar.dc')){val=_self.getCharValue('toolbar.dc')||"";_self.setCharValue('toolbar.odc',val,true);}
if(_self.isKeyPresent('toolbar.pc')){val=_self.getCharValue('toolbar.pc')||"";_self.setCharValue('toolbar.opc',val,true);}
if(_self.isKeyPresent('toolbar.frc')){val=_self.getCharValue('toolbar.frc')||"";_self.setCharValue('toolbar.ofrc',val,true);}
if(_self.isKeyPresent('installer.version')){val=_self.getCharValue('installer.version')||"";_self.setCharValue('toolbar.oversion',val,true);}}catch(e){yahooError(e);}}
function _migratePreferece(){try{var prefs=_mPrefBranch1;if(prefs.prefHasUserValue("yahoo.addtomy")){var val=prefs.getBoolPref("yahoo.addtomy");_self.setBoolValue("general.addtomy",val,true);}
if(prefs.prefHasUserValue("yahoo.homepage.dontask")){var val=prefs.getBoolPref("yahoo.homepage.dontask");_self.setBoolValue("general.dontshowhpoffer",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.sc")){var val=prefs.getCharPref("yahoo.installer.sc");_self.setCharValue("toolbar.sc",val,true);_self.setCharValue("toolbar.osc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.dc")){var val=prefs.getCharPref("yahoo.installer.dc");_self.setCharValue("toolbar.dc",val,true);_self.setCharValue("toolbar.odc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.pc")){var val=prefs.getCharPref("yahoo.installer.pc");_self.setCharValue("toolbar.pc",val,true);_self.setCharValue("toolbar.opc",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.tc")){var val=prefs.getCharPref("yahoo.installer.tc");_self.setCharValue("toolbar.tc",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.click.active")){var val=prefs.getBoolPref("yahoo.toolbar.click.active");_self.setBoolValue("tracking.clickactivated",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.searchbox.active")){var val=prefs.getBoolPref("yahoo.toolbar.searchbox.active");_self.setBoolValue("tracking.searchboxactivated",val,true);}
if(prefs.prefHasUserValue("yahoo.toolbar.searchbox.width")){var val=prefs.getIntPref("yahoo.toolbar.searchbox.width");_self.setIntValue("search.editboxwidth",val,false);}
if(prefs.prefHasUserValue("yahoo.installer.nd")){var val=prefs.getIntPref("yahoo.installer.nd");_self.isYahooKey=false;_self.setIntValue("yahoo.ytffp.installer.nd",val,true);}
if(prefs.prefHasUserValue("yahoo.options.iconsonly")){var val=prefs.getBoolPref("yahoo.options.iconsonly");_self.setBoolValue("general.showtextonfavs",!val,true);}
if(prefs.prefHasUserValue("yahoo.options.showbookmark")){var val=prefs.getBoolPref("yahoo.options.showbookmark");_self.setBoolValue("search.showbookmarks",val,true);}
if(prefs.prefHasUserValue("yahoo.installer.version")){var val=prefs.getCharPref("yahoo.installer.version");_self.setCharValue('toolbar.oversion',val,true);}
var prefBool=["yahoo.options.autoclear","yahoo.options.showlivesearch","yahoo.options.mailsi.userenable","yahoo.options.mailsi.enable","yahoo.options.showmailalert","yahoo.options.showffhistorysearch","yahoo.options.showffbookmarksearch","yahoo.options.showiwr","yahoo.options.showhistory","yahoo.options.menubar"];prefBool.forEach(function(value){if(prefs.prefHasUserValue(value)){var val=prefs.getBoolPref(value);_self.setBoolValue(value.substring(6),val,true);}},prefBool);var prefInstall=["yahoo.installer.country","yahoo.installer.language","yahoo.installer.version","yahoo.installer.version.simple","yahoo.installer.installdate"];prefInstall.forEach(function(value){if(prefs.prefHasUserValue(value)){var val=prefs.getCharPref(value);_self.setCharValue(value.substring(6),val,true);}},prefInstall);var prefvalues=["yahoo.addtomy","yahoo.homepage.dontask","yahoo.supports.livesearch"];prefvalues.forEach(function(value){if(prefs.prefHasUserValue(value)){prefs.clearUserPref(value);}},prefvalues);_mPrefBranch1.deleteBranch("yahoo.options");_mPrefBranch1.deleteBranch("yahoo.toolbar");}catch(e){yahooError(e);}}
function _onToolbarInstall(){try{var file=_mFileIO.getExtensionDir();var prefs=_mPrefBranch1;var installTime=""+_mPrefBranch.getCharPref("yahoo.ytff.general.installtimestamp");var modifiedTime=""+file.lastModifiedTime;if(modifiedTime==installTime){return;}
_mPrefBranch.setCharPref("yahoo.ytff.general.installtimestamp",modifiedTime);_mLocalStorage.putString("yahoo.ytff.installAction.showToolbar","true");_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage","true");_detectOlderClients();if(!_self.isKeyPresent("installer.version")){_self.isYahooKey=false;if(!_self.isKeyPresent("yahoo.installer.dc")){if(prefs.prefHasUserValue("yahoo.installer.nd")){var val=prefs.getIntPref("yahoo.installer.nd");_self.isYahooKey=false;_self.setIntValue("yahoo.ytffp.installer.nd",val,true);}
_postToolbarInstall("yahoo-toolbar-install-fresh");_self.setBoolValue("toolbar.upgraded",false,true);}else{_migratePreferece();_postToolbarInstall("yahoo-toolbar-install-1xup");_self.setBoolValue("toolbar.upgraded",true,true);}
if(!_mLocalStorage.getString("yahoo.ytff.installAction.showWelcomePage"))
_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage","true");}else{var curVer=_self.getCharValue("installer.version").split(".");var newVer=yahooInstallerVariables.version.split(".");var compareVer=0;for(var i=0;i<curVer.length;i++){compareVer=newVer[i]-curVer[i];if(compareVer!==0)break;}
if(compareVer===0){_postToolbarInstall("yahoo-toolbar-install-over");_self.setBoolValue("toolbar.upgraded",false,true);}else if(compareVer>0){_postToolbarInstall("yahoo-toolbar-install-2xup");_self.setBoolValue("toolbar.upgraded",true,true);if(!_mLocalStorage.getString("yahoo.ytff.installAction.showWelcomePage"))
_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage","true");}else{_postToolbarInstall("yahoo-toolbar-install-2xdown");_self.setBoolValue("toolbar.upgraded",false,true);}}}catch(e){yahooError(e);}}
function _initCodesPartner(){var prefPc;var prevPC=_self.getCharValue('toolbar.pc');if(prevPC===null&&(prefPc=_self.getCharValue('installer.partner'))!==null){_self.setCharValue('toolbar.pc',prefPc,false);prevPC=prefPc;_self.setCharValue("installer.partner",null,false);}
try{var file=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);file=file.get('PrefD',CI.nsILocalFile);file.appendRelativePath("yahooToolbarSettings");if(file.exists()){try{var content=_mFileIO.readFile(file);var oldFormat=false;if(content[0]!="{")oldFormat=true;if(oldFormat==true){var data=yahooUtils.JSON.parse("{"+content+"}");if(data.forceWrite){_mForceWrite=data.forceWrite;_mForceWriteSc=_mForceWrite.indexOf('sc')>=0?true:false;_mForceWriteFr=_mForceWrite.indexOf('fr')>=0?true:false;_mForceWritePc=_mForceWrite.indexOf('pc')>=0?true:false;_mForceWriteTc=_mForceWrite.indexOf('tc')>=0?true:false;}
if(data.dc)
_mYahooCodes.dc=data.dc;if(data.sc)
_mYahooCodes.sc=data.sc;if(data.pc)
_mYahooCodes.pc=data.pc;if(data.tc)
_mYahooCodes.tc=data.tc;if(data.lang)
_mYahooCodes.lang=_mYahooCodes.co=data.lang.toLowerCase();if(data.fr)
_mYahooCodes.fr=data.fr;if(data.homepage){_self.isYahooKey=false;if(_self.getCharValue('browser.startup.homepage').search(/yahoo/ig)<0){if(yahooUtils.mFFVersion>=20)
{_self.isYahooKey=false;var origValue=_self.getCharValue('browser.startup.homepage');_self.setCharValue('toolbar.orignalhomepage',origValue,true);_self.setCharValue('toolbar.currenthomepage',data.homepage,true);}
_self.isYahooKey=false;_self.setCharValue('browser.startup.homepage',data.homepage,true);}
_self.isYahooKey=false;_self.setIntValue('browser.startup.page',1,true);}
if(data.searchengine){_self.isYahooKey=false;if(_self.getCharValue('browser.search.selectedEngine').search(/yahoo/ig)<0){if(yahooUtils.mFFVersion>=20)
{_self.isYahooKey=false;var origValue=_self.getCharValue('browser.search.selectedEngine');_self.setCharValue('toolbar.orignalselectedEngine',origValue,true);_self.setCharValue('toolbar.currentselectedEngine',data.searchengine,true);}
_self.isYahooKey=false;_self.setCharValue('browser.search.selectedEngine',data.searchengine,true);}}
if(data.installer){for(var i=0;i<data.installer.length;i++){_self.setCharValue(data.installer[i].key,data.installer[i].value,true);}}
if(data.swp){_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage",data.swp=="1"?"true":"false");}
if(data.skin){_self.setCharValue("general.selectedskincode",data.skin,true);}
if(data.avert){_self.setCharValue("installer.activeVertical",data.avert,true);}
if(data.verts){_self.setCharValue("installer.verticals",data.verts,true);}
if(data.dskin){_self.setIntValue("general.enableskins",data.dskin,true);}
if(data.dvert){if(data.dvert==0)
_self.setBoolValue("general.enableverticals",true,true);else
_self.setBoolValue("general.enableverticals",false,true);}}else{var data=yahooUtils.JSON.parse(content);var items=data.toolbar;for(var i=0;i<items.length;i++){var item=items[i];var key=item.item[0];if(key=="yahoo.ytff.toolbar.dc"){_mYahooCodes.dc=item.item[1];}else if(key=="yahoo.ytff.toolbar.sc"){if(item.item[3]=="yes")_mForceWriteSc=true;_mYahooCodes.sc=item.item[1];}else if(key=="yahoo.ytff.toolbar.pc"){_mYahooCodes.pc=item.item[1];if(item.item[3]=="yes")_mForceWritePc=true;}else if(key=="yahoo.ytff.toolbar.tc"){_mYahooCodes.tc=item.item[1];if(item.item[3]=="no")_mForceWriteTc=false;}else if(key=="yahoo.ytff.toolbar.frc"){_mYahooCodes.fr=item.item[1];if(item.item[3]=="yes")_mForceWriteFr=true;}else if(key=="yahoo.ytff.installer.language"){_mYahooCodes.lang=item.item[1].toLowerCase();_mYahooCodes.co=item.item[1].toLowerCase();}else if(key=="browser.startup.homepage"){_self.isYahooKey=false;if(_self.getCharValue('browser.startup.homepage').search(/yahoo/ig)<0){if(yahooUtils.mFFVersion>=20)
{_self.isYahooKey=false;var origValue=_self.getCharValue('browser.startup.homepage');_self.setCharValue('toolbar.orignalhomepage',origValue,true);_self.setCharValue('toolbar.currenthomepage',item.item[1],true);}
_self.isYahooKey=false;_self.setCharValue('browser.startup.homepage',item.item[1],item.item[3]=="no"?false:true);}
_self.isYahooKey=false;_self.setIntValue('browser.startup.page',1,true);}else if(key=="browser.search.selectedEngine"){_self.isYahooKey=false;if(_self.getCharValue('browser.search.selectedEngine').search(/yahoo/ig)<0){if(yahooUtils.mFFVersion>=20)
{_self.isYahooKey=false;var origValue=_self.getCharValue('browser.search.selectedEngine');_self.setCharValue('toolbar.orignalselectedEngine',origValue,true);_self.setCharValue('toolbar.currentselectedEngine',item.item[1],true);}
_self.isYahooKey=false;_self.setCharValue('browser.search.selectedEngine',item.item[1],item.item[3]=="no"?false:true);}}else{_self.isYahooKey=false;if(item.item[2]=="string"){_self.setCharValue(item.item[0],item.item[1],item.item[3]=="no"?false:true);}else if(item.item[2]=="integer"){_self.setIntValue(item.item[0],item.item[1],item.item[3]=="no"?false:true);}else if(item.item[2]=="boolean"){_self.setBoolValue(item.item[0],item.item[1]=="true"?true:false,item.item[3]=="no"?false:true);}}}}}catch(e){yahooError("ERROR in parsing yahooToolbarSettings: "+e);}
file.remove(false);}
if(prevPC===null||prevPC==="")
{_mForceWriteSc=_mForceWriteFr=_mForceWritePc=true;}}catch(e){yahooError("ERROR in yahooGetDistCodes: "+e);}}
function _initCodesCPDL(){try{var cookieMgr=Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);var cookies=cookieMgr.enumerator;while(cookies.hasMoreElements()){var cookie=cookies.getNext().QueryInterface(CI.nsICookie);if(cookie.host==".toolbar.yahoo.com"&&cookie.name=="CPDL"){var values=cookie.value.split("&");var i=0;_self.setBoolValue("general.dontshowhpoffer",true,true);_self.setBoolValue("general.installViaTyc",true,true);while(values[i]){var codes=values[i].split("=");if(codes[0]=="sc"){_mYahooCodes.sc=codes[1].match(/[A-Za-z0-9_-]*/);}else if(codes[0]=="frc"){_mYahooCodes.fr=codes[1].match(/[A-Za-z0-9_-]*/);}else if(codes[0]=="pc"){_mYahooCodes.pc=codes[1].match(/[A-Za-z0-9_-]*/);}else if(codes[0]=="dc"){_mYahooCodes.dc=codes[1].match(/[A-Za-z0-9_-]*/);}else if(codes[0]=="tc"){_mYahooCodes.tc=codes[1].match(/[A-Za-z0-9_-]*/);}else if(codes[0]=="u"){_mLocalStorage.putString("doneUrl",codes[1]);}else if(codes[0]=="skin"){_self.setCharValue("general.selectedskincode",codes[1],true);}else if(codes[0]=="avert"){_self.setCharValue("installer.activeVertical",codes[1],true);}else if(codes[0]=="verts"){_self.setCharValue("installer.verticals",codes[1],true);}else if(codes[0]=="dskin"){if(codes[1]==2){if(_self.getIntValue("general.enableskins")==0)_self.setIntValue("general.enableskins",codes[1],true);}else{_self.setIntValue("general.enableskins",codes[1],true);}}else if(codes[0]=="dvert"){if(codes[1]==0)
_self.setBoolValue("general.enableverticals",true,true);else if(codes[1]==1)
_self.setBoolValue("general.enableverticals",false,true);}else if(codes[0]=="swp"){_mLocalStorage.putString("yahoo.ytff.installAction.showWelcomePage",codes[1]=="1"?"true":"false");}else if(codes[0]=="intl"){_mYahooCodes.lang=_mYahooCodes.co=codes[1].match(/[A-Za-z0-9_]*/);}else if(codes[0]=="ysethome"){_self.setCharValue("general.ysethome",decodeURIComponent(codes[1]),true);}else if(codes[0]=="ysetsearch"){_self.setCharValue("general.ysetsearch",decodeURIComponent(codes[1]),true);}else if(codes[0]=="ysetclkstrm"){_self.setBoolValue("general.ysetclkstrm",codes[1]=="1"?true:false,true);}
i++;}
cookieMgr.remove(cookie.host,cookie.name,cookie.path,false);break;}}}catch(e){yahooError(e);}}
function formatDate(i){return i>9?""+i:"0"+i;}
function generateGUID(size){var _charset="0123456789abcdefghijklmnopqurstuvwxyz0123456789";var guid="";try{for(var i=0;i<size;i++){guid+=_charset.substr(Math.floor(Math.random()*45),1);}}catch(e){yahooError(e);}
return guid.toLowerCase();}
function _initFFConfig(topic){try{var instVersion=yahooInstallerVariables.version;var instSimpleVer=instVersion.split(".");if(instSimpleVer.length>3){instSimpleVer.pop();}
instSimpleVer=instSimpleVer.join(".");_self.isYahooKey=false;_mYahooCodes.nd=_self.getIntValue('yahoo.ytffp.installer.nd')||0;if(yahooInstallerVariables.setdefaultLang!="false"){if((!_mYahooCodes.lang||_mYahooCodes.lang==="")){_mYahooCodes.co=(_self.getCharValue('installer.country')!="")?_self.getCharValue('installer.country'):"us";_mYahooCodes.lang=(_self.getCharValue('installer.language')!="")?_self.getCharValue('installer.language'):"us";}}
_self.setCharValue('installer.version',instVersion,true);_self.setCharValue('installer.version.simple',instSimpleVer,true);if(_mYahooCodes.lang){_self.setCharValue('installer.language',_mYahooCodes.lang,true);_self.setCharValue('installer.country',_mYahooCodes.co,true);}
if(_mYahooCodes.dc){_self.setCharValue('toolbar.dc',_mYahooCodes.dc,true);}
if(_mYahooCodes.sc){_self.setCharValue('toolbar.sc',_mYahooCodes.sc,_mForceWriteSc);}
if(_mYahooCodes.fr){_self.setCharValue('toolbar.frc',_mYahooCodes.fr,_mForceWriteFr);}
if(_mYahooCodes.pc){_self.setCharValue('toolbar.pc',_mYahooCodes.pc,_mForceWritePc);}
if(_mYahooCodes.tc){_self.setCharValue('toolbar.tc',_mYahooCodes.tc,_mForceWriteTc);}
_self.isYahooKey=false;var search=_self.getCharValue("browser.search.defaulturl");if(search!==null&&search.match(new RegExp("^https?://([^\/]*\.)?yahoo\.com/"))){search=search.replace(/fr=((ytff)|(slv5))\-[^&]*/g,"fr=ytff-"+_mYahooCodes.sc);if(yahooUtils.mFFVersion>=20)
{_self.isYahooKey=false;var origValue=_self.getCharValue('browser.search.defaulturl');_self.setCharValue('toolbar.orignaldefaulturl',origValue,true);_self.setCharValue('toolbar.currentdefaulturl',search,true);}
_self.isYahooKey=false;_self.setCharValue("browser.search.defaulturl",search,true);}
var pref=_self.getBoolValue("general.addtomy");if(pref===null){_self.setBoolValue("general.addtomy",true,true);}
_mYahooCodes.nd++;_self.isYahooKey=false;_self.setIntValue('yahoo.ytffp.installer.nd',_mYahooCodes.nd,true);var d=new Date();var _month=d.getMonth()+1;var _formattedDate=""+formatDate(_month)+"."+formatDate(d.getDate())+"."+d.getFullYear()+"-";_formattedDate+=formatDate(d.getHours())+":"+formatDate(d.getMinutes())+":"+formatDate(d.getSeconds());var t=d.toUTCString();_self.setCharValue("installer.installdate",t,true);_self.setCharValue("installer.idateformatted",_formattedDate,true);if(topic.indexOf("1xup")>-1){_self.setCharValue("toolbar.lastuse",t,true);_self.setCharValue("toolbar.lastcust",t,true);_self.setIntValue("toolbar.numfeed",0,true);}
if(topic!="yahoo-toolbar-install-over")
_self.setBoolValue("install.istracked",false,true);var toolbar_bucket=_self.getCharValue("toolbar.forcedbucket");if(toolbar_bucket!="")
{_self.setCharValue("toolbar.forcedbucket",bucket,true);}}catch(e){yahooError(e);}}
function _postToolbarInstall(topic){try{_initCodesPartner();_initCodesCPDL();_initFFConfig(topic);CC["@yahoo.com/partner/manager;1"].getService(CI.nsIYahooPartnerManager).init();}catch(e){yahooError(e);_mLocalStorage.putString("yahoo.ytff.installAction.showErrorLoading","true");}}
this.setIntValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_INT,bOverride);}catch(e){yahooError(e.message);}}
this.setBoolValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_BOOL,bOverride);}catch(e){yahooError(e.message);}}
this.setCharValue=function(key,value,bOverride){try{_setConfigValue(key,value,this.YCONF_STRING,bOverride);}catch(e){yahooError(e.message);}}
this.deleteKey=function(key){if(this.isYahooKey){key=_mPrefix+'.'+key;}
_mPrefBranch.clearUserPref(key);}
this.getIntValue=function(key){var val=_getConfigValue(key);if(val==null){val=0;}
return val;}
this.getBoolValue=function(key){var val=_getConfigValue(key);if(val==null){val=null;}
return val;},this.getCharValue=function(key){var val=_getConfigValue(key);if(val==null){val="";}
return val;}
this.cleanUp=function(){try{_mPrefBranch1.deleteBranch("yahoo.ytff");_mPrefBranch1.deleteBranch("yahoo.installer");}catch(e){yahooError(e);}}
this.getKeyType=function(key){var bKeyPresent=false;try{if(this.isYahooKey){key=_mPrefix+'.'+key;}
var keyType=_mPrefBranch.getPrefType(key);switch(keyType){case _mPrefBranch.PREF_BOOL:case _mPrefBranch.PREF_INT:case _mPrefBranch.PREF_STRING:break;default:keyType=this.YCONF_NOTFOUND;break;}}catch(e){yahooError(e);}
this.isYahooKey=true;return keyType;};this.isKeyPresent=function(key){var bKeyPresent=false;try{if(this.isYahooKey){key=_mPrefix+'.'+key;}
switch(_mPrefBranch.getPrefType(key)){case _mPrefBranch.PREF_BOOL:case _mPrefBranch.PREF_INT:case _mPrefBranch.PREF_STRING:bKeyPresent=true;break;default:bKeyPresent=false;break;}}catch(e){yahooError(e);}
this.isYahooKey=true;return bKeyPresent;};this.addOnChangeListener=function(key,observer){try{key=_mPrefix+'.'+key;_mPrefBranch.addObserver(key,observer,false);}catch(e){yahooError(e);}}
this.getValuefromSqlLite=function(key){}
this.setValueForSqlLite=function(key,value,bOverride){}
_onToolbarInstall();};YahooConfigManager.prototype={classID:Components.ID("{A199A21C-C5C0-11DD-B9D5-360956D89593}"),contractID:"@yahoo.com/configmanager;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooConfigManager])};function debug(message){var console=CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);var d=new Date();var time="Logger :"+d.getHours()+":"+d.getMinutes()+":"
+d.getSeconds();console.logStringMessage(time+": "+message);}
if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooConfigManager]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooConfigManager]);