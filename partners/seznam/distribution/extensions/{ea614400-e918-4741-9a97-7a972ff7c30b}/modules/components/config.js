var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Config = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Config",
			IMPLEMENT : [FoxcubService.LogInterface],
			VERSION : "0.1"
		});

FoxcubService.Config.prototype._MainconfigURL="http://download.seznam.cz/software/conf/";

FoxcubService.Config.prototype.$constructor = function() {
	this.log("constructor start", "info");
	this.configObj = null;
	this.configDefObj = null
	this.installer = null;
	this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.getConfig = FoxcubService.JAK.bind(this,this._getConfig);
	this.event = { 
		notify: this.getConfig 
	};
	this.log("constructor end", "info");
}

FoxcubService.Config.prototype.UPDATE_DELAY = 86400000;
//neexistuje zaznam o poslednom update
FoxcubService.Config.prototype.FIRST_UPDATE_DELAY = 0;
//ked nestiahne, novy pokus po 10 min
FoxcubService.Config.prototype.AFTER_FAIL_UPDATE_DELAY = 600000;

//inicializacia
FoxcubService.Config.prototype.init = function(){
	this.run();
	this.log("inited","info");
};
//spustenie automatickeho downloadu
FoxcubService.Config.prototype.run = function(){
	nextUpdate = this.getNextUpdateTime();
	FoxcubService.install._setCookies();
	if(nextUpdate <= this.FIRST_UPDATE_DELAY){
		this._getConfig();
		
	}else{
		this.log("next update in " + nextUpdate + " miliseconds","info");
		this.timer.initWithCallback(this.event,nextUpdate,this.timer.TYPE_ONE_SHOT);
	}		
};
//download configu z download serveru
FoxcubService.Config.prototype._getConfig = function() {	
	this.log("downloading config ...", "info");
	var rq = new FoxcubService.JAK.Request(FoxcubService.JAK.Request.TEXT);
	rq.setCallback(this, "_partnerConfigAsk");
	rq.send(this._getConfigUrl());	
	
};


FoxcubService.Config.prototype._partnerConfigAsk = function(txt,status){
	if(status==200 && txt){
		
		this.txt=txt;		
		var rq = new FoxcubService.JAK.Request(FoxcubService.JAK.Request.TEXT);
		rq.setCallback(this, "_handleConfigResponse");
		rq.send(this._getConfigUrlPartner());
	}
};

//spracovanie responsu - v pripade neuspechu skusim znova po case: this.AFTER_FAIL_UPDATE_DELAY
FoxcubService.Config.prototype._handleConfigResponse = function(txt,status){
	
	if(txt){
		txt=txt+this.txt;
	}else{
		txt=this.txt;
	}
	this.log(txt);
	if(txt){
	   try{
		     var newConfigObj = this._parseConfig(txt);
		   	 var tmpUrlOld = this.get("core","configUrl");
		   	 var tmpUrlNew = newConfigObj["core"]["configUrl"];
		   	 this.configObj = newConfigObj;
		   	
		   	 FoxcubService.pref.get().setPref("config.encodedConfig",newConfigObj);
		   	 this.log(newConfigObj);
		   	 FoxcubService.pref.get().setPref("config.lastUpdate","" + new Date().getTime());
		   	 this.log("New config downloaded!","info");
		   	 if(tmpUrlOld != tmpUrlNew){
		   	 	//nove stiahnutie ak sa zmenila verzia konfigu
		   	 	this.log("Config url changed!","warn");
		   	 	this._getConfig();
		   	 }else{
		   	 	this.run();
		   	 }
		   	 ok = true;
	   }catch(e){
	   		this.log("Config download faild! exception:" + e.toString(),"error");
	   }
	}
	if(!ok){
		this.log("Config download faild!","error");
		this.timer.initWithCallback(this.event,this.AFTER_FAIL_UPDATE_DELAY,this.timer.TYPE_ONE_SHOT);
	}
	
}

