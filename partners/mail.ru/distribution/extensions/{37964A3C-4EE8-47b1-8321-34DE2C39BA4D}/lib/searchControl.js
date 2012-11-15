function MRSearchObserver(searchBox, flavourSet) 
{
	this.debugZone = "search-dragdrop-observer";
	this.flavourSet_ = flavourSet;
	this.searchBox_ = searchBox
}
MRSearchObserver.prototype.getSupportedFlavours = function() {
	return this.flavourSet_
};
MRSearchObserver.prototype.onDragOver = function() {
};
MRSearchObserver.prototype.onDrop = function(event, dropdata) 
{
	if (!dropdata || !dropdata.data || dropdata.data == "")
		return;
	if (event.target != this.searchBox_)
		return;
	this.loadSearch_(dropdata.data)
};
MRSearchObserver.prototype.loadSearch_ = function(text) 
{
	var str = StripHTML(text);
	str = str.replace(/[\r\n]/g, "");
	str = str.trim();
	this.searchBox_.value = str;
	var toolbarItem = this.searchBox_;
	G_Debug(this, "loadSearch_");
	toolbarItem.mSearchBox.doSearch(null, false);
};
function MRSearchSuggestItem(query, opt_type) {
	this.debugZone = "search-suggest-item";
	this.query = query;
	this.suggestType = opt_type || "MRSearch1";
}
MRSearchSuggestItem.prototype.comment = "";

function MRSearchHistory() 
{
	this.debugZone = "history-service";
	this.history_ = [];
	this.prefs_ = null;
	this.wrappedJSObject = this
	this.curValue = "";
	this.sSuggestTypeLocale = "";
	this.sFile = "history.xml";
 	this.init();
}
MRSearchHistory.HISTORY_MAX_ELEMENTS = 100;
MRSearchHistory.prototype.classID = Components.ID("{A81B8DEB-63E2-491e-8495-A4D972EB6A5F}");
MRSearchHistory.prototype.init = function() {
    var bundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
    var stringBundle = bundleService.createBundle(MRChromeBase + ".toolbar/locale/ansi.properties");
    this.sSuggestTypeLocale = stringBundle.GetStringFromName("mailru.history_locale");
    this.prefs_ = new G_Preferences(MRSputnikPrefBase, false, true);
    this.observers_ = [
			new G_ObserverServiceObserver(
				"MAILRU_SPUTNIK_CLEAR_HISTORY",
				BindToObject(this.clearHistory_, this)
			)
	];
    new G_ObserverServiceObserver(
		"xpcom-shutdown",
		BindToObject(this.shutdown_, this),
		true
	);
};
MRSearchHistory.prototype.initNotificationHistory = function()
{
	this.sFile = "notification.xml";
	var bundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
		, stringBundle = bundleService.createBundle(MRChromeBase + ".toolbar/locale/ansi.properties");
	this.sSuggestTypeLocale = stringBundle.GetStringFromName("mailru.history_locale");
	this.prefs_ = new G_Preferences(MRSputnikPrefBase, false, true);
	this.observers_ = [];
	new G_ObserverServiceObserver(
		"xpcom-shutdown",
		BindToObject(this.shutdown_, this),
		true
	);
	this.loadHistory_()
};
MRSearchHistory.prototype.getHistoryItems = function(match) {
    G_Debug(this, "getHistoryItems:" + this.sSuggestTypeLocale);
    var items = [];
    var prefix = match || "";
    prefix = prefix.toLowerCase();
    var isShowHistory = (match == "");
    var max = isShowHistory ? MRSearchHistory.HISTORY_MAX_ELEMENTS : 10;
    for (var i = 0, item = null; (item = this.history_[i]) && items.length < max; ++i) {
        if (item.toLowerCase().startsWith(prefix) || isShowHistory) {
            items.push(new MRSearchSuggestItem(item, this.sSuggestTypeLocale));
        }
    }
    return items;
};
MRSearchHistory.prototype.isEmpty = function() 
{
	return this.history_.length == 0
};
MRSearchHistory.prototype.getCurValue = function() 
{
	return this.curValue;
};
MRSearchHistory.prototype.setCurValue = function(sValue) 
{
	this.curValue=sValue;
};

