
var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooUrlProbe(){this.m_urlList=[];}
YahooUrlProbe.prototype={addUrlNotifier:function(url){this.m_urlList.push(url);},removeUrlNotifier:function(url){for(var i=0;i<this.m_urlList.length;i++){if(this.m_urlList[i].indexOf(url)!==-1){this.m_urlList.splice(i,1);break;}}},getUrlNotifierList:function(){return new WrapperClass(this.m_urlList);},QueryInterface:function(iid){if(iid.equals(Components.interfaces.nsISupports)||iid.equals(Components.interfaces.nsIYahooUrlProbe)){return this;}
throw Components.results.NS_ERROR_NO_INTERFACE;}};var UrlProbeModule={mContractID:"@yahoo.com/urlprobe;1",mCID:Components.ID("{f54df254-a8b5-475a-bb8c-5fc439e24d64}"),mFactory:{createInstance:function(outer,iid){if(outer!=null){throw Components.results.NS_ERROR_NO_AGGREGATION;}
if(iid.equals(Components.interfaces.nsISupports)||iid.equals(Components.interfaces.nsIYahooUrlProbe)){return new YahooUrlProbe();}
throw Components.results.NS_ERROR_INVALID_ARG;}},registerSelf:function(compMgr,fileSpec,location,type){var compMgr=compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);compMgr.registerFactoryLocation(UrlProbeModule.mCID,"Yahoo Url Probe",UrlProbeModule.mContractID,fileSpec,location,type);},unregisterSelf:function(compMgr,fileSpec,location){},getClassObject:function(compMgr,cid,iid){if(!cid.equals(UrlProbeModule.mCID))
throw Components.results.NS_ERROR_NO_INTERFACE;if(!iid.equals(Components.interfaces.nsIFactory))
throw Components.results.NS_ERROR_NOT_IMPLEMENTED;return UrlProbeModule.mFactory;},canUnload:function(compMgr){return true;}}
function NSGetModule(compMgr,fileSpec){return UrlProbeModule;}