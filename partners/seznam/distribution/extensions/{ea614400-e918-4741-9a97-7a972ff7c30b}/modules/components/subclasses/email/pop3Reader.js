var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.Pop3Reader = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : 'FoxcubService.Email.Pop3Reader',
	VERSION : '0.1',
	IMPLEMENT : [FoxcubService.JAK.Components,FoxcubService.LogInterface]
});

FoxcubService.Email.Pop3Reader.prototype.SEP = "\r\n";
FoxcubService.Email.Pop3Reader.prototype.MAX_MAIL_COUNT = 10;
FoxcubService.Email.Pop3Reader.prototype.MAX_MAIL_LINES = 100;

FoxcubService.Email.Pop3Reader.prototype.STATE_INIT = 0;
FoxcubService.Email.Pop3Reader.prototype.STATE_AUTH = 1;
FoxcubService.Email.Pop3Reader.prototype.STATE_TRANS = 2;
FoxcubService.Email.Pop3Reader.prototype.STATE_CLOSE = 3;

FoxcubService.Email.Pop3Reader.prototype.ERROR_NO = 0;
FoxcubService.Email.Pop3Reader.prototype.ERROR_INIT = 1;
FoxcubService.Email.Pop3Reader.prototype.ERROR_LOGIN = 2;
FoxcubService.Email.Pop3Reader.prototype.ERROR_UNKNOWN = 3;

FoxcubService.Email.Pop3Reader.prototype.STATE_CHANGE = "STATE_CHANGE";
/**
 * trieda zodpovedna za komunikaciu pomocou pop3
 * @param {string} host
 * @param {integer} port
 * @param {bool} ssl
 * @param {string} login
 * @param {string} password
 * @param {object} owner - owner musi obsahovat funkciu handleIds
 */
FoxcubService.Email.Pop3Reader.prototype.$constructor = function(host,port,ssl,login,password,owner){
	this.log("constructor start");
	this._owner = owner;
	this.orderids = FoxcubService.JAK.bind(this,this._orderids);
	this.host = host;
	this.port = port;
	this.ssl = ssl;
	this.login = login;
	this.order = 1;
	this.password = password;
	this.socketReader = null;
	this.finished = false;
	this.log("constructor end");
};
//inicializacia - spusta samotnu kontrolu
FoxcubService.Email.Pop3Reader.prototype.init = function(){
	this.log("init start");
	this.error = this.ERROR_NO;
	this.finished = false;
	this.timestamp = "";
	//vysledok kontroly
	this.result = {
		newCount : 0,
		unSeenCount : 0,
		texts : []
	};
	this.state = this.STATE_INIT;
	this.msgCount = 0;
	this.msgIds = [];
	//udrzuje stavovu informaciu o priebuhu komunikacie
	this.last = {
		command:this.STATE_CHANGE,
		success:true
	}
	this.socketReader = new FoxcubService.Email.SocketReader(this,this.response,this.host,this.port,this.ssl);
	this.data="";
	//spustime to 
	this.response(true);
	this.log("init end");
};

FoxcubService.Email.Pop3Reader.prototype._error = function(e){
    this.finished = true;
    if(e)this.log(e.toString() + " " + e.fileName + " " + e.lineNumber, "error");
	var close = false;
	switch(this.state){
		case this.STATE_INIT: this.error =this.ERROR_INIT;
							  break;
		case this.STATE_AUTH: this.error =this.ERROR_LOGIN;
							  close = true;
							  break;
		case this.STATE_TRANS: close = true;
							   break;
		case this.STATE_CLOSE: this._close();
							   break;
	
	}	
	if(!this.error)this.error = this.ERROR_UNKNOWN;	
	if(close){
		this.state = this.STATE_CLOSE;
		this._go(null,this.STATE_CHANGE,true);
	}
}

