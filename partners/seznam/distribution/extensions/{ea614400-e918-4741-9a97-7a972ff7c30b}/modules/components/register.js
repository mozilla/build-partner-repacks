var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Register = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Register",
			IMPLEMENT : [FoxcubService.LogInterface,FoxcubService.RPCInterface],
			VERSION : "0.1"
		});

FoxcubService.Register.prototype.RETRY_INTERVAL = 10800000; // 10800000 //(dve hodiny)
FoxcubService.Register.prototype.PWD = "SeznamSoftware";
FoxcubService.Register.prototype.TICKET_REQUEST = "<?xml version=\"1.0\" encoding=\"utf-8\"?><methodCall><methodName>getTicket</methodName><params /></methodCall>";
FoxcubService.Register.prototype.REGISTER_REQUEST = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
		+ "<methodCall><methodName>register</methodName><params>"
		+ "<param><value><string>${0}</string></value></param>"
		+ "<param><value><string>${1}</string></value></param>"
		+ "<param><value><struct>"
		+ "<member><name>computerHash</name><value><string></string></value></member>"
		+ "<member><name>release</name><value><string>${2}</string></value></member>"
		+ "<member><name>version</name><value><string>${3}</string></value></member>"
		+ "<member><name>product</name><value><string>${4}</string></value></member>"
		+ "<member><name>os</name><value><string>${5}</string></value></member>"
		+ "<member><name>browser</name><value><string>${6}</string></value></member>"
		+ "<member><name>params</name><value><struct><member><name>hp</name><value><int>${7}</int></value></member></struct></value></member>"
		+ "</struct></value></param>" + "</params></methodCall>";
FoxcubService.Register.prototype.RELEASE_REQUEST = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
		+ "<methodCall><methodName>release</methodName><params>"
		+ "<param><value><string>${0}</string></value></param>"
		+ "<param><value><string>${1}</string></value></param>"
		+ "<param><value><string>${2}</string></value></param>"
		+ "</params></methodCall>";
FoxcubService.Register.prototype.UPDATE_REQUEST = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
		+ "<methodCall><methodName>update</methodName><params>"
		+ "<param><value><string>${0}</string></value></param>"
		+ "<param><value><string>${1}</string></value></param>"
		+ "<param><value><string>${2}</string></value></param>"
		+ "<param><value><struct>"
		+ "<member><name>version</name><value><string>${3}</string></value></member>"
		+ "<member><name>params</name><value><struct><member><name>hp</name><value><int>${4}</int></value></member></struct></value></member>"
		+ "</struct></value></param>" + "</params></methodCall>";

FoxcubService.Register.prototype.$constructor = function() {
	this.log("constructor start", "info");
//defaultne properties
	this.actionName = '';
	this.id = "";

	//timer a time events
	this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.timeAction = FoxcubService.JAK.bind(this,this._timeAction);
	this.timeActionEvent = { 
		notify: this.timeAction 
	};

	this.nvg = Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler); 
	
	this.log("constructor end", "info");
}


FoxcubService.Register.prototype.init = function(){
	var tmp = FoxcubService.pref.get().getPref("instance.id");
	var ssid = (tmp.success) ? tmp.value : "";
	var tmp = FoxcubService.pref.get().getPref("instance.upgraded");
	var upgraded = (tmp.success) ? tmp.value : 0;
	this.actionName = "";
	if(!ssid){
		this.actionName = "register";
	}else if(upgraded == 2){
		this.actionName = "update";
	}
	this.run();
}

FoxcubService.Register.prototype.run = function(){
	if(this.actionName){
		this.timer.initWithCallback(this.timeActionEvent,this.RETRY_INTERVAL,this.timer.TYPE_REPEATING_SLACK);
		this._timeAction();
	}
};

FoxcubService.Register.prototype._timeAction = function(){
	if(this.actionName != 'release'){
		this.log("start: " + this.actionName);
		this._getTicket();
	}else{
		this.timer.cancel();
	}
};

/**
 * Uvoľnenie ssid
 * @param {bool} reRegister - znova zaregistrovať FIXME!!! - používa sa?
 */
FoxcubService.Register.prototype.release = function(){
	if(this.actionName == "release") return;
	this.actionName = "release";
	this._getTicket(true);
};
/**
 * reregistracia
 * @param {bool} reRegister - znova zaregistrovať FIXME!!! - používa sa?
 */
FoxcubService.Register.prototype._reRegister = function(){
	this.log("repair registration","warn");
	this.timer.cancel();
	this.actionName = "register";
	this.run();
};


