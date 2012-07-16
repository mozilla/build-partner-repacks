function MRSputnikApplication() {
    MRSputnikInstance = this;
    this.wrappedJSObject = modScope;
    this.isInitialized_ = false;
}

MRSputnikApplication.prototype.classDescription = "SputnikMailRu",
MRSputnikApplication.prototype.classID = Components.ID("{83CEAEC1-8FAD-48CD-A4FE-B323881B5693}");
MRSputnikApplication.prototype.contractID = "@mail.ru/toolbar/application;1",

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
	var stringBundle = bundle_service.createBundle("chrome://mail.ru.toolbar/locale/ansi.properties");
	if (stringBundle) 
	{
		this._suggestionsString = stringBundle.GetStringFromName("mailru.suggestions_locale")
	}
	this._prefs = new G_Preferences(MRSputnikPrefBase);
	this.wrappedJSObject = this
}

MRSearchSuggest.prototype = new SuggestAutoComplete;
MRSearchSuggest.prototype.classDescription = "Sputnik Search Suggest",
MRSearchSuggest.prototype.classID = Components.ID("{ADDE6E79-5963-444d-B27B-7407B485463C}");
MRSearchSuggest.prototype.contractID = "@mozilla.org/autocomplete/search;1?name=sputnik-search-suggest",

MRSearchSuggest.prototype.initUrl = function()
{
    var searchService_ = Cc[MRSputnikApplication.prototype.contractID].getService().wrappedJSObject.searchService;
	this.sEncoding = searchService_.sEncoding;
	this.sUrlSuggest = searchService_.sUrlSuggest;
	this.sUrlSuggest = 
		this.sUrlSuggest 
		+ (this.sUrlSuggest.match(/\?/) ? "&" : "?") 
		+ searchService_.sQuerySuggest + "=";
}

var aComponents = [MRSputnikApplication, MRSearchSuggest];