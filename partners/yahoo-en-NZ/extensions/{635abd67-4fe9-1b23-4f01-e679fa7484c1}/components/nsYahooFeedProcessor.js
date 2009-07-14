/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/*
   Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
*/
/**
* @package yahoo.toolbar.firefox.xpcom
*/
var CI = Components.interfaces;
var CC = Components.classes;
var yahooCC = CC;
var yahooCI = CI;
var yahooPrefService =  CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);
var loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);             
loader.loadSubScript("chrome://ytoolbar/content/utils.js"); 
/**
* @class Loads and processes the remote feed.
* This is the central object that manages feed loading and caching.
* <p>
* It fires the following notifications through the nsIObserverService:
* <small>(more info on <a href="http://www.xulplanet.com/tutorials/mozsdk/observerserv.php">Global Notifications</a>)</small><br />
* <b>yahoo-feed-updated</b>: The feed has finished loading.<br />
* <b>yahoo-feed-alert</b>: The alert feed has finished loading.<br />
* <b>yahoo-feed-loading-cached</b>: The feed could not be downloaded so the cached version is being loaded.<br />
* <b>yahoo-feed-error</b>: Some error occured.  The data of this notification is the error code and message. See error codes below.<br />
* <b>yahoo-feed-warning</b>: Warns that somethign went wrong.  This is less severe than an error and does not halt processing.  The data of this notification is the error code and message<br />
* </p>
* <p>
* <b>Error Codes</b>
* When an error or warning notification is fired it will send the error code and message in the topic of the notification.
* The error code can be mapped to a method using the table below:
* </p>
* <p>
*   400 - 402 : {@link #init}
*   403 - 404 : {@link #onStopRequest}
*   405 - 406 : {@link #loadFeed}
*   407 - 409 : {@link #loadCachedFeed}
*   410 - 419 : {@link #processFeed}
*   420 - 429 : {@link #readNextNode}
*   440 - 449 : {@link #cacheFeed}
*   450 - 459 : {@link #retrieveAlerts}
* </p>
*/
function YahooFeedProcessor() {
    this.mFileIO = CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIOPre);
    BookmarkManager.mFileIO = this.mFileIO;
}
YahooFeedProcessor.prototype = {
    NOT_LOADED : 0x01,
    CACHE_LOADED : 0x02,
    LIVE_LOADED : 0x03,
    FEED_URL : "http:\/\/us.update2.toolbar.yahoo.com/slv/v4/2.html?&.pc=&t=1123627243899&.ta=cgnone,cc,cius,cv1_5_4,cp,cbm",
    loaded : false,
    fpInit : false,
    loading : false,
    loadedType : this.NOT_LOADED,
    isGuest : true,
    blindYID : null,
    cacheDir : null,
    cacheFile : null,
    raw : null,
    serverRaw : null,
    params : null,
    values : null,
    domBuilder : null,              
    securekey : " AvadaKedavra",   
    /**
    * Style codes
    * @type {Array}
    */
    styles : { "std" : {
                    1 : "OUTLINE", 2 : "ROUNDEDGE", 4 : "HIGHLIGHT", 8 : "RAISED", 16 : "STATIC", 32 : "TOGGLE", 64 : "MODIFIABLE", 
                    128 : "LOCAL", 256 : "NOMENUHIDE", 512 : "NOTEXT", 1024 : "NOMORE", 2048 : "REMOVEONCLICK", 4096 : "TOGGLEOFF",
                    8192 : "MINIMIZABLE", 16384 : "REDIRECT", 32768 : "MENUITEM", 65536 : "NOUSECACHE", 131072 : "NOTOOLTIP", 
                    262144 : "ALWAYSPRESSED", 524288 : "ANIMATED", 1048576 : "ALWAYSHIDE", 2097152 : "BROWSERIMAGE" 
                },
                "ext" : {
                    1 : "EX_ALIGNCENTER", 2 : "EX_ALIGNRIGHT", 4 : "EX_MODUSERES", 4 : "EX_MODUSERES", 8 : "EX_MODUSERPAR", 
                    16 : "EX_TBLINEFEED", 32 : "EX_TBNOCLOSE", 64 : "EX_TBNOGETMOD", 128 : "EX_TBPASSEDIT", 256 : "EX_TBFORCEGETMOD", 4096 : "HASSTATE",
                    8192 : "EX_ENABLEDBY", 65536 : "EX_ENABLEDBY", 131072 : "EX_NEWWINDOWTAB"
                }
            },
    /** @private */
    charsets : [],
    notifier : null,
    stream : null,
    timer : null,
    uniconvert : null,
    /** 
    * temp var for extra menubar items
    * @private
    */
    acs : null,
    /**
    * Creates and returns "cache" directory path
    * @private
    */   
    createCacheDir : function() {
        try {
            this.cacheDir = this.mFileIO.getUserCacheDir();
            this.cacheFile = this.cacheDir.clone().QueryInterface(CI.nsILocalFile);
            this.cacheFile.setRelativeDescriptor(this.cacheDir, "feed");
        } catch(e) {             
        }
    }, 
    /**
    * Check cookies to get the blind login Y!ID
    * @private
    */
    checkCookies : function() {        
        this.blindYID = ytbUtils.getBlindYID();       
        if (! this.cacheDir) {
            this.createCacheDir();
        }
        this.isGuest = true;
        if (this.blindYID !== "default") {
            this.isGuest = false;            
        }
        this.cacheDir = this.mFileIO.getUserCacheDir();
        this.cacheFile = this.cacheDir.clone().QueryInterface(CI.nsILocalFile);
        this.cacheFile.appendRelativePath("feed");
        BookmarkManager.createBM2CacheFile(this.cacheDir);   
        cookies = null;
    },
    /**
    * Start Feed Service.
    * Should only be called once on component creation.
    */
    init : function() {
        if (this.fpInit) {
            return;
        }
        var processor = this;
        var feedProObserver = {
            _observing : [ "cookie-changed","em-action-requested", "quit-application-granted", "yahoo-uninstalled-from-pencil-menu"],
            prefSrvc : CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch),
            obsSrvc : CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService),
            yahooUninstalled : false,
            yahooUninstalledFromPencilMenu : false,
            yahooUninstallTracked: false,
            feedProc : null,
            yCookieChanged : false,
            tCookieChanged : false,
            observe : function(subject, topic, data) {
                if(topic == "cookie-changed") {                   // List cleared
                    var cookie = subject.QueryInterface(CI.nsICookie);
                    if (cookie.host != '.yahoo.com') {
                        return;
                    } 
                    if (cookie.name == 'Y') {
                        this.yCookieChanged = true;
                    } else if (cookie.name == 'T') {
                        this.tCookieChanged = true;
                    }
                    if (this.yCookieChanged && this.tCookieChanged) {
                        processor.loadFeed(false);
                        this.tCookieChanged = false;
                        this.yCookieChanged = false;
                    }
                }
                // Uninstalled from pencil menu
                else if (topic == "yahoo-uninstalled-from-pencil-menu") {                    
                    this.yahooUninstalledFromPencilMenu = true;
                }                    
                // Uninstall
                else if (topic == "em-action-requested") {                    
                    subject.QueryInterface(CI.nsIUpdateItem);
                    if (subject.id == "{635abd67-4fe9-1b23-4f01-e679fa7484c1}") {
                        if (data == "item-uninstalled") {
                            this.yahooUninstalled = true;
                        } else if (data == "item-cancel-action") {
                            this.yahooUninstalled = false;
                            this.yahooUninstalledFromPencilMenu = false;
                        }
                    }
                }
                // Delete preferences on uninstall
                else if(topic == "quit-application-granted"){                    
                    if (this.yahooUninstalled && !this.yahooUninstallTracked) {
                        try {
                            var server = (this.feedProc) ? this.feedProc.getHashValue("rdsrv") : "";
                            if (! server) {
                                server = "rd.companion.yahoo.com";
                            }
                            var lang = (this.prefSrvc.prefHasUserValue('yahoo.installer.language')) ?
                                            this.prefSrvc.getCharPref('yahoo.installer.language') : "us";
                            var param;
                            if (this.feedProc && (param = this.feedProc.getHashParam("lang"))){
                                lang = param.func;
                            }
                            var channel = (this.prefSrvc.prefHasUserValue('yahoo.installer.dc')) ?
                                                this.prefSrvc.getCharPref('yahoo.installer.dc') : "nodc";
                            var nd = (this.prefSrvc.prefHasUserValue('yahoo.installer.nd')) ?
                                                this.prefSrvc.getIntPref('yahoo.installer.nd') : 0;
                            var trackRemove = this.yahooUninstalledFromPencilMenu ? "rmp" : "rmd";
                            var url = "http://" + server + "/moz/"+ trackRemove + "/" + lang + "/" + channel + "/" + nd + "/*http://l.yimg.com/a/i/sh/bl.gif";
                            var request = CC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(CI.nsIXMLHttpRequest);
                            request.open("GET", url,false);
                            request.send(null);
                            this.yahooUninstallTracked = true;
                        } catch(e) { }
                        var prefvalues = [ "yahoo.installer.version",
                            "yahoo.installer.version.simple",
                            "yahoo.installer.sc",
                            "yahoo.installer.pc",
                            "yahoo.installer.dc",
                            "yahoo.addtomy",
                            "yahoo.homepage.dontask",
                            "yahoo.installer.country",
                            "yahoo.installer.language",
                            "yahoo.installer.partner",
                            "yahoo.options.antispy",
                            "yahoo.options.iconsonly",
                            "yahoo.options.menubar", 
                            "yahoo.options.showhistory",
                            "yahoo.options.showlivesearch",
                            "yahoo.search.highlight", 
                            "yahoo.supports.livesearch",
                            "yahoo.toolbar.searchbox.width",
                            "yahoo.options.autoclear",
                            "yahoo.options.showbookmark",
                            "yahoo.options.showmailalert",
                            "yahoo.options.mailsi.enable",
                            "yahoo.options.mailsi.userenable",
                            "yahoo.toolbar.searchbox.updated",
                            "yahoo.eula.accepted",
                            "yahoo.installer.installdate",
                            "yahoo.toolbar.searchbox.active"
                            ];
                        prefvalues.forEach(function(value) {
                            if (this.prefSrvc.prefHasUserValue(value)) {
                                this.prefSrvc.clearUserPref(value);
                            }
                        }, this);
                    }
                }
                // Options
                else if (data && data.indexOf("yahoo.options") > -1) {
                    if (data == "yahoo.options.iconsonly") {
                        this.feedProc.domBuilder.iconsOnly = this.prefSrvc.getBoolPref("yahoo.options.iconsonly");
                    }
                }
            },
            register : function(fp) {
                this.feedProc = fp;
                this._observing.forEach(function(topic) {
                    this.obsSrvc.addObserver(this, topic, false);
                }, this);
                // Add pref observer
                var pref = CC["@mozilla.org/preferences;1"].getService(CI.nsIPref);
                pref.addObserver("yahoo.options", this, false); 
            }
        };
        feedProObserver.register(this);            
        this.notifier = CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
        this.uniconvert = CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);
        this.uniconvert.charset = 'utf-8';
        this.params = new YahooHashtable();
        this.values = new YahooHashtable();        
        this.domBuilder = CC["@yahoo.com/dombuilder;1"].getService(CI.nsIYahooDomBuilder);            
        // Charcodes
        this.charsets[1]   = 'iso-8859-1';   // ascii
        this.charsets[128] = 'shift_jis';    // japanese
        this.charsets[129] = 'euc-kr';       // korean
        this.charsets[130] = 'johab';        // korean
        this.charsets[134] = 'gb2312';       // chinese
        this.charsets[136] = 'Big5';         // chinese
        this.charsets[161] = 'windows-1253'; // greek
        this.charsets[162] = 'windows-1254'; // turkish
        this.charsets[163] = 'windows-1258'; // vietnamese
        this.charsets[177] = 'windows-1255'; // hebrew
        this.charsets[178] = 'windows-1256'; // arabic
        this.charsets[186] = 'windows-1257'; // baltic
        this.charsets[204] = 'windows-1251'; // cyrillic
        this.charsets[222] = 'windows-874';  // thai
        this.charsets[238] = 'windows-1250'; // east europe
        this.createCacheDir();            
        this.checkCookies();                                    
        this.fpInit = true;        
    },
    /**
    * Construct feed url.
    * Type is the type of url to build:
    * <br />
    * 0: Toolbar feed<br />
    * 1: Alert feed<br />
    * @param {int} type The type of url to build (0: toolbar, 1: alert)
    * @returns {String}
    * @private
    */
    buildFeedUrl : function(type) {
        var param;
        var url = "";
        var prefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);
        // Get values
        // REVIEW NOTE: make some global
        // CHECK prefs for null
        var fnum    = 2; // feed number
        var fver    = 4; // feed version
        var time    = (new Date().getTime());
        var cc      = (prefs.prefHasUserValue("yahoo.installer.country")) ? prefs.getCharPref("yahoo.installer.country") +"." : "us.";
        var pc      = (prefs.prefHasUserValue("yahoo.installer.pc")) ? prefs.getCharPref("yahoo.installer.pc") : "";
        var tid     = (prefs.prefHasUserValue("yahoo.installer.toolbarID")) ? prefs.getCharPref("yahoo.installer.toolbarID") : "";
        var cid     = (prefs.prefHasUserValue("yahoo.installer.corpID")) ? prefs.getCharPref("yahoo.installer.corpID") : "";
        var lang    = (prefs.prefHasUserValue("yahoo.installer.language")) ? prefs.getCharPref("yahoo.installer.language") : cc.substr(0, 2);
        var cver    = (prefs.prefHasUserValue("yahoo.installer.version")) ? prefs.getCharPref("yahoo.installer.version") : "1.1.0";
       //add yahoo.com to trusted domain
        try 
        {
            var cookieBehavior = prefs.getIntPref("network.cookie.cookieBehavior");
            if (cookieBehavior !== 0) {
            var choice = Components.classes["@mozilla.org/cookie/permission;1"].createInstance();
            choice.QueryInterface(Components.interfaces.nsICookiePermission);
            var uri = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService).newURI("http://yahoo.com", null, null);
            choice.setAccess(uri, 1);
            }
        } catch (e) {}
        // Values from params
        if (! this.isGuest && (param = this.params.get("lang"))) {
            lang = param.func;
        }
        if (tid === "") {
            tid = "none";
        }
        // Shorten & format client version (remove the date)
        if (cver !== "") {
            cver = cver.split(".");
            if(cver.length > 3){
                cver.length = 3;
            }
            cver = cver.join("_");
        }
        // Toolbar Feed
        // http://<cc>.update2.toolbar.yahoo.com/slv/v<fver>/<fnum>.html?&.pc=<pc>&t=<time>&.ta=cg<tid>,cc<cid>,ci<lang>,cv<cver>,cp<pc>,cbm
        if(type === 0){
            url = "http:\/\/" + cc + "data.toolbar.yahoo.com" +
                    "/slv/v" + fver +
                    "/" + fnum + ".html" +
                    "?&.pc=" + pc +
                    "&t=" + time +
                    "&.ta=cg" + tid +
                    ",cc" + cid +
                    ",ci" + lang +
                    ",cv" + cver +
                    ",cp" + pc +
                    ",cbm,cjs";           
        }
        // Alert feed
        //          http://<cc>.update2.toolbar.yahoo.com/slv/v<fver>/not?v=<cver>&t=<time>&.ta=cg<cid>,cc<cid>,ci<lang>,cv<cver>
        else {
            url = "http:\/\/" + cc + "update2.toolbar.yahoo.com" +
                    "/slv/v" + fver +
                    "/not?v=" + cver +
                    "&t=" + time +
                    "&.ta=cg" + tid +
                    ",cc" + cid +
                    ",ci" + lang +
                    ",cv" + cver + "&_ids=";
        }
        return url;
    },
    stripKey : function() {
        var strip = {
            begin : ',{"e":["Y!","sck","","0","',
            end : "}",
            sKeyEnd:"\""
        };
        if (this.serverRaw.indexOf('{"e":') == -1 ) {
            strip.begin = 'Y!sck0';            
            strip.end  = '';
            strip.sKeyEnd = ''            
        } 
        var ret = ["","AvadaKedavra"];
        var praw = this.serverRaw.split(strip.begin);                       
        var kraw = praw[1];         
        if (praw[0] && praw[1]) {
            var index = praw[1].indexOf(strip.end);
            praw[1] = praw[1].substr(index+1);
            ret[0] = praw[0] + praw[1];            
        } else {
            ret[0] =  this.serverRaw;
        }
        if (kraw) {
            var key = kraw.split(strip.sKeyEnd)[0];
            ret[1] = key;
        }
        return ret;            
    },
    toolbarLoadRestart : function(seconds) {
        var processor =this;        
        try {
            var callback = {
                notify : function(timer) {                    
                    try { processor.loadFeed(true); }catch(e)
                    {}
                    timer = null;
                }
            };
            var delay = 1000 * seconds;                     
            var timer = CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);            
            timer.initWithCallback(callback, delay, timer.TYPE_ONE_SHOT);
        } catch(e) {
        }
    },
    loadFeedFromServer : function() {
        this.loading = true;
        this.FEED_URL = this.buildFeedUrl(0);
        var iosvc = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);        
        var channel = iosvc.newChannel(this.FEED_URL, 0, null);
        yahooDiagnose("Feed from URL \n"+this.FEED_URL);
        channel.asyncOpen(this, null);
    },
    /**
    * Get load Feed Data 
    * If available in cache - load it for a better user experiece
    * Fetech the feed from server - compare it with whats loaded 
    * If the server feed is different, process and build the server feed 
    */
    loadFeed : function(loadFromServer){
        if (this.loading) {
            return;
        }
        this.loading = true;
        loadFromServer = loadFromServer || false;
        try{            
            this.isGuest = true;            
            /* we will load the cached feed if its available */
            if (! loadFromServer) {
                if (! this.loadCachedFeed()) {
                    this.loadedType = this.NOT_LOADED;
                }
            } else {
                this.raw = "";
            }
            /*Then we load from the server for checking whether the cached and server versions are same*/
            this.loadFeedFromServer(); 
        } catch(e) {
            this.toolbarLoadRestart(30);
            this.notifier.notifyObservers(null, "yahoo-feed-error", "405: "+ e);
        }                
    },
    /**
    * Load and process the last cached feed
    * @private
    */  
    loadCachedFeed : function() {
        var inStream, handle;
        var success = false;        
        try{
            this.checkCookies();
            this.loadedType = this.CACHE_LOADED;                        
            var fileRaw = this.mFileIO.readFile(this.cacheFile);            
            // Empty cache
            if (!fileRaw || fileRaw == "") {
                throw "Empty Cache File";                                
            }            
            this.raw = fileRaw;
            this.processFeed();            
            success = true;            
        } catch(e) {   
            this.raw = "";
        }
        this.loading = false;
        return success;
    },
    /*
    * Channel listener functions
    */
    /** @private */
    onStartRequest : function(request, context) {
        this.serverRaw = "";
    },
    /** @private */
    onDataAvailable : function(request, context, inputStream, offset, count) {
        if (this.stream == null) {
            this.stream = CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);
        }
        this.stream.init(inputStream);  // REVIEW NOTE: make global
        this.serverRaw += this.stream.read(count);
    },
    onStopRequest : function(request, context, statusCode) {                
        var http;
        try {
            if (this.stream) {
                // Try to close if initialized
                try{ this.stream.close(); }catch(e){}
                this.stream = null;
            }            
            http = request.QueryInterface(CI.nsIHttpChannel);                        
            if (this.serverRaw === "" || http.status !== 0) {
                throw "Error in Fetching Feed from server"
            }        
            var stripped = this.stripKey();
            var strippedServerRaw = stripped[0];
            this.secureKey = stripped[1];
            if (this.raw != strippedServerRaw) {
                this.raw = this.serverRaw;                     
                this.domBuilder.bm2Feed = null;
                this.loadedType = this.LIVE_LOADED;
                this.processFeed();                
                this.raw = strippedServerRaw;
                this.cacheFeed();                                
            } else {
            }          
             var str = "Feed Info";
            try {
                str += "\nLength of Feed received :" + this.raw.length;
                var reqCookies = http.getRequestHeader("cookie");
                str += "\nCookies in machine :"+ytbUtils.getCookieNames(ytbUtils.getCookiesFromHost(".yahoo.com")).sort()+"\n";
                var cookieNames = reqCookies.match(new RegExp("(^|;)\b*[^=]*","g"))
                if (cookieNames) {
                    str += "Cookies in request :"+ cookieNames.join("").split(new RegExp(";")).sort();
                }
                str += "\nHost : " +this.getHashValue("fdsvr");
            } catch (e) {
                str += "\nError while accessing cookies (it seems user have enabled enable3rd party cookies" + e;
            }
            yahooDiagnose(str);
            var searchIndexer = CC["@yahoo.com/search/indexer;1"].getService(CI.nsIYahooSearchIndexer);
            searchIndexer.clearYahooBookmarkData();
            if (!this.isGuest) {
                this.retrieveAlerts();            
                this.initAlerts();
                // Bookmarks 2.0
                if (this.domBuilder.bm2Feed) {
                    this.processBM2(false);
                } 
            }    
        } catch(e) {
            yahooDiagnose(e);
            if (this.loadedType  == this.LIVE_LOADED) {
                if (! this.loadCachedFeed()) {
                    this.notifier.notifyObservers(null, "yahoo-feed-error", "403: "+ e);     
                }                 
            } else if (this.loadedType == this.NOT_LOADED) {
                this.notifier.notifyObservers(null, "yahoo-feed-error", "405: "+ e);
                this.toolbarLoadRestart(30);
            }
            this.loadedType = this.NOT_LOADED;            
        } 
        this.loading = false;        
        http = null;
        request = null;
        context = null;
    },
    /**
    * Cache the raw feed to file.
    * The feed will only be cached if it's a guest feed.
    */
    cacheFeed : function() {        
        if (this.raw) {
            try {
                this.checkCookies();
                if (this.cacheFile == null) {
                    return;
                }
                // Create cache file
                if (! this.cacheFile.exists()) {
                    this.cacheFile.create(this.cacheFile.NORMAL_FILE_TYPE, 0666);                    
                }
                // Save
                var out = CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);
                out.init(this.cacheFile, 0x20 | 0x02, 00666, null); // REVIEW NOTE: extra zero?
                out.write(this.raw, this.raw.length);
                out.flush();
                out.close();    
            } catch(e) {
            } 
        }
    },
    /**
    * Clear all the nodes and cleanup all old feed data
    */
    clear : function() {
        this.domBuilder.clear();
        this.params.clear();
        this.values.clear();
    },
    /**
    * Process Feed Data
    * @throws Exception
    */
    processFeed : function(){
        if (this.raw) {
            this.raw = this.raw.replace(/&amp;/g, "&");
            this.raw = this.raw.replace(/&quot;/g, "\"");
        }
        try {
            var ding = eval('(' + this.raw + ')');
            yahooDiagnose("Received JSON Feed");
            this.tb = ding.t;
            // Parse JSON Feed Data
            if (this.raw) {
                this.clear();
                for (var i = 0; i < ding.t.length; i++) {
                    this.processToolbarElement(null, this.tb[i]);    
                }
            } else {
                throw "No feed data";
            }
        } catch(e) {                        
            this.raw = this.raw.replace(new RegExp('{"e":\\["', "g"), '\x14');
            this.raw = this.raw.replace(new RegExp(']},', "g"), '\x15');
            this.raw = this.raw.replace(new RegExp('{"m":\\["', "g"), '\x16');
            this.raw = this.raw.replace(new RegExp('","', "g"), '\x18');
            this.raw = this.raw.replace(new RegExp('"],"c":\\[', "g"), '\x19');
            this.raw = this.raw.replace(new RegExp('{"t":\\[{', "g"), "");
            this.raw = this.raw.replace(new RegExp(']}', "g"), "");
            /*
                validating binary data
            */
            if (this.raw.indexOf('\x14') == -1 && this.raw.indexOf('\x16') == -1 ){          
                yahooDiagnose("*** Feed Error");
                throw "Error in Binary Data"                
            }
            yahooDiagnose("Received Binary Feed");
            // Parse Feed Data            
            if (this.raw) {
                this.clear();
                var pos = 0;
                while (pos < this.raw.length) {
                    pos = this.readNextNode(null, pos);                    
                }
                pos = null;                
            } else {                
                throw "No feed data";
            }
        }
        if (this.domBuilder.toolbar === null ||
                this.domBuilder.toolbar.childNodes.length === 0 ||
                this.domBuilder.toolbar.firstChild.childNodes.length === 0) {
            throw "Unable to build toolbar";
        }        
        this.notifier.notifyObservers(this, "yahoo-feed-updated", null);
        if (! this.loaded) {
            this.notifier.notifyObservers(this, "yahoo-show-BrowserSettings", null);
            this.loaded = true;
        }
    },    
    /**
    * Read the next node in the feed
    * @param {nsIYahooFeedNode} parent The parent node to attach the next node to
    * @param {int} pos The position to start reading from
    * @returns int The updated position
    */
    readNextNode : function(parent, pos){
        try {
            // Not a start of an element
            var first = this.raw.charAt(pos++);
            if(first != '\x14' && first != '\x16'){
                return pos;
            }
            // Read Parameters (REVIEW NOTE: switch back to native call)
            var ch;
            var param = "";
            var params = [];
            while (pos < this.raw.length) {
                ch = this.raw[pos++];
                // Fix menuitem format
                if (first == '\x16') {
                    if (params.length === 0) {
                        params[0] = "";
                    } else if (params.length == 2) {
                        params[2] = '\x16';
                        params[3] = "";
                    } else if (params.length == 10) {
                        params[10] = "";
                    }
                }
                // End of params
                if (ch == '\x19') {
                    params[params.length] = param;
                    param = "";
                    break;
                }
                // Next param
                else if(ch == '\x18') {
                    params[params.length] = param;
                    param = "";
                }
                // Param value
                else {
                    param += ch;
                }
            }
            // Create node and add params
            if (params.length > 1) {
                var node = CC["@yahoo.com/feed/node;1"].createInstance(CI.nsIYahooFeedNode);
                node.name = params[1];
                node.type = params[2].charCodeAt(0);
                // Value type
                if (node.type == node.VALUE_TYPE) {
                    this.values.addString(node.name, params[3]);
                    node = null;
                } else {
                    if (node.name == "sck") {
                        this.securekey = params[4];                      
                    }           
                    node.icon = params[3];
                    node.func = params[4];
                    // Format Function
                    if (node.func) {
                        node.func = node.func.replace(/,/g, "%2C"); // repace ',' with escaped one
                        var func = node.func.split('\x01');
                        node.func = func.join(",");
                        if (func.length > 1) {
                            node.funcNum = parseInt(func[1], 10);
                            // Tracking number
                            if (func.length > 2) {
                                node.funcTracking = func[2];
                            }
                            // Url      
                            if (func.length > 3) {
                                func.splice(0,3);
                                node.funcUrl = func.join(",");
                            }
                        }
                        // Redirect
                        else if (func.length == 1) {
                            node.funcNum = -1;
                            node.funcUrl = func[0];
                        }
                        func = null;
                    }
                    // Charset
                    if (node.type == node.PARAM_TYPE && node.name == "lang" && isFinite(node.icon)) {
                        this.uniconvert.charset = this.charsets[node.icon];
                        this.raw = this.uniconvert.ConvertToUnicode(this.raw);
                    }                 
                    // Type cases
                    if (node.type == 0x05) {
                        node.type = node.BUTTONMENU_TYPE
                    } else if ( node.name == "-" || node.icon == "vsep" || node.name == "spr" || node.name == "spr_div" ||  node.name == "sep") {
                        node.type = node.SEPARATOR_TYPE;
                    }
                    // Styles
                    var styles = 0;
                    if (params.length > 5 && params[5] !== "") {
                        styles = params[5];
                    }
                    // Extended Styles
                    var extStyles = 0;
                    if (params.length > 7 && params[7] !== "") {
                        extStyles = params[7];
                    }
                    this.processStyles(node, styles, extStyles);
                    // Hash Values (convert to JSCON)
                    if (params.length > 12 && params[12] !== "") {
                        params[12] = params[12].split("&");
                        var params12i;
                        for (var i = 0; i < params[12].length; i++) {
                            params12i = params[12][i].split("=");
                            if (params12i.length > 1) {
                                // Node icon
                                if (params12i[0] == "icov" || params12i[0] == "iconemp") {
                                    node.icon = params12i[1];
                                    this.cacheIcon(node);
                                }
                                else if (params12i[0] == "is") {
                                    node.icon = params12i[1] + "/" + node.icon;
                                    this.cacheIcon(node);
                                }
                                // Node id
                                else if (params12i[0] == "id") {
                                    node.id = params12i[1].replace(/g_/g, "_"); // remove guest flag;
                                }
                                // Escape quotes and slashes
                                params12i[1] = params12i[1].replace(/\\/g, "\\\\");
                                params12i[1] = params12i[1].replace(/'/g, "\\'");
                                // Add to JSON object
                                params12i = "'"+ params12i[0] +"':'"+ params12i[1] +"'";
                            } else {
                                params12i = "'"+ params12i[0] +"':true";
                            }
                            node.hash += ((i > 0) ? ",": "") + params12i;
                        }
                    }
                    // Cache the icon
                    if (node.type != node.PARAM_TYPE) {
                        this.cacheIcon(node);
                    }
                    // Add namespace to ID
                    if (node.id !== null) {
                        node.id = ((parent != null && parent.id) ? parent.id : "yahoo-toolbar") +"-"+ node.id;
                    }
                    // REVIEW NOTE: explains 'added'
                    var added = false;
                    // Add node to array
                    if (parent === null && node.type == node.PARAM_TYPE) {
                        this.params.add(node.name, node);
                        if (node.id != "yahoo-toolbar-acs") {
                            added = true;
                        }
                    } else if (parent !== null && parent instanceof CI.nsIYahooFeedNode) {
                        parent.addChild(node);
                    }
                    // Reassign parent to DOM Node
                    if (parent !== null && parent.domToolbar !== null) {
                        parent = parent.domToolbar;
                    } else if (parent instanceof CI.nsIYahooFeedNode) {
                        parent = null;
                    }
                    // Child nodes
                    while (pos < this.raw.length && this.raw[pos] != '\x15' && this.raw[pos] != '\x17') {
                        // Add node to DOM
                        if (added === false && node !== null) {
                            // Make this a menu (since it's not explicitly set in feed)
                            switch (node.type) {
                                case node.BUTTON_TYPE:
                                    node.type = node.BUTTONMENU_TYPE;
                                break;
                                case node.MENUITEM_TYPE:
                                    node.type = node.MENU_TYPE;
                                break;
                            }
                            node.domToolbar = this.domBuilder.addNode(node, parent);
                            added = true;
                        }
                        // Recurse into child
                        pos = this.readNextNode(node, pos);
                    }
                    // fixing bug 660270 - srihari for Y! button
                    if (node.type == node.BUTTONMENU_TYPE && this.raw[pos] == '\x15') {
                        node.type = node.BUTTON_TYPE;
                    }
                    // Create DOM node -- if haven't already
                    //   - ignore if it's a menu, because if it hasn't been added already, then there aren't any children
                    if(added === false && node.type != node.MENU_TYPE && node.type != node.BUTTONMENU_TYPE){
                        node.domToolbar = this.domBuilder.addNode(node, parent);
                    }
                }
                pos++;
                if(node !== null && node.type != node.PARAM_TYPE){
                    node.destroy();
                }
                node = null;
                ch = null;
                first = null;
                param = null;
                params = null;
            }
        } catch(e) {
        }
        parent = null;
        return pos;
    },
    /**
    * Read the next node in the feed
    * @param {nsIYahooFeedNode} parent The parent node to attach the next node to
    * @param Toolbar Element
    */
    processToolbarElement : function(parent, pos) {
        try {
            var elem = (pos.e) ? pos.e : [];
            // Fix menuitem format  
            if (pos.m) {
                elem[0] = "";   
                for (var i = 0; i < pos.m.length; i++) {
                    elem[elem.length] = pos.m[i];   
                    if (elem.length == 2) { 
                        elem[elem.length] = '\x16';
                        elem[elem.length] = ""; 
                    }   
                    if (elem.length == 10) {    
                        elem[elem.length] = ""; 
                    }   
                }   
            }   
            // Create node and add params   
            if (elem.length > 1) {
                var node = CC["@yahoo.com/feed/node;1"].createInstance(CI.nsIYahooFeedNode); 
                node.name = elem[1];    
                node.type = elem[2].charCodeAt(0);  
                // Value type   
                if (node.type == node.VALUE_TYPE) {
                    this.values.addString(node.name, elem[3]);  
                    node = null;    
                } else {
                    if (node.name == "sck") {
                        this.securekey = elem[4];                         
                    }
                    node.icon = elem[3];    
                    node.func = elem[4];    
                    // Format Function  
                    if (node.func !== "") {
                        node.func = node.func.replace(/,/g, "%2C"); // repace ',' with escaped one
                        var func = node.func.split('\x01'); 
                        node.func = func.join(","); 
                        if (func.length > 1) {
                            node.funcNum = parseInt(func[1], 10);   
                            // Tracking number  
                            if (func.length > 2) {
                                node.funcTracking = func[2];    
                            }   
                            // Url          
                            if (func.length > 3) {
                                func.splice(0,3);   
                                node.funcUrl = func.join(",");  
                            }   
                        }   
                        // Redirect 
                        else if (func.length == 1) {
                            node.funcNum = -1;  
                            node.funcUrl = func[0]; 
                        }   
                        func = null;    
                    }   
                    // Charset  
                    if (node.type == node.PARAM_TYPE && node.name == "lang" && isFinite(node.icon)) {
                        this.uniconvert.charset = this.charsets[node.icon]; 
                        this.raw = this.uniconvert.ConvertToUnicode(this.raw);  
                        if (node.icon != "1") {
                            var ding = eval('(' + this.raw + ')');
                            this.tb = ding.t;
                        }
                    }   
                    // Cache the icon   
                    if (node.type != node.PARAM_TYPE) {
                        this.cacheIcon(node);   
                    }   
                    // Type cases   
                    if (node.type == 0x05) {
                        node.type = node.BUTTONMENU_TYPE    
                    } else if (node.name == "-" || node.icon == "vsep" || node.name == "spr" ||  node.name == "sep") {
                        node.type = node.SEPARATOR_TYPE;    
                    }   
                    // Styles   
                    var styles = 0; 
                    if (elem.length > 5 && elem[5] !== "") {
                        styles = elem[5];   
                    }   
                    // Extended Styles  
                    var extStyles = 0;  
                    if (elem.length > 7 && elem[7] !== "") {
                        extStyles = elem[7];    
                    }   
                    this.processStyles(node, styles, extStyles);    
                    // Hash Values (convert to JSCON)   
                    //  REVIEW NOTE: local var for elem[12][i]  
                    if (elem.length > 12 && elem[12] !== "") { 
                        elem[12] = elem[12].split("&"); 
                        for (var i = 0; i < elem[12].length; i++) {
                            elem[12][i] = elem[12][i].split("=");   
                            if (elem[12][i].length > 1) {
                                // Node icon    
                                if (elem[12][i][0] == "icov" || elem[12][i][0] == "iconemp") {
                                    node.icon = elem[12][i][1];
                                    this.cacheIcon(node);
                                }
                                // Node id
                                else if (elem[12][i][0] == "id") {
                                    node.id = elem[12][i][1].replace(/g_/g, "_"); // remove guest flag; 
                                }   
                                // Escape quotes and slashes    
                                elem[12][i][1] = elem[12][i][1].replace(/\\/g, "\\\\"); 
                                elem[12][i][1] = elem[12][i][1].replace(/'/g, "\\'");   
                                // Add to JSON object   
                                elem[12][i] = "'"+ elem[12][i][0] +"':'"+ elem[12][i][1] +"'";  
                            } else {
                                elem[12][i] = "'"+ elem[12][i][0] +"':true";    
                            }   
                            node.hash += ((i > 0) ? ",": "") + elem[12][i]; 
                        }   
                    }   
                    // Add namespace to ID  
                    if (node.id !== null) {
                        node.id = ((parent !== null && parent.id) ? parent.id : "yahoo-toolbar") +"-"+ node.id;  
                    }   
                    // REVIEW NOTE: explains 'added'    
                    var added = false;  
                    // Add node to array    
                    if (parent === null && node.type == node.PARAM_TYPE) {
                        this.params.add(node.name, node);   
                        if (node.id != "yahoo-toolbar-acs") {
                            added = true;   
                        }   
                    } else if (parent !== null && parent instanceof CI.nsIYahooFeedNode) {
                        parent.addChild(node);  
                    }   
                    // Reassign parent to DOM Node  
                    if (parent !== null && parent.domToolbar !== null) {
                        parent = parent.domToolbar; 
                    } else if(parent instanceof CI.nsIYahooFeedNode) {
                        parent = null;  
                    }   
                    // Child nodes  
                    for (var k = 0; k < pos.c.length; k++) {
                        // Add node to DOM  
                        if (added === false && node !== null) {
                            // Make this a menu (since it's not explicitly set in feed) 
                            switch (node.type) {
                                case node.BUTTON_TYPE:  
                                    node.type = node.BUTTONMENU_TYPE;   
                                break;  
                                case node.MENUITEM_TYPE:    
                                    node.type = node.MENU_TYPE; 
                                break;  
                            }   
                            node.domToolbar = this.domBuilder.addNode(node, parent);    
                            added = true;   
                        }   
                        // Recurse into child   
                        this.processToolbarElement(node, pos.c[k]); 
                    }   
                    // fixing bug 660270
                    if (node.type == node.BUTTONMENU_TYPE && pos.c.length === 0) {
                        node.type = node.BUTTON_TYPE;
                    }
                    // Create DOM node -- if haven't already    
                    //   - ignore if it's a menu, because if it hasn't been added already, then there aren't any children   
                    if (added === false && node.type != node.MENU_TYPE && node.type != node.BUTTONMENU_TYPE) {
                        node.domToolbar = this.domBuilder.addNode(node, parent);    
                    }   
                }   
                if (node !== null && node.type != node.PARAM_TYPE) {
                    node.destroy(); 
                }   
                node = null;    
            }   
        } catch(e) {
        }   
        parent = null;
    },
    /**
    * Process the feed style codes
    * @param {nsIYahooFeedNode} node The feed node to with style data
    * @param {int} styles The styles flag
    * @param {int} extStyles The extended styles flag
    */
    processStyles : function(node, styles, extStyles){
        var bit = 0;
        var nodeStyles = ",";
        var stdBits = this.styles.std;
        var extBits = this.styles.ext;
        try {
            // No styles
            if (styles == 0 && extStyles == 0) {
                return;
            }
            // Standard styles
            var key;
            if (styles > 0) {
                for (key in this.styles.std) {
                    if (styles & key) {
                        nodeStyles += stdBits[key] +",";
                    }
                }
            }
            // Extended
            var key;
            if (extStyles > 0) {
                for (key in extBits) {
                    if (extStyles & key) {
                        nodeStyles += extBits[key] +",";
                    }
                }
            }
            node.styles = nodeStyles;
        } catch(e) {            
        }
    },
    /**
    * Cache the node's icon
    * @param {nsIYahooFeedNode} node The node with the icon to cache
    */
    cacheIcon : function(node){
        var path = "http:\/\/l.yimg.com/a/i/tb/icons/";
        var icon = node.icon;
        if (icon === "" || icon.indexOf("us.i1.yimg.com") != -1) {
            return "";
        }
        icon = icon.replace(/\\/i, "/");
        if (icon.indexOf("/") == -1) {
            path = "http:\/\/l.yimg.com/a/i/tb/iconsgif/";
        }
        // Chrome URL
        if (icon.indexOf(".") < 0) {
            node.icon = "chrome:\/\/ytoolbar/skin/"+ icon + ".gif";
        }
        // External Icon
        else {
            icon = icon.replace(/\.bmp$/i, ".gif");
            if (node.styles.indexOf('HASSTATE') != -1) {
                icon = icon.replace(/\.png$/i, "_s0.png");
            }
            path += icon;
            node.icon = path;
        }
    },
    stopAlertTimer : function(processor) {
        processor = processor || this;
        if (processor.timer != null) {
            processor.timer.cancel();
            processor.timer = null;                
        }
    },
    initAlerts : function() {
        try {
            var seconds = parseInt(""+this.getHashValue("pollTime"));            
            //seconds = 10;
            if (isNaN(seconds)) {
                seconds = 420;
            }
            if (this.timer != null && this.timer.delay != seconds) {
                this.stopAlertTimer(this);
            }
            var processor = this;
            var callback = {
                notify : function(timer) {
                    try { processor.retrieveAlerts(); }catch(e) {}
                }
            };
            var delay = 1000 * seconds;                     
            this.timer = CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer);
            this.timer.initWithCallback(callback, delay, this.timer.TYPE_REPEATING_PRECISE);
        } catch (e) {
        }        
    },
    /**
    * Get Alerts (i.e new mail) from the server for a logged-in user.
    * When the alert feed has been read, the <b>yahoo-feed-alert</b> notification will be sent.
    */
    retrieveAlerts : function() {
        try{
            // User not logged in
            if (this.isGuest) {
                return;
            }
            var url = this.buildFeedUrl(1);
            var alertIds  = ""
            /* check whether the option for displaying the mail alert is set 
               and the mail button is added to the toolbar layout .
               we will cahnge this to a subscribe mechanism later
            */
            var alertPref = ytbUtils.getPreference("yahoo.options.showmailalert");                         
            var wm = CC["@mozilla.org/appshell/window-mediator;1"].getService(CI.nsIWindowMediator);
            var enumerator = wm.getEnumerator("");                        
            var mailButtonPresent = false;
            while (enumerator.hasMoreElements() && ! mailButtonPresent) {
                var win = enumerator.getNext();
                mailButtonPresent = win.document.getElementById("yahoo-toolbar-yma_m") && true;                               
            }
            if ((alertPref === true || alertPref === null ) && mailButtonPresent) {
                alertIds += "200,";
            } 
            if (this.domBuilder.bm2Feed) {
                alertIds += "300,";
            }
            url += alertIds;            
            if (alertIds === "") {
                return;
            } 
            var processor = this;
            // Make request
            var iosvc = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
            var channel = iosvc.newChannel(url, 0, null);       
            var channelListener = {
                stream : null,
                alertFeed : "",
                onStartRequest : function(request, context) {
                    this.alertFeed = "";
                },
                onDataAvailable: function(request, context, inputStream, offset, count) {
                    if (! this.stream) {
                        this.stream = CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);
                    }
                    this.stream.init(inputStream);
                    this.alertFeed += this.stream.read(count);
                },
                // Process returned feed
                onStopRequest: function(request, context, statusCode) {
                    try {
                        if (this.stream) {
                            this.stream.close();
                        }
                        request.QueryInterface(CI.nsIHttpChannel);
                        if (this.alertFeed === "" || request.status !== 0) {
                            return;
                        }
                        /* parsing the alert feed and adding values to the hash*/
                        var alertFeed ;
                        // Encode to utf-8
                        if (processor.uniconvert.charset != "utf-8") {
                            this.alertFeed = processor.uniconvert.ConvertToUnicode(this.alertFeed);
                        }                         
                        var haveAlerts = processor.processAlerts(this.alertFeed,processor);                        
                        // Notify toolbar of new alerts
                        if (haveAlerts) {
                            processor.notifier.notifyObservers(null, "yahoo-feed-alerts-updated", processor.domBuilder.alerts.childNodes.length);
                        }
                    } catch(e) {
                    }
                    this.stream = null;                    
                }
            };
            channel.asyncOpen(channelListener, null);
        } catch(e){
        }
    },
    processAlerts :function (alertFeed,processor) {
        // format : 2003
        var foundAlerts = false;    
        // stripping the <html>\n  and the end portion in the feed
        alertFeed = alertFeed.substr(alertFeed.indexOf(">") + 2);
        alertFeed = alertFeed.slice(0,alertFeed.indexOf("<"));            
        var keyValueList = alertFeed.split('');                            
        processor.values.addString("AE_200_1", "0");                                
        for (var idx = 0;idx < keyValueList.length;idx++) {
            var keyValue = keyValueList[idx];                    
            var keyValueArray = keyValue.split('');            
            if(keyValueArray.length > 1) {                
                processor.values.addString("AE_"+keyValueArray[0]+"_1", keyValueArray[1]);                                
                if (keyValueArray[1] !== "") {
                    foundAlerts    = true;
                }
            }
        }                
        if (foundAlerts) {
            var bmts = processor.getHashValue("AE_300_1");
            if (bmts !=  BookmarkManager.getTimestamp(processor.blindYID)) {
                BookmarkManager.loadBM2FromServer(processor.domBuilder,processor.secureKey);
                BookmarkManager.changeTimestamp(processor.blindYID, bmts);
            }
        }
        return foundAlerts;
    },
    processBM2 : function (fresh) {
        fresh = fresh || false;
        if (! this.domBuilder.bm2Feed || this.domBuilder.bm2Feed == "") {
            return false;
        }       
        if (!fresh) {
            if (BookmarkManager.loadBM2FromCache(this.domBuilder,this.secureKey)) {                
               return;
            }                
        } 
         BookmarkManager.changeTimestamp(this.blindYID, "0");   
         /* this will update the timestamp as well as fetch the latest content from server */
         this.retrieveAlerts();
         //BookmarkManager.loadBM2FromServer(this.domBuilder,this.securekey);           
    },
    /***** Following 4 funtions added for YTFF1.5 to redirect the calls to YahooHashtable     *****
     ***** as the get, getString, getValues, getKeys are not exposed. The following functions *****
     ***** just act as a bridge to map the function calls to yahooHashtable.                  *****/
    getHashParam : function(key) {
        if (this.params)
            return this.params.get(key);
    },
    getHashValue : function(key) {
        if (this.values)
            return this.values.getString(key);
    },
    getHashValues : function(key) {
        return this.params.getValues(key);
    },
    getHashKeys : function(key) {
         return this.values.getKeys(key);
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYahooFeedProcessor) && !iid.equals(CI.nsISupports) && !iid.equals(CI.nsIRunnable))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
};
/** 
* DO NOT CHANGE THIS OBJECT 
* @private
*/
function NSGetModule(compMgr, fileSpec) {
    return {
        myCID       : Components.ID("{4138788A-68DF-4cb5-B6F9-E50DE9C70708}"),
        myProgID    : "@yahoo.com/feed/processor;1",
        firstTime   : true,
        registerSelf : function (compMgr, fileSpec, location, type) {
            if (this.firstTime) {
                this.firstTime = false;
                throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
            }
            compMgr = compMgr.QueryInterface(CI.nsIComponentRegistrar);
            compMgr.registerFactoryLocation(this.myCID, "Yahoo! Feed Processor", this.myProgID, fileSpec, location, type);
        },
        getClassObject : function (compMgr, cid, iid) {
            if (!cid.equals(this.myCID)) throw Components.results.NS_ERROR_NO_INTERFACE;
            if (!iid.equals(CI.nsIFactory)) throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            return this.myFactory;
        },
        myFactory : {
            createInstance : function (outer, iid) {
                if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
                return (new YahooFeedProcessor()).QueryInterface(iid);
            }
        },
        canUnload : function(compMgr) { return true; }
    };
}
/**
* @class the yahoo hash table
* stores a list of keys and values
*/
function YahooHashtable() {
    /* REVIEW NOTE: Add all methods to prototype */
    this.values = [];
    this.keys = []; // REVIEW NOTE: remove this (get keys from for-in)
    /**
    * Add an element to the hashtable
    * @param {String} key The hash key
    * @param {nsIYahooFeedNode} value The the node to add to the has
    */
    this.add = function(key, value) {
        if (this.values === null) {
            this.keys = [];
            this.values = [];
        }
        this.values[key] = value;
        this.keys[this.keys.length] = key;
    }
    /**
    * A helper function that adds a string to the hashtable
    * @param {String} key The hash key
    * @param {String} value The hash value
    */
    this.addString = function(key, value) {
        if (this.values === null) {
            this.keys = [];
            this.values = [];
        }
        this.values[key] = value;
        this.keys[this.keys.length] = key;
    }
    /**
    * Clear all the hashtable values
    */
    this.clear = function() {
        // Destroy all nodes
        if (this.values !== null) {
            for (var i = 0, len = this.keys.length; i < len; i++) {
                if (this.values[this.keys[i]] instanceof CI.nsIYahooFeedNode) {
                    this.values[this.keys[i]].destroy();
                }
                this.values[this.keys[i]] = null;
                this.keys[i] = null;
            }
        }
        this.keys = null;
        this.values = null;
    }
    /**
    * Get hash value
    * @param {String} key Key of the hash value to retrieve
    * @returns {nsIYahooFeedNode}
    */
    this.get = function(key) {
        if (this.values != null && typeof(this.values[key]) != 'undefined') {
            return this.values[key];
        }
        return null;
    }
    /**
    * A helper function that the hash value as a string.
    * If the value for the specified key is not a string this returns null
    * @param {String} key Key of the hash value to retrieve
    * @returns String
    */
    this.getString = function(key) {
        if (this.values !== null && typeof(this.values[key]) == "string") {
            return this.values[key];
        }
        return null;
    }
    /**
    * Get an array of all the hash keys
    * @param {Object} count An empty object, i.e {}
    * @returns Array
    */
    this.getKeys = function(count) {
        count.value = 0;
        if (this.keys != null) {
            count.value = this.keys.length;
            return this.keys;
        } else {
            return [];
        }
    }
    // REVIEW NOTE: trash, or pass in keys to retain order
    /**
    * Return just the values without the keys
    * @param {Object} count An empty object, i.e {}
    * @returns Array
    */
    this.getValues = function(count) {
        var out = [];
        var i = 0
        if (this.values != null) {
            for (props in this.values) {
                i++;
                out[out.length] = this.values[props];
            }
        }
        count.value = i;
        return out;
    }
    /**
    * A helper function that returns the string values without the keys
    * @param {Object} count An empty object, i.e {}
    * @returns Array
    */
    this.getStringValues = function(count) {
        var out = [];
        count.value = 0;
        if (this.values != null) {
            for (props in this.values) {
                if (typeof(this.values[props]) == "string") {
                    count.value++;
                    out[out.length] = this.values[props];
                }
            }
        }
        return out;
    }
    /**
    * Get the size of the hashtable
    * @returns int
    */
    this.size = function() {
        return ((this.values != null) ? this.values.length : 0);
    }
    /**
    * Return the hashtable as a string
    * @returns String
    */
    this.toString = function() {
        var out = "";
        if (this.values != null) {
            for (prop in this.values) {
                if (out != "") {
                    out += "&";
                }
                out += prop + " = " + this.values[prop];
            }
        }
        return out;
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////
/// @class Class performs encryption and decryption
///
/// @author  priyav@yahoo-inc.com
/// @date     28 - Mar - 2008
///////////////////////////////////////////////////////////////////////////////////////////////////
function EncryptDecryptAlgo() {
    this.TEAencrypt = function(plaintext, password) {
        if (plaintext.length == 0) return('');  // nothing to encrypt
        // 'escape' plaintext so chars outside ISO-8859-1 work in single-byte packing, but keep
        // spaces as spaces (not '%20') so encrypted text doesn't grow too long (quick & dirty)
        var asciitext = escape(plaintext).replace(/%20/g,' ');
        var v = this.strToLongs(asciitext);  // convert string to array of longs
        if (v.length <= 1) v[1] = 0;  // algorithm doesn't work for n<2 so fudge by adding a null
        var k = this.strToLongs(password.slice(0,16));  // simply convert first 16 chars of password as key
        var n = v.length;
        var z = v[n-1], y = v[0], delta = 0x9E3779B9;
        var mx, e, q = Math.floor(6 + 52/n), sum = 0;
        while (q-- > 0) {  // 6 + 52/n operations gives between 6 & 32 mixes on each word
            sum += delta;
            e = sum>>>2 & 3;
            for (var p = 0; p < n; p++) {
                y = v[(p+1)%n];
                mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
                z = v[p] += mx;
            }
        }
        var ciphertext = this.longsToStr(v);
        return this.escCtrlCh(ciphertext);
    }
// TEAdecrypt: Use Corrected Block TEA to decrypt ciphertext using password
    this.TEAdecrypt = function(ciphertext, password) {
        if (ciphertext.length === 0) return('');
        var v = this.strToLongs(this.unescCtrlCh(ciphertext));
        var k = this.strToLongs(password.slice(0,16));
        var n = v.length;
        var z = v[n-1], y = v[0], delta = 0x9E3779B9;
        var mx, e, q = Math.floor(6 + 52/n), sum = q*delta;
        while (sum !== 0) {
            e = sum>>>2 & 3;
            for (var p = n-1; p >= 0; p--) {
                z = v[p>0 ? p-1 : n-1];
                mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
                y = v[p] -= mx;
            }
            sum -= delta;
        }
        var plaintext = this.longsToStr(v);
        // strip trailing null chars resulting from filling 4-char blocks:
        plaintext = plaintext.replace(/\0+$/,'');
        return unescape(plaintext);
    }
// supporting functions
    this.strToLongs = function(s) {  // convert string to array of longs, each containing 4 chars
        // note chars must be within ISO-8859-1 (with Unicode code-point < 256) to fit 4/long
        var l = new Array(Math.ceil(s.length/4));
        for (var i=0; i<l.length; i++) {
            // note little-endian encoding - endianness is irrelevant as long as
            // it is the same in longsToStr()
            l[i] = s.charCodeAt(i*4) + (s.charCodeAt(i*4+1)<<8) +
                   (s.charCodeAt(i*4+2)<<16) + (s.charCodeAt(i*4+3)<<24);
        }
        return l;  // note running off the end of the string generates nulls since
    }              // bitwise operators treat NaN as 0
    this.longsToStr = function(l) {  // convert array of longs back to string
        var a = new Array(l.length);
        for (var i=0; i<l.length; i++) {
            a[i] = String.fromCharCode(l[i] & 0xFF, l[i]>>>8 & 0xFF,
                                       l[i]>>>16 & 0xFF, l[i]>>>24 & 0xFF);
        }
        return a.join('');  // use Array.join() rather than repeated string appends for efficiency
}
    this.escCtrlCh = function(str) {  // escape control chars etc which might cause problems with encrypted texts
        return str.replace(/[\0\t\n\v\f\r\xa0'"!]/g, function(c) { return '!' + c.charCodeAt(0) + '!'; });
    }
    this.unescCtrlCh = function(str) {  // unescape potentially problematic nulls and control characters
        return str.replace(/!\d\d?\d?!/g, function(c) { return String.fromCharCode(c.slice(1,-1)); });
    }
} //main close brace
/**
*  @class This singleton class handles the Bookark related functions
* -loading bookmarks from server
* -loading bookmarks from cache
* -saving the  encrypted bookmarks
* @constructor
* @author  geldhose@yahoo-inc.com
* @date    19 - May - 2008
*/
var BookmarkManager = {
    /** Reference to the YahooFileIO server.
    @type nsIYahooFileIOPre
    */
    mFileIO : null,
    /** The bookmarks xml downloaded from server.
    @type string
    */
    mBmXml : "",
    /** The bookmarks cache file
    @type nsILocalFile */
    mCacheBM2File : null,
    /** The netscape namespace for RDF service.
    @type string */
    mNC_NS : "http://home.netscape.com/NC-rdf#",
    /** The file Data source required for RDF service
    */
    mFileDataSource : null,
    /** Instance of RDF service
    @type nsIRDFService */    
    mRDF : null,
    /** The Bookmark Timestamp root
    */
    mBMTSRoot : null,
    mUserUrl : null,
    mTsUrl : null,
    /** Status shows whether the instance is currently fetching the content from server
    @type boolean */
    mFetchingFromServer:false,
    /**
    * Adds the bookmark to the Toolbar Dom .We add the DomDcument bookmark xml to the nsIYahooDomBuilder interface
    * after parsing the text received from server . Sends a notification which help the chrome to reload the 
    * bookmark data. The bookmark data is also provided to the Searchindexer service for populating the bookmark data
    */ 
    addBMToToolbar : function(domBuilder) {
        var parser = CC["@mozilla.org/xmlextras/domparser;1"].createInstance(CI.nsIDOMParser);
        try {
            var doc = parser.parseFromString(this.mBmXml, "text/xml");           
            var root = doc.getElementsByTagName("outline");
            var searchIndexer = CC["@yahoo.com/search/indexer;1"].getService(CI.nsIYahooSearchIndexer);
            searchIndexer.loadYahooBookmarkData(doc);
            if (root.length > 0) {
                domBuilder.clearBM2();
                domBuilder.buildBM2(root[0], null);                
                var notifier = CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
                notifier.notifyObservers(null, "yahoo-feed-bookmarks-updated", null);
             }
         } catch(e) {            
         }        
         return true;
    },
    /**
    * loads the bookmarkdata from cache - decrypt it with the secure key, checks for the 
    * correctness of the file 
    *
    * @param   {nsIYahooDomBuilder} domBuilder The secure key obtained from the feed
    * @param   {string} secureKey The secure key for encryption and decryption
    * @author  priyav@yahoo-inc.com
    * @date   28 - 3 - 2008
    */
    loadBM2FromCache : function(domBuilder,secureKey){        
        var stime = (new Date().getTime());                
        try {                        
            var cacheBM2raw = "";
            if (this.mCacheBM2File.exists()) {
                cacheBM2raw = this.mFileIO.readFile(this.mCacheBM2File);                                   
            } else {                
                return false;
            }            
            // Empty cache            
            if (!cacheBM2raw || cacheBM2raw == "") {
                return false;
            }
            var secure = new EncryptDecryptAlgo();
            cacheBM2raw = secure.TEAdecrypt(cacheBM2raw,secureKey);                                
            if ((cacheBM2raw.substr(2,3)) != "xml") {
                return false;
            }                       
            this.mBmXml = cacheBM2raw;                            
            var etime = (new Date().getTime()) - stime;
            return this.addBMToToolbar(domBuilder);    
        } catch(e) {            
            return false
        }              
        return true;
    },
    /**
    * Loads the Bookmark xml from server.Uses the url available in the domBuilder
    * @param {nsIYahooDomBuilder} domBuilder The current toolbar DOM
    * @param {string} secureKey The key needed for encryption after getting the content from server
    *
    * 
    */
    loadBM2FromServer : function(domBuilder,secureKey) { 
        if (! domBuilder  || ! secureKey || ! domBuilder.bm2Feed) {
            return;
        }
        if (this.mFetchingFromServer) {
            return;
        }
        this.mFetchingFromServer = true;
        try {           
            var self = this;
            var bm2url = domBuilder.bm2Feed;
            var str = domBuilder.getBM2UsageString();
            if (str.length > 0) {
                bm2url += "&docids=" + str;
                domBuilder.clearBM2Usage();
            }                                
            yahooDiagnose("Getting bookmarks From:"+bm2url);
            var stime;
            var iosvc = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
            var channel = iosvc.newChannel(bm2url, 0, null);
            var listen = {
                stream : null,
                xml : "",
                onStartRequest : function(request, context) {
                    stime = (new Date().getTime());
                    this.xml = "";
                },
                onDataAvailable : function(request, context, inputStream, offset, count) {
                    if (this.stream == null) {
                        this.stream = CC["@mozilla.org/scriptableinputstream;1"].createInstance(CI.nsIScriptableInputStream);
                    }
                    this.stream.init(inputStream); 
                    this.xml += this.stream.read(count);
                },
                onStopRequest : function(request, context, statusCode) {
                    try{
                        if (this.stream != null) {
                            try{  this.stream.close(); }catch(e){}
                            this.stream = null;
                        }                                           
                        var http = request.QueryInterface(CI.nsIHttpChannel);                                                                                                                        
                        if (this.xml != "" && http.status == 0) {
                            self.mBmXml = this.xml; 
                            /* Adding bookmarks to toolbar */
                            self.addBMToToolbar(domBuilder);
                            /* Caching the downloaded bookmarks (take cared of encryption)*/
                            self.cacheBM2Feed(secureKey);
                            yahooDiagnose("Bookmarks Fetched and Cached");
                        } else {
                            yahooDiagnose("Empty Bookmark feed recieved from bookmark server");                                
                        }                        
                        var etime = (new Date().getTime()) - stime;
                    } catch(e) {                        
                        yahooDiagnose(e);
                    }
                    self.mFetchingFromServer = false;
                }
            };
            /* Initialize fetching data from the server */
            channel.asyncOpen(listen, null);                        
        } catch(e) {            
            this.mFetchingFromServer = false;
            yahooDiagnose(e);
        }        
    },
    /**
    * loads the bookmarkdata from cache - decrypt it with the secure key, checks for the 
    * correctness of the file 
    *
    * @param  {nsILocalFile} cacheDir The user cache dir
    * @author priyav@yahoo-inc.com
    * @date   28 - 3 - 2008
    *
    */
    createBM2CacheFile : function(cacheDir) {
        try {
            this.mCacheBM2File = cacheDir.clone().QueryInterface(CI.nsILocalFile);                   
            this.mCacheBM2File.appendRelativePath("bookmarks");               
        } catch(e) {            
        }
    },
    /**
    * Caches the encrypted bookmark data writes that to the user cache dir in the bookmark file.
    *
    * @param   {securekey} secureKey The secure key obtained from the feed
    * @author  priyav@yahoo-inc.com
    * @date    28 - 3 - 2008
    * 
    */
    cacheBM2Feed : function(secureKey){
        if(this.mBmXml != null && this.mBmXml != "") {     
            try{
                if (this.mCacheBM2File != null) {
                    // Create cache file
                    var secure = new EncryptDecryptAlgo();
                    var ciphertext = secure.TEAencrypt(this.mBmXml,secureKey);                    
                    this.mFileIO.writeFile(this.mCacheBM2File,ciphertext)
                }
            } catch(e) {                 
            } 
        }
    },
    /**
    * The bookmark time stamp for a user is stored in an rdf, we take the decission whether to 
    * reload the bookmarks file from the server based on the stored timestamp .This code 
    * initializes the RDF service and and corresponding URI values for accessing the stored 
    * key and value    
    *   
    * @author  geldhose@yahoo-inc.com
    * @date    19 - May - 2008
    */
    initConfig:function() {
        if (this.mFileDataSource) {
            return;
        }
        function initRDFFile (fileIO) {        
            var cacheDir =  fileIO.getCacheDir();
            var file = cacheDir.clone().QueryInterface(CI.nsILocalFile);
            file.setRelativeDescriptor(cacheDir, "yconfig.rdf");            
            if (!file.exists()) {                
                var data = '<?xml version="1.0"?>\n<RDF:RDF xmlns:NC="http://home.netscape.com/NC-rdf#" '+
                                'xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n</RDF:RDF>';                
                fileIO.writeFile(file,data);
            }   
            return file;
        }
        /* Creating the File URI */  
        var file =  initRDFFile(this.mFileIO);  
        var networkProtocol = CC["@mozilla.org/network/protocol;1?name=file"]. createInstance(CI.nsIFileProtocolHandler);                              
        var fileURI = networkProtocol.newFileURI(file);            
        /* Accessing the file URI */
        var fileDataSource =CC["@mozilla.org/rdf/datasource;1?name=xml-datasource"].createInstance(CI.nsIRDFRemoteDataSource);                
        fileDataSource = fileDataSource.QueryInterface(CI.nsIRDFDataSource);                         
        fileDataSource.Init(fileURI.spec);
        /* Loading the content to RDF */                
        fileDataSource.Refresh(true);    
        this.mRDF = CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);                       
        /* Creating the XML Structure in memory */
        var rdfContainerUtils  = CC["@mozilla.org/rdf/container-utils;1"].getService(CI.nsIRDFContainerUtils);         
        this.mBMTSRoot = this.mRDF.GetResource("NC:BMTS");
        this.mBMTSRoot = rdfContainerUtils.MakeSeq(fileDataSource, this.mBMTSRoot); 
        this.mUserUrl = this.mRDF.GetResource(this.mNC_NS + "User");                
        this.mTsUrl = this.mRDF.GetResource(this.mNC_NS + "Ts");          
        this.mFileDataSource = fileDataSource;
    },    
    /**
    * Changes the bookmark timestamp for a particular blindYID , this function is called when a
    * new bookmark file is fetched from the server after finding a difference in the cached and
    * server timestamp which is obtained as a part of the alerts.
    * 
    * @param  {string} blindyid unique identidier - have a 1 to 1 mapping to userid
    * @param  {string} timeStampValue The new timestamp value
    * @author  geldhose@yahoo-inc.com
    * @date    19 - May - 2008
    */
    changeTimestamp:function(blindYId,tsValue) {        
        tsValue = tsValue || "";
        this.initConfig();        
        var keyLiteral = this.mRDF.GetLiteral(blindYId);          
        var resource = this.mFileDataSource.GetSource(this.mUserUrl, keyLiteral, true);        
        if (resource) {
            var ts = this.mFileDataSource.GetTarget(resource, this.mTsUrl, true);
            if (ts instanceof CI.nsIRDFLiteral) {
                this.mFileDataSource.Change(resource,this.mTsUrl, ts,this.mRDF.GetLiteral(tsValue));    
            }
        } else {
            resource = this.mRDF.GetAnonymousResource();        
            this.mFileDataSource.Assert(resource,this.mUserUrl, keyLiteral, true);
            this.mFileDataSource.Assert(resource,this.mTsUrl, this.mRDF.GetLiteral(tsValue), true);    
            this.mBMTSRoot.AppendElement(resource);                                   
        }
        this.mFileDataSource.Flush();                        
    },
    /**
    * Fetches the timestamp for a particular blindyid            
    * 
    * @param   {string} blindyid 
    * @return  {string} The  timestamp value
    * @author  geldhose@yahoo-inc.com
    * @date    19 - May - 2008
    */
    getTimestamp:function(blindYId) {
        var key = blindYId;
        this.initConfig();
        var keyLiteral = this.mRDF.GetLiteral(key);          
        var resource = this.mFileDataSource.GetSource(this.mUserUrl, keyLiteral, true);
        if (resource) {
            var target = this.mFileDataSource.GetTarget(resource, this.mTsUrl, true);
            if (target instanceof CI.nsIRDFLiteral) {
                return target.Value;
            }
        }
        return null;   
    }
};
