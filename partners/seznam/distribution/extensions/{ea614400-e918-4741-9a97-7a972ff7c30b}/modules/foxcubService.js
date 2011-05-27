var EXPORTED_SYMBOLS = ["FoxcubService"];

if ("undefined" == typeof(FoxcubService)) {
	var FoxcubService = {};
};

//pomocna funkcia na debugovanie
FoxcubService.debug = function(msg,convert) {
	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
	switch(convert){
		case 'object':
		try{
			var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
			msg = nativeJSON.encode(msg);		
		}catch(e){
			msg =  " error:: " +e.toString();
		}
		break;
		case 'xml':
		var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer);
 		var msg = serializer.serializeToString(msg);
		break;
		
 	
	} 
	promptService.alert(null, "Debug", msg);
};

//definicia konstant
FoxcubService.SOURCE = "FF_3";
FoxcubService.VERSION = "2.1.14";
FoxcubService.FOXCUB_PREF_BRANCH = "extensions.foxcub.";
FoxcubService.EXTENSION_ID = "{ea614400-e918-4741-9a97-7a972ff7c30b}";
//cesta k extensnu
FoxcubService.EXTENSION_PATH = __LOCATION__.parent.parent.path;
//path separator
FoxcubService.SEP = (FoxcubService.EXTENSION_PATH.indexOf("\\")==-1)?"/":"\\";
//nastavi sa v base managery
FoxcubService.FF4 = false;

//ziskanie release

var branch  = Components.classes['@mozilla.org/preferences-service;1']
			.getService(Components.interfaces.nsIPrefService).getBranch(FoxcubService.FOXCUB_PREF_BRANCH);
var constids = FoxcubService.SOURCE.split("_");
FoxcubService.PRODUCT = constids[0];
var release = constids[1]; 
try{
	var tmprelease = branch.getCharPref("release");
	if(tmprelease)release = tmprelease; 
}catch(e){
}
//release
FoxcubService.RELEASE = release;
FoxcubService.SOURCE = FoxcubService.PRODUCT + "_" + FoxcubService.RELEASE;

//lokalizacia
var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
FoxcubService.localeBundle = gBundle.createBundle("chrome://foxcub/locale/foxcub.properties");
FoxcubService.$ = function(msg) {	
	var str = this.localeBundle.GetStringFromName(msg);	
	return str;
};



