var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Logger.ParentLog = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Logger.ParentLog",
			VERSION : "0.1"
		});
FoxcubService.Logger.ParentLog.prototype.$constructor = function(enabled) {
	try {
		this.enabled = enabled;
		this._init();
	} catch (e) {
		FoxcubService.debug(e.toString());
	}
};
FoxcubService.Logger.ParentLog.prototype._init = function() {
};
FoxcubService.Logger.ParentLog.prototype.log = function(data) {
	if (this.enabled) {
		var data = this._format(data);
		this._log(data);
	}
};
FoxcubService.Logger.ParentLog.prototype._format = function(data) {
};
FoxcubService.Logger.ParentLog.prototype._log = function(data) {
};
FoxcubService.Logger.ParentLog.prototype.enable = function(enabled) {
	try {
		this.enabled = enabled;
		if (this._enable)
			this._enable();
	} catch (e) {
		FoxcubService.debug(e.toString());
	}
};