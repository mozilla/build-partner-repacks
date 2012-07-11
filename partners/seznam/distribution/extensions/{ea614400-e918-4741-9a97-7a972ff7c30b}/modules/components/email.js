var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email",
			IMPLEMENT : [FoxcubService.LogInterface,FoxcubService.RPCInterface],
			VERSION : "0.1"
		});
Components.utils.import("resource://foxcub/components/subclasses/email/abstractAccount.js");
Components.utils.import("resource://foxcub/components/subclasses/email/checkCompute.js");
Components.utils.import("resource://foxcub/components/subclasses/email/sockedReader.js");
Components.utils.import("resource://foxcub/components/subclasses/email/mailParser.js");
Components.utils.import("resource://foxcub/components/subclasses/email/imapReader.js");
Components.utils.import("resource://foxcub/components/subclasses/email/imapAccount.js");
Components.utils.import("resource://foxcub/components/subclasses/email/pop3Reader.js");
Components.utils.import("resource://foxcub/components/subclasses/email/pop3Account.js");
Components.utils.import("resource://foxcub/components/subclasses/email/seznamAccount.js");
Components.utils.import("resource://foxcub/components/subclasses/email/offAccount.js");
Components.utils.import("resource://foxcub/components/subclasses/email/scriptParser.js");
/**
 * hlavna mailova sluzba .. kontroluje maily a nacitava ucty a nastavenie domen  
 */
FoxcubService.Email.prototype.MAX_NEW_MESSAGES = 10; /* spravne jich ma byt 10 ! */
FoxcubService.Email.prototype.$constructor = function() {
	this.log("constructor start", "info");
	this.enabled = false;
	this.checkCompute = null;
	this.lastResults = null;
	//zasobnik aktualne zapnutych okien
	this.winFolder = {};	
	this.domains = {};
	this.accounts = {};
	this.dblclickAccount = null;
	//docasne hesla uctov
	this.tmpPasswords = {};
	//timer na pravidelnu kontrolu mailov
	this.checkTime = 500;
	this.checkTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.check = FoxcubService.JAK.bind(this,this._check);
	this.checkEvent = { 
		notify: this.check 
	};	
	//kontrola uplnosti správ
	this.checkFinishedTime = 500;
	this.checkFinishedTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.checkFinished = FoxcubService.JAK.bind(this,this._checkFinished);
	this.checkFinishedEvent = { 
		notify: this.checkFinished 
	};	
	
	//trieda vyratavajuca cas nasledujucej kontroly
	this.checkCompute = null;

	this.timestamp = 0;
	this.newMessagesFolder = [];
	this.checkDelay = 0;
	//observer preferencii
	this.preferenceObserver = new FoxcubService.FXBPrefObserver(this,this.preferenceAction);
	//pre istotu nastavime informaciu o zmene na false;
	FoxcubService.pref.get().setPref('mail.optionchanged',false);
	this.log("constructor end", "info");
};
//nastavi docasne hesla (vola sa z optionov pri ukladani mailov)
FoxcubService.Email.prototype.setTmpPasswords = function(passwords){
	this.tmpPasswords = passwords;
};

