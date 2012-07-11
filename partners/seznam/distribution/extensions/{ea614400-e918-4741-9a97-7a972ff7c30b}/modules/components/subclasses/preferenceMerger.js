var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Install.PreferenceMerger = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Install.PreferenceMerger",
	IMPLEMENT : [FoxcubService.LogInterface],
	VERSION: "0.1"
});
FoxcubService.Install.PreferenceMerger.prototype.$constructor = function(){

};

/**
 *  kazda verzia obsahuje mapovanie z predchadzajucej<br>
 *  1. ak sa nemeni jednoducha hodnota - defaultne nastavenie<br>
 *  2. ak prebieha transformacia - objekt - musi obsahovať def(ked sa jedna o aktualnu verziu) a transform funkcie - postupna transformacia
 */
FoxcubService.Install.PreferenceMerger.prototype.versions = {
	"1.0.7" : {
		"instance.id" : "",
		"homepage.protect" : 0,
		"homepage.address" : "",
		"general.history" : 0,
		"general.images" : 0,
		"general.tabs" : 0,
		"general.tabs.background" : 0,
		"general.toolbar.news" : 0,
		"general.toolbar.sport" : 0,
		"general.toolbar.people" : 0,
		"general.toolbar.captions" : 0,
		"highlight.words" : 0,
		"highlight.usecase" : 0,
		"highlight.forecolor" : 0,
		"highlight.backcolor" : 0,
		"translation.popup" : true,
		"translation.delay" : 0,
		"translation.language" : "en",
		"translation.direction" : 0,
		"mail.saveusername" : true,
		"mail.savepassword" : true,
		"mail.domain" : "",
		"mail.username" : "",
		"mail.password" : "",
		"mail.updateinterval" : 0,
		"music.enable": true,
		"music.installed": false,
		"music.lasturl": "http://127.0.0.1:50000/?command=",
		"music.port": "localhost:50000",
		"music.popup": true,
		"music.premium": false,
		"music.runnig": false,
		"toolbar.enabled":false,
		
		"srank.enabled" : true,
		"suggest.enabled" : false,
		"people.updateinterval" : 0,
		"log.enabled" : false
	},
	"2.0.10" : {
		"instance.version" : {
			"def" : function(old) {
				return FoxcubService.VERSION;
			},
			"transform" : function(prev) {
				return FoxcubService.VERSION;
			}
		},
		"release" : {
			"def" : function(old) {
				return (old.success) ? old.value : FoxcubService.RELEASE;
			},
			"transform" : function(prev) {
				return ('release' in prev && prev['release']) ? prev['release'] : FoxcubService.RELEASE;
			}
		},
		"instance.id" : "",
		"homepage.address" : "http://www.seznam.cz",
		"homepage.state" : 0,
		"prev.KWD" : "",
		"prev.HP" : "",
		"prev.search.selected" : "",
		"serachModules.inited" : 0,
		"addedModules" : "",
		"translation.enabled" : true,
		"translation.active" : true,
		"translation.shownothing" : false,
		"translation.delay" : 2000,
		"translation.language" : "en",
		"translation.highlight" : true,
		"speedDial.enabled" : true,
		"speedDial.pageType" : "big",
		"speedDial.RSS" : true,	
		"speedDial.skin" :"3",
		"speedDial.items" : "[{\"url\":\"http://www.seznam.cz/\",\"title\":\"Seznam \\u2013 Najdu tam, co hled\\u00e1m\"},{\"url\":\"http://mapy.cz\",\"title\":\"Mapy.cz\"},{\"url\":\"http://zbozi.cz\",\"title\":\"Zbo\\u017e\\u00ed.cz\"}]",
		"logging.toWin" : false,
		"logging.toFile" : false,
		"logging.toFFConsole" : false,
		"mail.enable" : true,
		"mail.accountsBckp" : {
			"def" : function(old){
				return (old.success) ? old.value : "<?xml version=\"1.0\" encoding=\"utf-8\"?><accounts></accounts>"
			},
			"transform" : function(prev) {
				if (!prev['user'] || !prev['mail.domain']) {
					return "<?xml version=\"1.0\" encoding=\"utf-8\"?><accounts></accounts>";
				}
				var field = [
							FoxcubService.JAK.generateId(), 
							prev['mail.username'], 
							'md5',
							prev['mail.password'], prev['mail.savepassword'],
							prev['mail.domain'], 1,
							prev['mail.username'] + '@' + prev['mail.domain'], '',
							'biff'
							];
				var xmlTmpl = "<account><id>${0}</id><user>${1}</user><pwd type=\"${2}\">${3}</pwd>"
						+ "<pwdmem>${4}</pwdmem><domain>${5}</domain><active>${6}</active><name>${7}</name>"
						+ "<dblaccess>${8}</dblaccess><type>${9}</type></account>";
				for (var i = 0; i < field.length; i++) {
					xmlTmpl = xmlTmpl.replace("${" + i + "}", field[i]);
				}
				return "<?xml version=\"1.0\" encoding=\"utf-8\"?><accounts>"
						+ str + "</accounts>";
			}
		},
		"mail.accountsTimestamps" : "",
		"mail.conf.lastCheck" : 0,
		"mail.conf.lastIncome" : 0,
		"mail.conf.weekIncome" : 0,
		"mail.optionchanged" : false,
		"music.enable": true,
		"music.installed": false,
		"music.lasturl": "http://127.0.0.1:50000/?command=",
		"music.port": "localhost:50000",
		"music.popup": true,
		"music.premium": false,
		"music.runnig": false,
		
		"toolbar.enabled":false,
		
		"srank.enabled" : true,
		"srank.textEnabled" : false,
		"instance.upgraded" : false
	},

	"2.0.11" : {
		"instance.version" : {
			"def" : function(old) {
				return FoxcubService.VERSION;
			},
			"transform" : function(prev) {
				return FoxcubService.VERSION;
			}
		},
		"release" : {
			"def" : function(old) {
				return (old.success) ? old.value : FoxcubService.RELEASE;
			},
			"transform" : function(prev) {
				return ('release' in prev && prev['release']) ? prev['release'] : FoxcubService.RELEASE;
			}
		},
		"config.encodedConfig" : {
			"def" : function(old) {
				return "";
			},
			"transform" : function(prev) {
				return "";
			}
		},
		"config.lastUpdate" : {
			"def" : function(old) {
				return "0";
			},
			"transform" : function(prev) {
				return "0";
			}
		},
		"instance.id" : "",
		"homepage.address" : "http://www.seznam.cz",
		"homepage.state" : 0,
		"prev.KWD" : "",
		"prev.HP" : "",
		"prev.search.selected" : "",
		"serachModules.inited" : 0,
		"addedModules" : "",
		"translation.enabled" : true,
		"translation.active" : true,
		"translation.shownothing" : false,
		"translation.delay" : 2000,
		"translation.language" : "en",
		"translation.highlight" : true,
		"speedDial.enabled" : true,
		"speedDial.pageType" : "big",
		"speedDial.RSS" : true,	
		"speedDial.skin" :"3",	
		"speedDial.items" : "[{\"url\":\"http://www.seznam.cz/\",\"title\":\"Seznam \\u2013 Najdu tam, co hled\\u00e1m\"},{\"url\":\"http://mapy.cz\",\"title\":\"Mapy.cz\"},{\"url\":\"http://zbozi.cz\",\"title\":\"Zbo\\u017e\\u00ed.cz\"}]",
		"logging.toWin" : false,
		"logging.toFile" : false,
		"logging.toFFConsole" : false,
		"mail.enable" : true,
		"mail.accountsBckp" :  "<?xml version=\"1.0\" encoding=\"utf-8\"?><accounts></accounts>",
		"mail.accountsTimestamps" : "",
		"mail.conf.lastCheck" : 0,
		"mail.conf.lastIncome" : 0,
		"mail.conf.weekIncome" : 0,
		"mail.optionchanged" : false,
		"music.enable": true,
		"music.installed": false,
		"music.lasturl": "http://127.0.0.1:50000/?command=",
		"music.port": "localhost:50000",
		"music.popup": true,
		"music.premium": false,
		"music.runnig": false,
		"toolbar.enabled":false,
		
		"srank.enabled" : true,
		"srank.textEnabled" : false,
		"instance.upgraded" : {
			"def" : function(old) {
				return 0;
			},
			"transform" : function(prev) {
				return 2;
			}
		}
	},
	"2.1.12" : {
		"instance.version" : {
			"def" : function(old) {
				return FoxcubService.VERSION;
			},
			"transform" : function(prev) {
				return FoxcubService.VERSION;
			}
		},
		"release" : {
			"def" : function(old) {
				return (old.success) ? old.value : FoxcubService.RELEASE;
			},
			"transform" : function(prev) {
				return ('release' in prev && prev['release']) ? prev['release'] : FoxcubService.RELEASE;
			}
		},
		"config.encodedConfig" : {
			"def" : function(old) {
				return "{}";
			},
			"transform" : function(prev) {
				return "{}";
			}
		},
		"config.lastUpdate" : {
			"def" : function(old) {
				return "0";
			},
			"transform" : function(prev) {
				return "0";
			}
		},
		"instance.id" : "",
		"homepage.address" : "http://www.seznam.cz",
		"homepage.state" : 0,
		"prev.KWD" : "",
		"prev.HP" : "",
		"prev.search.selected" : "",
		"serachModules.inited" : 0,
		"addedModules" : "",
		"currency.enabled" : true,
		"translation.enabled" : true,
		"translation.active" : true,
		"translation.shownothing" : false,
		"translation.delay" : 2000,
		"translation.language" : "en",
		"translation.direction" : false,
		"translation.highlight" : true,
		"speedDial.enabled" : false,
		"speedDial.pageType" : "big",
		"speedDial.RSS" : true,	
		"speedDial.skin" :"3",	
		"speedDial.settings" : "{\"background\":{\"image\":\"bg-grass-dog.png\",\"color\":\"transparent\",\"position\":\"right bottom\"}}",
		"speedDial.items" : {
			"def" : function(old) {
				return (old.success) ? old.value : "[{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://www.seznam.cz/\",\"title\":\"Seznam \\u2013 Najdu tam, co hled\\u00e1m\"},{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://mapy.cz\",\"title\":\"Mapy.cz\"},{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://zbozi.cz\",\"title\":\"Zbo\\u017e\\u00ed.cz\"}]";
			},
			"transform" : function(prev) {
				var prevItems = prev['speedDial.items'];
				return prevItems.replace(/\{/g,'{"type":"simple","bookmarkId":-1,');
			}
		},
		"logging.toWin" : false,
		"logging.toFile" : false,
		"logging.toFFConsole" : false,
		"mail.enable" : true,
		"mail.accountsBckp" :  "<?xml version=\"1.0\" encoding=\"utf-8\"?><accounts></accounts>",
		"mail.accountsTimestamps" : "",
		"mail.conf.lastCheck" : 0,
		"mail.conf.lastIncome" : 0,
		"mail.conf.weekIncome" : 0,
		"mail.optionchanged" : false,
		"music.enable": true,
		"music.installed": false,
		"music.lasturl": "http://127.0.0.1:50000/?command=",
		"music.port": "localhost:50000",
		"music.popup": true,
		"music.premium": false,
		"music.runnig": false,
		"toolbar.enabled":false,
		
		"srank.enabled" : true,
		"srank.textEnabled" : false,
		"instance.upgraded" : {
			"def" : function(old) {
				return 0;
			},
			"transform" : function(prev) {
				return 2;
			}
		}
	}
}

FoxcubService.Install.PreferenceMerger.prototype.versions[FoxcubService.VERSION] = {
		"instance.version" : {
			"def" : function(old) {
				return FoxcubService.VERSION;
			},
			"transform" : function(prev) {
				return FoxcubService.VERSION;
			}
		},
		"release" : {
			"def" : function(old) {
				return (old.success) ? old.value : FoxcubService.RELEASE;
			},
			"transform" : function(prev) {
				return ('release' in prev && prev['release']) ? prev['release'] : FoxcubService.RELEASE;
			}
		},
		"config.encodedConfig" : {
			"def" : function(old) {
				return "{}";
			},
			"transform" : function(prev) {
				return "{}";
			}
		},
		"config.lastUpdate" : {
			"def" : function(old) {
				return "0";
			},
			"transform" : function(prev) {
				return "0";
			}
		},
		"instance.id" : "",
		"homepage.address" : "http://www.seznam.cz",
		"homepage.state" : 0,
		"prev.KWD" : "",
		"prev.HP" : "",
		"prev.search.selected" : "",
		"serachModules.inited" : 0,
		"addedModules" : "",
		"currency.enabled" : true,
		"translation.enabled" : true,
		"translation.active" : true,
		"translation.shownothing" : false,
		"translation.delay" : 2000,
		"translation.language" : "en",
		"translation.direction" : false,
		"translation.highlight" : true,
		"translation.key" : "",
		"speedDial.enabled" : false,
		"speedDial.pageType" : "big",
		"speedDial.RSS" : true,	
		"speedDial.skin" :"3",		
		"speedDial.settings" : "{\"background\":{\"image\":\"bg-grass-dog.png\",\"color\":\"transparent\",\"position\":\"right bottom\"}}",
		"speedDial.items" : {
			"def" : function(old) {
				return (old.success) ? old.value : "[{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://www.seznam.cz/\",\"title\":\"Seznam \\u2013 Najdu tam, co hled\\u00e1m\"},{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://mapy.cz\",\"title\":\"Mapy.cz\"},{\"type\":\"simple\",\"bookmarkId\":-1,\"url\":\"http://zbozi.cz\",\"title\":\"Zbo\\u017e\\u00ed.cz\"}]";
			},
			"transform" : function(prev) {
				var prevItems = prev['speedDial.items'];
				return prevItems.replace(/\{/g,'{"type":"simple","bookmarkId":-1,');
			}
		},
		"logging.toWin" : false,
		"logging.toFile" : false,
		"logging.toFFConsole" : false,
		"mail.enable" : true,
		"mail.accountsDomains" :  "{}",
		"mail.accountsBckp" : {
			"def" : function(old) {
				return (old.success) ? old.value : "{}";
			},
			// transformacia z xml na objekt
			"transform" : function(prev) {

				try {

					var data = prev['mail.accountsBckp'];
					
					var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
							.createInstance(Components.interfaces.nsIDOMParser);
					var doc = parser.parseFromString(data, "text/xml");
					// z povodneho
					var accounts = {};

					var xyz = new FoxcubService.BaseResponseAnswer(doc);

					var nodes = xyz.parse("//account");

					for (var i = 0; i < nodes.length; i++) {
						var account = {};
						var node = nodes[i]

						var nd = node.firstChild;

						while (nd.nextSibling) {
							if (nd.nodeType == 1) {
								account[nd.nodeName] = nd.textContent
										? nd.textContent
										: '';
							}
							nd = nd.nextSibling;
						}
						//FoxcubService.debug(account.toSource())
						accounts[account.id] = {
							username:account.user, 
							login : account.user,
							domain : "def_" + account.domain,
							password : FoxcubService.functions.encoding.encrypt(account.pwd),
							md5 : true,
							passwordSave : !!(account.pwdmem),
							fullName : account.name,
							pop3ids : [],
							imapids : [],
							timestamp : 0,
							loginChanged : true,
							fullNameChanged : true,
							active : !!(account.active)
						}
					}
					//FoxcubService.debug(accounts.toSource())
					return accounts;
				} catch (e) {
					//FoxcubService.debug(e.toString())
					//this.log(e.toString(), "error");
					return "{}";
				}
			}
		},
		"mail.conf.lastCheck" : 0,
		"mail.conf.lastIncome" : 0,
		"mail.conf.weekIncome" : 0,
		"mail.optionchanged" : false,
		"music.enable": true,
		"music.installed": false,
		"music.lasturl": "http://127.0.0.1:50000/?command=",
		"music.port": "localhost:50000",
		"music.popup": true,
		"music.premium": false,
		"music.runnig": false,
		"toolbar.enabled":false,
		

		"srank.enabled" : true,
		"srank.textEnabled" : false,
		"instance.upgraded" : {
			"def" : function(old) {
				return 0;
			},
			"transform" : function(prev) {
				return 2;
			}
		}
	}

/**
 * - aj ostatne by sa mali prerobit takto
 */
FoxcubService.Install.PreferenceMerger.prototype.JSON = {
	"2.1.12" : {
		"config.encodedConfig":1,
		"speedDial.settings":1		
	}
}
FoxcubService.Install.PreferenceMerger.prototype.JSON[FoxcubService.VERSION] = {
		"config.encodedConfig":1,
		"speedDial.settings":1,
		"mail.accountsDomains" :1,
		"mail.accountsBckp":1 
}
FoxcubService.Install.PreferenceMerger.prototype._merge = function(versionId) {
	this.log("merging from version:" + versionId,"info");
	if (!(versionId in this.versions)) {
		versionId = this._getFirstAfter(versionId);
	}
	this.log("merging from version:" + versionId,"info");
	var prev = null;
	for (var v in this.versions) {
		if (prev == null && v != versionId)
			continue;
		var currentVersion = this.versions[v];

		if (prev == null) {
			//prva verzia ktora pride nastavi svoje hodnoty podla aktualnych preferencii
			//v pripade ze preferencia neexistuje nastavi defaultne
			prev = {};
			for(key in currentVersion){
				var po = FoxcubService.pref.get().getPref(key,(v in this.JSON && key in this.JSON[v]));
				if(typeof currentVersion[key] == 'object'){
					prev[key] = currentVersion[key].def(po);
				}else{
					//if(key=="mail.accountsDomains")FoxcubService.debug(po.value.toSource());
					prev[key] = (po.success) ? po.value : currentVersion[key];
				}
			}
			
		}else{
			//zvysne verzie sa riadia iba z hodnotami z predchadzajucej
			var nprev = {};
			for(key in currentVersion){
				if(typeof currentVersion[key] == 'object'){
					try{
						nprev[key] = currentVersion[key].transform(prev);
					}catch(e){
						this.log("transform error " + v + " key:" + key);
					}
					
				}else{
					nprev[key] = (key in prev) ? prev[key] : currentVersion[key];
				}
			}
			prev = nprev;
		}
	}
	//zmazem vsetky
	var list = FoxcubService.pref.get().getList().list;	
	for(var i = 0; i < list.length; i++){
		FoxcubService.pref.get().delPref(list[i]);	
	}
	//znovu nastavim
	for(key in prev){
		FoxcubService.pref.get().setPref(key,prev[key]);	
	}
	this.log("preferencies merged","info");

};

/**
 * vrati najblizsiu vysiu verziu
 * @param {string} versionId 
 * @return {string} - ak neexistuje vrati poslednu
 */
FoxcubService.Install.PreferenceMerger.prototype._getFirstAfter = function(versionId){
	var last;
	for(var v in this.versions){
		last = v;
		if(this._compareVersions(versionId,v)<=0){
			return v;
		}
	}
	return last;	
};
/**
 * porovna verzie - <>=
 */
FoxcubService.Install.PreferenceMerger.prototype._compareVersions = function(v1,v2){
	var v1a = v1.split(".");
	var v2a = v2.split(".");
	for(var i = 0; i<v1a.length && i <v2a.length; i++){
		var v1n = parseInt(v1a[i]); 
		var v2n = parseInt(v2a[i]); 
		if(v1n<v2n){
			return -1;
		}
	    if(v1n>v2n){
			return 1;
		}
	}
	return v1a.length - v2a.length;
	
};

/*********************************** PREFERENCE END*******************************/