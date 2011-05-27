var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Logger.WindowLog = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Logger.WindowLog",
	VERSION: "0.1",
	EXTEND : FoxcubService.Logger.ParentLog
});

FoxcubService.Logger.WindowLog.prototype.LINE_END = "\n";
FoxcubService.Logger.WindowLog.prototype.MAX_WIN_LINES = 1000;

FoxcubService.Logger.WindowLog.prototype.$constructor = function(enabled) {
	this.logWindow = null;
	this.logFolder = [];
	this.$super(enabled);
};

FoxcubService.Logger.WindowLog.prototype._init = function() {
	this._enable();
};
FoxcubService.Logger.WindowLog.prototype._enable = function() {
	if (this.enabled) {
		if (!this.logWindow) {
			this._open();
		} else {
			this.logWindow.focus();
		}
	} else {
		if (this.logWindow) {
			this.logWindow.close();
		}
		this.clearFolder();
	};
};
FoxcubService.Logger.WindowLog.prototype._log = function(out, noStore) {
	if (!noStore) {
		if (this.logFolder.length < this.MAX_WIN_LINES) {
			this.logFolder.push(out);
		} else {
			this.logFolder.shift();
			this.logFolder.push(out);
		}
	}

	if (this.logWindow && ("logWindow" in this.logWindow)
			&& this.logWindow.logWindow.inited) {
		this.logWindow.logWindow.log(out.message, out.type);
	}
};

FoxcubService.Logger.WindowLog.prototype.flushLog = function(){
	for(var i = 0; i < this.logFolder.length; i++){
		this._log(this.logFolder[i],true);
	}
};

FoxcubService.Logger.WindowLog.prototype._format = function(data) {	
	var out = {};
	if(typeof data == 'object'){
		out.type = data.type;
		out.message = data.type + '\t' + data.date + '\t' + data.name + '::' + data.method + '\t' + data.msg + this.LINE_END;
	} else {
		out.type = "info";
		out.message = data + this.LINE_END;
	}
	return out;
};


FoxcubService.Logger.WindowLog.prototype.clearFolder = function() {
	this.logFolder = [];
};

FoxcubService.Logger.WindowLog.prototype._open = function(msg){
	if(!this.logWindow){
		var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
		this.logWindow = ww.openWindow(null,"chrome://foxcub/content/foxcubLogOverlay.xul","Log","menubar,statusbar,centerscreen,chrome,resizable,scrollbars,dialog=no,close",null);
	}
};

FoxcubService.Logger.WindowLog.prototype.saveFromWin = function(file,path){
	var writer = new FoxcubService.FileWriter(path);
	writer.open(writer.REWRITE);
	for(var i in this.logFolder){
		writer.write(this.logFolder[i].message);
	}
	writer.close();
};
