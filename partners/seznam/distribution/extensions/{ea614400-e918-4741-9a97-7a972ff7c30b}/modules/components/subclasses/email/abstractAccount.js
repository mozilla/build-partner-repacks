var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.AbstractAccount = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.AbstractAccount",
			VERSION : "0.1",
			IMPLEMENT : [FoxcubService.LogInterface]
});
FoxcubService.Email.AbstractAccount.prototype.MAX_CHECK_TIME = 30000;
FoxcubService.Email.AbstractAccount.prototype.INTERVAL = 500;

FoxcubService.Email.AbstractAccount.prototype.ERROR_NO = 0;
FoxcubService.Email.AbstractAccount.prototype.ERROR_PWD = 1;
FoxcubService.Email.AbstractAccount.prototype.ERROR_UNKNOWN = 2;
//maximalny cas po ktorom musi request mat vysledok
FoxcubService.Email.AbstractAccount.prototype.MAX_REQUEST_TIME = 2 * 60 * 1000;
/**
 * abstraktna trieda, obsahuje funkcie spolocne pre vsetky ucty
 * @param {} data
 */
FoxcubService.Email.AbstractAccount.prototype.$constructor = function(data){
	// nastavenia uctu
	this.data = data;
	this.domain = data.domain;
	//skoncila kontrola ?
	this.finished = true;
	this.result = null;
	//zaciatok kontroly
	this._startTime = 0;
	//podporovane akcie(menu - napr.: citat spravy ... )
	this.supportedActions = null;
	//data podporovanych akcii - tieto sa nahradzaju .. pozri konfig
	this.supportedActionsData = {standard:{
		name:this.data.username,
		jmeno:this.data.username,
		login:this.data.login,
		heslo:this.data.password,
		password:this.data.password,
		domena:this.data.domain.name,
		domain:this.data.domain.name,
		email:this.data.username + '@' + this.data.domain.name,
		prijemce:this.data.username + '@' + this.data.domain.name,
		to:""
	},msgs:{}};
	
}
//updatne informacie o ucte (stavovove - napr posled ids pri pop3 a imap, alebo lasttimestamp pri biff)
FoxcubService.Email.AbstractAccount.prototype._updateAccountData = function(prop,newVal){	
	var accountsData = FoxcubService.pref.get().getPref("mail.accountsBckp",true);	
	accountsData = accountsData.success ? accountsData.value : {};
	if(accountsData[this.data.id]){
		accountsData[this.data.id][prop] = newVal;
		FoxcubService.pref.get().setPref("mail.accountsBckp",accountsData);
		var accountsData = FoxcubService.pref.get().getPref("mail.accountsBckp",true).value;
		this.data[prop] = accountsData[this.data.id][prop]
	}
	
}
//zahaji kontrolu
FoxcubService.Email.AbstractAccount.prototype.check = function(){
	this.log("check start");
	this.finished = false;
	this.result = null;
	//nastavi zaciatok kontroly .. (kontroluje sa ci nepresiel cas ktory ma account na ziskanie sprav)
	this._startTime = new Date().getTime();
	//tuto metodu si kazdy account implementuje po svojom
	this._check();
}
//akcia pri chybe .. 
FoxcubService.Email.AbstractAccount.prototype._onError = function(e){
	
	this.result = {
		id : this.data.id,
		name : this.data.fullName,
		error:e,
		state : {
			newMsg : 0,
			unreadMsg : 0,
			states : []
		},
		activeState : this.data.active	
	}
	this.finished = true;
}
//akcia pri uspechu
FoxcubService.Email.AbstractAccount.prototype._onSuccess = function(state){
	if(this.finished)return;
	// ulozime info o novych spravach - pre akcie z menu
	if(state && state.states && state.states.length){
		for(var i in state.states){
			this.supportedActionsData.msgs[state.states[i].id] = {
				IDzpravy:state.states[i].id,
				messageId:state.states[i].id,
				odesilatel:state.states[i].from,
				subjekt:state.states[i].subject
			}
		
		}
		
	}
	//naplnime result
	this.result = {
		id : this.data.id,
		name : this.data.fullName,
		error:this.ERROR_NO,
		state : state,
		activeState : this.data.active			
	}
	this.finished = true;
}

FoxcubService.Email.AbstractAccount.prototype._makeSupportedAction = function(action,type) {
	if(this.data.domain.attrs[action]){
		//FoxcubService.debug(this.data.domain.attrs.toSource());
		this.supportedActions[action]={
				action:this.data.domain.attrs[action],
		  		type:type,
		  		label:FoxcubService.$('FS.email.actions.'+action)
			
		}
	}
}
//zistime ktore akcie su dostupne (na ktore akcie existuje script)
FoxcubService.Email.AbstractAccount.prototype.getSupportedActions = function(id) {
	
	if(this.supportedActions == null){
		this.supportedActions = {};
		this._makeSupportedAction('mailbox','menu');
		this._makeSupportedAction('compose','menu');
		this._makeSupportedAction('homepage','menu');
		this._makeSupportedAction('showmsg','msg');		
		
	}

	return FoxcubService.functions.clone(this.supportedActions);
		
}
FoxcubService.Email.AbstractAccount.prototype.getSupportedActionsData = function(id) {
		return FoxcubService.functions.clone(this.supportedActionsData);
}
//abstraktna metoda - accounty si ju implementuju po svojom
FoxcubService.Email.AbstractAccount.prototype._getResult = function(){
	
}
//metoda ktora sa pravidelne vola v sluzbe mailov 
FoxcubService.Email.AbstractAccount.prototype.getResult = function(){
	//ak sa prekrocil povoleny cas skoncime - 2 min
	if((new Date().getTime() - this._startTime)>this.MAX_REQUEST_TIME){
		this._onError(this.ERROR_UNKNOWN)
	}else{
		this._getResult();
	}	
	return (this.finished)?this.result:null;
}
//abstraktna metoda - accounty si ju implementuju po svojom
FoxcubService.Email.AbstractAccount.prototype._check = function(){

}


