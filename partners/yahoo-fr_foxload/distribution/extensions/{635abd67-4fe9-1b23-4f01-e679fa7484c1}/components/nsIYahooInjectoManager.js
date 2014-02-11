
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var observerService=CC['@mozilla.org/observer-service;1'].getService(CI.nsIObserverService);var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object)
{this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid)
{if(!iid.equals(Components.interfaces.nsISupports))
{throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};var eInjectoTriggerTypes={Injecto_Error:-2,Injecto_Unset:-1,Injecto_PageLoad:0,Injecto_PageClick:1,Injecto_PageSelectText:2,Injecto_MaxTriggerType:2};function InjectoCommonObjects()
{this.urlProbe=CC["@yahoo.com/urlprobe;1"].getService(CI.nsIYahooUrlProbe);this.localstorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);this.confMgr=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);this.toolbarManager=null;this.injectoEnabled=true;};function InjectoItem(dataObj,managerParent)
{var _dataObj=dataObj;var _managerParent=managerParent;var _self=this;_self.triggerType=eInjectoTriggerTypes.Injecto_Unset;_self.btnId="";_self.regex=null;_self.existsNode=null;_self.hash=null;_self.supportsSSL=false;_self.init=function()
{};this.isInjected=function(targetDoc)
{var iframeInj=targetDoc.getElementById('injecto_'+_self.btnId);return iframeInj!==null;};this.enableInjectoPointer=function(targetDoc,enable)
{var iframeInj=targetDoc.getElementById('injecto_'+_self.btnId);if(iframeInj)
{iframeInj.style.cssText=("position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:2147483647;"+(enable?"":"pointer-events:none;"));}};this.shouldTrigger=function(targetDoc,occurredTriggerType,pageUrl,_dataObj)
{if(occurredTriggerType==_self.triggerType)
{if(pageUrl.indexOf("http")!=0)
{return false;}
if(!_self.supportsSSL&&(pageUrl.indexOf("https")===0))
{return false;}
var optId="button."+_self.btnId,bEnabled=false;if(_dataObj.confMgr.isKeyPresent(optId))
{bEnabled=_dataObj.confMgr.getBoolValue(optId);}
else if(_self.hash.dv&&(_self.hash.dv!="0"))
{bEnabled=true;}
if(!bEnabled)
{return false;}
if(_self.regex!=null)
{if(!pageUrl.match(_self.regex))
{return false;}}
if(_self.existsNode!=null)
{if(targetDoc.getElementById(_self.existsNode))
{return false;}}
return!this.isInjected(targetDoc);}
return false;};this.injectJS=function(_dataObj,targetDoc)
{var id=("ytb_inject_"+_self.btnId),cc=(_dataObj.confMgr.getCharValue("installer.language")||"us"),d_url=(cc+".data.toolbar.yahoo.com");scripto=targetDoc.getElementById(id),isSSL=(targetDoc.location.href.indexOf("https")===0);if(scripto!=null)
{return;}
if(_dataObj.confMgr.isKeyPresent("dataserver.url"))
{d_url=_dataObj.confMgr.getCharValue("dataserver.url").replace("$CONFIG_INTL$",cc);}
var scriptTxt="var intWait= window.setInterval(function() {"+"  try {"+"    if (document.body) {"+"      window.clearInterval(intWait);"+"      var iframe= document.createElement('iframe');"+"      iframe.frameBorder= 0;"+"      iframe.scrolling= 'no';"+"      iframe.id= 'injecto_"+_self.btnId+"';"+"      iframe.allowTransparency= true;"+"      iframe.style.cssText= 'position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:2147483647;pointer-events:none;';"+"      iframe.src= '"+(isSSL?"https://":"http://")+d_url+"/injecto?bid=' + encodeURIComponent('"+_self.btnId+"') + '&intl=' + encodeURIComponent('"+cc+"') + '&use_ssl="+(isSSL?"1":"0")+"&injcb="+_self.hash.injcb+"&makemarkup';"+"      document.body.appendChild(iframe);"+"    }"+"  } catch (e) { alert(e.message); }"+"}, 200);";try
{var customizeFrameInt=yahooUtils.setTimeout(function()
{var iframeInj=targetDoc.getElementById('injecto_'+_self.btnId);if(iframeInj&&iframeInj.contentDocument&&iframeInj.contentDocument.defaultView)
{customizeFrameInt.cancel();}},200,true);}
catch(e)
{yahooError('Customizer fail: '+e.message);}
yahooError('INJECTING: '+scriptTxt);_self.injectJSRaw(targetDoc,scriptTxt);};this.injectJSRaw=function(targetDoc,code)
{try
{var id="ytb_inject_"+_self.btnId,head=targetDoc.getElementsByTagName('head')[0],script=targetDoc.createElement('script'),trigger=targetDoc.createTextNode(code);script.id=id;script.type='text/javascript';script.appendChild(trigger);head.appendChild(script);}
catch(e){yahooError(e);}};this.sendEvent=function(targetDoc,eventName,evtArgs)
{if(!_self.sendEventCore(targetDoc,eventName,evtArgs))
{var startTime=(new Date()).getTime(),eventInt=yahooUtils.setTimeout(function()
{if(_self.sendEventCore(targetDoc,eventName,evtArgs))
{eventInt.cancel();}
else
{var timeCur=(new Date()).getTime();if((timeCur-startTime)>30000)
{eventInt.cancel();}}},200,true);}};this.sendEventCore=function(targetDoc,eventName,evtArgs)
{var iframeInj=targetDoc.getElementById('injecto_'+_self.btnId),bSent=false;if(iframeInj)
{var safeIframeWin=new XPCNativeWrapper(iframeInj.contentDocument.defaultView),wrappedWin=safeIframeWin.wrappedJSObject;if(wrappedWin.onMessageFromFirefoxToolbar&&wrappedWin.Customizer)
{var msgObj={eventName:eventName,evtObj:evtArgs};wrappedWin.onMessageFromFirefoxToolbar(JSON.stringify(msgObj));bSent=true;}}
return bSent;};};function yInjectoManager()
{var _self=this,_dataObj=new InjectoCommonObjects(),_currentUrl,injectoCollection=[];this.isEnabled=function()
{return _dataObj&&_dataObj.injectoEnabled;};this.killSwitch=function()
{if(_dataObj)
{_dataObj.injectoEnabled=false;}};this.addInjecto=function(injectoNode)
{try
{if(!_dataObj.injectoEnabled)
{return;}
var injectoItem=new InjectoItem(_dataObj,_self);injectoItem.hash=yahooUtils.JSON.parse(injectoNode.hash);injectoItem.btnId=injectoItem.hash.id;injectoItem.triggerType=injectoItem.hash.injtrigger;injectoItem.supportsSSL=(typeof(injectoItem.hash.jsinjpaths)!=="undefined");if(injectoItem.hash.injregex)
{injectoItem.regex=injectoItem.hash.injregex;}
if(injectoItem.hash.injexistsnode)
{injectoItem.existsNode=injectoItem.hash.injexistsnode;}
injectoItem.init();injectoCollection.push(injectoItem);}
catch(e)
{yahooError(e);}};this.clear=function()
{if(!_dataObj.injectoEnabled)
{return;}
injectoCollection.splice(0,injectoCollection.length);};this.onPageLoaded=function(targetDoc)
{if(!_dataObj.injectoEnabled)
{return;}
_currentUrl=targetDoc.documentURI;for(var i=0;i<injectoCollection.length;i++)
{if(injectoCollection[i].shouldTrigger(targetDoc,eInjectoTriggerTypes.Injecto_PageLoad,_currentUrl,_dataObj))
{injectoCollection[i].injectJS(_dataObj,targetDoc);break;}}};this.onPageClick=function(targetDoc,selEvtParams)
{var selEvtObj=JSON.parse(selEvtParams),justInjected=false;if(!_dataObj.injectoEnabled||targetDoc.inYTFFMarkedRegion)
{return;}
_currentUrl=targetDoc.documentURI;for(var i=0;i<injectoCollection.length;i++)
{if(injectoCollection[i].shouldTrigger(targetDoc,eInjectoTriggerTypes.Injecto_PageClick,_currentUrl,_dataObj))
{injectoCollection[i].injectJS(_dataObj,targetDoc);justInjected=true;break;}}
_self.sendEvent(targetDoc,"onPageClick",selEvtObj,justInjected);};this.onPageTextSelected=function(targetDoc,selEvtParams)
{var selEvtObj=JSON.parse(selEvtParams),justInjected=false;if(!_dataObj.injectoEnabled||targetDoc.inYTFFMarkedRegion)
{return;}
if(selEvtObj.selectText!=="")
{_currentUrl=targetDoc.documentURI;for(var i=0;i<injectoCollection.length;i++)
{if(injectoCollection[i].shouldTrigger(targetDoc,eInjectoTriggerTypes.Injecto_PageSelectText,_currentUrl,_dataObj))
{injectoCollection[i].injectJS(_dataObj,targetDoc);justInjected=true;break;}}}
_self.sendEvent(targetDoc,"onPageSelectText",selEvtObj,justInjected);};this.onPageScroll=function(targetDoc,selEvtParams)
{var selEvtObj=JSON.parse(selEvtParams);if(!_dataObj.injectoEnabled)
{return;}
_self.sendEvent(targetDoc,"onPageScroll",selEvtObj);};this.onPageMouseOver=function(targetDoc,left,top)
{if(!_dataObj.injectoEnabled)
{return;}
targetDoc.inYTFFMarkedRegion=false;for(var i=0;i<injectoCollection.length;i++)
{if(injectoCollection[i].isInjected(targetDoc))
{var inRegion=false;if(targetDoc.ytffMarkedRegions)
{for(var regionName in targetDoc.ytffMarkedRegions)
{var regionCur=targetDoc.ytffMarkedRegions[regionName];if(regionCur&&(regionCur.left<=left)&&(regionCur.top<=top)&&(regionCur.right>=left)&&(regionCur.bottom>=top))
{inRegion=targetDoc.inYTFFMarkedRegion=true;break;}}}
injectoCollection[i].enableInjectoPointer(targetDoc,inRegion);}}};this.markLiveRegion=function(frameDoc,regionName,left,top,right,bottom)
{if(!_dataObj.injectoEnabled)
{return;}
var topLevelDoc=frameDoc.defaultView.top.document;if(topLevelDoc)
{if(!topLevelDoc.ytffMarkedRegions)
{topLevelDoc.ytffMarkedRegions={};}
topLevelDoc.ytffMarkedRegions[regionName]={left:left,top:top,right:right,bottom:bottom};}};this.removeLiveRegion=function(frameDoc,regionName)
{if(!_dataObj.injectoEnabled)
{return;}
var topLevelDoc=frameDoc.defaultView.top.document;if(topLevelDoc&&topLevelDoc.ytffMarkedRegions)
{topLevelDoc.ytffMarkedRegions[regionName]=null;}};this.sendEvent=function(targetDoc,evtName,selEvtObj,forceEvent)
{if(!_dataObj.injectoEnabled)
{return;}
for(var i=0;i<injectoCollection.length;i++)
{if(forceEvent||injectoCollection[i].isInjected(targetDoc))
{injectoCollection[i].sendEvent(targetDoc,evtName,selEvtObj);break;}}};this.init=function(tb_manager)
{if(_dataObj.confMgr.isKeyPresent("general.injecto.debug"))
{_dataObj.injectoEnabled=_dataObj.confMgr.getBoolValue("general.injecto.debug");}
_dataObj.toolbarManager=tb_manager;};};yInjectoManager.prototype={classID:Components.ID("{86944522-4715-49d7-8666-6C2818B14114}"),contractID:"@yahoo.com/injectomanager;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooInjectoManager])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([yInjectoManager]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([yInjectoManager]);