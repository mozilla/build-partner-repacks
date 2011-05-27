var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.ImapReader = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : 'FoxcubService.Email.ImapReader',
	VERSION : '0.1',
	IMPLEMENT : [FoxcubService.JAK.Components,FoxcubService.LogInterface]
});

FoxcubService.Email.ImapReader.prototype.SEP = "\r\n";

FoxcubService.Email.ImapReader.prototype.STATE_INIT = 0;
FoxcubService.Email.ImapReader.prototype.STATE_AUTH = 1;
FoxcubService.Email.ImapReader.prototype.STATE_TRANS = 2;
FoxcubService.Email.ImapReader.prototype.STATE_CLOSE = 3;

FoxcubService.Email.ImapReader.prototype.STATE_CHANGE = "STATE_CHANGE";
FoxcubService.Email.ImapReader.prototype.MAX_MAIL_COUNT = 10;

FoxcubService.Email.ImapReader.prototype.ERROR_NO = 0;
FoxcubService.Email.ImapReader.prototype.ERROR_INIT = 1;
FoxcubService.Email.ImapReader.prototype.ERROR_LOGIN = 2;
FoxcubService.Email.ImapReader.prototype.ERROR_UNKNOWN = 3;
/**
 * trieda zodpovedna za komunikaciu pomocou imap
 * @param {string} host
 * @param {integer} port
 * @param {bool} ssl
 * @param {string} login
 * @param {string} password
 * @param {object} owner - owner musi obsahovat funkciu handleIds
 */
