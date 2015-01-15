/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */EXPORTED_SYMBOLS=["Preferences"];const Cc=Components.classes;const Ci=Components.interfaces;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://gre/modules/XPCOMUtils.jsm");function Preferences(prefBranch){if(prefBranch)
this._prefBranch=prefBranch;}
Preferences.prototype=Preferences;Preferences._observers={};Preferences._prefBranch="";Preferences.__defineGetter__("_prefSvc",function(){let prefSvc=Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);return prefSvc;});Preferences.branchName=function(){return this._prefBranch;};Preferences.get=function(prefName,defaultValue){if(typeof prefName=="object"&&prefName.constructor.name==Array.name)
return prefName.map(function(v){return this.get(v)},this);let prefFullName=this._prefBranch+prefName;try{switch(this._prefSvc.getPrefType(prefFullName)){case Ci.nsIPrefBranch.PREF_STRING:return this._prefSvc.getCharPref(prefFullName);case Ci.nsIPrefBranch.PREF_INT:return this._prefSvc.getIntPref(prefFullName);case Ci.nsIPrefBranch.PREF_BOOL:return this._prefSvc.getBoolPref(prefFullName);}}
catch(ex){}
return defaultValue;};Preferences.set=function(prefName,prefValue){if(typeof prefName=="object"&&prefName.constructor.name==Object.name)
for(let[name,value]in Iterator(prefName))
this.set(name,value);else{let prefFullName=this._prefBranch+prefName;switch(typeof prefValue){case"number":this._prefSvc.setIntPref(prefFullName,prefValue);break;case"boolean":this._prefSvc.setBoolPref(prefFullName,prefValue);break;case"string":default:this._prefSvc.setCharPref(prefFullName,prefValue);break;}}};Preferences.addObserver=function(callback,prefName){var prefFullName=this._prefBranch+prefName;var observer=new Observer(callback);if(!(prefName in this._observers))
this._observers[prefName]={};this._observers[prefName][callback]=observer;this._prefSvc.addObserver(prefFullName,observer,false);};Preferences.removeObserver=function(callback,prefName){var prefFullName=this._prefBranch+prefName;var observer=this._observers[prefName][callback];try{this._prefSvc.removeObserver(prefFullName,observer);}catch(e){}
delete this._observers[prefName][callback]};Preferences.has=function(prefName){if(!prefName){prefName="";}
return(this._prefSvc.getPrefType(this._prefBranch+prefName)!=this._prefSvc.PREF_INVALID);};Preferences.reset=function(prefName){if(!prefName){prefName="";}
this._prefSvc.clearUserPref(this._prefBranch+prefName);};Preferences.modified=function(prefName){if(!prefName){prefName="";}
return(this.has(prefName)&&this._prefSvc.prefHasUserValue(this._prefBranch+prefName));};Preferences.lock=function(prefName){if(!prefName){prefName="";}
this._prefSvc.lockPref(this._prefBranch+prefName);};Preferences.unlock=function(prefName){if(!prefName){prefName="";}
this._prefSvc.unlockPref(this._prefBranch+prefName);};Preferences.locked=function(prefName){if(!prefName){prefName="";}
return this._prefSvc.isLocked(this._prefBranch+prefName);};Preferences.resetBranch=function(prefBranch){if(!prefBranch){prefBranch="";}
this._prefSvc.resetBranch(this._prefBranch+prefBranch);};Preferences.deleteBranch=function(prefBranch){if(!prefBranch){prefBranch="";}
this._prefSvc.deleteBranch(this._prefBranch+prefBranch);};function Observer(callback){this._callback=callback;}
Observer.prototype={QueryInterface:XPCOMUtils.generateQI([Ci.nsIObserver,Ci.nsISupportsWeakReference]),observe:function(subject,topic,data){if(subject&&subject.wrappedJSObject)
this._callback(subject.wrappedJSObject,topic,data);else
this._callback(subject,topic,data);}}