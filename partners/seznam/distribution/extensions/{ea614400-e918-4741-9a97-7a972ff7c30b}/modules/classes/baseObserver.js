var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

/*
* "Observer" pro vnitrni udalosti rozhrani FF a vyvolani vlastni
*
*/
FoxcubService.BaseObserver = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : "FoxcubService.BaseObserver",
	VERSION : "0.1"
})
/**
 * iba v foxcub.. sleduju sa udalosti ako zavretie okna extension a vypnutie
 */
FoxcubService.BaseObserver.prototype.$constructor = function(owner,observerFnc,observedAction){
	// vlastnik instance
	this._owner = owner;
	// zasobnik poslouchanych udalosti
	this.observedAction = {};
	
	this.observerFnc = observerFnc;
	// observer
	this.observerService = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
	// inicializace
	this.addTopics(observedAction);
};


FoxcubService.BaseObserver.prototype.$destructor = function(){
	// zrusim poslouchani vsech udalosti
	this.unRegisterAll();
};

// inicializace, pridani posluchacu (0 - n) nemusi probehnout, volitelne vyvola zapnuti
FoxcubService.BaseObserver.prototype.addTopics = function(param,process){
	if(!param){
		return;
	}
	

		for(var i = 0; i < param.length;i++){
			if(!this.observedAction[param[i]]){
				this.observedAction[param[i]] = 0;
				if(process){
					this._register(param[i]);
				}
			} else {
				continue;
			}
		}

}

// odebrani posluchacu (0 - n)
FoxcubService.BaseObserver.prototype.removeTopics = function(param){
	if(!param){
		return;
	}
	

		for(var i = 0; i < param.length;i++){
			if(this.observedAction[param[i]]){
				this._unRegister[param[i]];
			} else {
				continue;
			}
		}

}

// vlastni registrace 
FoxcubService.BaseObserver.prototype._register = function(topic){
	this.observerService.addObserver(this,topic,false);
	this.observedAction[topic] = 1;
};

// vlastni odregistrace
FoxcubService.BaseObserver.prototype._unRegister = function(topic){
	if(this.observedAction[topic]){
		try {
			this.observerService.removeObserver(this,topic);
		} catch(e){
			// nekem zapis ze se nepovedlo !!!
		} finally {
			this.observedAction[topic] = null;
			delete(this.observedAction[topic]);
		}
	}
};

// registrace vsech
FoxcubService.BaseObserver.prototype.registerAll = function(){
	for(var i in this.observedAction){
		if(!this.observedAction[i]){
			this._register(i);
		}
	}
};

// odregistrace vsech
FoxcubService.BaseObserver.prototype.unRegisterAll = function(){
	for(var i in this.observedAction){
		if(this.observedAction[i]){
			this._unRegister(i);
		}
	}
};

// volani callbacku
FoxcubService.BaseObserver.prototype.observe = function(subject, topic, data){
	this.observerFnc.apply(this._owner,[subject, topic, data]);
};

// vyvolani vlastni udalosti ??
FoxcubService.BaseObserver.prototype.notify = function(subject,topic,data){
	this.observerService.notifyObservers(subject,topic,data);
};





