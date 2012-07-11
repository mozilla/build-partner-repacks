var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.LogInterface = FoxcubService.JAK.ClassMaker.makeInterface({
	NAME : "FoxcubService.LogInterface",
	VERSION : "0.1"
});

FoxcubService.LogInterface.prototype.log = function(message,type){
	if(!FoxcubService.logger)return;
	var out = {}	
	out.name = this.constructor.NAME || "N/A";
	out.date = new Date();
	for(var i in this){
		if(this[i] == arguments.callee.caller){
			out.method = i;
		}
	}
	out.type = type || 'info';
	out.msg = message || '';
	FoxcubService.logger.log(out);
}