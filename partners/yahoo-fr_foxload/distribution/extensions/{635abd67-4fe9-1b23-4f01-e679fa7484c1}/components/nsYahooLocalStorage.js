
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooLocalStorage(){this.values=[];this.keys=[];this.putObject=function(key,obj){this.add(key,obj);};this.add=function(key,value){if(this.values===null){this.keys=[];this.values=[];}
this.values[key]=value;this.keys[this.keys.length]=key;};this.putString=function(key,value){if(this.values===null){this.keys=[];this.values=[];}
this.values[key]=value;this.keys[this.keys.length]=key;};this.clear=function(){if(this.values!==null){for(var i=0,len=this.keys.length;i<len;i++){if(this.values[this.keys[i]]instanceof CI.nsIYahooFeedNode){this.values[this.keys[i]].destroy();}
this.values[this.keys[i]]=null;this.keys[i]=null;}}
this.keys=null;this.values=null;};this.clearKey=function(key){try
{if(this.values!=null&&typeof(this.values[key])!='undefined'&&this.values[key]!=null)
{if(this.values[key]instanceof CI.nsIYahooFeedNode){this.values[key].destroy();}
this.values[key]=null;for(var i=0,len=this.keys.length;i<len;i++){if(this.keys[i]==key)
{this.keys[i]=null;break;}}}}
catch(e)
{yahooError("Error in clearKey::"+e);}};this.clearKeysWithPrefix=function(prefix){if(this.values!==null){for(var i=0,len=this.keys.length;i<len;i++){if(typeof(this.keys[i])=="string"&&this.keys[i].indexOf(prefix)==0){if(this.values[this.keys[i]]instanceof CI.nsIYahooFeedNode){this.values[this.keys[i]].destroy();}
this.values[this.keys[i]]=null;this.keys[i]=null;}}}};this.getObject=function(key){if(this.values!=null&&typeof(this.values[key])!='undefined'&&this.values[key]!=null){count=this.values[key].length;return this.values[key];}
return null;};this.getString=function(key){if(this.values!==null&&typeof(this.values[key])=="string"){return this.values[key];}
return null;};this.getKeys=function(count){count.value=0;if(this.keys!=null){count.value=this.keys.length;return this.keys;}else{return[];}};this.getValues=function(count){var out=[];var i=0
if(this.values!=null){for(props in this.values){i++;out[out.length]=this.values[props];}}
count.value=i;return out;};this.getStringValues=function(count){var out=[];count.value=0;if(this.values!=null){for(props in this.values){if(typeof(this.values[props])=="string"){count.value++;out[out.length]=this.values[props];}}}
return out;};this.size=function(){return((this.values!=null)?this.values.length:0);};this.toString=function(){var out="";if(this.values!=null){for(prop in this.values){if(out!=""){out+="&";}
out+=prop+" = "+this.values[prop];}}
return out;};}
YahooLocalStorage.prototype={classID:Components.ID("{966B0130-BAB8-4bc6-B410-CCE290777C11}"),contractID:"@yahoo.com/localstorage;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIRunnable,Components.interfaces.nsIYahooLocalStorage])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooLocalStorage]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooLocalStorage]);