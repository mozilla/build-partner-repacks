var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.PreferencesContainer = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.PreferencesContainer",
	VERSION: "0.1"
});

FoxcubService.PreferencesContainer.prototype.$constructor = function(defBranch) {
	this.container={}
	this.defBranch = defBranch;
	this.container[this.defBranch] = new FoxcubService.Preferences(this.defBranch);
}

FoxcubService.PreferencesContainer.prototype.get = function(branch) {
	if(!branch) return this.container[this.defBranch];
	if(!(branch in this.container)){
		this.container[branch] = new FoxcubService.Preferences(branch);
	}
	return this.container[branch];
}