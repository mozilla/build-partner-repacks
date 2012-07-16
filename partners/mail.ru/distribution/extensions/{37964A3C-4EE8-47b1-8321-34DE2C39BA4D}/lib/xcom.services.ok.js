function MRSputnikApplication() {
    MRSputnikInstance = this;
    this.wrappedJSObject = modScope;
    this.isInitialized_ = false;
}

MRSputnikApplication.prototype.classDescription = "Odnoklassniki",
MRSputnikApplication.prototype.classID = Components.ID("{61F9ABE7-4886-43fc-80EF-B720ECF604C2}");
MRSputnikApplication.prototype.contractID = "@odnoklassniki.ru/toolbar/application;1",

MRSputnikApplication.prototype.QueryInterface = function(uuid) {
    if (uuid.equals(Ci.nsIObserver) || uuid.equals(Ci.nsISupports))
	    return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
};
MRSputnikApplication.prototype.observe = function() {
};

function MRSearchSuggest() 
{
	SuggestAutoComplete.call(this);
	this.debugZone = "MRSearchSuggest";

	var bundle_service = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
	var stringBundle = bundle_service.createBundle("chrome://odnoklassniki.ru.toolbar/locale/ansi.properties");
	if (stringBundle) 
	{
		this._suggestionsString = stringBundle.GetStringFromName("mailru.suggestions_locale")
	}
	this._prefs = new G_Preferences(MRSputnikPrefBase);
	this.wrappedJSObject = this
	
}

MRSearchSuggest.prototype = new SuggestAutoComplete;
MRSearchSuggest.prototype.classDescription = "Odnoklassniki Search Suggest",
MRSearchSuggest.prototype.classID = Components.ID("{FD75843F-FE83-4fad-AFC1-6F850EFB5C54}");
MRSearchSuggest.prototype.contractID = "@mozilla.org/autocomplete/search;1?name=odnoklassniki-search-suggest",

MRSearchSuggest.prototype.initUrl = function()
{
    var searchService_ = Cc[MRSputnikApplication.prototype.contractID].getService().wrappedJSObject.searchService;
	this.sEncoding = searchService_.sEncoding;
	this.sUrlSuggest = searchService_.sUrlSuggest;
	this.sUrlSuggest = 
		this.sUrlSuggest 
		+ (this.sUrlSuggest.match(/\?/) ? "&" : "?") 
		+ searchService_.sQuery + "=";
}

var aComponents = [MRSputnikApplication, MRSearchSuggest];