FoxcubService.Email.ImapReader.prototype.$constructor = function(host,port,ssl,login,password,owner){
	this._owner = owner;
	this.log("constructor start");
	this.host = host;
	this.port = port;
	this.ssl = ssl;
	this.login = login;
	this.password = password;
	this.socketReader = null;
	this.result = null;
	this.finished = false;
	this.parentheses = new FoxcubService.Parentheses("(",")");
	this.log("constructor end");
};
//inicializacia - spusta samotnu kontrolu
FoxcubService.Email.ImapReader.prototype.init = function(callback,host,port,ssl){
	this.log("init start");
	this.finished = false;
	this.error = this.ERROR_NO;
	//vysledok kontroly
	this.result = {
		newCount : 0,
		unSeenCount : 0,
		texts : []
	};
	this.msgUnseenIds = []
	this.msgMessages = {}
	
	this.state = this.STATE_INIT;
	this.atomCounter = 0;
	this.atom = "";
	this.data = "";
	this.checkedPosition = -1;
	//udrzuje stavovu informaciu o priebuhu komunikacie
	this.last = {
		command:this.STATE_CHANGE,
		success:false
	}
	
	this.socketReader = new FoxcubService.Email.SocketReader(this,this.response,this.host,this.port,this.ssl);
	this.response();
	this.log("init end");
};
//akcia pri chybe
FoxcubService.Email.ImapReader.prototype._error = function(e){
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

FoxcubService.Email.ImapReader.prototype.response = function(data){
  try {
  		
		if (this.atom) {
			//buffrujeme kym nemame cely response
			this.data += data;
			var lines = this.data.split(this.SEP);
			var atomLine = (lines.length>=2) ? lines[lines.length - 2] : "";			
			//ak nemame atom, koniec
			if(atomLine.indexOf(this.atom) != 0)return;	
			//this._parseResponse(this.data)
			//zistime ci je vsetko v poriadku
			this.last.success = (atomLine.indexOf(this.atom + " OK") == 0);
			//spustime odpovedajucu metodu
			this._exec();			
		} else {
			this.state_init();
		}
	} catch (e) {
		this.log(e.toString() + " " + e.fileName + " " + e.lineNumber, "error")
	}
}
/**
 * inicializacia  spojenia 
 * 
 **/
FoxcubService.Email.ImapReader.prototype.state_init = function() {
	var command = this.last.command;
	var success = this.last.success;

	switch (command) {	
			//novy stav inicializujeme
			case this.STATE_CHANGE :
				try{
					this.socketReader.init();
					this._set('INIT',true);
				}catch(e){					
					this._error(e);					
				}				
				break;
			case 'INIT' :				
				if (success) {
					this._nextState();
				}else{
					this._error();
				}
				break;
	}
}
//prihlasenie pomocou mena a hesla
FoxcubService.Email.ImapReader.prototype.state_auth = function() {
	var command = this.last.command;
	var success = this.last.success;
	switch (command) {
		case this.STATE_CHANGE :
			this._go('LOGIN ' + this.login + ' ' + this.password,'LOGIN');
			break;
		case 'LOGIN' :
			if (success) {
				this._nextState();
			} else {
				this._error();
			}
			break;
	}
}
//samotne ziskanie sprav
FoxcubService.Email.ImapReader.prototype.state_trans = function(){
	var command = this.last.command;
	var success = this.last.success;
		switch (command) {
			//selektneme inbox(hlavny priecinok zo spravami)
			case this.STATE_CHANGE :
				this._go('SELECT \"INBOX\"','SELECT');
				break;
			//ziskame idecka sprav ktore sme nevideli este
			case 'SELECT' :
				if(success){
					this._go('UID SEARCH UNSEEN','SEARCH_UNSEEN');
				} else {
					this._error();
				}
				break;
			//zparsujeme vysledok vyhladavania	
			case 'SEARCH_UNSEEN' :
				if(success){
					var ids = this._parseSearchAnswer(this.data);
					var rs = this._owner.handleIds(ids);
					this.result.newCount = rs.newIds.length;
					this.result.unSeenCount = rs.unSeenIds.length + rs.newIds.length;									
					this.toCheck = rs.newIds.slice(0, this.MAX_MAIL_COUNT)
					//ziskanie textu sprav
					this._go(null,'MESSAGES');					
				} else {
					this._error();
				}
				break;
			case 'MESSAGES' :
				if (this.toCheck.length) {
					//ziskame si strukturu spravy aby sme dalej mohli pytat iba text
					this._go("UID FETCH " + this.toCheck[0].id + ' BODYSTRUCTURE','FETCH_BODYSTRUCTURE');
				} else {
					this._nextState();
				}
				break;
			case 'FETCH_BODYSTRUCTURE' :
				if(success){
					try {
						//rozparsujeme strukturu
						var prop = this._parseFetchBodyStructure(this.data);
						this.log(prop.toSource(),"warn");
						this.toCheck[0].prop = prop;
						// vytiahneme text spravy subjekt a from, this.toCheck[0].prop.section - id sekcie s textom napr 1.2.3
						var cmd = "UID FETCH "+this.toCheck[0].id+' (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM)] BODY.PEEK['+this.toCheck[0].prop.section+'])';
						this._go(cmd,'FETCH_MESSAGE');
					} catch (e) {
						this.log(e.toString() + " " + e.fileName + " " + e.lineNumber, "error");
						this.toCheck.shift();
						this._go(null,'MESSAGES');
					}
				}else{
					this.toCheck.shift();
					this._go(null,'MESSAGES');
				}
				break;
			//rozparsujeme spravu
			case 'FETCH_MESSAGE' :
				if(success){
					try {
						var obj = this.toCheck.shift();
						//vytvoryme jednoduchu spravu ku ktorej pridame naviac info o kodovani
						var simpleMailStr = this._createSimpleEmail(this.data,obj.prop);
						//tuto rozparsujeme ako pri pop3 
						var mailParser = new FoxcubService.Email.MailParser(simpleMailStr)
						var parsedData = mailParser.parse();
						
						if (parsedData) {
							var parsedData = mailParser.usefull(parsedData);
							if (parsedData.TEXT) {
								parsedData.ID = obj.id;
								this.result.texts.push(parsedData);
							}
						}
						this._go(null,'MESSAGES');
					} catch (e) {
						this.log(e.toString() + " " + e.fileName + " " + e.lineNumber, "error");
						this._go(null,'MESSAGES');
					}
				}else{
					this.toCheck.shift();
					this._go(null,'MESSAGES');
				}
				break;
		}

}
//vytvori jednoduchu spravu - prida informacie o kodovani ziskane prikazom bodystructure
FoxcubService.Email.ImapReader.prototype._createSimpleEmail = function(data,prop) {
	var additionalHeaders = this.SEP + "CONTENT-TRANSFER-ENCODING:" + prop.encoding + this.SEP +
	"CONTENT-TYPE: TEXT/"+ prop.content+"; CHARSET="+ prop.charset + this.SEP+ this.SEP; 
	var parts = this._parseFetchMessage(data);
	return parts[0]+additionalHeaders+parts[1];
}
//rosparsovanie responsu s textom spravy
FoxcubService.Email.ImapReader.prototype._parseFetchMessage = function(data) {
	var out = data.substring(data.indexOf("(")+1,data.lastIndexOf(")"));
	var parts = [];
	while(true){
		//najdeme zatvorku ktora obsahuje pocet characterov patriacich k sprave, ulozime text .. pokracujeme zo zvyskom
		var matches = out.match(/.*{(\d+)}/);		
		if(matches){
			out = out.replace(matches[0],"");
			var length = parseInt(matches[1]);
			var part = out.substring(0,length).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			out = out.substring(length).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			parts.push(part);
			
		}else{
			break;
		}
	}
	return parts;
}
//rozparsuje respons s body structure
FoxcubService.Email.ImapReader.prototype._parseFetchBodyStructure = function(data) {
	//analyzer zatvoriek ... rekurzivne rozdeli string podla zatvoriek a toho co obsahuju
	var structure = this.parentheses.analyze(this.data, true);
	var html = null, plain = null;
	if (structure)
		for (var i = 3; i < structure.length; i++) {
			if (structure[i].bracketed) {
				//hladany regexp
				var matches = structure[i].match.match(/^"TEXT" "(PLAIN|HTML)" \("CHARSET" "([^"]+)"\) \S+ \S+ (?:"([^"]+)"|(\S)+)/i);
				if (matches) {
					var obj = {
						content : matches[1],
						charset : matches[2],
						encoding : matches[3]
					}
					var section="";
					var actual = structure[i];
					while(actual.depth>1){
						section=(actual.leftNoEmpty+1) +(section?".":"")+ section;
						actual = structure[actual.parent]
					}
					
					obj.section = section ? section : 1;					
					if(matches[1].toLowerCase()=="html"){
						html = obj;	
					}else{
					    plain = obj;	
					}
				}
			}
						   
	}
	return plain ? plain : html;
}
//rozparsovanie search response - idecka sprav
FoxcubService.Email.ImapReader.prototype._parseSearchAnswer = function(data){
  	var ids = [];  	
  	var strIds = data.split(this.SEP)[0].split(" ");
  	
  	for(var i in strIds){
  		if(strIds[i].match(/^\d+$/)){
  			ids.push({id:parseInt(strIds[i])});
  		}
  	}
  	ids.sort(function(a,b){
  		return b.id - a.id;
  	});
  	return ids;
}
//uzatvorenie streamu
FoxcubService.Email.ImapReader.prototype.state_close = function(){
	var command = this.last.command;
	var success = this.last.success;
		switch (command) {
			case this.STATE_CHANGE :
				 this.finished = true;
				 this._go('LOGOUT','LOGOUT');
				 break;
			default : this._close();
					  break;
	   }
}
//posleme dalsi prikaz a ulozime stavovu informaciu
FoxcubService.Email.ImapReader.prototype._go = function(cmd,command,success){ 	
  	this._set(command,success);	
  	if(cmd!==null){
  		this._write(cmd);
  	}else{
  		this._exec();
  	}
}
//nastavi stavovu informaciu
FoxcubService.Email.ImapReader.prototype._set = function(command,success){
    this.last.command = command ? command : "";
    this.last.success = success ? true : false;
}
//posunieme sa o stav vysie
FoxcubService.Email.ImapReader.prototype._nextState = function(){
    this._set(this.STATE_CHANGE,true);
	this.state ++;
	this._exec();
}
//spusti funkcu zodpovednu za sapracovanie responsu pre aktualny stav
FoxcubService.Email.ImapReader.prototype._exec = function(){
	for(var i in this){
		if(i.indexOf("STATE_")==0 && this[i]==this.state){
			this[i.toLowerCase()]();
			break;
		}
	}
}
//vytvory atom - jednoznacny identyfikator requestu napr: A00001, A00002 ... 
FoxcubService.Email.ImapReader.prototype._atom = function(){
	this.atomCounter++;
	var maxSize = 5;
	var atomID = ""+this.atomCounter;
	var prefix = "A";
	for(var i=atomID.length;i<maxSize;i++) prefix += "0";
	this.atom=prefix + atomID;
	this.data="";
	return this.atom;
}

FoxcubService.Email.ImapReader.prototype._write = function(cmd){ 	
  	this.socketReader.write(this._atom() + " " + cmd + this.SEP);
}
FoxcubService.Email.ImapReader.prototype._close = function(data){
  	if(this.socketReader)this.socketReader.close();
}
