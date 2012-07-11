var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.FileReader = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : 'FoxcubService.FileReader',
			VERSION : '0.1',
			CLASS : 'class'
		});

FoxcubService.FileReader.prototype.ENCODING = "UTF-8";
FoxcubService.FileReader.prototype.DELIMITER = "\n";

FoxcubService.FileReader.prototype.$constructor = function(path) {
	var File = Components.Constructor('@mozilla.org/file/local;1',
			Components.interfaces.nsILocalFile, 'initWithPath');
	this.file = new File(path);
	this.stream = null;
};

FoxcubService.FileReader.prototype.readLn = function(){
		var lineData = {};  
		var success = this.stream.readLine(lineData);
		return (success) ? lineData.value : null;		
}

FoxcubService.FileReader.prototype.readLns = function() {
	this.open();
	var line = "";
	var lines = [];
	while (line = this.readLn()) {
		lines.push(line)
	}
	this.close();
	return lines;
}

FoxcubService.FileReader.prototype.open = function() {
	if(this.stream) throw new Error("Stream already opened!");
	var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
	fstream.init(this.file, -1, 0, 0);
	var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
			.createInstance(Components.interfaces.nsIConverterInputStream);
	is.init(fstream, this.ENCODING, 1024, 0xFFFD);
	is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream);
	this.stream = is;
};

FoxcubService.FileReader.prototype.close = function() {
	if (this.stream) {
		this.stream.close();
		this.stream = null;
	}
};