MRSearchHistory.prototype.loadHistory_ = function(opt_filename) {
    var filename = opt_filename || this.sFile;
    var file = G_File.getProfileFile(MRSputnikDataDir);
    file.append(filename);
    if (!file.exists())
        return;
    var doc;
    try {
        doc = G_FirefoxXMLUtils.loadXML(file)
    }
    catch (e) {
    }
    if (!doc)
        return;
    this.history_ = [];
    for (var i = 0; i < doc.documentElement.childNodes.length; ++i) {
        var elt = doc.documentElement.childNodes[i];
        this.history_.push(elt.getAttribute("query"));
    }
};
MRSearchHistory.prototype.saveHistory_ = function(opt_filename) 
{
	var filename = opt_filename || this.sFile,
		doc = G_FirefoxXMLUtils.newXML("searches"),
		root = doc.documentElement;
	root.setAttribute("version", "1.0");
	for (var i = 0, historyItem = null; historyItem = this.history_[i]; ++i) 
	{
		var searchElt = doc.createElement("search");
		searchElt.setAttribute("query", historyItem);
		root.appendChild(searchElt)
	}
	var dir = G_File.getProfileFile(MRSputnikDataDir);
	dir.exists() && !dir.isDirectory() && dir.remove(true);
	dir.exists() || dir.create(dir.DIRECTORY_TYPE, 484);
	dir.append(filename);
	var stream = Cc["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Ci.nsIFileOutputStream);
	stream.init(dir, G_File.PR_WRONLY | G_File.PR_CREATE_FILE
					| G_File.PR_TRUNCATE, -1, 0);
	var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"]
			.createInstance(Ci.nsIDOMSerializer);
	serializer.serializeToStream(doc.documentElement, stream, "UTF-8")
};
MRSearchHistory.prototype.shutdown_ = function() 
{
	for (var i = 0, obs = null; obs = this.observers_[i]; ++i)
	{
		obs.unregister();
	}
	this.saveHistory_()
};
MRSearchHistory.prototype.clearHistory_ = function() {
	this.history_ = [];
	this.saveHistory_()
};
MRSearchHistory.prototype.removeFromHistory = function(histItem) 
{
	for (var i = 0, otherItem; otherItem = this.history_[i]; ++i)
		if (otherItem == histItem) 
		{
			this.history_.splice(i, 1);
			break
		}
};
MRSearchHistory.prototype.addToHistory_ = function(sQuery)
{
	if (sQuery.trim() == "")
		return;
	var items = this.history_,
		newHistory = [sQuery],
		max = MRSearchHistory.HISTORY_MAX_ELEMENTS;
	for (var i = 0; i < items.length && newHistory.length < max; i++)
	{
		if (items[i] != sQuery) 
		{
			newHistory.push(items[i]);
		}
	}
	this.history_ = newHistory;
};

MRSearchHistory.prototype.hasItem = function(sQuery)
{
	if (sQuery.trim() == "")
		return false;
	var items = this.history_;
	for (var i = 0; i < items.length; i++)
	{
		if (items[i] == sQuery) 
		{
			return true;
		}
	}
	return false;
};


//===========================================================================
function MRSearchCtrlOverlay(searchBox, win) {
	this.debugZone = "search-box-overlay";
	this.searchBox_ = searchBox;
	this.searchBox_.addEventListener("keydown", BindToObject(this.onKeyDown_,
					this), false);
	this.searchBox_.addEventListener("keypress", BindToObject(this.onKeyPress_,
					this), false);
	this.searchBox_.textBox.addEventListener("focus", BindToObject(
					this.onFocus_, this), true);
	this.searchBox_.textBox.addEventListener("blur", BindToObject(this.onBlur_,
					this), true);
	var tbApp = Cc[MRContractID].getService();
	this.searchService_ = tbApp.wrappedJSObject.searchService;
	this.historyCtrl = tbApp.wrappedJSObject.historyService;
	this.notificationHist = new MRSearchHistory();
	this.notificationHist.initNotificationHistory();
	this.prefs_ = new G_Preferences(MRSputnikPrefBase, false, true);
	this.lockOnChange = false;
	this.lockSearchParam = false;
	this.sFullTypingText = "";
	this.sTypingText = "";
	this.bFocus = false;
	this.bCue = false;
	this.bEngLayout = true;
	this.nLastKeyCode = 0;
	this.aTranslitLow = {};	
	this.aTranslitUp = {};	
	this.aTranslitLowRus = {};	
	this.aTranslitUpRus = {};	
	this.initTranslitTable();
	if(this.prefs_.getPref("search.engine.start.default",""))
	{
		this.searchBox_.nID = this.prefs_.getPref("search.engine.start.id","1");
	}
	else
	{
		this.searchBox_.nID = this.prefs_.getPref("search.engine","1");
	}
	this.observers_ = [
			new G_ObserverServiceObserver(
				"MAILRU_SPUTNIK_CLEAR_HISTORY",
				BindToObject(this.clearHistory_, this)
			)
	]
	this.win_ = win
}
MRSearchCtrlOverlay.prototype.shutdown = function() {
	for (var i = 0, obs = null; obs = this.observers_[i]; ++i)
		obs.unregister();
	this.win_ = null
};
MRSearchCtrlOverlay.prototype.onKeyDown_ = function(event) 
{
	if( this.aTranslitLowRus[event.keyCode] )
	{
		this.nLastKeyCode = event.keyCode;
	}
		
	this.ignoreFocus_ = true
};
MRSearchCtrlOverlay.prototype.onKeyPress_ = function(event) 
{
	if( this.aTranslitLowRus[this.nLastKeyCode] == event.charCode )
	{
		this.bEngLayout = false;
	}
	else if( this.aTranslitLow[this.nLastKeyCode] == event.charCode )
	{
		this.bEngLayout = true
	}
	switch (event.keyCode) 
	{
		case event.DOM_VK_UP :
			break;
		case event.DOM_VK_DOWN :
			if (event.ctrlKey)
			{
				
			}
			else if (event.altKey) 
			{
				event.preventDefault();
			}
			break;
		case event.DOM_VK_RETURN :
		    G_Debug(this, "DOM_VK_RETURN");
		    this.doSearch(event, null);
			break;
		case event.DOM_VK_ESCAPE :
			this.searchBox_.value = "";
			break
	}
	this.ignoreFocus_ = false
};
MRSearchCtrlOverlay.prototype.onFocus_ = function() 
{
	this.bFocus = true;
	this.hideCue();
	this.lockOnChange=false;
	this.onUserAction(true);
	if (this.ignoreFocus_)
		return;
};
MRSearchCtrlOverlay.prototype.onBlur_ = function() 
{
	this.bFocus = false;
	this.setCue();
};

MRSearchCtrlOverlay.prototype.doSearch = function(event, altKey) {
    G_Debug(this, "doSearch");
    var forceNewTab = false;
    if (event && event.altKey || altKey)
        forceNewTab = true;
    this.onUserAction(false);

    var search_str = this.getSearchText_();
    if (search_str.length != 0) {
        var converter = Components.classes['@mozilla.org/intl/texttosuburi;1'].createInstance(Components.interfaces.nsITextToSubURI);
        var search_text = converter.ConvertAndEscape(this.searchService_.sEncoding, search_str);
        var url = this.searchService_.sUrlSearch;
        url = url + (url.match(/\?/) ? "&" : "?") + this.searchService_.sQuery + "=" + search_text;

        if (this.searchService_.nID == 11) {
            var browser_url = this.win_.getBrowser().webNavigation.currentURI.spec;
            var parsed_url = null;
            var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            try {
                parsed_url = ioservice.newURI(browser_url, null, null);
            } catch (ex) { }
            if (parsed_url != null) {
                try {
                    url = url + "&site=" + parsed_url.host;
                } catch (e) { };
            }
        }
        if (this.searchService_.sParam.length) {
            if(this.prefs_.getPref("referer","") == 'mrff') {
                url += "&" + 'fr=mrfftb';
            } else {
                url += "&" + this.searchService_.sParam;
            }
        }
        if (this.searchService_.sPostfix.length) {
            url += "&" + this.searchService_.sPostfix;
        }
        if (this.prefs_.getBoolPrefOrDefault("shortmode", false)) {
            url += "&fr3=fflite";
        }

        this.navigateSearchUrl(this.win_, url, false, event);
        this.historyCtrl.addToHistory_(search_str)
    }
    else {
        this.navigateSearchUrl(this.win_, "http://go.mail.ru/", false, event);
    }
};
MRSearchCtrlOverlay.prototype.loadHistory = function(historyItem, forceNewTab) 
{
	var url = historyItem.uri;
	this.searchService_.broadcastSearch(historyItem.query, url,
			historyItem.searchType);
	this.navigateSearchUrl(this.win_, url, forceNewTab, null);
};
MRSearchCtrlOverlay.prototype.getSearchText_ = function() 
{
    if (this.bCue) {
        return "";
    }
    return this.searchBox_.value.replace(/^\s+/g, "")
};
MRSearchCtrlOverlay.prototype.setText = function(sValue) 
{
	this.hideCue();
	this.searchBox_.value = sValue;
};
MRSearchCtrlOverlay.prototype.clearHistory_ = function() {
	this.searchBox_.value = ""
};
MRSearchCtrlOverlay.prototype.onTextChanged = function()
{
	G_Debug("onTextChanged", this.lockOnChange);
	if(!this.lockOnChange)
	{
		this.onUserAction(false);
		if(!this.lockSearchParam)
		{
			this.searchService_.sParam = "fr=ffspt0";
		}
		this.lockSearchParam = false;
	}
	if(this.historyCtrl)
	{
		this.historyCtrl.setCurValue(this.searchBox_.value);
	}
};
MRSearchCtrlOverlay.prototype.onUserAction = function(bSetText)
{
	this.prefs_.setPref("last_search_action",(new Date()).toGMTString());
	if(bSetText && this.sFullTypingText)
	{
		this.searchBox_.value = this.sFullTypingText; 
		this.sFullTypingText = "";
		this.sTypingText = "";
	}
};
MRSearchCtrlOverlay.prototype.broadcastSearch = function(query, url, opt_searchType)
{
	opt_searchType = opt_searchType || "";
	var searchData = [query, url, opt_searchType].join("\n"),
		observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
	observerService.notifyObservers(null, "MAILRU_SEARCH", searchData)
};
MRSearchCtrlOverlay.prototype.navigateSearchUrl = function(win, url, forceNewTab, event) {
    var tabbrowser = win.gBrowser;
    if (forceNewTab || this.prefs_.getPref("search_new_tab", null)) {
        var tab = tabbrowser.addTab(url);
        if (this.prefs_.getPref("select_new_tab"))
        {
            tabbrowser.selectedTab = tab
        }
    }
    else {
        event && ("click" == event.type || "command" == event.type) ?
			win.openUILink(url, event)
			: win.gBrowser.selectedBrowser.loadURI(url, null, null);
    }
};
MRSearchCtrlOverlay.prototype.initTranslitTable = function() 
{
	this.aTranslitLow[0x51]=0x71;
	this.aTranslitLow[0x57]="w";
	this.aTranslitLow[0x45]="e";
	this.aTranslitLow[0x52]="r";
	this.aTranslitLow[0x54]="t";
	this.aTranslitLow[0x59]="y";
	this.aTranslitLow[0x55]="u";
	this.aTranslitLow[0x49]="i";
	this.aTranslitLow[0x4f]="o";
	this.aTranslitLow[0x50]="p";
	this.aTranslitLow[0x219]="[";
	this.aTranslitLow[0x221]="]";

	this.aTranslitLow[0x41]="a";
	this.aTranslitLow[0x53]="s";
	this.aTranslitLow[0x44]="d";
	this.aTranslitLow[0x46]="f";
	this.aTranslitLow[0x47]="g";
	this.aTranslitLow[0x48]="h";
	this.aTranslitLow[0x4a]="j";
	this.aTranslitLow[0x4b]="k";
	this.aTranslitLow[0x4c]="l";
	this.aTranslitLow[0x59]=";";
	this.aTranslitLow[0x222]="'";

	this.aTranslitLow[0x5a]="z";
	this.aTranslitLow[0x58]="x";
	this.aTranslitLow[0x43]="c";
	this.aTranslitLow[0x56]="v";
	this.aTranslitLow[0x42]="b";
	this.aTranslitLow[0x4e]="n";
	this.aTranslitLow[0x4d]="m";
	this.aTranslitLow[0x188]=",";
	this.aTranslitLow[0x190]=".";
	this.aTranslitLow[0x191]="/";

	this.aTranslitLow[0x192]="`";

	this.aTranslitLowRus[0x51]=0x439;
	this.aTranslitLowRus[0x57]="�";
	this.aTranslitLowRus[0x45]="�";
	this.aTranslitLowRus[0x52]="�";
	this.aTranslitLowRus[0x54]="�";
	this.aTranslitLowRus[0x59]="�";
	this.aTranslitLowRus[0x55]="�";
	this.aTranslitLowRus[0x49]="�";
	this.aTranslitLowRus[0x4f]="�";
	this.aTranslitLowRus[0x50]="�";
	this.aTranslitLowRus[0x219]="�";
	this.aTranslitLowRus[0x221]="�";

	this.aTranslitLowRus[0x41]="�";
	this.aTranslitLowRus[0x53]="�";
	this.aTranslitLowRus[0x44]="�";
	this.aTranslitLowRus[0x46]="�";
	this.aTranslitLowRus[0x47]="�";
	this.aTranslitLowRus[0x48]="�";
	this.aTranslitLowRus[0x4a]="�";
	this.aTranslitLowRus[0x4b]="�";
	this.aTranslitLowRus[0x4c]="�";
	this.aTranslitLowRus[0x59]="�";
	this.aTranslitLowRus[0x222]="�";

	this.aTranslitLowRus[0x5a]="�";
	this.aTranslitLowRus[0x58]="�";
	this.aTranslitLowRus[0x43]="�";
	this.aTranslitLowRus[0x56]="�";
	this.aTranslitLowRus[0x42]="�";
	this.aTranslitLowRus[0x4e]="�";
	this.aTranslitLowRus[0x4d]="�";
	this.aTranslitLowRus[0x188]="�";
	this.aTranslitLowRus[0x190]="�";
	this.aTranslitLowRus[0x191]=".";

	this.aTranslitLowRus[0x192]="�";
};
MRSearchCtrlOverlay.prototype.translit = function() 
{
	G_Debug(this,"translit");
	var sCurValue = this.getSearchText_();
	var sTranslit = "";
	for (var i = 0; i < sCurValue.length; ++i)
	{
		var nCode=sCurValue.charCodeAt(i);
		G_Debug("translit nCode",nCode + " " + this.aTranslitLow[nCode] + " " + this.aTranslitLowRus[nCode])
		if(this.aTranslitLowRus[nCode])
		{
			sTranslit+=this.aTranslitLow[nCode];
		}
		else
		{
			sTranslit+=this.aTranslitLowRus[nCode];
		
		}
	}
	this.searchBox_.value = sTranslit;
}
MRSearchCtrlOverlay.prototype.updateCue = function() 
{
	if(this.bCue)
	{
		this.searchBox_.value = this.searchService_.sCue;
		this.searchBox_.style.color = "gray";
	}
};
MRSearchCtrlOverlay.prototype.setCue = function() 
{
	if(this.searchBox_.value == "" && !this.bFocus)
	{
		this.bCue=true;
		this.updateCue();
	}
};
MRSearchCtrlOverlay.prototype.hideCue = function() 
{
	if(this.bCue)
	{
		this.searchBox_.value = "";
		this.searchBox_.style.color = "black";
		this.bCue = false;
	}
};
//===========================================================================
function MRSearchService() {
	this.debugZone = "search-service";
	this.nID = 1;
	this.sUrlSearch = "";
	this.sUrlSuggest = "";
	this.sQuery = "";
        this.sQuerySuggest = "q";
	this.sEncoding = "";
	this.sParam = "";
	this.sPostfix = "";
	this.sCue = "";
	this.prefs_ = new G_Preferences(MRSputnikPrefBase);
	this.wrappedJSObject = this;

}

MRSearchService.prototype.classID = Components.ID("{D03D30B2-D257-4616-8870-A8A38C017C8A}");
MRSearchService.prototype.contractID = "@mail.ru/toolbar/search-service;1";
MRSearchService.prototype.setSearchEngine = function(
	nID,
	sUrlSearch,
	sUrlSuggest,
	sQuery,
	sEncoding,
	sCue
) {
    this.nID = nID;
    this.sUrlSearch = sUrlSearch;
    this.sUrlSuggest = sUrlSuggest;
    this.sQuery = sQuery;
    this.sEncoding = sEncoding;
    this.sCue = sCue;
};

function SuggestAutoComplete() {
}
SuggestAutoComplete.prototype = {
    _serverErrorLog: [],
    _maxErrorsBeforeBackoff: 3,
    _serverErrorPeriod: 600000,
    _serverErrorTimeoutIncrement: 600000,
    _serverErrorTimeout: 0,
    _nextRequestTime: 0,
    _serverErrorURI: null,
    _requestSuggest: null,
    _listener: null,
    _acResult: null,
    sUrlSuggest: null,
    sEncoding: null,
    sEncodingSuggest : 'utf-8',
    onSuggestReadyStateChange: function(searchParam) {
        if (!this._requestSuggest || this._requestSuggest.readyState != 4)
            return;
        try {
            var status = this._requestSuggest.status
        }
        catch (e) {
        }
        var results = [];
        var xmlDoc = this._requestSuggest.responseXML;
        if (status == 200 && xmlDoc) {
            this._clearServerErrors();
            var queries = xmlDoc.getElementsByTagName("query");
            for (var i = 0; i < queries.length; i++) {
                results.push(new MRSearchSuggestItem(queries[i].textContent, this._suggestionsString));
            }
        }
        else {
            this._isBackoffError(status) && this._noteServerError();
        }
        this.onSuggestResultsReady(this._searchString, results, searchParam);
        this._requestSuggest = null
    },
    onSuggestResultsReady: function(searchString, results, searchParam) {
        if (this._listener) {
            this._suggestResults = results;
            if (this._suggestResults != null) {
                this._acResult = new SuggestAutoCompleteResult(
					searchString,
					Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "",
					this._suggestResults, searchParam
				);
                this._listener.onSearchResult(this, this._acResult)
            }
        }
    },
    onSuggestError: function(searchParam) {
        if (this._listener) {
            this._suggestResults = [];
            this._acResult = new SuggestAutoCompleteResult("",
					Ci.nsIAutoCompleteResult.RESULT_FAILURE, 0, "",
					this._suggestResults, searchParam);
            this._listener.onSearchResult(this, this._acResult)
        }
    },
    startSearch: function(searchString, searchParam, previousResult, listener) {
        G_Debug(this, "startSearch");
        this._requestSuggest && this.stopSuggestSearch();
        if (!searchString) {
            var historyService = Cc[MRContractID].getService().wrappedJSObject.historyService;
            searchString = historyService.getCurValue();
        }
        this._suggestResults = null;
        this._listener = listener;
        this._searchString = searchString;
        if (searchString && this._okToRequest()) {
            this.initUrl();
            this._requestSuggest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            //G_Debug(this, "url sagest = "+this.sUrlSuggest);
            this._requestSuggest.open("GET", this.sUrlSuggest + encodeURIComponent(searchString), true);
            var self = this;
            function onSuggestReadyStateChange() {
                self.onSuggestReadyStateChange(searchParam)
            }
            function onSuggestError() {
                self.onSuggestError(searchParam)
            }
            this._requestSuggest.overrideMimeType('text/xml;charset=' + this.sEncodingSuggest);
            this._requestSuggest.onreadystatechange = onSuggestReadyStateChange;
            this._requestSuggest.onerror = onSuggestError;
            this._requestSuggest.send(null)
        }
        else {
            this.onSuggestResultsReady(searchString, [], searchParam)
        }
    },
    stopSuggestSearch: function() {
        if (this._requestSuggest) {
            this._requestSuggest.abort();
            this._requestSuggest = null
        }
    },
    stopSearch: function() {
        this.stopSuggestSearch();
        this._listener = null
    },
    getResult: function(idx) {
        if (!this._acResult)
            return null;
        return this._acResult.results[idx]
    },
    getResultIcon: function(idx) {
        if (!this._acResult)
            return null;
        return this._acResult.getIconAt(idx)
    },
    _noteServerError: function() {
        var currentTime = Date.now();
        this._serverErrorLog.push(currentTime);
        this._serverErrorLog.length > this._maxErrorsBeforeBackoff
				&& this._serverErrorLog.shift();
        if (this._serverErrorLog.length == this._maxErrorsBeforeBackoff
				&& currentTime - this._serverErrorLog[0] < this._serverErrorPeriod) {
            this._serverErrorTimeout = this._serverErrorTimeout * 2
					+ this._serverErrorTimeoutIncrement;
            this._nextRequestTime = currentTime + this._serverErrorTimeout
        }
    },
    _clearServerErrors: function() {
        this._serverErrorLog = [];
        this._serverErrorTimeout = 0;
        this._nextRequestTime = 0
    },
    _okToRequest: function() {
        return Date.now() > this._nextRequestTime
    },
    _isBackoffError: function(status) {
        return status == 500 || status == 502 || status == 503
    },
    QueryInterface: function(iid) {
        if (!iid.equals(Ci.nsIAutoCompleteSearch)
				&& !iid.equals(Ci.nsIAutoCompleteObserver)
				&& !iid.equals(Ci.nsISupports))
            throw Cr.NS_ERROR_NO_INTERFACE;
        return this
    }
};

function SuggestAutoCompleteResult(
	searchString,
	searchResult,
	defaultIndex,
	errorDescription,
	suggestResults,
	searchParam
)
{
	this.debugZone = "suggest-results";
	this._searchString = searchString;
	this._searchResult = searchResult;
	this._defaultIndex = defaultIndex;
	this._errorDescription = errorDescription;
	var forceHistory = !searchString;
	this._showIcons = forceHistory;
	var historyResults = [];
	var	prefs = new G_Preferences(MRSputnikPrefBase);
	if (forceHistory || prefs.getPref("search_box_save_history")) 
	{
	    var historyService = Cc[MRContractID].getService().wrappedJSObject.historyService;
		historyResults = forceHistory ? 
			historyService.getHistoryItems("") :
			historyService.getHistoryItems( searchString );
	}
	var results = [];
	results = results.concat(historyResults);
	results = results.concat(suggestResults);
	this.results = results
}
SuggestAutoCompleteResult.prototype = {
    getValueAt: function(index) {
        return this.results[index].query
    },
    getLabelAt: function(index) {
        return this.getValueAt(index);
    },
    getCommentAt: function(index) {
        if (
			index == 0
			|| this.results[index].suggestType != this.results[index - 1].suggestType
		) {
            return this.results[index].suggestType;
        }
        return ""
    },
    getStyleAt: function(index) {
        var style = "gtbAutoCompleteRow";
        if (index != 0
				&& this.results[index].suggestType != this.results[index - 1].suggestType)
            style = "gtbAutoCompleteSeparator";
        if (this._showIcons)
            style += "Icons";
        return style
    },
    getIconAt: function(index) {
        var result = this.results[index];
        if (!result || !this._showIcons)
            return null;
        return result.icon
    },
    getImageAt: function(index) {
        return this.getIconAt(index)
    },
    removeValueAt: function(index, removeFromDatabase) {
        var histItem = this.results[index];
        this.results.splice(index, 1);
        var bundle_service = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
			stringBundle = bundle_service.createBundle(MRChromeBase + ".toolbar/locale/mail.ru.properties"),
			historyComment = stringBundle.GetStringFromName("mailru.history_locale");
        if (!removeFromDatabase || histItem.comment != historyComment)
            return;
        var historyService = Cc[MRContractID].getService().wrappedJSObject.historyService;
        historyService.removeFromHistory(histItem)
    },
    QueryInterface: function(iid) {
        if (!iid.equals(Ci.nsIAutoCompleteResult)
				&& !iid.equals(Ci.nsISupports))
            throw Cr.NS_ERROR_NO_INTERFACE;
        return this
    }
};
SuggestAutoCompleteResult.prototype.__defineGetter__("searchString",
		function() {
			return this._searchString
		});
SuggestAutoCompleteResult.prototype.__defineGetter__("searchResult",
		function() {
			return this._searchResult
		});
SuggestAutoCompleteResult.prototype.__defineGetter__("defaultIndex",
		function() {
			return this._defaultIndex
		});
SuggestAutoCompleteResult.prototype.__defineGetter__("errorDescription",
		function() {
			return this._errorDescription
		});
SuggestAutoCompleteResult.prototype.__defineGetter__("matchCount", function() {
			return this.results.length
		});
function MRSuggest(searchBox) 
{
	this.debugZone = "suggest";
	this.searchBox_ = searchBox;
	this.prefs_ = new G_Preferences(MRSputnikPrefBase);
	this.searchBox_.setAttribute("disableautocomplete", false)
}
MRSuggest.prototype.getSearchOverlay_ = function() 
{
	return this.searchBox_.mSearchBox
};
MRSuggest.prototype.onInput = function(txtBox) {
    if (txtBox.value) {
		popup = this.searchBox_.toolbarObject.mSearchPopup;
    }
    else {
    }
};
MRSuggest.prototype.onTextReverted = function() 
{
};
MRSuggest.prototype.onTextEntered = function(forceNewTab, mouseButton) {
    var suggestService = Cc[MRSearchSuggest.prototype.contractID].getService().wrappedJSObject;
    var popup = this.searchBox_.toolbarObject.mSearchPopup;
    var suggestResult = null;
    if (popup && popup.lastSelectedIndex != -1) {
        suggestResult = suggestService.getResult(popup.lastSelectedIndex);
        popup.lastSelectedIndex = -1
    }
    if (!suggestResult)
        return;
    if (!this.prefs_.getPref("search_box_search_on_select", true))
        return;
    if (mouseButton & 1)
        forceNewTab = true;
    suggestResult.uri ?
		this.getSearchOverlay_().loadHistory(suggestResult, forceNewTab) :
		this.getSearchOverlay_().doSearch(null, forceNewTab);
};

function MRSearchProvider(uriSearch) {
    this.debugZone = "MRSearchProvider";
    this.sHost = "";
    this.sQueryParam = "";
    this.sQuery = "";
    this.sEncoding = "";
    this.sUtf8 = "utf8";
    this.sWin1251 = "windows-1251";
    this.args = {};
    this.Init(uriSearch)
}

MRSearchProvider.prototype.Init = function(uriSearch) {
    G_Debug(this, "MRSearchProvider.prototype.Init");
    if (!uriSearch) {
        return;
    }
    this.args = this.parseSearchURL(uriSearch.path, false);
    this.sHost = uriSearch.host;
    if (this.sHost.search(/rambler\.ru/) != -1) {
        this.sEncoding = this.sUtf8;
        if (this.args["query"] && this.args["query"].length > 0) {
            this.sQueryParam = "query";
        }
        else if (this.args["words"] && this.args["words"].length > 0) {
            this.sQueryParam = "words";
        }
    }
    else if (this.sHost.search(/yandex\.ru/) != -1) {
        this.sEncoding = this.sUtf8;
        this.sQueryParam = "text";
    }
    else if (this.sHost.search(/aport\.ru/) != -1) {
        this.sEncoding = this.sWin1251;
        this.sQueryParam = "r";
    }
    else if (this.sHost.search(/gogo\.ru/) != -1) {
        if (this.args["utf8in"] == "1") {
            this.sEncoding = this.sUtf8;
        }
        else {
            this.sEncoding = this.sWin1251;
        }
        this.sQueryParam = "q";
    }
    else if (this.sHost.search(/go\.mail\.ru/) != -1) {
        this.sEncoding = this.sUtf8;
        //			if(this.args["utf8in"] == "1")
        //			{
        //				this.sEncoding = this.sUtf8;
        //			}
        //			else
        //			{
        //				this.sEncoding = this.sWin1251;
        //			}
        this.sQueryParam = "q";
    }
    else if (
		this.sHost.search(/\.google\./) != -1
		&& uriSearch.path != "/url"
	) {
        this.sEncoding = this.sUtf8;
        this.sQueryParam = "q";
    }
    
    this.InitQuery();
};

MRSearchProvider.prototype.InitQuery = function() {
    var bConverted = false;
    var converter = Components.classes['@mozilla.org/intl/texttosuburi;1'].createInstance(Components.interfaces.nsITextToSubURI);
    try {
        this.sQuery = converter.UnEscapeAndConvert(
			this.sEncoding,
			this.args[this.sQueryParam]
		);
        bConverted = true;
    }
    catch (e) {

    }
    if (!bConverted && this.sEncoding == this.sUtf8) {
        try {
            this.sQuery = converter.UnEscapeAndConvert(
				this.sWin1251,
				this.args[this.sQueryParam]
			);
            bConverted = true;
        }
        catch (e) {

        }

    }
}

MRSearchProvider.prototype.parseSearchURL = function(query, opt_toLowerCase) {
    var args = {};
    if (!query) {
        return args;
    }
    var nParamsStart = query.indexOf("?")+1;
    var pairs = query.substr(nParamsStart).split("&");
    for (var p = 0; p < pairs.length; ++p) {
        var value = pairs[p];
        var tokens = value ? value.split("=") : null;
        if (tokens) {
            var key = decodeURIComponent(tokens.shift().replace(/[+]/g, " "));
            if (opt_toLowerCase) {
                key = key.toLowerCase();
            }
            args[key] = tokens.join("=").replace(/[+]/g, " ");
        }
    }
    return args
}


//=====================================================================================
var modScope = this;
var MRSputnikInstance = null;
var MRGeckoVersionRef = new MRGeckoVersion;
var searchService = new MRSearchService;
var historyService = new MRSearchHistory;
