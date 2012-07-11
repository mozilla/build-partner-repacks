var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Install = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Install",
			IMPLEMENT : [FoxcubService.LogInterface],
			VERSION : "0.1"
		});

Components.utils.import("resource://foxcub/components/subclasses/preferenceMerger.js");
Components.utils.import("resource://foxcub/components/subclasses/uninstall.js");
Components.utils.import("resource://foxcub/components/subclasses/searchModules.js");

FoxcubService.Install.prototype.INSTALL_TYPE_NEW = 1;
FoxcubService.Install.prototype.INSTALL_TYPE_UPGRADE_OLD = 2;
FoxcubService.Install.prototype.INSTALL_TYPE_UPGRADE_NEW = 3;
FoxcubService.Install.prototype.INSTALL_TYPE_NONE = 4;
FoxcubService.Install.prototype.INSTALL_TIMEOUT = 2000;
FoxcubService.Install.prototype.COOKIE_VALUE = "listicka=1;domain=."; 
FoxcubService.Install.prototype.DOMAINS = {
		"http://seznam.cz" : 1,
		"http://sauto.cz" : 1,
		"http://sbazar.cz" : 1,
		"http://deniky.cz" : 1,
		"http://email.cz" : 1,
		"http://sfinance.cz" : 1,
		"http://firmy.cz" : 1,
		"http://horoskopy.cz" : 1,
		"http://hry.cz" : 1,
		"http://lide.cz" : 1,
		"http://mapy.cz" : 1,
		"http://pocasi.cz" : 1,
		"http://sprace.cz" : 1,
		"http://prozeny.cz" : 1,
		"http://sreality.cz" : 1,
		"http://sport.cz" : 1,
		"http://stream.cz" : 1,
		"http://super.cz" : 1,
		"http://sweb.cz" : 1,
		"http://zbozi.cz" : 1,
		"http://novinky.cz" : 1
};

FoxcubService.Install.prototype.$constructor = function() {
	this.log("constructor start", "info");
	this.installType = false;
	this.lastBoss = null;
	this.winFolder = {};
	this.installed = false;
	this.versionChanged = false;
	this.searchModules = new FoxcubService.Install.SearchModules();
	this.log("constructor end", "info");
}

FoxcubService.Install.prototype.extensionInfo = function() {
	
  if(FoxcubService.install.INSTALL_TYPE_NONE!=FoxcubService.install.installType){
		var tmp = FoxcubService.pref.get().getPref("homepage.state").value;
		if (tmp==2) {
			var fixHP = FoxcubService.pref.get("browser.startup.").getPref("homepage").value;
			if(fixHP=="http://www.seznam.cz"){
				this.HP_URL= "http://www.seznam.cz/?clid="+FoxcubService.RELEASE;
				FoxcubService.pref.get("browser.startup.").setPref("homepage", this.HP_URL);
		
			}
		}
	}
	if (!this.installed)
		return null;
	// hp
	var hpFlag = FoxcubService.functions.isHomepageSet();
	var tmp = FoxcubService.pref.get().getPref("homepage.state");
	var hp = tmp.success ? tmp.value : 0;
	if (!hpFlag && (hp < 3) && hp) {
		var hp = 3;
		FoxcubService.pref.get().setPref("homepage.state", hp);
	}
	// ssid
	var tmp = FoxcubService.pref.get().getPref("instance.id");
	var tmpID = FoxcubService.pref.get().getPref("release");
	if(tmpID){
		FoxcubService.RELEASE=tmpID.value;
	}
	var ssid = tmp.success ? tmp.value : "";
	return {
		"productId" : FoxcubService.PRODUCT,
		"releaseId" : FoxcubService.RELEASE,
		"sourceId" : FoxcubService.SOURCE,
		"extensionId" : FoxcubService.EXTENSION_ID,
		"version" : FoxcubService.VERSION,
		"hp" : hp,
		"ssid" : ssid
	}
}
FoxcubService.Install.prototype.config = function(group, key) {
	return this.configService.get(group, key);
}
FoxcubService.Install.prototype.uninstall = function() {	
	var uninstall = new FoxcubService.Install.Uninstall()
	uninstall.uninstall();
}

/**
 * Zahajenie inštalácie - volá sa pri zaregistrovaní novej lištičky
 */
