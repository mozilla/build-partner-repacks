Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

const PROPS = "chrome://aoltoolbar/locale/toolbar_props.properties";

const CLASS_ID = Components.ID("{cdcc6170-e19b-46a0-b3d1-4b66e348a538}");
const CLASS_NAME = "aol Addon Observer";
const CONTRACT_ID = "@toolbar.aol.com/aoladdonobserver;1";
const TOOLBAR_ID =  "{7affbfae-c4e2-4915-8c0f-00fa3ec610a1}";
var components = [aolAddonObserver];

function aolAddonObserver() {
    this.wrappedJSObject = this;  
}



var uninstall_metrics = function() {

    var _props = "";
    var _version = "";
    var _browser = "";
    var _os = "";
    
    var searchUrl = "";
    var toolbar_event = "";

    
	function getStrings() {
	    var sbSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		return sbSvc.createBundle(_props);	    
	}
	
	function getBranch() {
	    var strings = getStrings(); 
		var brandName = strings.GetStringFromName("prefs.branch") + "." ;
		var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return service.getBranch(brandName);				
	}
	
	
    function log(msg) {
    
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(msg);
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
		var strings = getStrings();
		
		var installId = branch.getCharPref("search.instd");
		var originalDate = branch.getCharPref("search.oid");
		var currentDate = branch.getCharPref("search.cid");
		var installSource = branch.getCharPref("search.source");
		
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
	
	    init : function(addon, props) {
	    
	        try {
	            
	            if (!_props.length) {
	                _props = props;
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
                        } else if (ua.indexOf("Mac OS X") != -1 ) {
                            _os = "ox";
                        } else if (ua.indexOf("Linux") != -1 ) {
                            _os = "lx";
                        }
                    }
                }
            } catch(e) {
	            log(e.message);
	        }
	    }, 
	    
	    uninstall : function() {	        
	        try {
	           registerSearchMetric({compName:"", actionType:"png", actionName:"complete", component:"uninst"});        
	        } catch(e) {
	            log(e.message);
	        }
	        
	    },
	    
	    disable : function(result) {
            try {
                registerSearchMetric({compName:"disabl", actionType:"clk", actionName:result, component:"pmpt"}); 
            } catch(e) {
	            log(e.message);
	        }                
	    }
	}
}();

