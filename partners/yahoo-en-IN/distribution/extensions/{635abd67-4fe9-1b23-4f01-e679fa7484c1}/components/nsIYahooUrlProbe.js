
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooUrlProbe(){this.m_urlList=[];}
YahooUrlProbe.prototype={addUrlNotifier:function(url){this.m_urlList.push(url);},removeUrlNotifier:function(url){for(var i=0;i<this.m_urlList.length;i++){if(this.m_urlList[i].indexOf(url)!==-1){this.m_urlList.splice(i,1);break;}}},getUrlNotifierList:function(){return new WrapperClass(this.m_urlList);},classID:Components.ID("{f54df254-a8b5-475a-bb8c-5fc439e24d64}"),contractID:"@yahoo.com/urlprobe;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooUrlProbe])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooUrlProbe]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooUrlProbe]);