FoxcubService.Register.prototype._getTicket = function(sync){
	this.sendRPC(this._getRegisterUrl(),"_ticketAnswer",this.TICKET_REQUEST,null,sync)
}
FoxcubService.Register.prototype._ticketAnswer = function(data,status){

	//zle nic nerob
	if(status != 200){
		this.log(" ticket request returned " + status + " HTTP status",'error');
		return;
	}
	
	
	
	var status = 0;
	var statusMsg = "";
	var ticket = "";
	//zle nic nerob
	if(!data){
		this.log(" ticket request returned empty data",'error');
		return
	}
	
	
	//spracovanie response xml
	var xyz = new FoxcubService.BaseResponseAnswer(data);
	var state = parseInt(xyz.parse("//name[text()='status']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	var stateMsg = xyz.parse("//name[text()='statusMessage']/following-sibling::value/string")[0].textContent;

	//zle nic nerob 
	if(state != 200){
		this.log(" ticket request returned " + state + "state; message: " + stateMsg,'error');
		return;
	}
	
	//ticket v poriadku vytvor objekt
	this.ticketObj = {
		time : new Date().getTime(),
		ticket : xyz.parse("//name[text()='ticket']/following-sibling::value/string")[0].textContent
	};
	//pokracuj predvolenou akciou
	if(this.actionName == 'register'){
		this._registerRq();
	}else if (this.actionName == 'update'){
		this._updateRq();
	} else if (this.actionName == 'release'){
		this._releaseRq();	
	}
	
};

FoxcubService.Register.prototype._registerRq = function(){
	var info = this._getInfo();
	var signature = this._getTicketSignature(this.ticketObj.ticket + this.PWD);
	var data = [this.ticketObj.ticket, signature, info.release, info.version, info.product, info.os, info.browser,info.hp];
	this.sendRPC(this._getRegisterUrl(),"_registerAnswer",this.REGISTER_REQUEST,data,false)	
};
/**
 * Odpoveď na _registerRq<br>
 * Ak je v poriadku nastav ssid.
 */
FoxcubService.Register.prototype._registerAnswer = function(data,status){
	if(status != 200){
		this.log(" register request returned " + status + " HTTP status",'error');
		return;
	}
	//?
	var status = 0;
	var statusMsg = "";
	var ssid = "";
	
	if(!data){
		this.log(" register request returned empty data",'error');
		return
	}

	var xyz = new FoxcubService.BaseResponseAnswer(data);
	var state = parseInt(xyz.parse("//name[text()='status']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	var stateMsg = xyz.parse("//name[text()='statusMessage']/following-sibling::value/string")[0].textContent;
	
	if(state != 200){
		this.log(" register request returned " + state + " state; message: " + stateMsg,'error');
		return;
	}
	//mame kluc 
	ssid = 	xyz.parse("//name[text()='ssid']/following-sibling::value/string")[0].textContent;	
	//uloz kluc
	FoxcubService.pref.get().setPref("instance.id",ssid);
	//nastav info pre update
	FoxcubService.pref.get().setPref("instance.upgraded",0);
	this.timer.cancel();
};
/**
 * update request
 */
FoxcubService.Register.prototype._updateRq = function(){
	var updateRequest = this.UPDATE_REQUEST;
	var info = this._getInfo();	
	if(!info.ssid){
		return;
	}
	var signature = this._getTicketSignature(this.ticketObj.ticket + this.PWD);	
	var data = [this.ticketObj.ticket, signature, info.ssid , info.version, info.hp];
	this.sendRPC(this._getRegisterUrl(),"_updateAnswer",this.UPDATE_REQUEST,data,false);
	
}
/**
 * Odpoveď na update<br>
 */
FoxcubService.Register.prototype._updateAnswer = function(data,status){

	if(status != 200){
		return;
	}

	var state = 0;
	var statusMsg = "";
	
	var xyz = new FoxcubService.BaseResponseAnswer(data);
	var state = parseInt(xyz.parse("//name[text()='status']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	//FoxcubService.debug(data,"xml");
	if(state>=200 && state<300){
		//FoxcubService.debug("ok");
		FoxcubService.pref.get().setPref("instance.upgraded",0);
		this.log("updated");
		this.timer.cancel();
	}else if(state>=400 && state<500){
		//FoxcubService.debug("reregister");
		FoxcubService.pref.get().setPref("instance.id","");
		FoxcubService.pref.get().setPref("instance.upgraded",0);
		this.log("repair registration required","warn");
		this._reRegister();
	}
}
/**
 * release request 
 */
FoxcubService.Register.prototype._releaseRq = function(){
	var releaseRequest = this.RELEASE_REQUEST;
	var signature = this._getTicketSignature(this.ticketObj.ticket + this.PWD);
	var id = FoxcubService.pref.get().getPref("instance.id");
	if(!(id.success && id.value))return;
	var data = [this.ticketObj.ticket,signature, id.value];
	this.sendRPC(this._getRegisterUrl(),"_releaseAnswer",this.RELEASE_REQUEST,data,false);
};
/**
 * Odpoveď na releaseRq<br>
 */
FoxcubService.Register.prototype._releaseAnswer = function(data,status){
	if(status != 200){
		this.log(" release request returned " + status + " HTTP status",'error');
		return;
	}
	this.log("instance released","info");
}
/**
 * Podpis z ticketu
 */
FoxcubService.Register.prototype._getTicketSignature = function(str){
	var signature = FoxcubService.functions.crc32.get(str).toString(16).toUpperCase();
	while(signature.length < FoxcubService.functions.crc32.HASH_LENGTH){
		signature = "0" + signature;
	};		
	return signature;
};

FoxcubService.Register.prototype._getInfo = function(){
	var out = {}
	//out.release = this.getRelease(this.main.version);
 	var info = FoxcubService.install.extensionInfo();
	if(info != null){
 		out.release = info.releaseId;	
 		out.version = info.version;
 		out.ssid = info.ssid;
 		out.hp = info.hp;
	}else{
		this.log("empty extension info","error");
	}
	out.product = "04";
	out.os = this.nvg.platform + ';' + this.nvg.oscpu;
	out.browser = this.nvg.product + '; ' + this.nvg.productSub;
	
	return out;
};
FoxcubService.Register.prototype._getRegisterUrl = function(){
 	return FoxcubService.config.get('core','registerUrl');
}