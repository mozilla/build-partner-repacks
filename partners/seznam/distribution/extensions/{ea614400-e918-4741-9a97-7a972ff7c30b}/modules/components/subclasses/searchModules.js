var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Install.SearchModules = FoxcubService.JAK.ClassMaker.makeClass({
	NAME:"FoxcubService.Install.SearchModules",
	VERSION:"0.1",
	IMPLEMENT:[FoxcubService.JAK.Components,FoxcubService.LogInterface,FoxcubService.RPCInterface]
});

FoxcubService.Install.SearchModules.prototype.MODULES_URL = "http://download.seznam.cz/vyhledavani/opensearch/{0}.xml";
//FoxcubService.Install.SearchModules.prototype.MODULES_URL = "http://download.seznam.test:80/vyhledavani/opensearch/{0}.xml";
FoxcubService.Install.SearchModules.prototype.MODULE_FILE_NAMES_SUFFIX = ""; /* "_ff" do budoucna!!! */
FoxcubService.Install.SearchModules.prototype.MODULES_FILE_NAMES = ["mapy-cz","firmy-cz","zbozi-cz"];
FoxcubService.Install.SearchModules.prototype.MODULE_HP_NAME = "seznam-cz";
FoxcubService.Install.SearchModules.prototype.HP_URL = "http://www.seznam.cz";
FoxcubService.Install.SearchModules.prototype.KEYWORD_URL = "http://search.seznam.cz/?sourceid={0}&q=";
FoxcubService.Install.SearchModules.prototype.INTERVAL_LENGTH =20000;// 180000;
FoxcubService.Install.SearchModules.prototype.INTERVAL_STEP = 5000;


FoxcubService.Install.SearchModules.prototype.$constructor = function(){
	
	this.components = new Array();
	
	/* zasobnik pro nahravace objektu */
	this.modules = {};
	/* je seznam nastaveny jako prvni modul v nabidce ?*/
	this.seznamIsTop = false;
	/* bind funkce do intervalu */
	this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.timeAction = FoxcubService.JAK.bind(this,this._timeAction);
	this.timeActionEvent = { 
		notify: this.timeAction 
	};
	
	
	
	this.timeCheck = FoxcubService.JAK.bind(this, this._timeCheck);
	/* pocatecni cas sledovani nahrani modulu */
	this.startTime = 0;
	/* sledovaci interval */
	this.interval = 0;
	
	this._hpSet = false;
	
	this.addedModulesName = [];

	this.browserSearchServices = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
	this.prefObserver = new FoxcubService.FXBPrefObserver(this,this.preferenceAction);
	this.log("create end");
};

FoxcubService.Install.SearchModules.prototype.$destructor = function(){
	this.prefObserver.$destructor();
};
/**
 * pusta sa iba pri prvej instalacii,<br>
 * nastavuje vyhladavacie moduly od seznamu ak si to uzivatel praje
 * 
 */
FoxcubService.Install.SearchModules.prototype.init = function(action){
	//if(FoxcubService.RELEASE!=3 || action){
		FoxcubService.pref.get().setPref("speedDial.enabled",true);
	//}
			
	this.setDefaultAction = action;
	
	if(this.setDefaultAction){
		this._setHomePage();
		this._setKeywordURL();
		this._setSearchModules();
	}else{
		var HPFlag = (FoxcubService.RELEASE == 3)?2:((FoxcubService.functions.isHomepageSet()) ? 1 : 3);
		FoxcubService.pref.get().setPref("homepage.state",HPFlag);
	}
	FoxcubService.install.startServices();
	this.prefObserver.register();
	this.log("init end");
	return true;
};


FoxcubService.Install.SearchModules.prototype.start = function() {
	this.timer1 = Components.classes["@mozilla.org/timer;1"]
			.createInstance(Components.interfaces.nsITimer);
	this.askUser = FoxcubService.JAK.bind(this, this._askUser);
	this.askUserEvent = {
		notify : this.askUser
	};
	this.timer1.initWithCallback(this.askUserEvent,1000,this.timer1.TYPE_ONE_SHOT);
}
FoxcubService.Install.SearchModules.prototype._askUser = function(){
	if(FoxcubService.RELEASE == 3){
		this.init(false)
		/*var params = {
			ok:false,
			out:null,
			FoxcubService:FoxcubService
		}
		var features = "chrome,diaolog,centerscreen,resizable=yes";*/
	}else{
		var params = {
			ok:true,
			out:null,
			FoxcubService:FoxcubService
		}
		var features = "chrome,diaolog,centerscreen,modal,resizable=yes";
		try{
			var ss = FoxcubService.windowHelper.getWin().openDialog("chrome://foxcub/content/options/preinstallDialog.xul", "", features,params);
		} catch(e){
			return false;
		}	
	}	
	
	
	return params.out;
};

