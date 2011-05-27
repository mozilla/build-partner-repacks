var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Logger = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Logger",
	VERSION: "0.1"
});
//import podtried
Components.utils.import("resource://foxcub/components/subclasses/parentLog.js");
Components.utils.import("resource://foxcub/components/subclasses/windowLog.js");
Components.utils.import("resource://foxcub/components/subclasses/consoleLog.js");
Components.utils.import("resource://foxcub/components/subclasses/fileLog.js");
//spravy
FoxcubService.Logger.prototype.BKEY1 = FoxcubService.$("FS.Logger.log.inited");
// preferencie lištičky
FoxcubService.Logger.prototype.FXB_PREFERENCE_BRANCH = "extensions.foxcub.";
// povinne parametre pre komponetu
/**
 * JSM modul stara sa o logovanie
 */
FoxcubService.Logger.prototype.$constructor = function(){
	this.enabled = true;
	this.logWin = null;
	this.logFolder = [];
	//reader preferencii
	this.fxbPrefReader = new FoxcubService.Logger.PrefReader(this.FXB_PREFERENCE_BRANCH,this);
	this.jsPrefReader = new FoxcubService.Logger.PrefReader("javascript.",this);
	
	this.preferenceObserver = null;
	//zistime kam chceme a kam mozme logovat
	this.winEnable = !!this.fxbPrefReader.prefReadBool("logging.toWin");
	this.filesEnable = !!this.fxbPrefReader.prefReadBool("logging.toFile");
	this.outputToFFConsole = !!this.fxbPrefReader.prefReadBool("logging.toFFConsole");
	//je dovolene logovat do ffconzole?
	this.consoleEnable = !!this.jsPrefReader.prefReadBool("options.showInConsole");
	
	
	
	this.optionWin = null;
	
	this.inited = false;
	
	this.windowLog =  null;
	this.consoleLog = null;
	this.fileLog = null;
	this.init();
};

/**
 * je zapnute logovanie OBSOLETE!!!
 */
FoxcubService.Logger.prototype.isLoggingEnabled = function(){
	return (this.winEnable || this.filesEnable || (this.consoleEnable && this.outputToFFConsole));
}
/**
 * inicializacia - vola sa z konstruktora
 * 
 */
FoxcubService.Logger.prototype.init = function(){
	//inicializacia jednotlivych tried na logovanie
	this.windowLog = new FoxcubService.Logger.WindowLog(this.winEnable);
	this.consoleLog = new FoxcubService.Logger.ConsoleLog(this.consoleEnable && this.outputToFFConsole);
	this.fileLog = new FoxcubService.Logger.FileLog(this.filesEnable);
	//observer preferencii
	this.preferenceObserver = new FoxcubService.Logger.PrefObserver("extensions.foxcub.",this,this.preferenceAction);
	this.preferenceObserver.register();
	//logovanie js do konzoly musi byt povolene vo ff
	this.jsPreferenceObserver = new FoxcubService.Logger.PrefObserver("javascript.options.",this,this.jsPreferenceAction);
	this.jsPreferenceObserver.register();
	this.inited = true;
	this.log(this.BKEY1);
}
/**
 * povoluje/zakazuje logovanie na konkretne miesta (okno,subor,ffkonzola)
 */
FoxcubService.Logger.prototype.preferenceAction = function(subject,topic,data){
	var value = false;
	
	switch(data){
		case "logging.toWin":
			value = this.fxbPrefReader.prefReadBool(data);
			this.windowLog.enable(value);
			break;
		case "logging.toFile":
			value = this.fxbPrefReader.prefReadBool(data);
			this.fileLog.enable(value);
			break;
		case "logging.toFFConsole":
			value = this.fxbPrefReader.prefReadBool(data);
			this.outputToFFConsole = value;
			this.consoleLog.enable(this.consoleEnable && value);
			break;
		default:
			break;
	}
	
};
/**
 * akcia pri zmene js nastavenia o logovani do konzoly<br>
 * - v pripade ze je zapnute option window updatne sa zmena
 */
FoxcubService.Logger.prototype.jsPreferenceAction = function(subject,topic,data){
	
	if(data == "showInConsole"){
		this.consoleEnable = this.jsPrefReader.prefReadBool("options.showInConsole");
		this.consoleLog.enable(this.outputToFFConsole && value);
		try {
			this.optionWin.action();
		} catch(e){}
	}
}
/**
 * vola sa z logSettings konstruktoru .. ovladanie checboxu pri logovani do ffkonzoly
 * @param {object} obj - logSettings
 */
FoxcubService.Logger.prototype.optionRegister = function(obj){
	this.optionWin = obj;
}


/**
 * hlavna funkcia na logovanie
 * @param {object} msg
 */
FoxcubService.Logger.prototype.log = function(msg){
	this.windowLog.log(msg);
	this.consoleLog.log(msg);
	this.fileLog.log(msg);
};


/**
 * Otvor logovacie okno - logservice .. (poklikanie na ikonku)
 */
FoxcubService.Logger.prototype.clientOpenWin = function(){
	this.windowLog.enable(true);
}

/**
 * Observer preferencii .. 
 * @param {string} branchName - skupina preferencii
 * @param {object} owner - trieda na ktorej sa vola callback
 * @param {} callback - funkcia spracuvavajuca zmenu preferencii
 */
FoxcubService.Logger.PrefObserver = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Logger.PrefObserver",
	VERSION: "1.0"
});

FoxcubService.Logger.PrefObserver.prototype.QI = Components.interfaces.nsIPrefBranch2;

FoxcubService.Logger.PrefObserver.prototype.$constructor =  function(branchName,owner,callback){
	this.branchName = branchName;
	this._owner = owner;
	this._callback = callback;
	this.prefService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
	this.branch = this.prefService.getBranch(this.branchName);
	this.branch.QueryInterface(this.QI);
}


FoxcubService.Logger.PrefObserver.prototype.$destructor = function(){
	this.unregister();
};

FoxcubService.Logger.PrefObserver.prototype.register = function(){
	this.branch.addObserver("", this, false);
};

FoxcubService.Logger.PrefObserver.unregister = function(){
	this.branch.removeObserver("", this);
};

FoxcubService.Logger.PrefObserver.prototype.observe = function(aSubject, aTopic, aData){
	if(aTopic != "nsPref:changed") { 
		return;
	}
	
	this._callback.apply(this._owner,[aSubject, aTopic, aData]);
};
/**
 * Manager preferencii .. 
 * @param {string} branchName - skupina preferencii
 */
FoxcubService.Logger.PrefReader = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Logger.PrefReader",
	VERSION: "1.0"
});


FoxcubService.Logger.PrefReader.prototype.$constructor = function(branchName,owner){
	this.prefBranchName = branchName;
	this._owner = owner;
	this.preferenceService = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
	this.prefBranch = this.preferenceService.getBranch(this.prefBranchName);
};

FoxcubService.Logger.PrefReader.prototype.prefReadBool = function(key){
	var out = null;
	try {
		out = this.prefBranch.getBoolPref(key);
	} catch(e){
		// logovat WRN ?
	}
	return out;
};

