var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
FoxcubService.Functions = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : 'FoxcubService.Functions',
			VERSION : '0.1',
			CLASS : 'class'
		});
FoxcubService.Functions.prototype.DOMAINS = {
	"seznam.cz" : 1,
	"sauto.cz" : 1,
	"sbazar.cz" : 1,
	"deniky.cz" : 1,
	"email.cz" : 1,
	"sfinance.cz" : 1,
	"firmy.cz" : 1,
	"horoskopy.cz" : 1,
	"hry.cz" : 1,
	"lide.cz" : 1,
	"mapy.cz" : 1,
	"pocasi.cz" : 1,
	"sprace.cz" : 1,
	"prozeny.cz" : 1,
	"sreality.cz" : 1,
	"sport.cz" : 1,
	"stream.cz" : 1,
	"super.cz" : 1,
	"sweb.cz" : 1,
	"zbozi.cz" : 1,
	"novinky.cz" : 1
};
FoxcubService.Functions.prototype.getMainDomain = function(url){
	if(!url) return "";
	var  parts = url.replace(/^([a-z]*\:\/\/)?/,'').split(/[\/\?#]/)[0].split(".");
	var len = parts.length;
	if(parts.length > 1){
		return parts[len - 2] + "." + parts[len - 1];
	} else {
		return parts[0];
	}
}
FoxcubService.Functions.prototype.isHomepageSet = function(){
	var pref = new FoxcubService.Preferences("browser.startup.");
	var favUrl = pref.getPref("homepage");
	if(!favUrl.success)return false;
	var url = this.getMainDomain(favUrl.value);
	return !!(url in this.DOMAINS);
}

FoxcubService.Functions.prototype.clone  = function(obj){
	if(!this.nativeJSON){
		this.nativeJSON = Components.classes["@mozilla.org/dom/json;1"]
			.createInstance(Components.interfaces.nsIJSON);
	}
	
	return (this.nativeJSON.decode(this.nativeJSON.encode(obj)));
};

