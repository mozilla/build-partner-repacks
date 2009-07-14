/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/**
* @fileoverview
*/
var CI = Components.interfaces;
var CC = Components.classes;
var yahooCC = CC;
var yahooCI = CI;
var loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);             
var gConfigFilePath = "file://"+__LOCATION__.parent.path+"/extconfig.js";
loader.loadSubScript(gConfigFilePath);
loader.loadSubScript("chrome://"+YahooExtConfig.mName+"/content/utils.js");
/**
* @class Cache manager Stores the configurarion of the cached data.
* Stores the cached information : this file Manages the RDF Service thats stroring caching of 
* various data . The RDF serivice stores data assosiated with a key . and next time we query with 
* the key to verify whether data is available. we will be storing the timestamp of the cached data
* which will be used for automatic cache updates after a specific amount of time.
* @constructor
* @author geldhose@yahoo-inc.com
* @date   14 - july - 2008
*/
var CacheManager = {
mFileDataSource : null,
mRDFService : null,                                   
rscBookmarksRoot : null,
NC_NS:"http://home.netscape.com/NC-rdf#",
mRscUrl : null, 
mRscData : null,
mRscTimeStamp : null,
/**
* Function initializes the cache manager. creates the RDF file if its not present in the cache
* directory . initalizes the RDF services and creates the resource URI
* 
* @param  {YahooFileIO} fileIO 
*       The YahooFileIO class Object for initializing the file, and basic write operation
*       we can't access nsIYahooFileIOPre as a service as the constructor will interenally 
*       call this function for the initialization . which will result in an infinite loop
*
* @author  geldhose
* @date  14 - july - 2008
*/
init : function(fileIO) {   
    try {
        if (this.mFileDataSource) {
            return;
        }
        var cacheDir = fileIO.getCacheDir();  
        var file = cacheDir.clone().QueryInterface(CI.nsILocalFile);
        file.append("cacheData.rdf");
        if(!file.exists()) {             
            var data = '<?xml version="1.0"?>\n<RDF:RDF xmlns:NC="http://home.netscape.com/NC-rdf#" '+
            'xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n</RDF:RDF>';  
            fileIO.writeFile(file,data);            
        }
        var networkProtocol =  CC["@mozilla.org/network/protocol;1?name=file"].createInstance(CI.nsIFileProtocolHandler);
        var fileURI = networkProtocol.newFileURI(file);
        this.mFileDataSource = CC["@mozilla.org/rdf/datasource;1?name=xml-datasource"].createInstance(CI.nsIRDFRemoteDataSource);            
        this.mFileDataSource = this.mFileDataSource.QueryInterface(CI.nsIRDFDataSource);                         
        this.mFileDataSource.Init(fileURI.spec);        
        this.mFileDataSource.Refresh(true);        
        this.mRDFService =  CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);
        var rdfContainerUtils = CC["@mozilla.org/rdf/container-utils;1"].getService(CI.nsIRDFContainerUtils);          
        this.mFileDataSource = this.mFileDataSource.QueryInterface(CI.nsIRDFRemoteDataSource);
        this.rscBookmarksRoot = this.mRDFService.GetResource("NC:CacheRoot");
        this.rscBookmarksRoot = rdfContainerUtils.MakeSeq(this.mFileDataSource, this.rscBookmarksRoot);     
        this.mRscUrl = this.mRDFService.GetResource(this.NC_NS + "URL");    
        this.mRscData = this.mRDFService.GetResource(this.NC_NS + "Data");
        this.mRscTimeStamp = this.mRDFService.GetResource(this.NC_NS + "Ts");
    } catch(e) {
        this.mFileDataSource = null;
    }
    return;
}
, 
/**
* Function that checks whether a key is already availble in the RDF file. function also takes care
* to create that particular resource if its absent in the RDF file
*
* @param {string} aName 
*       Name of the resource
* @param {boolean} insertIfAbsent 
*       Used to insert if the resource is absent
*
* @author  geldhose@yahoo-inc.com
* @date  14 - july - 2008
*/
getResource : function(aName, insertIfAbsent) {
    var target = this.mRDFService.GetLiteral(aName);
    var resource = this.mFileDataSource.GetSource(this.mRscUrl, target, true);
    if (!resource && insertIfAbsent) {
        resource = this.mRDFService.GetAnonymousResource();            
        this.mFileDataSource.Assert(resource, this.mRscUrl, target, true);                        
        this.rscBookmarksRoot.AppendElement(resource);
        this.mFileDataSource.Flush();  
    }
    return resource;  
},
/**
* Inserts or changes the data assiciated with a particular key in the  RDF file.
*
* @param {string} key name
* @param {string} data 
*       This is to be stored with the key
*
* @author geldhose
* @date  14 - july - 2008
*/
changeDataForKey : function(url,data) {
    try {        
        var resource = this.getResource(url,true);            
        var oldData = this.mFileDataSource.GetTarget(resource, this.mRscData, true);
        var newData = this.mRDFService.GetLiteral(data);                    
        if (oldData) {                           
            this.mFileDataSource.Change(resource, this.mRscData, oldData, newData);
        } else {                  
            this.mFileDataSource.Assert(resource, this.mRscData, newData,true);                
        }
        this.mFileDataSource.Flush();
    } catch(e) {
    }
},    
/**
* Gets data associated with a particular key                                    
*
* @param  {string} key Url name
*
* @author geldhose
* @date 14 - july - 2008
*/
getDataForKey : function(url){     
     var data = null;           
     try {         
         var target = this.mRDFService.GetLiteral(url);
         var resource = this.mFileDataSource.GetSource(this.mRscUrl, target, true);        
         if (resource) {            
             target = this.mFileDataSource.GetTarget(resource, this.mRscData, true);
             if (target instanceof CI.nsIRDFLiteral) {
                 data = target.Value;
             }            
         }
     } catch (e) {
     }
     return(data);
}
};
/**
*
* @class Handles the FILE IO related functionalities. also takes care of caching of files.
* managing the updating the cache
* @constructor Creates an instance of YahooFileIO
*
* @author  geldhose@yahoo-inc.com
* @date 12 - june - 2008
*/
function YahooFileIO() {
    var componentFile = __LOCATION__;
    this.mComponentDir = componentFile.parent;
    this.mExtensionDir = this.mComponentDir.parent;    
    CacheManager.init(this);
}
YahooFileIO.prototype = {
mProfileDir : null,
mCacheDir : null,
/**
* Gets the current profile directory of firefox PrefD
*
* @return  {nsILocalFile} The Profile Directory of firefox
*
* @author  geldhose@yahoo-inc.com
* @date  12 - june - 2008
*/
getProfileDir : function() {
    try {
        if (this.mProfileDir === null) {
            var prefd = CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
            this.mProfileDir = prefd.get('PrefD', CI.nsILocalFile); 
        }
        var ret = this.mProfileDir.clone().QueryInterface(CI.nsILocalFile);
        return ret;        
    } catch(e) {
        this.mProfileDir = null;
        throw 'ERROR fetching profile directory: ';
    }
}
,
/**
* Gets the Directory in which the extension is installed
*
* @return  {nsILocalFile} The extensions directory 
*
* @author geldhose@yahoo-inc.com
* @date  12 - june - 2008
*/
getExtensionDir : function() {
    try {
        if (this.mExtensionDir !== null) {
            return this.mExtensionDir.clone().QueryInterface(CI.nsILocalFile);
        }        
    } catch(e) {
        throw 'ERROR getting extensinos dir';
    }
},
/**
* Return the directory used to store cached files, will be inside the extensions directory
*
* @return  {nsILocalFile} The Cache Directory, ExtensionDir/Cahce
*
* @author  geldhose@yahoo-inc.com
* @date  12 - june - 2008
*/
getCacheDir : function() {    
    var ret = null;
    if (this.mCacheDir === null) {
        try {
            // Add cache sub-directory
            var extd = this.getExtensionDir();
            extd.appendRelativePath("cache");
            if (!extd.exists()){
                extd.create(CI.nsILocalFile.DIRECTORY_TYPE, 0777);
            }        
            this.mCacheDir = extd;
            ret = this.mCacheDir.clone().QueryInterface(CI.nsILocalFile);
        } catch(e) {
            this.mCacheDir = null;    
            throw "Error in creating cache Dir";         
        }
    } else {
        ret = this.mCacheDir.clone().QueryInterface(CI.nsILocalFile);
    }
    return ret;
},
/**
* Return the directory used to store user specific cached files, will be created inside cache
* with a users blindYID as the directory name
*
* @return  {nsILocalFile} Gets The User CacheDir ExtensionDir/Cache/BlindYID/
*
* @author geldhose@yahoo-inc.com
* @date  12 - june - 2008
*/
getUserCacheDir : function() {
    var udir = this.getCacheDir();
    udir.appendRelativePath(ytbUtils.getBlindYID());    
    if (!udir.exists()) {
        udir.create(CI.nsILocalFile.DIRECTORY_TYPE, 0777);
    }
    return udir.clone().QueryInterface(CI.nsILocalFile); 
},
/**
* Return the cached file from cache directory
*
* @param  {string} fileName Name of file to read from cache
* @return {nsILocalFile} 
*
* 
* @date 12 - june - 2008
*/
getCacheFile : function(fileName) {
    try {
        var file = this.getCacheDir();
        file.appendRelativePath(fileName);       
        return file;
    } catch(e) {
        throw 'ERROR fetching datafile '+fileName+': '+e;
    }
},
/**
* Return the file content after reading it from the specified location
*
* @param  {nsIFile} file
*       The file from where content need to be read
* @return  {string} The file content
* 
*/
readFile : function(file){
    var fileContents = "";
    try{        
        // File does not exist
        if (!file.exists()) {
            return null;
        }
        var inputStream = CC["@mozilla.org/network/file-input-stream;1"].createInstance(CI.nsIFileInputStream);
        inputStream.init(file, 0x01, 0666, 0);
        var fileHandle = CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);
        fileHandle.init(inputStream);
        // Read
        var size = 0;
        while ((size = inputStream.available())) {
            fileContents += fileHandle.read(size);
        }
        fileHandle.close();
        inputStream.close();
        fileHandle = null;
        inputStream = null;
    } catch(e) {
        throw 'ERROR reading file: '+e;
    }
    return fileContents;
}
,
/**
* Return the file content from  from cahce dir
*
* @param  {string} fileName
*       Name of file in cache directory to read
* @return  {string} Contents of cache file
*
* 
*/
readCacheFile : function(fileName) {
    try {    
        var file = this.getCacheFile(fileName);
        return this.readFile(file);
    } catch(e) {
        throw 'ERROR reading cache file '+fileName+': '+e;
    }
    return null;
},
/**
* Writes the content to  specified nsIFile
*
* @param  {nsIFile} file 
*       The file from where content need to be read
* @param {string} fileContents The file content to be written
*
* 
*/
writeFile : function(file,fileContents) {
    if (!file.exists()) {
        file.create(file.NORMAL_FILE_TYPE, 0666);
    }
    var fileHandle = CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);
    fileHandle.init(file, 0x04 | 0x08 | 0x20, 0666, 0);
    fileHandle.write(fileContents, fileContents.length);
    fileHandle.flush();
    fileHandle.close();
    fileHandle = null;
},
/**
* Writes the content to  specified cache file location
*
* @param {string} fileName 
*       File name to save content under in cache directory
* @param {string} fileContents Content to save to cache
*
* @date  12 - june - 2008
*/
writeCacheFile : function(fileName, fileContents) {
    try {
        var file = this.getCacheFile(fileName);    
        this.writeFile(file,fileContents);
    } catch(e) {
        throw 'ERROR writing file '+fileName+': '+e;
    }
    return true;
},
/**
* Delete cache file or entire cached directory
*
* @param {string} fileName Name of cache file to delete, if null, the entire directory will be deleted
*
*/
removeCacheFile : function(fileName){
    try{
        var file = this.getCacheDir();        
        // Add file node
        if (fileName) {
            file.appendRelativePath(fileName);
        }        
        // Remove
        if (file.exists()) {
            file.remove(true);
        }
    } catch (e){
        throw "ERROR removing cache file ("+ fileName +"): "+ e;
    }
},
/**
* Fetches and caches the data in the RDF file for a particular key.
* @param {string} url The url from where data need to be fetched and cached.
* @return {string} data The data fetched from the given url.
*
*/
fetchNCacheData : function(url)  {
     var data = "";
     try {
        data = CacheManager.getDataForKey(url);
        if (!data || data === "") {
            var iosvc   = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
            var channel = iosvc.newChannel(url, 0, null);
            var stream  = channel.open();
            var fh      = CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);
            fh.init(stream);
            var size = 0;
            while ((size = stream.available())) {
                data += fh.read(size);
            }
            fh.close();
            fh = null;
            stream = null;        
        }
    } catch (e) {
    }
    return data
},
/** Member variables for storing the amount of bytes recieved from server
@type int
*/
mCountRead : null,
/** The Byte array received from server.
* @type Byte[]
*/
mBytes : [],
/**
* The stream used for fetching information from server
*/
mStream : null,    
/** Datastructures for fetching data from server*/
mFetchList : [],
mFetchObj :null,
mCacheNotifiers : [],
mDefaultIconUrl : "chrome://"+YahooExtConfig.mName+"/skin/default-icon.png",
registerNotifier : function(message) {
    this.mCacheNotifiers.push(message);
},
onStartRequest : function(request, context) {
    this.mStream = CC['@mozilla.org/binaryinputstream;1'].createInstance(CI.nsIBinaryInputStream);
    this.mBytes = [];
    this.mCountRead = 0;        
},
onDataAvailable : function (aRequest, aContext, aInputStream, aOffset, aCount) {                
    this.mStream.setInputStream(aInputStream);
    var chunk = this.mStream.readByteArray(aCount);
    this.mBytes = this.mBytes.concat(chunk);
    this.mCountRead += aCount;        
},
onStopRequest : function(req, context, statusCode) {               
    try {
        if (this.mFetchObj.mType === "img") {
            var key = this.mFetchObj.mKey;
            var dataUrl = this.mFetchObj.mDataUrl;
            var nodes = this.mFetchObj.mNodes;
            var mimeType = null;            
            if (this.mCountRead > 0) {
                mimeType = ytbUtils.getMimeType(this.mBytes, this.mCountRead );
            }            
            var icon = dataUrl;                
            if (key != dataUrl) {
                icon = this.mDefaultIconUrl;
            }                
            if (mimeType) {
                icon =  "data:" + mimeType + ";base64," + ytbUtils.convertToBase64(this.mBytes);
            }                               
            CacheManager.changeDataForKey(key,icon);
            for (var idx = 0; idx < nodes.length;idx++ ) {
                if (nodes[idx] && nodes[idx].setAttribute) {                    
                    nodes[idx].setAttribute("image",icon);
                }
            }
        } else {
            var data = ""+this.mBytes;
            CacheManager.changeDataForKey(this.mFetchObj.mDataUrl,data);        
        }
    } catch(e) {
    }
    req = null;
    context = null;   
    this.mFetchObj = null;
    this.fetchFromServer();
},     
fetchFromServer : function() {
    if (this.mFetchObj) {
        return;
    }                
    while (!this.mFetchObj && this.mFetchList.length > 0) {            
        try {
            this.mFetchObj = this.mFetchList.pop();        
            var IOSVC = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
            var chan = IOSVC.newChannel(this.mFetchObj.mDataUrl, 0, null);                               
            chan.asyncOpen(this, null);     
        } catch (e) {                                
            this.mFetchObj = null;
        }
    }
    if (this.mFetchList.length === 0 && this.mFetchObj === null && this.mCacheNotifiers.length > 0) {
        var message = this.mCacheNotifiers.pop();
        var notifier = CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
        notifier.notifyObservers(null, message,null);
    }
},    
isDownloading : function() {
    return this.mFetchObj !== null;
},
/**
* Adds the image to the Download quue - if the image is already there in the download queue we 
* add the DOM node to the list of DOM nodes whose images are to be set
*
* @param  {string} key 
*       Key which need to be used for accessing the image
* @param  {string} url 
*       The url from where actual image need to be fetched
* @param  {DOMNode} node 
*       The dom node to which the image attribute needs to be set 
*
* @author geldhose@yahoo.inc.com
*/
addImageForDownload : function(key,url,node) {
    /*
    Checks whether the node is already registered for some other image
    */
    function removeNodeIfPresent(nodeList,childNode) {
        for (var idx = 0; idx < nodeList.length; idx++) {
            if (nodeList[idx] == node) {
                nodeList.splice(idx,1);
            }
        }
    }
    if (this.mFetchObj) {
        removeNodeIfPresent(this.mFetchObj.mNodes, node);    
    }
    for (var idx = 0; idx < this.mFetchList.length; idx++ ) {
        removeNodeIfPresent(this.mFetchList[idx].mNodes, node);        
    }    
    if (this.mFetchObj && this.mFetchObj.mDataUrl == url) {
        this.mFetchObj.mNodes.push(node);
        return null;
    }
    for (var idx = 0; idx < this.mFetchList.length; idx++ ) {
        if (this.mFetchList[idx].mDataUrl == url) {
            this.mFetchList[idx].mNodes.push(node);
            return null;
        }
    }
    var obj = {mType:"img",mKey:key,mDataUrl:url,mNodes:[]};
    obj.mNodes.push(node);
    this.mFetchList.push(obj);        
    this.fetchFromServer(); 
},
/**
* fetches the favicon from the serve if its not available in the cache
* @param {string} imageUrl
*       The image url 
* @param {XulNode} node
*       The DOM node to which the image attribute needs to be set;
*
* @author geldhose@yahoo.inc.com
*/
fetchNCacheImage : function(imageUrl,node) {
    try {        
        var icon = this.getImageFromCache(imageUrl);        
        if (node && node.setAttribute) {            
            if (icon) {
                node.setAttribute("image",icon);            
                return null;
            } else {
                node.setAttribute("image",imageUrl);
            }            
        }
        if (imageUrl.indexOf("chrome://") == 0 ) {
            return;        
        }
        this.addImageForDownload(imageUrl,imageUrl,node);                        
    } catch(e) {
    }
    return null;
},
/**
* fetches the favicon from the serve if its not available in the cache
* @param  {string} url
*       The image url from where the data needs to be fetched/ if the  URL is not an image 
*       url , then we will fetch the favicon from http://[HOST]/favicon.ico location
* @param {XulNode} node
*       The DOM node to which the image attribute needs to be set;
*
* @author  geldhose@yahoo-inc.com
*
*/
fetchNCacheFavicon : function(url,node) {    
    try {
        /* we are uanble to get the image from cached sources */
        var icon = this.getFaviconFromCache(url,false);        
        /* the url can be an image url - which we need to fetch directly , if the url is for a page in the particular
        site then we look for the icon at location http://[HOST]/favicon.ico , we test whether the url is for a favicon 
        by checking the extension of image - [*.gif, *.bmp, *.jpg, *.ico]
        */
        if (node && node.setAttribute) {            
            if (icon) {
                node.setAttribute("image",icon);              
                return;
            } else {
                node.setAttribute("image",this.mDefaultIconUrl);              
            }
        }                       
        if (url.indexOf("chrome://") == 0 ) {            
            return;        
        }
        var ioService = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
        var host = ioService.newURI(url,"" ,null).host;    
        var imageUrl = "http://"+ host +"/favicon.ico";
        var imgRegExp = new RegExp('\.(bmp|jpg|ico|gif|png)$');
        if (url.match(imgRegExp)) {
            imageUrl = url;
        }         
        this.addImageForDownload(host,imageUrl,node);
    } catch (e) {
    }
    return null;
},
/**
* Gets the Image from any of the stored locations 
* @param {string} url 
*       url should be in http:// format
* @param {boolean} defaultIcon 
*       Boolean value to specify return the default icon
*       if we are unable to find the icon in the store
*
* 
*/
getImageFromCache : function (url, defaultIcon) {
    var icon = null;
    try {                
        icon = CacheManager.getDataForKey(url);        
        if (!icon && defaultIcon) {
            icon = this.mDefaultIconUrl;
        }
    } catch (e) {
    }
    return icon;
},
/**
* Gets the favicon from any of the stored locations 
* @param {string} url 
*       url should be in http:// format
* @param {string} defaultIcon 
*       boolean value to specify return the default icon if we are unable to find the icon in the store
*
*/
getFaviconFromCache : function(url, defaultIcon) {                 
    var icon;
    try {
        if ( url.indexOf("chrome://") == 0) {
            return this.mDefaultIconUrl;
        }
        var ioService = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
        var iconUri = ioService.newURI(url,"" ,null);        
        icon = this.getImageFromCache(iconUri.host,false);        
        if (!icon && ytbUtils.mFFVersion > 2) {
            try {
                var faviconService = CC["@mozilla.org/browser/favicon-service;1"].getService(CI.nsIFaviconService);                                          
                var fav = faviconService.getFaviconForPage(iconUri);                        
                var mimeType = {}, dataLen ={}, iconData = null;   
                var iconData = faviconService.getFaviconData(fav, mimeType, dataLen);
                if (iconData) {
                    mimeType = mimeType.value;
                    icon = "data:" + mimeType + ";" + "base64," +
                    btoa(String.fromCharCode.apply(null, iconData));
                    CacheManager.changeDataForKey(iconUri.host, icon);
                }                   
            } catch (e) {
            }
        }           
    } catch (e) {
    }
    if (!icon && defaultIcon){
        icon = this.mDefaultIconUrl;
    }                       
    return icon;
}
,     
QueryInterface : function (iid) {
    if(!iid.equals(CI.nsIYahooFileIOPre) && !iid.equals(CI.nsISupports) && !iid.equals(CI.nsIRunnable)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
}
};
/**
* DO NOT CHANGE THIS OBJECT 
* @private
*/
function NSGetModule(compMgr, fileSpec) { 
    return {
        myCID       : Components.ID("{4487b19c-4ae8-4ace-9e0e-2b313c031756}"),
        myProgID    : "@yahoo.com/fileio;1",
        firstTime   : true,
        registerSelf : function (compMgr, fileSpec, location, type) {
            if (this.firstTime) {
                this.firstTime = false;
                throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
            }
            compMgr = compMgr.QueryInterface(CI.nsIComponentRegistrar);
            compMgr.registerFactoryLocation(this.myCID, "Yahoo! File IO", 
                this.myProgID, fileSpec, location, type);
        },
        getClassObject : function (compMgr, cid, iid) {
            if (!cid.equals(this.myCID)) {
                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
            if (!iid.equals(CI.nsIFactory)) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            }
            return this.myFactory;
        },
        myFactory : {            
            createInstance : function (outer, iid) {
                if (outer !== null) { 
                    throw Components.results.NS_ERROR_NO_AGGREGATION; 
                }                
                return new YahooFileIO().QueryInterface(iid);
            }
        },
        canUnload : function(compMgr) { return true; }
    };
}
