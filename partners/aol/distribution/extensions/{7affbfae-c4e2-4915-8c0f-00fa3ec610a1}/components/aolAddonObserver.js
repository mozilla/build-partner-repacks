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

aolAddonObserver.prototype = 
{
	
	_init : false,
	_state : "",
	
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
	
	uninstalling : function()
	{   
	    this.log('uninstalling');
	    this._state = "uninstalling";	
	    this.showUninstallPage();		
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
            if (this.isSelf(addon.id)) this.observer.uninstalling();            
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
	
	showUninstallPage : function()
	{
	    try
	    {
	        var window = null;
		    var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		    if (windowMediator) 
		    {
			    window = windowMediator.getMostRecentWindow("navigator:browser");
			    if (window)
			    {
			        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
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
		catch(e)
		{
		    this.log(e.message);
		}		    
	}
    	
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);

