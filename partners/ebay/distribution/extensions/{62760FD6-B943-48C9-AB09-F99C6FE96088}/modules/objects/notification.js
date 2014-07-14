/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["Notification"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/objectHelper.js");function Notification(aType){this.set("type",aType);this.set("isPersistent",true);this.set("callbacksArray",new Array());this.set("bgColor","");}
Notification.prototype={constructor:Notification,NON_PERSISTENT_NOTIFICATION:false,propertyTypes:{type:"number",isPersistent:"boolean",priority:"number",content:"string",imageURL:"string",callbacksArray:"object",bgColor:"string"},copy:function(){let copy=new Notification(this.get("type"));copy.updateQuietlyTo(this);return copy;},updateTo:function(newObject){return ObjectHelper.updateObject(this,newObject,"ebay-notification-property-updated");},updateProperty:function(property,value){return ObjectHelper.updateProperty(this,property,value,"ebay-notification-property-updated");},get:function(property){return ObjectHelper.getProperty(this,property);},set:function(property,value){value=ObjectHelper.filterValue(property,this.propertyTypes[property],value);this["_"+property]=value;},addLinkCallback:function(aPosition,aFunction){this["_callbacksArray"][aPosition]=aFunction;}};