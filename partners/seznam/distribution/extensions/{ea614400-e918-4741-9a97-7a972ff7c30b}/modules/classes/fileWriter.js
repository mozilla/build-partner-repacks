var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.FileWriter = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : 'FoxcubService.FileWriter',
			VERSION : '0.1',
			CLASS : 'class'
		});

FoxcubService.FileWriter.prototype.REWRITE = 0x02 | 0x08 | 0x20;
FoxcubService.FileWriter.prototype.APPEND = 0x02 | 0x08 | 0x10;
FoxcubService.FileWriter.prototype.ENCODING = "UTF-8";
FoxcubService.FileWriter.prototype.DELIMITER = "\n";

FoxcubService.FileWriter.prototype.$constructor = function(path) {
	var File = Components.Constructor('@mozilla.org/file/local;1',
			Components.interfaces.nsILocalFile, 'initWithPath');
	this.file = new File(path);
	this.stream = null;
};

FoxcubService.FileWriter.prototype.write = function(line) {
	this.stream.writeString(line);
}

FoxcubService.FileWriter.prototype.writeLn = function(line) {
	this.stream.writeString(line + this.DELIMITER);
}

FoxcubService.FileWriter.prototype.open = function(flag) {
	this.close();
	
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Components.interfaces.nsIFileOutputStream);
	foStream.init(this.file, flag, 0, 0);
	var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
			.createInstance(Components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, this.ENCODING, 0, 0);
	this.stream = converter;
};
FoxcubService.FileWriter.prototype.isOpened = function() {
	return !!this.stream;
};
FoxcubService.FileWriter.prototype.close = function() {
	if (this.stream) {
		this.stream.close();
		this.stream = null;
	}
};