/**
 * Nastavenie search modules z options
 */
FoxcubService.Install.SearchModules.prototype.preferenceAction = function(subject,topic,data){
	if(data == "serachModules.inited"){
		var value = FoxcubService.pref.get().getPref(data).value;
		
		if(value == 1){
			this.log("serachModules.inited");
			this.setDefaultAction = true;
			this._setSearchModules();
			
		}
	}
}



/**
 *  pridavanie vyhladávaciích modulov - vola sa z observera preferencii<br>
 *  pridavaju sa v triede module
 */
FoxcubService.Install.SearchModules.prototype._setSearchModules = function(setDefault){
	for(var i = 0; i < this.MODULES_FILE_NAMES.length; i++){
		var url = this.MODULES_URL.replace("{0}",this.MODULES_FILE_NAMES[i] + this.MODULE_FILE_NAMES_SUFFIX) + '?sourceid=' + FoxcubService.SOURCE;
		//this.log(url);	
		var id = FoxcubService.JAK.idGenerator();
		this.modules[id] = new FoxcubService.Install.SearchModules.Module(url,this.MODULES_FILE_NAMES[i],this,id);
	}
	
	this.startTime = new Date().getTime();
	this.timer.initWithCallback(this.timeActionEvent,this.INTERVAL_STEP,this.timer.TYPE_REPEATING_SLACK);
};
/**
 *  pridavanie hlavneho vyhladavacieho modulu
 */
FoxcubService.Install.SearchModules.prototype._addHPSearchModule = function(){
	var url =  this.MODULES_URL.replace("{0}",this.MODULE_HP_NAME + this.MODULE_FILE_NAMES_SUFFIX) + '?sourceid=' + FoxcubService.SOURCE;
	//this.log('HP = ' + url);	
	var id = FoxcubService.JAK.idGenerator();
	this._hpSet = true;
	this.modules[id] = new FoxcubService.Install.SearchModules.Module(url,this.MODULE_HP_NAME,this,id);
	
}


/**
 *  kontrola zda znam vsechny instalovane moduly a jejich nasledne nastaveni <br>
 *  
 */
FoxcubService.Install.SearchModules.prototype._timeAction = function(){

	var isDone = true;
	var seznamModule = null;
	//prebehnem zasobnik s modulmi
	for(var i in this.modules){
		//engine nie je null iba v pripade ze sa uz nachadza medzi modulmy
		if(!this.modules[i].getEngine()){
			isDone = false;
		} else {
			if(this.modules[i].type == 'seznam-cz'){
				seznamModule = this.modules[i];
			}
		}
	}
	//pridanie hp modulu
	if(isDone && !this._hpSet){
		this._addHPSearchModule();
		isDone = false;
	} 
	
	/* znam vsechny vyhledavaci moduly a provedu nasledna nastaveni */
	if(isDone && this.setDefaultAction){
		if(seznamModule){
			try {
				seznamModule.moveToTop();
			} catch (e){
			}
		}

		if(this.setDefaultAction){
			this._selectEngine();
		}
		this.timer.cancel()
		this._removeModulesObj();
		
		FoxcubService.pref.get().setPref("serachModules.inited",2);
		
		//this.log('All LOADED ' + (new Date().getTime() - this.startTime))
		return;
	}
	var time = new Date().getTime();
	/* vyprsel cas, smula...*/
	if(time > (this.startTime + this.INTERVAL_LENGTH)){
		window.clearInterval(this.interval);
		//this.log('All NOT LOADED -> intervel cleared')
		this._removeModulesObj();
	}
};

/**
 *  odeberu objekty ktere mely na starost jednotlive moduly 
 */
FoxcubService.Install.SearchModules.prototype._removeModulesObj = function(){
	
	this.addModulesName();
	for(var i in this.modules){
		
		this.modules[i].$destructor();
		this.modules[i] = null;
	}
	this.modules = null;
}

/**
 *  nastaveni homepage XXX!!! - hp
 */
FoxcubService.Install.SearchModules.prototype._setHomePage = function(){
	if(!FoxcubService.functions.isHomepageSet()){
		try {
			var oldHP = FoxcubService.pref.get("browser.startup.").getPref("homepage");
			oldHP = (oldHP.success) ? oldHP.value : "";
			FoxcubService.pref.get().setPref("prev.HP",oldHP);
			FoxcubService.pref.get("browser.startup.").setPref("homepage", this.HP_URL);
			var HPFlag = 2;
		} catch(e){
			this.log(e,"error");
		};
	} else {
		var HPFlag = 1;
	}
	
	FoxcubService.pref.get().setPref("homepage.state",HPFlag);
}

/**
 *  nastavim hledani z adresniho radku 
 */
