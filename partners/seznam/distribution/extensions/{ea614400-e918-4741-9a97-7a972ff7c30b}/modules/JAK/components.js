var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
 * @class Třída pro dědění rozhraní "Components", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.  
 * @group jak
 */
FoxcubService.JAK.Components = FoxcubService.JAK.ClassMaker.makeInterface({
	NAME: "FoxcubService.JAK.Components",
	VERSION: "1.2"
});

/**
 * zjišťuje zda má daná třída definované komponenty
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
FoxcubService.JAK.Components.prototype.hasComponents = function(){
	return (this.components && this.components.length)
};

/**
 * přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
FoxcubService.JAK.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
	return true;
};


/**
 * přidá novou komponentu za běhu programu
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 */   
FoxcubService.JAK.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
/**
 * přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @private
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
FoxcubService.JAK.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.NAME.substring(0,1).toLowerCase();
			component.name += component.part.NAME.substring(1);
		} 
		if(typeof component.setting != 'undefined'){
			
			this[component.name] = new component.part(this,component.name,component.setting);
		} else {
			this[component.name] = new component.part(this,component.name);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
/**
 * vytváří volání vlastních metod z objektu, ktery je definován argumentem owner
 * tak že čte vlastnost <em>'access'</em> svých metod, vlastost acces je string jehož
 * první částí je specifikátor přístupu (poviný) s hodnotou 'public' a za ním následuje mezerou
 * oddělený název pod jakým se má volání vytvořit, není-li uveden použije se název vytvořený
 * ze jména objektu a metody
 * @method      
 * @param {object} owner reference na objekt, ve kterém se volání vytvoří
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> již takto definovanou vlastnost má 
 */    
FoxcubService.JAK.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				var name = this._createMethodName(obj, j);
				
				if(typeof owner[name] == 'undefined'){
					owner[name] = (obj == this.sConstructor) ? this.sConstructor[j] : FoxcubService.JAK.bind(this,this[j]);
				} else {
					throw new Error('registredMethod: method "' + name + '" already exist!')
				}
			}
		}
	}
};

/**
 * odregistrace metod, z objektu owner, ktere byly vytvoreny volanim registredMethod
 * @param {object} owner
 */
FoxcubService.JAK.Components.prototype.unregistredMethod = function(owner) {
	var field = [this,this.sConstructor];
	/* odregistrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				//projedu vsechny metody tohoto objektu a odregistruju je z rodice
				var name = this._createMethodName(obj, j);

				if(typeof owner[name] != 'undefined'){
					delete(owner[name]);
				}
			}
		}
	}
}

/**
 * metoda pouzivana registredMethod a unregistredMethod pro vytvoreni jmena metody
 * @param {object} obj
 * @param {string} methodName
 * @return {string}
 */
FoxcubService.JAK.Components.prototype._createMethodName = function(obj, methodName) {
	var nameFirstChar = methodName.substring(0,1).toUpperCase();
	var nameNext = methodName.substring(1);
	var mods = obj[methodName].access.replace(/[ ]{2,}/gi,' ').split(' ');

	if(mods.length > 1){
		var name = mods[1];
	} else {
		var namePrefix = (obj == this.sConstructor) ? obj.NAME : this._name;
		var name = namePrefix + nameFirstChar + nameNext;
	}
	return name;
}

/* vracim hlavni tridu */
/**
 * slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL
 * @method  
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
 */     
FoxcubService.JAK.Components.prototype.getMain = function(){
	var obj = this;
	while(typeof obj.TOP_LEVEL == 'undefined'){
		if(typeof obj._owner == 'undefined'){
			throw new Error('can\'t find TOP LEVEL Class');
		} else {
			obj = obj._owner;
		}
	}
	return obj;
};

/**
 * slouží k postupnému volání destruktorů všech komponent, daného objektu
 * @method 
 */
FoxcubService.JAK.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(!this[cName] || !this[cName]['$destructor']) {
			continue;
		}
		this[cName]['$destructor']();
		this[cName] = null;
	}	
};

/**
 * odebere komponentu, ktera je zadana nazvem, nebo objektem
 * @param {object} component
 * @param {boolean} withDestruction - zda ma zavolat destruktor komponenty 
 * @method 
 */
FoxcubService.JAK.Components.prototype.removeComponent =function(component, withDestruction){

	for (var i =0; i < this.components.length; i++) {
		var c = this.components[i];
		if (component == c.name || component == this[c.name]  ) {
			if (withDestruction && (typeof this[c.name].$destructor == 'function')) {
				this[c.name].$destructor();
			}
			this[c.name] = null;
			c = null;

			this.components.splice(i,1);
			break;
		}
	}
}