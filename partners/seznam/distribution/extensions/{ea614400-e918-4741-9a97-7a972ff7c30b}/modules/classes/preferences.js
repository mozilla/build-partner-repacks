var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Preferences = FoxcubService.JAK.ClassMaker.makeClass({
	NAME: "FoxcubService.Preferences",
	IMPLEMENT : [FoxcubService.LogInterface],
	VERSION: "0.1"
});

FoxcubService.Preferences.prototype.$constructor = function(branchStr) {
	this.nativeJSON = Components.classes["@mozilla.org/dom/json;1"]
			.createInstance(Components.interfaces.nsIJSON);
	this.preferenceService = Components.classes['@mozilla.org/preferences-service;1']
			.getService(Components.interfaces.nsIPrefService);
	this.branch = this.preferenceService.getBranch(branchStr);
	
}

FoxcubService.Preferences.prototype.getPref = function(key,object){
	var out;
	var val;
	var type = this.branch.getPrefType(key);
	try {
		switch (type){
			case this.branch.PREF_BOOL:
				val = this.branch.getBoolPref(key);
				break;
			case this.branch.PREF_INT:
				val = this.branch.getIntPref(key);
				break;
			case this.branch.PREF_STRING:
				if(object){
					var val_tmp = this.branch.getCharPref(key);
					val = this.nativeJSON.decode(val_tmp);
				}else{
					var val_tmp = this.branch.getCharPref(key);
					val = unescape(val_tmp);
				}
				 //XXX!!! - preco unescape?
				break;
			default:
				this.log("unknown type/or key: " + key,"error")
				throw new Error("ERROR [Preference].getPref :: unknown type/or key: " + key);
				break;
		}
		out = {
			success : true,
			key : key,
			value : val
		};
	} catch(e){
		out = {
			success : false,
			key : key,
			msg : '[Preference].getPref :: ',
			err : e
		};
		this.log(e,"error")
	} finally {
		return out;
	}
}

FoxcubService.Preferences.prototype.setPref = function(key,value){
	var out;
	try {
		switch(typeof value){
			case 'boolean':
				this.branch.setBoolPref(key,value);
				break;
			case 'string':
				var str = this.encodePrefStr(value);
				this.branch.setCharPref(key,str);
				break;
			case 'number':
				this.branch.setIntPref(key,value);
				break;
			case 'object':
				var str = this.nativeJSON.encode(value);
				this.branch.setCharPref(key,str);
				break;
			default :
				this.log(" unknown value (" + typeof(value) + ") type for key: " + key,"error");
				throw new Error("ERROR [Preference].setPref :: unknown value (" + typeof(value) + ") type for key: " + key);
				break;
		}
		out = {
			success : true,
			key : key,
			value : value
		};
	} catch(e){
		out = {
			success : false,
			key : key,
			value : value,
			msg : '[Preference].setPref :: ',
			err : e
		};		
	} finally {
		return out;
	}
}
FoxcubService.Preferences.prototype.encodePrefStr = function(str){
	var out = [];
	var len = str.length
	for(var i = 0; i < len; i++){
		var tmp = str.charAt(i)
		var x = tmp.charCodeAt(0);
		if(x <= 127 ){
			out.push(tmp)
		} else {
			var strNum = x.toString(16);
			
			while(strNum.length < 4){
				strNum = "0" + strNum;
			}
			out.push("\\u" + strNum);
		}
	}
	return out.join("");
};
FoxcubService.Preferences.prototype.delPref = function(key){
	var out;
	try {
		this.branch.deleteBranch(key);
		out = {
			success : true,
			key : key
		};
	} catch(e){
		out = {
			success : false,
			err : e,
			msg : '[Preference].delPref :: '
		};
	} finally {
		return out;
	}
}
/**
 * vrati zoznam preferencii
 * @return {object} {list,obj} 
 *
 */
FoxcubService.Preferences.prototype.getList = function(){
	var obj = {};
	var list = this.branch.getChildList("",obj);
	return {
		list : list,
		obj : obj
	};
};

