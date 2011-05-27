var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Logger.FileLog = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Logger.FileLog",
			VERSION : "0.1",
			EXTEND : FoxcubService.Logger.ParentLog
		});
		
FoxcubService.Logger.FileLog.prototype.FILES_NAMES = ["log_a.txt","log_b.txt"];
FoxcubService.Logger.FileLog.prototype.MAX_FILE_LINES = 2000;

FoxcubService.Logger.FileLog.prototype.$constructor = function(enabled) {
	this.files = [];
	this.ai = 0;
	this.$super(enabled);
};

FoxcubService.Logger.FileLog.prototype._init = function() {
	this._initLogFiles();	
	this._enable();
};
FoxcubService.Logger.FileLog.prototype._initLogFiles = function() {
	var min = this.MAX_FILE_LINES +1;
	for(var i in this.FILES_NAMES){
		try {
			var path = FoxcubService.EXTENSION_PATH + FoxcubService.SEP
					+ this.FILES_NAMES[i];
			var writer = new FoxcubService.FileWriter(path);
			var reader = new FoxcubService.FileReader(path);
			// ak nieje vytvorime
			writer.open(writer.APPEND);
			writer.close();
			// nacitame aktualne obsah
			var lns = reader.readLns();
			lns.length;
			if (min > lns.length) {
				this.ai = i * 1;
				min = lns.length;
			}
			var file = {
				writer : writer,
				lines : lns.length
			}
			this.files.push(file);
		} catch (e) {
		}
	}
};
FoxcubService.Logger.FileLog.prototype._enable = function() {
	if(!this.enabled){
		var file = this._getLogfile();
		if(file)file.writer.close();
	}
}
FoxcubService.Logger.FileLog.prototype._getLogfile = function() {
	if(!this.files.length)return null;
	var f = this.files[this.ai];
	var flag = f.writer.APPEND;
	if (f.lines >= this.MAX_FILE_LINES) {
		flag = f.writer.REWRITE;
		f.writer.close();
		this.ai = (this.ai >= (this.files.length-1)) ? 0 : this.ai + 1;
		var f = this.files[this.ai];
		f.lines = 0;
	}
	if (!f.writer.isOpened()) {
		f.writer.open(flag);
	}	
	return f;
}
/**
 * ak msg objekt sprav vhodny format, inak len sprava<br>
 * @param {object|string} data - sprava<br>
 * @return {string} sformatovana správa
 */

FoxcubService.Logger.FileLog.prototype._format = function(data) {
	var out;
	if(typeof data == 'object'){
		out = data.type + '\t' + data.date + '\t' + data.name + '::' + data.method + '\t' + data.msg;
	} else {
		out = data;
	}
	return out;
};
FoxcubService.Logger.FileLog.prototype._log = function(data) {		
	var f = this._getLogfile();
	if(f){
		f.writer.writeLn(data);
		f.lines++;	
	}
};
