var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Logger.ConsoleLog = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Logger.ConsoleLog",
			VERSION : "0.1",
			EXTEND : FoxcubService.Logger.ParentLog
		});
FoxcubService.Logger.ConsoleLog.prototype.$constructor = function(enabled) {
	this.console = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	this.$super(enabled);
};

/**
 * ak msg objekt sprav vhodny format, inak len sprava<br>
 * @param {object|string} data - sprava<br>
 * @return {string} sformatovana správa
 */

FoxcubService.Logger.ConsoleLog.prototype._format = function(data) {
	var out;
	
	if(typeof data == 'object'){
		out = '[' + data.type + '] ' + data.date + ' ' + data.name + '::' + data.method + ' ' + data.msg; 
	} else {
		out = data;
	}	
	return out;
};
FoxcubService.Logger.ConsoleLog.prototype._log = function(data) {		
	this.console.logStringMessage(data);
	
};
