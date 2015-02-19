Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm")
Components.utils.import("resource://gre/modules/ctypes.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");	
Components.utils.import("resource://gre/modules/FileUtils.jsm");

const C = Components;
const Cc = Components.classes;
const Ci = Components.interfaces;

const aoluk_GUID = "{12e57d18-f8f7-4b76-af63-605365ab88ec}";
const aoluk_DATADIR = "aolukToolbarData";
const aoluk_BRANCHNAME = "aoluk_toolbar.";
const aoluk_XUL_ID = "aoluk_Toolbar";
const aoluk_CHROMEDIR = "chrome://aoluktoolbar";


XPCOMUtils.defineLazyGetter(this, "strings", function() {
    return loadPropertiesFile(aoluk_CHROMEDIR + "/locale/toolbar_props.properties");
});

function loadPropertiesFile(path)
{
    /* HACK: The string bundle cache is cleared on addon shutdown, however it doesn't appear to do so reliably.
       Errors can erratically happen on next load of the same file in certain instances. (at minimum, when strings are added/removed)
       The apparently accepted solution to reliably load new versions is to always create bundles with a unique URL so as to bypass the cache.
       This is accomplished by passing a random number in a parameter after a '?'. (this random ID is otherwise ignored)
       The loaded string bundle is still cached on startup and should still be cleared out of the cache on addon shutdown.
       This just bypasses the built-in cache for repeated loads of the same path so that a newly installed update loads cleanly. */
    return Services.strings.createBundle(aoluk_CHROMEDIR + "/locale/toolbar_props.properties" + "?" + Math.random());
}


function getStrings() {
	    var sbSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		return sbSvc.createBundle(aoluk_CHROMEDIR + "/locale/toolbar_props.properties");	    
}
	
var log = function(msg) {
	Services.console.logStringMessage("aoluktoolbar bootstrap.js: " + msg);
	//Services.prompt.alert(null,"log" , msg);
};

var logError = function(e, message) {
    /*
	Services.prompt.alert(null,"Error" , "aoluktoolbar bootstrap.js: error "
		+ (message ? message : '')
		+ ': "' + e + '"'
		+ (e.fileName ? (' in ' + e.fileName) : '')
		+ (e.lineNumber ? (':' + e.lineNumber) : ''));*/
};

var WindowListener = {
  setupBrowserUI: function(window) {
  try{
		let document = window.document;
		//Services.prompt.alert(null, "Restartless Demo", "setup UI");
		//if exist , remove it
		var toolbar = window.document.getElementById(aoluk_XUL_ID);
		if(toolbar){
			toolbar.parentNode.removeChild(toolbar);
		}
		//create a random time number 0 -1000 to work around overlay sequence issue in Mozilla
		/*
		var number  = Math.floor((Math.random() * 1000) + 1);
		
		var num = 0;	
		var toolbar = window.document.getElementsByTagName("toolbar");
		for (var i = 0; i < toolbar.length; i++) { 
			var id = toolbar[i].getAttribute("id"); 
			if (id.indexOf("_Toolbar") != -1){
				num ++;
			}
		}*/

		aolukUILoader.load(window,aoluk_CHROMEDIR+"/content/aoltoolbar.xul");
		aolukRegisterXPCOMComponent();
		
 	}catch(e){
			logError(e);
	}
  },

  tearDownBrowserUI: function(window) {
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindow);

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
		  domWindow.removeEventListener("load", listener, false);
		  // If this is a browser window then setup its UI
		  if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
			WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function install() {
    AddonManager.getAddonByID(aol_GUID, function(addon) {  
		addon.userDisabled = false;		
    });
}
 
function uninstall(data,reason) {
	if (reason == ADDON_UNINSTALL) {
		aolukUninstall_metrics.uninstall();
		aolukUninstaller.uninstall();	
	}
}
 
function startup(data, reason) {
	var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	var branch = service.getBranch(aoluk_BRANCHNAME);				
	
	if (typeof branch != undefined ){
		if (reason == ADDON_UPGRADE){	
			branch.setBoolPref("firsttime.showwindow", false);
			branch.setBoolPref("bootstrap.upgrade" , true);
		}
		else if (reason == ADDON_INSTALL){
			 branch.clearUserPref("firsttime.showwindow");
			 branch.clearUserPref("upgrade.showwindow");
		}
	}

	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
		   getService(Ci.nsIWindowMediator);
	// Get the list of browser windows already open
	let windows = wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		WindowListener.setupBrowserUI(domWindow);
	}

	// Wait for any new browser windows to open
	wm.addListener(WindowListener); 
}

