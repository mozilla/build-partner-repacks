
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);try{var gConfigFilePath="file://"+__LOCATION__.parent.path+"/extconfig.js";loader.loadSubScript(gConfigFilePath);loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/utils.js");loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/logger.js");}catch(e){debug(e)}
var CacheManager={mFileDataSource:null,mRDFService:null,rscBookmarksRoot:null,NC_NS:"http://home.netscape.com/NC-rdf#",mRscUrl:null,mRscData:null,mRscTimeStamp:null,init:function(fileIO){try{if(this.mFileDataSource){return;}
var cacheDir=fileIO.getCacheDir();var file=cacheDir.clone().QueryInterface(CI.nsILocalFile);file.append("cacheData.rdf");if(!file.exists()){var data='<?xml version="1.0"?>\n<RDF:RDF xmlns:NC="http://home.netscape.com/NC-rdf#" '+'xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n</RDF:RDF>';fileIO.writeFile(file,data);}
var networkProtocol=CC["@mozilla.org/network/protocol;1?name=file"].createInstance(CI.nsIFileProtocolHandler);var fileURI=networkProtocol.newFileURI(file);this.mFileDataSource=CC["@mozilla.org/rdf/datasource;1?name=xml-datasource"].createInstance(CI.nsIRDFRemoteDataSource);this.mFileDataSource=this.mFileDataSource.QueryInterface(CI.nsIRDFDataSource);this.mFileDataSource.Init(fileURI.spec);this.mFileDataSource.Refresh(true);this.mRDFService=CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);var rdfContainerUtils=CC["@mozilla.org/rdf/container-utils;1"].getService(CI.nsIRDFContainerUtils);this.mFileDataSource=this.mFileDataSource.QueryInterface(CI.nsIRDFRemoteDataSource);this.rscBookmarksRoot=this.mRDFService.GetResource("NC:CacheRoot");this.rscBookmarksRoot=rdfContainerUtils.MakeSeq(this.mFileDataSource,this.rscBookmarksRoot);this.mRscUrl=this.mRDFService.GetResource(this.NC_NS+"URL");this.mRscData=this.mRDFService.GetResource(this.NC_NS+"Data");this.mRscTimeStamp=this.mRDFService.GetResource(this.NC_NS+"Ts");}catch(e){this.mFileDataSource=null;yahooToolbarDebug(e);}
return;},getResource:function(aName,insertIfAbsent){var target=this.mRDFService.GetLiteral(aName);var resource=this.mFileDataSource.GetSource(this.mRscUrl,target,true);if(!resource&&insertIfAbsent){resource=this.mRDFService.GetAnonymousResource();this.mFileDataSource.Assert(resource,this.mRscUrl,target,true);this.rscBookmarksRoot.AppendElement(resource);this.mFileDataSource.Flush();}
return resource;},changeDataForKey:function(url,data){try{var resource=this.getResource(url,true);var oldData=this.mFileDataSource.GetTarget(resource,this.mRscData,true);var newData=this.mRDFService.GetLiteral(data);if(oldData){this.mFileDataSource.Change(resource,this.mRscData,oldData,newData);}else{this.mFileDataSource.Assert(resource,this.mRscData,newData,true);}
this.mFileDataSource.Flush();}catch(e){yahooToolbarDebug(e);}},getDataForKey:function(url){var data=null;try{var target=this.mRDFService.GetLiteral(url);var resource=this.mFileDataSource.GetSource(this.mRscUrl,target,true);if(resource){target=this.mFileDataSource.GetTarget(resource,this.mRscData,true);if(target instanceof CI.nsIRDFLiteral){data=target.Value;}}}catch(e){yahooToolbarDebug(e);}
return(data);}};function YahooFileIO(){var componentFile=__LOCATION__;this.mComponentDir=componentFile.parent;this.mExtensionDir=this.mComponentDir.parent;CacheManager.init(this);}
YahooFileIO.prototype={mProfileDir:null,mCacheDir:null,getProfileDir:function(){try{if(this.mProfileDir===null){var prefd=CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);this.mProfileDir=prefd.get('PrefD',CI.nsILocalFile);}
var ret=this.mProfileDir.clone().QueryInterface(CI.nsILocalFile);return ret;}catch(e){yahooToolbarDebug(e);this.mProfileDir=null;throw'ERROR fetching profile directory: ';}},cleanupCache:function(){var yDir=this.getCacheDir().parent;this.getCacheDir().remove(true);if(yDir.leafName=="Yahoo! Inc"&&!yDir.directoryEntries.hasMoreElements()){yDir.remove(true);}},getExtensionDir:function(){try{if(this.mExtensionDir!==null){return this.mExtensionDir.clone().QueryInterface(CI.nsILocalFile);}}catch(e){yahooToolbarDebug(e);throw'ERROR getting extensinos dir';}},getCacheDir:function(){var profd=null;var ret=null;if(this.mCacheDir===null){try{var extd=this.getProfileDir();extd.appendRelativePath("Yahoo! Inc");if(!extd.exists()){extd.create(CI.nsILocalFile.DIRECTORY_TYPE,0777);}
extd.appendRelativePath(YahooExtConfig.mName);if(!extd.exists()){extd.create(CI.nsILocalFile.DIRECTORY_TYPE,0777);}
this.mCacheDir=extd;ret=this.mCacheDir.clone().QueryInterface(CI.nsILocalFile);}catch(e){yahooToolbarDebug(e);this.mCacheDir=null;if(profd!==null){return profd;}
throw"Error in creating cache Dir";}}else{ret=this.mCacheDir.clone().QueryInterface(CI.nsILocalFile);}
return ret;},readChromeContentFile:function(fileName){var url="chrome://"+YahooExtConfig.mName+"/content/"+fileName;var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var channel=iosvc.newChannel(url,0,null);var stream=channel.open();var fh=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);fh.init(stream);var size=0;var data="";while((size=stream.available())){data+=fh.read(size);}
fh.close();fh=null;stream=null;return data;},getChromeContentDir:function(){var extd=this.getExtensionDir();extd.appendRelativePath("chrome");extd.appendRelativePath("content");var ret=extd.clone().QueryInterface(CI.nsILocalFile);return ret;},readSkinContentFile:function(fileName){var url="chrome://"+YahooExtConfig.mName+"/skin/"+fileName;var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var channel=iosvc.newChannel(url,0,null);var stream=channel.open();var fh=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);fh.init(stream);var size=0;var data="";while((size=stream.available())){data+=fh.read(size);}
fh.close();fh=null;stream=null;return data;},readEncodedCacheFile:function(fileName){var data="";try{data=this.readCacheFile(fileName);}catch(e){data="";yahooToolbarDebug(e);}
if(data&&data!=""){data=yahooUtils.decodeFromBase64(""+data);}else{data="";}
return data;},writeEncodedCacheFile:function(fileName,fileContents){return this.writeCacheFile(fileName,yahooUtils.encodeToBase64(""+fileContents));},getUserCacheDir:function(){var udir=this.getCacheDir();udir.appendRelativePath(yahooNetUtils.getBlindYID());if(!udir.exists()){udir.create(CI.nsILocalFile.DIRECTORY_TYPE,0777);}
return udir;},getCacheFile:function(fileName){try{var file=this.getCacheDir();file.appendRelativePath(fileName);return file;}catch(e){yahooToolbarDebug(e);throw'ERROR fetching datafile '+fileName+': '+e;}},getChromeContentFile:function(fileName){try{var file=this.getChromeContentDir();file.appendRelativePath(fileName);return file;}catch(e){yahooToolbarDebug(e);throw'ERROR fetching datafile '+fileName+': '+e;}},readFile:function(file){var fileContents="";try{if(!file.exists()){return null;}
var inputStream=CC["@mozilla.org/network/file-input-stream;1"].createInstance(CI.nsIFileInputStream);inputStream.init(file,0x01,0666,0);var fileHandle=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);fileHandle.init(inputStream);var size=0;while((size=inputStream.available())){fileContents+=fileHandle.read(size);}
fileHandle.close();inputStream.close();fileHandle=null;inputStream=null;}catch(e){yahooToolbarDebug(e);throw'ERROR reading file: '+e;}
return fileContents;},readCacheFile:function(fileName){try{var file=this.getCacheFile(fileName);return this.readFile(file);}catch(e){throw'ERROR reading cache file '+fileName+': '+e;}
return null;},readUnicodeFile:function(file){var data="";var fstream=Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);var cstream=Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);fstream.init(file,-1,0,0);cstream.init(fstream,"UTF-8",0,0);let(str={}){while(cstream.readString(-1,str)!=0){data+=str.value;}}
cstream.close();return data;},writeUnicodeFile:function(file,fileContents){var foStream=Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);foStream.init(file,0x02|0x08|0x20,0666,0);var converter=Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);converter.init(foStream,"UTF-8",0,0);converter.writeString(fileContents);converter.close();},writeFile:function(file,fileContents){if(!file.exists()){file.create(file.NORMAL_FILE_TYPE,0666);}
var fileHandle=CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);fileHandle.init(file,0x04|0x08|0x20,0666,0);fileHandle.write(fileContents,fileContents.length);fileHandle.flush();fileHandle.close();fileHandle=null;},writeCacheFile:function(fileName,fileContents){try{var file=this.getCacheFile(fileName);this.writeFile(file,fileContents);}catch(e){yahooToolbarDebug(e);throw'ERROR writing file '+fileName+': '+e;}
return true;},removeCacheFile:function(fileName){try{var file=this.getCacheDir();if(fileName){file.appendRelativePath(fileName);}
if(file.exists()){file.remove(true);}}catch(e){yahooToolbarDebug(e);throw"ERROR removing cache file ("+fileName+"): "+e;}},fetchFavicon:function(url){try{var ioService=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService2);var bmUrl=ioService.newURI(url,"",null);var image="http://"+bmUrl.host+"/favicon.ico";var imageUrl=ioService.newURI(image,"",null);icon=this.loadFromCache(bmUrl.spec,false);if(!icon)
{if(this.urlsObj[bmUrl.spec]!=1)
{var obj={mType:"img",mKey:bmUrl.spec,mDataUrl:imageUrl.spec};this.mFetchList.push(obj);this.fetchFromServer();this.urlsObj[bmUrl.spec]=1;}
return imageUrl.spec;}}catch(e){yahooDebug(e.message);}
return icon;},loadFromCache:function(url,defaultIcon){var icon=null;var date_appended=false;try{icon=CacheManager.getDataForKey(url);var timestamp;var lastIndex=icon.lastIndexOf(":-");if(lastIndex!=-1){timestamp=icon.substr(lastIndex+2);var date_appended=true;}
if(timestamp){var currTime=new Date().getTime();if(currTime-timestamp>1814400000){CacheManager.changeDataForKey(url,'');this.urlsObj[url]=0;return null;}}
if(!icon&&defaultIcon){icon=this.mDefaultIconUrl;}}catch(e){yahooToolbarDebug(e);}
if(date_appended==false)
{return icon;}
else
{return icon.substr(0,lastIndex);}},fetchNCacheData:function(url){var data="";try{data=CacheManager.getDataForKey(url);if(!data||data===""){var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var channel=iosvc.newChannel(url,0,null);var stream=channel.open();var fh=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);fh.init(stream);var size=0;while((size=stream.available())){data+=fh.read(size);}
fh.close();fh=null;stream=null;}}catch(e){yahooToolbarDebug(e);}
return data},mCountRead:null,mBytes:[],mStream:null,mFetchList:[],mFetchObj:null,urlsObj:{},mCacheNotifiers:[],mDefaultIconUrl:"http://l.yimg.com/a/i/us/soc/updts/y_bookmarks.png",registerNotifier:function(message){this.mCacheNotifiers.push(message);},onStartRequest:function(request,context){this.mStream=CC['@mozilla.org/binaryinputstream;1'].createInstance(CI.nsIBinaryInputStream);this.mBytes=[];this.mCountRead=0;},onDataAvailable:function(aRequest,aContext,aInputStream,aOffset,aCount){this.mStream.setInputStream(aInputStream);var chunk=this.mStream.readByteArray(aCount);this.mBytes=this.mBytes.concat(chunk);this.mCountRead+=aCount;},onStopRequest:function(req,context,statusCode){try{if(this.mFetchObj.mType==="img"){var key=this.mFetchObj.mKey;var dataUrl=this.mFetchObj.mDataUrl;var nodes=this.mFetchObj.mNodes;var mimeType=null;if(this.mCountRead>0){mimeType=yahooUtils.getMimeType(this.mBytes,this.mCountRead);}
var icon=dataUrl;var downloadedDate=new Date().getTime();if(key!=dataUrl){icon=this.mDefaultIconUrl+":-"+downloadedDate;}
if(mimeType){icon="data:"+mimeType+";base64,"+yahooUtils.convertToBase64(this.mBytes)+":-"+downloadedDate;}
CacheManager.changeDataForKey(key,icon);}else{var data=""+this.mBytes;CacheManager.changeDataForKey(this.mFetchObj.mDataUrl,data);}}catch(e){yahooToolbarDebug(e);}
req=null;context=null;this.mFetchObj=null;this.fetchFromServer();},fetchFromServer:function(){if(this.mFetchObj){return;}
while(!this.mFetchObj&&this.mFetchList.length>0){try{this.mFetchObj=this.mFetchList.pop();var IOSVC=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var chan=IOSVC.newChannel(this.mFetchObj.mDataUrl,0,null);chan.asyncOpen(this,null);}catch(e){yahooToolbarDebug(this.mFetchObj);this.mFetchObj=null;}}},isDownloading:function(){return this.mFetchObj!==null;},addImageForDownload:function(key,url,node){function removeNodeIfPresent(nodeList,childNode){for(var idx=0;idx<nodeList.length;idx++){if(nodeList[idx]==node){nodeList.splice(idx,1);}}}
if(this.mFetchObj){removeNodeIfPresent(this.mFetchObj.mNodes,node);}
for(var idx=0;idx<this.mFetchList.length;idx++){removeNodeIfPresent(this.mFetchList[idx].mNodes,node);}
if(this.mFetchObj&&this.mFetchObj.mDataUrl==url){this.mFetchObj.mNodes.push(node);return null;}
for(var idx=0;idx<this.mFetchList.length;idx++){if(this.mFetchList[idx].mDataUrl==url){this.mFetchList[idx].mNodes.push(node);return null;}}
var obj={mType:"img",mKey:key,mDataUrl:url,mNodes:[]};obj.mNodes.push(node);this.mFetchList.push(obj);this.fetchFromServer();},fetchNCacheImage:function(imageUrl,node){try{var icon=this.loadFromCache(imageUrl);if(node&&node.setAttribute){if(icon){node.setAttribute("image",icon);return null;}else{node.setAttribute("image",imageUrl);}}
if(imageUrl.indexOf("chrome://")==0){return;}
this.addImageForDownload(imageUrl,imageUrl,node);}catch(e){yahooToolbarDebug(e);}
return null;},fetchNCacheImg:function(imageUrl,key,node){try{var icon=this.loadFromCache(imageUrl);if(node&&node.setAttribute){if(icon){node.setAttribute(key,icon);return null;}else{node.setAttribute(key,imageUrl);}}
if(imageUrl.indexOf("chrome://")==0){return;}
this.addImageForDownload(imageUrl,imageUrl,node);}catch(e){yahooToolbarDebug(e);}
return null;},fetchNCacheFavicon:function(url,node){try{this.getFaviconFromCacheWithCallBack(url,false,function(icon){try
{if(node&&node.setAttribute){if(icon){node.setAttribute("image",icon);return;}else{node.setAttribute("image",this.mDefaultIconUrl);}}
if(url.indexOf("chrome://")==0){return;}
var ioService=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var host=ioService.newURI(url,"",null).host;var imageUrl="http://"+host+"/favicon.ico";var imgRegExp=new RegExp('\.(bmp|jpg|ico|gif|png)$');if(url.match(imgRegExp)){imageUrl=url;}
this.addImageForDownload(host,imageUrl,node);}
catch(e)
{}});}catch(e){yahooToolbarDebug(url);yahooToolbarDebug(e);}
return null;},getImageFromCache:function(url,defaultIcon){var icon=null;try{icon=CacheManager.getDataForKey(url);if(!icon&&defaultIcon){icon=this.mDefaultIconUrl;}}catch(e){yahooToolbarDebug(e);}
return icon;},getFaviconFromCache:function(url,defaultIcon){try
{if(url.indexOf("chrome://")==0){return this.mDefaultIconUrl;}
if(yahooUtils.mFFVersion>=22)
return this.getFaviconFromCacheForFF22Above(url,defaultIcon);else
return this.getFaviconFromCacheForFF22below(url,defaultIcon);}
catch(e)
{return;}},getFaviconFromCacheWithCallBack:function(url,defaultIcon,cbFunc){try
{var callBack=null;if(cbFunc&&cbFunc.wrappedJSObject&&cbFunc.wrappedJSObject.object)
callBack=cbFunc.wrappedJSObject.object;else
callBack=cbFunc;if(url.indexOf("chrome://")==0){if(callBack)
callBack(this.mDefaultIconUrl);return;}
if(yahooUtils.mFFVersion>=22)
this.getFaviconFromCacheForFF22Above(url,defaultIcon,callBack);else{var icon=this.getFaviconFromCacheForFF22below(url,defaultIcon);if(callBack)
{callBack(icon);}}}
catch(e)
{yahooToolbarDebug("getFaviconFromCacheWithCallBack"+e);}},getFaviconFromCacheForFF22below:function(url,defaultIcon){var icon;try{var ioService=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var iconUri=ioService.newURI(url,"",null);icon=this.loadFromCache(iconUri.host,false);if(!icon&&yahooUtils.mFFVersion>2){try{var faviconService=CC["@mozilla.org/browser/favicon-service;1"].getService(CI.nsIFaviconService);var fav=faviconService.getFaviconForPage(iconUri);var mimeType={},dataLen={},iconData=null;var iconData=faviconService.getFaviconData(fav,mimeType,dataLen);if(iconData){mimeType=mimeType.value;icon="data:"+mimeType+";"+"base64,"+
btoa(String.fromCharCode.apply(null,iconData));CacheManager.changeDataForKey(iconUri.host,icon);}}catch(e){}}}catch(e){yahooToolbarDebug(url);yahooToolbarDebug("getFaviconFromCacheForFF22below::"+e);}
if(!icon&&defaultIcon){icon=this.mDefaultIconUrl;}
return icon;},getFaviconFromCacheForFF22Above:function(url,defaultIcon,callBack){var icon;try{var ioService=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var iconUri=ioService.newURI(url,"",null);var self=this;icon=this.loadFromCache(iconUri.host,false);if(!icon){try{var faviconService=CC["@mozilla.org/browser/favicon-service;1"].getService(CI.mozIAsyncFavicons);var aMimeType={},aDataLen={},aIconData=null;faviconService.getFaviconDataForPage(iconUri,function(aURI,aDataLen,aIconData,aMimeType)
{if(aIconData){aMimeType=aMimeType.value;icon="data:"+aMimeType+";"+"base64,"+
btoa(String.fromCharCode.apply(null,aIconData));CacheManager.changeDataForKey(iconUri.host,icon);}
if(!icon&&defaultIcon){icon=this.mDefaultIconUrl;}
if(callBack)
{callBack(icon);}})}catch(e){if(callBack)
{callBack(icon);yahooToolbarDebug("getFaviconFromCacheForFF22Above_1::"+e);}}}}catch(e){yahooToolbarDebug(url);yahooToolbarDebug("getFaviconFromCacheForFF22Above_2::"+e);}
if(callBack&&icon)
{callBack(icon);}
else(!callBack)
return icon;},classID:Components.ID("{e2214725-2af1-46cd-9952-4b4bf13994bf}"),contractID:"@yahoo.com/fileio;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIRunnable,Components.interfaces.nsIYahooFileIO2])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooFileIO]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooFileIO]);