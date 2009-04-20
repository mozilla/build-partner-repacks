/**
	Copyright 2005-2008 Linkool International Inc. All rights reserved.
	Commercial redistribution or reuse of all or any portion of the following source code is prohibited without Linkool International Inc.'s written consent.
	For licensing and usage information related to this source code, please refer to our Terms of Use, available under: http://linkool.biz/terms/g-fox .
	For Linkool International Inc.'s privacy policy related to this source code, please refer to our Privacy Policy, available under: http://linkool.biz/privacy/g-fox .
**/
const CI=Components.interfaces;const CC=Components.classes;const CP_OK=1;const EXTENSION_ID="{livemargins@mozillaonline.com}";const SERVICE_NAME="juice";const SERVICE_ID="{bc89eff0-428b-4bd6-91bd-5c1b0c6985dc}";const SERVICE_CTRID="@juiceapp.com/juice;1";const SERVICE_CONSTRUCTOR=LinkoolJuiceService;const SERVICE_CID=Components.ID(SERVICE_ID);const SERVICE_IIDS=[CI.nsISupports,CI.nsIObserver,CI.nsISupportsWeakReference];const SERVICE_CATS=["app-startup"];const SERVICE_FACTORY={_instance:null,createInstance:function(outer,iid){try{if(outer!=null)
throw Components.results.NS_ERROR_NO_AGGREGATION;xpcom_checkInterfaces(iid,SERVICE_IIDS,Components.results.NS_ERROR_INVALID_ARG);}catch(e){dump(e+"\n")}
return this._instance==null?this._instance=new SERVICE_CONSTRUCTOR():this._instance;}};function xpcom_generateQI(iids){var lines=[];for(var j=iids.length;j-->0;){lines.push("if(CI."+iids[j].name+".equals(iid)) return this;");}
lines.push("throw Components.results.NS_ERROR_NO_INTERFACE;");return new Function("iid",lines.join("\n"));}
function xpcom_checkInterfaces(iid,iids,ex){for(var j=0;j<iids.length;j++){if(iid.equals(iids[j]))
{return true;}}
throw ex;}
var Module={firstTime:true,registerSelf:function(compMgr,fileSpec,location,type){if(this.firstTime){compMgr.QueryInterface(CI.nsIComponentRegistrar).registerFactoryLocation(SERVICE_CID,SERVICE_NAME,SERVICE_CTRID,fileSpec,location,type);var catman=CC['@mozilla.org/categorymanager;1'].getService(CI.nsICategoryManager);for(var j=0,len=SERVICE_CATS.length;j<len;j++){catman.addCategoryEntry(SERVICE_CATS[j],SERVICE_CTRID,SERVICE_CTRID,true,true);}
var workHome=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties).get("UChrm",CI.nsIFile);workHome.append("linkool");if(!workHome.exists()||!workHome.isDirectory())
{workHome.createUnique(CI.nsIFile.DIRECTORY_TYPE,0700);}
workHome.append("juice");if(workHome.exists()&&workHome.isDirectory())
{}
else
{var workHome=workHome.parent;workHome.append("noAds");if(workHome.exists()&&workHome.isDirectory())
{var parentDir=workHome.parent;try{workHome.copyTo(parentDir,"juice");}catch(e)
{dump(e+"\n");}
workHome.remove(true);}
else
{var workHome=workHome.parent;workHome.append("juice");if(!workHome.exists()||!workHome.isDirectory())
workHome.createUnique(CI.nsIFile.DIRECTORY_TYPE,0700);}}
this.firstTime=false;}},unregisterSelf:function(compMgr,fileSpec,location){compMgr.QueryInterface(CI.nsIComponentRegistrar).unregisterFactoryLocation(SERVICE_CID,fileSpec);const catman=CC['@mozilla.org/categorymanager;1'].getService(CI.nsICategoryManager);for(var j=0,len=SERVICE_CATS.length;j<len;j++){catman.deleteCategoryEntry(SERVICE_CATS[j],SERVICE_CTRID,true);}},getClassObject:function(compMgr,cid,iid){if(cid.equals(SERVICE_CID))
return SERVICE_FACTORY;if(!iid.equals(CI.nsIFactory))
throw Components.results.NS_ERROR_NOT_IMPLEMENTED;throw Components.results.NS_ERROR_NO_INTERFACE;},canUnload:function(compMgr){return true;}};function NSGetModule(compMgr,fileSpec){return Module;}
function ioUtility(linkoolService){this.init(linkoolService);}
ioUtility.prototype={_linkoolService:null,_rdfService:null,_juiceref:null,init:function(linkoolService)
{this._linkoolService=linkoolService;this._rdfService=Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);},get juiceref()
{if(this._juiceref==null){try{var ioserv=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);this._juiceref=ioserv.newURI("http://g-fox.com.cn/livemargins",null,null);}
catch(e){dump(e);}}
return this._juiceref;},convertURISpecToUTF8:function(url,charset){try{var decoder=Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);var s;if(charset==null||charset=="")
charset="gb2312";if(charset=="gb2312")
{s=encodeURI(decoder.convertURISpecToUTF8("%D6%D0%CE%C4_"+url,charset));s=s.substring(s.indexOf("_")+1);}
else
{s=encodeURI(decoder.convertURISpecToUTF8(url,charset));}
return s;}catch(ee){return url;}},postData:function(url,data,onComplete){let request=CC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(CI.nsIXMLHttpRequest);request.mozBackgroundRequest=true;var method="POST";if(data==null||data=="")
{data=null;method="GET";}
request.open(method,url,true);request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");request.setRequestHeader("Refer","http://g-fox.com.cn/livemargins");request.onreadystatechange=function(aEvt){if(request.readyState==4){if(typeof onComplete=="function"){onComplete(request);}}};request.send(data);},convertFileToBase64:function(fileName)
{var encoded="";try
{var file=this._linkoolService.workHome;file.append(fileName);if(!file.exists()||!file.isFile())
return encoded;var inputStream=CC["@mozilla.org/network/file-input-stream;1"].createInstance(CI.nsIFileInputStream);inputStream.init(file,0x01,0600,0);var stream=CC["@mozilla.org/binaryinputstream;1"].createInstance(CI.nsIBinaryInputStream);stream.setInputStream(inputStream);encoded=btoa(stream.readBytes(stream.available()));stream.close();inputStream.close();}
catch(e)
{this._linkoolService.log(e);}
return encoded;},removeFile:function(fileName)
{if(typeof fileName=="string")
{try
{var file=this._linkoolService.workHome;file.append(fileName);if(file.exists())
file.remove(true);}
catch(e)
{dump("removeFile "+fileName+" error:"+e);}}
else if(typeof fileName=="object")
{try
{if(fileName.exists())
fileName.remove(true);}
catch(e)
{dump("removeFile error:"+e);}}},writeBase64ToLocalFile:function(fileName,content)
{try{var file=this._linkoolService.workHome;file.append(fileName);if(file.exists()&&file.isFile())
{try{file.remove(true);}catch(e){dump("remove file;error "+e);}}
file.createUnique(CI.nsIFile.NORMAL_FILE_TYPE,0700);var streamOut=CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);var decode=atob(content);if(file.isWritable)
{streamOut.init(file,0x04|0x08,420,0);streamOut.write(decode,decode.length);}
streamOut.close();}catch(e){dump("write base64 file error  "+e);}},downloadFile:function(url,charset,localFileName,overwrite)
{var persist=Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);var path=this._linkoolService.workHome;path.append("dlfiles");if(!path.exists()||!path.isDirectory())
{path.createUnique(CI.nsIFile.DIRECTORY_TYPE,0700);}
var fileName=localFileName;path.append(fileName);overwrite=(overwrite==null)?true:overwrite;if(path.exists()&&path.isFile()&&!overwrite)
return;var ioserv=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);var uri=ioserv.newURI(url,charset,null);persist.saveURI(uri,null,uri,null,"",path);},downloadFileBlocking:function(url,charset,localFileName)
{var path=this._linkoolService.workHome;path.append("dlfiles");if(!path.exists()||!path.isDirectory())
{path.createUnique(CI.nsIFile.DIRECTORY_TYPE,0700);}
var fileName=localFileName;path.append(fileName);if(!path.exists())
{var ioserv=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);var uri=ioserv.newURI(url,charset,null);var channel=ioserv.newChannelFromURI(uri);if(url.indexOf("file:///")!=0&&url.indexOf("chrome://")!=0)
{channel.QueryInterface(Components.interfaces.nsIHttpChannel);channel.setRequestHeader("Referer",url,false);}
var stream=channel.open();if(channel instanceof Components.interfaces.nsIHttpChannel&&channel.responseStatus!=200){}
var bstream=Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);bstream.setInputStream(stream);var size=0;var file_data="";while(size=bstream.available()){file_data+=bstream.readBytes(size);}
path.createUnique(CI.nsIFile.NORMAL_FILE_TYPE,0700);var foStream=Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);foStream.init(path,0x02|0x08|0x20,0666,0);foStream.write(file_data,file_data.length);foStream.close();}
return true;},pingNetwork:function(url)
{var result=0;try
{var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);var uri=ioService.newURI(url,null,null);var channel=ioService.newChannelFromURI(uri);channel.QueryInterface(Components.interfaces.nsIHttpChannel);channel.open();result=channel.responseStatus;}
catch(e)
{}
return result;},readFromNetwork:function(url,charset)
{var result="";try
{var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);var scriptableStream=Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);var unicodeConverter=Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);unicodeConverter.charset=charset;var uri=ioService.newURI(url,charset,null);var channel=ioService.newChannelFromURI(uri);var nsIHttpChannel=CI.nsIHttpChannel;var input;if(channel instanceof nsIHttpChannel)
{var httpChannel=channel.QueryInterface(Components.interfaces.nsIHttpChannel);httpChannel.requestMethod="GET";httpChannel.setRequestHeader("Refer","http://g-fox.com.cn/livemargins",false);input=httpChannel.open();}
else
input=channel.open();scriptableStream.init(input);var length=input.available();while(length>0)
{result+=unicodeConverter.ConvertToUnicode(scriptableStream.read(length));length=input.available();}
scriptableStream.close();input.close();}
catch(e)
{this._linkoolService.log(e);this._linkoolService.log(url+":"+charset);}
return result;},asynchronouslyReadFromNetwork:function(url,callback){try{var appInfo=Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);var isOnBranch=appInfo.platformVersion.indexOf("1.8")==0;var ios=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);var nURI=ios.newURI(url,null,null);var channel=ios.newChannelFromURI(nURI);var observer={onStreamComplete:function(loader,context,status,length,result){if(typeof callback=='function'){callback(loader,context,status,length,result);}}};var streamLoader=Components.classes["@mozilla.org/network/stream-loader;1"].createInstance(Components.interfaces.nsIStreamLoader);if(isOnBranch){streamLoader.init(channel,observer,null);}else{streamLoader.init(observer);channel.asyncOpen(streamLoader,channel);}}catch(e){this._linkoolService.log(e);}},readFromLocalFile:function(fileName)
{if(typeof fileName=="string")
{try{var file=this._linkoolService.workHome;file.append(fileName);var result=[];var line={};if(!file.exists()||!file.isFile())
return result;var istream=CC["@mozilla.org/network/file-input-stream;1"].createInstance(CI.nsIFileInputStream);istream.init(file,0x01,0444,0);istream.QueryInterface(Components.interfaces.nsILineInputStream);var hasmore;do
{hasmore=istream.readLine(line);var value=line.value;value=value.replace(/(^\s*)|(\s*$)/g,"");if(value!="")
result.push(value);}while(hasmore);istream.close();}catch(ex){this._linkoolService.log(ex);}
return result;}
else if(typeof fileName=="object")
{var result=[];var line={};var istream=Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);try{istream.init(fileName,0x01,0444,0);istream.QueryInterface(Components.interfaces.nsILineInputStream);var hasmore;do
{hasmore=istream.readLine(line);var value=line.value;value=value.replace(/(^\s*)|(\s*$)/g,"");if(value!="")
result.push(value);}while(hasmore);istream.close();}catch(e){this._linkoolService.log(e);}
finally{if(istream!=null)
istream.close();}
return result;}},readFromRDFFile:function(url,async)
{var ds=async==true?this._rdfService.GetDataSource(url):this._rdfService.GetDataSourceBlocking(url);return ds;},writeToLocalFile:function(fileName,contentList)
{this._linkoolService.log("write content to "+fileName);var file=this._linkoolService.workHome;file.append(fileName);if(file.exists()&&file.isFile())
file.remove(false);file.createUnique(CI.nsIFile.NORMAL_FILE_TYPE,0600);var streamOut=CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);if(file.isWritable)
{streamOut.init(file,0x04|0x08,420,0);for(i=0;i<contentList.length-1;i++)
streamOut.write(contentList[i]+"\n",(contentList[i]+"\n").length);if(contentList.length-1>=0)
{streamOut.write(contentList[contentList.length-1],contentList[contentList.length-1].length);}}
streamOut.close();}};function FavorListService(linkoolService){this.register(linkoolService);}
FavorListService.prototype={_favorList:null,_linkoolService:null,FILENAME_FAVORLIST:"favorList_PlanCN.xml",get favorList()
{if(this._favorList==null)
{this.loadFavorlist();}
return this._favorList;},fillUpFavorListFunc:function(str,readFromLocal,favorList)
{var dom=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);var result=dom.parseFromString(str,"text/xml");var widgets=result.getElementsByTagName("favorWidget");var widgetList=[];for(var i=0;i<widgets.length;i++)
{var w=widgets[i];var ids=w.getElementsByTagName("widgetID");var wID=(ids.length==0?(i+1):ids[0].childNodes[0].nodeValue);var ignore=false;var wName=w.getElementsByTagName("widgetName")[0].childNodes[0].nodeValue;var desc=w.getElementsByTagName("description")[0].childNodes[0].nodeValue;var wValue=w.getElementsByTagName("widgetValue")[0].childNodes[0].nodeValue;var checked=true;if(readFromLocal)
{wName=unescape(wName);desc=unescape(desc);wValue=unescape(wValue);}
var res={widgetID:parseInt(wID),widgetName:wName,description:desc,widgetValue:wValue,widgetChecked:checked};if(checked)
{var exists=false;for(var j=0;j<favorList.length;j++)
{var favorItem=favorList[j];if(res.widgetID==favorItem.widgetID)
{exists=true;break;}}
if(!exists)
favorList.push(res);}}},loadFavorlist:function(){var io=this._linkoolService.ioUtility;var resultList=[];var str="";var readFromLocal=false;var defaultFavorWidgetFile=this._linkoolService.addonDefaultPath;defaultFavorWidgetFile.append("favorWidgets_default_cn.xml");this._favorList=[];if(defaultFavorWidgetFile.exists()&&defaultFavorWidgetFile.isFile())
{var result=io.readFromLocalFile(defaultFavorWidgetFile);str=result.join("\n");this.fillUpFavorListFunc(str,readFromLocal,this._favorList);}
else
{var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("extensions.focus.");prefs.QueryInterface(CI.nsIPrefBranch2);var baseURL=prefs.getCharPref("baseurl");str=io.readFromNetwork(baseURL+"focus/plugin/favorWidgets_default_cn_v0.0.31.4.xml","UTF-8");this.fillUpFavorListFunc(str,readFromLocal,this._favorList);}
if(false&&(str==""||str.indexOf("favorWidget")<0))
{resultList=io.readFromLocalFile(this.FILENAME_FAVORLIST);str=resultList.join("");readFromLocal=true;}
return this._favorList;},attachNetworkFavor:function(request){this.fillUpFavorListFunc(request.responseText,true,this._favorList);},attachStaticNetworkFavor:function(str){this.fillUpFavorListFunc(str,true,this._favorList);},addFavor:function(key,favorValue)
{if(this._favorList==null)
this._favorList=this.favorList;var exist=false;for(i=0;i<this._favorList.length;i++)
{if(this._favorList[i][0]==key)
{exist=true;this._favorList[i][1]=favorValue;break;}}
if(!exist)
{var value=[];value.push(key);value.push(favorValue);this._favorList.push(value);}
return exist;},removeFavorByContent:function(favor)
{if(this._favorList==null)
this._favorList=this.favorList;for(i=0;i<this._favorList.length;i++)
{var result=this._favorList[i];if(result==favor)
{this._favorList.splice(i,1);break;}}},removeFavorByKey:function(key)
{if(this._favorList==null)
this._favorList=this.favorList;for(i=0;i<this._favorList.length;i++)
{if(this._favorList[i][0]==key)
{this._favorList.splice(i,1);}}},register:function(linkoolService){this._linkoolService=linkoolService;},unregister:function(){return;if(this._favorList!=null&&this._favorList.length>0)
{var io=this._linkoolService.ioUtility;var result=[];result.push('<?xml version="1.0" encoding="UTF-8"?>');result.push('<favorWidgets>');for(i=0;i<this._favorList.length;i++)
{var w=this._favorList[i];result.push('<favorWidget>');result.push('<widgetID>'+w.widgetID+'</widgetID>');result.push('<widgetName>'+escape(w.widgetName)+'</widgetName>');result.push('<description>'+escape(w.description)+'</description>');result.push('<widgetValue>'+escape(w.widgetValue)+'</widgetValue>');result.push('<checked>'+w.widgetChecked+'</checked>');result.push('</favorWidget>');}
result.push('</favorWidgets>');io.writeToLocalFile(this.FILENAME_FAVORLIST,result);}}};function FilterListService(linkoolService){this.register(linkoolService);}
FilterListService.prototype={_filterList:null,_linkoolService:null,get filterList()
{if(this._filterList==null)
{this._filterList=[];}
return this._filterList;},register:function(linkoolService)
{this._linkoolService=linkoolService;if(this._filterList==null)
{this._filterList=this.filterList;}},getFilterListFromLocal:function()
{var io=this._linkoolService.ioUtility;var filterList=io.readFromLocalFile("filterList.dat");return filterList;},getFilterListFromNetwork:function()
{var filterList=null;var io=this._linkoolService.ioUtility;var url="";var charset="utf-8";var result=io.readFromNetwork(url,charset);if(result&&result!="")
{var resultList=result.split("\n");if(resultList&&resultList.length>0)
{filterList=[];for(i=0;i<resultList.length;i++)
{var value=resultList[i].replace(/(^\s*)|(\s*$)/g,"");if(value!=""&&value.indexOf("<!--")==-1&&value.indexOf("http://")!=-1)
filterList.push(value);}}}
return filterList;},dumpListToLocal:function(filterList)
{var io=this._linkoolService.ioUtility;io.writeToLocalFile("filterList.dat",filterList);}};function LinkoolJuiceService(){try{this.register();}catch(ex){this.log(ex);}}
LinkoolJuiceService.prototype={VERSION:"1.0",_uuid:null,_filterListService:null,_workHome:null,_favorListService:null,_ioUtility:null,QueryInterface:xpcom_generateQI(SERVICE_IIDS),generateQI:xpcom_generateQI,_juiceDatabase:null,_firstRun:false,get firstRun(){var prefs=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);var result=false;try{var newAddons=result=prefs.getCharPref("extensions.newAddons");if(newAddons!=null&&newAddons.indexOf("livemargins@mozillaonline.com")>=0)
{result=true;prefs.setBoolPref("extensions.focus.magic.magicon",true);prefs.setBoolPref("extensions.focus.general.juiceon",true);prefs.setBoolPref("extensions.focus.general.openonfirefox",true);prefs.setBoolPref("extensions.focus.magic.autoreveal",false);prefs.setBoolPref("extensions.focus.magic.playsoundon",false);prefs.setBoolPref("extensions.focus.general.juiceopenondrag",false);prefs.setBoolPref("extensions.focus.sync.remember",false);prefs.setBoolPref("extensions.focus.sync.autosync",false);prefs.setCharPref("extensions.focus.general.hotkey.modifiers","control alt");prefs.setCharPref("extensions.focus.general.hotkey.key","J");prefs.setCharPref("extensions.focus.sync.username","");prefs.setCharPref("extensions.focus.sync.password","");prefs.setCharPref("extensions.focus.magic.soundtune","");}}catch(e){}
return result;},set firstRun(value){var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("extensions.focus.");prefs.QueryInterface(CI.nsIPrefBranch2);prefs.setBoolPref("cn.firstRun",value);},_totalcount:0,_instancecount:0,getInstancecount:function(){return this._instancecount;},_collapsed:true,getCollapsed:function(){return this._collapsed},setCollapsed:function(collapsed){this._collapsed=collapsed;},register:function(){},unregister:function(){this._totalcount--;if(this._totalcount==0){if(this._favorListService!=null)
this._favorListService.unregister();}},init:function(){this._instancecount++;this._totalcount++;this._ioUtility=new ioUtility(this);this._favorListService=new FavorListService(this);this._filterListService=new FilterListService(this);if(this._instancecount==1){this._firstRun=this.firstRun;}
if(this._juiceDatabase==null)
{try{this._juiceDatabase=new juiceapp_SQLiteHandler(this);this._juiceDatabase.connectToDefault();}catch(e){this.log("_juiceDatabase init error:"+e);}}
try{}catch(e){dump(e+"\n");}},get favorListService()
{if(this._favorListService==null)
this._favorListService=new FavorListService(this);return this._favorListService;},get filterList()
{if(this._filterListService==null)
this._filterListService=new FilterListService(this);return this._filterListService.filterList;},get favorList()
{if(this._favorListService==null)
this._favorListService=new FavorListService(this);return this._favorListService.favorList;},get historyList()
{return this.historyListService.historyList;},get ioUtility()
{if(this._ioUtility==null)
this._ioUtility=new ioUtility(this);return this._ioUtility;},get workHome()
{this._workHome=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties).get("UChrm",CI.nsIFile);this._workHome.append("linkool");this._workHome.append("juice");return this._workHome;},get addonDefaultPath()
{var addonChromePath=__LOCATION__.parent.parent;addonChromePath.append("defaults");return addonChromePath;},get dbScriptPath()
{var addonChromePath=__LOCATION__.parent.parent;addonChromePath.append("defaults");addonChromePath.append("sqlScript");return addonChromePath;},get wrappedJSObject(){return this;},get uuid(){if(this._uuid==null)
{var io=this.ioUtility;var result=io.readFromLocalFile("uuid.dat");if(result.length==0)
{var guid=this.genUUID();var result=[guid];io.writeToLocalFile("uuid.dat",result);this._uuid=guid;}
else
{this._uuid=result[0];}}
return this._uuid;},genUUID:function(){var guid="{{";for(i=1;i<=32;i++)
{var n=Math.floor(Math.random()*16.0).toString(16);guid+=n;if((i==8)||(i==12)||(i==16)||(i==20))
guid+="-";}
guid+="}}";return guid;},log:function(msg)
{dump(msg+"\n");},addChild:function(doc,element)
{if(doc.getElementsByTagName("body")&&doc.getElementsByTagName("body")[0])
{var ele=doc.getElementsByTagName("body")[0];ele.insertBefore(element,ele.firstChild);}
else if(doc.getElementsByTagName("head")&&doc.getElementsByTagName("head")[0])
{var ele=doc.getElementsByTagName("head")[0];ele.insertBefore(element,ele.firstChild);}
else
{doc.firstChild.appendChild(element);}},addScript:function(doc,src,scriptCode,intoHead,charset)
{var w=doc.defaultView;if(!w)
{return;}
var s=w.document.createElement("script");if(src&&src!="")
s.src=src;var textNode=w.document.createTextNode(scriptCode);if(charset!=null&&charset!="")
s.setAttribute("charset",charset);s.appendChild(textNode);this.addChild(doc,s);},addStyle:function(doc,src)
{var w=doc.defaultView;var s=w.document.createElement("link");if(src&&src!="")
s.setAttribute("href",src);s.setAttribute("rel","stylesheet");s.setAttribute("type","text/css");this.addChild(doc,s);},addHistoryInfo:function(doc)
{var script=doc.createElement("script");var historyList=this.historyList;var historyListValue="var historyList = [";for(i=0;i<historyList.length-1;i++)
{historyListValue+="['"+(historyList[i].time)+"','"+(historyList[i].key)+"'],";}
if(historyList.length-1>=0)
{historyListValue+="['"+(historyList[historyList.length-1].time)+"','"+(historyList[historyList.length-1].key)+"']";}
historyListValue+="];";var textNode=doc.createTextNode(historyListValue);script.appendChild(textNode);this.addChild(doc,script);},addFavorInfo:function(doc,fullContent)
{var script=doc.createElement("script");var favorList=this.favorList;var favorListValue="var favorList = [";if(fullContent)
{for(i=0;i<favorList.length-1;i++)
{favorListValue+="['"+(favorList[i][0])+"','"+(favorList[i][1])+"'],";}
if(favorList.length-1>=0)
{favorListValue+="['"+(favorList[favorList.length-1][0])+"','"+(favorList[favorList.length-1][1])+"']";}}
favorListValue+="];";var textNode=doc.createTextNode(favorListValue);script.appendChild(textNode);this.addChild(doc,script);},shouldLoad:function(aContentType,aContentLocation,aRequestOrigin,aContext,aMimeTypeGuess,aInternalCall){return CP_OK;},shouldProcess:function(aContentType,aContentLocation,aRequestOrigin,aContext,aMimeType,aExtra){return this.shouldLoad(aContentType,aContentLocation,aRequestOrigin,aContext,aMimeType,true);},observe:function(aSubject,aTopic,aData){try{switch(aTopic){case'http-on-modify-request':aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);this.onModifyRequest(aSubject);break;case'app-startup':this.onAppStartup();break;case'http-on-examine-response':{try{var oHttpChannel=aSubject;oHttpChannel.QueryInterface(Components.interfaces.nsIChannel);var s=oHttpChannel.URI.spec;if(s.indexOf("http://fchart.sina.com.cn/newchart/small/")==0)
{oHttpChannel.setResponseHeader("Cache-Control","no-cache,no-store",true);}}catch(e){this.log(e);}
break;}
default:this.log("observe: unknown topic: "+aTopic);break;}}catch(ex){this.log("observe: "+ex);}},onAppStartup:function(){try{var observerService=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);observerService.addObserver(this,"http-on-modify-request",true);observerService.addObserver(this,"http-on-examine-response",true);}catch(ex){this.log("onAppStartup: "+ex);}},onModifyRequest:function(oHttpChannel){try{var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("extensions.focus.");prefs.QueryInterface(CI.nsIPrefBranch2);var refRegExp=prefs.getCharPref("refRegExp");var reg=new RegExp(refRegExp,"i");oHttpChannel.QueryInterface(Components.interfaces.nsIChannel);var s=oHttpChannel.URI.host;var refer=oHttpChannel.getRequestHeader("Referer");if(refer!=null&&refer!="http://g-fox.com.cn/livemargins"){if(refer.indexOf("//")>0)
refer=refer.substring(refer.indexOf("//")+2);if(reg.test(refer)){if(!reg.test(s))
{if(oHttpChannel.URI.path.indexOf(".png")!=-1||oHttpChannel.URI.path.indexOf(".jpg")!=-1||oHttpChannel.URI.path.indexOf(".gif")!=-1)
{oHttpChannel.setRequestHeader("Referer",oHttpChannel.URI.spec,false);}}}}}catch(e){}},md5:function(s)
{var str=s;var converter=Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);converter.charset="UTF-8";var result={};var data=converter.convertToByteArray(str,result);var ch=Components.classes["@mozilla.org/security/hash;1"].createInstance(Components.interfaces.nsICryptoHash);ch.init(ch.MD5);ch.update(data,data.length);var hash=ch.finish(false);function toHexString(charCode)
{return("0"+charCode.toString(16)).slice(-2);}
var s=[];for(var i=0;i<hash.length;i++)
{var result=toHexString(hash.charCodeAt(i));s.push(result);}
s=s.join("");return s;}};var observerService=Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);var shutDownObserver={observe:function(){try{var searchFolder=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties).get("ProfD",CI.nsIFile);searchFolder.append("searchplugins");searchFolder.append("juice.xml");if(searchFolder.exists()&&searchFolder.isFile())
searchFolder.remove(true);}catch(e){dump(e+"\n");}}};function juiceapp_SQLiteHandler(linkoolService){this.storageService=Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);this.linkoolService=linkoolService;};juiceapp_SQLiteHandler.prototype={g_strForNull:"NULL",g_strForBlob:"_BLOB_",g_showBlobSize:true,dataConnection:null,aTableData:null,aTableType:null,aColumns:null,colNameArray:null,resultsArray:null,statsArray:null,lastErrorString:"",sErrorMessage:null,sExceptionName:null,sExceptionMessage:null,isSynchronizing:false,linkoolService:null,version:8,ConnectToDatabase:function(nsIFile)
{this.closeConnection();try
{this.dataConnection=this.storageService.openDatabase(nsIFile);if(this.dataConnection==null)
return false;}
catch(e)
{this.linkoolService.log(e);return false;}
if(this.dataConnection==null)
return false;return true;},checkTables:function()
{try
{if(this.dataConnection==null)
return false;this.selectQuery('DROP TABLE IF EXISTS tb_videoHistory_old;');this.selectQuery('DROP TABLE IF EXISTS tb_textHistory_old;');this.selectQuery('DROP TABLE IF EXISTS tb_tag_old;');this.selectQuery('DROP TABLE IF EXISTS tb_albumHistory_old;');this.selectQuery('DROP TABLE IF EXISTS tb_rs_tagAndItem_old;');var stmt=this.dataConnection.createStatement("select count(*) from `tb_videoHistory`");if(stmt.executeStep())
{var count=stmt.getString(0);}}
catch(e)
{try{if(stmt!=null)
stmt.finalize();}catch(e3){}}
return true;},constructDatabase:function()
{var createFile=this.linkoolService.dbScriptPath;createFile.append("sqlbatch_create.sql");if(createFile.exists()&&createFile.isFile())
{var result=this.linkoolService.ioUtility.readFromLocalFile(createFile);var newok=true;for(var i=0;i<result.length;i++)
{var sqlCmd=result[i];newok=newok&&this.selectQuery(sqlCmd);}
if(newok)
{this.selectQuery('INSERT OR REPLACE INTO tb_version values(1,'+this.version+')');}
return newok;}
else
{this.selectQuery("drop TABLE `history`;");var newok=this.selectQuery("CREATE TABLE `history` (`fd_widgetId` INTEGER NOT NULL  DEFAULT '0' ,`fd_keyword` VARCHAR DEFAULT '' ,`fd_widgetCategoryId` INTEGER DEFAULT '' ,`fd_widgetAppearence` TEXT DEFAULT '' ,`fd_lastModify` TIMESTAMP DEFAULT '''2008-1-1 00:00:01''' , `fd_imageURL` VARCHAR DEFAULT '', `fd_index` VARCHAR NOT NULL  DEFAULT '');")&&this.selectQuery("CREATE UNIQUE INDEX `idx` ON `history` (`fd_index` DESC)");return newok;}},backComparible:function()
{workHome=this.linkoolService.workHome;workHome.append("historyList_CN.dat");if(workHome.exists()&&workHome.isFile())
{var result=this.linkoolService.ioUtility.readFromLocalFile(workHome);var nativeJSON=Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);var dbSvc=Components.classes["@juiceapp.com/juice_dao;1"].getService().wrappedJSObject;for(var i=0;i<result.length;i++)
{var item=nativeJSON.decode(unescape(result[i]));if(item)
{switch(item._hKey._mediaType)
{case 5:{var params={fd_key:item._hKey._key,fd_type:"history",fd_widgetValue:item._hKey._iaValue};dbSvc.action("text","addItem",params);break;}
case 1:{var url=item._hKey._key.url;var windowURL=item._hKey._key.windowURL;windowURL=typeof windowURL=="undefined"?"":windowURL;var params={fd_imageURL:url,cateName:"default",fd_jsonValue:escape(nativeJSON.encode({url:"localfile:"+url,windowURL:windowURL}))};dbSvc.action("album","addItem",params);break;}}}}
workHome.remove(true);}},updateDatabase:function()
{this.selectQuery("CREATE TABLE IF NOT EXISTS `tb_version` (`fd_id` INTEGER PRIMARY KEY AUTOINCREMENT, `fd_version` INTEGER);");this.selectQuery('select fd_version from tb_version');var results=this.getRecords();var currentDBVersion=0;if(results.length>0)
{currentDBVersion=results[0][0];}
var newok=true;currentDBVersion=parseInt(currentDBVersion);if(currentDBVersion<this.version)
{if(currentDBVersion==0)
{this.constructDatabase();var workHome=this.linkoolService.workHome;workHome.append("testDB4.sqlite");if(workHome.exists()&&workHome.isFile())
{this.selectQuery('ATTACH DATABASE "'+workHome.path+'" AS "oldDB"');this.selectQuery('insert into tb_videoHistory select * from oldDB.history');this.selectQuery('DETACH DATABASE "oldDB"');workHome.remove(true);}}
else
for(var i=currentDBVersion+1;i<=this.version;i++)
{var updateFile=this.linkoolService.dbScriptPath;updateFile.append("sqlbatch_update_v"+i+".sql");if(updateFile.exists()&&updateFile.isFile())
{var result=this.linkoolService.ioUtility.readFromLocalFile(updateFile);for(var j=0;j<result.length;j++)
{var sqlCmd=result[j];newok=newok&&this.selectQuery(sqlCmd);}}}
if(true)
{this.selectQuery('SELECT fd_imageURL,fd_jsonValue FROM tb_albumHistory WHERE fd_imageURL NOT LIKE "localfile:%";');var results=this.getRecords();for(var i=0;i<results.length;i++)
{var record=results[i];var url=record[0];var jsonValue=record[1];var fileName=this.linkoolService.md5(url);this.linkoolService.ioUtility.downloadFile(url,"utf-8",fileName,false);var newUrl="localfile:"+url;jsonValue=jsonValue.replace(/http%3A/i,"localfile%3Ahttp%3A");this.selectQuery("UPDATE tb_albumHistory SET fd_imageURL='"+newUrl+"',fd_jsonValue='"+jsonValue+"' WHERE fd_imageURL='"+url+"';");this.selectQuery("UPDATE tb_rs_tagAndItem SET fd_itemKey='"+newUrl+"' WHERE fd_itemKey='"+url+"';");}}}
if(newok)
{this.selectQuery('INSERT OR REPLACE INTO tb_version values(1,'+this.version+')');}
return newok;},closeConnection:function()
{if(this.dataConnection!=null)
{try{this.dataConnection.close();}catch(e){}
try{this.dataConnection=null;}catch(e){}}
this.aTableData=null;this.aTableType=null;this.aColumns=null;},getFileName:function()
{if(this.dataConnection!=null)
return this.dataConnection.databaseFile.leafName;return null;},getSqliteVersion:function()
{var sQuery="SELECT sqlite_version()";this.selectQuery(sQuery);var sVersion=this.aTableData[0][0];return sVersion;},getSchemaVersion:function()
{return this.dataConnection.schemaVersion;},setSetting:function(sSetting,sValue)
{if(sSetting=="encoding"||sSetting=="temp_store_directory")
sValue="'"+sValue+"'";var sQuery="PRAGMA "+sSetting+" = "+sValue;this.selectQuery(sQuery);return this.getSetting(sSetting);},getSetting:function(sSetting)
{var iValue=null;var sQuery="PRAGMA "+sSetting;this.selectQuery(sQuery);iValue=this.aTableData[0][0];return iValue;},getMasterInfo:function(sObjName,sField)
{var sQuery="SELECT "+sField+" FROM sqlite_master WHERE name='"+sObjName+"'";this.selectQuery(sQuery);return this.aTableData[0][0];},getObjectList:function(sObjectType)
{return this.getSchemaArray(sObjectType);},getSchemaArray:function(sType)
{var aResult=new Array();var iCount=0;var sQuery="SELECT name FROM sqlite_master WHERE type = '"
+sType+"' ORDER BY name";this.selectQuery(sQuery);for(var i=0;i<this.aTableData.length;i++)
aResult.push(this.aTableData[i][0]);return aResult;},loadTableData:function(sObjType,sObjName,sCondition,iLimit,iOffset)
{if(sObjType!="table"&&sObjType!="view")
return false;iLimit=parseInt(iLimit);if(isNaN(iLimit))
iLimit=-1;iOffset=parseInt(iOffset);if(isNaN(iOffset))
iOffset=0;var extracol="";var sLimitClause=" LIMIT "+iLimit+" OFFSET "+iOffset;if(sObjType=="table")
{var rowidcol=this.getTableRowidCol(sObjName);if(rowidcol["name"]=="rowid")
extracol=" `rowid`, ";}
this.selectQuery("SELECT "+extracol+" * FROM `"+sObjName+"` "
+sCondition+sLimitClause);return true;},getTableCount:function(sObjName,sCondition)
{var iValue=0;var sQuery="SELECT count(*) FROM `"+sObjName+"` "+sCondition;this.selectQuery(sQuery);iValue=this.aTableData[0][0];return iValue;},emptyTable:function(sTableName)
{var sQuery="DELETE FROM "+sm_backquote(sTableName);return this.confirmAndExecute([sQuery],"Delete All Records");},analyzeTable:function(sTableName)
{var sQuery="ANALYZE "+sTableName;return this.confirmAndExecute([sQuery],"Analyze Table");},reindexObject:function(sObjectType,sObjectName)
{var sQuery="REINDEX '"+sObjectName+"'";return this.confirmAndExecute([sQuery],sQuery);},dropObject:function(sObjectType,sObjectName)
{var sQuery="DROP "+sObjectType+" "+sm_backquote(sObjectName);return this.confirmAndExecute([sQuery],sQuery);},getRecords:function()
{return this.aTableData;},getRecordTypes:function()
{return this.aTableType;},getColumns:function()
{return this.aColumns;},selectQuery:function(sQuery,bBlobAsHex)
{this.aTableData=new Array();this.aTableType=new Array();this.aColumns=null;var bResult=false;try{var stmt=this.dataConnection.createStatement(sQuery);var iCols=0;var iType,colName;iCols=stmt.columnCount;this.aColumns=new Array();var aTemp,aType;for(var i=0;i<iCols;i++){colName=stmt.getColumnName(i);aTemp=[colName,iType];this.aColumns.push(aTemp);}
var cell;var bFirstRow=true;while(stmt.executeStep())
{aTemp=[];aType=[];for(i=0;i<iCols;i++)
{iType=stmt.getTypeOfIndex(i);if(bFirstRow)
{this.aColumns[i][1]=iType;}
switch(iType){case stmt.VALUE_TYPE_NULL:cell=this.g_strForNull;break;case stmt.VALUE_TYPE_INTEGER:cell=stmt.getInt64(i);break;case stmt.VALUE_TYPE_FLOAT:cell=stmt.getDouble(i);break;case stmt.VALUE_TYPE_TEXT:cell=stmt.getString(i);break;case stmt.VALUE_TYPE_BLOB:if(bBlobAsHex){var iDataSize={value:0};var aData={value:null};stmt.getBlob(i,iDataSize,aData);cell=sm_blob2hex(aData.value);}
else{cell=this.g_strForBlob;if(this.g_showBlobSize){var iDataSize={value:0};var aData={value:null};stmt.getBlob(i,iDataSize,aData);cell+=" (Size: "+iDataSize.value+")";}}
break;default:sData="<unknown>";}
aTemp.push(cell);aType.push(iType);}
this.aTableData.push(aTemp);this.aTableType.push(aType);bFirstRow=false;}
this.setErrorString();return true;}
catch(e){this.onSqlError(e,"Likely SQL syntax error: "+sQuery,this.dataConnection.lastErrorString);this.setErrorString();return false;}
finally{try{if(stmt!=null)
{stmt.finalize();}}catch(e){}}},selectBlob:function(sTable,sField,sWhere)
{var sQuery="SELECT "+sm_backquote(sField)+" FROM "+sm_backquote(sTable)+" WHERE "+sWhere;try{var stmt=this.dataConnection.createStatement(sQuery);}
catch(e){this.onSqlError(e,"Likely SQL syntax error: "+sQuery,this.dataConnection.lastErrorString);this.setErrorString();return false;}
if(stmt.columnCount!=1)
return false;var cell;try{stmt.executeStep();if(stmt.getTypeOfIndex(0)!=stmt.VALUE_TYPE_BLOB)
return false;var iDataSize={value:0};var aData={value:null};stmt.getBlob(0,iDataSize,aData);cell="BLOB (Size: "+iDataSize.value+")";return aData.value;}catch(e){this.onSqlError(e,"Query: "+sQuery+" - executeStep failed",null);this.setErrorString();return false;}finally{try{if(stmt!=null)
{stmt.finalize();}}catch(e){}}
this.setErrorString();return true;},getTableRowidCol:function(sTableName)
{var sQuery="PRAGMA table_info(`"+sTableName+"`)";this.selectQuery(sQuery);var aReturn=[];var iPk,iType,iName,iCid;for(var i in this.aColumns)
{switch(this.aColumns[i][0])
{case"pk":iPk=i;break;case"type":iType=i;break;case"name":iName=i;break;case"cid":iCid=i;break;}}
var iNumPk=0,iIntPk=0;for(var i=0;i<this.aTableData.length;i++)
{var row=this.aTableData[i];var type=row[iType];var pk=row[iPk];type=type.toUpperCase();if(pk==1)
{iNumPk++;if(type=="INTEGER")
{iIntPk++;var name=row[iName];var cid=row[iCid];aReturn["name"]=name;aReturn["cid"]=cid;}}}
if(iNumPk==1&&iIntPk==1)
return aReturn;aReturn["name"]="rowid";aReturn["cid"]=0;return aReturn;},getTableColumns:function(sTableName)
{var sQuery="PRAGMA table_info(`"+sTableName+"`)";this.selectQuery(sQuery);var aCols=new Array();for(var i in this.aColumns)
{var aTemp=[i,this.aColumns[i][1]];aCols[this.aColumns[i][0]]=aTemp;}
var aResult=[this.aTableData,aCols,this.aTableType];return aResult;},getTableColumnsWithDefaultValue:function(sTableName)
{var aResult=[];var info=this.getTableColumns(sTableName);var columns=info[0];for(var i=0;i<columns.length;i++)
{if(columns[i][info[1]["dflt_value"][0]]!=this.g_strForNull)
aResult.push(columns[i][info[1]["name"][0]]);}
return aResult;},getTableInfo:function(sTableName,ciInfoType)
{var aResult=[];var sQuery="PRAGMA table_info(`"+sTableName+"`)";this.selectQuery(sQuery);aResult["numFields"]=this.aTableData.length;sQuery="PRAGMA index_list(`"+sTableName+"`)";this.selectQuery(sQuery);if(this.aTableData!=null)
aResult["numIndexes"]=this.aTableData.length;else
aResult["numIndexes"]=0;aResult["numRecords"]=this.getTableCount(sTableName,"");return aResult;},getIndexInfo:function(sIndexName)
{var sQuery="SELECT sql, tbl_name FROM sqlite_master WHERE type='index' and name='"+sIndexName+"'";this.selectQuery(sQuery);var aReturn=[];aReturn["sql"]=this.aTableData[0][0];aReturn["table"]=this.aTableData[0][1];var sQuery="PRAGMA index_info(`"+sIndexName+"`)";this.selectQuery(sQuery);var iRequiredField=2;var cols=[];for(var i=0;i<this.aTableData.length;i++)
{cols.push(this.aTableData[i][iRequiredField]);}
aReturn["cols"]=cols;aReturn["unique"]=0;var sQuery="PRAGMA index_list(`"+aReturn["table"]+"`)";this.selectQuery(sQuery);for(var i=0;i<this.aTableData.length;i++)
{if(this.aTableData[i][1]==sIndexName)
aReturn["unique"]=this.aTableData[i][2];}
return aReturn;},select:function(file,sql,param)
{var ourTransaction=false;if(this.dataConnection.transactionInProgress)
{ourTransaction=true;this.dataConnection.beginTransactionAs(this.dataConnection.TRANSACTION_DEFERRED);}
var statement=this.dataConnection.createStatement(sql);if(param)
{for(var m=2,arg=null;arg=arguments[m];m++)
{statement.bindUTF8StringParameter(m-2,arg);}}
try
{var dataset=[];while(statement.executeStep())
{var row=[];for(var i=0,k=statement.columnCount;i<k;i++)
{row[statement.getColumnName(i)]=statement.getUTF8String(i);}
dataset.push(row);}}
finally
{try{if(statement!=null)
{statement.finalize();}}catch(e){}}
if(ourTransaction)
{this.dataConnection.commitTransaction();}
return dataset;},executeMultiple:function(sQuery)
{if(this.dataConnection.transactionInProgress)
this.dataConnection.commitTransaction();if(!this.dataConnection.transactionInProgress)
this.dataConnection.beginTransaction();var aQueries=[];var arr=sQuery.split(";");var i=0;var str=arr[i];while(true)
{var statement=this.isValidStatement(str);if(statement)
{aQueries.push(str);try{statement.execute();this.setErrorString();}
catch(e){this.onSqlError(e,"Execute failed: "+str,this.dataConnection.lastErrorString);this.setErrorString();if(this.dataConnection.transactionInProgress){this.dataConnection.rollbackTransaction();}
return false;}
finally{try{if(statement!=null)
{statement.finalize();}}catch(e){}}
i++;if(i>=arr.length)
{this.dataConnection.commitTransaction();return true;}
else
str=arr[i];}
else{i++;if(i>=arr.length)
{this.onSqlError(e,"Likely SQL syntax error: "+arr[i],this.dataConnection.lastErrorString);this.setErrorString();return false;}
else
{str=str+";"+arr[i];continue;}}}
if(this.dataConnection.transactionInProgress)
this.dataConnection.commitTransaction();return true;},isValidStatement:function(sQuery)
{try{var statement=this.dataConnection.createStatement(sQuery);}
catch(e){return false;}
return statement;},executeTransaction:function(aQueries)
{if(this.dataConnection.transactionInProgress)
this.dataConnection.commitTransaction();if(!this.dataConnection.transactionInProgress)
this.dataConnection.beginTransaction();for(var i=0;i<aQueries.length;i++)
{try{var statement=this.dataConnection.createStatement(aQueries[i]);}
catch(e){this.onSqlError(e,"Likely SQL syntax error: "+aQueries[i],this.dataConnection.lastErrorString);this.setErrorString();if(this.dataConnection.transactionInProgress){this.dataConnection.rollbackTransaction();}
return false;}
try{statement.execute();this.setErrorString();}
catch(e){this.onSqlError(e,"Execute failed: "+aQueries[i],this.dataConnection.lastErrorString);this.setErrorString();if(this.dataConnection.transactionInProgress){this.dataConnection.rollbackTransaction();}
return false;}
finally{statement.reset();}}
if(this.dataConnection.transactionInProgress)
this.dataConnection.commitTransaction();return true;},getLastError:function()
{return this.lastErrorString;},setErrorString:function()
{this.lastErrorString=this.dataConnection.lastErrorString;},executeWithParams:function(sQuery,aParamData)
{try{var stmt=this.dataConnection.createStatement(sQuery);}catch(e){this.onSqlError(e,"Create statement failed: "+sQuery,this.dataConnection.lastErrorString);this.setErrorString();return false;}
for(var i=0;i<aParamData.length;i++)
{var aData=aParamData[i];switch(aData[2])
{case"blob":try{stmt.bindBlobParameter(aData[0],aData[1],aData[1].length);}catch(e){this.onSqlError(e,"Binding failed for parameter: "+aData[0],this.dataConnection.lastErrorString);this.setErrorString();return false;}
break;}}
try{stmt.execute();}catch(e){this.onSqlError(e,"Execute failed: "+sQuery,this.dataConnection.lastErrorString);this.setErrorString();return false;}
try{stmt.reset();if(gbGecko_1_9)
stmt.finalize();}catch(e){this.onSqlError(e,"Failed to reset/finalize",this.dataConnection.lastErrorString);this.setErrorString();return false;}
return true;},confirmAndExecute:function(aQueries,sMessage,confirmPrefName,aParamData)
{var ask="Are you sure you want to perform the following operation(s):";var sQuery="";for(var i=0;i<aQueries.length;i++)
sQuery+=aQueries[i]+"\n";var bConfirm=true;if(confirmPrefName!=undefined)
bConfirm=sm_prefsBranch.getBoolPref(confirmPrefName);else
bConfirm=sm_prefsBranch.getBoolPref("confirm.otherSql");var answer=true;if(bConfirm)
{var txt=ask+"\n"+sMessage+"\nSQL: "+sQuery;if(typeof sMessage=="object"&&!sMessage[1])
{txt=ask+"\n"+sMessage[0];}
answer=smPrompt.confirm(null,"SQLite Manager: Confirm the operation",txt);}
if(answer)
{if(aParamData)
return this.executeWithParams(aQueries[0],aParamData);else
return this.executeTransaction(aQueries);}
return false;},onSqlError:function(ex,msg,SQLmsg)
{this.linkoolService.log(msg+"-->"+SQLmsg);throw ex;},connectToDefault:function()
{this.closeConnection();try{var workHome=this.linkoolService.workHome;var fileName="juicedata_en.sqlite";var file=workHome;file.append(fileName);var errorformat=true;if(file.exists()&&file.isFile()){try{var isOK=this.ConnectToDatabase(file);isOK=isOK&&this.checkTables();isOK=isOK&&this.updateDatabase();if(isOK)
errorformat=false;else
{this.closeConnection();try{this.linkoolService.ioUtility.removeFile(fileName);}catch(ex){this.linkoolService.log("remove file error "+ex);}}}catch(e){errorformat=true;this.linkoolService.log(e);}}
if(errorformat){var newfile=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);newfile.initWithPath(file.path);file=newfile;this.ConnectToDatabase(file);this.checkTables();this.constructDatabase();}}catch(e){this.linkoolService.log("connectToDefault error "+e);}},excuteQuery:function(sQuery)
{try{var stmt=this.dataConnection.createStatement(sQuery);stmt.execute();return true;}
catch(e){if(excuteQuery.indexOf("DETACH")==0){this.onSqlError(e,"Likely SQL syntax error: "+excuteQuery,this.dataConnection.lastErrorString);this.setErrorString();}
return false;}
finally{try{if(stmt!=null)
{stmt.finalize();}}catch(e){}}},syncAllPic:function(){try{var sQuery='select fd_imageURL from tb_albumHistory';this.selectQuery(sQuery);var records=this.getRecords();for(var i=0;i<records.length;i++)
{var record=records[i];var url=record[0];if(url.indexOf("localfile:")==0)
{url=url.substring(url.indexOf("localfile:")+"localfile:".length);try{this.linkoolService.ioUtility.downloadFile(url,null,juiceapp_hex_md5(url),false);}catch(ee){this.linkoolService.log("syncData checkimage error :"+ee);}}}}catch(e){this.linkoolService.log("syncData checkimage error :"+e);}},detachDatabase:function(newDB,win){try{this.excuteQuery('DETACH DATABASE "'+newDB+'"');}catch(e){win.setTimeout(this.detachDatabase,5000,newDB,win);return;}
try{var workHome=this.linkoolService.workHome;var file=workHome;var newDBFile=newDB+".sqlite";file.append(newDBFile);if(file.exists()&&file.isFile())
{file.remove(true);}}catch(e){this.linkoolService.log("remove "+newDB+" error :"+e);return;}
this.isSynchronizing=false;},syncData:function(newDB,win){var workHome=this.linkoolService.workHome;if(!workHome.exists()||!workHome.isDirectory()){return false;}
var file=workHome;var newDBFile=newDB+".sqlite";file.append(newDBFile);if(file.exists()&&file.isFile())
{try{this.isSynchronizing=true;this.excuteQuery('ATTACH DATABASE "'+file.path+'" AS "'+newDB+'"');this.excuteQuery('delete from tb_albumHistory');this.excuteQuery('delete from tb_videoHistory');this.excuteQuery('delete from tb_textHistory');this.excuteQuery('insert or replace into tb_albumHistory select * from '+newDB+'.tb_albumHistory');this.excuteQuery('insert or replace into tb_videoHistory select * from '+newDB+'.tb_videoHistory');this.excuteQuery('insert or replace into tb_textHistory select * from '+newDB+'.tb_textHistory');}catch(e){this.linkoolService.log("syncData "+newDB+" error :"+e);}
win.setTimeout(this.detachDatabase,5000,newDB,win);this.syncAllPic();}}};