function shutdown(data, reason) {
try {
		if (reason == APP_SHUTDOWN){
			return;
		}
		

		let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        
        //var strings = getStrings();
		
		if (reason == ADDON_DISABLE  ){
		
			aolukUninstall_metrics.init(data);
			
			var msg = strings.GetStringFromName("uninstall.confirmmessage");
			var title = strings.GetStringFromName("toolbar.name");
			
		    ok = Services.prompt.confirm(null, title, msg  );   

		
			if(!ok){
			    aolukUninstall_metrics.disable("cancel");
				AddonManager.getAddonByID(aoluk_GUID, function(addon) 
				{  
					addon.userDisabled = false;
						//if this is a user uninstall action. cancel uninstall
					if((addon.pendingOperations & AddonManager.PENDING_UNINSTALL) != 0)  {
							addon.cancelUninstall();
					}
				})	
			}
			else{
			    
					// remove overlay from all windows
				var enumerator = Services.wm.getEnumerator("navigator:browser");
				while (enumerator.hasMoreElements()) {
					var window = enumerator.getNext();
					var toolbar = window.document.getElementById(aoluk_XUL_ID);
					toolbar.parentNode.removeChild(toolbar);
				}
				
                aolukUninstaller.showUninstallPage();
	            aolukUninstall_metrics.disable("disable");
				let registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
				if(registrar.isCIDRegistered(aoluk_gS.classID)){
					registrar.unregisterFactory(aoluk_gS.classID, aoluk_gF);
				}
			   
		        wm.removeListener(WindowListener);
			}
		}
  
	} catch (e) {
			logError(e);
	}
}


function loadJavascript(path)
{
	var jsloader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
	jsloader.loadSubScript(path);

}

function aolukRegisterXPCOMComponent(){
	try{			

	var gspath = aoluk_CHROMEDIR+"/content/components/AutoSuggest.js" ;
	gspath = gspath.replace(/\\/g, "\/");
	loadJavascript(gspath);
	
	//regist autosuggest xpcom component
    let registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
	if(!registrar.isContractIDRegistered(aoluk_gS.contractID)){
		registrar.registerFactory(aoluk_gS.classID,aoluk_gS.classDescription, aoluk_gS.contractID,aoluk_gF);
	}
	
	}catch(e){
		logError(e);
	}
}


