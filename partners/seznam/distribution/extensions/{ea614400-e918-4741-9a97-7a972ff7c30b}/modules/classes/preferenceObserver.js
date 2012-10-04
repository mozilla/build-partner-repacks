var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/*
* "Observer" pro vnitrni udalosti rozhrani FF a vyvolani vlastni
*
*/
FoxcubService.PreferenceObserver = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : "FoxcubService.PreferenceObserver",
	VERSION : "0.1",
	IMPLEMENT :[FoxcubService.LogInterface]
});
/**
 * vseobecny observer na sledovanie zmeny preferencii<br>
 * funguje az po zavolani register
 */
FoxcubService.PreferenceObserver.prototype.$constructor = function(branchName,owner,callback){
	var console = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	
	try{

	
	this.prefService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
	this.branchName = branchName;
	this._owner = owner;
	this._callback = callback;
	
	
	this.branch = this.prefService.getBranch(this.branchName);
	this.branch.QueryInterface(Components.interfaces.nsIPrefBranch2);

	}catch(e){
		this.log(branchName);
	}
};

FoxcubService.PreferenceObserver.prototype.$destructor = function(){
	this.unregister();
};

FoxcubService.PreferenceObserver.prototype.register = function(){
	var console = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	this.branch.addObserver("", this, false);
};

FoxcubService.PreferenceObserver.prototype.unregister = function(){
	this.branch.removeObserver("", this);
};

FoxcubService.PreferenceObserver.prototype.observe = function(aSubject, aTopic, aData){
	if(aTopic != "nsPref:changed") { 
		return;
	}	
	this._callback.apply(this._owner,[aSubject, aTopic, aData]);
};

