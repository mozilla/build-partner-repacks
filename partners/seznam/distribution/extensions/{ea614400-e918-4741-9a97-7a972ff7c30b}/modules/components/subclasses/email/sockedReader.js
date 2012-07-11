var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.SocketReader = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : 'FoxcubService.Email.SocketReader',
	VERSION : '0.1',
	IMPLEMENT : [FoxcubService.JAK.Components,FoxcubService.LogInterface]
});
/**
 * trieda zapisujuca a citajuca zo streamu
 * @param {object} obj - objekt ktory komunikuje
 * @param {function} func - funkcia objektu spracuvavajuca response
 * @param {string} host - adresa servra
 * @param {integer} port - port servra
 * @param {bool} ssl - komunikovat cez ssl ?
 */
FoxcubService.Email.SocketReader.prototype.$constructor = function(obj,func,host,port,ssl){
	this.log("constructor start");
	 this.obj=obj;
	 this.func=func;
	 this.host = host;
	 this.port = port;
	 this.ssl = ssl?1:0;
	 this.sslT = ssl?["ssl"]:null;
	this.log("constructor end");
};

FoxcubService.Email.SocketReader.prototype.init = function(callback, host, port, ssl) {
	this.log("init start");
	var transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"]
			.getService(Components.interfaces.nsISocketTransportService);
	this.transport = transportService.createTransport(this.sslT, this.ssl,
			this.host, this.port, null);
	this.outstream = this.transport.openOutputStream(0, 0, 0);
	var stream = this.transport.openInputStream(0, 0, 0);
	this.instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
			.createInstance(Components.interfaces.nsIScriptableInputStream);
	this.instream.init(stream);
	var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"]
			.createInstance(Components.interfaces.nsIInputStreamPump);
	pump.init(stream, -1, -1, 0, 0, false);
	pump.asyncRead(this, null);
	this.log("init end");
};
//zapise retazec do streamu
FoxcubService.Email.SocketReader.prototype.write = function (data) {
 // this.log("--------------------------WRITE-------------------------- :"+data,"warn");
  this.outstream.write(data,data.length);
}
FoxcubService.Email.SocketReader.prototype.onStartRequest = function (aRequest, aContext) {
}
//preposle response zodpovednemu objektu
FoxcubService.Email.SocketReader.prototype.onDataAvailable = function (aRequest, aContext, aStream, aSourceOffset, aLength){
	 var data=this.instream.read(aLength);
	// this.log("-------------------------READ--------------------------- :"+data,"warn");
	 this.func.apply(this.obj,[data]);
}

FoxcubService.Email.SocketReader.prototype.onStopRequest = function (aRequest, aContext, aStatus) {
  this.close();
}
//zatvorime stream
FoxcubService.Email.SocketReader.prototype.close = function () {
  this.instream.close();
  this.transport.close(Components.results.NS_BINDING_ABORTED);
}