FoxcubService.Email.Pop3Reader.prototype.response = function(data){
  if (data !== true) {
		//buffrujeme kym nemame celu response
		if (!this._buffer(data))
			return;
		//bola response uspesna ?
		this.last.success = (this.data.indexOf('+OK') == 0);
  }

  //spustime adekvatnu funkciu
  switch (this.state){
  		case this.STATE_INIT:this.state_init();break;
  		case this.STATE_AUTH:this.state_auth();break;
  		case this.STATE_TRANS:this.state_trans();break;
  		case this.STATE_CLOSE:this.state_close();break;
  }
}
//inicializacia spojenia
FoxcubService.Email.Pop3Reader.prototype.state_init = function() {

	var command = this.last.command;
	var success = this.last.success;
	try {
		switch (command) {
			//inicializacia readra, tu prebieha naviazanie spojenia
			case this.STATE_CHANGE :
				try{					
					this.socketReader.init();
					this._set('INIT');
				}catch(e){
					this._error(e);
				}				
				break;
			//ak bola inicializacia uspesna postupine o stav vysie(prihlasovanie)
			case 'INIT' :
				if (success) {
					//
					var matches = this.data.match(/<[^>]+@[^>]+>/);
					this.timestamp = (matches)?matches[0]:"";
					this._nextState();
				}else{
					this._error();
				}
				break;
		}
	} catch (e) {
		this.log(e.toString(), "error");
	}

}
//funkcia sa stara o prihlasenie uzivatela na pop3
FoxcubService.Email.Pop3Reader.prototype.state_auth = function() {
	var command = this.last.command;
	var success = this.last.success;
	try {
		switch (command) {
			//posleme login
			case this.STATE_CHANGE :
				if(success){
					//this.log(this.timestamp + this.password);
					if(this.timestamp){
						//var hash = "<1896.697170952@dbc.mtview.ca.us>tanstaaf";
						var hash = FoxcubService.functions.md5.get(this.timestamp + this.password);//).substring(0,16)
						this._go('APOP ' + this.login + " " + hash,'PASS');						

						//this._go('APOP ' + this.login + " " + FoxcubService.functions.md5.get(this.timestamp + this.password).substring(0,16),'PASS');						
					}else{
					    this._go('USER ' + this.login,'USER'); 
					}
					
				}else{
					this._error();
				}
				break;
			case 'USER' :
				if(success){
					this._go('PASS ' + this.password,'PASS');
				}else{
					this._error();
				}				
				break;
			//ak login a heslo uspesne ideme ziskat spravy
			case 'PASS' :
				if(success){
					this._nextState();
				}else{
					this._error();
				}
				break;
		}
	} catch (e) {
		this.log(e.toString(), "error");
	}
}
//samotne ziskanie novych sprav
FoxcubService.Email.Pop3Reader.prototype.state_trans = function() {
	var command = this.last.command;
	var success = this.last.success;
	switch (command) {
		//pre istotu resetneme stav pop3
		case this.STATE_CHANGE :
			this._go('RSET','RSET');
			break;
		//ziskame pocet sprav v buffry servra
		case 'RSET' :
			if (success) {
				this._go('STAT','STAT');
				break;
			}else{
				this._error();
			}
		//ak je viacej ako 0 zistime si ich idecka
		case 'STAT' :
			if (success) {
				var matches = this.data.match(/^\+OK\s(\d+)/);
				if (matches) {
					this.msgCount = parseInt(matches[1]);
					this._go('UIDL','UIDL');				
				}
			}else{
				this._error();
			}
			break;
		//rozparsujeme id, ak dane id nemame ulozene budeme povazovat spravu za novu(this._owner.handleIds)
		case 'UIDL' :
			if (success) {

					var lines = this.data.split(this.SEP);
					for (var i = 1; i < lines.length; i++) {
						var matches = lines[i].match(/(\d+)\s(.+)/)
						if (matches) {
							this.msgIds.push({
										id : parseInt(matches[1]),
										mailId : matches[2]
									})
						}
					}
					//vrati objekt obsahujuci id novych a nevydenych sprav
					var rs = this._owner.handleIds(this.msgIds);
					this.result.newCount = rs.newIds.length;
					this.result.unSeenCount = rs.unSeenIds.length + rs.newIds.length;
					this.order = rs.order;
					this.msgIds = rs.newIds;
					//zoradime nove spravy
					this.msgIds.sort(this.orderids)
					//presunieme sa do sekcie ziskavania textu sprav
					this.toCheck = this.msgIds.slice(0, this.MAX_MAIL_COUNT)					
					this._go(null,'MESSAGE');

			}else{
				this._error();
			}
			break;
		case 'MESSAGE' :
			//ak su nove spravy pokracuj, inac skonci
			if (this.toCheck.length) {
				//poprosime a prvych this.MAX_MAIL_LINES zo spravy
				this._go('TOP ' + this.toCheck[0].id + ' '+this.MAX_MAIL_LINES,'TOP');
			} else {
				this._nextState();
			}
			break;
		case 'TOP' :
			// alert(data)
			if (success) {
				try {
					    //sprava prijata
						var mainId = this.toCheck.shift().mailId;
						//skusime rozparsovat
						var mailParser = new FoxcubService.Email.MailParser(this.data)
						var parsedData = mailParser.parse();
						if (parsedData) {
							var parsedData = mailParser.usefull(parsedData);
							//ak uspesne ulozime 
							if (parsedData.TEXT) {
								parsedData.ID = mainId;
								this.result.texts.push(parsedData);
							}
						}
						this._go(null,'MESSAGE');
				} catch (e) {
					this.log(e.toString() + " " + e.fileName + " " + e.lineNumber, "error");
					this._go(null,'MESSAGE');
				}
			} else {
				this.toCheck.shift();
				this._go(null,'MESSAGE');
			}
			break;
	}
}
//funkcia usporiada spravy podla id ..
FoxcubService.Email.Pop3Reader.prototype._orderids = function(a,b){
	return this.order*(a.id - b.id); 
}
//buffrovanie responsu
FoxcubService.Email.Pop3Reader.prototype._buffer = function(data){
	//bol poslany kommand ktory ma viacriadkovy response?
	var multi = (this.last.command == 'UIDL' ||this.last.command == 'TOP');
	this.data += data;
	if(multi){
		//ano - command musi koncit \r\n.\r\n
		return this.data.lastIndexOf(this.SEP+"."+this.SEP)==(this.data.length -5);
	}else{
		//nie - command musi koncit \r\n
		return this.data.lastIndexOf(this.SEP)==(this.data.length -2);
	}
}
// uzatvorenie spojenia
FoxcubService.Email.Pop3Reader.prototype.state_close = function(){
  		var command = this.last.command;
		var success = this.last.success;
		switch (command) {
			//pre istotu resetnemu aby server nezmazal spravy
			case this.STATE_CHANGE :
				this.finished = true;
				this._go('RSET','RSET');		
				break;
			//ukoncime
			case 'RSET' :
				this._go('QUIT','QUIT');
				break;
			default:
				this._close();
			    break;
		}

  	
}
//posleme dalsi prikaz a ulozime stavovu informaciu
FoxcubService.Email.Pop3Reader.prototype._go = function(cmd,command,success){ 	
  	this._set(command,success);	
  	if(cmd!==null){
  		this._write(cmd);
  	}else{
  		this._exec();
  	}
}
//nastavi stavovu informaciu
FoxcubService.Email.Pop3Reader.prototype._set = function(command,success){
    this.last.command = command ? command : this.STATE_CHANGE;
    this.last.success = success ? true : false;
}
//posunieme sa o stav vysie
FoxcubService.Email.Pop3Reader.prototype._nextState = function(){
    this._set(this.STATE_CHANGE,true);
	this.state ++;
	this._exec();
}
//spusti funkcu zodpovednu za sapracovanie responsu pre aktualny stav
FoxcubService.Email.Pop3Reader.prototype._exec = function(){
	for(var i in this){
		if(i.indexOf("STATE_")==0 && this[i]==this.state){
			this[i.toLowerCase()]();
			break;
		}
	}
}
//zapise retazec do streamu
FoxcubService.Email.Pop3Reader.prototype._write = function(data){
  this.data="";
  //this.log("NEXT COMMAND TO EXECUTE:"+data,"warn");
  if(this.socketReader)this.socketReader.write(data + this.SEP);
}
//uzavrieme spojenie
FoxcubService.Email.Pop3Reader.prototype._close = function(){
  if(this.socketReader)this.socketReader.close();
}