var aolukUninstall_metrics = function() {
    var _props = "";
    var _version = "";
    var _browser = "";
    var _os = "";
    
    var searchUrl = "";
    var toolbar_event = "";
    
	
	function getBranch() {
		var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return service.getBranch(aoluk_BRANCHNAME);				
	}

     
    function sendRequest(url) {
	     try {
	        var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
            req.open("GET", url, false); 
            req.send(null);
        } catch(e) {
            log("sendRequest ex ["+ e.message +"] "+ url);
        }
	}	
    function stripDashes(str) {
        var i;
        var sd = str.length;
        
        for(i = str.length - 1; i > 0; i--) {
            if(str.substring(i,i+1) == "-") {
                sd = i - 1;
                i-=1;
            } else if(str.substring(i,1) != "-" && str.substring(i,1) != "_") {
                break;
            } 
        }
        return(str.substring(0,sd));        
    }
        
    function formatDate(val) {
        var ret = "20000101";
        var parts = val.split("-");
        if (parts.length == 3) {
            ret = parts[2]+parts[1]+parts[0];
        }
        return ret;
    }
    
    
    function registerSearchMetric(payloadUpdate) {
        var url,
            eventStr,
            payloadName,
            payloadValue,
            metric = payloadUpdate;
      
	    var branch = getBranch();
		
		var installId = branch.getCharPref("search.instd");
		var originalDate = branch.getCharPref("search.oid");
		var currentDate = branch.getCharPref("search.cid");
		var installSource = branch.getCharPref("search.source");
		
		var strings = getStrings();
		var searchUrl =  strings.GetStringFromName("search.metrics");
		searchUrl = searchUrl.replace(/{it}/g, installSource);
		searchUrl = searchUrl.replace(/{mrud}/g, currentDate);
		searchUrl = searchUrl.replace(/{oid}/g,  originalDate);
		searchUrl = searchUrl.replace(/{uuid}/g, installId);  
		
	    var payload_fixed = {};
		payload_fixed.product = "tlb";
		payload_fixed.productName = strings.GetStringFromName("toolbar.id");
		payload_fixed.version = _version;

		var langlocale = strings.GetStringFromName("toolbar.langlocale").toLowerCase().split("-");
		payload_fixed.language = langlocale[0];
		payload_fixed.locale = langlocale[1];		
		payload_fixed.os = _os
		payload_fixed.browser = _browser;

		var val;
		val = branch.getCharPref("install.ncid");		
		payload_fixed.ncid = (val) ? val : '-';
		val = branch.getCharPref("install.distroid");
		payload_fixed.distroID = (val) ? val : '-';
		
        toolbar_event = payload_fixed.product + "_" + 
                    payload_fixed.productName + "_" + 
                    payload_fixed.version + "_" +
                    payload_fixed.ncid + "_" +
                    payload_fixed.os + "_" + 
                    payload_fixed.browser + "_" +
                    payload_fixed.language + "_" +
                    payload_fixed.locale + "_" +
                    payload_fixed.distroID + "_";

        // makes sure it's all lower case and only contains a-z, 0-9, and .
		for(payloadName in metric) {
            if(payloadName !== "invType" && payloadName !== "instd" && payloadName !== "mrud" && payloadName !== "uuid") {
                payloadValue = metric[payloadName];
                if (payloadValue) {
                    payloadValue = payloadValue.toLowerCase();
                    payloadValue = payloadValue.replace(/[^a-z0-9\.]/g,"");
                    metric[payloadName] = payloadValue;
                }
            }
        }
        
        // the compName should not exceed 6 chars
        if(metric.compName.length > 6) {
            metric.compName = metric.compName.substring(0,6);
        }
        
        eventStr =  toolbar_event  +
                    ((metric.component) ? metric.component : 'tlb') + "_" +                        
                    ((metric.compName) ? metric.compName : '-') + "_" +
                    ((metric.actionType) ? metric.actionType : '-') + "_" +
                    ((metric.actionName) ? metric.actionName : '-') + "_" +
                    ((metric.misc1) ? metric.misc1 : '-') + "_" +
                    ((metric.misc2) ? metric.misc2 : '-');
        eventStr = stripDashes(eventStr);
        url = searchUrl.replace(/{event}/g, eventStr); 
        		
        sendRequest(url);
        metric = null;
        log("["+eventStr+"] "+url);            
	}
	
	function recordToolbar(cName, aType, aName, m1, m2) {        
        registerSearchMetric({compName:cName, actionType:aType, actionName:aName, misc1:m1, misc2:m2});        
    }     
	
	return {
	
	    init : function(addon) {
	    
	        try {
	            
	            
	                
	        	    _version = addon.version;
    	        	
    	        	
        	        var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
                    if (windowMediator)  {
                        var win = windowMediator.getMostRecentWindow("navigator:browser");  
        	            var ua =  win.navigator.userAgent;
        	            if ( ua.indexOf('Firefox') != -1) {
                            var versionLocation = ua.indexOf('Firefox') + 8;
                            var versionNumber = ua.substr(versionLocation); 
                            if (versionNumber.indexOf('.')) {
                                versionNumber = versionNumber.substring(0,versionNumber.indexOf('.'));
                            }
                            _browser = "ff" + versionNumber;
                        }
                
                        if (ua.indexOf("Windows NT 5.1") != -1) {
                            _os = "xp";
                        } else if (ua.indexOf("Windows NT 6.0") != -1) {
                            _os = "vi";
                        } else if ( (ua.indexOf("Windows NT 6.1") != -1) || (nav.userAgent.indexOf("Windows NT 7") != -1) ) {
                            _os = "w7";
                        } else if ( (ua.indexOf("Windows NT 6.2") != -1)) {
                            _os = "w8";
                        } else if ( (ua.indexOf("Windows NT 6.3") != -1)) {
                            _os = "w81";
                        } else if (ua.indexOf("Mac OS X") != -1 ) {
                            _os = "ox";
                        } else if (ua.indexOf("Linux") != -1 ) {
                            _os = "lx";
                        }
                   
                }
            } catch(e) {
	            logError(e);
	        }
	    }, 
	    
	    uninstall : function() {	        
	        try {
	           registerSearchMetric({compName:"", actionType:"png", actionName:"complete", component:"uninst"});        
	        } catch(e) {
	            logError(e);
	        }
	        
	    },
	    
	    disable : function(result) {
            try {
                registerSearchMetric({compName:"disabl", actionType:"clk", actionName:result, component:"pmpt"}); 
            } catch(e) {
	            logError(e);;
	        }                
	    }
	}
}();

