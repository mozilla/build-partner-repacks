/**
	Copyright 2005-2008 Linkool International Inc. All rights reserved.
	Commercial redistribution or reuse of all or any portion of the following source code is prohibited without Linkool International Inc.'s written consent.
	For licensing and usage information related to this source code, please refer to our Terms of Use, available under: http://linkool.biz/terms/g-fox .
	For Linkool International Inc.'s privacy policy related to this source code, please refer to our Privacy Policy, available under: http://linkool.biz/privacy/g-fox .
**/
const SERVICE_NAME="juice_dao";const SERVICE_ID="{ffa651bd-fb76-4a98-969b-c94b3e8e3b04}";const SERVICE_CTRID="@juiceapp.com/juice_dao;1";const SERVICE_CONSTRUCTOR=LinkoolDAOService;const SERVICE_CID=Components.ID(SERVICE_ID);const SERVICE_IIDS=[Components.interfaces.nsISupports];const SERVICE_CATS=["app-startup"];const SERVICE_FACTORY={_instance:null,createInstance:function(outer,iid){this._instance=new SERVICE_CONSTRUCTOR();return this._instance;}};function xpcom_generateQI(iids){var lines=[];for(var j=iids.length;j-->0;){lines.push("if(Components.interfaces."+iids[j].name+".equals(iid)) return this;");}
lines.push("throw Components.results.NS_ERROR_NO_INTERFACE;");return new Function("iid",lines.join("\n"));}
function xpcom_checkInterfaces(iid,iids,ex){for(var j=0;j<iids.length;j++){if(iid.equals(iids[j]))
{return true;}}
throw ex;}
var Module={firstTime:true,registerSelf:function(compMgr,fileSpec,location,type){if(this.firstTime){compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar).registerFactoryLocation(SERVICE_CID,SERVICE_NAME,SERVICE_CTRID,fileSpec,location,type);var catman=Components.classes['@mozilla.org/categorymanager;1'].getService(Components.interfaces.nsICategoryManager);for(var j=0,len=SERVICE_CATS.length;j<len;j++){catman.addCategoryEntry(SERVICE_CATS[j],SERVICE_CTRID,SERVICE_CTRID,true,true);}
this.firstTime=false;}},unregisterSelf:function(compMgr,fileSpec,location){compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar).unregisterFactoryLocation(SERVICE_CID,fileSpec);var catman=Components.classes['@mozilla.org/categorymanager;1'].getService(Components.interfaces.nsICategoryManager);for(var j=0,len=SERVICE_CATS.length;j<len;j++){catman.deleteCategoryEntry(SERVICE_CATS[j],SERVICE_CTRID,true);}},getClassObject:function(compMgr,cid,iid){if(cid.equals(SERVICE_CID))
return SERVICE_FACTORY;if(!iid.equals(Components.interfaces.nsIFactory))
throw Components.results.NS_ERROR_NOT_IMPLEMENTED;throw Components.results.NS_ERROR_NO_INTERFACE;},canUnload:function(compMgr){return true;}};function NSGetModule(compMgr,fileSpec){return Module;}
function LinkoolDAOService(){try{this.register();}catch(ex){this.log(ex);}}
LinkoolDAOService.prototype={_DAOs:[],init:function(linkoolService)
{this.DBUtil.init(linkoolService);},DBUtil:{db:null,init:function(linkoolService)
{this.db=linkoolService._juiceDatabase;},addItem:function(params)
{return this.doQuery(params);},doQuery:function(sQuery)
{var result=null;if(typeof sQuery=="string")
{result=this._executeQuery(sQuery);}
return result;},deleteItem:function(params)
{return this.doQuery(params);},updateItem:function(params)
{return this.doQuery(params);},_executeQuery:function(sqlQuery)
{var result=true;if(typeof sqlQuery=="string")
{try{this.db.selectQuery(sqlQuery);}catch(e){dump(e+"\n");result=false;}}
else
result=false;return result;},getCount:function(params)
{var result=0;if(typeof params=="string")
{var sqlString=params;var noError=this._executeQuery(sqlString);if(noError)
{var records=this.db.getRecords();if(records!=null)
result=records[0];}}
return result;},getCorrectSingleQuote:function(key)
{key=(key==null||typeof key=="undefined")?"":key;key=key.replace(/'/g,"''");return key;}},registerDAO:function(daoName,daoObj,win)
{var item=null;this.log("register dao:"+daoName);for(var i=0;i<this._DAOs.length;i++)
{if(this._DAOs[i].win==win)
{item=this._DAOs[i];break;}}
if(item==null)
{item={win:win,_DAOs:[]};}
item._DAOs[daoName]=daoObj;this._DAOs.push(item);},unregisterDAO:function(win)
{for(var i=0;i<this._DAOs.length;i++)
{if(this._DAOs[i].win==win)
{this.log("unregister all DAOs in some win");this._DAOs.splice(i,1);break;}}},_startBackComparible:false,action:function(daoName,action,params)
{var wm=Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);var activeWin=wm.getMostRecentWindow("navigator:browser");if(activeWin==null)
return;var dao=null;for(var i=0;i<this._DAOs.length;i++)
{if(this._DAOs[i].win==activeWin)
{var item=this._DAOs[i];dao=item._DAOs[daoName];break;}}
if(typeof dao!="undefined"&&dao!=null)
{if(!this._startBackComparible)
{this._startBackComparible=true;this.DBUtil.db.backComparible();}
if(action.toLowerCase()=="doquery")
{this.log("invoke DBUtil.doQuery");return this.DBUtil.doQuery(params);}
for(var item in dao)
{if(item.toLowerCase()==action.toLowerCase())
{if(typeof dao[item]=="function")
{this.log("invoke "+daoName+"."+action);var result=null;try{result=dao[item](params);}
catch(e){this.log(e);}
return result;}
else
{this.log("action is not a function in dao");}}}
for(var item in this.DBUtil)
{if(item.toLowerCase()==action.toLowerCase())
{if(typeof this.DBUtil[item]=="function")
{this.log("invoke DBUtil."+action);var result=null;try{result=this.DBUtil[item](params);}
catch(e){this.log(e);}
return result;}
else
{this.log("action is not a function in this.DBUtil");}}}
this.log("no action in dao and this.DBUtil");}
else
{this.log("dao not exists!");}},log:function(msg)
{},register:function()
{},get wrappedJSObject()
{return this;},};