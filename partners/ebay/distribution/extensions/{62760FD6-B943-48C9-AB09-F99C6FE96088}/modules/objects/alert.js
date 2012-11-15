/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["Alert"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://ebaycompanion/helpers/objectHelper.js");Cu.import("resource://ebaycompanion/helpers/observers.js");Cu.import("resource://ebaycompanion/objects/item.js");function Alert(aType,aObject){this._type=aType;this._object=aObject;}
Alert.ALERT_TYPE_BIDDING_ENDING_SOON=0;Alert.ALERT_TYPE_BIDDING_OUTBID=1;Alert.ALERT_TYPE_BIDDING_HIGH_BIDDER=2;Alert.ALERT_TYPE_BIDDING_RAISED_BID=3;Alert.ALERT_TYPE_BIDDING_ITEM_WON=4;Alert.ALERT_TYPE_BIDDING_ITEM_LOST=5;Alert.ALERT_TYPE_WATCHING_ENDING_SOON=6;Alert.ALERT_TYPE_SELLING_ENDING_SOON=7;Alert.ALERT_TYPE_SELLING_ITEM_SOLD=8;Alert.ALERT_TYPE_SELLING_ITEM_UNSOLD=9;Alert.ALERT_TYPE_SELLING_BID_PLACED=10;Alert.ALERT_TYPE_SELLING_RESERVE_MET=11;Alert.ALERT_TYPE_FEEDBACK_SCORE=12;Alert.ALERT_TYPE_ITEM_ENDED=13;Alert.ALERT_TYPE_BIDDING_BESTOFFER_DECLINED=14;Alert.ALERT_TYPE_BIDDING_BESTOFFER_EXPIRED=15;Alert.ALERT_TYPE_BIDDING_BESTOFFER_COUNTERED=16;Alert.ALERT_TYPE_SELLING_BESTOFFER_ITEM_SOLD=17;Alert.ALERT_TYPE_BIDDING_BESTOFFER_ITEM_WON=18;Alert.ALERT_TYPE_SELLING_BESTOFFER_NEWOFFER=19;Alert.prototype={constructor:Alert,get type(){return this._type;},get object(){return this._object;},set object(value){this._object=value;},dispatch:function(){Observers.notify(this,"ebay-alert-dispatched",null);},equals:function(aAlert){let equal=false;equal=(this._type==aAlert.type);if(this._object instanceof Item){equal=(this._object.get("itemId")==aAlert.object.get("itemId"));}
return equal;}};