function _readFile(file) {
    var data = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Components.interfaces.nsIFileInputStream);
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0);
    cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

    let (str = {}) {
      let read = 0;
      do { 
        read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
        data += str.value;
      } while (read != 0);
    }
    cstream.close(); // this closes fstream

    return data;
}




var aolukUninstaller = {
	
	_init : false,
	_state : "",
	_enable:true,
	_hideToolbar:false,
	_addon:null,
	
	update : function()
	{
	    
	    try
        {
            var branch = this.getBranch();
	   		branch.clearUserPref("upgrade.showwindow");
        }
        catch(e)
        {   
            log(e.message);
		}        	
	},
	
	
	uninstall : function()
	{	    
        try
        {
		    var strings = getStrings();
            this.resetSetting();
		    
				           
            // remove the user agent if we set one
            var id = strings.GetStringFromName("ua.id");
            if (id != "")
            {
                var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
                if (service)
                {
                    var general = service.getBranch("general.");			
                    if (general)
                    {
                        var suffix = id.toLowerCase();
                        general.deleteBranch("useragent.extra."+suffix, id); 
                    }        
                }
            }

            // delete data directory
            var dir = Components.classes["@mozilla.org/file/directory_service;1"]
							.getService(Components.interfaces.nsIProperties)
							.get("ProfD", Components.interfaces.nsIFile);
            dir.append(aoluk_DATADIR);
            if (dir.exists() && dir.isDirectory()) 
            {   
                dir.remove(true);
            }  
			
            var name = strings.GetStringFromName("toolbar.name");
			/*
			var wrk = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance(Components.interfaces.nsIWindowsRegKey);
			wrk.open(wrk.ROOT_KEY_CURRENT_USER,"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" ,wrk.ACCESS_ALL );
			if (wrk.hasChild(name))
			{
				
				var subkey = wrk.openChild(name, wrk.ACCESS_ALL);
				
				if(!subkey.hasValue("UninstallString")){
				 subkey.close();
				 wrk.removeChild(name);
				}
			}
			wrk.close();*/
        }
        catch(e)
        {   
            logError(e);
			
		}        
					
        this.getBranch().deleteBranch("");
        		
	},
	
	
	getStrings : function()
	{
	   return getPropertyValue();
	    
	},
	
	getBranch : function()
	{
		var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return service.getBranch(aoluk_BRANCHNAME);				
	},
	
	getBaseDomain:function(url) {
		try{
			if(url == null || url.length == 0)
				return "";
			var doubleslash = url.indexOf("//");
			if(doubleslash == -1)
				doubleslash = 0;
			else
				doubleslash += 2;
			var end = url.indexOf('/', doubleslash);
			end = end >= 0 ? end : url.length;
			var host = url.substring(doubleslash, end);
			var startIndex = 0;
			var nextIndex = host.indexOf('.');
			var lastIndex = host.lastIndexOf('.');
			while (nextIndex < lastIndex) {
				startIndex = nextIndex + 1;
				nextIndex = host.indexOf('.', startIndex);
			}
			if (startIndex > 0) {
				return host.substring(startIndex);
			} else {
				return host;
			}
		}catch(e){
		
		}
	},
	
	getUninstallUrl : function()
	{
	    var uninstallUrl;
	    try
	    {	    
            var branch = this.getBranch();
	        var strings = getStrings();	    
    	    	        
            var partner = strings.GetStringFromName("toolbar.partner");
			
            var brand = strings.GetStringFromName("toolbar.brand");
            var langlocale = strings.GetStringFromName("toolbar.langlocale");
	 	    var name = strings.GetStringFromName("toolbar.name");
    	 	log(name);	
	 	    var source;
	 	    if (branch.prefHasUserValue("search.source"))						
		    {
                source = branch.getCharPref("search.source");							
            }
		    else
		    {
			    source = strings.GetStringFromName("toolbar.source");
		    }
    		
			log(source);
		    var iid = "";
		    if (branch.prefHasUserValue("search.instd"))						
		    {
			    iid = branch.getCharPref("search.instd");							
		    }
    	 	log(iid);				   
            var dd = branch.getCharPref("metrics.originalDate");
            if (dd <10) dd = "0" + dd ;
            var mm = branch.getCharPref("metrics.originalMonth");
            if (mm <10) mm = "0" + mm;
            var yy = branch.getCharPref("metrics.originalYear");
            var insDate = dd + "-"+ mm + "-" + yy;
    						
            // check for a custom uninstall url			
            var customUrl = strings.GetStringFromName("uninstall.url.custom");					    
            
			if (customUrl)
		    {
			    uninstallUrl = customUrl;
		    }
		    else
		    {
			    uninstallUrl = strings.GetStringFromName("uninstall.url.default");
                if (uninstallUrl) {
				var type = strings.GetStringFromName("uninstall.type");	
			 
				 if(type =="overlay"){
				 
						var searchService = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);	
							// grab the curent engine in case we have to reset it
						var currentEngine = searchService.currentEngine;
						var tempprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);	
						var currenthp = tempprefs.getCharPref("browser.startup.homepage");	// 
						var hp=this.getBaseDomain(currenthp);
						if(hp==""){
							hp="about:blank";
						}
					
						uninstallUrl +="&hp="+hp+"&srch="+currentEngine.name;
				}
		    }
		    }
            if (uninstallUrl) {
		    uninstallUrl = uninstallUrl.replace(/%source/g , source);
		    uninstallUrl = uninstallUrl.replace(/%date/g , insDate);
		    uninstallUrl = uninstallUrl.replace(/%uid/g , iid);
		    uninstallUrl = uninstallUrl.replace(/%l/g , langlocale);
		    uninstallUrl = uninstallUrl.replace(/%title/g , name);
		    uninstallUrl = uninstallUrl.replace(/%brand/g , brand);
		    uninstallUrl = uninstallUrl.replace(/%browser/g , "ff");
		}
		}
		catch(e)
		{
		    logError(e);
		}
		return uninstallUrl;
	},
	
	resetSetting :  function() {
	 try
	    {	    
            var branch = this.getBranch();
	 	    var installset,protectionset,hostflag;
			var presetSearch, presetHomepage, presetNewTab;
			
    	    var tempprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	        var strings = getStrings();
            var tb_searchlabel = strings.GetStringFromName("searchengine.label");
			log(tb_searchlabel);
			var tb_newtab, tb_homepage;
			if (branch.prefHasUserValue("install.homepage")){
				tb_homepage = branch.getCharPref("install.homepage");
			}
			
			if (branch.prefHasUserValue("install.newtab")){
				tb_newtab = branch.getCharPref("install.newtab");
			}
			
			hostflag = branch.getCharPref("uninstallreset");
			
			presetHomepage ="";
			if (branch.prefHasUserValue("presethomepage")){
				presetHomepage = branch.getCharPref("presethomepage");
			}
			presetSearch="";
			if (branch.prefHasUserValue("presetsearch")){
				presetSearch = branch.getCharPref("presetsearch");
			}
			
			presetNewTab ="";
			if (branch.prefHasUserValue("presetnewtab")){
				presetNewTab = branch.getCharPref("presetnewtab");
			}
			if(presetNewTab == "") {
				presetNewTab = "about:newtab";
			}
			
log(presetNewTab);
			if( presetSearch != tb_searchlabel ){
			
				installset = 0;
				if (branch.prefHasUserValue("install.setsearch")){
					installset = branch.getCharPref("install.setsearch");
				}
				
				protectionset = 0;
				if (branch.prefHasUserValue("searchprotection.set")){
					protectionset = branch.getCharPref("searchprotection.set");
				}
				
				
				log( "search setting :install.set =" + installset + " prot set="  + protectionset + " hostflag=" + hostflag);
				if (( installset & hostflag) || (protectionset & hostflag)){
					var searchService = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);	
					// grab the curent engine in case we have to reset it
					var currentEngine = searchService.currentEngine;
					
					
					if (currentEngine.name == tb_searchlabel){   
						searchService.removeEngine(currentEngine);
						
					}
					else{
					   //just leave it there in the list
					   // var engine = searchService.getEngineByName(tb_searchlabel);
						//if (engine != null)
						//{
						//	searchService.removeEngine(engine);     
						//}
					}
					
					var url = tempprefs.getCharPref("keyword.URL"); 
					var defaulturl;
					if(tempprefs.prefHasUserValue("browser.search.defaulturl")){
							defaulturl = tempprefs.getCharPref("browser.search.defaulturl");
					}
					
					if( defaulturl.indexOf("aoluk") != -1){
						tempprefs.deleteBranch("browser.search.defaulturl");
						tempprefs.deleteBranch("browser.search.defaultenginename");
						
					}
				}
			}
			
			
			if( tb_homepage.indexOf(presetHomepage) == -1 ){
				installset = 0;
				if (branch.prefHasUserValue("install.sethomepage")){
					installset = branch.getCharPref("install.sethomepage");
				}
				
				
				protectionset = 0;
				if (branch.prefHasUserValue("homepageprotection.set")){
					protectionset = branch.getCharPref("homepageprotection.set");
				}
				
				
				if (( installset & hostflag) || (protectionset & hostflag)){
					
					var currenthp = tempprefs.getCharPref("browser.startup.homepage");
			
					var hp=this.getBaseDomain(tb_homepage);
					if( currenthp.indexOf(hp) != -1){
					   log("resetSetting set homepage = " +currenthp  );
					   tempprefs.setCharPref("browser.startup.homepage", "");
					}
				}	
			}
			if( tb_newtab.indexOf(presetNewTab) == -1 ){
				installset = 0;
				if (branch.prefHasUserValue("install.setnewtab")){
					installset = branch.getCharPref("install.setnewtab");
				}
				
				 log("resetSetting set newtab" + "; installset=" + installset + "; hostflag=" + hostflag );
				
				if (( installset & hostflag)){
					var current_newtab = tempprefs.getCharPref("browser.newtab.url");
					var taburl = this.getBaseDomain(tb_newtab);
					log("resetSetting set newtab, current_newtab = " +current_newtab + "; tb_newtab=" + tb_newtab );
					if (current_newtab.indexOf(taburl) != -1) {
						log("resetSetting set newtab = " +current_newtab  );
						tempprefs.setCharPref("browser.newtab.url", "about:newtab");
					}
				}	
			}		
		   
		}
		catch(e)
		{
		    logError(e);
		}
	
	},
	
	stripParam: function(url, param) {
		if (typeof url === "undefined" || url ===null) {
			return "";
		} else if (typeof param === "undefined" || param === null || param === "") {
			return url;
		} else {
			var pos_end = url.indexOf(param);
			pos_end = pos_end > 0 ? pos_end: url.length;
			return url.substring(0, pos_end);
		}
	},
	
    showUninstallPage : function() {
	     try {
            var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
            if (windowMediator) {
                var win = windowMediator.getMostRecentWindow("navigator:browser");
                if (win) {
                        var mainWindow = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIWebNavigation)
                       .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                       .rootTreeItem
                       .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIDOMWindow);
   	
                    var uri = this.getUninstallUrl();
                    if (uri)  {
						mainWindow.gBrowser.addTab(uri); 					
					}
			    }
		    }		    		    
        } catch(e) {
		    logError(e);
		}		    
	}
    	
};

