/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["EventTracker"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/logger.js");function EventTracker(name){if(name){this.setName(name);}else{this.setName("UnnamedEventTracker");}
this._events={};this._lastEventIndex=1;this._eventErrors=0;}
EventTracker.prototype={name:function(){return this._name;},eventErrors:function(){return this._eventErrors;},setName:function(name){this._name=name;},doWhenAllFinished:function(callback){this._whenAllFinished=callback;},failRemainingEvents:function(callback){for each(let[index,event]in Iterator(this._events)){this._eventErrors++;this._remove(index);}},addRequest:function(request){try{request.QueryInterface(Ci.ecIEbayApiRequest);}
catch(e){Logger.error("The object passed to EventTracker.addRequest is not "+
"an ecIEbayApiRequest!",Logger.DUMP_STACK);return;}
let eventIndex=this._lastEventIndex++;this._events[eventIndex]=true;let that=this;request.addCallback({trigger:function(err,response){that._remove(eventIndex,err);}});return eventIndex;},addCallbackEvent:function(){let that=this;let eventIndex=this._lastEventIndex++;this._events[eventIndex]=function(error){that._remove(eventIndex,error);}
return this._events[eventIndex];},_remove:function(eventIndex,error){if(!this._events[eventIndex]){Logger.warning("Attempt to remove event "+eventIndex+
" from tracker \""+this.name()+"\""+
", but that event does not exist.",Logger.DUMP_STACK);return;}
if(error){this._eventErrors++;}
delete this._events[eventIndex];if(this.numPendingEvents()<=0){if(this._whenAllFinished){try{this._whenAllFinished(this._eventErrors);}
catch(e){Logger.exception(e);}}}},numPendingEvents:function(){let num=0;for each(let[index,event]in Iterator(this._events)){num++;}
return num;}};