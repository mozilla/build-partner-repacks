var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
 * inicializacia jaku - jak je rozdeleny do troch casti .. triedy ktore sa daju pouzit v moduloch su tu,
 * dajsie su v chrome/content/libs/JAK/, speedDial ma osobitneho jaka
 * POZOR! - JAK je upraveny - 1. aby vyhovoval mozile
 * 					          2. v moduloch nefunguju funkcie ako instanceof alebo typeof(iny objekt)
 *                               dalej tu neexistuju objekty ako document alebo window 
 */
FoxcubService.JAK = {};

FoxcubService.JAK.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};
FoxcubService.JAK.bind = function(obj,fnc){
	return function() {
		return fnc.apply(obj,arguments);
	}
}