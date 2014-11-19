
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CC=Components.classes;var CI=Components.interfaces;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");var uni=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uni.charset="utf-8";function BookmarkManager(){};BookmarkManager.prototype={doc:null,_mFileIO:null,domBuilder:null,mFileIO:null,mBmXml:"",mCacheBM2File:null,mNC_NS:"http://home.netscape.com/NC-rdf#",mFileDataSource:null,mRDF:null,mBMTSRoot:null,mUserUrl:null,mTsUrl:null,mFetchingFromServer:false,addBMToToolbar:function(domBuilder){var parser=CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);try{doc=parser.parseFromString(this.mBmXml,"text/xml");var root=doc.getElementsByTagName("outline");_mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);}catch(e){yahooError(e);}
return true;},getFolders:function(fid){try{var path='.//outline[@fid="'+fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var response=[];var result=nodes.iterateNext();while(result)
{for(var i=0;i<result.children.length;i++)
{node1=result.children[i];if(node1.nodeName=="outline"&&node1.getAttribute("type")=="F")
{var name=uni.ConvertToUnicode(node1.getAttribute("text"));name=unescape(name);response[i]={};response[i].fid=node1.getAttribute("fid");response[i].t=name;}}
var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},getBookmarks:function(fid){try{var path='.//outline[@fid="'+fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();var response=[];while(result)
{for(var i=0;i<result.children.length;i++)
{node1=result.children[i];if(node1.nodeName=="outline"&&node1.getAttribute("type")=="B")
{var name=uni.ConvertToUnicode(node1.getAttribute("text"));name=unescape(name);var favicon=_mFileIO.fetchFavicon(node1.getAttribute("u"));response[i]={};response[i].bid=node1.getAttribute("bid");response[i].t=name;response[i].u=node1.getAttribute("u");response[i].favicon=favicon;}}
var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},getFolder:function(fid){try{var path='.//outline[@fid="'+fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{var name=uni.ConvertToUnicode(result.getAttribute("text"));name=unescape(name);var response={};response.fid=result.getAttribute("fid");response.t=name;response.pfid=result.parentElement.getAttribute("fid");var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},getBookmark:function(bid){try{var root_fid=this.getRootFolderId();var path='.//outline[@fid="'+root_fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{path='.//outline[@bid="'+bid+'"]';nodes=doc.evaluate(path,result,null,0,null);result=nodes.iterateNext();while(result)
{var name=uni.ConvertToUnicode(result.getAttribute("text"));name=unescape(name);var response={};response.bid=result.getAttribute("bid");response.t=name;response.u=result.getAttribute("u");response.tags=result.getAttribute("tags");response.fid=result.parentElement.getAttribute("fid");var respjson=JSON.stringify(response);result=nodes.iterateNext();}}}
catch(e){yahooError(e);}
return respjson;},pageBookmarked:function(url){try
{var path='.//outline[@u="'+url+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result){return result.getAttribute("bid");}}
catch(e){yahooError(e);}
return"false";},getAllBookmarks:function(){try{var root_fid=this.getRootFolderId();var path='.//outline[@fid="'+root_fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{path='.//outline[@type="B"]';nodes=doc.evaluate(path,result,null,0,null);var response=[];result=nodes.iterateNext();var i=0;while(result)
{var name=uni.ConvertToUnicode(result.getAttribute("text"));name=unescape(name);var favicon=_mFileIO.fetchFavicon(result.getAttribute("u"));response[i]={};response[i].bid=result.getAttribute("bid");response[i].t=name;response[i].u=result.getAttribute("u");response[i].favicon=favicon;result=nodes.iterateNext();i=i+1;}
var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},getAllFolders:function(){try{var root_fid=this.getRootFolderId();var path='.//outline[@fid="'+root_fid+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{path='.//outline[@type="F"]';nodes=doc.evaluate(path,result,null,0,null);var response=[];result=nodes.iterateNext();var i=0;while(result)
{var name=uni.ConvertToUnicode(result.getAttribute("text"));name=unescape(name);response[i]={};response[i].fid=result.getAttribute("fid");response[i].t=name;result=nodes.iterateNext();i=i+1;}
var respjson=JSON.stringify(response);}}
catch(e){yahooError(e);}
return respjson;},getRootFolderId:function(){try
{var path='.//outline[@text="root"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{return result.getAttribute("fid");}}
catch(e){yahooError(e);}
return"-1";},getPreference:function(key){try
{var path='.//outline[@type="Toolbar"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();while(result)
{for(var i=0;i<result.children.length;i++)
{node1=result.children[i];if(node1.nodeName=="outline"&&node1.getAttribute("text")==key)
{var response={};response.key=node1.getAttribute("text");response.value=node1.getAttribute("a");}}
var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},getQuickAccessList:function(key){try{var path='.//outline[@type="'+key+'"]';var nodes=doc.evaluate(path,doc,null,0,null);var result=nodes.iterateNext();var response=[];while(result)
{for(var i=0;i<result.children.length;i++)
{node1=result.children[i];if(node1.nodeName=="outline"&&node1.getAttribute("type")=="B")
{var name=uni.ConvertToUnicode(node1.getAttribute("text"));name=unescape(name);var favicon=_mFileIO.fetchFavicon(node1.getAttribute("u"));response[i]={};response[i].bid=node1.getAttribute("bid");response[i].t=name;response[i].u=node1.getAttribute("u");response[i].favicon=favicon;}}
var respjson=JSON.stringify(response);result=nodes.iterateNext();}}
catch(e){yahooError(e);}
return respjson;},updateBookmarks:function(){try{this.loadBM2FromServer(this.domBuilder,this.secureKey);}
catch(e){yahooError(e);}},loadBM2FromCache:function(domBuilder,secureKey){var stime=(new Date().getTime());try{var cacheBM2raw="";if(this.mCacheBM2File.exists()){cacheBM2raw=this.mFileIO.readFile(this.mCacheBM2File);}else{return false;}
if(!cacheBM2raw||cacheBM2raw==""){return false;}
var secure=new EncryptDecryptAlgo();cacheBM2raw=secure.TEAdecrypt(cacheBM2raw,secureKey);if((cacheBM2raw.substr(2,3))!="xml"){return false;}
this.mBmXml=cacheBM2raw;var etime=(new Date().getTime())-stime;return this.addBMToToolbar(domBuilder);}catch(e){return false}
return true;},loadBM2FromServer:function(domBuilder,secureKey){if(!domBuilder||!secureKey||!domBuilder.bm2Feed){return;}
if(this.mFetchingFromServer){return;}
this.mFetchingFromServer=true;try{var self=this;var bm2url=domBuilder.bm2Feed;var str=domBuilder.getBM2UsageString();if(str.length>0){bm2url+="&docids="+str;domBuilder.clearBM2Usage();}
var stime;var iosvc=CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);var channel=iosvc.newChannel(bm2url,0,null);var listen={stream:null,xml:"",onStartRequest:function(request,context){stime=(new Date().getTime());this.xml="";},onDataAvailable:function(request,context,inputStream,offset,count){if(this.stream==null){this.stream=CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);}
this.stream.init(inputStream);this.xml+=this.stream.read(count);},onStopRequest:function(request,context,statusCode){try{if(this.stream!=null){try{this.stream.close();}catch(e){}
this.stream=null;}
var http=request.QueryInterface(CI.nsIHttpChannel);if(this.xml!=""&&http.status==0){self.mBmXml=this.xml;self.addBMToToolbar(domBuilder);var notifier=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);notifier.notifyObservers(null,"bookmarks-refreshed",null);}else{yahooDebug("Empty Bookmark feed recieved from bookmark server");}
var etime=(new Date().getTime())-stime;}catch(e){yahooError(e);}
self.mFetchingFromServer=false;}};channel.asyncOpen(listen,null);}catch(e){this.mFetchingFromServer=false;yahooError(e);}},createBM2CacheFile:function(cacheDir){try{this.mCacheBM2File=cacheDir.clone().QueryInterface(CI.nsILocalFile);this.mCacheBM2File.appendRelativePath("bookmarks");}catch(e){yahooError(e);}},cacheBM2Feed:function(secureKey){if(this.mBmXml!=null&&this.mBmXml!=""){try{if(this.mCacheBM2File!=null){var secure=new EncryptDecryptAlgo();var ciphertext=secure.TEAencrypt(this.mBmXml,secureKey);this.mFileIO.writeFile(this.mCacheBM2File,ciphertext)}}catch(e){yahooError(e);}}},initConfig:function(){if(this.mFileDataSource){return;}
function initRDFFile(fileIO){var cacheDir=fileIO.getCacheDir();var file=cacheDir.clone().QueryInterface(CI.nsILocalFile);file.setRelativeDescriptor(cacheDir,"yconfig.rdf");if(!file.exists()){var data='<?xml version="1.0"?>\n<RDF:RDF xmlns:NC="http://home.netscape.com/NC-rdf#" '+'xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n</RDF:RDF>';fileIO.writeFile(file,data);}
return file;}
var file=initRDFFile(this.mFileIO);var networkProtocol=CC["@mozilla.org/network/protocol;1?name=file"].createInstance(CI.nsIFileProtocolHandler);var fileURI=networkProtocol.newFileURI(file);var fileDataSource=CC["@mozilla.org/rdf/datasource;1?name=xml-datasource"].createInstance(CI.nsIRDFRemoteDataSource);fileDataSource=fileDataSource.QueryInterface(CI.nsIRDFDataSource);fileDataSource.Init(fileURI.spec);fileDataSource.Refresh(true);this.mRDF=CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);var rdfContainerUtils=CC["@mozilla.org/rdf/container-utils;1"].getService(CI.nsIRDFContainerUtils);this.mBMTSRoot=this.mRDF.GetResource("NC:BMTS");this.mBMTSRoot=rdfContainerUtils.MakeSeq(fileDataSource,this.mBMTSRoot);this.mUserUrl=this.mRDF.GetResource(this.mNC_NS+"User");this.mTsUrl=this.mRDF.GetResource(this.mNC_NS+"Ts");this.mFileDataSource=fileDataSource;},changeTimestamp:function(blindYId,tsValue){tsValue=tsValue||"";this.initConfig();var keyLiteral=this.mRDF.GetLiteral(blindYId);var resource=this.mFileDataSource.GetSource(this.mUserUrl,keyLiteral,true);if(resource){var ts=this.mFileDataSource.GetTarget(resource,this.mTsUrl,true);if(ts instanceof CI.nsIRDFLiteral){this.mFileDataSource.Change(resource,this.mTsUrl,ts,this.mRDF.GetLiteral(tsValue));}}else{resource=this.mRDF.GetAnonymousResource();this.mFileDataSource.Assert(resource,this.mUserUrl,keyLiteral,true);this.mFileDataSource.Assert(resource,this.mTsUrl,this.mRDF.GetLiteral(tsValue),true);this.mBMTSRoot.AppendElement(resource);}
this.mFileDataSource.Flush();},getTimestamp:function(blindYId){var key=blindYId;this.initConfig();var keyLiteral=this.mRDF.GetLiteral(key);var resource=this.mFileDataSource.GetSource(this.mUserUrl,keyLiteral,true);if(resource){var target=this.mFileDataSource.GetTarget(resource,this.mTsUrl,true);if(target instanceof CI.nsIRDFLiteral){return target.Value;}}
return null;},secureKey:"AvadaKedavra",init:function(dombuilder){this.domBuilder=dombuilder;this.bookmarkBuilder=dombuilder;this.mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);},clear:function(){var searchIndexer=CC["@yahoo.com/search/indexer;1"].getService(CI.nsIYahooSearchIndexerV3);searchIndexer.clearYahooBookmarkData();},setSecureKey:function(key){this.secureKey=key;},processBookmarks:function(fresh){fresh=fresh||false;if(!this.domBuilder.bm2Feed||this.domBuilder.bm2Feed==""){return false;}
if(!fresh){if(this.loadBM2FromCache(this.domBuilder,this.secureKey)){return;}}
this.loadBM2FromServer(this.domBuilder,this.secureKey);},classID:Components.ID("{2C8221C5-5EA0-4e4d-BF54-A4014A663052}"),contractID:"@yahoo.com/bookmarkmanager;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooBookmarkManager])};function EncryptDecryptAlgo(){this.TEAencrypt=function(plaintext,password){if(plaintext.length==0)return('');var asciitext=escape(plaintext).replace(/%20/g,' ');var v=this.strToLongs(asciitext);if(v.length<=1)v[1]=0;var k=this.strToLongs(password.slice(0,16));var n=v.length;var z=v[n-1],y=v[0],delta=0x9E3779B9;var mx,e,q=Math.floor(6+52/n),sum=0;while(q-->0){sum+=delta;e=sum>>>2&3;for(var p=0;p<n;p++){y=v[(p+1)%n];mx=(z>>>5^y<<2)+(y>>>3^z<<4)^(sum^y)+(k[p&3^e]^z);z=v[p]+=mx;}}
var ciphertext=this.longsToStr(v);return this.escCtrlCh(ciphertext);}
this.TEAdecrypt=function(ciphertext,password){if(ciphertext.length===0)return('');var v=this.strToLongs(this.unescCtrlCh(ciphertext));var k=this.strToLongs(password.slice(0,16));var n=v.length;var z=v[n-1],y=v[0],delta=0x9E3779B9;var mx,e,q=Math.floor(6+52/n),sum=q*delta;while(sum!==0){e=sum>>>2&3;for(var p=n-1;p>=0;p--){z=v[p>0?p-1:n-1];mx=(z>>>5^y<<2)+(y>>>3^z<<4)^(sum^y)+(k[p&3^e]^z);y=v[p]-=mx;}
sum-=delta;}
var plaintext=this.longsToStr(v);plaintext=plaintext.replace(/\0+$/,'');return unescape(plaintext);}
this.strToLongs=function(s){var l=new Array(Math.ceil(s.length/4));for(var i=0;i<l.length;i++){l[i]=s.charCodeAt(i*4)+(s.charCodeAt(i*4+1)<<8)+
(s.charCodeAt(i*4+2)<<16)+(s.charCodeAt(i*4+3)<<24);}
return l;}
this.longsToStr=function(l){var a=new Array(l.length);for(var i=0;i<l.length;i++){a[i]=String.fromCharCode(l[i]&0xFF,l[i]>>>8&0xFF,l[i]>>>16&0xFF,l[i]>>>24&0xFF);}
return a.join('');}
this.escCtrlCh=function(str){return str.replace(/[\0\t\n\v\f\r\xa0'"!]/g,function(c){return'!'+c.charCodeAt(0)+'!';});}
this.unescCtrlCh=function(str){return str.replace(/!\d\d?\d?!/g,function(c){return String.fromCharCode(c.slice(1,-1));});}}
if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([BookmarkManager]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([BookmarkManager]);