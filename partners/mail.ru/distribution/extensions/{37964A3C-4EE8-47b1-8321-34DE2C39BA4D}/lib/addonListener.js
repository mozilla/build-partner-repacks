function MRAddOnListener(appID) {
    this.debugZone = "MRAddOnListener";
    this.appID = appID;
    this.mPrefs = new G_Preferences(MRSputnikPrefBase, false, false);        
};

MRAddOnListener.prototype.init = function() {
    try {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.addAddonListener(this);
    }
    catch (ex) 
    {
        G_Debug(this, "init exception");
    
    }

}

MRAddOnListener.prototype.onUninstalling = function(addon) {
    if(addon.id != this.appID)
    {
        return;
    }
	this.mPrefs.setPref('version','uninstalled');
}

MRAddOnListener.prototype.onInstalling = function(addon) {
    if(addon.id != this.appID)
    {
        return;
    }
	this.mPrefs.setPref('version','upgrade');
}

MRAddOnListener.prototype.onOperationCancelled = function(addon) {
    if(addon.id != this.appID)
    {
        return;
    }
	this.mPrefs.setPref('version',MRVersion);
}

