var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
 * account pre imap
 */
FoxcubService.Email.ImapAccount = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.ImapAccount",
			EXTEND : FoxcubService.Email.AbstractAccount,
			VERSION : "0.1"
		});

FoxcubService.Email.ImapAccount.prototype.$constructor = function(data){
	this.$super(data);
	this.reader = null;
	this.i=0;
}
//zisti ktore spravy su nove - podla ulozenych ideciek
FoxcubService.Email.ImapAccount.prototype.handleIds = function(allIds){
	var out = {
		newIds : [],
		unSeenIds : []
	}
	stored = this.data.imapids;
	
	//zistime ci su niake nove
	for (var i in allIds) {
		var isNew = true;
		for (var ii in stored) {
			if (allIds[i].id == stored[ii].id) {
				isNew = false;
				break;
			}
		}
		if (isNew) {
			out.newIds.push(allIds[i]);
		} else {
			out.unSeenIds.push(allIds[i]);
		}
	}
	// ulozime posledne ziskane ids
	this._updateAccountData('imapids',allIds);
	return out;
};
//zahajenie kontroly
FoxcubService.Email.ImapAccount.prototype._check = function(){
	this.reader = null;
	var matches = this.data.domain.attrs.server.match(/^([A-Za-z0-9_.]+):(\d+)$/);
		
	if(matches && this.data.password && this.data.active){
		var host = matches[1];
		var port = matches[2];
		var ssl = this.data.domain.attrs.ssl;
	
		var login = this.data.login;
		var password = this.data.password;
		
		this.reader = new FoxcubService.Email.ImapReader(host,port,ssl,login,password,this);
		this.reader.init();
		
	}else{
		this._onError(this.ERROR_UNKNOWN);
	}

};
//pri volani getResult - kontrola ci uz je hotove vsetko
FoxcubService.Email.ImapAccount.prototype._getResult = function(){
	if(this.reader){
		
		if(this.reader.finished){
			if(this.reader.error){
				this._onError((this.reader.error == this.reader.ERROR_LOGIN)?this.ERROR_PWD:this.ERROR_UNKNOWN);
			}else{			
				var state = {
					//pocet novych
					newMsg : this.reader.result.newCount,
					//pocet necitanych
					unreadMsg : this.reader.result.unSeenCount,
					//texty sprav
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