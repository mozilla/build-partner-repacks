var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.SeznamAccount = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.SeznamAccount",
			EXTEND : FoxcubService.Email.AbstractAccount,
			IMPLEMENT : [FoxcubService.RPCInterface],
			VERSION : "0.1"
		});
		
FoxcubService.Email.SeznamAccount.prototype.BIFF = "<?xml version=\"1.0\" encoding=\"utf-8\"?><methodCall><methodName>biff</methodName><params><param><value><string>${0}</string></value></param><param><value><string>${1}</string></value></param><param><value><string>${2}</string></value></param><param><value><int>${3}</int></value></param></params></methodCall>";
FoxcubService.Email.SeznamAccount.prototype.AUTH_USER = "<?xml version=\"1.0\" encoding=\"utf-8\"?><methodCall><methodName>authUser</methodName><params><param><value><string>${0}</string></value></param><param><value><string>${1}</string></value></param><param><value><string>${2}</string></value></param></params></methodCall>";

FoxcubService.Email.SeznamAccount.prototype.$constructor = function(data){
	this.log('constructor start');
	this.$super(data);
	this.parser = new FoxcubService.BaseResponseAnswer();
	this.sendCount = 0;
	this.log('constructor end');
}
//zahajenie kontroly
FoxcubService.Email.SeznamAccount.prototype._check = function(){
	if(!this.data.password && !this.data.active){
		this._onError(this.ERROR_UNKNOWN);
		return;
	}
	var opt = [
		this.data.login,
		this.data.domain.name,
		(this.data.md5)?this.data.password:FoxcubService.functions.md5.get(this.data.password),
		//cas poslednej kontroly v s
		this.data.timestamp//Math.round(new Date().getTime()/1000)
	];
	// posleme biff request
	this.sendRPC(this.data.domain.attrs.server,"_handleCheck",this.BIFF,opt,false)	
};
//spravujeme response
FoxcubService.Email.SeznamAccount.prototype._handleCheck = function(data,status){
	if(status == 200){
		try{
			var state = this._parse(data);
			if(state)this._onSuccess(state.state);	
		}catch(e){
			this.log(e.toString(),"error")
			this._onError(this.ERROR_UNKNOWN);	
		}
				
	} else {
		 this._onError(this.ERROR_UNKNOWN);	
	}
};
//rozparsovanie response zo servra
FoxcubService.Email.SeznamAccount.prototype._parse = function(xml){
	//if(!(--this.sendCount))return;
	/*var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
 	var xmlstr = serializer.serializeToString(xml);
 	this.log(xmlstr,"error")*/
	this.parser.setData(xml);
	var status = parseInt(this.parser.parse("//name[text()='status']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	
	var error = 0;
	if (status == 402){
		this._onError(this.ERROR_PWD);	
	} else if (status != 200) {
		this._onError(this.ERROR_UNKNOWN);
	}else{

		var states = [];
		var newMsg = parseInt(this.parser.parse("//name[text()='new']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
		var unreadMsg = parseInt(this.parser.parse("//name[text()='unread']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
		var time = parseInt(this.parser.parse("//name[text()='timestamp']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
		this._updateAccountData('timestamp',time);
		var msgIdArr = this.parser.parse("//name[text()='messageId']/following-sibling::value/array/data/value/*[name()= 'i4' or name()='int']");
		var msgFromArr = this.parser.parse("//name[text()='from']/following-sibling::value/array/data/value/*[name()= 'string']");
		var msgSubjArr = this.parser.parse("//name[text()='subject']/following-sibling::value/array/data/value/*[name()= 'string']");
		var msgAbstrArr = this.parser.parse("//name[text()='abstract']/following-sibling::value/array/data/value/*[name()= 'string']");

		for(var i = 0; i < msgIdArr.length; i++){
			states.push({
				//id spravy
				id : parseInt(msgIdArr[i].textContent),
				//odosielatel
				from : msgFromArr[i].textContent,
				//subjekt
				subject : msgSubjArr[i].textContent,
				//text
				abstr : msgAbstrArr[i].textContent
			});
		}
		var out = {
					state : {
					//pocet novych sprav	
					newMsg : newMsg,
					//pocet neprecitana sprava 
					unreadMsg : unreadMsg,
					//zoznam sprav
					states : states
				},
				error : error
		};
		return out;
	}	
	return null;
};
//rozsirenie getSupportedActionsData v abstractAccount
FoxcubService.Email.SeznamAccount.prototype.getSupportedActionsData = function() {
	var a = this.$super();
	//musime zohnat session id - pomocou _authorize requestu
	a.standard.sessionId = this._authorize();
	return a;
}

/**
 * Autentifikacia uzivatela 
 */
FoxcubService.Email.SeznamAccount.prototype._authorize = function(){
	
	var state = null;
	
	var opt = [
		this.data.login,
		this.data.domain.name,
		(this.data.md5)?this.data.password:FoxcubService.functions.md5.get(this.data.password)
	];
	try {
		var response = this.sendRPC(this.data.domain.attrs.server,null,this.AUTH_USER,opt,true)
	} catch(e){
		return null;
	}
	
	if(response.status == 200 && response.data){
		state = this._parseAuthorizeReq(response.data);
	}
	return (state && state.session)?state.session:"";
};
//rozparsovanie autentifikacneho responsu
FoxcubService.Email.SeznamAccount.prototype._parseAuthorizeReq = function(xml){
	this.parser.setData(xml);
	
	var status = parseInt(this.parser.parse("//name[text()='status']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	
	if(status != 200){
		this.log("authorize response has state " + status,"error");
		return null;
	}
	
	var out = {};
	
	out.userId = parseInt(this.parser.parse("//name[text()='userId']/following-sibling::value/*[name()= 'i4' or name()='int']")[0].textContent);
	out.accessKey = this.parser.parse("//name[text()='accessKey']/following-sibling::value/*[name()= 'string']")[0].textContent;
	out.session = this.parser.parse("//name[text()='sessionId']/following-sibling::value/*[name()= 'string']")[0].textContent;
	
	return out;
};

