var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.CheckCompute = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.Email.CheckCompute",
			VERSION : "0.1",
			IMPLEMENT : [FoxcubService.LogInterface]
		});

/**
 *  vypocty pro kontrolu schranky - cas kontroly schranky
 *  TODO!!! - z konfigu
 */
FoxcubService.Email.CheckCompute.prototype.$constructor = function(lastCheck,weekIncome,lastIncome){
	//pocet sekund za tyzden
	this._weekSec = 7 * 24 * 60 * 60;
	//parametry na vypocet intenzity kontroly
	this._checkInterval = this.getConfigInterval("checkInterval");
	/**
	 * 		"checkInterval=0,8,14400,1\n"+
		"checkAfterIncomeInterval=0,0.5,0,0\n"+
		"timeArriveModifier=0,0.0001,1,1\n"+
	 */
	//kontrola mailu po prichode noveho mailu
	this._checkAfterIncomeInterval = this.getConfigInterval("checkAfterIncomeInterval");
	
	this._timeArriveModifier = this.getConfigInterval("timeArriveModifier");
	this._minInterval = this.getConfigInteger("minInterval");
	this._maxInterval = this.getConfigInteger("maxInterval");
	
	this._softLimitFast = 60;
	this._userLimitFast = 0;
	//cas poslednej kontroly
	this._lastCheck = lastCheck ? lastCheck : new Date().getTime()/1000;
	//pocet mailov za tyzden
	this._weekIncome = weekIncome ? weekIncome : 200;
	//cas poslednej kontroly ked prisli maily
	this._lastIncome = lastIncome ? lastIncome : new Date().getTime()/1000;
	
	this.logInterfaceProxy = null;
	//vyratanie intervalu
	var calculator = function(intervalType){
		var a = intervalType[0];
		var b = intervalType[1];
		var c = intervalType[2];
		var q = intervalType[3] ? true : false;
		return function(x){
			var z = x * x * a + x * b + c;
			if(q){
				return Math.sqrt(z);
			} else {
				return z;
			}
		}
	};
	//funkcie pre jednotlive intervali
	this.checkInterval = calculator(this._checkInterval);
	this.checkAfterIncomeInterval = calculator(this._checkAfterIncomeInterval);
	this.timeArriveModifier = calculator(this._timeArriveModifier);
};

FoxcubService.Email.CheckCompute.prototype.getConfigInterval = function(type){
	var val = FoxcubService.config.get("emailCheck",type);
	var vals = val.split(",");
	var intVals = [];
	for(i in vals){
		intVals.push(parseInt(vals[i]));
	}
	return intVals;
}
FoxcubService.Email.CheckCompute.prototype.getConfigInteger = function(type){
	return parseInt(FoxcubService.config.get("emailCheck",type));
}
/**
 * rata statistiky o pocte novych sprav
 * @param {int} emailCount - pocet novych emailov
 * @param {int} timestamp - cas poslednej kontroly v sekundach od .. 
 */
FoxcubService.Email.CheckCompute.prototype.collectStat = function(emailCount,timestamp){
	if (!timestamp) {
		var timestamp = new Date.getTime()/1000;
	}
    
	if (timestamp < this._lastCheck) {
		return;
	}
	//rozdiel medzi poslednou kontrolou a terajsou v sec
	var diff = timestamp - this._lastCheck;
	//pocet mailov ktore by mali v priemere prist za cas medzi kontrolami
	var mailsPerDiff = (this._weekIncome * diff)/this._weekSec;
	//odratame tento pocet
	this._weekIncome -= mailsPerDiff;
	if (this._weekIncome < 0) {
		this._weekIncome = 0;
	}
	//priratame pridene maily do vykendoveho priemeru
	this._weekIncome += emailCount;
    //upravyme cas poslednej kontroly a posledneho prichodu
    if (emailCount > 0){
        this._lastIncome = timestamp;
	}
    this._lastCheck = timestamp;
	//this.log(str + 'this._weekIncome = ' + this._weekIncome);
	//this.log(str + 'this._lastIncome = ' + this._lastIncome);
	//this.log(str + 'this._lastCheck = ' + this._lastCheck);
};
/**
 * Vyratanie priemerného intervalu medzi správami
 * @return {float} - pocet sekund za ktore pride nova sprava
 */
FoxcubService.Email.CheckCompute.prototype._calcAvgInterval = function(){
	return this._weekIncome < 0.0001 ? Number.MAX_VALUE : this.checkInterval(this._weekSec/this._weekIncome);
};
/**
 * Vyratanie noveho casu po prichode novej spravy
 * @return {float} - pocet sekund za ktore pride nova sprava
 */
FoxcubService.Email.CheckCompute.prototype._calcImdInterval = function(){
	var ellapsed = (this._lastCheck - this._lastIncome);
	if(this._weekIncome < 0.0001){
		return  Number.MAX_VALUE;
	}
	var modifTime = ellapsed * this.timeArriveModifier(this._weekSec/this._weekIncome);
	return this.checkAfterIncomeInterval(modifTime);
};

FoxcubService.Email.CheckCompute.prototype.getWeekIncome = function(){
	return this._weekIncome;
};

FoxcubService.Email.CheckCompute.prototype.getLastIncome = function(){
	return this._lastIncome;
};
/**
 * vyratanie dalsieho casu za ktory sa ma zahajit dalsia kontrola mailu 
 * @return {float} - cas za ktory ma prebehnut dalsia kontrola
 */
FoxcubService.Email.CheckCompute.prototype.calcCheckInterval = function(){
	var avgInterval = this._calcAvgInterval();
	var imdInterval = this._calcImdInterval();
	var interval;
	//nastavime vzdy ten nizsi interval
	if (imdInterval > avgInterval) {
		interval = avgInterval;
	} else {
		interval = imdInterval;
	}
	//osetrenie pre krajne hodnoty
	if (interval > this._maxInterval) {
		interval = this._maxInterval;
	}
	if (interval < this._minInterval) {
		interval = this._minInterval;
	}
	if (interval < this._softLimitFast) {
		interval = this._softLimitFast;
	}
	if (interval < this._userLimitFast) {
		interval = this._userLimitFast;
	}	
	//FIXME!!! - zabudnute ?
	if (interval < 60) {
		interval = 60;
	}
	
	return interval;
};
/**
 * Vrati realny cas kedy sa bude kontrolovat
 * @return {time} - cas v sekundach kedy bude prebiehat dalsia kontrola
 */
FoxcubService.Email.CheckCompute.prototype.calculateNextCheck = function(){
	return this._lastCheck + this.calcCheckInterval();
};