//zrata pocet novych sprav a ulozi ich do buffru, dalej nastavi cas dalsej kontroly
FoxcubService.Email.prototype._setResult = function(results){
	//poslem vsetkym oknam informaciu o update.setState(this.states)
	this.lastResults = results;
	this.execAll('setResult',results);
	/* projdu data vsech uctu */
	/* celkovy pocet prave doslych zprav */
	var count = 0;
	for(var i = 0; i < results.length; i++){
		if(results[i].error){
			continue;
		}
		if(results[i].state.newMsg > 0){
			/* pokud jsou nove zpravy nasypu si je do fronty */
			var accountData = results[i].state.states;
			count += accountData.length;
			for(var j = 0; j < accountData.length; j++){
				/* prochazimm vsechny nove zpravy pro dany ucet */
				var item = {};
				
				item.accountId = results[i].id;
				item.accountName = results[i].name;
				
				for(var k in accountData[j]){
					item[k] = accountData[j][k];
				}
				/* pridam do zasobniku */
				this.newMessagesFolder.push(item);
				if(this.newMessagesFolder.length > this.MAX_NEW_MESSAGES){
					/* pokud si pamatuju vice nez povoleny pocet zprav, nejstarsi zahodim */
					this.newMessagesFolder.shift();
				}
			}
		}
	}
	//pridam do statistik count - pocet novych, timestamp - cas posledneho posielania
	//FoxcubService.debug(count );
	//FoxcubService.debug(this.timestamp );
	this.checkCompute.collectStat(count,this.timestamp);
	//vyrata nasledujuci cas kontroly
	var nextCheck = this.checkCompute.calculateNextCheck();
	var interval = this.checkCompute.calcCheckInterval();	
	this.checkDelay = interval * 1000;
	//FoxcubService.debug(this.checkDelay );
	this.checkTimer.cancel();
	//naplanovanie dalsej kontroly
	this.checkTimer.initWithCallback(this.checkEvent,this.checkDelay,1);
	
	//var x = FoxcubService.pref.get().getPref("mail.conf.weekIncome").value;
	//zrata nove hodnoty kedy sa bude kontrolovat
	FoxcubService.pref.get().setPref("mail.conf.lastCheck",this.timestamp);
	FoxcubService.pref.get().setPref("mail.conf.lastIncome",this.checkCompute.getLastIncome());
	FoxcubService.pref.get().setPref("mail.conf.weekIncome",this.checkCompute.getWeekIncome());
	this._showMessagesBubble();
};
//zobrazi bublinu z novymi spravami ked wokno dostane fokus
FoxcubService.Email.prototype.focusedAction = function(obj){
	
	this._showMessagesBubble();
};
//posle nove spravy aktivnemu oknu ak existuje
FoxcubService.Email.prototype._showMessagesBubble = function(){
	if(this.newMessagesFolder.length){
		for(var i in this.winFolder){
			if(FoxcubService.windowHelper.isWindowActive(this.winFolder[i].window)){
				this.winFolder[i].email.showBubble(this.newMessagesFolder.splice(0,this.newMessagesFolder.length));
				this.log("new messages sent","info");
				return true;
			}
		} 
	}
};
/** prevzate zo starych mailov END*/
//inicializacia .. vola sa pri registracii prveho okna(chrome)
FoxcubService.Email.prototype.init = function(foxcubChrome) {
	this.preferenceObserver.register();
	//vypocet dalsej kontroly
	var lastCheck = FoxcubService.pref.get().getPref("mail.conf.lastCheck").success ?  FoxcubService.pref.get().getPref("mail.conf.lastCheck").value : 0;
	var weekIncome = FoxcubService.pref.get().getPref("mail.conf.weekIncome").success ?  FoxcubService.pref.get().getPref("mail.conf.weekIncome").value : 0;
	var lastIncome = FoxcubService.pref.get().getPref("mail.conf.lastIncome").success ?  FoxcubService.pref.get().getPref("mail.conf.lastIncome").value : 0;
	this.checkCompute = new FoxcubService.Email.CheckCompute(lastCheck,weekIncome,lastIncome);
	//ziskanie domen a uctov
	this.reSet();
	
}
//registracia okna - spusti inicializaciu alebo preda aktualny stav novemu oknu
FoxcubService.Email.prototype.registerWin = function(foxcubChrome) {
	var boss = this._getBoss();
	this.winFolder[foxcubChrome.fxbInstanceId] = foxcubChrome;
	
	if(boss===null){
		this.init();
	}else{
		if(this.lastResults) foxcubChrome.email.setResult(this.lastResults);
		foxcubChrome.email.setEnabled(this.enabled);	
	}
}
//resetne ucty a domeny
FoxcubService.Email.prototype.reSet = function(foxcubChrome) {	
	this.accounts = {};
	this.domains = {};
	this.execAll('reSet');
	this.getDomains();
	this.getAccounts();
	this.setEnabled();	
}
//odregistruje okno zo servisu
FoxcubService.Email.prototype.unregisterWin = function(foxcubChrome) {
	this.winFolder[foxcubChrome.fxbInstanceId] = null;
	delete(this.winFolder[foxcubChrome.fxbInstanceId]);
}
//spusti vypne email
FoxcubService.Email.prototype.setEnabled = function() {
	this.enabled = FoxcubService.pref.get().getPref("mail.enable").value;
	this.checkTimer.cancel();
	this.checkFinishedTimer.cancel();	
	if(this.enabled){
		this._check();
	}
	//to iste pre vsetky okna v buffry
	this.execAll('setEnabled',this.enabled);
}
//spusti metodu na vsetkych zaregistrovanych oknach
FoxcubService.Email.prototype.execAll = function() {
	var func = arguments[0];
	var arr = [];
	for(var i=1;i<arguments.length;i++){
		arr.push(arguments[i]);
	}
	
	for(var i in this.winFolder){
		this.winFolder[i].email[func].apply(this.winFolder[i].email,arr);
	}
}
//ziska ucty z preferencii
FoxcubService.Email.prototype.getAccounts = function() {
	this.accounts = {};
	this.dblclickAccount = null;
	var accountsData = FoxcubService.pref.get().getPref("mail.accountsBckp",true);	
	accountsData = accountsData.success ? accountsData.value : {};
	//dekodovanie hesiel resp, pouzitie docasnych
	for(var i in accountsData){
		accountsData[i].id = i;
		if(accountsData[i].password){
			 accountsData[i].password = FoxcubService.functions.encoding.decrypt(accountsData[i].password);		
		}else if(this.tmpPasswords[i]){
			 accountsData[i].password = this.tmpPasswords[i];
		}		
	}
	//inicializacia tried ktore sa staraju o konkretny typ accountu
	for(var i in accountsData){
		var account = accountsData[i];
		account.domain = this.domains[account.domain];
		//FoxcubService.debug(account.toSource())
		var instance = null;
		switch(account.domain.attrs.mode){
			case 'biff': instance = new FoxcubService.Email.SeznamAccount(account);
						 break;
			case 'pop3': instance = new FoxcubService.Email.Pop3Account(account);
						 break;
			case 'imap': instance = new FoxcubService.Email.ImapAccount(account);
						 break;
			case 'off' : instance = new FoxcubService.Email.OffAccount(account);
						 break;
			
		}
		if(instance){
			if(accountsData[i].dblclickAccount)this.dblclickAccount = i;
			this.accounts[i] = instance;
		}
			
	}
	
}
FoxcubService.Email.prototype.getDblClickAccount = function(){
	return this.dblclickAccount;
}