//vytvori url na download configu zo serveru
FoxcubService.Config.prototype._getConfigUrl = function(){
	var params="";
	var info = FoxcubService.install.extensionInfo();
	if(info != null){
 		params="?" + info.ssid + "," + info.productId + "," + info.version + ",hp" + info.hp;
	}else{
		this.log("empty extension info","warn");
	}
	var url = this.get("core","configUrl");
	url += "master.cfg" + params;
	
	return url;
}
FoxcubService.Config.prototype._getConfigUrlPartner = function(){
	var params="";
	var info = FoxcubService.install.extensionInfo();
	if(info != null){
 		params="?" + info.ssid + "," + info.productId + "," + info.version + ",hp" + info.hp;
	}else{
		this.log("empty extension info","warn");
	}

	var url = this.get("core","configUrl");
	url += "partner_"+info.releaseId+".cfg" + params;
	
	return url;
}
//ziska hodnotu z konfigu
FoxcubService.Config.prototype.get = function(group,key){
	this.log(group+" "+key);
	if (this.configObj == null || this.configDefObj == null) {
		/*this.log(group);
		this.log(key);
		return this._MainconfigURL;*/
		var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
	    req.open('GET', "resource://foxcub/master.cfg", false);
		req.send(null);
		this.DEFAULT_CONFIG_STRING = req.responseText;	
	
		this.configDefObj = this._parseConfig(this.DEFAULT_CONFIG_STRING);
		if(this.configDefObj["partner"]){
			var parter = this.configDefObj["partner"];
			if("partnerID" in parter){
		        var partnerId = parter["partnerID"];		        
                FoxcubService.pref.get().setPref("release",partnerId);           
            }
        }
	
		var storedConfigObj = FoxcubService.pref.get().getPref("config.encodedConfig",true);
		if (!storedConfigObj.success || !("core" in storedConfigObj.value)) {
			this.configObj = this._parseConfig(this.DEFAULT_CONFIG_STRING);
		} else {
			this.configObj = storedConfigObj.value;
		}

	}
	
	var outgroup = this.configObj[group] || this.configDefObj[group];
	if(!outgroup){
		this.log("Group \""+group+"\" doesn't exists in config","warn");
		return "";
	}else if(!key){
		return outgroup;
	}
	if(key in outgroup){
		return outgroup[key];
	}else{
		this.log("Key \""+key+"\" doesn't exists in config","warn");
		return "";
	}

}
//rozparsovanie konfigu
FoxcubService.Config.prototype._parseConfig = function(txt){
     var newConfigObj = {};
     var lines = txt.split("\n");
     group = null;     
     for(i in lines){
        var txt = lines[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        // jedna sa o nazov skupiny? [...]
        if(txt.match(/^\[[^\[\]]+\]$/)) {
           group = txt.replace(/^\[/, '').replace(/\]$/, '');
           if(!newConfigObj[group]){
        	   newConfigObj[group] ={};
           }        
           // existuje skupina?
        }else if(group !== null){
           // zistenie kluc = hodnota
           if(txt.match(/^[a-zA-Z0-9._-]+\s*=.+$/)){
              io = txt.indexOf("=");
              key = txt.substring(0,io).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
              value = txt.substring(io+1).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
              //odstranenie uvodzoviek a komentarov za hodnotou
              chars = {"\"":1,"'":1}
              if(value.substring(0,1) in chars){
                 sch = value.substring(0,1);
                 ech = value.indexOf(sch,1);
                 value = value.substring(1,ech);
              }else if(value.indexOf("#")!=-1){
                 value = value.substring(0,value.indexOf("#"));
              }
              //pridanie do objektu - ak existuje viacej daj do pola
              if(key in newConfigObj[group]){
                 if(newConfigObj[group][key].constructor != Array){
                    newConfigObj[group][key] = [newConfigObj[group][key]]; 
                 }
                 newConfigObj[group][key].push(value);
              }else{
                 newConfigObj[group][key]=value;
              }             
           }          
        }       
     }
     return newConfigObj;
}
//ziska cas dalsieho updatu configu
FoxcubService.Config.prototype.getNextUpdateTime = function(){
	lastUpdate = FoxcubService.pref.get().getPref("config.lastUpdate");
	var nextUpdate = this.FIRST_UPDATE_DELAY;
	if(lastUpdate.success && lastUpdate.value){
		lastUpdate = parseInt(lastUpdate.value);
		nextUpdate = this.UPDATE_DELAY - (new Date().getTime() - lastUpdate);
	    nextUpdate = (nextUpdate<this.FIRST_UPDATE_DELAY) ? this.FIRST_UPDATE_DELAY : nextUpdate;
	}
	return nextUpdate;
}
