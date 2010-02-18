
var CI=Components.interfaces;var CC=Components.classes;function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooLocalStorage(){this.values=[];this.keys=[];this.putObject=function(key,obj){this.add(key,obj);};this.add=function(key,value){if(this.values===null){this.keys=[];this.values=[];}
this.values[key]=value;this.keys[this.keys.length]=key;};this.putString=function(key,value){if(this.values===null){this.keys=[];this.values=[];}
this.values[key]=value;this.keys[this.keys.length]=key;};this.clear=function(){if(this.values!==null){for(var i=0,len=this.keys.length;i<len;i++){if(this.values[this.keys[i]]instanceof CI.nsIYahooFeedNode){this.values[this.keys[i]].destroy();}
this.values[this.keys[i]]=null;this.keys[i]=null;}}
this.keys=null;this.values=null;};this.getObject=function(key){if(this.values!=null&&typeof(this.values[key])!='undefined'){count=this.values[key].length;return this.values[key];}
return null;};this.getString=function(key){if(this.values!==null&&typeof(this.values[key])=="string"){return this.values[key];}
return null;};this.getKeys=function(count){count.value=0;if(this.keys!=null){count.value=this.keys.length;return this.keys;}else{return[];}};this.getValues=function(count){var out=[];var i=0
if(this.values!=null){for(props in this.values){i++;out[out.length]=this.values[props];}}
count.value=i;return out;};this.getStringValues=function(count){var out=[];count.value=0;if(this.values!=null){for(props in this.values){if(typeof(this.values[props])=="string"){count.value++;out[out.length]=this.values[props];}}}
return out;};this.size=function(){return((this.values!=null)?this.values.length:0);};this.toString=function(){var out="";if(this.values!=null){for(prop in this.values){if(out!=""){out+="&";}
out+=prop+" = "+this.values[prop];}}
return out;};}
YahooLocalStorage.prototype={QueryInterface:function(iid){if(!iid.equals(CI.nsIYahooLocalStorage)&&!iid.equals(CI.nsISupports)&&!iid.equals(CI.nsIRunnable)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function NSGetModule(compMgr,fileSpec){return{myCID:Components.ID("{966B0130-BAB8-4bc6-B410-CCE290777C11}"),myProgID:"@yahoo.com/localstorage;1",firstTime:true,registerSelf:function(compMgr,fileSpec,location,type){if(this.firstTime){this.firstTime=false;throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;}
compMgr=compMgr.QueryInterface(CI.nsIComponentRegistrar);compMgr.registerFactoryLocation(this.myCID,"Yahoo! Local Storage",this.myProgID,fileSpec,location,type);},getClassObject:function(compMgr,cid,iid){if(!cid.equals(this.myCID)){throw Components.results.NS_ERROR_NO_INTERFACE;}
if(!iid.equals(CI.nsIFactory)){throw Components.results.NS_ERROR_NOT_IMPLEMENTED;}
return this.myFactory;},myFactory:{createInstance:function(outer,iid){if(outer!==null){throw Components.results.NS_ERROR_NO_AGGREGATION;}
return new YahooLocalStorage().QueryInterface(iid);}},canUnload:function(compMgr){return true;}};}