FoxcubService.Install.prototype._install = function() {
	// zistenie typu instalacie
	var id = FoxcubService.pref.get().getPref("instance.id");
	var version = FoxcubService.pref.get().getPref("instance.version");
	var upgraded = FoxcubService.pref.get().getPref("instance.upgraded");
	var versionId = FoxcubService.VERSION;
	// neexistuje ani id ani verzia
	if (!version.success && !id.success) {
		this.installType = this.INSTALL_TYPE_NEW;
		// neexistuje verzia existuje id - aktualizacia zo starej
	} else if (!version.success && (id.success && id)) {
		this.installType = this.INSTALL_TYPE_UPGRADE_OLD;
		var versionId = "1.0.7";
		// prebieha upgrade
	} else if (upgraded.success
			&& (upgraded.value === true || upgraded.value === 1)) {
		this.installType = this.INSTALL_TYPE_UPGRADE_NEW;
		var versionId = version.value;
		// nic nove
	} else {
		this.installType = this.INSTALL_TYPE_NONE;
	}
	this.log(this.installType);
	if (this.installType != this.INSTALL_TYPE_NONE) {
		this._merge(versionId);
	}
	this.installed = true;
	var boss = this.getBoss();

	// ak sa jedna o prvu instalaciu pozdrz registraciu a update configu
	if (this.installType == this.INSTALL_TYPE_NEW) {
		this.searchModules.start();
		//boss.firstInstallFlag = true;
	} else {
		this.searchModules.prefObserver.register();
		this.startServices();
	}
	boss.installType = this.installType;
	this._run();
}
FoxcubService.Install.prototype.startServices = function() {
		
	FoxcubService.config.init();
	FoxcubService.register.init();
	
}

FoxcubService.Install.prototype._setSeznamCookieHP = function() {
	this.FIXHP = FoxcubService.pref.get("browser.startup.").getPref("homepage").value;
	/*this.log(this.FIXHP);
	if(this.FIXHP.match(".homepage=")){
		this.log(this.FIXHP);
		this.FIXHP=this.FIXHP.split(".homepage=")[1];
	}

	this.FIXHPedit=	this.FIXHP.split(".cz");*/
	var info = this.extensionInfo();
	
	var cookieUri = this.ios.newURI("http://seznam.cz", null, null);
	this.log(this.FIXHP.match("seznam.cz"));
	if(this.FIXHP.match("seznam.cz")) {	
		this.cookieSvc.setCookieString(cookieUri, null, "isHP=1;domain=.seznam.cz", null);
	}else{
		this.cookieSvc.setCookieString(cookieUri, null, "isHP=0;domain=.seznam.cz", null);
	}
	
	if (info.hp == 2) {
		this.cookieSvc.setCookieString(cookieUri, null, "sourceid=" + info.sourceId + ";domain=.seznam.cz;", null);
	}
}
FoxcubService.Install.prototype._ipv4 = function() {
	
	FoxcubService.pref.get("network.http.").setPref("fast-fallback-to-IPv4",true);

}
FoxcubService.Install.prototype._setCookies = function() {
	var size = 0, name;
	this.ios = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	this.cookieSvc = Components.classes["@mozilla.org/cookieService;1"]
		.getService(Components.interfaces.nsICookieService);

	for (name in this.DOMAINS) {
	    if (this.DOMAINS.hasOwnProperty(name)){
	    	var value= this.COOKIE_VALUE+name.split("http://")[1]+";";
	    	var cookieUri = this.ios.newURI(name, null, null);
			this.cookieSvc.setCookieString(cookieUri, null, value, null);
			size++;
		}
	}
	this._setSeznamCookieHP();
	this._ipv4();
};
/**
 * Spustenie nabuffrovaných okien
 */
FoxcubService.Install.prototype._run = function() {
	for (var i in this.winFolder) {
		this._execute(this.winFolder[i]);
	}
}
FoxcubService.Install.prototype._execute = function(win) {
	win.init();
}
/**
 * Inštalácia novej lištičky
 */
FoxcubService.Install.prototype._merge = function(versionId) {
	var merger = new FoxcubService.Install.PreferenceMerger(this);
	merger._merge(versionId);
}

/**
 * pridanie novel listicky do zasobnika pre spustenie po instalacii
 * 
 * @param {object}
 *            win - instancie listicky
 */
FoxcubService.Install.prototype.registerWin = function(win) {
	if (this.installed) {
		this.winFolder[win.fxbInstanceId] = win;
		this._execute(win);
		return;
	}
	if (this.getBoss() === null) {
		this.winFolder[win.fxbInstanceId] = win;
		this._install();
	} else {
		this.winFolder[win.fxbInstanceId] = win;
	}

}
/**
 * odregistrovanie okna z installeru
 */
FoxcubService.Install.prototype.unregisterWin = function(win) {
	if (win.fxbInstanceId in this.winFolder) {
		delete(this.winFolder[win.fxbInstanceId]);
	}
}
/**
 * ziskanie prvej zaregistrovanie listicky z installeru
 * 
 * @return {object} - prva zaregistrovana listicka
 */
FoxcubService.Install.prototype.getBoss = function() {
	for (var i in this.winFolder) {
		this.lastBoss = this.winFolder[i];
		return this.winFolder[i];
	}
	return this.lastBoss;
}