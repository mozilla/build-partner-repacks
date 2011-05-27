var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.FXBPrefObserver = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : "FoxcubService.FXBPrefObserver",
	VERSION : "0.1",
	EXTEND :FoxcubService.PreferenceObserver
});

FoxcubService.FXBPrefObserver.prototype.$constructor = function(owner,callback){
	this.$super(FoxcubService.FOXCUB_PREF_BRANCH,owner,callback);
};