var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.WindowHelper = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.WindowHelper",
	VERSION: "0.1"
});

FoxcubService.WindowHelper.prototype.$constructor = function(branchStr) {

}

FoxcubService.WindowHelper.prototype.getWin = function() {
	return Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
}
FoxcubService.WindowHelper.prototype.getBrowser = function() {
	return this.getWin().gBrowser;
}
FoxcubService.WindowHelper.prototype.addTab = function(url,select) {
	var tbrowser = this.getBrowser();
	var newtab = tbrowser.addTab(url);
	if(select)tbrowser.selectedTab = newtab;
	return newtab;
}
FoxcubService.WindowHelper.prototype.changeUrl = function(url) {
	var tbrowser = this.getBrowser();
	tbrowser.getBrowserForTab(tbrowser.selectedTab).loadURI(url);
}
FoxcubService.WindowHelper.prototype.isWindowActive = function(win) {
	var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    if(ww && ww.activeWindow && win){
    	return (ww.activeWindow === win);
    }
    return false;
}


