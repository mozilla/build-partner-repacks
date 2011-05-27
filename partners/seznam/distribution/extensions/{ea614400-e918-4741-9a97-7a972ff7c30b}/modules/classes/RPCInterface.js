var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.RPCInterface = FoxcubService.JAK.ClassMaker.makeInterface({
	NAME : "FoxcubService.RPCInterface",
	VERSION : "0.1"
});

FoxcubService.RPCInterface.prototype.sendRPC = function(url,func,tempate,data,sync){
		
	var tmp = tempate;
	if (data) {
		for (var i in data) {
			var tmp = tmp.replace("${" + i + "}", data[i]);
		}
	}
	var opt = {
		async : !sync,
		method : 'post',
		timeout : 0
	}
	/*if(FoxcubService.logger){
		FoxcubService.logger.log(tmp);
	}*/
	var request = new FoxcubService.JAK.Request(FoxcubService.JAK.Request.XML,opt);
	request.setHeaders({'Content-Type' : 'text/xml'});
	if(!opt.async && !func){
		this.____synchroneRPCData = null;
		request.setCallback(this, this.____synchroneRPC);
		request.send(url,tmp);
		return this.____synchroneRPCData;
	}else{
		request.setCallback(this, func);		
		request.send(url,tmp);
		return request;
	}
	
}
FoxcubService.RPCInterface.prototype.____synchroneRPC = function(data,status){
	this.____synchroneRPCData = {data:data,status:status}
}