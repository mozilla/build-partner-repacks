
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");function yLocalButton(){var _self=this;m_nameSeed=0;m_toolbarManager=null;m_FileIO=Components.classes["@yahoo.com/fileio;1"].getService(Components.interfaces.nsIYahooFileIO2);getRawFileContent=function(buttonID)
{var fileContent="";try{var jsonFilePath=m_FileIO.getProfileDir();jsonFilePath.appendRelativePath(buttonID.slice(1)+".ybn");fileContent=m_FileIO.readUnicodeFile(jsonFilePath);}catch(e){yahooError(e);}
return fileContent;};this.getLocalButtonJSON=function(buttonID)
{var lbJson={};try{var fileContent=getRawFileContent(buttonID);if(fileContent.length>0){lbJson=yahooUtils.JSON.parse(fileContent);yahooDebug("creating button JSON for id "+buttonID);lbJson.id=buttonID;lbJson.icon=decodeURI(lbJson.icon);lbJson.url=decodeURI(lbJson.url);}}catch(e){yahooError("getLocalButtonJSON exception "+e);}
return yahooUtils.JSON.stringify(lbJson);};makeLocalButtonJSON=function(buttonName,buttonIcon,buttonURL){var lbJson={};lbJson.title=buttonName;lbJson.icon=encodeURI(buttonIcon);lbJson.url=encodeURI(buttonURL);return yahooUtils.JSON.stringify(lbJson);};this.isLocal=function(buttonID){if(buttonID&&buttonID.length>0&&buttonID.indexOf('@')>=0&&buttonID.indexOf('@lbrss')==-1){return true;}else{return false;}}
this.isLocalRSS=function(buttonID){if(buttonID&&buttonID.length>0&&buttonID.indexOf('@lbrss')>=0){return true;}else{return false;}}
this.init=function(tbManager){m_toolbarManager=tbManager;}
this.addLocalButton=function(buttonJSON){var today=new Date();var buttonID="@lb"+m_nameSeed+today.getTime().toString(16);m_nameSeed=((m_nameSeed+1)%1024);_self.saveLocalButton(buttonJSON,buttonID);m_toolbarManager.addButton(buttonID);return buttonID;};this.addLocalButtonNew=function(buttonJSON,buttonPrefix,buttonUrl){if(buttonPrefix=="")
buttonPrefix="@lb";var buttonID="";var domainName="";if(buttonUrl&&buttonUrl!="")
domainName=buttonUrl.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0];;if(domainName!="")
{var id=domainName.replace(/\./g,'_');var yahooConfMgr=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);var lbid=yahooConfMgr.getIntValue("lbid");buttonID=buttonPrefix+"_"+id+"_"+lbid;yahooConfMgr.setIntValue("lbid",++lbid,true);}
else
{var today=new Date();buttonID=buttonPrefix+m_nameSeed+today.getTime().toString(16);m_nameSeed=((m_nameSeed+1)%1024);}
_self.saveLocalButton(buttonJSON,buttonID);m_toolbarManager.addButton(buttonID);return buttonID;};this.addLocalButton2=function(buttonName,buttonIcon,buttonURL){var buttonJSON=makeLocalButtonJSON(buttonName,buttonIcon,buttonURL);return _self.addLocalButtonNew(buttonJSON,"@lb",buttonURL);};this.addLocalRSSButton2=function(buttonName,buttonIcon,buttonURL){var buttonJSON=makeLocalButtonJSON(buttonName,buttonIcon,buttonURL);return _self.addLocalButtonNew(buttonJSON,"@lbrss",buttonURL);};this.saveLocalButton=function(buttonJSON,buttonID){var jsonFilePath=m_FileIO.getProfileDir();jsonFilePath.appendRelativePath(buttonID.slice(1)+".ybn");m_FileIO.writeUnicodeFile(jsonFilePath,buttonJSON);};this.saveLocalButton2=function(buttonName,buttonIcon,buttonURL,buttonID){var jsonFilePath=m_FileIO.getProfileDir();jsonFilePath.appendRelativePath(buttonID.slice(1)+".ybn");var buttonJSON=makeLocalButtonJSON(buttonName,buttonIcon,buttonURL);m_FileIO.writeUnicodeFile(jsonFilePath,buttonJSON);};this.setUserOpt_SaveLocal=function(prefValue){var userPrefFilePath=m_FileIO.getUserCacheDir();userPrefFilePath.appendRelativePath("useropt");var oldprefValue=null;var prefJsonObj=null;var fileContent=m_FileIO.readFile(userPrefFilePath);if(fileContent!=null){var prefJsonObj=yahooUtils.JSON.parse(fileContent);var oldprefValue=prefJsonObj.savelocal||!prefValue;}
if(oldprefValue!==prefValue){prefJsonObj={"savelocal":prefValue};if(prefValue)
{var mConfigMgr=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);mConfigMgr.setCharValue('toolbar.layout',m_toolbarManager.getLayoutButtons("grp_fav"),true);}
try{m_FileIO.writeFile(userPrefFilePath,yahooUtils.JSON.stringify(prefJsonObj));}catch(e){yahooError(e);}}};this.mergeLayout=function(prefValue){if(prefValue)
{var mConfigMgr=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);var yahooLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);if(yahooLocalStorage.getString("mergelocal")&&yahooLocalStorage.getString("mergelocal")=="1")
{var existingLayoutArray=mConfigMgr.getCharValue('previous.layout')?mConfigMgr.getCharValue('previous.layout').split(","):null;var newLayoutArray=m_toolbarManager.getLayoutButtons("grp_fav").split(",");var mergedLayoutArray=existingLayoutArray?existingLayoutArray.concat(newLayoutArray):newLayoutArray;var UniqueLayoutArray=_self.RemoveDuplicates(mergedLayoutArray);m_toolbarManager.setLayoutButtons(UniqueLayoutArray.join(","),"grp_fav");}}};this.RemoveDuplicates=function(mlayout){var temp=new Array();for(var i=0;i<mlayout.length;i++){if(!_self.contains(temp,mlayout[i])){temp.length+=1;temp[temp.length-1]=mlayout[i];}}
return temp;};this.contains=function contains(a,e){for(var j=0;j<a.length;j++)if(a[j]==e)return true;return false;};this.getUserOpt_SaveLocal=function(){var prefValue=false;try{var userPrefFile=m_FileIO.getUserCacheDir();userPrefFile.appendRelativePath("useropt");var fileContent=m_FileIO.readFile(userPrefFile);var prefJsonObj=yahooUtils.JSON.parse(fileContent);prefValue=prefJsonObj.savelocal;}catch(e){}finally{return prefValue;}};this.getLocalButtonsJSON=function(layout){var localButtonsJSON="";try{if(layout.length>0)
{var layoutStr=layout.split(',');for(var i=0;i<layoutStr.length;i++){if(_self.isLocal(layoutStr[i])||_self.isLocalRSS(layoutStr[i])){var lbJSON=_self.getLocalButtonJSON(layoutStr[i]);if(lbJSON.length>0)
{if(localButtonsJSON.length==0)
localButtonsJSON='[ ';else
localButtonsJSON+=',';localButtonsJSON+=lbJSON;}}}}
if(localButtonsJSON!=null&&localButtonsJSON.length>0)
localButtonsJSON+=' ]';}catch(e){yahooError("getLocalButtonsJSON exception "+e);}
return localButtonsJSON;},this.getLocalRSSButtonsJSON=function(layout){var localButtonsJSON="";try{if(layout.length>0)
{var layoutStr=layout.split(',');for(var i=0;i<layoutStr.length;i++){if(_self.isLocalRSS(layoutStr[i])){var lbJSON=_self.getLocalButtonJSON(layoutStr[i]);if(lbJSON.length>0)
{if(localButtonsJSON.length==0)
localButtonsJSON='[ ';else
localButtonsJSON+=',';localButtonsJSON+=lbJSON;}}}}
if(localButtonsJSON!=null&&localButtonsJSON.length>0)
localButtonsJSON+=' ]';}catch(e){yahooError("getLocalButtonsJSON exception "+e);}
return localButtonsJSON;},this.getButtonProperty=function(buttonID,property){try{var fileContent=getRawFileContent(buttonID);if(fileContent.length>0)
{var hash=yahooUtils.JSON.parse(fileContent);if(hash)
{for(var key in hash)
{if(key.indexOf(property)!=-1)
{var value=hash[key];return value;}}}}}
catch(e){yahooError("Exception in getButtonProperty "+e);}};this.getLocalButtonProperty=function(buttonID,property){var nodeValue="";try{var fileContent=getRawFileContent(buttonID);if(fileContent.length>0){var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var xmlDoc=parser.parseFromString(fileContent,"text/xml");var localButtonNode=xmlDoc.getElementsByTagName("localbutton");var topButtonNode=localButtonNode[0].getElementsByTagName("topbutton");var propertyNode=topButtonNode[0].getElementsByTagName(property);nodeValue=propertyNode[0].childNodes[0].nodeValue;}}catch(e){yahooError("Exception in getLocalButtonInfo "+e);}
return nodeValue;};this.localButtonYBNExists=function(buttonID){var exists=false;try{var buttonStream=getRawFileContent(buttonID);if(buttonStream!=null)
exists=(buttonStream.length>0);}catch(e){exists=false;yahooError("exception in localButtonYBNExists .. "+e);}finally{return exists;}};};yLocalButton.prototype={classID:Components.ID("{81434886-DE26-4544-84A8-E9D799195203}"),contractID:"@yahoo.com/feed/localbutton;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooLocalButtonProcessor])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([yLocalButton]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([yLocalButton]);