/***********************************************************
constants
***********************************************************/
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
// reference to the interface defined in nsIUninstallObserver.idl
const nsIaoldeUninstallObserver = Components.interfaces.nsIaoldeUninstallObserver;
// reference to the required base interface that all components must support
const nsISupports = Components.interfaces.nsISupports;
// UUID uniquely identifying our component
const CLASS_ID = Components.ID("{f365c8e6-b0eb-4432-9fed-98ad07516a65}");
// description
const CLASS_NAME = "aolde Uninstall Observer";
// textual unique identifier
const CONTRACT_ID = "@toolbar.aol.com/aoldeuninstallobserver;1";
const UNINSTALL_BRAND = "aolde";
const UNINSTALL_LANGLOCALE = "de-DE";
const UNINSTALL_TITLE = "Custom Firefox DE Toolbar";
const UNINSTALL_SOURCE = "aolde-ff";
/***********************************************************
class definition
***********************************************************/
//class constructor
function aoldeUninstallObserver() {
};
// class definition
aoldeUninstallObserver.prototype = {
  
	classDescription: CLASS_NAME,  
	classID: CLASS_ID,  
	contractID: CONTRACT_ID,
	_uninstall: false,
	_chromeDir: null,
	_iid : "",
	_source : "",
	
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIaoldeUninstallObserver]),
  
	// define the function we want to expose in our interface
	register: function() 
	{
		
    
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(this, "em-action-requested", false);
		observerService.addObserver(this, "quit-application-granted", false);
		this._chromeDir = "chrome://aoldetoolbar/";
	
       	        
	},
	
	deregister: function() 
	{
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.removeObserver(this,"em-action-requested");
		observerService.removeObserver(this,"quit-application-granted");
	},
	
	observe: function(subject,topic,data)
	{		
		var browser = null;
		var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		if (windowMediator) 
		{
			browser = windowMediator.getMostRecentWindow("navigator:browser");
		}
    
			//Get Strings
		var _strings = null;
		try
		{
			var sbSvc = Components.classes["@mozilla.org/intl/stringbundle;1"]
				.getService(Components.interfaces.nsIStringBundleService);
			_strings = sbSvc.createBundle(this._chromeDir+"locale/toolbar_props.properties");	    
		}
		catch(e)
		{
			browser.alert(_strings.GetStringFromName(e));        	
		}
    
		//Get Prefs
		var brandName = _strings.GetStringFromName("prefs.branch") + "." ;
        var service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		var branch = service.getBranch(brandName);			
		
		if (this._source == "")
		{
			if (branch.prefHasUserValue("search.source"))						
			{
				this._source = branch.getCharPref("search.source");							
			}
			else
			{
				this._source = UNINSTALL_SOURCE;
			}
		}
		if (this._iid == "")
		{
			if (branch.prefHasUserValue("search.instd"))						
			{
				this._iid = branch.getCharPref("search.instd");							
			}
		}	
		
		if (topic == "em-action-requested") 
		{
			var name = _strings.GetStringFromName("toolbar.name");
			subject = subject.QueryInterface(Components.interfaces.nsIUpdateItem);
		
			if (subject.name == name)
			{				
				if (data == "item-uninstalled") 
				{
					this._uninstall = true;
					//notify of restart
					try
					{
					    // remove the user agent if we set one
                        var id = _strings.GetStringFromName("ua.id");
                        if (id != "")
                        {
                            var general = service.getBranch("general.");			
                            if (general)
                            {
                                var suffix = id.toLowerCase();
                                general.deleteBranch("useragent.extra."+suffix, id); 
                            }        
                        }
                     
					    //create an iframe to report uninstall data 
						var dd = branch.getCharPref("metrics.originalDate");
						if (dd <10) dd = "0" + dd ;
						var mm = branch.getCharPref("metrics.originalMonth");
						if (mm <10) mm = "0" + mm;
						var yy = branch.getCharPref("metrics.originalYear");
						var insDate = dd + "-"+ mm + "-" + yy;
						
						// check for a custom uninstall url
						
						var customUrl = _strings.GetStringFromName("uninstall.url.custom");
					    var uninstallUrl;
					    
						if (customUrl != "")
						{
							uninstallUrl = customUrl;
						}
						else
						{
							uninstallUrl = _strings.GetStringFromName("uninstall.url.default");
						}
						uninstallUrl = uninstallUrl.replace(/%source/g , this._source);
						uninstallUrl = uninstallUrl.replace(/%date/g , insDate);
						uninstallUrl = uninstallUrl.replace(/%uid/g , this._iid);
						uninstallUrl = uninstallUrl.replace(/%l/g , UNINSTALL_LANGLOCALE);
						uninstallUrl = uninstallUrl.replace(/%title/g , UNINSTALL_TITLE);
						uninstallUrl = uninstallUrl.replace(/%brand/g , UNINSTALL_BRAND);
						uninstallUrl = uninstallUrl.replace(/%browser/g , "ff");
						
						browser._content.document.location = uninstallUrl;
                        //try to delete the entry when uninstall
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
						var date = new Date(); 
						branch.setCharPref("uninstall.error", date + " " + e.message);
					}
				} 
				else if(data == "item-upgraded")
				{
					branch.clearUserPref("upgrade.showwindow");
					branch.setCharPref("install.lastVersion.refresh", aolGetInstallInfo("version"));
					branch.setCharPref("install.lastName.refresh", aolGetInstallInfo("name"));
				}
				else if (data == "item-cancel-action") 
				{
					this._uninstall = false;
				}   																				
			}
		}		
		else if (topic == "quit-application-granted") 
		{
			if (this._uninstall) 
			{
				// delete data directory
    			try
    			{
					var dir = Components.classes["@mozilla.org/file/directory_service;1"]
							.getService(Components.interfaces.nsIProperties)
							.get("ProfD", Components.interfaces.nsIFile);
					dir.append(_strings.GetStringFromName("toolbar.directory"));
					if( dir.exists() && dir.isDirectory() ) 
					{   
						dir.remove(true);
					}
				}catch(e){   
					branch.setCharPref("uninstall.error", e);
				}        	
		    
				// delete all prefs
				branch.deleteBranch("");
			  			 
			}
	    }
	},  
	
	QueryInterface: function(aIID)
	{
		if (!aIID.equals(nsIaoldeUninstallObserver) && !aIID.equals(nsISupports))
		{
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
};
var components = [aoldeUninstallObserver];
if ("generateNSGetFactory" in XPCOMUtils) {
	var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);  // Firefox 4.0 and higher
} else {
	var NSGetModule = XPCOMUtils.generateNSGetModule(components);    // Firefox 3.x
