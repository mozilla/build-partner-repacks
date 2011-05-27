var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

var addonManagerAvail = false;
try{
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	addonManagerAvail = true;
}catch(ex){}
/**
 * Trieda sleduje uninstalaciu resp update listicky
 */
FoxcubService.BaseManager = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.BaseObserver",
			VERSION : "0.1"
		});

FoxcubService.BaseManager.prototype.ACTION_NONE = 0;
FoxcubService.BaseManager.prototype.ACTION_UPGRADE = 1;
FoxcubService.BaseManager.prototype.ACTION_UNINSTALL = 2;
FoxcubService.BaseManager.prototype.$constructor = function() {
	this.extAction = this.ACTION_NONE;
	if(addonManagerAvail){
		// ak je dostupny pracujeme s ff4
		AddonManager.addAddonListener(this)
		FoxcubService.FF4 = true;
	}else{
		// inac sledujeme base .. 
		this.exObserver = new FoxcubService.BaseObserver(this,this.extensionObserverProcess,['em-action-requested'])	
		this.exObserver.registerAll();	
	}
	this.bsObserver = new FoxcubService.BaseObserver(this,this.onShutDown,['quit-application-granted'])
	this.bsObserver.registerAll();
}
//akcia pri vypnuti ff 
FoxcubService.BaseManager.prototype.onShutDown = function() {
	switch (this.extAction) {
		case this.ACTION_UPGRADE :
		    //ak je upgrad nastavime priznak
			FoxcubService.pref.get().setPref("instance.upgraded",1);
			break;
		case this.ACTION_UNINSTALL :
			try{
				//ak je uninstall pokusime sa odinstalovat listicku
				FoxcubService.install.uninstall();
			}catch(e){
				FoxcubService.debug(e.toString() + " " + e.fileName + " " + e.lineNumber, "error")
			}
			
			break;
	}
}
//akcie pri zmene nastaveni
FoxcubService.BaseManager.prototype.extensionAction = function(eid,action){

	if (FoxcubService.EXTENSION_ID == eid) {
		switch (action) {
			case "item-upgraded" :
				//bola zaslana informacia o tom ze sa bude upgradovat
				this.extAction = this.ACTION_UPGRADE;
				break;
			case "item-uninstalled" :
				//bola zaslana informacia o tom ze sa bude odinstalovavat
				this.extAction = this.ACTION_UNINSTALL;
				break;
			case "item-cancel-action" :
				//zrusenie predchadzajucich poziadaviek - (napr.: uzivatel zrusi odinstalovanie pluginu)
				this.extAction = this.ACTION_NONE
				break;
		}
	}
}

//pre ff < 4 - sledovanie pomocou base observeru
FoxcubService.BaseManager.prototype.extensionObserverProcess = function(subject,topic,data){	
	var ext = subject.QueryInterface(Components.interfaces.nsIUpdateItem);
	this.extensionAction(ext.id,data);
}



//AddonListener ff >= 4 - funkcie addon listeneru
FoxcubService.BaseManager.prototype.onInstalling = function(addon){
	this.extensionAction(addon.id,"item-upgraded");
}
FoxcubService.BaseManager.prototype.onUninstalling = function(addon){
	this.extensionAction(addon.id,"item-uninstalled");
}
FoxcubService.BaseManager.prototype.onOperationCancelled = function(addon){
	this.extensionAction(addon.id,"item-cancel-action");
}