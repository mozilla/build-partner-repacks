var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
 * account pre pop3
 */
FoxcubService.Email.Pop3Account = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.Pop3Account",
			EXTEND : FoxcubService.Email.AbstractAccount,
			VERSION : "0.1"
		});

FoxcubService.Email.Pop3Account.prototype.$constructor = function(data){
	this.$super(data);
	this.reader = null;
	this.i="0";
}

FoxcubService.Email.Pop3Account.prototype.handleIds = function(allIds){
	var out = {
		newIds : [],
		unSeenIds : [],
		order:1
	}
	stored = this.data.pop3ids;
	
	//zistime ci su niake nove
	for (var i in allIds) {
		var isNew = true;
		allIds[i].reseted = false;
		for (var ii in stored) {
			if (allIds[i].mailId == stored[ii].mailId) {
				allIds[i].reseted = !!(stored[ii].reseted);
				isNew = false;
				break;
			}
		}
		if (!allIds[i].reseted) {
			if (isNew) {
				out.newIds.push(allIds[i]);
			} else {
				out.unSeenIds.push(allIds[i]);
			}
		}

	}
	//zistime poradie sprav
	if (out.newIds.length && out.unSeenIds.length) {
		//ak je najvecsie z novych vecsie ako najvecsie zo starych
		out.newIds.sort(function(a,b){
			return (a.id - b.id)
		})
		out.unSeenIds.sort(function(a,b){
			return (b.id - a.id)
		})
		var first = out.newIds[0].id;
		var second = out.unSeenIds[0].id;
		out.order = (first < second) ? 1 : -1;
	} else if (allIds.length > 1) {
		//porovname hodnoty
		var first = allIds[0].mailId;
		var second = allIds[1].mailId;
		if (first.match(/^\d+$/) && second.match(/^\d+$/)) {
			first = parseInt(first);
			second = parseInt(second);

		} else {
			var getVal = function(str) {
				var n = 0;
				for (var i = 0; i < str.length; i++) {
					n += str.charCodeAt(i);
				}
				return n;
			}
			first = getVal(first)
			second = getVal(second)
		}
		out.order = (first < second) ? 1 : -1;
	}
	

	// ulozime posledne ziskane ids
	this._updateAccountData('pop3ids',allIds);
	/*
	var accountsData = FoxcubService.pref.get().getPref("mail.accountsBckp",true);	
	accountsData = accountsData.success ? accountsData.value : {};
	if(accountsData[this.data.id]){
		accountsData[this.data.id].pop3ids = allIds;
		FoxcubService.pref.get().setPref("mail.accountsBckp",accountsData);
		var accountsData = FoxcubService.pref.get().getPref("mail.accountsBckp",true).value;
		this.data.pop3ids = accountsData[this.data.id].pop3ids
	}*/
	return out;
};

//zahajenie kontroly
FoxcubService.Email.Pop3Account.prototype._check = function(){
	this.reader = null;
	var matches = this.data.domain.attrs.server.match(/^([A-Za-z0-9_.]+):(\d+)$/);
		
	if(matches && this.data.password && this.data.active){
		var host = matches[1];
		var port = matches[2];
		var ssl = this.data.domain.attrs.ssl;
	
		var login = this.data.login;
		var password = this.data.password;
		
		this.reader = new FoxcubService.Email.Pop3Reader(host,port,ssl,login,password,this);
		this.reader.init();
		
	}else{
		this._onError(this.ERROR_UNKNOWN);
	}

};
//pri volani getResult - kontrola ci uz je hotove vsetko
FoxcubService.Email.Pop3Account.prototype._getResult = function(){
	if(this.reader){
		if(this.reader.finished){
			if(this.reader.error){
				this._onError((this.reader.error == this.reader.ERROR_LOGIN)?this.ERROR_PWD:this.ERROR_UNKNOWN);
			}else{			
				var state = {
					newMsg : this.reader.result.newCount,
					unreadMsg : this.reader.result.unSeenCount,
					states : []
				}
				var texts = this.reader.result.texts;
				for(var i in texts){
					var obj = {
						// id spravy
						id : texts[i].ID,
						// odosielatel
						from : texts[i].FROM,
						// subjekt
						subject : texts[i].SUBJECT,
						// text
						abstr : texts[i].TEXT
					}
					state.states.push(obj)
				}				
				this._onSuccess(state);
				this.i="0";
			}
		
		}
		else{
			
				if(this.i>"6000"){
					
					if(!this.reader.finished){
			
						this._onError((this.reader.error == this.reader.ERROR_LOGIN)?this.ERROR_PWD:this.ERROR_UNKNOWN);
						
					}	
				}
				this.i++;
			
		}
	
	}
}

FoxcubService.Email.Pop3Account.prototype.getSupportedActions = function(id) {
	var out = this.$super(id);
	
	out['pop3']={
				action:'reset',
				obj:this,
		  		type:'special',
		  		label:FoxcubService.$('FS.email.actions.pop3')			
		}
		
	return out;
		
}
FoxcubService.Email.Pop3Account.prototype.reset = function(id) {
	var stored = this.data.pop3ids;
	for(var i in stored){
		stored[i].reseted = true;
	}
	this._updateAccountData('pop3ids',stored);
	FoxcubService.email.reSet();
}