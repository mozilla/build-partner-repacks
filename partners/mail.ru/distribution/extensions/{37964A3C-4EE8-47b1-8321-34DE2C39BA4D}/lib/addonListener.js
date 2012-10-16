function MRAddOnListener(appID) {
    this.debugZone = "MRAddOnListener";
    this.appID = appID;
    this.newTab = '';
    this.mPrefs = new G_Preferences(MRSputnikPrefBase, false, false);  
    this.psvc = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);  
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
    
    this.newTab = this.psvc.getCharPref('browser.newtab.url', '');
    this.psvc.setCharPref('browser.newtab.url', 'about:newtab');
}

MRAddOnListener.prototype.onDisabling = function(addon) {
    if(addon.id != this.appID)
    {
        return;
    }
    
    this.mPrefs.setBoolPref('disabled', true);

    this.newTab = this.psvc.getCharPref('browser.newtab.url', '');
    this.psvc.setCharPref('browser.newtab.url', 'about:newtab');
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
    this.mPrefs.setBoolPref('disabled',false);
    
    if(this.newTab != '') {
        this.psvc.setCharPref('browser.newtab.url', this.newTab);
    }
}

