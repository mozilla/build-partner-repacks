var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @class Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy FoxcubService.JAK.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @group jak
 * @see FoxcubService.JAK.Signals
 */  
FoxcubService.JAK.ISignals = FoxcubService.JAK.ClassMaker.makeInterface({
	NAME: "FoxcubService.JAK.ISignals",
	VERSION: "2.0",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy FoxcubService.JAK.Signals s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy FoxcubService.JAK.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy FoxcubService.JAK.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
FoxcubService.JAK.ISignals.prototype.setInterface = function(interfaceName){
	if(typeof(this[interfaceName]) != 'object'){
		var owner = this._owner;
		while(typeof(owner[interfaceName])== 'undefined'){
			if(typeof owner.TOP_LEVEL != 'undefined'){
				throw new Error('SetInterface:Interface not found');
			} else {
				owner = owner._owner;
			}
		}
		return owner[interfaceName];
	} 
};

/**
 * slouží k registraci zachytávaní události nad objektem, který implementuje toto rozhraní
 * @method
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {int} 1 v případě neúspěchu, 0 v pripade úspěchu  
 */
FoxcubService.JAK.ISignals.prototype.addListener = function(type, handleFunction, sender){
	return this.getInterface().addListener(this, type, handleFunction, sender);
};

/**
 * Slouží k zrušení zachytáváni události objektem, který implementuje toto rozhraní. 
 * @param {id} ID události, kterou jsme zachytávali
 */
FoxcubService.JAK.ISignals.prototype.removeListener = function(id) {
	return this.getInterface().removeListener(id);
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy FoxcubService.JAK.Signals
 * @method 
 * @param {string} type název vyvolané události
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost  
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci FoxcubService.JAK.Signals vyvolá chybu 'Interface not defined'  
 */
FoxcubService.JAK.ISignals.prototype.makeEvent = function(type, data){
	this.getInterface().makeEvent(type, this, data);
};
/**
 * nastavuje zprávu se jménem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @method 
 * @param {string} msgName název zprávy
 * @param {any} msgValue obsah zprávy
 */   
FoxcubService.JAK.ISignals.prototype.setSysMessage = function(msgName,msgValue){
	this.getInterface().setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
FoxcubService.JAK.ISignals.prototype.getSysMessage = function(msgName){
	return this.getInterface().getMessage(msgName);
};

FoxcubService.JAK.ISignals.prototype.getInterface = function() {
	return (typeof(this.signals) == "object" ? this.signals : FoxcubService.JAK.signals);
}