//ziskanie aktivnych domen
FoxcubService.Email.prototype.getDomains = function() {
	this.domains = {};
	var defDomains = {};
	var attrs = ['mode','server','compose','homepage','mailbox','showmsg','defUser','ssl'];
	var def = FoxcubService.config.get("email");
	//load defaultnych domen - z konfigu
	for(var i in def.domain){
		var attrsObj = def;
		defDomains['def_'+def.domain[i]] = {
				name:def.domain[i],
				id:'def_'+def.domain[i],
				attrs:{}				
			}			
		var spec = FoxcubService.config.get("email::"+def.domain[i]);
		if(spec != ""){
			var attrsObj = spec;
		}
		for(var ii in attrs){
			if(attrs[ii] in attrsObj){
				defDomains['def_'+def.domain[i]]['attrs'][attrs[ii]] = attrsObj[attrs[ii]];			
			}else{
				defDomains['def_'+def.domain[i]]['attrs'][attrs[ii]] = "";
			}
		}
	}
	//load ulozenych domen
	var storedDomains = FoxcubService.pref.get().getPref("mail.accountsDomains", true);
	storedDomains = (storedDomains.success)?storedDomains.value:{};
	//merge nazaver
	for(var i in storedDomains){
		this.domains[i]=storedDomains[i]	
	}
	for(var i in defDomains){
		this.domains[i]=defDomains[i]
	}
}
//zahajenie kontroly mailov
FoxcubService.Email.prototype._check = function() {
	
	if(!this.enabled){
		return;
	}
	
	this.log("check start")
	this.checking = true;
	for(var i in this.accounts){
		this.accounts[i].check();
	}
	//kazdu polsekundu sa spytame accountou ci uz skoncila kontrola
	this.checkFinishedTimer.initWithCallback(this.checkFinishedEvent,this.checkFinishedTime,this.checkFinishedTimer.TYPE_REPEATING_SLACK);
	this.execAll('setChecking');
}
//data pre akcie v menu
FoxcubService.Email.prototype.getSupportedActionsData = function(id) {
	return this.accounts[id].getSupportedActionsData(id);	
}
//vrati podporovane akcie pre polozku v menu
FoxcubService.Email.prototype.getSupportedActions = function(id) {
	return this.accounts[id].getSupportedActions();	
}
//vynutena kontrola z menu
FoxcubService.Email.prototype.forceCheck = function(){
	if(!this.checking){
		this.setEnabled();
	}

}
/*
skoncila uz kontrola mailov ?
 */
FoxcubService.Email.prototype._checkFinished = function(subject,topic,data) {
	this.log("checking...");
	try {
		var ok = false;
		var results = [];
		for (var i in this.accounts) {
			var result = this.accounts[i].getResult();
			if(result==null){
				ok = true;
				break;
			}
			results.push(result);
		}

		this.checking = ok;
		this.log("finished:" + !this.checking)
		
		//ak skoncila
		if (!this.checking) {
			this.timestamp = new Date().getTime()/1000;
			this.checkFinishedTimer.cancel();
			//FoxcubService.debug(results.toSource());
			//nastavime vysledok
			this._setResult(results);
			
		}
	} catch (e) {
		this.log(e.toSource() + "   ", "error")
		this.checkFinishedTimer.cancel();
	}	
	
	
	
	
}

FoxcubService.Email.prototype.preferenceAction = function(subject,topic,data) {
	//zmena nastavenia uctov
	if(data == "mail.optionchanged"){
		var value = FoxcubService.pref.get().getPref(data).value;
		if(value){
			FoxcubService.pref.get().setPref(data,false);
			this.reSet();
		}
	}
	//vypnutie zapnutie mailov
	if(data == "mail.enable"){
			this.setEnabled();
	}
}

//zyskanie prveho okna zo zasobniku
FoxcubService.Email.prototype._getBoss = function(){
	for(var i in this.winFolder){
		return this.winFolder[i];
	} 
	return null;
};