aolAddonObserver.prototype = {
	
	_init : false,
	_state : "",
	_enable:true,
	_chromeDir:'',
	_hideToolbar:false,
	_addon:null,
	
    classDescription : CLASS_NAME,
    contractID : CONTRACT_ID,
	classID : CLASS_ID,
   	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver]),
    
    log : function(msg)
    {
        //var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
        //consoleService.logStringMessage(msg);
    },
    
    uninit : function()
	{
	    this.check();	    
	    AddonManager.removeAddonListener(this.addonListener);
	},
	
    init : function()
	{
	    this.log('init');
	    if (!this._init)
	    {
	        this._init = true;			        
	        try
		    {			
	            // register for the shutdown notification
	    	    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		        observerService.addObserver(this, "quit-application-granted", false);
			
		        // create the addon listener
			    AddonManager.addAddonListener(this.addonListener.init(this, TOOLBAR_ID));
				this._chromeDir = "chrome://aoltoolbar/";
			}
		    catch(e)
		    {
    		    this.log(e.message);    		    
		    }			    
    	}		
	},
	
	observe: function(subject,topic,data)
	{		
        if (topic == "profile-after-change") 
		{
		    this.init();
		}
		else if (topic == "quit-application-granted") 
		{
		   this.uninit();
		}
	},
	
	check : function()
	{
	    if (this._state == "uninstalling")
	    {
	        this.uninstall();
	    }
	    else if ((this._state == "installing") || (this._state == "install"))
	    {
	        this.update();
	    }
	},
	
	update : function()
	{
	    this.log("update");
	    
	    try
        {
            var branch = this.getBranch();
	   		branch.clearUserPref("upgrade.showwindow");
        }
        catch(e)
        {   
            this.log(e.message);
		}        	
	},
	
	
	uninstall : function()
	{	    
        try
        {
        
            
            uninstall_metrics.init(this._addon, PROPS);
            uninstall_metrics.uninstall();
        
            var strings = this.getStrings();	           
        
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
            dir.append(strings.GetStringFromName("toolbar.directory"));
            if (dir.exists() && dir.isDirectory()) 
            {   
                dir.remove(true);
            }                        
            var name = this.getStrings().GetStringFromName("toolbar.name");

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
			wrk.close();
        }
        catch(e)
        {   
            this.log("uninstall.error: " + e.message);
		}        
					
        // delete all prefs
        this.getBranch().deleteBranch("");                                 
	},
	
	disabling:function(addon)
	{
	    this.log('disabling');
		this._addon = addon;
	    this._state = "Disable";	
	    this.showUninstallPage(addon, false);
	},
	
	
	uninstalling : function(addon)
	{   
	    this.log('uninstalling');
		this._addon = addon;
	    this._state = "uninstalling";	
	    this.showUninstallPage(addon, true);		
	},
	
    installing : function()
	{   
	    this.log('installing');
	    this._state = "installing";	   	    
	},
	
	install : function()
	{   
	    this.log('install');
	    this._state = "install";	   	    
	},
	
	cancel : function()
	{
	    this.log('cancel');
	    this._state = "";
	},
		
	addonListener : {
	
	    observer : null,
	    addonId : "",
	    
	    isSelf : function(aid)
	    {
	        this.observer.log(aid +" ==  " + this.addonId);
	        return (aid == this.addonId);
	    },
	    init : function(o, i)
	    {   
	        this.observer = o;
	        this.addonId = i;
	        return this;
	    },
	    
	    onDisabling : function(addon, needsRestart)
	    {
	        this.observer.log('onDisabling:' + addon.name);
			if (this.isSelf(addon.id)) this.observer.disabling(addon);  
	    },
	    
        onDisabled : function(addon)
        {
            this.observer.log('onDisabled:' + addon.name);
        },
        
        onEnabling : function(addon, needsRestart)
	    {
	        this.observer.log('onEnabling:' + addon.name);
	    },
	    
        onEnabled : function(addon)
        {
            this.observer.log('onEnabled:' + addon.name);
        },
        
        onOperationCancelled : function(addon, needsRestart)
        {
            this.observer.log('onOperationCancelled:' + addon.name);
            if (this.isSelf(addon.id)) this.observer.cancel();            
        },
        
        onInstalling : function(addon, needsRestart)
        {
            this.observer.log('onInstalling:' + addon.name);
            if (this.isSelf(addon.id)) this.observer.installing(); 
        },
                
        onInstalled : function(addon)
        {
            this.observer.log('onInstalled:' + addon.name);
            if (this.isSelf(addon.id)) this.observer.install();  
        },
        
        onUninstalling : function(addon, needsRestart)
        {
            this.observer.log('onUninstalling:' + addon.name);
            if (this.isSelf(addon.id)) this.observer.uninstalling(addon);            
        },
        
        onUninstalled : function(addon)
        {
            this.observer.log('onUninstalled:' + addon.name);
            if (this.isSelf(addon.id)) this.observer.uninstall();            
        }
	},
	
	getStrings : function()
	{
	    var sbSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		return sbSvc.createBundle(PROPS);	    
	},
	
	getBranch : function()
	{
	    var strings = this.getStrings(); 
		var brandName = strings.GetStringFromName("prefs.branch") + "." ;
		var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		return service.getBranch(brandName);				
	},
	
	getUninstallUrl : function()
	{
	    var uninstallUrl = "";
	    try
	    {	    
            var branch = this.getBranch();
	        var strings = this.getStrings();	
    	    	        
            var partner = strings.GetStringFromName("toolbar.partner");
            var brand = strings.GetStringFromName("toolbar.brand");
            var langlocale = strings.GetStringFromName("toolbar.langlocale");
	 	    var name = strings.GetStringFromName("toolbar.name");
    	 	
	 	    var source;
	 	    if (branch.prefHasUserValue("search.source"))						
		    {
                source = branch.getCharPref("search.source");							
            }
		    else
		    {
			    source = strings.GetStringFromName("toolbar.source");
		    }
    		
		    var iid = "";
		    if (branch.prefHasUserValue("search.instd"))						
		    {
			    iid = branch.getCharPref("search.instd");							
		    }
    	 					   
            var dd = branch.getCharPref("metrics.originalDate");
            if (dd <10) dd = "0" + dd ;
            var mm = branch.getCharPref("metrics.originalMonth");
            if (mm <10) mm = "0" + mm;
            var yy = branch.getCharPref("metrics.originalYear");
            var insDate = dd + "-"+ mm + "-" + yy;
    						
            // check for a custom uninstall url
    						
            var customUrl = strings.GetStringFromName("uninstall.url.custom");					    
            if (customUrl != "")
		    {
			    uninstallUrl = customUrl;
		    }
		    else
		    {
			    uninstallUrl = strings.GetStringFromName("uninstall.url.default");
		    }
		    uninstallUrl = uninstallUrl.replace(/%source/g , source);
		    uninstallUrl = uninstallUrl.replace(/%date/g , insDate);
		    uninstallUrl = uninstallUrl.replace(/%uid/g , iid);
		    uninstallUrl = uninstallUrl.replace(/%l/g , langlocale);
		    uninstallUrl = uninstallUrl.replace(/%title/g , name);
		    uninstallUrl = uninstallUrl.replace(/%brand/g , brand);
		    uninstallUrl = uninstallUrl.replace(/%browser/g , "ff");
		}
		catch(e)
		{
		    this.log(e.message);
		}
		this.log(uninstallUrl);
		return uninstallUrl;
	},
	
	
    showUninstallPage : function(addon, uninstalling) {
	     try {
            var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
            if (windowMediator) {
                var win = windowMediator.getMostRecentWindow("navigator:browser");
                if (win) {
	
                    uninstall_metrics.init(addon, PROPS);

				var branch = this.getBranch();
				var strings = this.getStrings();	

				var xul_id = strings.GetStringFromName("toolbar.xul.id");
                    var tb = win.document.getElementById(xul_id);
				    var path= this._chromeDir + "content/enableBox.xul";
                    win.openDialog(path, "aol", "modal,centerscreen,titlebar=no", this);
					
					    if(this._enable){
					
							addon.userDisabled = false;
							//if this is a user uninstall action. cancel uninstall
                        if((addon.pendingOperations & AddonManager.PENDING_UNINSTALL) != 0)  {
								addon.cancelUninstall();
                        }


							if(tb && this._hideToolbar){
								tb.collapsed = true;
                            uninstall_metrics.disable("hide");	
                        } else {
                            uninstall_metrics.disable("cancel");	
						}
						
                    } else {  //if uninstall , show uninstall url  
                        uninstall_metrics.disable(uninstalling ? "remove" : "disable");	
                        var mainWindow = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIWebNavigation)
                       .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                       .rootTreeItem
                       .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIDOMWindow);

                    var uri = this.getUninstallUrl();
                    mainWindow.gBrowser.addTab(uri);                    
			    }
			    }
		    }		    
        } catch(e) {
		    this.log(e.message);
		}		    
	}
    	
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);

