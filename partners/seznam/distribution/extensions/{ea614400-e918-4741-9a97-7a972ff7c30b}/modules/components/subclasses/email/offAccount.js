var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.OffAccount = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.OffAccount",
			EXTEND : FoxcubService.Email.AbstractAccount,
			VERSION : "0.1"
		});
//prazdny account, iba akcie z menu
FoxcubService.Email.OffAccount.prototype.$constructor = function(data){
	this.$super(data);
}

FoxcubService.Email.OffAccount.prototype._check = function(){
	
};

FoxcubService.Email.OffAccount.prototype._getResult = function(){
	this._onSuccess({newMsg:0,unreadMsg:0,states:[]});
}