var aolukUILoader = (function() {
	var ajaxRequest = function(url, cb) {
		var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
			.createInstance(Components.interfaces.nsIXMLHttpRequest);
		req.open("get", url, true);
		try {
			req.responseType = "document";
		} catch(e) {
			req.overrideMimeType('text/xml; charset=utf-8');
		}
		req.addEventListener('load', function(event) {
			cb(req.responseXML);
		}, false);
		req.send();
	};

	var inheritAttributes = function(newNode, oldNode) {
		var attributes = oldNode.attributes,
			i;

		// Iterate over attributes
		for (i = 0; i < attributes.length; i++) {
			var attr = attributes.item(i);

			if (attr.namespaceURI) {
				newNode.setAttributeNS(attr.namespaceURI, attr.localName, attr.value);
			} else {
				newNode.setAttribute(attr.localName, attr.value);
			}
		}
	};

	var loadChildren = function(rootElement, childNodes, doc) {
		var i,
			node,
			newNode,
			winEl;

		if (!childNodes.length) {
			return;
		}

		for (i = 0; i < childNodes.length; i++) {
			node = childNodes[i];

			if ('getAttribute' in node && node.getAttribute('id') &&
				(winEl = doc.getElementById(node.getAttribute('id'))))
			{
				inheritAttributes(winEl, node);
				loadChildren(winEl, node.childNodes, doc);
			} else {
				switch(node.nodeType) {
					case node.ELEMENT_NODE:
				
						if (node.localName === 'script') {
						
							var src = node.getAttribute('src');
							try {
								Services.scriptloader.loadSubScript(src, doc.defaultView);
							} catch (e) {
								logError(e, "loading scrip");
							}
							break;
						}

						
						newNode = node.cloneNode(false);

						
						loadChildren(newNode, node.childNodes, doc);

						
						rootElement.appendChild(newNode);
						break;
					case node.TEXT_NODE:
						// What are those text nodes without any value ?
						if (!node.value) {
							break;
						}

						// Creating same text node
						newNode = doc.createTextNode(node.value);

						// Append my node
						rootElement.appendChild(newNode);
						break;
					default:
						log("Do not know what to do with " + node);
						break;
				}
			}
		}
	};

	var render = function(window, xmlDocument, callback) {
		callback = callback || function() {};

		try {
			var i,
				document = window.document,
				documentElement = document.documentElement,
				node;

			for (i = 0; i < xmlDocument.childNodes.length; i++) {
				node = xmlDocument.childNodes[i];

				if (node.nodeType === 1) {
					loadChildren(documentElement, node.childNodes, document);
				} else {
				    try{
						document.insertBefore(node.cloneNode(true), documentElement);
					}catch(e){
					}
				}
			}

			callback();

		} catch(e) {
			logError(e, "rendering overlay");
		}
	};

	return {
		load: function(window, url, callback) {
			ajaxRequest(url, function(xmlDocument) {
				render(window, xmlDocument, callback);
			});
		}
	};
}());