FoxcubService.Install.SearchModules.prototype._setKeywordURL = function(){
	var url = this.KEYWORD_URL.replace("{0}",FoxcubService.SOURCEID);	
	try {
		
		var oldURL = FoxcubService.pref.get("keyword.").getPref("URL");
		oldURL = (oldURL.success) ? oldURL.value : "";
		FoxcubService.pref.get().setPref("prev.KWD",oldURL);
		FoxcubService.pref.get("keyword.").setPref("URL", url);
	} catch(e) {
		this.log(e,"error");
	}
}

/**
 *  nastavim seznam jako vybrany vyhledavaci engine, projevi se az po restartu 
 */
FoxcubService.Install.SearchModules.prototype._selectEngine = function(){
	var oldSELp = FoxcubService.pref.get("browser.search.").getPref("selectedEngine");
	var oldSEL = (oldSELp.success) ? oldSELp.value : "";
	FoxcubService.pref.get().setPref("prev.search.selected",oldSEL);
	FoxcubService.pref.get("browser.search.").setPref("selectedEngine", "Seznam");
}

/**
 *  prida moduly, ktere se podarilo nainstalovat do preferenci pro pozdejsi odinstalovani 
 */
FoxcubService.Install.SearchModules.prototype.addModulesName = function(name){
	var str = "";
	for(var i in this.modules){
		if(this.modules[i].added){
			var tmp = (str ? "," : "") + this.modules[i].name;
			str += tmp;
		}
	}
	
	FoxcubService.pref.get().setPref("addedModules",str);
};

/**
 *  trida starajici se o nahrani a pridani jednoho kazdeho vyhledavaciho modulu
 */
FoxcubService.Install.SearchModules.Module = FoxcubService.JAK.ClassMaker.makeClass({
	NAME:"FoxcubService.Install.SearchModules.Module",
	VERSION:"0.1",
	IMPLEMENT:[FoxcubService.LogInterface]
});


FoxcubService.Install.SearchModules.Module.prototype.$constructor = function(url,type,owner,id){
	this.id = id;
	this.type = type;
	this._owner = owner;
	this.added = false;
	/* nazev modulu z XML */
	this.name = '';
	/* search engine firefoxe ktery vytvarim */
	this.engine = null;
	/* url XML souboru */

	
	this.url = url;
	this.browserSearchServices = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
	this.xmlParser = new FoxcubService.BaseResponseAnswer();
	this.request = new FoxcubService.JAK.Request(FoxcubService.JAK.Request.XML,{async : true, method : 'post'});
	this.request.setCallback(this, this._answerProcess);
	
	this.init();
};

FoxcubService.Install.SearchModules.Module.prototype.$destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};


FoxcubService.Install.SearchModules.Module.prototype.init = function(){
	this._getModule();
	this.log("inited...")
};
/**
 * Zaslanie requestu
 */
FoxcubService.Install.SearchModules.Module.prototype._getModule = function(){
	this.request.send(this.url);
}

/** 
 * zpracovavam XML kvuli jmenu modulu<br> 
 * 
 */
FoxcubService.Install.SearchModules.Module.prototype._answerProcess = function(data,status){
	this.log("answer"+status + data);
	if(status != 200){
		//this.log(this.type + ' -> not found')
		//this._owner.removeModuleObj(this);
		return;
	}
	
	this.xmlParser.setData(data);
	/* jmeno souboru */
	var name = this.xmlParser.parse("//*[name()='ShortName']")[0].textContent;
	if(!name){
		return;
	}
	
	this.name  = name;
	/* existuje jiz modul stejneho jmena ? */
	var engine = this.browserSearchServices.getEngineByName(this.name);

	if(engine){
		/* existuje, nic nedelam*/
		this.log(this.type + ' -> isAdded')
		return;		
	} else {
		this.log(this.type + ' -> isAdding')
		/* neexistuje, pridavam */
		this.browserSearchServices.addEngine(this.url,1,null,false);
		this.added = true;
		//this._owner.addModulesName(this.name);
	}
}

/* nastavuje vlastnost engine */
FoxcubService.Install.SearchModules.Module.prototype._getEngine = function(){
	if(!this.name){
		return;
	}
	this.engine = this.browserSearchServices.getEngineByName(this.name);
}
/* vraci vlastnost engine */
FoxcubService.Install.SearchModules.Module.prototype.getEngine = function(){
	if(!this.engine){
		this._getEngine();
	}
	return this.engine;
}
/* posouva dany modul na prvni misto v nabidce */
FoxcubService.Install.SearchModules.Module.prototype.moveToTop = function(){
	this.browserSearchServices.moveEngine(this.engine,0);
	//this.log('SEZNAM MOVED TO TOP')
}




